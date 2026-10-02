---
name: migration
description: Author a database migration safely — the design and release checks first, the Drizzle schema, the generated draft, the tenancy Drizzle never writes, then apply twice and prove it with the invariants against the real database. Use whenever the schema changes.
---

# /migration — schema first, tenancy always, proven on the database

The schema law — what every table needs, tenancy in depth, what a module may author — is in
`packages/db/CLAUDE.md`, which loads when you open a db file. This is the order of work.

1. **Read** your module's rows in `docs/engineering/data-model.md` §2 (the hazards at its top too)
   and its row in `docs/engineering/forward-compat.md`. Where they and the PRD disagree, the PRD
   wins.
2. **Design check** — write the answers into the plan's `Data / API` line before the first column:
   - Is this fact stored already? Grep `packages/db/src/schema/`; a fact has one home.
   - Can it be derived from what is stored? Then compute it; store a derived value only for a named
     query, or as history that must not move.
   - Which query reads it, and which index serves that query? `tenant_id` leads every tenant index;
     no index without a query.
   - How fast does it grow per tenant? A table without a bound states its horizon now.
   - Who writes it, and can it change or go? The grants say exactly that and no more.
   - Can it be empty? Nullable only where "unknown" is a real state. A closed set is a pgEnum mirrored
     from the domain tuple; an open, pack-validated set is `text`.
3. **Release check** — the migration runs before the first new machine serves:
   - **Additive** (a table, a nullable column, a column with a default, an enum value added): one
     release.
   - **Rename, type change, `NOT NULL` on existing rows, a column or enum value removed**: two
     releases — expand, then contract; the old shape stays until nothing reads it.
   - **Existing rows get new values**: a backfill written by the application, in batches, safe to
     re-run, with a query that proves it done. The database is read-only to you.
   - **Data is lost**: the owner's ruling first.
   - An index on a table that can be large is built `CONCURRENTLY`, in a file whose first line is
     `-- heliogrid:no-transaction`, every statement safe to re-run.
4. **Edit `packages/db/src/schema/*.ts` first** — the SQL is generated from it. A pgEnum change also
   runs `/contract-change` in the same slice.
5. **Generate the draft:** `pnpm db:migration:new` writes `packages/db/drizzle-draft/`. It is
   git-ignored and holds the WHOLE schema, never a delta: copy out only this change's statements.
6. **Add what Drizzle never writes:** `tenant_id`, a composite index that leads with it, a fail-closed
   row-level-security policy for `app_user`, and explicit grants. A genuinely global table goes on
   `GLOBAL_TABLES` in `tests/invariants/src/table-tenancy-scan.ts` with its reason — there is no
   third option.
7. **Move it in** as the next number above the highest in `packages/db/migrations/`
   (`ls packages/db/migrations/`). An applied migration is never edited: a hook blocks it, and the
   runner is sha-locked.
8. **Prove it on the database:** `pnpm db:migrate` (applies), `pnpm db:migrate` again (must skip
   cleanly), then `pnpm turbo test` with the database — the invariants must RUN, not skip: they
   prove a cross-tenant read sees nothing, a cross-tenant write fails, a missing tenant fails
   closed, and the schema mirrors the migrations.
9. **Fix the docs** — where the tables you built differ from `data-model.md` or `forward-compat.md`,
   correct them in the same commit.
