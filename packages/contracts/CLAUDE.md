# @heliogrid/contracts — ts-rest + Zod 3, the API review surface

## What lives here / what must never live here

- Role and language enums are DERIVED from `@heliogrid/domain`, never authored here. The session
  projection is `session.ts`; its port is `ports/session.ts`.
- `session.ts` is the one place HelioGrid's identity tables meet the identity library's. A guard,
  repository or screen reads the session projection and never imports a provider type.
- NEVER: an implementation, a NestJS import, a fetch client, or a role list (`ROLE_PRESETS` and
  the capability matrix are `@heliogrid/domain`).

## Where files go

```
src/<area>.ts               one router per feature area, mounted in src/index.ts — or an
                            area's shared schemas when it has no routes (locale.ts, session.ts)
src/common.ts               shared sets and schemas
src/error.ts                the canonical error envelope
src/workflows/              Temporal workflow message schemas — the ./workflows subpath
src/ports/<capability>.ts   a provider port interface and its DI token; its implementation
                            lives with its consumer, never here
src/scripts/                the OpenAPI emitter run by the openapi script
openapi/openapi.json        emitted, committed, checked by `pnpm check:openapi` — never hand-edited
```

## Rules

- **Every closed business set is ONE `z.enum`**, with its inferred type exported from the index;
  consumers import the type. A status or variant map is `Record<TheEnum, …>`, so a new value fails
  to compile.
- **A set that GROWS with the slices (Law 9) — audit events, notification types — is
  `extensibleEnum(...)` where a RESPONSE carries it**, its reader keeps a fallback, and the closed
  `z.enum` stays beside it for writes and the pgEnum mirror. A FIXED set stays closed on both sides.
- Every route declares its error union via `errorEnvelope(z.enum([...]))`; codes are UPPER_SNAKE.
  The shared 400, 403 and 500 reach every route from `sharedRefusals`; a route's own entry for one
  of those statuses REPLACES the shared one, so it names the shared code beside its own.
- Workflow payloads carry `tenantId`, though no HTTP body or query ever does: a durable workflow
  has no session to derive it from.
- Money crosses the wire as a decimal string scaled to the currency's minor unit, never a float;
  a money-bearing payload carries `currencyCode` at document level.
- **A protocol constant a SCREEN needs lives in `@heliogrid/domain`** and a contract IMPORTS it —
  domain is the bottom layer. Two things that are NOT that: a MARKET fact (calling code,
  national-number grouping and length) belongs to `pack.formats`; and a WIRE fact no screen ever
  sees belongs HERE, because contracts is the wire truth and domain is business truth.
- Pagination is offset + `totalCount`; a cursor-based route is a decision the plan records.
- Before a module's first contract, read its row in `docs/engineering/forward-compat.md`.
  Permissions, tenancy, money, audit and i18n are provisioned by that first contract, behind one
  seam, even before anything consumes them.

## Done means

The change builds, OpenAPI emits, AND the consuming app slice ships against it in the same change
— a contract-only merge is allowed only when explicitly staged.

## Traps

- A new BASE error code that no route's union names is invisible to the emitted OpenAPI, so "spec unchanged" is not evidence that nothing happened → add it to `baseErrorCodes` by hand; `HTTP_STATUS_BY_CODE` (`src/error.ts`) and the i18n copy `Record` then fail to compile until the code is there.
- Zod 3 runs a `.refine` even after an earlier check on the same string failed, so a refine that can THROW on malformed input (`toISOString()` on an invalid date, `JSON.parse`) turns a 400 into an opaque 500 → guard the refine so it returns false instead of throwing.
- The breaking-change judge (`oasdiff`, in `pnpm check:openapi`) grades by version: the build CI pins rates a value added to a response enum ERR where older builds only warn → declare a set that grows as `extensibleEnum`; a response property made nullable and a request bound (`max`, `min`, a new required field) are ERR-level too, so grow a response with a NEW property. A request rule that refuses what the base accepted is a breaking change wherever it is held: prefer an additive change, and a breaking one is a versioned route the PR names.
- Every name in `src/workflows/` is permanent once a durable history exists: a type name is written into history, a task queue is what a running worker polls, a workflow id is an outbox dedupe key → choose each once; renaming one later is a migration, not a rename.
