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

The component folder shape is `packages/ui/CLAUDE.md`. This file is the law that applies wherever
UI is authored, in the package and in both apps.

## Visual values

- **No raw values.** No hex, no arbitrary px, no inline style. Everything comes from
  `@heliogrid/theme`, which is GENERATED from the live design system and never hand-transcribed.
  `color-mix()` over TOKENS is house style; a literal colour in any notation is not.
- **Primary actions are near-black.** Accent is focus, links, selection, active tab and control
  fills ONLY — never a button fill. Iridescence is atmosphere, never information. Hierarchy comes
  from luminance and elevation, not borders.
- **Light-only v1.** Text is never smaller than 12px; the 11px uppercase overline is the one
  exception.

## Compose from the primitives, don't re-answer them

Every component is built from `packages/ui/src/primitives/`. Two of them hold product law, not
style, and a component that re-implements either is a defect:

- **`Pressable` owns the 44px minimum touch target.** Never re-implement a pressable.
- **`StatusMark` owns "status is never carried by colour alone"** — always a label plus a mark.

**Semantics go THROUGH `Pressable`, never around it.** A control that is a checkbox, radio, tab or
menu row passes `accessibilityRole` and `accessibilityState` to the primitive. Reaching past it
for the platform pressable gives up the 44px floor and the focus ring, which is the only thing the
primitive exists to guarantee.

**Never put `accessible` on a wrapper that contains focusable controls.** It folds the subtree into
one element: the children's labels concatenate and any control inside goes out of the screen
reader's reach. State belongs on the node that already IS the accessibility element.

A surface the design system does not cover is COMPOSED from the existing vocabulary, never new
visuals. **No user-visible English lives in `packages/ui`, accessibility labels included** — a
screen reader speaks an `aria-label`, so a hard-coded one is a Hindi user hearing English. Copy
props are required, never optional-with-a-fallback: a default that "only shows if you forget" is
how untranslated copy ships.

## What no static gate can see — each shipped as a real defect past every gate

- **A control never renders smaller than it was designed.** A `width` with a smaller `min-width` in
  a flex row shrinks silently, and the touch check then measures the floor and passes. Wrap, or set
  `flex-shrink: 0`.
- **No container is drawn around content that is absent.** An optional icon, badge or slot renders
  its box only when it has something in it.
- **`white-space: nowrap` and `numberOfLines` belong on NUMBERS, never on caller text.** A number is
  one token and wrapping it is worse than any overflow; a translated string clips, and it holds in
  English and breaks in Hindi and Marathi.
- **`--text-tertiary` is the quiet role.** If a caller depends on reading it, it is
  `--text-secondary` — a state word, a count, a limit and a delivery channel are information.
- **A component never states a value it was not told** — a default that invents a limit, a size or
  a ceiling promises one thing while the caller refuses another.

## Screens are the unguarded surface

Gates check packages; almost nothing checks what a screen writes inline. Assume nothing is
watching: no inline policy, money maths, enum, copy or colour. A screen renders (Law 11).

## Presentation and logic live in different files

**Style never lives in the component file** — `<Name>.css` on web, `styles.ts` on RN. Three roles:
a **container** (`<Name>Screen.tsx`) holds data, state, handlers and navigation and little markup;
a **presentational** component takes props and returns markup, with no data access and no
navigation; **logic** sits in a `use-<thing>.ts` hook beside them, or in a shared package when
both platforms need it (Law 11). A `.tsx` holding both a data-fetching effect chain and the markup
it feeds is a review finding.

## Done means

375px and 1440px both work · loading, empty and error states all designed (never an offline state)
· keyboard reachable with visible focus · touch targets ≥44px · no hover-only meaning · Hindi
renders without clipping · numbers carry provenance · the prop contract is one `<Name>.types.ts`
both platforms implement (Law 7).
