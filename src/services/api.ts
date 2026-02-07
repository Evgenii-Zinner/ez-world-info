import type { Env, CountryEntry, GdpEntry, CountryRow } from "../types";
import countriesData from "../../public/countries.json";
import gdpData from "../../public/gdp.json";
import territoriesMapping from "../../public/territories.json";
import wikidataMapping from "../../public/wikidata.json";
import indicatorsData from "../../public/indicators.json";

type IndicatorEntry = {
  gdpTotal?: number;
  gini?: number;
  internetUsers?: number;
  urbanPopulation?: number;
};

const indicatorsMap = indicatorsData as Record<string, IndicatorEntry>;

// Exchange rates API - free, no key required
const EXCHANGE_RATE_URL = "https://api.exchangerate-api.com/v4/latest/USD";
const CACHE_KEY = "exchange_rates";
const CACHE_TTL = 86400; // 24 hours in seconds

// Simple in-memory cache for local development
let memoryCache: { data: Record<string, number> | null; timestamp: number } = {
  data: null,
  timestamp: 0
};

// Countries/territories to exclude from the dataset
const EXCLUDED_CODES = new Set(["ATA", "IOT"]); // Antarctica, British Indian Ocean Territory

// Fetch exchange rates at runtime with KV caching (or memory cache for local dev)
export async function fetchExchangeRates(env?: Env): Promise<Record<string, number>> {
  try {
    // Try to get from KV cache if available
    if (env?.EZ_WORLD_INFO_KV) {
      const cached = await env.EZ_WORLD_INFO_KV.get(CACHE_KEY);
      if (cached) {
        console.log("✓ Using KV cached exchange rates");
        return JSON.parse(cached);
      }
    } else {
      // Fallback to memory cache for local development
      const now = Date.now();
      if (memoryCache.data && (now - memoryCache.timestamp) < (CACHE_TTL * 1000)) {
        console.log("✓ Using memory cached exchange rates (local dev)");
        return memoryCache.data;
      }
    }

    // Fetch fresh data
    console.log("→ Fetching fresh exchange rates from API...");
    const response = await fetch(EXCHANGE_RATE_URL);
    const data = await response.json() as { rates: Record<string, number> };
    const rates = data.rates;
    console.log("✓ Fetched fresh exchange rates");

    // Cache the result
    if (env?.EZ_WORLD_INFO_KV) {
      await env.EZ_WORLD_INFO_KV.put(CACHE_KEY, JSON.stringify(rates), {
        expirationTtl: CACHE_TTL
      });
      console.log("✓ Saved to KV cache");
    } else {
      // Save to memory cache for local development
      memoryCache = { data: rates, timestamp: Date.now() };
      console.log("✓ Saved to memory cache (local dev)");
    }

    return rates;
  } catch (error) {
    console.error("✗ Failed to fetch exchange rates:", error);
    // Return cached data if available, even if expired
    if (memoryCache.data) {
      console.log("⚠ Using stale memory cache due to fetch error");
      return memoryCache.data;
    }
    return {};
  }
}

// Data is static, embedded as assets
export async function loadCountriesData(): Promise<string> {
  return JSON.stringify(countriesData);
}

export async function loadGdpData(): Promise<string> {
  return JSON.stringify(gdpData);
}

export function parseCountries(raw: string): CountryEntry[] {
  const parsed = JSON.parse(raw) as Array<{
    cca3?: string;
    name?: { common?: string };
  }>;

  return parsed
    .filter((country) => country.cca3 && country.name?.common && !EXCLUDED_CODES.has(country.cca3))
    .map((country) => ({
      code: country.cca3 as string,
      name: country.name?.common as string
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function parseGdpData(
  raw: string,
  allowedCodes?: Set<string>
): Map<string, GdpEntry> {
  const parsed = JSON.parse(raw) as [
    unknown,
    Array<{
      country?: { id?: string; value?: string };
      countryiso3code?: string;
      value?: number;
      date?: string;
    }>
  ];
  const entries =
    Array.isArray(parsed) && Array.isArray(parsed[1]) ? parsed[1] : [];
  const map = new Map<string, GdpEntry>();

  for (const item of entries) {
    const iso3 = item?.countryiso3code?.toUpperCase() ?? "";
    if (!/^[A-Z]{3}$/.test(iso3)) {
      continue;
    }

    if (item.value === null || item.value === undefined) {
      continue;
    }

    if (allowedCodes && !allowedCodes.has(iso3)) {
      continue;
    }

    if (!map.has(iso3)) {
      map.set(iso3, {
        value: item.value,
        year: item.date ?? ""
      });
    }
  }

  return map;
}

export function buildRows(
  countries: CountryEntry[],
  gdpMap: Map<string, GdpEntry>,
  countriesRaw?: string,
  exchangeRates?: Record<string, number>
): CountryRow[] {
  // Parse full country data if provided
  let countryDetailsMap = new Map<string, any>();
  if (countriesRaw) {
    try {
      const parsed = JSON.parse(countriesRaw) as Array<{
        cca3?: string;
        languages?: Record<string, string>;
        currencies?: Record<string, { name: string; symbol: string }>;
        area?: number;
        population?: number;
        gini?: Record<string, number>;
        flags?: { svg?: string };
        independent?: boolean;
        unMember?: boolean;
      }>;
      parsed.forEach((country) => {
        if (country.cca3) {
          countryDetailsMap.set(country.cca3, country);
        }
      });
    } catch {
      // If parsing fails, continue without extra details
    }
  }

  const rows = countries.map((country) => {
    const gdp = gdpMap.get(country.code);
    const details = countryDetailsMap.get(country.code);
    const indicators = indicatorsMap[country.code] ?? {};

    // Get exchange rate for first currency
    let currencyRate: number | undefined;
    if (exchangeRates && details?.currencies) {
      const firstCurrency = Object.keys(details.currencies)[0];
      if (firstCurrency && exchangeRates[firstCurrency]) {
        currencyRate = exchangeRates[firstCurrency];
      }
    }

    // Extract latest Gini value if available
    let giniValue: number | undefined;
    if (details?.gini && typeof details.gini === "object") {
      const giniEntries = Object.entries(details.gini).sort((a, b) => {
        return parseInt(b[0]) - parseInt(a[0]); // Sort by year descending
      });
      if (giniEntries.length > 0) {
        giniValue = giniEntries[0][1] as number;
      }
    }

    const giniIndicator = indicators.gini ?? giniValue;

    return {
      code: country.code,
      name: country.name,
      gdpPerCapita: gdp?.value ?? null,
      year: gdp?.year ?? null,
      languages: details?.languages,
      currencies: details?.currencies,
      currencyRate: currencyRate,
      area: details?.area,
      population: details?.population,
      gdpTotal: indicators.gdpTotal,
      gini: giniIndicator,
      internetUsers: indicators.internetUsers,
      urbanPopulation: indicators.urbanPopulation,
      flagSvg: details?.flags?.svg,
      independent: details?.independent,
      unMember: details?.unMember,
      parentCountry: details?.independent === false 
        ? (territoriesMapping as Record<string, string>)[country.code]
        : undefined,
      officialLanguage: (wikidataMapping as Record<string, any>)[country.code]?.officialLanguage
    };
  });

  rows.sort((a, b) => {
    if (a.gdpPerCapita === null && b.gdpPerCapita === null) {
      return a.name.localeCompare(b.name);
    }

    if (a.gdpPerCapita === null) {
      return 1;
    }

    if (b.gdpPerCapita === null) {
      return -1;
    }

    if (b.gdpPerCapita !== a.gdpPerCapita) {
      return b.gdpPerCapita - a.gdpPerCapita;
    }

    return a.name.localeCompare(b.name);
  });

  return rows;
}

// sortRows is now imported from utils/sorting.ts
// Export it for backwards compatibility
export { sortRows } from "../utils/sorting";

