# MS7 · Studio Step 7 — Proposal (captures · energy · finance · review)

Status: draft · Origin mix: SRC-CODE-dominant + BRIEF (Sitting 6 rulings, 2026-08-05) · Depends on: MS1 (location/weather provenance), MS4 (module/inverter/catalog), MS6 (layout, shading, captures), F1 (pack: money, climate, escalation), F8 (provenance & staleness law), M06 (the 11-step builder — a DIFFERENT surface), BM/Q28
Sources: POC code inventory — proposal (**156 keys**, 13 files/132 tests all passing, every numeric claim re-derived live) · sitting rulings (S6-1…S6-7) · census A.10-8 (20/20 matched; 99 rows beyond census — the whole energy/finance model had no census home). The ledger index is retired; the POC repository named in `docs/build-order.md` is the source, and the sitting rulings are carried by the rows below.
Forward: MS10 (BOM money path), MS11 (done/review), F5 (customer surface), M06 (proposal builder consumes these numbers).

## 1. Purpose & scope

Step 7 turns a design into a customer-ready story: four shadow captures, a pre-proposal readiness review, and the studio's single energy + finance model with its provenance intact. This document specs the screen, the energy chain, the money model, the insight/analyzer substrate, the energy report, the narrative and the comparison engine — plus the Sitting-6 rulings that make each defensible to a customer's finance team.

**Boundary with M06:** the studio's Step 7 produces the NUMBERS and the imagery; the main-suite 11-step builder (M06) produces the DOCUMENT. Where both compute a figure, M05 is the author (M06-39) and M06 consumes. Conflicts recorded in §4.

## 2. Personas & surfaces

Design Engineer (author) · Sales Executive (review/generate) · customer (read-only share surface, F5/Q27). Web + mobile parity; touch-accessible data per S6-7.1.

## 3. Feature areas

### MS7.1 — Shadow captures

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS7-01 | Two-phase screen: capture phase then review phase; entry phase decided by how many captures carry SAVED IMAGES — not by record count (S6-7.7 fixes `.2`) — and re-entry resumes at the first uncaptured shot (`.1/.3`, fixes `.3`'s always-shot-1). | `SRC-CODE` + `BRIEF` S6-7 | P0 |
| MS7-02 | Exactly four fixed presets (summer morning, summer noon, winter morning, winter noon-class) each seeding the 3D scene's date/hour/solar-access mode (`.7/.8`). | `SRC-CODE` | P0 |
| MS7-03 | The scene stays live after seeding; the saved capture records the ACTUAL sun position at the moment of capture, so a caption can never describe a different sun than the picture (S6-7.5 fixes `.9`). | `BRIEF` S6-7.5 | P0 |
| MS7-04 | Capture control, progress counter ("N/4" counting saved images), numbered shot buttons with captured state, auto-advance to the next uncaptured shot, and Skip-to-review always available (`.10–.13/.15`). | `SRC-CODE` | P0 |
| MS7-05 | The first successful capture becomes the cover; captures are overwritten by retaking the same preset (`.14/.35`). | `SRC-CODE` | P0 |
| MS7-06 | Save failures are surfaced and PERSIST across shot switches and into review until resolved (S6-7.6 fixes `.16/.17`). | `SRC-CODE` + `BRIEF` S6-7.6 | P0 |
| MS7-07 | Image bytes are stored out-of-project with the project holding references only; rendering handles missing blobs gracefully (`.36`). | `SRC-CODE` | P1 |

### MS7.2 — Freshness & the cover (the staleness law)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS7-08 | A capture is STALE when the layout it was taken against no longer matches the current layout; stale tiles carry a badge (`.30/.31`). | `SRC-CODE` | P0 |
| MS7-09 | "Set as cover" preserves the IMAGE's own freshness stamp — promoting a stale capture can never mark it fresh (S6-2 fixes `.33`). | `BRIEF` S6-2 | P0 |
| MS7-10 | The cover preview itself carries the staleness badge (S6-2 fixes `.34`), and the readiness card checks cover freshness, not just capture count, and "ready to send" stays false while any customer-facing image is stale (S6-2 fixes `.27`). | `BRIEF` S6-2 | P0 |

### MS7.3 — Pre-proposal readiness review

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS7-11 | Four review items with a worst-of-four verdict: **Electrical design** (the only blocker, sharing the studio's hard gate) · **Design review** (open insights) · **Quantity confidence** (BOM) · **Shadow imagery** (count AND freshness per MS7-10) (`.19–.26`). | `SRC-CODE` | P0 |
| MS7-12 | The analyzer registry is populated EXPLICITLY — never as a side effect of another screen's module load — so review can never read a false green (S6-5 fixes `.24`). | `BRIEF` S6-5 | P0 |
| MS7-13 | Generate Proposal is disabled while the verdict is blocked (fixes `.42`'s always-enabled button); the two proposal entry points converge on one state (S6-7 note fixes `.134`) (`.41/.43`). | `SRC-CODE` + `BRIEF` S6-7 | P0 |
| MS7-14 | System summary shows capacity, panels, annual generation and area — every number carrying its provenance and freshness label, with no undefined placeholders (S6-1b fixes `.38/.39`) (`.37`). | `BRIEF` S6-1b | P0 |

### MS7.4 — The energy model (ONE function for the whole product)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS7-15 | One pure energy function serves every surface (screen, report, narrative, comparison, BOM-adjacent money) — no second model anywhere (`.44/.67`). | `SRC-CODE` | P0 |
| MS7-16 | Capacity counts ENABLED modules only; roof area is a union so stacked roofs never double-count (`.45/.46`). | `SRC-CODE` | P0 |
| MS7-17 | Equipment losses compose multiplicatively (industry convention), with shading applied to the BEAM component only — never double-counted in the stack (`.47–.49`). | `SRC-CODE` | P0 |
| MS7-18 | Two computation paths with honest provenance: measured-weather path (monthly irradiance with diffuse fraction) and built-in-estimate path; the provenance flag follows the ACTUAL path taken, never a persisted string (`.50/.51/.63`), with a stale-pin guard on stored weather (`.64`). | `SRC-CODE` | P0 |
| MS7-19 | Climate/commercial constants become MARKET-PACK DATA: degradation default (with the panel's datasheet value used when present), soiling/temperature bands, monsoon months, the analysis horizon and the geographic fallback (S6-4 fixes `.60/.66/.52/.53`). | `BRIEF` S6-4 | P0 |
| MS7-20 | Inverter clipping is modelled from the inverter AC limit × count; where clipping is material the surfaces say so, in the binding copy "~x% clipped at this DC/AC ratio" (S6-6 fixes `.65`). | `BRIEF` S6-6 | P0 |
| MS7-21 | Derived figures state exactly what they are: displayed performance ratio includes shading (`.55`); the comparability access score is labelled as a score, never as "% of sunlight" (S6-1c, `.56/.57`); the orientation factor readout is orientation-only or renamed (S6-7.4 fixes `.58/.59`). | `SRC-CODE` + `BRIEF` S6-1c/S6-7.4 | P0 |
| MS7-22 | Transposition model: beam-only ratio by numeric integration with a stated diffuse share, project-wide azimuth convention, and cached results keyed on site/orientation — model boundaries stated in the surfaces that use it, not only in code (`.71–.75`, S6-1b provenance law). | `SRC-CODE` | P0 |
| MS7-23 | Dead/misleading helpers removed: the always-1 access stub (S6-7.8 fixes `.68`) and the unused per-panel POA loop (`.59`) never ship as live surface behavior. | `BRIEF` S6-7.8 | P1 |
| MS7-24 | Bill-based sizing suggestion and the built-in irradiance model are stated as estimates with their assumptions (`.69/.70`, F8-09). | `SRC-CODE` | P1 |
| MS7-24b | Lifetime projection: annual output degrades year-on-year at the pack-driven rate over the pack-driven horizon, and the reported figures (lifetime generation, final-year output, specific yield, annual MWh) derive from the UNROUNDED annual energy — display rounding never feeds another calculation (`.61/.62`, pairs with MS7-30). | `SRC-CODE` | P0 |

### MS7.5 — Weather ingestion

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS7-25 | Measured-weather ingestion is server-proxied with an explicit source ladder, per-rung timeouts, and a client timeout deliberately longer than the server's so the honest server message wins (`.76–.79`). | `SRC-CODE` | P0 |
| MS7-26 | The mapper is ALL-OR-NOTHING with validity windows, so partial or implausible data never becomes a "measured" claim; provenance (database name, years covered) is captured with the data; one shared shape guard protects fetch and persistence (`.80–.83`). | `SRC-CODE` | P0 |
| MS7-27 | Weather is fetched at location confirm (MS1-22), never silently on the proposal screen (`.84`). | `SRC-CODE` | P1 |

### MS7.6 — The money model

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS7-28 | ONE money path: system cost comes from the BOM total (MS10), never a parallel estimate (`.85`). | `SRC-CODE` | P0 |
| MS7-29 | Subsidy is computed from pack rules by capacity/segment/certification eligibility (`.86`, F1). | `SRC-CODE` | P0 |
| MS7-30 | Financials read EXACT annual energy, not the rounded display figure (S6-3a fixes `.88`) (`.87`). | `BRIEF` S6-3a | P0 |
| MS7-31 | Self-consumption/export is an EXPLICIT, editable, stated assumption — not an implicit 100% retail offset (S6-3d fixes `.87`). | `BRIEF` S6-3d | P0 |
| MS7-32 | Payback iterates with pack-driven escalation and degradation (S6-4 fixes hardcoded `.91`), and a system that never pays back reports exactly that — the binding copy is "Does not pay back within 25 years", never a sentinel year (S6-1a fixes `.90/.140`) (`.89/.94`). | `SRC-CODE` + `BRIEF` S6-1a/S6-4 | P0 |
| MS7-33 | Lifetime savings are shown net of lifecycle cost (inverter replacement) or explicitly labelled gross with the assumption list attached (S6-3b fixes `.92`). | `BRIEF` S6-3b | P0 |
| MS7-34 | Financing: four options from one cost basis with pack-driven terms — and the lease amortises the SAME net basis as the others (S6-3c fixes `.98`); the PPA reconciliation contract holds; first-year negatives are shown honestly; no eligibility/credit claims are made (`.93/.95–.97/.99–.102`). | `SRC-CODE` + `BRIEF` S6-3c | P0 |

### MS7.7 — Insight substrate & analyzers

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS7-35 | Analyzer substrate: stable dedupe keys, per-analyzer isolation (a failing analyzer never blanks the review), duplicate-id protection, and memoization keyed to the design (`.103–.107`) — the memo key must include shading when any analyzer reads it (`.108`). | `SRC-CODE` | P0 |
| MS7-36 | Commercial and data-quality analyzers are IMPLEMENTED (margin sanity, no-payback, missing tariff/price; estimated-vs-measured irradiance, stale captures, assumed heights, missing provenance) — closing the two declared-but-empty categories (S6-5 fixes `.109`). | `BRIEF` S6-5 | P0 |
| MS7-37 | Design analyzers as shipped: roof utilisation, DC/AC ratio, orientation (hemisphere-aware per S2-5.5), row spacing (`.111–.114`). | `SRC-CODE` | P0 |
| MS7-38 | O&M/constructability analyzers with their thresholds stated as ASSUMED pack conventions, never code minimums: cleaning access, module replacement, ladder access, inverter access — none of which block (`.115–.120`). | `SRC-CODE` | P0 |
| MS7-39 | Insight actions are descriptors the surfaces wire to Accept/Dismiss (MS6-05) (`.110`). | `SRC-CODE` | P1 |

### MS7.8 — Energy report sheet

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS7-40 | The sheet is a pure function of the project, recomputing rather than caching, with a freshness banner while shading recalculates (`.121/.122`). | `SRC-CODE` | P0 |
| MS7-41 | Section order and content per the census: system summary, annual-generation hero with provenance line (driven by the actual path, `.125`), monthly bars, loss breakdown, totals, 25-year projection, financials, financing (`.123/.124/.130/.131/.133`). | `SRC-CODE` | P0 |
| MS7-42 | Monthly figures are readable on TOUCH — not hover-only (S6-7.1 fixes `.127`); the loss chart is scaled to the data so the dominant loss is visible (S6-7.2 fixes `.128`); money uses pack formatting with no internal shorthand (S6-7.3 fixes `.132`); chart colours come from the design system (`.129`, F7). | `BRIEF` S6-7.1/.2/.3 | P0 |

### MS7.9 — Narrative

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS7-43 | The narrative is a pure function returning fact-carrying beats; it returns nothing rather than inventing a story when there is no design (`.135–.137`). | `SRC-CODE` | P0 |
| MS7-44 | Provenance is stated SYMMETRICALLY: the estimate path names itself exactly as the measured path does (S6-1b fixes `.138`, F8-09). | `BRIEF` S6-1b | P0 |
| MS7-45 | The solar-access sentence states its true metric or is dropped (S6-1c fixes `.139`); the payback beat reflects the no-payback state rather than sidestepping it (S6-1a, `.140`); the lifetime-money sentence travels with its assumptions (S6-3b fixes `.141`, M06 F8-23 family). | `BRIEF` S6-1a/b/c/S6-3b | P0 |
| MS7-46 | The narrative consumes the same computed report/financials as every other surface — no third computation (`.142`, MS7-15). | `SRC-CODE` | P0 |

### MS7.10 — Comparison engine

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS7-47 | No scoring black box: every candidate runs through the SAME pure pipelines the design itself uses, with the unshaded-basis honesty contract stated verbatim in the UI (`.143/.144`). | `SRC-CODE` | P0 |
| MS7-48 | Candidate construction: budgeted fill, inverter recommendation with the nearest-fit fallback, certification-first shortlist by cost-per-watt (`.145–.148`). | `SRC-CODE` | P0 |
| MS7-49 | A warning never hides; feasibility notes distinguish causes; the recommendation rule is stated on screen (`.149–.151`). | `SRC-CODE` | P0 |
| MS7-50 | Ranking is computed from corrected figures: no sentinel payback (S6-1a), exact energy (S6-3a) and a correctly named return metric (S6-1b) (fixes `.152`). | `BRIEF` S6-1a/S6-3a/S6-1b | P0 |
| MS7-51 | Basis and decision cards state objective, target, catalog version and assumptions (`.153`); memoization keys on the design fingerprint (`.154`); complexity and efficiency derivations are stated where shown (`.155/.156`). | `SRC-CODE` | P0 |

## 4. Cross-module contracts & the M06 boundary

Consumes: MS1 (location, weather provenance), MS4 (module/inverter specs, catalog version), MS6 (layout, per-panel shading, captures), MS10 (BOM total = system cost), F1 pack (subsidy, escalation, horizon, climate bands, currency), F8 (provenance/staleness laws). Provides: energy report, financials, financing options, narrative beats, comparison results and captures to M06's builder, F5's customer surface (Q27 3D + hero imagery) and MS9.

**Recorded M06 conflicts (not silently resolved):** (a) escalation — the studio's pack-driven rate must be the SAME value M06's builder edits, or the two documents will print different lifetime savings for one design; owner ruling S6-4 makes it pack data, and M06's field reads that default. (b) Lease/PPA economics exist in the studio but M06 v1 carries EMI only and treats CAPEX/OPEX as a document type — recorded; the studio may compute more than the current builder renders. (c) Clean seam: the money path is single-sourced (system cost = BOM total, M05 authors).

## 5. Non-goals

A second energy or money model anywhere (MS7-15/28) · credit/eligibility logic in financing (MS7-34) · blocking on O&M/constructability insights (MS7-38) · claiming "measured" data from partial upstream responses (MS7-26) · hover-only data on any surface (MS7-42).

## 6. Open items

None — Sitting 6 closed with zero open items (7 rulings covering all 29 defects and the 4 uncertainties, 2026-08-05).

## Acceptance criteria (P0 coverage)

- Given 3 saved images of 4, When Step 7 opens, Then it resumes at the missing shot and the counter reads 3/4 (MS7-01); the four presets seed the scene (MS7-02); Given the sun is moved before capture, Then the saved caption records the ACTUAL sun (MS7-03); progress/auto-advance/skip behave as specified (MS7-04); the first capture becomes cover and retakes overwrite (MS7-05); Given a save failure, Then the error persists into review until resolved (MS7-06).
- Given a layout change after capture, Then affected tiles show stale (MS7-08); Given a stale capture set as cover, Then it stays marked stale and readiness reflects it (MS7-09/MS7-10).
- Given any blocking electrical issue, Then the verdict blocks and Generate is disabled (MS7-11/MS7-13); Given the review screen, Then analyzers are registered explicitly and cannot read false-green (MS7-12); Given the summary, Then every number carries provenance and no undefined text appears (MS7-14).
- Given any surface needing energy, Then it calls the one model (MS7-15); disabled modules are excluded and roof area is a union (MS7-16); losses compose multiplicatively with shading applied once (MS7-17); Given measured weather, Then the provenance says measured; Given none, Then it says built-in estimate — always matching the path actually taken (MS7-18). Given a non-India market pack, Then escalation/degradation/climate/horizon/fallback come from that pack (MS7-19). Given a DC/AC ratio above the inverter's limit, Then clipping reduces modelled energy and the surfaces say so (MS7-20). Given the access score, Then it is never labelled as a share of sunlight (MS7-21); transposition assumptions are stated where used (MS7-22).
- Given upstream weather is partial, Then nothing is claimed as measured (MS7-26); ladder/timeouts behave so the honest message wins (MS7-25).
- Given a design, Then system cost equals the BOM total (MS7-28) and subsidy follows pack rules (MS7-29); financials use exact energy (MS7-30); the export/self-consumption assumption is visible and editable (MS7-31); a never-paying system says so (MS7-32); lifetime savings are net or labelled gross with assumptions (MS7-33); all four financing options share one basis (MS7-34).
- Given a failing analyzer, Then the rest still run (MS7-35); Given a negative margin or an estimated-irradiance proposal, Then commercial/data-quality analyzers flag it (MS7-36); design analyzers behave as specified (MS7-37). Given a module beyond cleaning reach or an inverter without access clearance, Then the O&M/constructability analyzer raises it with its threshold stated as an ASSUMED convention, and it never blocks proposal generation (MS7-38).
- Given a candidate whose strings are infeasible, Then a warning is always shown (never hidden), the note names the specific cause, and the on-screen recommendation rule explains why another row was preferred (MS7-49).
- Given the 25-year projection, Then it degrades at the pack rate over the pack horizon and every derived figure comes from unrounded energy (MS7-24b).
- Given the report, Then it recomputes with a freshness banner (MS7-40), follows the census section order with the provenance line (MS7-41), and monthly values are readable on touch with an honestly scaled loss chart and pack-formatted money (MS7-42).
- Given no design, Then the narrative returns nothing (MS7-43); Given the estimate path, Then the narrative names it (MS7-44); Given a shaded array or a never-paying system, Then the sentences state the truth with assumptions attached (MS7-45); the narrative reuses the same computed figures (MS7-46).
- Given the comparison, Then candidates run through the real pipelines with the basis stated (MS7-47/49), constructed per the shortlist and inverter rules (MS7-48), ranked on corrected figures with no sentinel (MS7-50), and the basis/decision cards state objective, target and catalog version (MS7-51).

Localization: all copy via catalog (F3); money/units per pack (F1). Analytics: capture_saved {preset}, cover_set, review_verdict {overall}, proposal_generated, report_opened, compare_applied.
