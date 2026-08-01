# FitPulse — legal & privacy audit, and what was fixed

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

## C1. Verify migration `0002` on production ⚠ *do this today*

`supabase/migrations/README.md` still lists `0002_add_delete_account_function.sql` as
**"⏳ verify applied"**. Four documents promise immediate self-service erasure. A6 means a
failure is now reported and offers the email route, but if the function isn't live your primary
erasure mechanism has never worked. One query in the SQL editor settles it.

## C2. Consent withdrawal still means deleting the data

Art. 7(3) requires withdrawal to be as easy as giving; EDPB 05/2020 ¶114 requires no detriment.
`PRIVACY.md` §3 now states the position honestly — the data *is* the service, so withdrawal and
deletion are the same act, both one tap from Settings, neither asking a reason — and points at
**Delete all my data** as the route that keeps the login. That is a materially better answer
than "delete your account", but it is still a defence rather than a separate control.

## C3. Re-consent on a version bump is stamped but never checked

`POLICY_VERSION` / `TERMS_VERSION` are written at signup and displayed in Settings; nothing
compares them against the current constants. `PRIVACY.md` §12 and `TERMS.md` §16.3 promise
affirmative acceptance before material changes take effect. Bumping either constant today
changes nothing for an existing user. **Fix:** compare stored vs current on hydrate, render a
re-consent gate. The plumbing exists; only the comparison is missing.

## C4. No mechanism to send the notices the Terms promise

§16.2 (30 days' email notice), §10.3, §12.5, §19.4 and `PRIVACY.md` §12 (in-app **and** email)
all assume an outbound channel. There is none beyond Supabase transactional auth mail, and no
in-app notice surface. Build the minimum, or soften the clauses to what you can perform.

## C5. Users cannot change their email, but §5.1 obliges them to keep it current

`updateUser` is used only for passwords. §19.5 deems notices received 24 hours after sending to
an address the user cannot correct. Supabase supports an email change with double confirmation.

## C6. The structural risk: is the consent "freely given"? ⚠ *lawyer*

The consent tick is a hard precondition of signup, and Art. 9 has no contract-necessity
exception. If an Art. 7(4) challenge lands there is no fallback basis and every health row is
unlawful. `PRIVACY.md`'s internal drafting note now records this openly and points here. Write
the one-page Art. 30 record and a short necessity note; being able to produce them on day one is
most of the defence.

## C7. Remaining smaller items

- **The consent record is user-writable** (`user_metadata`). Art. 7(1) requires the *controller*
  to demonstrate consent. Fix is migration `0003`: insert-only `consents` table, RLS
  insert-own/select-own, no update or delete.
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
- **Password floor is 6 characters** and no user MFA, while §8 offers "concrete measures" for
  special-category data. Art. 32 is proportionate-to-risk.
- **Sentry does no scrubbing** — `beforeSend: (event) => event`, and default breadcrumbs capture
  `console.error`, several of which pass Supabase error objects that can quote the failing row.
  Scrub and disable console breadcrumbs *before* any DSN is set.
- **Gender drives nothing.** Now disclosed honestly; dropping it is cleaner under Art. 5(1)(c)
  and removes a category from the MHMDA notice.
- **`npm run backup`** writes every user's rows unencrypted with the service_role key. No
  `backups/` directory exists and it is gitignored; `PRIVACY.md` §7's row is still a placeholder.
- **Art. 28 DPAs asserted but not evidenced.** Accept Supabase's, your host's and Sentry's; save
  copies. The transfer section (§10) and lead authority follow from the region you pick.
- **Breach clocks with no detection** — 72 hours, undue delay, and 60 days (FTC HBNR) while
  monitoring is off by default.
- **Schedule A and §13.1(a)** reference App Store / Play listings that do not exist for a web app.

---

# Recommended order

1. **C1** — verify `delete_account()` on prod.
2. **B1** — work `npm run legal:release` to zero, starting with the country of establishment,
   since §17/§18.2/§20.3 depend on it. Then remove the draft markers; the build will confirm.
3. **C3, C5** — the re-consent comparison and the email-change flow; both are small and both
   close a promise the documents already make.
4. **C7** — raise the password floor, decide on gender. (MFA is settled: not enabled, and no
   longer claimed anywhere.)
5. **C2, C4, C6** — the withdrawal control, a notice channel, and the Art. 30 record.
