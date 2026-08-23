# SCR-M09-03 · Visit Stop Detail

A single stop's view: planned window beside actual arrival/departure, outcome recording with mandatory reason, notes and photos.

**Module:** M09 · Field workforce · **Personas:** Field Technician, Survey Engineer, Project Manager, Operations · **Context of use:** for the field employee, mobile — a phone held in one hand, outdoors; the outcome is recorded on the doorstep. For a coordinator (Project Manager, Operations) it is a read surface — desktop-first, fully functional on mobile, read at a desk and also from a car.

## Entry & exit

Reached from: a stop on My Day (Route) (SCR-M09-02) — the visit appears as a stop on the assigned person's route (`prd/modules/M09-field-workforce.md` §M09.4). The same visit's field facts are also readable on the lead's or project's own record by whoever can already open it — that lead-side record is another module's surface, not this screen. Leads to: **rescheduled** creates the next visit and leaves this one closed with its history (`M09-31`); the survey-side reschedule vocabulary and flow stay `modules/M04`'s. Other exits are not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### prd/modules/M09-field-workforce.md

- **M09-27** (P0) — **Planned and actual are shown side by side, as facts, with the difference stated and never scored.** A visit carries its planned place and window beside its actual arrival and departure (from the check-in and check-out of §M09.3), and the difference between them is rendered as a plain difference — *"arrived 40 min after the window"* — with no rating, no colour-only judgement (`F7-12`), no lateness score and no roll-up into a person's record (`M09-09`). Where either side is unknown, the unknown side says so rather than defaulting to the other.
- **M09-31** (P0) — **A visit ends in one of three outcomes, and status only moves forward:** **completed** · **could not complete**, with a reason recorded · **rescheduled**, which creates the next visit and leaves this one closed with its history. The reason on a could-not-complete is mandatory and free-text-plus-reason-class where the source module already has a vocabulary for it (`modules/M04`'s could-not-complete on the doorstep, `S4.wrong.9` via `M04`'s reschedule). Status never regresses; a write that would move it backwards is refused (`F4-17`). _(non-UI half, build-side: forward-only status; a regressing write is refused — for awareness, not for drawing)_

## States

- **loading**
- **empty** (a stop opened before any presence record exists: planned side only, nothing actual yet)
- **error**
- **planned-vs-actual** — planned place and window beside actual arrival and departure, the difference stated as a plain difference, never scored (`M09-27`).
- **planned-window-missing** — the planned side states it is not set; the actual is shown alone, and no window is inferred (`M09-27`: where either side is unknown, the unknown side says so).
- **reason-required** — could-not-complete without a reason: the save is refused; the reason is mandatory, free-text plus reason-class where the source module has a vocabulary (`M09-31`).
- **completed** — the visit closed with outcome completed (`M09-31`).
- **could-not-complete** — closed with its mandatory reason recorded (`M09-31`).
- **rescheduled-closed** — this visit closed with its history; the next visit created by the reschedule (`M09-31`).
- **unplanned** — the stop is marked as unplanned and stays marked that way; it is never silently turned into a planned visit after the fact.

## Data volume

One visit at a time, on a day of about five stops. A stop may carry attached notes and photos (neither is a condition of any act); design the detail to hold a handful of each without the outcome controls losing primacy.

## Numbers carrying provenance

- **Planned window** (date and time) beside **actual arrival and departure** capture times (`M09-27`) — each side rendered as fact; an unknown side says so rather than defaulting to the other.
- **The difference** between planned and actual, stated as a plain duration ("arrived 40 min after the window") — a formatted duration, never a score or rating (`M09-27`).
- **Elapsed time on site** — computed from the check-in and check-out capture times.

Each user-visible number carries its F8 provenance tier in the design.
