## 2024-03-02 - Table Locators and Alpine.js Rendering

**Learning:** Playwright locators for rows and cells need `exact: true` and `.first()` in cases where responsive CSS hides/shows multiple elements for the same logical component. In the `CountriesTable.ts`, rows may generate elements that match text locators broadly. Waiting on `.status` to clear "Loading Data" correctly handles Alpine.js asynchronous state rendering.

**Action:** Used `exact: true` and `.first()` on `getByRole('cell')` and specifically watched for `.status` to be updated out of the loading state before testing data to ensure flake-free evaluation of search functions.

## 2024-03-02 - Navigation Links

**Learning:** The navigation link for "Chart" conflicts with an external link "Charts" pointing to Echarts in the footer when using `/Chart/i`.

**Action:** Ensure `exact: true` is used when locating top level navigation `getByRole('link', { name: 'Chart', exact: true })` to prevent ambiguous element resolution.
