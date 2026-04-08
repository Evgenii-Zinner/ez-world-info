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

/**
 * Represents a single data point from the World Bank API.
 * The World Bank API returns indicators (like GDP) across multiple years.
 */
export type RawGdpItem = {
  country?: { id?: string; value?: string };
  /** The 3-letter ISO code (e.g., "USA") */
  countryiso3code?: string;
  /** The actual indicator value (e.g., GDP amount) */
  value?: number;
  /** The year the data point corresponds to (e.g., "2022") */
  date?: string;
};

/**
 * The peculiar tuple structure returned by the World Bank API.
 *
 * @example
 * [
 *   { page: 1, pages: 1, per_page: 20000, total: 266 }, // Index 0: Pagination Metadata
 *   [ { countryiso3code: "USA", value: 76329, date: "2022" }, ... ] // Index 1: The actual data array
 * ]
 */
export type RawGdpData = [
  unknown,
  Array<RawGdpItem>
];

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
