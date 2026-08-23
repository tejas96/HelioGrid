# M05-studio · Overview — the 3D Design Studio sub-suite

Status: draft (pass two delivered) · Origin mix: index + suite-wide studio laws · Owner rulings: 54 across 11 sittings, covering 115 individual fixes, 2026-08-05
Parent: `prd/modules/M05-design-studio.md` (the pass-one baseline; census appendix remains binding there)
Process record: `prd/_process/studio/` — design spec (decisions SD1–SD5), 15 inventory ledgers, 12 sitting-ruling files, defect register, verification report. (The execution plan and SDD ledger were removed 2026-08-05 once the sittings closed; their outcomes are recorded in the ruling files and the verification report.)

## 1. What this sub-suite is

Pass two of the studio (design-spec decision DD13). The POC codebase at `3d_design_studio/`
(~64.5k lines, 287 files, 173 test files) was inventoried feature-by-feature — **1,551 keyed
behaviors**, every one traced to code with its evidence, its status (working / defect /
uncertain) and its census match. The owner ruled on every defect and every enhancement in 11
sittings. These eleven documents are the result: the complete, buildable Design Studio spec.

Nothing was sampled or summarised away: each document's traceability block was machine-verified
as a complete union of its ledger's keys with no gaps and no duplicates, and every P0
requirement carries Given/When/Then acceptance criteria.

## 2. The documents

| # | Document | Covers | Keys | Rulings |
|---|---|---|---|---|
| 01 | `01-step1-site-setup.md` | Address/map/imagery, location confirm, solar data, calibration engine, the shared canvas contract | 115 | 10 |
| 02 | `02-step2-roof.md` | Roof drawing & snapping, conversion engines (gable/hip/skeleton/wavefront), setbacks & parapets, measure/calibrate, AI detection pipeline | 183 | 7 |
| 03 | `03-step3-obstructions.md` | 11 obstruction types, capability/bridging system, platform conversion, 3D representation & shadow parity | 54 | 5 |
| 04 | `04-step4-components.md` | Panel/capacity/inverter/battery selection, the resolved catalog, the 11-column compare engine | 92 | 5 |
| 05 | `05-step6-editor.md` | Layout & auto-design, tools, table settings, the 3D scene with sun simulation, the parametric structure model, Design Health | 215 | 5 |
| 06 | `06-step7-proposal.md` | Shadow captures, readiness review, the energy model, the money model, insight analyzers, energy report, narrative, comparison | 156 | 7 |
| 07 | `07-step8-sld.md` | String sizing, the 24-code DRC set, cable routing & sizing, four drawing sheets, THE HARD GATE | 133 | 2 |
| 08 | `08-customer-surfaces.md` | The proposal document and the customer share link | 109 | 4 |
| 09 | `09-step9-bom.md` | Six emitters, per-field overrides, money invariants, exports, market data | 167 | 3 |
| 10 | `10-done-and-installation.md` | Done step, pre-proposal review, ENGINEER SIGN-OFF (built), fingerprint system, duplicate/variants, installation work order | 196 | 3 |
| 11 | `11-shell-and-platform.md` | Wizard & gates, design list, auth & tenancy, persistence, UI kit, accessibility floor | 131 | 3 |
| | **Total** | | **1,551** | **54** |

Rulings are counted at top level: a batch ruling with numbered sub-parts (e.g. S2-5's 8-part
hygiene batch) counts once. The 54 rulings cover 115 individual fixes. (Final review 2026-08-05:
counts normalised to this convention.)

## 3. How to read it

1. **Requirement ids** are per document (`MS1-…` setup, `MS2-…` roof, `MS3-…` obstructions,
   `MS4-…` components, `MS6-…` editor, `MS7-…` proposal, `MS8-…` SLD, `MS9-…` customer surfaces,
   `MS10-…` BOM, `MS11-…` done/installation, `MS12-…` shell).
2. **Origin tags**: `SRC-CODE` (inventoried from the POC, pointer = its `CODE.*` key) ·
   `BRIEF` (an owner ruling from a sitting, dated) · `SRC` (main-suite/census law) ·
   `REC` (recommended, not scope). One governing tag per row, per suite convention.
3. **Where a behavior lives once but surfaces elsewhere**, it is stated once and cited: the
   obstruction factory and segment engine are recorded at MS2 §4; the capability model and
   steel-profile catalog at MS4 §4; the fingerprint system at MS11 §MS11.4.
4. The **census** (`M05-design-studio.md` Appendix A, 401 entries) remains the acceptance
   baseline and never shrinks; pass two deepened it — it did not replace it.

## 4. Studio-wide laws established or confirmed in pass two

These bind every studio document; they are stated here once so no screen re-litigates them.

| Law | Where ruled | Meaning |
|---|---|---|
| **Nothing gesture-only or keyboard-only** | S2-1, S3-4, S5-3 | Every interaction has a visible/touch equivalent: pinch/two-finger pan, visible snap toggles, nudge controls, 3D orbit/zoom cluster. |
| **One shading authority** | MS6-33 | Renderer and energy engine share geometry and results; the picture can never disagree with the physics. |
| **Structure is an estimate; an engineer signs** | S5-1a, S10-1, F8-25 | The disclaimer appears wherever structure is quoted — including flush tables and customer documents — and a real sign-off flow gates issuance. |
| **One source of truth across documents** | S7-1 | Where a value appears on a drawing AND in the BOM, both read the same engine output. |
| **Honesty survives printing** | S8-3 | Staleness, provenance, confidence, eligibility and disclaimers appear on paper, not only on screen. |
| **No studio-side capacity caps** | S5-2, Q28 | Entitlements are checked at Save/Generate, never mid-design. |
| **Market data is pack data** | S1-6, S6-4, S9-1 | Prices, tax, subsidy, escalation, climate bands, standards, compliance checklists and wind tables are market-pack configuration — India ships today's values. |
| **The catalog is the tenant's** | S4-1 (DD12) | Every picker reads the resolved catalog (platform slice + own SKUs + overrides) with all three entry paths real, plus Battery as a first-class component. |
| **One hard gate** | MS8-33, MS6-28 | Error-level electrical issues block progress; warnings never do. |
| **Nothing unapproved or unready reaches a customer** | S8-2, S10-1 | Readiness review gates issuance; sign-off gates the customer surfaces; sent proposals are pinned. |

## 5. What pass two changed about the studio

56 defects were found and ruled (full list: `prd/_process/studio/defect-register.md` — it is
the V2 test checklist). The structural ones worth naming:

- **The engineer sign-off flow did not exist** — no queue, no review, no return-with-comments,
  approval surviving duplication, unapproved designs reachable by customers. Built by S10-1.
- **The customer document had no commercial identity** — no number, date, version or validity,
  and it printed the operator's internal design name. Fixed by S8-1.
- **Honesty stopped at the screen** — staleness warnings were stripped from print, the
  structure disclaimer was conditional, a "nothing is estimated" line printed unconditionally.
  Fixed by S8-3.
- **A never-paying system reported "25 years"** as if it were a measurement — and that value
  sorted the recommendation engine. Fixed by S6-1.
- **The catalog, the money model and the electrical drawings each had their own version of the
  truth.** Unified by S4-1, S6-3 and S7-1.
- **India was hardcoded in five subsystems.** Moved to market packs by S1-6, S6-4 and S9-1.

## 5b. Build strategy — the POC is the starting point, not a reference (owner ruling S12-1, 2026-08-05)

**V2's studio is built by porting and reshaping `3d_design_studio/`, never by re-implementing it
from scratch.** This is binding on planning and estimation.

| | |
|---|---|
| **Preserve (port as-is where tests pass)** | The engineering core: geometry + robust inset/outset · roof conversion engines (gable, hip, straight-skeleton, wavefront) · the roof-AI pipeline and its artifact doorway · layout/fill, spacing, panel pose, the canonical footprint · the shading engine and worker protocol · the structure/member/foundation model · electrical sizing, stringing, DRC, routing · the six BOM emitters and the money engine · the energy and finance models · the insight substrate · the five-layer fingerprint system · drawing and DXF generation. **The ~1,000 passing tests port with the code** as the regression net proving the port did not break the engines. |
| **Reshape** | The UI/UX of every screen per the new design (F7 laws + the 54 sitting rulings), the shell (platform-native auth, tenancy and server-side designs per S11-3), and the extraction of market data into packs (S1-6, S6-4, S9-1). Rendering, interaction and layout are redesigned; the maths beneath them is not re-derived. |
| **Restructure** | The code is placed according to the V2 project's architecture, module boundaries and design system. File layout and naming change; algorithm behavior does not. |
| **Fix + add** | The 56 defect-register entries are the correction list; the 115 owner-ruled fixes and additions are the change list. Each names its target requirement id. |
| **Port map** | `prd/_process/studio/inventory/file-claims.md` maps all 287 POC source files to their owning area, and every requirement's `CODE.*` pointer resolves to a ledger row naming the file and line the behavior lives at today. **The ledgers are the port's working map**, not only PRD evidence. |

Consequence for planning: studio effort is **port + UI rebuild + defect/feature application** —
not a green-field build of the engineering core. Ruling record:
`prd/_process/studio/sittings/build-strategy-ruling.md`.

## 6. Non-goals of the sub-suite

Implementation detail (it stays in the inventory ledgers) · re-litigating pass-one laws
(census, honesty tiers, DD12 picker) · the main suite's own modules (M06 owns the proposal
document lifecycle, M08 the project-side checklist, F5 the customer-link framework — the studio
consumes them) · certified structural or electrical engineering (the studio sizes and checks;
a licensed engineer signs).

## 7. Open items

None. All 11 sittings closed with zero open items; all 54 rulings (115 individual fixes) are recorded in
`prd/_process/studio/sittings/` and applied in the documents above.
