# @heliogrid/invariants — the executable proof layer

## What lives here / what must never live here

- The invariant set is the `run…` calls in `src/run.ts`; each lives in its own file in `src/`. A
  new invariant is added only for a property no lint rule, type or test can hold, and its PR says
  why.
- Never a fixture factory, a mock, or a helper library. An invariant that needs scaffolding to be
  readable is testing the wrong thing. The shared files are those another check imports; a new
  static invariant reads the tree through `repo-files.ts`.
- A new repo-scanning invariant is a pure `find…(repo)` returning findings plus a `run…(repo)` that
  throws them, and it refuses an empty scan.

## Commands

```
pnpm --filter @heliogrid/invariants test     # reads the BUILT packages as they stand
pnpm turbo test                              # builds the packages first (`^build`), then runs
```

Both need the test-database prefix (`CLAUDE.md` §5).

## Local conventions

- A check that needs no database goes above the `DATABASE_URL` early return in `run.ts`, so it
  never skips.
- Db checks target the EXISTING local container. Never create a container or clone a database.

## Traps

- **A violation planted in a workspace package proves nothing until that package is REBUILT:**
  this package imports `@heliogrid/domain` from its `dist/`, so `--filter … test` after editing
  `src/` reports the old result — a false green. Run it through `pnpm turbo test`.
