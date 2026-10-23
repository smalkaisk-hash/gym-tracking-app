import { test, expect } from '@playwright/test';

// Functional smoke flow — the counterpart to auth-screens.spec.ts, which only pins
// PIXELS. This drives the real app past the login gate and exercises behaviour:
// routing between screens, that the cache/seed paints a dashboard, and that the
// data-export path (PRIVACY.md § 9's Art. 15/20 route) actually hands over a file.
//
// It runs under playwright.flow.config.ts, which boots `vite dev` with
// VITE_DEV_AUTH_BYPASS=1 (so seedDemoData() lands us in the app with demo workouts)
// and DUMMY Supabase env (so nothing contacts a real backend — optimistic writes
// just mark _sync and the UI proceeds). Kept separate from the screenshot suite so a
// pixel re-baseline and a behaviour change never entangle.
//
// NOTE: authored to the app's real labels/roles but validate on first local run —
//   npx playwright install chromium
//   npm run test:e2e:flow

test('lands in the app past the login gate (dev bypass + seeded demo data)', async ({ page }) => {
  await page.goto('/');
  // The bypass skips LoginScreen, so its button must be absent and the tab bar present.
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
});

test('navigates Dashboard → History → Progress without crashing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
  await page.getByRole('button', { name: 'Progress' }).click();
  // Progress renders its filter card; the tab shows as current once selected.
  await expect(page.getByRole('button', { name: 'Progress' })).toHaveAttribute('aria-current', 'page');
  // The root ErrorBoundary would replace the tab bar with its recovery card; its
  // continued presence is the "no white-screen" assertion.
  await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
});

test('Export my data produces a JSON download (the Art. 15/20 route)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  // Settings' export is labelled "Export backup" (the ReconsentScreen gate uses the
  // "Export my data" wording — a different screen not reached in this flow).
  const exportBtn = page.getByRole('button', { name: 'Export backup' });
  await expect(exportBtn).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportBtn.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});
