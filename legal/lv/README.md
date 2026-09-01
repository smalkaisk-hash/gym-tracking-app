# Latvian convenience translations (`lv/`)

English is the **authoritative** version of every document — `TERMS.md` § 19.9 says so, and
each translated page carries a banner repeating it. These translations exist because
Latvia's Official Language Law expects consumer-facing information from a Latvian-established
trader to be available in Latvian. They are published **alongside** the English pages, at
`/lv/<slug>.html`, never instead of them.

The app UI stays English. The only cross-links are the "Latviski" / "English" switcher in
each page header and the footer.

## Pipeline

`scripts/build-legal.mjs` → `TRANSLATIONS`. A slug listed in `TRANSLATIONS[lv].slugs` MUST
have a `legal/lv/<FILE>.md` mirroring the English file name, or the build fails. The footer
and the English-page language link are derived from that list, so an untranslated document
is simply not offered in Latvian rather than linking to a 404.

The same strict parser and the same draft / `{{FILL}}` enforcement apply: `legal/lv/PRIVACY.md`
must carry the English file's `<!-- legal:draft -->` marker and its placeholder spots until
the static host is chosen.

## Status

| Document | Translated | Professionally reviewed |
| --- | --- | --- |
| `DELETE-ACCOUNT.md` | ✅ 2026-09-01 | ⬜ not yet |
| `FAQ.md` | ✅ 2026-09-01 | ⬜ not yet (informational — lower priority) |
| `PRIVACY.md` | ✅ 2026-09-01 (mirrors the English draft state — same `{{FILL}}` spots) | ⬜ **needed before the banner comes off** |
| `TERMS.md` | ✅ 2026-09-01 | ⬜ **needed before the banner comes off — §§ 9, 13, 14** |
| `CONSUMER-HEALTH-DATA-PRIVACY.md` | ➖ not translated on purpose — Washington State notice, no Latvian relevance | — |

`TERMS.md` § 19.9 was rewritten in the same change: English is now expressly the
authoritative version, with a link to `/lv/terms.html` and a consumer carve-out.

**Before any banner comes off:** a Latvian legal translator or a bilingual lawyer must
review at least `TERMS.md` §§ 9, 13, 14 (assumption of risk, warranties, liability cap) and
the whole of `PRIVACY.md` (health data). The FAQ and deletion page are informational and
lower stakes, but still worth a read.

## Keeping versions in step

When `TERMS_VERSION` / `POLICY_VERSION` in `src/gym-tracker-app.tsx` changes, or an English
`legal/*.md` is edited, the matching `legal/lv/*.md` must be re-translated **in the same
release**. `TERMS.md` § 19.9 promises "we also publish a Latvian translation"; a stale
translation makes that untrue. There is no automated check for drift between the two
languages yet — treat it as a manual step in any legal edit.

## Glossary (keep consistent across documents)

| English | Latvian |
| --- | --- |
| Terms of Service | Lietošanas noteikumi |
| Privacy Policy | Privātuma politika |
| workout / session | treniņš / sesija |
| exercise | vingrojums |
| set (of reps) | piegājiens |
| reps | atkārtojumi |
| body weight | ķermeņa svars |
| weigh-in | svēršanās |
| training split | treniņu sadalījums |
| dashboard | informācijas panelis |
| widget | logrīks |
| offline cache | bezsaistes kešatmiņa |
| to sign out | izrakstīties |
| consent | piekrišana |
| health data | veselības dati |
| backup (file) | dublējums / dublējumkopija |
| data controller | pārzinis |
| data processor | apstrādātājs |
| GDPR | VDAR |
| retention period | glabāšanas periods |

UI labels that appear on-screen in English (`Finish`, `Retry`, `Rename days`, `Forgot
password?`, `Not synced`) are left in English in the translations, in backticks or quotes,
because that is what the user actually sees in the app.
