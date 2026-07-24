# Rules — packages/ui, apps/web (design system "Instrument")

The design system is binding: warm graphite + brass, machined-instrument feel.
Full law: `docs/10-i18n-and-design-system.md` + POC `docs/DESIGN-SYSTEM.md`.

## The three most-broken rules (memorize)
1. **No raw values.** No hex, no arbitrary px, no `style={{}}`. Everything from
   `packages/tokens` via Tailwind semantic utilities. Missing a token? Add it to tokens
   WITH a verified contrast ratio — never inline it.
2. **Brass fills carry INK labels** (`bg-accent text-on-accent`). White-on-brass is 3.09:1
   and FAILS. Accent BRIGHTENS on hover (`hover:bg-accent-hover`), never darkens.
3. **`text-accent` does not exist — use `text-accent-text`** (brass-700). Brass-500 is
   2.96:1 as type: fill/graphic only.

## Hard rules N1–N10 (a screen violating one is not done)
N1 no hover-only meaning · N2 targets ≥44×44 (`.tap-target`) · N3 no font <12px, body 14px
· N4 text ≥4.5:1, UI boundaries ≥3:1, computed not eyeballed · N5 accessible names +
focus trap/restore in modals · N6 UI color ≠ DATA color (roof/string/heatmap hues are a
separate namespace — never style a button with a data color, never chart with brass)
· N7 provenance tier on every number · N8 destructive = confirmed + undoable, undo
thumb-reachable · N9 no fixed-viewport layouts · N10 loading/empty/error/offline states
required.

## Layout & touch contract
- Branch on capability (`pointer: coarse`, `hover: hover`), never screen width.
- `dvh`/`svh` only, never `vh`; safe-area utilities on fixed chrome; inputs ≥16px on mobile.
- One canvas gesture vocabulary (satellite, layout editor, 3D): 1-finger pan, pinch zoom,
  tap select, long-press context, two-finger tap undo. Numeric entry is always available
  as the precise path. One gesture = one undo step.
- Mobile nav = arc bar (5 slots, brass centre action adapts by role); nested screens drop
  the bottom nav and use back-‹. Desktop = left sidebar ~240px.
- Wide tables become card list + edit sheet on mobile (BOM, catalog). The page NEVER
  scrolls horizontally; drawings scroll/zoom inside their own container.

## Theming & i18n in UI
- One semantic token system, two value sets (light/dark). `--surface-canvas` stays dark in
  both themes. Never a second palette.
- Tailwind v4 full import (`@import "tailwindcss"`), `@theme` mapping NOT `@theme inline`
  (inline bakes light values into utilities — verified failure mode in the POC).
- Every screen proves itself in Hindi (text expansion, Devanagari fallback) — ₹ grouping
  and units stay Indian/untranslated in every locale.

## Definition of done (per screen)
375px and 1536px, no horizontal scroll · all four states · keyboard operable, visible
focus (two-tone ring) · axe clean · targets ≥44 · light+dark correct · provenance shown ·
realistic volume tested (200-lead list, 40-line BOM, 221-panel design) · wired into the
flows that reach it (no orphan screens).
