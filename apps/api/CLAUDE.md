# @heliogrid/api — NestJS modular monolith (the only tenant-facing HTTP surface)

## What lives here / what must never live here
- One Nest module per bounded context; controllers implement ts-rest contracts and hold
  ZERO business logic — service layer → repository layer (tenant-scoped) beneath.
- NEVER: hand-rolled @Get/@Post outside a contract (webhook receivers excepted),
  domain math (that's packages/domain), raw SQL outside repositories, console.log.

## Folder shape

```
src/{config,common,modules}
src/modules/<m>/            one folder per module, four files:
  <m>.module.ts  <m>.controller.ts  <m>.service.ts  <m>.repository.ts
```

Never invent a folder: this tree is a closed set. `apps/worker` uses the same shape.

## Commands
`dev` and `start` pass `--env-file-if-exists=../../.env.local`, so local values load
automatically and a REAL env var still wins (Fly secrets and CI are never overridden).
pnpm --filter @heliogrid/api dev         # tsx watch (API_PORT=8084 default; kills a stale
                                          # listener on that port first)
pnpm --filter @heliogrid/api build | typecheck
curl localhost:8084/health               # liveness · /health/ready = readiness

## Dependency policy
docs/engineering/architecture.md §2 apps/api. Web and mobile reach it over HTTP through
`@heliogrid/data` — never a client they author.

## Local conventions
- Layout is the closed set in docs/engineering/02 §2: `src/{config,common,modules,scripts}`;
  every bounded context is `src/modules/<m>/` with the fixed file roles
  (`<m>.module|public|controller|service|repository.ts`, `tokens.ts`, `internal/`).
  Overflow ~450 lines splits by SUBAREA in the same folder (`auth.invites.service.ts`).
- **db + drizzle are legal ONLY in `*.repository.ts`** — services take repositories by DI and
  never see a `tx` or a table; cross-tenant work lives in `*.admin.repository.ts`
  (dep-cruiser `db-access-in-repositories-only`, severity `error`).
- Cross-module imports go through `<m>.public.ts`, never another module's service class.
- `common/` is framework plumbing 2+ modules need; it may never import a module, and business
  behaviour belongs in `packages/domain` instead. Register globals via `APP_*` providers.
- Every non-2xx response is the canonical envelope (EnvelopeExceptionFilter), including the
  body-parser's 413, which is answered in `main.ts` before Nest sees the request.
- **Request validation produces `details[]` automatically.** The filter turns a ts-rest
  `RequestValidationError` into `{ path, issue }` per Zod issue, and a BODY `path` is the
  SCHEMA FIELD path (`phone`, `profile.age` — never `body.phone`): clients feed it straight
  to `applyServerErrors`, where an unmatched path renders nothing at all. A query/header/param
  path is prefixed with its source ONLY when the bare name would be ambiguous.
- **Response validation is ON globally** (`TsRestModule.register({ validateResponses: true })`).
  A handler whose body fails its own contract, or which answers an UNDECLARED status, becomes
  an opaque `INTERNAL` on the wire — the truth goes to the log, under the same request id.
- **The header NAME is `REQUEST_ID_HEADER` from `@heliogrid/contracts`** — never the literal.
  It is one wire fact and `packages/data` forwards the same one (owner ruling 2026-09-03).
- **`x-request-id` is assigned in one place** (`common/request-id.ts`, mounted before CORS
  and body parsing) so even a parser 413 carries one. A caller-supplied id is honoured only
  if it matches `[A-Za-z0-9._:-]{1,128}`; anything else is replaced, never echoed. It is a
  CORS `exposedHeaders` entry, so the browser can actually read it.
- pino structured logs with requestId; the log shape and its redaction live in ONE file,
  `common/logging.ts` (privacy hygiene — DPDP for IN; each market's regime as markets are
  added). Add a redaction path THERE, never per-handler.
- Tenancy is three layers: guard → repository filter → RLS `withTenantTransaction`. **Only
  RLS exists today**; a module landing before the auth module must assume no protection. `@Public()` / `@CurrentClaims()` are deleted — do not reach for them.
- List endpoints: `orderBy(<sort key> DESC, id DESC)` (stable order, id tiebreaker),
  limit/offset from `paginationQuerySchema`, `totalCount` counted with the SAME `where` —
  never a divergent count query. Recipe: foundation-dx spec §4.2.

## Landmines
- **A route whose contract declares a NON-base error code must throw `ContractException`
  with that literal** (`src/common/errors/contract-exception.ts`). The envelope filter reverse-maps
  status→code, so a bare `ConflictException` on `completeOnboarding` emitted `CONFLICT`
  while the contract promised `ALREADY_ONBOARDED` — both sides compiled, the wire was wrong.
  Base codes (`NOT_FOUND`, `FORBIDDEN`…) may still use the plain Nest exceptions.
- Protocol values shared with clients (`OTP_LENGTH`, `OTP_EXPIRY_SECONDS`) live in
  `@heliogrid/domain` (moved out of contracts 2026-08-01). This app declares no dependency
  on domain today — the auth teardown removed its only consumer — so the rebuild re-adds
  both the dependency and the import. Never a literal in a provider config.
- **`ContractException` takes an EXPLICIT status.** It used to default from
  `errorHttpStatusByCode[code]`, but that map holds only BASE codes — `ALREADY_ONBOARDED`
  missed it and silently returned **500 with the right code in the body**. Typecheck was
  green; only an end-to-end curl caught it (2026-07-27). Always pass `HttpStatus.*`.
- **NO GUARD EXISTS — every route is unauthenticated.** The auth module has not been built. A
  new controller ships public and nothing warns you; restoring it is that module's job, not a
  local fix. The
  rebuild must restore: `SessionGuard` as `APP_GUARD` in `app.module.ts` (never
  `CommonModule` — Nest resolves deps in the declaring module, so it fails at boot), the
  `SessionResolver` port, and `@Public()` on health (without it Fly's probes 401).
- **Workflows are started through `TemporalGateway`** (`common/temporal/`), never through a
  client a service builds itself (dep-cruiser `temporal-client-fenced`). Pass the CONTRACT
  from `@heliogrid/contracts/workflows` — the gateway derives the workflow id from it, and a
  hand-typed id is a broken dedupe key at the one call site nobody re-reads.
- **`gateway.start()` is idempotent by construction** (`USE_EXISTING` + a derived id), which
  is what makes it safe to call from a retrying dispatcher. It is NOT a licence to dual-write:
  a product mutation and a workflow start must not be two independent writes. The durable
  handoff is an outbox row written in the SAME transaction, read by a dispatcher — the reader
  lands with the first product mutation that needs it (ADR-0025, `infra/temporal/README.md` §5).
- **Every workflow payload is validated at ingress**, on the way out and on the way back.
  TypeScript does not survive a process boundary, and a workflow that fails on its first task
  is much harder to diagnose than a rejected call with a stack.
- **DB pools live in `common/db/`**, provided globally; `ADMIN_DB` sits alone in
  `admin.token.ts` so `admin-pool-fenced` can restrict it to `*.admin.repository.ts`.
  `@heliogrid/db/uuid` is exempt from the db fence — `uuidv7` is pure `randomBytes`.
- `pnpm dev` runs tsx (esbuild) — NO decorator metadata. EVERY constructor param needs
  explicit `@Inject(Token)` including `Reflector` and class providers. (Hit 2026-07-26.)
- `flyctl deploy` needs workspace lockfile — build from repo root.
- Readiness check opens a 1-connection pool per call — fine for Fly, not hot paths.
- **`redact` reaches structured fields only.** `req.query.phone` is censored while the same
  value inside the raw `req.url` string is NOT — proven by probe on 2026-08-25. `logging.ts`
  strips the query string from the logged URL for that reason; `req.query` keeps the
  parameters, where redaction can see them. A new PII-bearing field needs a path there.
- **An error's own payload is not redactable path-by-path.** A ts-rest
  `RequestValidationError` carries the submitted data's Zod issues, and some issue codes
  include the submitted VALUE. `logging.ts` serialises errors through an ALLOWLIST
  (`type`, `message`, `stack`, `code`, `status`, `statusCode`) — do not turn that into a
  denylist.
- **A route-specific code stays a `string` in the filter**, never cast to `BaseErrorCode`.
  Exact per-route typing lands with the first route-specific M01 contract.

## Definition of done here
Contract implemented AND verified with curl · typecheck/lint green · envelope on errors ·
the failure paths driven, not read: a malformed request returns field-addressable
`details[]`, a contract-violating response returns opaque INTERNAL, and the request id in
the response matches the one in the log with no PII beside it.
