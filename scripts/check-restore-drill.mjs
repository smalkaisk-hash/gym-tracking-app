// Keeps the restore runbook honest about a precondition the schema enforces, and keeps
// the two halves of the backup/restore pair naming the same tables.
//
// WHY THIS EXISTS. Every table in `public` carries `user_id ... references auth.users`
// (schema.sql), and `backup.mjs` does NOT back up `auth.users`. The service_role key
// used by backup/restore bypasses RLS but NOT foreign-key constraints, so restoring the
// source project's rows into a project whose `auth.users` is empty fails on the first
// table. BACKUP-RESTORE.md once asserted the opposite — that an auth-less scratch restore
// "still works for a structural drill … user_id has no FK requirement" — which sent the
// operator into a drill that cannot succeed, at the one moment (disaster recovery) they
// most need it to. Nothing caught it because it was a prose claim about runtime behaviour.
// This is the same failure shape scripts/check-backup-claim.mjs exists for: a claim that
// reality contradicts, with no gate noticing. So, while the FK exists in the schema, the
// runbook must positively document the precondition.
//
// It also asserts backup.mjs's TABLES and restore.mjs's ORDER list the same tables — a
// table backed up but never restored (or vice versa) is exactly the silent gap the
// "must stay in step" comments in both files warn about, with nothing enforcing it.
//
// Runs inside `npm run build`, alongside check:monitoring and check:backups.
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), 'utf8');

const fail = (lines) => {
  console.error(`\n${'─'.repeat(72)}`);
  console.error('BUILD STOPPED — the restore runbook disagrees with the code/schema.');
  console.error(`${'─'.repeat(72)}\n`);
  for (const l of lines) console.error(l);
  console.error('');
  process.exit(1);
};

const schema = read('schema.sql');
const runbook = read('BACKUP-RESTORE.md');

// ── 1. FK precondition: while the schema enforces it, the runbook must document it. ──
const fkEnforced = /references\s+auth\.users/i.test(schema);
// The load-bearing phrase in the runbook's warning. Keep it in step if you reword there.
const RUNBOOK_PHRASE = 'foreign key to `auth.users`';
if (fkEnforced && !runbook.includes(RUNBOOK_PHRASE)) {
  fail([
    'schema.sql declares `user_id ... references auth.users` on the backed-up tables,',
    'so a restore into a project with an empty auth.users fails on the first table.',
    '',
    `BACKUP-RESTORE.md no longer documents that precondition (expected the phrase`,
    `"${RUNBOOK_PHRASE}"). Restore the warning, or — if the FKs were genuinely dropped —`,
    'remove this guard in the same change so it tests the real situation.',
  ]);
}

// ── 2. backup.mjs TABLES and restore.mjs ORDER must name the same set of tables. ──
const backupSrc = read('scripts/backup.mjs');
const restoreSrc = read('scripts/restore.mjs');

const tablesBlock = backupSrc.match(/const\s+TABLES\s*=\s*\{([\s\S]*?)\}/);
const orderBlock = restoreSrc.match(/const\s+ORDER\s*=\s*\[([\s\S]*?)\]/);
if (!tablesBlock || !orderBlock) {
  fail(['Could not locate TABLES in backup.mjs or ORDER in restore.mjs to compare them.']);
}
const backupTables = [...tablesBlock[1].matchAll(/(\w+)\s*:/g)].map((m) => m[1]);
const restoreTables = [...orderBlock[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);

const onlyBackup = backupTables.filter((t) => !restoreTables.includes(t));
const onlyRestore = restoreTables.filter((t) => !backupTables.includes(t));
if (onlyBackup.length || onlyRestore.length) {
  fail([
    'backup.mjs TABLES and restore.mjs ORDER name different tables:',
    onlyBackup.length ? `    backed up but never restored: ${onlyBackup.join(', ')}` : '',
    onlyRestore.length ? `    restored but never backed up: ${onlyRestore.join(', ')}` : '',
    '',
    'A table in one list but not the other is a silent gap — the backup file would claim',
    'to hold rows the restore never writes, or vice versa. Keep the two lists in step.',
  ].filter(Boolean));
}

console.log(`restore drill: FK precondition documented; backup/restore cover the same ${backupTables.length} tables. OK.`);
