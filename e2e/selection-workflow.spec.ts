import { test, expect } from '@playwright/test';

test.describe('Global Data Dashboard - Selection Workflow', () => {

  test('user can use select all and clear selection features', async ({ page }) => {
    await page.goto('/');

    // Wait for data to load
    await expect(page.locator('.status')).not.toHaveText(/Loading Data/i, { timeout: 10000 });
    const dataRows = page.locator('.table-container tbody tr').filter({ hasNotText: /No countries found/i });
    await expect(dataRows.first()).toBeVisible();

    // Search for "United"
    const searchInput = page.getByPlaceholder(/Search.../i);
    await searchInput.fill('United');

    // Wait for filtering to apply
    // Wait for the exact count of filtered results rather than an arbitrary sleep
    await expect.poll(async () => {
       return await dataRows.count();
    }, { timeout: 5000 }).toBeGreaterThan(0);

    // We expect there to be less than the total ~250 countries since we searched for "United"
    await expect.poll(async () => {
        return await dataRows.count();
     }, { timeout: 5000 }).toBeLessThan(200);

    const visibleCount = await dataRows.count();

    // Click "Select All" header
    const selectAllBtn = page.getByRole('columnheader', { name: /Select all rows/i });
    await selectAllBtn.click();

    // Verify selection count text matches the number of visible rows
    const selectionCountText = page.locator('.selection-count');
    await expect(selectionCountText).toContainText(`${visibleCount} selected`);

    // Verify checkboxes are checked
    const firstCheckbox = dataRows.first().getByRole('checkbox');
    await expect(firstCheckbox).toBeChecked();

    // Clear search to see all countries again
    await searchInput.clear();

    // Wait for all rows to reappear by checking the count
    await expect.poll(async () => {
        return await dataRows.count();
     }, { timeout: 5000 }).toBeGreaterThan(visibleCount);

    // The selection count should still be visible and match our previous count
    await expect(selectionCountText).toContainText(`${visibleCount} selected`);

    // Click "❌ Clear" button to clear selection
    const clearBtn = page.getByRole('button', { name: 'Clear selection' });
    await clearBtn.click();

    // Verify selection count disappears and checkboxes are unchecked
    await expect(selectionCountText).toBeHidden();

    // We should be able to see the first row is now unchecked
    await expect(dataRows.first().getByRole('checkbox')).not.toBeChecked();
  });

  test('user sees empty state when searching for non-existent data', async ({ page }) => {
    await page.goto('/');

    // Wait for data to load
    await expect(page.locator('.status')).not.toHaveText(/Loading Data/i, { timeout: 10000 });
    const dataRows = page.locator('.table-container tbody tr').filter({ hasNotText: /No countries found/i });
    await expect(dataRows.first()).toBeVisible();

    // Search for a non-existent country
    const searchInput = page.getByPlaceholder(/Search.../i);
    await searchInput.fill('NonExistentCountryXYZ');

    // Verify empty state message appears
    const emptyStateCell = page.getByRole('cell', { name: /No countries found matching your criteria/i });
    await expect(emptyStateCell).toBeVisible();

    // Verify actual data rows are hidden
    await expect(dataRows).toHaveCount(0);

    // Clear search
    await searchInput.clear();

    // Verify data returns
    await expect(dataRows.first()).toBeVisible();
    await expect(emptyStateCell).toBeHidden();
  });
});
