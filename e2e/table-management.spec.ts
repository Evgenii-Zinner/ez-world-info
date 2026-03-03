import { test, expect } from '@playwright/test';

test.describe('Global Data Dashboard - Table Management', () => {

  test('user can sort columns, toggle visibility, and export data to CSV', async ({ page }) => {
    // 1. Navigate to the main page
    await page.goto('/');

    // 2. Wait for data to load
    await expect(page.locator('.status')).not.toHaveText(/Loading Data/i, { timeout: 10000 });

    // Ensure table has populated by checking for the presence of rows
    await expect(page.locator('.table-container tbody tr').first()).toBeVisible();

    // 3. Toggle column visibility
    // Open column settings
    const columnsBtn = page.getByRole('button', { name: /⚙️ Columns/i });
    await columnsBtn.click();

    // Wait for menu to be visible
    const columnMenu = page.locator('#column-settings-menu');
    await expect(columnMenu).toBeVisible();

    // Check the 'Area' column and uncheck it
    const areaCheckbox = page.getByLabel('Area', { exact: true });

    // Ensure it is checked initially, then uncheck
    await expect(areaCheckbox).toBeChecked();
    await areaCheckbox.uncheck();
    await expect(areaCheckbox).not.toBeChecked();

    // Verify 'Area (km²)' column header is hidden
    await expect(page.getByRole('columnheader', { name: /Area \(km²\)/i })).toBeHidden();

    // Close column settings
    await columnsBtn.click();
    await expect(columnMenu).toBeHidden();

    // 4. Sort by Population
    const populationHeader = page.getByRole('columnheader', { name: /Population/i });

    // Click once to sort ascending
    await populationHeader.click();
    await expect(populationHeader).toHaveAttribute('aria-sort', 'ascending');

    // Click again to sort descending
    await populationHeader.click();
    await expect(populationHeader).toHaveAttribute('aria-sort', 'descending');

    // 5. Export CSV
    // Wait for the download event
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /⬇️ Export CSV/i }).click();
    const download = await downloadPromise;

    // Verify the downloaded file name matches expected pattern
    expect(download.suggestedFilename()).toMatch(/world_data_export_.*\.csv/);
  });
});
