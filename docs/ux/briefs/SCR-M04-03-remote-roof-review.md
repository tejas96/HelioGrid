# SCR-M04-03 · Remote Roof Review

Outline the roof by hand on the pinned tile: the outline, its obstructions, pitch, azimuth and area.

**Module:** M04 · Survey · **Personas:** Sales Executive, Design Engineer, Sales Manager, EPC Owner, Survey Engineer · **Context of use:** Mode A's drawing step (M04 §M04.3). Web-emphasis — the map and the vertex-level drawing want a large viewport and a pointer — and mobile-complete because the rep is often outside the customer's house.

## Entry & exit

Reached from: confirming the building on Address Entry (SCR-M04-02) fetches the tile and lands here; a coverage failure diverts to Coverage Failure (SCR-M04-04) whose manual-outline route returns here on the blank canvas. Leads to: the remote survey ends on the Gaps to Fill screen (SCR-M04-05, per M04-29); the outlined roof travels with the survey to `modules/M05-design-studio.md` (M04-63).

## Requirements (verbatim)

### docs/prd/modules/M04-survey.md

- **M04-02** (P0) — **Mode A — remote: an address becomes a designable roof, from a desk, in minutes, with no travel and nobody's time booked.** The operator supplies an address; the product fetches satellite imagery, and the operator outlines the roof, its obstructions and its pitch and azimuth on it by hand. The source's claim is the requirement: *"The app can survey a roof without anyone going there"* — enough to **design and quote**. Every figure it produces is **derived from imagery** (M04-34).
- **M04-11** (P0) — **Imagery failure never blocks a survey: the flow continues on a blank canvas with manual outlining and known-distance calibration.** Where no tile can be fetched at all, the operator can still outline the roof by hand and establish scale from a known distance, and the survey proceeds. *"Never blocks."* _(non-UI half, build-side: imagery failure never blocks the survey — for awareness, not for drawing)_
- **M04-13** (P0) — **Imagery age is a stated fact on the review screen, not a discovery made later.** The capture date of the tile is shown beside the outlined roof, and the operator is asked the one question the imagery cannot answer — *has this roof changed since?* A "yes" marks the remote result **unreliable** (mode rule 4, M04-05), records that mark on the survey so the designer sees it, and offers to book a physical visit.
- **M04-22** (P0) — **Every roof is outlined by hand, and outlining is never metered.** The operator traces the outline, the obstructions, the pitch and the area on the pinned tile of `M04-10`, or on a blank canvas when no tile could be fetched (`M04-11`); the product detects nothing (owner ruling 2026-11-01). Every remote survey is completed this way, and no allowance, tier or billing state bounds it.

Supporting behavior from the same doc (M04 §M04.3 behavior detail): vertices place and drag, obstructions are added and resized, and pitch, azimuth and area are typed or estimated; every figure carries the tier F8 assigns it — an outline traced on imagery is `derived`, a typed figure outside the physical-survey flow is `assumed` (`F8-21`). The product detects nothing (owner ruling 2026-11-01).

## States

- loading (the tile is loading)
- empty (no outline drawn yet; the drawing hint shown)
- error (the tile failed: the blank-canvas path offered)
- manual-outline
- blank-canvas-calibration (no tile at all: manual outline plus known-distance calibration)
- imagery-age-shown (capture date beside the outlined roof; changed-roof question asked)
- roof-changed-unreliable (a "yes" marks the remote result unreliable; visit offered)

## Data volume

One pinned satellite tile with a roof outline drawn on it: draggable vertices, several obstructions each selectable and editable, and the values pitch, azimuth and area. Design for a roof with multiple obstructions.

## Numbers carrying provenance

Every figure this screen shows carries its F8 tier in the design:

- Pitch — `derived` when traced on imagery; re-tiers when typed over, with the change shown (`F8-05`)
- Azimuth — `derived` when traced on imagery; re-tiers when typed over
- Area — `derived` when traced on imagery; re-tiers when typed over
- Imagery tile capture date — a stated fact on this screen (M04-13)
- Known-distance calibration figure — entered by a person (blank-canvas path, M04-11)
