# SCR-M04-08 · Shading Capture Sketch

Add obstructions with photo and person-estimated height, tap-to-place on a simple roof sketch.

**Module:** M04 · Survey · **Personas:** Survey Engineer, Sales Executive · **Context of use:** on the roof, looking around from it — the shading step of the guided capture, on a phone, one-handed. The camera opens inline; nothing bounces the surveyor to another application.

## Entry & exit

Reached from: the shading group step within Guided Capture (SCR-M04-07) — the default order puts it after the roof group, because the surveyor is standing on the roof looking around from it (M04 §M04.8 behavior detail). Leads to: back into the guided flow (electrical is next by default); the sketch and its obstructions travel to Review & Submit (SCR-M04-09) and to the designer's hand-off.

## Requirements (verbatim)

### prd/modules/M04-survey.md

- **M04-46** (P0) — **Shading capture is a photograph plus a person's estimate, placed on a simple roof sketch.** Add an obstruction, photograph it, estimate its height, and tap to place it on a simple sketch of the roof. The height is **entered or estimated by a person** in every case (`D35`); nothing derives it from the photograph.

Supporting behavior from the same doc (M04 §M04.8 edge cases): a surveyor who mis-taps and adds an obstruction twice can remove it — obstructions are individually removable before submit; the sketch is an editor, not a log. A photograph may be pinned to a specific obstruction so the designer knows which shadow it belongs to (M04-54, carried on SCR-M04-07). The obstruction examples are the PRD's, rendered market-neutrally: water tanks, roof stair-head structures, trees, adjacent buildings (M04-43).

## States

- loading
- empty (no obstructions placed yet)
- error
- tap-to-add
- obstruction-photo (inline camera, photograph attached to the obstruction)
- height-estimate (person-entered height on the obstruction)
- remove-obstruction (individually removable before submit)

## Data volume

A simple sketch of one roof with several placed obstructions — each carrying a photograph and a person-estimated height. Design at a realistic terrace: multiple obstructions of the PRD's example kinds (water tanks, roof stair-head structures, trees, adjacent buildings), every one individually selectable and removable.

## Numbers carrying provenance

- Obstruction height per obstruction — **entered or estimated by a person** in every case; carries `estimated` (per-field tier, `M04-35`); never derived from the photograph
- Obstruction position on the sketch — a person's tap placement, part of the capture record

No number on this screen may be attributed to a photograph — photographs are reference, never measurement (M04-53, build-side of this flow).
