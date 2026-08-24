# SCR-M02-05 · Lead Import Wizard

Desktop-first bulk import: upload, auto-guess mapping, preview with duplicate counts, background import with report.

**Module:** M02 · CRM & leads · **Personas:** EPC Owner, Sales Manager (permission `F2.M02.import-leads`) · **Context of use:** desktop-first — "the owner at a desk" with the old spreadsheet every EPC has; remains usable at the mobile breakpoint per the parity law (`F7-30`).

## Entry & exit

Reached from: the leads surface, by the owner or sales manager holding `F2.M02.import-leads` — the PRD pins the persona and posture ("the owner at a desk"), not a single navigation path; not pinned by PRD — designer decides, note the decision. Leads to: the import report at the end of the four steps; imported leads land unassigned in the Lead Inbox (SCR-M02-02) with source = file import, so triage is unchanged by volume; the import's own record — file name, who ran it, when, and its report — stays on the tenant's import history.

## Requirements (verbatim)

### docs/prd/modules/M02-crm-and-leads.md

- **M02-08** (P0) — **The dedupe sheet shows the existing record with the three facts that make the decision obvious: who owns it, what stage it is at, and when it was last contacted.** The source's own example is the acceptance shape: *"Priya Sharma from Nashik already exists, owned by Rajesh, last contacted 4 days ago."* The sheet shows the existing record even where the person capturing cannot otherwise see it — with owner name, stage and last-contact date only, never the record's contents — because the whole purpose is to stop a second rep chasing the same customer. **Final (owner ruling 2026-08-04, Q23):** the three-fact disclosure is confirmed exactly as specified — no file access, and cross-scope Open-existing resolves to a request-to-owner.
- **M02-09** (P0) — **The sheet offers exactly three choices, and the third demands a reason: Open existing · Log enquiry on existing · Create anyway (reason mandatory, audited).** There is no fourth choice and no silent default; dismissing the sheet leaves nothing created. _(non-UI half, build-side: exactly three choices, no silent default; dismissing creates nothing — for awareness, not for drawing)_
- **M02-11** (P0) — **"Log enquiry on existing" records the enquiry on the existing record and never creates a second lead.** The enquiry lands on the existing lead's timeline as an activity naming the channel, the time and what was captured, and the existing owner is notified so the next call is theirs to make. Nothing about the existing lead's stage, owner or assignment changes. _(non-UI half, build-side: appends enquiry activity, notifies owner, changes no stage or owner — for awareness, not for drawing)_
- **M02-12** (P0) — **"Create anyway" requires a reason, audits it, and links the two records.** The reason is mandatory free text, recorded on both records' timelines with who chose it and when, and joins the audit log (`F2-22`). Both records then exist and each shows the other, because a deliberate duplicate is exactly the input the merge flow (§M02.11) exists to resolve later. _(non-UI half, build-side: mandatory reason audited on both timelines; records cross-linked for merge — for awareness, not for drawing)_
- **M02-18** (P0) — **Import is a four-step wizard: upload → column mapping → preview → import, ending in a report.** Column mapping **auto-guesses** the mapping from the file's own headers and lets every guess be corrected; nothing is imported before the preview is seen. The wizard is desktop-first because the person doing it is at a desk, and works at both breakpoints (`F7-30`).
- **M02-19** (P0) — **The preview states the counts before importing, in the source's own shape: "N rows · M duplicates by phone".** Duplicates are surfaced **before** the import runs, never discovered afterwards — a file of 400 rows containing 90 duplicates says so on the preview screen.
- **M02-20** (P0) — **Duplicates in the preview are skippable, or logged as enquiries on the existing leads — through the same dedupe sheet.** The preview reuses M02.2's sheet rather than inventing an import-only dialog, and offers the same resolution in bulk: skip all duplicates, or log them all as enquiries on their existing leads. Creating duplicates deliberately from an import requires the same audited reason, applied per row. _(non-UI half, build-side: skip is default; create-anyway needs audited reason per row — for awareness, not for drawing)_
- **M02-21** (P0) — **The import runs as a background job with visible progress and a failure report; a partial success is reported honestly.** The person who started it may leave the screen; progress is visible while it runs and the finished import produces a **report naming every rejected row and why** (unreadable number, missing required column, malformed row). Rows that imported are not rolled back because other rows failed, and the report says exactly how many landed. _(non-UI half, build-side: async background job; landed rows never rolled back on partial failure — for awareness, not for drawing)_

## States

- **Loading** (base).
- **Empty** (base) — no file uploaded yet; upload accepts the spreadsheet formats an EPC actually has.
- **Error** (base) — an unreadable file or failed step reported honestly; every-row-failure states so plainly and no lead exists (`F8-36`).
- **upload** — step 1 of the wizard.
- **column-mapping-autoguess** — each detected column beside its guessed lead field with the first rows as sample values; every guess correctable; only the phone column required to proceed (M02-03's law applies to imported rows exactly as to typed ones); an unmappable column proceeds without it and is listed in the report rather than silently dropped.
- **preview-counts** — the gate: total rows, rows that will create leads, rows that duplicate an existing customer by phone, rows that cannot be read at all — each count tappable to see the rows behind it; "N rows · M duplicates by phone" stated before any import runs (M02-19). Two rows inside the same file sharing a number are counted as duplicates of each other and resolved by the same choice.
- **dedupe-sheet-bulk** — the same three-choice sheet reused (M02-20): skip all duplicates (default — the choice that cannot create a double-chase), or log them all as enquiries on their existing leads; create-anyway requires the audited reason per row.
- **importing-progress** — background job with visible progress; the person may leave and return to progress or the finished report; a connection drop mid-import continues server-side and the person is told where it got to.
- **report-partial-failure** — the report names every rejected row and why (unreadable number, missing required column, malformed row), says exactly how many landed, and landed rows are never rolled back (M02-21).

## Data volume

Design at the source's own case: **a file of 400 rows containing 90 duplicates by phone** — both counts on the preview before the import runs, each count tappable to the rows behind it. The report must handle dozens of rejected rows each with a named reason. Mapping step: a spreadsheet with more columns than lead fields, some unmappable.

## Numbers carrying provenance

- **Preview counts** — "N rows · M duplicates by phone", plus rows that will create leads and rows that cannot be read: exact counts computed before import, never discovered afterwards (M02-19).
- **Progress figure** while the job runs (M02-21).
- **Report counts** — how many landed, how many skipped, every rejected row with its reason: honest, exact, no success reported that was not achieved (`F8-36`).
- Counts render through the shared number implementation (`F3-19`); imported phone numbers are normalised to the pack specification (`F1-21`).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` base state and an `offline-refused` state, and a Context-of-use sentence stating import was online-only (`F4-09` row 6). All are deleted. Requirement row **`M02-22` ("Import is online-only")** is deleted whole: it existed only to place import on the offline boundary. `importing-progress` keeps the server-side continuation of a connection drop mid-import; only its `F4-20` citation is cut.*
