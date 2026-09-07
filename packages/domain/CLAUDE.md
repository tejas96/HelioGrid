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
- **`commerce/` is packaging, not a pack key** — the one folder beside the keys that is NOT one, so
  it sits outside `MarketPack`. It holds structure every market prices against, never a market fact.
  `costs.ts` is its other half: what the platform pays for instead of selling (`M97`).
- **A rate carries the cost it must clear** (`pricing/`). `WorstCaseCogs` sits on `UnitRate` and on
  each `ChannelRate`, never in a table beside them, so a rate cannot be authored without the figure
  that judges it (`M96`). It has no `verified` field and never gains one (`BM-26`).
- **A ruleset item declares `floor()` or `tenantDefault()`** (`calling/`), so an unclassified one
  is a compile error rather than a silent default-to-editable (`F1-17`). A time of day is
  `ClockTime`, minutes past midnight, carrying no zone — `F1-10` puts every comparison on the
  TENANT's clock and the caller holding the tenant applies it. `packages/ui`'s `TimeField` keeps
  its own parser: that one reads what a person types, not what the platform authors.
- **A pack LABEL is per language and a pack VOCABULARY is an open set** (`format/`). A label is a
  `PackLabel` — `en` required, the rest optional, because `F3-05` falls back to English and an
  unauthored Hindi label is a content gap, not a failure state. It lives on the pack rather than in
  `packages/i18n` so a label change stays a pack revision (`F1-11`, `Q87`), which is also why
  `UI_LANGUAGES` is authored HERE and contracts derives it. Stage, blocker, checklist and
  payment-mode keys are open-set strings validated against the pack (`F1-09`) — a reader returns
  `null` for an undeclared key and never guesses, because the machines that own them are not
  authored yet (Law 9). A never-translated name (`DISCOM`, `ALMM`, `GSTIN`) carries `en` alone.
- **An amount is `MinorUnits` and a rate is `BasisPoints`** (`money/`), brands with one constructor
  each, and `money/` is the ONLY slice that rounds (`Q83`) — `applyRate` for a fraction of an
  amount, `amountForQuantity` for a quantity at a per-unit price — so BOM, proposal and invoice can
  only agree. `tax/breakdown.ts` is the one tax computation and `subsidy/amount.ts` the one incentive
  computation: a module that needs either calls it and never multiplies a rate itself.

## Done means

Pure (the cruiser purity rules green) · consumed by BOTH platforms where a mobile surface exists
(Law 7) · typecheck and lint green.
