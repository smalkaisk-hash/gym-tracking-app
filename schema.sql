-- FitPulse — Supabase schema (Path A: real auth + Row Level Security).
--
-- This is the CANONICAL current schema. The change history lives in
-- supabase/migrations/ (the tracked chain); this file is the flattened result and
-- is what a fresh read should consult. Safe to re-run: guards are IF NOT EXISTS /
-- drop-before-create.
--
-- Design notes:
--   • `date` columns are TEXT, not timestamptz, on purpose. The app treats a
--     workout's date as an opaque ISO string. TEXT round-trips the exact string
--     the client generated; timestamptz would re-normalise it. A finish-time
--     weigh-in still shares its workout's date string, but the authoritative link
--     is now body_weight_log.workout_id (migration 0001), not that equality — so
--     moving `date` to timestamptz later no longer risks the correlation.
--   • `exercises` is JSONB — a workout is one document (nested sets[] with a
--     nullable weight = bodyweight). The app never queries inside it server-side.
--     Exercise identity is still the name string; giving exercises stable ids is
--     the open Phase 1 item (see PRODUCT-ROADMAP.md).
--   • user_id defaults to auth.uid() so inserts don't need to send it; RLS still
--     enforces it via WITH CHECK.

-- ── workouts ─────────────────────────────────────────────────────────────────
create table if not exists public.workouts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  type        text not null,
  body_weight real,                       -- null = weigh-in skipped
  exercises   jsonb not null default '[]'::jsonb,
  date        text not null,              -- ISO string from the client
  notes       text default '',
  duration    integer,                    -- seconds; null when the session timer was off
  created_at  timestamptz not null default now()
);
create index if not exists workouts_user_date_idx on public.workouts (user_id, date);

-- ── body_weight_log ──────────────────────────────────────────────────────────
create table if not exists public.body_weight_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  date       text not null,               -- ISO string; a finish-time weigh-in shares its workout's date
  weight     real not null,
  workout_id uuid references public.workouts(id) on delete cascade  -- null = standalone quick-log (migration 0001)
);
create index if not exists bw_user_date_idx on public.body_weight_log (user_id, date);
create index if not exists bw_workout_idx   on public.body_weight_log (workout_id);

-- ── settings (one row per user) ──────────────────────────────────────────────
create table if not exists public.settings (
  user_id     uuid primary key default auth.uid() references auth.users on delete cascade,
  weekly_goal integer,
  prefs       jsonb,
  updated_at  timestamptz not null default now()
);

-- ── Row Level Security: each user sees and writes only their own rows ─────────
alter table public.workouts        enable row level security;
alter table public.body_weight_log enable row level security;
alter table public.settings        enable row level security;

drop policy if exists "own workouts" on public.workouts;
create policy "own workouts" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own body_weight_log" on public.body_weight_log;
create policy "own body_weight_log" on public.body_weight_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own settings" on public.settings;
create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
