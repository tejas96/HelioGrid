# @heliogrid/config — shared build config: tsconfig presets and Biome plugins

Deps: `architecture.md` §2 config.

## What lives here / what must never live here

- tsconfig presets: extend `"@heliogrid/config/tsconfig/<preset>.json"`. `tsconfig/base.json` holds
  the one copy of compiler options; the root `tsconfig.base.json` only extends it.
- `biome/*.grit`: one Biome plugin per rule, named for what it holds; the root `biome.json`
  registers each with the files it reads.
- `unit-test-packages.json` — the set of packages that carry unit tests, read by the runner and by
  dependency-cruiser; its law is `.claude/rules/testing.md`.
- NEVER runtime code or a dependency. A preset is strict JSON (Biome refuses a comment), so a
  preset's reasons go in this file.

## Commands

None — `pnpm lint` runs the plugins.

## Local conventions

- `node-package.json` — a library package (composite, emits dist and d.ts). `nest-app.json` — a
  NestJS app (decorators, metadata, no composite).
- Two things the presets do NOT cover: a package with no matching preset extends
  `tsconfig.base.json` directly (there is no browser or react preset), and `apps/mobile`
  extends `base.json` here and then `@react-native/typescript-config`, whose settings win where the
  two overlap.

## Done means

`pnpm turbo typecheck` stays green across the workspace.

## Traps

- An `extends` that climbs out of this package resolves against the CONSUMER's `node_modules` for any tool that does not realpath: `tsc` realpaths and hides it, Vite does not, so a green typecheck does not prove these paths resolve → every `extends` here is package-relative (`./base.json`).
