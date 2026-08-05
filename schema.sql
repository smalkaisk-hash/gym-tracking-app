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
--     Each logged exercise carries a stable `exerciseId` (a slug) inside the JSONB;
--     that, not the display name, is the app-side identity (see PRODUCT-ROADMAP.md
--     Phase 1). The DB shape is unchanged — the id rides inside the document.
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
  workout_id uuid                          -- null = standalone quick-log (migration 0001)
);

-- ORDER MATTERS HERE, and it is the reason this block sits below body_weight_log rather
-- than beside the workouts table it constrains. Postgres refuses to drop a unique
-- constraint that a foreign key still references, so dropping workouts_id_user_id_key
-- while body_weight_log_workout_id_fkey pointed at it errored out — on a re-run against
-- a database where 0003 was already applied, i.e. exactly the "safe to re-run" case this
-- file promises. The FK has to go first, and it can only be dropped once the table
-- holding it exists.
alter table public.body_weight_log drop constraint if exists body_weight_log_workout_id_fkey;

-- Target for body_weight_log's composite FK (migration 0003). `id` is already the
-- primary key, so this adds no new uniqueness — only an index a two-column FK can
-- reference, which is what lets the weigh-in link be ownership-checked by Postgres.
alter table public.workouts drop constraint if exists workouts_id_user_id_key;
alter table public.workouts add  constraint workouts_id_user_id_key unique (id, user_id);

-- The workout link is OWNERSHIP-CHECKED, not just existence-checked (migration 0003).
-- A single-column FK to workouts(id) proves the workout exists but not that it belongs
-- to the same user — RLS on this table only constrains user_id, and the client never
-- sends user_id at all (it relies on the default above), so nothing but client good
-- behaviour kept the two columns in agreement. That matters for deletion: a row
-- pointing at ANOTHER user's workout would be destroyed when that user deleted their
-- account, letting one person's erasure reach into someone else's data. The composite
-- FK below makes same-owner a database invariant. MATCH SIMPLE (the default) means a
-- NULL workout_id is exempt, so a standalone quick-log still links to nothing.
alter table public.body_weight_log drop constraint if exists body_weight_log_workout_id_fkey;
alter table public.body_weight_log
  add  constraint body_weight_log_workout_id_fkey
  foreign key (workout_id, user_id) references public.workouts (id, user_id)
  on delete cascade;
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

-- ── consents (append-only evidence of consent) ───────────────────────────────
-- GDPR Art. 7(1) puts the burden of DEMONSTRATING consent on the controller. The
-- copy in auth.users.raw_user_meta_data is written first (it survives an abandoned
-- onboarding) but is user-writable, so it is a record rather than evidence. This
-- table is the evidence half, and it is append-only BY CONSTRUCTION: RLS is on with
-- an INSERT and a SELECT policy and deliberately no UPDATE and no DELETE policy —
-- under RLS an operation with no policy is denied — plus the matching revokes.
-- Do not add an update or delete policy. (Migration 0004.)
create table if not exists public.consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  kind        text not null check (kind in ('health_data', 'terms', 'age')),
  version     text not null default '',   -- POLICY_VERSION / TERMS_VERSION at the time; '' for age
  granted_at  timestamptz not null,       -- when the user ticked the box (client clock)
  recorded_at timestamptz not null default now(),  -- when the server stored it
  document    text not null default '',   -- URL of the exact text shown, e.g. /privacy.html
  created_at  timestamptz not null default now()
);
create index if not exists consents_user_idx on public.consents (user_id, kind, recorded_at desc);

alter table public.consents enable row level security;

drop policy if exists "insert own consents" on public.consents;
create policy "insert own consents" on public.consents
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "read own consents" on public.consents;
create policy "read own consents" on public.consents
  for select to authenticated using (auth.uid() = user_id);

revoke update, delete, truncate on public.consents from authenticated, anon;

-- The timestamps are the server's, not the client's (migration 0007). A column DEFAULT
-- applies only when the client omits the column, and PostgREST lets any session send
-- `recorded_at` with any value — so the column that was meant to rebut a fabricated
-- consent was itself forgeable. Append-only stops a row being rewritten; this stops a
-- false one being written. granted_at stays the user's own clock (it is when THEY ticked
-- the box) but is bounded to a plausible window.
create or replace function public.consents_stamp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  floored timestamptz;
begin
  new.recorded_at := now();
  new.created_at  := now();
  if new.granted_at is null then
    new.granted_at := now();
  end if;
  if new.granted_at > now() + interval '1 hour' then
    raise exception 'consents.granted_at is in the future (%)', new.granted_at;
  end if;
  select greatest(new.granted_at, u.created_at) into floored
  from auth.users u where u.id = new.user_id;
  if floored is not null then
    new.granted_at := floored;
  end if;
  return new;
end;
$$;

drop trigger if exists consents_stamp_trg on public.consents;
create trigger consents_stamp_trg
  before insert on public.consents
  for each row execute function public.consents_stamp();

revoke all on function public.consents_stamp() from anon, authenticated, public;

-- ── dormancy_notices (evidence the § 7 warning was sent) ─────────────────────
-- legal/PRIVACY.md § 7 and legal/TERMS.md § 12.9 promise a warning at 24 months of
-- inactivity before deletion at 36. Rendering that message into notices/ is not evidence
-- anyone received it, and this is the only promise in the document set whose breach
-- DESTROYS the user's data — so scripts/dormant.mjs refuses to delete an account with no
-- qualifying row here. With nothing recorded the dormancy rule is inert and deletes
-- nobody, which is the safe direction to fail in. (Migration 0006.)
--
-- ON DELETE CASCADE is deliberate: a row outliving the account would be a sixth thing
-- surviving a deletion, and legal/TERMS.md § 12.7 lists exactly five and closes "and
-- nothing else". The row's job is to gate a deletion; once that has happened it is done.
create table if not exists public.dormancy_notices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  sent_at      timestamptz not null default now(),  -- when the warning actually went out
  channel      text not null check (channel in ('email', 'in_app', 'other')),
  deletion_due timestamptz not null,                -- the date the warning told them
  note         text not null default '',            -- free text, e.g. the message id
  created_at   timestamptz not null default now()
);

create index if not exists dormancy_notices_user_idx
  on public.dormancy_notices (user_id, sent_at desc);

alter table public.dormancy_notices enable row level security;

-- Read-only from a session, and only your own. A user who could DELETE one could make
-- themselves undeletable; a controller who could quietly INSERT one from the browser
-- could manufacture the evidence that a deletion was warned. Only the service_role key,
-- which bypasses RLS, records a notice.
drop policy if exists "read own dormancy notices" on public.dormancy_notices;
create policy "read own dormancy notices" on public.dormancy_notices
  for select to authenticated using (auth.uid() = user_id);

revoke insert, update, delete, truncate on public.dormancy_notices from authenticated, anon;

-- ── Self-service account deletion ─────────────────────────────────────────────
-- The browser client holds only the anon key, which can't touch auth.users. This
-- SECURITY DEFINER function runs as its owner and deletes the *calling* user
-- (auth.uid() — never an arbitrary id), and the on-delete-cascade FKs above then
-- wipe that user's workouts, weigh-ins and settings. Executable only by a signed-
-- in (authenticated) user, on their own account.
--
-- This is a HARD delete, deliberately. The Supabase dashboard's "Remove user" can do a
-- SOFT delete instead (setting auth.users.deleted_at and leaving the row), which fires
-- none of the cascades below — so the account would look gone while every workout,
-- weigh-in and settings row survived. Deleting the row is what makes the erasure real.
-- The FKs also close the stale-JWT window: an access token issued before deletion stays
-- cryptographically valid until it expires, but an INSERT carrying it now violates
-- workouts_user_id_fkey, so it cannot resurrect data under the deleted user's id.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all     on function public.delete_account() from anon, public;
grant  execute on function public.delete_account() to authenticated;

-- ── Retention for the auth provider's sign-in security log ───────────────────
-- `auth.audit_log_entries` records every sign-in, sign-up and password reset with the
-- time, the IP address and the email used. It has NO foreign key to auth.users, so
-- `delete from auth.users` does not touch it — it survives account deletion, which is
-- why legal/TERMS.md § 12.7 has to name it — and GoTrue never expires it, so left alone
-- it grows for ever on a table holding IP + email. legal/PRIVACY.md § 7 states 90 days;
-- this function is what makes that sentence true. (Migration 0005.)
--
-- SECURITY DEFINER because `auth` is not exposed through PostgREST. Execute is granted
-- to service_role ONLY — run from scripts/purge-auth-log.mjs, never from the browser. A
-- user must never be able to erase the log that would evidence an attack on their own
-- account. `dry_run => true` counts without deleting and is what the script always calls
-- first; the DEFAULT is false, so a bare `purge_auth_audit_log(90)` deletes. That is
-- deliberate — a retention function that no-ops when the flag is omitted would leave
-- § 7's 90-day claim true on paper and false in the table — so every caller passes it
-- explicitly.
create or replace function public.purge_auth_audit_log(
  retain_days int     default 90,
  dry_run     boolean default false
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  cutoff    timestamptz;
  affected  bigint;
begin
  if retain_days is null or retain_days < 1 then
    raise exception 'retain_days must be >= 1 (got %)', retain_days;
  end if;

  cutoff := now() - (retain_days * interval '1 day');

  if dry_run then
    select count(*) into affected
    from auth.audit_log_entries
    where created_at < cutoff;
    return affected;
  end if;

  delete from auth.audit_log_entries
  where created_at < cutoff;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all     on function public.purge_auth_audit_log(int, boolean) from anon, authenticated, public;
grant  execute on function public.purge_auth_audit_log(int, boolean) to service_role;
