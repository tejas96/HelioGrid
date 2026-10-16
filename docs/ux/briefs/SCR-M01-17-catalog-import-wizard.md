# SCR-M01-17 · Catalog Import Wizard

Guided spreadsheet import: upload, column mapping with auto-guess, preview with counts, async import, per-row report; reused at onboarding, settings, picker.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner, Operations · **Context of use:** bulk work at a desk — import wizards are desktop-first per M01 §2's UXG-01 pattern. Permission: catalog administration is `F2.M01.manage-catalog` (EPC Owner + Operations; M01 §M01.4 permissions).

## Entry & exit

Reached from: its three entry points — onboarding, Catalog settings (SCR-M01-15), and the picker's add-flow (M01-41; §M01.4 behavior detail: "Import is one wizard reused at its three entry points"). Leads to: the import runs async with visible progress; the import report is kept and re-openable (M01-41, §M01.4 behavior detail). Return-to-invoking-surface behaviour beyond that is not pinned by PRD — designer decides, note the decision.

Decided: leaving is a dismissal, never a navigation — the header's close, Esc and *Cancel* all return to the caller with nothing rebuilt. Leaving before the import discards the mapping without a confirm, because nothing has been written to the catalog. The import report outlives the visit: the run continues server-side and the report re-opens from Catalog settings, so the onboarding entry does not own it.

**Decisions made in design (2026-09-01) — later screens inherit them.**

1. **`reachability="entered"`, not the system's free default.** `Stepper`'s own docs name an import
   wizard reading a parsed file as the case for opt-in gating: the preview of a file whose columns
   are not mapped is a meaningless step. This is **not** the studio's ruled gate (`M05-05`) and does
   not normalise it.
2. **The three counts are `derived`.** A matching pass computed them; nothing measured them.
3. **A row fixed in the preview moves the counts, and the act's number with it** —
   `318/87/7 → import 405` becomes `319/87/6 → import 406`. Both close on 412.
4. **The file's own header text is data and never translates.** *Item description*, *Rate*,
   *Supplier code* stay in mono English inside a Hindi UI; the field list beside them is the
   product's vocabulary and does translate. A pass that translated the headers would hide what the
   file actually says.
5. **The act's sentence is the last thing that shortens.** Six lines of consequence in Marathi
   against four in English — the body shrinks, the footer never clips. A person who cannot read what
   the act does must not be able to reach the button.

**Layout, decided in design.**

- At 375 the wizard is a sheet over the caller; at 1536 a 960px side panel, non-modal — no backdrop,
  no focus trap; focus moves in and is restored — with the catalog live beside it.
- Four steps: File · Columns · Preview · Import report. The run is the passage into the report, not a
  fifth step.
- On the phone the step indicator is a compact location line, and the whole shape opens in a
  step-list sheet that gives each step's state in a word and says the report opens once the import
  has run. At 1536 the four numbered steps sit across the top of the panel, and there is no step-list
  sheet.
- Every gated act says why in words under its button, and the button stays focusable.

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-41** (P0) — **Spreadsheet (Excel/CSV) import with smart matching is P0, available at onboarding, in settings, and at proposal time.** Guided import: upload → column mapping with auto-guess → preview → import report. **Smart matching:** rows that match platform products become **price overrides** on those items (never duplicate SKUs); unknown rows become **tenant SKUs**; rows with problems are **fixed inline** in the preview, not bounced to a failed file. The import runs async with visible progress and a per-row failure report. _(non-UI half, build-side: smart matching engine: platform matches become price overrides, unknowns become tenant SKUs; async run — for awareness, not for drawing)_

## States

- **Loading** — file parsing, matching pass running, or report loading.
  Two waits look different: the matching pass is a short wait, not a counted figure — the run carries
  the counted progress — and a re-opened report is the table's own loading form under a caption and
  stamp that are already true (decision 24).
- **Empty** — the upload step before a file is chosen.
  The drop surface is the whole step, with no template download (owner ruling 2026-10-16). The subtitle names no file; it keeps the promise that nothing
  changes in the catalog until the import.
- **Error** — an unreadable file; what happened and what to do next.
  It is the `Empty` step plus the file, named, and a banner that cannot be dismissed, stating the
  problem and the fix; the file row shows the problem in place of its counts and carries no tier; the
  footer says the catalog is untouched (decision 27). A run that fails partway is not this state:
  its failed rows are the report's, each with its reason.
- **upload** — the guided import's first step: Excel/CSV file upload (M01-41).
  On the phone, once a file is chosen, there is no drop surface — the file row's *Replace* is the
  route. At 1536 the drop surface stays as well.
- **column-mapping-auto-guess** — column mapping with auto-guess; auto-guess must handle headers in any launch language (M01-41; §M01.4 localization notes).
  Each row's visible name is the file's own header, in mono. The columns the guess could not place sit
  above the ones it matched, and *Matched automatically* is said once for that section. An unmatched
  column is not an error: leaving it out is a legitimate answer. At 1536 every row is on screen — the
  unplaced in two columns, the matched in three.
- **preview-three-counts** — the preview states, in plain numbers, "N rows · M match platform products (will become price overrides) · K new products · E rows need attention" (§M01.4 behavior detail).
  The four numbers are filter chips that scope the grid — not a sentence plus chips; the line above
  them says a match becomes a price override, never a second copy. Each row shows two prices, the
  file's and the catalog's now (*No price* where a platform item has none), and its outcome as a
  word plus a dot: *Price override*, *New price on your item*, *New product*, *Needs attention*. A row
  that matches one of the company's own SKUs gives that SKU a new dated rate (`own_item_price`) and is
  counted with the matches (owner ruling 2026-10-16). The *In your catalog now*
  tier carries no source; the row already names the product. No second confirm on the act: the
  preview is the confirmation, and the footer states the recovery route in words.
- **needs-attention-inline-fix** — rows with problems are fixed inline in the preview grid, not bounced to a failed file (M01-41); spec conflicts on platform matches are needs-attention rows — a match creates a price override, never a spec edit (§M01.4 edge cases).
  A flagged row is flagged where it stands, saying what is wrong, with *Leave this row out*. A spec
  conflict offers two answers — keep the catalog's spec and set only the price, or import the row as
  an own SKU — and no third that edits a platform spec (decision 31). At 1536 every flagged row and its
  fix are on screen at once. A price problem is fixed in the row itself — a `NumberField` in the row's
  issue slot, never an editable column across every row (`D236`).
- **importing-async-progress** — the import runs async with visible progress (M01-41).
  Its cancel stops watching, never the run: the import continues server-side.
- **per-row-report-reopenable** — the per-row failure report; kept and re-openable (M01-41, §M01.4 behavior detail).
  Its act, *Fix the N rows*, re-enters the preview scoped to the rows left open — the report is the
  only surface that knows which they are (decision 32).

Drawn at 375 only (at 1536 the phone's answer holds at width): `Loading`, `Empty`, `Error`, `importing-async-progress`.

## Data volume

A supplier/stock price list at spreadsheet scale: the preview grid must work with rows in the hundreds, split across the three counts (platform matches, new products, needs-attention), with inline fixing inside the grid. The PRD fixes no row ceiling — design the preview and report as dense, scrollable working grids, not short summaries (M01 §2 dense-list, desktop-first classification).

## Numbers carrying provenance

Each carries its F8 provenance tier in the design:

- **The preview's three counts plus total** — "N rows · M match platform products (will become price overrides) · K new products · E rows need attention" (§M01.4 behavior detail) — computed by the matching pass.
- **Imported prices per row** — become price overrides on matched platform items or rates on new tenant SKUs (M01-41). No F8 tier: a price the company sets for itself (`F8-01`, owner ruling 2026-10-16).
- **Async progress figure** during the run and the **per-row counts in the import report** (rows, matched, created, errors — §M01.4 analytics vocabulary).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted. The import's async server-side run is untouched.*

*Returning from this wizard lands on the panel and scroll position the caller was on (`SCR-M01-15` decision 6).*
