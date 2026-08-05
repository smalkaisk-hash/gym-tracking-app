// Shared bits for the two scripts that render messages to real users:
// scripts/dormant.mjs (the PRIVACY.md § 7 warning) and
// scripts/notify-policy-change.mjs (the TERMS.md § 16.2 notice).
//
// Both write files containing real email addresses, and both put a public URL in front
// of a user. Those are the two things worth getting wrong only once.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── The public URL of the published documents ────────────────────────────────
// src/gym-tracker-app.tsx holds these as site-absolute paths ('/privacy.html') because
// the app links them from the same origin it is served from. An email has no origin, so
// it needs the host — and the host is not chosen yet (it is the open `static_host`
// decision in compliance/launch-decisions.json, and the reason legal:release still
// fails).
//
// This is a HARD STOP rather than a placeholder for the same reason build-legal.mjs
// refuses to publish a `{{FILL: …}}`: the failure mode is not an ugly message, it is a
// dead link in the one communication that tells someone their data is about to be
// deleted. A user who cannot reach the policy cannot check the rule being applied to
// them.
export const siteUrl = () => {
  const raw = (process.env.SITE_URL ?? '').trim().replace(/\/+$/, '');
  if (!raw) {
    console.error(
      '\nSITE_URL is not set, so the links in this message would be dead.\n\n' +
      '  SITE_URL=https://fitpulse.example npm run <script>\n\n' +
      'It is the public origin the legal pages are served from. There is no default\n' +
      'because the static host is still an open decision (compliance/launch-decisions.json,\n' +
      '`static_host`) — and a notice that links a user to nothing is worse than no notice,\n' +
      'because it looks like one.');
    process.exit(1);
  }
  if (!/^https:\/\/[^\s/]+/.test(raw)) {
    console.error(`\nSITE_URL is "${raw}", which is not an https:// origin. Google Play and CCPA § 7011 both require the policy to be publicly reachable; http:// is not that.`);
    process.exit(1);
  }
  return raw;
};

// ── Writing a notice file ────────────────────────────────────────────────────
// Always under the repo's own notices/ (gitignored), never process.cwd() — running
// `node ../scripts/dormant.mjs` from elsewhere would otherwise write real email
// addresses to a directory nothing ignores.
//
// The reminder to delete the file afterwards is not housekeeping. legal/TERMS.md § 12.7
// lists exactly five things that survive an account deletion and closes "and nothing
// else"; a rendered notice sitting on the operator's disk after the account is gone is
// a sixth. Migration 0006 makes the database side of that true by cascading — this is
// the same rule applied to the local artefact, which no cascade can reach.
export const writeNotice = (filename, body) => {
  const dir = path.join(root, 'notices');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, filename);
  fs.writeFileSync(file, body, 'utf8');
  return {
    file,
    rel: path.relative(root, file),
    reminder:
      'Delete this file once the messages have gone out. It holds real email addresses,\n' +
      'and legal/TERMS.md § 12.7 says exactly five things survive a deletion — a rendered\n' +
      'notice on disk would be a sixth.',
  };
};
