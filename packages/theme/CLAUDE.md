# @heliogrid/theme — every visual value, generated from the live design system

Deps: `architecture.md` §2 theme. One package: raw tokens, the RN theme object, the web
stylesheets and the fonts. The no-raw-values law is `.claude/rules/ui-adherence.md`, which loads
with this folder.

## What lives here / what must never live here

- `src/_generated/` — the design system, byte-verbatim: tokens, `styles.css`, contracts, manifest.
- `build.ts` (the generator) and its parts in `src/` — `parse.ts`, `contrast.ts`, `emit-theme.ts`,
  `font-metrics.ts` — read `_generated/tokens/*.css` and emit `dist/` (git-ignored, never edited).
- `assets/fonts/` — the vendored woff2 faces.
- NEVER: **a hand-written token.** Every value arrives through `ds:pull`. A missing value is
  missing from the design system — fix it there, not here.
- NEVER: component code (that is `@heliogrid/ui`), or anything app- or product-specific. This
  package knows nothing about solar.

Consumers import only the subpaths in `package.json` `exports`.

## Commands

```
pnpm --filter @heliogrid/theme build     # prints token, field-mode and contrast-pair counts
```

## Local conventions

- Consumers read `dist/`: after editing `src/` or `_generated/`, run the build.

## Traps

- There is no `pnpm ds:pull`: pull with the DesignSync tool in a session and commit exactly what it writes.
