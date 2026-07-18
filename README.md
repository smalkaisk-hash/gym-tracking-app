# FitPulse

A personal gym tracking app — log push / pull / legs (and custom) workouts set by set,
weigh in, and watch strength and body weight trend over time. It started as a for-fun
personal project (just me and one other person using it), and is now being taken toward a
real product; see [PRODUCT-ROADMAP.md](PRODUCT-ROADMAP.md) for where that's going and why.

React + TypeScript + Vite + Tailwind on the front end, Supabase (Postgres) on the back.

## Why it's built the way it is

A few choices look unusual until you know the constraint behind them:

- **The whole UI is one file** — [src/gym-tracker-app.tsx](src/gym-tracker-app.tsx) (~4k
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

Prerequisites: Node.js (18+) and a Supabase project.

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

### One-time Supabase dashboard setup

The auth flows need a little dashboard configuration (redirect URLs, the email-confirmation
choice, optional email-template copy). It's a one-time walkthrough in
[SUPABASE-SETUP.md](SUPABASE-SETUP.md).

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc && vite build — tsc is the only typecheck (no separate script)
npm run preview   # serve the production build from dist/
```

`npm run build` is the only automated check — there's no linter or formatter, and the test
framework is just plain Node:

```bash
node tests/sync-merge.test.mjs         # offline sync-reconcile merge semantics
node tests/exercise-identity.test.mjs  # exercise-catalogue slug-collision guard
```

## Database

The schema is versioned in [supabase/migrations/](supabase/migrations/) (an ordered chain
with a runbook); [schema.sql](schema.sql) at the root is the flattened canonical state. The
development MCP connection is read-only, so migrations are applied by hand in the Supabase
SQL editor — see the [migrations README](supabase/migrations/README.md) for which files are
live on production and how to apply the pending ones.

Three tables, each RLS-scoped to the signed-in user: `workouts`, `body_weight_log`, and a
one-row-per-user `settings` (holding the weekly goal and a forward-compatible `prefs` JSON
blob). A `delete_account()` `SECURITY DEFINER` function backs self-service deletion.

## Documentation map

| File | What it covers |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Architecture, conventions, and the design system — the "why" behind the code |
| [PRODUCT-ROADMAP.md](PRODUCT-ROADMAP.md) | The plan for taking this from personal project to product, in data-safety order |
| [SUPABASE-SETUP.md](SUPABASE-SETUP.md) | One-time dashboard setup for the auth flows |
| [schema.sql](schema.sql) | Canonical Postgres schema, with design notes inline |
| [supabase/migrations/README.md](supabase/migrations/README.md) | Migration chain + apply runbook |
