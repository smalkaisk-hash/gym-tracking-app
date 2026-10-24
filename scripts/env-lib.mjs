// Load a gitignored dotenv file into process.env for the operator scripts, so the
// service_role key can live in a file instead of being typed on the command line on
// every run — where it lands in shell history (`.bash_history`,
// PowerShell's ConsoleHost_history.txt) and, from there, in anything that reads it.
// The service_role key bypasses RLS — treat it like a root password — so keeping it off
// the command line is the point of this helper.
//
// This is the piece BACKUP-RESTORE.md's "put them in a .env.backup file" always
// implied but nothing actually did: `node scripts/backup.mjs` never read that file, and
// `source .env.backup` is a bash-ism with no PowerShell equivalent, so on Windows there
// was no history-free way to supply the key at all.
//
// Precedence is deliberate and safe: Node's loader does NOT overwrite a variable that is
// already set in the environment. So an explicit `SUPABASE_SERVICE_ROLE_KEY=… npm run
// backup` still wins, and the file only fills in what the shell didn't — a stale value
// in the file can never silently redirect a run the operator pointed somewhere explicit.
//
// A missing file is fine: the scripts fall back to the shell environment and each one
// hard-stops on its own if a required variable is still absent. Never commit the file —
// `.env.*` is gitignored (only `.env.example` is tracked).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const loadOpsEnv = (...files) => {
  // process.loadEnvFile landed in Node 20.12 and is stable from 22. Feature-detect so an
  // older runtime degrades to the shell-environment path rather than throwing.
  if (typeof process.loadEnvFile !== 'function') return;
  for (const f of files) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) continue;
    try {
      process.loadEnvFile(p);
    } catch (e) {
      // A malformed file shouldn't abort the run — the shell env may still carry what's
      // needed, and the script's own missing-var check is the real gate.
      console.error(`Warning: could not read ${f}: ${e.message}`);
    }
  }
};
