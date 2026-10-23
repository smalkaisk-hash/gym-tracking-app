# Backup & restore

FitPulse's data lives in five public Supabase Postgres tables: the three app tables
(`workouts`, `body_weight_log`, `settings`) plus two compliance records (`consents` —
Art. 7(1) consent evidence — and `dormancy_notices` — proof a dormancy warning was
sent); see [schema.sql](schema.sql). All five are backed up, because dropping the
latter two would silently lose records whose whole value is being producible later.
This document is the runbook for backing them up **and rehearsing a restore**, because
a backup you have never restored is not a backup — it's hope.

There are two layers, and you want both:

1. **Supabase's automated backups** (managed, off-site). Nothing to set up beyond
   knowing they exist and how to restore from one.
2. **Your own logical backups** (`npm run backup`), which you control and — the
   important part — can practise restoring on demand.

---

## 1. Supabase automated backups

Supabase already takes backups of the project:

- **Free / Pro:** daily backups, retained per your plan. Dashboard → **Database →
  Backups**. Restoring rolls the whole project back to a snapshot.
- **Point-in-Time Recovery (PITR):** optional add-on for second-level recovery.
  Enable it under Database → Backups if the data matters more than the cost.

These are your disaster floor. But restoring one is a project-wide rollback you'd
only do in an emergency, and you can't easily rehearse it without disrupting prod —
which is exactly why layer 2 exists.

## 2. Your own logical backups

`npm run backup` writes every row of all five tables to a timestamped JSON file
under `backups/` (gitignored — it contains all users' data). It uses the
**service_role** key, which bypasses RLS, so it runs only locally with secrets from
the environment and is never part of the app bundle.

### One-time setup

Get the values from the Supabase dashboard → **Project Settings → API**:

- `SUPABASE_URL` — the project URL (same as `VITE_SUPABASE_URL`).
- `SUPABASE_SERVICE_ROLE_KEY` — the **service_role** secret (NOT the publishable
  key). Treat it like a root password: never commit it, never ship it to the
  browser.

Put them somewhere gitignored — e.g. a `.env.backup` file you `source`, or your
shell profile. (`.env.*` is already gitignored; `.env.example` is the only tracked
one.)

### Take a backup

```bash
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service_role-key> \
  npm run backup
```

Output:

```
  workouts: 128 rows
  body_weight_log: 40 rows
  settings: 1 rows
  consents: 2 rows
  dormancy_notices: 0 rows
Wrote 171 rows to backups/fitpulse-backup-2026-07-24T....json
Wrote auth.users seed (1 user(s)) to backups/fitpulse-backup-2026-07-24T....auth-users.sql
```

Alongside the JSON, `npm run backup` writes a `.auth-users.sql` companion holding a
placeholder `auth.users` row per user the backup references. You only need it when
restoring into a **fresh** project, where the real accounts don't exist yet — see the
restore drill below.

Run it on a schedule you're comfortable with (before every deploy is a good habit,
since import/migration are the app's most destructive paths).

---

## 3. The restore drill — do this at least once

**This is the step everyone skips.** `restore.mjs` is built so you can rehearse a
full restore with zero risk to production: by default it **refuses to write to the
backup's own source project** and expects you to point it at a throwaway scratch
project instead.

> **The restore target must already contain the backed-up users.** Every one of the
> five tables has a **foreign key to `auth.users`** (`user_id ... references auth.users`
> — see [schema.sql](schema.sql)), and the backup file does **not** include `auth.users`
> (it is Supabase-managed; the service_role key bypasses RLS but **not** foreign-key
> constraints). So restoring the source project's rows into a project whose `auth.users`
> is empty fails on the very first table with `violates foreign key constraint
> "workouts_user_id_fkey"`. Pick one of the two drill setups below accordingly; the
> branch is the recommended one because it needs no manual user seeding.

#### Option A — Supabase branch (recommended)

1. Create a **branch** of the real project (Dashboard → Branches). A branch clones
   `auth.users`, so every `user_id` the backup carries already resolves.
2. Grab the branch's `SUPABASE_URL` and `service_role` key. Its host differs from the
   source, so `restore.mjs` treats it as a scratch target (no `--force-prod` needed).

#### Option B — empty scratch project (needs user seeding)

1. Create a second, empty Supabase project (the free tier is fine — call it
   `fitpulse-restore-drill`).
2. Run [schema.sql](schema.sql) in its **SQL Editor** so it has the same five
   tables, RLS, and the `delete_account` function.
3. **Seed the referenced users first**, or the restore fails on the FK. `npm run backup`
   writes a companion `backups/fitpulse-backup-<ISO>.auth-users.sql` next to the JSON —
   open it and run it in the scratch project's **SQL Editor**. It inserts a placeholder
   `auth.users` row (one `on conflict do nothing` statement per distinct `user_id` in the
   backup), which is all the FK needs. These placeholders carry no password and can't log
   in; they exist only so the data restores.
4. Grab its `SUPABASE_URL` and `service_role` key.

### Run the drill

```bash
RESTORE_SUPABASE_URL=https://<scratch-ref>.supabase.co \
RESTORE_SERVICE_ROLE_KEY=<scratch-service_role-key> \
  npm run restore -- backups/fitpulse-backup-<ISO>.json
```

Expected:

```
Restoring backups/fitpulse-backup-<ISO>.json
  into https://<scratch-ref>.supabase.co  (scratch target)

  workouts: 128 rows restored
  body_weight_log: 40 rows restored
  settings: 1 rows restored
  consents: 2 rows restored
  dormancy_notices: 0 rows, skipped

Restore complete. Verify row counts against the backup file above.
```

The restore upserts on the primary key, so it's idempotent — running it twice is
safe. Note it is an **additive merge, not a wipe-and-replace**: it writes the backup's
rows but never deletes rows already in the target that the backup doesn't contain. So
restoring over a database that has drifted since the backup leaves any newer (or
corrupt) rows in place. For a true point-in-time state, restore into a freshly created,
empty target (Option A or B above), not over a populated one.

### Verify (the drill only counts if you check)

In the scratch project's SQL Editor:

```sql
select
  (select count(*) from workouts)         as workouts,
  (select count(*) from body_weight_log)  as body_weight_log,
  (select count(*) from settings)         as settings,
  (select count(*) from consents)         as consents,
  (select count(*) from dormancy_notices) as dormancy_notices;
```

Confirm the counts match the backup's output. Spot-check one workout's `exercises`
JSONB and one `settings.prefs` blob to be sure the nested documents round-tripped.

**Once these match, you have a tested restore.** Re-run the drill after any schema
change.

### A real restore into production

Only when you actually need to overwrite production (e.g. an import wiped data),
point `RESTORE_SUPABASE_URL` at the real project and pass `--force-prod`:

```bash
RESTORE_SUPABASE_URL=https://<prod-ref>.supabase.co \
RESTORE_SERVICE_ROLE_KEY=<prod-service_role-key> \
  npm run restore -- backups/fitpulse-backup-<ISO>.json --force-prod
```

Without `--force-prod` the script hard-stops when the target matches the backup's
source — that guard is deliberate, so a drill can never hit prod by muscle memory.
