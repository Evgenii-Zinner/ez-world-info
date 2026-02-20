## 2026-05-27 - Keyboard Accessible Table Headers
**Learning:** Custom interactive elements like table sort headers are often implemented with just `click` handlers, leaving keyboard users unable to sort. Adding `tabindex="0"` and `keydown` handlers for Enter/Space is critical.
**Action:** When creating sortable headers, always ensure they are focusable and triggerable via keyboard, and use `aria-sort` to communicate state.
