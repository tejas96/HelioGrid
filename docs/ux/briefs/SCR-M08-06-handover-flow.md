# SCR-M08-06 · Handover Flow

Assemble the pack from verified checklist files, share to the customer, link becomes the pack, project reaches HANDED_OVER, referral ask as last step.

**Module:** M08 · **Personas:** Project Manager · EPC Owner · **Context of use:** the closing act of a project — typically deliberate desk or phone work at the end of delivery; the share needs a connection (it rides the transactional lane, or a manual download-and-send fallback); the referral ask happens in the same sitting, "while the roof is new and the first bill is about to drop".

## Entry & exit

Reached from: the handover action on the Project Detail (SCR-M08-02) — per the PRD, "the handover action lives on the project detail". Leads to: the share itself completes here — with a connected transactional channel the handover message sends from the tenant's own official channel and carries that channel's honest delivery states; with none, the rep downloads the pack and sends the composed message themselves and no delivery is claimed on that path alone (`M08-46`, owner ruling 2026-08-04 Q33; `M03-03`); the project reaches `HANDED_OVER`; the customer's link becomes the pack (F5's transition — owned by foundations/F5); the referral ask is the last step of the same flow rather than a separate errand, and any referral it produces is the CRM's referral row (M02's object); then back to the project, which stays readable with everything intact. If any checklist row is pending, the flow is refused with the pending rows named (reading SCR-M08-03's checklist). Other exits: not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### From docs/prd/modules/M08-projects.md

- **M08-46** (P0) — **Handover is one act with four parts: the document pack is assembled from the checklist, shared to the customer, the customer's link becomes the pack, and the project reaches `HANDED_OVER`.** The share rides the transactional lane (owner ruling 2026-08-04, Q33): with a connected channel the handover message sends automatically from the tenant's official channel; with none, the rep downloads and sends the composed message manually and no delivery is claimed. The link's transition into its final — now permanent — phase is `foundations/F5`'s (`F5-70`, Q34). Handover is refused while any checklist row is pending (`M08-32`). _(non-UI half, build-side: link becomes the pack (F5's transition); share rides transactional lane; refused while any checklist row pending — for awareness, not for drawing)_
- **M08-47** (P0) — **The referral is asked for at handover, because that is the moment the customer decides.** *"Ask for the referral here, while the roof is new and the first bill is about to drop — not six months later."* The ask is part of the handover flow and produces the referral link between the referring customer and any lead that comes from it — the tag and the "came from" chip are `M02-16`'s object, and this module is the surface that starts one. **No credit, no redemption, no balance exists** — the credits ledger is the spec-locked exclusion (§5). _(non-UI half, build-side: produces M02-16's referral row on both records; no credit, redemption or balance exists — for awareness, not for drawing)_

## States

Base states (always designed): loading · empty · error.

Screen-specific states from the slice:

- **pack-preview** — the assembled pack: the checklist's verified files, in pack order, shown before anything is shared.
- **pending-rows-refused** — a pending checklist row exists: handover is refused and the pending rows are named.
- **connected-channel-send** — a connected transactional channel exists: the handover message sends automatically from the tenant's official channel with the channel's honest delivery states.
- **manual-download-fallback-no-delivery-state** — no channel connected: the rep downloads and sends the composed message manually, and no delivery state appears anywhere, because the product did not do the sending.
- **referral-ask** — the referral prompt as the last step of the same flow: a one-tap outcome recording that the ask was made.
- **referral-named** — the customer names a referred person there and then; what it produces is the CRM's referral row, on both records.
- **referral-declined** — the ask was made and declined; the outcome is recorded. No credit, redemption or balance exists anywhere.

## Data volume

A complete pack at the market pack's checklist scale — the IN pack's instance is eight rows, every row past pending, a row holding more than one file — so the pack preview must handle a realistic file list in pack order; plus the refusal case with one or more pending rows named.

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier (measured / derived / estimated / assumed) in the design:

- The count of documents in the assembled pack, where shown.
- The verified-row count against the pack's checklist length driving the refused/allowed condition, where shown.
- Dates shown on pack files or the handover record (verification who-and-when, handover date), where shown.

No money figure is part of this flow; handover behaviour is never conditional on payment.
