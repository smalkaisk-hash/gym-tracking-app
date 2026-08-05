# Compliance records

Accountability artefacts required by the GDPR, kept separately from `legal/`. The
distinction is what each is *for*:

- **`legal/`** — documents addressed to users. Four of them are published to `public/*.html`
  by `npm run legal`.
- **`compliance/`** — records addressed to the controller and, on request, to a supervisory
  authority. **Nothing here is published**, and the legal build pipeline does not read this
  directory.

| File | Obligation | Status |
| --- | --- | --- |
| [ART-30-RECORD.md](ART-30-RECORD.md) | Art. 30 — record of processing activities. **Mandatory**: the under-250-persons exemption in Art. 30(5) does not apply, because the processing includes Art. 9 health data and is not occasional | Eight purposes (P1–P8). Complete except the static host and the auth-log schedule (§ 5) |
| [DECISIONS-AND-ASSESSMENTS.md](DECISIONS-AND-ASSESSMENTS.md) | Art. 5(2) accountability — Art. 9/7(4) necessity analysis, Art. 35 DPIA screening, UK Art. 27 decision, Art. 28 evidence checklist | Current |
| [BREACH-REGISTER.md](BREACH-REGISTER.md) | Art. 33(5) — document every breach, notifiable or not, plus the Art. 33/34 procedure | Empty (no breach) |
| [DSR-PROCEDURE.md](DSR-PROCEDURE.md) | Arts. 12–22 — how requests are verified and answered, including the two rights with no in-app control | Empty register |
| [verified.json](verified.json) | Art. 5(2) accountability — the machine-readable record of which externally-held facts (dashboard settings, database region, applied migrations) have actually been checked, and when. Enforced by `npm run check:claims` | 8 claims · 4 published, of which **3 verified and 1 open** (`auth_log_purge_scheduled`) |

## Repository visibility

> **Checked 5 August 2026 — the repository reads as private.** An unauthenticated request
> to `api.github.com/repos/smalkaisk-hash/gym-tracking-app` returns **404**, which GitHub
> returns for a private repository as well as for one that does not exist. The remote is
> configured and actively pushed to, so "private" is the reading. This was verified from
> outside with no credentials; it is strong evidence, not proof. **Confirm it once from the
> repository's own settings page** — everything below turns on it.
>
> Why it matters: `DECISIONS-AND-ASSESSMENTS.md` § 3 records a knowingly accepted UK GDPR
> non-conformity, and `legal/PRIVACY-POLICY-GUIDE.md`, `legal/TERMS-RATIONALE.md` and
> `LEGAL-LIABILITY-AUDIT.md` contain candid internal reasoning. If the repository were
> public, all of it would be available to any complainant. This is item D1 in
> `compliance/reviews/2026-08-05-privacy-gap-analysis.md`.

The Art. 30 record is the exception — it is written to be handed to a regulator as-is, and
nothing in it needs to be private.

## Keeping these true

These are only useful if they match reality. Update them in the same change as the thing
they describe:

- A new purpose, data category, recipient or retention period → **ART-30-RECORD.md**. This
  is the one that gets missed: P7 (sign-in security log, 90 days) and P8 (dormant-account
  review and its notice evidence) were both introduced by published-document changes and
  by migrations `0005`/`0006`, and neither had a row here until the review that added them.
- A published sentence that asserts something this repository cannot check → a claim in
  **verified.json**, with the date it was checked, and an `expires` date if it can drift or
  has a deadline attached.
- Choosing the static host → ART-30-RECORD.md § 5 **and** the four `{{FILL: …}}`
  placeholders that `npm run legal:release` reports. Deferred by decision until there is a
  deployment — see DECISIONS-AND-ASSESSMENTS.md § 7 for the full pre-deployment order.
  **`legal:release` failing is the correct state today, not a defect to route around.**
- Any breach, including one judged non-notifiable → **BREACH-REGISTER.md**, before
  investigating.
- Any data subject request → **DSR-PROCEDURE.md** register.
- Reviewed at least every 12 months alongside `legal/PRIVACY.md` § 12. Next: **5 August 2027**.
