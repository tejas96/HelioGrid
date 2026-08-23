# SCR-M02-03 · Leads List

The main leads list: source badges, monthly-bill sort/filter, dormant filter.

**Module:** M02 · CRM & leads · **Personas:** Sales Executive (own-lead scope), Sales Manager (team scope), EPC Owner (all) · **Context of use:** desk and phone equally — web and mobile carry every capability equally (`F7-30`). Visibility follows `F2.M02.lead-visibility`.

## Entry & exit

Reached from: the main leads surface in navigation — the PRD does not pin a single entry beyond it being the leads surface; not pinned by PRD — designer decides, note the decision. On web the leads surface carries the primary add action that opens Quick Add Lead (SCR-M02-01) in one tap (M02-06). Leads to: Lead Detail (SCR-M02-04) on opening a row; Quick Add Lead (SCR-M02-01) via the primary add action.

## Requirements (verbatim)

### prd/modules/M02-crm-and-leads.md

- **M02-13** (P0) — **The v1 lead-source set is closed and every lead carries its source: manual quick add · file import · inbound call · referral.** The badge is shown wherever a lead is listed, so triage can see at a glance where the enquiry came from. **Post-overlay note carried in-row:** the data model's own row marks referral dormant alongside the deferred channels; `R15` rules the referral tag live in v1, so **only** the website and business-messaging sources stay out (M02-17). The overlay wins; recorded, not silently reconciled. **Suite note (Task 26, closing Task 21 convention 7's flagged reconciliation):** *closed* is `D13`'s claim about the **v1-source** set only — `modules/M03`'s brief-scoped captures extend the suite's badge set (`M03-31`: website form · business messaging · email · SMS · social lead form) under exactly the license this module grants at `M02-17`; a reader meeting `M03-31` first holds two consistent sentences. _(non-UI half, build-side: closed v1 source enum; source set by path, immutable — for awareness, not for drawing)_
- **M02-40** (P0) — **Monthly bill is captured in the tenant's currency and is sortable and filterable across the leads list.** It is the strongest single qualifier in the product's segment and is treated as data, not as a note.
- **M02-52** (P0) — **Dormant.** Entry: **thirty days with zero activity on any open stage.** Rule: a nightly sweep flags it and **never deletes it**. Exit: **any activity returns it to its stage**, or a person reopens it explicitly. Surfaced as a filter on the leads list and **excluded from My Day**. _(non-UI half, build-side: nightly sweep flags after thirty inactive days; any activity reactivates; never deletes — for awareness, not for drawing)_

## States

- **Loading** (base).
- **Empty** (base) — no leads in the actor's visibility scope; empty states carry F7's teaching contract.
- **Error** (base).
- **normal** — every lead in scope with its source badge from the closed v1 set (M02-13).
- **bill-sort-filter** — the list sorted or filtered by monthly bill, behaving as data in the tenant's currency (M02-40).
- **dormant-filter** — the dormant filter applied: leads flagged by the nightly sweep after thirty inactive days, still present, never deleted (M02-52).

## Data volume

Design at a **200-lead list** — an established tenant's working pipeline, with a 300–400-row import having landed in the past. Sorting and filtering by monthly bill must be legible at that volume, and the dormant filter must return a meaningful subset (a tenant a few months in will have dozens of dormant leads).

## Numbers carrying provenance

- **Monthly bill** per lead — captured in the tenant's currency (`F1-07`), sortable and filterable as data; renders through the money implementation with the pack's symbol and grouping (`F3-20`, `F1-21`).
- **Estimated value** where shown on a lead — a forecast input, never revenue.
- **Dates/ages** shown on rows render through the shared date implementation on the tenant's timezone (`F3-22`).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` base state and an `offline-stale-banner` state (`F4-10`, `F4-26`), a Context-of-use clause about reads degrading to cache, and cache-provisional labelling on estimated value (`F8-16`). All are deleted.*
