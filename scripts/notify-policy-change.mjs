// Render the 30-day policy-change notice that legal/TERMS.md § 16.2 and
// legal/PRIVACY.md § 12 promise, ready to send.
//
// Those clauses commit to telling every user IN ADVANCE, by email, before a material
// change takes effect — and § 12 adds "we will never make a material change quietly and
// rely on your continued use as consent". The app half of that promise is built: the
// banner appears as soon as a version is bumped, and the re-consent gate raises on the
// effective date. The email half had nothing behind it at all.
//
// This does not send. Automated delivery would mean a new processor, a new Art. 28
// agreement and a new § 6 disclosure, which is a decision with a cost attached. What it
// does is make the promise *keepable*: it produces the exact message and the recipient
// list, to be sent from the contact address — already a disclosed processor (Google LLC,
// PRIVACY.md § 6). A promise nobody can perform is the failure; the pipeline is not.
//
//   Usage:  put SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SITE_URL in a gitignored
//           .env.backup (auto-loaded), or pass them inline (which wins), then:
//           npm run notify:policy-change
//
// It reads the versions and the effective date out of src/gym-tracker-app.tsx rather
// than taking them as arguments, so the notice cannot describe a different change from
// the one the app will actually enforce.
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { root, siteUrl, writeNotice } from './notice-lib.mjs';
import { loadOpsEnv } from './env-lib.mjs';

// Keep the service_role key off the command line and out of shell history. Shares
// .env.backup with the other prod service_role scripts (SITE_URL can live there too).
loadOpsEnv('.env.backup');

const src = fs.readFileSync(path.join(root, 'src/gym-tracker-app.tsx'), 'utf8');

const constant = (name) => {
  const m = src.match(new RegExp(`const ${name}\\s*=\\s*'([^']*)'`));
  if (!m) {
    console.error(`Could not read ${name} from src/gym-tracker-app.tsx. The notice must state the same version the app enforces, so this is a hard stop rather than a guess.`);
    process.exit(1);
  }
  return m[1];
};

const POLICY_VERSION = constant('POLICY_VERSION');
const TERMS_VERSION = constant('TERMS_VERSION');
const EFFECTIVE = constant('POLICIES_EFFECTIVE_FROM');

const effectiveMs = Date.parse(EFFECTIVE);
if (!Number.isFinite(effectiveMs)) {
  console.error(`POLICIES_EFFECTIVE_FROM is "${EFFECTIVE}", which is not a date. Fix it before notifying anyone: it is what the re-consent gate compares against.`);
  process.exit(1);
}

// Whole calendar days, midnight to midnight. Measuring from the current instant floors
// a same-day partial away and reports 29 for a date exactly 30 days out — which would
// send someone chasing a breach of § 16.2 that isn't there, or worse, pushing the
// effective date back to silence a false alarm.
const today = new Date();
const todayMidnightUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
const daysNotice = Math.round((effectiveMs - todayMidnightUTC) / 86400000);
if (daysNotice < 30) {
  console.warn(
    `\n⚠  ${daysNotice} day(s) until the change takes effect. TERMS.md § 16.2 promises AT LEAST 30.\n` +
    `   Push POLICIES_EFFECTIVE_FROM out before sending this, or the notice itself documents\n` +
    `   a breach of the clause it exists to satisfy.\n`);
}

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error(
    'Missing env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n' +
    'Find them in the Supabase dashboard → Project Settings → API (service_role key).');
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { persistSession: false } });

// Resolved before the read, so a missing host stops the run before it has assembled a
// list of real email addresses it cannot produce a usable message for.
const site = siteUrl();

const run = async () => {
  const recipients = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Listing users: ${error.message}`);
    for (const u of data.users) {
      if (!u.email) continue;
      const meta = u.user_metadata ?? {};
      // Only people who accepted an OLDER version need telling. Someone who signed up
      // after the bump already agreed to the current text, and mailing them a notice
      // about a change they never experienced is noise that trains users to ignore it.
      if (meta.health_data_consent_version !== POLICY_VERSION || meta.terms_version !== TERMS_VERSION) {
        recipients.push(u.email);
      }
    }
    if (data.users.length < 200) break;
  }

  if (!recipients.length) {
    console.log('\nNo recipients: every account has already accepted the current versions. Nothing to send.');
    return;
  }

  const when = new Date(effectiveMs).toISOString().slice(0, 10);
  const body = [
    `# Policy-change notice — generated ${new Date().toISOString().slice(0, 10)}`,
    '',
    `Terms v${TERMS_VERSION} · Privacy Policy v${POLICY_VERSION} · effective ${when}`,
    `${recipients.length} recipient(s) · ${daysNotice} days' notice`,
    '',
    'Send from the contact address. Put the recipients in **BCC** — they are users of a',
    'health app and a visible To: line would disclose one user\'s address to another,',
    'which is a personal data breach in its own right.',
    '',
    '## BCC',
    '',
    recipients.join(', '),
    '',
    '## Subject',
    '',
    `FitPulse: our Terms and Privacy Policy change on ${when}`,
    '',
    '## Body',
    '',
    'We are updating the FitPulse Terms of Service and Privacy Policy.',
    '',
    `The new versions take effect on ${when}. Until then nothing changes: you can keep`,
    'using FitPulse under the current version, and you can export your data at any time',
    'from Settings → Export backup.',
    '',
    `  Terms of Service:  ${site}/terms.html`,
    `  Privacy Policy:    ${site}/privacy.html`,
    '',
    'A summary of what changed is at the top of each document.',
    '',
    `From ${when} the app will ask you to read the new versions and confirm before you`,
    'continue — including a separate confirmation for the health data you log, which we',
    'ask for on its own and never bundle into general terms. If you would rather not',
    'agree, you can export your data and delete your account; the export is available',
    'from that screen too.',
    '',
    'If you have questions, reply to this email.',
    '',
    '---',
    '',
    'Sent because you have a FitPulse account. This is a service notice about a change to',
    'the terms of your account, not marketing.',
  ].join('\n');

  const { rel, reminder } = writeNotice(`policy-change-${when}.md`, body);

  console.log(`\n${recipients.length} recipient(s) have not accepted Terms v${TERMS_VERSION} / Policy v${POLICY_VERSION}.`);
  console.log(`Wrote the notice to ${rel}`);
  console.log(`Effective ${when} — ${daysNotice} days' notice.`);
  console.log('\nSend it, then record the date in compliance/ART-30-RECORD.md. TERMS.md § 16.2 is');
  console.log('a promise about the notice being GIVEN, so the send date is the thing worth keeping.');
  console.log(`\n${reminder}`);
};

run().catch((e) => { console.error('\nNotice generation failed:', e.message); process.exit(1); });
