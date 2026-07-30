---
paths:
  - "packages/db/**/*.ts"
  - "packages/db/migrations/*.sql"
---

# Database — append-only, tenant-scoped, fail-closed

- **Migrations are append-only** and sha256-locked by the runner. Editing an applied file
  makes `migrate` refuse to run (a PreToolUse hook also blocks the edit). Add a new
  numbered file instead.
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
- **pgEnum values hand-mirror the contracts `z.enum`s and nothing checks them yet.**
  `db-no-upward` forbids importing contracts here, so when you touch `src/schema/enums.ts`,
  diff it against `packages/contracts/src/{common,auth}.ts` value-for-value in the same
  change and say so in the commit.
- Schema grows module-wise only (Law 9). docs/04 is frozen design, not a build order — a
  table belonging to a module that has not started is a violation, so stop and ask.

Authoring a migration has a sequence — new file, DDL, Drizzle mirror, three verification
runs. Run `/migration`.
