import { CountryRow } from "../types";

/**
 * Generates a CSV string from country rows.
 * Note: This utility is primarily used for testing the CSV generation logic.
 * The actual implementation used in the UI is inlined in src/components/CountriesTable.ts
 * due to the client-side nature of Alpine.js components in this architecture.
 *
 * Any changes to logic here should be mirrored in CountriesTable.ts.
 */
export function generateCSV(rows: CountryRow[]): string {
  const headers = [
    'Country',
    'Code',
    'Population',
    'Area (km²)',
    'Currency Rate (USD)',
    'Official Language',
    'GDP per Capita',
    'GDP Total',
    'Gini',
    'Internet Users %',
    'Urban Pop %',
    'Status'
  ];

  const escape = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const getLanguage = (row: CountryRow): string => {
    if (row.languages && Object.keys(row.languages).length > 0) {
      return Object.values(row.languages).slice(0, 2).join(', ');
    }
    return row.officialLanguage || '';
  };

  const getStatus = (row: CountryRow): string => {
    return row.parentCountry || (row.independent ? 'Independent' : 'Dependent');
  };

  const csvRows = rows.map(row => {
    return [
      escape(row.name),
      escape(row.code),
      escape(row.population),
      escape(row.area),
      escape(row.currencyRate),
      escape(getLanguage(row)),
      escape(row.gdpPerCapita),
      escape(row.gdpTotal),
      escape(row.gini),
      escape(row.internetUsers),
      escape(row.urbanPopulation),
      escape(getStatus(row))
    ].join(',');
  });

  return [headers.join(','), ...csvRows].join('\n');
}
