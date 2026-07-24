# 11 — Scale Program: 1 kW → 100 MW

Binding plan for taking the studio from residential rooftop to utility scale without a
rewrite. The 3D Design Studio is the flagship; every phase here is investment INTO the
studio moat, never a reason to cut studio capability (BLUEPRINT directive 8/9). Sources:
[./research/scale3d.md](./research/scale3d.md) (scaling research, July-2026-verified) and
[./research/geo3d.md](./research/geo3d.md) §4 (POC scale audit).

**The one structural decision that makes 100 MW possible:** above rooftop scale the
editable unit is the **block / table / zone — never the panel**. Panels become derived
instances of a table. This is the industry paradigm — HelioScope edits field segments,
PVcase and RatedPower edit tables and blocks; none exposes 150k independently editable
panels ([HelioScope Mechanical Layout](https://help-center.helioscope.com/hc/en-us/articles/4419952640531-3-Mechanical-Layout),
[RatedPower vs PVcase](https://ratedpower.com/compare/pvcase/)). Scaling per-panel CPU
raycast with a BVH alone was evaluated and rejected: it removes the O(n²) but still
stores, edits and re-shades 150k objects — wrong abstraction, not a performance bug
(./research/scale3d.md, "Alternatives rejected").

---

## 1. The three scale regimes

| Regime | Range | Editable unit | Model | Shading path | Ground |
|---|---|---|---|---|---|
| **Rooftop** | 1 kW – 500 kW (≤ ~1,100 modules) | Panel (+ `ArraySegment` grouping) | POC `Project` model ported as-is: `panels: PlacedPanel[]` canonical, segments as a view | CPU raycast + three-mesh-bvh in browser Worker pool | Flat plane (POC v1 behaviour retained) |
| **Large C&I** | 0.5 – 10 MW (≤ ~20k modules) | Block → table (rack); panels are derived instances | `blocks[]`/`tables[]` in the same `Project` payload; per-panel array not materialised | GPU shadow-map (WebGPU compute; WebGL2 fallback); server job for batch | Flat or gently graded pad; DEM optional |
| **Utility** | 10 – 100 MW (≤ ~175k modules) | Zone → block → tracker table | Zones/keepouts as polygons; GCR/pitch as table parameters; block-level electrical | GPU in-browser for interaction; server-side full annual sim as BullMQ job | GLO-30 DEM mesh ground, terrain-aware row spacing |

Regime is a property of the design, not the tenant: a 100 kW rooftop and a 40 MW park can
coexist in one tenant. The studio switches editing paradigm at the block boundary — a
design with `blocks.length > 0` presents block/table tools; pure-rooftop designs keep the
full per-panel tool census (phases710.md §2, screens 10.1–10.11 — every tool survives).

---

## 2. The five documented POC cliffs and where each dies

All five are documented in [./research/geo3d.md](./research/geo3d.md) §4. Each is fixed
in exactly one phase; nothing waits for a rewrite.

| # | Cliff (POC evidence) | Symptom at scale | Fixed in |
|---|---|---|---|
| 1 | **O(n²) shading.** `computeSolarAccess` raycasts every panel (×3 depth samples) against ALL caster meshes — which include every panel as a slab — over 288 sun samples. Worker header: cost "grows with panel COUNT SQUARED"; 500 panels = seconds of frozen UI | Minutes-to-hours at C&I; impossible at utility | **A** mitigates (BVH cuts per-ray cost ~10×); **B** eliminates (GPU shadow maps are O(n) per sun sample) |
| 2 | **Single equirectangular origin.** `geo.makeProjector` projects lat/lng around ONE origin with `cos(lat)` scaling — "accurate enough at roof scale"; no UTM, no multi-parcel site concept | Metre-level distortion + float-precision jitter across a km-scale site; three-mesh-bvh explicitly requires centred geometry to avoid float loss | **A** (per-site `ProjectionContext`, introduced at port time — cheapest moment, every coordinate consumer is being touched anyway) |
| 3 | **Whole-project structured-clone worker protocol.** Entire `Project` cloned to the worker per recompute; fingerprints gate *whether* to run, never *how much* | Clone cost grows with project size; one giant job blocks the pool | **A** (worker-pool chunking: caster set serialised once per `shadingFp` epoch, panel/table sample batches dispatched as chunks) |
| 4 | **No spatial index.** No BVH, no spatial hashing, no LOD/tiling; raycaster `far=250 m` cap breaks for tall/distant casters | Every ray tests every triangle; picking and near-field checks stall | **A** (three-mesh-bvh into the ported shading + picking paths) |
| 5 | **Flat-terrain ground mount.** `makeGroundSurface` comment: "v1 assumes FLAT terrain: a slope would change row spacing, which is real math and is deferred rather than approximated" | Utility sites are not flat; row spacing and yield are wrong on slopes | **C** (GLO-30 DEM import, mesh ground, terrain-aware row spacing) |

Two POC guards are kept verbatim through all phases: the **5-layer fingerprint graph**
(`siteFp ⊂ geometryFp ⊂ layoutFp ⊂ electricalFp ⊂ designFp`, with `shadingFp` keyed on
geometry + sample points) still decides *whether* anything recomputes, and the **one-frame
gate** still asserts rendered corners == analytical corners == 2D-editor corners — extended
to table instances in Phase B. `SHADING_ENGINE_VERSION` bumps at every phase boundary that
changes numeric results, invalidating stale solar-access data by construction.

---

## 3. Phase A — the studio phase (part of the studio port; not optional)

Phase A ships with the studio phase (docs/14 §3a — the studio port and offline are the LAST
build phases per owner directive 2026-07-24 rev 2; a thin kernel subset incl. the default
ProjectionContext already lands in Launch-1 W3 for remote survey) alongside the domain port
(docs/05-domain-migration.md), but its
items are NOT all "during the port". They split three ways: **at port time** —
`ProjectionContext` context injection with the default equirect implementation (A3) and
the blocks/tables schema (A4); **immediately post-port** — three-mesh-bvh integration and
`far=250` m cap removal (A1) plus worker-pool chunking (A2), landed as separate
golden-verified changes AFTER the port batches complete; **Phase B, not A** — GPU
shadow-map shading and the neutral mesh/AABB structs.

**A1. three-mesh-bvh into the ported shading and raycast paths — immediately post-port.**
three-as-math is RETAINED through the v1 port (docs/05-domain-migration.md §4);
`scene-model`/`scene-frame`/`shading`/`solar-heatmap` keep importing `three` as CPU maths,
and the neutral mesh/AABB structs move to Phase B. three-mesh-bvh integration and removal
of the `far=250` m cap land **immediately after the port batches complete**,
as a separate golden-verified change — part of Phase A, but NOT "during the port"
(order-of-magnitude raycast gains — 500 rays vs 80k polys at 60 fps,
[github.com/gkjohnson/three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)).
Its two documented caveats are handled structurally: geometry is centred (see A3) and
caster meshes are emitted with minimal geometry groups. With the BVH in place an
unbounded far plane is affordable, so the `far=250` m cap is removed in the same change.

**A2. Worker-pool chunking.**
Replace the single analysis worker + whole-`Project` clone with a pool
(`navigator.hardwareConcurrency − 1`, cap 6). Protocol: the caster BVH is built once per
`shadingFp` epoch and shared via transferable ArrayBuffer; panel sample batches (~256
samples/chunk) are dispatched round-robin; results stream back per chunk so the heatmap
paints progressively. The identical chunk protocol runs server-side in Phase B — the pool
abstraction is written once in `packages/domain` with an injected executor.

**A3. Per-site `ProjectionContext` — context injection at port time, default equirect.**
`ProjectionContext` is introduced AT PORT TIME as an injected parameter of every geometry
kernel — same pattern as the `resolveRules()` global being killed (BLUEPRINT monorepo
section). Its **default implementation is the existing equirectangular projector**
(`makeProjector`), which keeps ported POC tests byte-identical. A UTM/ENU implementation
(proj4js: WGS84 → UTM zone of the site centroid, then a local ENU offset so all working
coordinates sit near the origin — float precision + BVH requirement) ships alongside
behind the same interface and is **selected for ground-mount/large sites**.

**A4. Blocks/tables in the schema from day one.**
The canonical `Project` payload (JSONB, docs/04-data-model.md) and the Zod contract carry
`blocks: Block[]` and `tables: TrackerTable[]` from the first migration — empty arrays for
every rooftop design. `Block` = polygon zone + electrical assignment + table parameters
(tilt or tracker axis, GCR, pitch, module orientation, edge setbacks); `TrackerTable` =
placed rack instance (origin, azimuth, rows × modules, removed[]). Panels above rooftop
scale are **derived instances, never persisted**. Zero-migration path to Phases B and C;
no schema change ever needed to unlock them.

Phase A exit: a 1,000-panel rooftop full shading recompute completes in ≤ 5 s on a 2023
mid-range laptop, UI never blocks, ported domain tests stay byte-identical under the
default equirect `ProjectionContext`, and the post-port BVH + far-cap-removal change is
golden-verified.

---

## 4. Phase B — Large C&I (0.5–10 MW)

**B1. Block/table editing UX.**
Draw a zone polygon → auto-fill with tables (the POC `layout.ts` fill engine generalises:
it already fills polygons with rows under setbacks and pitch from `spacing.ts`) → drag/
rotate/split blocks, per-block GCR and tilt, per-table delete/nudge, keepout subtraction.
On-object direct manipulation, touch-first, 375 px works (design-system DoD unchanged).
Per-panel editing remains available *inside* a table (remove-map, the POC `removed[]`
pattern) so no census tool is lost — it is scoped, not deleted.

**B2. GPU shadow-map shading — the primary path.**
The published solar-cadaster technique: render scene depth from the sun for each of the
288 annual sun samples into an off-screen depth target, then test every module sample
point against the depth maps in a compute pass — "relatively less computationally
expensive than performing ray intersection tests"
([Appl. Sci. 2020, Geneva solar cadaster](https://doi.org/10.3390/app10155361);
["From video games to solar energy", Solar Energy](https://www.sciencedirect.com/science/article/abs/pii/S0038092X19309168)).
Implementation: three.js `WebGPURenderer` (r171+, near one-line swap, automatic WebGL2
fallback, 2–10× on complex scenes; WebGPU is baseline across Chrome/Edge/Firefox/Safari
in 2026 — ./research/scale3d.md "WebGPU is production-ready") with TSL compute for the
sampling pass. WebGL2 fallback renders the same depth maps and samples via fragment
shader read-back. The CPU BVH path from Phase A is retained permanently as: (a) fallback
for GPU-less clients, (b) the precise near-field path for rooftop obstruction raycasts,
(c) the server-side reference implementation. GPU and CPU paths are pinned against each
other by a tolerance test (±2% annual solar access on a golden C&I scene) — one
`SHADING_ENGINE_VERSION`, two executors.

**B3. Server-side simulation jobs.**
The same pure-TS kernels run in `apps/worker` (NestJS standalone) under `worker_threads`,
dispatched via BullMQ on dedicated autostop-off machines (BLUEPRINT jobs section). Job
protocol = the Phase A chunk protocol verbatim. Triggers: design exceeds the in-browser
budget, user requests a batch (multi-variant compare), or proposal issue requires a fresh
full-resolution run. Results land in the design payload with `solarAccessFp` stamped;
SSE pushes the staleness-cleared event. Headless-GL/three-in-Node is rejected — fragile
and unmaintained for GPU work (./research/scale3d.md); server stays CPU-kernel until the
GPU-farm trigger fires (§6).

**B4. Instanced rendering + LOD/chunking budgets.**
Module instances render via `InstancedMesh` per block, chunked on a ~50 m grid for
frustum culling; LOD ladder: full module mesh (< 150 m), flat quad + texture (150–600 m),
per-table merged slab (> 600 m). Selection at table granularity via block-level BVH.
Draw-call budget ≤ 300; the 63 KB `Scene3D.tsx` monolith does not survive the port —
scene composition splits per layer (ground, roofs, blocks, electrical, annotations).

---

## 5. Phase C — Utility (10–100 MW)

**C1. Single-axis trackers.**
`TrackerTable` gains `axisAzimuthDeg`, `maxRotationDeg` (±52.5° default), `gcr`.
Rotation kernel is the **closed-form GCR backtracking** calculation mirroring pvlib's
`tracking.singleaxis` ([Sandia PVPMC, single-axis tracking](https://pvpmc.sandia.gov/modeling-guide/1-weather-design-inputs/array-orientation/single-axis-tracking/)):
true-tracking angle from solar vector, backtracking correction from GCR so rows never
self-shade at low sun. Pure TS kernel in `packages/domain`, validated against pvlib
reference vectors (golden-file test, travels with the ported suite). Shading integrates
per sun sample with the tracker angle applied — the 288-sample quadrature and the GPU
depth-map path are unchanged, only instance matrices move.

**C2. Terrain: GLO-30 DEM import + mesh ground.**
Copernicus **GLO-30** (free, global 30 m, TanDEM-X-derived) is the India baseline; SRTM
30 m fallback ([registry.opendata.aws/copernicus-dem](https://registry.opendata.aws/copernicus-dem/),
[OpenTopography GLO-30](https://portal.opentopography.org/raster?opentopoID=OTSDEM.032021.4326.3)).
Tiles fetched through the server proxy (SSRF-guarded, per-tenant metered — the POC
geotiff-relay pattern), cached in Tigris, draped as a mesh ground in the site
`ProjectionContext`. Tables sit on the DEM surface (per-table elevation + plane fit);
`heightM:0` flat ground remains the default when no DEM is loaded.

**C3. Terrain-aware row spacing.**
`spacing.ts`'s winter-solstice shadow-free solver generalises to sloped ground: pitch per
block computed from the block's fitted plane (N–S grade changes the shadow-free distance).
This closes cliff 5 exactly where the POC comment deferred it — "real math", now done, at
block granularity. Cross-slope (E–W grade) affects tracker articulation and stays
deferred (§6).

**C4. Block-level electrical.**
The POC already ships the C&I combiner architecture — `lib/electrical/combiner.ts`
`combinerPlan()`: balanced fused SCBs, `maxStringsPerBox(12)`, per-string gPV fuses,
`outputCurrentA = ΣIsc × 1.25`, and a reconciliation gate (Σ inputs === totalStrings)
(./research/calc.md). **Extend, don't replace**: add the inverter-block tier above it —
central-inverter blocks (string inverters remain for ≤ 10 MW distributed designs), SCB →
inverter-block assignment per zone, MV collection stubbed as a labelled assumption (no MV
engineering claim — see §8). Autostring, IEC 62548 ladders and the electrical gate run
per block; the reconciliation gate now also asserts Σ blocks === project total.

**C5. DXF/permit outputs at scale.**
The pure DXF emitters (`dxf.ts`/`export-dxf.ts`, already portable per geo3d.md §3) gain
block-level layout sheets: zone plan, table rows with pitch dimensions, per-block
electrical single-line, DEM contour underlay. Emission runs as a worker job (same BullMQ
path as PDF render) — a 100 MW DXF is not a browser task. Provenance tiers print on every
sheet, unchanged.

---

## 6. Explicit deferrals — with re-evaluation triggers

| Deferred | Why | Re-evaluate when |
|---|---|---|
| **Terrain-following tracker articulation** (per-table rolling-terrain backtracking, cut/fill) | Closed-form GCR backtracking covers flat and uniform-grade sites; rolling-terrain per-table optimisation is a research-grade refinement ([AIP JRSE 2024](https://pubs.aip.org/aip/jrse/article/16/2/023504/3280545)) | A won utility deal has > 3° cross-slope variation within single blocks, or ≥ 2 tenants lose bids citing terrain articulation |
| **Server GPU farm** (Node/Deno WebGPU compute for server jobs) | CPU TS kernels in worker_threads keep one codebase; headless-GL is a dead end | p95 server sim job > 15 min at 100 MW resolution, or server sim volume > 200 jobs/day |
| **Rust/WASM shading kernel** | Violates the TS-domain rule; forks the engine | Only if profiling after BVH + GPU still shows one hot inner loop — and then as a WASM leaf behind the same kernel interface, never the domain |
| **Utility-grade electrical autorouting** (MV collection, cable trenching optimisation) | Block-level SLD + labelled assumptions serve proposals; autorouting is detailed-engineering territory | Tenants demand IFC-grade deliverables (post-sale engineering product decision, not a studio patch) |
| **WebXR / photoreal PBR** | Zero sales evidence | Never, absent a paying driver |

---

## 7. Performance budgets per regime

Measured on the reference devices: mid-range 2023 Android (studio at 375 px via WebView)
and 2023 mid-range laptop (Chrome, integrated GPU). Budgets are release criteria for the
phase that claims the regime — a phase does not ship over budget.

| Budget | Rooftop (≤ 1.1k modules) | Large C&I (≤ 20k modules) | Utility (≤ 175k modules) |
|---|---|---|---|
| Module count ceiling | ~1,100 (500 kW @ 450 W) | ~20,000 (10 MW @ 500 W) | ~175,000 (100 MW @ 575 W) |
| Full shading recompute — in-browser | ≤ 5 s (CPU BVH pool) | ≤ 30 s (GPU); ≤ 4 min (CPU fallback) | ≤ 90 s (GPU, block-sampled) |
| Full shading recompute — server job | n/a (browser-only) | ≤ 2 min | ≤ 10 min p95 |
| Incremental edit → heatmap first paint | ≤ 1 s | ≤ 3 s (dirty blocks only) | ≤ 5 s (dirty blocks only) |
| Viewport FPS while orbiting | 60 desktop / ≥ 30 mobile | ≥ 30 both | ≥ 30 desktop; mobile ≥ 24, view-prioritised |
| Draw calls | ≤ 100 | ≤ 300 | ≤ 300 (LOD ladder enforced) |
| Tab memory (JS heap + GPU) | ≤ 500 MB | ≤ 1.5 GB | ≤ 2.5 GB desktop; mobile loads LOD-reduced scene |
| Design payload size (JSONB) | ≤ 2 MB | ≤ 5 MB (panels derived, not stored) | ≤ 15 MB |

The block/table model is what keeps the utility column honest: 175k modules is ~4,000
tables — the persisted and edited object count stays in the thousands at every regime.

---

## 8. The honesty rule at scale

Scale changes resolution, never honesty (CLAUDE.md "Money & honesty" — product law).

- **Provenance tiers go block-level, not away.** Above rooftop scale, yield, shading and
  BOM quantities are computed at block/table granularity; every such number carries its
  tier (measured / derived / estimated / assumed) and a block aggregate inherits the
  weakest tier of its members. A DEM-draped ground is `derived` (30 m public DEM), never
  `measured`.
- **The shading model's documented limits stay printed.** Beam-only, linear-in-unshaded-
  area, no bypass-diode cliff, no string mismatch — partial-shade losses read OPTIMISTIC
  at 1 kW and at 100 MW alike. GPU acceleration changes speed, not the physics claims.
- **Structural adequacy is never computed — at any scale.** Tracker foundations, pile
  embedment and wind loading on a 100 MW park are engineer-led exactly as a 3 kW rooftop
  is; `structuralVerification` remains a recorded human sign-off (who + when), and the
  disclaimer travels with every structure-bearing output, including block-level DXF sheets
  and MV assumptions (§5 C4).
- **Money never renders while stale — and long recomputes make this bite.** A utility
  recompute can take minutes as a server job; for that entire window the quote and BOM
  render as provisional (fingerprint mismatch), and proposal issue is blocked until
  `solarAccessFp` and the money path reconcile. No express lane at scale.
