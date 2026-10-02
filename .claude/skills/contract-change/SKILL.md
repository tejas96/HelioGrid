---
name: contract-change
description: Change the API contract safely — the contract first, the OpenAPI spec re-emitted and committed, database enums kept in step, every typed client swept, and breaking changes judged before they merge. Use whenever packages/contracts is edited.
---

# /contract-change — contract first, spec fresh, clients swept, breaks judged

What may and may not go in a contract is in `packages/contracts/CLAUDE.md`, which loads when you open
a contract file. This is the order of work.

1. **Edit the contract first**, before any implementation. The diff is the API's review surface.
2. **Re-emit the spec and commit it in the same change.** The emit reads `dist/`, so build first:
   `pnpm check:openapi` builds, emits and fails while the committed spec differs from what the
   contract emits — then the fresh spec is on disk; commit it.
3. **A `z.enum` the database also stores** changes its pgEnum in the same slice, through
   `/migration` — never by editing an applied file. The `enum-parity` invariant proves the two
   match, both ways; it needs the database.
4. **Sweep the clients:** `pnpm turbo typecheck`. Web and mobile consume the typed contract, so a
   shape change breaks every call site — a call site that did NOT break is making raw HTTP calls:
   route it through `@heliogrid/data`. A new enum value must break every `Record<TheEnum, …>` that
   renders it; one that did not break is not exhaustive — make it so.
5. **Judge breaking changes before the merge.**
   - Removing a field, tightening a type, renaming a key or changing a declared status breaks every
     existing client, and phones in the field update weeks late. Additive changes — a new optional
     field, a new endpoint — do not.
   - CI's oasdiff step judges the SHAPE on every pull request. A response set that grows by design
     is declared `extensibleEnum` in `common.ts`; anything else oasdiff flags needs the owner's
     ruling, stated in the change.
   - A change of MEANING in the same shape — a unit or a scale, a time zone, what a status, a zero or
     an empty list stands for — is just as breaking: name it in the change and pin the new meaning
     with a test.
