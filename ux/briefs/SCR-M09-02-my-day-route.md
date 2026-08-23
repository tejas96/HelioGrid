# SCR-M09-02 · My Day (Route)

Field employee's mobile home: today's stops with check-in/out on the current stop, day start/end marks, persistent tracking indicator, geofence prompts, unplanned stop logging.

**Module:** M09 · Field workforce · **Personas:** Field Technician, Installation Team Member, Survey Engineer · **Context of use:** mobile-first and mobile-only in practice — a phone held in one hand, outdoors, on a roof, in sunlight; `F7`'s outdoor legibility and touch-target rules are not optional on this screen; check-in must work in under two seconds. No surface reachable by the Installation Team Member carries a commercial figure.

## Entry & exit

Reached from: this **is** the Field Technician's home screen — the route is the front door (`PS-23`, `M13-35`). The geofence arrival prompt lands here, on the existing check-in control, never on a screen of its own (`M09-23`). Leads to: a stop opens Visit Stop Detail (SCR-M09-03); the employee reaches their own Activity Timeline (SCR-M09-05) from the same surface that carries the tracking indicator ("Where they can see their own history (`M09-66`), the same surface is where they reach it" — `prd/modules/M09-field-workforce.md` §M09.2 behavior detail); one-tap navigation and one-tap call leave the app (`PS-23`). Logging an unplanned stop happens from this route screen (`M09-32`).

## Composed home (M13-10, P0 — this screen is a role home)

This screen is the home of one preset on the precedence ladder, and **a person has exactly one
home, never two competing front doors**. Where the same person also holds another preset, that
preset's *today-work* is composed into THIS screen as a block rather than sent to a second home —
the PRD's own worked example is a rep who is also a surveyor landing on My Day **with today's
visits shown inside it**. The person can still switch: the shell's switcher (`SCR-SHELL-01`) lists
the home of every preset they hold. Design the block seams: this screen must be able to host one
or more foreign today-blocks without the layout breaking or the screen's own purpose being buried.
The ladder itself is a product constant, not tenant configuration (`M13-10`, register `Q5`).

## Requirements (verbatim)

### prd/modules/M09-field-workforce.md

- **M09-13** (P0) — **The employee is told, on their own device, and can always see their tracking state.** Turning tracking on for a person notifies that person, and their own application carries a persistent, plainly worded statement of whether they are currently being tracked and during which hours — visible without hunting for it, from the surface they already use (`PS-23`'s home). Turning tracking off notifies them too. The state is never hidden, never abbreviated to an icon alone (`F7-12`), and never inferable only from the absence of something. _(non-UI half, build-side: on/off notifications delivered to the employee (placement is F6's) — for awareness, not for drawing)_
- **M09-19** (P0) — **A check-in records four facts and a check-out records five.** Check-in: **who**, **which site or visit**, **when** (the capture time, `F4-19`), and **where** — the device's position at that moment with its accuracy, where a fix is available. Check-out records the same four plus the **elapsed time on site**, computed from the two capture times and shown as what it is. Nothing else is required to check in: no form, no photo, no note, no manager approval. A note or a photo may be attached, and neither is a condition of the act. _(non-UI half, build-side: record schema: who, site/visit, capture time, position with accuracy, elapsed computed — for awareness, not for drawing)_
- **M09-21** (P0) — **A check-in with no position fix is still a check-in, and the product says the position is unknown rather than inventing one.** Where the device cannot obtain a position — indoors, in a basement, in a dense urban canyon, with location services unavailable — the check-in is recorded with who, which site and when, and the position field reads **"location unavailable"**. It is never filled from the site's own coordinates, never from the last known position, never from a network-derived guess presented as a fix, and never left blank in a way that reads as a location of zero. _(non-UI half, build-side: never backfill position from site coords, last-known, or network guess — for awareness, not for drawing)_
- **M09-23** (P1) — **Where the employee is tracked and the site is geofenced, arriving offers the check-in on the same control the person already uses.** The geofence-driven prompt is a convenience of the tracked bundle and changes nothing about the act itself — the person still taps and the record still says who and when. **The never-acts law is `M09-51`'s and is not restated here:** whether a prompt may write a record is decided there, once, for every geofence surface. This row states only what is specific to the check-in surface — that the prompt lands on the route screen's existing check-in control rather than a screen of its own, and that an untracked employee checks in the same way, from the same screen, without the prompt (`M09-53`).
- **M09-24** (P0) — **An open check-in is never closed by the product with a time the product invented.** Where a person checks in and no check-out follows, the record surfaces as **still checked in** with the elapsed time running and stated. Past the end of the tenant's declared work-hours window it surfaces to the person and their coordinator as an **open check-in needing a check-out**, and it is closed by a human — the person, or their coordinator with the correction attributed to them (`M09-38`'s append rule applied). No automatic close-out time is written, and no default duration is assumed. _(non-UI half, build-side: no invented close-out time; human closes, correction appended and audited — for awareness, not for drawing)_
- **M09-28** (P0) — **A site visit booked from a lead becomes a stop on the assigned person's day, and its field facts travel back to the lead.** `modules/M02` owns the booking act — date, time, surveyor, confirmed address (`M02-46`) — and this module reciprocates: the booked visit appears on the assigned person's route, its check-in and check-out are made here, and the arrival, departure and outcome are readable on the lead's own visit record by whoever can already open that lead. No lead stage is moved by any act in this module (`M09-08`). _(non-UI half, build-side: moves no lead stage; facts ride the lead's own scope — for awareness, not for drawing)_
- **M09-32** (P1) — **An unplanned stop can be logged where it happened, without a plan to attach it to.** A field employee who visits a site nobody booked — a callback, an urgent check, a delivery diverted en route — logs the stop from their route with a place, a reason and their check-in/out, and it takes its place on the timeline as a stop that was not planned. It is marked as unplanned; it is not silently turned into a planned visit after the fact, and it does not create a lead, a project or a survey.
- **M09-33** (P2) — **`REC` — day-order optimisation for a route.** Ordering a day's assigned stops by geography and window, offered as a suggested order the person may accept or ignore, rather than the arrival-order-of-booking the route carries today. _(non-UI half, build-side: geography/window ordering suggestion engine; acceptable or ignorable, never forced — for awareness, not for drawing)_
- **M09-35** (P0) — **Attendance is the day the employee actually worked: one day start and one day end per person per day, marked by that person.** It is a `BRIEF` capability of this module and, under the adopted reading of `M09-05`, it is **included for every employee on every tier** and requires no tracked seat. It is deliberately the lightest possible record — two marks and the day they belong to — because the brief asks for attendance in a field-workforce module and the SME HR weight limit is `modules/M10`'s law (design spec §11).
- **M09-37** (P0) — **A first check-in of the day may propose the day start; it never writes it silently.** Where a person's first check-in of a day happens before they have marked a day start, the product **offers** the day start with that capture time pre-filled, and the person confirms. It is a proposal, not a derivation: nothing writes an attendance record without the person's act, and no attendance record ever appears by itself. _(non-UI half, build-side: never writes attendance without the person's confirming act — for awareness, not for drawing)_
- **M09-51** (P0) — **Crossing a geofence prompts a person; it never acts for them.** Entering a site's fence offers a check-in; leaving it offers a check-out; and an ignored prompt produces **nothing** — no check-in, no check-out, no visit outcome, no attendance mark and no timeline entry that says a person did something they did not do. The geofence's own crossing event is recorded on the timeline as an event of the *fence*, distinct from the person's act (`M09-56`). _(non-UI half, build-side: ignored prompt writes nothing; fence crossing recorded as fence's event, distinct from person's act — for awareness, not for drawing)_
- **M09-66** (P0) — **Law 3 — the tracking state is visible to the employee, and so is their own record.** A tracked employee can always see, from their own device, that they are tracked and during which hours (`M09-13`). They can always read **their own** timeline, their own check-ins, their own attendance and their own movement history, with no grant and no request to anyone. A product that collects a person's location and cannot show that person what it collected is not one this suite specifies. _(non-UI half, build-side: reading one's own state and record requires no grant — for awareness, not for drawing)_
- **M09-71** (P0) — **A day start or a day end is recorded only once the server has it.** The mark is the person's own act (`M09-35`, `M09-37`); until the server confirms it the surface shows it **pending, never as recorded** — no optimistic tick, and no local clock time presented as a record fact. A failure says so plainly and the mark is not lost from the screen (`F8-36`). This binds harder here than anywhere else in the product: attendance is read as a judgement about a person and feeds `modules/M10-hr-lite.md`'s register (`M10-23`), so a mark that *looks* recorded and is not is a wrong answer about someone's day. The time shown is the time the server recorded, which is what makes it an untiered record fact under `F8`'s date rule (register `Q59`) — a pending mark is not yet a record and cannot be shown as one.

### prd/modules/M13-dashboards-and-reporting.md

- **M13-35** (P0) — **Field Technician — home: their route today** — assigned stops in order with window, distance, navigation and call, and the current check-in state (content `M09`'s; `PS-23`).

### prd/02-personas.md

- **PS-23** (P1) — The Field Technician's **home screen is their route today** — the assigned stops in order, each with address, customer, window, distance, one-tap navigation and one-tap call, plus their current check-in state.

## States

- **loading**
- **empty-teaching** — no stops assigned today: the route is empty but the day start/end marks and unplanned-stop logging remain available (`M09-35`, `M09-32`); the screen teaches what it does rather than rendering a dead end.
- **error**
- **normal** — ordered stops, each with address, customer, window, distance, one-tap navigate and call; current check-in state; persistent tracking-state statement (`PS-23`, `M13-35`, `M09-13`).
- **day-start-offer** — first check-in of the day made before any day start: the day start is offered with that capture time pre-filled, and nothing is written until the person confirms (`M09-37`).
- **attendance-waiting** — a day start/end mark shows **pending, never as recorded**, until the server confirms it: no optimistic tick and no local clock time shown as a record fact; the time finally shown is the time the server recorded. A failure says so plainly and the mark is not lost from the screen (`M09-71`, `F8-36`).
- **open-check-in** — checked in with no check-out: rendered as still checked in with elapsed time running; past the work-hours window it surfaces as an open check-in needing a check-out, closed only by a human (`M09-24`).
- **checked-in** — the current stop carries the check-out control after check-in (`M09-19`).
- **checked-in-elapsed** — elapsed time on site visible and running on the current stop (`M09-19`, `M09-24`).
- **geofence-prompt** — arrival at a geofenced site (tracked employees only) lands the prompt on the existing check-in control; an ignored prompt produces nothing (`M09-23`, `M09-51`).
- **tracking-state-on** — the persistent, plainly worded statement that tracking is on and during which hours; never an icon alone (`M09-13`, `M09-66`).
- **tracking-state-off** — the same statement, plainly worded, when tracking is off; never inferable only from the absence of something (`M09-13`).
- **location-unavailable** — a check-in with no position fix records "location unavailable", never an invented position (`M09-21`).

Note: an untracked employee sees this same screen without the geofence prompt and without any tracked capability, with check-in working identically (`M09-23`).

## Data volume

Design at a realistic five-stop day — three booked visits plus two unplanned stops is the PRD's own example of a normal day (`prd/modules/M09-field-workforce.md` §M09.4 behavior detail).

## Numbers carrying provenance

- **Capture times** of check-in and check-out (`M09-19`) — preserved for display and audit; they order nothing.
- **Elapsed time on site** (`M09-19`, `M09-24`) — computed from the two capture times and shown as what it is.
- **Position with its accuracy** on a check-in, where a fix exists (`M09-19`); where none exists the field reads "location unavailable" and no number renders (`M09-21`).
- **Stop window** and **distance** per stop (`PS-23`, `M13-35`).
- **Tracking hours** on the persistent tracking-state statement (`M09-13`).
- **The day-start and day-end mark times** (`M09-71`) — the time the **server** recorded, which is what makes it an untiered record fact under the `Q59` date rule. This one has a state dependency the others do not: while the mark is pending, it is **not yet a record**, so no time may be shown as one. Draw the pending state without a recorded time, not with a greyed-out one.

Each user-visible number carries its F8 provenance tier in the design; a value whose tier cannot be established is not rendered as a number.

---

*Amended 2026-08-15: this brief was missed by the 2026-08-07 offline/sync sweep and still cited `M09-36`, a row that no longer exists in `prd/modules/M09-field-workforce.md`. Its day-start/day-end acknowledgement requirement and the `attendance-waiting` state are kept — the law is real and un-carried — but their dead citation is replaced by the UNRESOLVED note under Requirements, pending an owner ruling. `M09-37`'s verbatim quote was re-synced to the live row, which the sweep amended to drop its "under `M09-36`'s rule" pointer; the row's own rule — the day start is offered and never written by the product — is unchanged. Nothing else on this screen carried the offline boundary.*

*Amended 2026-08-15 by owner ruling (register `Q64`), later the same day: the day-start/day-end acknowledgement requirement this brief carried as UNRESOLVED is restored to the live PRD under a **new id, `M09-71`** in `prd/modules/M09-field-workforce.md` §M09.5 — it replaces the citation of `M09-36`, which stays deleted from the 2026-08-07 sweep and is not to be cited. The UNRESOLVED marker and its placeholder bullet are replaced by the verbatim `M09-71` row, and `attendance-waiting` now cites `M09-71` and states the ruled behaviour: the mark shows pending and never as recorded, no optimistic tick and no local clock time as a record fact, and a failure says so plainly with the mark kept on screen. **The stale `Q15` citation goes with the marker:** the removed note cited owner ruling `Q15` for the no-signal consequence, and `Q15` is stamped SUPERSEDED 2026-08-07 by `Q61` in `registers/open-questions.md` — no live text on this screen cites it, and the connectivity half it carried is void with the boundary. The owner's reason for the restoration: `F8-36` is live P0 — a surface "does not silently queue, partially apply, or display an optimistic result" — and no module row made that concrete for an attendance mark.*
