# SCR-M08-05 · Installer Job Home

The Installation Team Member's own surface: today's assigned installation, its checklist progress, site access constraints and expected photographs — nothing else.

**Module:** M08 · **Personas:** Installation Team Member · **Context of use:** this persona's home screen — opened on a phone at the start of the day and on site, one-handed; everything it composes obeys the no-commercial-figures surface law. It is deliberately a one-job surface, not a portfolio.

**One job:** know today's job, and start it.
**Order of attention:** 1 today's installation — where, and what · 2 how to get in — the site's access constraints · 3 the checklist's progress and the photographs expected.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **"And nothing else" (`M08-45`) is this screen's composition law:** one job, no portfolio, no
figure that is commercial — and no sentence saying any of that.

| Fact | Kind | Its form here |
|---|---|---|
| Today's assigned installation (`M13-36`) | data | the site and its address as the title block; the system as a plain description; the date |
| The site's access constraints (`M04-44`) | data | label–value rows as captured on the survey. Their text is content. None captured is a named gap, never an empty block |
| The checklist's progress | data · action | done of total as two counts, and the screen's ONE primary act — open the checklist (`SCR-M08-04`) |
| The design is not signed off yet (`M08-41`) | status | the progress reads that it waits on engineer sign-off, with no count; the act still opens the checklist |
| The photographs expected (`M08-45`) | data · status | one per checklist step: steps with a photo of all steps, as two counts. The next steps still without a photo as rows, at most three, each leading to its step in the checklist. There is no named shot list |
| No commercial figure (`M13-36`) | — | nothing is drawn and nothing is said. It holds for any block composed into this home |
| Another preset's today-work (`M13-10`) | more detail | a compact block with its own title and a row leading to its home; it obeys the same no-figure law and never buries today's job |
| No installation today | teaching | at most two short sentences — what will appear here |
| The job failed to load | error | one banner — what failed and what to do |
| Checking in and out of the site | — | not on this screen: check-in is M09's (`F2.M09.check-in-out`), and M09 is V2 |

## Arrangement

- **375.** Its home: the job, the way in, the progress with its act, the photographs. One screenful
  where the content allows.
- **1536.** Honestly the same frame in a centred column with more room. Say so on the board; nothing
  is added to fill the width.

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
The ladder itself is a product constant, not tenant configuration (`M13-10`).

## Requirements (verbatim)

### From docs/prd/modules/M08-projects.md

- **M08-45** (P1) — **The Installation Team Member's own job surface: today's assigned installation, its checklist with progress, the site's access constraints, and the photographs expected — and nothing else.** This surface is V2 scope: `R16` deferred the login and its own consequence named the path ("v2 adds an Installer preset without schema change"), and the owner's brief names installation teams as primary users. Every rule above rides it unchanged — `M08-42`'s attribution and `M08-43`'s no-figures law — and the coordinator fallback is not removed when accounts exist. The photographs expected are one per checklist step, the evidence that proves it; the home counts the steps with a photo against all of them (owner ruling 2026-09-26).

- **M08-41** (P0) — **The installation checklist is reused, not rebuilt.** The steps are the design's derived work order — the real build sequence the studio already produces (`M05-76`, consumed) — and this module owns its *execution*: working the steps, ticking them, attaching evidence, adding a manual step the design could not know about, and the progress the project reads from it. *"Do not rebuild it."* The steps are the latest signed-off design's: before the first engineer sign-off the checklist waits, and a later design edit shows as a change only once it is signed off again (`MS11-17`; owner ruling 2026-09-25).

### From docs/prd/modules/M04-survey.md

- **M04-44** (P0) — **Access constraints are captured as constraints and reach the designer before design begins.** Where the roof cannot be reached at all — no stairs, a locked terrace, a lane too narrow for a truck, a crane needed — that is recorded as an access constraint on the survey rather than as a failed visit, and it is one of the first things the hand-off shows, because it changes what can be designed and how it will be installed.

### From docs/prd/modules/M13-dashboards-and-reporting.md

- **M13-36** (P0) — **Installation Team Member — home: today's installation** — the assigned job, its checklist progress, access constraints, expected photos — and nothing else; **no commercial figure ever renders on this home or any block composed into it** (the F2-06 surface law, binding on composition). _(non-UI half, build-side: F2-06 surface law: no commercial figure on this home or composed blocks — for awareness, not for drawing)_

### From docs/prd/02-personas.md

- **PS-26** (P1) — The Installation Team Member's **home screen is today's installation** — the assigned job, its checklist with progress, the site's access constraints and the photos expected — and nothing else.

## States

Base states (always designed): loading · empty · error.

Screen-specific states from the slice:

- **normal** — today's assigned installation with its checklist progress, the site's access constraints, and the photographs expected — and nothing else.
- **empty-teaching** — no installation assigned today: the empty state teaches what will appear here, never apologises.
- **awaiting-sign-off** — today's job's design has no engineer sign-off yet: the progress says the checklist waits on it (`M08-41`).

By construction, no price, discount, tranche, margin or customer value exists on this home or any block composed into it — a property of the surface, not of the viewer, holding in every state above rather than being one of them. There is nothing to hide or mask: the figures are not on the surface to begin with.

## Data volume

One job — the surface is deliberately singular. The weight is in the job's contents: the checklist progress against a real design's derived work order (the 221-panel design is the ruled reference for how long that work order gets), the photographs expected, one per step, and the site's access constraints as captured on the site record.

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier (measured / derived / estimated / assumed) in the design:

- The checklist progress figure (done of total) for today's job.
- The count of photographs expected against photographs captured/uploaded, where shown.
- Today's date and the assignment's date are recorded facts, so they carry no tier (`N7`).

No commercial figure — no price, no discount, no tranche, no margin, no customer value — ever renders on this home or any block composed into it.
