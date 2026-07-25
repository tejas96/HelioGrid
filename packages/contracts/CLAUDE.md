# @heliogrid/contracts — ts-rest + Zod 3 contracts (the API review surface)

## What lives here / what must never live here
- ts-rest routers + Zod schemas + shared conventions (error envelope, pagination,
  tenancy claim, provenance/role/language enums) + typed job payloads (`jobs.ts`).
- NEVER: implementations, db imports, NestJS imports, fetch clients, `zod/v4` imports
  (Biome bans them until ts-rest Zod-4 support is stable — spike S3).

## Commands
pnpm --filter @heliogrid/contracts build       # tsc -b (composite)
pnpm --filter @heliogrid/contracts openapi     # emit openapi/openapi.json (after build)

## Depends on / depended on by
uses: @ts-rest/core, zod (later: packages/domain types)
used by: apps/api, apps/worker, apps/web, apps/mobile

## Local conventions
- Contract FIRST: edit here before implementing any endpoint or client; the diff is the
  API review. Breaking change ⇒ versioned route (/v2/...) + ADR; prefer additive.
- Every route declares its error union via `errorEnvelope(z.enum([...]))`; codes are
  UPPER_SNAKE. HTTP mapping is `errorHttpStatusByCode` — do not invent new mappings.
- tenant_id NEVER appears in request bodies/params — it comes from the JWT claim
  (see `tenantClaimSchema` note). Money is a 2-dp decimal string, never a float.
- One feature = one `src/<area>.ts` router, mounted in `src/index.ts`.

## Landmines
- Zod is pinned 3.25.x; `zod/v4` subpath exists in the package but is BANNED (S3: ts-rest
  Zod-4 support has been a stalled RC since 2025 — re-check before any bump).
- `strictStatusCodes: true` on the root router: undeclared statuses are type errors.

## Definition of done here
Contract change builds green, OpenAPI emits, AND the consuming app slice ships against it
in the same change (contract-only merges are allowed only when explicitly staged).
