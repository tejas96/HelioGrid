# SCR-M01-18 · Branding Settings

Logo, letterhead, brand colour, company details for customer documents only, with live document preview.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** owner-only settings work, typically at a desk (settings suite is web-emphasis per M01 §2), fully mobile-capable. Permission: `F2.M01.manage-tenant-settings` (EPC Owner); branding changes are audit events (M01 §M01.6 permissions, F2-22).

## Entry & exit

Reached from: the tenant-config settings surface map — *Branding* is a named surface in M01 §4's stable vocabulary; a deeper entry path is not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. What the screen feeds: branding rides proposal PDFs and customer-link pages (M01-50); M06 consumes branding for rendered documents (M01 §4 contracts).

Decided: reached from More · Settings · Branding, and the phone's back control names Settings. It leads back to Settings; the one onward route is the *Business profile* row, where the company details are written. Leaving with an unsaved change is confirmed; leaving with nothing changed is not. This screen owns the brand identity, not the document's structure: `SCR-M01-19` and `SCR-M01-20` preview other bands of the same document through the same frame, and none of the three links to another.

**Decisions made in design (2026-09-02) — later screens inherit them.**

1. **A brand colour is measured, never refused** (`F7-07`, `M01-50`). The field asks **two**
   questions and answers both: can text sit ON the colour, and can the colour BE a word on paper.
   A single "is this accessible?" verdict destroys that distinction.
2. **A colour that fails the text-on-it question gets a darker shade offered**, same hue, and the
   offer is drawn. The band is narrow — about 1% of colours — and it is full of saturated blues,
   teals and greens, so it is exactly where solar brands live.
3. **A rejected logo is `warning`, not `danger`, and the saved mark stays.** Nothing failed; a file
   was declined. A rejection that cleared the field would read as deletion.
4. **The limits are stated before anything is rejected** — format, size and minimum width sit under
   the control, so `logo-invalid-limits-stated` is met by the resting state, not only by the error.
5. **The operator app is never restyled** (`F7-07`). The brand colour appears only inside the two
   framed previews — the proposal cover and the customer-link header.
6. **The letterhead has three fields, in print order:** *Tagline*; *Lines under your address* — one
   line each, up to 6 (`brandingWriteSchema.letterhead.lines`), where the phone, email and website go;
   *Note along the foot of every page*. The cover band prints the profile's GSTIN line, then those lines.
7. **The company details are only what the business profile writes:** legal name, registered address,
   GSTIN. The profile holds no phone, so the page footer prints none; the phone rides the letterhead lines.

**Layout, decided in design.**

- A page inside the shell, not a sheet: Branding is a destination with nothing behind it to keep.
- Reading order: the standing line, logo, colour, letterhead, the company details as they print, then
  both previews. The logo is shown on white, the paper it prints on.
- The brand colour is the design system's `BrandColorField`, mounted, not rebuilt.
- Branding commits once. At rest there is no act bar and no disabled *Save*: a standing line says the
  set is saved and in force, who changed it last and when. The act bar (*Save branding* · *Discard
  changes*, with its consequence above) appears with a change — sticky on the phone, the form column's
  footer at 1536.
- *Proposals you have already sent keep the branding they were made with* (`F8-15`) closes the page,
  and repeats in the act bar's consequence line and in the remove-logo confirm.
- Removing the logo is confirmed, and the confirm gives the recovery route: add a logo again from this
  screen at any time.
- The two framed previews form one preview group. At 375 they stack, and the cover is cut at its
  readable scale, so *Open full size* is on the default screen. At 1536 the form column (500px) and the
  preview column (860px) sit side by side; each preview is scaled whole, never cut, and the preview
  column stays put while the form scrolls. Company details go two-up there.
- *Open full size* is a sheet at 375 and a non-modal side panel at 1536.
- The drop surface is the logo's control when there is none, at both widths. Once a logo exists the
  phone offers *Replace* and no drop surface; at 1536 the drop surface is the replace route, with the
  limits in its hint, and there is no separate *Replace* button.

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-50** (P0) — **Branding settings: logo, letterhead, brand colour, company details — applied to customer documents only.** The tenant's branding rides proposal PDFs and customer-link pages; the operator app is never restyled per tenant (F7-07's law — no tenant CSS, no theme upload, no palette). On palette save, contrast is re-verified computationally; a palette is never rejected — compliant shades are derived and **previewed live** (M01-30's law applied here). _(non-UI half, build-side: computational contrast re-verify on palette save; compliant shades derived, never rejected; operator app never restyled — for awareness, not for drawing)_

### From `docs/prd/foundations/F7-design-language.md`

- **F7-07** (P0) — **Tenant branding applies to customer-facing documents and link pages only; the operator application is never restyled per tenant.** A tenant supplies a logo and a primary brand colour that appear on the generated proposal document and the tokenised customer-link pages. There is no tenant stylesheet, no theme upload and no per-tenant palette anywhere in the web or mobile application. When a tenant saves a palette, contrast is **re-verified computationally and the palette is never rejected**: compliant shades are derived from what the tenant chose and previewed live, so a tenant is never told their brand colour is wrong and never allowed to publish an unreadable document. _(non-UI half, build-side: contrast re-verification engine derives compliant shades; operator app never restyled per tenant — for awareness, not for drawing)_

## States

- **Loading** — current branding values and the preview document loading.
  The form and the preview fill together. A preview placeholder is never a white rectangle — that
  reads as an empty letterhead. The shell is drawn whole.
- **Empty** — a tenant that has never set branding: platform defaults are in place and everything still works (M01-28's zero-config law applies to every setting); teaching treatment per F7's empty-state contract.
  The previews do the teaching: they show what goes out today — on the cover the company name in place of a mark, on the link page the design system's initials badge,
  the platform's near-black, no tagline. No centred empty state.
- **Error** — a save or upload fails; what happened and what to do next.
  A failed save keeps the edit and the act bar; the previews read *not saved yet*, and the standing
  line still names what customers receive. *Retry* sits in the banner, beside its reason.
- **normal** — logo, letterhead and brand colour editable; company details are the business profile's single write-point facts (M01-31 context), so they are shown here as they print — they fill the letterhead's registration line — with one row to *Business profile*, where they are written.
- **live-preview / live-document-preview** — the preview shows the actual proposal cover and customer-link header with the tenant's logo and derived-compliant colours before saving (§M01.6 behavior detail; M01-30's law).
- **palette-derived-compliant-shades / contrast-derived-shade** — a palette that fails contrast is never rejected: compliant shades are derived from what the tenant chose and previewed live, so the tenant sees exactly what customers will (M01-50, F7-07).
  Three varieties: a colour text cannot sit on (the darker shade offered); one that clears the 3:1
  mark floor but cannot be a word (fills and rules, never type); one under the mark floor (fill only).
- **logo-invalid-limits-stated** — a logo too large / wrong format is validated on upload with the actual limits stated (§M01.6 edge cases, the `S6B.wrong.5` pattern). The refusal names the declined file and states the limits; it does not print the file's own size, at either width (owner ruling 2026-10-16).
  At 375 the rejection is a block on the logo card; at 1536 the drop surface carries it, its limits
  hint underneath.

Drawn at 375 only (at 1536 the phone's answer holds at width): `Loading`, `Empty`, `Error`, `palette-derived-compliant-shades / contrast-derived-shade`, the remove-logo confirm, and the leave-with-an-unsaved-change confirm (owner ruling 2026-10-16).

**Rulings at the M01 board check (owner, 2026-10-16).**

- **The company details are `FactRows`**, as they print (`D231`).
- **The act bar and the preview's loading form are the design system's.** The sticky act bar at 375,
  the form-column footer at 1536 and a `PreviewFrame` loading state are design-system changes, never
  this screen's own parts.
- **A colour that cannot be a word on paper is offered its derived ink** (`compliantShades`) in the
  colour field, and the previews use that ink wherever the brand colour would be a word — the field's
  offer no longer waits for a colour no text can sit on (a `BrandColorField` change).
- **The logo has two doors to one value.** It is written here and on the business profile, both
  writing the same `logoFileId` under the same `COMPANY_LOGO_LIMITS` (`M01-50`; `D237`).

## Data volume

One tenant's branding set: a logo, a letterhead, one primary brand colour, and the company-detail facts — plus one live preview rendering of the affected customer document (proposal cover and customer-link header, §M01.6 behavior detail). Small-N form territory; the preview is the heavy element.

## Numbers carrying provenance

None originated by this screen — branding fields are identity facts and assets, not computed numbers. The live document preview renders a customer document; any figures inside that preview belong to the document's own surfaces and carry their own F8 provenance tiers there, not new ones minted here. Documents already generated are immutable per F8-15 and never restyle retroactively (§M01.6 behavior detail).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*
