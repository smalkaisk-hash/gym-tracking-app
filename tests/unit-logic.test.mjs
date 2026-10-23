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

import fs from 'fs';
import { loadApp } from './qa/load-app.mjs';

const A = await loadApp();
const {
  sanitizePrefs, DEFAULT_PREFS, GOAL_CARD_STYLES,
  rowToWorkout, workoutToRow, rowToBW, bwToRow, supabaseEnabled,
  num, volumeOf,
  toDisplayWeight, fromInputWeight, fromInputReps, fromInputBodyWeight,
  trim1, fmtWeight, fmtVolume, fmtDuration, fmtDurationWords, metricValueLabel,
  startOfDayMs, daysBetween,
  slug, idForName, exerciseIdOf,
  clampGoal, clampPct, labelForType,
  pick, bareMap,
  LB_PER_KG, KG_PER_LB, MAX_WEIGHT_KG, MAX_REPS,
  GOAL_MIN, GOAL_MAX, GOAL_DEFAULT,
  ACCENTS, FALLBACK_HEX,
  consentRowsFor, needsReconsentFor, reconsentDue,
  POLICY_VERSION, TERMS_VERSION, POLICIES_EFFECTIVE_FROM, PRIVACY_URL, TERMS_URL,
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

// ── The palette's hand-kept mirrors ───────────────────────────────────────────
// Each ACCENTS tone writes one colour TWICE per theme: an `accent` rgb triple that
// becomes the CSS token, and a `hex` of the same colour for the chart layer, which
// takes colour strings and not classes. Nothing in the type system or the bundler
// compares the two — they agree only because whoever added the tone typed it right
// both times, and a drift shows up as charts that are subtly the wrong colour while
// the UI is correct. That is the failure this block exists to catch.
{
  const rgbToHex = (triple) => {
    const parts = String(triple).trim().split(/\s+/).map(Number);
    if (parts.length !== 3 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return null;
    return '#' + parts.map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  for (const [id, tone] of Object.entries(ACCENTS)) {
    for (const theme of ['light', 'dark']) {
      const t = tone[theme];
      eq(`ACCENTS.${id}.${theme}: hex mirrors the rgb triple`,
        String(t.hex).toUpperCase(), rgbToHex(t.accent));
    }
  }
  // FALLBACK_HEX is DERIVED, not typed out — this asserts the derivation still points
  // at the colour an unresolved accent pref is supposed to land on. Written as a
  // literal it was a third copy of blue's dark hex, invisible to every other check.
  eq('FALLBACK_HEX is blue-dark, derived from the table', FALLBACK_HEX, ACCENTS.blue.dark.hex);
}

// ── consent: what the record contains, and when we ask again ─────────────────
// These three decide whether a user is asked to re-consent and what evidence the
// controller can produce under GDPR Art. 7(1). Both failure directions are real: too
// eager and every user meets a gate they shouldn't; too lax and a material change
// takes effect without the affirmative acceptance PRIVACY.md § 12 promises.
{
  const full = {
    health_data_consent_at: '2026-08-01T10:00:00.000Z',
    health_data_consent_version: POLICY_VERSION,
    terms_accepted_at: '2026-08-01T10:00:00.000Z',
    terms_version: TERMS_VERSION,
    age_confirmed_at: '2026-08-01T10:00:00.000Z',
  };

  eq('consentRowsFor: a complete record yields one row per kind', consentRowsFor('u1', full).length, 3);
  eq('consentRowsFor: kinds are the three the CHECK constraint allows',
    consentRowsFor('u1', full).map(r => r.kind).sort().join(','), 'age,health_data,terms');
  eq('consentRowsFor: the health-data row points at the policy actually shown',
    consentRowsFor('u1', full).find(r => r.kind === 'health_data').document, PRIVACY_URL);
  eq('consentRowsFor: the terms row points at the Terms',
    consentRowsFor('u1', full).find(r => r.kind === 'terms').document, TERMS_URL);
  eq('consentRowsFor: the row is filed against the calling user',
    consentRowsFor('u1', full)[0].user_id, 'u1');
  // A missing timestamp must yield NO row rather than a row with an invented date —
  // evidence of consent that nobody gave is worse than no evidence.
  eq('consentRowsFor: a missing timestamp records nothing',
    consentRowsFor('u1', { ...full, age_confirmed_at: undefined }).length, 2);
  eq('consentRowsFor: a blank timestamp records nothing',
    consentRowsFor('u1', { ...full, terms_accepted_at: '   ' }).length, 2);
  eq('consentRowsFor: garbage metadata yields no rows, not a throw', consentRowsFor('u1', null).length, 0);
  eq('consentRowsFor: a non-string version degrades to empty, not to "undefined"',
    consentRowsFor('u1', { ...full, terms_version: 7 }).find(r => r.kind === 'terms').version, '');

  // A timestamp that is a string but not a DATE is the dangerous one, and it is reachable:
  // this metadata is writable by the user it describes — which is the entire reason the
  // evidence table exists — and the three rows go in as ONE insert. Postgres rejects the
  // whole statement if any value is not a timestamp, so `age_confirmed_at: 'lol'` used to
  // stop the health-data and terms rows being filed as well, letting a user unilaterally
  // suppress the controller's own Art. 7(1) evidence. The bad row must drop out and the
  // other two must survive.
  eq('consentRowsFor: an unparseable timestamp drops only its own row',
    consentRowsFor('u1', { ...full, age_confirmed_at: 'lol' }).length, 2);
  eq('consentRowsFor: …and the surviving rows are the other two kinds',
    consentRowsFor('u1', { ...full, age_confirmed_at: 'lol' }).map(r => r.kind).sort().join(','),
    'health_data,terms');
  eq('consentRowsFor: a hostile timestamp cannot take the health-data row down with it',
    consentRowsFor('u1', { ...full, terms_accepted_at: "2026-01-01'); drop table consents;--" })
      .map(r => r.kind).sort().join(','), 'age,health_data');
  // Stored normalised, not as typed. Date.parse accepts forms Postgres does not, so the
  // insert must carry a value Postgres is guaranteed to take — and normalising also means
  // the client-side dedupe compares like with like against what comes back out.
  eq('consentRowsFor: a non-ISO but parseable date is stored normalised',
    consentRowsFor('u1', { ...full, age_confirmed_at: 'August 1, 2026 10:00:00 UTC' })
      .find(r => r.kind === 'age').granted_at, '2026-08-01T10:00:00.000Z');
  eq('consentRowsFor: an already-ISO date round-trips unchanged',
    consentRowsFor('u1', full).find(r => r.kind === 'terms').granted_at, '2026-08-01T10:00:00.000Z');

  eq('needsReconsentFor: current versions need nothing', needsReconsentFor(full), false);
  eq('needsReconsentFor: an old policy version asks again',
    needsReconsentFor({ ...full, health_data_consent_version: '0.9' }), true);
  eq('needsReconsentFor: an old terms version asks again',
    needsReconsentFor({ ...full, terms_version: '1.0' }), true);
  // No record at all is the case that matters most: an account with no evidence of
  // consent must be asked, not quietly assumed to have agreed.
  eq('needsReconsentFor: no record at all asks again', needsReconsentFor({}), true);
  eq('needsReconsentFor: null metadata asks again', needsReconsentFor(null), true);

  const day = 24 * 60 * 60 * 1000;
  const eff = Date.parse(POLICIES_EFFECTIVE_FROM);
  eq('reconsentDue: not due the day before the effective date', reconsentDue(eff - day), false);
  eq('reconsentDue: due exactly on the effective date', reconsentDue(eff), true);
  eq('reconsentDue: due after the effective date', reconsentDue(eff + day), true);
  // A typo in POLICIES_EFFECTIVE_FROM must not gate the entire user base out of the
  // app. Asking late is a smaller failure than asking at the wrong moment.
  eq('reconsentDue: an unparseable effective date is never due', reconsentDue(Date.now(), 'not-a-date'), false);
  eq('reconsentDue: a missing effective date is never due', reconsentDue(Date.now(), ''), false);
}

// ── sanitizePrefs: every untrusted field is pinned to a known-good value ──────
// prefs.base/accent/semantics index palette tables and goalCardStyle picks a tile
// branch — an unknown id used to blank the app on EVERY device, because the bad blob
// syncs through the server. fuzz.test.mjs proves the sanitiser stays total on junk;
// these pin what it must COMPUTE for specific bad inputs, which totality does not.
{
  eq('units: a bad stored value falls back to kg', sanitizePrefs({ units: 'stone' }).units, 'kg');
  eq('units: a good value passes through', sanitizePrefs({ units: 'lb' }).units, 'lb');
  eq('bwChart: unknown falls back to line', sanitizePrefs({ bwChart: 'pie' }).bwChart, 'line');
  eq('muscleMetric: unknown falls back to sets', sanitizePrefs({ muscleMetric: 'bogus' }).muscleMetric, 'sets');
  eq('goalCardStyle: unknown falls back to liquid', sanitizePrefs({ goalCardStyle: 'nope' }).goalCardStyle, 'liquid');
  check('goalCardStyle: a real style passes through',
    GOAL_CARD_STYLES.every((s) => sanitizePrefs({ goalCardStyle: s }).goalCardStyle === s));
  eq('accent: unknown id falls back to blue', sanitizePrefs({ accent: 'chartreuse' }).accent, 'blue');
  eq('base: unknown id falls back to graphite', sanitizePrefs({ base: 'plaid' }).base, 'graphite');
  eq('restSeconds: an off-scale value falls back to the default', sanitizePrefs({ restSeconds: 999 }).restSeconds, DEFAULT_PREFS.restSeconds);
  eq('restTimer: a non-boolean falls back to the default', sanitizePrefs({ restTimer: 'yes' }).restTimer, DEFAULT_PREFS.restTimer);
  eq('restTimer: a real boolean passes through', sanitizePrefs({ restTimer: false }).restTimer, false);
  eq('split: unknown id falls back to not-chosen', sanitizePrefs({ split: 'bogus' }).split, '');
  eq("split: '' (not chosen) is a legal value, not a fallback trigger", sanitizePrefs({ split: '' }).split, '');
  eq('name: trimmed', sanitizePrefs({ name: '  Sam  ' }).name, 'Sam');
  eq('name: a non-string becomes empty', sanitizePrefs({ name: 42 }).name, '');
  eq('gender: an unknown value becomes empty', sanitizePrefs({ gender: 'alien' }).gender, '');
  check('hidden: unknown widget keys are dropped, real ones kept', (() => {
    const h = sanitizePrefs({ hidden: ['dash.stats', 'bogus.key', 'dash.muscle'] }).hidden;
    return h.includes('dash.stats') && h.includes('dash.muscle') && !h.includes('bogus.key');
  })());
  eq('an unknown future field survives the merge (forward-compatible blob)',
    sanitizePrefs({ futureField: 7 }).futureField, 7);

  // Completeness guard: CLAUDE.md's rule "add a field to Prefs, add its sanitizePrefs
  // clause" had NO enforcement. sanitizePrefs spreads ...DEFAULT_PREFS, so a new field
  // added to DEFAULT_PREFS but not explicitly re-pinned would carry a hostile stored
  // value straight through — and nothing would fail. Assert every DEFAULT_PREFS key is
  // explicitly assigned in the sanitizer's return literal, not merely spread.
  const src = fs.readFileSync(new URL('../src/gym-tracker-app.tsx', import.meta.url), 'utf8');
  const body = src.slice(src.indexOf('const sanitizePrefs'), src.indexOf('const resolveThemeVars'));
  for (const key of Object.keys(DEFAULT_PREFS)) {
    check(`sanitizePrefs explicitly pins '${key}' (not just spread from DEFAULT_PREFS)`,
      new RegExp(`\\n\\s*${key}:`).test(body));
  }
}

// ── row ⇄ state mappers: exact field mapping, defaults, and both directions ───
// fuzz.test.mjs proves these mappers never throw and round-trip the happy path; it
// does NOT pin what they compute for ABSENT fields or assert rowToBW's output shape,
// so mutation testing found the default branches (`?? ''`, `?? []`, `?? null`) and the
// whole rowToBW direction unguarded. These assert every field and every conditional,
// in both directions, so a mapper that quietly drops a default or a column is caught.
{
  const sortKeys = (o) => JSON.stringify(o, Object.keys(o).sort());
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  // supabaseEnabled must be false with no env (the config-screen gate depends on it);
  // in the QA harness import.meta.env is empty, so url/anon are undefined.
  eq('supabaseEnabled is false without env', supabaseEnabled, false);

  // rowToWorkout: snake_case row → camelCase state, with defaults for absent fields.
  {
    const row = { id: 'w1', type: 'push', body_weight: 80.5, exercises: [{ name: 'Bench Press' }],
      date: '2026-01-01T10:00:00.000Z', notes: 'leg day', duration: 3600 };
    eq('rowToWorkout maps every field', sortKeys(rowToWorkout(row)),
      sortKeys({ id: 'w1', type: 'push', bodyWeight: 80.5, exercises: [{ name: 'Bench Press' }],
        date: '2026-01-01T10:00:00.000Z', notes: 'leg day', duration: 3600 }));
    eq('rowToWorkout: a null body_weight stays null (skipped weigh-in, not 0)', rowToWorkout({ body_weight: null }).bodyWeight, null);
    eq('rowToWorkout: missing exercises defaults to []', sortKeys(rowToWorkout({}).exercises), '[]');
    eq('rowToWorkout: missing notes defaults to empty string', rowToWorkout({}).notes, '');
    check('rowToWorkout: duration is omitted (not null) when absent', !has(rowToWorkout({}), 'duration'));
    eq('rowToWorkout: a real duration is carried through', rowToWorkout({ duration: 3600 }).duration, 3600);
    eq('rowToWorkout: duration 0 is a real value, carried through', rowToWorkout({ duration: 0 }).duration, 0);
  }

  // workoutToRow: camelCase state → snake_case row, with the write-direction defaults.
  {
    const w = { id: 'x', type: 'legs', bodyWeight: 72, exercises: [{ name: 'Squat' }],
      date: '2026-01-02T10:00:00.000Z', notes: 'n', duration: 1800 };
    eq('workoutToRow maps every real column (no id, no _sync)', sortKeys(workoutToRow(w)),
      sortKeys({ type: 'legs', body_weight: 72, exercises: [{ name: 'Squat' }],
        date: '2026-01-02T10:00:00.000Z', notes: 'n', duration: 1800 }));
    eq('workoutToRow: a skipped weigh-in is null, never 0', workoutToRow({ bodyWeight: null }).body_weight, null);
    eq('workoutToRow: missing bodyWeight defaults to null', workoutToRow({}).body_weight, null);
    eq('workoutToRow: missing exercises defaults to []', sortKeys(workoutToRow({}).exercises), '[]');
    eq('workoutToRow: missing notes defaults to empty string', workoutToRow({}).notes, '');
    eq('workoutToRow: missing duration defaults to null', workoutToRow({}).duration, null);
  }

  // rowToBW: the row → state direction the mutation run found entirely unasserted.
  {
    eq('rowToBW maps id/date/weight', sortKeys(rowToBW({ id: 'b1', date: 'd', weight: 80 })),
      sortKeys({ id: 'b1', date: 'd', weight: 80 }));
    eq('rowToBW: a linked workout_id surfaces as camelCase workoutId', rowToBW({ id: 'b1', date: 'd', weight: 80, workout_id: 'w1' }).workoutId, 'w1');
    check('rowToBW: workoutId is present only when the row is linked',
      has(rowToBW({ workout_id: 'w1' }), 'workoutId') && !has(rowToBW({ date: 'd', weight: 80 }), 'workoutId'));
    check('rowToBW: a null workout_id does not surface a workoutId key', !has(rowToBW({ workout_id: null }), 'workoutId'));
  }

  // bwToRow: the mirror. Also fuzzed, pinned here for the same default/branch reasons.
  {
    eq('bwToRow maps date/weight', sortKeys(bwToRow({ date: 'd', weight: 80 })), sortKeys({ date: 'd', weight: 80 }));
    eq('bwToRow: a workoutId is written as snake_case workout_id', bwToRow({ date: 'd', weight: 80, workoutId: 'w1' }).workout_id, 'w1');
    check('bwToRow: workout_id is emitted only when linked (pre-0001 / standalone omit it)',
      has(bwToRow({ workoutId: 'w1' }), 'workout_id') && !has(bwToRow({ date: 'd', weight: 80 }), 'workout_id'));
    check('bwToRow: a null workoutId does not emit a workout_id column', !has(bwToRow({ workoutId: null }), 'workout_id'));
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
