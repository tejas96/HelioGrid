# SCR-M01-22 · Capture Settings

Every lead source with honest status: live channels toggleable, not-yet channels as later cards without toggles.

**Module:** M01 · Onboarding & tenant config (surface owner; M02 owns the channel set and toggle semantics) · **Personas:** EPC Owner · **Context of use:** owner-only settings work, web-emphasis (M01 §2), with the channel toggle itself a one-tap act first-class on mobile (M01 §2). Permission: `F2.M01.manage-tenant-settings` (EPC Owner; M01 §M01.10 permissions).

## Entry & exit

Reached from: a settings sub-surface — *Capture settings* is a named surface in M01 §4's stable vocabulary; a deeper entry path is not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. Context the screen sits in: capture settings reuse the M01-28 default law — manual capture and the v1 source set work with zero setup; M02 owns which (§M01.10 behavior detail); at least the manual channel is always available because it is the path onboarding hands the first lead to (M02-64, `M01-26`).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-58** (P0) — **Capture settings state honestly which lead channels are live.** A settings sub-surface shows every lead source with its real status: live channels toggleable; channels that do not exist yet rendered as **"later" cards, not teasers** — the screen must distinguish live from not-yet rather than advertise. Deferred sources are parked here. The channel set, its toggles' effect and the capture flows are `modules/M02-crm-and-leads.md`'s (with `modules/M03-marketing.md`'s brief-era channels recorded as a conflict by Task 3); this module owns the settings surface's existence and its honesty rule.

### From `docs/prd/modules/M02-crm-and-leads.md`

- **M02-17** (P0) — **Website forms and inbound business-messaging are not lead channels in this module.** `D13` defers both; they appear on capture settings as **"later" cards, never as toggles** (M02-65). **Supersession hand-off, recorded not resolved:** the V2 brief adds a marketing module that captures leads across email, business messaging, social and SMS and feeds them into the sales pipeline — which supersedes `D13`'s deferral **as brief scope, in `modules/M03-marketing.md`, not here**. M02 specifies none of those channels; whatever M03 lands arrives in this module's inbox (M02-23), carries its own source badge, and passes through this module's dedupe sheet (M02-10) unchanged. The v1-source-vs-brief tension is recorded in `registers/conflicts.md` **row 3** (first dispositioned by Task 3 at `DOC00.nongoal-lead-channels`; written into the register by Task 13), with `DD2`'s brief-driven supersession named as the resolution and `modules/M03` named as the owner of the superseding spec. _(non-UI half, build-side: D13 deferral; M03 supersedes as brief scope, feeds this inbox — for awareness, not for drawing)_
- **M02-64** (P0) — **This module owns the channel set and what a toggle does; M01 owns the settings surface.** A channel toggle governs **new capture only**: turning a live channel off stops new leads arriving through it and never hides, alters or deletes a lead already captured through it — the source badge on existing leads survives the toggle. Turning the inbound-call channel off is a capture decision here and is distinct from the agent's own configuration (`modules/M07`). At least the manual channel is always available, because it is the path onboarding hands the first lead to (`M01-26`). _(non-UI half, build-side: toggle governs new capture only; existing leads untouched; manual always available — for awareness, not for drawing)_
- **M02-65** (P0) — **A channel that does not exist is never advertised as one.** Website forms and inbound business-messaging render as **"later" cards, not teasers**, carrying no toggle, no form snippet and no number field — the source's capture-settings screen listed a form snippet and a messaging number for channels this release does not have, and that over-promise is **not carried**. The screen distinguishes live from not-yet rather than advertising.

## States

- **Loading** — channel list and statuses loading.
- **Empty** — not a real product state: the channel set always exists and at least the manual channel is always available (M02-64); if a distinct treatment is needed, note the decision.
- **Error** — a toggle save fails; what happened and what to do next.
- **live-toggle / live-toggles** — every live channel shows a working toggle (M01-58 acceptance); a toggle governs new capture only — existing leads and their source badges survive it (M02-64); turning inbound-call off is a capture decision distinct from the agent's own configuration (M02-64).
- **later-card-no-toggle / later-cards** — every not-yet channel (website forms, inbound business-messaging) is a "later" card with no toggle, no form snippet and no number field (M01-58 acceptance; M02-65, M02-17); a not-yet channel can never be toggled on — later cards carry no toggle (§M01.10 edge cases).

## Data volume

One card per lead source: the live v1 channels M02 defines (manual is always among them, M02-64) plus the two named later cards — website forms and inbound business-messaging (M02-17, M02-65). A single-digit card list; the honesty distinction between live and not-yet is the design load, not volume.

## Numbers carrying provenance

None — this screen shows channel names, statuses and toggles; no user-visible money, dates or computed numbers.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*
