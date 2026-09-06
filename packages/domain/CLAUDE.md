# @heliogrid/domain — pure isomorphic domain logic, the bottom layer

Deps: `architecture.md` §2 domain. This package imports nothing in the workspace. Contracts
derives from it (`z.enum(ROLE_PRESETS)`); importing contracts from here is a package cycle.

## What lives here / what must never live here

- Decision logic both platforms need: state machines as pure reducers, formatters, business
  invariants, calculations, and the AUTHORIZATION POLICY (`src/authz/`).
- **`src/authz/` is the whole permission model** — the twelve fixed presets, the capability
  matrix, OR-across-held-roles, and widest-wins visibility resolved PER DOMAIN. It is pure by
  design: no session, no tenant, no request. The API resolves the membership and passes the ROLES
  in; this decides. That is what lets the model be exercised without a server, and what stops a
  permission check quietly becoming a query.
- NEVER: NestJS, React, React Native, storage, fetch, an env read, `packages/db`, `packages/ui`,
  or any app import. No side effects, no I/O, no clock read at module scope.
- Rules, catalogs and market config arrive as INJECTED parameters. A module-level global is the
  specific anti-pattern this package exists to prevent.
- Unit tests live in `tests/`, never in `src/` — `tsc -b` compiles everything under `src/` into
  `dist/`, so a colocated test ships.

## Commands

```
pnpm --filter @heliogrid/domain typecheck | build     # typecheck covers src/ and tests/
```

## Local conventions

- Reducers are `(state, event) => state` — total, synchronous, no timers. The APP owns timers,
  navigation, storage and rendering; the reducer owns the decision.
- **Time enters as a parameter (`now: number`)**, never `Date.now()` inside a reducer. That is
  what makes behaviour reproducible and stops RN's suspended-timer behaviour becoming a platform
  special case. `new Date(…)` is banned here, parsing included: use `Date.parse` and pass the
  epoch to Intl (`M57`).
- **A capability matrix with a default is a matrix with a hole.** `CAPABILITY_MATRIX` writes out
  every cell, and `Record` is what makes a thirteenth preset a compile error in every row rather
  than a quiet `undefined`. A module appends its OWN capability rows when its slice begins
  (Law 9), in its own file beside `capabilities.ts`.
- **`format/pack.ts` is FLAT, and that is not a style choice.** The design system's pulled
  `MarketProvider` contract fixes `id`, `locale`, `currency`, `currencyFractionDigits`, `clock`
  and `taxIdLabel` as names, and `ds:contract` fails on a dropped one. Grouping them into
  sub-objects would make the design system and this package each declare a pack.
- **A market fact is a key on `MarketPack` (`market/pack.ts`), never a constant.** A key task
  adds its folder beside `format/`, its property on `MarketPack` and its India values on
  `IN_PACK`, and reaches `MarketCode` through `market/code` by path, never the market index;
  `market/launch.ts` reports what is still unauthored (`F1-05`). `MarketCode` and
  `PackVersion` are brands: obtain them from a pack, never by a cast (`M60`).
- **An amount is `MinorUnits` and a rate is `BasisPoints`** (`money/`), brands with one constructor
  each, and `money/` is the ONLY slice that rounds (`Q83`) — `applyRate` for a fraction of an
  amount, `amountForQuantity` for a quantity at a per-unit price — so BOM, proposal and invoice can
  only agree. `tax/breakdown.ts` is the one tax computation and `subsidy/amount.ts` the one incentive
  computation: a module that needs either calls it and never multiplies a rate itself.

## Done means

Pure (the cruiser purity rules green) · consumed by BOTH platforms where a mobile surface exists
(Law 7) · typecheck and lint green.
