-- 0004 — append-only consent record.
--
-- GDPR Art. 7(1) puts the burden of demonstrating consent on the CONTROLLER, and
-- EDPB Guidelines 05/2020 ¶ 105-108 say the controller must be able to show how and
-- when consent was obtained and what information was presented at the time.
--
-- Until now the only record lived in auth.users.raw_user_meta_data, written by the
-- signUp() call. That is the right place to CAPTURE it (it exists before any settings
-- row does, so an abandoned onboarding cannot lose it), but it is writable by the user
-- it belongs to — so it is a record, not evidence. A user could rewrite their own
-- consent timestamp; the controller could not prove what was agreed.
--
-- This table is the evidence half. It is APPEND-ONLY by construction:
--   • RLS is on, and there is an INSERT policy and a SELECT policy — and deliberately
--     NO update and NO delete policy. Under RLS an operation with no policy is denied,
--     so a signed-in user can add rows and read their own, and can never alter or
--     remove one. The UPDATE/DELETE grants are revoked as well (defence in depth: the
--     two mechanisms are independent, and a future `grant all` would otherwise
--     silently re-open it).
--   • user_id defaults to auth.uid() and the INSERT policy re-checks it, so a row
--     cannot be filed against someone else's account.
--
-- It still cascades on account deletion: after erasure there is no processing left to
-- justify, and Art. 17 wins over a record kept for Art. 7(1). The metadata copy stays
-- where it is — the app reads it for display and writes both, so the two are
-- cross-checkable and losing either does not lose the fact.

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

-- INSERT and SELECT only. The absence of an UPDATE/DELETE policy is what makes this
-- table append-only — do not add one.
drop policy if exists "insert own consents" on public.consents;
create policy "insert own consents" on public.consents
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "read own consents" on public.consents;
create policy "read own consents" on public.consents
  for select to authenticated using (auth.uid() = user_id);

revoke update, delete, truncate on public.consents from authenticated, anon;
