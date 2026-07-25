# @heliogrid/tokens — generated design tokens (ds-source is the only source of truth)

## What lives here / what must never live here
- `build.ts` + `src/` parse `design/ds-source/tokens/*.css` and emit `dist/` (tokens.css,
  base.css, theme.ts→js, tokens.json, contrast.pairs.json, fonts/).
- The FIVE marked extensions (docs/10 §2) live in `src/extensions.ts` — the only
  non-ds-source values allowed, each emitted under an `@heliogrid-extension` marker.
- NEVER: hand-transcribed values, hand-edited `dist/`, reading `_ds_manifest.json`
  (it snapshotted 1ms reduced-motion durations as canonical — the drift this build prevents).

## Commands
pnpm --filter @heliogrid/tokens build      # tsx build.ts && tsc -p tsconfig.emit.json
pnpm --filter @heliogrid/tokens typecheck

## Depends on / depended on by
uses: nothing in the workspace       used by: apps/web, apps/mobile, packages/ui (later)
(dependency-cruiser rule `tokens-standalone` enforces zero workspace imports)

## Local conventions
- Token names survive VERBATIM from the CSS — renaming breaks mockup traceability.
- Reduced-motion `@media` overrides are captured as metadata, never as base values.
- A new token needed by the product = extend `src/extensions.ts` with a marker + rerun
  build; it then renders at `/design` automatically. Never inline a value in an app.
- Contrast is computed, never eyeballed: `src/contrast.ts` DECLARED_PAIRS gate the build.

## Landmines
- `assets/fonts/NotoSansDevanagari[wght].woff2` is the vendored Devanagari-subset
  variable face (Geist has ZERO Devanagari coverage). Its unicode-range includes ₹ U+20B9;
  chain order keeps Geist first.
- RN needs STATIC font instances (400/500/600/700) — `theme.fonts.staticFamilyByWeight`
  documents the names; the TTFs are bundled in apps/mobile when font wiring lands.
- ds-source `:root[data-mode]` is a no-op placeholder — density is a component prop.

## Definition of done here
Build green (all contrast pairs pass) · new/changed tokens visible at `/design` ·
`pnpm turbo typecheck lint` green.
