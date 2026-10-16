# SCR-M02-03 · Leads List

The main leads list: source badges, monthly-bill sort/filter, dormant filter.

**Module:** M02 · CRM & leads · **Personas:** Sales Executive (own-lead scope), Sales Manager (team scope), EPC Owner (all) · **Context of use:** desk and phone equally — web and mobile carry every capability equally (`F7-30`). Visibility follows `F2.M02.lead-visibility`.

**One job:** find the leads to work next.
**Order of attention:** 1 the leads in my scope, each with its stage and source · 2 sorting and filtering by monthly bill · 3 the dormant ones.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2.

| Fact | Kind | Its form here |
|---|---|---|
| Each lead — who, where, its stage, its source (`M02-13`) | data · status | one row: name, city, the stage — one of `M02-41`'s eight — as its ONE status chip, the source as its mark: at 375 its glyph alone, named in the row's accessible label; at 1536 the word, in the Source column. The owner's name joins the row for a person who sees more than their own leads. A missing name or city is a named gap (`M02-03`) |
| Which leads are on the list (`M02-58`) | — | behaviour, no words: every assigned lead in scope that is in play — unassigned ones, new and imported, wait in the Lead Inbox (SCR-M02-02), so the two never overlap (`M02-23`). Won leads stay: won is a stage, not a state, and never turns dormant. Disqualified and lost leads live in their win/loss lists and junk in search only, so none of them is here — not greyed, not counted. A snoozed lead is listed with no snooze mark: its chip lives on lead detail |
| The order (`M02-23` is the inbox's; none is pinned here) | — | arrangement, no words: newest first by default; the monthly-bill sort is the only other sort |
| Monthly bill, as data (`M02-40`) | data | a value on the row at 375 and a sortable column at 1536, in the tenant's currency. One provenance label heads the column (`F8-07`). A lead whose bill is not captured yet shows the named gap `No bill yet`, and sorts after every lead with a bill in both directions |
| Sort and filter by monthly bill (`M02-40`) | action | in the filter bar: one sort menu — newest, highest bill, lowest bill — and a range filter. The active filter shows as a chip carrying the band, that can be cleared; the caption says only that the bill filter is on |
| Dormant leads (`M02-52`) | status · action | a `Dormant` filter chip, and a `Dormant` mark (a glyph and the word, never a pill, so it never reads as a second stage) beside the stage chip on each such row — the state is orthogonal to the stage (`M02-41`), so the row keeps its stage. No sentence about the nightly sweep or the thirty days — that is Help |
| What the list is showing (`F7-27`) | data | the table's caption: the scope and the filters in force |
| Add a lead (`M02-06`) | action | the surface's primary act on web; on mobile it is the shell's centre action, so none is drawn here |
| No leads in scope | teaching | at most two short sentences and ONE act |
| A filter that matches nothing | — | ONE line naming the filters in force, standing in for the caption, and the act that clears them. Not the teaching empty state |
| The list failed to load | error | one banner — what failed and what to do |

## Arrangement

- **375.** A list of rows under a pinned head — title, count, filter bar; the 200-lead volume scrolls
  under it in this one region.
- **Both widths.** The head carries *Find in this list* (`F7-47`) and the stage chips, each with its
  count of the list in force (won included), above the filter bar. Every filter-bar control is the same
  small chip. The bill range is an editor (`F7-21`): a sheet at 375 that applies on `Show leads`, a
  docked side panel at 1536 that updates the table live and closes on `Done`.
- **1536.** A table — name, city, stage, owner, source, monthly bill — with its caption, under a pinned
  head holding the filter bar and the position (*1–20 of 200*), its column header sticky, and the
  primary add act in the page header. No pager is drawn.

## Entry & exit

Reached from: the shell's *Leads* destination. The page is titled *Leads*; for people who hold `F2.M02.assign-leads`, *Inbox · Leads* tabs under the title switch between the Lead Inbox (SCR-M02-02) and this list, and a Sales Executive sees this list with no tabs. No count rides a tab. On web the leads surface carries the primary add action that opens Quick Add Lead (SCR-M02-01) in one tap (M02-06). Leads to: Lead Detail (SCR-M02-04) on opening a row — the whole row opens it, and at 1536 the name is also a link so a keyboard can; Quick Add Lead (SCR-M02-01) via the primary add action; the Lead Import Wizard (SCR-M02-05) via `Import leads`, only for holders of `F2.M02.import-leads` — an icon button carrying those words as its name at the head's right at 375, a secondary button beside `Add lead` at 1536.

## Requirements (verbatim)

### docs/prd/modules/M02-crm-and-leads.md

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

Loading keeps the caption and the filter bar, both known before the rows. Empty and Error drop the count, the caption and the filter bar.

Drawn at 375 only (at 1536 the phone's answer holds at width): `Loading`, `Empty`, `Error`, `dormant-filter`, the lowest-bill sort, the filter that matches nothing, and *Find in this list* with a query applied.

## Data volume

Design at a **200-lead list** — an established tenant's working pipeline, with a 300–400-row import having landed in the past. Sorting and filtering by monthly bill must be legible at that volume, and the dormant filter must return a meaningful subset (a tenant a few months in will have dozens of dormant leads).

## Numbers carrying provenance

- **Monthly bill** per lead — captured in the tenant's currency (`F1-07`), sortable and filterable as data; renders through the money implementation with the pack's symbol and grouping (`F3-20`, `F1-21`). A typed bill is `assumed` (`F8`), so the column's label reads *Monthly bill · Assumed*.
- **Names and cities are data** and are never translated (`F3-08`); stage names are a closed set, translated with a fixed canonical identity (`F3-01`, `F3-12`).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` base state and an `offline-stale-banner` state (`F4-10`, `F4-26`), a Context-of-use clause about reads degrading to cache, and cache-provisional labelling on estimated value (`F8-16`). All are deleted.*
