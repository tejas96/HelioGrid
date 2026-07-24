# Scaling three.js Solar Studio: Rooftop → 100 MW (150k+ modules)

## Recommendation

**Refactor now around a hierarchical block/table/zone data model (the utility-scale paradigm), decouple the pure-TS compute engines from rendering, and make shading GPU-first. Do NOT try to make per-panel CPU raycast scale — it is architecturally the wrong abstraction above ~10k modules.** Concretely, build three things now so 100 MW never requires a rewrite: (1) a **layout data model** where the editable unit is a *tracker table / block / zone*, not a panel (panels are derived instances); (2) a **compute layer** of pure-TS kernels callable identically from a browser Web Worker pool and a Node worker-thread / server job, with `three-mesh-bvh` for the CPU shading path and a **GPU shadow-map sampling** path as primary; (3) a **rendering layer** using instanced meshes + LOD/chunking + a UTM/local-ENU coordinate origin per site (drop the single equirectangular origin). Adopt `WebGPURenderer` now (one-line swap, auto WebGL2 fallback). Defer: full terrain-following tracker physics, server GPU farm, and utility-grade electrical autorouting.

## Phased architecture

| Phase | Build now (no-rewrite foundations) | Defer |
|---|---|---|
| **Data model** | Blocks → tables (racks) → derived module instances; zones/keepouts as polygons; GCR/pitch as table params | Per-string electrical topology autorouting |
| **Compute** | Pure-TS kernels (geometry/shading/finance) in Worker pool; `three-mesh-bvh` CPU path; GPU shadow-map path | Server GPU job farm; distributed sharding |
| **Rendering** | InstancedMesh + LOD + spatial chunking; WebGPURenderer; UTM/ENU per-site origin (proj4js) | WebXR, photoreal PBR |
| **Terrain** | Copernicus GLO-30 DEM import, mesh ground | Terrain-following tracker articulation, cut/fill |
| **Tracker** | Fixed-tilt + single-axis geometry, backtracking angle from GCR | Rolling-terrain per-table backtracking |

## Evidence

**Per-panel editing does not scale — utility tools prove the block paradigm.** HelioScope's mechanical layout is *field segments* (auto-filled with modules) plus *keepouts*; its docs warn "too many design elements can cause issues with rendering design images or completing simulations" — i.e. even the incumbents impose design-size limits and abstract panels away ([HelioScope Mechanical Layout](https://help-center.helioscope.com/hc/en-us/articles/4419952640531-3-Mechanical-Layout)). PVcase is AutoCAD-based and generates terrain-contour-following table layouts; RatedPower is cloud, block-driven, producing layouts+LCOE "in minutes"; PVsyst does yield ([RatedPower vs PVcase](https://ratedpower.com/compare/pvcase/), [PVX comparison 2026](https://pvx.ai/blog/solar-design-software-comparison/)). None expose 150k independently-editable panels; the editable unit is the table/block.

**Shading: move off O(n²) CPU raycast to GPU shadow maps.** GPU shadow casting for solar potential is a mature, published technique — rasterizing scene depth to an off-screen render target per sun sample and testing panels against it is "relatively less computationally expensive than performing ray intersection tests," yielding large speedups ([Greater Geneva solar cadaster, Appl. Sci. 2020](https://doi.org/10.3390/app10155361); ["From video games to solar energy," Solar Energy](https://www.sciencedirect.com/science/article/abs/pii/S0038092X19309168)). With WebGPU now baseline, render 288 sun-sample depth maps and sample per-module in a compute pass. Keep `three-mesh-bvh` as the CPU/worker fallback and for precise near-field/rooftop obstruction raycasts — it delivers order-of-magnitude raycast gains (500 rays vs 80k polys @60fps), but note its caveats: center geometry (`BufferGeometry.center()`) to avoid float precision loss at km scale, and minimize geometry groups ([three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)). The float-precision caveat is exactly why the single equirectangular origin must go — use a per-site UTM/ENU origin.

**WebGPU is production-ready in mid-2026.** Baseline across Chrome/Edge/Firefox/Safari (Safari 26, Sept 2025), ~95% coverage with automatic WebGL2 fallback; three.js r171+ ships `WebGPURenderer` as a near one-line swap, 2–10× on complex scenes, plus TSL compute shaders for the GPGPU shading path ([three.js 2026](https://www.utsubo.com/blog/threejs-2026-what-changed), [WebGPU baseline 2026](https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default)). This makes the GPU compute path a safe *now* decision, not a bet.

**Terrain + trackers are domain-layer (TS) math, mostly deferrable.** Copernicus **GLO-30** (free, global 30 m, TanDEM-X-derived, on AWS Open Data / OpenTopography / Earth Engine) is the right India DEM baseline; SRTM 30 m is the fallback ([Copernicus DEM AWS](https://registry.opendata.aws/copernicus-dem/), [OpenTopography](https://portal.opentopography.org/raster?opentopoID=OTSDEM.032021.4326.3)). Single-axis backtracking (follow sun midday, flatten at low sun to avoid row shading; angle driven by GCR = module length / pitch) is a closed-form per-table calculation, not a rendering problem — implement it as a TS kernel mirroring pvlib; rolling-terrain per-table backtracking is a later refinement ([Sandia PVPMC](https://pvpmc.sandia.gov/modeling-guide/1-weather-design-inputs/array-orientation/single-axis-tracking/), [AIP JRSE 2024](https://pubs.aip.org/aip/jrse/article/16/2/023504/3280545)).

## Alternatives rejected

- **Scale per-panel CPU raycast with BVH only** — BVH removes the O(n²) but you still edit/store 150k objects and re-shade all of them; the incumbents don't, and rendering 150k selectable meshes stalls even instanced. Rejected as wrong abstraction.
- **Headless three.js on Node for giant server sims** — headless-gl/WebGL-in-Node is fragile and unmaintained for GPU work. Instead run the **same pure-TS kernels** in Node worker threads now; add Node/Deno **WebGPU compute** bindings when server jobs land. Keeps one codebase.
- **Rust/WASM shading kernel** — violates the "domain stays TS" constraint and forks the engine. Only justified if profiling later exposes a single hot inner loop; even then prefer a WASM leaf, not the domain.
- **Stay on WebGLRenderer** — leaves compute-shader shading and 2–10× perf on the table for no benefit given automatic fallback.

## Pricing

Compute stack is OSS (three.js, three-mesh-bvh, proj4js — MIT). DEM data (GLO-30, SRTM) is free. Costs are Fly.io compute for server jobs (Mumbai `bom` region, standard Fly Machines pricing — pay-per-second CPU/GPU) and object storage for DEM tiles; no per-seat SaaS licenses in this layer.

## Sources
- https://github.com/gkjohnson/three-mesh-bvh
- https://doi.org/10.3390/app10155361 · https://www.sciencedirect.com/science/article/abs/pii/S0038092X19309168
- https://ratedpower.com/compare/pvcase/ · https://pvx.ai/blog/solar-design-software-comparison/ · https://help-center.helioscope.com/hc/en-us/articles/4419952640531-3-Mechanical-Layout
- https://www.utsubo.com/blog/threejs-2026-what-changed · https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default
- https://registry.opendata.aws/copernicus-dem/ · https://portal.opentopography.org/raster?opentopoID=OTSDEM.032021.4326.3
- https://pvpmc.sandia.gov/modeling-guide/1-weather-design-inputs/array-orientation/single-axis-tracking/ · https://pubs.aip.org/aip/jrse/article/16/2/023504/3280545