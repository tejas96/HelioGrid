# @heliogrid/config — shared tsconfig presets

## What lives here / what must never live here
- tsconfig presets only (`tsconfig/*.json`), consumed via `"extends": "@heliogrid/config/tsconfig/<preset>.json"`.
- No runtime code, no dependencies, ever. Anything executable belongs in a real package.

## Commands
None — JSON only. Consumers typecheck against these.

## Depends on / depended on by
uses: nothing        used by: every package and app (devDependency)

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
