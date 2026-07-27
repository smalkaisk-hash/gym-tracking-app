import { test, expect, type Page } from '@playwright/test';

// Screenshot baselines for the three auth screens. Each waits for the interactive
// element to settle (the app shows a loader until auth resolves) before capturing,
// then snapshots the full page. Run under both the `light` and `dark` projects, so
// each screen is pinned in both themes.

const settle = async (page: Page) => {
  // Fonts are self-hosted; wait for them so glyph metrics don't shift the shot.
  await page.evaluate(() => (document as any).fonts?.ready);
};

test('sign-in screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await settle(page);
  await expect(page).toHaveScreenshot('sign-in.png', { fullPage: true });
});

test('create-account screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  // "Create one" flips the form into signup mode (adds the confirm-password field).
  await page.getByRole('button', { name: 'Create one' }).click();
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  await settle(page);
  await expect(page).toHaveScreenshot('create-account.png', { fullPage: true });
});

test('forgot-password screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('button', { name: 'Back to sign in' })).toBeVisible();
  await settle(page);
  await expect(page).toHaveScreenshot('forgot-password.png', { fullPage: true });
});
