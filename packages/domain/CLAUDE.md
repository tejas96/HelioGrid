# @heliogrid/domain — pure isomorphic domain logic

## What lives here / what must never live here
- Decision logic both platforms need: state machines as pure reducers, formatters,
  business invariants, calculations, and the AUTHORIZATION POLICY (`src/authz/`).
- **`src/authz/` is the whole permission model** — the twelve fixed presets, the capability
  matrix, OR-across-held-roles, and widest-wins visibility resolved PER DOMAIN
  (`docs/prd/foundations/F2-roles-and-permissions.md`). It is pure by design: no session, no
  tenant, no request. The API resolves the current membership and passes the ROLES in; this
  decides. That is what lets the model be exercised without a server, and what stops a
  permission check quietly becoming a query.
- NEVER: NestJS, React, React Native, storage, fetch, env reads, packages/db, packages/ui,
  or any app import. No side effects, no I/O, no clock reads at module scope.
- Rules, catalogs and market config arrive as INJECTED parameters. A module-level global
  (the POC's `resolveRules()` pattern) is the specific anti-pattern this package exists
  to prevent.
- **Unit tests live in `tests/`, never in `src/`** (owner ruling 2026-09-03). `tsc -b` compiles
  everything under `src/` into `dist/`, so a colocated test ships. `tests/tsconfig.json` is its
  own project and `pnpm --filter @heliogrid/domain typecheck` runs both. A test imports
  `../../src/…`; `@heliogrid/domain` would resolve to `dist/` and test the last build.

## Commands
pnpm --filter @heliogrid/domain typecheck | build

## Dependency policy
docs/engineering/architecture.md §2 domain. This is the BOTTOM layer — it imports nothing in the
workspace (owner ruling 2026-07-30). The contracts edge is LIVE again since 2026-08-25:
`rolePresetSchema` is `z.enum(ROLE_PRESETS)` built from this package's tuple.
A business enum both layers need is defined HERE as a pure union; contracts then builds its
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
- The package held no behaviour until 2026-07-31, and that was deliberate. It
  existed so `domain-purity-no-layers` and `domain-purity-no-frameworks` were live before the
  code they police — until this package existed, both rules targeted a path matching nothing
  and a green cruise proved less than it looked like it did.
- **A shared type does not prove shared behaviour — read both call sites, not both
  declarations.** The login types landed here after the two platforms drifted. Reading only the
  declarations produced a WRONG finding: one platform reached the same
  outcome through a differently-named variable, so it looked absent and was not. Unifying a type
  narrows where drift can hide; it does not tell you what each side actually does.
- **A capability matrix with a default is a matrix with a hole.** `CAPABILITY_MATRIX` is
  `Record<Capability, Record<RolePreset, CapabilityGrant>>` with every cell written out —
  60 of them for M01 alone. That is deliberate and must stay: an unstated cell is exactly how
  a permission silently appears, and `Record` is what makes a thirteenth preset a compile
  error in every row rather than a quiet `undefined`.
- **A module appends its OWN capability rows when its slice begins** (Law 9), in its own file
  beside `capabilities.ts`. The visibility matrix is empty on purpose: M01's rows are all
  acts, and an unlanded domain resolves to `none`, which is fail-closed and correct.
- Landed so far: the authorization policy (`authz/`), login flow types + behavioural constants
  (`auth/login-state.ts`, `auth/login-policy.ts`), the OTP protocol constants (`auth/otp.ts`),
  `TENANT_SEGMENTS` (`tenancy/segment.ts`), and the FORMAT slice (`format/`) — `pack.formats`
  and the four single implementations, money and date and phone display among them. Still to
  come: the login state MACHINE (arrives with the auth rebuild — auth-tenancy ruling 6), then
  the invite/role invariants currently embedded in `apps/api` services.
- **`format/pack.ts` is FLAT, and that is not a style choice.** The design system's pulled
  `MarketProvider` contract fixes `id`, `locale`, `currency`, `currencyFractionDigits`, `clock`
  and `taxIdLabel` as names, and `ds:contract` fails on a dropped one. Grouping them into
  sub-objects would make the DS and this package each declare a pack — the duplicate the slice
  removed.
- **`new Date(…)` is banned here, parsing included** (`check:adherence`, ADR-0021). Use
  `Date.parse` and pass the epoch to Intl; constructing a Date is how a clock read gets in.

## Definition of done here
Pure (cruiser purity rules green) · consumed by BOTH platforms where a mobile surface
exists (Law 7) · `pnpm turbo typecheck lint` green.
