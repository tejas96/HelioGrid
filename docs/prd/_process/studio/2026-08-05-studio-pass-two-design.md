# Studio Pass Two — Design Spec (the DD13 deep-dive)

Date: 2026-08-05 · Status: owner-approved (this session) · Predecessor: docs/prd/_process/2026-08-03-v2-prd-design.md (DD13)
Scope: HOW the 3D Design Studio POC codebase becomes the complete enhanced Studio PRD sub-suite.

## 1. Purpose and source

Expand M05 into a complete, screen-by-screen Studio PRD from the POC codebase at
`/Volumes/works-space/heliogrid_v2_prd/3d_design_studio/` (~64.5k lines TS/TSX, 290 files,
15 screens, 108 test files, own docs folder). Owner mandate (2026-08-05, session of record):
**every feature considered — "not even very tiny feature should not miss"** — including buggy
ones; UI/UX improvements proposed for every screen. The 401-entry census
(M05 Appendix A) is the independent cross-check: census ∪ code inventory = the master list;
neither list can hide a gap in the other.

## 2. Locked decisions (owner, 2026-08-05)

| # | Decision | Ruling |
|---|----------|--------|
| SD1 | Output shape | **Studio sub-suite** at `docs/prd/modules/M05-studio/`: overview/index (current M05 evolves into it) + one document per step/screen + one shared 3D-interaction-model doc. Each doc buildable stand-alone. |
| SD2 | Bug policy | **Faithful-to-code + broken parts flagged.** Every feature documented exactly from code — nothing invented, nothing lost. Evidently-broken behavior (failing test, POC docs contradict, visible malfunction) carries the code-faithful description PLUS a `POC-DEFECT` flag: "correct behavior to be confirmed" — owner rules at the sitting. Defect register = V2 test checklist seed. |
| SD3 | Enhancements | Proposals drafted per screen, clearly labelled, **ruled by the owner at that screen's sitting** (evolution of the earlier draft-all-then-one-session choice, superseded by SD4's per-screen rhythm). Approved → owner-ruled requirements; declined → recorded as considered-and-declined. |
| SD4 | Method | **Screen-by-screen with the owner; agents dig, owner decides.** Per screen: background inventory (code + tests + POC docs → keyed ledger, census-diffed, defect-flagged) → owner sitting (features found, broken list, enhancement proposals with recommendations — one-at-a-time question style with plain examples) → document authored (writer + independent reviewer + fix loop) → next screen. |
| SD5 | Sitting queue (~13) | Step1 Setup · Step2 Roof (+roof-AI engine) · Step3 Obstructions · Step4 Components · Step6 Editor (+3D interaction/panel layout; no Step 5 — code confirms census R7) · Step7 Proposal · Step8 SLD (+electrical engine) · Step9 BOM (+BOM engine, 6 emitters) · Step10 Done · Wizard shell+Dashboard+Login · ProposalView+ShareViewer · InstallationSheet · wrap-up (engine leftovers no screen owned). Engines attach to the screen where users meet them. |

## 3. Sourcing rules

1. Three sources per screen, in this precedence for FACTS: code behavior > tests (encoded
   intent — a failing test marks a defect candidate) > POC docs (`3d_design_studio/docs/`,
   including `product-spec.md`, `phase-10-prompts.md`). Discrepancies recorded, never
   silently resolved (suite law §3.5 carries over).
2. Inventory keys: `CODE.<area>.<n>` (area = screen or engine slug), one key per feature/
   control/parameter/calculation/edge-case. Ledgers live at `docs/prd/_process/studio/inventory/`.
3. Census cross-check per screen: census-has/code-lacks → flagged (regression risk);
   code-has/census-lacks → the "tiny feature" case, captured as new. Both land in the sitting.
4. Origin tags in the sub-suite: `SRC-CODE` (POC inventory key) · `SRC` (census/journey, as
   before) · `BRIEF` (owner sitting rulings, dated) · `REC` (proposals pending/declined).
   `POC-DEFECT` is a flag on a row, not a tag. One governing tag per row (suite convention).
5. The pass-one conflict-register source-gap rows for `phase-10-prompts.md`/POC docs close
   (sources recovered in the code drop); recorded when the overview doc is authored.
6. Main-suite consistency: sub-suite docs cite F1/F2/F4/F7/F8/M01/M06 laws exactly as M05
   does today; the owner rulings of 2026-08-04 (Q27 3D-in-proposal-link, Q28 kW-only gate,
   Q24 stale-survey, Q8 two-flow measurement rule) BIND the sub-suite.

## 4. Gates and acceptance

(a) Every `CODE.*` key and all 401 census entries dispositioned in the studio traceability
extension (same register, new namespace) — completeness gate, mechanical. (b) Every screen
doc passed independent review + fix loop; every sitting's rulings recorded in
`docs/prd/_process/studio/sittings/` and applied. (c) Defect register populated; declined
proposals recorded. (d) Final studio-suite review (fresh eyes, cross-doc seams: wizard nav,
3D interaction model vs step docs, engineering-core consistency with Step8/Step9 docs).
(e) M05 overview/index updated in the main suite; owner sign-off.

## 5. Non-goals

No code changes to the POC; no implementation content in the PRD (engineering detail lives
in inventory ledgers, product behavior in the docs); no re-litigation of pass-one laws
(honesty tags, picker pattern, census never-shrinks); process artifacts under
`docs/prd/_process/studio/` only; no git.
