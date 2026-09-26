# SCR-M11-01 · Finance Home (Money Due)

Finance's money-due home: due, overdue, receipts awaiting, period collections (composed by M13).

**Module:** M11 (facts, states and figures) · composed by M13 (home composition) · **Personas:** Finance · **Context of use:** web-first desk work — reconciliation, receipts and the period view are dense-screen desk tasks; the overdue list is also consulted on mobile away from the desk (per the Finance persona's primary-surfaces statement in `docs/prd/02-personas.md`).

**One job:** see what money is due and overdue, and what is waiting to be recorded.
**Order of attention:** 1 what is due, longest-waiting first — by project · 2 payments awaiting confirmation · 3 this month's collections against what fell due.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **This home reads money and writes none (`M11-52`):** every row leads to the payments screen,
and no control here records, waives or reverses.

| Fact | Kind | Its form here |
|---|---|---|
| Tranches due, by project (`M11-54`, `M13-38`, `M11-10`, `M11-11`) | data · status | rows grouped by project, longest-waiting first: the customer and project, the tranche, what it still owes, its state chip — due or part-received, M11-10's own states — and the days since it fell due, the day its stage completed. A due tranche not fully received is overdue (`M11-54`); there is no separate overdue group and no threshold. Each row leads to that project's payments screen (`SCR-M11-02`) |
| Payments awaiting confirmation (`M11-54`, `M11-28`) | data · status | their count as the region's figure, then rows — amount, project and M11-28's awaiting-confirmation state — each leading to the payments screen. Nobody records them here: the tenant's account confirms them (`M11-29`) |
| The month's collections against what fell due (`M11-54`, `M13-16`, `M11-43`) | data | two figures as label–value rows, the calendar month as the region's caption — the same collected-against-due figure the owner's dashboard shows. Collected money is shown as its two parts — confirmed by the account, recorded by hand — because an aggregate that merges them drops the distinction (`M11-42`) |
| A figure that cannot be reconciled now (`F8-12`) | status | its provisional mark, on the figure. Never a banner paragraph, and never a settled-looking number |
| Provenance (`F8-07`) | honesty label | one label at the foot of each group serves the figures that share it — never a key above them |
| Another preset's today-work (`M13-10`) | more detail | a compact block with its own title and a row leading to its home; it never pushes money due off the first screenful |
| Nothing published yet | teaching | at most two short sentences. Nothing is fabricated to fill a block |
| The home failed to load | error | one banner — what failed and what to do. No figure is drawn |

## Arrangement

- **375.** Due tranches, longest-waiting first, then payments awaiting confirmation, then the month. Tens of rows scroll in
  the due region, which is this screen's volume.
- **1536.** Due tranches as one captioned table grouped by project, longest-waiting first (`F7-27`);
  payments awaiting confirmation and the month's figures in a side column, in view while the table scrolls.

## Entry & exit

Reached from: sign-in — this is the home screen the product composes for a person holding the Finance preset (`PS-32`, `M13-38`; M13 §M13.5's acceptance: when the person signs in, their home matches their row). Leads to: the Payments Ledger (SCR-M11-02) — M11 §M11.8's behavior detail pins that the payments screen "is reachable from the project (`M08-35`) and from Finance's own home (`M11-54`); it is the same screen in both places." Other exits: not pinned by PRD — designer decides, note the decision.

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

### From `docs/prd/modules/M11-payments-and-collections.md`

- **M11-54** (P1) — **Finance's home is money due.** Tranches due now and overdue by project, receipts waiting to be recorded, and the period's collections against what was expected — every figure obeying the money-never-stale law. The composition of the home screen is `modules/M13`'s; the facts, states and figures it composes are this module's. A due tranche not fully received is overdue from the day it fell due, with no grace period and no threshold: the home lists due tranches longest-waiting first with their days since due. The receipts waiting are the link payments paid and awaiting confirmation (`M11-28`), which nobody records by hand (owner rulings 2026-09-26). _(non-UI half, build-side: supplies due/overdue/receipts/period figures; composition is M13's — for awareness, not for drawing)_

- **M11-10** (P0) — **Tranche state is derived from the ledger and can never be typed.** `upcoming → due → part-received → received`, with `waived` terminal: the received states are recomputed from the payment entries that exist, so no person sets "received" as a status and no status can disagree with the receipts behind it. What a person *can* do is add an entry (`M11.5`), reverse one (`M11.7`) or waive the tranche (`M11-49`) — each of which changes the state by changing the facts.
- **M11-11** (P0) — **Completing the stage a tranche is mapped to makes that tranche due.** The mapping is against the canonical project chain with market-neutral stage names (`R2`); the stage event is `modules/M08`'s (`M08-36`) and the transition it causes is this module's. Nothing else makes a tranche due — not a date, not a person's judgement, not the customer's link being opened.
- **M11-28** (P0) — **Between payment and confirmation there is a stated waiting state, never a guess.** A link that has been opened or paid but not yet confirmed renders as awaiting confirmation with that wording — not as received, not as failed, and not as an empty row that makes a person wonder.
- **M11-43** (P0) — **Collected-against-due is one computed figure, and every surface that shows it shows the same one.** The payments screen, the project's money block, the board card, the owner's dashboard, an export and the customer's rendering are renderings of one value — they never recompute independently, round differently or drop a qualifier the others carry.

### From `docs/prd/modules/M13-dashboards-and-reporting.md`

- **M13-38** (P0) — **Finance — home: money due** — tranches due and overdue by project, receipts waiting, period collections vs expected — every figure with `M11-54`'s qualifiers intact (M13-08).
- **M13-16** (P0) — **Cash: collected vs due this month from the project tranches, and the overdue total** — read from `modules/M11`'s figures with their freshness and confirmation qualifiers intact (M13-08); collections ageing renders the ageing M11 publishes, never a recomputation.

### From `docs/prd/02-personas.md`

- **PS-32** (P1) — The Finance persona's **home screen is money due** — tranches due now and overdue by project, receipts waiting to be recorded, and the period's collections against what was expected — with every figure obeying the money-never-stale rule.

## States

- **Loading** (base).
- **Empty** (base) — empty-teaching: a new tenant whose modules publish nothing yet gets the teaching empty state per home (M13 §M13.5 edge case); nothing is fabricated to fill blocks.
- **Error** (base).
- **Normal** — due tranches by project, longest-waiting first; payments awaiting confirmation; the month's collections against what fell due.
- **Stale-money-qualified** — a figure that cannot be reconciled at display time renders visibly provisional with its qualifier, never presented as settled fact; `M11-54`'s qualifiers stay intact in every block M13 composes (`M13-38`).

## Data volume

Portfolio-wide, not single-project: tranches due and overdue grouped by project across the tenant's active projects, each project carrying a 3–4-tranche schedule (the platform seeds the 10/60/20/10 and 30/60/10 templates, `M01-54`). The Finance persona's day-in-the-life sets the sitting-down volume: three tranches newly due since last look, one due long enough to stand at the top, two payments awaiting confirmation — design the lists to stay workable at tens of due/overdue rows across the portfolio.

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier in the design (measured / derived / estimated / assumed), and money additionally carries its freshness and confirmation qualifiers, which the composition may not drop (`M13-38`, `M11-54`):

- Amount due per tranche, per project (due now).
- Days since each tranche fell due — derived from the day its stage completed, which is a recorded fact and carries no tier (`N7`).
- Payments awaiting confirmation (count and their amounts).
- The month's collections figure.
- The month's due figure it is shown against.
- Every one of the above: never rendered final while stale; confirmation-state qualifiers intact.
