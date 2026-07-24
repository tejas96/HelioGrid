# HelioGrid Design System

HelioGrid is a mobile-first SaaS platform for solar EPC companies in India — the businesses that sell, design and install rooftop and commercial solar systems. It covers the full sales cycle: capturing leads, assigning them to sales reps, surveying the site on a phone, designing the array, building an itemised quote, and sending the proposal over WhatsApp.

**Users:** sales reps, site surveyors, designers, engineers and business owners — mostly on mid-range Android phones, often on a roof with poor signal. Both **mobile (375px)** and **desktop (1440px)** are first-class.

**Character:** precision instrument, not sales toy. Warm neutrals, a single iridescent brand accent used only as atmosphere, dense data kept calm and readable. Users quote jobs worth ₹5–50 lakh, so the interface must feel trustworthy and exact. Content is Indian: ₹ in Indian format (₹4,52,471), Indian names/cities, kWp system sizes, GST, DISCOM utilities.

## Sources provided
- Brand & design specification (detailed written brief) — the source of truth for every token and rule below.
- `uploads/Screenshot 2026-07-20 at 6.34.12–6.36.52 PM.png` — the "NOVA" AI-app reference screenshots. These are **visual-language reference only** (not HelioGrid product): iridescent gradient objects, ambient bloom, floating no-border cards, radial/wheel menu, blurred-not-darkened overlays, raised gradient nav object.
- `uploads/geist-font-v1.7.2/` — the Geist + Geist Mono webfonts (copied into `assets/fonts/`).

No logo was provided. There is **no HelioGrid logo mark** — the wordmark is rendered in plain Geist Bold (with the iridescent gradient on "Grid" in the thumbnail). Do not invent a mark.

---

## The one governing rule
**Hierarchy comes from luminance and softness, never from lines.** Surfaces separate because they are brighter than the canvas behind them and carry a soft, wide, low-opacity shadow. No 1px grey borders anywhere (the only exceptions: file-upload dashed drop zones, and an opt-in high-contrast field mode). Depth is blur + desaturation, never dimming — overlays blur the layer behind and fade it toward white; **never a dark scrim**. Colour is atmosphere, not decoration — the brand gradient is ambient bloom/glow/icon-wash only and never fills a button, row, chip or field. Restraint is the premium signal: two font weights, one accent gesture per screen.

### Two density modes
Same colours, type and rules — only spacing and radius change.
- **Expressive** — mobile, onboarding, auth, dashboards, empty states, marketing. Large radii (cards 24–32px), generous whitespace, ambient gradient, shadow-heavy elevation.
- **Functional** — data tables, long forms, kanban, inventory, reports, settings, admin. Tight spacing, small radii (cards 12px), high density — but **still no borders** (rows alternate `#FFFFFF`/`#FAFBFC`), chips stay fully pill, the near-black primary button is unchanged.

Default Expressive on mobile, Functional on desktop data screens.

---

## VISUAL FOUNDATIONS

**Colour.** Neutrals are 95% of the product: canvas is always slightly grey (`#F6F7F9`), surfaces are pure white and float above it. Text is near-black `#0A0A0B` (never pure black). The **iridescence** (violet `#7B5CFF` → blue `#3B82F6` → magenta `#E85CBE`) appears only as gradient/glow/icon-wash/AI cues. The **interactive accent** `#5A4BFF` drives focus rings, links, selected states, active tabs and control fills. The **primary action is near-black `#0A0A0B`, never coloured** — the strongest identity marker. Semantic colours are muted, never neon, and pair with a tinted background. The system is **light-only** — a light, warm-neutral canvas throughout.

**Type.** Geist (fallback Inter/system), Geist Mono for IDs, kWh readings, coordinates and invoice numbers. Only **400** and **700** in normal use; **500** allowed for buttons, tabs and table headers only. Headings are tightly tracked (−0.02 to −0.03em) — essential to the look. Overline uppercase micro-labels (11px/700, 0.12em) above sections are a signature device ("SITE SURVEY", "SYSTEM CAPACITY"). All numeric data is `tabular-nums`; currency/quantities right-align in tables. Sentence case everywhere; uppercase only in the overline style.

**Spacing & radius.** 4px base. Expressive screen padding 20/32px, cards 20–24px; Functional 16/24px, cells 10×12px. Extreme radii are a brand signal in Expressive mode: cards 24–32px, sheets/modals 32px top corners, inputs 14px. All buttons and chips are **fully pill (999px)**. Feature tiles may use the signature stadium silhouette `border-radius:999px 999px 32px 32px` — marketing/discovery only, sparingly.

**Elevation.** Wide blur, minimal Y-offset, very low opacity — shadows felt, not seen (`e1` rows → `e2` cards → `e3` hover/dropdown → `e4` popover/nav → `e5` modal/sheet/FAB). Hover raises exactly one step and translates Y by −1px. Never hard, dark or offset-heavy.

**Cards.** White on grey canvas, no border, 24px radius (expressive) / 12px (functional), `e2` at rest, `e3` + −1px on hover, 2px accent focus ring when interactive. Signature **circular icon container** — a 6% tint of a semantic/brand colour — is used for list rows, feature cards and status indicators.

**Backgrounds.** Mostly flat canvas grey. Expressive/hero surfaces get an ambient radial brand bloom (`glow-brand`) that slowly drifts and breathes (8s). No repeating patterns, no full-bleed photos — site photos are masked to 16–24px radius with a subtle inner top highlight, never colour-filtered.

**Motion.** 120ms micro / 200ms standard / 320ms emphasised / 500ms ambient. Easings: standard, enter, exit, and a **spring** `cubic-bezier(0.34,1.56,0.64,1)` for sheets, FAB and radial menus. Signature motions: background blurs (0→8px) and fades to 0.35 (never darkens) when an overlay opens; buttons scale to 0.97 on press; cards fade+rise 8px on mount staggered 40ms (max 6); bottom sheets spring from the edge; skeleton shimmer 1.4s. Respect `prefers-reduced-motion` (opacity-only, no loops).

**Hover / press.** Hover = one elevation step up + −1px. Ghost hover = `#F0F1F3` fill. Press = scale 0.97 (buttons) / 0.94 (icon buttons). Focus is always a 2px `#5A4BFF` ring at 2px offset, never removed.

**Borders / transparency / blur.** No structural borders. Transparency + `backdrop-filter: blur(8px)` is reserved for overlay backdrops (fading toward white) and the glass credit chip. Semantic tints are flat, not translucent.

---

## CONTENT FUNDAMENTALS

Sentence case, plain, direct, confident, short. Buttons are verbs: "Schedule survey", "Approve design", "Mark installed", "Send over WhatsApp" — never "Submit", "OK" or "Click here". Errors state the problem *and* the fix, never blame the user, never expose codes to field users. Empty states are encouraging, not apologetic. Body copy in empty states/onboarding/modals is centre-aligned in `text-secondary`; data-context copy is left-aligned. Max line length ~68 characters for prose.

Use domain language correctly: kW / kWp / kWh, DC & AC capacity, string, inverter, module, MMS, net metering, subsidy, WCR, commissioning, DISCOM. Numbers always carry units; dates display as "12 Mar 2026"; currency in Indian grouping (₹4,52,471). No emoji.

---

## ICONOGRAPHY

**Lucide**, outlined, **1.5px** stroke, round caps and joins. 24px default, 20px in functional density, 28px in bottom nav. Never mix filled and outlined in one context; filled variants only for the active bottom-nav item. Icons in cards/rows/status sit inside the signature **circular icon container** (40px expressive / 32px functional, perfect circle, 6% colour tint).

The UI kits and cards use a small inline set of Lucide-shaped SVGs (1.5 stroke) defined per kit for portability. In production, use the Lucide package or CDN (`https://unpkg.com/lucide@latest`). No icon font, no emoji, no unicode-as-icon. Brand/AI features use a gradient-filled object, not an outlined icon. **No logo asset was provided** — render the wordmark in Geist Bold.

---

## Index / manifest

Root:
- `styles.css` — the single entry point consumers link (imports only).
- `tokens/` — `fonts.css`, `colors.css` (+ dark mode), `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `motion.css`, `base.css`.
- `assets/fonts/` — Geist + Geist Mono webfonts (variable woff2 + static fallbacks).
- `thumbnail.html` — homepage tile. `SKILL.md` — Agent-Skills wrapper. `readme.md` — this file.
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing groups).

### Components (`window.HelioGridDesignSystem_c8aa43`)
- **Forms** (`components/forms/`): `Button`, `IconButton`, `Input`, `Checkbox`, `Radio`, `Switch`
- **Data display** (`components/data/`): `Card`, `IconCircle`, `StatCard`, `StatusChip`, `Chip`, `Badge`, `Avatar`, `AvatarGroup`, `ListRow`
- **Feedback** (`components/feedback/`): `EmptyState`, `ProgressBar`, `OfflineBanner`, `Toast`
- **Navigation** (`components/navigation/`): `SegmentedControl`, `Tabs`

### UI kits
- `ui_kits/mobile/` — HelioGrid field app: dashboard, pipeline, lead-detail bottom sheet, 2-step new-quote flow, empty state, profile.
- `ui_kits/desktop/` — HelioGrid web app: sidebar + header, pipeline data table (selection + bulk bar), kanban, KPI row, master-detail panel.

### Intentional additions
Because no source codebase defined a component inventory, a standard set was authored to the spec. Beyond the generic primitives, two brand-specific components were added: **`StatusChip`** (maps the solar workflow states — lead / survey-scheduled / design-in-progress / approved / installing / commissioned / on-hold — to fixed semantic colours + a status dot, so status is never conveyed by colour alone) and **`IconCircle`** / **`OfflineBanner`** (the signature circular icon container and the field-app offline queue banner).

## Caveats
- Component cards and UI kits render against the compiled `_ds_bundle.js`, which is generated at the end of a turn — they appear blank until compilation completes.
- No logo was provided; the wordmark stands in for a mark everywhere.
