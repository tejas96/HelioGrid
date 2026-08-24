# SCR-M04-02 · Remote Survey — Address Entry

Confirm the exact building on a satellite preview before anything is fetched or metered.

**Module:** M04 · Survey · **Personas:** Sales Executive, Design Engineer, Sales Manager, EPC Owner, Survey Engineer · **Context of use:** "rep or designer, at a desk, minutes after the lead arrives" (M04 §2); Mode A is web-emphasis, mobile-complete — the rep who needs it most is often standing outside a customer's house on a phone.

## Entry & exit

Reached from: the Survey Mode Chooser's remote offer (SCR-M04-01). Address entry pre-fills from the lead's address where one exists so the rep is confirming rather than retyping (M04 §M04.2 behavior detail, `M04-07`'s budget). Leads to: confirming the building starts detection and the Remote Roof Review (SCR-M04-03); a coverage failure lands on Coverage Failure (SCR-M04-04); no tile at all continues on the blank canvas with manual outlining (M04-11, on the review canvas).

## Requirements (verbatim)

### docs/prd/modules/M04-survey.md

- **M04-02** (P0) — **Mode A — remote: an address becomes a designable roof, from a desk, in minutes, with no travel and nobody's time booked.** The operator supplies an address; the product fetches satellite imagery and available building-insights roof data, detects the roof outline, its obstructions and its pitch and azimuth, and returns an editable result. The source's claim is the requirement: *"The app can survey a roof without anyone going there"* — enough to **design and quote**. Every figure it produces is **derived from imagery** (M04-34). _(non-UI half, build-side: imagery fetch + roof detection pipeline; every figure stamped derived — for awareness, not for drawing)_
- **M04-08** (P0) — **Mode A starts at an address: search it, or drop a pin — and the building is shown highlighted on a satellite preview before anything is detected.** The operator confirms *that building*, visually, as the first act of the survey. Nothing is fetched, detected or metered until the building is confirmed.
- **M04-12** (P0) — **When the address resolves to the wrong building, the operator re-points it before anything is detected — and correcting the address corrects the site record.** The confirmation step of M04-08 exists for exactly this failure. A pin moved to the correct building updates the survey's location and the site record it belongs to, so the mistake is not re-made on the next visit or the next design. _(non-UI half, build-side: pin correction propagates to the site record — for awareness, not for drawing)_

Supporting behavior from the same doc (M04 §M04.2 behavior detail): the preview highlights the building the address resolved to, at a zoom where a person can recognise their own roof; if several buildings sit at one address — a common case in dense neighbourhoods and on commercial plots — the operator picks one, and that pick is part of the survey record.

## States

- loading
- empty
- error
- prefilled-from-lead
- search
- pin-drop
- building-highlighted
- multiple-buildings-disambiguation
- wrong-building-repoint

## Data volume

Address search results plus one satellite preview; disambiguation must handle several candidate buildings at one address (dense neighbourhoods and commercial plots, per the PRD). Design the disambiguation at a handful of buildings on one plot.

## Numbers carrying provenance

None shown as facts on this screen — nothing is fetched, detected or metered until the building is confirmed (M04-08). The imagery capture date and every derived figure appear on the review screen (SCR-M04-03) with their F8 tiers.
