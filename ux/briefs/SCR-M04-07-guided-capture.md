# SCR-M04-07 · Guided Capture

Step-by-step physical capture through the five groups with progress bar and inline camera.

**Module:** M04 · Survey · **Personas:** Survey Engineer (primary), Sales Executive, Sales Manager, EPC Owner — one identical flow for every holder of `F2.M04.capture-surveys`, no reduced or "lite" variant (M04-06) · **Context of use:** a person holding a phone on a roof in sunlight; mobile-only in practice and mobile-first by design. This is the one screen in the product that carries the photo carve-out (`F4-21`): photographs are held on the device until they have uploaded, and their waiting count and a retry are shown here — nowhere else.

## Entry & exit

Reached from: a visit on My Visits Today (SCR-M04-06) — the happy path is *open My Visits → navigate → capture through the guided steps → review → submit* (M04 §M04.9 behavior detail); a visit booked for open capture-on-site gaps opens with those steps present and marked as the reason the visit exists (M04-32). Leads to: the Shading Capture Sketch (SCR-M04-08) is the shading group's capture surface; the flow ends on Review & Submit (SCR-M04-09). Steps are reachable directly — the order is a default, because real visits do not run in a straight line (M04 §M04.8 behavior detail).

## Requirements (verbatim)

### prd/modules/M04-survey.md

- **M04-03** (P0) — **Mode B — physical: hours, travel, the customer at home, and reality confirmed before anything is installed.** An on-site visit captures what a person can see and reach: the roof from each corner, the meter and the main panel, what casts shade, how material gets up, and what the structure looks like. Its data is **measured on site** (M04-34) and it is what the product means by a confirmed site.
- **M04-32** (P0) — **Booking a physical visit pulls the open capture-on-site gaps into that visit's guided flow.** The gaps a remote survey could not close become the visit's agenda: the guided capture opens with those steps present and marked as the reason the visit exists, so the surveyor cannot arrive without knowing what the desk could not answer.
- **M04-42** (P0) — **Physical capture is a guided, step-by-step flow through the capture groups, with a progress bar, and every step is skippable but flagged.** The flow tells the surveyor where they are and what remains; nothing is mandatory in a way that traps a person on a roof; and nothing skipped is ever silently absent — a skipped step is **flagged** on the record and surfaced at review (M04-49) and to the designer (M04-63).
- **M04-43** (P0) — **The capture groups are the source's five, carried whole.** **Roof** — photographs from each corner, an overall shot, roof type, approximate dimensions. **Electrical** — meter photograph with the reading and sanctioned load visible, main panel / distribution board photograph, existing load. **Shading** — photographs of anything tall nearby, with rough heights (the source's examples, rendered market-neutrally: water tanks, roof stair-head structures, trees, adjacent buildings). **Access** — how material gets to the roof: stairs, lift, crane needed, narrow lane. **Structural notes** — visible cracks, roof age, existing waterproofing, *"observations only, never a verdict."* No group may be dropped and no group's meaning may be narrowed by a surface.
- **M04-44** (P0) — **Access constraints are captured as constraints and reach the designer before design begins.** Where the roof cannot be reached at all — no stairs, a locked terrace, a lane too narrow for a truck, a crane needed — that is recorded as an access constraint on the survey rather than as a failed visit, and it is one of the first things the hand-off shows, because it changes what can be designed and how it will be installed.
- **M04-45** (P0) — **The sanctioned load is captured per site from the meter, and it is the input the design's overrun warning reads.** Design overrun against sanctioned load is a real approval blocker, so the figure is captured deliberately — from the meter photograph, with the value entered by a person (never read off the photograph by the product, M04-53) — and carried to the design as a **soft cap**: it warns, it does not silently clamp. _(non-UI half, build-side: person-entered value feeds design's soft-cap overrun warning — for awareness, not for drawing)_
- **M04-47** (P0) — **Storage pressure is warned about before capture starts, not discovered mid-roof.** Where device storage is low, the surveyor is told **before** the capture begins and offered compression; the warning names what is happening and what will help. Nothing already captured is evicted to make room.
- **M04-54** (P0) — **Every photograph is tagged, carries its source, and can be pinned to what it shows.** Tags are the source's set — **roof corner · obstruction · meter · distribution board · structure · access · other** — and each photograph records whether it was taken **on site**, **sent by the customer**, or **uploaded from a drone or other camera**. A photograph may be pinned to a specific obstruction so the designer knows which shadow it belongs to. _(non-UI half, build-side: closed tag and source vocabularies; pin to obstruction — for awareness, not for drawing)_

### prd/foundations/F4-data-integrity.md

- **F4-21** (P0) — **Nothing a field user captured is ever unrecoverable.** A photograph taken in the field is held on the device until it has uploaded, and its waiting count and a retry are shown **on the capture screen itself** — there is no separate sync surface. A record that fails validation is preserved and badged for attention rather than crashing the screen or vanishing, and a submission the server cannot accept is preserved for recovery rather than discarded. The law the source states, and this document adopts whole: **"nothing a field user captured is ever unrecoverable."** _(non-UI half, build-side: validation-failure preservation; the photo hold-and-upload mechanism — for awareness, not for drawing)_

Supporting behavior from the same doc (M04 §M04.8 behavior detail): one step per screen with the progress bar always visible; the default step order follows the way a person moves through a site — roof, shading, electrical, access, structural notes. **The camera opens inline and never bounces to the operating system's camera application** — inline capture keeps the step, the tag and the obstruction the photograph belongs to attached from the moment the shutter fires. Each field carries its own provenance and its own skipped-but-flagged marker (`M04-35`). The structural group's inputs are shaped as observations — no scoring control, no adequacy toggle, no "structurally sound / unsound" choice anywhere (`F8-25`). A survey interrupted by a dead battery or a killed application is restored exactly as it was (M04-48 — the draft-restored state below). The meter inside a locked room → the electrical step is skipped-and-flagged and the sanctioned load becomes an open gap, not a zero.

## States

- loading
- empty
- error
- photos-waiting (the count of photographs still held on the device, stated inline on this screen — label plus mark, never colour alone; its absence means everything has uploaded)
- photo-upload-retry (a retry offered inline beside the waiting count; never a modal, never a block on capture)
- progress (progress bar always visible; where they are and what remains)
- step-skipped-flagged
- inline-camera
- gap-agenda-from-visit (open capture-on-site gaps present and marked as the reason the visit exists)
- storage-warning (before capture starts; compression offered)
- draft-restored (after battery death or app kill: same step, every field, note and photograph intact — "Nothing lost.")

## Data volume

Five capture groups, each with photographs: roof photographs from each corner plus an overall shot, meter and distribution-board photographs, a photograph per tall obstruction. The PRD's own scale for one survey is a dozen photographs; a day in the field can leave several dozen held on the device waiting to upload. Design the flow, its photo handling and its waiting count at that volume.

## Numbers carrying provenance

- Approximate roof dimensions — entered by a person; per-field tier (`measured` on a physical survey; `estimated` where estimated), reader's unit preference with procurement metric (`F3-23`)
- Meter reading — value entered by a person from the meter photograph; never read off the photograph by the product
- Sanctioned load — person-entered from the meter; feeds the design's soft-cap warning; per-field tier
- Existing load — person-entered; per-field tier
- Rough heights of shading obstructions — person-estimated; carry `estimated`
- Progress position (step x of y) — flow fact, not a site figure
- Photographs still waiting to upload (count) — a device fact, not a site figure (`F4-21`)

Every captured figure carries its own F8 tier per field, not per survey (`M04-35` — a physical survey with an estimated height carries `estimated` on that height while the rest carries `measured`), plus its skipped-but-flagged marker where skipped.
