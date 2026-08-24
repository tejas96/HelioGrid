---
name: migration
description: Author a database migration safely — a new append-only file, tenancy and grants, then applied and proven against a real database. Use whenever schema changes.
---

# Authoring a migration

Schema law — what every table needs, tenancy defence in depth, Law 9 scoping — is in
`.claude/rules/db-schema.md`, which loads when you open a db file. This is the sequence.

## 1. A new file, never an edit

```bash
ls packages/db/migrations/
```

Number one above the highest. A PreToolUse hook refuses an edit to a committed migration,
the sha256-locked runner refuses to apply one, and CI's append-only guard rejects the PR.

## 2. Write the DDL

Every tenant-owned table needs all four things the rule lists: `tenant_id`, a composite
index leading with it, a fail-closed RLS policy for `app_user`, and explicit grants. A
genuinely global table goes in `GLOBAL_TABLES` in
`tests/invariants/src/table-tenancy-scan.ts` with its reason — there is no third option, and
the scan fails on any table that is neither.

## 3. Mirror the Drizzle schema

Update `packages/db/src/schema/*.ts` to match. If you touched a pgEnum, run
`/contract-change` in the same slice.

## 4. Apply and prove — three runs, all must pass

```bash
pnpm --filter @heliogrid/db migrate    # fresh apply
pnpm --filter @heliogrid/db migrate    # again — must skip cleanly (idempotent)
pnpm turbo test                        # needs DATABASE_URL, or the invariants skip
```

The third is the one that matters. It proves cross-tenant reads see zero rows, cross-tenant
writes fail, missing tenant context fails closed, and the append-only ledgers reject
UPDATE. Without a database URL it skips — loudly when run locally, and as a hard failure
under CI. A skipped invariant that reports success is worse than no invariant at all.

## 5. Document

Check `docs/forward-compat.md` for your module's row and satisfy it in this migration — that
register is what stops a later module forcing a refactor. There is no repo-wide frozen schema
document; a module authors its own tables (Law 9). Note the migration in the docs it affects.
Same commit (Law 8).
