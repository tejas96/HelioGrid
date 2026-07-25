# Rules — apps/api, apps/worker, apps/voice (NestJS)

## Structure
- Modular monolith. One Nest module per bounded context (auth, tenancy, crm, survey,
  design, proposal, customer-link, projects, billing, catalog, agent, notifications, admin).
  A module exposes: controller(s) implementing ts-rest contracts, a service layer, and a
  repository layer. Cross-module access goes through the other module's service — never
  its repositories or tables.
- Keep NestJS magic minimal: constructor injection and guards/pipes only. No custom
  decorators beyond the established set (`@CurrentTenant()`, `@CurrentUser()`, `@Public()`).
  No dynamic module factories unless an ADR justifies one.

## Contracts (ts-rest)
- Every HTTP surface is declared in `packages/contracts` first (Zod 3.x schemas), then
  implemented with `@ts-rest/nest`. No hand-rolled `@Get()/@Post()` routes outside a contract
  except webhook receivers (which validate raw payloads + signatures explicitly).
- Breaking a contract = versioned route (`/v2/...`) + ADR. Additive changes preferred.

## Error contract (canonical)
- Every non-2xx response body is `{ error: { code, message, details?, requestId } }`.
  - `code`: UPPER_SNAKE enum defined per contract in `packages/contracts` — never free-text.
  - `message`: human-safe; never stack traces or SQL.
  - `details`: optional field-level array `[{ path, issue }]` for validation errors.
  - `requestId`: echoes the request id so support can find the log line.
- HTTP mapping: 400 validation · 401 unauthenticated · 403 forbidden/entitlement
  (`ENTITLEMENT_BLOCKED`) · 404 not-found-or-not-yours (never reveal existence across
  tenants) · 409 version/conflict · 422 domain-rule violation · 429 rate-limited ·
  5xx opaque `INTERNAL`.
- ts-rest contracts declare the error union per route; the NestJS exception filter maps
  typed domain errors → this shape. Provider-port ALWAYS-200 status envelopes (docs/07)
  are a separate pattern and unchanged.

## Tenancy & authz (defense in depth — all three, always)
1. Guard: verified Better Auth JWT → `{ tenantId, userId, roles[] }` on the request context.
2. Repository layer: every query filtered by `tenantId` from context (never from client input).
3. RLS: request-scoped transaction sets `SET LOCAL app.tenant_id`; policies enforce it.
   The app's DB role has no BYPASSRLS. Platform-admin paths use an explicit separate role.
- Capability checks use the 6 preset roles (OR across held roles; widest visibility wins;
  no per-user permission exceptions — D27/D28).
- Public customer-link endpoints live in `customer-link` module only: stateless signed
  tokens, no session, no RLS-user context, aggressive rate limiting, read-only except
  the explicit accept/question actions.

## Jobs (BullMQ)
- Every job has a typed payload schema in `packages/contracts/jobs.ts` and an idempotency
  key. Handlers are idempotent — a retried job must not double-apply (money jobs especially).
- Heavy CPU (shading, Playwright PDF) runs in `apps/worker` worker_threads; queue
  concurrency stays modest. Repeatable jobs own the time-based product rules:
  proposal-unopened-3d, task-overdue-2d, snooze wake, 24h-unassigned escalation, dormant-30d.

## Webhooks (Razorpay, Exotel; later Meta)
- Verify signature → dedupe on provider event id (persisted) → enqueue → 2xx fast.
  Processing happens in the worker. Reconciliation polling is the backstop, not optional.

## External proxies (PVGIS / Google Solar / Gemini)
- Keep the POC pattern: always-200 status envelope `{status: 'ok'|'unavailable'|'error'}`,
  bounded timeouts, SSRF guard on the geotiff relay, keys server-side only.
- Meter every call to `usage_events` with tenantId — these are COGS.

## Errors & logging
- Typed domain errors mapped to contract error shapes; never leak stack traces or SQL.
- Structured logs (pino) with `tenantId`, `userId`, `requestId` on every line. No console.log.
