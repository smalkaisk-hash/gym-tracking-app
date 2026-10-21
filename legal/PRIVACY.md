# FitPulse Privacy Policy

**Version 1.1 · Effective 4 September 2026 · Last reviewed 21 October 2026**

<!-- internal:start -->
> **DRAFT — read this box before publishing.**
> Every `{{FILL: …}}` below is a fact only you can confirm. A privacy policy that
> states something untrue is worse than no policy at all: under FTC Act §5 and the
> equivalent EU/UK rules, an inaccurate statement here is itself the violation.
> **Do not publish with any placeholder unresolved, and do not delete a placeholder
> without verifying the fact.** Drafting notes are in blockquotes like this one and
> must all be deleted before publishing. See PRIVACY-POLICY-GUIDE.md
> for why each clause is worded the way it is.
<!-- internal:end -->

---

## The short version

FitPulse is a personal gym-tracking app. Here is everything that matters, in one place:

- **What we hold:** your email address, the name you chose, your optional gender, your
  unit and display preferences, and the workouts and body weights you log.
- **Why:** to run the app for you. That's the whole reason. There is no second purpose.
- **Your training and body-weight data is health data.** We treat it as such, and we
  only process it because you gave us explicit consent when you created your account.
- **We do not sell it, share it, advertise against it, or analyse it.** There are no ad
  networks, no analytics, no trackers, and no profiling in this app.
- **Only you can read your rows through the app.** Every database table is locked to your
  account ID by a database-level rule, not by application code. Two exceptions we would
  rather name than imply away: the operator can reach the database directly through the
  provider's administrative console, and our database provider's own staff can access the
  infrastructure under their contractual controls. §8 says what that means in practice.
- **You can delete everything, permanently, yourself,** from Settings → Delete account.
  You can export a full copy from Settings → Data → Export backup.
- **Who else touches it:** the small, named list of infrastructure companies in
  §6. No one else. Ever.
- **Where you live changes your rights, not our practices.** We do the same thing with
  everyone's data wherever they are — one database, one set of providers, no ads, no
  selling — but the law gives different people different rights over it. §9 has a section
  for the **EEA and UK**, for **California**, for **Washington State** and for the rest of
  the **US**. Washington residents also have a separate
  [Consumer Health Data Privacy notice](/consumer-health-data-privacy.html), which that
  state requires to be its own document.
- **Questions or requests:** **smalkaisk@gmail.com**.

The rest of this document is the detail behind those statements.

---

## 1. Who is responsible for your data

The data controller — the person who decides why and how your data is processed — is:

- **Karlis Smalkais**
- Klusa Street 2a, Riga, LV-1007, Latvia
- **smalkaisk@gmail.com**

<!-- internal:start -->
> **Drafting note.** GDPR Art. 13(1)(a) requires "the identity and the contact details of
> the controller". Google Play separately requires "developer information and a privacy
> point of contact". An email address alone has been found insufficient by EU regulators.
<!-- internal:end -->

We have not appointed a Data Protection Officer, and are not required to: we are a single
individual, we are not a public authority, and our core activity is not large-scale
processing of special category data (GDPR Art. 37). The controller named above answers
privacy questions directly.

The controller is established in Latvia, within the European Union, so no GDPR Art. 27
representative is required for users in the EEA.

We keep a written record of our processing activities, as GDPR Art. 30 requires of anyone
who handles health data, and we will produce it to a supervisory authority on request.

<!-- internal:start -->
> **UK Art. 27 — decided 5 August 2026: no UK representative, exposure accepted knowingly.**
> Being established in the EU settles Art. 27 for the EEA but **not for the UK**, and the
> Art. 27(2) "occasional processing" exemption is unavailable here because this is special
> category data. The reasoning, the consequences and the revisit triggers are recorded in
> `compliance/DECISIONS-AND-ASSESSMENTS.md` § 3 — **do not restate them in this published
> document.** A policy is not the place to announce a known non-conformity, and § 9 already
> tells a UK reader they may complain to their own authority (the ICO), which is the part
> that affects them. Revisit if UK users become a material share of the base.
<!-- internal:end -->

## 2. What we collect

### 2.1 Data you give us

| Data | When | Required? |
| --- | --- | --- |
| Email address | Sign-up | Required — it is your login and the only way to reset your password |
| Password | Sign-up | Required. Stored only as a salted hash; we never see or store the password itself |
| Display name | Onboarding | Required — it is how the app greets you. A nickname is fine |
| Gender | Onboarding | **Optional.** Leave it blank and nothing breaks |
| Units (kg/lb), theme, training split, custom day names, hidden exercises, chart preferences | Onboarding and Settings | Optional |
| Weekly workout goal | Settings | Optional |
| Workouts — workout type, date, duration, free-text notes, and for each exercise the sets, reps and weights | Each time you log a session | Optional, but this is the app's purpose |
| Body weight entries, with dates | When you log a weigh-in | Optional |

### 2.2 Data generated automatically

| Data | Source | Note |
| --- | --- | --- |
| Your account ID (a random UUID) and account creation/sign-in timestamps | Our authentication provider | Needed to keep your rows separate from anyone else's |
| **Sign-in security log** — each sign-in, sign-up and password reset, with the time, the **IP address** and the email address used | Our authentication provider, which records them itself | A security and abuse-detection record kept by the provider that performs the sign-in. It is held separately from your account, so **deleting your account does not delete it** — see §7 for how long it is kept and §12.7 of the [Terms](/terms.html), which lists it among the things that survive a deletion |
| Session tokens | Your browser | Keeps you signed in |
| Server request logs, including **IP address**, timestamp, and the request made | Our hosting and database providers | Standard infrastructure logging — see §7 for how long |
| Crash and error reports | **None — the app sends none.** See §2.3 | Listed here so its absence is explicit, not an omission |

### 2.3 Error reports

**The app sends no crash or error reports anywhere.** Error reporting is disabled in the
build we ship: the reporting code is only included when a reporting key is set at build
time, and we do not set one. Errors are written to your own browser's console and go no
further.

If we ever turn it on, that adds a new recipient of your data — we would name them here
and in §6, and tell you before it starts, as §12 requires.

### 2.4 What we deliberately do not collect

We think this list matters as much as the one above. FitPulse does **not**:

- request or collect location, GPS, camera, microphone, contacts, calendar, photos, or
  health-platform (Apple Health / Google Fit / HealthKit) data;
- contain any advertising SDK, ad identifier, or advertising code of any kind;
- contain any analytics, product-telemetry, session-recording, heatmap or A/B-testing
  tool;
- use cookies or device storage for tracking (see §5);
- build a profile of you, infer anything about you, or make any automated decision that
  produces legal or similarly significant effects (GDPR Art. 22);
- collect data about you from any source other than you.

## 3. Health data — the important part

**Your body weight, your gender, and your training history are health-related personal
data.** Under the GDPR this is "special category" data (Art. 9); under Washington's My
Health My Data Act it is "consumer health data"; under the FTC's Health Breach
Notification Rule it is "PHR identifiable health information".

We process it on the basis of your **explicit consent** (GDPR Art. 9(2)(a)), given by the
separate, unticked checkbox shown at sign-up. That consent:

- is asked for separately from accepting the Terms — it is never bundled;
- covers only the purpose in §4, and nothing else;
- can be **withdrawn at any time**, by deleting your account, or by deleting all your data
  from Settings if you want to keep the login;
- when withdrawn, does not make the processing before withdrawal unlawful.

**We keep a record of that consent** — the date, and which version of this policy and of
the Terms you agreed to. We have to: the law puts the burden of showing that you consented
on us, not on you. The record holds no health data, you can see it in Settings and in your
export, it is stored in a table you cannot alter or delete from — so it cannot be
rewritten after the fact — and it is deleted with your account.

**Being straight about what withdrawal means here.** This data is not a side-effect of the
app; it *is* the app. There is no version of FitPulse that keeps showing you your training
history while no longer holding it. So withdrawing consent and deleting the data are the
same action, and we have not invented a middle setting that would pretend otherwise. Both
routes are one tap from Settings, neither asks you for a reason, and neither costs you
anything — which is the standard the GDPR sets for withdrawal being as easy as consenting
(Art. 7(3)). If you would rather we deleted it for you, email us and we will.

<!-- internal:start -->
> **Drafting note — this paragraph is now true; keep it that way.** The sign-up screen has
> a second, separate, never-pre-ticked checkbox for health data, distinct from the one that
> accepts the Terms, and `tests/qa/fuzz.test.mjs` fails if the two are ever merged, either
> pre-ticked, or bypassable in the submit handler. MHMDA defines consent as a "clear
> affirmative act… freely given, specific, informed, opt-in, voluntary and unambiguous" and
> explicitly says it **cannot** be obtained through general terms of use or deceptive
> design. A pre-ticked box, or consent folded into "I agree to the Terms", fails both
> regimes — which is why the guard exists rather than a comment asking nicely.
>
> The open question this paragraph does *not* answer is Art. 7(4): consent is a hard
> precondition of having an account, and Art. 9 has no contract-necessity exception, so a
> regulator could argue it is not freely given. There is no fallback basis if that lands.
> See LEGAL-LIABILITY-AUDIT.md — it is the one item that wants a lawyer, not an edit.
<!-- internal:end -->

Washington residents: see the separate
[Consumer Health Data Privacy Policy](/consumer-health-data-privacy.html), which the My
Health My Data Act requires us to publish and link prominently.

## 4. Why we process it, and on what legal basis

Each purpose gets its own basis. There is no catch-all.

| Purpose | Data used | Legal basis (GDPR) |
| --- | --- | --- |
| Create and authenticate your account | Email, password hash, account ID, session tokens | Art. 6(1)(b) — performance of the contract you entered by signing up |
| Send you password-reset and account-confirmation email | Email address | Art. 6(1)(b) |
| Store, display and sync the workouts and weigh-ins you log; show your history, charts and statistics | Workouts, body weight, preferences, name, gender | Art. 6(1)(b) **and**, because this is health data, Art. 9(2)(a) explicit consent |
| Show your name in the app's greeting | Name | Art. 6(1)(b) |
| Keep the service secure, and detect and fix faults | Server logs; error reports where enabled | Art. 6(1)(f) — our legitimate interest in a working, secure service. We balanced this against your rights: the data is technical, retained briefly, never used to build a profile, and never combined with your training data |
| Comply with a legal obligation (e.g. responding to a lawful request, or notifying a breach) | Whatever the obligation requires | Art. 6(1)(c) |

**We do not process your data for any other purpose.** If that ever changes, we will tell
you about the new purpose **before** it starts (GDPR Art. 13(3)), and where the new
purpose involves your health data we will ask for fresh consent first, as MHMDA requires.

**Is providing this data required?** Your email, password and display name are necessary
to have an account — without them we cannot provide the service. Everything else is
optional; if you don't provide it, the related feature simply shows nothing.

## 5. Storage on your own device

FitPulse keeps a copy of your data in your browser's `localStorage` so the app works
offline and opens instantly. That is the whole of it — we use no other browser storage:
no IndexedDB, no Cache API, no service worker, and one short-lived `sessionStorage`
entry noted at the end of the table. The keys are:

| Key | Where | Contents |
| --- | --- | --- |
| `gym-workouts` | `localStorage` | Your workout history |
| `gym-bw-log` | `localStorage` | Your body-weight log |
| `gym-weekly-goal` | `localStorage` | Your weekly goal |
| `gym-prefs` | `localStorage` | Your preferences, name and gender |
| `gym-active-session` | `localStorage` | Any in-progress workout, so a refresh can't lose it |
| `gym-cache-owner` | `localStorage` | Which account the cached rows belong to |
| `gym-theme`, `gym-theme-vars` | `localStorage` | Your theme choice and its colours |
| `sb-…-auth-token` | `localStorage` | Your sign-in session, set by our authentication provider so you stay signed in |
| `gym-recovery` | `sessionStorage` | A flag set only while you are following a password-reset link, so a page refresh can't drop you past the reset screen. It holds no personal data and your browser discards it when you close the tab |

**This is not tracking, and there are no cookies used for tracking.** None of it is read by
anyone but the app on your own device, and none of it goes to a third party.

Most of the table is "strictly necessary" in the sense the ePrivacy Directive uses — without
your workout cache, your sign-in session, the in-progress workout and the record of which
account the cache belongs to, the offline-capable service you asked for does not work at all.
We would rather be exact than sweeping about the last two rows: your **theme choice and its
colours** are a convenience rather than something the app cannot run without, so calling them
strictly necessary would be stretching the word. We treat them as covered because they store
nothing about you beyond a display preference you set yourself, they are never read by anyone
else, and they are cleared when you sign out — but if you would rather not have them, clearing
your site data removes them and the app works exactly as before, in your system's theme.

We show no consent banner for any of this. We would need your consent, and would ask, before
storing anything on your device for analytics or advertising, and we have no plans to do
either.

**To remove the device copy and nothing else, sign out.** Signing out clears every
`localStorage` key in the table above from that browser — including your theme choice and
its colours, which are resolved from your preferences — and your sign-in session is
removed with them. It leaves your account and its data on the server untouched, so it is
the right control on a shared or borrowed computer. The `sessionStorage` entry is gone as
soon as you close the tab. Your browser's own "clear site data" control does the same
thing.

Settings → **Delete all my data** is a different and much larger action: it erases your
workouts, weigh-ins and settings **on the server as well**, for every device, and it cannot
be undone. We have named the two differently on purpose — an earlier version of this policy
described the second one as a way to clear the device copy, which is exactly the mistake
that would cost somebody their training history.

## 6. Who else can access your data

**Nobody buys, licenses, or receives your data for their own purposes.** The only third
parties involved are the infrastructure providers below, who process it strictly on our
instructions under a written data processing agreement (GDPR Art. 28), and who are
contractually barred from using it for anything else.

| Provider | What they do | What they can access | Country of processing |
| --- | --- | --- | --- |
| **Supabase, Inc.** | Database, authentication, API hosting | All account and app data | **Ireland** (region `eu-west-1`) |
| **GitHub, Inc.** (GitHub Pages) | Serves the app's static files | Request logs including visitor IP addresses, which GitHub also keeps for its own security. Not your app data | **United States**; see §10 |
| **Supabase, Inc.** (built-in email service) | Sends password-reset and confirmation email | Your email address and the message | Not published by the provider for this service. Supabase, Inc. is incorporated in the **United States**; see §10 |
| **Google LLC** (Gmail) | Hosts the mailbox behind our contact address | Only what you choose to put in an email to us. Nothing is sent there by the app, and it holds no copy of your workouts, weigh-ins or account | **United States**; see §10 |

We will also disclose data if we are legally compelled to — a valid court order, warrant,
or equivalent legal process. **We will notify you before complying, unless we are legally
prohibited from doing so.**

If the project is ever transferred to someone else, we will tell you before your data
moves, and you will be able to delete your account first.

**We have never sold or shared personal data, and we will not.** For the avoidance of
doubt under US state law: we do not "sell" personal information, we do not "share" it for
cross-context behavioural advertising, and we do not process sensitive personal
information for any purpose other than providing the service you requested. Because we do
not sell or share, there is nothing for a Global Privacy Control signal to opt out of;
we honour such signals regardless.

## 7. How long we keep it

<!-- internal:start -->
> **Drafting note.** "As long as necessary" is the single most-criticised phrase in
> privacy notices and the ICO has ruled it insufficient. Every row below must name a
> duration or a concrete criterion. The backup line is the one people forget.
<!-- internal:end -->

| Data | Retention |
| --- | --- |
| Account, workouts, weigh-ins, preferences | Until **you** delete them — or until the dormancy rule below removes an abandoned account for you. Deleting your account removes all of it immediately and permanently |
| **Dormant accounts** | **Deleted after 36 months of inactivity**, with a warning email at 24 months telling you the date and that signing in once resets the clock. "Inactivity" means no sign-in, no logged workout, no weigh-in and no settings change in that whole period — using the app in any of those ways keeps the account. We would rather delete data we are no longer being asked to hold than keep your training history forever by default. **The warning is a condition of the deletion:** if it was not actually sent to you, the account is not deleted — the 12-month clock starts when you are told, not when the account went quiet |
| Account deletion | Deleting your account cascades to every workout, weigh-in and settings row at the database level. It is immediate and cannot be undone |
| Consent and Terms-acceptance record (dates and version numbers; no health data) | For as long as we process your data on the basis of that consent, and afterwards only for as long as we might need to show that it was given. Deleting your account deletes it too |
| Device cache (`localStorage`) | Until you sign out, delete all your data, or clear your browser storage. It stays on that device only, and only that device — we cannot erase it remotely |
| Database and API request logs (incl. IP) | **1 day.** Our database provider retains request logs for 24 hours on our plan, after which they are deleted automatically. If we move to a paid plan this becomes longer and we will update this row |
| Static-host request logs (incl. IP) | **Set by GitHub, not us.** GitHub logs a visitor's IP address when a GitHub Pages site is viewed, for its own security, and does not publish a retention period for these logs. They are GitHub's records, not ours — we cannot read, export or delete them, and they contain no workout, weigh-in or account data |
| Email you send to our contact address, and our replies | **24 months** from the last message in the thread, then deleted from the mailbox and its trash. We keep it only to handle your request and to show we handled it. **Deleting your account does not delete this** — ask us and we will delete the thread as well |
| **Sign-in security log** (incl. IP and the email address used) | **90 days.** Our authentication provider keeps this separately from your account and does not expire it on its own, so **we purge it ourselves** on that schedule. It is the one record that **survives deleting your account**: we do not consult it about a deleted account and never use it to reconstruct one. Legal basis: Art. 6(1)(f), our legitimate interest in detecting credential-stuffing and abuse of the sign-in endpoint |
| Session tokens | Until they expire or you sign out, whichever is first. Signing out revokes the token and removes it from your device; a token left idle expires on our authentication provider's own schedule and cannot be used afterwards |
| Error reports | **Not applicable.** Error reporting is disabled, so no error reports are created or stored |
| Automated platform backups | **None.** Our database plan includes no automated backups, so no backup copy of the database exists |
| **Manual JSON backups** | **None.** The project ships a backup script, but we do not run it against the live database. No copy of your data exists outside it |

**We hold no backups, so deletion is final at the moment you make it.** There is no second
copy of your data in our systems for a deleted account to survive in, and no restore path
that could bring it back. That cuts both ways, and we would rather say so than let you find
out later: if you delete something by mistake, or if our database provider loses data, we
cannot recover it for you. This is why the app gives you an export you can keep yourself
(Settings → Data → Export backup), and why the [Terms §11](/terms.html) put the responsibility for
keeping your own copy with you. The same statement is in the
[account deletion page](/delete-account.html) and in
[Consumer Health Data Privacy §7](/consumer-health-data-privacy.html) — one practice
described once, not three promises that could drift apart.

## 8. Security

Concrete measures, not adjectives:

- All traffic between your device and our servers uses **HTTPS/TLS**.
- Every database table enforces **row-level security**: a policy in the database itself
  restricts every read and write to rows whose owner matches the signed-in account ID.
  This is enforced by the database, not by app code, so an application bug cannot expose
  another user's rows.
- Passwords are stored only as **salted hashes** by our authentication provider. We
  cannot see your password.
- **Changing your password requires your current password.**
- New passwords must be **at least 10 characters**. We ask for length rather than a mix of
  symbols and digits, because length is what actually resists guessing and composition
  rules mostly produce predictable passwords.
- Data is **encrypted at rest** by our database provider.
- Access to production data is restricted to **one person — the sole operator of the
  service** — through the database provider's administrative console. We have no
  employees or contractors, so no one else on our side has access. Our database provider's
  own personnel can technically access the infrastructure your data sits on; that access is
  governed by their security programme and by the data processing agreement in §6, which
  bars them from using your data for their own purposes. We state this because no hosted
  service can honestly claim otherwise, and a policy that implied it would be false.
- **The app itself holds no credential that could reach anyone else's rows.** The key
  shipped in the browser is the provider's public key, and every read and write made with
  it is constrained by the row-level security above. The one key that can bypass those
  rules is never in the app, never in the published files, and is used only by an offline
  script on the operator's own machine. (This is the same statement as
  [Consumer Health Data Privacy §8](/consumer-health-data-privacy.html) — one fact, worded
  once.)

No system is perfectly secure, and we don't claim otherwise. We do not use the phrases
"military-grade", "industry-standard" or "bank-level" here on purpose: they mean nothing
and regulators treat them as deceptive.

**If a breach happens,** we will:

- notify the relevant supervisory authority within **72 hours** of becoming aware, where
  the breach is likely to result in a risk to you (GDPR Art. 33);
- notify **you directly, without undue delay**, where the breach is likely to result in a
  high risk to your rights (GDPR Art. 34);
- notify **you and the FTC within 60 calendar days**, and prominent media if 500+ people
  in one jurisdiction are affected, as the FTC's Health Breach Notification Rule requires
  of health apps that are not covered by HIPAA.

<!-- internal:start -->
> **Drafting note.** The FTC amended the Health Breach Notification Rule in 2024 to cover
> exactly this kind of app, and its definition of a "breach" includes **unauthorised
> disclosure — including the operator voluntarily sharing data without consent.** That is
> how the FTC reached GoodRx and BetterHelp. If you ever add an analytics or ad SDK to a
> health app without explicit consent, that is not a policy update; it is a reportable
> breach.
<!-- internal:end -->

## 9. Your rights

Rights vary by where you live; we apply the strongest to everyone where we practically
can.

### Everyone

| Right | How to use it |
| --- | --- |
| **Access** a copy of your data | Settings → Data → **Export backup** gives you a JSON file, immediately. It contains your workouts, your body-weight log, your weekly goal, your preferences (name and gender included), and your account details — the email address, the account creation date, and your consent and Terms-acceptance record. That is everything the app stores about you. It does not include the infrastructure logs in §2.2 — the request logs and IP addresses our providers keep for the short periods in §7, and the sign-in timestamps our authentication provider records — which are technical records held by our providers rather than app data. Email us and we will get you what those contain |
| **Portability** — get it in a machine-readable format | The same export. It is plain JSON today, and [Terms § 11.2](/terms.html) commits us to keeping it documented, machine-readable, non-proprietary and readable without FitPulse if the format ever changes |
| **Correct** anything wrong | Edit it in the app — history entries, weigh-ins, name, preferences are all editable. To change the email address your account uses, Settings → **Change email**; we send a confirmation link to both the old and the new address, so a mistyped address cannot lock you out |
| **Delete** everything, including the account | Settings → **Delete account**. Immediate, irreversible, and cascades to every row |
| **Delete** your data but keep the account | Settings → **Delete all my data**. Erases workouts, weigh-ins and settings on the server and on this device; the login survives |
| **Delete the device copy only** | **Sign out**, or use your browser's "clear site data" control. Your account is untouched |

### If you are in the EEA or UK

You additionally have the right to **restrict** processing, to **object** to processing
based on legitimate interests, to **withdraw consent** at any time, and to **not be
subject to automated decision-making** (we don't do any). You have the right to **lodge a
complaint with a supervisory authority** — the **Data State Inspectorate** (Datu valsts inspekcija), Latvia, https://www.dvi.gov.lv, or the authority in your own country of residence.

We respond within **one month**, extendable by two further months for complex requests,
in which case we will tell you within the first month.

### If you are in California

You have the right to **know** what we collect, use and disclose; to **delete**; to
**correct**; to **opt out of sale or sharing** (we do neither); to **limit the use of
sensitive personal information** (we already use it only to provide the service you
asked for, which is a permitted purpose); and to **not be discriminated against** for
exercising any of these. We do not offer financial incentives for data. In the preceding
12 months we collected the categories in §2, from you, for the
purposes in §4, and disclosed them only
to the service providers in §6. We sold or shared
nothing. FitPulse is for adults: we do not knowingly collect the personal information of
anyone under 18, and we sell no one's at any age (see §11).

We respond within **45 days**, extendable once by a further 45 days with notice. You may
use an authorised agent; we will ask them for written proof of authority and ask you to
verify it. We verify requests by requiring you to act from the signed-in account or the
registered email address — we don't ask for ID documents.

### If you are in Washington State

See the [Consumer Health Data Privacy Policy](/consumer-health-data-privacy.html). You have
the right to confirm whether we collect your consumer health data and access it including
a list of third parties it was shared with, to withdraw consent, and to have it deleted
from all of our records including backups. We respond within **45 days**, extendable by
45, and if we refuse a request you may **appeal**, which we answer in writing within 45
days; if the appeal is denied you may complain to the Washington Attorney General.

### If you are elsewhere in the US

Virginia, Colorado, Connecticut, Texas, Oregon and the other states with comprehensive
privacy laws grant substantially the same rights — access, correction, deletion,
portability, opt-out of targeted advertising and sale, and opt-in consent before
sensitive data is processed. Use the same mechanisms above; we apply them regardless of
where you live.

**To make any request:** use the in-app buttons, or email **smalkaisk@gmail.com**.
Requests are free. We will not ask you to create an account to make one.

## 10. International transfers

**Your account, workouts, weigh-ins and preferences are stored and processed in Ireland**,
in our database provider's `eu-west-1` region. Ireland is in the European Economic Area, so
this data is not transferred outside the EEA, and no separate transfer mechanism is needed
for it.

Two narrower points, stated rather than glossed over:

- **Password-reset and confirmation email** is sent by our database provider's built-in
  email service. It carries your email address and the message text — never your workouts
  or weights. Our provider does not publish the region its shared email infrastructure
  runs in, and it is a United States company, so we treat this as a transfer outside the
  EEA. It is covered by the **Standard Contractual Clauses** approved by the European
  Commission, which form part of our provider's data processing agreement. We will send
  you a copy on request. This concerns your email address only — never your health data,
  which stays in Ireland as described above.

<!-- internal:start -->
> **Action before launch.** Download Supabase's Data Processing Addendum, confirm it
> incorporates the SCCs, and keep a copy — the sentence above promises one on request, and
> § 6 states that every processor operates under a written Art. 28 agreement. Neither claim
> is safe until you hold the document.
<!-- internal:end -->
- **Email you send us.** Our contact address is a Gmail mailbox, so Google LLC — a United
  States company — processes any message you send us, including anything you choose to put
  in it. Transfers are covered by the EU–US Data Privacy Framework and by the Standard
  Contractual Clauses in Google's terms. Nothing is sent there by the app: this concerns
  only correspondence you start. If you would rather not route a privacy request through
  Google, say so in a first message with no details in it and we will arrange another way.
- **Static hosting.** The app's files are served by **GitHub Pages**, operated by **GitHub,
  Inc.** in the **United States**. Because that is outside the EEA, the transfer relies on
  GitHub's self-certification under the **EU–US Data Privacy Framework** and on the
  **Standard Contractual Clauses** incorporated into GitHub's Data Protection Agreement. The
  host serves the app's files and sees request logs including IP addresses; it never holds
  your rows.

**For UK users**, the same storage applies. Transfers from the UK to Ireland are covered by
the UK's adequacy regulations for the EEA, so no additional safeguard is required.

## 11. Children

FitPulse is not intended for anyone under **18**, and the Terms of Service set the same
floor (§4.1) — creating an account requires confirming you are 18 or older. We do
not knowingly collect data from children. If you believe a child has created an account,
email **smalkaisk@gmail.com** and we will delete it and its data promptly. We do
not serve ads and have no third-party analytics, so nothing about a child's data would be
transmitted anywhere even in that case.

## 12. Changes to this policy

We keep a version number and effective date at the top, and every previous version is kept
in the project's Git history. Email us and we will send you any earlier version.

**The version number moves whenever the text does.** This sounds obvious and is easy to get
wrong: version 1.0 was edited after publication to add a new recipient — Google, for the
mailbox behind our contact address — while the header still said 1.0. Nobody was affected,
because the app had no users yet, but a version number that stays still while the text
changes cannot tell you what you agreed to, which is the only thing it is for. So the rule
is now explicit: the version, the effective date, and the copy of the version number the app
records against your account all change in the same edit as the words.

- **Minor corrections** (typos, clearer wording, a new address) take effect on posting.
- **Material changes** — a new purpose, a new recipient, a new data type, a longer
  retention period — will be announced **in advance**, with a plain summary of what changed,
  before they take effect. The announcement appears **in the app**, which is the route we can
  always perform, **and by email** to your registered address where we are able to send one.
  Where the change needs your consent, we ask for it in the app, so a message that never
  reached you cannot cost you the chance to consider it.
- Where a change affects your **health data** — a new category, a new purpose, or a new
  recipient — we will obtain your **affirmative consent first**, as the My Health My Data
  Act requires. We will not apply a change to health data collected under an earlier
  version of this policy without asking you.
- We review this policy at least **once every 12 months** even if nothing has changed,
  and update the "last reviewed" date above.

We will never make a material change quietly and rely on your continued use as consent.
This is enforced by the app, not only promised here: every version of this policy and of
the Terms carries a number, your acceptance is recorded against the numbers you actually
agreed to, and when a newer version comes into force the app stops at a screen asking you
to read it and confirm — with the health-data consent as its own separate tick, exactly as
at sign-up — before you go any further.

## 13. Contact

- **Privacy questions and requests:** **smalkaisk@gmail.com**
- **Postal:** Klusa Street 2a, Riga, LV-1007, Latvia
- **Supervisory authority (EEA/UK):** the **Data State Inspectorate** (Datu valsts inspekcija), Latvia, https://www.dvi.gov.lv
- **Washington Attorney General (MHMDA complaints):** https://www.atg.wa.gov/file-complaint

We aim to answer every message within **10 working days**, and in every case within the
statutory deadlines set out in §9.

---

*End of Privacy Policy, version 1.1.*
