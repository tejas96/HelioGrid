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
uses: @ts-rest/core, zod, @heliogrid/domain (canonical business lists — `z.enum(TENANT_SEGMENTS)`
builds the schema from domain's tuple; the import direction is contracts → domain, never back)
used by TODAY: apps/api, apps/web, apps/mobile, packages/ui-api. apps/worker declares the
dependency but imports nothing yet — it is still a scaffold.

## Local conventions
- Contract FIRST: edit here before implementing any endpoint or client; the diff is the
  API review. Breaking change ⇒ versioned route (/v2/...), settled in the plan and logged;
  prefer additive.
- Every route declares its error union via `errorEnvelope(z.enum([...]))`; codes are
  UPPER_SNAKE. HTTP mapping is `errorHttpStatusByCode` — do not invent new mappings.
- tenant_id NEVER appears in request bodies/params — it comes from the JWT claim
  (see `tenantClaimSchema` note). Money is a 2-dp decimal string, never a float.
- One feature = one `src/<area>.ts` router, mounted in `src/index.ts`. Cross-cutting files:
  `common.ts` (shared sets) · `error.ts` (envelope) · `jobs.ts` (job payloads) ·
  `ports/<capability>.ts` (provider port interface + its DI token; implementations will live
  in `packages/adapters` — NOT created yet; the first adapter lands the package).
- **No `env.ts` here.** It existed until 2026-07-30 and moved to
  `packages/env/src/schema/fragments.ts`: contracts is the WIRE format, and deployment
  configuration is not part of the API surface. Environment shapes live in `@heliogrid/env`
  and nowhere else — re-creating one here is the exact duplication that package prevents.
- Every closed business set is ONE `z.enum` here, defined once (shared sets in
  `common.ts`), with its inferred type exported (`export type UiLanguage = z.infer<…>`)
  from the index. Consumers — api services, web, mobile, i18n — import the type; an
  inline literal union anywhere downstream is a defect — one definition per fact (CLAUDE.md §1).

## Landmines
- Zod is pinned 3.25.x; `zod/v4` subpath exists in the package but is BANNED (S3: ts-rest
  Zod-4 support has been a stalled RC since 2025 — re-check before any bump).
- `strictStatusCodes: true` on the root router: undeclared statuses are type errors.

## Definition of done here
Contract change builds green, OpenAPI emits, AND the consuming app slice ships against it
in the same change (contract-only merges are allowed only when explicitly staged).
