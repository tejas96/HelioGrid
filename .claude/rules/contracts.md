---
paths:
  - "packages/contracts/**/*.ts"
---

# packages/contracts — the API review surface

Package shape, entry points and the full convention list are `packages/contracts/CLAUDE.md`.
Changing a contract has a sequence: run `/contract-change`.

## Where files go

```
src/<area>.ts               one router per feature area, mounted in src/index.ts
src/common.ts               shared sets and schemas
src/error.ts                the canonical error envelope
src/workflows/              Temporal workflow message schemas — the ./workflows subpath
src/ports/<capability>.ts   a provider port interface and its DI token
src/index.ts                the only entry consumers import
openapi/openapi.json        emitted, committed, checked by M25 — never hand-edited
```

## Rules

- **The contract diff comes FIRST.** Change this package before implementing an endpoint or a
  client. The diff IS the API review (Law 3).
- **Tenant identity never travels on the wire** (`M14`).
- **One `z.enum` per business set**, exported with its inferred type. Consumers import the type;
  they never re-declare the values. A UI status or variant map is `Record<TheEnum, …>`, so a new
  value fails to compile rather than rendering blank.
- pgEnum values in `packages/db` hand-mirror these lists, because `db-no-upward` forbids the
  import. Change both sides in the same slice, via `/migration` (`M17`).
- Money crosses the wire as a decimal string scaled to the currency's minor unit, never a float;
  a money-bearing payload carries `currency_code` at document level.
- Every non-2xx response uses the canonical envelope. A route declaring a NON-base error code
  needs `ContractException` with that literal on the server, or the wire silently carries the
  wrong code with a green typecheck.
- **A protocol constant a SCREEN needs lives in `@heliogrid/domain`** and a contract IMPORTS it —
  domain is the bottom layer. Two things that are NOT that: a MARKET fact (calling code,
  national-number grouping and length) belongs to `pack.formats`; and a WIRE fact no screen ever
  sees belongs HERE, because contracts is the wire truth and domain is business truth.
- Zod is pinned at 3.x and `zod/v4` is banned. Do not lift the pin.

## Cross-cutting concerns are built in, never retrofitted

Anything that will reach every module later — permissions, tenancy, money, audit, i18n — is
provisioned by the **first** contract that could carry it, even while nothing consumes it, and
behind ONE seam rather than per-endpoint checks. Read your module's row in
`docs/engineering/forward-compat.md` before authoring its first contract. Retrofitting one of
these is a repo-wide sweep.
