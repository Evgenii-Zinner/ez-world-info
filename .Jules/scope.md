# Scope's Journal

## 2026-10-24 - **Learning:** Global Mutable State in API Service

**Action:** Detected `memoryCache` in `src/services/api.ts` as a module-level singleton. This state persists across tests, making tests order-dependent and potentially flaky. Future tests involving `fetchExchangeRates` must use `setSystemTime` to manipulate `Date.now()` to force cache expiry or invalidation, rather than relying on a fresh state.

## 2026-10-24 - **Learning:** Component Testing Approach for Hono String Components

**Action:** Hono components are functional components returning string/HTML fragments (`html\`` tags). When unit testing them, tests need to assert on `.toString()` outputs with substring matching (`toContain`) or regex instead of standard Testing Library queries, since these are purely string-based templates and not DOM nodes.
## 2024-04-07 - **Learning:** Playwright Tests vs Bun Test Runner\n\n**Action:** `bun test` by default will attempt to run `e2e/**/*.spec.ts` files, resulting in unhandled test errors since Playwright tests use a different runner. To resolve this, exclude the `e2e` directory in `bunfig.toml` via `[test]` configuration.\n\n## 2024-04-07 - **Learning:** Hono String Components Testing\n\n**Action:** Hono components return string/HTML fragments (`html\`` tags). When unit testing them, tests need to assert on `.toString()` outputs with substring matching (`toContain`) or regex instead of standard Testing Library queries.
