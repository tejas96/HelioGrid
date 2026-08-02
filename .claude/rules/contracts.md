---
paths:
  - "packages/contracts/**/*.ts"
---

# Contracts — the API review surface

- **The contract diff comes FIRST.** Change `packages/contracts` before implementing an
  endpoint or a client. The diff IS the API review (Law 3).
- `tenant_id` NEVER travels in a request body — it comes from verified session claims.
- **One `z.enum` per business set** — one definition per fact — exported with its inferred type. Consumers
  import the type; they never re-declare the values. UI status/variant maps are
  `Record<TheEnum, …>` so a new value fails to compile rather than rendering blank.
- pgEnum values in `packages/db` hand-mirror these lists and `db-no-upward` forbids the
  import — when you add or change a value here, change the migration in the same slice and
  say so in the commit.
- Money crosses the wire as a decimal string scaled to the currency's minor unit (INR: 2 dp),
  never a float; money-bearing payloads carry `currency_code` at document level.
- Every non-2xx response uses the canonical envelope (`error.ts` + `errorHttpStatusByCode`).
  A route declaring a NON-base error code needs `ContractException` with that literal on
  the server, or the wire silently carries the wrong code with a green typecheck.
- Protocol constants clients need (`OTP_LENGTH`, `PHONE_NSN_LENGTH`, `COUNTRY_CALLING_CODE`)
  live in `@heliogrid/domain`, not here (moved 2026-08-01 with the auth teardown). The phone
  pair is the IN market's phone spec — it becomes injected market-pack config when the
  market-pack slice lands (global ruling 2026-08-02); until then it stays a domain constant.
  Domain is the bottom layer, so a contract that needs one IMPORTS it — that direction
  survives the contract being deleted and rebuilt, which is exactly what happened to auth.
  Never hard-code one in a client.
- Zod is pinned at 3.x and `zod/v4` is Biome-banned (ts-rest Zod-4 support is still RC —
  spike S3). Do not lift the pin.

Changing a contract has a sequence — re-emit, keep db enums in step, sweep the clients,
judge breaking changes. Run `/contract-change`.
