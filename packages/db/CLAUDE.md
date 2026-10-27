# @heliogrid/db — append-only, tenant-scoped, fail-closed

> Before a migration, read its task's Data model block in `docs/tasks/`. Numbers go in LANDING
> order: a task landing out of sequence takes the next free number and fixes the docs that name it.

## What lives here / what must never live here

- This package holds the physical schema; an open task's Data model block holds the logical one
  until the task ships, and then the migrations and `src/schema/` are the record.
  `docs/engineering/forward-compat.md` lists what your first migration must already satisfy.
- The `./uuid` subpath is backend-only; `node:crypto` cannot resolve in a browser or Metro bundle.
- NEVER business logic.

## Where files go

```
migrations/NNNN_<what>.sql  four-digit, zero-padded, next free number
src/schema/<area>.ts        the Drizzle mirror of what the migrations built
src/client.ts               connection factory + the tenant door (`tenantPool`)
src/migrate.ts              the sha256-locked runner
```

## Commands

```
pnpm --filter @heliogrid/db build | migrate
pnpm db:migration:new                # drizzle-kit DRAFT into the git-ignored drizzle-draft/
```

A draft takes drizzle's own number and a random name (`0011_pink_yellowjacket.sql`): review it,
then move it to `migrations/` as the next free `NNNN_<what>.sql`.

`pnpm db:migrate` migrates the database `$DATABASE_ADMIN_URL` (else `$DATABASE_URL`) names in the
SHELL, so load it in the same command: `set -a; . ./.env.local; set +a; pnpm db:migrate`. For
`heliogrid_test`, use the test-database prefix (`.claude/skills/task/SKILL.md`, top) instead.
It prints the database it migrates before it applies anything, and refuses a URL typed after it.

## Rules

- Migrations are append-only: add a new file; the runner refuses an edited applied one.
- A migration runs in one transaction. One that cannot (`CREATE INDEX CONCURRENTLY`) starts with
  `-- heliogrid:no-transaction`, and then every statement in it is idempotent (`IF NOT EXISTS`):
  a crash mid-apply runs it again.
- `lock_timeout` is 3 s: a migration stuck behind a long query aborts. Run it again; never raise
  the value.
- **Every tenant-owned table needs all four**: a `tenant_id` column · a composite index leading
  with it · an RLS policy for `app_user` checking `app.tenant_id`, fail-closed via
  `nullif(current_setting('app.tenant_id', true), '')::uuid` — after a transaction-local
  `set_config` the setting reads `''`, and a bare `::uuid` throws 22P02 · explicit grants. On a
  partitioned table every unique key includes the partition key. There are no default privileges, so
  a forgotten grant fails closed. `app_admin` is BYPASSRLS and audited.
- A global table is listed with its reason in `tests/invariants/src/table-tenancy-scan.ts`:
  unreachable or ARMED (`GLOBAL_TABLES`), or readable reference data (`GLOBAL_READABLE_TABLES`).
- A `jsonb` payload column is typed as its ENVELOPE — key names, row identity, re-minted brands —
  never as the domain aggregate; the whole is parsed in `domain`, never here.
- A tenant repository is given `tenantPool(db)`, a `TenantPool` whose one method opens a tenant
  transaction. Take `TenantScopedDb` where a read must be a tenant's own, and `DbTransaction` where
  either pool's transaction will do.
- ids are UUIDv7 generated **app-side** via `$defaultFn`; tables carry no DB-side id default, so a
  raw SQL insert must supply ids.
- An append-only ledger gets no UPDATE, DELETE or TRUNCATE grant for any role under `app_user`, and
  joins `tests/invariants/src/append-only-ledgers.ts` in the migration that lands it (`tenancy-rls`
  asserts the list).
- An identity provider's own tables are owned by ITS migrator, never authored here.
- `tenant` INSERT is deliberately NOT granted to `app_user` — signup crosses tenancy and runs on
  the explicit admin path; so do every account, code and session write.

## Done means

The migration applied twice, then the invariants run against the real database.

## Traps

- A door opened INSIDE another door is a SEPARATE transaction, not a nested one: `withTenantTransaction` runs on the pool, so the inner call takes a second connection, its work COMMITS even when the outer rolls back, and a deep nest under load starves the pool → pass the `TenantScopedDb` you already hold down to the helper; open a second door only for a truly independent unit of work.
- A `TenantScopedDb` kept past its callback still runs and reads NOTHING: the transaction has ended, so `app.tenant_id` is gone and every tenant policy matches zero rows — an empty result, never an error → do the work inside the callback and return VALUES from it, never the `tx`.
