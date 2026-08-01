# How to write a good privacy policy for an app

Research notes (August 2026) plus a FitPulse-specific application. Sources are linked
inline; the authoritative ones are the regulator/store pages, the rest are commentary.

**Nothing here is legal advice.** A privacy policy is a legal promise you can be sued or
fined over, and the failure mode that matters most is *describing practices you don't
actually have*. If real users other than you sign up, get it reviewed.

---

## 0. The one rule everything else hangs off

A privacy policy is not a document you write. It is a **description of a data map you
already made**. Write the map first — every field you store, where it lives, who else
touches it, how long it stays, how it gets deleted — and the policy falls out of it.

Policies written the other way round (start from a template, fill blanks) are how you
end up with the two classic failures:

- **Saying more than you do.** A template that mentions "advertising partners" or
  "industry-standard encryption" you don't have is an FTC Section 5 deception claim on a
  plate. Regulators have brought cases on the *security* language in privacy notices
  specifically, because it's the sentence everyone copies without checking
  ([VeraSafe on FTC enforcement](https://verasafe.com/blog/ftc-enforcement-lessons-security-language-privacy-notices/)).
- **Saying less than you do.** Omission, not misstatement, is the dominant violation
  pattern under GDPR — the ICO's WhatsApp decision turned on generic statements about
  lawful bases, recipients, transfers and retention being *insufficiently specific*, not
  on anything being false
  ([Lexology analysis](https://www.lexology.com/library/detail.aspx?g=1bae4ac7-0eee-4b3b-a8c0-5c53b03124cc)).

---

## 1. Scope: work out which rules bind you

Do this before writing a word. Each regime adds required content.

| Regime | Triggers when | Adds |
| --- | --- | --- |
| **GDPR / UK GDPR** | You offer the app to people in the EU/UK (free counts; open signup counts) | The 14-item Art. 13 list, §2 below |
| **CCPA/CPRA (California)** | Business thresholds (revenue/volume) — most hobby apps fall *under*, but the notice format is a good baseline | Categories, sources, retention, rights, §3 |
| **Other US state laws** (VA, CO, CT, TX, OR, …) | Similar thresholds | Near-identical content to CCPA; one policy usually covers all |
| **Washington My Health My Data Act** | *Any* business collecting "consumer health data" from Washington consumers — **no revenue threshold** | A **separate**, separately-linked consumer health data policy, §4 |
| **COPPA / GDPR Art. 8** | Under-13 (US) / under-16ish (EU) users | Parental consent, no behavioural ads |
| **Apple App Store** | You ship on iOS | Guideline 5.1.1 content + in-app link + in-app account deletion, §5 |
| **Google Play** | You ship on Android | User Data policy content + Data safety form that *matches*, §5 |

Two scoping traps for a personal project:

- **The GDPR "household exemption" evaporates on open signup.** Processing purely for
  personal/household activity is out of scope — but the moment anyone who isn't you or
  your family can create an account, you are a controller with full obligations.
- **MHMDA has no size threshold.** It applies to a one-person fitness app that has a
  single Washington user, and its definition of consumer health data reaches "bodily
  functions, vital signs, … measurements", fitness and nutrition data, and anything used
  to *infer* those ([Stoel Rives FAQ](https://www.stoel.com/insights/publications/faq-washington-states-my-health-my-data-act),
  [California Lawyers Association](https://calawyers.org/privacy-law/the-washington-my-health-my-data-act-not-just-washington-or-health/)).

---

## 2. GDPR Art. 13 — the mandatory content list

If you collect data directly from the user (as opposed to buying it), Article 13 is the
checklist. All of it, at or before the moment of collection, in "concise, transparent,
intelligible and easily accessible form, using clear and plain language" (Art. 12).

**Art. 13(1):**

1. **(a)** Identity and contact details of the controller (and its representative, if it
   has one — non-EU controllers targeting the EU generally need an Art. 27 representative).
2. **(b)** Contact details of the Data Protection Officer, where one is required.
3. **(c)** The **purposes** of processing **and the legal basis** for each.
4. **(d)** If the basis is legitimate interests — **what those interests are**.
5. **(e)** The **recipients** or categories of recipients.
6. **(f)** Any intent to transfer to a third country or international organisation, whether
   an **adequacy decision** exists, and if not, which **safeguards** (SCCs, etc.) apply and
   how to get a copy of them.

**Art. 13(2):**

7. **(a)** **Retention period**, or the criteria used to determine it.
8. **(b)** The rights: **access, rectification, erasure, restriction, objection, portability**.
9. **(c)** If based on consent — the right to **withdraw consent at any time**, without
   affecting the lawfulness of processing before withdrawal.
10. **(d)** The right to **lodge a complaint with a supervisory authority**.
11. **(e)** Whether providing the data is a **statutory or contractual requirement** or
    necessary to enter a contract, whether the user is obliged to provide it, and the
    **consequences of not providing it**.
12. **(f)** Any **automated decision-making including profiling**, with meaningful
    information about the logic and the significance/consequences for the user.

**Art. 13(3):** if you later process for a *new* purpose, give the information about that
purpose **before** you start. **Art. 13(4):** the duty falls away only insofar as the user
already has the information.

Specificity notes from ICO enforcement:

- **Name the third countries** you transfer to, not "outside the EEA".
- **Map legal basis to purpose individually.** One bucket list of bases for a bucket list
  of purposes is what got marked non-compliant.
- **"As long as necessary" is not a retention period.** Give a duration or a real criterion
  ("until you delete the account, then X days in backups").

Where explicit consent is your Art. 9 basis (health data — see §4), it must be a specific
affirmative act referencing the sensitive data; it can't be bundled into "I accept the
terms" ([Secure Privacy on Art. 9](https://secureprivacy.ai/blog/gdpr-article-9-special-categories-lawful-processing-and-compliance-guide-2026)).

---

## 3. CCPA/CPRA content (a good baseline even if you're under threshold)

- Categories of personal information collected, **including sensitive PI**, over the last
  12 months.
- **Categories of sources.**
- **Business/commercial purposes** for collecting, selling, sharing.
- **Categories of third parties** it's disclosed to.
- **Retention period per category** (or criteria).
- Whether you **sell** or **share** (share = cross-context behavioural advertising) — with a
  **"Do Not Sell or Share My Personal Information"** link if you do, and a **"Limit the Use of
  My Sensitive Personal Information"** link if applicable.
- The rights — **know/access, delete, correct, opt out of sale/share, limit SPI use,
  non-discrimination** — and at least two methods to exercise them (online-only businesses
  may offer email alone).
- **Reviewed and dated at least every 12 months.**

Separately, a **notice at collection** must appear *at or before* the point of collection —
in an app, that means at signup, not buried three taps deep
([CPPA guidance PDF](https://cppa.ca.gov/pdf/general_notices.pdf),
[Bloomberg Law overview](https://pro.bloomberglaw.com/insights/privacy/what-is-a-ccpa-privacy-policy-do-you-need-one/)).

---

## 4. If your app touches health or fitness data — read this twice

A gym tracker is a health app whether or not it feels like one.

**GDPR:** data revealing physical health is **Art. 9 special category**. Body weight,
training load, injury notes and gender all qualify or come very close. Art. 9 processing
needs one of the Art. 9(2) conditions on top of your Art. 6 basis — for a consumer fitness
app that is realistically **explicit consent**, which must be granular, affirmative, and
withdrawable. The EDPB's position is that **context decides**: the same number means
different things in a casual tracker and a clinical monitor
([GDPRhub Art. 9](https://gdprhub.eu/Article_9_GDPR)).

**Washington MHMDA** — the one people miss. If any Washington consumer uses your app:

- Publish a **separate consumer health data privacy policy**, with a **prominent link on
  your homepage** (a link to your general privacy policy is explicitly not enough).
- It must state: the **categories** of consumer health data collected, the **purposes**, the
  **sources**, the categories **shared**, and the **categories of third parties and specific
  affiliates** you share with.
- **Collection beyond what's necessary for a requested service requires consent; sharing
  requires a separate signed authorization.**
- **New categories or new purposes require fresh consent**, disclosed before the change.
- It carries a **private right of action** — this is the enforcement risk, not a regulator
  queue ([Accountable HQ compliance guide](https://www.accountablehq.com/post/washington-health-data-protection-requirements-how-to-comply-with-the-my-health-my-data-act),
  [Censinet](https://www.censinet.com/perspectives/washington-my-health-my-data-act-key-requirements)).

**Apple 5.1.3:** health and fitness data may not be used or disclosed "for advertising,
marketing, or other use-based data mining purposes", and you must disclose the specific
health data you collect. HealthKit data may not be stored in iCloud
([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)).

---

## 5. App store requirements (these gate your release, so they bind hardest)

**Apple, Guideline 5.1.1(i)** — the policy must be linked in App Store Connect **and**
accessible in-app, and must:

- "Identify what data, if any, the app/service collects, how it collects that data, and all
  uses of that data."
- Confirm every third party you share with — analytics, ad networks, SDKs, affiliates —
  provides **equal protection** to what your policy promises.
- "Explain its data retention/deletion policies and describe how a user can revoke consent
  and/or request deletion of the user's data."

Plus, from the same section: **if your app supports account creation, it must offer account
deletion in-app** (5.1.1(v)); consent is required even for anonymous usage data, with an
"easily accessible and understandable way to withdraw consent" (5.1.1(ii)); and only
collect what the core feature needs (5.1.1(iii)).

**Google Play User Data policy** — the privacy policy must be at an "active, publicly
accessible and non-geofenced URL (no PDFs)", non-editable, **labelled "privacy policy"**, and
linked both in Play Console **and** in the app. It must cover:

- Developer identity and a **privacy point of contact** or inquiry mechanism.
- Types of personal and sensitive data accessed, collected, used, shared — **and the parties
  shared with**.
- **Secure data handling** procedures.
- **Data retention and deletion** approach.

And critically: the **Data safety form must match the policy**, the policy is not limited to
what the form covers, and mismatches get apps removed. The July 2026 policy round also
extends User Data obligations explicitly to **third-party AI integrations**
([User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311),
[Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469),
[July 2026 announcement](https://support.google.com/googleplay/android-developer/answer/17134731)).

Apple's Privacy Nutrition Labels are the same deal on the other store: label, policy and
reality all have to agree.

---

## 6. How to actually write it well

**Structure — the layered notice.** Regulators favour it and users read it. Top layer: a
short "what we collect, why, who sees it, how to delete it" summary or table. Second layer:
the full detail, in named sections. This is not a shortcut around completeness; it's
completeness plus an entry point.

A section order that works:

1. Who we are / how to contact us
2. Summary table — data type → purpose → legal basis → retention
3. What we collect (split: you give us / we generate / your device)
4. Why, and on what legal basis
5. Who we share it with (**named** processors, not "trusted partners")
6. Where it's stored and any international transfers (**named countries**)
7. How long we keep it — **including backups**
8. Your rights, and the exact button/email that exercises each
9. Security
10. Children
11. Changes to this policy
12. Region-specific annexes (EEA/UK, California, Washington)

**Language rules:**

- Plain words, second person. "We store your workouts on our server in Germany" beats
  "user-generated content may be persisted to controller-designated infrastructure."
- **Ban "may".** "We may share your data with third parties" is the single most-criticised
  sentence in privacy writing — it discloses nothing and reads as reserving the right to do
  anything. Say what you *do*. If a practice is conditional, name the condition.
- Ban "industry-standard", "state-of-the-art", "commercially reasonable efforts" as
  security claims unless you can evidence them.
- Never use "anonymous" for data you can re-identify — use "pseudonymous" and explain.
- No dark patterns adjacent to the policy: pre-ticked consent, "Accept" styled loud and
  "Decline" styled quiet, or consent bundled with terms acceptance. The FTC treats
  deceptive design as a standalone Section 5 category
  ([FTC dark patterns report](https://www.ftc.gov/system/files/ftc_gov/pdf/P214800+Dark+Patterns+Report+9.14.2022+-+FINAL.pdf)).

**Mobile format:** short scannable sections, generous spacing, no horizontal scroll,
important things early, accordions for the long bits
([Usercentrics app policy guide](https://usercentrics.com/guides/privacy-policy/app-privacy-policy/)).

**App-specific things web templates omit:** device permissions and *why each is requested*,
advertising identifiers, every third-party SDK, push notifications, wearable/HealthKit
integrations, offline/local storage on the device, and which fields are optional vs required.

**Maintenance:**

- Effective date + version at the top; keep an archive of old versions.
- Review annually (CCPA *requires* 12-monthly) and on every change to data practices, new
  vendor, or new law.
- **Material changes need active notice** — in-app banner or email — not a silent edit.
  Under MHMDA, new categories or purposes need fresh consent *before* the change.
- Re-run the store forms (Data safety / Nutrition Labels) in the same commit as the policy
  change, or they drift.

---

## 7. Common mistakes checklist

- [ ] Copied a template describing vendors/ads/cookies you don't have
- [ ] "We may share…" instead of naming actual recipients
- [ ] Retention stated as "as long as necessary" with no duration or criterion
- [ ] Backups not mentioned in retention (deleting the row doesn't delete the backup)
- [ ] Legal bases listed as a block instead of mapped per purpose
- [ ] Transfers described as "outside the EEA" without naming countries or safeguards
- [ ] Health data treated as ordinary personal data (no Art. 9 basis, no MHMDA policy)
- [ ] No in-app link to the policy (store violation on both platforms)
- [ ] Data safety form / nutrition label doesn't match the policy text
- [ ] No in-app account deletion despite offering account creation (Apple 5.1.1(v))
- [ ] Rights listed with no working mechanism to exercise them
- [ ] No contact address for privacy questions
- [ ] Analytics/error-reporting SDK omitted because "it's just crash logs"
- [ ] Policy behind a PDF, a login, or a geofence (Google Play violation)

---

## 8. Applied to FitPulse

What the map actually looks like, from the code. Use this as the input to the sections above.

**Data collected:**

| Data | Where from | Stored |
| --- | --- | --- |
| Email address, password | Supabase Auth signup | `auth.users` (password hashed) |
| Display name (required), gender (optional), units, theme, split, day names | Onboarding + Settings | `settings.prefs` JSONB |
| Weekly workout goal | Settings | `settings.weekly_goal` |
| Workouts: type, date, duration, notes, exercises/sets/reps/weight | User entry | `workouts` |
| Body weight log with dates | User entry | `body_weight_log` |
| Cached copies of all of the above | Derived | Browser `localStorage` on the device |
| Error reports (stack traces + context) | Automatic — **only if `VITE_SENTRY_DSN` is set** | Sentry |

**The health-data point:** body weight, gender and training history are health-related.
That means an Art. 9 basis (realistically explicit consent at signup, separate from terms
acceptance) and — if any Washington user exists — a **separate consumer health data policy
linked from the homepage**. This is the largest single gap between "a personal project" and
"a thing strangers can sign up for", and open signup is already live.

**Recipients to name (not "partners"):**

- **Supabase** — database, auth, hosting of the API. Name the **project region**; if it's
  US and users are in the EEA/UK, that's a third-country transfer needing SCCs disclosed
  under Art. 13(1)(f).
- **The auth email sender** — Supabase's default SMTP or your custom provider. It sees email
  addresses. Password-reset and confirmation mail is a disclosure.
- **Your static host / CDN** — serves the app and keeps request logs (IP addresses).
- **Sentry** — *only when a DSN is configured*. The policy must describe the **deployed**
  configuration, not the default-off code path. If you ship with a DSN, Sentry is a
  processor that receives error context and IPs, and it must be listed. If you ship without
  one, say error reporting is disabled and update the policy the day that changes.

**Things FitPulse can truthfully say, and should say loudly** — they're the best part of the
policy and most apps can't claim them:

- No advertising, no ad SDKs, no advertising identifiers.
- No analytics or behavioural tracking; no cross-context sharing; nothing is sold.
- No location, camera, microphone, contacts or health-kit permissions requested.
- Every table is RLS-scoped to `auth.uid()`, so rows are readable only by their owner.
- Local storage is a **strictly necessary offline cache** for the service the user asked
  for — worth stating explicitly, because that's exactly the ePrivacy exemption that means
  no consent banner is needed for it (an analytics cookie would not be exempt).

**Rights — you already have the mechanisms; point at them by name:**

- **Erasure:** Settings → delete account, which calls `public.delete_account()`; the
  `on delete cascade` FKs wipe workouts, weigh-ins and settings. Also state that
  `clearLocalCache()` clears the device copy.
- **Portability/access:** the in-app JSON export.
- **Rectification:** in-app editing of history and settings.
- **Withdrawal of consent:** deleting the account, plus the ability to stop.

**Retention — the honest version:**

- Rows persist until the user deletes them or deletes the account (immediate cascade).
- **`npm run backup` produces logical JSON backups of all three tables.** If you run it,
  those files contain other people's health data and must appear in the retention section
  with a stated lifetime and storage location. This is the disclosure most likely to be
  forgotten, because the backup lives on your laptop, not in the app.
- Supabase's own platform backups (PITR/daily) have their own retention — state it.

**Contact point:** Google Play requires a privacy contact. A personal project needs a real,
monitored address; the account email used for the project is fine, but it has to be in the
document.

**If it stays a private, single-user project:** the household exemption may cover you and
none of this bites. The trigger is other people having accounts — that's the line to watch,
and open signup means it's already been crossed unless the project is otherwise gated.

---

# Part II — closing the loopholes

Everything above gets you a *compliant* policy. This part is about making it *airtight*,
which is a different and narrower goal.

## 9. What "airtight" actually means

The instinct is that an airtight policy is one drafted so broadly that you're allowed to do
anything. **That is exactly backwards, and it is the thing that gets apps sued.** Three
reasons:

1. **A privacy policy is a promise, not a permission slip.** Broad language ("we may share
   data with partners to improve our services") doesn't grant you the right to share — under
   GDPR you still need a lawful basis, and under MHMDA you still need separate consent. All
   the broad clause does is create a *second* liability: the FTC treats a vague disclosure
   that hides a real practice as a deceptive act in its own right, independent of whether
   the practice was legal.
2. **A policy cannot waive statutory rights.** "By using the app you consent to all
   processing described herein" is unenforceable against GDPR consent requirements and
   explicitly void under MHMDA, which says consent "may not be obtained by… a consumer's
   agreement to general terms of use."
3. **Loopholes cut against you, not for you.** Every undefined term ("partners",
   "affiliates", "as needed", "from time to time") is read against the drafter and is the
   first thing a regulator or plaintiff's lawyer quotes.

So the airtight version is the **narrow, specific, exhaustively enumerated** one. Concretely:

| Instead of | Write |
| --- | --- |
| "third parties", "partners", "affiliates" | Named companies, in a table, with country and role |
| "we may share" | "We share X with Y for Z" — or "We do not share" |
| "as long as necessary" | "Until you delete it", "30 days", "7 days of automated backups" |
| "for business purposes" | The actual purpose. WP260 calls "for business purposes" a failing example by name |
| "we use industry-standard security" | The actual controls: TLS, row-level security, salted hashes, MFA on admin |
| "outside the EEA" | "United States (Supabase, us-east-1), under the EU Standard Contractual Clauses" |
| "we may update this policy at any time" | The change process, with advance notice and re-consent for health data |
| "anonymous data" (for data you can re-identify) | "Pseudonymous — linked to your account ID" |

**Write "no" in the negative form and mean it.** "We do not sell your data" is worth more
than ten paragraphs of qualified language, and it's the sentence users actually read. It
also converts a vague risk into a bright line you can hold yourself to.

## 10. GDPR precision requirements (WP260)

The Article 29 Working Party's transparency guidelines — [WP260 rev.01](https://www.edpb.europa.eu/system/files/2023-09/wp260rev01_en.pdf),
endorsed by the EDPB and still the operative interpretation — set the standard for *how
specific* Art. 13 information must be:

- **Purposes:** concrete. "To prevent fraud" passes; "for business purposes" is given as a
  failing example.
- **Legal bases:** identified **per processing activity**, not as a block list. You must be
  able to point at any one purpose and name its basis.
- **Legitimate interests:** must be spelled out, with the balancing test reasoning
  summarised. Boilerplate fails.
- **Recipients:** actual categories with an explanation of *why* each needs the data;
  internal vs external distinguished.
- **Retention:** a concrete timeframe, or a genuinely determinable criterion. Indefinite
  language needs objective justification.
- **Layering:** for online services WP260 *recommends* a layered notice. The first layer
  must carry purposes, controller identity, and rights — and, per the fairness principle,
  **anything about the processing that would surprise the user or seriously affect them**.
  That last item is the one people skip; it's why a health app should say "this is health
  data" in the summary, not on page four.
- **Changes:** users must be told about material changes **proactively and in good time
  before they take effect**, with the changes highlighted. A silent edit to a live page is
  a transparency failure regardless of what the "we may update this" clause says.

## 11. The two regimes that catch fitness apps by surprise

### 11.1 The FTC Health Breach Notification Rule

Amended April 2024, effective 29 July 2024, and it is aimed squarely at apps like this one.

- **Coverage:** apps "sold, marketed, or promoted as more than tangentially related to
  health" are vendors of personal health records. Fitness trackers are named explicitly
  ([FTC final rule](https://www.ftc.gov/news-events/news/press-releases/2024/04/ftc-finalizes-changes-health-breach-notification-rule),
  [Federal Register text](https://www.federalregister.gov/documents/2024/05/30/2024-10855/health-breach-notification-rule)).
- **The trap:** a "breach of security" is not limited to hacking. It includes
  **unauthorised disclosure — including the company voluntarily sharing data without the
  consumer's consent**, and using data for a secondary purpose beyond what was authorised
  ([Orrick summary](https://www.orrick.com/en/Insights/2024/07/FTC-Health-Breach-Notification-Rule-Update-6-Things-You-Should-Know)).
  Bolting an analytics or ad SDK onto a health app without explicit consent is therefore a
  **reportable breach**, not a policy update. That is the theory the FTC used against GoodRx
  and BetterHelp.
- **Obligations:** notify affected individuals **and the FTC within 60 calendar days** of
  discovery; prominent media too if 500+ people in one jurisdiction. The notice must state
  what happened, when, what data, which third parties were involved, what the consumer
  should do, what you're doing about it, and give **at least two** contact methods.

**Design consequence:** never add a third-party SDK to this app without a fresh, explicit,
unbundled consent step. The policy language protecting you is the sentence saying you don't
do it.

### 11.2 Washington MHMDA, at statutory precision

From [RCW 19.373](https://app.leg.wa.gov/RCW/default.aspx?cite=19.373&full=true):

- **§ .020** — the consumer health data privacy policy must be **separate** and
  **prominently linked on the homepage**, and must list categories collected, purposes and
  specific uses, sources, categories shared, **the categories of third parties *and specific
  affiliates*** receiving it, and how to exercise rights. Affiliates get named individually.
- **§ .020 also contains an operational prohibition**, not just a notice duty: you "may not
  collect, use, or share additional categories of consumer health data not disclosed in the
  consumer health data privacy policy without first disclosing the additional categories and
  obtaining the consumer's affirmative consent." **Your published policy is a cap on what
  you're allowed to do.**
- **§ .030** — collection needs consent *or* necessity for a requested service. **Sharing
  needs a separate, distinct consent.** The consent request must disclose categories,
  purpose and specific uses, recipient categories, and withdrawal method.
- **§ .010** — consent is a "clear affirmative act… freely given, specific, informed,
  opt-in, voluntary, and unambiguous", and **cannot** come from general terms of use,
  hovering/muting, or deceptive design.
- **§ .040** — rights to confirm/access (including the list of third parties shared with),
  withdraw consent, and delete **"including from all parts of the network, including
  archived or backup systems"**. 45 days, one 45-day extension, and a **written appeal
  process** with its own 45-day clock plus an AG complaint link on denial. You may not
  require account creation to make a request.
- **§ .050** — selling requires a signed authorization with prescribed contents and a
  one-year expiry. Practical answer: don't sell.
- **§ .090** — enforced via the Consumer Protection Act, i.e. **private right of action**.

## 12. The obligations a policy *describes* but cannot *create*

An airtight policy is only airtight if the things it asserts are actually built. These are
the ones that need engineering or paperwork, not prose:

| Claim in the policy | What must exist |
| --- | --- |
| "We process health data on your explicit consent" | A **separate, unticked consent control at sign-up**, distinct from accepting Terms, recorded with a timestamp. Without it the Art. 9 basis is missing and the sentence is false |
| "Our providers process only on our instructions" | A signed **DPA under GDPR Art. 28** with each one. Supabase publishes one at [supabase.com/legal/dpa](https://supabase.com/legal/dpa); Sentry and your host have their own. You must actually accept them, and keep the subprocessor lists |
| "We transfer data under Standard Contractual Clauses" | The SCCs must be in force (they're usually inside the DPA) and you must be able to produce a copy on request |
| "You can delete everything yourself" | Already true here — `public.delete_account()` plus cascading FKs |
| "We notify you of a breach within 72 hours / 60 days" | A written incident plan and a way to email all users. A promise you have no mechanism to keep is the deception |
| Non-EU controller serving EEA/UK users | An **Art. 27 representative** in the EU (and UK). The "occasional processing" exemption requires that you not process special category data — health data disqualifies you. Appoint one, or geo-restrict signup |
| "Access is limited to authorised personnel" | MFA on the Supabase account and anywhere the service-role key lives |
| Record-keeping | An **Art. 30 record of processing activities**. The under-250-employee exemption doesn't apply where you process special category data — which you do |
| "We keep no manual backups" / "backups are kept N days" | The `npm run backup` output is real data on real disks. Decide the rule, then follow it |

## 13. Pre-publication checklist

**Facts to pin down (each one is a `{{FILL}}` in the drafts):**

- [ ] Controller legal name and a postal address
- [ ] Privacy contact email that is monitored
- [ ] Supabase project **region** — this decides the whole international-transfer section
- [ ] Static host and its region; email sender and its region
- [ ] Whether `VITE_SENTRY_DSN` is set **in the production build** — not the source default
- [ ] Log retention for Supabase and the host; Supabase backup/PITR retention for your plan
- [ ] Whether you run `npm run backup` against production, and where those files live
- [ ] Minimum age, and enforcement at sign-up
- [ ] Lead supervisory authority (follows the controller's establishment)

**Things to build before the policy is true:**

- [ ] Separate explicit-consent step for health data at sign-up, recorded
- [ ] In-app links to both policies (Apple and Google both require in-app access)
- [ ] Prominent homepage link labelled "Consumer Health Data Privacy Policy"
- [ ] Accept the DPAs; save copies; note the subprocessor lists
- [ ] Art. 27 representative, or an EEA/UK signup restriction
- [x] ~~MFA on the Supabase account~~ — **decided against (2026-08-01): paid feature, no
      budget.** The consequence is handled the only honest way: the three published
      documents no longer claim it. `tests/legal-pages.test.mjs` fails if the words
      "multi-factor" / "2FA" reappear on any published page, because a control described
      in a policy and not actually in place is an FTC Act § 5 misrepresentation rather
      than an aspiration. The published text also does not *advertise* the absence — a
      policy owes accuracy, not a map of where the locks are missing. If the plan ever
      changes, add the sentence back and delete the guard in the same commit.
- [ ] Art. 30 processing record (one page is fine)
- [ ] A written breach-response note: who you tell, in what order, within what deadline

**Consistency sweep — run this every time the policy or the app changes:**

- [ ] Policy ↔ Google Play **Data safety** form agree exactly
- [ ] Policy ↔ Apple **Privacy Nutrition Labels** agree exactly
- [ ] Policy ↔ what the code actually sends (grep for every network call and SDK)
- [ ] Both policies bump their version and "last reviewed" date
- [ ] No `{{FILL}}` markers and no drafting-note blockquotes survive into the published file

## 14. Sources for Part II

[WP260 rev.01 transparency guidelines](https://www.edpb.europa.eu/system/files/2023-09/wp260rev01_en.pdf) ·
[Cal. Code Regs. tit. 11 § 7011](https://law.cornell.edu/regulations/california/11-CCR-7011) ·
[RCW 19.373 full text](https://app.leg.wa.gov/RCW/default.aspx?cite=19.373&full=true) ·
[RCW 19.373.020](https://app.leg.wa.gov/RCW/default.aspx?cite=19.373.020) ·
[FTC HBNR final rule](https://www.ftc.gov/news-events/news/press-releases/2024/04/ftc-finalizes-changes-health-breach-notification-rule) ·
[HBNR in the Federal Register](https://www.federalregister.gov/documents/2024/05/30/2024-10855/health-breach-notification-rule) ·
[Orrick on the HBNR update](https://www.orrick.com/en/Insights/2024/07/FTC-Health-Breach-Notification-Rule-Update-6-Things-You-Should-Know) ·
[Alston & Bird on the HBNR](https://www.alston.com/en/insights/publications/2024/08/ftc-updated-health-breach-notification-rule) ·
[Supabase DPA](https://supabase.com/legal/dpa) ·
[GDPRhub Art. 27](https://gdprhub.eu/Article_27_GDPR) ·
[IAPP on operationalising Art. 27](https://iapp.org/news/a/eu-representative-on-how-to-operationalize-article-27-of-the-gdpr) ·
[Sprinto on Art. 28 DPAs](https://sprinto.com/blog/article-28-gdpr/) ·
[US state privacy tracker 2026](https://secureprivacy.ai/blog/us-state-privacy-law-tracker-2026) ·
[Universal opt-out / GPC states 2026](https://www.gunster.com/newsroom/publications/2026-data-privacy-laws-state-changes-universal-opt-out-compliance) ·
[CNIL/ePrivacy on local storage](https://kukie.io/blog/local-storage-session-storage-cookies-law)
