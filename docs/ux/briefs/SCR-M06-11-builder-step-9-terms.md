# SCR-M06-11 · Builder Step 9 — Terms & Conditions

Optional rich-text T&C up to three pages with save-as-template.

**Module:** M06 (Proposals — the commercial document: built, priced, versioned, generated, shared) · **Personas:** Sales Executive (primary — builds on both paths), Sales Manager (team-scoped), EPC Owner (full capability; their T&C template default is what this step pre-fills), Design Engineer (builds and edits, does not send) · **Context of use:** the builder must be fully workable at phone width — the PRD's Path B scene is *"the rep is standing in their living room"* — as well as at desk; every field commits on blur.

## Entry & exit

Reached from: the Proposal Builder shell (SCR-M06-02) — any chip on the chip rail jumps here at any time in any state, or footer Next from Step 8 (free navigation, `M06-21`/`M06-22`; validation only at Generate, `R12`). The Generate failure list can also jump here. Leads to: Step 10 (SCR-M06-12) via Next, or any other step via chip/Back. In Quick mode this step is hidden and filled from the tenant's default T&C (`M06-18`), with the "review the rest" link expanding into the full rail.

## Requirements (verbatim)

### From `docs/prd/modules/M06-proposals.md`

- **M06-15** (P0) — **Step 9 · Terms & Conditions (optional, up to 3 pages):** Add / Skip choice. When added: add-logo toggle · rich-text toolbar + textarea · **"Save as template"** (round-trips into the tenant's template set, `M01-51` consumed) · char count · ≈ PDF page estimate.

## States

- **loading** — the step opening inside the builder shell with the draft's committed values.
- **empty** — no T&C added yet: the Add / Skip choice is the empty state.
- **error** — a failed save-as-template round-trip or a failed field commit, stated plainly; the draft keeps what was committed on blur.
- **add-or-skip-choice** — the step's optional nature made explicit: Add or Skip.
- **added-editing** — T&C added: add-logo toggle, rich-text toolbar + textarea, char count live.
- **save-as-template** — the "Save as template" round-trip into the tenant's template set (`M01-51` consumed).
- **page-estimate** — the ≈ PDF page estimate reflecting the content, up to the 3-page cap.

## Data volume

Design at the row's own cap: a full three pages of rich text in the editor, with the char count and the ≈ PDF page estimate both live at that volume — not a two-line placeholder. Translation expansion applies: the builder is one of F3's five densest checked surfaces (`F3-16`/`F3-18` per the module's localization notes).

## Numbers carrying provenance

This step shows no proposal money, dates or measured figures. The char count and the ≈ PDF page estimate are interface metadata, not proposal figures — they carry no F8 provenance tier. No F8-tiered number renders on this screen.
