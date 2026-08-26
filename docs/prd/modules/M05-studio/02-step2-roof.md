# MS2 · Studio Step 2 — Roof (drawing, engines, AI detection)

Status: draft · Origin mix: SRC-CODE-dominant + BRIEF (Sitting 2 rulings, 2026-08-05) · Depends on: MS1 (canvas contract, calibration engine), M05 baseline §M05.3/§M05.6, F1, F4, F7, F8, M04 (remote-survey contract), BM-16/19
Sources: POC code inventory — roof drawing (105 keys) + roof ai (78 keys) — 318/318 area tests passing · sitting rulings (7 rulings covering 14 fixes, S2-1…S2-5.8) · census A.10-3 (42/42 matched across the two halves). The ledger index is retired; the POC repository named in `docs/build-order.md` is the source, and the sitting rulings are carried by the rows below.
Forward: MS3 (obstruction factory/platform conversion recorded here, surface there) · MS6 (segment-engine laws surface there) · MS8 (drawing-sheet primitives surface there) · MS12 (wizard shell).

## 1. Purpose & scope

Step 2 is the flagship's core: touch-first roof CAD over the pinned satellite image, honest AI detection with human review, and the pitched-roof engines that turn outlines into buildable faces. This document is the full behavior spec for the drawing surface, the conversion engines, and the detection pipeline at product level; engineering internals stay in the inventory ledgers, cited per row.

## 2. Personas & surfaces

Design Engineer (author) · Sales Executive/Survey Engineer (remote-survey-derived starts) · read per lead visibility. Web primary; mobile 375 px FULL parity with the S2-1 touch pack (pinch-zoom, two-finger pan, visible snap toggles) — F7-30/32.

## 3. Feature areas

### MS2.1 — Tool rail, modes & keyboard

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS2-01 | Visible tool rail (toolbar semantics, grouped Tools/Snap/Measure/View/History): Select, Draw roof, Detect (AI), Ortho-snap toggle, Show-all-measurements toggle, Measure, View in 3D (disabled at 0 roofs), Undo/Redo with mode-aware behavior (draft-point undo while drawing; redo disabled mid-draft) (`CODE.step2-roof-drawing.1–.10`). | `SRC-CODE` | P0 |
| MS2-02 | Full keyboard set kept ALONGSIDE visible tools: V/D/O tool keys, Esc cancel-priority ladder, Enter finish, Del point-delete, ⌘Z/⌘⇧Z — suppressed while typing or in sheets (`.11`). | `SRC-CODE` | P0 |
| MS2-03 | Touch pack: pinch-zoom anchored between fingers, two-finger pan, and a visible 15° rotate-snap toggle beside the rotate handle; mouse/keyboard behavior unchanged. | `BRIEF` S2-1 (closes SC.10-3.42, fixes `.87`, extends `.39`) | P0 |
| MS2-04 | Empty state offers BOTH paths: "Trace your roof — or let AI detect it" (`.24` fixed). Hint-toast system: single top bar, 2.4 s auto-dismiss, lock-vs-warning glyphs (`.25`); cursor states crosshair/grabbing/default (`.88`). | `BRIEF` S2-5.4 + `SRC-CODE` .25/.88 | P0 |

### MS2.2 — Drawing & snapping

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS2-05 | Click-to-place tracing with live dashed preview + live edge lengths on placed segments; too-close clicks (<0.15 m) rejected with the plain hint (`.12/.19`). | `SRC-CODE` | P0 |
| MS2-06 | Snap system: relative-angle guides (0/±90/180°, ±7.5° capture, world axes for the first edge; active on ortho or Shift) · object snap to other roofs' vertices/edges (min(0.5 m, 10 px), vertex beats edge, exact coincidence for shared walls, bypasses angle guides) · first-vertex axis alignment (8 px) · cyan guide rays · right-angle marks at ~90° corners (`.13–.17`). | `SRC-CODE` | P0 |
| MS2-07 | Close flow: within 14 px of the first point (≥3 pts) → "Complete Shape?" dialog; first point renders green and enlarges near the cursor (`.18`). | `SRC-CODE` | P0 |
| MS2-08 | Finish gate (ONE canonical validator shared verbatim with the AI importer): CCW normalize; ≥3 corners; finite; edges ≥0.15 m; no self-intersection; area ≥0.5 m²; must retain usable area after a 0.3 m inset probe — each failure a plain-language reason (`.20`, rule source MS1's `.86`). | `SRC-CODE` | P0 |
| MS2-09 | Mumty auto-stack: a roof drawn fully inside another parents onto it at +2.2 m with auto-name and hint (`.21`); new-roof factory defaults (rcc_flat, 3 m, flat, south azimuth, 0.3 m setback, parapet off) from ONE factory shared by hand-drawn/duplicated/AI paths (`.22`). | `SRC-CODE` | P0 |
| MS2-10 | Draft affordances: crosshair glyph at snapped point, pan disabled while drawing, live status hint bar (aria-live) (`.23`). | `SRC-CODE` | P1 |

### MS2.3 — Roof list, selection & identity

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS2-11 | Roof chips: identity color dot (8-color palette by index), name, live unit-aware area, select/lock/delete (`.26/.29`); names always take the NEXT FREE number — no twins after deletions (S2-5.8, fixes `.44` note). | `SRC-CODE` + `BRIEF` S2-5.8 | P0 |
| MS2-12 | Lock: locked roofs render desaturated with a badge; all edit paths refuse with the hint; delete dimmed with "Unlock to delete"; locks PERSIST with the project (S2-5.7 fixes session-only `.27`). | `SRC-CODE` + `BRIEF` S2-5.7 | P0 |
| MS2-13 | Delete cascades in ONE undo step: panels, segments, on-roof obstructions, walkways, rails, arresters, inverter placements, strings pruned — no orphans (`.28`). | `SRC-CODE` | P0 |
| MS2-14 | Tap-select prefers the HIGHEST containing roof (mumty over terrace, ties → smaller footprint); selected roof paints last; paint order low→high (`.30/.31`). | `SRC-CODE` | P0 |

### MS2.4 — Editing (vertices, edges, whole roof)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS2-15 | Vertex edit set: constant-screen-size handles; drag with grab-offset + object snap; ONE undo snapshot per gesture; invalid release reverts silently; click→point action bar (Delete point/Close); delete refused at 3 corners; per-edge values spliced correctly on delete/insert; midpoint insert targets (refused under 0.3 m edges, halves inherit values, insert = the undo step, fresh vertex immediately draggable) (`.33–.37`). | `SRC-CODE` | P0 |
| MS2-16 | Whole-roof move with vertex-coincidence snap onto other roofs; rotate via handle about the centroid rotating slopeAzimuth in step, Shift/toggle 15° snap; both re-validate on release and run the dependent-items guard (`.38/.39` + S2-1 toggle). | `SRC-CODE` | P0 |
| MS2-17 | Edge-length labels: outside-the-edge chips (concave-correct side), constant screen size, never upside-down, hidden <0.5 m or <30 px; TAP TO TYPE an exact length — input in the USER'S DISPLAY UNIT (S2-5.1 fixes metric-only `.41`), accepts 0.2–500 m equivalent, moves the end vertex along the edge direction, guard-checked (`.40–.42`). | `SRC-CODE` + `BRIEF` S2-5.1 | P0 |
| MS2-18 | Exact-coordinates panel (East/North metres per vertex, commit on blur/Enter, guard-checked) and the selected-roof action bar (Roof type · Height & parapet · Coordinates · Duplicate) (`.43/.45`). | `SRC-CODE` | P0 |
| MS2-19 | Duplicate: +5,+5 m offset copy, renamed, selected, ONE undo step — and FULLY INDEPENDENT: the copy never inherits face-group linkage (S2-5.2 fixes `.44`). | `SRC-CODE` + `BRIEF` S2-5.2 | P0 |
| MS2-20 | Every polygon write re-normalizes winding, re-validates, and resets per-edge arrays to uniform when lengths desync (`.46`); type/slope changes propagate plane-shared fields across the face group AND remap panel poses in the SAME undo step (`.50`). | `SRC-CODE` | P0 |

### MS2.5 — Roof types & conversion engines

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS2-21 | Roof Type sheet: four covering cards with EPC subtexts (RCC flat / metal shed / tile / ground array); disabled options explain WHY inline; tile-on-flat warns it still prices flat until converted (`.47/.48`). | `SRC-CODE` | P0 |
| MS2-22 | Ground Array conversion: height 0, pitch 0, 1.5 m boundary setback, parapet off, "Array Area A/B/…" naming, poses remapped — one undo step; flat-terrain-only stated, never approximated (`.49/.95`). | `SRC-CODE` | P0 |
| MS2-23 | Gable (2 faces): centroid-line split ⟂ ridge, pitch clamp 1–60°, faces 180° apart, no parapet, area conserved; ridge-consistency gate refuses asymmetric footprints with the measured step and points to Hip (`.52/.56/.57`); ridge-direction control when preview succeeds (`.51`). | `SRC-CODE` | P0 |
| MS2-24 | Hip (rectangles): OBB frame, ridge auto-swings to the long axis, ≥95% rectangularity gate, squares collapse to pyramids; convex fallback = straight-skeleton (one face per wall, kink-tolerant pre-clean, 3% tiling gate); reflex (L/T/U/plus) = wavefront simulation with spike-collapse and a 1% tiling gate that refuses honestly ("inside corners are only partly supported…") — never hangs (bounded events) (`.53/.58–.62`). | `SRC-CODE` | P0 |
| MS2-25 | Conversions CARRY THE COVERING (metal shed stays on clamps; tile stays on hooks — the BOM never silently re-prices) and cascade-delete the original + dependents in one undo step, linking faces by face group (`.55/.52`). | `SRC-CODE` | P0 |
| MS2-26 | Conversion pitch precedence: valid Google-detected pitch → roof's own → 20° default; out-of-range detections fall back, never error (`.54`). | `SRC-CODE` | P0 |

### MS2.6 — Height, pitch, azimuth & face groups

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS2-27 | Height & Parapet sheet: unit toggle in header; eave-height slider 2–30 m with role-aware hints; pitch slider 0–60° (S2-5.6 aligns to the engines, fixes `.66`), min 1° on face-group members; face-group propagation keeps the ridge level (pitch/eave shared; azimuth per-face; legacy roofs per-roof; identity preserved) (`.63/.64/.66/.67`). | `SRC-CODE` + `BRIEF` S2-5.6 | P0 |
| MS2-28 | Google pitch/azimuth suggestion banner: nearest insights segment ≤20 m, hidden when matching, Apply patches pitch+azimuth AND poses, NEVER auto-applied, per-roof remembered (`.65`, artifact side `ai.75/.77`). | `SRC-CODE` | P0 |
| MS2-29 | "Slopes toward" picker: tap the LOW side on the roof's own north-up shape → azimuth = exact outward normal; live compass readout; direction tip is HEMISPHERE-AWARE from site latitude (S2-5.5 fixes hard-coded `.69`) (`.68`). | `SRC-CODE` + `BRIEF` S2-5.5 | P0 |
| MS2-30 | Roof-plane math single source: eave-height datum, upslope rise, flush panels inherit pitch+azimuth; adjacent same-slope roofs share one eave datum (wraparound-safe tolerances), different heights never fuse (`.76/.77`). | `SRC-CODE` | P0 |

### MS2.7 — Setbacks & parapets

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS2-31 | Uniform setback slider (0–3 m) + per-edge overrides with "customised" badge and reset-to-uniform; red dashed usable-area preview, cached for 60 Hz drags (`.70/.71/.32`). | `SRC-CODE` | P0 |
| MS2-32 | Parapet: master toggle, direction, height/width CLAMPED (0.1–3 m / 0.05–1 m — S2-5.3 fixes unclamped `.72`), auto-skip-shared-walls toggle, tap-a-side picker with suppressed-shared sides non-tappable + tooltips + legend (`.72–.74`). | `SRC-CODE` + `BRIEF` S2-5.3 | P0 |
| MS2-33 | Shared-wall suppression law: ≥90% collinear coverage; higher roof wins; equal heights → exactly one deterministic wall — derived, never stored (`.75/.78`). | `SRC-CODE` | P0 |

### MS2.8 — Measure & calibration surface

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS2-34 | Measure tool: two-click line with live chip, third click restarts; result pill offers "Calibrate" and "New measurement" (`.79/.80`). | `SRC-CODE` | P0 |
| MS2-35 | Calibration dialog: measured vs actual, live ×k correction, Apply gated to plausible ±50% and |north| ≤45°; expert north-offset field with plain-language guidance; apply = ONE undo step rescaling all geometry (engine MS1-25/26) + hint (`.81–.83`). | `SRC-CODE` | P0 |

### MS2.9 — Dependent-items guard

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS2-36 | Every geometry change detects dependents (panels outside usable area, obstructions off-roof, walkway/rail endpoints, arresters, inverter edge indices) and raises the three-action dialog (Keep roof / Keep items for review / Remove invalid) — NEVER a silent cascade; typed changes blocked before applying, drags revert-then-ask reusing the pre-drag undo snapshot (`.84–.86`). | `SRC-CODE` | P0 |

### MS2.10 — AI detection (the honest pipeline)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS2-37 | Detection ladder: aerial (DSM+building-mask over the PINNED tile per S2-4c) → photo analysis → "draw it with the pen tool" — strictly sequential, each failure explained specifically; manual drawing always available (`ai.1–.5/.26`). PLUS the second-opinion path: when aerial succeeded, the review pill offers "Also try photo analysis"; extra ghosts join review and the cross-check floors disagreeing suggestions (<20% mask overlap → confidence ≤0.25 + verify warning, never deleted) (S2-3 wires `ai.72`; M04-20 live). | `SRC-CODE` + `BRIEF` S2-3/S2-4c | P0 |
| MS2-38 | Capability honesty: the photo-analysis entry — the binding label is "Detect from photo" — appears ONLY when the platform capability is live (S2-4a, M04-21); detection progress narrates three steps in the binding copy "Fetching aerial imagery…" → "Analyzing roof shapes…" → "Preparing your review…" (S2-4b, M04-14); per-detection metering rides BM-16/BM-19 (M04-23 contract — POC absence documented at `ai.78`). | `BRIEF` S2-4a/b + law | P0 |
| MS2-39 | Everything lands as review GHOSTS: pre-selected, tap to include/exclude, review pill with counts, imagery quality + DATE (all sources, S2-4c), warnings + per-shape skip reasons, ±0.5 m nudge arrows baked on accept, "Add selected" as ONE undo step with the post-import hint (`ai.52–.55`, drawing `.89–.91`). | `SRC-CODE` | P0 |
| MS2-40 | The artifact doorway is the ONLY path in: versioned, pin-guarded (~110 m), 150 m site extent, value gates (heights (0,60), pitch [0,60], azimuth [0,360), confidence clamped), per-entity drops with reasons (one bad shape never kills the batch), same sanitizer as manual drawing, whole-artifact rejections for wrong version/source/pin (`ai.9/.43–.51`). | `SRC-CODE` | P0 |
| MS2-41 | Geometric pipeline honesty constants (product-level): ≥20 m² components; 8-roof cap with warning; DSM height-coherent sub-building splitting; gated orthogonalization (never mangles non-rectilinear roofs); plane-fit with edge-ramp exclusion; pitch <3° reported flat; confidence = f(fit quality), footprint-only 0.4; obstructions = residual lumps typed 'other' for the USER to classify, top 5, fixed 0.5 confidence; RMSE >0.3 m adds "review by hand" warning; grid-mismatch and ground-estimate failures degrade with stated warnings; deterministic (same input → identical output) (`ai.24–.42`). | `SRC-CODE` | P0 |
| MS2-42 | Photo-analysis honesty: structured-only output (schema-enforced, temperature 0), precision-beats-recall prompt (never guess occluded edges; empty is valid), heights/pitch NEVER from imagery (nulls → manual defaults; type presets for objects), mandatory verify-on-site warning, model+prompt version recorded as provenance (`ai.60–.71`); wired for satellite AND uploaded survey/drone photos at P1 (S2-2). | `SRC-CODE` + `BRIEF` S2-2 | P0 |
| MS2-43 | Accepted entities: SAME factory as manual (naming continues, defaults apply), mumty parenting on accept, obstructions parent to the roof under them, provenance {source, confidence} stamped into the record (`ai.56–.59`, SC.10-3.41). | `SRC-CODE` | P0 |
| MS2-44 | Server-side product guarantees: keys never reach the browser (relay + SSRF guard), expired-raster retry semantics, day-cached rasters/insights (same pin never re-bills), envelope always explains (no naked failures), UTM-only rasters with mm-accurate inverse and a ≤0.5 m/50 m alignment gate against the app's own projector (`ai.6–.23/.73–.76`). | `SRC-CODE` | P0 |

## 4. Cross-module contracts & engine laws recorded here

Consumes: MS1 canvas contract (MS1-28..31), calibration engine (MS1-25..27), pinned tile (S2-4c ↔ MS1's imagery rows); M04 remote-survey contract rows M04-14/19/20/21/23 — all four alignments now BINDING here (S2-4a/b/c, S2-3); BM-16/19 metering. Provides: validated roofs/faces to MS3–MS9; obstruction factory + platform conversion (§26e) recorded at `drawing.93/.94` — SURFACE and rulings at MS3; segment-engine laws (`drawing.96–.100`: grid inference from real positions, single frame-angle source, collision-checked grow, 5–35° elevated tilt clamp with frame-flip guard, respace floor, prune/duplicate) — SURFACE at MS6; drawing-sheet primitives + StructureSheet honesty blocks (`drawing.101–.105`) — SURFACE at MS8/print. Engineering internals (skeleton/wavefront event math, vectorize/decode/UTM internals) stay ledger-cited under their behavior rows.

## 5. Non-goals

Auto-accepting AI output (ghosts forever) · measuring heights/pitch from photos (D35) · flux/irradiance from the detection imagery (PVGIS remains sole energy source, `ai.11`) · storing upstream raster URLs (expire ~1 h) · Shift-only interactions without visible equivalents (S2-1) · silent dependent-item cascades (MS2-36).

## 6. Open items

None — Sitting 2 closed with zero open items (7 rulings, one an 8-part hygiene batch, 2026-08-05).

## Acceptance criteria (P0 coverage)

- Given the step opens, Then every tool is a visible, labeled, stateful rail button — Select/Draw/Detect/Ortho/Measurements/Measure/3D/Undo/Redo — with mode-aware undo semantics (MS2-01); and every shortcut (V/D/O/Esc/Enter/Del/⌘Z/⌘⇧Z) works but is suppressed while typing or in sheets (MS2-02).
- Given a phone, When the user pinches/two-finger drags, Then the canvas zooms around the fingers and pans; and the rotate-snap toggle is tappable (MS2-03).
- Given an empty step, Then the hint offers tracing AND auto-detect (MS2-04). Given a trace click <0.15 m from the last point, Then it is rejected with the plain hint (MS2-05).
- Given ortho on, Then relative-angle guides snap within ±7.5° and object snap beats them on exact coincidence (MS2-06). Given a click near the first point with ≥3 corners, Then the Complete Shape dialog offers keep/complete (MS2-07).
- Given any finish path (manual or AI), Then the ONE canonical validator gates it with plain reasons (MS2-08). Given a roof drawn inside another, Then it mumty-stacks at +2.2 m (MS2-09); and factory defaults apply from the single factory (MS2-09). Given drawing mode, Then pan is disabled and the status bar narrates (MS2-10).
- Given deletions created a name gap, When a roof is added, Then it takes the next FREE name (MS2-11). Given a locked roof and a reload, Then the lock persists and edits still refuse (MS2-12). Given delete, Then all dependents cascade in one undo step (MS2-13). Given stacked roofs, Then tap selects the highest container (MS2-14).
- Given a vertex drag to an invalid shape, Then release reverts silently with one undo entry total (MS2-15). Given rotate with snap on, Then 15° steps apply from the visible toggle (MS2-16). Given feet display, When an edge label is tapped, Then the input reads and accepts feet (MS2-17). Given typed coordinates commit, Then the guard checks dependents (MS2-18). Given a duplicated gable face, When the original's pitch changes, Then the copy NEVER moves (MS2-19). Given a vertex-count change, Then per-edge arrays reset to uniform (MS2-20).
- Given a pitched face, Then Ground Array is disabled with the inline reason (MS2-21). Given ground conversion, Then naming/setback/pose rules apply in one step (MS2-22). Given an asymmetric footprint, Then Gable refuses with the measured step and points to Hip (MS2-23). Given a plus-shaped footprint, Then wavefront faces tile exactly or the whole roof refuses honestly (MS2-24). Given a metal-shed gable conversion, Then clamps carry — never hooks (MS2-25). Given a 70° detected pitch, Then precedence falls back rather than erroring (MS2-26).
- Given a face-group pitch edit, Then the ridge stays level and the slider reaches 60° (MS2-27). Given a matching suggestion, Then the banner hides; Apply is never automatic (MS2-28). Given a southern-hemisphere site, Then the direction tip says north-facing (MS2-29). Given adjacent same-slope roofs, Then one eave datum, and different heights never fuse (MS2-30).
- Given per-edge setbacks exist, Then the badge shows and reset returns to uniform (MS2-31). Given parapet width 0 typed, Then the clamp refuses it (MS2-32). Given two equal-height roofs sharing a wall, Then exactly one keeps the parapet, deterministically (MS2-33).
- Given two measure clicks, Then the pill offers Calibrate (MS2-34). Given k outside ±50%, Then Apply stays disabled with the reason (MS2-35).
- Given a roof edit strands panels, Then the three-action dialog appears and nothing cascades silently (MS2-36).
- Given aerial found 1 roof of 3 visible, When "Also try photo analysis" is tapped, Then photo ghosts join review and mask-disagreeing ones are floored with a warning (MS2-37). Given photo capability absent platform-side, Then no photo entry renders anywhere (MS2-38); and detection narrates three steps (MS2-38). Given ghosts, Then nothing enters the project before "Add selected", which is one undo step (MS2-39). Given an artifact from a moved pin, Then the whole artifact rejects; a self-intersecting shape drops alone with a reason (MS2-40). Given a flat roof with smoothed DSM edges, Then edge-ramp exclusion prevents fake pitch (MS2-41). Given any photo-AI result, Then heights are defaults, the verify warning shows, and provenance carries model+version+imagery date (MS2-42). Given accept, Then factory naming continues and provenance stamps persist (MS2-43). Given a re-detect on the same pin same day, Then cached rasters/insights serve without re-billing (MS2-44).

Localization: all tool labels/hints/dialog copy via catalog (F3); unit-aware displays per MS1's preference. Analytics: detect_run {rung, outcome}, ghosts_accepted {n_roofs, n_obstructions, source}, conversion_applied {type}, calibration_applied.
