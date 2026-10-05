# @heliogrid/ui — ONE component package, both platforms

Deps: `architecture.md` §2 ui. Primitives plus components, each shipping a web half and a React
Native half from one folder. The compose-don't-invent and no-raw-values laws are
`.claude/rules/ui-adherence.md`, which loads with this folder.

**Before changing a component, read its rows in `docs/tasks/UI.md`.** Fix the repo side, give
the owner the design-system side, then delete the row.

## What lives here / what must never live here

- `src/primitives/` — the atoms every component is built from. **Every field draws its box through
  `FieldBox`** — the well, the radius and the rings are decided there once (`F7-15`, `F7-24`); a
  field that paints its own background, shadow or ring is drift. **Every other control takes its
  fill from `Ground`** — the opposite of what holds it: `var(--hg-control-fill)` on the web,
  `useGround()` on the phone. A surface that holds controls joins `Ground.css`'s page or tile list
  and, on the phone, wraps its content in `GroundProvider`; a control that paints `--surface` or
  the well itself is drift. **A tile is drawn only by `Ground`** (`F7-49`): its class joins
  `Ground.css`'s tiles list, which paints its fill and its shadow; on the phone it spreads
  `tileSurface` and wraps `GroundProvider ground="tile"`. A tile keeps only its radius, padding
  and ring states; one that paints its own grey is drift. A section is a heading on the page —
  no fill, no shadow; what must stay opaque over scrolling paints `var(--hg-ground)`.
- **NEVER product logic, policy or money maths** (that is domain). `utils/format.ts` and
  `utils/color-contrast.ts` only bind a pack or this system's inks to domain's maths; they
  implement nothing.
- **Navigation chrome is drawn here; routing is not.** No router import: a component takes its
  items and an onNavigate from the app.
- NEVER a react-native import in a web `.tsx` (no check catches it); a DOM global in a
  `.native.tsx` fails typecheck.
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
  <Name>.logic.ts     anything that is not markup, consumed by BOTH halves
  index.ts            the only thing outside imports
```

**The web file is `<Name>.tsx`, never `<Name>.web.tsx`.** Metro resolves `.native.tsx` ahead of
`.tsx` with no config; webpack and Turbopack never look for `.native.*`. Naming the web half
`.web.tsx` needs custom resolution in both bundlers and fails at RUNTIME when it is wrong.

A component with only one platform half is incomplete, not "web-only" — unless its types file
opens with one of the two waivers, `PRINT SURFACE` or `POINTER SURFACE`, and gives the reason.
A `PRINT SURFACE` part is exported from `src/print.ts` (`@heliogrid/ui/print`), never from
`src/index.ts`: the phone typechecks the main entry with its `.native` halves first, and a print
part there fails it.

## Local conventions

- **An icon is drawn here, never imported** (Biome blocks lucide; any other icon package is
  equally wrong). Copy `AppShell/ShellGlyph.logic.ts`.
- The `design-system-props` invariant checks only that each design-system prop is declared;
  nothing compares the two halves, so the types file is what you must keep honest.
- **Existing components still carry hard-coded English** and no check finds it — never copy that
  pattern (`.claude/rules/ui-adherence.md`).

## Traps

- Native clips a `Text`'s ink to its own box, so a line box shorter than the face's own line loses ो ी ं off the top and reads as a spacing bug; the box is raised to the bundled face's declared line, but a parent's `overflow: hidden` on a heading's top edge, or a style that shrinks the box, brings the clip back → leave the raised box alone and give the parent room.
- React Native's `flattenStyle` copies EVERY key of every style object, `undefined` values included, so a later `{ x: maybeUndefined }` ERASES the `x` a variant beneath it set — on the phone only, since the web half does the opposite → append the object conditionally (`cond ? { x } : undefined`), never a key whose value may be undefined.
