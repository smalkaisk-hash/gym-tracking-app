-- 0000_baseline — the schema as it existed before the migration chain began.
--
-- This mirrors the original hand-applied schema.sql. It is ALREADY APPLIED on the
-- production project (dhxsamkaqszffajcwuzn) — do NOT re-run it there. It exists so a
-- fresh environment (a staging branch, a new project) can be built up from zero by
-- running the migrations in order. Everything is guarded (IF NOT EXISTS /
-- drop-before-create), so re-running is harmless if you're unsure.

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
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users on delete cascade,
  date     text not null,                 -- ISO string; matches a workout's date for finish-time weigh-ins
  weight   real not null
);
create index if not exists bw_user_date_idx on public.body_weight_log (user_id, date);

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
