# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FitPulse — a personal gym tracking app (React + TypeScript + Vite + Tailwind). Per the README, it's a for-fun personal project, not a product. It is client-only: no backend, no API, no auth, no router.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc && vite build  — tsc is the only typecheck; there is no separate typecheck script
npm run preview   # serve the production build from dist/
```

There is no test framework, linter, or formatter installed. `npm run build` is the only automated check, so run it after non-trivial edits. Don't invent a `npm test` — if tests are wanted, the harness has to be added first.

## Architecture

**The entire app is one file: [src/gym-tracker-app.tsx](src/gym-tracker-app.tsx).** [src/main.tsx](src/main.tsx) mounts it and imports the self-hosted font weights. Adding a feature means editing the one file, not creating new ones — match that convention unless the user asks to split things up.

In file order: constants → `useTheme` → `SetRow` → `ExerciseCard` → `WorkoutScreen` → `HistoryScreen` → `ProgressScreen` → `GymTrackerApp` (the default export, at the bottom).

**Routing is a string, not a router.** `GymTrackerApp` holds `currentScreen` state with five values: `home`, `enterBodyWeight`, `workout`, `history`, `progress`. Each screen is a `{currentScreen === 'x' && ...}` block in the return. `home` and `enterBodyWeight` are written inline; the other three delegate to the screen components. The bottom tab bar renders only outside the `workout` and `enterBodyWeight` screens, so an in-progress workout can't be navigated away from by accident.

**All state lives in `GymTrackerApp` and flows down as props.** No context, no reducer, no state library. Child components take `({ ... }: any)` — prop types are deliberately untyped throughout, and `strict` is off in tsconfig. Don't add types piecemeal to one component and leave the rest; either the user wants a typing pass or they don't.

**Persistence is localStorage, four keys.** The first three each have their own write-back `useEffect`:

| Constant | Key | Holds |
| --- | --- | --- |
| `STORAGE_KEY` | `gym-workouts` | the workouts array |
| `BW_LOG_KEY` | `gym-bw-log` | body weight log |
| `GOAL_KEY` | `gym-weekly-goal` | weekly workout goal (int) |
| `THEME_KEY` | `gym-theme` | `light` / `dark`, only once the user picks a side |

A single mount effect loads the first three, and back-fills `bodyWeightLog` from existing workouts' `bodyWeight` when `gym-bw-log` is absent (migration for data written before the log existed). Be careful with effect order here: the write effects also fire on mount with empty initial state, and it's only safe because the load effect reads synchronously first. An early return or reorder in the load effect can wipe stored data.

**Data shapes** (implicit — there are no interfaces):

```
workout       { type, bodyWeight, exercises[], date: ISO string, notes }
exercise      { name, sets[], notes }
set           { reps: int, weight: float | null }   // null = bodyweight, never 0
bodyWeightLog [{ date: ISO string, weight }]
```

**A set's `weight` is nullable.** Exercises in `BODYWEIGHT_OPTIONAL` (currently the `CORE` group) can be logged with reps alone, storing `weight: null` — bodyweight, which is distinct from a real 0. Anything reading `weight` must handle it: use `?? 0` for arithmetic (`volumeOf` already relies on `|| 0`), `?? ''` to keep an input controlled, and `!= null` before treating it as a number. `parseFloat('')` is `NaN`, so blank input is normalised to `null` at both write sites — `addSet` and `updateSetValue`.

**Array index is workout identity** — there are no IDs. `deleteWorkout(i)` and `updateWorkout(i, ...)` index straight into the `workouts` array. `HistoryScreen` displays workouts sorted newest-first, so it tags each with `originalIndex` before sorting and passes *that* back to the mutators. Any new list view that reorders or filters must do the same, or it will edit the wrong workout.

## Conventions

- **Exercise catalogue**: `EXERCISES` maps each workout type (`push` / `pull` / `legs`) to an ordered list of `{ group, items }` — the groups are muscle groups, and they're the picker's structure. `CORE` and `CARDIO` are shared: they're appended to all three days, since neither belongs to one. `ALL_GROUPS` (used by `custom`) strips the shared groups out and re-appends them last, rather than deduping in place — dedupe-in-place would leave them at push's position, mid-list. Exercise names must stay unique across all groups: `ALL_GROUPS` flattens them and they're used as React keys.
- **Never rename or remove an exercise.** The name string is the identity used in stored workouts and in `ProgressScreen`'s dropdown, so renaming one orphans it from every session logged under the old name. Add freely; leave existing names alone (this is why the generic `Leg Curl` still sits beside `Seated Leg Curl`).
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

**Recharts takes colour strings, not classes**, so the tokens are mirrored in the `CHART` object as hex per theme. It's the one place hex is allowed — if you change a token's value, update `CHART` to match, or the charts drift from the UI. Chart-bearing components need the resolved `theme` passed down.

**Editing Tailwind config requires a dev-server restart.** Vite caches it; `@apply` of a new token will 500 with "class does not exist" until you restart, even though `npm run build` (a fresh process) succeeds. Don't chase that error in the source.
