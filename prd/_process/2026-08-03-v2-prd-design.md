# HelioGrid V2 PRD — Design Spec for the PRD Project

Date: 2026-08-03 · Status: awaiting owner review · Author: product-definition session with owner
Scope of this document: HOW the V2 PRD suite will be built — its structure, sourcing rules,
decisions already locked, and completeness verification. This is the spec for the *documentation
project*, not the PRD itself.

---

## 1. Purpose

Rebuild the entire product definition of HelioGrid as a fresh V2 PRD suite. The existing
repository (`docs/`, `design/`) is **source material only** — domain knowledge, workflows,
business rules, engineering lessons. It is never modified or extended. The new suite under
`prd/` becomes the single canonical product specification, detailed enough that UX, PM,
engineering, QA, writers and architects can build the product without consulting the old docs.

V2 is a fresh product definition, not a migration document. The product: the world's best
mobile-first SaaS platform for Solar EPC companies — mobile-first without compromising web,
global from day one, with the 3D Design Studio as the flagship.

## 2. Locked decisions (owner-ruled during design, 2026-08-03)

| # | Decision | Ruling |
|---|----------|--------|
| DD1 | PRD structure | **Modular suite** under `prd/`: overview + personas + journey map + business model + 8 foundation specs + 13 module PRDs + 4 registers (§4) |
| DD2 | v1 explicit non-goals | **Brief-driven supersession.** Items the V2 brief calls for (marketing incl. WhatsApp sending, field workforce, HR) enter core scope. Items it doesn't (inventory/PO, crew scheduling, O&M/monitoring, LiDAR/AR measurement, discount approvals) stay out of core scope, documented as explicit non-goals with v1 rationale; genuine value gets a Recommended-Enhancement entry |
| DD3 | RBAC model | **Expanded fixed presets only** (~12 roles matching the persona set), stackable, OR-across-roles, widest visibility wins. No custom roles, no per-person permission exceptions — v1's D28/D29 conviction carried forward and widened |
| DD4 | Prioritization | **Priority tiers P0/P1/P2 on every requirement; no timelines, no phases, no build plan** |
| DD5 | Packaging | **Extend v1 philosophy**: every module in every tier; org-level subscription; tiers gate capacity + usage counts + metered bundles, never features; trial-only, no free tier; soft-block law (read + export + customer links always work) |
| DD6 | Global pricing | **Market-controlled price books.** Every market has its own price points, currency, tax scheme, payment rails, mandate mechanics, benchmarks, bundle sizes, overage rates. India book (₹1,999/₹3,999/₹9,999/Enterprise + v1 caps/bundles) is the source-derived first book. No FX-converted pricing, ever. Launching a market = authoring its book — configuration, not product change |
| DD7 | Field tracking pricing | **The one per-seat exception**: active field-worker tracking is a per-tracked-seat monthly add-on (real per-worker COGS; industry norm). Included in every tier: site check-in/out and visit logging (part of the core visit workflow). Per-seat bundle covers live location, route timeline, geofencing, movement history, activity playback. Owner toggles tracking per employee; billed as tracked-seat-months in the usage ledger; per-seat price set per market book |
| DD8 | Catalog: global book | **Market-scoped master catalog**: one platform catalog; items carry market availability + scheme-keyed certifications (IN: ALMM/DCR; other markets declare their schemes). Tenants see their market's slice + their own SKUs |
| DD9 | Catalog: ops | **Self-serve, no request queue.** Tenants add own products anytime: inline at proposal/design time (single product, datasheet PDF extraction, or Excel upload in-flow), or from Catalog settings. Unified search spans global + own catalog, filterable to either. Platform-book population (datasheet ingestion) is internal platform ops, never a tenant dependency |
| DD10 | Catalog: bulk import | **Excel/CSV import is P0**: guided import with smart matching — rows matching platform products become price overrides (no duplicate SKUs), unknown rows become tenant SKUs, errors fixed inline. Available at onboarding, in settings, and at proposal time |
| DD11 | Catalog: roles | **Owner + Operations** manage catalog and publish price-book versions; Finance views prices/margins; all roles pick from the catalog |
| DD12 | Component selection UX | **v1's Step-4 pattern is carried forward as source-derived P0** (owner-supplied screenshots, matches binding studio census): accordion sections Panel → Capacity → Inverter → Battery, each with three entry paths — Browse database · Upload datasheet (PDF extraction) · Enter specs manually — with compliance badges (scheme-keyed) in the picker. Competitively validated 2026-08-03 (§10) |
| DD13 | Studio sequencing | **Suite first, studio deep-dive second.** M05 in this pass is written fully from studio-census + journey Stage 5 + scale program. A dedicated second pass (own brainstorm → spec → plan cycle) extracts every feature from the owner's separate studio repo/PRD and expands M05 into the complete enhanced Studio PRD. The census is the cross-check between passes |
| DD14 | Repo handling | Write everything under `prd/`; **no git init, no commits** (owner instruction 2026-08-03). Source `docs/` and `design/` untouched forever |

## 3. Source corpus and reading rules

**Corpus (all of it is read):** `docs/00`–`16` (19 documents), `prd/_process/product-journey.md`
(master spec: D1–D39 census, 9-stage journey, customer journey C1–C13, roles matrix),
`prd/modules/M05-studio/studio-census.md` (binding studio acceptance gate), `docs/architecture.md`,
`docs/forward-compat.md`, `design/ds-source/` (design system). ~85,000 words.

**Reading rules:**
1. `product-journey.md` is read **only through the `15-spec-resolutions.md` overlay** — ~40% of
   D-text is superseded; superseded text never enters the PRD as a live requirement (it may enter
   the traceability register as "superseded by R-n").
2. `studio-census.md` is adopted verbatim as M05's acceptance baseline; the census never shrinks.
3. Owner directives in `15-spec-resolutions.md` §3–4 rank above everything else in the source.
4. Missing referenced sources — `docs/research/*` (market, journey, voice, auth, calc, fly,
   verify-billing, integrations) and the deleted `modules/` extractions — are recorded in the
   conflict register as **source gaps**. Facts that survive only as citations in existing docs are
   used as-is with the citation noted; nothing is invented to fill gaps.
5. Contradictions between docs are **recorded in the conflict register, never silently resolved**.
6. Technology/stack/architecture content from source informs *context only*: the PRD stays at
   product level — no APIs, no schemas, no code, no implementation tasks (owner brief).

## 4. Output structure (approved)

```
prd/
├── 00-README.md                       How to read: tagging, tiers, IDs, doc map
├── 01-product-overview.md             Vision, goals, product principles, glossary, market framing
├── 02-personas.md                     12 personas, each documented independently
├── 03-journey-map.md                  Globalized 9-stage EPC journey + customer journey C1–C13
├── 04-business-model.md               Packaging convictions, tier architecture, meters,
│                                      trial, soft-block law, market price-book architecture,
│                                      India book as source-derived baseline
├── foundations/
│   ├── F1-global-market-framework.md  Market packs: countries, currencies, tax schemes, units,
│   │                                  subsidy/compliance/calling rules; India = first pack
│   ├── F2-roles-and-permissions.md    ~12 fixed preset roles; per-module permission matrices
│   ├── F3-localization.md             EN/HI/MR launch; translation architecture; formats
│   ├── F4-data-integrity.md         Product-level offline behavior and conflict UX
│   ├── F5-customer-link.md            No-login tokenised customer journey (proposal→progress→handover)
│   ├── F6-notifications-and-search.md Notification matrix per persona; global search
│   ├── F7-design-language.md          design/ds-source as binding visual language; V2 UX principles
│   └── F8-data-honesty.md             Provenance tiers; money-never-stale; indicative labelling
├── modules/
│   ├── M01-onboarding-and-tenant-config.md
│   ├── M02-crm-and-leads.md
│   ├── M03-marketing.md               [BRIEF — new scope]
│   ├── M04-survey.md
│   ├── M05-design-studio.md           Flagship; census-grounded baseline this pass (DD13)
│   ├── M06-proposals.md
│   ├── M07-sales-execution.md         My Day, follow-ups, voice agent, close
│   ├── M08-projects.md
│   ├── M09-field-workforce.md         [BRIEF — new scope, TrackoBit-informed]
│   ├── M10-hr-lite.md                 [BRIEF — new scope]
│   ├── M11-payments-and-collections.md  Tenant-side money (tranches, BYO gateway, receipts)
│   ├── M12-platform-billing.md        SaaS subscription lifecycle, entitlements, dunning, invoicing
│   └── M13-dashboards-and-reporting.md
├── registers/                         (descriptive names — deliberately NOT R-numbered, to
│   │                                   avoid collision with the source's rulings R1–R20)
│   ├── traceability.md                Requirement ↔ source pointer index (completeness check)
│   ├── conflicts.md                   Contradictions + source gaps, recorded not resolved
│   ├── enhancements.md                Every REC in one place with rationale
│   └── open-questions.md              Decisions V2 still owes an owner ruling
└── _process/                          This spec; later the writing plan. Not product content.
```

## 5. Requirement format, tagging, IDs

Every module PRD uses one template: per feature area — personas + surfaces header, a requirement
table, then behavior detail prose, permissions reference (matrix lives in F2), edge cases,
"what goes wrong" coverage (carried from source, none dropped), acceptance criteria
(Given/When/Then), localization notes, analytics events.

- **IDs:** `M02-31`, `F1-07`, etc. — stable, referenced by registers.
- **Tags (origin, never mixed):**
  - `SRC` — source-derived; carries exact pointer (D-number, ruling, doc §). The default for
    everything extracted from the corpus.
  - `BRIEF` — mandated by the owner's V2 brief, not present in v1 source (marketing, field
    workforce, HR, Google login, global-first framing).
  - `REC` — recommended enhancement; lives in the module for context AND in the enhancements
    register with rationale. Never presented as source truth.
- **Priority:** P0 (core) / P1 (important) / P2 (later) on every requirement. No dates.
- **Provenance of numbers:** monetary and engineering values keep the source's honesty system —
  provenance tiers (measured/derived/estimated/assumed) are themselves a spec surface (F8).

## 6. Globalization method

Every India-specific rule in source is re-expressed as a requirement of the **market-pack
framework (F1)**, with India documented as the complete first pack: GST money path, PM Surya
Ghar subsidy slabs, DISCOM-aware states, TRAI/DLT calling rules, ₹ lakh/crore grouping,
IN payment rails (UPI AutoPay mandate ladder), ALMM/DCR certification schemes. Module PRDs stay
market-neutral and reference packs. Vendor names from source (MSG91, Razorpay, Exotel, Sarvam,
Google Solar, PVGIS) become capability requirements ("OTP delivery provider", "subscription
billing provider", …) with the v1 vendor noted as reference implementation. Auth: Mobile OTP +
Google Login (`BRIEF` — Google is new vs v1's OTP-only). Localization: EN/HI/MR at launch,
architecture assumes many more languages.

## 7. UX stance

The design system (`design/ds-source/` — Geist, tokens, near-black actions) is the **preserved
visual language**, documented as binding in F7. Every screen and workflow is redesigned from
first principles: mobile-first at 375 px with full web parity; native-feeling, fast mobile.
Mandatory inputs to the new UX: the source's `13-ux-gap-register.md` (27 registered UX gaps, UXG-01–27) and
every per-stage "what goes wrong" section — V2 UX must fix documented v1 pain, not re-inherit
it. Carried-over UX decisions must earn their place; the honesty UI (provenance badges,
money-staleness, indicative labelling) and the component-selection pattern (DD12) are carried
because they are objectively better, and are so marked.

## 8. Business model & monetization design

`04-business-model.md` owns: who pays (the EPC org; the EPC's customer never pays us),
packaging convictions (DD5), the tier axis (capacity ceilings + usage counts + metered
bundles), metered COGS policy (bundles + overage ≥40% above worst-case unit COGS), trial
(14-day, capped, no card), soft-block law, grandfathering, and the **market price-book
architecture** (DD6). New V2 meters: **marketing sends** (WhatsApp/SMS/email bundles per
market book) and **tracked field seats** (DD7). Existing meters carried: voice minutes, AI
detections, storage; OTP stays absorbed/fair-use. M12 owns product-level billing mechanics:
subscription lifecycle states, entitlements as the ONLY runtime gating (no feature flags),
usage transparency screens (same numbers we bill from), dunning, market-tax-scheme invoicing,
refunds/proration/cancellation, reactivation. India price points carry as baseline; the
open-questions register records that owner must re-validate India numbers given the bigger V2 box.

## 9. Catalog design

Carried from source and extended (DD8–DD11): two-tier model — market-scoped platform master
(typed engineering specs; provenance tags; scheme-keyed certifications; versioned append-only
with named releases; designs pin releases; sent proposals keep prices forever) + tenant own
SKUs + sparse overrides (price/tax/hide/preferred); resolution order override → own SKU →
platform item; archive-never-delete. Tenant price book (non-catalog rates) stays immutably
versioned. Self-serve additions (DD9) and P0 bulk import (DD10) close the loop; provenance
labelling (platform-verified vs tenant-provided specs) does the accuracy work instead of
gatekeeping.

## 10. Component selection at proposal/design time (validated)

Owner-supplied screenshots of v1's studio Components step (accordion Panel → Capacity →
Inverter; three entry paths) match the binding studio census (search + filters wattage/
technology/DCR/ALMM + manual-specs and datasheet-PDF routes) and D22 (components mandatory on
every proposal: Panel · Inverter · Cable · Electrical · Structure + Battery when added; battery
modal with capacity/chemistry/cost/tax; OFFGRID/HYBRID force battery). One shared picker
pattern serves both the studio's components step and the proposal builder's components step.

Competitive validation (2026-08-03, four-agent web research on official docs/help centers):
- **Industry pattern converges** on global database + per-installer curated subset + search
  picker (Aurora ~45k-item admin-enabled DB; OpenSolar activated-favorites; ARKA favorites/
  starring + default module; Reslink implied ALMM-mapped DB).
- **Nobody has self-serve datasheet PDF extraction** — Aurora and OpenSolar route missing
  components through email-support queues; ARKA documents no path at all. DD9/DD12 are a real
  competitive edge, kept P0.
- **Reslink's picker moat** (real-time ALMM validation at selection time) is already ADOPT-NOW
  in source (competitive gap #1) and is globalized via scheme-keyed certifications.
- **Battery**: OpenSolar/Aurora model storage economics deeply (backup duration,
  self-consumption, ToU arbitrage; ARKA ties batteries to ToU tariffs). V2 keeps the source's
  transactional battery flow as P0; **battery economics modeling goes to the enhancements
  register as a REC**.
- ARKA has no per-SKU installer cost book (pricing re-entered per design); OpenSolar's CSV
  covers pricing only. HelioGrid's versioned price book + overrides + P0 catalog import leads
  the field here.

## 11. New-scope modules (`BRIEF`)

- **M03 Marketing:** campaigns and lead capture across Email, WhatsApp, Facebook, Instagram,
  SMS, feeding the sales pipeline; per-channel sends metered (§8). The v1 voice-agent
  follow-up capability remains `SRC` and lives in M07; marketing-side AI beyond source/brief
  is `REC`-only. v1's D32 (no WhatsApp sending) and D13 (no website/inbound channels) are
  superseded by the brief — recorded as such in the conformance mapping.
- **M09 Field Workforce:** TrackoBit-informed but EPC-filtered. Brief-mandated capabilities:
  live location, attendance, visit tracking, route timeline, site check-in/out, geofencing,
  activity timeline, daily movement, team visibility. Each capability tagged `BRIEF`; anything
  I add beyond that list is `REC`. No fleet-management surplus (fuel, vehicle maintenance,
  etc.). Pricing per DD7.
- **M10 HR-lite:** SME-weight only, supporting EPC operations (people records, roles/teams
  wiring into F2, attendance/leave surfaces shared with M09, onboarding of employees =
  invite-by-phone flow). No enterprise HR complexity unless justified in writing.

## 12. Roles (F2 seed)

The 12 personas from the brief map onto v1's six presets plus new presets; final fixed list is
authored in F2 with the full permission matrices, seeded as: Owner · Manager · Sales Executive ·
Surveyor · Designer · Engineer (sign-off) · Project Manager · Field Technician · Installer ·
HR/Admin · Finance · Operations · Marketing. (13 candidates; F2 fixes the final preset set —
e.g., whether Field Technician and Installer merge — recorded with rationale, honoring source
R16 "Installer role gap".) Stackable, OR-across-roles, widest-visibility-wins semantics carried
from D20/D28/D29.

## 13. Completeness verification (the gate before "done")

After drafting, a verification pass checks the traceability register against the corpus. Every one of the
following must appear either as a live requirement (in a module/foundation PRD) or in a register
(as superseded / conflicted / excluded, with stated reason):

1. Every D-decision D1–D39 (through the overlay)
2. Every ruling R1–R20 + §3 design-system rulings + §4 owner directives + user-decisions log
3. Every journey stage (0–8): screens lists, happy paths, **every "what goes wrong" item**,
   "deliberately not in v1" items, recommendations
4. Every customer-journey step C1–C13
5. Every studio-census entry (the census never shrinks)
6. Every business rule in docs 00–16 (incl. money path, entitlement matrix, dunning ladder,
   soft-block law, security/tenancy product rules, offline scope boundary R14)
7. Every UX gap in `13-ux-gap-register.md` (each maps to a V2 UX decision)
8. Every competitive-gap verdict in doc 12 (ADOPT-NOW/DESIGN-FOR/SKIP-DELIBERATELY carried or
   consciously re-ruled under DD2)

Anything unaccounted for is a defect; the pass repeats until the ledger closes. Multi-agent
workflows are used for the deep-read, drafting, and verification (scale: ~85k source words →
est. 100k+ PRD words across ~28 files).

## 14. What this project does NOT do

No implementation tasks, engineering tickets, APIs, database design, or code discussion.
No timelines or build phases (DD4). No modification of `docs/` or `design/`. No git operations
(DD14). No invented AI features beyond source/brief (extra ideas go to the enhancements register as REC). The studio
deep-dive is pass two (DD13). Actual price points for new markets are never invented — the
price-book *architecture* is specified; numbers are owner/market decisions.

## 15. Acceptance for this project

The PRD suite is done when: (a) all ~28 documents exist and follow §5's template; (b) the §13
ledger closes with zero unaccounted items; (c) every requirement carries origin tag + priority;
(d) the conflicts, enhancements and open-questions registers are populated (including the known
source gaps and the India-pricing re-validation question); (e) owner has reviewed and approved
the suite.
