-- 0006 — evidence that the dormancy warning was actually sent.
--
-- legal/PRIVACY.md § 7 and legal/TERMS.md § 12.9 promise a warning at 24 months of
-- inactivity before an account is deleted at 36. That promise had nothing behind it:
-- scripts/dormant.mjs prints who is due and says, in its own output, "This script does
-- not send email — there is no outbound channel in the project."
--
-- Of every promise in the document set this is the only one whose breach DESTROYS the
-- user's data. Everything else costs somebody a surprise; this costs them three years
-- of training history after they were told they would be warned first.
--
-- The usual fix — build the channel — does not fully apply here, and it is worth being
-- precise about why: a dormant user is BY DEFINITION not opening the app, so an in-app
-- notice cannot reach them. Email is the only channel that can, and it does not exist.
-- So until it does, the honest behaviour is not to delete at all.
--
-- This table makes that structural rather than a matter of discipline. dormant.mjs
-- refuses to delete an account with no qualifying row here, so:
--
--   • with no warning sent, the dormancy rule is INERT — it cannot delete anyone; and
--   • the moment a warning is genuinely sent and recorded, the clock the documents
--     describe starts, and only then can the deletion follow.
--
-- The failure mode is therefore "nothing is deleted", which is the safe direction. The
-- previous failure mode was "deleted with no warning", which is the unsafe one.
--
-- ON DELETE CASCADE is deliberate and load-bearing. A row that outlived the account
-- would be a sixth thing surviving a deletion, and legal/TERMS.md § 12.7 lists exactly
-- five and closes "and nothing else" — so a non-cascading audit trail here would break
-- the clause that was just fixed to be true. The row's job is to gate a deletion; once
-- the deletion has happened its job is done.

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

-- The user may READ the warnings sent to them — they are entitled to know under
-- Art. 15, and a user who is told "we warned you" should be able to check. Nobody
-- signed in may write, alter or remove one: only the operator's service_role key,
-- which bypasses RLS, records a notice. A user who could insert their own row could
-- not gain anything, but a user who could DELETE one could make themselves
-- undeletable, and a controller who could quietly insert one could manufacture the
-- evidence that the deletion was warned. Neither should be possible from a session.
drop policy if exists "read own dormancy notices" on public.dormancy_notices;
create policy "read own dormancy notices" on public.dormancy_notices
  for select to authenticated using (auth.uid() = user_id);

revoke insert, update, delete, truncate on public.dormancy_notices from authenticated, anon;
