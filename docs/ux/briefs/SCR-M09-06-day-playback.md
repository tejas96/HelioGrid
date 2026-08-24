# SCR-M09-06 · Day Playback

Map replay of a tracked employee's observed positions in time order, gaps rendered as gaps; no speeds, distances or scores.

**Module:** M09 · Field workforce · **Personas:** Project Manager, Operations, EPC Owner, Field Technician · **Context of use:** coordinator/owner surface — desktop-first and fully functional on mobile; the tracked employee can always replay their own day from their own device with no grant (their own record right). It exists only for a tracked seat — it is the one surface in the module that cannot exist without the location stream.

## Entry & exit

Reached from: not pinned by PRD — designer decides, note the decision. (The natural neighbours per the PRD's permission notes are the Activity Timeline, SCR-M09-05 — playback is the tracked half of the same day — and Team Field Day, SCR-M09-04; reading another person's playback requires `F2.M09.field-visibility` plus `F2.M09.view-live-location`, and every such read is audited.) Leads to: not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M09-field-workforce.md

- **M09-45** (P0) — **A gap in the location record is shown as a gap, and is never interpolated, smoothed or bridged.** Where a device was off, out of signal, out of battery, had location services disabled, or was outside the work-hours window, the route timeline shows a **break with its duration and, where known, its reason** — not a straight line between the two known points and not a curve fitted through them. A route drawn across an unknown interval would be the product asserting a path nobody observed. _(non-UI half, build-side: no line, curve or estimate fitted across unobserved intervals — for awareness, not for drawing)_
- **M09-55** (P0) — **Daily movement playback is the tracked seat's map replay of a day, and it exists only for a tracked seat.** Replaying a day draws the observed positions in order, at the times they were observed, with every gap of `M09-45` present as a gap in the replay. It is `DD7`'s *movement history* and *activity playback* (`M09-03`), and it is the one surface in this module that cannot exist without the location stream.

## States

- **loading**
- **empty** (a tracked day with no observed positions at all: the replay has nothing to draw and says so honestly)
- **error**
- **playing** — the day's observed positions drawn in order, at the times they were observed (`M09-55`).
- **gap** — every unobserved interval present as a gap in the replay, a break with its duration and, where known, its reason; no line, curve or estimate spans it (`M09-45`, `M09-55`).
- **untracked-unavailable** — an untracked person has no playback in any form, and the surface says why rather than showing an empty map (`M09-55`; the closed-bundle rule).

## Data volume

Design at one tracked employee's full working day of observed positions — including the PRD's normal disruptions: an hour of lost signal and a battery that dies mid-afternoon, each appearing as a gap with its duration. GPS movement trails are retained 90 days rolling (`M09-57`), so the surface replays recent days only.

## Numbers carrying provenance

- **The time of each observed position** — positions are drawn at the times they were observed (`M09-55`).
- **Gap durations** and, where known, reasons (`M09-45`).
- **Position accuracy** — every position carries its accuracy and the `measured` tier as everywhere in this module; a wide fix is not upgraded by being drawn on a map.

No speeds, no distances, no dwell scores and no route efficiency appear anywhere — each would be a confident number computed across the gaps this screen must show as gaps. Each user-visible number carries its F8 provenance tier in the design.
