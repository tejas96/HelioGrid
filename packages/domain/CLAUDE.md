# @heliogrid/domain — pure isomorphic domain logic, the bottom layer

Imports no workspace package except build config. Contracts derives from this package
(`z.enum(ROLE_PRESETS)`), so importing contracts here is a cycle.

## What lives here / what must never live here

- `src/authz/` is the whole permission model (presets, capability matrix, OR across held roles,
  widest-wins visibility per domain). It takes ROLES in and never reads a session, tenant or
  request.
- NEVER a framework (NestJS, React, React Native), storage, or any I/O. Biome refuses clocks,
  timers, `crypto` and `node:` imports here.
- Rules, catalogs and market config arrive as INJECTED parameters. A module-level global is the
  specific anti-pattern this package exists to prevent.
- **Two entries: the index every device bundles, and `./server` (`src/server.ts`) for `apps/api` and
  `apps/worker` alone** (`F4-04`: no device computes a money figure). A function that works
  out a NEW money figure goes on `./server` only, even one that returns just a verdict about it
  (`clearsCogsFloor`), and so does a business-identifier formatter when one is written. Its TYPES
  stay on the index, because a screen renders what the server sent. Minting the brand, reading a
  figure out of a pack and labelling a figure one is handed compute nothing and stay on the index,
  each named with its reason on the reviewed list in `tests/money/device-entry.test.ts`.

## Local conventions

- Reducers are `(state, event) => state` — total, synchronous, no timers. `packages/data`'s hook
  owns timers and I/O, the app navigation and rendering; the reducer owns the decision.
- Parse a date with `Date.parse` and pass the epoch to Intl (Biome refuses `new Date` and
  `Date.now` here).
- Capability rows live in `authz/<area>.ts`, one file per product area named for what it holds
  (`survey.ts`, never `m04.ts`), joined in `capabilities.ts` and `visibility.ts`. A module adds its
  rows to its own file when its slice begins. Write every cell; never add a default.
- Keep `format/pack.ts` flat: the design system's `MarketProvider` fixes `id`, `locale`,
  `currency`, `currencyFractionDigits`, `clock` and `taxIdLabel`, and `design-system-props` fails
  on a dropped one.
- **A market fact is a key on `MarketPack` (`market/pack.ts`), never a constant.** A new key adds
  its folder beside `format/`, its property on `MarketPack` and India's values on `IN_PACK`, and
  imports `MarketCode` from `market/code` by path, never the market index.
- `commerce/` holds packaging every market prices against — never a market fact — so it is not a
  `MarketPack` key. A repricing reaches a price-protected tenant at once only when it takes nothing
  away (`BM-42`); otherwise it waits until the protection ends.
- This package has no clock, so a billing fact is authored in its own unit, never as an instant:
  the trial is in DAYS, and the soft-block matrix is keyed by PHASE. Turning one into a moment
  needs the tenant's clock (`F1-10`), held by `M12`.
- `WorstCaseCogs` sits on each `UnitRate` and `ChannelRate`, never in a separate table, and never
  gains a `verified` field (`BM-26`).
- **A ruleset item declares `floor()` or `tenantDefault()`** (`calling/`), so an unclassified one
  is a compile error rather than a silent default-to-editable (`F1-17`). A time of day is
  `ClockTime`, minutes past midnight, carrying no zone — `F1-10` puts every comparison on the
  TENANT's clock and the caller holding the tenant applies it. `packages/ui`'s `TimeField` keeps
  its own parser: that one reads what a person types, not what the platform authors.
- A pack label is a `PackLabel`: `en` required, other languages optional (an unauthored Hindi
  label falls back to English, `F3-05`). Labels live on the pack, not in `packages/i18n`, so
  `UI_LANGUAGES` is authored here. Stage, blocker, checklist and payment-mode keys are open-set
  strings checked against the pack: a reader returns `null` for an unknown key. A tenant's own
  words go through `authoredIn`, never `inLanguage` (`F3-10`); only review holds this.
- **An amount is `MinorUnits` and a rate is `BasisPoints`** (`money/`), brands with one constructor
  each, and `money/` is the ONLY slice that rounds — `applyRate` for a fraction of an
  amount, `amountForQuantity` for a quantity at a per-unit price — so BOM, proposal and invoice can
  only agree. `tax/breakdown.ts` is the one tax computation and `subsidy/amount.ts` the one incentive
  computation: a module that needs either calls it and never multiplies a rate itself. All of
  these compute, so all of them are on `./server`.

## Done means

Consumed by both platforms wherever a mobile surface exists.
