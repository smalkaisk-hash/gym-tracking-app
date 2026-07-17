-- 0002 — self-service account deletion.
--
-- Lets a signed-in user permanently delete their own account from the app
-- (Settings → Account → Delete account). The browser client holds only the anon
-- key, which cannot touch auth.users, so deletion goes through this SECURITY
-- DEFINER function: it runs as its owner and deletes the *calling* user only
-- (auth.uid() — never an arbitrary id). The on-delete-cascade FKs on workouts /
-- body_weight_log / settings then wipe that user's rows automatically.
--
-- Guarded and re-runnable: create-or-replace + explicit grant. Execute is granted
-- to `authenticated` only (an anon request has auth.uid() = null and deletes
-- nothing anyway, but revoking is defence in depth).

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
