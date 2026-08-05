# Personal data breach register and procedure (GDPR Art. 33–34)

**Version 1.0 · 5 August 2026.**

Art. 33(5) requires the controller to document **every** personal data breach — its facts,
its effects and the remedial action taken — whether or not it is notifiable. The register
is the artefact that lets a supervisory authority verify compliance. A breach that was
correctly judged non-notifiable and never written down is itself an Art. 33(5) failure.

---

## Register

**No entries.** No personal data breach has been identified as of 5 August 2026.

Add rows here. Never delete one; correct by appending.

| # | Detected (UTC) | Occurred | Description | Categories & approx. number of data subjects | Categories & approx. number of records | Likely consequences | Remedial action | Notifiable to DVI? | Notified (UTC) | Data subjects informed? | FTC HBNR? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — | — | — | — | — | — | — |

---

## What counts as a breach

Art. 4(12): "a breach of security leading to the accidental or unlawful destruction, loss,
alteration, unauthorised disclosure of, or access to" personal data. All three limbs
count, not only disclosure:

- **Confidentiality** — anyone reads rows that are not theirs. For this app the realistic
  causes are an RLS policy dropped or misapplied, the `service_role` key leaking (into the
  bundle, a commit, a log, or a backup file), or the operator's provider account being
  compromised.
- **Integrity** — rows altered without authorisation.
- **Availability** — rows destroyed or lost, including by the operator. **This is the
  sharp one here:** `legal/PRIVACY.md` § 7 states no backup exists, so any loss is
  permanent and cannot be remediated by restore. Accidental destruction of a user's data
  is a reportable breach, not merely an operational mistake.

**Specific to this project:** the FTC's amended Health Breach Notification Rule treats
*unauthorised disclosure — including the operator voluntarily sharing data without
consent* — as a breach. Adding an analytics or advertising SDK to this app without fresh
explicit consent would not be a policy update; it would be a reportable breach. The build
guard in `scripts/check-monitoring-claim.mjs` exists to stop the accidental version of
that.

## Procedure

1. **Contain, then start the clock.** The 72-hour deadline in Art. 33(1) runs from the
   moment the controller becomes *aware*, not from resolution. Record the awareness
   timestamp in the register immediately, before investigating.
2. **Record the facts** in the register — even if it later proves not notifiable.
3. **Assess risk to the data subjects.** This app holds special category health data, so
   the threshold for "risk" and "high risk" is reached more readily than for ordinary
   data. Assume notifiable unless there is a positive reason otherwise (for example,
   data that was encrypted and remains unintelligible to the recipient).
4. **Notify Datu valsts inspekcija within 72 hours** where a risk to rights and freedoms
   is likely (Art. 33(1)) — https://www.dvi.gov.lv. If the full facts are not yet known,
   notify anyway and supply the rest in phases (Art. 33(4)); a late complete notification
   is worse than a prompt partial one. If notification is later than 72 hours, it must be
   accompanied by reasons for the delay.
5. **Inform affected users without undue delay** where high risk to their rights is likely
   (Art. 34), in plain language, describing the likely consequences and the measures
   taken. Where a direct communication would involve disproportionate effort, use a public
   communication instead (Art. 34(3)(c)).
6. **US overlay — FTC Health Breach Notification Rule.** Notify affected individuals and
   the FTC within 60 calendar days, and prominent media if 500 or more people in a single
   jurisdiction are affected. Washington residents: see
   `legal/CONSUMER-HEALTH-DATA-PRIVACY.md`.
7. **Close the entry** with the remedial action and any change made to prevent recurrence.

Notification content must cover Art. 33(3): the nature of the breach, the categories and
approximate numbers of data subjects and records, the DPO/contact point (here, the
controller), the likely consequences, and the measures taken or proposed.

## Detection — a stated weakness

The published policy commits to a 72-hour clock, an undue-delay clock and a 60-day FTC
clock. All three start on *awareness*, and awareness currently depends on the operator
noticing. Concretely:

- Application error reporting is **off by default** and ships as a no-op without
  `VITE_SENTRY_DSN` (this is disclosed in `legal/PRIVACY.md` § 2.3 and is a deliberate
  privacy choice, not an oversight).
- Database request logs are retained for 1 day on the current plan, so there is a
  one-day window in which to notice anything from them.
- There is no alerting, no anomaly detection and no log review schedule.

**Compensating controls:** the attack surface is small — one operator, no employees, no
third-party scripts, RLS enforced in the database, and no `service_role` key in the
shipped bundle. The realistic breach paths are operator-side (credential compromise,
key leak) rather than application-side.

**Minimum recommended practice while detection stays manual:** run
`npm run legal:check` and the security advisor (`get_advisors`) on a schedule, review the
provider's auth logs after any suspicious sign-in email, and re-read this file at the
12-month policy review.
