# @heliogrid/config — shared tsconfig presets

## What lives here / what must never live here
- tsconfig presets only (`tsconfig/*.json`), consumed via `"extends": "@heliogrid/config/tsconfig/<preset>.json"`.
- `tsconfig/base.json` holds the shared compiler options. The repo-root `tsconfig.base.json`
  extends IT, so there is one copy and the packages that extend the root file keep working.
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
- **Never a `//` comment in these files.** Biome parses them as strict JSON and the build goes
  red. The reasons live here and in `docs/engineering/architecture.md` §2 config.

## Landmines
- **Every `extends` in this package must be PACKAGE-RELATIVE (`./base.json`).** A consumer reads
  these files through `node_modules/@heliogrid/config/`, a pnpm symlink, so a path that climbs
  out of the package (`../../../tsconfig.base.json`) resolves to
  `packages/<consumer>/node_modules/` for any tool that does not realpath first. `tsc` DOES
  realpath, which hid this from every gate; Vite's transform does not, and no unit test in the
  repo could compile until it was fixed (2026-09-03). A green `pnpm turbo typecheck` does not
  prove these paths resolve — only a non-tsc tool does.

## Definition of done here
A preset change is done when `pnpm turbo typecheck` stays green across the workspace.

## Folder shape

`src/` with everything public re-exported from `src/index.ts`. Consumers import the index,
never a deep path. Never invent a folder: this tree is a closed set.
