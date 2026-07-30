---
paths:
  - "packages/ui/**"
  - "apps/mobile/src/ui/**"
  - "apps/mobile/src/screens/**"
  - "apps/web/app/**"
---

# UI — tokens only, compose don't invent, separate rendering from logic

## Visual values
- **No raw values.** No hex, no arbitrary px, no inline style. Everything comes from
  `@heliogrid/tokens`, which is GENERATED from `design/ds-source` — never hand-transcribed.
  `_ds_manifest.json` is untrusted for values. (Hex: hook warns on write, `pnpm lint` fails
  at merge. Arbitrary px and inline style are review-only — no honest gate exists, so the
  rule holds by your care and `ux-lens`, not by a red build. docs/10 §8 says why.)
- **Primary actions are near-black** (`#0A0A0B`). Accent `#5A4BFF` is focus, links,
  selection, active tab and control fills ONLY — **never a button fill**. Iridescence is
  atmosphere, never information. Hierarchy comes from luminance and elevation, not borders.
- **Light-only v1.** The 11px/700/uppercase/0.12em overline is the one sub-12px exception.
- Full design law and the N1–N10 interaction contracts: `docs/10-i18n-and-design-system.md`.

## Composition
- **Screens import only from the component indexes** (`packages/ui`, `apps/mobile/src/ui`).
  Raw styling in a screen is a violation.
- A surface the mockups don't cover is COMPOSED from the existing vocabulary — never new
  visuals. Log the composition decision as a module ruling.
- Copy props are required, never optional-with-an-English-fallback.
- Status/variant → visual maps are `Record<TheEnum, …>` so a new contract value fails to
  compile here rather than rendering blank.

## Presentation and logic live in different files
A component renders. It does not also fetch, orchestrate, or hold flow logic.
- **Container** — `<Name>Screen.tsx` (web: `page.tsx`): data via the typed client, state,
  handlers, navigation. Returns presentational components; holds little markup.
- **Presentational** — a `components.tsx` satellite or a `packages/ui` component: props in,
  markup out. No data access, no navigation, no hooks beyond local UI state.
- **Logic** — a `hooks.ts` satellite for screen-local logic; shared logic that both
  platforms need belongs in a shared package, never copied into each platform.

A `.tsx` holding both a data-fetching effect chain and the markup it feeds is a review
finding. Past ~450 lines, split by RESPONSIBILITY and name the new file for what it does —
never `*-part2`, `*2` or `*-extra`.

## Done means
375px and 1440px both work · loading, empty, error and offline states all designed ·
keyboard reachable with visible focus · touch targets ≥44px · no hover-only meaning ·
Hindi renders without clipping (allow 20–30% expansion) · numbers carry provenance ·
web and RN shipped together (Law 7).
