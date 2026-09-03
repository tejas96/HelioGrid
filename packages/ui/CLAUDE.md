# @heliogrid/ui — ONE component package, both platforms

97 components and 8 primitives, each shipping a web half and a React Native half from the same
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
- **No static gate can see computed layout — only a real browser reports it.** The three targets
  this file used to list are fixed and each carries its measurement in a comment where it was fixed;
  the lesson is that the floor is two-dimensional and a control can pass on height and fail on width.
- **Measuring a touch target mid-animation lies.** Overlays animate in over 320ms from
  `scale(0.97)`; a sweep that runs during it reported 12 failures of which 4 were false. Wait for
  `document.getAnimations()` to be quiet, or for `transform` to read `none`.
- **`packages/ui` still carries hardcoded English** — real debt, tracked in
  `.claude/rules/ui-adherence.md`. Do not add more.

## Known component gaps

Registered in `docs/tasks/UI.md` — one line each, naming the screen that found them. **Fix when
you touch the component, then delete the row**, and fix BOTH halves or this repo and the design
system drift.

## Done means

Both halves exist and import the one `<Name>.types.ts`; style is in its own file; every visual
value comes from `@heliogrid/theme`; `pnpm check:all` exits 0.
