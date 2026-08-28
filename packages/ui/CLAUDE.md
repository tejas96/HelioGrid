# @heliogrid/ui — ONE component package, both platforms

95 components and 8 primitives, each shipping a web half and a React Native half from the same
folder. `.claude/rules/ui-adherence.md` carries the compose-don't-invent and no-raw-values laws and
loads with this folder — this file is the package's own shape and its landmines.

## What lives here

- `src/primitives/` — the 8 things everything else is built from: `Box`, `Field`, `Icon`,
  `Portal`, `Pressable`, `StatusMark`, `Surface`, `Text`.
- `src/components/<Name>/` — one folder per component, both platforms inside it.
- `src/utils/` — helpers shared across components only.
- `src/styles.css` — the package stylesheet consumers import.

## What must NEVER live here

- **Product logic, policy or money maths.** That is `@heliogrid/domain`. A component takes props
  and renders; it does not know what a lead or a tranche is.
- **A raw visual value.** Colour, spacing, radius and type come from `@heliogrid/theme`.
- **User-visible English.** Copy comes from `@heliogrid/i18n` through the consumer.
- **Navigation chrome.** That belongs to the app (`apps/mobile/src/navigation/`).
- A DOM API in a `.native.tsx`, or a React Native import in a `.tsx`. Dependency-cruiser holds it.

## Folder shape

```
src/primitives/<Name>/          the 8 building blocks
src/components/<Name>/
  <Name>.types.ts                 THE shared API — both halves import it (Law 7)
  <Name>.tsx                      web
  <Name>.native.tsx               React Native
  <Name>.css                      web styles — style is NEVER in the component file
  <Name>.logic.ts                 anything that is not markup
  index.ts                        the only thing outside imports
src/utils/  src/styles.css  src/index.ts
```

Never invent a folder: this tree is a closed set. A component with only one platform half is
incomplete, not "web-only".

## Landmines

- **`<Name>.types.ts` is what makes parity a compile error (Law 7).** Both halves import the ONE
  type file, so a prop added to one platform and not the other fails typecheck. Never let a half
  declare its own props inline — that is how the two drift silently, and no gate catches it once
  the shared type is bypassed.
- **`knip` reports `Image|ImageFrame` as a duplicate export.** It is not a defect: it is the
  deliberate web/native pair Law 7 requires, and knip cannot see that. `check:unused` is therefore
  NOT in `verify` until knip is configured to understand the pair. Do not "fix" it by deleting a
  half. The same applies to `IN_DEFAULTS|IN_PACK` in `src/utils/market-pack.ts`.
- **Three touch targets are below the 44px floor and are known**, found by the render harness on
  2026-08-19: `RangeField`/`FilterPanel` thumbs measure 22×22, `ActivityStream`'s summary button
  43.3, `AppShell`'s breadcrumb link 42 wide. No static gate can see computed layout — only a real
  browser reports it. Fix them when you touch those components.
- **Measuring a touch target mid-animation lies.** Overlays animate in over 320ms from
  `scale(0.97)`; a sweep that runs during it reported 12 failures of which 4 were false. Wait for
  `document.getAnimations()` to be quiet, or for `transform` to read `none`.
- **`packages/ui` still carries hardcoded English** — real debt, tracked in
  `.claude/rules/ui-adherence.md`. Do not add more.

## Known component gaps, found by designing screens

Every one was found by drawing a real screen against the component and hitting the wall; each names
the screen so you can see the case. Same rule as the touch targets above — **fix them when you touch
those components**, and delete the row when you do. `NumberField`'s unit colour was one of these and
is fixed (`--text-secondary`; a unit is part of the number, so it is load-bearing and tertiary is
never load-bearing, `F7-11`).

| Component | Gap | Found by |
|---|---|---|
| `NumberField` | No unset value. `value` defaults to `0` and the draft is `String(value)`, so an unanswered field can only render a figure nobody declared — with no tier that could qualify it (`N7`). An explicit unset state is needed, and a stated answer for what a commit does from one. | `SCR-M01-04` |
| `Provenance` | Its line is fixed `--text-tertiary`. That is right where a tier sits among other facts beside a figure, and wrong where the tier IS the screen's honesty contract — the caller currently steps it up through the component's own `style` prop. An `emphasis` prop makes it the component's decision instead of every caller's. | `SCR-M01-04` |
| `NumberField`, `OptionCardGroup` | A field-level `error` is **described, not announced**. Correct for a gate that jumps you to an already-failing field (`M06-22`); wrong for a refusal that happens under the user's finger, where the press must be heard. An `announce`/`live` option on the error prop stops every screen hand-rolling its own live line. | `SCR-M01-04` |
| `OptionCardGroup` | No per-option `lang`. A screen reader running in English announces मराठी under English pronunciation rules — the accessible name failing at the one point `F3-03` cares about, on the picker whose whole job is naming languages in their own words. | `SCR-M01-03` |
| `Modal` | No `labelId`, the way `Sheet` has one. Its header is a fixed leading-icon row, so a composed decision must drop `title` — which also drops the `aria-labelledby` it wires up. | `SCR-M01-01` |
| `Banner` | No kind for a **signed-out steer**. The nearest kind (`suggestion`) carries a spark glyph that reads as AI, wrong for a workspace-detection finding, which is a fact about the tenant estate rather than something the system generated. `Banner` also offers one `BannerAction` pill where such a steer owns two full-size routes. A `kind="finding"` plus an `actions` slot taking real buttons would close it. | `SCR-M01-02` |
| — | **No `Skeleton` component**, and no duration token for the system's stated 1.4 s shimmer (nearest is `--dur-ambient` at 500 ms). Loading placeholders are currently built from `--canvas-sunken`, `--surface` and the `hg-sheet-shimmer` keyframe. | `SCR-M01-03` |

**Not in this table, because it has an owner:** the React Native half of `F3-13` — components read
`theme.type.families.sans`, the single primary family, and RN has no per-codepoint fallback, so
Devanagari falls to the OS face. `T-FPLAT-007` owns it with `F3-17`'s per-script line height. The web
half is fixed.

## Done means

Both halves exist and import the one `<Name>.types.ts`; style is in its own file; every visual
value comes from `@heliogrid/theme`; `pnpm check:all` exits 0.
