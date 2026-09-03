# @heliogrid/contracts — ts-rest + Zod 3, the API review surface

Traps: `docs/engineering/landmines.md` · contract-authoring rules: `.claude/rules/contracts.md` ·
deps: `architecture.md` §2 contracts. Changing a contract has a sequence: `/contract-change`.

## What lives here / what must never live here

- ts-rest routers, Zod request/response schemas, the error envelope, shared conventions
  (pagination, provenance, role and language enums), Temporal workflow messages (`workflows/`),
  the SESSION PROJECTION (`session.ts`) and its `SessionResolver` port (`ports/session.ts`).
- **The session projection is the identity-provider seam.** The provider owns user and session
  rows; HelioGrid owns tenants, memberships and roles; `session.ts` joins the two ONCE. A guard,
  repository or screen that reaches past it for a provider type is what makes a provider upgrade
  a repo-wide sweep.
- NEVER: an implementation, a db import, a NestJS import, a fetch client, a `zod/v4` import, or
  a role definition — `ROLE_PRESETS` and the capability matrix are `@heliogrid/domain`, because
  permission policy is business truth and the API must answer "may they?" with no contract in
  scope.

## Commands

```
pnpm --filter @heliogrid/contracts build      # tsc -b (composite)
pnpm --filter @heliogrid/contracts openapi    # emit openapi/openapi.json, AFTER build
```

## Local conventions

- **The contract diff comes FIRST**, before any endpoint or client. That diff IS the API review
  (Law 3). A breaking change means a versioned route, settled in the plan; prefer additive.
- One feature is one `src/<area>.ts` router, mounted in `src/index.ts`. Cross-cutting files:
  `common.ts` shared sets · `error.ts` the envelope · `locale.ts` the UI language identity ·
  `session.ts` the projection · `workflows/` Temporal messages · `ports/<capability>.ts` a port
  interface and its DI token, whose implementation lives with its consumer, never here.
- **Every closed business set is ONE `z.enum`**, with its inferred type exported from the index.
  Consumers import the type; an inline literal union downstream is a defect. A set both layers
  need is written in `@heliogrid/domain` and derived here — the direction is contracts → domain,
  never back.
- Every route declares its error union via `errorEnvelope(z.enum([...]))`; codes are UPPER_SNAKE
  and the HTTP mapping is `errorHttpStatusByCode`. Do not invent a mapping.
- **`errorDetailSchema`'s inferred `ErrorDetail` is exported — import it.** Two hand-written
  copies of one wire shape is the Law 5 defect this package exists to prevent.
- **Tenant identity NEVER crosses the wire** — no `tenant_id`/`tenantId` in any body or query
  schema at any depth; it comes from verified session claims (`M14`). Workflow payloads DO carry
  `tenantId`: a durable workflow has no session to derive it from.
- Money is a decimal string scaled to the currency's minor unit, never a float; a money-bearing
  payload carries a document-level `currency_code`.
- Pagination is offset + `totalCount`. A cursor-based route needs an owner ruling.
- `strictStatusCodes: true` on the root router, so an undeclared status is a type error.

## Done means

The change builds, OpenAPI emits, AND the consuming app slice ships against it in the same change
— a contract-only merge is allowed only when explicitly staged.
