// Reconcile-logic test for the offline sync safety layer (roadmap Phase 0).
//
// Run: `node tests/sync-merge.test.mjs`  (no framework — plain Node assertions).
//
// This mirrors `mergeUnsynced` from src/gym-tracker-app.tsx VERBATIM. The app keeps
// its state logic inline in the one big component, so this can't import it directly;
// if you change the merge in the app, change it here too. (Extracting the reconcile
// helpers into an importable module — so this stops being a copy — is a worthwhile
// follow-up once the file gets split.)
//
// The merge is the code that stops silent offline data loss, so it's the one piece
// that must never regress quietly.

const rowToWorkout = (r) => ({ id: r.id, type: r.type, date: r.date });   // stand-in mapper (no _sync)

// `knownIds` = the row ids that existed when the fetch was ISSUED. It's what lets
// "absent from the server" mean "deleted remotely" instead of "written after the
// snapshot was taken" — a row inserted while the fetch was in flight is legitimately
// missing from it and must not be dropped.
const mergeUnsynced = (serverRows, mapRow, prev, knownIds = new Set(prev.map(r => r.id))) => {
  const unsynced = prev.filter(r => r._sync);
  const byId = new Map(unsynced.map(r => [r.id, r]));
  const serverIds = new Set(serverRows.map(r => r.id));
  const serverDates = new Set(serverRows.map(r => r.date));
  const merged  = serverRows.map(r => byId.get(r.id) ?? mapRow(r));
  // An unsynced insert whose id never reached the server is re-appended — UNLESS a
  // server row already carries its exact date (the insert committed, we lost the
  // ack), which would otherwise duplicate the row.
  const orphans = unsynced.filter(r => !serverIds.has(r.id) && !serverDates.has(r.date));
  // Rows that appeared after the fetch was issued, mark or no mark.
  const fresh = prev.filter(r =>
    !r._sync && !knownIds.has(r.id) && !serverIds.has(r.id) && !serverDates.has(r.date));
  return [...merged, ...orphans, ...fresh];
};

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
