> **HISTORICAL EVIDENCE** — its conclusions are already promoted into the authority named below. Cite that, not this file. The canonical brand law is the vendored `design/ds-source/readme.md`, codified in docs/10 §4. This prose copy is a third copy of in-repo truth.

I have everything needed. All three required files read in full, plus verification of the two internal contradictions against the source token files.

---

# HelioGrid Design System — Brand Law & Enforcement Reference

Package: `/Users/devtejas/Downloads/HelioGrid UX/_ds/heliogrid-design-system-c8aa4326-21bf-453a-8d11-749cc81dee12/`
Namespace: `HelioGridDesignSystem_c8aa43` (global `window.HelioGridDesignSystem_c8aa43`)
Product: mobile-first SaaS for Indian solar EPC companies. Mobile **375px** and desktop **1440px** both first-class. Character: "precision instrument, not sales toy." Content is Indian (₹ in Indian grouping `₹4,52,471`, kWp, GST, DISCOM). **No logo exists** — wordmark is plain Geist Bold; do not invent a mark.

---

## 1. THE BRAND LAW (readme.md — verbatim-ish)

### The one governing rule
- **"Hierarchy comes from luminance and softness, never from lines."** Surfaces separate because they are **brighter than the canvas** behind them + carry a **soft, wide, low-opacity shadow**.
- **No 1px grey borders anywhere.** Only two exceptions: (1) file-upload dashed drop zones, (2) an opt-in high-contrast field mode.
- **Depth is blur + desaturation, never dimming.** Overlays **blur the layer behind and fade it toward white; never a dark scrim.**
- **Colour is atmosphere, not decoration** — the brand gradient is "ambient bloom/glow/icon-wash only and never fills a button, row, chip or field."
- **Restraint is the premium signal: two font weights, one accent gesture per screen.**

### Two density modes (same colours, type, rules — only spacing & radius change)
- **Expressive** — mobile, onboarding, auth, dashboards, empty states, marketing. Large radii (cards **24–32px**), generous whitespace, ambient gradient, shadow-heavy elevation.
- **Functional** — data tables, long forms, kanban, inventory, reports, settings, admin. Tight spacing, small radii (cards **12px**), high density — but **still no borders** (rows alternate `#FFFFFF`/`#FAFBFC`), chips stay fully pill, the near-black primary button is unchanged.
- **Default Expressive on mobile, Functional on desktop data screens.**

### Colour law
- Neutrals are **95%** of the product. Canvas is **always slightly grey `#F6F7F9`**; surfaces are **pure white `#FFFFFF`** and float above it.
- Text is **near-black `#0A0A0B` (never pure black)**.
- **Iridescence** = violet `#7B5CFF` → blue `#3B82F6` → magenta `#E85CBE`, appearing **only as gradient/glow/icon-wash/AI cues**.
- **Interactive accent `#5A4BFF`** drives focus rings, links, selected states, active tabs, control fills.
- **Primary action is near-black `#0A0A0B`, never coloured — "the strongest identity marker."** (Brass/gold is never mentioned — there is no brass; the "premium" accent is the near-black button + the iridescent bloom. Do not introduce brass.)
- Semantic colours are **muted, never neon**, and pair with a **tinted background**.
- **"The system is light-only — a light, warm-neutral canvas throughout."**

### Typography law
- **Geist** (fallback Inter/system); **Geist Mono** for IDs, kWh readings, coordinates, invoice numbers.
- **Only 400 and 700 in normal use. 500 allowed for buttons, tabs and table headers only.**
- Headings tightly tracked **−0.02 to −0.03em** — "essential to the look."
- **Overline** uppercase micro-labels: **11px / 700 / 0.12em**, above sections — a signature device ("SITE SURVEY", "SYSTEM CAPACITY").
- All numeric data is **`tabular-nums`**; currency/quantities **right-align** in tables.
- **Sentence case everywhere; uppercase only in the overline style.**

### Spacing & radius law
- **4px base.** Expressive screen padding **20/32px**, cards **20–24px**; Functional **16/24px**, cells **10×12px**.
- Extreme radii are a brand signal in Expressive: cards **24–32px**, sheets/modals **32px top corners**, inputs **14px**.
- **All buttons and chips are fully pill (999px).**
- Feature tiles may use the signature **stadium silhouette `border-radius:999px 999px 32px 32px`** — marketing/discovery only, sparingly.

### Elevation law
- Wide blur, minimal Y-offset, very low opacity — **"shadows felt, not seen."** Scale: `e1` rows → `e2` cards → `e3` hover/dropdown → `e4` popover/nav → `e5` modal/sheet/FAB.
- **Hover raises exactly one step and translates Y by −1px. Never hard, dark or offset-heavy.**

### Cards
- White on grey canvas, **no border**, **24px radius (expressive) / 12px (functional)**, `e2` at rest, `e3` + −1px on hover, **2px accent focus ring** when interactive.
- Signature **circular icon container** — a **6% tint** of a semantic/brand colour — used for list rows, feature cards, status indicators.

### Backgrounds
- Mostly flat canvas grey. Expressive/hero surfaces get an ambient radial brand bloom (`glow-brand`) that **slowly drifts and breathes (8s)**.
- **No repeating patterns, no full-bleed photos.** Site photos masked to **16–24px radius** with a subtle inner top highlight, **never colour-filtered**.

### Motion law
- Durations: **120ms micro / 200ms standard / 320ms emphasised / 500ms ambient.**
- Easings: standard, enter, exit, and a **spring `cubic-bezier(0.34,1.56,0.64,1)`** for sheets, FAB, radial menus.
- Signature motions: background **blurs (0→8px) and fades to 0.35 (never darkens)** when an overlay opens; buttons **scale to 0.97 on press**; cards **fade+rise 8px on mount, staggered 40ms (max 6)**; bottom sheets spring from the edge; skeleton shimmer **1.4s**.
- **Respect `prefers-reduced-motion` (opacity-only, no loops).**

### Hover / press / focus
- Hover = one elevation step up + **−1px**. Ghost hover = **`#F0F1F3`** fill.
- Press = **scale 0.97 (buttons) / 0.94 (icon buttons)**.
- Focus is always a **2px `#5A4BFF` ring at 2px offset, never removed.**

### Borders / transparency / blur
- **No structural borders.** Transparency + **`backdrop-filter: blur(8px)`** reserved for overlay backdrops (fading toward white) and the glass credit chip. Semantic tints are **flat, not translucent**.

### Content fundamentals
- Sentence case, plain, direct, confident, short. **Buttons are verbs** ("Schedule survey", "Approve design", "Mark installed", "Send over WhatsApp") — **never "Submit", "OK" or "Click here".**
- Errors state problem **and** fix, never blame the user, never expose codes to field users. Empty states encouraging, not apologetic.
- Empty-state/onboarding/modal body copy is **centre-aligned in `text-secondary`**; data-context copy is left-aligned. **Max line length ~68 chars** for prose.
- Domain language: kW / kWp / kWh, DC & AC capacity, string, inverter, module, MMS, net metering, subsidy, WCR, commissioning, DISCOM. Numbers always carry units; dates as **"12 Mar 2026"**; currency Indian grouping. **No emoji.**

### Iconography
- **Lucide, outlined, 1.5px stroke, round caps/joins.** 24px default, **20px functional**, **28px bottom nav**.
- **Never mix filled and outlined in one context;** filled variants only for the **active bottom-nav item**.
- Icons in cards/rows sit in the circular icon container (**40px expressive / 32px functional, perfect circle, 6% tint**).
- Brand/AI features use a **gradient-filled object, not an outlined icon.** No icon font, no emoji, no unicode-as-icon. Lucide CDN `https://unpkg.com/lucide@latest`.

### NOVA reference note
- `uploads/Screenshot 2026-07-20 …png` = "NOVA" AI-app reference is **visual-language reference only, not HelioGrid product**: iridescent gradient objects, ambient bloom, floating no-border cards, radial/wheel menu, blurred-not-darkened overlays, raised gradient nav object.

---

## 2. ADHERENCE LINT RULES (`_adherence.oxlintrc.json`)

Oxlint config, plugins `["react","import"]`, all rules at **`"warn"`** severity.

**Global forbidden syntax (`no-restricted-syntax`):**
| What it forbids | Selector (regex) | Message |
|---|---|---|
| **Raw hex colours** | `Literal[value=/#[0-9a-fA-F]{3,8}\b/]` | "Raw hex color — use a design-system color token via var()." |
| **Raw px values** | `Literal[value=/\b\d+px\b/]` | "Raw px value — use a design-system spacing token via var()." |
| **Non-DS fonts** | `font-family:` not starting with `Geist`/`Geist Mono` | "Font not provided by the design system. Available: Geist, Geist Mono." |

Note: it does **not** explicitly forbid `border` properties via a selector — the "no borders" law is enforced by convention/tokens, not by this lint. `react/forbid-elements` is present but with an **empty `forbid: []`** (forbids nothing).

**Import boundary (`no-restricted-imports`):** deep imports into `components/data/**`, `components/feedback/**`, `components/forms/**`, `components/navigation/**`, `ui_kits/desktop/**`, `ui_kits/mobile/**` are forbidden — "Import design-system components from 'index.js', not component internals." Overridden **off** for `**/index.js`.

**Per-component prop allow-lists (unknown-prop rejection) + enum value constraints:**
- **Avatar** props: `src, name, size, style`.
- **Button** props: `children, variant, size, disabled, loading, icon, iconRight, fullWidth, style, onClick`. `variant` ∈ `primary|secondary|ghost|destructive`. `size` ∈ `lg|md|sm`.
- **Card** props: `children, density, interactive, selected, style, onClick`. `density` ∈ `expressive|functional`.
- **Checkbox** props: `checked, onChange, label, disabled, id, style`.
- **Chip** props: `children, active, onClick, dot, tone, density, style`. `tone` ∈ `neutral|success|warning|danger|info|accent`. `density` ∈ `expressive|functional`.
- **EmptyState** props: `icon, title, description, action, glow, style`.
- **IconButton** props: `children, size, label, variant, disabled, style, onClick`. `variant` ∈ `surface|dark|ghost`.
- **Input** props: `label, value, onChange, placeholder, type, density, error, success, helper, disabled, mono, leading, trailing, id, style`. `density` ∈ `expressive|functional`.
- **ListRow** props: `icon, iconColor, avatar, title, subtitle, trailing, density, onClick, style`. `density` ∈ `expressive|functional`.
- **OfflineBanner** props: `count, message, style`.
- **ProgressBar** props: `value, gradient, style`.
- **Radio** props: `checked, onChange, label, name, value, disabled, id, style`.
- **SegmentedOption** props: `value, label`.
- **StatCard** props: `label, value, unit, delta, deltaDir, children, style`. `deltaDir` ∈ `up|down`.
- **StatusChip** props: `status, label, density, style`. `density` ∈ `expressive|functional`.
- **Switch** props: `checked, onChange, label, disabled, id, style`.
- **Tab** props: `value, label`.
- **Toast** props: `tone, title, description, icon, action, style`. `tone` ∈ `success|warning|danger|info|neutral`.

(Each allow-list also implicitly permits `key, ref, className, style, children`.)

---

## 3. MANIFEST (`_ds_manifest.json`) — inventory

**21 components** (`window.HelioGridDesignSystem_c8aa43`), grouped by source path:
- **forms/**: `Button`, `IconButton`, `Input`, `Checkbox`, `Radio`, `Switch`
- **data/**: `Card`, `IconCircle` (both in `Card.jsx`), `Chip`, `Badge` (both in `Chip.jsx`), `Avatar`, `AvatarGroup` (both in `Avatar.jsx`), `ListRow`, `StatCard`, `StatusChip`
- **feedback/**: `EmptyState`, `OfflineBanner`, `ProgressBar`, `Toast`
- **navigation/**: `SegmentedControl`, `Tabs`

Manifest carries **no prop/variant metadata per component** (only `name` + `sourcePath`). The `x-omelette.components` block (in the lint file) lists all 18 top-level components each with `"replaces": []` (no legacy replacements). Prop/variant metadata lives **only in the oxlint selectors** (Section 2). Note `IconCircle`, `Badge`, `AvatarGroup` are exported components but have **no lint prop-guard**.

**Brand-specific additions** (authored to spec, no source codebase): `StatusChip` (maps solar workflow states — lead / survey-scheduled / design-in-progress / approved / installing / commissioned / on-hold — to fixed semantic colours + a **status dot so status is never conveyed by colour alone**), `IconCircle` (circular icon container), `OfflineBanner` (field-app offline queue).

**Starting points / kits:** `ui_kits/desktop/index.html` (1440×900 — sidebar, data table, kanban, KPI row, master-detail) and `ui_kits/mobile/index.html` (375×812 — dashboard, pipeline, lead sheet bottom-sheet, 2-step new-quote flow, empty state, profile). Plus 17 guideline/component `.card.html` specimens. `templates: []`.

**Token values worth quoting (all from `tokens/*.css`):**
- Neutrals: `--canvas #F6F7F9`, `--canvas-sunken #EEF0F3`, `--surface #FFFFFF`, `--surface-alt #FAFBFC`, `--text-primary #0A0A0B`, `--text-secondary #74787E`, `--text-tertiary #A1A5AC`, `--text-disabled #C7CAD0`, `--hairline rgba(10,10,11,0.06)`.
- Iridescence: `--iris-violet #7B5CFF`, `--iris-blue #3B82F6`, `--iris-magenta #E85CBE`, `--gradient-brand linear-gradient(135deg,#7B5CFF 0%,#3B82F6 45%,#E85CBE 100%)`, `--glow-brand radial-gradient(circle,rgba(123,92,255,0.22) 0%,rgba(59,130,246,0.14) 40%,rgba(255,255,255,0) 72%)`.
- Accent: `--accent #5A4BFF`, `--accent-hover #4A3BF0`, `--accent-subtle #EEECFF`.
- Action: `--action-primary #0A0A0B`, `--action-primary-hover #26262A`, `--action-primary-pressed #000000`.
- Semantic (colour + tinted bg): success `#159A5B`/`#E9F7EF`, warning `#E9A23B`/`#FDF4E6`, danger `#E5484D`/`#FDECEC`, info `#3B82F6`/`#EAF2FE`, neutral `#74787E`/`#F0F1F3`.
- Chart 1–8: `#5A4BFF, #3B82F6, #E85CBE, #159A5B, #E9A23B, #7B5CFF, #14B8C4, #A1A5AC`; gridline `#EEF0F3`.
- Type sizes: display 40/44 −0.03em; h1 32/36 −0.025em; h2 24/28 −0.02em; h3 20/22 −0.015em; h4 17/18 −0.01em; body-lg 17/1.55; body 15/1.55; body-sm 13/1.5; caption 12/1.4; overline 11 / 0.12em; button 15 / −0.01em; table 13/1.45. Weights `--fw-regular 400`, `--fw-medium 500`, `--fw-bold 700`. `--font-sans "Geist","Inter",…`, `--font-mono "Geist Mono",…`.
- Spacing (4px base): 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Screen pad mobile/desktop `20/32px`, functional `16/24px`. sidebar `260px`/collapsed `68px`, header `64px`, mobile topbar `56px`, bottomnav `72px`, content-max `1440px`, gutters `16/20/24px`.
- Radius: expressive `--r-xs..2xl 8/12/16/24/32/40`, functional `--rf-xs..xl 4/6/8/12/16`, pill `999px`, card-expressive `24px`, card-functional `12px`, sheet-top `32px`, input-expressive `14px`, input-functional `10px`, feature-tile `999px 999px 32px 32px`.
- Elevation: `e0 none`; `e1 0 1px 2px rgba(16,24,40,0.04)`; `e2 0 2px 8px rgba(16,24,40,0.05)`; `e3 0 8px 24px rgba(16,24,40,0.06)`; `e4 0 16px 48px rgba(16,24,40,0.08)`; `e5 0 24px 72px rgba(16,24,40,0.10)`.
- Fonts: Geist + Geist Mono, weight range `100 900`, variable woff2 in `assets/fonts/`.

---

## 4. CONTRADICTIONS WITHIN THE PACKAGE

1. **"Dark mode" claimed but nonexistent + directly against the light-only law.** readme index (line 72) lists `tokens/colors.css` as "**`colors.css` (+ dark mode)**", yet the actual `tokens/colors.css` (55 lines) has **no dark block** — no `@media (prefers-color-scheme:dark)`, no `[data-theme]`, no dark token set (grep across all of `tokens/` finds none). The only theme selector is `:root[data-mode="expressive"]` (typography sizes). Meanwhile the governing colour law (line 32) states "**The system is light-only.**" So the index annotation "(+ dark mode)" contradicts both the file contents and the stated brand law. The manifest's `themes` array likewise lists only `{":root[data-mode=\"expressive\"]", "Root Expressive"}` — no dark theme.

2. **Manifest motion durations are wrong (snapshotted the reduced-motion values).** The manifest records `--dur-micro/--dur-standard/--dur-emphasised/--dur-ambient` all as **`1ms`**. The real `tokens/motion.css` `:root` values are **120ms / 200ms / 320ms / 500ms**, matching the readme motion law; `1ms` appears **only inside `@media (prefers-reduced-motion:reduce)`**. The manifest captured the accessibility-override values as the canonical durations — contradicting both the source token file and the readme.

3. **Manifest token `kind` annotations are semantically miscategorised.** In `x-omelette.tokenKinds` and the `tokens[]` array, all **font-size** tokens (`--fs-display`, `--fs-h1`, … `--fs-table`) are tagged `kind:"spacing"`; **line-height** tokens (`--lh-body`, etc.) and **tracking** tokens are tagged `kind:"font"`; **text colour** tokens (`--text-primary/secondary/tertiary/disabled`, `--text-body`, `--text-heading`) are tagged `kind:"font"` rather than `color`; and `--r-feature-tile` is tagged `kind:"radius"` while every other radius token is `kind:"spacing"`. Internally inconsistent metadata (harmless to rendering, but wrong for any tooling that trusts `kind`).

4. **Lint bans raw hex/px, but the token CSS is full of raw hex/px.** `_adherence.oxlintrc.json` warns on any `#RRGGBB` literal and any `\d+px` literal. The `tokens/*.css` definitions themselves are entirely raw hex and px. This is by design (lint targets React/JSX consumer code, and `index.js` is exempted from the import rule) — but there is **no scoping in the config excluding `tokens/**` or `.css` files**, so running oxlint over the token sources would flag the design system's own foundation. Worth flagging as a latent inconsistency.

5. **Minor — exported components without guard rails.** `IconCircle`, `Badge`, and `AvatarGroup` are shipped/exported (manifest) but have **no prop allow-list** in the oxlint config, so they are unconstrained relative to their siblings. `SegmentedControl`/`Tabs` are the exported wrappers, but the lint guards only their children `SegmentedOption`/`Tab`.

No brass/gold token or rule exists anywhere in the package — the near-black `#0A0A0B` primary action is the "premium" identity marker; if a task references "brass," treat it as absent from this system.