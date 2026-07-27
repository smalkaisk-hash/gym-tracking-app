// Business-logic unit tests — value assertions for the app's pure helpers.
//
// Run: `node tests/unit-logic.test.mjs`  (no framework — plain Node).
//
// The other suites cover different things: tests/qa/fuzz.test.mjs proves these
// functions are TOTAL (never throw, stay in range) on hostile input, while
// exercise-identity/sync-merge document two specific subsystems. This file is the
// missing middle — the JUnit-style "given input X, expect exactly Y" pass over the
// core conversion / formatting / math utilities, so a refactor that keeps a
// function total but quietly changes what it COMPUTES is caught here.
//
// It runs the real shipping bytes: loadApp() (from the QA harness) reads
// src/gym-tracker-app.tsx, stubs its imports and exports every top-level binding —
// so the functions and the MAX_*/GOAL_* constants below are the ones that ship, not
// a mirror. A failure here is a bug in src/, not in the test.

import { loadApp } from './qa/load-app.mjs';

const A = await loadApp();
const {
  num, volumeOf,
  toDisplayWeight, fromInputWeight, fromInputReps, fromInputBodyWeight,
  trim1, fmtWeight, fmtVolume, fmtDuration, fmtDurationWords, metricValueLabel,
  startOfDayMs, daysBetween,
  slug, idForName, exerciseIdOf,
  clampGoal, clampPct, labelForType,
  pick, bareMap,
  LB_PER_KG, KG_PER_LB, MAX_WEIGHT_KG, MAX_REPS,
  GOAL_MIN, GOAL_MAX, GOAL_DEFAULT,
} = A;

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  ok  ', name)) : (fail++, console.log('  FAIL', name)); };
const eq  = (name, got, want) => check(`${name}  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`, Object.is(got, want));
const near = (name, got, want, tol = 1e-6) =>
  check(`${name}  (got ${got}, want ≈${want})`, typeof got === 'number' && Math.abs(got - want) <= tol);

// ── num: the NaN/Infinity absorber every volume readout depends on ────────────
eq('num passes a finite number', num(42), 42);
eq('num passes a finite float', num(2.5), 2.5);
eq('num zeroes NaN', num(NaN), 0);
eq('num zeroes Infinity', num(Infinity), 0);
eq('num zeroes -Infinity', num(-Infinity), 0);
eq('num zeroes a numeric string', num('5'), 0);   // strings are not numbers here by design
eq('num zeroes null', num(null), 0);
eq('num zeroes undefined', num(undefined), 0);

// ── volumeOf: reps × weight summed, null weight contributing 0 ────────────────
eq('volume of one set', volumeOf({ sets: [{ reps: 10, weight: 80 }] }), 800);
eq('volume sums sets', volumeOf({ sets: [{ reps: 10, weight: 80 }, { reps: 5, weight: 100 }] }), 1300);
eq('bodyweight set (null weight) adds 0', volumeOf({ sets: [{ reps: 12, weight: null }] }), 0);
eq('no sets array is 0 volume', volumeOf({}), 0);
eq('a NaN weight does not poison the sum', volumeOf({ sets: [{ reps: 10, weight: 80 }, { reps: 5, weight: NaN }] }), 800);

// ── unit conversion: stored kg ⇄ displayed lb, null preserved as bodyweight ────
eq('kg displays unchanged in kg', toDisplayWeight(100, 'kg'), 100);
near('kg displays as lb', toDisplayWeight(100, 'lb'), 100 * LB_PER_KG);
eq('null stays null in kg', toDisplayWeight(null, 'kg'), null);
eq('null stays null in lb (bodyweight, never 0 lb)', toDisplayWeight(null, 'lb'), null);

// ── fromInputWeight: the ONE gate keyboard → database ─────────────────────────
eq('typed kg stored as kg', fromInputWeight('80', 'kg'), 80);
near('typed lb stored as kg', fromInputWeight('100', 'lb'), 100 * KG_PER_LB);
eq('blank is null (bodyweight-optional)', fromInputWeight('', 'kg'), null);
eq('whitespace-only is null', fromInputWeight('   ', 'kg'), null);
eq('negative is rejected to null', fromInputWeight('-50', 'kg'), null);
eq('non-finite (1e400) rejected to null', fromInputWeight('1e400', 'kg'), null);
eq('over the ceiling rejected to null', fromInputWeight(String(MAX_WEIGHT_KG + 1), 'kg'), null);
eq('exactly the ceiling is allowed', fromInputWeight(String(MAX_WEIGHT_KG), 'kg'), MAX_WEIGHT_KG);
eq('non-string input is null', fromInputWeight(42, 'kg'), null);
// round-trip: what displays as N lb parses back to the same stored kg
near('lb round-trips through display and input',
  fromInputWeight(String(toDisplayWeight(80, 'lb')), 'lb'), 80, 1e-6);

// ── fromInputReps: whole number in range, else 0 ──────────────────────────────
eq('typed reps parse', fromInputReps('8'), 8);
eq('reps truncate toward zero', fromInputReps('8.9'), 8);
eq('zero reps is 0 (unusable set)', fromInputReps('0'), 0);
eq('negative reps is 0', fromInputReps('-3'), 0);
eq('blank reps is 0', fromInputReps(''), 0);
eq('reps clamp to MAX_REPS', fromInputReps(String(MAX_REPS + 5)), MAX_REPS);

// ── fromInputBodyWeight: never null-as-bodyweight, never 0 ────────────────────
eq('body weight parses', fromInputBodyWeight('75', 'kg'), 75);
eq('blank body weight is null', fromInputBodyWeight('', 'kg'), null);
eq('zero body weight is rejected (mistype, not a data point)', fromInputBodyWeight('0', 'kg'), null);

// ── trim1 / fmtWeight ─────────────────────────────────────────────────────────
eq('trim1 drops a trailing .0', trim1(80.0), '80');
eq('trim1 keeps one decimal', trim1(80.25), '80.3');
eq('trim1 of non-finite is "0" not "NaN"', trim1(NaN), '0');
eq('fmtWeight of null is Bodyweight', fmtWeight(null, 'kg'), 'Bodyweight');
eq('fmtWeight appends units', fmtWeight(80, 'kg'), '80 kg');

// ── fmtVolume: per-unit abbreviation, always ends in a unit ───────────────────
eq('small kg volume prints in full', fmtVolume(800, 'kg'), '800 kg');
eq('kg volume abbreviates at 1000', fmtVolume(2500, 'kg'), '2.5k kg');
eq('lb volume under 100000 prints in full', fmtVolume(2000, 'lb'), `${Math.round(2000 * LB_PER_KG)} lb`);
eq('non-finite volume is 0, not NaN', fmtVolume(NaN, 'kg'), '0 kg');

// ── fmtDuration: M:SS, then H:MM:SS past the hour, boundaries exact ───────────
eq('duration under a minute', fmtDuration(45), '0:45');
eq('duration pads seconds', fmtDuration(65), '1:05');
eq('59s is 0:59', fmtDuration(59), '0:59');
eq('exactly one hour rolls to H:MM:SS', fmtDuration(3600), '1:00:00');
eq('3599s is still M:SS', fmtDuration(3599), '59:59');
eq('an hour and change', fmtDuration(3661), '1:01:01');
eq('non-finite duration is 0:00', fmtDuration(NaN), '0:00');
eq('negative duration clamps to 0:00', fmtDuration(-5), '0:00');

// ── fmtDurationWords ──────────────────────────────────────────────────────────
eq('seconds under a minute', fmtDurationWords(45), '45s');
eq('whole minutes', fmtDurationWords(47 * 60), '47 min');
eq('an hour with minutes', fmtDurationWords(3900), '1h 5m');
eq('an exact hour drops the minutes', fmtDurationWords(3600), '1h');
eq('59s stays seconds', fmtDurationWords(59), '59s');

// ── metricValueLabel: pluralisation per metric ────────────────────────────────
eq('one session is singular', metricValueLabel('sessions', 1, 'kg'), '1 session');
eq('two sessions plural', metricValueLabel('sessions', 2, 'kg'), '2 sessions');
eq('one set singular', metricValueLabel('sets', 1, 'kg'), '1 set');
eq('volume metric defers to fmtVolume', metricValueLabel('volume', 800, 'kg'), '800 kg');

// ── startOfDayMs / daysBetween: DST-safe calendar-day math ────────────────────
{
  const d = new Date(2026, 6, 24, 23, 59, 30);        // a late-evening local time
  const midnight = new Date(2026, 6, 24, 0, 0, 0, 0).getTime();
  eq('startOfDayMs strips the time to local midnight', startOfDayMs(d), midnight);
}
eq('same instant is 0 days', daysBetween(1000, 1000), 0);
eq('24h apart is 1 day', daysBetween(24 * 3600e3, 0), 1);
eq('48h apart is 2 days', daysBetween(48 * 3600e3, 0), 2);
// The whole reason daysBetween rounds instead of dividing: a two-calendar-day gap
// that spans a DST fall-back is 49h of wall time, and 49/24 = 2.04 — a naive floor
// or a `> 2` check would call the streak broken. Rounding keeps it at 2.
eq('49h (DST fall-back two-day gap) still rounds to 2, not >2', daysBetween(49 * 3600e3, 0), 2);
eq('47h (DST spring-forward) also rounds to 2', daysBetween(47 * 3600e3, 0), 2);

// ── slug / idForName / exerciseIdOf ───────────────────────────────────────────
eq('slug lowercases and hyphenates', slug('Bench Press'), 'bench-press');
eq('slug strips edge punctuation', slug('  Push-ups!! '), 'push-ups');
eq('idForName slugs a plain name', idForName('Bench Press'), 'bench-press');
eq('exerciseIdOf prefers a stored id', exerciseIdOf({ name: 'Whatever', exerciseId: 'bench-press' }), 'bench-press');
eq('exerciseIdOf derives from name when no id', exerciseIdOf({ name: 'Bench Press' }), 'bench-press');

// ── clampGoal / clampPct ──────────────────────────────────────────────────────
eq('goal in range is unchanged', clampGoal(4), 4);
eq('goal below min clamps up', clampGoal(0), GOAL_MIN);
eq('goal above max clamps down', clampGoal(99), GOAL_MAX);
eq('non-finite goal falls back to default', clampGoal(NaN), GOAL_DEFAULT);
eq('pct clamps to 0..100 low', clampPct(-10), 0);
eq('pct clamps to 0..100 high', clampPct(150), 100);
eq('pct in range unchanged', clampPct(63), 63);

// ── labelForType: user day-name overrides win, else the config label ──────────
eq('a renamed day shows the user label', labelForType('push', { push: 'Chest Day' }), 'Chest Day');
eq('an un-renamed day falls back to config', typeof labelForType('push', {}), 'string');
check('un-renamed push has a non-empty label', labelForType('push', {}).length > 0);

// ── pick / bareMap: prototype-key safety on user-keyed dictionaries ───────────
eq('pick reads an own property', pick({ push: 1 }, 'push'), 1);
eq('pick refuses a prototype key (__proto__)', pick({ push: 1 }, '__proto__'), undefined);
eq('pick refuses constructor', pick({ push: 1 }, 'constructor'), undefined);
eq('pick refuses toString', pick({ push: 1 }, 'toString'), undefined);
{
  const m = bareMap();
  m['__proto__'] = 'v';                     // on a null-proto map this is a plain own key
  eq('bareMap has no prototype', Object.getPrototypeOf(m), null);
  eq('bareMap stores a __proto__ key as data', m['__proto__'], 'v');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
