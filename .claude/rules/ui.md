# Rules — packages/ui, apps/web (canonical DS: `design/ds-source`)

The vendored UX package `design/ds-source/` (tokens/*.css, readme.md brand law,
`_adherence.oxlintrc.json`, 21-component manifest, Geist fonts) is the ONLY source of
visual truth. `packages/tokens` is GENERATED from it — never re-transcribed by hand, and
never read from `_ds_manifest.json` (it snapshotted the 1ms reduced-motion durations and
miscategorised token kinds; `tokens/*.css` is the truth).
Ground truth + rulings: `docs/10-i18n-and-design-system.md` and `docs/research/ds-*.md`
(the reconciliation's RESOLUTIONS are binding). The POC `DESIGN-SYSTEM.md` survives for
interaction/a11y/product-law contracts ONLY — every visual fact comes from ds-source.
"Instrument" graphite+brass is retired; brass does not exist in this system.

## The three most-broken rules (memorize)

1. **No raw values.** No hex, no arbitrary px, no `style={{}}`. Everything from
   `packages/tokens` via semantic utilities — and packages/tokens is generated from
   `design/ds-source/tokens/*.css`. Missing a token? Extend at GENERATION time, clearly
   marked as an extension (like `--brand-wash`, Noto Devanagari, the studio viz
   namespaces) — never inline it, never hand-edit generated output.
2. **Primary actions are NEAR-BLACK, never coloured.** `--action-primary #0A0A0B` /
   white text (~19:1), hover `#26262A`, pressed `#000000` — "the strongest identity
   marker." The interactive accent `--accent #5A4BFF` (hover `#4A3BF0`, subtle `#EEECFF`)
   drives focus rings, links, selected states, active tabs and control fills ONLY —
   it is never a button fill. Iridescence (`--iris-violet #7B5CFF` / `--iris-blue #3B82F6`
   / `--iris-magenta #E85CBE`, `--gradient-brand`, `--glow-brand`) is atmosphere —
   gradient/glow/icon-wash/AI cues only, never information, never a fill on a button,
   row, chip or field.
3. **Hierarchy comes from luminance + elevation, never from lines.** No structural 1px
   borders anywhere — surfaces separate by being brighter than the canvas plus a soft
   wide shadow. The only line is `--hairline rgba(10,10,11,0.06)`. Sanctioned exceptions:
   dashed file-upload drop-zones and the opt-in high-contrast field mode (sunlight
   visibility on site).

## Typography

- **Geist** is the default sans (`--font-sans`); **Geist Mono** (`--font-mono`) for ALL
  numerics-as-data: IDs, phone numbers, kWh/kW/kWp readings, ₹ amounts, coordinates,
  invoice numbers, counts, dates-in-tables. `tabular-nums` is global on body; currency
  and quantities right-align in tables. Devanagari: pair Geist → Noto Sans Devanagari
  (generation extension — ds-source ships no Devanagari face; OS fallback is not
  acceptable).
- **Weights: 400 / 500 / 600 / 700.** 600 is sanctioned (`--fw-semibold:600`, owner
  ruling 2026-07-24; mockups use it 210× on dense screens). No other weights.
- **Body is 15px/1.55** (`--fs-body`). Scale: display 40/44 −0.03em · h1 32/36 −0.025em ·
  h2 24/28 −0.02em · h3 20/22 −0.015em · h4 17/18 −0.01em · body-lg 17/1.55 ·
  body-sm 13/1.5 · caption 12/1.4 · table 13/1.45 · button 15/−0.01em. Headings are
  tightly tracked — essential to the look. Sentence case everywhere.
- **The overline is the ONE sub-12px exception** to the 12px floor (named exception,
  owner-approved): **11px / 700 / UPPERCASE / 0.12em tracking** — section micro-labels
  only ("SITE SURVEY", "SYSTEM CAPACITY"), never body, never data, never interactive
  text. Uppercase exists nowhere else.
- **AA-failing colours keep their hex but have RESTRICTED ROLES:**
  `--text-tertiary #A1A5AC` (~2.5:1) is decorative/timestamps only — never load-bearing
  text; meaning-bearing overlines use `--text-secondary #74787E` (~4.45:1).
  `--warning #E9A23B` (~2.2:1 as text) always sits on its tinted chip `--warning-bg
  #FDF4E6` — never bare text.

## Surfaces & layout (LIGHT-ONLY v1)

- **The system is light-only.** Dark mode is struck from the definition of done (owner
  ruling 2026-07-24). Keep the semantic-alias indirection (`--bg-page`, `--surface-card`,
  `--text-body`, `--link`, `--focus-ring`…) so a dark value-set can drop in later. The
  old "studio canvas stays dark" doctrine is dead — the mockups' DesignStudio is light
  (`--canvas` / `--canvas-sunken` wells, white panels).
- Canvas `#F6F7F9` (sunken `#EEF0F3`) · cards pure white `#FFFFFF` · zebra rows alternate
  `#FFFFFF`/`#FAFBFC` (`--surface-alt`). Text near-black `#0A0A0B`, never pure black.
  Neutrals are 95% of the product.
- Layout tokens: sidebar **260px** (collapsed 68) · header 64 · mobile topbar 56 ·
  bottom nav **72** · content-max 1440 · screen pads 20/32 expressive, 16/24 functional ·
  gutters 16/20/24. Mobile nav is the curved white arc bar with a **near-black centre
  FAB** (`--action-primary`, 54px circle, `--e4`) — the old "brass centre" claim is wrong
  twice over; nested screens drop the bottom nav and use back-‹.
- Radius: all buttons and chips fully **pill (999px)** · cards **24px expressive /
  12px functional** · sheet top corners 32 · inputs 14/10 · feature tile
  `999px 999px 32px 32px` (marketing/discovery only, sparingly).
- **Density is a component prop** (`density="expressive"|"functional"`), not a global
  mode — `:root[data-mode]` is a no-op placeholder. Same colours/type/rules in both;
  only spacing and radius change. Default: Expressive on mobile, Functional on desktop
  data screens.
- Spacing is 4px base: 0/2/4/8/12/16/20/24/32/40/48/64/80/96.

## Interaction

- **Elevation e0–e5, "felt not seen"**: e1 `0 1px 2px rgba(16,24,40,0.04)` rows →
  e2 cards → e3 hover/dropdown → e4 popover/nav → e5 `0 24px 72px rgba(16,24,40,0.10)`
  modal/sheet/FAB. **Hover raises exactly one step + `translateY(-1px)`** — never more,
  never hard or dark shadows.
- **Overlays blur (0→8px) and fade the layer behind toward white (0.35) — never a dark
  scrim.** `backdrop-filter: blur(8px)` is reserved for overlay backdrops and the glass
  credit chip; semantic tints are flat, not translucent.
- **Focus is a single `2px solid #5A4BFF` ring at 2px offset, never removed.** Inputs
  are borderless (`--e1` rest) and focus via `--e2, 0 0 0 2px var(--surface),
  0 0 0 4px var(--accent)`; error state is `inset 0 0 0 1.5px var(--danger)`.
- Motion: **120ms micro / 200 standard / 320 emphasised / 500 ambient**; easings
  standard `cubic-bezier(0.4,0,0.2,1)`, enter, exit, and **spring
  `cubic-bezier(0.34,1.56,0.64,1)`** for sheets/FAB/segmented. Press = scale **0.97**
  (buttons) / 0.94 (icon buttons). Cards mount fade+rise 8px, staggered 40ms, max 6.
  Skeleton shimmer 1.4s. `prefers-reduced-motion` collapses all durations to **1ms**.

## Kept product law (unchanged — the POC's interaction/a11y layer)

A screen violating one of these is not done:
- Touch targets **≥44×44px** · no hover-only meaning (branch on `pointer: coarse` /
  `hover: hover` capability, never screen width) · `dvh`/`svh` only, never `vh`.
- **375px works for EVERY screen**, studio included · no fixed-viewport layouts · the
  page NEVER scrolls horizontally — wide tables/drawings scroll inside their own
  container; wide tables become card list + edit sheet on mobile.
- All four states required: **loading / empty / error / offline**.
- **Provenance tier on every user-visible number** (measured/derived/estimated/assumed);
  money never renders while stale.
- Destructive = confirmed + undoable, undo thumb-reachable. Keyboard operable; focus
  trap/restore in modals; accessible names on everything.
- **N6: UI colour ≠ data colour.** `--chart-1…8` (`#5A4BFF #3B82F6 #E85CBE #159A5B
  #E9A23B #7B5CFF #14B8C4 #A1A5AC`, gridline `#EEF0F3`) is the categorical chart
  palette; the studio's roof/string/irradiance namespaces are authored as marked token
  extensions. Never style a button with a data colour; **never chart with `--accent` or
  `--action-primary`**. Status is never colour alone — label + dot.

## Components

- **IMPLEMENTED 2026-07-26**: `packages/ui` (web) + `apps/mobile/src/ui` (RN) exist,
  gallery-verified. Screens import ONLY from these indexes — never deep paths, never
  raw styling/hex/px in app code; a state not rendered in the galleries doesn't exist.
  Surfaces without a mockup are composed from THIS vocabulary (packages/ui/CLAUDE.md law).
- Build against the **21-component `_ds` API** in `packages/ui`: Button, IconButton,
  Input, Checkbox, Radio, Switch · Card, IconCircle, Chip, Badge, Avatar, AvatarGroup,
  ListRow, StatCard, StatusChip · EmptyState, OfflineBanner, ProgressBar, Toast ·
  SegmentedControl, Tabs. The `_ds` JSX bundle is **spec to implement, not code to
  import**; the oxlint prop allow-lists + enums are the public API. Radix underneath
  for a11y plumbing.
- Canonical **Button**: variant `primary|secondary|ghost|destructive` (never "danger" —
  a mockup bug that silently falls back to primary), size lg 48px / md 40px / sm 32px,
  pill, weight 500, minHeight 44.
- **StatusChip** maps the domain states (lead / survey-scheduled / design-in-progress /
  approved / installing / commissioned / on-hold) to fixed semantic colours + a 6px dot.
- The four behavioural contracts stay layered on top: NumberField commit-on-blur ·
  DataTable caption · mandatory ariaLabel · modal focus trap/restore.
- Icons: **Lucide, outlined, 1.5px stroke, round caps/joins** — 24px default / 20px
  functional / 28px bottom nav; filled variants only for the active bottom-nav item;
  circular icon container 40px expressive / 32px functional at 6% tint. Bundle locally —
  the CDN reference is mockup-only. No icon font, no emoji, no unicode-as-icon.
- Buttons are verbs ("Schedule survey", "Send over WhatsApp") — never "Submit"/"OK".

## Definition of done (per screen, light-only)

375px and 1440px, no horizontal scroll · all four states · keyboard operable, visible
focus (2px `#5A4BFF` ring) · axe clean · targets ≥44 · **light theme correct (dark is
struck from DoD)** · provenance shown · **renders correctly in Hindi** (text expansion,
Devanagari via the Noto pairing) · realistic volume tested (200-lead list, 40-line BOM,
221-panel design) · wired into the flows that reach it (no orphan screens).
