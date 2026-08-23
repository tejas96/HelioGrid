Five capabilities that block 1's screens need and the system cannot express. All five were
measured against the live project, and re-checked after the last round landed.

**Don't ask me how it should look.** What follows is what the components must be able to do, and
the product law that says so.

## First — four patterns the last round established. Use them; don't reinvent them.

Everything below is new surface area, and the fastest way for a system to fracture is for each
new component to answer a solved question its own way. These four are settled:

1. **A control that needs an edge in field mode reads `--control-edge` inline.** Ghost `Button`,
   `IconButton` and now `Switch`'s track all do this. It costs nothing in the base scope, where
   the token is `none`. Do not widen `field-mode.css`'s `:is(button,[role="button"],[role="tab"])`
   selector — it keys on control semantics on purpose, and a presentational `<span>` is out of its
   reach by design.
2. **A provenance tier goes in the component's own `provenance` slot, via `renderProvenance`.**
   Never in `children`, never in a free-text `meta`. `StatCard`, `NumberField`, `ListRow`,
   `AccordionItem` and `Block` all take one; `readme.md` states the slot rule and its one
   exception. Anything new below that displays a figure takes the same slot.
3. **A tenant colour that will carry words is gated before use.** `CustomerSurface` resolves
   `--tenant-mark` / `--tenant-mark-on` through `bestTextOn(brand).passes` and darkens rather than
   falling back to neutral, so the tenant keeps their hue. `DocumentPreview` does the same for its
   band. Do not apply a raw tenant colour behind text anywhere.
4. **Tenant identity on a customer-facing page is `CustomerSurface` + `TenantHeader`.** The
   document frame is no longer the boundary. This one changes item 4 below — read it there.

## 1 · The sheet-versus-panel switch is the one responsive law left to the caller

`F7-21` (P0) is a behaviour, not a prop list:

> *"**One sheet grammar** serves every editor in the product: a sheet on mobile, a side panel on
> desktop — sheets, not pages."*

An earlier pass cleared this on **prop parity** — `Sheet` and `DetailPanel` have matching props.
Parity is not the law. Nothing performs the switch. `components/overlays` holds `Sheet`,
`DetailPanel`, `Modal`, `Menu`; neither exposes the width it measures nor names a viewport rule.

This matters because **every other responsive law in this system is owned by the component**, and
`readme.md` says so: *"**Own-width, never viewport.** `DataTable` becomes one card per record
below 640px of its own width, `Kanban` stacks below 720px, `SheetActions` stacks below 320px."*
Of `FilterBar`: *"This is expressed once, in the component, rather than left to twenty records
screens to remember."* The sheet/panel switch is the exception, across **at least nineteen
surfaces** — the dedupe sheet, assign picker, disqualify sheet, book-visit sheet, set-blocker
sheet, cancel confirm, waive dialog, reversal confirm, record-payment sheet, typed denial sheet,
the catalog editor and roughly twelve studio inspectors.

**Second half, and it is a genuine contradiction in the system's own docs.** The studio needs a
**non-modal** variant and the docs forbid one. `Sheet.d.ts`: *"Backdrop **blurs the layer
behind** and fades it toward white at 0.35… **Traps focus**"*; `DetailPanel.d.ts`: *"Same backdrop
law as Sheet"*; neither takes a modal, backdrop or no-trap prop. Meanwhile `Slider.d.ts` says of
`onInput`: *"Live signal — fires continuously during a drag. **Wire this to the preview**"* — and
`MS2-31`'s usable-area preview at 60 Hz, `MS3-27`'s *"setback slider 0–3 m with live ring
redraw"*, `MS3-30`'s live clearance hint and `MS6-19`'s live section previews all need the
geometry **behind** the panel to repaint while the panel is open.

**The system tells you to wire the preview and then blurs it.** Resolve that.

## 2 · Filtering is one-of-N, and the first screen that needs it needs six dimensions at once

Cleared twice by earlier passes — on the 44px target law. The filtering itself was never checked.

`M01-38` (P0), the catalog:

> *"One search over the platform slice + own SKUs together, with filters: source (platform /
> own), component kind, **key spec ranges** (e.g. wattage, technology), **certification-scheme
> badges** (per the market's declared schemes), preferred, archived."*

`M07-57` (P0), the call log: *"every call — customer, duration, outcome, language, config version
— filterable"*, where outcome is a ten-value vocabulary and language six, at *"hundreds of calls
per month"*.

Live:

- `FilterChipsProps` is `{options, value?: string, onChange?: (value: string) => void, counts?,
  scroll?}` — **one active value**. `FilterBar.jsx` renders `role="tablist"` with
  `aria-selected`, and its roving-tabindex arrow handler also *changes* the selection. That is a
  one-of-N stage strip, not a filter set. `M01-34`'s multi-scheme certification badges cannot be
  selected as a set.
- `FiltersButtonProps` is `{onClick?, count?, label?}`, documented *"White pill that opens the
  full filter Sheet **on mobile**"*. **The sheet's contents are not a component at all**, and no
  desktop counterpart is named — so the six-dimension set has no desktop home, failing `F7-31`.
- `Slider.d.ts` in full is a single `value` with `onInput`/`onCommit`. **There is no range control
  anywhere in the 54**, so "wattage 300–600 W" has no input.

One filter body must serve the mobile sheet and its desktop counterpart. This vocabulary is
explicitly shared with the `DD12` picker used by the proposal builder and the studio, so whatever
is improvised on the first catalog screen sets the answer for every list screen after it.

## 3 · Nothing can say "this row is broken — fix it here"

`M01-41` (P0), the import preview: *"rows with problems are **fixed inline** in the preview, not
bounced to a failed file"*, with the state `needs-attention-inline-fix` and a summary line
*"N rows · M match platform products · K new products · **E rows need attention**"*, at
*"rows in the hundreds… dense, scrollable working grids."*

Live, the only per-row signal in `DataTableProps` is `isRowMuted?: (row) => boolean` — *"Dim a
row without hiding it"* — and dimming reads as **done-and-inactive**, not as broken. `state` is
whole-table and its error value replaces the table entirely. There is no needs-attention row
state, no per-cell validation message, and no commit path. **A 400-row import with twelve broken
rows has nowhere in the API to say which twelve.**

The same surface carries a second, related need — **a human override of a derived default**:

> `M05-72`: *"**per-field reset (appears next to overridden values; changes appearance when the
> design has moved on)**… A user-entered override takes measured provenance."*
>
> `MS10-13`: a staleness banner *"names the field, the item and both values, with a one-tap 'take
> the new value'"*, against a figure list of *"Stale-field pairs: 'yours X · design now Y' — both
> values shown."*
>
> `M05-65`: *"Edit ratings (with a count of overrides)… Reset to auto (disabled when nothing
> overridden)."*

`NumberFieldProps` and `InputProps` have no overridden flag, no reset affordance and no
second-value slot. `MS10-18` names **eleven editable columns** on a BOM; a 40-line BOM would
improvise the override treatment roughly 440 times.

## 4 · The document preview is one fixed sheet, and three settings screens each need a different part

`DocumentPreview` is a single A4 proposal sheet: `brandColor`, `companyName`, `logoSrc`,
`logoLabel`, `gstin`, `address`, `phone`, `customerName`, `customerMeta`, `docTitle`, `docNumber`,
`docDate`, `lineItems?: [string,string][]`, `total`, `subsidyNote`, `width`.

Its own docstring claims it *"previews all of `M01-50` (logo, **letterhead**, company details and
colour)"* — **and there is no letterhead prop of any kind.** The documentation contradicts the API
on the very screen it was built for.

Three block-1 screens each carry a live-preview state, each needing a different part:

| screen | state | what the preview must show |
|---|---|---|
| `SCR-M01-18` Branding | `live-preview` | the proposal cover **and the customer-link header**, with logo and derived-compliant colours |
| `SCR-M01-19` Proposal Template | `live-preview` | a cover, an **included-sections list**, and a default **T&C body** |
| `SCR-M01-20` Payment Terms | `live-customer-preview` | **the tranches**, as the customer will see them |

There is no sections list, no T&C body and no tranche schedule. `lineItems` is
`[description, amount]` pairs, so two of the three screens would fake their preview with line
items.

**One part of this got easier since I first wrote it, and it sharpens the ask.** The customer-link
header used to be undrawable; `CustomerSurface` + `TenantHeader` now draw it. So the problem is no
longer *"that surface does not exist"* — it is that **`SCR-M01-18`'s preview must show two
different things at once**: the proposal cover (a `DocumentPreview`) *and* the customer-link header
(a `CustomerSurface` subtree), both reacting live to the same colour and logo inputs.

That is the real shape of this item. A preview is not one component rendering one document; it is
**a framed, scaled, non-interactive window onto whatever customer-facing output the setting on
screen affects** — sometimes a document, sometimes a page, sometimes one band of a page.

Decide whether that is one preview component taking a subject, or a preview *frame* that hosts
any of them, and say which and why. Whatever you choose is inherited by every settings screen
that previews customer-facing output, so state the rule rather than solving `M01-18` alone.

Two constraints to carry: the preview is **non-interactive** — nothing inside it is a tab stop,
because it is a picture of an output, not the output; and it must survive 375px, where a scaled A4
sheet and a link-page header both have to remain legible enough to judge a colour by.

## 5 · Rich-text authoring — and one honest limit on scope

`Textarea` is `value · onChange · label · placeholder · rows · maxLength · helper · error · name`.
*"Multi-line field."*

`M06-15` (P0) needs considerably more:

> *"**Step 9 · Terms & Conditions (optional, up to 3 pages):** Add / Skip choice. When added:
> add-logo toggle · **rich-text toolbar + textarea** · **'Save as template'** (round-trips into
> the tenant's template set, `M01-51`) · char count · **≈ PDF page estimate**."*

Four things to carry:

1. **A renderer, not only an editor.** The same content renders read-only inside the document and
   on the customer page, under `M06-51`'s *"one computed value set feeds the document, the link
   and every export"* and `F5-39`'s web-is-the-path-of-record. **Every mark the toolbar produces
   needs a defined read-only rendering.**
2. **An inline logo placement** inside the content — the "add-logo toggle".
3. **A template round-trip** — storable to and reloadable from the tenant's template set
   (`M01-51`), so the content type is shared with `SCR-M01-19`'s authored T&C body rather than
   local to the builder.
4. **Design it at the cap.** The brief's data volume: *"a full **three pages** of rich text in the
   editor… **not a two-line placeholder**."* Translation expansion applies — the builder is one of
   `F3`'s five densest checked surfaces.

**The honest limit.** `M06-15`'s cap is *pages*, and its readout is *"char count · ≈ PDF page
estimate"*. A page estimate can only be computed against the paged document surface, **which this
system does not have yet** — it is a separate gap, scheduled with the print surface in a later
round.

So: **build the editor and its read-only renderer now. Do not fake the page estimate.** Leave the
seam deliberately — a slot, a stated contract, or a documented "supplied by the caller" — and
tell me what shape you left, so the paged surface can fill it rather than fight it. The character
count is real and can ship now; `maxLength`'s hard character stop is not a pagination budget and
should not pretend to be.

## Deliverables for 13B

Same conventions. Plus the standing instruction:

> **Do this before you report an item done — it is the step that has failed every round so far.**
>
> Do not judge for yourself which files teach a behaviour. **Search the whole project for the old
> form** — the literal string, prop name or law sentence you just replaced — and paste the list of
> every file that still contains it. Then fix every one and search again until the list is empty.
>
> Search **all** of it, not just `components/`: `.jsx`, `.d.ts`, `.prompt.md`, every
> `*.card.html`, everything under `templates/`, `readme.md`, `SKILL.md` and `_ds_manifest.json`.
> **Include the unused half of a file** — a `Desktop()` that never renders is still copied by
> whoever opens the file, and that exact case is what broke the last round.
>
> A component whose own example still shows the old form has not landed. If a search comes back
> empty, say so — that is the evidence, not the claim.

Tell me:

- **§1** — where the sheet/panel switch now lives, the measurement it uses, and what a non-modal
  variant does about focus and the backdrop;
- **§2** — how a dimension holds several values, how a range dimension is entered, and how one
  filter body serves both the mobile sheet and desktop;
- **§3** — the row state for needs-attention, the commit path for a cell, and the one override
  treatment (marker, reset, and the superseded value) stated as a rule;
- **§4** — whether this is one preview component or a frame that hosts subjects, stated as a rule
  the other settings screens inherit, and how `SCR-M01-18` shows a document and a page side by
  side;
- **§5** — the mark set the editor produces, its read-only rendering, and the exact shape of the
  seam you left for the page estimate.

If any item is already fixed since my read, say so plainly rather than redoing it.
