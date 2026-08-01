# @heliogrid/api — NestJS modular monolith (the only tenant-facing HTTP surface)

## What lives here / what must never live here
- One Nest module per bounded context; controllers implement ts-rest contracts and hold
  ZERO business logic — service layer → repository layer (tenant-scoped) beneath.
- NEVER: hand-rolled @Get/@Post outside a contract (webhook receivers excepted),
  domain math (that's packages/domain), raw SQL outside repositories, console.log.

## Commands
`dev` and `start` pass `--env-file-if-exists=../../.env.local`, so local values load
automatically and a REAL env var still wins (Fly secrets and CI are never overridden).
pnpm --filter @heliogrid/api dev         # tsx watch (API_PORT=8084 default; kills a stale
                                          # listener on that port first)
pnpm --filter @heliogrid/api build | typecheck
curl localhost:8084/health               # liveness · /health/ready = readiness

## Depends on / depended on by
uses: @heliogrid/contracts, @heliogrid/db, @heliogrid/domain, @heliogrid/env
used by: web, mobile (over HTTP, through @heliogrid/data — never a client they author)

## Local conventions
- Layout is the closed set in docs/02 §2: `src/{config,common,modules,scripts}`;
  every bounded context is `src/modules/<m>/` with the fixed file roles
  (`<m>.module|public|controller|service|repository.ts`, `tokens.ts`, `internal/`).
  Overflow ~450 lines splits by SUBAREA in the same folder (`auth.invites.service.ts`).
- **db + drizzle are legal ONLY in `*.repository.ts`** — services take repositories by DI and
  never see a `tx` or a table; cross-tenant work lives in `*.admin.repository.ts`
  (dep-cruiser `db-access-in-repositories-only`, severity `error`).
- Cross-module imports go through `<m>.public.ts`, never another module's service class.
- `common/` is framework plumbing 2+ modules need; it may never import a module, and business
  behaviour belongs in `packages/domain` instead. Register globals via `APP_*` providers.
- Every non-2xx response is the canonical envelope (EnvelopeExceptionFilter).
- pino structured logs with requestId; phone numbers redacted (DPDP hygiene).
- Tenancy defense in depth is THREE layers: guard (session claims) → repository filter →
  RLS `withTenantTransaction`. **Only the third exists right now** — the guard went with the
  auth teardown (ADR-0024) and the repository layer has no tables to filter. Restoring
  layers one and two belongs to the auth + tenancy rebuild; a module landing before then
  must not assume any of them protects it.
- `@Public()` and `@CurrentClaims()` **no longer exist** — deleted with the guard they served
  (ADR-0024). Do not reach for them; they come back with the rebuild.

## Landmines
- **A route whose contract declares a NON-base error code must throw `ContractException`
  with that literal** (`src/common/errors/contract-exception.ts`). The envelope filter reverse-maps
  status→code, so a bare `ConflictException` on `completeOnboarding` emitted `CONFLICT`
  while the contract promised `ALREADY_ONBOARDED` — both sides compiled, the wire was wrong.
  Base codes (`NOT_FOUND`, `FORBIDDEN`…) may still use the plain Nest exceptions.
- Protocol values shared with clients (`OTP_LENGTH`, `OTP_EXPIRY_SECONDS`) live in
  `@heliogrid/domain` (moved out of contracts 2026-08-01) and are imported here — never a
  literal in a provider config.
- **`ContractException` takes an EXPLICIT status.** It used to default from
  `errorHttpStatusByCode[code]`, but that map holds only BASE codes — `ALREADY_ONBOARDED`
  missed it and silently returned **500 with the right code in the body**. Typecheck was
  green; only an end-to-end curl caught it (2026-07-27). Always pass `HttpStatus.*`.
- **THERE IS NO GUARD. EVERY ROUTE IS UNAUTHENTICATED** since the auth teardown
  (ADR-0024) — a new controller ships public, and nothing warns you. Treat that as the
  single most important fact about this app until the rebuild lands, and do not "fix" it
  locally: the guard is the rebuild's job.
  What must come back with it, because each one was learned the hard way:
  `SessionGuard` bound as `APP_GUARD` in `app.module.ts` — NOT `CommonModule`, because Nest
  resolves a provider's dependencies in the module that DECLARES it, and the guard needs
  `SESSION_RESOLVER` from the auth module, so declaring it in `common/` fails at boot;
  the `SessionResolver` PORT in contracts, so the guard never imports a module directly;
  and `@Public()` on `HealthController`, which is LOAD-BEARING — without it Fly's probes
  401 and the machine fails its health checks.
- **DB pools live in `common/db/`**, provided globally; `ADMIN_DB` sits alone in
  `admin.token.ts` so `admin-pool-fenced` can restrict it to `*.admin.repository.ts`.
  `@heliogrid/db/uuid` is exempt from the db fence — `uuidv7` is pure `randomBytes`.
- `pnpm dev` runs tsx (esbuild) — NO decorator metadata. EVERY constructor param needs
  explicit `@Inject(Token)` including `Reflector` and class providers. (Hit 2026-07-26.)
- `flyctl deploy` needs workspace lockfile — build from repo root.
- Readiness check opens a 1-connection pool per call — fine for Fly, not hot paths.

## Definition of done here
Contract implemented AND verified with curl · typecheck/lint green · envelope on errors.
