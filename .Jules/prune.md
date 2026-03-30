# Prune Journal

## 2024-05-18
**Learning:** Initializing journal.
**Action:** Created file.## 2026-03-09 - \n**Learning:** Knip may falsely flag SCSS files (e.g., in `src/styles/`) as unused because they are compiled independently via the `build:css` `sass` script. Do not rely on Knip for identifying dead SCSS code.\n**Action:** Refrained from removing SCSS files despite Knip's suggestions.\n\n## 2026-03-09 - \n**Learning:** To prevent TypeScript compilation errors (like 'Cannot find name process') during `bun x tsc --noEmit` locally, explicitly add `playwright.config.ts` to the `exclude` array in `tsconfig.json`.\n**Action:** Added `playwright.config.ts` to `tsconfig.json` `exclude` array.
## 2024-05-18 -
**Learning:** Pre-computing lowercase strings (_lowerName, _lowerCode) during initialization in CountriesTable provides a measurable performance boost for filtering and sorting compared to inline .toLowerCase() calls in getters.
**Action:** Extracting inline .toLowerCase() to a helper _prepareRows() that is called when setting allRows.
