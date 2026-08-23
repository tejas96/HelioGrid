# SCR-M03-01 · Campaign List (Campaigns Home)

All campaigns with their six honest lifecycle states; entry point for creating a campaign (channel chosen first); the Marketing persona's home content.

**Module:** M03 · Marketing · **Personas:** Marketing (primary — this list is their home content, `PS-36`), EPC Owner (sees all campaigns, always, `F2-14`; in a small firm the Owner *is* the marketing team), Sales Manager (consumer, not author — reads campaign results as pipeline input) · **Context of use:** campaign monitoring is mobile-first, because that is where the Marketing persona reads it (`PS-36`, M03 §2); must work for a single person holding both Owner and Marketing presets.

## Entry & exit

Reached from: the Marketing persona's home — this screen supplies its content (`PS-36`, `M13-40`). Leads to: campaign creation, with a channel chosen first — "A campaign is created from the campaign list with a channel chosen first" (M03 §M03.2 behavior detail) — into the Campaign Builder (SCR-M03-02 → SCR-M03-03 → SCR-M03-04); an individual campaign opens Campaign Detail (SCR-M03-05); captured leads not yet triaged hand into M02's triage queue. Any further entry points are not pinned by PRD — designer decides, note the decision.

## Composed home (M13-10, P0 — this screen is a role home)

This screen is the home of one preset on the precedence ladder, and **a person has exactly one
home, never two competing front doors**. Where the same person also holds another preset, that
preset's *today-work* is composed into THIS screen as a block rather than sent to a second home —
the PRD's own worked example is a rep who is also a surveyor landing on My Day **with today's
visits shown inside it**. The person can still switch: the shell's switcher (`SCR-SHELL-01`) lists
the home of every preset they hold. Design the block seams: this screen must be able to host one
or more foreign today-blocks without the layout breaking or the screen's own purpose being buried.
The ladder itself is a product constant, not tenant configuration (`M13-10`, register `Q5`).

## Requirements (verbatim)

### prd/modules/M03-marketing.md

- **M03-08** (P0) — **A campaign is one named object with six parts: a channel, an audience, content, a schedule, an owner and a state.** It is created, edited while draft, scheduled, run, paused, completed or cancelled — and it is never deleted once it has sent anything, because what it sent is part of the tenant's compliance record. _(non-UI half, build-side: a campaign that sent anything is archived, never deleted (compliance record) — for awareness, not for drawing)_

### prd/modules/M13-dashboards-and-reporting.md

- **M13-40** (P0) — **Marketing — home: live campaigns and what they captured** — each campaign with channel, state and its enquiries, captured leads not yet triaged, and the campaign reporting `M03` defines — rendered under `M03-56`'s list-not-model law and `M03-57`'s caveat rule.
- **M13-46** (P0) — **Cross-campaign and cross-channel reporting renders exactly what M03 publishes:** campaign identity, channel, audience size, send outcomes, captures — **with the correlation caveat on every derived figure, without exception** (`M03-57`'s condition on this module, accepted as law). The campaign→pipeline view stays a list of the CRM's own records (`M03-56`), scoped by the reader's lead visibility.

### prd/02-personas.md

- **PS-36** (P1) — The Marketing persona's **home screen is live campaigns and what they captured** — each campaign with its channel, its state and the enquiries it produced, plus captured leads not yet triaged into the pipeline, and whatever campaign-and-channel reporting M03 defines.

## States

- **loading**
- **empty** — no campaigns exist yet.
- **error**
- **normal** — campaigns listed, each with its channel, its state (one of the six honest lifecycle states of `M03-08`: draft, scheduled, sending, paused, completed, cancelled) and the enquiries it produced, plus captured leads not yet triaged (`M13-40`, `PS-36`).
- **new-campaign-channel-picker** — creation starts here with the channel chosen first, because the channel decides everything downstream (M03 §M03.2 behavior detail).
- **channel-stopped-flagged** — a campaign whose channel has stopped (broken connection, disconnected) is flagged in the list with that reason, never shown as silently healthy.
- **empty-teaching** — the empty state teaches what a campaign is and that creation begins with choosing a channel; channels not yet connected are never advertised as working features.
- **caveat-on-derived-figures** — every figure derived from campaign outcomes renders with the correlation caveat, without exception (`M13-46`).

## Data volume

Design at a tenant's full accumulated campaign history: campaigns are never deleted once they have sent anything (`M03-08`), so the list only grows — several live campaigns at once plus the archive behind them. Per-campaign capture volumes can be large (the PRD's own edge case is a channel that captured 200 leads, M03 §M03.3), and the untriaged-lead count sits alongside.

## Numbers carrying provenance

Each of these renders with its F8 provenance tier in the design:

- Per-campaign enquiry/capture count (`M13-40`, `PS-36`)
- Captured-leads-not-yet-triaged count (`M13-40`, `PS-36`)
- Any campaign-derived reporting figure surfaced here (audience size, send outcomes, captures — `M13-46`) — always with the correlation caveat beside it, without exception (`M13-46`)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state and a Context-of-use clause claiming no offline capability (register `Q15`). Both are deleted. `channel-stopped-flagged` refers to a marketing channel's connection, not the device's, and is untouched.*
