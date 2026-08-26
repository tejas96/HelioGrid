# MS3 · Studio Step 3 — Obstructions

Status: draft · Origin mix: SRC-CODE-dominant + BRIEF (Sitting 3 rulings, 2026-08-05) · Depends on: MS1 (canvas contract), MS2 (obstruction factory/platform conversion recorded at `drawing.93/.94`), M05 baseline, F7, F8
Sources: POC code inventory — obstructions (54 keys, 60/60 tests + live repro) · sitting rulings (5 rulings covering 10 fixes, S3-1…S3-5.6) · census A.10-4 (42/42 matched). The ledger index is retired; the POC repository named in `docs/build-order.md` is the source, and the sitting rulings are carried by the rows below.
Forward: MS6 (layout keep-out truth; ObstructionLayer reuse) · MS8 (bridging flags on drawings) · 3D behaviors consumed by the Scene doc (MS6-scene sections).

## 1. Purpose & scope

Step 3 places and edits everything that shades or blocks panels — 11 typed objects with per-type capability presets, the bridging system (may structure span above?), platform conversion, and 3D representations whose shadows can never disagree with the energy math. This document specs the full surface plus the Sitting-3 rulings; the obstruction factory itself is recorded at MS2 §4 (same construction path for manual and AI).

## 2. Personas & surfaces

Design Engineer (author); read per lead visibility. Web + mobile full parity (F7-30); the S3-4 touch pack applies. Uses MS1's canvas contract (MS1-28..30) at the project pin with calibration applied.

## 3. Feature areas

### MS3.1 — Canvas, backdrop & chrome

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS3-01 | Full-screen calibrated canvas at the project pin; cursor semantics (copy placing · crosshair measuring · grabbing dragging); pan/zoom disabled while placing or dragging; north badge, scale bar and zoom cluster per MS1's contract (`CODE.step3-obstructions.1/.6/.7`). | `SRC-CODE` | P0 |
| MS3-02 | Roofs render as a READ-ONLY backdrop with their red-dashed setback insets — no roof editing on this step (`.2`). | `SRC-CODE` | P0 |
| MS3-03 | Every obstruction drawn to scale (rotated rect or circle) with selected/idle styling and a constant-screen-size ID chip (e.g. WT1) (`.3/.4`). | `SRC-CODE` | P0 |
| MS3-04 | Blocking objects show a live red-dashed keep-out ring (radius = half max-dimension + setback); the ring is a circular preview — the exact keep-out is the layout engine's (MS6) (`.5`). | `SRC-CODE` | P0 |
| MS3-05 | Undo/redo ON this step: visible buttons + ⌘/Ctrl-Z/⇧Z, wired to the already-recorded history; one gesture = one step law (S3-2 fixes `.8`). | `BRIEF` S3-2 | P0 |
| MS3-06 | Global m/ft preference honored on every readout and input; dims stored metric (`.9`). | `SRC-CODE` | P0 |

### MS3.2 — Tools, picker & placement

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS3-07 | Tool rail: Add obstruction (count badge) · Show/Hide layer · Show all measurements · Measure · Open 3D — plus the S3-2 undo/redo pair (`.10/.13/.14`). | `SRC-CODE` | P0 |
| MS3-08 | Hide toggles the whole layer + selection overlay; picking a type force-unhides (`.11`). | `SRC-CODE` | P1 |
| MS3-09 | Show-all-measurements labels roof edges AND rectangular obstruction edges (S3-5.2 fixes `.12`). | `BRIEF` S3-5.2 | P0 |
| MS3-10 | Measure: two-point ruler, measure clicks beat placement clicks, restart/clear semantics per MS2-34 (`.13`). | `SRC-CODE` | P1 |
| MS3-11 | Open 3D replaces the step with the scene until closed, state intact (`.14`). | `SRC-CODE` | P0 |
| MS3-12 | Type picker: 11 cards with icon, name and default "L×W×H m" — tank 2×1.5×1.2 · dish 1×1×1.2 · chimney 0.8×0.8×2 · tree 3×3×5 · elevated 3×2.5×2.6 · building 8×6×9 · solar-WH 2×1.2×1.5 · ladder 0.6×1.5×3 (BETA) · windmill 1.8×1.8×3.5 · turbine vent 0.4×0.4×0.5 · other 1.5×1.5×1 (`.15`). | `SRC-CODE` | P0 |
| MS3-13 | Placement: pick → hint bar → one click drops ONE object at defaults, exits placement, auto-selects; Esc cancels (`.16`). | `SRC-CODE` | P0 |
| MS3-14 | Factory defaults (shared with AI imports): auto-anchor to the roof under the drop (or ground), label = type code + NEXT FREE number (S3-5.1 fixes the count-collision in `.17`), shape by type, dims floored 0.3/0.1 m, setback 0.5 m, full capability preset written (`.17`). | `SRC-CODE` + `BRIEF` S3-5.1 | P0 |
| MS3-15 | Per-type capability presets (all per-instance editable): tank/solar-WH bridgeable + top-access + engineer-flag; dish/ladder bridgeable (+0.5 m clearance for ladder); chimney/vent/windmill must-stay-open-to-sky; tree no-access; elevated supports-load; building/other base (`.18`). | `SRC-CODE` | P0 |
| MS3-16 | Empty state shows a one-line hint: "Add anything that shades or blocks panels — tanks, chimneys, trees" (S3-5.6 fills `.41`). | `BRIEF` S3-5.6 | P1 |

### MS3.3 — Direct manipulation

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS3-17 | Select: topmost object at the tap, hit-tested against the TRUE shape bounds (S3-5.4 fixes the corner-tap race in `.19`); empty tap deselects (`.19`). | `SRC-CODE` + `BRIEF` S3-5.4 | P0 |
| MS3-18 | Move: grab-point-preserving drag; owning roof re-resolves LIVE during the drag and bridged panels reconcile in the same patch; Esc/click ends (`.20`). | `SRC-CODE` | P0 |
| MS3-19 | Resize: rect = 4 corner handles, symmetric about center in the rotated frame; circle = east handle sets diameter; drag floors 0.3 m (`.21/.22`). | `SRC-CODE` | P0 |
| MS3-20 | Rotate: stem handle above the object, free = 1° rounding, 15° steps via Shift AND the visible steps toggle (S3-4 extends `.23`); dead zone at center; normalized 0–359. | `SRC-CODE` + `BRIEF` S3-4 | P0 |
| MS3-21 | Keyboard set kept + touch equivalents: Esc priority chain, Delete (unless locked), arrow nudges 0.1 m (Shift 1 m) — plus on-bar nudge arrows (tap 0.1 m, long-press 1 m) per S3-4; every nudge = one undo entry + roof re-resolve (`.25`). | `SRC-CODE` + `BRIEF` S3-4 | P0 |
| MS3-22 | Floating context bar clears both body and ring: exactly seven actions — Duplicate · Shape · Size & rotation · Settings · Lock/Unlock · Delete · Deselect (`.26`). | `SRC-CODE` | P0 |
| MS3-23 | Duplicate: +2,+2 m copy labeled "{label}c", re-anchored, selected, one undo step; available while locked (`.27`). | `SRC-CODE` | P1 |
| MS3-24 | Lock: handles hidden, edit/delete refused with tooltips, Duplicate/Settings stay; locks PERSIST with the project (S3-5.3 fixes session-only `.24`). | `SRC-CODE` + `BRIEF` S3-5.3 | P0 |

### MS3.4 — Sheets (shape, size, settings)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS3-25 | Shape sheet: Rectangle ↔ Circle switch anytime; both dimension sets persist so switching back restores; each switch = one undoable patch + reconcile (`.28`). | `SRC-CODE` | P0 |
| MS3-26 | Size & rotation sheet: typed dims in the display unit, COMMIT-ON-BLUR/Enter with the drag-path floors (0.3 m size / 0.1 m height; empty/invalid never commits) and friendly correction; rotation slider 0–359°; one undo entry per committed change (S3-3 fixes `.29`). | `BRIEF` S3-3 | P0 |
| MS3-27 | Slider law (step-wide): any slider drag = exactly ONE undo entry (S3-3 fixes `.30`); setback slider 0–3 m with live ring redraw (`.31`). | `SRC-CODE` + `BRIEF` S3-3 | P0 |
| MS3-28 | Casts-shadow switch is REAL: writes the field the engine reads, 3D shadow + energy math respond, switch displays the effective state (S3-1 fixes `.32`). | `BRIEF` S3-1 | P0 |
| MS3-29 | Blocks-placement switch controls layout keep-out + the ring, and reveals the bridging card (`.33`). | `SRC-CODE` | P0 |
| MS3-30 | Bridging chain: "Panels may bridge above" → "Must remain open to sky" (blocks regardless) → clearance slider 0–1 m with the live "bridgeable above {h} m" hint; engineer-confirmation warning where the capability requires (`.34/.35`). | `SRC-CODE` | P0 |
| MS3-31 | Height drives everything: any height/size/position/capability edit reconciles bridged panels in the SAME patch — raising past clearance disables spanning panels, lowering re-enables (`.36`). | `SRC-CODE` | P0 |

### MS3.5 — Height card & platform conversion

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS3-32 | Convert to rooftop platform: one tap replaces the obstruction with a stacked roof "{label} platform" at base+height (circles → 12-gon); disabled with reason when the top can't be a usable roof; enabled hint carries the engineer-verification line (F8-25); one undo step (`.37`). | `SRC-CODE` | P0 |
| MS3-33 | HEIGHT INFO card: Placement / Base surface / Top-from-ground — grounded on the SAME surface number the 3D uses on pitched roofs (S3-5.5 fixes `.38`); identity footer (`.38/.39`). | `SRC-CODE` + `BRIEF` S3-5.5 | P0 |
| MS3-34 | Everything derived recomputes live from the store (owning roof, heights, clearance hints, ring, count badge) (`.40`). | `SRC-CODE` | P0 |
| MS3-35 | The obstruction layer is reused READ-ONLY by the layout editor so both steps show identical shapes/chips/rings (`.42`). | `SRC-CODE` | P1 |

### MS3.6 — 3D representation (honesty in three dimensions)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS3-36 | Grounding: every object sits on the surface resolved from its POSITION (stale anchors healed, deleted roofs fall back, higher roof wins, explicit ground kept) — and the SHADING caster grounds identically to the visual mesh (`.43`). | `SRC-CODE` | P0 |
| MS3-37 | Shadow parity law: the 3D shadow and the energy engine use the SAME per-object predicate — they can never drift (`.44`, pairs with MS3-28). | `SRC-CODE` | P0 |
| MS3-38 | Asset pipeline: 6 types have real 3D models, streamed lazily only for types the project contains; loading and missing/corrupt assets render the procedural fallback — a 404 never crashes the scene (`.45/.46`). | `SRC-CODE` | P0 |
| MS3-39 | Model contracts: normalized 1 m-tall origin-at-base scaling with per-type footprint rules and test-pinned reference dims; runtime bbox grounding (no levitating/buried trees) (`.47/.48`). | `SRC-CODE` | P1 |
| MS3-40 | Per-type visuals: swaying tree, spinning windmill (procedural, blades shadow-excluded) and turbine vent, tinted buildings, type-true fallbacks (tank lid, dish tilt, brick chimney); polish note recorded: the vent's model variant spins whole-body — visual quirk only (`.49–.54`). | `SRC-CODE` | P1 |

## 4. Cross-module contracts

Consumes: MS1 canvas (MS1-28..30) + calibration; MS2's shared factory + platform conversion (`drawing.93/.94` — surface HERE); capability resolver + reconcile (s5 files, behavior law here at MS3-30/31). Provides: keep-out truth + bridging flags to MS6 layout; engineer-confirmation flags to MS8 drawings and the health system; the read-only layer to MS6 (MS3-35). The obstruction hit-test/selection contract feeds the 3D picker (Scene doc). Touch law S3-4 aligns with S2-1 (suite-wide: no Shift-only or keyboard-only interaction without a visible/touch equivalent — recorded as a studio-wide principle at the overview).

## 5. Non-goals

Roof editing on this step (MS3-02) · exact keep-out geometry in the ring preview (layout owns truth, MS3-04) · auto-classification of AI-detected lumps (user classifies, MS2-41) · shipping the windmill 3D model (procedural stands in until an asset exists).

## 6. Open items

None — Sitting 3 closed with zero open items (5 rulings, one a 6-part hygiene batch, 2026-08-05).

## Acceptance criteria (P0 coverage)

- Given placing or dragging, Then pan/zoom is suspended and cursors follow the mode (MS3-01); roofs stay read-only (MS3-02); shapes, chips and rings render to scale (MS3-03) with rings live-updating (MS3-04).
- Given a mistaken drag, When undo is tapped ON THIS STEP, Then it reverts as one step (MS3-05). Given ft mode, Then all readouts/inputs honor it (MS3-06).
- Given the rail, Then all five tools + undo/redo are present (MS3-07); measurements label rect obstruction edges too (MS3-09); 3D opens and returns with state (MS3-11).
- Given the picker, Then 11 cards show exact presets (MS3-12); one click places one object with auto-anchor (MS3-13); Given "WT1" was deleted while "WT2" exists, When a tank is placed, Then it takes the next FREE label — never a twin (MS3-14); presets carry the per-type capabilities (MS3-15).
- Given the rotate handle, When the visible 15°-steps toggle is on, Then rotation snaps in steps without any keyboard (MS3-20).
- Given a corner tap on a large building, Then it selects and STAYS selected (MS3-17). Given a drag over a roof boundary, Then the anchor re-resolves live and bridged panels reconcile (MS3-18). Given resize/rotate, Then floors and snap modes apply incl. the visible 15° toggle (MS3-19/20). Given a nudge from bar or keys, Then 0.1 m/1 m steps each = one undo entry (MS3-21). Given selection, Then the seven-action bar clears the ring (MS3-22). Given a locked object after reload, Then it is still locked and refuses edits (MS3-24).
- Given shape switch and switch-back, Then prior dims restore (MS3-25). Given an emptied height field, Then nothing commits and the floor is explained (MS3-26). Given a full slider sweep, Then exactly one undo entry exists (MS3-27).
- Given Casts-shadow OFF on any object, Then the 3D shadow disappears AND the energy math excludes it (MS3-28). Given blocking ON, Then the ring and layout keep-out apply and bridging reveals (MS3-29). Given open-to-sky ON, Then bridging is blocked regardless of clearance (MS3-30). Given a bridged tank raised past clearance, Then spanning panels disable in the same patch (MS3-31).
- Given a big tank, When converted, Then a "{label} platform" roof appears at base+height with the engineer line, one undo step (MS3-32). Given a pitched roof, Then the height card and the 3D report the SAME top-from-ground (MS3-33). Given any edit, Then derived values recompute live (MS3-34).
- Given a stale roof anchor, Then 3D grounds by position and the shading caster matches the mesh (MS3-36); the shadow predicate is shared engine-wide (MS3-37). Given a missing 3D asset, Then the fallback renders and nothing crashes (MS3-38).

Localization: all labels/hints via catalog (F3). Analytics: obstruction_placed {type}, bridging_configured, platform_converted, shadow_toggled {effective}.
