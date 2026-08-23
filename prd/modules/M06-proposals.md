# M06 · Proposals

Status: draft · Origin mix: SRC throughout, plus exactly one `REC` (`M06-33`, battery-economics
modeling — mirrored in `registers/enhancements.md`; no `BRIEF` scope: every requirement here is
source-derived, and the V2 brief shapes only §2's surface emphasis) · Depends on:
`00-README.md`, `01-product-overview.md`, `02-personas.md`, `04-business-model.md`,
`foundations/F1-global-market-framework.md`, `foundations/F2-roles-and-permissions.md`,
`foundations/F3-localization.md`, `foundations/F4-data-integrity.md`,
`foundations/F7-design-language.md`, `foundations/F8-data-honesty.md`,
`modules/M01-onboarding-and-tenant-config.md`, `modules/M02-crm-and-leads.md`,
`modules/M05-design-studio.md`, `_process/2026-08-03-v2-prd-design.md` §2 (DD2, DD4, DD9, DD10,
DD12) and §10

## 1. Purpose & scope

This module owns the product's commercial document: the **proposal** — how it is built, priced,
versioned, generated and put in front of a customer. The source calls the builder behind it *"the
most-used screen in the product. Every deal passes through it, and many deals never touch the
design studio at all"* (`S6B` preamble), and states the goal in one line: *"a price the customer
trusts, delivered where they will actually read it"* (`S6.rule.one-object`).

Three source decisions define the module's shape.

**One object, not two** (`S6.rule.one-object`). There is no separate "quote" a user manages — the
proposal is the thing: built in eleven steps, containing the pricing, versioned, sent, accepted.
The BOM is a different object: the internal, engineering-facing bill of materials the design
studio produces, which feeds the proposal's price when a design exists. Under ruling `R1` the
naming decision is closed — **"Proposal" everywhere**: entity, interface copy and customer-facing
documents, in every launch locale (`F3-11`).

**One builder, two entry paths** (`D21`, `S6B.rule.two-paths`). Path A arrives from a design and
its numbers are **derived**; Path B goes straight from a lead and its numbers are **estimated or
assumed**. *"The key architectural decision — not two proposal systems, one builder with two entry
points."* The difference is only how much arrives pre-filled — and how honestly the result is
labelled (`foundations/F8`, `F8-20`/`F8-21`).

**Free navigation, validation at Generate** (`R12`). The chip rail jumps anywhere; nothing blocks
step to step; every check the product enforces — mandatory components (`D22`), the payable floor
(`D34`), tranche completeness — fires once, at Generate, as a tappable failure list. The source's
"Next disabled until valid" rule is killed by ruling and appears nowhere in this document as a
live behaviour.

The module owns, as feature areas: the one-object rule, the two paths and the entry points · the
eleven-step builder · Quick mode (`R11`) · navigation, drafts and the Generate gate · the
components step and battery · pricing, the payable and the BOM detail · versions, numbering and
staleness · duplicate and templates · preview, share and the customer-link handoff.

**What this module is explicitly not.**

- It does **not** own the design, the BOM's production, or the component-picker pattern's
  definition. The studio produces the design and its BOM (`modules/M05-design-studio.md`), and
  §M05.6 defines the one shared component picker — this module **references** that section and
  never restates it (DD12).
- It does **not** own the customer's side of the link. Tokenised links, named per-contact links,
  OTP-at-accept, open/accept/decline events and the link lifecycle are
  `foundations/F5-customer-link.md`'s; this module hands the generated proposal to that framework
  and consumes its events.
- It does **not** own the send rail. Per the owner ruling of 2026-08-04 (Q33), the proposal
  link **sends automatically from the tenant's connected transactional channel** where one is
  connected (the transactional lane, `M03-03`), with the composed copy-paste share as the
  fallback — and on the fallback path no delivery state is ever claimed. The V2 brief's
  campaign sending lives in `modules/M03-marketing.md`; `registers/conflicts.md` rows 4 and 8
  carry the Q33 resolution notes.
- It does **not** approve discounts. No approval flow, no request sheet, no "Pending approval"
  status, no per-rep ceilings (`D34`, superseding `D19`; DD2 keeps discount approvals out of core
  scope). The only guard is arithmetic, at Generate.
- It does **not** own follow-up execution, the voice agent, or mark-won/mark-lost — those are
  `modules/M07-sales-execution.md`'s; this module emits the events they consume (`D17`'s
  proposal-unopened trigger, the on-send follow-up task).
- It does **not** own tranche money mechanics past the document: the quoted tranche schedule
  becomes the project's collection schedule at Won inside
  `modules/M11-payments-and-collections.md` (`DOC04.tranches-money-path`).
- It carries **no market facts as constants**: tax scheme and strategy, incentive model,
  certification schemes, currency and formats, phone specification and administrative-area
  vocabulary are market-pack data referenced through F1's pack keys (`F1-02`; the source's named
  instances are the IN pack's — `F1-28`–`F1-35`, `F1-44`, `F1-46`, `F1-49`). The words the source
  uses for tax and incentive fields appear in this document only inside quoted source text.
- No implementation content: no schemas, APIs, storage or rendering stacks, no build sequencing
  (design spec §14/DD4). Where a source row names a mechanism, this document carries the product
  law and drops the mechanism.

## 2. Personas & surfaces

- **Sales Executive** — the module's primary persona. Builds proposals on both paths, applies
  discounts (no approval hop — `D34`), duplicates earlier proposals, shares the document and the
  link, and lives with the consequences: the follow-up task lands on them. Mobile emphasis is
  real, not nominal — the source's Path B scene is *"the rep is standing in their living room"*
  (`S6B.rule.two-paths`), so the builder must be fully workable at phone width (`D2`, `F7-30`;
  the mobile chip-rail contract is `M06-24`).
- **Sales Manager** — everything the Sales Executive does, team-scoped (`F2-08`); watches
  versions and discounts through the audit trail (`F2-22`).
- **EPC Owner** — full capability; also the persona who feels the templates: their logo, T&C,
  timeline and payment-term defaults (`modules/M01`) are what the builder pre-fills.
- **Design Engineer** — builds and edits proposals (the v1 matrix grants it — `F2` §F2.5-M06)
  and is the natural author on Path A; **does not send** (`F2.M06.send-proposals` withholds it):
  *"designer or rep builds, rep sends"* (`S6.rule.one-object` notes).
- **The EPC's customer** — never a user of this module's screens. They meet the proposal as a
  document and a no-login link (`foundations/F5`); what this module owes them is honesty: the
  provenance labels, the indicative disclaimer, and figures that never silently change.

Surfaces: the builder (mobile + web, full parity); BOM detail (Path A only — internal); versions;
preview; share.

## 3. Feature areas

### §M06.1 — One object, two paths & the entry points

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M06-01 | **One object, not two.** No separate "quote" exists anywhere in the product: the **proposal** is built in the eleven steps, contains the pricing, and is what gets versioned, sent and accepted. The **BOM** is a different, internal object — engineering/procurement-facing, produced by the design studio, feeding the proposal's price when a design exists (Path A). **Path B has no BOM at all** — just a system cost typed into step 3. Naming is closed by ruling: the entity and every rendered document say **"Proposal"** in every launch locale; "quote"/"quotation" are banned from identifiers and interface strings, with global search accepting them as query aliases only (`F3-11` consumed; the alias surface is `foundations/F6`'s, the customer-link wording `foundations/F5`'s). | `SRC` — `S6.rule.one-object` (journey Stage 6, verbatim: "ONE OBJECT, NOT TWO"); `R1` (docs/15 §1 — the entity/document half of the ruling lands here; vocabulary law `F3-11`, Task 8) | P0 |
| M06-02 | **Two paths, one builder.** PATH A — WITH DESIGN: survey → studio → BOM → proposal; used when the job is won on engineering credibility, C&I, a complex roof, a customer comparing vendors on technical detail; *"numbers are DERIVED from the model."* PATH B — WITHOUT DESIGN: lead → proposal, straight away; used when the customer wants a number today, small residential, a repeat/standard system, or the rep is standing in their living room; *"numbers are ESTIMATED or ASSUMED."* **Both paths use the same eleven-step builder** — the difference is only how much arrives pre-filled. Provenance tiers are `foundations/F8`'s closed four (`F8-02`); Path B AI fill is `estimated` by definition. | `SRC` — `S6B.rule.two-paths` (verbatim; "not two proposal systems, one builder with two entry points"); `D21` (docs/15: HONORED); `R18` via `F8-02` (consumed) | P0 |
| M06-03 | **What a design pre-fills — the pre-fill table, carried faithfully.** Step 3 Solar System Setup: capacity, type, category **derived** (without a design: typed). Step 4 Performance Metrics: generation from the real shading simulation, **derived** (without: AI auto-fill, **estimated**). Step 5 Financial Data: savings/payback from the real BOM pricing, **derived** (without: AI auto-fill, **estimated**). Step 8 Components: the actual BOM, **derived** (without: picked from catalog, **assumed**). Cost: the real bill of materials (without: a typed lump sum). A typed Path B figure carries the conservative tier per F8's recorded reading (`F8-21`, register Q8). | `SRC` — `S6B.rule.prefill` (the provenance table, verbatim); `R18` tiers via `F8-02`/`F8-21` (consumed; the typed-figure tier question is already open at Q8 and is not re-opened here) | P0 |
| M06-04 | **The honesty rule.** Every number the proposal shows carries its provenance label from the closed four-tier vocabulary (`F8-01`/`F8-02`, consumed); Path B numbers are never presented as calculations — they are *"estimates from capacity and location heuristics."* *"A proposal built without a design must say so. Not in fine print — visibly, on the document"*: every Path B document renders the fixed line, verbatim — **"Indicative proposal. Generation and savings are estimated from system size and location. A site survey and shadow analysis will confirm the final figures."** (`F8-20`, consumed — F8 owns the law; this module owns the builder and the document template that render it.) The source frames this as *"a genuine competitive advantage, not a disclaimer"* — every competitor prints estimates as though they were calculations; being the one product that distinguishes them is the "shows its working" positioning, and it protects the EPC when final numbers are compared to the promise. | `SRC` — `S6B.rule.honesty` (journey Stage 6B, verbatim — the builder/document half; the law half is `F8-20`/`F8-21`, Task 7); `DOC04.proposal-paths` (docs/04: "estimated/assumed + mandatory 'Indicative proposal' disclaimer") | P0 |
| M06-05 | **Three entry points into the builder:** (1) **Lead detail → Create proposal** → the product asks "With design or without?" (Path choice; lead surface `M02-32`, consumed). (2) **Design complete → Generate proposal** — straight into Path A with most steps filled (the `M05-61` hand-off, consumed). (3) **Duplicate an earlier proposal** — every step pre-filled from it, components included: *"the fastest path of all, and how repeat residential jobs should actually work."* Duplicate is a first-class entry point, not buried (§M06.8). | `SRC` — `S6B.rule.entry-points` (verbatim); `S6B.rec.3` (duplicate as primary residential path); `M05-61` (consumed) | P0 |
| M06-06 | **Proposal type: CAPEX or OPEX/PPA — a document type only.** The Proposal Type modal (bottom sheet after step 1: drag handle, "Choose proposal type", two radio cards — **CAPEX**, purchase outright / **OPEX / PPA**, per-unit billing to the customer; Back · Continue) sets the proposal `type`. Per ruling `R17`, **nothing downstream branches on it except the rendered document and the honesty label on financial projections** (`F8-23`, consumed): the document renders per-unit terms; the project after Won tracks the same stages and checklist (`modules/M08`); no recurring invoicing, no meter ingestion (§5). **The type is UNGATED on every tier — final (owner ruling 2026-08-04, Q29)**; no proposal-type entitlement key exists (`M12-20`). | `SRC` — `S6B.step.1` (the modal, verbatim); `R17` (docs/15 §1 — the proposal-type half; the projection-label half is `F8-23`, post-Won behaviour `modules/M08`); `DOC04.proposal-paths` (type enum); ungated confirmed per owner ruling 2026-08-04 (Q29) | P0 |

**Behavior detail.** The path choice is asked only when it is real: entry point (2) never asks —
the design *is* the path. A lead's **segment rides into the proposal** (residential / C&I,
`M02-05` consumed) and is what the source expects to steer Quick-versus-full defaults (§M06.3)
and the market pack's incentive eligibility (§M06.6). The happy path, carried whole
(`S6.happy`): design approved → proposal pre-filled from the BOM → margin applied → preview →
Download PDF + Copy link → the rep pastes into their own messaging app → marks it shared →
a follow-up task is auto-created for two days later → when the customer opens the link, the rep
is notified (§M06.9). On Path B the same shape holds with typed and AI-filled values and the
indicative disclaimer on the document.

**Permissions.** `F2.M06.create-edit-proposals` (EPC Owner, Sales Manager, Sales Executive,
Design Engineer — discounts included, no separate discount permission, `D34`);
`F2.M06.send-proposals` (EPC Owner, Sales Manager, Sales Executive). Proposal visibility follows
lead visibility (`F2.M02.lead-visibility`) — not a new permission domain (F2 §F2.5-M06 notes).

**Edge cases & what-goes-wrong.**
- *Two reps quote the same customer* (`S6.wrong.8`) → the Stage-2 duplicate check should have
  caught it (`M02-08`, consumed); if not, the customer record shows both proposals and one must
  be withdrawn (§M06.9 edge cases carry the surface).
- *A Path B proposal later gets a design* (`S6B.wrong.9`) → upgrade offer, tier change shown
  before commit (§M06.7, `M06-47`).
- *The rep picks "without design" for a lead that has an approved design* → the choice stands
  (free product, honest labels: the proposal is indicative even though a design exists); the
  entry sheet states that a design exists and Path A is available.

**Acceptance criteria.**
- Given any tenant surface or rendered document in any launch locale, when proposal vocabulary
  renders, then the single term "Proposal" (per-locale per `F3-11`) is used and no
  "quote"/"quotation" string appears outside search-query aliasing (M06-01).
- Given a lead with no design, when a proposal is created, then the same eleven-step builder
  opens with nothing pre-filled beyond lead/tenant data, and every AI-filled or typed number
  carries `estimated`/`assumed` — never `derived` (M06-02, M06-03).
- Given a completed design, when Generate proposal is tapped in the studio, then the builder
  opens on Path A with steps 3/4/5/8 pre-filled `derived` per the pre-fill table (M06-03,
  M06-05).
- Given a Path B proposal, when its document or customer-facing rendering is produced, then the
  verbatim indicative line renders on the document in the reading flow at the same visual weight
  as the figures it qualifies (M06-04; `F8-20`).
- Given the Proposal Type modal, when OPEX/PPA is chosen, then only the rendered document and
  the projection honesty label differ downstream — builder steps, checks, versioning and share
  are identical (M06-06).

**Localization notes.** The path-choice sheet, type modal and all builder chrome render per-user
language (`F3-02`); the document renders in the customer's language (`F3-06`); the single-term
vocabulary law binds every locale (`F3-11`).

**Analytics events.** `proposal.created` (path: with_design | without_design | duplicate; type:
capex | opex_ppa; segment), `proposal.path_prompt_shown`, `proposal.type_selected`.

### §M06.2 — The eleven-step builder

The eleven steps, each carried faithfully from its `S6B.step.*` row. Step 8's mechanics live in
§M06.5 (components), and step 3's money block in §M06.6 (pricing) — referenced from their rows
here, never restated. Field-level "required (\*)" markers are completeness metadata consumed by
the Generate gate (§M06.4); they never disable navigation (`R12`).

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M06-07 | **Step 1 · Company:** Phone number \* (locked, linked to the account) · Company name \* · Email address \* (locked, linked) · Website · Company address · Company logo — swatch + Change logo (**max 5 MB · 12×6 cm · PNG/JPG**, validated on upload with the actual limits stated). Values come from the business profile (`M01-31`, consumed — asked once, never re-asked here); the locked fields are edited in tenant settings, not in the builder. After step 1 the Proposal Type modal fires (`M06-06`). | `SRC` — `S6B.step.1` (verbatim); `S6B.wrong.5` (logo validation); `M01-31`/`M01-24` (consumed) | P0 |
| M06-08 | **Step 2 · Achievements (optional, skippable):** About your company (textarea, "shown on proposal cover") · Total capacity installed (kW) → e.g. "200 kW" · Happy customers → "350+" · Cities served → "10+". **Numbers only; units auto-added.** | `SRC` — `S6B.step.2` (verbatim) | P0 |
| M06-09 | **Step 3 · Solar System Setup:** Location — the market pack's administrative-area fields \* (the source's IN instance: State · District; labels are pack data, `F1-22`). System configuration — System capacity kW \* (**0.5–7000**) · System type \* segmented **ONGRID / OFFGRID / HYBRID** · **Battery storage card** ("Add battery backup"; OFFGRID/HYBRID force a ⚠ "Battery required" notice; added state shows a summary with Edit / Remove — §M06.5, `M06-30`) · Category \* — Residential / Commercial · AMC \* — Free AMC · NO AMC · 1–8 years · Commissioning included (toggle). Pricing & subsidies — the scheme-generic money block of §M06.6 (`M06-34`): system cost excl. battery incl./excl. tax, tax % and computed tax amount per the pack's tax scheme (`F1-13`), incentive amount per the pack's incentive model (`F1-14`), discount (**% ⇄ amount** mode switch), Easy-financing EMI toggle (→ EMI interest rate 0–100%, `M06-40`), electricity tariff per kWh \* (**1–50**, tenant currency). **Client-payable summary card** — live (`M06-35`). **Recorded, not resolved:** the step's 0.5–7000 kW capacity range differs from `D1`'s 1 kW→100 MW design-range commitment (docs/11, `modules/M05` scale program); both are carried, the divergence is recorded here and in traceability, and neither is silently normalised. | `SRC` — `S6B.step.3` (verbatim; the source's GST/"PM Surya Ghar"/₹/State-District terms are the IN pack's instances — `F1-28`, `F1-33`, `F1-46`, `F1-22`); range divergence per the extraction ledger's contradiction note (recorded) | P0 |
| M06-10 | **Step 4 · Performance Metrics:** ✦ AI Auto-fill · chart with **Generation / Savings / ROI** tabs · Efficiency / PR % \* (**50–100**) · seasonal generation dip % \* (**0–50**; the source's label for the market's monsoon season is pack vocabulary — `F1-22`, the IN pack names it "Monsoon dip") · Units per kW/day \* · ↺ **Reset to AI values**. AI-filled values are `estimated` (`F8-02`); the energy source of record and its labelling are `F8-08`/`F8-09`'s (consumed — "Real · PVGIS ({database})" vs "Built-in estimate ±10%" ride every generation figure). | `SRC` — `S6B.step.4` (verbatim); `R18`/`R5` via `F8-02`/`F8-08` (consumed) | P0 |
| M06-11 | **Step 5 · Financial Data:** ✦ AI Auto-fill · the same tabbed chart · Yearly savings \* (tenant currency) · Payback years \* · Lifetime savings \* (25-year horizon; the source's compact "lakhs" figure is the IN pack's number format, `F1-46` via `F3-20`) · Electricity inflation % \* (source default ≈6%) · ↺ Reset to AI values. Financial projections carry the projection honesty label and travel with their assumptions (`F8-23`, consumed). | `SRC` — `S6B.step.5` (verbatim); `F8-23` (consumed) | P0 |
| M06-12 | **Step 6 · Project Timeline:** reorderable phase rows (⌃ / ⌄ arrows, 🗑 delete), each with Title \* (char count) + Description \* (char count) · ↺ **Reset to System Default** (the tenant's timeline template, `M01-52` consumed) · ＋ Add Step. | `SRC` — `S6B.step.6` (verbatim); `M01-52` (consumed) | P0 |
| M06-13 | **Step 7 · Payment Terms:** ↺ Reset + the tenant's named tranche templates (platform-seeded splits per `M01-54`, consumed — the source names 10/60/20/10 and 30/60/10) · tranche rows (label + % + ✕) · ＋ Add tranche · progress bar + validation: **"Total allocation must = 100%"** — post-`R12` this is a **Generate-time block**, shown live as feedback and enforced only at Generate with the remainder stated ("12% unallocated", `S6B.wrong.3`). The quoted tranche schedule on the generated version becomes the project's collection schedule at Won (`modules/M11`, `DOC04.tranches-money-path` — cited, M11's half). | `SRC` — `S6B.step.7` (verbatim); `S6B.wrong.3`; `M01-54` (consumed) | P0 |
| M06-14 | **Step 8 · Components:** required — all categories selected before Generate (`D22`). The step surface, sections, counter and edit sheets are §M06.5's rows (`M06-27`–`M06-32`); the picker itself is `modules/M05` §M05.6, cited never restated. | `SRC` — `S6B.step.8` (carried at §M06.5); `D22` | P0 |
| M06-15 | **Step 9 · Terms & Conditions (optional, up to 3 pages):** Add / Skip choice. When added: add-logo toggle · rich-text toolbar + textarea · **"Save as template"** (round-trips into the tenant's template set, `M01-51` consumed) · char count · ≈ PDF page estimate. | `SRC` — `S6B.step.9` (verbatim); `M01-51` (consumed) | P0 |
| M06-16 | **Step 10 · Client Details:** Proposal number \* (**auto, disabled** — server-assigned, `M06-44`) · Prepared by \* · Prepared for \* · Client address \* · Client phone \* (validated against the market pack's phone specification — the source's 10-digit rule is the IN pack's, `F1-49`) · Date \* · Time generated \* · Customer support number. | `SRC` — `S6B.step.10` (verbatim); `DOC02.server-identifiers` via `M06-44`; `F1-49` (consumed) | P0 |
| M06-17 | **Step 11 · Bank Details (optional):** Include-in-proposal toggle · Bank name · Account name · Account number · the pack's bank-routing identifier (the source's IFSC field is the IN pack's banking format — `F1-21`) · note when hidden: **"details save but will not print."** Values come from the business profile (`M01-31`/`M01-51`, consumed). Then the closing bottom sheets: **Add 3D Design prompt** (the Path B → design doorway; a taken-up design later re-enters as the `M06-47` upgrade) and the **"Almost done!" bank prompt** — Yes / No → **Add Bank Details** · ⤓ **Generate Proposal**. | `SRC` — `S6B.step.11` (verbatim); `M01-31` (consumed) | P0 |

**Behavior detail.** Every field commits on blur (`M06-25` — save continuously, never on Next);
"required (\*)" markers feed the Generate gate's completeness check and render as the chip
rail's incomplete-dot state (`M06-21`), never as a disabled Next. AI auto-fill on steps 4/5 is
labelled as what it is and always offers ↺ reset; nothing AI-filled is ever silently committed
as a stronger tier than `estimated`. Step order is a default reading order, not a wall: any step
is reachable at any time in any state (`R12`).

**Permissions.** `F2.M06.create-edit-proposals` for every step, discounts included (`D34`).

**Edge cases & what-goes-wrong.**
- *Logo too large / wrong format* (`S6B.wrong.5`) → validated on upload with the actual limits
  stated (5 MB · 12×6 cm · PNG/JPG) — never a silent failure (M06-07).
- *Tranches ≠ 100%* (`S6B.wrong.3`) → live remainder feedback at step 7; hard block only at
  Generate with the remainder shown ("12% unallocated") (M06-13, M06-23).
- *OFFGRID chosen, no battery* (`S6B.wrong.6`) → ⚠ "Battery required" notice at step 3
  immediately; hard block at Generate (§M06.5, M06-30).
- *AI auto-fill produces implausible values* → the values are editable like any field, the reset
  control restores them, and the labels never claim more than `estimated` (M06-10, M06-11).
- *Client phone fails the pack's format* → stated inline at step 10 and listed at Generate; the
  proposal can still be navigated and drafted (M06-16, M06-23).

**Acceptance criteria.**
- Given step 1, when the account-linked phone or email is rendered, then the field is locked in
  the builder and editable only in tenant settings (M06-07).
- Given step 2 numeric fields, when values are entered, then units are auto-added and non-numeric
  input is refused (M06-08).
- Given step 3, when capacity, type, category, AMC and the money fields are filled, then the
  client-payable card updates live with every change, and every tax and incentive field carries
  the pack's scheme labels — no hard-coded market term (M06-09; `F1-13`/`F1-14`).
- Given step 4 or 5, when ✦ AI Auto-fill runs, then every filled figure is labelled `estimated`,
  the chart tabs render, and ↺ restores the AI values after manual edits (M06-10, M06-11).
- Given step 6, when phases are reordered, added, deleted or reset, then the tenant's timeline
  template is the reset target (M06-12; `M01-52`).
- Given step 7, when tranche percentages do not sum to 100.00, then the gap renders live and
  Generate lists it with the remainder stated (M06-13).
- Given step 8, when it renders, then it is the mandatory-components surface of §M06.5 and its
  picker is `modules/M05` §M05.6's pattern — no second picker, no restated definition (M06-14;
  M06-27, M06-28).
- Given step 9 with T&C added, when "Save as template" is used, then the tenant's template set
  gains it and the page estimate reflects the content (M06-15; `M01-51`).
- Given step 10, when it renders, then the proposal number is present, auto-assigned and
  disabled — never editable, never client-generated (M06-16, M06-44).
- Given step 11 with the include toggle off, when the document generates, then bank details are
  saved but do not print, and the note says exactly that (M06-17).

**Localization notes.** All step titles survive translation expansion — the builder is one of
F3's five densest checked surfaces (`F3-16`, `F3-18`); money, dates and compact figures render
per the pack's formats through the shared implementation (`F3-20`, `F1-46`); documents render
script-correct (`F3-15`).

**Analytics events.** `proposal.step_viewed` (n), `proposal.ai_fill_used` (step),
`proposal.ai_fill_reset` (step), `proposal.template_saved` (tc), `proposal.timeline_reset`.

### §M06.3 — Quick mode

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M06-18 | **Quick mode is committed scope — the same builder, one toggle.** The source's observation: *"Eleven steps is a lot for Path B."* Quick mode shows **only steps 1, 3, 8 and 10** (company, system, components, client), **AI-fills 4 and 5**, and fills **6, 7, 9 and 11 from tenant defaults** (`M01-53`, consumed — timeline template, default tranche template, default T&C, bank details; a tenant who never opened settings still has working platform defaults), with a **"review the rest"** link into the full rail. Full mode stays for C&I. *"Same builder, one toggle"* — never a second proposal system. | `SRC` — `R11` (docs/15 §1, RULING: committed — the M06 half; the tenant-defaults half is `M01-53`, Task 12); `S6B.rec.1` (elevated to committed by R11); `DOC14.quick-mode` ("committed scope"); `UXG-09` | P0 |
| M06-19 | **Entry and loss-free expansion.** The mode is an **entry toggle on the proposal entry surface** (`UXG-09`: "Entry toggle on ProposalEntry"); expanding to the full builder is **loss-free** — everything entered, AI-filled or defaulted in Quick mode is exactly what the full rail shows, nothing re-entered, nothing discarded, and the expansion is available at any point before and after Generate (a generated Quick proposal opens in the full builder for its next version). | `SRC` — `R11` ("loss-free expansion to the full builder"); `UXG-09` ("'expand to full builder' is loss-free") | P0 |
| M06-20 | **The two speed paths never diverge in validation.** Quick mode and duplicate-an-earlier-proposal are the two speed paths, and they **must not diverge in validation behaviour**: both validate exactly once, at Generate, against exactly the same checklist as the full rail (`M06-23`). Quick mode hides steps; it never skips checks. | `SRC` — `R11` consequence ("must not diverge in validation behaviour (see R12)"); `R12`; `UXG-09` ("Validation still only at Generate (R12)") | P0 |

**Behavior detail.** Quick mode's hidden steps are filled, not empty: the Generate gate sees a
complete eleven-step field set. If a tenant default is missing for a hidden step, the platform
default carries it (`M01-28` consumed); if a hidden step fails a Generate check (a tranche
template that no longer sums after an edit elsewhere), the tappable failure jumps into the full
rail at that step — the failure surface *is* the expansion. `UXG-09` designs the surface; this
module owns the behaviour.

**Permissions.** Identical to the full builder — Quick mode is a view of the same object, not a
different capability.

**Edge cases & what-goes-wrong.**
- *Quick-mode proposal fails a Generate check in a hidden step* → the failure list jumps into
  the full rail at the offending step; nothing is silently auto-fixed (M06-20, M06-23).
- *Expansion after AI fill* → steps 4/5 show the AI values with their `estimated` labels and the
  reset control — indistinguishable from having run them in the full rail (M06-19).
- *Tenant defaults changed while a Quick draft is open* → the draft keeps what it was filled
  with; defaults apply at fill time, never retroactively (M06-18; consistent with `M01-51`'s
  no-retroactive-restyle law).

**Acceptance criteria.**
- Given Quick mode, when it opens, then exactly steps 1, 3, 8, 10 are presented, 4/5 are
  AI-filled `estimated`, and 6/7/9/11 carry the tenant defaults (M06-18).
- Given a Quick-mode proposal expanded to the full builder, when the rail renders, then every
  value from Quick mode is present unchanged and nothing must be re-entered (M06-19).
- Given the same proposal content, when Generate runs from Quick mode, from a duplicate, or from
  the full rail, then the identical checklist produces the identical pass/fail result (M06-20).

**Localization notes.** The toggle, the "review the rest" link and the hidden-step summaries are
translated; Quick mode changes nothing about document language behaviour.

**Analytics events.** `proposal.quick_mode_entered`, `proposal.quick_mode_expanded`
(before_generate | after_generate), `proposal.quick_mode_generated`.

### §M06.4 — Navigation, drafts & the Generate gate

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M06-21 | **The builder shell: chip rail + footer.** A **chip rail** (top) carries eleven jump chips, one per step — tap any chip to jump to any step **in any order**; completed steps take the design system's completed-state treatment, incomplete steps a subtle dot (the source's "sage green" is POC-brand colour — superseded; visual facts come from `design/ds-source` per `foundations/F7`). A **footer bar** carries `‹ Back` · `{step} / 11 · {step title}` · `Next ›`, and on the last step the button becomes **Generate PDF ⤓**. | `SRC` — `S6B.rule.shell` (verbatim, post-overlay; palette supersession per docs/15 §3 via F7); `S6B.rec.2` (the dot treatment — adopted by R12) | P0 |
| M06-22 | **Free navigation everywhere; validation at Generate ONLY; the Next-disabled rule is killed.** The source's gating ("Next is disabled until that step's required (\*) fields are valid") is **superseded by ruling and never ships**: Back/Next always navigate, every chip always jumps, and no step ever blocks another. **Generate lists every failure as a tappable jump** ("Fix 2 issues to share") — tapping a failure opens the exact step, with the failing fields highlighted. *"Let people work out of order; validate at the end."* The studio's electrical hard gate is `modules/M05`'s and is deliberately asymmetric — recorded, never normalised. | `SRC` — `R12` (docs/15 §1, verbatim — the free-navigation/validate-at-Generate half lands here; the studio-gate half is `modules/M05`'s, Task 15); `S6B.rec.2` (adopted as the ruling); `S6B.rule.shell` (post-overlay text) | P0 |
| M06-23 | **The Generate gate — one checklist, one place.** Generate runs, in one pass, every check the proposal enforces: (a) **mandatory components** — all categories selected, battery included when present (`D22`; `M06-27`); (b) **battery physical validity** — OFFGRID/HYBRID with no battery blocks (`M06-30`); (c) **the payable floor** — client payable ≤ 0 in the tenant currency blocks (`D34`; `M06-36`); (d) **tranche completeness** — total allocation = 100% (`M06-13`); (e) **required-field completeness** across the eleven steps (`M06-21`'s dots); (f) **the certification/incentive-path check** — where the pack ties the incentive path to a certification scheme, a non-compliant component fails Generate with the failing line named (`F1-34`/`F1-19` consumed; the IN instance is the DCR rule, `F1-44`). Failures render as the tappable list; **below-cost pricing warns and never blocks** (`M06-37`). These are exactly the checks `modules/M05`'s hand-off leaves to this module (`M05-61`, consumed; the studio's readiness card mirrors them early, `M05-58`). | `SRC` — `R12` (Generate-time re-homing of D22/D34); `D22`/`D34` (docs/15: HONORED — enforced at Generate); `DOC04.components-gate`, `DOC04.payable-guard` (docs/04); `CG-1` (docs/12, ADOPT-NOW — the Generate-time check half; catalog flags `M01-34`, pack rule `F1-34`); `M05-61` (consumed) | P0 |
| M06-24 | **On mobile the chip rail must not eat the screen.** Eleven chips at 375 px is a horizontal scroller nobody reads: mobile shows `‹ 3 / 11 · {step title} ›` with a tap opening the full step list as a sheet; desktop keeps the full rail. Full capability on every surface (`D2` via `F7-30`, consumed) — the compression is presentational, never functional. | `SRC` — `S6B.rec.4` (the source's own contract, carried as a requirement — SRC, not a suite REC, per `S4.rec.1`'s precedent; second tag token unbackticked by Task 26 so scanners read one governing tag) | P0 |
| M06-25 | **Save continuously, never on Next.** Someone will lose a network mid-build: **every field commits on blur**; a draft always exists from the first commit and is **resumable from the lead**, shown as **"Proposal draft — 7/11"** on the lead surface. This row is the draft-save specification `R14`'s ledger note asked this module to state. | `SRC` — `S6B.rec.5` (carried as a requirement; its ledger note routes the draft-save specification here); `S6B.wrong.1` (the draft surface) | P0 |
| M06-26 | **The entitlement checkpoint sits at proposal create — nowhere else in this module.** Per-cycle proposal-creation counts are a tier capacity dimension (`BM-12`, consumed); enforcement is at **new proposal creation only**, with the ahead-of-the-block disclosure and grace `modules/M12` owns. **Editing, sharing and duplicating existing proposals — and all reads and exports — never pause**, in any billing state (`BM-32`'s soft-block law, consumed). No Generate check and no builder step is entitlement-gated. | `SRC` — `DOC16.gate.proposal-count` (docs/16 — the placement half; gate mechanics are `modules/M12`'s, Task 23); `BM-12`/`BM-32` (consumed) | P0 |

**Behavior detail.** The Generate failure list is the product's one validation surface for this
module: every failure names its step, its field(s) and its fix in plain language, and jumping
never loses list context (back returns to the remaining failures). The gate is idempotent —
fixing the last failure and tapping Generate again runs the same checklist. Drafts are ordinary
proposals in `draft` status (`M06-45`); abandoning one costs nothing and deletes nothing.

**Permissions.** Navigation and drafts ride `F2.M06.create-edit-proposals`. Generate is the same
grant — generation is not sending. Audit: proposal generate, discount applied (amount, who) and
version creation are audit-log events (`F2-22`, consumed).

**Edge cases & what-goes-wrong.**
- *Rep abandons at step 7* (`S6B.wrong.1`) → draft saved, resumable, visible on the lead as
  "Proposal draft — 7/11" (M06-25).
- *No components selected, Generate tapped* (`S6B.wrong.4`) → hard block; the failure jumps to
  step 8 and highlights exactly which categories are missing (M06-23; §M06.5).
- *Discount drives payable ≤ 0* (`S6B.wrong.2`, `S6.wrong.3`) → warned live at step 3's summary
  card; blocked at Generate with the negative shown (M06-23; §M06.6).
- *Tranches ≠ 100%* (`S6B.wrong.3`) → blocked at Generate with the remainder shown (M06-23).
- *Network lost mid-build* → every blurred field is already committed; the draft resumes when the
  connection returns (M06-25).
- *Creation paused by the entitlement gate* → existing proposals remain fully editable,
  shareable and duplicable; only new creation waits (M06-26).

**Acceptance criteria.**
- Given any step in any completeness state, when any chip or Back/Next is tapped, then
  navigation succeeds — no disabled Next exists anywhere in the builder (M06-21, M06-22).
- Given a proposal with multiple failures, when Generate is tapped, then every failure renders
  as one tappable list ("Fix N issues to share") and each tap lands on the exact step with the
  failing fields highlighted (M06-22, M06-23).
- Given a proposal on the incentive path with a component failing the pack's required scheme,
  when Generate runs, then the check fails naming the component line and the scheme, and
  clearing it (compliant component, or leaving the incentive path) passes (M06-23; `F1-34`).
- Given a 375 px viewport, when the builder renders, then the compressed rail shows
  `‹ n / 11 · title ›` and tapping it opens the full step sheet (M06-24).
- Given a field edited and blurred, when the app is killed and the lead reopened, then the draft
  resumes with that value present and the lead shows "Proposal draft — n/11" (M06-25).
- Given a tenant at its proposal-count limit, when they edit, duplicate or share an existing
  proposal, then nothing pauses; when they create a new one, then the `modules/M12` gate
  behaviour applies (M06-26).

**Localization notes.** Chip labels, failure list and fix copy translated; the failure list is
part of the builder's dense-surface language check (`F3-18`).

**Analytics events.** `proposal.step_jumped` (from, to, via: chip | footer | failure),
`proposal.generate_attempted` (failures: n), `proposal.generate_blocked` (reasons[]),
`proposal.generate_succeeded`, `proposal.draft_resumed`.

### §M06.5 — Components & battery

The component picker — accordion, three entry paths, scheme-keyed badges — is defined **once**,
in `modules/M05-design-studio.md` §M05.6 (DD12). This section cites it and specifies only what
is proposal-specific: the mandatory-components step, its counter and gate, the edit sheets, and
the battery blocks.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M06-27 | **Components are mandatory on every proposal — no lump-sum quotes.** Step 8 carries sections **Panel · Inverter · Cable · Electrical · Structure** (＋ **Battery** when added), each showing **Selected / Empty** status, ＋ add, brand rows (✎ edit / ✕ remove), and count fields for Panel and Inverter. The footer counter — **"Components Selected X/5 ✓"** — *"is the gate, not a status"*: all categories must be selected before Generate (`M06-23`(a)). Path A fills all five from the BOM automatically; a duplicated proposal brings its components; otherwise the rep picks five. | `SRC` — `D22` (docs/15: HONORED — enforced at Generate per R12); `S6B.step.8` (verbatim); `S6B.wrong.4`; `DOC04.components-gate` (docs/04 — its "BOS" naming for the fifth category is carried as the source's synonym for the step's Electrical/Structure split, recorded not normalised) | P0 |
| M06-28 | **Picking uses the one shared picker — cited, never restated.** Browsing, datasheet-PDF extraction, manual specs, resolved-catalog search and scheme-keyed certification badges are `modules/M05` §M05.6's pattern (`M05-37`–`M05-43`, consumed). Inline add is never a dead end: a missing product is added in-flow by single form, datasheet PDF, or **spreadsheet import available at proposal time** (`M01-39`, `M01-40`, `M01-41`, consumed — DD9/DD10), and the new SKU is picked without leaving the builder. | `SRC` — DD12 (design spec §2/§10 — one picker pattern serves studio and proposal); `M05-37` (consumed); `M01-39`/`M01-40`/`M01-41` (consumed) | P0 |
| M06-29 | **The Component Edit sheet (bottom sheet, per type; Brand Name locked):** Panel — Watt Peak Range · Panel Type (Mono PERC / TOPCon / Bifacial / Mono / Poly / HJT / Thin-film) · Product & Performance Warranty. Inverter — Capacity kW · Inverter Type (On / Off / Hybrid) · Warranty. Cable — Cable Type · Specification · Warranty. Electrical — Includes · Standard. Structure — Warranty · Weight per kW · Standard. Battery — Capacity kWh · Chemistry · Warranty. Plus Description (**max 110 chars**). Cancel · Done. | `SRC` — `S6B.step.8` (the edit-sheet spec, verbatim) | P0 |
| M06-30 | **The battery blocks, across the builder.** Step 3 carries the **Battery storage card** ("Add battery backup"; **OFFGRID/HYBRID force a ⚠ "Battery required" notice**; added state = summary with Edit / Remove) opening the **Battery modal** (bottom sheet): Battery capacity kWh (**1–100**) · Cost excl./incl. tax and battery tax % per the pack's tax scheme (`F1-13`) · Cell chemistry — **Lithium LFP / Lithium NMC / Lead-acid / Custom** (Custom reveals free text) · Cancel · Save. When a battery is added, step 8 gains the **Battery** component section (capacity kWh · chemistry · warranty in the edit sheet) and the payable formula includes battery cost (`M06-35`). **OFFGRID with no battery is a hard block — "the system cannot work."** Enforcement point, read from the rulings and stated as the adopted reading: the ⚠ notice renders at step 3 immediately (a notice, not a navigation block — `R12` leaves the builder no earlier blocking point), and the hard block lands at Generate in the failure list (`M06-23`(b)); the source does not state an earlier block and none is invented. | `SRC` — `S6B.rule.battery` (verbatim); `S6B.wrong.6` (its ledger note records the enforcement-point gap; the adopted reading is recorded here and in traceability, consistent with R12's validation-at-Generate-only law); `DOC04.components-gate` ("battery mandatory for offgrid/hybrid — no-battery hard block") | P0 |
| M06-31 | **Component lines are honest about their resolution and frozen with their version.** Each selected line carries its catalog-resolution provenance (tenant override / tenant item / platform item / custom) and its provenance tier (`F8-02`); component rows are **immutable with their proposal version** — an archived or repriced product never changes an existing version's lines (`M01-42`/`M01-43`, consumed). | `SRC` — `DOC04.components-gate` (docs/04 — resolution provenance + immutability); `R13` via `M01-43` (consumed) | P0 |
| M06-32 | **Component kits were considered and REMOVED — speed comes from duplication, and that decision is carried, not reopened.** The three speeds: **duplicate** (components come with it — the common residential path) · **Path A** (the BOM fills all five) · genuinely new with nothing to duplicate → pick five (*"slower, and rare"*). The lesson is carried verbatim as product law: *"if mandatory components ever start costing minutes rather than seconds, the fix is to make duplicating easier, not to make components optional."* | `SRC` — `D22` (the removal, 2026-07-21, in the decision's own text); `S6B.rec.1b` (verbatim) | P0 |
| M06-33 | **Battery-economics modeling — recommended enhancement, not v1 scope.** Competitors model storage economics deeply (backup duration, self-consumption, time-of-use arbitrage); V2 keeps the source's transactional battery flow (capacity, chemistry, cost, tax, warranty) as P0 and **recommends** a battery-economics layer — savings contribution, backup-hours estimate, tariff-window arithmetic — as a later enhancement riding the same honesty laws (projections labelled, assumptions disclosed, `F8-23`). Mirrored in `registers/enhancements.md`; rationale there. | `REC` — design spec §10 (competitive validation 2026-08-03: "battery economics modeling goes to the enhancements register as a REC") | P2 |

**Behavior detail.** Step 8 is a summary-and-gate surface: the sections show state; the picker
does the picking (§M05.6's accordion, search, filters, badges and add paths, on this module's
step). Certification badges are data-driven from the tenant market's declared schemes
(`F1-19`) — a market with no schemes shows no badge chrome. The counter counts categories, not
items; Battery joins the denominator only when a battery exists. Removing the battery at step 3
removes the step-8 section and its line from the payable — with the removal stated, never
silent.

**Permissions.** `F2.M06.create-edit-proposals`; the inline catalog-add paths additionally
require the M01 catalog grant (`F2.M01.add-own-catalog-items`), exactly as the picker's host
studio step does — the picker offers the add path only to holders.

**Edge cases & what-goes-wrong.**
- *No components selected → Generate* (`S6B.wrong.4`) → hard block; jump lands on step 8 with
  missing categories highlighted; the counter is the gate (M06-27, M06-23).
- *OFFGRID, no battery* (`S6B.wrong.6`) → ⚠ at step 3, hard block at Generate — "the system
  cannot work" (M06-30).
- *Needed product missing mid-proposal* → inline add by any of the three paths without leaving
  the builder; extraction is review-before-commit (`M01-39`/`M01-40`, consumed) (M06-28).
- *Product archived while a draft references it* → the draft keeps its components; archive
  affects pickers, never history (`M01-42` consumed; `TC.wrong.4` cited) (M06-31).
- *HYBRID switched back to ONGRID after a battery was added* → the battery card stays (a battery
  is legal on-grid); only the force-notice clears; removing it is the rep's explicit act
  (M06-30).

**Acceptance criteria.**
- Given a Path B proposal with no components, when step 8 renders, then all five sections show
  Empty, the counter reads "0/5", and Generate blocks jumping here (M06-27).
- Given a product missing from the resolved catalog mid-pick, when the rep invokes add-in-flow,
  then single form, datasheet-PDF and spreadsheet-import paths are offered inside the builder,
  the created SKU is picked in place, and the flow never leaves step 8 (M06-28).
- Given a battery added at step 3, when step 8 renders, then a Battery section exists, the
  counter's denominator includes it, and the payable includes battery cost (M06-30, M06-27).
- Given an OFFGRID system with no battery, when step 3 renders, then the ⚠ "Battery required"
  notice is visible immediately; when Generate runs, then it blocks with that failure listed
  (M06-30).
- Given a component picked from any resolution tier, when the version generates, then the line
  records its resolution provenance and tier and never changes thereafter (M06-31).
- Given the edit sheet for any type, when it opens, then Brand Name is locked, the type's fields
  match the census list, and Description caps at 110 characters (M06-29).
- Given a duplicated proposal, when step 8 renders, then every component of the source proposal
  is present and the counter is already satisfied (M06-32; §M06.8).

**Localization notes.** Section names, statuses and sheet fields translated; brand + model names
are never translated (`F3-08` consumed); scheme names render as pack-supplied strings.

**Analytics events.** `proposal.component_selected` (category, resolution),
`proposal.component_edited`, `proposal.battery_added` / `proposal.battery_removed`,
`proposal.components_gate_blocked` (missing[]), `proposal.inline_add_used` (path).

### §M06.6 — Pricing, the payable & the BOM detail

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M06-34 | **The proposal money block is scheme-generic, currency-stamped, and reconciles to the minor unit.** It carries: currency code (stamped at creation, one currency per tenant — `F1-07` consumed) · system cost excl./incl. tax · per-line tax % · a document-level taxes[] breakdown · battery cost + battery tax % · incentive amount · discount (% ⇄ amount) · payable. **Tax strategy comes from the market pack** (`F1-13`: per-line-rate or document-level); no tax column, label or rate is hard-coded. Sums reconcile to the currency's minor unit (`DOC04.currency-stamp` via `F1-07`). | `SRC` — `DOC04.proposal-tax-model` (docs/04, verbatim structure; its named strategies' IN instance is `F1-28`); `F1-07`/`F1-13` (consumed) | P0 |
| M06-35 | **The client-payable summary card is live at step 3:** `cost + battery − incentive − discount = payable`, recomputing on every change, and **warning the moment a discount drives payable to zero or below** — the warning shows the negative figure rather than hiding it. The card is feedback; the block is Generate's (`M06-36`). | `SRC` — `S6B.step.3` (the card, verbatim); `S6B.wrong.2` ("warned at step 3 (live summary card) and blocked at Generate") | P0 |
| M06-36 | **The payable floor is the only hard discount guard.** A discount driving the client-payable figure to **zero or below** in the tenant currency shows the negative and **blocks Generate until corrected** — *"the only hard discount guard."* No approval flow, no request sheet, no queue, no "Pending approval" status, no per-rep ceilings exist anywhere (`D34`, superseding `D19`; revisit-trigger recorded in §5). Whoever can build a proposal can discount and share it immediately. | `SRC` — `D34` (docs/15: HONORED — "payable ≤ ₹0 blocks Generate; below-cost warns"; ₹ is the source's IN instance of the tenant currency); `S6.wrong.3` (verbatim); `DOC04.payable-guard`; `R12` (Generate-time placement) | P0 |
| M06-37 | **Below-cost pricing warns — explicitly, with the loss stated — and never blocks.** When a discount pushes the job below cost (Path A: below the BOM-derived cost; Path B: below the typed cost basis), the product says so **with the loss stated in the tenant currency**, and lets the person proceed: the guard is information, not permission. | `SRC` — `S6.wrong.2` (verbatim; "₹" = tenant currency per the ledger note); `D34` (below-cost warns) | P0 |
| M06-38 | **The incentive amount is computed from the market pack's incentive model — never manually configured per tenant.** Eligibility (segment, capacity, component-certification requirements, geography) and the computation ship as versioned pack data (`F1-14` consumed; the IN instance is `F1-33`'s slab model). The proposal consumes the computed amount into the payable; where the pack ties the incentive path to a certification scheme, the Generate-time check is `M06-23`(f). A pack revision never changes an existing version's figures (`M06-42`). | `SRC` — `CG-2` (docs/12, ADOPT-NOW — the proposal-consumption half; the model itself is `F1-14`/`F1-33`, Task 6); `CG-matrix.14` (the same capability's matrix row — M06 half); `F1-14` (consumed) | P0 |
| M06-39 | **BOM detail (Path A only): the line items behind the price.** Item, spec, qty, unit, rate, tax, total — *"the densest screen in the product — mobile gets a card list with an edit sheet, never a wide table."* **Internal; the customer never sees it.** The margin the happy path applies starts from the price book's default margin %, adjustable per proposal (`M01-48` consumed — its behavior detail names this module's mechanics); the locked BOM money invariants — margin applied below tax, discounts pro-rated pre-tax, and the BOM ↔ proposal reconciliation — are carried market-neutrally as the proposal-money surface of the studio's BOM math (`DOC05.bom-money-locked`, the M06 half; arithmetic authored in `modules/M05` `M05-70`, money path `modules/M11`). | `SRC` — `S6.screen.2` (verbatim; "GST" is the IN tax instance — `F1-28`); `DOC05.bom-money-locked` (the proposal-money half; M05/M11 own theirs) | P0 |
| M06-40 | **The EMI calculator is proposal-side — and it is the whole v1 financing story.** Step 3's Easy-financing toggle reveals the EMI interest rate (0–100%) and the document renders the resulting EMI arithmetic as a labelled projection (`F8-23`). A financing marketplace (lender referral, eligibility, application, status) is explicitly not v1 (§5) — designed-for as a portable capability, never load-bearing. | `SRC` — `S6B.step.3` (EMI fields); `CG-4` (docs/12, DESIGN-FOR — "v1 ships the EMI calculator only"; the marketplace exclusion is §5's) | P0 |
| M06-41 | **Proposal money is never computed on a device and never renders stale as final.** No device prints a customer-facing price computed locally (`F4-04` consumed); a proposal whose inputs changed renders **stale, visibly, with the corrective action offered** — regenerate as a new version — and *"money must never render as final while stale — this is a hard product rule"* (`F8-12`–`F8-15`, `F8-18` consumed; the version mechanics are §M06.7's). | `SRC` — `S6.wrong.1` (the law, quoted — F8 carries it; this row is the module-surface obligation); `F4-04`/`F8-12`–`F8-18` (consumed) | P0 |

**Behavior detail.** One money path: the figures on the builder, the BOM detail, the document,
the link and every export are renderings of one server-computed value set (`F8-24` consumed —
a PDF/link disagreement is a defect, not a display difference). Discount mode (% ⇄ amount)
converts without loss of intent: the entered mode is what versions record. The payable card and
the Generate checks read the same arithmetic — there is no second computation to disagree.

**Permissions.** Pricing, discounts and BOM edits ride `F2.M06.create-edit-proposals` (no
separate discount permission — `D34`); every discount application is audited with amount and
actor (`F2-22`, consumed).

**Edge cases & what-goes-wrong.**
- *Discount below cost* (`S6.wrong.2`) → explicit warning with the loss stated in tenant
  currency; proceeding is allowed (M06-37).
- *Discount drives payable ≤ 0* (`S6.wrong.3`, `S6B.wrong.2`) → negative shown live at step 3;
  Generate blocks until corrected (M06-35, M06-36).
- *Design changed after the proposal was built* (`S6.wrong.1`) → pricing is stale; the proposal
  says so and offers regenerate; nothing renders as final while stale (M06-41; §M06.7).
- *Incentive pack revision lands while a draft is open* → the draft recomputes on the live pack
  version (drafts are not pinned — versions are); generated versions never move (M06-38,
  M06-42).
- *PDF and link disagree on a figure* → defect by definition; one computed value set feeds both
  renderings (`F8-24`; `C5.wrong.3` cited — `foundations/F5`'s key) (behavior detail).

**Acceptance criteria.**
- Given any tenant market, when the money block renders, then tax fields, strategy, incentive
  naming and currency format come from the pack (`F1-13`/`F1-14`/`F1-21`) and no market term is
  hard-coded (M06-34).
- Given cost, battery, incentive and discount values, when any changes, then the payable card
  recomputes live and shows a negative payable the moment it goes ≤ 0 (M06-35).
- Given payable ≤ 0, when Generate runs, then it blocks with the negative shown; given payable
  corrected positive, then the same checklist passes (M06-36).
- Given a discount below cost with payable > 0, when Generate runs, then a warning states the
  loss in tenant currency and generation proceeds if confirmed (M06-37).
- Given an incentive-eligible proposal, when the money block computes, then the incentive amount
  is the pack-computed value — no manual slab entry exists anywhere (M06-38).
- Given the BOM detail on a phone, when it renders, then it is a card list with an edit sheet —
  never a wide table (M06-39).
- Given the EMI toggle on, when the document renders, then EMI figures carry the projection
  label with their assumptions (M06-40).
- Given a stale proposal, when any money renders, then it is stale-marked with regenerate
  offered — never final (M06-41).

**Localization notes.** All money renders through the one shared formatting implementation with
its honesty qualifiers (`F3-20`, `F3-24`); the payable card's arithmetic line reads correctly in
RTL-free Devanagari text runs (`F3-15`); tax/incentive labels are pack strings rendered verbatim.

**Analytics events.** `proposal.discount_applied` (mode, below_cost: bool),
`proposal.payable_negative_warned`, `proposal.bom_opened`, `proposal.bom_line_edited`,
`proposal.emi_enabled`.

### §M06.7 — Versions, numbering & staleness

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M06-42 | **Proposal versions are immutable, append-only and server-numbered.** Each version snapshots the **full eleven-step field set plus the computed money block**, and **pins** the catalog release, price-book version and market-pack version it was computed from (`F8-14` consumed; `M01-43`/`M01-44` consumed). Each version carries a **change note — "what changed and why."** The versions screen shows v1 vs v2 **with what changed, and why**. | `SRC` — `DOC04.proposal-versions-immutable` (docs/04, verbatim); `S6.screen.3`; `S6.wrong.6` (new version, old preserved) | P0 |
| M06-43 | **Sent proposals keep their prices forever.** Once shared, a version's figures never move: it keeps the rate versions, catalog release and pack version pinned at generation; a later price-book change, catalog release or pack revision produces **a new version if the tenant wants new numbers — never an edit of the sent one**. The customer's copy and the tenant's copy always agree. | `SRC` — `S6.wrong.7` (verbatim); `R13` ("sent proposals keep the rate version they were built with"); `F8-15` (consumed; `TC.wrong.5` cited — Task 12's disposition) | P0 |
| M06-44 | **The proposal number is server-assigned — never client-generated.** Numbers come from server-side tenant counters; two users generating at once can never collide (`S6B.wrong.8`). Step 10 shows the number auto-filled and disabled. The same law governs project numbers (`modules/M08`'s half — cited, not disposed here). | `SRC` — `DOC02.server-identifiers` (docs/02, verbatim — the proposal half); `S6B.wrong.8` | P0 |
| M06-45 | **The proposal status machine: draft → shared → accepted / declined, with superseded when a newer proposal replaces it on the lead.** Statuses move by acts, not edits: sharing is the rep's explicit mark (`M06-53`); accept/decline arrive from the customer link (`foundations/F5`); superseded is set when a newer proposal takes over the lead. **The customer link always shows the latest version** (`S6.wrong.6`; the link mechanics are F5's). | `SRC` — `DOC04.proposal-status-machine` (docs/04, verbatim); `S6.wrong.6` | P0 |
| M06-46 | **Staleness is derived, never stored — and a stale proposal says so where it is read, with regenerate offered.** Freshness is the comparison of the version's pinned design fingerprint and input versions against what is live (`F8-13` consumed; the design-side staleness surface is `M05-11`, consumed). A design edit after generation makes the proposal stale (`S6B.wrong.7`): the proposal states it — in the list, on the detail, in the customer-facing rendering — and offers **Regenerate**, which produces a new version through the full Generate gate. | `SRC` — `S6B.wrong.7` (verbatim); `DOC04.proposal-versions-immutable` ("staleness is derived, never stored"); `F8-13`/`F8-18` (consumed); `M05-11` (consumed) | P0 |
| M06-47 | **A Path B proposal that later gets a design is offered an upgrade — showing what changed before committing.** When a design completes on a lead carrying an indicative proposal, the product offers to upgrade the numbers from `estimated`/`assumed` to `derived`, **showing the differences before anything commits** (`F8-05` consumed — a tier change is shown, never silent). Accepting produces a new version on Path A; declining leaves the indicative version untouched. The wider design-supersedes-survey reconciliation is ruled (owner ruling 2026-08-04, **Q24**): the design carries the "survey updated — review needed" marker with the designer notified, drafts on it are blocked from sending until review, and sent versions stay pinned (`M05-13`) — this row covers only the proposal-side upgrade offer the source specifies. | `SRC` — `S6B.wrong.9` (verbatim); `F8-05` (consumed); Q24 ruling noted 2026-08-04 (`M05-13`) | P0 |

**Behavior detail.** Versions are the unit of everything downstream: share, tracking, acceptance
and the tranche schedule all reference a version, not "the proposal". Drafts have no version
number — the first successful Generate creates v1. Regenerate is never automatic: staleness is
stated, the act is a person's. The change note is mandatory at regenerate ("what changed and
why" — pre-filled with the detected input changes, editable by the author).

**Permissions.** Versioning rides `F2.M06.create-edit-proposals`; version creation is an audit
event (`F2-22`, consumed).

**Edge cases & what-goes-wrong.**
- *Customer asks for changes* (`S6.wrong.6`) → new version; the old one is preserved; the link
  shows the latest (M06-42, M06-45).
- *Price book changes after sending* (`S6.wrong.7`) → the sent version keeps its original
  prices; new numbers require a new version (M06-43).
- *Two users generate at once* (`S6B.wrong.8`) → both get server-assigned numbers; no collision
  is possible (M06-44).
- *Design changed after generation* (`S6B.wrong.7`, `S6.wrong.1`) → staleness derived by
  comparison; stated on the object; regenerate offered (M06-46).
- *Design lands on a Path B lead* (`S6B.wrong.9`) → upgrade offered with the diff shown; nothing
  commits silently (M06-47).

**Acceptance criteria.**
- Given a generated version, when any input later changes, then the version's snapshot and money
  block are byte-identical to generation time and a change note exists (M06-42).
- Given a shared version and a subsequent price-book publish, when the version renders anywhere
  (tenant or customer side), then its figures are unchanged (M06-43).
- Given two simultaneous Generates on one tenant, when both complete, then they hold distinct
  server-assigned numbers (M06-44).
- Given a newer proposal on the same lead, when it generates, then the older proposal reads
  superseded and the link serves the latest (M06-45).
- Given a design edit after generation, when the proposal list or detail renders, then the stale
  state is visible with Regenerate offered; no flag was stored — removing the design edit
  restores freshness by comparison alone (M06-46).
- Given a completed design on a lead with an indicative proposal, when the upgrade is offered,
  then the changed figures and their tier changes are shown before commit, and declining
  changes nothing (M06-47).

**Localization notes.** Change notes are tenant-authored content (author's language, per
`F3-10`'s content classes); status labels translated; version timestamps per `F3-22`.

**Analytics events.** `proposal.version_created` (n, trigger: generate | regenerate | upgrade),
`proposal.stale_shown`, `proposal.regenerate_offered` / `proposal.regenerated`,
`proposal.upgrade_offered` / `proposal.upgraded` (accepted: bool).

### §M06.8 — Duplicate & templates

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M06-48 | **Duplicate an earlier proposal is a first-class entry point — and the primary residential path.** Duplicating pre-fills **all steps** from the source proposal — components included (`D22`'s speed answer) — onto a new lead's client details. *"Same as the Sharma proposal, new customer, 6 kW" should take under a minute.* Duplicate *"deserves to be a first-class entry point, not buried"*: it is offered wherever proposals are listed (lead detail, proposal lists) and from any proposal's detail. What duplicate never copies: the proposal number (server-assigned fresh, `M06-44`), the version history, the share state, and the client details of the source customer. | `SRC` — `S6B.rule.entry-points` (entry 3); `S6B.rec.3` (verbatim, carried as a requirement); `D22` (duplicate carries components) | P0 |
| M06-49 | **Tenant document defaults feed the builder — asked once, consumed everywhere.** The proposal template (cover, sections included, default T&C, bank details — `M01-51`), the timeline template (`M01-52`), the payment-term templates and tenant default (`M01-54`), the message templates (`M01-55`) and the Quick-mode default set (`M01-53`) are consumed by their steps; this module adds the **"Save as template"** round-trips (T&C at step 9) and never defines a second template surface. Template edits never restyle already-generated versions (`F8-15` via `M01-51`, consumed). | `SRC` — `M01-51`–`M01-55` (consumed by ID); `S6B.step.9` (the round-trip) | P0 |

**Behavior detail.** Duplicate + Quick mode are the two speed paths and share validation
behaviour by ruling (`M06-20`). A duplicated proposal is an ordinary draft: it walks the same
Generate gate, gets a fresh server number, and re-resolves nothing silently — if a source
component has since been archived, the line stands (archive never breaks references, `M01-42`)
and the picker flags it on the next edit (`M05-43`'s honesty, consumed).

**Permissions.** Duplicating rides `F2.M06.create-edit-proposals` (creation); duplicating never
pauses under the entitlement gate for existing-proposal operations — but the *new* proposal it
creates counts as a creation (`M06-26`).

**Edge cases & what-goes-wrong.**
- *Duplicate from a proposal whose product was archived* → components carried; flagged, not
  swapped; the rep decides (M06-48; `M01-42` consumed).
- *Duplicate across segments* (residential source → C&I target) → values carry; the segment
  rides from the new lead (`M02-05`), and nothing silently rescales.
- *Template edited after drafts exist* → open drafts keep what they were filled with; new fills
  use the new template (`M01-51` consumed) (M06-49).

**Acceptance criteria.**
- Given an existing proposal, when Duplicate is invoked onto another lead, then every step
  arrives pre-filled including all components, client details come from the new lead, and a
  fresh server number is assigned at Generate (M06-48).
- Given untouched tenant settings, when a proposal is built, then platform-seeded defaults carry
  every templated step and no settings visit is required (M06-49; `M01-28` consumed).

**Localization notes.** Template content is tenant data per language (`F3-10`); duplicates carry
the source's content language as-is.

**Analytics events.** `proposal.duplicated` (source_id → new_id),
`proposal.duplicate_component_flagged`.

### §M06.9 — Preview, share & the customer-link handoff

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M06-50 | **Preview shows exactly what the customer will see, before sending** — the rendered document and the link rendering, in the customer's language (`F3-06` consumed), honesty labels, disclaimers and all. Preview is a rendering of the generated version, never a recomputation (`F8-24` consumed). | `SRC` — `S6.screen.4` (verbatim) | P0 |
| M06-51 | **The generated document carries every honesty obligation on its face:** provenance labels per figure (`F8-01`/`F8-02`), the **indicative line verbatim on every Path B document** (`M06-04`/`F8-20`), the remote-survey basis line where the design was built on remote data (`F8-22` consumed), projection labels with assumptions on financial figures (`F8-23`), and energy source labels (`F8-08`/`F8-09`). One computed value set feeds the document, the link and every export (`F8-24`). PDF is an artifact of the version — the link renders the same content as web (`DOC07.pdf-artifact` cited — `foundations/F5`'s key). | `SRC` — `S6B.rule.honesty` (document half); `F8-20`–`F8-24` (consumed); `DOC04.proposal-paths` (mandatory disclaimer) | P0 |
| M06-52 | **Proposal narrative is fact-traceable.** Where the document carries generated narrative (the cover story, system description, savings prose), **every narrative claim maps to a facts entry** from the proposal's own field set and computed block — no narrative sentence asserts a number or fact that is not in the version's data. | `SRC` — `DOC05.narrative-facts` (docs/05, verbatim law; the traceability-test mechanism is implementation detail, dropped) | P0 |
| M06-53 | **Share sends from the tenant's connected transactional channel — with Download PDF, Copy link and the composed message as the always-available manual path (owner ruling 2026-08-04, Q33).** With a connected official channel (the `modules/M03` connection), the share act sends the customer link from that channel under the transactional template class, with the channel's honest delivery states; the share sheet also always offers the rendered PDF, the customer link and a composed message from the tenant's message templates (`M01-55` consumed) with copy-to-clipboard and a deep link into the rep's own messaging app — the **fallback whenever no channel is connected**, on which the rep pastes and sends themselves and no delivery is claimed. **Marking it shared is what starts the clock**: the explicit "mark shared" act (or the automatic send, which marks it in the same act) moves the version to `shared`, timestamps the funnel, and arms the tracking and follow-up behaviours. | `SRC` — `S6.screen.5` (the sheet's actions); `D32`'s manual-only rule superseded for the transactional lane by owner ruling 2026-08-04 (Q33); `DOC07.messaging-manual` (the fallback path's reference behaviour) | P0 |
| M06-54 | **Link tracking is open-honest: shared → opened → viewed-for-how-long — and delivery states exist only where the product's own connected channel sent (owner ruling 2026-08-04, Q33).** Opens are tracked because the link is ours, and they remain the evidence of record. Where the share sent from the tenant's connected channel (`M06-53`), that channel's delivery states are shown as it reports them; on the copy-paste fallback there is **no delivered state** — *"we do not control the sending, so we cannot know it arrived. Only that the link was opened."* Per-contact named links, per-link open attribution and the (default-off) OTP-at-accept are `foundations/F5`'s; when the customer opens the link, **the rep is notified** (`S6.happy`; notification type `proposal_opened`, `foundations/F6` cited). | `SRC` — `S6.screen.6` (the honesty rule — now governing the fallback path per owner ruling 2026-08-04, Q33); `D32` (opens tracked; superseded for connected-channel sends); `R6` (cited — F5's slice, Task 20) | P0 |
| M06-55 | **An automatic follow-up task on send — always.** *"The moment a proposal goes out, the next action must already exist and be owned"*: marking shared auto-creates a follow-up task on the sending rep for **two days later** (`S6.happy`'s "+2 days"), carrying its provenance rule (`DOC04.tasks` cited — `modules/M07`'s surface). A proposal unopened for three days is the voice agent's safety-net trigger (`D17`, `S6.wrong.5` — *"this is exactly what the voice agent picks up"*; `modules/M07` owns the agent). | `SRC` — `S6.rec.1` (verbatim, already reflected in `S6.happy` — carried as a requirement); `S6.happy` (+2 days task); `D17`/`S6.wrong.5` (cited — M07's trigger) | P0 |
| M06-56 | **The customer sees one recommended system by default.** Where the design has variants, exactly one is recommended (`M05-79`/`M05-80`, consumed — authored in the studio); the proposal and its customer-facing rendering present the recommended design by default, with variants shown only when the designer added them for a price-sensitive or undecided customer. The customer-side compare surface is `foundations/F5`'s. | `SRC` — `D16` (docs/15: HONORED — the customer-facing half lands here with F5; the authoring half is `M05-79`/`M05-80`, Task 15) | P0 |
| M06-57 | **A wrong customer number fails visibly — now literally, on the connected-channel path (owner ruling 2026-08-04, Q33).** The source says: *"Customer's WhatsApp number is wrong → delivery fails visibly; offer SMS or email."* With the transactional lane sending from the tenant's connected channel (`M06-53`), the channel's failure report **is** the visible delivery failure, and the product offers the send on an alternative connected channel (SMS/email) or the composed manual path. On the copy-paste fallback the product still cannot see delivery fail, and the v1-honest surface stands: the client phone is format-validated at step 10 (`M06-16`); a link never opened is visible in tracking (`M06-54`) and prompts the rep, with the composed message re-offered for an alternative channel the rep sends themselves. The internal contradiction `registers/conflicts.md` row 8 recorded is resolved by the ruling — the promise and the architecture now agree on the connected-channel path. | `SRC` — `S6.wrong.4` (verbatim — literal on the connected path per owner ruling 2026-08-04, Q33); `D32`/`S6.screen.6` (governing the fallback); `registers/conflicts.md` row 8 (resolution noted) | P0 |
| M06-58 | **Two proposals on one customer is a visible state that must converge.** When the Stage-2 duplicate check did not catch a double-chase (`M02-08` consumed), the customer record shows **both** proposals and **one must be withdrawn** — the withdrawing rep marks their proposal superseded/declined-by-tenant and the lead follows `modules/M02`'s machine. Nothing auto-withdraws; the record makes the collision impossible to miss. | `SRC` — `S6.wrong.8` (verbatim; the lead-side close semantics are `modules/M02`/`modules/M07`'s — cited, not restated) | P0 |

**Behavior detail.** The share sheet is the module's boundary: past "mark shared", the customer
link lifecycle (named links, OTP-at-accept above the tenant threshold, accept/negotiate/decline
events, acceptance attribution) belongs to `foundations/F5`, and this module consumes the
events — `accepted` notifies the rep, **who still marks Won** (human confirms;
`DOC04.accepted-human-confirms` cited — F5/M02's halves). Negotiate → the rep applies the
discount and re-shares the same day — no approval hop exists to make the customer wait
(`C8` cited — F5's key). The C-journey expectations of the link surface (single-session evening
reading, the 3D view moment, PDF-too-large) are `foundations/F5`'s slice (`C5`, `C5.wrong.1`
cited) — this module's obligation to them is the one-value-set law and honest labels.

**Permissions.** Preview rides `F2.M06.create-edit-proposals`; Download PDF, Copy link and mark
shared ride `F2.M06.send-proposals`. Share and link events are audit-log events (`F2-22`).

**Edge cases & what-goes-wrong.**
- *Customer never opens it* (`S6.wrong.5`) → tracked; visible; the voice agent's unopened-3d
  trigger picks it up (`modules/M07`) (M06-54, M06-55).
- *Wrong number* (`S6.wrong.4`) → per M06-57: on the connected-channel path the channel's
  failure report is shown and an alternative channel offered; on the fallback path, validation
  at entry, non-opening visible, alternative-channel composition offered — and there the app
  never claims to see delivery fail (M06-57, Q33 ruling).
- *Customer asks for changes* (`S6.wrong.6`) → new version; link shows latest (§M06.7).
- *Two reps, one customer* (`S6.wrong.8`) → both proposals visible on the customer record; one
  is withdrawn by a person (M06-58).
- *Silence after Accept* (`C8.wrong.1` cited — F5's key) → the link's own confirmation state is
  immediate, and the confirmation message sends automatically from the connected transactional
  channel (`F5-48`, owner ruling 2026-08-04 Q33); with no channel connected, the composed
  message is the fallback a person sends.

**Acceptance criteria.**
- Given a generated version, when preview renders, then it is pixel-for-content identical to
  what the customer's rendering will show, in the customer's language (M06-50).
- Given any Path B version, when document or link render, then the verbatim indicative line is
  present in the reading flow; given a remote-survey-based design, then the basis line renders
  (M06-51).
- Given generated narrative, when the document renders, then every narrative claim traces to a
  field or computed value of the version (M06-52).
- Given the share sheet with a connected transactional channel, when the share sends, then it
  goes from the tenant's official channel under the transactional template class and the same
  act marks the version shared; and given no connected channel, then Download PDF + Copy link +
  composed message are offered, nothing sends, and only the explicit mark-shared act changes
  status and starts the clock (M06-53, owner ruling 2026-08-04 Q33).
- Given a shared proposal, when tracking renders, then states are shared → opened → viewed-for-
  how-long, delivery states appear only as the connected channel reported them, the fallback
  path shows no delivered state anywhere, and an open notifies the rep (M06-54).
- Given mark-shared, when it commits, then a follow-up task exists for +2 days owned by the
  sender, carrying its provenance rule (M06-55).
- Given a design with variants, when the customer-facing rendering is produced, then exactly one
  recommended system shows by default (M06-56).
- Given a client phone that fails the pack's format, when step 10 commits, then the failure is
  stated at entry; given a connected-channel send that the channel reports failed, then the
  failure is shown and an alternative channel offered; and given a fallback-path share never
  opened, then the non-opening is visible, the composed message is re-offered for an
  alternative channel the rep sends, and no fallback surface claims a delivery state (M06-57,
  Q33 ruling).
- Given two proposals on one customer record, when the record renders, then both are visible and
  each offers the withdraw action (M06-58).

**Localization notes.** Document and link render in the customer's language (`F3-06`); the
composed share message uses the tenant's template for the recipient-appropriate language
(`M01-55`, F3's conservative missing-language rule); PDF renders script-correct — broken
conjuncts are unacceptable in a commercial document (`F3-15`).

**Analytics events.** `proposal.previewed`, `proposal.pdf_downloaded`, `proposal.link_copied`,
`proposal.marked_shared`, `proposal.share_message_copied` (channel_hint),
`proposal.withdrawn`, `proposal.followup_task_created` (auto).

## 4. Cross-module contracts

**This module consumes:**
- `modules/M05-design-studio.md` — the Generate hand-off: numbers + captures + BOM to Path A
  (`M05-61`); the shared component-picker pattern (§M05.6, DD12 — referenced, never restated);
  design→proposal staleness (`M05-11`); variants and the single recommendation
  (`M05-79`/`M05-80`); the readiness card that mirrors this module's Generate checks early
  (`M05-58`).
- `modules/M01-onboarding-and-tenant-config.md` — business profile (`M01-31`, prompted at first
  send `M01-24`); proposal/timeline/tranche/message templates and the Quick-mode default set
  (`M01-51`–`M01-55`, `M01-53`); the resolved catalog, inline add and spreadsheet import at
  proposal time (`M01-39`–`M01-41`); archive/release/rate-version laws (`M01-42`–`M01-44`).
- `modules/M02-crm-and-leads.md` — the lead as parent (`M02-32`); segment riding to the proposal
  (`M02-05`); the dedupe sheet that should prevent double-chases (`M02-08`); the funnel stage
  the proposal advances (`M02-41`); timeline events (`M02-35`).
- `foundations/F1` — pack keys consumed by ID throughout: `F1-07` (currency), `F1-13` (tax
  scheme/strategy), `F1-14` (incentive model), `F1-19`/`F1-44` (certification schemes),
  `F1-21`/`F1-46` (formats), `F1-49` (phone spec), `F1-11` (pack versioning as a staleness
  input), `F1-34` (the incentive-path certification rule this module's gate enforces).
- `foundations/F2` — `F2.M06.create-edit-proposals`, `F2.M06.send-proposals`; lead-visibility
  scoping; the audit obligations (`F2-22`).
- `foundations/F3` — customer-language documents (`F3-06`), the naming law (`F3-11`),
  script-correct rendering (`F3-15`), dense-surface checks (`F3-16`/`F3-18`), money rendering
  (`F3-20`/`F3-24`).
- `foundations/F4` — the server-owns-money law (`F4-04`): no device computes or finalises a money
  figure, and business identifiers (the proposal number, `M06-44`) are server-assigned.
- `foundations/F8` — the whole honesty frame: tiers (`F8-01`–`F8-05`), money-never-stale
  (`F8-12`–`F8-18`), indicative and document disclosures (`F8-20`–`F8-24`).
- `04-business-model.md` — proposal-creation counts as a tier capacity (`BM-12`); the soft-block
  law this module's surfaces obey (`BM-32`).

**This module provides:**
- To `foundations/F5` — the generated version to render (one value set, `F8-24`); the honesty
  labels and disclaimers that must survive onto the link; the latest-version rule (`M06-45`);
  the single-recommendation default (`M06-56`). F5 returns link events (opened, viewed,
  accepted, negotiate, declined) and owns named links + OTP-at-accept (`R6`).
- To `modules/M07-sales-execution.md` — `proposal_sent_plus_2d` follow-up tasks (`M06-55`); the
  unopened-3d agent trigger surface (`D17`); the discount/re-share loop the negotiate path needs
  (no approval hop, `D34`).
- To `modules/M11-payments-and-collections.md` — the accepted version's tranche schedule, which
  becomes the project's collection schedule at Won, same rows (`DOC04.tranches-money-path` —
  M11's mechanics).
- To `modules/M08-projects.md` — the accepted version as the project's commercial basis; the
  server-identifier law's project half (`DOC02.server-identifiers`).
- To `modules/M02` — status/stage events onto the lead and timeline; the withdrawn/superseded
  states the double-chase resolution needs (`M06-58`).
- To `modules/M13-dashboards-and-reporting.md` — proposal analytics events; version/discount
  data for pipeline views (forecast-not-revenue is `D37`/M13's law).
- To `modules/M12-platform-billing.md` — the creation checkpoint (`M06-26`); this module
  guarantees no other entitlement touchpoint exists in the proposal flow.

## 5. Non-goals

- **No discount approval flow — of any kind.** No approval hop, no request sheet, no queue, no
  "Pending approval" status, no per-rep ceilings. The only guard is arithmetic at Generate
  (`M06-36`). v1 rationale, carried from the decision: the approval hop was a known bottleneck,
  and permission to build a proposal already implies the commercial trust. Revisit trigger,
  recorded verbatim: *"Revisit if a tenant asks for per-rep discount ceilings"* (`D34`,
  superseding `D19`; DD2 keeps discount approvals out of core scope;
  `DOC00.nongoal-discount-approval` closed here).
- **No campaign machinery, and no fabricated delivery state.** The transactional share sends
  from the tenant's connected channel (owner ruling 2026-08-04, Q33 — `M06-53`); the composed
  copy-paste path is the fallback, and there a person sends and no delivery state exists
  (`M06-54`; `D32` governs that path). The V2 brief's campaign sending is
  `modules/M03-marketing.md`'s scope; `registers/conflicts.md` rows 4 and 8 carry the Q33
  resolution (`DOC00.nongoal-whatsapp-send` closed here).
- **No PPA billing/metering engine.** *"The proposal type exists; metering/billing behind it
  does not"* (`R17`, `DOC00.nongoal-ppa-billing` closed here): no recurring invoicing, no meter
  ingestion; post-Won an OPEX/PPA project tracks the same stages and checklist (`modules/M08`).
- **No component kits.** Considered and removed (2026-07-21, `D22`); duplicate-an-earlier-
  proposal does the same job without a second concept (`M06-32`).
- **No financing marketplace.** v1 ships the EMI calculator only (`CG-4`); lender
  referral/eligibility/application is designed-for as a portable capability, post-launch, never
  load-bearing for margin. Bankable-file exports for C&I lenders (PVsyst-class) are likewise
  designed-for, post-launch (`CG-9` — the studio half is `modules/M05`'s pass-two territory).
- **No customer-side surfaces.** The link, its OTP, its accept flow and its lifecycle are
  `foundations/F5`'s; this module never renders a customer screen.
- **No proposal-side battery-economics engine in v1** — the transactional battery flow is the
  scope; the economics layer is the module's one `REC` (`M06-33`, enhancements register).
- **No second validation surface.** Nothing in this module blocks navigation, disables Next, or
  validates anywhere but Generate (`R12`). The studio's electrical hard gate is `modules/M05`'s
  deliberate asymmetry, not a precedent here.

## 6. Open questions

Mirrored into `registers/open-questions.md`.

- **M06-Q1 (register Q29) — RESOLVED (owner ruling 2026-08-04, Q29).** The OPEX/PPA proposal
  type is **ungated — available on every tier**: the never-gate-features law holds, the tier kW
  ceiling applies naturally at its own checkpoints, and `modules/M12` defines **no
  proposal-type entitlement key** (M12-20). The interim reading is now final text.
