## 2024-05-24 - [Intl.NumberFormat in Alpine.js loops]
**Learning:** Instantiating `Intl.NumberFormat` inside Alpine.js format helper functions (like `formatCurrency`) that are called for every rendered row causes significant frontend performance degradation because the expensive constructor is invoked N * M times (rows * columns).
**Action:** Always cache `Intl.NumberFormat` instances in a dictionary on the component state when formatting large lists of data client-side.
