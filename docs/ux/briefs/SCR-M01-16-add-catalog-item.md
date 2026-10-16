# SCR-M01-16 · Add Catalog Item

Self-serve SKU add via single form, datasheet PDF extraction, or spreadsheet; opens as sheet in-flow from picker and from settings.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner, Operations, Sales Manager, Sales Executive, Design Engineer · **Context of use:** invoked at the point of need — mid-proposal or mid-design when a needed product is missing, on phone or desktop ("inline catalog add works on both surfaces at the point of need", M01 §2), or from Catalog settings at a desk. Permission: inline own-SKU add while building is `F2.M01.add-own-catalog-items` (EPC Owner, Sales Manager, Sales Executive, Design Engineer, Operations — M01 §M01.4 permissions).

## Entry & exit

Reached from: the proposal builder's and studio's component picker, and from Catalog settings (M01-39); it opens as a sheet over the picker (F7's sheets-not-pages contract), pre-scoped to the component kind being picked (§M01.4 behavior detail). Leads to: on save the sheet closes and the new SKU is selected in place — the flow continues; nobody leaves the builder to go to settings (M01-39, §M01.4 behavior detail). The spreadsheet path hands off to the Catalog Import Wizard (SCR-M01-17), one of that wizard's three entry points (M01-41).

**Decisions made in design (2026-09-01) — later screens inherit them.**

1. **One sheet, three ways in.** All three callers — the builder's picker, the studio's picker,
   Catalog settings — open the same editor, pre-scoped to the kind being picked, and the kind stays
   changeable.
2. **The footer verb names what it returns to.** From a picker: **Add and select** — the SKU is
   selected in place and the flow continues. From Catalog settings: **Add to catalogue** — landing on
   the Items panel at the caller's row (`SCR-M01-15` decision 6).
3. **The datasheet path stays inside this sheet** and becomes the review state; only the spreadsheet
   path leaves, to `SCR-M01-17`. Two accelerators, one form.
4. **Extracted values are `estimated`, with the page named** — *read off page 2*. An engine read them
   and `M01-40` forbids committing them silently, so the tier says so until a person confirms. Values
   the tenant types carry `M01-35`'s **Tenant-provided** label, not an F8 tier: nothing computed them.
5. **Abandoning a filled sheet is confirmed and un-dismissible**, and the confirm carries the
   recovery route in words — nothing was created, so there is nothing to restore, and the
   sentence says the datasheet can be uploaded again in one tap.
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

- The two accelerators — the datasheet and the spreadsheet — sit at the top of the sheet, above the
  form. There is no path chooser: the form is where every path lands.
- The datasheet accelerator is the only upload control; the file stays on the item whichever way the
  fields get filled. No second *attach the datasheet* field.
- The kind field's helper names the caller that set it. On the phone the sheet's overline names the
  caller, because the sheet covers it.
- A sentence above the footer buttons states what the act will do. *Cancel* is in the footer; the
  phone sheet has no close button, the 1536 panel has one in its header.
- At 1536 the editor is a 900px side panel, non-modal — no backdrop, no focus trap; focus moves in and
  is restored — with the caller's list live beside it. The phone sheet is modal. Identity (kind,
  brand, model, SKU) is one row of four at 1536 and two rows of two at 375; certification and price
  sit side by side at 1536.
- Spec fields have no steppers: their values are transcribed. A price outside its range is refused
  with the limit named, never clamped.
- Certification is one checkbox per scheme the market pack declares, and a sentence under them says an
  empty set shows no badges. No per-scheme certificate number field.
- The *Tenant-provided* label is stated once per section, not per field. A pre-filled field states its
  own origin in its helper.

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-36** (P0) — **Tenants add their own SKUs anytime — self-serve, no approval.** A tenant SKU is a full catalog item (typed specs, rates, per-kind fields) usable everywhere a platform item is; it is theirs alone, invisible to other tenants. Nothing about adding requires the platform's involvement. _(non-UI half, build-side: tenant SKU is full item, private to tenant, no platform approval — for awareness, not for drawing)_
- **M01-39** (P0) — **Inline add everywhere: the moment a needed product is missing, add it there.** From the proposal builder's and studio's component picker — and from Catalog settings — a person with the grant can add a missing product **in-flow**, by any of three paths: (a) a single-product form, (b) **datasheet PDF extraction** (M01-40), (c) **spreadsheet upload** (M01-41). The new SKU is immediately picked and the flow continues; nobody leaves the builder to go to settings. **The single-product form is the one authority on how an add opens:** from the catalog it opens empty; from a picker with a component already selected, **Enter specs manually** opens it **pre-filled** with that item's brand, model and typed specs, and saving creates a new own SKU (M01-36) carrying tenant-provided provenance on every field (M01-35), the platform item untouched (M01-34). **Scheme certifications (ALMM/DCR and any other F1-44 scheme flag) and any price are NEVER copied — the tenant enters them afresh:** a spec-edited variant is not the listed model, so a copied certification would be a false claim at M06-23(f) and on the subsidy path, and a tenant rate is M01-44's dated entry, never a platform fact (owner ruling 2026-09-07).
- **M01-40** (P0) — **Datasheet PDF extraction is a first-class add path.** Upload a manufacturer datasheet; the product extracts the typed spec fields for that component kind and presents them **for review and correction before the item is created** — extraction output is never committed silently. The created SKU carries tenant-provided provenance, and the source datasheet stays attached to the item. Extraction failure degrades to the manual form with anything salvaged pre-filled — never a dead end. _(non-UI half, build-side: PDF spec-extraction engine; output never committed without review; failure degrades to prefilled manual form — for awareness, not for drawing)_

## States

- **Loading** — the typed per-kind form loading, or a datasheet upload/extraction in progress.
  While the form loads, the sheet's words, both accelerators, the identity fields and the footer show
  at once; only the kind's spec block is a placeholder, at the shape it will become. A datasheet being
  read is narrated: the file by name, the stage in words, an indeterminate rail, and a cancel that
  says what it stops. The form stays live while it reads, and the datasheet fills only fields still
  blank.
- **Empty** — the fresh single-product form for the pre-scoped component kind, before entry.
  An unfilled form, not an empty-state screen: one line says which fields are required and what the
  rest buy, and each placeholder says what belongs there in the datasheet's own words.
- **Error** — save or upload fails; what happened and what to do next.
  A failed save is one line beside the act — nothing was created, nothing was selected, everything
  typed is still here — with the retry; the footer drops its consequence sentence and the form stays
  live. A refused upload turns the datasheet accelerator into the drop surface, states the problem and
  the fix with the real limit, offers another file or the manual form, and says nothing was created or
  attached.
- **single-form** — path (a): the single-product form with the component kind's typed spec fields (M01-39, M01-36).
  It is the screen's default; `Empty` is the same form before entry.
- **prefilled-from-selection** — path (a) from a picker with a component already selected: the single form opens pre-filled with that item's brand, model and typed specs; the scheme-certification flags and the rate fields are blank for the tenant to enter; save creates a new own SKU and selects it in place, the platform item untouched (M01-39, M01-36, M01-34; owner ruling 2026-09-07).
  Each copied field says so in its own helper. The certification flags, the rate fields and *Your SKU
  code* open blank with the reason under them as content; a blank price is empty, never 0. At 1536 the
  selected platform row stays on the caller's list, marked unchanged.
- **pdf-extraction-review** — path (b): extracted fields shown in the same typed form as manual entry, each field editable, with the datasheet preview alongside; nothing commits until the person saves (M01-40, §M01.4 behavior detail).
- **extraction-failed-prefilled-manual** — extraction fails entirely (scan, photo, unusual layout): manual form with whatever was salvaged pre-filled; the datasheet still attaches to the item (M01-40, §M01.4 edge cases).
  Each salvaged value is marked as salvaged, to be checked against the page.
- **inline-add-without-manage-grant** — an inline add from a picker by someone without `F2.M01.manage-catalog` held outright (a Sales Executive): the form has no price and no tax fields, and the caller's list shows that person no prices. One line at the act says the item can be picked without a price and someone who manages the catalog prices it later (§M01.4 Permissions; contract `createItem`).
- **saved-and-selected-in-place** — on save the sheet closes and the new SKU is selected in place; the invoking flow continues (M01-39, §M01.4 behavior detail).
  A toast confirms it, with no undo: adding destroys nothing, and archiving reverses it.

Drawn at 375 only (at 1536 the phone's answer holds at width): `Loading`, `Empty`, `Error`, `extraction-failed-prefilled-manual`, and the discard confirm (a centred modal at 1536).

## Data volume

One item at a time, with a full typed per-kind spec set (M01-36: typed specs, rates, per-kind fields). The datasheet-review state carries every extracted field for that component kind alongside the PDF. Bulk volume belongs to the spreadsheet path, which hands off to the import wizard (SCR-M01-17).

## Numbers carrying provenance

Each carries its F8 provenance tier in the design:

- **Extracted spec values** in the review state — presented for review and correction before the item is created; the created SKU carries **tenant-provided** provenance (M01-40, M01-35 enum).
- **Manually entered spec and rate values** on the single form — tenant-provided provenance (M01-36, M01-35 enum).
- **Pre-filled spec values** from a picker's selected item — tenant-provided provenance once saved as the new SKU's own values (M01-39, M01-35 enum); the **scheme-certification flags and the rate** are never copied from the selected item and open blank (M01-39).

---


*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline / offline-fail-fast` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*

*Returning from this screen lands on the panel and scroll position the caller was on (`SCR-M01-15` decision 6).*
