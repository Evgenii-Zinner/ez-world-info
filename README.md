# EZ World Info // 🌍 Global Data Dashboard
High-Performance Global Metrics & Tactical Visualization

<p dir="auto">
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
<a href="https://bun.sh" rel="nofollow"><img src="https://img.shields.io/badge/Runtime-Bun-black.svg" alt="Runtime: Bun"></a>
<a href="https://hono.dev" rel="nofollow"><img src="https://img.shields.io/badge/Framework-Hono-orange.svg" alt="Framework: Hono"></a>
<a href="https://world-info.ezinner.com" rel="nofollow"><img src="https://img.shields.io/badge/Deployment-Cloudflare-f38020.svg" alt="Deployment: Cloudflare"></a>
</p>

A high-performance **socioeconomic intelligence platform** for rapid global data visualization and territory analysis. Provisioned at the edge for sub-second responses worldwide.

## ⚡ Live Demo
Experience the data dashboard instantly at: **[https://world-info.ezinner.com](https://world-info.ezinner.com)**

> **Data Integrity:** All metrics are fetched and cached via Cloudflare KV for optimal speed and reliability.

## ✨ Visual HUD & Data Insights
The dashboard provides a tactical overview of 200+ territories with modern visualization stacks.

*   **Advanced Charts:** Integrated ECharts library featuring Rose (Polar), Treemaps, and Bubble charts.
*   **Tactical Tables:** Infinite sorting and filtering powered by Alpine.js reactive state.
*   **Adaptive Theme:** Cyberpunk-inspired HUD that automatically detects and adapts to your system theme.

## 🛠 What's inside?
*   **Edge Computing Stack:** Built on **Cloudflare Workers** and **Hono** for high-performance routing.
*   **Aggregated Intelligence:** 
    *   **World Bank API:** Current GDP per capita and socioeconomic trends.
    *   **REST Countries:** Precise territory metadata and flags.
    *   **Wikidata:** Rich political and social indicators via SPARQL.
*   **Client-Side Reactivity:**
    *   **Alpine.js:** Managed country selection, local persistence (`localStorage`), and reactive UI updates.

## 🏗️ Architecture Note: JSON Island Pattern
The project has shifted away from traditional Server-Side Rendered (SSR) HTML partials towards **Client-Side JSON Hydration**.
When the server responds (e.g. `CountriesTable`), it serializes initial, large datasets into a hidden `<script type="application/json">` block rather than building massive strings of HTML.
Alpine.js parses this embedded JSON on initialization to provide instant client-side interactivity, avoiding enormous HTML payloads over the wire.

## 🚀 Local Development
1. **Install Dependencies:**
   ```bash
   bun install
   ```
   *(Note: Development environments occasionally experience `bun install` timeouts exceeding 400s. Retrying or explicitly fetching missing packages like `hono` is required if tests fail on import.)*

2. **Start the Development Server:**
   ```bash
   bun run dev
   ```
   This command orchestrates three actions:
   - `fetch-data`: Queries REST Countries, World Bank API, and Wikidata to generate the static `.json` files in the `public/` directory.
   - `build:css`: Compiles the internal `styles.scss` source code into browser-ready CSS.
   - `wrangler dev`: Boots the local Cloudflare Worker simulator on `http://localhost:8787`.

3. **Run Tests:**
   ```bash
   bun run test
   ```
   This will auto-generate dummy local data (`test:setup`) and run the test suite using `bun:test`.

## 🖥 Environment
Perfect for personal intelligence tools or enterprise data dashboards.

*   **Runtime:** Node.js/Bun compatible (Bun recommended).
*   **Legacy:** Designed and maintained by **EZinner Solutions**.

## 📜 License
MIT License - Copyright (c) 2026 Evgenii Zinner
