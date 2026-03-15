import { test, expect } from '@playwright/test';

test.describe('Global Data Dashboard - Share State Hydration', () => {
  // Grant clipboard permissions to the browser context so we can test the "Copy Link" button
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('user can share and hydrate table state via URL parameters', async ({ page, context }) => {
    // 1. Navigate to the main page
    await page.goto('/');

    // Wait for data to load
    await expect(page.locator('.status')).not.toHaveText(/Loading Data/i, { timeout: 10000 });
    await expect(page.locator('.table-container tbody tr').first()).toBeVisible();

    // 2. Modify state: Search for 'Japan'
    const searchInput = page.getByPlaceholder(/Search.../i);
    await searchInput.fill('Japan');

    // Wait for Japan row to appear
    const japanRow = page.getByRole('cell', { name: 'Japan', exact: true }).first();
    await expect(japanRow).toBeVisible();

    // 3. Modify state: Select Japan
    const japanCheckbox = page.locator('tr').filter({ hasText: 'Japan' }).getByRole('checkbox');
    await japanCheckbox.check();
    await expect(page.getByText(/1 selected/i)).toBeVisible();

    // 4. Modify state: Change filter to "Selected"
    const selectedFilterBtn = page.getByRole('button', { name: 'Selected' });
    await selectedFilterBtn.click();
    await expect(selectedFilterBtn).toHaveClass(/active/);

    // Verify state changes applied
    // The table contains an additional `tr` element for "No countries found" which is visually hidden but in the DOM
    await expect(page.locator('.table-container tbody tr').filter({ hasText: 'Japan' })).toHaveCount(1);
    await expect(japanRow).toBeVisible();

    // 5. Click "Copy Link" and extract URL from clipboard
    // First, grant explicit permission to the current origin
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: page.url() });

    const copyLinkBtn = page.getByRole('button', { name: /Copy Link/i });
    await copyLinkBtn.click();

    // The button text changes to "✅ Copied!" temporarily (can be flaky, so wait for the DOM change explicitly without a timeout that fails)
    await expect(page.getByRole('button', { name: /Copied!/i })).toBeVisible({ timeout: 2000 });

    // Read the clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    // Verify the copied URL contains our expected state parameters
    const copiedUrl = new URL(clipboardText);
    expect(copiedUrl.searchParams.get('search')).toBe('Japan');
    expect(copiedUrl.searchParams.get('selected')).toBe('JPN'); // Code for Japan
    expect(copiedUrl.searchParams.get('filter')).toBe('selected');

    // 6. Navigate to the copied URL (simulating a user sharing the link)
    // We use a new page to ensure clean state and truly test hydration
    const newPage = await context.newPage();
    await newPage.goto(clipboardText);

    // Wait for new page to load data
    await expect(newPage.locator('.status')).not.toHaveText(/Loading Data/i, { timeout: 10000 });

    // 7. Verify state was properly hydrated on the new page
    // Verify search input
    const newSearchInput = newPage.getByPlaceholder(/Search.../i);
    await expect(newSearchInput).toHaveValue('Japan');

    // Verify filter
    const newSelectedFilterBtn = newPage.getByRole('button', { name: 'Selected' });
    await expect(newSelectedFilterBtn).toHaveClass(/active/);

    // Verify selection text
    await expect(newPage.getByText(/1 selected/i)).toBeVisible();

    // Verify the table content is restricted to Japan
    const newJapanRow = newPage.getByRole('cell', { name: 'Japan', exact: true }).first();
    await expect(newJapanRow).toBeVisible();
    await expect(newPage.locator('.table-container tbody tr').filter({ hasText: 'Japan' })).toHaveCount(1);

    // Ensure Japan is actually checked in the table
    const newJapanCheckbox = newPage.locator('tr').filter({ hasText: 'Japan' }).getByRole('checkbox');
    await expect(newJapanCheckbox).toBeChecked();
  });
});
