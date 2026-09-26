# SCR-M08-06 · Handover Flow

Assemble the pack from verified checklist files, share to the customer, link becomes the pack, project reaches HANDED_OVER, referral ask as last step.

**Module:** M08 · **Personas:** Project Manager · EPC Owner · **Context of use:** the closing act of a project — typically deliberate desk or phone work at the end of delivery; the share needs a connection (it rides the transactional lane, or a manual download-and-send fallback); the referral ask happens in the same sitting, "while the roof is new and the first bill is about to drop".

**One job:** hand the finished project to the customer, in one sitting.
**Order of attention:** 1 can it be handed over — every row past pending, or the pending rows that block it · 2 the pack exactly as it will be shared · 3 sending it · 4 the referral ask.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **One act with four parts (`M08-46`)** — the person presses once, and ONE line at the act says
what it sets in motion.

| Fact | Kind | Its form here |
|---|---|---|
| Rows are still pending (`M08-46`) | status · more detail | the flow opens on it: the title names how many documents are pending, the pending rows are a list, each leading to the checklist (`SCR-M08-03`). No send act is drawn |
| The pack as it will be shared (`M08-32`) | data | every row's files in pack order — the row's pack label (IN: `F1-52`), its files, and its last act, who and when. Every row is past pending; a row still uploaded, not verified, keeps its Uploaded chip, because handover waits on pending rows only. The document count with its provenance label |
| Sending, with a connected channel (`M08-46`) | action · status | the primary act. Its ONE line: the customer's link becomes this pack. The composed message is content. The four parts happen together or not at all. Afterwards the delivery state is a chip, as the channel reports it; a later delivery failure is that chip, with resend, and the project stays handed over |
| Sending, with no channel connected (`M08-46`) | action | two acts — download the pack, copy the message. No delivery state is drawn anywhere on this path |
| The project reaches handed over | status | the stage chip on return to the project. No sentence announces it |
| The referral ask (`M08-47`) | action | the flow's last step: the outcomes as one-tap acts — the customer named someone, or the ask was declined — and a quiet skip, for when no ask was made (the PRD's analytics outcomes: named · declined · skipped). Naming someone reveals two fields, name and phone; the named person becomes a lead with source Referral and the came-from chip (`M02-16`), and a phone that is already a customer's links to that customer, never a second record (`M02-02`) |
| No credit, no balance (`M08-47`) | — | nothing is drawn and nothing is said about rewards |
| The send failed | error | one line at the act — what failed and what to do. Nothing is shown as sent, and the project has not moved |

## Arrangement

- **375.** A full-height sheet that moves through its parts in order — check, pack, send, referral
  (`F7-21`). The pack's file list is the volume region.
- **1536.** A side panel beside the project: the pack list and the message preview side by side, the
  act beneath them, the referral ask taking the panel last.

## Entry & exit

Reached from: the handover action on the Project Detail (SCR-M08-02) — per the PRD, "the handover action lives on the project detail" — which appears only when the project's next stage is Handed over (`SCR-M08-02`'s brief). Leads to: the share itself completes here — with a connected transactional channel the handover message sends from the tenant's own official channel and carries that channel's honest delivery states; with none, the rep downloads the pack and sends the composed message themselves and no delivery is claimed on that path alone (`M08-46`, owner ruling 2026-08-04; `M03-03`); the project reaches `HANDED_OVER`; the customer's link becomes the pack (F5's transition — owned by foundations/F5); the referral ask is the last step of the same flow rather than a separate errand, and any referral it produces is the CRM's referral row (M02's object); then back to the project, which stays readable with everything intact. If any checklist row is pending, the flow is refused with the pending rows named (reading SCR-M08-03's checklist). Other exits: not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### From docs/prd/modules/M08-projects.md

- **M08-46** (P0) — **Handover is one act with four parts: the document pack is assembled from the checklist, shared to the customer, the customer's link becomes the pack, and the project reaches `HANDED_OVER`.** The share rides the transactional lane (owner ruling 2026-08-04): with a connected channel the handover message sends automatically from the tenant's official channel; with none, the rep downloads and sends the composed message manually and no delivery is claimed. The link's transition into its final — now permanent — phase is `foundations/F5`'s (`F5-70`). Handover is refused while any checklist row is pending (`M08-32`).
- **M08-47** (P0) — **The referral is asked for at handover, because that is the moment the customer decides.** *"Ask for the referral here, while the roof is new and the first bill is about to drop — not six months later."* The ask is part of the handover flow and produces the referral link between the referring customer and any lead that comes from it — the tag and the "came from" chip are `M02-16`'s object, and this module is the surface that starts one. **No credit, no redemption, no balance exists** — the credits ledger is the spec-locked exclusion (§5). _(non-UI half, build-side: produces M02-16's referral row on both records; no credit, redemption or balance exists — for awareness, not for drawing)_

- **M08-32** (P0) — **Handover is defined by the checklist: every row past pending, and the pack shared on the customer's link.** That is the definition, and no other surface may redefine it. A project cannot reach `HANDED_OVER` with a pending row.

### From docs/prd/modules/M02-crm-and-leads.md

- **M02-16** (P0) — **Referral is a live v1 source: a referral links the referring customer to the referred lead, and both records say so.** The referred lead carries source = referral with a "came from" chip naming the referrer; the referrer's record shows who they referred. Referrals are visible in win/loss analytics (`modules/M13`). **The credits ledger is a spec-locked exclusion — no monetary credit, no redemption and no balance exists in v1** (§5). The handover-time "ask for a referral" prompt is `modules/M08-projects.md`'s.
- **M02-02** (P0) — **The phone number is the customer's identity.** A customer is unique per tenant on their phone number; the number is captured and stored to the market's phone specification supplied by `pack.formats` (`F1-21`) and carries international-dialling (E.164) semantics so identity survives any market, any formatting habit and any import. Deduplication matches on the customer's number **and on the numbers of that customer's additional contacts** (M02-34). No other field is an identity.

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
- **referral-skipped** — no ask was made (the customer was not there); the outcome is recorded as skipped, and the flow ends.

## Data volume

A complete pack at the market pack's checklist scale — the IN pack's instance is eight rows, every row past pending, a row holding more than one file — so the pack preview must handle a realistic file list in pack order; plus the refusal case with one or more pending rows named.

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier (measured / derived / estimated / assumed) in the design:

- The count of documents in the assembled pack, where shown.
- The pending-row count that drives the refused/allowed condition, where shown (`M08-32`).
- Dates on pack files and the handover record (who-and-when, the handover date) are recorded facts, so they carry no tier (`N7`).

No money figure is part of this flow; handover behaviour is never conditional on payment.
