export type Env = {
  EZ_WORLD_INFO_KV: KVNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
};

export type RawCountry = {
  cca3?: string;
  name?: { common?: string };
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol: string }>;
  area?: number;
  population?: number;
  gini?: Record<string, number>;
  flags?: { svg?: string };
  independent?: boolean;
  unMember?: boolean;
};

export type RawGdpItem = {
  country?: { id?: string; value?: string };
  countryiso3code?: string;
  value?: number;
  date?: string;
};

/**
 * Represents the raw response structure from the World Bank API.
 *
 * Note: The World Bank API uses a highly unconventional response format where
 * the root object is an array containing exactly two elements:
 * 1. Pagination/Metadata object (ignored in our implementation)
 * 2. An array of actual data items
 *
 * @example
 * // Typical response looks like:
 * [
 *   { "page": 1, "pages": 1, "per_page": 20000, "total": 266 },
 *   [ { "countryiso3code": "AFE", "value": 1636, ... }, ... ]
 * ]
 */
export type RawGdpData = [unknown, Array<RawGdpItem>];

export type CountryEntry = {
  code: string;
  name: string;
};

export type GdpEntry = {
  value: number;
  year: string;
};

export type CountryRow = {
  code: string;
  name: string;
  gdpPerCapita: number | null;
  year: string | null;
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol: string }>;
  currencyRate?: number;
  area?: number;
  population?: number;
  gdpTotal?: number;
  gini?: number;
  internetUsers?: number;
  urbanPopulation?: number;
  flagSvg?: string;
  independent?: boolean;
  unMember?: boolean;
  parentCountry?: string;
  officialLanguage?: string;
};
