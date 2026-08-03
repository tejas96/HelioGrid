---
paths:
  - "packages/contracts/**/*.ts"
---

# Contracts — the API review surface

- **The contract diff comes FIRST.** Change `packages/contracts` before implementing an
  endpoint or a client. The diff IS the API review (Law 3).
- **Tenant identity never travels on the wire** — `packages/contracts/CLAUDE.md` carries the
  rule, the invariant that proves it, and the jobs carve-out.
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
- Protocol constants clients need (`OTP_LENGTH`, `PHONE_NSN_LENGTH`, `COUNTRY_CALLING_CODE`)
  live in `@heliogrid/domain`, not here. Domain is the bottom layer, so a contract that needs
  one IMPORTS it — that direction survives the contract being deleted and rebuilt, which is
  exactly what happened to auth. Never hard-code one in a client.
- Zod is pinned at 3.x and `zod/v4` is Biome-banned (ts-rest Zod-4 support is still RC —
  spike S3). Do not lift the pin.

Changing a contract has a sequence — re-emit, keep db enums in step, sweep the clients,
judge breaking changes. Run `/contract-change`.
