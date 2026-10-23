// RLS cross-tenant integration test — the authorization model, actually exercised.
//
// Run:  npm run test:rls
//
// The anon key ships in the browser and is safe ONLY because every table is
// RLS-scoped to auth.uid() (CLAUDE.md, README). Migrations are applied BY HAND in the
// Supabase SQL editor, the dev MCP is read-only, and nothing in the five Node suites
// touches a database — so a hand-applied migration that forgets a policy would leak
// every user's health data and NO existing check would notice. This is that check.
//
// It creates two throwaway users, signs each in with the ANON key (the same key and
// path the app uses), and proves that user B cannot read, update or delete user A's
// rows; that an unauthenticated client sees nothing; that `consents` is append-only
// (no UPDATE/DELETE); and that delete_account() erases exactly the caller's data and
// cascades the paired weigh-in. It cleans up both users in a finally block.
//
// ── Requirements ─────────────────────────────────────────────────────────────
//   SUPABASE_URL                your project URL (no /rest/v1 suffix)
//   SUPABASE_SERVICE_ROLE_KEY   service_role key — creates/deletes the test users
//   SUPABASE_ANON_KEY           the anon/publishable key the app ships with
//
// Point it at a DISPOSABLE target — `supabase start` locally, or a scratch project —
// NOT production: it creates and deletes auth users. As a guard it refuses any non-local
// URL unless RLS_TEST_ALLOW_REMOTE=1 is set, so you have to opt in to a remote scratch
// project on purpose. Against `supabase start` the three vars come from `supabase status`.

import { createClient } from '@supabase/supabase-js';

const URL  = process.env.SUPABASE_URL;
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.SUPABASE_ANON_KEY;

if (!URL || !SVC || !ANON) {
  console.error('RLS test needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY.');
  console.error('Against a local stack: `supabase start` then read them from `supabase status`.');
  process.exit(1);
}
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(URL);
if (!isLocal && process.env.RLS_TEST_ALLOW_REMOTE !== '1') {
  console.error(`Refusing to run against a non-local URL (${URL}) — it creates and deletes users.`);
  console.error('Set RLS_TEST_ALLOW_REMOTE=1 only if this is a disposable scratch project, never prod.');
  process.exit(1);
}

const noPersist = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(URL, SVC, noPersist);

let pass = 0, fail = 0;
const assert = (name, cond) => { cond ? (pass++, console.log('  ok  ', name)) : (fail++, console.log('  FAIL', name)); };

const stamp = Date.now();
const emailA = `rls-a-${stamp}@example.com`;
const emailB = `rls-b-${stamp}@example.com`;
const PW = 'correct horse battery staple 42';

// Sign a user in through the ANON key — exactly what the app does.
const signInAs = async (email) => {
  const c = createClient(URL, ANON, noPersist);
  const { error } = await c.auth.signInWithPassword({ email, password: PW });
  if (error) throw new Error(`sign-in ${email}: ${error.message}`);
  return c;
};

let userA, userB;
try {
  ({ data: { user: userA } } = await admin.auth.admin.createUser({ email: emailA, password: PW, email_confirm: true }));
  ({ data: { user: userB } } = await admin.auth.admin.createUser({ email: emailB, password: PW, email_confirm: true }));
  assert('both test users were created', userA?.id && userB?.id);

  const A = await signInAs(emailA);
  const B = await signInAs(emailB);

  // ── A writes a workout + a linked weigh-in (user_id defaults to auth.uid()) ──
  const date = `2026-01-01T00:00:00.000Z`;
  const { data: wIns, error: wErr } = await A.from('workouts')
    .insert({ type: 'push', date, exercises: [], notes: '' }).select();
  assert('A can insert its own workout', !wErr && wIns?.length === 1);
  const aWorkoutId = wIns?.[0]?.id;
  const { error: bwErr } = await A.from('body_weight_log')
    .insert({ date, weight: 80, workout_id: aWorkoutId }).select();
  assert('A can insert its own linked weigh-in', !bwErr);

  // ── A sees its own rows ──────────────────────────────────────────────────────
  const { data: aSees } = await A.from('workouts').select('*');
  assert('A sees its own workout', aSees?.length === 1);

  // ── B must NOT see, update or delete A's rows ────────────────────────────────
  const { data: bSees } = await B.from('workouts').select('*');
  assert('B sees NONE of A\'s workouts (RLS select)', Array.isArray(bSees) && bSees.length === 0);

  const { data: bById } = await B.from('workouts').select('*').eq('id', aWorkoutId);
  assert('B cannot fetch A\'s workout even by id', Array.isArray(bById) && bById.length === 0);

  await B.from('workouts').update({ type: 'legs', notes: 'hijacked' }).eq('id', aWorkoutId);
  const { data: afterUpd } = await A.from('workouts').select('type, notes').eq('id', aWorkoutId);
  assert('B\'s UPDATE of A\'s workout changed nothing', afterUpd?.[0]?.type === 'push' && afterUpd?.[0]?.notes === '');

  await B.from('workouts').delete().eq('id', aWorkoutId);
  const { data: afterDel } = await A.from('workouts').select('id').eq('id', aWorkoutId);
  assert('B\'s DELETE of A\'s workout removed nothing', afterDel?.length === 1);

  // ── An unauthenticated client sees nothing ───────────────────────────────────
  const anon = createClient(URL, ANON, noPersist);
  const { data: anonSees } = await anon.from('workouts').select('*');
  assert('an unauthenticated client sees no workouts', !anonSees || anonSees.length === 0);

  // ── consents is append-only: INSERT + SELECT, deliberately no UPDATE/DELETE ──
  const { data: cIns, error: cErr } = await A.from('consents')
    .insert({ kind: 'terms', version: '1.0', granted_at: date, document: '/terms.html' }).select();
  assert('A can insert a consent row', !cErr && cIns?.length === 1);
  const consentId = cIns?.[0]?.id;

  await A.from('consents').update({ version: '9.9' }).eq('id', consentId);
  const { data: cAfterUpd } = await A.from('consents').select('version').eq('id', consentId);
  assert('consents UPDATE is denied (append-only) — version unchanged', cAfterUpd?.[0]?.version === '1.0');

  await A.from('consents').delete().eq('id', consentId);
  const { data: cAfterDel } = await A.from('consents').select('id').eq('id', consentId);
  assert('consents DELETE is denied (append-only) — row still present', cAfterDel?.length === 1);

  // ── delete_account() erases exactly the caller and cascades the weigh-in ─────
  const { error: delErr } = await A.rpc('delete_account');
  assert('A can call delete_account()', !delErr);
  // A fresh service-role read confirms A's rows are gone and the weigh-in cascaded.
  const { data: leftW } = await admin.from('workouts').select('id').eq('user_id', userA.id);
  const { data: leftBW } = await admin.from('body_weight_log').select('id').eq('user_id', userA.id);
  assert('delete_account removed A\'s workouts', (leftW ?? []).length === 0);
  assert('delete_account cascaded A\'s weigh-in', (leftBW ?? []).length === 0);
  userA = null;   // already deleted by the RPC — don't try again in finally
} finally {
  // Best-effort cleanup — a failed assertion must still not leave test users behind.
  for (const u of [userA, userB]) {
    if (u?.id) { try { await admin.auth.admin.deleteUser(u.id); } catch (e) { console.error('cleanup:', u.id, e.message); } }
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
