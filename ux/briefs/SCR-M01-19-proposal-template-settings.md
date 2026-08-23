# SCR-M01-19 · Proposal Template Settings

Document defaults: cover, included sections, default T&C, bank details, and the project-timeline template.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** owner-only settings work, web-emphasis at a desk (M01 §2), fully mobile-capable. Permission: `F2.M01.manage-tenant-settings` (EPC Owner); settings changes are audit events (M01 §M01.6 permissions, F2-22).

## Entry & exit

Reached from: the tenant-config settings surface map — *Proposal templates* is a named surface in M01 §4's stable vocabulary; a deeper entry path is not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. What the screen feeds: the proposal builder consumes these document defaults, including everything Quick mode fills for its hidden steps (M01-51, M01-53 context, M01 §4 contracts); T&C templates support the builder's "save as template" round-trip (§M01.6 behavior detail, M06's step).

## Requirements (verbatim)

### From `prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-51** (P0) — **Proposal template settings: cover, sections included, default terms & conditions, bank details.** These are the tenant's document defaults, consumed by the proposal builder; the document is named "Proposal" in every locale (R1, consumed via F3-11). Bank details entered here are the business profile's (M01-31) — one write-point.
- **M01-52** (P1) — **Project-timeline template: default phases and descriptions**, editable and reorderable, consumed as the builder's timeline step default.

## States

- **Loading** — current template defaults loading.
- **Empty** — a tenant with untouched template settings: working platform defaults are in place from day one and Quick mode is still generable (M01-28, M01-53 context); teaching treatment per F7's empty-state contract.
- **Error** — a save fails; what happened and what to do next.
- **normal** — cover, included sections, default terms & conditions and bank details editable; bank details are the business profile's single write-point (M01-51, M01-31); template edits version forward simply — last saved wins, audit-logged (§M01.6 behavior detail).
- **live-preview** — every config screen shows the effect: live preview of the affected customer document before saving (M01-30's law, §M01.6 behavior detail; documents already generated are immutable per F8-15 and never restyle retroactively).
- **timeline-phases-reorder** — the project-timeline template's default phases and descriptions being edited and reordered (M01-52).

## Data volume

One tenant's document-default set: a cover, a list of included sections, one default T&C body, bank details (referenced from the business profile), and a timeline template of a handful of ordered phases with descriptions. Form-scale, with one live document preview.

## Numbers carrying provenance

- **Bank details** rendered here read from the business profile's single write-point (M01-51, M01-31) — identity facts, not computed numbers; their F8 provenance tier follows the profile datum in the design.
- The **live preview** renders a customer document; figures inside it belong to the document's own surfaces and provenance tiers, not new ones minted here (F8-15 immutability per §M01.6 behavior detail).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*
