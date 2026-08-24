# M06 · Proposals — engineering tasks

This file carries every engineering task for bucket **M06 — Proposals**: the one-object rule and
the two entry paths, the eleven-step builder and its Quick mode, free navigation and the Generate
gate, the mandatory-components step and battery, pricing/payable/BOM, versions and numbering and
staleness, duplicate and template consumption, and preview/share/tracking up to the customer-link
boundary. Task ids use the prefix **`T-M06-`**.

**Source docs.** Requirements and acceptance criteria are quoted from
`docs/prd/modules/M06-proposals.md` (rows `M06-01`–`M06-58`). Screen tasks point at their verified
screen briefs under `docs/ux/briefs/`; one screen task exists per SID `SCR-M06-01` … `SCR-M06-20`.
`SCR-M06-20`'s single row is `F5-30`, quoted from `docs/prd/foundations/F5-customer-link.md` (the row
belongs to F5's bucket; the screen is drawn by M06). Two rows in this bucket (`M06-25`, `M06-58`)
have their tenant-facing surface on `SCR-M02-04` (Lead Detail, owned by M02); their build-side
halves are tasks here and the screen work is M02's.

Every row in the bucket is dispositioned exactly once in the **Disposition index** at the end of
this file: to a task, to `LAW`, or to a `realized-by` pointer.

---

## Screen tasks

### T-M06-001 · Proposal Entry — path choice and the Quick-mode toggle
**Type:** screen · **Tier:** P0
**PRD rows:** M06-05 (P0), M06-18 (P0), M06-19 (P0)
**DESIGN:** SCR-M06-01 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M06-01-proposal-entry.md`; they
are the specification.

**DONE WHEN:**
- Given a lead with no design, when a proposal is created, then the same eleven-step builder opens with nothing pre-filled beyond lead/tenant data, and every AI-filled or typed number carries `estimated`/`assumed` — never `derived` (M06-02, M06-03).
- Given a completed design, when Generate proposal is tapped in the studio, then the builder opens on Path A with steps 3/4/5/8 pre-filled `derived` per the pre-fill table (M06-03, M06-05).
- Given Quick mode, when it opens, then exactly steps 1, 3, 8, 10 are presented, 4/5 are AI-filled `estimated`, and 6/7/9/11 carry the tenant defaults (M06-18).
- Given a Quick-mode proposal expanded to the full builder, when the rail renders, then every value from Quick mode is present unchanged and nothing must be re-entered (M06-19).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-002 · Proposal Builder shell — chip rail, footer, failure list, Quick-mode view
**Type:** screen · **Tier:** P0
**PRD rows:** M06-18 (P0), M06-21 (P0), M06-22 (P0), M06-23 (P0), M06-24 (P0)
**DESIGN:** SCR-M06-02 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-02-proposal-builder.md`; they are the specification.

**DONE WHEN:**
- Given any step in any completeness state, when any chip or Back/Next is tapped, then navigation succeeds — no disabled Next exists anywhere in the builder (M06-21, M06-22).
- Given a proposal with multiple failures, when Generate is tapped, then every failure renders as one tappable list ("Fix N issues to share") and each tap lands on the exact step with the failing fields highlighted (M06-22, M06-23).
- Given a proposal on the incentive path with a component failing the pack's required scheme, when Generate runs, then the check fails naming the component line and the scheme, and clearing it (compliant component, or leaving the incentive path) passes (M06-23; `F1-34`).
- Given a 375 px viewport, when the builder renders, then the compressed rail shows `‹ n / 11 · title ›` and tapping it opens the full step sheet (M06-24).
- Given Quick mode, when it opens, then exactly steps 1, 3, 8, 10 are presented, 4/5 are AI-filled `estimated`, and 6/7/9/11 carry the tenant defaults (M06-18).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-003 · Builder Step 1 — Company, and the Proposal Type sheet
**Type:** screen · **Tier:** P0
**PRD rows:** M06-06 (P0), M06-07 (P0)
**DESIGN:** SCR-M06-03 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-03-builder-step-1-company.md`; they are the specification.

**DONE WHEN:**
- Given step 1, when the account-linked phone or email is rendered, then the field is locked in the builder and editable only in tenant settings (M06-07).
- Given the Proposal Type modal, when OPEX/PPA is chosen, then only the rendered document and the projection honesty label differ downstream — builder steps, checks, versioning and share are identical (M06-06).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-004 · Builder Step 2 — Achievements
**Type:** screen · **Tier:** P0
**PRD rows:** M06-08 (P0)
**DESIGN:** SCR-M06-04 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-04-builder-step-2-achievements.md`; they are the specification.

**DONE WHEN:**
- Given step 2 numeric fields, when values are entered, then units are auto-added and non-numeric input is refused (M06-08).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-005 · Builder Step 3 — Solar System Setup, battery card and the live payable
**Type:** screen · **Tier:** P0
**PRD rows:** M06-09 (P0), M06-30 (P0), M06-35 (P0), M06-40 (P0)
**DESIGN:** SCR-M06-05 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-05-builder-step-3-system-setup.md`; they are the specification.

**DONE WHEN:**
- Given step 3, when capacity, type, category, AMC and the money fields are filled, then the client-payable card updates live with every change, and every tax and incentive field carries the pack's scheme labels — no hard-coded market term (M06-09; `F1-13`/`F1-14`).
- Given cost, battery, incentive and discount values, when any changes, then the payable card recomputes live and shows a negative payable the moment it goes ≤ 0 (M06-35).
- Given an OFFGRID system with no battery, when step 3 renders, then the ⚠ "Battery required" notice is visible immediately; when Generate runs, then it blocks with that failure listed (M06-30).
- Given a battery added at step 3, when step 8 renders, then a Battery section exists, the counter's denominator includes it, and the payable includes battery cost (M06-30, M06-27).
- Given the EMI toggle on, when the document renders, then EMI figures carry the projection label with their assumptions (M06-40).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-006 · Builder Step 4 — Performance Metrics
**Type:** screen · **Tier:** P0
**PRD rows:** M06-10 (P0)
**DESIGN:** SCR-M06-06 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-06-builder-step-4-performance.md`; they are the specification.

**DONE WHEN:**
- Given step 4 or 5, when ✦ AI Auto-fill runs, then every filled figure is labelled `estimated`, the chart tabs render, and ↺ restores the AI values after manual edits (M06-10, M06-11).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-007 · Builder Step 5 — Financial Data
**Type:** screen · **Tier:** P0
**PRD rows:** M06-11 (P0)
**DESIGN:** SCR-M06-07 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-07-builder-step-5-financial.md`; they are the specification.

**DONE WHEN:**
- Given step 4 or 5, when ✦ AI Auto-fill runs, then every filled figure is labelled `estimated`, the chart tabs render, and ↺ restores the AI values after manual edits (M06-10, M06-11).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-008 · Builder Step 6 — Project Timeline
**Type:** screen · **Tier:** P0
**PRD rows:** M06-12 (P0)
**DESIGN:** SCR-M06-08 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-08-builder-step-6-timeline.md`; they are the specification.

**DONE WHEN:**
- Given step 6, when phases are reordered, added, deleted or reset, then the tenant's timeline template is the reset target (M06-12; `M01-52`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-009 · Builder Step 7 — Payment Terms
**Type:** screen · **Tier:** P0
**PRD rows:** M06-13 (P0)
**DESIGN:** SCR-M06-09 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-09-builder-step-7-payment-terms.md`; they are the specification.

**DONE WHEN:**
- Given step 7, when tranche percentages do not sum to 100.00, then the gap renders live and Generate lists it with the remainder stated (M06-13).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-010 · Builder Step 8 — Components: the five-category gate, edit sheets and inline add
**Type:** screen · **Tier:** P0
**PRD rows:** M06-14 (P0), M06-27 (P0), M06-28 (P0), M06-29 (P0), M06-30 (P0)
**DESIGN:** SCR-M06-10 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-10-builder-step-8-components.md`; they are the specification.

**DONE WHEN:**
- Given step 8, when it renders, then it is the mandatory-components surface of §M06.5 and its picker is `modules/M05` §M05.6's pattern — no second picker, no restated definition (M06-14; M06-27, M06-28).
- Given a Path B proposal with no components, when step 8 renders, then all five sections show Empty, the counter reads "0/5", and Generate blocks jumping here (M06-27).
- Given a product missing from the resolved catalog mid-pick, when the rep invokes add-in-flow, then single form, datasheet-PDF and spreadsheet-import paths are offered inside the builder, the created SKU is picked in place, and the flow never leaves step 8 (M06-28).
- Given the edit sheet for any type, when it opens, then Brand Name is locked, the type's fields match the census list, and Description caps at 110 characters (M06-29).
- Given a battery added at step 3, when step 8 renders, then a Battery section exists, the counter's denominator includes it, and the payable includes battery cost (M06-30, M06-27).
- Given a duplicated proposal, when step 8 renders, then every component of the source proposal is present and the counter is already satisfied (M06-32; §M06.8).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-011 · Builder Step 9 — Terms & Conditions
**Type:** screen · **Tier:** P0
**PRD rows:** M06-15 (P0)
**DESIGN:** SCR-M06-11 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-11-builder-step-9-terms.md`; they are the specification.

**DONE WHEN:**
- Given step 9 with T&C added, when "Save as template" is used, then the tenant's template set gains it and the page estimate reflects the content (M06-15; `M01-51`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-012 · Builder Step 10 — Client Details
**Type:** screen · **Tier:** P0
**PRD rows:** M06-16 (P0)
**DESIGN:** SCR-M06-12 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-12-builder-step-10-client-details.md`; they are the specification.

**DONE WHEN:**
- Given step 10, when it renders, then the proposal number is present, auto-assigned and disabled — never editable, never client-generated (M06-16, M06-44).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-013 · Builder Step 11 — Bank Details and the closing sheets
**Type:** screen · **Tier:** P0
**PRD rows:** M06-17 (P0)
**DESIGN:** SCR-M06-13 → PENDING

**Requirements (verbatim):** Verbatim rows live in
`docs/ux/briefs/SCR-M06-13-builder-step-11-bank-details.md`; they are the specification.

**DONE WHEN:**
- Given step 11 with the include toggle off, when the document generates, then bank details are saved but do not print, and the note says exactly that (M06-17).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-014 · BOM Detail — Path A line items behind the price
**Type:** screen · **Tier:** P0
**PRD rows:** M06-39 (P0)
**DESIGN:** SCR-M06-14 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M06-14-bom-detail.md`; they are
the specification.

**DONE WHEN:**
- Given the BOM detail on a phone, when it renders, then it is a card list with an edit sheet — never a wide table (M06-39).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-015 · Proposal Preview — the customer-eye rendering before sending
**Type:** screen · **Tier:** P0
**PRD rows:** M06-50 (P0)
**DESIGN:** SCR-M06-15 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M06-15-proposal-preview.md`;
they are the specification.

**DONE WHEN:**
- Given a generated version, when preview renders, then it is pixel-for-content identical to what the customer's rendering will show, in the customer's language (M06-50).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-016 · Proposal Versions — v1 vs v2, what changed and why
**Type:** screen · **Tier:** P0
**PRD rows:** M06-42 (P0)
**DESIGN:** SCR-M06-16 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M06-16-proposal-versions.md`;
they are the specification.

**DONE WHEN:**
- Given a generated version, when any input later changes, then the version's snapshot and money block are byte-identical to generation time and a change note exists (M06-42).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-017 · Proposal Document — the rendered commercial document and its honesty obligations
**Type:** screen · **Tier:** P0
**PRD rows:** M06-04 (P0), M06-51 (P0), M06-56 (P0)
**DESIGN:** SCR-M06-17 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M06-17-proposal-document.md`;
they are the specification. (The same brief also carries `08-customer-surfaces.md` rows `MS9-*`,
which belong to another bucket and are dispositioned there; this task owns the M06 rows only.)

**DONE WHEN:**
- Given a Path B proposal, when its document or customer-facing rendering is produced, then the verbatim indicative line renders on the document in the reading flow at the same visual weight as the figures it qualifies (M06-04; `F8-20`).
- Given any Path B version, when document or link render, then the verbatim indicative line is present in the reading flow; given a remote-survey-based design, then the basis line renders (M06-51).
- Given a design with variants, when the customer-facing rendering is produced, then exactly one recommended system shows by default (M06-56).
- Given the EMI toggle on, when the document renders, then EMI figures carry the projection label with their assumptions (M06-40).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-018 · Proposal Detail — status, tracking, staleness, upgrade offer and the share sheet
**Type:** screen · **Tier:** P0
**PRD rows:** M06-46 (P0), M06-47 (P0), M06-48 (P0), M06-53 (P0), M06-54 (P0), M06-57 (P0), M05-13 (P0) (`docs/prd/modules/M05-design-studio.md` — M05's row, dispositioned in the M05 bucket to T-MS-117 (`docs/tasks/MS-studio-a.md`) and not part of this bucket's disposition index; its **proposal-side half** — the review-needed state read on the proposal and the send block — is realized here, and its verbatim text is carried in the brief)
**DESIGN:** SCR-M06-18 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M06-18-proposal-detail.md`;
they are the specification.

**DONE WHEN:**
- Given a design edit after generation, when the proposal list or detail renders, then the stale state is visible with Regenerate offered; no flag was stored — removing the design edit restores freshness by comparison alone (M06-46).
- Given a completed design on a lead with an indicative proposal, when the upgrade is offered, then the changed figures and their tier changes are shown before commit, and declining changes nothing (M06-47).
- Given an existing proposal, when Duplicate is invoked onto another lead, then every step arrives pre-filled including all components, client details come from the new lead, and a fresh server number is assigned at Generate (M06-48).
- Given the share sheet with a connected transactional channel, when the share sends, then it goes from the tenant's official channel under the transactional template class and the same act marks the version shared; and given no connected channel, then Download PDF + Copy link + composed message are offered, nothing sends, and only the explicit mark-shared act changes status and starts the clock (M06-53, owner ruling 2026-08-04 Q33).
- Given a design carrying the "survey updated — review needed" marker, when a draft proposal built on that design is **opened** — before any share act — then the review-needed state is visible on the proposal detail with the superseding survey version named and the route to the design's review offered as the corrective action; the condition is never communicated only by absence, only by a colour, or only after the rep tries to send (`F8-18`; `M05-13`, owner ruling 2026-08-04 Q24). This is a distinct surface from `M06-46` staleness: `M05-13` applies nothing automatically, so no pinned design value has moved and the fingerprint comparison does not fire — Regenerate is not the remedy, the designer's review is. Brief state: `design-survey-review-needed` (`docs/ux/briefs/SCR-M06-18-proposal-detail.md`).
- Given a design carrying the "survey updated — review needed" marker, when a draft proposal built on that design is sent from the share sheet, then the send is blocked and the stated reason names the superseding survey version — a draft proposal on the design cannot send until the review clears, and a proposal already sent stays pinned and never mutates (`M05-13`, owner ruling 2026-08-04 Q24; the marker and the designer notification are raised on the studio side under `M05-13` in `docs/tasks/MS-studio-a.md`; `F8-15`, `F5-40`). The block lands on both of `M06-53`'s send acts — the connected-channel send and the explicit mark-shared act that starts the clock — and the refusal is never the first place the rep learns of the condition (the pre-send criterion above owns that). Brief state: `send-blocked-survey-superseded`.
- Given a shared proposal, when tracking renders, then states are shared → opened → viewed-for-how-long, delivery states appear only as the connected channel reported them, the fallback path shows no delivered state anywhere, and an open notifies the rep (M06-54).
- Given a client phone that fails the pack's format, when step 10 commits, then the failure is stated at entry; given a connected-channel send that the channel reports failed, then the failure is shown and an alternative channel offered; and given a fallback-path share never opened, then the non-opening is visible, the composed message is re-offered for an alternative channel the rep sends, and no fallback surface claims a delivery state (M06-57, Q33 ruling).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M06-019 · Proposal List — status, staleness and per-row duplicate
**Type:** screen · **Tier:** P0
**PRD rows:** M06-46 (P0), M06-48 (P0), M05-13 (P0) (`docs/prd/modules/M05-design-studio.md` — M05's row, dispositioned in the M05 bucket to T-MS-117 (`docs/tasks/MS-studio-a.md`) and not part of this bucket's disposition index; only the list leg of `F8-18`'s "in the list, on the detail screen" obligation is realized here)
**DESIGN:** SCR-M06-19 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M06-19-proposal-list.md`; they
are the specification.

**DONE WHEN:**
- Given a design edit after generation, when the proposal list or detail renders, then the stale state is visible with Regenerate offered; no flag was stored — removing the design edit restores freshness by comparison alone (M06-46).
- Given an existing proposal, when Duplicate is invoked onto another lead, then every step arrives pre-filled including all components, client details come from the new lead, and a fresh server number is assigned at Generate (M06-48).
- Given a newer proposal on the same lead, when it generates, then the older proposal reads superseded and the link serves the latest (M06-45).
- Given a draft proposal whose design carries the "survey updated — review needed" marker, when the proposal list renders, then the review-needed state is visible on that row before the rep opens or shares anything, distinct from the `M06-46` stale badge — `F8-18` puts the staleness state "on the object itself — in the list, on the detail screen, in the customer-facing rendering", and M05's behavior detail rules `M05-13` one of the three freshness surfaces that "all follow one pattern: the affected number or surface carries the staleness marker" (`M05-13`, owner ruling 2026-08-04 Q24). The customer-facing leg of `F8-18` needs nothing here: a held proposal is a draft with no customer rendering, and a version already shared stays pinned and never mutates (`F8-15`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Counterpart edit required outside this file** (the brief owner makes it; this task cannot close without it): `docs/ux/briefs/SCR-M06-19-proposal-list.md` carries no state for the review-needed condition — its States list has `stale-badge` (the `M06-46` comparison) only, and `M05-13` is not among its verbatim rows. It needs `M05-13` carried verbatim under a `### From docs/prd/modules/M05-design-studio.md` heading and a per-row state — e.g. `design-survey-review-needed` — modelled on the states added to `docs/ux/briefs/SCR-M06-18-proposal-detail.md`. Until then this criterion has a build target and no design, which is exactly the split the detail-side leg was just corrected for.

---

### T-M06-020 · Deal Link Manager — the tenant-side link surface on the deal
**Type:** screen · **Tier:** P0
**PRD rows:** F5-30 (P0) (`docs/prd/foundations/F5-customer-link.md` — F5's row; the screen is drawn by M06 and is not part of this bucket's disposition index)
**DESIGN:** SCR-M06-20 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M06-20-deal-link-manager.md`;
they are the specification.

**DONE WHEN:**
- Given the deal's link manager, when it is opened by an operator, then it shows labels, contacts, open history and link states; and given the customer's page, when it is opened, then it shows none of them (`F5-30`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

## Engine, policy and integration tasks

### T-M06-021 · Path A pre-fill map — what a design fills, and at which provenance tier
**Type:** engine · **Tier:** P0
**PRD rows:** M06-03

**Requirements (verbatim):**

- **M06-03** (P0) — **What a design pre-fills — the pre-fill table, carried faithfully.** Step 3 Solar System Setup: capacity, type, category **derived** (without a design: typed). Step 4 Performance Metrics: generation from the real shading simulation, **derived** (without: AI auto-fill, **estimated**). Step 5 Financial Data: savings/payback from the real BOM pricing, **derived** (without: AI auto-fill, **estimated**). Step 8 Components: the actual BOM, **derived** (without: picked from catalog, **assumed**). Cost: the real bill of materials (without: a typed lump sum). A typed Path B figure carries the conservative tier per F8's recorded reading (`F8-21`, register Q8).

**DONE WHEN:**
- Given a completed design, when Generate proposal is tapped in the studio, then the builder opens on Path A with steps 3/4/5/8 pre-filled `derived` per the pre-fill table (M06-03, M06-05).
- Given a lead with no design, when a proposal is created, then the same eleven-step builder opens with nothing pre-filled beyond lead/tenant data, and every AI-filled or typed number carries `estimated`/`assumed` — never `derived` (M06-02, M06-03).

---

### T-M06-022 · The Generate gate evaluator — one checklist for every speed path
**Type:** engine · **Tier:** P0
**PRD rows:** M06-20, M06-36, M06-37

**Requirements (verbatim):**

- **M06-20** (P0) — **The two speed paths never diverge in validation.** Quick mode and duplicate-an-earlier-proposal are the two speed paths, and they **must not diverge in validation behaviour**: both validate exactly once, at Generate, against exactly the same checklist as the full rail (`M06-23`). Quick mode hides steps; it never skips checks.
- **M06-36** (P0) — **The payable floor is the only hard discount guard.** A discount driving the client-payable figure to **zero or below** in the tenant currency shows the negative and **blocks Generate until corrected** — *"the only hard discount guard."* No approval flow, no request sheet, no queue, no "Pending approval" status, no per-rep ceilings exist anywhere (`D34`, superseding `D19`; revisit-trigger recorded in §5). Whoever can build a proposal can discount and share it immediately.
- **M06-37** (P0) — **Below-cost pricing warns — explicitly, with the loss stated — and never blocks.** When a discount pushes the job below cost (Path A: below the BOM-derived cost; Path B: below the typed cost basis), the product says so **with the loss stated in the tenant currency**, and lets the person proceed: the guard is information, not permission.

**DONE WHEN:**
- Given the same proposal content, when Generate runs from Quick mode, from a duplicate, or from the full rail, then the identical checklist produces the identical pass/fail result (M06-20).
- Given payable ≤ 0, when Generate runs, then it blocks with the negative shown; given payable corrected positive, then the same checklist passes (M06-36).
- Given a discount below cost with payable > 0, when Generate runs, then a warning states the loss in tenant currency and generation proceeds if confirmed (M06-37).
- Given a proposal with multiple failures, when Generate is tapped, then every failure renders as one tappable list ("Fix N issues to share") and each tap lands on the exact step with the failing fields highlighted (M06-22, M06-23).
- Given a proposal on the incentive path with a component failing the pack's required scheme, when Generate runs, then the check fails naming the component line and the scheme, and clearing it (compliant component, or leaving the incentive path) passes (M06-23; `F1-34`).

---

### T-M06-023 · Continuous draft save — commit on blur, resumable from the lead
**Type:** engine · **Tier:** P0
**PRD rows:** M06-25

**Requirements (verbatim):**

- **M06-25** (P0) — **Save continuously, never on Next.** Someone will lose a network mid-build: **every field commits on blur**; a draft always exists from the first commit and is **resumable from the lead**, shown as **"Proposal draft — 7/11"** on the lead surface. This row is the draft-save specification `R14`'s ledger note asked this module to state.

The lead-surface chip ("Proposal draft — n/11") renders on `SCR-M02-04` (Lead Detail), which is
M02's screen; this task owns the commit-on-blur draft behaviour and the resume path behind it.

**DONE WHEN:**
- Given a field edited and blurred, when the app is killed and the lead reopened, then the draft resumes with that value present and the lead shows "Proposal draft — n/11" (M06-25).

---

### T-M06-024 · The proposal money block — scheme-generic computation, pack incentive, one value set
**Type:** engine · **Tier:** P0
**PRD rows:** M06-34, M06-38, M06-41

**Requirements (verbatim):**

- **M06-34** (P0) — **The proposal money block is scheme-generic, currency-stamped, and reconciles to the minor unit.** It carries: currency code (stamped at creation, one currency per tenant — `F1-07` consumed) · system cost excl./incl. tax · per-line tax % · a document-level taxes[] breakdown · battery cost + battery tax % · incentive amount · discount (% ⇄ amount) · payable. **Tax strategy comes from the market pack** (`F1-13`: per-line-rate or document-level); no tax column, label or rate is hard-coded. Sums reconcile to the currency's minor unit (`DOC04.currency-stamp` via `F1-07`).
- **M06-38** (P0) — **The incentive amount is computed from the market pack's incentive model — never manually configured per tenant.** Eligibility (segment, capacity, component-certification requirements, geography) and the computation ship as versioned pack data (`F1-14` consumed; the IN instance is `F1-33`'s slab model). The proposal consumes the computed amount into the payable; where the pack ties the incentive path to a certification scheme, the Generate-time check is `M06-23`(f). A pack revision never changes an existing version's figures (`M06-42`).
- **M06-41** (P0) — **Proposal money is never computed on a device and never renders stale as final.** No device prints a customer-facing price computed locally (`F4-04` consumed); a proposal whose inputs changed renders **stale, visibly, with the corrective action offered** — regenerate as a new version — and *"money must never render as final while stale — this is a hard product rule"* (`F8-12`–`F8-15`, `F8-18` consumed; the version mechanics are §M06.7's).

**DONE WHEN:**
- Given any tenant market, when the money block renders, then tax fields, strategy, incentive naming and currency format come from the pack (`F1-13`/`F1-14`/`F1-21`) and no market term is hard-coded (M06-34).
- Given an incentive-eligible proposal, when the money block computes, then the incentive amount is the pack-computed value — no manual slab entry exists anywhere (M06-38).
- Given a stale proposal, when any money renders, then it is provisional/stale-marked with regenerate offered — never final (M06-41).
- Given cost, battery, incentive and discount values, when any changes, then the payable card recomputes live and shows a negative payable the moment it goes ≤ 0 (M06-35).

---

### T-M06-025 · Version records, server numbering and the status machine
**Type:** engine · **Tier:** P0
**PRD rows:** M06-43, M06-44, M06-45

**Requirements (verbatim):**

- **M06-43** (P0) — **Sent proposals keep their prices forever.** Once shared, a version's figures never move: it keeps the rate versions, catalog release and pack version pinned at generation; a later price-book change, catalog release or pack revision produces **a new version if the tenant wants new numbers — never an edit of the sent one**. The customer's copy and the tenant's copy always agree.
- **M06-44** (P0) — **The proposal number is server-assigned — never client-generated.** Numbers come from server-side tenant counters; two users generating at once can never collide (`S6B.wrong.8`). Step 10 shows the number auto-filled and disabled. The same law governs project numbers (`modules/M08`'s half — cited, not disposed here).
- **M06-45** (P0) — **The proposal status machine: draft → shared → accepted / declined, with superseded when a newer proposal replaces it on the lead.** Statuses move by acts, not edits: sharing is the rep's explicit mark (`M06-53`); accept/decline arrive from the customer link (`foundations/F5`); superseded is set when a newer proposal takes over the lead. **The customer link always shows the latest version** (`S6.wrong.6`; the link mechanics are F5's).

**DONE WHEN:**
- Given a shared version and a subsequent price-book publish, when the version renders anywhere (tenant or customer side), then its figures are unchanged (M06-43).
- Given two simultaneous Generates on one tenant, when both complete, then they hold distinct server-assigned numbers (M06-44).
- Given a newer proposal on the same lead, when it generates, then the older proposal reads superseded and the link serves the latest (M06-45).
- Given step 10, when it renders, then the proposal number is present, auto-assigned and disabled — never editable, never client-generated (M06-16, M06-44).
- Given a generated version, when any input later changes, then the version's snapshot and money block are byte-identical to generation time and a change note exists (M06-42).

---

### T-M06-026 · Component line resolution provenance, frozen with the version
**Type:** engine · **Tier:** P0
**PRD rows:** M06-31

**Requirements (verbatim):**

- **M06-31** (P0) — **Component lines are honest about their resolution and frozen with their version.** Each selected line carries its catalog-resolution provenance (tenant override / tenant item / platform item / custom) and its provenance tier (`F8-02`); component rows are **immutable with their proposal version** — an archived or repriced product never changes an existing version's lines (`M01-42`/`M01-43`, consumed).

**DONE WHEN:**
- Given a component picked from any resolution tier, when the version generates, then the line records its resolution provenance and tier and never changes thereafter (M06-31).

---

### T-M06-027 · Tenant template consumption and the save-as-template round-trip
**Type:** engine · **Tier:** P0
**PRD rows:** M06-49

**Requirements (verbatim):**

- **M06-49** (P0) — **Tenant document defaults feed the builder — asked once, consumed everywhere.** The proposal template (cover, sections included, default T&C, bank details — `M01-51`), the timeline template (`M01-52`), the payment-term templates and tenant default (`M01-54`), the message templates (`M01-55`) and the Quick-mode default set (`M01-53`) are consumed by their steps; this module adds the **"Save as template"** round-trips (T&C at step 9) and never defines a second template surface. Template edits never restyle already-generated versions (`F8-15` via `M01-51`, consumed).

**DONE WHEN:**
- Given untouched tenant settings, when a proposal is built, then platform-seeded defaults carry every templated step and no settings visit is required (M06-49; `M01-28` consumed).
- Given step 9 with T&C added, when "Save as template" is used, then the tenant's template set gains it and the page estimate reflects the content (M06-15; `M01-51`).
- Given step 6, when phases are reordered, added, deleted or reset, then the tenant's timeline template is the reset target (M06-12; `M01-52`).

---

### T-M06-028 · The single entitlement checkpoint at proposal creation
**Type:** policy · **Tier:** P0
**PRD rows:** M06-26

**Requirements (verbatim):**

- **M06-26** (P0) — **The entitlement checkpoint sits at proposal create — nowhere else in this module.** Per-cycle proposal-creation counts are a tier capacity dimension (`BM-12`, consumed); enforcement is at **new proposal creation only**, with the ahead-of-the-block disclosure and grace `modules/M12` owns. **Editing, sharing and duplicating existing proposals — and all reads and exports — never pause**, in any billing state (`BM-32`'s soft-block law, consumed). No Generate check and no builder step is entitlement-gated.

**DONE WHEN:**
- Given a tenant at its proposal-count limit, when they edit, duplicate or share an existing proposal, then nothing pauses; when they create a new one, then the `modules/M12` gate behaviour applies (M06-26).

---

### T-M06-029 · Fact-traceable proposal narrative
**Type:** engine · **Tier:** P0
**PRD rows:** M06-52

**Requirements (verbatim):**

- **M06-52** (P0) — **Proposal narrative is fact-traceable.** Where the document carries generated narrative (the cover story, system description, savings prose), **every narrative claim maps to a facts entry** from the proposal's own field set and computed block — no narrative sentence asserts a number or fact that is not in the version's data.

**DONE WHEN:**
- Given generated narrative, when the document renders, then every narrative claim traces to a field or computed value of the version (M06-52).

---

### T-M06-030 · The automatic follow-up task on mark-shared
**Type:** integration · **Tier:** P0
**PRD rows:** M06-55

**Requirements (verbatim):**

- **M06-55** (P0) — **An automatic follow-up task on send — always.** *"The moment a proposal goes out, the next action must already exist and be owned"*: marking shared auto-creates a follow-up task on the sending rep for **two days later** (`S6.happy`'s "+2 days"), carrying its provenance rule (`DOC04.tasks` cited — `modules/M07`'s surface). A proposal unopened for three days is the voice agent's safety-net trigger (`D17`, `S6.wrong.5` — *"this is exactly what the voice agent picks up"*; `modules/M07` owns the agent).

**DONE WHEN:**
- Given mark-shared, when it commits, then a follow-up task exists for +2 days owned by the sender, carrying its provenance rule (M06-55).

---

### T-M06-031 · Double-proposal collision — both visible, one withdrawn by a person
**Type:** policy · **Tier:** P0
**PRD rows:** M06-58

**Requirements (verbatim):**

- **M06-58** (P0) — **Two proposals on one customer is a visible state that must converge.** When the Stage-2 duplicate check did not catch a double-chase (`M02-08` consumed), the customer record shows **both** proposals and **one must be withdrawn** — the withdrawing rep marks their proposal superseded/declined-by-tenant and the lead follows `modules/M02`'s machine. Nothing auto-withdraws; the record makes the collision impossible to miss.

The customer-record surface that shows both proposals and offers the withdraw action is
`SCR-M02-04` (Lead Detail), which is M02's screen; this task owns the withdraw act, the
superseded/declined-by-tenant transition and the guarantee that nothing auto-withdraws.

**DONE WHEN:**
- Given two proposals on one customer record, when the record renders, then both are visible and each offers the withdraw action (M06-58).
- Given a newer proposal on the same lead, when it generates, then the older proposal reads superseded and the link serves the latest (M06-45).

---

## Laws (enforced through screens and review, no standalone build)

These rows constrain what may be built; none of them is a buildable thing on its own. Each is
enforced by the tasks named against it plus review of every M06 surface.

**M06-01** (P0) — **One object, not two.** No separate "quote" exists anywhere in the product: the **proposal** is built in the eleven steps, contains the pricing, and is what gets versioned, sent and accepted. The **BOM** is a different, internal object — engineering/procurement-facing, produced by the design studio, feeding the proposal's price when a design exists (Path A). **Path B has no BOM at all** — just a system cost typed into step 3. Naming is closed by ruling: the entity and every rendered document say **"Proposal"** in every launch locale; "quote"/"quotation" are banned from identifiers and interface strings, with global search accepting them as query aliases only (`F3-11` consumed; the alias surface is `foundations/F6`'s, the customer-link wording `foundations/F5`'s).

*Enforced by:* every M06 screen task (no second "quote" object or surface may appear), and by
string review of identifiers and interface copy in T-M06-001 … T-M06-020 and T-M06-017's document
rendering. The BOM stays the internal object of T-M06-014; Path B never gains one.
*Acceptance covering it (verbatim):* Given any tenant surface or rendered document in any launch locale, when proposal vocabulary renders, then the single term "Proposal" (per-locale per `F3-11`) is used and no "quote"/"quotation" string appears outside search-query aliasing (M06-01).

**M06-02** (P0) — **Two paths, one builder.** PATH A — WITH DESIGN: survey → studio → BOM → proposal; used when the job is won on engineering credibility, C&I, a complex roof, a customer comparing vendors on technical detail; *"numbers are DERIVED from the model."* PATH B — WITHOUT DESIGN: lead → proposal, straight away; used when the customer wants a number today, small residential, a repeat/standard system, or the rep is standing in their living room; *"numbers are ESTIMATED or ASSUMED."* **Both paths use the same eleven-step builder** — the difference is only how much arrives pre-filled. Provenance tiers are `foundations/F8`'s closed four (`F8-02`); Path B AI fill is `estimated` by definition.

*Enforced by:* T-M06-001 (one entry surface, two paths), T-M06-002 (one builder shell) and
T-M06-021 (the pre-fill map is the only difference between the paths); review rejects any
second builder, second step set or path-specific validation.
*Acceptance covering it (verbatim):* Given a lead with no design, when a proposal is created, then the same eleven-step builder opens with nothing pre-filled beyond lead/tenant data, and every AI-filled or typed number carries `estimated`/`assumed` — never `derived` (M06-02, M06-03).

**M06-32** (P0) — **Component kits were considered and REMOVED — speed comes from duplication, and that decision is carried, not reopened.** The three speeds: **duplicate** (components come with it — the common residential path) · **Path A** (the BOM fills all five) · genuinely new with nothing to duplicate → pick five (*"slower, and rare"*). The lesson is carried verbatim as product law: *"if mandatory components ever start costing minutes rather than seconds, the fix is to make duplicating easier, not to make components optional."*

*Enforced by:* T-M06-010 (no kit concept on the components step), T-M06-018/T-M06-019 (duplicate
is the offered speed path) and review — a kit feature is out of scope and the components gate is
never made optional.
*Acceptance covering it (verbatim):* Given a duplicated proposal, when step 8 renders, then every component of the source proposal is present and the counter is already satisfied (M06-32; §M06.8).

---

## Realized elsewhere

**M06-33** (P2, context) — battery-economics modeling is a recommended enhancement, not v1 scope;
the transactional battery flow (capacity, chemistry, cost, tax, warranty) is what this bucket
builds (T-M06-005, T-M06-010).
*realized-by:* `docs/prd/registers/enhancements.md` (future battery-economics layer riding the F8-23
honesty laws).

---

## Disposition index

| Row | Disposition |
|---|---|
| M06-01 | LAW |
| M06-02 | LAW |
| M06-03 | T-M06-021 |
| M06-04 | T-M06-017 |
| M06-05 | T-M06-001 |
| M06-06 | T-M06-003 |
| M06-07 | T-M06-003 |
| M06-08 | T-M06-004 |
| M06-09 | T-M06-005 |
| M06-10 | T-M06-006 |
| M06-11 | T-M06-007 |
| M06-12 | T-M06-008 |
| M06-13 | T-M06-009 |
| M06-14 | T-M06-010 |
| M06-15 | T-M06-011 |
| M06-16 | T-M06-012 |
| M06-17 | T-M06-013 |
| M06-18 | T-M06-002 |
| M06-19 | T-M06-001 |
| M06-20 | T-M06-022 |
| M06-21 | T-M06-002 |
| M06-22 | T-M06-002 |
| M06-23 | T-M06-002 |
| M06-24 | T-M06-002 |
| M06-25 | T-M06-023 |
| M06-26 | T-M06-028 |
| M06-27 | T-M06-010 |
| M06-28 | T-M06-010 |
| M06-29 | T-M06-010 |
| M06-30 | T-M06-005 |
| M06-31 | T-M06-026 |
| M06-32 | LAW |
| M06-33 | realized-by: docs/prd/registers/enhancements.md |
| M06-34 | T-M06-024 |
| M06-35 | T-M06-005 |
| M06-36 | T-M06-022 |
| M06-37 | T-M06-022 |
| M06-38 | T-M06-024 |
| M06-39 | T-M06-014 |
| M06-40 | T-M06-005 |
| M06-41 | T-M06-024 |
| M06-42 | T-M06-016 |
| M06-43 | T-M06-025 |
| M06-44 | T-M06-025 |
| M06-45 | T-M06-025 |
| M06-46 | T-M06-018 |
| M06-47 | T-M06-018 |
| M06-48 | T-M06-018 |
| M06-49 | T-M06-027 |
| M06-50 | T-M06-015 |
| M06-51 | T-M06-017 |
| M06-52 | T-M06-029 |
| M06-53 | T-M06-018 |
| M06-54 | T-M06-018 |
| M06-55 | T-M06-030 |
| M06-56 | T-M06-017 |
| M06-57 | T-M06-018 |
| M06-58 | T-M06-031 |
