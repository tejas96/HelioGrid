> **Fate:** what is still true moves into the package `CLAUDE.md` it binds as that module is built; the rest is deleted with this file.

# 17 — UI architecture V2

**Status:** BUILT. `packages/theme` is generated from the live design system and
`packages/ui` holds the primitives and components. It is deliberately built AHEAD of the
screens that consume it: the design system is the source, and screens pull from it per
block. §5's build order below is therefore a record of how it was built, not a live
instruction — the sequencing that still binds is that a component gap found by a screen is
registered in `docs/tasks/UI.md` and fixed on both halves when that component is touched.
**Scope:** the UI layer only — tokens, theme, components, and the two apps' screens.
**Out of scope, do not touch:** `packages/domain`, `data`, `contracts`, `db`, `env`, `config`,
`i18n`, `forms`, and `apps/api` / `apps/worker`. Those are ~1,100 lines of working
backend/shared code and no part of this document changes them.

---

## 1 · Why we are replacing, not refactoring

The v1 UI layer implemented a 21-component snapshot of the design system. The live design
system (Claude Design project **HelioGrid Design System**,
`c8aa4326-21bf-453a-8d11-749cc81dee12`) had already grown well past it through design rounds
13–17, and the v1 layer still carried components for capabilities the product no longer has —
an `OfflineBanner` under parity contract on both platforms, after the owner ruling of
2026-08-07 removed the offline capability entirely.

Refactoring would have preserved that drift. So the layer was replaced rather than refactored:
`packages/theme` and `packages/ui` are the result.

### The failure to design out

The v1 snapshot was a hand-copy of the design system. It went stale within days and
produced at least one false audit finding. **Any hand-copied mirror of the design system
will drift.** §6 is the mechanical answer to this, and it is the most important section
in this document.

---

## 2 · Target layout

```
packages/
├── theme/                       # tokens + semantic layer + provider. ONE package.
│   ├── src/
│   │   ├── _generated/          # WRITTEN BY SCRIPT. Never hand-edit.
│   │   │   ├── tokens.json      #   pulled from the live design system
│   │   │   └── manifest.json    #   component + prop census; no check reads it
│   │   ├── semantic.ts          # raw token -> role mapping (bg-page, text-body, …)
│   │   ├── theme.native.ts      # the RN theme object (StyleSheet consumers read it)
│   │   ├── provider.tsx         # web provider (density mode, locale direction)
│   │   └── index.ts
│   ├── dist/
│   │   ├── tokens.css           # web: CSS custom properties
│   │   └── print.css            # web: @page rules (design gap 32)
│   └── build.ts
│
├── ui/                          # ONE component package. Both platforms live here.
│   └── src/
│       ├── primitives/          # ~8 atoms. Every component is built from these.
│       ├── components/
│       │   └── Button/
│       │       ├── Button.types.ts     # the shared contract — single source
│       │       ├── Button.tsx          # web implementation
│       │       ├── Button.native.tsx   # React Native implementation
│       │       ├── Button.css          # web only
│       │       └── index.ts
│       └── index.ts
│
└── icons/                       # LATER. One SVG source -> RN + web. Not phase 1.
```

**Dependency direction:** `theme → ui → apps`. Nothing flows back up. No app imports
another app. `ui` never imports `domain`, `data`, `contracts`, navigation, or anything
that makes a network call.

### Why `theme` is one package, not `design-tokens` + `theme`

Splitting raw values from semantic values pays off only when a non-React consumer needs
the raw set. We have none — print CSS consumes the emitted stylesheet, which `theme`
exports as a subpath. Two packages here would be two versions, two import paths and two
build steps for one artifact.

### Why the web file is `Button.tsx` and not `Button.web.tsx`

Metro resolves `.native.tsx` ahead of `.tsx` automatically, with no configuration.
Webpack and Turbopack never look for `.native.*` at all, so they take `Button.tsx`.

Naming the web file `Button.web.tsx` instead would require a custom `resolve.extensions`
in **both** the webpack and the Turbopack config, and getting it wrong fails at runtime
rather than at build time. Use `.tsx` + `.native.tsx`. No web config needed.

### Why the three-copy problem disappears

The v1 layer wrote the same prop list three times and needed a 200-line script to keep the
copies equal. With `Button.types.ts` co-located, both platform files import the one
declaration. Divergence is a type error, not a script's job.

The v1 parity script is deleted; §6 says what holds a port now.

---

## 3 · Styling: two technologies, one token set

**Do not force one styling technology across platforms.** Share the tokens, the prop
contract and the behaviour. Let each platform render idiomatically.

### Web — plain CSS files + CSS custom properties

The design system's own source is CSS custom properties, so the repo mirrors it exactly.
No runtime cost, no build plugin, no translation layer.

**No Radix, and Tailwind for LAYOUT ONLY** (`flex`, `grid`, `min-h-dvh`). `Pressable` owns the
44px target, the focus ring and the roles, on both platforms — Radix under the web half alone
would split that ownership and leave native unserved. A Tailwind colour, spacing or type class is
the same defect as a raw hex: values come from `@heliogrid/theme` through `var()`. See ADR-0026.

### React Native — `StyleSheet`

Plain `StyleSheet.create`, with the variant table written out per component as a
`Record<Variant, VariantVisual>`.

`react-native-unistyles` v3 was the original choice, for `variants`/`compoundVariants` mapping
onto the design system's prop enums and for theme swap without re-render. It was not adopted: the
dependency and its Babel plugin are not repaid while the density-mode switch has no product
surface. **ADR-0026 records that reversal**, and its two costs: variant wiring is hand-written and
compared only by prop NAME, against the design system's typings (invariant `design-system-props`), and "style out of the component
file" is true on web and false on native (review-only).

---

## 4 · The primitives layer

~100 components must sit on ~8 primitives. Building 100 flat shells repeats the same
padding, focus ring and touch-target logic 100 times, and that is precisely how the
design-system gap register filled up.

| primitive | responsibility |
|---|---|
| `Box` / `Stack` | layout, spacing scale, direction |
| `Text` | the type scale, including the overline micro-label |
| `Pressable` | **the 44px minimum touch target**, focus ring, pressed state |
| `Surface` | elevation, radius, density mode |
| `Field` | label + hint + error + required, shared by every form control |
| `StatusMark` | **status as label + mark, never colour alone** |
| `Icon` | sizing, currentColor, a11y role |
| `Portal` | sheets, modals, menus, tooltips |

Two of these encode product law rather than style:

- **`Pressable`** owns the 44px minimum. A component cannot ship a small target by accident.
- **`StatusMark`** owns `F7-12` — status is never carried by colour alone. Design gap 23
  is exactly this law broken inside one component (`BandedFigure`'s warning mark measured
  1.99:1 against its tint, making the second channel invisible). One primitive means that
  defect has one place to live and one place to fix.

Build the primitives before any component. They are ~8 files × 2 platforms.

---

## 5 · Build order

1. **`packages/theme`** — pull tokens, emit `tokens.css` + `print.css` + the typed theme,
   add the contrast gate. Depends on nothing.
2. **`packages/ui/primitives`** — the 8 atoms, both platforms.
3. **Delete the old layer** — the v1 UI and token packages, `apps/mobile/src/ui`,
   the v1 parity script, and the two gallery screens
   (`apps/web/features/design-reference/`, `apps/mobile/src/screens/gallery/`). The
   galleries exist only to display the v1 components; they are not migrated.
4. **Components, in the order the screens need them.** Not alphabetically, not all at
   once. The V1 screen list is `docs/prd/registers/screens.md`,
   99 screens, block 1 first.
5. **Rebuild the four existing flows** — login, signup, onboarding, home — on the new
   system. Roughly 7,600 lines of app code exists today; about 40% of it is gallery and
   is deleted rather than ported.

**Do not build all ~100 components before drawing screens.** Each drawn screen tells you
which components it uses and in what form. Building ahead of that is what produced the
57-gap register the first time.

---

## 6 · What holds a port to the design system

**`ds:pull`** (a session action, NOT a pnpm script) — fetches the live design system's tokens,
component manifest and per-component typings (as `.d.ts.txt`) into
`packages/theme/src/_generated/`. Output is committed. Hand-editing anything in `_generated/` is a
bug. It takes the design system at its word: it cannot tell you the live design system changed
under a component you already ported, only that the committed snapshot is what it served at pull
time. Nothing verifies the snapshot is current except pulling again.

The port is then held by checks that run in `pnpm lint` and `pnpm check:all`, and by review.
`.claude/protections.md` is the ledger; this is what each holder asks of `packages/ui`:

| The mistake | What holds it |
| --- | --- |
| **Dropped prop** — the design system declares a prop the port declares nowhere: not in `<Name>.types.ts`, not in the platform-local props, not in a module the folder imports. `style` and `className` are the platform split's own names, never a finding. | invariant `design-system-props`, which reads the pulled `.d.ts.txt` typings and the `Declared props:` allowlists of `adherence.oxlintrc.json` as text |
| **Weakened prop** — a spec union (`ProvenanceProps \| ProvenanceTierSpec`, `NamedGapSpec`, …) ported as a bare `ReactNode`; **raw emit** — the spec type came across but its renderer did not | typecheck |
| **Inert accessibility** — `accessibilityState`, `accessibilityLabel` or `accessibilityValue` on a React Native `View` or `Animated.View` that is not an accessibility element (no `accessible`, no role) | Biome plugin `inert-a11y` |
| **Folded control** — `accessible` on a tag whose subtree holds a control, so the control is out of a screen reader's reach | Biome plugin `folded-control` |
| **Dishonest role** — a literal `progressbar` role with no `accessibilityValue` or `aria-valuenow` | Biome plugin `progressbar-value` |
| **Semantic drift** — the two halves of one component declaring different roles or states for a screen reader | review |
| **False excuse** — a comment excusing a shortfall by naming something that already exists | review |
| **Census** — a component missing one of its four files (`<Name>.types.ts`, `<Name>.tsx`, `<Name>.native.tsx`, `index.ts`) | review; nothing checks it |

The three plugins run on `packages/ui/src` only, and each reads one tag's literal attributes: a
`{...spread}`, a role or `accessible` computed in an expression, and a control rendered by another
component one file away are not followed. Each plugin's header says what it cannot see.

**Inert accessibility and a folded control are one pair.** The repair for an inert View — "add
`accessible` to the wrapper" — is the *worse* defect: `accessible` folds the whole subtree into ONE
element, children stop being separately focusable, their labels concatenate, and any 44dp control
inside — a row's tick, a retry, a fallback link — goes out of reach of the screen reader entirely.
The correct fix for both is the same: the label belongs on the node that **already is** the
accessibility element — the `Pressable` / `Touchable` / `Text` the user lands on, or a child View
that carries a role and holds no control — and the wrapper stays unnamed so its children remain
individually reachable. If the grouping itself must be announced, that is a `role` on the wrapper,
never `accessible`. This was written down before the two folded controls shipped, and they shipped
anyway: prose did not hold it, which is why `folded-control` exists.

**A green lint is not a reviewed component.** Seven audit rounds ran against this package, and every
one found defects while every check of its time was green — round seven found seven of one shape,
a web half declaring a role and a state its native half did not, so the control announced as a
plain button and its state was carried by colour alone (`F7-12`). The checks above close a few
mechanically detectable shapes. Nothing here reads what a component *does* — defaults, focus order,
tokens, copy, state transitions, loading and error behaviour, gesture targets. That is review's job
and verification's, on the running app.

### The two native waivers

A component's native half may be absent for one of two reasons, stated in the first lines of its
own `<Name>.types.ts` header. No check reads the markers; review does (`packages/ui/CLAUDE.md`).

| Marker | What it asserts | Declared by |
| --- | --- | --- |
| `PRINT SURFACE` | The component renders paper. `@page`, 96dpi sheet geometry and print scoping have no React Native equivalent, and a phone never produces the artefact. | `DrawingSheet`, `PagedDocument` |
| `POINTER SURFACE` | The design system gives the component no phone form **and** the phone shell has no slot to host one, so a native half would be an invention rather than a port. | `Breadcrumb` |

Both are stronger claims than "not ported yet". `POINTER SURFACE` in particular needs the design
system to say so in its own words *and* the mobile shell to corroborate it; `Breadcrumb` qualifies
because its DS source reads "desktop only … never a trail" and `AppShell`'s `AppHeader` has a
`breadcrumb` slot while `MobileTopBar` has none.

The vocabulary is closed on purpose. Free text — "desktop only", "N/A on mobile" — would let every
unported component talk its way out. `git grep 'POINTER SURFACE'` lists every component claiming
one; a third kind is argued in review.

---

## 7 · Repo files that reference the old layer

Each needs updating when phase 3 lands. Listed so none is missed:

- `package.json` — no design-system command is left; §6 says what holds a port now
- `.dependency-cruiser.cjs` — package boundary rules naming `ui` / `ui-api` / `tokens`
- `apps/web/next.config.ts` — `transpilePackages: ['@heliogrid/ui', '@heliogrid/theme']`
  **done 2026-08-25 (task 2)**
- `apps/mobile/babel.config.js` — no styling plugin: §3 takes plain `StyleSheet` (ADR-0026)
- **hardcoded English in `packages/ui` — 78 occurrences / 46 unique strings across 64 files
  (measured 2026-08-25).** Mostly `aria-label` / `accessibilityLabel` pairs, which a screen
  reader speaks and which are therefore copy. Each becomes a REQUIRED prop on the
  component's one `<Name>.types.ts`, so by Law 7 it changes both platform halves and every
  call site together — a design-system change, sequenced here rather than with the i18n
  track that established the rule. The rule and the regenerating command are in
  `.claude/rules/ui-adherence.md`; `packages/ui` gains no dependency on `@heliogrid/i18n`.
- `docs/engineering/03-tech-stack.md` — the design-tokens row must name `packages/theme`

---

## 8 · Constraints that carry over unchanged

- TypeScript strict, no new `any`
- No deep imports into package internals — apps import from `@heliogrid/ui` and
  `@heliogrid/theme` only
- No business logic, navigation, API calls or app state inside `@heliogrid/ui`
- Keep the repo building at every step; do not land a broken intermediate state
- Metro must resolve workspace packages (`watchFolders` + `nodeModulesPaths` — already
  correct today, do not regress it)
