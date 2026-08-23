# SCR-MS-10 · Studio Step 7 — Proposal

Wizard Step 7: shadow captures, readiness review, energy report, financing and comparison inside one two-phase step.

**Module:** M05 · Design Studio · **Personas:** Design Engineer (author), Sales Executive (review/generate), EPC Owner; the customer sees the results on the read-only share surface (F5/Q27), not this step · **Context of use:** the moment a design becomes a customer-ready story — worked at a desk or on a phone with web + mobile parity; every data readout must be touch-accessible per S6-7.1, because a sales person will walk a customer's finance team through these numbers on a phone.

## Entry & exit

Reached from: the studio wizard, advancing from Panel layout (SCR-MS-08). **Wizard-step gate that admits the user:** this step sits past the studio's one hard gate — invalid electrical blocks the layout step's Next with the reason stated (M05-49, MS6-28 on SCR-MS-08), so an electrically unsafe design never reaches this step; the readiness card's **Electrical design** item is "the only blocker, sharing the studio's hard gate" (MS7-11). On entry, the phase is decided by how many captures carry SAVED IMAGES — capture phase or review phase — and re-entry resumes at the first uncaptured shot (MS7-01). Leads to: each capture preset seeds the 3D scene's date/hour/solar-access mode (MS7-02 → SCR-MS-09, which stays live); Edit photos goes back into the capture studio (M05-59); each readiness item carries a jump button to the fixing step (M05-58); Generate Proposal — disabled while the verdict is blocked (MS7-13) — marks the design proposal-ready and hands numbers + captures to the proposal path-with-design (M05-61, the M06 builder); the wizard's Next continues to Step 8 — SLD & Drawings (SCR-MS-11).

## Requirements (verbatim)

### prd/modules/M05-studio/06-step7-proposal.md

- **MS7-01** (P0) — Two-phase screen: capture phase then review phase; entry phase decided by how many captures carry SAVED IMAGES — not by record count (S6-7.7 fixes `.2`) — and re-entry resumes at the first uncaptured shot (`.1/.3`, fixes `.3`'s always-shot-1).
- **MS7-02** (P0) — Exactly four fixed presets (summer morning, summer noon, winter morning, winter noon-class) each seeding the 3D scene's date/hour/solar-access mode (`.7/.8`).
- **MS7-03** (P0) — The scene stays live after seeding; the saved capture records the ACTUAL sun position at the moment of capture, so a caption can never describe a different sun than the picture (S6-7.5 fixes `.9`). _(non-UI half, build-side: saved capture records actual sun position at capture moment — for awareness, not for drawing)_
- **MS7-04** (P0) — Capture control, progress counter ("N/4" counting saved images), numbered shot buttons with captured state, auto-advance to the next uncaptured shot, and Skip-to-review always available (`.10–.13/.15`).
- **MS7-06** (P0) — Save failures are surfaced and PERSIST across shot switches and into review until resolved (S6-7.6 fixes `.16/.17`).
- **MS7-07** (P1) — Image bytes are stored out-of-project with the project holding references only; rendering handles missing blobs gracefully (`.36`). _(non-UI half, build-side: image bytes stored out-of-project; project holds references only — for awareness, not for drawing)_
- **MS7-08** (P0) — A capture is STALE when the layout it was taken against no longer matches the current layout; stale tiles carry a badge (`.30/.31`). _(non-UI half, build-side: staleness = capture layout no longer matches current layout — for awareness, not for drawing)_
- **MS7-10** (P0) — The cover preview itself carries the staleness badge (S6-2 fixes `.34`), and the readiness card checks cover freshness, not just capture count (S6-2 fixes `.27`).
- **MS7-11** (P0) — Four review items with a worst-of-four verdict: **Electrical design** (the only blocker, sharing the studio's hard gate) · **Design review** (open insights) · **Quantity confidence** (BOM) · **Shadow imagery** (count AND freshness per MS7-10) (`.19–.26`).
- **MS7-13** (P0) — Generate Proposal is disabled while the verdict is blocked (fixes `.42`'s always-enabled button); the two proposal entry points converge on one state (S6-7 note fixes `.134`) (`.41/.43`).
- **MS7-14** (P0) — System summary shows capacity, panels, annual generation and area — every number carrying its provenance and freshness label, with no undefined placeholders (S6-1b fixes `.38/.39`) (`.37`).
- **MS7-20** (P0) — Inverter clipping is modelled from the inverter AC limit × count; where clipping is material the surfaces say so (S6-6 fixes `.65`). _(non-UI half, build-side: clipping modelled from inverter AC limit times count — for awareness, not for drawing)_
- **MS7-22** (P0) — Transposition model: beam-only ratio by numeric integration with a stated diffuse share, project-wide azimuth convention, and cached results keyed on site/orientation — model boundaries stated in the surfaces that use it, not only in code (`.71–.75`, S6-1b provenance law). _(non-UI half, build-side: beam-only transposition by numeric integration, cached by site/orientation — for awareness, not for drawing)_
- **MS7-31** (P0) — Self-consumption/export is an EXPLICIT, editable, stated assumption — not an implicit 100% retail offset (S6-3d fixes `.87`). _(non-UI half, build-side: model never assumes implicit 100% retail offset — for awareness, not for drawing)_
- **MS7-34** (P0) — Financing: four options from one cost basis with pack-driven terms — and the lease amortises the SAME net basis as the others (S6-3c fixes `.98`); the PPA reconciliation contract holds; first-year negatives are shown honestly; no eligibility/credit claims are made (`.93/.95–.97/.99–.102`). _(non-UI half, build-side: one cost basis; lease amortises same net basis; PPA reconciliation — for awareness, not for drawing)_
- **MS7-40** (P0) — The sheet is a pure function of the project, recomputing rather than caching, with a freshness banner while shading recalculates (`.121/.122`). _(non-UI half, build-side: report sheet is pure recompute, never cached — for awareness, not for drawing)_
- **MS7-41** (P0) — Section order and content per the census: system summary, annual-generation hero with provenance line (driven by the actual path, `.125`), monthly bars, loss breakdown, totals, 25-year projection, financials, financing (`.123/.124/.130/.131/.133`).
- **MS7-42** (P0) — Monthly figures are readable on TOUCH — not hover-only (S6-7.1 fixes `.127`); the loss chart is scaled to the data so the dominant loss is visible (S6-7.2 fixes `.128`); money uses pack formatting with no internal shorthand (S6-7.3 fixes `.132`); chart colours come from the design system (`.129`, F7).
- **MS7-47** (P0) — No scoring black box: every candidate runs through the SAME pure pipelines the design itself uses, with the unshaded-basis honesty contract stated verbatim in the UI (`.143/.144`). _(non-UI half, build-side: candidates run same pure pipelines as the design — for awareness, not for drawing)_
- **MS7-49** (P0) — A warning never hides; feasibility notes distinguish causes; the recommendation rule is stated on screen (`.149–.151`).
- **MS7-51** (P0) — Basis and decision cards state objective, target, catalog version and assumptions (`.153`); memoization keys on the design fingerprint (`.154`); complexity and efficiency derivations are stated where shown (`.155/.156`). _(non-UI half, build-side: memoization keyed on design fingerprint — for awareness, not for drawing)_

### prd/modules/M05-design-studio.md

- **M05-57** (P0) — **Capture studio: four fixed shots, each naming its name/date/hour** — Summer Morning 9:00 · Summer Noon 12:00 · Solar Access (Summer) 12:00 · Solar Access (Winter) 12:00. Controls: Capture (from the current 3D view); "Shadow captures: N of 4" progress; four numbered shot buttons (tick when captured; tap to jump/retake); auto-advance to the next uncaptured shot; **the first capture auto-becomes the cover image**; Skip to review. A save failure (storage full / private browsing) is honest and offers a remedy.
- **M05-58** (P0) — **Review: the "Before you issue" readiness card with verdict NOT READY · READY WITH CAVEATS · READY TO ISSUE.** Each checked item shows status (ready / needs attention / blocking), its meaning in plain language, and a jump button to the fixing step. The card composes the studio's honesty state: electrical validity, captures present/fresh, sanctioned-load warning, engineer-confirmation flags, staleness.
- **M05-59** (P0) — **The review shows the census's evidence surface:** cover image preview (or "no cover captured yet"); the shadow set of four — image or "Not captured", name, date/hour, **"OUTDATED — RETAKE" when the design changed since**, cover marker or "SET AS COVER"; system summary (kWp, panel count × watts, avg solar access %, annual generation); Edit photos back into the capture studio.
- **M05-61** (P0) — **Generate proposal marks the design proposal-ready and hands numbers + captures to the proposal path-with-design.** Mandatory-component and payable-floor checks are the proposal builder's Generate-time checks (`modules/M06`, per `R12`); this module guarantees the hand-off's content and its honesty labels. _(non-UI half, build-side: hand-off contract to M06; mandatory checks run at M06 Generate — for awareness, not for drawing)_

## States

- loading — no number renders as a placeholder while it resolves: the system summary carries provenance and freshness labels with **no undefined placeholders** (MS7-14), and the report sheet is a pure recompute of the project rather than a cache, so a recompute in flight shows its freshness banner rather than an empty or stale figure (MS7-40).
- empty — no capture carries a saved image: the step opens in **capture phase** (entry phase is decided by saved images, not record count, MS7-01), the cover preview reads "no cover captured yet" and each of the four slots reads "Not captured" with its name and date/hour (M05-59, M05-57).
- error — a capture save failure is this screen's error surface, and it is sticky: it is surfaced and PERSISTS across shot switches and into review until resolved (MS7-06), stated honestly with its cause and a remedy — storage full, private browsing (M05-57). Separately, a missing image blob renders gracefully rather than breaking the review (MS7-07), and the readiness card reports blocked/needs-attention items as its own verdict, not as an error state (M05-58, MS7-11).
- capture-phase
- review-phase
- resume-at-uncaptured (re-entry resumes at the first uncaptured shot)
- capture-progress-n-of-4 ("N/4" counting saved images)
- not-captured (slot shows "Not captured")
- save-failed-persistent / save-error-with-remedy (honest save failure — storage full / private browsing — persisting across shot switches and into review until resolved)
- stale-capture / outdated-retake ("OUTDATED — RETAKE" when the design changed since)
- stale-cover (the cover preview itself carries the staleness badge)
- no-cover-yet ("no cover captured yet")
- verdict-not-ready / verdict-ready-with-caveats / verdict-ready-to-issue (worst-of-four readiness verdict)
- verdict-blocked-generate-disabled (Generate Proposal disabled while the verdict is blocked)
- recalculating-banner (freshness banner while shading recalculates)
- missing-image (rendering handles missing blobs gracefully)
- no-payback (the money model reports a system that never pays back exactly as that)
- energy-report-open
- comparison-open (candidates, basis and decision cards)
- clipping-material (where clipping is material the surfaces say so)

## Data volume

Four capture slots each with name/date/hour and captured/stale state; a four-item readiness card; an energy report with a system summary, an annual-generation hero, 12 monthly bars readable on touch, a multi-line loss breakdown scaled to the data, totals, a 25-year projection, financials and four financing option cards; a comparison surface whose candidates each run the full pipelines with basis and decision cards. All computed for a 221-panel design.

## Numbers carrying provenance

- System summary: capacity, panels, annual generation, area — **every number carrying its provenance and freshness label, with no undefined placeholders** (MS7-14); review-phase summary: kWp, panel count × watts, avg solar access %, annual generation (M05-59)
- Capture name/date/hour per shot (M05-57) and the ACTUAL sun position recorded at the moment of capture (MS7-03) — a caption can never describe a different sun than the picture
- "Shadow captures: N of 4" progress — counts saved images, not records (M05-57, MS7-04)
- Annual-generation hero — provenance line driven by the actual computation path (MS7-41)
- Monthly bars and loss breakdown (MS7-41, MS7-42) — the dominant loss visible; chart colours from the design system, not prescribed here
- Inverter clipping — where material, the surfaces say so (MS7-20)
- Transposition model boundaries — stated in the surfaces that use it (MS7-22)
- Self-consumption/export share — an EXPLICIT, editable, stated assumption (MS7-31)
- Financing figures: four options from one cost basis, pack-driven terms, first-year negatives shown honestly, no eligibility/credit claims (MS7-34); money uses pack formatting with no internal shorthand (MS7-42)
- 25-year projection and financials (MS7-41) — recomputed, never cached (MS7-40)
- Comparison basis and decision cards: objective, target, catalog version and assumptions stated; complexity and efficiency derivations stated where shown (MS7-51); the unshaded-basis honesty contract stated verbatim in the UI (MS7-47); the recommendation rule stated on screen (MS7-49)

Every user-visible figure carries its F8 provenance tier in the design; freshness labels ride with provenance on the summary numbers (MS7-14) and staleness badges on every capture and the cover (MS7-08, MS7-10).
