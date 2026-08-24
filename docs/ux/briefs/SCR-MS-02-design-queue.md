# SCR-MS-02 · Design Queue (Designer Home)

Design Engineer home; awaiting work with sign-off queue composed in (M05-83).

**Module:** MS (Design Studio) · **Personas:** Design Engineer · **Context of use:** the first screen the Design Engineer sees after sign-in — their role-decided home (M13 dashboards family). Primarily a desk surface (the designer authors at a desk), with mobile parity per the platform's parity law (F7-30). One home, never a second front door (PS-18).

## Entry & exit

Reached from: sign-in as a Design Engineer — this is the role-decided home. Leads to: an awaiting-work item opens that design's studio (SCR-MS-03); a sign-off-queue item opens the review surface (content contract is `M05-83`'s; the review screen is Sign-off Review, SCR-MS-16). Route back from any studio exit is the owning lead (MS12-05, PRD context), not this home — return here is via normal home navigation, not pinned by PRD — designer decides, note the decision.

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

### From `docs/prd/modules/M13-dashboards-and-reporting.md`

- **M13-33** (P0) — **Design Engineer — home: designs awaiting work, with the sign-off queue composed in where the person holds sign-off** — the queue's content contract is `M05-83`'s (oldest-first; customer, kWp, designer, waiting time; role-gated), composed into one home per `PS-18`, never a second front door.

### From `docs/prd/02-personas.md`

- **PS-16** (P0) — The Design Engineer's **home screen is designs awaiting work** — the queue of surveys handed over and designs in progress, with the blocking gaps named per item.
- **PS-18** (P0) — Where a person holds sign-off, their **home screen carries the sign-off queue — designs awaiting review, oldest first** — composed into the one home rather than presented as a second front door (`PS-05`).

## States

Base: **loading** · **empty** · **error** (no blank screen).

Screen-specific:

- **normal** — designs awaiting work: surveys handed over and designs in progress, with the blocking gaps named per item (PS-16).
- **empty-teaching** — nothing awaiting work; teaching empty state (F7 empty-state contract).
- **sign-off-composed** — the sign-off queue composed into this same home where the person holds sign-off (M13-33, PS-18).
- **sign-off-queue-composed (capability held)** — the composed queue renders only for a person who holds sign-off; role-gated (M13-33). Without the capability, the home is awaiting-work only.
- **gap-flagged-item** — a queue item with its blocking gaps named on the item (PS-16).

## Data volume

Not pinned by PRD as a count. Design at a working designer's real load: a queue of surveys handed over and designs in progress (PS-16) plus, for an approver, a composed sign-off queue ordered oldest-first (PS-18, M13-33) — each sign-off row carrying customer, kWp, designer, waiting time (M13-33).

## Numbers carrying provenance

Each user-visible number carries its F8 provenance tier in the design: per sign-off row — **kWp** and **waiting time** (M13-33 content contract, with customer and designer identity); per awaiting-work item — its named **blocking gaps** (PS-16). Ordering itself is a truth claim: **oldest first** (PS-18).
