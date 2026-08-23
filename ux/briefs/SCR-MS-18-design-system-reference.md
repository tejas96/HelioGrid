# SCR-MS-18 · Design System Reference

Living UI-kit reference kept as part of the development surface.

**Module:** MS (M05 Design Studio · studio sub-spec MS12) · **Personas:** Internal (developers/designers) · **Context of use:** desk, development-time; an internal surface — never a tenant or customer surface.

## Entry & exit

Not pinned by PRD — designer decides, note the decision. The row's only placement law is that the reference stays part of the product's development surface (MS12-29); it is not a wizard step and no wizard-step gate applies.

## Requirements (verbatim)

### From prd/modules/M05-studio/11-shell-and-platform.md

- **MS12-29** (P1) — The living design-system reference stays part of the product's development surface (`.112`, F7 binding).

## States

Three base states, then the slice's screen-specific state:

- **loading** — the reference loads like any product surface.
- **empty** — a kit section with nothing registered states so; the reference is living, so emptiness signals a real gap, not a placeholder page.
- **error** — a component that fails to render is reported rather than silently omitted.
- **normal** — the living reference rendering the product's real UI kit (MS12-29).

## Data volume

The whole kit, not a sampler: "living" means the reference tracks the product's real shared controls and their states as they ship, at the full breadth of the kit rather than a curated subset (MS12-29).

## Numbers carrying provenance

No user-visible product numbers are pinned by this screen's row; any numbers shown are specimen content of the kit being demonstrated. Where a real product figure is embedded as an example, it carries its F8 provenance tier like any other surface.
