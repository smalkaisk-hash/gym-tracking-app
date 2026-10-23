// Stable exercise-identity tests (roadmap Phase 1, option A).
//
// Run: `node tests/exercise-identity.test.mjs`  (no framework — plain Node).
//
// Two jobs:
//  1. Prove the identity semantics (legacy rows unify, a pinned rename stays linked,
//     a stored id beats the display name) using the REAL slug/idForName/exerciseIdOf
//     and the REAL EXERCISE_ID_OVERRIDES table — loaded out of src/ via the QA harness.
//     This used to mirror the helpers by hand, and the mirror had drifted: it gave
//     idForName an `overrides` PARAMETER the shipping function never had (it reads the
//     module-level EXERCISE_ID_OVERRIDES via `pick`), so the rename-safety cases proved
//     a guarantee about an API that does not exist.
//  2. Guard against a future catalogue edit introducing a slug collision, a starter
//     template or muscle override naming a non-catalogue exercise, or a rename override
//     pinning a display name that isn't in the catalogue — read from the real source.
//
// A failure here is a bug in src/, not a drifted copy.

import fs from 'fs';
import { loadApp } from './qa/load-app.mjs';

const A = await loadApp();
const { slug, idForName, exerciseIdOf, EXERCISE_ID_OVERRIDES } = A;

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  ok  ', name)) : (fail++, console.log('  FAIL', name)); };

// 1 — slug is deterministic and stable-shaped (the real slug)
check('slug is deterministic', slug('Bench Press') === 'bench-press' && slug('Bench Press') === slug('Bench Press'));
check('slug strips punctuation/edges', slug('  Push-ups!! ') === 'push-ups');

// 2 — a legacy row (name only, no id) derives the SAME id the write path stores now
{
  const written = { name: 'Bench Press', exerciseId: idForName('Bench Press') };
  const legacy  = { name: 'Bench Press' };   // logged before ids existed
  check('legacy row unifies with new row', exerciseIdOf(written) === exerciseIdOf(legacy));
}

// 3 — stored id always wins over the name (so a display relabel never moves history)
{
  const relabelled = { name: 'Totally Different Label', exerciseId: 'bench-press' };
  check('stored id beats name', exerciseIdOf(relabelled) === 'bench-press');
}

// 4 — RENAME safety, tested through the REAL override mechanism rather than a fake
//     parameter. Every entry in EXERCISE_ID_OVERRIDES must be HONORED by idForName
//     (the renamed display name resolves to the pinned original slug), so a session
//     logged under the new name shares one identity with pre-rename history. The table
//     is empty today, which makes this vacuously true — but it is now a real guard that
//     fires the moment a rename is added, against the function that actually ships.
{
  const entries = Object.entries(EXERCISE_ID_OVERRIDES);
  check('every rename override is honored by idForName (new name → pinned id)',
    entries.every(([name, id]) => idForName(name) === id));
  check('every pinned id is a non-empty slug-shaped string',
    entries.every(([, id]) => typeof id === 'string' && /^[a-z0-9-]+$/.test(id)));
  check(`EXERCISE_ID_OVERRIDES is consulted by the real idForName (${entries.length} entries)`,
    entries.length === 0 || entries.every(([name]) => exerciseIdOf({ name }) === idForName(name)));
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

// 5 — catalogue slug-collision guard (reads the real source, uses the real slug)
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

// 8 — every EXERCISE_ID_OVERRIDES key is a current catalogue name. The override pins a
//     RENAMED display name to the original's slug, so the key must be the name actually
//     in the catalogue now; an entry for a name that was never added (or later removed)
//     pins nothing and silently orphans history.
{
  const known = new Set(catalogueNames);
  const stray = Object.keys(EXERCISE_ID_OVERRIDES).filter(k => !known.has(k));
  if (stray.length) console.log('     override key not in catalogue:', JSON.stringify(stray));
  check(`rename overrides name real catalogue exercises (${Object.keys(EXERCISE_ID_OVERRIDES).length})`, stray.length === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
