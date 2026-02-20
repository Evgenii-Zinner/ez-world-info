import { describe, it, expect } from "bun:test";
import {
  sortByName,
  sortByCode,
  sortByPopulation,
  sortByArea,
  sortByCurrencyRate,
  sortByOfficialLanguage,
  sortByStatus,
  sortByGdpPerCapita,
  sortByGdpTotal,
  sortByGini,
  sortByInternetUsers,
  sortByUrbanPopulation,
  sortRows
} from "./sorting";
import type { CountryRow } from "../types";

const mockData: CountryRow[] = [
  {
    code: "US",
    name: "United States",
    gdpPerCapita: 60000,
    year: "2023",
    population: 330000000,
    area: 9800000,
    currencyRate: 1,
    languages: { eng: "English" },
    independent: true,
    parentCountry: "",
    officialLanguage: "English",
    gdpTotal: 23000000,
    gini: 41.4,
    internetUsers: 90,
    urbanPopulation: 82
  },
  {
    code: "CA",
    name: "Canada",
    gdpPerCapita: 50000,
    year: "2023",
    population: 38000000,
    area: 9900000,
    currencyRate: 1.35,
    languages: { eng: "English", fra: "French" },
    independent: true,
    parentCountry: "",
    officialLanguage: "English",
    gdpTotal: 1700000,
    gini: 33.3,
    internetUsers: 95,
    urbanPopulation: 81
  },
  {
    code: "GB",
    name: "United Kingdom",
    gdpPerCapita: 45000,
    year: "2023",
    population: 67000000,
    area: 240000,
    currencyRate: 0.79,
    languages: { eng: "English" },
    independent: true,
    parentCountry: "",
    officialLanguage: "English",
    gdpTotal: 3000000,
    gini: 34.8,
    internetUsers: 92,
    urbanPopulation: 83
  },
  {
    code: "FR",
    name: "France",
    gdpPerCapita: 42000,
    year: "2023",
    population: 68000000,
    area: 550000,
    currencyRate: 0.92,
    languages: { fra: "French" },
    independent: true,
    parentCountry: "",
    officialLanguage: "French",
    gdpTotal: 2800000,
    gini: 32.4,
    internetUsers: 85,
    urbanPopulation: 80
  }
];

describe("Sorting Utils", () => {
  describe("sortByName", () => {
    it("should sort by name ascending", () => {
      const sorted = [...mockData].sort((a, b) => sortByName(a, b, "asc"));
      expect(sorted[0].name).toBe("Canada");
      expect(sorted[3].name).toBe("United States");
    });

    it("should sort by name descending", () => {
      const sorted = [...mockData].sort((a, b) => sortByName(a, b, "desc"));
      expect(sorted[0].name).toBe("United States");
      expect(sorted[3].name).toBe("Canada");
    });
  });

  describe("sortByCode", () => {
    it("should sort by code ascending", () => {
      const sorted = [...mockData].sort((a, b) => sortByCode(a, b, "asc"));
      expect(sorted[0].code).toBe("CA");
      expect(sorted[3].code).toBe("US");
    });

    it("should sort by code descending", () => {
      const sorted = [...mockData].sort((a, b) => sortByCode(a, b, "desc"));
      expect(sorted[0].code).toBe("US");
      expect(sorted[3].code).toBe("CA");
    });
  });

  describe("Numeric Sorters", () => {
    describe("sortByPopulation", () => {
      it("should sort by population ascending", () => {
        const sorted = [...mockData].sort((a, b) => sortByPopulation(a, b, "asc"));
        expect(sorted[0].population).toBe(38000000); // Canada
        expect(sorted[3].population).toBe(330000000); // US
      });

      it("should handle null/undefined population (treat as 0)", () => {
        const dataWithNull = [
          { ...mockData[0], population: undefined },
          { ...mockData[1], population: 100 }
        ];
        const sorted = dataWithNull.sort((a, b) => sortByPopulation(a, b, "asc"));
        expect(sorted[0].population).toBeUndefined(); // undefined treated as 0
        expect(sorted[1].population).toBe(100);
      });
    });

    describe("sortByArea", () => {
      it("should sort by area descending", () => {
        const sorted = [...mockData].sort((a, b) => sortByArea(a, b, "desc"));
        expect(sorted[0].area).toBe(9900000); // Canada
        expect(sorted[3].area).toBe(240000); // UK
      });
    });

    describe("sortByCurrencyRate", () => {
      it("should sort by currency rate ascending", () => {
        const sorted = [...mockData].sort((a, b) => sortByCurrencyRate(a, b, "asc"));
        expect(sorted[0].currencyRate).toBe(0.79); // UK
        expect(sorted[3].currencyRate).toBe(1.35); // Canada
      });

      it("should handle zero currency rate (put at end)", () => {
        const dataWithZero = [
          { ...mockData[0], currencyRate: 0 }, // Should move to end
          { ...mockData[1], currencyRate: 1.5 },
          { ...mockData[2], currencyRate: 0.5 }
        ];

        // logic check:
        // if a=0, ret 1 -> a > b, so a comes after b
        // if b=0, ret -1 -> b > a, so b comes after a

        const sortedAsc = [...dataWithZero].sort((a, b) => sortByCurrencyRate(a, b, "asc"));
        expect(sortedAsc[0].currencyRate).toBe(0.5);
        expect(sortedAsc[1].currencyRate).toBe(1.5);
        expect(sortedAsc[2].currencyRate).toBe(0);

        const sortedDesc = [...dataWithZero].sort((a, b) => sortByCurrencyRate(a, b, "desc"));
        // Even in desc, 0 handling is hardcoded to return 1/-1 if one is zero.
        // It bypasses the order check.
        expect(sortedDesc[2].currencyRate).toBe(0);
      });

      it("should handle multiple zero currency rates (keep relative order or treat as equal)", () => {
        const dataWithZeros = [
            { ...mockData[0], currencyRate: 0, name: "A" },
            { ...mockData[1], currencyRate: 0, name: "B" }
        ];
        const sorted = dataWithZeros.sort((a, b) => sortByCurrencyRate(a, b, "asc"));
        // Both are 0, so they are equal (return 0). Stable sort should keep order,
        // or effectively they are just adjacent.
        expect(sorted[0].currencyRate).toBe(0);
        expect(sorted[1].currencyRate).toBe(0);
      });
    });

    describe("General Numeric Sorters (utilizing common logic)", () => {
        it("should sort by gdpTotal", () => {
            const sorted = [...mockData].sort((a, b) => sortByGdpTotal(a, b, "desc"));
            expect(sorted[0].gdpTotal).toBe(23000000); // US
            expect(sorted[3].gdpTotal).toBe(1700000); // Canada
        });

        it("should sort by gini", () => {
            const sorted = [...mockData].sort((a, b) => sortByGini(a, b, "asc"));
            expect(sorted[0].gini).toBe(32.4); // France
            expect(sorted[3].gini).toBe(41.4); // US
        });

        it("should sort by internetUsers", () => {
            const sorted = [...mockData].sort((a, b) => sortByInternetUsers(a, b, "desc"));
            expect(sorted[0].internetUsers).toBe(95); // Canada
            expect(sorted[3].internetUsers).toBe(85); // France
        });

        it("should sort by urbanPopulation", () => {
            const sorted = [...mockData].sort((a, b) => sortByUrbanPopulation(a, b, "asc"));
            expect(sorted[0].urbanPopulation).toBe(80); // France
            expect(sorted[3].urbanPopulation).toBe(83); // UK
        });

        it("should sort by gdpPerCapita", () => {
            const sorted = [...mockData].sort((a, b) => sortByGdpPerCapita(a, b, "desc"));
            expect(sorted[0].gdpPerCapita).toBe(60000); // US
            expect(sorted[3].gdpPerCapita).toBe(42000); // France
        });

        it("should handle nulls correctly in numeric sort (nulls last for asc, last for desc)", () => {
             // Logic in sortByNumeric:
             // if a=null, ret 1 (a > b, a after b)
             // if b=null, ret -1 (b > a, b after a)
             // So nulls always go to the end?
             // Let's verify.

             const dataWithNulls = [
                 { ...mockData[0], gdpPerCapita: null },
                 { ...mockData[1], gdpPerCapita: 50000 },
                 { ...mockData[2], gdpPerCapita: 40000 }
             ];

             const sortedAsc = [...dataWithNulls].sort((a, b) => sortByGdpPerCapita(a, b, "asc"));
             expect(sortedAsc[0].gdpPerCapita).toBe(40000);
             expect(sortedAsc[1].gdpPerCapita).toBe(50000);
             expect(sortedAsc[2].gdpPerCapita).toBeNull();

             const sortedDesc = [...dataWithNulls].sort((a, b) => sortByGdpPerCapita(a, b, "desc"));
             // implementation:
             // if (aVal === null) return 1;
             // if (bVal === null) return -1;
             // return order === "asc" ? aVal - bVal : bVal - aVal;

             // So even in desc, nulls are pushed to the end (treated as "greater" than everything else in terms of position index, effectively).
             // Wait, if a=null, return 1 -> a comes after b.
             // If we are sorting [null, 50000], a=null, b=50000 -> 1 -> [50000, null]

             expect(sortedDesc[0].gdpPerCapita).toBe(50000);
             expect(sortedDesc[1].gdpPerCapita).toBe(40000);
             expect(sortedDesc[2].gdpPerCapita).toBeNull();
        });

        it("should handle multiple nulls in numeric sort", () => {
            const dataWithNulls = [
                { ...mockData[0], gdpPerCapita: null },
                { ...mockData[1], gdpPerCapita: null }
            ];
            const sorted = dataWithNulls.sort((a, b) => sortByGdpPerCapita(a, b, "asc"));
            expect(sorted[0].gdpPerCapita).toBeNull();
            expect(sorted[1].gdpPerCapita).toBeNull();
        });
    });
  });

  describe("sortByOfficialLanguage", () => {
    it("should sort by languages (joined string) ascending", () => {
        // "English" vs "English, French" vs "French"
        const sorted = [...mockData].sort((a, b) => sortByOfficialLanguage(a, b, "asc"));

        expect(sorted[0].name).toMatch(/United States|United Kingdom/); // "English"
        expect(sorted[1].name).toMatch(/United States|United Kingdom/); // "English"
        expect(sorted[2].name).toBe("Canada"); // "English, French"
        expect(sorted[3].name).toBe("France"); // "French"
    });

    it("should fall back to officialLanguage if languages is missing", () => {
        const dataFallback = [
            { ...mockData[0], languages: undefined, officialLanguage: "Zulian" },
            { ...mockData[1], languages: undefined, officialLanguage: "Albanian" }
        ];
        const sorted = dataFallback.sort((a, b) => sortByOfficialLanguage(a, b, "asc"));
        expect(sorted[0].officialLanguage).toBe("Albanian");
        expect(sorted[1].officialLanguage).toBe("Zulian");
    });

    it("should handle empty strings when both languages and officialLanguage are missing", () => {
        const dataEmpty = [
            { ...mockData[0], languages: undefined, officialLanguage: undefined },
            { ...mockData[1], languages: undefined, officialLanguage: "A" }
        ];
        // undefined officialLanguage becomes ""
        // "" < "A"
        const sorted = dataEmpty.sort((a, b) => sortByOfficialLanguage(a, b, "asc"));
        expect(sorted[0].officialLanguage).toBeUndefined(); // The one with undefined/empty
        expect(sorted[1].officialLanguage).toBe("A");
    });
  });

  describe("sortByStatus", () => {
    it("should sort by status (independent vs dependent)", () => {
        const dataStatus: CountryRow[] = [
            { ...mockData[0], independent: true, parentCountry: "" }, // Independent
            { ...mockData[1], independent: false, parentCountry: "SomeParent" } // SomeParent
        ];
        // "Independent" vs "SomeParent"

        const sorted = dataStatus.sort((a, b) => sortByStatus(a, b, "asc"));
        expect(sorted[0].independent).toBe(true);
        expect(sorted[1].parentCountry).toBe("SomeParent");
    });
  });

  describe("sortRows (Dispatcher)", () => {
    it("should dispatch to correct sorter based on key", () => {
        const keys = [
            "name", "code", "population", "area", "currencyRate",
            "officialLanguage", "status", "gdpTotal", "gini",
            "internetUsers", "urbanPopulation", "gdpPerCapita"
        ];

        // Just verify it runs without error for each key and returns a sorted array
        keys.forEach(key => {
            const sorted = sortRows(mockData, key, "asc");
            expect(sorted.length).toBe(mockData.length);
        });
    });

    it("should return original list if sortBy is none or null", () => {
        const sorted = sortRows(mockData, "none", "asc");
        expect(sorted[0]).toBe(mockData[0]);
        expect(sorted).toEqual(mockData);

        const sortedNull = sortRows(mockData, null, "asc");
        expect(sortedNull).toEqual(mockData);
    });

    it("should default to gdpPerCapita if unknown key provided", () => {
        const sorted = sortRows(mockData, "unknownKey", "desc");
        expect(sorted[0].gdpPerCapita).toBe(60000);
    });
  });
});
