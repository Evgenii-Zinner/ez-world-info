import type { CountryRow } from "../types";

type SortOrder = "asc" | "desc";

/**
 * Sorting utilities for CountryRow data
 */

export const sortByName = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  return order === "asc"
    ? a.name.localeCompare(b.name)
    : b.name.localeCompare(a.name);
};

export const sortByCode = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  return order === "asc"
    ? a.code.localeCompare(b.code)
    : b.code.localeCompare(a.code);
};

export const sortByPopulation = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  const aVal = a.population ?? 0;
  const bVal = b.population ?? 0;
  return order === "asc" ? aVal - bVal : bVal - aVal;
};

export const sortByArea = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  const aVal = a.area ?? 0;
  const bVal = b.area ?? 0;
  return order === "asc" ? aVal - bVal : bVal - aVal;
};

export const sortByCurrencyRate = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  const aVal = a.currencyRate ?? 0;
  const bVal = b.currencyRate ?? 0;
  
  // Handle nulls - put them at the end
  if (aVal === 0 && bVal === 0) return 0;
  if (aVal === 0) return 1;
  if (bVal === 0) return -1;
  
  return order === "asc" ? aVal - bVal : bVal - aVal;
};

export const sortByOfficialLanguage = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  // Use same logic as display: prefer languages from RestCountries over wikidata officialLanguage
  const aVal = a.languages
    ? Object.values(a.languages).slice(0, 2).join(", ")
    : a.officialLanguage || "";
  const bVal = b.languages
    ? Object.values(b.languages).slice(0, 2).join(", ")
    : b.officialLanguage || "";
  return order === "asc"
    ? aVal.localeCompare(bVal)
    : bVal.localeCompare(aVal);
};

const sortByNumeric = (
  aVal: number | null | undefined,
  bVal: number | null | undefined,
  order: SortOrder
): number => {
  if (aVal === null || aVal === undefined) {
    return bVal === null || bVal === undefined ? 0 : 1;
  }
  if (bVal === null || bVal === undefined) {
    return -1;
  }
  return order === "asc" ? aVal - bVal : bVal - aVal;
};

export const sortByStatus = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  const aVal = a.parentCountry || (a.independent ? "Independent" : "");
  const bVal = b.parentCountry || (b.independent ? "Independent" : "");
  return order === "asc"
    ? aVal.localeCompare(bVal)
    : bVal.localeCompare(aVal);
};

export const sortByGdpPerCapita = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  return sortByNumeric(a.gdpPerCapita, b.gdpPerCapita, order);
};

export const sortByGdpTotal = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  return sortByNumeric(a.gdpTotal, b.gdpTotal, order);
};

export const sortByGini = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  return sortByNumeric(a.gini, b.gini, order);
};

export const sortByInternetUsers = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  return sortByNumeric(a.internetUsers, b.internetUsers, order);
};

export const sortByUrbanPopulation = (a: CountryRow, b: CountryRow, order: SortOrder): number => {
  return sortByNumeric(a.urbanPopulation, b.urbanPopulation, order);
};


/**
 * Main sorting dispatcher
 */
export const sortRows = (
  rows: CountryRow[],
  sortBy: string | null = null,
  order: SortOrder = "desc"
): CountryRow[] => {
  // If sortBy is "none" or null, return rows as-is
  if (sortBy === "none" || sortBy === null) {
    return rows;
  }

  const sorted = [...rows];

  sorted.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return sortByName(a, b, order);
      case "code":
        return sortByCode(a, b, order);
      case "population":
        return sortByPopulation(a, b, order);
      case "area":
        return sortByArea(a, b, order);
      case "currencyRate":
        return sortByCurrencyRate(a, b, order);
      case "officialLanguage":
        return sortByOfficialLanguage(a, b, order);
      case "status":
        return sortByStatus(a, b, order);
      case "gdpTotal":
        return sortByGdpTotal(a, b, order);
      case "gini":
        return sortByGini(a, b, order);
      case "internetUsers":
        return sortByInternetUsers(a, b, order);
      case "urbanPopulation":
        return sortByUrbanPopulation(a, b, order);
      case "gdpPerCapita":
      default:
        return sortByGdpPerCapita(a, b, order);
    }
  });

  return sorted;
};
