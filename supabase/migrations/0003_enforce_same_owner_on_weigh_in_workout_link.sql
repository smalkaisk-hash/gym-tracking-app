-- 0003 — make body_weight_log.workout_id provably point at a workout the SAME user owns.
--
-- What was wrong. Migration 0001 added a single-column FK:
--
--     workout_id uuid references public.workouts(id) on delete cascade
--
-- That guarantees the target workout EXISTS. It does not guarantee it belongs to the
-- same person. The RLS policy on body_weight_log checks `auth.uid() = user_id` and
-- says nothing about workout_id, and the app never sends user_id at all (it relies on
-- the `default auth.uid()` — see bwToRow in src/supabase.ts), so the two columns were
-- only ever kept in agreement by the client's good behaviour. A crafted REST insert
-- with someone else's workout uuid satisfied every constraint on the table.
--
-- Why it matters for deletion. The cascades are wired the wrong way round for a
-- cross-owner row: user A deleting their account cascades auth.users → workouts →
-- body_weight_log, which would delete user B's weigh-in. One user's erasure is not
-- allowed to reach into another user's data, and a per-user delete must be provably
-- confined to that user's rows rather than confined by convention.
--
-- The fix is a composite foreign key, so the database itself checks ownership. It
-- needs a unique constraint on (id, user_id) as its target — id is already the
-- primary key, so this adds no new uniqueness, only the index the FK can reference.
--
-- Nullability is preserved. The FK is MATCH SIMPLE (the default): when workout_id is
-- NULL the constraint is not enforced at all, so a standalone quick-log still stores
-- no workout link, exactly as before.
--
-- Verified against production before writing this file: 4 linked weigh-ins, 4
-- standalone, 0 cross-owner links — so the new constraint validates without a
-- backfill and without dropping a row.

-- The FK target. Redundant as a uniqueness claim (id is the PK); required as an index
-- a composite FK can reference.
alter table public.workouts
  drop constraint if exists workouts_id_user_id_key;
alter table public.workouts
  add  constraint workouts_id_user_id_key unique (id, user_id);

-- Swap the single-column FK for the owner-checking one. Same ON DELETE CASCADE, so
-- deleting a workout still removes its finish-time weigh-in.
alter table public.body_weight_log
  drop constraint if exists body_weight_log_workout_id_fkey;
alter table public.body_weight_log
  add  constraint body_weight_log_workout_id_fkey
  foreign key (workout_id, user_id)
  references public.workouts (id, user_id)
  on delete cascade;

-- Verification (expect: 0 rows).
--   select b.id from public.body_weight_log b
--   join public.workouts w on w.id = b.workout_id
--   where w.user_id <> b.user_id;
