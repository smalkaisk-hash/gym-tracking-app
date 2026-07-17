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

const rowToWorkout = (r) => ({ id: r.id, type: r.type });   // stand-in mapper (no _sync)

const mergeUnsynced = (serverRows, mapRow, prev) => {
  const unsynced = prev.filter(r => r._sync);
  const byId = new Map(unsynced.map(r => [r.id, r]));
  const serverIds = new Set(serverRows.map(r => r.id));
  const merged  = serverRows.map(r => byId.get(r.id) ?? mapRow(r));
  const orphans = unsynced.filter(r => !serverIds.has(r.id));
  return [...merged, ...orphans];
};

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  ok  ', name)) : (fail++, console.log('  FAIL', name)); };

// A — offline INSERT: local temp row marked error, not on server → must survive
{
  const out = mergeUnsynced([], rowToWorkout, [{ id: 'temp-1', type: 'push', _sync: 'error' }]);
  check('offline insert survives hydrate', out.length === 1 && out[0].id === 'temp-1');
}
// B — offline EDIT: id IS on server but stale; local error copy must win
{
  const out = mergeUnsynced([{ id: 'r1', type: 'push' }], rowToWorkout, [{ id: 'r1', type: 'legs', _sync: 'error' }]);
  check('offline edit beats stale server row', out.length === 1 && out[0].type === 'legs');
}
// C — SYNCED row (mark cleared): server is source of truth, no duplication
{
  const out = mergeUnsynced([{ id: 'r1', type: 'push' }], rowToWorkout, [{ id: 'r1', type: 'push', _sync: undefined }]);
  check('synced row not duplicated', out.length === 1);
}
// D — row DELETED on another device: synced locally (no mark), absent on server → drop
{
  const out = mergeUnsynced([], rowToWorkout, [{ id: 'r1', type: 'push' }]);
  check('remote delete propagates', out.length === 0);
}
// E — mixed: synced kept from server, offline insert kept local, remote-added appears
{
  const out = mergeUnsynced(
    [{ id: 'r1', type: 'push' }, { id: 'r9', type: 'legs' }],
    rowToWorkout,
    [{ id: 'r1', type: 'push' }, { id: 'temp-2', type: 'pull', _sync: 'error' }],
  );
  check('mixed set reconciles', out.map(r => r.id).sort().join(',') === 'r1,r9,temp-2');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
