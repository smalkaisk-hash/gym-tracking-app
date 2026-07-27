# Backup & restore

FitPulse's data lives in three Supabase Postgres tables (`workouts`,
`body_weight_log`, `settings` — see [schema.sql](schema.sql)). This document is the
runbook for backing them up **and rehearsing a restore**, because a backup you have
never restored is not a backup — it's hope.

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

`npm run backup` writes every row of the three tables to a timestamped JSON file
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
Wrote 169 rows to backups/fitpulse-backup-2026-07-24T....json
```

Run it on a schedule you're comfortable with (before every deploy is a good habit,
since import/migration are the app's most destructive paths).

---

## 3. The restore drill — do this at least once

**This is the step everyone skips.** `restore.mjs` is built so you can rehearse a
full restore with zero risk to production: by default it **refuses to write to the
backup's own source project** and expects you to point it at a throwaway scratch
project instead.

### Set up a scratch project (once)

1. Create a second, empty Supabase project (the free tier is fine — call it
   `fitpulse-restore-drill`).
2. Run [schema.sql](schema.sql) in its **SQL Editor** so it has the same three
   tables, RLS, and the `delete_account` function.
3. Grab its `SUPABASE_URL` and `service_role` key.

> Note on `user_id`: rows carry the `user_id` from the source project. Restoring
> into a scratch project that has no matching `auth.users` rows still works for a
> **structural** drill (the tables are RLS-scoped but the service_role key bypasses
> RLS, and `user_id` has no FK requirement satisfied by seeding auth). If you want a
> byte-perfect drill including auth, restore into a Supabase **branch** of the real
> project instead, which clones `auth.users`.

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

Restore complete. Verify row counts against the backup file above.
```

The restore upserts on the primary key, so it's idempotent — running it twice is
safe.

### Verify (the drill only counts if you check)

In the scratch project's SQL Editor:

```sql
select
  (select count(*) from workouts)        as workouts,
  (select count(*) from body_weight_log) as body_weight_log,
  (select count(*) from settings)        as settings;
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
