# @heliogrid/api — NestJS modular monolith, the only tenant-facing HTTP surface

Deps: `architecture.md` §2 apps/api.

## What lives here / what must never live here

- One Nest module per bounded context. Controllers implement ts-rest contracts and hold ZERO
  business logic: controller → service → tenant-scoped repository.
- NEVER: a hand-rolled `@Get`/`@Post` outside a contract (webhook receivers excepted).

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
`<m>.public.ts`). A module with one repository and one service needs none.

A file nearing 300 lines splits by subarea in the same folder: `settings.templates.service.ts`.

## Commands

```
pnpm --filter @heliogrid/api dev | build | typecheck     # dev = tsx watch, API_PORT 8084
pnpm --filter @heliogrid/api pack:publish                # the typed pack as its market's next revision, then the India platform catalog
curl localhost:8084/health                               # liveness · /health/ready = readiness
```

## Local conventions

- **db and drizzle only in `*.repository.ts`** — a service never sees a `tx` or a table; a
  `src/scripts/` command calls a service, never a repository. The file name picks the pool:
  `*.repository.ts` takes `TENANT_DB`; `*.admin.repository.ts` crosses tenants;
  `*.reference.repository.ts` reads tables no tenant owns.
- Cross-module imports go through `<m>.public.ts`, never another module's service class.
- **The audit module is a LEAF and stays one**: other modules' repositories import
  `recordAuditEntry` from it, so a `.public.ts` import in the other direction closes a cycle.
  An entry records ids; whoever renders a name resolves it on the read side.
- `common/` is plumbing two or more modules need; it never imports a module.
- **Tenancy is three layers, always**: the guard (session claims) → the repository filter
  (tenantId from context, never from client input) → RLS.
- **Cross-tenant reads return 404, never 403** — never reveal that another tenant's row exists.
- **Every non-2xx response is the canonical envelope** (`common/filters/`); never write an error
  body by hand.
- **A body `details[]` path is the SCHEMA FIELD path** (`phone`, `profile.age` — never
  `body.phone`): clients feed it straight to `applyServerErrors`. A query, header or param path
  is prefixed with its source only when the bare name would be ambiguous.
- **Response validation is ON globally.** A handler whose body fails its own contract, or which
  answers an UNDECLARED status, becomes an opaque `INTERNAL` on the wire; the truth goes to the
  log under the same request id. ts-rest checks only a RETURNED response, so a THROWN status meets
  its route in the envelope filter instead (`common/filters/declared-statuses.ts`): one the matched
  route does not declare — its own or the shared 400, 403 and 500 (`sharedRefusals`) — is the
  same opaque `INTERNAL`, and the log names the route and the status. The shared set holds for a
  THROWN status only: a controller mounts its area router, which does not carry it, so a handler
  never returns one of those statuses.
- `x-request-id` is assigned only in `common/request-id.ts`; name the header with
  `REQUEST_ID_HEADER` from `@heliogrid/contracts`, never the literal.
- The log shape and its redaction live only in `common/logging.ts`: add a redaction path there,
  never per-handler. Errors serialise through an ALLOWLIST (never turn it into a denylist), and the
  logged URL drops its query string, because `redact` reaches structured fields only.
- **Start workflows through `TemporalGateway`** with the contract from
  `@heliogrid/contracts/workflows`; the gateway derives the id. `start()` is idempotent, but the
  durable handoff is an outbox row in the SAME transaction (`docs/engineering/forward-compat.md`):
  the repository calls `recordOutboxEvent(tx, …)` inside its tenant transaction, and the service
  hands the event id to `OutboxDispatcher.dispatchNow` after the commit; the sweep starts any it missed.
- A workflow's steps that write this app's data run HERE: the module registers its queue with
  `TemporalActivityHost` at init, typed against the contract's activity interface.
- **Every controller declares route access with `RouteAccessMap`** beside `@TsRestHandler`:
  `public`, `session-cookie`, `session`, `member` or `{ capability }`. A missing entry fails to
  compile and the guard denies it. Never test a role inline; read the session with `sessionOf(req)`.
- In development the sign-in code and the invite link are written to the api log
  (`Message for +91…`). The invite's text leaves from the worker's `inviteMessage` run after the
  send commits, so its line appears only while the `worker` launch configuration and Temporal run.
- List endpoints: `orderBy(<sort key> DESC, id DESC)`, `limit` and `page` from
  `paginationQuerySchema` (the service derives the offset), `totalCount` counted with the SAME
  `where` — never a divergent count query.

## Done means

Contract implemented AND driven with curl · the FAILURE paths driven, not read: a malformed
request returns field-addressable `details[]`, a contract-violating response returns opaque
INTERNAL, and the response's request id matches the log with no PII.

## Traps

- Every api HTTP suite signs in with the ONE development number, so a suite that DELETES a company breaks other suites' sign-in (`session_active_tenant_id_tenant_id_fk` in an unrelated file) → a suite deletes only the rows it wrote and never a company; a session whose company is removed is unbound (`active_tenant_id = null`), never deleted.
- `app_user` holds SELECT on `tenant` and a `FOR SELECT` policy, so an UPDATE to a tenant column neither errors nor happens: RLS matches no row and `returning()` comes back empty, which reads like "nothing to change", and a column-level GRANT does not fix it → a tenant-editable setting gets its own tenant-scoped table with a `FOR ALL` policy; the `tenant` row keeps the founding facts.
- `pnpm dev` runs tsx (esbuild), which emits no decorator metadata, so an implicit constructor parameter fails at boot while every HTTP test, whose transform does emit it, stays green → explicit `@Inject(Token)` on EVERY parameter (`Reflector`, class providers and factory-built classes included), then boot it once (`curl localhost:8084/health`) before believing a service works.
- A route declaring a NON-base error code silently ships the wrong code: the envelope filter maps the status back to a code, and both sides compile → throw `ContractException` with that literal code AND an explicit `HttpStatus`.
- `vitest.config.mts` loads the developer's `.env.local`, so a suite that leans on an OPTIONAL variable (`GOOGLE_CLIENT_IDS`) passes on the machine that has it and goes red in CI, which sets none → a suite takes an optional value from a `vi.mock('../../src/config/env')` over the real `ENV`, never from the file.
- The HTTP suites run in parallel against one database, so a count over a whole table (`select count(*) from user_account`) moves under another suite's signup and the assertion flakes → count only the rows the case owns (`where phone_e164 = …`).
- `@Res({ passthrough: true })` on a `@TsRestHandler` method marks the response handled, so the handler's body never leaves the process and the request hangs with no error → set cookies through `responseOf(req)` (`common/auth/cookies.ts`), never an injected `@Res()`.
