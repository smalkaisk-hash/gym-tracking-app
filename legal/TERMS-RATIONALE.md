# Why the Terms are written the way they are

Companion to [TERMS.md](TERMS.md). This file is **internal** — do not publish it. It records
the reasoning behind each drafting choice, the modules to bolt on later, what you still have
to fill in, and how to make the agreement actually stick.

---

## 0. The core principle: airtight ≠ aggressive

The instinct is to write terms that give you everything and the user nothing. In a
consumer-facing app that is the **weakest** possible draft, for three compounding reasons:

1. **EU/UK law voids one-sided terms outright.** Under Directive 93/13 Art. 6, an unfair term
   "shall not be binding on the consumer." You do not get it read down — you lose it. So an
   over-broad liability exclusion converts into *no* exclusion.
2. **Ambiguity is resolved against you.** Art. 5 of 93/13 codifies *contra proferentem* for
   consumer contracts: where a term's meaning is doubtful, "the interpretation most
   favourable to the consumer shall prevail." Clever, hedged wording backfires by design.
3. **Enforceability is decided before anyone reads the text.** In 2025 the Ninth Circuit
   twice refused to enforce agreements — *Chabolla v. ClassPass* (Feb 2025) and *Godun v.
   JustAnswer* (Apr 2025) — not because of what they said, but because of grey text, small
   font, and a button that said "Connect now" rather than signalling assent. A perfect
   document nobody validly accepted is worth nothing.

So the whole draft is engineered for **survivability**: every risk allocation is stated at a
level a court will actually uphold, each exclusion is independently severable, and each one
has an explicit step-down so a partial failure doesn't cascade.

---

## 1. The clauses that do the heavy lifting

### §2.4 — "Your consumer rights are not affected"

The single most valuable sentence in the document. It:

- neutralises Annex point (b) of 93/13 (inappropriately excluding consumer rights against
  the supplier), which is the most common reason app terms get struck;
- blunts the Rome I Art. 6(2) problem — a choice-of-law clause cannot deprive a consumer of
  their home country's mandatory protections, so pretending otherwise is both ineffective and
  evidence of bad faith;
- makes every downstream limitation clause *more* likely to survive, because the court can
  see the mandatory floor is preserved.

### §7.2 — the acceptable-use catch-all, drafted around two traps

Two things kill catch-alls:

- **"in our sole discretion"** → Annex point (m): a term giving the supplier "the exclusive
  right to interpret any contract term" is presumptively unfair. Replaced throughout with
  **"we reasonably determine, on the basis of specific evidence."**
- ***Ejusdem generis*** → a general catch-all following a list of specific examples is read
  down to things *of the same kind* as the examples. §7.2 defeats this expressly: the items
  "do not limit it, and conduct does not have to resemble them to be caught." §20.1 backs
  that up at the interpretation level, which is the fix Adams recommends for the ambiguity of
  bare "including."

### §8.2 — the content licence, deliberately narrow

Most templates take a "worldwide, perpetual, irrevocable, sublicensable, transferable licence
to use, reproduce, modify, publish and distribute" — copied from social platforms that need
it to display your posts publicly. **FitPulse has no public surface.** Taking that licence
gains you nothing and hands a regulator, a journalist or a reviewer an easy attack. So it is
scoped to what's necessary to run the service, is non-sublicensable except to processors,
ends on deletion, and §8.4 routes any future broader use through fresh opt-in consent.

### §9 — the health block

Assumption of risk is only worth having if it's specific. Generic "exercise is risky"
language reads as boilerplate; enumerated risks and enumerated risk groups read as a warning
the user actually received. §9.4 ("do not rely on the numbers") is the clause that matters
most for *your* app specifically, because FitPulse's whole value proposition is derived
figures — volume totals, trends, streaks. §9.6 points back at the non-excludable carve-out so
the section doesn't over-reach and get struck as a whole.

**Keep the app's marketing language on the wellness side of the line.** Medical device
classification under EU MDR turns on *claims*, not on code. Never say FitPulse detects,
diagnoses, monitors, predicts or treats anything.

### §10 + §16 — change rights, built to survive Annex (j) and (k)

Annex point (j) makes a term unfair where it enables the supplier "to alter the terms of the
contract unilaterally **without a valid reason which is specified in the contract**." Point
(k) says the same for altering the product's characteristics. The word to notice is
*specified*. So:

- §16.1 lists seven closed, valid reasons and requires you to state which one applies;
- §10.2 does the same for changing the Service;
- §10.3 / §16.2 give 30 days' notice with a plain-language summary and a diff;
- §16.3 requires **active re-acceptance** for changes to the sections that matter.

That last point also fixes the US-side problem: courts routinely refuse to enforce modified
terms where the user "has no reason to know" of the change — merely posting a new version
isn't notice. Passive "continued use" (§16.4) survives only for the trivial residue.

### §12 — termination symmetry

Annex points (f) and (g): a term is unfair if it lets the supplier dissolve the contract at
discretion while denying the same to the consumer, or terminate an indefinite contract
without reasonable notice absent serious grounds. Hence: the user leaves instantly and
without reason; you terminate only on enumerated grounds, with notice and a cure period
unless it's serious. §12.4 (right to challenge) also defuses Annex (m).

### §13.1 — the conformity promise most templates get wrong

This is the expert point. **Directive (EU) 2019/770 applies to free digital services where
the consumer supplies personal data as counter-performance** (unless that data is processed
*exclusively* to deliver the service or meet a legal obligation). FitPulse is free and
collects an email, a name, a gender and health-adjacent metrics — so an EEA user very likely
has full statutory conformity rights, including the right to terminate for even a *minor*
lack of conformity where no price was paid.

Consequence: a flat "as is, no warranties of any kind" clause is **void** against those
users. Worse, it's affirmatively misleading, which is its own regulatory exposure. §13.1
therefore states a real conformity obligation, and §13.2 disclaims only what's left over —
which is what a court will uphold.

### §14 — liability, engineered in four independent layers

| Layer | Clause | Purpose |
|---|---|---|
| Positive statement | 14.1 | Foreseeability standard, stated affirmatively — signals good faith |
| Non-excludable carve-outs | 14.2 | Death/personal injury (Annex (a) — automatically unfair), fraud, gross negligence, statutory consumer rights, data protection |
| Category exclusions | 14.3 | Each sub-clause **independently severable** — see below |
| Monetary cap + step-down | 14.4–14.5 | Cap survives even if 14.3 falls, and vice versa |

The independence language is the actual engineering. Research on unfair-terms detection finds
that clauses excluding **broad categories** of loss — especially with blanket "to the fullest
extent permissible by law" framing — are flagged as potentially unfair, while narrow,
itemised exclusions fare better. Splitting them means a court striking 14.3(b) does not take
14.3(a), (c), (d) and (e) with it.

§14.5 is the "step-down": rather than the cap failing entirely, it converts to the lowest
enforceable amount under whichever law applies. §14.6 pairs the data-loss exclusion with the
real export feature — an exclusion is far more defensible when the user has a genuine remedy.

**Set the §14.4 floor to a real number.** For a free app EUR 100 is conventional. Zero looks
like a total exclusion and invites a strike.

### §15 — indemnity, deliberately defanged

Broad consumer indemnities are one of the most-flagged unfair terms in the EU/UK and in
several US states, and they're the classic symptom of a B2B template pasted into a consumer
product. §15 is therefore not an indemnity at all — it's a narrow, fault-based, foreseeable
direct-loss responsibility with a contributory-fault carve-out and a notice obligation. It
covers the case you actually care about (someone attacks the service, or uses it unlawfully
and a third party comes after you) and nothing else.

### §17 — jurisdiction, split by user

Annex point (q) treats as unfair a term "excluding or hindering the consumer's right to take
legal action… particularly by requiring the consumer to take disputes exclusively to
arbitration." **A mandatory arbitration clause against an EEA consumer is not merely risky —
it is the textbook example in the Annex.** So EEA/UK consumers get their home forum (§17.2),
and the US arbitration module is quarantined in §17.4 and marked do-not-apply.

### §20.6 — conceding *contra proferentem* on purpose

Counter-intuitive but correct. Art. 5 of 93/13 applies whether you write it down or not.
Writing it down costs you nothing you weren't already going to lose, and is strong evidence
of good faith under the Art. 3(1) fairness test — which is assessed across *all* the terms
together.

---

## 2. Enforceability: the implementation spec

**The document is maybe 30% of the job. This is the other 70%.** None of the above matters if
you can't prove the user agreed.

### 2.1 The acceptance UI (build this into the sign-up gate)

Requirements, drawn from the two-part *Chabolla*/*Godun* test — **reasonably conspicuous
notice** + **unambiguous manifestation of assent**:

- [ ] An **unticked checkbox**, immediately above the submit button. Never pre-ticked.
- [ ] Label: *"I have read and agree to the [Terms of Service] and [Privacy Policy]."*
- [ ] Links styled as links — `text-accent` and underlined. **Not** `text-muted`.
      *Godun* failed partly on "light gray… blend[ing] into the background."
- [ ] Notice text at the **same font size as surrounding body copy**, not smaller.
      *Godun* failed partly on "relatively small" text.
- [ ] Links open the terms **in-app, readable before acceptance** — not a download, not a
      dead-end external tab that loses the form state.
- [ ] Button label must signal assent. **"Create account" is fine. "Continue", "Get started"
      and "Connect now" are the exact framing that failed** — the court held the button
      language must match the notice.
- [ ] No other interactive element between the checkbox and the button.
- [ ] Applies to the sign-up gate. Sign-**in** does not need it — the contract already exists.

Concretely, in this codebase that's a change to `LoginScreen`'s sign-up branch in
[src/gym-tracker-app.tsx](../src/gym-tracker-app.tsx), and it needs a new Playwright baseline
(`npm run test:e2e -- --update-snapshots`) since the auth screens are snapshot-guarded.

### 2.2 The assent record (build this into the database)

Without this you have a contract you cannot prove. Add a table:

```sql
create table public.terms_acceptances (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  document    text not null,              -- 'terms' | 'privacy'
  version     text not null,              -- '1.0'
  sha256      text not null,              -- hash of the exact bytes shown
  accepted_at timestamptz not null default now(),
  user_agent  text,
  ip_inet     inet                        -- see privacy note below
);
```

- Store the **hash of the exact text served**, not just a version string. That is what lets
  you reproduce what they agreed to.
- Serve every version from an immutable URL and never edit a published version in place —
  supersede it.
- RLS-scope it to `auth.uid()` like the other three tables, and note that the IP address is
  itself personal data: give it a retention period in the Privacy Policy, or drop the column.
- §3.2 of the Terms promises the user a copy of this record on request. Make sure you can
  actually produce it.

### 2.3 Re-acceptance flow

§16.3 requires active acceptance for material changes. That means a pre-render gate — the
same shape as the existing onboarding gate in `GymTrackerApp` — that fires when the user's
latest `terms_acceptances` row is older than the current required version. Existing gate
order is: config → `!authReady` → recovery → `!session` → onboarding → app. A terms gate
belongs **after** onboarding.

### 2.4 Publication

- Publish at a stable URL (`/terms`) with the effective date at the top.
- Keep an archive index at `/terms/archive` — §16.5 promises it.
- Link it from Settings, the sign-up screen, and the app store listing.
- Make it readable on a phone: anchored table of contents, short paragraphs, no PDF.

---

## 3. What you must fill in before publishing

| Placeholder | Where | Note |
|---|---|---|
| `[LEGAL NAME]`, address, `[NIF]` | §1, A.8 | **Mandatory.** Apple's minimum terms require developer name + address. In Spain, LSSI-CE Art. 10 requires operator identity, contact details and NIF — omission is a *minor* infringement with fines up to €30,000, and it applies to apps as information-society services. |
| `[legal@yourdomain]` | throughout | Use a real monitored address, not a personal one. |
| `[EFFECTIVE DATE]` | header | |
| Privacy Policy `[URL]` | §2.2(b), §8.5 | **The Terms are incomplete without it** — see §5 below. |
| `[SPAIN]` | §17, §20.3 | Your actual place of establishment. |
| `[EUR 100]` | §14.4 | Don't set 0. |
| Retention period `[30] days` | §12.6 | Must match what `delete_account()` actually does. |
| §11.1 security measures | §11.1 | **Edit to match reality.** Stating a measure you don't have is a misrepresentation. |
| §18.2 ADR body | §18.2 | Optional but good practice. |
| Response times | §1, §18.1 | Only promise what you'll hit. |

---

## 4. Modules to add when the product changes

### 4.1 Paid plans — add when you monetise

The README says FitPulse is being taken toward a real product, so draft this before you need
it, not after. A new section 11a covering:

- **Price, billing period, and that it renews until cancelled** — disclosed *at the point of
  purchase*, clearly and conspicuously, not only in the Terms.
- **Cancellation at least as easy as sign-up, in the same medium.** The FTC's click-to-cancel
  Negative Option Rule was vacated on procedural grounds in 2025, but the FTC reopened
  rulemaking in March 2026 and is enforcing under existing authority, and ~30 US states have
  their own auto-renewal statutes, several stricter. Build to the vacated rule's substance.
- **EU 14-day right of withdrawal** under the Consumer Rights Directive. For content
  delivered immediately you must capture the user's *express request* to start plus their
  *acknowledgement that they lose the withdrawal right* — otherwise it survives the 14 days.
- **In-app purchases**: Apple/Google are merchant of record. Say refunds go through the store
  and link the store's policy.
- **Price changes**: advance notice + right to cancel. "We may change prices without notice"
  is a well-known unfair-term red flag (Annex (l)).
- §16.1(e) already reserves the right to introduce paid plans, and already promises never to
  reprice a plan already bought without agreement. Keep that promise.

**Also note:** the moment you take money, you're providing an **e-commerce service**, which
pulls you into the **European Accessibility Act** (in force 28 June 2025). The
micro-enterprise exemption (<10 staff **and** <€2m turnover) likely covers you initially, but
it's worth knowing the trigger exists.

### 4.2 Social / shared content — add only if you build it

If users ever share workouts, follow each other, or post to a feed, you need: content
standards, notice-and-action takedown, an internal complaint-handling system, and a
description of your moderation process *including any algorithmic decision-making and human
review*, in clear machine-readable form — all mandated by **DSA Art. 14** for hosting
services. Right now FitPulse stores only the user's own data with no third-party access, so
it is not a hosting/intermediary service and Art. 14 does not bite. **Adding sharing changes
that.**

### 4.3 US arbitration (§17.4) — include only on advice

If you get meaningful US traffic, an arbitration clause + class waiver is the standard
defence and clickwrap makes it enforceable. But it is no longer a free win: mass-arbitration
campaigns weaponise per-claim filing fees, and courts have found *batching and bellwether*
provisions **unconscionable** where the sequencing could make claimants wait decades. If you
add one, it needs: a 30-day informal-resolution period, a small-claims carve-out, an opt-out
window, an *elastic* batching model rather than a fixed one, and a blow-up provision so an
invalidated class waiver doesn't drag the whole clause down. This is a
get-a-lawyer clause, not a copy-paste clause.

---

## 5. The bigger gap: you need a Privacy Policy, and it's the harder document

The Terms reference it and are incomplete without it. For FitPulse it is genuinely the more
demanding of the two:

- **Body weight and fitness metrics tied to an identified user are very likely Article 9
  special-category health data.** Regulators treat wearable/fitness metrics this way, and
  gender is collected too.
- That means **two legal bases stacked**: an Art. 6 basis *and* a separate Art. 9(2)
  condition. For a consumer wellness app the Art. 9(2) condition will in practice be
  **explicit consent** — the preventive-medicine exception is reserved for licensed
  healthcare providers.
- **Explicit consent must be a clear affirmative statement specifically referencing the
  sensitive data**, freely given, and withdrawable. It is a *separate* act from accepting the
  Terms — do not bundle them into one checkbox. Two checkboxes, or one for Terms and a
  distinct consent step for health data.
- You must name **Supabase as a processor**, identify the hosting region, and cover
  international transfers if the project region is outside the EEA.
- Cover: retention, the `delete_account()` erasure path, the export path as portability, and
  Sentry as a processor if `VITE_SENTRY_DSN` is ever set in production.

Say the word and I'll draft it to the same standard.

---

## 6. Anti-loophole drafting rules used throughout

Applied consistently; keep applying them to any clause you add:

1. **No "sole discretion."** Always "acting reasonably" or an objective, evidenced standard.
   (Annex (m).)
2. **No bare "including."** §20.1 defines it to defeat *ejusdem generis* and the
   part-vs-whole ambiguity.
3. **No "and/or"** — genuinely ambiguous. Write out "A, B, or both."
4. **No "best efforts"/"commercially reasonable efforts"** without saying what they require.
5. **Every exclusion independently severable**, so blue-pencilling one doesn't take the rest.
6. **Every limitation has a step-down** to the maximum enforceable position.
7. **Non-excludable carve-outs stated before the exclusions**, not buried after.
8. **Every discretionary power is paired with notice and a route to challenge it.**
9. **Short sentences, active voice, "we"/"you"** — Art. 5 of 93/13 makes plain intelligible
   language a legal requirement, not a style preference.
10. **No clause that promises something the code doesn't do.** Every operational promise
    (§11.1, §11.2 export, §12.1 deletion, §12.6 retention, §16.5 archive) must be verified
    against the actual implementation before publishing.

Rule 10 is the one to re-check at every release. The commonest failure mode for terms isn't
being too weak — it's drifting out of sync with the product until the document describes an
app that no longer exists.

---

## Sources

- [EUR-Lex — Directive 93/13/EEC on unfair terms in consumer contracts (Arts. 3–7 + Annex)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A31993L0013)
- [EUR-Lex — Directive (EU) 2019/770 on contracts for the supply of digital content and digital services](https://eur-lex.europa.eu/eli/dir/2019/770/oj/eng)
- [European Commission — Unfair Contract Terms Directive](https://commission.europa.eu/law/law-topic/consumer-protection-law/consumer-contract-law/unfair-contract-terms-directive_en)
- [Apple — Minimum Terms of Developer's EULA](https://www.apple.com/legal/internet-services/itunes/dev/minterms/)
- [Apple — Licensed Application End User License Agreement](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/)
- [Fenwick — Ninth Circuit reinforces stricter standards for online user agreements (Chabolla, Godun)](https://www.fenwick.com/insights/publications/ninth-circuit-reinforces-stricter-standards-for-online-user-agreements)
- [Hunton — The latest from the Ninth Circuit on sign-in wrap agreements](https://www.hunton.com/privacy-and-information-security-law/its-a-wrap-the-latest-from-the-ninth-circuit-on-sign-in-wrap-agreements)
- [Richt Law Firm — Sanchez v. Maggy London: conspicuous links aren't enough](https://richtfirm.com/conspicuous-links-arent-enough-critical-lessons-from-sanchez-v-maggy-london-on-enforceable-online-terms/)
- [ABA Business Law Today — "We may modify these terms at any time, right?"](https://www.americanbar.org/groups/business_law/resources/business-law-today/2016-may/online-contracts/)
- [KRCL — Change-of-terms provisions and enforceability of online terms of use](https://www.krcl.com/insights/litigation-alert-effect-of-change-of-terms-provisions-on-the-enforceability-of-online-terms-of-use-recent-developments)
- [ABA — Mass arbitration update: momentum, maneuvers, and mounting pushback (Spring 2026)](https://www.americanbar.org/groups/business_law/resources/business-lawyer/2026-spring/mass-arbitration-update-momentum-maneuvers-mounting-pushback/)
- [Benesch — New developments in mass arbitration (unconscionable batching)](https://www.beneschlaw.com/resources/hoisted-by-your-own-petarb-clause-new-developments-in-mass-arbitration.html)
- [Jones Day — FTC revives click-to-cancel rule (2026)](https://www.jonesday.com/en/insights/2026/05/ftc-revives-clicktocancel-rule-new-risks-for-subscription-businesses)
- [LexisNexis UK — Exclusion and limitation of liability: business-to-consumer](https://www.lexisnexis.co.uk/legal/guidance/exclusion-limitation-of-liability-business-to-consumer)
- [Digital Services Act — Article 14, Terms and conditions](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_14.html)
- [Secure Privacy — GDPR Article 9 special categories: lawful processing (2026)](https://secureprivacy.ai/blog/gdpr-article-9-special-categories-lawful-processing-and-compliance-guide-2026)
- [GDPR Local — GDPR for wearable technology](https://gdprlocal.com/gdpr-for-wearable-technology/)
- [Grupo Atico34 — Aviso legal web (LSSI-CE Art. 10)](https://protecciondatos-lopd.com/empresas/aviso-legal-web/)
- [iubenda — Discontinuation of the EU ODR platform (20 July 2025)](https://www.iubenda.com/en/blog/discontinuation-of-the-european-online-dispute-resolution-odr-platform/)
- [Bird & Bird — Navigating the European Accessibility Act](https://www.twobirds.com/en/insights/2025/a-guide-to-navigating-the-european-accessibility-act-for-online-retailers-service-providers-and-plat)
- [Adams on Contract Drafting — "Including but not limited to"](https://www.adamsdrafting.com/bryan-garner-on-including-but-not-limited-to/)
