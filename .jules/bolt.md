## 2024-05-24 - [Intl.NumberFormat in Alpine.js loops]
**Learning:** Instantiating `Intl.NumberFormat` inside Alpine.js format helper functions (like `formatCurrency`) that are called for every rendered row causes significant frontend performance degradation because the expensive constructor is invoked N * M times (rows * columns).
**Action:** Always cache `Intl.NumberFormat` instances in a dictionary on the component state when formatting large lists of data client-side.

## 2025-02-28 - [Regex Literals in Loops and Handlers]
**Learning:** Inline regular expression literals placed inside loops or request handlers degrade backend performance because the JavaScript engine has to recompile them on each iteration or request.
**Action:** Always hoist regular expression literals to module-level constants (e.g., `const COUNTRY_CODE_REGEX = /^[A-Z]{3}$/;`) to ensure they are compiled exactly once.

## 2025-03-01 - [Pre-computing lowercase strings for faster UI filtering]
**Learning:** Performing inline `.toLowerCase()` string transformations within reactive frontend filtering or sorting loops (like Alpine.js or React) incurs high proxy overhead and redundant computation per keystroke. This acts as a major performance bottleneck for large datasets (approx 3x slower).
**Action:** Pre-compute lowercase string fields on data initialization using a `_prepareRows` helper (e.g., `_lowerName: r.name.toLowerCase()`), map missing values explicitly to `null` to preserve correct sorting logic, and use these pre-computed fields inside reactive filter and sort operations.
