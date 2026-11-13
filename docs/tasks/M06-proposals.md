# M06 · Proposals — engineering tasks

This file carries every engineering task for bucket **M06 — Proposals**: the one-object rule and
the entry points, the eleven-step builder and its Quick mode, free navigation and the Generate
gate, the mandatory-components step and battery, pricing and the payable, versions, numbering and
the status machine, duplicate and template consumption, and preview, share and tracking up to the
customer-link boundary. Task ids use the prefix **`T-M06-`**.

**Source docs.** Requirements and acceptance criteria are quoted from
`docs/prd/modules/M06-proposals.md` (rows `M06-01`–`M06-58`). One screen task exists per SID `SCR-M06-01` … `SCR-M06-20`.
`SCR-M06-20`'s single row is `F5-30`, quoted from `docs/prd/foundations/F5-customer-link.md` (the row
belongs to F5's bucket; the screen is drawn by M06). The lead-side surfaces of this bucket — the
Create proposal action, the proposals section, the draft chip (`M06-25`) and the two-proposal
withdraw (`M06-58`) — sit on `SCR-M02-04` (Lead Detail, M02's shipped screen); the tasks named
below add them there.

**Proposals ship before the 3D studio (owner ruling 2026-11-13).** Everything that needs a design
— Path A, the BOM detail, variants, design staleness, the upgrade offer — sits in `T-M06-014` and
`T-M06-021`, both parked until the studio's block; every other task proves itself on proposals
built without a design.

**The design (owner approved 2026-11-13).** The builder, the document and the preview are far
simpler and richer than Reslink's: one clear job per step, the customer understands the document in
seconds, nothing prints a placeholder or a figure without its unit, and every warning says what to
do. The look of every screen in this file is the approved proposal design (`CLAUDE.md` §6) — a
working prototype on `packages/ui`, phone and desktop, light and dark — so no further sample is
drawn (`CLAUDE.md` §3: the pick is made). A screen is built to match it at 390 px and 1440 px: the
same parts, order, sizes, spacing, words and motion; a difference is fixed, or named in the plan
with its reason. Each task's **Drawn** line names where the design shows it — a stop of its journey
row, or a name in its *Every small screen and case* index. A part the design uses that
`packages/ui` already holds is reused or extended on its one contract (Law 5, Law 7); a part it adds
is lifted into `packages/ui` once and shared by the builder, the document, the customer link and
Proposal defaults — never a second copy. Hindi and Marathi are catalog words added at build; they
are not drawn.

Every row in the bucket is dispositioned exactly once in the **Disposition index** at the end of
this file: to a task, to `LAW`, or to a `realized-by` pointer.

---

## Screen tasks

### T-M06-001 · Proposal Entry — the four ways in, path choice and the Quick-mode toggle
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-02 (P0), M06-05 (P0), M06-19 (P0)
**DESIGN:** SCR-M06-01
**Drawn:** stops *Lead* (its five states: no proposal, a draft, one proposal, two proposals, lead is lost) and *Start*; sheets *New customer* and *Copy for another lead*.
**Why:** a rep starts a proposal from the lead, from the proposals list with a new customer, or from an old proposal, in seconds — and every proposal still hangs on one lead, so nothing is typed twice.
**Depends on:** T-M06-032

**Requirements (verbatim):** Verbatim rows live in the PRD; they
are the specification.

This task also adds, on `SCR-M02-04` (Lead Detail, `M02-32`), the **Create proposal** action and
the proposals section's real count — the section reads `0` today
(`apps/api/src/modules/crm/crm.lead-detail.repository.ts`).

**DONE WHEN:**
- Given a lead with no design, when a proposal is created, then the same eleven-step builder opens with nothing pre-filled beyond lead/tenant data, and every AI-filled or typed number carries `estimated`/`assumed` — never `derived` (M06-02, M06-03).
- Given the proposals list, when New proposal is tapped, then quick add opens first and the builder opens on the lead it saved, or on the existing lead its duplicate sheet picked; closing quick add creates neither a lead nor a proposal (M06-05).
- Given a Quick-mode proposal expanded to the full builder, when the rail renders, then every value from Quick mode is present unchanged and nothing must be re-entered (M06-19).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- Whether Quick-mode state is persisted on the proposal or purely presentational (M06-18, M06-19) — ruled: one boolean on the proposal, set by the entry toggle and cleared by the expansion act; the hidden-vs-shown step set is never stored (M06-18 fixes the shown steps at 1, 3, 8 and 10 as product law, and M06-19's generated Quick proposal opening in the full builder for its next version is knowable only if the proposal carries the mode).
- The path-choice question while no studio exists (M06-05) — ruled: it is not asked; the entry opens the builder without a design, and the question returns with the studio (owner ruling 2026-11-13: a question with one answer is a wasted tap).
- Who owns a lead made by New proposal (M06-05) — ruled: quick add started from New proposal assigns the lead to the person creating it, in the same transaction, so a Sales Executive (reach: own leads) can open the builder on it (owner ruling 2026-11-13, final review).
- A duplicate number on a lead the person cannot see (M06-05, M02-08) — ruled: the sheet offers only log-enquiry and tell-the-owner, says the proposal is the owner's to make, and creates no proposal (owner ruling 2026-11-13, final review).
- Several drafts per lead (M06-25) — ruled: a lead holds at most one open draft; Create proposal resumes it, and a new proposal starts only from Duplicate or after the draft is generated or discarded (owner ruling 2026-11-13, final review).
- Quick mode's edges (M06-18, M06-19) — ruled: the rep can switch Quick back on before Generate and the hidden steps keep their values; Duplicate copies the flag; the draft chip's n/11 counts every step, hidden ones included, as complete when their default is in place (owner ruling 2026-11-13, final review).
- The entry sheet (M06-05, M06-19) — ruled: two option cards, *Quick · 4 steps* and *Full · 11 steps*, then *or start from* with the person's recent proposals as *Same as {customer}*. Quick is picked first on a residential lead and Full on any other; one tap changes it, and no setting holds that default (owner ruling 2026-11-13, approved design).
- The proposals section on Lead Detail (M06-02, M06-05) — ruled: it draws one of five states — none (the empty scene and *Create proposal*), a draft (the n/11 ring and *Continue*), one proposal (number, version, status), two proposals (the warning and *Withdraw* on each, `T-M06-031`), and a closed lead (*Reopen lead*, no create) (owner ruling 2026-11-13, approved design).
- New proposal on the list (M06-05) — ruled: the sheet *Who is it for?* asks the mobile number first; a number that is already a lead the person reaches shows that lead and *Use {name}*, so no second lead is made; on a phone City and the Home / Business switch each take their own row (owner ruling 2026-11-13, approved design).

---

### T-M06-002 · Proposal Builder shell — chip rail, footer and the Quick-mode view
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-18 (P0), M06-21 (P0), M06-22 (P0), M06-24 (P0)
**DESIGN:** SCR-M06-02
**Drawn:** stop *Build*; sheets *All steps* and *See the customer's page*.
**Why:** the rep can work in any order on a phone in a hurry — no step ever blocks another, and Quick mode shows only the four steps a home job needs.
**Depends on:** T-M06-032

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

**DONE WHEN:**
- Given any step in any completeness state, when any chip or Back/Next is tapped, then navigation succeeds — no disabled Next exists anywhere in the builder (M06-21, M06-22).
- Given a 375 px viewport, when the builder renders, then the compressed rail shows `‹ n / 11 · title ›` and tapping it opens the full step sheet (M06-24).
- Given Quick mode, when it opens, then exactly steps 1, 3, 8, 10 are presented, 4/5 are AI-filled `estimated`, and 6/7/9/11 carry the tenant defaults (M06-18).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- What Quick mode hides at Generate (M06-18) — ruled: Generate's summary lists each company fact that will be left out (bank details, logo, tax registration) and who can add it, so a hidden step never surprises the customer (owner ruling 2026-11-13, final review).
- The longest titles at 375 px (M06-24) — ruled: the compressed rail truncates a long Hindi or Marathi title with an ellipsis and the full-title sheet shows it whole; checked with the longest `mr` title (owner ruling 2026-11-13, final review).
- The builder's frame (M06-21, M06-24) — ruled: a focus screen with no app sidebar and no bottom bar. Phone: close, the `n of 11 · {title}` capsule that opens *All steps*, and the preview eye; one segment under it per step; a floating dock with Back and *Next · {next step}*, which reads *Generate proposal* on the last step. Desktop: close and the draft's save state at the left, the Quick switch and Generate at the right; under them one labelled rail of every step; then the page the customer gets on a stage at the left, and the step's controls in one card at the right with Back, the payable and Next in its foot (owner ruling 2026-11-13, approved design).
- A step's standing (M06-21, M06-22) — ruled: done, default (filled from the company's defaults) or to do, each a mark and a word on the rail and in *All steps*, never colour alone; a to-do step tints its segment on the phone (owner ruling 2026-11-13, approved design).
- What a step shows first (M06-24) — ruled: on a phone, steps 3, 4, 5 and 7 open with one solar-glass hero holding the block the customer will read, and step 1 with a peek of the cover; steps 2, 6, 9 and 10 draw no second preview, because the control is the thing printed; on desktop the stage shows the document page instead (owner ruling 2026-11-13, approved design).

---

### T-M06-003 · Builder Step 1 — Company, and the Proposal Type sheet
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-06 (P0), M06-07 (P0)
**DESIGN:** SCR-M06-03
**Drawn:** *Build* → step 1.
**Why:** the company's identity is asked once at signup and never again; the rep only confirms it.
**Depends on:** T-M06-032

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

The business profile and its logo validation shipped with `T-M01-005`; this step reads them
through the resolved settings (`packages/domain/src/commerce/effective-settings.ts`) and never
re-implements the validation.

**DONE WHEN:**
- Given step 1, when the account-linked phone or email is rendered, then the field is locked in the builder and editable only in tenant settings (M06-07).
- Given the Proposal Type modal, when OPEX/PPA is chosen, then only the rendered document and the projection honesty label differ downstream — builder steps, checks, versioning and share are identical (M06-06).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- Proposal type (M06-06) — ruled: two option cards on step 1 itself, *{customer} owns the system* and *{customer} pays for power*, in place of a sheet after the step (two answers need no extra screen); nothing else about the type changes (owner ruling 2026-11-13, approved design).
- Cover picture (M06-07) — ruled: step 1 shows the company's cover pictures as a strip; the proposal starts on the company's default (`T-M01-030`), the person may pick another for this proposal, and the choice is frozen with the version (owner ruling 2026-11-13, approved design).
- Company facts (M06-07) — ruled: read-only rows with a lock and one line naming who can change them; no field for them is drawn in the builder (owner ruling 2026-11-13, approved design).

---

### T-M06-004 · Builder Step 2 — Achievements
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-08 (P0)
**DESIGN:** SCR-M06-04
**Drawn:** *Build* → step 2.
**Why:** the company's track record sells the job; it is typed once as numbers and reused on every proposal.
**Depends on:** T-M06-032

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

**DONE WHEN:**
- Given step 2 numeric fields, when values are entered, then units are auto-added and non-numeric input is refused (M06-08).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- A rep's edit of the achievements (M06-08) — ruled: it stays on this proposal; only a holder of `F2.M01.manage-tenant-settings` saves it to the company's cover, as with the terms (owner ruling 2026-11-13, final review).
- The inputs (M06-08) — ruled: the three figures the customer reads are the fields — tap a figure to change it; no second form is drawn under them (owner ruling 2026-11-13, approved design).

---

### T-M06-005 · Builder Step 3 — Solar System Setup, site supply, our cost, battery and the live payable
**Type:** screen · **Tier:** P0
**Status:** planned
**Owed by `T-FPLAT-029` (`F8-23`):** the EMI tenure is the projection's `horizonYears`, and this step refuses a tenure that is zero, negative or not a number where it is typed — `@heliogrid/domain` carries the horizon as stated and does not bound it.
**PRD rows:** M06-09 (P0), M06-30 (P0), M06-35 (P0), M06-37 (P0), M06-38 (P0), M06-40 (P0)
**DESIGN:** SCR-M06-05
**Drawn:** *Build* → step 3; cases *No GST number* and *Off-grid, no battery*.
**Why:** the price the customer will see is built here, live, in the tenant's currency — the full amount the company collects, the subsidy shown beside it, the margin visible only to the owner.
**Depends on:** T-M06-032, T-M06-024

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

The payable equation is `resolvePayable` / `payableStandsUp` in
`packages/domain/src/money/equation.ts` (server entry); `MoneySummary`, `DataTable.totalRow` and
`DocumentPreview` print what the server returned.

**DONE WHEN:**
- Given step 3, when capacity, type, category, AMC and the money fields are filled, then the client-payable card updates live with every change, and every tax and incentive field carries the pack's scheme labels — no hard-coded market term (M06-09; `F1-13`/`F1-14`).
- Given cost, battery, incentive and discount values, when any changes, then the payable card recomputes live and shows a negative payable the moment it goes ≤ 0 (M06-35).
- Given a lead that holds a sanctioned load and supply phase, when step 3 renders, then both are shown from the lead; and given one typed at step 3, when it commits, then the lead holds it (M06-09).
- Given a person without `F2.M01.manage-catalog`, when step 3 or any proposal surface renders, then our cost is absent; and given any document or customer link, when it renders, then our cost never appears (M06-09).
- Given our cost filled on a Path B proposal, when an EPC Owner opens step 3, then the card shows the margin; and given a Sales Executive, when they open it, then no margin or cost shows (M06-37).
- Given an OFFGRID system with no battery, when step 3 renders, then the ⚠ "Battery required" notice is visible immediately; when Generate runs, then it blocks with that failure listed (M06-30).
- Given a battery added at step 3, when step 8 renders, then a Battery section exists, the counter's denominator includes it, and the payable includes battery cost (M06-30, M06-27).
- Given the EMI toggle on, when the document renders, then EMI figures carry the projection label with their assumptions (M06-40).
- Given a proposal opened from a lead, when Step 3 renders, then the Category is the lead's segment and the bill is the lead's monthly bill, each pre-filled and never asked again (M02-05, OV-04) (moved from the block 3 CRM plan, owner yes 2026-11-09).
- Given a residential on-grid proposal with incentive claimed switched off, when the money block computes, then the incentive is zero and Generate runs no certification check; and given an off-grid proposal, then the incentive is not offered (M06-38).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- Which range bounds the stored capacity field (M06-09) — ruled: the column takes any positive capacity and step 3's typed entry validates 0.5–7000 kW as M06-09 states; a value a later design derives is stored exactly as derived (a column bound would silently normalise it).
- Where the lead's monthly bill lands (M02-05) — ruled: it is step 5's savings input, carried from the lead, not a step 3 field (step 3 names no bill field; the bill feeds savings, not the system).
- The EMI tenure (M06-40) — ruled: one tenure field beside the EMI rate, years, defaulting to the market pack's typical term (an EMI is not computable without a term; `T-FPLAT-029` already reads it as `horizonYears`).
- Sanctioned load and supply phase on the lead (M06-09) — ruled: two nullable lead columns added by `T-M06-032`'s migration, read and written through the lead's contract (old app versions never send them, so null is their only old shape).
- The margin's basis (M06-37) — ruled: margin = the pre-tax amount the customer pays − our cost, and our cost covers everything the payable covers, battery included; tax never counts as margin (owner ruling 2026-11-13, final review).
- A slow network (M06-35, `F8-12`) — ruled: while the server recomputes, the payable card shows that it is updating and never shows the old payable beside new inputs as current (owner ruling 2026-11-13, final review).
- The incentive claimed switch (M06-38) — ruled: it sits beside the incentive amount, on by default only when the pack offers the incentive for the segment and the system type; off-grid is not offered in IN (owner ruling 2026-11-13, final review).
- The step's parts (M06-09, M06-35) — ruled: the payable as the hero, with its tax line, the incentive and the net cost as two tiles, and the margin row for holders of `F2.M01.manage-catalog`; then the size as − and + in 0.5 kW steps with 2, 3, 5 and 10 kW chips and a typed value; the system type as a three-way switch; the price as one large field marked as including tax; then rows that open in place — Discount, the incentive switch, Site supply, Yearly maintenance, EMI example, Our cost (owner ruling 2026-11-13, approved design).
- The price per kW (M06-09) — ruled: the payable ÷ the capacity, shown to the person building as a check on a typed price, never printed and never stored; the price itself stays typed, and no company rate per kW exists in V1 (owner ruling 2026-11-13).
- The line under the size (M06-09) — ruled: it reads the picked panel's count and watt-peak once step 8 holds a panel, and is absent before; the design's roof-area figure is not built, because no fact stands behind it.

---

### T-M06-006 · Builder Step 4 — Performance Metrics
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-10 (P0)
**DESIGN:** SCR-M06-06
**Drawn:** *Build* → step 4; cases *PVGIS is down* and *Size changed*.
**Why:** the customer sees a believable month-by-month generation for their own district, honestly labelled as an estimate, without the rep doing any maths.
**Depends on:** T-M06-033

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

**DONE WHEN:**
- Given step 4 or 5, when ✦ AI Auto-fill runs, then every filled figure is labelled `estimated`, the chart tabs render, and ↺ restores the AI values after manual edits (M06-10, M06-11).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- Auto-fill (M06-10) — ruled: it runs by itself when the step first opens with a location and a capacity, and a *Filled for you* line names the source and offers Reset; a press is needed only to restore the values after an edit (owner ruling 2026-11-13, approved design).
- The step's parts (M06-10) — ruled: the yearly figure, its source line and the twelve-month bars with the best month marked as the hero; then the efficiency field and one folded row for the month figures (owner ruling 2026-11-13, approved design).

---

### T-M06-007 · Builder Step 5 — Financial Data
**Type:** screen · **Tier:** P0
**Status:** planned
**Owed by `T-FPLAT-029` (`F8-23`):** the lifetime horizon is the projection's `horizonYears`, and this step refuses a horizon that is zero, negative or not a number where it is typed — `@heliogrid/domain` carries the horizon as stated and does not bound it.
**PRD rows:** M06-11 (P0)
**DESIGN:** SCR-M06-07
**Drawn:** *Build* → step 5.
**Why:** savings and payback are what the homeowner decides on; they come filled from the energy estimate and the net cost after subsidy.
**Depends on:** T-M06-033

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

**DONE WHEN:**
- Given an IN proposal of ₹1,75,000 cost, ₹15,575 tax, a ₹78,000 incentive and no discount, when the card, the document and the tranche schedule render, then the payable is ₹1,90,575, the tranches sum to ₹1,90,575, and the incentive and a net cost after incentive of ₹1,12,575 show beside it as information (M06-35).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- The step's parts (M06-11) — ruled: the monthly saving as the hero, the bill today beside the bill with solar as two bars, the savings line with the net-cost line and the mark where they cross, three figures (payback, lifetime saving, yearly saving) and the projection line; then the monthly bill, the tariff and one folded row for the assumptions (owner ruling 2026-11-13, approved design).

---

### T-M06-008 · Builder Step 6 — Project Timeline
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-12 (P0)
**DESIGN:** SCR-M06-08
**Drawn:** *Build* → step 6; sheet *Edit a timeline step*.
**Why:** the customer knows what happens and when; the company's own timeline fills it, or HelioGrid's default when none is set.
**Depends on:** T-M06-032

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

**DONE WHEN:**
- Given step 6, when phases are reordered, added, deleted or reset, then the tenant's timeline template is the reset target (M06-12; `M01-52`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- The controls (M06-12) — ruled: each phase a row with move up, move down and remove at the touch floor, and no drag; a tap on the row opens one sheet for its name, its sentence and its duration, each with its character count; then *Add a step* and *Reset to company timeline* (owner ruling 2026-11-13, approved design).

---

### T-M06-009 · Builder Step 7 — Payment Terms
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-13 (P0)
**DESIGN:** SCR-M06-09
**Drawn:** *Build* → step 7.
**Why:** the split the customer agrees to here becomes the project's collection schedule at Won, row for row — nobody types it again.
**Depends on:** T-M06-032

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

The tranche-sum rule is `allocationVerdict` (`packages/domain/src/commerce/tranche-allocation.ts`)
with the `AllocationMeter` component; no second 100 % check is written.

**DONE WHEN:**
- Given step 7, when tranche percentages do not sum to 100.00, then the gap renders live and Generate lists it with the remainder stated (M06-13).
- Given step 7, when the rep picks another of the company's named tranche templates, or edits, adds or removes a row, then the rows change on this proposal only, and ↺ Reset returns them to the company's default template in force (M06-13; `M01-54`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- The stage each tranche falls due on (M06-13, M11-09) — ruled: every row carries its due stage, copied from the tranche template line it came from; a row added here picks its stage from the market pack's chain stages (`project_tranche.due_on_stage` is NOT NULL, and M11-09 makes these rows the project's schedule unchanged).
- Which stages a new row may fall due on (M06-13) — ruled: only the stages this segment's projects visit, so a commercial proposal never offers the incentive-claim stage it skips (owner ruling 2026-11-13, final review).
- Amounts that do not divide evenly (M06-13, M11-08) — ruled: step 7 shows amounts from `splitSchedule` (`packages/domain/src/payments/schedule.ts`), the last row absorbing the remainder, so the builder and Won agree to the paisa (owner ruling 2026-11-13, final review).
- The controls (M06-13) — ruled: the company's named plans as chips; each part a row with − and + in steps of 5 and a typed value; the split bar and each part's amount follow at once; *Add a part*, *Reset*, and a line that says the change is for this proposal only (owner ruling 2026-11-13, approved design).

---

### T-M06-010 · Builder Step 8 — Components: the five-category gate, brands, edit sheets and inline add
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-14 (P0), M06-27 (P0), M06-28 (P0), M06-29 (P0)
**DESIGN:** SCR-M06-10
**Drawn:** *Build* → step 8; sheets *Pick a part*, *Edit a part* and *Add a new part*.
**Why:** the customer reads which brands they get and for how long they are covered; the rep taps saved parts instead of typing them on every proposal.
**Depends on:** T-M06-032, T-M06-034

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

Panels, inverters and batteries come from the shipped catalog (`/catalog/items`,
`CatalogItemForm`, `CatalogImport`); cable, electrical and structure come from `T-M06-034`'s saved
parts list. Closes `docs/tasks/deferred.md` `D341`: the catalog's archive warning counts the open
proposal drafts naming the item, replacing `OPEN_DRAFTS_BEFORE_THE_STUDIO`.

**DONE WHEN:**
- Given a person with `F2.M01.add-own-catalog-items` (the holders of `onboarding.add_own_catalog_items` in `packages/domain/src/authz/onboarding.ts`) or `F2.M01.manage-catalog`, when they open the builder's component picker, then inline add is present; given neither grant, then it is absent (permissions; moved from `T-M01-015`).
- Given step 8, when it renders, then it is the mandatory-components surface of §M06.5 with one picker — the one the design studio reuses, never a second (M06-14; M06-27, M06-28).
- Given a Path B proposal with no components, when step 8 renders, then all five sections show Empty, the counter reads "0/5", and Generate blocks jumping here (M06-27).
- Given a section with three brands chosen, when a fourth is added, then it is refused with the limit stated; and given the document, when the section renders, then the brands read as alternatives (M06-27).
- Given a product missing from the resolved catalog mid-pick, when the rep invokes add-in-flow, then the single-form and spreadsheet-import paths are offered (the spreadsheet path only with `F2.M01.manage-catalog` held outright, M01-39) inside the builder, the created SKU is picked in place, and the flow never leaves step 8 (M06-28).
- Given the edit sheet for any type, when it opens, then Brand Name is locked, the type's fields match the census list, and Description caps at 110 characters (M06-29).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- The edit sheet's type lists against the catalog's (M06-29) — ruled: `PANEL_TECHNOLOGIES` gains `mono` and `thin_film`, and `BATTERY_CHEMISTRIES` gains `custom` with its free text, each enrolled with enum parity in the same change (Law 12); one vocabulary, never a second list on the proposal line.
- What an edit-sheet change writes (M06-29) — ruled: the proposal's own component line; the catalog item never changes (M06-31 freezes lines with their version, and a catalog edit belongs to the catalog screen).
- The step's parts (M06-27, M06-28) — ruled: a ring that counts the parts picked, then one tile per category — an empty one drawn in the danger tint with its mark and *Pick a brand*; the picker a sheet with search, a tick per brand, the certification mark, and the three-brand limit said in words (owner ruling 2026-11-13, approved design).
- Edit and add (M06-28, M06-29) — ruled: each picked brand offers *Edit what prints for {brand}*, a sheet with the brand locked; *Add a new {part}* is a sheet that saves the part and picks it in place, with the spreadsheet row only for holders of `F2.M01.manage-catalog` (owner ruling 2026-11-13, approved design).

---

### T-M06-011 · Builder Step 9 — Terms & Conditions
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-15 (P0)
**DESIGN:** SCR-M06-11
**Drawn:** *Build* → step 9.
**Why:** the company's terms, or HelioGrid's default with its 30-day validity, protect every proposal without the rep writing a word.
**Depends on:** T-M06-032

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

**DONE WHEN:**
- Given step 9 with T&C added, when "Save as template" is used, then the tenant's template set gains it and the page estimate reflects the content (M06-15; `M01-51`).
- Given a person without `F2.M01.manage-tenant-settings` at step 9, when the step renders, then "Save as template" is absent and their edit stays on this proposal (M06-15).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- The editor (M06-15) — ruled: one row of text tools (bold, italic, heading, list, numbered list) joined to the text box, with the character count and the page estimate above it; under it *Save as company default* for a holder of `F2.M01.manage-tenant-settings`, or the line that the change stays on this proposal (owner ruling 2026-11-13, approved design).

---

### T-M06-012 · Builder Step 10 — Client Details
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-16 (P0)
**DESIGN:** SCR-M06-12
**Drawn:** *Build* → step 10.
**Why:** the customer's name, phone and address come from the lead; an address typed once is kept on the lead for the studio and the project.
**Depends on:** T-M06-032

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

**DONE WHEN:**
- Given step 10, when it renders, then the proposal number is present, auto-assigned and disabled — never editable, never client-generated (M06-16, M06-44).
- Given a proposal opened from a lead, when Step 10 renders, then the client name and phone come from the lead's customer and the address from the lead's confirmed visit booking where one exists, pre-filled and never asked again (OV-04) (moved from the block 3 CRM plan, owner yes 2026-11-09).
- Given a lead with no address, when an address is typed at step 10 and commits, then the lead holds that address (M06-16).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- When the number exists (M06-16, M06-44, M06-42) — ruled: it is assigned at the first successful Generate, with v1; before that step 10 reads "assigned when you generate" (drafts carry no version, and a number burned by an abandoned draft would leave gaps the customer can see).
- Where the site address lives (M06-16) — ruled: the lead gains one site address with its state and district (`T-M06-032`'s migration); a visit booking that confirms an address writes it there, step 10 and step 3 read it, and a typed one saves there — one place, never a second copy (owner ruling 2026-11-13, final review).
- The step's parts (M06-16) — ruled: a client card with the name and phone, locked and marked *From the lead*; the site address as the one field; then two read-only facts — the proposal number, which reads *Comes when you generate* until it exists, and the document's language (owner ruling 2026-11-13, approved design).

---

### T-M06-013 · Builder Step 11 — Bank Details and the closing sheets
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-17 (P0)
**DESIGN:** SCR-M06-13
**Drawn:** *Build* → step 11.
**Why:** the customer pays the right account: only the owner can enter the company's bank details, once, and every later proposal carries them.
**Depends on:** T-M06-032

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.

The fact's prompt state rides the shipped route `PUT /onboarding/prompt-points/:fact`
(`bank_details`).

**DONE WHEN:**
- Given step 11 with the include toggle off, when the document generates, then bank details are saved but do not print, and the note says exactly that (M06-17).
- Given a company with no bank details, when the EPC Owner fills them at step 11, then the business profile holds them and the next proposal shows them filled; and given a Sales Executive at the same step, when it renders, then the fields are absent, a line names who can add them, and the proposal generates without a bank block (M06-17).
- Given any company fact that is missing, when the document generates, then its block is left out and no placeholder text prints (M06-17).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- The Add 3D Design closing sheet while no studio exists (M06-17) — ruled: not shown; it returns with the studio's hand-off (`T-M06-021`) — a doorway to nothing is a dead end.
- When company facts are read (M06-17) — ruled: bank details, logo, address, phone, email and tax registration are read live from the business profile until Generate and frozen only into the version, so an owner's new bank account reaches every open draft and never an already-sent version; template content (terms, timeline, tranches) is copied at fill as M06-18 says (owner ruling 2026-11-13, final review).
- The step's parts (M06-17) — ruled: the bank block as the customer reads it, one switch to print it or not, then the fields for a holder of `F2.M01.manage-tenant-settings`, or one line naming who can add them (owner ruling 2026-11-13, approved design).

---

### T-M06-014 · BOM Detail — Path A line items behind the price
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-39 (P0)
**DESIGN:** SCR-M06-14
**Why:** on a designed job the owner sees every line, quantity and rate behind the price, and the margin on it.
**Depends on:** T-M06-021
**Parked:** needs the studio's BOM; built with the 3D studio's block (owner ruling 2026-11-13 — proposals ship first).

**Requirements (verbatim):** Verbatim rows live in the PRD; they are
the specification.

**DONE WHEN:**
- Given the BOM detail on a phone, when it renders, then it is a card list with an edit sheet — never a wide table (M06-39).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- Whether BOM-detail edits at proposal time live on the proposal's money block or write back to the studio's BOM (M06-39, §M06.6) — ruled: they are the proposal's own money inputs — the per-proposal margin and every line adjustment are stored on the proposal and snapshotted into the version's money block; `bom_line` is read-only to this module and never written (M06-01 makes the BOM the studio's internal object, and a write-back would move the design's fingerprint and stale the proposal from its own edit, M06-46).
- `MAX_MARGIN` (`packages/domain/src/catalog/price-book.ts`) cites a deleted studio row; re-cite it to `M06-39` / `M01-48` here.

---

### T-M06-015 · Proposal Preview — the customer-eye rendering before sending
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-50 (P0)
**DESIGN:** SCR-M06-15
**Drawn:** sheet *See the customer's page* (phone); the stage beside every step (desktop); stop *Document*.
**Why:** the rep sees exactly what the homeowner will see — clean, visual and in the customer's language — before anything goes out.
**Depends on:** T-M06-017, T-F5-009

**Requirements (verbatim):** Verbatim rows live in the PRD;
they are the specification.

**DONE WHEN:**
- Given a generated version, when preview renders, then it is pixel-for-content identical to what the customer's rendering will show, in the customer's language (M06-50).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- One renderer (M06-50) — ruled: the preview, the stage, the document and the customer link draw the same page parts over the same values, so the preview cannot differ from what is sent (owner ruling 2026-11-13, approved design).

---

### T-M06-016 · Proposal Versions — v1 vs v2, what changed and why
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-42 (P0)
**DESIGN:** SCR-M06-16
**Drawn:** stop *Versions*; sheet *Put a version in force*.
**Why:** when a customer asks for changes, the rep and the owner see what moved between versions and why, and v1 stays as it was sent.
**Depends on:** T-M06-025a

**Requirements (verbatim):** Verbatim rows live in the PRD;
they are the specification.

**DONE WHEN:**
- Given a generated version, when any input later changes, then the version's snapshot and money block are byte-identical to generation time and a change note exists (M06-42).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- The screen's parts (M06-42) — ruled: the change note first, in the words the person wrote; then only the facts that moved, each as old value → new value, and one line for the pages that did not change; then a row per version with its state, and Share or View (owner ruling 2026-11-13, approved design).

---

### T-M06-017 · Proposal Document — the rendered commercial document and its honesty obligations
**Type:** screen · **Tier:** P0
**Status:** planned
**Owed by `T-FPLAT-029` (`F8-20`, `F8-22`, `F8-23`; `F8-24`, a law):** the basis line is `basisLineOf({ designed, roofTier })` from `@heliogrid/domain`, printed through `@heliogrid/i18n`'s `BASIS_LINE_WORD` — never a second rule or a second copy of the words; every figure is the `QualifiedAmount` the screen and the link read, projections included with their assumptions, never recomputed for the page.
**PRD rows:** M06-04 (P0), M06-51 (P0), F3-15 (P0)
**DESIGN:** SCR-M06-17
**Drawn:** stop *Document*; *Defaults* → *Pages* shows all nine pages at once.
**Why:** the document is what wins or loses the job — a homeowner understands it in seconds: one hero figure, pictures over tables, every number with its unit and honest label, no placeholder ever printed.
**Depends on:** T-M06-024, T-M06-025a

**Requirements (verbatim):** Verbatim rows live in the PRD;
they are the specification.

`F3-15` moved here at `T-FPLAT-007`'s `/start`: its proof opens a generated document and reads
its conjuncts, and this is the ticket that renders the first one. The obligation binds every
generated artifact through the one renderer — drawing sheets and exports as much as this
document — and the bundled face and its per-script metrics are `T-FPLAT-007`'s, consumed
here and never re-declared. The renderer is the shipped worker workflow
(`apps/worker/src/modules/documents/documents.activities.ts`, `renderPdf`) with `PagedDocument`
and `Disclosure`. Closes `docs/tasks/deferred.md` `D263`: `DocumentPreview` gains the
achievements, bank-details and timeline bands this document prints.

- **F3-15** (P0) — **Generated documents shape every script correctly — correct conjuncts, matras and ligatures — because they are commercial documents.** A proposal in a non-Latin script is the same legal and commercial artifact as its English counterpart: broken conjuncts are not acceptable output. The document-rendering capability is chosen and kept on the strength of its script shaping; per the suite's vendor rule, the capability is "a document renderer that shapes the product's scripts correctly", and the v1 reference implementation is the headless-browser renderer with the script face bundled into its runtime. This obligation covers every generated artifact — proposals, drawing sheets, exports — not only the proposal PDF.

**DONE WHEN:**
- Given a Path B proposal, when its document or customer-facing rendering is produced, then the verbatim indicative line renders on the document in the reading flow at the same visual weight as the figures it qualifies (M06-04; `F8-20`).
- Given any company fact that is missing, when the document generates, then its block is left out and no placeholder text prints (M06-17).
- Given a generated document in a non-Latin language, when it is produced and opened, then conjuncts, matras and ligatures are shaped correctly throughout (`F3-15`). → proof: QA (api) renders this document in `mr` and reads the produced artifact's embedded faces and glyph runs, so a broken conjunct is read rather than eyeballed
- Given a tenant with a saved brand colour and logo, when its proposal document renders, then the document carries the mark and the compliant shade `compliantShades` derived — never a raw colour that fails contrast — and the branding changes no number, label or disclosure (`F7-07`, `F5-81`; moved here from `T-FPLAT-022`). → proof: the rendered document for a colour that fails contrast carries the derived shade and the mark, and its text layer equals the unbranded render's
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- What a V1 document states as its basis when no survey exists behind it (M06-51; `F8-20`, `F8-22`) — ruled: the basis is derived at Generate from the design's roof-capture provenance tier and frozen into the version's honesty labels — no design keeps `F8-20`'s indicative line; a design whose roof tier is not `measured` renders `F8-22`'s remote line verbatim; a `measured` roof, M04's V2 path, carries no basis line; and no field is added to the design (`F8-21` reduces roof capture to exactly two flows, so the tier already names the flow, and a stored basis would be a second copy of it).
- The document's language (M06-50, `F3-06`) — ruled: the customer's preferred language, and the company's default language when the customer has none (owner ruling 2026-11-13, final review).
- The pages (M06-04, M06-51) — ruled, in order: Cover (the cover picture edge to edge, the company's mark and name, the number and date, the customer's name, one line for the system, three figures on glass — the price, the yearly generation and the payback — and who prepared it with its validity) · About us (the company's words, three pictures, the track record) · Your system (a picture band and the parts) · Generation · Savings (a full-colour page) · Price and payment (the price, the payment plan, the EMI example when it is on, and *Included in this price*) · Timeline · Terms · Bank details (the account and a closing picture with the customer's name and the contact). The cover, the price page and the terms always print; the others follow the company's pages setting (`T-M01-030`) (owner ruling 2026-11-13, approved design).
- *Included in this price* (M06-04) — ruled: each line is a slot template over the version's own facts — its components, its timeline phases and its maintenance plan — and a line whose fact is absent is left out (`T-M06-029`) (owner ruling 2026-11-13, approved design).
- Pictures (M06-51) — ruled: the document's pictures are decoration and carry no fact; they come from one platform set in one style, published with the approved design, and words on a picture sit on a shade that keeps WCAG AA (owner ruling 2026-11-13, approved design).

---

### T-M06-018 · Proposal Detail — status, tracking and the share sheet
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-53 (P0), M06-54 (P0), M06-57 (P0)
**DESIGN:** SCR-M06-18
**Drawn:** stop *Track*; sheets *Share sheet*, *First send, no GST number* and *Thank-you message*.
**Owed by `T-FPLAT-028` (`F8-17`, `F8-18`):** the stale state reads from the version's `Freshness` (`freshnessOf`, `packages/domain`), shown on the detail before any share act with its corrective action; the share, send and issue acts are blocked while `issueBlockedBy` names a reason or `payableStandsUp` is false, and the stated reason is the one returned. Its freshness comes from this output's own stored pins, never pins built at the call site.
**Owed by `T-M01-005` (`M01-24`, `M01-29`; owner ruling 2026-10-12):** the prompt at the first send. *Given a skipped company profile, when the first proposal is about to be sent, then the prompt to complete it fires there, inline (M01-24, M01-29).* → proof: QA (web and phone) skip the profile step, build a proposal to its send: `SCR-M01-05`'s tax part opens in `EditorSurface` over the proposal (board frames `m-prompt`, `d-prompt`), *Add it and send* saves the registration and *Send without it* leaves the default in place; the fact's state goes through `PUT /onboarding/prompt-points/company_profile` (fired, then completed or declined). The field set is `T-M01-005`'s shared component; this task mounts it and adds the client call. Only a holder of `F2.M01.manage-tenant-settings` is offered *Add it*; anyone else sees who can add it (M06-17).
**Why:** one tap shares on WhatsApp with the words already written; the rep then sees when the customer opened it, and nothing claims a delivery the product cannot see.
**Depends on:** T-M06-025a, T-F5-006, T-F5-007

**Requirements (verbatim):** Verbatim rows live in the PRD;
they are the specification.

The share act follows block 5's pay-request pattern (`trancheRequestShare`, a tap and never a
delivery). The composed words are platform copy in the customer's language and fill the
`proposal_share` key's starter text (`packages/domain/src/messaging/templates.ts`). The
connected-channel clauses of `M06-53` and `M06-57` wait for the channel connection, `T-M03-007`
(V2); this task proves the V1 path.

**DONE WHEN:**
- Given a V1 company, when the share sheet opens, then Share on WhatsApp opens a chat picker with the composed words and the customer link in the customer's language, Copy link and Download PDF are offered, and nothing claims a send (M06-53).
- Given a shared proposal, when tracking renders, then states are shared → opened → viewed-for-how-long, delivery states appear only as the connected channel reported them, the fallback path shows no delivered state anywhere, and an open notifies the rep (M06-54).
- Given a client phone that fails the pack's format, when step 10 commits, then the failure is stated at entry; given a connected-channel send that the channel reports failed, then the failure is shown and an alternative channel offered; and given a fallback-path share never opened, then the non-opening is visible, the composed message is re-offered for an alternative channel the rep sends, and no fallback surface claims a delivery state (M06-57; owner ruling 2026-08-04 on the transactional lane).
- Given each share and mark-shared route, when an EPC Owner, Sales Manager and Sales Executive call it, then it succeeds; when a Design Engineer or any other role calls it, then it is refused; and given another company's proposal, then the answer is 404 (permissions; `F2.M06.send-proposals`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- What marks a proposal shared in V1 (M06-53, `F5-20`) — ruled: the first Share on WhatsApp or Copy link is the mark-shared act and mints the link for the lead's primary contact; a re-share reuses that link, never minting a second; Download PDF alone shares nothing (owner ruling 2026-11-13, final review).
- The screen's parts (M06-53, M06-54) — ruled: a hero with the status, one sentence that says what happened, the one next act for that status — Share, Share again, Call, Make version 2, Confirm won, Open the project — and the cover; under it four steps on a line, Generated → Shared → Opened → Answered, each with its time, and the line that only opens are shown; then rows for the open proposal task, the version, the links and the document (owner ruling 2026-11-13, approved design).
- The share sheet (M06-53, M06-57) — ruled: the composed words as a message bubble, *Share on WhatsApp* as the main act, *Copy link* and *Get PDF* under it, and a line that the person picks the chat and sends; after the act a toast says the proposal is marked shared and names the follow-up's date (owner ruling 2026-11-13, approved design).

---

### T-M06-019 · Proposal List — status, New proposal and per-row duplicate
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-48 (P0)
**DESIGN:** SCR-M06-19
**Drawn:** stop *List*; sheets *New customer* and *Copy for another lead*.
**Owed by `T-FPLAT-028` (`F8-18`, a law):** each row's stale state reads from its version's `Freshness` (`freshnessOf`, `packages/domain`) and is shown on the row with its corrective action, never only by a colour. Its freshness comes from this output's own stored pins, never pins built at the call site.
**Why:** "same as the Sharma proposal, new customer, 6 kW" takes under a minute from the list; every proposal's state reads at a glance as glyph, word and tint.
**Depends on:** T-M06-025a

**Requirements (verbatim):** Verbatim rows live in the PRD; they
are the specification.

**DONE WHEN:**
- Given an existing proposal, when Duplicate is invoked onto another lead, then every step arrives pre-filled including all components, client details come from the new lead, and a fresh server number is assigned at Generate (M06-48).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- The screen's parts (M06-48) — ruled: filter chips with their counts; on a phone one card per proposal, on desktop a table set on the page with a line under the header and each row and no card behind it; each row shows the customer, the number, the system, the price, the status as a mark and a word, and one line for the latest event (owner ruling 2026-11-13, approved design).
- Duplicate (M06-48) — ruled: the row's copy act opens a lead picker — search, the person's recent leads and *A new customer* — and the builder opens on the lead picked (owner ruling 2026-11-13, approved design).

---

### T-M06-020 · Deal Link Manager — the tenant-side link surface on the deal
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** F5-30 (P0) (`docs/prd/foundations/F5-customer-link.md` — F5's row; the screen is drawn by M06 and is not part of this bucket's disposition index)
**DESIGN:** SCR-M06-20
**Drawn:** stop *Links*; sheet *New link*.
**Why:** the rep sees each named link, who opened it and when, while the customer's page shows none of it.
**Depends on:** T-F5-007

**Requirements (verbatim):** Verbatim rows live in the PRD;
they are the specification.

**DONE WHEN:**
- Given the deal's link manager, when it is opened by an operator, then it shows labels, contacts, open history and link states; and given the customer's page, when it is opened, then it shows none of them (`F5-30`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- The link manager's acts (`F5-30`) — ruled: it mints a named link for another contact, labels, re-mints and revokes, each under `customer_link.mint_customer_link` / `revoke_customer_link`; after Won the project's manager is the named person, so this task adds the project manager to those two capability rows (F2 row and matrix in one change) — a customer who loses their phone mid-install is served by the person they deal with (owner ruling 2026-11-13, final review).
- The screen's parts (`F5-30`) — ruled: one card per link with its label, its contact, its state and its last open; each live link offers Copy, a new address (re-mint) and Turn off (revoke), and Turn off asks once and then stops the link at once; a line says the customer's page shows none of this (owner ruling 2026-11-13, approved design).

---

## Engine, policy and integration tasks

### T-M06-032 · The proposal record — tables, contract, routes and who may call them
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** none
**Design:** none — the record every builder step, the document and the link read
**Why:** one proposal record, guarded per role and per company, is what every other proposal task writes to — built first so no screen invents its own shape.
**Depends on:** none

The proposal, its draft lines (components, tranches, timeline), its versions with their copied
lines, and the share record; the lead's new columns (sanctioned load, supply phase, the site address with its state and district); the
`proposal` counter kind (`packages/domain/src/tenancy/counters.ts`, pgEnum, Law 12) and a `PRP-`
number format beside the project and receipt ones; the contract in `packages/contracts`; the
customer-merge repoint (`apps/api/src/modules/crm/crm.merge.repository.ts`). The capability rows
exist (`packages/domain/src/authz/proposals.ts`). Every migration starts from
`pnpm db:migration:new`.

**DONE WHEN:**
- Given each create, edit and Generate route, when an EPC Owner, Sales Manager, Sales Executive and Design Engineer call it on a lead they reach, then it succeeds, and every other role is refused; and given a proposal of another company, when any role calls a route with its id, then the answer is 404 (permissions; `F2.M06.create-edit-proposals`).
- Given a lead a person cannot see, when they read its proposals, then none is returned (permissions; proposal visibility follows `F2.M02.lead-visibility`).
- Given a Generate, a discount and a version creation, when each commits, then an audit-log event names the act, the actor and the amount where there is one (`F2-22`).
- Given a lead with proposals, when Lead Detail opens, then the proposals section counts them and a draft shows as "Proposal draft — n/11" (M06-25).
- Given two customers merged, when the merge completes, then every proposal of the loser points at the survivor and no proposal figure, version, discount or total changes (M02-60, M02-62) (moved from the block 3 CRM plan, owner yes 2026-11-09).
- Given a lead marked lost, disqualified or junk, when a person tries to create a proposal on it, then it is refused with "Reopen the lead to make a proposal" (M06-45).

**Settle before the build:**
- Lead facts written from the builder (M06-09, M06-16) — ruled: they go through the lead's own edit path, allowed under either `crm.add_edit_leads` or the proposal grant, each write a timeline entry naming the actor and refused on a stale revision; Category writes the lead's segment; the client phone is read-only here — it is the customer's identity, changed on the customer (owner ruling 2026-11-13, final review).
- Proposal work on parked leads (M02-49) — ruled: a draft act counts as activity, so a dormant lead returns to its stage; a share on a snoozed lead wakes it; create on a closed lead is refused as above (owner ruling 2026-11-13, final review).
- The Design Engineer in V1 (M06 permissions) — ruled: they build proposals on the leads their scope reaches (visits they are booked on); New proposal is shown only to holders of `crm.add_edit_leads`, so nobody meets a quick add they cannot save (owner ruling 2026-11-13, final review).
- The number's format (M06-44) — ruled: `PRP-0001`, one sequence per company, beside `PRJ-` and `RCPT-` — the same shape the shipped numbers use (owner ruling 2026-11-13, final review).

---

### T-M06-033 · Energy and savings auto-fill — the source of record, its fallback, and the district list
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** M06-10 (P0), M06-11 (P0), F8-08 (P0), F8-10 (P0)
**Design:** as T-M06-006
**Why:** a proposal without a design still shows real month-by-month generation for the customer's district, labelled with its source — and never stops when the source is down.
**Depends on:** T-M06-032

The source of record is PVGIS (`F8-08`), called by the worker with the capacity and the location's
coordinate; PVGIS is a free public service with no account or key. The fallback is the built-in
latitude fit (`packages/domain/src/format/energy-source.ts`). The market pack gains its
administrative areas (IN: state → district) with a representative coordinate each — a new pack key
(`MarketPack`, Law 12) that step 3's location fields read. Savings, payback and lifetime savings
read the payable and the net cost after incentive (`M06-35`), the tariff, the lead's monthly bill
and the inflation rate.

**DONE WHEN:**
- Given a location and capacity at step 3, when AI Auto-fill runs at step 4, then the monthly generation comes from the market's energy source of record for that location with its source label; and given that source unavailable, then the built-in estimate fills it with its own label and the step still completes (M06-10; `F8-08`, `F8-10`).
- Given an energy figure produced by the source of record, when it renders on any surface, then it carries "Real · PVGIS ({database})" with the database named (`F8-08`).
- Given an energy figure produced by the built-in fallback, when it renders on any surface, then it carries "Built-in estimate ±10%" (`F8-08`).

**Settle before the build:**
- Savings (M06-11) — ruled: monthly savings = units used on site × tariff, capped at the lead's monthly bill when it is known; exported units are valued at the pack's export rate, zero when the pack has none — savings never exceed the bill (owner ruling 2026-11-13, final review).
- Losses counted once (M06-10) — ruled: PVGIS is asked at zero system loss and step 4's efficiency is applied once, so losses are never taken twice (owner ruling 2026-11-13, final review).
- The fallback (`F8-08`, `F8-10`) — ruled: this task authors the built-in latitude fit on the server entry and proves it within ±10 % of PVGIS at sample points across the pack's areas; `energy-source.ts` holds only its label today (owner ruling 2026-11-13, final review).
- A slow or failing source (M06-10, `F8-10`) — ruled: a fixed timeout, then the fallback with its label; results cached per coordinate at 1 kWp and scaled by capacity; a rep's edited figures stay when capacity changes, with "Capacity changed — Reset to AI values"; an offline phone gets the honest no-connection state (`F8-36`) (owner ruling 2026-11-13, final review).
- A district missing from the pack (M06-09) — ruled: the rep picks the state alone and the state's coordinate is used, labelled as the coarser estimate it is (owner ruling 2026-11-13, final review).

---

### T-M06-034 · The company's saved parts — cable, electrical and structure
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** M06-28 (P0)
**Design:** as T-M06-010
**Why:** a company adds "Polycab · DC/AC cable · 10-year warranty" once and taps it on every later proposal — no typing, no spelling drift.
**Depends on:** T-M06-032

One tenant table — kind (cable, electrical, structure), brand, specification, warranty,
description — with no price, count or stock; written under the catalog-add grant
(`F2.M01.add-own-catalog-items` or `F2.M01.manage-catalog`), read by every proposal of the company.

**DONE WHEN:**
- Given a Cable part added with Add new on one proposal, when the next proposal opens step 8, then that part is offered in the Cable picker with its brand, specification, warranty and description, and no price or count field exists for it (M06-28).

**Settle before the build:**
- Keeping the list clean (M06-28) — ruled: a part with the same brand and specification, ignoring case and spaces, is refused as a duplicate; a holder of `F2.M01.manage-catalog` edits or archives a part from the picker; an archived part leaves the picker, and versions keep their own copy (owner ruling 2026-11-13, final review).

---

### T-M06-021 · Path A — the studio's hand-off, pre-fill map, variants, staleness and the upgrade offer
**Type:** engine · **Tier:** P0
**Status:** planned
**Owed by `T-FPLAT-029` (`F8-21`):** every tier this map assigns passes `tierFitsBasis(basis, tier)` from `@heliogrid/domain` — never a second copy of the no-design rule.
**Owed by `T-FPLAT-027` (`F8-11`, a law):** every shading output the document prints carries the shading model's limit text beside it — beam-only, linear in unshaded area, no bypass-diode cliff, no string mismatch, so partial-shade losses read optimistic — at every scale.
**PRD rows:** M06-03 (P0), M06-46 (P0), M06-47 (P0), M06-56 (P0), M08-04 (P0), M08-05 (P0), M08-16 (P0)
**Design:** as T-M06-017
**Why:** on a designed job every number arrives derived from the real model, the customer sees one recommended system, and a proposal whose design changed says so before anyone sends it.
**Depends on:** T-M06-025a
**Parked:** needs a design; built with the 3D studio's block (owner ruling 2026-11-13 — proposals ship first).

**Requirements (verbatim):**

- **M06-03** (P0) — **What a design pre-fills — the pre-fill table, carried faithfully.** Step 3 Solar System Setup: capacity, type, category **derived** (without a design: typed). Step 4 Performance Metrics: generation from the real shading simulation, **derived** (without: AI auto-fill, **estimated**). Step 5 Financial Data: savings/payback from the real BOM pricing, **derived** (without: AI auto-fill, **estimated**). Step 8 Components: the actual BOM, **derived** (without: picked from catalog, **assumed**). Cost: the real bill of materials (without: a typed lump sum). A typed Path B figure carries the conservative tier per F8's recorded reading (`F8-21`).

**DONE WHEN:**
- Given a completed design, when Generate proposal is tapped in the studio, then the builder opens on Path A with steps 3/4/5/8 pre-filled `derived` per the pre-fill table (M06-03, M06-05).
- Given any Path B version, when document or link render, then the verbatim indicative line is present in the reading flow; given a remote-survey-based design, then the basis line renders (M06-51).
- Given a design with variants, when the customer-facing rendering is produced, then exactly one recommended system shows by default (M06-56).
- Given a design edit after generation, when the proposal list or detail renders, then the stale state is visible with Regenerate offered; no flag was stored — removing the design edit restores freshness by comparison alone (M06-46).
- Given a completed design on a lead with an indicative proposal, when the upgrade is offered, then the changed figures and their tier changes are shown before commit, and declining changes nothing (M06-47).
- Given a project, when its detail screen opens, then the stage timeline, design, proposal, payments, documents, blockers and activity are all present on one screen, each naming the object it reads (M08-16). *(Moved from T-M08-002 by owner ruling 2026-11-10: its proof needs the design, the proposal and the payments on the project.)*
- Given the project has just been created, when it opens, then the customer, site, approved design, accepted proposal version and the accepted version's tranche schedule are present by reference, and the document checklist is seeded for this project's segment from the tenant's market pack (M08-04, M08-05). *(Moved from T-M08-007 by owner ruling 2026-11-10: its proof needs the approved design.)*

---

### T-M06-022 · The Generate gate evaluator — one checklist, the size warnings, every speed path
**Type:** engine · **Tier:** P0
**Status:** planned
**Owed by `T-FPLAT-029` (`F8-21`):** Generate is refused while any figure's tier fails `tierFitsBasis(basis, tier)` from `@heliogrid/domain` — a no-design document holding a `derived` or `measured` figure — and the refusal names the figure; the gate never weakens the tier to pass.
**PRD rows:** M06-20 (P0), M06-23 (P0), M06-36 (P0), M06-37 (P0)
**Design:** as T-M06-002
**Drawn:** stop *Check*; stop *Ready*.
**Why:** every mistake shows up once, at Generate, as a list the rep taps through — and the three size warnings stop a 3 kW proposal going out with 3.47 kW of panels and a 5 kW inverter.
**Depends on:** T-M06-024, T-M06-025a

**Requirements (verbatim):**

- **M06-20** (P0) — **The two speed paths never diverge in validation.** Quick mode and duplicate-an-earlier-proposal are the two speed paths, and they **must not diverge in validation behaviour**: both validate exactly once, at Generate, against exactly the same checklist as the full rail (`M06-23`). Quick mode hides steps; it never skips checks.
- **M06-36** (P0) — **The payable floor is the only hard discount guard.** A discount driving the client-payable figure to **zero or below** in the tenant currency shows the negative and **blocks Generate until corrected** — *"the only hard discount guard."* No approval flow, no request sheet, no queue, no "Pending approval" status, no per-rep ceilings exist anywhere (`D34`, superseding `D19`; revisit-trigger recorded in §5). Whoever can build a proposal can discount and share it immediately.
- **M06-37** (P0) — **Below-cost pricing warns — explicitly, with the loss stated — and never blocks.** When a discount pushes the job below cost (Path A: below the BOM-derived cost; Path B: below the typed cost basis), the product says so **with the loss stated in the tenant currency**, and lets the person proceed: the guard is information, not permission. On Path B the typed cost basis is step 3's **our cost**; when it is filled, the payable card shows the margin to holders of `F2.M01.manage-catalog` only (owner ruling 2026-11-13).

The incentive-path check calls `unmetSubsidySchemes` (`packages/domain/src/subsidy/path.ts`); the
size checks' tolerance and inverter band are market-pack facts added here (Law 12).

**DONE WHEN:**
- Given the same proposal content, when Generate runs from Quick mode, from a duplicate, or from the full rail, then the identical checklist produces the identical pass/fail result (M06-20).
- Given a proposal with multiple failures, when Generate is tapped, then every failure renders as one tappable list ("Fix N issues to share") and each tap lands on the exact step with the failing fields highlighted (M06-22, M06-23).
- Given a proposal on the incentive path with a component failing the pack's required scheme, when Generate runs, then the check fails naming the component line and the scheme, and clearing it (compliant component, or leaving the incentive path) passes (M06-23; `F1-34`).
- Given 6 panels of 579 Wp on a 3 kW proposal with a three-phase 5 kW inverter, a 2 kW sanctioned load and a single-phase supply, when Generate runs, then four warnings list both figures of each check, each jumps to its step, and none blocks generation; and given no sanctioned load on the lead, then that check says it was skipped and why (M06-23).
- Given a panel section listing a DCR panel and a non-DCR panel on the incentive path, when Generate runs, then the non-DCR brand fails by name, and no inverter, cable, electrical or structure line is checked against the scheme (M06-23; `F1-34`).
- Given payable ≤ 0, when Generate runs, then it blocks with the negative shown; given payable corrected positive, then the same checklist passes (M06-36).
- Given a discount below cost with payable > 0, when Generate runs, then a warning states the loss in tenant currency and generation proceeds if confirmed (M06-37).
- Given a ₹0 system cost and no discount, when Generate runs, then the payable floor blocks it — the check reads payable ≤ 0 itself, not `zeroOrBelow`, which needs a deduction (M06-36).
- Given Generate tapped twice, or retried on a slow network, when both reach the server with one creation key (`createHeadersSchema`, `creationKeyOf`), then one version and one number exist (M06-44).

**Settle before the build:**
- Which components a certification scheme binds (M06-23(f), `F1-34`) — ruled: each required scheme names the component categories it applies to, a market-pack fact (IN: DCR → panel, Law 12), and every listed brand of those categories is checked; `unmetSubsidySchemes` reads that scope (owner ruling 2026-11-13, final review).
- What a person without `F2.M01.manage-catalog` sees when the price is below cost (M06-37) — ruled: "below the company's cost", with no figure, so the loss never reveals our cost; holders see the amount (owner ruling 2026-11-13, final review).
- The gate's surface (M06-23, M06-36) — ruled: a sheet over the builder. Blocked: the title counts what to fix, each failure a row that opens its step, and the main button goes to the first one — never a dead Generate. Warnings sit under them as *Then check*, each with both figures. Clear: the cover, the customer, the size, the payable, the page count, the language and the version, then Generate, which shows a thin travelling line while it runs (owner ruling 2026-11-13, approved design).
- After Generate (M06-20) — ruled: one screen where the cover lands with the number and the version, *See it and share* as the main act and *Download PDF* beside it (owner ruling 2026-11-13, approved design).

---

### T-M06-023 · Continuous draft save — commit on blur, resumable from the lead
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** M06-25 (P0)
**Design:** none — the draft behaviour behind every step
**Drawn:** the *State* switch (*Not saved*, *Changed elsewhere*, *Offline*); case *Lead moved away*.
**Why:** a rep who loses signal on a roof loses nothing; the draft waits on the lead.
**Depends on:** T-M06-032

**Requirements (verbatim):**

- **M06-25** (P0) — **Save continuously, never on Next.** Someone will lose a network mid-build: **every field commits on blur**; a draft always exists from the first commit and is **resumable from the lead**, shown as **"Proposal draft — 7/11"** on the lead surface. This row is the draft-save specification `R14`'s ledger note asked this module to state.

The lead-surface chip ("Proposal draft — n/11") renders on `SCR-M02-04` (Lead Detail), which is
M02's screen; `T-M06-032` counts it there, and this task owns the commit-on-blur draft behaviour and
the resume path behind it.

**DONE WHEN:**
- Given a field edited and blurred, when the app is killed and the lead reopened, then the draft resumes with that value present and the lead shows "Proposal draft — n/11" (M06-25).
- Given a field blurred while the network fails, when the commit is refused, then the typed value stays with "Not saved — tap to retry", and nothing claims it saved (M06-25).
- Given the same draft open on a phone and a desk, when the older device commits a field the newer one changed, then the write is refused with "Changed on another device — reload" and no value is silently overwritten (M06-25).

**Settle before the build:**
- Draft writes (M06-25, `F8-36`) — ruled: each field write carries the draft's revision and a stale one is refused; nothing is queued offline — an offline phone shows the no-connection state and keeps what was typed on screen (owner ruling 2026-11-13, final review).
- A lead that moves away mid-draft (M06-25) — ruled: the next commit answers "This lead moved to {person}" instead of a bare refusal, and the draft stays with the lead for its new owner (owner ruling 2026-11-13, final review).
- What the person sees (M06-25) — ruled: a quiet *Saved* tick beside the step's title and on the field just left; a refused commit keeps the typed value with its line under the field; the offline state is said once under the title (owner ruling 2026-11-13, approved design).

---

### T-M06-024 · The proposal money block — scheme-generic computation, pack incentive, one value set
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** M06-34 (P0), M06-35 (P0), M06-38 (P0), M06-41 (P0)
**Design:** none — the server's one computation every surface prints
**Why:** the builder, the document, the link and the payment plan show one set of numbers, computed once on the server, so a customer never sees two prices.
**Depends on:** T-M06-032

**Requirements (verbatim):**

- **M06-34** (P0) — **The proposal money block is scheme-generic, currency-stamped, and reconciles to the minor unit.** It carries: currency code (stamped at creation, one currency per tenant — `F1-07` consumed) · system cost excl./incl. tax · per-line tax % · a document-level taxes[] breakdown · battery cost + battery tax % · incentive amount · discount (% ⇄ amount) · payable. **Tax strategy comes from the market pack** (`F1-13`: per-line-rate or document-level); no tax column, label or rate is hard-coded. Sums reconcile to the currency's minor unit (`DOC04.currency-stamp` via `F1-07`).
- **M06-38** (P0) — **The incentive amount is computed from the market pack's incentive model — never manually configured per tenant.** Eligibility (segment, capacity, component-certification requirements, geography) and the computation ship as versioned pack data (`F1-14` consumed; the IN instance is `F1-33`'s slab model). The proposal shows the computed amount and treats it as `M06-35` says; an **incentive claimed** switch at step 3 — on by default when the pack offers the incentive for the proposal's segment and system type — lets the rep leave the incentive path (a customer who already used the scheme, or wants non-certified panels), which zeroes the amount and lifts the certification check (owner ruling 2026-11-13); where the pack ties the incentive path to a certification scheme, the Generate-time check is `M06-23`(f). A pack revision never changes an existing version's figures (`M06-42`).
- **M06-41** (P0) — **Proposal money is never computed on a device and never renders stale as final.** No device prints a customer-facing price computed locally (`F4-04` consumed); a proposal whose inputs changed renders **stale, visibly, with the corrective action offered** — regenerate as a new version — and *"money must never render as final while stale — this is a hard product rule"* (`F8-12`–`F8-15`, `F8-18` consumed; the version mechanics are §M06.7's).

The tax and incentive arithmetic is `taxBreakdown` (`packages/domain/src/tax/breakdown.ts`) and
`subsidyAmount` (`packages/domain/src/subsidy/amount.ts`); no module multiplies a rate itself.
Who receives the incentive is a new market-pack fact (`MarketPack`, Law 12; IN: the customer).

**DONE WHEN:**
- Given any tenant market, when the money block renders, then tax fields, strategy, incentive naming and currency format come from the pack (`F1-13`/`F1-14`/`F1-21`) and no market term is hard-coded (M06-34).
- Given an incentive-eligible proposal, when the money block computes, then the incentive amount is the pack-computed value — no manual slab entry exists anywhere (M06-38).
- Given a stale proposal, when any money renders, then it is stale-marked with regenerate offered — never final (M06-41).

**Settle before the build:**
- The discount's base (M06-34, M06-35) — ruled: a discount is pre-tax, pro-rated across the system and battery lines by taxable value, tax recomputed per line through `taxBreakdown`, and a % converted through `applyRate` — so the printed tax is always on the price the customer pays (owner ruling 2026-11-13, final review).
- A price typed including tax (M06-09) — ruled: the typed inclusive figure is the authority; the pre-tax figure is derived through `money/` and tax = typed − pre-tax, so the two always add up to what was typed (owner ruling 2026-11-13, final review).
- Place of supply and an unregistered company (M06-34, `F1-13`) — ruled: the customer's place is step 3's state, the company's is its tax registration's state; a company with no tax registration prints no tax line and its price is the price — it cannot collect a tax it is not registered for — and the step says so to the owner (owner ruling 2026-11-13, final review).
- The shipped equation's comment (`packages/domain/src/money/equation.ts`) still reads the incentive as a deduction; this task corrects it with the pack fact and adds the test that an IN incentive is never passed as a deduction (owner ruling 2026-11-13, final review).
- Incentive eligibility (M06-38, `F1-14`) — ruled: the subsidy pack's eligibility gains the system types it covers (IN: on-grid and hybrid), a pack fact (Law 12) (owner ruling 2026-11-13, final review).

---

### T-M06-025 · Versions, numbering, the status machine and the Won hand-off
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** M06-43 (P0), M06-44 (P0), M06-45 (P0), M07-62 (P0), M08-50 (P0), M11-09 (P0), M11-14 (P0), F5-46 (P0), F6-22 (P0)
**Design:** none — the record's life behind the list, the detail and the link
**Drawn:** sheets *Mark won*, *Mark won, newer version unanswered*, *Mark won, no accepted proposal* and *Put a version in force*.
**Owed by `T-FPLAT-028` (`F8-14`, `F8-15`):** a version pins what it was computed from as `InputPins` (`packages/domain`) — the design fingerprint, the catalog release, the tenant price-book version, the pack pin with the keys read, and the engine versions — at generation, in its migration; once shared, its figures qualify as a record (`freshness: null`) and keep their standing, and its pins are never updated. Its freshness comes from this output's own stored pins, never pins built at the call site.
**Why:** the lead, the proposal and the project move by themselves as the customer answers, and Won uses the price and the payment plan the customer accepted — nobody types the deal twice.
**Depends on:** T-M06-032, T-M06-024

#### Parts

| part | what | AC | depends on | status |
|---|---|---|---|---|
| a | Versions, the server number and the status machine, with the lead's stage following it and withdrawn on lost or disqualified | M06-43, M06-44, M06-45 lines | — | open |
| b | The Won hand-off: Mark won reads the accepted version's payable and tranches (`'proposal_version'` source), scope change after Won with every receipt kept | M07-62, M08-50, M11-14 lines; the signed-proposal checklist line moved from `T-F5-008` | part a, `T-F5-008` | open |
| c | Global search finds proposals under "quote" | F6-22 line | part a | open |

**Requirements (verbatim):**

- **M06-43** (P0) — **Sent proposals keep their prices forever.** Once shared, a version's figures never move: it keeps the rate versions, catalog release and pack version pinned at generation; a later price-book change, catalog release or pack revision produces **a new version if the tenant wants new numbers — never an edit of the sent one**. The customer's copy and the tenant's copy always agree.
- **M06-44** (P0) — **The proposal number is server-assigned — never client-generated.** Numbers come from server-side tenant counters; two users generating at once can never collide (`S6B.wrong.8`). Step 10 shows the number auto-filled and disabled. The same law governs project numbers (`modules/M08`'s half — cited, not disposed here).
- **M06-45** (P0) — **The proposal status machine: draft → shared → accepted / declined, with superseded when a newer proposal replaces it on the lead.** Statuses move by acts, not edits: sharing is the rep's explicit mark (`M06-53`); accept/decline arrive from the customer link (`foundations/F5`); superseded is set when a newer proposal takes over the lead. **The customer link always shows the latest version** (`S6.wrong.6`; the link mechanics are F5's) — **the latest shared version**: a version generated and not yet shared is invisible to the customer, and an older proposal turns superseded when the newer one is marked shared, not when it generates (owner ruling 2026-11-13). **Withdrawn** is set when the lead is marked lost, disqualified or junk, or when a person withdraws the proposal (`M06-58`); its link then shows `F5-25`'s honest "no longer active" page with a named person. **The lead's funnel stage follows these acts by itself and never moves back:** the first share moves it to `proposal`, a Negotiate from the link moves it to `negotiating` (`M02-41`, consumed); an Accept never makes it won — the rep's Mark won does (`M07-62`, consumed) (owner ruling 2026-11-13). **Each version takes one answer:** after an Accept, Negotiate or Decline on a version the link shows that answer and refuses another on it; sharing a newer version sets the proposal back to `shared` and opens answering on that version, the earlier answer staying in history. Nothing revives by itself: a withdrawn or superseded proposal returns only through a newly shared version.

Mark won's contract (`markWonSchema`, `packages/contracts/src/projects/project-acts.ts`) gains an
optional accepted version; the schedule writes `project_tranche` rows with source
`'proposal_version'` (`packages/domain/src/payments/vocabulary.ts`), which no code uses today.
`advanceStage` (`packages/domain/src/crm/lifecycle.ts`) moves the lead, cause `automation`, and each
act appends a timeline entry (`M02-35`).

**DONE WHEN:**
- Given a shared version and a subsequent price-book publish, when the version renders anywhere (tenant or customer side), then its figures are unchanged (M06-43).
- Given two simultaneous Generates on one tenant, when both complete, then they hold distinct server-assigned numbers (M06-44).
- Given a newer proposal on the same lead, when it is marked shared, then the older proposal reads superseded and the link serves the latest shared version; and given it only generated, then the link still serves the older one (M06-45).
- Given a version the customer accepted, when they try to accept, negotiate or decline it again, then the link refuses and shows the earlier answer; and given a newer version then shared, when the customer opens the link, then they can answer that version (M06-45).
- Given a lead at `qualified`, when its first proposal is marked shared, then the lead reads `proposal`; and given a Negotiate from the link, when it lands, then the lead reads `negotiating`; and given an Accept, when it lands, then the lead is not won (M06-45).
- Given a shared proposal, when its lead is marked lost or disqualified, then the proposal reads withdrawn and its link shows the no-longer-active page naming a person to call (M06-45).
- Given a lead whose latest proposal version the customer accepted, when Mark won opens, then the final value is that version's payable, shown and not typed, and the project's collection schedule is that version's tranches; and given a lead with no accepted version, when the rep marks it won, then the typed value and the company's default payment terms stand and the project shows it was won without an accepted proposal (M07-62; owner ruling 2026-11-13).
- Given a customer changes scope after Won, when a new proposal version is accepted, then the project references the new version, the earlier version remains readable, and the collection schedule follows the version in force (M08-50). *(Moved from T-M08-015 by owner ruling 2026-11-10: its proof needs a new proposal version, built in block 8.)*
- Given the queries "quote" and "quotation", when global search runs, then Proposals return and every rendered label says Proposal — this task adds the proposal search target (F6-22) (moved from the block 3 CRM plan, owner yes 2026-11-09).
- Given a new accepted version with revised terms, when the schedule re-renders, then it follows the version in force, every earlier receipt is still present and readable, and the earlier schedule remains viewable (`M11-14`).
- Given a recorded acceptance and a deal then marked won, when the project's handover checklist is read, then its signed-proposal row carries the acceptance record as its proof (`F5-46`, `F5-49`; owner ruling 2026-11-13).
- Given Mark won sent with a final value that differs from the accepted version's payable, or with a version that is another lead's or was not accepted, when the server receives it, then it is refused — the server finds the accepted version from the lead itself (M07-62; `F4-04`).

**Settle before the build:**
- Whether a version physically copies its component and tranche rows or references frozen draft rows (M06-31, M06-42) — ruled: physical copy at Generate — each version owns its own copied component and tranche rows beside its field-set and money snapshot, and the draft rows stay the one editable set with no frozen flag (M06-42 defines a version as a snapshot and demands byte-identity, which is provable only on rows nothing else can write; a frozen flag would turn every post-Generate edit into a copy-on-write of the draft).
- Which object carries the status machine at the share boundary (M06-45, M06-53) — ruled: the proposal alone carries `status`; a version is a stateless snapshot, and M06-53's version moving to shared is the proposal's transition taken with its latest version, which the share act's own record names (M06-45 states the machine verbatim on the proposal; a second status on the version would be two machines for one act and a write to an immutable row).
- The status set (M06-45, M06-58) — ruled: draft · shared · accepted · declined · superseded · withdrawn; a person's withdrawal and a lead closed lost or disqualified both take `withdrawn`, the act's actor and cause living in the timeline and audit record (owner ruling 2026-11-13 adds `withdrawn` to M06-45).
- Mark won when a newer version is shared and unanswered (M07-62) — ruled: Mark won pre-fills only from an acceptance of the latest shared version; otherwise the typed value stands and the sheet says "v2 accepted, v3 not answered" (owner ruling 2026-11-13, final review).
- Putting a version in force after Won (M08-50, M11-14) — ruled: the link has no answer after Won, so a person's act on the project — "Put v3 in force", by the lead's owner or the project's manager — records the customer's agreement with who and when; the project gains `proposal_version_id`; paid and part-paid tranche rows stay as they are, the unpaid rows are replaced by the new version's split of what remains, and more collected than the new total is shown as a surplus, never hidden (owner ruling 2026-11-13, final review).
- Parking on a won lead (M07-62, M02-51) — ruled: Mark won clears snoozed and dormant, so the daily sweep never wakes a won lead (owner ruling 2026-11-13, final review).
- Two leads for one customer (M06-58) — ruled: Lead Detail and Mark won name the sibling lead's live proposal, so one customer is never won twice unseen (owner ruling 2026-11-13, final review).
- A share or Negotiate on a lead already at or past the target stage (M06-45) — ruled: `advanceStage`'s `stage_reached` is success and the act completes; a share on a closed lead is refused with Reopen offered (owner ruling 2026-11-13, final review).
- Mark won's sheet (M07-62) — ruled: the acceptance as its proof line (who, when, which link), the final value as a locked figure marked as coming from the accepted proposal, then the payment plan row for row; with no usable acceptance the proof line says why, the value is a field and the plan is the company's default (owner ruling 2026-11-13, approved design).
- Put in force (M08-50, M11-14) — ruled: a sheet that shows the new total, what is already paid and stays, what is left, and the new plan for what is left, before the person confirms that the customer agreed (owner ruling 2026-11-13, approved design).

---

### T-M06-026 · Component line resolution provenance, frozen with the version
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** M06-31 (P0)
**Design:** none — the line record behind step 8
**Why:** a product archived or repriced later never changes what a customer was already sent.
**Depends on:** T-M06-025a

**Requirements (verbatim):**

- **M06-31** (P0) — **Component lines are honest about their resolution and frozen with their version.** Each selected line carries its catalog-resolution provenance (tenant override / tenant item / platform item / custom) and its provenance tier (`F8-02`); component rows are **immutable with their proposal version** — an archived or repriced product never changes an existing version's lines (`M01-42`/`M01-43`, consumed).

**DONE WHEN:**
- Given a component picked from any resolution tier, when the version generates, then the line records its resolution provenance and tier and never changes thereafter (M06-31).

**Settle before the build:**
- The provenance vocabulary (M06-31) — ruled: the shipped `CatalogSource` (`override`, `own_item`, `platform_item`, `pack`; `packages/domain/src/catalog/vocabulary.ts`) plus `saved_part` for `T-M06-034`'s parts and `custom` for a typed line, on the proposal line only (one vocabulary for what the catalog already names).

---

### T-M06-027 · Tenant template consumption and the save-as-template round-trip
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** M06-49 (P0)
**Design:** none — the settings read behind steps 6, 7, 9 and 11
**Why:** a company that never opened Settings still sends a complete proposal on HelioGrid's defaults, and an owner's own settings fill every proposal by themselves.
**Depends on:** T-M06-032

**Requirements (verbatim):**

- **M06-49** (P0) — **Tenant document defaults feed the builder — asked once, consumed everywhere.** The proposal template (cover, sections included, default T&C, bank details — `M01-51`), the timeline template (`M01-52`), the payment-term templates and tenant default (`M01-54`), the message templates (`M01-55`) and the Quick-mode default set (`M01-53`) are consumed by their steps; this module adds the **"Save as template"** round-trips (T&C at step 9) and never defines a second template surface. Template edits never restyle already-generated versions (`F8-15` via `M01-51`, consumed).

Every default is read once, through `packages/domain/src/commerce/effective-settings.ts` (source
`tenant` or `platform`). Message-template settings (`M01-55`) are V2: until they exist the share
words are platform copy (`M06-53`).

**DONE WHEN:**
- Given untouched tenant settings, when a proposal is built, then platform-seeded defaults carry every templated step and no settings visit is required (M06-49; `M01-28` consumed).
- Given the proposal-template settings, when the builder generates a document, then cover, included sections, default terms and bank details come from these settings (or their platform defaults), and the document is titled with the ruled name in every locale (M01-51). → proof: QA (web and phone) save a cover, section set, terms and the printed bank details on `T-M01-019`'s screen, then generate a proposal: each appears, and the document is titled with the ruled name in every language of the set — the proof `T-M01-019` hands here, because its block has no builder
- (M01-52, handed here by `T-M01-019`, whose block has no builder.) → proof: QA (web and phone) a phase order saved on `T-M01-019`'s screen is the order step 6 opens with
- Given a new proposal, when steps 6, 7 and 9 fill, then each holds the company's saved template where one exists and HelioGrid's default where none does; given the rep then edits any of them, then the edit stays on this proposal and the company's settings and every other proposal are unchanged; and given the owner changes a template while the draft is open, then the draft keeps what it holds until the rep taps step 6's or step 7's ↺ Reset, which reads the template in force (M06-12, M06-13, M06-15, M06-18, M06-49).

**Settle before the build:**
- Company terms and the customer's language (M06-15, M06-49) — ruled: the company's own terms in any language beat the platform default; when they are not in the customer's language, the builder says "terms will print in English" (or the language they exist in) (owner ruling 2026-11-13, final review).

---

### T-M06-028 · The single entitlement checkpoint at proposal creation
**Type:** policy · **Tier:** P0
**Status:** planned
**PRD rows:** M06-26 (P0)
**Design:** none — a server-side checkpoint
**Drawn:** case *Plan limit at Generate*.
**Why:** editing, sharing and reading proposals never stop over billing; only creating a new one meets the plan's limit.
**Depends on:** T-M06-032

**Requirements (verbatim):**

- **M06-26** (P0) — **The entitlement checkpoint sits at proposal create — nowhere else in this module.** Per-cycle proposal-creation counts are a tier capacity dimension; enforcement is at **new proposal creation only**, with the ahead-of-the-block disclosure and grace platform billing owns. **Editing, sharing and duplicating existing proposals — and all reads and exports — never pause**, in any billing state (the soft-block law, consumed). No Generate check and no builder step is entitlement-gated.

Platform billing is being redesigned; the shipped gate runs until then. Proposal create declares
its entry in the shipped `RouteBillingMap` and nothing else in the proposal flow is gated.

**DONE WHEN:**
- Given a tenant at its proposal-count limit, when they edit, duplicate or share an existing proposal, then nothing pauses; when they create a new one, then the billing gate behaviour applies (M06-26).

**Settle before the build:**
- When a proposal counts against the plan (M06-26) — ruled: at its first successful Generate, not at draft creation, so an abandoned draft never uses up the limit; a duplicate counts the same way (owner ruling 2026-11-13, final review).
- The shipped billing matrix pauses "Generate/send proposals" in `halted` and `expired` (`packages/domain/src/commerce/soft-block.ts`) — ruled: the shipped matrix stands until the new pricing replaces it; in those two states Generate and share pause while reading, exporting and every customer link keep working (`F5-23`) (owner ruling 2026-11-13, final review).
- What the person sees (M06-26) — ruled: the gate's sheet says the cycle's count is used and when it starts again, lists what still works — edit and share, read and download, customers' links — and offers the plans to a holder of the billing right, or names who can change the plan; the draft stays saved (owner ruling 2026-11-13, approved design).

---

### T-M06-029 · Fact-traceable proposal narrative
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** M06-52 (P0)
**Design:** none — the words the document prints
**Why:** every sentence the customer reads is backed by a figure in the proposal — the document never promises what the numbers do not say.
**Depends on:** T-M06-025a

**Requirements (verbatim):**

- **M06-52** (P0) — **Proposal narrative is fact-traceable.** Where the document carries generated narrative (the cover story, system description, savings prose), **every narrative claim maps to a facts entry** from the proposal's own field set and computed block — no narrative sentence asserts a number or fact that is not in the version's data.

**DONE WHEN:**
- Given generated narrative, when the document renders, then every narrative claim traces to a field or computed value of the version (M06-52).

**Settle before the build:**
- Whether the narrative claim-to-fact mapping is persisted data or a generation-time discipline (M06-52) — pick: generation-time — the narrative is rendered from the version's snapshot through `i18n` templates whose only slots are the version's fields and computed values, so the template is the mapping and nothing is stored beyond the version's PDF artifact (M06-52's source drops the traceability test as implementation detail, and a slot template cannot assert a fact the version lacks; cost if wrong: free-form generated prose would need a stored narrative plus a claim-to-fact map on the version, both additive).

---

### T-M06-030 · The follow-up task on mark-shared, closed when the customer answers
**Type:** integration · **Tier:** P0
**Status:** planned
**PRD rows:** M06-55 (P0)
**Design:** none — a task on My Day
**Drawn:** stop *Track* — the task row under the hero.
**Why:** the next call already exists the moment a proposal goes out, and it disappears the moment the customer answers — nobody chases a customer who already said yes.
**Depends on:** T-M06-025a, T-F5-008

**Requirements (verbatim):**

- **M06-55** (P0) — **An automatic follow-up task on send — always.** *"The moment a proposal goes out, the next action must already exist and be owned"*: marking shared auto-creates a follow-up task on the lead's owner for **two days later** (`S6.happy`'s "+2 days"), carrying its provenance rule (`DOC04.tasks` cited — `modules/M07`'s surface). A proposal unopened for three days is the voice agent's safety-net trigger (`D17`, `S6.wrong.5` — *"this is exactly what the voice agent picks up"*; `modules/M07` owns the agent). **The task closes itself when the customer answers (owner ruling 2026-11-13):** an Accept or a Decline from the link closes the open follow-up task, so nobody chases a customer who already answered; an Accept raises a **Confirm won** task on the lead's owner, due the same day; a Decline raises **Customer declined — call, then mark lost or re-share**, due the same day, so the next action still exists. A lead holds one open proposal follow-up at a time — a re-share moves its due date — every proposal task goes to the lead's current owner (the EPC Owner when the lead has none or its owner is deactivated), and Mark won closes them all.

The task reuses the shipped `task` table and `raiseTask`
(`apps/api/src/modules/crm/crm.raised-tasks.repository.ts`), adding the provenances
`proposal_shared`, `proposal_accepted` and `proposal_declined` to `TASK_PROVENANCES`
(`packages/domain/src/crm/vocabulary.ts`, Law 12). The voice agent's unopened trigger waits with
voice.

**DONE WHEN:**
- Given mark-shared, when it commits, then a follow-up task exists for +2 days owned by the lead's owner, carrying its provenance rule (M06-55).
- Given an open follow-up task from a share, when the customer accepts, then the task is closed and a Confirm won task due today exists on the lead's owner; and given a decline instead, then the task is closed, a Customer declined task due today exists and no Confirm won task exists (M06-55).
- Given a proposal shared twice on one lead, when My Day renders, then one proposal follow-up exists, due two days after the latest share; and given Mark won, when it commits, then no proposal task stays open on the lead (M06-55).

**Settle before the build:**
- Who a link act's task goes to (M06-55) — ruled: the lead's current owner; when the lead has none or its owner is deactivated, the EPC Owner — active members only, the same chain the link's named person uses (`T-F5-001`) (owner ruling 2026-11-13, final review).
- On the proposal (M06-55) — ruled: the open proposal task shows as the first row under the hero with its due date; an accepted proposal also offers *Thank {customer} with a message* (`T-F5-008`) (owner ruling 2026-11-13, approved design).

---

### T-M06-031 · Double-proposal collision — both visible, one withdrawn by a person
**Type:** policy · **Tier:** P0
**Status:** planned
**PRD rows:** M06-58 (P0)
**Design:** none — the withdraw act on Lead Detail
**Drawn:** stop *Lead* → *Two proposals*; sheet *Withdraw one*.
**Why:** two reps never quietly chase one customer; the record shows both and a person withdraws one.
**Depends on:** T-M06-025a

**Requirements (verbatim):**

- **M06-58** (P0) — **Two proposals on one customer is a visible state that must converge.** When the Stage-2 duplicate check did not catch a double-chase (`M02-08` consumed), the customer record shows **both** proposals and **one must be withdrawn** — the withdrawing rep marks their proposal superseded/declined-by-tenant and the lead follows `modules/M02`'s machine. Nothing auto-withdraws; the record makes the collision impossible to miss.

The customer-record surface that shows both proposals and offers the withdraw action is
`SCR-M02-04` (Lead Detail), which is M02's screen; this task owns the withdraw act, the `withdrawn`
transition and the guarantee that nothing auto-withdraws.

**DONE WHEN:**
- Given two proposals on one customer record, when the record renders, then both are visible and each offers the withdraw action (M06-58).

**Settle before the build:**
- The act (M06-58) — ruled: Lead Detail shows a warning and both proposals with their makers; *Withdraw* opens a sheet with that proposal's maker, size, price and state, says what its link will show, and withdraws on confirm (owner ruling 2026-11-13, approved design).

---

## Laws (enforced through screens and review, no standalone build)

These rows constrain what may be built; none of them is a buildable thing on its own. Each is
enforced by the tasks named against it plus review of every M06 surface.

**M06-01** (P0) — **One object, not two.** No separate "quote" exists anywhere in the product: the **proposal** is built in the eleven steps, contains the pricing, and is what gets versioned, sent and accepted. The **BOM** is a different, internal object — engineering/procurement-facing, produced by the design studio, feeding the proposal's price when a design exists (Path A). **Path B has no BOM at all** — just a system cost typed into step 3. Naming is closed by ruling: the entity and every rendered document say **"Proposal"** in every launch locale; "quote"/"quotation" are banned from identifiers and interface strings, with global search accepting them as query aliases only (`F3-11` consumed; the alias surface is `foundations/F6`'s, the customer-link wording `foundations/F5`'s).

*Enforced by:* every M06 screen task (no second "quote" object or surface may appear), and by
string review of identifiers and interface copy in T-M06-001 … T-M06-020 and T-M06-017's document
rendering. The BOM stays the internal object of T-M06-014; Path B never gains one.
*Acceptance covering it (verbatim):* Given any tenant surface or rendered document in any launch locale, when proposal vocabulary renders, then the single term "Proposal" (per-locale per `F3-11`) is used and no "quote"/"quotation" string appears outside search-query aliasing (M06-01).

**M06-32** (P0) — **Component kits were considered and REMOVED — speed comes from duplication, and that decision is carried, not reopened.** The three speeds: **duplicate** (components come with it — the common residential path) · **Path A** (the BOM fills all five) · genuinely new with nothing to duplicate → pick five (*"slower, and rare"*). The lesson is carried verbatim as product law: *"if mandatory components ever start costing minutes rather than seconds, the fix is to make duplicating easier, not to make components optional."*

*Enforced by:* T-M06-010 (no kit concept on the components step), T-M06-019 (duplicate is the
offered speed path) and review — a kit feature is out of scope and the components gate is never
made optional.
*Acceptance covering it (verbatim):* Given a duplicated proposal, when step 8 renders, then every component of the source proposal is present and the counter is already satisfied (M06-32; §M06.8).

---

## Realized elsewhere

**M06-33** (P2, context) — battery-economics modeling is a recommended enhancement, not v1 scope;
the transactional battery flow (capacity, chemistry, cost, tax, warranty) is what this bucket
builds (T-M06-005, T-M06-010).
*realized-by:* no v1 task — `REC` (a future battery-economics layer riding the F8-23
honesty laws).

---

## Disposition index

| Row | Disposition |
|---|---|
| M06-01 | LAW |
| M06-02 | T-M06-001 |
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
| M06-23 | T-M06-022 |
| M06-24 | T-M06-002 |
| M06-25 | T-M06-023 |
| M06-26 | T-M06-028 |
| M06-27 | T-M06-010 |
| M06-28 | T-M06-010 |
| M06-29 | T-M06-010 |
| M06-30 | T-M06-005 |
| M06-31 | T-M06-026 |
| M06-32 | LAW |
| M06-33 | realized-by: no v1 task — REC |
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
| M06-46 | T-M06-021 |
| M06-47 | T-M06-021 |
| M06-48 | T-M06-019 |
| M06-49 | T-M06-027 |
| M06-50 | T-M06-015 |
| M06-51 | T-M06-017 |
| M06-52 | T-M06-029 |
| M06-53 | T-M06-018 |
| M06-54 | T-M06-018 |
| M06-55 | T-M06-030 |
| M06-56 | T-M06-021 |
| M06-57 | T-M06-018 |
| M06-58 | T-M06-031 |
