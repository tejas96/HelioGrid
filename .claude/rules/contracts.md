---
paths:
  - "packages/contracts/**/*.ts"
---

# packages/contracts — the API review surface

## Where files go

```
src/<area>.ts               one router per feature area, mounted in src/index.ts
src/common.ts               shared sets and schemas
src/error.ts                the canonical error envelope
src/workflows/              Temporal workflow message schemas — the ./workflows subpath
                            export. Names, payloads and the id rule for the API→worker
                            contract (ADR-0025)
src/ports/<capability>.ts   provider port interface + its DI token
src/index.ts                the only entry consumers import, plus the ./workflows subpath
openapi/openapi.json        emitted, committed, gate-checked — never hand-edited
```

## Rules

- **The contract diff comes FIRST.** Change `packages/contracts` before implementing an
  endpoint or a client. The diff IS the API review (Law 3).
- **Tenant identity never travels on the wire** — `packages/contracts/CLAUDE.md` carries the
  rule and the invariant that proves it.
- **One `z.enum` per business set** — one definition per fact — exported with its inferred type. Consumers
  import the type; they never re-declare the values. UI status/variant maps are
  `Record<TheEnum, …>` so a new value fails to compile rather than rendering blank.
- pgEnum values in `packages/db` hand-mirror these lists and `db-no-upward` forbids the
  import, but they are not unchecked: `tests/invariants/src/enum-parity.ts` proves parity in
  both directions. Change both sides in the same slice, via `/migration`.
- Money crosses the wire as a decimal string scaled to the currency's minor unit (INR: 2 dp),
  never a float; money-bearing payloads carry `currency_code` at document level.
- Every non-2xx response uses the canonical envelope (`error.ts` + `errorHttpStatusByCode`).
  A route declaring a NON-base error code needs `ContractException` with that literal on
  the server, or the wire silently carries the wrong code with a green typecheck.
- Protocol constants a SCREEN needs (`OTP_LENGTH`, `OTP_EXPIRY_SECONDS`) live in
  `@heliogrid/domain`, not here — domain is the bottom layer, so a contract that needs one
  IMPORTS it. Never hard-code one in a client. Two things that are NOT that:
  a MARKET fact — the calling code, national-number grouping and length are `pack.formats`
  (`IN_FORMATS.phone`); and a WIRE fact no screen ever sees, which belongs HERE — owner ruling
  2026-09-03 put `REQUEST_ID_HEADER` in `common.ts` because contracts is the wire truth and
  domain is business truth. It had been written in `apps/api` and `packages/data` at once.
- Zod is pinned at 3.x and `zod/v4` is Biome-banned (ts-rest Zod-4 support is still RC —
  spike S3). Do not lift the pin.

Changing a contract has a sequence — re-emit, keep db enums in step, sweep the clients,
judge breaking changes. Run `/contract-change`.

## Cross-cutting concerns are built in, never retrofitted

Anything that will reach every module later — permissions/RBAC, tenancy, money, audit, i18n — is
provisioned by the **first** contract that could carry it, even while nothing consumes it yet, and
behind ONE seam rather than per-endpoint checks. Read your module's row in
`docs/engineering/forward-compat.md` before authoring its first contract. Retrofitting one of these
is a repo-wide sweep.
