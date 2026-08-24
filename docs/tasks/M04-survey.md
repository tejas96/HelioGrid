# M04 · Survey — engineering tasks

This file covers module M04 — Survey: the two survey modes and the mode decision, Mode A's address entry, imagery and the pinned tile, AI roof detection with per-detection confidence and the editable overlay, coverage failure and its honest fallback, the "what remote cannot tell you" gaps list, the derived-vs-measured honesty consequence, Mode B's visits home, guided capture and the five capture groups, review & submit, photographs as reference and never measurement, visits, versions and the survey record, and the survey → design hand-off. Task-id prefix: `T-M04-`. Source doc: `docs/prd/modules/M04-survey.md` (rows M04-01 … M04-66). Screen briefs live in `docs/ux/briefs/` (SCR-M04-01 … SCR-M04-10); ten screen tasks carry one screen each, seven engine/integration tasks carry the non-screen builds, and ten policy rows are laws enforced through screens and review. Every row's disposition is indexed at the end of this file.

---

### T-M04-001 · Survey Mode Chooser screen

**Type:** screen · **Tier:** P0
**PRD rows:** M04-05 (P0)
**DESIGN:** SCR-M04-01 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M04-01-survey-mode-chooser.md`; they are the specification.
**DONE WHEN:**

- Given a lead with a confirmed address, when a survey is started, then both modes are offered and the mode applicable to that lead's segment is stated with its rule (M04-01, M04-05).
- Given a commercial & industrial lead, when a proposal is about to be built on a remote-only survey, then the "physical always before quoting" rule is stated on that screen (M04-05).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M04-002 · Remote Address Entry screen

**Type:** screen · **Tier:** P0
**PRD rows:** M04-08 (P0), M04-12 (P0)
**DESIGN:** SCR-M04-02 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M04-02-remote-address-entry.md`; they are the specification.
**DONE WHEN:**

- Given an address search or a dropped pin, when the preview renders, then the resolved building is highlighted and no imagery is consumed or metered until the operator confirms it (M04-08).
- Given a resolved address the operator identifies as the wrong building, when the pin is moved, then the survey and the site record both carry the corrected location (M04-12).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M04-003 · Remote Roof Review screen

**Type:** screen · **Tier:** P0
**PRD rows:** M04-11 (P0), M04-13 (P0), M04-14 (P0), M04-15 (P0), M04-16 (P0), M04-21 (P0), M04-22 (P0), M04-23 (P0)
**DESIGN:** SCR-M04-03 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M04-03-remote-roof-review.md`; they are the specification.
**DONE WHEN:**

- Given a tile that cannot be fetched, when the operator continues, then a blank canvas with manual outlining and known-distance calibration is available and the survey can be completed (M04-11).
- Given a fetched tile, when the review screen renders, then the tile's capture date is shown and the changed-roof question is asked; and given a "yes", then the survey is marked remote-unreliable and a physical visit is offered (M04-13).
- Given a confirmed building, when detection runs, then the progress state names the step in progress and a failure of any step leaves the survey usable (M04-14).
- Given a returned detection, when the review screen renders, then nothing has been written to the survey, every element is editable, and accept / adjust / reject are all available (M04-15).
- Given a returned detection, when it renders, then each detected element shows its own confidence as persistent visible content, not on hover and not by colour alone (M04-16).
- Given detection fails, when the operator continues, then no error blocks the survey and manual tracing is available; and given the detection capability is not available at all, then its entry points are not offered rather than shown broken (M04-21).
- Given an exhausted detection allowance, when detection is attempted, then it is refused with the reason named, the manual outline is offered, and no detection is billed (M04-22, M04-23).
- Given a detection that returned no result, when the usage record is read, then no detection was counted (M04-23).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M04-004 · Coverage Failure screen

**Type:** screen · **Tier:** P0
**PRD rows:** M04-26 (P0)
**DESIGN:** SCR-M04-04 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M04-04-coverage-failure.md`; they are the specification.
**DONE WHEN:**

- Given an address with no detailed roof data, when the survey reaches detection, then the coverage-failure message renders verbatim and both the manual-outline and book-a-visit routes are offered (M04-26).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M04-005 · Gaps to Fill screen

**Type:** screen · **Tier:** P0
**PRD rows:** M04-29 (P0), M04-30 (P0), M04-31 (P0), M04-32 (P0)
**DESIGN:** SCR-M04-05 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M04-05-gaps-to-fill.md`; they are the specification.
**DONE WHEN:**

- Given a completed remote detection, when the flow continues, then the gaps screen renders with all five items present (M04-29, M04-30).
- Given any gap, when it is acted on, then it takes exactly one of the four resolutions and its resolution, actor and reason (where waived) are recorded (M04-31).
- Given open capture-on-site gaps, when a physical visit is booked, then that visit's guided capture opens with those steps present and identified as the reason for the visit (M04-32).
- Given a gap resolved as **ask the customer** in a tenant with a connected transactional channel, when the question is produced, then it sends from that channel under the transactional template class with its delivery state shown honestly; and given no connected channel, then it is composed for the rep to send and no delivery is claimed (M04-31 resolution set, `M03-03`, M04 §"No survey-side send machinery of its own", owner ruling 2026-08-04 Q33). This module builds no send machinery of its own.
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M04-006 · My Visits Today screen

**Type:** screen · **Tier:** P0
**PRD rows:** M04-38 (P0), M04-58 (P0), M04-59 (P0)
**DESIGN:** SCR-M04-06 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M04-06-my-visits-today.md`; they are the specification.
**DONE WHEN:**

- Given a Survey Engineer signing in, when the app opens, then today's visits are the landing surface with address, customer, time, distance, one-tap navigation and one-tap call (M04-38).
- Given a visit that cannot be completed in a tenant with a connected transactional channel, when the surveyor records it, then a reason is required, the reschedule flow opens, and exactly one message sends from that channel under the transactional template class with its delivery state shown honestly; and given no connected channel, then that one message is composed for a person to send and no delivery is claimed (M04-58, `M03-03`, owner ruling 2026-08-04 Q33). Exactly one message exists on either branch — no surface may generate a second for the same visit (M04-58, `M02-48`).
- Given a wrong address discovered on site, when it is corrected, then the site record carries the corrected address (M04-59).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M04-007 · Guided Capture screen

**Type:** screen · **Tier:** P0
**PRD rows:** M04-03 (P0), M04-42 (P0), M04-43 (P0), M04-44 (P0), M04-45 (P0), M04-47 (P0), M04-54 (P0)
**DESIGN:** SCR-M04-07 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M04-07-guided-capture.md`; they are the specification.
**DONE WHEN:**

- Given a completed physical survey, when it is read, then it carries the on-site facts a remote survey cannot establish — the meter and its panel, roof condition, access, and shading not visible from above — each tiered `measured` except where the surveyor estimated it (M04-03).
- Given a physical survey, when the guided flow runs, then all five groups are present, progress is shown, every step can be skipped, and every skipped step is flagged on the record (M04-42, M04-43).
- Given any capture step requiring a photograph, when the camera is opened, then it opens inline and the application is not left (M04-43 behavior detail).
- Given an inaccessible roof, when it is recorded, then an access constraint exists on the survey and appears in the designer's hand-off (M04-44).
- Given a meter photograph, when the sanctioned load is recorded, then the value was entered by a person and is carried to the design as a warning input rather than a clamp (M04-45).
- Given low device storage, when a capture is about to start, then the surveyor is warned first and offered compression, and no unacknowledged original is evicted (M04-47).
- Given any photograph, when it is attached, then it carries a tag and a source, and where it concerns an obstruction it can be pinned to that obstruction (M04-54).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M04-008 · Shading Capture Sketch screen

**Type:** screen · **Tier:** P0
**PRD rows:** M04-46 (P0)
**DESIGN:** SCR-M04-08 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M04-08-shading-capture-sketch.md`; they are the specification.
**DONE WHEN:**

- Given an obstruction, when it is added, then it carries a photograph, a person-entered height and a position on the roof sketch, and no height is derived from the photograph (M04-46).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M04-009 · Review & Submit screen

**Type:** screen · **Tier:** P0
**PRD rows:** M04-37 (P0), M04-49 (P0), M04-50 (P0), M04-52 (P0)
**DESIGN:** SCR-M04-09 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M04-09-review-submit.md`; they are the specification.
**DONE WHEN:**

- Given a site with a remote survey, when a physical survey is submitted for it, then the provenance change is stated before it commits and the earlier version remains readable (M04-37).
- Given a completed capture, when review renders, then captured, missing and flagged items are each listed and every missing or flagged item is one tap from the step that fills it (M04-49).
- Given a missing meter photograph, when review renders, then the line states the consequence in plain language rather than a validation error (M04-50).
- Given a submitted survey, when the submission is applied, then the survey is in its submitted state and the design side is notified with the survey, its photographs, its flagged items and its open gaps (M04-52).
- Given the same submission delivered twice, when the server applies it, then the designer is notified exactly once (M04-52, `F4-07`).
- Given a completed survey, when the customer is updated, then the update states that the survey is done and names the date by which the proposal will reach them (`F5-14`).
- Given a physical survey, when its submission commits, then the promise-with-a-date confirmation of `F5-14` — *"Survey done. Your proposal will reach you by <date>."* — is composed from the registry's `survey_complete` template (`F6-26`, `docs/tasks/F-platform.md` T-FPLAT-021) with the date resolved, and sends from the tenant's connected transactional channel; and given no connected channel, then it is composed for a person to copy and send and no delivery is claimed (`F5-14`, `M03-03`, owner ruling 2026-08-04 Q33). Where the survey is remote the customer experiences nothing at this step (`F5-14`), and the submission raises no such confirmation.
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M04-010 · Survey Detail (survey → design hand-off) screen

**Type:** screen · **Tier:** P0
**PRD rows:** M04-28 (P0), M04-63 (P0), M04-64 (P0)
**DESIGN:** SCR-M04-10 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M04-10-survey-detail.md`; they are the specification.
**DONE WHEN:**

- Given any completed remote survey, when the designer opens it, then the path that produced the roof — detected, adjusted or hand-outlined — is stated (M04-28).
- Given a survey with open gaps, when the designer opens it, then the open gaps are listed with their states (M04-33, M04-63).
- Given a submitted survey, when the designer opens it, then every item of `M04-63`'s list is present and attributable (M04-63).
- Given a survey with missing, waived or low-confidence content, when the designer opens it, then each is stated as prominently as the captured content (M04-64).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M04-011 · Mode A remote pipeline: imagery fetch, building-insights and the pinned tile

**Type:** integration · **Tier:** P0
**PRD rows:** M04-02, M04-09, M04-10
**Requirements (verbatim):**

- **M04-02** (P0) — **Mode A — remote: an address becomes a designable roof, from a desk, in minutes, with no travel and nobody's time booked.** The operator supplies an address; the product fetches satellite imagery and available building-insights roof data, detects the roof outline, its obstructions and its pitch and azimuth, and returns an editable result. The source's claim is the requirement: *"The app can survey a roof without anyone going there"* — enough to **design and quote**. Every figure it produces is **derived from imagery** (M04-34).
- **M04-09** (P0) — **Satellite imagery and building-insights roof data are vendor-neutral capability requirements, and they are an enhancement — never a dependency.** The product requires *a* capability that returns imagery for a location and *a* capability that returns roof data where it exists; the v1 services behind them are reference implementations (Google Solar Building Insights and elevation/DSM data). The binding law is the source's: *"No feature depends on [the roof-data provider] existing"*, and any failure *"simply means the studio starts from manual tracing"*.
- **M04-10** (P0) — **The imagery tile is fetched once per site capture and pinned: the tile a roof was traced on never changes under it.** The stored tile is what detection runs against and what the operator and, later, the designer see — one image, one coordinate mapping, for the life of that survey version. A newer tile becoming available does not silently replace it; it is offered as a new capture.

**DONE WHEN:**

- Given an address with roof data available, when the remote survey completes, then a designable roof — outline, obstructions, pitch and area — exists with nobody having visited the site, and every figure it produced carries `derived` (M04-02).
- Given a confirmed building, when the survey is later reopened or opened by the designer, then the same stored tile is shown and the same coordinate mapping applies (M04-10).
- Given the imagery or roof-data capability is unavailable, unconfigured or silent for this address, when the survey continues, then every remaining step still completes through the manual path and no capability of this module has been removed from the flow (M04-09).

---

### T-M04-012 · AI roof detection engine: two honest, deterministic paths

**Type:** engine · **Tier:** P0
**PRD rows:** M04-17, M04-18, M04-19, M04-20
**Requirements (verbatim):**

- **M04-17** (P0) — **An empty result beats an invented roof.** The detector is instructed not to guess, and returning nothing is a correct and expected outcome that leads straight to manual outlining. No surface in this module fills a missing detection with a plausible shape, a default rectangle or an average pitch.
- **M04-18** (P0) — **There are two detection paths and both are held to the same honesty rules: elevation-model plane fitting where elevation data exists, and a vision-model fallback that returns shapes only.** The fallback exists because elevation coverage is thinner than imagery coverage; it produces geometry and nothing else — it never returns a figure the product would present as a measurement. **Every detection records its own provenance: which path produced it, against which pinned tile, and at which detector version.** Both paths are required to be **deterministic and schema-constrained** — a detector returning free-form output, or a different answer each time for the same tile, does not satisfy this requirement — and **both exit through the same artifact validation** (M04-24).
- **M04-19** (P0) — **Detection runs against the exact tile the operator is looking at, pixel for pixel.** The overlay a person accepts or adjusts is registered 1:1 with the stored tile of `M04-10` — there is no second image, no re-projection between detecting and reviewing, and no coordinate drift between what was detected and what is drawn.
- **M04-20** (P1) — **Where a detected roof barely overlaps the building the operator confirmed, its confidence is floored.** A geometry cross-check compares the detected outline against the confirmed building footprint; a poor overlap lowers the confidence shown rather than being silently accepted, so the review screen tells the operator that this one needs looking at.

**DONE WHEN:**

- Given imagery from which no roof can be determined, when detection completes, then no roof is produced and the manual outline is offered (M04-17).
- Given an accepted detection, when the survey is read later, then the capability, the pinned tile and the detector version that produced it are recorded against it (M04-18).
- Given a detection result, when the overlay is drawn on the pinned tile, then it registers pixel for pixel against that tile, and an adjustment made on the overlay lands at the same place when the survey is reopened or opened by the designer (M04-19).
- Given a detection whose outline barely overlaps the confirmed building, when it renders, then its confidence is floored and it is flagged for review (M04-20).

---

### T-M04-013 · Validated detection artifact: the only doorway into a design

**Type:** engine · **Tier:** P0
**PRD rows:** M04-24, M04-65
**Requirements (verbatim):**

- **M04-24** (P0) — **A detection enters a design only through a validated artifact, and applying it stamps what came from a detector.** The reviewed result is handed to `modules/M05-design-studio.md` as a validated artifact — version, tile pin, geometry, bounds and confidence — with any entity that fails validation **dropped with a stated reason** rather than passed through degraded. Applying it stamps entity provenance so the design can say, in the source's words, *"N AI-detected entities — dimensions are detector estimates."*
- **M04-65** (P0) — **Detected geometry crosses into a design only as a validated artifact, and never as raw detector output.** The doorway of `M04-24` is the only route: version → pinned tile → geometry → bounds → confidence, per-entity, with anything failing validation dropped and its reason stated. `modules/M05-design-studio.md` receives that artifact; it does not read a detector.

**DONE WHEN:**

- Given a reviewed detection handed to a design, when it is applied, then only validated entities arrive, every dropped entity carries a stated reason, and the applied entities are stamped as detector-derived (M04-24).
- Given a reviewed detection, when a design is started from it, then only validated entities cross and every dropped entity carries a stated reason (M04-65).

---

### T-M04-014 · Per-field provenance stamping and skipped-but-flagged markers

**Type:** engine · **Tier:** P0
**PRD rows:** M04-34, M04-35
**Requirements (verbatim):**

- **M04-34** (P0) — **Every survey stamps the provenance of what it captured, by mode: remote = `derived`, physical = `measured`.** The tiers are `foundations/F8`'s four and this module invents none of them (`F8-02`, `F8-03`). The stamp is not decorative: it is what the design, the bill of materials, the proposal and the customer link all read when they state how firm a figure is.
- **M04-35** (P0) — **Provenance is per field, not per survey.** A physical survey containing an estimated obstruction height carries `estimated` on that height even though the survey is a measured one; a remote survey whose pitch the operator typed over carries that field's own tier. Each capture group's fields carry their own tier and their own **skipped-but-flagged** marker where the surveyor moved past them.

**DONE WHEN:**

- Given a completed remote survey, when its figures are read anywhere in the product, then they carry `derived`; and given a completed physical survey, then they carry `measured` (M04-34).
- Given a physical survey containing an estimated height, when that field is read, then it carries `estimated` while the survey's other captured dimensions carry `measured` (M04-35).

---

### T-M04-015 · Survey object, versions and states; the visit object; visibility and attribution

**Type:** engine · **Tier:** P0
**PRD rows:** M04-01, M04-57, M04-60, M04-61, M04-62
**Requirements (verbatim):**

- **M04-01** (P0) — **The survey has exactly two modes — remote and physical — and both produce the same kind of record.** A survey is one object with one identity per site whichever mode produced it: same groups, same photograph attachments, same hand-off to the designer, same versioning. The modes differ in **how the facts were obtained**, and that difference is carried as provenance (M04-34), never as two incompatible records or two parallel screens.
- **M04-57** (P0) — **Surveys are versioned-append: a revisit inserts a new version and nothing is overwritten.** A return visit to a site creates a **new survey version**; earlier versions are immutable and remain readable forever, and the person on the roof is told what just happened in one line — *"v2 — v1 kept"* (`F4-25`). The first survey is evidence of what the site looked like on that day and no later visit may erase it. The survey's own states are **draft → in progress → submitted → superseded**.
- **M04-60** (P0) — **A visit is a scheduled assignment with its own states — scheduled · in progress · done · cancelled — linked to the survey version it produces.** Booking a visit for open capture-on-site gaps schedules one (M04-32); booking one from a lead is `modules/M02`'s act (`M02-46`) and produces this object. A visit's status only moves forward (`F4-17`).
- **M04-61** (P0) — **The survey and its visits are readable by everyone whose scope contains the lead or site, and by nobody else.** Survey visibility follows the lead or site the survey belongs to (`F2.M02.lead-visibility`, `F2-12`–`F2-14`); this module creates no separate visibility domain and no per-person exception (`F2-15`).
- **M04-62** (P0) — **Every consequential act on a survey is attributable: who captured it, who submitted it, who waived a gap, who cancelled or rescheduled a visit, and when.** Capture time is preserved and shown because it is what a field user means by "when" — and it orders nothing: conflicts resolve by server apply order, never by device clocks (`F4-19`).

**DONE WHEN:**

- Given a lead with a confirmed address, when a survey is started, then both modes are offered and the mode applicable to that lead's segment is stated with its rule (M04-01, M04-05).
- Given a site with a submitted survey, when a revisit is captured and submitted, then a new version exists, the earlier version is readable and unchanged, and the version-kept notice was shown (M04-57).
- Given a visit, when its status changes, then it moves only forward through scheduled → in progress → done, or to cancelled, and it names the survey version it produced (M04-60).
- Given a user whose scope does not contain the lead, when they search for its survey, then it is not returned (M04-61).
- Given any waiver, submission, cancellation or reschedule, when the record is read, then the actor and the time are attributable (M04-62).

---

### T-M04-016 · Survey draft restore

**Type:** engine · **Tier:** P0
**PRD rows:** M04-48
**Requirements (verbatim):**

- *Rows removed 2026-08-07 by owner decision: `M04-39` and `M04-40` (offline capture, local-first saves and the durable survey queue) were deleted with the offline/sync capability.*
- **M04-48** (P0) — **A survey interrupted by a dead battery or a killed application is restored exactly as it was, with nothing lost.** Capture is a running draft on the device, not a form submitted at the end: reopening returns the surveyor to the step they were on with every field, note and photograph intact. *"Nothing lost."*

**DONE WHEN:**

- Given a survey in progress, when the application is killed or the device dies, then reopening restores the same step with every field, note and photograph intact (M04-48).

---

### T-M04-017 · Photograph capture, resumable upload and version binding

**Type:** engine · **Tier:** P0
**PRD rows:** M04-55, M04-56
**Requirements (verbatim):**

- **M04-55** (P0) — **Capture is unconditional; upload is deliberate — and this is the product's one and only device-held queue.** A photograph is written to the device the moment it is taken, with no delay, and uploads when the connection returns — resumably, defaulting to Wi-Fi-or-charging, with a per-batch "upload now" available. A photograph is never blocked, never degraded to fit a network, and never lost because an upload failed. The queue is **one queue, one direction, no conflicts and no merge**, it holds photographs and nothing else, and its status is shown **on the capture screen (`SCR-M04-07`) and nowhere else** — no global indicator, no separate centre, no per-record marker anywhere else in the product. The device storage cap and its eviction order are this row's: acknowledged originals are evicted first and an unacknowledged original is never evicted.
- **M04-56** (P0) — **Photographs travel with the survey version they were captured in.** A revisit's photographs belong to the new version; the earlier version keeps its own (M04-57). A photograph is never moved between versions to make a later survey look complete.

**DONE WHEN:**

- Given photographs taken while the connection is down, then each is stored on the device immediately and uploads resumably when the connection returns, without user action, with the queue's status shown on the capture screen and on no other surface (M04-55).
- Given a revisit, when its photographs are captured, then they belong to the new survey version and the earlier version's photographs are unchanged (M04-56).

---

## Laws (enforced through screens and review, no standalone build)

- **M04-04** (P0) — **The site visit is verification before installation, not a prerequisite for quoting.** For residential work the sequence is **remote survey → design → proposal → physical visit once the customer is interested**. No design, proposal or price in this product may be gated on a physical visit having happened; the visit is required before installation (M04-05) and is a normal, expected step *after* interest, not a queue in front of the first quote.
  *Enforced by:* the mode chooser of T-M04-001 stating rules as guidance and never as a lock; no design, proposal or price surface in `docs/prd/modules/M05-design-studio.md` or `docs/prd/modules/M06-proposals.md` gating on a physical visit having happened; product-wide review. PRD check, verbatim: "Given a residential lead with a remote survey only, when a design and then a proposal are built, then nothing in the flow requires a physical visit to have happened and the proposal is generated, carrying its imagery-basis line (M04-04, `F8-22`)."
- **M04-06** (P0) — **Surveying is a capability, not a gatekeeper, and there is one capture flow for everyone who holds it.** A survey is a task assignable to anyone holding the capability — a dedicated Survey Engineer or a Sales Executive standing on the roof — and both use the identical flow, with no reduced or "lite" variant for the non-specialist. The persona describes whose job it usually is, never who is permitted to do it.
  *Enforced by:* the `F2.M04.capture-surveys` grant of `docs/prd/foundations/F2-roles-and-permissions.md` and the single guided capture flow of T-M04-007, which has no reduced or "lite" variant to build; review. PRD check, verbatim: "Given a user holding `F2.M04.capture-surveys` and no survey-specialist role, when they open a survey, then they get the identical capture flow a Survey Engineer gets (M04-06)."
- **M04-07** (P0) — **The remote path is measured against a speed budget: a remote survey reaches a sendable proposal in under ten minutes.** The budget is a product requirement carried from the source, not an aspiration, and this module owns its first and largest segment — address in to reviewed roof out. Every Mode A screen is designed against it: no blocking spinner walls, no step that waits on a human decision the product could have pre-filled, no re-entry of anything the lead already holds.
  *Enforced by:* every Mode A screen task (T-M04-001 … T-M04-005) and the pipeline tasks T-M04-011/T-M04-012 built with no blocking spinner walls, no step waiting on a decision the product could have pre-filled, and pre-fill from the lead; measured through the elapsed analytics events named in `docs/prd/modules/M04-survey.md` §M04.1. PRD check, verbatim: "Given a lead with a confirmed address, when a remote survey is run and a proposal generated from it with no physical visit, then the elapsed path is measured against the ten-minute budget and no step in this module blocks on a spinner wall or on a decision the product could have pre-filled (M04-07)."
- **M04-25** (P0) — **Roof-data coverage is a fact about a location, never a promise the product makes.** Detailed roof data exists for some addresses and not others, and the gaps are real and unevenly distributed within any one market. The product never states or implies coverage it has not established for the address in front of it, never presents a national or market-level coverage claim, and never treats a coverage gap as an error the operator caused. Where coverage is absent, mode rule 3 applies: remote is not possible for that address and physical is required (M04-05).
  *Enforced by:* T-M04-004's coverage copy stating only the per-address fact; review of every surface that mentions coverage. PRD check, verbatim: "Given any surface in this module, when it mentions coverage, then it states only what is true for the address at hand and makes no market-level coverage claim (M04-25)."
- **M04-27** (P0) — **A coverage failure never degrades an energy figure.** Energy output has never depended on the roof-data capability: its source of record, its database ladder and its labelled fallback are `foundations/F8`'s (`F8-08`–`F8-10`) and are computed independently of whether roof data existed for this address. A survey that fell back to a manual outline still yields a fully labelled energy figure, and no screen in this module implies otherwise.
  *Enforced by:* the energy source-of-record ladder and its labelling are `docs/prd/foundations/F8-data-honesty.md`'s (`F8-08`–`F8-10`) and `docs/prd/modules/M05-design-studio.md`'s computation, independent of roof-data coverage; review that no M04 surface marks down, blocks or qualifies an energy figure on a coverage failure. PRD check, verbatim: "Given a survey completed by manual outline after a coverage failure, when its energy figure is produced, then the figure carries its own source label per `F8-08` and is not marked down, blocked or qualified by the coverage failure (M04-27)."
- **M04-33** (P0) — **A proposal built while gaps are open says so where the gaps matter, and never presents a remote survey as a complete site picture.** The open-gap count travels with the survey into the design and the proposal; the document's own honesty line is `F8-22`'s and is not duplicated or softened here. Nothing in this module blocks a proposal because gaps are open — the source's whole point is that remote data is sellable — but nothing in it lets the gaps disappear either.
  *Enforced by:* the gap records built in T-M04-005 travelling with the survey; T-M04-010 listing open gaps in the hand-off; the document's own honesty line is `F8-22`'s, rendered by `docs/prd/modules/M06-proposals.md` — never duplicated or softened by an M04 surface. PRD check, verbatim: "Given a survey with open gaps, when the designer opens it, then the open gaps are listed with their states (M04-33, M04-63)."
- **M04-36** (P0) — **A proposal built on a remote survey is legitimate and sellable — it just must not claim to be a site survey.** This module produces the fact the claim rests on (the survey's mode and its per-field tiers) and hands it on; the fixed customer-facing line — *"Roof measured from satellite imagery. A site visit will confirm dimensions, shading and electrical access."* — is `foundations/F8`'s (`F8-22`), stated once there and rendered by the document and the customer link. No surface in this module restates, rewords or suppresses it.
  *Enforced by:* the provenance stamps of T-M04-014 read downstream; `F8-22`'s fixed line stated once in `docs/prd/foundations/F8-data-honesty.md` and rendered by the document and the customer link; review that no M04 surface restates, rewords or suppresses it. PRD check, verbatim: "Given a proposal built on a remote survey, when it renders, then `F8-22`'s line is present and unaltered, and nothing in the proposal describes the remote survey as a site survey (M04-36)."
- **M04-51** (P0) — **Nothing is blocked at submit. A survey submitted with gaps is submitted — and the designer sees the gap explicitly.** The review screen warns; it does not gate. Where a survey is submitted with items missing or flagged, those items travel to the designer as named absences rather than as blanks, and they appear in the hand-off (M04-63).
  *Enforced by:* T-M04-009's submit action staying enabled throughout (`F4-27` — a warning informs, it does not gate), with missing and flagged items travelling as named absences into T-M04-010's hand-off. PRD check, verbatim: "Given missing items, when submit is used, then the submission succeeds and the missing items travel to the designer as named absences (M04-51)."
- **M04-53** (P0) — **Photographs are reference for the designer, never measurement — from any source, including a drone.** The survey captures and attaches photographs of the roof, its obstructions and everything around the building, however they were taken: **by phone on site, sent by the customer, or uploaded from a drone or another camera**. Every one of them travels with the survey to the designer, who uses them while building the design. **The product does not derive numbers from them** — *"the app just does not measure from them."* Every dimension and every height is entered or estimated by a person.
  *Enforced by:* no measurement-from-photograph capability existing anywhere (`docs/prd/modules/M04-survey.md` §5 non-goals); person-entered heights and dimensions in T-M04-007/T-M04-008; review of any surface that attributes a number to a photograph. PRD check, verbatim: "Given a photograph from any source, when it is read anywhere in the product, then it is presented as reference and no dimension, height, area or pitch anywhere is attributed to it (M04-53)."
- **M04-66** (P0) — **A new survey version does not silently rewrite an existing design or a sent document.** When a revisit supersedes the version a design was built from, the design's own freshness comparison surfaces the difference (`F8-13`, `F8-14`) and the provenance change is shown before anything commits (`M04-37`); figures inside an already-sent document never move (`F8-15`). What this module guarantees is that the newer facts are available and visibly newer — not that they are applied behind someone's back. The design-side reconciliation is **ruled (owner ruling 2026-08-04, Q24)**: the design is marked "survey updated — review needed" with the designer notified, draft proposals on it are blocked from sending until review, and sent proposals stay pinned (`M05-13`).
  *Enforced by:* T-M04-015's versioned-append and superseded state; the ruled design-side reconciliation (`M05-13`, owner ruling 2026-08-04 Q24) in `docs/prd/modules/M05-design-studio.md`; `F8-13`/`F8-14`/`F8-15` (sent-document figures never move). PRD check, verbatim: "Given a design built from survey version 1, when version 2 is submitted, then nothing in the existing design or in any sent document changes automatically and the difference is surfaced (M04-66)."

---

## Disposition index

| Row | Disposition |
|---|---|
| M04-01 | T-M04-015 |
| M04-02 | T-M04-011 |
| M04-03 | T-M04-007 |
| M04-04 | LAW |
| M04-05 | T-M04-001 |
| M04-06 | LAW |
| M04-07 | LAW |
| M04-08 | T-M04-002 |
| M04-09 | T-M04-011 |
| M04-10 | T-M04-011 |
| M04-11 | T-M04-003 |
| M04-12 | T-M04-002 |
| M04-13 | T-M04-003 |
| M04-14 | T-M04-003 |
| M04-15 | T-M04-003 |
| M04-16 | T-M04-003 |
| M04-17 | T-M04-012 |
| M04-18 | T-M04-012 |
| M04-19 | T-M04-012 |
| M04-20 | T-M04-012 |
| M04-21 | T-M04-003 |
| M04-22 | T-M04-003 |
| M04-23 | T-M04-003 |
| M04-24 | T-M04-013 |
| M04-25 | LAW |
| M04-26 | T-M04-004 |
| M04-27 | LAW |
| M04-28 | T-M04-010 |
| M04-29 | T-M04-005 |
| M04-30 | T-M04-005 |
| M04-31 | T-M04-005 |
| M04-32 | T-M04-005 |
| M04-33 | LAW |
| M04-34 | T-M04-014 |
| M04-35 | T-M04-014 |
| M04-36 | LAW |
| M04-37 | T-M04-009 |
| M04-38 | T-M04-006 |
| M04-42 | T-M04-007 |
| M04-43 | T-M04-007 |
| M04-44 | T-M04-007 |
| M04-45 | T-M04-007 |
| M04-46 | T-M04-008 |
| M04-47 | T-M04-007 |
| M04-48 | T-M04-016 |
| M04-49 | T-M04-009 |
| M04-50 | T-M04-009 |
| M04-51 | LAW |
| M04-52 | T-M04-009 |
| M04-53 | LAW |
| M04-54 | T-M04-007 |
| M04-55 | T-M04-017 |
| M04-56 | T-M04-017 |
| M04-57 | T-M04-015 |
| M04-58 | T-M04-006 |
| M04-59 | T-M04-006 |
| M04-60 | T-M04-015 |
| M04-61 | T-M04-015 |
| M04-62 | T-M04-015 |
| M04-63 | T-M04-010 |
| M04-64 | T-M04-010 |
| M04-65 | T-M04-013 |
| M04-66 | LAW |
