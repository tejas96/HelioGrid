# @heliogrid/ui — ONE component package, both platforms

Primitives plus components, each shipping a web half and a React Native half from one folder.
The compose-don't-invent and no-raw-values laws are `.claude/rules/ui-adherence.md`, which loads
with this folder. Traps: `docs/engineering/landmines.md`.

**This package is built from the design system AHEAD of the screens that consume it.** Component
gaps found by a screen are registered in `docs/tasks/UI.md`: fix when you touch the component,
fix BOTH halves, then delete the row.

## What lives here / what must never live here

- `src/primitives/` — the atoms everything else is built from: `Box`, `Field`, `Icon`, `Portal`,
  `Pressable`, `StatusMark`, `Surface`, `Text`.
- `src/components/<Name>/` — one folder per component, both platforms inside it.
- `src/utils/` — helpers shared across components only. `src/styles.css` — the package stylesheet.
- **NEVER product logic, policy or money maths.** That is `@heliogrid/domain`. A component takes
  props and renders; it does not know what a lead or a tranche is. **Formatting is product
  logic**: `src/utils/format.ts` BINDS a market pack to domain's format slice and implements
  nothing (`M49`).
- **NEVER a raw visual value** (that is `@heliogrid/theme`), **user-visible English** (copy
  arrives as a prop from `@heliogrid/i18n` through the consumer), or **navigation chrome** (that
  belongs to the app).
- NEVER a DOM API in a `.native.tsx`, or a React Native import in a `.tsx`.

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

A component with only one platform half is incomplete, not "web-only" — the two waiver markers
are a closed vocabulary read by `ds:contract`.

## Local conventions

- **A prop belongs to `<Name>.types.ts`, never to a platform half.** A platform-local props
  interface above the shared base is how the halves drift; only prop NAMES are compared today
  (`M35`), so the types file is what you must keep honest.
- Anything shared by both halves goes in a `<Name>.logic.ts`, a `use<Name>.ts` hook or a
  `<name>-model.ts` — never copied into each half.
- **This package still carries hardcoded English** (`M50`). Real debt. Do not add more: write the
  prop.

## Done means

Both halves exist and implement the one `<Name>.types.ts`; style is in its own file; every visual
value comes from `@heliogrid/theme`; `pnpm check:all` exits 0.
