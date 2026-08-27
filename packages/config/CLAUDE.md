# @heliogrid/config — shared tsconfig presets

## What lives here / what must never live here
- tsconfig presets only (`tsconfig/*.json`), consumed via `"extends": "@heliogrid/config/tsconfig/<preset>.json"`.
- No runtime code, no dependencies, ever. Anything executable belongs in a real package.

## Commands
None — JSON only. Consumers typecheck against these.

## Dependency policy
docs/engineering/architecture.md §2 config. Two things the presets do NOT cover: a package with no
matching preset extends `tsconfig.base.json` directly (there is no browser/react preset), and
apps/mobile deliberately skips this package for
`@react-native/typescript-config`, which is why its strict flags are set locally — a new
base strictness flag must be copied there by hand.

## Local conventions
- `node-package.json` — composite library package (dist + d.ts emit, project-reference member).
- `nest-app.json` — NestJS app (decorators + metadata, no composite).
- Presets use `${configDir}` (TS 5.5+) so outDir/rootDir resolve per consumer.

## Landmines
- The relative `"extends": "../../../tsconfig.base.json"` resolves from this package's REAL
  location on disk — it works because the repo root holds tsconfig.base.json. Do not move
  this package deeper without fixing those paths.

## Definition of done here
A preset change is done when `pnpm turbo typecheck` stays green across the workspace.

## Folder shape

`src/` with everything public re-exported from `src/index.ts`. Consumers import the index,
never a deep path. Never invent a folder: this tree is a closed set.
