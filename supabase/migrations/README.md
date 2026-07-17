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
| `0001_add_workout_id_fk_to_body_weight_log.sql` | ⏳ **not yet applied — run this** |
| `0002_add_delete_account_function.sql` | ⏳ **verify applied** — the in-app "Delete account" button calls `delete_account()`; if the RPC errors with "function does not exist", run this |

### To apply 0001

1. Open the Supabase SQL editor for the project.
2. Paste the contents of `0001_add_workout_id_fk_to_body_weight_log.sql` and run it.
3. Verify the backfill (should show 2 linked, 2 standalone on the current dataset):

   ```sql
   select workout_id is not null as linked, count(*)
   from body_weight_log group by 1;
   ```

It is additive and non-breaking: the app does not yet read or write `workout_id`, so
nothing changes in the UI until the follow-up app wiring lands. Applying it early is
safe and enables the `ON DELETE CASCADE` (a workout delete now also removes its
finish-time weigh-in server-side).

## Fresh environment (staging branch, new project)

Run every file in order, `0000` first.

## Adding a migration

1. Create `NNNN_short_description.sql` with the next number.
2. Put reversible, guarded DDL in it (`if not exists`, `drop … if exists`).
3. Update `schema.sql` at the root to match the new flattened state.
4. Record its prod status in the table above.
