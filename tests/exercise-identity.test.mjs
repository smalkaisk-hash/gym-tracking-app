// Stable exercise-identity tests (roadmap Phase 1, option A).
//
// Run: `node tests/exercise-identity.test.mjs`  (no framework — plain Node).
//
// Two jobs:
//  1. Mirror the identity helpers from src/gym-tracker-app.tsx and prove the semantics
//     (legacy rows unify, renames stay linked when the id is pinned).
//  2. Guard against a future catalogue edit introducing a slug collision — this reads
//     the actual source so a new exercise that slugs into an existing one fails CI.
//
// If you change `slug` / `idForName` / `exerciseIdOf` in the app, change them here too.

import fs from 'fs';

// ── helpers mirrored from the app ────────────────────────────────────────────
const slug = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const EXERCISE_ID_OVERRIDES = {};   // populated in the rename scenario below
const idForName   = (name, overrides = EXERCISE_ID_OVERRIDES) => overrides[name] || slug(name) || name;
const exerciseIdOf = (ex, overrides = EXERCISE_ID_OVERRIDES) => ex.exerciseId ?? idForName(ex.name, overrides);

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  ok  ', name)) : (fail++, console.log('  FAIL', name)); };

// 1 — slug is deterministic and stable-shaped
check('slug is deterministic', slug('Bench Press') === 'bench-press' && slug('Bench Press') === slug('Bench Press'));
check('slug strips punctuation/edges', slug('  Push-ups!! ') === 'push-ups');

// 2 — a legacy row (name only, no id) derives the SAME id the write path stores now
{
  const written = { name: 'Bench Press', exerciseId: idForName('Bench Press') };
  const legacy  = { name: 'Bench Press' };   // logged before ids existed
  check('legacy row unifies with new row', exerciseIdOf(written) === exerciseIdOf(legacy));
}

// 3 — RENAME safety: pin the id to the slug of the ORIGINAL name; old + new sessions share it
{
  const overrides = { 'Side Lateral Raise': 'lateral-raises' };   // renamed from 'Lateral Raises'
  const oldRow = { name: 'Lateral Raises' };                                        // logged pre-rename, no id
  const newRow = { name: 'Side Lateral Raise', exerciseId: idForName('Side Lateral Raise', overrides) };
  check('renamed exercise stays one identity', exerciseIdOf(oldRow, overrides) === exerciseIdOf(newRow, overrides));
  check('pinned id equals original slug', exerciseIdOf(newRow, overrides) === 'lateral-raises');
}

// 4 — stored id always wins over the name (so a display relabel never moves history)
{
  const relabelled = { name: 'Totally Different Label', exerciseId: 'bench-press' };
  check('stored id beats name', exerciseIdOf(relabelled) === 'bench-press');
}

// The real catalogue, sliced out by marker (not line number — the file moves).
const src = fs.readFileSync(new URL('../src/gym-tracker-app.tsx', import.meta.url), 'utf8');
const between = (from, to) => src.slice(src.indexOf(from), src.indexOf(to));

const catalogueNames = (() => {
  const region = between('const CORE', 'const ALL_GROUPS');
  const groupLabels = new Set();
  for (const m of region.matchAll(/group:\s*'([^']+)'/g)) groupLabels.add(m[1]);
  const names = [];
  for (const m of region.matchAll(/'([^']+)'/g)) if (!groupLabels.has(m[1])) names.push(m[1]);
  return names;
})();

// 5 — catalogue slug-collision guard (reads the real source)
{
  const bySlug = {};
  for (const n of catalogueNames) (bySlug[slug(n)] ||= []).push(n);
  const collisions = Object.entries(bySlug).filter(([, ns]) => new Set(ns).size > 1);
  if (collisions.length) for (const [s, ns] of collisions) console.log('     collision:', s, JSON.stringify([...new Set(ns)]));
  check(`catalogue has no slug collisions (${catalogueNames.length} names)`, collisions.length === 0);
}

// 6 — every STARTER_TEMPLATES name is a real catalogue name. A typo there would
//     still log fine, but as a one-off with its own id — so its history would never
//     join up with the catalogue exercise it was meant to be.
{
  const known = new Set(catalogueNames);
  const region = between('const STARTER_TEMPLATES', 'const starterExercises');
  const used = [...region.matchAll(/'([^']+)'/g)].map(m => m[1]);
  const unknown = [...new Set(used.filter(n => !known.has(n)))];
  if (unknown.length) console.log('     not in catalogue:', JSON.stringify(unknown));
  check(`starter templates use catalogue names (${used.length} names)`, unknown.length === 0);
}

// 7 — every MUSCLE_OVERRIDES_BY_NAME key is a real catalogue name. A typo (or a name
//     moved between groups and mis-keyed) fails silently: the exercise just keeps its
//     group default and quietly scores as the wrong muscle in the donut.
{
  const known = new Set(catalogueNames);
  const region = between('const MUSCLE_OVERRIDES_BY_NAME', 'const muscleForCatalogueName');
  const keys = [...region.matchAll(/'([^']+)':\s*'/g)].map(m => m[1]);
  const unknown = keys.filter(k => !known.has(k));
  if (unknown.length) console.log('     not in catalogue:', JSON.stringify(unknown));
  check(`muscle overrides name real exercises (${keys.length} overrides)`, unknown.length === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
