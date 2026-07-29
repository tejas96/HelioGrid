---
name: contract-change
description: Change the API contract safely — edit first, re-emit OpenAPI, keep database enums in step, sweep every typed client, and judge breaking changes. Use whenever packages/contracts is edited.
---

# Changing the contract

Contract law — what may and may not go in a contract — is in `.claude/rules/contracts.md`,
which loads when you open a contract file. This is the sequence to run.

## 1. Edit the contract first

Before any implementation. The diff is the API review surface (Law 3).

## 2. Re-emit and commit the OpenAPI surface

```bash
pnpm --filter @heliogrid/contracts openapi
git diff --stat packages/contracts/openapi/openapi.json
```

The committed spec must match the contract **in the same change**. A stale committed
surface is a lie told to every reader of it.

## 3. If you touched a `z.enum` the database also stores

The pgEnum changes in the same slice, through `/migration` — never by editing an applied
file. `db-no-upward` forbids importing contracts into `packages/db`, so nothing checks this
for you: diff `packages/db/src/schema/enums.ts` against the contract value-for-value and
say so in the commit. A value on one side only is a silent production defect — rows the API
can never return, or API values the database rejects at insert.

## 4. Sweep the typed clients

```bash
pnpm turbo typecheck
```

Web and mobile consume the ts-rest contract, so a shape change surfaces as a compile error
at every call site. **A call site that did NOT break where you expected it to is
hand-rolling HTTP** — fix it to use the typed client (`apps/web/lib/api-client.ts`,
`apps/mobile/src/data/api-client.ts`).

Adding an enum value must also break every `Record<TheEnum, …>` map that renders it. If
nothing broke, the map is not exhaustive — make it so.

## 5. Judge breaking changes before shipping

Removing a field, tightening a type, renaming a key or changing a declared status code
breaks every existing client. Additive changes — a new optional field, a new endpoint — do
not. A genuine break needs an owner ruling recorded in the module roadmap before it merges.
