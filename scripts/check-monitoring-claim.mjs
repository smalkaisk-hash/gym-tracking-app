// Keeps ONE published sentence and ONE environment variable from ever disagreeing.
//
// legal/PRIVACY.md § 2.3 states, to users who are asked to accept it at sign-up:
//
//     The app sends no crash or error reports anywhere.
//
// That is true only while VITE_SENTRY_DSN is empty. src/monitoring.ts is a total
// no-op without a DSN — but the Sentry dependency is installed, the reportError
// call sites are live, and setting one variable in a build environment turns
// reporting on with nothing else changing. Nothing in a typecheck, a bundle or the
// five test suites would notice, because the app keeps working perfectly.
//
// For a health app that is not a stale sentence. Under the FTC's amended Health
// Breach Notification Rule (16 CFR 318), an unauthorised disclosure includes the
// operator sending health-adjacent data to a new recipient without consent — the
// theory the FTC used against GoodRx and BetterHelp. So turning monitoring on
// without updating the policy is not a documentation lapse; it is the reportable
// event itself.
//
// This runs inside `npm run build`, before tsc, so the two can only move together.
// It is deliberately symmetric: it fails if the DSN is set while the policy says
// reporting is off, AND if the policy drops the claim while the DSN is empty (a
// policy that over-discloses is also inaccurate, and it would mask the first case
// the next time someone edited it).

import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => {
  try { return fs.readFileSync(new URL(p, root), 'utf8'); } catch { return null; }
};

// ── 1. Is a DSN configured anywhere Vite would find one? ─────────────────────
// Every .env file Vite loads, not just the one this machine happens to use — a
// build on another machine or in CI reads a different set, and the published
// document is the same in all of them. `.env.example` is excluded: it ships the
// key blank on purpose, as documentation.
//
// Discovered by listing the directory rather than from a fixed list, because
// `vite build --mode staging` loads `.env.staging` and `.env.staging.local`, and a
// hard-coded four-file list silently exempted every mode nobody had thought of yet.
let ENV_FILES = [];
try {
  ENV_FILES = fs.readdirSync(new URL('.', root))
    .filter((f) => /^\.env($|\.)/.test(f) && f !== '.env.example');
} catch { /* unreadable repo root — the reads below just find nothing */ }

const sources = [];
if (process.env.VITE_SENTRY_DSN?.trim()) sources.push('the VITE_SENTRY_DSN environment variable');

for (const file of ENV_FILES) {
  const text = read(file);
  if (!text) continue;
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?VITE_SENTRY_DSN\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    // Strip surrounding quotes and any trailing comment, then see if anything is left.
    const value = m[1].trim().replace(/^(['"])(.*)\1$/, '$2').replace(/\s+#.*$/, '').trim();
    if (value) sources.push(file);
  }
}

const reportingOn = sources.length > 0;

// ── 2. What does the published policy currently claim? ───────────────────────
const privacy = read('legal/PRIVACY.md');
if (privacy == null) {
  console.error('check-monitoring-claim: legal/PRIVACY.md not found.');
  process.exit(1);
}

// The § 2.3 headline sentence and the § 7 retention row. Both assert the same fact,
// so both have to be true at once; matching only one would let a half-edit through.
const CLAIMS = [
  { where: '§ 2.3', text: '**The app sends no crash or error reports anywhere.**' },
  { where: '§ 7',   text: '**Not applicable.** Error reporting is disabled' },
];
const present = CLAIMS.filter((c) => privacy.includes(c.text));
const claimsReportingIsOff = present.length === CLAIMS.length;

// And, separately, does the policy POSITIVELY disclose the recipient? This is the half
// that was missing, and its absence left the dangerous combination passing in silence:
// with only the two negative literals above, `claimsReportingIsOff` merely required both
// exact strings — bold markers and all — so rewording § 2.3 slightly and THEN setting a
// DSN produced `reportingOn && !claimsReportingIsOff`, which matched neither failure
// branch. The build went green with reporting live and a policy that had never disclosed
// it. Naming the recipient is not something a rewording can do by accident, so "on" now
// has to be asserted rather than merely not-denied.
const DISCLOSES_RECIPIENT = /\bSentry\b/i.test(privacy);

// ── 3. They must agree ───────────────────────────────────────────────────────
const fail = (lines) => {
  console.error(`\n${'─'.repeat(72)}`);
  console.error('BUILD STOPPED — the privacy policy and the error-reporting build');
  console.error('configuration disagree.\n');
  for (const l of lines) console.error(l);
  console.error(`${'─'.repeat(72)}\n`);
  process.exit(1);
};

if (reportingOn && claimsReportingIsOff) {
  fail([
    `A Sentry DSN is set in: ${[...new Set(sources)].join(', ')}`,
    '',
    'so this build WILL send error reports to Sentry — while legal/PRIVACY.md still',
    'tells users the app sends none. Publishing that is a false statement in a',
    'document users accept at sign-up.',
    '',
    'To turn monitoring on, update all four of these first:',
    '  • § 2.3  — say reporting is enabled, name Sentry, say what a report contains',
    '  • § 2.2  — the "Crash and error reports" row (currently "None — the app sends none")',
    '  • § 6    — add Functional Software, Inc. (Sentry) to the processor table',
    '  • § 7    — replace the "Not applicable" retention row with Sentry\'s actual retention',
    '',
    'Then check § 10 (Sentry\'s region) and give users advance notice under § 12 —',
    'a new recipient is a material change, and for a health app an unannounced one',
    'is reportable under the FTC Health Breach Notification Rule, not merely untidy.',
    '',
    'To keep monitoring off, clear VITE_SENTRY_DSN in the file(s) above.',
  ]);
}

// The gap the two symmetric branches above leave open: reporting is on, the policy no
// longer states the exact "off" sentences, and it does not name the recipient either.
// Nothing about that is safe — it is the same undisclosed-recipient situation as the
// first branch, arrived at by editing the policy first instead of second.
if (reportingOn && !DISCLOSES_RECIPIENT) {
  fail([
    `A Sentry DSN is set in: ${[...new Set(sources)].join(', ')}`,
    '',
    'so this build sends error reports to Sentry — and legal/PRIVACY.md never names',
    'Sentry at all. Whatever § 2.3 now says, the recipient is undisclosed.',
    '',
    'Disclosing a processor means naming it: add Functional Software, Inc. (Sentry)',
    'to the § 6 processor table, say in § 2.3 what a report contains, replace the',
    '§ 2.2 row and give § 7 the real retention.',
    '',
    'For a health app an unannounced new recipient is reportable under the FTC Health',
    'Breach Notification Rule — that is why this is a build gate and not a TODO.',
  ]);
}

if (!reportingOn && !claimsReportingIsOff) {
  const missing = CLAIMS.filter((c) => !present.includes(c)).map((c) => c.where);
  fail([
    'No Sentry DSN is configured, so this build sends no error reports —',
    `but legal/PRIVACY.md ${missing.join(' and ')} no longer says so.`,
    '',
    'Either restore the wording (the exact strings this check looks for are in',
    'scripts/check-monitoring-claim.mjs), or, if reporting is genuinely being',
    'turned on, set the DSN so this check tests the real configuration.',
    '',
    'A policy that discloses reporting the app does not do is inaccurate in the',
    'other direction, and it would hide the dangerous case from the next edit.',
  ]);
}

console.log(
  reportingOn
    ? 'monitoring claim: DSN set, and the policy names Sentry as a recipient. OK.'
    : 'monitoring claim: no DSN, and the policy says reporting is off. OK.',
);
