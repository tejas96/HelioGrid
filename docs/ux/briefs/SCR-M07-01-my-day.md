# SCR-M07-01 · My Day

The rep's home: today's work ordered by urgency in fixed blocks.

**Module:** M07 · Sales Execution · **Personas:** Sales Executive (primary — this is their home screen) · **Context of use:** mobile-first (`02-personas.md` §Sales Executive; M07 §2) — opened first thing and between calls, phone in hand, in the field, often one-handed. Ships on iOS and Android from day one alongside web (M07 §2).

## Entry & exit

Reached from: app open — My Day **is** the Sales Executive's role-decided home (PS-11; routing itself is `modules/M13`'s, M13-31; this screen supplies the content). Leads to: every row deep-links to its lead, and one tap starts the action — call, open proposal, open visit (M07 §M07.1 behavior detail); agent-activity entries deep-link to the call result on the lead timeline (M07-03); the rep's step-back dashboard ("how am I doing") is a separate, secondary surface (M13-31 — SCR-M13-02). No other entry/exit is pinned by PRD — designer decides, note the decision.

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

### docs/prd/modules/M07-sales-execution.md

- **M07-01** (P0) — **My Day is the Sales Executive's home screen and it is a list of what to do today — not a dashboard of numbers.** It opens on work, ordered by urgency, and answers "who do I call next" without a chart (D37's "tasks, not KPIs" boundary — cited, `modules/M13`). Role-decided home routing is `PS-11`/`modules/M13`'s; this module supplies the surface's content.
- **M07-02** (P0) — **The block order is fixed: OVERDUE — red, first, always · TODAY · AGENT ACTIVITY · UPCOMING THIS WEEK.** Overdue items lead with what makes them urgent — e.g. a follow-up three days late; a proposal unopened five days, showing the system size and value (value formatting per the tenant's market pack, F1-46). Today holds timed items (site visits, call-backs). Upcoming closes the screen.
- **M07-03** (P0) — **Agent activity is a separate block, never mixed with the rep's own tasks.** The rep sees at a glance what a machine did on their behalf overnight — interested / wants callback · no answer / will retry · asked about warranty / answered / still deciding — each entry marked as the agent's, deep-linking to the call result on the lead timeline. *"Blurring that line is how people stop trusting the automation."*
- **M07-04** (P0) — **My Day shows only what the lead state machine says it should.** Snoozed leads are hidden until their wake date; dormant leads are excluded; a wake at 09:00 tenant-local returns the lead **with a follow-up task** that lands in today's list. The machine itself is `modules/M02` §M02.10's (`M02-51`, `M02-52`, `M02-58` consumed); My Day renders its output and invents no timer. _(non-UI half, build-side: renders M02 lead-machine output only; invents no timer — for awareness, not for drawing)_
- **M07-06** (P0) — **Every automatically created task records the rule that created it** (e.g. the on-share follow-up two days after a proposal is marked shared — `M06-55` consumed; the wake-task on snooze expiry — `M02-51` consumed), so a rep always sees *why* a task exists. Auto-created tasks are owned — they land on a named person, never on a pool. _(non-UI half, build-side: auto-created tasks record provenance rule and land on a named person, never a pool — for awareness, not for drawing)_

### docs/prd/modules/M13-dashboards-and-reporting.md

- **M13-31** (P0) — **Sales Executive — home: My Day** (content contract `M07` §M07.1 — overdue · today · agent activity · upcoming; M13-13's separate-block law); **step-back: the rep dashboard, "how am I doing", secondary to My Day** — my pipeline value, my win rate, my proposals out / opened / accepted, my follow-up load, my target if set; their own data only, own-scoped.

### docs/prd/02-personas.md

- **PS-11** (P0) — The Sales Executive's **home screen is My Day** — "not a dashboard of numbers, a list of what to do today", in a fixed order: **overdue** first and always visually first, **today's** timed items, a separate **agent activity** block for what the automation did on their behalf, then **upcoming**. Snoozed and dormant leads are excluded until they wake.

## States

- **Loading** (base) — home screen; opens on work, never blocks the day behind a spinner wall.
- **Empty** (base) — empty states teach, never blank: a rep with nothing overdue sees "Nothing overdue — you're ahead" (M07 §M07.1 behavior detail).
- **Error** (base) — honest failure.
- **normal** — all four blocks populated in the fixed order, every row deep-linking to its lead with a one-tap action.
- **overdue-first** — OVERDUE is the first and most urgent block, always; each overdue item leads with what makes it urgent (a follow-up three days late; a proposal unopened five days with system size and value) (M07-02).
- **agent-block-separate** — agent entries appear only inside AGENT ACTIVITY, each marked as the agent's, never interleaved with the rep's own tasks (M07-03).
- **agent-no-calls-empty-block** — the agent-activity block renders even when empty if the agent is on for any of the rep's leads ("The agent made no calls last night"), so silence is visibly silence and not a broken screen (M07 §M07.1 behavior detail).
- **empty-teaching** — the teaching variant of any empty block ("Nothing overdue — you're ahead"), never a blank region.
- **composed-blocks** — the assembled view: this module's tasks (§M07.2), the agent's queue and results (§M07.7), booked visits (`modules/M04`) and the lead machine's wakes (`modules/M02`) composed into the four fixed blocks (M07 §M07.1 behavior detail).

## Data volume

Not pinned as a count by the PRD — designer decides, note the decision. Design at a busy rep's real day: all four blocks populated at once (overdue follow-ups, timed site visits and call-backs in TODAY, overnight agent calls in AGENT ACTIVITY, the week's items in UPCOMING) and each block's taught empty state. The feeding book is the rep's own-scoped leads — M02's lists run to 200 leads — so a heavy day of tens of rows must stay scannable and answer "who do I call next" without a chart (M07-01). Snoozed and dormant leads are excluded entirely, never greyed (M07-04, PS-11).

## Numbers carrying provenance

- **System size and value** on an unopened-proposal overdue item — value formatted per the tenant's market pack (F1-46); carries its F8 provenance tier in the design (M07-02).
- **Due/overdue derivation dates** ("a follow-up three days late", "a proposal unopened five days") — derived from server-recorded facts, rendered on the tenant's timezone.
- **Wake time** — 09:00 tenant-local wake returning a lead with its follow-up task in TODAY (M07-04).
- **Timed-item times** — site visits and call-backs in the TODAY block (M07-02).
