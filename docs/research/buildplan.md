> **HISTORICAL EVIDENCE** — its conclusions are already promoted into the authority named below. Cite that, not this file. Superseded by docs/14 (tracks + dependencies) and the per-module roadmaps in docs/modules/.

I have everything needed — the requested docs in full plus the code-grounded engineering constants. Here is the report.

---

# HelioGrid POC — Architecture-Planning Brief

*Source: `docs/` (build-plan, product-spec, NEW-PRODUCT-PLANNING-PROMPT, phase-3/4/5/6/10 prompts) cross-checked against the live studio code in `src/features/solar-studio/`. `phase-3-prompt-single.md` was checked and is **redundant** — it explicitly "replaces the eight separate prompts" but was itself superseded; every feature folded back into `phase-3-prompts.md`. `product-spec.md` is **historical/superseded** by `product-journey.md`.*

The POC is a **web prototype of a solar sales SaaS** ("HelioGrid") for Indian EPC firms. Phases 1–9 were built in Claude Design as UX prototypes (~60 screens, mobile 375px + desktop 1440px each). Phase 10 (the 3D design studio) is the one part that **already exists as real working code** and is the asset to carry over. Billing (D38) and any subscription gating are deferred/excluded throughout.

---

## 1 · WHAT WAS BUILT PER PHASE

| Phase | Screens | Capability summary |
|---|---|---|
| **1 · Entry & onboarding** | 6 | Login (phone + OTP, no password, resend countdown, "call me the code", wrong-code preserves digits); Sign up (5 fields only: name/company/city/phone); "What do you install?" (Residential 1–15 kW / C&I 20 kW+ / Both, sets defaults); "You're ready" (two doors: first lead or demo 8.2 kWp Pune project — not a checklist); Invite landing (join existing company, pre-filled non-editable phone, expired-invite path); Role explainer (stackable roles, ≤3 coach marks). Sets **no reusable patterns** deliberately. |
| **2 · Pattern foundation** | 4 | The four patterns all later screens reuse. **My Day** (rep home: Overdue/Today/Agent-activity/Upcoming, agent block visually distinct as automated, per-row Call+WhatsApp, empty & all-done states); **Leads list** (card↔table, search/filter/sort, My-leads vs All toggle, empty vs filtered-empty distinct, skeleton loading); **Lead detail** (header, activity timeline mixing human+🤖 agent, 6-field inline qualification, site info, designs/proposals, tasks, files; Snooze/Reassign/Disqualify-with-reason); **Quick add lead** (4 fields, **live duplicate check on phone number**, incomplete leads allowed, lands on new lead). |
| **3 · The money path** | 10 | The **proposal builder** — highest-traffic surface; many deals never touch the studio. Proposals list (7 statuses: Draft n/11 · Ready · Shared · Opened · Accepted · Rejected · Expired); 11-step builder shell (steps visitable in any order, validate only at Generate, autosave on blur); entry with 3 routes (**Path A from a design / Path B without / duplicate**) + walk-in "who is this for?" path (auto-creates lead); Step 3 Solar System (densest screen); Step 8 Components (mandatory 5-category gate); Step 7 Payment terms (tranches = 100%); Proposal preview (6 pages, Path B honesty label); Share (Download PDF + Copy link, **no WhatsApp integration** — rep sends manually, "Mark as shared" starts tracking; no "delivered" state); Proposal versions (v1 preserved, compare only-what-changed, accepted=locked); BOM detail (Path A only, ~25 lines × 7 cols, provenance per figure). **No discount approval** (D34). |
| **4 · Customer's side** | 1 page, many states | Public **tokenised no-login link** — "one link, three lives" (proposal → progress tracker → document pack). EPC's branding not HelioGrid's. State A proposal (headline = size/monthly-saving/payback; static roof render + tap-to-open full-screen 3D; monthly generation with honest monsoon dip; cost arithmetic showing subsidy+discount; components; 5-step timeline; who-we-are); State B estimate label; Ask-a-question sheet; Accept→confirm→confirmed; **State E project progress** (DISCOM net-metering waiting line — "prevents more support calls than anything else"); State F handover pack. 7 edge states (loading/expired/invalid/superseded/already-accepted/declined/slow-3G); Hindi render. Text+price must render before images (3G). |
| **5 · Survey (both modes)** | 10 | **Remote** (desk, satellite): start/mode-choice + book visit; locate building (correct the pin); **detect & review roof** (staged progress, each detection accept/adjust/reject, confidence per detection, "measured from satellite imagery"); coverage-failure → manual outline or visit (never a dead end); gaps-remote-can't-fill + honesty label. **Physical** (surveyor, offline-first): My visits today (surveyor home, keeps nav); guided capture (inline camera never OS camera, saves local-first); shading capture (11 obstruction types, rough heights labelled estimates, tap-to-place sketch); review & submit (states missing items as *consequences*, submit allowed with gaps, revisit=versioned); sync & offline status (reassure, never block). **Provenance travels**: remote=derived, physical=measured, customer-stated=reported. **Photos are design reference, not measurement (D35)** — no LiDAR/AR/auto-measure in v1. |
| **6 · Voice agent** | 7 | Fully **tenant-configurable, nothing locked (D36)**. Set up (name/voice/languages/tone/opening line/hand-over rules/calling schedule, India rules as editable defaults: DND, 9am–9pm, AI disclosure); Business knowledge (seeded, editable sections); Test (call-yourself or typed sim); Unanswered questions (clustered, one-tap answer writes back to knowledge); Who it'll call (queue + eligibility, do-not-call, on-demand "Hand to the agent" D17); Call result + transcript (outcome/summary/recording, rep can override outcome, expands lead timeline D18); Agent performance (**correlation-not-attribution** stated on screen, usage shown but no plan cap D38). |
| **7 · Project management (light)** | 7 | Post-Won money+status+docs tracker, "replace the notebook, not sell MS Project". Mark won→project created (modifies lead); Projects board (**days-in-stage** is the only metric, money owed); Project detail; Payments (collect against the Phase-3.4 tranches verbatim, copy a request); Document checklist; Blockers (name who's waiting, never block customer link over money); Handover. Reuses **InstallationSheet** code component and Phase-4 customer link States E/F. |
| **8 · Admin & settings** | 7 | Where a company makes the product theirs; nearly every proposal value is a tenant default configured here. Settings home; Business profile & branding (feeds proposal pages 1–2); **Catalog & price book** (versioned so sent quotes keep prices, feeds studio Step 4 + BOM); Proposal defaults & templates; Message templates (WhatsApp); Team & roles (**6 stackable presets**, no custom-role builder D27, Installer preset deferred D29 → coordinator=Manager); Profile & preferences (**language is per-user D25**). Billing deferred D38; **no subscription gate anywhere**. |
| **9 · Dashboards & the rest** | 5 | Owner dashboard (*what needs you* + cash first); Rep dashboard (secondary to My Day); Pipeline funnel + win/loss reasons; Notifications centre (grouped, deep-linked); Global search. **Read-only, never create.** Honesty (D37): forecast=projection, won=signed, cancelled-after-won stops counting, agent=correlation. Charts use data colours never the brass accent. |
| **10 · Design studio** | 11 (spec only) | ⛔ **NOT redesigned (D39)** — existing code kept and refactored to the design system + production-hardened. `phase-10-prompts.md` is the **refactor inventory** (every tool/state/computed output). The real 10-step wizard: setup→roof→obstructions→components→auto-layout→manual-editor→3D→captures→SLD→BOM→done + engineer sign-off. Detailed in §2. |

---

## 2 · ENGINEERING DECISIONS (algorithmic/technical, code-grounded)

### Roof modelling & geometry
- **Roof types** (`RoofType`): `rcc_flat | metal_shed | tile | ground`; plus (where footprint allows) **pitched gable (2 faces)** and **pitched hip (4 faces)** with ridge direction. Pitch is derived from geometry (`isSloped(roof)`), not the covering field.
- Roofs are **traced polygons on satellite imagery** with CAD snapping (angle-relative, object-snap, alignment guide rays, right-angle marks). Per-roof: type, height-from-ground, parapet (per-side walls, auto-skip shared walls), pitch, azimuth ("slopes toward" low-edge picker), **edge setback (uniform + per-edge, default 0.3 m)**, exact vertex X/Y.
- **Calibration**: measure 2 points → enter real metres → `rescaleProjectGeometry` applies a scale factor to *all* geometry (`calibration.scaleFactor`), plus an expert north offset.
- **Surface-height resolution** (`ground.ts`): one authoritative `groundHeightAt`/`obstructionBaseY`; anchors are **re-resolved by position, not trusted stored ids** (self-heals stale saved data, no migration). `roofId === null` = "on ground" and is preserved.
- **Cascade/dependency guard** (`cascade.ts`): geometry edits that orphan panels/obstructions/routes offer keep-current / keep-for-review / remove-invalid.
- **Relocating the map pin > 25 m wipes the whole design** (guarded, undoable confirm).

### Roof AI detection (`lib/roof-ai/`)
- **Primary = geometric**: Google Solar **dataLayers DSM + mask rasters** → GeoTIFF decode → plane-fit → outline, pitch, azimuth, eave height, obstructions. **Confidence = plane-fit RMSE**. Files: `pipeline.ts`, `plane-fit.ts`, `geotiff-decode.ts`, `vectorize.ts`, `detect.worker.ts`, `utm.ts`.
- **Fallback = Gemini photo analysis** (`gemini-client.ts`): returns polygons + obstructions only — **cannot measure height/pitch**.
- Results enter as **ghosts** reviewed accept/reject before committing. Provenance carried: manual / AI-detected + confidence.

### Energy model (`lib/pvgis.ts`, `lib/poa.ts`, `lib/solar.ts`, `lib/shading.ts`)
- **Irradiance = PVGIS** (real measured) — annual + monthly generation, specific yield (kWh/kWp), performance ratio, plane-of-array (POA) factor, full loss breakdown (temperature, soiling, inverter, mismatch, DC wiring, **measured shading loss**), 25-year projection with degradation.
- **Fallback = built-in latitude-fit model, labelled "±10%"**. Provenance line always renders: `"Real irradiance — PVGIS ({database}, {N}-year record)"` **or** `"Built-in irradiance model (latitude fit, ±10%)"`.
- **Google Solar Building Insights is a separate *enhancement*, never a dependency** (partial India coverage → loading/unavailable/unreachable/ok states): max panels, roof area, sunshine h/yr, per-face pitch/azimuth, imagery date + quality HIGH/MED/BASE.
- **Shading** = geometric simulation cast by roofs, parapets, obstructions, structure and panels; per-panel **solar-access %** heatmap with month scrubber; the kWh/m² is the only climate-measured figure (marked "Real · PVGIS"), the geometric access % deliberately carries no such marker. Neighbour buildings are decorative and do **not** shade unless added as a "building" obstruction.

### Panel layout rules (`lib/auto-design.ts`, `lib/layout.ts`, `lib/spacing.ts`)
- Three fill modes: **place manually / auto-fill to Step-4 target capacity / use maximum roof capacity**.
- Panels snap to a grid, **auto-avoid obstructions + setbacks + keep-outs + walkways**; drag fills a rectangular table; live fit/conflict preview.
- **Parametric tables**: rows×columns, group loose panels (2+, same roof), grow row/column, rotate 90°, tilt in 5° steps, enable/disable (stops production without deleting).
- **Inter-row shading**: recommended winter shadow-free **row pitch** in metres, resulting **GCR**, one-tap "apply shadow-free spacing"; azimuth ±5° with due-south / roof-slope presets.
- **Obstructions**: 11 types with default L×W×H; setback ring 0–3 m (0.1 m steps); **bridging chain** (panels may bridge above → must remain open to sky → clearance-above 0–1 m, flagged for engineer); **convert-to-platform** turns an obstruction into a mountable roof surface at (roof height + object height).

### Electrical sizing rules (`lib/electrical/`, `lib/electrical-sizing.ts`, `lib/stringing.ts`, `lib/sld.ts`)
All standard constants live in **`data/rules/india.ts`** (the seed of a configurable per-project rule engine):

- **String-length window** (`electrical/window.ts`): `maxPanels = floor(min(inverter.maxDcV, mppt.maxV) / Voc_cold)`; `minPanels = ceil(mppt.minV / Vmp_hot)`. **Cold Voc computed at ambient minimum** (dawn, un-warmed); **hot Vmp at cell max using the Pmax coefficient** (not Voc's). An empty window (min > max) is surfaced as an explicit component-pairing fault, not silently used.
- **Design temperatures by latitude band** (5 bands, e.g. deep-south 15–40 °C, Deccan 8–42, north-plains 0–47, Himalayan −10–38), `cellRiseC: 30`. Provenance travels with the window.
- **DC protection**: fuse = next-standard-rung ≥ **1.56 × Isc** (=1.25×1.25, IEC 62548); `fuseLadder [10,12,15,20,25,30,32,40,50,63]`; `isolatorLadder [16,25,32,40,63,80,100,125]`; DC cable = smallest mm² whose ampacity ≥ fuse.
- **AC sizing** (one unified path for BOM + SLD): full-load A exact (`3φ: kW·1000/(1.732·415)`, `1φ: /230`); breaker = next rung ≥ **1.25 × FLA**; `breakerLadder` extends to **630 A MCCB** (so large C&I is never rated below load); AC cable sized against the **breaker** (coordination rule), ampacity at 40 °C derated-in-conduit column.
- **Voltage drop**: checked separately with copper resistance at ~70 °C operating temp; limit **3%** on inverter→LT-panel run. Explicitly flagged: ampacity-only sizing is a *starting point*, voltage drop commonly governs long runs, grouping/ambient not modelled.
- **Combiner boxes** (C&I central topology): **max 12 strings/box**, output factor **1.25 × ΣIsc**.
- **DC/AC ratio health**: healthy **0.90–1.35**, >1.35 clipping risk, <0.90 oversized.
- **DC collection topology**: string inverters *or* central + combiners; **MLPE**: none *or* DC optimisers.
- **Hard validity gate**: an invalid string design **blocks "Next"** in the layout step and blocks issuing. Validation codes include voc_high, vmp_low, isc_high, mppt_overflow, mppt_capacity, string_window_empty, unstrung_panels, dc_voltage_drop, etc. — each locatable (centres the offending panels).
- **SLD** (`lib/sld.ts`): strings→(combiners)→DCDB (fuse/SPD/isolator)→inverter→ACDB (MCCB/SPD/isolator)→meters→grid→earthing pits; string/MPPT schedule; editable ratings; **max-system-voltage compliance box** (longest string cold Voc vs inverter max DC V) — the figure the inspector checks. Standards selectable: **IS/IEC 62548·CEA, IEC 60364-7-712, NEC 690**. Exports SVG/PNG/DXF/PDF.

### Structure & foundations (`lib/structure.ts`, `lib/foundation.ts`, `lib/drc.ts`)
- **Rooftop structure presets**: FLUSH · STANDARD 10° · WALK-UNDER 2.2 m. **Racking**: FLUSH · FIXED TILT · DUAL TILT. Editable: leg spacing 0.5–4 m, clearance 0–3 m, purlins/row 1–6, rafter density 1–3×, end overhang 0–1 m, bracing, structure profile (steel section with kg/m). Member model counts legs/rafters/purlins/braces + total steel kg.
- **Foundations** (`FoundationKind`): `anchor | ballast | pile | concrete`; UI names PCC pedestal / chemical anchor / ballast block / driven pile. **Shape** square|circular (circular ≈ ⅕ less concrete). **Height contract (D15)**: `frontLegM` = roof surface → module underside; foundation occupies the bottom so switching kind never moves the module plane (would otherwise change shading/energy/captures). Ground foundations: **driven pile / ballasted** (soil survey required).
- **THE HARD RULE, repeated everywhere**: structure/foundation sizing is **material estimation + a visual model ONLY — never a wind/uplift/roof-capacity check. Sizes are ASSUMED, never computed. Adequacy is a human engineer sign-off**, recorded with who and when. A design not engineer-approved is never shown to the customer.
- **Wind zone** (IS 875-3): representative per-state basic wind speed **flag, display/verification-nudge only** — never a wind-load calculation.

### BOM & pricing (`lib/bom/`, `lib/bom/emitters/`, `lib/finance.ts`)
- **6 categories** with dedicated emitters: **Modules · Inverter · Electrical BOS · Mechanical BOS · Safety · Civil & Misc**. ~286 controls in the original 11-column table.
- **Every line carries a provenance tier**: `MEASURED · DERIVED · ESTIMATED · ASSUMED` (counted from design / computed from geometry / labelled fallback / needs surveyor-engineer confirmation). Each line has a plain-language **derivation explanation** ("defend the number").
- Fields per line: include-toggle (excluded lines kept + dimmed, never deleted), spec/brand, qty, unit (nos/set/pairs/kit/lot/plate/panel-set/day/m/m²/kg/kW), **waste %** 0–100, order-qty (rounded up for whole units), rate, GST% 0–40, computed amount/GST/total, per-field reset to design value.
- **Reconciliation** (`lib/cascade.ts`, stale/orphan logic): stale notice ("yours X · design now Y" + take-Y), orphan notice (keep-as-custom / discard), below-cost warning, preliminary-quote notice (count of assumed/estimated lines), re-sync-all.
- **Cable is sized from routed geometry when it exists**, else from two survey inputs (avg DC run array→inverter, avg AC run inverter→LT-panel) with a labelled allowance. `gridConnection` optional by design — absent ⇒ labelled AC allowance rather than invented length.
- **The BOM shares the exact money path with the Phase-3 proposal** — "the numbers cannot disagree."
- **PM Surya Ghar subsidy** (`finance.ts` via rules): **₹30,000/kW for first 2 kW + ₹18,000/kW next, capped ₹78,000 at ≥3 kW, requires DCR (domestic content) modules**.
- **Financing** (representative/assumed): loan APR 9.5%, PPA tariff discount 20% — flagged as placeholder for real lender/PPA wiring.
- **DISCOM compliance checklist**: net metering vs sanctioned load, SLD sign-off, ALMM/BIS module listing, earthing/LA certificates, PM Surya Ghar + DCR eligibility.

### Cross-cutting engineering systems
- **Design Health score /100** (`lib/health.ts`): weighted **energy 40 / electrical 40 / roof-utilisation 20** (normalised over applicable categories); bands **Good ≥85 · Fair ≥65 · Poor**; fixed capped per-code deductions (provable monotonicity — fixing one issue can only remove its deduction). Provisional state while shading recalculates.
- **Advisory insights / Copilot** (`lib/insights/`): decision log ("why this layout?") + accept/ignore suggestions; penalties feed health.
- **Persistence** (POC only, to be replaced): project JSON in **localStorage schema v2**, images in **IndexedDB** blob store (`coverImageBlobId`); layout fingerprints (`fingerprints.ts`) detect stale captures.
- **`types.ts` `Project` shape** (best DB-schema seed): `info` (ProjectInfo), `location`, `roofs[]`, `obstructions[]`, `components`, `panels[]`, `segments[]` (parametric tables), `keepouts[]`, `walkways[]`, `rails[]`, `arresters[]`, `inverterPlacements[]`, `gridConnection?`, `cableRoutes?`, `strings[]`, `captures[]` (shadow images), `bom` (BomState), `pricing`, `derived`, `calibration`, `designLog`. Deeply nested and evolving → the planning prompt flags **JSONB** for the design payload.

---

## 3 · SCOPE STATEMENTS — explicitly deferred / excluded

**From the numbered decisions (D-series) and phase rules:**
- **Billing & subscriptions — DEFERRED (D38).** No billing screen; **no feature is gated by any subscription, plan limit, trial, seat cap, or PRO lock anywhere**. The POC's leftover **freemium 10 kW cap (`planLimitKw: 10` in `data/rules/india.ts`)** and "PRO" locks **must NOT survive** the rebuild.
- **Discount approval — REMOVED (D34).** Anyone who can build a proposal can discount and share it; no request/queue/pending status.
- **Custom-role builder — excluded v1 (D27).** Six stackable presets only.
- **Dedicated Installer role — deferred (D29).** Coordinator (=Manager preset) runs the install checklist in v1.
- **Deriving numbers from photos — out of v1 (D35).** No LiDAR, no automatic roof measurement from photos, no AR height estimation. Survey **photos are design *reference*, not measurement**; a human enters/estimates every dimension and height.
- **WhatsApp send integration — NOT in v1.** The app never sends; it produces copy-paste messages and the rep sends from their own phone. Consequently **no "delivered" state** (only link-opened is knowable).
- **Studio UX redesign — cancelled (D39).** Phase 10 is refactor-not-redesign.

**Structural / engineering exclusions (product requirement, not a gap):**
- The app **never computes structural adequacy** — no wind load, uplift, or roof-capacity calculation. Foundation/structure sizes are **assumed material estimates + visual models**; wind zone is a **display-only nudge**. Adequacy is **always a recorded human engineer sign-off**, and unapproved designs are never shown to customers.
- Electrical sizing is **ampacity-based only** — **voltage drop is a warn/reference, not a full check**; grouping, ambient ≠ 40 °C, buried-vs-tray, and mechanical loads are not modelled. Every printed size is labelled a "starting point for the engineer."

**POC starting-point limitations (to be built in the rebuild, per NEW-PRODUCT prompt §C):**
- **No backend, no database, no auth, no multi-tenancy** — `types.ts` has zero tenant/org/user concept. Persistence is browser-local (localStorage + IndexedDB), single-user, single-device, non-durable.
- Only server code = 5 thin proxies under `src/app/api/` (PVGIS, Gemini, Google Solar building-insights/data-layers/geotiff).
- **Desktop-first** — many interactions are hover/right-click/keyboard/tiny-drag-handles with no touch equivalents (the 2D canvas lacks pinch-zoom/two-finger-pan; 3D already has touch orbit).

---

## 4 · NEW-PRODUCT-PLANNING-PROMPT.md — complete summary

This is the **prior planning intent**: a hand-off prompt (for "Fable 5" in a new session) requesting **planning only — no application code** — to build a **production, multi-tenant SaaS from scratch in a brand-new repo**. The attached POC is spec + carry-over domain logic, *not* the codebase to continue in.

**The product** — **"HelioGrid,"** a multi-tenant SaaS Indian solar EPC companies run their whole business on. Covers the end-to-end journey: company onboarding → user onboarding & roles → lead capture → qualify & assign → **site survey (remote from imagery or physical on-site)** → **3D design studio** → proposal builder → customer-facing link → follow-up (incl. **AI voice agent**) → close → project management (stages/payments/documents) → dashboards → tenant settings. Both **residential rooftop and C&I, both high-volume**. **India is the domain, not a locale**: GST, DISCOM utilities, sanctioned load, net metering, PM Surya Ghar subsidy, ₹ lakh/crore formatting, TRAI/DND calling rules, and an **English/Hindi/Marathi** interface.

**What to carry over (the moat)** — `src/features/solar-studio/` is the validated asset to **reuse, not rewrite**: `types.ts` (canonical `Project` model → DB-schema seed), `lib/solar.ts`/`pvgis.ts`/`poa.ts` (energy), `lib/electrical/*`/`electrical-sizing.ts`/`stringing.ts`/`sld.ts` (string windows, cold-Voc limits, conductor sizing, combiners, hard validity gate), `lib/bom/*` (6-category BOM with provenance tiers), `lib/roof-ai/*` (Google dataLayers + Gemini fallback + confidence + review), `lib/structure.ts`/`foundation.ts`/`drc.ts` (parametric structure/foundations/DRC, **material-only**), `lib/health.ts`/`finance.ts`/`insights/*`/`roof-topology.ts`, `data/rules/india.ts`, and `three/*` (scene, shadow sim, instanced panels/structure, heatmap).

**Constraints (decided — plan within them):**
1. **New repo from scratch**, port domain logic deliberately (improve as you go).
2. **Multi-tenant from day one** — every EPC company is a tenant, all data tenant-scoped; retrofitting later is unacceptable.
3. **Web AND a real mobile app built together** — not a responsive site; field surveyors need genuine offline capture, camera, local-first sync; reps/owners get web. Shared TypeScript domain layer consumed by both.
4. **Domain layer stays TypeScript** — the compute is the moat; shared by web, mobile, server without rewrite; pick a backend that respects that.
5. **Deploy on Fly.io**, prefer an India region (latency + data residency); plan DB, object storage, background workers, secrets around Fly.
6. **Built entirely by an AI agent** (Fable 5 + Claude Code) → optimise architecture for that: schema-first, strongly-typed explicit contracts, tests-as-executable-spec with machine-verifiable "done," repeated predictable patterns, small modules with narrow interfaces, a conventions file read every session, verifiable by typecheck+tests.
7. **Billing/subscription deferred (D38)** — model on paper, but no feature gated, no capacity caps.
8. **Offline-first where it matters** — physical survey works with zero network; background sync; never a blocking spinner.
9. **Multilingual EN/HI/MR, per-user (not per-tenant)**; Devanagari affects typography/layout, not just strings.
10. **Honesty rules are product requirements in the data model**: every user-visible number has a provenance tier; structural safety is engineer-signed never computed; money never renders final while stale; the voice agent's contribution is correlation not attribution.
11. **The design system (`docs/DESIGN-SYSTEM.md`, "Instrument": warm graphite + brass) is binding**; the ported studio must be refactored to match it.

**Requested deliverables (planning docs):** (1) **Business model** — who pays, pricing shape (pick & defend one of per-seat/per-project/per-kWp/usage), rough tiers, unit economics & cost drivers (voice-agent minutes, imagery API calls, storage, compute); (2) **System architecture** — service/module boundaries, how web/mobile/server share the domain layer, offline/sync + conflict resolution, background/async work (shading sim, roof detection, voice calls, doc generation), third-party integrations (Google Solar, PVGIS, Gemini, telephony, WhatsApp, payments-later), file/image storage, auth + tenancy isolation + RBAC for **six stackable roles**, observability, India data residency; (3) **Tech stack** with justification (incl. what the 3D/geometry constrains); (4) **Repo & folder structure** (monorepo vs multi, where the shared TS domain package lives, the agent-conventions file); (5) **Full multi-tenant DB schema** covering the whole product (tenants, users, roles, leads, activities, surveys+photos, **designs derived from `types.ts`**, proposals+versions, customer link, projects, payment tranches, documents, blockers, voice-agent config/calls/knowledge, **versioned catalog & price book so sent quotes keep prices**, tenant settings) — noting **where JSONB fits vs relational** (the nested evolving `Project`); (6) **Module-by-module roadmap starting with auth & tenancy**, each giving scope/outcome, backend+web+mobile planned together, data model + API contract, dependencies, tests + definition-of-done, effort estimate, and — emphasised most — (7) **the FORWARD-COMPATIBILITY RULE**: when building module X, already account for what Y and Z will need from it (e.g. auth must know roles are stackable, surveyor mobile authenticates offline, the customer link is a tokenised no-login URL, the voice agent acts on behalf of a tenant) — "I don't want to discover a missing foreign key three modules later." Work proceeds module-by-module after planning, each a self-contained unit ending green on typecheck+tests.

---

## 5 · Ground-mount, system-size range (kW→MW), C&I vs residential

### Ground-mount support
- **First-class in the data model**: `ProjectInfo.groundMount: boolean`; `RoofType` includes **`ground`** ("Ground array"); Step-1 exposes a **"Ground-mount / open-access project"** option (marked "coming soon" where not yet functional — **not** a PRO/upgrade gate).
- **Dedicated ground rules** (`data/rules/india.ts`, all **ASSUMED**, engineer/site validation required): `groundSetbackM: 1.5` (perimeter access lane + fence standoff, larger than the 0.3 m roof setback), `groundTiltDeg: 20` (near latitude-optimal since open ground isn't pitch-constrained), plus fencing/gates/earthing-ring flags.
- **Ground foundations**: driven pile / ballasted (with "soil survey required" note); the general `FoundationKind` set (`anchor|ballast|pile|concrete`) and shapes (square|circular) apply. `lib/ground.ts` distinguishes on-ground (`roofId === null`) from on-roof placement.
- Structure/foundation for ground arrays carries the **same material-only, engineer-verified disclaimer**.

### System-size range (kW → MW)
- **Proposal builder Step 3 accepts capacity 0.5–7000 kW** — i.e. **0.5 kW up to 7 MW** — spanning residential rooftop through utility-scale/open-access.
- **Battery** 1–100 kWh; **tariff** ₹1–50/kWh (validation bounds).
- **The engineering scales with size** rather than being capped: AC breaker ladder extends to **630 A MCCB** so large three-phase systems are never rated below load; **combiner boxes (max 12 strings/box, central topology)** appear for C&I/central-inverter designs; connection type single/three-phase per `ProjectInfo.connectionType`.
- The only capacity limit in the code is the **freemium `planLimitKw: 10`**, which the rebuild **must delete (D38)**.

### C&I vs Residential differences
| Dimension | Residential | C&I |
|---|---|---|
| Size (spec) | 3–15 kW rooftop (onboarding card says 1–15 kW) | 50 kW–5 MW (onboarding: "20 kW and above"), factory/warehouse |
| Decision | Homeowner, days, price-driven | Several decision-makers (owner, facility mgr, procurement, finance), weeks–months, engineering scrutiny |
| Data model | `SiteType: 'residential'` | `SiteType: 'commercial'`; C&I customers can have **multiple sites/contacts** |
| Subsidy | **PM Surya Ghar** applies (₹30k/kW first 2 kW + ₹18k/kW, cap ₹78k at ≥3 kW, **DCR required**) | Not eligible; subsidy line shows ₹0 with the reason |
| Electrical topology | String inverters, single/three-phase, smaller breakers/cables | Central + **combiner boxes**, three-phase, MCCB frames up to 630 A, higher DC voltages |
| Proposal type | Typically CAPEX | **CAPEX or OPEX/PPA** (PPA per-unit billing; representative 20% tariff discount) — no tier gate |
| Survey | Leans **remote-first** (satellite enough to quote) | Leans **physical visit** (complex roofs, engineering scrutiny, higher stakes) |
| Magnitude in UI | e.g. ₹4.5 lakh house | e.g. ₹92 lakh–₹1.28 crore factory — lists/tables must stay readable across both magnitudes simultaneously |
| GST | Mixed per-line (5% modules, 18% civil) — same rule both segments | Same, higher absolute values |

Both segments are treated as **high-volume first-class** throughout — the same lead pipeline, survey flow, studio, proposal builder, and project management serve both; the differences are in defaults (size, subsidy eligibility, survey mode recommendation, proposal type, electrical topology), not in separate product paths.