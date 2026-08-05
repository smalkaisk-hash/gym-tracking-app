# Record of processing activities (GDPR Art. 30)

**Controller record · version 1.0 · 5 August 2026.**

This is the document Art. 30(1) requires the controller to maintain and Art. 30(4) requires
it to make available to the supervisory authority on request. It is written to be handed
over as-is.

**Why this record is mandatory here.** Art. 30(5) exempts organisations employing fewer
than 250 persons, but the exemption falls away if *any* of three conditions is met. Two
are met: the processing includes special categories of data under Art. 9(1) (data
concerning health), and it is not occasional (it is continuous, for every user, for the
life of the account). The under-250 exemption therefore does **not** apply, and this record
is required regardless of the size of the operation.

---

## 1. Controller

| Field | Value |
| --- | --- |
| Controller | Karlis Smalkais (natural person, sole operator) |
| Address | Klusa Street 2a, Riga, LV-1007, Latvia |
| Contact | smalkaisk@gmail.com |
| Data protection officer | **None appointed.** Not required under Art. 37(1): not a public authority; core activity is not regular and systematic monitoring on a large scale; core activity is not large-scale processing of Art. 9 data (see the scale assessment in [DECISIONS-AND-ASSESSMENTS.md](DECISIONS-AND-ASSESSMENTS.md) § 2) |
| Art. 27 EU representative | **Not required** — the controller is established in Latvia, inside the EEA |
| UK GDPR Art. 27 representative | **Not appointed.** Decision and reasoning recorded in [DECISIONS-AND-ASSESSMENTS.md](DECISIONS-AND-ASSESSMENTS.md) § 3 |
| Lead supervisory authority | Datu valsts inspekcija (Data State Inspectorate), Latvia — https://www.dvi.gov.lv |
| Joint controllers | None |

## 2. Processing activities

Six activities. Each row is one purpose with its own legal basis; there is no catch-all
entry, and no activity is carried out that is not listed here.

### P1 — Account creation and authentication

| Field | Value |
| --- | --- |
| Purpose | Create the user's account, authenticate sign-in, keep the session alive, allow password reset and password change |
| Categories of data subject | Registered users (adults, 18+ — see `legal/TERMS.md` § 4.1) |
| Categories of personal data | Email address, salted password hash, account UUID, session/refresh tokens, account creation and sign-in timestamps |
| Legal basis | Art. 6(1)(b) — performance of the contract entered into at sign-up |
| Special category data | None |
| Recipients | Supabase, Inc. (processor) |
| Third-country transfer | No — Ireland (`eu-west-1`) |
| Retention | Until the user deletes the account, or the dormancy rule in `legal/PRIVACY.md` § 7 triggers |
| Erasure route | `public.delete_account()` → hard `delete from auth.users` → FK cascade |

### P2 — Storing and displaying training and body-weight data (health data)

| Field | Value |
| --- | --- |
| Purpose | Store, sync and display the workouts and weigh-ins the user logs, and compute the statistics shown back to that same user (history, charts, muscle-group breakdown, streaks, weekly goal) |
| Categories of data subject | Registered users |
| Categories of personal data | Workout records (type, date, duration, notes, exercises, sets, reps, weights), body-weight entries with dates, display name, gender (optional), display and unit preferences, weekly goal |
| **Special category data** | **Yes — data concerning health (Art. 9(1)):** body weight over time, training history, and gender collected alongside them |
| Legal basis | Art. 6(1)(b) — performance of the contract; **and** Art. 9(2)(a) — explicit consent, obtained by a separate, never-pre-ticked checkbox at sign-up |
| Necessity note | The processing is the service itself, not an add-on. See [DECISIONS-AND-ASSESSMENTS.md](DECISIONS-AND-ASSESSMENTS.md) § 1 for the Art. 7(4) analysis |
| Recipients | Supabase, Inc. (processor) |
| Third-country transfer | No — Ireland (`eu-west-1`) |
| Retention | As P1 |
| Automated decision-making / profiling | None within the meaning of Art. 22. Statistics are computed and displayed to the user about their own data; no decision is produced, no evaluation is used for any purpose of the controller, and nothing is inferred about the user |

### P3 — Transactional email

| Field | Value |
| --- | --- |
| Purpose | Send password-reset and account-confirmation email |
| Categories of data subject | Registered users |
| Categories of personal data | Email address, message content (a link; no health data) |
| Legal basis | Art. 6(1)(b) |
| Special category data | None |
| Recipients | Supabase, Inc. (built-in email service) |
| Third-country transfer | **Yes — treated as a transfer to the United States.** The provider does not publish the region of its shared email infrastructure and is a US-incorporated company. Safeguard: Standard Contractual Clauses within the provider's DPA (Art. 46(2)(c)) |
| Retention | Delivery records held by the provider; see `legal/PRIVACY.md` § 7 |

### P4 — Service security and fault diagnosis

| Field | Value |
| --- | --- |
| Purpose | Keep the service available and secure; diagnose faults |
| Categories of data subject | Anyone who makes a request to the service |
| Categories of personal data | Server/API request logs including IP address, timestamp, request made |
| Legal basis | Art. 6(1)(f) — legitimate interest in a working, secure service. Balancing: the data is technical, retained briefly, never combined with training data, never used to build a profile, and no less intrusive alternative exists for operating a networked service |
| Special category data | None |
| Recipients | Supabase, Inc.; the static host (**not yet chosen — see § 5**) |
| Third-country transfer | Database logs: no (Ireland). Static host: **to be determined on selection** |
| Retention | Database/API request logs: 1 day (provider default on this plan). Static host: to be determined |

### P5 — Handling data subject requests and privacy correspondence

| Field | Value |
| --- | --- |
| Purpose | Receive, verify and answer requests under Arts. 15–22 and equivalent US state rights |
| Categories of data subject | Registered users, and any person who writes to the contact address |
| Categories of personal data | Email address, the content of the correspondence, and whatever the sender chooses to include — which may include health data |
| Legal basis | Art. 6(1)(c) — compliance with a legal obligation (Chapter III). Where the correspondence contains health data, Art. 9(2)(f) — establishment, exercise or defence of legal claims — and in practice the data subject's own Art. 9(2)(a) act of sending it |
| Recipients | Google LLC (Gmail, processor for the contact mailbox) |
| Third-country transfer | **Yes — United States.** Safeguard: Google's Data Processing Terms incorporating SCCs |
| Retention | **24 months from the last message in the thread**, which is the figure published in `legal/PRIVACY.md` § 7. (This row previously said "the limitation period applicable to a complaint" — a different criterion for the same data, and the published number is the one we are held to.) |
| Procedure | [DSR-PROCEDURE.md](DSR-PROCEDURE.md) |

### P6 — Consent and Terms-acceptance record keeping

| Field | Value |
| --- | --- |
| Purpose | Discharge the Art. 7(1) obligation to demonstrate that the user consented, and the `legal/TERMS.md` § 3.2 promise to keep a record of which version was accepted |
| Categories of data subject | Registered users |
| Categories of personal data | Account UUID, consent timestamps, policy/Terms version identifiers, age-confirmation timestamp |
| Legal basis | Art. 6(1)(c) — legal obligation under Art. 7(1) |
| Special category data | None (the record is *about* a consent to health-data processing; it contains no health data) |
| Recipients | Supabase, Inc. |
| Third-country transfer | No — Ireland |
| Retention | For as long as the processing based on the consent continues, and afterwards only as long as needed to defend a claim (EDPB Guidelines 05/2020 ¶ 108) |
| Storage | `auth.users.raw_user_meta_data` **and** the append-only `public.consents` table added by migration `0004` |

### P7 — Sign-in security logging

Recorded separately from P4 because it is a different dataset, held by a different
component, for a different period, and — unlike every other row in this record — it
**survives deletion of the account**, which is why `legal/TERMS.md` § 12.7 has to name it.

| Field | Value |
| --- | --- |
| Purpose | Detect and investigate credential stuffing, brute-force attempts and other abuse of the authentication endpoints |
| Categories of data subject | Anyone who signs in, signs up or requests a password reset — including someone attempting to do so against an account that is not theirs |
| Categories of personal data | Timestamp, **IP address**, the email address used, and the event type. Held in `auth.audit_log_entries` |
| Legal basis | Art. 6(1)(f) — legitimate interest in the security of the service and of users' accounts. Balancing: the data is narrow and technical, it is the minimum that can evidence an attack on someone's account, it is never combined with training data or used to profile anyone, and no less intrusive alternative can distinguish an attack from ordinary use |
| Special category data | None |
| Recipients | Supabase, Inc. (processor) |
| Third-country transfer | No — Ireland (`eu-west-1`) |
| Retention | **90 days**, as published in `legal/PRIVACY.md` § 7. The table has no foreign key to `auth.users`, so nothing expires it automatically: `public.purge_auth_audit_log()` (migration `0005`) enforces the period and `npm run purge:auth-log -- --purge` invokes it. **The retention is only real while that job is actually run** — see `verified.json` → `auth_log_purge_scheduled`, which is deliberately unverified until it is on a schedule |
| Erasure route | Not erased by account deletion, by design and as disclosed. Aged out by the purge above |

### P8 — Dormant-account review, warning and deletion

| Field | Value |
| --- | --- |
| Purpose | Give effect to the storage-limitation rule in `legal/PRIVACY.md` § 7: identify accounts inactive for 24 months, warn their owners, and delete after 36 — and hold the evidence that the warning promised by § 7 and `legal/TERMS.md` § 12.9 was actually given |
| Categories of data subject | Registered users whose account has been inactive for 24 months or more |
| Categories of personal data | Account UUID, email address, the derived date of last activity, and — in `public.dormancy_notices` — the date a warning was sent, the channel, and the deletion date the warning stated |
| Legal basis | Art. 6(1)(c) — compliance with the storage-limitation obligation in Art. 5(1)(e). The notice record is additionally Art. 6(1)(f): being able to show the warning was given before data was destroyed |
| Special category data | None held by this purpose itself, though the deletion it leads to destroys P2 data |
| Recipients | Supabase, Inc. (the tables); Google LLC (Gmail, when the warning is sent from the contact mailbox) |
| Third-country transfer | Database: no (Ireland). Warning email: **yes — United States**, safeguard as P5 |
| Retention | `dormancy_notices` rows cascade on account deletion (migration `0006`) — deliberately, so nothing outlives the account against § 12.7's closed list of five survivors. The rendered message files under `notices/` are deleted by the operator once sent |
| Process note | `scripts/dormant.mjs`. Deletion is **interlocked**: it refuses to delete an account with no recorded notice aged the full 12-month gap and sent after the account's last sign of life, so with nothing recorded the rule is inert and deletes nobody. Sending is manual — automating it would introduce a new processor, a new Art. 28 agreement and a § 6 disclosure |

## 3. Categories of recipients (consolidated)

| Recipient | Role | Country of processing | Art. 28 contract | Transfer safeguard |
| --- | --- | --- | --- | --- |
| Supabase, Inc. | Database, auth, API hosting | Ireland (`eu-west-1`) | DPA — **copy to be obtained, see § 5** | Not required |
| Supabase, Inc. (email) | Transactional email | Not published; treat as US | Same DPA | SCCs |
| Google LLC | Contact mailbox (Gmail) | United States | Google Data Processing Terms | SCCs |
| Static host | Serves the app's files | **Not yet chosen** | — | — |

No recipient receives data for its own purposes. Nothing is sold or shared for
cross-context behavioural advertising. There are no joint controllers and no sub-processor
appointed by the controller directly.

## 4. Technical and organisational security measures (Art. 30(1)(g), summary of Art. 32)

- TLS/HTTPS for all traffic between client and server.
- **Row-level security on every table**, enforced in the database rather than in
  application code, scoping every read and write to `auth.uid()`. Verified live on all
  three tables on 5 August 2026.
- Passwords stored only as salted hashes by the auth provider; changing a password
  requires the current password.
- Minimum password length of 10, enforced at the auth provider (the server-side setting,
  not only in the client — a request made straight to the auth API bypasses the client).
  Verified 5 August 2026; recorded in `verified.json` as `min_password_length_server`.
- **Leaked-password protection (HaveIBeenPwned): NOT enabled — not available on the
  current plan.** It is a Supabase Pro feature and this project is on the free plan (the
  Management API returns HTTP 402). Recorded here as absent rather than omitted: an
  earlier draft of this record listed it as enabled while `verified.json` documented, on
  the same day, that it could not be. This document is written to be handed to a
  supervisory authority as it stands, so an overstated Art. 32 measure here is a false
  statement made *to the regulator*, which is worse than the same sentence in a policy.
  The corresponding claim was removed from `legal/PRIVACY.md` § 8 for the same reason.
- Encryption at rest by the database provider.
- The browser bundle ships only the provider's publishable key; the RLS-bypassing
  `service_role` key is never in the app, never in the published files, and is used only
  by offline scripts on the operator's own machine.
- Production data access limited to one person — the sole operator. No employees or
  contractors exist.
- `delete_account()` is `SECURITY DEFINER` with `search_path = ''` and deletes only
  `auth.uid()`; `EXECUTE` is revoked from `anon` and `PUBLIC`.

## 5. Known gaps in this record

Listed here rather than left blank, because an incomplete record that says so is more
useful to a supervisory authority than one that reads as complete.

1. **Static host not chosen — because the app is not deployed, by decision (5 August 2026).**
   P4's recipient, country, transfer mechanism and log retention cannot be completed until
   one exists, and `npm run legal:release` gates publication on the same four facts. This is
   a deliberate deferral recorded in [DECISIONS-AND-ASSESSMENTS.md](DECISIONS-AND-ASSESSMENTS.md)
   § 7, which lists what must be reconciled together before any deployment — not an
   oversight. There is currently no deployment and production holds no rows, so no data
   subject is affected by the gap.
2. **Processor DPAs not yet held on file.** The Supabase DPA (and its SCCs) and Google's
   Data Processing Terms must be downloaded and stored; `legal/PRIVACY.md` § 6 and § 10
   already state that every processor operates under a written Art. 28 agreement and that
   a copy of the SCCs will be sent on request.
3. ~~**Database region asserted, not evidenced.**~~ **Closed 5 August 2026.** `eu-west-1`
   /Ireland was confirmed in the provider's dashboard (Project Settings → General → Region)
   and recorded in [verified.json](verified.json) as `db_region_ireland`, which now carries
   a six-monthly re-check deadline that `npm run check:claims` enforces — a project
   migration or a provider region change would not announce itself, and the whole
   Art. 44–49 position rests on this one fact.
4. **The 90-day sign-in-log retention (P7) is not yet on a schedule.** The mechanism exists
   and is verified (migration `0005`, `public.purge_auth_audit_log()`); the recurring job
   that makes the published period true is not set up. Nothing is yet 90 days old, so the
   period is not yet violable — but it becomes so around October 2026. Tracked as
   `auth_log_purge_scheduled` in [verified.json](verified.json), deliberately **unverified**
   with that deadline, so `npm run check:claims` fails rather than the deadline living in a
   note beside a green tick.

## 6. Review

Reviewed on material change and at least every 12 months, alongside the
`legal/PRIVACY.md` § 12 review cycle. Next review due: **5 August 2027**.
