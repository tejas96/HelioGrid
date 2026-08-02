# @heliogrid/tokens — generated design tokens (ds-source is the only source of truth)

## What lives here / what must never live here
- `build.ts` + `src/` parse `design/ds-source/tokens/*.css` and emit `dist/` (tokens.css,
  base.css, theme.ts, tokens.json, contrast.pairs.json, fonts/).
- **Plus ONE emit outside `dist/`:** the native splash canvas, written into
  `apps/mobile/android/…/values/colors.xml` and `apps/mobile/ios/…/SplashCanvas.colorset/`,
  **committed** (not gitignored) because xcodebuild and Gradle cannot import this package.
  Deliberate exception to "uses: nothing in the workspace" — this package still imports
  nothing, but it does WRITE into apps/mobile. Rationale: docs/13 UXG-26.
- Extensions in `src/extensions.ts` only — each under `@heliogrid-extension` marker.
- NEVER: hand-transcribed values, hand-edited `dist/`, reading `_ds_manifest.json`.

## Commands
pnpm --filter @heliogrid/tokens build      # tsx build.ts && tsc -p tsconfig.emit.json
pnpm --filter @heliogrid/tokens typecheck

## Depends on / depended on by
uses: nothing in the workspace
used by: apps/web, apps/mobile, packages/ui
(tokens-standalone: zero workspace imports)

## Local conventions
- Web consumes `tokens.css`; RN consumes `theme.ts` — same token names, different emit.
- New token = extend `src/extensions.ts` + rebuild; visible at `/design`. Never inline in apps.
- Contrast: `src/contrast.ts` DECLARED_PAIRS gate the build.

## Landmines
- **`build` declares `inputs` for two trees outside this package — never drop them.**
  This task is the SOLE executor of both contrast gates, yet `build.ts` reads
  `design/ds-source/**` and the coverage scan reads `packages/ui/src/**/*.css`. Neither is a
  workspace dependency ("uses: nothing in the workspace"), so turbo hashed neither: a
  ds-source colour edited to 1.25:1 replayed "20 contrast pairs green" from cache, and the
  restored `dist/` still emitted the OLD value — `pnpm verify` green on both counts, and
  `dist/` is gitignored so nothing surfaced the drift. `$TURBO_DEFAULT$` keeps the normal
  in-package inputs; `dependsOn`/`outputs` are restated because a package task definition
  REPLACES the root's rather than merging with it.
- **The native splash files are NOT in turbo `outputs`** — turbo tracks outputs inside the
  package only, so a cached `turbo build` does not rewrite them. Anything checking their
  freshness must call `pnpm --filter @heliogrid/tokens build` directly, never through turbo,
  or it replays a green gate over a stale value — the same shape as the cache landmine above.
  CI also uses `git status --porcelain`, not `git diff`: diff is blind to untracked files, so
  a deleted-and-committed file would regenerate as untracked and pass.
- Noto Sans Devanagari woff2 vendored — Geist has zero Devanagari coverage.
- RN: static TTF 400/500/600/700 bundled in `apps/mobile/assets/fonts/` via
  `react-native.config.js`. Verify Devanagari via `<AppText>` rendering on both sims.
- ds-source `:root[data-mode]` is a no-op — density is a component prop.

## Definition of done here
Build green (contrast pairs pass) · new tokens at `/design` · turbo typecheck lint green.
