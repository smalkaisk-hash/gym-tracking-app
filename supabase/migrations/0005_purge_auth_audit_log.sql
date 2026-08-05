-- 0005 — retention for the authentication provider's sign-in security log.
--
-- `auth.audit_log_entries` records every sign-in, sign-up and password reset with the
-- time, the IP address and the email address used. Two properties make it the sharpest
-- retention problem in this schema:
--
--   1. It has NO foreign key to auth.users, so `delete from auth.users` does not touch
--      it. It survives account deletion — which four published documents used to say
--      nothing about, and one (TERMS.md § 12.7) actively contradicted by closing its
--      list of survivors with "and nothing else".
--   2. GoTrue never expires it. Left alone it grows forever, which is a straight
--      Art. 5(1)(e) storage-limitation failure on a table holding IP + email.
--
-- legal/PRIVACY.md § 7 now states 90 days. This function is what makes that sentence
-- true rather than aspirational — the same relationship scripts/dormant.mjs has to the
-- dormancy row directly above it in that table.
--
-- SECURITY DEFINER because the `auth` schema is not exposed through PostgREST and is
-- not writable by `authenticated`. Execute is granted to `service_role` ONLY: this runs
-- from the operator's machine (scripts/purge-auth-log.mjs), never from the browser.
-- `authenticated` and `anon` are revoked explicitly — a user must never be able to
-- erase the security log that would evidence an attack on their own account.
--
-- Returns the number of rows affected. `dry_run => true` counts without deleting, so a
-- caller can report the same number it is about to remove: scripts/purge-auth-log.mjs
-- always counts first and only passes `false` when invoked with `-- --purge`.
--
-- The DEFAULT is `false` — i.e. `select public.purge_auth_audit_log(90);` DELETES, and
-- irreversibly. That is deliberate rather than an oversight: a retention function that
-- no-ops when the flag is omitted fails silently, and legal/PRIVACY.md § 7 would go on
-- claiming 90 days while nothing was ever removed. Every caller therefore passes the
-- flag explicitly (0008 schedules `purge_auth_audit_log(90, false)`, and the README's
-- verification query passes `true`) — do the same, and never call it bare.

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
  -- Refuse a nonsensical window rather than silently truncating the whole log.
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
