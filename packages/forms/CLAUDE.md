# @heliogrid/forms — the headless form layer, the ONLY form-state path for apps

Traps: `docs/engineering/landmines.md` · deps: `architecture.md` §2 forms.

## What lives here / what must never live here

- `useZodForm` (a contract schema, or a `.pick()`/`.omit()` of it, drives value types AND
  validation) · `applyServerErrors` (envelope `details[]` → field errors) · `installFormsErrorMap`
  (the translated zod default map, this package's most incident-prone surface) · the `z`
  re-export apps must import instead of bare zod · the react-hook-form re-exports.
- NEVER: UI components, copy, data fetching, an environment read, or a schema definition —
  schemas live in `@heliogrid/contracts`.

## Commands

```
pnpm --filter @heliogrid/forms build | typecheck    # tsc -b
```

## Local conventions

- **Apps import `z` from HERE, never from `'zod'`** (`M4`). Zod's dual ESM/CJS build gives the app
  bundler a different module instance, so `installFormsErrorMap`'s translated defaults would
  silently never apply to schemas built with it.

## Done means

Build, typecheck and lint green · consumed by BOTH platforms (Law 7) · the form driven in a
browser and on both simulators.
