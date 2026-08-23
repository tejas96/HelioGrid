# SCR-M08-05 · Installer Job Home

The Installation Team Member's own surface: today's assigned installation, its checklist progress, site access constraints and expected photographs — nothing else.

**Module:** M08 · **Personas:** Installation Team Member · **Context of use:** this persona's home screen — opened on a phone at the start of the day and on site, one-handed; everything it composes obeys the no-commercial-figures surface law. It is deliberately a one-job surface, not a portfolio.

## Entry & exit

Reached from: it is the Installation Team Member's home — the screen the app opens on for this preset (PS-26, M13-36). Leads to: the Installation Checklist (SCR-M08-04) for the assigned job (its checklist with progress). Other entry/exit: not pinned by PRD — designer decides, note the decision.

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

### From prd/modules/M08-projects.md

- **M08-45** (P1) — **The Installation Team Member's own job surface: today's assigned installation, its checklist with progress, the site's access constraints, and the photographs expected — and nothing else.** This surface is V2 scope: `R16` deferred the login and its own consequence named the path ("v2 adds an Installer preset without schema change"), and the owner's brief names installation teams as primary users. Every rule above rides it unchanged — `M08-42`'s attribution and `M08-43`'s no-figures law — and the coordinator fallback is not removed when accounts exist.

### From prd/modules/M13-dashboards-and-reporting.md

- **M13-36** (P0) — **Installation Team Member — home: today's installation** — the assigned job, its checklist progress, access constraints, expected photos — and nothing else; **no commercial figure ever renders on this home or any block composed into it** (the F2-06 surface law, binding on composition). _(non-UI half, build-side: F2-06 surface law: no commercial figure on this home or composed blocks — for awareness, not for drawing)_

### From prd/02-personas.md

- **PS-26** (P1) — The Installation Team Member's **home screen is today's installation** — the assigned job, its checklist with progress, the site's access constraints and the photos expected — and nothing else.

## States

Base states (always designed): loading · empty · error.

Screen-specific states from the slice:

- **normal** — today's assigned installation with its checklist progress, the site's access constraints, and the photographs expected — and nothing else.
- **empty-teaching** — no installation assigned today: the empty state teaches what will appear here, never apologises.

By construction, no price, discount, tranche, margin or customer value exists on this home or any block composed into it — a property of the surface, not of the viewer, holding in every state above rather than being one of them. There is nothing to hide or mask: the figures are not on the surface to begin with.

## Data volume

One job — the surface is deliberately singular. The weight is in the job's contents: the checklist progress against a real design's derived work order (the 221-panel design is the ruled reference for how long that work order gets), a realistic set of expected photographs, and the site's access constraints as captured on the site record.

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier (measured / derived / estimated / assumed) in the design:

- The checklist progress figure (done of total) for today's job.
- The count of photographs expected against photographs captured/uploaded, where shown.
- Today's date / the assignment's date, where shown.

No commercial figure — no price, no discount, no tranche, no margin, no customer value — ever renders on this home or any block composed into it.
