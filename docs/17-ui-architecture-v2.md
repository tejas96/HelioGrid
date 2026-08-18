# 17 — UI architecture V2

**Status:** approved direction, not yet built. Written 2026-08-19.
**Scope:** the UI layer only — tokens, theme, components, and the two apps' screens.
**Out of scope, do not touch:** `packages/domain`, `data`, `contracts`, `db`, `env`, `config`,
`i18n`, `forms`, and `apps/api` / `apps/worker`. Those are ~1,100 lines of working
backend/shared code and no part of this document changes them.

---

## 1 · Why we are replacing, not refactoring

`packages/ui`, `packages/ui-api` and `apps/mobile/src/ui` implement the **v1** design
system — the 21 components snapshotted in `design/ds-source/`. That snapshot is marked
`STALE-DO-NOT-TRUST.md` in its own folder. The live design system (Claude Design project
**HelioGrid Design System**, `c8aa4326-21bf-453a-8d11-749cc81dee12`) carried roughly 65
exports when that warning was written and has grown since through design rounds 13–17.

Two concrete proofs that the built UI is the wrong spec:

- **`OfflineBanner` is built, exported and under parity contract on both platforms.**
  Owner ruling **Q61** (2026-08-07) removed the offline/sync capability from the product
  entirely. `docs/13-ux-gap-register.md:113` already records it as dead code.
- **`docs/06-offline-and-sync.md` still exists** and describes that removed capability.

Refactoring preserves both. So we replace.

### The failure to design out

`design/ds-source/` was a hand-copy of the design system. It went stale within days and
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
│   │   │   └── manifest.json    #   component + prop census, for the drift gate
│   │   ├── semantic.ts          # raw token -> role mapping (bg-page, text-body, …)
│   │   ├── theme.native.ts      # Unistyles theme registration
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

Today the same prop list is written three times — `packages/ui`, `apps/mobile/src/ui`,
and `packages/ui-api` — and `scripts/check-ui-parity.mjs` (200 lines) exists only to keep
them equal. With `Button.types.ts` co-located, both platform files import the one
declaration. Divergence becomes a type error, not a script's job.

`scripts/check-ui-parity.mjs` is deleted. Its replacement checks something else — see §6.

---

## 3 · Styling: two technologies, one token set

**Do not force one styling technology across platforms.** Share the tokens, the prop
contract and the behaviour. Let each platform render idiomatically.

### Web — plain CSS files + CSS custom properties

The design system's own source is CSS custom properties, so the repo mirrors it exactly.
No runtime cost, no build plugin, no translation layer. Radix stays underneath for focus
management and roving tabindex.

Do not introduce Tailwind or CSS-in-JS. There is nothing to gain and a token-shaped
system fights a utility-shaped one.

### React Native — `react-native-unistyles` v3

Recommended over hand-rolled `StyleSheet` + prop arrays, for three reasons that only
matter at this scale:

1. **`variants` / `compoundVariants`** map 1:1 onto the design system's prop enums
   (`Button` primary/secondary/ghost/destructive × lg/md/sm). Across ~100 components this
   removes a large amount of `[styles.base, v === 'primary' && styles.primary]` wiring.
2. **Theme swap without re-render** — density mode (Expressive / Functional) is a
   product-wide switch, not a per-screen prop.
3. It consumes a **plain theme object**, which is exactly what `theme/build.ts` emits.

Cost to accept knowingly: a Babel plugin and a real dependency. RN 0.86 is supported.

If the new session judges the dependency not worth it, plain `StyleSheet` plus a small
`useStyles` helper is a legitimate fallback — but make that call explicitly and write
down why, do not drift into it.

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
3. **Delete the old layer** — `packages/ui`, `packages/ui-api`, `packages/tokens`,
   `apps/mobile/src/ui`, `scripts/check-ui-parity.mjs`, and the two gallery screens
   (`apps/web/features/design-reference/`, `apps/mobile/src/screens/gallery/`). The
   galleries exist only to display the v1 components; they are not migrated.
4. **Components, in the order the screens need them.** Not alphabetically, not all at
   once. The V1 screen list is `prd/registers/screens.md` in the `heliogrid_v2_prd` repo,
   99 screens, block 1 first.
5. **Rebuild the four existing flows** — login, signup, onboarding, home — on the new
   system. Roughly 7,600 lines of app code exists today; about 40% of it is gallery and
   is deleted rather than ported.

**Do not build all ~100 components before drawing screens.** Each drawn screen tells you
which components it uses and in what form. Building ahead of that is what produced the
57-gap register the first time.

---

## 6 · The drift gate — the part that must not be skipped

Two scripts, both mechanical.

**`pnpm ds:pull`** — fetches the live design system's tokens and component manifest into
`packages/theme/src/_generated/`. Output is committed. Hand-editing anything in
`_generated/` is a bug.

**`pnpm ds:check`** — re-pulls and diffs the live manifest against the repo, reporting
three lists:

- in the design system, not in the repo (not yet built — expected during phase 4)
- in the repo, not in the design system (**stale — a component that was removed, like
  `OfflineBanner`**)
- present in both, prop lists differ (**drift — the dangerous one**)

CI fails on the second and third lists. The first is informational while the component
build is in progress.

This is the direct replacement for `check-ui-parity.mjs`. That script kept three copies
of the same list equal to each other; it could not tell you that all three were wrong.
This one compares the repo to the design system, which is the comparison that matters.

---

## 7 · Repo files that reference the old layer

Each needs updating when phase 3 lands. Listed so none is missed:

- `package.json` — remove the `check:ui-parity` script, add `ds:pull` and `ds:check`
- `.dependency-cruiser.cjs` — package boundary rules naming `ui` / `ui-api` / `tokens`
- `knip.jsonc` — entry points for the deleted packages
- `apps/web/next.config.ts` — `transpilePackages: ['@heliogrid/ui']` becomes
  `['@heliogrid/ui', '@heliogrid/theme']`
- `apps/mobile/babel.config.js` — add the Unistyles plugin if §3 is taken
- `docs/03-tech-stack.md` — the "21-component `_ds` API" row is stale
- `docs/10-i18n-and-design-system.md` — the component census is stale
- `docs/06-offline-and-sync.md` — describes a capability removed by ruling Q61
- `docs/13-ux-gap-register.md` — predates the V2 PRD; reconcile or retire
- `design/ds-source/` — delete; it is a v1 snapshot already marked do-not-trust

---

## 8 · Constraints that carry over unchanged

- TypeScript strict, no new `any`
- No deep imports into package internals — apps import from `@heliogrid/ui` and
  `@heliogrid/theme` only
- No business logic, navigation, API calls or app state inside `@heliogrid/ui`
- Keep the repo building at every step; do not land a broken intermediate state
- Metro must resolve workspace packages (`watchFolders` + `nodeModulesPaths` — already
  correct today, do not regress it)
