# SCR-MS-06 · Studio Step 3 — Obstructions

Place and edit 11 typed obstructions on the calibrated roof canvas, with bridging, capabilities and platform conversion.

**Module:** MS (Design Studio) · **Personas:** Design Engineer, EPC Owner · **Context of use:** Design Engineer authors (MS3 §2); read per lead visibility. Web + mobile full parity (F7-30); the S3-4 touch pack applies — no Shift-only or keyboard-only interaction without a visible/touch equivalent. Uses MS1's canvas contract at the project pin with calibration applied; the canvas is light like every other surface — v1 is light-only, with no dark theme and no dark variant of any surface (`foundations/F7`, `F7-04`, P0; the shell carries the same law, SCR-MS-03). Touch canvas work over real imagery, often on a phone.

## Entry & exit

Reached from: Step 3 of the wizard (SCR-MS-03), after Step 2. Wizard-step gate (flagship note): the shell's **at least one roof** gate admits the user past Step 2 into this step; Step 3 itself has no named leave-gate — steps without gates say so by simply proceeding (MS12-03, shell contract). Leads to: Step 4 — Components (SCR-MS-07); "Open 3D" replaces the step with the scene until closed, state intact (MS3-11; the scene is SCR-MS-09).

## Requirements (verbatim)

### From `docs/prd/modules/M05-design-studio.md`

- **M05-30** (P0) — **The obstruction canvas always shows the census's standing set:** Step-2 roofs as a read-only backdrop (fill + red-dashed setback inset); every obstruction to scale with a constant-size ID chip (type code + number, e.g. WT1, TR2); a red-dashed setback ring per blocking object; north indicator; graphic scale bar; zoom in/out + live % + fit; free pan/zoom except while placing or mid-drag; undo/redo (one gesture = one step); units. _(Superseded visual facts — do not transcribe: "red-dashed" here and on the setback inset is a POC-code fact, not a design instruction. `F7-03` is P0 — "no screen in the product, restates a design-system value … zero raw colour literals and zero off-scale dimensions — every visual value reaches a screen through the design system, never by transcription." The product requirement is that a setback inset and a keep-out ring READ as constraint boundaries and read as distinct from committed geometry; their treatment comes from `design/ds-source`.)_
- **M05-31** (P0) — **Five tools, exactly:** Add obstruction (badge = count) with type picker · Show/Hide obstructions (also clears selection) · Show all measurements · Measure distance (restart clears prior) · Open 3D view (returns).
- **M05-32** (P0) — **The type picker carries the census's eleven types with their icons, names and default L×W×H dimensions** — Tank WT 2×1.5×1.2 · Dish DS 1×1×1.2 · Chimney CH 0.8×0.8×2 · Tree TR 3×3×5 · Elevated EL 3×2.5×2.6 · Building BL 8×6×9 · Solar WH SW 2×1.2×1.5 · Ladder LD 0.6×1.5×3 (BETA marker) · Windmill WM 1.8×1.8×3.5 · Turbine Vent TV 0.4×0.4×0.5 · Other OB 1.5×1.5×1. Choosing a type enters a cancellable touch placement mode with on-screen instruction; the next tap drops it at default size; the app auto-detects the owning roof (or "on ground") and auto-names (WT1, WT2…).
- **M05-33** (P0) — **Direct manipulation with the census constraints:** move (grab point under finger, roof re-checked on release) · resize rectangle (4 corner handles) · resize circle (1 handle, diameter) · rotate (stem handle, 15° snap or free) · **no dimension below 0.3 m** · a locked object cannot move/resize/rotate. Precision without a mouse: fine and larger nudge steps, rotation in exact degrees.
- **M05-34** (P0) — **Exactly seven context actions:** Duplicate (offset copy, recomputes roof) · Shape (Rectangle L×W / Circle diameter, switchable) · Size & rotation (typed exactly: L/W/H or diameter/H; rotation 0–359° in 1° steps) · Settings · Lock/Unlock · Delete · Deselect.
- **M05-35** (P0) — **Settings carry the census's physics-honest chain:** height drives shadow and bridging maths; SETBACK 0–3 m in 0.1 m steps (draws the ring; "buffer zone where panels cannot be placed"); CASTS SHADOW on/off; BLOCKS PANEL PLACEMENT on/off revealing the nested bridging chain — Panels may bridge above on/off; Must remain open to sky on/off, revealing Clearance 0–1 m in 0.05 m steps with the live calc ("Bridgeable when the array structure clears X m (its Y m + margin)") **and a warning that bridging is flagged for engineer confirmation**; CONVERT TO ROOFTOP PLATFORM (one-tap replacement with a "{label} platform" roof at combined height, stating structural adequacy needs engineer verification; unavailable-with-reason when the top is too small); HEIGHT INFORMATION read-only (owning roof or "On ground", base height, top-from-ground). _(non-UI half, build-side: height drives shadow/bridging maths; bridging flagged for engineer confirmation into sign-off — for awareness, not for drawing)_

### From `docs/prd/modules/M05-studio/03-step3-obstructions.md`

- **MS3-01** (P0) — Full-screen calibrated canvas at the project pin; cursor semantics (copy placing · crosshair measuring · grabbing dragging); pan/zoom disabled while placing or dragging; north badge, scale bar and zoom cluster per MS1's contract (`CODE.step3-obstructions.1/.6/.7`).
- **MS3-02** (P0) — Roofs render as a READ-ONLY backdrop with their red-dashed setback insets — no roof editing on this step (`.2`). _(Superseded visual fact — do not transcribe: "red-dashed" is the POC's code fact; the inset takes the design system's constraint-boundary treatment per `F7-03`. The binding behaviour is read-only backdrop + a visible setback inset.)_
- **MS3-03** (P0) — Every obstruction drawn to scale (rotated rect or circle) with selected/idle styling and a constant-screen-size ID chip (e.g. WT1) (`.3/.4`).
- **MS3-04** (P0) — Blocking objects show a live red-dashed keep-out ring (radius = half max-dimension + setback); the ring is a circular preview — the exact keep-out is the layout engine's (MS6) (`.5`). _(Superseded visual fact — do not transcribe: "red-dashed" is the POC's code fact; the keep-out ring takes the design system's constraint-boundary treatment per `F7-03`. The binding behaviour is a live ring at radius = half max-dimension + setback, legible as a preview rather than as the exact keep-out.)_
- **MS3-05** (P0) — Undo/redo ON this step: visible buttons + ⌘/Ctrl-Z/⇧Z, wired to the already-recorded history; one gesture = one step law (S3-2 fixes `.8`). _(non-UI half, build-side: one gesture = one undo step law on recorded history — for awareness, not for drawing)_
- **MS3-07** (P0) — Tool rail: Add obstruction (count badge) · Show/Hide layer · Show all measurements · Measure · Open 3D — plus the S3-2 undo/redo pair (`.10/.13/.14`).
- **MS3-08** (P1) — Hide toggles the whole layer + selection overlay; picking a type force-unhides (`.11`).
- **MS3-09** (P0) — Show-all-measurements labels roof edges AND rectangular obstruction edges (S3-5.2 fixes `.12`).
- **MS3-10** (P1) — Measure: two-point ruler, measure clicks beat placement clicks, restart/clear semantics per MS2-34 (`.13`).
- **MS3-11** (P0) — Open 3D replaces the step with the scene until closed, state intact (`.14`).
- **MS3-12** (P0) — Type picker: 11 cards with icon, name and default "L×W×H m" — tank 2×1.5×1.2 · dish 1×1×1.2 · chimney 0.8×0.8×2 · tree 3×3×5 · elevated 3×2.5×2.6 · building 8×6×9 · solar-WH 2×1.2×1.5 · ladder 0.6×1.5×3 (BETA) · windmill 1.8×1.8×3.5 · turbine vent 0.4×0.4×0.5 · other 1.5×1.5×1 (`.15`).
- **MS3-13** (P0) — Placement: pick → hint bar → one click drops ONE object at defaults, exits placement, auto-selects; Esc cancels (`.16`).
- **MS3-16** (P1) — Empty state shows a one-line hint: "Add anything that shades or blocks panels — tanks, chimneys, trees" (S3-5.6 fills `.41`).
- **MS3-17** (P0) — Select: topmost object at the tap, hit-tested against the TRUE shape bounds (S3-5.4 fixes the corner-tap race in `.19`); empty tap deselects (`.19`).
- **MS3-18** (P0) — Move: grab-point-preserving drag; owning roof re-resolves LIVE during the drag and bridged panels reconcile in the same patch; Esc/click ends (`.20`). _(non-UI half, build-side: owning roof re-resolves live; bridged panels reconcile in same patch — for awareness, not for drawing)_
- **MS3-19** (P0) — Resize: rect = 4 corner handles, symmetric about center in the rotated frame; circle = east handle sets diameter; drag floors 0.3 m (`.21/.22`).
- **MS3-20** (P0) — Rotate: stem handle above the object, free = 1° rounding, 15° steps via Shift AND the visible steps toggle (S3-4 extends `.23`); dead zone at center; normalized 0–359.
- **MS3-21** (P0) — Keyboard set kept + touch equivalents: Esc priority chain, Delete (unless locked), arrow nudges 0.1 m (Shift 1 m) — plus on-bar nudge arrows (tap 0.1 m, long-press 1 m) per S3-4; every nudge = one undo entry + roof re-resolve (`.25`). _(non-UI half, build-side: every nudge = one undo entry plus roof re-resolve — for awareness, not for drawing)_
- **MS3-22** (P0) — Floating context bar clears both body and ring: exactly seven actions — Duplicate · Shape · Size & rotation · Settings · Lock/Unlock · Delete · Deselect (`.26`).
- **MS3-23** (P1) — Duplicate: +2,+2 m copy labeled "{label}c", re-anchored, selected, one undo step; available while locked (`.27`).
- **MS3-24** (P0) — Lock: handles hidden, edit/delete refused with tooltips, Duplicate/Settings stay; locks PERSIST with the project (S3-5.3 fixes session-only `.24`). _(non-UI half, build-side: locks persist with the project across reloads — for awareness, not for drawing)_
- **MS3-25** (P0) — Shape sheet: Rectangle ↔ Circle switch anytime; both dimension sets persist so switching back restores; each switch = one undoable patch + reconcile (`.28`).
- **MS3-26** (P0) — Size & rotation sheet: typed dims in the display unit, COMMIT-ON-BLUR/Enter with the drag-path floors (0.3 m size / 0.1 m height; empty/invalid never commits) and friendly correction; rotation slider 0–359°; one undo entry per committed change (S3-3 fixes `.29`).
- **MS3-27** (P0) — Slider law (step-wide): any slider drag = exactly ONE undo entry (S3-3 fixes `.30`); setback slider 0–3 m with live ring redraw (`.31`). _(non-UI half, build-side: step-wide law: any slider drag = exactly one undo entry — for awareness, not for drawing)_
- **MS3-28** (P0) — Casts-shadow switch is REAL: writes the field the engine reads, 3D shadow + energy math respond, switch displays the effective state (S3-1 fixes `.32`). _(non-UI half, build-side: writes the field the shading engine reads; effective-state display — for awareness, not for drawing)_
- **MS3-29** (P0) — Blocks-placement switch controls layout keep-out + the ring, and reveals the bridging card (`.33`). _(non-UI half, build-side: flag drives layout keep-out consumed by MS6 — for awareness, not for drawing)_
- **MS3-30** (P0) — Bridging chain: "Panels may bridge above" → "Must remain open to sky" (blocks regardless) → clearance slider 0–1 m with the live "bridgeable above {h} m" hint; engineer-confirmation warning where the capability requires (`.34/.35`).
- **MS3-32** (P0) — Convert to rooftop platform: one tap replaces the obstruction with a stacked roof "{label} platform" at base+height (circles → 12-gon); disabled with reason when the top can't be a usable roof; enabled hint carries the engineer-verification line (F8-25); one undo step (`.37`). _(non-UI half, build-side: conversion builds stacked roof at base+height, circles to 12-gon — for awareness, not for drawing)_
- **MS3-33** (P0) — HEIGHT INFO card: Placement / Base surface / Top-from-ground — grounded on the SAME surface number the 3D uses on pitched roofs (S3-5.5 fixes `.38`); identity footer (`.38/.39`). _(non-UI half, build-side: grounded on same surface number the 3D uses — for awareness, not for drawing)_

## States

Base: **loading** · **empty** · **error** (studio no-blank-screen law; mutations per shell contract).

Screen-specific:

- **normal** — standing set: read-only roof backdrop, to-scale obstructions with ID chips, rings, north, scale bar, zoom cluster (M05-30, MS3-01..04).
- **empty-hint** — one-line hint: "Add anything that shades or blocks panels — tanks, chimneys, trees" (MS3-16).
- **type-picker-open** — 11 cards with icon, name, default L×W×H (MS3-12, M05-32).
- **placing / placement-mode** — cancellable placement mode with hint bar; one click drops one object at defaults, exits, auto-selects; Esc cancels; pan/zoom suspended (MS3-13, MS3-01, M05-32).
- **measuring** — two-point ruler; measure clicks beat placement clicks (MS3-10).
- **dragging** — grab-point-preserving drag, owning roof re-resolves live, pan/zoom suspended (MS3-18, MS3-01).
- **selected-context-bar** — floating context bar clearing body and ring, exactly seven actions (MS3-22, M05-34).
- **layer-hidden** — hide toggles the whole layer + selection overlay; picking a type force-unhides (MS3-08).
- **locked-refusal / locked-object-refused** — handles hidden, edit/delete refused with tooltips, Duplicate/Settings stay; locks persist (MS3-24, M05-33).
- **shape-sheet-open** — Rectangle ↔ Circle switch, both dimension sets persist (MS3-25).
- **size-rotation-sheet-open** — typed dims, commit-on-blur, floors, friendly correction, rotation slider 0–359° (MS3-26, M05-34).
- **settings-sheet-open / settings-bridging-chain** — the physics-honest chain: setback, casts-shadow, blocks-placement, bridging, convert, height info (M05-35, MS3-27..30).
- **bridging-revealed** — blocks-placement ON reveals the bridging card; chain with clearance slider and live "bridgeable above {h} m" hint plus engineer-confirmation warning (MS3-29, MS3-30, M05-35).
- **convert-disabled-with-reason / convert-unavailable-with-reason** — Convert to rooftop platform disabled with reason when the top can't be a usable roof (MS3-32, M05-35).
- **invalid-input-correction** — empty/invalid typed value never commits; friendly correction names the floor (MS3-26).
- **below-min-dimension-refused** — drag and typed floors: no dimension below 0.3 m (0.1 m height floor on typed) (MS3-19, MS3-26, M05-33).

## Data volume

Design at a real rooftop's clutter: eleven obstruction types (MS3-12) placed many times over — the Add tool carries a live count badge (MS3-07, M05-31) and auto-naming runs WT1, WT2… per type (M05-32) — each object with an ID chip, optional keep-out ring, and edge measurement labels when show-all-measurements is on (MS3-03, MS3-04, MS3-09), over the full Step-2 roof backdrop (MS3-02).

## Numbers carrying provenance

Each user-visible number carries its F8 provenance tier in the design: per-type **default L×W×H dimensions** (11 sets, MS3-12/M05-32); typed **L/W/H or diameter/H** and **rotation 0–359° in 1° steps** (M05-34, MS3-26); **setback 0–3 m in 0.1 m steps** (M05-35, MS3-27); **clearance 0–1 m in 0.05 m steps** and the live calc "Bridgeable when the array structure clears X m (its Y m + margin)" / "bridgeable above {h} m" (M05-35, MS3-30); the **0.3 m dimension floor** and **0.1 m / 1 m nudge steps** (M05-33, MS3-21); HEIGHT INFO **base height** and **top-from-ground** — the same surface number the 3D uses (MS3-33, M05-35); the tool-rail **count badge** (MS3-07); **live zoom %** and the **scale bar** (M05-30, MS3-01); **measured distances** (MS3-10); edge **measurement labels** (MS3-09).
