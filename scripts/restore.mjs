// Restore a backup produced by backup.mjs — the half of the pair that actually
// matters. A backup you have never restored is not a backup.
//
// SAFETY: by default this refuses to write to your production project. It restores
// into a SEPARATE scratch project (RESTORE_SUPABASE_URL / RESTORE_SERVICE_ROLE_KEY)
// so you can rehearse a full restore without any risk to live data. Only when you
// pass --force-prod AND point RESTORE_SUPABASE_URL at the same project as the
// backup's `source` will it touch production.
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

const hostOf = (u) => { try { return new URL(u).host; } catch { return null; } };
const sameAsSource = Boolean(backup.source) && hostOf(backup.source) === hostOf(targetUrl);

if (sameAsSource && !forceProd) {
  console.error(
    `Refusing to restore into the backup's own source project (${backup.source}).\n` +
    'That is your production project. To rehearse, point RESTORE_SUPABASE_URL at a\n' +
    'throwaway project instead. To really overwrite production, re-run with --force-prod.');
  process.exit(1);
}

// workouts first (body_weight_log.workout_id FKs into it); settings last.
const ORDER = ['workouts', 'body_weight_log', 'settings'];

const db = createClient(targetUrl, KEY, { auth: { persistSession: false } });

const run = async () => {
  console.log(`Restoring ${fileArg}\n  into ${targetUrl}${sameAsSource ? '  (PRODUCTION — --force-prod)' : '  (scratch target)'}\n`);
  for (const table of ORDER) {
    const rows = backup.tables[table] ?? [];
    if (!rows.length) { console.log(`  ${table}: 0 rows, skipped`); continue; }
    // Upsert on the primary key so a re-run is idempotent (workouts/body_weight_log
    // key on id; settings on user_id).
    const onConflict = table === 'settings' ? 'user_id' : 'id';
    const { error } = await db.from(table).upsert(rows, { onConflict });
    if (error) throw new Error(`Restoring ${table}: ${error.message}`);
    console.log(`  ${table}: ${rows.length} rows restored`);
  }
  console.log('\nRestore complete. Verify row counts against the backup file above.');
};

run().catch((e) => { console.error('\nRestore failed:', e.message); process.exit(1); });
