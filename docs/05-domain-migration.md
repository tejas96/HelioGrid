# 05 — Domain Migration: Solar Studio → `packages/domain`

The POC's `src/features/solar-studio/lib` is the engineering moat: ~45 lib modules plus
`data/`, already an almost-pure isomorphic TypeScript layer (zero React/storage imports in
the core; only 4 modules import three.js, and only as math). This document is the binding
module-by-module port plan into `packages/domain` (`@heliogrid/domain`).

Sources: [./research/geo3d.md](./research/geo3d.md) (geometry purity audit),
[./research/calc.md](./research/calc.md) (calculation/data audit),
`CLAUDE.md` (hard rules) + `.claude/rules/00-laws.md` (the Laws). The binding purity
contract for the ported domain layer is stated in this document, §2 below.
POC root: `/Volumes/works-space/Solar-App-POC/src/features/solar-studio/`.

---

## 1. Port philosophy

1. **Port-with-tests.** A module is ported when its POC tests pass unmodified — the only
   permitted diffs are import paths and context injection. The ~110 gate-oriented test
   files travel with the code; they encode hard-won invariants (frame parity, eave
   continuity, area tiling, byte-identical fingerprints) and are never deleted or skipped.
2. **No algorithm changes during the port.** Port → verify → improve later in a separate
   change with its own verification. Known limitations (O(n²) shading, `far=250` m raycast
   cap, `MAX_EVENTS=400`) are pinned behaviour through the port batches; three-mesh-bvh
   integration and `far=250` cap removal land **immediately after the port batches
   complete** (Track D, Days 14–18, docs/14), as a separate golden-verified change (part of scale Phase A,
   `docs/11-scale-program.md` — but NOT "during the port"). `ProjectionContext` is the one
   structural exception: it IS introduced at port time as an injected context whose
   **default implementation is the existing equirectangular projector**, keeping ported
   POC tests byte-identical; a UTM/ENU (proj4) implementation ships alongside and is
   selected for ground-mount/large sites.
3. **Golden files pin behaviour.** The structure member/node-graph snapshot
   (`structure-golden.test.ts`) and the BOM golden snapshots must be **byte-identical**
   after the port. Any diff is a port defect, not an improvement.
4. **The one-frame gate is a release gate.** `one-frame.test.ts` + `frame-parity.test.ts`
   (renderer matrix == analytical corners == 2D-editor corners) must exist and pass from
   the first studio render onward. No web studio release ships with this gate red.
5. **Purity is enforced, not promised.** dependency-cruiser blocks NestJS/React/fetch/
   storage/`process.env`/`packages/db`/`packages/contracts` imports in `packages/domain`.
   Allowed deps: `polygon-clipping`, `three` (math only), `proj4`.

---

## 2. Module-by-module port table

Purity classes: **pure** (no three/React/DOM) · **three-math** (imports `three` as
CPU maths only) · **needs-adapter** (fetch/Worker/browser API — split or replaced).
Port actions: **as-is** · **context-injection** (signature gains injected context) ·
**adapter-split** (pure core ported, I/O shell rebuilt app-side) · **rewrite** ·
**not ported**. Contexts: **R** = RulesContext, **C** = CatalogContext,
**P** = ProjectionContext (§3).

Target layout is `packages/domain/src/<area>/<module>.ts`; paths below are relative to
`packages/domain/src/`.

### 2a. Geometry kernel & canonical model

| POC (`lib/`) | New path | Purity | Action | Contexts |
|---|---|---|---|---|
| `../types.ts` | `project/types.ts` | pure | as-is (drop `wizardStep` UI fields is **not** allowed — serialized shape is frozen; see §5) | — |
| `geo.ts` | `geometry/geo.ts` | pure | context-injection: `makeProjector` becomes the equirectangular `ProjectionContext` implementation | P |
| `ground.ts` | `geometry/ground.ts` | pure | as-is | — |
| `drawing-project.ts` | `geometry/drawing-project.ts` | pure | as-is | — |
| `sun.ts` | `energy/sun.ts` | pure | as-is | — |
| `sim-time.ts` | `energy/sim-time.ts` | pure | as-is | — |
| `fingerprints.ts` | `project/fingerprints.ts` | pure | as-is — the 5-layer graph (`siteFp ⊂ geometryFp ⊂ layoutFp ⊂ electricalFp ⊂ designFp`) + `shadingFp` port exactly; `catalogVersion` now read from CatalogContext, same string value | C |
| `capabilities.ts` | `project/capabilities.ts` | pure | context-injection (bridge-clearance rules) | R |
| `cascade.ts` | `project/cascade.ts` | pure | as-is | — |
| `calibration.ts` | `project/calibration.ts` | pure | as-is | — |
| `units.ts` | `project/units.ts` | pure core | adapter-split: `fmtLen`/`fmtArea`/`lenToM` port; `useUnits` React hook stays in `packages/ui` | — |
| `project-duplicate.ts` | — | needs-adapter | rewrite server-side: duplication = design-row copy + Tigris object copy (IndexedDB blob copy logic dies) | — |

### 2b. Roof factories

| POC (`lib/`) | New path | Purity | Action | Contexts |
|---|---|---|---|---|
| `roof-factory.ts` | `roof/roof-factory.ts` | pure | context-injection (setbacks, `groundSetbackM`, parapet defaults) | R |
| `roof-plane.ts` | `roof/roof-plane.ts` | pure | as-is | — |
| `roof-topology.ts` | `roof/roof-topology.ts` | pure | as-is | — |
| `roof-gable.ts` | `roof/roof-gable.ts` | pure | as-is | — |
| `roof-hip.ts` | `roof/roof-hip.ts` | pure | as-is | — |
| `roof-skeleton.ts` | `roof/roof-skeleton.ts` | pure | as-is | — |
| `skeleton-wavefront.ts` | `roof/skeleton-wavefront.ts` | pure | as-is (`MAX_EVENTS=400` stays) | — |
| `skeleton-events.ts` | `roof/skeleton-events.ts` | pure | as-is | — |
| `roof-face-group.ts` | `roof/roof-face-group.ts` | pure | as-is | — |
| `roof-colors.ts` | `roof/roof-colors.ts` | pure | as-is | — |

### 2c. Layout & placement

| POC (`lib/`) | New path | Purity | Action | Contexts |
|---|---|---|---|---|
| `layout.ts` | `layout/layout.ts` | pure | context-injection (setbacks, `groundTiltDeg`, fill defaults) | R |
| `spacing.ts` | `layout/spacing.ts` | pure | as-is | — |
| `segment-ops.ts` | `layout/segment-ops.ts` | pure | context-injection (transitive: calls structure resolvers) | R |
| `panel-move.ts` | `layout/panel-move.ts` | pure | as-is | — |
| `panel-pose.ts` | `layout/panel-pose.ts` | pure | context-injection (transitive via structure/layout) | R |

### 2d. Scene bridge (three-math — see §4)

| POC (`lib/`) | New path | Purity | Action | Contexts |
|---|---|---|---|---|
| `scene-model.ts` | `scene/scene-model.ts` | three-math | as-is (returns `THREE.Group`/`Object3D[]` in v1) | — |
| `scene-frame.ts` | `scene/scene-frame.ts` | three-math | as-is (`panelInstanceMatrix` is the one frame) | — |
| `shading.ts` | `analysis/shading.ts` | three-math | as-is (`SHADING_ENGINE_VERSION=6` unchanged; ENGINEER VALIDATION banner travels) | — |
| `solar-heatmap.ts` | `analysis/solar-heatmap.ts` | three-math | as-is | — |

### 2e. Structure & foundations

| POC (`lib/`) | New path | Purity | Action | Contexts |
|---|---|---|---|---|
| `structure.ts` | `structure/structure.ts` | pure | context-injection (racking rules; steel profiles from catalog) | R, C |
| `structure-edit.ts` | `structure/structure-edit.ts` | pure | context-injection (transitive) | R, C |
| `structure-view.ts` | `structure/structure-view.ts` | pure | as-is | — |
| `leg-plan-edit.ts` | `structure/leg-plan-edit.ts` | pure | as-is | — |
| `foundation.ts` | `structure/foundation.ts` | pure | context-injection (IS-2062 assumed sizes; D15 height contract unchanged) | R |
| `hardware.ts` | `structure/hardware.ts` | pure | as-is | — |
| `installation.ts` | `structure/installation.ts` | pure | as-is | — |

### 2f. Electrical

| POC (`lib/`) | New path | Purity | Action | Contexts |
|---|---|---|---|---|
| `electrical-sizing.ts` | `electrical/sizing.ts` | pure | context-injection (`dcSizing`/`acSizing` ladders) | R |
| `electrical/temps.ts` | `electrical/temps.ts` | pure | context-injection (`latBands`, `cellRiseC`, `fallbackPmaxCoeffPct`) | R |
| `electrical/window.ts` | `electrical/window.ts` | pure | as-is (takes `DesignTemps` param; empty window stays an explicit fault) | — |
| `electrical/grouping.ts` | `electrical/grouping.ts` | pure | as-is | — |
| `electrical/autostring.ts` | `electrical/autostring.ts` | pure | as-is (unstrung-over-illegal rule locked) | — |
| `electrical/combiner.ts` | `electrical/combiner.ts` | pure | context-injection (`rules.combiner`) | R |
| `electrical/gate.ts` | `electrical/gate.ts` | pure | as-is | — |
| `stringing.ts` | `electrical/stringing.ts` | pure | as-is (params carry temps; DC/AC band constant pinned) | — |
| `sld.ts` | `electrical/sld.ts` | pure | context-injection (transitive via sizing) | R |

### 2g. BOM, energy, finance

| POC (`lib/`) | New path | Purity | Action | Contexts |
|---|---|---|---|---|
| `bom.ts` | `bom/index.ts` | pure | context-injection | R, C |
| `bom/context.ts` | `bom/context.ts` | pure | context-injection (pricebook via CatalogContext; 3-source cable provenance unchanged) | R, C |
| `bom/registry.ts` | `bom/registry.ts` | pure | context-injection (GST resolution moves to `rules.tax`) | R |
| `bom/money.ts` | `bom/money.ts` | pure | as-is (margin-below-GST, pre-GST pro-rata discount — locked money math) | — |
| `bom/merge.ts` | `bom/merge.ts` | pure | as-is (per-field overrides, `staleFields`, override=measured) | — |
| `bom/line.ts` | `bom/line.ts` | pure | context-injection (waste/GST from registry) | R |
| `bom/edit.ts` | `bom/edit.ts` | pure | as-is | — |
| `bom/view.ts` | `bom/view.ts` | pure | as-is | — |
| `bom/emitters/*` (6) | `bom/emitters/*` | pure | context-injection | R, C |
| `solar.ts` | `energy/energy-report.ts` | pure | as-is (PVGIS-first, labelled estimate fallback; loss constants stay in-module, pinned by tests) | — |
| `poa.ts` | `energy/poa.ts` | pure | as-is (module-level beam cache becomes an injectable memo — same values) | — |
| `pvgis.ts` | `energy/pvgis.ts` | pure | as-is (`pvgisToWeather` mapper + `isValidSiteWeather`; SARAH3→ERA5 ladder constant) | — |
| `finance.ts` | `finance/finance.ts` | pure | context-injection (PM Surya Ghar slabs, tariff defaults, escalation) | R |
| `financing.ts` | `finance/financing.ts` | pure | context-injection (`rules.financing` terms) | R |
| `routing.ts` | `routing/routing.ts` | pure | context-injection | R |
| `dxf.ts` | `export/dxf.ts` | pure | as-is | — |
| `export-dxf.ts` | `export/export-dxf.ts` | pure | as-is | — |

### 2h. Analysis, insight, review

| POC (`lib/`) | New path | Purity | Action | Contexts |
|---|---|---|---|---|
| `drc.ts` | `insight/drc.ts` | pure | context-injection (transitive via capabilities) | R |
| `health.ts` | `insight/health.ts` | pure | context-injection (`rules.health` deductions) | R |
| `insights/types.ts` | `insight/insights/types.ts` | pure | as-is | — |
| `insights/registry.ts` | `insight/insights/registry.ts` | pure | as-is | — |
| `insights/analyzers.ts` | `insight/insights/analyzers.ts` | pure | as-is | — |
| `insights/analyzers-access.ts` | `insight/insights/analyzers-access.ts` | pure | as-is | — |
| `review.ts` | `insight/review.ts` | pure | as-is (read-only, never a second gate) | — |
| `comparison.ts` | `insight/comparison.ts` | pure | context-injection (panel/inverter shortlists from catalog) | R, C |
| `auto-design.ts` | `insight/auto-design.ts` | pure | context-injection (sanctioned-load soft cap; calls pure `computeSolarAccess` — Worker dispatch stays app-side) | R |
| `proposal-narrative.ts` | `insight/proposal-narrative.ts` | pure | as-is (`facts[]` traceability test travels) | — |

### 2i. Edge-coupled clients (adapter splits)

| POC (`lib/`) | Pure core → domain | I/O shell → | Action |
|---|---|---|---|
| `solarApi.ts` | `mapBuildingInsights` → `integrations/google-solar.ts` | `apps/api` solar module (server proxy, per-tenant metering) | adapter-split |
| `weatherApi.ts` | validation already in `energy/pvgis.ts` | `apps/api` PVGIS proxy (8 s timeout, DB ladder, 24 h cache) | adapter-split |
| `maps.ts` | `metersPerStaticMap`/`pickScaleBar` maths → `geometry/map-scale.ts` | script loader + Static Maps URLs stay in `apps/web` | adapter-split |
| `analysis-client.ts` | — | replaced: browser Worker pool in `apps/web`, `worker_threads` in `apps/worker`; message contract in `packages/contracts` | rewrite |
| `roof-ai/artifact.ts` | `roof-ai/artifact.ts` (`validateArtifact`/`applyArtifact` — the sole AI→Project doorway) | — | as-is |
| `roof-ai/gemini-client.ts` | px→artifact conversion + `crossCheckWithGeometry` → `roof-ai/gemini-map.ts` | Gemini fetch → `apps/api` (temp 0, schema-enforced, versioned prompt) | adapter-split |
| `roof-ai/plane-fit.ts`, `vectorize.ts`, `utm.ts` | `roof-ai/*` (pure kernels; verify no DOM import at port time) | — | as-is |
| `roof-ai/geotiff-decode.ts` | decode fn (geotiff lib runs in Node and browser) | fetch/relay stays app-side | adapter-split |
| `roof-ai/detect-client.ts`, `detect.worker.ts`, `pipeline.ts` | — | rebuilt as `apps/web` worker orchestration over domain kernels | rewrite |

### 2j. `data/` — catalogs become seed data + contexts

| POC (`data/`) | Types/helpers → domain | Rows → | Action |
|---|---|---|---|
| `catalog.ts` | `catalog/context.ts`: `CatalogContext` (envelope type, `catalogVersion`, `CatalogProvenance`, `entryProvenance`) | server builds the envelope per tenant: **tenant-override → tenant-item → platform-item** (two-tier catalog, `docs/04-data-model.md`) | rewrite of `resolveCatalog()` into a server-side builder |
| `panels.ts` | `PanelSpec` type → `catalog/types.ts` | `platform_catalog_items` seed rows (`kind='panel'`; 15 rows, provenance `mock-representative` until real import) | split |
| `inverters.ts` | `InverterSpec` type | `platform_catalog_items` seed rows (`kind='inverter'`) | split |
| `pricebook.ts` | `PriceBook`/`PriceKey` types + `cableRatePerM` fall-up logic → `catalog/pricebook.ts` | platform price-book seed; `DEFAULT_MARGIN_PCT` → tenant setting | split |
| `profiles.ts` | `StructureProfile` type + `kgPerM` derivation | `CatalogContext.structureProfiles` seed (order load-bearing — `[0]` is default) | split |
| `discoms.ts` | `TariffTable` type + `tariffFor(state, discom, siteType, table)` → `rules/tariffs.ts` | platform reference tables (admin-updatable; mock-representative label kept) | split |
| `gst.ts` | rates + per-line exceptions become `RulesContext.tax`; `gstPctFor(key, tax)` | — | context-injection |
| `rules/india.ts` | `rules/presets/india.ts` exporting `INDIA_RULES: RulesContext` — a plain frozen constant, **no resolver** | per-state/DISCOM overrides merge server-side later (global-ready) | context-injection; **delete `defaults.planLimitKw`** (§6) |

---

## 3. De-globalization: killing `resolveRules()` / `resolveCatalog()`

The POC's single coupling smell ([./research/geo3d.md](./research/geo3d.md) §3): market
rules and catalog resolve through module-level global singletons. Multi-tenant SaaS makes
that a correctness bug — geometry, pricing and sizing must vary by tenant/market.

**The ruling: every former call site takes context as a parameter.** No module-level
lookup survives; no ambient default; no fallback import of the India preset inside domain
functions.

- `DomainContext = { rules: RulesContext; catalog: CatalogContext; projection: ProjectionContext }`,
  defined in `packages/domain/src/context.ts`. Functions accept it (or the narrow
  `Pick<DomainContext, 'rules'>` they actually need) as the **last parameter**, named `ctx`.
- One construction point per host: `apps/api`/`apps/worker` build it per request from the
  tenant's resolved rules + two-tier catalog; `apps/web` builds it once per studio session
  from the synced tenant config; tests build it from `INDIA_RULES` + the seeded catalog —
  which is exactly why ported tests pass unmodified apart from the injected argument.
- **Directly affected modules** (grep-verified in the audits): `roof-factory`,
  `capabilities`, `layout`, `segment-ops`, `panel-pose`, `structure`, `structure-edit`,
  `foundation`, `routing`, `electrical-sizing`, `electrical/temps`, `electrical/combiner`,
  `sld`, `bom/context`, `bom/registry`, `bom/line`, all six `bom/emitters/*`, `bom.ts`,
  `finance`, `financing`, `health`, `comparison`, `auto-design`, `drc`, `fingerprints`
  (catalogVersion input).
- **ProjectionContext** (interface in `geometry/projection.ts`): introduced **at port
  time** as an injected context. The **default implementation is the existing POC
  equirectangular projector** (byte-compatible outputs — ported tests stay byte-identical);
  a UTM/ENU implementation (proj4, per-site origin) ships alongside behind the same
  interface and is **selected for ground-mount/large sites**
  (`docs/11-scale-program.md`). Injected wherever LatLng↔XY conversion happens: `geo`
  callers, `roof-ai` artifact application, map-trace ingestion.
- **Golden-file compatibility:** the India preset carries the same values and the same
  `catalogVersion: '2026.07-1'` string, so fingerprints and golden snapshots stay
  byte-identical through the de-globalization.
- **Enforcement:** dependency-cruiser forbids `data/rules` cross-imports; a lint grep gate
  (`rg 'resolveRules|resolveCatalog' packages/domain` must return zero) runs in
  `pnpm turbo lint` until the strings are extinct.

---

## 4. The three.js-coupled four

`scene-model`, `scene-frame`, `shading`, `solar-heatmap` import `three` as CPU maths only
(Vector3/Matrix4/BufferGeometry/Raycaster — no WebGL, no DOM). They already run headless.

**v1 ruling: keep three-as-math.** The purity contract in `CLAUDE.md` hard rules
explicitly allows it. Porting to a neutral maths kernel now would violate philosophy
rule 2 (no algorithm changes during port) and re-open the exact class of drift the
one-frame gate exists to prevent. Consequences accepted for v1:

- `packages/domain` declares `three` as a dependency; server bundles carry it (Node
  worker_threads run `computeSolarAccess` today in the POC's Worker — proven headless).
- `scene-model` keeps returning `THREE.Group`/`Object3D[]`; the web renderer and the
  shading engine consume the same casters, which is the point — one geometry, two readers.
- `PanelsInstanced` in `apps/web` keeps reusing `panelInstanceMatrix` from
  `scene/scene-frame.ts` so the one-frame gate tests the identical composition.

**After the port:** three-mesh-bvh integration (CPU raycast path with centred geometry —
float precision at km scale) plus removal of the `far=250` m raycaster cap land
**immediately after the port batches complete** (Track D, docs/14), as a separate golden-verified
change (part of scale Phase A, `docs/11-scale-program.md` — NOT "during the port").
Neutral mesh/AABB output structs for `scene-model` and GPU shadow-map shading (web app
only) are scale **Phase B**. The `far=250` m cap and O(panels²) cost are pinned POC
behaviour until their scheduled change lands.

---

## 5. Persistence adaptation

The POC persists to localStorage/IndexedDB; HelioGrid persists the same canonical
`Project` JSON to Postgres JSONB with PowerSync offline sync (`docs/06-offline-and-sync.md`).

- **`persistence/normalize.ts` → `project/normalize.ts` (domain, pure).** It ports as-is
  and becomes **server-side `normalizeProject`, run on every read** of the JSONB design
  payload (and client-side on PowerSync hydrate — same function, one mental model). Its
  guarantees are load-bearing: per-item drop-with-reason, `Exhaustive<T>` field-naming
  trick (the discount-erasure bug), byte-identical-fingerprint preservation for absent
  blocks, `normalizeWeather` NaN guard. Lazy BOM-override migration stays lazy (first edit).
- **Fingerprints unchanged.** The 5-layer graph plus `shadingFp` port exactly (§2a);
  server-stamped derived state (`solarAccessFp`, `healthSnapshot`) uses the same keys so
  staleness UX carries over.
- **`persistence/repository.ts` + `schema.ts` are NOT ported.** localStorage layout,
  v1→v2 migration, quota handling, multi-tab `storage` events — all replaced by Postgres +
  PowerSync (durable upload queue, versioned writes through the NestJS connector).
  Quarantine-on-corrupt is reborn server-side: a design payload that fails
  `normalizeProject` is preserved raw in a quarantine column, never discarded.
- **`persistence/blobs.ts` → Tigris attachments.** Captures/cover images become Tigris
  objects via the PowerSync Attachments Helper (presigned upload, resumable); the
  `img_<uuid>` blob-id indirection in `Project` survives as the attachment key, so the
  serialized model shape does not change. `useImage.ts` stays a web hook.
- **Serialized `Project` shape is frozen at port time.** Schema evolution happens via
  `normalizeProject` defaults + new fingerprint inputs, exactly as the POC did it.

---

## 6. Deliberately NOT ported

| POC artefact | Fate |
|---|---|
| `store/store.tsx` (React context + reducer, undo stacks) | Replaced by server state + PowerSync; studio-local undo is a web-app concern rebuilt over patch history in `apps/web` |
| `store/useDesignSync.ts`, `useHealthSync.ts` | Rebuilt as web-app hooks dispatching to the Worker pool / SSE staleness, same fingerprint keys |
| RouteGuards, fake login (`user` in store) | Better Auth sessions + Nest guards (`docs/08-security-and-tenancy.md`) |
| Freemium `planLimitKw` gate (`rules.defaults.planLimitKw 10`) | **Deleted from the RulesContext schema.** D38 is superseded by real billing entitlements — plan gating is a billing concern (`docs/16-billing-and-entitlements.md`), never a design-capacity cap. No kW clamp exists anywhere in domain |
| Share-local-only viewer (`shareId` local links) | Replaced by tokenised customer links (HMAC, scope+expiry, server-rendered). `shareId` field survives in the model until normalize retires it |
| `src/app/api/*` proxies (PVGIS/Gemini/Solar/geotiff) | Rebuilt in `apps/api` with per-tenant keys, metering, quotas; status-envelope contract and SSRF geotiff guard are kept as-is |
| `workers/analysis.worker.ts`, `analysis-client.ts` | Replaced by the dual-host kernel contract (browser Worker + Node worker_thread) in `packages/contracts` |
| `lib/persistence/{repository,schema}.ts`, `blobs.ts`, `useImage.ts` | See §5 |
| `lib/maps.ts` loader, `three/` R3F components, `Scene3D.tsx` | Web app (`apps/web`) — rendering is not domain |

---

## 7. Port order and verification gates

**When: Track D of the 20-day build (Days 14–18, docs/14) — the LAST major track per the
owner's priority directive — EXCEPT a thin subset that ports early (Track B, Day 7)** because remote
survey and Path-B proposal money depend on it: `project/types` + contexts (incl. the default
equirect ProjectionContext), `rules/presets/india`, `geometry/geo`, `roof/roof-factory`,
`roof-ai/*` pure kernels, `finance/*`, `project/normalize` — each with its ported tests and
the same gates below. The batch structure is unchanged; the thin subset simply pre-completes
those rows of Batch A/B/H when the studio phase begins.

Nine batches, dependency-ordered. **Every batch closes with the same three gates:**
(1) `pnpm turbo typecheck` green across the workspace; (2) the batch's ported POC tests
pass unmodified (import paths + `ctx` argument only); (3) `pnpm turbo lint` green —
Biome + dependency-cruiser purity rules + the `resolveRules|resolveCatalog` zero-hit grep.
Batches with golden files add byte-identical snapshot comparison.

| Batch | Modules | Extra gate |
|---|---|---|
| **A — kernel & contexts** | `project/types`, `context.ts` (DomainContext, RulesContext, CatalogContext, ProjectionContext), `rules/presets/india`, `geometry/geo`, `energy/sun`, `energy/sim-time`, `project/fingerprints`, `project/capabilities`, `project/units`, `project/cascade`, `project/calibration` | `geo.test`, `units*.test`, `sim-time.test` pass; India preset deep-equals POC values minus `planLimitKw` |
| **B — roof family** | all `roof/*` (10 modules) + `geometry/ground` | full roof suite: skeleton/gable/hip/topology/face-group/covering/edge-cases/wavefront/events/eave-ref/grouping-plane |
| **C — layout** | `layout/*` (5 modules) | layout, segment-ops, panel-move, spacing, pitched-grid, azimuth-lattice (+attacks), inset-fuzz |
| **D — scene bridge** | `scene/scene-model`, `scene/scene-frame`, `layout/panel-pose` wiring | **one-frame + frame-parity + scene-model + model-version pass — the release gate is live from here and never goes red again** |
| **E — structure** | `structure/*` (7 modules) | structure suite + `structure-golden` snapshot **byte-identical**; foundations/monorail/leg-plan/ground-mount/drc-structure |
| **F — analysis & energy** | `analysis/shading`, `analysis/solar-heatmap`, `energy/poa`, `energy/energy-report`, `energy/pvgis` + kernel message contract in `packages/contracts` | shading/row-shading/heatmap/poa/solar tests; PVGIS Pune fixture; kernel runs in both a Node worker_thread and a browser Worker smoke harness |
| **G — electrical** | `electrical/*` (9 modules) | window/grouping/autostring/combiner/gate/sizing/stringing/sld suites; empty-window fault behaviour pinned |
| **H — commercial** | `routing/routing`, `bom/*` (all), `finance/*` | routing/dxf-structure tests; **BOM golden snapshots byte-identical**; money invariants (GST/discount/margin/subsidy) green — these join the locked invariant set in `tests/invariants/` |
| **I — insight & export** | `insight/*` (10 modules), `export/*`, `geometry/drawing-project`, `roof-ai/*` pure kernels, `project/normalize` | drc/health/insights/comparison/auto-design/narrative-facts tests; normalize round-trip on POC fixture projects; artifact validate/apply tests |

Batch D is the earliest point a studio screen may render against `packages/domain`;
batch H is the earliest point a quote may render. Nothing outside `packages/domain` may
re-implement any function this package exports — the studio web port (`docs/14-build-roadmap.md`,
phase-10 tool census as acceptance) consumes this package and nothing else for engineering
truth.
