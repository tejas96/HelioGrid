# @heliogrid/invariants — the executable proof layer

## What lives here / what must never live here
- The locked invariant set: tenancy RLS, table tenancy scan, enum parity, schema parity,
  tenant-id-in-body. **Additions require explicit owner approval** — the set is deliberately
  small so a green run means something.
- NEVER a unit test: no `.test.*`, no `.spec.*` (owner directive 2026-07-29, hook-blocked).
  An invariant proves a property of the SYSTEM against a real database or the real contract;
  it does not exercise a function.
- Never a fixture factory, a mock, or a helper library. An invariant needing scaffolding to
  be readable is testing the wrong thing.

## Commands
pnpm --filter @heliogrid/invariants test    # needs DATABASE_URL
pnpm turbo test                             # the same, through the gate

## Dependency policy
docs/architecture.md §2 tests/invariants. Importing both the wire and the schema is the
POINT — an invariant proves the seam between them.

## Landmines
- **A skipped invariant that reports success is worse than no invariant.** `run.ts` skips
  loudly without `DATABASE_URL` and fails closed under `CI`. A green local `pnpm verify` on a
  machine with no database has NOT proven tenancy.
- **Vacuity is not a pass.** With an empty schema, the db-backed invariants have nothing to
  compare and say so explicitly; `tenant-id-in-body` does the same while no route declares a
  body. Read the output, not the exit code.
- **Static invariants run before the DATABASE_URL check**, so they never skip.
  `tenant-id-in-body` is the pattern: put anything provable without a database above that
  early return.
- Db checks target the existing `heliogrid-pg-local` container (postgres:16, port 5544).
  Never create a container or clone a database (owner ruling 2026-08-03).

## Definition of done here
The invariant fails on the violation it names — inject the violation once, watch it go red,
then remove it. An invariant nobody has seen fail is a rule nobody has verified.
