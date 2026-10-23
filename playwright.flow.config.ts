import { defineConfig, devices } from '@playwright/test';

// Config for the FUNCTIONAL smoke flow (tests/e2e/flow.spec.ts), kept separate from
// playwright.config.ts (the auth-screen screenshot baselines) so a pixel re-baseline
// and a behaviour test never share a run or a webServer.
//
// The dev server is booted with VITE_DEV_AUTH_BYPASS=1 so the app skips LoginScreen
// and seeds demo data, plus DUMMY Supabase env so supabaseEnabled is true (we get the
// app, not ConfigError) while nothing ever reaches a real backend. The bypass is
// gated on import.meta.env.DEV, so this only works under `vite dev`, never a build.
const PORT = 4318;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /flow\.spec\.ts$/,            // only the functional flow, not the screenshots
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 420, height: 900 },
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_e2e_dummy',
      VITE_SENTRY_DSN: '',
      VITE_DEV_AUTH_BYPASS: '1',
    },
  },
});
