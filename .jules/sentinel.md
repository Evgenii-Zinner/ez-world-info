## 2025-02-19 - [Server-Side Rendered Client Components XSS Risk]
**Vulnerability:** The `ChartView.ts` component constructs client-side JavaScript and HTML strings on the server. The `ECharts` tooltip formatter used string concatenation with user-controlled data (`name`) without escaping, leading to XSS.
**Learning:** Server-side generation of client-side code (JS/HTML strings) bypasses Hono's automatic HTML escaping, which only works for `html` template literals used for the main response body, not for strings embedded *inside* `<script>` tags or JS logic.
**Prevention:** Always manually escape data when embedding it into client-side scripts or HTML strings generated on the server. Use a helper function like `escapeHtml` within the generated script itself.
