# @heliogrid/theme

The V2 design-token and theme package (docs/17-ui-architecture-v2.md §2, §6). One package:
raw tokens, the RN theme object, the web stylesheets and the fonts all come from here.

## Source of truth: `src/_generated/` (never hand-edit)

`src/_generated/` is written by **ds:pull** — a Claude session action that uses the
DesignSync MCP to fetch the live design system (Claude Design project
`c8aa4326-21bf-453a-8d11-749cc81dee12`) byte-verbatim into the repo. The output is
committed; hand-editing anything under `_generated/` is a bug. `ds:check` re-pulls and
diffs the manifest to catch stale or drifted components (docs/17 §6).

## What `build.ts` emits (`pnpm --filter @heliogrid/theme build`)

| file | what |
|---|---|
| `dist/tokens.css` | @font-face (urls → `./fonts/`) + token files in the DS's own order + base resets |
| `dist/base.css` | the DS global stylesheet (`styles.css` with its imports inlined) |
| `dist/print.css` | the print surface, verbatim — `@page` presence asserted (design gap 32) |
| `dist/theme.js` + `.d.ts` | typed RN theme object — same token names, px → dp, RN-shaped shadows |
| `dist/tokens.json` | flat `--name` → resolved value map of every custom property |
| `dist/contrast.pairs.json` | computed WCAG ratios; the build **fails** on any pair under its floor |
| `dist/fonts/*` | Geist, Geist Mono, Noto Sans Devanagari (variable woff2) |

## Consumption

`packages/ui` and both apps consume **only** `dist/` through the declared `exports` —
`@heliogrid/theme`, `./tokens.css`, `./base.css`, `./print.css`, `./theme`,
`./tokens.json`, `./contrast.pairs.json`, `./fonts/*`. Never a deep source path, and never
a hand-transcribed value (`.claude/rules/ui-adherence.md`).
