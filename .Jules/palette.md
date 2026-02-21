## 2026-05-27 - Keyboard Accessible Table Headers
**Learning:** Custom interactive elements like table sort headers are often implemented with just `click` handlers, leaving keyboard users unable to sort. Adding `tabindex="0"` and `keydown` handlers for Enter/Space is critical.
**Action:** When creating sortable headers, always ensure they are focusable and triggerable via keyboard, and use `aria-sort` to communicate state.

## 2026-06-03 - Row Selection Accessibility
**Learning:** Data tables often use checkboxes for row selection without labels. Adding `:aria-label="'Select ' + row.name"` (using Alpine's binding syntax) provides crucial context for screen reader users.
**Action:** Ensure all interactive elements in repeated structures have unique, descriptive labels.
