// Storage limitation (GDPR Art. 5(1)(e)) for the sign-in security log.
//
// `auth.audit_log_entries` records every sign-in, sign-up and password reset with the
// time, the IP address and the email address used. Two facts make it the one retention
// hole this project could not close by editing a document:
//
//   • it has NO foreign key to auth.users, so deleting an account does not touch it —
//     it is the single record that survives a deletion, which legal/PRIVACY.md § 7,
//     legal/TERMS.md § 12.7 and legal/DELETE-ACCOUNT.md now all disclose; and
//   • the authentication provider never expires it, so left alone it grows forever on
//     a table holding IP addresses and email addresses.
//
// PRIVACY.md § 7 states 90 days. This script is what makes that sentence true, exactly
// as scripts/dormant.mjs is what makes the dormancy row above it true. If neither is
// ever run, both rows become false and the policy misstates our practice — which for a
// health app is the FTC Act § 5 problem, not a tidiness problem.
//
//   Usage:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run purge:auth-log
//           npm run purge:auth-log -- --purge          actually delete (default: dry run)
//           npm run purge:auth-log -- --retain-days=90
//
// Requires migration 0005, which defines public.purge_auth_audit_log(). The `auth`
// schema is not reachable through PostgREST, so the work is done by that SECURITY
// DEFINER function and this script only calls it.
//
// Connects with the service_role key, which bypasses RLS — local use only, never in the
// browser, never committed. Same rule as backup.mjs and dormant.mjs.
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error(
    'Missing env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n' +
    'Find them in the Supabase dashboard → Project Settings → API ' +
    '(service_role key, under "Project API keys").');
  process.exit(1);
}

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const n = Number(hit.split('=')[1]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Keep this in step with the number in legal/PRIVACY.md § 7. They are two halves of
// one promise: the document says what we do, this says how.
const RETAIN_DAYS = arg('retain-days', 90);
const DO_PURGE    = process.argv.includes('--purge');

const db = createClient(URL, KEY, { auth: { persistSession: false } });

const run = async () => {
  // Count first, so a dry run reports the same number the purge would remove. The
  // counting query goes through the same SECURITY DEFINER boundary (retain_days is the
  // only knob) — there is no way to read the log's contents from here, only its size.
  const { data: due, error: countErr } = await db.rpc('purge_auth_audit_log', {
    retain_days: RETAIN_DAYS,
    dry_run: true,
  });

  if (countErr) {
    // The most likely cause by far, and the one worth naming rather than dumping a
    // Postgres error: migration 0005 has not been applied to this project.
    if (/function .*purge_auth_audit_log/i.test(countErr.message)) {
      console.error(
        `\npublic.purge_auth_audit_log() does not exist on this project.\n` +
        `Apply supabase/migrations/0005_purge_auth_audit_log.sql in the Supabase SQL\n` +
        `editor, then re-run. Until it is applied, legal/PRIVACY.md § 7's 90-day row\n` +
        `for the sign-in security log describes something that is not happening.`);
      process.exit(1);
    }
    throw new Error(countErr.message);
  }

  const n = Number(due ?? 0);
  console.log(`\nSign-in security log · retaining ${RETAIN_DAYS} days`);
  console.log(`  ${n} entr${n === 1 ? 'y' : 'ies'} older than that.`);

  if (!n) { console.log('\nNothing to purge.'); return; }

  if (!DO_PURGE) {
    console.log(`\nDry run. Re-run with --purge to delete the ${n} entr${n === 1 ? 'y' : 'ies'} above.`);
    return;
  }

  const { data: removed, error } = await db.rpc('purge_auth_audit_log', {
    retain_days: RETAIN_DAYS,
    dry_run: false,
  });
  if (error) throw new Error(error.message);

  console.log(`\nPurged ${Number(removed ?? 0)} entr${Number(removed) === 1 ? 'y' : 'ies'}.`);
  console.log('Record the run in compliance/ART-30-RECORD.md.');
};

run().catch((e) => { console.error('\nAuth-log purge failed:', e.message); process.exit(1); });
