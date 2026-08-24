# @heliogrid/forms — headless form layer (the ONLY form-state path for apps)

## What lives here / what must never live here
- `useZodForm` (contract schema → typed form state), `applyServerErrors` (envelope
  details → field errors), `installFormsErrorMap` (`error-map.ts` — the translated zod
  default map, this package's most incident-prone surface), the `z` re-export apps must
  import instead of bare zod, and react-hook-form re-exports (`Controller`, `useFieldArray`…).
- NEVER: UI components, copy/strings, data fetching, an environment read, schema
  definitions (schemas live in @heliogrid/contracts).

## Commands
pnpm --filter @heliogrid/forms build | typecheck     # tsc -b

## Dependency policy
docs/engineering/architecture.md §2 forms. Apps importing react-hook-form, `@hookform/resolvers/zod` or
bare `zod` directly is a lint failure (Biome `noRestrictedImports` + the cruiser rule
`forms-through-heliogrid-forms`).

## Landmines
- `zod` pinned `3.25.76` (repo-wide pin — ts-rest peer collapse otherwise).
- If `zodResolver` generics reject the Zod-3 schema after a dep bump, pin
  `@hookform/resolvers` back to the 3.x line (3.10.0) — same import path.
- **Apps import `z` from HERE, never from 'zod'** (Biome-banned): zod's dual ESM/CJS build
  gives the app bundler a different module instance, so `installFormsErrorMap`'s
  translated defaults silently never apply to schemas built with it (hit 2026-08-02).

## Definition of done here
build/typecheck/lint green · consumed by BOTH platforms' gallery form demo (Law 7) ·
the demo walked in a browser and on both simulators.
