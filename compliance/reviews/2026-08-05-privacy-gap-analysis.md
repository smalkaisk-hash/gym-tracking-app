# Privacy documentation — gap analysis

Source of the questions: `2026-08-05-external-privacy-critique.md` in this directory (50-point critique).
Checked against: `legal/PRIVACY.md`, `legal/CONSUMER-HEALTH-DATA-PRIVACY.md`,
`legal/DELETE-ACCOUNT.md`, and the shipping code in `src/`.

Date of check: 2026-08-05. Every "confirmed" item below was verified against the
source or by running the relevant script, not inferred from the documents alone.

---

## Status — 2026-08-05

**Fixed:** A1, A2, A3, A4, A5, A6 (all six code/document contradictions) and B4 (the
build guard). Each fix carries a guard in `tests/qa/fuzz.test.mjs`, and each guard was
checked to fail against the pre-fix state rather than merely to pass now. Build and all
five suites green (126 / 8 / 9 / 66 / 124 — the six new guards are the growth in the
fuzz count; unit-logic's is unrelated work landing alongside).

**Open, in the order recommended at the bottom of this file:** D1 (repo visibility —
still the largest single exposure and still unverified), then B1, B2, B3, B5, B6, B7,
B8, B10. B9 stays blocked on choosing a static host.

Items below keep their original wording so the reasoning stays readable; fixed ones are
marked and describe what was actually changed.

---

## A. Statements the code contradicts — fix these first

These are the FTC Act §5 class of problem: the inaccuracy *is* the violation. Each
one is checkable, so each one should end in a test, not just an edit.

### A1. "Signing out clears every key in the table above" — false · **FIXED**

`PRIVACY.md` §5 lists nine storage keys and then says signing out clears **every**
one of them. `clearLocalCache()` (`src/gym-tracker-app.tsx:4258`) removes six:

```
STORAGE_KEY, BW_LOG_KEY, GOAL_KEY, PREFS_KEY, ACTIVE_KEY, CACHE_OWNER_KEY
```

It does **not** remove `gym-theme` or `gym-theme-vars`, both of which the policy's
own table lists. (The `ErrorBoundary.recover()` path at line 6026 does remove them —
so the app already knows the difference.) `sb-…-auth-token` is cleared by
`supabase.auth.signOut()`, so that one is fine.

The residue is only a theme preference, not health data — but §5 offers sign-out as
*the* control for a shared or borrowed computer, and a false completeness claim about
device storage is exactly the kind of statement a regulator reads literally.

**Fix:** either add the two theme keys to `clearLocalCache()`, or reword §5 to say
sign-out clears everything except your theme choice. Then add a guard to
`tests/qa/fuzz.test.mjs` asserting the policy's key list and the code's key list agree.

### A2. Undisclosed device storage — `sessionStorage` · **FIXED**

§5 opens "FitPulse keeps a copy of your data in your browser's `localStorage`… The
keys are:" and presents the table as exhaustive. The app also writes
`gym-recovery` to **sessionStorage** (`src/gym-tracker-app.tsx:4297`). Undisclosed
storage class, undisclosed key. This is critique #6 with a concrete instance behind it.

### A3. "That is everything we hold about you" — contradicted by §2.2 · **FIXED**

§9's access row describes the JSON export and closes: *"That is everything we hold
about you."* The export payload (`exportData`, line 5091) contains email, createdAt,
the consent/terms record, workouts, weigh-ins, goal and prefs. §2.2 of the same
document separately discloses that we also hold:

- server request logs including **IP address**, timestamp and request;
- account **sign-in timestamps**.

Neither is in the export. The policy contradicts itself in two places roughly 800
words apart. This is critique #8 and #27, and it is a real internal inconsistency
rather than a hypothetical.

**Fix:** "That is everything the app stores about you. Infrastructure logs (§2.2)
are held by our providers on the retention in §7 and are not part of the export;
email us if you want a copy of what those contain."

### A4. "Only you can read your rows" — contradicted by §8 · **FIXED**

The short version states it absolutely. §8 of the *same document* then says access to
production data is restricted to "one person — the sole operator of the service —
through the database provider's administrative console." Both cannot be true. Add to
that Supabase's own infrastructure staff, whose access is not mentioned anywhere.
(Critique #11, #12.)

**Fix:** "Only you can read your rows through the app — a database-level rule enforces
it. The operator can reach the database directly through the provider's admin console,
and our provider's staff can access infrastructure under their own contractual
controls; §8 says what that means in practice."

### A5. Gmail is an undisclosed processor — and MHMDA makes this the sharp one · **FIXED**

Every privacy, MHMDA, appeal and deletion route in all three documents terminates at
**smalkaisk@gmail.com**. Google therefore processes any consumer health data a user
puts in such an email. Google appears in neither `PRIVACY.md` §6 nor
`CONSUMER-HEALTH-DATA-PRIVACY.md` §3.

CHD §3 is the more serious of the two: RCW 19.373.020 requires an exhaustive list of
categories of third parties, and the section currently answers **"None."** A
Washington resident exercising a §7 right sends their health data through a processor
the statutory disclosure does not name. (Critique #42, #43.)

**Fix:** add Google LLC (Gmail) to both tables — role "receives privacy requests and
correspondence sent to our contact address", data "whatever you include in your
email", country US/SCCs — and give §7 a retention row for correspondence.

### A6. §2.2 says crash reports are collected; §2.3 says none are · **FIXED**

The §2.2 "Data generated automatically" table has a row *"Crash and error reports |
The app, when something fails | See §2.3"*, and §2.3 then says none are ever sent.
A reader scanning the table concludes we collect them. Move the row into §2.4 (what we
deliberately do not collect) or mark it "None — see §2.3".

---

## B. Real gaps the critique names — confirmed missing

### B1. Retention table has four holes (#19, #34, #35, #37)

§7 names a duration for every row it has, which is the right standard. It has no row
at all for:

| Missing | Why it matters |
| --- | --- |
| **Session tokens** | Disclosed in §2.2, no retention, no expiry, no revocation route stated |
| **Auth metadata** — account creation and sign-in timestamps | Disclosed in §2.2, retention unstated |
| **Email delivery records** (password reset, confirmation) | Held by Supabase's email service; retention unstated |
| **Consent and Terms-acceptance records** | Stored in Supabase **user metadata** — a storage location §2 never names |

The consent record is the most awkward: §3 offers "delete all your data but keep the
login" as a way to withdraw consent, but `clearAllData` does not touch
`health_data_consent_at` in user metadata, and nothing re-asks for consent before the
next workout is logged. So withdrawal-by-that-route is incomplete in the code, not just
undocumented (critique #30).

### B2. "No backups" doesn't distinguish redundancy from backups (#14)

Three documents state it absolutely — `PRIVACY.md` §7, `CONSUMER-HEALTH-DATA-PRIVACY.md`
§7.3, `DELETE-ACCOUNT.md`. "No automated platform backups on our plan" is verifiable and
true; "no second copy anywhere in our systems" is a claim about our provider's
infrastructure that we cannot verify — cloud databases keep replicas and transient
disaster-recovery snapshots regardless of plan.

**Fix:** keep the strong claim where it is true and scope it: "Our database plan
includes no backups we can restore from, and we take none. Our provider maintains
infrastructure-level replication for availability; those are not backups we can access,
restore from, or read, and they are not retained as archives." This *strengthens* the
MHMDA §7.3 answer rather than weakening it, because it is defensible under audit.

Related: §7 promises "we do not run [the backup script] against the live database."
`backups/` is gitignored, so nothing enforces that but the operator's discipline. If
you ever run it, §7 becomes false the moment the file lands on disk.

### B3. Absolute wording with no escape hatch (#1, #2, #16, #17, #20, #21, #29)

Each of these is currently true and each becomes false with one ordinary decision:

| Statement | Location | Breaks when |
| --- | --- | --- |
| "There are no analytics, no trackers" | short version, §2.4 | any telemetry is added |
| "No one else. Ever." | short version | any contractor, accountant or new processor |
| "one person — the sole operator" | §8, CHD §8 | anyone is hired or given access |
| Supabase named as *the* provider | §6, §10, CHD §3 | any migration |
| "There is no second purpose" | short version, §4 | reminders, notifications, a coach feature |
| no clause reserving provider replacement | §6 | any migration |

§12's advance-notice promise covers the *process* of changing these, so the exposure is
narrower than the critique implies — but the sentences themselves read as permanent
commitments. Swap "There are no…" for "We currently use no…", and add one sentence to
§6: "We may replace a provider with an equivalent one; where that changes who processes
your data we will update this list and notify you in advance under §12."

### B4. Crash reporting is one env var from making §2.3 false (#3) · **FIXED**

Verified: `.env.local` has no `VITE_SENTRY_DSN`, `.env.example` ships it blank, and
`src/monitoring.ts` is a total no-op without it — so §2.3 is **true today**. But the
Sentry dependency is installed, the call sites exist, and setting one variable in a
build environment silently makes a published health-app policy false. Under the FTC's
amended Health Breach Notification Rule that is not a policy update; it is a reportable
disclosure.

**Fix:** a build-time guard — fail `npm run build` if `VITE_SENTRY_DSN` is non-empty
while `legal/PRIVACY.md` §2.3 still says reporting is off. That makes the two
impossible to desynchronise, which is the same trick the `legal:draft` marker already
plays on the placeholders.

### B5. Implementation detail promoted to a promise (#5, #47)

§5 enumerates exact localStorage key names and the `sb-…-auth-token` cookie/key format.
Accurate today (verified against the constants at `src/gym-tracker-app.tsx:503-524`),
but a rename in the app silently falsifies a published document, and nothing in the
five test suites connects the two.

**Fix:** describe categories ("your workout history", "your preferences", "your sign-in
session"), keep the key names as a parenthetical, and add the fuzz guard from A1 so the
list cannot drift.

### B6. No Content-Security-Policy, and no acknowledgement of what that means (#46)

`index.html` sets no CSP. §8's security list is otherwise concrete and honest, but it
omits that everything in §5's table is readable by any JavaScript running on the origin
— which is the actual threat model for a client-side app holding health data.

**Fix:** add a CSP (this is the higher-value half), and add one line to §8: "Data stored
in your browser is readable by any script running on our domain; we ship no third-party
scripts and serve the app under a restrictive Content-Security-Policy."

### B7. Missing user-facing warnings (#41, #32, #33, #7)

- **Exported JSON contains health data in the clear.** §9 and `DELETE-ACCOUNT.md`
  encourage exporting and never warn about protecting the file.
- **Shared devices**: §5 covers sign-out but not that the *browser* may have saved the
  password independently (password manager, autofill) — outside our processing, but the
  user will not draw that line.
- **Browser console**: §2.3's "goes no further" is reassuring but a console on a shared
  or kiosk machine is not private.

### B8. Sync conflicts and device-only rows are undocumented (#39, #40)

The app has real, deliberate semantics here — `_sync: 'error'` rows exist **only** on
the device that wrote them, hydrate prefers a local unsynced edit over the server row,
and `cacheWriteFailed` surfaces a storage failure. None of this appears in §5 or §7,
which describe device storage purely as a cache. The consequence matters: some entries
may exist only on one device, and "delete everything on the server" does not reach them.

### B9. Deferred by the static-host placeholder (#28, #45, #48)

`npm run legal:release` currently reports **4 unresolved facts across 2 documents**:
static host name, its country, its log retention, and its transfer mechanism. Until the
host is chosen, §6, §7, §10 and CHD §3 all have a hole, and #45's CDN/proxy/reverse-proxy
log question cannot be answered. The gate is working correctly — this is a blocked item,
not a broken one.

### B10. Smaller wording gaps

| # | Point | Status |
| --- | --- | --- |
| 4 | "we never see your password" | §2.1 already says "never see or store"; the *reset token* path is unmentioned. Prefer "we do not store your password" |
| 13 | "immediate" deletion | True at our layer; provider-side purge may be asynchronous. Say "immediately from our live systems" |
| 15 | Security section is implementation-specific | Deliberate and good — but it dates. Review it on the §12 twelve-month cycle |
| 18 | Cookies | Accurate (Supabase uses localStorage, not cookies) — but says nothing about cookies a future static host might set |
| 22 | "no profiling" | The app *does* compute muscle-group breakdowns, streaks and per-exercise progress — automated evaluation of personal aspects under GDPR Art. 4(4). Distinguish "statistics we show you" from "profiling for our own purposes" |
| 23 | AI | Nothing prepared. Not an inaccuracy today; would need a new purpose, fresh Art. 9 consent, and an MHMDA disclosure before any LLM feature |
| 24 | automated decisions | §2.4 correctly scopes to Art. 22 "legal or similarly significant effects". §9's bare "we don't do any" should carry the same scoping |
| 36 | Reuse of a deleted account's email | Silent in all three documents. One sentence: a deleted address can be used to register a new, empty account |
| 49 | "where we practically can" | Subjective. Either drop the hedge or name what it excludes |
| 50 | FTC 60-day / 500-person wording | Hardcodes the current rule. "as the FTC's Health Breach Notification Rule requires, currently within 60 days" |

---

## C. Already handled — no action

The critique raises these; the documents answer them. Listed so they don't get reworked.

| # | Point | Where it's answered |
| --- | --- | --- |
| 9 | Application error reporting vs infrastructure logging | §2.2 (provider request logs) and §2.3 (app reporting) are already separate rows |
| 10 | Purpose and legal basis for IP addresses | §4, Art. 6(1)(f) with an explicit balancing test |
| 25 | Gender as health data | Deliberately over-classified; CHD §1 explains it and notes it drives no calculation |
| 30 | Withdrawal without deleting the account | §3 offers it — but see B1, the code doesn't complete it |
| 31 | Notification before legal disclosure | §6 already says "unless we are legally prohibited from doing so" |
| 38 | Data minimisation on optional fields | Every optional field is already marked optional in §2.1 |

---

## D. Not in the critique — found while checking

### D1. Internal legal documents are tracked in Git

`git ls-files` shows `LEGAL-LIABILITY-AUDIT.md`, `legal/PRIVACY-POLICY-GUIDE.md` and
`legal/TERMS-RATIONALE.md` are all committed to `origin`
(`github.com/smalkaisk-hash/gym-tracking-app`). The build pipeline correctly keeps their
content out of `public/`, but that only protects the published pages — it does nothing
about the repository.

Those files contain adverse legal admissions written to be read by you alone. One
example, from `PRIVACY.md`'s own internal block: *"consent is a hard precondition of
having an account, and Art. 9 has no contract-necessity exception, so a regulator could
argue it is not freely given. There is no fallback basis if that lands."*

**If the repository is public, that is a written admission available to any
complainant.** I could not verify visibility from here (`gh` is not installed).

**Action:** check the repo's visibility. If public, move the three internal documents to
a private location or a private repo. This is the highest-value item in this document
and it takes about a minute to resolve.

### D2. §12 promises Git history as the version archive

"every previous version is kept in the project's Git history. Email us and we will send
you any earlier version." That is a commitment to retain and serve history from a
repository whose visibility and permanence the policy never states — and it interacts
with D1. Critique #44 asks the same question from the other side.

---

## Suggested order of work

1. **D1** — check repo visibility. Minutes, and the largest exposure.
2. **A1–A6** — the six code/document contradictions. Each is a small edit plus a guard.
3. **B1** — the four retention rows, and finish the consent-withdrawal path in code.
4. **B4** — the build-time DSN guard, so §2.3 cannot silently rot.
5. **B2, B3** — rewording the absolute claims. No code, pure drafting.
6. **B6** — add a CSP, then describe it in §8.
7. **B5, B7, B8, B10** — remaining drafting.
8. **B9** — blocked on choosing a static host; `legal:release` already gates it.
