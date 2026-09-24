---
name: migration
description: Author a database migration safely — schema first, generate the draft with pnpm db:migration:new, add the tenancy drizzle never generates, then apply and prove it against a real database. Use whenever schema changes.
---

# Authoring a migration

Schema law — what every table needs, tenancy defence in depth, Law 9 scoping — is in
`packages/db/CLAUDE.md`, which loads when you open a db file. This is the sequence.

## 1. Read the two registers, then change the Drizzle schema

**Read your module's rows before you type a column.** Two documents, and neither restates the
other:

- **`docs/engineering/data-model.md`** says what the ENTITIES are — find your domain in §2, filter
  the rows to your Block, and read the ⚠ cross-scope hazards at the top of §2. Purpose, owner, key
  fields, lifecycle and the PRD rows behind each. It is derived from `docs/prd/` and is NOT product
  truth: where it and the PRD disagree, the PRD wins.
- **`docs/engineering/forward-compat.md`** says what your module's FIRST migration must already
  satisfy so a later module is not forced into a refactor.

**Then answer the design check, in writing, in the task's Data model block — before the first
column.** A table or a column is cheap to add and never cheap to remove, so each one earns its place:

1. **Is this fact stored already?** Grep `packages/db/src/schema/`. A fact has ONE home; a second
   copy of a correct value still diverges.
2. **Can it be derived from what is stored?** Then compute it and do not store it. Store a derived
   value only for a named query that needs it, or as history that must not move.
3. **Which query reads it?** Name the query and the index that serves it. No index without a query,
   no query without an index, and `tenant_id` leads every tenant index.
4. **How fast does it grow per tenant?** A table that grows without bound states its horizon, its
   archive or its partition now — never "later".
5. **Who writes it, and can it change or go?** The grants say exactly that and no more: a column
   only one act may change gets a column-level `UPDATE` grant (`notification.read_at`), and a table
   nobody deletes from gets no `DELETE`.
6. **Can it be empty?** Nullable only where "unknown" or "not yet" is a real state. A closed set is
   a pgEnum mirrored from the domain tuple (`M17`); an open, pack-validated set is `text`.

A column for a need no row of the task names is refused (Law 9): the slice that needs it adds it.

Then `packages/db/src/schema/*.ts` is the source; the SQL is generated FROM it, not the other way
round. If you touched a pgEnum, run `/contract-change` in the same slice.

**Where the model turns out to be wrong, fix the model in the same change** (Law 8) — a logical
model that no migration ever corrected is a second spec, and nothing compares the two.

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
  and the scan fails on any table that is neither. A wrapped identity library's tables enter
  that list by their real names, with a reason, in the change that lands them — never before.

Then move the reviewed SQL into `packages/db/migrations/` as the next number above the highest:

```bash
ls packages/db/migrations/
```

An applied migration is append-only and three separate things refuse to let you edit one
(`M19`). Schema law — what every table needs,
tenancy defence in depth, Law 9 scoping — is in `packages/db/CLAUDE.md`, which loads when
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
register is what stops a later module forcing a refactor. If the tables you built differ from
`docs/engineering/data-model.md` §2, correct that document here (Law 8). There is no repo-wide frozen schema
document; a module authors its own tables (Law 9). Note the migration in the docs it affects.
Same commit (Law 8).
