# SCR-M01-16 · Add Catalog Item

Self-serve SKU add via single form, datasheet PDF extraction, or spreadsheet; opens as sheet in-flow from picker and from settings.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner, Operations, Sales Manager, Sales Executive, Design Engineer · **Context of use:** invoked at the point of need — mid-proposal or mid-design when a needed product is missing, on phone or desktop ("inline catalog add works on both surfaces at the point of need", M01 §2), or from Catalog settings at a desk. Permission: inline own-SKU add while building is `F2.M01.add-own-catalog-items` (EPC Owner, Sales Manager, Sales Executive, Design Engineer, Operations — M01 §M01.4 permissions).

## Entry & exit

Reached from: the proposal builder's and studio's component picker, and from Catalog settings (M01-39); it opens as a sheet over the picker (F7's sheets-not-pages contract), pre-scoped to the component kind being picked (§M01.4 behavior detail). Leads to: on save the sheet closes and the new SKU is selected in place — the flow continues; nobody leaves the builder to go to settings (M01-39, §M01.4 behavior detail). The spreadsheet path hands off to the Catalog Import Wizard (SCR-M01-17), one of that wizard's three entry points (M01-41).

## Requirements (verbatim)

### From `prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-36** (P0) — **Tenants add their own SKUs anytime — self-serve, no approval.** A tenant SKU is a full catalog item (typed specs, rates, per-kind fields) usable everywhere a platform item is; it is theirs alone, invisible to other tenants. Nothing about adding requires the platform's involvement. _(non-UI half, build-side: tenant SKU is full item, private to tenant, no platform approval — for awareness, not for drawing)_
- **M01-39** (P0) — **Inline add everywhere: the moment a needed product is missing, add it there.** From the proposal builder's and studio's component picker — and from Catalog settings — a person with the grant can add a missing product **in-flow**, by any of three paths: (a) a single-product form, (b) **datasheet PDF extraction** (M01-40), (c) **spreadsheet upload** (M01-41). The new SKU is immediately picked and the flow continues; nobody leaves the builder to go to settings.
- **M01-40** (P0) — **Datasheet PDF extraction is a first-class add path.** Upload a manufacturer datasheet; the product extracts the typed spec fields for that component kind and presents them **for review and correction before the item is created** — extraction output is never committed silently. The created SKU carries tenant-provided provenance, and the source datasheet stays attached to the item. Extraction failure degrades to the manual form with anything salvaged pre-filled — never a dead end. _(non-UI half, build-side: PDF spec-extraction engine; output never committed without review; failure degrades to prefilled manual form — for awareness, not for drawing)_

## States

- **Loading** — the typed per-kind form loading, or a datasheet upload/extraction in progress.
- **Empty** — the fresh single-product form for the pre-scoped component kind, before entry.
- **Error** — save or upload fails; what happened and what to do next.
- **single-form** — path (a): the single-product form with the component kind's typed spec fields (M01-39, M01-36).
- **pdf-extraction-review** — path (b): extracted fields shown in the same typed form as manual entry, each field editable, with the datasheet preview alongside; nothing commits until the person saves (M01-40, §M01.4 behavior detail).
- **extraction-failed-prefilled-manual** — extraction fails entirely (scan, photo, unusual layout): manual form with whatever was salvaged pre-filled; the datasheet still attaches to the item (M01-40, §M01.4 edge cases).
- **saved-and-selected-in-place** — on save the sheet closes and the new SKU is selected in place; the invoking flow continues (M01-39, §M01.4 behavior detail).

## Data volume

One item at a time, with a full typed per-kind spec set (M01-36: typed specs, rates, per-kind fields). The datasheet-review state carries every extracted field for that component kind alongside the PDF. Bulk volume belongs to the spreadsheet path, which hands off to the import wizard (SCR-M01-17).

## Numbers carrying provenance

Each carries its F8 provenance tier in the design:

- **Extracted spec values** in the review state — presented for review and correction before the item is created; the created SKU carries **tenant-provided** provenance (M01-40, M01-35 enum).
- **Manually entered spec and rate values** on the single form — tenant-provided provenance (M01-36, M01-35 enum).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline / offline-fail-fast` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*
