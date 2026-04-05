import { test, expect } from '@playwright/test';

test.describe('Global Data Dashboard - Theme Toggle Workflow', () => {

  test('user can toggle between light and dark themes and preference is persisted', async ({ page }) => {
    // 1. Navigate to the main page
    await page.goto('/');

    // Ensure the app loads
    await expect(page.getByRole('heading', { name: /World Info Dashboard/i })).toBeVisible();

    // 2. Identify initial theme state
    // According to layout.ts, it uses 'theme-light' class on html element for light mode.
    // Let's explicitly check the class.
    const htmlElement = page.locator('html');

    // We don't know the initial system preference of the test runner,
    // so we evaluate the initial class to determine our expected behavior
    const isInitiallyLight = await htmlElement.evaluate((node) => node.classList.contains('theme-light'));

    const themeBtn = page.getByRole('button', { name: /Toggle theme/i });
    const themeIcon = themeBtn.locator('.theme-icon');

    if (isInitiallyLight) {
        await expect(themeIcon).toHaveText('☀️');
    } else {
        await expect(themeIcon).toHaveText('🌙');
    }

    // 3. Toggle the theme
    await themeBtn.click();

    // 4. Verify theme switched
    if (isInitiallyLight) {
        await expect(htmlElement).not.toHaveClass(/theme-light/);
        await expect(themeIcon).toHaveText('🌙');
    } else {
        await expect(htmlElement).toHaveClass(/theme-light/);
        await expect(themeIcon).toHaveText('☀️');
    }

    // 5. Verify local storage was updated
    const expectedTheme = isInitiallyLight ? 'dark' : 'light';
    const persistedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(persistedTheme).toBe(expectedTheme);

    // 6. Reload the page and verify theme preference is restored
    await page.reload();

    // The class and icon should match our expectation after reload
    if (expectedTheme === 'light') {
        await expect(htmlElement).toHaveClass(/theme-light/);
        await expect(themeIcon).toHaveText('☀️');
    } else {
        await expect(htmlElement).not.toHaveClass(/theme-light/);
        await expect(themeIcon).toHaveText('🌙');
    }
  });
});
