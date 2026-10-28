# @heliogrid/api — NestJS modular monolith, the only tenant-facing HTTP surface

Deps: `architecture.md` §2 apps/api. Controllers implement ts-rest contracts and hold no business
logic: controller → service → repository. Never a hand-rolled `@Get`/`@Post` outside a contract.

## Folder shape

```
src/app.ts · main.ts   createApp() is the ONE boot path; main.ts listens, a test listens on port 0
src/config/env.ts      the app's typed env
src/common/            plumbing 2+ modules need: auth/ (guard, route-access map, cookies, session),
                       db/ (the pools), temporal/, filters/, errors/, request-id.ts, logging.ts,
                       creation-key.ts, client-version.ts
src/modules/<m>/       <m>.module|public|controller|service|repository.ts · internal/
src/scripts/<verb>-<noun>.ts   boots the app context, calls the service of each thing it does, holds no logic, exits
```

`internal/` holds what only the module's own service uses (other modules reach only
`<m>.public.ts`). A module with one repository and one service needs none. A file nearing 300
lines splits by subarea in the same folder: `settings.templates.service.ts`.

## Commands

```
pnpm --filter @heliogrid/api dev | build | typecheck     # dev = tsx watch, API_PORT 8084
pnpm --filter @heliogrid/api pack:publish                # the typed pack as its market's next revision, then the India platform catalog
curl localhost:8084/health                               # liveness · /health/ready = readiness
```

## Local conventions

- **The file name picks the pool:** `*.repository.ts` takes `TENANT_DB`; `*.admin.repository.ts`
  crosses tenants; `*.reference.repository.ts` reads tables no tenant owns. A `src/scripts/`
  command calls a service, never a repository.
- **The audit module is a leaf:** other modules' repositories import `recordAuditEntry` from it.
  An entry records ids; whoever renders a name resolves it on the read side.
- **Tenancy is three layers:** the guard (session claims) → the repository filter (tenantId from
  context, never from client input) → RLS. Another tenant's row answers 404, never 403.
- **A body `details[]` path is the SCHEMA FIELD path** (`phone`, `profile.age` — never
  `body.phone`): clients feed it straight to `applyServerErrors`. A query, header or param path
  is prefixed with its source only when the bare name would be ambiguous.
- **A handler never returns the shared 400, 403 or 500:** its area router does not carry them, so
  it throws them, and the envelope filter (`common/filters/declared-statuses.ts`) answers any
  status the route does not declare as an opaque `INTERNAL`, naming the route in the log.
- `x-request-id` is assigned only in `common/request-id.ts`; name the header with
  `REQUEST_ID_HEADER` from `@heliogrid/contracts`, never the literal.
- A redaction path is added only in `common/logging.ts`. Errors serialise through an ALLOWLIST
  (never turn it into a denylist), and the logged URL drops its query string, because `redact`
  reaches structured fields only.
- **A create route** takes `createHeadersSchema` (`@heliogrid/contracts`) and resolves its retry
  through `creationKeyOf` (`common/creation-key.ts`), so the same idempotency key returns the first
  answer (`F4-07`).
- **An audited `PUT` or `PATCH` sent again with what is stored** writes, records and moves nothing;
  `tests/settings/unchanged-replace.test.ts` fails a new such route that is neither proven nor
  listed there.
- **Start workflows through `TemporalGateway`** with the contract from
  `@heliogrid/contracts/workflows`. The durable handoff is an outbox row in the SAME transaction:
  the repository calls `recordOutboxEvent(tx, …)` inside its tenant transaction, and the service
  hands the event id to `OutboxDispatcher.dispatchNow` after the commit; the sweep starts any it
  missed.
- Read the session with `sessionOf(req)`; route access is the controller's `RouteAccessMap` entry
  (`public`, `session-cookie`, `session`, `member` or `{ capability }`).
- In development the sign-in code and the invite link are written to the api log
  (`Message for +91…`). The invite's text leaves from the worker's `inviteMessage` run after the
  send commits, so its line appears only while the `worker` launch configuration and Temporal run.
- List endpoints: `orderBy(<sort key>, id)` — the id a unique tiebreak in the same direction —,
  `limit` and `page` from `paginationQuerySchema` (the service derives the offset), `totalCount`
  counted with the SAME `where` — never a divergent count query.

## Done means

Contract implemented AND proven by its HTTP suite in `tests/` · the FAILURE paths driven, not read:
a malformed request returns field-addressable `details[]`, a contract-violating response returns
opaque INTERNAL, and the response's request id matches the log with no PII.

## Traps

- Every api HTTP suite signs in with the ONE development number, so a suite that DELETES a company breaks other suites' sign-in (`session_active_tenant_id_tenant_id_fk` in an unrelated file) → a suite deletes only the rows it wrote and never a company; a session whose company is removed is unbound (`active_tenant_id = null`), never deleted.
- `app_user` holds SELECT on `tenant` and a `FOR SELECT` policy, so an UPDATE to a tenant column neither errors nor happens: RLS matches no row and `returning()` comes back empty, which reads like "nothing to change", and a column-level GRANT does not fix it → a tenant-editable setting gets its own tenant-scoped table with a `FOR ALL` policy; the `tenant` row keeps the founding facts.
- `pnpm dev` runs tsx (esbuild), which emits no decorator metadata, so an implicit constructor parameter fails at boot while every HTTP test, whose transform does emit it, stays green → explicit `@Inject(Token)` on EVERY parameter (`Reflector`, class providers and factory-built classes included), then boot it once (`curl localhost:8084/health`) before believing a service works.
- A route declaring a NON-base error code silently ships the wrong code: the envelope filter maps the status back to a code, and both sides compile → throw `ContractException` with that literal code AND an explicit `HttpStatus`.
- `vitest.config.mts` loads the developer's `.env.local`, so a suite that leans on an OPTIONAL variable (`GOOGLE_CLIENT_IDS`) passes on the machine that has it and goes red in CI, which sets none → a suite takes an optional value from a `vi.mock('../../src/config/env')` over the real `ENV`, never from the file.
- The HTTP suites run in parallel against one database, so a count over a whole table (`select count(*) from user_account`) moves under another suite's signup and the assertion flakes → count only the rows the case owns (`where phone_e164 = …`).
