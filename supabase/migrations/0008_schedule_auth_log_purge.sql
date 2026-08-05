-- 0008 — make the 90-day sign-in-log retention RECUR, in the database.
--
-- 0005 built `public.purge_auth_audit_log()` and stopped there. That closed half the
-- problem: `legal/PRIVACY.md` § 7 tells users the provider's sign-in security log is kept
-- for 90 days, and a function that CAN delete is not a retention practice. The claim is
-- true only if something actually runs, on a schedule, forever.
--
-- Until now the plan was `npm run purge:auth-log -- --purge` from the operator's laptop,
-- on the same cadence as `npm run dormant`. That plan has the exact failure mode this
-- repository refuses everywhere else: it depends on a person remembering, it fails
-- SILENTLY when they do not, and nothing anywhere goes red. `compliance/verified.json`
-- tracks it as an unverified published claim with an `expires` of 2026-10-01 — the date
-- the first entries reach 90 days — precisely because a note beside a green tick is not a
-- control.
--
-- pg_cron moves the recurrence inside the thing it operates on. The job is then visible
-- (`cron.job`), auditable (`cron.job_run_details` records every run, its status and its
-- return value), and survives the laptop, the operator and the calendar.
--
-- WHY NOT keep the script? Keep it — it stays the right tool for a dry run, an ad-hoc
-- purge, and a different `--retain-days`. What it stops being is the thing the published
-- sentence depends on.
--
-- Idempotent: safe to re-run. Unschedules an existing job of the same name first, so
-- re-running cannot leave two jobs deleting the same rows on overlapping schedules.
--
-- NOTE ON PRIVILEGE: a pg_cron job runs as the role that scheduled it. Applied through
-- the SQL editor or the Management API that role is `postgres`, which OWNS
-- purge_auth_audit_log() — so it holds EXECUTE regardless of the `revoke ... from anon,
-- authenticated, public` in 0005, and the SECURITY DEFINER boundary is unchanged. The
-- function's owner was confirmed to hold DELETE on auth.audit_log_entries on 2026-08-05
-- (the check supabase/migrations/README.md § "To apply 0005" describes), so the first
-- destructive run will not fail the way that section warns about.

-- WITH SCHEMA pg_catalog is not decoration. pg_cron is `relocatable = false` and its
-- control file names NO schema (confirmed against this project:
-- `select relocatable, schema from pg_available_extension_versions where name='pg_cron'`
-- returns false/null for every version). For such an extension CREATE EXTENSION binds it
-- to the CURRENT creation schema — and the SQL editor and the Management API query
-- endpoint both run with `search_path = "$user", public`, so a bare `create extension`
-- here lands it in `public`: the one schema PostgREST exposes. Being non-relocatable it
-- then cannot be moved (`alter extension … set schema` is refused); the only correction
-- is drop and recreate, on a database that by then has a live job attached to it.
-- pg_catalog is where Supabase's own dashboard puts it. The scheduled objects still land
-- in the `cron` schema either way — this pins the extension's own namespace, and keeps
-- the project off the `extension_in_public` advisor.
create extension if not exists pg_cron with schema pg_catalog;

-- USAGE on the `cron` schema is not implied by having been able to create the extension,
-- and pg_cron creates that schema itself regardless of where the extension is pinned.
-- Where the platform installed pg_cron rather than this file (it is offered in the
-- dashboard's extension list, so `if not exists` may well find it already there), the role
-- running here can hit `permission denied for schema cron` on the very next statement —
-- and the SQL editor runs a script as one transaction, so that rolls the whole file back
-- with nothing scheduled. Supabase's own documented enablement snippet carries these two
-- grants for exactly that reason.
--
-- Wrapped rather than bare: if this role cannot grant, the grant failing is not the
-- interesting failure and must not be the one that aborts the file. Let it fall through to
-- `cron.schedule` below, which is the honest place to discover a privilege problem.
do $$
begin
  grant usage on schema cron to postgres;
  grant all privileges on all tables in schema cron to postgres;
exception when insufficient_privilege or undefined_object then
  raise notice 'could not grant on schema cron (%) — continuing to cron.schedule', sqlerrm;
end $$;

-- Remove any previous incarnation before scheduling, so this file is re-runnable and can
-- never leave a duplicate job behind. `unschedule` throws if the job does not exist, hence
-- the guard rather than a bare call.
select cron.unschedule('purge-auth-audit-log')
where exists (select 1 from cron.job where jobname = 'purge-auth-audit-log');

-- 03:17 UTC daily. Daily rather than monthly because the window is a ceiling, not a
-- target: a monthly job means a row can outlive its 90 days by up to 29 more, and § 7
-- states 90. The odd minute is ordinary hygiene — nothing else is scheduled here yet, but
-- jobs that all fire exactly on the hour are how a database acquires a thundering herd.
--
-- 90 must match `legal/PRIVACY.md` § 7 and RETAIN_DAYS in scripts/purge-auth-log.mjs.
-- Three places, one number: change it in all three or the document stops describing what
-- happens. dry_run => false: this one is the real thing.
select cron.schedule(
  'purge-auth-audit-log',
  '17 3 * * *',
  $$select public.purge_auth_audit_log(90, false)$$
);
