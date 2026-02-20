import { describe, it, expect } from "bun:test";
import { generateCSV } from "./csv";
import { CountryRow } from "../types";

describe("CSV Generation", () => {
  it("should generate headers correctly", () => {
    const csv = generateCSV([]);
    const headers = csv.split('\n')[0];
    expect(headers).toBe("Country,Code,Population,Area (km²),Currency Rate (USD),Official Language,GDP per Capita,GDP Total,Gini,Internet Users %,Urban Pop %,Status");
  });

  it("should handle basic row data", () => {
    const rows: CountryRow[] = [{
      name: "Testland",
      code: "TST",
      population: 1000,
      area: 500,
      currencyRate: 1.5,
      officialLanguage: "Testish",
      gdpPerCapita: 50000,
      gdpTotal: 50000000,
      gini: 30.5,
      internetUsers: 90,
      urbanPopulation: 80,
      independent: true,
      unMember: true,
      year: "2023"
    }];

    const csv = generateCSV(rows);
    const lines = csv.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[1]).toBe("Testland,TST,1000,500,1.5,Testish,50000,50000000,30.5,90,80,Independent");
  });

  it("should escape special characters", () => {
    const rows: CountryRow[] = [{
      name: 'Land, of "Quotes"',
      code: "LOQ",
      population: 0,
      area: 0,
      currencyRate: 0,
      officialLanguage: "Normal",
      gdpPerCapita: 0,
      gdpTotal: 0,
      gini: 0,
      internetUsers: 0,
      urbanPopulation: 0,
      independent: true,
      year: "2023"
    }];

    const csv = generateCSV(rows);
    const line = csv.split('\n')[1];
    // "Land, of ""Quotes""" should be the result
    expect(line).toInclude('"Land, of ""Quotes"""');
  });

  it("should handle null/undefined values as empty strings", () => {
    const rows: CountryRow[] = [{
      name: "NullLand",
      code: "NLL",
      population: undefined,
      area: undefined,
      currencyRate: undefined,
      officialLanguage: undefined,
      gdpPerCapita: null,
      gdpTotal: undefined,
      gini: undefined,
      internetUsers: undefined,
      urbanPopulation: undefined,
      independent: true,
      year: null
    }];

    const csv = generateCSV(rows);
    const line = csv.split('\n')[1];
    expect(line).toBe("NullLand,NLL,,,,,,,,,,Independent");
  });

  it("should prioritize languages object over officialLanguage string", () => {
    const rows: CountryRow[] = [{
      name: "LangLand",
      code: "LGL",
      languages: { eng: "English", fra: "French", spa: "Spanish" },
      officialLanguage: "OldLang",
      gdpPerCapita: null,
      year: null
    }];

    const csv = generateCSV(rows);
    const line = csv.split('\n')[1];
    // Should join first two languages
    expect(line).toInclude('"English, French"');
    expect(line).not.toInclude("OldLang");
  });

  it("should determine status correctly", () => {
    const rows: CountryRow[] = [
      { name: "A", code: "A", parentCountry: "Empire", gdpPerCapita: null, year: null },
      { name: "B", code: "B", independent: true, gdpPerCapita: null, year: null },
      { name: "C", code: "C", independent: false, gdpPerCapita: null, year: null }
    ];

    const csv = generateCSV(rows);
    const lines = csv.split('\n');
    expect(lines[1]).toInclude("Empire"); // Parent country takes precedence
    expect(lines[2]).toInclude("Independent");
    expect(lines[3]).toInclude("Dependent");
  });
});
