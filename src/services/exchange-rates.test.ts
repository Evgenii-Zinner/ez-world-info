import { describe, expect, test, spyOn, mock, setSystemTime, afterAll, beforeEach, afterEach } from "bun:test";
import { fetchExchangeRates, resetMemoryCache } from "./api";
import type { Env } from "../types";

// Helper to create mock env
const createMockEnv = (kvData?: Record<string, any>) => ({
  EZ_WORLD_INFO_KV: {
    get: mock(async () => kvData ? JSON.stringify(kvData) : null),
    put: mock(async () => {}),
  },
} as unknown as Env);

describe("Exchange Rates Service", () => {
  const originalFetch = global.fetch;
  const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
  const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    // Reset fetch mock for each test
    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({ rates: { USD: 1, EUR: 0.85 } }))));
    // Set a consistent start time
    setSystemTime(new Date("2024-01-01T00:00:00Z"));
    // Reset global cache
    resetMemoryCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    setSystemTime(); // Restore system time
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("should return cached rates from KV if available", async () => {
    const cachedRates = { USD: 1, GBP: 0.75 };
    const env = createMockEnv(cachedRates);

    // Ensure fetch mock is NOT called
    const fetchMock = mock(() => Promise.reject("Should not fetch"));
    global.fetch = fetchMock;

    const rates = await fetchExchangeRates(env);

    expect(rates).toEqual(cachedRates);
    expect(env.EZ_WORLD_INFO_KV.get).toHaveBeenCalledWith("exchange_rates");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("should fetch from API and save to KV on cache miss", async () => {
    const env = createMockEnv(null); // Cache miss
    const apiRates = { USD: 1, JPY: 110 };

    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({ rates: apiRates }))));

    const rates = await fetchExchangeRates(env);

    expect(rates).toEqual(apiRates);
    expect(env.EZ_WORLD_INFO_KV.get).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith("https://api.exchangerate-api.com/v4/latest/USD");
    expect(env.EZ_WORLD_INFO_KV.put).toHaveBeenCalledWith(
      "exchange_rates",
      JSON.stringify(apiRates),
      { expirationTtl: 86400 }
    );
  });

  test("should return empty object on fetch failure (and no memory cache fallback available)", async () => {
    // This test ensures that if memory cache is empty, we return empty object on error
    const env = createMockEnv(null);
    global.fetch = mock(() => Promise.reject("Network Error"));

    const rates = await fetchExchangeRates(env);

    expect(rates).toEqual({});
  });

  test("should use memory cache for local dev (no env provided)", async () => {
    const apiRates = { USD: 1, CAD: 1.25 };
    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({ rates: apiRates }))));

    // 1. Initial Call - should fetch
    const rates1 = await fetchExchangeRates(undefined);
    expect(rates1).toEqual(apiRates);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // 2. Second Call - should use memory cache
    // Reset fetch mock to ensure it's not called
    global.fetch = mock(() => Promise.reject("Should not fetch"));

    const rates2 = await fetchExchangeRates(undefined);
    expect(rates2).toEqual(apiRates);

    // 3. Third Call - after expiry - should fetch again
    // Advance time by 24h + 1s
    setSystemTime(new Date("2024-01-02T00:00:01Z")); // 1 day later

    const newRates = { USD: 1, CAD: 1.30 };
    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({ rates: newRates }))));

    const rates3 = await fetchExchangeRates(undefined);
    expect(rates3).toEqual(newRates);
    expect(global.fetch).toHaveBeenCalled();
  });

  test("should fallback to memory cache on fetch error (if available)", async () => {
    // 1. Populate memory cache first
    const cachedRates = { USD: 1, AUD: 1.4 };
    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({ rates: cachedRates }))));
    await fetchExchangeRates(undefined);

    // 2. Simulate fetch error
    global.fetch = mock(() => Promise.reject("API Down"));

    // We can test with or without env. Let's test with env to ensure fallback works across environments
    const env = createMockEnv(null);
    const rates = await fetchExchangeRates(env);

    expect(rates).toEqual(cachedRates);
  });
});
