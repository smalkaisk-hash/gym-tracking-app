# FitPulse — Product Roadmap

The README and CLAUDE.md still describe this as a "for-fun personal project." That is
changing: **FitPulse is being taken toward a real product with real users.** This file
captures what has to change to survive that transition, in the order that protects user
data — because the person who wrote it will also be user #1, and does not want to lose
their own training history.

The through-line: the app is small (**~2 real rows** at time of writing), which is exactly
why now is the cheap moment to fix the things that get expensive with scale. Two of these
phases (0 and 1) have a brutal cost curve — an afternoon today, a migration project with a
maintenance window at 100k rows. Do those before launch, not after.

Nothing here is implemented yet. This is the plan, written down.

---

## Phase 0 — Stop silent data loss ✅ IMPLEMENTED (logic-verified; live browser test pending)

**The bug.** Writes are optimistic and await a Supabase call whose failure only
`console.error`s. On the next load, the **hydrate** effect fetches server rows and
*replaces* state wholesale (`setWorkouts(rows.map(rowToWorkout))`), then the write-back
effect persists that server-only list over the cache. So a workout logged while offline —
during a maintenance window, a dead connection, a locked phone that never ressynced — is
**silently dropped on the next reload after a successful hydrate.** No error, no trace,
gone from both cache and server.

The one-time localStorage→Supabase migration does *not* save it: that path only runs when
the account has zero server data. Once you have a single synced row, anything logged
offline afterward is on a countdown to the next reload. Edits have the same shape — an
offline `updateWorkout` reverts to the server version at hydrate.

**The fix (minimal, honest, vendor-neutral):**
1. **Hydrate must merge, not replace.** Keep any local row whose `id` is not in the server
   result set (i.e. never-synced rows) instead of clobbering it. This is the actual bug.
2. **Surface failed writes.** Replace `console.error` in the write handlers with a visible
   signal — mark the row unsynced and show a badge / toast. The user must be able to tell
   a save didn't land.

**Why first:** it directly answers "I don't want to lose data," it's self-contained, and
it locks in nothing — no sync vendor, no schema decision. Pure downside protection.

**Done when:** logging a workout with the network offline, then reloading online, keeps the
workout; and any write that fails is visible in the UI, not just the console.

**Status:** implemented via a client-only `_sync` marker on rows + a merging hydrate.
Verified with `tsc` and an isolated 5-case test of the merge semantics (offline insert
survives, offline edit beats a stale server row, no duplication on resync, remote delete
still propagates, mixed set reconciles). **Not yet exercised in a live browser** with the
network actually throttled — that end-to-end pass is the remaining confirmation.

---

## Phase 1 — Fix the data model while it's still ~2 rows (irreversible-if-delayed)

Three modelling choices are fine for one user and become fatal (or migration-projects)
with many. This is the phase where "now vs. later" is a real, one-way cost difference.

> **Constraint hit during implementation:** the development MCP connection is
> **read-only**, so schema changes can't be applied automatically — they're prepared as
> migration files under `supabase/migrations/` and applied by hand (see that folder's
> README). Backfills were validated with read-only `SELECT`s against production first.

1. **Exercise names are the primary key** — 🔲 **OPEN, needs a design decision from you.**
   The string IS the identity in every stored workout, which is why CLAUDE.md carries a
   standing rule to *never rename or remove an exercise* — and why generic `Leg Curl` still
   sits beside `Seated Leg Curl` (neither can be touched). No typo fixes, no localization,
   no merging duplicates, ever. This is the highest-value Phase 1 item AND the highest blast
   radius (the catalogue is code, keyed by name, used as React keys and in the Progress
   dropdown). **The fork:** keep the catalogue code-owned and just add stable ids
   (additive, lower-risk), or make the DB the catalogue's source of truth so users can
   create/edit exercises (a real product feature). I did not blind-rewrite this — see
   "Exercise identity — the open decision" below.

2. **The workout ↔ weigh-in join is string equality on a formatted date** — ✅ **migration
   ready (`0001`), pending manual apply.** `body_weight_log.workout_id` FK added, backfill
   validated (2 finish-time weigh-ins link, 2 standalone stay null), `ON DELETE CASCADE`.
   The app doesn't write `workout_id` yet (gated on the migration being live), but the
   related orphan bug — `deleteWorkout` leaving the finish-time weigh-in in the chart — is
   already fixed in the client. Once `0001` is applied, wiring the app to prefer
   `workout_id` over the date match is a small follow-up, after which `date` can move to
   `timestamptz`.

3. **`exercises` is a JSONB document** the app never queries server-side — 🔲 **deferred on
   purpose.** Full relational explosion (`workout_exercises` + `sets` tables) mostly buys
   server-side per-set analytics, which don't exist yet, at the cost of the largest rewrite
   in the app. Do it when analytics move server-side, not before. Exercise *identity* (item
   1) does not require it — a stable id can live inside the JSONB.

**Why before Phase 2:** the sync engine syncs whatever schema exists. Fix the schema first,
then choose the engine.

### Exercise identity — the open decision (blocks completing item 1)

Two viable shapes, and it's your call because it's hard to walk back:

- **A — Code-owned catalogue + stable ids (recommended first step).** Keep `EXERCISES` in
  code as the picker's structure; give each entry a stable id; store `exerciseId` alongside
  `name` in workout data; reads group by id with a name fallback. Additive, reversible-ish,
  removes the "can't rename" ceiling. Does **not** let users invent exercises.
- **B — DB-owned catalogue.** An `exercises` table is the source of truth; users can
  create/rename/merge. Bigger change, and a genuine product feature (moderation, dedup,
  per-user vs. global). Only worth it if user-defined exercises are on the near roadmap.

Recommendation: **A now** (unblocks renaming/localization/dedup at low risk), **B later**
if and when user-created exercises become a feature. Pick one and item 1 becomes
implementable.

---

## Phase 2 — Buy sync; do not hand-roll it — 🔲 BLOCKED on your account/decision

With the model fixed, make the offline promise *real* (not just *safe*): adopt a
Postgres/Supabase-native sync engine — **PowerSync** or **ElectricSQL**. Hand-rolled sync
(outboxes, replay, conflict resolution) is a category of bug that eats teams alive, and
"we lost your workout" is the one failure a fitness product cannot ship.

**This can't be done autonomously** — it needs an account with the chosen vendor, its
client SDK + keys, and a real vendor decision. Groundwork that *is* in place: the Phase 0
`_sync` marker already models per-row sync state, and Phase 1 gives the engine a clean
schema to replicate. When you've picked a vendor and created the project, the integration
is the next concrete step.

**Conflict policy is an explicit decision, not a default.** Today settings use last-write-
wins on a 600ms debounce — silent data loss the moment a phone and a laptop disagree.
Workouts are append-mostly, which is a gift: model a finished workout as **immutable**, and
most conflicts stop existing.

---

## Phase 3 — The product floor (rides alongside; not blockers)

- ✅ **A real migration chain.** Done — `supabase/migrations/` now holds `0000_baseline`
  (the pre-existing schema) + `0001` (the weigh-in FK), with a README runbook. `schema.sql`
  stays as the flattened canonical state.
- ✅ **Tests on the reconcile/sync logic.** Done (a start) — `tests/sync-merge.test.mjs`
  runs the merge semantics with `node`, no framework added. Caveat: it *mirrors* the inline
  logic rather than importing it (the app keeps state logic inside the one big component);
  extracting the reconcile helpers into an importable module is the follow-up.
- 🔲 **Error reporting (Sentry or equivalent).** Needs your Sentry account + DSN, so it's a
  hand-off: the SDK wiring is small once the DSN exists (an env var like the Supabase keys).
  Highest-priority Phase 3 item — visibility is the whole point of Phase 0, and right now a
  production sync failure still only reaches `console.error`.
- 🔲 **Enable leaked-password protection** in Supabase Auth (HaveIBeenPwned check). Auth is
  email + password, so this lint is live, not moot. **Dashboard toggle — you must flip it**
  (Auth → Providers → Email → "Leaked password protection"); the MCP doesn't expose it.
  See <https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection>.
- 🔲 **Health-data floor:** body weight is health data. Point-in-time recovery / backups,
  auth rate limiting, and a real account-deletion (GDPR) path raise the compliance floor.
  The deletion path wants an edge function with the service role (needs deploy access).

---

## Deliberately deferred (fine as-is until scale or a second contributor)

These are real, but not worth paying for at current size — revisit when the constraint
actually bites:

- **`({ ... }: any)` everywhere + `strict` off.** Fine solo; a liability the moment a
  second person edits the file. Do it as one typing pass with `strict: true`, not
  piecemeal.
- **One 3.3k-line file** (`src/gym-tracker-app.tsx`). Fine at one contributor; split when
  there are two.
- **JSONB workout document** beyond the Phase 1 normalization — only matters once you query
  inside it.

---

*One-sentence summary: the sync bug is what bites first, but the data model is what you
can't undo later — so at ~2 rows, fix the model (Phase 1), buy the sync (Phase 2), and make
failures visible (Phase 0 + Phase 3) before anyone but you can log a workout.*
