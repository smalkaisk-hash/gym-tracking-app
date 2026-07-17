# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FitPulse — a personal gym tracking app (React + TypeScript + Vite + Tailwind). Per the README, it's a for-fun personal project, not a product. It has a Supabase (Postgres) backend with email + password auth — open signup, forgot-password reset, and change-password in Settings (which requires the current password — see below) — and every table is RLS-scoped to `auth.uid()`. There is still no client-side router: the auth screens (`LoginScreen`, `ResetPasswordScreen`, `OnboardingScreen`, config/loader) are pre-render gates in `GymTrackerApp`, and in-app navigation is the `currentScreen` string. The server is the source of truth; localStorage is an offline read cache and the one-time migration source.

One-time Supabase dashboard setup (auth redirect URLs, email-confirmation choice, templates) is documented in [SUPABASE-SETUP.md](SUPABASE-SETUP.md); branded copies of the confirm-signup and reset-password email templates live in [email-templates/](email-templates/). Neither is wired into the build — they're paste-into-the-dashboard references.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc && vite build  — tsc is the only typecheck; there is no separate typecheck script
npm run preview   # serve the production build from dist/
```

There is no test framework, linter, or formatter installed. `npm run build` is the only automated check, so run it after non-trivial edits. The one exception: `node tests/sync-merge.test.mjs` runs a plain-Node assertion test of the offline sync-reconcile logic (no framework) — run it if you touch the `mergeUnsynced` hydrate logic, and keep the copy in that file in step with the app. If a broader test harness is wanted, it still has to be added first.

**Database schema** is versioned in `supabase/migrations/` (see its README); `schema.sql` at the root is the flattened canonical state. The dev MCP is read-only, so migrations are applied by hand in the Supabase SQL editor — `0001` (weigh-in FK) is prepared but not yet applied to production.

## Architecture

**The entire app is one file: [src/gym-tracker-app.tsx](src/gym-tracker-app.tsx).** [src/main.tsx](src/main.tsx) mounts it and imports the self-hosted font weights. Adding a feature means editing the one file, not creating new ones — match that convention unless the user asks to split things up.

In file order: constants → `useTheme` → `SetRow` → `ExerciseCard` → `WorkoutScreen` → `HistoryScreen` → `ProgressScreen` → `GymTrackerApp` (the default export, at the bottom).

**Routing is a string, not a router.** `GymTrackerApp` holds `currentScreen` state with five values: `home`, `enterBodyWeight`, `workout`, `history`, `progress`. Each screen is a `{currentScreen === 'x' && ...}` block in the return. `home` and `enterBodyWeight` are written inline; the other three delegate to the screen components. The bottom tab bar renders only outside the `workout` and `enterBodyWeight` screens, so an in-progress workout can't be navigated away from by accident.

**Pre-render gates run before `currentScreen`.** In order: config-missing → `!authReady` loader → `recovery` (`ResetPasswordScreen`) → `!session` (`LoginScreen`) → onboarding → the app. Onboarding is two gates: `!hydrated && !prefs.name` renders `OnboardingScreen` in its `loading` state (inputs locked) so the frame stays on screen during hydrate instead of flashing the dashboard, then `needsOnboarding` renders the interactive card. `needsOnboarding` is set by the hydrate effect when there's no server settings row (`isFirstLogin`, captured before migration reassigns it); it collects name/units/gender via one `updatePrefs` and drops the gate. Sign-out clears both `hydrated` and `needsOnboarding`. The `!prefs.name` guard keeps a returning user (cached name) on their instant cache-painted dashboard.

**All state lives in `GymTrackerApp` and flows down as props.** No context, no reducer, no state library. Child components take `({ ... }: any)` — prop types are deliberately untyped throughout, and `strict` is off in tsconfig. Don't add types piecemeal to one component and leave the rest; either the user wants a typing pass or they don't.

**Persistence is Supabase (source of truth) with localStorage as an offline read cache.** Three Postgres tables — `workouts`, `body_weight_log`, `settings` (schema in [schema.sql](schema.sql)) — each RLS-scoped to `auth.uid()`. State keeps the app's original camelCase shapes; rows are snake_case, mapped at the boundary in [src/supabase.ts](src/supabase.ts). Writes are optimistic: mutate state → a write-back `useEffect` persists to localStorage → the same handler awaits the Supabase call.

localStorage holds these keys (each of the first four has its own write-back `useEffect`):

| Constant | Key | Holds |
| --- | --- | --- |
| `STORAGE_KEY` | `gym-workouts` | the workouts array |
| `BW_LOG_KEY` | `gym-bw-log` | body weight log |
| `GOAL_KEY` | `gym-weekly-goal` | weekly workout goal (int) |
| `PREFS_KEY` | `gym-prefs` | user prefs blob |
| `ACTIVE_KEY` | `gym-active-session` | in-progress workout, so a refresh can't lose it |
| `THEME_KEY` | `gym-theme` | `light` / `dark`, only once the user picks a side |
| (direct) | `gym-theme-vars` | resolved palette for both themes, stamped by [index.html](index.html) before first paint |

On mount: a load effect paints the cache synchronously; then, once a Supabase session appears, a **hydrate** effect fetches server rows and *replaces* state (`setWorkouts(rows.map(rowToWorkout))`). First login on an account with no server data runs a one-time localStorage → Supabase migration. Be careful with effect order: the write effects also fire on mount with empty initial state, and it's only safe because the load effect reads synchronously first. An early return or reorder in the load effect can wipe stored data.

**Prefs is a forward-compatible blob.** `DEFAULT_PREFS` is the schema; `prefs` (the `gym-prefs` cache and the `settings.prefs` JSON column) is merged over it on load (`{ ...DEFAULT_PREFS, ...saved }`), so adding a field never breaks older data. Profile fields `name` and `gender` (both `''` = not set) live here alongside `units` etc. — `name` doubles as the onboarding sentinel (empty = un-onboarded) and drives the home-screen `Hi, {name}` greeting. Write through `updatePrefs(patch)`, which merges and triggers the localStorage + debounced Supabase write-backs.

**Change-password requires the current password.** The Supabase project has "Require current password when changing password" enabled, so `changePassword(currentPassword, newPassword)` passes `current_password` to `updateUser` (cast to `any` — not in supabase-js's typed attributes). Omitting it 400s with `current_password_required`; `authErrorText` maps that (and the "must differ" rule) to friendly copy. The Settings form collects current + new + confirm.

**Offline sync safety (roadmap Phase 0, implemented).** Rows carry a client-only `_sync` marker — `'pending'` (write in flight), `'error'` (saved on this device only), absent (server-confirmed). It's never sent to Postgres (the mappers in [src/supabase.ts](src/supabase.ts) pick only real columns) and it survives the localStorage cache across a reload — so if you add a field to the bodyWeightLog cache mapper (`withId` in the load effect), carry `_sync` through or a failed weigh-in loses its mark. **Hydrate merges, it does not replace:** it prefers a local unsynced edit over the stale server row (same id) and re-appends an unsynced insert whose id never reached the server; only the migration path plain-replaces. Failures surface as a header banner (count of device-only changes), a per-row "Not synced" chip in History, and a transient toast for self-healing failures. There is still no automatic retry/outbox — a failed write uploads on the next successful write/hydrate, not on its own; a real outbox is Phase 2.

**Data shapes** (implicit — there are no interfaces):

```
workout       { id: uuid, type, bodyWeight, exercises[], date: ISO string, notes, duration? }
exercise      { name, exerciseId, sets[], notes }   // exerciseId (slug) is the identity; name is display
set           { reps: int, weight: float | null }   // null = bodyweight, never 0
bodyWeightLog [{ id: uuid, date: ISO string, weight }]
```

`exerciseId` is a stable slug stamped at write time (`idForName`); rows logged before it existed have only `name`, and reads derive the same id via `exerciseIdOf` (`ex.exerciseId ?? idForName(ex.name)`), so legacy and new rows unify without a backfill.

`duration` (seconds) is present only when the session timer was on. A weigh-in links to its session by exact `date` string equality (`body_weight_log.date === workouts.date`) — the client still relies on this in `updateWorkout`/`deleteWorkout`. A real `body_weight_log.workout_id` FK is prepared (migration `0001`, not yet applied; the app doesn't read/write it yet). `deleteWorkout` now removes the paired finish-time weigh-in (local + server) so it isn't orphaned — matched by date, which the FK cascade will also enforce once `0001` is live.

**A set's `weight` is nullable.** Exercises in `BODYWEIGHT_OPTIONAL` (currently the `CORE` group) can be logged with reps alone, storing `weight: null` — bodyweight, which is distinct from a real 0. Anything reading `weight` must handle it: use `?? 0` for arithmetic (`volumeOf` already relies on `|| 0`), `?? ''` to keep an input controlled, and `!= null` before treating it as a number. `parseFloat('')` is `NaN`, so blank input is normalised to `null` at both write sites — `addSet` and `updateSetValue`.

**Workout identity is the row `id` (uuid).** `deleteWorkout(id)` and `updateWorkout(id, ...)` key by uuid — the Supabase row id, back-filled with `crypto.randomUUID()` for cache entries that predate ids and for optimistic temp rows before the insert returns. `HistoryScreen` resolves `workouts[originalIndex].id` after sorting/filtering and passes the id back, so a reordered subset still routes to the right row. (Exercise identity, by contrast, is still the *name string* — see the "Never rename" convention below; that's the model weakness Phase 1 of [PRODUCT-ROADMAP.md](PRODUCT-ROADMAP.md) addresses.)

## Conventions

- **Exercise catalogue**: `EXERCISES` maps each workout type (`push` / `pull` / `legs`) to an ordered list of `{ group, items }` — the groups are muscle groups, and they're the picker's structure. `CORE` and `CARDIO` are shared: they're appended to all three days, since neither belongs to one. `ALL_GROUPS` (used by `custom`) strips the shared groups out and re-appends them last, rather than deduping in place — dedupe-in-place would leave them at push's position, mid-list. Exercise names must stay unique across all groups: `ALL_GROUPS` flattens them and they're used as React keys.
- **Renaming an exercise is now safe if you pin its id.** Identity is the stable `exerciseId` (slug of the *original* name), not the display string — stamped into stored workouts and used to key `ProgressScreen`'s dropdown/series and the muscle grouping (`groupForExercise`). To rename: change the name in the catalogue **and** add an `EXERCISE_ID_OVERRIDES` entry pinning the new name to the *original* slug (e.g. `{ 'Side Lateral Raise': 'lateral-raises' }`), so old and new sessions share one identity. Renaming the string *without* pinning still orphans history — the override is the supported path. Removing an exercise still orphans its history (nothing maps the id). Adding is always free. `node tests/exercise-identity.test.mjs` guards against a new name slug-colliding with an existing one.
- The picker's one input does triple duty: it matches a **muscle group** (typing "chest" opens the whole Chest group), otherwise filters **exercise names**, and the **+** button commits whatever was typed as a one-off. Groups with no match drop out rather than leaving a bare heading.
- **`TYPE_CONFIG`** maps workout type → `{ label, Icon, color, iconBg }` and is the single place that decides how a type is labeled and rendered. Add a workout type here, not in scattered conditionals. Lookups fall back to `TYPE_CONFIG.custom`.
- Charts are recharts (`LineChart`), icons are lucide-react. Both are already imported at the top.
- Mobile-first: layouts are `max-w-*` centered with `sm:` breakpoints, and `.pb-safe` in [src/index.css](src/index.css) handles the iOS home indicator.

## Design system

**Never write a raw colour.** The palette is CSS custom properties in [src/index.css](src/index.css), exposed to Tailwind as semantic colour names in [tailwind.config.js](tailwind.config.js): `ground`, `surface`, `raised`, `line`, `ink`, `muted`, `faint`, `accent`, `accent-ink`, and the semantic `good` / `warn` / `crit`. Use `bg-surface`, `text-muted`, `border-line` — never `bg-zinc-900`. To retheme, edit the tokens, not the components.

Palette source is calibrated Olympic plates: the accent is the 20kg blue, and `good` / `warn` / `crit` are the 10kg green, 15kg yellow, and 25kg red. Neutrals are graphite with a cyan-blue bias taken from bar steel. Keep new colours inside that system rather than introducing a hue from elsewhere.

**Themes are token-level.** `:root` holds light, `@media (prefers-color-scheme: dark)` redefines the tokens, and `:root[data-theme='light'|'dark']` overrides both directions for the in-app toggle. Style through tokens only; never put component rules inside the media query. All four blocks must define the same token set — add a token to one, add it to all four. [index.html](index.html) stamps the saved theme before first paint to avoid a flash.

**Shared class strings** at the top of the app file: `card`, `input`, `btnPrimary`, `btnSecondary`, `btnDanger`, plus `label` (uppercase caption) and `readout` (a number meant to be read at arm's length). Prefer these over ad-hoc classes.

**Type**: Barlow (UI) + Barlow Condensed (`font-display` — numerals, headings, labels), self-hosted via `@fontsource` so the app works offline. Weights are imported individually in [src/main.tsx](src/main.tsx) — importing a weight that isn't there silently falls back, so add the import when you use a new one. Digits use `tabular-nums`.

**Radii** are semantic and deliberately tight: `rounded-card` (10px), `rounded-ctl` (6px), `rounded-chip` (3px). Don't reach for Tailwind's default `rounded-lg`/`rounded-2xl`.

**Motion is minimal.** The only custom animation is `.animate-fade-rise` (a gentle fade+rise for auth/onboarding cards, keyframed in [src/index.css](src/index.css)); the global reduced-motion rule neutralises it. Add new motion the same way — a token-level utility, honoring reduced-motion — rather than inline transitions.

**Recharts takes colour strings, not classes**, so the tokens are mirrored in the `CHART` object as hex per theme. It's the one place hex is allowed — if you change a token's value, update `CHART` to match, or the charts drift from the UI. Chart-bearing components need the resolved `theme` passed down.

**Editing Tailwind config requires a dev-server restart.** Vite caches it; `@apply` of a new token will 500 with "class does not exist" until you restart, even though `npm run build` (a fresh process) succeeds. Don't chase that error in the source.
