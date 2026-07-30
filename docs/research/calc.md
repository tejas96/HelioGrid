> **NORMATIVE** — still binding: a live document delegates authority to this file. Do not archive it without promoting its content first. docs/05 delegates its calculation/data audit; docs/04 imports its spec shapes verbatim. Keep until the Track D studio port completes — the audited POC code is in another repository.

I now have comprehensive coverage of the calculation/data half. Here is the audit.

---

# Solar Studio — Calculation & Data Layer Audit

Scope: `/Volumes/works-space/Solar-App-POC/src/features/solar-studio/{lib,data,store}` plus the server proxies in `/Volumes/works-space/Solar-App-POC/src/app/api`. This is a Next.js app; the domain model is one canonical `Project` object (`src/features/solar-studio/types.ts`, ~38 KB) that every pure function reads. Nearly all math is **pure TypeScript `f(Project)`**; browser coupling is isolated to a thin edge (fetch clients, Workers, `localStorage`/IndexedDB, React store, Google Maps loader).

---

## 1. MODULE INVENTORY

### 1a. Electrical sizing & stringing (all pure TS, portable)

**`lib/electrical-sizing.ts`** — DC + AC protective-device and conductor sizing. Ladders/factors come from `resolveRules().dcSizing`/`.acSizing` (not inline literals).
- `dcFuseA(panel)`: next standard rating ≥ `fuseFactor(1.56)×Isc` (IEC 62548, 1.25×1.25). `dcIsolatorA`, `dcCableSizeMm2` walk the fuse rating up the ampacity ladder.
- `acFullLoadA(acKw, phases)`: exact `P/(√3·415)` (3φ) or `P/230` (1φ). `acBreakerA`: next MCB/MCCB rung ≥ `1.25×FLA`.
- `sizeAcCable(acKw, phases, runM)` → `AcCableSizing{mm2, ampacityMm2, voltDropMm2, governedBy:'ampacity'|'voltage-drop', voltDropPct, singleRunAdequate}`. Sizes against **both** ampacity (carry the breaker) and voltage drop (≤3% via `cableResistanceOhmPerKm` at 70 °C), takes the thicker, reports which governed and whether any single cable can carry the breaker. `acVoltDropPct` uses √3·I·L·R (3φ) / 2·I·L·R (1φ).
- Explicit "NOT a substitute for engineering" caveats (grouping/ambient/harmonics unmodelled).

**`lib/electrical/temps.ts`** — site design temperatures, the basis of every string window.
- `resolveDesignTemps(project)` → `DesignTemps{minAmbientC, maxAmbientC, maxCellC, minCellC, source:'measured'|'assumed', note}`. Picks a latitude band from `rules.temps.latBands`; `maxCellC = maxAmbient + cellRiseC(30)`; cold check uses ambient (dawn Voc). **Always resolves to `'assumed'` today** — no weather source supplies ambient extremes (PVGIS MRcalc is irradiance-only); the measured branch is wired for future PVGIS TMY min/max.
- `vocAt(spec, T)`, `vmpAt(spec, T)`: linear temp-coeff models. `pmaxCoeffPct(spec)`: uses datasheet `tempCoeffPmaxPct` or `rules.temps.fallbackPmaxCoeffPct(-0.35)`, flags `estimated`. Deliberately distinct from Voc coeff.

**`lib/electrical/window.ts`** — `stringSizing(panel, inverter, temps)` → `StringSizing{minPanels, maxPanels, temps, pmaxEstimated, impossible?}`. `maxPanels = min(⌊maxDcV/vocCold⌋, ⌊mpptMaxV/vocCold⌋)`; `minPanels = ⌈mpptMinV/vmpHot⌉`. Emits `impossible` string when window is empty (min>max) — the key fix over the legacy engine that returned inverted windows. Exports `STRING_COLORS`.

**`lib/electrical/grouping.ts`** — legal series-string partitioning (audit finding 7/11 fix).
- `computePlaneIds(roofs)`: union-find over roofs that are **co-planar AND edge-adjacent** → maps roofId→physical plane id (handles skeleton wavefront emitting multiple co-planar faces per wall; keeps detached identical buildings separate). Uses `planeDatum` (surface height extrapolated to plan origin), `coplanar` (pitch/az/datum tolerances), `roofsAdjacent` (collinear edge overlap).
- `groupPanels(project)`: partitions enabled panels by `(planeId, bucketedAzimuth±5°, bucketedTilt±3°, shadeTier)`. MLPE/optimizer collapses to one mega-group spanning all faces. `shadeTierOf`: >0.95 clear / >0.85 light / else heavy (same thresholds as 3D tint).
- `orderGroup`/`serpentine`: row-major serpentine **in the roof grid frame** (`roofGridAngle`), face-by-face for multi-roof groups; 0.5 m row tolerance.

**`lib/electrical/autostring.ts`** — `autoStringPlan(project, panel, inverter, invCount, temps)` → `{strings, issues, unstrungPanelIds}`. The core planner. Refuses to emit illegal strings (leaves panels **unstrung** rather than inventing over-voltage strings). Steps: check `stringSizing.impossible`; `parallelPerMppt` (Isc vs `mppt.maxCurrentA`, no double-1.25); `mergeUndersizedGroups` (fold sub-minimum shade-tier tails into co-planar hosts with warning); `splitGroup` (balanced legal chunks + honest tail); slot-fit into `mppt.count × invCount` inputs (parallel strings must be same group + equal length). Emits typed `ValidationIssue`s: `string_window_empty`, `isc_high`, `group_too_small`, `mppt_capacity`, `shade_mismatch`, `temp_coeff_estimated`.

**`lib/electrical/combiner.ts`** — `combinerPlan(strings, panel)` for central/C&I topology → balanced fused SCBs, `maxStringsPerBox(12)`, per-string gPV fuse, `outputCurrentA = ΣIsc × outputFactor(1.25)`. Reconciliation gate (Σ inputs === totalStrings).

**`lib/electrical/gate.ts`** — `electricalGate(project)` → `{message, autoStringable}|null`. The single hard block on Step 6 Next / proposal issue. Runs `validateSystem`, filters error-level, leads with `unstrung_panels`.

**`lib/stringing.ts`** — thin public layer. `validateSystem(strings, panel, inverter, invCount, totalPanels, temps, enabledPanelIds?)` → `ValidationIssue[]` (live checks: empty window, per-string voc_high/vmp_low/imp_high, DC/AC ratio 0.90–1.35 band, `unstrung_panels`, `mppt_overflow`). `autoString` (legacy shim → autoStringPlan). `estimateDcCableM` (serpentine + home-run fallback estimator, reads HIGH).

**`lib/sld.ts`** — Single-line-diagram params. `deriveSldDefaults(project)` → `SldParams|null` (fully derived: cold-Voc max system voltage from longest real string, AC breaker from shared `acBreakerA`, DC fuse/isolator/cable from module Isc, `voltageWithinLimit`, `standard:'IS/IEC 62548 · CEA (India)'`). `effectiveSld` merges `project.derived.sldOverrides` on top (same live-derive+override pattern as BOM). `diffSldOverrides` reduces stored params to only user-edited fields (migration + save path). `acConductorLabels`/`dcConductorLabels` for 3-line diagrams.

**`lib/cascade.ts`** — referential-integrity deletion. `cascadeDeleteRoof`/`cascadeDeletePanels` return atomic `Partial<Project>` patches that prune panels/segments/obstructions/walkways/rails/arresters/inverterPlacements/keepouts + dead string panel-ids + dead home-run routes, and reindex segment grids.

### 1b. BOM engine (pure TS, portable)

**`lib/bom.ts`** (public module) — `deriveBom(project)` orchestrates 6 category emitters (`bom/emitters/{modules,inverter,electrical,mechanical,safety,civil}.ts`) over one shared `BomContext`. `mergedBom`/`mergedBomResult` layer per-field overrides + custom lines + orphan reporting. `bomConfidence(lines)` → worst confidence tier + `needsVerification` + `preliminary`. `bomSubtotal`/`bomTotal` (line-wise money). `bomToCsv` (procurement-grade export with order qty, per-line GST, apportioned discount, disclaimer/PRELIMINARY notes).

**`lib/bom/context.ts`** — `buildContext(project)` → `BomContext|null` (null when no panel/inverter/panels). Computes cable lengths with **3-source provenance** (`routed` geometry > `input` surveyed > `fallback` estimator), combiner plan, and the **four disjoint mechanical panel buckets** (`nStructured`/`nMetal`/`nGround`/`nSloped`/`nFlatRcc`, summing to `n`) split further by covering (rcc_flat vs tile). Prices resolve through `resolveCatalog().pricebook` (not direct import) so a swapped catalog re-keys the quote.

**`lib/bom/registry.ts`** — `LineKey` union (stable semantic identity, e.g. `mech.steel:c_channel`), `CATEGORY_ORDER`, `WASTE_PCT_BY_LINE` (cable 8%, steel 4%, rail 5%…), `isDiscreteUnit`/`UNIT_OPTIONS`.

**`lib/bom/money.ts`** — `lineMoney`/`bomMoney`. Margin **below** GST (taxable = base×(1+margin), gst on taxable). Discount applied **before GST** and apportioned pro-rata across per-line GST buckets (CGST s.15(3)(a) reasoning documented). `belowCost` flag. `orderQtyOf` (qty×waste, ceil for discrete units).

**`lib/bom/merge.ts`** — per-field override model (Phase 22c). `mergeBom` applies `BomState.overrides` keyed on `LineKey`, computes `overriddenFields`/`staleFields`/`staleDetail` (staleness = current derived ≠ `autoAtEdit`), surfaces `orphans`. `migrateLegacyOverrides` (one-time whole-line→per-field). `setFieldOverride`/`clearFieldOverride`/`clearOverrides`.

**`lib/bom/edit.ts`** — action creators returning `BomPatch{bom, bomOverrides:[]}`; lazy migration on first edit. **`lib/bom/line.ts`** — `line()` constructor (defaults confidence='derived', resolves waste/GST from registry). **`lib/bom/view.ts`** — pure Step-9 UI decisions (`commitNumber`, `rowState`, `staleRows`, `sectionState`, `inputIsLive`).

### 1c. Energy & finance (pure TS, portable)

**`lib/solar.ts`** — sun position re-exported from `lib/sun.ts`. `computeEnergyReport(project)` → `EnergyReport`. Mean-field model: `capacityKwp × GHI × PR × POA`, PR = multiplicative `Π(1−lᵢ)` equipment losses (`equipmentLosses`, inverter loss from datasheet efficiency), shading applied to **beam component only** inside POA composition (`kd + (1−kd)·beamRatio·access`), so diffuse floor survives. Uses PVGIS `SiteWeather` when `activeWeather()` confirms it matches the pin (within 1e-4°), else `mockIrradiance(lat)` estimate. Reports `irradianceSource:'PVGIS'|'estimate'`, `avgSolarAccessPct` (unified diffuse-floored metric = heatmap definition), 25-yr degradation (0.75%/yr). `panelEnergyShares` splits the ONE report number per panel (Σ shares === annualKwh). `suggestKwpFromBill`.

**`lib/poa.ts`** — plane-of-array transposition. `poaBeamRatio(lat,lng,tilt,az)`: numeric integration over 5 months × 10 solar hours via `sunPosition`, beam-only, cached. `poaFactor` = `DIFFUSE_SHARE(0.35) + 0.65·beamRatio`. Deliberately conservative first-order model, labeled as such.

**`lib/finance.ts`** — `subsidyInr(kwp, residential, dcrEligible)` (PM Surya Ghar slabs from rules). `computeFinancials(project, report)` → `FinancialSummary`: system cost from `bomTotal(mergedBom)`, subsidy, payback with 3%/yr tariff escalation + degradation, 25-yr savings, simple 60-month 9.5% EMI.

**`lib/financing.ts`** — `computeFinancing(fin, annualKwh, gridTariff)` → 4 options (cash/loan/lease/PPA) all derived from the one quote total; terms from `rules.financing` (ASSUMED). `emiInr` amortization helper.

### 1d. Analysis / insight / review (pure TS)

- **`lib/drc.ts`** — `layoutIssues` (overlap, setback breach, shaded <0.7, keepout, §26c bridging clearance) + `structureIssues` (foundation dead load, foundation clash in keepout/walkway/obstruction, foundation-too-tall). Typed `ValidationIssue[]`.
- **`lib/health.ts`** — Design Health Score v1. `computeHealth` = 100 − fixed code-level deductions (from `rules.health`), 3 weighted categories (energy/electrical/utilization), deduped by code (monotonicity). `VALIDATION_CATEGORY`/`EXCLUDED_VALIDATION` maps every emitted code. `healthKey` composite (designFp + solarAccessFp + insightState + analyzer ids). `explainDelta`, `nextHealthSnapshot`, memoized selector.
- **`lib/insights/`** — Copilot analyzer substrate. `types.ts` (Insight/InsightAnalyzer), `registry.ts` (register/list/`computeInsights`/`memoizedInsights` keyed on designFp+insightState+registry), `analyzers.ts` (roof-utilization, dc-ac-ratio, orientation, row-spacing), `analyzers-access.ts`. Each Insight carries `impact`/`confidence`/`evidence[]` citing the datum.
- **`lib/review.ts`** — `preProposalReview(project)` derives one checklist from 4 existing signals (electricalGate, insights, bomConfidence, capture staleness) — read-only, never a second gate.
- **`lib/comparison.ts`** — `compareShortlist`/`compareCandidates`: runs full fill→autoString→energy→finance pipeline per candidate component set. `recommendInverterFor`/`nearestInverterFit` (DC/AC 0.90–1.35 band, closest 1.15). `shortlistPanels` (ALMM ranked by ₹/W). Emits `DesignDecision[]` with stated rules. Memoized on designFp.
- **`lib/auto-design.ts`** — `autoDesign(project, objective)`: `rankRoofs` by expected yield/panel (`access × poa`, real raycast on 12-panel probe), budgeted fill in rank order, full `DesignDecision[]` log (objective, per-roof rank, bridging, spacing, capacity outcome, sanctioned-load soft cap). Uses `computeSolarAccess` (pure) so portable.

### 1e. Provenance / support (pure TS)

- **`lib/calibration.ts`** — `applyKnownDistance`/`rescaleProjectGeometry`: rescale all image-traced coords by `k=known/measured` about origin; physical dims (heights/setbacks) untouched.
- **`lib/capabilities.ts`** — obstruction capability resolver (overrides→preset→legacy booleans), `castsAnalyticalShadow`, `isBridgedAt`, `requiredBridgeClearanceM`.
- **`lib/fingerprints.ts`** — 5 nested derived-state fingerprints (`siteFp⊂geometryFp⊂layoutFp⊂electricalFp⊂designFp`) + `shadingFp` (engine-versioned). Freshness checks `isShadingFresh`/`isCaptureFresh`/`capturesFresh`. Catalog/structure/shading versions join fingerprints so external data changes self-stale.
- **`lib/proposal-narrative.ts`** — `proposalNarrative` template-filled from real project data; every beat carries `facts[]` for a traceability test.
- **`lib/sim-time.ts`** — `simTimeDate` (single local-mean-solar-time conversion point).
- **`lib/units.ts`** — pure formatters (`fmtLen`/`fmtArea`/`lenToM`, m↔ft) + `useUnits` React hook (only browser-coupled export).
- **`lib/hardware.ts`** — `nodeHardware(kind)`: nominal 3D part geometry (clamps/bolts/standoffs); representation only, no quantities read back.
- **`lib/installation.ts`** — `installationPlan(project)`: work order derived from structural dependency graph + BOM; pure, structural ids.

### 1f. Browser/edge-coupled clients

- **`lib/solarApi.ts`** — Google Solar client (`mapBuildingInsights` pure mapper + `fetchBuildingInsights` fetch to `/api/solar/building-insights`, memoized, 10 s abort, never throws).
- **`lib/weatherApi.ts`** — PVGIS client (`fetchWeather` → `/api/pvgis`, 9 s timeout, one transient retry, validates via `isValidSiteWeather`).
- **`lib/pvgis.ts`** — pure mapper `pvgisToWeather` + validator `isValidSiteWeather` (shared by client + persistence). PORTABLE.
- **`lib/maps.ts`** — `loadGoogleMaps` (script injection, `window`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`), `staticSatelliteUrl`, `metersPerStaticMap`, `pickScaleBar`. Browser-coupled.
- **`lib/analysis-client.ts`** — Worker orchestration for shading with inline pure `computeSolarAccess` fallback.
- **`lib/roof-ai/`** — `gemini-client.ts` (pure pixel→artifact conversion + `crossCheckWithGeometry` + `detectRoofsViaGemini` fetch), `detect-client.ts` (dataLayers fetch → geotiff → Worker → `validateArtifact`), `artifact.ts` (pure `validateArtifact`/`applyArtifact` — the sole AI→project doorway), plus worker/geotiff/plane-fit/vectorize (Worker/browser).

---

## 2. EXTERNAL API USAGE

All third-party APIs are **proxied server-side** through Next.js route handlers (`src/app/api/*`, all `runtime='nodejs'`, `dynamic='force-dynamic'`). The browser only ever hits same-origin `/api/*`. Every proxy returns **HTTP 200 with a status envelope** (`{status:'ok'|'unavailable'|'error', ...}`) so clients have one contract. Keys never reach the client bundle.

### PVGIS (irradiance / weather) — the sole energy source
- Client `lib/weatherApi.ts` → `GET /api/pvgis?lat&lng`.
- Route `src/app/api/pvgis/route.ts` → upstream `https://re.jrc.ec.europa.eu/api/v5_3/MRcalc?lat&lon&horirrad=1&d2g=1&raddatabase={db}&outputformat=json`. 8 s timeout. **DB ladder** `['PVGIS-SARAH3','PVGIS-ERA5']` (`lib/pvgis.ts` `PVGIS_DB_LADDER`): 400 on SARAH3 (all of India is outside its grid) falls through to ERA5; 400 on both = `unavailable`. Success cached 24 h.
- Data in: lat/lng. Data out: `SiteWeather{monthlyGhi[12] (kWh/m²/day), monthlyDiffuseFrac[12] (Kd), annualGhi, forLatLng, source:'pvgis', raddatabase, yearsOfRecord}`. Mapping in pure `pvgisToWeather` (averages each calendar month across all record years; fixed-calendar days-per-month so leap years cancel). Verified fixture at `lib/__tests__/fixtures/pvgis-mrcalc-pune.json`.

### Google Solar API (Building Insights + Data Layers) — enhancement only, never a dependency
- **Building Insights**: `lib/solarApi.ts` → `GET /api/solar/building-insights` → `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude&longitude&requiredQuality=BASE&key`. 8 s timeout; 404→`unavailable`; cached 24 h. Out: `SolarInsights` (roof segments pitch/az/area/center, maxPanels, sunshine hours, carbon offset factor, imagery date/quality). Pure mapper `mapBuildingInsights`.
- **Data Layers** (roof geometry): `lib/roof-ai/detect-client.ts` → `GET /api/solar/data-layers?lat&lng&radius` → `https://solar.googleapis.com/v1/dataLayers:get?...&view=IMAGERY_LAYERS&requiredQuality=LOW`. **Scope binding: flux/irradiance layers are NEVER requested** (PVGIS is the only energy source) — only DSM + RGB + building mask. Radius clamped 10–100 m.
- **GeoTIFF relay**: raster `*Url`s are key-authenticated + expire ~1 h, so the route rewrites them to `/api/solar/geotiff?src=<url>`. `src/app/api/solar/geotiff/route.ts` streams bytes with the key appended server-side; **SSRF guard**: only `https://solar.googleapis.com/v1/geoTiff:get` prefix is relayable. 404→410 (retryable/expired).
- Key resolution `src/app/api/solar/key.ts`: `GOOGLE_SOLAR_API_KEY ?? NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (dedicated Solar key preferred; Maps key dev fallback).

### Gemini (vision roof detection) — structured-output only
- Client `lib/roof-ai/gemini-client.ts` → `POST /api/gemini` (`{kind:'satellite', latLng}` — server fetches the same static tile the canvas shows for a guaranteed 1:1 pixel mapping).
- Route `src/app/api/gemini/route.ts` → `https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL ?? 'gemini-2.5-flash'}:generateContent?key`. Binding rules: `temperature:0`, `responseMimeType:'application/json'` + enforced `responseSchema` (no prose leaks), versioned prompt `GEMINI_PROMPT_VERSION='roof-detect-v1'`, no-guessing instructions (empty result preferred over invented roof), 25 s timeout, 4 MB image cap. Missing key → `{status:'unconfigured'}` (graceful). Out: pixel-space `{roofs[], objects[]}` + `promptVersion` + `model`. Client converts px→meters using calibrated span and runs through the same `validateArtifact` doorway; `crossCheckWithGeometry` floors confidence to ≤0.25 where a Gemini roof overlaps the aerial mask <20%.

### Google Maps JS + Static tiles — client-side (only place a key ships to browser)
- `lib/maps.ts`: `loadGoogleMaps` injects the Maps JS script; `staticSatelliteUrl` builds Static Maps URLs. Both read `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` client-side (the one intentionally-public key; note the same key is the Solar dev fallback).

**Multi-tenant implication**: keys are single global env vars (`GEMINI_API_KEY`, `GOOGLE_SOLAR_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `GEMINI_MODEL`) — no per-tenant key/quota/billing isolation. Caching is per-coordinate `Cache-Control` only (no server store); the client `insightsMemo`/`beamCache`/`factorCache` are in-memory per session.

---

## 3. PERSISTENCE LAYER

All storage I/O is isolated in `lib/persistence/` (browser-only). No backend/DB — everything is client-local.

**Schema (`lib/persistence/schema.ts`), `SCHEMA_VERSION = 2`, localStorage layout:**
- `solar-studio-meta` → `StudioMeta{schemaVersion, user, activeProjectId, projectIds[]}` (authoritative index).
- `solar-studio-prj:<id>` → one `Project` JSON per key (per-project quarantine — one corrupt project can't wipe siblings).
- `solar-studio-quarantine:<id>` → raw string of a project that failed to parse (never auto-deleted, recoverable).
- `solar-studio-v1` (legacy monolith) / `solar-studio-v1-backup`.
- Images (`captures`/`coverImage`) live in **IndexedDB** (`blobs.ts`, DB `solar-studio-blobs`, store `images`, data-URL strings keyed by `img_<uuid>`), referenced from the project by blob id so a keystroke never re-serializes megabytes.

**Repository (`lib/persistence/repository.ts`):**
- `loadState()`: reads meta → `loadV2`; else migrates v1 monolith → per-project keys via `migrateV1` (keeps a backup; removes v1 only after every new-layout write + backup succeed — partial write re-runs migration next boot). Corrupt meta rebuilds the index by scanning `prj:` keys.
- `hoistInlineImages`: idempotent one-time hoist of inline base64 → IndexedDB, then writes slim JSON back.
- Quota handling: `write` returns `'ok'|'quota'|'error'`; failures surfaced as `PersistStatus`, never swallowed. Corrupt payloads quarantined (original key removed only after quarantine copy lands).
- Multi-tab: `subscribeExternalChanges` on the `storage` event delivers other-tab writes (parsed/normalized) for last-writer-wins merge. Blob GC helpers (`projectBlobIds`, `pruneOrphanImages`, `quarantinedBlobIds`).

**Normalization / migration (`lib/persistence/normalize.ts`)** — pure, runs on every load:
- Fills post-launch fields with defaults; drops malformed sub-entities item-by-item (all-or-nothing per item, never per project); coerces every entity array to an array (crash guard).
- One-time field migrations: legacy `sldParams` snapshot → `derived.sldOverrides` diff (`diffSldOverrides`); parapet `perEdge` object→boolean coercion; discount repair.
- `Exhaustive<T>` type trick forces every field of `PricingSettings`/`Calibration`/`DerivedState` to be named (prevents silent field-drop on load — the bug that once erased saved discounts).
- Deliberately does **not** migrate legacy `bomOverrides` (too heavy for every-load); that's lazy on first BOM edit. `normalizeBomState` validates the Phase-22c `bom` block; keeps an empty block absent to preserve byte-identical fingerprints.
- `normalizeWeather` drops weather failing `isValidSiteWeather` (falls back to estimate rather than rendering NaN).

**Versioning approach**: two-level — (1) `SCHEMA_VERSION` for the storage envelope with a real v1→v2 migration; (2) content-addressed fingerprints (`designFp`, `catalogVersion`, `structureModelVersion`, `SHADING_ENGINE_VERSION`) that make derived artifacts self-stale when the model/catalog changes.

---

## 4. DATA CATALOGS (`data/`)

Pure TS constant tables + typed helpers. All flagged mock/representative until a real import lands.

- **`data/panels.ts`** — `PANEL_DB: PanelSpec[]` (15 entries). Per-panel: brand/model/watt/tech/dims/`vocV`/`vmpV`/`iscA`/`impA`/`tempCoeffVocPct`/`almm`/`dcr`/`priceInr`/`warrantyYears`/`weightKg`/`availability`. Indian-market modules (AESOLAR, Adani, Waaree, Vikram, Tata, Jinko, LONGi, etc.). Note: `tempCoeffPmaxPct` absent → falls back to rules.
- **`data/inverters.ts`** — `INVERTER_DB: InverterSpec[]` (12 entries). Per-inverter: acKw/phases/`mppt{count,minV,maxV,maxCurrentA,stringsPerMppt}`/`maxDcV`/efficiencyPct/priceInr/warrantyYears. 1φ and 3φ, string + central (Amaze 30 kVA 10-MPPT).
- **`data/pricebook.ts`** — `PRICE_BOOK` org price book (₹). **By-size cable tables** `dcCablePerMBySize`/`acCablePerMBySize` (priced by derived conductor size), plus ~50 flat rates (clamps, rails, standoffs, foundations, fencing, BOS, DCDB/ACDB/combiner/SPD, meters, labour `installationPerKw`, site-dependent crane/scaffold/trenching prompts). `cableRatePerM` (falls UP to next size), `DEFAULT_MARGIN_PCT = 12`, `PriceKey`/`PriceBook` types.
- **`data/catalog.ts`** — versioned envelope. `resolveCatalog()` → `CatalogEnvelope{catalogVersion:'2026.07-1', effectiveFrom:'2026-07-01', provenance:'mock-representative', entryProvenance:{}, panels, inverters, pricebook}`. `catalogProvenance(id)`. `CatalogProvenance = 'manufacturer-datasheet'|'installer-pricebook'|'mock-representative'`. Single resolution point designed for the Phase-10 management UI to swap in imported versions.
- **`data/profiles.ts`** — `STRUCTURE_PROFILES: StructureProfile[]` structural steel section catalog (8 cold-formed sections c/u/l/z/rhs/chs/hat), `kgPerM` derived from `developedWidthMm`/`hollowAreaMm2`×7850, `sectionLabel`. Order load-bearing (`[0]` is the default).
- **`data/discoms.ts`** — `INDIAN_STATES[]` (37), `DISCOMS: Record<state, discom[]>`, `STATE_TARIFFS`/`DISCOM_TARIFFS` (residential/commercial ₹/kWh), `tariffFor(state, discom, siteType)` (most-specific-first). **Mock representative, not a live feed.**
- **`data/gst.ts`** — `GST_EQUIPMENT_PCT=5`, `GST_SERVICE_PCT=18`, `GST_BY_CATEGORY`, `GST_BY_LINE` (per-line exceptions, e.g. `mech.pedestal`→18%), `gstPctFor`.
- **`data/rules/india.ts`** — see §6.

---

## 5. STORE (`store/`)

Zustand is **not** used — the store is a **React `useReducer` + Context** implementation (`store/store.tsx`, ~16 KB). Consider this the "store shape" for a rebuild.

**`AppState`**: `user`, `projects: Project[]`, `activeProjectId`, `hydrated`, `quarantinedIds[]`, `externalConflictAt`, **`undoStack: Project[]`**, **`redoStack: Project[]`**.

**Undo/redo**: full-project snapshot stacks, **capped at 24 entries** (`undoStack.slice(-24)`). Only `update-project` with `undoable:true` pushes; derived stamps (`stamp-health`, shading writes) are never undo steps. `undo`/`redo` swap snapshots and stamp a fresh `updatedAt` (so multi-tab LWW doesn't ignore an undo). Opening/creating/closing a project or an external conflict clears both stacks.

**Reducer actions**: login/logout, set-language/set-units, create/delete/open/close-project, hydrate, `update-project{patch, undoable}`, `stamp-health`, undo, redo, `external-project-update` (LWW, strictly-newer; `stampOnly` detection avoids false conflict banners from background stampers), external-project-delete, external-user, dismiss-external-conflict.

**Persistence wiring (`StoreProvider`)**: async hydrate via `loadState()`; **debounced (250 ms) dirty-key-only** writes (reference-inequality diff against a `PersistedSnapshot`); quota/error surfaced as `persistStatus` chip with `retryPersist`; `pagehide`/`visibilitychange` flush; boot-time blob GC; `subscribeExternalChanges` for multi-tab. `newProject()` factory seeds a full `Project` (tariff from `resolveRules().defaults.tariffNewProjectInrPerKwh`, margin from `DEFAULT_MARGIN_PCT`, `shareId`).

**Selectors/hooks**: `useStore`, `useActiveProject`, `useProjectPatch`. Sync hooks: `store/useDesignSync.ts` (recomputes shading off-thread via `analysis-client` when `shadingFp` changes, 800 ms debounce, stamps `derived.solarAccessFp`) and `store/useHealthSync.ts` (stamps `derived.healthSnapshot`).

**`project.derived`**: `{solarAccessFp, sldOverrides, sldIntroSeen, healthSnapshot}` — the derived-state stamps that drive staleness badges. `project.insightState` holds accept/ignore per insight key.

---

## 6. INDIA DOMAIN LOGIC

All market/standards constants are centralized in **`data/rules/india.ts`** (`INDIA_RULES: MarketRules`) behind a single resolver `resolveRules()`. This is explicitly the "seed of the configurable rule engine (§8.10)": today it returns one hardcoded market; the design intent (documented in-file) is that later phases pass `project.info` and merge per-state/per-DISCOM overrides here, so **consumers already read through a resolver rather than importing literals** — but no per-tenant/per-state override merging exists yet. Everything below is currently **hardcoded India, single-market**.

- **GST** — `data/gst.ts` + `MarketRules` (rates not in rules, in gst.ts): 5% renewable devices / 18% civil+services; `GST_BY_CATEGORY` + `GST_BY_LINE` exceptions; **editable per BOM line** (the value used is always the line's own, resolved at emit time by `gstPctFor`). Discount handled pre-GST per s.15(3)(a) in `bom/money.ts`.
- **Subsidy (PM Surya Ghar)** — `rules.subsidy` (`firstSlabPerKwInr 30000` / `firstSlabKw 2` / `secondSlabPerKwInr 18000` / `capInr 78000` / `capKw 3` / `requiresDcr true`), applied in `finance.subsidyInr` — residential + DCR modules only. Values flagged "verify current-year against official portal."
- **Tariffs** — `data/discoms.ts`: `STATE_TARIFFS`/`DISCOM_TARIFFS` (residential/commercial), `tariffFor(state, discom, siteType)` resolved DISCOM→state→default; `rules.defaults.tariffUnknownStateInrPerKwh 7.5`, `tariffNewProjectInrPerKwh 8`. **Mock representative**; user override in UI always wins. 3%/yr escalation hardcoded in `finance.ts`.
- **DISCOM directory** — `data/discoms.ts` `DISCOMS` (per-state licensee lists), `discomsForState`. Also drives per-DISCOM tariff overrides (Mumbai licensees etc.).
- **Net metering** — no formal net-metering engine; encoded as a **soft cap** in `auto-design.ts` (designed kWp > `info.sanctionedLoadKw` → warn + `DesignDecision`, never block, "many DISCOMs cap net-metering at sanctioned load"). BOM emits `elec.meters` (net meter + generation meter, "Required for net metering").
- **Design temperatures** — `rules.temps.latBands` (5 India climate bands from deep-south to himalayan), `cellRiseC 30`, `fallbackPmaxCoeffPct -0.35`. Flagged ASSUMED / ENGINEER-VALIDATION-REQUIRED (latitude is a coarse proxy in India; altitude dominates).
- **DC/AC sizing ladders** — `rules.dcSizing` (fuseFactor 1.56, fuse/isolator ladders, PV-cable ampacity) + `rules.acSizing` (breakerFactor 1.25, MCB/MCCB ladder to 630 A, ampacity + resistance tables to 240/400 mm², voltDropLimitPct 3). Standards labeled "IS/IEC 62548 · CEA."
- **Wind** — `rules.wind.basicWindSpeedMsByState` (IS 875-3 representative zone per state), `highWindMinMs 47` — display/verification-nudge only, never a wind-load calc.
- **Other India conventions in rules**: `combiner`, `financing` (loan 9.5%/5yr, lease 11%/10yr, PPA 20% discount/15yr — ASSUMED), `earthing` (IS 3043 convention), `foundations` (IS-2062 HDG, ASSUMED sizes), `sheet` (metal-shed fixing), `defaults` (setbacks, `planLimitKw 10` freemium gate).

Configurability verdict: **structurally ready for multi-market via `resolveRules()`/`resolveCatalog()`/`tariffFor()` but currently a single hardcoded India rule set + mock catalogs**. Per-line editability (GST, tariff, BOM prices/qty) exists as override layers; per-tenant/state rule inheritance does not.

---

## 7. PROVENANCE / HONESTY IMPLEMENTATION

This codebase has an unusually rigorous, systematized honesty layer — the single most reusable asset for a SaaS rebuild.

**Confidence tiers (BOM quantities)** — `BomLine.confidence: 'measured'|'derived'|'estimated'|'assumed'` (`types.ts:740`). `line()` defaults to `'derived'`; emitters pass stronger (`'measured'` = direct count) or weaker (`'assumed'` = depends on unmodelled fact). `bomConfidence()` reports the **worst tier present** as the header badge, `needsVerification[]` (items in estimated/assumed), and `preliminary` flag; **an overridden line counts as `'measured'`** (a human took ownership). Excluded lines don't set confidence. The cable emitter picks confidence by source (`routed→derived`, `input→measured`, `fallback→estimated/assumed`).

**Catalog provenance** — `CatalogProvenance` (`'manufacturer-datasheet'|'installer-pricebook'|'mock-representative'`) with catalog-level default + per-entry `entryProvenance` override; current bundled data labeled `'mock-representative'`. `catalogVersion`+`effectiveFrom` ride into `designFp` so a price change re-keys and stales quotes.

**Entity provenance (geometry)** — `EntityProvenance{source:'manual'|'dataLayers'|'gemini', confidence?}` on Roofs/Obstructions (`types.ts:145`). `applyArtifact` stamps it; `health.ts` context surfaces "N AI-detected entities — dimensions are detector estimates."

**Irradiance provenance** — `EnergyReport.irradianceSource:'PVGIS'|'estimate'`; `activeWeather()` only trusts PVGIS data fetched for the current pin (within 1e-4°), else falls back to estimate. Surfaced in health context, comparison basis, and proposal narrative (source is only a "fact" when the sentence names it).

**Design-temperature provenance** — `DesignTemps.source:'measured'|'assumed'` + plain-language `note`; today always `'assumed'` with "confirm for this site."

**Staleness / freshness** — `lib/fingerprints.ts` 5-layer nested fingerprint graph + `shadingFp`. `isShadingFresh`/`isCaptureFresh`/`capturesFresh` drive "recalculating"/"stale capture" badges. `SHADING_ENGINE_VERSION`, `structureModelVersion()`, `catalogVersion` join fingerprints unconditionally so engine/model/price changes **self-stale** older stamped data. BOM `staleFields`/`staleDetail` (via `mergeBom` comparing current derived vs `autoAtEdit`) power the "yours vs now" override reconciliation UI.

**Disclaimers** — pervasive in-code, propagated to outputs: `STRUCTURE_DISCLAIMER` injected into BOM formulas → emitted as a CSV NOTE; `bomToCsv` appends `PRELIMINARY — site verification required for: …` and discount notes; the AC-cable formula states voltage-drop governance + "Grouping, ambient above 40 °C … NOT modelled — engineer to verify"; rules constants carry `ENGINEER VALIDATION REQUIRED` / `ALL ASSUMED` banners; `structureIssues` emits `foundation_dead_load` warning ("roof capacity is NOT checked").

**AI honesty gates** — Gemini forced to `temperature:0` + schema-enforced JSON + versioned prompt (`promptVersion` recorded as provenance) + no-guessing rules; `validateArtifact` (version→pin→geometry→bounds→confidence, per-entity drop-with-reason); `crossCheckWithGeometry` floors confidence on aerial-mask disagreement; artifact `warnings[]` ("heights/pitch are NOT measurable from imagery"). The `RoofArtifact` is the **only** doorway from any AI into the store, converting through the same factory as manual tools.

**Insight provenance** — every `Insight` carries `impact`/`confidence` (0..1) + `evidence[]` strings citing the exact datum; `DesignDecision` logs (auto-design, comparison) record `choice`/`reason`/`inputs[]` rendered verbatim in "why?" UIs; `proposalNarrative` beats carry `facts[]` proving no number is invented.

---

### Portability summary for the rebuild
- **Pure/portable (move as-is to a shared package or server):** all of `electrical/`, `electrical-sizing`, `stringing`, `sld`, `cascade`, `bom/` + `bom.ts`, `finance`, `financing`, `poa`, `solar`, `sun`, `pvgis` (mapper), `drc`, `health`, `insights/`, `review`, `comparison`, `auto-design` (calls pure `computeSolarAccess`), `calibration`, `capabilities`, `fingerprints`, `proposal-narrative`, `installation`, `hardware`, `sim-time`, `roof-ai/artifact` + `gemini-client` mapper, all of `data/`.
- **Edge-coupled (needs adapters):** `solarApi`/`weatherApi`/`maps`/`analysis-client`/`detect-client` (fetch/Worker), `persistence/*` (localStorage + IndexedDB — replace with server DB), `store/*` + `useDesignSync`/`useHealthSync` + `units.useUnits` (React), `src/app/api/*` (Next server, single global keys).
- **Biggest rebuild gaps for multi-tenant SaaS:** no server persistence (all client-local localStorage/IndexedDB); no per-tenant API-key/quota isolation; single hardcoded India rule set + mock catalogs behind resolvers that were *designed* for multi-market but don't yet merge per-tenant/state overrides; undo history capped at 24 in-memory snapshots; no auth/tenancy boundary.