# @heliogrid/db — append-only, tenant-scoped, fail-closed

> **GREENFIELD.** Migrations `0001`–`0006` and all of `src/schema/` were deleted on an explicit
> owner ruling that overrode the append-only law: the identity spine could not be removed
> surgically because every platform table foreign-keys to it. What survives is `client.ts`,
> `migrate.ts` and `uuid.ts`. The next migration is `0001`, authored by the auth and tenancy
> module. Read the `auth/tenancy` row of `forward-compat.md` first. Everything below is what the
> rebuild must satisfy, not a description of today's contents.

Traps: `docs/engineering/landmines.md` · deps: `architecture.md` §2 db. Authoring a migration has
a sequence: run `/migration`.

## What lives here / what must never live here

- The Drizzle schema, the connection factory and `withTenantTransaction`, the migration runner,
  and the migrations themselves.
- **The entities come from `docs/engineering/data-model.md` §2** — what each one is, who owns it,
  its key fields and the PRD rows behind it, with a Block column saying when Law 9 lets you author
  it. This package holds the PHYSICAL answer; that document holds the logical one, and neither
  restates the other. `forward-compat.md` is the third: what your first migration must already
  satisfy.
- The `./uuid` subpath is backend-only; `node:crypto` cannot resolve in a browser or Metro bundle.
- NEVER: business logic, a contract import, an app import, or a table or column that is not in a
  migration.

## Where files go

```
migrations/NNNN_<what>.sql  four-digit, zero-padded, one above the highest; NEVER edited
src/schema/<area>.ts        the Drizzle mirror of what the migrations built
src/client.ts               connection factory + withTenantTransaction
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
  `current_setting('app.tenant_id', true)` · explicit grants. There are no default privileges, so
  a forgotten grant fails closed. `app_admin` is BYPASSRLS and audited.
- A genuinely global table goes in `GLOBAL_TABLES` in `tests/invariants/src/table-tenancy-scan.ts`
  **with its reason**. There is no third option, and the scan fails on any table that is neither.
- **Tenancy is defence in depth, all three always**: guard (session claims) → repository filter
  (tenantId from context, never from client input) → RLS backstop.
- **Cross-tenant reads return 404, never 403** — never reveal that another tenant's row exists.
- ids are UUIDv7 generated **app-side** via `$defaultFn`; tables carry no DB-side id default, so a
  raw SQL insert must supply ids.
- Append-only ledgers (`audit_log`, `usage_events`, `sync_mutations`) get no UPDATE or DELETE
  grants.
- pgEnum values hand-mirror the contract `z.enum`s (`M17`); change both sides in the same slice.
- `audit_log` and `usage_events` are PARTITIONED and drizzle-kit cannot express that, so their DDL
  is hand-authored and the Drizzle model is the query surface via the parent.
- `usage_events` dedupe is `(idempotency_key, period_key)`; a producer MUST derive `period_key`
  from `occurred_at` or retries stop being no-ops.
- An identity provider's own tables are owned by ITS migrator, never authored here.
- `tenants` INSERT is deliberately NOT granted to `app_user` — signup crosses tenancy and runs on
  the explicit admin path.
- **Schema grows module-wise only** (Law 9): a module authors its own tables when its slice
  begins, and satisfies its `forward-compat.md` row while doing so. A table belonging to a module
  that has not started is a violation — stop and ask.

## Done means

The migration applies fresh AND on an already-migrated database (idempotent skip) · the RLS
cross-tenant invariant green against real state · typecheck and lint green.
