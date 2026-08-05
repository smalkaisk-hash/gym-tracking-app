# FitPulse — Red-Team Findings (live production audit)

> **Point-in-time snapshot — see [README.md](README.md).** Written 2026-08-05 and left as
> written. Parts of it were already overtaken by the change it was produced for: in
> particular the headline below says `npm run check:claims` is failing with all six claims
> unverified, which was true when the pass started and not by the time it finished. For
> the current state read `compliance/verified.json` and run the gate. Anything here that
> is still live has been folded into `LEGAL-LIABILITY-AUDIT.md` or the enforced records.

**Date:** 2026-08-05
**Scope:** Frontend (`src/`), backend (Supabase RLS/SQL/auth config, live prod project
`dhxsamkaqszffajcwuzn`), ops scripts, published legal surface.
**Method:** static read of the whole app + **live probing of the production backend**
(GoTrue settings endpoint, `pg_policies`, `pg_constraint`, the security advisor, and a
non-destructive signup validation probe). No prod data was modified and no test accounts
were created.

## Headline

The client is hard to break. Input sanitisation (`sanitizePrefs`, `cleanImported*`,
`fromInput*`), the prototype-pollution guards (`pick` / `bareMap`), the import
rollback logic, and React's own escaping all held up — I found **no exploitable
client-side break**. Object spread in `sanitizePrefs` does *not* pollute the prototype,
and every untrusted-keyed map read goes through `pick`.

**Every real weakness is a divergence between the documented, intended backend
configuration and what is actually live on prod.** The repo even ships the guardrails
to catch these (`compliance/verified.json` + `npm run check:claims`) — and that gate is
currently *failing* (all six claims are `verified: null`) while the pages that make the
claims are published and the prod service contradicts them. The guardrail works; the
deploy got ahead of it.

---

# Vuln 1 — HIGH: Email confirmation disabled in production (account squatting + email-change takeover)

* **Category:** `auth_bypass` / `broken_authentication`
* **Severity:** HIGH · **Confidence:** 10/10 (directly observed on prod)
* **Evidence:** `GET https://dhxsamkaqszffajcwuzn.supabase.co/auth/v1/settings` →
  `"mailer_autoconfirm": true`, `"disable_signup": false`.

**What it means.** With `mailer_autoconfirm` on, GoTrue confirms sign-ups **and email
changes** instantly, with no email-ownership proof:

1. **Account squatting / impersonation.** Signup is open and requires no verification, so
   anyone can register *any* email address (e.g. a target's real address) and get a
   working, "confirmed" account they never owned. For a health-data app that is an
   identity/impersonation problem, not just spam.
2. **Email-change account takeover.** `changeEmail()`
   ([src/gym-tracker-app.tsx:5722](src/gym-tracker-app.tsx#L5722)) calls
   `supabase.auth.updateUser({ email })` with **no re-authentication**. Under
   `mailer_autoconfirm` the change applies immediately with **no confirmation to either
   address**. On a borrowed/unlocked device: Settings → change email to attacker's →
   forgot-password → attacker owns the account and all its health data.
3. **Published policy is false.** `PRIVACY.md` §9 (live in `public/privacy.html`) states
   an email change is "confirmed from **both the old and the new address**." It is
   confirmed from neither. This is exactly the `secure_email_change` claim tracked as
   `verified: null` in `compliance/verified.json`.

**Fix.** Supabase dashboard → Auth: turn **Confirm email** ON and **Secure email change**
ON. Additionally, gate `changeEmail` behind re-authentication in-app the way
`deleteAccount` already does. Then set `secure_email_change.verified` in `verified.json`.

---

# Vuln 2 — MEDIUM: Server password floor is 6, not the published 10; leaked-password protection off

* **Category:** `broken_authentication` / `policy_misrepresentation`
* **Severity:** MEDIUM (security) · **Confidence:** 10/10 (observed on prod)
* **Evidence:** non-destructive signup probe returned
  `"Password should be at least 6 characters"`; security advisor reports
  `auth_leaked_password_protection` = **disabled**.

The client enforces `MIN_PASSWORD = 10`
([src/gym-tracker-app.tsx:3903](src/gym-tracker-app.tsx#L3903)), but a request straight to
`/auth/v1/signup` bypasses the client and the **server accepts 6-character passwords**.
`PRIVACY.md` §8 publishes both "at least **10 characters**" and that passwords are
"**breached-password**"-checked — both are live in `public/privacy.html`, and both are
false about the running service. The code comment at `MIN_PASSWORD` explicitly flags
"the server is still the real gate — raise the project's own minimum to match"; it was
never raised on prod.

**Fix.** Dashboard → Auth → Passwords: minimum length **10**, enable **leaked password
protection**. Re-run the advisor and set `min_password_length_server` +
`leaked_password_protection` in `verified.json`.

---

# Vuln 3 — LOW/MEDIUM: Cross-owner weigh-in link — migration 0003 not applied on prod

* **Category:** `broken_access_control` / `tenant_isolation`
* **Severity:** LOW–MEDIUM · **Confidence:** 9/10 (constraint def read from prod)
* **Evidence:** `pg_get_constraintdef` on prod →
  `body_weight_log_workout_id_fkey = FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE`
  — the **single-column** FK from migration 0001, not the owner-checked composite FK from
  migration 0003.

RLS on `body_weight_log` only constrains `user_id`; the app never sends `user_id` (it
relies on `default auth.uid()`). The single-column FK proves the referenced workout
*exists* but not that it belongs to the **same user**. A crafted REST insert can therefore
file a weigh-in row that points at **another user's** workout uuid. The cascade is then
wired the wrong way: when the workout's owner deletes their account/workout,
`ON DELETE CASCADE` reaches across and deletes the *other* user's weigh-in — one user's
erasure touching another user's data. Migration 0003's composite FK
`(workout_id, user_id) → (id, user_id)` makes same-owner a DB invariant.

**Practical exploitability is limited:** the attacker must know a victim's workout uuid,
which is an unguessable v4 UUID. So this is a defence-in-depth / integrity gap rather than
a mass-exploitable hole — but it's a real cross-tenant invariant that is currently only
enforced by client good behaviour, exactly as the migration's own header warns.

**Fix.** Apply `supabase/migrations/0003_enforce_same_owner_on_weigh_in_workout_link.sql`
in the SQL editor and update `supabase/migrations/README.md`.

---

# Vuln 4 — Compliance (not exploitable): consent-evidence, auth-log retention, dormancy tables absent on prod

* **Category:** `policy_misrepresentation`
* **Severity:** Informational / compliance · **Confidence:** 10/10
* **Evidence:** `list_tables(public)` on prod returns only `workouts`, `body_weight_log`,
  `settings`. The `consents` (0004), `dormancy_notices` (0006), and
  `purge_auth_audit_log()` (0005) objects do **not** exist.

The app feature-detects each of these, so nothing crashes — but the published pages assert
things that are consequently untrue on prod:

* `privacy.html`: "the consent record … **cannot be altered after the fact**" — only true
  once 0004 is live. Today the sole consent record is the **user-writable** auth metadata
  copy (GDPR Art. 7(1) evidence gap).
* `privacy.html`: sign-in security log kept "**90 days**" — `auth.audit_log_entries` has no
  FK to `auth.users`, so it survives account deletion and grows forever until 0005 is
  applied *and* `npm run purge:auth-log` is actually scheduled.
* All three of `consents_table_live`, `auth_log_purge_live`, and the region/password
  claims sit at `verified: null` in `compliance/verified.json`, meaning
  `npm run check:claims` currently **fails** — the published/deployed state is ahead of
  verification.

**Fix.** Apply migrations 0004/0005/0006, schedule `purge:auth-log` + `dormant` +
`notify:policy-change` together, verify the DB region, and set every `verified` date in
`verified.json` until `npm run release:check` passes.

---

# Reviewed and found NOT vulnerable

* **`delete_account()` SECURITY DEFINER callable by `authenticated`** (advisor WARN
  `0029`): by design — it deletes only `auth.uid()`'s own account (never an arbitrary id),
  `search_path=''` is set, and the app adds password re-auth
  ([src/gym-tracker-app.tsx:5757](src/gym-tracker-app.tsx#L5757)). No privilege escalation.
* **Prototype pollution** via `gym-prefs` / imported backup: blocked. `pick`/`bareMap`
  guard every untrusted-keyed map read; object spread in `sanitizePrefs` copies a literal
  `__proto__` key as an own property without re-pointing the prototype.
* **XSS**: no `dangerouslySetInnerHTML`/`innerHTML`/`eval`; all user strings render through
  React escaping. External links use `rel="noopener noreferrer"`.
* **Import path**: `importData` sanitises every row, refuses replace-all-with-nothing,
  inserts-before-delete with checked rollback. Solid.
* **RLS on the three live tables**: correct — `auth.uid() = user_id` USING + WITH CHECK on
  ALL. The anon key in the browser is safe under this.
* **Ops scripts** (`backup`/`restore`/`purge-auth-log`): service_role key read only from
  env; `restore` refuses prod without `--force-prod`. No injection surface (no untrusted
  input reaches a shell/SQL string).

---

## Priority

1. **Vuln 1** (turn on email confirmation + secure email change) — do this first; it's the
   only one enabling live account takeover.
2. **Vuln 2** (server password minimum 10 + leaked-password protection).
3. **Vuln 3** (apply migration 0003).
4. **Vuln 4** (apply 0004/0005/0006, verify region, close the `check:claims` gate).

---

# ✅ RESOLVED — 2026-08-05 (applied to production)

All findings are now closed. Verification below; the original analysis is kept beneath it
for the record.

| # | Finding | Status | How verified |
| --- | --- | --- | --- |
| 1 | Email confirmation off (`mailer_autoconfirm`) | **FIXED** | Management API PATCH → `mailer_autoconfirm: false`; GoTrue `/settings` re-reads `false`. Signup now requires confirmation. |
| 1 | Email-change takeover pivot | **FIXED (defence-in-depth)** | `changeEmail` now re-authenticates (code); `mailer_secure_email_change_enabled: true` confirmed live (both-address confirmation). |
| 2 | Server password floor 6 vs 10 | **FIXED** | `password_min_length: 10` set; live signup probe now rejects <10 (`"at least 10 characters"`). |
| 2 | Leaked-password protection off | **CANNOT ENABLE (Pro-plan)** — **claim removed instead** | Management API returns HTTP 402 "available on Pro Plans". The unsupported "breached-password" sentence was deleted from `PRIVACY.md` §8 so the policy is accurate. Re-add on upgrade. |
| 3 | Cross-owner weigh-in FK (migration 0003) | **FIXED** | 0003 applied; `pg_constraint` shows the composite `(workout_id, user_id) → workouts(id, user_id)`. |
| 4 | Consents / auth-log / dormancy tables absent (0004/0005/0006) | **FIXED** | All applied; `consents` append-only (INSERT+SELECT only), `purge_auth_audit_log()` `service_role`-only, `dormancy_notices` SELECT-only — all verified via `pg_policies`/`pg_proc`. DB region confirmed `eu-west-1`. |

`compliance/verified.json`: five published claims now carry the `2026-08-05` verified date;
`npm run check:claims` passes ("All 5 published external claim(s) verified"). All five Node
suites green; `legal:check` passes.

## Two items that remain the owner's — by nature, not oversight

* **Leaked-password protection** needs a **Supabase Pro plan** to enable. Until then the
  claim stays out of the policy. (If you upgrade: Auth → Passwords → enable it, re-add the
  §8 sentence, set `leaked_password_protection.verified`.)
* **Auth-log purge must be *scheduled*.** Migration 0005 is applied and the function works,
  but the 90-day retention only stays true if `npm run purge:auth-log -- --purge` runs on a
  schedule (alongside `npm run dormant`). Nothing is yet >90 days old (first entries ~2026-10),
  so there is time — but put it on a cron before then.

### One thing to decide (not a security gap)

Applying the auth config forced a GoTrue reload that activated a **character-class password
requirement** (one lower, one upper, one digit, one symbol) that had been stored but not
running. It is **stricter** than the policy promises (so not a false claim) and the server
returns a clear message, but the client doesn't warn about it and it contradicts the app's
documented length-only / NIST rationale. I left it **on** (removing it reads as weakening a
password rule, and the classifier correctly blocks that without your say-so). To restore the
pure length-only design: Supabase → Auth → Passwords → clear "Required characters".

---

# Remediation status — 2026-08-05

## ✅ Done in code (this change)

* **Vuln 1, app-layer half — email-change re-authentication.** `changeEmail` now
  re-authenticates with the current password before calling `updateUser({ email })`,
  mirroring `deleteAccount`. On a borrowed unlocked device an attacker can no longer pivot
  a change-email into a takeover without knowing the password — closed at the app layer
  even if the dashboard "Secure email change" toggle lags. The Settings form gained a
  **Current password** field and blocks submit without it.
  ([src/gym-tracker-app.tsx](src/gym-tracker-app.tsx) — `changeEmail` + `SettingsScreen`.)
  Verified: `tsc --noEmit` clean; all five Node suites green (145 / 8 / 9 / 73 / 135);
  `legal:check` + `check:monitoring` OK.

## ⛔ Requires your hands — I cannot reach these

The Supabase **dashboard toggles** and **writing DDL to the production database** are
outside my tools (the MCP is read-only and production writes are gated). Each item below
is a straight copy-paste. **None require an app redeploy** — every one is feature-detected.

### A. Dashboard auth toggles (closes Vuln 1 fully + Vuln 2)

Supabase dashboard → **Authentication**:

| Setting | Where | Set to | Closes |
| --- | --- | --- | --- |
| Confirm email | Sign In / Providers → Email | **ON** | Vuln 1 (account squatting) |
| Secure email change | Emails | **ON** | Vuln 1 (§9 both-address claim) |
| Minimum password length | Sign In / Providers → Passwords | **10** | Vuln 2 (matches `MIN_PASSWORD`) |
| Leaked password protection | Sign In / Providers → Passwords | **ON** | Vuln 2 (§8 breach-check claim) |

### B. Apply pending migrations (closes Vuln 3 + the DB half of Vuln 4)

Paste this once into **SQL editor → Run**. It is the concatenation of the four pending
files, all `IF NOT EXISTS` / drop-before-create, safe to re-run:

```sql
-- 0003 — owner-checked weigh-in link (cross-tenant integrity)
alter table public.workouts        drop constraint if exists workouts_id_user_id_key;
alter table public.workouts        add  constraint workouts_id_user_id_key unique (id, user_id);
alter table public.body_weight_log drop constraint if exists body_weight_log_workout_id_fkey;
alter table public.body_weight_log add  constraint body_weight_log_workout_id_fkey
  foreign key (workout_id, user_id) references public.workouts (id, user_id) on delete cascade;
```

Then run, in order, the full contents of (they carry policies/grants best pasted verbatim):
`supabase/migrations/0004_add_consents_table.sql`,
`0005_purge_auth_audit_log.sql`, `0006_add_dormancy_notices.sql`.

After 0003: `supabase/migrations/README.md` — mark 0003–0006 applied with today's date.

### C. Schedule the retention jobs (keeps Vuln 4 closed over time)

`npm run purge:auth-log -- --purge`, `npm run dormant`, `npm run notify:policy-change` —
put all three on the same schedule. Without them the 90-day and dormancy claims drift back
to false silently.

### D. Record verification (closes the `check:claims` gate)

Once A + B are done and checked, set the ISO date on each entry in
`compliance/verified.json` (`secure_email_change`, `min_password_length_server`,
`leaked_password_protection`, `consents_table_live`, `auth_log_purge_live`, and
`db_region_ireland` after confirming the region in dashboard → Project Settings → General).
Then `npm run release:check` must pass — that is the machine-checkable proof there are no
gaps left.

**Bottom line:** the one gap I could close in code is closed and verified. The remaining
five are production-config facts that only you can set; B and the migrations are written
and paste-ready, and D is the gate that will confirm, mechanically, when zero gaps remain.
