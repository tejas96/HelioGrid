# @heliogrid/api — NestJS modular monolith (the only tenant-facing HTTP surface)

## What lives here / what must never live here
- One Nest module per bounded context; controllers implement ts-rest contracts and hold
  ZERO business logic — service layer → repository layer (tenant-scoped) beneath.
- NEVER: hand-rolled @Get/@Post outside a contract (webhook receivers excepted),
  domain math (that's packages/domain), raw SQL outside repositories, console.log.

## Commands
pnpm --filter @heliogrid/api dev         # tsx watch (PORT=8080 default)
pnpm --filter @heliogrid/api build | typecheck
curl localhost:8080/health               # liveness · /health/ready = readiness

## Depends on / depended on by
uses: @heliogrid/contracts, @heliogrid/db        used by: web, mobile (over HTTP)

## Local conventions
- Every non-2xx response is the canonical envelope (EnvelopeExceptionFilter); typed
  domain errors map via `errorHttpStatusByCode` — never leak stacks or SQL.
- pino structured logs with requestId; phone numbers redacted (DPDP hygiene).
- Tenancy defense in depth (all three, always): guard (JWT claims) → repository filter →
  RLS `withTenantTransaction`. Lands with Track A; the seams exist now.
- Established decorators only: @CurrentTenant() @CurrentUser() @Public() (Track A adds).

## Landmines
- `pnpm dev` runs tsx (esbuild) which emits NO decorator metadata: type-only constructor
  injection resolves under `node dist/main.js` but crashes DI on dev start. EVERY
  constructor param needs an explicit `@Inject(Token)` — including `Reflector` and
  class providers. (Hit 2026-07-26: SessionGuard.)
- `pnpm deploy` in the Dockerfile needs the workspace lockfile — build from repo root
  (`flyctl deploy --dockerfile apps/api/Dockerfile` with root context).
- Readiness check opens a 1-connection pool per call — fine for Fly checks, do not put
  it on a hot path.

## Definition of done here
Contract implemented AND verified with curl against the running app · typecheck/lint
green · error paths return the envelope · logs carry tenantId/userId/requestId once auth lands.
