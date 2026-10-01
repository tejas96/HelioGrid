---
paths:
  - "packages/*/tests/**"
  - "apps/*/tests/**"
  - "tests/**"
  - "vitest.config.mts"
---

# Testing law — which layers, one place, what a test proves

- **Unit tests cover the LOGIC layers** — `domain`, `contracts`, `forms`, `api`, `worker`, and
  `i18n`'s `runtime.ts` and its `copy/` functions. Not the frontend: `ui`, `web` and `mobile` are
  proven by running them, `data` by driving the real client, `db` by migrations and
  `tests/invariants/`. The set is written once, in `packages/config/unit-test-packages.json`, which
  the runner and the dependency-cruiser rule both read; changing the set changes this line and that
  file together.
- **One name, one place: `<package>/tests/**/*.test.ts`** — never `*.spec.*` (the regression
  suite's name), never `__tests__/`, never inside `src/`, where the package's build would compile the
  test into `dist/` and ship it. A test imports `../../src/…`; `@heliogrid/<pkg>` resolves to the
  last BUILD.
- **Test the DECISION at its edges** — the boundary and one either side, the empty, the negative,
  the zero, as one `it.each` table per rule. A test that restates the implementation proves nothing.
  Never test a type, a constant or a re-export. Never mock what this repo owns. An invisible
  character (a no-break space, a zero-width space) is written as a `\u` escape.
- **A money, tenancy or permission rule, and a check a change adds or alters, is proven red once.**
  Break the rule its test names — never a neighbour or its input data — see the test fail BY NAME,
  then restore it. A crash or a compile error is not red. At `/ship` the code reviewer names the
  break and the main session runs it (`/ship` step 5). A test of a race FORCES its overlap — it holds
  a lock both sides need until both are seen waiting (`apps/api/tests/support/held-lock.ts`) —
  because two requests merely fired together mostly run one after the other.
- **Coverage is 100% where a wrong number costs money or leaks data** — under
  `packages/domain/src/`: `money/**`, `tax/**`, `subsidy/**`, `pricing/**`, `authz/**` and
  `commerce/tranche-allocation.ts`. Elsewhere it is reported, never failing: read
  `pnpm test:coverage` for the edge you missed.
- **The regression suite, `tests/e2e/`, proves a shipped flow keeps working** — every web route and
  phone screen has a flow (the `e2e-flow-per-screen` invariant holds that), and the `packages/ui`
  web halves are mounted with the app's stylesheets. Its specs are `web/*.spec.ts` and
  `components/*.spec.tsx` there, and nowhere else. It never replaces the QA agents, which prove what
  a change makes new.
- **Unit tests do not replace `tests/invariants/`.** An invariant proves a property of the SYSTEM
  against real state; a unit test proves one decision at its edges.
