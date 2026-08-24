# MS1 · Studio Step 1 — Site Setup

Status: draft · Origin mix: SRC-CODE-dominant + BRIEF (Sitting 1 rulings, 2026-08-05) · Depends on: M05 (baseline §M05.2–.3), F1, F2, F7, F8, M01, M02, M04
Sources: inventory ledger `docs/prd/_process/studio/inventory/step1-setup.md` (115 CODE keys, 33/33 area tests passing) · sitting rulings `docs/prd/_process/studio/sittings/step1-setup-rulings.md` (S1-1…S1-6) · census A.10-1/A.10-2 cross-refs.
Forward: MS2 (roof drawing consumes the confirmed location, calibration, canvas contract) · MS4 (bill-based size suggestion) · studio docs 02–13.

## 1. Purpose & scope

Step 1 turns a lead into a designable site: project/customer info, market-scoped site parameters, confirmed location with honest solar data, and the scale/orientation foundations every later step trusts. This document deepens M05's baseline rows for site setup with the POC's full behavior set plus the owner's Sitting-1 rulings. The shared satellite-canvas interaction contract (§MS1.8) lives here because its file does, and Steps 2/3/6 consume it by citation.

Out of scope here: the wizard shell around the step (MS12), the Step-2 calibration sheet UI (MS2), roof drawing (MS2).

## 2. Personas & surfaces

Design Engineer (primary author) · Sales Executive and Survey Engineer (may run remote-survey-derived setup per F2.M04.run-remote-survey) · read per lead visibility (F2). Surfaces: Web (primary authoring); Mobile 375 px full parity (F7-30); touch behaviors per S1-5a ruling and F7-32.

## 3. Feature areas

### MS1.1 — Project information (pre-filled, pack-driven)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS1-01 | Opening the studio from a lead PRE-FILLS project info: customer name, phone, site type from the lead/customer record; a completed survey pre-fills location (arrives CONFIRMED at the surveyed pin) and site details. Every pre-filled field stays editable and carries a provenance hint ("from survey, {date}" / "from lead"). | `BRIEF` S1-4 (closes census SC.10-2.01; honors M04-63/64 handoff) | P0 |
| MS1-02 | Project info fields: Project Name, Customer Name, Customer Phone "(for proposal)" — with placeholders as shipped (`CODE.step1-setup.4/5/6`). Phone validates per the tenant market's pack.formats rule (F1-49 class); invalid → inline corrective error, not a block on other fields. | `SRC-CODE` .4–.6 + `BRIEF` S1-6 (validation) | P0 |
| MS1-03 | Country displays from the tenant's market pack (no selector when the tenant has one market); Region/State list, utility/DISCOM list and the representative tariff table are PACK DATA (F1). The India pack ships today's exact content: 37 states/UTs, per-state DISCOM lists with generic fallback, tariff precedence per-utility → per-state pair → default ×1.4 commercial (`CODE.step1-setup.7–.10`). | `BRIEF` S1-6 (content `SRC-CODE` .7–.10) | P0 |
| MS1-04 | Utility select disabled until a region is chosen, with state-aware placeholder copy; choosing region clears utility and re-derives tariff; choosing utility re-derives tariff (`CODE.step1-setup.8/9`). | `SRC-CODE` .8/.9 | P0 |
| MS1-05 | Tariff field is auto-filled but always editable; provenance hint states the source and "representative rate; edit to match your actual bill" (`CODE.step1-setup.15/16`, F8 honesty). Manual edits always override auto-fill. | `SRC-CODE` .15/.16 | P0 |
| MS1-06 | Avg Monthly Bill (currency via pack) optional input, nullable-not-zero, feeds the Step-4 size suggestion; hint explains the use (`CODE.step1-setup.17`). | `SRC-CODE` .17 | P0 |
| MS1-07 | Step-1 form edits write through instantly and are NOT undo-stack entries (undo is reserved for geometry) (`CODE.step1-setup.3`). | `SRC-CODE` .3 | P1 |
| MS1-08 | First-run interactive walkthrough replaces the POC's decorative tutorial banner: coach marks over the live screen (search → confirm → next), shown once, dismissable forever, reachable from Help. No dead controls anywhere on the step. | `BRIEF` S1-3 (retires `CODE.step1-setup.1`) | P1 |

Behavior detail: pre-fill precedence survey > lead > blank; a survey-confirmed location behaves exactly as a manually confirmed one (relocation guard MS1-18 applies). Pack-driven lists render identically to the POC for IN tenants — this area's change is data sourcing, not UX. Edge cases: lead without phone (field blank, validation only on entry); survey exists but unconfirmed location (pre-fill pending pin, not confirmed); region with no utility list → generic "{Region} utility" entry (`CODE.step1-setup.9`).
Permissions: F2 studio rows; editing follows create-edit-designs. Acceptance criteria: Given a lead with a completed survey, When the designer opens a new design, Then Step 1 shows customer info + CONFIRMED surveyed location with provenance hints and every field editable (MS1-01); Given an IN tenant, When Step 1 renders, Then region/utility/tariff content equals the IN pack's shipped lists (MS1-03/04); Given a typed tariff edit, When auto-fill would re-derive, Then the manual value wins (MS1-05); Given first use, When Step 1 opens, Then the walkthrough offers and never returns after dismissal (MS1-08).
Further acceptance: Given an invalid phone for the market, When entered, Then an inline corrective error shows and other fields stay usable (MS1-02); Given no region chosen, Then the utility select is disabled with state-aware placeholder, and choosing a region enables it (MS1-04); Given a blank bill field, Then null (not 0) is stored and Step 4's suggestion treats it as absent (MS1-06).
Localization: field labels/hints via catalog (F3); pack data is market content. Analytics: step1_prefill_applied {source}, walkthrough_completed/dismissed.

### MS1.2 — System options

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS1-09 | Ground Mount is a normal, working option on EVERY plan — toggle functional, no PRO badge, no lock, no tier copy. The only capacity limit anywhere is the plan's design-kW ceiling at Save/Generate (Q28 law). | `BRIEF` S1-1 (fixes POC-DEFECT `CODE.step1-setup.11`) | P0 |
| MS1-10 | Site Type segmented control (Residential/Commercial) re-derives tariff on switch; Connection Type (Single/Three Phase); Sanctioned Load (kW, min 0, blank↔0 display rule) (`CODE.step1-setup.12–.14`). | `SRC-CODE` .12–.14 | P0 |

Edge cases: switching site type after manual tariff edit re-derives and OVERWRITES only if the user never edited (manual-wins rule MS1-05). Acceptance: Given any plan tier, When Step 1 renders, Then Ground Mount is enabled and functional (MS1-09); Given a site-type switch with no manual tariff edit, Then the tariff re-derives for the new type, and sanctioned load blank round-trips as 0 (MS1-10).

### MS1.3 — Company branding on this design

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS1-11 | The proposal logo comes AUTOMATICALLY from tenant branding (M01); Step 1 shows it read-only with "change for this project" as an optional override for co-branded work. No per-project upload prompt in the default flow. | `BRIEF` S1-2 (retires the default-flow half of `CODE.step1-setup.18–.20`) | P0 |
| MS1-12 | The override upload enforces the stated limits for real: 5 MB max and PNG/JPG validated on selection, clear error on violation; preview at the shipped constraints (max 70×200 px) (`CODE.step1-setup.19–.21`). | `BRIEF` S1-2 (fixes POC-DEFECT `CODE.step1-setup.21`) | P0 |

Acceptance: Given tenant branding exists, When a design is created, Then its proposal logo is the tenant's with zero designer action (MS1-11); Given a 12 MB file, When picked as override, Then a clear size error and no write (MS1-12).

### MS1.4 — Location entry

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS1-13 | Two entry methods, Search Address (default, Places-autocomplete, geometry-restricted) and Enter Coordinates; method switch detaches the search listener cleanly (`CODE.step1-setup.23/24`). | `SRC-CODE` .23/.24 | P0 |
| MS1-14 | Coordinates entry validates ranges (lat −90…90, lng −180…180) with a friendly corrective error ("longitude 745.81 isn't valid — did you mean 74.58?") and accepts Google-Maps-pasted formats; valid input sets the pending pin labeled at 5 dp (`CODE.step1-setup.27`). | `BRIEF` S1-5c (extends `.27`, resolves uncertain `.28`) | P0 |
| MS1-15 | Map viewport per POC: satellite, zoom 20 on first pin, user zoom preserved on re-centre, minimal UI (`CODE.step1-setup.29`); empty state and SDK-failure overlay keep the typed-coordinates path alive — a Maps failure never dead-ends Step 1 (`CODE.step1-setup.31/32/34`). | `SRC-CODE` .29/.31/.32/.34 | P0 |
| MS1-16 | Pin interaction: pointer users keep drag-map-under-fixed-pin with the "Drag map to adjust" pill; TOUCH adds tap-to-place (pin jumps) and direct pin drag (`CODE.step1-setup.30`, census SC.10-2.16 directive). | `BRIEF` S1-5a | P0 |
| MS1-17 | Maps SDK load failure shows "Couldn't load the map — Retry"; retry re-attempts in place (failure never memoized for the session) (`CODE.step1-setup.25`, resolves uncertain `.26`). | `BRIEF` S1-5d | P0 |

Acceptance: Given lat 999 typed, When Locate is tapped, Then the corrective error names the bad value and nothing breaks (MS1-14); Given a Wi-Fi blip broke Maps load, When Retry is tapped after recovery, Then address search works without reload (MS1-17); Given a phone, When the user taps the map, Then the pin moves there (MS1-16); Given a switch from Search to Coordinates, Then the autocomplete listener detaches and neither method leaks into the other (MS1-13); Given the SDK failed with a pin pending, Then the overlay explains it and Confirm still works from typed coordinates (MS1-15).

### MS1.5 — Confirm & the relocation guard

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS1-18 | Confirm Location (disabled until a pin pends) stores address/latLng/confirmed + built-in irradiance model values with the honest "±10% — verify" provenance until real data lands; live map centre wins over typed coords when the SDK loaded (`CODE.step1-setup.33–.35`). | `SRC-CODE` .33–.35 | P0 |
| MS1-19 | Relocation tolerance: re-confirming within 25 m NEVER wipes (survives map-relayout jitter); moving farther constitutes "new roof" (`CODE.step1-setup.36`). | `SRC-CODE` .36 | P0 |
| MS1-20 | BEFORE a >25 m wipe, a confirmation dialog names what will be cleared with counts ("1 roof, 24 panels, layouts…"); Cancel keeps everything; confirm proceeds with the POC's full wipe list and calibration reset, still undoable (`CODE.step1-setup.37/38`, census SC.10-2.20 directive). | `BRIEF` S1-5b | P0 |
| MS1-21 | Change Location un-confirms without destroying anything; pin, design and fetched data persist until a new confirm crosses the tolerance (`CODE.step1-setup.43`). | `SRC-CODE` .43 | P0 |

Acceptance: Given a design exists, When the pin moves 100 m and Confirm is tapped, Then the dialog lists the wipe with counts and Cancel preserves all (MS1-20); Given a re-confirm at 8 m, Then nothing is wiped or prompted (MS1-19); Given a pending pin with the SDK loaded, When Confirm is tapped, Then the live map centre is stored with the built-in irradiance provenance until real data arrives (MS1-18); Given Change Location then no further confirm, Then the design, pin and fetched data all persist (MS1-21).

### MS1.6 — Solar data & Site Intelligence (honesty surfaces)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS1-22 | Post-confirm fetches are decoupled and never block or clobber: weather (PVGIS-class source of record) upgrades irradiance/PSH with "Real irradiance — {source}" provenance; building-insights results discard if the pin moved (~0.11 m guard) or un-confirmed; each write preserves the other's data (`CODE.step1-setup.39/40/42`). | `SRC-CODE` .39/.40/.42 | P0 |
| MS1-23 | Site Intelligence card: loading, no-coverage and unreachable states in plain language ("manual design mode"); ok state shows provider badge, imagery-quality badge with tooltip, stats grid (max panels + ~kWp, roof area honoring the m/ft preference, sunshine h/yr, roof-face count — each hidden when absent), and the honest footer (imagery date or "date unknown" + "independent cross-check — Google's panel model may differ") (`CODE.step1-setup.44–.48`). | `SRC-CODE` .44–.48 | P0 |
| MS1-24 | Solar-data client behaviors as shipped: proxy-only access (key server-side), 10 s client timeout over the proxy's 8 s, typed never-throw results so the UI always explains the situation, non-2xx surfaced, coordinate-keyed memo (ok/unavailable cached as location facts; errors NOT cached — retryable), usable-segment filtering with no zero-filling and rounding rules per the mapping contract (`CODE.step1-setup.49–.55`). Detection metering rides BM-16/BM-19 (cited, not restated). | `SRC-CODE` .49–.55 | P0 |

Acceptance: Given PVGIS answers after Solar, When both land, Then neither overwrite loses the other's fields and provenance reads the real source (MS1-22); Given no coverage, Then the card says so plainly and design continues manual (MS1-23); Given the same pin re-confirmed, Then no re-billed insights call occurs (MS1-24).

### MS1.7 — Calibration & scale foundations (engine here; sheet UI in MS2)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS1-25 | Known-distance calibration: rejects degenerate inputs (≤0.05 m); factors COMPOSE on repeat calibration; the reference measurement stores rescaled (round-trips exactly); scaleFactor drives every imagery projector so corrected geometry sits exactly on the imagery (`CODE.step1-setup.61/64/65`). | `SRC-CODE` .61/.64/.65 | P0 |
| MS1-26 | Rescale covers ALL plan geometry — the POC set (roofs, obstructions incl. physical dims, panels, segments, keepouts, walkways, rails, arresters) PLUS grid-connection point and cable routes; physical user-entered values (heights, setbacks, walkway widths, panel specs) never rescale, so capacity is invariant and money re-derives consistently (`CODE.step1-setup.61–.63`). | `BRIEF` S1-5e (fixes uncertain `.63`) | P0 |
| MS1-27 | True-north offset rotates every sun sample exactly (offset 0 bit-identical to uncalibrated) and the canvas north badge; calibration invalidates the geometry fingerprint so all downstream numbers recompute — never stale (F8-12 family) (`CODE.step1-setup.66/67`). | `SRC-CODE` .66/.67 | P0 |

Acceptance: Given a second calibration, Then factors multiply (MS1-25); Given a placed grid-connection point, When calibration rescales, Then it lands at the true position and BOM cable money re-derives (MS1-26); Given northOffset 0, Then engine output is bit-identical to uncalibrated, and any calibration change invalidates the geometry fingerprint so downstream numbers recompute (MS1-27).

### MS1.8 — Shared satellite-canvas interaction contract (consumed by Steps 2/3/6)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS1-28 | Canvas frame: fixed logical viewport over the calibrated static tile; centre-origin metre coordinates; single shared zoom constant across 2D canvas, 3D ground and AI-detect tile math so every surface agrees on m/px (`CODE.step1-setup.98–.100`). | `SRC-CODE` .98–.100 | P0 |
| MS1-29 | Zoom/pan/click contract: wheel ×1.12 cursor-anchored, buttons ×1.25, clamps 0.55–5.0 with live % readout and Fit view; middle-drag always pans; ≥3 px = drag; clicks never fire from pans; tools capture gestures exclusively (`CODE.step1-setup.101–.107`). Pinch-zoom/two-finger pan on touch: census SC.10-3.42 records the gap — RULED at the canvas-owning sittings (MS2/MS6), not here. | `SRC-CODE` .101–.107 | P0 |
| MS1-30 | Presentation & trust chrome: imagery brightness/dim modes, honest pixelation above zoom 2.2, scale bar computed from the SAME px/m as hit-testing (can never disagree with geometry), north badge pointing TRUE north per calibration, role/aria labels on canvas and zoom cluster (`CODE.step1-setup.110–.114`, F7 a11y floor). | `SRC-CODE` .110–.114 | P0 |
| MS1-31 | Analysis-worker resilience contract (powers shading/health everywhere): one long-lived worker; id-keyed replies so superseded results NEVER apply to moved-past geometry; explicit supersession errors; crash → inline compute with IDENTICAL engine (slower-but-fresh, never silently stale — F8 spirit); SSR/no-Worker environments compute inline bit-identical (`CODE.step1-setup.90–.97`). | `SRC-CODE` .90–.97 | P0 |

Acceptance: Given a pan gesture, Then no click fires (MS1-29); Given a worker crash mid-shading, Then results keep flowing inline and nothing stale renders (MS1-31); Given zoom 3×, Then pixels render honestly pixelated and the scale bar matches hit-test geometry exactly (MS1-30); Given the 2D canvas, 3D ground and AI-detect tile math, Then all three use the same zoom constant and agree on metres-per-pixel (MS1-28).

## 4. Cross-module contracts

Consumes: M02 lead fields + M04 survey handoff (MS1-01); M01 tenant branding (MS1-11); F1 pack data — region/utility/tariff/phone/currency (MS1-03, MS1-02); BM-16/19 detection metering (MS1-24). Provides: confirmed location + irradiance provenance to MS2–MS9; calibration + canvas contract (MS1-25–31) to MS2/MS3/MS6; bill value to MS4's size suggestion. Engineering internals dispositioned as consumed-by-behavior, not independent requirements: geometry math helpers (`CODE.step1-setup.68–.74/.78–.85/.88/.89`) live under MS1-25–31's behaviors and MS2's drawing rules; setback-inset robustness semantics (`.75–.77`) surface as MS2 drawing law (cited forward); roof-polygon validation messages (`.86`) surface in MS2's drawing UI (rule source recorded here). The `dominantEdgeAngle` comment/formula nit (`.87`) is an engineering note (behavior self-consistent — no product requirement).

## 5. Non-goals

Per-project logo prompting in the default flow (S1-2) · the decorative tutorial banner (S1-3 replaces) · PRO/tier gating of Ground Mount or anything else (Q28) · India hard-coding of country/regions/utilities/tariffs (S1-6) · survey capture itself (M04's) · wizard chrome (MS12).

## 6. Open items

None — Sitting 1 closed with zero open questions (all 10 rulings recorded 2026-08-05).
