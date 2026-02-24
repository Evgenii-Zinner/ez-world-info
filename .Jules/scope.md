# Scope's Journal

## 2026-10-24 - **Learning:** Global Mutable State in API Service

**Action:** Detected `memoryCache` in `src/services/api.ts` as a module-level singleton. This state persists across tests, making tests order-dependent and potentially flaky. Future tests involving `fetchExchangeRates` must use `setSystemTime` to manipulate `Date.now()` to force cache expiry or invalidation, rather than relying on a fresh state.
