# @heliogrid/invariants — the executable proof layer

Deps: `architecture.md` §2 tests/invariants. Importing both the wire and the schema is the POINT:
an invariant proves the seam between them.

## What lives here / what must never live here

- The locked invariant set: tenancy RLS, table tenancy scan, enum parity, schema parity,
  tenant-id-in-body, format rendering. **Additions require explicit owner approval** — the set is
  deliberately small so a green run means something.
- NEVER a unit test. Those live at `<package>/tests/**/*.test.ts` and prove one DECISION at its
  edges; an invariant proves a property of the SYSTEM against real state. Neither replaces the
  other.
- Never a fixture factory, a mock, or a helper library. An invariant that needs scaffolding to be
  readable is testing the wrong thing.

## Commands

```
pnpm --filter @heliogrid/invariants test     # needs DATABASE_URL
pnpm turbo test                              # the same, through the gate
```

## Local conventions

- **A skipped invariant that reports success is worse than no invariant.** `run.ts` skips loudly
  without `DATABASE_URL` and fails closed under CI. A green local `pnpm verify` on a machine with
  no database has NOT proven tenancy.
- **Vacuity is not a pass.** Over an empty schema the db-backed invariants have nothing to compare
  and say so explicitly. Read the output, not the exit code — five of six report VACUOUS today
  (`M12`–`M14`, `M17`, `M18`).
- **Static invariants run before the `DATABASE_URL` check**, so they never skip.
  `tenant-id-in-body` is the pattern: anything provable without a database goes above that early
  return.
- Db checks target the EXISTING local container. Never create a container or clone a database.
- **Injecting a violation into a workspace package proves nothing until you REBUILD it.** This
  package imports `@heliogrid/domain` as built `dist/`, so editing `src/` and re-running reports
  the old result — a false green that looks exactly like a passing check.

## Done means

The invariant fails on the violation it names — inject it once, watch it go red, then remove it,
and record the date in its `mechanisms.md` row. An invariant nobody has seen fail is a rule nobody
has verified.
