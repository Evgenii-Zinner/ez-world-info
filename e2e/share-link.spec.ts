import { test, expect } from '@playwright/test';

test.describe('Global Data Dashboard - Share Link State', () => {

  test('user can copy share link and state is restored upon navigation', async ({ page, context }) => {
    // 1. Navigate to the main page
    await page.goto('/');

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: page.url() });

    // Wait for data to load
    await expect(page.locator('.status')).not.toHaveText(/Loading Data/i, { timeout: 10000 });
    await expect(page.locator('.table-container tbody tr').first()).toBeVisible();

    // 2. Search for a specific country
    const searchInput = page.getByPlaceholder(/Search.../i);
    await searchInput.fill('Japan');

    // Wait for the filtered results. Japan should be visible in the table.
    const japanRow = page.getByRole('cell', { name: 'Japan', exact: true }).first();
    await expect(japanRow).toBeVisible();

    // 3. Select Japan
    const japanCheckbox = page.locator('tr').filter({ hasText: 'Japan' }).getByRole('checkbox');
    await japanCheckbox.check();

    // Wait for the selection count
    await expect(page.getByText(/1 selected/i)).toBeVisible();

    // 4. Set filter to 'Selected'
    const selectedFilterBtn = page.getByRole('button', { name: /^Selected$/i });
    await selectedFilterBtn.click();
    await expect(selectedFilterBtn).toHaveClass(/active/);

    // 5. Click Copy Link
    const copyLinkBtn = page.getByRole('button', { name: /Copy Link/i });
    await copyLinkBtn.click();
    // Use fallback for locator, because text changes to "✅ Copied!"
    const copiedBtn = page.getByRole('button', { name: /Copied!/i });
    await expect(copiedBtn).toBeVisible();

    // Read clipboard
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    // Verify clipboard contains the right params
    expect(clipboardText).toContain('search=Japan');
    expect(clipboardText).toContain('filter=selected');
    expect(clipboardText).toContain('selected=JPN');

    // 6. Navigate to the copied URL
    await page.goto(clipboardText);

    // Wait for data to load again
    await expect(page.locator('.status')).not.toHaveText(/Loading Data/i, { timeout: 10000 });

    // 7. Verify state is restored
    // Search input should have 'Japan'
    await expect(searchInput).toHaveValue('Japan');

    // Filter button should be active
    await expect(page.getByRole('button', { name: /^Selected$/i })).toHaveClass(/active/);

    // Selection count should still be 1
    await expect(page.getByText(/1 selected/i)).toBeVisible();

    // Japan checkbox should be checked
    const restoredJapanCheckbox = page.locator('tr').filter({ hasText: 'Japan' }).getByRole('checkbox');
    await expect(restoredJapanCheckbox).toBeChecked();
  });
});
