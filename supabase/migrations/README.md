# Database migrations

The tracked change history for the FitPulse Postgres schema. `schema.sql` at the repo
root is the flattened canonical result; these files are the ordered steps that produce it.

Files are applied in lexical order (`0000_`, `0001_`, …).

## Applying to production

The MCP connection used during development is **read-only**, so migrations are applied
by hand. Run each un-applied file's SQL in the **Supabase SQL editor** (or via
`supabase db push` if you wire up the CLI), oldest first.

| File | Status on prod (`dhxsamkaqszffajcwuzn`) |
| --- | --- |
| `0000_baseline.sql` | ✅ already applied (this is the original hand-run schema — do **not** re-run) |
| `0001_add_workout_id_fk_to_body_weight_log.sql` | ✅ applied 2026-07-18 (FK `body_weight_log_workout_id_fkey` live, ON DELETE CASCADE; backfill verified 2 linked / 2 standalone) |
| `0002_add_delete_account_function.sql` | ✅ applied — **verified live 2026-08-05**: `public.delete_account()` exists, `SECURITY DEFINER`, owner `postgres`, `search_path = ''`, ACL `authenticated=X, service_role=X` (no `anon`, no `PUBLIC`) |
| `0003_enforce_same_owner_on_weigh_in_workout_link.sql` | ✅ **applied 2026-08-05** (via Management API) — verified: `body_weight_log_workout_id_fkey` is now `FOREIGN KEY (workout_id, user_id) REFERENCES workouts(id, user_id) ON DELETE CASCADE`, so a weigh-in cannot link to another user's workout |
| `0004_add_consents_table.sql` | ✅ **applied 2026-08-05** — verified: `public.consents` exists, RLS on, only `INSERT` + `SELECT` policies (no UPDATE/DELETE → append-only by construction) |
| `0005_purge_auth_audit_log.sql` | ✅ **applied 2026-08-05** — verified: `public.purge_auth_audit_log()` exists, `SECURITY DEFINER`, EXECUTE granted to `service_role` only (not `authenticated`/`anon`); its owner (`postgres`) **holds DELETE on `auth.audit_log_entries`** — checked 2026-08-05, so the first destructive run will not fail the way "To apply 0005" warns. **Still needs scheduling → that is `0008`** (nothing is yet >90d old; first entries reach it ~2026-10) |
| `0006_add_dormancy_notices.sql` | ✅ **applied 2026-08-05** — verified: `public.dormancy_notices` exists, RLS on, `SELECT`-only policy (no session-writable INSERT/UPDATE/DELETE); `scripts/dormant.mjs` now has its gate row and the dormancy rule can operate |
| `0007_server_stamp_consents.sql` | ✅ **applied 2026-10-23** (via Management API) — verified: trigger `consents_stamp_trg` present on `public.consents`, function `consents_stamp()` `SECURITY DEFINER` with `search_path = ''`. Functional proof (rolled back): a client-sent `recorded_at` of 2000 was stored as `now()` (year 2026), and a `granted_at` two days in the future was refused with `consents.granted_at is in the future`. `legal/PRIVACY.md` § 3's immutability now holds against an appended backdated row, not just a rewrite |
| `0008_schedule_auth_log_purge.sql` | ✅ **applied 2026-10-23** (via Management API) — verified: `pg_cron` 1.6.4 installed in **`pg_catalog`** (not `public` → no `extension_in_public` advisor), job `purge-auth-audit-log` registered, `active`, schedule `17 3 * * *`, command `select public.purge_auth_audit_log(90, false)`. Evidence of a working **scheduled** run (not just a registered job): `cron.job_run_details` shows `status = 'succeeded'` at `2026-10-23 18:30:00 UTC` (`auth.audit_log_entries` held 0 rows >90d, so a clean no-op delete). `legal/PRIVACY.md` § 7's 90-day retention is now an ongoing practice |

### To apply 0001

1. Open the Supabase SQL editor for the project.
2. Paste the contents of `0001_add_workout_id_fk_to_body_weight_log.sql` and run it.
3. Verify the backfill (should show 2 linked, 2 standalone on the current dataset):

   ```sql
   select workout_id is not null as linked, count(*)
   from body_weight_log group by 1;
   ```

It is additive and non-breaking. The app is already wired to use `workout_id`: it
feature-detects the column on hydrate, inserting weigh-ins without it (date-string
fallback) while it's absent and linking them via FK once it appears. So applying this
migration needs **no app deploy** — the next hydrate flips the app onto the real FK
and enables the `ON DELETE CASCADE` (a workout delete then also removes its
finish-time weigh-in server-side).

### To apply 0003

Paste the file into the SQL editor and run it. It is additive and needs **no app deploy**:
`bwToRow` in [src/supabase.ts](../../src/supabase.ts) never sends `user_id` (the column
defaults to `auth.uid()`), so every weigh-in the app writes already satisfies the new
constraint. Verify afterwards — both should return 0 rows:

```sql
-- no cross-owner weigh-in links
select b.id from public.body_weight_log b
join public.workouts w on w.id = b.workout_id
where w.user_id <> b.user_id;

-- no public row belongs to a user that no longer exists
select 'workouts' t, count(*) from public.workouts w
  where not exists (select 1 from auth.users u where u.id = w.user_id)
union all select 'body_weight_log', count(*) from public.body_weight_log b
  where not exists (select 1 from auth.users u where u.id = b.user_id)
union all select 'settings', count(*) from public.settings s
  where not exists (select 1 from auth.users u where u.id = s.user_id);
```

### To apply 0004

Paste the file into the SQL editor and run it. It is additive and needs **no app deploy**:
the consent-evidence effect selects from `consents`, and if that errors — which is what an
absent table looks like — it returns without writing, the same feature-detection idea as
`body_weight_log.workout_id`. Once the table exists, the next hydrate backfills the
signed-in user's consent rows from their auth metadata, so accounts created before the
migration are not left without evidence.

**Nothing breaks while this is unapplied, and that is the risk.** The app looks healthy,
but the only consent record in existence is the user-writable metadata copy — exactly the
Art. 7(1) gap the table closes — while `legal/PRIVACY.md` § 3 tells users the record is
"stored so that it cannot be altered after the fact". Tracked in
`compliance/DECISIONS-AND-ASSESSMENTS.md` § 5 with the other pre-launch facts.

Verify afterwards — the first query should show the three `kind` values for any account
that has hydrated since, and the second must **fail** (that failure is the point: the table
is append-only, so a user cannot rewrite their own consent record):

```sql
select kind, version, granted_at from public.consents order by recorded_at desc limit 10;

-- expected: ERROR — no UPDATE policy exists for this table
update public.consents set granted_at = now();
```

### To apply 0005

Paste the file into the SQL editor and run it. It is additive and needs **no app deploy** —
nothing in the browser calls it, and it is granted to `service_role` only. Verify:

```sql
-- exists, SECURITY DEFINER, and NOT callable by a signed-in user
select p.proname, p.prosecdef,
       has_function_privilege('authenticated', p.oid, 'execute') as user_can_call
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'purge_auth_audit_log';
-- expected: prosecdef = true, user_can_call = false

-- how many entries are past the window right now (counts only, deletes nothing)
select public.purge_auth_audit_log(90, true);
```

Then run `npm run purge:auth-log` (dry run) and `-- --purge` to act. **Applying the
migration is not enough**: the 90-day row in `legal/PRIVACY.md` § 7 only becomes true once
the job actually runs on a schedule.

One privilege worth checking before the first real purge, because only the counting path
has ever run: `auth.audit_log_entries` is owned by `supabase_auth_admin`, and SELECT and
DELETE on it are separate grants. If the function's owner lacks DELETE, the first
destructive run fails — around 2026-10, on a schedule nobody may be watching.

```sql
select has_table_privilege(
  (select rolname from pg_roles r
     join pg_proc p on p.proowner = r.oid
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'purge_auth_audit_log'),
  'auth.audit_log_entries', 'delete') as owner_can_delete;
-- expected: true
```

### To apply 0006

Paste the file into the SQL editor and run it. It is additive and needs **no app deploy**
— nothing in the browser writes to it, and the only reader that matters is
`scripts/dormant.mjs`, which hard-stops rather than deleting if the table is absent.

Verify: the table exists with RLS on and no session-writable policy, and the row cascades.

```sql
select relrowsecurity from pg_class where oid = 'public.dormancy_notices'::regclass;
-- expected: true

select cmd from pg_policies where tablename = 'dormancy_notices';
-- expected: exactly one row, SELECT

select confdeltype from pg_constraint
where conrelid = 'public.dormancy_notices'::regclass and contype = 'f';
-- expected: 'c' (CASCADE) — a row outliving the account would be a sixth survivor
-- against TERMS.md § 12.7's closed list of five
```

**Applying it is not enough**, in the same way as `0005`: the table only starts protecting
anyone once warnings are actually sent and recorded. The order is `npm run dormant` →
send the messages → `-- --record-warning` → wait out the 12 months → `-- --delete`.

### To apply 0007

Paste the file into the SQL editor and run it. Additive, no app deploy. Verify that a
client-supplied `recorded_at` is now ignored and a future `granted_at` is refused:

```sql
-- as service_role, against a throwaway user id:
insert into public.consents (user_id, kind, version, granted_at, recorded_at)
values ('<some-user-uuid>', 'terms', 'test', now(), '2000-01-01')
returning recorded_at;
-- expected: recorded_at is NOW, not 2000-01-01

insert into public.consents (user_id, kind, version, granted_at)
values ('<some-user-uuid>', 'terms', 'test', now() + interval '2 days');
-- expected: ERROR — consents.granted_at is in the future
```

(Then delete the test rows — which needs the service_role key, because the table has no
DELETE policy. That is the table working as intended.)

### To apply 0008

Paste the file into the SQL editor and run it. Additive, no app deploy, nothing in the
browser is affected. It installs `pg_cron` (available on this project but **not currently
installed** — confirmed 2026-08-05) and schedules the purge daily.

It installs it **`with schema pg_catalog`**, which is not interchangeable with a bare
`create extension`: `pg_cron` is `relocatable = false` with no schema in its control file,
so it binds to whatever the creation schema is — and the SQL editor's `search_path` is
`"$user", public`, which would land it in the one schema PostgREST exposes, permanently
(a non-relocatable extension cannot be moved afterwards). Confirm after applying:

```sql
select e.extname, n.nspname from pg_extension e
join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pg_cron';
-- expected: pg_cron | pg_catalog   (NOT public)
```

The file grants `usage on schema cron` to `postgres` before it schedules anything. The SQL
editor runs a script as a single transaction, so if the extension turns out to be already
installed by the platform and this role lacks that grant, `cron.unschedule` fails and the
whole file rolls back with nothing scheduled. The grants are wrapped in a `do` block that
swallows a privilege error, so if they cannot be made the failure surfaces at
`cron.schedule` — where it means something — rather than three statements early.

This is the migration that turns `legal/PRIVACY.md` § 7's 90-day sentence from a capability
into a practice, so verify it in two steps rather than one — that the job exists, and that
it actually *fires*:

```sql
-- 1. the job is registered, active, and running as a role that can execute the function
select jobid, jobname, schedule, active, username, command
from cron.job where jobname = 'purge-auth-audit-log';
-- expected: one row, active = true, username = postgres

-- 2. it has actually run. Nothing here proves a schedule until a run is recorded.
select status, return_message, start_time, end_time
from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'purge-auth-audit-log')
order by start_time desc limit 5;
-- expected: status = 'succeeded'. return_message carries the row count deleted (0 is a
-- correct answer today — nothing on this project is 90 days old yet).
```

Step 2 is the one that matters and the one worth waiting for. A job that is registered but
errors every night — a permission it lacks, a function renamed underneath it — looks
identical to a working one in `cron.job`, and reports nothing to anybody. That is the same
silent-failure shape the laptop-cron plan had, just relocated, and `cron.job_run_details`
is the only thing that distinguishes them.

**Do not tick `auth_log_purge_scheduled` in `compliance/verified.json` when you apply this.**
Tick it when step 2 shows a succeeded run. Applying the migration is not the claim; the job
running is. That entry was once marked verified with a note conceding the practice had not
started, which is exactly the failure `check:claims` exists to catch.

To wind it back: `select cron.unschedule('purge-auth-audit-log');`

## Per-user deletion: what is guaranteed

Audited against prod on 2026-08-05, **re-checked after 0004–0006 landed the same day**:
`public` contains five tables and three functions — no views — so the list below is the
whole surface. (The first pass of this table was written before those migrations were
applied and claimed three tables and one function; a completeness claim that is provably
incomplete is worse than no claim, since this is what backs `TERMS.md` § 12.7's closed
list of five survivors.)

| Row | Owner column | Removed by account deletion via |
| --- | --- | --- |
| `workouts` | `user_id` NOT NULL, default `auth.uid()` | `workouts_user_id_fkey` → `auth.users` ON DELETE CASCADE |
| `body_weight_log` | `user_id` NOT NULL, default `auth.uid()` | `body_weight_log_user_id_fkey` → `auth.users` ON DELETE CASCADE (and again via the workout link) |
| `settings` | `user_id` PRIMARY KEY, default `auth.uid()` | `settings_user_id_fkey` → `auth.users` ON DELETE CASCADE |
| `consents` (0004) | `user_id` NOT NULL, default `auth.uid()` | `consents_user_id_fkey` → `auth.users` ON DELETE CASCADE. Deliberate: after erasure there is no processing left to justify, and Art. 17 wins over a record kept for Art. 7(1) |
| `dormancy_notices` (0006) | `user_id` NOT NULL | `dormancy_notices_user_id_fkey` → `auth.users` ON DELETE CASCADE. Also deliberate — see § 12.7 below |
| consent record (`terms_accepted_at`, `health_data_consent_at`, …) | `auth.users.raw_user_meta_data` | deleted with the `auth.users` row itself |
| sessions, refresh tokens, identities, one-time tokens | `auth.*` | GoTrue's own ON DELETE CASCADE FKs to `auth.users` |

The three functions in `public` — `delete_account()` (0002), `purge_auth_audit_log()`
(0005) and `consents_stamp()` (0007) — hold no per-user rows themselves.

All six `public` FKs are `convalidated = true`, so those cascades are proven against
existing rows, not merely declared for new ones. Every `user_id` is NOT NULL, so no row
can exist unowned. `delete_account()` issues a **hard** `delete from auth.users` — not
the soft delete (`deleted_at`) the Supabase dashboard's "Remove user" can perform, which
would leave the row and every cascade unfired.

Two things this does **not** cover, both outside the schema:

- `auth.audit_log_entries` has no FK to `auth.users` and holds the actor's id, email and
  IP. It survives account deletion by design (it is Supabase's audit trail). Currently 0
  rows on this project. **It now has a retention policy, and it is disclosed.** `0005`
  adds `public.purge_auth_audit_log()`, `npm run purge:auth-log` calls it, and the
  **90 days** it enforces is stated in `legal/PRIVACY.md` § 7, listed among the survivors
  of a deletion in `legal/TERMS.md` § 12.7, and repeated in `legal/DELETE-ACCOUNT.md`.
  Those four move together: change the number in one and change it in all of them.
  Note the failure mode is *silence* — nothing fails if the job is never run, and the
  policy simply becomes untrue, so put it on the same schedule as `npm run dormant`.
- Backups. Erasure is complete in the **live database**. `legal/PRIVACY.md` §7 and
  `legal/DELETE-ACCOUNT.md` both state plainly that no server backup exists — no
  automated platform backups on the current plan, and `npm run backup` is never run
  against prod. Those are published promises: if the plan ever gains automated backups
  or PITR, or someone runs `npm run backup` against the live database, both documents
  become false and must be updated in the same change.
- **Rendered notices on the operator's machine.** `npm run dormant` and
  `npm run notify:policy-change` write files into `notices/` containing real email
  addresses. Nothing cascades into a text file, so a notice rendered before an account was
  deleted still names that person afterwards — a sixth survivor against § 12.7's closed
  list. `notices/` is gitignored, but that only stops it being *published*; the fix is to
  delete the file once the messages have gone out, which both scripts now print as the
  last line of their output.

## Fresh environment (staging branch, new project)

Run every file in order, `0000` first.

## Adding a migration

1. Create `NNNN_short_description.sql` with the next number.
2. Put reversible, guarded DDL in it (`if not exists`, `drop … if exists`).
3. Update `schema.sql` at the root to match the new flattened state.
4. Record its prod status in the table above.
