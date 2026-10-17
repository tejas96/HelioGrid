# SCR-M01-19 · Proposal Template Settings

Document defaults: cover, included sections, default T&C, bank details, and the project-timeline template.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** owner-only settings work, web-emphasis at a desk (M01 §2), fully mobile-capable. Permission: `F2.M01.manage-tenant-settings` (EPC Owner); settings changes are audit events (M01 §M01.6 permissions, F2-22).

## Entry & exit

Reached from: the tenant-config settings surface map — *Proposal templates* is a named surface in M01 §4's stable vocabulary; a deeper entry path is not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. What the screen feeds: the proposal builder consumes these document defaults, including everything Quick mode fills for its hidden steps (M01-51, M01-53 context, M01 §4 contracts); T&C templates support the builder's "save as template" round-trip (§M01.6 behavior detail, M06's step).

Entry and exits, decided: one entry — More · Settings · Proposal template, the back control named *Back to settings*; no entry from the onboarding corridor. Out: back to Settings, plus a row to **Branding** (SCR-M01-18 — the cover's logo, colour and letterhead) and a row to **Business profile** (the bank details, M01-31) — the single write-points this screen shows and never edits. No link to the proposal builder or to Payment terms. Leaving with an unsaved change asks first; leaving unchanged does not.

**Decisions made in design (2026-09-02) — later screens inherit them.**

1. **Bank details are shown as they print and written once elsewhere** (`M01-31`'s single
   write-point). Two editable copies of one account number is how a proposal and an invoice come to
   disagree about where a customer sends money.
2. **`Proposal` is stated as content, not as a greyed field.** The document is named that in every
   locale (`R1` via `F3-11`) — the one fact here a tenant cannot change — and `F7-11` says disabled
   is never the only signal.
3. **A timeline phase's fields live in a sheet, not inline in the row.** A 205px inline field cannot
   hold a sentence a customer reads, and the row already spends its width on three 44px controls.
4. **Terms and conditions cannot be switched off**. Every other section is the tenant's
   choice; this one is a floor, so the row carries **no toggle** and states the floor by name —
   `ComplianceFloor`'s case, where the control is absent rather than disabled. The wording stays
   the tenant's, through the same standard-terms editor — *whether it prints is not a setting*.
5. **The reorder row is floored by its controls, not its text** — three 44px buttons give a 132px
   floor against a 105–122px Devanagari body, so the text has 10–27px of slack before anything
   moves. Measured in both languages: nothing moves.

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-51** (P0) — **Proposal template settings: cover, sections included, default terms & conditions, bank details.** These are the tenant's document defaults, consumed by the proposal builder; the document is named "Proposal" in every locale (R1, consumed via F3-11). Bank details entered here are the business profile's (M01-31) — one write-point.
- **M01-52** (P1) — **Project-timeline template: default phases and descriptions**, editable and reorderable, consumed as the builder's timeline step default.

## States

- **Loading** — current template defaults loading. The form and the document preview arrive together; the preview's placeholder is a sunken shimmer, never a white page.
- **Empty** — a tenant with untouched template settings: working platform defaults are in place from day one and Quick mode is still generable (M01-28, M01-53 context); teaching treatment per F7's empty-state contract. Drawn as inherited, not blank: each part names the platform as its source with *Write our own*, and the teaching is a `Banner` above the form, not an `EmptyState`. While a part is still HelioGrid's (the untouched cover, the standard terms) it shows no language strip: its source line names HelioGrid and the languages, and the strip appears after *Write our own*.
- **Error** — a save fails; what happened and what to do next. The banner sits just above the act bar with no *Try again* — the bar's Save is the retry — and the edit is kept.
- **normal** — cover, included sections, default terms & conditions and bank details editable; bank details are the business profile's single write-point (M01-51, M01-31); template edits version forward simply — last saved wins, audit-logged (§M01.6 behavior detail). At rest there is no act bar: a standing line under the title reads *saved and in force · last changed by <name>, <date>*. The intro says a Quick proposal is exactly what this screen holds, and the page closes, centred, on *Proposals already sent keep the template they were built with.* Sections are an `OptionCardGroup` in its multi-select mode (`D216`) — a title and a description per row, the terms row its floor (decision 4) — in the document's fixed order, with no reorder control (owner ruling 2026-10-16). The default T&C is edited in `RichText`, the builder's own editor.
- **live-preview** — every config screen shows the effect: live preview of the affected customer document before saving (M01-30's law, §M01.6 behavior detail; documents already generated are immutable per F8-15 and never restyle retroactively). Any change raises the act bar — *Discard changes* and Save, with what the save does; its note and its buttons are centred. The preview shows the document only — its cover, sections and terms; the achievements, bank-details and timeline bands wait for `DocumentPreview` to gain them; on the phone it is a window at the page's foot with *Open full size*. Its sample customer and number are called a sample in the page's own text.
- **timeline-phases-reorder** — the project-timeline template's default phases and descriptions being edited and reordered (M01-52). Arrows, never drag; the first row's up arrow stays focusable and says the phase is already first, and each move is announced. No duration column. At least one phase — the route to no timeline is the section's checkbox — and no reset to the platform phases. Deleting a phase asks first in a destructive `Modal` that says *Discard changes* brings it back: the delete lands only on save.

Drawn at 375 only (at 1536 the phone's answer holds at width): `Loading`, `Empty`, `Error`, the delete-a-phase confirm, and the leave-with-an-unsaved-change confirm (owner ruling 2026-10-16).

The page runs in the order the document reads: cover, sections, terms, bank details, timeline, then the preview. At 1536 the settings side list stands at the left and the title carries no breadcrumb; the form is one column of section cards, at most 760 wide, and the preview is its own `--surface` card, 420 px wide, 32 px from it, level with the title, the cover shown whole, standing while the form scrolls (the preview column `SCR-M01-18` uses); phases take the row arrangement; the phase editor and the full-size reader open as non-modal side panels; the act bar belongs to the form column.

**Rulings at the M01 board check (owner, 2026-10-16).**

- **The terms always print, in the builder too.** Decision 4 stands, and `M06-15` drops its *Skip*:
  a proposal's terms are edited, never skipped.
- **One default terms per language, and no template list here.** The contract holds one
  `defaultTerms` per language; a set of named terms templates is not this screen's.
- **At 1536 the way back is the settings side list, its *Proposal template* row current** — the row and the page title both read *Proposal template* (`SCR-SHELL-01`, *More: the settings list*).

## Data volume

One tenant's document-default set: a cover, a list of included sections, one default T&C body, bank details (referenced from the business profile), and a timeline template of a handful of ordered phases with descriptions. Form-scale, with one live document preview.

## Numbers carrying provenance

- **Bank details** rendered here read from the business profile's single write-point (M01-51, M01-31) — identifiers, not computed numbers, so no tier (`F8-01`); a source line names the business profile and the date it was written.
- **Page estimate** under the terms editor — no tier: a count (`F8-01`).
- **The three cover counts** (total capacity installed in kW, happy customers, cities served) — only *Total capacity installed* (kW) carries `estimated · declared by you`: it is a claim about the world, not the company's own decision, so `F8-01`'s own-settings exception does not reach it (owner ruling 2026-10-16). *Happy customers* and *Cities served* are counts and carry no tier (`F8-01`).
- The **live preview** renders a customer document; figures inside it belong to the document's own surfaces and provenance tiers, not new ones minted here (F8-15 immutability per §M01.6 behavior detail).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*
