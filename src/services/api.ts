import type { Env, CountryEntry, GdpEntry, CountryRow, RawCountry, RawGdpData } from "../types";
import countriesData from "../../public/countries.json";
import gdpData from "../../public/gdp.json";
import territoriesMapping from "../../public/territories.json";
import wikidataMapping from "../../public/wikidata.json";
import indicatorsData from "../../public/indicators.json";

/**
 * API Service
 *
 * Aggregates country data from multiple sources:
 * - Countries Metadata (REST Countries)
 * - GDP Data (World Bank)
 * - Exchange Rates (External API)
 * - Supplemental Indicators (Wikidata/Local)
 *
 * This module handles data fetching, caching strategies (KV/Memory),
 * and data merging to produce the final `CountryRow` structures used by the UI.
 */

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

export function resetMemoryCache() {
  memoryCache = { data: null, timestamp: 0 };
}

// Countries/territories to exclude from the dataset
// ATA: Antarctica (No permanent population/economy)
// IOT: British Indian Ocean Territory (Military base only)
const EXCLUDED_CODES = new Set(["ATA", "IOT"]);

/**
 * Fetches current USD exchange rates with a 3-layer caching strategy:
 * 1. Cloudflare KV (Production): Persistent, shared cache.
 * 2. In-Memory (Local/Fallback): Ephemeral cache for dev or KV failure.
 * 3. External API: Fetches fresh data if caches are empty/stale.
 *
 * @param env - The Cloudflare Worker environment (containing KV bindings)
 * @returns A map of currency codes to exchange rates (relative to USD)
 */
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
    // Return cached data if available, even if expired, to prevent UI breakage
    if (memoryCache.data) {
      console.log("⚠ Using stale memory cache due to fetch error");
      return memoryCache.data;
    }
    return {};
  }
}

// Data is static, embedded as assets
export async function loadCountriesData(): Promise<RawCountry[]> {
  return countriesData as unknown as RawCountry[];
}

export async function loadGdpData(): Promise<RawGdpData> {
  return gdpData as unknown as RawGdpData;
}

/**
 * Parses raw country data and filters out excluded territories.
 */
export function parseCountries(parsed: RawCountry[]): CountryEntry[] {
  return parsed
    .filter((country) => country.cca3 && country.name?.common && !EXCLUDED_CODES.has(country.cca3))
    .map((country) => ({
      code: country.cca3 as string,
      name: country.name?.common as string
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Parses GDP data from the World Bank API format.
 *
 * @param parsed - Raw JSON from World Bank API.
 *                 Format is `[metadata, data[]]`.
 * @param allowedCodes - Optional Set of ISO3 codes to keep.
 * @returns Map of ISO3 code -> GdpEntry
 */
export function parseGdpData(
  parsed: RawGdpData,
  allowedCodes?: Set<string>
): Map<string, GdpEntry> {
  // World Bank API returns an array where index 1 is the actual data list
  const entries =
    Array.isArray(parsed) && Array.isArray(parsed[1]) ? parsed[1] : [];
  const map = new Map<string, GdpEntry>();

  for (const item of entries) {
    const iso3 = item?.countryiso3code?.toUpperCase() ?? "";

    // Ensure strict 3-letter ISO code format to filter out aggregates like "WLD" (World)
    if (!/^[A-Z]{3}$/.test(iso3)) {
      continue;
    }

    if (item.value === null || item.value === undefined) {
      continue;
    }

    if (allowedCodes && !allowedCodes.has(iso3)) {
      continue;
    }

    // Only take the first entry encountered (assuming sorted by latest date by API)
    if (!map.has(iso3)) {
      map.set(iso3, {
        value: item.value,
        year: item.date ?? ""
      });
    }
  }

  return map;
}

/**
 * Merges all data sources into the final tabular format.
 *
 * Logic includes:
 * - Mapping exchange rates to the country's first listed currency.
 * - Sorting Gini index data by year to find the most recent value.
 * - Resolving parent countries for dependent territories.
 * - Sorting the final list by GDP per Capita (descending).
 */
export function buildRows(
  countries: CountryEntry[],
  gdpMap: Map<string, GdpEntry>,
  countriesRaw?: RawCountry[],
  exchangeRates?: Record<string, number>
): CountryRow[] {
  // Parse full country data if provided
  let countryDetailsMap = new Map<string, RawCountry>();
  if (countriesRaw) {
    countriesRaw.forEach((country) => {
      if (country.cca3) {
        countryDetailsMap.set(country.cca3, country);
      }
    });
  }

  const rows = countries.map((country) => {
    const gdp = gdpMap.get(country.code);
    const details = countryDetailsMap.get(country.code);
    const indicators = indicatorsMap[country.code] ?? {};

    // Get exchange rate for first currency
    let currencyRate: number | undefined;
    if (exchangeRates && details?.currencies) {
      // We arbitrary pick the first currency code to find a rate
      const firstCurrency = Object.keys(details.currencies)[0];
      if (firstCurrency && exchangeRates[firstCurrency]) {
        currencyRate = exchangeRates[firstCurrency];
      }
    }

    // Extract latest Gini value if available
    let giniValue: number | undefined;
    if (details?.gini && typeof details.gini === "object") {
      // Gini data is a dictionary of "year": value
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

  // Default Sort: GDP Per Capita (Descending), then Name (Ascending)
  rows.sort((a, b) => {
    if (a.gdpPerCapita === null && b.gdpPerCapita === null) {
      return a.name.localeCompare(b.name);
    }

    if (a.gdpPerCapita === null) {
      return 1; // Nulls last
    }

    if (b.gdpPerCapita === null) {
      return -1; // Nulls last
    }

    if (b.gdpPerCapita !== a.gdpPerCapita) {
      return b.gdpPerCapita - a.gdpPerCapita;
    }

    return a.name.localeCompare(b.name);
  });

  return rows;
}

/**
 * Main Data Pipeline Entry Point
 *
 * Orchestrates the fetching and merging of all data sources.
 * @param env - Worker environment bindings
 * @returns Fully populated country rows for the frontend.
 */
export async function getCountryRows(env?: Env): Promise<CountryRow[]> {
  const [countriesRaw, gdpRaw, exchangeRates] = await Promise.all([
    loadCountriesData(),
    loadGdpData(),
    fetchExchangeRates(env)
  ]);

  const countries = parseCountries(countriesRaw);
  const countryCodeSet = new Set(countries.map((country) => country.code));
  const gdpMap = parseGdpData(gdpRaw, countryCodeSet);

  return buildRows(countries, gdpMap, countriesRaw, exchangeRates);
}
