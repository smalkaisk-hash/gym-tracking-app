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

// 5 — catalogue slug-collision guard (reads the real source)
{
  const src = fs.readFileSync(new URL('../src/gym-tracker-app.tsx', import.meta.url), 'utf8').split(/\r?\n/);
  const region = src.slice(25, 217).join('\n');   // CORE/CARDIO/EXERCISES catalogue block
  const groupLabels = new Set();
  for (const m of region.matchAll(/group:\s*'([^']+)'/g)) groupLabels.add(m[1]);
  const names = [];
  for (const m of region.matchAll(/'([^']+)'/g)) if (!groupLabels.has(m[1])) names.push(m[1]);
  const bySlug = {};
  for (const n of names) (bySlug[slug(n)] ||= []).push(n);
  const collisions = Object.entries(bySlug).filter(([, ns]) => new Set(ns).size > 1);
  if (collisions.length) for (const [s, ns] of collisions) console.log('     collision:', s, JSON.stringify([...new Set(ns)]));
  check(`catalogue has no slug collisions (${names.length} names)`, collisions.length === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
