---
paths:
  - "packages/db/**/*.ts"
  - "packages/db/migrations/*.sql"
---

# packages/db — append-only, tenant-scoped, fail-closed

## Where files go

```
migrations/NNNN_<what>.sql  four-digit, zero-padded, one above the highest; NEVER edited
src/schema/<area>.ts        the Drizzle mirror of what the migrations built
src/client.ts               connection factory + withTenantTransaction
src/migrate.ts              the sha256-locked runner
src/uuid.ts                 the ./uuid subpath — the one thing frontends may import
```

A migration is named for what it does (`0002_lead_capture.sql`), never `0002_update.sql`.

## Rules

- **Migrations are append-only.** A PreToolUse hook refuses the edit, the runner's sha256
  lock refuses to apply, and CI's `git diff --diff-filter=MDR` guard rejects the PR. Add a
  new numbered file instead. Only an explicit owner ruling overrides this.
- **Every tenant-owned table needs all four**: a `tenant_id` column · a composite index
  leading with it · an RLS policy for `app_user` checking `app.tenant_id`, fail-closed via
  `current_setting('app.tenant_id', true)` · explicit grants. There are no default
  privileges, so a forgotten grant fails closed.
  A genuinely global table goes in `GLOBAL_TABLES` in
  `tests/invariants/src/table-tenancy-scan.ts` **with its reason** — there is no third
  option, and the scan fails on any table that is neither.
- Tenancy is defence in depth, all three always: guard (JWT claims) → repository filter
  (tenantId from context, never from client input) → RLS backstop.
- Cross-tenant reads return 404, never 403 — never reveal that another tenant's row exists.
- ids are UUIDv7 generated **app-side**; tables carry no DB-side id default, so raw SQL
  inserts must supply ids.
- Append-only ledgers (`audit_log`, `usage_events`, `sync_mutations`) get no UPDATE or
  DELETE grants.
- **pgEnum values mirror the contracts `z.enum`s**; `tests/invariants/src/enum-parity.ts`
  proves both directions and flags an unmapped enum. `db-no-upward` forbids importing
  contracts here, so change both sides in the same slice. The invariant is **vacuous while
  the schema is empty** and says so when it runs — re-add the dropped auth enum mappings
  with the migration that re-creates them (`packages/db/CLAUDE.md`).
- Schema grows module-wise only (Law 9): a module authors its own tables when its slice
  begins, and satisfies its `docs/engineering/forward-compat.md` row while doing so. A table belonging to
  a module that has not started is a violation, so stop and ask.

Authoring a migration has a sequence — new file, DDL, Drizzle mirror, three verification
runs. Run `/migration`.
