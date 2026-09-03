---
paths:
  - "packages/db/**/*.ts"
  - "packages/db/migrations/*.sql"
---

# packages/db — append-only, tenant-scoped, fail-closed

Package shape and the greenfield state are `packages/db/CLAUDE.md`. Authoring a migration has a
sequence: run `/migration`.

## Where files go

```
migrations/NNNN_<what>.sql  four-digit, zero-padded, one above the highest; NEVER edited
src/schema/<area>.ts        the Drizzle mirror of what the migrations built
src/client.ts               connection factory + withTenantTransaction
src/migrate.ts              the sha256-locked runner
src/uuid.ts                 the ./uuid subpath — backend use only
```

A migration is named for what it does (`0002_lead_capture.sql`), never `0002_update.sql`.

## Rules

- **Migrations are append-only** (`M19`). Add a new numbered file; only an explicit owner ruling
  overrides this.
- **Every tenant-owned table needs all four**: a `tenant_id` column · a composite index leading
  with it · an RLS policy for `app_user` checking `app.tenant_id`, fail-closed via
  `current_setting('app.tenant_id', true)` · explicit grants. There are no default privileges, so
  a forgotten grant fails closed.
- A genuinely global table goes in `GLOBAL_TABLES` in `tests/invariants/src/table-tenancy-scan.ts`
  **with its reason**. There is no third option, and the scan fails on any table that is neither.
- Tenancy is defence in depth, all three always: guard (session claims) → repository filter
  (tenantId from context, never from client input) → RLS backstop.
- **Cross-tenant reads return 404, never 403** — never reveal that another tenant's row exists.
- ids are UUIDv7 generated **app-side**; tables carry no DB-side id default, so a raw SQL insert
  must supply ids.
- Append-only ledgers (`audit_log`, `usage_events`, `sync_mutations`) get no UPDATE or DELETE
  grants.
- pgEnum values mirror the contract `z.enum`s (`M17`); change both sides in the same slice.
- **Schema grows module-wise only** (Law 9): a module authors its own tables when its slice
  begins, and satisfies its `docs/engineering/forward-compat.md` row while doing so. A table
  belonging to a module that has not started is a violation — stop and ask.
