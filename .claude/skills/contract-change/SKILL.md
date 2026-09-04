---
name: contract-change
description: Change the API contract safely — edit first, re-emit OpenAPI, keep database enums in step, sweep every typed client, and judge breaking changes. Use whenever packages/contracts is edited.
---

# Changing the contract

Contract law — what may and may not go in a contract — is in `packages/contracts/CLAUDE.md`,
which loads when you open a contract file. This is the sequence to run.

## 1. Edit the contract first

Before any implementation. The diff is the API review surface (Law 3).

## 2. Re-emit and commit the OpenAPI surface

The emit reads `dist/`, so **build before you emit** — otherwise you emit the old surface
from stale `dist` and see no diff for a change you did make:

```bash
pnpm --filter @heliogrid/contracts build
pnpm --filter @heliogrid/contracts openapi
git diff --stat packages/contracts/openapi/openapi.json
```

Or run `pnpm check:openapi`, which builds, emits, fails on a stale committed spec, and —
when `oasdiff` is installed — also flags breaking changes against `origin/main`.

The committed spec must match the contract **in the same change**. A stale committed
surface is a lie told to every reader of it. CI enforces this half on every PR.

## 3. If you touched a `z.enum` the database also stores

The pgEnum changes in the same slice, through `/migration` — never by editing an applied
file. `db-no-upward` forbids importing contracts into `packages/db`, so the two sides are
hand-mirrored — but they are not unchecked:
`tests/invariants/src/enum-parity.ts` PROVES pgEnum ↔ z.enum parity (live pg_enum against
the contract schemas, both directions) via `pnpm turbo test` — needs `DATABASE_URL`
locally; CI fails closed. Change both sides in the same slice via `/migration`.

A value on one side only is a silent production defect — rows the API can never return, or
API values the database rejects at insert.

## 4. Sweep the typed clients

```bash
pnpm turbo typecheck
```

Web and mobile consume the ts-rest contract, so a shape change surfaces as a compile error
at every call site. The sole typed client lives in `packages/data/src/client/client.ts` —
the only `initClient` call in the repo. **A call site that did NOT break where you expected
it to is hand-rolling HTTP**: find it and route it through `@heliogrid/data`.

Adding an enum value must also break every `Record<TheEnum, …>` map that renders it. If
nothing broke, the map is not exhaustive — make it so.

## 5. Judge breaking changes before shipping

Removing a field, tightening a type, renaming a key or changing a declared status code
breaks every existing client. Additive changes — a new optional field, a new endpoint — do
not. A genuine break needs an owner ruling, stated in the change itself, before it merges.

For a mechanical second opinion, `pnpm check:openapi` diffs the emitted surface against
`origin/main` with `oasdiff` (install it locally: `brew install oasdiff`). It is advisory,
not a CI gate — a human reads the break and decides.
