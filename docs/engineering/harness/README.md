# Render harness — proving packages/ui actually mounts

Static gates prove the package COMPILES. This proves it MOUNTS: every export is real, the
stylesheets load, the tokens resolve, and no component throws on first render. It also measures
things no static gate can see — computed box sizes, resolved token values, focus rings.

Not wired in by default: `docs/engineering/17-ui-architecture-v2.md` keeps the apps free of `@heliogrid/ui`
until the screens are built.

## Running it

1. `apps/web/package.json` → add `"@heliogrid/theme": "workspace:*"` and `"@heliogrid/ui": "workspace:*"`
2. `apps/web/next.config.ts` → `transpilePackages: ['@heliogrid/ui', '@heliogrid/theme']`
3. `apps/web/app/layout.tsx` → import `@heliogrid/theme/tokens.css`, `@heliogrid/theme/base.css`, `@heliogrid/ui/styles.css`
4. `mkdir -p apps/web/app/render-check/fixtures`
   `cp docs/engineering/harness/render-check.page.tsx apps/web/app/render-check/page.tsx`
   `cp docs/engineering/harness/types.ts apps/web/app/render-check/types.ts`
   `cp docs/engineering/harness/fixtures/*.tsx apps/web/app/render-check/fixtures/`
5. `pnpm install`, start the web dev server, open `/render-check`

**Do not name the route folder with a leading underscore** — the Next App Router treats
`_`-prefixed folders as private and excludes them from routing. That cost a 404 the first time.

## Reading the result

The page carries machine-readable counts: `data-total`, `data-ok-count`, `data-fail-count` and
`data-missing`. `data-total` is derived from the component folders, not hard-coded, so a component
with no fixture is reported rather than silently passing. Every fixture has its own error boundary,
so one broken component cannot blank the page and hide the other 94.

## Measured 2026-08-19

**95 of 95 mounted. 0 failures. 0 missing. 0 empty.** Every fixture drew real content.

Tokens resolved to their exact design-system values (`--canvas #F6F7F9`, `--accent #5A4BFF`,
`--action-primary #0A0A0B`, `--sp-4 16px`, `--r-pill 999px`); Geist loaded; the overline measured
11px/700/uppercase/1.32px tracking (= 0.12em); `StatusMark` rendered a glyph AND a word (F7-12's
second channel); keyboard focus produced a 2px `#5A4BFF` outline at 2px offset.

**314 interactive elements measured for the 44px touch floor. 307 pass. Findings below.**

### A measurement trap worth knowing

An early sweep reported 12 failures including four at 42.68px. Those were false: overlays animate
in with `hg-modal-in` (320ms) whose first keyframe is `scale(0.97)`, and the sweep ran mid-animation.
Once settled the same buttons measure exactly 44.00×44.00. **Let animations finish before measuring**
— check `document.getAnimations()` is quiet, or that `transform` is `none`.

Two other apparent failures are not defects: `Dropzone`'s file input is `opacity:0` +
`pointer-events:none` (the drop zone is the target), and an inline `<a>` inside `RichText` prose is
a text link, not a touch target.

### Open findings — real, not yet fixed

| where | measured | why it is real |
|---|---|---|
| `RangeField`, `FilterPanel` (×4) | thumb **22×22px** | `.hg-range-input::-webkit-slider-thumb` is 22px with `pointer-events:auto`, so the thumb IS the target — half the 44px floor, on a control you drag |
| `ActivityStream` summary button | **43.3px** tall | declares `min-height: 24px` rather than taking the `Pressable` floor |
| `AppShell` breadcrumb link | **42px** wide | `min-width: auto`; the 44px floor is applied to height only |

None is caught by a static gate — they are computed layout, which only a browser can report.

## Three probes a static gate cannot replace

Each measures computed layout, so only a browser can run them. **Run them with the touch-target
sweep, on the same settled frames.** A fourth — a control rendering below its declared `width` — is
static and lives in `scripts/check-adherence.sh` check 11 instead.

| probe | assert | the defect it would have caught |
|---|---|---|
| **Empty container** | no element with a background, border-radius and fixed size has zero child nodes and no text | `EmptyState` drew a blank 72px disc whenever the caller had no honest icon (`F7-19` forbids inventing one) |
| **Devanagari overflow** | re-render every fixture with its strings replaced by Devanagari of 1.6× the length; no element's `scrollWidth` exceeds its `clientWidth` | `Accordion`'s header `meta` and state word were `white-space: nowrap` — fine in English, clipped in Hindi and Marathi, which are P0 markets |
| **Quiet role** | enumerate every text node's computed colour; flag `--text-tertiary` on any node the fixture marks load-bearing | `Accordion`'s state word — which sections of a form are unfilled — computed to tertiary on every untinted section (`N4`) |

**The pattern behind all four:** a static gate proves a value is a token and a type proves a prop
exists. Neither can see what the browser actually painted, and every one of these six defects lived
in exactly that gap.
