import { defineConfig, devices } from '@playwright/test';

// Screenshot-regression baseline for the app's front-door screens — the "silent
// rewrite" guard from the security review. These are the auth screens, which is
// everything reachable without a live Supabase session; they render with no
// network call, so the suite is hermetic.
//
// The dev server is booted with DUMMY Supabase env (below) so a test run can never
// reach the real backend: supabaseEnabled is true (we get LoginScreen, not the
// config screen), but nothing is contacted until a form is submitted, which these
// tests never do.
//
// First run writes the PNG baselines under tests/e2e/__screenshots__ and passes.
// Commit those. Later runs fail if a screen changes — regenerate intentionally with
// `npm run test:e2e -- --update-snapshots` and eyeball the diff before committing.
const PORT = 4317;

export default defineConfig({
  testDir: './tests/e2e',
  // Pixel diffs are brittle across machines; allow a tiny ratio so anti-aliasing
  // noise doesn't fail a run, while a real layout change still trips it.
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 420, height: 900 },  // mobile-first, matches the app's max-w
  },
  projects: [
    { name: 'light', use: { ...devices['Desktop Chrome'], colorScheme: 'light' } },
    { name: 'dark',  use: { ...devices['Desktop Chrome'], colorScheme: 'dark' } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Dummy creds — take priority over .env.local so the run is hermetic. The
    // LoginScreen makes no request on load, so these are never dialed.
    env: {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_e2e_dummy',
      VITE_SENTRY_DSN: '',
    },
  },
});
