# MS6 · Studio Step 6 — Editor (panel layout · 3D scene · structures)

Status: draft · Origin mix: SRC-CODE-dominant + BRIEF (Sitting 5 rulings, 2026-08-05) · Depends on: MS1 (canvas/worker contract), MS2 (roofs, segment-engine laws, face groups), MS3 (obstructions/bridging), MS4 (module, target, inverter, profiles catalog), F1/F4/F7/F8, Q28
Sources: POC code inventory — layout (93), scene3d (50), structures (72) = **215 keys**; all area tests pass · sitting rulings (S5-1…S5-5.8) · census A.10-6 (66) + A.10-7 (43). The ledger index is retired; the POC repository named in `docs/build-order.md` is the source, and the sitting rulings are carried by the rows below.
Forward: MS8 (electrical/SLD consumes strings, routes, inverter placements) · MS10 (BOM consumes structure/fasteners/foundations + panel counts) · MS7 (captures, review) · customer share surface (F5/Q27).

## 1. Purpose & scope

Step 6 is where the design becomes real: modules placed and grouped into tables, safety elements drawn, strings wired, the mounting structure parameterised down to fasteners, and the whole thing inspected in a 3D scene with a physically-simulated sun. It carries the studio's two hardest honesty duties — **one shading authority** (renderer and engine share geometry and results) and **structure is an estimate needing an engineer** (F8-25).

## 2. Personas & surfaces

Design Engineer (author) · Design Engineer with sign-off capability (review) · Sales Executive (read/3D walkthrough). Web primary; mobile full parity (F7-30/32) with the S5-3 visible 3D controls.

## 3. Feature areas

### MS6.1 — Arrival & automatic design

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS6-01 | Arriving with roofs but no panels offers auto-place ONCE: "Auto-fill panels" (to the target capacity) or "Use max roof capacity", with "Place manually" always available (`layout.1–.3`). | `SRC-CODE` | P0 |
| MS6-02 | Auto-place replaces panels+segments in ONE undo step, clears strings, stores a decision log, and flashes each warning (`layout.4`). | `SRC-CODE` | P0 |
| MS6-03 | Roof ranking is MEASURED, not assumed: sampled probe panels through the real raycast shading engine × orientation factor — the ranking, per-roof access %, row spacing and every choice are recorded in the decision log (`layout.5/.6`). | `SRC-CODE` | P0 |
| MS6-04 | Fill engine laws: per-edge setback inset (multi-region safe), obstruction buffers honouring bridging capability, roof-type default poses, winter-solstice shadow-free row pitch with expert override, canonical plan footprint shared by placement/DRC/render/DXF/SLD, grid snapping anchored to existing panels, candidate validated at its ACTUAL pose (`layout.7–.14`). | `SRC-CODE` | P0 |
| MS6-05 | "Why this layout?" sheet renders the decision log verbatim plus Copilot suggestions — each card now offering **Accept** (applies, one undo step) and **Dismiss** (per-design, reversible) (S5-4 fixes `layout.18`). | `SRC-CODE` + `BRIEF` S5-4 | P0 |

### MS6.2 — Tools & drawing

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS6-06 | Tool rail in four labelled groups (View / Build / Safety / Electrical), every button labelled and stateful; electrical buttons carry live COUNT badges (S5-5.2 fixes `layout.29`); re-tapping the active tool returns to Select (`layout.15/.20/.29`). | `SRC-CODE` + `BRIEF` S5-5.2 | P0 |
| MS6-07 | Panels tool: tap places one snapped module; drag fills a rectangle as a collision-aware TABLE avoiding existing panels, keep-outs and obstruction buffers (`layout.21/.22`). | `SRC-CODE` | P0 |
| MS6-08 | Erase tool with a shared priority resolver (panel → arrester → inverter → rail → walkway → keepout) so what you tap is what you erase (`layout.23`). | `SRC-CODE` | P0 |
| MS6-09 | Safety & service elements: walkways (width presets + custom), no-build zones, safety rails, lightning arresters, wall-mounted inverters/meters — each with live true-width preview and off-roof fallback rules (`layout.24–.28/.41/.85`). | `SRC-CODE` | P0 |
| MS6-10 | Views: irradiance heatmap (same engine as 3D, fingerprint-cached, cancellable) and string overlay, both toggleable; heatmap-off RESTORES the previous view state (S5-5.7) (`layout.16/.17/.93`). | `SRC-CODE` + `BRIEF` S5-5.7 | P0 |
| MS6-11 | Measure tool and per-tool instruction hints; transient notices with accessible roles; banner stacking never covers the rails (`layout.19/.82–.84`). | `SRC-CODE` | P1 |

### MS6.3 — Selection & direct manipulation

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS6-12 | Tap-select, marquee selection, and panel drag-move with table-aware rules (a touched table moves whole, its polygon travels) (`layout.35–.38`). | `SRC-CODE` | P0 |
| MS6-13 | Keyboard nudges (0.1 m / 0.5 m) with touch-equivalent controls per the studio touch law; cable-route waypoint editing with grab tolerance (`layout.39/.40`). | `SRC-CODE` + `BRIEF` S2-1 law | P0 |
| MS6-14 | Selection context bar at constant screen size with count: Group · quick grow (+Row/+Col) · grow popover (axis, count, side) · Rotate ±90° · Tilt ±5° · Table settings · Enable/Disable · Delete · Clear (`layout.42–.51`). | `SRC-CODE` | P0 |
| MS6-15 | Rotate updates the panels AND the owning table's azimuth so the table settings never disagree with the layout (S5-5.1 fixes `layout.46`). | `BRIEF` S5-5.1 | P0 |
| MS6-16 | Tilt partitions the selection so each represented table tilts as a unit; enable/disable keeps panels placed but non-producing with clear labels (`layout.47/.49`). | `SRC-CODE` | P0 |
| MS6-17 | Delete cascades through segments/strings/routes with reindexing; lock discipline dims and refuses edit actions; layout lock persists per the studio lock law (S3-5.3 family) (`layout.50/.52/.53`). | `SRC-CODE` | P0 |
| MS6-18 | Undo/redo buttons + shortcuts; one gesture = one entry; Clear-all-panels asks for confirmation with counts (`layout.54/.55`). | `SRC-CODE` | P0 |

### MS6.4 — Table settings & structure choices

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS6-19 | Table header states label · rows×cols · panel count · kWp; presets Flush / Standard tilt / Walk-under with live section previews; ground surfaces swap presets for foundation choices (`layout.56–.58`). | `SRC-CODE` | P0 |
| MS6-20 | Racking (flush / fixed tilt / dual tilt), tilt stepper+slider, azimuth stepper with a HEMISPHERE-AWARE "face the equator" preset (S2-5.5 law extends here, fixing `layout.62`), inter-row shading card with the recommended winter-shadow-free pitch (`layout.59–.62`). | `SRC-CODE` + `BRIEF` S2-5.5 | P0 |
| MS6-21 | Structure profile buttons show section size AND kg/m on the card itself (S5-5.4 fixes `structures.51`); member model shows the counted bill (legs/rafters/rails/purlins/braces) with the live preview (`layout.63/.64`). | `SRC-CODE` + `BRIEF` S5-5.4 | P0 |
| MS6-22 | The structure disclaimer and engineer-verification line appear on EVERY structure sheet — flush tables included (S5-1a fixes `layout.65`); it travels to the member card, BOM/CSV, SLD, structural drawing and proposal with the preliminary status (`structures.23/.25`). | `BRIEF` S5-1a | P0 |
| MS6-23 | Duplicate table with a fresh label and cleared strings (`layout.66`). | `SRC-CODE` | P1 |

### MS6.5 — Electrical surface (stringing lives here, engine in MS8)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS6-24 | Stringing sheet: Auto string (MPPT-valid grouping at design temperatures) · Manual string (tap-to-wire with live "N of min–max" guidance) · Clear strings — with count badges (`layout.29–.31`). | `SRC-CODE` | P0 |
| MS6-25 | Clear strings ALSO clears their cable routes, so no surface can report routed cable for strings that no longer exist (S5-1c fixes `layout.32`). | `BRIEF` S5-1c | P0 |
| MS6-26 | String-connections sheet: read-only card per string with colour, inverter/MPPT, counts (`layout.33`). | `SRC-CODE` | P1 |
| MS6-27 | Live validation banner aggregates layout, structure, route and system issues; every issue card is tap-to-locate; unstrung-panel and MPPT-capacity cards carry an inline "Auto-string now" (`layout.67–.76`). | `SRC-CODE` | P0 |
| MS6-28 | THE HARD GATE: the step blocks with a plain reason when there are no enabled panels or when electrical validation fails — the studio's one hard gate (R12 asymmetry, MS2 §MS2.1) (`layout.77`). | `SRC-CODE` | P0 |
| MS6-29 | Status pill shows enabled panels and achieved-vs-target kWp. There is NO studio-side capacity cap: the hardcoded plan limit and demo upgrade prompt are removed; capacity ceilings are platform entitlements checked at Save/Generate (S5-2 fixes `layout.78/.80`, Q28). | `BRIEF` S5-2 | P0 |

### MS6.6 — The 3D scene

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS6-30 | Full-screen 3D overlay with orbit/pan/zoom, three view presets, keyboard camera, and a VISIBLE control cluster (orbit nudges, zoom ±, reset) so nothing is gesture- or keyboard-only (S5-3 fixes `scene3d.6`) (`scene3d.1–.5`). | `SRC-CODE` + `BRIEF` S5-3 | P0 |
| MS6-31 | Sun simulation: season presets, date picker showing the user's LOCAL date (S5-5.5 fixes `scene3d.8`), play/pause animation, time slider, sunrise/sunset readouts, sun-position widget and sun-path arc — all on ONE simulation-time basis (site mean-solar time) with a NOAA-style astronomical position (`scene3d.7–.16`). | `SRC-CODE` + `BRIEF` S5-5.5 | P0 |
| MS6-32 | Shadow casters are the real design: roofs, parapets, obstructions, walkways, rails, arresters and wall inverters cast visible shadows. Neighbour-building decor is deterministic and cast-free, and now SAYS so ("decorative — excluded from shading") (S5-5.6 fixes `scene3d.19`); structure members shade visually only, stated in-UI (S5-5.8) (`scene3d.17–.19`). | `SRC-CODE` + `BRIEF` S5-5.6/.8 | P0 |
| MS6-33 | Map ⇄ Mesh toggle and the solar-access view; per-panel access values come from the HEADLESS engine — never the renderer — and one geometry source feeds both, so the picture and the physics can never disagree (`scene3d.20–.24`). | `SRC-CODE` | P0 |
| MS6-34 | Per-panel shade attribution on demand ("what is shading this module") and blocker→camera swing to the culprit (`scene3d.25/.26`). | `SRC-CODE` | P0 |
| MS6-35 | In-scene table editing: tap a module → its table's edit card (view-only inspection state never persists or fingerprints); ghost/isolate rendering; strict dismissal contract (`scene3d.27–.30`, `structures.31/.46`). | `SRC-CODE` | P0 |
| MS6-36 | Heatmap in 3D: forced map view, roof-aligned grid with adaptive resolution, geometric-access metric with its floor stated in the legend, month track, optional kWh layer when measured weather exists, and 2D-canvas parity (`scene3d.31–.37`). | `SRC-CODE` | P0 |
| MS6-37 | Scene surfaces: 3D entry from the layout, customer share link (per Q27 the 3D lives inside the proposal link), read-only share rendering, energy-report trigger, and capture mode for proposal hero shots (`scene3d.38–.42`). | `SRC-CODE` | P0 |
| MS6-38 | Rendering contracts that keep truth and speed together: instanced draws for the whole site, ONE panel frame shared by mesh/engine/2D, shared materials, exact extruded steel sections, structure re-derivation keyed to geometry, position-resolved obstruction grounding, and GPU cleanup on unmount (`scene3d.43–.50`). | `SRC-CODE` | P1 |

### MS6.7 — Structure model (parametric, honest)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS6-39 | Racking resolution chain (segment → roof → project → defaults) and surface-conditional foundation defaults; a persisted foundation the surface cannot carry is corrected at read time — and the UI never OFFERS an invalid option in the first place (S5-1b fixes `structures.52/.68`) (`structures.1–.4`). | `SRC-CODE` + `BRIEF` S5-1b | P0 |
| MS6-40 | Topology dispatch (monorail on flush metal-shed, flush elsewhere, elevated tables otherwise) and member emission: rows grouped, legs/rafters/rails/purlins/braces derived with a deterministic structural id scheme (`structures.5–.8`). | `SRC-CODE` | P0 |
| MS6-41 | Height chain law: the foundation CONSUMES clearance — steel spans from the foundation top, so quoted clearance is what a person actually gets (`structures.9`). | `SRC-CODE` | P0 |
| MS6-42 | Fasteners and foundations are COUNTED, not estimated: one anchor spec per leg base by kind, totals summed over the node graph, and steel mass computed per member against its own section (`structures.10/.11/.13`). | `SRC-CODE` | P0 |
| MS6-43 | Structure DRC: unsupported members are flagged against required node kinds; dead-load and other structural checks surface as issues (`structures.12/.70`). | `SRC-CODE` | P0 |
| MS6-44 | Parametric controls: purlins/row, rafter density, end overhang, tilt, clearance, profile per member class — with the default-clearing discipline so a reverted control leaves no residue (`structures.14/.15/.29/.30/.56`). | `SRC-CODE` | P0 |
| MS6-45 | Leg-plan editor: the table's own local frame, add/move/remove legs validated in WORLD space against the inset polygon, malformed persisted plans dropped safely; recorded gaps (no live drag ghost) carried as polish (`structures.16/.57–.62`). | `SRC-CODE` | P1 |
| MS6-46 | Dual-tilt and monorail honesty: dual-tilt builds the fixed-tilt topology and SAYS so; monorail warnings name both assumed figures (`structures.17–.19`). | `SRC-CODE` | P0 |
| MS6-47 | Foundation detail: options offered ⊆ allowed (S5-1b), per-kind assemblies and quantities marked ASSUMED, shape overrides only where physically meaningful, too-tall foundations FLAGGED never silently clamped, with the "nominal — engineer to confirm" note (`structures.33/.36–.38/.53/.54`). | `SRC-CODE` + `BRIEF` S5-1b | P0 |
| MS6-48 | In-scene structure card: this-panel access readout, presets with live previews, module visibility/isolate radiogroups, profile picker (with specs on the card per S5-5.4), foundation card, tilt/clearance steppers, MMS customisation, leg-plan toggle — every click ONE undo step through a single pure choice-applier (`structures.26–.28/.46–.57`). | `SRC-CODE` + `BRIEF` S5-5.4 | P0 |
| MS6-49 | Member click identifies and highlights the clicked member (S5-5.3 fixes `structures.41`); renderers draw real extruded sections and real joint assemblies, with buffers disposed on unmount (`structures.40/.42–.44`). | `SRC-CODE` + `BRIEF` S5-5.3 | P0 |
| MS6-50 | Structure reaches the outputs: DXF structural layers, structural drawing sheet, BOM lines and the wind-zone display table — all carrying the preliminary/assumed language (`structures.20/.21/.24/.71/.72`). | `SRC-CODE` | P0 |
| MS6-51 | The 2D table-settings surface mirrors the 3D card (presets, ground branch, racking, profiles with kg/m, member model) with the SAME allowed-options rule after S5-1b (`structures.63–.69`). | `SRC-CODE` + `BRIEF` S5-1b | P0 |

### MS6.8 — Design Health

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS6-52 | Health scorer across energy/electrical/utilisation with documented, deliberate exclusions; keyed to the design + shading + insight state so a stale score can never show; context lines (irradiance provenance, etc.) are shown but never scored (`layout.88–.91`). | `SRC-CODE` | P0 |
| MS6-53 | Shadow-free pitch model (winter solstice, hemisphere-correct window) is the shared basis for row spacing and the inter-row card (`layout.92`). | `SRC-CODE` | P0 |

## 4. Cross-module contracts

Consumes: MS2 roofs/faces/segment-engine laws + obstruction bridging (MS3); MS4 module/target/inverter/profile catalog; MS1 worker + canvas contracts; F1 pack (wind zones, ground tilt rules); Q28 entitlements (MS6-29). Provides: strings/routes/inverter placements → MS8; structure members, fasteners, foundations, counted quantities → MS10; captures + access data → MS9/proposal; the 3D scene → the customer proposal link (Q27, F5). Studio-wide laws reinforced here: ONE shading authority (MS6-33), estimate-not-certified structure (MS6-22/47), nothing gesture-only (MS6-30).

## 5. Non-goals

Studio-side plan/capacity caps (MS6-29, Q28) · structure certification or load calculation (estimate + engineer sign-off only, F8-25) · analytic shading from structure members or decorative neighbours (visual only, stated — MS6-32) · persisting inspection-only view state (MS6-35).

## 6. Open items

None — Sitting 5 closed with zero open items (5 rulings covering all 16 defects, 2026-08-05).

## Acceptance criteria (P0 coverage)

- Given roofs and no panels, Then auto-place is offered once with both objectives and a manual escape (MS6-01), replacing layout in one undo step with warnings surfaced (MS6-02), ranking roofs by MEASURED access with every choice logged (MS6-03), and filling within setbacks, bridging-aware buffers and shadow-free pitch using the canonical footprint (MS6-04). Given a Copilot suggestion, Then Accept applies it as one undo step and Dismiss hides it reversibly (MS6-05).
- Given the rail, Then groups are labelled and electrical buttons show counts (MS6-06); tap places one module and drag fills a collision-aware table (MS6-07); erase hits what was tapped by priority (MS6-08); safety elements draw with true-width previews (MS6-09); heatmap/strings toggle and heatmap-off restores the prior view (MS6-10).
- Given a selection, Then marquee/drag rules keep tables coherent (MS6-12), nudges work by key and by touch control (MS6-13), and the context bar offers the full action set (MS6-14). Given a rotate, Then table settings agree with the layout (MS6-15). Given a mixed selection, Then tilt applies per table (MS6-16). Given delete, Then dependents cascade and locks refuse edits (MS6-17). Given any gesture, Then exactly one undo entry results and Clear-all confirms with counts (MS6-18).
- Given a table, Then its header states rows×cols/panels/kWp with presets and ground-appropriate options (MS6-19); azimuth presets face the equator for the site's hemisphere (MS6-20); profile cards show section size and kg/m (MS6-21). Given ANY structure sheet including flush, Then the disclaimer and engineer line render (MS6-22).
- Given stringing, Then auto/manual/clear work with counts (MS6-24); Given Clear strings, Then no surface reports routed cable afterwards (MS6-25). Given validation issues, Then each is tap-to-locate with inline auto-string where applicable (MS6-27), and the step blocks with a plain reason when unsafe (MS6-28). Given any design size, Then the studio never caps capacity; entitlement checks happen at Save/Generate (MS6-29).
- Given the 3D view, Then visible orbit/zoom/reset controls exist alongside gestures (MS6-30); the date field shows the user's local date and all sun controls share one time basis (MS6-31); real elements cast shadows while decorative ones state their exclusion (MS6-32); per-panel access comes from the headless engine over shared geometry (MS6-33); shade attribution and blocker focus work (MS6-34); in-scene table editing never persists view state (MS6-35); heatmap states its metric and floor in the legend (MS6-36); share/report/capture surfaces behave per Q27 (MS6-37).
- Given a foundation choice, Then quantities read as ASSUMED with the "engineer to confirm" note, shape overrides apply only where meaningful, and a too-tall foundation is FLAGGED rather than silently clamped (MS6-47). Given the in-scene structure card, Then every control (presets, visibility, profile with specs, foundation, tilt/clearance, MMS, leg plan) commits exactly one undo step through the single choice-applier, and an unavailable card explains why rather than rendering blank (MS6-48).
- Given a ground table, Then only allowed foundations are offered and none is silently corrected (MS6-39/47/51); topology and members derive deterministically (MS6-40); quoted clearance accounts for the foundation (MS6-41); fasteners and steel are counted per member (MS6-42); unsupported members are flagged (MS6-43); parametric controls revert cleanly (MS6-44); dual-tilt and monorail assumptions are stated (MS6-46); a member click highlights that member (MS6-49); structure language reaches every output (MS6-50); the 2D and 3D structure surfaces agree (MS6-51).
- Given any change, Then Health re-scores against the current design and never shows a stale score (MS6-52), with row spacing and the inter-row card sharing one pitch model (MS6-53).

Localization: every label/hint/warning via catalog (F3); units per preference. Analytics: autodesign_run {objective}, tool_used {tool}, structure_choice {kind}, heatmap_opened, scene_opened, copilot_action {accept|dismiss}.
