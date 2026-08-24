# SCR-MS-11 · Studio Step 8 — SLD & Drawings

Wizard Step 8: four drawing tabs (SLD, PV layout, string route, structure) with ratings overrides and exports.

**Module:** M05 · Design Studio · **Personas:** Design Engineer (author), Design Engineer with sign-off (verification chip), Sales Executive (read/export), EPC Owner, Sales (read-only, can export) · **Context of use:** web primary — these are the documents an electrical inspector and a utility approval desk read; sheets export to SVG/PNG/DXF/print; mobile parity for review per F7-30; exports fail fast, so a designer gets an honest refusal rather than a silent no-op.

## Entry & exit

Reached from: the studio wizard, advancing from Step 7 — Proposal (SCR-MS-10), or by the step rail/sheet into a visited step (SCR-MS-03). **Wizard-step gate that admits the user:** this step sits past the studio's one hard gate — invalid electrical blocks the layout step's Next with the reason stated (M05-49/MS6-28 on SCR-MS-08); within this step nothing further gates entry: an unstrung design opens to the empty state that explains itself and offers auto-string with its availability reason (M05-67, MS8-07). Leads to: Step 9 — Bill of Materials (SCR-MS-12) via the wizard's Next; exports leave as SVG (CAD), PNG, DXF (layout) and Print/Save-as-PDF (M05-67, MS8-06); "String manually in editor" returns to the layout editor (SCR-MS-08, M05-67); the structural verification chip reads the record made by the sign-off flow (MS11.3 — SCR-MS-16), never a toggle on this step (MS8-04).

## Requirements (verbatim)

### docs/prd/modules/M05-studio/07-step8-sld.md

- **MS8-01** (P0) — Four drawing tabs in fixed order — SLD · PV Layout · String Route · Structure — with parameters DERIVED live on every render (override layer applied on top) (`.1/.3`).
- **MS8-02** (P0) — Sheet host presentation is honest about its capabilities: zoom either works or is not advertised (S7-2.6 fixes `.2`); paper size, scale and sheet numbering are consistent across every sheet and title block (S7-2.2/.3 fix `.13/.37/.43`) (`.18`).
- **MS8-03** (P0) — First-visit explainer states why the SLD matters (utility approval), with Edit-Ratings available on the SLD tab and an override indicator when values are overridden (`.4/.5`).
- **MS8-04** (P0) — Structural verification chip (pending → verified) reflects the engineer state recorded by the sign-off flow (MS11.3, F8-25 family) — the chip is a read-out of that flow's record, never a free-standing toggle flipped on this step; high-wind badge from the market pack's wind zone table (`.6/.7`). _(non-UI half, build-side: chip is read-out of MS11.3 sign-off record, never local toggle — for awareness, not for drawing)_
- **MS8-05** (P1) — Three-line toggle shows every conductor when needed for approval (`.8`).
- **MS8-06** (P0) — Exports: SVG (CAD), PNG (2× raster), DXF layout, and print/PDF via a scoped print stylesheet — each producing the sheet as displayed (`.9–.12`). _(non-UI half, build-side: SVG/PNG/DXF/print renderers reproduce sheet exactly as displayed — for awareness, not for drawing)_
- **MS8-07** (P0) — Unstrung state explains itself and offers auto-string, disabled with a stated reason until panel + inverter + enabled panels exist (`.14/.15`); auto-string runs the REAL planner everywhere and surfaces its refusals rather than swallowing them (S7-1c fixes `.16/.84`), committing as one undo step (`.17`). _(non-UI half, build-side: auto-string runs real planner, surfaces refusals, single undo commit — for awareness, not for drawing)_
- **MS8-08** (P0) — Sheet frame, heading and identity block per the census; the structural disclaimer travels on EVERY sheet (`.18/.19/.33/.34`, F8-25).
- **MS8-09** (P0) — Only real strings are drawn, and every real string is drawn, each with its conductor label (`.20/.21`).
- **MS8-10** (P0) — Combiner boxes appear only when the topology and plan call for them (`.22`, engine at MS8-27).
- **MS8-11** (P0) — Maximum-system-voltage compliance box computed from the coldest-condition string voltage, with pass/fail styling (`.23/.24`). _(non-UI half, build-side: computed from coldest-condition string voltage — for awareness, not for drawing)_
- **MS8-12** (P0) — Equipment blocks (DCDB, inverter, ACDB, meters, grid) print the ACTUAL sized ratings: fuse, SPD, isolator, breaker and cable sizes come from the same sizing engine the BOM quotes — never a legacy constant (S7-1a fixes `.35`) (`.25–.29`). _(non-UI half, build-side: ratings come from same sizing engine the BOM quotes — for awareness, not for drawing)_
- **MS8-13** (P0) — Earthing is drawn per the design, with the earth-pit count derived from the same rules the BOM uses — never hardcoded (S7-1b fixes `.30`). _(non-UI half, build-side: earth-pit count derived from same rules as BOM — for awareness, not for drawing)_
- **MS8-14** (P0) — String/MPPT schedule and plant-details tables grow with the design and state its real figures (`.31/.32`).
- **MS8-15** (P0) — Shared plan transform frames all roofs consistently across sheets (`.36`); roof outlines carry per-edge dimensions (`.38`); north arrow orientation is stated (`.40`).
- **MS8-16** (P0) — Obstructions are drawn at their TRUE footprint — rectangles as rectangles, circles as circles, from the real dimensions (S7-2.1 fixes `.39`).
- **MS8-17** (P0) — The legend lists only symbols the sheet actually renders (S7-2.4 fixes `.41`); the section detail reflects the design's real tilt/foundation or is explicitly labelled TYPICAL — ASSUMED (S7-2.5 fixes `.42`).
- **MS8-18** (P0) — String-route sheet draws each string's series path with its colour, and states plainly when no strings exist (`.45/.46`).
- **MS8-19** (P0) — Structure sheet is the printable structural drawing with its own honesty block (MS6-50) (`.47`).
- **MS8-21** (P0) — Edit-Ratings dialog: seeded from effective values, counts edits, and every field can REPRESENT any value the engine legally derives — full ladders, no subsets (S7-1d fixes `.52`) (`.50/.51`).
- **MS8-23** (P0) — Design temperatures resolve from the site's latitude band in the market pack, with a stated cell-temperature rise, and carry provenance (measured vs assumed) with a plain-language note (`.54–.56`). _(non-UI half, build-side: design temperatures resolve from pack latitude band — for awareness, not for drawing)_

### docs/prd/modules/M05-design-studio.md

- **M05-62** (P0) — **Four drawing tabs — SLD · PV Layout · String Route · Structure — each a proper title-blocked drawing sheet** (zoom/pan within its area; title block with project, client, date, sheet name; a "not to scale" note). This is the industrial-drawings capability at every tier.
- **M05-63** (P0) — **SLD content, census-complete:** each string with panel count + voltage; string combiner boxes (central topology); DCDB with fuse, SPD, isolator; inverter (label, kW, phase, MPPT range, unit count); ACDB with MCCB, SPD, isolator; generation + net meters + grid; earthing pits; String/MPPT schedule table; Plant details table; the structural disclaimer note. PV Layout: roofs with edge dimensions, every panel, obstruction buffers, north arrow, legend, array-table detail, title block. String Route: roof outlines + labelled cable routes + string schedule (says so when nothing is strung). Structure: structural drawing of the mounting system.
- **M05-64** (P0) — **The MAXIMUM SYSTEM VOLTAGE compliance box is prominent:** longest string's cold-weather voltage vs inverter max DC voltage; within = passing, over = fault + "shorten the string". It is the figure an electrical inspector checks and must read as such. _(non-UI half, build-side: longest-string cold-weather voltage versus inverter max computation — for awareness, not for drawing)_
- **M05-65** (P0) — **SLD controls: the three-line toggle and the Edit-ratings form with override accounting.** Three-line (line/neutral/earth vs single-line shorthand). Edit ratings (with a count of overrides): inverter name/model + AC kW; DC cable mm² (2.5/4/6/10); DC fuse A (15/20/25/32); DC SPD type (Type-I / Type-II / Type-I+II); DC isolator A (25/32/40/63); AC cable mm² (4–95); AC cable type (PVC copper / XLPE copper / XLPE aluminium); MCCB rating A (also sets the isolator); AC SPD type; **grid & standards family from the market pack's engineering-standards labels** (the census's own list already spans two markets' families). Actions: Reset to auto (disabled when nothing overridden), Cancel, Save (only values differing from derived defaults are kept).
- **M05-66** (P0) — **Structural verification is a two-state human record — Pending verification ⇄ Engineer approved — and the high-wind marker is display-only with mandatory engineer verification in a high-wind zone.** The app never computes structural adequacy (`F8-25`, cited); the sign-off act itself is §M05.14. _(non-UI half, build-side: human two-state record only; app never computes structural adequacy — for awareness, not for drawing)_
- **M05-67** (P0) — **Exports: SVG (CAD) · PNG · DXF (layout) · Print/Save-as-PDF — server-rendered, fail fast.** Empty state when nothing is strung: "Auto-string now" (unavailable until panel + inverter + ≥1 placed panel exist, reason shown) and "String manually in editor". First-visit colour-legend explainer (DC / inverter / AC / earthing; dismissable). _(non-UI half, build-side: exports fail fast — for awareness, not for drawing)_
- **M05-93** (P1) — **Block-level electrical extends — never replaces — the combiner architecture:** an inverter-block tier for central-inverter blocks; string inverters remain for ≤10 MW distributed designs; MV collection is stubbed as a **LABELLED ASSUMPTION** — no MV engineering claim; reconciliation gates hold (Σ combiner inputs = total strings; Σ blocks = project total). Permit/DXF outputs at scale: zone plan, table rows with pitch dimensions, per-block electrical single-line, DEM contour underlay — **provenance tiers print on every sheet, unchanged**. _(non-UI half, build-side: inverter-block tier extends combiners; MV a labelled assumption; reconciliation gates hold — for awareness, not for drawing)_

## States

- loading
- empty (empty-nothing-strung — states it plainly; string-route sheet says so when nothing is strung)
- error
- first-visit-explainer (why the SLD matters — utility approval)
- first-visit-colour-legend (DC / inverter / AC / earthing; dismissable)
- unstrung (explains itself and offers auto-string)
- auto-string-disabled-with-reason (until panel + inverter + enabled panels exist)
- planner-refusal (auto-string surfaces refusals rather than swallowing them)
- overridden-indicator / overrides-counted (override indicator; Edit-Ratings counts edits; Reset to auto disabled when nothing overridden)
- voltage-pass / voltage-fail (compliance box: within = passing, over = fault + "shorten the string")
- compliance-box-fault
- no-strings-route (route sheet states plainly when no strings exist)
- verification-pending / pending-verification (chip: Pending verification)
- verification-verified / engineer-approved (chip: Engineer approved)
- high-wind-badge / high-wind-marker (display-only, from the pack's wind zone table; mandatory engineer verification in a high-wind zone)
- three-line-mode (line/neutral/earth vs single-line shorthand)
- read-only-export (the read-only persona named above sees every sheet — SLD · PV Layout · String Route · Structure — with its title block, compliance box, schedules and disclaimer, and **export still works**: SVG (CAD) · PNG · DXF (layout) · Print/Save-as-PDF, M05-67/MS8-06. What is not offered is the write: **ratings are not overridable** — Edit-Ratings, its override count and Reset-to-auto are authoring controls (M05-65, MS8-21; `foundations/F2` governs who), and the structural verification chip is already a read-out of the sign-off flow's record for every role, never a toggle on this step (MS8-04, M05-66). The exact affordance for the withheld controls is not pinned by PRD — designer decides, note the decision.)

## Data volume

Four title-blocked sheets over a 221-panel design: every real string drawn with its conductor label and colour; String/MPPT schedule and plant-details tables that grow with the design; a PV layout sheet carrying every panel, roof edge dimensions, obstruction buffers, north arrow and legend; an Edit-Ratings dialog spanning the full ladders (DC cable mm² 2.5/4/6/10 · DC fuse A 15/20/25/32 · DC SPD types · DC isolator A 25/32/40/63 · AC cable mm² 4–95 · AC cable types · MCCB A · AC SPD); exports in four formats reproducing each sheet exactly as displayed.

## Numbers carrying provenance

- Maximum system voltage compliance box: longest string's cold-weather voltage vs inverter max DC voltage (M05-64, MS8-11) — computed, pass/fail; the figure an electrical inspector checks
- Per-string panel count + voltage; String/MPPT schedule and plant-details figures (M05-63, MS8-14) — derived from the real design
- Equipment ratings — fuse, SPD, isolator, breaker, cable sizes (MS8-12) — the ACTUAL sized ratings from the same sizing engine the BOM quotes, never a legacy constant
- Earth-pit count (MS8-13) — derived from the same rules the BOM uses, never hardcoded
- Design temperatures with stated cell-temperature rise (MS8-23) — carry provenance (measured vs assumed) with a plain-language note
- Override count in Edit-Ratings (M05-65, MS8-21); only values differing from derived defaults are kept
- Roof per-edge dimensions; obstruction TRUE footprints from real dimensions (MS8-15, MS8-16)
- Section detail — the design's real tilt/foundation or explicitly labelled TYPICAL — ASSUMED (MS8-17)
- Paper size, scale and sheet numbering — consistent across every sheet and title block (MS8-02); title block with project, client, date, sheet name and the "not to scale" note (M05-62)
- The structural disclaimer on EVERY sheet (MS8-08); verification chip Pending ⇄ Engineer approved as a human record (M05-66, MS8-04); high-wind badge from the pack's wind zone table (MS8-04)
- Standards family labels — from the market pack's engineering-standards labels (M05-65)
- At scale (P1): provenance tiers print on every sheet, unchanged; MV collection a LABELLED ASSUMPTION; reconciliation gates Σ combiner inputs = total strings, Σ blocks = project total (M05-93)
