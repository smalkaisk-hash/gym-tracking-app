// Restore a backup produced by backup.mjs — the half of the pair that actually
// matters. A backup you have never restored is not a backup.
//
// SAFETY: this refuses to overwrite production unless you pass --force-prod. It
// recognises a production target two ways: (1) the target matches the backup's own
// `source` project, and (2) the target matches PROD_SUPABASE_URL, if you set it
// (recommended — put it in .env.restore). (2) exists because (1) alone only recognises
// prod when THIS backup was taken from prod: a drill backup from a branch or scratch
// project carries a different `source`, and a branch clones auth.users, so restoring one
// over prod without the flag would write rows under real user_ids. Point
// RESTORE_SUPABASE_URL at a SEPARATE scratch project to rehearse without risk to live
// data.
//
//   Rehearse (recommended):
//     RESTORE_SUPABASE_URL=<scratch> RESTORE_SERVICE_ROLE_KEY=<scratch-key> \
//       npm run restore -- backups/fitpulse-backup-<ISO>.json
//
//   Real restore into prod (deliberate):
//     RESTORE_SUPABASE_URL=<prod> RESTORE_SERVICE_ROLE_KEY=<prod-key> \
//       npm run restore -- backups/<file>.json --force-prod
//
// See BACKUP-RESTORE.md for the full drill and verification checklist.
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import { loadOpsEnv } from './env-lib.mjs';

// Keep the restore target's service_role key off the command line and out of shell
// history. Separate file from backup's .env.backup: restore points at a DIFFERENT
// project (a scratch target by default) and uses RESTORE_* variable names.
loadOpsEnv('.env.restore');

const args = process.argv.slice(2);
const forceProd = args.includes('--force-prod');
const fileArg = args.find((a) => !a.startsWith('--'));

const targetUrl = process.env.RESTORE_SUPABASE_URL;
const KEY = process.env.RESTORE_SERVICE_ROLE_KEY;

if (!fileArg) { console.error('Usage: npm run restore -- <backup.json> [--force-prod]'); process.exit(1); }
if (!targetUrl || !KEY) {
  console.error('Missing env. Set RESTORE_SUPABASE_URL and RESTORE_SERVICE_ROLE_KEY ' +
    '(point them at a SCRATCH project to rehearse safely).');
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(fileArg, 'utf8'));
if (backup.app !== 'fitpulse' || !backup.tables) {
  console.error(`${fileArg} is not a FitPulse backup.`); process.exit(1);
}
// backup.mjs stamps `version: 1`. Refuse an unknown format rather than upserting a
// shape this restore doesn't understand — a future bump that changed a table's columns
// would otherwise write silently malformed rows.
if (backup.version !== 1) {
  console.error(`${fileArg} is backup version ${backup.version}; this restore understands version 1 only.`);
  process.exit(1);
}

const hostOf = (u) => { try { return new URL(u).host; } catch { return null; } };
const sameAsSource = Boolean(backup.source) && hostOf(backup.source) === hostOf(targetUrl);

// Independent "this is production" signal, declared once via PROD_SUPABASE_URL (put it in
// .env.restore). sameAsSource only catches prod when the backup came from prod; this
// catches it whatever the backup's origin — so a branch/scratch drill backup can't be
// restored over prod without --force-prod. A set-but-unparseable value would protect
// nothing, so say so rather than fail silently open.
const prodUrl = (process.env.PROD_SUPABASE_URL ?? '').trim();
const prodHost = prodUrl ? hostOf(prodUrl) : null;
if (prodUrl && !prodHost) {
  console.error(`Warning: PROD_SUPABASE_URL is "${prodUrl}", which has no parseable host, so it guards nothing. Fix it to protect production.`);
}
const targetIsDeclaredProd = Boolean(prodHost) && prodHost === hostOf(targetUrl);
const prodTarget = sameAsSource || targetIsDeclaredProd;

if (prodTarget && !forceProd) {
  const why = sameAsSource
    ? `the backup's own source project (${backup.source})`
    : `PROD_SUPABASE_URL (${prodUrl})`;
  console.error(
    `Refusing to restore into ${why}.\n` +
    'That is your production project. To rehearse, point RESTORE_SUPABASE_URL at a\n' +
    'throwaway project instead. To really overwrite production, re-run with --force-prod.');
  process.exit(1);
}

// workouts first (body_weight_log.workout_id FKs into it). Must stay in step with
// TABLES in backup.mjs — a table backed up but never restored is worse than one that was
// never backed up, because the file says it is there.
const ORDER = ['workouts', 'body_weight_log', 'settings', 'consents', 'dormancy_notices'];

const db = createClient(targetUrl, KEY, { auth: { persistSession: false } });

const run = async () => {
  console.log(`Restoring ${fileArg}\n  into ${targetUrl}${prodTarget ? '  (PRODUCTION — --force-prod)' : '  (scratch target)'}\n`);
  for (const table of ORDER) {
    const rows = backup.tables[table] ?? [];
    if (!rows.length) { console.log(`  ${table}: 0 rows, skipped`); continue; }
    // Upsert on the primary key so a re-run is idempotent (settings keys on user_id;
    // every other table has an `id`). Note `consents` is append-only from a session but
    // this runs with the service_role key, which bypasses RLS — and migration 0007's
    // trigger re-stamps recorded_at, which is the right answer for a restore: the row is
    // being written now, whatever it once said.
    const onConflict = table === 'settings' ? 'user_id' : 'id';
    const { error } = await db.from(table).upsert(rows, { onConflict });
    if (error) {
      // The usual first failure when restoring into a fresh project is the user_id ->
      // auth.users FK: the backed-up users don't exist in the target yet. Point at the
      // seed file backup.mjs wrote next to the JSON rather than just echoing the raw error.
      const hint = /foreign key|auth\.users|violates/i.test(error.message)
        ? `\n  Hint: if the target is a fresh project, run the companion` +
          ` fitpulse-backup-<ISO>.auth-users.sql in its SQL editor first, or restore into a` +
          ` branch of the source project (which clones auth.users). See BACKUP-RESTORE.md.`
        : '';
      throw new Error(`Restoring ${table}: ${error.message}${hint}`);
    }
    console.log(`  ${table}: ${rows.length} rows restored`);
  }
  console.log('\nRestore complete. Verify row counts against the backup file above.');
};

run().catch((e) => { console.error('\nRestore failed:', e.message); process.exit(1); });
