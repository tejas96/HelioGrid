# SCR-MS-15 · Sign-off Queue

Approving engineer's home: designs awaiting approval, oldest first, with customer/capacity/designer/waiting-time.

**Module:** MS (M05 Design Studio · studio sub-spec MS11) · **Personas:** Design Engineer with the approval capability (`F2.M05.approve-designs`), EPC Owner · **Context of use:** the Design Engineer is desktop-weighted with full mobile parity (prd/02-personas.md persona table); this is a home surface hit at the start of a working session — the role-home redirect lands here, so it must orient in one glance.

## Entry & exit

Reached from: the "designs awaiting" role-home redirect (`modules/M13`'s composition) for holders of `F2.M05.approve-designs` (M05-83); the same queue is composed into the Design Engineer's home (SCR-MS-02, per the Screens Register). **Gate that admits the user:** role-gated to holders of `F2.M05.approve-designs` (M05-83) — not a wizard-step gate; this surface sits outside the wizard. Leads to: open an entry → the review surface (SCR-MS-16) (M05-83).

## Requirements (verbatim)

### From prd/modules/M05-design-studio.md

- **M05-83** (P0) — **The sign-off queue is the reviewer's home surface: designs waiting, oldest first**, each entry showing customer, system size (kWp), who designed it, and how long it has been waiting; open → the review surface. Role-gated to holders of `F2.M05.approve-designs`; it feeds the "designs awaiting" role-home redirect (`modules/M13`'s composition).

### From prd/modules/M05-studio/10-done-and-installation.md

- **MS11-13** (P0) — A sign-off QUEUE exists as the approving engineer's home: designs awaiting approval, oldest first, showing customer, capacity, designer and waiting time (UXG-06).

## States

Three base states, then every screen-specific state from the slice and the rows:

- **loading** — the queue loads; never a blank home.
- **empty** — no designs awaiting approval; the honest empty state of a home surface.
- **error** — the queue cannot load; states so plainly.
- **normal / waiting-oldest-first** — designs waiting, oldest first, each entry showing customer, system size (kWp), who designed it, and how long it has been waiting (M05-83, MS11-13). Oldest-first is the fairness rule — no cherry-picking surface exists (prd/modules/M05-design-studio.md §M05.14 behavior detail).

## Data volume

Design at the Definition of Done's long-list posture, not demo volume: a queue deep enough to scroll, with waiting times ranging from minutes to weeks so the oldest-first ordering and the waiting-time figure visibly matter.

## Numbers carrying provenance

Each user-visible number carries its F8 provenance tier in the design:

- System size (kWp) per entry (M05-83, MS11-13)
- Waiting time per entry (M05-83, MS11-13)
