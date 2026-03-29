## 2025-02-19 - [Server-Side Rendered Client Components XSS Risk]
**Vulnerability:** The `ChartView.ts` component constructs client-side JavaScript and HTML strings on the server. The `ECharts` tooltip formatter used string concatenation with user-controlled data (`name`) without escaping, leading to XSS.
**Learning:** Server-side generation of client-side code (JS/HTML strings) bypasses Hono's automatic HTML escaping, which only works for `html` template literals used for the main response body, not for strings embedded *inside* `<script>` tags or JS logic.
**Prevention:** Always manually escape data when embedding it into client-side scripts or HTML strings generated on the server. Use a helper function like `escapeHtml` within the generated script itself.
## 2025-02-19 - [CSV Formula Injection in Data Export]
**Vulnerability:** The `exportCSV` function in `CountriesTable.ts` allowed Formula Injection (CSV Injection). Cell values starting with `=`, `+`, `-`, or `@` were exported raw, which could be executed as formulas in spreadsheet software.
**Learning:** Even when data comes from trusted sources (like RestCountries), data format conversion (like JSON to CSV) can introduce vulnerabilities if the target format has execution capabilities (like Excel formulas).
**Prevention:** Always sanitize CSV exports by prepending a single quote `'` to cells starting with unsafe characters (`=+\-@`), forcing them to be treated as text.
## 2025-02-19 - [Permissive Security Headers]
**Vulnerability:** The app allowed all HTTPS connections via `connect-src https:` in CSP and lacked `Permissions-Policy` header.
**Learning:** Generic wildcards like `https:` in CSP effectively allow connections to any SSL-secured site, enabling potential data exfiltration. Default browser behavior for powerful features (camera, mic) is permissive unless restricted.
**Prevention:** Always restrict `connect-src` to `'self'` or specific trusted domains. Use `Permissions-Policy` to explicitly disable powerful browser features the app does not require.
## 2025-02-19 - [Unvalidated Query Parameters DoS Risk]
**Vulnerability:** The `/chart-data` endpoint accepted an unlimited number of comma-separated country codes in the `selected` query parameter without validation. This allowed an attacker to send a massive payload, causing excessive memory allocation and CPU usage during string splitting and set operations.
**Learning:** Array-like query parameters (e.g., `?ids=1,2,3...`) are often overlooked DoS vectors. Processing them without limits on total length or item count can exhaust server resources, especially when combined with expensive downstream operations.
**Prevention:** Always enforce strict limits on the length and item count of array-like inputs *before* any processing occurs. Validate the format of each item early to fail fast.
## 2025-02-28 - [JSON Island XSS Bypass via Case-Insensitive Tags]
**Vulnerability:** The `CountriesTable.ts` component embeds data in a `<script type="application/json">` tag. It attempted to prevent XSS by escaping `</script>` using a case-sensitive regex (`/<\/script/g`). An attacker could inject a string containing a case-variant like `</SCRIPT>`, which would bypass the regex, prematurely close the script tag, and allow execution of malicious scripts.
**Learning:** HTML tag parsing is case-insensitive, including script closing tags. Security measures attempting to sanitize HTML strings must account for this, especially when serializing data into JSON blocks.
**Prevention:** Always use the case-insensitive flag (`i`) in regular expressions designed to sanitize HTML tags (e.g., `/<\/(script)/gi`), and preserve case if possible.
## 2025-02-28 - [Sentinel Operational Rule Update]
**Vulnerability:** N/A (Process Improvement)
**Learning:** If no critical or high severity vulnerabilities are found during the initial scan, Sentinel should not halt but instead automatically proceed with implementing a security enhancement (e.g., adding timeouts, tightening headers, improving sanitization).
**Prevention:** This ensures continuous improvement of the codebase's defense-in-depth posture even when obvious flaws are absent.
## 2025-02-28 - [Missing Standard Rate Limit Headers]
**Vulnerability:** The rate limit middleware did not expose the current rate limit state to the client (using standard headers like `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`).
**Learning:** Providing standard rate limit headers allows clients to proactively back off and manage their requests, preventing unintentional server abuse and reducing unnecessary processing of blocked requests.
**Prevention:** Always include `X-RateLimit-*` headers when implementing rate limiting to improve API transparency and client-side handling.
## 2026-03-22 - [Missing Cross-Origin Resource Policies]
**Vulnerability:** The application was missing Cross-Origin Opener Policy (COOP) and Cross-Origin Resource Policy (CORP) headers.
**Learning:** Even with CSP and basic headers, modern web applications can be vulnerable to cross-origin information leaks (like Spectre or Meltdown). Explicitly isolating the origin restricts other domains from opening the application in a popup or embedding its resources.
**Prevention:** Always include `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin` headers to provide defense-in-depth against cross-origin attacks.
## 2024-05-24 - [Hono Query Parameter Pollution]
**Vulnerability:** The `/chart-data` endpoint used `c.req.query('selected')` to validate input length and limit the number of selected countries (DoS prevention). However, `c.req.query` only processes the first occurrence of a query parameter when multiple instances of the same key are provided (e.g., `?selected=USA&selected=FRA`). This allowed an attacker to bypass length and count restrictions by passing hundreds of individual `selected=...` parameters, potentially causing memory exhaustion.
**Learning:** In Hono, `c.req.query` is vulnerable to HTTP Parameter Pollution (HPP) when used for validation logic that expects a single string but might receive an array of values. It silently ignores subsequent parameters.
**Prevention:** Always use `c.req.queries('param')` when validating input bounds (length, count) on query parameters that might be provided multiple times, ensuring all instances are aggregated and validated.
