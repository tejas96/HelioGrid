# MS8 · Studio Step 8 — SLD & the electrical engine

Status: draft · Origin mix: SRC-CODE-dominant + BRIEF (Sitting 7 rulings, 2026-08-05) · Depends on: MS4 (panel/inverter specs, topology, MLPE), MS6 (panels, segments, strings, structures), MS10 (BOM money path), F1 (pack: standards, ladders, design temperatures), F8 (assumed-vs-derived language), Q28
Sources: POC code inventory — sld (**133 keys**, 12 test files / 171 tests all passing, every ladder cross-checked against the rules pack) · sitting rulings (S7-1, S7-2) · census A.10-9 (37/37 matched, 9 with divergences now ruled). The ledger index is retired; the POC repository named in `docs/build-order.md` is the source, and the sitting rulings are carried by the rows below.
Forward: MS10 (BOM consumes sized ratings, cable metres, combiner plan) · MS6 (validation banner + the hard gate) · MS11 (installation sheet) · customer surfaces (drawings in the proposal pack).

## 1. Purpose & scope

Step 8 is where the design becomes an electrical system: temperature-corrected string sizing, the full design-rule check, cable routing and sizing, protection ratings, and four printable sheets (SLD · PV layout · string route · structure). It also owns the studio's **one hard gate** — the electrical errors that make a design unshippable.

## 2. Personas & surfaces

Design Engineer (author) · Design Engineer with sign-off (verification chip) · Sales Executive (read/export). Web primary; sheets export to SVG/PNG/DXF/print. Mobile parity for review per F7-30.

## 3. Feature areas

### MS8.1 — Step shell, sheets & exports

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS8-01 | Four drawing tabs in fixed order — SLD · PV Layout · String Route · Structure — with parameters DERIVED live on every render (override layer applied on top) (`.1/.3`). | `SRC-CODE` | P0 |
| MS8-02 | Sheet host presentation is honest about its capabilities: zoom either works or is not advertised (S7-2.6 fixes `.2`); paper size, scale and sheet numbering are consistent across every sheet and title block (S7-2.2/.3 fix `.13/.37/.43`) (`.18`). | `SRC-CODE` + `BRIEF` S7-2 | P0 |
| MS8-03 | First-visit explainer states why the SLD matters (utility approval), with Edit-Ratings available on the SLD tab and an override indicator when values are overridden (`.4/.5`). | `SRC-CODE` | P0 |
| MS8-04 | Structural verification chip (pending → verified) reflects the engineer state recorded by the sign-off flow (MS11.3, F8-25 family) — the chip is a read-out of that flow's record, never a free-standing toggle flipped on this step; high-wind badge from the market pack's wind zone table (`.6/.7`). | `SRC-CODE` | P0 |
| MS8-05 | Three-line toggle shows every conductor when needed for approval (`.8`). | `SRC-CODE` | P1 |
| MS8-06 | Exports: SVG (CAD), PNG (2× raster), DXF layout, and print/PDF via a scoped print stylesheet — each producing the sheet as displayed (`.9–.12`). | `SRC-CODE` | P0 |
| MS8-07 | Unstrung state explains itself and offers auto-string, disabled with a stated reason until panel + inverter + enabled panels exist (`.14/.15`); auto-string runs the REAL planner everywhere and surfaces its refusals rather than swallowing them (S7-1c fixes `.16/.84`), committing as one undo step (`.17`). | `SRC-CODE` + `BRIEF` S7-1c | P0 |

### MS8.2 — The SLD sheet

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS8-08 | Sheet frame, heading and identity block per the census; the structural disclaimer travels on EVERY sheet (`.18/.19/.33/.34`, F8-25). | `SRC-CODE` | P0 |
| MS8-09 | Only real strings are drawn, and every real string is drawn, each with its conductor label (`.20/.21`). | `SRC-CODE` | P0 |
| MS8-10 | Combiner boxes appear only when the topology and plan call for them (`.22`, engine at MS8-27). | `SRC-CODE` | P0 |
| MS8-11 | Maximum-system-voltage compliance box computed from the coldest-condition string voltage, with pass/fail styling (`.23/.24`). | `SRC-CODE` | P0 |
| MS8-12 | Equipment blocks (DCDB, inverter, ACDB, meters, grid) print the ACTUAL sized ratings: fuse, SPD, isolator, breaker and cable sizes come from the same sizing engine the BOM quotes — never a legacy constant (S7-1a fixes `.35`) (`.25–.29`). | `SRC-CODE` + `BRIEF` S7-1a | P0 |
| MS8-13 | Earthing is drawn per the design, with the earth-pit count derived from the same rules the BOM uses — never hardcoded (S7-1b fixes `.30`). | `BRIEF` S7-1b | P0 |
| MS8-14 | String/MPPT schedule and plant-details tables grow with the design and state its real figures (`.31/.32`). | `SRC-CODE` | P0 |

### MS8.3 — Layout, route & structure sheets

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS8-15 | Shared plan transform frames all roofs consistently across sheets (`.36`); roof outlines carry per-edge dimensions (`.38`); north arrow orientation is stated (`.40`). | `SRC-CODE` | P0 |
| MS8-16 | Obstructions are drawn at their TRUE footprint — rectangles as rectangles, circles as circles, from the real dimensions (S7-2.1 fixes `.39`). | `BRIEF` S7-2.1 | P0 |
| MS8-17 | The legend lists only symbols the sheet actually renders (S7-2.4 fixes `.41`); the section detail reflects the design's real tilt/foundation or is explicitly labelled TYPICAL — ASSUMED (S7-2.5 fixes `.42`). | `BRIEF` S7-2.4/.5 | P0 |
| MS8-18 | String-route sheet draws each string's series path with its colour, and states plainly when no strings exist (`.45/.46`). | `SRC-CODE` | P0 |
| MS8-19 | Structure sheet is the printable structural drawing with its own honesty block (MS6-50) (`.47`). | `SRC-CODE` | P0 |

### MS8.4 — Derived parameters & overrides

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS8-20 | Parameters are derived (pure, from the design) and merged with explicit overrides; the merge is the single effective value every surface reads (`.48/.49`). | `SRC-CODE` | P0 |
| MS8-21 | Edit-Ratings dialog: seeded from effective values, counts edits, and every field can REPRESENT any value the engine legally derives — full ladders, no subsets (S7-1d fixes `.52`) (`.50/.51`). | `SRC-CODE` + `BRIEF` S7-1d | P0 |
| MS8-22 | Standards references shown on the sheet come from the market pack, not hardcoded strings (`.53`, F1). | `SRC-CODE` + `BRIEF` S7-1 | P0 |

### MS8.5 — String sizing (temperature-corrected)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS8-23 | Design temperatures resolve from the site's latitude band in the market pack, with a stated cell-temperature rise, and carry provenance (measured vs assumed) with a plain-language note (`.54–.56`). | `SRC-CODE` | P0 |
| MS8-24 | Module voltage at temperature uses the datasheet coefficient; the string window derives min/max panels from the inverter's DC ceiling and MPPT window at those temperatures; an impossible pair is STATED as empty, never as nonsense bounds (`.57–.59`). | `SRC-CODE` | P0 |
| MS8-25 | Parallel-string capacity per MPPT derives from current limits (`.61`); string colours are stable across planner, sheets and 3D (`.60`). | `SRC-CODE` | P0 |
| MS8-26 | Grouping engine: panels group by plane identity, azimuth/tilt buckets and shade tier (thresholds shared with the 3D access tints); co-planarity is geometric, not by-name; disabled panels never occupy a string; MLPE changes the grouping rules; serpentine ordering follows the roof grid (`.62–.67`). | `SRC-CODE` | P0 |
| MS8-27 | Planner contract (pure): balanced splits, undersized-group merging, explicit refusals with plain messages (empty window, current limit, tail too small, MPPT overflow), assumed-coefficient warning, and MPPT slot assignment (`.68–.76`); combiner plan for central topologies with its reconciliation gates (`.98–.100`). | `SRC-CODE` | P0 |

### MS8.6 — Validation, DRC & THE HARD GATE

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS8-28 | System validation runs live on every edit and feeds the editor banner, health score and the gate (`.77`). | `SRC-CODE` | P0 |
| MS8-29 | Electrical checks with their severities and plain messages: over-voltage strings, under-voltage strings, current above MPPT input, DC/AC ratio band, unstrung enabled panels, MPPT overflow (`.78–.83`). | `SRC-CODE` | P0 |
| MS8-30 | Layout DRC on the CANONICAL footprint (the same one placement and drawings use): panel overlap, setback breach, low solar access, keep-out intrusion, panel over a blocking obstruction, bridge clearance, bridge-engineer confirmation (`.120–.127`). | `SRC-CODE` | P0 |
| MS8-31 | Structure DRC: foundation dead-load warning, foundation clash, foundation too tall (`.128–.130`). | `SRC-CODE` | P0 |
| MS8-32 | The complete rule set is published as one table of code → severity → message, so every surface speaks the same language (`.131`). | `SRC-CODE` | P0 |
| MS8-33 | THE HARD GATE: error-level electrical issues block the editor's Next AND clamp the reachable steps, so an unsafe design cannot reach proposal or BOM; warnings never block; the gate is a single pure function shared by the wizard, tests and any future surface; where auto-string can resolve the block, the gate says so (`.85–.89`, R12 asymmetry, MS6-28). | `SRC-CODE` | P0 |

### MS8.7 — Sizing, routing & cascades

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS8-34 | DC protection sizing: fuse from the continuous-current rule, isolator and cable from the pack ladders (`.90/.91`). | `SRC-CODE` | P0 |
| MS8-35 | AC sizing: exact full-load current, breaker from the continuous rule, and cable sized by BOTH ampacity (derated) and voltage drop — the governing size wins, with the honesty boundary stated (grouping/temperature factors out of scope) (`.92–.97`). | `SRC-CODE` | P0 |
| MS8-36 | Cable routing: vertical drops from the model (never a constant), inverter position resolved from its wall placement, length = path + drop + stated slack, blockers limited to what a cable truly may not cross, straight line when clear and a shortest-path route otherwise, corridor-cost preference over free-field crossing, array footprint and intra-string extras counted (`.102–.111`). | `SRC-CODE` | P0 |
| MS8-37 | AC main route to the grid connection returns nothing rather than a fabricated path when the connection point is unset (`.112`). | `SRC-CODE` | P0 |
| MS8-38 | Route-derived voltage-drop warnings per string (`.113`); routed metres are THE BOM quantity, and routes re-key the design fingerprint because they move money (`.114/.115`). | `SRC-CODE` | P0 |
| MS8-39 | Cascades are atomic: deleting a roof or panels prunes strings and routes so no dead copper is ever priced; emptied strings disappear rather than lingering (`.116–.119`, pairs with MS6-25). | `SRC-CODE` | P0 |
| MS8-40 | Node hardware provides nominal visual parts per structure node, with foundation assemblies owned by the structure model (no double-counting) (`.132/.133`). | `SRC-CODE` | P1 |

## 4. Cross-module contracts

Consumes: MS4 (panel/inverter specs, topology, MLPE), MS6 (panels, segments, strings, structures, inverter placements), F1 pack (design-temperature bands, ladders, standards, wind zones), F8 (assumed/derived language). Provides: sized ratings, cable metres, combiner plan and the full issue set to MS10 (BOM), MS6 (banner + gate), MS11 (installation), and the customer document pack. **One-source-of-truth law (S7-1):** where a value appears on a drawing AND in the BOM, both read the same engine output — the drawing never prints a constant the BOM has sized.

## 5. Non-goals

Certified electrical design or load calculation (the studio sizes and checks; a licensed engineer signs — F8-25) · grouping/temperature derating factors beyond the stated boundary (MS8-35) · fabricated cable paths when the grid point is unset (MS8-37) · blocking on warnings (MS8-33).

## 6. Open items

None — Sitting 7 closed with zero open items (2 rulings covering all 11 defects + 1 uncertainty, 2026-08-05).

## Acceptance criteria (P0 coverage)

- Given the step opens, Then four tabs render with live-derived parameters plus overrides (MS8-01); the sheet advertises only capabilities it has, and paper/scale/numbering agree across every sheet (MS8-02); the explainer and Edit-Ratings entry behave as specified (MS8-03); verification and wind badges reflect real state, the verification chip reading the MS11.3 sign-off record rather than offering a local toggle (MS8-04); exports produce the displayed sheet in each format (MS8-06). Given no strings, Then the state explains itself, auto-string states any blocking reason, runs the real planner, and surfaces refusals (MS8-07).
- Given a design, Then only real strings are drawn and all of them are (MS8-09); combiners appear only when the plan calls for them (MS8-10); the voltage box computes from coldest-condition voltage (MS8-11); every rating on the sheet equals the BOM's sized value (MS8-12); the earth-pit count matches the BOM's derivation (MS8-13); schedules reflect the real design (MS8-14); the structural disclaimer appears on every sheet (MS8-08).
- Given a rectangular obstruction, Then the layout sheet draws it as a rectangle at true size (MS8-16); the legend lists only rendered symbols and the section detail is either design-true or labelled TYPICAL — ASSUMED (MS8-17); roof edges carry dimensions (MS8-15); the route sheet draws each string path or states there are none (MS8-18).
- Given an override, Then the effective value is what every surface reads (MS8-20); Given a legally derived rating, Then the dialog can display and select it (MS8-21); standards text comes from the pack (MS8-22).
- Given a site latitude, Then design temperatures come from the pack band with provenance stated (MS8-23); Given a panel/inverter pair, Then the string window derives from datasheet values and an impossible pair is stated as empty (MS8-24); parallel capacity derives from current limits (MS8-25). Given mixed roofs, Then grouping respects plane, orientation and shade tier, and disabled panels never string (MS8-26). Given a plan, Then splits are balanced, refusals are explicit and plain, and MPPT slots are assigned (MS8-27).
- Given the structure tab, Then the printable structural drawing renders with its honesty block (MS8-19).
- Given any edit, Then validation re-runs and feeds banner, health and gate (MS8-28); every electrical check fires with its severity and message (MS8-29). Given overlapping panels, a setback breach, a keep-out intrusion, a panel over a blocking obstruction or insufficient bridge clearance, Then each raises its own coded issue on the canonical footprint (MS8-30). Given a foundation clash, an over-tall foundation or a dead-load concern, Then structure DRC raises it (MS8-31); the published rule table matches what the surfaces show (MS8-32).
- Given an AC run, Then cable size is the larger of the ampacity-derated and voltage-drop results, with the boundary of the method stated (MS8-35). Given an error-level electrical issue, Then Next is blocked, later steps are unreachable, warnings do NOT block, and the reason is plain (MS8-33).
- Given a design, Then DC and AC protection sizes derive from the pack ladders with the governing criterion winning for cable (MS8-34/35). Given a routed string, Then length = path + drop + stated slack with real blockers respected (MS8-36); Given no grid point, Then no AC path is fabricated (MS8-37); routed metres drive the BOM and re-key the fingerprint (MS8-38). Given a deleted roof or panels, Then strings and routes prune atomically and nothing dead is priced (MS8-39).

Localization: labels, messages and standards text via catalog + pack (F3/F1). Analytics: sld_opened, ratings_overridden {fields}, export_used {format}, autostring_from_step8, gate_blocked {codes}.
