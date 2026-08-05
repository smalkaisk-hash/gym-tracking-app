// Published legal pages — the static files in public/ that the app links to.
//
// Run: `node tests/legal-pages.test.mjs`  (no framework — plain Node).
//
// The app's policy links are plain hrefs to files Vite copies verbatim out of
// public/. Nothing in the type system, the bundler or the other suites knows
// whether those files exist, match the markdown they came from, or still contain
// the drafting notes that were meant to stay internal. A broken policy link is
// invisible in development (the app renders fine) and is a store rejection or a
// regulator's first question in production — so it gets its own suite.
//
// Companion to the `legal surface` guards in tests/qa/fuzz.test.mjs: those assert
// the app's SOURCE wires consent correctly, these assert the DOCUMENTS it points
// at were actually built and are clean.

import fs from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const LEGAL = path.join(ROOT, 'legal');
const GEN = path.join(ROOT, 'scripts', 'build-legal.mjs');

let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('  ok  ', name); }
  else { fail++; console.log('  FAIL', name, detail ? `\n        ${detail}` : ''); }
};

const read = (f) => fs.readFileSync(path.join(PUBLIC, f), 'utf8');

// The generator is the source of truth for what should exist.
const gen = fs.readFileSync(GEN, 'utf8');
const published = [...gen.matchAll(/file: '([A-Z0-9-]+\.md)',\s*\n\s*slug: '([a-z-]+)'/g)]
  .map(([, file, slug]) => ({ file, slug, html: `${slug}.html` }));
const internal = [...(/const INTERNAL = \[([^\]]*)\]/.exec(gen)?.[1] ?? '').matchAll(/'([^']+)'/g)]
  .map((m) => m[1]);

console.log('\n── the build is reproducible and public/ is not stale');

check('scripts/build-legal.mjs lists at least the four documents the app links to',
  published.length >= 4, `found ${published.length}`);

check('public/ matches legal/ — `npm run legal` has been run since the markdown last changed',
  (() => {
    try { execFileSync(process.execPath, [GEN, '--check'], { cwd: ROOT, stdio: 'pipe' }); return true; }
    catch { return false; }
  })(),
  'run `npm run legal` and commit the regenerated public/*.html');

console.log('\n── every linked document exists');

for (const doc of published) {
  check(`public/${doc.html} exists`, fs.existsSync(path.join(PUBLIC, doc.html)));
  check(`legal/${doc.file} exists (its source)`, fs.existsSync(path.join(LEGAL, doc.file)));
}

console.log('\n── nothing internal was published');

for (const doc of internal) {
  const slugged = doc.replace(/\.md$/, '').toLowerCase();
  check(`${doc} is not published`, !fs.existsSync(path.join(PUBLIC, `${slugged}.html`)));
}

const allHtml = fs.existsSync(PUBLIC) ? fs.readdirSync(PUBLIC).filter((f) => f.endsWith('.html')) : [];

check('public/ contains no page the generator does not know about',
  allHtml.every((f) => published.some((d) => d.html === f)),
  `stray: ${allHtml.filter((f) => !published.some((d) => d.html === f)).join(', ')}`);

for (const f of allHtml) {
  const html = read(f);
  check(`${f} carries no internal-only region`,
    !html.includes('internal:start') && !html.includes('TERMS-RATIONALE') && !html.includes('PRIVACY-POLICY-GUIDE'),
    'a drafting note reached a published contract');

  // A comment that opened on one line and closed on another used to match neither the
  // internal-region strip nor the single-line comment drop, so it fell through to the
  // paragraph renderer, was HTML-escaped, and printed a note addressed to the drafter
  // inside the published Terms — closing "-->" and all. The greps above missed it
  // because it named neither internal document.
  check(`${f} contains no escaped HTML comment`,
    !html.includes('&lt;!--') && !html.includes('--&gt;'),
    'a drafting comment was rendered as contract text instead of being stripped');

  // The other leak of the same class: *[If you are established in Spain: …]* is
  // ordinary markdown, so it rendered as part of the agreement.
  check(`${f} contains no drafting aside addressed to the drafter`,
    !/\b(If you are established in|If you also publish a translation|Drafting note|consider naming your)\b/i.test(html),
    'an instruction to whoever edits the document reached the published page');

  // Security controls we do NOT have must not be described as if we did. Three published
  // documents claimed the admin console was protected by multi-factor authentication;
  // MFA is a paid feature on this plan and is not enabled, so the sentence was removed on
  // 2026-08-01. A security measure stated in a privacy policy and not actually in place is
  // the textbook FTC Act § 5 deception — and it is the kind of claim that gets copied
  // forward by whoever next edits the security section. If MFA is ever genuinely turned
  // on, delete this guard in the same commit that adds the sentence back.
  check(`${f} claims no security control the service does not have`,
    !/multi-factor|multifactor|two-factor|\b2FA\b/i.test(html),
    'MFA is not enabled on the production console — saying so in a published policy is a '
    + 'misrepresentation, not an aspiration');
}

console.log('\n── the markdown actually rendered');

for (const f of allHtml) {
  const html = read(f);
  const body = html.slice(html.indexOf('<main>'));
  check(`${f} has no unrendered emphasis`, !body.includes('**'),
    'literal ** means the inline parser did not run over that text');
  check(`${f} has no unrendered link syntax`, !body.includes(']('));
  check(`${f} has no leaked code placeholder`, !body.includes('@@CODE'));
  check(`${f} has no double-escaped entity`, !body.includes('&amp;nbsp;'));
  check(`${f} has a title and a viewport`,
    /<title>[^<]+<\/title>/.test(html) && /name="viewport"/.test(html));
  check(`${f} has real content`, body.length > 1500, `only ${body.length} bytes`);
}

console.log('\n── internal links resolve');

for (const f of allHtml) {
  const html = read(f);
  const hrefs = [...html.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]);
  const broken = hrefs.filter((h) => h !== '/' && !fs.existsSync(path.join(PUBLIC, h.replace(/^\//, ''))));
  check(`${f} has no dead site-relative link`, broken.length === 0, `dead: ${broken.join(', ')}`);
}

console.log('\n── draft status is disclosed, not hidden');

// Mirrors the generator's own rule (scripts/build-legal.mjs). Asserted here as well
// because this is the invariant that decides whether a published policy can contain a
// hole in a disclosure the law requires with nothing telling the reader so.
const PLACEHOLDER = /\{\{\s*FILL\b|\[[A-Z][A-Z0-9 &/.,'-]{2,}\](?!\()|\[\d{1,3}\](?!\()|\[legal@yourdomain\]/;
const stripInternal = (md) =>
  md.replace(/<!--\s*internal:start\s*-->[\s\S]*?<!--\s*internal:end\s*-->\r?\n?/g, '');

for (const doc of published) {
  const md = fs.readFileSync(path.join(LEGAL, doc.file), 'utf8');
  const isDraft = /<!--\s*legal:draft\s*-->/.test(md);
  const banner = read(doc.html).includes('class="draft"');
  check(`${doc.html} ${isDraft ? 'shows' : 'omits'} the draft banner, matching its source`,
    isDraft === banner,
    isDraft
      ? 'the markdown is marked draft but the page does not say so'
      : 'the page claims draft status its source does not declare');

  // Both directions are failures. A placeholder with no banner publishes "{{FILL: your
  // project's region}}" where the recipients belong, and says nothing about it. A banner
  // with no placeholders tells every reader that a document they are being asked to
  // ACCEPT at sign-up is not in force.
  const hasHole = PLACEHOLDER.test(stripInternal(md));
  check(`${doc.file}: placeholders and the draft marker agree`,
    hasHole === isDraft,
    hasHole
      ? 'unresolved placeholders but no <!-- legal:draft --> marker — the page ships a hole with no warning'
      : 'no placeholders left but the marker is still there — remove it so the document is in force');
}

console.log('\n── the release gate is wired and answers honestly');

const releaseOut = (() => {
  try { execFileSync(process.execPath, [GEN, '--release'], { cwd: ROOT, stdio: 'pipe' }); return { ok: true, out: '' }; }
  catch (e) { return { ok: false, out: String(e.stdout ?? '') + String(e.stderr ?? '') }; }
})();
const anyDraft = published.some((d) =>
  /<!--\s*legal:draft\s*-->/.test(fs.readFileSync(path.join(LEGAL, d.file), 'utf8')));

check('`npm run legal:release` passes only when every document is in force',
  releaseOut.ok === !anyDraft,
  anyDraft
    ? 'documents are still draft but --release reported ready'
    : 'every document is in force but --release still refuses');

console.log('\n── the version stamp tracks the text it names');

// The failure this guards against actually happened. legal/PRIVACY.md v1.0 was edited
// after publication to add a new recipient (Google, behind the contact address) while
// the header still read "Version 1.0" and POLICY_VERSION in the app still read '1.0'.
// A version number that stays still while the words move cannot identify what the user
// agreed to — which is the only thing it is for, and the thing the consent record, the
// re-consent gate and migration 0004's evidence table all rely on.
//
// Nothing else compares these three: the type system does not know a markdown heading
// is a version number, and the build does not read the constants. So this does.
const APP = fs.readFileSync(path.join(ROOT, 'src', 'gym-tracker-app.tsx'), 'utf8');

const constOf = (name) => new RegExp(`const ${name}\\s*=\\s*'([^']+)'`).exec(APP)?.[1] ?? null;
const headerOf = (file) =>
  /^\*\*Version\s+([0-9.]+)\s*·\s*Effective\s+([^·]+?)\s*·/m
    .exec(fs.readFileSync(path.join(LEGAL, file), 'utf8')) ?? [];

for (const [file, konst] of [['PRIVACY.md', 'POLICY_VERSION'], ['TERMS.md', 'TERMS_VERSION']]) {
  const [, docVersion] = headerOf(file);
  const codeVersion = constOf(konst);
  check(`${konst} matches the version header in legal/${file}`,
    Boolean(docVersion) && docVersion === codeVersion,
    `legal/${file} says ${docVersion ?? '(no parsable header)'}, ${konst} says ${codeVersion ?? '(not found)'} — ` +
    `the acceptance record would name a version whose text has moved`);
}

// …and the document must not name a DIFFERENT version anywhere else in itself. The check
// above reads one line, which is exactly how legal/TERMS.md shipped a header saying
// "Version 1.2" over a closing line that still said "End of Terms of Service, version
// 1.1." A reader asking which version they accepted found two answers in one document,
// and the suite that exists to prevent that was looking at the wrong end of the file.
for (const [file, konst] of [['PRIVACY.md', 'POLICY_VERSION'], ['TERMS.md', 'TERMS_VERSION']]) {
  const text = fs.readFileSync(path.join(LEGAL, file), 'utf8');
  const header = headerOf(file)[1];
  // Only the places where the document IDENTIFIES ITSELF — the header stamp and the
  // closing line. Deliberately not every "version 1.0" in the prose: § 12 of the privacy
  // policy tells the reader, on purpose, about the time v1.0 was edited after publication,
  // and a guard that forbade naming an old version would forbid explaining the mistake
  // this whole rule exists because of.
  const body = text.replace(/<!--\s*internal:start\s*-->[\s\S]*?<!--\s*internal:end\s*-->/g, '');
  const stated = [
    ...body.matchAll(/^\s*\*+\s*Version\s+(\d+\.\d+)/gim),
    ...body.matchAll(/End of [^,\n]+,\s*version\s+(\d+\.\d+)/gi),
  ].map(m => m[1]);
  const conflicting = [...new Set(stated)].filter(v => v !== header);
  check(`legal/${file} identifies itself as one version throughout`,
    stated.length >= 2 && conflicting.length === 0,
    stated.length < 2
      ? `found ${stated.length} self-identifying version stamp(s); expected the header AND the closing line`
      : `header says ${header}, but the document also calls itself: ${conflicting.join(', ')} — ` +
        `${konst} stamps one number into the consent record, and the document must agree with it`);
}


// Both published documents must take effect on the same day the app stops accepting the
// old ones, or the re-consent gate contradicts TERMS.md § 16.2/§ 16.3: raised early it is
// an instant lockout with no notice, raised late it lets a superseded version run on.
const effectiveFrom = constOf('POLICIES_EFFECTIVE_FROM');
// The documents write "4 September 2026" and the constant is an ISO date. Date.parse
// does not understand the first form (it is not a format the spec requires engines to
// accept, and Node returns NaN), so the month name is resolved by hand rather than
// letting a NaN compare equal to a NaN and pass silently.
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december'];
const asDay = (s) => {
  const t = String(s ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(t);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month < 0) return null;
  return `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};
for (const file of ['PRIVACY.md', 'TERMS.md']) {
  const [, , docEffective] = headerOf(file);
  check(`legal/${file}'s effective date is the date the re-consent gate uses`,
    asDay(docEffective) !== null && asDay(docEffective) === asDay(effectiveFrom),
    `legal/${file} takes effect ${docEffective ?? '(unparsed)'} but POLICIES_EFFECTIVE_FROM is ${effectiveFrom}`);
}

// The Consumer Health Data notice has a version header and NO code constant, so the
// comparison above cannot cover it — and it was edited on 5 August (a processor added to
// § 3, § 9 rewritten) with its header still reading "Version 1.0 · Last reviewed 1 August".
// PRIVACY.md § 12 sets out this exact rule and says it was written because it had already
// happened once. A document whose "last reviewed" date predates its own newest content is
// the same defect, so: the header must name a review date no earlier than the day the file
// last actually changed.
{
  const chd = 'CONSUMER-HEALTH-DATA-PRIVACY.md';
  const full = path.join(LEGAL, chd);
  const reviewed = /\bLast reviewed\s+([^*·\n]+)/.exec(fs.readFileSync(full, 'utf8'))?.[1];
  // The working tree's mtime, not git's log: an uncommitted edit is the normal state
  // mid-change and is exactly when this drifts.
  const changed = new Date(fs.statSync(full).mtime).toISOString().slice(0, 10);
  check(`legal/${chd}'s "Last reviewed" date is not older than its newest edit`,
    asDay(reviewed) !== null && asDay(reviewed) >= changed,
    `header says reviewed ${reviewed ?? '(unparsed)'} but the file was last changed ${changed} — ` +
    `a version header that stays still while the text moves cannot tell a reader what they agreed to`);
}

// The one retention period with no server-side enforcement: auth.audit_log_entries is
// never expired by the provider and has no FK to auth.users, so it survives a deletion
// and only a job we run removes it. Policy and job must name the same number, or § 7
// describes something that is not happening.
const privacyMd = fs.readFileSync(path.join(LEGAL, 'PRIVACY.md'), 'utf8');
const purgeJs = fs.readFileSync(path.join(ROOT, 'scripts', 'purge-auth-log.mjs'), 'utf8');
const policyDays = /Sign-in security log[^|]*\|[^|]*?\*\*(\d+)\s+days?\.?\*\*/i.exec(privacyMd)?.[1];
const scriptDays = /arg\('retain-days',\s*(\d+)\)/.exec(purgeJs)?.[1];

check('the sign-in-log retention in PRIVACY § 7 matches scripts/purge-auth-log.mjs',
  Boolean(policyDays) && policyDays === scriptDays,
  `§ 7 says ${policyDays ?? '(no row found)'} days, the purge job retains ${scriptDays ?? '(not found)'}`);

// § 12.7 of the Terms lists what survives a deletion and closes the list with "and
// nothing else". That sentence was false twice: support email and the sign-in log both
// survive. If either disappears from the clause, the closed list is a false statement in
// a contract, so both are pinned here rather than trusted to survive an edit.
const termsMd = fs.readFileSync(path.join(LEGAL, 'TERMS.md'), 'utf8');
const clause127 = /12\.7 \*\*What "immediately" means[\s\S]*?(?=\n12\.8 )/.exec(termsMd)?.[0] ?? '';
for (const [what, re] of [
  ['support email', /what you have sent/i],
  // Outbound too. A dormancy warning or a § 16.2 change notice is a message addressed to
  // the user that stays in the mailbox after the account is gone — and, until this limb
  // said so, a sixth survivor against a list that closes "and nothing else".
  ['notices we sent', /any notice we\s+have sent you/i],
  ['the sign-in security log', /authentication provider's security log/i],
]) {
  check(`TERMS § 12.7 still names ${what} as surviving a deletion`,
    re.test(clause127),
    'the clause closes with "and nothing else", so dropping a survivor makes it untrue');
}

console.log(`\n${'='.repeat(72)}`);
console.log(`${pass}/${pass + fail} passed`);
if (fail) console.log(`\n${fail} FAILING — the published legal pages are wrong, not the test.`);
process.exit(fail ? 1 : 0);
