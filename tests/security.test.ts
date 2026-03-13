import { describe, it, expect } from "bun:test";
import app from "../src/index";

describe("Security Headers", () => {
  it("should have security headers", async () => {
    const res = await app.request("/");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");

    // Check CSP presence and tightness
    const csp = res.headers.get("Content-Security-Policy");
    expect(csp).not.toBeNull();
    // Verify connect-src is tightened (no generic https:)
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("connect-src 'self' https:");

    // Verify new hardened headers
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");

    // Verify Permissions-Policy
    const permissionsPolicy = res.headers.get("Permissions-Policy");
    expect(permissionsPolicy).not.toBeNull();
    expect(permissionsPolicy).toContain("accelerometer=()");
    expect(permissionsPolicy).toContain("camera=()");
    expect(permissionsPolicy).toContain("geolocation=()");
    expect(permissionsPolicy).toContain("gyroscope=()");
    expect(permissionsPolicy).toContain("magnetometer=()");
    expect(permissionsPolicy).toContain("microphone=()");
    expect(permissionsPolicy).toContain("payment=()");
    expect(permissionsPolicy).toContain("usb=()");
  });

  it("should not leak stack traces on error", async () => {
    // Trigger the catch-all route which fails because ASSETS is undefined in tests, using an explicitly invalid state
    // Let's explicitly trigger an error instead of a 404
    const res = await app.request("/api/test-error");
    const text = await res.text();

    // In production, we don't want stack traces.
    // However, Hono might show them by default in some environments or if not configured otherwise.
    // Let's see what we get.
    console.log("Error response body:", text);

    expect(res.status).toBe(500);
    // These assertions will fail if Hono exposes stack traces by default
    expect(text).not.toContain("at ");
    expect(text).not.toContain("src/index.ts");
  });
});
