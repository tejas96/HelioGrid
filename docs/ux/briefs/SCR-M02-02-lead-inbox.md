# SCR-M02-02 · Lead Inbox

The owner's morning triage: one queue of unassigned/new leads, assign or bin in under three seconds each.

**Module:** M02 · CRM & leads · **Personas:** EPC Owner (the inbox is the owner's screen, not the rep's), Sales Manager (triages and assigns for the team) · **Context of use:** the owner's morning screen — often a phone over breakfast or between site calls; works at both breakpoints with the dense multi-select view web-emphasis.

**One job:** decide each new lead in under three seconds — assign it or bin it.
**Order of attention:** 1 the next untriaged lead and its two acts · 2 who to give it to, with their load · 3 nothing else — everything else waits for the lead detail.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **Three seconds per lead (`M02-24`) means a row is read, never studied:** five facts, two acts,
no sentence.

| Fact | Kind | Its form here |
|---|---|---|
| Each lead — name, city, source, age, value if known (`M02-24`, `M02-13`) | data · status | one list row: the name; city and age as its second line; the source as its mark; the value, where known, with its tier mark. One provenance label heads the list for the ages (`F8-07`); the value differs, so it keeps its own. A missing name or city is a named gap (`M02-03`), never a blank |
| The two decisions (`M02-24`) | action | two single-tap acts on every row — assign and mark junk. A swipe may speed them up and is never the only way (`N1`). Junk is not a delete — the lead leaves every queue and is kept (`M02-55`) — so it takes no confirm. Assign carries its word; junk is a slashed-circle icon, never a bin, named per row (*Mark Meera Kulkarni as junk*; a nameless lead is named by its city) |
| A lead leaves the queue (`M02-24`, `M02-55`) | status | ONE toast naming the lead and what happened — who it went to, or that it is junk; it names the lead because two acts can be in flight at once. The junk toast carries `Undo`, which reopens the lead (`M02-55`'s exit), so a mis-tap at three-second speed costs one tap |
| A lead unassigned for more than a day (`M02-50`) | status | the age carries the state as a chip. No sentence about escalation |
| One queue, newest first (`M02-23`) | — | arrangement, no words: no sort control is drawn, and nothing explains why |
| Who can take it, and their load (`M02-28`) | data | the assign picker: one row per person with two label–value pairs — open leads, overdue. One tap assigns; no confirm. One provenance label heads the list (`F8-07`). No suggested person, no rule, no auto-assign (`M02-27`). A buried person is shown by their counts, never blocked or warned in words ("the product warns by showing, never by blocking") |
| Whose leads these are (`F2.M02.lead-visibility`) | — | behaviour, no words: the EPC Owner sees every unassigned lead, a Sales Manager their team's, and the header count is that set's |
| An act in progress, never shown as done (`M02-67`) | status | a light in-row pending mark on that row's act; the row and the list stay operable. Never an overlay, never a spinner wall |
| An act that failed (`M02-67`) | error | the lead returns to the queue with ONE inline line: the reason, and `Try again` |
| Someone else assigned it first (`M02-67`) | status | the row shows who holds it, as a chip, then leaves the queue. No dialog |
| Bulk assign (`M02-29`) | action | selecting rows brings a selection bar: the count and ONE act. A partial failure is a result list — each lead, moved or not, and why — never a paragraph |
| No leads yet (`M02-25`) | teaching | at most two short sentences — what will appear here, and how the first lead arrives — and ONE act |
| The inbox failed to load | error | one banner — what failed and what to do |

## Arrangement

- **375.** A list, its count in the header. Rows at a height the thumb can work, both acts on the
  row. The assign picker is a sheet.
- **Both widths.** The head is pinned above the list's own scroller: title, the ask *About the lead inbox*
  (newest first; the owner is told past a day; junk keeps the lead), `Select` at 375, count with its
  tier mark, *Find in this list* (`F7-47`), and a warning chip counting the leads over a day. The chip jumps the
  list to a pinned *Over a day* line; it never filters or sorts, and there is no pager. Find narrows the
  queue and never sorts it; there are no filter chips, because a source chip would split the one queue
  (`M02-23`).
- **1536.** The dense form: a table with multi-select, the assign picker open beside the selection so
  the load figures are in view while rows are chosen (`F7-21`). The 300-lead morning is proven here,
  in this one region. The panel is always docked and non-modal: read-only *Team load* before anything
  is chosen, the picker once leads are chosen, titled with the lead's name when one row's Assign opens
  it. Nothing moves when a row is ticked. The head shows the rows in view (*1–10 of 300*).

## Entry & exit

Reached from: the owner's navigation — the inbox is the morning entry point; onboarding's first door (`M01-26`) lands on exactly this screen in its empty-teaching state (M02-25); the owner dashboard's "needs you" surface reads the same unassigned set (`modules/M13`). Leads to: Lead Detail (SCR-M02-04) by tapping anywhere on the row, the two acts being separate targets — everything beyond the triage decision waits for the lead detail (M02-24); the assign picker (same picker as lead detail, M02-29); a lead leaves the inbox the moment it is assigned or binned, and nothing else removes it; the empty state's `Add lead` opens Quick Add Lead (SCR-M02-01). The page is titled *Leads*, and *Inbox · Leads* tabs under the title switch between this queue and the Leads List (SCR-M02-03) — unassigned leads here, assigned ones there (`M02-58`). The tabs show only to people who hold `F2.M02.assign-leads`; a Sales Executive sees the list alone. No count rides a tab. Home's "needs you" opens the Inbox tab.

## Requirements (verbatim)

### docs/prd/modules/M02-crm-and-leads.md

- **M02-13** (P0) — **The v1 lead-source set is closed and every lead carries its source: manual quick add · file import · inbound call · referral.** The badge is shown wherever a lead is listed, so triage can see at a glance where the enquiry came from. **Post-overlay note carried in-row:** the data model's own row marks referral dormant alongside the deferred channels; `R15` rules the referral tag live in v1, so **only** the website and business-messaging sources stay out (M02-17). The overlay wins; recorded, not silently reconciled. **Suite note (Task 26, closing Task 21 convention 7's flagged reconciliation):** *closed* is `D13`'s claim about the **v1-source** set only — `modules/M03`'s brief-scoped captures extend the suite's badge set (`M03-31`: website form · business messaging · email · SMS · social lead form) under exactly the license this module grants at `M02-17`; a reader meeting `M03-31` first holds two consistent sentences. _(non-UI half, build-side: closed v1 source enum; source set by path, immutable — for awareness, not for drawing)_
- **M02-23** (P0) — **The lead inbox is one queue: unassigned and new leads from every channel, newest first, each with its source badge.** Not one queue per channel and not a filter on the main leads list — one place where an untriaged enquiry waits, whatever door it came through.
- **M02-24** (P0) — **Triage is one decision per lead — assign or bin — and the surface is built for under three seconds each.** *"The Lead Inbox is the owner's screen, not the rep's… Everything else waits. If triage takes more than three seconds per lead, it will not get done."* Each row therefore carries only what the decision needs (name, city, source, age, and the value if known) and both decisions are single-tap: assign (M02-28) or mark junk (M02-55). Everything else about the lead waits for the lead detail.
- **M02-25** (P1) — **The empty inbox teaches.** With no leads yet it states what will appear here and how the first one arrives — the first door out of onboarding (`M01-26`) lands on exactly this screen — rather than rendering a blank list.
- **M02-28** (P0) — **Each rep's open-lead count and overdue count are shown at the moment of assigning, and one tap assigns.** *"The load view is the whole feature."* The picker lists the people who can hold a lead, each with their current open-lead count and their overdue count, *"so you do not bury someone"*; choosing one assigns immediately without a confirm step.
- **M02-29** (P0) — **Assignment is reachable from the lead inbox and from lead detail, and the inbox's multi-select gives bulk assign.** The same picker, the same load figures, applied to one lead or to a selection.
- **M02-50** (P0) — **Unassigned.** Entry: a lead exists with no owner. Timer: **more than twenty-four hours unassigned escalates to the owner — a notification; the state itself does not change.** Exit: assignment moves it to Assigned at stage `new`. Surfaced in the lead inbox and on the owner dashboard's "needs you" list (`modules/M13`). _(non-UI half, build-side: 24h-unassigned timer escalates to owner via notification; state unchanged — for awareness, not for drawing)_
- **M02-67** (P0) — **Triage actions are completed by the server, and the inbox says so rather than assuming.** Assigning a lead and marking one junk — `M02-24`'s two decisions — reach the server to complete; until it confirms, the row shows the action **in progress, never as done**, and a failure returns the lead to the queue naming the reason (`F8-36`). This is an honesty rule, not a confirmation step: `M02-28`'s one-tap assign stands and no dialog is added, and `M02-24`'s under-three-seconds triage binds this state too — the pending treatment is light and in-row, never a blocking overlay or a spinner wall (`F4-27`). The case it exists for is two people triaging the same lead: the second sees it already assigned rather than overwriting the first.

## States

- **Loading** (base).
- **Empty** (base) — the teaching empty state: states what will appear here and how the first lead arrives; onboarding's first door lands here (M02-25).
- **Error** (base) — a failed assign/junk is acknowledged honestly, never applied locally then reversed.
- **normal** — one queue, all channels, newest first, no configurable sort that could hide the oldest item; each row: name, city, source badge, age, value if known; assign and mark-junk each single-tap.
- **empty-teaching** — see Empty above (M02-25).
- **multi-select-bulk-assign** — inbox multi-select, one target assigns the whole selection (M02-29); a bulk assign that partially fails states which leads moved and which did not, and why. At 375, `Select` enters it: each name becomes its checkbox's label and the row acts step back; at 1536 the checkbox is always there. The result's title says how many moved (*2 of 3 assigned to Priya Sharma*); its rows say which. Reassigning a rep's assigned leads is not here: the inbox holds only unassigned ones.
- **assign-picker** — every candidate shows their current open-lead count and overdue count; one tap assigns, no confirm step (M02-28). People are listed A–Z, the neutral order, since any other order would be a suggestion (`M02-27`).
- **overdue-age-visible** — the age column makes the twenty-four-hour escalation visible before it fires; a lead older than 24h unassigned has escalated to the owner and its state is unchanged (M02-50).
- **assign-waiting** — an assign or a mark-junk shows **in progress, never as done**, until the server confirms it; the pending treatment is light and in-row, leaving the row operable — never a blocking overlay and never a spinner wall — so triage still completes in under three seconds per lead, and no dialog is added to the one-tap assign; a failure returns the lead to the queue naming the reason (M02-67, M02-24, M02-28, `F4-27`, `F8-36`).
- **row-already-assigned** — two people triage at once: assignment is server-completed, so the second person sees the lead already assigned rather than overwriting the first (M02-67).

Drawn at 375 only (at 1536 the phone's answer holds at width): `Loading`, `Empty`, `Error`, `assign-waiting`, `row-already-assigned`, the leave-the-queue toasts, and *Find in this list* with a query applied.

## Data volume

Design at a bulk-import morning: **300 leads landing at once** in the same newest-first order rule — the inbox does not paginate away the oldest. The three-second-per-lead triage bar must hold at that volume. Assign picker: the full set of people who can hold a lead, each with two counts.

## Numbers carrying provenance

- **Names and cities are data** and are never translated (`F3-08`); only the queue copy, the age phrasing and the empty state are (`F3-01`). Any value renders through the money implementation with its provenance and provisional state intact (`F3-20`, `F3-24`).

- **Value if known** on an inbox row — a lead's estimated value is a forecast input, never revenue, rendered in the tenant's currency.
- **Age** per row — derived from capture time on the tenant's timezone (`F3-22`); it is what makes the 24-hour escalation visible.
- **Open-lead count and overdue count** per candidate in the assign picker — computed at the moment the picker opens, from the same definition of "open" the leads list uses; overdue is derived, never stored.
- **The over-a-day count** in the head — the same set the owner dashboard's "needs you" reads (`M02-50`); it carries the head's tier mark.
- **The selection count** in bulk assign carries no tier: it is the person's own choice, not a computed figure.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` base state and an `offline-stale-banner` state (`F4-02`, `F4-10`), and its Context of use said reads came from cache. All are deleted. `M02-26` is excised, not deleted: the cache-read and staleness-banner half is cut and the row now states only that triage actions are server-completed and never applied optimistically. `assign-waiting` is reworded as an ordinary in-flight wait, and the inbox row's estimated value no longer carries a cache-provisional label.*

*Amended 2026-08-15 by owner ruling: the server-completed-triage requirement this brief carried as UNRESOLVED is restored to the live PRD under a **new id, `M02-67`** in `docs/prd/modules/M02-crm-and-leads.md` §M02.5 — it replaces the citation of `M02-26`, which stays deleted from the 2026-08-07 sweep and is not to be cited. The UNRESOLVED marker and its placeholder bullet are replaced by the verbatim `M02-67` row; `assign-waiting` now cites `M02-67` and states the ruled pending treatment — light and in-row, the row still operable, never a blocking overlay or a spinner wall, with `M02-24`'s under-three-seconds bar still binding — and `row-already-assigned` cites the same row. The owner's reason: `F8-36` is live P0 — a surface "does not silently queue, partially apply, or display an optimistic result" — and no module row made that concrete for triage.*
