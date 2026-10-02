# @heliogrid/config — shared build config: tsconfig presets and Biome plugins

Deps: `architecture.md` §2 config.

## What lives here / what must never live here

- tsconfig presets, consumed as `"extends": "@heliogrid/config/tsconfig/<preset>.json"`.
  `tsconfig/base.json` holds the shared compiler options, and the repo-root `tsconfig.base.json`
  extends IT — so there is one copy and the packages that extend the root file keep working.
- `biome/*.grit` — the repo's Biome lint plugins, one per rule, named for what it holds. The root
  `biome.json` registers each one with the files it reads. How to scope and silence one is
  `.claude/rules/biome.md`, which loads when you open a plugin.
- NEVER: runtime code, a dependency, or a `//` comment in a JSON preset. Anything executable belongs
  in a real package; a comment in a preset turns the build red, so its reasons live in this file.

## Commands

None. Consumers typecheck against the presets; `pnpm lint` runs the plugins.

## Local conventions

- `node-package.json` — a library package: `composite`, dist and d.ts emit. No tsconfig in the repo
  references another (ADR-0001), which is why a package builds with `tsc -p`, never `tsc -b` (`CLAUDE.md` §8). `nest-app.json` — a NestJS app (decorators and metadata, no composite).
- Presets use `${configDir}` so `outDir` and `rootDir` resolve per consumer.
- Two things the presets do NOT cover: a package with no matching preset extends
  `tsconfig.base.json` directly (there is no browser or react preset), and `apps/mobile`
  extends `base.json` here and then `@react-native/typescript-config`, whose settings win where the
  two overlap (`apps/mobile/CLAUDE.md`).

## Done means

`pnpm turbo typecheck` stays green across the workspace.

## Traps

- An `extends` that climbs out of this package resolves against the CONSUMER's `node_modules` for any tool that does not realpath: `tsc` realpaths and hides it, Vite does not, so a green typecheck does not prove these paths resolve → every `extends` here is package-relative (`./base.json`).
