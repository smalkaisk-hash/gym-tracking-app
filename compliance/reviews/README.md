# Review notes

Point-in-time findings from audits, red-team passes and outside critiques. **These are
dated snapshots, not live records** — that is the whole reason they sit here under a date
rather than at the repository root where they read as current.

The distinction matters because it has already bitten: a red-team note asserted that
`npm run check:claims` was failing with all six claims unverified, which stopped being
true the same week it was written, in a change that did not touch the note. A stale
finding that reads as current is worse than no finding, because it sends someone to fix
something that is already fixed and lends false weight to whatever else the file says.

So:

- **The live records are elsewhere.** Outstanding legal/documentation items belong in
  [LEGAL-LIABILITY-AUDIT.md](../../LEGAL-LIABILITY-AUDIT.md) — *the* record, updated
  rather than supplemented. Open launch questions belong in
  [launch-decisions.json](../launch-decisions.json) (gated by `npm run check:decisions`).
  Unbacked published claims belong in [verified.json](../verified.json) (gated by
  `npm run check:claims`). All three are enforced; a markdown finding is not.
- **Nothing here is published.** Same rule as the rest of `compliance/`: the legal build
  pipeline does not read this directory.
- **Do not update a file here to keep it current.** Fold whatever is still live into the
  records above and leave the snapshot as it was written. Its value is that it is a
  faithful record of what was found on that date.

| File | What it is |
| --- | --- |
| `2026-08-05-external-privacy-critique.md` | A 50-point outside critique of the privacy documentation, pasted as received. The source of the questions answered in the gap analysis below |
| `2026-08-05-privacy-gap-analysis.md` | Point-by-point response to that critique, checked against the documents and the shipping code |
| `2026-08-05-security-redteam.md` | Red-team pass over the client, the live backend configuration, the ops scripts and the published surface |
