import { describe, it, expect, spyOn } from "bun:test";
import app from "../src/index";
import * as api from "../src/services/api";

describe("Security Headers", () => {
  it("should have security headers", async () => {
    const res = await app.request("/");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(res.headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");

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
    // Verify that the removed endpoint now 404s
    const res404 = await app.request("/api/test-error");
    expect(res404.status).toBe(404);

    // Mock getCountryRows to throw an error
    const spy = spyOn(api, "getCountryRows").mockImplementation(async () => {
      throw new Error("Simulated production error");
    });

    try {
      const res = await app.request("/api/countriesData");
      const text = await res.text();

      expect(res.status).toBe(500);
      expect(text).toBe("Internal Server Error");
      expect(text).not.toContain("at ");
      expect(text).not.toContain("Simulated production error");
    } finally {
      // Restore original function
      spy.mockRestore();
    }
  });
});
