---
paths:
  - "packages/ui/**"
  - "apps/mobile/src/**"
  - "apps/mobile/App.tsx"
  - "apps/web/app/**"
  - "apps/web/lib/**"
  - "apps/web/features/**"
---

# UI — tokens only, compose don't invent, separate rendering from logic

## Visual values
- **No raw values.** No hex, no arbitrary px, no inline style. Everything comes from
  `@heliogrid/tokens`, which is GENERATED from `design/ds-source` — never hand-transcribed.
  `_ds_manifest.json` is untrusted for values. (Hex: `pnpm lint` fails.
  Arbitrary px and inline style are review-only — no honest gate exists, so the
  rule holds by your care and review, not by a red build. docs/10 §8 says why.)
- **Primary actions are near-black** (`#0A0A0B`). Accent `#5A4BFF` is focus, links,
  selection, active tab and control fills ONLY — **never a button fill**. Iridescence is
  atmosphere, never information. Hierarchy comes from luminance and elevation, not borders.
- **Light-only v1.** Text is never smaller than 12px; the 11px/700/uppercase/0.12em
  overline is the one exception (docs/10 §3).
- Full design law and the N1–N10 interaction contracts: `docs/10-i18n-and-design-system.md`.

## Composition
- **Screens import only from the component indexes** (`packages/ui`, `apps/mobile/src/ui`).
  Raw styling in a screen is a violation.
- A surface the mockups don't cover is COMPOSED from the existing vocabulary — never new
  visuals. Log the composition decision as a module ruling.
- Copy props are required, never optional-with-an-English-fallback.
- Status/variant → visual maps are `Record<TheEnum, …>` (`.claude/rules/contracts.md` — the
  enum is the definition; this is why the map must be exhaustive).

## Presentation and logic live in different files
A component renders. It does not also fetch, orchestrate, or hold flow logic.
- **Container** — `<Name>Screen.tsx`: data via the typed client, state, handlers, navigation.
  Returns presentational components; holds little markup. Web's `page.tsx` is routing only
  — it renders the Screen, never holds container logic itself.
- **Presentational** — a component in `apps/web/features/<feature>/` or `packages/ui`: props
  in, markup out. No data access, no navigation.
- **Logic** — a `use-<thing>.ts` controller hook beside it in the same feature folder; shared
  logic that both platforms need belongs in a shared package (Law 11 —
  `.claude/rules/cross-platform.md`), never copied into each platform.

A `.tsx` holding both a data-fetching effect chain and the markup it feeds is a review
finding. File-size and split-naming law: root CLAUDE.md §Process.

## Done means
375px and 1440px both work · loading, empty, error and offline states all designed ·
keyboard reachable with visible focus · touch targets ≥44px · no hover-only meaning ·
Hindi renders without clipping (`.claude/rules/cross-platform.md`) · numbers carry
provenance · shared component APIs in parity (Law 7).
