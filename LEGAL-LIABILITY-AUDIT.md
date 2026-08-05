# FitPulse — legal & privacy audit, and what was fixed

**v4 · 2026-08-05.** An adversarial pass asking one question only: *where could a
complainant, a regulator or a plaintiff get a grip?* Findings are in **Part D**, which is the
part to read first — five of them are new and two of those did not exist when v3 was written,
because the fixes that landed since created them. Part D also corrects three statuses below
that are now stale.

**v5 · 2026-08-05.** A second pass asking the blunter question — *what could someone actually
sue over, or report us for*, grey areas included. **Part E**, and it opens three classes no
earlier pass examined: outbound notice, the app's **name**, and the **images** it ships.
**E1 was the most serious finding in this document** — the dormancy rule deleted accounts on
the strength of a warning email the project has no way to send.

**v6 pass — 2026-08-05.** The v4/v5 fixes were then code-reviewed as a diff. **Part F** records thirteen defects that review found in the compliance machinery itself — including two that restored E1's failure mode by a different route — and their fixes. Read it alongside Part E.

**v5 fix pass — status.** E1, E3, E5, E6(a), E6(b) and E6(d) are **fixed** — E3 fully, as of
2026-08-05: the image-rights half was a decision rather than an edit, it was answered *drop
the photographs*, and the files are gone (see E3 and Part G). **E2 and E4** remain decisions,
not edits, and stay gated: `npm run check:decisions` fails while either is unanswered, and it
is wired into `npm run release:check`.
E6(c), E6(e), E6(f) and E6(g) are unfixed and remain as recorded below. Gate after the fixes:
`npm run build` succeeds (now including `check:backups`), `legal:check` clean, all five suites
pass — **145 / 8 / 9 / 73 / 135**.

The E1 fix is worth stating precisely, because it inverts the failure direction. Migration
`0006` adds `dormancy_notices`; `scripts/dormant.mjs` now refuses to delete any account
without a recorded notice aged the full warn→delete gap. So with no warning sent, **nothing
is deleted** and the dormancy rule is inert — rather than deleting silently, which is what it
did before. `TERMS.md` § 12.9 and `PRIVACY.md` § 7 now say the warning is a *condition* of the
deletion, which is a promise the code keeps rather than one it hopes to.

**v4 fix pass — status.** D2, D3, D4, D5, D6(b), D6(c), D6(d), D6(e) and D7 are **fixed**;
D6(f) was already covered by the § 7 consent-record row. **D1 is the only finding still open
and it is blocked on one decision — choosing the static host.** Gate re-run after the fixes:
`npm run build` succeeds, `npm run legal:check` is clean, and all five suites pass —
**145 / 8 / 9 / 73 / 131** (legal-pages grew by 7 guards, listed under D5).
`TERMS.md` is now **v1.2** and `PRIVACY.md` **v1.1**, both effective **4 September 2026**,
with `TERMS_VERSION`, `POLICY_VERSION` and `POLICIES_EFFECTIVE_FROM` moved in the same change.

**v3 · 2026-08-01.** Two adversarial audit passes over `legal/`, the generated `public/`
pages, the publishing pipeline and every code path the documents describe — followed by a
fix pass. This file is now both the record of what was wrong and the list of what is left.

**Gate status: green.** `npm run build` succeeds and all five suites pass —
89 / 8 / 9 / **62** (legal-pages) / **118** (fuzz). `npm run legal:check` is clean, and
`dist/` serves all four policy pages with no dead links.

**Launch status: not yet.** `npm run legal:release` reports 3 documents still marked draft and
**16 distinct facts** outstanding (down from 38). That command is the checklist — work it to
zero, then remove the draft markers and the build will confirm. See B1.

**Not legal advice.** This is an engineering audit of the gap between the documents and the
code. Two items below (B1, C6) want a qualified lawyer, not an edit.

---

# Part A — fixed in this pass

## A1. Three internal drafting notes were printed inside the published Terms ✅

`public/terms.html` was rendering, as body text of the contract: the multi-line HTML comment
from `TERMS.md:14-17` (escaped, closing `--&gt;` included), and the two `*[If you are
established in Spain: …]*` / `*[If you also publish a translation: …]*` asides from §18.2 and
§19.9. Two causes, one class:

- `toHtml` stripped `internal:` regions and *single-line* comments only (`/^<!--[\s\S]*-->\s*$/`
  tested per line), so a comment wrapping onto a second line matched neither and fell through
  to the paragraph renderer.
- `*[…]*` asides are ordinary markdown — nothing marked them internal.

**Fixed:** `toHtml` now strips every comment after the internal-region pass (order matters —
the reverse would delete the `internal:start/end` markers and publish what they wrap), an
unterminated comment is a build error, and the generator **refuses** a document containing a
drafting aside, naming it and telling you to wrap it. The two asides are now inside internal
regions. `tests/legal-pages.test.mjs` asserts no page contains `&lt;!--`, `--&gt;`, or
drafter-addressed phrasing — the old greps missed all three because they searched only for
`internal:start`, `TERMS-RATIONALE` and `PRIVACY-POLICY-GUIDE`.

## A2. Nothing stopped a policy shipping a placeholder without the draft banner ✅

**Fixed:** `build-legal.mjs` now knows what a placeholder looks like and enforces the draft
marker and the placeholders **against each other, in both directions**. A placeholder with no
banner ships a hole in a required disclosure with nothing warning the reader; a banner with no
placeholders tells every reader that a document they are asked to accept is not in force.
Either is a build failure. `legal-pages.test.mjs` asserts the same invariant independently.

## A3. The deletion notice promised a remote wipe that the code deliberately never performs ✅

`DELETE-ACCOUNT.md` said: *"If you were also signed in on another device, open the app there
once while online and its cache will be cleared too."* [gym-tracker-app.tsx:4398-4414](src/gym-tracker-app.tsx#L4398-L4414)
does the opposite on purpose — an involuntary session end (exactly what device #2 experiences
after deletion) preserves the cache, because that same path covers a token expiry offline where
the cache holds the only copy of `_sync: 'error'` rows.

**Fixed in the document, not the code, and that is the right way round.** Making the claim true
would mean wiping on the *absence* of a session, which is the failure mode the current
behaviour exists to prevent; it would need a positive "this account is gone" signal, and a
false positive destroys unsynced data. The page now says plainly that other devices are a
manual step, tells the user to clear site data there, and adds: *"We would rather tell you this
than imply a remote wipe we cannot perform."*

## A4. "Clear all data" was documented as device-only and implemented as account-wide ✅

`PRIVACY.md` §5 and the §9 rights table listed **Clear all data** as the way to delete the
*device* copy. [clearAllData](src/gym-tracker-app.tsx#L5207) deletes `workouts`,
`body_weight_log` and `settings` on the server. A user tidying a shared computer, having read
the policy, would have destroyed their account.

**Fixed on both sides:**
- The control is renamed **Delete all my data**, with sub-copy: *"Erases your workouts,
  weigh-ins and settings everywhere — this device and the server — but keeps your login. To
  clear only this device, sign out."* The confirm now asks "…on all your devices?".
- The policy's device-only row now points at **Sign out**, which genuinely does clear the
  cache and nothing else, and the rights table distinguishes three actions instead of
  conflating two.
- A fuzz guard fails if the label ever reverts.

## A5. A failed deletion was reported to the user as success ✅

All three delete errors went to `console.error`; the UI called `onClearData()` fire-and-forget
and closed the confirm. Offline, the cache was cleared regardless — screen empties, user
concludes the data is gone, every row survives on the server. No `reportError`, so it was
invisible to the operator too.

**Fixed:** `clearAllData` returns `Promise<string | null>` like the other destructive handlers,
Settings awaits it, shows the error and keeps the confirm open, and the cache is **not** cleared
on failure (it is now the only copy of anything unsynced). The message is deliberately *"Some
data may still be on the server"* rather than "nothing was deleted" — the three deletes run in
parallel and some may have landed. `reportError(error, { at: 'clearAllData' })` added.

## A6. A failed account deletion was silent and offered no way out ✅

**Fixed:** `reportError(error, { at: 'deleteAccount' })`, and the failure copy now names the
out-of-app route instead of only "try again". The most likely cause is that migration `0002`
was never applied to prod — in which case the button has never worked, and with only a
`console.error` nothing would ever have said so. See C1: **still verify this on prod.**

## A7. The export was incomplete for the right it is offered as ✅

`PRIVACY.md` §9 offers Export as both the Art. 15 (access) and Art. 20 (portability) response,
and `TERMS.md` §3.2 promises the acceptance record on request — but the payload carried only
workouts, weigh-ins, goal and prefs.

**Fixed:** the export now includes an `account` block — email, account creation date, and the
consent/terms record (`healthDataConsentAt`, `...Version`, `termsAcceptedAt`, `termsVersion`).
Added as a sibling key so `importData`, which reads only keys it knows, still accepts the file.
`TERMS.md` §11.2, `PRIVACY.md` §9 and `DELETE-ACCOUNT.md` were updated to describe the payload
exactly, so the three descriptions cannot drift from it or from each other.

## A8. The MHMDA backup promise was unkeepable and contradicted two other documents ✅

`CONSUMER-HEALTH-DATA-PRIVACY.md` §7.3 promised deletion *"from all parts of our network,
including archived and backup systems"*; §8 of the same document, and `PRIVACY.md` §7, said
residual copies survive until backup expiry. No provider offering point-in-time recovery can
remove one account from one backup, and MHMDA carries a **private right of action**.

**Fixed, and the true answer turned out to be simpler than the careful one.** The first fix
described a rotation that could not be surgically edited. Establishing the actual facts showed
there are **no backups at all** — the database plan includes none and the project's backup
script is not run against production — so the MHMDA right can be satisfied completely rather
than argued around. All three documents now say that, in the same terms, together with the
honest corollary they each state: because no backup exists, a deletion cannot be reversed and
data lost through a provider failure cannot be recovered, which is exactly why the app ships an
export you keep yourself.

This one is also the clearest illustration of why the placeholder tooling matters: the same
fact lived in three documents, and for a while two of them described a rotation while the third
said no backups existed. Nothing but a read-through would have caught it, which is why
`legal:release` now groups unresolved facts across documents.

## A9. The two privacy documents rested on different legal bases for the same processing ✅

Art. 9(2)(a) consent (`PRIVACY.md` §4) versus "necessary to provide the requested service"
(`CHD` §5) — a regulator picks whichever is weaker.

**Fixed:** `CHD` §5 now explains that both apply and why: the "requested service" basis
satisfies MHMDA, GDPR needs explicit consent for special-category data, and rather than run two
regimes the stricter path is taken for everyone. The two documents are now stated to describe
one practice under two statutes.

## A10. Age was three different numbers ✅

Terms §4.1 said 18 (and `MIN_AGE = 18`); `PRIVACY.md` §11 was an unresolved `{{FILL: 16 … 13}}`;
the California paragraph said "under 16".

**Fixed:** 18 everywhere, with §11 cross-referencing Terms §4.1. A fuzz guard now compares the
number in `TERMS.md` against the one in `PRIVACY.md` **and** fails on any stray "under 1x" —
the existing guard only compared code against the Terms, which is how the Privacy Policy drifted.

## A11. Duplicates ✅

- **No duplicated paragraph** within any document, and the only text repeated across documents
  is intentional and now cross-referenced (the version header, and the production-access
  statement, which says so in-line).
- **No duplicate clause numbers** in the Terms (the two apparent hits were soft-wrapped
  continuation lines, `"19.8 survive."` and `"14.3 is held unenforceable"`; neither parses as a
  list item).
- **The same fact was worded as a different placeholder in each document** — `{{FILL: entity}}`
  vs `{{FILL: confirm entity — Supabase Inc.}}`, three different wordings of the postal address,
  and so on. That is how one gets resolved and the other doesn't, leaving two published policies
  naming different processors. **Fixed:** one canonical token per fact, and `legal:release` now
  groups unresolved facts **across** documents, flagging the six that appear in more than one
  with `(resolve in ALL of them)`.
- No duplicate top-level constants, npm scripts, or assertions shared between the two legal
  suites.

## A12. Smaller fixes ✅

- `TERMS.md` line 3 had an **unclosed `**`** after the dates were filled in — it would have
  rendered `**Version 1.0 · Effective …` literally. Closed, and dates normalised to
  `1 August 2026`.
- `CHD` §9 and §10 contained **malformed tokens** — `{{Github}}`, `{{Legal name: Karlis
  Smalkais}}`, `{{Location: Klusa Street 2a}}`, `{{Email: smalkaisk@gmail.com}}` — which would
  have published literally, braces and all. Resolved into prose, and the identity propagated to
  a single canonical form in `PRIVACY.md` §1/§13, `CHD` "Who we are"/§10 and `TERMS.md` §1.
- Every `[legal@yourdomain]` (7 in Terms, 2 in the deletion page) and `{{FILL: privacy contact
  email}}` (3 + 3) resolved to the contact address.
- `PRIVACY.md` §5's "exhaustive" `localStorage` list omitted the Supabase session token; added.
- The gender row in `CHD` §1 said `{{FILL: state the actual use}}`; it now says honestly that
  gender drives no calculation (see C7 — the cleaner answer is to stop collecting it).
- §11.1 security measures, §12.6 deletion timing, and the `[Settings → …]` bracket artefacts
  were resolved (some of this landed in the parallel editing session).
- `TERMS.md` §16.5 promised an archive URL that does not exist → now the Git history, matching
  `PRIVACY.md` §12 and `CHD` §9.
- `DELETE-ACCOUNT.md` has **no placeholders left and its draft banner is removed** — it is now
  in force, which matters because it is the Google Play out-of-app deletion URL.

---

# Part B — the one thing to decide before launch

## B1. Signup asks users to accept documents that say they are not in force ⚠

The generated banner reads *"This document is not yet in force and has not been reviewed by a
lawyer."* The signup checkbox reads *"I'm 18 or older and I accept the Terms of Service and the
Privacy Policy"*, and `TERMS.md` §3.1 says that tick forms the contract. Either no contract is
formed — losing §9's assumption of risk (the most valuable clause a fitness app owns), §14's
cap, §6's licence and §17's governing law — or it is ambiguous, and §20.6 construes ambiguity
in the user's favour.

**This cannot be fixed by editing.** It is fixed by resolving the remaining facts and removing
the draft markers. `npm run legal:release` now tells you exactly what is outstanding — about 30
distinct facts, six of them shared between documents. Until it passes, do not put signup in
front of a real user.

**One finding inside that list is worth surfacing on its own:** the Terms are drafted for
**Spain** — governing law, "working day", the LSSI-CE analysis in `TERMS-RATIONALE.md` §3, the
ADR body in §18.2 — but the controller's address is **Klusa Street 2a**, which is not a Spanish
address. If that is right, §17, §18.2, §20.3 and the whole rationale are pointed at the wrong
jurisdiction. `[SPAIN]` is now `[COUNTRY OF ESTABLISHMENT]` with an internal note saying to fix
the country **first** and re-read the dependent clauses. I did not guess it — guessing governing
law is worse than leaving it blank.

---

# Part C — still open (code and operations, not wording)

## C1. Verify migration `0002` on production ✅ *done — verified live 2026-08-05*

`public.delete_account()` **exists on prod**, is `SECURITY DEFINER` with `search_path = ''`,
and is executable by `authenticated` only (no `anon`, no `PUBLIC`). The primary erasure
mechanism works. `supabase/migrations/README.md` now records the verification rather than
the intention.

Verified by reading the live project, not by inspecting the migration file — the two had
never been compared, which is what the "⏳ verify applied" status existed to flag.

## C2. Consent withdrawal still means deleting the data

Art. 7(3) requires withdrawal to be as easy as giving; EDPB 05/2020 ¶114 requires no detriment.
`PRIVACY.md` §3 now states the position honestly — the data *is* the service, so withdrawal and
deletion are the same act, both one tap from Settings, neither asking a reason — and points at
**Delete all my data** as the route that keeps the login. That is a materially better answer
than "delete your account", but it is still a defence rather than a separate control.

## C3. Re-consent on a version bump is stamped but never checked ✅ *fixed*

**Fixed:** `needsReconsentFor(meta)` compares the stored versions against the current
constants, and `ReconsentScreen` is a pre-render gate between onboarding and the app. It
carries the same two separate, never-pre-ticked boxes as signup (merging them would void
the Art. 9 half), offers Sign out as the alternative — a gate with no exit is a dark
pattern — and writes the new record through `acceptCurrentPolicies`. `age_confirmed_at` is
deliberately not re-stamped: the original confirmation is the thing worth keeping.

Bumping `POLICY_VERSION` or `TERMS_VERSION` now actually does something, which is what
`PRIVACY.md` §12 and `TERMS.md` §16.3 have been promising all along. §12 was updated to
describe the gate rather than only promise the behaviour.

## C4. No mechanism to send the notices the Terms promise — *mostly closed*

§16.2 (30 days' email notice), §10.3, §12.5, §19.4 and `PRIVACY.md` §12 (in-app **and**
email) all assume an outbound channel. There was none, and no in-app notice surface either.

**In-app half: done.** A banner appears the moment a version is bumped, naming the effective
date and linking both documents, and the re-consent gate raises on that date — see D2.

**Email half: made performable, not automated.** `npm run notify:policy-change` renders the
§16.2 notice — recipients (only accounts that have *not* accepted the current versions),
subject, and body — and `npm run dormant` renders the §7 dormancy warnings, one message per
account because the deletion date differs. Both write to `notices/`, which is **gitignored**:
those files contain real user email addresses, and the policy-change file is a BCC list of
every account that hasn't re-accepted, so committing one would itself be a breach. The
notice script reads `POLICY_VERSION`, `TERMS_VERSION` and `POLICIES_EFFECTIVE_FROM` out of
the source rather than taking arguments, so it cannot describe a different change from the
one the app will enforce, and it **warns if fewer than 30 days remain** — the clause it
exists to satisfy.

Sending is still manual, from the contact address, which is already a disclosed processor
(Google LLC, `PRIVACY.md` §6). That is deliberate: automated delivery means a new processor,
a new Art. 28 agreement and a new §6 disclosure — a decision with a cost. What the clauses
require is that the notice be *given*; the pipeline is not the promise. **What remains open
is the discipline**, not the capability: nothing fails if nobody runs these, exactly like
`npm run dormant` and `npm run purge:auth-log`. Put all three on one schedule.

## C5. Users cannot change their email, but §5.1 obliges them to keep it current ✅ *fixed*

**Fixed:** Settings → Account → **Change email**, backed by `changeEmail` in the container
(the in-app screen stays presentational and takes an injected handler, per the auth-access
convention). The provider sends a confirmation to the old **and** the new address, so a
mistyped address cannot orphan an account — which is why the success copy says "check both
inboxes" rather than "done".

This is also the Art. 16 rectification route for the one piece of personal data the user
previously could not correct. `PRIVACY.md` §9's Correct row now names it. **Depends on a
dashboard setting** — "Secure email change" must stay on, or the both-addresses promise is
false; see SUPABASE-SETUP.md § 4.

## C6. Is the consent "freely given"? — *re-scoped 2026-08-05, and much smaller than it looked*

The concern was that consent is a hard precondition of signup while Art. 9 has no
contract-necessity exception, so an Art. 7(4) challenge would leave no fallback basis.

**EDPB Guidelines 05/2020 ¶ 32 answers it directly:** *"Article 7(4) is only relevant where
the requested data are not necessary for the performance of the contract… Conversely, if
processing is necessary to perform the contract (including to provide a service), then
Article 7(4) does not apply."* The workouts and body weights **are** the service — there is
no version of FitPulse that shows a user their training history while not holding it. The
guidelines' own examples of bad tying (¶ 33 marketing use of payment data, ¶ 40 cookie
walls) are all about processing severable from the service. This is not that.

So this is no longer "the structural risk". The analysis is written up in
`compliance/DECISIONS-AND-ASSESSMENTS.md` § 1 with the supporting factors — separate
unticked box, single purpose, one-tap withdrawal, Art. 6(1)(b) standing independently — and
the Art. 30 record now exists (`compliance/ART-30-RECORD.md`), which was the other half of
the recommendation.

**What remains, and it is narrow:** an *optional* field collected under the same consent
that is not necessary to the service cannot borrow this reasoning. Today that is `gender`,
which the controller elected to keep — recorded, with what makes it defensible, in
§ 4 of the same file. Worth a lawyer's sign-off at launch; no longer worth blocking on.

## C7. Remaining smaller items

- **The consent record is user-writable** (`user_metadata`) ✅ *fixed — migration `0004`*.
  Art. 7(1) puts the burden of demonstrating consent on the controller, and EDPB 05/2020
  ¶ 105-108 wants the workflow and the text shown, not a boolean. `public.consents` is
  append-only *by construction*: RLS on, INSERT and SELECT policies, deliberately **no**
  UPDATE and **no** DELETE policy (an operation with no policy is denied), plus matching
  revokes as defence in depth. The metadata copy stays as the capture path — it exists
  before any other row does and survives an abandoned onboarding — and the app mirrors it
  into the table on hydrate, feature-detected so it is a no-op until the migration is run.
  **Still to do: apply `0004` in the SQL editor** (`supabase/migrations/README.md`).
- **MFA claim removed as untrue (2026-08-01).** Three documents — `PRIVACY.md` §8, `CHD` §8 and
  `TERMS.md` §11.1(d) — stated that the admin console was protected by multi-factor
  authentication. MFA is a paid feature on this plan and will not be enabled, so the sentence
  was a misrepresentation under FTC Act §5 and GDPR accuracy, in the one section a regulator
  reads first. All three now describe what is actually true: access limited to one person, no
  employees or contractors, and — verifiable from the code — the app ships only the provider's
  public key, with the RLS-bypassing service_role key never in the bundle. The published text
  does **not** advertise the absence of MFA: a policy owes accuracy, not a map of where the
  locks are missing. `tests/legal-pages.test.mjs` now fails if "multi-factor" / "2FA" reappears
  on any published page, since a removed security claim is exactly the kind of sentence a later
  editor copies back in. **Note for the record:** MHMDA RCW 19.373.060 asks for access limited
  to what is necessary, which one person satisfies; no regime here mandates MFA. Worth
  double-checking one thing though — on several providers, TOTP on your *own* login is free
  while *org-wide MFA enforcement* is the paid tier. If that split applies to your plan, the
  free half costs nothing and is the highest-value control available on this account.
- **Password floor is 6 characters** ✅ *fixed in code — one dashboard step outstanding*.
  `MIN_PASSWORD` is now **10**, length-only (no composition rules, per NIST SP 800-63B), and
  sign-in is deliberately still unchecked so raising it cannot lock anyone out of their own
  account. `PRIVACY.md` §8 now states the floor **and** that passwords are checked against
  breached-password lists — which makes enabling Supabase's leaked-password protection
  **required, not optional**: until it is on, a published policy is inaccurate. It is free,
  unlike MFA. SUPABASE-SETUP.md § 4 is now a required step covering it, the server-side
  minimum length, and "Secure email change"; the checklist is in
  `compliance/DECISIONS-AND-ASSESSMENTS.md` § 5.
- **Sentry does no scrubbing** — `beforeSend: (event) => event`, and default breadcrumbs capture
  `console.error`, several of which pass Supabase error objects that can quote the failing row.
  Scrub and disable console breadcrumbs *before* any DSN is set.
- **Gender drives nothing.** Now disclosed honestly; dropping it is cleaner under Art. 5(1)(c)
  and removes a category from the MHMDA notice.
- **`npm run backup`** writes every user's rows unencrypted with the service_role key. No
  `backups/` directory exists and it is gitignored. Its header comment used to claim
  "Supabase already keeps automated daily backups", contradicting the three documents that
  promise none exist — corrected, and it now says that running it against prod makes those
  statements false the moment the file lands on disk.
- **Art. 28 DPAs asserted but not evidenced.** Still outstanding, now tracked as a table in
  `compliance/DECISIONS-AND-ASSESSMENTS.md` § 5 alongside the region check, rather than as a
  line in an audit nobody diffs.
- **Breach clocks with no detection** — partly addressed. `compliance/BREACH-REGISTER.md` now
  exists, which is itself an Art. 33(5) obligation (every breach documented, notifiable or
  not) that was simply missing; it carries the Art. 33/34 procedure, the FTC HBNR overlay,
  and an honest section on why detection is weak and what compensates for it. The clocks
  still start on the operator noticing.
- **No retention limit on the account itself** ✅ *fixed*. `PRIVACY.md` §7 said "Until **you**
  delete them", which is the absence of a retention period rather than one — the most
  frequently cited Art. 5 failing in DPA audits. There is now a dormancy rule (warn at 24
  months, delete at 36) and `npm run dormant` to enforce it. The script deliberately does not
  trust `last_sign_in_at` alone: a refresh token keeps a daily user signed in for months
  without producing one, so it takes the newest of sign-in, workouts, weigh-ins and settings
  and only deletes when every signal is stale. Hard delete, never the soft delete that fires
  no cascades. **It cannot send the 24-month warning — there is still no outbound channel
  (C4).**
- **Schedule A and §13.1(a)** reference App Store / Play listings that do not exist for a web app.

---

# Part D — v4 pass (2026-08-05): where someone could get a grip

Everything here was verified against the file, the generated page, the prod-audited migration
record or the running source — not inferred from a document reading. Where a claim rests on
someone else's audit (the migrations README) it says so.

**First, three statuses above are stale and should be read as corrected:**

- **C1 is done.** `supabase/migrations/README.md` records `0002` as **verified live on prod
  2026-08-05** — `public.delete_account()` exists, `SECURITY DEFINER`, `search_path = ''`,
  granted to `authenticated` only. The primary erasure route works.
- **C3 is done, but it over-corrected — see D2.** The re-consent gate exists
  (`needsReconsentFor`, `ReconsentScreen`, gate at `src/gym-tracker-app.tsx:5898`).
- **`compliance/reviews/2026-08-05-privacy-gap-analysis.md` D1 (repo visibility) appears resolved.** An unauthenticated
  `api.github.com/repos/smalkaisk-hash/gym-tracking-app` returns **404**, which GitHub returns
  for a private repository as well as a non-existent one. Given the remote is configured and in
  use, private is the reading — but confirm it once from the repo's own settings page, because
  the whole of that finding turns on it.

## D1. The Terms are in force; the Privacy Policy they incorporate says it is not ⚠ *the big one*

`public/terms.html` carries **no draft banner**. `public/privacy.html` and
`public/consumer-health-data-privacy.html` both carry:

> **Draft.** This document is not yet in force and has not been reviewed by a lawyer.

`TERMS.md` § 2.2(b) incorporates the Privacy Policy **into the binding contract by reference**,
and § 8.5 goes further: on any data-protection matter, *the Privacy Policy governs*. So the
contract that is in force is governed, on the questions that matter most, by a document that
tells the reader it is not in force. One tick-box at sign-up accepts both.

v3's B1 treated all three documents as draft together, which is a coherent (if unlaunchable)
state. The asymmetry is new, and it is worse than uniform draft status, because it is now
*internally* contradictory rather than merely premature:

- **Contract.** A term incorporated by reference that negates itself is ambiguous, and
  § 20.6 — reinforced by Schedule B.1.5 — reads genuine ambiguity **against us**.
- **GDPR.** The Privacy Policy *is* the Art. 13 notice. Delivered under a banner saying it is
  not in force, there is a real argument that no valid notice was given, so the consent
  captured at sign-up is not "informed" under Art. 4(11) — and the Art. 9(2)(a) explicit
  consent is the **only** basis under which any health row is held. This is the same fault
  line as C6, but reachable without the Art. 7(4) argument: it needs no theory about whether
  consent was freely given, only a reading of the banner.
- **MHMDA.** RCW 19.373.020 requires the consumer-health-data policy to be maintained and
  published. One published as a non-binding draft is a weak answer to a statute enforced
  through the Washington CPA, which carries a **private right of action**.

`npm run legal:release` already prints the warning — but it frames it as "not ready to
publish". The Terms are already un-drafted, so the exposure is live in the repo today rather
than waiting on launch.

**Fix:** the four remaining facts are all one decision — **choose the static host**
(`legal:release` lists: name, country, log retention, transfer mechanism). Until then, do not
put sign-up in front of a real user; if anything must ship first, restore the `legal:draft`
marker on `TERMS.md` so the three documents at least agree with each other.

**Status — decided 5 August 2026: not deploying yet, so this stays open by choice.** The
controller elected not to select a host. That makes `npm run legal:release` failing the
*correct* state rather than a defect, and it bounds this finding: D1 needs a real person in
front of sign-up to bite, there is no deployment, and production holds **0 rows**. The
contradiction is real in the repository and cannot presently reach a user.

Recorded in `compliance/DECISIONS-AND-ASSESSMENTS.md` § 7 with the order things must be
reconciled in before any deployment — including the draft markers, which is **not** a
one-line change in either direction: `build-legal.mjs` refuses a draft marker on a document
with no placeholders, so putting `TERMS.md` back into draft is blocked by the same guard
that stops a placeholder shipping without a banner. Resolving the four facts and dropping
both banners is the intended route out.

## D2. The re-consent gate breaks the very clauses it was built to honour ⚠

C3 asked for a version comparison. What landed is a **hard pre-render gate**: at
`src/gym-tracker-app.tsx:5898`, `if (needsReconsent) return <ReconsentScreen …>`, whose only
two exits are *Accept* or *Sign out*. Bumping `POLICY_VERSION` or `TERMS_VERSION` locks every
existing user out of the app the moment they next load it. Against that, the Terms promise:

| Clause | Promise | What the gate does |
| --- | --- | --- |
| § 16.2 | at least **30 days' email notice** before a change takes effect | no notice; effective on deploy |
| § 16.3 | "you may **continue using the current version** until the effective date" | access ends immediately |
| § 16.3 | "you may **export Your Data at any time** before and during that period" | Settings is behind the gate — export is unreachable |
| § 12.5(b) | account closed only *after* the effective date, on § 16.2 notice | service withdrawn on day zero |

The direction matters: the document promises **more** than the code delivers, and the shortfall
falls entirely on the user.

- **Consumer law.** Withdrawing the service on the day of a change we chose, contrary to our
  own notice clause, is a breach of § 16.2 and the kind of practice Annex points (f) and (j) of
  Directive 93/13 treat as unfair.
- **GDPR.** Art. 15 access and Art. 20 portability cannot be conditioned on accepting new
  terms. Making export unreachable until the user re-consents is a **detriment** attached to
  refusing consent — which is precisely the Art. 7(4) weakness C6 identifies, now built into
  the UI rather than merely arguable about sign-up.

**Fix (small, and it makes the gate defensible):** put an **Export backup** button and a plain
"you can keep using FitPulse until *date*" line on `ReconsentScreen`, and drive the gate off an
effective date rather than a bare version mismatch — a `POLICY_EFFECTIVE_FROM` constant the
gate compares against, so a bump schedules the gate instead of raising it. The comment at 4331
already reasons carefully about why the gate sits before the app; the missing half is that
§ 16.3 gives the user a window, and the gate gives them none.

**✅ Fixed as prescribed, 2026-08-05.** Three changes, and the finding was right on both counts:

- `POLICIES_EFFECTIVE_FROM` now schedules the gate. `reconsentDue()` splits "out of date"
  from "must act now", and the gate raises only once the date passes. An unparseable date
  is treated as **not** due — a typo in that constant must not lock out the user base.
- Between the bump and the effective date the app shows a **banner** naming the date and
  linking both documents, instead of nothing. That is the § 16.2 notice surface in-app; the
  30-day email half still needs C4.
- `ReconsentScreen` carries **Export my data**, wired to the same `exportData` as Settings,
  with copy saying it works whether or not you accept. That was the sharper half of the
  finding: Art. 15 and Art. 20 cannot be conditioned on accepting new terms, and putting
  export behind the consent built the Art. 7(4) detriment into the UI.

Bumping either version constant is now a three-part job — bump, set the effective date at
least 30 days out, send the § 16.2 notice — and the comment on the constant says so.

## D3. `auth.audit_log_entries` survives account deletion, and no document discloses it ⚠

From `supabase/migrations/README.md`, which audited prod on 2026-08-05:

> `auth.audit_log_entries` has no FK to `auth.users` and holds the actor's id, **email** and
> **IP**. It survives account deletion by design (it is Supabase's audit trail). Currently 0
> rows on this project.

Zero rows only because there are no users. It fills on the first sign-in, sign-up or
password reset — so this claim set is one real user away from being false, and nothing in the
build or the test suites would notice. Four published statements are affected:

- `TERMS.md` § 12.7 names exactly three things that survive deletion and closes the list with
  **"and nothing else"**;
- `DELETE-ACCOUNT.md` "What does not get deleted" lists two (your own exports, legally
  required records);
- `PRIVACY.md` § 7 says deletion "cascades to every workout, weigh-in and settings row";
- `CONSUMER-HEALTH-DATA-PRIVACY.md` § 7.3 says deletion removes "every workout, weigh-in,
  preference **and the account itself** at once", under a statute (RCW 19.373.040(3)) with a
  private right of action.

It also fills a hole `compliance/reviews/2026-08-05-privacy-gap-analysis.md` B1 left open: this table **is** the storage
location for the "account creation and sign-in timestamps" § 2.2 discloses and § 7 gives no
retention for.

**Fix:** decide the retention (Supabase does not purge this table for you), then say so — a
§ 7 retention row, a fourth item in Terms § 12.7, a third bullet in the deletion page, and a
line in CHD § 7.3. If the answer is "we purge it on a schedule", write the query into the
operations notes, because an undocumented manual step is how this becomes false again.

## D4. Two years of support email survives a deletion that three documents call complete

The Gmail fix (`compliance/reviews/2026-08-05-privacy-gap-analysis.md` A5) correctly added Google LLC as a processor — and
with it a new § 7 retention row: *"Email you send to our contact address, and our replies —
**24 months** from the last message in the thread."* Nothing else was updated to match.

So a user who emails a privacy request and then deletes their account leaves correspondence in
the mailbox for two more years. It is not an infrastructure log, not a copy on their device,
and not legally required — so it falls outside all three limbs of Terms § 12.7 and outside
both limbs of `DELETE-ACCOUNT.md`. CHD § 3 concedes in terms that such a message **may carry
consumer health data**, which is the combination that makes this more than tidiness.

**Fix:** one limb in Terms § 12.7 and one bullet in the deletion page, both pointing at
`PRIVACY.md` § 7 so the duration lives in one place.

## D5. The Privacy Policy added a recipient without honouring its own change-control

The uncommitted working-tree diff on `legal/PRIVACY.md` adds **Google LLC (Gmail)** to the § 6
processor table and a new international transfer to § 10. The header is untouched:

```
Version 1.0 · Effective 1 August 2026 · Last reviewed 1 August 2026
```

§ 12 classes **"a new recipient"** as a material change requiring advance notice in-app *and*
by email, and closes: *"We will never make a material change quietly and rely on your continued
use as consent."* `POLICY_VERSION` in `src/gym-tracker-app.tsx:1172` is still `'1.0'`.

No user has been harmed — there are none. But the version stamp is now unreliable as evidence,
which is the point of having it: the consent record, the re-consent gate (D2) and migration
`0004`'s `document` column all identify the agreed text by a version string and a URL whose
content has moved underneath them. A stamp that does not change when the text changes cannot
distinguish what was agreed from what is current, and that is exactly what `0004` was written
to be able to prove.

**Fix:** bump to **1.1** with a real effective date, bump `POLICY_VERSION` in the same commit
(the internal note at the top of `TERMS.md` is the model — v1.1 of the Terms did this properly),
and adopt the rule the Terms already follow: *the version header and the code constant move in
the same commit as the text.*

## D6. Smaller, but each is a handhold

| # | Finding | Why it bites |
| --- | --- | --- |
| a | **English-only Terms, Latvian trader.** § 19.9 provides the Terms in English only, § 17.1 chooses Latvian law, § 18.2 names **PTAC** as our supervisor | Latvia's Official Language Law s. 21 requires consumer-facing service information in the state language, and PTAC enforces it. Combined with Directive 93/13 Art. 5 transparency, a Latvian consumer can argue the terms were never transparently communicated. **Wants counsel**; a Latvian-language summary is the cheap mitigation |
| b | **§ 17.3 imposes exclusive Latvian jurisdiction on non-EEA/UK consumers.** As drafted, "not a consumer resident in the EEA or the UK" catches a US consumer | B.3.2 concedes it cannot waive unwaivable state rights, but an exclusive foreign forum clause in a free consumer app is a standard unconscionability hook in US consumer litigation — and one unconscionable term invites an attack on the whole document. Carve consumers out of 17.3 expressly |
| c | **§ 13.1(a) warrants fitness for the purpose described "in the App Store or Google Play listing."** No listing exists — FitPulse is a web app | A warranty pegged to a non-existent description is ambiguous → § 20.6 against us. Same root as C7's last bullet: Schedule A also makes Apple a third-party beneficiary (A.10) of a contract for an app Apple does not distribute |
| d | **§ 2.2 and § 8.5 contradict each other on precedence.** § 2.2 ranks the Terms above the Privacy Policy; § 8.5 says the Privacy Policy governs data-protection matters | D3 and D4 are *exactly* data-protection conflicts, so the contract does not clearly say which document wins where it matters. Make § 2.2(b) expressly subject to § 8.5 |
| e | **§ 19.8 survival omits 8.5 and 11.2** while including 12.6 and 12.7 | After termination, the deletion clauses survive but the clause making the Privacy Policy govern them, and the export commitment, do not. A user disputing post-deletion retention argues under surviving clauses against a hierarchy that did not survive |
| f | **No document mentions the `consents` table** (migration `0004`) | It is a new server-side store of personal data. § 7 has no retention row for it (it cascades on account deletion — say so), and § 2 never names it. Disclose it in the same change that applies the migration |

**What this pass did not find.** Worth recording, so it is not re-checked: `clearLocalCache`
now clears both theme keys (`compliance/reviews/2026-08-05-privacy-gap-analysis.md` A1 genuinely fixed); the app uses no
IndexedDB, Cache API or service worker, so § 5's "that is the whole of it" is accurate; and
Terms § 11.8(d)'s offline-deletion claim is **true in the code** — `deleteWorkout` and
`deleteBodyWeightEntry` both restore the row and flash "Couldn't delete — you may be offline"
when the server call fails. § 11.8 is the strongest correspondence between document and code
in the set, and § 14.7's risk allocation stands on it.

## D7. Two documents disagreed about whether abandoned accounts are deleted ✅ *fixed*

Found while fixing the above, and the sharpest of the lot because the two statements cannot
both be acted on. A dormancy rule landed in `PRIVACY.md` § 7 — warn at 24 months of
inactivity, **delete at 36** — with a real enforcement path behind it (`scripts/dormant.mjs`,
`npm run dormant`). `TERMS.md` § 12.9 said, in terms:

> **We do not delete accounts for inactivity.** There is no dormancy rule in FitPulse. Stop
> using it for five years and your data will be there when you come back.

One document promised the data would be there; the other scheduled its deletion. Worse than
the usual drift, because the contract is the document that makes a promise *to* the user, and
the promise it made was the one the other document breaks — a user relying on § 12.9 loses
their training history at 36 months and can point at the clause that said they would not.

**Fixed in the Terms, not the Privacy Policy**, because the rule itself is right: holding a
stranger's training history forever with no end date is the Art. 5(1)(e) failure the rule
exists to cure. § 12.9 now sets out the same 24/36-month rule in contract terms, states that
any activity resets the clock, and points at § 7. Introducing it is a material change under
§ 16.3 — which is exactly what the version bump and the 30-day effective date now carry.

**Worth confirming, because it is a product decision and not an audit finding:** 36 months of
total inactivity is a real deletion of real data. It is defensible and it is disclosed. If you
would rather it were longer, change the two numbers in `PRIVACY.md` § 7, `TERMS.md` § 12.9 and
`scripts/dormant.mjs` together — a fuzz guard already checks the rule has an enforcement path.

---

# Part E — v5 pass (2026-08-05): any opening at all, including grey ones

Part D asked where the documents and the code disagree. This pass asks a blunter question —
**what could someone actually sue over, or report us for** — and deliberately includes weak
and speculative angles, marked as such. Three of these are classes no previous pass looked at
at all: outbound notice, the app's *name*, and the images it ships.

## E1. Six promises need an email channel that does not exist — and one of them deletes data ⚠ *the worst finding in this file*

**There is no way to send a user an email.** Verified: no mail library, no SMTP, no
transactional provider anywhere in `src/` or `scripts/`. The only mail that exists is
Supabase's built-in auth mail, which sends password-reset and confirmation only and cannot
carry an arbitrary notice. `scripts/dormant.mjs` says so in its own output: *"This script does
not send email — there is no outbound channel in the project."*

Six published promises depend on one:

| Promise | Where |
| --- | --- |
| a warning email at **24 months** before an abandoned account is deleted | `PRIVACY.md` § 7, `TERMS.md` § 12.9(a) |
| **30 days'** email notice before a change to the Terms takes effect | `TERMS.md` § 16.2 |
| **30 days'** email notice before a material reduction of a feature | `TERMS.md` § 10.3 |
| **30 days'** written notice if the Service is discontinued | `TERMS.md` § 12.5(a) |
| material privacy changes announced "by in-app notice **and by email**" | `PRIVACY.md` § 12, `CHD` § 9 |
| a "reasonable further attempt" after a delivery failure | `TERMS.md` § 19.10(b) |

v3 recorded this as C4 ("no mechanism to send the notices the Terms promise") and ranked it
last. **It is now the top item, because the dormancy rule changed what a missed notice costs.**
Every other entry means a user is surprised by a change. The first one means a user is told
they will be warned before their account is erased, is not warned, and loses three years of
training history. That is the only promise in the entire document set whose breach *destroys
the user's data*, and it is breach of contract, an FTC Act § 5 deception, and an Art. 5(1)(a)
fairness failure at the same time.

**The v4 fix pass made a second instance of this and it should be said plainly.** Setting
`POLICIES_EFFECTIVE_FROM = 2026-09-04` and bumping both versions schedules a hard re-consent
gate for a date on which the § 16.2 notice cannot be sent. There are no users, so nothing is
harmed today — but the design now assumes a channel that does not exist, and that assumption
must not still be there at launch.

**Fix — in this order:**
1. **Interlock the destructive one first.** `dormant.mjs --delete` should refuse to delete an
   account with no recorded warning. A `warned_at` column (or a row in `consents`-style
   append-only table) written when the notice actually goes out, and a hard refusal without
   it. This converts "we promise a warning" from prose into something the code enforces —
   the same move `0005` made for the 90-day claim.
2. **Build the in-app notice surface**, which is buildable today and which § 19.10(d) already
   leans on for the re-consent case. Then narrow every clause above from "by email" to
   "by in-app notice, and by email where we are able to reach you".
3. Only then decide whether to add real outbound mail.

## E2. The app's name is already several other fitness apps ⚠ *decided 2026-08-05: RENAME — not yet executed*

> **Decision.** The `trademark_clearance` entry in
> [launch-decisions.json](compliance/launch-decisions.json) was answered on 2026-08-05:
> **rename before launch.** One further prior user was found that makes the position worse
> than the finding below records — [fitpulse.jp](https://fitpulse.jp/index.html) ships a free
> iOS workout tracker that logs strength and cardio and "visualises muscle engagement" to
> "reveal imbalances": the same name, the same Nice class, and a feature set that matches
> this app's own muscle donut. The EUIPO/UKIPO/USPTO register searches were **not** done
> (Justia returns HTTP 403 to automated fetches, and the registers are not web-indexed) and
> are no longer decision-relevant, since prior use this close settles it either way.
>
> **The rename itself is outstanding.** `check:decisions` is green because the *question* was
> answered; the app, the documents and the package are all still called FitPulse. Do not read
> that gate as "the name is settled". The inventory and the one trap are below.

### Rename inventory — every hard-coded occurrence

`grep -rioE "fitpulse"` outside `node_modules/`, `dist/` and `public/` (the last is
generated — it regenerates from `legal/`):

| Where | Count | Notes |
| --- | --- | --- |
| `legal/TERMS.md` | 69 | The bulk of the work. § 6.2 also **claims ownership of the branding** — that sentence has to change or go regardless of the new name. |
| `LEGAL-LIABILITY-AUDIT.md` | 15 | This file. Historical findings — rewriting them would falsify the record; leave them and note the rename. |
| `src/gym-tracker-app.tsx` | 10 | See the trap below. |
| `legal/PRIVACY.md` | 8 | |
| `legal/TERMS-RATIONALE.md`, `legal/PRIVACY-POLICY-GUIDE.md` | 10 | Internal, never published. |
| `compliance/launch-decisions.json` | 7 | Includes this decision; keep the old name where it is describing history. |
| `scripts/build-legal.mjs` | 6 | Page titles and the footer. |
| `BACKUP-RESTORE.md` | 6 | |
| `scripts/{backup,restore,dormant,notify-policy-change,notice-lib}.mjs` | 14 | Notice copy and backup-file headers — user-visible in emails. |
| `legal/DELETE-ACCOUNT.md`, `legal/CONSUMER-HEALTH-DATA-PRIVACY.md` | 7 | Published. |
| `index.html` | 1 | `<title>` — user-visible in the browser tab and in search results. |
| `README.md`, `CLAUDE.md`, `PRODUCT-ROADMAP.md`, `SUPABASE-SETUP.md`, `supabase/migrations/README.md`, `compliance/*` | ~10 | Docs. |
| `tests/qa/{fuzz,load-app}.mjs` | 2 | |

`package.json` is already neutral (`"name": "gym-tracker-app"`), as is the repository folder.

### The trap: renaming naively destroys every existing export

`src/gym-tracker-app.tsx` stamps `app: 'FitPulse'` into the export envelope (~line 5597) and
`importData` **refuses any file whose `app` is not exactly `'FitPulse'`** (~line 5650):

```js
if (d.app != null && d.app !== 'FitPulse') { resolve(false); return; }
```

Change both to the new name in one edit and every backup a user has already downloaded stops
importing — silently rejected as "not a FitPulse backup". That is data loss in the one feature
offered as the GDPR Art. 20 portability route, so the import check must accept **both** names:
write the new one, accept the old one forever. The export filename prefix
(`fitpulse-backup-<date>.json`, ~line 5626) can change freely; nothing reads it back.

Also user-visible and easy to miss: the auth-screen wordmark (~3966), the header wordmark
(~6146), the onboarding greeting (~4354), and **both consent tick-box texts** (~4215, ~4490) —
the last two name the controller in the sentence the user is consenting to, so they are part
of the consent record's wording, not decoration.

---

Nobody has ever checked whether **FitPulse** is available, and it substantially is not. In the
identical market and the identical trademark class, currently live:
[FitPulse Smart Workout Planner](https://apps.apple.com/us/app/fitpulse-workout-fitness/id6746181610)
on the App Store, [FitPulse: Gym Fitness Planner](https://play.google.com/store/apps/details?id=com.fitpulseworkout.fitnessplan&hl=en)
on Google Play, [fitpulse.ai](https://fitpulse.ai/) ("Workout & AI Fitness trainer"),
[a coaching app of the same name](https://digitalhabitat.it/fitpulse-mobile-app-for-fitness-coaches/),
and [others](https://www.toolify.ai/tool/fitpulse).

I could not confirm a registration either way from a web search — a real clearance needs
EUIPO, UKIPO and USPTO directly, and that should happen **before launch, not after**. But
registration is not the threshold that matters here:

- **Prior use in the same field is enough** for passing off (UK/EU) and for a Lanham Act
  § 43(a) unfair-competition claim (US), without anyone holding a certificate.
- **If any of them is registered in class 9/42**, it becomes straightforward rather than
  arguable.
- **The practical risk is not damages, it is distribution.** Apple and Google both action
  trademark complaints against listings, so the realistic outcome is losing the store listing
  or the domain, at whatever moment the app finally has users.

**And the Terms make an affirmative representation about it.** § 6.2: *"We and our licensors
keep all intellectual property rights in the Service, including its software, design, exercise
catalogue, text and **branding**."* If the name is somebody else's, that sentence is a
misrepresentation made to every user who accepts the contract — which converts a name problem
into a § 19.3 / fraudulent-misrepresentation problem.

**Fix:** clearance search now. Renaming before launch costs a day; renaming after costs the
brand, the domain, the store listing and every link. If the name stays, drop "branding" from
§ 6.2 or qualify it.

## E3. Four stock photographs ship with no licence record and no model releases ✅ *closed 2026-08-05 — the images were removed*

> **Resolution.** Both limbs are closed, and not by mitigation: the `image_rights` decision
> was answered **drop the photographs entirely**, and all five files (the four imported plus
> one unused) were deleted on 2026-08-05. `SessionType`'s `img`/`pos` fields and the `<img>`
> branch in the tile markup went with them, so a photograph cannot be re-added as a one-line
> tile field — it takes a deliberate edit that re-opens the decision. The provenance record
> survives the files in [Assets/CREDITS.md](Assets/CREDITS.md), which also corrects this
> finding on one point of fact: re-opening each photo ID first-hand showed the "identifiable
> person" claim below was **wrong for two of the four** (one is a pure back view, one is
> partial). That does not change the outcome — it is why the record is kept rather than the
> assessment being trusted from memory. The original finding stands unedited below.


`src/gym-tracker-app.tsx:8-11` imports four Pexels photographs, which are bundled into `dist/`
and shown as the push/pull/legs/custom day tiles. Nothing anywhere in the repository records
the licence, the source URL, the photographer, or when they were obtained — `grep` for any
attribution across `README.md`, `legal/`, `public/` and `compliance/` returns nothing.

Two distinct exposures, and the second is the one that actually bites:

- **Licence provenance.** Free stock sites carry re-uploaded work they never had rights to.
  The Pexels licence gives no indemnity, so if one of these was infringing at upload, the
  claim lands on the operator with no recourse and no record of good faith. Keeping the
  source URL and date is the whole defence and costs nothing.
- **Model releases — the sharper one.** Pexels does **not** obtain or supply model releases.
  These are photographs of identifiable people, and they are used to illustrate a *health and
  fitness product*. Using an identifiable person's likeness in connection with health,
  fitness or medical products is the classic carve-out in every stock licence, precisely
  because it implies endorsement and touches sensitive subject matter. That engages
  personality rights in Latvia and the EU, and right-of-publicity / false-endorsement claims
  in the US. It is also, strictly, processing those individuals' personal data (a photograph
  of an identifiable person) with no recorded basis and no notice to them.

**Fix (cheap, do all three):** record source URL + photographer + licence + date per file in
the repo; re-read the Pexels licence against the "health and fitness" use specifically; and
prefer images where no face is identifiable — for tiles showing equipment and movement, that
costs nothing visually and removes the entire category.

## E4. The UK GDPR breach is documented, deliberate, and still a breach *— re-taken 2026-08-05, unchanged and now fully informed*

> **Decision.** The `uk_gdpr_representative` entry was answered on 2026-08-05: **accept the
> risk knowingly.** No representative, no geo-block, Schedule B.2 stays. Both objections this
> finding raises were put to the controller explicitly and neither changed the answer —
> `compliance/DECISIONS-AND-ASSESSMENTS.md` § 3 now records the re-taking, including that
> Schedule B.2 is kept *deliberately* (withdrawing UK consumer protections to improve the
> Art. 27 position would trade a real user protection for a paper one) and that Art. 83(2)(b)
> aggravation was understood and accepted.
>
> **This finding is closed as a decision, not as a problem.** The breach is still a breach.
> What changed is that it is now a knowing, priced choice with a hard revisit trigger —
> **deployment**, not the first UK complaint, because appointing a representative later does
> not cure the period without one. It is defensible today only because the project is
> undeployed with no UK users; it stops being defensible the moment that is untrue.

`compliance/DECISIONS-AND-ASSESSMENTS.md` § 3 records the decision to serve UK users without
appointing a UK Art. 27 representative, and the analysis in it is correct — including that the
Art. 27(2) occasional-processing exemption is unavailable for health data. Credit where due:
that is exactly the kind of record Art. 5(2) accountability wants.

**But recording a violation does not cure it**, and two things make it worse than the note
suggests:

- **The documents actively target the UK.** Schedule B.2 gives UK consumers a Consumer Rights
  Act section, UK courts, and a UK complaints route. So this is not incidental reach that
  might be argued away — the Terms hold the service out to UK consumers in terms.
- **The record itself is evidence of intent.** Art. 83(2)(b) makes the intentional character
  of an infringement an aggravating factor in setting a fine. The same document that
  demonstrates accountability also proves the breach was knowing rather than careless. That is
  the right trade, but it should be a decision taken with open eyes rather than a side effect.

**Fix:** either appoint a representative (roughly €100–500/yr, and the note already prices it)
or geo-block UK signup **and delete Schedule B.2**, because holding the service out to a
market you have decided not to serve lawfully is the worst of both.

## E5. Grey — the ePrivacy "strictly necessary" claim is broader than the exemption

`PRIVACY.md` § 5 says the whole of the storage table is "strictly necessary" under the
ePrivacy Directive, so no consent banner is shown. That is comfortably right for the workout
cache, the session token, the in-progress session and the cache-owner key — without them the
service the user asked for does not work.

It is weaker for `gym-theme` and `gym-theme-vars`. A colour preference is a convenience, not
something without which the service cannot be delivered. Most regulators treat user-preference
storage as exempt in practice and no one is going to be fined over a theme, but the sentence
is written as an absolute covering *every* key, and it is the kind of overclaim that invites a
regulator to look at the rest of the section. One qualifying clause fixes it.

## E6. Smaller openings, roughly in descending order of plausibility

| # | Opening | Reading |
| --- | --- | --- |
| a | **`npm run backup` makes `PRIVACY.md` § 7 false the moment it is run.** It writes every user's health data unencrypted to disk with the service_role key, while § 7 states no manual backup exists | Exactly the Sentry-DSN failure mode, which *does* have a build guard (`check:monitoring`). This one has none. Add it to `compliance/verified.json` via `check:claims`, or guard it the same way |
| b | **§ 6.2 claims IP in the "exercise catalogue."** Exercise names are unprotectable facts and short phrases; at most the selection and arrangement attracts a thin compilation right | Asserting IP you do not have, against consumers, is a term regulators dislike. § 8.7 already softens it in the user's favour — the overreach is the word "catalogue" in 6.2 |
| c | **One tick-box does three legal jobs**: age declaration, contract formation, and "accepting" a privacy policy | A privacy notice is not something one accepts, and bundling weakens each act. The health-data box is correctly separate, so the MHMDA exposure is closed; this is the residue |
| d | **§ 8.9 takes feedback "without attribution"** | Attribution is a moral right and is inalienable in much of the EU, Latvia included. Unenforceable as written rather than dangerous |
| e | **Schedule A makes Apple a third-party beneficiary** of a contract for a product Apple does not distribute | Inert while there is no App Store build, but it grants enforcement rights to a stranger to the agreement |
| f | **§ 9.3 says you are "solely responsible"** | Survives only because § 9.6 and § 2.4 pull it back. A consumer court reads absolutes like this down; the structure is right, the adverb is not |
| g | **Still no Content-Security-Policy** (v3 B6, unfixed) | Everything in § 5's storage table is readable by any script on the origin. Nothing third-party ships today, so this is latent rather than live — but it is the control that keeps it latent |

---

# Part F — v6 pass (2026-08-05): code review of the compliance change itself

The v4/v5 fixes were reviewed as a diff, by three independent reviewers reading the app
source, the SQL and ops scripts, and the documents. **Every finding below is a defect
*introduced or left* by the compliance work, not a new legal question** — the pattern worth
noticing is that the two worst ones are in the machinery built to keep promises, not in the
promises. All are now fixed; this section records what they were, because the classes recur.

| # | Finding | Why it mattered | Status |
| --- | --- | --- | --- |
| F1 | **The re-consent gate blocked the withdrawal its own copy advertises.** `ReconsentScreen` offered Accept / Export / Sign out. Its health-data tick-box says consent can be withdrawn "from Settings" — and Settings is behind the gate. Signing out deletes nothing | Art. 7(3): withdrawal must be as easy as giving. The gate built to protect consent made withdrawing it impossible in-app, and it is the same "published text describes behaviour the code does not have" class as D3/D4 — reproduced *inside the fix for it* | **Fixed** — the full password-confirmed deletion, plus the out-of-app route, now live on that screen. Fuzz-guarded |
| F2 | **`dormant.mjs` read its activity signals unpaged.** PostgREST caps a response at 1000 rows and returns a short result, not an error | This is E1's failure mode restored by a different route: a user past the cap loses their workout and weigh-in signals, `lastSeen` collapses to `last_sign_in_at` — the signal the script's own header explains cannot be trusted — and they are classified dormant. The interlock does not save them: they get warned, recorded, and deleted twelve months later. Reachable at ~1000 workout rows, i.e. one active user | **Fixed** — every read pages and orders, matching `backup.mjs`. Two fuzz guards |
| F3 | **The notices read was unpaged *and* unordered**, while the code takes the newest `sent_at` per user | Truncation there hides the newest notice, leaving an older one as the apparent maximum — so the 12-month clock is measured from a warning the user did not receive last. The one truncation that points the *unsafe* way | **Fixed** — paged and ordered |
| F4 | **`public/terms.html` published two version numbers**: header 1.2, closing line "version 1.1" | The version identifier is what § 3.2 promises the user back, what `TERMS_VERSION` stamps into the consent record, and what the re-consent gate compares. A user asking which version they accepted found two answers. The suite that exists to prevent exactly this read only the header line | **Fixed** — and the guard now checks every place a document identifies itself, plus a "last reviewed" freshness check for the CHD notice, which had been materially edited under a stale v1.0 header |
| F5 | **`compliance/ART-30-RECORD.md` claimed leaked-password protection was enabled** while `verified.json`, in the same directory and dated the same day, recorded that it is unavailable on the current plan | The Art. 30 record is the one artefact written to be handed to a supervisory authority as it stands. An overstated Art. 32 measure there is a false statement made *to the regulator*. The `legal/` half of the change removed the claim honestly; the accountability half did not follow | **Fixed** — recorded as absent, with the reason |
| F6 | **The Art. 30 record had no row for the two purposes this change introduced** — the 90-day sign-in security log and dormancy review/notice evidence | `compliance/README.md` states the rule ("a new purpose, data category, recipient or retention period → ART-30-RECORD.md") and the change that created both did not follow it | **Fixed** — P7 and P8 added |
| F7 | **The consent-evidence path failed silently three ways**: the `consents` read error was swallowed under a comment claiming it was logged; one unparseable metadata timestamp failed the whole batched insert; and the effect had no retry, so a session that started offline never filed its rows | Since the metadata is *user-writable* — the entire premise of the evidence table — the second one let a user unilaterally suppress the controller's own Art. 7(1) evidence by writing junk into one field | **Fixed** — absent-table distinguished from real errors, timestamps validated and normalised per row, `hydrateNonce` added for retry |
| F8 | **Two build gates had false negatives in the dangerous direction.** `check-monitoring-claim.mjs` passed silently if the policy was reworded *and then* a DSN set; `check-backup-claim.mjs` matched `there are none`, which also appears in a sentence about headcount | A gate satisfiable by an unrelated sentence is not a gate. Both failed toward "green while the risky configuration is live" | **Fixed** — reporting-on must now *name* Sentry, claim phrases must be unique within their document or the check errors, and `.env*` files are discovered rather than listed |
| F9 | **`verified.json` marked the 90-day auth-log retention verified** beside a note conceding the purge job is not scheduled | Applying the migration is not the claim; running it on a schedule is. A green gate satisfied by a date its own adjacent prose contradicts is the exact shape `check:claims` exists to eliminate | **Fixed** — split into `auth_log_purge_available` (verified) and `auth_log_purge_scheduled` (**open**, with an `expires` deadline the gate now enforces). `check:claims` fails today, correctly |
| F10 | **`schema.sql` omitted migrations 0005 and 0006 and was no longer re-runnable**; the prod deletion audit still said "three tables and one function" after five tables and three functions were live | The file calls itself the canonical state and promises it is safe to re-run; the README table is what backs § 12.7's closed list of five survivors | **Fixed** — both migrations flattened in, the constraint-drop order corrected, the audit re-checked |
| F11 | **`consents` timestamps were client-settable** — a column `default` applies only when the client omits the column, and PostgREST lets a session send any value | 0004's append-only RLS stops a row being *rewritten*; nothing stopped a backdated one being *appended*, and the column that would have exposed that was itself forgeable | Migration **`0007`** written (BEFORE INSERT trigger) — **not yet applied**. Meanwhile `PRIVACY.md` § 3 has been narrowed to what 0004 alone actually delivers |
| F12 | **Rendered `notices/` files outlive a deleted account** — a sixth survivor against § 12.7's closed five. `.gitignore` stops them being published, not held | The same reasoning `0006` applies to the database was not applied to the local artefact, which no cascade reaches | **Fixed** — § 12.7(c) and the deletion page now cover notices we send (they are correspondence, and the record that the notice was given), and both scripts print a delete-after-sending reminder |
| F13 | Smaller, all fixed: an account already past the delete threshold could never be warned (notices were rendered only for `warn` state) and was therefore permanently stuck; the 12-month grace period was an unguarded CLI flag; the deletion date told to users was computed from last activity rather than the warning date the code honours; both notice scripts shipped `https://…/privacy.html` placeholders; a repeat `--record-warning` pushed the clock forward for ever; `backup.mjs` backed up three of five tables; the fuzz guard on the interlock checked a *variable name*, which `rows.filter(r => r.state === 'delete')` satisfies | — | **Fixed** |

**Gate after this pass:** `npm run build` succeeds, `legal:check` clean, all five suites pass
— **150 / 8 / 9 / 77 / 143**. Each new source guard was mutation-tested: reverting the thing
it guards makes it fail. `check:claims` and `check:decisions` fail, which is the correct
state — one unbacked claim (F9) and three open decisions (E2, E4, image rights).

**Still open after this pass:** D1 (the static host, and the draft banners downstream of it),
F9 (schedule the purge job), F11 (apply `0007`), E6(g) (no CSP), and the older Part C items.

---

# Recommended order

**Everything in Part D is done except D1. Part E is newly found and none of it is fixed.**

**From the v5 pass — E1 first, and it is not close:**

1. **E1** — interlock `dormant --delete` against a recorded warning **before that script is
   ever run with `--delete`**. It is the only finding in this file whose breach destroys a
   user's data. Then build the in-app notice surface and soften the six clauses to match.
2. **E2** — clearance-search the name. Cheap now, ruinous later, and it gates the domain and
   any store listing.
3. **E3** — record the image licences and drop identifiable faces. An afternoon.
4. **E4** — decide the UK properly: appoint a representative, or block UK signup and remove
   Schedule B.2.
5. **E6(a)** — guard the backup claim the way the Sentry claim is guarded.
6. **E5, E6(b)–(g)** — a drafting pass.

**From the v4 pass, ahead of the older list — D2, D3 and D5 are code changes, not drafting:**

1. **D1** — choose the static host, resolve the four facts, drop the draft markers. Everything
   else is downstream of the documents agreeing on whether they are in force.
2. **D2** — export button + effective-date gate. Small, and it converts the strongest
   user-facing argument against us into a defence.
3. **D3** — decide `auth.audit_log_entries` retention and disclose it, **before** the first
   real user makes the current wording false.
4. **D5** — bump `PRIVACY.md` to 1.1 and `POLICY_VERSION` with it, in one commit.
5. **D4, D6(d), D6(e), D6(f)** — drafting; a single editing pass over Terms § 12.7, § 2.2,
   § 19.8 and `PRIVACY.md` § 7.
6. **D6(a), D6(b), D6(c)** — the two that want counsel, and the store-listing warranty.

**Carried forward from v3:**

1. **C1** — verify `delete_account()` on prod.
2. **B1** — work `npm run legal:release` to zero, starting with the country of establishment,
   since §17/§18.2/§20.3 depend on it. Then remove the draft markers; the build will confirm.
3. **C3, C5** — the re-consent comparison and the email-change flow; both are small and both
   close a promise the documents already make.
4. **C7** — raise the password floor, decide on gender. (MFA is settled: not enabled, and no
   longer claimed anywhere.)
5. **C2, C4, C6** — the withdrawal control, a notice channel, and the Art. 30 record.

---

# Part G — repository housekeeping pass (2026-08-05)

Not an audit of the documents — an audit of the *files around* them, asking which ones still
earn their place. One finding is a legal-record matter and belongs here rather than in a
commit message.

## G1. `FitPulse_Terms_Review.md` was a fossil of the v1.0 external review ✅ *removed*

**What it was.** A root-level file listing 40 numbered suggestions against the Terms
("Define commercial use", "Clarify how timestamps behave across time zones", "Extend health
disclaimers to future AI-generated recommendations"), with a closing "highest-priority
improvements" list. It carried **no dates, no statuses and no version reference**, and
`CLAUDE.md` pointed readers at it as a live second list to check "before assuming a point is
unaddressed".

**What it actually was.** The external review of **Terms v1.0** — the one the internal note at
the head of `legal/TERMS.md` records as answered by **v1.1 (2 August 2026)**. That note
describes the v1.1 changes in exactly the review's own categories: terms v1.0 left vague
(*commercial use, material reduction, disproportionate load, anonymous*), practices the code
already had (*device-clock dating, offline reconciliation, what survives deletion, what the
export holds*), and promises written against one implementation (*security measures, export
format, providers, browsers, free of charge*).

**Verified before deletion.** All 40 items were checked against the current `legal/TERMS.md`
and every one is answered. The clause-by-clause mapping, for the record:

| # | Review item | Answered by |
| --- | --- | --- |
| 1 | Define "commercial use" | § 6.4, indexed at § 20.7 |
| 2 | Account sharing → suspension | § 5.4 with § 5.8 |
| 3 | Export format permanence | § 11.2 — "documented, machine-readable, non-proprietary" |
| 4 | Import compatibility across versions | § 11.6 |
| 5 | "Immediate deletion" | § 12.7 — *What "immediately" means, and what is left afterwards* |
| 6 | Offline sync conflicts | § 11.8 — *what happens when two devices disagree* |
| 7 | Email verification | § 5.6 — access to the registered mailbox is what proves the account |
| 8 | Password recovery | § 5.6 — reset link to the registered address is the only route |
| 9 | Retention after deletion | § 12.7, five limbs (logs, support mail, auth security log …) |
| 10 | Inactive accounts | § 12.9, with the `dormancy_notices` interlock |
| 11 | Automated abuse detection | § 7.5 — *Automated detection* |
| 12 | Future APIs | § 6.7 — *There is no public interface, yet* |
| 13 | Discontinuation when notice is impossible | § 12.8 — insolvency, provider shutdown, legal order |
| 14 | Force majeure vs export | § 19.6 **and** § 19.11 — the latter is this item exactly |
| 15 | Sole-operator wording | § 11.1 / § 12.8 — "today that is one person", not a headcount promise |
| 16 | Browser support | § 13.4 — a current version of a supported browser |
| 17 | Device compatibility | § 13.4, indexed at § 20.7 |
| 18 | Time zones | § 9.7 |
| 19 | Device clock authority | § 9.7 — expressly *no* authoritative clock on our side |
| 20 | Fraudulent / mis-entered data | § 13.5 and § 14.3(e) |
| 21 | Custom exercise ownership | § 6.2 (v1.2 stopped claiming exercise names) |
| 22 | Usernames | § 5.9 — N/A by design; there are none |
| 23 | Benchmarking / public comparison | § 6.6 — expressly permitted |
| 24 | Feedback licence | § 8.9 (v1.2 removed the attribution waiver) |
| 25 | Multiple accounts | § 5.8 |
| 26 | Invalid email addresses | § 19.10 |
| 27 | Spam filters, full mailboxes | § 19.10 |
| 28 | Rate limits | § 7.4 with § 6.7 |
| 29 | "Material feature" | § 10.6, indexed at § 20.7 |
| 30 | "Reasonable advance notice" | § 10.7, indexed at § 20.7 |
| 31 | Implementation-specific security promises | § 11.1 — "providers change, so we may change how we meet the obligation" |
| 32 | Aggregated / anonymous | § 8.8, indexed at § 20.7 |
| 33 | Export completeness | § 11.2 — format and contents, restated on change in a release note |
| 34 | Consumer vs business users | § 17.3–17.4 with Schedule B.3 |
| 35 | Which sanctions lists | § 4.2 — EU Consolidated, UN Security Council, named |
| 36 | Changing infrastructure providers | § 10.8 — with two limits, and § 8.2 not widened |
| 37 | User error vs software defect | § 13.5 / § 14.3(e) |
| 38 | Free-app wording vs future paid plans | § 13.6 |
| 39 | Export abuse | § 7.4 — bulk import/export repeated at disproportionate load |
| 40 | Future AI features | § 9.8 — extends the health disclaimer to "a simple rule, a statistical model, or an AI model" |

**Why removing it is the fix rather than annotating it.** This is the failure mode
`compliance/reviews/README.md` was written to prevent, sitting at the repository root instead
of under a date: *a stale finding that reads as current is worse than no finding, because it
sends someone to fix something that is already fixed and lends false weight to whatever else
the file says.* Four of its items are ones a keyword search will not find in the Terms —
"force majeure" is § 19.6's *Events outside our control*, "material feature" is § 10.6's
*material reduction* — so a future reader checking it quickly would have concluded, wrongly,
that the Terms had gaps and re-opened settled clauses.

The review's content is not lost: it is above, mapped to clauses, and the file remains in git
history. `CLAUDE.md`'s pointer to it is removed in the same change, so this document is again
*the* record, which is the rule that file sets for itself.

**Nothing was changed in `legal/`.** This entry records a verification and a deletion, not an
edit to any published document.

## G2. The rest of the pass — non-legal, recorded here for completeness

Nothing below touches `legal/`; it is listed so this file remains a complete account of what
changed on 2026-08-05.

- **CI now exists.** [.github/workflows/ci.yml](.github/workflows/ci.yml) runs
  `legal:check` → `build` → `test` on every push and PR, with no secrets. Until now *every*
  gate this document relies on — the five suites, the four `check:*` scripts, the legal
  build — was enforced only by someone remembering to run it, which is the exact control
  failure the rest of the project is engineered against. `legal:check` runs **first** on
  purpose: the build's own first step regenerates `public/*.html`, so running it later would
  silently rewrite a page committed stale and then "verify" the rewrite.
  `release:check` is a separate **manual** job — it fails by design until launch, and a
  permanently red CI is one nobody reads.
- **`npm test`** chains the five suites in order; they had no single entry point.
- **The day-tile images** were deleted (E3), which also removed ~448 KB of JPEG from `dist/`
  — down from 8.8 MB, after a downscaling pass earlier the same day that the removal then
  made moot. `dist/` went from 11 MB to ~1.6 MB.
- **`README.md`** stated Node 18+; Vite 8 requires ^20.19 || >=22.12. `npm install` would
  still succeed on 18 (there is no `engines` field to enforce it, and npm's own check is a
  warning by default) — it is `npm run dev` and `npm run build` that fail, which is the more
  confusing order to discover it in. CI pins 22.

**Gate after this pass:** `npm run legal:check` clean, `npm run build` succeeds, all five
suites pass — **150 / 8 / 9 / 87 / 143**. `npm run check:decisions` **passes**: all three
launch decisions are resolved (`image_rights`, `trademark_clearance`, `uk_gdpr_representative`).
Read that as "the questions were asked and answered", not "the work is done" — the
`trademark_clearance` answer is *rename before launch*, and the rename itself is outstanding
(see § 'Rename (trademark_clearance)'). `legal:release` (4 placeholders, all the unchosen
static host) and `check:claims` (1 unverified claim, the auth-log purge) still fail by
design, per B1 and the auth-log purge claim.
