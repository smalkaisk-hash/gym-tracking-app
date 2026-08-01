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

console.log(`\n${'='.repeat(72)}`);
console.log(`${pass}/${pass + fail} passed`);
if (fail) console.log(`\n${fail} FAILING — the published legal pages are wrong, not the test.`);
process.exit(fail ? 1 : 0);
