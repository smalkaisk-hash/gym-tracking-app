# Compliance decisions and assessments

**Version 1.0 · 5 August 2026.**

> **Not for publication.** This file records reasoning, including one deliberately
> accepted non-conformity (§ 3). It is the counterpart to the Art. 30 record, which *is*
> written to be handed to a regulator. See the repository-visibility warning in
> [README.md](README.md) — if this repository is public, § 3 is a written admission
> available to any complainant.

---

## 1. Art. 9(2)(a) consent and the Art. 7(4) "freely given" question

**Decision: rely on Art. 9(2)(a) explicit consent, jointly with Art. 6(1)(b), and record
the necessity analysis below. No fallback basis is required.**

The concern, stated fairly: consent to health-data processing is a hard precondition of
creating an account. Art. 9 contains no contract-necessity exception equivalent to
Art. 6(1)(b). If that consent were held not to be "freely given" under Art. 7(4), there
would be no alternative basis and every health row would be unlawfully processed.

**Why it does not bite here.** Art. 7(4) is not a general prohibition on requiring
consent; it is directed at consent to processing that is *unnecessary* to the service.
EDPB Guidelines 05/2020 on consent, ¶ 32, is explicit:

> "Article 7(4) is only relevant where the requested data are not necessary for the
> performance of the contract… Conversely, if processing is necessary to perform the
> contract (including to provide a service), then Article 7(4) does not apply."

The processing here is the service. FitPulse's entire function is to store the workouts
and body weights the user logs and show them back. There is no version of the product that
delivers what the user asked for while not holding that data — which is also why
`legal/PRIVACY.md` § 3 says plainly that withdrawing consent and deleting the data are the
same act rather than inventing a middle setting that would pretend otherwise. The
guidelines' own examples of impermissible tying (¶ 33: a bank conditioning an account on
consent to marketing use of payment data; ¶ 40: cookie walls) all concern processing that
is severable from the service. This is not.

**Supporting factors on the record:**

- Consent is collected by a **separate, never-pre-ticked** checkbox, distinct from Terms
  acceptance — the form EDPB ¶ 96 (Example 17) accepts as explicit consent for Art. 9.
- It is specific to one purpose and covers no secondary use; there is no analytics,
  advertising, profiling or sale to bundle into it.
- Withdrawal is one tap from Settings, asks no reason and costs nothing (Art. 7(3), EDPB
  ¶ 113–114).
- The processing is also grounded in Art. 6(1)(b) independently, so the Art. 6 layer does
  not rest on consent at all.

**Residual exposure, and it is narrow.** Optional fields collected under the same consent
that are *not* necessary to the service cannot borrow this analysis. Today that is
`gender` — see § 4.

**Review trigger:** any new purpose, any secondary use, or any optional data category that
is not needed to deliver the logging service.

## 2. Art. 35 DPIA screening

**Outcome: a DPIA is not mandatory at present. Re-screen before any public launch that
grows the user base beyond a small number, and on any change in § 5's triggers.**

Art. 35(3)(b) requires a DPIA for "processing on a large scale of special categories of
data". Assessed against WP248 rev.01's four factors for "large scale":

| Factor | Assessment |
| --- | --- |
| Number of data subjects | Two known users; production currently holds **0 rows** across all three tables (verified 5 August 2026) |
| Volume / range of data | Narrow — one app's own logging data per user |
| Duration | Continuous, for the life of the account |
| Geographical extent | Not targeted; no marketing, no distribution channel yet |

Not large scale. Against the nine EDPB/WP248 criteria, the processing meets **one**
("sensitive data or data of a highly personal nature"). The presumption of a mandatory
DPIA arises at two criteria. Specifically not met: evaluation or scoring (statistics are
shown to the user about their own data and drive no decision), automated decision-making
with legal or similarly significant effect, systematic monitoring, vulnerable data
subjects, matching or combining datasets, innovative technology, and preventing data
subjects from exercising a right.

**Caveats recorded honestly:**

- This flips if the user base grows. "Large scale" is not defined numerically, and a
  consumer health app with a real audience is squarely within Art. 35(3)(b).
- Latvia's Art. 35(4) blacklist (DVI) is published as a Latvian-language scan that could
  not be machine-read during this assessment. **Action: have it read in Latvian before
  launch** and record the result here. The entries identified indirectly concern criminal
  convictions data and scientific/historical research without consent — neither applies —
  but the list has not been read in full.
- A DPIA is cheap insurance at this scale. Not doing one is a defensible judgement, not a
  finding that the risk is absent.

## 3. UK GDPR Art. 27 representative — accepted non-conformity

**Decision (5 August 2026): serve UK users without appointing a UK representative, and
record the decision. Taken knowingly by the controller.**

The position, stated accurately rather than favourably:

- Establishment in Latvia settles Art. 27 for the EEA. It does **not** settle UK GDPR
  Art. 27, which applies to a controller outside the UK that offers services to people in
  the UK, whether or not the service is free.
- The Art. 27(2) exemption for occasional processing is **unavailable**, because it
  excludes processing of special categories of data on a large scale *or* processing
  likely to result in a risk — and independently because this processing is not
  occasional.
- Appointing an EU representative would not satisfy the UK obligation; they are separate.
- Consequence if challenged: a UK GDPR infringement in its own right, enforceable by the
  ICO against the controller. It does not make the underlying processing unlawful and does
  not affect UK users' substantive rights, which are honoured identically to everyone
  else's.

**Mitigations in place:** UK users have the same rights, the same in-app controls and the
same contact address as everyone else, and `legal/PRIVACY.md` § 9 tells them they may
complain to the authority in their own country of residence — for the UK, the Information
Commissioner's Office.

**Revisit when:** any UK marketing or distribution begins, UK users become a material
share of the base, or the cost of a representative (roughly €100–500/yr) stops being the
deciding factor.

## 4. `gender` retained — accepted minimisation finding

**Decision (5 August 2026): keep the optional `gender` field.**

The field is collected at onboarding and drives no calculation anywhere in the app. Under
Art. 5(1)(c) (data minimisation) and Art. 25(2) (data protection by default), collecting a
category that serves no purpose is a finding a supervisory authority could reasonably
raise. The recommendation was to remove it; the controller elected to keep it.

**What makes the position defensible as it stands:**

- It is genuinely optional — blank is a first-class value (`''`), nothing breaks, and the
  user is told so in `legal/PRIVACY.md` § 2.1. Because it is optional, Art. 7(4) is not
  engaged: no one is required to provide it to obtain the service.
- Its uselessness is **disclosed rather than dressed up**:
  `legal/CONSUMER-HEALTH-DATA-PRIVACY.md` § 1 says it drives no calculation.
- It is over-classified as health data and protected accordingly.

**What remains open:** if it never acquires a purpose, the honest answer is to drop it.
Re-decide at the next 12-month policy review, or sooner if a feature gives it a use.

## 5. Art. 28 processor evidence — outstanding

`legal/PRIVACY.md` § 6 states every processor operates under a written Art. 28 agreement,
and § 10 promises to send a copy of the SCCs on request. Both are promises to a reader.

| Processor | Document needed | Status |
| --- | --- | --- |
| Supabase, Inc. | DPA including SCCs (Art. 46(2)(c)) | **Not held.** Download and store |
| Google LLC (Gmail) | Google Data Processing Terms / SCCs | **Not held.** Store the reference |
| Static host | DPA | Blocked on choosing the host |

**Also outstanding — facts the published documents assert that only the dashboard can make
true.** Each of these is a statement in a policy a user is asked to accept, so until it is
confirmed the policy is inaccurate, which is itself the violation under FTC Act § 5 and the
equivalent EU rules. Record the date beside each as it is done.

| Fact asserted | Where | Dashboard action | Confirmed |
| --- | --- | --- | --- |
| Database region is `eu-west-1` / Ireland | `PRIVACY.md` § 6, § 10 — the entire Art. 44–49 position | Project Settings → General | ☐ |
| Passwords checked against breached-password lists | `PRIVACY.md` § 8 | Auth → Providers → **enable leaked password protection** | ☐ |
| Minimum password length 10 | `PRIVACY.md` § 8 | Auth → Providers → set minimum length to 10 | ☐ |
| Email change confirmed from **both** addresses | `PRIVACY.md` § 9 | Auth → Emails → **Secure email change** on | ☐ |
| Consent record "stored so that it cannot be altered after the fact" | `PRIVACY.md` § 3 | Run migration **`0004_add_consents_table.sql`** in the SQL editor | ☐ |

The dashboard steps are written out in [SUPABASE-SETUP.md](../SUPABASE-SETUP.md) § 4; the
migration steps and their verification queries are in
[supabase/migrations/README.md](../supabase/migrations/README.md).

The last row is the one most easily missed, because the app does **not** break without it:
the consent mirror is feature-detected and silently does nothing while the table is absent,
so everything looks fine while the only consent record in existence is the user-writable
one — which is precisely the Art. 7(1) gap the table was added to close.

**This table is no longer the enforcement mechanism — it is the explanation.** The table
above is a checklist, and a checklist nobody diffs is not a control. The machine-readable
record is [verified.json](verified.json), and `npm run check:claims` **fails** while any of
these claims appears on a published page with no verification date against it:

```bash
npm run check:claims -- --list   # every external claim and its state
npm run release:check            # legal:release + check:claims — the full launch gate
```

It works by reading the built `public/*.html`, so a claim deleted from the policy stops
being required, and a claim reworded in a way that drops the phrase shows up as "not
published" rather than silently passing. Record the date you **checked** each fact, not the
date you intended to.

## 7. Deployment deferred — the static host is not chosen, deliberately

**Decision (5 August 2026): do not deploy yet. No static host is selected, the four
`{{FILL: …}}` facts stay unresolved, and `PRIVACY.md` / `CONSUMER-HEALTH-DATA-PRIVACY.md`
keep their draft banners.**

This is a decision, not an outstanding task, and `npm run legal:release` failing is the
**correct** state for an undeployed app rather than a defect to be worked around. The four
facts — the host's name, its country, its log retention, and the transfer mechanism if it
sits outside the EEA — are genuinely unknowable before the host exists. Filling them with a
plausible guess would put a false statement in a privacy policy, which is the one failure
mode this whole document set is built to prevent.

**Why the exposure is contained meanwhile.** The audit's D1 finding — the Terms are in force
while the Privacy Policy they incorporate says it is not — depends on a real person being
put in front of sign-up and accepting both. There is no deployment, so there is no sign-up:
production holds **0 rows** across all three tables. The contradiction is real in the
repository but cannot currently reach a user.

**Reconcile these together before any deployment, in this order:**

1. Choose the host; fill all four facts (`npm run legal:release` lists them, grouped across
   documents so a half-resolved fact is visible).
2. Add the host to [ART-30-RECORD.md](ART-30-RECORD.md) § 3 as a recipient, with its country
   and transfer safeguard, and to § 2 under P4.
3. Obtain its Art. 28 DPA and record it in § 5 above.
4. **Reconcile the draft markers.** `TERMS.md` currently carries none while the two privacy
   documents do. Either all three are in force or all three are not — and note that
   `build-legal.mjs` refuses a draft marker on a document with no placeholders, so putting
   the Terms back into draft is not a one-line change. Getting to zero placeholders and
   dropping both banners is the intended route.
5. Work the checklist in § 5 to green, then `npm run release:check`.

**Revisit when:** a deployment is actually planned. Until then this item needs no work.

## 6. Scale assessment for Art. 37 (DPO)

No DPO is required. The controller is not a public authority; core activities do not
consist of regular and systematic monitoring of data subjects on a large scale; and core
activities do not consist of large-scale processing of Art. 9 data — see the scale
assessment in § 2. Recorded because Art. 37 is assessed, not assumed.
