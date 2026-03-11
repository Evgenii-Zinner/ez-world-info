## 2024-05-19 -
**Learning:** `\u2028` (Line Separator) and `\u2029` (Paragraph Separator) must be explicitly escaped when using the JSON Island pattern. While valid JSON, they cause fatal SyntaxErrors if left unescaped inside an HTML `<script>` block, breaking the execution context.
**Action:** Documented string escape behavior in `CountriesTable.ts` JSON serialization step.

## 2024-05-19 -
**Learning:** Alpine.$persist leverages `localStorage` for caching. When updating default variable values, you MUST update the alias via `.as('alias_name')`. Otherwise, existing users will continue seeing their old, stale cached data instead of the new intended default value.
**Action:** Added a warning comment above `Alpine.$persist` usage in `CountriesTable.ts`.

## 2024-05-19 -
**Learning:** The `WIKIDATA_QUERY` in `scripts/fetch-data.ts` uses "magic strings" in its SPARQL code (`wdt:P31`, `wd:Q6256`, `wdt:P298`, `wdt:P37`) which map respectively to "instance of", "country", "ISO 3166-1 alpha-3 code", and "official language" in the Wikidata ontology.
**Action:** Added an inline block comment translating these Wikidata property IDs to improve readability and maintainability for future developers.