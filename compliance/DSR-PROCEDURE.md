# Handling data subject requests (GDPR Arts. 12–22)

**Version 1.0 · 5 August 2026.**

Most rights are satisfied by a control in the app, which is the outcome Art. 12(2)
("facilitate the exercise of data subject rights") asks for. This file covers the rest:
the two rights with **no in-app control**, the verification rule, the deadlines, and what
to actually send.

Requests arrive at **smalkaisk@gmail.com**. Every request is free (Art. 12(5)) and no one
is asked to create an account to make one.

---

## Deadlines

| Regime | Deadline | Extension |
| --- | --- | --- |
| GDPR / UK GDPR | **1 month** from receipt (Art. 12(3)) | +2 months for complex or numerous requests — the data subject must be told **within the first month**, with reasons |
| California (CCPA/CPRA) | 45 days | +45 days with notice |
| Washington (MHMDA) | 45 days | +45 days; refusal carries a right of appeal answered in writing within 45 days |

If a request is refused, Art. 12(4) requires telling the person **why**, and that they may
complain to a supervisory authority and seek a judicial remedy — within the same month.

## Verification

Act on requests made **from the signed-in account or the registered email address**. No ID
documents are requested; Art. 12(6) allows asking for more information only where there is
reasonable doubt about identity, and demanding ID by default is itself a compliance
problem. Recital 64 requires reasonable measures — for an account-based service, control
of the registered address is the proportionate test.

For an authorised agent (California), ask for written proof of authority and verify with
the consumer directly.

**Never** send personal data to an address other than the registered one without
independent verification.

## Right by right

| Right | Route | Notes |
| --- | --- | --- |
| **Access** (Art. 15) | Settings → Export backup, **plus** the supplementary information below | The export is the Art. 15(3) copy; it is not by itself a complete Art. 15 answer |
| **Portability** (Art. 20) | The same export — JSON, documented, machine-readable, usable without FitPulse | `legal/TERMS.md` § 11.2 commits to keeping it so |
| **Rectification** (Art. 16) | In-app: history entries, weigh-ins, name, preferences are editable. Email address: Settings → Account → Change email | |
| **Erasure** (Art. 17) | Settings → Delete account (whole account) or Delete all my data (keeps the login) | Both are immediate and irreversible; no backup exists to purge |
| **Restriction** (Art. 18) | **No in-app control — manual.** See below | |
| **Objection** (Art. 21) | **No in-app control — manual.** See below | |
| **Withdraw consent** (Art. 7(3)) | Settings → Delete all my data, or Delete account | Withdrawal and erasure are the same act here; `legal/PRIVACY.md` § 3 explains why |
| **Automated decision-making** (Art. 22) | Nothing to exercise — none is carried out | |

### Answering an access request properly

Art. 15(1) requires more than a copy of the data. Send the export **and** the following,
either inline or by quoting the named sections:

1. The purposes of processing — `legal/PRIVACY.md` § 4.
2. The categories of personal data — § 2.
3. The recipients or categories of recipient — § 6 (name them individually; EDPB
   Guidelines 01/2022 note that categories alone are usually inadequate, and naming them
   is trivial here: there are three).
4. The retention period, or the criteria — § 7.
5. The existence of the rights to rectification, erasure, restriction and objection — § 9.
6. The right to lodge a complaint with a supervisory authority — § 9 / § 13.
7. The source of the data, where not collected from the data subject — **not applicable**;
   everything comes from the user.
8. The existence of automated decision-making — **none**.
9. Where data is transferred to a third country, the Art. 46 safeguards — § 10.

**State what the export does not contain.** Infrastructure request logs (IP addresses) sit
with the providers on the retention in § 7 and are not part of the export; say so, and
offer to ask the provider if the person wants them.

### Restriction (Art. 18) — manual procedure

Restriction applies where accuracy is contested, processing is unlawful but the person
prefers restriction to erasure, the controller no longer needs the data but the person
needs it for a legal claim, or an Art. 21 objection is pending verification. Restricted
data may be stored but not otherwise processed without consent.

There is no in-app switch. To restrict:

1. Acknowledge within the month and confirm the ground relied on.
2. Export the person's rows and hold the export outside the live database.
3. Delete the live rows so no processing continues, **or** — if deletion would defeat the
   purpose (a contested-accuracy case where the data must survive) — record the
   restriction in writing here and take no further action on the account until it lifts.
4. Art. 19: inform any recipient of the restriction. In practice the only recipients are
   processors acting on instruction, so this is discharged by instructing them; there is
   no disclosure to a third party to unwind.
5. Tell the person before the restriction is lifted (Art. 18(3)).

Log every restriction in the table below.

### Objection (Art. 21) — manual procedure

Only **P4** in [ART-30-RECORD.md](ART-30-RECORD.md) (security and fault diagnosis, server
logs) rests on legitimate interests, so it is the only processing an Art. 21(1) objection
can reach. Everything else runs on Art. 6(1)(b) contract or Art. 9(2)(a) consent, where
the answer is withdrawal or account deletion, not objection.

On an objection: stop processing unless compelling legitimate grounds are demonstrated
that override the person's interests. For request logs the honest answer is usually that
the logs are generated by the infrastructure provider as an inherent part of serving a
network request, are held for 1 day, and cannot be selectively disabled per user — say
that plainly, and offer account deletion as the effective remedy. There is **no** direct
marketing here, so the absolute Art. 21(2) right never arises.

## Register of requests

Log every request, including refusals. Retain these entries only as long as needed to
demonstrate compliance, and store them separately from the app's data (EDPB Guidelines
01/2022).

| # | Received | Type | Verified how | Action taken | Answered | Refused / extended? |
| --- | --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — | — |

**No requests received as of 5 August 2026.**
