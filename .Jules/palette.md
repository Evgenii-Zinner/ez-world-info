## 2026-05-27 - Keyboard Accessible Table Headers
**Learning:** Custom interactive elements like table sort headers are often implemented with just `click` handlers, leaving keyboard users unable to sort. Adding `tabindex="0"` and `keydown` handlers for Enter/Space is critical.
**Action:** When creating sortable headers, always ensure they are focusable and triggerable via keyboard, and use `aria-sort` to communicate state.
## 2026-05-27 - Focus Visible for Custom Interactive Elements
**Learning:** When making custom HTML elements (like `<td>`) interactive (e.g., clicking to copy), providing visual feedback for keyboard users without bothering mouse users is crucial.
**Action:** Always pair `tabindex="0"` with `:focus-visible` styling (rather than just `:focus`) to provide a clear, branded outline (e.g., using `var(--color-secondary)`) specifically for keyboard navigation.
