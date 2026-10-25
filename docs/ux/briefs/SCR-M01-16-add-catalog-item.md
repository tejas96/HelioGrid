# SCR-M01-16 · Add Catalog Item

Self-serve SKU add via single form or spreadsheet; opens as sheet in-flow from picker and from settings.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner, Operations, Sales Manager, Sales Executive, Design Engineer · **Context of use:** invoked at the point of need — mid-proposal or mid-design when a needed product is missing, on phone or desktop ("inline catalog add works on both surfaces at the point of need", M01 §2), or from Catalog settings at a desk. Permission: inline own-SKU add while building is `F2.M01.add-own-catalog-items` (EPC Owner, Sales Manager, Sales Executive, Design Engineer, Operations — M01 §M01.4 permissions).

## Entry & exit

Reached from: the proposal builder's and studio's component picker, and from Catalog settings (M01-39); it opens as a sheet over the picker (F7's sheets-not-pages contract), pre-scoped to the component kind being picked (§M01.4 behavior detail). Leads to: on save the sheet closes and the new SKU is selected in place — the flow continues; nobody leaves the builder to go to settings (M01-39, §M01.4 behavior detail). The spreadsheet path hands off to the Catalog Import Wizard (SCR-M01-17), one of that wizard's three entry points (M01-41).

**Decisions made in design (2026-09-01) — later screens inherit them.**

1. **One sheet, three ways in.** All three callers — the builder's picker, the studio's picker,
   Catalog settings — open the same editor, pre-scoped to the kind being picked, and the kind stays
   changeable.
2. **The footer verb names what it returns to.** From a picker: **Add and select** — the SKU is
   selected in place and the flow continues. From Catalog settings: **Add to catalog** — landing on
   the Items panel at the caller's row (`SCR-M01-15` decision 6).
3. **The spreadsheet path leaves this sheet**, to `SCR-M01-17`. One accelerator, one form.
4. **No value here carries an F8 tier.** Outside money and energy a number carries none (`F8-01`).
   Values the tenant types carry `M01-35`'s label, shown as **Your own**: nothing computed them.
5. **Abandoning a filled sheet is confirmed and un-dismissible**, and the confirm carries the
   recovery route in words — nothing was created, so there is nothing to restore.
6. **No progress count.** No *fields filled* figure and no *3 of 12* counter — neither is a fact about
   the product, and a progress count on a form invites the Next-disabled pattern `M06-22` killed.
7. **Enter specs manually from a selection opens pre-filled.** From a picker with a component already
   selected, the sheet opens with that item's brand, model and typed specs; the scheme-certification
   flags and the rate fields open blank for the tenant to enter, and a price stays optional
   (`MS4-13`) — a spec-edited variant is not the listed model, so nothing that certifies or prices
   the listed one is copied (`M01-39`; owner ruling 2026-09-07). Saving creates a new own SKU; the platform item is untouched (`M01-34`, `M01-36`).
8. **No preferred control.** The own SKU's `preferred` flag (`M01-38`) has no control on this form.
   A new item is not preferred; it is set later on `SCR-M01-15`.

**Layout, decided in design.**

- The spreadsheet accelerator sits at the top of the sheet, above the form, as one raised tile with
  an iris glyph (blue), with no overline. There is no path chooser: the form is where a single add lands.
- The form is raised cards, each headed by an iris glyph tile and its title: *The item* (the kind's own
  tint and glyph, as on `SCR-M01-15`), *Specification* (with *Your own* as a badge), *Certification* and
  *Price*. The optional values fold behind *Add optional values* while all of them are blank; once any
  holds a figure they show in the card under *Optional* (owner pick "A · Cards", canvas comment).
- The kind field, *What it is*, comes before brand and model; its helper names the caller that set it
  (*Set by the component picker.*). On the phone the sheet's overline names the
  caller, because the sheet covers it.
- One line, centred under the act, states in the fewest words what the act will do. *Cancel* is in the footer; the
  phone sheet has no close button, the 1536 panel has one in its header.
- At 1536 the editor is a 900px side panel, non-modal — no backdrop, no focus trap; focus moves in and
  is restored — with the caller's list live beside it. From Catalog settings it lies over `SCR-M01-15` inside the
  settings side list, and *Publish* is hidden while it is open. The phone sheet is modal. Identity (kind,
  brand, model) is one row of three at 1536; at 375 the kind sits on its own row and brand and model
  share the next; certification and price
  sit side by side at 1536.
- Spec fields have no steppers: their values are transcribed. A price outside its range is refused
  with the limit named, never clamped.
- Certification is one switch row per scheme the market pack declares, and a sentence under them says an
  empty set shows no badges. A scheme the pack collects as a list reference (ALMM) shows its reference
  field once switched on; a flag scheme (DCR) is the switch alone (`IN_CERTIFICATION_SCHEMES`, owner ruling 2026-10-16).
- No SKU-code field and no tax field: the own-item contract holds neither, and an own SKU's tax
  follows the pack's category rate (`M01-37`, owner ruling 2026-10-16).
- The *Your own* label is stated once, as a badge on the *Specification* card, not per field. A pre-filled field states its
  own origin in its helper.
- A frame showing the end of the form is read from its foot: the last field sits on the act.

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-36** (P0) — **Tenants add their own SKUs anytime — self-serve, no approval.** A tenant SKU is a full catalog item (typed specs, rates, per-kind fields) usable everywhere a platform item is; it is theirs alone, invisible to other tenants. Nothing about adding requires the platform's involvement. _(non-UI half, build-side: tenant SKU is full item, private to tenant, no platform approval — for awareness, not for drawing)_
- **M01-39** (P0) — **Inline add everywhere: the moment a needed product is missing, add it there.** From the proposal builder's and studio's component picker — and from Catalog settings — a person with the grant can add a missing product **in-flow**, by either of two paths: (a) a single-product form, (b) **spreadsheet upload** (M01-41) — the spreadsheet path only for a person holding `F2.M01.manage-catalog` outright, because an import writes prices (owner ruling 2026-10-25). The new SKU is immediately picked and the flow continues; nobody leaves the builder to go to settings. **The single-product form is the one authority on how an add opens:** from the catalog it opens empty; from a picker with a component already selected, **Enter specs manually** opens it **pre-filled** with that item's brand, model and typed specs, and saving creates a new own SKU (M01-36) carrying tenant-provided provenance on every field (M01-35), the platform item untouched (M01-34). **Scheme certifications (ALMM/DCR and any other F1-44 scheme flag) and any price are NEVER copied — the tenant enters them afresh:** a spec-edited variant is not the listed model, so a copied certification would be a false claim at M06-23(f) and on the subsidy path, and a tenant rate is M01-44's dated entry, never a platform fact (owner ruling 2026-09-07).

## States

- **Loading** — the typed per-kind form loading.
  The sheet's words, the accelerator, the identity fields and the footer show at once; only the kind's
  spec block is a placeholder, at the shape it will become — the specification card's own grid.
- **Empty** — the fresh single-product form for the pre-scoped component kind, before entry.
  An unfilled form, not an empty-state screen: one line says which fields are required and what the
  rest buy, and each placeholder says what belongs there in the maker's own words.
- **Error** — save fails; what happened and what to do next.
  A failed save is one line centred under the act — nothing was created, nothing was selected, everything
  typed is still here — with the retry; the footer drops its consequence sentence and the form stays
  live.
- **single-form** — path (a): the single-product form with the component kind's typed spec fields (M01-39, M01-36).
  It is the screen's default; `Empty` is the same form before entry.
- **prefilled-from-selection** — path (a) from a picker with a component already selected: the single form opens pre-filled with that item's brand, model and typed specs; the scheme-certification flags and the rate fields are blank for the tenant to enter; save creates a new own SKU and selects it in place, the platform item untouched (M01-39, M01-36, M01-34; owner ruling 2026-09-07).
  A banner titled *Filled in from <item>* (on the board, *Filled in from Vikram Solar Somera 540*), with no body line, heads the form. Each copied field says so in its own helper. The certification flags and the rate fields open blank with the reason under them as content; a blank price is empty, never 0. At 1536 the
  selected platform row stays on the caller's list, marked unchanged.
- **inline-add-without-manage-grant** — an inline add from a picker by someone without `F2.M01.manage-catalog` held outright (a Sales Executive): the form has no price field, and the caller's list shows that person no prices. One line at the act says the item can be picked without a price and someone who manages the catalog prices it later (§M01.4 Permissions; contract `createItem`). The spreadsheet accelerator does not show: the import is catalog administration (`manage_catalog`).
- **saved-and-selected-in-place** — on save the sheet closes and the new SKU is selected in place; the invoking flow continues (M01-39, §M01.4 behavior detail).
  A toast confirms it, with no undo: adding destroys nothing, and archiving reverses it — *Added to
  your catalog*, then *Selected on line 3.* The caller's list is one raised card of rows, each a kind
  tile, the name, the spec line and the price (mono) or *No price set*; the new item is the first row,
  tinted, with a tick, its spec line ending *Your own* (`M01-35`; the picker screens own every row's label), and *Add a missing panel* stays in view under the card (owner pick "L1 · One
  card", canvas comment).

Drawn at 375 only (at 1536 the phone's answer holds at width): `Loading`, `Empty`, `Error`, and the discard confirm (a centred modal at 1536).

## Data volume

One item at a time, with a full typed per-kind spec set (M01-36: typed specs, rates, per-kind fields). Bulk volume belongs to the spreadsheet path, which hands off to the import wizard (SCR-M01-17).

## Numbers carrying provenance

No value carries an F8 tier (decision 4); each carries `M01-35`'s provenance label (`F8-01`):

- **Manually entered spec and rate values** on the single form — tenant-provided provenance (M01-36, M01-35 enum).
- **Pre-filled spec values** from a picker's selected item — tenant-provided provenance once saved as the new SKU's own values (M01-39, M01-35 enum); the **scheme-certification flags and the rate** are never copied from the selected item and open blank (M01-39).

## Redesign owed

- Every frame drops the datasheet path: the datasheet accelerator tile and its reading and refused states, the datasheet-review frames and the extraction-failed frame. The spreadsheet tile is the one accelerator, full width at 1536 and 375.

---


*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline / offline-fail-fast` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*

*Returning from this screen lands on the panel and scroll position the caller was on (`SCR-M01-15` decision 6).*
