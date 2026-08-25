# SCR-M04-03 · Remote Roof Review

Review the detected roof as an editable overlay on the pinned tile: accept, adjust or reject.

**Module:** M04 · Survey · **Personas:** Sales Executive, Design Engineer, Sales Manager, EPC Owner, Survey Engineer · **Context of use:** Mode A's decision point, "built to be argued with" (M04 §M04.3 behavior detail). Web-emphasis — the map, the detection overlay and the vertex-level adjustment want a large viewport and a pointer — and mobile-complete because the rep is often outside the customer's house.

## Entry & exit

Reached from: confirming the building on Address Entry (SCR-M04-02) starts detection and lands here; a coverage failure diverts to Coverage Failure (SCR-M04-04) whose manual-outline route returns here on the blank canvas. Leads to: the remote survey ends on the Gaps to Fill screen (SCR-M04-05, per M04-29); the reviewed result is handed to `modules/M05-design-studio.md` as a validated artifact (M04 §M04.3, `M04-24`). Reject leaves the operator on the manual outline with nothing lost (M04-15).

## Requirements (verbatim)

### docs/prd/modules/M04-survey.md

- **M04-02** (P0) — **Mode A — remote: an address becomes a designable roof, from a desk, in minutes, with no travel and nobody's time booked.** The operator supplies an address; the product fetches satellite imagery and available building-insights roof data, detects the roof outline, its obstructions and its pitch and azimuth, and returns an editable result. The source's claim is the requirement: *"The app can survey a roof without anyone going there"* — enough to **design and quote**. Every figure it produces is **derived from imagery** (M04-34). _(non-UI half, build-side: imagery fetch + roof detection pipeline; every figure stamped derived — for awareness, not for drawing)_
- **M04-11** (P0) — **Imagery failure never blocks a survey: the flow continues on a blank canvas with manual outlining and known-distance calibration.** Where no tile can be fetched at all, the operator can still outline the roof by hand and establish scale from a known distance, and the survey proceeds. *"Never blocks."* _(non-UI half, build-side: imagery failure never blocks the survey — for awareness, not for drawing)_
- **M04-13** (P0) — **Imagery age is a stated fact on the review screen, not a discovery made later.** The capture date of the tile is shown beside the detected roof, and the operator is asked the one question the imagery cannot answer — *has this roof changed since?* A "yes" marks the remote result **unreliable** (mode rule 4, M04-05), records that mark on the survey so the designer sees it, and offers to book a physical visit.
- **M04-14** (P0) — **Detection reports honest progress and fails gracefully.** The waiting state names what is actually happening, in the source's own words — *"fetching imagery · detecting roof · estimating shading"* — rather than an unqualified spinner, and each step can fail on its own without taking the survey down with it. A failed step says which step failed and what remains available.
- **M04-15** (P0) — **A detected roof is never applied silently. The result is an editable overlay and the operator must accept, adjust or reject it.** The outline, the obstructions, the pitch and the area arrive as a proposal from a detector, drawn over the pinned tile, and nothing enters the survey until a person acts on it. **A detected roof that is obviously wrong must always be correctable** — every vertex, every obstruction, every value the detector produced is editable, and rejecting the whole result is a first-class choice that leaves the manual outline available. **The corrector set is final (owner ruling 2026-08-04, Q25): anyone who can run the remote survey — rep, surveyor or designer — accepts, adjusts or rejects**, with studio re-verification and provenance labels as the safety net; the homeowner's route is the link's question affordance (`F5-56`), never an edit. _(non-UI half, build-side: never applied silently; corrector set = anyone who runs remote survey — for awareness, not for drawing)_
- **M04-16** (P0) — **Confidence is shown per detection, beside the thing it qualifies.** Not one score for the survey: the outline, each obstruction and each derived value carry the detector's confidence where they are read, as persistent visible content — never a hover, never colour alone (`F8-07`). A detection whose confidence cannot be established is not presented as a detection.
- **M04-21** (P0) — **Detection failure is never a hard error, and an unavailable detection capability is hidden gracefully rather than shown broken.** If detection fails, the operator traces the roof manually and the survey continues. If the capability is not configured or not available at all, its entry points are simply not offered — no dead button, no error the operator cannot act on. *"Never a hard error."* _(non-UI half, build-side: unavailable capability hides its entry points entirely — for awareness, not for drawing)_
- **M04-22** (P0) — **Manual outlining is always available, always sufficient, and never metered.** Every remote survey can be completed entirely by hand — outline, obstructions, pitch, area — with no detection at all. This is the guarantee that makes every other rule in this section safe: a tenant with no coverage, no allowance, no coverage, no allowance or no trust in the detector can still produce a designable roof. _(non-UI half, build-side: manual path never metered, always sufficient — for awareness, not for drawing)_
- **M04-23** (P0) — **AI roof detection is a metered capability: allowance is checked before the call, a denial blocks only the detection, and a detection that returns no result never bills.** The meter, its bundles, its overage and the tier entitlements are `04-business-model.md`'s (`BM-16`, `BM-19`) and `modules/M12-platform-billing.md`'s enforcement — this module states no rate, bundle size or price. What it owns is the behaviour at the boundary: the check happens **before** the detector is called, a denial is an honest message naming the allowance and pointing at the manual path, and a run that returns nothing is not counted. _(non-UI half, build-side: allowance checked before the call; empty result never bills — for awareness, not for drawing)_

Supporting behavior from the same doc (M04 §M04.3 behavior detail): obstructions are individually selectable; adjust is direct manipulation — vertices drag, obstructions move and resize, a value can be typed over — and every operator edit re-tiers that value from `derived` to the tier a typed figure carries, shown at the moment of the change (`F8-05`). An empty detection result is a correct and expected outcome that leads straight to manual outlining (M04-17, cited for flow context; the row belongs to the build side of this slice's M04-21/M04-22 guarantees).

## States

- loading (detecting-progress: "fetching imagery · detecting roof · estimating shading")
- empty (detection-empty: no roof produced; manual outline offered)
- error (detection-step-failed: names which step failed and what remains available)
- detecting-progress
- detection-step-failed
- detection-empty
- manual-outline
- blank-canvas-calibration (no tile at all: manual outline plus known-distance calibration)
- imagery-age-shown (capture date beside the detected roof; changed-roof question asked)
- roof-changed-unreliable (a "yes" marks the remote result unreliable; visit offered)
- confidence-floored (poor overlap with the confirmed building lowers the shown confidence; flagged for review)
- allowance-denied (honest message naming the allowance, manual path offered in the same message)
- capability-hidden (detection unavailable or unconfigured: entry points not offered at all)

## Data volume

One pinned satellite tile with an editable overlay: a roof outline with draggable vertices, several individually selectable detected obstructions each carrying its own confidence, and the derived values (pitch, azimuth, area) each with confidence beside them. Design for a roof with multiple obstructions, every one of them selectable and editable.

## Numbers carrying provenance

Every figure this screen shows carries its F8 tier in the design:

- Pitch — `derived` (per-detection confidence beside it); re-tiers when typed over, with the change shown (`F8-05`)
- Azimuth — `derived` (per-detection confidence beside it); re-tiers when typed over
- Area — `derived` (per-detection confidence beside it); re-tiers when typed over
- Per-detection confidence values (outline, each obstruction, each derived value) — persistent visible content, never a hover, never colour alone (`F8-07`)
- Imagery tile capture date — a stated fact on this screen (M04-13)
- Known-distance calibration figure — entered by a person (blank-canvas path, M04-11)
