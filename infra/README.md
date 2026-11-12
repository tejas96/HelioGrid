# HelioGrid infrastructure — state & one-command provisioning

The api and worker run against local Docker Postgres; deploys come later.

## Temporal (ADR-0025)

The local orchestration stack, its decisions and its runbooks: `infra/temporal/README.md`.
The reviewed — and **undeployed** — production candidate: `infra/temporal/deploy/README.md`.
Nothing exists for it yet; creating it is an owner-approved operation.

## Hosting

Nothing is deployed. Hosting moves to Oracle Cloud; its deploy config comes with that task
(`docs/tasks/deferred.md` D50).

## Local dev

```bash
pnpm infra:up      # from a clean clone: mints dev PKI, starts everything, bootstraps Temporal
pnpm infra:token   # re-mint the Temporal token (12-hour TTL)
pnpm infra:down    # stop, keep the data
pnpm infra:reset   # down -v — destroys the volume
```

**One Postgres container, four databases** (owner ruling 2026-08-27; the fourth 2026-10-05).
`heliogrid-pg-local` on port `5544` holds `heliogrid_dev` (the owner's development data) and
`heliogrid_test` (live QA with its seeded QA companies, the local api tests, the local web flows
and the invariants — disposable, but reseed the QA companies after a reset), both on the
Drizzle migrations, plus `temporal` and `temporal_visibility` (owned by `temporal-sql-tool`). Two
migration tools, separate databases, so neither can reach the other's tables — and the tenancy
invariant scans the one database its URL names, because `pg_class` is per-database.

A branch's first build rebuilds `heliogrid_test` empty, so no other branch's migration is left in
it (`pnpm infra:up` first when `docker ps` does not list `heliogrid-pg-local`), then migrates it
with the test-database prefix (`CLAUDE.md` §5):

```bash
docker exec heliogrid-pg-local psql -U heliogrid -d heliogrid_dev -v ON_ERROR_STOP=1 -c 'DROP DATABASE IF EXISTS heliogrid_test WITH (FORCE)' && docker exec -i heliogrid-pg-local psql -U heliogrid -d heliogrid_dev -v ON_ERROR_STOP=1 -f - < infra/postgres/init/03-test-database.sql
```

Roles and databases are provisioned by `infra/postgres/init/*.sql`, which Postgres runs once on
an empty volume. Nothing is created by hand any more. Put these in `.env.local`:

```
DATABASE_URL=postgres://app_runtime:app_runtime@localhost:5544/heliogrid_dev
DATABASE_ADMIN_URL=postgres://app_admin:app_admin@localhost:5544/heliogrid_dev
```

Switching to the test database is the database name in both lines, then `pnpm db:migrate` with
the file exported (`set -a; . ./.env.local; set +a` — the command reads the shell, not the file)
and a restart of the api alone; web, Metro and the phones keep talking to the api. A fresh test
database holds no market pack, so before the first sign-in there run
`pnpm --filter @heliogrid/api pack:publish` (it reads `.env.local` itself). `vitest.config.mts`
collects `apps/api/tests` locally only while both lines name `heliogrid_test`, skips them with a
warning otherwise, and throws when a collected run names `heliogrid_dev`. A volume created before
`03-test-database.sql` existed receives the database once:

```
docker exec -i heliogrid-pg-local psql -U heliogrid -d heliogrid_dev -v ON_ERROR_STOP=1 -f - < infra/postgres/init/03-test-database.sql
```

The four `TEMPORAL_TLS_*`/`TEMPORAL_AUTH_TOKEN_FILE` values ship as `/ABSOLUTE/PATH/TO/…`
placeholders. They must be ABSOLUTE: `apps/api`, `apps/worker` and `tests/invariants` each run
from their own directory, so no one relative value is right for all three. Run this from the repo
root and it fills them for you:

```bash
sed -i '' "s|/ABSOLUTE/PATH/TO|$PWD|g" .env.local   # GNU sed: drop the ''
```

**One object store** (`T-FPLAT-035`). `heliogrid-object-store-local` is RustFS on loopback port
`9000`, speaking the S3 API the api's one storage adapter speaks; `object-store-bucket` creates the
`heliogrid-files-local` bucket and exits. `.env.example`'s `OBJECT_STORE_*` block holds the matching
local values. Without them the api keeps files in memory and no client can upload one.

Redis is not started. `REDIS_URL` is declared in `.env.example` but no service reads it
(`packages/env/src/schema/api.ts` does not list it) — Law 9, it returns with its module.

**Migrating from the old `heliogrid-temporal` compose project?** Its leftover Docker network
still holds subnet `172.29.0.0/24`, and `pnpm infra:up` fails with a pool-overlap error until
it's removed — a one-time step, not an ongoing one:

```bash
docker network rm heliogrid-temporal_default
```

### QA read-only role

`qa_readonly` is created by `infra/postgres/init/01-roles.sql` — no longer by hand. It can
connect and holds no write grants. Its `SELECT` grants come from the migrations, through its
`app_user` membership — `0001` grants the market pack tables.

**`qa_readonly`'s membership in `app_user` is load-bearing, and the reason is a trap worth
understanding.** Every tenant table is RLS ENABLED and FORCEd
(`tests/invariants/src/tenancy-rls.ts` asserts it), and the policies are written for
`app_user`. A read-only role with no applicable policy therefore reads **zero rows from
every tenant table** — a confident empty answer that proves nothing. That is exactly the
vacuous-pass failure this repo's invariants exist to prevent.

So `qa_readonly` inherits `app_user`'s policies but holds no write grants of its own, and a
tenant-scoped query must set the tenant first:

```sql
SET LOCAL app.tenant_id = '<uuid>';   -- inside a transaction; without it, fail-closed = 0 rows
```

## Secrets wiring (when deploys start)

The full variable census lives in [.env.example](../.env.example). Never commit values.
