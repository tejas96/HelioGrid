# SCR-M01-17 · Catalog Import Wizard

Guided spreadsheet import: upload, column mapping with auto-guess, preview with counts, async import, per-row report; reused at onboarding, settings, picker.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner, Operations · **Context of use:** bulk work at a desk — import wizards are desktop-first per M01 §2's UXG-01 pattern. Permission: catalog administration is `F2.M01.manage-catalog` (EPC Owner + Operations; M01 §M01.4 permissions).

## Entry & exit

Reached from: its three entry points — onboarding, Catalog settings (SCR-M01-15), and the picker's add-flow (M01-41; §M01.4 behavior detail: "Import is one wizard reused at its three entry points"). Leads to: the import runs async with visible progress; the import report is kept and re-openable (M01-41, §M01.4 behavior detail). Return-to-invoking-surface behaviour beyond that is not pinned by PRD — designer decides, note the decision.

Decided: leaving is a dismissal, never a navigation — the head's close and Esc (and *Back* on the first step at 1536) return to the caller with nothing rebuilt. Leaving before the import discards the mapping without a confirm, because nothing has been written to the catalog. The import report outlives the visit: the run continues server-side and the report is kept under *Import a file* → *Kept reports*, so the onboarding entry does not own it. The wizard's notes name that place.

**Decisions made in design (2026-09-01) — later screens inherit them.**

1. **`reachability="entered"`, not the system's free default.** The phone's step list (`StepList`)
   opens only a step already entered, and each step's *Continue* holds the same gate at both widths.
   `Stepper`'s own docs name an import wizard reading a parsed file as the case for opt-in gating: the preview of a file whose columns
   are not mapped is a meaningless step. This is **not** the studio's ruled gate (`M05-05`) and does
   not normalise it.
2. **The counts carry no tier.** Row counts, *N of M*, the run's progress and the report's counts are
   counts and progress, and outside money and energy a number carries none (`F8-01`; owner ruling
   2026-10-17, M01 design).
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

- At 375 the wizard is a sheet over the caller — full height for the four steps with no band of the caller
  showing, sized to its content for the matching wait and the importing run. Its head is a round close,
  the title *Import a price list* with the location line *Step N of 4 · <step>* under it, *Back* at its
  right from step 2, and a thin four-part step bar (owner pick "X1 · Overview, then fix", canvas comment). At 1536 it is a 960px side panel, non-modal — no
  backdrop, no focus trap; focus moves in and is restored — lying over the Catalog page, which stays
  live and keeps its layout (`SCR-M01-15`: the settings side list, no breadcrumb, the release row in
  its head).
- Four steps: File · Columns · Preview · Import report. The run is the passage into the report, not a
  fifth step.
- On the phone the step indicator is that location line, and it opens a step-list sheet that gives
  each step's state in a word and says the report opens once the import has run. At 1536 four numbered
  step bars sit across the top of the panel under the title and *<file> · <N> rows*, and there is no
  step-list sheet. The bars are the location only: decision 1's gating is carried by each step's
  *Continue*.
- Every gated act — each step's *Continue* — says why in its `disabledReason`, which opens in a bubble on a tap, click, focus or hover — no line is drawn under the button (owner ruling 2026-10-17, design-system change 5); the button
  stays focusable. The one line at the act, a consequence read before acting, sits under the act,
  centred, on the phone (one full-width act); at 1536 *Back*, the line and the act share one row. On
  the report there is nothing to go back to, so at 1536 *Close* takes *Back*'s place.

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-41** (P0) — **Spreadsheet (Excel/CSV) import with smart matching is P0, available at onboarding, in settings, and at proposal time.** Guided import: upload → column mapping with auto-guess → preview → import report. **Smart matching:** rows that match platform products become **price overrides** on those items (never duplicate SKUs); unknown rows become **tenant SKUs**; rows with problems are **fixed inline** in the preview, not bounced to a failed file. The import runs async with visible progress and a per-row failure report. _(non-UI half, build-side: smart matching engine: platform matches become price overrides, unknowns become tenant SKUs; async run — for awareness, not for drawing)_

## States

- **Loading** — file parsing, matching pass running, or report loading.
  Two waits look different: the matching pass is a short wait with no cancel — *Back* is the way out —
  not a counted figure — the run carries
  the counted progress — and a re-opened report is the overview's and the lists' own loading form under
  a head and stamp that are already true, its search pinned (decision 24).
- **Empty** — the upload step before a file is chosen.
  The drop surface fills the step, with no template download (owner ruling 2026-10-16). Under it, *Kept reports* lists each kept report by file name and saved date, no counts; a row opens that report (`GET /catalog/imports`). No file chip shows yet; the step's caption keeps the promise that
  nothing changes in the catalog until the import.
- **Error** — an unreadable file; what happened and what to do next.
  It is the `Empty` step plus the file, named, without *Kept reports* — the drop area still fills the rest of the step — and a banner that cannot be dismissed, stating the
  problem and the fix; the file chip shows the problem in place of its counts and carries no tier; the
  step's caption says the catalog is untouched, *Nothing changes in your catalog until you import.*
  (decision 27), and *Continue*'s `disabledReason` is *No readable file*, in its bubble (G9). A run that fails partway is not this state:
  its failed rows are the report's, each with its reason.
- **upload** — the guided import's first step: Excel/CSV file upload (M01-41).
  The chosen file is one file chip — the file, *412 rows · 9 columns* and *Replace* — on a soft blue
  wash. On the phone, once a file is chosen, there is no drop surface — the chip's *Replace* is the
  route. At 1536 the drop surface stays as well.
- **column-mapping-auto-guess** — column mapping with auto-guess; auto-guess must handle headers in any launch language (M01-41; §M01.4 localization notes).
  Each row's visible name is the file's own header, in mono. The columns the guess could not place sit
  above the ones it matched, each a raised row (the header, an arrow, the field), and *Matched
  automatically — check them* is said once for that section. An unmatched column is not an error:
  leaving it out is a legitimate answer. At 1536 every row is on screen, two to a line.
- **preview-three-counts** — the preview states, in plain numbers, "N rows · M match platform products (will become price overrides) · K new products · E rows need attention" (§M01.4 behavior detail).
  The numbers open the step in one overview card (owner picks "X1" and, at 375, "C1 · three rings"): the
  row count as its heading and *N ready*, then at 375 one row of three rings — *Price overrides*, *New
  products*, *Need you*, each ring's arc its share, the count inside — and at 1536 a stacked bar with the
  three counts as buttons. The rings and the count buttons are the filters that scope the list — the
  current scope is tinted, and none is when nothing is scoped; the line
  under them says a match becomes a price override, never a second copy. The rows that need the person
  come first (see needs-attention); the rest fold by outcome, each one raised line with a sample, and open
  to the full list. Each row shows the item, what it matched, its outcome as a word plus a dot (*Price
  override*, *New price on your item*, *New product*), and the price change in mono — the catalog's now,
  then the file's (*No price* where the catalog holds none, a new product included). A row
  that matches one of the company's own SKUs gives that SKU a new dated rate (`own_item_price`) and is
  counted with the matches (owner ruling 2026-10-16). No second confirm on the act: the
  preview is the confirmation, and the footer states the recovery route in words.
- **needs-attention-inline-fix** — rows with problems are fixed inline in the preview grid, not bounced to a failed file (M01-41); spec conflicts on platform matches are needs-attention rows — a match creates a price override, never a spec edit (§M01.4 edge cases).
  The flagged rows gather under *Need you* with *K of 7 fixed*, each a card with an amber edge: the row
  and its match, what is wrong asked as a question, and its fix in place, with *Leave out* as a red
  raised pill. A spec conflict offers two answers — keep the catalog's spec and set only the price, or
  import the row as an own SKU — and no third that edits a platform spec (decision 31). At 1536 every
  flagged row and its fix are on screen at once. A price problem is fixed in its card — a `NumberField`
  labelled *Your price* with *Set price*, never an editable column across every row; a fixed row
  turns green and reads *Price set to ₹104 — ready to import.*, with *Undo*.
- **importing-async-progress** — the import runs async with visible progress (M01-41).
  Its cancel stops watching, never the run: the import continues server-side. It shows no stage line.
- **per-row-report-reopenable** — the per-row failure report; kept and re-openable (M01-41, §M01.4 behavior detail).
  Its act, *Fix the N rows*, re-enters the preview scoped to the rows left open — the report is the
  only surface that knows which they are (decision 32).

Drawn at 375 only (at 1536 the phone's answer holds at width): `Loading`, `Empty`, `Error`, `importing-async-progress`.

## Data volume

A supplier/stock price list at spreadsheet scale: the preview grid must work with rows in the hundreds, split across the three counts (platform matches, new products, needs-attention), with inline fixing in place. The PRD fixes no row ceiling — the preview and report open on the overview and the rows that need the person, and each outcome opens to its full scrollable list (M01 §2 dense-list, desktop-first classification).

## Numbers carrying provenance

- **Imported prices per row** — become price overrides on matched platform items or rates on new tenant SKUs (M01-41). No F8 tier: a price the company sets for itself (`F8-01`, owner ruling 2026-10-16).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted. The import's async server-side run is untouched.*

*Returning from this wizard lands on the panel and scroll position the caller was on (`SCR-M01-15` decision 6).*
