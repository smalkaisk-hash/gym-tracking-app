# Third-party image credits and licences

Every image file in this directory is listed here. `tests/qa/fuzz.test.mjs` fails if an
image is imported by `src/` and has no entry below, because the thing that actually costs
money is not the licence — it is not being able to *show* you had one.

## Why this file exists

Two exposures, and the second is the one that bites.

**Provenance.** Free stock sites carry re-uploaded work the uploader never had rights to.
The Pexels licence grants no indemnity, so if one of these was infringing at the moment it
was uploaded, the claim lands on the operator with no recourse. A record of where each file
came from, and when, is most of a good-faith defence and costs nothing to keep.

**Model releases — the sharper one.** Pexels does **not** obtain or supply model releases.
These are photographs of identifiable people, and FitPulse uses them to illustrate a *health
and fitness* product. Using an identifiable person's likeness in connection with health,
fitness or medical products is the standard carve-out in stock licences, precisely because
it implies endorsement and touches sensitive subject matter. In the EU (including Latvia)
that engages personality rights; in the US it engages right of publicity and false
endorsement under Lanham Act § 43(a). A photograph of an identifiable person is also that
person's personal data, processed here with no recorded basis and no notice to them.

**The cheap mitigation is to prefer images where no face is identifiable.** For tiles
showing equipment and movement this costs nothing visually and removes the whole category
of risk. Where a face is identifiable, the `identifiable` column below says so, and that is
a decision to take deliberately rather than by default.

## Files

`source` is reconstructed from the Pexels filename convention
(`pexels-<photographer>-[<user id>-]<photo id>.jpg`), so the photo IDs are reliable but the
canonical URLs have **not** been re-opened and confirmed. Verify each before launch and put
the date in the `checked` column — an unverified row is a guess, the same standard
`compliance/verified.json` applies to external claims.

| File | Photographer | Pexels photo ID | Used as | Identifiable person? | checked |
| --- | --- | --- | --- | --- | --- |
| `pexels-tima-miroshnichenko-5327522.jpg` | Tima Miroshnichenko | 5327522 | Push day tile | **Yes** | — |
| `pexels-zeal-creative-studios-58866141-34043598.jpg` | Zeal Creative Studios | 34043598 | Pull day tile | **Yes** | — |
| `pexels-kong-khawlhring-3896794-5799855.jpg` | Kong Khawlhring | 5799855 | Legs day tile | **Yes** | — |
| `pexels-koolshooters-8544616.jpg` | KoolShooters | 8544616 | Custom day tile | **Yes** | — |
| `pexels-marcuschanmedia-18060020.jpg` | Marcus Chan | 18060020 | **Unused** — not imported by `src/`, so it is not bundled into `dist/` | — | — |

Photo IDs resolve at `https://www.pexels.com/photo/<id>/`.

## Licence

All five are used under the [Pexels licence](https://www.pexels.com/license/): free for
commercial and non-commercial use, no attribution required (this file is kept anyway,
because "no attribution required" is not the same as "no record needed"). The licence does
not permit selling unaltered copies, does not supply model releases, and does not allow
imagery to be used in a way that implies endorsement by the people in it.

## Before launch

- [ ] Re-open each photo ID, confirm it is still available under the Pexels licence, and
      fill in the `checked` column.
- [ ] Read the Pexels licence against the **health and fitness** use specifically.
- [ ] Decide, deliberately, whether to keep photographs of identifiable faces or replace
      them with images where no one is recognisable.
- [ ] Delete `pexels-marcuschanmedia-18060020.jpg` if it is genuinely unused, or import it.
