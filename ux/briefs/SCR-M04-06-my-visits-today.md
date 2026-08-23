# SCR-M04-06 · My Visits Today

The surveyor's home: today's visits with address, customer, time, distance, one-tap navigate and call.

**Module:** M04 · Survey (role-home composition is `modules/M13`'s) · **Personas:** Survey Engineer (primary — this is their home screen), Sales Executive, Sales Manager, EPC Owner · **Context of use:** phone in the field — "a person is looking at it in a vehicle or a stairwell, so it carries what gets them to the right roof and nothing else" (M04 §M04.7 behavior detail). One-handed. Deliberately the smallest screen in the module.

## Entry & exit

Reached from: signing in as a Survey Engineer — today's visits are the landing surface (M04-38, M13-32, PS-13). Leads to: one-tap navigation and one-tap call hand off to the device's own applications — the product does not embed a map or a dialler for this (M04 §M04.7 behavior detail); opening a visit leads to Guided Capture (SCR-M04-07) — the happy path is *open My Visits → navigate → capture through the guided steps → review → submit* (M04 §M04.9); "Could not complete" opens the reschedule flow (M04-58); a wrong address is corrected on the spot from the visit (M04-59). The surveyor's shell centre action is **Start survey** (`F7-22`).

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

### prd/modules/M04-survey.md

- **M04-38** (P0) — **The Survey Engineer's home screen is today's visits.** Each row carries address, customer, time and distance, with **one-tap navigation** and **one-tap call**. It is the front door of the surveyor's day.
- **M04-58** (P0) — **A visit that cannot be completed ends with a reason, a reschedule and exactly one message — sent through the tenant's connected transactional channel where one exists (owner ruling 2026-08-04, Q33).** Where the customer is not home or the gate is locked, the surveyor records **"Could not complete"** with a reason, which opens the reschedule flow. The customer gets **one** message about it: with a connected channel it sends automatically under the transactional template class — the source's *"customer gets one"* wording is now delivered literally — and with no channel connected the product composes it ready to paste, a person sends it, and no delivery is claimed (`M02-47`/`M02-48`'s rule). `registers/conflicts.md` row 4 carries the resolution note. _(non-UI half, build-side: exactly one message: auto via connected channel, else composed — for awareness, not for drawing)_
- **M04-59** (P0) — **A wrong address is corrected on the spot, and the correction updates the site record.** A surveyor who arrives at the wrong address fixes it there and then, from the visit; the corrected address propagates to the site record so the next visit, the next design and the next document all use it. _(non-UI half, build-side: correction propagates to the site record — for awareness, not for drawing)_

### prd/modules/M13-dashboards-and-reporting.md

- **M13-32** (P0) — **Survey Engineer — home: today's site visits** — address, customer, time, distance, one-tap navigation and call (content `M04-38`; the composition is this module's).

### prd/02-personas.md

- **PS-13** (P0) — The Survey Engineer's **home screen is today's site visits** — each with address, customer, time, distance, one-tap navigation and one-tap call.

Supporting behavior from M04 §M04.7: distance is shown from the device's current position where it is available and omitted rather than guessed where it is not. The could-not-complete flow is written for the doorstep: three taps, a reason from a short list, and the reschedule offered immediately, with the composed message ready (M04 §M04.11 behavior detail).

## States

- loading
- empty
- error
- normal
- distance-unavailable (omitted rather than guessed)
- could-not-complete-reason (reason from a short list)
- reschedule
- message-composed-or-sent (connected channel: sent automatically; no channel: composed ready to paste, no delivery claimed)
- empty-teaching

## Data volume

A working day of visits, each row carrying address, customer, time and distance.

## Numbers carrying provenance

- Visit time per row — rendered on the tenant's timezone (`F3-22`)
- Distance per row — from the device's current position; omitted rather than guessed when unavailable; reader's unit preference (`F3-23`)
- Rescheduled visit date/time — a scheduling fact shown where rescheduling happens

Each user-visible figure carries its F8 provenance tier in the design; times and distances here are operational facts, not survey measurements — none may be presented as a measured site figure.
