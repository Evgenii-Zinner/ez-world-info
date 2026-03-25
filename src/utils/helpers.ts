/**
 * Safely escapes HTML special characters to prevent Cross-Site Scripting (XSS).
 *
 * ⚠️ WARNING: This function handles JavaScript falsy values by returning an empty string.
 * This means passing `0` or `false` will return `""` instead of `"0"` or `"false"`.
 * Only use this function when you are certain that falsy values (like 0) should be
 * rendered as empty strings.
 *
 * @example
 * // Standard HTML Escaping:
 * escapeHtml('<script>alert("XSS")</script>');
 * // Returns "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
 *
 * @example
 * // Falsy Type Coercion:
 * escapeHtml(0); // Returns ""
 * escapeHtml(false); // Returns ""
 * escapeHtml(undefined); // Returns ""
 * escapeHtml(null); // Returns ""
 *
 * @param value - The input value to escape and coerce to a string
 * @returns The HTML-escaped string, or an empty string if the input is falsy
 */
export function escapeHtml(value: any): string {
  if (!value) return '';
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
