# @heliogrid/ui — ONE component package, both platforms

Deps: `architecture.md` §2 ui. Primitives plus components, each shipping a web half and a React
Native half from one folder. The compose-don't-invent and no-raw-values laws are
`.claude/rules/ui-adherence.md`, which loads with this folder.

**This package is built from the design system AHEAD of the screens that consume it.** Component
gaps found by a screen are registered in `docs/tasks/UI.md`: fix when you touch the component,
fix BOTH halves, then delete the row.

## What lives here / what must never live here

- `src/primitives/` — the atoms everything else is built from: `Box`, `Field`, `FieldBox`, `Ground`,
  `Icon`, `Portal`, `Pressable`, `StatusMark`, `Surface`, `Text`. **Every field draws its box through
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
- `src/components/<Name>/` — one folder per component, both platforms inside it.
- `src/utils/` — helpers shared across components only. `src/styles.css` — the package stylesheet.
- **NEVER product logic, policy or money maths.** That is `@heliogrid/domain`. A component takes
  props and renders; it does not know what a lead or a tranche is. **Formatting is product
  logic**: `src/utils/format.ts` BINDS a market pack to domain's format slice, and
  `src/utils/color-contrast.ts` binds this system's inks to domain's contrast maths; both
  implement nothing.
- **NEVER navigation chrome** — that belongs to the app.
- NEVER a DOM API in a `.native.tsx`, or a React Native import in a `.tsx`.
- **NEVER a hover state in a native half.** A touch screen has no pointer, so the web half's
  lift or tint has no counterpart here — the pressed state is the touch feedback, and a fact that
  only appears on hover has not appeared at all (`N1`).
- **The ask is one component (`F7-46`), never per-screen prose.** Teaching a screen puts behind an
  information control opens the shared anchored popover; a screen that writes its own is drift.

## Folder shape — a closed set; never invent a folder

```
src/components/<Name>/
  <Name>.types.ts     THE shared prop contract — both halves implement it (Law 7)
  <Name>.tsx          web        <Name>.native.tsx   React Native
  <Name>.css          web styles — style is NEVER in the component file
  <Name>.logic.ts     anything that is not markup, consumed by BOTH halves
  index.ts            the only thing outside imports
```

**The web file is `<Name>.tsx`, never `<Name>.web.tsx`.** Metro resolves `.native.tsx` ahead of
`.tsx` with no config; webpack and Turbopack never look for `.native.*`. Naming the web half
`.web.tsx` needs custom resolution in both bundlers and fails at RUNTIME when it is wrong.

A component with only one platform half is incomplete, not "web-only" — unless its types file
opens with one of the two waivers, `PRINT SURFACE` or `POINTER SURFACE`, and gives the reason. No
check reads the waivers; review does. A `PRINT SURFACE` part is exported from `src/print.ts`
(`@heliogrid/ui/print`), never from `src/index.ts`: the phone typechecks the main entry with its
`.native` halves first, and a print part there fails it.

## Local conventions

- **An icon is DRAWN here, never imported from an icon package** — one SVG per glyph,
  `currentColor`, 1.5px stroke, one drawing serving the web half and the native half.
  `AppShell/ShellIcons.tsx` is the shape to copy.
- **A prop belongs to `<Name>.types.ts`, never to a platform half.** A platform-local props
  interface above the shared base is how the halves drift. The `design-system-props` invariant
  checks only that each design-system prop is declared; nothing compares the two halves, so the
  types file is what you must keep honest.
- Anything shared by both halves goes in a `<Name>.logic.ts`, a `use<Name>.ts` hook or a
  `<name>-model.ts` — never copied into each half.
- **This package still carries hardcoded English**, and no check finds it. Real debt. Do not add
  more: write the prop.

## Done means

Both halves exist and implement the one `<Name>.types.ts`; style is in its own file; every visual
value comes from `@heliogrid/theme`; `pnpm check:all` exits 0.

## Traps

- Native clips a `Text`'s ink to its own box, so a line box shorter than the face's own line loses ो ी ं off the top and reads as a spacing bug; the box is raised to the bundled face's declared line, but a parent's `overflow: hidden` on a heading's top edge, or a style that shrinks the box, brings the clip back → leave the raised box alone and give the parent room.
- React Native's `flattenStyle` copies EVERY key of every style object, `undefined` values included, so a later `{ x: maybeUndefined }` ERASES the `x` a variant beneath it set — on the phone only, since the web half does the opposite → append the object conditionally (`cond ? { x } : undefined`), never a key whose value may be undefined.
