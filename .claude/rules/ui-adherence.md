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
in `docs/engineering/17-ui-architecture-v2.md`.

The first screens to use it are the placeholder screens under `apps/web/features/app/home/`
(web) and `apps/mobile/src/screens/shared/PlaceholderScaffold` (mobile). Both use
`@heliogrid/ui` `EmptyState` and are governed by all rules below. Their copy is temporary —
the i18n track wraps it when the real screens are designed.

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
  `@heliogrid/theme`, which is GENERATED from the live design system and never hand-transcribed.
  Anything under `packages/theme/src/_generated/` is written by **`ds:pull`** — a Claude session
  action driving the DesignSync MCP, **not a pnpm script**; do not go looking for one. Its output
  is committed, and hand-editing it is a bug.
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

- **`packages/ui` holds NO user-visible English — including accessibility labels.** Copy
  props are required, never optional-with-an-English-fallback, and an `aria-label` /
  `accessibilityLabel` is copy: a screen reader speaks it, so a hard-coded one is a Hindi
  user hearing English. The package does NOT depend on `@heliogrid/i18n` and never will —
  the caller passes an already-translated string, or the string lives in
  `packages/i18n/src/copy/` and the caller renders it. A default that "only shows if you
  forget" is how untranslated copy ships.
- Status/variant → visual maps are `Record<TheEnum, …>` (`.claude/rules/contracts.md`).

### Known debt: hardcoded English in `packages/ui`

**78 occurrences / 46 unique strings across 64 files, measured 2026-08-25** — 54 of them
accessibility labels (each appearing in both platform halves of one component), 20 JSX text
nodes, 4 attributes. They predate the rule above; the V2 component layer landed with them.

**A NEW component gets no grace** — write the prop. Clearing the existing set is a design-
system change, not an i18n one: every string becomes a required prop on the component's ONE
`<Name>.types.ts`, which by Law 7 changes both platform halves and every call site at once.
It is sequenced with the design-system work in `docs/engineering/17`, not with the language
plumbing that landed 2026-08-25.

List the current set — regenerate it rather than trusting a copied list:

```bash
git ls-files 'packages/ui/src' | grep -E '\.tsx?$' | grep -v '\.types\.ts$' \
  | xargs grep -nE '(aria-label|accessibilityLabel|accessibilityHint|placeholder|title|alt)="[^"]{2,}"|>[[:space:]]*[A-Z][a-z]{3,}[^<>{}]*<'
```

### Screens are the unguarded surface

Gates check packages; almost nothing checks what a screen writes inline, and that is where every
recent defect landed. Inside a screen, assume nothing is watching:

- No inline policy, no inline money maths, no inline enum, no inline copy, no inline colour.
- A screen **renders**. It does not hold policy (Law 11).
- Anything you are tempted to define here belongs in a package — see
  `.claude/rules/architecture-ownership.md` for which one.

### What a static gate cannot see

Each shipped as a real defect in `packages/ui` and each passed every gate. They are held by your
care and by the render harness's probes (`docs/engineering/harness/README.md`), nothing else.

- **A control never renders smaller than it was designed.** A `width` with a smaller `min-width` in a
  flex row shrinks silently; the touch check then measures the floor and passes. Wrap, or set
  `flex-shrink: 0`.
- **No container is drawn around content that is absent.** An optional icon, badge or slot renders
  its box only when it has something in it — otherwise the caller gets an empty shape it cannot remove.
- **`white-space: nowrap` / `numberOfLines` belong on NUMBERS, never on caller text.** A number is one
  token and wrapping it is worse than any overflow. A translated string clips, and it holds in English
  and breaks in Hindi and Marathi.
- **`--text-tertiary` is the quiet role.** If a caller depends on reading it, it is `--text-secondary`
  — a state word, a count, a limit and a delivery channel are all information, not decoration.
- **A component never states a value it was not told.** A default that invents a limit, a size or a
  ceiling promises one thing while the caller refuses another.

### Presentation and logic live in different files

**Style never lives in the component file** — `<Name>.css` on web, `styles.ts` on RN. A component
file holds markup and the hook calls it needs; nothing else.
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
