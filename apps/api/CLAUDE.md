# @heliogrid/api — NestJS modular monolith, the only tenant-facing HTTP surface

Deps: `architecture.md` §2 apps/api.

## What lives here / what must never live here

- One Nest module per bounded context. Controllers implement ts-rest contracts and hold ZERO
  business logic: controller → service → tenant-scoped repository.
- NEVER: a hand-rolled `@Get`/`@Post` outside a contract (webhook receivers excepted), domain
  math (that is `packages/domain`), raw SQL outside a repository, a raw `process.env` read.

## Folder shape — a closed set; never invent a folder

```
src/app.ts · main.ts  createApp() is the ONE boot path; main.ts listens, a test listens on port 0
src/common/auth/    the guard, the route-access map, the cookies, the session context
src/modules/<m>/    <m>.module|public|controller|service|repository.ts · tokens.ts · internal/
src/scripts/<verb>-<noun>.ts   a command: boots the application context, calls ONE service, exits
```

`internal/` is a privacy boundary, not tidying: what the module's own service uses and nothing
outside may import. One repository and one service need none; `auth`'s seven files do.

A file nearing Biome's 300-line cap splits by SUBAREA in the same folder (for example
`auth.invites.service.ts`). `apps/worker` uses the same shape.

## Commands

`dev` and `start` pass `--env-file-if-exists=../../.env.local`, so local values load and a REAL
env var still wins — the production host's secrets and CI are never overridden.

```
pnpm --filter @heliogrid/api dev | build | typecheck     # dev = tsx watch, API_PORT 8084
pnpm --filter @heliogrid/api pack:publish                # the typed pack as its market's next revision
curl localhost:8084/health                               # liveness · /health/ready = readiness
```

## Local conventions

- **db and drizzle are legal ONLY in `*.repository.ts`**; a service sees no `tx` or table, and a
  `src/scripts/` command drives a service, never a repository. **The NAME states the pool**: plain
  takes `TENANT_DB`, a DOOR with no query of its own · `*.admin.repository.ts` crosses
  tenancy · `*.reference.repository.ts` reads what no tenant owns — the last two fenced, on raw `Db`.
- Cross-module imports go through `<m>.public.ts`, never another module's service class.
- **The audit module is a LEAF and stays one**: other modules' repositories import
  `recordAuditEntry` from it, so a `.public.ts` import in the other direction closes a cycle.
  An entry records ids; whoever renders a name resolves it on the read side.
- `common/` is framework plumbing two or more modules need. It may never import a module, and
  business behaviour belongs in `packages/domain` instead.
- **Every non-2xx response is the canonical envelope**, including the body-parser's 413, which
  `app.ts` answers before Nest sees the request.
- **A body `details[]` path is the SCHEMA FIELD path** (`phone`, `profile.age` — never
  `body.phone`): clients feed it straight to `applyServerErrors`. A query, header or param path
  is prefixed with its source only when the bare name would be ambiguous.
- **Response validation is ON globally.** A handler whose body fails its own contract, or which
  answers an UNDECLARED status, becomes an opaque `INTERNAL` on the wire; the truth goes to the
  log under the same request id.
- **`x-request-id` is assigned in one place** (`common/request-id.ts`, mounted before CORS and
  body parsing) so even a parser 413 carries one. The header NAME is `REQUEST_ID_HEADER` from
  `@heliogrid/contracts`, never the literal — `packages/data` forwards the same one.
- The log shape and its redaction live in ONE file, `common/logging.ts`. Add a redaction path
  there, never per-handler.
- **Workflows are started through `TemporalGateway`**, never a client a service builds. Pass the
  CONTRACT from `@heliogrid/contracts/workflows`; the gateway derives the id from it. The channel
  opens on FIRST use, never at boot. `start()` is idempotent by construction, not a licence to
  dual-write: the durable handoff is an outbox row in the SAME transaction (`forward-compat.md`).
- **Every controller declares its routes' access with `RouteAccessMap`**, beside `@TsRestHandler`:
  `public`, `session-cookie`, `session`, `member` or `{ capability }`. The map is typed against the
  router, so a route the contract gains fails to compile until it says what it needs, and the
  guard denies a route with no entry — silence is denial. Never an inline role test: the
  capability is domain's. The session a handler needs is `sessionOf(req)`.
- **In development the sign-in code and the invite link are written to the log**
  (`Message for +91…`), because the message rail is bound to the development adapter; the SMS
  adapter replaces it and the development one refuses to run in production.
- List endpoints: `orderBy(<sort key> DESC, id DESC)`, limit/offset from `paginationQuerySchema`,
  `totalCount` counted with the SAME `where` — never a divergent count query.

## Done means

Contract implemented AND driven with curl · typecheck and lint green · the FAILURE paths driven,
not read: a malformed request returns field-addressable `details[]`, a contract-violating
response returns opaque INTERNAL, and the response's request id matches the log with no PII.

## Traps

- Every api HTTP suite signs in with the ONE development number, so a new session binds to whichever membership that number holds, including a company another suite created; a suite that DELETES companies races every other suite's sign-in, and the loser fails on `session_active_tenant_id_tenant_id_fk` in an unrelated file → a suite deletes only the rows it wrote and leaves the company standing; a session bound to a company being removed is UNBOUND (`active_tenant_id = null`), never deleted.
- `app_user` holds SELECT on `tenant` and a `FOR SELECT` policy, so an UPDATE to a tenant column neither errors nor happens: RLS matches no row and `returning()` comes back empty, which reads like "nothing to change", and a column-level GRANT does not fix it → a tenant-editable setting gets its own tenant-scoped table with a `FOR ALL` policy; the `tenant` row keeps the founding facts.
- `pnpm dev` runs tsx (esbuild), which emits no decorator metadata, so an implicit constructor parameter fails at boot while every HTTP test, whose transform does emit it, stays green → explicit `@Inject(Token)` on EVERY parameter (`Reflector`, class providers and factory-built classes included), then boot it once (`curl localhost:8084/health`) before believing a service works.
- A route declaring a NON-base error code silently ships the wrong code: the envelope filter maps the status back to a code, and both sides compile → throw `ContractException` with that literal code AND an explicit `HttpStatus`.
- `redact` reaches structured fields only: `req.query.phone` is censored while the same value inside the raw `req.url` is not → `common/logging.ts` strips the query string from the logged URL.
- A ts-rest `RequestValidationError` carries the submitted data, and some Zod issue codes include the value → `common/logging.ts` serialises errors through an ALLOWLIST; never turn it into a denylist.
- `@Res({ passthrough: true })` on a `@TsRestHandler` method marks the response handled, so the handler's body never leaves the process and the request hangs with no error → set cookies through `responseOf(req)` (`common/auth/cookies.ts`), never an injected `@Res()`.
