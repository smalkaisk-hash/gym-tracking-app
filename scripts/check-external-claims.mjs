// Launch gate for facts the published policies assert but this repository cannot see.
//
// Three kinds of statement live in legal/PRIVACY.md:
//
//   1. Statements about the documents themselves — the build checks those.
//   2. Statements about the code — `npm run build`, the fuzz guards and the legal-pages
//      suite check those, and several were added precisely because a document and the
//      source had drifted apart.
//   3. Statements about things OUTSIDE the repo — a Supabase dashboard toggle, the
//      database region, whether a migration was ever run. Nothing in the build, the
//      type system or any test can observe these. They are true because somebody
//      clicked something once, and false the moment nobody does.
//
// The third kind is the dangerous one, because it fails silently and in the direction
// that matters: the page still renders, the tests still pass, and the only symptom is
// that a published privacy policy is inaccurate — which under FTC Act § 5 and the
// equivalent EU rules is itself the violation, not a stale sentence.
//
// So: compliance/verified.json records each such fact with the date it was CHECKED.
// This script fails while a published page makes one of those claims and the matching
// entry is still unverified. A checklist in a markdown file was the alternative, and a
// checklist nobody diffs is not a control.
//
//   npm run check:claims          fail on any unverified published claim
//   npm run check:claims -- --list   show every claim and its state, exit 0
//
// Deliberately NOT wired into `npm run build`: these are launch facts, not build facts,
// and a dev server that refuses to start because a dashboard toggle is off would just
// get the check deleted. It belongs with `npm run legal:release`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not url.pathname — the repo path contains a space, which the URL form
// percent-encodes into "%20" and every fs call then fails to find.
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const LIST = process.argv.includes('--list');

let record;
try {
  record = JSON.parse(read('compliance/verified.json'));
} catch (e) {
  console.error(`Cannot read compliance/verified.json: ${e.message}`);
  console.error('That file is the record of which external facts were checked. Restore it rather than deleting this gate.');
  process.exit(1);
}

const claims = Object.entries(record.claims ?? {});
if (!claims.length) {
  console.error('compliance/verified.json lists no claims. If the policies genuinely assert nothing external any more, say so in the file rather than emptying it.');
  process.exit(1);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TODAY = new Date().toISOString().slice(0, 10);
const problems = [];
const rows = [];

for (const [id, c] of claims) {
  // Is the claim actually on a published page right now? A claim that was removed from
  // the policy stops needing verification — that is the point of checking the built
  // page rather than trusting the list.
  const pages = (c.published ?? []).filter((f) => {
    let html;
    try { html = read(path.join('public', f)); } catch { return false; }
    return c.phrase ? html.includes(c.phrase) : true;
  });

  const live = pages.length > 0;
  const verified = c.verified;
  const wellFormed = verified === null || (typeof verified === 'string' && ISO_DATE.test(verified));

  if (!wellFormed) {
    problems.push(`${id}: "verified" must be null or an ISO date (YYYY-MM-DD), got ${JSON.stringify(verified)}. The date is the evidence — a tick without one is a guess.`);
  }
  if (live && verified === null) {
    problems.push(
      `${id}: PUBLISHED but UNVERIFIED — ${pages.join(', ')} says "${c.phrase}".\n` +
      `      claim:  ${c.claim}\n` +
      `      why:    ${c.why}\n` +
      `      verify: ${c.howToVerify}`);
  }

  // `expires` is for a claim that is true TODAY but will stop being true on a knowable
  // date unless somebody acts — the auth-log retention is the live example: applying
  // migration 0005 is not the claim, running it on a schedule is, and nothing is yet 90
  // days old. Without this the deadline lived in a prose `note` beside a green tick, and
  // a date that only ever moves forward when someone remembers is the same silent-failure
  // shape this whole file exists to eliminate.
  const expires = c.expires ?? null;
  if (expires !== null && !(typeof expires === 'string' && ISO_DATE.test(expires))) {
    problems.push(`${id}: "expires" must be absent, null, or an ISO date, got ${JSON.stringify(expires)}.`);
  } else if (live && expires && expires <= TODAY) {
    problems.push(
      `${id}: VERIFICATION EXPIRED on ${expires} — ${pages.join(', ')} still says "${c.phrase}".\n` +
      `      claim:  ${c.claim}\n` +
      `      why:    ${c.why}\n` +
      `      ${c.expiresWhy ?? 'Re-check it, then move the date forward.'}\n` +
      `      verify: ${c.howToVerify}`);
  }

  rows.push({ id, live, verified, expires, claim: c.claim });
}

if (LIST) {
  console.log('\nExternal claims — facts the published policies assert that the repo cannot check\n');
  for (const r of rows) {
    const state = !r.live ? 'not published' : r.verified ? `verified ${r.verified}` : 'UNVERIFIED';
    console.log(`  ${state.padEnd(18)} ${r.id}${r.expires ? `   (expires ${r.expires}${r.expires <= TODAY ? ' — OVERDUE' : ''})` : ''}`);
    console.log(`  ${' '.repeat(18)} ${r.claim}`);
  }
  const pending = rows.filter((r) => r.live && !r.verified).length;
  const overdue = rows.filter((r) => r.live && r.expires && r.expires <= TODAY).length;
  console.log(`\n  ${rows.length} claim(s) · ${pending} published and unverified · ${overdue} expired\n`);
  process.exit(0);
}

if (problems.length) {
  console.error(`\nNOT READY — ${problems.length} published claim(s) not yet verified:\n`);
  for (const p of problems) console.error(`  • ${p}\n`);
  console.error('Each of these is a sentence a user is asked to rely on. Check it, then record');
  console.error('the date you checked it in compliance/verified.json.\n');
  process.exit(1);
}

console.log(`All ${rows.filter((r) => r.live).length} published external claim(s) verified.`);
