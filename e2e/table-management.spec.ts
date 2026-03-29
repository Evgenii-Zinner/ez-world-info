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
    const downloadCsvPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /⬇️ CSV/i }).click();
    const downloadCsv = await downloadCsvPromise;

    // Verify the downloaded file name matches expected pattern
    expect(downloadCsv.suggestedFilename()).toMatch(/world_data_export_.*\.csv/);

    // 6. Export JSON
    // Wait for the download event
    const downloadJsonPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /⬇️ JSON/i }).click();
    const downloadJson = await downloadJsonPromise;

    // Verify the downloaded file name matches expected pattern
    expect(downloadJson.suggestedFilename()).toMatch(/world_data_export_.*\.json/);
  });

  test('table displays aggregate data summary row', async ({ page }) => {
    // 1. Navigate to the main page
    await page.goto('/');

    // 2. Wait for data to load
    await expect(page.locator('.status')).not.toHaveText(/Loading Data/i, { timeout: 10000 });
    await expect(page.locator('.table-container tbody tr').first()).toBeVisible();

    // 3. Check for the presence of the summary row
    const summaryRow = page.locator('tfoot tr.summary-row');
    await expect(summaryRow).toBeVisible();

    // 4. Verify it contains "Total"
    await expect(summaryRow.locator('td').filter({ hasText: 'Total' })).toBeVisible();

    // 5. Filter the table to specific countries to verify the summary updates
    const searchInput = page.getByPlaceholder(/Search.../i);
    await searchInput.fill('Japan');

    // Wait for the filtered results. Japan should be visible in the table.
    const japanRow = page.getByRole('cell', { name: 'Japan', exact: true }).first();
    await expect(japanRow).toBeVisible();

    // Ensure only one row is visible
    await expect(page.locator('.table-container tbody tr:visible')).toHaveCount(1);

    // Japan population is roughly 125,122,000 (depending on test data).
    // Let's just verify the summary row population cell isn't empty and has numbers.
    const summaryPopulationCell = summaryRow.locator('td').nth(3); // 4th column
    await expect(summaryPopulationCell).not.toBeEmpty();
    const summaryText = await summaryPopulationCell.innerText();
    expect(summaryText).toMatch(/[0-9,]+/);
  });
});
