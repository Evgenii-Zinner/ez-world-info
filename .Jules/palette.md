## 2026-05-27 - Keyboard Accessible Table Headers
**Learning:** Custom interactive elements like table sort headers are often implemented with just `click` handlers, leaving keyboard users unable to sort. Adding `tabindex="0"` and `keydown` handlers for Enter/Space is critical.
**Action:** When creating sortable headers, always ensure they are focusable and triggerable via keyboard, and use `aria-sort` to communicate state.
## 2026-05-27 - Focus Visible for Custom Interactive Elements
**Learning:** When making custom HTML elements (like `<td>`) interactive (e.g., clicking to copy), providing visual feedback for keyboard users without bothering mouse users is crucial.
**Action:** Always pair `tabindex="0"` with `:focus-visible` styling (rather than just `:focus`) to provide a clear, branded outline (e.g., using `var(--color-secondary)`) specifically for keyboard navigation.

## 2026-05-28 - ARIA State for Custom Toggle Button Groups
**Learning:** Using simple `active` CSS classes for custom toggle groups (like visual chart styles) hides the selection state from screen readers, leaving them unaware of which option is currently active.
**Action:** When creating custom toggle buttons, always add `aria-pressed="true"` to the selected button and `aria-pressed="false"` to unselected options, updating these attributes dynamically via JavaScript alongside the visual CSS class. Pair this with `:focus-visible` styling using design system colors for robust keyboard accessibility.
## 2026-04-04 - [Accessible Chart Controls]
**Learning:** In dynamically updated client-side components (like the ECharts integration), screen readers often miss loading state changes if `aria-live` is absent. Additionally, native HTML `<select>` dropdowns and grouped buttons (like chart style switchers) require explicit ID linkages (`for`, `aria-labelledby`, and `role="group"`) to provide proper context to screen readers, especially when they drive complex visualizations.
**Action:** Always link `<label>` elements to form controls using `for` or `aria-labelledby`, apply `role="group"` to clusters of related buttons, and use `aria-live="polite"` on dynamic loading/status text containers to ensure seamless accessibility for custom interactive dashboards.
