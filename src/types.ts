export type Env = {
  EZ_WORLD_INFO_KV: KVNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
};

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
