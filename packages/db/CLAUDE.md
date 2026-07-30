# @heliogrid/db — Drizzle schema + append-only migrations + RLS plumbing

## What lives here / what must never live here
- Drizzle schema (`src/schema/*`), the connection factory + `withTenantTransaction`
  (SET LOCAL app.tenant_id), the migration runner, and `migrations/*.sql`.
- NEVER: business logic, contract imports, app imports. Never a table/column that is not
  in docs/04 or a migration.

## Commands
pnpm --filter @heliogrid/db build        # tsc -b
pnpm --filter @heliogrid/db migrate      # apply migrations; the SCRIPT passes
                                         # ${DATABASE_ADMIN_URL:-$DATABASE_URL} as argv[1].
                                         # This package reads no environment: runMigrations(url)
                                         # takes the URL, so it stays reusable and testable.
pnpm --filter @heliogrid/db exec drizzle-kit generate   # DRAFT SQL into drizzle-draft/ (review → move to migrations/)

## Depends on / depended on by
uses: drizzle-orm, postgres        used by: apps/api, apps/worker, tests/invariants

## Local conventions
- Migrations are append-only, filename-ordered, sha256-locked by the runner — editing an
  applied file makes `migrate` refuse to run. Add a new file instead.
- ids are UUIDv7 generated APP-SIDE (`uuidv7()` via Drizzle `$defaultFn`) — tables have
  no DB-side id default on purpose; raw SQL inserts must supply ids.
- Every tenant table: RLS policy for `app_user` checking `app.tenant_id`, fail-closed
  (`current_setting(..., true)` → NULL → zero rows). app_admin is BYPASSRLS, audited.
- Append-only tables (audit_log, usage_events, sync_mutations): no UPDATE/DELETE grants.
- New module tables land in the OWNING module's first migration with explicit grants —
  there are no default privileges, so a forgotten grant fails closed.

## Landmines
- **pgEnum values hand-mirror the contracts `z.enum`s — and this is now CHECKED.**
  `db-no-upward` (dependency-cruiser) forbids importing contracts here, so the sync cannot
  be a type-level one. `tests/invariants/src/enum-parity.ts` closes it instead: it reads
  live `pg_enum` values and compares them to the contract schemas (which it MAY import,
  being tagged `app`). Both drift directions fail the build, and a NEW pg enum that is
  neither mapped nor listed in `NO_CONTRACT_YET` also fails — so "does this cross the wire?"
  becomes a conscious decision rather than a silent omission.
  When you touch `src/schema/enums.ts`, change the contract `z.enum` in the same slice and
  run `/contract-change`. A value present in one and not the other is a silent production
  defect (rows the API can never return, or API values the DB rejects at insert) — which is
  why it was the highest-risk drift in the repo until 2026-07-30.
- audit_log / usage_events are PARTITIONED — drizzle-kit cannot express this; their DDL
  is hand-authored in migrations, the Drizzle model is the query surface via the parent.
  Partition upkeep beyond 2027-06 is a worker job (Track A); default partitions catch
  overflow meanwhile.
- usage_events dedupe is `(idempotency_key, period_key)` — producers MUST derive
  period_key from occurred_at ('YYYY-MM') or retries stop being no-ops.
- Better Auth owns its own tables via its migrator — never author or query them here.
- `tenants` INSERT is deliberately NOT granted to app_user — signup crosses tenancy and
  runs on the explicit admin path (Track A wires it).

## Definition of done here
Migration applies fresh AND on an already-migrated DB (idempotent skip) · RLS
cross-tenant invariant green · `pnpm turbo typecheck lint` green.
