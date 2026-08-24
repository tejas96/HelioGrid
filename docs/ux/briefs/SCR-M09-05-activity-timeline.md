# SCR-M09-05 · Activity Timeline

One person's day as an ordered, append-only record; same surface for self, coordinator and owner, scoped; route additions where tracked.

**Module:** M09 · Field workforce · **Personas:** Field Technician, Survey Engineer, Project Manager, Operations, EPC Owner · **Context of use:** for the person themselves, mobile — read from the same phone they work on; for a coordinator or owner, desktop-first and fully functional on mobile. It is the surface most likely to be read in an argument, so its obligation is to be boring and complete: entries in order, gaps shown as gaps, nothing computed or summarised into a judgement.

## Entry & exit

Reached from: the employee's own view is reached from their home surface — the same surface that carries the tracking indicator is where they reach their own history (`docs/prd/modules/M09-field-workforce.md` §M09.2 behavior detail; `M09-66`); a coordinator's or owner's scoped view is reached from Team Field Day (SCR-M09-04) or otherwise — not pinned by PRD — designer decides, note the decision. Leads to: Day Playback (SCR-M09-06) for a tracked seat's day — the playback half additionally requires `F2.M09.view-live-location` (§M09.8 permissions).

## Requirements (verbatim)

### docs/prd/modules/M09-field-workforce.md

- **M09-45** (P0) — **A gap in the location record is shown as a gap, and is never interpolated, smoothed or bridged.** Where a device was off, out of signal, out of battery, had location services disabled, or was outside the work-hours window, the route timeline shows a **break with its duration and, where known, its reason** — not a straight line between the two known points and not a curve fitted through them. A route drawn across an unknown interval would be the product asserting a path nobody observed. _(non-UI half, build-side: no line, curve or estimate fitted across unobserved intervals — for awareness, not for drawing)_
- **M09-54** (P0) — **The activity timeline is the ordered record of what happened in a person's field day, and it is included for every employee.** Its entries are the acts this module records: day start, check-in, check-out, visit outcome, unplanned stop, note or photo attached to a stop, day end — each with its capture time and its place where one was captured. Under the adopted reading of `M09-05` the timeline needs no tracked seat, because every event on it comes from the included capabilities of `M09-02`.
- **M09-56** (P0) — **The timeline is append-only and states its own gaps.** Entries are added, never edited away; a correction appends (`M09-38`'s rule generalised to the timeline), and the timeline distinguishes three things a reader must not confuse: an **act a person performed**, an **event the system observed** (a geofence crossing, a position), and an **interval in which nothing was recorded**. Nothing on the timeline is inferred from anything else on it. _(non-UI half, build-side: append-only; corrections append; nothing inferred from other timeline entries — for awareness, not for drawing)_
- **M09-66** (P0) — **Law 3 — the tracking state is visible to the employee, and so is their own record.** A tracked employee can always see, from their own device, that they are tracked and during which hours (`M09-13`). They can always read **their own** timeline, their own check-ins, their own attendance and their own movement history, with no grant and no request to anyone. A product that collects a person's location and cannot show that person what it collected is not one this suite specifies. _(non-UI half, build-side: reading one's own state and record requires no grant — for awareness, not for drawing)_

## States

- **loading**
- **empty** (a day with no recorded acts: renders as what it is — no record — never as a verdict about the person)
- **error**
- **own-view** — the person reading their own day: always available, with no grant and no request to anyone (`M09-66`).
- **scoped-other-view** — a coordinator or owner reading the same day: the same surface with the same vocabulary, entries and gaps, differing only in whose days are reachable (the register's scoped view; the slice's purpose — same surface for self, coordinator and owner, scoped).
- **gap** — an unrecorded interval rendered as a break with its duration and, where known, its reason; never interpolated, smoothed or bridged (`M09-45`, `M09-56`).
- **correction-appended** — a correction appears as an appended entry; the original stays readable, never edited away (`M09-56`).
- **playback-unavailable-untracked** — an untracked person's day: the timeline is complete for what it records, and the surface says movement playback is unavailable because tracking is off, rather than showing an empty map (`M09-54`; the tracked-only playback is `M09-55`'s).

Every entry identifies which of the three kinds it is: an act a person performed, an event the system observed, or an interval in which nothing was recorded (`M09-56`).

## Data volume

Design at one person's full field day: day start, around five stops (three booked, two unplanned) each with check-in, check-out and outcome, attached notes/photos, system-observed events (geofence crossings, positions) where tracked, one or two gaps with durations, day end — roughly 20–30 entries in order.

## Numbers carrying provenance

- **Capture time on every entry** (`M09-54`) — preserved for display and audit; orders nothing beyond its place on the timeline.
- **Gap durations** — a break renders with its duration and, where known, its reason (`M09-45`).
- **Place on an entry, where one was captured** (`M09-54`) — a position carries its accuracy and the `measured` tier as everywhere in this module.
- **Correction entries' times and authors** (`M09-56`).

Each user-visible number carries its F8 provenance tier in the design; nothing on the timeline is inferred from anything else on it.
