# SCR-M01-17 · Catalog Import Wizard

Guided spreadsheet import: upload, column mapping with auto-guess, preview with counts, async import, per-row report; reused at onboarding, settings, picker.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner, Operations · **Context of use:** bulk work at a desk — import wizards are desktop-first per M01 §2's UXG-01 pattern. Permission: catalog administration is `F2.M01.manage-catalog` (EPC Owner + Operations; M01 §M01.4 permissions).

## Entry & exit

Reached from: its three entry points — onboarding, Catalog settings (SCR-M01-15), and the picker's add-flow (M01-41; §M01.4 behavior detail: "Import is one wizard reused at its three entry points"). Leads to: the import runs async with visible progress; the import report is kept and re-openable (M01-41, §M01.4 behavior detail). Return-to-invoking-surface behaviour beyond that is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### From `prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-41** (P0) — **Spreadsheet (Excel/CSV) import with smart matching is P0, available at onboarding, in settings, and at proposal time.** Guided import: upload → column mapping with auto-guess → preview → import report. **Smart matching:** rows that match platform products become **price overrides** on those items (never duplicate SKUs); unknown rows become **tenant SKUs**; rows with problems are **fixed inline** in the preview, not bounced to a failed file. The import runs async with visible progress and a per-row failure report. _(non-UI half, build-side: smart matching engine: platform matches become price overrides, unknowns become tenant SKUs; async run — for awareness, not for drawing)_

## States

- **Loading** — file parsing, matching pass running, or report loading.
- **Empty** — the upload step before a file is chosen.
- **Error** — an unreadable file or a failed import run; what happened and what to do next.
- **upload** — the guided import's first step: Excel/CSV file upload (M01-41).
- **column-mapping-auto-guess** — column mapping with auto-guess; auto-guess must handle headers in any launch language (M01-41; §M01.4 localization notes).
- **preview-three-counts** — the preview states, in plain numbers, "N rows · M match platform products (will become price overrides) · K new products · E rows need attention" (§M01.4 behavior detail).
- **needs-attention-inline-fix** — rows with problems are fixed inline in the preview grid, not bounced to a failed file (M01-41); spec conflicts on platform matches are needs-attention rows — a match creates a price override, never a spec edit (§M01.4 edge cases).
- **importing-async-progress** — the import runs async with visible progress (M01-41).
- **per-row-report-reopenable** — the per-row failure report; kept and re-openable (M01-41, §M01.4 behavior detail).

## Data volume

A supplier/stock price list at spreadsheet scale: the preview grid must work with rows in the hundreds, split across the three counts (platform matches, new products, needs-attention), with inline fixing inside the grid. The PRD fixes no row ceiling — design the preview and report as dense, scrollable working grids, not short summaries (M01 §2 dense-list, desktop-first classification).

## Numbers carrying provenance

Each carries its F8 provenance tier in the design:

- **The preview's three counts plus total** — "N rows · M match platform products (will become price overrides) · K new products · E rows need attention" (§M01.4 behavior detail) — computed by the matching pass.
- **Imported prices per row** — become price overrides on matched platform items or rates on new tenant SKUs; tenant-provided provenance (M01-41; M01-35 enum).
- **Async progress figure** during the run and the **per-row counts in the import report** (rows, matched, created, errors — §M01.4 analytics vocabulary).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted. The import's async server-side run is untouched.*
