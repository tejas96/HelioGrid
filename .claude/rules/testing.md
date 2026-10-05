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
- **A unit test is `<package>/tests/**/*.test.ts`** — never `*.spec.*` (e2e only), `__tests__/` or
  `src/` (the build would ship it). A test imports `../../src/…`; `@heliogrid/<pkg>` resolves to the
  last BUILD.
- **Test the DECISION at its edges** — the boundary and one either side, the empty, the negative,
  the zero, as one `it.each` table per rule. Never test a type, a constant or a re-export. Never mock what this repo owns. An invisible
  character (a no-break space, a zero-width space) is written as a `\u` escape.
- **A money, tenancy or permission rule, and a check a change adds or alters, is proven red once.**
  Break the rule its test names — never a neighbour or its input data — see the test fail BY NAME,
  then restore it. A crash or a compile error is not red. A test of a race FORCES its overlap — it holds
  a lock both sides need until both are seen waiting (`apps/api/tests/support/held-lock.ts`) —
  because two requests merely fired together mostly run one after the other.
- **Coverage is 100%** in `packages/domain/src/` `money`, `tax`, `subsidy`, `pricing`, `authz` and
  `commerce/tranche-allocation.ts` (vitest thresholds); elsewhere read `pnpm test:coverage` for
  missed edges.
- **`apps/api/tests/` run only against a database that is theirs** — `heliogrid_ci` in CI,
  `heliogrid_test` locally (`infra/README.md`): off CI `vitest.config.mts` collects them only when
  both `DATABASE_URL` and `DATABASE_ADMIN_URL` name `heliogrid_test` and skips them with a warning
  otherwise; whenever they are collected (as with `CI` set) a URL naming `heliogrid_dev` throws
  before collection. One file runs locally with `pnpm exec vitest run <file>` on the test
  database; `CI=1` is never the way in.
- **`tests/e2e/` is the regression suite** (`tests/e2e/CLAUDE.md`); it never replaces checking the
  running app.
- **Unit tests do not replace `tests/invariants/`.** An invariant proves a property of the SYSTEM
  against real state; a unit test proves one decision at its edges.
