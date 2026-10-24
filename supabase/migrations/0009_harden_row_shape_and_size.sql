-- 0009 — Server-side shape and size constraints on the user-writable tables.
--
-- WHY. RLS scopes every row to auth.uid(), so a signed-in user can only write their OWN
-- rows — but it checks OWNERSHIP, not SHAPE. The browser client holds the anon key and a
-- real session, so any user can POST straight to PostgREST (bypassing the app's own
-- input validation and sanitizers, which run client-side) and store a malformed or
-- enormous row under their own id. Two concrete harms this closes:
--
--   1. A durable crash. `workouts.exercises` is JSONB `not null default '[]'`, but
--      `not null` blocks only SQL NULL — a JSON scalar/string ("x", 5) is still valid
--      JSONB. A row with `exercises: "x"` (or an exercise whose `sets` is a scalar) syncs
--      to every device the user owns and crashes History's `exercise.sets.map(...)` past
--      the ErrorBoundary, whose cache-clear recovery cannot help because the next hydrate
--      re-reads the poisoned server row. The app now also guards this on READ
--      (sanitizeWorkoutShape); this constraint blocks it at the SOURCE as defence in
--      depth, and for any client that is not the app.
--
--   2. Unbounded storage. TEXT/JSONB columns accept ~1 GB each. A user could store a
--      multi-megabyte `notes`/`exercises`/`prefs`, abusing storage and stressing the
--      service_role backup/export reads (scripts/backup.mjs, dormant.mjs) that load every
--      user's rows. The size caps are generous (far above any real workout) but finite.
--
-- SAFE ON LIVE DATA. Every constraint is added NOT VALID: Postgres enforces it for all
-- new INSERT/UPDATE immediately, but does NOT re-check existing rows (so this cannot fail
-- or lock on the current dataset, and a legacy row that happens to exceed a limit is
-- grandfathered rather than making the whole migration error). The attack is always a NEW
-- write, so NOT VALID fully blocks it. The optional VALIDATE step at the bottom confirms
-- the existing rows too — run it only after the count queries below return 0.
--
-- This adds no table, so it does not touch TERMS.md § 12.7's closed list of five
-- survivors, nor backup.mjs TABLES / restore.mjs ORDER (check:restore-drill). It does add
-- one small IMMUTABLE helper function (fitpulse_max_sets_per_exercise) used by a CHECK —
-- a function is not a survivor table and not a backup target, so those checks are unaffected.
--
--   3. A durable render CRASH from element COUNT (not bytes). Several render paths SPREAD a
--      set array into a call — Math.max(...exercise.sets.map(...)) in ExerciseCard, the
--      History editor and ProgressScreen's top-set series. A spread of ~125k+ elements throws
--      RangeError past the root ErrorBoundary, and the poison lives server-side so the
--      cache-clear recovery cannot help. The byte cap below does NOT catch this: a huge array
--      of tiny repeated sets compresses far under 256 KiB. So the element COUNT is capped too,
--      in BOTH dimensions (exercises-per-workout and sets-per-exercise). The app also clamps
--      on READ (sanitizeWorkoutShape, MAX_EXERCISES_PER_WORKOUT / MAX_SETS_PER_EXERCISE); this
--      is the same defence at the source, for any client that is not the app.
--
-- Re-runnable: each constraint is guarded on pg_constraint, so a second run is a no-op.

-- Generous ceilings. A real workout note is a sentence or two; a real session is a few
-- dozen exercises. These sit far above that and only stop abuse.
--   • text fields: lengths that no legitimate value approaches
--   • exercises JSONB: 256 KiB compressed (pg_column_size is the on-disk/TOAST size)
--   • prefs JSONB:     128 KiB compressed
--   • weights: the app's own MAX_WEIGHT_KG = 100000, and > 0 (0/negative is not a weight)
--   • element counts: generous ceilings far above any real session, to stop the Math.max
--     spread crash and bulk storage abuse that the byte cap misses (compressible arrays)

-- Largest `sets` array across an exercises JSONB — used by the sets-per-exercise CHECK
-- below. IMMUTABLE + reads only its argument, so it is safe in a constraint; the CASE
-- guard means a non-array `exercises` can never make it error (jsonb_array_elements
-- requires an array). A second run harmlessly replaces an identical definition.
create or replace function public.fitpulse_max_sets_per_exercise(ex jsonb)
returns integer language sql immutable parallel safe as $$
  select coalesce(max(jsonb_array_length(e -> 'sets')), 0)
  from jsonb_array_elements(case when jsonb_typeof(ex) = 'array' then ex else '[]'::jsonb end) as e
  where jsonb_typeof(e -> 'sets') = 'array'
$$;

do $$
begin
  -- ── workouts ────────────────────────────────────────────────────────────────
  if not exists (select 1 from pg_constraint where conname = 'workouts_exercises_is_array') then
    alter table public.workouts
      add constraint workouts_exercises_is_array
      check (jsonb_typeof(exercises) = 'array') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workouts_exercises_size') then
    alter table public.workouts
      add constraint workouts_exercises_size
      check (pg_column_size(exercises) <= 262144) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workouts_type_len') then
    alter table public.workouts
      add constraint workouts_type_len
      check (char_length(type) <= 64) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workouts_date_len') then
    alter table public.workouts
      add constraint workouts_date_len
      check (char_length(date) <= 64) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workouts_notes_len') then
    alter table public.workouts
      add constraint workouts_notes_len
      check (notes is null or char_length(notes) <= 20000) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workouts_body_weight_range') then
    alter table public.workouts
      add constraint workouts_body_weight_range
      check (body_weight is null or (body_weight > 0 and body_weight <= 100000)) not valid;
  end if;

  -- Element-count caps. The DB ceilings sit ABOVE the app's own read-clamp
  -- (MAX_EXERCISES_PER_WORKOUT=200 / MAX_SETS_PER_EXERCISE=1000) so a legitimate app write
  -- never trips the server, while abuse and the ~125k-element Math.max spread crash are
  -- blocked well below the ~125k RangeError threshold. These are the count defence the
  -- byte cap above cannot provide (a repetitive array compresses under 256 KiB).
  if not exists (select 1 from pg_constraint where conname = 'workouts_exercises_count') then
    alter table public.workouts
      add constraint workouts_exercises_count
      check (jsonb_typeof(exercises) <> 'array' or jsonb_array_length(exercises) <= 1000) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workouts_sets_per_exercise') then
    alter table public.workouts
      add constraint workouts_sets_per_exercise
      check (public.fitpulse_max_sets_per_exercise(exercises) <= 5000) not valid;
  end if;

  -- ── body_weight_log ──────────────────────────────────────────────────────────
  if not exists (select 1 from pg_constraint where conname = 'bw_weight_range') then
    alter table public.body_weight_log
      add constraint bw_weight_range
      check (weight > 0 and weight <= 100000) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bw_date_len') then
    alter table public.body_weight_log
      add constraint bw_date_len
      check (char_length(date) <= 64) not valid;
  end if;

  -- ── settings ──────────────────────────────────────────────────────────────────
  if not exists (select 1 from pg_constraint where conname = 'settings_prefs_is_object') then
    alter table public.settings
      add constraint settings_prefs_is_object
      check (prefs is null or jsonb_typeof(prefs) = 'object') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'settings_prefs_size') then
    alter table public.settings
      add constraint settings_prefs_size
      check (prefs is null or pg_column_size(prefs) <= 131072) not valid;
  end if;
end $$;

-- OPTIONAL — run only after confirming no existing row violates (see README "To apply
-- 0009"). VALIDATE acquires a brief SHARE UPDATE EXCLUSIVE lock per table and scans it;
-- the NOT VALID constraints above already protect every future write regardless.
--
--   alter table public.workouts        validate constraint workouts_exercises_is_array;
--   alter table public.workouts        validate constraint workouts_exercises_size;
--   alter table public.workouts        validate constraint workouts_type_len;
--   alter table public.workouts        validate constraint workouts_date_len;
--   alter table public.workouts        validate constraint workouts_notes_len;
--   alter table public.workouts        validate constraint workouts_body_weight_range;
--   alter table public.workouts        validate constraint workouts_exercises_count;
--   alter table public.workouts        validate constraint workouts_sets_per_exercise;
--   alter table public.body_weight_log validate constraint bw_weight_range;
--   alter table public.body_weight_log validate constraint bw_date_len;
--   alter table public.settings        validate constraint settings_prefs_is_object;
--   alter table public.settings        validate constraint settings_prefs_size;
