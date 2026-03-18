import { describe, expect, test, mock } from "bun:test";
import { parseCountries, parseGdpData, buildRows, getCountryRows, fetchExchangeRates, resetMemoryCache } from "./api";
import type { RawCountry, RawGdpData, CountryEntry, GdpEntry } from "../types";

describe("API Service", () => {
  describe("getCountryRows", () => {
    test("should return processed country rows", async () => {
      // Mock fetch to avoid real network call
      global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({ rates: { USD: 1 } }))));

      // This test relies on the real data loaded in memory (since we ran fetch-data)
      const rows = await getCountryRows();

      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveProperty("code");
      expect(rows[0]).toHaveProperty("name");
      expect(rows[0]).toHaveProperty("gdpPerCapita");
    });
  });

  describe("resetMemoryCache", () => {
    test("should clear the memory cache", async () => {
      const originalFetch = global.fetch;
      try {
        const mockRates = { EUR: 0.9 };
        const updatedRates = { EUR: 0.95 };

        const fetchMock = mock(() => Promise.resolve(new Response(JSON.stringify({ rates: mockRates }))));
        global.fetch = fetchMock;

        // Reset any existing cache state from previous tests
        resetMemoryCache();

        // First call - should fetch
        const result1 = await fetchExchangeRates();
        expect(result1).toEqual(mockRates);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        // Second call - should use cache
        fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ rates: updatedRates }))));
        const result2 = await fetchExchangeRates();
        expect(result2).toEqual(mockRates); // Still old rates from cache
        expect(fetchMock).toHaveBeenCalledTimes(1); // No new fetch

        // Reset cache
        resetMemoryCache();

        // Third call - should fetch again
        const result3 = await fetchExchangeRates();
        expect(result3).toEqual(updatedRates); // New rates
        expect(fetchMock).toHaveBeenCalledTimes(2); // New fetch
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe("parseCountries", () => {
    test("should parse valid countries and sort by name", () => {
      const input: RawCountry[] = [
        { cca3: "ZWE", name: { common: "Zimbabwe" } },
        { cca3: "AFG", name: { common: "Afghanistan" } },
        { cca3: "ATA", name: { common: "Antarctica" } }, // Should be excluded
      ];

      const result = parseCountries(input);

      expect(result).toEqual([
        { code: "AFG", name: "Afghanistan" },
        { code: "ZWE", name: "Zimbabwe" },
      ]);
    });

    test("should handle missing cca3 or name", () => {
        const input: RawCountry[] = [
            { cca3: "USA", name: { common: "United States" } },
            { cca3: undefined, name: { common: "NoCode" } },
            { cca3: "NON", name: undefined },
        ];
        const result = parseCountries(input);
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe("USA");
    });

    test("should return empty array for empty input", () => {
        const result = parseCountries([]);
        expect(result).toEqual([]);
    });

    test("should filter out all excluded codes", () => {
        const input: RawCountry[] = [
            { cca3: "ATA", name: { common: "Antarctica" } },
            { cca3: "IOT", name: { common: "British Indian Ocean Territory" } },
        ];
        const result = parseCountries(input);
        expect(result).toEqual([]);
    });

    test("should handle empty strings for cca3 and name.common", () => {
        const input: RawCountry[] = [
            { cca3: "", name: { common: "Valid Name" } },
            { cca3: "USA", name: { common: "" } },
        ];
        const result = parseCountries(input);
        // Current implementation treats empty strings as truthy, so they are not filtered out.
        // Based on: country.cca3 && country.name?.common
        // Empty string is falsy in JS.
        expect(result).toEqual([]);
    });

    test("should handle partial name objects", () => {
        const input: RawCountry[] = [
            { cca3: "CAN", name: {} },
            { cca3: "MEX", name: { common: undefined } },
        ];
        const result = parseCountries(input);
        expect(result).toEqual([]);
    });
  });

  describe("parseGdpData", () => {
      test("should parse valid GDP data", () => {
          const rawData: RawGdpData = [
              {},
              [
                  { countryiso3code: "USA", value: 70000, date: "2022" },
                  { countryiso3code: "CHN", value: 12000, date: "2022" },
                  { countryiso3code: "INVALID", value: 100, date: "2022" }, // > 3 chars
              ]
          ];

          const map = parseGdpData(rawData);
          expect(map.size).toBe(2);
          expect(map.get("USA")).toEqual({ value: 70000, year: "2022" });
          expect(map.get("CHN")).toEqual({ value: 12000, year: "2022" });
      });

      test("should filter by allowed codes if provided", () => {
        const rawData: RawGdpData = [
            {},
            [
                { countryiso3code: "USA", value: 70000, date: "2022" },
                { countryiso3code: "CHN", value: 12000, date: "2022" },
            ]
        ];
        const allowed = new Set(["USA"]);
        const map = parseGdpData(rawData, allowed);

        expect(map.size).toBe(1);
        expect(map.has("USA")).toBe(true);
        expect(map.has("CHN")).toBe(false);
      });
  });

  describe("buildRows", () => {
      test("should combine country and GDP data", () => {
          const countries: CountryEntry[] = [
              { code: "USA", name: "United States" }
          ];
          const gdpMap = new Map<string, GdpEntry>();
          gdpMap.set("USA", { value: 70000, year: "2022" });

          const rows = buildRows(countries, gdpMap);

          expect(rows).toHaveLength(1);
          expect(rows[0].code).toBe("USA");
          expect(rows[0].name).toBe("United States");
          expect(rows[0].gdpPerCapita).toBe(70000);
          expect(rows[0].year).toBe("2022");
      });

       test("should handle missing GDP data", () => {
          const countries: CountryEntry[] = [
              { code: "USA", name: "United States" }
          ];
          const gdpMap = new Map<string, GdpEntry>();

          const rows = buildRows(countries, gdpMap);

          expect(rows).toHaveLength(1);
          expect(rows[0].gdpPerCapita).toBeNull();
      });

      test("should accept Map<string, RawCountry> for optimized lookup", () => {
        const countries: CountryEntry[] = [
            { code: "USA", name: "United States" }
        ];
        const gdpMap = new Map<string, GdpEntry>();
        gdpMap.set("USA", { value: 70000, year: "2022" });

        const rawCountryMap = new Map<string, RawCountry>();
        rawCountryMap.set("USA", {
          cca3: "USA",
          name: { common: "United States" },
          population: 330000000
        });

        const rows = buildRows(countries, gdpMap, rawCountryMap);

        expect(rows).toHaveLength(1);
        expect(rows[0].code).toBe("USA");
        expect(rows[0].population).toBe(330000000);
      });

      test("should accept RawCountry array for legacy test support", () => {
        const countries: CountryEntry[] = [
            { code: "USA", name: "United States" }
        ];
        const gdpMap = new Map<string, GdpEntry>();
        gdpMap.set("USA", { value: 70000, year: "2022" });

        const rawCountriesArray: RawCountry[] = [
          {
            cca3: "USA",
            name: { common: "United States" },
            population: 330000000
          }
        ];

        const rows = buildRows(countries, gdpMap, rawCountriesArray);

        expect(rows).toHaveLength(1);
        expect(rows[0].code).toBe("USA");
        expect(rows[0].population).toBe(330000000);
      });

      test("should map correct exchange rate based on first currency", () => {
        const countries: CountryEntry[] = [
            { code: "USA", name: "United States" }
        ];
        const gdpMap = new Map<string, GdpEntry>();

        const rawCountryMap = new Map<string, RawCountry>();
        rawCountryMap.set("USA", {
          cca3: "USA",
          name: { common: "United States" },
          currencies: {
            "USD": { name: "United States dollar", symbol: "$" }
          }
        });

        const exchangeRates = {
          "EUR": 0.9,
          "USD": 1.0,
          "CAD": 1.3
        };

        const rows = buildRows(countries, gdpMap, rawCountryMap, exchangeRates);

        expect(rows).toHaveLength(1);
        expect(rows[0].currencyRate).toBe(1.0);
      });

      test("should extract the latest Gini index value", () => {
        const countries: CountryEntry[] = [
            { code: "USA", name: "United States" }
        ];
        const gdpMap = new Map<string, GdpEntry>();

        const rawCountryMap = new Map<string, RawCountry>();
        rawCountryMap.set("USA", {
          cca3: "USA",
          name: { common: "United States" },
          gini: {
            "2018": 41.4,
            "2020": 39.8,
            "2019": 41.5
          }
        });

        const rows = buildRows(countries, gdpMap, rawCountryMap);

        expect(rows).toHaveLength(1);
        expect(rows[0].gini).toBe(39.8);
      });

      test("should sort rows correctly by GDP descending, then name ascending", () => {
        const countries: CountryEntry[] = [
            { code: "ZMB", name: "Zambia" },
            { code: "USA", name: "United States" },
            { code: "AFG", name: "Afghanistan" },
            { code: "CAN", name: "Canada" },
            { code: "AUS", name: "Australia" },
        ];

        const gdpMap = new Map<string, GdpEntry>();
        gdpMap.set("USA", { value: 70000, year: "2022" });
        gdpMap.set("CAN", { value: 50000, year: "2022" });
        gdpMap.set("AUS", { value: 50000, year: "2022" });
        // ZMB and AFG will have null GDP

        const rawCountryMap = new Map<string, RawCountry>();
        const rows = buildRows(countries, gdpMap, rawCountryMap);

        expect(rows).toHaveLength(5);
        expect(rows.map(r => r.code)).toEqual([
          "USA", // highest GDP
          "AUS", // tied GDP, A before C
          "CAN", // tied GDP
          "AFG", // null GDP, A before Z
          "ZMB"  // null GDP
        ]);
      });
  });
});
