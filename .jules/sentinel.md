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
