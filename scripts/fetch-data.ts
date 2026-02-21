import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const RESTCOUNTRIES_URL =
  "https://restcountries.com/v3.1/all?fields=cca3,name,languages,currencies,area,population,gini,flags,independent,unMember";
const WORLDBANK_URL =
  "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&per_page=20000&mrv=1";

const WORLDBANK_INDICATORS: Record<string, string> = {
  gdpTotal: "NY.GDP.MKTP.CD",
  gini: "SI.POV.GINI",
  internetUsers: "IT.NET.USER.ZS",
  urbanPopulation: "SP.URB.TOTL.IN.ZS"
};

// Wikidata SPARQL endpoint for official languages
const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";

const WIKIDATA_QUERY = `
SELECT ?iso3Code ?officialLanguageLabel WHERE {
  ?country wdt:P31 wd:Q6256.
  ?country wdt:P298 ?iso3Code.
  OPTIONAL { ?country wdt:P37 ?officialLanguage. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`;


// Mapping of territory codes to their governing countries
const TERRITORY_MAPPING: Record<string, string> = {
  // UK Territories
  "GGY": "United Kingdom",
  "JEY": "United Kingdom",
  "IMN": "United Kingdom",
  "FLK": "United Kingdom",
  "GIB": "United Kingdom",
  "BMU": "United Kingdom",
  "CYM": "United Kingdom",
  "KYM": "United Kingdom",
  "TCA": "United Kingdom",
  "VGB": "United Kingdom",
  "AIA": "United Kingdom",
  "MSR": "United Kingdom",
  "PCN": "United Kingdom",
  "SHN": "United Kingdom",
  "SGS": "United Kingdom",
  
  // Danish Territories
  "GRL": "Denmark",
  "FRO": "Denmark",
  "AXA": "Denmark",
  
  // Netherlands Territories
  "ABW": "Netherlands",
  "CUW": "Netherlands",
  "SXM": "Netherlands",
  "BES": "Netherlands",
  
  // French Territories
  "MYT": "France",
  "REU": "France",
  "GUF": "France",
  "GLP": "France",
  "MTQ": "France",
  "BLM": "France",
  "MAF": "France",
  "SPM": "France",
  "PYF": "France",
  "WLF": "France",
  "NCL": "France",
  "ATF": "France",
  
  // US Territories
  "VIR": "United States",
  "PRI": "United States",
  "GUM": "United States",
  "ASM": "United States",
  "MNP": "United States",
  "UMI": "United States",
  
  // Freely Associated States (Compact of Free Association with US)
  "FSM": "United States",
  "MHL": "United States",
  "PLW": "United States",
  
  // Chinese Territories
  "HKG": "China",
  "MAC": "China",
  "TWN": "China",
  
  // Australian Territories
  "HMD": "Australia",
  "CXR": "Australia",
  "CCK": "Australia",
  "NFK": "Australia",
  
  // New Zealand Territories
  "COK": "New Zealand",
  "NIU": "New Zealand",
  "TKL": "New Zealand",
  
  // Norwegian Territories
  "SJM": "Norway",
  "BVT": "Norway",
  
  // Finnish Territory (Åland Islands)
  "ALA": "Finland",
  
  // Disputed/Contested Territories
  "ESH": "Morocco",      // Western Sahara
  "PSE": "Palestine"     // Palestine
};

async function fetchData() {
  console.log("📍 Fetching data during build...");

  try {
    const userAgent = "EZ-World-Info/1.0 (+https://ezinner.com)";
    const indicatorEntries = Object.entries(WORLDBANK_INDICATORS);
    const indicatorRequests = indicatorEntries.map(([, code]) =>
      fetch(
        `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=20000&mrv=1`
      )
    );

    const [countriesRes, gdpRes, wikidataRes, ...indicatorRes] = await Promise.all([
      fetch(RESTCOUNTRIES_URL),
      fetch(WORLDBANK_URL),
      fetch(WIKIDATA_SPARQL_URL, {
        method: "POST",
        headers: {
          "User-Agent": userAgent,
          "Accept": "application/sparql-results+json",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `query=${encodeURIComponent(WIKIDATA_QUERY)}`
      }),
      ...indicatorRequests
    ]);

    const indicatorOk = indicatorRes.every((res) => res.ok);
    if (!countriesRes.ok || !gdpRes.ok || !wikidataRes.ok || !indicatorOk) {
      console.error("❌ Upstream fetch failures:");
      if (!countriesRes.ok) {
        console.error(`- RestCountries: ${countriesRes.status} ${countriesRes.statusText}`);
      }
      if (!gdpRes.ok) {
        console.error(`- WorldBank GDP per Capita: ${gdpRes.status} ${gdpRes.statusText}`);
      }
      if (!wikidataRes.ok) {
        console.error(`- Wikidata SPARQL: ${wikidataRes.status} ${wikidataRes.statusText}`);
      }
      indicatorRes.forEach((res, index) => {
        if (!res.ok) {
          const indicatorKey = indicatorEntries[index][0];
          const indicatorCode = indicatorEntries[index][1];
          console.error(`- WorldBank ${indicatorKey} (${indicatorCode}): ${res.status} ${res.statusText}`);
        }
      });
      throw new Error("Failed to fetch upstream data");
    }

    const countriesData = await countriesRes.json();
    const gdpData = await gdpRes.json();
    const wikidataData = await wikidataRes.json();
    const indicatorPayloads = await Promise.all(indicatorRes.map((res) => res.json()));

    // Process Wikidata results into a map by ISO3 code
    const wikidataMap: Record<string, { officialLanguage?: string }> = {};
    
    if (wikidataData.results?.bindings) {
      wikidataData.results.bindings.forEach((binding: any) => {
        const iso3 = binding.iso3Code?.value?.toUpperCase();
        if (iso3) {
          if (!wikidataMap[iso3]) {
            wikidataMap[iso3] = {};
          }
          if (binding.officialLanguageLabel?.value) {
            wikidataMap[iso3].officialLanguage = binding.officialLanguageLabel.value;
          }
        }
      });
    }

    const indicatorMap: Record<string, {
      gdpTotal?: number;
      gini?: number;
      internetUsers?: number;
      urbanPopulation?: number;
    }> = {};

    const parsedIndicators = indicatorPayloads.map(parseWorldBankIndicator);
    parsedIndicators.forEach((indicatorData, index) => {
      const indicatorKey = indicatorEntries[index][0] as keyof typeof WORLDBANK_INDICATORS;
      Object.entries(indicatorData).forEach(([iso3, entry]) => {
        if (!indicatorMap[iso3]) {
          indicatorMap[iso3] = {};
        }
        indicatorMap[iso3][indicatorKey] = entry.value;
      });
    });

    // Ensure public directory exists
    mkdirSync(join(import.meta.dir, "../public"), { recursive: true });

    // Write static JSON files
    const publicDir = join(import.meta.dir, "../public");
    writeFileSync(
      join(publicDir, "countries.json"),
      JSON.stringify(countriesData, null, 2)
    );
    writeFileSync(
      join(publicDir, "gdp.json"),
      JSON.stringify(gdpData, null, 2)
    );
    writeFileSync(
      join(publicDir, "territories.json"),
      JSON.stringify(TERRITORY_MAPPING, null, 2)
    );
    writeFileSync(
      join(publicDir, "wikidata.json"),
      JSON.stringify(wikidataMap, null, 2)
    );
    writeFileSync(
      join(publicDir, "indicators.json"),
      JSON.stringify(indicatorMap, null, 2)
    );

    console.log("✅ Data fetched and saved to public/");
    console.log("   - public/countries.json");
    console.log("   - public/gdp.json");
    console.log("   - public/territories.json");
    console.log("   - public/wikidata.json");
    console.log("   - public/indicators.json");
  } catch (error) {
    console.error("❌ Failed to fetch data (continuing with existing data):", error);
    // Don't fail the build if data fetch fails - use existing/dummy data
  }
}

fetchData();

function parseWorldBankIndicator(raw: any): Record<string, { value: number; year: string }> {
  const parsed = raw as [unknown, Array<{
    countryiso3code?: string;
    value?: number;
    date?: string;
  }>];
  const entries = Array.isArray(parsed) && Array.isArray(parsed[1]) ? parsed[1] : [];
  const map: Record<string, { value: number; year: string }> = {};

  entries.forEach((item) => {
    const iso3 = item?.countryiso3code?.toUpperCase() ?? "";
    if (!/^[A-Z]{3}$/.test(iso3)) {
      return;
    }

    if (item.value === null || item.value === undefined) {
      return;
    }

    if (!map[iso3]) {
      map[iso3] = {
        value: item.value,
        year: item.date ?? ""
      };
    }
  });

  return map;
}
