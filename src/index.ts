import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { html, raw } from "hono/html";
import type { Env } from "./types";
import { Layout } from "./utils/layout";
import { Header } from "./components/Header";
import { renderTable } from "./components/CountriesTable";
import { ChartView } from "./components/ChartView";
import { escapeHtml } from "./utils/helpers";
import { getCountryRows } from "./services/api";
import { rateLimit } from "./middleware/rate-limit";

const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
  console.error(`[Error] ${c.req.method} ${c.req.url}:`, err);
  return c.text("Internal Server Error", 500);
});

app.use(
  "*",
  secureHeaders({
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
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
      connectSrc: ["'self'"]
    },
    permissionsPolicy: {
      accelerometer: [],
      camera: [],
      geolocation: [],
      gyroscope: [],
      magnetometer: [],
      microphone: [],
      payment: [],
      usb: []
    }
  })
);

// Rate limit sensitive endpoints to prevent abuse
app.use("/api/*", rateLimit({ max: 100, windowMs: 60 * 1000 }));
app.use("/exchange-rates", rateLimit({ max: 50, windowMs: 60 * 1000 }));
app.use("/chart-data", rateLimit({ max: 100, windowMs: 60 * 1000 }));

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

  const rows = await getCountryRows(c.env);

  return c.json(rows);
});

app.get("/countries-table", async (c) => {
  // This route might be deprecated or used for HTMX fallback, keeping it functional for now
  const rows = await getCountryRows(c.env);

  return c.html(renderTable({ rows }));
});

app.get("/exchange-rates", async (c) => {
  const rows = await getCountryRows(c.env);

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

  // Validate input length to prevent DoS (memory exhaustion)
  if (selectedParam && selectedParam.length > 500) {
    return c.text("Request URI too long", 414);
  }

  const selectedCountries = selectedParam
    ? selectedParam.split(",").map((s) => s.trim())
    : [];

  // Limit number of selected countries
  if (selectedCountries.length > 50) {
    return c.text("Too many countries selected (max 50)", 400);
  }

  // Validate format of country codes
  for (const code of selectedCountries) {
    if (!/^[A-Za-z]{3}$/.test(code)) {
      return c.text("Invalid country code format", 400);
    }
  }

  const rows = await getCountryRows(c.env);

  // Filter by selected countries if provided
  let chartRows = rows;
  if (selectedCountries.length > 0) {
    const selectedSet = new Set(selectedCountries.map(s => s.toUpperCase()));
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

app.all("*", async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  // Clone response to allow header modification by secureHeaders middleware
  const newRes = new Response(res.body, res);
  return newRes;
});

export default app;
