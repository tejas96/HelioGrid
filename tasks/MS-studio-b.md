# Studio Steps 4 · 6 · 7 · 8 (components · editor · proposal · SLD) — engineering tasks

This file carries the engineering tasks for the second half of the Design Studio: Step 4 (components and the compare/decision engine), Step 6 (layout editor, 3D scene and the parametric structure model), Step 7 (captures, the energy and money models, insights, report, narrative and comparison) and Step 8 (SLD sheets and the electrical engine). Task-id prefix: **T-MS-** (this file runs T-MS-201 upward). Source PRD docs: `prd/modules/M05-studio/04-step4-components.md`, `prd/modules/M05-studio/05-step6-editor.md`, `prd/modules/M05-studio/06-step7-proposal.md`, `prd/modules/M05-studio/07-step8-sld.md`.

Binding studio rule (owner ruling S12-1): the POC at `3d_design_studio/` is the starting point, never a from-scratch rebuild. Where the POC already implements the behaviour the task is a **port** — the engineering core moves as-is with its tests as the regression net. Where the surface is redesigned the task is a **screen** and its title says "port + UI rebuild". POC file claims per area come from `prd/_process/studio/inventory/file-claims.md`; defects come from `prd/_process/studio/defect-register.md`.

---

### T-MS-201 · Step 4 Components — port + UI rebuild
**Type:** screen · **Tier:** P0
**PRD rows:** MS4-01 (P0), MS4-02 (P0), MS4-03 (P0), MS4-06 (P0), MS4-07 (P0), MS4-08 (P0), MS4-09 (P0), MS4-10 (P0), MS4-11 (P0), MS4-12 (P0), MS4-14 (P0), MS4-15 (P0), MS4-16 (P0), MS4-17 (P1), MS4-18 (P0), MS4-19 (P0), MS4-20 (P0), MS4-21 (P0), MS4-22 (P0), MS4-24 (P0), MS4-27 (P0), MS4-28 (P0), MS4-29 (P0), MS4-30 (P0), MS4-31 (P0), MS4-32 (P0), MS4-33 (P0)
**DESIGN:** SCR-MS-07 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step4Components.tsx` · `3d_design_studio/src/features/solar-studio/data/catalog.ts` · `3d_design_studio/src/features/solar-studio/data/panels.ts` · `3d_design_studio/src/features/solar-studio/data/inverters.ts` · `3d_design_studio/src/features/solar-studio/lib/__tests__/catalog.test.ts`
**DEFECTS:**
- `CODE.step4-components.20` — panel swap silently resizes placed modules (S4-2: guard dialog both paths → MS4-12).
- `CODE.step4-components.23/.24` — datasheet + manual entry paths are dead captions (S4-1: all three paths real + Excel → MS4-06).
- `CODE.step4-components.37` — no-fit inverter state renders nothing (S4-3: explain + nearest fits → MS4-19).
- `CODE.step4-components.5/.13/.21/.22/.26/.28/.39` — input & state hygiene (7) (S4-4 batch → MS4-02/10/11/14/15/21).
- `CODE.step4-components.29/.32/.42 + availability` — polish (4) (S4-5 batch → MS4-17/16/20/08).
- `BATTERY (absent entirely)` — no battery section/type/catalog in POC (S4-1: first-class section → MS4-24/25).

**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-MS-07-step4-components.md`; they are the specification. Every row of this task is present in that brief, so nothing is re-quoted here.

**DONE WHEN:**
- Given a new design, Then the accordion shows PANEL → CAPACITY → INVERTER → BATTERY, opening at the first incomplete section with summaries on completed headers (MS4-01)
- tapping an open header collapses it (MS4-02)
- Next states the blocking reason in order (MS4-03)
- Given a missing product, Then browse/datasheet-upload/manual all work in-flow, with datasheet extraction reviewed before commit (MS4-06)
- Given a tenant-entered SKU, Then its provenance shows on the row and travels to compare and BOM (MS4-07)
- Given an on-order unit, Then the availability badge shows in the picker, not only in compare (MS4-08)
- Given an IN-market tenant, Then ALMM/DCR flags show and filter as pack-driven data (MS4-09)
- Given an emptied Max-watt filter, Then the list is not emptied and the bound reads as "no maximum" (MS4-10)
- given zero matches, Then the state explains and offers Clear filters (MS4-11)
- Given 24 placed modules, When a different panel is chosen from the picker, Then the guard dialog appears with the count and keep-or-refill choice, and one undo reverts everything (MS4-12)
- Given a typed capacity of 5.37, Then it commits as 5.4 on blur as ONE undo entry; a negative never commits (MS4-14)
- Given no roof drawn, Then Auto states "draw a roof first" (MS4-15)
- Given a bill on file, Then the suggestion banner activates with Enter AND Space and prints grouped currency (MS4-16)
- Given a 4.3 kWp single-phase site with no in-band inverter, Then the reason, the nearest fits and the multi-unit/phase suggestions are shown (MS4-19)
- the list is phase-sorted with badges on incompatible units (MS4-20)
- a typed count above the maximum is refused (MS4-21)
- Given an inverter, Then topology and MLPE selectors show with their hints (MS4-22)
- Given several inverter×count candidates inside the 0.90–1.35 eligibility band, Then the recommendation is the one whose DC/AC ratio is closest to 1.15, with price breaking ties, and the banner states unit/count/phase/ratio without auto-applying (MS4-18)
- Given a hybrid design, Then a battery can be chosen (or explicitly none) via the same three paths (MS4-24)
- Given no roof, Then Compare is disabled with the reason (MS4-27)
- given results, Then the basis paragraph states exactly what was simulated and warnings render (MS4-28)
- the shortlist is certification-first by cost-per-watt with the current choice included (MS4-29)
- all 11 columns compute per candidate (MS4-30)
- infeasible rows cannot be applied and every zero/warn case is explained (MS4-31)
- the recommendation rule and fixed assumptions are visible (MS4-32)
- Apply is one undo step and raises the swap guard (MS4-33)
- MS4-17 is P1 and carries no line in the doc's P0 acceptance list; it is verified against its brief row.
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-202 · Resolved-catalog access door & component spec contracts
**Type:** engine · **Tier:** P0
**PRD rows:** MS4-05, MS4-13, MS4-23
**PORT:** `3d_design_studio/src/features/solar-studio/data/catalog.ts` · `3d_design_studio/src/features/solar-studio/data/panels.ts` · `3d_design_studio/src/features/solar-studio/data/inverters.ts` · `3d_design_studio/src/features/solar-studio/lib/__tests__/catalog.test.ts`
**DEFECTS:**
- `CODE.step4-components.8` — pickers bypass resolved catalog envelope (S4-1: DD12 alignment → MS4-05).

**Requirements (verbatim):**
- **MS4-05** (P0) — Every picker (panel, inverter, battery) reads the tenant's RESOLVED catalog — platform market slice + tenant SKUs + tenant overrides (M01-32..46) — the same door the compare matrix, BOM and design fingerprint use. No component list may read a bundled database directly (S4-1 fixes `.8`; `.74` is the correct consumer pattern).
- **MS4-13** (P0) — Panel spec contract (schema-gated: unique ids, watt > 0, length > width, Voc > Vmp, Isc > Imp, negative temp-coeff, price > 0) — the studio never accepts a module that would break electrical sizing (`.76/.77`).
- **MS4-23** (P0) — Inverter spec contract: AC kW, phases, MPPT windows (count/min-max V/current/strings), max DC V, efficiency, price, warranty — the fields electrical sizing depends on (`.78/.79`).

**DONE WHEN:**
- Given a tenant with own SKUs and price overrides, When any picker opens, Then it lists the RESOLVED catalog — identical to what compare and BOM use (MS4-05)
- Given a catalog entry violating the spec gate, Then it never reaches the picker (MS4-13)
- Given a catalog inverter, Then its MPPT/DC-voltage fields are present for sizing (MS4-23)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-203 · Step 4 derived-state recomputation & compare memo keying
**Type:** engine · **Tier:** P0
**PRD rows:** MS4-34
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step4Components.tsx` · `3d_design_studio/src/features/solar-studio/lib/comparison.ts` · `3d_design_studio/src/features/solar-studio/lib/__tests__/comparison.test.ts`
**DEFECTS:** none recorded against MS4-34 in `prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS4-34** (P0) — Everything derived recomputes from the store (efficiency, energy, cost, subsidy, payback, savings, ROI, ratio, weight) — no cached figures (`.70`); capacity edits re-key the comparison memo, so the compare sheet always reflects the current target (`.71`).

**DONE WHEN:**
- every figure recomputes from the store with no staleness (MS4-34)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-204 · Battery flow-through to BOM, SLD and the proposal components block
**Type:** integration · **Tier:** P0
**PRD rows:** MS4-25
**PORT:** no POC counterpart — `prd/_process/studio/inventory/file-claims.md` claims no battery file (`BATTERY (absent entirely)`, grep: 0 hits); this extends the ported design payload and its downstream consumers rather than porting an existing path.
**DEFECTS:**
- `BATTERY (absent entirely)` — no battery section/type/catalog in POC (S4-1: first-class section → MS4-24/25).

**Requirements (verbatim):**
- **MS4-25** (P0) — Battery selection flows to the BOM, the SLD/electrical step and the proposal's components block; the proposal-side battery card (M06-33 family) consumes it rather than re-asking (S4-1).

**DONE WHEN:**
- Given a hybrid design, Then a battery can be chosen (or explicitly none) via the same three paths (MS4-24), and it flows to BOM, SLD and the proposal components block without re-asking (MS4-25) — the MS4-24 half is T-MS-201's; this task owns the flow-through half.

---

### T-MS-205 · Step 6 Layout Editor — port + UI rebuild
**Type:** screen · **Tier:** P0
**PRD rows:** MS6-01 (P0), MS6-02 (P0), MS6-05 (P0), MS6-06 (P0), MS6-07 (P0), MS6-08 (P0), MS6-09 (P0), MS6-10 (P0), MS6-11 (P1), MS6-12 (P0), MS6-13 (P0), MS6-14 (P0), MS6-16 (P0), MS6-17 (P0), MS6-18 (P0), MS6-19 (P0), MS6-20 (P0), MS6-21 (P0), MS6-22 (P0), MS6-23 (P1), MS6-24 (P0), MS6-26 (P1), MS6-27 (P0), MS6-28 (P0), MS6-29 (P0), MS6-51 (P0), MS6-52 (P0)
**DESIGN:** SCR-MS-08 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step6Editor.tsx` · `3d_design_studio/src/features/solar-studio/screens/step6-erase.ts` · `3d_design_studio/src/features/solar-studio/components/StructurePreview.tsx` · `3d_design_studio/src/features/solar-studio/lib/health.ts` · `3d_design_studio/src/features/solar-studio/store/useHealthSync.ts` · `3d_design_studio/src/features/solar-studio/lib/panel-move.ts` · tests `3d_design_studio/src/features/solar-studio/screens/__tests__/step6-erase.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/health.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/health-coverage.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/panel-move.test.ts`
**DEFECTS:**
- `CODE.step6-layout.65` — structure disclaimer absent on flush tables (S5-1a: always shown → MS6-22).
- `CODE.step6-layout.80` — hardcoded 10 kW studio plan cap + demo upgrade (S5-2: removed, entitlements at save → MS6-29).
- `CODE.step6-layout.18` — Copilot suggestions have no accept/dismiss (S5-4: wired → MS6-05).
- `CODE.step6-layout.46/.29 + scene3d.8/.19 + structures.41/.51 (+2)` — consistency & polish (8) (S5-5 batch → MS6-15/06/31/32/49/21/10; the `.29` (MS6-06), `.51` (MS6-21) and MS6-10 halves land on this screen).
- `CODE.step6-structures.52/.68` — foundation buttons bypass allowed-options; silent clamp (S5-1b: offered ⊆ allowed → MS6-39/47/51; the MS6-51 half — the 2D table-settings surface — lands on this screen).

**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-MS-08-step6-layout-editor.md`; they are the specification. Every row of this task is present in that brief, so nothing is re-quoted here.

Cross-bucket note: three scale-regime rows from `prd/modules/M05-design-studio.md` are dispositioned in `tasks/MS-studio-a.md` as `surface realized-by` this task, and are not in the PRD-rows line above because they live in the M05 module document rather than this file's `MS6-*` range — **M05-89 (P0)**, the paradigm switch that never loses a census tool (engine half T-MS-116); **M05-91 (P1)**, Tier B large-C&I editing, GPU/CPU shading equivalence and server-side simulation (engine half T-MS-118); and **M05-92 (P2)**, Tier C utility scale (engine half T-MS-119, its surface shared with T-MS-206). `ux/briefs/SCR-MS-08-step6-layout-editor.md` carries all three verbatim with their tiers, and the brief states they motivate are drawn here: `block-editing-regime` from M05-89 and `server-sim-provisional` from M05-91. This task builds those surfaces and consumes the engines; it re-derives none of them.

**DONE WHEN:**
- Given roofs and no panels, Then auto-place is offered once with both objectives and a manual escape (MS6-01), replacing layout in one undo step with warnings surfaced (MS6-02)
- Given a Copilot suggestion, Then Accept applies it as one undo step and Dismiss hides it reversibly (MS6-05)
- Given the rail, Then groups are labelled and electrical buttons show counts (MS6-06)
- tap places one module and drag fills a collision-aware table (MS6-07)
- erase hits what was tapped by priority (MS6-08)
- safety elements draw with true-width previews (MS6-09)
- heatmap/strings toggle and heatmap-off restores the prior view (MS6-10)
- Given a selection, Then marquee/drag rules keep tables coherent (MS6-12), nudges work by key and by touch control (MS6-13), and the context bar offers the full action set (MS6-14)
- Given a mixed selection, Then tilt applies per table (MS6-16)
- Given delete, Then dependents cascade and locks refuse edits (MS6-17)
- Given any gesture, Then exactly one undo entry results and Clear-all confirms with counts (MS6-18)
- Given a table, Then its header states rows×cols/panels/kWp with presets and ground-appropriate options (MS6-19)
- azimuth presets face the equator for the site's hemisphere (MS6-20)
- profile cards show section size and kg/m (MS6-21)
- Given ANY structure sheet including flush, Then the disclaimer and engineer line render (MS6-22)
- Given stringing, Then auto/manual/clear work with counts (MS6-24)
- Given validation issues, Then each is tap-to-locate with inline auto-string where applicable (MS6-27), and the step blocks with a plain reason when unsafe (MS6-28)
- Given any design size, Then the studio never caps capacity; entitlement checks happen at Save/Generate (MS6-29)
- Given a ground table, Then only allowed foundations are offered and none is silently corrected (MS6-39/47/51) — this screen carries the MS6-51 half
- the 2D and 3D structure surfaces agree (MS6-51)
- Given any change, Then Health re-scores against the current design and never shows a stale score (MS6-52)
- MS6-11, MS6-23 and MS6-26 are P1 and carry no line in the doc's P0 acceptance list; they are verified against their brief rows.
- Not every brief-listed state closes at this task's P0 tier, and the parity clause below does not make them P0: `block-editing-regime` is P0 (M05-89, engine T-MS-116), while **`server-sim-provisional` is P1** (M05-91, engine T-MS-118) and closes at P1 with that row. M05-92 (P2) contributes no state to this brief today — its Tier C clause here is the provenance line "flat-terrain fallbacks at Tier C carry `assumed` with a visible warning"; the sibling brief `ux/briefs/SCR-MS-09-3d-scene.md` shows the tagging convention for a Tier C state ("terrain-draped (Tier C; flat ground remains the default when no DEM is loaded)"), and if a Tier C state is later added to SCR-MS-08 it closes at P2.
- (Of the three, only M05-89 has a surface-facing Given/When/Then in `prd/modules/M05-design-studio.md`'s §M05.15 acceptance block — "given a design with blocks, when editing tools render, then block/table tools present and per-panel editing remains available inside a table" — and that is the `block-editing-regime` condition here. M05-91's only acceptance line is the ±2% executor equivalence, which is T-MS-118's engine line and not this task's; its editing and simulation clauses, and all of M05-92, carry no dedicated Given/When/Then line, so the requirement text carried verbatim in the brief is the binding criterion for those surface halves.)
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-206 · Step 6 3D scene & in-scene structure card — port + UI rebuild
**Type:** screen · **Tier:** P0
**PRD rows:** MS6-30 (P0), MS6-31 (P0), MS6-32 (P0), MS6-33 (P0), MS6-34 (P0), MS6-35 (P0), MS6-36 (P0), MS6-37 (P0), MS6-44 (P0), MS6-45 (P1), MS6-46 (P0), MS6-47 (P0), MS6-48 (P0), MS6-49 (P0)
**DESIGN:** SCR-MS-09 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/three/Scene3D.tsx` · `3d_design_studio/src/features/solar-studio/three/HeatmapLayer.tsx` · `3d_design_studio/src/features/solar-studio/three/PanelsInstanced.tsx` · `3d_design_studio/src/features/solar-studio/three/StructEditPanel.tsx` · `3d_design_studio/src/features/solar-studio/three/StructureInstanced.tsx` · `3d_design_studio/src/features/solar-studio/three/StructureNodesInstanced.tsx` · `3d_design_studio/src/features/solar-studio/three/LegPlanEditor.tsx` · `3d_design_studio/src/features/solar-studio/three/profile-geometry.ts` · `3d_design_studio/src/features/solar-studio/lib/sun.ts` · `3d_design_studio/src/features/solar-studio/lib/sim-time.ts` · `3d_design_studio/src/features/solar-studio/lib/solar-heatmap.ts` · `3d_design_studio/src/features/solar-studio/lib/structure-view.ts` · `3d_design_studio/src/features/solar-studio/lib/structure-edit.ts` · `3d_design_studio/src/features/solar-studio/lib/leg-plan-edit.ts` · `3d_design_studio/src/features/solar-studio/lib/scene-model.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/sim-time.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/solar-heatmap.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/structure-view.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/structure-edit.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/structure-parametrics.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/leg-plan.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/leg-plan-edit.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/mms-customize.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/monorail.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/foundation-clamp.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/panel-inspector.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/scene-model.test.ts`, `3d_design_studio/src/features/solar-studio/three/__tests__/LegPlanEditor.dom.test.tsx`
**DEFECTS:**
- `CODE.step6-scene3d.6` — no visible orbit/zoom controls in 3D (S5-3: control cluster added → MS6-30).
- `CODE.step6-layout.46/.29 + scene3d.8/.19 + structures.41/.51 (+2)` — consistency & polish (8) (S5-5 batch → MS6-15/06/31/32/49/21/10; the `scene3d.8` (MS6-31), `scene3d.19` (MS6-32) and `structures.41` (MS6-49) halves land on this screen).
- `CODE.step6-structures.52/.68` — foundation buttons bypass allowed-options; silent clamp (S5-1b: offered ⊆ allowed → MS6-39/47/51; the MS6-47 half — the in-scene foundation card — lands on this screen).

**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-MS-09-3d-scene.md`; they are the specification. Every row of this task is present in that brief, so nothing is re-quoted here.

**DONE WHEN:**
- Given the 3D view, Then visible orbit/zoom/reset controls exist alongside gestures (MS6-30)
- the date field shows the user's local date and all sun controls share one time basis (MS6-31)
- real elements cast shadows while decorative ones state their exclusion (MS6-32)
- per-panel access comes from the headless engine over shared geometry (MS6-33)
- shade attribution and blocker focus work (MS6-34)
- in-scene table editing never persists view state (MS6-35)
- heatmap states its metric and floor in the legend (MS6-36)
- share/report/capture surfaces behave per Q27 (MS6-37) — the customer-facing half renders through `ux/briefs/SCR-F5-05-customer-3d-view.md` (T-F5-005), which builds no rows of its own
- Given a foundation choice, Then quantities read as ASSUMED with the "engineer to confirm" note, shape overrides apply only where meaningful, and a too-tall foundation is FLAGGED rather than silently clamped (MS6-47)
- Given the in-scene structure card, Then every control (presets, visibility, profile with specs, foundation, tilt/clearance, MMS, leg plan) commits exactly one undo step through the single choice-applier, and an unavailable card explains why rather than rendering blank (MS6-48)
- Given a ground table, Then only allowed foundations are offered and none is silently corrected (MS6-39/47/51) — this screen carries the MS6-47 half
- parametric controls revert cleanly (MS6-44)
- dual-tilt and monorail assumptions are stated (MS6-46)
- a member click highlights that member (MS6-49)
- MS6-45 is P1 and carries no line in the doc's P0 acceptance list; it is verified against its brief row.
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-207 · Measured roof ranking, fill-engine laws & the shared shadow-free pitch model
**Type:** port · **Tier:** P0
**PRD rows:** MS6-03, MS6-04, MS6-53
**PORT:** `3d_design_studio/src/features/solar-studio/lib/auto-design.ts` · `3d_design_studio/src/features/solar-studio/lib/layout.ts` · `3d_design_studio/src/features/solar-studio/lib/spacing.ts` · `3d_design_studio/src/features/solar-studio/lib/panel-pose.ts` · `3d_design_studio/src/features/solar-studio/lib/shading.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/auto-design.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/layout.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/spacing.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/row-shading.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/shading.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/shading-beam-availability.test.ts`
**DEFECTS:** none recorded against MS6-03, MS6-04 or MS6-53 in `prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS6-03** (P0) — Roof ranking is MEASURED, not assumed: sampled probe panels through the real raycast shading engine × orientation factor — the ranking, per-roof access %, row spacing and every choice are recorded in the decision log (`layout.5/.6`).
- **MS6-04** (P0) — Fill engine laws: per-edge setback inset (multi-region safe), obstruction buffers honouring bridging capability, roof-type default poses, winter-solstice shadow-free row pitch with expert override, canonical plan footprint shared by placement/DRC/render/DXF/SLD, grid snapping anchored to existing panels, candidate validated at its ACTUAL pose (`layout.7–.14`).
- **MS6-53** (P0) — Shadow-free pitch model (winter solstice, hemisphere-correct window) is the shared basis for row spacing and the inter-row card (`layout.92`).

**DONE WHEN:**
- ranking roofs by MEASURED access with every choice logged (MS6-03), and filling within setbacks, bridging-aware buffers and shadow-free pitch using the canonical footprint (MS6-04)
- with row spacing and the inter-row card sharing one pitch model (MS6-53)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-208 · Editor mutation coherence: rotate/azimuth agreement & string→route cascade
**Type:** policy · **Tier:** P0
**PRD rows:** MS6-15, MS6-25
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step6Editor.tsx` · `3d_design_studio/src/features/solar-studio/lib/layout.ts` · `3d_design_studio/src/features/solar-studio/lib/panel-move.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/layout.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/panel-move.test.ts`
**DEFECTS:**
- `CODE.step6-layout.46/.29 + scene3d.8/.19 + structures.41/.51 (+2)` — consistency & polish (8) (S5-5 batch → MS6-15/06/31/32/49/21/10; the `.46` half — rotate leaving the table azimuth behind — is this task's).
- `CODE.step6-layout.32` — Clear strings leaves cable routes → phantom routed cable (S5-1c: routes cleared too → MS6-25).

**Requirements (verbatim):**
- **MS6-15** (P0) — Rotate updates the panels AND the owning table's azimuth so the table settings never disagree with the layout (S5-5.1 fixes `layout.46`).
- **MS6-25** (P0) — Clear strings ALSO clears their cable routes, so no surface can report routed cable for strings that no longer exist (S5-1c fixes `layout.32`).

**DONE WHEN:**
- Given a rotate, Then table settings agree with the layout (MS6-15)
- Given Clear strings, Then no surface reports routed cable afterwards (MS6-25)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-209 · Racking resolution chain, foundation validity & topology/member emission
**Type:** port · **Tier:** P0
**PRD rows:** MS6-39, MS6-40
**PORT:** `3d_design_studio/src/features/solar-studio/lib/structure.ts` · `3d_design_studio/src/features/solar-studio/lib/ground.ts` · `3d_design_studio/src/features/solar-studio/lib/foundation.ts` · `3d_design_studio/src/features/solar-studio/data/profiles.ts` (sitting 4 — the steel section catalog whose kg/m the structural BOM multiplies; `prd/_process/studio/inventory/step6-structures.md` records structure as its only consumer, and `prd/_process/studio/inventory/step4-components.md` §I states it from the owner's side) · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/structure.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/structure-golden.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/ground-mount.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/foundations.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/profiles.test.ts` (sitting 4 — the catalog's guard; it is also the only net over `3d_design_studio/src/features/solar-studio/three/profile-geometry.ts`, which T-MS-206 ports)
**DEFECTS:**
- `CODE.step6-structures.52/.68` — foundation buttons bypass allowed-options; silent clamp (S5-1b: offered ⊆ allowed → MS6-39/47/51; the MS6-39 half — the resolution chain and the read-time correction — is this task's).

**Requirements (verbatim):**
- **MS6-39** (P0) — Racking resolution chain (segment → roof → project → defaults) and surface-conditional foundation defaults; a persisted foundation the surface cannot carry is corrected at read time — and the UI never OFFERS an invalid option in the first place (S5-1b fixes `structures.52/.68`) (`structures.1–.4`).
- **MS6-40** (P0) — Topology dispatch (monorail on flush metal-shed, flush elsewhere, elevated tables otherwise) and member emission: rows grouped, legs/rafters/rails/purlins/braces derived with a deterministic structural id scheme (`structures.5–.8`).

**DONE WHEN:**
- Given a ground table, Then only allowed foundations are offered and none is silently corrected (MS6-39/47/51) — this task carries the MS6-39 half
- topology and members derive deterministically (MS6-40)
- the ported section catalog keeps its array order: `STRUCTURE_PROFILES[0]` (c_channel) is the default four call sites read (Scene3D, Step6Editor ×2, structure-edit), so new sections are appended at the END and that default never moves; the six legacy kg/m values are unchanged, so no project's tonnage moves (`CODE.step4-components.90/.91`, asserted by `profiles.test.ts`). MS6-39's "→ defaults" tail of the resolution chain terminates in this catalog, so a resolver that reorders it silently re-defaults every table.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-210 · Height chain, counted fasteners/foundations & structure DRC
**Type:** port · **Tier:** P0
**PRD rows:** MS6-41, MS6-42, MS6-43
**PORT:** `3d_design_studio/src/features/solar-studio/lib/structure.ts` · `3d_design_studio/src/features/solar-studio/lib/foundation.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/drc-structure.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/foundations.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/foundation-grounding.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/live-structure-geometry.test.ts`
**DEFECTS:** none recorded against MS6-41, MS6-42 or MS6-43 in `prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS6-41** (P0) — Height chain law: the foundation CONSUMES clearance — steel spans from the foundation top, so quoted clearance is what a person actually gets (`structures.9`).
- **MS6-42** (P0) — Fasteners and foundations are COUNTED, not estimated: one anchor spec per leg base by kind, totals summed over the node graph, and steel mass computed per member against its own section (`structures.10/.11/.13`).
- **MS6-43** (P0) — Structure DRC: unsupported members are flagged against required node kinds; dead-load and other structural checks surface as issues (`structures.12/.70`).

**DONE WHEN:**
- quoted clearance accounts for the foundation (MS6-41)
- fasteners and steel are counted per member (MS6-42)
- unsupported members are flagged (MS6-43)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-211 · Scene rendering contracts: instancing, one shared panel frame, GPU cleanup
**Type:** engine · **Tier:** P1
**PRD rows:** MS6-38
**PORT:** `3d_design_studio/src/features/solar-studio/lib/scene-frame.ts` · `3d_design_studio/src/features/solar-studio/three/PanelsInstanced.tsx` (the instanced-draw path, shared with T-MS-206's scene shell) · `3d_design_studio/src/features/solar-studio/three/textures.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/one-frame.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/frame-parity.test.ts`
**DEFECTS:** none recorded against MS6-38 in `prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS6-38** (P1) — Rendering contracts that keep truth and speed together: instanced draws for the whole site, ONE panel frame shared by mesh/engine/2D, shared materials, exact extruded steel sections, structure re-derivation keyed to geometry, position-resolved obstruction grounding, and GPU cleanup on unmount (`scene3d.43–.50`).

**DONE WHEN:**
- MS6-38 is P1 and carries no line in the doc's P0 acceptance list; the one-frame and frame-parity contracts are the acceptance and travel with the ported suite.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-212 · Structure reaches the outputs with its preliminary language
**Type:** integration · **Tier:** P0
**PRD rows:** MS6-50
**PORT:** `3d_design_studio/src/features/solar-studio/lib/structure.ts` · `3d_design_studio/src/features/solar-studio/lib/__tests__/dxf-structure.test.ts` (sitting 5 — the structural-layer regression net over sitting 8's `3d_design_studio/src/features/solar-studio/lib/dxf.ts` and `lib/export-dxf.ts`) · `3d_design_studio/src/features/solar-studio/components/drawing/StructureSheet.tsx` (sitting 2 — the structural drawing sheet this row feeds)
**DEFECTS:** none recorded against MS6-50 in `prd/_process/studio/defect-register.md`. (The paired surface defect `CODE.step6-layout.65` is attached to T-MS-205 at MS6-22; this task owns the outputs the disclaimer travels to.)

**Requirements (verbatim):**
- **MS6-50** (P0) — Structure reaches the outputs: DXF structural layers, structural drawing sheet, BOM lines and the wind-zone display table — all carrying the preliminary/assumed language (`structures.20/.21/.24/.71/.72`).

**DONE WHEN:**
- structure language reaches every output (MS6-50)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-260 · Step 7 Proposal — port + UI rebuild
**Type:** screen · **Tier:** P0
**PRD rows:** MS7-01 (P0), MS7-02 (P0), MS7-03 (P0), MS7-04 (P0), MS7-06 (P0), MS7-07 (P1), MS7-08 (P0), MS7-10 (P0), MS7-11 (P0), MS7-13 (P0), MS7-14 (P0), MS7-20 (P0), MS7-22 (P0), MS7-31 (P0), MS7-34 (P0), MS7-40 (P0), MS7-41 (P0), MS7-42 (P0), MS7-47 (P0), MS7-49 (P0), MS7-51 (P0)
**DESIGN:** SCR-MS-10 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step7Proposal.tsx` · `3d_design_studio/src/features/solar-studio/components/EnergyReportSheet.tsx` · `3d_design_studio/src/features/solar-studio/lib/financing.ts` · `3d_design_studio/src/features/solar-studio/lib/poa.ts` · `3d_design_studio/src/features/solar-studio/lib/comparison.ts` (shared with T-MS-203 and T-MS-267 — this task owns the compare surface, not the ranking core) · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/financing.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/poa.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/comparison.test.ts`
**DEFECTS:**
- `CODE.step7-proposal.2/.9/.17/.58/.68/.127/.128/.132` — report & UI batch (8) (S6-7 → MS7-01/03/06/21/23/42; the `.2` (MS7-01), `.9` (MS7-03), `.17` (MS7-06), `.127/.128/.132` (MS7-42) halves land on this screen).
- `CODE.step7-proposal.33/.27/.34` — cover staleness laundered + invisible (S6-2 → MS7-09/10; the `.34` cover-preview badge and `.27` readiness-card halves — MS7-10 — are this screen's).
- `CODE.step7-proposal.38/.39/.138` — provenance/freshness missing at customer exits; undefined leak (S6-1b → MS7-14/44; the `.38/.39` halves — MS7-14 — are this screen's).
- `CODE.step7-proposal.88/.92/.98/.87` — money: rounded energy, gross lifetime, lease basis, 100% offset (S6-3 → MS7-30/31/33/34; the `.87` self-consumption half (MS7-31) and the `.98` lease-basis half (MS7-34) are this screen's).
- `CODE.step7-proposal.65` — no inverter clipping in the energy chain (S6-6 → MS7-20).

**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-MS-10-step7-proposal.md`; they are the specification. Every row of this task is present in that brief, so nothing is re-quoted here.

**DONE WHEN:**
- Given 3 saved images of 4, When Step 7 opens, Then it resumes at the missing shot and the counter reads 3/4 (MS7-01)
- the four presets seed the scene (MS7-02)
- Given the sun is moved before capture, Then the saved caption records the ACTUAL sun (MS7-03)
- progress/auto-advance/skip behave as specified (MS7-04)
- Given a save failure, Then the error persists into review until resolved (MS7-06)
- Given a layout change after capture, Then affected tiles show stale (MS7-08)
- Given a stale capture set as cover, Then it stays marked stale and readiness reflects it (MS7-09/MS7-10) — this screen carries the MS7-10 half
- Given any blocking electrical issue, Then the verdict blocks and Generate is disabled (MS7-11/MS7-13)
- Given the summary, Then every number carries provenance and no undefined text appears (MS7-14)
- Given a DC/AC ratio above the inverter's limit, Then clipping reduces modelled energy and the surfaces say so (MS7-20)
- transposition assumptions are stated where used (MS7-22)
- the export/self-consumption assumption is visible and editable (MS7-31)
- all four financing options share one basis (MS7-34)
- Given the report, Then it recomputes with a freshness banner (MS7-40), follows the census section order with the provenance line (MS7-41), and monthly values are readable on touch with an honestly scaled loss chart and pack-formatted money (MS7-42)
- Given the comparison, Then candidates run through the real pipelines with the basis stated (MS7-47/49)
- Given a candidate whose strings are infeasible, Then a warning is always shown (never hidden), the note names the specific cause, and the on-screen recommendation rule explains why another row was preferred (MS7-49)
- the basis/decision cards state objective, target and catalog version (MS7-51)
- MS7-07 is P1 and carries no line in the doc's P0 acceptance list; it is verified against its brief row.
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-261 · Capture persistence & the cover-freshness stamp
**Type:** policy · **Tier:** P0
**PRD rows:** MS7-05, MS7-09
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step7Proposal.tsx` (the capture/cover record path, shared with T-MS-260's surface)
**DEFECTS:**
- `CODE.step7-proposal.33/.27/.34` — cover staleness laundered + invisible (S6-2 → MS7-09/10; the `.33` half — promotion laundering the freshness stamp, MS7-09 — is this task's).

**Requirements (verbatim):**
- **MS7-05** (P0) — The first successful capture becomes the cover; captures are overwritten by retaking the same preset (`.14/.35`).
- **MS7-09** (P0) — "Set as cover" preserves the IMAGE's own freshness stamp — promoting a stale capture can never mark it fresh (S6-2 fixes `.33`).

**DONE WHEN:**
- the first capture becomes cover and retakes overwrite (MS7-05)
- Given a stale capture set as cover, Then it stays marked stale and readiness reflects it (MS7-09/MS7-10) — this task carries the MS7-09 half
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-262 · The one energy model: capacity, losses, provenance paths & the lifetime projection
**Type:** engine · **Tier:** P0
**PRD rows:** MS7-15, MS7-16, MS7-17, MS7-18, MS7-19, MS7-23, MS7-24b
**PORT:** `3d_design_studio/src/features/solar-studio/lib/solar.ts` · `3d_design_studio/src/features/solar-studio/lib/poa.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/solar.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/poa.test.ts`
**DEFECTS:**
- `CODE.step7-proposal.91/.60/.66/.53` — escalation/degradation/climate/fallback hardcoded (S6-4: pack-driven → MS7-19; the `.60/.66/.53` halves are `solar.ts`'s and this task's, the `.91` escalation half is `finance.ts`'s and lands on T-MS-264).
- `CODE.step7-proposal.2/.9/.17/.58/.68/.127/.128/.132` — report & UI batch (8) (S6-7 → MS7-01/03/06/21/23/42; the `.68` always-1 access stub — MS7-23 — is this task's).

**Requirements (verbatim):**
- **MS7-15** (P0) — One pure energy function serves every surface (screen, report, narrative, comparison, BOM-adjacent money) — no second model anywhere (`.44/.67`).
- **MS7-16** (P0) — Capacity counts ENABLED modules only; roof area is a union so stacked roofs never double-count (`.45/.46`).
- **MS7-17** (P0) — Equipment losses compose multiplicatively (industry convention), with shading applied to the BEAM component only — never double-counted in the stack (`.47–.49`).
- **MS7-18** (P0) — Two computation paths with honest provenance: measured-weather path (monthly irradiance with diffuse fraction) and built-in-estimate path; the provenance flag follows the ACTUAL path taken, never a persisted string (`.50/.51/.63`), with a stale-pin guard on stored weather (`.64`).
- **MS7-19** (P0) — Climate/commercial constants become MARKET-PACK DATA: degradation default (with the panel's datasheet value used when present), soiling/temperature bands, monsoon months, the analysis horizon and the geographic fallback (S6-4 fixes `.60/.66/.52/.53`).
- **MS7-23** (P1) — Dead/misleading helpers removed: the always-1 access stub (S6-7.8 fixes `.68`) and the unused per-panel POA loop (`.59`) never ship as live surface behavior.
- **MS7-24b** (P0) — Lifetime projection: annual output degrades year-on-year at the pack-driven rate over the pack-driven horizon, and the reported figures (lifetime generation, final-year output, specific yield, annual MWh) derive from the UNROUNDED annual energy — display rounding never feeds another calculation (`.61/.62`, pairs with MS7-30).

**DONE WHEN:**
- Given any surface needing energy, Then it calls the one model (MS7-15)
- disabled modules are excluded and roof area is a union (MS7-16)
- losses compose multiplicatively with shading applied once (MS7-17)
- Given measured weather, Then the provenance says measured; Given none, Then it says built-in estimate — always matching the path actually taken (MS7-18)
- Given a non-India market pack, Then escalation/degradation/climate/horizon/fallback come from that pack (MS7-19)
- Given the 25-year projection, Then it degrades at the pack rate over the pack horizon and every derived figure comes from unrounded energy (MS7-24b)
- MS7-23 is P1 and carries no line in the doc's P0 acceptance list; the removal of the always-1 access stub and the unused per-panel POA loop is the acceptance and travels with the ported suite.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-263 · Measured-weather ingestion: server proxy, source ladder & the all-or-nothing mapper
**Type:** integration · **Tier:** P0
**PRD rows:** MS7-25, MS7-26, MS7-27
**PORT:** `3d_design_studio/src/app/api/pvgis/route.ts` · `3d_design_studio/src/features/solar-studio/lib/pvgis.ts` · `3d_design_studio/src/features/solar-studio/lib/weatherApi.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/pvgis.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/weatherApi.test.ts`
**DEFECTS:** none recorded against MS7-25, MS7-26 or MS7-27 in `prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS7-25** (P0) — Measured-weather ingestion is server-proxied with an explicit source ladder, per-rung timeouts, and a client timeout deliberately longer than the server's so the honest server message wins (`.76–.79`).
- **MS7-26** (P0) — The mapper is ALL-OR-NOTHING with validity windows, so partial or implausible data never becomes a "measured" claim; provenance (database name, years covered) is captured with the data; one shared shape guard protects fetch and persistence (`.80–.83`).
- **MS7-27** (P1) — Weather is fetched at location confirm (MS1-22), never silently on the proposal screen (`.84`).

**DONE WHEN:**
- Given upstream weather is partial, Then nothing is claimed as measured (MS7-26)
- ladder/timeouts behave so the honest message wins (MS7-25)
- MS7-27 is P1 and carries no line in the doc's P0 acceptance list; the fetch-at-location-confirm boundary (MS1-22) is the acceptance and travels with the ported suite.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-264 · The money model: one cost path, subsidy, payback & lifetime savings
**Type:** engine · **Tier:** P0
**PRD rows:** MS7-28, MS7-29, MS7-30, MS7-32, MS7-33
**PORT:** `3d_design_studio/src/features/solar-studio/lib/finance.ts` · `3d_design_studio/src/features/solar-studio/lib/financing.ts` (the cost-basis half, shared with T-MS-260's financing surface) · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/finance.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/financing.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/tariff.test.ts`
**DEFECTS:**
- `CODE.step7-proposal.90/.152` — never-paying system reports "25 years"; ranking sorts the sentinel (S6-1a: no-payback state → MS7-32/50; the `.90` half — MS7-32 — is this task's).
- `CODE.step7-proposal.88/.92/.98/.87` — money: rounded energy, gross lifetime, lease basis, 100% offset (S6-3 → MS7-30/31/33/34; the `.88` rounded-energy half (MS7-30) and the `.92` gross-lifetime half (MS7-33) are this task's).
- `CODE.step7-proposal.91/.60/.66/.53` — escalation/degradation/climate/fallback hardcoded (S6-4: pack-driven → MS7-19; the `.91` escalation half is `finance.ts`'s and is fixed here, inside MS7-32's pack-driven payback iteration; the row itself is T-MS-262's).

**Requirements (verbatim):**
- **MS7-28** (P0) — ONE money path: system cost comes from the BOM total (MS10), never a parallel estimate (`.85`).
- **MS7-29** (P0) — Subsidy is computed from pack rules by capacity/segment/certification eligibility (`.86`, F1).
- **MS7-30** (P0) — Financials read EXACT annual energy, not the rounded display figure (S6-3a fixes `.88`) (`.87`).
- **MS7-32** (P0) — Payback iterates with pack-driven escalation and degradation (S6-4 fixes hardcoded `.91`), and a system that never pays back reports exactly that — never a sentinel year (S6-1a fixes `.90/.140`) (`.89/.94`).
- **MS7-33** (P0) — Lifetime savings are shown net of lifecycle cost (inverter replacement) or explicitly labelled gross with the assumption list attached (S6-3b fixes `.92`).

**DONE WHEN:**
- Given a design, Then system cost equals the BOM total (MS7-28) and subsidy follows pack rules (MS7-29)
- financials use exact energy (MS7-30)
- a never-paying system says so (MS7-32)
- lifetime savings are net or labelled gross with assumptions (MS7-33)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-265 · Insight substrate, the explicit registry & the analyzer set
**Type:** engine · **Tier:** P0
**PRD rows:** MS7-12, MS7-35, MS7-36, MS7-37, MS7-38, MS7-39
**PORT:** `3d_design_studio/src/features/solar-studio/lib/insights/registry.ts` · `3d_design_studio/src/features/solar-studio/lib/insights/analyzers.ts` · `3d_design_studio/src/features/solar-studio/lib/insights/analyzers-access.ts` · `3d_design_studio/src/features/solar-studio/lib/insights/types.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/insights.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/insights-analyzers.test.ts`, `3d_design_studio/src/features/solar-studio/lib/insights/__tests__/analyzers-access.test.ts`
**DEFECTS:**
- `CODE.step7-proposal.109/.24` — commercial + data-quality analyzers missing; implicit registry (S6-5 → MS7-36/12) — both halves are this task's.

**Requirements (verbatim):**
- **MS7-12** (P0) — The analyzer registry is populated EXPLICITLY — never as a side effect of another screen's module load — so review can never read a false green (S6-5 fixes `.24`).
- **MS7-35** (P0) — Analyzer substrate: stable dedupe keys, per-analyzer isolation (a failing analyzer never blanks the review), duplicate-id protection, and memoization keyed to the design (`.103–.107`) — the memo key must include shading when any analyzer reads it (`.108`).
- **MS7-36** (P0) — Commercial and data-quality analyzers are IMPLEMENTED (margin sanity, no-payback, missing tariff/price; estimated-vs-measured irradiance, stale captures, assumed heights, missing provenance) — closing the two declared-but-empty categories (S6-5 fixes `.109`).
- **MS7-37** (P0) — Design analyzers as shipped: roof utilisation, DC/AC ratio, orientation (hemisphere-aware per S2-5.5), row spacing (`.111–.114`).
- **MS7-38** (P0) — O&M/constructability analyzers with their thresholds stated as ASSUMED pack conventions, never code minimums: cleaning access, module replacement, ladder access, inverter access — none of which block (`.115–.120`).
- **MS7-39** (P1) — Insight actions are descriptors the surfaces wire to Accept/Dismiss (MS6-05) (`.110`).

**DONE WHEN:**
- Given the review screen, Then analyzers are registered explicitly and cannot read false-green (MS7-12)
- Given a failing analyzer, Then the rest still run (MS7-35)
- Given a negative margin or an estimated-irradiance proposal, Then commercial/data-quality analyzers flag it (MS7-36)
- design analyzers behave as specified (MS7-37)
- Given a module beyond cleaning reach or an inverter without access clearance, Then the O&M/constructability analyzer raises it with its threshold stated as an ASSUMED convention, and it never blocks proposal generation (MS7-38)
- MS7-39 is P1 and carries no line in the doc's P0 acceptance list; the descriptor contract consumed by MS6-05's Accept/Dismiss on T-MS-205 is the acceptance and travels with the ported suite.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-266 · Proposal narrative: pure beats with symmetric provenance
**Type:** engine · **Tier:** P0
**PRD rows:** MS7-43, MS7-44, MS7-45, MS7-46
**PORT:** `3d_design_studio/src/features/solar-studio/lib/proposal-narrative.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/proposal-narrative.test.ts`
**DEFECTS:**
- `CODE.step7-proposal.38/.39/.138` — provenance/freshness missing at customer exits; undefined leak (S6-1b → MS7-14/44; the `.138` half — MS7-44 — is this task's).
- `CODE.step7-proposal.139` — "% of available sunlight" misstates a floored score (S6-1c → MS7-45).

**Requirements (verbatim):**
- **MS7-43** (P0) — The narrative is a pure function returning fact-carrying beats; it returns nothing rather than inventing a story when there is no design (`.135–.137`).
- **MS7-44** (P0) — Provenance is stated SYMMETRICALLY: the estimate path names itself exactly as the measured path does (S6-1b fixes `.138`, F8-09).
- **MS7-45** (P0) — The solar-access sentence states its true metric or is dropped (S6-1c fixes `.139`); the payback beat reflects the no-payback state rather than sidestepping it (S6-1a, `.140`); the lifetime-money sentence travels with its assumptions (S6-3b fixes `.141`, M06 F8-23 family).
- **MS7-46** (P0) — The narrative consumes the same computed report/financials as every other surface — no third computation (`.142`, MS7-15).

**DONE WHEN:**
- Given no design, Then the narrative returns nothing (MS7-43)
- Given the estimate path, Then the narrative names it (MS7-44)
- Given a shaded array or a never-paying system, Then the sentences state the truth with assumptions attached (MS7-45)
- the narrative reuses the same computed figures (MS7-46)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-267 · Comparison engine: candidate construction & ranking on corrected figures
**Type:** port · **Tier:** P0
**PRD rows:** MS7-48, MS7-50
**PORT:** `3d_design_studio/src/features/solar-studio/lib/comparison.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/comparison.test.ts` (shared with T-MS-203's memo-keying half and T-MS-260's compare surface)
**DEFECTS:**
- `CODE.step7-proposal.90/.152` — never-paying system reports "25 years"; ranking sorts the sentinel (S6-1a: no-payback state → MS7-32/50; the `.152` ranking half — MS7-50 — is this task's).

**Requirements (verbatim):**
- **MS7-48** (P0) — Candidate construction: budgeted fill, inverter recommendation with the nearest-fit fallback, certification-first shortlist by cost-per-watt (`.145–.148`).
- **MS7-50** (P0) — Ranking is computed from corrected figures: no sentinel payback (S6-1a), exact energy (S6-3a) and a correctly named return metric (S6-1b) (fixes `.152`).

**DONE WHEN:**
- Given the comparison, Then candidates run through the real pipelines with the basis stated (MS7-47/49), constructed per the shortlist and inverter rules (MS7-48), ranked on corrected figures with no sentinel (MS7-50), and the basis/decision cards state objective, target and catalog version (MS7-51) — this task carries the MS7-48 and MS7-50 halves; the MS7-47/49/51 halves are T-MS-260's
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-268 · Step 8 SLD & Drawings — port + UI rebuild
**Type:** screen · **Tier:** P0
**PRD rows:** MS8-01 (P0), MS8-02 (P0), MS8-03 (P0), MS8-04 (P0), MS8-05 (P1), MS8-06 (P0), MS8-07 (P0), MS8-08 (P0), MS8-09 (P0), MS8-10 (P0), MS8-11 (P0), MS8-12 (P0), MS8-13 (P0), MS8-14 (P0), MS8-15 (P0), MS8-16 (P0), MS8-17 (P0), MS8-18 (P0), MS8-19 (P0), MS8-21 (P0), MS8-23 (P0)
**DESIGN:** SCR-MS-11 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step8Sld.tsx` · `3d_design_studio/src/features/solar-studio/lib/sld.ts` · `3d_design_studio/src/features/solar-studio/lib/electrical/temps.ts` (the provenance read-out half; the resolver core is T-MS-270's) · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/sld.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/earthing.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/electrical-temps.test.ts` · `3d_design_studio/src/features/solar-studio/components/drawing/index.tsx` (sitting 2 — the sheet renderers this step hosts) · `3d_design_studio/src/features/solar-studio/components/drawing/StructureSheet.tsx` (sitting 2 — the structure tab's sheet, shared with T-MS-212) · `3d_design_studio/src/features/solar-studio/components/__tests__/drawing.dom.test.tsx` (sitting 2) · `3d_design_studio/src/features/solar-studio/lib/drawing-project.ts` + `3d_design_studio/src/features/solar-studio/lib/__tests__/drawing-project.test.ts` (sitting 10 — the shared plan transform MS8-15 rides on)
**DEFECTS:**
- `CODE.step8-sld.2/.13/.37/.39/.41/.42/.43` — drawing accuracy (7): fake zoom, contradictory paper/scale, wrong footprints, phantom legend, static detail, numbering (S7-2 batch → MS8-02/16/17).
- `CODE.step8-sld.35` — SLD prints legacy 10/6 mm2 AC cable while BOM sizes properly (S7-1a: one source of truth → MS8-12).
- `CODE.step8-sld.30` — earth-pit count hardcoded 3 vs BOM's derived 2(+1) (S7-1b → MS8-13).
- `CODE.step8-sld.16/.84` — Step 8 auto-string uses degraded legacy shim, swallows refusals (S7-1c → MS8-07).
- `CODE.step8-sld.52` — rating dialogs cannot represent legally derived values (S7-1d → MS8-21).

**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-MS-11-step8-sld.md`; they are the specification. Every row of this task is present in that brief, so nothing is re-quoted here.

**DONE WHEN:**
- Given the step opens, Then four tabs render with live-derived parameters plus overrides (MS8-01)
- the sheet advertises only capabilities it has, and paper/scale/numbering agree across every sheet (MS8-02)
- the explainer and Edit-Ratings entry behave as specified (MS8-03)
- verification and wind badges reflect real state, the verification chip reading the MS11.3 sign-off record rather than offering a local toggle (MS8-04)
- exports produce the displayed sheet in each format (MS8-06)
- Given no strings, Then the state explains itself, auto-string states any blocking reason, runs the real planner, and surfaces refusals (MS8-07)
- Given a design, Then only real strings are drawn and all of them are (MS8-09); combiners appear only when the plan calls for them (MS8-10); the voltage box computes from coldest-condition voltage (MS8-11); every rating on the sheet equals the BOM's sized value (MS8-12); the earth-pit count matches the BOM's derivation (MS8-13); schedules reflect the real design (MS8-14); the structural disclaimer appears on every sheet (MS8-08)
- Given a rectangular obstruction, Then the layout sheet draws it as a rectangle at true size (MS8-16); the legend lists only rendered symbols and the section detail is either design-true or labelled TYPICAL — ASSUMED (MS8-17); roof edges carry dimensions (MS8-15); the route sheet draws each string path or states there are none (MS8-18)
- Given the structure tab, Then the printable structural drawing renders with its honesty block (MS8-19)
- Given a legally derived rating, Then the dialog can display and select it (MS8-21)
- Given a site latitude, Then design temperatures come from the pack band with provenance stated (MS8-23)
- MS8-05 is P1 and carries no line in the doc's P0 acceptance list; it is verified against its brief row.
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-269 · Derived drawing parameters, the override merge & pack-sourced standards
**Type:** engine · **Tier:** P0
**PRD rows:** MS8-20, MS8-22
**PORT:** `3d_design_studio/src/features/solar-studio/lib/sld.ts` · `3d_design_studio/src/features/solar-studio/screens/Step8Sld.tsx` (the parameter/override plumbing behind T-MS-268's surface) · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/sld.test.ts`
**DEFECTS:** none recorded against MS8-20 or MS8-22 in `prd/_process/studio/defect-register.md`. (The paired dialog defect `CODE.step8-sld.52` is attached to T-MS-268 at MS8-21; this task owns the effective-value merge the dialog seeds from.)

**Requirements (verbatim):**
- **MS8-20** (P0) — Parameters are derived (pure, from the design) and merged with explicit overrides; the merge is the single effective value every surface reads (`.48/.49`).
- **MS8-22** (P0) — Standards references shown on the sheet come from the market pack, not hardcoded strings (`.53`, F1).

**DONE WHEN:**
- Given an override, Then the effective value is what every surface reads (MS8-20)
- standards text comes from the pack (MS8-22)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-270 · Temperature-corrected string window & parallel-string capacity
**Type:** port · **Tier:** P0
**PRD rows:** MS8-24, MS8-25
**PORT:** `3d_design_studio/src/features/solar-studio/lib/electrical/temps.ts` · `3d_design_studio/src/features/solar-studio/lib/electrical/window.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/electrical-temps.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/stringing.test.ts`
**DEFECTS:** none recorded against MS8-24 or MS8-25 in `prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS8-24** (P0) — Module voltage at temperature uses the datasheet coefficient; the string window derives min/max panels from the inverter's DC ceiling and MPPT window at those temperatures; an impossible pair is STATED as empty, never as nonsense bounds (`.57–.59`).
- **MS8-25** (P0) — Parallel-string capacity per MPPT derives from current limits (`.61`); string colours are stable across planner, sheets and 3D (`.60`).

**DONE WHEN:**
- Given a panel/inverter pair, Then the string window derives from datasheet values and an impossible pair is stated as empty (MS8-24)
- parallel capacity derives from current limits (MS8-25)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-271 · Grouping engine & the pure string planner with its combiner plan
**Type:** port · **Tier:** P0
**PRD rows:** MS8-26, MS8-27
**PORT:** `3d_design_studio/src/features/solar-studio/lib/electrical/grouping.ts` · `3d_design_studio/src/features/solar-studio/lib/electrical/autostring.ts` · `3d_design_studio/src/features/solar-studio/lib/electrical/combiner.ts` · `3d_design_studio/src/features/solar-studio/lib/stringing.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/grouping-plane.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/autostring.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/combiner.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/stringing.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/mlpe.test.ts`
**DEFECTS:** none recorded against MS8-26 or MS8-27 in `prd/_process/studio/defect-register.md`. (The paired surface defect `CODE.step8-sld.16/.84` — Step 8's auto-string using a degraded legacy shim and swallowing refusals — is attached to T-MS-268 at MS8-07; this task owns the REAL planner that entry point must call.)

**Requirements (verbatim):**
- **MS8-26** (P0) — Grouping engine: panels group by plane identity, azimuth/tilt buckets and shade tier (thresholds shared with the 3D access tints); co-planarity is geometric, not by-name; disabled panels never occupy a string; MLPE changes the grouping rules; serpentine ordering follows the roof grid (`.62–.67`).
- **MS8-27** (P0) — Planner contract (pure): balanced splits, undersized-group merging, explicit refusals with plain messages (empty window, current limit, tail too small, MPPT overflow), assumed-coefficient warning, and MPPT slot assignment (`.68–.76`); combiner plan for central topologies with its reconciliation gates (`.98–.100`).

**DONE WHEN:**
- Given mixed roofs, Then grouping respects plane, orientation and shade tier, and disabled panels never string (MS8-26)
- Given a plan, Then splits are balanced, refusals are explicit and plain, and MPPT slots are assigned (MS8-27)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-272 · Live validation, the published rule table & THE HARD GATE
**Type:** port · **Tier:** P0
**PRD rows:** MS8-28, MS8-29, MS8-30, MS8-31, MS8-32, MS8-33
**PORT:** `3d_design_studio/src/features/solar-studio/lib/electrical/gate.ts` · `3d_design_studio/src/features/solar-studio/lib/drc.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/electrical-gate.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/drc.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/drc-structure.test.ts` (sitting 5 — the structure-DRC regression net, shared with T-MS-210)
**DEFECTS:** none recorded against MS8-28…MS8-33 in `prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS8-28** (P0) — System validation runs live on every edit and feeds the editor banner, health score and the gate (`.77`).
- **MS8-29** (P0) — Electrical checks with their severities and plain messages: over-voltage strings, under-voltage strings, current above MPPT input, DC/AC ratio band, unstrung enabled panels, MPPT overflow (`.78–.83`).
- **MS8-30** (P0) — Layout DRC on the CANONICAL footprint (the same one placement and drawings use): panel overlap, setback breach, low solar access, keep-out intrusion, panel over a blocking obstruction, bridge clearance, bridge-engineer confirmation (`.120–.127`).
- **MS8-31** (P0) — Structure DRC: foundation dead-load warning, foundation clash, foundation too tall (`.128–.130`).
- **MS8-32** (P0) — The complete rule set is published as one table of code → severity → message, so every surface speaks the same language (`.131`).
- **MS8-33** (P0) — THE HARD GATE: error-level electrical issues block the editor's Next AND clamp the reachable steps, so an unsafe design cannot reach proposal or BOM; warnings never block; the gate is a single pure function shared by the wizard, tests and any future surface; where auto-string can resolve the block, the gate says so (`.85–.89`, R12 asymmetry, MS6-28).

**DONE WHEN:**
- Given any edit, Then validation re-runs and feeds banner, health and gate (MS8-28)
- every electrical check fires with its severity and message (MS8-29)
- Given overlapping panels, a setback breach, a keep-out intrusion, a panel over a blocking obstruction or insufficient bridge clearance, Then each raises its own coded issue on the canonical footprint (MS8-30)
- Given a foundation clash, an over-tall foundation or a dead-load concern, Then structure DRC raises it (MS8-31)
- the published rule table matches what the surfaces show (MS8-32)
- Given an error-level electrical issue, Then Next is blocked, later steps are unreachable, warnings do NOT block, and the reason is plain (MS8-33)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-273 · DC & AC protection sizing from the pack ladders
**Type:** port · **Tier:** P0
**PRD rows:** MS8-34, MS8-35
**PORT:** `3d_design_studio/src/features/solar-studio/lib/electrical-sizing.ts` · `3d_design_studio/src/features/solar-studio/lib/bom/emitters/electrical.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/electrical-sizing.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/ac-cable-sizing.test.ts`
**DEFECTS:** none recorded against MS8-34 or MS8-35 in `prd/_process/studio/defect-register.md`. (The paired drawing defect `CODE.step8-sld.35` — the SLD printing legacy 10/6 mm2 AC cable while the BOM sizes properly — is attached to T-MS-268 at MS8-12; this task owns the one engine both must read, per the S7-1 one-source-of-truth law.)

**Requirements (verbatim):**
- **MS8-34** (P0) — DC protection sizing: fuse from the continuous-current rule, isolator and cable from the pack ladders (`.90/.91`).
- **MS8-35** (P0) — AC sizing: exact full-load current, breaker from the continuous rule, and cable sized by BOTH ampacity (derated) and voltage drop — the governing size wins, with the honesty boundary stated (grouping/temperature factors out of scope) (`.92–.97`).

**DONE WHEN:**
- Given an AC run, Then cable size is the larger of the ampacity-derated and voltage-drop results, with the boundary of the method stated (MS8-35)
- Given a design, Then DC and AC protection sizes derive from the pack ladders with the governing criterion winning for cable (MS8-34/35)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-274 · Cable routing, route-derived warnings & atomic cascades
**Type:** port · **Tier:** P0
**PRD rows:** MS8-36, MS8-37, MS8-38, MS8-39
**PORT:** `3d_design_studio/src/features/solar-studio/lib/routing.ts` · `3d_design_studio/src/features/solar-studio/lib/cascade.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/routing.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/cascade.test.ts`
**DEFECTS:** none recorded against MS8-36…MS8-39 in `prd/_process/studio/defect-register.md`. (MS8-39 pairs with MS6-25, whose defect `CODE.step6-layout.32` is attached to T-MS-208.)

**Requirements (verbatim):**
- **MS8-36** (P0) — Cable routing: vertical drops from the model (never a constant), inverter position resolved from its wall placement, length = path + drop + stated slack, blockers limited to what a cable truly may not cross, straight line when clear and a shortest-path route otherwise, corridor-cost preference over free-field crossing, array footprint and intra-string extras counted (`.102–.111`).
- **MS8-37** (P0) — AC main route to the grid connection returns nothing rather than a fabricated path when the connection point is unset (`.112`).
- **MS8-38** (P0) — Route-derived voltage-drop warnings per string (`.113`); routed metres are THE BOM quantity, and routes re-key the design fingerprint because they move money (`.114/.115`).
- **MS8-39** (P0) — Cascades are atomic: deleting a roof or panels prunes strings and routes so no dead copper is ever priced; emptied strings disappear rather than lingering (`.116–.119`, pairs with MS6-25).

**DONE WHEN:**
- Given a routed string, Then length = path + drop + stated slack with real blockers respected (MS8-36)
- Given no grid point, Then no AC path is fabricated (MS8-37)
- routed metres drive the BOM and re-key the fingerprint (MS8-38)
- Given a deleted roof or panels, Then strings and routes prune atomically and nothing dead is priced (MS8-39)
- the ported POC tests for this area pass unchanged in the new project.

---

### T-MS-275 · Nominal node hardware without double-counting the foundations
**Type:** port · **Tier:** P1
**PRD rows:** MS8-40
**PORT:** `3d_design_studio/src/features/solar-studio/lib/hardware.ts` · tests `3d_design_studio/src/features/solar-studio/lib/__tests__/hardware.test.ts`
**DEFECTS:** none recorded against MS8-40 in `prd/_process/studio/defect-register.md`.

**Requirements (verbatim):**
- **MS8-40** (P1) — Node hardware provides nominal visual parts per structure node, with foundation assemblies owned by the structure model (no double-counting) (`.132/.133`).

**DONE WHEN:**
- MS8-40 is P1 and carries no line in the doc's P0 acceptance list; the no-double-counting boundary against the structure model (T-MS-210's MS6-42 counted foundations) is the acceptance and travels with the ported suite.
- the ported POC tests for this area pass unchanged in the new project.

---

## Laws (enforced through screens and review, no standalone build)

- **MS4-04** (P0) — Undo semantics: component choices are single, coherent undo entries — not per-keystroke, not silent (S4-4.5 + S4-2 raise `.7`'s default to explicit, matching the Compare→Apply path `.67`).
  *Enforced by:* T-MS-201 — Step 4's own rows are its instances (MS4-12 applies as one undo step on both the picker and Compare→Apply paths, MS4-14 commits one undo entry per committed capacity change, MS4-33 writes panel + inverter + count as ONE undo step); "a component choice produces exactly one undo entry (MS4-04)" is the acceptance that screen closes against, and review rejects any per-keystroke or silent component write.

- **MS7-21** (P0) — Derived figures state exactly what they are: displayed performance ratio includes shading (`.55`); the comparability access score is labelled as a score, never as "% of sunlight" (S6-1c, `.56/.57`); the orientation factor readout is orientation-only or renamed (S6-7.4 fixes `.58/.59`).
  *Enforced by:* the surfaces that print these figures — T-MS-260 (system summary, energy report and compare sheet), T-MS-266 (the solar-access and performance beats, where MS7-45 is the narrative instance of this law) and T-MS-265 (analyzer messages quoting the same figures). Its acceptance line, "Given the access score, Then it is never labelled as a share of sunlight (MS7-21)", is closed on T-MS-260; the `.58/.59` orientation-readout half of `CODE.step7-proposal.2/.9/.17/.58/.68/.127/.128/.132` (S6-7.4) is fixed wherever that readout renders. Review rejects any surface that reprints a derived figure under a name the model does not support.

- **MS7-24** (P1) — Bill-based sizing suggestion and the built-in irradiance model are stated as estimates with their assumptions (`.69/.70`, F8-09).
  *Enforced by:* T-MS-201 (the Step 4 bill-suggestion banner, MS4-16) and T-MS-260 (the report's provenance line and hero, MS7-41) reading the built-in-estimate path named by T-MS-262's MS7-18. P1, so it carries no line in the doc's P0 acceptance list; review rejects an estimate presented without its label and assumptions.

---

## Realized elsewhere

Context rows of this file's slice whose behaviour is carried outside the v2 build. The row stays
readable where it was written; the pointer beside it says who carries it.

| Row | realized-by |
|---|---|
| MS4-26 (P2) | Recommended Enhancement, explicitly not v2 scope — the enhancements register and the design spec §10 carry it, and §5 non-goals of `prd/modules/M05-studio/04-step4-components.md` records the exclusion ("battery economics modelling (MS4-26, REC)"). No v2 task builds it. |

---

## Disposition index

| Row | Disposition |
|---|---|
| MS4-01 | T-MS-201 |
| MS4-02 | T-MS-201 |
| MS4-03 | T-MS-201 |
| MS4-04 | LAW |
| MS4-05 | T-MS-202 |
| MS4-06 | T-MS-201 |
| MS4-07 | T-MS-201 |
| MS4-08 | T-MS-201 |
| MS4-09 | T-MS-201 |
| MS4-10 | T-MS-201 |
| MS4-11 | T-MS-201 |
| MS4-12 | T-MS-201 |
| MS4-13 | T-MS-202 |
| MS4-14 | T-MS-201 |
| MS4-15 | T-MS-201 |
| MS4-16 | T-MS-201 |
| MS4-17 | T-MS-201 |
| MS4-18 | T-MS-201 |
| MS4-19 | T-MS-201 |
| MS4-20 | T-MS-201 |
| MS4-21 | T-MS-201 |
| MS4-22 | T-MS-201 |
| MS4-23 | T-MS-202 |
| MS4-24 | T-MS-201 |
| MS4-25 | T-MS-204 |
| MS4-26 | realized-by: Recommended Enhancement, explicitly not v2 scope — the enhancements register and the design spec §10 carry it, and §5 non-goals of `prd/modules/M05-studio/04-step4-components.md` records the exclusion ("battery economics modelling (MS4-26, REC)"). No v2 task builds it. |
| MS4-27 | T-MS-201 |
| MS4-28 | T-MS-201 |
| MS4-29 | T-MS-201 |
| MS4-30 | T-MS-201 |
| MS4-31 | T-MS-201 |
| MS4-32 | T-MS-201 |
| MS4-33 | T-MS-201 |
| MS4-34 | T-MS-203 |
| MS6-01 | T-MS-205 |
| MS6-02 | T-MS-205 |
| MS6-03 | T-MS-207 |
| MS6-04 | T-MS-207 |
| MS6-05 | T-MS-205 |
| MS6-06 | T-MS-205 |
| MS6-07 | T-MS-205 |
| MS6-08 | T-MS-205 |
| MS6-09 | T-MS-205 |
| MS6-10 | T-MS-205 |
| MS6-11 | T-MS-205 |
| MS6-12 | T-MS-205 |
| MS6-13 | T-MS-205 |
| MS6-14 | T-MS-205 |
| MS6-15 | T-MS-208 |
| MS6-16 | T-MS-205 |
| MS6-17 | T-MS-205 |
| MS6-18 | T-MS-205 |
| MS6-19 | T-MS-205 |
| MS6-20 | T-MS-205 |
| MS6-21 | T-MS-205 |
| MS6-22 | T-MS-205 |
| MS6-23 | T-MS-205 |
| MS6-24 | T-MS-205 |
| MS6-25 | T-MS-208 |
| MS6-26 | T-MS-205 |
| MS6-27 | T-MS-205 |
| MS6-28 | T-MS-205 |
| MS6-29 | T-MS-205 |
| MS6-30 | T-MS-206 |
| MS6-31 | T-MS-206 |
| MS6-32 | T-MS-206 |
| MS6-33 | T-MS-206 |
| MS6-34 | T-MS-206 |
| MS6-35 | T-MS-206 |
| MS6-36 | T-MS-206 |
| MS6-37 | T-MS-206 |
| MS6-38 | T-MS-211 |
| MS6-39 | T-MS-209 |
| MS6-40 | T-MS-209 |
| MS6-41 | T-MS-210 |
| MS6-42 | T-MS-210 |
| MS6-43 | T-MS-210 |
| MS6-44 | T-MS-206 |
| MS6-45 | T-MS-206 |
| MS6-46 | T-MS-206 |
| MS6-47 | T-MS-206 |
| MS6-48 | T-MS-206 |
| MS6-49 | T-MS-206 |
| MS6-50 | T-MS-212 |
| MS6-51 | T-MS-205 |
| MS6-52 | T-MS-205 |
| MS6-53 | T-MS-207 |
| MS7-01 | T-MS-260 |
| MS7-02 | T-MS-260 |
| MS7-03 | T-MS-260 |
| MS7-04 | T-MS-260 |
| MS7-05 | T-MS-261 |
| MS7-06 | T-MS-260 |
| MS7-07 | T-MS-260 |
| MS7-08 | T-MS-260 |
| MS7-09 | T-MS-261 |
| MS7-10 | T-MS-260 |
| MS7-11 | T-MS-260 |
| MS7-12 | T-MS-265 |
| MS7-13 | T-MS-260 |
| MS7-14 | T-MS-260 |
| MS7-15 | T-MS-262 |
| MS7-16 | T-MS-262 |
| MS7-17 | T-MS-262 |
| MS7-18 | T-MS-262 |
| MS7-19 | T-MS-262 |
| MS7-20 | T-MS-260 |
| MS7-21 | LAW |
| MS7-22 | T-MS-260 |
| MS7-23 | T-MS-262 |
| MS7-24 | LAW |
| MS7-24b | T-MS-262 |
| MS7-25 | T-MS-263 |
| MS7-26 | T-MS-263 |
| MS7-27 | T-MS-263 |
| MS7-28 | T-MS-264 |
| MS7-29 | T-MS-264 |
| MS7-30 | T-MS-264 |
| MS7-31 | T-MS-260 |
| MS7-32 | T-MS-264 |
| MS7-33 | T-MS-264 |
| MS7-34 | T-MS-260 |
| MS7-35 | T-MS-265 |
| MS7-36 | T-MS-265 |
| MS7-37 | T-MS-265 |
| MS7-38 | T-MS-265 |
| MS7-39 | T-MS-265 |
| MS7-40 | T-MS-260 |
| MS7-41 | T-MS-260 |
| MS7-42 | T-MS-260 |
| MS7-43 | T-MS-266 |
| MS7-44 | T-MS-266 |
| MS7-45 | T-MS-266 |
| MS7-46 | T-MS-266 |
| MS7-47 | T-MS-260 |
| MS7-48 | T-MS-267 |
| MS7-49 | T-MS-260 |
| MS7-50 | T-MS-267 |
| MS7-51 | T-MS-260 |
| MS8-01 | T-MS-268 |
| MS8-02 | T-MS-268 |
| MS8-03 | T-MS-268 |
| MS8-04 | T-MS-268 |
| MS8-05 | T-MS-268 |
| MS8-06 | T-MS-268 |
| MS8-07 | T-MS-268 |
| MS8-08 | T-MS-268 |
| MS8-09 | T-MS-268 |
| MS8-10 | T-MS-268 |
| MS8-11 | T-MS-268 |
| MS8-12 | T-MS-268 |
| MS8-13 | T-MS-268 |
| MS8-14 | T-MS-268 |
| MS8-15 | T-MS-268 |
| MS8-16 | T-MS-268 |
| MS8-17 | T-MS-268 |
| MS8-18 | T-MS-268 |
| MS8-19 | T-MS-268 |
| MS8-20 | T-MS-269 |
| MS8-21 | T-MS-268 |
| MS8-22 | T-MS-269 |
| MS8-23 | T-MS-268 |
| MS8-24 | T-MS-270 |
| MS8-25 | T-MS-270 |
| MS8-26 | T-MS-271 |
| MS8-27 | T-MS-271 |
| MS8-28 | T-MS-272 |
| MS8-29 | T-MS-272 |
| MS8-30 | T-MS-272 |
| MS8-31 | T-MS-272 |
| MS8-32 | T-MS-272 |
| MS8-33 | T-MS-272 |
| MS8-34 | T-MS-273 |
| MS8-35 | T-MS-273 |
| MS8-36 | T-MS-274 |
| MS8-37 | T-MS-274 |
| MS8-38 | T-MS-274 |
| MS8-39 | T-MS-274 |
| MS8-40 | T-MS-275 |
