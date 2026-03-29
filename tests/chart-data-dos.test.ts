import { describe, it, expect, beforeEach } from "bun:test";
import app from "../src/index";
import { resetMemoryCache } from "../src/services/api";

describe("GET /chart-data Validation Bypass", () => {
  beforeEach(() => {
    resetMemoryCache();
    // Mock global fetch for exchange rates
    global.fetch = async () => new Response(JSON.stringify({ rates: { USD: 1, EUR: 0.9 } }));
  });

  it("should reject multiple parameters summing to > 500 characters", async () => {
    // Create an array of 200 parameters, each 3 characters long "USA"
    const params = Array(200).fill("selected=USA").join("&");
    const res = await app.request(`/chart-data?${params}`);

    // Total length is 600 characters
    expect([400, 413, 414]).toContain(res.status);
  });

  it("should reject multiple parameters with > 50 items", async () => {
    const params = Array(60).fill("selected=USA").join("&");
    const res = await app.request(`/chart-data?${params}`);

    expect(res.status).toBe(400);
  });
});
