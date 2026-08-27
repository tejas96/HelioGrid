# @heliogrid/theme — every visual value, generated from the live design system

One package: raw tokens, the RN theme object, the web stylesheets and the fonts.
`.claude/rules/ui-adherence.md` carries the no-raw-values law and loads with this folder — this
file is the package's own shape and its landmines.

## What lives here

- `src/_generated/` — the design system, byte-verbatim. Tokens, `styles.css`, contracts, manifest.
- `build.ts` — the generator. Parses `_generated/tokens/*.css` and emits everything in `dist/`.
- `src/parse.ts`, `src/contrast.ts`, `src/emit-theme.ts` — the generator's parts.
- `assets/fonts/` — vendored woff2: `Geist[wght]`, `GeistMono[wght]`, `NotoSansDevanagari[wght]`.

## What must NEVER live here

- **A hand-written token.** Every value arrives through `ds:pull`. If a value is missing, it is
  missing from the design system — fix it there, not here.
- Component code. That is `@heliogrid/ui`.
- Anything app- or product-specific. This package knows nothing about solar.

## Folder shape

```
src/_generated/          the design system, verbatim — NEVER hand-edit
  tokens/*.css  styles.css  contracts/  manifest.json
src/parse.ts             mechanical parser for _generated/tokens/*.css
src/contrast.ts          WCAG ratio computation
src/emit-theme.ts        the RN theme object
build.ts                 the generator; run by `pnpm --filter @heliogrid/theme build`
dist/                    emitted, git-ignored, never edited
```

Consumers import a subpath from the manifest: `@heliogrid/theme`, `/tokens.css`, `/base.css`,
`/print.css`, `/theme`, `/tokens.json`, `/contrast.pairs.json`, `/fonts/*`. Never a deep source path.

## Landmines

- **`ds:pull` is a Claude session action driving the DesignSync MCP — NOT a pnpm script.** Do not
  go looking for one; `pnpm ds:pull` will fail. It fetches Claude Design project
  `c8aa4326-21bf-453a-8d11-749cc81dee12` verbatim into `src/_generated/`, and the output is
  committed. Hand-editing anything under `_generated/` is a bug, and the next pull silently
  overwrites it.
- **The contrast check FAILS the build below the floor.** `build.ts` computes WCAG ratios and
  exits non-zero, so a token change that breaks contrast cannot land. Read the failure — it names
  the pair. Never raise the floor to make it pass.
- **`dist/` is emitted, not authored.** A change that looks absent after editing source means you
  edited `dist/`. Run the build.
- **Deleting a source file leaves a stale `dist/`** and keeps `boundaries` red. `pnpm turbo build
  --force`.

## Done means

`pnpm --filter @heliogrid/theme build` prints its token, field-mode and contrast-pair counts and
exits 0; nothing under `_generated/` or `dist/` was hand-edited.
