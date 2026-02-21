import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { html, raw } from "hono/html";
import type { Env } from "./types";
import { Layout } from "./utils/layout";
import { Header } from "./components/Header";
import { renderTable } from "./components/CountriesTable";
import { ChartView } from "./components/ChartView";
import { escapeHtml } from "./utils/helpers";
import {
  loadCountriesData,
  loadGdpData,
  parseCountries,
  parseGdpData,
  buildRows,
  sortRows,
  fetchExchangeRates
} from "./services/api";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  secureHeaders({
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https:"]
    },
  })
);

app.get("/", async (c) => {
  const tab = c.req.query("tab") || "table";
  const activeTab = tab === "chart" ? "chart" : "table";

  let contentView;
  if (activeTab === "chart") {
    contentView = html`<div id="content-root">${ChartView()}</div>`;
  } else {
    // Render table immediately with cached exchange rates
    // Render table shell immediately (data fetched client-side)
    const tableHtml = renderTable({ rows: [] });

    contentView = html`<div id="content-root">
      ${raw(tableHtml)}
    </div>`;
  }

  return c.html(
    Layout({
      title: "World Info",
      children: html`<div class="container">
        ${Header({ title: "World Info Dashboard" })}
        ${contentView}
        <div class="status" id="status"></div>
      </div>`
    })
  );
});

app.get("/api/countriesData", async (c) => {
  // Cache for 1 hour
  c.header('Cache-Control', 'public, max-age=3600');

  const [countriesRaw, gdpRaw, exchangeRates] = await Promise.all([
    loadCountriesData(),
    loadGdpData(),
    fetchExchangeRates(c.env)
  ]);

  const countries = parseCountries(countriesRaw);
  const countryCodeSet = new Set(countries.map((country) => country.code));
  const gdpMap = parseGdpData(gdpRaw, countryCodeSet);
  const rows = buildRows(countries, gdpMap, countriesRaw, exchangeRates);

  return c.json(rows);
});

app.get("/countries-table", async (c) => {
  // This route might be deprecated or used for HTMX fallback, keeping it functional for now
  const [countriesRaw, gdpRaw, exchangeRates] = await Promise.all([
    loadCountriesData(),
    loadGdpData(),
    fetchExchangeRates(c.env)
  ]);

  const countries = parseCountries(countriesRaw);
  const countryCodeSet = new Set(countries.map((country) => country.code));
  const gdpMap = parseGdpData(gdpRaw, countryCodeSet);
  const rows = buildRows(countries, gdpMap, countriesRaw, exchangeRates);

  return c.html(renderTable({ rows }));
});

app.get("/exchange-rates", async (c) => {
  const exchangeRates = await fetchExchangeRates(c.env);
  const [countriesRaw, gdpRaw] = await Promise.all([
    loadCountriesData(),
    loadGdpData()
  ]);
  const countries = parseCountries(countriesRaw);
  const countryCodeSet = new Set(countries.map((country) => country.code));
  const gdpMap = parseGdpData(gdpRaw, countryCodeSet);
  const rows = buildRows(countries, gdpMap, countriesRaw, exchangeRates);

  // Return currency rates as JSON keyed by country code
  const rates: Record<string, number | null> = {};
  rows.forEach(row => {
    rates[row.code] = row.currencyRate ?? null;
  });

  return c.json(rates);
});





app.get("/chart", async (c) => {
  return c.html(
    Layout({
      title: "Country Comparison Charts",
      children: html`<div class="container">
        ${Header({ title: "Data Visualization" })}
        <div id="content-root">${ChartView()}</div>
      </div>`
    })
  );
});

app.get("/chart-data", async (c) => {
  const selectedParam = c.req.query("selected");
  const selectedCountries = selectedParam
    ? selectedParam.split(",").map((s) => s.trim())
    : [];

  const [countriesRaw, gdpRaw, exchangeRates] = await Promise.all([
    loadCountriesData(),
    loadGdpData(),
    fetchExchangeRates(c.env)
  ]);

  const countries = parseCountries(countriesRaw);
  const countryCodeSet = new Set(countries.map((country) => country.code));
  const gdpMap = parseGdpData(gdpRaw, countryCodeSet);
  const rows = buildRows(countries, gdpMap, countriesRaw, exchangeRates);

  // Filter by selected countries if provided
  let chartRows = rows;
  if (selectedCountries.length > 0) {
    const selectedSet = new Set(selectedCountries);
    chartRows = chartRows.filter((r) => selectedSet.has(r.code));
  } else {
    // Default: show top 50 by GDP per capita if no selection
    chartRows = chartRows
      .filter(r => r.gdpPerCapita !== null)
      .sort((a, b) => (b.gdpPerCapita || 0) - (a.gdpPerCapita || 0))
      .slice(0, 50);
  }

  // Return full rows so the client can switch metrics
  return c.json(chartRows);
});

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
