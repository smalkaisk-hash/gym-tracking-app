-- 0001 — link finish-time weigh-ins to their workout with a real foreign key.
--
-- Phase 1 of PRODUCT-ROADMAP.md. Replaces the fragile correlation the app relied
-- on (body_weight_log.date == workouts.date string equality) with referential
-- integrity. The column is NULLABLE because a standalone weigh-in (the quick-log
-- on the home screen) has no workout. ON DELETE CASCADE means deleting a workout
-- also removes its finish-time weigh-in, which the app previously left orphaned in
-- the body-weight chart.
--
-- Backfill validated against production data on 2026-07-17: of 4 weigh-ins, the 2
-- finish-time ones link to their workouts and the 2 standalone quick-logs stay null.
--
-- NOTE: the app does not yet WRITE workout_id (that wiring is a follow-up, gated on
-- this migration being live). Applying this migration is safe and non-breaking on
-- its own: the new column simply sits populated and unused until the app is wired.

alter table public.body_weight_log
  add column if not exists workout_id uuid references public.workouts(id) on delete cascade;

-- A finish-time weigh-in shares its workout's exact date string and user_id.
update public.body_weight_log b
set workout_id = w.id
from public.workouts w
where b.workout_id is null
  and b.user_id = w.user_id
  and b.date    = w.date;

create index if not exists bw_workout_idx on public.body_weight_log (workout_id);
