# SCR-M06-12 · Builder Step 10 — Client Details

Client identity and the server-assigned proposal number.

**Module:** M06 (Proposals — the commercial document: built, priced, versioned, generated, shared) · **Personas:** Sales Executive (primary — builds on both paths), Sales Manager (team-scoped), EPC Owner (full capability), Design Engineer (builds and edits, does not send) · **Context of use:** fully workable at phone width — the PRD's Path B scene is *"the rep is standing in their living room"* — as well as at desk; every field commits on blur.

## Entry & exit

Reached from: the Proposal Builder shell (SCR-M06-02) — any chip jumps here at any time (free navigation, `M06-21`/`M06-22`), footer Next from Step 9, or a tap on the Generate failure list (a client phone failing the pack's format is listed at Generate and jumps here, `M06-23` per the PRD's edge cases). This step is one of the four Quick mode presents (steps 1, 3, 8, 10 — `M06-18`). Leads to: Step 11 (SCR-M06-13) via Next, or any step via chip/Back.

## Requirements (verbatim)

### From `docs/prd/modules/M06-proposals.md`

- **M06-16** (P0) — **Step 10 · Client Details:** Proposal number \* (**auto, disabled** — server-assigned, `M06-44`) · Prepared by \* · Prepared for \* · Client address \* · Client phone \* (validated against the market pack's phone specification — the source's 10-digit rule is the IN pack's, `F1-49`) · Date \* · Time generated \* · Customer support number.

## States

- **loading** — the step opening inside the builder shell with the draft's committed values (client details arrive from the lead where present).
- **empty** — required fields unfilled: rendered as the chip rail's incomplete-dot completeness metadata, never a blocked Next (`R12` per the module).
- **error** — a failed field commit stated plainly; the draft keeps what was committed on blur.
- **number-auto-disabled** — the proposal number auto-filled and disabled — server-assigned, never editable, never client-generated.
- **phone-format-invalid** — the client phone failing the market pack's phone specification: stated inline at this step and listed at Generate; the proposal can still be navigated and drafted (per the module's edge cases).

## Data volume

A single client record: the eight fields of the row, at realistic content lengths (full postal address, per-pack phone format). Design the fields to survive translation expansion — the builder is one of F3's five densest checked surfaces (`F3-16`/`F3-18`).

## Numbers carrying provenance

- **Proposal number** — server-assigned identifier (auto, disabled); a record fact, never a computed or estimated figure.
- **Date** and **Time generated** — record facts of the proposal, rendered per the pack's formats (`F3-20`/`F3-22` per the module's localization notes).
- **Client phone / Customer support number** — identifiers validated against the pack's phone specification, not measured figures.

No derived/estimated/assumed money or energy figure renders on this step; nothing here carries an estimate-class F8 tier.
