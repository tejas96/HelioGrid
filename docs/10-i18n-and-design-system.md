# 10 — i18n & Design System

Binding law for every pixel and every string in HelioGrid. The design system is
**"Instrument"** (warm graphite + brass, machined-instrument feel) — locked in the POC,
ported here unchanged in values and rules, changed only in delivery mechanics (fresh repo,
two platforms). i18n is **Lingui v5**, one catalog, EN/HI/MR, per-user language.

Sources: [./research/design.md](./research/design.md) (token contract, CSS architecture,
portability audit) · [./research/tooling.md](./research/tooling.md) (Lingui v5 selection)
· `.claude/rules/ui.md` + `.claude/rules/i18n.md` (the enforcement rules — this doc is
their long form; where phrasing differs, the rules files win) · POC
`docs/DESIGN-SYSTEM.md` (original ratified spec).

---

## 1. Token pipeline — `packages/tokens`

One framework-neutral source of truth; everything else is generated.

```
packages/tokens/
  src/
    primitives.tokens.json     # --c-* ramps: neutral, brass, status, data hues (DTCG format)
    semantic.light.tokens.json # role names → primitive references (light value set)
    semantic.dark.tokens.json  # same role names → dark value set
    scales.tokens.json         # space, radius, type, weight, motion, z, elevation, touch
    contrast.pairs.json        # declared pairs + minimum ratios (see §1.3)
  build.ts                     # Style Dictionary v4 config + contrast verifier
  dist/                        # GENERATED, never committed, never hand-edited
    tokens.css                 # web: CSS custom properties, light + dark blocks
    theme.ts                   # RN: typed theme object { light, dark, space, type, ... }
    tokens.json                # flat resolved contract for design tooling & doc renderers
```

- **Style Dictionary v4**, DTCG token format (`$value` / `$type` / `$extensions`).
- Build: `pnpm --filter @heliogrid/tokens build`. Turborepo `dependsOn` makes
  `apps/web`, `apps/mobile` and `apps/worker` (PDF templates) build after tokens — no app
  ever ships against a stale `dist/`.
- `theme.ts` converts rem → dp (1rem = 16) and exposes the **same semantic names** as the
  CSS (`theme.color.surfaceRaised`, `theme.space[4]`, `theme.type.sm`). One vocabulary,
  two platforms.
- `tokens.json` is the machine contract: the `/design` page, the proposal-PDF templates
  and the tenant-palette verifier (§10) all consume it rather than parsing CSS.

### 1.1 Two-layer system (enforced, not stylistic)

- **PRIMITIVES** — raw ramps, prefix `--c-*` (`--c-neutral-500`, `--c-brass-500`).
  **Never referenced by any component on any platform.** They exist only as inputs to the
  semantic layer.
- **SEMANTIC** — role-named (`--surface`, `--surface-raised`, `--surface-canvas`, `--text`,
  `--text-muted`, `--accent`, `--accent-hover`, `--accent-text`, `--border`, `--focus-inner`
  / `--focus-outer`, status `--success/--warning/--danger/--info` with `-subtle` pairs).
  This is the only layer components may consume. A brand adjustment is one edit here.
- Naming is by ROLE, never literal: `--surface-raised`, never `--gray-100`. There is
  deliberately no `bg-neutral-500` utility on web — wanting a raw ramp value means the
  system is missing a name; add the name with a verified ratio, never inline the value.
- Scales are deliberately non-continuous: space `0,1,2,3,4,6,8,12,16,20,24` (4px base —
  `p-5`/`p-7` do not exist); weights 400/500/600/700 only; radius sm/md/lg/full
  (6/10/14/9999); elevation `--elev-1/2/3` only; motion 120/200/320ms; z-index named
  (`--z-base/sticky/canvas-chrome/nav/popover/modal/toast` = 0/10/20/30/40/50/60) so
  nobody writes 9999; `--target-min: 2.75rem` (44px).

### 1.2 The N6 data-colour namespace

UI colour and DATA colour are separate systems (rule N6). Data tokens live in their own
namespace so misuse is visible at the call site:

- `--data-roof-1…8` — categorical, roof identity
- `--data-string-1…12` — categorical, electrical strings
- `--data-scale-0…10` — sequential, irradiance / solar access
- `--data-good` / `--data-mid` / `--data-poor` — diverging, performance

These are saturated raw hues (intentionally outside the warm neutral/brass world) because
they encode meaning. Requirements carried as metadata: deuteranopia-distinguishable
within each categorical set, and every data-colour encoding pairs with a non-colour
channel (label, pattern or position). Never style a button with a data colour; never
chart with brass.

### 1.3 Contrast ratios are build-verified metadata

Every shipped colour **pair** declares its minimum in `contrast.pairs.json`
(text ≥ 4.5:1, UI/graphic boundaries ≥ 3:1). The tokens build recomputes WCAG ratios from
the resolved values and **fails the build** if any pair drops below its floor — contrast
is computed, never eyeballed (N4). The load-bearing pairs, carried from the POC:

| Pair | Ratio | Rule it protects |
|---|---|---|
| `--text` on `--surface` (light) | 17.6:1 | body text |
| `--text-muted` on `--surface` | 7.1:1 | secondary text |
| `--text-on-accent` (ink `#1A1712`-class) on `--accent` (brass-500) | 5.78:1 | **brass fills carry INK labels** — white on brass is 3.09:1 and FAILS |
| ink on `--accent-hover` (brass-300) | 7.85:1 | accent **brightens** on hover, never darkens |
| `--accent-text` (brass-700) on `--surface` | ≥4.5:1 | `text-accent` does not exist; brass-500 as type is 2.96:1 |
| dark-theme primary (brass-300) under ink | 8.16:1 | dark is not inverted light |

Changing a primitive that breaks a declared pair is a build failure, not a review comment.

---

## 2. Web wiring — Tailwind v4, full import

The fresh repo takes the **full** Tailwind v4 import:

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";
@import "@heliogrid/tokens/dist/tokens.css";
```

- **The POC's legacy-layer trick is explicitly NOT needed and must not be cargo-culted.**
  The POC declared `@layer legacy, theme, base, components, utilities` and imported only
  `tailwindcss/theme.css` + `utilities.css` to keep Preflight away from old Solar Studio
  screens whose unlayered bare-element resets beat every utility. This repo has no legacy
  screens: Preflight loads globally, there is no `legacy` layer, no partial import, and no
  `.ds` opt-in wrapper — base styles apply to the whole document.
- **`@theme` mapping is non-`inline`, and this is load-bearing.** Semantic tokens map into
  Tailwind's namespace as `@theme { --color-surface: var(--surface); … }`. With
  `@theme inline`, Tailwind resolves `var()` at build time and bakes the **light** value
  into every utility — the page background flips in dark mode while `bg-accent` stays
  light-brass. Verified failure in the POC. Non-inline emits utilities that resolve
  through the variable chain at runtime, so theme switches actually reach utilities.
- Only **semantic** names are exposed to utilities (`bg-surface`, `text-muted`,
  `bg-accent text-on-accent`, `text-accent-text`, `bg-data-good`). Type steps bake their
  line-height (`--text-sm--line-height`) so `text-sm` is complete. Breakpoints: sm 30rem /
  md 48rem / lg 64rem / xl 80rem / 2xl 96rem — but interaction branches on capability
  (`pointer: coarse`, `hover: hover`), never on width.
- Custom utilities kept from the POC: `.tap-target` (44px hit area via `::after`, no
  visual change), `.pt-safe/.pb-safe/.pl-safe/.pr-safe` (safe-area insets), `.sr-only`
  (clip-rect, never `display:none`), `.nowrap-unit`; `dvh`/`svh` via Tailwind's native
  `h-dvh` family — `vh` is banned. Global `prefers-reduced-motion` block kills
  animation/transition durations.
- Fonts load via `next/font` in the root layout (the old app declared Inter and never
  shipped it — do not repeat that): Inter + Noto Sans Devanagari, wired per §8.

---

## 3. Dark mode — one semantic system, two value sets

Never a second palette. Dark redefines the **same semantic names** with the dark value
set: surfaces go warm-black (`#141310` / raised `#1D1B17` class values from the ramp),
primary fill moves **up** the ramp to brass-300, the label stays ink, status colours
brighten, elevations deepen.

```css
:root { color-scheme: light; /* light value set */ }
@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { /* dark set */ } }
:root[data-theme='dark'] { /* dark set, duplicated — explicit toggle wins */ }
```

- The theme toggle stamps `data-theme` on `<html>`; OS preference applies unless the user
  forced light. Both blocks carry identical dark values (generated from the same source,
  so they cannot drift).
- **`--surface-canvas` is theme-invariant dark in both themes** — satellite imagery and
  the 3D studio need a dark ground. Chrome overlaying the canvas uses the dark token set
  regardless of page theme (`--text-on-canvas`, `--surface-canvas-panel`).
- RN: the theme provider swaps the same named objects (`theme.light` / `theme.dark`) from
  `theme.ts`, following `Appearance` with the same explicit-override precedence.
  Conceptually identical, zero CSS involved.

---

## 4. Component strategy

### Web — `packages/ui` (Radix-based, owned in repo)

Radix primitives + Tailwind semantic utilities, shadcn-style **vendored into the repo**
(we own every component file; no styled-kit dependency). Radix supplies focus trap,
dismissal, positioning and ARIA plumbing; our layer supplies Instrument styling and the
behavioural contracts. Component pattern is pure utility classes off semantic tokens:
`bg-accent text-on-accent hover:bg-accent-hover rounded-md tap-target`.

### The four ported component contracts (both platforms, RN natively)

RN cannot use Radix (web-DOM-only). Mobile components live in `apps/mobile/src/ui`,
consume `theme.ts`, and re-implement the **contracts** — the contracts port, the
implementation does not:

1. **`NumberField` commits on blur** (and explicit Done/Cancel on mobile keyboards) —
   never on keystroke. Numeric entry is the always-available precise path beside every
   gesture (touch contract), so its commit semantics are product law.
2. **`DataTable` requires a `caption`** (`sr-only` on web; `accessibilityLabel` on the RN
   list equivalent). No anonymous tables — the BOM and quote are commercial documents.
3. **`ariaLabel`/`accessibilityLabel` is a required prop** on every icon-only control —
   a missing label is a compile error, not a lint warning (N5, N1).
4. **Focus management: move-in / wrap / restore** — web via Radix + `useFocusTrap`;
   RN via `accessibilityViewIsModal` / `importantForAccessibility` + focus restore on
   dismiss. Two-tone focus ring on web (`--focus-inner` outline + `--focus-outer` halo —
   one ring everywhere, legible on paper, brass, photo and dark canvas); RN keyboard/
   switch-control focus gets a bespoke bordered treatment meeting the same 3:1 boundary.

Web-CSS mechanisms get native equivalents, not emulation: safe-area via
`react-native-safe-area-context`; reduced motion via `AccessibilityInfo.isReduceMotionEnabled()`;
`tabular-nums` via `fontVariant: ['tabular-nums']` (verify Inter ships the feature in the
bundled font — verify rendered output, not config); container-query-style components use
`onLayout` width.

---

## 5. `/design` — the living reference

`apps/web/app/design` renders **every token and every component state**: the full
semantic set in light and dark, ink-on-brass proof, the two-tone focus ring, the N6 data
namespace, the 12px floor, all four `DataTable`/`NumberField` states.

- It is the verification surface: "add a token → add it to `/design` or nobody can check
  it renders" carries over as law.
- It is also the **Tailwind content-scan surface**: a semantic utility used nowhere else
  must appear here or v4 will not emit it. The page is generated from
  `dist/tokens.json`, so a new token appears automatically and an unrendered token is
  impossible.
- RN keeps a `DesignReference` dev screen for review parity (no purge concern on native —
  it is for human verification only).

---

## 6. The acceptance law — N1–N10, touch contract, Definition of Done

Restated here as the acceptance gate for every screen on every surface. Full text in
`.claude/rules/ui.md`; a screen violating any single item **is not done**.

**N1** no hover-only meaning · **N2** every target ≥44×44 CSS px (`.tap-target`) ·
**N3** no font <12px, body 14px · **N4** text ≥4.5:1, boundaries ≥3:1, computed not
eyeballed · **N5** accessible names everywhere; modals trap + restore focus · **N6** UI
colour ≠ DATA colour · **N7** provenance tier (measured/derived/estimated/assumed) on
every user-visible number · **N8** destructive = confirmed + undoable, undo
thumb-reachable · **N9** no fixed-viewport layouts · **N10** loading/empty/error/offline
states are part of done.

**Touch contract**: branch on capability, never width · one canvas gesture vocabulary
across satellite, layout editor and 3D (1-finger pan, pinch zoom, two-finger rotate, tap
select, long-press 350ms context, two-finger tap undo; one gesture = one undo step) ·
precision under fingertip (loupe, offset drag, snap-then-nudge, numeric entry always
available, explicit Done/Cancel) · primary actions bottom third, destructive never
adjacent to primary · `dvh`/`svh` only, safe-area on fixed chrome, mobile inputs ≥16px.

**Definition of Done (per screen)**: works at 375px and 1536px with no horizontal
scroll (wide tables become card list + edit sheet; drawings scroll inside their own
container) · all four N10 states · keyboard-operable, visible two-tone focus · axe clean,
contrast verified against token pairs · targets ≥44px · light AND dark correct · every
number carries provenance · zero raw hex, zero off-scale spacing, zero inline styles ·
tested at realistic volume (200-lead list, 40-line BOM, 221-panel design) · **rendered in
Hindi and checked** (§9) · wired into the flows that reach it — no orphan screens.

This applies unreduced to the 3D studio: it is the flagship, and full parity at 375px is
the hardest and least negotiable commitment in the system.

---

## 7. i18n architecture — Lingui v5, one catalog

Selected over Paraglide (no first-class RN), i18next (runtime-heavy, error-prone typing
boilerplate) and FormatJS (weak RN DX) — see [./research/tooling.md](./research/tooling.md);
Lingui v5 is the only compile-time option covering Next.js App Router **and** bare RN
from one catalog ([RN tutorial](https://lingui.dev/tutorials/react-native),
[RSC tutorial](https://lingui.dev/tutorials/react-rsc)).

### 7.1 Catalog structure — `packages/i18n`

```
packages/i18n/
  lingui.config.ts        # locales: ['en','hi','mr'], sourceLocale 'en', format 'po'
  locales/
    en/messages.po        # source of truth is the CODE (t / <Trans> macros);
    hi/messages.po        # .po files are the translation working surface
    mr/messages.po
  src/index.ts            # i18n instance factory, locale constants, loadCatalog()
```

- One catalog package, two consumers. Catalogs compile to per-locale `messages.ts`
  modules (tree-shaken, ICU MessageFormat compiled away — no runtime parser).
- Message IDs are the natural-language English source with generated hashes; explicit
  `id=` only for genuinely ambiguous short strings ("Open" verb vs adjective).
- Hygiene (from `.claude/rules/i18n.md`, binding): no sentence concatenation; ICU
  plurals/selects; named placeholders (`{customerName}`), never positional. Voice-agent
  and WhatsApp templates are tenant **data** in all three languages, not catalog messages.

### 7.2 Extraction workflow

```
pnpm i18n:extract   # lingui extract across apps/web, apps/mobile, packages/ui
pnpm i18n:compile   # lingui compile --typescript
```

- CI runs `extract` and fails if the working tree changes — unextracted messages never
  merge. Missing translations fall back to the English source at runtime (never a bare
  key, never a crash); untranslated-count per locale is reported in CI output so HI/MR
  debt is visible, but does not block a merge.
- `compile` runs in the Turborepo build graph before web/mobile builds.

### 7.3 Web (Next.js App Router + RSC)

Per the Lingui RSC pattern: a per-request `setupI18n()` on the server keyed by the
resolved locale; server components read it via the request-scoped instance;
`<LinguiClientProvider>` hands the serialised catalog to client components. Locale
resolution order: **user profile setting (D25 — per-USER, not per-tenant)** → session
cookie mirror (for first SSR paint) → `en`. Switching language calls the API, updates the
provider, and **re-renders the whole app immediately — no reload**. A Marathi surveyor
and an English owner coexist in one tenant.

### 7.4 Bare RN (metro transformer)

Verified for bare RN ≥0.73, no Expo needed (`.claude/rules/mobile.md`):

- `@lingui/metro-transformer`: `babelTransformerPath` in `metro.config.js` +
  `po`/`pot` in `sourceExts` — catalogs import directly, compile step handled by Metro.
- **Intl polyfills required on Hermes**: `@formatjs/intl-locale` +
  `@formatjs/intl-pluralrules`, imported once at app entry before any i18n use.
- Language switch updates the shared i18n instance; the RN provider re-renders the tree
  identically to web.

---

## 8. Devanagari typography

- **Font chain: Inter → Noto Sans Devanagari** (Inter has zero Devanagari coverage).
- **Web**: both loaded via `next/font` with `--font-inter` and `--font-devanagari`
  variables composed into `--font-sans`; the browser reaches Noto per-codepoint
  automatically. Nothing else to do — but the Hindi render check (§9) is still mandatory
  because automatic fallback hides weight mismatches.
- **RN has no per-codepoint fallback to bundled fonts — explicit handling is mandatory.**
  The shared `<AppText>` primitive (the only text component screens may use) detects
  Devanagari codepoints (U+0900–U+097F) and applies the Noto family to those runs;
  mixed-script strings render as nested spans. Verify rendered output on both simulators,
  not just config.
- **Weight mapping**: the system uses exactly 400/500/600/700. Bundle both families at
  those four weights (`Inter-Regular/Medium/SemiBold/Bold`,
  `NotoSansDevanagari-Regular/Medium/SemiBold/Bold`) and map them in the theme —
  RN synthetic bolding is banned (it fakes weights and breaks the instrument look).
  No 550, no synthetic anything.
- **Layouts must survive ~20–30% Hindi/Marathi text expansion**: no fixed-width labels,
  no truncation of amounts or units, buttons size to content.

---

## 9. Formatting law

- **Money: one function, everywhere.** `formatInr()` from the `packages/domain` units
  module renders Indian digit grouping — `₹4,52,471`, compact `₹92L`, `₹1.4 Cr` — in
  **every locale**, web, mobile, PDFs and voice-agent text alike. Never raw
  `Intl.NumberFormat` for currency: locale defaults drift between en/hi/mr and compact
  notation is wrong for lakh/crore. Money strings also obey the wider money law
  (provenance tier, never-stale rendering) from `CLAUDE.md`.
- **Units are never translated**: kW, kWh, kWp, brand/model names, DISCOM names stay
  as-is in all locales; `.nowrap-unit` keeps value+unit unbreakable. m/ft follows the
  user preference — **except procurement quantities, which stay metric** (Indian
  suppliers sell by the metre).
- **Digits are always Latin 0-9** — never Devanagari numerals, in any locale, including
  documents.
- **Non-money numbers** go through Lingui's `i18n.number()` with the active locale;
  **dates** through `i18n.date()`; default timezone Asia/Kolkata per tenant, stored
  per-tenant for global readiness. No hand-rolled date strings.

---

## 10. Per-tenant branding — customer documents ONLY

Tenants brand what their **customers** see; they never restyle the app.

- **In scope**: the proposal PDF (Playwright/Chromium render in `apps/worker`) and the
  tokenised customer-link pages. Tenant supplies logo + primary brand colour (optional
  secondary) on the tenant record; document templates map them into a document-scoped
  semantic layer (`--doc-accent`, `--doc-accent-text`, …) generated per render.
- **Out of scope, permanently**: the operator app (web and mobile) is Instrument
  graphite+brass for every tenant. No tenant CSS, no theme upload, no per-tenant app
  palette. This protects N4/N6 and keeps every screenshot, support session and training
  video identical across tenants.
- **Contrast re-verification is mandatory**: the POC's verified ratios are specific to
  the brass hue and do NOT transfer to arbitrary tenant colours. On palette save, the
  same contrast engine that gates the tokens build (§1.3) runs against the tenant colour:
  label colour on tenant-accent fills is **chosen by computation** (ink or white,
  whichever clears 4.5:1), and the derived `-text` shade is darkened/lightened along the
  tenant hue until it clears 4.5:1 on the document surface. Palettes are never rejected —
  compliant shades are derived and shown in a live preview. Data colours (N6) are never
  tenant-overridable: roof/string/irradiance hues carry engineering meaning.

---

## 11. Adding a language — the playbook

Adding locale X must touch **only** the items below. If anything else needs changing,
the change that caused it was wrong — fix that instead.

1. Add the locale to `lingui.config.ts`; run `pnpm i18n:extract` → new `locales/xx/messages.po`.
2. Translate (English fallback covers gaps until done; CI reports the untranslated count).
3. **Font check**: does the script render in the Inter → Noto chain? New script (e.g.
   Tamil, Telugu for the voice-agent languages) ⇒ add the Noto family for that script at
   the four weights, extend the web font chain, extend the `<AppText>` script-detection
   map on RN. Verify rendered output on device.
4. **Number/date review**: `formatInr()` is unchanged by design (Indian grouping is law
   in every locale); verify ICU plural rules exist for the locale (Hermes polyfill
   coverage) and spot-check `i18n.date()` output.
5. Extend the locale enum in `packages/contracts` (user profile `language` field) and the
   profile language switcher.
6. **Expansion check**: render the five densest screens (BOM, quote, proposal builder,
   lead list, studio panels) in the new locale; fix any truncation as a layout bug.
7. Ship. No token change, no component change, no schema migration beyond the enum.

---

## 12. Enforcement summary

| Rule | Enforced by |
|---|---|
| No raw values in components | Biome `noRestrictedImports`/review + tokens are the only colour source; `/design` renders every token |
| Contrast floors | tokens build fails on any declared pair below floor (§1.3); tenant palettes re-verified on save (§10) |
| Primitive layer never consumed | only semantic names exposed to Tailwind `@theme` / `theme.ts` export |
| Dark-mode utilities actually flip | `@theme` non-inline (§2) — regression = the POC's baked-light-value failure |
| Catalog completeness | CI `lingui extract` clean-tree check (§7.2) |
| Hindi survives | DoD requires the Hindi render check per screen (§6, §8) |
| Money format | single `formatInr()` in `packages/domain`; no raw currency `Intl` calls |
