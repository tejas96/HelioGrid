# SCR-M07-03 · Mark Lost

One-tap mandatory reason sheet with the ruled seven-reason set.

**Module:** M07 · Sales Execution · **Personas:** Sales Executive (mobile-first, primary), Sales Manager, EPC Owner — `F2.M07.mark-won-lost`, scope follows lead visibility · **Context of use:** the moment a deal dies — phone in hand, mid-day, between calls; one tap per reason because *"if the product cannot represent that cleanly, reps keep it in their head"* (M07 §M07.12 behavior detail).

**One job:** record why the deal was lost, in one tap.
**Order of attention:** 1 the seven reasons · 2 the date, only when it is postponed · 3 save.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **One tap per reason (`M07-63`):** the reasons are the screen, and none of them is explained.

| Fact | Kind | Its form here |
|---|---|---|
| The seven reasons (`M07-63`) | action | one single-choice list of seven, each one tap. No description under any reason |
| Postponed carries a date (`M07-63`) | data | choosing it reveals ONE required date field. Its one line of helper says the lead comes back on that day — it changes what is typed |
| Not interested suppresses calling for six months (`M07-63`) | — | build-side behaviour. This brief keeps that figure off the sheet, so nothing is drawn for it |
| Save | action | the sheet's ONE act. While it cannot be pressed, its one line says what is missing (`N4`) |
| The save failed | error | one line at the act. The chosen reason and date stay |

## Arrangement

- **375.** A sheet over the lead (`F7-21`): the list, the date when it applies, the act at the foot.
- **1536.** Honestly the same sheet as a side panel. Say so on the board.

## Entry & exit

Reached from: a lead in any open stage (M07 §M07.12 behavior detail: "Mark lost from a lead in any open stage"). Leads to: the lead shows lost; the act lands on the timeline with actor and reason (M07 §M07.12 behavior detail); the lost-with-reason record feeds the win/loss lists (`modules/M13`'s surfaces). Post-save destination is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-63** (P0) — **Mark lost requires a reason — price · chose competitor · postponed · not reachable · roof unsuitable · financing failed · not interested. "This list is the most valuable data in the product."** The reason drives R9's rules as written: *postponed* auto-resurfaces the lead on the given date; *not interested* suppresses the no-call task for six months. The former vocabulary mismatch is **resolved (owner ruling 2026-08-04)**: "not interested" is the **seventh Lost reason**, carrying the six-month suppression exactly as R9 intends; the disqualify list is unchanged (`M02-54` is the machine's row; this is its surface). _(non-UI half, build-side: reason drives R9: postponed auto-resurfaces, not-interested suppresses six months — for awareness, not for drawing)_

## States

- **Loading** (base) — the sheet opens over the lead context.
- **Empty** (base) — no true empty: the sheet always opens against a specific lead with the fixed seven-reason set.
- **Error** (base) — save failure acknowledged honestly; the chosen reason (and date, if postponed) preserved.
- **reason-required** — a reason is mandatory; the sheet offers exactly the ruled seven-reason set, one tap per reason (M07-63; M07 §M07.12 acceptance).
- **postponed-date-required** — choosing *postponed* requires the date the loss carries; that date is what the lead auto-resurfaces on (M07-63; M07 §M07.12 acceptance: "postponed losses carry a date").
- **reasonless-save-refused** — a save with no reason is refused (M07 §M07.12 acceptance: "refuses a reasonless save").

## Data volume

One sheet, one lead, exactly seven reasons — price · chose competitor · postponed · not reachable · roof unsuitable · financing failed · not interested — one tap each; *postponed* adds a single date field. No lists on this screen.

## Numbers carrying provenance

- **Postponed date** — the rep-entered resurface date; drives R9's auto-resurface at 09:00 tenant-local (M07-63, M07-64); rendered on the tenant's timezone.
- The six-month suppression for *not interested* is build-side machine behaviour (R9), not a user-entered or displayed figure on this sheet.
- No money figures appear on this screen.
