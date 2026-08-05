// Logical backup of the three FitPulse tables to a timestamped JSON file.
//
// This is a REAL backup (every user's rows), distinct from the app's per-user
// export in Settings. It connects with the service_role key, which bypasses RLS,
// so it must only ever run locally with secrets from the environment — never in
// the browser, never committed.
//
//   Usage:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run backup
//           (or put those two in .env.backup — see BACKUP-RESTORE.md)
//
// Output:  backups/fitpulse-backup-<ISO>.json  — feed it to `npm run restore`.
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
  // Ordered as well as ranged: without a total order the database is free to return rows
  // in any order it likes between requests, and a backup that quietly skipped a page
  // would look complete right up to the moment someone needed it.
  const page = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    const { data, error } = await db.from(table).select('*')
      .order(orderBy, { ascending: true })
      .range(from, from + page - 1);
    if (error) throw new Error(`Reading ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return rows;
};

const run = async () => {
  const tables = {};
  for (const [t, orderBy] of Object.entries(TABLES)) {
    tables[t] = await fetchAll(t, orderBy);
    console.log(`  ${t}: ${tables[t].length} rows`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `fitpulse-backup-${stamp}.json`);

  fs.writeFileSync(file, JSON.stringify({
    app: 'fitpulse',
    version: 1,
    exportedAt: new Date().toISOString(),
    source: URL,
    tables,
  }, null, 2), 'utf8');

  const total = TABLES.reduce((n, t) => n + tables[t].length, 0);
  console.log(`\nWrote ${total} rows to ${path.relative(process.cwd(), file)}`);
};

run().catch((e) => { console.error('\nBackup failed:', e.message); process.exit(1); });
