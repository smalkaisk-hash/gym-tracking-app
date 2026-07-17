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

## Phase 0 — Stop silent data loss (do first; ~1–2h; no lock-in)

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

---

## Phase 1 — Fix the data model while it's still ~2 rows (irreversible-if-delayed)

Three modelling choices are fine for one user and become fatal (or migration-projects)
with many. This is the phase where "now vs. later" is a real, one-way cost difference.

1. **Exercise names are the primary key.** The string IS the identity in every stored
   workout, which is why CLAUDE.md carries a standing rule to *never rename or remove an
   exercise* — and why generic `Leg Curl` still sits beside `Seated Leg Curl` (neither can
   be touched). That means no typo fixes, no localization, no merging duplicates, ever.
   → Introduce an `exercises` table (uuid PK); workouts reference the id. Names become
     editable data.

2. **The workout ↔ weigh-in join is string equality on a formatted date**
   (`body_weight_log.date === workouts.date`). It works only because one client generates
   both strings in one tick. A second device, clock skew, or a millisecond of drift
   silently orphans the weigh-in — no FK, no referential integrity catches it. (This is
   also why `date` is TEXT instead of `timestamptz`.)
   → `body_weight_log.workout_id uuid references workouts(id)`. Then `date` can go back to
     `timestamptz`, since the FK removes the reason TEXT existed.

3. **`exercises` is a JSONB document** the app never queries server-side, and nothing
   validates its contents (hence the `?? 0` / `!= null` guards on every read). Per-set
   analytics across a real user base want rows, not documents.
   → `workout_exercises` + `sets` tables.

**Deliverables:** the schema migration + a backfill script for existing rows. At ~2 rows
the script is throwaway; at 100k it is a project with a rollback plan.

**Why before Phase 2:** the sync engine syncs whatever schema exists. Fix the schema first,
then choose the engine.

---

## Phase 2 — Buy sync; do not hand-roll it

With the model fixed, make the offline promise *real* (not just *safe*): adopt a
Postgres/Supabase-native sync engine — **PowerSync** or **ElectricSQL**. Hand-rolled sync
(outboxes, replay, conflict resolution) is a category of bug that eats teams alive, and
"we lost your workout" is the one failure a fitness product cannot ship.

**Conflict policy is an explicit decision, not a default.** Today settings use last-write-
wins on a 600ms debounce — silent data loss the moment a phone and a laptop disagree.
Workouts are append-mostly, which is a gift: model a finished workout as **immutable**, and
most conflicts stop existing.

---

## Phase 3 — The product floor (rides alongside; not blockers)

- **Error reporting (Sentry or equivalent).** Every sync failure today logs to a console
  nobody reads; in production you would never learn users are losing data. This arguably
  belongs *with* Phase 0 — visibility is the whole point of Phase 0.
- **A real migration chain.** [schema.sql](schema.sql) is idempotent re-runnable DDL, which
  is not versioning. Move to `supabase/migrations/`.
- **Tests on the reconcile/sync logic specifically.** There is currently no test framework
  at all (`npm run build` / tsc is the only check), and the merge logic from Phases 0–2 is
  exactly the code that must not silently regress.
- **Enable leaked-password protection** in Supabase Auth (HaveIBeenPwned check). Auth is
  email + password, so this lint is live, not moot.
  See <https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection>.
- **Health-data floor:** body weight is health data. Point-in-time recovery / backups,
  auth rate limiting, and a real account-deletion (GDPR) path raise the compliance floor.

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
