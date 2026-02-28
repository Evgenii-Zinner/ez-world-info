import { describe, expect, test, mock } from "bun:test";
import { parseCountries, parseGdpData, buildRows, getCountryRows } from "./api";
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
  });
});
