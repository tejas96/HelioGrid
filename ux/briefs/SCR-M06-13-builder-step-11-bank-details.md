# SCR-M06-13 · Builder Step 11 — Bank Details

Optional bank details plus the closing prompts before Generate.

**Module:** M06 (Proposals — the commercial document: built, priced, versioned, generated, shared) · **Personas:** Sales Executive (primary — builds on both paths), Sales Manager (team-scoped), EPC Owner (full capability; their business-profile bank details are what this step pre-fills), Design Engineer (builds and edits, does not send) · **Context of use:** fully workable at phone width — the PRD's Path B scene is *"the rep is standing in their living room"* — as well as at desk; every field commits on blur.

## Entry & exit

Reached from: the Proposal Builder shell (SCR-M06-02) — any chip jumps here at any time (free navigation, `M06-21`/`M06-22`), footer Next from Step 10, or a Generate-failure tap. This is the last step: the footer button becomes **Generate PDF ⤓** here (`M06-21` per the PRD). In Quick mode this step is hidden and filled from tenant defaults (`M06-18`). Leads to: the closing bottom sheets on this step (Add 3D Design prompt; "Almost done!" bank prompt), then Generate — which runs the one-checklist gate on the builder shell (SCR-M06-02) and, on success, creates the version (preview at SCR-M06-15, detail at SCR-M06-18). The Add 3D Design prompt is the Path B → design doorway; a taken-up design later re-enters as the `M06-47` upgrade offer on Proposal Detail.

## Requirements (verbatim)

### From `prd/modules/M06-proposals.md`

- **M06-17** (P0) — **Step 11 · Bank Details (optional):** Include-in-proposal toggle · Bank name · Account name · Account number · the pack's bank-routing identifier (the source's IFSC field is the IN pack's banking format — `F1-21`) · note when hidden: **"details save but will not print."** Values come from the business profile (`M01-31`/`M01-51`, consumed). Then the closing bottom sheets: **Add 3D Design prompt** (the Path B → design doorway; a taken-up design later re-enters as the `M06-47` upgrade) and the **"Almost done!" bank prompt** — Yes / No → **Add Bank Details** · ⤓ **Generate Proposal**.

## States

- **loading** — the step opening inside the builder shell with business-profile values pre-filled.
- **empty** — no bank details entered: legal (the step is optional); required-field completeness elsewhere still feeds the Generate gate.
- **error** — a failed field commit stated plainly; the draft keeps what was committed on blur.
- **include-toggle-off-note** — the include-in-proposal toggle off, with the note verbatim: "details save but will not print."
- **add-3d-design-prompt** — the closing bottom sheet offering the Path B → design doorway.
- **almost-done-bank-sheet** — the **"Almost done!"** bank prompt — Yes / No → **Add Bank Details** · ⤓ **Generate Proposal**.

## Data volume

A single bank-details form (five fields plus the toggle) and two sequential closing bottom sheets. Design the pack's bank-routing identifier field as pack-driven data (`F1-21`) — no market term hard-coded.

## Numbers carrying provenance

- **Account number** and the **pack's bank-routing identifier** — identifiers, not measured figures; their one honesty obligation is print behaviour: saved but never printed while the include toggle is off, with the note stating exactly that.

No derived/estimated/assumed money or energy figure renders on this step; nothing here carries an estimate-class F8 tier.
