import { describe, it, expect, setSystemTime, afterEach } from "bun:test";
import { Hono } from "hono";
import { rateLimit } from "../src/middleware/rate-limit";

describe("Rate Limit Middleware Memory Management", () => {
  afterEach(() => {
    // Reset system time after each test to avoid polluting other tests
    setSystemTime();
  });

  it("should trigger lazy cleanup and NOT hard clear when expired items exist", async () => {
    const app = new Hono();
    app.use("*", rateLimit({ max: 5, windowMs: 60000 }));
    app.get("/", (c) => c.text("ok"));

    // 1. Add 10000 items that will expire
    for (let i = 0; i < 10000; i++) {
        await app.request("/", { headers: { "CF-Connecting-IP": `old-${i}` } });
    }

    // 2. Move time forward 61 seconds so they expire
    setSystemTime(Date.now() + 61000);

    // 3. Add 1 unexpired item, make 2 requests so remaining is 3
    await app.request("/", { headers: { "CF-Connecting-IP": "unexpired-1" } });
    const res1 = await app.request("/", { headers: { "CF-Connecting-IP": "unexpired-1" } });
    expect(res1.headers.get("X-RateLimit-Remaining")).toBe("3");

    // 4. Add 1 more item. This triggers the lazy cleanup loop (size > 5000).
    // Because the 10000 items are expired, they will be deleted.
    // Size becomes 2 (unexpired-1, and new-1).
    // Hard clear (> 10000) should NOT be triggered.
    await app.request("/", { headers: { "CF-Connecting-IP": "new-1" } });

    // 5. Verify the unexpired item's limit was preserved (remaining should now be 2)
    const res2 = await app.request("/", { headers: { "CF-Connecting-IP": "unexpired-1" } });
    expect(res2.headers.get("X-RateLimit-Remaining")).toBe("2");
  });

  it("should perform hard clear when map exceeds 10000 unexpired entries", async () => {
    const app = new Hono();
    app.use("*", rateLimit({ max: 5, windowMs: 60000 }));
    app.get("/", (c) => c.text("ok"));

    // 1. Add 1 item and consume 1 request (remaining: 4)
    const res1 = await app.request("/", { headers: { "CF-Connecting-IP": "target-ip" } });
    expect(res1.headers.get("X-RateLimit-Remaining")).toBe("4");

    // 2. Flood with 10000 unexpired items
    for (let i = 0; i < 10000; i++) {
        await app.request("/", { headers: { "CF-Connecting-IP": `flood-${i}` } });
    }

    // 3. Add 1 more item. This triggers size > 5000.
    // None are expired, so size remains 10002.
    // Hard clear (> 10000) WILL be triggered, emptying the map.
    await app.request("/", { headers: { "CF-Connecting-IP": "trigger-ip" } });

    // 4. Check the target IP. Because the map was cleared, its history is forgotten.
    // A new request will be treated as its first, so remaining will be 4 instead of 3.
    const res2 = await app.request("/", { headers: { "CF-Connecting-IP": "target-ip" } });
    expect(res2.headers.get("X-RateLimit-Remaining")).toBe("4");
  });
});
