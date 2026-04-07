import { describe, it, expect, spyOn, mock } from "bun:test";
import app from "../src/index";
import * as api from "../src/services/api";

describe("Index Routes", () => {
  it("GET / should render table by default", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("<table");
    expect(text).toContain("World Info Dashboard");
  });

  it("GET /?tab=chart should render chart view", async () => {
    const res = await app.request("/?tab=chart");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("chart-container");
    expect(text).toContain("World Info Dashboard");
  });

  it("GET /chart should render chart view directly", async () => {
    const res = await app.request("/chart");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Data Visualization");
    expect(text).toContain("chart-container");
  });

  it("GET /exchange-rates should return exchange rates as JSON", async () => {
    const mockRows = [
      { code: "USA", currencyRate: 1 },
      { code: "EUR", currencyRate: 0.85 },
      { code: "JPN", currencyRate: null }
    ] as any;
    const spy = spyOn(api, "getCountryRows").mockResolvedValue(mockRows);

    const res = await app.request("/exchange-rates");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      USA: 1,
      EUR: 0.85,
      JPN: null
    });

    spy.mockRestore();
  });

  it("GET /api/countriesData should return full country rows", async () => {
    const mockRows = [{ code: "USA", name: "United States" }] as any;
    const spy = spyOn(api, "getCountryRows").mockResolvedValue(mockRows);

    const res = await app.request("/api/countriesData");
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
    const json = await res.json();
    expect(json).toEqual(mockRows);

    spy.mockRestore();
  });

  describe("GET /chart-data", () => {
    it("should return top 50 by GDP per capita if no selection", async () => {
      const mockRows = Array.from({ length: 60 }, (_, i) => ({
        code: `C${i}`,
        gdpPerCapita: i
      })) as any;
      const spy = spyOn(api, "getCountryRows").mockResolvedValue(mockRows);

      const res = await app.request("/chart-data");
      expect(res.status).toBe(200);
      const json = await res.json() as any[];
      expect(json.length).toBe(50);
      // It should sort descending, so the first one should be C59 (gdpPerCapita: 59)
      expect(json[0].gdpPerCapita).toBe(59);

      spy.mockRestore();
    });

    it("should filter correctly when valid selected codes are provided", async () => {
      const mockRows = [
        { code: "USA", gdpPerCapita: 60000 },
        { code: "CAN", gdpPerCapita: 50000 },
        { code: "MEX", gdpPerCapita: 10000 }
      ] as any;
      const spy = spyOn(api, "getCountryRows").mockResolvedValue(mockRows);

      const res = await app.request("/chart-data?selected=USA,CAN");
      expect(res.status).toBe(200);
      const json = await res.json() as any[];
      expect(json.length).toBe(2);
      expect(json.map(r => r.code)).toEqual(["USA", "CAN"]);

      spy.mockRestore();
    });
  });

  describe("Fallback / 404 Route", () => {
    it("should return 404 from ASSETS if available", async () => {
      const mockFetch = mock(async () => new Response("Asset found", { status: 200 }));
      const env = { ASSETS: { fetch: mockFetch } };

      const res = await app.request("/some-asset.js", {}, env);
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Asset found");
      expect(mockFetch).toHaveBeenCalled();
    });

    it("should return 404 if ASSETS is not available", async () => {
      const res = await app.request("/does-not-exist");
      expect(res.status).toBe(404);
      expect(await res.text()).toBe("Not Found");
    });
  });
});
