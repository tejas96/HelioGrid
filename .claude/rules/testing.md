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
  `i18n`'s `runtime.ts` and its `copy/` functions (the fallback, the per-reader translator and a
  function that chooses words from facts all have edges running cannot see; its provider, loaders
  and polyfills are proven by running). Not the frontend: `ui`, `web` and `mobile` are proven by
  running them, `data` by driving the real client, `db` by migrations and `tests/invariants/`. That
  set is machine-readable in `packages/config/unit-test-packages.json`, which the runner, the
  adherence check and the boundary rule all read; changing the set means changing this line AND
  that file, and nothing else restates it.
- **One name, one place: `<package>/tests/**/*.test.ts`** — never `*.spec.*`, never `__tests__/`,
  never inside `src/`, where the package's own build compiles the test into `dist/` and ships
  it. A test imports `../../src/…`; `@heliogrid/<pkg>` resolves to the last BUILD.
- **Test the DECISION at its edges** — the boundary and one either side, the empty, the negative,
  the zero, as one `it.each` table per rule. A test that restates the implementation proves
  nothing. Never test a type, a constant or a re-export: an `expect` whose subject is an imported
  constant (`expect(TIERS)…`) is the restatement, and what the type already guarantees needs no
  test. A test named for a book or a pack reads that book; a table of literals that never touches
  the source is a second copy of it. Never mock what this repo owns. An invisible character (a
  no-break space, a zero-width space, a soft hyphen) is written as a `\u` escape, never literally.
- **A red proof is owed for a money, tenancy, permission or safety rule, and for a gate a change
  adds or alters.** Before such a test is trusted, the rule its case names — never a neighbour or its
  input data; a type's rule under `tsc` — is broken and the test is seen to fail, then restored. A
  test that has only ever passed may be passing on the wrong thing: an assertion on an error MESSAGE
  matched the query it echoed back and would have passed on our own text forever — the database's
  verdict code was the fact. A guard with two branches is made red on each; a `@ts-expect-error`
  guard states every field but the one it guards, so a new required field cannot fail it for another
  reason. The red run is recorded against the case it proves — `scripts/break-and-run.sh --task
  <T-id> --claims <C1,D2>` — never typed, and refused under a case whose line does not name that
  test. Everywhere else a red run is welcome, never owed.
- **One break at a time, through `scripts/break-and-run.sh`.** It runs the test once unbroken — a
  test that already fails proves nothing — then saves the file, applies the one break, runs the
  guarding test, copies the saved file BACK — a restore by reverse edit can land on another
  occurrence and leave a break behind — and fails unless the whole tree came back, new untracked
  files included. A second break laid over an unrestored first one proves neither. `--build <pkg>`
  rebuilds around the break when the test reads another package's build. It runs from the repo root,
  so `--test-file` is the root-relative path vitest names.
- **A red proof must hold, not happen.** EVERY run goes red BY NAME — three or more under `--expect`
  (a race red once has not held), one or more under `--pattern` for a runner that reads only files,
  three for an invariant, which reads the database — the test named on a vitest `FAIL` line, or the
  `--pattern` in the output of a runner that names nothing — so a crash, a missing file or a
  compile error never counts as red (`M140`). A proof whose test or file changed since is not
  trusted: `scripts/break-and-run.sh --stale <T-id>` lists it, and it runs again. A test of a race FORCES its
  overlap — it holds a lock both sides need until both are seen waiting
  (`apps/api/tests/support/held-lock.ts`) — because two requests merely fired together mostly run
  one after the other, and a test that hopes they overlap stays green with its lock removed. A
  break a reviewer names that the author did not is run the same way and written into the ticket.
- **Coverage is 100% where a wrong number costs money or leaks data** — under `packages/domain/src/`,
  `money/**`, `tax/**`, `subsidy/**`, `pricing/**`, `authz/**` and `commerce/tranche-allocation.ts`
  (`M71`). Everywhere else it is reported, never failing: read `pnpm test:coverage` for the edge you
  missed.
- **Unit tests do not replace `tests/invariants/`.** An invariant proves a property of the SYSTEM
  against real state; a unit test proves one decision at its edges. Neither substitutes for the
  other.
