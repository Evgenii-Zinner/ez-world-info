import { test, expect } from '@playwright/test';

test.describe('Global Data Dashboard - Chart Interaction', () => {

  test('user can switch metrics and visual styles in the chart dashboard', async ({ page }) => {
    // Navigate directly to the chart page
    await page.goto('/chart');

    // Wait for chart container to load
    await expect(page.locator('#chart-container')).toBeVisible({ timeout: 10000 });

    // Ensure chart data has loaded by checking selection notice
    const selectionStatus = page.locator('#selection-status');
    await expect(selectionStatus).toContainText(/Showing Top 50|Comparing/i, { timeout: 10000 });

    // Test changing visual styles
    const barBtn = page.getByRole('button', { name: /Bar/i });
    const roseBtn = page.getByRole('button', { name: /Rose/i });
    const bubbleBtn = page.getByRole('button', { name: /Bubble/i });
    const mapBtn = page.getByRole('button', { name: /Map/i });

    // Click Rose style and verify active state
    await roseBtn.click();
    await expect(roseBtn).toHaveClass(/active/);
    await expect(barBtn).not.toHaveClass(/active/);

    // Click Bubble style and verify active state
    await bubbleBtn.click();
    await expect(bubbleBtn).toHaveClass(/active/);
    await expect(roseBtn).not.toHaveClass(/active/);

    // Click Map style and verify active state
    await mapBtn.click();
    await expect(mapBtn).toHaveClass(/active/);
    await expect(bubbleBtn).not.toHaveClass(/active/);

    // Test changing metric
    const metricSelect = page.locator('#metric-selector');

    // Default should be gdpPerCapita
    await expect(metricSelect).toHaveValue('gdpPerCapita');

    // Change to population
    await metricSelect.selectOption('population');
    await expect(metricSelect).toHaveValue('population');

    // Change to area
    await metricSelect.selectOption('area');
    await expect(metricSelect).toHaveValue('area');
  });

});
