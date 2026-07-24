# ADR-0014: Scale program — block/table/zone model, GPU shadow-map shading, per-site UTM/ENU origin

Status: Accepted
Date: 2026-07-24

## Context

The design range is 1 kW → 100 MW (~150k+ modules). The POC studio's weak points at scale are known from the geometry audit: single-origin equirectangular projection, O(n²) CPU shading that grows with panel count squared, no spatial index, per-panel editing. Utility-scale incumbents (HelioScope field segments, PVcase, RatedPower) all abstract panels away — none exposes 150k independently editable panels.

## Decision

Build the no-rewrite foundations now, as investment INTO the studio (ADR-0017), never as a reason to cut rooftop capability:

1. **Data model**: above rooftop scale the editable unit is the **block / table (rack) / zone** — panels are derived instances; zones/keepouts are polygons; GCR/pitch are table parameters. This coexists with the per-panel rooftop model.
2. **Compute**: pure-TS kernels callable identically from a browser Web Worker pool AND Node `worker_threads` (server jobs for giant sims) — one codebase, no forked engine.
3. **Shading**: **GPU shadow-map sampling is primary** (three.js `WebGPURenderer`, WebGPU baseline in 2026 with automatic WebGL2 fallback; ~288 sun-sample depth maps sampled per module in a compute pass). **three-mesh-bvh** stays as the CPU/worker fallback and for precise near-field rooftop obstruction raycasts — with geometry centred (`BufferGeometry.center()`) to avoid float-precision loss at km scale.
4. **Coordinates**: **per-site UTM/ENU origin via proj4js**, replacing the single equirectangular origin — the float-precision caveat above is exactly why.
5. **Trackers**: single-axis geometry + closed-form GCR backtracking as a TS kernel mirroring pvlib.
6. **Terrain**: Copernicus GLO-30 DEM import (free, global 30 m; SRTM fallback), meshed ground.

**Deferred** (explicitly, with reasons in 11-scale-program.md): terrain-following tracker articulation, server GPU farm, utility-grade electrical autorouting, Rust/WASM kernels.

## Consequences

- 100 MW never requires a rewrite; the rooftop studio keeps its per-panel fidelity.
- Two layout paradigms (per-panel + block/table) must stay coherent in one canonical `Project` model — the one-frame gate and fingerprint recompute graph extend to cover both.
- GPU-first shading introduces a WebGPU/WebGL2 dual path to keep correct; the CPU BVH path doubles as the correctness oracle.
- Server-side giant sims run the TS kernels on CPU worker threads for now — slower than a GPU farm, but one codebase; Node WebGPU bindings are the future upgrade, not headless-gl.

## Alternatives rejected

- **Scaling per-panel CPU raycast (BVH only)** — removes O(n²) but still edits/stores/re-shades 150k objects; the incumbents prove the abstraction is wrong above ~10k modules; 150k selectable meshes stall rendering even instanced.
- **Headless three.js on Node (headless-gl)** — fragile and unmaintained for GPU work; same-kernel-on-CPU now, Node WebGPU later.
- **Rust/WASM shading kernel** — violates the TS-domain rule and forks the engine; only ever justified as a profiled leaf, never the domain.
- **Staying on WebGLRenderer** — leaves compute-shader shading and 2–10x on the table for no benefit given automatic fallback.

## Sources

- `../research/scale3d.md` · `../research/geo3d.md` (POC scale-cliff audit)
- https://github.com/gkjohnson/three-mesh-bvh · https://doi.org/10.3390/app10155361 · https://www.sciencedirect.com/science/article/abs/pii/S0038092X19309168
- https://help-center.helioscope.com/hc/en-us/articles/4419952640531-3-Mechanical-Layout · https://ratedpower.com/compare/pvcase/
- https://www.utsubo.com/blog/threejs-2026-what-changed · https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default
- https://registry.opendata.aws/copernicus-dem/ · https://pvpmc.sandia.gov/modeling-guide/1-weather-design-inputs/array-orientation/single-axis-tracking/
