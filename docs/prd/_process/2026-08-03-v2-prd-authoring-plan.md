# HelioGrid V2 PRD Suite — Authoring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author the complete V2 PRD suite (~28 documents under `docs/prd/`) per the approved design spec `docs/prd/_process/2026-08-03-v2-prd-design.md`, closing the §13 completeness ledger against the ~85k-word source corpus.

**Architecture:** Extraction-first. Task 2 converts the entire source corpus into a keyed extraction ledger under `docs/prd/_process/extraction/`; every authoring task consumes its ledger slice and appends traceability rows. Foundations and framing docs land before modules (roles, market packs, honesty rules are referenced everywhere); modules follow journey order; registers close last behind a verification gate that loops until zero unaccounted source items remain.

**Tech Stack:** Markdown only. Verification via `grep`/`wc` checks. Multi-agent workflows may parallelize Task 2 (extraction) and Task 24 (verification); authoring tasks are sized one-agent-each.

## Global Constraints

Copied from the design spec (DD = locked decision; § = spec section). Every task inherits all of these.

- **No git operations of any kind** (DD14). No `git init`, no commits. Verification steps replace commit gates.
- **Never modify or extend `docs/` or `design/`** — source is read-only (§1).
- All product content under `docs/prd/`; process artifacts (this plan, extraction ledger) under `docs/prd/_process/` (DD14).
- `product-journey.md` is read **only through the `docs/15-spec-resolutions.md` overlay**; superseded D-text never enters a PRD as a live requirement (§3.1).
- `studio-census.md` is adopted verbatim as M05's acceptance baseline; the census never shrinks (§3.2).
- Every requirement carries: stable ID (`M02-31`, `F1-07` — module/foundation prefix + 2-digit-min sequence), origin tag (`SRC` with exact source pointer / `BRIEF` / `REC`), priority (P0/P1/P2) (§5).
- `REC` items appear in their module **and** in `docs/prd/registers/enhancements.md` with rationale; never mixed with source truth (§5).
- No implementation content: no APIs, schemas, code, engineering tickets, timelines, build phases (§14, DD4).
- Market-neutral module bodies: India-specific rules live in the F1 India market pack; modules reference pack keys (§6). Vendor names become capability requirements with v1 vendor as reference implementation.
- Registers use descriptive filenames (`traceability.md`, `conflicts.md`, `enhancements.md`, `open-questions.md`) — never R-numbered (§4).
- Conflicts and source gaps are **recorded, never silently resolved** (§3.5). Known gaps to record: missing `docs/research/*`, deleted `modules/` extractions.
- Product name **HelioGrid**; PRD in English; auth = Mobile OTP (`SRC`) + Google Login (`BRIEF`); launch languages EN/HI/MR (§6).
- Roles: fixed preset set defined in F2 (Task 5) — all later tasks use those exact role names (DD3, §12).
- The studio deep-dive is pass two (DD13): M05 here is the census-grounded baseline; do not block on the separate studio repo.
- Write in complete requirement prose; each module keeps the source's "what goes wrong" coverage — none dropped (§5).

## Document template (defined once — Task 1 publishes it in `docs/prd/00-README.md`)

Every foundation/module PRD uses this structure:

```markdown
# <ID> · <Title>
Status: draft | reviewed · Origin mix: SRC/BRIEF/REC · Depends on: <doc list>

## 1. Purpose & scope        (what this module is, what it is explicitly not)
## 2. Personas & surfaces    (which of the 12 personas; Mobile/Web emphasis per feature)
## 3. Feature areas          (repeating block per area:)
### <ID>.<n> — <Feature area name>
| ID | Requirement | Tag + source pointer | Tier |
Behavior detail (prose per requirement: flows, states, validation, empty states, offline notes)
Permissions: reference to F2 matrix rows
Edge cases & what-goes-wrong (carried from source, each item present)
Acceptance criteria (Given/When/Then per P0 requirement)
Localization notes · Analytics events
## 4. Cross-module contracts (what this module expects from / provides to others, product level)
## 5. Non-goals              (explicit, with v1 rationale where source-derived)
## 6. Open questions         (mirrored into registers/open-questions.md)
```

Traceability row format (appended by every task to `docs/prd/registers/traceability.md`):
`| <source key> | <disposition: live/superseded/excluded/conflict> | <PRD ID(s) or register> |`
where `<source key>` is a ledger key from Task 2 (e.g. `D22`, `R9`, `S5.wrong.3`, `C8`, `UXG-11`, `CG-14`, `DOC16.softblock`).

---

### Task 1: Suite conventions — `docs/prd/00-README.md`

**Files:**
- Create: `docs/prd/00-README.md`
- Create: `docs/prd/registers/traceability.md`, `docs/prd/registers/conflicts.md`, `docs/prd/registers/enhancements.md`, `docs/prd/registers/open-questions.md` (headers + column definitions only)

**Interfaces:**
- Produces: the document template (above), tag vocabulary (`SRC`/`BRIEF`/`REC`), tier definitions (P0/P1/P2), ID scheme, doc map matching design-spec §4 tree, register row formats. Every later task follows this file.

- [ ] **Step 1: Read** design spec §4 (tree), §5 (format/tagging/IDs), §2 (DD1–DD14 table).
- [ ] **Step 2: Write `docs/prd/00-README.md`** containing: how-to-read intro; the full doc map (all ~28 files with one-line purposes, copied from spec §4 including the register-naming note); the document template verbatim (from this plan's "Document template" block); tag definitions with the rule "REC never mixed with source truth"; tier definitions (P0 core / P1 important / P2 later — no dates); ID scheme; traceability row format; the reading rules from spec §3 (overlay rule, census rule, conflict rule) so PRD readers know the provenance discipline.
- [ ] **Step 3: Create the four register files** with title, purpose line, and empty table headers: traceability (`source key | disposition | PRD ref`), conflicts (`# | sources involved | contradiction/gap | status: recorded`), enhancements (`REC id | module | recommendation | rationale | tier`), open-questions (`Q id | area | question | decision owner`). Seed conflicts with the two known source gaps (missing `docs/research/*` cited by docs 00/01/03/04/05/12/13/16; deleted `modules/` extractions recorded by the vendored product index). Seed open-questions with `Q1: India price points & bundle sizes need owner re-validation given V2 scope (spec §8)`.
- [ ] **Step 4: Verify:** `grep -c '^| ' docs/prd/00-README.md` ≥ 28 (doc-map rows present); `ls docs/prd/registers/ | wc -l` = 4; conflicts register contains "docs/research" and "modules/"; open-questions contains "re-validation".

### Task 2: Source extraction ledger — `docs/prd/_process/extraction/`

The authoritative, keyed inventory of everything the PRD must account for. Suited to a parallel workflow (one agent per ledger file); results are plain Markdown tables.

**Files:**
- Create: `docs/prd/_process/extraction/d-census.md` — D1–D39: for each, verbatim post-overlay text (apply `docs/15` §2 conformance table + §4 owner directives), status (live/superseded-by-Rn/superseded-by-brief per DD2), and `target_doc` assignment from the mapping table below.
- Create: `docs/prd/_process/extraction/rulings.md` — R1–R18 (docs/15 §1, lines 12–118), R20 + §3 design-system rulings (line 170+), §4 owner directives (line 186+), user-decisions log (line 272+): each with verbatim ruling, consequence, `target_doc`.
- Create: `docs/prd/_process/extraction/journey-stages.md` — Stages 0–8 (journey lines: S0@114, S1@156, S2@190, S3@244, S4@280, S5@418, S6@483, S6B@539, S7@762, S8@837): per stage — screens list, happy path, EVERY "what goes wrong" item (key `S<n>.wrong.<i>`), "deliberately not in v1" items, recommendations, plus "Decisions locked"@33 and "India's calling rules (D36)"@58.
- Create: `docs/prd/_process/extraction/customer-journey.md` — C1–C13 (journey line 950+), the framing rules, link lifecycle.
- Create: `docs/prd/_process/extraction/studio-census-checklist.md` — every census entry from `docs/prd/modules/M05-studio/studio-census.md` as a checkbox line (key `SC.<section>.<i>`).
- Create: `docs/prd/_process/extraction/docs-rules.md` — every business rule / product law / product-relevant constraint in docs 00,01,02(product-level only),03(product-relevant constraints only, e.g. unverified-rate-card cautions),04(product rules riding on the model: pinning, archive-never-delete, append-only money),05(domain concepts that surface in product, e.g. fingerprint self-staling; skip pure engineering),06,07(capability level),08(product-visible security/tenancy rules, DPDP),09(product-visible only),10(product-level i18n/design rules),11,14(scope commitments only),16, forward-compat.md, architecture.md(product-level only) — keyed `DOC<nn>.<slug>`.
- Create: `docs/prd/_process/extraction/ux-gaps.md` — UXG-01…UXG-27 from docs/13 with the design-at-implementation notes.
- Create: `docs/prd/_process/extraction/competitive-verdicts.md` — gaps 1–19 from docs/12 with verdicts (key `CG-<n>`), plus the Reslink tier-coverage table and "what nobody else has" moat list.

**Interfaces:**
- Produces: ledger keys (formats above) used by every authoring task and by `traceability.md`. `target_doc` column tells each module author their slice.
- Initial `target_doc` mapping (Task 2 corrects where the text says otherwise): S0/S1 + tenant-config + catalog → M01 · S2/S3 + merge/snooze → M02 · S4 → M04 · S5 + census + docs/11 → M05 · S6/S6B → M06 · S7 + voice + D36 → M07 · S8 → M08 · C1–C13 + link rules → F5 · money path/tranches → M11 · docs/16 + docs/01 → 04-business-model + M12 · docs/06 → F4 · docs/10 → F3 + F7 · docs/engineering/08 → F2 + F1 + M01 · roles matrix (journey ~1432–1460, docs/engineering/08 §matrix) → F2 · provenance/honesty (R18, journey honesty rules) → F8 · dashboards/role homes → M13 · notifications/search → F6 · brief-only scope → M03/M09/M10.

- [ ] **Step 1: Read** `docs/15-spec-resolutions.md` fully first (the overlay), then each source file listed above.
- [ ] **Step 2: Write the eight ledger files** per the schemas above. Verbatim quotes for D-census and rulings; terse but complete rows elsewhere. Mark every item superseded-by-overlay explicitly (e.g., `D38 → superseded: billing IS in v1`).
- [ ] **Step 3: Verify counts:** `grep -c '^| D' d-census.md` = 39 · rulings file contains R1–R18, R20, and ≥10 §4 directives · journey-stages has 10 stage sections (0–8 incl. 6B) and ≥40 `wrong` keys · customer-journey has 13 `C` keys · `grep -c 'SC\.' studio-census-checklist.md` ≥ 100 · ux-gaps has 27 rows · competitive-verdicts has 19 CG rows. Fix any shortfall by re-reading the source section.
- [ ] **Step 4: Cross-check `target_doc`:** every row has a non-empty `target_doc`; `grep -c 'target_doc: *$'` = 0 across ledger files.

### Task 3: `docs/prd/01-product-overview.md`

**Files:** Create: `docs/prd/01-product-overview.md` · Modify: `docs/prd/registers/traceability.md` (append rows)

**Interfaces:** Produces the V2 vision statement, the globalized three convictions, and the glossary — canonical terminology (Lead, Proposal-not-Quotation per R1, Provenance tier, Market pack, Tracked seat, Customer link, Price book, Catalog release…) that every doc uses.

- [ ] **Step 1: Read** ledger slices `DOC00.*`, `DOC01.*` (positioning only), competitive-verdicts moat list; brief goals from design-spec §1; journey terminology table (line ~1242).
- [ ] **Step 2: Write** per template: vision (mobile-first global SaaS for solar EPCs; studio as flagship); primary goals (the 10 from the brief); the three convictions globalized (studio uncompromised · honesty is a feature · market-config-first, India first pack); product principles (soft-block law, no feature flags — entitlements are the only gating, phone-as-identity, no-login customer, progressive onboarding); the three audiences table; glossary (≥20 terms). Non-goals summary pointing at module non-goal sections (DD2 list).
- [ ] **Step 3: Verify:** glossary ≥ 20 rows; the words "Quotation" appears only as R1 naming note; every DD1–DD14 consistent statement spot-check (no timelines, no per-seat except tracked seats).
- [ ] **Step 4: Append traceability rows** for all `DOC00.*` keys and moat items (`CG-moat.*` → live in 01/relevant modules).

### Task 4: `docs/prd/02-personas.md`

**Files:** Create: `docs/prd/02-personas.md` · Modify: traceability.

**Interfaces:** Produces the 12 persona names used by every module's §2: EPC Owner · Sales Manager · Sales Executive · Survey Engineer · Design Engineer · Project Manager · Field Technician · Installation Team Member · HR/Admin · Finance · Operations · Marketing.

- [ ] **Step 1: Read** journey roles matrix (~1425–1465), Stage 1 role-landing content (S1 ledger), docs/engineering/08 role matrix rows, brief persona list.
- [ ] **Step 2: Write** one section per persona: who they are (EPC context), goals, pains (from source "what goes wrong" where attributable), day-in-the-life narrative, primary surfaces (mobile vs web emphasis), home screen (from S1: rep → My Day, surveyor → today's visits, designer → designs awaiting, engineer → sign-off queue, owner → pipeline; define homes for the six new personas as `BRIEF` requirements), permissions summary pointer to F2. Tag persona-level requirements (each home screen is a requirement row).
- [ ] **Step 3: Verify:** 12 `## ` persona sections; each has all six subsections; six SRC homes match S1 ledger verbatim intent.
- [ ] **Step 4: Append traceability** (S1 keys, roles-matrix keys → 02/F2).

### Task 5: `docs/prd/foundations/F2-roles-and-permissions.md`

**Files:** Create: `docs/prd/foundations/F2-roles-and-permissions.md` · Modify: traceability, open-questions.

**Interfaces:** Produces the FIXED preset role list and semantics all tasks use; the per-module permission matrix skeleton that Tasks 12–23 fill (each module task appends its matrix rows HERE, not in the module file).

- [ ] **Step 1: Read** ledger: D20/D28/D29 census rows, R16 (installer gap), docs/engineering/08 permission rules (`DOC08.*` incl. "Manage catalog and price book" row), journey matrix; design-spec §12 (13 candidates) and DD3/DD11.
- [ ] **Step 2: Decide and write the final preset set** with rationale: recommended resolution — 12 presets matching the persona names, with **Field Technician and Installation Team Member as distinct presets** (different permissions: technician = visits/tasks; installer = installation checklists/photos) unless source R16 argues merger; record the decision and rationale inline; if genuinely arguable, keep both and add open-question row. Write semantics: stackable, OR-across-roles, widest-visibility-wins (D20), **no custom roles, no per-person exceptions ever** (D28/D29 carried, DD3).
- [ ] **Step 3: Write the matrix skeleton:** one table per module M01–M13 + F5 customer-link surfaces, columns = 12 roles, rows = capability placeholders marked `(filled by module task)` — plus the already-known SRC rows: catalog/price-book manage = Owner+Operations, Finance view (DD11); billing = Owner; sign-off = Design Engineer(approver role semantics).
- [ ] **Step 4: Verify:** 12 role columns in every matrix; D28/D29/D20 quoted with SRC pointers; `grep -c 'filled by module task'` ≥ 13 (skeletons present for later tasks).
- [ ] **Step 5: Append traceability** (D20, D28, D29, R16, DOC08 role keys).

### Task 6: `docs/prd/foundations/F1-global-market-framework.md`

**Files:** Create: `docs/prd/foundations/F1-global-market-framework.md` · Modify: traceability, conflicts (if pack facts conflict across docs).

**Interfaces:** Produces market-pack concept + pack key naming (`pack.tax`, `pack.subsidy`, `pack.calling-rules`, `pack.payment-rails`, `pack.certification-schemes`, `pack.formats`, `pack.data-rights`, `pack.price-book`) and the complete India pack. Modules reference these keys instead of Indian specifics.

- [ ] **Step 1: Read** ledger: `DOC00` conviction 3, forward-compat "Market & money" block, `DOC16` IN mechanics (GST/SAC/mandate ladder), `DOC08` DPDP/data-rights, D36 calling rules (journey @58), R13-amended certifications, docs/01 market-scope note.
- [ ] **Step 2: Write** the framework: what a market pack is (configuration, not product change — DD6); the pack surface list (the 8 keys above, each with its requirement rows: what every pack MUST define); market lifecycle (authoring a pack = launching a market); explicit rule: **no FX-converted pricing — every market authors its own price book** (DD6).
- [ ] **Step 3: Write the India pack in full** as the source-derived reference instance: GST money path (ex-GST prices, GSTIN capture, CGST/SGST/IGST place-of-supply, SAC 998434, e-invoicing threshold rule), PM Surya Ghar subsidy slabs (computed, versioned config), DISCOM-aware states + blocker attribution vocabulary, TRAI/DLT calling rules (9am–9pm, DND scrub, disclosure ≤30s, template registration), ₹ lakh/crore + Devanagari formats, IN payment rails (UPI AutoPay ₹15k cap ladder, e-mandate, e-NACH), ALMM/DCR certification schemes, DPDP data rights (read+export always; erasure workflow exists product-side).
- [ ] **Step 4: Verify:** 8 pack keys each have ≥1 requirement row; India pack instantiates all 8; `grep -ci 'GST\|DISCOM\|ALMM\|TRAI'` in every `docs/prd/modules/M*.md` authored later must be 0 except pack references — record this as a standing verification rule in the file's cross-module contracts.
- [ ] **Step 5: Append traceability.**

### Task 7: `docs/prd/foundations/F8-data-honesty.md`

**Files:** Create: `docs/prd/foundations/F8-data-honesty.md` · Modify: traceability.

**Interfaces:** Produces the provenance vocabulary (`measured / derived / estimated / assumed`), money-staleness law, indicative-proposal law, sign-off law — referenced by M04/M05/M06/M11/M13.

- [ ] **Step 1: Read** ledger: R18 + phase-10 provenance definition (docs/15 line ~115), journey honesty rules (S6B "honesty rule" @572, provenance table @569), energy source labelling (R5), docs/00 conviction 2, agent correlation-not-attribution (docs/12 moat #2).
- [ ] **Step 2: Write** requirement rows: every user-visible number carries a provenance tier; tier definitions verbatim; energy source labels ("Real · PVGIS ({database})" vs "Built-in estimate ±10%"); money never renders stale (recompute-before-display law, pinned versions on sent docs); Path B proposals must say "Indicative proposal"; structural adequacy never computed — Design Engineer signs off; agent impact reported as correlation not attribution; usage screens show exactly the billed numbers (DOC16 honesty row).
- [ ] **Step 3: Verify:** four tier definitions verbatim vs ledger; ≥8 requirement rows, all SRC-tagged.
- [ ] **Step 4: Append traceability.**

### Task 8: `docs/prd/foundations/F3-localization.md`

**Files:** Create: `docs/prd/foundations/F3-localization.md` · Modify: traceability.

- [ ] **Step 1: Read** ledger `DOC10.*` product-level rows (languages, per-user language, catalog-vs-data distinction, Devanagari-correct PDFs, formats); F1 pack.formats key.
- [ ] **Step 2: Write:** launch languages EN/HI/MR (`SRC`); per-user language choice; UI copy vs tenant data separation; document rendering must be script-correct (Devanagari at launch); number/currency/date formats delegate to F1 pack.formats; add-a-language readiness as product requirement (`BRIEF`: architecture assumes many more); voice-agent language set (6) noted as M07-owned.
- [ ] **Step 3: Verify:** no i18n *implementation* detail (no library names as requirements — Lingui appears only as reference-implementation note); ≥6 requirement rows.
- [ ] **Step 4: Append traceability.**

### Task 9: `docs/prd/foundations/F7-design-language.md`

**Files:** Create: `docs/prd/foundations/F7-design-language.md` · Modify: traceability.

**Interfaces:** Produces V2 UX principles referenced by every module's screens; binds `design/ds-source/` as visual language.

- [ ] **Step 1: Read** `design/ds-source/readme.md` + token file names; ledger `DOC10` design rulings (docs/15 §3); ux-gaps ledger (all 27 — they inform principles); design-spec §7.
- [ ] **Step 2: Write:** design system is binding (tokens, Geist, near-black actions, no invented logo/mark — UXG-26/27 recorded as open brand questions in open-questions register); V2 UX principles: mobile-first 375px full parity, touch-first studio, one-record-that-travels navigation, progressive disclosure onboarding, honesty UI patterns (provenance badges, staleness banners), offline-visible states (F4), speed budgets as product requirements (<30s lead add, <10min survey-to-proposal carried from source). Rule: every carried v1 UX decision must be justified (DD12 component picker is the worked example, marked carried-because-better).
- [ ] **Step 3: Verify:** UXG-26/27 present in open-questions register; principles ≥8; no CSS/token values duplicated as requirements (reference the ds-source files instead).
- [ ] **Step 4: Append traceability** (design rulings + UXG-26/27).

### Task 10: `docs/prd/foundations/F4-data-integrity.md`

**Files:** Create: `docs/prd/foundations/F4-data-integrity.md` · Modify: traceability.

**Interfaces:** Produces the offline boundary vocabulary (offline-capable / online-first / online-only) modules use in behavior detail.

- [ ] **Step 1: Read** ledger `DOC06.*` (offline scope, sync semantics, conflict policy), R14 (offline boundary ruling), UXG-10 (sync status system), S4 physical-survey constraint (@361).
- [ ] **Step 2: Write** product-level: what works offline (R14 boundary verbatim: physical survey capture, photos, My Day reads…), what never does; sync-status UX requirements (global indicator, sync centre, per-record chips, version-kept notices, stale-read banner — UXG-10 as SRC); conflict policy at product level (last-write-wins where source says so, version-kept surveys); offline queue drain never blocked by billing state (DOC16 rule).
- [ ] **Step 3: Verify:** boundary table lists ≥6 capability rows each side; UXG-10 fully absorbed (its 5 surfaces all present).
- [ ] **Step 4: Append traceability.**

### Task 11: `docs/prd/04-business-model.md`

**Files:** Create: `docs/prd/04-business-model.md` · Modify: traceability, open-questions, enhancements.

**Interfaces:** Produces tier names (Starter/Growth/Pro/Enterprise), meter list (voice minutes · AI detections · storage · marketing sends · tracked field seats; OTP absorbed), soft-block state names — used by M12 and M13.

- [ ] **Step 1: Read** ledger `DOC01.*` (all), `DOC16` §1/§3 (tier shape, soft-block matrix), design-spec §8 + DD5/DD6/DD7.
- [ ] **Step 2: Write:** who pays; convictions (org-level, unlimited users, capacity+usage never features, trial-only no free tier, grandfather generously, a price for every EPC); tier architecture (capacity ceilings + counts + bundles; the four tiers as structure); metered-COGS policy (bundles + overage ≥40% above worst-case unit COGS) applied to all five meters — marketing sends (`BRIEF`) and tracked seats (DD7, the sole per-seat exception with its included-vs-paid boundary) added; soft-block law + state capability matrix (from DOC16 §3, product-level); market price-book architecture (DD6, referencing F1 pack.price-book); India book as complete baseline instance (v1 numbers, caps, bundles, mandate routes — SRC); GTM principles kept product-level (pricing principles 1–9 from docs/01 carried, amended by DD6/DD7).
- [ ] **Step 3: Record:** open-question Q1 already seeded (India re-validation) — extend with tracked-seat price + marketing bundle sizes per market; enhancements register: none expected here, add only if genuinely arising.
- [ ] **Step 4: Verify:** the phrase "per-seat" appears ONLY in the tracked-seat exception; soft-block matrix states read+export+customer-links always-on; no timeline words (grep -ci 'day 20\|launch-1\|track [A-F]' = 0).
- [ ] **Step 5: Append traceability** (all DOC01 keys, DOC16 §1/§3 keys).

### Task 12: `docs/prd/modules/M01-onboarding-and-tenant-config.md`

**Files:** Create: `docs/prd/modules/M01-onboarding-and-tenant-config.md` · Modify: F2 (fill M01 matrix rows), traceability, enhancements.

**Interfaces:** Produces tenant-config surface names (Catalog, Price book, Branding, Proposal templates, Payment terms, Message templates, Agent setup pointer) referenced by M03/M06/M07/M11.

- [ ] **Step 1: Read** ledger S0 + S1 rows (screens, traps, wrong-items), D11 (signup fields), catalog rules (R13-amended, DOC04 catalog product rules: archive-never-delete, releases, pinning), DD8–DD12, tenant-config list (vision §"Tenant configuration"), progressive-onboarding trap (journey @119–124).
- [ ] **Step 2: Write** feature areas: company signup (phone+OTP+company name only — D11; Google login `BRIEF`; demo Pune-class rooftop ready day one — globalize as "demo site per market pack"); team invites by phone+role (S1); progressive setup (never demand catalog/GST upfront — the S0 trap as a requirement); **Catalog** (the full DD8–DD11 design: market-scoped master slice, own SKUs, sparse overrides, unified search, inline add everywhere, datasheet PDF extraction, Excel import with smart-match — each a requirement row; picker pattern itself lives in M05/M06 shared-pattern section, referenced); **Price book** (versioned, immutable, sent-docs pin versions); Branding; Proposal templates; Payment terms (tranche templates); Message templates; roles screen (references F2; no custom roles).
- [ ] **Step 3: Fill F2 M01 matrix rows** (Owner: all; Operations: catalog/price-book manage per DD11; others: read where source says).
- [ ] **Step 4: Verify:** S0/S1 `wrong` keys all present in edge-cases; catalog rows cover all 9 DD8–DD11 behaviors (market slice, certs badges, own SKU, override, unified search, inline add, PDF extraction, Excel smart-match, archive-never-delete); no GST/₹ specifics outside pack references.
- [ ] **Step 5: Append traceability.**

### Task 13: `docs/prd/modules/M02-crm-and-leads.md`

**Files:** Create: `docs/prd/modules/M02-crm-and-leads.md` · Modify: F2 rows, traceability, enhancements.

**Interfaces:** Produces lead lifecycle states (incl. R9 snooze/dormant/reopen machine) and assignment semantics used by M03 (lead handoff), M07 (My Day), M13 (pipeline).

- [ ] **Step 1: Read** ledger S2 + S3 (all rows incl. every wrong-item), D2/D13/D14 post-overlay, R8 (merge), R9 (snooze state machine verbatim), UXG-01/02/03/04/05, customer/contact product rules from DOC04 (merge survivor semantics).
- [ ] **Step 2: Write** feature areas: quick add (<30s, 4 fields, phone-as-identity); live dedupe on every channel + dedupe sheet (UXG-02 three-choice flow); channels (manual, CSV import wizard UXG-01, inbound voice; website/WhatsApp-inbound recorded as superseded-by-brief → moved to M03 with cross-reference); lead inbox + morning triage; qualification; assignment with open-load visible (D14, UXG-04, bulk-assign); site-visit booking handoff to M04; snooze/dormant/reopen (R9 machine verbatim as state requirements); customer merge (R8 + UXG-05: survivor pick, re-point, audit); capture settings (UXG-03 as tenant config cross-ref to M01).
- [ ] **Step 3: Fill F2 M02 rows** (rep sees own, manager team, owner everything — D20 applied).
- [ ] **Step 4: Verify:** R9 states all present; all S2/S3 wrong-keys present; UXG-01/02/04/05 absorbed; phone-identity stated market-neutrally (E.164 semantics via pack.formats).
- [ ] **Step 5: Append traceability.**

### Task 14: `docs/prd/modules/M04-survey.md`

**Files:** Create: `docs/prd/modules/M04-survey.md` · Modify: F2 rows, traceability.

- [ ] **Step 1: Read** ledger S4 (all — modes @309, honesty consequence @318, remote-cannot @328, Mode A @338, Mode B @356, constraint @361, captured @367, screens/wrong), D30, D35 (photos = reference only, stays non-goal per DD2), R5, R14.
- [ ] **Step 2: Write:** two modes; Mode A remote (satellite imagery + AI roof detection with confidence + editable overlay + honest coverage failure states; detection metered — cross-ref 04-business-model); Mode B physical (guided capture, fully offline per F4/R14, photo capture with queue); what remote cannot tell you → surfaced to designer as requirement; survey→design handoff (what gets captured list verbatim); honesty consequence (coverage messaging); photos-any-source-including-drone are reference never measurement (SRC non-goal, D35).
- [ ] **Step 3: Fill F2 M04 rows** (Survey Engineer primary; Sales Executive can trigger remote per source).
- [ ] **Step 4: Verify:** all S4 wrong-keys present; imagery/solar-data vendors appear as capability requirements only; offline behaviors reference F4 vocabulary.
- [ ] **Step 5: Append traceability.**

### Task 15: `docs/prd/modules/M05-design-studio.md` (baseline per DD13)

**Files:** Create: `docs/prd/modules/M05-design-studio.md` · Modify: F2 rows, traceability, open-questions.

**Interfaces:** Produces the shared component-picker pattern section (DD12) that M06 references; design outputs vocabulary (BOM, SLD, captures, variants, health score) used by M06/M08/M13.

- [ ] **Step 1: Read** ledger S5 (steps, UX problems @446, new screens @455, wrong), studio-census-checklist (ALL entries), `DOC11.*` (scale program: phases, blocks/trackers/terrain commitments), D16, UXG-06/07/08, R12 (chip-rail), DD12/DD13, F8 honesty rows.
- [ ] **Step 2: Write:** purpose (flagship; touch-first; full parity at 375px); the 10-step flow as feature areas (site setup → roof drawing → obstructions → components → panel layout → 3D shadow → captures → SLD → BOM → done) — each step's requirements from census entries at inventory depth (this is the baseline; per-tool depth arrives in pass two); **the census as acceptance baseline**: incorporate `studio-census-checklist.md` by reference as normative appendix ("never shrinks"); shared component-picker pattern (DD12: accordion Panel→Capacity→Inverter→Battery; Browse database / Upload datasheet PDF-extraction / manual specs; scheme-keyed compliance badges; used here and by M06); variants side-by-side + is_recommended (D16, UXG-08); engineer sign-off queue + return-with-comments (UXG-06/07, F8 sign-off law); 1kW→100MW commitment with scale-program product capabilities (blocks/zones, trackers, terrain — tiered per source phases as P0/P1/P2 mapping, no timelines); catalog release pinning + self-stale fingerprints (product behavior); free navigation vs gating (R12).
- [ ] **Step 3: Record** open-question: "Studio deep-dive pass two will expand M05 feature-by-feature from the dedicated studio repo (DD13)"; F2 rows (Designer author, Design Engineer sign-off, read-only for sales).
- [ ] **Step 4: Verify:** every census section referenced (`grep -c 'SC\.'` in M05 + appendix ≥ census count); 10 steps present; picker section exists once and M06 will reference it; all S5 wrong-keys present.
- [ ] **Step 5: Append traceability** (S5, SC.*, DOC11, D16, R12, UXG-06/07/08).

### Task 16: `docs/prd/modules/M06-proposals.md`

**Files:** Create: `docs/prd/modules/M06-proposals.md` · Modify: F2 rows, traceability, enhancements.

- [ ] **Step 1: Read** ledger S6 + S6B (all: two paths @544, pre-fill @562, honesty rule @572, entry points @587, 11-step spec @595, product recommendations @704, wrong @742), D22, R1, R11 (quick mode), R12, D34 (no discount approvals — non-goal; payable ≤ 0 blocks Generate), battery modal rows (@628–640, 667, 683, 753), pinning rules (DOC04: sent proposals keep prices forever).
- [ ] **Step 2: Write:** one builder, two paths (A design-derived / B indicative — F8 labelling law); 11-step spec (each step a feature area with its source requirements); quick mode (R11: steps 1/3/8/10, AI-fill, loss-free expand); chip-rail free navigation, validation only at Generate (R12); components mandatory incl. battery-when-added (D22) with the shared picker referenced from M05 + battery card/modal requirements (capacity, chemistry, cost, tax via pack, OFFGRID/HYBRID force-battery hard block); versioning + server-assigned numbers; duplicate-carries-components; pricing/subsidy/discount via pack keys; payable ≤ 0 blocks Generate (the only guard — D34 non-goal recorded); proposal templates (M01 cross-ref); send = customer link (F5 cross-ref); battery economics modeling → enhancements register (`REC`, from design-spec §10).
- [ ] **Step 3: Fill F2 M06 rows;** append the battery-economics REC row to enhancements.
- [ ] **Step 4: Verify:** 11 steps present; both honesty rules verbatim-faithful; all S6/S6B wrong-keys present; "Indicative proposal" phrase present; no GST specifics outside pack refs.
- [ ] **Step 5: Append traceability.**

### Task 17: `docs/prd/modules/M07-sales-execution.md`

**Files:** Create: `docs/prd/modules/M07-sales-execution.md` · Modify: F2 rows, traceability.

- [ ] **Step 1: Read** ledger S7 (My Day @767, agent screens @788, agent defaults @797, close @809, wrong), D36 (+calling rules @58), R3 (vendor→capability), R10 (agent correction training), voice ledger rows from DOC04 §8 product rules (config versioning, queued calls keep version), agent-setup tenant config (S0/tenant-config ledger), F8 correlation rule.
- [ ] **Step 2: Write:** My Day (rep home: today's follow-ups, overdue, snoozes surfacing — R9 cross-ref); follow-up task system; **voice agent**: tenant setup (guided + knowledge base + unanswered-questions loop), agent defaults all owner-editable (D36: proposal-unopened-3d, task-overdue-2d, on-demand), calling windows/compliance via pack.calling-rules (disclosure ≤30s, hand-to-human on request, 6 languages), call queue + outcomes transcribed to timeline, correction training loop (R10), agent performance screen (correlation not attribution — F8); close: Mark won → creates project (M08 handoff), Mark lost with reason.
- [ ] **Step 3: Fill F2 M07 rows** (agent controls Owner-only per source; reps see own queue).
- [ ] **Step 4: Verify:** all S7 wrong-keys; vendor names only as reference implementations; D36 editability stated; language set = 6.
- [ ] **Step 5: Append traceability.**

### Task 18: `docs/prd/modules/M08-projects.md`

**Files:** Create: `docs/prd/modules/M08-projects.md` · Modify: F2 rows, traceability.

**Interfaces:** Produces project stage names (R2 machine) and blocker attribution vocabulary (DISCOM/customer/material/us → globalized: utility/customer/material/company) used by F5, M11, M13.

- [ ] **Step 1: Read** ledger S8 (light boundary @842, real stages @859, tranche connection @874, screens, wrong @908, roles @929, recs @938), R2 (state machine), R15 (referral), D9 non-goals (DD2: stays out — status+documents+money), C10–C12 rows (customer-visible progress).
- [ ] **Step 2: Write:** "light" boundary as explicit scope law (status + documents + money; D9 exclusions recorded as non-goals with rationale); stage board (R2 chain, market-neutral stage names with pack-specific waits via pack keys); document checklist; blockers with attribution (vocabulary globalized, IN names in pack); tranche payments (connection to M11 — the "what makes this valuable" requirement); handover + referral ask (R15 model); commissioning artefacts retained for future O&M attach (SRC).
- [ ] **Step 3: Fill F2 M08 rows** (PM primary; roles-here ledger rows applied).
- [ ] **Step 4: Verify:** R2 states all present; all S8 wrong-keys; no O&M/inventory/crew features (grep 'inventory\|crew' → only in non-goals).
- [ ] **Step 5: Append traceability.**

### Task 19: `docs/prd/modules/M11-payments-and-collections.md`

**Files:** Create: `docs/prd/modules/M11-payments-and-collections.md` · Modify: F2 rows, traceability.

- [ ] **Step 1: Read** ledger DOC16 §8 (BYO collections, manual modes, never-touch-funds line), tranche math rows (DOC04 money-path: BOM↔proposal↔tranches↔payments to minor unit, append-only corrections), C9 (advance payment), UXG-12 (payment-link handoff), payment terms config (M01 cross-ref).
- [ ] **Step 2: Write:** tenant-side money only (platform SaaS billing is M12 — state the two-money-systems law); tranche schedule from payment terms; BYO gateway connection (capability requirement; per-market rails via pack.payment-rails; funds settle EPC-direct — the regulatory line as product law); payment links on due tranches (C9/UXG-12 flow); manual payment modes + receipt attach (pack payment modes); receipts to customer link; money integrity laws (pinned versions, corrections as reversal rows, to-the-minor-unit).
- [ ] **Step 3: Fill F2 M11 rows** (Finance view/manage; Owner manage).
- [ ] **Step 4: Verify:** "never touches funds" law present; no gateway vendor as requirement; tranche↔project cross-refs resolve (M08 stage names).
- [ ] **Step 5: Append traceability.**

### Task 20: `docs/prd/foundations/F5-customer-link.md`

**Files:** Create: `docs/prd/foundations/F5-customer-link.md` · Modify: F2 (link-surface matrix rows), traceability.

- [ ] **Step 1: Read** ledger customer-journey (C1–C13 + framing + lifecycle), D5, R6 (+UXG-11 named links, OTP-at-accept), UXG-12 (question inbox), soft-block law (links always live — DOC16 §3), D33 history.
- [ ] **Step 2: Write:** the no-login law (D5); link lifecycle (proposal → progress → handover); each C-step as a feature area with its requirements (C1 enquiry ack … C8 accept with named-link + OTP-above-threshold, C9 pay advance, C10 the long wait made visible + attributable, C11 installation, C12 commissioning, C13 handover pack + referral); negotiation/ask-a-question (tenant-side handling per UXG-12); 3D roof view in proposal (M05 captures cross-ref); never blocked over unpaid money + always-live under tenant billing states (soft-block law); white-label/custom-domain recorded as Enterprise packaging note (CG-18).
- [ ] **Step 3: Fill F2 rows** for link management (who creates/revokes named links).
- [ ] **Step 4: Verify:** 13 C keys present; OTP-at-accept threshold is tenant-set (SRC); lifecycle has 3 phases.
- [ ] **Step 5: Append traceability.**

### Task 21: `docs/prd/modules/M03-marketing.md` (`BRIEF`)

**Files:** Create: `docs/prd/modules/M03-marketing.md` · Modify: F2 rows, traceability, enhancements, conflicts (superseded D-records).

- [ ] **Step 1: Read** design-spec §11 (M03 scope), ledger D13/D32 (superseded-by-brief — record the supersession), CG-14 (WhatsApp-native gap + BYO-WABA note), 04-business-model marketing-send meters, M02 channel cross-refs, brief channel list.
- [ ] **Step 2: Write:** campaign management (create/schedule/audience from CRM segments); channels Email/WhatsApp/SMS/Facebook/Instagram as capability requirements (`BRIEF`) — sender identity is tenant-owned (BYO-WABA pattern from CG-14 for WhatsApp; social lead forms feed lead capture); lead capture from channels → M02 pipeline with dedupe (phone-identity preserved); website form + inbound WhatsApp (formerly D13-excluded — now `BRIEF`, supersession recorded); message templates (M01 cross-ref) with per-market compliance via pack.calling-rules/messaging rules (DLT-class template registration as pack concern); sends metered per 04-business-model; campaign→pipeline attribution reporting (correlation framing per F8); voice-agent remains M07 (follow-up), cross-referenced as a channel surface. AI content generation etc. → enhancements register only.
- [ ] **Step 3: Fill F2 M03 rows** (Marketing role primary; Owner approves? — decide from OR-semantics: Marketing manages campaigns, Owner controls spend-adjacent settings; record rationale).
- [ ] **Step 4: Verify:** every requirement tagged `BRIEF` or `REC` (SRC only where genuinely source-derived, e.g., inbound voice, template config); D13/D32 supersession rows in traceability; no invented AI features outside enhancements.
- [ ] **Step 5: Append traceability.**

### Task 22: `docs/prd/modules/M09-field-workforce.md` (`BRIEF`)

**Files:** Create: `docs/prd/modules/M09-field-workforce.md` · Modify: F2 rows, traceability, enhancements, open-questions.

- [ ] **Step 1: Read** design-spec §11 (M09 scope: the 10 brief-mandated capabilities) + DD7 (per-seat boundary); ledger rows that touch field work (S4 physical visits, S1 surveyor home, R16); F4 offline vocabulary; 04-business-model tracked-seat meter.
- [ ] **Step 2: Write:** capability areas each tagged `BRIEF`: live location (tracked seats only — DD7 boundary stated: check-in/out + visit logging included for everyone; live tracking/route timeline/geofence/movement history/activity playback per tracked seat); attendance (day start/end, ties to M10 records); visit tracking (planned vs actual, links to M02 site visits and M04 surveys); route timeline + daily movement playback; site geofencing (auto check-in prompts, site radius per project site); activity timeline per field user; team visibility dashboard (manager view); privacy laws as product requirements: tracking only during work hours, owner-toggled per employee, employee-visible tracking state, per-market privacy compliance via pack.data-rights. Anything beyond the brief list → `REC` rows in enhancements (e.g., task-route optimization) — clearly separated.
- [ ] **Step 3: Fill F2 M09 rows** (Field Technician/Installation/Survey Engineer as tracked roles; Manager/PM see team; HR sees attendance only).
- [ ] **Step 4: Verify:** no fleet-management surplus (grep 'fuel\|vehicle\|fleet' = 0 outside non-goals); DD7 boundary verbatim; every row `BRIEF` or `REC`.
- [ ] **Step 5: Append traceability.**

### Task 23: `docs/prd/modules/M10-hr-lite.md` (`BRIEF`) + `docs/prd/modules/M12-platform-billing.md` + `docs/prd/modules/M13-dashboards-and-reporting.md` + `docs/prd/foundations/F6-notifications-and-search.md`

Four remaining docs — grouped because each is compact and their sources are already extracted; execute as four sub-units in order, same rhythm each.

**Files:** Create the four files · Modify: F2 rows (M10/M12/M13/F6), traceability, enhancements.

- [ ] **Step 1 (M10):** Read design-spec §11 + S1 invite flow + M09 attendance ties. Write SME-weight HR: employee records (role assignments feed F2), invite/offboard lifecycle (offboard = access revocation + reassignment of open work — source wrong-items from S1), attendance/leave (shared surface with M09), team structure (manager mapping used by D20 visibility), document storage per employee (contracts/certs). Explicit non-goals: payroll, recruitment, performance reviews (unless justified — record as REC if arguable). All `BRIEF`. Fill F2 rows (HR/Admin primary). Verify: no enterprise-HR surplus. Append traceability.
- [ ] **Step 2 (M12):** Read ledger DOC16 §2/§5/§6/§7/§9/§10 (lifecycle, entitlements-only gating, metering honesty, invoicing, dunning, refunds/proration) + 04-business-model interfaces. Write product-level: subscription lifecycle states + what each state means for users (soft-block matrix by state); entitlements as the ONLY runtime gating (no feature flags — owner directive); usage screens (same numbers as billed — F8); dunning communication ladder (channels via market pack, honest copy — no data-deletion threats); invoicing per pack.tax; refunds (first-cycle only), upgrade-immediate/downgrade-at-boundary with honest downgrade preview; reactivation always available; trial lifecycle + nudges. Fill F2 rows (Owner-only billing). Verify: state machine states all present; grep 'Razorpay' only as reference implementation. Append traceability.
- [ ] **Step 3 (M13):** Read ledger S1 role homes, dashboards mentions (vision "full dashboards", journey owner-pipeline, agent performance), M02/M06/M07/M08 outputs. Write: per-persona dashboard requirements (12 personas — owner pipeline + funnel, manager team load + conversion, rep My Day summary, PM project board rollup, Finance collections aging, Marketing campaign performance, HR attendance rollup, Operations catalog/ops health…; SRC where source names them, else `BRIEF`); pipeline analytics (stage conversion, cycle time — the "reduce sales cycle" goal made measurable); usage/agent performance cross-refs; export rules (read+export law). Fill F2 rows (dashboards respect D20 visibility). Verify: 12 persona rows. Append traceability.
- [ ] **Step 4 (F6):** Read ledger notification mentions across stages (assignment, sign-off, agent outcomes, payment received, dunning, sync failures) + global-search mention (vision Track A–C). Write: notification matrix (event × persona × channel in-app/push, tenant-configurable quiet hours via pack), notification honesty (no false urgency), global search (one search across leads/customers/proposals/projects/catalog — scoped by role visibility D20). Fill F2 rows. Verify: matrix covers every module's named events (cross-check each M-doc §4 contracts). Append traceability.

### Task 24: `docs/prd/03-journey-map.md`

(Authored late deliberately: it links into finished module PRDs.)

**Files:** Create: `docs/prd/03-journey-map.md` · Modify: traceability.

- [ ] **Step 1: Read** ledger journey-stages + customer-journey summaries; the finished module docs' §1 purposes.
- [ ] **Step 2: Write:** the globalized nine-stage EPC journey (stage → one-paragraph narrative → link to owning module PRD → key personas → the stage's P0 heart); the parallel customer journey C1–C13 (linking F5); the "one record that travels" thread as the connective narrative; a stage↔module↔persona map table.
- [ ] **Step 3: Verify:** every stage links to an existing file (`grep -o '](.*\.md' | check each path exists`); no requirement rows here (narrative doc — requirements live in modules; any stray table flagged and moved).
- [ ] **Step 4: Append traceability** (journey map keys → 03).

### Task 25: Completeness verification gate (design-spec §13) — loop until closed

**Files:** Modify: `docs/prd/registers/traceability.md` (close ledger), `docs/prd/registers/conflicts.md`, any PRD doc with defects · Create: `docs/prd/_process/verification-report.md`

**Interfaces:** Consumes every ledger file and every PRD doc. Produces the closed ledger + verification report the owner reviews.

- [ ] **Step 1: Mechanical sweep** — for each ledger file, extract all keys; for each key confirm a traceability row exists with disposition live/superseded/excluded/conflict: `grep -o 'D[0-9]\+\|R[0-9]\+\|S[0-9B.]\+\.wrong\.[0-9]\+\|C[0-9]\+\|UXG-[0-9]\+\|CG-[0-9]\+\|SC\.[a-z0-9.]\+\|DOC[0-9]\+\.[a-z-]\+'` per file, diff against ledger key lists. Zero missing keys required. (Parallel workflow: one checker agent per ledger file is the intended execution.)
- [ ] **Step 2: Disposition audit** — every `live` row's PRD ID exists (`grep` the ID in the named file); every `superseded` row names its superseder (Rn / brief / DDn); every `excluded` row cites DD2 rationale; every `conflict` row has a conflicts-register entry.
- [ ] **Step 3: Eight-check pass** from spec §13 explicitly: D1–D39 ✓ · rulings ✓ · stages (screens/happy/wrong/not-in-v1/recs) ✓ · C1–C13 ✓ · census ✓ · docs-rules ✓ · 27 UX gaps each mapping to a V2 UX decision ✓ · 19 competitive verdicts carried-or-re-ruled ✓. Write `verification-report.md`: per check, counts + any defects found + fixes applied.
- [ ] **Step 4: Fix defects in place** (add missing requirements/rows) and re-run Steps 1–3 until zero defects. Record iteration count in the report.

### Task 26: Consistency pass + handoff

**Files:** Modify: any PRD doc (fixes), `docs/prd/00-README.md` (final doc map), `docs/prd/foundations/F2-roles-and-permissions.md` (matrix completeness)

- [ ] **Step 1: F2 matrix completeness** — `grep -c 'filled by module task' docs/prd/foundations/F2-roles-and-permissions.md` = 0 (every module filled its rows); every matrix table has 12 role columns.
- [ ] **Step 2: Cross-reference audit** — every `(see <doc>)`/markdown link in `docs/prd/` resolves to an existing file; module §4 contracts reciprocate (if M06 expects the picker from M05, M05's §4 lists it).
- [ ] **Step 3: Template conformance** — every foundation/module doc has all 6 template sections; every requirement row has ID + tag + tier; `grep -rn 'TBD\|TODO' docs/prd/ --include='*.md'` = 0 (open items belong in open-questions register, not inline).
- [ ] **Step 4: Vocabulary sweep** — market-neutrality check (`grep -rn 'GST\|ALMM\|DISCOM\|TRAI\|lakh\|crore\|₹' docs/prd/modules/ docs/prd/foundations/` → hits only as pack references/examples labeled IN-pack, or in F1); role names match F2 exactly; tier names match 04-business-model; "Quotation" appears only in R1 naming notes.
- [ ] **Step 5: Handoff** — update 00-README doc map statuses to `reviewed-pending-owner`; write a short completion summary at the top of `verification-report.md` (docs count, requirement count `grep -rc '^| M[0-9]\|^| F[0-9]' docs/prd/`, SRC/BRIEF/REC counts, open-questions count); present the suite to the owner for review.
