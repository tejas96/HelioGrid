# @heliogrid/contracts — ts-rest + Zod 3, the API review surface

Deps: `architecture.md` §2 contracts.

## What lives here / what must never live here

- ts-rest routers, Zod request/response schemas, the error envelope, shared conventions
  (pagination, provenance, role and language enums — the last two DERIVED from `@heliogrid/domain`,
  never authored here), Temporal workflow messages (`workflows/`),
  the SESSION PROJECTION (`session.ts`) and its `SessionResolver` port (`ports/session.ts`).
- **The session projection is the identity-provider seam.** HelioGrid owns `user_account`,
  sessions, tenants, memberships and roles; a wrapped identity library owns only its own tables;
  `session.ts` joins the two ONCE. A guard, repository or screen that reaches past it for a
  provider type is what makes a provider upgrade a repo-wide sweep.
- NEVER: an implementation, a db import, a NestJS import, a fetch client, a `zod/v4` import, or
  a role definition — `ROLE_PRESETS` and the capability matrix are `@heliogrid/domain`, because
  permission policy is business truth and the API must answer "may they?" with no contract in
  scope.

## Where files go

```
src/<area>.ts               one router per feature area, mounted in src/index.ts
src/common.ts               shared sets and schemas
src/error.ts                the canonical error envelope
src/workflows/              Temporal workflow message schemas — the ./workflows subpath
src/ports/<capability>.ts   a provider port interface and its DI token; its implementation
                            lives with its consumer, never here
src/index.ts                the only entry consumers import
openapi/openapi.json        emitted, committed, checked by `pnpm check:openapi` — never hand-edited
```

## Commands

```
pnpm --filter @heliogrid/contracts build      # tsc -p (composite)
pnpm --filter @heliogrid/contracts openapi    # emit openapi/openapi.json, AFTER build
```

## Rules

- **The contract diff comes FIRST**, before any endpoint or client. That diff IS the API review
  (Law 3). A breaking change means a versioned route, settled in the plan; prefer additive.
- **Every closed business set is ONE `z.enum`**, with its inferred type exported from the index.
  Consumers import the type; an inline literal union downstream is a defect. A UI status or
  variant map is `Record<TheEnum, …>`, so a new value fails to compile rather than rendering
  blank. A set both layers need is written in `@heliogrid/domain` and derived here.
- **A set that GROWS with the slices (Law 9) — audit events, notification types — is
  `extensibleEnum(...)` where a RESPONSE carries it**, its reader keeps a fallback, and the closed
  `z.enum` stays beside it for writes and the pgEnum mirror. A FIXED set stays closed on both sides.
- Every route declares its error union via `errorEnvelope(z.enum([...]))`; codes are UPPER_SNAKE.
  The HTTP mapping is `httpStatusFor` (over the unexported `HTTP_STATUS_BY_CODE`) and its reverse
  `genericErrorCodeByStatus`, both in `src/error.ts`. Do not invent a mapping.
- **`errorDetailSchema`'s inferred `ErrorDetail` is exported — import it.** Two hand-written
  copies of one wire shape is the Law 5 defect this package exists to prevent.
- **Tenant identity NEVER crosses the wire** — no `tenant_id`/`tenantId` in any body or query
  schema at any depth; it comes from verified session claims. Workflow payloads DO carry
  `tenantId`: a durable workflow has no session to derive it from.
- Money crosses the wire as a decimal string scaled to the currency's minor unit, never a float;
  a money-bearing payload carries `currency_code` at document level.
- **A protocol constant a SCREEN needs lives in `@heliogrid/domain`** and a contract IMPORTS it —
  domain is the bottom layer. Two things that are NOT that: a MARKET fact (calling code,
  national-number grouping and length) belongs to `pack.formats`; and a WIRE fact no screen ever
  sees belongs HERE, because contracts is the wire truth and domain is business truth.
- Pagination is offset + `totalCount`. A cursor-based route needs an owner ruling.
- Zod is pinned at 3.x and `zod/v4` is banned. `strictStatusCodes: true` on the root router, so
  an undeclared status is a type error.

## Cross-cutting concerns are built in, never retrofitted

Anything that will reach every module later — permissions, tenancy, money, audit, i18n — is
provisioned by the **first** contract that could carry it, even while nothing consumes it, and
behind ONE seam rather than per-endpoint checks. Read your module's row in
`docs/engineering/forward-compat.md` before authoring its first contract. Retrofitting one of
these is a repo-wide sweep.

## Done means

The change builds, OpenAPI emits, AND the consuming app slice ships against it in the same change
— a contract-only merge is allowed only when explicitly staged.

## Traps

- A new BASE error code that no route's union names is invisible to the emitted OpenAPI, so "spec unchanged" is not evidence that nothing happened → check the three edits by hand: `baseErrorCodes`, `HTTP_STATUS_BY_CODE` in `src/error.ts`, then the i18n copy `Record`, which fails to compile until the code is there.
- Zod 3 runs a `.refine` even after an earlier check on the same string failed, so a refine that can THROW on malformed input (`toISOString()` on an invalid date, `JSON.parse`) turns a 400 into an opaque 500 → guard the refine so it returns false instead of throwing.
- Every name in `src/workflows/` is permanent once a durable history exists: a type name is written into history, a task queue is what a running worker polls, a workflow id is an outbox dedupe key → choose each once; renaming one later is a migration, not a rename.
