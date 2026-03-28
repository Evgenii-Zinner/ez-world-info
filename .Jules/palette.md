## 2026-05-27 - Keyboard Accessible Table Headers
**Learning:** Custom interactive elements like table sort headers are often implemented with just `click` handlers, leaving keyboard users unable to sort. Adding `tabindex="0"` and `keydown` handlers for Enter/Space is critical.
**Action:** When creating sortable headers, always ensure they are focusable and triggerable via keyboard, and use `aria-sort` to communicate state.
## 2026-05-27 - Focus Visible for Custom Interactive Elements
**Learning:** When making custom HTML elements (like `<td>`) interactive (e.g., clicking to copy), providing visual feedback for keyboard users without bothering mouse users is crucial.
**Action:** Always pair `tabindex="0"` with `:focus-visible` styling (rather than just `:focus`) to provide a clear, branded outline (e.g., using `var(--color-secondary)`) specifically for keyboard navigation.

## 2026-05-28 - ARIA State for Custom Toggle Button Groups
**Learning:** Using simple `active` CSS classes for custom toggle groups (like visual chart styles) hides the selection state from screen readers, leaving them unaware of which option is currently active.
**Action:** When creating custom toggle buttons, always add `aria-pressed="true"` to the selected button and `aria-pressed="false"` to unselected options, updating these attributes dynamically via JavaScript alongside the visual CSS class. Pair this with `:focus-visible` styling using design system colors for robust keyboard accessibility.
## 2026-05-29 - Semantic Active States in Navigation
**Learning:** Using only visual CSS classes (like `active`) for navigation links leaves screen readers unaware of the user's current context within the application hierarchy.
**Action:** Always pair visual active navigation states with `aria-current="page"` (or appropriate token like "location") and dynamically update it alongside the CSS class.
