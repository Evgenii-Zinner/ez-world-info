import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { rateLimit } from "../src/middleware/rate-limit";

describe("Rate Limit Middleware", () => {
  it("should block requests after limit", async () => {
    const app = new Hono();
    // Set a very low limit for testing
    app.use("*", rateLimit({ max: 5, windowMs: 1000 }));
    app.get("/", (c) => c.text("ok"));

    const ip = "10.0.0.1";

    // 5 allowed requests
    for (let i = 0; i < 5; i++) {
        const res = await app.request("/", { headers: { "CF-Connecting-IP": ip } });
        expect(res.status).toBe(200);
    }

    // 6th request should fail
    const res = await app.request("/", { headers: { "CF-Connecting-IP": ip } });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).not.toBeNull();
  });

  it("should track different IPs separately", async () => {
    const app = new Hono();
    app.use("*", rateLimit({ max: 5, windowMs: 1000 }));
    app.get("/", (c) => c.text("ok"));

    const ip1 = "10.0.0.2";
    const ip2 = "10.0.0.3";

    // Exhaust limit for IP1
    for (let i = 0; i < 6; i++) {
        await app.request("/", { headers: { "CF-Connecting-IP": ip1 } });
    }

    // IP2 should still be allowed
    const res = await app.request("/", { headers: { "CF-Connecting-IP": ip2 } });
    expect(res.status).toBe(200);
  });
});
