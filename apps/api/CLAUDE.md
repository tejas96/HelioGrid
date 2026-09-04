# @heliogrid/api — NestJS modular monolith, the only tenant-facing HTTP surface

Traps: `docs/engineering/landmines.md` · what holds a rule: `mechanisms.md` · deps:
`architecture.md` §2 apps/api.

## What lives here / what must never live here

- One Nest module per bounded context. Controllers implement ts-rest contracts and hold ZERO
  business logic: controller → service → tenant-scoped repository.
- NEVER: a hand-rolled `@Get`/`@Post` outside a contract (webhook receivers excepted), domain
  math (that is `packages/domain`), raw SQL outside a repository, a raw `process.env` read.

## Folder shape — a closed set; never invent a folder

```
src/{config,common,modules}
src/modules/<m>/    <m>.module|public|controller|service|repository.ts · tokens.ts · internal/
```

Overflow ~450 lines splits by SUBAREA in the same folder (`auth.invites.service.ts`).
`apps/worker` uses the same shape.

## Commands

`dev` and `start` pass `--env-file-if-exists=../../.env.local`, so local values load and a REAL
env var still wins — Fly secrets and CI are never overridden.

```
pnpm --filter @heliogrid/api dev | build | typecheck     # dev = tsx watch, API_PORT 8084
curl localhost:8084/health                               # liveness · /health/ready = readiness
```

## Local conventions

- **db and drizzle are legal ONLY in `*.repository.ts`.** Services take repositories by DI and
  never see a `tx` or a table; cross-tenant work lives in `*.admin.repository.ts`.
- Cross-module imports go through `<m>.public.ts`, never another module's service class.
- `common/` is framework plumbing two or more modules need. It may never import a module, and
  business behaviour belongs in `packages/domain` instead.
- **Every non-2xx response is the canonical envelope**, including the body-parser's 413, which
  `main.ts` answers before Nest sees the request. A route declaring a NON-base error code needs
  `ContractException`.
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
  CONTRACT from `@heliogrid/contracts/workflows`; the gateway derives the id from it. `start()`
  is idempotent by construction, which is not a licence to dual-write: the durable handoff is an
  outbox row in the SAME transaction (`forward-compat.md`, orchestration handoff).
- **NO GUARD EXISTS — every route ships public** (`M15`). A new controller is unauthenticated and
  nothing warns you. Restoring the guard is the auth module's job, not a local fix.
- List endpoints: `orderBy(<sort key> DESC, id DESC)`, limit/offset from `paginationQuerySchema`,
  `totalCount` counted with the SAME `where` — never a divergent count query.

## Done means

Contract implemented AND driven with curl · typecheck and lint green · the FAILURE paths driven,
not read: a malformed request returns field-addressable `details[]`, a contract-violating
response returns opaque INTERNAL, and the response's request id matches the log with no PII.
