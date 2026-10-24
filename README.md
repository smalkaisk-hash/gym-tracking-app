# FitPulse

A gym tracking app — log push / pull / legs (and custom) workouts set by set,
weigh in, and watch strength and body weight trend over time. It started as a for-fun
personal project (just me and one other person using it) and is now a production app
being released on Google Play for real users; see [PRODUCT-ROADMAP.md](PRODUCT-ROADMAP.md)
for how it got there and what remains.

React + TypeScript + Vite + Tailwind on the front end, Supabase (Postgres) on the back.

## Why it's built the way it is

A few choices look unusual until you know the constraint behind them:

- **The whole UI is one file** — [src/gym-tracker-app.tsx](src/gym-tracker-app.tsx) (~6.8k
  lines). Not an accident: at one contributor it keeps everything in one place with no
  import archaeology. Splitting it is deferred until there's a second editor
  ([PRODUCT-ROADMAP.md](PRODUCT-ROADMAP.md), "Deliberately deferred"). Adding a feature
  means editing that file, not adding new ones.
- **No client-side router.** Navigation is a `currentScreen` string; the auth/onboarding
  screens are pre-render gates. A router is more machinery than a six-screen app needs.
- **Supabase is the source of truth; localStorage is an offline read cache.** The cache
  paints instantly on load so the app is usable before the network answers, then a hydrate
  step reconciles against the server. This is also what lets a logged-while-offline workout
  survive — see the sync-safety notes in [CLAUDE.md](CLAUDE.md).
- **Postgres `date` columns are `TEXT`, and `exercises` is a JSONB document.** Both are
  deliberate and explained inline in [schema.sql](schema.sql) — the app treats a workout
  date as an opaque ISO string it wants back byte-for-byte, and a workout is one document
  it never queries into server-side.

The deeper "why" for every non-obvious decision lives in [CLAUDE.md](CLAUDE.md) — it's the
architecture guide, not just an agent prompt. Read it before making structural changes.

## What it does

- **Log a workout** — pick a type (push / pull / legs / custom), add exercises from a
  muscle-grouped catalogue, and record each set's reps and weight. Core exercises can be
  logged bodyweight-only (reps, no weight). Optional per-session rest timer and workout
  timer; per-exercise and per-workout notes. An in-progress session is saved to
  localStorage so a refresh can't lose it.
- **Weigh in** — standalone quick weigh-ins, or a finish-time weigh-in attached to the
  workout you just logged.
- **History** — every past workout, editable and deletable, with a "not synced" chip on
  any change that only saved to this device.
- **Progress** — per-exercise strength charts and a body-weight trend, keyed by a stable
  exercise identity so renaming an exercise doesn't orphan its history.
- **Accounts** — email + password auth: open signup (with optional email confirmation),
  forgot-password reset, in-app change password (requires the current one), and
  self-service account deletion. First login runs a one-time onboarding (name / units /
  gender) and migrates any local-only data up to the server.
- **Themes** — light / dark / follow-system, stamped before first paint so there's no
  flash.

## Getting started

Prerequisites: Node.js **20.19+ or 22.12+** (what Vite 8 requires — CI pins 22) and a
Supabase project.

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
npm run dev                  # Vite dev server at http://localhost:5173
```

If `.env.local` is missing or blank the app renders a config screen instead of crashing,
so you'll know the env vars aren't wired up.

### Configuration

Two environment variables, read at build time by Vite (only `VITE_`-prefixed vars reach the
browser). Copy [.env.example](.env.example) to `.env.local` (gitignored) and fill in from
your Supabase dashboard → **Project Settings → API**:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Base project URL, e.g. `https://YOUR-ref.supabase.co` — **no** `/rest/v1/` suffix |
| `VITE_SUPABASE_ANON_KEY` | The anon / publishable key |

The anon key is safe to ship to the browser **only** because every table is Row Level
Security–scoped to `auth.uid()` (see [src/supabase.ts](src/supabase.ts) and
[schema.sql](schema.sql)). Never disable RLS.

Two further variables are **optional** (both listed, blank, in [.env.example](.env.example)):

| Variable | Value |
| --- | --- |
| `VITE_SENTRY_DSN` | Error tracking. Blank = disabled: with no DSN the app loads no Sentry code and makes no network calls. Turning it on is also a legal edit — `npm run build` fails if a DSN is set while `PRIVACY.md` still says reporting is off. |
| `VITE_DEV_AUTH_BYPASS` | **Dev only.** `1` skips the login screen and lands in the app with seeded demo data. Gated on Vite's `DEV` flag, so it folds to a no-op in a production build and can never ship enabled. Leave blank for normal auth. |

### One-time Supabase dashboard setup

The auth flows need a little dashboard configuration (redirect URLs, the email-confirmation
choice, optional email-template copy). It's a one-time walkthrough in
[SUPABASE-SETUP.md](SUPABASE-SETUP.md).

## Commands

```bash
npm run dev       # Vite dev server
npm run legal     # publish legal/*.md → public/*.html (policies, terms, deletion page, FAQ)
npm run build     # legal && check:monitoring && check:backups && check:restore-drill && tsc && vite build — tsc is the only typecheck
npm run preview   # serve the production build from dist/
npm test          # the six Node assertion suites, in order
npm run backup    # logical JSON backup of all five public tables — see BACKUP-RESTORE.md
npm run restore   # restore a backup (scratch target by default; --force-prod to overwrite prod)
npm run test:e2e  # Playwright screenshot baselines for the auth screens
```

There's no linter or formatter, and no test framework — the suites are plain Node
assertion scripts. `npm run build && npm test` is the full check. The suites are also
runnable one at a time, which is what you want while iterating on one of them:

```bash
node tests/unit-logic.test.mjs         # value assertions for the pure helpers + prefs/mapper domains
node tests/import.test.mjs             # the account-replacing import path: refusal rules + insert-before-delete/rollback
node tests/sync-merge.test.mjs         # offline sync-reconcile merge semantics (the real extracted fn)
node tests/exercise-identity.test.mjs  # exercise-catalogue slug-collision guard + identity semantics
node tests/legal-pages.test.mjs        # published policies exist, are current, leak nothing
node tests/qa/fuzz.test.mjs            # fuzz + guards over the real src/ bytes
```

`tests/qa/load-app.mjs` compiles and exercises the actual shipping source rather than a
copy — `unit-logic`, `import`, `sync-merge`, `exercise-identity` and `fuzz` all run the
real `src/` bytes through it, so a failure in any of them is a bug in `src/`, not a broken
test.

**Beyond `npm test`** there are three checks that need infrastructure, so they're run on
demand rather than in the no-secrets gate:

```bash
npm run test:e2e       # Playwright screenshot baselines for the auth screens
npm run test:e2e:flow  # Playwright FUNCTIONAL smoke (login-bypass → routing → data export)
npm run test:rls       # cross-tenant RLS integration test — proves the authorization model
npm run test:mutation  # Stryker mutation run, scoped to src/supabase.ts
```

- Both Playwright suites need a browser (one-time `npx playwright install chromium`).
  Re-baseline the screenshots deliberately with `npm run test:e2e -- --update-snapshots`.
  The functional flow boots the dev server with `VITE_DEV_AUTH_BYPASS=1` via its own
  [`playwright.flow.config.ts`](playwright.flow.config.ts), so it never touches a backend.
- `npm run test:rls` creates and deletes auth users, so it needs `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` and a **disposable** target
  (`supabase start`, or a scratch project with `RLS_TEST_ALLOW_REMOTE=1`). It refuses a
  non-local URL by default — never point it at production.
- `npm run test:mutation` grades the suite by mutating `src/supabase.ts` and re-running
  `npm test` per mutant (Stryker is installed as a dev dependency).

### CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `legal:check` → `build` →
`test` on every push and pull request, with no secrets. The order matters: `legal:check`
must run *before* the build, because the build's first step regenerates `public/*.html` and
would paper over a page that was committed stale.

`npm run release:check` (the launch gate — placeholders, unverified claims, open decisions)
is a separate **manual** job in that workflow. It fails by design until launch, and a CI
that is always red is a CI nobody reads; run it from the Actions tab, and fold it into the
required job once it passes for the first time.

The Playwright baselines are Windows-rasterised (`*-win32.png`) and are deliberately **not**
in CI — see the note at the foot of the workflow.

## Database

The schema is versioned in [supabase/migrations/](supabase/migrations/) (an ordered chain
with a runbook); [schema.sql](schema.sql) at the root is the flattened canonical state. The
development MCP connection is read-only, so migrations are applied by hand in the Supabase
SQL editor — see the [migrations README](supabase/migrations/README.md) for which files are
live on production and how to apply the pending ones.

Three app tables, each RLS-scoped to the signed-in user: `workouts`, `body_weight_log`, and a
one-row-per-user `settings` (holding the weekly goal and a forward-compatible `prefs` JSON
blob). A `delete_account()` `SECURITY DEFINER` function backs self-service deletion. Two
further RLS-scoped tables hold compliance records — `consents` (append-only consent
evidence) and `dormancy_notices` — so `public` has five tables in all; the backup covers
every one.

## Security

A quick tour of the model — the depth is in [CLAUDE.md](CLAUDE.md), [schema.sql](schema.sql)
and [PRIVACY.md](legal/PRIVACY.md).

- **Row Level Security on every table.** Each row is scoped to `auth.uid()`, so a signed-in
  user can only ever read or write their own data. This is why shipping the anon key in the
  browser is safe — authorization lives in the database, not in the client. A cross-tenant
  integration test (`npm run test:rls`) exercises the model against a disposable project.
- **Secrets stay server-side.** Only `VITE_`-prefixed vars reach the browser (just the URL +
  anon key); `.env.local` is gitignored, and the `service_role` key is never in client code.
- **Auth.** Email + password via Supabase. Changing a password requires the current one,
  and account deletion is self-service (a `SECURITY DEFINER` function that removes every row).
- **Untrusted input is validated at the edge and on read.** Numbers, dates and row shapes are
  checked before they're stored, and again when they're read back — so a malformed or
  oversized row (e.g. written directly via the API) degrades gracefully instead of crashing
  the app. Server-side `CHECK` constraints back this up as defence-in-depth (see the
  [migrations README](supabase/migrations/README.md)).
- **The offline cache is owner-tagged.** Cached data is stamped with the user id it belongs
  to and cleared on a genuine account change or sign-out, so a shared device can't leak one
  account's data to another.
- **No third-party tracking by default.** Error reporting is off unless a DSN is explicitly
  configured, and turning it on is gated against the privacy policy (`npm run build` fails if
  the two disagree). The app ships no analytics or ad SDKs.

This is a surface overview, not a formal audit; see [LEGAL-LIABILITY-AUDIT.md](LEGAL-LIABILITY-AUDIT.md)
and the `compliance/` records for the accountability side.

## Documentation map

| File | What it covers |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Architecture, conventions, and the design system — the "why" behind the code |
| [PRODUCT-ROADMAP.md](PRODUCT-ROADMAP.md) | The plan for taking this from personal project to product, in data-safety order |
| [SUPABASE-SETUP.md](SUPABASE-SETUP.md) | One-time dashboard setup for the auth flows |
| [schema.sql](schema.sql) | Canonical Postgres schema, with design notes inline |
| [supabase/migrations/README.md](supabase/migrations/README.md) | Migration chain + apply runbook |
| [legal/](legal/) | The published pages as source. `TERMS.md`, `PRIVACY.md`, `CONSUMER-HEALTH-DATA-PRIVACY.md`, `DELETE-ACCOUNT.md` and `FAQ.md` are published to `public/*.html` by `npm run legal` (`FAQ.md` is informational, not a contract); `TERMS-RATIONALE.md` and `PRIVACY-POLICY-GUIDE.md` are internal reasoning and are never published |

The published pages are generated, so **edit `legal/*.md`, never `public/*.html`** — the next
`npm run legal` (which `npm run build` runs first) would overwrite the hand edit, and
`node tests/legal-pages.test.mjs` fails while the two are out of step.
