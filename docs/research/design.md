> **FULLY SUPERSEDED (2026-07-30) — do not cite.** The visual system here (POC "Instrument")
> was retired by ruling E; the production visual system is the vendored UX package
> (`design/ds-source`) — see [ds-tokens.md](./ds-tokens.md) / [ds-brand-law.md](./ds-brand-law.md) /
> [ds-usage.md](./ds-usage.md) / [ds-reconciliation.md](./ds-reconciliation.md).
> **The N1–N10 hard rules and the mobile/touch contract that were the last binding content
> in this file have been promoted verbatim into `docs/10-i18n-and-design-system.md` §11.**
> Cite that. This file is retained as historical evidence only — binding law must never live
> inside a document readers are told to ignore.

# HelioGrid "Instrument" Design System — Architecture Brief for SaaS Rebuild

Sources: `docs/DESIGN-SYSTEM.md`, `src/design/tokens.css`, `src/design/index.css`, `src/app/design/page.tsx`. All paths absolute below.

---

## 1. THE NON-NEGOTIABLES (binding rules)

### Product-shaping constraints (frame every UI decision)
- **Full mobile parity including the design studio** — every screen, including roof tracing and 3D, works at **375px**. Deliberate differentiator; the hardest commitment in the doc.
- **WhatsApp is the primary customer channel**, not email — send/follow-up/reminder/accept all flow through it.
- **The customer never logs in** — they open a tokenised link and accept/reject. Every customer-facing surface assumes a stranger on a phone with zero context.
- v1 scope is **Sell only** (CRM → survey → design → quote → proposal → close). Procurement/installation/O&M are out.

### The 10 hard rules (N1–N10) — MOVED

> Promoted verbatim to `docs/10-i18n-and-design-system.md` §11 on 2026-07-30 and REMOVED
> here, so there is exactly one definition to keep current. Cite docs/10 §11.

### Brand rules (LOCKED — Direction A "Instrument")
- **Brass fills carry INK labels, not white.** White on `#C8842A` = 3.09:1 (fails AA). Ink `#1A1712` on brass = 5.78:1. This is a machined-instrument look (Leica, not lemonade).
- **The accent BRIGHTENS on hover, never darkens** (`#C8842A → #D9A24E`, 7.85:1 with ink) — darkening would drag the ink label toward failing.
- **Accent text is `#8A5518` (brass-700), never `#C8842A` (brass-500).** Brass-500 is 2.96:1 as text — a FILL/GRAPHIC colour only, never type and never a meaningful icon.
- **Two-tone focus ring, one ring everywhere**: `outline: 2px solid var(--focus-inner)` (near-white) + `outline-offset:1px` + `box-shadow: 0 0 0 4px var(--focus-outer)` (ink). Light core on dark surfaces, dark halo on light — legible on paper, brass fill, photo, and dark canvas.
- **Dark is not inverted light.** Surfaces warm-black (`#141310` / raised `#1D1B17`); primary fill moves **up** the ramp to brass-300 `#D9A24E`; label stays ink.
- **Name/mark: HelioGrid, monogram not a sun** — a sun icon competes with solar-access data colours.
- Every shipped colour pair has a **computed** contrast ratio (§3.3 table): 17.6:1 text on surface, 7.1:1 muted, 5.78:1 ink-on-brass, 8.16:1 dark primary, etc.

### Mobile / touch contract — MOVED

> Promoted verbatim to `docs/10-i18n-and-design-system.md` §11 on 2026-07-30 and REMOVED
> here. Cite docs/10 §11.

### Definition of Done (§13 — all must be true)
Works at 375px and 1536px with no horizontal scroll · loading/empty/error/offline states exist · keyboard-operable end-to-end with visible ordered focus · axe clean + contrast verified against token pairs · touch targets ≥44px, no hover-only meaning · light and dark both correct · every number carries provenance · destructive actions confirmed and undoable · zero raw hex / zero off-scale spacing / zero inline styles · tested at realistic volume (40-line BOM, 200-lead list, 221-panel design).

---

## 2. TOKEN CONTRACT (categories + naming scheme)

**Two-layer architecture, and the distinction is enforced:**
- **PRIMITIVES** — raw ramps, prefix `--c-*` (e.g. `--c-neutral-500`, `--c-brass-500`). **Never referenced by a component.**
- **SEMANTIC** — role-named (e.g. `--surface`, `--text`, `--accent`). What components consume. A brand change is one edit in the semantic layer.
- **Rule: components never write raw values** — no `#hex`, no `px` spacing, no ad-hoc font sizes. If a needed colour doesn't exist, add it to `tokens.css` with a verified contrast ratio in the comment.

**Naming is by ROLE, not literal** (`--surface-raised`, never `--gray-100`):

| Category | Tokens (naming scheme) |
|---|---|
| **Surfaces** | `--surface`, `--surface-raised`, `--surface-sunken`, `--surface-overlay`, `--surface-canvas`, `--surface-canvas-panel` |
| **Text** | `--text`, `--text-muted`, `--text-subtle`, `--text-on-accent`, `--text-on-canvas` |
| **Lines** | `--border`, `--border-strong`, `--border-subtle` |
| **Accent** | `--accent`, `--accent-hover`, `--accent-active`, `--accent-subtle`, `--accent-border`, `--accent-text` (note: distinct `-border` and `-text` because brass-500 can't be type or a 3:1 border) |
| **Status** | `--success`, `--warning`, `--danger`, `--info` — each with `-subtle` (background) and the base as `-strong`/foreground; primitives use `--c-<status>-bg` / `--c-<status>-fg` pairs |
| **Focus** | `--focus-inner`, `--focus-outer` (two-tone) |
| **Data (separate namespace, N6)** | `--data-roof-1…8` (categorical, roof identity), `--data-string-1…12` (categorical, electrical strings — specced), `--data-scale-0…10` (sequential, irradiance — specced), `--data-good`/`--data-mid`/`--data-poor` (diverging, performance) |
| **Type** | `--font-sans`, `--font-mono`; size steps `--text-2xs…--text-3xl` (8 steps) + matching `--leading-*`; weights `--weight-regular/medium/semibold/bold` (400/500/600/700 only, **no 550**) |
| **Space** | `--space-0,1,2,3,4,6,8,12,16,20,24` (4px base; deliberately non-continuous — `p-5`/`p-7` don't exist) |
| **Radius** | `--radius-sm/md/lg/full` (6/10/14/9999) |
| **Elevation** | `--elev-1/2/3` (cards / popovers / modals — no other shadows) |
| **Motion** | `--motion-fast/base/slow` (120/200/320ms), `--ease-out`, `--ease-in` |
| **Touch** | `--target-min` (2.75rem = 44px) |
| **Z-index** | `--z-base/sticky/canvas-chrome/nav/popover/modal/toast` (0/10/20/30/40/50/60 — named so nobody writes 9999) |

Notable semantic-layer subtleties: `--surface-canvas` stays dark in **both** themes (satellite/3D need it). `--text-on-accent` = neutral-900 ink. Data colours (`--data-roof-*` etc.) are raw hex saturated hues (`#2563eb`, `#7c3aed`…) — intentionally outside the warm neutral/brass system because they encode meaning; they must be deuteranopia-distinguishable AND carry a non-colour encoding (label/pattern/position).

---

## 3. ARCHITECTURE OF THE CSS

**Cascade layers (order is load-bearing), declared in `src/design/index.css`:**
```
@layer legacy, theme, base, components, utilities;
```
- **The legacy-layer trick**: the old `features/solar-studio/theme.css` contains bare-element resets (`button { background:none; border:none }`). **Unlayered CSS beats all layered CSS**, so while it sat outside a layer it silently overrode every Tailwind utility (a `bg-accent` button rendered with no fill). Importing it into the **first-declared** `legacy` layer makes utilities win while changing nothing for legacy screens (which use no utilities). This lets the new DS and old Solar Studio screens coexist during migration.
- Imports: `theme.css`→`theme` layer, `utilities.css`→`utilities` layer, then `tokens.css` unlayered.

**Tailwind wiring — deliberately partial (v4):**
- They **do not** `@import "tailwindcss"` wholesale — that would pull in **Preflight** (Tailwind's global reset) and restyle/break existing Solar Studio screens. Instead they import only `tailwindcss/theme.css` + `tailwindcss/utilities.css`. This gives the full utility API with zero effect on non-opted-in markup.
- Migration exit: "When the last legacy screen is gone, swap these three lines for `@import "tailwindcss";` and delete `features/solar-studio/theme.css`."

**`@theme` usage — the runtime-theming trick:**
- Semantic tokens are mapped into Tailwind's namespace inside `@theme { --color-surface: var(--surface); … }` so `bg-surface`, `text-muted`, `rounded-md`, `p-4` resolve to the CSS variables.
- **Deliberately NOT `@theme inline`.** With `inline`, Tailwind resolves `var()` at build time and bakes the **light** value into every utility (verified: page bg flipped correctly since it reads `var(--surface)` directly, but `bg-accent` stayed brass-500). Without `inline`, Tailwind emits `--color-accent: var(--accent)` and the utility resolves through the chain **at runtime**, so a theme switch actually reaches utilities.
- Only **semantic** names are exposed — there is intentionally no `bg-neutral-500`; wanting a raw ramp value means the DS is missing a name. Data colours are namespaced (`bg-data-good`) so they read as data at the call site. Type steps bake line-height in (`--text-sm--line-height`), so `text-sm` is complete. Breakpoints defined here: sm 30rem / md 48rem / lg 64rem / xl 80rem / 2xl 96rem.

**Dark-mode strategy — one semantic system, two value sets (never a second palette):**
```css
:root { color-scheme: light }                          /* semantic values */
@media (prefers-color-scheme:dark){ :root:not([data-theme='light']){…} }  /* OS pref, unless forced light */
:root[data-theme='dark'] { … }                          /* explicit toggle stamps data-theme on <html> */
```
- Dark redefines the **same semantic names** with dark values (surfaces warm-black, accent → brass-300, ink label preserved, status colours brightened, elevations deepened). The dark values are duplicated in both the media-query block and the explicit `[data-theme='dark']` block.
- `--surface-canvas` is theme-invariant; chrome over the canvas uses the dark token set regardless of page theme.

**Base + utilities layers (`index.css`):**
- Base is **scoped to `.ds`** so it can't leak into legacy screens — new screens wrap in `<div className="ds">` (AppShell does this). `.ds` sets background/color/font/`tabular-nums` on tables and `[data-numeric]`, and defines THE two-tone `:focus-visible` ring plus `:focus:not(:focus-visible){outline:none}`.
- Custom utilities: `.tap-target` (44px hit area via `::after` pseudo, no visual size change), `.pb-safe/pt-safe/pl-safe/pr-safe` (safe-area insets), `.h-screen-d`/`.min-h-screen-d` (100dvh), `.sr-only` (clip-rect, never `display:none`), `.nowrap-unit`.
- `prefers-reduced-motion` block is **global** (applies to legacy screens too) — kills animation/transition durations and scroll-behavior.

**Fonts:** loaded via `next/font` in `app/layout.tsx` (old app declared Inter and never shipped it). Stack: `--font-inter, --font-devanagari, ui-sans-serif…` — Noto Sans Devanagari is second because Inter has no Devanagari coverage (Hindi/Marathi, market D25); browser reaches it only for Devanagari codepoints.

**`/design` page** (`src/app/design/page.tsx`) is a living reference **and** the Tailwind content-scan surface — if a token isn't used there, Tailwind may purge it and nobody can verify it renders. It demonstrates §3.2 (ink on brass), §3.4 (focus ring), N6 (data namespace), N3 (12px floor). Component pattern is pure utility classes off semantic tokens (`bg-accent text-on-accent hover:bg-accent-hover`), table with required `<caption className="sr-only">`.

---

## 4. PORTABILITY ASSESSMENT (fresh monorepo: web + React Native)

### Ports directly (platform-agnostic core)
- **The token *values and semantics*** — the two-layer primitive/semantic model, all colour/space/radius/type/motion/z-index scales, and every verified contrast ratio are pure data. Extract `tokens.css` into a framework-neutral source (JSON / TS object / Style Dictionary) as the single source of truth, then generate CSS vars for web and a JS/TS theme object for RN.
- **The rules doc** (`DESIGN-SYSTEM.md`) — brand rules, N1–N10, density doctrine, touch contract, a11y contract, craft rules, Definition of Done are all platform-independent and become the shared spec both platforms build against.
- **Semantic naming discipline** — role-based names map cleanly to RN's `StyleSheet`/theme context (`theme.color.surfaceRaised`, `theme.space[4]`).
- **Type scale, spacing scale, radius, elevation intents, motion durations** — all portable as numbers (RN uses unitless density-independent px; the rem-based web values convert 1rem→16).
- **The "one semantic system, two value sets" dark strategy** — RN implements it via a theme provider/context swapping the same named objects; conceptually identical.

### Needs a native equivalent (does not port as-is)
- **The entire CSS-layers + Tailwind-partial-import + legacy-layer trick** — RN has no cascade, no `@layer`, no Preflight, no unlayered-beats-layered problem. On web in the fresh monorepo the legacy trick is unnecessary (no old Solar Studio screens to protect) — you'd go straight to full Tailwind. Only the *token→utility mapping idea* survives; consider NativeWind/tamagui/unistyles on RN if you want utility-style authoring parity, but the `@theme` (non-`inline`) runtime-resolution mechanism is a web-Tailwind-v4-specific concern with no RN analogue.
- **The two-tone focus ring** — `outline` + `box-shadow` don't exist in RN; focus visibility on native/mobile is largely irrelevant (touch), but keyboard/switch-control focus needs a bespoke bordered/shadowed component treatment. The *contrast requirement* ports; the *implementation* doesn't.
- **`:focus-visible`, `:hover`, `env(safe-area-inset-*)`, `dvh`/`svh`, `sr-only` clip-rect** — all web CSS. RN equivalents: `react-native-safe-area-context` for insets, `Dimensions`/`useWindowDimensions` (RN already excludes browser chrome so the `vh` problem is moot), `accessibilityElementsHidden`/`accessible`/`accessibilityLabel` for sr-only semantics, capability detection via platform APIs instead of `matchMedia('(pointer: coarse)')`.
- **`tabular-nums`** — web is `font-variant-numeric`; RN is `fontVariant: ['tabular-nums']` (works but font-dependent). Verify Inter ships the feature in the RN bundle.
- **`prefers-reduced-motion`** — RN uses `AccessibilityInfo.isReduceMotionEnabled()` + listener instead of a media query.
- **Fonts** — `next/font` is Next-only. RN needs `expo-font`/native font linking; the Inter + Noto Devanagari fallback *chain* must be re-expressed (RN has no automatic per-codepoint font fallback like the browser — Devanagari fallback needs explicit handling or a font with combined coverage).
- **Container queries** (specced for multi-width components) — no RN equivalent; use `onLayout`-measured width + conditional rendering.
- **Component library** — the doc mandates **Radix primitives + Tailwind (shadcn-owned-in-repo)** for focus trap, dismissal, positioning, ARIA. Radix is web-DOM-only. RN needs a parallel primitive set (react-native-reanimated + a headless RN primitive lib, or hand-built) that re-implements the four ported *contracts* (commit-on-blur `NumberField`/`TextField`, `DataTable` required `caption`, required `ariaLabel`, `useFocusTrap` move-in/wrap/restore) against RN accessibility APIs. The contracts port; the Radix implementation does not.
- **The canvas/touch layer** (`TouchCanvas`, `Loupe`, `GestureLayer`, WebGL) — web pointer-events + WebGL vs RN gesture-handler + a native GL/Skia stack (`react-native-skia`, `react-native-gesture-handler`, `reanimated`). The gesture *vocabulary* (§7.2) and precision techniques (loupe, offset drag, snap-then-nudge) are the shared spec; both platforms implement them natively.
- **The `/design` living reference + Tailwind content-scan dependency** — RN has no purge/content-scan, so the "must use every token on the design page or it's purged" constraint is web-only; RN would keep a Storybook/reference screen for review but not for build correctness.

### Recommended portability architecture
1. **`packages/tokens`** — framework-neutral source of truth (Style Dictionary or TS), emitting `tokens.css` (web) + `theme.ts` (RN) + a JSON contract for design tooling. All contrast ratios live here as verified metadata.
2. **`packages/design-spec`** — the markdown rules (N1–N10, DoD, touch/a11y contracts) as the shared law both apps lint/review against.
3. **`apps/web`** — Tailwind v4 full (`@import "tailwindcss"`, no legacy layer needed), `@theme` non-inline mapping, Radix-based `packages/ui-web`.
4. **`apps/native`** — RN + theme provider consuming the same tokens, `packages/ui-native` re-implementing the four ported component contracts + the canvas gesture vocabulary via Skia/gesture-handler/reanimated.
5. Multi-tenant theming: because everything routes through the semantic layer, per-tenant brand overrides are a single semantic-value swap on both platforms — but the ink-on-brass contrast invariants (N4, §3.2/§3.3) must be re-verified per tenant palette (the current ratios are specific to the brass hue).