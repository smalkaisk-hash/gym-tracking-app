// QA harness loader — makes the REAL app internals callable from plain Node.
//
// The app is one big .tsx that imports React, lucide, recharts, images and the
// Supabase client, and it exports only the component. None of that survives a
// plain `import` in Node, and copying the helpers into a test would only prove
// the copy correct. So instead: read the actual source, strip the imports,
// substitute inert stubs for them, append an `export {}` of every top-level
// binding, transpile with the project's own TypeScript, and import the result.
//
// Consequence worth stating plainly: every assertion in this directory runs the
// bytes that ship. If a test fails here, the app is wrong — not the mirror.
//
// Nested helpers (the ones defined inside GymTrackerApp, e.g. mergeUnsynced) are
// not reachable that way; `extractFn` slices them out of the source by name and
// compiles them standalone. Same bytes, same caveat.
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath, pathToFileURL } from 'url';
import ts from 'typescript';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', '..', 'src');
const OUT = path.join(os.tmpdir(), 'fitpulse-qa-build');

const IMPORT_RE = /^import\s+(?:type\s+)?[\s\S]*?from\s+'[^']+';?[ \t]*$/gm;

// Every binding an import line introduced, so a stub can be generated for it.
const importedNames = (stmt) => {
  const names = [];
  const clause = stmt.slice(stmt.indexOf('import') + 6, stmt.lastIndexOf('from'));
  const braced = clause.match(/\{([\s\S]*)\}/);
  if (braced) for (const part of braced[1].split(',')) {
    const n = part.split(/\s+as\s+/).pop().trim();
    if (n) names.push(n);
  }
  const before = (braced ? clause.slice(0, clause.indexOf('{')) : clause).replace(/,/g, ' ').trim();
  if (before && /^[A-Za-z_$][\w$]*$/.test(before)) names.push(before);
  return names;
};

// Top-level (column 0) value bindings. Type aliases and destructured declarations
// are skipped — the former aren't values, the latter aren't worth the parser.
const topLevelBindings = (src) => {
  const names = new Set();
  for (const m of src.matchAll(/^(?:export\s+)?(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  return [...names];
};

const compile = (code, file) =>
  ts.transpileModule(code, {
    fileName: file,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      isolatedModules: true,
    },
  }).outputText;

let counter = 0;
const emit = (code, tag) => {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${tag}-${counter++}.mjs`);
  fs.writeFileSync(file, code, 'utf8');
  return import(pathToFileURL(file).href);
};

// Load a source file with its imports replaced by stubs and everything exported.
const loadStubbed = async (relPath, { realStubs = {}, extraHead = '' } = {}) => {
  const file = path.join(SRC, relPath);
  let src = fs.readFileSync(file, 'utf8');

  const stubbed = new Set();
  src = src.replace(IMPORT_RE, (stmt) => {
    for (const n of importedNames(stmt)) if (!(n in realStubs)) stubbed.add(n);
    return '';
  });

  // `import.meta.env` is a Vite construct; Node has no such thing.
  src = src.replace(/import\.meta\.env/g, '({})');

  const head = [
    // A stub is a callable that is also indexable and stringifiable, so it can
    // stand in for a React component, an icon, an image URL or a namespace
    // without the top-level module body caring which it got.
    'const __stub = (name) => new Proxy(function(){ return null; }, {',
    '  get: (t, k) => (k === Symbol.toPrimitive || k === "toString" ? () => "stub:" + name',
    '        : k in t ? t[k] : __stub(name + "." + String(k))),',
    '});',
    ...[...stubbed].map((n) => `const ${n} = __stub(${JSON.stringify(n)});`),
    ...Object.entries(realStubs).map(([n, v]) => `const ${n} = globalThis.__qa_real[${JSON.stringify(v)}];`),
    extraHead,
  ].join('\n');

  const body = head + '\n' + src + `\nexport { ${topLevelBindings(src).join(', ')} };\n`;
  return emit(compile(body, file), path.basename(relPath, path.extname(relPath)));
};

// ── the two modules under test ───────────────────────────────────────────────
export const loadSupabaseMappers = () => loadStubbed('supabase.ts');

export const loadApp = async () => {
  const sb = await loadSupabaseMappers();
  globalThis.__qa_real = {
    supabase: sb.supabase, supabaseEnabled: sb.supabaseEnabled,
    rowToWorkout: sb.rowToWorkout, workoutToRow: sb.workoutToRow,
    rowToBW: sb.rowToBW, bwToRow: sb.bwToRow,
  };
  const app = await loadStubbed('gym-tracker-app.tsx', {
    realStubs: {
      supabase: 'supabase', supabaseEnabled: 'supabaseEnabled',
      rowToWorkout: 'rowToWorkout', workoutToRow: 'workoutToRow',
      rowToBW: 'rowToBW', bwToRow: 'bwToRow',
    },
  });
  return { ...app, ...sb };
};

// ── nested helpers ───────────────────────────────────────────────────────────
// Slice `const <name> = (...) => {...}` out of the source by brace-matching and
// compile it on its own. Only valid for helpers that close over nothing.
export const extractFn = (name, relPath = 'gym-tracker-app.tsx') => {
  const src = fs.readFileSync(path.join(SRC, relPath), 'utf8');
  const start = src.search(new RegExp(`const\\s+${name}\\s*=`));
  if (start < 0) throw new Error(`extractFn: ${name} not found in ${relPath}`);
  const open = src.indexOf('{', src.indexOf('=>', start));
  let depth = 0, i = open;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) { i++; break; }
  }
  const code = src.slice(start, i);
  return emit(compile(`${code}\nexport { ${name} };\n`, relPath), name).then((m) => m[name]);
};
