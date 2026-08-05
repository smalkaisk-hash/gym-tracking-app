-- 0007 — make the consent record's timestamps server-controlled.
--
-- 0004 made public.consents append-only, which stops a user REWRITING a consent they
-- already gave. It does not stop them writing a false one in the first place, and the
-- column that was supposed to rebut that was not actually under the server's control:
--
--   • `recorded_at` and `created_at` have `default now()`, and a column default applies
--     only when the client OMITS the column. PostgREST is a generic REST interface over
--     the table — any client holding the anon key and a session can send those columns
--     with any value it likes. The app omits them; nothing REQUIRED it to.
--   • `granted_at` is by design the client's clock (it is when the user ticked the box,
--     on their device), but nothing stopped a value years in the future or decades in
--     the past.
--
-- The INSERT policy checks `auth.uid() = user_id` and nothing else, so the row lands.
-- legal/PRIVACY.md § 3 tells users the consent record "cannot be rewritten after the
-- fact"; appending a fabricated, backdated row is not literally an UPDATE, but it
-- defeats the same purpose, and the timestamp that would have shown it up was forgeable.
--
-- A BEFORE INSERT trigger is the fix rather than column-level grants because it also
-- covers the service_role path (which bypasses RLS entirely) and cannot be undone by a
-- later `grant all`. `recorded_at`/`created_at` become genuinely server-side, and
-- `granted_at` is bounded: no future beyond a small clock-skew allowance, and not before
-- the account could have existed. A user can still assert *when* they ticked the box —
-- that is honest, it is their clock — but the server's own record of when it heard about
-- it is now the server's.
--
-- Idempotent: create or replace + drop/create trigger, so it re-runs safely.

create or replace function public.consents_stamp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  floored timestamptz;
begin
  -- Server clock, always. Whatever the client sent for these is discarded.
  new.recorded_at := now();
  new.created_at  := now();

  if new.granted_at is null then
    new.granted_at := now();
  end if;

  -- One hour of tolerance for a device whose clock runs fast. Beyond that the value is
  -- not a plausible "when I ticked the box" and the row is refused rather than filed as
  -- evidence of something that has not happened yet.
  if new.granted_at > now() + interval '1 hour' then
    raise exception 'consents.granted_at is in the future (%)', new.granted_at;
  end if;

  -- Nor can a consent predate the account it belongs to. Clamping rather than raising:
  -- the honest reading of a too-old client clock is "we do not know exactly when, but it
  -- was no earlier than sign-up", and refusing the row would lose the evidence entirely
  -- — which is the failure direction this whole table exists to avoid.
  -- Guarded assignment: SELECT INTO with no matching row yields NULL, and blindly
  -- assigning that would turn a bad user_id into a not-null violation on granted_at
  -- instead of the foreign-key violation it actually is.
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
