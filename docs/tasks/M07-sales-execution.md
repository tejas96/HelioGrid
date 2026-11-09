# M07 · Sales Execution — engineering tasks

This file covers Module M07 (Sales Execution): My Day and the follow-up task system, the voice agent end to end (guided setup, knowledge base, behaviour defaults, the compliance gate, triggers and the call queue, call execution, escalation and hand-to-human, inbound IVR, telephony numbers, agent performance and usage) and the close surfaces (Mark won, Mark lost, Reopen). Task-id prefix: `T-M07-`. Source doc: `docs/prd/modules/M07-sales-execution.md` (rows M07-01…M07-65). Screen tasks' verbatim requirement rows live in the PRD; engine, policy and integration tasks quote their rows in full below.

### T-M07-001 · My Day

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M07-01 (P0), M07-02 (P0), M07-03 (P0), M07-04 (P0), M07-06 (P0)
**DESIGN:** SCR-M07-01
**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.
**DONE WHEN:**
- Given a Sales Executive with overdue, timed, agent-touched and future items, when My Day renders, then the blocks appear in exactly the order OVERDUE · TODAY · AGENT ACTIVITY · UPCOMING THIS WEEK, with overdue styled as the first and most urgent block (M07-01, M07-02).
- Given the agent called two of the rep's leads overnight, when My Day renders, then those two outcomes appear only inside the AGENT ACTIVITY block, each marked as agent activity and deep-linking to the call result — never interleaved with the rep's own tasks (M07-03).
- Given a snoozed lead with a wake date of today, when 09:00 tenant-local passes, then the lead's follow-up task is in TODAY and the lead is no longer hidden (M07-04).
- Given a proposal marked shared on Monday, when Wednesday arrives with no rep action, then the auto-created follow-up task exists, is owned by the sending rep, and names its provenance rule (M07-06); given it is still open two days past due, then it is visible to the agent's task-overdue trigger (M07-07).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-002 · Mark won

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M07-62 (P0)
**DESIGN:** SCR-M07-02
**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.
**DONE WHEN:**
- Given a rep marks a lead won with final value and expected install date, when they confirm, then the project exists immediately with no re-entry of customer data, and the lead shows won (M07-62).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-003 · Mark lost

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M07-63 (P0)
**DESIGN:** SCR-M07-03
**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.
**DONE WHEN:**
- Given a rep marks a lead lost, when they must pick a reason, then the surface offers the ruled seven-reason set (the source six plus "not interested" — owner ruling 2026-08-04), refuses a reasonless save, and postponed losses carry a date (M07-63).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-004 · Reopen lead

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M07-64 (P0)
**DESIGN:** SCR-M07-04
**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.
**DONE WHEN:**
- Given a postponed loss dated next month, when that date arrives, then the lead resurfaces at 09:00 tenant-local with a follow-up task (M07-64).
- Given a lost lead is reopened, when it re-enters, then it lands at its prior funnel stage and the timeline records the reopen (M07-64).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-021 · Follow-up task system (model, provenance, trigger feed)

**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** M07-05, M07-07
**Requirements (verbatim):**
- **M07-05** (P0) — **A task carries an assignee, a kind — follow-up · site visit · call · custom — a due date and a status. Overdue is derived from the due date, never a stored state.**
- **M07-07** (P0) — **A task overdue two days is an agent trigger.** The task system is what the safety net reads: the task-overdue-2d trigger (§M07.7, M07-33) reads task due dates and statuses — no separate bookkeeping exists to drift from what the rep sees.
**DONE WHEN:**
- Given a task due yesterday, when any surface renders it, then it is overdue by derivation — and if its due date is edited to tomorrow, it is nowhere overdue, with no stored flag to clear (M07-05).
- Given a proposal marked shared on Monday, when Wednesday arrives with no rep action, then the auto-created follow-up task exists, is owned by the sending rep, and names its provenance rule (M07-06); given it is still open two days past due, then it is visible to the agent's task-overdue trigger (M07-07).

**Settle before the build:**
- The task status vocabulary and its transitions (M07-05) — ruled: `open | done | cancelled`, with open → done, open → cancelled and done → open (an untick), cancelled terminal; overdue is derived on `open` rows only, and a snoozed lead hides its tasks by the lead's own state, never by a task status (every consumer — My Day, the overdue-2d trigger, the snooze hide-and-return — reads only whether a task is still open, and M07-05 forbids storing overdue).

## Laws (enforced through screens and review, no standalone build)

- **M07-65** (P0) — **The close surfaces feed the honest lists, and only those:** lost-with-reason into the win/loss "lost late" list, disqualified-early into its list (`modules/M13`'s surfaces); a won deal's revenue counting and any later cancellation are `modules/M08`/`modules/M13`'s (R2's `CANCELLED` stops counting immediately — cited). Nothing here double-counts, forecasts, or re-claims agent credit (F8-30 consumed). — *Enforced by:* the close tasks T-M07-002, T-M07-003 and T-M07-004 emitting each close event exactly once with its reason, and review of the consuming win/loss surfaces (`docs/prd/modules/M13-dashboards-and-reporting.md`'s rows); its acceptance line: Given a deal is lost or won, when the win/loss lists render, then it appears in exactly its ruled list, and no forecast or agent-credit figure is restated here (M07-65).

## Disposition index

| Row | Disposition |
|---|---|
| M07-01 | T-M07-001 |
| M07-02 | T-M07-001 |
| M07-03 | T-M07-001 |
| M07-04 | T-M07-001 |
| M07-05 | T-M07-021 |
| M07-06 | T-M07-001 |
| M07-07 | T-M07-021 |
| M07-08 | voice — postponed |
| M07-09 | voice — postponed |
| M07-10 | voice — postponed |
| M07-11 | voice — postponed |
| M07-12 | voice — postponed |
| M07-13 | voice — postponed |
| M07-14 | voice — postponed |
| M07-15 | voice — postponed |
| M07-16 | voice — postponed |
| M07-17 | voice — postponed |
| M07-18 | voice — postponed |
| M07-19 | voice — postponed |
| M07-20 | voice — postponed |
| M07-21 | voice — postponed |
| M07-22 | voice — postponed |
| M07-23 | voice — postponed |
| M07-24 | voice — postponed |
| M07-25 | voice — postponed |
| M07-26 | voice — postponed |
| M07-27 | voice — postponed |
| M07-28 | voice — postponed |
| M07-29 | voice — postponed |
| M07-30 | voice — postponed |
| M07-31 | voice — postponed |
| M07-32 | voice — postponed |
| M07-33 | voice — postponed |
| M07-34 | voice — postponed |
| M07-35 | voice — postponed |
| M07-36 | voice — postponed |
| M07-37 | voice — postponed |
| M07-38 | voice — postponed |
| M07-39 | voice — postponed |
| M07-40 | voice — postponed |
| M07-41 | voice — postponed |
| M07-42 | voice — postponed |
| M07-43 | voice — postponed |
| M07-44 | voice — postponed |
| M07-45 | voice — postponed |
| M07-46 | voice — postponed |
| M07-47 | voice — postponed |
| M07-48 | voice — postponed |
| M07-49 | voice — postponed |
| M07-50 | voice — postponed |
| M07-51 | voice — postponed |
| M07-52 | voice — postponed |
| M07-53 | voice — postponed |
| M07-54 | voice — postponed |
| M07-55 | voice — postponed |
| M07-56 | voice — postponed |
| M07-57 | voice — postponed |
| M07-58 | voice — postponed |
| M07-59 | voice — postponed |
| M07-60 | voice — postponed |
| M07-61 | voice — postponed |
| M07-62 | T-M07-002 |
| M07-63 | T-M07-003 |
| M07-64 | T-M07-004 |
| M07-65 | LAW |
