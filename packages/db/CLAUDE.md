# @heliogrid/db — Drizzle schema, append-only migrations, RLS plumbing

> **GREENFIELD.** Migrations `0001`–`0006` and all of `src/schema/` were deleted on an explicit
> owner ruling that overrode the append-only law: the identity spine could not be removed
> surgically because every platform table foreign-keys to it. What survives is `client.ts`,
> `migrate.ts` and `uuid.ts`. The next migration is `0001`, authored by the auth and tenancy
> module. Read the `auth/tenancy` row of `forward-compat.md` first. Everything below is what the
> rebuild must satisfy, not a description of today's contents.

Traps: `docs/engineering/landmines.md` · schema law: `.claude/rules/db-schema.md` · authoring a
migration: `/migration` · deps: `architecture.md` §2 db.

## What lives here / what must never live here

- The Drizzle schema (`src/schema/*`), the connection factory and `withTenantTransaction`, the
  migration runner, and `migrations/*.sql`.
- The `./uuid` subpath is backend-only; `node:crypto` cannot resolve in a browser or Metro bundle.
- NEVER: business logic, a contract import, an app import, or a table or column that is not in a
  migration.

## Commands

```
pnpm --filter @heliogrid/db build | migrate
pnpm --filter @heliogrid/db exec drizzle-kit generate   # DRAFT into drizzle-draft/ — review, then move
```

`migrate` takes the URL as `argv[1]`; this package reads no environment, so it stays reusable.

## Local conventions

- **Migrations are append-only, filename-ordered and sha256-locked by the runner** (`M19`).
  Editing an applied file makes `migrate` refuse to run. Add a new numbered file instead.
- ids are UUIDv7 generated APP-SIDE via `$defaultFn`. Tables carry no DB-side id default on
  purpose, so a raw SQL insert must supply ids.
- **Every tenant table:** `tenant_id`, a composite index leading with it, a fail-closed RLS policy
  for `app_user`, and explicit grants. There are no default privileges, so a forgotten grant fails
  closed. `app_admin` is BYPASSRLS and audited.
- Append-only ledgers (`audit_log`, `usage_events`, `sync_mutations`) get no UPDATE or DELETE
  grants.
- pgEnum values hand-mirror the contract `z.enum`s, because `db-no-upward` forbids the import.
  `M17` proves both directions once tables exist; change both sides in the same slice.
- `audit_log` and `usage_events` are PARTITIONED and drizzle-kit cannot express that, so their DDL
  is hand-authored and the Drizzle model is the query surface via the parent.
- `usage_events` dedupe is `(idempotency_key, period_key)`; a producer MUST derive `period_key`
  from `occurred_at` or retries stop being no-ops.
- An identity provider's own tables are owned by ITS migrator, never authored here.
- `tenants` INSERT is deliberately NOT granted to `app_user` — signup crosses tenancy and runs on
  the explicit admin path.

## Done means

The migration applies fresh AND on an already-migrated database (idempotent skip) · the RLS
cross-tenant invariant green against real state · typecheck and lint green.
