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

## Visual values

- **No raw values** — no hex, no px, no inline style; every value comes from `@heliogrid/theme`. On
  a screen only `0` is written raw; a size or colour the design system lacks is added THERE, in Claude
  Design, then pulled — never typed into the app.
- **Primary actions are near-black.** Accent is focus, links, selection, active tab and control
  fills ONLY — never a button fill. Iridescence is atmosphere, never information. Hierarchy comes
  from luminance and elevation, not borders.
- **Text is never smaller than 12px**; the 11px uppercase overline is the one exception.
- **An icon-only control is an `IconButton`**; a `Button` always has words.

## Compose from the primitives, don't re-answer them

Every component is built from `packages/ui/src/primitives/`. Two of them hold product law, not
style, and a component that re-implements either is a defect:

- **`Pressable` owns the 44px minimum touch target.** Never re-implement a pressable.
- **`StatusMark` owns "status is never carried by colour alone"** — always a label plus a mark.

**Semantics go through `Pressable`:** a checkbox, radio, tab or menu row passes `accessibilityRole`
and `accessibilityState` to it; reaching for the platform pressable loses the 44px floor and focus
ring.

**Never put `accessible` on a wrapper that holds controls** — it folds them out of the screen
reader's reach; state goes on the node that is the accessibility element.

A surface the design system does not cover is COMPOSED from the existing vocabulary, never new
visuals. **No user-visible English lives in `packages/ui`, accessibility labels included** — a
screen reader speaks an `aria-label`, so a hard-coded one is a Hindi user hearing English. Copy
props are required, never optional-with-a-fallback: a default that "only shows if you forget" is
how untranslated copy ships.

## Traps no check sees

- **A control never renders smaller than it was designed.** A `width` or `height` with a smaller
  `min-width` or `min-height` in a flex row shrinks silently, and the touch check then measures the
  floor and passes. Wrap, or set `flex-shrink: 0`.
- **No container is drawn around content that is absent.** An optional icon, badge or slot renders
  its box only when it has something in it.
- **`white-space: nowrap` and `numberOfLines` belong on NUMBERS, never on caller text.** A number is
  one token and wrapping it is worse than any overflow; a translated string clips, and it holds in
  English and breaks in Hindi and Marathi.
- **`--text-tertiary` is the quiet role.** If a caller depends on reading it, it is
  `--text-secondary` — a state word, a count, a limit and a delivery channel are information.
- **A component never states a value it was not told** — a default that invents a limit, a size or
  a ceiling promises one thing while the caller refuses another.

## Screens

Hindi and Marathi words are copied from the board's language renders; a phrase the board has no
render for is drafted, flagged in the task for a native review, and never passed off as the board's.

Every word a screen shows comes from `@heliogrid/i18n` — `<Trans id="…">` in markup, `t(COPY.key)`
in hooks and handlers. No check finds a bare English literal in JSX.

## Presentation and logic live in different files

**Style never lives in the component file** — `<Name>.css` on web, `styles.ts` on RN. Three roles:
a **container** (`<Name>Screen.tsx`) holds data, state, handlers and navigation and little markup;
a **presentational** component takes props and returns markup, with no data access and no
navigation; **logic** sits in a `use-<thing>.ts` hook beside them, or in a shared package when
both platforms need it (Law 11). A `.tsx` holding both a data-fetching effect chain and the markup
it feeds is a review finding.

## Done means

The per-screen Definition of Done, `F7-43` (`docs/prd/foundations/F7-design-language.md`) — for a
component: at 375 and 1536, in Hindi, both halves on the one `<Name>.types.ts`.
