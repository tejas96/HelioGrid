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
- Layout is the closed set in CLAUDE.md §Structure: `src/{config,common,modules,scripts}`;
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
- Tenancy defense in depth: guard (JWT claims) → repository filter → RLS
  `withTenantTransaction`. Auth + tenancy E2E-verified 2026-07-26.
- Decorators: `@Public()`, `@CurrentClaims()` (session claims incl. tenantId, userId, roles).

## Landmines
- **A route whose contract declares a NON-base error code must throw `ContractException`
  with that literal** (`src/common/errors/contract-exception.ts`). The envelope filter reverse-maps
  status→code, so a bare `ConflictException` on `completeOnboarding` emitted `CONFLICT`
  while the contract promised `ALREADY_ONBOARDED` — both sides compiled, the wire was wrong.
  Base codes (`NOT_FOUND`, `FORBIDDEN`…) may still use the plain Nest exceptions.
- Protocol values shared with clients (`OTP_LENGTH`, `OTP_EXPIRY_SECONDS`) live in contracts
  and are imported here — never a literal in the Better Auth config.
- **`ContractException` takes an EXPLICIT status.** It used to default from
  `errorHttpStatusByCode[code]`, but that map holds only BASE codes — `ALREADY_ONBOARDED`
  missed it and silently returned **500 with the right code in the body**. Typecheck was
  green; only an end-to-end curl caught it (2026-07-27). Always pass `HttpStatus.*`.
- **Deny-by-default guard**: `SessionGuard` is `APP_GUARD` in `app.module.ts`. A new
  controller is authenticated automatically; `@Public()` is the only opt-out and is
  LOAD-BEARING on health (without it Fly's probes 401 and the machine fails its checks).
- Guard depends on the `SessionResolver` PORT (`contracts/src/ports/session.ts`), never on
  the auth module. It is bound in `app.module.ts`, not `CommonModule` — Nest resolves a
  provider's deps in the module that DECLARES it, so declaring it in `common/` fails at boot.
- **DB pools live in `common/db/`**, provided globally; `ADMIN_DB` sits alone in
  `admin.token.ts` so `admin-pool-fenced` can restrict it to `*.admin.repository.ts`.
  `@heliogrid/db/uuid` is exempt from the db fence — `uuidv7` is pure `randomBytes`.
- `pnpm dev` runs tsx (esbuild) — NO decorator metadata. EVERY constructor param needs
  explicit `@Inject(Token)` including `Reflector` and class providers. (Hit 2026-07-26.)
- `flyctl deploy` needs workspace lockfile — build from repo root.
- Readiness check opens a 1-connection pool per call — fine for Fly, not hot paths.

## Definition of done here
Contract implemented AND verified with curl · typecheck/lint green · envelope on errors.
