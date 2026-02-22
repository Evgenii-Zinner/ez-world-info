# Sentinel's Journal

## 2025-02-23 - Rate Limiting in Serverless Environment
**Vulnerability:** Missing rate limiting on public API endpoints allows for potential DoS or abuse.
**Learning:** Implementing rate limiting in a serverless environment (Cloudflare Workers) is tricky because state is ephemeral and per-isolate. A true global rate limiter requires external storage (KV, Durable Objects). However, a per-isolate in-memory limiter provides a first line of defense against rapid-fire attacks from a single source hitting the same isolate.
**Prevention:** Always implement at least basic rate limiting on public APIs. For distributed systems, consider using a centralized store for rate limit counters if strict enforcement is required.
