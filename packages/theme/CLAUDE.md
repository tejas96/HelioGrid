# @heliogrid/theme — every visual value, generated from the live design system

One package: raw tokens, the RN theme object, the web stylesheets and the fonts. The
no-raw-values law is `.claude/rules/ui-adherence.md`, which loads with this folder. Traps:
`docs/engineering/landmines.md`.

## What lives here / what must never live here

- `src/_generated/` — the design system, byte-verbatim: tokens, `styles.css`, contracts, manifest.
- `build.ts` and its parts (`parse.ts`, `contrast.ts`, `emit-theme.ts`) — the generator, which
  parses `_generated/tokens/*.css` and emits everything into `dist/`.
- `assets/fonts/` — the vendored woff2 faces.
- NEVER: **a hand-written token.** Every value arrives through `ds:pull`. A missing value is
  missing from the design system — fix it there, not here.
- NEVER: component code (that is `@heliogrid/ui`), or anything app- or product-specific. This
  package knows nothing about solar.

## Folder shape

```
src/_generated/   the design system, verbatim — NEVER hand-edit
src/parse.ts · src/contrast.ts · src/emit-theme.ts     the generator's parts
build.ts          the generator          dist/   emitted, git-ignored, never edited
```

Consumers import a subpath from the manifest — `@heliogrid/theme`, `/tokens.css`, `/base.css`,
`/print.css`, `/theme`, `/tokens.json`, `/contrast.pairs.json`, `/fonts/*`. Never a deep source
path.

## Commands

```
pnpm --filter @heliogrid/theme build     # prints token, field-mode and contrast-pair counts
```

## Local conventions

- **The contrast check FAILS the build below the WCAG floor.** Read the failure — it names the
  pair. Never raise the floor to make it pass.
- **`dist/` is emitted, not authored.** A change that looks absent after editing source means you
  edited `dist/`. Run the build.

## Done means

The build exits 0 with its counts printed, and nothing under `_generated/` or `dist/` was
hand-edited.
