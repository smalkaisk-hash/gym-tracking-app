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
// Supabase already keeps automated daily backups; this exists so you can hold your
// own copy AND, more importantly, so the restore path (restore.mjs) is something
// you can actually rehearse. An untested backup is hope, not a backup.
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

// These are exactly the app's tables (schema.sql). Order is the safe insert order
// for restore: workouts before body_weight_log (whose workout_id FKs into it).
const TABLES = ['workouts', 'body_weight_log', 'settings'];

const db = createClient(URL, KEY, { auth: { persistSession: false } });

const fetchAll = async (table) => {
  // Page through so a large account isn't truncated by PostgREST's default cap.
  const page = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    const { data, error } = await db.from(table).select('*').range(from, from + page - 1);
    if (error) throw new Error(`Reading ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return rows;
};

const run = async () => {
  const tables = {};
  for (const t of TABLES) {
    tables[t] = await fetchAll(t);
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
