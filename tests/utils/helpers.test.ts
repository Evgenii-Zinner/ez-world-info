import { describe, it, expect } from "bun:test";
import { escapeHtml } from "../../src/utils/helpers";

describe("Helpers - escapeHtml", () => {
  it("should escape all required HTML characters", () => {
    const input = `& < > " '`;
    const expected = `&amp; &lt; &gt; &quot; &#39;`;
    expect(escapeHtml(input)).toBe(expected);
  });

  it("should return identical string when no special characters are present", () => {
    const input = "Plain text string without special chars 123";
    expect(escapeHtml(input)).toBe(input);
  });

  it("should handle empty strings", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("should handle null/undefined by returning empty string", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("should handle non-string inputs", () => {
    expect(escapeHtml(123)).toBe("123");
    expect(escapeHtml(true)).toBe("true");
  });

  it("should handle strings with multiple occurrences of special characters", () => {
    const input = `<script>alert("XSS 'attack' & hack")</script>`;
    const expected = `&lt;script&gt;alert(&quot;XSS &#39;attack&#39; &amp; hack&quot;)&lt;/script&gt;`;
    expect(escapeHtml(input)).toBe(expected);
  });
});
