# SCR-M01-20 · Payment Terms Settings

Named tranche templates (label + percentage per canonical stage) with a tenant default and live customer preview.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** owner-only, money-adjacent settings work, web-emphasis at a desk (M01 §2), fully mobile-capable. Permission: `F2.M01.manage-tenant-settings` (EPC Owner); tranche-template edits are audit events — money-adjacent settings (M01 §M01.7 permissions, F2-22).

## Entry & exit

Reached from: the tenant-config settings surface map — *Payment terms* is a named surface in M01 §4's stable vocabulary; a deeper entry path is not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. What the screen feeds: the builder's payment-terms step default, Quick mode, and — at Won — the project's collection schedule (§M01.7 behavior detail; M11's one-money-path contract). The template editor is the same control the builder's payment step uses — one pattern (§M01.7 behavior detail).

## Requirements (verbatim)

### From `prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-54** (P0) — **Named tranche templates.** A tenant manages named payment-term templates — each a list of tranches (label + percentage) whose percentages sum to **exactly 100.00**, each tranche tied to the canonical project stage it falls due on (market-neutral stage names; display labels per the pack, F1-22). The platform seeds two standard templates at tenant creation (the source's 10/60/20/10 and 30/60/10 splits) and one template is the tenant default. Editing a template never changes documents already generated from it (F8-15). _(non-UI half, build-side: percentages must sum exactly 100.00; two seeded standard templates; edits never touch generated documents — for awareness, not for drawing)_

## States

- **Loading** — templates loading.
- **Empty** — never truly empty: the two seeded standard templates exist from tenant creation with one marked default (M01-54 acceptance: "Given a new tenant, when settings are first opened, then the two seeded templates exist and one is marked default"). Treat the seeded state as the floor.
- **Error** — a save fails; what happened and what to do next.
- **seeded-defaults** — the two platform-seeded standard templates (the source's 10/60/20/10 and 30/60/10 splits), one marked tenant default (M01-54).
- **sum-not-100-blocked-remainder-shown** — the 100.00 rule validates in the editor with the remainder shown ("12% unallocated" — §M01.7 behavior detail); save is blocked with the unallocated remainder stated (M01-54 acceptance).
- **live-customer-preview** — a live preview shows the tranches as the customer will see them (§M01.7 behavior detail; M01-30's law).
- **skippable-stage-warning** — a stage a tranche is due on is skippable in this market: the editor warns and M11's due-derivation rules govern (§M01.7 edge cases); the editor only offers real stages for the tenant's market (§M01.7 behavior detail).
- **archived-template** — templates archive, never delete; generated documents carry their own snapshot (F8-15) and never point back live (§M01.7 edge cases).

## Data volume

A small named set: the two seeded templates plus tenant-created ones, each a list of a few tranches (the seeded splits are four tranches — 10/60/20/10 — and three tranches — 30/60/10), each tranche bound to a canonical project stage from the market's real stage set (M01-54; F1-22 pack labels).

## Numbers carrying provenance

Each carries its F8 provenance tier in the design:

- **Tranche percentages** — tenant-authored config values that must sum to exactly 100.00 (M01-54).
- **The unallocated remainder** shown when the sum is not 100.00 — editor-computed (§M01.7 behavior detail).
- **The customer-preview tranche figures** — the live preview of the tranches as the customer will see them (§M01.7 behavior detail); percentages and money render per F3 (§M01.7 localization notes).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*
