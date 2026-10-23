# @heliogrid/invariants — the executable proof layer

Deps: `architecture.md` §2 tests/invariants. Importing both the wire and the schema is the POINT:
an invariant proves the seam between them.

## What lives here / what must never live here

- The locked invariant set is the `run…` calls in `src/run.ts`; each lives in its own file in `src/`.
  **Additions require explicit owner approval** — the set is deliberately small so a green run
  means something.
- NEVER a unit test (`.claude/rules/testing.md`).
- Never a fixture factory, a mock, or a helper library. An invariant that needs scaffolding to be
  readable is testing the wrong thing. The shared files are `repo-root.ts`; `repo-files.ts`, the
  one file lister every static invariant reads the tree through; and one reader per document
  several checks read — `task-ledger.ts` (the task files), `screens-register.ts` (the screens
  register) and `prd-rows.ts` (the PRD's requirement rows).
- A repo-scanning invariant is a pure `find…(repo)` returning findings plus a `run…(repo)` that
  throws them, and it refuses an empty scan.

## Commands

```
pnpm --filter @heliogrid/invariants test     # db checks run on heliogrid_test: /task's test-database prefix first
pnpm turbo test                              # the same, through the gate
```

## Local conventions

- A check that needs no database goes above the `DATABASE_URL` early return in `run.ts`, so it
  never skips.
- Db checks target the EXISTING local container. Never create a container or clone a database.

## Done means

The red run on an injected violation goes in the PR body.

## Traps

- **Injecting a violation into a workspace package proves nothing until you REBUILD it.** This
  package imports `@heliogrid/domain` as built `dist/`, so editing `src/` and re-running reports
  the old result — a false green that looks exactly like a passing check.
