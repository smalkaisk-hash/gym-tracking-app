// Reconcile-logic test for the offline sync safety layer (roadmap Phase 0).
//
// Run: `node tests/sync-merge.test.mjs`  (no framework — plain Node assertions).
//
// This USED to mirror `mergeUnsynced` from src/gym-tracker-app.tsx verbatim, which
// could only ever prove the copy right. It now imports the REAL function out of the
// app with the QA harness (extractFn brace-matches the nested helper and compiles it
// standalone), so the named scenarios A–H below exercise the shipping bytes. A failure
// here is a bug in src/, not a drifted copy.
//
// The merge is the code that stops silent offline data loss, so it's the one piece
// that must never regress quietly. tests/qa/fuzz.test.mjs fuzzes the same real function;
// this file documents the specific intended cases in a readable form.

import { extractFn } from './qa/load-app.mjs';

const mergeUnsynced = await extractFn('mergeUnsynced');
const rowToWorkout = (r) => ({ id: r.id, type: r.type, date: r.date });   // stand-in mapper (no _sync)

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  ok  ', name)) : (fail++, console.log('  FAIL', name)); };

// A — offline INSERT: local temp row marked error, not on server → must survive
{
  const out = mergeUnsynced([], rowToWorkout, [{ id: 'temp-1', type: 'push', date: 'd1', _sync: 'error' }]);
  check('offline insert survives hydrate', out.length === 1 && out[0].id === 'temp-1');
}
// B — offline EDIT: id IS on server but stale; local error copy must win
{
  const out = mergeUnsynced([{ id: 'r1', type: 'push', date: 'd1' }], rowToWorkout, [{ id: 'r1', type: 'legs', date: 'd1', _sync: 'error' }]);
  check('offline edit beats stale server row', out.length === 1 && out[0].type === 'legs');
}
// C — SYNCED row (mark cleared): server is source of truth, no duplication
{
  const out = mergeUnsynced([{ id: 'r1', type: 'push', date: 'd1' }], rowToWorkout, [{ id: 'r1', type: 'push', date: 'd1', _sync: undefined }]);
  check('synced row not duplicated', out.length === 1);
}
// D — row DELETED on another device: synced locally (no mark), absent on server → drop
{
  const out = mergeUnsynced([], rowToWorkout, [{ id: 'r1', type: 'push', date: 'd1' }]);
  check('remote delete propagates', out.length === 0);
}
// E — mixed: synced kept from server, offline insert kept local, remote-added appears
{
  const out = mergeUnsynced(
    [{ id: 'r1', type: 'push', date: 'd1' }, { id: 'r9', type: 'legs', date: 'd9' }],
    rowToWorkout,
    [{ id: 'r1', type: 'push', date: 'd1' }, { id: 'temp-2', type: 'pull', date: 'd2', _sync: 'error' }],
  );
  check('mixed set reconciles', out.map(r => r.id).sort().join(',') === 'r1,r9,temp-2');
}
// F — LOST ACK: the insert actually committed (server row carries the temp row's
// date under a real id) but the client saw an error and kept the temp as an orphan.
// The orphan must be dropped so the workout isn't duplicated.
{
  const out = mergeUnsynced(
    [{ id: 'r5', type: 'push', date: 'd5' }],
    rowToWorkout,
    [{ id: 'temp-5', type: 'push', date: 'd5', _sync: 'error' }],
  );
  check('lost-ack orphan deduped by date', out.length === 1 && out[0].id === 'r5');
}
// G — a row saved WHILE the hydrate fetch was in flight: absent from the server
// snapshot and carrying no _sync mark, but it wasn't in knownIds, so it must survive.
// (Pressing Finish during a token-refresh hydrate used to lose the session outright.)
{
  const out = mergeUnsynced(
    [{ id: 'r1', type: 'push', date: 'd1' }],
    rowToWorkout,
    [{ id: 'r1', type: 'push', date: 'd1' }, { id: 'r2', type: 'legs', date: 'd2' }],
    new Set(['r1']),                     // r2 did not exist when the fetch was issued
  );
  check('row inserted during hydrate survives', out.map(r => r.id).sort().join(',') === 'r1,r2');
}
// H — the mirror case: a row present when the fetch was issued and gone from the
// server was genuinely deleted, so a stale snapshot must not resurrect it.
{
  const out = mergeUnsynced([], rowToWorkout, [], new Set(['r1']));
  check('locally deleted row is not resurrected', out.length === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
