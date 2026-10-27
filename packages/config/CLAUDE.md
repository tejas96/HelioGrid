# @heliogrid/config — shared build config: tsconfig presets and Biome plugins

- `unit-test-packages.json` — the set of packages that carry unit tests, read by the runner and by
  dependency-cruiser; its law is `.claude/rules/testing.md`.
- A preset is strict JSON (Biome refuses a comment), so a preset's reasons go in this file.
- `node-package.json` — a library package (composite, emits dist and d.ts). `nest-app.json` — a
  NestJS app (decorators, metadata, no composite).
- Two things the presets do NOT cover: a package with no matching preset extends
  `tsconfig.base.json` directly (there is no browser or react preset), and `apps/mobile`
  extends `base.json` here and then `@react-native/typescript-config`, whose settings win where the
  two overlap.

## Traps

- An `extends` that climbs out of this package resolves against the CONSUMER's `node_modules` for any tool that does not realpath: `tsc` realpaths and hides it, Vite does not, so a green typecheck does not prove these paths resolve → every `extends` here is package-relative (`./base.json`).
