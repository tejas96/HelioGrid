# @heliogrid/db — append-only, tenant-scoped, fail-closed

> A migration is named for what it does, so `migrations/` IS the list and it is not restated here.
> Before authoring the next one, read its Data model block in `docs/tasks/`. A number is taken in
> LANDING order, so a task landing out of sequence takes the next free one and sweeps the docs.

Traps: `.claude/landmines.md` · deps: `architecture.md` §2 db. Authoring a migration has
a sequence: run `/migration`.

## What lives here / what must never live here

- The Drizzle schema, the connection factory and the TENANT DOOR, the migration runner,
  and the migrations themselves.
- **The entities come from the owning task's Data model block** in `docs/tasks/` — what each one
  is, its key fields, its tenancy and the PRD rows behind it. This package holds the PHYSICAL
  answer; the task holds the logical one, and neither restates the other. `forward-compat.md` is
  the third: what your first migration must already satisfy.
- The `./uuid` subpath is backend-only; `node:crypto` cannot resolve in a browser or Metro bundle.
- NEVER: business logic, a contract import, an app import, or a table or column that is not in a
  migration.

## Where files go

```
migrations/NNNN_<what>.sql  four-digit, zero-padded, one above the highest; NEVER edited
src/schema/<area>.ts        the Drizzle mirror of what the migrations built
src/client.ts               connection factory + the tenant door (`tenantPool`)
src/migrate.ts              the sha256-locked runner
src/uuid.ts                 the ./uuid subpath — backend use only
```

A migration is named for what it does (`0002_lead_capture.sql`), never `0002_update.sql`.

## Commands

```
pnpm --filter @heliogrid/db build | migrate
pnpm --filter @heliogrid/db exec drizzle-kit generate   # DRAFT into drizzle-draft/ — review, then move
```

`migrate` takes the URL as `argv[1]`; this package reads no environment, so it stays reusable.

## Rules

- **Migrations are append-only** (`M19`). Editing an applied file makes `migrate` refuse to run.
  Add a new numbered file; only an explicit owner ruling overrides this.
- **Every tenant-owned table needs all four**: a `tenant_id` column · a composite index leading
  with it · an RLS policy for `app_user` checking `app.tenant_id`, fail-closed via
  `nullif(current_setting('app.tenant_id', true), '')::uuid` — after a transaction-local
  `set_config` the setting reads `''`, and a bare `::uuid` throws 22P02 · explicit grants. On a
  partitioned table every unique key includes the partition key. There are no default privileges, so
  a forgotten grant fails closed. `app_admin` is BYPASSRLS and audited.
- A global table is unreachable (`GLOBAL_TABLES` — `app_user` cannot touch it: the codes, the
  sessions), ARMED (the same list — RLS enabled and forced with one canonical SELECT policy:
  `tenant` by its own id, `user_account` through a membership) or readable reference data
  (`GLOBAL_READABLE_TABLES` — SELECT held, no write privilege, no RLS; the market pack), each
  listed **with its reason** in `tests/invariants/src/table-tenancy-scan.ts`. Any other table
  fails the scan (`M12`).
- A `jsonb` payload column is typed as its ENVELOPE — key names, row identity, re-minted brands —
  never as the domain aggregate; the whole is parsed in `domain`, never here.
- **Tenancy is defence in depth, all three always**: guard (session claims) → repository filter
  (tenantId from context, never from client input) → RLS backstop.
- **A tenant repository is given a DOOR, not a database** (`M11`): `tenantPool(db)` returns a
  `TenantPool` with one method and no query of its own, so a read that never names its tenant
  does not compile. Take the branded `TenantScopedDb` wherever a read must be a tenant's own,
  and `DbTransaction` where either pool's transaction is legitimate.
- **Cross-tenant reads return 404, never 403** — never reveal that another tenant's row exists.
- ids are UUIDv7 generated **app-side** via `$defaultFn`; tables carry no DB-side id default, so a
  raw SQL insert must supply ids.
- Append-only ledgers (`audit_log_entry` today) get no UPDATE or DELETE grants, and the tenancy
  invariant asserts it from the catalog over every RLS-subject role.
- pgEnum values hand-mirror the contract `z.enum`s (`M17`); change both sides in the same slice.
- `usage_events` dedupe is `(idempotency_key, period_key)`; a producer MUST derive `period_key`
  from `occurred_at` or retries stop being no-ops.
- An identity provider's own tables are owned by ITS migrator, never authored here.
- `tenant` INSERT is deliberately NOT granted to `app_user` — signup crosses tenancy and runs on
  the explicit admin path; so do every account, code and session write.
- **Schema grows module-wise only** (Law 9): a module authors its own tables when its slice
  begins, and satisfies its `forward-compat.md` row while doing so. A table belonging to a module
  that has not started is a violation — stop and ask.

## Done means

The migration applies fresh AND on an already-migrated database (idempotent skip) · the RLS
cross-tenant invariant green against real state · typecheck and lint green.
