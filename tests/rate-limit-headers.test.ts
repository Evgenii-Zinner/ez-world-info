import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { rateLimit } from "../src/middleware/rate-limit";

describe("Rate Limit Headers", () => {
  it("should include standard rate limit headers", async () => {
    const app = new Hono();
    app.use("*", rateLimit({ max: 5, windowMs: 1000 }));
    app.get("/", (c) => c.text("ok"));

    // Important: we need to use a distinct IP or reset state
    const ip = "10.1.1.1";
    const res = await app.request("/", { headers: { "CF-Connecting-IP": ip } });
    expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("4");
    expect(res.headers.get("X-RateLimit-Reset")).not.toBeNull();
  });
});
