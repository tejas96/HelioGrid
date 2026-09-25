# SCR-M08-03 · Document Checklist

Pack-seeded document rows with pending/uploaded/verified chips, verified count and per-row upload/replace/view/verify actions; reachable from card and detail.

**Module:** M08 · **Personas:** Project Manager · EPC Owner · Operations · Sales Manager · **Context of use:** on site it is the reason the coordinator opened their phone — document and photo capture happens in the field; dense checklist review also happens on web at a desk. Capture must never lose work; verification is a deliberate desk-side act.

**One job:** get every document uploaded, then verified.
**Order of attention:** 1 how many are verified · 2 the rows still waiting · 3 upload — and, as a separate act, verify.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **Uploading is not approving (`M08-31`), and the screen says it with two different controls —
never with a sentence.**

| Fact | Kind | Its form here |
|---|---|---|
| How many rows are verified | data | the screen's ONE headline figure — verified of the row set — with its provenance label |
| Each row — its pack name, its state, its files (`M08-30`, `M08-31`) | data · status | one list row: the pack's own label; the state as its ONE chip — pending, uploaded, verified; the file count as a mark. A verified row's second line is who verified it and when — a recorded fact, so it carries no tier |
| What can be done to a row (`M08-31`) | action | ONE primary act per row, by state: upload when pending, mark verified when uploaded, view when verified. Replace and view sit in the row's menu |
| A row holding more than one file | more detail | the row opens to its files — name, uploaded when, by whom |
| A row the segment omits (`M08-30`) | — | it is absent, not greyed, and the count follows the real row set. No sentence explains it |
| Completed rows stay | — | arrangement, no words |
| Replacing a verified file | action | the replace confirm's ONE line says the row will need verifying again. Both acts then stand on the timeline |
| Rows still pending | action | a `Pending` filter chip with its count; pack order holds under it |
| What handover waits on (`M08-32`) | data | the pending count is the figure handover reads — every row past pending, uploaded or verified. It sits beside the headline as a count, never a sentence; the handover itself is `SCR-M08-06`'s |
| The checklist never blocks a stage (`M08-34`) | — | behaviour, no words: no lock, no warning and no disabled move anywhere because a document is pending |
| A person with read scope only (`M08-18`) | status | every row and file can be opened and read; no upload, replace or verify act is drawn, and nothing is greyed |
| An upload failed | error | the file stays on its row with `Try again`, and nothing is lost. No offline, queued or syncing state is drawn (context file §1) |
| The checklist failed to load | error | one banner — what failed and what to do |

## Arrangement

- **375.** The count, then the rows in pack order. The row's act opens the camera or the file picker
  directly. A file opens in a sheet.
- **1536.** A captioned table (`F7-27`) — document, state, files, verified by, when, act — with the
  opened file in a side panel (`F7-21`).

## Entry & exit

Reached from: the project card on the Project Board (SCR-M08-01) as well as the Project Detail (SCR-M08-02) — per the PRD, "the checklist is reachable from the card as well as the detail screen, because on site it is the reason the coordinator opened their phone". Leads to: back to the project; the Handover Flow (SCR-M08-06) reads this checklist as its condition — handover is refused while any row is pending, with the pending rows named. Other exits: not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### From docs/prd/modules/M08-projects.md

- **M08-30** (P0) — **The document checklist is seeded at project creation from the tenant's market pack, and this module defines no row name.** The row set, and which rows a segment omits, are pack data — a commercial project omits the incentive row in the India pack, and a market with no incentive model has no such row at all (`F1-52`, `F1-14`). This module owns seeding, the statuses, the handover rule that reads them, and nothing about what the rows are called. _(non-UI half, build-side: row set seeded once from market pack per segment at creation; module defines no row name — for awareness, not for drawing)_
- **M08-31** (P0) — **Each row has exactly three states — pending · uploaded · verified — and verification is a separate act from upload, recorded with who verified and when.** Uploading is not approving: the person who attaches the file and the person who confirms it is the right file may differ, and the checklist is only a defence if that distinction is real. _(non-UI half, build-side: verification is a separate audited act recording who and when; upload never sets verified — for awareness, not for drawing)_
- **M08-18** (P0) — **The Sales Executive reads their own won deals and cannot change them** — *"so they can answer a customer without asking ops."* Read-only means the whole project: stages, blockers, documents and the money summary are visible and none of them is editable by that preset.
- **M08-32** (P0) — **Handover is defined by the checklist: every row past pending, and the pack shared on the customer's link.** That is the definition, and no other surface may redefine it. A project cannot reach `HANDED_OVER` with a pending row.
- **M08-34** (P0) — **The checklist is a completeness surface, not a stage gate.** No stage move in the chain is blocked by a pending document; only handover reads the checklist as a condition (`M08-32`). Real projects collect paperwork out of order, and a checklist that blocks the board is a checklist people work around.

## States

Base states (always designed): loading · empty · error.

Screen-specific states from the slice:

- **normal** — the pack's rows in pack order, a status chip each (pending / uploaded / verified — label plus mark, never colour alone), the count at the top ("*n* of *m* verified"), per-row actions: upload, replace, view, mark verified; a row may hold more than one file; rows never disappear when complete — a completed row is information.
- **row-omitted-by-segment** — a commercial project in a market whose pack omits the incentive row: the row is absent, not greyed; the count reflects the real row set.
- **replace-and-reverify** — the wrong file was uploaded and verified: replace and re-verify; both acts stand on the timeline, nothing deleted from history.
- **read-only-scoped** — the Sales Executive's own won deal: rows and files readable, no act, nothing greyed (M08-18).
- **handover-refused-pending-rows-named** — a handover attempt with a pending row is refused with the pending rows named (the refusal reads this checklist).

## Data volume

The market pack's full row set — the IN pack's instance is eight rows — with rows in mixed states (some pending, some uploaded, some verified), at least one row holding more than one file, and one segment-omitted row absent so the "*n* of *m*" count visibly reflects the real row set. Photographs and files at phone-capture volume.

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier (measured / derived / estimated / assumed) in the design:

- The "*n* of *m* verified" count at the top (*m* is the market pack's checklist length).
- The who-and-when record on each verification, and each file's upload time: recorded facts, so they carry no tier (`N7`), as the row above says.

No money appears on this screen; the checklist is a completeness surface.
