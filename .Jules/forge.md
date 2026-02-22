## 2024-05-23 -
**Learning:** Alpine.js components in Hono template literals: `\n` in TS becomes `\n` (newline char) in HTML, but if inside a JS string literal, it breaks syntax. Must use `\\n` in TS to generate `\n` (backslash n) in HTML, which JS interprets as newline char.
**Action:** Use `\\n` for `join` operations in injected scripts to ensure correct character interpretation.

## 2024-05-23 -
**Learning:** Flexbox items shrink by default (`flex-shrink: 1`). Buttons in tight containers (e.g., table headers) can be squished or overlap if `min-width` isn't set.
**Action:** Always set `flex-shrink: 0` and `min-width: max-content` on buttons in toolbars to prevent layout collapse. Ensure siblings (inputs) have `flex: 1` and `min-width: 0`.

## 2024-05-24 -
**Learning:** `Alpine.$persist` relies on `localStorage`. Changing default values in source code (e.g., removing a column from `hiddenColumns`) does NOT update the stored preference for returning users, potentially hiding new features.
**Action:** When modifying default visibility of persisted UI elements, consider versioning the storage key (e.g., `hiddenColumns_v2`) or implement a migration strategy to ensure all users see the update.
