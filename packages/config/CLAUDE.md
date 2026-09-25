# @heliogrid/config — shared tsconfig presets

Traps: `.claude/landmines.md` · deps: `architecture.md` §2 config.

## What lives here / what must never live here

- tsconfig presets only, consumed as `"extends": "@heliogrid/config/tsconfig/<preset>.json"`.
  `tsconfig/base.json` holds the shared compiler options, and the repo-root `tsconfig.base.json`
  extends IT — so there is one copy and the packages that extend the root file keep working.
- NEVER: runtime code, a dependency, or a `//` comment. Anything executable belongs in a real
  package; a comment turns the build red, so reasons live in this file.

## Commands

None — JSON only. Consumers typecheck against these.

## Local conventions

- `node-package.json` — a library package: `composite`, dist and d.ts emit. No tsconfig in the repo
  references another (ADR-0001), which is why a package builds with `tsc -p` (`M136`). `nest-app.json` — a NestJS app (decorators and metadata, no composite).
- Presets use `${configDir}` so `outDir` and `rootDir` resolve per consumer.
- Two things the presets do NOT cover: a package with no matching preset extends
  `tsconfig.base.json` directly (there is no browser or react preset), and `apps/mobile`
  extends `base.json` here and then `@react-native/typescript-config`, whose settings win where the
  two overlap (`apps/mobile/CLAUDE.md`).

## Done means

`pnpm turbo typecheck` stays green across the workspace. Note that a green typecheck does not
prove the `extends` paths resolve for every tool — see the landmine.
