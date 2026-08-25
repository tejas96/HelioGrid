# SCR-M09-04 · Team Field Day

Coordinator's read of the day in progress: attention-ordered list of people and states, live map as second view, honest untracked and last-known rendering.

**Module:** M09 · Field workforce · **Personas:** EPC Owner, Project Manager, Operations · **Context of use:** desktop-first and fully functional on mobile — a coordinator reads it at a desk and also from a car. In a small firm the Owner is also the coordinator and this surface must work for one person holding both jobs. The surface must read as coordination, not surveillance, to the person being located as well as the person looking.

## Entry & exit

Reached from: the coordinator's role home — the home composition belongs to `modules/M13` and this module supplies its content: the day-in-progress list, the exceptions on it, and the tracked additions where they exist (`docs/prd/modules/M09-field-workforce.md` `M09-62`). Leads to: a person's Activity Timeline (SCR-M09-05) and, for tracked seats, Day Playback (SCR-M09-06) — the read grants are §M09.8's (`F2.M09.field-visibility`, playback additionally `F2.M09.view-live-location`); the navigation itself is not pinned by PRD — designer decides, note the decision. The map is the second view of the same list, never a separate screen of different records (`M09-59`).

## Requirements (verbatim)

### docs/prd/modules/M09-field-workforce.md

- **M09-24** (P0) — **An open check-in is never closed by the product with a time the product invented.** Where a person checks in and no check-out follows, the record surfaces as **still checked in** with the elapsed time running and stated. Past the end of the tenant's declared work-hours window it surfaces to the person and their coordinator as an **open check-in needing a check-out**, and it is closed by a human — the person, or their coordinator with the correction attributed to them (`M09-38`'s append rule applied). No automatic close-out time is written, and no default duration is assumed. _(non-UI half, build-side: no invented close-out time; human closes, correction appended and audited — for awareness, not for drawing)_
- **M09-43** (P0) — **Live location answers two questions and the product says which: "who is nearest" and "is the day going to plan".** The surface is a map of the tracked people currently working, each with their current stop, their next stop and the time of their last position. It is a **coordination** surface, and it is designed to read as one to the person being located as well as the person looking — which is the persona's own stated pain (`PS-22`: *"Being surveilled rather than supported"*).
- **M09-48** (P0) — **A device that cannot reach the server has no live position, and the product says "last known" rather than showing a stale point as current.** A live position that cannot reach the server is not a live fact. The team view renders the person's **last known position with the time it was taken**, plainly labelled, and never a position that is presented — by omission, by styling or by a moving marker — as where they are now. _(non-UI half, build-side: live position is online-only by nature — for awareness, not for drawing)_
- **M09-59** (P0) — **Team visibility is the coordinator's read of the field day as it is happening: who is working, where they are in their plan, what has been checked into, and what is running against its window.** Under the adopted reading of `M09-05` the surface itself is included for every tenant on every tier; what a tracked seat adds to it is the live position, the route line and the playback (`M09-03`). The surface is a list first and a map second, because the question a coordinator asks first is *is the day going to plan*, not *where is everyone*.
- **M09-61** (P0) — **An untracked person renders honestly on the team view, never as a blank that reads as "not working".** Their row shows what exists — their day start, their stops, their check-ins, their outcomes — and states plainly that **live position is unavailable because tracking is off for this employee**. It is never an empty cell, never a greyed-out silhouette that implies a failure, and never a prompt disguised as a status. Whether to turn tracking on is the Owner's decision and it is made on the Owner's own surface (`M09-11`), not sold from a coordinator's dashboard.
- **M09-63** (P2) — **`REC` — nearest-available dispatch.** Answering *"who is nearest to this site right now"* as an **action**: proposing the nearest tracked, working, currently-free employee for an urgent visit and assigning it in one step. _(non-UI half, build-side: nearest tracked, working, free computation; tracked seats only; never auto-assigns — for awareness, not for drawing)_

## States

- **loading**
- **empty** (nobody in the coordinator's field scope, or no field day underway)
- **error**
- **list-default** — the list of people in scope, each with a day state, ordered by what needs attention: open check-ins past their window, visits running past their window, days not started, then everyone else; the list is shown before any map (`M09-59`).
- **map-view** — the second view of the same list: tracked people currently working, each with their current stop, next stop and the time of their last position; the two views never disagree because they render the same records (`M09-43`, `M09-59`).
- **last-known** — a person whose device cannot reach the server renders with their last known position and the time it was taken, plainly labelled, never presented as current (`M09-48`).
- **untracked-stated** — an untracked person's row shows their recorded acts and states plainly that live position is unavailable because tracking is off for this employee; never an empty cell, greyed-out silhouette or prompt disguised as a status (`M09-61`).
- **out-of-window** — outside the tracking window nothing is collected, so there is nothing current to show, and the surface states the reason rather than showing the last in-window position as current (`M09-48`; the window law is `M09-44`'s).
- **exception-open-check-in** — an open check-in past the work-hours window surfaces to the coordinator as needing a check-out; closing it is a human act with the correction attributed (`M09-24`).
- **exception-visit-past-window** — a visit running past its window, surfaced in the attention ordering (`M09-59`).
- **exception-day-not-started** — a day not started, surfaced in the attention ordering (`M09-59`).

## Data volume

Design at the PRD's own shape: a team of ten with two tracked seats — all ten appear, two carry live positions, eight state why they do not. Include several simultaneous exception rows (an open check-in past window, a visit past window, a day not started).

## Numbers carrying provenance

- **Time of each person's last position** ("last known" with the time it was taken) (`M09-43`, `M09-48`).
- **Elapsed time** on a still-open check-in, running and stated (`M09-24`).
- **Visit windows** and how far a visit is running against its window (`M09-59`) — stated as facts, never scored.
- **Positions on the map** — rendered with their accuracy, carrying the `measured` tier as everywhere in this module.

Each user-visible number carries its F8 provenance tier in the design; no score, ranking or comparison metric accompanies any of it.
