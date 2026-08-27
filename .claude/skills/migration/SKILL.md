---
name: migration
description: Author a database migration safely — schema first, generate the draft with pnpm db:migration:new, add the tenancy drizzle never generates, then apply and prove it against a real database. Use whenever schema changes.
---

# Authoring a migration

Schema law — what every table needs, tenancy defence in depth, Law 9 scoping — is in
`.claude/rules/db-schema.md`, which loads when you open a db file. This is the sequence.

## 1. Change the Drizzle schema first

`packages/db/src/schema/*.ts` is the source; the SQL is generated FROM it, not the other way
round. If you touched a pgEnum, run `/contract-change` in the same slice.

## 2. Generate the draft — never hand-author

```bash
pnpm db:migration:new          # drizzle-kit generate -> packages/db/drizzle-draft/
```

`drizzle-draft/` is git-ignored and unreviewed. **It is a draft, not a migration.**

## 3. Review the draft, then move it in

Drizzle generates the table and columns. It does NOT generate tenancy, and that is the half
that matters. Add all four before the file moves:

- `tenant_id`, a composite index leading with it, a fail-closed RLS policy for `app_user`,
  and explicit grants.
- A genuinely global table goes in `GLOBAL_TABLES` in
  `tests/invariants/src/table-tenancy-scan.ts` **with its reason** — there is no third option,
  and the scan fails on any table that is neither. A `PROVISIONAL` entry there fails the scan
  the moment its table exists, so resolving it is a deliberate edit.

Then move the reviewed SQL into `packages/db/migrations/` as the next number above the highest:

```bash
ls packages/db/migrations/
```

A PreToolUse hook refuses an edit to a committed migration, the sha256-locked runner refuses to
apply one, and CI's append-only guard rejects the PR. Schema law — what every table needs,
tenancy defence in depth, Law 9 scoping — is in `.claude/rules/db-schema.md`, which loads when
you open a db file.

## 4. Apply and prove — three runs, all must pass

```bash
pnpm db:migrate      # fresh apply
pnpm db:migrate      # again — must skip cleanly (idempotent)
pnpm turbo test      # needs DATABASE_URL, or the invariants skip
```

The third is the one that matters. It proves cross-tenant reads see zero rows, cross-tenant
writes fail, missing tenant context fails closed, and the append-only ledgers reject
UPDATE. Without a database URL it skips — loudly when run locally, and as a hard failure
under CI. A skipped invariant that reports success is worse than no invariant at all.

## 5. Document

Check `docs/engineering/forward-compat.md` for your module's row and satisfy it in this migration — that
register is what stops a later module forcing a refactor. There is no repo-wide frozen schema
document; a module authors its own tables (Law 9). Note the migration in the docs it affects.
Same commit (Law 8).
