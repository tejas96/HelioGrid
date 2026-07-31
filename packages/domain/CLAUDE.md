# @heliogrid/domain — pure isomorphic domain logic

## What lives here / what must never live here
- Decision logic both platforms need: state machines as pure reducers, formatters,
  business invariants, calculations.
- NEVER: NestJS, React, React Native, storage, fetch, env reads, packages/db, packages/ui,
  or any app import. No side effects, no I/O, no clock reads at module scope.
- Rules, catalogs and market config arrive as INJECTED parameters. A module-level global
  (the POC's `resolveRules()` pattern) is the specific anti-pattern this package exists
  to prevent.
- **No test files here either.** An old dependency-cruiser comment claimed colocated tests
  live in this package; that predates the owner's no-unit-tests directive (2026-07-29) and
  was corrected when this package landed. The only executable checks are `tests/invariants/`
  and on-demand `scripts/`.

## Commands
pnpm --filter @heliogrid/domain typecheck | build

## Depends on / depended on by
uses: NOTHING in the workspace — this is the BOTTOM layer (owner ruling 2026-07-30, ADR-0021)
used by: packages/contracts, apps/web, apps/mobile, apps/api, apps/worker
A business enum both layers need is defined HERE as a pure union; contracts builds its
`z.enum` from it. Importing contracts from here is a package cycle, and both gates say so.

## Local conventions
- Reducers are `(state, event) => state` — total, synchronous, no timers. The APP owns
  timers, navigation, storage and rendering; the reducer owns the decision.
- Time enters as a parameter (`now: number`), never `Date.now()` inside a reducer — this is
  what makes behaviour reproducible and what stops RN's suspended-timer behaviour from
  becoming a platform special case.
- Every exported symbol is re-exported from `src/index.ts` (dependency-cruiser
  `package-index-only`).

## Landmines
- The package held no behaviour until 2026-08-01, and that was deliberate (ADR-0021). It
  existed so `domain-purity-no-layers` and `domain-purity-no-frameworks` were live before the
  code they police — until this package existed, both rules targeted a path matching nothing
  and a green cruise proved less than it looked like it did.
- **Unifying a type does not unify the behaviour behind it.** The login types landed here
  after both platforms drifted; the types now agree while RN still never produces one of the
  states (docs/13 UXG-PAR-01). When you collapse two copies into one, check what each side
  actually PRODUCED, not just what it declared.
- Remaining occupants, in order: the login state MACHINE (arrives with the auth rebuild —
  auth-tenancy ruling 6), then `formatInr` + E.164 display, then the invite/role invariants
  currently embedded in `apps/api` services.

## Definition of done here
Pure (cruiser purity rules green) · consumed by BOTH platforms where a mobile surface
exists (Law 7) · `pnpm turbo typecheck lint` green.
