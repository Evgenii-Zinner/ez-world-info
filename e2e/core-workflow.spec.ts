import { test, expect } from '@playwright/test';

test.describe('Global Data Dashboard - Core Workflow', () => {

  test('user can search, select countries, and view comparison charts', async ({ page }) => {
    // 1. Navigate to the main page
    await page.goto('/');

    // 2. Wait for the application to be fully loaded.
    // We expect the "World Info Dashboard" header to be visible.
    await expect(page.getByRole('heading', { name: /World Info Dashboard/i })).toBeVisible();

    // We expect the table to load at least one country, e.g., Japan (if data is populated).
    // The table headers should be visible
    await expect(page.getByRole('columnheader', { name: /Country/i, exact: true })).toBeVisible();

    // Wait for the rows to populate (status changes from "Loading Data...")
    await expect(page.locator('.status')).not.toHaveText(/Loading Data/i, { timeout: 10000 });

    // 3. Search for a specific country
    const searchInput = page.getByPlaceholder(/Search.../i);
    await searchInput.fill('Japan');

    // 4. Wait for the filtered results. Japan should be visible in the table.
    const japanRow = page.getByRole('cell', { name: 'Japan', exact: true }).first();
    await expect(japanRow).toBeVisible();

    // 5. Select Japan using its row checkbox
    const japanCheckbox = page.locator('tr').filter({ hasText: 'Japan' }).getByRole('checkbox');
    await japanCheckbox.check();

    // Verify it was selected (Alpine state updates the selection count)
    await expect(page.getByText(/1 selected/i)).toBeVisible();

    // 6. Search for another country
    await searchInput.clear();
    await searchInput.fill('Brazil');

    // Wait for Brazil to appear
    const brazilRow = page.getByRole('cell', { name: 'Brazil', exact: true }).first();
    await expect(brazilRow).toBeVisible();

    // Select Brazil
    const brazilCheckbox = page.locator('tr').filter({ hasText: 'Brazil' }).getByRole('checkbox');
    await brazilCheckbox.check();

    // Verify selection count updated
    await expect(page.getByText(/2 selected/i)).toBeVisible();

    // 7. Navigate to the charts view
    const chartLink = page.getByRole('link', { name: 'Chart', exact: true });
    await chartLink.click();

    // 8. Verify the chart view loads with the selected countries
    // Wait for the chart component to be visible
    await expect(page.locator('#chart-container').first()).toBeVisible();

    // Ensure the selection status text reflects the selected countries
    const selectionStatus = page.locator('#selection-status');
    await expect(selectionStatus).toContainText(/Comparing 2 selected countries/i);
  });
});
