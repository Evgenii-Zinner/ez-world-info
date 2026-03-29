import { test, expect } from '@playwright/test';

test.describe('Global Data Dashboard - Search and Bulk Selection', () => {

  test('user can search for countries, handle empty states, and bulk select/clear rows', async ({ page }) => {
    // 1. Navigate to the main page
    await page.goto('/');

    // 2. Wait for the application to load
    await expect(page.getByRole('heading', { name: /World Info Dashboard/i })).toBeVisible();
    await expect(page.locator('.status')).not.toHaveText(/Loading Data/i, { timeout: 10000 });

    // Verify initial table is loaded
    await expect(page.locator('.table-container tbody tr').first()).toBeVisible();

    // 3. Test Empty State: Search for a non-existent country
    const searchInput = page.getByPlaceholder(/Search.../i);
    await searchInput.fill('NonExistentCountryName123');

    // Wait for the empty state message to appear
    const emptyStateRow = page.getByRole('cell', { name: /No countries found matching your criteria/i });
    await expect(emptyStateRow).toBeVisible();

    // Verify only the empty state row is visible (no data rows)
    const allVisibleRows = page.locator('.table-container tbody tr').filter({ hasNotText: /No countries found/i });
    await expect(allVisibleRows).toHaveCount(0);

    // 4. Search for a generic term (e.g., "United")
    await searchInput.clear();
    await searchInput.fill('United');

    // Wait for the rows to appear and the empty state message to hide
    await expect(emptyStateRow).toBeHidden();

    // Ensure we have at least one data row visible
    await expect(allVisibleRows.first()).toBeVisible();

    // Count the visible rows for comparison
    const visibleRowCount = await allVisibleRows.count();
    expect(visibleRowCount).toBeGreaterThan(0);

    // 5. Test Bulk Selection: "Select All"
    // Use the column header for Select All
    const selectAllHeader = page.getByRole('columnheader', { name: 'Select all rows' });

    // Click Select All
    await selectAllHeader.click();

    // Verify the selection count updates to match the visible row count
    const selectionCountText = page.locator('.selection-count');
    await expect(selectionCountText).toContainText(`${visibleRowCount} selected`);

    // Verify all visible rows have their checkboxes checked
    // The checkboxes have class .country-checkbox
    const checkedBoxes = page.locator('.country-checkbox:checked');
    await expect(checkedBoxes).toHaveCount(visibleRowCount);

    // Verify the "Clear" button appears. Notice that the text in the error context is actually "Clear selection" ❌ Clear
    // It's defined as a button with text "❌ Clear" and aria-label "Clear selection". Playwright uses aria-label for accessible name if present.
    const clearBtn = page.getByRole('button', { name: 'Clear selection' });
    await expect(clearBtn).toBeVisible();

    // 6. Test Clear Selection
    await clearBtn.click();

    // Verify selection is cleared
    await expect(selectionCountText).toBeHidden();

    // Verify all checkboxes are unchecked
    await expect(checkedBoxes).toHaveCount(0);

    // Verify "Clear" button disappears
    await expect(clearBtn).toBeHidden();
  });
});
