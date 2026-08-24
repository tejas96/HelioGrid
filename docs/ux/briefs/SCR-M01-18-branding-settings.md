# SCR-M01-18 · Branding Settings

Logo, letterhead, brand colour, company details for customer documents only, with live document preview.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** owner-only settings work, typically at a desk (settings suite is web-emphasis per M01 §2), fully mobile-capable. Permission: `F2.M01.manage-tenant-settings` (EPC Owner); branding changes are audit events (M01 §M01.6 permissions, F2-22).

## Entry & exit

Reached from: the tenant-config settings surface map — *Branding* is a named surface in M01 §4's stable vocabulary; a deeper entry path is not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. What the screen feeds: branding rides proposal PDFs and customer-link pages (M01-50); M06 consumes branding for rendered documents (M01 §4 contracts).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-50** (P0) — **Branding settings: logo, letterhead, brand colour, company details — applied to customer documents only.** The tenant's branding rides proposal PDFs and customer-link pages; the operator app is never restyled per tenant (F7-07's law — no tenant CSS, no theme upload, no palette). On palette save, contrast is re-verified computationally; a palette is never rejected — compliant shades are derived and **previewed live** (M01-30's law applied here). _(non-UI half, build-side: computational contrast re-verify on palette save; compliant shades derived, never rejected; operator app never restyled — for awareness, not for drawing)_

### From `docs/prd/foundations/F7-design-language.md`

- **F7-07** (P0) — **Tenant branding applies to customer-facing documents and link pages only; the operator application is never restyled per tenant.** A tenant supplies a logo and a primary brand colour that appear on the generated proposal document and the tokenised customer-link pages. There is no tenant stylesheet, no theme upload and no per-tenant palette anywhere in the web or mobile application. When a tenant saves a palette, contrast is **re-verified computationally and the palette is never rejected**: compliant shades are derived from what the tenant chose and previewed live, so a tenant is never told their brand colour is wrong and never allowed to publish an unreadable document. _(non-UI half, build-side: contrast re-verification engine derives compliant shades; operator app never restyled per tenant — for awareness, not for drawing)_

## States

- **Loading** — current branding values and the preview document loading.
- **Empty** — a tenant that has never set branding: platform defaults are in place and everything still works (M01-28's zero-config law applies to every setting); teaching treatment per F7's empty-state contract.
- **Error** — a save or upload fails; what happened and what to do next.
- **normal** — logo, letterhead, brand colour and company details editable; company details are the business profile's single write-point facts (M01-31 context).
- **live-preview / live-document-preview** — the preview shows the actual proposal cover and customer-link header with the tenant's logo and derived-compliant colours before saving (§M01.6 behavior detail; M01-30's law).
- **palette-derived-compliant-shades / contrast-derived-shade** — a palette that fails contrast is never rejected: compliant shades are derived from what the tenant chose and previewed live, so the tenant sees exactly what customers will (M01-50, F7-07).
- **logo-invalid-limits-stated** — a logo too large / wrong format is validated on upload with the actual limits stated (§M01.6 edge cases, the `S6B.wrong.5` pattern).

## Data volume

One tenant's branding set: a logo, a letterhead, one primary brand colour, and the company-detail facts — plus one live preview rendering of the affected customer document (proposal cover and customer-link header, §M01.6 behavior detail). Small-N form territory; the preview is the heavy element.

## Numbers carrying provenance

None originated by this screen — branding fields are identity facts and assets, not computed numbers. The live document preview renders a customer document; any figures inside that preview belong to the document's own surfaces and carry their own F8 provenance tiers there, not new ones minted here. Documents already generated are immutable per F8-15 and never restyle retroactively (§M01.6 behavior detail).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*
