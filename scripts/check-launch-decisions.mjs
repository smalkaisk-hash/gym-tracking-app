// Launch gate for questions that have no answer in this repository.
//
// There are three kinds of statement the other gates already cover:
//
//   1. statements about the documents        → scripts/build-legal.mjs
//   2. statements about the code             → the build, the fuzz guards, legal-pages
//   3. statements about the outside world    → scripts/check-external-claims.mjs
//
// This is the fourth kind, and it is not a statement at all. It is a QUESTION whose
// answer is a decision — is the app's name available, do we serve UK users lawfully,
// do we ship photographs of identifiable people — where several answers are legitimate
// and only leaving it unasked is not.
//
// The distinction from check:claims matters and is why this is a separate file: a claim
// is verified by going and looking, and the failure mode is that the policy is wrong.
// A decision is resolved by choosing, and the failure mode is that nobody chose. You
// cannot verify your way to an answer on whether to rename the app.
//
// An entry may legitimately be resolved as "accept the risk". That closes the gate:
// the point is not to force a particular answer, it is to make sure the question was
// put before anyone relies on the outcome.
//
//   npm run check:decisions            fail while any decision is open
//   npm run check:decisions -- --list  show every decision and its state, exit 0
//
// Deliberately NOT in `npm run build`, for the same reason check:claims is not: these
// are launch facts, not build facts, and a dev server that refuses to start because a
// trademark search has not been done would simply get deleted. It belongs with
// `npm run legal:release`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not url.pathname — the repo path contains a space, which the URL form
// percent-encodes into "%20" and every fs call then fails to find.
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIST = process.argv.includes('--list');

let record;
try {
  record = JSON.parse(fs.readFileSync(path.join(root, 'compliance/launch-decisions.json'), 'utf8'));
} catch (e) {
  console.error(`Cannot read compliance/launch-decisions.json: ${e.message}`);
  console.error('That file is the record of which launch questions were actually asked.');
  console.error('Restore it rather than deleting this gate.');
  process.exit(1);
}

const entries = Object.entries(record.decisions ?? {});
if (!entries.length) {
  console.error('compliance/launch-decisions.json lists no decisions. If every one has genuinely');
  console.error('been resolved, leave them in the file marked resolved rather than emptying it —');
  console.error('an empty gate and a passed gate look identical from here.');
  process.exit(1);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const open = [];
const rows = [];

for (const [id, d] of entries) {
  const decided = d.decided;
  const wellFormed = decided === null || (typeof decided === 'string' && ISO_DATE.test(decided));

  if (!wellFormed) {
    open.push(`${id}: "decided" must be null or an ISO date (YYYY-MM-DD), got ${JSON.stringify(decided)}.`);
  } else if (decided === null) {
    const lines = [`${id}: OPEN — ${d.question}`];
    for (const w of d.why ?? []) lines.push(`      ${w}`);
    lines.push('      how to resolve:');
    for (const h of d.howToResolve ?? []) lines.push(`        ${h}`);
    open.push(lines.join('\n'));
  } else if (!d.outcome) {
    // A date with no outcome is the worst of both: it looks resolved in a listing and
    // records nothing about what was actually chosen.
    open.push(`${id}: dated ${decided} but "outcome" is empty — record what was decided, not just that something was.`);
  }

  rows.push({ id, decided, outcome: d.outcome, question: d.question });
}

if (LIST) {
  console.log('\nLaunch decisions — questions whose answer is not in this repository\n');
  for (const r of rows) {
    console.log(`  ${(r.decided ? `decided ${r.decided}` : 'OPEN').padEnd(18)} ${r.id}`);
    console.log(`  ${' '.repeat(18)} ${r.question}`);
    if (r.outcome) console.log(`  ${' '.repeat(18)} → ${r.outcome}`);
  }
  console.log(`\n  ${rows.length} decision(s) · ${rows.filter((r) => !r.decided).length} still open\n`);
  process.exit(0);
}

if (open.length) {
  console.error(`\nNOT READY — ${open.length} launch decision(s) still open:\n`);
  for (const o of open) console.error(`  • ${o}\n`);
  console.error('Each of these has more than one acceptable answer, including "accept the risk".');
  console.error('Record the answer and the date in compliance/launch-decisions.json.\n');
  process.exit(1);
}

console.log(`All ${rows.length} launch decision(s) resolved.`);
