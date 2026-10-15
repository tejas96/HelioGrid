# @heliogrid/theme

The V2 design-token and theme package (docs/engineering/17-ui-architecture-v2.md §2, §6). One package:
raw tokens, the RN theme object, the web stylesheets and the fonts all come from here.

## Source of truth: `src/_generated/` (never hand-edit)

`src/_generated/` is written by **ds:pull** — a Claude session action that reads the live
design system, the artifact <https://claude.ai/artifact/XCdYE4onpt9oovdNMi91rn>, byte-verbatim
into the repo with the Artifact tool: `project/tokens/*.css` → `tokens/`, `project/styles.css` →
`styles.css`, `project/_ds_manifest.json` → `manifest.json`, and
`project/components/<family>/<Name>.d.ts` → `contracts/<family>/<Name>.d.ts.txt`. The artifact
carries no adherence file, so `adherence.oxlintrc.json` is the last one pulled; the invariant
`design-system-props` still reads it.
The output is committed; hand-editing anything under `_generated/` is a bug. `ds:pull` re-pulls and
diffs the manifest to catch stale or drifted components (docs/engineering/17 §6).

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
