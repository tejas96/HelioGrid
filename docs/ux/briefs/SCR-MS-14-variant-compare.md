# SCR-MS-14 · Variant Compare

Compare 2–4 variants on kWp, generation, price, payback, health; set recommendation.

**Module:** MS (M05 Design Studio) · **Personas:** Design Engineer, EPC Owner, Sales (read-only) · **Context of use:** the Design Engineer is desktop-weighted with full mobile parity (docs/prd/02-personas.md persona table); sales roles read it mobile-first — the row's dual-breakpoint contract makes the phone rendering (horizontal snap cards) a first-class form, not a squeezed table.

## Entry & exit

Reached from: the lead's design list (SCR-MS-01), where the variants sit side by side; and Duplicate-as-variant is an entry point of the compare surface (M05-79). Leads to: `is_recommended` is set here (M05-79) — the customer-facing single recommendation is `modules/M06`/`foundations/F5`'s half, per the row's own source pointer. Onward exit (back to the design list or into a variant's studio) is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### From docs/prd/modules/M05-design-studio.md

- **M05-79** (P0) — **Compare 2–4 variants side by side: kWp, annual generation, price, payback, health score — with `is_recommended` set here.** Mobile renders horizontal snap cards (dual-breakpoint contract). Compared generation figures carry their energy source labels (`F8-08`, cited) — a source-of-record figure and a built-in estimate are never presented as like-for-like without their labels. Duplicate-as-variant is an entry point of the compare surface.

## States

Three base states, then every screen-specific state from the slice and the rows:

- **loading** — the compare figures load; nothing renders as a like-for-like figure before its source label is known (M05-79's labelling law).
- **empty** — fewer than two variants: the row defines compare as 2–4 variants, so the surface has no meaning below two; the exact treatment is not pinned by PRD — designer decides, note the decision.
- **error** — a variant whose figures cannot be read states so; no figure renders unlabelled (M05-79).
- **normal** — 2–4 variants side by side with the five compare figures, `is_recommended` settable here (M05-79).
- **mobile-snap-cards** — the small-breakpoint rendering: horizontal snap cards (dual-breakpoint contract, M05-79).
- **mixed-energy-source-labels** — compared generation figures carry their energy source labels; a source-of-record figure and a built-in estimate are never presented as like-for-like without their labels (M05-79).
- **read-only** — the read-only persona named above (Sales) sees everything: all 2–4 variants, all five compare figures and every energy source label, at both breakpoints. What is not offered is the write this surface carries — **`is_recommended` is not settable** (M05-79 sets it here; `foundations/F2` governs who may). Duplicate-as-variant, the surface's other entry point (M05-79), is likewise an authoring action. The exact affordance for the withheld control is not pinned by PRD — designer decides, note the decision.

## Data volume

Design at the row's maximum: four variants, each a whole design, each with all five compare figures plus its energy source label; the snap-card rendering must hold four cards. Figures at realistic magnitudes (a large design's kWp, generation, price and payback), not demo values (per the Definition of Done's realistic-volume rule).

## Numbers carrying provenance

Each user-visible number carries its F8 provenance tier in the design:

- kWp per variant (M05-79)
- Annual generation per variant — energy figure: tier plus its energy source label (M05-79)
- Price per variant (M05-79)
- Payback per variant (M05-79)
- Health score per variant (M05-79)
