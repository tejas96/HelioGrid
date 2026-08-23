# SCR-M03-10 · Website Enquiry Form

Customer-facing embeddable capture-only enquiry form: required phone, tenant branding, visitor's language from authored versions, consent statement, no third-party scripts.

**Module:** M03 · Marketing · **Personas:** Customer (a visitor on the tenant's own website — any device, phone likely, no product account, no product context) · **Context of use:** embedded on the tenant's website, carrying the tenant's branding; renders in the visitor's language from the tenant's authored versions.

## Entry & exit

Reached from: the tenant's own website, where the tenant embeds the form; a visitor may also arrive via a campaign-tagged link. Leads to: submission lands as a lead through the same capture path as every other channel — the form itself sends nothing to anyone (`M03-24`; the lead's landing in M02's inbox is build-side). Post-submission presentation to the visitor is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### prd/modules/M03-marketing.md

- **M03-24** (P0) — **The website form is a channel: a tenant-embeddable enquiry form whose submissions land as leads.** This is the channel `D13` deferred and `UXG-03` rendered as a "later" card; under `DD2` it is live here (`M03-01`). The form collects the fields the CRM's capture requires — **the phone field is present and required on every embed** (owner ruling 2026-08-04, Q35; `M02-03`'s phone-as-identity rule) — carries the tenant's branding (`F7-07`), renders in the visitor's language from the tenant's authored versions (`M03-38`), and is **capture-only — it sends nothing**.

## States

- **loading**
- **empty** — the form's initial, unfilled presentation, with the consent statement plainly stating what the person is agreeing to receive.
- **error** — a submission that cannot be delivered over the network; the visitor is not left believing an enquiry was sent when it was not.
- **normal** — the fields the CRM's capture requires, the tenant's branding, the consent statement, in the visitor's language from the tenant's authored versions (`M03-24`).
- **phone-required-validation** — the phone field is present and required on every embed; a submission without it does not pass (`M03-24`, owner ruling Q35).
- **visitor-language-fallback** — the visitor's language has no authored version: the form shows the original language with a small note, never silent machine translation (register `Q10` ruling, M03 §6; the gap is surfaced to the tenant author, not to the visitor as a broken page).

## Data volume

One form, kept deliberately small: the fields the CRM's capture requires, with the phone field always present and required (`M03-24`). Authored language versions at the tenant's language-set scale. The same person may submit repeatedly (the PRD's edge case is three submissions in an hour — M03 §M03.4); the form's own presentation is unchanged by that.

## Numbers carrying provenance

This screen shows no user-visible numbers, money or dates pinned by its PRD row. The consent statement and field labels are content, not figures; the phone field is an input, not a displayed number.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state and a Context-of-use clause stating capture was online-first. Both are deleted.*
