// Import-path tests — the most dangerous path in the app, now executable.
//
// Run: `node tests/import.test.mjs`  (no framework — plain Node).
//
// importData replaces the whole account, and for a long time its decisions were only
// guarded by regex over the source because they lived in one React+Supabase closure.
// They are now two module-scope functions (src/gym-tracker-app.tsx):
//
//   planImport(raw, hasSession)      — PURE: decides what a file means, or refuses it.
//   runImportPlan(plan, db, uid)     — the DB sequencing against an injected client.
//
// This suite loads the REAL bytes through the QA harness (loadApp), drives planImport
// with hostile files and runImportPlan with a recording fake `db`, and asserts the two
// invariants that matter: a file that sanitises to nothing is REFUSED (the historical
// `{"workouts":[]}` wipe), and on ANY failure the old rows are never deleted — the
// account is left exactly as it was. A failure here is a bug in src/, not the test.

import { loadApp } from './qa/load-app.mjs';

const A = await loadApp();
const { planImport, runImportPlan } = A;

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  ok  ', name)) : (fail++, console.log('  FAIL', name)); };
const eq = (name, got, want) => check(`${name}  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`, Object.is(got, want));

// A valid workout that survives cleanImportedWorkout (parseable date, known type).
const validW = { date: '2026-01-01T00:00:00.000Z', type: 'push',
  exercises: [{ name: 'Bench Press', sets: [{ reps: 5, weight: 60 }] }] };
const validBW = { date: '2026-01-01T00:00:00.000Z', weight: 80 };

// ── planImport: what a file means, with no I/O ───────────────────────────────
console.log('\n── planImport — refuse or accept, purely');

eq('no session refuses', planImport({ workouts: [validW] }, false), null);
eq('non-object refuses', planImport('nonsense', true), null);
eq('null refuses', planImport(null, true), null);
eq('missing workouts array refuses', planImport({ bodyWeightLog: [validBW] }, true), null);
eq('workouts not an array refuses', planImport({ workouts: 'x' }, true), null);

// THE historical data-loss bug: an empty file must never be read as "wipe everything".
eq('empty workouts + no bw REFUSES (the {"workouts":[]} wipe)', planImport({ workouts: [] }, true), null);
eq('empty workouts + empty bw REFUSES', planImport({ workouts: [], bodyWeightLog: [] }, true), null);

// A non-empty workouts array that sanitises to nothing is corrupt, not a wipe.
eq('workouts present but all junk REFUSES', planImport({ workouts: [{ nope: 1 }, { date: 'not-a-date' }] }, true), null);

// Foreign / future files.
eq('foreign app refuses', planImport({ app: 'SomethingElse', workouts: [validW] }, true), null);
eq('future version refuses', planImport({ version: 2, workouts: [validW] }, true), null);

// Accepted shapes.
check('a valid file is accepted with its workout', (() => {
  const p = planImport({ app: 'FitPulse', version: 1, workouts: [validW] }, true);
  return p && p.workouts.length === 1 && p.bw.length === 0;
})());
check('an early export (no app/version) is still accepted', (() => {
  const p = planImport({ workouts: [validW] }, true);
  return p && p.workouts.length === 1;
})());
check('a body-weight-only import is accepted (not everyone logs lifts every backup)', (() => {
  const p = planImport({ workouts: [], bodyWeightLog: [validBW] }, true);
  return p && p.workouts.length === 0 && p.bw.length === 1;
})());
check('weeklyGoal is clamped and prefs sanitised in the plan', (() => {
  const p = planImport({ workouts: [validW], weeklyGoal: 999, prefs: { units: 'stone', goalCardStyle: 'nope' } }, true);
  return p && p.goal >= A.GOAL_MIN && p.goal <= A.GOAL_MAX
    && (p.prefs.units === 'kg' || p.prefs.units === 'lb')
    && A.GOAL_CARD_STYLES.includes(p.prefs.goalCardStyle);
})());
check('a hostile backup does not pollute Object.prototype through the plan', (() => {
  planImport(JSON.parse('{"workouts":[{"date":"2026-01-01T00:00:00.000Z","type":"push","exercises":[]}],"__proto__":{"pwned":1}}'), true);
  return ({}).pwned === undefined;
})());

// ── runImportPlan: insert-before-delete, roll back on failure ────────────────
console.log('\n── runImportPlan — ordering and rollback against a fake db');

// A recording fake Supabase client. Chains resolve to {data,error}; every call is
// logged in order, so we can assert the sequencing and which ids were deleted.
const makeDb = (opts = {}) => {
  const calls = [];
  const old = opts.old || {};                 // pre-existing row ids per table
  const insertIds = opts.insertIds || {};     // ids assigned to inserted rows
  const fail = opts.fail || {};               // force an error for `${op}:${table}`
  const from = (table) => {
    const q = { table, op: null, payload: null };
    q.select = () => { if (!q.op) q.op = 'select'; return q; };   // insert().select() keeps 'insert'
    q.eq = () => q;
    q.in = (_col, ids) => { q.payload = ids; return q; };
    q.insert = (rows) => { q.op = 'insert'; q.payload = rows; return q; };
    q.upsert = (obj) => { q.op = 'upsert'; q.payload = obj; return q; };
    q.delete = () => { q.op = 'delete'; return q; };
    const run = () => {
      const key = `${q.op}:${q.table}`;
      calls.push({ key, table: q.table, op: q.op, ids: q.op === 'delete' ? q.payload : undefined });
      if (fail[key]) return { data: null, error: { message: `forced ${key}` } };
      if (q.op === 'select') return { data: (old[q.table] || []).map((id) => ({ id })), error: null };
      if (q.op === 'insert') {
        const n = Array.isArray(q.payload) ? q.payload.length : 0;
        const ids = insertIds[q.table] || Array.from({ length: n }, (_, i) => `new-${q.table}-${i}`);
        return { data: ids.slice(0, n).map((id) => ({ id })), error: null };
      }
      return { data: null, error: null };   // delete, upsert
    };
    q.then = (res, rej) => Promise.resolve().then(run).then(res, rej);
    return q;
  };
  return { db: { from }, calls };
};

const OLD = { old: { workouts: ['old-w-0', 'old-w-1'], body_weight_log: ['old-bw-0'] },
  insertIds: { workouts: ['new-w-0'], body_weight_log: ['new-bw-0'] } };
const plan1 = { workouts: [validW], bw: [validBW], goal: 3, prefs: A.DEFAULT_PREFS };
const oldIds = ['old-w-0', 'old-w-1', 'old-bw-0'];
const deletedIds = (calls) => calls.filter((c) => c.op === 'delete').flatMap((c) => c.ids || []);
const noOldDeleted = (calls) => !deletedIds(calls).some((id) => oldIds.includes(id));

// Happy path: inserts + upsert all land, THEN the old rows are deleted, in that order.
{
  const { db, calls } = makeDb(OLD);
  const out = await runImportPlan(plan1, db, 'u1');
  check('happy path returns the server-assigned rows',
    out.wRows[0].id === 'new-w-0' && out.bwRows[0].id === 'new-bw-0');
  const lastWrite = Math.max(...calls.map((c, i) => (c.op === 'insert' || c.op === 'upsert' ? i : -1)));
  const firstOldDelete = calls.findIndex((c) => c.op === 'delete' && (c.ids || []).some((id) => oldIds.includes(id)));
  check('every insert/upsert happens before any old-row delete', lastWrite < firstOldDelete);
  check('all three old rows are deleted once the writes succeed',
    oldIds.every((id) => deletedIds(calls).includes(id)));
}

// Workouts insert fails: nothing else runs, old rows are untouched.
{
  const { db, calls } = makeDb({ ...OLD, fail: { 'insert:workouts': true } });
  let threw = false;
  try { await runImportPlan(plan1, db, 'u1'); } catch { threw = true; }
  check('workouts insert failure throws (import reports false)', threw);
  check('…and no old row was deleted (account left intact)', noOldDeleted(calls));
  check('…and the body-weight insert never ran', !calls.some((c) => c.key === 'insert:body_weight_log'));
}

// Body-weight insert fails: the already-inserted workouts are rolled back; old rows intact.
{
  const { db, calls } = makeDb({ ...OLD, fail: { 'insert:body_weight_log': true } });
  let threw = false;
  try { await runImportPlan(plan1, db, 'u1'); } catch { threw = true; }
  check('body-weight insert failure throws', threw);
  check('…and the inserted workouts are rolled back', deletedIds(calls).includes('new-w-0'));
  check('…and no old row was deleted', noOldDeleted(calls));
}

// Settings upsert fails: both inserts rolled back; old rows intact.
{
  const { db, calls } = makeDb({ ...OLD, fail: { 'upsert:settings': true } });
  let threw = false;
  try { await runImportPlan(plan1, db, 'u1'); } catch { threw = true; }
  check('settings upsert failure throws', threw);
  check('…and both inserted sets are rolled back',
    deletedIds(calls).includes('new-w-0') && deletedIds(calls).includes('new-bw-0'));
  check('…and no old row was successfully carried past the failure', noOldDeleted(calls));
}

// The old-row delete fails: it must THROW, not swallow the error and report success
// (the exact regression — a discarded delete error doubled history on next hydrate).
{
  const { db } = makeDb({ ...OLD, fail: { 'delete:workouts': true } });
  let threw = false;
  try { await runImportPlan(plan1, db, 'u1'); } catch { threw = true; }
  check('a failed old-row delete throws instead of claiming success', threw);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
