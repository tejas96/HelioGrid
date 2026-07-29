# @heliogrid/tokens — generated design tokens (ds-source is the only source of truth)

## What lives here / what must never live here
- `build.ts` + `src/` parse `design/ds-source/tokens/*.css` and emit `dist/` (tokens.css,
  base.css, theme.ts, tokens.json, contrast.pairs.json, fonts/).
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
- Noto Sans Devanagari woff2 vendored — Geist has zero Devanagari coverage.
- RN: static TTF 400/500/600/700 bundled in `apps/mobile/assets/fonts/` via
  `react-native.config.js`. Verify Devanagari via `<AppText>` rendering on both sims.
- ds-source `:root[data-mode]` is a no-op — density is a component prop.

## Definition of done here
Build green (contrast pairs pass) · new tokens at `/design` · turbo typecheck lint green.
