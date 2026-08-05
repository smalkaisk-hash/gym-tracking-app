# Third-party image credits and licences

**This directory holds no images.** It did until 2026-08-05, and this file is the record of
what was here, where it came from, and why it went. `tests/qa/fuzz.test.mjs` fails if an
image is imported by `src/` and has no entry below, because the thing that actually costs
money is not the licence — it is not being able to *show* you had one. That guard now
passes vacuously; keep it, because it is what makes re-adding an image without a record
impossible rather than merely discouraged.

## Why this file exists

Two exposures, and the second is the one that bit.

**Provenance.** Free stock sites carry re-uploaded work the uploader never had rights to.
The Pexels licence grants no indemnity, so if one of these was infringing at the moment it
was uploaded, the claim lands on the operator with no recourse. A record of where each file
came from, and when, is most of a good-faith defence and costs nothing to keep — which is
why deleting the files did not delete this page.

**Model releases — the sharper one.** Pexels does **not** obtain or supply model releases.
These were photographs of people, used to illustrate a *health and fitness* product. Using
an identifiable person's likeness in connection with health, fitness or medical products is
the standard carve-out in stock licences, precisely because it implies endorsement and
touches sensitive subject matter. In the EU (including Latvia) that engages personality
rights; in the US it engages right of publicity and false endorsement under Lanham Act
§ 43(a). A photograph of an identifiable person is also that person's personal data,
processed here with no recorded basis and no notice to them.

## The decision, and what it did

The `image_rights` entry in [launch-decisions.json](../compliance/launch-decisions.json) was
answered on **2026-08-05: drop the photographs entirely.** Not "swap the identifiable ones"
— the whole category. The day tiles now render as flat `bg-raised` surfaces, which the tile
markup already supported for the four splits that never had photos.

What that removed, beyond the legal question: `SessionType`'s `img`/`pos` fields, the
`<img>` branch and gradient scrim in the home-screen tile markup, and ~448 KB of JPEG from
`dist/` (8.8 MB before the downscaling pass below). Re-introducing a photograph now takes a
deliberate edit to `SPLITS`, the type and the markup — it is no longer one field on a tile —
and it re-opens this decision.

## What was here (provenance record)

`source` was reconstructed from the Pexels filename convention
(`pexels-<photographer>-[<user id>-]<photo id>.jpg`). Every ID below **was re-opened and
confirmed on 2026-08-05**: all four resolve, the photographer names match, and each is
offered under the Pexels licence. The `identifiable` column is a first-hand assessment of
the image itself, not a reading of the Pexels page — the previous version of this file
recorded **Yes** for all four, and that was wrong for two of them.

| File (deleted) | Photographer | Pexels photo ID | Used as | Identifiable person? | checked |
| --- | --- | --- | --- | --- | --- |
| `pexels-tima-miroshnichenko-5327522.jpg` | Tima Miroshnichenko | 5327522 | Push day tile | **Yes** — face front-lit and fully visible | 2026-08-05 |
| `pexels-zeal-creative-studios-58866141-34043598.jpg` | Zeal Creative Studios | 34043598 | Pull day tile | **No** — pure back view, no face in frame | 2026-08-05 |
| `pexels-kong-khawlhring-3896794-5799855.jpg` | Kong Khawlhring | 5799855 | Legs day tile | **Yes** — face visible in three-quarter profile | 2026-08-05 |
| `pexels-koolshooters-8544616.jpg` | KoolShooters | 8544616 | Custom day tile | **Partly** — capped, head down, jaw and beard visible; recognisable to someone who knows him | 2026-08-05 |

Photo IDs resolve at `https://www.pexels.com/photo/<id>/`.

A fifth file (`pexels-marcuschanmedia-18060020.jpg`, Marcus Chan, photo ID 18060020) was
carried here unimported and was **deleted on 2026-08-05**. It is recorded rather than simply
dropped: it shipped in the repository's history, so the provenance question survives the
deletion even though the exposure does not. Recover it from git if it is ever wanted.

### The deleted files were downscaled derivatives, not the Pexels originals

Each of the four was **resized on 2026-08-05** from its 4.5–6k-pixel-wide original to
**1200px wide, JPEG quality 82** — together 8.8 MB → 448 KB — shortly before the decision
above removed them. Two consequences that outlive the files:

- **The photo IDs above still identify the source correctly**, but a byte-for-byte
  comparison against either the Pexels download or `git show` will not match. That is
  expected, not a broken record — and note that only the *originals* reached a commit, so
  the downscaled derivatives are not recoverable from git.
- **Modification is permitted** by the Pexels licence — what it forbids is selling
  *unaltered* copies, which is not what was happening. Downscaling never touched the
  model-release question, which is about the depiction, not the resolution.

## Licence

All four were used under the [Pexels licence](https://www.pexels.com/license/): free for
commercial and non-commercial use, no attribution required (this file is kept anyway,
because "no attribution required" is not the same as "no record needed"). The licence does
not permit selling unaltered copies, does not supply model releases, and does not allow
imagery to be used in a way that implies endorsement by the people in it.

## Before launch

- [x] Re-open each photo ID, confirm it is still available under the Pexels licence, and
      fill in the `checked` column — done 2026-08-05, all four confirmed.
- [x] Read the Pexels licence against the **health and fitness** use specifically — done;
      it is the model-release carve-out described above, and it is what the decision turned
      on.
- [x] Decide, deliberately, whether to keep photographs of identifiable faces or replace
      them with images where no one is recognisable. This is the `image_rights` entry in
      [launch-decisions.json](../compliance/launch-decisions.json). **Answered 2026-08-05:
      dropped entirely.**
- [x] Delete the unused fifth image — done 2026-08-05, see above.

## If you ever add an image back

1. Add the file here and a row to the table above, in the same change that imports it —
   `fuzz.test.mjs` enforces this.
2. Re-open `image_rights` in `launch-decisions.json`. It is answered for *no images*; an
   image makes the answer stale, and `check:decisions` cannot notice that on its own.
3. Prefer a shot where no face is recognisable. That is what makes the whole section above
   moot, and for tiles showing equipment and movement it costs nothing visually.
