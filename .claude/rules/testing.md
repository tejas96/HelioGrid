---
paths:
  - "packages/*/tests/**"
  - "apps/*/tests/**"
  - "tests/**"
  - "vitest.config.mts"
---

# Testing law — which layers, one place, what a test proves

The rule for every unit test in the repo. `CLAUDE.md` §8 points here; `mechanisms.md` says what
holds each line and how much of it.

- **Unit tests cover the LOGIC layers** — `domain` · `contracts` · `forms` · `api` · `worker` ·
  `i18n`'s `runtime.ts` alone (the fallback and the per-reader translator have edges running
  cannot see; its provider, loaders and polyfills are proven by running). Not
  the frontend: `ui`, `web` and `mobile` are proven by running them, `data` by driving the real
  client, `db` by migrations and `tests/invariants/`.
- **One name, one place: `<package>/tests/**/*.test.ts`** — never `*.spec.*`, never `__tests__/`,
  never inside `src/`, where the package's own `tsc -b` compiles the test into `dist/` and ships
  it. A test imports `../../src/…`; `@heliogrid/<pkg>` resolves to the last BUILD.
- **Test the DECISION at its edges** — the boundary and one either side, the empty, the negative,
  the zero, as one `it.each` table per rule. A test that restates the implementation proves
  nothing. Never test a type, a constant or a re-export: an `expect` whose subject is an imported
  constant (`expect(TIERS)…`) is the restatement, and what the type already guarantees needs no
  test. A test named for a book or a pack reads that book; a table of literals that never touches
  the source is a second copy of it. Never mock what this repo owns.
- **Coverage lands WITH the slice** (Law 9), per glob, at 100% (`M71`).
- **Unit tests do not replace `tests/invariants/`.** An invariant proves a property of the SYSTEM
  against real state; a unit test proves one decision at its edges. Neither substitutes for the
  other.
