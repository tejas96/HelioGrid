# SCR-M06-15 · Proposal Preview

Exact customer-eye rendering of the generated version before sending.

**Module:** M06 (Proposals — the commercial document: built, priced, versioned, generated, shared) · **Personas:** Sales Executive (primary — previews before sharing), Sales Manager (team-scoped), EPC Owner (full capability), Design Engineer (builds and edits, does not send — preview rides create-edit) · **Context of use:** the moment before sending — desk or phone.

## Entry & exit

Reached from: a successful Generate on the builder (SCR-M06-02/SCR-M06-13) — the PRD's happy path is design approved → proposal pre-filled from the BOM → margin applied → **preview** → Download PDF + Copy link (§M06.1 behavior detail). Leads to: the share sheet and its actions (Download PDF, Copy link, composed message, mark shared — `M06-53`, drawn on SCR-M06-18); back into the builder for changes (a new version through the Generate gate). Download PDF / Copy link / mark shared ride `F2.M06.send-proposals`; preview itself rides `F2.M06.create-edit-proposals`.

## Requirements (verbatim)

### From `docs/prd/modules/M06-proposals.md`

- **M06-50** (P0) — **Preview shows exactly what the customer will see, before sending** — the rendered document and the link rendering, in the customer's language (`F3-06` consumed), honesty labels, disclaimers and all. Preview is a rendering of the generated version, never a recomputation (`F8-24` consumed).

## States

- **loading** — the rendering of the generated version loading.
- **empty** — no generated version exists yet: preview has nothing to render before the first successful Generate (drafts have no version number — the first successful Generate creates v1, per §M06.7 behavior detail).
- **error** — the render failing, stated plainly.
- **customer-language** — the preview renders in the customer's language (`F3-06`), exactly as the customer's rendering will.
- **path-b-indicative** — a Path B version previewed: the verbatim indicative line present in the reading flow, exactly as the document will carry it.

## Data volume

The full rendered document at realistic volume: the complete document structure (cover through drawings, per the document's own spec on SCR-M06-17), a **40-line BOM**, multi-page pagination — pixel-for-content identical to what the customer's rendering will show (the module's acceptance line for `M06-50`).

## Numbers carrying provenance

Preview is a rendering of the generated version, never a recomputation — every figure appears exactly as the document carries it, with every honesty label and disclaimer intact:

- Every proposal figure (capacity, generation, savings, payback, cost, tax, incentive, discount, payable) — each with the provenance tier its version pinned (**derived** on Path A; **estimated/assumed** on Path B).
- The verbatim indicative line on any Path B version; the remote-survey basis line where it applies; projection labels with assumptions on financial figures; energy source labels — all rendered as the document renders them (the full inventory is SCR-M06-17's).

One computed value set feeds preview, document, link and every export — a disagreement between preview and any other rendering is a defect.
