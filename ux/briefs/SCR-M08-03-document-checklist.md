# SCR-M08-03 · Document Checklist

Pack-seeded document rows with pending/uploaded/verified chips, verified count and per-row upload/replace/view/verify actions; reachable from card and detail.

**Module:** M08 · **Personas:** Project Manager · EPC Owner · Operations · Sales Manager · **Context of use:** on site it is the reason the coordinator opened their phone — document and photo capture happens in the field, often with no signal (a basement, a rooftop); dense checklist review also happens on web at a desk. Capture must never lose work; verification is a deliberate desk-side act needing a connection.

## Entry & exit

Reached from: the project card on the Project Board (SCR-M08-01) as well as the Project Detail (SCR-M08-02) — per the PRD, "the checklist is reachable from the card as well as the detail screen, because on site it is the reason the coordinator opened their phone". Leads to: back to the project; the Handover Flow (SCR-M08-06) reads this checklist as its condition — handover is refused while any row is pending, with the pending rows named. Other exits: not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### From prd/modules/M08-projects.md

- **M08-30** (P0) — **The document checklist is seeded at project creation from the tenant's market pack, and this module defines no row name.** The row set, and which rows a segment omits, are pack data — a commercial project omits the incentive row in the India pack, and a market with no incentive model has no such row at all (`F1-52`, `F1-14`). This module owns seeding, the statuses, the handover rule that reads them, and nothing about what the rows are called. _(non-UI half, build-side: row set seeded once from market pack per segment at creation; module defines no row name — for awareness, not for drawing)_
- **M08-31** (P0) — **Each row has exactly three states — pending · uploaded · verified — and verification is a separate act from upload, recorded with who verified and when.** Uploading is not approving: the person who attaches the file and the person who confirms it is the right file may differ, and the checklist is only a defence if that distinction is real. _(non-UI half, build-side: verification is a separate audited act recording who and when; upload never sets verified — for awareness, not for drawing)_

## States

Base states (always designed): loading · empty · error.

Screen-specific states from the slice:

- **normal** — the pack's rows in pack order, a status chip each (pending / uploaded / verified — label plus mark, never colour alone), the count at the top ("*n* of *m* verified"), per-row actions: upload, replace, view, mark verified; a row may hold more than one file; rows never disappear when complete — a completed row is information.
- **row-omitted-by-segment** — a commercial project in a market whose pack omits the incentive row: the row is absent, not greyed; the count reflects the real row set.
- **replace-and-reverify** — the wrong file was uploaded and verified: replace and re-verify; both acts stand on the timeline, nothing deleted from history.
- **handover-refused-pending-rows-named** — a handover attempt with a pending row is refused with the pending rows named (the refusal reads this checklist).

## Data volume

The market pack's full row set — the IN pack's instance is eight rows — with rows in mixed states (some pending, some uploaded, some verified), at least one row holding more than one file, and one segment-omitted row absent so the "*n* of *m*" count visibly reflects the real row set. Photographs and files at phone-capture volume.

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier (measured / derived / estimated / assumed) in the design:

- The "*n* of *m* verified" count at the top (*m* is the market pack's checklist length).
- The who-and-when record on each verification (verifier and date/time).
- Upload dates/times per file where shown.

No money appears on this screen; the checklist is a completeness surface.
