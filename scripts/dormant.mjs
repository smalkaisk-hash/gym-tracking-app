// Storage limitation (GDPR Art. 5(1)(e)) — find, and optionally delete, dormant accounts.
//
// "Until you delete them" is not a retention period; it is the absence of one. A
// privacy policy that names no limit for the account itself fails Art. 5(1)(e), and
// retention is the single most frequently cited Art. 5 failing in DPA audits. So
// legal/PRIVACY.md § 7 now states a rule, and this script is what makes the rule real
// rather than a sentence:
//
//   • WARN at 24 months of inactivity — email the user that the account will be
//     deleted, and that signing in once cancels it.
//   • DELETE at 36 months of inactivity, i.e. 12 months after the warning.
//
// Both numbers live in one place (below) and must match § 7. Change them together.
//
// THE WARNING IS INTERLOCKED WITH THE DELETION. Writing the messages to notices/ is not
// evidence that any of them was sent, and this is the only promise in the document set
// whose breach destroys the user's data. So a deletion requires a row in
// public.dormancy_notices (migration 0006) that was
//
//   (a) recorded at least (delete - warn) months ago, and
//   (b) sent AFTER the account's last sign of life,
//
// no recorded warning, no deletion, and the whole rule sits inert until one exists.
// (b) is what keeps the interlock honest across a second dormancy episode: a user who
// was warned, signed in, and drifted away again is owed a NEW warning, and a three-year-
// old row from the first episode must not authorise the second deletion.
// That is the safe direction to fail in, and while the project has no outbound channel
// it is also the only honest one.
//
//   Usage:  put SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SITE_URL in a gitignored
//           .env.backup (auto-loaded), or pass them inline (which wins), then:
//           npm run dormant
//           npm run dormant -- --record-warning   record that the warnings were SENT
//           npm run dormant -- --delete     actually delete (default is a dry run)
//           npm run dormant -- --warn-months=24 --delete-months=36
//
//   The order is: run it (writes notices/…md) → send those messages yourself →
//   --record-warning → wait out the gap → --delete.
//
// Connects with the service_role key, which bypasses RLS — local use only, never in
// the browser, never committed. Same rule as backup.mjs.
//
// WHY IT DOES NOT TRUST last_sign_in_at ALONE: Supabase updates that field on an
// actual sign-in, and a refresh token keeps a daily user signed in for months without
// producing one. Deleting on that signal would erase the accounts of the people using
// the app most. An account is dormant only when EVERY signal is stale: last sign-in,
// the newest workout, the newest weigh-in, and the settings row's updated_at.
//
// WHICH IS ALSO WHY EVERY READ BELOW IS PAGED. PostgREST caps a response at 1000 rows
// and returns a SHORT result rather than an error, so an unpaged select silently drops
// the activity signals of everyone past the cap — and an account with no signals looks
// exactly like an account that has been abandoned for three years. An unpaged read here
// reintroduces the precise failure this script's design exists to prevent.
import { createClient } from '@supabase/supabase-js';
import { siteUrl, writeNotice } from './notice-lib.mjs';
import { loadOpsEnv } from './env-lib.mjs';

// Keep the service_role key off the command line and out of shell history. Shares
// .env.backup with the other prod service_role scripts (SITE_URL can live there too).
loadOpsEnv('.env.backup');

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

const WARN_MONTHS   = arg('warn-months', 24);
const DELETE_MONTHS = arg('delete-months', 36);
const DO_DELETE     = process.argv.includes('--delete');
// Writes a public.dormancy_notices row for every account currently due a warning, i.e.
// the operator asserting "I have now actually sent these". It is a separate flag from
// --delete on purpose: generating the messages, sending them, and recording that they
// were sent are three different events, and only the third one may start the clock.
const RECORD_WARNING = process.argv.includes('--record-warning');

// The grace period is a PROMISE, not a preference. legal/PRIVACY.md § 7 tells users they
// get 12 months between the warning and the deletion, and the whole point of the
// interlock is to make that structural rather than a matter of the operator's care —
// which a `--delete-months=25` away from the default would quietly undo, since
// noticeCutoff is derived from the gap. So the floor is enforced here, not documented.
const MIN_GAP_MONTHS = 12;
if (DELETE_MONTHS - WARN_MONTHS < MIN_GAP_MONTHS) {
  console.error(
    `--delete-months (${DELETE_MONTHS}) minus --warn-months (${WARN_MONTHS}) is ` +
    `${DELETE_MONTHS - WARN_MONTHS} month(s).\n` +
    `legal/PRIVACY.md § 7 promises at least ${MIN_GAP_MONTHS} between the warning and the deletion, ` +
    `and this script is what makes that true. Change the policy first if the rule is meant to change.`);
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { persistSession: false } });

const NOW = Date.now();

const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};
const monthsAfter = (t, n) => {
  const d = new Date(t);
  d.setMonth(d.getMonth() + n);
  return d.getTime();
};

// Newest timestamp in `field`, ignoring anything unparsable and CLAMPING the future to
// now. `date` and the app's other timestamps come from the client's clock: a phone set
// to 2099 would otherwise make its owner's account permanently non-dormant, and this
// data is exactly what the retention rule exists to bound.
const newest = (rows, field) =>
  rows.reduce((max, r) => {
    const t = Date.parse(r?.[field] ?? '');
    if (!Number.isFinite(t)) return max;
    return Math.min(t, NOW) > max ? Math.min(t, NOW) : max;
  }, 0);

// Every user, paged — listUsers caps per page.
const allUsers = async () => {
  const out = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Listing users: ${error.message}`);
    out.push(...data.users);
    if (data.users.length < 200) break;
  }
  return out;
};

// Every row of a table, paged. See the header: PostgREST truncates silently at 1000, so
// a short read here is indistinguishable from an abandoned account. `orderBy` must be a
// column with a unique value per row — without a total order the windows can overlap or
// skip. Same shape as backup.mjs's paging, and for the same reason.
const PAGE = 1000;
const fetchAll = async (table, columns, orderBy) => {
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Reading ${table}: ${error.message}`);
    out.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) break;
  }
  return out;
};

const run = async () => {
  const users = await allUsers();
  if (!users.length) { console.log('No accounts.'); return; }

  // One paged read per table rather than per user, then group in memory.
  const [w, bw, s] = await Promise.all([
    fetchAll('workouts', 'id, user_id, created_at, date', 'id'),
    fetchAll('body_weight_log', 'id, user_id, date', 'id'),
    fetchAll('settings', 'user_id, updated_at', 'user_id'),
  ]);

  const by = (rows) => {
    const m = new Map();
    for (const r of rows) {
      if (!m.has(r.user_id)) m.set(r.user_id, []);
      m.get(r.user_id).push(r);
    }
    return m;
  };
  const wByUser  = by(w);
  const bwByUser = by(bw);
  const sByUser  = by(s);

  const warnBefore   = monthsAgo(WARN_MONTHS).getTime();
  const deleteBefore = monthsAgo(DELETE_MONTHS).getTime();
  const gapMonths    = DELETE_MONTHS - WARN_MONTHS;

  const rows = users.map((u) => {
    const signals = [
      Date.parse(u.last_sign_in_at ?? '') || 0,
      Date.parse(u.created_at ?? '') || 0,
      newest(wByUser.get(u.id) ?? [], 'created_at'),
      newest(wByUser.get(u.id) ?? [], 'date'),
      newest(bwByUser.get(u.id) ?? [], 'date'),
      newest(sByUser.get(u.id) ?? [], 'updated_at'),
    ];
    const lastSeen = Math.max(...signals);
    return {
      id: u.id,
      email: u.email ?? '(no email)',
      lastSeen,
      state: lastSeen < deleteBefore ? 'delete' : lastSeen < warnBefore ? 'warn' : 'active',
    };
  }).sort((a, b) => a.lastSeen - b.lastSeen);

  const fmt = (t) => (t ? new Date(t).toISOString().slice(0, 10) : 'never');
  const counts = { active: 0, warn: 0, delete: 0 };
  for (const r of rows) counts[r.state]++;

  console.log(`\n${rows.length} account(s) · warn at ${WARN_MONTHS}mo · delete at ${DELETE_MONTHS}mo`);
  console.log(`(read ${w.length} workout, ${bw.length} weigh-in and ${s.length} settings row(s) for the activity signals)\n`);
  for (const r of rows) {
    if (r.state === 'active') continue;
    console.log(`  ${r.state.toUpperCase().padEnd(6)} ${fmt(r.lastSeen)}  ${r.email}  ${r.id}`);
  }
  console.log(`\n  active: ${counts.active}   to warn: ${counts.warn}   to delete: ${counts.delete}`);

  // ── The recorded warnings ───────────────────────────────────────────────────
  // Read before anything is rendered or recorded, so a --record-warning run cannot
  // authorise itself, and so the notice list can exclude accounts already warned for
  // this dormancy episode.
  //
  // Paged AND ordered: the aggregation below takes the newest sent_at per user, and a
  // truncated read could hide exactly that row — leaving an older notice as the apparent
  // newest, which passes the age test SOONER than the warning the user actually
  // received permits. That is the one truncation in this script that points the unsafe
  // way, so it gets the same treatment as the activity signals.
  const noticeCutoff = monthsAgo(gapMonths).getTime();

  let noticeRows;
  try {
    noticeRows = await fetchAll('dormancy_notices', 'id, user_id, sent_at', 'id');
  } catch (e) {
    const missing = /relation .*dormancy_notices.* does not exist|schema cache/i.test(e.message);
    console.error(
      `\nCannot read public.dormancy_notices: ${e.message}\n` +
      (missing
        ? `Apply supabase/migrations/0006_add_dormancy_notices.sql, then re-run.\n`
        : '') +
      `Refusing to delete anything: without that table there is no way to show a warning\n` +
      `was ever sent, and § 12.9 promises one.`);
    process.exit(1);
  }

  // Newest recorded notice per user.
  const warnedAt = new Map();
  for (const n of noticeRows) {
    const t = Date.parse(n.sent_at ?? '') || 0;
    if (t > (warnedAt.get(n.user_id) ?? 0)) warnedAt.set(n.user_id, t);
  }
  // Has this account already been warned for the CURRENT dormancy episode? A notice
  // sent before their last sign of life belongs to an earlier one.
  const warnedThisEpisode = (r) => (warnedAt.get(r.id) ?? 0) >= r.lastSeen;

  // The date the user is told, and the date the code will actually honour, must be the
  // same date. The naive lastSeen + DELETE_MONTHS is neither: for an account warned late
  // (anything past the WARN_MONTHS mark, and an account that reaches `delete` state
  // unwarned is very late) it lands sooner than the interlock's gap allows, so the
  // warning would promise a deletion date the script then refuses to honour. § 7 says
  // the clock starts when you are told — so the floor is now + the gap.
  const dueAt = (lastSeen) => Math.max(monthsAfter(lastSeen, DELETE_MONTHS), monthsAfter(NOW, gapMonths));
  const monthsUntil = (t) => Math.max(1, Math.round((t - NOW) / (30.44 * 86400000)));

  // ── The warning notices ─────────────────────────────────────────────────────
  // Both `warn` AND `delete` state accounts, which is not a detail. An account already
  // past DELETE_MONTHS is never in `warn` state, so filtering to `warn` alone meant it
  // could never be sent a message, never have one recorded, and therefore never be
  // deleted OR retained on a stated rule — permanently stuck, with the output telling
  // the operator to "send the messages above" when none had been written for it. Those
  // accounts need the warning MORE than the others, not less; the 12-month interlock
  // still holds them afterwards.
  const due = rows.filter((r) => r.state !== 'active' && !warnedThisEpisode(r));
  const alreadyWarned = rows.filter((r) => r.state !== 'active' && warnedThisEpisode(r));

  if (due.length) {
    // Render the notice § 7 promises, ready to send. The project has no automated
    // outbound channel and adding one would mean a new processor, a new DPA and a new
    // § 6 disclosure — so the notice is written to a file for the operator to send from
    // the contact address, which is ALREADY a disclosed processor (Google LLC, § 6).
    // The promise is "we warn you", not "we warn you through a particular pipeline";
    // what it cannot survive is nobody being able to produce the message at all.
    const site = siteUrl();
    const body = [
      `# Dormant-account warnings — generated ${new Date(NOW).toISOString().slice(0, 10)}`,
      '',
      `${due.length} account(s) inactive for ${WARN_MONTHS}+ months. Send each message below`,
      'from the contact address. Do not BCC them as one mail: the deletion date differs per',
      'account, and a shared recipient list would disclose one user\'s address to another.',
      '',
      `Then re-run with --record-warning to start the ${gapMonths}-month clock.`,
      '',
      '---',
      ...due.flatMap((r) => {
        const dueDate = new Date(dueAt(r.lastSeen)).toISOString().slice(0, 10);
        return [
          '',
          `## To: ${r.email}`,
          `Subject: Your FitPulse account will be deleted on ${dueDate}`,
          '',
          `You haven't used FitPulse since ${fmt(r.lastSeen)}. We don't keep training and`,
          `body-weight data longer than we're being asked to, so this account and everything`,
          `in it will be deleted on ${dueDate} — about ${monthsUntil(dueAt(r.lastSeen))} months from now.`,
          '',
          'Signing in once cancels this. Nothing else is needed.',
          '',
          'If you would rather keep a copy, sign in and use Settings → Data → Export backup',
          'before that date. Deletion is permanent and we hold no backup to restore from.',
          '',
          `Our privacy policy explains the rule: ${site}/privacy.html (section 7).`,
          '',
          '---',
        ];
      }),
    ].join('\n');

    const { rel, reminder } = writeNotice(`dormant-warnings-${new Date(NOW).toISOString().slice(0, 10)}.md`, body);
    console.log(
      `\n${due.length} account(s) are due the § 7 warning. Wrote the messages to\n` +
      `  ${rel}\n` +
      `Send them from the contact address, then re-run with --record-warning and note the\n` +
      `date in compliance/ART-30-RECORD.md.\n` +
      `(There is no automated sender — see LEGAL-LIABILITY-AUDIT.md C4.)\n\n${reminder}`);
  } else if (alreadyWarned.length) {
    console.log(`\nAll ${alreadyWarned.length} inactive account(s) have already been warned for this dormancy period — no new messages to write.`);
  }

  // ── Recording that they were sent ───────────────────────────────────────────
  if (RECORD_WARNING) {
    if (!due.length) {
      console.log('\nNothing to record: no account is awaiting a first warning for its current dormancy period.');
    } else {
      // `due` already excludes anyone warned since their last sign of life, so a repeat
      // run cannot insert a second row for the same episode. That matters because the
      // interlock reads the NEWEST sent_at: re-recording on every scheduled run would
      // push the 12-month clock forward each time and postpone the deletion for ever,
      // turning the retention rule back into the absence of one.
      const payload = due.map((r) => ({
        user_id: r.id,
        channel: 'email',
        deletion_due: new Date(dueAt(r.lastSeen)).toISOString(),
        note: 'sent by operator from the contact address',
      }));
      const { error } = await db.from('dormancy_notices').insert(payload);
      if (error) { console.error(`\nRecording the warnings failed: ${error.message}`); process.exit(1); }
      console.log(`\nRecorded ${payload.length} warning(s) as sent. The ${gapMonths}-month clock starts now.`);
      console.log('Only do this AFTER the messages have actually gone out — this row is the evidence.');
    }
  }

  if (!counts.delete) { console.log('\nNothing to delete.'); return; }

  // Eligible = past the deletion threshold, warned for THIS dormancy period, and that
  // warning is at least `gapMonths` old. All three, or the account stays.
  const deletable = rows.filter((r) =>
    r.state === 'delete' &&
    warnedThisEpisode(r) &&
    warnedAt.get(r.id) <= noticeCutoff);
  const blocked = rows.filter((r) => r.state === 'delete' && !deletable.includes(r));

  if (blocked.length) {
    console.log(`\n${blocked.length} account(s) are past ${DELETE_MONTHS} months but CANNOT be deleted yet:`);
    for (const r of blocked) {
      const t = warnedThisEpisode(r) ? warnedAt.get(r.id) : 0;
      console.log(`  HELD   ${r.email}  ${t ? `warned ${fmt(t)} — less than ${gapMonths} months ago` : 'no warning on record for this dormancy period'}`);
    }
    console.log(
      `\n§ 12.9 promises a warning first, and a warning that was never sent is not a warning.\n` +
      `Send the messages written above, then re-run with --record-warning to start the\n` +
      `${gapMonths}-month clock. These accounts stay until it has run out.`);
  }

  if (!deletable.length) { console.log('\nNothing may be deleted.'); return; }

  if (!DO_DELETE) {
    console.log(`\nDry run. Re-run with --delete to remove the ${deletable.length} eligible account(s).`);
    return;
  }

  // Hard delete. The soft delete (second argument `true`) sets deleted_at and leaves
  // the auth.users row, which fires NONE of the cascades — the account would look gone
  // while every workout, weigh-in and settings row survived. Same trap documented in
  // schema.sql for the dashboard's "Remove user".
  let ok = 0;
  for (const r of deletable) {
    const { error } = await db.auth.admin.deleteUser(r.id, false);
    if (error) { console.error(`  FAILED ${r.email}: ${error.message}`); continue; }
    ok++;
    console.log(`  deleted ${r.email} (last seen ${fmt(r.lastSeen)}, warned ${fmt(warnedAt.get(r.id))})`);
  }
  console.log(`\nDeleted ${ok} of ${deletable.length} eligible. Record the run in compliance/ART-30-RECORD.md if any failed.`);
};

run().catch((e) => { console.error('\nDormant-account check failed:', e.message); process.exit(1); });
