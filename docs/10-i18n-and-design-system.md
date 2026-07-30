# 10 — i18n & Design System

Binding law for every pixel and every string in HelioGrid. The visual system is the
**vendored HelioGrid UX design-system package** at `design/ds-source/` — light, warm-neutral,
Geist, near-black actions, iridescent atmosphere. i18n is **Lingui v5**, one catalog,
EN/HI/MR, per-user language.

Sources: [./research/ds-tokens.md](./research/ds-tokens.md) (complete token census) ·
[./research/ds-brand-law.md](./research/ds-brand-law.md) (brand law, lint rules, component
inventory) · [./research/ds-usage.md](./research/ds-usage.md) (how the 80 mockups consume
the system) · [./research/ds-reconciliation.md](./research/ds-reconciliation.md) (the
22-point conflict list — its resolutions are binding) · owner rulings A–E of 2026-07-24
(final; restated inline where they apply).

---

## 1. Canon statement

**`design/ds-source/` is the pixel-perfect source of truth.** It is the UX package vendored
into this repo: `tokens/*.css` (fonts, colors, typography, spacing, radius, elevation,
motion, base), `readme.md` (the brand law), `_adherence.oxlintrc.json` (rule intents +
component prop allowlists), the 21-component manifest, and the two Geist variable woff2
files. Every visual fact in this document is an extraction from that package; where any
doc and the vendored CSS disagree, **the CSS wins**.

- `docs/research/ds-*.md` are the reference extraction of that package — read them instead
  of re-deriving values, but they are downstream of the source.
- **The POC's `DESIGN-SYSTEM.md` is superseded for all visuals** (ruling E). "Instrument"
  graphite+brass is retired as the product's identity — there is no brass token, no ink-on-
  brass rule, no `text-accent-text`, no dark-canvas doctrine. Its surviving
  interaction/a11y/product-law contracts — **N1–N10 and the touch contract — are now
  defined in §11 of this document**, promoted verbatim 2026-07-30. Cite §11, never the POC
  file or `docs/research/design.md`.
- `_ds_manifest.json` is inventory only — **never a source of values** (it snapshotted the
  1ms reduced-motion durations as canonical and miscategorises token kinds).

---

## 2. Token pipeline — `packages/tokens` GENERATES from the vendored CSS

The build **parses `design/ds-source/tokens/*.css`** as source of truth and emits:

```
packages/tokens/
  build.ts        # CSS parser + generators + contrast verifier
  dist/           # GENERATED, never committed, never hand-edited
    tokens.css    # web: the ds-source custom properties, near-verbatim
    theme.ts      # RN: typed theme object with the SAME names (px → dp)
    tokens.json   # flat resolved contract for /design, PDF templates, tooling
```

- **Never hand-transcribe.** The package's own manifest proves re-transcription drifts
  (1ms durations, phantom dark mode, wrong `kind` tags). The vendored CSS is parsed
  mechanically; token names survive **verbatim** (`--sp-*`, `--fs-*`, `--e0–e5`,
  `--r-*`/`--rf-*`, `--dur-*`/`--ease-*`, `--chart-1..8`, the semantic aliases
  `--bg-page`/`--surface-card`/`--text-body`/`--link`/`--focus-ring`) because the mockups
  reference them — renaming breaks pixel-perfect traceability.
- The semantic-alias indirection layer is kept intact: it is the drop-in point for a
  future dark value set (§5).
- Turborepo `dependsOn` makes `apps/web`, `apps/mobile` and `apps/worker` build after
  tokens — no app ships against a stale `dist/`.

**Marked EXTENSIONS applied at generation** (each emitted under an explicit
`/* @heliogrid-extension */` marker so ds-source diffs stay clean):

1. **Noto Sans Devanagari `@font-face`** + the fallback chain appended to `--font-sans`
   (Geist has zero Devanagari coverage — §7.5).
2. **`--fw-semibold: 600`** — sanctioned by ruling D. The mockups use weight 600 ×210 on
   dense desktop screens; the shipped weight set is **400 / 500 / 600 / 700**.
3. **`--brand-wash`** — promotes the recurring hand-mixed violet washes in the mockups
   (`#F4F1FF`, `#FCFBFF`, `#FBFAFF`, and the hero gradient
   `linear-gradient(180deg,#F4F1FF 0%,#FCFBFF 78%)`) into proper tokens; they are the one
   recurring off-token colour in usage.
4. **Studio data-viz namespaces** — `--data-roof-1…8` (categorical, roof identity),
   `--data-string-1…12` (categorical, electrical strings), `--data-scale-0…10`
   (sequential, irradiance/solar access). These are a genuine gap in the UX package,
   **authored new and harmonised with `--chart-1..8`**; requirements carried as metadata:
   deuteranopia-distinguishable within each categorical set, and every data-colour
   encoding pairs with a non-colour channel (label, pattern or position). UI colour ≠ data
   colour remains law: never style a button with a data colour; never chart with
   `--accent` or `--action-primary`.
5. **`contrast.pairs.json` regenerated from ds values** with the restricted-role
   annotations of ruling C baked in (§3.2). The build recomputes WCAG ratios from resolved
   values and **fails below floor** — contrast is computed, never eyeballed.

---

## 3. The visual system (exact values from the census)

### 3.1 Fonts

- **Geist** (variable woff2, weight `100 900`, `font-display:swap`) — default sans.
- **Geist Mono** (variable woff2, `100 900`, swap) — for **IDs, kWh readings, ₹ amounts,
  coordinates, invoice numbers, phone numbers**. The mono-for-numerics rule is one of the
  strongest visual signatures (564 mono uses in the mockups); numeric data is
  `tabular-nums` (set globally on `body`) and currency/quantities **right-align** in tables.
- Stacks: `--font-sans:"Geist","Inter",-apple-system,system-ui,sans-serif` (extended with
  Noto Sans Devanagari at generation) · `--font-mono:"Geist Mono",ui-monospace,
  SFMono-Regular,Menlo,monospace`.
- Weights: `--fw-regular:400` · `--fw-medium:500` · `--fw-semibold:600` (extension,
  ruling D) · `--fw-bold:700`. The readme's "500 restricted to buttons/tabs/table-headers"
  clause is dead — usage overrules it (500 ×1213 across the mockups).

### 3.2 Colour

Surfaces / neutrals · text · lines:

| Token | Value | | Token | Value |
|---|---|---|---|---|
| `--canvas` | `#F6F7F9` | | `--text-primary` | `#0A0A0B` (near-black, never pure black) |
| `--canvas-sunken` | `#EEF0F3` | | `--text-secondary` | `#74787E` |
| `--surface` | `#FFFFFF` | | `--text-tertiary` | `#A1A5AC` — **restricted, see below** |
| `--surface-alt` | `#FAFBFC` | | `--text-disabled` | `#C7CAD0` |
| `--hairline` | `rgba(10,10,11,0.06)` | | `--chart-gridline` | `#EEF0F3` |

**No structural 1px borders anywhere** — `--hairline` is the only line, and hierarchy
comes from luminance + shadow (§4). Table rows alternate `#FFFFFF`/`#FAFBFC`.

Two separate accent systems — never conflated:

| System | Tokens | Role |
|---|---|---|
| **Interactive accent** | `--accent #5A4BFF` · `--accent-hover #4A3BF0` · `--accent-subtle #EEECFF` | focus rings, links, selected states, active tabs, control fills — **never a button fill**. `#5A4BFF` on white ≈ 5.4:1, so it works as link text directly |
| **Iridescent trio** | `--iris-violet #7B5CFF` · `--iris-blue #3B82F6` · `--iris-magenta #E85CBE` | atmosphere only — gradient / glow / icon-wash / AI cues |
| **Actions** | `--action-primary #0A0A0B` · hover `#26262A` · pressed `#000000` | the primary button. **Near-black, never coloured — the strongest identity marker** |

Gradients (exact stops):
`--gradient-brand: linear-gradient(135deg,#7B5CFF 0%,#3B82F6 45%,#E85CBE 100%)` ·
`--glow-brand: radial-gradient(circle,rgba(123,92,255,0.22) 0%,rgba(59,130,246,0.14) 40%,rgba(255,255,255,0) 72%)`.

Status (muted FG always paired with tinted BG):

| Tone | FG | BG |
|---|---|---|
| success | `#159A5B` | `#E9F7EF` |
| warning | `#E9A23B` | `#FDF4E6` |
| danger | `#E5484D` | `#FDECEC` |
| info | `#3B82F6` | `#EAF2FE` |
| neutral | `#74787E` | `#F0F1F3` |

Chart palette (ordered, colourblind-safe, sampled from the iridescence):
`--chart-1 #5A4BFF` · `--chart-2 #3B82F6` · `--chart-3 #E85CBE` · `--chart-4 #159A5B` ·
`--chart-5 #E9A23B` · `--chart-6 #7B5CFF` · `--chart-7 #14B8C4` · `--chart-8 #A1A5AC` ·
gridline `#EEF0F3`.

**Restricted roles (ruling C — exact hex kept, roles constrained; annotations live in
`contrast.pairs.json`):**

- `--text-tertiary #A1A5AC` (≈2.5:1 on white) — **decorative/timestamps only, never
  load-bearing text**. Meaning-bearing overlines use `--text-secondary`, not tertiary.
- `--warning #E9A23B` (≈2.2:1 as bare text) — **always on its `--warning-bg #FDF4E6` chip,
  never bare foreground text**.
- `--text-secondary #74787E` is borderline (≈4.45:1 on white) — annotated in the pairs
  file; body text on `--surface` is `--text-primary`.

### 3.3 Type scale

| Role | Size / line-height | Tracking |
|---|---|---|
| Display | 40px / 44px | −0.03em |
| H1 | 32px / 36px | −0.025em |
| H2 | 24px / 28px | −0.02em |
| H3 | 20px / 22px | −0.015em |
| H4 | 17px / 18px | −0.01em |
| Body large | 17px / 1.55 | — |
| **Body** | **15px** / 1.55 | — |
| Body small | 13px / 1.5 | — |
| Caption | 12px / 1.4 | — |
| **Overline** | **11px** / — | **0.12em, weight 700, UPPERCASE** |
| Button | 15px / — | −0.01em |
| Table | 13px / 1.45 | — |

- Headings are **tightly tracked (−0.01 to −0.03em) — essential to the look**. Body roles
  use unitless 1.4–1.55 line-heights, no tracking. Sentence case everywhere; uppercase
  only in the overline style.
- **The overline is a NAMED EXCEPTION to the 12px floor (ruling B)**: 11px/700/0.12em/
  uppercase **micro-labels only** ("SITE SURVEY", "SYSTEM CAPACITY") — never body, data
  or interactive text. The 12px floor stands everywhere else.

### 3.4 Spacing & layout constants

4px base: `--sp-0..24` = 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px
(`--sp-0-5` is the 2px fractional step).

Layout: `--sidebar-w 260px` / collapsed `68px` · `--header-h 64px` ·
`--topbar-h-mobile 56px` · `--bottomnav-h 72px` · `--content-max 1440px` ·
screen padding **20/32px** (expressive mobile/desktop), **16/24px** (functional) ·
gutters 16/20/24px (mobile/tablet/desktop).

### 3.5 Radius — dual scales

| Expressive | Functional | Assignments |
|---|---|---|
| `--r-xs..2xl` = 8/12/16/24/32/40 | `--rf-xs..xl` = 4/6/8/12/16 | `--r-pill 999px` — **all buttons and chips are fully pill** |
| | | cards **24px** expressive / **12px** functional |
| | | sheets/modals `--r-sheet-top 32px` top corners |
| | | inputs 14px expressive / 10px functional |
| | | feature tile `999px 999px 32px 32px` (stadium silhouette — marketing/discovery only, sparingly) |

### 3.6 Elevation — "shadows felt, not seen"

`--e0 none` · `--e1 0 1px 2px rgba(16,24,40,0.04)` · `--e2 0 2px 8px rgba(16,24,40,0.05)`
· `--e3 0 8px 24px rgba(16,24,40,0.06)` · `--e4 0 16px 48px rgba(16,24,40,0.08)` ·
`--e5 0 24px 72px rgba(16,24,40,0.10)`.

Assignment: rows e1 → cards e2 → hover/dropdown e3 → popover/nav e4 → modal/sheet/FAB e5.
**Hover raises exactly one step and translates Y by −1px.** Never hard, dark or
offset-heavy.

### 3.7 Motion

Durations `--dur-micro 120ms` / `--dur-standard 200ms` / `--dur-emphasised 320ms` /
`--dur-ambient 500ms`. Easings: standard `cubic-bezier(0.4,0,0.2,1)`, enter
`cubic-bezier(0,0,0.2,1)`, exit `cubic-bezier(0.4,0,1,1)`, **spring
`cubic-bezier(0.34,1.56,0.64,1)`** (sheets, FAB, radial menus, segmented controls).

Signature motions: buttons **scale 0.97 on press** (icon buttons 0.94); cards fade+rise
8px on mount, **staggered 40ms, max 6**; skeleton shimmer **1.4s**; hero bloom breathes 8s.
`prefers-reduced-motion` collapses all four durations to **1ms** (opacity-only, no loops).

---

## 4. Brand law (binding, from ds-source `readme.md`)

- **Neutrals are the product (95%). Iridescence is atmosphere only** — gradient, glow,
  icon-wash, AI cues; it never fills a button, row, chip or field. Brand/AI features use a
  gradient-filled object, not an outlined icon.
- **The primary action is near-black `#0A0A0B`, never coloured.** Restraint is the
  premium signal: minimal weights, one accent gesture per screen.
- **Hierarchy comes from luminance and softness, never from lines.** Surfaces separate by
  being brighter than the canvas plus a soft wide low-opacity shadow. No 1px grey borders
  anywhere. Exceptions: dashed file-upload drop zones, and an **opt-in high-contrast field
  mode** (the sanctioned escape hatch — a good fit for sunlight visibility on site).
- **Overlays blur (0→8px) the layer behind and fade it toward white (0.35) — never a dark
  scrim.** `backdrop-filter: blur(8px)` is reserved for overlay backdrops and the glass
  credit chip; semantic tints are flat, not translucent.
- **Focus is always a single 2px `#5A4BFF` ring at 2px offset, never removed**
  (`:focus-visible` global in `base.css`). Inputs are borderless (`--e1` at rest) and
  focus via the elevation treatment: `--e2, 0 0 0 2px var(--surface), 0 0 0 4px
  var(--accent)` — no border appears; error state is an inset `1.5px --danger` ring.
- **Density: Expressive vs Functional** — same colours, type and rules; only spacing and
  radius change. Expressive = mobile, onboarding, dashboards, empty states; Functional =
  data tables, long forms, kanban, settings, admin. Default Expressive on mobile,
  Functional on desktop data screens. **Implemented as the component-level `density`
  prop** (what the ds components and lint allowlists actually specify) — the
  `:root[data-mode]` selector in ds-source is a no-op placeholder and is not our mechanism.
- **Iconography: Lucide, outlined, 1.5px stroke, round caps/joins.** 24px default, 20px
  functional, 28px bottom nav. Icons in cards/rows sit in the **circular icon container:
  40px expressive / 32px functional, perfect circle, 6% colour tint**
  (`color-mix(in srgb, {color} 6%, white)`). Never mix filled and outlined in one context;
  filled variants only for the active bottom-nav item. Bundle Lucide locally — the CDN
  reference is mockup-only. No icon font, no emoji, no unicode-as-icon.
- **No logo exists — the wordmark is plain Geist Bold. Do not invent a mark.**
- Content: sentence case, plain, direct, short. Buttons are verbs ("Schedule survey",
  "Send over WhatsApp") — never "Submit", "OK", "Click here". Errors state problem and
  fix. Dates as "12 Mar 2026"; numbers always carry units; ~68-char max line length for
  prose. No emoji.
- Photos masked to 16–24px radius, never colour-filtered; no repeating patterns, no
  full-bleed photos.

---

## 5. Light-only (owner ruling A, final)

**v1 is LIGHT-ONLY.** The ds-source system is light-only by law ("The system is
light-only") and by fact (zero dark tokens; `base.css` sets `color-scheme:light`; the
readme's "colors.css (+ dark mode)" index line is false). "Light AND dark correct" is
**struck from the Definition of Done**.

- **The old "studio canvas stays dark" doctrine is dead.** The mockups show a light
  studio: DesignStudio's workspace is `--canvas #F6F7F9` / `--canvas-sunken #EEF0F3` wells
  with white panels. No theme-invariant dark canvas, no `--text-on-canvas` chrome set.
- **What stays open for dark later:** the semantic-alias indirection
  (`--bg-page`, `--surface-card`, `--text-body`, `--link`, `--focus-ring` → raw tokens) is
  kept in the generated output, and components consume aliases where they exist, so a dark
  value set is a later **value-set drop into the alias layer** — no component rewrite. No
  dark values are invented in the meantime; if dark is commissioned, the value set comes
  from the UX side and enters through the §2 pipeline as a marked extension.

---

## 6. Component API — `packages/ui`

**The 21-component ds-source inventory + its prop enums are the public API of
`packages/ui`.** The JSX library in the package is spec to implement, not code to import
(the mockups themselves consume only `Button`; everything else is hand-rolled to spec).
Radix primitives sit underneath for a11y plumbing (focus trap, dismissal, positioning,
ARIA); the visual layer is pure token-driven styling.

Inventory (manifest): **forms/** `Button, IconButton, Input, Checkbox, Radio, Switch` ·
**data/** `Card, IconCircle, Chip, Badge, Avatar, AvatarGroup, ListRow, StatCard,
StatusChip` · **feedback/** `EmptyState, OfflineBanner, ProgressBar, Toast` ·
**navigation/** `SegmentedControl, Tabs`.

Prop enums (from the oxlint allowlists — these are the contract):

- `Button`: `variant primary|secondary|ghost|destructive` · `size lg(48px)|md(40px)|sm(32px)`
  · pill, weight 500, −0.01em, `minHeight:44`. **Mockup bug: `variant="danger"` (×1) does
  not exist — canonical is `destructive`** (the bundle silently fell back to primary).
- `Card`: `density expressive|functional`, `interactive`, `selected` (= `--e2, 0 0 0 2px
  var(--accent)`).
- `Chip`: `tone neutral|success|warning|danger|info|accent`, `dot`, `active` (active =
  `--action-primary` fill + white text), `density`.
- `Input`: `density`, `error`, `success`, `helper`, `mono` (→ `--font-mono`), `leading`,
  `trailing` — borderless focus spec per §4.
- `StatusChip`: `status lead|survey-scheduled|design-in-progress|approved|installing|
  commissioned|on-hold` — the domain status→semantic-colour map, pill + 6px dot; **status
  is never conveyed by colour alone — always label + dot**.
- `IconButton`: `variant surface|dark|ghost`, `minWidth/Height:44`, press scale 0.94.
- `StatCard`: overline → 32px/700/−0.025em tabular value → delta pill (`deltaDir up|down`).
- `Toast`: `tone success|warning|danger|info|neutral`. `ProgressBar`: `gradient` bool
  (`--gradient-brand` for AI/long ops only). Full APIs in ds-brand-law.md §2.

**The four behavioural contracts** (product law, layered on top — ds-source has no
NumberField, so the contract fills a gap; both platforms, RN natively):

1. **`NumberField` commits on blur** (explicit Done/Cancel on mobile keyboards) — never on
   keystroke. Numeric entry is the always-available precise path beside every gesture.
2. **`DataTable` requires a `caption`** (`sr-only` web; `accessibilityLabel` RN). The BOM
   and quote are commercial documents — no anonymous tables.
3. **`ariaLabel`/`accessibilityLabel` is a required prop** on every icon-only control —
   a missing label is a compile error, not a lint warning.
4. **Focus management: move-in / wrap / restore** — web via Radix; RN via
   `accessibilityViewIsModal` / focus restore on dismiss, with a bespoke ≥3:1 focus
   treatment for keyboard/switch-control (the single web ring is `outline`-based and does
   not exist on RN).

**RN implementation notes:** same API, native implementation (`apps/mobile/src/ui`,
consuming `theme.ts`). ds-source ships **only the variable woff2s** — RN needs **static
Geist and Geist Mono instances cut at 400/500/600/700** (synthetic bolding is banned).
Safe-area via `react-native-safe-area-context`; reduced motion via
`AccessibilityInfo.isReduceMotionEnabled()`; `tabular-nums` via
`fontVariant:['tabular-nums']` — verify rendered output, not config.

`/design` (`apps/web/app/design`) remains the living reference and the Tailwind
content-scan surface: generated from `dist/tokens.json`, it renders every token and every
component state — a new token appears automatically and an unrendered token is impossible.
"Add a token → it renders at `/design` or nobody can verify it" carries over as law.

---

## 7. i18n architecture — Lingui v5, one catalog

Selected over Paraglide (no first-class RN), i18next (runtime-heavy) and FormatJS (weak RN
DX) — see [./research/tooling.md](./research/tooling.md); Lingui v5 is the only
compile-time option covering Next.js App Router **and** bare RN from one catalog.

### 7.1 Catalog structure — `packages/i18n`

```
packages/i18n/
  lingui.config.ts        # locales: ['en','hi','mr'], sourceLocale 'en', format 'po'
  locales/{en,hi,mr}/messages.po   # source of truth is runtime <Trans id="..."> in app code (macros banned)
  src/index.ts            # i18n instance factory, locale constants, loadCatalog()
```

- One catalog package, two consumers. Catalogs compile to per-locale `messages.ts`
  (tree-shaken, ICU compiled away — no runtime parser).
- Message IDs are the natural-language English source with generated hashes; explicit
  `id=` only for genuinely ambiguous short strings.
- Hygiene (binding): no sentence concatenation; ICU plurals/selects; named placeholders
  (`{customerName}`), never positional. Voice-agent and WhatsApp templates are tenant
  **data** in all three languages, not catalog messages.

### 7.2 Extraction workflow

`pnpm i18n:extract` across apps/web, apps/mobile, packages/ui; `pnpm i18n:compile
--typescript` in the Turborepo graph before app builds. CI runs `extract` and fails if the
working tree changes — unextracted messages never merge. Missing translations fall back to
English at runtime (never a bare key, never a crash); untranslated counts per locale are
reported in CI but do not block a merge.

### 7.3 Web (Next.js App Router + RSC)

Per-request `setupI18n()` on the server keyed by the resolved locale; server components
read the request-scoped instance; `<LinguiClientProvider>` hands the serialised catalog to
client components. Locale resolution: **user profile setting (per-USER, not per-tenant)**
→ session cookie mirror (first SSR paint) → `en`. Switching language re-renders the whole
app immediately — no reload. A Marathi surveyor and an English owner coexist in one tenant.

### 7.4 Bare RN (Metro transformer)

`@lingui/metro-transformer` (`babelTransformerPath` + `po`/`pot` in `sourceExts`) —
catalogs import directly. **Intl polyfills required on Hermes**: `@formatjs/intl-locale` +
`@formatjs/intl-pluralrules`, imported once at app entry. Language switch updates the
shared i18n instance; the RN provider re-renders identically to web.

### 7.5 Devanagari typography

- **Geist has ZERO Devanagari coverage. Font chain: Geist → Noto Sans Devanagari.** The
  mockups render Hindi/Marathi via OS fallback (Kohinoor/Nirmala) — that is a gap, not a
  decision; system-font fallback is unacceptable for a pixel-perfect product.
- **Web**: both families via `next/font`, composed into `--font-sans`; the browser reaches
  Noto per-codepoint automatically. The Hindi render check (§10) is still mandatory —
  automatic fallback hides weight mismatches.
- **RN has no per-codepoint fallback to bundled fonts — explicit handling is mandatory.**
  The shared `<AppText>` primitive (the only text component screens may use) detects
  Devanagari codepoints (U+0900–U+097F) and applies the Noto family to those runs;
  mixed-script strings render as nested spans. Verify rendered output on both simulators.
- **Weight mapping**: bundle both families at the four sanctioned weights
  (`Geist` + `NotoSansDevanagari` Regular/Medium/SemiBold/Bold = 400/500/600/700) and map
  them in the theme. RN synthetic bolding is banned.
- **Layouts must survive ~20–30% Hindi/Marathi expansion**: no fixed-width labels, no
  truncation of amounts or units, buttons size to content.

### 7.6 Formatting law

- **Money: one function, everywhere.** `formatInr()` from `packages/domain` renders Indian
  grouping — `₹4,52,471`, compact `₹92L`, `₹1.4 Cr` — in **every locale**, web, mobile,
  PDFs and voice-agent text alike. Never raw `Intl.NumberFormat` for currency. Money
  strings also obey provenance and never-stale rendering. ₹ amounts render in
  **Geist Mono, tabular, right-aligned** in tables (§3.1).
- **Units are never translated**: kW, kWh, kWp, brand/model names, DISCOM names stay as-is
  in all locales; value+unit is unbreakable. m/ft follows user preference — **except
  procurement quantities, which stay metric**.
- **Digits are always Latin 0-9** — never Devanagari numerals, in any locale, including
  documents.
- Non-money numbers via `i18n.number()`; dates via `i18n.date()` ("12 Mar 2026" style);
  default timezone Asia/Kolkata per tenant. No hand-rolled date strings.

### 7.7 Adding a language — the playbook

1. Add locale to `lingui.config.ts`; `pnpm i18n:extract` → new `.po`.
2. Translate (English fallback covers gaps; CI reports the count).
3. **Font check**: does the script render in the Geist → Noto chain? New script (Tamil,
   Telugu…) ⇒ add that Noto family at the four weights, extend the web chain and the
   `<AppText>` script-detection map. Verify on device.
4. **Number/date review**: `formatInr()` unchanged by design; verify ICU plural rules
   exist for the locale (Hermes polyfill coverage).
5. Extend the locale enum in `packages/contracts` and the profile switcher.
6. **Expansion check** on the five densest screens (BOM, quote, proposal builder, lead
   list, studio panels).
7. Ship. No token change, no component change, no schema migration beyond the enum.

---

## 8. Adherence & lint

Adopt the `_adherence.oxlintrc.json` rule **INTENTS at error severity in our own
toolchain** — not the config as-is (it is warn-only, unscoped, guards only 18 of 21
components, and would flag the design system's own token files):

| Intent (from ds-source) | Our enforcement |
|---|---|
| No raw hex colours in component code | **gated** — `scripts/check-adherence.sh` fails `pnpm lint`; tokens are the only colour source |
| No deep component imports | **gated** — dependency-cruiser `package-index-only` |
| Unknown props rejected per component | **typed** — the §6 prop enums make violations compile errors, which is stronger than the lint rule ds-source shipped |
| No raw px values in component code | **reviewed, not gated** — unlike hex, "arbitrary px" has no syntactic tell: spacing, border and icon sizes are legitimately numeric, so a grep is mostly false positives. `ux-lens` checks it against the mockup. |
| No non-Geist `font-family` | **reviewed, not gated** — every current declaration is either `inherit` or a theme lookup (`familyFor()`, `fam.sans`), so a gate today would be 100% exemptions and would catch nothing. Revisit if a raw family ever appears. |

Implementation note (2026-07-30): oxlint was installed to carry the hex and px rules and
**removed** — it implements only a subset of ESLint rules and has no `no-restricted-syntax`.
Three greps in `scripts/check-adherence.sh` cover what is gateable. Kept from the repo plan:
**dependency-cruiser** boundaries and the **contrast build gate** (§2.5) — the tokens
build fails on any declared pair below floor, with ruling C's restricted-role annotations
as the pairs metadata. `/design` renders every token as the human verification surface.

---

## 9. Per-tenant branding — customer documents ONLY (scope unchanged)

Tenants brand what their **customers** see; they never restyle the app.

- **In scope**: the proposal PDF (Playwright/Chromium render in `apps/worker`) and the
  tokenised customer-link pages. Tenant supplies logo + primary brand colour on the tenant
  record; document templates map them into a document-scoped semantic layer
  (`--doc-accent`, `--doc-accent-text`, …) generated per render.
- **Out of scope, permanently**: **the operator app (web and mobile) is the ds-source
  system for every tenant.** No tenant CSS, no theme upload, no per-tenant app palette.
  Every screenshot, support session and training video stays identical across tenants.
- **Contrast re-verification is mandatory**: on palette save, the same contrast engine
  that gates the tokens build runs against the tenant colour; label colour on tenant-accent
  fills is chosen by computation (near-black or white, whichever clears 4.5:1) and the
  derived `-text` shade is adjusted along the tenant hue until it clears 4.5:1 on the
  document surface. Palettes are never rejected — compliant shades are derived and
  previewed live. Data colours are never tenant-overridable: roof/string/irradiance hues
  carry engineering meaning.

---

## 10. Definition of Done (per screen — updated)

A screen violating any single item is not done:

1. Works at **375px and 1536px** with no horizontal scroll (wide tables become card list +
   edit sheet; drawings scroll inside their own container).
2. All four states: loading / empty / error / offline.
3. **Keyboard-operable, visible focus** — the single 2px `#5A4BFF` ring at 2px offset,
   never removed; inputs use the elevation focus treatment.
4. **axe clean, contrast verified against the regenerated `contrast.pairs.json`** —
   including the restricted roles: no load-bearing `--text-tertiary`, no bare `--warning`
   text.
5. Every target **≥44×44 CSS px**.
6. **LIGHT theme correct.** (Dark is struck from the DoD per ruling A.)
7. **Rendered in Hindi and checked** (§7.5) — layout survives Devanagari and expansion.
8. Every user-visible number carries its **provenance tier**
   (measured/derived/estimated/assumed).
9. **Density correct for the surface** — Expressive on mobile/dashboards/onboarding,
   Functional on desktop data screens; radii, padding and icon sizes from the correct
   token family.
10. Zero raw hex, zero off-scale spacing, zero inline style values outside tokens.
11. Tested at **realistic volume** (200-lead list, 40-line BOM, 221-panel design).
12. Wired into the flows that reach it — no orphan screens.

This applies unreduced to the 3D studio: it is the flagship, it is **light** (§5), and
full parity at 375px is the hardest and least negotiable commitment in the system.

---

## 11. Interaction & accessibility law (N1–N10 + the touch contract)

> Promoted verbatim 2026-07-30 from the POC design brief. The "Instrument" graphite+brass
> VISUAL identity that accompanied these rules is **retired** (ruling E) — every visual value
> now comes from `design/ds-source` via `packages/tokens`, per §1–§5 above. **These
> interaction and accessibility contracts survive unchanged as product law.** They are cited
> by number from docs/13, docs/15 R18/R19-B and this document, so the numbering is fixed:
> never renumber, never reword an N-rule.

### The 10 hard rules (N1–N10) — a screen that violates one "is not done"

- **N1 — No hover-only affordance may carry meaning.** Every icon-only control has a visible label or a persistent text alternative within one tap. (The predecessor UI used 56 `data-tip` + 68 `title` as the *only* labels.)
- **N2 — Every interactive target ≥ 44×44 CSS px** on touch pointers. Visual size may be smaller; hit area may not. (WCAG 2.5.8 / Apple HIG.)
- **N3 — No font size below 12px, ever. 14px is body.** (The predecessor UI shipped 23 sizes, nine below 11px.) **Named exception:** the signature overline — 11px / 700 / uppercase / 0.12em — micro-labels only (docs/15 R19-B).
- **N4 — Text contrast ≥ 4.5:1; UI/graphic boundaries ≥ 3:1 — verified, not eyeballed.** Enforced by the `DECLARED_PAIRS` build gate in `packages/tokens`, with the restricted roles of ruling C encoded (§3.2).
- **N5 — Every control has an accessible name; modals trap + restore focus.** Ported from the tested a11y layer — do not regress.
- **N6 — UI colour and DATA colour are separate systems.** Never style a button with a data colour or a chart series with `--accent`. (Roof identity, string colours and solar-access heatmaps encode meaning by hue.)
- **N7 — Every number the user sees carries a provenance tier** — measured / derived / estimated / assumed. The BOM and quote are commercial documents. (Tier definitions are canonical in docs/15 R18; no screen invents a fifth tier.)
- **N8 — Destructive/irreversible actions are confirmed and undoable; undo reachable by thumb on mobile.**
- **N9 — No layout tuned to a fixed viewport.** No magic pixel offsets assuming a height.
- **N10 — Loading, empty, error and offline states are part of "done."** All four required; no `null`-until-hydration blank first paint.

### Mobile / touch contract — not optional reading

- **Build for pointer events, branch on capability** (`pointer: coarse` / `hover: hover`), **never on screen width.**
- **One canvas gesture vocabulary** across satellite canvas, layout editor and 3D scene: 1-finger drag = pan, pinch = zoom, 2-finger rotate, tap = select, long-press 350ms = contextual, drag selected = move with snap, 2-finger tap = undo. **Never** require wheel, middle-click or keyboard to reach a function.
- **Precision under fingertip**: loupe on long-press/drag, offset dragging (point above contact), snap-first-then-nudge, numeric entry always available as the accessible and precise path, explicit Done/Cancel commit.
- **Reachability**: primary actions in the bottom third; destructive never adjacent to primary; undo persistently reachable while any canvas tool is active.
- **Viewport**: `dvh`/`svh` only, never `vh`. Respect `env(safe-area-inset-*)` on all fixed chrome. Mobile inputs ≥16px, or iOS zooms on focus.

The per-screen Definition of Done in §10 is the operational form of these rules and is the
list to check against; it supersedes the POC's own DoD (which still required dark mode).
