# @heliogrid/contracts — ts-rest + Zod 3 contracts (the API review surface)

## What lives here / what must never live here
- ts-rest routers + Zod schemas + shared conventions (error envelope, pagination,
  provenance/role/language enums) + Temporal workflow messages (`workflows/`) + the SESSION
  PROJECTION (`session.ts`) and its `SessionResolver` port (`ports/session.ts`).
- **The session projection is the identity-provider seam.** Better Auth owns
  user/session/account rows; HelioGrid owns tenants, memberships and roles; `session.ts` is
  where the two are joined ONCE. A guard, repository or screen that reaches past it for a
  provider type is what makes a provider upgrade a repo-wide sweep.
- NEVER: implementations, db imports, NestJS imports, fetch clients, `zod/v4` imports
  (Biome bans them until ts-rest Zod-4 support is stable — spike S3).

## Commands
pnpm --filter @heliogrid/contracts build       # tsc -b (composite)
pnpm --filter @heliogrid/contracts openapi     # emit openapi/openapi.json (after build)

## Dependency policy
docs/engineering/architecture.md §2 contracts. The domain edge is LIVE since 2026-08-25:
`rolePresetSchema` is `z.enum(ROLE_PRESETS)` built from domain's tuple. Any closed set both
layers need is written in domain and derived here — the direction is contracts → domain,
never back, because domain is the bottom layer and the reverse is a package cycle.

## Local conventions
- Contract FIRST: edit here before implementing any endpoint or client; the diff is the
  API review. Breaking change ⇒ versioned route (/v2/...), settled in the plan and logged;
  prefer additive.
- Every route declares its error union via `errorEnvelope(z.enum([...]))`; codes are
  UPPER_SNAKE. HTTP mapping is `errorHttpStatusByCode` — do not invent new mappings.
- **Adding a BASE code is three edits, and the compiler finds the third.** `baseErrorCodes`
  + `errorHttpStatusByCode` here, then `packages/i18n/src/copy/api-error.ts`, whose
  `Record<BaseErrorCode, …>` fails to compile until the copy exists. Emitted OpenAPI does
  NOT necessarily change: a code no route's union names is invisible to the artifact, so
  "spec unchanged" is not evidence that nothing happened (`PAYLOAD_TOO_LARGE`, 2026-08-25).
- **`errorDetailSchema`'s inferred `ErrorDetail` is exported — import it.** `packages/data`
  re-declared the same `{ path, issue }` pair until 2026-08-25; two hand-written copies of
  one wire shape is the Law 5 defect this package exists to prevent.
- **Tenant identity NEVER crosses the wire** — no `tenant_id`/`tenantId` anywhere in an HTTP
  body or query schema, at any nesting depth; it comes from verified session claims, and
  `tests/invariants/src/tenant-id-in-body.ts` proves it. Workflow payloads in `workflows/`
  DO carry `tenantId`: a durable workflow has no session to derive it from. (The invariant
  walks body and query only — `pathParams` is unchecked.)
- Money is a decimal string scaled to the currency's minor unit (INR: 2 dp), never a float;
  money-bearing payloads carry a document-level `currency_code`.
- **Workflow messages are a contract too.** `src/workflows/` holds the Temporal names,
  payload schemas and the workflow-id rule (ADR-0025), published as `./workflows`. They are a
  process-to-process contract between apps/api (which starts workflows) and apps/worker (which
  executes them) — putting them in the worker would make the API import the worker. They never
  reach the OpenAPI artifact or a frontend bundle.
- **A workflow `name` must be a valid JS identifier and must equal the function the worker
  EXPORTS.** Temporal resolves a workflow by exported name; a dotted name cannot be exported
  and fails every task with "no such function is exported by the workflow bundle" (hit
  2026-08-26). The literal type is preserved so each worker module asserts the match with
  `satisfies`. Grouping belongs to the TASK QUEUE, not to a dotted type name.
- **Every name in `src/workflows/` is permanent once a durable history exists** — a type name
  is written into history, a task queue is what a running worker polls, and a workflow id is
  the dedupe key an outbox retries against. Renaming one later is a migration.
- One feature = one `src/<area>.ts` router, mounted in `src/index.ts`. Cross-cutting files:
  `common.ts` (shared sets) · `error.ts` (envelope) · `locale.ts` (UI language identity) ·
  `session.ts` (the session projection) · `workflows/` (Temporal messages) ·
  `ports/<capability>.ts` (port interface + its DI token — implementations live in the
  adapters package or the owning module, never here). A port normally lands WITH its
  consumer; `ports/session.ts` is the stated exception (architecture §2 contracts).
- **Roles are NOT authored here.** `ROLE_PRESETS` and the capability matrix live in
  `@heliogrid/domain` (`src/authz/`, re-exported from the index — the package has one
  entry point) — permission policy is business truth, not wire shape, and the
  API must be able to answer "may they?" without a contract in scope.
- **No `env.ts` here.** It existed until 2026-07-30 and moved to
  `packages/env/src/schema/fragments.ts`: contracts is the WIRE format, and deployment
  configuration is not part of the API surface. Environment shapes live in `@heliogrid/env`
  and nowhere else — re-creating one here is the exact duplication that package prevents.
- Every closed business set is ONE `z.enum` here, defined once (shared sets in
  `common.ts`), with its inferred type exported (`export type UiLanguage = z.infer<…>`)
  from the index. Consumers — api services, web, mobile, i18n — import the type; an
  inline literal union anywhere downstream is a defect — one definition per fact (CLAUDE.md §8).
- Pagination is offset + totalCount (`paginationQuerySchema` / `paginated()` /
  `Paginated<T>`). A cursor-based route needs an owner ruling (spec 2026-08-02 §4).

## Landmines
- Zod is pinned 3.25.x; `zod/v4` subpath exists in the package but is BANNED (S3: ts-rest
  Zod-4 support has been a stalled RC since 2025 — re-check before any bump).
- `strictStatusCodes: true` on the root router: undeclared statuses are type errors.

## Definition of done here
Contract change builds green, OpenAPI emits, AND the consuming app slice ships against it
in the same change (contract-only merges are allowed only when explicitly staged).
