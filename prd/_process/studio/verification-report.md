# Studio pass two — completeness verification report

Run: 2026-08-05 · Scope: the 11-document studio sub-suite (`prd/modules/M05-studio/`) against the 15 inventory ledgers, the traceability register, the census and the sitting rulings. All checks scripted; no sampling.

## Summary

| Metric | Value |
|---|---|
| POC source inventoried | 287 files, ~64.5k lines, 119 test files |
| **Keyed behaviors inventoried** | **1,551** |
| **Keys dispositioned in the register** | **1,551 (100%, zero missing)** |
| Studio documents | 11 + overview |
| **Requirement rows written** | **432** (399 P0) |
| **P0 rows without acceptance criteria** | **0** |
| Owner rulings | 54 top-level, covering 115 individual fixes, across 11 sittings, all recorded and applied |
| Defects found | 56, every one carrying an owner ruling |
| Tests run during inventory | 15 areas, all passing (≈1,000 tests across the POC suite) |

*(Correction 2026-08-06: the test-file figure in the first row read **173**; recounted on disk it is
**119** — `find 3d_design_studio -name "*.test.*" -type f` returns 121 excluding `node_modules`, of
which 2 are `.test.ts.snap` snapshots, leaving 112 `.test.ts` + 7 `.test.tsx` = 119. This matches the
119 test-file rows in `prd/_process/studio/inventory/file-claims.md` exactly. The other two figures in
that row were checked at the same time and are right: 287 files = the 287 `src/**` TS/TSX files the
ledger claims, and ~64.5k lines = 64,536. The corrected 119 is the true size of the regression net
ruling S12-1 rests on; the ≈1,000-test figure below counts test **cases**, not files, and is
unaffected.)*

## Gate 1 — every ledger key dispositioned

Every `CODE.*` key from all 15 ledgers resolves to a disposition row in
`prd/registers/traceability.md` (range rows expanded and checked per key).

installation 64/64 · share 109/109 · shell 131/131 · step1-setup 115/115 · step10-done 132/132 ·
step2-roof-ai 78/78 · step2-roof-drawing 105/105 · step3-obstructions 54/54 · step4-components 92/92 ·
step6-layout 93/93 · step6-scene3d 50/50 · step6-structures 72/72 · step7-proposal 156/156 ·
step8-sld 133/133 · step9-bom 167/167 — **TOTAL MISSING: 0.**

## Gate 2 — per-document hygiene

All 11 documents: no duplicate requirement ids, every row carries exactly one governing origin
tag and a tier, and **every P0 requirement is cited in an acceptance criterion**. Document 01
uses inline per-area acceptance lines (the first-document template); verified separately —
29/29 P0s covered, zero uncited.

## Gate 3 — cross-document reference integrity

1,699 requirement ids are defined across the whole PRD suite. Every `MS*`/`M*`/`F*`/`OV`/`PS`/`BM`
reference inside the studio documents resolves to a defined row: **zero unresolved references.**

## Gate 4 — census

The 401-entry census in `M05-design-studio.md` Appendix A remains the binding acceptance
baseline (it never shrinks). 380 entries are cited individually by pass-two ledgers; the
remaining 21 are covered by explicit range citations in the same ledgers
(e.g. `SC.10-4.24–SC.10-4.30`, `SC.10-7.32–SC.10-7.41`), verified by inspection. Pass two
**deepened** the census — every ledger also recorded census-unmatched entries as regression
risks, and each was ruled at its sitting.

## Gate 5 — defect register

56 rows; **every row carries a dated owner ruling** and a target requirement id. The register is
the V2 test checklist.

## Gate 6 — sitting rulings

11 ruling files, all marked CLOSED with zero open items: step1 10 · step2 7 · step3 5 · step4 5 ·
step6 5 · step7 7 · step8 2 · step9 3 · share 4 · done+installation 3 · shell 3 = **54 rulings**.
Eleven of the 54 are batch rulings with numbered sub-parts (72 sub-part fixes in all), so the 54
rulings cover **115 individual fixes**. (Final review 2026-08-05: the totals stated here and in
the summary were corrected to match this per-sitting list, which was already right.)

## Method notes

- Inventory agents read code as the primary source, tests as encoded intent (a failing test
  would have been data — none failed), and the POC's own docs third; discrepancies were recorded
  in-row, never silently resolved.
- Every document's traceability mapping was verified at authoring time as a **complete union of
  its ledger's keys with no gaps and no duplicates** before the block was written.
- Two coverage gaps found by these checks during authoring (proposal keys 61/62; four
  acceptance-citation gaps across documents 03/06/07/09/10/11) were fixed inline at the time.

## Residual items

None blocking. The census's own recorded gaps and the main-suite conflicts (M06 escalation
alignment, F5 model inversion) are documented in their owning documents' §4 sections, per the
suite's record-don't-resolve law.

## Port-map gaps found in review (2026-08-06)

Ruling S12-1 §5 makes `prd/_process/studio/inventory/file-claims.md` the port's working map: all
287 POC source files map to an owning sitting, and the build ports them. A review on 2026-08-06
cross-checked every ledger row against the `**PORT:**` lines in `tasks/` and found **three claimed
files that no task names**. All three are sitting 13 — and sitting 13 has exactly three files
(`Per-sitting counts: {… 13: 3}`), so the whole sitting is unclaimed by the task suite. All three
were confirmed present on disk on 2026-08-06. They are recorded here for the port owner to pick up;
this report does not edit `tasks/`.

### 1. `3d_design_studio/src/features/solar-studio/types.ts` — ledger line 293, sitting 13

**What it holds.** The studio's single domain model, 1,017 lines. Its own header states the scope:
every entity in a project, read by the store, the editors, the 3D scene, the SLD, the drawings and
the BOM engine from one shape. `LatLng`/`XY`, `SiteType`/`ConnectionType`/`ProjectStatus`,
`ProjectInfo`, `Roof`, `PlacedPanel`, `StringDef`, `Project` and the rest.

**Which task should own it.** No area owns it, because every area consumes it. The natural home is
the `**PORT:**` line of **T-MS-365** (`tasks/MS-studio-c.md`), which already ports
`store/store.tsx` and `lib/persistence/schema.ts` — the two files that construct and persist this
same shape. If the port owner would rather not hang a cross-cutting file off an engine task, the
alternative is a new foundation task in `tasks/MS-studio-c.md` that lands `types.ts`, the shared
test fixture (item 2) and the test runner config as the port's first commit; either resolution is
acceptable, but the file must appear in exactly one PORT line.

**Why it matters.** 217 of the 287 claimed source files import it — including 96 of the 119 test
files. Nothing in the ported suite type-checks or compiles until it lands, so it is a hard
prerequisite of every other studio port task, not an optional one.

### 2. `3d_design_studio/src/features/solar-studio/lib/__tests__/fixtures/project.ts` — ledger line 80, sitting 13

**What it holds.** The shared test fixture, 77 lines: a minimal, valid designed project — one flat
RCC roof, components selected, a small enabled panel grid and one committed string — with
`fixtureRoof()` and its siblings. It imports `types.ts` (item 1), `newProject` from
`store/store`, `data/panels.ts` and `data/inverters.ts` (the last two already port under **T-MS-201**
and **T-MS-202** in `tasks/MS-studio-b.md`).

**Which task should own it.** The same task that lands `types.ts` — **T-MS-365**, or the foundation
task proposed above. It must not be split across the area tasks: it is one file imported by tests in
every area, so a single owner is the only arrangement that keeps the ledger's one-file-one-sitting
rule intact.

**Why it matters — this is the sharpest of the three.** 72 of the 119 POC test files import it,
spanning finance, BOM, money, golden-file, DXF/drawing, calibration, stringing, routing, DRC,
structure, foundation, obstruction-grounding, shading, persistence, health-coverage, insights and
the accessibility DOM tests. Every port task in `tasks/MS-studio-a.md`, `-b.md` and `-c.md` closes
with the line "the ported POC tests for this area pass unchanged in the new project." Without this
one 77-line file, 72 of those test files fail at import — they do not fail an assertion, they never
run. The regression net that ruling S12-1 §1 relies on to prove the port did not break the engines
is therefore only 47 files wide until this is claimed.

### 3. `3d_design_studio/src/features/solar-studio/data/discoms.ts` — ledger line 38, sitting 13

**What it holds.** 97 lines: `INDIAN_STATES` (the 37 states/UTs), the `DISCOMS` state → distribution
company directory, and `discomsForState()`, `tariffFor()`, `tariffForState()`.

**Which task should own it.** **T-MS-306** (`tasks/MS-studio-c.md`, "Market data pack: price book,
tax, subsidy, engineering constants and wind — multi-market resolver"). Its PORT line already names
`data/rules/india.ts`, and `india.ts` imports `discoms.ts` directly — the tariff read path crosses
the two files. Adding `data/discoms.ts` to that PORT line closes the gap with no other change.

**Why it matters.** Three ported surfaces consume it and none of them brings it along:
`data/rules/india.ts` (T-MS-306), `screens/Step1Setup.tsx` (**T-MS-101**, `tasks/MS-studio-a.md` —
Step 1's state and DISCOM pickers have no data source without it), and
`lib/__tests__/tariff.test.ts` (**T-MS-264**, `tasks/MS-studio-b.md`). It is also the POC-side
counterpart of the pack requirement F1-53 under **T-FCORE-008** in `tasks/F-core.md`, which makes
the IN pack the supplier of the state → DISCOM directory: ruling S9-1's extraction of India-hardcoded
data into a market pack cannot be executed against a file the port never picks up.

### Related figure check — `2026-08-05-studio-pass-two-design.md` §1

That document is not this report's to edit, so the discrepancy is recorded rather than corrected.
§1 sizes the POC as "~64.5k lines TS/TSX, 290 files, 15 screens, 108 test files":

- **"290 files" is correct at its own scope, and does not conflict with the ledger's 287.** 290 is
  every TS/TSX file in `3d_design_studio/` outside `node_modules`; 287 is the `src/**` subset the
  ledger claims. The three-file difference is `next-env.d.ts`, `next.config.ts` and
  `vitest.config.ts` at the repo root — build config, correctly outside a source-claim ledger. Worth
  a parenthetical in §1 someday, but nothing is wrong.
- **"108 test files" is wrong; the figure is 119**, by the same disk count recorded in the Summary
  correction above and by the ledger's own 119 test-file rows. The owner of that document should
  correct it.
