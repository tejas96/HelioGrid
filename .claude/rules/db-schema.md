---
paths:
  - "packages/db/**/*.ts"
  - "packages/db/migrations/*.sql"
---

# Database — append-only, tenant-scoped, fail-closed

- **Migrations are append-only** and sha256-locked by the runner. Editing an applied file
  makes `migrate` refuse to run, and CI's `git diff --diff-filter=MDR` guard rejects the
  PR (no pre-edit hook exists — deleted 2026-07-31). Add a new numbered file instead.
  Overridden once, by owner ruling, in the auth teardown (docs/15
  R19) — not precedent. `migrations/` is empty; the next file is a fresh `0001`.
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
- **pgEnum values mirror the contracts `z.enum`s, and `tests/invariants/src/enum-parity.ts`
  PROVES it** — live `pg_enum` against the contract schemas, both directions, plus a check
  that a new pg enum is either mapped or listed in `NO_CONTRACT_YET`. `db-no-upward` still
  forbids importing contracts here, so change both sides in the same slice; the invariant is
  what stops one side moving alone. (This bullet used to say nothing checked them, while
  packages/db/CLAUDE.md and docs/17 both said the opposite — and all three load into the
  same turn.)
  **Vacuous today** (zero tables, zero enums) and says so. `tenant_status`/`user_status`/
  `invite_status` mappings were dropped with the auth contract — re-add them with the
  migration that re-creates those enums; the invariant cannot flag a mapping nobody wrote.
- Schema grows module-wise only (Law 9). docs/04 is frozen design, not a build order — a
  table belonging to a module that has not started is a violation, so stop and ask.

Authoring a migration has a sequence — new file, DDL, Drizzle mirror, three verification
runs. Run `/migration`.
