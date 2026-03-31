# Scope's Journal

## 2026-10-24 - **Learning:** Global Mutable State in API Service

**Action:** Detected `memoryCache` in `src/services/api.ts` as a module-level singleton. This state persists across tests, making tests order-dependent and potentially flaky. Future tests involving `fetchExchangeRates` must use `setSystemTime` to manipulate `Date.now()` to force cache expiry or invalidation, rather than relying on a fresh state.

## 2026-10-24 - **Learning:** Component Testing Approach for Hono String Components

**Action:** Hono components are functional components returning string/HTML fragments (`html\`` tags). When unit testing them, tests need to assert on `.toString()` outputs with substring matching (`toContain`) or regex instead of standard Testing Library queries, since these are purely string-based templates and not DOM nodes.
## 2025-02-23 - **Learning:** When testing time-dependent logic or module-level cache eviction thresholds in `bun:test` (such as the rate limiter in `src/middleware/rate-limit.ts`), use `setSystemTime` to deterministically mock time and generate unique `CF-Connecting-IP` headers to artificially inflate internal Map sizes without relying on slow `setTimeout` calls.
**Action:** Implemented cache eviction tests using `setSystemTime` and loops simulating over 10,000 requests.
