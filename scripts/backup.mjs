// Logical backup of all five public FitPulse tables to a timestamped JSON file.
// (workouts, body_weight_log, settings, consents, dormancy_notices — see TABLES below.)
//
// This is a REAL backup (every user's rows), distinct from the app's per-user
// export in Settings. It connects with the service_role key, which bypasses RLS,
// so it must only ever run locally with secrets from the environment — never in
// the browser, never committed.
//
//   Usage:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run backup
//           (or put those two in .env.backup — see BACKUP-RESTORE.md)
//
// Output:  backups/fitpulse-backup-<ISO>.json       — feed it to `npm run restore`.
//          backups/fitpulse-backup-<ISO>.auth-users.sql — placeholder auth.users rows to
//          run in the restore TARGET's SQL editor first, so the user_id FKs resolve when
//          restoring into a fresh project (not needed for the source project or a branch).
//
// The database plan carries NO automated backups — legal/PRIVACY.md § 7,
// legal/DELETE-ACCOUNT.md and the MHMDA notice all state that plainly, and it is what
// lets them promise that a deletion cannot be undone. So this script is the only
// backup that exists, and running it against production makes those three published
// statements false the moment the file lands on disk. Run it against a scratch
// project to rehearse the restore path (restore.mjs) — an untested backup is hope,
// not a backup — and if you ever do run it against prod, update all three documents
// in the same change.
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error(
    'Missing env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n' +
    'Find them in the Supabase dashboard → Project Settings → API ' +
    '(service_role key, under "Project API keys").');
  process.exit(1);
}

// Every table in `public` (schema.sql), in the safe insert order for restore: workouts
// before body_weight_log (whose workout_id FKs into it). `consents` and
// `dormancy_notices` are here because a backup that omitted them would silently drop the
// Art. 7(1) consent evidence and the record that a dormancy warning was sent — the two
// things whose whole value is being producible later. The value keyed against each table
// is the column to sort by: it must be unique per row, or the paged windows below can
// overlap or skip.
const TABLES = {
  workouts: 'id',
  body_weight_log: 'id',
  settings: 'user_id',      // the primary key here — there is no id column
  consents: 'id',
  dormancy_notices: 'id',
};

const db = createClient(URL, KEY, { auth: { persistSession: false } });

const fetchAll = async (table, orderBy) => {
  // Page through so a large account isn't truncated by PostgREST's default cap — it
  // returns a SHORT result rather than an error, so an unpaged read looks like success.
  // KEYSET, not offset: each page asks for rows strictly after the last orderBy value
  // seen, rather than `range(from, from+999)`. An offset window shifts if a row is
  // inserted or deleted below the cursor between requests (uuid PKs land anywhere in
  // the order), silently skipping or double-reading a row — and a backup that quietly
  // skipped a page looks complete right up to the moment someone needs it. Keyset is
  // immune because it anchors on a value, not a position; it relies on `orderBy` being
  // unique per row, which TABLES guarantees.
  const page = 1000;
  let cursor = null;
  const rows = [];
  for (;;) {
    let q = db.from(table).select('*').order(orderBy, { ascending: true }).limit(page);
    if (cursor !== null) q = q.gt(orderBy, cursor);
    const { data, error } = await q;
    if (error) throw new Error(`Reading ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < page) break;
    cursor = data[data.length - 1][orderBy];
  }
  return rows;
};

// A placeholder `auth.users` row per id, enough to satisfy the user_id FKs so the data
// restores. These carry no password and cannot log in — they exist only so a restore
// into a brand-new project doesn't fail on the FK. `auth.users` itself is Supabase-
// managed and not reachable through PostgREST (the service_role key used here can't
// touch the auth schema), so this is emitted as SQL to run in the target's SQL editor,
// not restored by restore.mjs. A branch of the source project clones the real
// auth.users and needs none of this.
const authSeedSql = (ids, stamp) => {
  if (!ids.length) return '-- This backup references no users; no auth.users seed needed.\n';
  const header =
    `-- auth.users seed for fitpulse-backup-${stamp}.json (${ids.length} user(s)).\n` +
    `-- Run this in the RESTORE TARGET's SQL editor BEFORE \`npm run restore\`, so the\n` +
    `-- user_id -> auth.users foreign keys resolve. Placeholders only: no password, cannot\n` +
    `-- log in. Not needed when restoring into the source project or a branch of it.\n\n`;
  const rows = ids.map((id) =>
    `insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)\n` +
    `values ('${id}', '00000000-0000-0000-0000-000000000000', 'authenticated',\n` +
    `        'authenticated', '${id}@restored.invalid', now(), now())\n` +
    `on conflict (id) do nothing;`).join('\n\n');
  return header + rows + '\n';
};

const run = async () => {
  const tables = {};
  const userIds = new Set();
  for (const [t, orderBy] of Object.entries(TABLES)) {
    tables[t] = await fetchAll(t, orderBy);
    for (const r of tables[t]) if (r.user_id) userIds.add(r.user_id);
    console.log(`  ${t}: ${tables[t].length} rows`);
  }
  const ids = [...userIds].sort();

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `fitpulse-backup-${stamp}.json`);
  const seedFile = path.join(dir, `fitpulse-backup-${stamp}.auth-users.sql`);

  fs.writeFileSync(file, JSON.stringify({
    app: 'fitpulse',
    version: 1,
    exportedAt: new Date().toISOString(),
    source: URL,
    userIds: ids,
    tables,
  }, null, 2), 'utf8');
  fs.writeFileSync(seedFile, authSeedSql(ids, stamp), 'utf8');

  const total = Object.values(tables).reduce((n, rows) => n + rows.length, 0);
  console.log(`\nWrote ${total} rows to ${path.relative(process.cwd(), file)}`);
  console.log(`Wrote auth.users seed (${ids.length} user(s)) to ${path.relative(process.cwd(), seedFile)}`);
};

run().catch((e) => { console.error('\nBackup failed:', e.message); process.exit(1); });
