> **NORMATIVE** — still binding: a live document delegates authority to this file. Do not archive it without promoting its content first. docs/05 delegates its geometry-purity audit; docs/02, docs/03 and ADR-0017 cite specific sections. Keep until the studio port and scale program land.

I now have a comprehensive understanding of the entire geometry/3D half. Compiling the audit.

# Geometry/3D Half — Architecture Audit (solar-studio)

Root: `/Volumes/works-space/Solar-App-POC/src/features/solar-studio/`

## 0. TL;DR for the rebuild

- The geometry/engineering core is **already an almost-pure, isomorphic domain layer**. Of ~30 target `lib/` modules, **only 4 import three.js** (`scene-model`, `scene-frame`, `shading`, `solar-heatmap`), and those import three purely as a **math/raycasting library**, not as a renderer (no WebGL, no DOM). **Zero** target `lib/` files import React, zustand, or browser storage.
- The **canonical model** is a single serializable `Project` object (`types.ts`). All geometry is *derived on demand* from it — nothing derived is persisted (structure graph, poses, casters, heatmap are all pure functions of `Project`).
- Design discipline is enforced by an explicit **"§A0 one-model, one-frame" principle** with **release-gate tests** (`one-frame.test.ts`, `frame-parity.test.ts`) and a **5-layer nested fingerprint graph** (`fingerprints.ts`) governing recompute.
- **Scale is the weak point**: single-origin equirectangular projection, flat-terrain ground mount, O(n²) shading that "grows with panel count squared," no spatial index, per-project in-browser IndexedDB persistence. C&I is handled; **MW / multi-building / terrain is not.**

---

## 1. MODULE INVENTORY

Purity legend: **PURE** = no three/React/DOM; **three-math** = imports `three` only as vector/raycast math (portable to Node, but adds a heavy dep); **coupled** = React/DOM/worker.

### Roof geometry factories
| Module | LOC | Purpose | In → Out | Purity |
|---|---|---|---|---|
| `roof-factory.ts` | 313 | ONE construction path for every roof/obstruction source (manual, AI, duplicate). Polygon sanitize (`preCleanRing`, `sanitizeRoofPolygon`), `makeRoof`, `makeGroundSurface`, `makeObstruction`, `obstructionToPlatform`. | `XY[]`/opts → `Roof`/`Obstruction`/`PolygonResult` | **PURE** (imports `geo`, `capabilities`, `data/rules/india`) |
| `roof-plane.ts` | 112 | Sloped-roof plane math — the one source of surface height. `isSloped`, `slopeVector`, `surfaceHeightAt`, `computeEaveRefs` (groups adjacent same-slope roofs onto one eave line), `slopePanelPose`. | `Roof`,`XY` → heights/`Map<id,proj>` | **PURE** |
| `roof-topology.ts` | 136 | Roof-to-roof relations, all derived from geometry: `sharedEdges`, `effectiveParapetEdges` (shared-wall suppression), `higherOverlapFootprints` (stacked roofs), `roofsUnionAreaM2`, `pickRoofAt`. | `Roof[]` → edges/footprints/roof | **PURE** |
| `roof-gable.ts` | 149 | Gable = 2 adjacent `Roof` faces sharing a level ridge; Sutherland–Hodgman half-plane clip; ridge-symmetry gate (refuses non-symmetric footprints). Exports `azFromDownslope`. | footprint+opts → `{faces:[Roof,Roof]}` result union | **PURE** |
| `roof-hip.ts` | 165 | Hip = 4 faces on the oriented bounding box; only accepts ~rectangular footprints (`RECT_FILL_MIN=0.95`), else refuses. | footprint → `{faces:[Roof×4]}` | **PURE** |
| `roof-skeleton.ts` | 310 | Generalized pitched hip over any **convex** footprint via nearest-wall half-plane partition; reflex (L/U/T) footprints delegate to wavefront sim; area-tiling gate (3% convex / 1% reflex). | footprint → `SkeletonResult{faces:Roof[]}` | **PURE** |
| `skeleton-wavefront.ts` | 303 | Straight-skeleton **wavefront simulation** for reflex footprints; edge + split events; `MAX_EVENTS=400` hard stop. `sweepFaces`. | `XY[]` → `WavefrontResult{faces:SweptFace[]}` | **PURE** |
| `skeleton-events.ts` | 154 | Event solver kernel: `concurrencyEvent` (3 offset lines meet), `edgeLines`, `pointInRing`, `reflexVertices`, `initialEvents`. | `EdgeLine`s → `SkeletonEvent` | **PURE** |
| `roof-face-group.ts` | 85 | Sibling-face invariant: `pitchDeg`+`heightM` propagate across a `faceGroupId`; azimuth stays per-face. `applyFaceGroupPatch`. | `Roof[]`,id,patch → `{roofs, changedIds}` | **PURE** |
| `roof-colors.ts` | 40 | Per-roof palette + hex helpers (`roofColor`, `roofRgba`, `lightenHex`). | index/hex → string | **PURE** |

### Canonical model ↔ scene bridge
| Module | LOC | Purpose | In → Out | Purity |
|---|---|---|---|---|
| `scene-model.ts` | 306 | Builds **the one shared geometry** consumed by BOTH renderer and shading engine: `buildRoofSolidGeometry`, `buildParapetGeometries`, `buildShadowCasters` (roofs+parapets+obstructions+optionally panels as slabs, each tagged `userData.casterKind/casterId`), `contextBuildings` (decorative only). | `Project` → `THREE.Group`+`Object3D[]` | **three-math** (BufferGeometry/Mesh, no WebGL) |
| `scene-frame.ts` | 87 | **The one frame**: `panelInstanceMatrix` (T·Ry·Rx·T·S) — the exact matrix the renderer draws with — plus `panelPlanCorners` (projects rendered corners back to plan). Extracted so the one-frame gate tests the *same* composition. | `PanelPose` → `Matrix4`/`XY[]` | **three-math** |
| `panel-pose.ts` | 107 | Canonical module pose (§A0): height source order (sloped→flush, structured→leg+rise, loose→standoff), `yawRad`/`tiltRad`, ray sample height. `panelPose`, `panelSampleHeightM`. | `Project,PlacedPanel,spec,roof` → `PanelPose` | **PURE** (imports `layout`, `structure`, `roof-plane`) |

### Panel placement / layout
| Module | LOC | Purpose | In → Out | Purity |
|---|---|---|---|---|
| `layout.ts` | 697 | The auto-layout engine. `autoFillRoof` (grid fill honoring setbacks/obstructions/keepouts/stacked roofs/panel collisions), `fillRoofAsSegment`, `panelCornersOnRoof` (**THE** canonical footprint), `gridAngleFor`/`planCellM` (slope foreshortening + azimuth-lattice), `snapPanelCenter`, `panelFitsAt`, `estimateMaxCapacityKwp`. | `Project,Roof,spec,FillOptions` → `PlacedPanel[]`/`FilledSegment` | **PURE** |
| `spacing.ts` | 49 | Inter-row shadow-free pitch + GCR from the winter-solstice sun window. `shadowFreePitchM`, `gcr`. | lat/lng/tilt → metres | **PURE** (imports `solar`) |
| `segment-ops.ts` | 606 | Parametric `ArraySegment` ops: `reindexSegment`, `growSegment`/`growCandidates`, `duplicateSegment`, `respaceSegment`, `setSegmentTilt/Racking/Azimuth/Profile/StructureFields`, `segmentFrameAngle` (the shared local frame). Collision-aware. | `Project,Roof,seg,panels` → `{segment,panels}` | **PURE** |
| `panel-move.ts` | 132 | Nudge/drag with two rules: segment moves whole; all-or-nothing validity. `movePanels`, `nudgeDelta`. | selection+dx/dy → `MoveResult` | **PURE** |

### Ground / structure / foundations
| Module | LOC | Purpose | In → Out | Purity |
|---|---|---|---|---|
| `ground.ts` | 55 | "What surface is under this point" — `resolveAnchorRoofId`, `groundHeightAt`, `obstructionBaseY` (heals stale anchors from position). | `XY,Roof[]` → height/id | **PURE** |
| `foundation.ts` | 208 | Foundation assemblies (pedestal/ballast/pile/anchor): geometry parts, `foundationVolumeM3`, `foundationDeadLoadKg`, height contract (D15), `foundationAssembly`, `foundationKindOfSpec`. **Sizes ASSUMED, never computed.** | `FoundationKind,shape` → `FoundationAssembly` | **PURE** |
| `structure.ts` | 1078 | **The parametric member/node graph** — BOM tonnage, fasteners, 3D render, previews all derive from it. `resolveRacking`, `buildStructure` (elevated table), `buildMonorail` (metal-shed rails), `topologyOf`, `allowedFoundations`, `projectStructures`, `fastenerTotals`, `validateStructure`. Deterministic structural ids, never persisted. **No wind/uplift/load calc (§F boundary).** | `Project`/seg → `SegmentStructure[]` | **PURE** |
| `structure-edit.ts` | 257 | On-object edit: one pure fn drives hover-ghost AND commit (`applyStructChoice`, `reconcileBridgedPanels`, `describeRacking`). | `Project,choice` → `StructPatch` | **PURE** |
| `structure-view.ts` | 191 | Pure view-state/editor-gating decisions (which panels ghost, which foundations offered). Explicitly outside React/three. | `Project,Roof,seg` → view state | **PURE** |
| `leg-plan-edit.ts` | 207 | Legs-2D editor decisions, all pure (keyboard==mouse patch): `buildableRegion`, `validateLegPoint`, `addLeg`/`removeLeg`/`moveLeg`, `autoSeedPoints`. Works in `segmentFrameAngle`. | seg/point → `LegPlanResult` | **PURE** |

### Physics / sun / drawings
| Module | LOC | Purpose | In → Out | Purity |
|---|---|---|---|---|
| `geo.ts` | 633 | **The pure geometry kernel.** Equirectangular projector (`makeProjector`), polygon math (area/centroid/inset/outset via `polygon-clipping`, union/difference/intersect, collinear overlap, SAT `rectsOverlap`), `rotate`, `rectCorners`, `validateRoofPolygon`, `dominantEdgeAngle`, `genId`. | `XY[]`/`LatLng` → geometry | **PURE** (one npm dep: `polygon-clipping`) |
| `sun.ts` | 90 | Astronomical core: `sunPosition` (NOAA-style), `solarHourDate` (TZ-independent from longitude), `sunriseSunset`. | Date,lat,lng → `SunPos` | **PURE** |
| `shading.ts` | 338 | **Sole shading authority** — headless per-panel raycasting vs `buildShadowCasters` over 288 sun samples/yr (12mo × daylight × 0.5h), 3 depth samples/panel. `computeSolarAccess`, `computePanelShadeDetail` (nearest-hit attribution), `accessChanged`. Carries a prominent "ENGINEER VALIDATION REQUIRED" banner + documented model limits (linear-in-area, no diode cliff, beam-only, bounding solids). | `Project` → `Map<id,access∈[0,1]>` | **three-math** (Raycaster, no WebGL) |
| `solar-heatmap.ts` | 330 | Roof-surface access heatmap: grid-samples each roof, raycasts vs same casters per month. `generateHeatGrid`, `computeHeatmap` (async, cancelable), `heatColor`. | `Project` → `HeatmapResult` | **three-math** |
| `routing.ts` | 530 | Cable routing = length you actually buy: corridor pathfinding around obstructions, home-runs, `autoRouteStrings`/`autoRouteAc`, `dcCableFromRoutes`. | `Project` → `CableRoute[]`/lengths | **PURE** |
| `dxf.ts` | 103 | Minimal AC1015 ASCII DXF writer (`DxfBuilder`) — no dep, true metres. | entities → DXF string | **PURE** |
| `export-dxf.ts` | 213 | Layout→DXF on named layers (roof/modules/obstructions/strings/cabling/structure) from canonical geometry. `layoutToDxf`. | `Project` → DXF string | **PURE** |
| `drawing-project.ts` | 106 | Member-graph → 2 drawing views: `isoProject` (30° iso), `elevationProject`, `fitToBox`, `projectMembers`. | `XYZ[]` → `Pt2`/`Seg2` | **PURE** |

### three/ layer (rendering — high level)
All are React/`@react-three/fiber` components except two helpers.
- `Scene3D.tsx` (63 KB, huge) — the R3F `<Canvas>` orchestrator; imports `useActiveProject`/`useProjectPatch` from the store; composes all instanced layers.
- `PanelsInstanced.tsx` (6.9 KB) — every panel in ≤3 instanced meshes; **reuses `panelInstanceMatrix` from `lib/scene-frame`** so the one-frame gate tests the identical composition. Solves the "500-panel = 1500 draw calls" problem.
- `StructureInstanced.tsx`, `StructureNodesInstanced.tsx` — instanced steel members/nodes from `SegmentStructure`.
- `ObstructionMesh.tsx` (24 KB) — GLB models (`@react-three/drei` `useGLTF`).
- `HeatmapLayer.tsx`, `StructEditPanel.tsx` (Html overlay), `LegPlanEditor.tsx` (2D SVG editor).
- `profile-geometry.ts` (three-math, extrudes steel section profiles), `textures.ts` (three materials).

### workers/
- `analysis.worker.ts` (1.7 KB) — hosts `computeSolarAccess` off-main-thread; stateless, `id`-tagged request/response, ignores stale replies. Driven by `lib/analysis-client.ts` (`new Worker(new URL(...))`, falls back to synchronous compute when no Worker).

---

## 2. THE CANONICAL PROJECT MODEL

**Defined in `types.ts` (1017 LOC), `interface Project` at line 919.** It is a single **plain-JSON-serializable** object — the "single source of engineering truth" (§A0). Top-level fields:

- **Identity/meta**: `id, createdAt, updatedAt, status, wizardStep, shareId, info: ProjectInfo`.
- **Site**: `location: SiteLocation | null` (holds `latLng`, weather, insights, calibration `northOffsetDeg`).
- **Geometry**: `roofs: Roof[]`, `obstructions: Obstruction[]`, `keepouts`, `walkways`, `rails`, `arresters`.
- **Array**: `components: Components` (panel/inverter/mppt/mlpe specs), `panels: PlacedPanel[]` (**the materialized source of truth**), `segments: ArraySegment[]` (parametric grouping layer *over* panels).
- **Electrical**: `strings`, `inverterPlacements`, `gridConnection?`, `cableRoutes?`.
- **Structure**: `structureDefaults?`, per-roof `Roof.structureOverride?`, per-segment `ArraySegment.racking`; `structuralVerification?` (human engineer sign-off gate — never a calculation).
- **Commercial/derived**: `pricing`, `bom?: BomState`, `derived: DerivedState`, `calibration`, `captures: ShadowCapture[]`, `insightState`, `installation?`, `designLog?`, image blob refs.

**Key modeling decisions relevant to the rebuild:**
- **Roof** (line 151): `polygon: XY[]` (local metres, CCW), `roofType: 'rcc_flat'|'metal_shed'|'tile'|'ground'` (the COVERING, not the pitch), `heightM` (eave), `pitchDeg`, `slopeAzimuthDeg`, `setbackM`/`perEdgeSetbacksM`, `parapet`, optional `faceGroupId` (links gable/hip/skeleton sibling faces). **A ground-mount array is just a `Roof` with `roofType:'ground'`, `heightM:0`** — deliberately so the whole roof pipeline runs unchanged.
- **Pitched roofs are modeled as N adjacent flat `Roof` faces**, NOT a nested faces field — so every engine (eave grouping, layout, casters, BOM) works per-`Roof` unchanged.
- **Panels are canonical; segments are a view over them.** `ArraySegment` carries `rows/cols/removed[]` (holes) + `racking: RackingSpec` with **lazy optional fields** that resolve at read time (`resolveRacking`) so untouched projects serialize byte-identically.

**Scene/model sync — two distinct mechanisms:**

1. **The "one-frame gate" (spatial correctness).** The model is the only truth; the scene is derived via `panelPose` → `panelInstanceMatrix` (`scene-frame.ts`). Because the renderer (`PanelsInstanced`) and the analytical footprint (`panelCornersOnRoof` in `layout.ts`) historically drifted (mirrored previews, floating foundations, lifted trees), the matrix was hoisted into `lib/scene-frame.ts` and **`one-frame.test.ts` (release gate §9.9)** asserts rendered plan corners == analytical corners == 2D-editor corners. `frame-parity.test.ts` covers the 2D↔analytical half. This is the "one frame": one matrix composition, three readers.

2. **The fingerprint recompute gate (freshness).** `fingerprints.ts` defines **5 strictly-nested fingerprints**: `siteFp ⊂ geometryFp ⊂ layoutFp ⊂ electricalFp ⊂ designFp`. Every derived artifact keys freshness on exactly one layer. `shadingFp` (= geometryFp + panel sample points, `SHADING_ENGINE_VERSION=6`) is the recompute key for solar access. `store/useDesignSync.ts` (mounted once) watches `shadingFp`, debounces, dispatches to the analysis worker, and stamps `project.derived.solarAccessFp` so consumers can show staleness badges. `model-version.test.ts` pins that a changed model invalidates the captures that depict it.

---

## 3. COUPLING MAP (portability to a shared isomorphic domain package)

**Verified by import grep across all `lib/*.ts`:**

| Coupling | Files | Notes |
|---|---|---|
| **imports `three`** | `scene-model.ts`, `scene-frame.ts`, `shading.ts`, `solar-heatmap.ts` | Uses three as **CPU math only** (Vector3, Matrix4, BufferGeometry, Raycaster). No WebGL/DOM. Runs in Node/worker today. |
| **imports React / @react-three** | **none** in target `lib/` | Fully clean. |
| **imports zustand/store** | **none** in target `lib/` (only unrelated `lib/units.ts` references store) | The domain layer never reaches into the store; the store calls into it. |
| **browser APIs (localStorage/IndexedDB/window/Worker)** | `analysis-client.ts` (`new Worker`, `window.setTimeout`, sync fallback), `dxf.ts` export path callers, `maps.ts`, `auto-design.ts`, `project-duplicate.ts` | None of these are core geometry; persistence lives in `lib/persistence/` (`repository.ts`, `blobs.ts` = IndexedDB), state in `store/store.tsx` (**React context + `useReducer`**, not zustand). |

**Portability verdict:**
- **Portable as-is (pure, zero-friction):** `geo`, `sun`, `spacing`, `roof-*` (factory/plane/topology/gable/hip/skeleton/face-group/colors), `skeleton-events`, `skeleton-wavefront`, `panel-pose`, `panel-move`, `layout`, `segment-ops`, `ground`, `foundation`, `structure`, `structure-edit/-view`, `leg-plan-edit`, `routing`, `dxf`, `export-dxf`, `drawing-project`, `fingerprints`. This is the bulk of the engineering IP and is **already an isomorphic domain package** in all but name. Only external dep: `polygon-clipping` (`geo.ts`) + `data/rules/india` (config).
- **Portable but drags in `three`:** `scene-model`, `scene-frame`, `shading`, `solar-heatmap`. **Extraction work = replace three's Vector3/Matrix4/Raycaster with a lightweight math + BVH raycaster** (e.g. `three-mesh-bvh` or a custom kernel) so the server domain package doesn't ship the full three bundle. `scene-model` returns `THREE.Group`/`Mesh` — its output type would need to become a neutral mesh/AABB struct for a headless server.
- **Not domain (stays client / rewrite for SaaS):** everything in `three/` (R3F rendering), `store/` (React context+reducer — replace with server state / per-tenant DB), `lib/persistence/` (IndexedDB → Postgres/S3), `workers/analysis.worker.ts` (browser worker → server job / queue), `analysis-client.ts`.

**One coupling smell to note:** `data/rules/india` (`resolveRules()`) is imported directly by `roof-factory`, `layout`, `structure`, `foundation`, `routing`, etc. as a **global singleton**. For multi-tenant SaaS this must become an **injected, per-tenant/per-jurisdiction rules context** rather than a module-level default, or geometry results won't vary by market.

---

## 4. GROUND-MOUNT & SCALE

**Ground mount — supported, but v1/flat only:**
- `makeGroundSurface` (`roof-factory.ts:165`) creates `roofType:'ground'`, `heightM:0`, parapet disabled, larger boundary setback (`groundSetbackM`). Comment is explicit: **"v1 assumes FLAT terrain: a slope would change row spacing, which is real math and is deferred rather than approximated."** No terrain/DEM, no slope, no grading.
- Ground gets latitude-optimal tilt (`groundTiltDeg`) instead of the 10° rooftop ballast compromise (`layout.ts:78`). Foundations for ground allow `['pile','concrete','ballast']` (`structure.ts:769`). Row pitch uses the same winter-solstice shadow-free solver (`spacing.ts`). So **fixed-tilt ground arrays work end-to-end**; **no single-axis/dual-axis trackers, no tracker geometry**.

**Roof types covered:** `rcc_flat` (elevated ballast/tilt tables), `metal_shed` (flush monorail on standoffs — `buildMonorail`), `tile` (flush, hook-through), `ground`. Pitched shapes: flat, gable (2), hip (4, rectangular only), straight-skeleton hip (convex + reflex L/U via wavefront; T/plus/cross refused by area-tiling gate).

**Hardcoded assumptions that break at C&I/MW scale:**
1. **Single local origin, equirectangular projection.** `geo.makeProjector` projects lat/lng around ONE origin with `cos(lat)` scaling — "accurate enough at roof scale." Over a MW site (km-scale) this accumulates distortion; there's no UTM/zoned projection and no multi-parcel/multi-building site concept beyond a flat list of `roofs[]`.
2. **Shading is O(panels²) with no spatial acceleration.** `computeSolarAccess` raycasts every panel (×3 depth samples) against **all** caster meshes (which now *include every panel as a slab*) over 288 sun samples. Worker header states cost **"grows with panel COUNT SQUARED"** and "On a 500-panel roof that is seconds of frozen UI on the main thread." No BVH, no spatial hashing, no LOD/tiling. This is the primary **performance cliff** at C&I→MW.
3. **Rendering scales with system size only up to instancing limits.** `PanelsInstanced` fixed the draw-call explosion (≤3 instanced meshes), but there's no chunking/frustum-tiling for tens of thousands of modules; `Scene3D.tsx` is a single 63 KB monolith.
4. **Whole-project structured-clone worker protocol.** The entire `Project` is cloned to the worker on each recompute — cost grows with project size; no incremental/dirty-region analysis (only fingerprint gating decides *whether* to run, not *how much*).
5. **In-browser per-project persistence.** `lib/persistence/repository.ts` = IndexedDB schema v2 (meta + per-project keys, debounced dirty-key writes, quota surfaced as status). No server DB, no concurrent multi-user, no tenant isolation — a full rewrite for SaaS.
6. **Global `resolveRules()` singleton** (India rules) baked into geometry — no per-tenant jurisdiction injection.
7. **Panel-count limits:** no explicit global cap; `FillOptions.maxPanels` is optional per-fill. `skeleton-wavefront` has `MAX_EVENTS=400` (roof complexity guard) and raycasters cap `far=250` m (breaks for very tall/distant casters at MW scale). `estimateMaxCapacityKwp` iterates all roofs fully each call.
8. **Explicit "no engineering" boundary (§F):** `structure.ts`/`foundation.ts` do **material estimation + visual modeling only — no wind/uplift/roof-strength/load calc**; sizes are ASSUMED from rule config and must stay labelled. `structuralVerification` is a human sign-off, not computed. `shading.ts` and `routing.ts` carry "ENGINEER VALIDATION REQUIRED" banners. At C&I/MW these become hard blockers requiring real structural + string-mismatch modeling.
9. **Shading model limits (documented in `shading.ts` header):** power linear in unshaded area (no bypass-diode cliff, no string mismatch → partial-shade losses OPTIMISTIC), 3 depth samples (~1/3-module resolution), 288 samples/yr quadrature, beam-only, obstructions as bounding solids, structure members excluded.

---

## 5. TESTS (`lib/__tests__/`, ~110 files)

Geometry/3D-relevant suites and what each pins down:

**Roof factories & skeleton**
- `roof-skeleton.test.ts` — straight-skeleton hip over convex footprints (21c); tiling.
- `roof-gable.test.ts` / `roof-hip.test.ts` — gable/hip factories + downstream pipeline; ridge-meet symmetry, rectangular-fill refusal.
- `roof-topology.test.ts` — shared edges, stacking, `pickRoofAt`, union area.
- `roof-face-group.test.ts` — "sibling faces stay one buildable roof (S5)": pitch/height propagate, azimuth doesn't.
- `roof-covering.test.ts` — `roofType` is the COVERING; a shape change (→gable) must not re-clad/re-price.
- `roof-edge-cases.test.ts` — adversarial footprints for the pitched engine.
- `skeleton-events.test.ts` / `skeleton-wavefront.test.ts` — event solver concurrency; wavefront area conservation (spikes, splits, survivors).
- `roof-pipeline.test.ts`, `roof-artifact.test.ts`, `roof-topology.test.ts`, `eave-ref-plane.test.ts`, `grouping-plane.test.ts` — eave-reference plane continuity across adjacent same-slope roofs; "what one roof means to the stringer."

**Frame parity / scene-model (the one-frame gate)**
- `one-frame.test.ts` — **release gate §9.9**: 2D editor, 3D scene (`panelPlanCorners`), and analytical (`panelCornersOnRoof`) coordinates agree, in plan, both directions; height checked separately.
- `frame-parity.test.ts` — 2D editor ↔ analytical model agreement (incl. rotated/tilted).
- `scene-model.test.ts` — shadow-caster construction, parapet bands, panel slabs.
- `model-version.test.ts` — a changed model invalidates captures depicting it.

**Layout / segments / placement**
- `layout.test.ts`, `segment-ops.test.ts`, `panel-move.test.ts`, `spacing.test.ts`, `segment-grid-pitched.test.ts` — fill, grow/duplicate/respace reindexing, all-or-nothing moves, shadow-free pitch, pitched-roof grid.
- `flat-azimuth-lattice.test.ts` + `azimuth-lattice-attacks.test.ts` — the azimuth-derived lattice for tilted fills on flat roofs (the "shingled 3D" field bug) + adversarial probes.
- `inset-fuzz.test.ts` — robust polygon inset fuzzing.

**Structure / foundation / ground**
- `structure.test.ts`, `structure-edit.test.ts`, `structure-view.test.ts`, `structure-parametrics.test.ts` (Phase 22g parametric), `structure-golden.test.ts` (member/node graph characterization snapshot), `live-structure-geometry.test.ts` (22k), `monorail.test.ts` (metal-shed), `leg-plan.test.ts`/`leg-plan-edit.test.ts` (persisted leg plan + editor keyboard==mouse).
- `foundations.test.ts` (geometry/volume/height-contract D15), `foundation-clamp.test.ts` (surface can't get a foundation it can't carry), `foundation-grounding.test.ts` (foundations SIT ON the roof), `ground-mount.test.ts` (ground array pipeline), `drc-structure.test.ts`.

**Physics / drawings**
- `shading.test.ts` (Phase 4 characterization), `shading-beam-availability.test.ts`, `row-shading.test.ts` (Tier-2 row spacing→shading→energy), `solar-heatmap.test.ts`, `sim-time.test.ts`, `poa.test.ts`, `solar.test.ts`.
- `routing.test.ts`, `dxf.test.ts`, `dxf-structure.test.ts` (structure reaches the DXF).
- `geo.test.ts`, `units.test.ts`/`units-roundtrip.test.ts`, `maps.test.ts`.

`__snapshots__/` holds golden snapshots (structure graph, BOM). Fixtures in `__tests__/fixtures/` (`project.ts`: `fixtureProject`, `fixtureRoof`).

Overall the test suite is **gate-oriented**: it pins the exact scene↔model↔analytical invariants and area-conservation properties that the geometry engine's correctness depends on — an asset for a rebuild, since these encode the hard-won constraints (frame parity, eave continuity, area tiling, byte-identical fingerprints).