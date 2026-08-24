---
paths:
  - "packages/ui/**"
  - "packages/theme/**"
  - "apps/mobile/src/**"
  - "apps/mobile/App.tsx"
  - "apps/web/app/**"
  - "apps/web/lib/**"
  - "apps/web/features/**"
---

# UI — theme only, compose don't invent, separate rendering from logic

## Current state, read this first

**The v1 design system was deleted on 2026-08-19** — the old UI and token packages,
`apps/mobile/src/ui` and every screen built on them are gone. The V2 replacement is specified
in `docs/17-ui-architecture-v2.md`.

Until it is: `apps/mobile/src/screens/placeholder/` and `apps/web/app/home/` are raw
primitives on purpose, excluded by path from the rules below. Do not copy their shape into
a real screen, and do not build a component outside `packages/ui` to unblock yourself —
say the package is missing and stop.

## Where a component goes

```
packages/ui/src/components/<Name>/<Name>.types.ts    the shared prop contract — ONE declaration
packages/ui/src/components/<Name>/<Name>.tsx         web
packages/ui/src/components/<Name>/<Name>.native.tsx  React Native
packages/ui/src/components/<Name>/<Name>.css         web styles
packages/ui/src/components/<Name>/index.ts           barrel
```

**The web file is `<Name>.tsx`, never `<Name>.web.tsx`.** Metro resolves `.native.tsx` ahead
of `.tsx` with no config; webpack and Turbopack never look for `.native.*`, so they take
`.tsx`. Naming the web half `.web.tsx` needs a custom `resolve.extensions` in both bundlers
and fails at RUNTIME, not build time, when it is wrong.

Both platform files import the one `.types.ts`. Divergence is a type error — this is what
replaced the three hand-maintained prop lists and the script that compared them.

## Rules

### Visual values
- **No raw values.** No hex, no arbitrary px, no inline style. Everything comes from
  `@heliogrid/theme`, which is GENERATED from the live design system (`pnpm ds:pull`) —
  never hand-transcribed. Anything under `_generated/` is written by script only.
  (Hex: `pnpm lint` fails. Arbitrary px and inline style are review-only — no honest gate
  exists, so the rule holds by your care, not by a red build.)
- **Primary actions are near-black.** Accent is focus, links, selection, active tab and
  control fills ONLY — never a button fill. Iridescence is atmosphere, never information.
  Hierarchy comes from luminance and elevation, not borders.
- **Light-only v1.** Text is never smaller than 12px; the 11px/700/uppercase/0.12em overline
  is the one exception.

### Compose from the primitives, don't re-answer them
Every component is built from `packages/ui/src/primitives/` — `Box`/`Stack`, `Text`,
`Pressable`, `Surface`, `Field`, `StatusMark`, `Icon`, `Portal`. Two of them hold product
law, not style, and a component that re-implements either is a defect:

- **`Pressable` owns the 44px minimum touch target.** Never re-implement a pressable.
- **`StatusMark` owns "status is never carried by colour alone"** — always a label plus a
  mark. A tint with no second channel is the defect this primitive exists to prevent.

**Semantics go THROUGH `Pressable`, never around it.** A control that is a checkbox, radio, tab
or menu row passes `accessibilityRole` and `accessibilityState` to the primitive; reaching past it
for the platform pressable to obtain them gives up the 44px floor and the focus ring, which is the
only thing the primitive exists to guarantee. Six audit rounds re-found that trade.

**Never put `accessible` on a wrapper that contains focusable controls.** It folds the subtree into
one element: the children's labels are concatenated and any 44px control inside goes out of the
screen reader's reach. State belongs on the node that already IS the accessibility element — the
Pressable or Text the user lands on.

A surface the design system doesn't cover is COMPOSED from the existing vocabulary — never
new visuals. Log the composition decision as a module ruling.

- Copy props are required, never optional-with-an-English-fallback.
- Status/variant → visual maps are `Record<TheEnum, …>` (`.claude/rules/contracts.md`).

### Presentation and logic live in different files
A component renders. It does not also fetch, orchestrate, or hold flow logic.
- **Container** — `<Name>Screen.tsx`: data via the typed client, state, handlers, navigation.
  Returns presentational components; holds little markup. Web's `page.tsx` is routing only.
- **Presentational** — a component in `apps/web/features/<feature>/` or `packages/ui`: props
  in, markup out. No data access, no navigation.
- **Logic** — a `use-<thing>.ts` controller hook beside it in the same feature folder; shared
  logic both platforms need belongs in a shared package (Law 11 —
  `.claude/rules/cross-platform.md`), never copied into each platform.

A `.tsx` holding both a data-fetching effect chain and the markup it feeds is a review
finding. File-size and split-naming law: root CLAUDE.md §8.

## Done means
375px and 1440px both work · loading, empty and error states all designed (**never an offline
state — removed by owner ruling Q61**) · keyboard reachable with visible focus · touch targets
≥44px · no hover-only meaning · Hindi renders without clipping
(`.claude/rules/cross-platform.md`) · numbers carry provenance · the prop contract is one
`.types.ts` both platforms import (Law 7).
