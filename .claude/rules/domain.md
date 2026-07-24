# Rules — packages/domain (the engineering moat)

The ported Solar Studio engines. Pure, isomorphic TypeScript. This package is why the
product exists; treat it with corresponding care.

## Purity contract (enforced by dependency-cruiser)
- Imports allowed: other domain modules, `polygon-clipping`, `three` (math only — Vector3/
  Matrix4/Raycaster/BufferGeometry; NEVER WebGL, DOM, loaders), `proj4`.
- Imports forbidden: NestJS, React, zustand, fetch/axios, localStorage/IndexedDB, process.env,
  `packages/db`, `packages/contracts`. Domain functions are `f(input, context) → output`.
- All market/tenant variability is an injected `RulesContext` / `CatalogContext` parameter.
  The POC's `resolveRules()` / `resolveCatalog()` global singletons DO NOT survive the port —
  every former call site takes the context as an argument.

## Porting discipline (from /Volumes/works-space/Solar-App-POC/src/features/solar-studio)
- Port modules with their tests. A module is ported when its POC tests pass unmodified
  (except import paths and context injection).
- Do not "improve" algorithms during the port. Port → verify → then improve in a separate
  change with its own verification. Golden-file tests (structure graph, BOM) pin behavior.
- The one-frame gate (`one-frame.test.ts`, `frame-parity.test.ts`) is a release gate:
  renderer matrix == analytical corners == 2D editor. It must exist and pass from the
  first studio render onward.
- Keep the 5-layer fingerprint graph (`siteFp ⊂ geometryFp ⊂ layoutFp ⊂ electricalFp ⊂
  designFp`) + `shadingFp` exactly as designed — staleness UX depends on it.
- Provenance tiers (measured/derived/estimated/assumed) are typed enums on outputs, not
  strings. `bomConfidence` semantics (worst-tier-wins, override=measured) are locked.

## Scale rules (1 kW → 100 MW)
- New geometry accepts a per-site projection context (UTM/ENU origin via proj4) — never
  assume the equirectangular single-origin projector.
- Above-rooftop layouts model blocks → tables → derived module instances. Per-panel arrays
  remain for rooftop. Both feed the same electrical/BOM/energy engines.
- Compute kernels must run identically in a browser Worker and a Node worker_thread —
  no `window`, no `document`, message-passing contracts defined in `packages/contracts`.
- Shading: three-mesh-bvh for CPU path; center geometry before building BVH (float
  precision at km scale). GPU shadow-map path lives in the web app, not in domain.

## Engineering honesty (never weaken)
- No wind/uplift/roof-capacity computation, ever. Structure output = material estimate +
  visual model; `STRUCTURE_DISCLAIMER` travels with every structure-bearing output.
- Empty string window (min>max) is an explicit fault, never silently inverted.
- PVGIS is the sole energy source of record; the built-in estimate is a labelled fallback.
  Google Solar data never feeds energy math.
