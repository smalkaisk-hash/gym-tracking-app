// Keeps ONE published sentence and ONE directory on disk from ever disagreeing.
//
// legal/PRIVACY.md § 7 states, to users who are asked to accept it at sign-up:
//
//     Manual JSON backups — None. The project ships a backup script, but we do not
//     run it against the live database. No copy of your data exists outside it.
//
// and, more strongly, in prose immediately below the table:
//
//     We hold no backups, so deletion is final at the moment you make it.
//
// legal/DELETE-ACCOUNT.md and legal/CONSUMER-HEALTH-DATA-PRIVACY.md § 7.3 say the same
// thing, and the MHMDA answer in the last of those is built on it: RCW 19.373.040(3)
// extends the deletion right to archived and backup systems, and the reason we can
// satisfy it completely is that there is nothing to reach.
//
// All of that is true exactly until somebody runs `npm run backup`. That command writes
// every user's workouts, weigh-ins and settings to a JSON file, unencrypted, using the
// service_role key. The moment the file lands on disk:
//
//   • § 7's "no copy of your data exists outside it" is false;
//   • "deletion is final" is false, because a deleted account survives in that file;
//   • the MHMDA promise is false, and MHMDA carries a PRIVATE RIGHT OF ACTION.
//
// This is precisely the failure mode scripts/check-monitoring-claim.mjs exists for — a
// published claim that one ordinary operator action turns into a misstatement, with
// nothing in the typecheck, the bundle or the test suites noticing, because the app
// keeps working perfectly. That one had a guard and this one did not, which is the only
// reason this file exists.
//
// backups/ is gitignored, so this checks the working tree rather than the repository:
// the risk is a backup sitting on the operator's own disk while the published policy
// says none exists, not a backup being committed.
//
// Runs inside `npm run build`, alongside the monitoring check.

import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../', import.meta.url);
const read = (p) => {
  try { return fs.readFileSync(new URL(p, root), 'utf8'); } catch { return null; }
};

const fail = (lines) => {
  console.error(`\n${'─'.repeat(72)}`);
  console.error('BUILD STOPPED — the backup claim and the working tree disagree.');
  console.error(`${'─'.repeat(72)}\n`);
  for (const l of lines) console.error(l);
  console.error('');
  process.exit(1);
};

// ── 1. Does a backup actually exist on this machine? ─────────────────────────
// Anything at all in backups/ counts. scripts/backup.mjs names its output by date, so
// there is no fixed filename to look for, and a file someone renamed is still a copy of
// every user's health data.
// RECURSIVELY: `backups/2026/dump.json` is every bit as much a copy of every user's
// health data as `backups/dump.json`, and a non-recursive scan reported the first one as
// an empty directory.
const BACKUP_DIR = new URL('backups/', root);
const walk = (dir, prefix = '') => {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out = out.concat(walk(new URL(`${e.name}/`, dir), rel));
    else if (e.isFile()) out.push(rel);
  }
  return out;
};
let found = [];
try {
  found = walk(BACKUP_DIR);
} catch { /* no directory at all is the normal, claim-consistent state */ }

// ── 2. Do the published documents still claim there are none? ────────────────
// One phrase per document, chosen to be the load-bearing sentence rather than a
// passing mention, so that rewording the claim deliberately trips this check and
// forces the other documents to be revisited in the same edit.
//
// EACH PHRASE MUST BE UNIQUE TO THAT SENTENCE, and two of these were not. The CHD phrase
// was `there are none`, which also appears in § 8 about staffing ("no employees,
// contractors or other persons have access, because there are none") — so deleting the
// backup sentence outright left the check green off a sentence about headcount. The
// DELETE-ACCOUNT phrase `we do not have any` was generic enough to reappear anywhere.
// A gate that can be satisfied by an unrelated sentence is not a gate; if you reword a
// claim, reword the phrase here to the new load-bearing sentence in the same edit.
const CLAIMS = [
  { file: 'legal/PRIVACY.md', phrase: 'We hold no backups', where: '§ 7' },
  { file: 'legal/DELETE-ACCOUNT.md', phrase: 'Server backups are not on that list, because we do not have any', where: 'What does not get deleted' },
  { file: 'legal/CONSUMER-HEALTH-DATA-PRIVACY.md', phrase: 'Archived and backup systems: there are none', where: '§ 7.3' },
];

// A phrase that appears more than once is a phrase that can survive the deletion of the
// sentence it was chosen for. Fail loudly rather than checking the wrong occurrence.
const ambiguous = CLAIMS.filter((c) => (read(c.file) ?? '').split(c.phrase).length - 1 > 1);
if (ambiguous.length) {
  fail([
    'These claim phrases are not unique within their document:',
    ...ambiguous.map((c) => `    ${c.file} — "${c.phrase}"`),
    '',
    'The check would then pass on an unrelated sentence, which is how a deleted backup',
    'claim could go unnoticed. Lengthen the phrase until it identifies exactly one place.',
  ]);
}

const present = CLAIMS.filter((c) => (read(c.file) ?? '').includes(c.phrase));
const claimsNoBackups = present.length === CLAIMS.length;

if (found.length && claimsNoBackups) {
  fail([
    `backups/ contains ${found.length} file(s):`,
    ...found.slice(0, 5).map((f) => `    ${path.join('backups', f)}`),
    found.length > 5 ? `    …and ${found.length - 5} more` : '',
    '',
    'Every published policy still says no such copy exists:',
    ...CLAIMS.map((c) => `    ${c.file} ${c.where} — "${c.phrase}"`),
    '',
    'One of the two has to change. Either delete the backup (and empty the directory),',
    'or rewrite all three documents to disclose that manual backups are taken, where',
    'they are kept, how long for, and how a deletion request reaches them.',
    '',
    'The MHMDA answer in CONSUMER-HEALTH-DATA-PRIVACY.md § 7.3 is the one to think about',
    'hardest: RCW 19.373.040(3) extends the deletion right to backup systems, and the',
    'reason we can currently satisfy it in full is that there is nothing to reach.',
    'That statute carries a private right of action.',
  ].filter(Boolean));
}

if (!found.length && !claimsNoBackups) {
  const missing = CLAIMS.filter((c) => !present.includes(c));
  fail([
    'No backup exists in backups/, so the strong claim is available and true —',
    'but these documents no longer make it:',
    ...missing.map((c) => `    ${c.file} ${c.where} — expected "${c.phrase}"`),
    '',
    'Either restore the wording, or, if manual backups are genuinely being taken now,',
    'take one so this check tests the real situation rather than an intention.',
    '',
    'A policy that hedges about backups it does not take is inaccurate in the other',
    'direction, and it gives away the complete MHMDA answer for nothing.',
  ]);
}

console.log(
  found.length
    ? `backup claim: ${found.length} backup file(s) present, and the policies disclose backups. OK.`
    : 'backup claim: no backups on disk, and the policies say none exist. OK.',
);
