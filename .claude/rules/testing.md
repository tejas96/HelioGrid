---
paths:
  - "packages/*/tests/**"
  - "apps/*/tests/**"
  - "tests/**"
  - "vitest.config.mts"
---

# Testing law — which layers, one place, what a test proves

- **Unit tests cover the LOGIC layers** — the set `packages/config/unit-test-packages.json` names,
  which the runner and the dependency-cruiser rule both read; `data`'s hooks run through the real
  client (`packages/data/CLAUDE.md`). The frontend is not unit-tested: `ui`, `web` and `mobile` are
  proven by running them, `db` by migrations and `tests/invariants/`.
- **A unit test is `<package>/tests/**/*.test.ts`** — never `*.spec.*` (e2e only), `__tests__/` or
  `src/` (the build would ship it). A test imports `../../src/…`; `@heliogrid/<pkg>` resolves to the
  last BUILD.
- **Test the DECISION at its edges** — the boundary and one either side, the empty, the negative,
  the zero, as one `it.each` table per rule. Never test a type, a constant or a re-export. Never mock what this repo owns — an origin that answers `packages/data`'s real client in the contract's shapes stands for the contract, and is not a mock of the api. An invisible
  character (a no-break space, a zero-width space) is written as a `\u` escape.
- **A money, tenancy or permission rule, and a check a change adds or alters, is proven red once.**
  Break the rule its test names — never a neighbour or its input data — see the test fail BY NAME,
  then restore it. A lint rule or type is planted in every written form the bad line can take
  (with type arguments, through a member or an alias), not only the plain one. A crash or a compile error is not red. A test of a race FORCES its overlap — it holds
  a lock both sides need until both are seen waiting (`apps/api/tests/support/held-lock.ts`) —
  because two requests merely fired together mostly run one after the other.
- **Coverage is 100%** on the paths `vitest.config.mts`'s `thresholds` names; elsewhere read
  `pnpm test:coverage` for missed edges.
- **`apps/api/tests/` run only against a database that is theirs** — `heliogrid_ci` in CI,
  `heliogrid_test` locally (`infra/README.md`): off CI `vitest.config.mts` collects them only when
  both `DATABASE_URL` and `DATABASE_ADMIN_URL` name `heliogrid_test` and skips them with a warning
  otherwise; whenever they are collected (as with `CI` set) a URL naming `heliogrid_dev` throws
  before collection. One file runs locally on the test database with the line in `/task`
  (`.claude/skills/task/SKILL.md`, *Build*); `CI=1` is never the way in.
- **`tests/e2e/` is the regression suite** (`tests/e2e/CLAUDE.md`); it never replaces checking the
  running app.
- **Unit tests do not replace `tests/invariants/`.** An invariant proves a property of the SYSTEM
  against real state; a unit test proves one decision at its edges.
