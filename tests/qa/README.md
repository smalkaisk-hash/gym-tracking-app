# tests/qa — adversarial QA harness

`tests/exercise-identity.test.mjs` and `tests/sync-merge.test.mjs` document intended
behaviour and are expected to pass. **This directory is the opposite: it tries to break
the app, and a failure here is a finding, not a broken test.**

```bash
node tests/qa/fuzz.test.mjs             # everything
node tests/qa/fuzz.test.mjs units       # only suites whose name matches "units"
node tests/qa/fuzz.test.mjs --seed 42   # re-run a fuzz case reproducibly
```

Exit code is non-zero while any defect is unfixed, so it is not a CI gate until the
list is empty.

## It runs the real code

`load-app.mjs` reads `src/gym-tracker-app.tsx`, strips its imports, substitutes inert
stubs for React / lucide / recharts / the images / the Supabase client, appends an
`export {}` of every top-level binding, transpiles with the project's own TypeScript and
imports the result. Nested helpers (`mergeUnsynced`, defined inside `GymTrackerApp`) are
sliced out by name and compiled standalone.

The point is that nothing here is a copy. A failure means the shipped bytes are wrong.
The cost is that the loader is coupled to the source's shape: it assumes top-level
bindings sit at column 0 and that nested helpers close over nothing. If the app is
refactored and the loader throws, fix the loader — don't mirror the functions into the
test, which is exactly the failure mode this design exists to avoid.

What it cannot reach: anything that needs a DOM. Component state, effect ordering and
render output are out of scope — `key={i}` bugs and effect races are found by reading,
not by this file. Adding jsdom would extend the harness to those.

## Conventions

- Every check states the invariant it believes in, so a failure reads as
  "the app violates X", not "assertion 42 false".
- `survives(...)` asserts a call does not throw — throwing *is* the finding.
- Fuzzing uses a seeded LCG, never `Math.random`, so a failure is reproducible.
- `HOSTILE_NUM` / `HOSTILE_STR` / `HOSTILE_ANY` are the shared corpora: NaN, ±Infinity,
  `1e400`, prototype-chain keys (`constructor`, `__proto__`, `toString`), unicode digits,
  injection strings, throwing objects.
- The `regressions — confirmed defects` suite at the bottom encodes specific verified
  bugs with their repro in the failure detail. Those checks are written to pass once the
  bug is fixed, so they become the regression tests.

Keep unreachable premises out. A fuzz case that feeds an input the app cannot produce
(e.g. two rows sharing a uuid) is noise, and noise is what makes a suite get ignored.
