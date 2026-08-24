# SCR-M03-02 · Campaign Builder — Audience

Filter builder over CRM segments showing running count and itemised exclusions; aggregate-only, whole lead base, no record reads.

**Module:** M03 · Marketing · **Personas:** Marketing (holder of `F2.M03.build-campaign-audience`), EPC Owner (in a small firm the Owner *is* the marketing team) · **Context of use:** campaign authoring is desktop-first and fully functional on mobile — "the person composing a send to a thousand customers is at a desk, and the product must not pretend otherwise, but nothing here is web-only" (M03 §2).

## Entry & exit

Reached from: campaign creation on the Campaign List (SCR-M03-01), after the channel is chosen first — the channel decides which consent class the audience is filtered against (M03 §M03.2 behavior detail). Leads to: the content step (SCR-M03-03), then review (SCR-M03-04). A campaign cannot be scheduled from an unresolved audience (`M03-11`). Any other exit is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M03-marketing.md

- **M03-10** (P0) — **An audience is built from CRM segments — and the Marketing preset holds the audience-builder capability over the whole base, aggregate-only (owner ruling 2026-08-04, Q37: segments-yes-files-no).** The filter vocabulary is the CRM's own: lead source, stage, qualification facts, city/market, campaign history, customer-vs-lead, and the consent state the channel requires. **Audience building resolves over the tenant's full lead base for any holder of `F2.M03.build-campaign-audience`** — filters, counts and send-selection across all records — while **individual lead-file access is unchanged**: no lead file, value, note or timeline opens through the builder, and the Marketing preset's lead visibility stays *Own captures until triage* for record-level reads (`F2-12`–`F2-15` stand for files; the audience-builder capability is a distinct aggregate-only scope, recorded in F2's M03 matrix). A Marketing-only holder therefore campaigns to the whole base without ever reading a lead file they do not own. _(non-UI half, build-side: aggregate-only whole-base scope; no individual lead-file read through builder (Q37) — for awareness, not for drawing)_
- **M03-11** (P0) — **An audience is resolved to a count, with its exclusions itemised, before a campaign can be scheduled.** The pre-schedule summary states: records matched · excluded for missing channel address · excluded for no consent on this channel · excluded as suppressed (opted out, complained, previously undeliverable — `M03-47`) · **records that will actually be sent to**. A campaign cannot be scheduled from an unresolved audience, and the count is re-resolved at send time (`M03-14`).

## States

- **loading**
- **empty** — no filters applied yet; the builder works in counts, not in a browsable list of people (M03 §M03.2 behavior detail).
- **error**
- **resolving-count** — the running count is being resolved as filters are added or changed.
- **normal** — filters applied, running count shown, with the exclusion breakdown of `M03-11` beneath it (M03 §M03.2 behavior detail).
- **zero-audience** — the audience resolves to zero: the campaign cannot be scheduled and the summary says which exclusion removed everyone, so the author can fix the filter rather than guess (`M03-11`, M03 §M03.2 edge case).
- **exclusions-itemised** — every exclusion category itemised: excluded for missing channel address · excluded for no consent on this channel · excluded as suppressed (`M03-11`).

## Data volume

Design at the tenant's whole lead base: filters, counts and send-selection resolve across all records (`M03-10`) — an audience on the order of a thousand recipients is the PRD's own working scale (M03 §2). The exclusion summary carries the full `M03-11` breakdown (matched · missing address · no consent · suppressed · will actually be sent to) at those magnitudes. Never a browsable list of people — counts only.

## Numbers carrying provenance

Each of these renders with its F8 provenance tier in the design:

- Records matched — the running count as filters are added (`M03-10`, `M03-11`)
- Excluded for missing channel address (`M03-11`)
- Excluded for no consent on this channel (`M03-11`)
- Excluded as suppressed — opted out, complained, previously undeliverable (`M03-11`)
- Records that will actually be sent to (`M03-11`)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state and a Context-of-use clause stating audience resolution was online-only (register `Q15`). Both are deleted.*
