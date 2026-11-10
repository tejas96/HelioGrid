# @heliogrid/ui — ONE component package, both platforms

The compose-don't-invent and no-raw-values laws are `.claude/rules/ui-adherence.md`, which loads
with this folder.

Every component draws the approved language (`CLAUDE.md` §10) from the typed tokens in
`packages/theme/src/tokens/`, in light, dark and field mode.

## What lives here / what must never live here

- `src/primitives/` — the atoms every component is built from. **Every field draws its box through
  `FieldBox`** — the card colour inside a strong hairline, the accent edge and glow on focus,
  decided there once; a field that paints its own background, shadow or ring is drift. **Every
  other control takes its fill from `Ground`** — the opposite of what holds it:
  `var(--hg-control-fill)` on the web, `useGround()` on the phone. On the page (the canvas) a
  control is the card colour; inside a card or tile it is `--fill`. A surface that holds controls
  joins `Ground.css`'s list and, on the phone, wraps its content in `GroundProvider`. **A tile is
  drawn only by `Ground`**: the white card on the page with a hairline edge — its class joins
  `Ground.css`'s tiles list; on the phone it spreads `tileSurface` and wraps
  `GroundProvider ground="tile"`. A tile keeps only its radius, padding and ring states. The one
  hero a screen has is `HeroPanel` (solar glass); a page's large title is `LargeTitle`; a moment
  that matters is `LottieMoment`; a place with nothing in it is `EmptyScene`'s grey line drawing.
- **Every colour comes from the `Color` primitive** (`colors`, `usePalette`): on the web a custom
  property, on the phone a system colour that follows light and dark. Hex arithmetic reads
  `theme.palettes` (light for anything printed), never a style colour.
- **NEVER product logic, policy or money maths** (that is domain). `utils/format.ts` and
  `utils/color-contrast.ts` only bind a pack or this system's inks to domain's maths; they
  implement nothing.
- **Navigation chrome is drawn here; routing is not.** No router import: a component takes its
  items and an onNavigate from the app.
- **NEVER a hover state in a `.native.tsx`** — the pressed state is the touch feedback, and nothing
  may appear only on hover (`N1`).
- **An "ask" is always `Explainer`** (`F7-46`): the one anchored popover behind an information
  control. Never write a per-screen one.

## Folder shape — a closed set; never invent a folder

```
src/components/<Name>/
  <Name>.types.ts     THE shared prop contract — both halves implement it (Law 7)
  <Name>.tsx          web        <Name>.native.tsx   React Native
  <Name>.css          web styles
  <Name>.logic.ts     anything that is not markup — shared by both halves, or handed to the app
                      through the index
  <Part>.tsx · <Part>.native.tsx    a sub-part of <Name>, kept beside it
  <Name>.<concern>.ts a pure helper split from .logic.ts (.words.ts, .shapes.ts …)
  <Name>.parts.types.ts  the inner parts' contracts, only when <Name>.types.ts would pass 300 lines
  use-<thing>.ts      a hook only this component uses
  index.ts            the only thing outside imports
src/primitives/       the atoms every component is built from
src/utils/            binds a pack or the system's inks to domain's maths (format.ts …)
```

A component with only one platform half is incomplete, not "web-only" — unless its types file
opens with one of the two waivers, `PRINT SURFACE` or `POINTER SURFACE`, and gives the reason.
A `PRINT SURFACE` part is exported from `src/print.ts` (`@heliogrid/ui/print`), never from
`src/index.ts`: the phone typechecks the main entry with its `.native` halves first, and a print
part there fails it.

## Local conventions

- **An icon is drawn here, never imported**, and **only by name**: its shape is one entry of
  `SHELL_GLYPHS` (`AppShell/ShellGlyph*.shapes.ts`), reused before a new one is drawn. `ShellGlyph` draws it on
  the size ladder; a component that keeps its own box puts `<ShellGlyphMarks name="…" />` inside
  its `<svg>` and sets the size, stroke and colour there. Biome's `inline-glyph` and
  `inline-svg-mark` refuse path data and marks written anywhere else.
- Nothing compares the two halves' behaviour, so the types file is what you must keep honest.
- **No English lives here** (`T-SHELL-016`): every copy prop takes `TranslatedText` with no default,
  and words a component says itself — a counter, an announcement, an error line — arrive as a
  `<Name>Words` prop built in `packages/i18n/src/copy/`. Biome plugins `copy-prop-type`,
  `copy-literal` and `noJsxLiterals` hold every folder; a fact keeps `string` with a `biome-ignore`
  that names it.
- **A control that removes itself takes a required `focusAfter`** (`primitives/FocusAfter/`) and
  wraps its press with `useFocusAfter`; a part its component outlives (a mark, a toast, a clear)
  wraps its closing press with `closingPress`. A component that draws its own retry passes its own
  frame (`tabIndex={-1}`, class `hg-focus-target`), which stays while it reloads.

## Traps

- The word guards read types and JSX only, so English a `.ts` helper builds — a counter, a plural, `` `${n} dates` `` — passes them and reaches a Hindi reader → build it in `packages/i18n` and take it as a words function, as `DatePicker`'s `datesChosen` does.
- On touch a tap on a button never leaves the focused field first, so a field that commits on blur has not reported its edit when a ✕, *Cancel*, Back or *Save* in the same press reads the draft, and the edit is lost with no ask → a field in a form with a way out commits as typed (`NumberField` `commits="as-typed"`, `Input` `onChange`), as `PaymentTermsEditor` does.
- On Fabric, a `zIndex` that changes with state re-orders the parent's native children, so a sibling holding a focused field is taken out and put back, and Android drops the keyboard → set a `zIndex` once in the base style and toggle only the look.
- Native clips a `Text`'s ink to its own box, so a line box shorter than the face's own line loses ो ी ं off the top and reads as a spacing bug; the box is raised to the bundled face's declared line, but a parent's `overflow: hidden` on a heading's top edge, or a style that shrinks the box, brings the clip back → leave the raised box alone and give the parent room.
- React Native's `flattenStyle` copies EVERY key of every style object, `undefined` values included, so a later `{ x: maybeUndefined }` ERASES the `x` a variant beneath it set — on the phone only, since the web half does the opposite → append the object conditionally (`cond ? { x } : undefined`), never a key whose value may be undefined.
- A web layout sized from the window (`vw`, `@media` widths) assumes it owns the page, but inside the shell a side list or a panel takes part of it, so a two-column component squeezes a column to nothing at mid widths → size it from its own room (`container` + `cqw`, `@container`), as `CompanyProfile`'s settings life does.
- A page's `data-layout="narrow"` holds every width under its wide breakpoint (a 673 px editor at 1280), not only 375, so a squeeze written for 375 under it — 2 px segment sides — shows on a roomy editor once the part stops stretching → size a tight-room rule from the part's own room (`@container`), as `hg-segmented-control-hug` does.
- A category wash with its words (a hue tile, a kind badge, a face) mixed by hand is a pair `ui-colour-pairs` cannot measure and a colour dark mode cannot follow → take the token pair: `hg-hue` with `data-hue` on the web (`Avatar.css`), `hueTintOf` on native.
- A phone colour is a system colour, not a string: concatenating, parsing or interpolating one fails at run time, and a percentage-sized SVG measured before its content grows stops short → arithmetic reads `usePalette()`, and an SVG behind content takes its parent's measured size (`HeroPanel.native.tsx`).
- A phone layer drawn through `Portal` (a menu, a bubble) is not a screen, so Android's Back passed it by and left the app with the menu still open → a layer that opens over the page closes on Back through `useCloseOnBack` (`primitives/use-close-on-back.native.ts`), as `Menu` and `Explainer` do.
- Android draws a bounded ripple square, and clips neither it nor a shadow to round corners, so `Pressable` ripples only a target with no `borderRadius`; a target whose round shape sits on an inner view rippled a square box over its pill → put the pill's radius on the target too (`Chip`, `FilterPill`).
- A Fast Refresh that changes a component's hooks leaves the phone blank with "Rendered more hooks" → relaunch the app; it is not a product bug.
- `Sheet` and `EditorSurface` take `inset` only for a part drawn inside a device frame; in an app it measures against the nearest positioned ancestor and, inside a scrolled page at 375, opens off-screen → an app sheet never takes `inset` (`Explainer`'s `inset` is a different prop, a hit-box margin).
- On iOS a modal `Sheet`, `Modal` or `DetailPanel` panel (`accessibilityViewIsModal`) hides every other portal layer from a screen reader, so a list, menu or bubble opened over it is drawn and tappable but cannot be read → a portal layer a person must use over a modal is `accessibilityViewIsModal` itself while open (`Select.native.tsx`, `Menu.native.tsx`).
- On the phone a `Text` inside a `Text` that sets its own `variant` keeps that variant's size, so a value component nested in a hero's display line draws at body size → give the hero line its words, or the value component the variant, never a holder around it (`BillingPlan.native.tsx`).
- The web spaces a frame's parts with its container's `gap`; the phone's slot is a bare `View`, so a part moved into it — a title wrapped in `HeroPanel`, a large title sharing the shell's lead with a switch — sits flush, its old padding now inside, and no check measures phone spacing → give the phone slot its own gap (`SetupReady.native.tsx` `doors`, `apps/mobile` shell `lead`) and look at the phone after the move.
- A focus handle that returns what it calls (a timer id, `focus()`'s result) becomes an effect's cleanup when a caller writes `useEffect(() => ref.focus())`, and React crashes the page on unmount (the merge's done page) → a focus handle returns nothing.
- On the phone a growing child inside a flex item sized to its content takes the whole row and crushes its siblings (the import stepper's last step hid the first three) → give the growing child a bounded basis, or lay the row out as equal cells.
