# Design Studio A — shell baseline, Step 1 Site Setup, Step 2 Roof, Step 3 Obstructions — engineering tasks

This file carries the engineering tasks for the first slice of the 3D Design Studio: the pass-one
baseline module `docs/prd/modules/M05-design-studio.md` (whose Appendix A census remains the binding
acceptance baseline for the whole studio), plus the three deep-dive step documents
`docs/prd/modules/M05-studio/01-step1-site-setup.md`, `docs/prd/modules/M05-studio/02-step2-roof.md` and
`docs/prd/modules/M05-studio/03-step3-obstructions.md`. Task ids in this file run `T-MS-101` upward.

Build strategy is owner ruling S12-1: `3d_design_studio/` is the starting point, never a
from-scratch rebuild. Where the POC already implements the behavior the task is a **port** — the
engineering core moves as-is *with its tests as the regression net*. Where the surface is
redesigned the task is a **screen** whose title says "port + UI rebuild": the engineering ports,
the UI is rebuilt to the V2 design system. POC file ownership per area is
`docs/prd/_process/studio/inventory/file-claims.md` (sitting 1 = Step 1, sitting 2 = Step 2,
sitting 3 = Step 3); every defect whose target requirement is one of this file's rows is attached
to the task that owns that row, from `docs/prd/_process/studio/defect-register.md`.

Rows that this file's documents state but that another surface realizes are listed under
**Realized elsewhere** with their pointer; rows that engineering enforces rather than builds are
listed under **Laws**. The **Disposition index** at the end accounts for every row in this
file's slice exactly once.

---

### T-MS-101 · Studio Step 1 — Site Setup (port + UI rebuild)

**Type:** screen · **Tier:** P0
**PRD rows:** M05-14 (P0), M05-15 (P0), M05-16 (P0), M05-17 (P0), M05-18 (P0), M05-19 (P0), M05-20 (P0), MS1-01 (P0), MS1-02 (P0), MS1-03 (P0), MS1-04 (P0), MS1-05 (P0), MS1-06 (P0), MS1-08 (P1), MS1-09 (P0), MS1-10 (P0), MS1-11 (P0), MS1-12 (P0), MS1-13 (P0), MS1-14 (P0), MS1-15 (P0), MS1-16 (P0), MS1-17 (P0), MS1-18 (P0), MS1-20 (P0), MS1-21 (P0), MS1-22 (P0), MS1-23 (P0)
**DESIGN:** SCR-MS-04 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step1Setup.tsx` · `3d_design_studio/src/features/solar-studio/lib/maps.ts` · `3d_design_studio/src/features/solar-studio/lib/geo.ts` · `3d_design_studio/src/features/solar-studio/lib/solarApi.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/maps.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/geo.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/solarApi.test.ts`
**DEFECTS:**
- `CODE.step1-setup.11` — Ground Mount PRO-locked, dead toggle (ruling S1-1: un-gate, every plan → MS1-09).
- `CODE.step1-setup.21` — 5 MB logo cap advertised, never enforced (ruling S1-2: enforce for real + logo from tenant branding → MS1-11/12).

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-04-step1-site-setup.md`; they are the specification. Every row of this task is present in that brief; no row is quoted here.

**DONE WHEN:**
- Given a submitted survey, when Step 1 opens, then carried values show with provenance and the gaps list is as prominent as the values (M05-14).
- Given a tenant of any market, when the form renders, then utility/tariff/currency labels and data come from the market pack and no other market's terms appear (M05-15).
- Given a confirmed location with the source of record reachable, when the Solar Data card renders, then figures carry the `F8-08` source label naming the database; given it unreachable, then figures carry "±10%" and never switch silently (M05-17).
- Given a pin move >25 m, when confirmed, then the design resets with an undo available; when cancelled, nothing changes (M05-19).
- Given a design exceeding sanctioned load, when the overrun occurs, then the warning names the captured limit and the design remains editable (M05-20).
- Given a tile fetch failure, when the studio opens, then the canvas opens blank with manual calibration offered, and nothing blocks (M05-16).
- Given Site Intelligence in any of its four states, when the card renders, then the state is named honestly and no design step depends on the result (M05-18).
- Given a lead with a completed survey, When the designer opens a new design, Then Step 1 shows customer info + CONFIRMED surveyed location with provenance hints and every field editable (MS1-01); Given an IN tenant, When Step 1 renders, Then region/utility/tariff content equals the IN pack's shipped lists (MS1-03/04); Given a typed tariff edit, When auto-fill would re-derive, Then the manual value wins (MS1-05); Given first use, When Step 1 opens, Then the walkthrough offers and never returns after dismissal (MS1-08).
- Given an invalid phone for the market, When entered, Then an inline corrective error shows and other fields stay usable (MS1-02); Given no region chosen, Then the utility select is disabled with state-aware placeholder, and choosing a region enables it (MS1-04); Given a blank bill field, Then null (not 0) is stored and Step 4's suggestion treats it as absent (MS1-06).
- Given any plan tier, When Step 1 renders, Then Ground Mount is enabled and functional (MS1-09); Given a site-type switch with no manual tariff edit, Then the tariff re-derives for the new type, and sanctioned load blank round-trips as 0 (MS1-10).
- Given tenant branding exists, When a design is created, Then its proposal logo is the tenant's with zero designer action (MS1-11); Given a 12 MB file, When picked as override, Then a clear size error and no write (MS1-12).
- Given lat 999 typed, When Locate is tapped, Then the corrective error names the bad value and nothing breaks (MS1-14); Given a Wi-Fi blip broke Maps load, When Retry is tapped after recovery, Then address search works without reload (MS1-17); Given a phone, When the user taps the map, Then the pin moves there (MS1-16); Given a switch from Search to Coordinates, Then the autocomplete listener detaches and neither method leaks into the other (MS1-13); Given the SDK failed with a pin pending, Then the overlay explains it and Confirm still works from typed coordinates (MS1-15).
- Given a design exists, When the pin moves 100 m and Confirm is tapped, Then the dialog lists the wipe with counts and Cancel preserves all (MS1-20); Given a pending pin with the SDK loaded, When Confirm is tapped, Then the live map centre is stored with the built-in irradiance provenance until real data arrives (MS1-18); Given Change Location then no further confirm, Then the design, pin and fetched data all persist (MS1-21).
- Given PVGIS answers after Solar, When both land, Then neither overwrite loses the other's fields and provenance reads the real source (MS1-22); Given no coverage, Then the card says so plainly and design continues manual (MS1-23).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-102 · Studio Step 2 — Roof drawing surface (port + UI rebuild)

**Type:** screen · **Tier:** P0
**PRD rows:** M05-22 (P0), M05-23 (P0), M05-24 (P0), M05-25 (P0), M05-26 (P0), M05-27 (P0), M05-28 (P0), M05-29 (P0), MS1-29 (P0), MS1-30 (P0), MS2-01 (P0), MS2-02 (P0), MS2-03 (P0), MS2-04 (P0), MS2-05 (P0), MS2-06 (P0), MS2-07 (P0), MS2-08 (P0), MS2-09 (P0), MS2-10 (P1), MS2-11 (P0), MS2-12 (P0), MS2-14 (P0), MS2-15 (P0), MS2-16 (P0), MS2-17 (P0), MS2-18 (P0), MS2-19 (P0), MS2-21 (P0), MS2-23 (P0), MS2-27 (P0), MS2-28 (P0), MS2-29 (P0), MS2-31 (P0), MS2-32 (P0), MS2-34 (P0), MS2-35 (P0), MS2-36 (P0), MS2-37 (P0), MS2-38 (P0), MS2-39 (P0)
**DESIGN:** SCR-MS-05 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step2Roof.tsx` · `3d_design_studio/src/features/solar-studio/components/EdgeLabels.tsx` · `3d_design_studio/src/features/solar-studio/components/MeasureTool.tsx` · `3d_design_studio/src/features/solar-studio/lib/roof-factory.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-colors.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-face-group.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-ai/detect-client.ts` · `3d_design_studio/src/features/solar-studio/components/SatCanvas.tsx` (sitting 1 — the shared canvas this step consumes) · tests `3d_design_studio/src/features/solar-studio/components/__tests__/drawing.dom.test.tsx`, `3d_design_studio/src/features/solar-studio/lib/__tests__/roof-face-group.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/roof-edge-cases.test.ts`
**DEFECTS:**
- `CODE.step2-roof-drawing.87` — pinch-zoom/two-finger pan absent (ruling S2-1: touch pack added → MS2-03).
- `CODE.step2-roof-ai.72` — cross-check tested but unreachable (ladder exclusivity) (ruling S2-3: second-opinion button wires it → MS2-37). The assertions this un-gating must satisfy already exist in `3d_design_studio/src/features/solar-studio/lib/__tests__/gemini-client.test.ts`, ported by T-MS-111; the second-opinion wiring is closed against that suite, not against nothing.

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-05-step2-roof.md`; they are the specification. Every row of this task is present in that brief; no row is quoted here.

**DONE WHEN:**
- Given a detection result, when it renders, then ghosts are visually distinct, each carries confidence, include/exclude is per shape, and "add selected" is one undo step (M05-23).
- Given an accepted ghost, when it commits, then the roof's provenance reads AI-detected with its confidence, within the four tiers (M05-23, M05-28).
- Given a drawn roof, when an edge label is tapped, then exact metres can be typed and the geometry updates (M05-24).
- Given two measured points and an entered distance, when calibration applies, then all geometry rescales and the correction is recorded (M05-26).
- Given a vertex edit that orphans panels, when it is confirmed, then the keep/review/remove choice is offered and honoured (M05-27).
- Given the roof step, when the toolbar renders, then all nine census tools are present as modes with a visible active state (M05-22).
- Given a footprint that cannot take a pitched roof type, when the roof-type sheet renders, then the disabled option explains why (M05-25).
- Given survey photographs, when tracing, then they are viewable beside the canvas and no dimension is ever derived from them (M05-29).
- Given a pan gesture, Then no click fires (MS1-29).
- Given zoom 3×, Then pixels render honestly pixelated and the scale bar matches hit-test geometry exactly (MS1-30).
- Given the step opens, Then every tool is a visible, labeled, stateful rail button — Select/Draw/Detect/Ortho/Measurements/Measure/3D/Undo/Redo — with mode-aware undo semantics (MS2-01); and every shortcut (V/D/O/Esc/Enter/Del/⌘Z/⌘⇧Z) works but is suppressed while typing or in sheets (MS2-02).
- Given a phone, When the user pinches/two-finger drags, Then the canvas zooms around the fingers and pans; and the rotate-snap toggle is tappable (MS2-03).
- Given an empty step, Then the hint offers tracing AND auto-detect (MS2-04). Given a trace click <0.15 m from the last point, Then it is rejected with the plain hint (MS2-05).
- Given ortho on, Then relative-angle guides snap within ±7.5° and object snap beats them on exact coincidence (MS2-06). Given a click near the first point with ≥3 corners, Then the Complete Shape dialog offers keep/complete (MS2-07).
- Given any finish path (manual or AI), Then the ONE canonical validator gates it with plain reasons (MS2-08). Given a roof drawn inside another, Then it mumty-stacks at +2.2 m (MS2-09); and factory defaults apply from the single factory (MS2-09). Given drawing mode, Then pan is disabled and the status bar narrates (MS2-10).
- Given deletions created a name gap, When a roof is added, Then it takes the next FREE name (MS2-11). Given a locked roof and a reload, Then the lock persists and edits still refuse (MS2-12). Given stacked roofs, Then tap selects the highest container (MS2-14).
- Given a vertex drag to an invalid shape, Then release reverts silently with one undo entry total (MS2-15). Given rotate with snap on, Then 15° steps apply from the visible toggle (MS2-16). Given feet display, When an edge label is tapped, Then the input reads and accepts feet (MS2-17). Given typed coordinates commit, Then the guard checks dependents (MS2-18). Given a duplicated gable face, When the original's pitch changes, Then the copy NEVER moves (MS2-19).
- Given a pitched face, Then Ground Array is disabled with the inline reason (MS2-21). Given an asymmetric footprint, Then Gable refuses with the measured step and points to Hip (MS2-23).
- Given a face-group pitch edit, Then the ridge stays level and the slider reaches 60° (MS2-27). Given a matching suggestion, Then the banner hides; Apply is never automatic (MS2-28). Given a southern-hemisphere site, Then the direction tip says north-facing (MS2-29).
- Given per-edge setbacks exist, Then the badge shows and reset returns to uniform (MS2-31). Given parapet width 0 typed, Then the clamp refuses it (MS2-32).
- Given two measure clicks, Then the pill offers Calibrate (MS2-34). Given k outside ±50%, Then Apply stays disabled with the reason (MS2-35).
- Given a roof edit strands panels, Then the three-action dialog appears and nothing cascades silently (MS2-36).
- Given aerial found 1 roof of 3 visible, When "Also try photo analysis" is tapped, Then photo ghosts join review and mask-disagreeing ones are floored with a warning (MS2-37). Given photo capability absent platform-side, Then no photo entry renders anywhere (MS2-38); and detection narrates three steps (MS2-38). Given ghosts, Then nothing enters the project before "Add selected", which is one undo step (MS2-39).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-103 · Studio Step 3 — Obstructions (port + UI rebuild)

**Type:** screen · **Tier:** P0
**PRD rows:** M05-30 (P0), M05-31 (P0), M05-32 (P0), M05-33 (P0), M05-34 (P0), M05-35 (P0), MS3-01 (P0), MS3-02 (P0), MS3-03 (P0), MS3-04 (P0), MS3-05 (P0), MS3-07 (P0), MS3-08 (P1), MS3-09 (P0), MS3-10 (P1), MS3-11 (P0), MS3-12 (P0), MS3-13 (P0), MS3-16 (P1), MS3-17 (P0), MS3-18 (P0), MS3-19 (P0), MS3-20 (P0), MS3-21 (P0), MS3-22 (P0), MS3-23 (P1), MS3-24 (P0), MS3-25 (P0), MS3-26 (P0), MS3-27 (P0), MS3-28 (P0), MS3-29 (P0), MS3-30 (P0), MS3-32 (P0), MS3-33 (P0)
**DESIGN:** SCR-MS-06 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step3Obstructions.tsx` · `3d_design_studio/src/features/solar-studio/components/SatCanvas.tsx` (sitting 1 — the shared canvas contract) · `3d_design_studio/src/features/solar-studio/components/ui.tsx` (sitting 10 — the shared slider/number-field primitives the S3-3 rulings correct) · `3d_design_studio/src/features/solar-studio/lib/capabilities.ts` (sitting 4 — the capability resolver these sheets write through)
**DEFECTS:**
- `CODE.step3-obstructions.32` — Casts-shadow toggle dead for all factory objects (live repro) (ruling S3-1: switch made real → MS3-28).
- `CODE.step3-obstructions.8` — No undo/redo trigger on the step (ruling S3-2: buttons+shortcuts added → MS3-05).
- `CODE.step3-obstructions.29` — Typed dims unclamped (0/negative commit) + keystroke undo (ruling S3-3: commit-on-blur + floors → MS3-26).
- `CODE.step3-obstructions.30` — Slider drag floods undo stack (ruling S3-3: one gesture = one entry → MS3-27).
- `CODE.step3-obstructions.12` — Rect obstruction edge labels missing (ruling S3-5.2 → MS3-09).

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-06-step3-obstructions.md`; they are the specification. Every row of this task is present in that brief; no row is quoted here.

**DONE WHEN:**
- Given the type picker, when opened, then all eleven types show with defaults, and Ladder carries its BETA marker (M05-32).
- Given a placed obstruction, when settings open, then setback/shadow/blocking controls appear and the bridging chain reveals per the census nesting with the engineer-confirmation warning (M05-35).
- Given a rotation typed as 37°, when applied, then the object sits at exactly 37° (M05-34).
- Given the obstruction step, when the canvas renders, then the whole standing set of M05-30 is present (read-only roofs, ID chips, setback rings, north, scale bar, zoom, undo/redo, units) (M05-30).
- Given the toolset, when counted, then exactly five tools exist and Show/Hide also clears the selection (M05-31).
- Given a resize below 0.3 m or a manipulation of a locked object, when attempted, then it is refused with the constraint stated (M05-33).
- Given placing or dragging, Then pan/zoom is suspended and cursors follow the mode (MS3-01); roofs stay read-only (MS3-02); shapes, chips and rings render to scale (MS3-03) with rings live-updating (MS3-04).
- Given a mistaken drag, When undo is tapped ON THIS STEP, Then it reverts as one step (MS3-05).
- Given the rail, Then all five tools + undo/redo are present (MS3-07); measurements label rect obstruction edges too (MS3-09); 3D opens and returns with state (MS3-11).
- Given the picker, Then 11 cards show exact presets (MS3-12); one click places one object with auto-anchor (MS3-13).
- Given the rotate handle, When the visible 15°-steps toggle is on, Then rotation snaps in steps without any keyboard (MS3-20).
- Given a corner tap on a large building, Then it selects and STAYS selected (MS3-17). Given a drag over a roof boundary, Then the anchor re-resolves live and bridged panels reconcile (MS3-18). Given resize/rotate, Then floors and snap modes apply incl. the visible 15° toggle (MS3-19/20). Given a nudge from bar or keys, Then 0.1 m/1 m steps each = one undo entry (MS3-21). Given selection, Then the seven-action bar clears the ring (MS3-22). Given a locked object after reload, Then it is still locked and refuses edits (MS3-24).
- Given shape switch and switch-back, Then prior dims restore (MS3-25). Given an emptied height field, Then nothing commits and the floor is explained (MS3-26). Given a full slider sweep, Then exactly one undo entry exists (MS3-27).
- Given Casts-shadow OFF on any object, Then the 3D shadow disappears AND the energy math excludes it (MS3-28). Given blocking ON, Then the ring and layout keep-out apply and bridging reveals (MS3-29). Given open-to-sky ON, Then bridging is blocked regardless of clearance (MS3-30).
- Given a big tank, When converted, Then a "{label} platform" roof appears at base+height with the engineer line, one undo step (MS3-32). Given a pitched roof, Then the height card and the 3D report the SAME top-from-ground (MS3-33).
- MS3-08, MS3-10, MS3-16 and MS3-23 are P1 and carry no line in the document's P0 acceptance block (`docs/prd/modules/M05-studio/03-step3-obstructions.md`, `## Acceptance criteria (P0 coverage)`); they are verified against their brief rows in `docs/ux/briefs/SCR-MS-06-step3-obstructions.md`.
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-104 · Shared canvas frame & analysis-worker resilience

**Type:** port · **Tier:** P0
**PRD rows:** MS1-28, MS1-31
**PORT:** `3d_design_studio/src/features/solar-studio/components/SatCanvas.tsx` · `3d_design_studio/src/features/solar-studio/workers/analysis.worker.ts` · `3d_design_studio/src/features/solar-studio/lib/analysis-client.ts` · test `3d_design_studio/src/features/solar-studio/lib/__tests__/analysis-client.test.ts`
**DEFECTS:** none registered against MS1-28 or MS1-31 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS1-28** (P0) — Canvas frame: fixed logical viewport over the calibrated static tile; centre-origin metre coordinates; single shared zoom constant across 2D canvas, 3D ground and AI-detect tile math so every surface agrees on m/px (`CODE.step1-setup.98–.100`).
- **MS1-31** (P0) — Analysis-worker resilience contract (powers shading/health everywhere): one long-lived worker; id-keyed replies so superseded results NEVER apply to moved-past geometry; explicit supersession errors; crash → inline compute with IDENTICAL engine (slower-but-fresh, never silently stale — F8 spirit); SSR/no-Worker environments compute inline bit-identical (`CODE.step1-setup.90–.97`).

**DONE WHEN:**
- Given the 2D canvas, 3D ground and AI-detect tile math, Then all three use the same zoom constant and agree on metres-per-pixel (MS1-28).
- Given a worker crash mid-shading, Then results keep flowing inline and nothing stale renders (MS1-31).
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-105 · Calibration, rescale & true-north engine

**Type:** port · **Tier:** P0
**PRD rows:** MS1-25, MS1-26, MS1-27
**PORT:** `3d_design_studio/src/features/solar-studio/lib/calibration.ts` · `3d_design_studio/src/features/solar-studio/lib/geo.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/calibration.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/geo.test.ts`
**DEFECTS:** none registered against MS1-25, MS1-26 or MS1-27 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS1-25** (P0) — Known-distance calibration: rejects degenerate inputs (≤0.05 m); factors COMPOSE on repeat calibration; the reference measurement stores rescaled (round-trips exactly); scaleFactor drives every imagery projector so corrected geometry sits exactly on the imagery (`CODE.step1-setup.61/64/65`).
- **MS1-26** (P0) — Rescale covers ALL plan geometry — the POC set (roofs, obstructions incl. physical dims, panels, segments, keepouts, walkways, rails, arresters) PLUS grid-connection point and cable routes; physical user-entered values (heights, setbacks, walkway widths, panel specs) never rescale, so capacity is invariant and money re-derives consistently (`CODE.step1-setup.61–.63`).
- **MS1-27** (P0) — True-north offset rotates every sun sample exactly (offset 0 bit-identical to uncalibrated) and the canvas north badge; calibration invalidates the geometry fingerprint so all downstream numbers recompute — never stale (F8-12 family) (`CODE.step1-setup.66/67`).

**DONE WHEN:**
- Given a second calibration, Then factors multiply (MS1-25); Given a placed grid-connection point, When calibration rescales, Then it lands at the true position and BOM cable money re-derives (MS1-26); Given northOffset 0, Then engine output is bit-identical to uncalibrated, and any calibration change invalidates the geometry fingerprint so downstream numbers recompute (MS1-27).
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-106 · Solar-data & site-intelligence client

**Type:** integration · **Tier:** P0
**PRD rows:** MS1-24
**PORT:** `3d_design_studio/src/features/solar-studio/lib/solarApi.ts` · test `3d_design_studio/src/features/solar-studio/lib/__tests__/solarApi.test.ts`
**DEFECTS:** none registered against MS1-24 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS1-24** (P0) — Solar-data client behaviors as shipped: proxy-only access (key server-side), 10 s client timeout over the proxy's 8 s, typed never-throw results so the UI always explains the situation, non-2xx surfaced, coordinate-keyed memo (ok/unavailable cached as location facts; errors NOT cached — retryable), usable-segment filtering with no zero-filling and rounding rules per the mapping contract (`CODE.step1-setup.49–.55`). Detection metering rides BM-16/BM-19 (cited, not restated).

**DONE WHEN:**
- Given the same pin re-confirmed, Then no re-billed insights call occurs (MS1-24).
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-107 · Polygon-write normalization & roof cascade-delete

**Type:** port · **Tier:** P0
**PRD rows:** MS2-13, MS2-20
**PORT:** `3d_design_studio/src/features/solar-studio/lib/roof-topology.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-face-group.ts` · `3d_design_studio/src/features/solar-studio/lib/segment-ops.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/roof-topology.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/roof-face-group.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/segment-ops.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/roof-edge-cases.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/segment-grid-pitched.test.ts` (sitting 2 — the deliberately pitched fixture over `reindexSegment`; it straddles this task and T-MS-207's `layout.ts`, and every other fixture in this area is flat, where the two derivations coincide, so it ports here)
**DEFECTS:** none registered against MS2-13 or MS2-20 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS2-13** (P0) — Delete cascades in ONE undo step: panels, segments, on-roof obstructions, walkways, rails, arresters, inverter placements, strings pruned — no orphans (`.28`).
- **MS2-20** (P0) — Every polygon write re-normalizes winding, re-validates, and resets per-edge arrays to uniform when lengths desync (`.46`); type/slope changes propagate plane-shared fields across the face group AND remap panel poses in the SAME undo step (`.50`).

**DONE WHEN:**
- Given delete, Then all dependents cascade in one undo step (MS2-13).
- Given a vertex-count change, Then per-edge arrays reset to uniform (MS2-20).
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-108 · Roof-type conversion engines (ground array, gable, hip, skeleton, wavefront)

**Type:** port · **Tier:** P0
**PRD rows:** MS2-22, MS2-24, MS2-25, MS2-26
**PORT:** `3d_design_studio/src/features/solar-studio/lib/roof-gable.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-hip.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-skeleton.ts` · `3d_design_studio/src/features/solar-studio/lib/skeleton-events.ts` · `3d_design_studio/src/features/solar-studio/lib/skeleton-wavefront.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/roof-gable.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/roof-hip.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/roof-skeleton.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/skeleton-events.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/skeleton-wavefront.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/roof-pipeline.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/roof-covering.test.ts`
**DEFECTS:** none registered against MS2-22, MS2-24, MS2-25 or MS2-26 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS2-22** (P0) — Ground Array conversion: height 0, pitch 0, 1.5 m boundary setback, parapet off, "Array Area A/B/…" naming, poses remapped — one undo step; flat-terrain-only stated, never approximated (`.49/.95`).
- **MS2-24** (P0) — Hip (rectangles): OBB frame, ridge auto-swings to the long axis, ≥95% rectangularity gate, squares collapse to pyramids; convex fallback = straight-skeleton (one face per wall, kink-tolerant pre-clean, 3% tiling gate); reflex (L/T/U/plus) = wavefront simulation with spike-collapse and a 1% tiling gate that refuses honestly ("inside corners are only partly supported…") — never hangs (bounded events) (`.53/.58–.62`).
- **MS2-25** (P0) — Conversions CARRY THE COVERING (metal shed stays on clamps; tile stays on hooks — the BOM never silently re-prices) and cascade-delete the original + dependents in one undo step, linking faces by face group (`.55/.52`).
- **MS2-26** (P0) — Conversion pitch precedence: valid Google-detected pitch → roof's own → 20° default; out-of-range detections fall back, never error (`.54`).

**DONE WHEN:**
- Given ground conversion, Then naming/setback/pose rules apply in one step (MS2-22).
- Given a plus-shaped footprint, Then wavefront faces tile exactly or the whole roof refuses honestly (MS2-24).
- Given a metal-shed gable conversion, Then clamps carry — never hooks (MS2-25).
- Given a 70° detected pitch, Then precedence falls back rather than erroring (MS2-26).
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-109 · Roof-plane datum math & shared-wall suppression

**Type:** port · **Tier:** P0
**PRD rows:** MS2-30, MS2-33
**PORT:** `3d_design_studio/src/features/solar-studio/lib/roof-plane.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-topology.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/eave-ref-plane.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/inset-fuzz.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/flat-azimuth-lattice.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/azimuth-lattice-attacks.test.ts`
**DEFECTS:** none registered against MS2-30 or MS2-33 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS2-30** (P0) — Roof-plane math single source: eave-height datum, upslope rise, flush panels inherit pitch+azimuth; adjacent same-slope roofs share one eave datum (wraparound-safe tolerances), different heights never fuse (`.76/.77`).
- **MS2-33** (P0) — Shared-wall suppression law: ≥90% collinear coverage; higher roof wins; equal heights → exactly one deterministic wall — derived, never stored (`.75/.78`).

**DONE WHEN:**
- Given adjacent same-slope roofs, Then one eave datum, and different heights never fuse (MS2-30).
- Given two equal-height roofs sharing a wall, Then exactly one keeps the parapet, deterministically (MS2-33).
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-110 · AI-detection artifact doorway, geometric pipeline & accepted-entity factory

**Type:** port · **Tier:** P0
**PRD rows:** MS2-40, MS2-41, MS2-43
**PORT:** `3d_design_studio/src/features/solar-studio/lib/roof-ai/artifact.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-ai/pipeline.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-ai/vectorize.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-ai/plane-fit.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-ai/geotiff-decode.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-ai/detect.worker.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-factory.ts` · test `3d_design_studio/src/features/solar-studio/lib/__tests__/roof-artifact.test.ts`
**DEFECTS:** none registered against MS2-40, MS2-41 or MS2-43 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS2-40** (P0) — The artifact doorway is the ONLY path in: versioned, pin-guarded (~110 m), 150 m site extent, value gates (heights (0,60), pitch [0,60], azimuth [0,360), confidence clamped), per-entity drops with reasons (one bad shape never kills the batch), same sanitizer as manual drawing, whole-artifact rejections for wrong version/source/pin (`ai.9/.43–.51`).
- **MS2-41** (P0) — Geometric pipeline honesty constants (product-level): ≥20 m² components; 8-roof cap with warning; DSM height-coherent sub-building splitting; gated orthogonalization (never mangles non-rectilinear roofs); plane-fit with edge-ramp exclusion; pitch <3° reported flat; confidence = f(fit quality), footprint-only 0.4; obstructions = residual lumps typed 'other' for the USER to classify, top 5, fixed 0.5 confidence; RMSE >0.3 m adds "review by hand" warning; grid-mismatch and ground-estimate failures degrade with stated warnings; deterministic (same input → identical output) (`ai.24–.42`).
- **MS2-43** (P0) — Accepted entities: SAME factory as manual (naming continues, defaults apply), mumty parenting on accept, obstructions parent to the roof under them, provenance {source, confidence} stamped into the record (`ai.56–.59`, SC.10-3.41).

**DONE WHEN:**
- Given an artifact from a moved pin, Then the whole artifact rejects; a self-intersecting shape drops alone with a reason (MS2-40).
- Given a flat roof with smoothed DSM edges, Then edge-ramp exclusion prevents fake pitch (MS2-41).
- Given accept, Then factory naming continues and provenance stamps persist (MS2-43).
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-111 · Photo-analysis structured-extraction contract

**Type:** port · **Tier:** P0
**PRD rows:** MS2-42
**PORT:** `3d_design_studio/src/features/solar-studio/lib/roof-ai/gemini-client.ts` · `3d_design_studio/src/app/api/gemini/route.ts` · test `3d_design_studio/src/features/solar-studio/lib/__tests__/gemini-client.test.ts` (sitting 6 in `docs/prd/_process/studio/inventory/file-claims.md`, corrected to sitting 2 in `docs/prd/registers/traceability.md` — the file's only regression net; it also holds the `crossCheckWithGeometry` assertions that T-MS-102's `CODE.step2-roof-ai.72` ruling un-gates, so it ports here and is read from there)
**DEFECTS:**
- `CODE.step2-roof-ai.62` — photo-mode endpoint has no in-app caller (ruling S2-2: wired at P1, survey/drone photos → MS2-42).

**Requirements (verbatim):**
- **MS2-42** (P0) — Photo-analysis honesty: structured-only output (schema-enforced, temperature 0), precision-beats-recall prompt (never guess occluded edges; empty is valid), heights/pitch NEVER from imagery (nulls → manual defaults; type presets for objects), mandatory verify-on-site warning, model+prompt version recorded as provenance (`ai.60–.71`); wired for satellite AND uploaded survey/drone photos at P1 (S2-2).

**DONE WHEN:**
- Given any photo-AI result, Then heights are defaults, the verify warning shows, and provenance carries model+version+imagery date (MS2-42).
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-112 · Detection server relay, raster cache & projector alignment gate

**Type:** integration · **Tier:** P0
**PRD rows:** MS2-44
**PORT:** `3d_design_studio/src/app/api/solar/building-insights/route.ts` · `3d_design_studio/src/app/api/solar/data-layers/route.ts` · `3d_design_studio/src/app/api/solar/geotiff/route.ts` · `3d_design_studio/src/app/api/solar/key.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-ai/utm.ts` · `3d_design_studio/src/features/solar-studio/lib/roof-ai/detect-client.ts`
**DEFECTS:** none registered against MS2-44 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS2-44** (P0) — Server-side product guarantees: keys never reach the browser (relay + SSRF guard), expired-raster retry semantics, day-cached rasters/insights (same pin never re-bills), envelope always explains (no naked failures), UTM-only rasters with mm-accurate inverse and a ≤0.5 m/50 m alignment gate against the app's own projector (`ai.6–.23/.73–.76`).

**DONE WHEN:**
- Given a re-detect on the same pin same day, Then cached rasters/insights serve without re-billing (MS2-44).
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-113 · Obstruction factory & per-type capability presets

**Type:** port · **Tier:** P0
**PRD rows:** MS3-14, MS3-15
**PORT:** `3d_design_studio/src/features/solar-studio/lib/roof-factory.ts` (sitting 2 — the shared factory recorded at `drawing.93/.94`, surfaced at Step 3) · `3d_design_studio/src/features/solar-studio/lib/capabilities.ts` (sitting 4 — the capability resolver) · `3d_design_studio/src/features/solar-studio/screens/Step3Obstructions.tsx` · test `3d_design_studio/src/features/solar-studio/lib/__tests__/capabilities.test.ts`
**DEFECTS:**
- `CODE.step3-obstructions.17` — Label numbering collides after deletion (ruling S3-5.1: next-free-number → MS3-14).

**Requirements (verbatim):**
- **MS3-14** (P0) — Factory defaults (shared with AI imports): auto-anchor to the roof under the drop (or ground), label = type code + NEXT FREE number (S3-5.1 fixes the count-collision in `.17`), shape by type, dims floored 0.3/0.1 m, setback 0.5 m, full capability preset written (`.17`).
- **MS3-15** (P0) — Per-type capability presets (all per-instance editable): tank/solar-WH bridgeable + top-access + engineer-flag; dish/ladder bridgeable (+0.5 m clearance for ladder); chimney/vent/windmill must-stay-open-to-sky; tree no-access; elevated supports-load; building/other base (`.18`).

**DONE WHEN:**
- Given "WT1" was deleted while "WT2" exists, When a tank is placed, Then it takes the next FREE label — never a twin (MS3-14); presets carry the per-type capabilities (MS3-15).
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-114 · Bridging reconciliation & live derived obstruction values

**Type:** port · **Tier:** P0
**PRD rows:** M05-36, MS3-31, MS3-34
**PORT:** `3d_design_studio/src/features/solar-studio/lib/capabilities.ts` (sitting 4 — capability resolver + reconcile) · `3d_design_studio/src/features/solar-studio/screens/Step3Obstructions.tsx` · test `3d_design_studio/src/features/solar-studio/lib/__tests__/capabilities.test.ts`
**DEFECTS:** none registered against M05-36, MS3-31 or MS3-34 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **M05-36** (P0) — **Everything derived updates live:** owning roof (re-checked on move), base/top heights, required bridging clearance, setback ring size, total count.
- **MS3-31** (P0) — Height drives everything: any height/size/position/capability edit reconciles bridged panels in the SAME patch — raising past clearance disables spanning panels, lowering re-enables (`.36`).
- **MS3-34** (P0) — Everything derived recomputes live from the store (owning roof, heights, clearance hints, ring, count badge) (`.40`).

**DONE WHEN:**
- Given any move, when released, then owning roof, heights, ring and count are current (M05-36).
- Given a bridged tank raised past clearance, Then spanning panels disable in the same patch (MS3-31).
- Given any edit, Then derived values recompute live (MS3-34).
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-115 · Obstruction grounding, shadow-parity predicate & 3D model contracts

**Type:** port · **Tier:** P0
**PRD rows:** MS3-36, MS3-37, MS3-38, MS3-39
**PORT:** `3d_design_studio/src/features/solar-studio/three/ObstructionMesh.tsx` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/obstruction-grounding.test.ts`, `3d_design_studio/src/features/solar-studio/three/__tests__/obstruction-assets.test.ts`
**DEFECTS:** none registered against MS3-36, MS3-37 or MS3-39 in `docs/prd/_process/studio/defect-register.md`. (The paired surface defect `CODE.step3-obstructions.32` is attached to T-MS-103 at MS3-28; this task owns the predicate both sides read.)

**Requirements (verbatim):**
- **MS3-36** (P0) — Grounding: every object sits on the surface resolved from its POSITION (stale anchors healed, deleted roofs fall back, higher roof wins, explicit ground kept) — and the SHADING caster grounds identically to the visual mesh (`.43`).
- **MS3-37** (P0) — Shadow parity law: the 3D shadow and the energy engine use the SAME per-object predicate — they can never drift (`.44`, pairs with MS3-28).
- **MS3-38** (P0) — Asset pipeline: 6 types have real 3D models, streamed lazily only for types the project contains; loading and missing/corrupt assets render the procedural fallback — a 404 never crashes the scene (`.45/.46`).
- **MS3-39** (P1) — Model contracts: normalized 1 m-tall origin-at-base scaling with per-type footprint rules and test-pinned reference dims; runtime bbox grounding (no levitating/buried trees) (`.47/.48`).

**DONE WHEN:**
- Given a stale roof anchor, Then 3D grounds by position and the shading caster matches the mesh (MS3-36); the shadow predicate is shared engine-wide (MS3-37). Given a missing 3D asset, Then the fallback renders and nothing crashes (MS3-38).
- Given a project containing only some of the six modelled types, When the 3D scene mounts, Then only those types' assets are fetched; and given a corrupt asset or a 404 for a type the project does contain, Then the procedural fallback renders in its place and the scene survives. (Beyond the missing-asset line above, the lazy per-type streaming half and the corrupt/404 half of MS3-38 carry no dedicated Given/When/Then line in `docs/prd/modules/M05-studio/03-step3-obstructions.md`'s P0 acceptance block; the requirement text above is the binding criterion.) The fetch policy is this task's; the mount that triggers it is `3d_design_studio/src/features/solar-studio/three/Scene3D.tsx`, ported by T-MS-206 (`docs/tasks/MS-studio-b.md`), and the fallback's appearance renders on the shared 3D scene (`docs/ux/briefs/SCR-MS-09-3d-scene.md`, same task). Note for the porting engineer: `docs/prd/_process/studio/inventory/step3-obstructions.md` records no test against `.45`/`.46`, so the ported `obstruction-assets.test.ts` pins `.47`/`.48` (MS3-39) only — this pair needs new coverage rather than an inherited net.
- MS3-39 is P1 and carries no separate acceptance line in `docs/prd/modules/M05-studio/03-step3-obstructions.md`; its test-pinned reference dims are the acceptance and travel with the ported suite.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-116 · Scale foundation — blocks/tables in the design payload, and the paradigm switch's census guarantee

**Type:** engine · **Tier:** P0
**PRD rows:** M05-89, M05-90
**PORT:** no POC counterpart — `docs/prd/_process/studio/inventory/file-claims.md` claims no scale-regime files; this extends the ported design payload rather than porting an existing one.
**DEFECTS:** none registered against M05-89 or M05-90 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **M05-89** (P0) — **The paradigm switch never loses a census tool:** a design with blocks presents block/table tools; pure-rooftop designs keep the **full per-panel tool census**; and per-panel editing remains available **inside** a table (remove-map pattern) — scoped, not deleted.
- **M05-90** (P0) — **Tier A capabilities (P0): the performance foundation and large-C&I designs work** — per-site projection, blocks/tables in the design payload, and the full studio at rooftop scale.

**DONE WHEN:**
- Given a large-C&I design, when created, then blocks/tables exist in the design payload and the per-site projection works (M05-90).
- Given a design with blocks, when editing tools render, then block/table tools present and per-panel editing remains available inside a table (M05-89).
- Given a 300 kW rooftop design, when opened, then the full per-panel census toolset presents with no scale-motivated reduction — the pure-rooftop half of M05-89, carried by `M05-87`'s acceptance line in `docs/prd/modules/M05-design-studio.md` and by the Appendix A census run (M05-01).
- This task owns the build half of M05-89 — the remove-map scoping that keeps per-panel editing reachable inside a table, and the guarantee that no census entry is dropped when the regime switches. The surface half renders on the layout editor (`docs/ux/briefs/SCR-MS-08-step6-layout-editor.md`, state `block-editing-regime`, T-MS-205 in `docs/tasks/MS-studio-b.md`); it consumes this task's scoping rather than re-deriving it.

---

### T-MS-117 · Survey supersession — the review-needed marker, the designer notification and the draft-send block

**Type:** engine · **Tier:** P0
**PRD rows:** M05-13
**PORT:** no POC counterpart — `docs/prd/_process/studio/inventory/file-claims.md` claims no survey-hand-off files; the POC has no survey module and no supersession path at all.
**DEFECTS:** none registered against M05-13 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **M05-13** (P0) — **When a newer survey version supersedes the one a design was built from, the studio marks the design "survey updated — review needed" and notifies the designer — and applies nothing automatically (owner ruling 2026-08-04, Q24).** The design shows the review-needed banner naming the superseding version and the fields that differ in provenance or value; the designer reviews and chooses what to apply. **Draft proposals built on the design are blocked from SENDING until the review clears; sent proposals stay pinned and never mutate** (`F8-15`). The same self-stale pattern as catalog releases.

**DONE WHEN:**
- Given a superseding survey version, when the design is opened, then the review-needed marker names the version and differing fields, the designer was notified, no design value has changed by itself, and a draft proposal on the design cannot send until the review clears (M05-13, owner ruling 2026-08-04 Q24).
- The marker is derived by comparison and never hand-set, per M05-10 and `F8-13` — which requires the design to pin the survey version it was built from. **Prerequisite:** M05-10's pinned-input list and `F8-14`'s (T-FPLAT-028, `docs/tasks/F-platform.md`) enumerate the catalog release, price-book version, market-pack/rules version and engine versions only. This task adds the survey version to the design's pinned inputs; without that pin the comparison has nothing to compare and the marker can never fire.
- This task owns the three mechanisms behind the row: (1) the review-needed marker state and the diff it names — which superseding version, and which fields differ in provenance or in value; (2) the notification emit to the design's author — the registered `design_survey_superseded` type in `docs/prd/foundations/F6-notifications-and-search.md`'s matrix, never an ad-hoc one (`F6-05`/`F6-10`; recipient and channel resolve there per `F6-16`, and delivery is T-FPLAT-018's in `docs/tasks/F-platform.md`); (3) the design-side state that gates sending, which the proposal share path reads. Nothing is applied automatically; the designer chooses what to apply, edit by edit, and sent proposals stay pinned (`F8-15`, cited).
- The banner and the persistent marking are drawn by the studio shell — `docs/ux/briefs/SCR-MS-03-studio-shell.md` states `survey-updated-review-needed` and `staleness-marker`, built by T-MS-360 (`docs/tasks/MS-studio-c.md`). The shell renders this task's state; it does not derive it.
- The survey side of the join is M04-66 in T-M04-015 (`docs/tasks/M04-survey.md`) — versioned append and the superseded state. This task is the design-side reconciliation that M04-66 points at.

**Counterpart edits outside this file — the two this task depends on have landed; one further `M05-13` counterpart, on the proposal-LIST leg, is still open:**
1. **DONE** — `docs/prd/foundations/F6-notifications-and-search.md`'s event matrix now carries the `design_survey_superseded` row for M05 with recipient "the design's author (own)", push ✓, sourced to `M05-13` (owner ruling 2026-08-04 Q24); `docs/prd/modules/M05-design-studio.md` §4 ("This module provides") registers the same event, so both sides of `F6-10`'s cross-check name it and T-FPLAT-018 (`docs/tasks/F-platform.md`) has a channel for the emit above.
2. **DONE** — carried by T-M06-018's send-gate DONE WHEN (`docs/tasks/M06-proposals.md`): given a design carrying the review-needed marker, when a draft proposal built on it is sent from the share sheet, then the send is blocked and the stated reason names the superseding survey version. This task holds the gating state; the send path that honours it is M06's. (`F8-17`'s recompute-in-flight block is a different condition and does not cover this one.)
3. **OPEN when this note was written — being closed in this same wave** — the proposal-LIST leg of the marker's surface. `docs/ux/briefs/SCR-M06-19-proposal-list.md` carries no state for the review-needed condition (its States list has `stale-badge`, the `M06-46` comparison, only, and `M05-13` is not among its verbatim rows), while T-M06-019 (`docs/tasks/M06-proposals.md`) already makes the review-needed row state a closing condition and records the required brief edit as its own **counterpart edit required outside this file** note. That edit is the brief owner's and is being made this wave; when it lands this item closes with nothing further to do here. It does not gate T-MS-117 — this task owns the marker state and the emit, and the list rendering of the marker is M06's — but it is why the ledger above is not a whole-of-`M05-13` clearance. (This header previously read "**both landed; no open counterpart work remains**"; that wording is quoted here for traceability — it was true of items 1 and 2 and overlooked this third leg.)

---

### T-MS-118 · Tier B — large-C&I block editing, GPU/CPU shading equivalence and server-side simulation

**Type:** engine · **Tier:** P1
**PRD rows:** M05-91
**PORT:** no POC counterpart — `docs/prd/_process/studio/inventory/file-claims.md` claims no scale-regime files; this extends T-MS-116's payload and the ported shading engine rather than porting an existing one. That shading engine is T-MS-207's ported `3d_design_studio/src/features/solar-studio/lib/shading.ts` (MS6-03's measured raycast engine, `docs/tasks/MS-studio-b.md`), given a GPU executor and a permanently retained CPU path, never replaced.
**DEFECTS:** none registered against M05-91 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **M05-91** (P1) — **Tier B capabilities (P1): large-C&I editing and simulation** — draw a zone polygon → auto-fill with tables; drag/rotate/split blocks; per-block GCR and tilt; per-table delete/nudge; keep-out subtraction — on-object direct manipulation, touch-first, working at 375 px (the DoD unchanged); GPU-accelerated shading **with a CPU fallback path retained permanently**, both pinned within ±2% on a golden scene (one engine version, two executors — an honesty-relevant equivalence); server-side full simulation for batch/over-budget designs, results stamped and staleness cleared on completion.

**DONE WHEN:**
- Given GPU and CPU executors on the golden scene, when compared, then results agree within ±2% (M05-91).
- Given a recompute over budget in-browser, then the server simulation path runs with stamped results and money stays provisional for the whole window (M05-91, M05-94 — the module's edge-case ruling; the money half is `F8-17`'s, cited, and the proposal-issue block is M05-94's).
- Given a zone polygon closed, when auto-fill runs, then it fills with tables; blocks drag, rotate and split; per-block GCR and tilt and per-table delete/nudge apply; keep-out subtraction holds — as on-object direct manipulation, touch-first, working at 375 px with the Definition of Done unchanged. (Beyond the ±2% line above, M05-91's editing and simulation clauses carry no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion.)
- The CPU shading path is retained **permanently** — it is a fallback, never a deprecation step. One engine version, two executors: any change to the engine re-runs the golden-scene comparison, and a GPU-only result is never shipped as the sole executor.
- Server simulation stamps its results and clears staleness on completion; a stamped result that predates a later edit self-stales by comparison like every other pinned output (M05-10, `F8-13`/`F8-14` cited).
- Release gate: `≤30 s C&I (GPU)` full recompute, `≤3 s` incremental-edit heatmap first paint and the `≥30 fps` orbit floor per M05-95 — a capability tier does not ship over budget.
- The surface half — the block/table sheets and the on-object manipulation — renders on the layout editor (`docs/ux/briefs/SCR-MS-08-step6-layout-editor.md`, T-MS-205 in `docs/tasks/MS-studio-b.md`) and the 3D scene (`docs/ux/briefs/SCR-MS-09-3d-scene.md`, T-MS-206); those screens consume this engine, and the paradigm switch they present is T-MS-116's M05-89.

---

### T-MS-119 · Tier C — single-axis trackers with backtracking, DEM terrain import and terrain-aware row spacing

**Type:** engine · **Tier:** P2
**PRD rows:** M05-92
**PORT:** no POC counterpart for the terrain tier — `docs/prd/_process/studio/inventory/file-claims.md` claims no scale-regime files; this extends T-MS-116's payload and T-MS-118's Tier B block model. The winter-solstice shadow-free pitch model this row generalises is T-MS-207's ported `3d_design_studio/src/features/solar-studio/lib/spacing.ts` (MS6-04/MS6-53, `docs/tasks/MS-studio-b.md`), extended to sloped ground at block granularity, never replaced.
**DEFECTS:** none registered against M05-92 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **M05-92** (P2) — **Tier C capabilities (P2): utility scale** — single-axis trackers with closed-form GCR backtracking (rows never self-shade at low sun), validated against the community reference model; terrain import from a **free global 30 m DEM** (v1 reference implementations: GLO-30 baseline, SRTM fallback) with draped-mesh ground and tables sitting on the terrain surface, **flat ground remaining the default when no DEM is loaded**; terrain-aware row spacing (the winter-solstice shadow-free solver generalised to sloped ground at block granularity). **Terrain data unavailable → flat-terrain assumption with provenance `assumed` and a visible warning on ground-mount outputs; rooftop work never touches this path.**

**DONE WHEN:**
- (M05-92 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion — the capabilities are exactly as the row states them: closed-form GCR backtracking validated against the community reference model, GLO-30/SRTM DEM import with draped-mesh ground and tables on the terrain surface, and the winter-solstice shadow-free spacing solver generalised to sloped ground at block granularity.)
- Given DEM unavailable, then the flat-ground assumption applies with provenance `assumed` and a visible warning on ground-mount outputs (M05-92 — the module's own edge-case line). Flat ground stays the default whenever no DEM is loaded; the provenance is `assumed` and never `measured`, and DEM-draped ground is `derived`, never `measured` (M05-94, cited). The P0 anchor this must not weaken is MS2-22 in T-MS-108 — "flat-terrain-only stated, never approximated".
- Rooftop work never touches this path: a rooftop design neither loads a DEM nor renders a terrain warning.
- Given sloped ground, when row pitch is solved, then it is T-MS-207's winter-solstice shadow-free pitch model (`3d_design_studio/src/features/solar-studio/lib/spacing.ts`, MS6-04/MS6-53 in `docs/tasks/MS-studio-b.md`) extended at block granularity — one pitch model shared by flat and sloped ground, extended and never replaced, and the flat-ground result it already produces is unchanged by this task.
- Release gate: `≤90 s utility` full recompute, `≤5 s` incremental-edit heatmap first paint, `≤10 min p95` server simulation at utility and the orbit floors that row states (`≥30 fps`, mobile utility `≥24`, view-prioritised) per M05-95 — a capability tier does not ship over budget.
- Cross-slope tracker articulation is out of scope by §5 of `docs/prd/modules/M05-design-studio.md`, deferred with an explicit trigger; this task builds the single-axis tracker table on a draped mesh and nothing beyond it.
- The surface half renders on the layout editor and the 3D scene (`docs/ux/briefs/SCR-MS-08-step6-layout-editor.md`, `docs/ux/briefs/SCR-MS-09-3d-scene.md` — T-MS-205 and T-MS-206 in `docs/tasks/MS-studio-b.md`); those screens consume this engine.

---

### T-MS-120 · Block-level electrical and permit/DXF outputs at scale

**Type:** engine · **Tier:** P1
**PRD rows:** M05-93
**PORT:** no POC counterpart for the block tier — `docs/prd/_process/studio/inventory/file-claims.md` claims no scale-regime files; this layers above the combiner architecture T-MS-271 (`docs/tasks/MS-studio-b.md`) ports, and does not modify it.
**DEFECTS:** none registered against M05-93 in `docs/prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **M05-93** (P1) — **Block-level electrical extends — never replaces — the combiner architecture:** an inverter-block tier for central-inverter blocks; string inverters remain for ≤10 MW distributed designs; MV collection is stubbed as a **LABELLED ASSUMPTION** — no MV engineering claim; reconciliation gates hold (Σ combiner inputs = total strings; Σ blocks = project total). Permit/DXF outputs at scale: zone plan, table rows with pitch dimensions, per-block electrical single-line, DEM contour underlay — **provenance tiers print on every sheet, unchanged**.

**DONE WHEN:**
- (M05-93 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion.)
- Given a central-inverter design, when the electrical plan renders, then the inverter-block tier sits **above** the existing combiner architecture — T-MS-271's string-to-combiner plan is extended, never replaced, and string inverters remain available for ≤10 MW distributed designs.
- Given any scale design, when the plan is validated, then both reconciliation gates hold: Σ combiner inputs = total strings (T-MS-271's existing gate, unchanged) and Σ blocks = project total (this task's addition). A design that fails either gate does not pass the step.
- Given MV collection, when it appears anywhere, then it is stubbed as a LABELLED ASSUMPTION with no MV engineering claim — no MV sizing, no MV protection coordination, nothing presented as engineered. The structural/engineering disclaimer travels with block-level DXF sheets and MV assumptions (M05-94, `F8-25`/`F8-28` cited).
- Given permit/DXF output at scale, when a sheet prints, then provenance tiers print on every sheet unchanged — a block aggregate inherits the **weakest** tier of its members (M05-94, `F8-04` cited).
- The surface half — the scale permit/DXF sheets and the block electrical single-line — renders on the SLD step (`docs/ux/briefs/SCR-MS-11-step8-sld.md`, T-MS-268 in `docs/tasks/MS-studio-b.md`); that screen consumes this engine.

---

## Laws (enforced through screens and review, no standalone build)

- **M05-01** (P0) — **The census is this module's acceptance baseline, incorporated by reference as Appendix A, and it never shrinks.** Every census entry is a binding acceptance item for the studio; the appendix maps every entry to the feature area that carries it. A change that would drop, downgrade or quietly reword a census behaviour is out of order at any time, in this pass or pass two.
  *Enforced by:* the acceptance run of every studio task in this file and its sibling — Appendix A of `docs/prd/modules/M05-design-studio.md` is the checklist; a task may not close having dropped a census behaviour.

- **M05-07** (P0) — **The studio never opens blank: every surface has explicit loading, empty and error states.** No screen shows a blank canvas until data hydrates; the Definition of Done (`F7-43` item 2, applied unreduced to the studio by `F7-44`) is cited as the binding contract.
  *Enforced by:* the "three base states" clause in the DONE WHEN of T-MS-101, T-MS-102 and T-MS-103, and the same clause on every other studio screen task.

- **M05-08** (P0) — **Touch-first at 375 px with full parity is a property of every feature area in this module, including the canvases.** Mode-based tools instead of modifier keys; large handles on selection; snap and nudge instead of pixel-accurate drags; on-screen equivalents for every keyboard-only control; the studio presented on mobile as the authenticated full-parity WebView. This row exists so the commitment is testable per studio surface; the laws are `F7-30`/`F7-32`/`F7-29`/`F7-44`, cited not restated.
  *Enforced by:* the "375px and 1536px with full parity" clause in the DONE WHEN of T-MS-101/102/103, and the visible-equivalent rows those screens carry (MS2-03, MS3-20, MS3-21).

- **M05-10** (P0) — **Every design pins its inputs, and staleness is derived by comparison — never a flag someone flips.** The design records the catalog release, price-book version, market-pack rules version and computation-engine versions it used; publishing a newer catalog release or pack revision **self-stales** every design pinned to an older label. The studio surfaces staleness wherever the affected numbers appear, with the specific newer input named.
  *Enforced by:* the design-record surfaces of the studio shell (`docs/ux/briefs/SCR-MS-03-studio-shell.md`) and every figure-bearing studio screen; review checks that no staleness flag is hand-set. T-MS-117 adds the survey version to this pinned-input set, so M05-13's supersession marker is derived by the same comparison rather than by a flag.

- **M05-11** (P0) — **A design edited after its proposal exists makes that proposal's pricing visibly stale — the studio's side of the money-never-stale law.** The design surfaces "a proposal was built on an older version of this design" wherever it matters (Done step, BOM, captures review), and the proposal-side staleness display is `modules/M06`'s. Figures inside an already-sent document never move (`F8-15`, cited).
  *Enforced by:* the Done, BOM and captures-review screens (`docs/ux/briefs/SCR-MS-13-done-step.md`, `docs/ux/briefs/SCR-MS-12-step9-bom.md`, `docs/ux/briefs/SCR-MS-10-step7-proposal.md`).

- **M05-12** (P0) — **Entitlement checks touch the studio only at save/creation and at proposal Generate — never mid-edit. The flagship is never interrupted per-keystroke, and existing designs always open.** Gate mechanics, ceilings and upgrade prompts are `modules/M12`'s; this module's law is the placement: no entitlement denial ever interrupts editing, blanks a canvas or locks an open design. **The tension is resolved (owner ruling 2026-08-04, Q28): zero feature gates exist in the studio** — the kW ceiling per tier is the **only** gate, enforced exactly at these checkpoints, and over-ceiling designs stay readable forever; the census's no-tier-gate rule holds as law with the ceiling as its single sanctioned boundary.
  *Enforced by:* the shell's Save/Generate paths (`docs/ux/briefs/SCR-MS-03-studio-shell.md`) and review — every studio screen task closes with zero in-surface entitlement checks; MS1-09 in T-MS-101 is the Step-1 instance.

- **M05-56** (P2) — **Yield-uncertainty reporting (P50/P90 exceedance) is designed-for as an additive layer on the same energy model** — no second engine, no re-labelling of existing figures; needed when enterprise/utility tenants arrive.
  *Enforced by:* review of the energy-model work behind the energy report (`docs/ux/briefs/SCR-MS-09-3d-scene.md`) — the model must admit an additive exceedance layer; nothing is built for it in v1 (§5 non-goals of `docs/prd/modules/M05-design-studio.md`).

- **M05-60** (P0) — **The staleness law binds captures: a capture taken before a design change is stale and must say so — never silently show an out-of-date picture.** This is the studio-side instance of the imagery-honesty law; it rides into the proposal and the customer link with the capture.
  *Enforced by:* the captures/review screen (`docs/ux/briefs/SCR-MS-10-step7-proposal.md`, rows M05-59/M05-61) and the customer surfaces that carry the capture.

- **M05-77** (P0) — **The crew sees no money — a work order, not a priced document — on every surface this module emits.** No commercial figure appears on the installation plan or any crew-facing output; the role-surface law is `F2-05`–`F2-07` (cited).
  *Enforced by:* the installation work order screen (`docs/ux/briefs/SCR-MS-17-installation-work-order.md`) and its print output; review rejects any money field on a crew surface.

- **M05-80** (P0) — **Exactly one variant per lead may be recommended, and the customer sees exactly one.** Setting `is_recommended` moves the mark, never duplicates it; the customer link and proposal render the recommended variant (their modules' halves).
  *Enforced by:* the design list and variant-compare screens (`docs/ux/briefs/SCR-MS-01-design-list.md`, `docs/ux/briefs/SCR-MS-14-variant-compare.md`).

- **M05-81** (P0) — **A customer changing their mind on size is a variant, not a rewrite.** The standing design is preserved; a duplicate is adjusted and compared; the recommendation moves if warranted.
  *Enforced by:* the design list's duplicate/new-variant actions (`docs/ux/briefs/SCR-MS-01-design-list.md`) and review of any in-place resize path.

- **M05-82** (P0) — **The rule that does not bend: the product never computes structural adequacy — sign-off is a recorded human decision (who + when), and an unapproved design is never shown to the customer.** The laws are published at `F8-25`/`F8-26`/`F8-28` and are cited, not restated; this module owns the surfaces that make them true.
  *Enforced by:* the sign-off review screen (`docs/ux/briefs/SCR-MS-16-signoff-review.md`), the customer-facing gate on `docs/ux/briefs/SCR-F5-05-customer-3d-view.md`, and the engineer-verification lines this file's own rows carry (MS3-32 in T-MS-103).

- **M05-87** (P0) — **The studio designs from 1 kW to 100 MW without a rewrite, in three regimes:** Rooftop 1–500 kW (≤ ~1,100 modules, per-panel editing, flat ground) · Large C&I 0.5–10 MW (≤ ~20k modules, block/table editing) · Utility 10–100 MW (≤ ~175k modules, zone → block → tracker table, terrain-aware). Every scale capability is investment into the studio moat, never a reason to cut studio capability.
  *Enforced by:* review of every studio task against the regime table; T-MS-116 builds the payload that makes "without a rewrite" true, and T-MS-118 and T-MS-119 build the Large C&I and Utility regimes it names.

- **M05-88** (P0) — **Above rooftop scale the editable unit is the block/table/zone — never the panel; panels become derived instances of a table.** Regime is a property of the **design**, not the tenant: a 100 kW rooftop and a 40 MW park coexist in one tenant. The design payload carries blocks alongside the per-panel rooftop model from day one, so 100 MW needs no migration.
  *Enforced by:* T-MS-116, which owns both the payload and row M05-89's census guarantee, and the layout editor's paradigm-switch surface (`docs/ux/briefs/SCR-MS-08-step6-layout-editor.md`, T-MS-205 in `docs/tasks/MS-studio-b.md`).

- **M05-94** (P0) — **Scale changes resolution, never honesty — and never physics claims.** Provenance goes block-level, not away: a block aggregate inherits the **weakest** tier of its members (`F8-04`, cited); DEM-draped ground is `derived` from a public 30 m DEM, never `measured`. The shading model's documented limits print at every scale (beam-only, linear-in-unshaded-area, no bypass-diode cliff, no string mismatch — partial-shade losses read optimistic at 1 kW and 100 MW alike; `F8-11`, cited). Structural adequacy is never computed at any scale — tracker foundations, pile embedment and wind loading on a 100 MW park are engineer-led exactly as a 3 kW rooftop is, and the disclaimer travels with every structure-bearing output including block-level DXF sheets and MV assumptions (`F8-25`/`F8-28`, cited). **Money never renders while stale at scale:** a long server recompute keeps money provisional for the whole window and proposal issue blocked until shading and the money path reconcile — no express lane (`F8-17`, cited).
  *Enforced by:* review of every provenance-bearing and money-bearing studio surface; T-MS-119 carries the DEM-provenance half (`derived` for draped ground, `assumed` for the flat-ground default) and T-MS-120 the block-level provenance and disclaimer on DXF sheets and MV assumptions; the BOM and proposal screens hold the money-provisional half (`docs/ux/briefs/SCR-MS-12-step9-bom.md`, `docs/ux/briefs/SCR-MS-10-step7-proposal.md`).

- **M05-95** (P1) — **Performance budgets are release criteria per regime — a capability tier does not ship over budget.** Full in-browser shading recompute ≤5 s rooftop / ≤30 s C&I (GPU) / ≤90 s utility; incremental edit → heatmap first paint ≤1 s / ≤3 s / ≤5 s; orbit ≥30 fps floors (mobile utility ≥24, view-prioritised); server simulation ≤10 min p95 at utility — measured on stated mid-range reference devices.
  *Enforced by:* the release gate — measured against T-MS-104's ported analysis worker and the 3D scene; the C&I budgets against T-MS-118 and the utility budgets against T-MS-119; no capability tier ships over budget.

- **MS1-07** (P1) — Step-1 form edits write through instantly and are NOT undo-stack entries (undo is reserved for geometry) (`CODE.step1-setup.3`).
  *Enforced by:* T-MS-101 — Step 1's form fields write through, and its undo stack holds only geometry.

- **MS1-19** (P0) — Relocation tolerance: re-confirming within 25 m NEVER wipes (survives map-relayout jitter); moving farther constitutes "new roof" (`CODE.step1-setup.36`).
  *Enforced by:* T-MS-101 — the confirm path (MS1-18/20/21) applies the tolerance; "Given a re-confirm at 8 m, Then nothing is wiped or prompted (MS1-19)" is its acceptance.

- **MS3-06** (P0) — Global m/ft preference honored on every readout and input; dims stored metric (`.9`).
  *Enforced by:* T-MS-103 (Step 3 readouts) reading the shell's global units toggle; "Given ft mode, Then all readouts/inputs honor it (MS3-06)" is its acceptance.

- **MS3-35** (P1) — The obstruction layer is reused READ-ONLY by the layout editor so both steps show identical shapes/chips/rings (`.42`).
  *Enforced by:* the layout editor screen (`docs/ux/briefs/SCR-MS-08-step6-layout-editor.md`) consuming T-MS-103's obstruction layer component unchanged; review rejects a second renderer.

---

## Realized elsewhere

These are `docs/prd/modules/M05-design-studio.md` baseline rows whose surface belongs to a studio step
outside this file's slice. The baseline row stays the acceptance gate (M05-01); the deep-dive doc
named beside it carries the same behavior in detail and its screen brief is where the build lands.

| Row | realized-by |
|---|---|
| M05-02 (P0) | `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` (studio wizard frame) |
| M05-03 (P0) | `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-04 (P0) | `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-05 (P0) | `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-06 (P0) | `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-09 (P0) | `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-21 (P0) | `docs/ux/briefs/SCR-MS-01-design-list.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` (design-list entry surface) |
| M05-78 (P0) | `docs/ux/briefs/SCR-MS-01-design-list.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.5 (variant lineage) |
| M05-37 (P0) | `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-38 (P0) | `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-39 (P0) | `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-40 (P0) | `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-41 (P0) | `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-42 (P0) | `docs/prd/modules/M05-studio/04-step4-components.md` row MS4-34 (everything derived recomputes from the store) |
| M05-43 (P0) | `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-44 (P0) | `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-45 (P0) | `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-46 (P0) | `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-47 (P0) | `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-48 (P0) | `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-49 (P0) | `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-50 (P0) | `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-51 (P0) | `docs/ux/briefs/SCR-MS-09-3d-scene.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-52 (P0) | `docs/ux/briefs/SCR-MS-09-3d-scene.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-53 (P0) | `docs/ux/briefs/SCR-MS-09-3d-scene.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-54 (P0) | `docs/ux/briefs/SCR-MS-09-3d-scene.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| MS3-40 (P1) | `docs/ux/briefs/SCR-MS-09-3d-scene.md` (per-type obstruction 3D visuals on the shared 3D scene) |
| M05-55 (P0) | `docs/ux/briefs/SCR-F5-05-customer-3d-view.md` + `docs/prd/modules/M05-studio/08-customer-surfaces.md` |
| M05-57 (P0) | `docs/ux/briefs/SCR-MS-10-step7-proposal.md` + `docs/prd/modules/M05-studio/06-step7-proposal.md` |
| M05-58 (P0) | `docs/ux/briefs/SCR-MS-10-step7-proposal.md` + `docs/prd/modules/M05-studio/06-step7-proposal.md` |
| M05-59 (P0) | `docs/ux/briefs/SCR-MS-10-step7-proposal.md` + `docs/prd/modules/M05-studio/06-step7-proposal.md` |
| M05-61 (P0) | `docs/ux/briefs/SCR-MS-10-step7-proposal.md` + `docs/prd/modules/M05-studio/06-step7-proposal.md` |
| M05-62 (P0) | `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-63 (P0) | `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-64 (P0) | `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-65 (P0) | `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-66 (P0) | `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-67 (P0) | `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-68 (P0) | `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-69 (P0) | `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-70 (P0) | `docs/prd/modules/M05-studio/09-step9-bom.md` §MS10.5 row MS10-30 (locked money invariants) |
| M05-71 (P0) | `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-72 (P0) | `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-73 (P0) | `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-74 (P0) | `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-75 (P0) | `docs/ux/briefs/SCR-MS-13-done-step.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` |
| M05-76 (P0) | `docs/ux/briefs/SCR-MS-17-installation-work-order.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.6 |
| M05-79 (P0) | `docs/ux/briefs/SCR-MS-14-variant-compare.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.5 |
| M05-83 (P0) | `docs/ux/briefs/SCR-MS-15-signoff-queue.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.3 |
| M05-84 (P0) | `docs/ux/briefs/SCR-MS-16-signoff-review.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.3 |
| M05-85 (P0) | `docs/ux/briefs/SCR-MS-16-signoff-review.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.3 |
| M05-86 (P0) | `docs/ux/briefs/SCR-MS-16-signoff-review.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.3 |

---

## Disposition index

| Row | Disposition |
|---|---|
| M05-01 | LAW |
| M05-02 | realized-by: T-MS-360 — `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-03 | realized-by: T-MS-360 — `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-04 | realized-by: T-MS-360 — `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-05 | realized-by: T-MS-360 — `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-06 | realized-by: T-MS-360 — `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-07 | LAW |
| M05-08 | LAW |
| M05-09 | realized-by: T-MS-360 — `docs/ux/briefs/SCR-MS-03-studio-shell.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-10 | LAW |
| M05-11 | LAW |
| M05-12 | LAW |
| M05-13 | T-MS-117 (marker, notification and send-gating state); banner surface realized-by: T-MS-360 — `docs/ux/briefs/SCR-MS-03-studio-shell.md` |
| M05-14 | T-MS-101 |
| M05-15 | T-MS-101 |
| M05-16 | T-MS-101 |
| M05-17 | T-MS-101 |
| M05-18 | T-MS-101 |
| M05-19 | T-MS-101 |
| M05-20 | T-MS-101 |
| M05-21 | realized-by: T-MS-363 — `docs/ux/briefs/SCR-MS-01-design-list.md` + `docs/prd/modules/M05-studio/11-shell-and-platform.md` |
| M05-22 | T-MS-102 |
| M05-23 | T-MS-102 |
| M05-24 | T-MS-102 |
| M05-25 | T-MS-102 |
| M05-26 | T-MS-102 |
| M05-27 | T-MS-102 |
| M05-28 | T-MS-102 |
| M05-29 | T-MS-102 |
| M05-30 | T-MS-103 |
| M05-31 | T-MS-103 |
| M05-32 | T-MS-103 |
| M05-33 | T-MS-103 |
| M05-34 | T-MS-103 |
| M05-35 | T-MS-103 |
| M05-36 | T-MS-114 |
| M05-37 | realized-by: T-MS-201 — `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-38 | realized-by: T-MS-201 — `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-39 | realized-by: T-MS-201 — `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-40 | realized-by: T-MS-201 — `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-41 | realized-by: T-MS-201 — `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-42 | realized-by: T-MS-203 (`docs/tasks/MS-studio-b.md`) — deepened as MS4-34, everything derived recomputes from the store |
| M05-43 | realized-by: T-MS-201 — `docs/ux/briefs/SCR-MS-07-step4-components.md` + `docs/prd/modules/M05-studio/04-step4-components.md` |
| M05-44 | realized-by: T-MS-205 — `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-45 | realized-by: T-MS-205 — `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-46 | realized-by: T-MS-205 — `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-47 | realized-by: T-MS-205 — `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-48 | realized-by: T-MS-205 — `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-49 | realized-by: T-MS-205 — `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-50 | realized-by: T-MS-205 — `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-51 | realized-by: T-MS-206 — `docs/ux/briefs/SCR-MS-09-3d-scene.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-52 | realized-by: T-MS-206 — `docs/ux/briefs/SCR-MS-09-3d-scene.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-53 | realized-by: T-MS-206 — `docs/ux/briefs/SCR-MS-09-3d-scene.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-54 | realized-by: T-MS-206 — `docs/ux/briefs/SCR-MS-09-3d-scene.md` + `docs/prd/modules/M05-studio/05-step6-editor.md` |
| M05-55 | realized-by: T-F5-005 — `docs/ux/briefs/SCR-F5-05-customer-3d-view.md` + `docs/prd/modules/M05-studio/08-customer-surfaces.md` |
| M05-56 | LAW |
| M05-57 | realized-by: T-MS-260 — `docs/ux/briefs/SCR-MS-10-step7-proposal.md` + `docs/prd/modules/M05-studio/06-step7-proposal.md` |
| M05-58 | realized-by: T-MS-260 — `docs/ux/briefs/SCR-MS-10-step7-proposal.md` + `docs/prd/modules/M05-studio/06-step7-proposal.md` |
| M05-59 | realized-by: T-MS-260 — `docs/ux/briefs/SCR-MS-10-step7-proposal.md` + `docs/prd/modules/M05-studio/06-step7-proposal.md` |
| M05-60 | LAW |
| M05-61 | realized-by: T-MS-260 — `docs/ux/briefs/SCR-MS-10-step7-proposal.md` + `docs/prd/modules/M05-studio/06-step7-proposal.md` |
| M05-62 | realized-by: T-MS-268 — `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-63 | realized-by: T-MS-268 — `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-64 | realized-by: T-MS-268 — `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-65 | realized-by: T-MS-268 — `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-66 | realized-by: T-MS-268 — `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-67 | realized-by: T-MS-268 — `docs/ux/briefs/SCR-MS-11-step8-sld.md` + `docs/prd/modules/M05-studio/07-step8-sld.md` |
| M05-68 | realized-by: T-MS-301 — `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-69 | realized-by: T-MS-301 — `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-70 | realized-by: T-MS-304 (`docs/tasks/MS-studio-c.md`) — deepened as MS10-30, the locked money invariants |
| M05-71 | realized-by: T-MS-301 — `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-72 | realized-by: T-MS-301 — `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-73 | realized-by: T-MS-301 — `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-74 | realized-by: T-MS-301 — `docs/ux/briefs/SCR-MS-12-step9-bom.md` + `docs/prd/modules/M05-studio/09-step9-bom.md` |
| M05-75 | realized-by: T-MS-310 — `docs/ux/briefs/SCR-MS-13-done-step.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` |
| M05-76 | realized-by: T-MS-318 — `docs/ux/briefs/SCR-MS-17-installation-work-order.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.6 |
| M05-77 | LAW |
| M05-78 | realized-by: T-MS-363 — `docs/ux/briefs/SCR-MS-01-design-list.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.5 |
| M05-79 | realized-by: T-MS-376 (`docs/tasks/MS-studio-c.md`) — brief `docs/ux/briefs/SCR-MS-14-variant-compare.md`; variant lineage `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.5 |
| M05-80 | LAW |
| M05-81 | LAW |
| M05-82 | LAW |
| M05-83 | realized-by: T-MS-312 — `docs/ux/briefs/SCR-MS-15-signoff-queue.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.3 |
| M05-84 | realized-by: T-MS-313 — `docs/ux/briefs/SCR-MS-16-signoff-review.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.3 |
| M05-85 | realized-by: T-MS-313 — `docs/ux/briefs/SCR-MS-16-signoff-review.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.3 |
| M05-86 | realized-by: T-MS-313 — `docs/ux/briefs/SCR-MS-16-signoff-review.md` + `docs/prd/modules/M05-studio/10-done-and-installation.md` §MS11.3 |
| M05-87 | LAW |
| M05-88 | LAW |
| M05-89 | T-MS-116 (census guarantee + remove-map scoping); surface realized-by: T-MS-205 — `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` |
| M05-90 | T-MS-116 |
| M05-91 | T-MS-118 (Tier B engine); surface realized-by: T-MS-205, T-MS-206 — `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/ux/briefs/SCR-MS-09-3d-scene.md` |
| M05-92 | T-MS-119 (Tier C engine); surface realized-by: T-MS-205, T-MS-206 — `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` + `docs/ux/briefs/SCR-MS-09-3d-scene.md` |
| M05-93 | T-MS-120 (block electrical + DXF at scale); surface realized-by: T-MS-268 — `docs/ux/briefs/SCR-MS-11-step8-sld.md` |
| M05-94 | LAW |
| M05-95 | LAW |
| MS1-01 | T-MS-101 |
| MS1-02 | T-MS-101 |
| MS1-03 | T-MS-101 |
| MS1-04 | T-MS-101 |
| MS1-05 | T-MS-101 |
| MS1-06 | T-MS-101 |
| MS1-07 | LAW |
| MS1-08 | T-MS-101 |
| MS1-09 | T-MS-101 |
| MS1-10 | T-MS-101 |
| MS1-11 | T-MS-101 |
| MS1-12 | T-MS-101 |
| MS1-13 | T-MS-101 |
| MS1-14 | T-MS-101 |
| MS1-15 | T-MS-101 |
| MS1-16 | T-MS-101 |
| MS1-17 | T-MS-101 |
| MS1-18 | T-MS-101 |
| MS1-19 | LAW |
| MS1-20 | T-MS-101 |
| MS1-21 | T-MS-101 |
| MS1-22 | T-MS-101 |
| MS1-23 | T-MS-101 |
| MS1-24 | T-MS-106 |
| MS1-25 | T-MS-105 |
| MS1-26 | T-MS-105 |
| MS1-27 | T-MS-105 |
| MS1-28 | T-MS-104 |
| MS1-29 | T-MS-102 |
| MS1-30 | T-MS-102 |
| MS1-31 | T-MS-104 |
| MS2-01 | T-MS-102 |
| MS2-02 | T-MS-102 |
| MS2-03 | T-MS-102 |
| MS2-04 | T-MS-102 |
| MS2-05 | T-MS-102 |
| MS2-06 | T-MS-102 |
| MS2-07 | T-MS-102 |
| MS2-08 | T-MS-102 |
| MS2-09 | T-MS-102 |
| MS2-10 | T-MS-102 |
| MS2-11 | T-MS-102 |
| MS2-12 | T-MS-102 |
| MS2-13 | T-MS-107 |
| MS2-14 | T-MS-102 |
| MS2-15 | T-MS-102 |
| MS2-16 | T-MS-102 |
| MS2-17 | T-MS-102 |
| MS2-18 | T-MS-102 |
| MS2-19 | T-MS-102 |
| MS2-20 | T-MS-107 |
| MS2-21 | T-MS-102 |
| MS2-22 | T-MS-108 |
| MS2-23 | T-MS-102 |
| MS2-24 | T-MS-108 |
| MS2-25 | T-MS-108 |
| MS2-26 | T-MS-108 |
| MS2-27 | T-MS-102 |
| MS2-28 | T-MS-102 |
| MS2-29 | T-MS-102 |
| MS2-30 | T-MS-109 |
| MS2-31 | T-MS-102 |
| MS2-32 | T-MS-102 |
| MS2-33 | T-MS-109 |
| MS2-34 | T-MS-102 |
| MS2-35 | T-MS-102 |
| MS2-36 | T-MS-102 |
| MS2-37 | T-MS-102 |
| MS2-38 | T-MS-102 |
| MS2-39 | T-MS-102 |
| MS2-40 | T-MS-110 |
| MS2-41 | T-MS-110 |
| MS2-42 | T-MS-111 |
| MS2-43 | T-MS-110 |
| MS2-44 | T-MS-112 |
| MS3-01 | T-MS-103 |
| MS3-02 | T-MS-103 |
| MS3-03 | T-MS-103 |
| MS3-04 | T-MS-103 |
| MS3-05 | T-MS-103 |
| MS3-06 | LAW |
| MS3-07 | T-MS-103 |
| MS3-08 | T-MS-103 |
| MS3-09 | T-MS-103 |
| MS3-10 | T-MS-103 |
| MS3-11 | T-MS-103 |
| MS3-12 | T-MS-103 |
| MS3-13 | T-MS-103 |
| MS3-14 | T-MS-113 |
| MS3-15 | T-MS-113 |
| MS3-16 | T-MS-103 |
| MS3-17 | T-MS-103 |
| MS3-18 | T-MS-103 |
| MS3-19 | T-MS-103 |
| MS3-20 | T-MS-103 |
| MS3-21 | T-MS-103 |
| MS3-22 | T-MS-103 |
| MS3-23 | T-MS-103 |
| MS3-24 | T-MS-103 |
| MS3-25 | T-MS-103 |
| MS3-26 | T-MS-103 |
| MS3-27 | T-MS-103 |
| MS3-28 | T-MS-103 |
| MS3-29 | T-MS-103 |
| MS3-30 | T-MS-103 |
| MS3-31 | T-MS-114 |
| MS3-32 | T-MS-103 |
| MS3-33 | T-MS-103 |
| MS3-34 | T-MS-114 |
| MS3-35 | LAW |
| MS3-36 | T-MS-115 |
| MS3-37 | T-MS-115 |
| MS3-38 | T-MS-115 (lazy per-type streaming + procedural fallback); scene surface realized-by: T-MS-206 — `docs/ux/briefs/SCR-MS-09-3d-scene.md` |
| MS3-39 | T-MS-115 |
| MS3-40 | realized-by: T-MS-206 — `docs/ux/briefs/SCR-MS-09-3d-scene.md` |
