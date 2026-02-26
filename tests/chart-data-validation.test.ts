import { describe, it, expect, beforeEach } from "bun:test";
import app from "../src/index";
import { resetMemoryCache } from "../src/services/api";

describe("GET /chart-data Validation", () => {
  beforeEach(() => {
    resetMemoryCache();
    // Mock global fetch for exchange rates
    global.fetch = async () => new Response(JSON.stringify({ rates: { USD: 1, EUR: 0.9 } }));
  });

  it("should return data for valid request", async () => {
    const res = await app.request("/chart-data?selected=USA,FRA");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(2);
  });

  it("should reject excessively long query string (DoS prevention)", async () => {
    // Generate a long string of valid-looking codes
    const longParam = Array(200).fill("USA").join(",");
    const res = await app.request(`/chart-data?selected=${longParam}`);

    // Ideally this should fail with 413 or 400, but currently it returns 200
    // We expect this to fail AFTER our fix
    // For now, let's verify current behavior is 200 (vulnerable)
    // Or just write the test expecting the fix, and watch it fail.
    // Expect 414 (URI Too Long) or 400 (Bad Request)
    expect([400, 413, 414]).toContain(res.status);
  });

  it("should reject invalid country codes", async () => {
    const res = await app.request("/chart-data?selected=INVALID_CODE");
    expect(res.status).toBe(400);
  });

  it("should reject too many selected countries", async () => {
     const manyCodes = Array(51).fill("USA").join(",");
     const res = await app.request(`/chart-data?selected=${manyCodes}`);
     expect(res.status).toBe(400);
  });
});
