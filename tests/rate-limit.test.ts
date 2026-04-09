import { describe, it, expect, beforeEach, afterEach, setSystemTime } from "bun:test";
import { Hono } from "hono";
import { rateLimit } from "../src/middleware/rate-limit";

describe("Rate Limit Middleware", () => {
  beforeEach(() => {
    // Reset the internal map for clean tests.
    setSystemTime(new Date("2020-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    setSystemTime(); // Reset to normal time
  });

  it("should block requests after limit", async () => {
    const app = new Hono();
    app.use("*", rateLimit({ max: 5, windowMs: 1000 }));
    app.get("/", (c) => c.text("ok"));

    const ip = "10.0.0.1";

    for (let i = 0; i < 5; i++) {
        const res = await app.request("/", { headers: { "CF-Connecting-IP": ip } });
        expect(res.status).toBe(200);
    }

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

    for (let i = 0; i < 6; i++) {
        await app.request("/", { headers: { "CF-Connecting-IP": ip1 } });
    }

    const res = await app.request("/", { headers: { "CF-Connecting-IP": ip2 } });
    expect(res.status).toBe(200);
  });

  it("should reset rate limit after window expires", async () => {
    const app = new Hono();
    app.use("*", rateLimit({ max: 5, windowMs: 1000 }));
    app.get("/", (c) => c.text("ok"));

    const ip = "10.0.0.4";

    for (let i = 0; i < 6; i++) {
        await app.request("/", { headers: { "CF-Connecting-IP": ip } });
    }

    setSystemTime(new Date("2020-01-01T00:00:02.000Z"));

    const res = await app.request("/", { headers: { "CF-Connecting-IP": ip } });
    expect(res.status).toBe(200);
  });

  it("should selectively delete expired entries when map size exceeds 5000", async () => {
    const app = new Hono();
    app.use("*", rateLimit({ max: 5, windowMs: 1000 }));
    app.get("/", (c) => c.text("ok"));

    for (let i = 0; i < 5000; i++) {
        const ip = `old-ip-${i}`;
        await app.request("/", { headers: { "CF-Connecting-IP": ip } });
    }

    setSystemTime(new Date("2020-01-01T00:00:02.000Z"));

    await app.request("/", { headers: { "CF-Connecting-IP": "active-ip-1" } });

    const res = await app.request("/", { headers: { "CF-Connecting-IP": "active-ip-1" } });
    expect(res.status).toBe(200);
  });

  it("should hard clear map when size exceeds 10000", async () => {
    const app = new Hono();
    app.use("*", rateLimit({ max: 5, windowMs: 10000 }));
    app.get("/", (c) => c.text("ok"));

    for (let i = 0; i < 10000; i++) {
        const ip = `flood-ip-${i}`;
        await app.request("/", { headers: { "CF-Connecting-IP": ip } });
    }

    await app.request("/", { headers: { "CF-Connecting-IP": "trigger-ip" } });

    for (let i = 0; i < 5; i++) {
        const res = await app.request("/", { headers: { "CF-Connecting-IP": "flood-ip-0" } });
        expect(res.status).toBe(200);
    }
  });

  it("should handle unknown IP fallback when CF-Connecting-IP is missing", async () => {
    const app = new Hono();
    app.use("*", rateLimit({ max: 5, windowMs: 1000 }));
    app.get("/", (c) => c.text("ok"));

    // Make 6 requests without the header
    for (let i = 0; i < 5; i++) {
        const res = await app.request("/");
        expect(res.status).toBe(200);
    }

    const res = await app.request("/");
    expect(res.status).toBe(429);
  });

});
