# M05 · Design Studio

Status: draft · Origin mix: SRC · Depends on: `00-README.md`, `01-product-overview.md`
(`OV-21`), `02-personas.md`, `foundations/F1-global-market-framework.md`,
`foundations/F2-roles-and-permissions.md`, `foundations/F3-localization.md`,
`foundations/F4-data-integrity.md`, `foundations/F7-design-language.md`,
`foundations/F8-data-honesty.md`, `modules/M01-onboarding-and-tenant-config.md`,
`modules/M02-crm-and-leads.md`, `modules/M04-survey.md` · Referenced by (forward):
`modules/M06-proposals.md` (component picker §M05.6, design outputs vocabulary),
`modules/M08-projects.md` (installation plan), `modules/M11-payments-and-collections.md`
(money path), `modules/M13-dashboards-and-reporting.md` (sign-off queue home) ·
Design-spec decisions consumed: DD12 (component-picker pattern — defined here), DD13
(this document is the census-grounded baseline; the studio deep-dive is pass two)

## 1. Purpose & scope

The 3D Design Studio is **the flagship of the product**. The source states it as conviction 1
and the owner's directive protects it absolutely: *"The 3D Design Studio is the flagship.
Nothing is compromised against it"* (`DOC00.studio-flagship`, dispositioned at `OV-21`; owner
directive 9). This module specifies the studio in which a designer turns a survey into a
buildable, sellable solar design: satellite-anchored roof tracing, obstruction modelling,
component selection, panel layout with real electrical stringing, shading simulation and a 3D
view, proposal captures, a single-line diagram and drawing sheets, a bill of materials that
**is** the proposal's money path, design variants with one recommendation, and a recorded
human engineer sign-off — from a 1 kW rooftop to a 100 MW park (§M05.15).

Two structural facts govern everything below:

1. **The census is the acceptance baseline.** `docs/product/studio-census.md` (canonical per
   owner ruling 2026-07-30, ADR-0017) is adopted **verbatim** as this module's acceptance
   baseline, read through the `_process/extraction/studio-census-checklist.md` post-overlay
   ledger. Every tool and every computed output listed there must survive, refactored to the
   design system and touch-first. **The census never shrinks** (design spec §3.2;
   `DOC14.census-quality-gate`: the census gate is a quality gate — if work runs long, scope is
   released elsewhere, *"NEVER census rows"*). Appendix A incorporates it entry by entry.
2. **This pass is the baseline; the deep-dive is pass two (DD13).** This document is written
   fully from the studio census, journey Stage 5 and the scale program. A dedicated second pass
   expands every feature area from the owner's separate studio repository into the complete
   enhanced Studio PRD, with the census as the cross-check between passes. Nothing here blocks
   on that repository; nothing in pass two may shrink what this baseline states (§6 M05-Q1).

The studio's screens **exist and are redesigned, not invented**: the working implementation has
real satellite imagery, roof tracing, shading simulation, 3D, auto-layout and a bill of
materials, and *"the engineering underneath is validated and must not be redesigned away"*
(`S5.rule.redesign-not-invent`; `D39` — kept and refactored: restyled to the design system,
given the touch model, hardened to production). "Low priority / design this last" in the source
(`D23`, `S5.rule.priority`) is **sequencing history, not scope**: the owner's directives make it
a move in time only, never in scope or quality, and per this suite's rules (design spec §14/DD4)
no build ordering appears in this document at all.

**Explicitly not this module:** the proposal builder and its documents
(`modules/M06-proposals.md` — this module hands it numbers, captures and honesty labels); the
catalog the picker browses (`modules/M01`, §M01.4); survey capture and AI-detection artifact
production (`modules/M04` — this module consumes the validated artifact); the tenant-side money
path beyond the BOM's totals (`modules/M11`); the customer-facing link that shows the one
recommended design (`foundations/F5`); platform entitlement gate mechanics (`modules/M12`);
execution of the installation plan (`modules/M08` — the plan is a studio exit that M08 owns).

## 2. Personas & surfaces

Personas (of the twelve in `02-personas.md`):

- **Design Engineer** — the primary persona, in both of its capacities. As **author** it holds
  `F2.M05.create-edit-designs` and lives in the studio end to end. As **reviewer** it holds
  `F2.M05.approve-designs` and works the sign-off queue (§M05.14) — subject to the author rule
  `F2-04`: the approver of a design is never its author, with the recorded one-person-tenant
  exception for the EPC Owner.
- **EPC Owner** — holds both capabilities (`F2.M05.create-edit-designs`,
  `F2.M05.approve-designs`); in a small tenant the owner is often both designer and approver.
- **Sales Manager / Sales Executive** — **read-only**. Sales roles reach designs through the
  lead (design cards on lead detail, `M02-32`), see variants and the recommendation, and open
  the read-only studio and 3D view; they never edit. Design visibility is not a new permission
  domain: it follows lead visibility (`F2.M02.lead-visibility`) exactly as survey visibility
  does — recorded in F2 §F2.5-M05's notes, no grant of its own.
- **Survey Engineer** — upstream: the hand-off it produced (`M04-63`/`M04-64`) is the studio's
  input; no studio grant.
- **Project Manager / Operations / Installation Team Member** — downstream consumers of the
  installation plan through `modules/M08`; the crew-facing surface carries **no money, ever**
  (`SC.10-11.13`, `F2-05`–`F2-07`).
- **Customer** — never in the studio. The customer sees the one recommended design and the
  read-only 3D share surface through `foundations/F5`'s tokenised link, and **never sees an
  unapproved design** (`SC.10-11.18`, `F8-28`).

Surfaces. The studio is one responsive surface with **full parity at the 375 px mobile viewport
and touch-first interaction** — the source calls this *"the hardest and least negotiable
commitment in the system"*, and it is already published law this module cites rather than
restates: `F7-30` (mobile-first, full parity, no reduced edition), `F7-32`/`F7-29` (touch-first;
the canvas gesture vocabulary), `F7-44` (the per-screen Definition of Done applies unreduced to
the studio). On mobile the studio is presented **inside the app as an authenticated WebView at
full parity** — native canvas editing is not rebuilt, and no studio feature is dropped on any
surface (`DOC03.webview-parity`; owner directive 9). Every keyboard-only control of the old
implementation has an on-screen equivalent (`SC.10-7.04`); old keyboard cheat-sheets fold into
per-step on-screen help (`SC.10-1.13`).

Concurrency: design mutations carry the single-editor version-check law at `F4-15`. §M05.2
states the studio-side behaviour; the law itself is F4's and is not restated here.

## 3. Feature areas

### §M05.1 — Studio shell & navigation (the nine-step wizard)

Census sections: Preamble/`SC.gate.01`–`SC.gate.04` · 10.1 `SC.10-1.01`–`SC.10-1.20`
(design-list entries `SC.10-1.02`/`SC.10-1.03` are specified at §M05.13; Save `SC.10-1.11` at
§M05.2).

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-01 | **The census is this module's acceptance baseline, incorporated by reference as Appendix A, and it never shrinks.** Every census entry is a binding acceptance item for the studio; the appendix maps every entry to the feature area that carries it. A change that would drop, downgrade or quietly reword a census behaviour is out of order at any time, in this pass or pass two. | `SRC` — `SC.gate.01`–`SC.gate.04` (canonical, ADR-0017; merge-gate framing carried as an acceptance-gate statement per §14/DD4); `DOC14.census-quality-gate` ("the census never shrinks"); `D39`; design spec §3.2 | P0 |
| M05-02 | **The wizard presents nine visible steps; no user-visible "step 5" ever exists.** Steps: Project setup · Roof · Obstructions · Components · Panel layout (auto-placement folded in) · Proposal captures · SLD & drawings · BOM & pricing · Done. The step indicator reads "n / 9"; internal step identifiers stay stable across the fold so nothing renumbers underneath. | `SRC` — `R7` (verbatim: 9 visible steps, "no user-visible 'step 5' ever exists"); `DOC05.wizard-9-steps`; `SC.10-1.04`/`SC.10-1.06` (post-overlay); `S5.rule.existing-steps`; `S5.rule.uxprob.3` (resolved by R7) | P0 |
| M05-03 | **Every step carries one of four states — not started / in progress / done / has errors — and navigation is always visible.** Mobile: compact indicator ("n / 9 · <step> ‹ ›") opening a step-list sheet; desktop: a step rail. Back navigation and re-entry into completed steps are always available. | `SRC` — `SC.10-1.05`, `SC.10-1.06` (post-R7), `SC.10-1.07` | P0 |
| M05-04 | **One header system, everywhere in the studio:** back · step title · Design Health chip · units toggle (m/ft, global across the studio) · Save · Save & exit to lead · Help (per-step, plain language) · Next/Done. The three unrelated v1 header systems are retired. | `SRC` — `SC.10-1.07`–`SC.10-1.14`; `UXG-21` (single header, consolidated shell); `S5.rule.uxprob.4` | P0 |
| M05-05 | **Per-step Next gates state their reason in plain language, and the electrical hard gate is deliberate law.** A blocked Next always says why ("Draw at least one roof", "Fix the string design before continuing"). The studio **keeps** step gating: an invalid string design blocks the layout step's Next (§M05.7, M05-42). This is a ruled asymmetry with the proposal builder's free navigation (`R12` applies free navigation to the proposal builder only — `modules/M06`'s half); the two must never be normalised into one behaviour. | `SRC` — `SC.10-1.15`, `SC.10-1.16`; `R12` (consequence, verbatim: "The **studio's electrical hard gate stays** … it protects a physical system, not form completeness") | P0 |
| M05-06 | **Design Health: a score /100 with band Good / Fair / Poor across energy, electrical and roof-utilisation, always one tap away.** The health sheet shows per-category scores, specific deductions ("−8 · off-south orientation"), and a "what changed since last save" delta. While shading recalculates, Design Health shows a **provisional** state — it never presents a stale score as current. | `SRC` — `SC.10-1.17`–`SC.10-1.20`; provisional labelling per `F8-12`/`F8-17` (cited, not restated) | P0 |
| M05-07 | **The studio never opens blank: every surface has explicit loading, empty and error states.** No screen shows a blank canvas until data hydrates; the Definition of Done (`F7-43` item 2, applied unreduced to the studio by `F7-44`) is cited as the binding contract. | `SRC` — `S5.rule.uxprob.5` ("no loading states — blank screen until data hydrates" is the named v1 failure); `DOC10.studio-dod` (studio half — the DoD applies unreduced; the principle half is `F7-44`) | P0 |
| M05-08 | **Touch-first at 375 px with full parity is a property of every feature area in this module, including the canvases.** Mode-based tools instead of modifier keys; large handles on selection; snap and nudge instead of pixel-accurate drags; on-screen equivalents for every keyboard-only control; the studio presented on mobile as the authenticated full-parity WebView. This row exists so the commitment is testable per studio surface; the laws are `F7-30`/`F7-32`/`F7-29`/`F7-44`, cited not restated. | `SRC` — `DOC03.webview-parity` ("native canvas editing is NOT rebuilt"; "No studio feature dropped on any surface"); `S5.rule.uxprob.2` (desktop-only throughout is the named v1 failure); `UXG-22` (studio half — mode toolbar and gesture layer; the contract half is `F7-29`); `CG-matrix.2` (studio half — the capability that makes "full design parity on mobile" a true competitive claim; design-language half `F7-30`/`F7-32`) | P0 |

**Behavior detail.** The studio opens from a lead's design list ("Create design" on lead detail,
`M02-32`; the list itself is §M05.13). The shell is one continuous editor: the wizard's nine
steps are stages of one design record, not separate documents. Help is per-step and in plain
language; the old keyboard cheat-sheets fold into it (`SC.10-1.13`). The units toggle is global:
m/ft applies to every measurement in every step the moment it changes (`SC.10-1.10`,
`SC.10-4.09`). Next/Done advances only through that step's gate (M05-05); Back and the step
sheet/rail move freely between visited steps — gating controls *advancing past invalid work*,
never *revisiting*.

**Permissions.** Editing requires `F2.M05.create-edit-designs` (EPC Owner, Design Engineer).
Sales roles open the same shell read-only through lead visibility (F2 §F2.5-M05 notes); every
mutating control is absent in read-only mode, not disabled-without-explanation.

**Edge cases & what-goes-wrong.**
- Blank-until-hydrated (`S5.rule.uxprob.5`): forbidden by M05-07; each step declares its
  loading skeleton.
- Three header systems (`S5.rule.uxprob.4`): retired by M05-04.
- Phantom step 5 (`S5.rule.uxprob.3`): resolved by `R7`; carried at M05-02.
- A step with errors is enterable and clearly marked; the error state names what is wrong
  (M05-03, M05-05).

**Acceptance criteria.**
- Given any census entry of Appendix A, when the studio is acceptance-tested, then the
  behaviour the entry describes is present, and removal of any entry fails acceptance (M05-01).
- Given a design in any state, when the wizard is displayed, then exactly nine steps are
  visible, the indicator reads "n / 9", and no surface anywhere names a "step 5" (M05-02).
- Given a step whose gate fails, when Next is attempted, then the studio states the reason in
  plain language and does not advance (M05-05).
- Given a shading recalculation in progress, when the Design Health chip is read, then it shows
  a provisional state, and the sheet shows per-category scores, deductions and the since-last-
  save delta once current (M05-06).
- Given a 375 px viewport, when any shell control is used, then it is reachable by touch with
  no horizontal scrolling and no keyboard-only path (M05-08).
- Given a visited step that has errors, when the step sheet or rail renders, then that step
  shows the has-errors state and remains enterable (M05-03).
- Given any studio step, when the header renders, then it is the one header set of M05-04 —
  no step anywhere shows a different header system (M05-04).
- Given a slow connection, when any studio surface loads, then an explicit loading state
  renders and no blank canvas appears before hydration (M05-07).

**Localization notes.** All shell copy in EN/HI/MR through `foundations/F3`; step names,
gate reasons and health deductions are message-catalog strings, never concatenated fragments
(`F3-16`). Units render per the global toggle; numbers per `F3-19`.

**Analytics events.** `studio.opened`, `studio.step_viewed`, `studio.step_gate_blocked`
(reason key), `studio.health_sheet_opened`, `studio.units_toggled`.

### §M05.2 — The design record: saving, versions, freshness

Census sections: 10.1 `SC.10-1.11` (Save) · design-record laws from docs/04–05 read through
`foundations/F8` and `foundations/F4`.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-09 | **Design mutations fail fast; a stale save is refused, never merged.** Every save carries the version it was based on; a mismatch is refused, the client reloads server state, and the user re-applies the change. No merge exists, and a failed save says so honestly at the attempt — never a silent no-op, never an optimistic result. | `SRC` — `R14` (M05 half: "design mutations (single-editor LWW + server version check)"); `F4-15` (the law, cited: "No merge, ever"); `DOC06.designs-not-mobile-offline` (studio half — the editor's stale-save reload behaviour); `SC.10-1.11` | P0 |
| M05-10 | **Every design pins its inputs, and staleness is derived by comparison — never a flag someone flips.** The design records the catalog release, price-book version, market-pack rules version and computation-engine versions it used; publishing a newer catalog release or pack revision **self-stales** every design pinned to an older label. The studio surfaces staleness wherever the affected numbers appear, with the specific newer input named. | `SRC` — `M01-43` (release pinning + self-staling, consumed as published requirement); `F8-13`/`F8-14` (staleness-by-comparison and the pin set, cited — `DOC04.design-freshness-pins`/`DOC05.fingerprint-self-stale` were dispositioned there); `F1-11` (pack versioning, cited) | P0 |
| M05-11 | **A design edited after its proposal exists makes that proposal's pricing visibly stale — the studio's side of the money-never-stale law.** The design surfaces "a proposal was built on an older version of this design" wherever it matters (Done step, BOM, captures review), and the proposal-side staleness display is `modules/M06`'s. Figures inside an already-sent document never move (`F8-15`, cited). | `SRC` — `S5.wrong.7` ("its pricing goes stale and must visibly say so"); `F8-13`/`F8-15` (cited) | P0 |
| M05-12 | **Entitlement checks touch the studio only at save/creation and at proposal Generate — never mid-edit. The flagship is never interrupted per-keystroke, and existing designs always open.** Gate mechanics, ceilings and upgrade prompts are `modules/M12`'s; this module's law is the placement: no entitlement denial ever interrupts editing, blanks a canvas or locks an open design. **The tension is resolved (owner ruling 2026-08-04, Q28): zero feature gates exist in the studio** — the kW ceiling per tier is the **only** gate, enforced exactly at these checkpoints, and over-ceiling designs stay readable forever; the census's no-tier-gate rule holds as law with the ceiling as its single sanctioned boundary. | `SRC` — `DOC16.gate.design-kw` (M05 half: "NEVER mid-edit … the flagship is never interrupted per-keystroke"; "existing designs always open"; gate mechanics `modules/M12`); `SC.10-2.14`/`SC.10-6.66` reconciled per owner ruling 2026-08-04 (Q28) | P0 |
| M05-13 | **When a newer survey version supersedes the one a design was built from, the studio marks the design "survey updated — review needed" and notifies the designer — and applies nothing automatically (owner ruling 2026-08-04, Q24).** The design shows the review-needed banner naming the superseding version and the fields that differ in provenance or value; the designer reviews and chooses what to apply. **Draft proposals built on the design are blocked from SENDING until the review clears; sent proposals stay pinned and never mutate** (`F8-15`). The same self-stale pattern as catalog releases. | `SRC` — `M04-66` (consumed: newer facts available and visibly newer, nothing rewritten automatically); `F8-13`/`F8-14` (comparison surfaces, cited); reconciliation policy per owner ruling 2026-08-04 (Q24), replacing the former deferral | P0 |

**Behavior detail.** Save and Save & exit are explicit acts (`SC.10-1.11`, `SC.10-1.12`); the
refused-stale-save flow is: refuse → plain message naming the cause (someone else saved, or this
tab went stale) → reload server state → the user re-applies. Nothing is durable until a
save succeeds, and the product never claims otherwise. Freshness surfaces (M05-10, M05-11,
M05-13) all follow one pattern: the affected number or surface carries the staleness marker,
the marker names *what* is newer, and remedy is one tap away — never a silent recomputation.

**Permissions.** Saving requires `F2.M05.create-edit-designs`. Staleness notices are visible to
read-only viewers too — honesty is not permission-gated.

**Edge cases & what-goes-wrong.**
- Two editors, one design: the second save is refused with the reload flow (M05-09); no work is
  silently lost and no merge is attempted.
- Catalog release published while a design is open: the design self-stales on comparison; the
  open session learns of it at its next save/recompute surface (M05-10).
- Design edited after proposal sent: proposal pricing goes visibly stale (`S5.wrong.7`,
  M05-11); the sent document's figures never move.
- Survey superseded after design started: "survey updated — review needed" marker with named
  differences, designer notified, drafts blocked from sending until review, sent pinned;
  nothing auto-applied (M05-13, owner ruling 2026-08-04 Q24).

**Acceptance criteria.**
- Given a design saved from another session, when this session saves, then the save is refused,
  server state is reloaded, and the user's change must be re-applied — no merge (M05-09).
- Given a design pinned to catalog release N, when release N+1 is published, then the design
  reports itself stale by comparison and names the release (M05-10).
- Given a proposal built on design v3, when the design reaches v4, then the studio surfaces the
  staleness and the sent proposal's figures are unchanged (M05-11).
- Given an entitlement denial, when it fires, then it fires at save/creation or Generate with
  the module-M12 prompt, and an open design never locks mid-edit (M05-12).
- Given a superseding survey version, when the design is opened, then the review-needed marker
  names the version and differing fields, the designer was notified, no design value has
  changed by itself, and a draft proposal on the design cannot send until the review clears
  (M05-13, owner ruling 2026-08-04 Q24).

**Localization notes.** Staleness and refusal copy localized; version labels and dates per
`F3-19`/`F3-22`.

**Analytics events.** `design.saved`, `design.save_refused_stale`, `design.self_staled`
(input kind), `design.survey_superseded_notice_shown`.

### §M05.3 — Step 1 · Site setup & location

Census section: 10.2 `SC.10-2.01`–`SC.10-2.20`.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-14 | **The step pre-fills from the survey hand-off and everything is editable.** Address, location, site details and captured values arrive from the submitted survey (`M04-63`) with their provenance tiers intact, and the designer sees what the survey knows *and does not know* with equal prominence (`M04-64`): flagged gaps, skipped items, access constraints, structural observations. An edit that changes a value's provenance shows the change before it commits. | `SRC` — `SC.10-2.01`; `M04-63`/`M04-64` (consumed); tiers per `F8-02`/`F8-05` (cited) | P0 |
| M05-15 | **The setup form carries the census field set, market-neutrally keyed.** Project name; customer name and phone; country/market and region; **utility** (the market pack's own label — sets the default tariff from pack data); site type Residential/Commercial; connection Single/Three phase; sanctioned load (kW); electricity tariff per kWh (auto-filled from the utility default, editable); average monthly bill (feeds the Step-4 size suggestion); company logo upload (max 5 MB, PNG/JPG — tenant branding per `M01`'s rules); ground-mount / open-access as a normal option. Currency and tariff data come from the tenant's market pack; no market's names appear in this module's body. | `SRC` — `SC.10-2.02`–`SC.10-2.14`; `F1-01`/`F1-19`-family pack keys (utility naming per `R2` amendment carried at F1; the IN pack's labels and tariff table are F1's data); segment flag per `D1` (census note) | P0 |
| M05-16 | **Location: search with autocomplete or exact coordinates, then a touch-honest pin on the satellite canvas.** Pin placement is redesigned for touch (the v1 fixed-pin/drag-map-underneath pattern is the named failure); the designer still lands on the exact roof, with zoom. The imagery tile the design is traced on is **pinned at capture: it never changes underneath the design.** Tile fetch failure still opens the studio — blank canvas plus manual calibration (§M05.4) — it never blocks. | `SRC` — `SC.10-2.15`, `SC.10-2.16`; `DOC07.map-tile-pinned` (studio-canvas half: "the tile a design was traced on never changes under it"; "Never blocks" — the survey-side pin is `M04-10`/`M04-11`) | P0 |
| M05-17 | **Confirming the location produces the Solar Data card, and its figures obey the energy source-of-record ladder.** The card shows irradiance (kWh/m²/day), peak sun hours and a source label. The market's **energy source of record** supplies the figures where available — v1 reference implementation: PVGIS with its documented database ladder (SARAH3 → ERA5) — labelled per `F8-08`'s fixed copy; the built-in latitude-fit fallback is always labelled "±10%". The source is never switched silently (`F8-09`, cited). | `SRC` — `SC.10-2.17`; `R5` (M05 half — the source-of-record ruling and its database ladder: "PVGIS is the energy source of record (SARAH3 → ERA5 ladder)"; labels are `F8-08`/`F8-09`'s, metering `modules/M12`'s); vendor-as-reference-implementation per `F1-43`'s pattern | P0 |
| M05-18 | **Site Intelligence is an asynchronous enhancement with four honest states — loading / unavailable / unreachable / ok — and never a dependency.** In its "ok" state it shows max panels (~kWp), roof area, sunshine h/yr, roof faces, imagery date and quality (HIGH/MED/BASE). Every path it serves works without it; its absence is stated, not styled as an error. | `SRC` — `SC.10-2.18`, `SC.10-2.19`; `R5` ("Google Solar is an enhancement — never a dependency", carried vendor-neutrally: building-insights-class site intelligence, v1 reference implementation per `M04-09`'s pattern) | P0 |
| M05-19 | **Relocating the pin more than 25 m wipes the whole design — kept as a guard, made a clear, undoable confirmation.** The confirmation states exactly what will be lost (roofs, obstructions, panels — everything traced against the old tile); it is never a silent reset, and it is undoable. | `SRC` — `SC.10-2.20` (verbatim guard; "clear undoable confirmation, not a silent reset") | P0 |
| M05-20 | **The sanctioned-load soft cap warns and never blocks.** Auto-design and manual design may exceed the sanctioned load captured by the survey (`M04-45`); doing so raises a warning naming the actual limit — *"this is a real approval blocker"* — because exceeding it jeopardises the market's approval process (the rule content is pack data). The design remains editable and savable; the warning travels to readiness (§M05.9) and the market compliance checklist (§M05.11). | `SRC` — `DOC04.sanctioned-load` (M05 half — the soft cap read; capture is `M04-45`); `DOC05.auto-design-soft-cap` ("design can exceed it, with warning"); `S5.wrong.3` (verbatim) | P0 |
| M05-21 | **A design cannot start from nothing and pretends nothing: an incomplete survey blocks design start with the exact missing items and who to ask.** The block screen lists each missing prerequisite by name, its owner (who to ask), and the fastest route to resolve — never a bare "survey incomplete". *(Amended by owner ruling 2026-08-16, register `Q67`: **the prerequisite set is what the release actually offers, not a fixed list.** The V1 scope lock defers all ten `M04` survey screens to V2, so in V1 there is no survey to be complete or incomplete and this row must not gate design start on one — it would make the entire studio unreachable. What the row still binds, unchanged, is the **honesty of the block**: where a prerequisite the release does offer is genuinely missing, the screen names it, names its owner and names the fastest route, never a bare refusal. In V1 that set is the site-type and connection fields the studio collects for itself in Step 1; from V2 it is the submitted survey again. **The accepted consequence, stated plainly:** a V1 design starts from less site data than this module was written to assume, and the studio's own roof drawing carries what the survey would have supplied.)* | `SRC` — `S5.wrong.1` ("show exactly what is missing and who to ask") | P0 |

**Behavior detail.** The step is the studio's front door for a lead whose survey is submitted;
M05-21's block is the honest front door for one that is not. Site-type and connection fields
drive downstream behaviour (segment flag through lead/proposal per `D1`; phase feeds inverter
recommendation §M05.6 and SLD §M05.10). Ground-mount / open-access is offered as a normal
option; where a capability behind it is not yet functional the option says "coming soon" —
never an upgrade prompt (`SC.10-2.14`; confirmed as law by owner ruling 2026-08-04, Q28 —
zero feature gates in the studio, M05-12). The Solar Data
card's label upgrades from the fallback to the source-of-record label when the fetch completes
(`SC.10-2.17`) — per figure, never per screen (`F8-09`).

**Permissions.** `F2.M05.create-edit-designs` to edit; read-only roles see the completed card.

**Edge cases & what-goes-wrong.**
- Survey incomplete → design cannot start; exact missing items and who to ask (M05-21,
  `S5.wrong.1`).
- Site Intelligence unavailable/unreachable → honest state, no dependency, everything else
  proceeds (M05-18).
- Tile fetch fails → blank canvas + manual calibration; never blocks (M05-16).
- Pin relocated >25 m → wipe guard confirmation, undoable (M05-19).
- Sanctioned load exceeded → warning with the actual limit; never a block (M05-20).
- Energy fetch fails → fallback figures labelled "±10%"; never silently switched back (M05-17).

**Acceptance criteria.**
- Given a submitted survey, when Step 1 opens, then carried values show with provenance and the
  gaps list is as prominent as the values (M05-14).
- Given a tenant of any market, when the form renders, then utility/tariff/currency labels and
  data come from the market pack and no other market's terms appear (M05-15).
- Given a confirmed location with the source of record reachable, when the Solar Data card
  renders, then figures carry the `F8-08` source label naming the database; given it
  unreachable, then figures carry "±10%" and never switch silently (M05-17).
- Given a pin move >25 m, when confirmed, then the design resets with an undo available; when
  cancelled, nothing changes (M05-19).
- Given a design exceeding sanctioned load, when the overrun occurs, then the warning names the
  captured limit and the design remains editable (M05-20).
- Given a tile fetch failure, when the studio opens, then the canvas opens blank with manual
  calibration offered, and nothing blocks (M05-16).
- Given Site Intelligence in any of its four states, when the card renders, then the state is
  named honestly and no design step depends on the result (M05-18).
- Given an incomplete survey, when design start is attempted, then the block screen lists each
  missing item by name and who to ask (M05-21).

**Localization notes.** Field labels and pack-supplied labels per `F3`/`F1-21`; currency and
number formats per `F3-19`; the utility label is the pack's own word (`F1` carries it).

**Analytics events.** `studio.step1_prefilled`, `studio.solar_data_fetched` (source),
`studio.site_intel_state` (state), `studio.pin_move_wipe_confirmed`,
`studio.sanctioned_load_warning_shown`, `studio.design_start_blocked` (missing-item keys).

### §M05.4 — Step 2 · Roof drawing (touch-first CAD)

Census section: 10.3 `SC.10-3.01`–`SC.10-3.42`.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-22 | **The mode toolbar carries the census tool set:** Select · Draw roof · Detect roofs (AI) · Ortho-snap toggle · Show all measurements · Measure distance · View in 3D · Undo · Redo. Tools are modes (touch-first), each with a visible active state. | `SRC` — `SC.10-3.01`–`SC.10-3.09` | P0 |
| M05-23 | **AI roof detection enters the canvas only through the validated artifact, appears as ghosts, and stamps provenance.** The detection capability (roof-data pipeline: outline, pitch, azimuth, eave height, obstructions, per-shape confidence; photo-fallback returning shapes only) is consumed as `modules/M04`'s validated artifact (`M04-65`) — the studio never reads a raw detector. Results render as **ghosts** distinct from committed geometry: tap to include/exclude, align nudge, "add selected" commits as one undo step, imagery quality/date shown, dropped shapes warned with reasons. Applying stamps each entity's provenance (manual / AI-detected + confidence) so the UI can say "N AI-detected entities — dimensions are detector estimates". | `SRC` — `SC.10-3.10`–`SC.10-3.12`; `DOC05.ai-doorway` (M05 half — applying the artifact and stamping entity provenance; artifact production/validation is `M04-24`/`M04-65`); `UXG-23` (ghost review contract, verbatim); `CG-matrix.4` (studio half — the in-canvas detection surface; the survey-side review is `M04-15`/`M04-16`); `R5` (enhancement-only; fallback shapes-only) | P0 |
| M05-24 | **Drawing and editing are the census's touch CAD, whole:** tap-corner drawing with live edge labels; CAD snapping (angle-relative, object-snap, guide rays, right-angle marks, visible snap on/off); close-shape confirm; undo/last-point-remove; too-close points rejected with a plain message; tap-select with big handles — move/insert/delete vertex, move roof, rotate with 15° snap; tap an edge length to type exact metres; per-roof actions (roof type, height & parapet, exact vertex X/Y, duplicate); a roof list chip per roof (select · lock · delete, with area). | `SRC` — `SC.10-3.13`–`SC.10-3.29` | P0 |
| M05-25 | **Roof type and geometry sheets carry the census option sets:** RCC flat · Metal shed · Tile · Ground array, plus Pitched gable (2 faces) / Pitched hip (4 faces) with ridge direction where the footprint allows; disabled options explain why. Height & parapet: height-from-ground; detected pitch/azimuth suggestion banner (apply/dismiss — suggestion only); pitch; "slopes toward" picker with compass and "south is best" tip (directional tips render per site hemisphere/market); edge setback (uniform + per-edge); parapet-wall chain (direction, height, width, auto-skip shared walls, per-side tap). | `SRC` — `SC.10-3.30`–`SC.10-3.38`; `R5` (suggestion never a dependency) | P0 |
| M05-26 | **Calibration: measure two points, enter actual metres, and the studio applies a scale correction (plus an expert north offset), rescaling all geometry.** This is also the no-tile fallback path (M05-16): a design is traceable and correctable without imagery. | `SRC` — `SC.10-3.39`; `DOC07.map-tile-pinned` (fallback: "manual calibration (known-distance rescale)") | P0 |
| M05-27 | **The dependent-items guard: a geometry change that orphans downstream items offers "keep current / keep for review / remove invalid" — never a silent cascade.** | `SRC` — `SC.10-3.40` | P0 |
| M05-28 | **Every roof carries provenance (manual / AI-detected + confidence) within the four-tier vocabulary, and pinch-zoom + two-finger pan are added to the canvas.** The pinch/pan addition is the census's own recorded port-time addition, not an existing behaviour. | `SRC` — `SC.10-3.41` (tiers per `F8-02`, cited — no fifth tier), `SC.10-3.42` | P0 |
| M05-29 | **The survey's photographs ride alongside the canvas as the designer's reference — and are never measured from.** Roof, obstruction and surroundings photos from the survey (on site, customer-sent or uploaded) are viewable while tracing and placing; every dimension is still entered by a person. | `SRC` — `S5.rule.photos` (verbatim; `D35`); `M04-54` (tags/pins consumed) | P0 |

**Behavior detail.** Drawing rejects degenerate input with plain messages rather than silently
"fixing" it (M05-24). The detected-pitch banner (M05-25) is dismissible and inert until applied.
Locking a roof (roof list chip) freezes its geometry against accidental edits. The guard flow of
M05-27 lists the orphaned items by name (panels, obstruction placements, strings) with the three
choices; "keep for review" marks them for the validation surface (§M05.7). All canvas
interactions follow the one gesture vocabulary (`F7-29`, cited).

**Permissions.** `F2.M05.create-edit-designs`. Running in-canvas AI detection additionally
requires `F2.M05.run-roof-detection` (it consumes the metered detection capability; manual
tracing is never metered — the meter and allowance mechanics are `BM-19`/`modules/M12`'s).

**Edge cases & what-goes-wrong.**
- Detection unavailable or allowance denied → manual tracing always available, never metered;
  the denial is honest (`M04-21` pattern; gate mechanics M12).
- Detection wrong → ghosts are rejectable per shape; nothing applies silently (M05-23).
- Dropped shapes → warned with reasons, not silently absent (M05-23).
- Too-close points → rejected with a plain message (M05-24).
- Geometry edit orphans downstream work → three-way guard (M05-27).
- No imagery tile → blank canvas + calibration; never blocks (M05-16/M05-26).

**Acceptance criteria.**
- Given a detection result, when it renders, then ghosts are visually distinct, each carries
  confidence, include/exclude is per shape, and "add selected" is one undo step (M05-23).
- Given an accepted ghost, when it commits, then the roof's provenance reads AI-detected with
  its confidence, within the four tiers (M05-23, M05-28).
- Given a drawn roof, when an edge label is tapped, then exact metres can be typed and the
  geometry updates (M05-24).
- Given two measured points and an entered distance, when calibration applies, then all
  geometry rescales and the correction is recorded (M05-26).
- Given a vertex edit that orphans panels, when it is confirmed, then the keep/review/remove
  choice is offered and honoured (M05-27).
- Given the roof step, when the toolbar renders, then all nine census tools are present as
  modes with a visible active state (M05-22).
- Given a footprint that cannot take a pitched roof type, when the roof-type sheet renders,
  then the disabled option explains why (M05-25).
- Given survey photographs, when tracing, then they are viewable beside the canvas and no
  dimension is ever derived from them (M05-29).

**Localization notes.** Tool names, sheet options, guard copy localized; measurements per the
global units toggle; compass directions localized.

**Analytics events.** `studio.roof_drawn`, `studio.ai_detect_run` (path), `studio.ghost_review`
(accepted/rejected counts), `studio.calibration_applied`, `studio.dependent_guard_shown`
(choice).

### §M05.5 — Step 3 · Obstructions

Census section: 10.4 `SC.10-4.01`–`SC.10-4.42`.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-30 | **The obstruction canvas always shows the census's standing set:** Step-2 roofs as a read-only backdrop (fill + red-dashed setback inset); every obstruction to scale with a constant-size ID chip (type code + number, e.g. WT1, TR2); a red-dashed setback ring per blocking object; north indicator; graphic scale bar; zoom in/out + live % + fit; free pan/zoom except while placing or mid-drag; undo/redo (one gesture = one step); units. | `SRC` — `SC.10-4.01`–`SC.10-4.09` | P0 |
| M05-31 | **Five tools, exactly:** Add obstruction (badge = count) with type picker · Show/Hide obstructions (also clears selection) · Show all measurements · Measure distance (restart clears prior) · Open 3D view (returns). | `SRC` — `SC.10-4.10`–`SC.10-4.14` | P0 |
| M05-32 | **The type picker carries the census's eleven types with their icons, names and default L×W×H dimensions** — Tank WT 2×1.5×1.2 · Dish DS 1×1×1.2 · Chimney CH 0.8×0.8×2 · Tree TR 3×3×5 · Elevated EL 3×2.5×2.6 · Building BL 8×6×9 · Solar WH SW 2×1.2×1.5 · Ladder LD 0.6×1.5×3 (BETA marker) · Windmill WM 1.8×1.8×3.5 · Turbine Vent TV 0.4×0.4×0.5 · Other OB 1.5×1.5×1. Choosing a type enters a cancellable touch placement mode with on-screen instruction; the next tap drops it at default size; the app auto-detects the owning roof (or "on ground") and auto-names (WT1, WT2…). | `SRC` — `SC.10-4.15`–`SC.10-4.17` (the desktop "Click … Esc" wording refactored touch-first per the census's own note; capability unchanged) | P0 |
| M05-33 | **Direct manipulation with the census constraints:** move (grab point under finger, roof re-checked on release) · resize rectangle (4 corner handles) · resize circle (1 handle, diameter) · rotate (stem handle, 15° snap or free) · **no dimension below 0.3 m** · a locked object cannot move/resize/rotate. Precision without a mouse: fine and larger nudge steps, rotation in exact degrees. | `SRC` — `SC.10-4.18`–`SC.10-4.23`, `SC.10-4.31` | P0 |
| M05-34 | **Exactly seven context actions:** Duplicate (offset copy, recomputes roof) · Shape (Rectangle L×W / Circle diameter, switchable) · Size & rotation (typed exactly: L/W/H or diameter/H; rotation 0–359° in 1° steps) · Settings · Lock/Unlock · Delete · Deselect. | `SRC` — `SC.10-4.24`–`SC.10-4.30` ("exactly seven"), `SC.10-4.32`, `SC.10-4.33` | P0 |
| M05-35 | **Settings carry the census's physics-honest chain:** height drives shadow and bridging maths; SETBACK 0–3 m in 0.1 m steps (draws the ring; "buffer zone where panels cannot be placed"); CASTS SHADOW on/off; BLOCKS PANEL PLACEMENT on/off revealing the nested bridging chain — Panels may bridge above on/off; Must remain open to sky on/off, revealing Clearance 0–1 m in 0.05 m steps with the live calc ("Bridgeable when the array structure clears X m (its Y m + margin)") **and a warning that bridging is flagged for engineer confirmation**; CONVERT TO ROOFTOP PLATFORM (one-tap replacement with a "{label} platform" roof at combined height, stating structural adequacy needs engineer verification; unavailable-with-reason when the top is too small); HEIGHT INFORMATION read-only (owning roof or "On ground", base height, top-from-ground). | `SRC` — `SC.10-4.34`–`SC.10-4.41`; engineer-confirmation flags feed §M05.14 and obey `F8-25`/`F8-26` (cited) | P0 |
| M05-36 | **Everything derived updates live:** owning roof (re-checked on move), base/top heights, required bridging clearance, setback ring size, total count. | `SRC` — `SC.10-4.42` | P0 |

**Behavior detail.** The Ladder type keeps its BETA marker — the census carries it as part of
the entry (M05-32). Show/Hide is a viewing aid and never deletes. The bridging chain's warning
is the honesty surface: a bridged obstruction is a structural claim a human must confirm, so the
flag rides into sign-off (§M05.14). Convert-to-platform states its engineer-verification need in
the same breath as its convenience.

**Permissions.** `F2.M05.create-edit-designs`.

**Edge cases & what-goes-wrong.**
- Obstruction moved to another roof → ownership re-checked on release; height maths update
  (M05-33/M05-36).
- Dimension typed below 0.3 m → refused with the constraint stated (M05-33).
- Platform top too small to convert → option unavailable **with the reason shown** (M05-35).
- Locked object → manipulation refused, lock stated (M05-33).

**Acceptance criteria.**
- Given the type picker, when opened, then all eleven types show with defaults, and Ladder
  carries its BETA marker (M05-32).
- Given a placed obstruction, when settings open, then setback/shadow/blocking controls appear
  and the bridging chain reveals per the census nesting with the engineer-confirmation warning
  (M05-35).
- Given a rotation typed as 37°, when applied, then the object sits at exactly 37° (M05-34).
- Given any move, when released, then owning roof, heights, ring and count are current
  (M05-36).
- Given the obstruction step, when the canvas renders, then the whole standing set of M05-30
  is present (read-only roofs, ID chips, setback rings, north, scale bar, zoom, undo/redo,
  units) (M05-30).
- Given the toolset, when counted, then exactly five tools exist and Show/Hide also clears the
  selection (M05-31).
- Given a resize below 0.3 m or a manipulation of a locked object, when attempted, then it is
  refused with the constraint stated (M05-33).

**Localization notes.** Type names localized; ID chips keep their short codes; dimensional
copy per units toggle.

**Analytics events.** `studio.obstruction_added` (type), `studio.obstruction_bridging_set`,
`studio.obstruction_converted_platform`, `studio.obstruction_count`.

### §M05.6 — Step 4 · Components, and the shared component-picker pattern (DD12)

Census section: 10.5 `SC.10-5.01`–`SC.10-5.41`. **This section defines the product's one
component-picker pattern.** `modules/M06-proposals.md` references this section for its
component step; it does not restate it.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-37 | **The shared component-picker pattern (defined once, here):** an accordion of sections — **Panel → Capacity → Inverter → Battery** — each showing its done-state and current choice, reopenable in any order after first completion. Every component section offers **three entry paths: Browse database · Upload datasheet (PDF extraction) · Enter specs manually.** Browsing searches the tenant's resolved catalog (`M01-32`/`M01-33`/`M01-38`, consumed); pickers badge **scheme-keyed certification compliance** per the tenant market's declared schemes (`M01-34`/`F1-19`, consumed — the IN pack's two schemes are `F1-44`'s data); a missing product is added in-flow by `M01-39`'s **three add paths — single-product form · datasheet PDF extraction · spreadsheet upload** (`M01-39`/`M01-40`/`M01-41`, consumed), with extraction always reviewed before commit. *(Final review: the entry triad and the add triad are distinct — browsing finds a product, it never adds one; `M01-39` is the authority and `M06-28` carries the same reading.)* The census marked the manual and datasheet routes "available-later"; DD12 rules all three paths present — the tension with the no-later-buckets scope law is recorded, not resolved (traceability). The **Battery** section appears in DD12's owner-supplied v1 screenshots and not in the census — recorded here, not resolved; the census gains nothing and loses nothing by it. | `SRC` — `SC.10-5.01` (Panel → Capacity → Inverter, done-states, reopenable), `SC.10-5.03`, `SC.10-5.10`, `SC.10-5.11` (the three entry paths); design spec §2 **DD12** ("v1's Step-4 pattern is carried forward as source-derived P0" — accordion **Panel → Capacity → Inverter → Battery**, three entry paths, scheme-keyed badges; owner-supplied screenshots, competitively validated 2026-08-03) | P0 |
| M05-38 | **Panel section carries the census surface:** selected-panel summary (brand, model, dimensions, Voc/Vmp/Isc, wattage large); search with result count; filters — min/max watt; technology (All Types · Mono PERC · TOPCon · Bifacial · Poly · HJT); per-scheme certification on/off filters as declared by the market pack; list rows with brand mark, brand + model, "watt · technology · dimensions" and scheme badges. | `SRC` — `SC.10-5.02`–`SC.10-5.09` (the census's two named scheme filters are the IN pack's entries per `R13` amendment; module body stays scheme-keyed) | P0 |
| M05-39 | **Capacity section:** target capacity in kWp (0.1 steps); **Auto** = maximum fit after setbacks and obstructions (unavailable until a panel is chosen and a roof exists, reason shown); site-intelligence cross-check line (info only, never a dependency); **bill-based suggestion** ("From your {bill}/month we recommend ~Y kWp", tap applies — bill from Step 1); Continue unavailable while capacity is 0. | `SRC` — `SC.10-5.12`–`SC.10-5.16`; `R5` (cross-check only) | P0 |
| M05-40 | **Inverter section:** recommended line ("{brand} {model} ({kW}×{count}, {phase}) → DC/AC ratio X", tap applies); selected summary (brand, model, #MPPTs, voltage range, phases, efficiency, kW large); count 1–10; **live DC/AC ratio health — >1.35 high (clipping risk), <0.90 low (oversized), 0.90–1.35 healthy**; search + count + list (kW · phase · MPPT count · voltage range, recommended badge). After choice: **DC collection topology** (String inverters / Central + combiners) and **MLPE** (None / DC optimisers) — MLPE components come from the catalog (`M01-45`); the absence of an MLPE electrical model is this module's recorded non-goal (§5). | `SRC` — `SC.10-5.17`–`SC.10-5.23`; `CG-15` (M05 half — "◐ (catalog, no MLPE electrical model)" is deliberate) | P0 |
| M05-41 | **Compare options is honest about its basis and applies atomically.** Unavailable with no roof (reason shown). It states its basis: target vs max fill, source-of-record vs built-in energy estimate, catalog version, warnings. Columns per the census: Option (RECOMMENDED/CURRENT markers, availability/certification notes) · Inverter (+ DC/AC) · Fits (panels × watt → kWp) · Module efficiency · Annual generation · Net cost (subsidy separate) · Payback · 25-year savings (+ ROI%) · Warranty · Install (complexity + array weight) · Apply/selected/feasibility. Decision cards (topic, choice, reason, inputs) and a fixed-assumptions footnote (tariff escalation, horizon, margin, subsidy scheme — the scheme is pack data). Apply sets panel + inverter + count in **one undoable action**; if panels are already placed with a different panel, a replace-panel confirmation intervenes. | `SRC` — `SC.10-5.24`–`SC.10-5.40`; `R5`/`R18` via `F8-08` (basis labelling, cited); subsidy scheme naming is `F1` pack data (`SC.10-5.38` note) | P0 |
| M05-42 | **Everything derived updates live:** module efficiency, annual kWh, net cost, subsidy, payback, 25-yr savings, ROI%, DC/AC ratio, array weight, install complexity, valid-string existence, recommended inverter + count, effective kWp the roofs hold, bill-based suggestion. | `SRC` — `SC.10-5.41` | P0 |
| M05-43 | **Catalog state is honest in the picker: out-of-stock or discontinued items are flagged, and existing outputs keep their original pricing.** A panel that goes unavailable after selection flags in the design; sent proposals keep the rate version they were built with (`M01-43`/`M01-44`, consumed; the proposal-side guarantee is `modules/M06`'s). Archived items never break existing references (`M01-42`, consumed). | `SRC` — `S5.wrong.4` ("catalog flags it; existing quotes keep their original pricing" — "quote" wording superseded as UI copy per `R1`); `R13` (pinning, via M01) | P0 |

**Behavior detail.** The accordion enforces the census order on first pass (a section opens when
its predecessor is done) and free reopening afterwards (`SC.10-5.01`). The three **entry** paths
are one pattern everywhere the product picks components: this studio step and the proposal
builder's component step (M06 cites this section). **Adding** a missing product is a different
triad — `M01-39`'s single-product form · datasheet PDF extraction · spreadsheet upload — offered
in-flow from either picker and from Catalog settings' inline add; browsing searches the catalog
and never creates a SKU *(Final review: aligned with `M01-39`; `M06-28` states the same)*.
Datasheet extraction is always review-before-commit (`M01-40`, consumed) — extraction output is
never silently committed. Scheme badges are data-driven from the market pack; a market with no
declared schemes shows no badges and no empty chrome (`F1-19`). The compare table renders as
horizontally scrollable cards on mobile (dual-breakpoint contract, `F7-30` cited).

**Permissions.** `F2.M05.create-edit-designs`; adding catalog items in-flow requires the M01
catalog grant (`F2`'s M01 matrix, cited) — the picker offers the add path only to holders.

**Edge cases & what-goes-wrong.**
- No roof yet → Compare and Auto capacity unavailable **with the reason shown** (M05-39,
  M05-41).
- Panel discontinued mid-design → flagged in picker and design; nothing silently swaps
  (M05-43).
- Replace-panel with panels placed → confirmation before anything moves (M05-41).
- Datasheet extraction fails or is partial → review form shows what extracted and what did
  not; manual completion; never silent commit (M05-37, via `M01-40`).
- Capacity 0 → Continue unavailable with reason (M05-39).

**Acceptance criteria.**
- Given the component step, when it renders, then the accordion is Panel → Capacity → Inverter
  → Battery, each section shows done-state + current choice, and all three entry paths are
  offered per section (M05-37).
- Given a market pack declaring schemes, when the panel list renders, then each row badges
  compliance per declared scheme; given a pack declaring none, then no scheme chrome renders
  (M05-38).
- Given panel and inverter chosen, when counts change, then the DC/AC ratio recolours live at
  the census thresholds (M05-40).
- Given Compare, when it opens, then the basis line states target-vs-max-fill, energy source,
  catalog version and warnings before any column is read (M05-41).
- Given Apply from Compare, when confirmed, then panel + inverter + count change as one action
  and one undo reverses all of it (M05-41).
- Given no panel or no roof, when Auto capacity is attempted, then it is unavailable with the
  reason shown; given a Step-1 bill, then the bill-based suggestion applies on tap (M05-39).
- Given a panel, inverter or count change, when it commits, then every derived figure of the
  census's live list updates without a manual refresh (M05-42).
- Given a selected panel that is discontinued, when the picker or design renders, then the
  flag shows and no existing output's pricing changes (M05-43).

**Localization notes.** Technology names and column headers localized; spec units per units
toggle; money in tenant currency (`F1-07` cited); the assumptions footnote renders pack-supplied
scheme names verbatim.

**Analytics events.** `picker.opened` (host: studio|proposal|catalog), `picker.path_used`
(browse|datasheet|manual), `picker.scheme_filter_used`, `picker.compare_opened`,
`picker.compare_applied`, `picker.item_flagged_unavailable`.

### §M05.7 — Steps 5–6 · Panel layout & electrical design

Census section: 10.6 `SC.10-6.01`–`SC.10-6.66` (the most tool-dense screen). Arrival options
carry `R7` (no visible "step 5"; the fold is this section).

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-44 | **Arrival at Panel layout with 0 panels offers exactly three options:** Place manually · Auto-fill panels (to the Step-4 target) · Use maximum roof capacity. | `SRC` — `SC.10-6.01`–`SC.10-6.03`; `R7` ("exactly as the phase-10 census describes"; the visible "Step 5" label is superseded) | P0 |
| M05-45 | **The four tool families carry the census census-complete:** VIEW — irradiance heatmap (legend Poor→Excellent 0/50/100%, Jan–Dec month scrubber recolouring instantly, current-month avg access %, avg sun-hrs/day, kWh/m², "Computing solar access… X%" progress) · Show strings (series path + routed home-runs) · **Why this layout?** (Design Decision Log + accept/ignore improvement suggestions) · Measure distance. BUILD — Select (select / multi-select / move / edit cable corners) · Panels (TAP = one panel snapped to grid; DRAG = fills a rectangle as a table, auto-avoiding obstructions + setbacks, live fit/conflict preview) · Erase (highlights target first). SAFETY (with counts) — Walkway (600/800/1000 mm or custom 100–3000 mm) · No-build zone (drag rectangle; tap removes) · Safety rail (drag along edge) · Lightning arrester (tap to place). ELECTRICAL (with counts) — Mount inverter (two sub-modes: inverter snaps to nearest wall edge within ~4 m; meter/service entry as a free point; each with its own instruction) · Stringing · String connections (read-only list of every string + exact panel chain). | `SRC` — `SC.10-6.04`–`SC.10-6.17`; heatmap source labelling per `F8-08` (cited at §M05.8) | P0 |
| M05-46 | **Canvas and selection behaviours, census-complete:** undo/redo (one gesture = one step) · lock/unlock layout · clear all panels (confirm; unavailable when locked or empty) · pan/zoom in Select (suspended mid-gesture) · tap select · marquee + add-to-selection · move with live outline (a refused move explains why) · cable-route editing (drag corners, pull segment for a new corner, marks the run MANUAL so auto-routing won't overwrite, ends fixed) · live preview on every draw tool. Selection actions (count shown): Group into parametric TABLE (2+ on same roof, not already grouped) · Grow row/column (says when no room) · More grow options (axis, count 1–20, side, live preview) · Rotate 90° (azimuth shown or "mixed") · Tilt (5° steps) · Table settings (table only) · Enable/Disable (stops production without deleting) · Delete · Clear selection · all disabled when locked. | `SRC` — `SC.10-6.18`–`SC.10-6.37` | P0 |
| M05-47 | **Table settings carry the census's parametric-structure surface:** header (name, rows × cols, count, kWp); structure preset (Flush · Standard 10° · Walk-under 2.2 m, cross-section previews, "custom"); ground foundation for ground-mount (Driven pile · Ballasted, "soil survey required"); racking (Flush · Fixed tilt · Dual tilt); panel tilt 0–35°; inter-row shading (recommended winter shadow-free pitch, resulting GCR, one-tap apply); azimuth (±5°, Due South preset rendered hemisphere-correctly, roof-slope preset, live compass); structure profile (steel section, weight/m); **structure member model** (preview + counted bill: legs, rafters, purlins, braces — counts + metres — and total steel kg; editable leg spacing 0.5–4 m, clearance 0–3 m, Anchored/Ballasted; structural warnings); **the structure disclaimer, always** (material estimate + visual model, not a wind/uplift/roof-capacity check, needs engineer verification); duplicate table; delete table. | `SRC` — `SC.10-6.41`–`SC.10-6.52`; `SC.10-6.50` disclaimer law per `F8-25` (cited); `CG-reslink.7` (M05 half — the parametric member/steel model + foundations feature; the never-a-computed-safety-verdict law is `F8-25`/`F8-26`) | P0 |
| M05-48 | **Stringing: auto, manual and clear — with the locked electrical rules.** Auto string groups panels into valid strings for the inverter MPPTs and auto-routes DC/AC, honouring the **unstrung-over-illegal rule: never produce an illegal string; leave panels unstrung instead**. Manual string is tap-to-wire with a live "N of min–max panels" counter, running cold-weather string voltage coloured over-limit / under-MPPT-floor / fine, too-long/too-short warnings, Save/Cancel, and refusal of used or disabled panels with a reason. Clear strings only when strings exist. An empty voltage window **stays an explicit fault**, never silently passed. | `SRC` — `SC.10-6.38`–`SC.10-6.40`; `DOC05.electrical-locked-rules` (verbatim rules) | P0 |
| M05-49 | **Validation is a first-problem summary opening the census's full list, every entry locates, and the electrical hard gate stands.** Items: string voltage too high in cold · voltage below MPPT window · panel current above MPPT input · DC/AC too high/low · panels unstrung · more strings than MPPT inputs · "no valid string length exists for this panel/inverter pair". Every entry taps to LOCATE (centres + selects the faulty panels); inline "Auto-string now" where relevant. **Invalid electrical blocks the next step with the reason stated** — the studio's hard gate, expressly preserved. | `SRC` — `SC.10-6.53`–`SC.10-6.63`; `R12` (studio half, verbatim: "the studio's electrical hard gate stays"); `S5.rule.uxprob.1` is answered here and at §M05.11 by progressive disclosure (`F7-34`, cited) | P0 |
| M05-50 | **The status read-out and honest capacity cues:** enabled panel count, kWp vs target, string colour key, DC cable length (routed vs estimate, labelled which). Exceeding the **target** kWp is flagged as a design cue; no subscription or plan-capacity limit exists anywhere in the layout — the census's rule is **confirmed as law (owner ruling 2026-08-04, Q28)**, and the tier kW ceiling acts only at the M05-12 checkpoints, the studio's single sanctioned gate. 3D is one tap away. | `SRC` — `SC.10-6.64`–`SC.10-6.66` (the no-limit rule, confirmed final per owner ruling 2026-08-04, Q28); `DOC16.gate.design-kw` (never mid-edit; cited at M05-12) | P0 |

**Behavior detail.** The fold of auto-placement into this step (R7) means auto-fill/max-fill are
arrival options here, not a wizard stop of their own. "Why this layout?" is the transparency
surface for auto decisions: the Design Decision Log lists what the auto-layout chose and why,
with accept/ignore per improvement suggestion (`SC.10-6.06`). A manually edited cable run is
never overwritten by auto-routing (`SC.10-6.25`). Walkways, no-build zones, rails and arresters
subtract honestly from placement and feed the BOM's safety category (§M05.11).

**Permissions.** `F2.M05.create-edit-designs`; lock state applies to everyone including its
author until unlocked.

**Edge cases & what-goes-wrong.**
- Roof too shaded → the system is honest: shading results say so and a smaller layout is
  offered rather than quietly producing bad numbers (`S5.wrong.2`; the honesty law is F8's, the
  surface is the heatmap/energy report §M05.8 and the readiness card §M05.9).
- No valid string length for the pair → explicit named fault; Next blocked with reason
  (M05-48/M05-49).
- Refused move → explains why (M05-46).
- Disabled panels → excluded from production and stringing, refusal reasons state it (M05-48).
- Layout locked → all mutating actions disabled visibly (M05-46).
- kWp exceeds target → design cue, never a plan gate (M05-50).

**Acceptance criteria.**
- Given 0 panels, when the step opens, then exactly the three arrival options show (M05-44).
- Given an auto-string run that cannot make a legal string of some panels, when it completes,
  then those panels are left unstrung and named — never wired illegally (M05-48).
- Given any validation entry, when tapped, then the canvas centres and selects the faulty
  panels (M05-49).
- Given invalid electrical, when Next is attempted, then it blocks with the reason; given the
  proposal builder's free navigation, this gate still stands here (M05-49, `R12`).
- Given a manual cable edit, when auto-routing later runs, then the MANUAL run is untouched
  (M05-46).
- Given the layout step, when the tools render, then the four families carry the census sets
  with counts on SAFETY and ELECTRICAL (M05-45).
- Given a selected table, when settings open, then the structure member model shows its
  counted bill and the structure disclaimer is present — always (M05-47).
- Given kWp exceeding the target, when the status renders, then it is a design cue only and no
  plan or capacity limit blocks anything (M05-50).

**Localization notes.** Tool names, validation reasons and decision-log entries are catalog
strings; month scrubber per `F3-22`; measurement units per toggle.

**Analytics events.** `studio.layout_arrival_choice`, `studio.autostring_run`
(strung/unstrung counts), `studio.validation_opened` (item keys),
`studio.hard_gate_blocked`, `studio.table_grouped`, `studio.decision_log_opened`.

### §M05.8 — The 3D view, shadows & the energy report

Census section: 10.7 `SC.10-7.01`–`SC.10-7.43` (one shared surface, opened over editor steps).

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-51 | **Camera and sun controls, census-complete:** orbit/pan/zoom (never below the horizon); presets Top / Isometric / Front; close → 2D; on-screen equivalents for every keyboard-only control. Sun & shadow: season presets Winter / Summer / Equinox / Today; date picker; Play/Pause sun animation; time-of-day 5 AM–7 PM; sunrise/sunset; sun-position read-out (compass + azimuth/altitude °); sun-path arc toggle. Shadows are cast by roofs, parapets, obstructions, structure and panels. | `SRC` — `SC.10-7.01`–`SC.10-7.12` | P0 |
| M05-52 | **Layer/view modes with the census's honesty rules:** Irradiance heatmap (top-down, rotation stopped; legend + month track with avg access %, sun-hrs/day, kWh/m² — **the kWh/m² figure carries the source-of-record marker; the geometric access numbers deliberately carry NO marker, and that absence is itself required**); Solar-access view (tints each panel by actual sun); Energy report (M05-54); **Map ⇄ Mesh** (model-on-satellite vs isolated render); **Neighbour buildings — decorative only, stated plainly that they do NOT cast shadows;** a real neighbour must be added as a "building" obstruction in Step 3. | `SRC` — `SC.10-7.13`–`SC.10-7.17`; the marker law per `F8-08`/`F8-09` and the no-marker rule per `SC.10-7.13`'s own requirement (F8 cited) | P0 |
| M05-53 | **Editing in 3D through the census's edit cards:** This panel (solar-access %, share of annual kWh, "SUN LOST TO — tap to look" with camera swing to each blocker; says so if nothing blocks); structure presets (Flush / Standard 10° / Walk-under 2.2 m); module visibility Show/Ghost/Hide and table scope All/Isolate (view aids, never saved); structure profile; **Foundation** (PCC pedestal · Chemical anchor · Ballast block · Driven pile; options taller than clearance unavailable with a reason; only where the surface allows); shuttering form (Square/Circular, circular ≈ ⅕ less concrete); **the foundation honesty note** (size nominal + assumed, adds roof weight, roof capacity NOT checked); tilt (5° steps, 0–35°); clearance (0.3 m steps, 0–3 m); customise mounting structure (purlins/row 1–6, rafter density 1–3× half steps with the note that density is a material allowance not a safety factor, end overhang 0–1 m, bracing on/off); Edit legs (2D) (top-down plan, Auto/Custom + leg count, add/reset, draggable/nudgeable/removable legs constrained to the buildable area, actions announced). | `SRC` — `SC.10-7.20`–`SC.10-7.31`; foundation honesty per `F8-25` (cited) | P0 |
| M05-54 | **The energy report is the census's block with provenance law intact:** freshness note while shading recalculates (provisional); system summary (kWp, panel count + per-panel W, roof area); annual generation (annual MWh large, specific yield kWh/kWp, performance ratio %, POA factor, **provenance line "Real irradiance — {source of record} ({database}, {N}-year record)" OR "Built-in irradiance model (latitude fit, ±10%)"** — never silently switched); monthly generation (12 months, seasonal rain period distinct per the market's climate framing, exact kWh); **losses breakdown** (temperature, soiling, inverter, mismatch, DC wiring, measured shading, + total, each with %); solar access (avg %, same metric as the heatmap); 25-year projection (lifetime MWh + year-25 output as % of year 1); financials (net cost after subsidy, yearly savings at tariff, payback); financing options (card per option, "representative terms"); actions Customize Proposal and Quick Generate (both hidden in read-only) handing off to `modules/M06`. **Shading outputs carry their engineer-validation caveat wherever they surface.** | `SRC` — `SC.10-7.32`–`SC.10-7.41`; `R5` (M05 half — the ladder; label copy `F8-08`); `DOC05.shading-validation-banner` ("the ENGINEER VALIDATION banner travels"); `CG-reslink.4` (M05 half — the report feature at every tier; labelling law `F8-08`/`F8-01`); monsoon framing is pack data (`SC.10-7.35` note); financing/subsidy figures follow `modules/M11`/`F1` pack keys | P0 |
| M05-55 | **Chart colours come from the design system's data ramp, never the product accent; the read-only share state hides all edit controls and the share button itself.** The census's original "never brass" phrasing is superseded in premise (that palette is retired); the surviving requirement is data-ramp usage per `foundations/F7`. **The customer's 3D view ships inside the proposal link (owner ruling 2026-08-04, Q27):** the read-only 3D surface renders behind the proposal page's **"View in 3D"** button (`F5-33`) — no separate customer-facing 3D URL exists, and the census's copy-share-link acceptance items are satisfied by the proposal link whose page carries the view; captures/pictures remain the fallback. | `SRC` — `SC.10-7.42` (post-overlay), `SC.10-7.43`, `SC.10-7.18` (`D5` honored — tokenised, no login); in-link 3D per owner ruling 2026-08-04 (Q27); `F7` data-colour law cited | P0 |
| M05-56 | **Yield-uncertainty reporting (P50/P90 exceedance) is designed-for as an additive layer on the same energy model** — no second engine, no re-labelling of existing figures; needed when enterprise/utility tenants arrive. | `SRC` — `CG-10` (DESIGN-FOR verdict: "uncertainty bands and exceedance statistics are an additive reporting layer on the same energy model") | P2 |

**Behavior detail.** The 3D view is one shared surface reachable from roof, obstruction and
layout steps and from the Done screen's share link — always the same model, never a fork.
"SUN LOST TO" is the census's teaching interaction: tapping a named blocker swings the camera to
it, making shading loss inspectable rather than asserted. The energy report's provenance line
follows the vendor rule: the capability is "the market's energy source of record"; the v1
reference implementation is PVGIS with its database ladder (`R5`), and `F8-08`'s fixed copy is
the required rendering.

**Permissions.** Editing via `F2.M05.create-edit-designs`; the share state (M05-55) is
read-only by construction; copy-share-link is hidden in read-only mode.

**Edge cases & what-goes-wrong.**
- Shading recalculating → report and Design Health show provisional; nothing stale renders as
  current (M05-54, `F8-12`/`F8-17` cited).
- Neighbour buildings mistaken for shading → the decorative-only statement is on the surface;
  the remedy (add a building obstruction) is named (M05-52).
- Energy source unreachable → fallback labelled ±10% per figure; no silent switch (M05-54).
- Roof too shaded → the report's access and losses say so plainly; pairs with the smaller-
  layout offer (`S5.wrong.2`, §M05.7).

**Acceptance criteria.**
- Given the heatmap layer, when it renders, then kWh/m² carries the source marker and the
  geometric access numbers carry none (M05-52).
- Given a blocker of a selected panel, when tapped in "SUN LOST TO", then the camera swings to
  it (M05-53).
- Given fallback energy data, when the report renders, then the ±10% label shows on every
  affected figure including inside previously generated views (M05-54, `F8-09` cited).
- Given the read-only share state, when opened, then no edit control and no share button
  render (M05-55).
- Given the 3D view, when camera and sun controls are used, then every census control is
  reachable on-screen and the camera never goes below the horizon (M05-51).

**Localization notes.** Report labels localized; month names per `F3-22`; money per tenant
currency; the provenance lines use `F8-08`'s fixed copy per locale.

**Analytics events.** `studio.3d_opened` (from-step), `studio.sun_animated`,
`studio.energy_report_viewed` (source label), `studio.sun_lost_to_tapped`,
`studio.share_link_copied`.

### §M05.9 — Step 7 · Proposal captures & readiness

Census section: 10.8 `SC.10-8.01`–`SC.10-8.20`.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-57 | **Capture studio: four fixed shots, each naming its name/date/hour** — Summer Morning 9:00 · Summer Noon 12:00 · Solar Access (Summer) 12:00 · Solar Access (Winter) 12:00. Controls: Capture (from the current 3D view); "Shadow captures: N of 4" progress; four numbered shot buttons (tick when captured; tap to jump/retake); auto-advance to the next uncaptured shot; **the first capture auto-becomes the cover image**; Skip to review. A save failure (storage full / private browsing) is honest and offers a remedy. | `SRC` — `SC.10-8.01`–`SC.10-8.12` | P0 |
| M05-58 | **Review: the "Before you issue" readiness card with verdict NOT READY · READY WITH CAVEATS · READY TO ISSUE.** Each checked item shows status (ready / needs attention / blocking), its meaning in plain language, and a jump button to the fixing step. The card composes the studio's honesty state: electrical validity, captures present/fresh, sanctioned-load warning, engineer-confirmation flags, staleness. | `SRC` — `SC.10-8.13`, `SC.10-8.14` | P0 |
| M05-59 | **The review shows the census's evidence surface:** cover image preview (or "no cover captured yet"); the shadow set of four — image or "Not captured", name, date/hour, **"OUTDATED — RETAKE" when the design changed since**, cover marker or "SET AS COVER"; system summary (kWp, panel count × watts, avg solar access %, annual generation); Edit photos back into the capture studio. | `SRC` — `SC.10-8.15`–`SC.10-8.18` | P0 |
| M05-60 | **The staleness law binds captures: a capture taken before a design change is stale and must say so — never silently show an out-of-date picture.** This is the studio-side instance of the imagery-honesty law; it rides into the proposal and the customer link with the capture. | `SRC` — `SC.10-8.20` (verbatim); staleness comparison per `F8-13`/`F8-14` (cited); document-basis honesty `F8-22` (cited — a remote-built design's documents state their basis) | P0 |
| M05-61 | **Generate proposal marks the design proposal-ready and hands numbers + captures to the proposal path-with-design.** Mandatory-component and payable-floor checks are the proposal builder's Generate-time checks (`modules/M06`, per `R12`); this module guarantees the hand-off's content and its honesty labels. | `SRC` — `SC.10-8.19` (D21 Path A; enforcement re-homed to Generate per `R12` — M06's half) | P0 |

**Behavior detail.** Captures are evidence, not decoration: each is stamped with its shot
definition and the design version it pictures, which is what makes M05-60's staleness
computable by comparison. The readiness card never blocks editing — it is the pre-issue
honesty mirror; its "blocking" entries are the ones the proposal builder's Generate will
refuse on (M06's checks), shown here early with jump-to-fix.

**Permissions.** `F2.M05.create-edit-designs` to capture and generate; the readiness card is
visible read-only.

**Edge cases & what-goes-wrong.**
- Storage full / private browsing → honest save-error with remedy (M05-57).
- Design changed after captures → OUTDATED — RETAKE per capture; cover included (M05-59,
  M05-60).
- No cover captured → stated plainly; first capture auto-becomes cover once taken (M05-57,
  M05-59).
- Skip to review with nothing captured → review shows "Not captured" per slot; verdict
  reflects it (M05-58, M05-59).

**Acceptance criteria.**
- Given the capture studio, when the first capture completes, then it is the cover image and
  the flow advances to the next uncaptured shot (M05-57).
- Given a design edit after capture, when review renders, then every affected capture reads
  OUTDATED — RETAKE (M05-60).
- Given blocking readiness items, when the card renders, then the verdict is NOT READY and
  each item jumps to its fixing step (M05-58).
- Given the review, when it renders, then each shadow slot shows its image or "Not captured"
  with name, date/hour and cover state (M05-59).
- Given Generate proposal, when tapped, then the design is marked proposal-ready and numbers +
  captures hand to the proposal path-with-design (M05-61).

**Localization notes.** Shot names, verdicts and statuses localized; dates/hours per `F3-22`.

**Analytics events.** `studio.capture_taken` (slot), `studio.capture_stale_flagged`,
`studio.readiness_viewed` (verdict), `studio.generate_handoff`.

### §M05.10 — Step 8 · SLD & drawings

Census section: 10.9 `SC.10-9.01`–`SC.10-9.37`.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-62 | **Four drawing tabs — SLD · PV Layout · String Route · Structure — each a proper title-blocked drawing sheet** (zoom/pan within its area; title block with project, client, date, sheet name; a "not to scale" note). This is the industrial-drawings capability at every tier. | `SRC` — `SC.10-9.01`, `SC.10-9.02`; `CG-reslink.12` ("Title-blocked drawing sheets … — every tier"; document-render correctness for non-Latin scripts is `F3`'s law, cited) | P0 |
| M05-63 | **SLD content, census-complete:** each string with panel count + voltage; string combiner boxes (central topology); DCDB with fuse, SPD, isolator; inverter (label, kW, phase, MPPT range, unit count); ACDB with MCCB, SPD, isolator; generation + net meters + grid; earthing pits; String/MPPT schedule table; Plant details table; the structural disclaimer note. PV Layout: roofs with edge dimensions, every panel, obstruction buffers, north arrow, legend, array-table detail, title block. String Route: roof outlines + labelled cable routes + string schedule (says so when nothing is strung). Structure: structural drawing of the mounting system. | `SRC` — `SC.10-9.03`–`SC.10-9.15`; disclaimer per `F8-25`/`F8-28` (cited) | P0 |
| M05-64 | **The MAXIMUM SYSTEM VOLTAGE compliance box is prominent:** longest string's cold-weather voltage vs inverter max DC voltage; within = passing, over = fault + "shorten the string". It is the figure an electrical inspector checks and must read as such. | `SRC` — `SC.10-9.16` | P0 |
| M05-65 | **SLD controls: the three-line toggle and the Edit-ratings form with override accounting.** Three-line (line/neutral/earth vs single-line shorthand). Edit ratings (with a count of overrides): inverter name/model + AC kW; DC cable mm² (2.5/4/6/10); DC fuse A (15/20/25/32); DC SPD type (Type-I / Type-II / Type-I+II); DC isolator A (25/32/40/63); AC cable mm² (4–95); AC cable type (PVC copper / XLPE copper / XLPE aluminium); MCCB rating A (also sets the isolator); AC SPD type; **grid & standards family from the market pack's engineering-standards labels** (the census's own list already spans two markets' families). Actions: Reset to auto (disabled when nothing overridden), Cancel, Save (only values differing from derived defaults are kept). | `SRC` — `SC.10-9.17`–`SC.10-9.29`; standards labels per `F1-20` (IN instance `F1-45`), cited | P0 |
| M05-66 | **Structural verification is a two-state human record — Pending verification ⇄ Engineer approved — and the high-wind marker is display-only with mandatory engineer verification in a high-wind zone.** The app never computes structural adequacy (`F8-25`, cited); the sign-off act itself is §M05.14. | `SRC` — `SC.10-9.30`, `SC.10-9.31`; role name per `F2-03` (Design Engineer holds the fold-in of the v1 reviewer) | P0 |
| M05-67 | **Exports: SVG (CAD) · PNG · DXF (layout) · Print/Save-as-PDF — server-rendered, fail fast.** Empty state when nothing is strung: "Auto-string now" (unavailable until panel + inverter + ≥1 placed panel exist, reason shown) and "String manually in editor". First-visit colour-legend explainer (DC / inverter / AC / earthing; dismissable). | `SRC` — `SC.10-9.32`–`SC.10-9.37`; PDF render server-side per `R14` (cited) | P0 |

**Behavior detail.** The sheets derive from the design; hand-set ratings are sparse overrides
counted and resettable (M05-65), mirroring the BOM's override grammar (§M05.11). The standards
family printed on documents comes from the market pack's labels — no standards family is named
in this module's body; the census's enumerated set is carried in the census baseline and the
IN instance lives at `F1-45`.

**Permissions.** `F2.M05.create-edit-designs` to edit ratings; exports available to read-only
viewers (read + export always work).

**Edge cases & what-goes-wrong.**
- Nothing strung → sheets state it; auto-string offer with availability reason (M05-67).
- Over-voltage string → compliance box faults with the remedy ("shorten the string") (M05-64).
- Override drift after design change → only differing values kept; reset-to-auto appears
  (M05-65).

**Acceptance criteria.**
- Given a strung design, when the SLD renders, then every census content block is present and
  the compliance box shows the cold-weather voltage against the inverter limit (M05-63,
  M05-64).
- Given an over-limit string, when the box renders, then it faults prominently with the remedy
  (M05-64).
- Given saved ratings equal to derived defaults, when saved, then no override is recorded
  (M05-65).
- Given a high-wind-zone site, when the Structure sheet renders, then the marker shows and
  engineer verification is stated as mandatory (M05-66).
- Given any drawing tab, when it renders, then it is a title-blocked sheet with zoom/pan and
  the "not to scale" note (M05-62).
- Given nothing strung, when the step opens, then the empty state offers auto-string (with its
  availability reason) and manual stringing (M05-67).

**Localization notes.** Sheet titles, legends and disclaimers localized; the title block and
document output obey `F3`'s script-correct render law; standards labels print the pack's exact
strings.

**Analytics events.** `studio.sld_viewed` (tab), `studio.ratings_overridden` (count),
`studio.compliance_box_state`, `studio.drawing_exported` (format).

### §M05.11 — Step 9 · BOM & pricing

Census section: 10.10 `SC.10-10.01`–`SC.10-10.47` (the ~286-control screen).

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-68 | **The BOM's ~286 controls are presented with progressive disclosure — never all at once, never a smaller font.** Category and line detail unfold on demand; the money summary is always in reach. | `SRC` — `S5.rule.uxprob.1` (M05 half — the BOM screen and its redesign; the general law is `F7-34`, cited) | P0 |
| M05-69 | **The money summary carries nine figures:** system kWp · cost before margin · **margin % (editable 0–60)** · **discount (editable, value + % or amount)** · taxable (with the reduction line when discounted) · tax (per-rate breakdown when rates are mixed — the tax scheme is pack data) · **Proposal total** (the census's "Quote total" is superseded as UI copy per `R1`) · price per Wp · subsidy (+ reason when zero — the scheme is pack data). There is **no discount-approval flow**; the arithmetic guards are: below-cost warns, payable ≤ 0 blocks Generate (the block runs at the proposal builder's Generate per `R12` — M06's half). | `SRC` — `SC.10-10.01`–`SC.10-10.09` (D19 superseded by `D34` per census note; currency per tenant `F1-07` cited); `R1` (naming law) | P0 |
| M05-70 | **The BOM uses the same arithmetic the proposal uses — it cannot produce a different total — and its money math is locked: margin-below-tax, pre-tax pro-rata discount; the money invariants are release-gated.** Totals and each line's confidence travel onto the proposal's honesty labelling; the tenant money path consumes the same figures (`modules/M11`). | `SRC` — `SC.10-10.10`, `SC.10-10.47`; `DOC05.bom-money-locked` (invariants verbatim, carried market-neutrally: the named tax is the IN pack's); money-never-stale per `F8-12` (cited) | P0 |
| M05-71 | **Six categories in fixed order, shown only when they have lines:** Modules · Inverter · Electrical BOS · Mechanical BOS · Safety · Civil & Misc. Per category: name, "N of M included", own total, and Refresh-from-design (appears once anything is hand-edited). Electrical BOS survey inputs: average DC run and average AC run — both **lock with a note when the design has real routed cable geometry** (the routed length is used instead). | `SRC` — `SC.10-10.11`–`SC.10-10.21` | P0 |
| M05-72 | **Line items carry the census field set with the four-tier confidence indicator:** Include switch (excluding keeps the line, drops it from totals, dims it — never deletes); **confidence MEASURED · DERIVED · ESTIMATED · ASSUMED, readable not decorative**; item name (editable on custom lines, fixed on derived); spec; brand; quantity; unit (nos · set · pairs · kit · lot · plate · panel-set · day · m · m² · kg · kW); waste % (0–100); order quantity (calculated, read-only); rate; amount (calculated); tax % (0–40); tax + total (calculated); derivation explanation (the formula in words); remove (custom lines only); per-field reset (appears next to overridden values; changes appearance when the design has moved on). **A user-entered override takes measured provenance ("override=measured"), and overrides are preserved with stale-field tracking.** Rates resolve through the catalog with versioned history; sent proposals keep the rate version they were built with. | `SRC` — `SC.10-10.22`–`SC.10-10.37`; `R18` via `F8-01`/`F8-02` (cited — no fifth tier); `DOC05.bom-overrides` (verbatim); `M01-43`/`M01-44` (consumed) | P0 |
| M05-73 | **Reconciliation is explicit, per the census:** stale notice per category ("yours X · design now Y" per drifted field, one-tap "Take Y", bulk "Refresh these", "and N more"); orphan notice (a saved edit whose line no longer exists → Keep as custom line / Discard); below-cost warning; **preliminary-proposal notice** (how many lines are assumed/estimated and which figures need site verification — the census's "quote" wording superseded per `R1`); structure engineering disclaimer with the site's wind zone (material estimate, not a safety check). | `SRC` — `SC.10-10.38`–`SC.10-10.42`; `D34` honored (below-cost warns; payable ≤ 0 blocks at Generate — M06); disclaimer per `F8-25`/`F8-28` (cited) | P0 |
| M05-74 | **Page actions:** Add a custom line · Re-sync all (discards every hand-edit; confirm first, stating that edits are lost; disabled when nothing is edited) · **Export CSV — read + export always work regardless of billing state** · the market compliance checklist (pack-supplied: the tenant market's pre-submission checks; the IN pack's checklist — net metering vs sanctioned load, SLD sign-off, module scheme listings, earthing/arrester certificates, subsidy eligibility with its certification caveat — is `F1` pack data referenced by key, never named in this body). | `SRC` — `SC.10-10.43`–`SC.10-10.46` (checklist content routed to `F1` per `R2`/`R13`; export-always per the census's D38-supersession note, carried) | P0 |

**Behavior detail.** The BOM is derived-first: six emitters produce the lines from the design
(modules, inverter, electrical, mechanical, safety, civil), and human edits are sparse
overrides on top — which is what makes Refresh-from-design, per-field reset, stale notices and
orphan notices well-defined (M05-71–M05-73). The confidence tier is the reader's guide to what
needs site verification; the preliminary notice aggregates it honestly (M05-73). Excluding is
reversible bookkeeping, never deletion (M05-72). The BOM writes no money truth of its own:
totals flow to the proposal and the money path with their provenance attached (M05-70).

**Permissions.** `F2.M05.create-edit-designs` edits the BOM; read-only roles see everything and
can export.

**Edge cases & what-goes-wrong.**
- Design changed after hand-edits → per-category stale notice with "yours X · design now Y";
  nothing auto-overwritten (M05-73).
- Edited line no longer derivable → orphan notice with keep/discard (M05-73).
- Discount below cost → warning; payable ≤ 0 → the proposal builder's Generate blocks (M05-69,
  M05-73).
- Routed cable geometry exists → survey-run inputs lock with the note (M05-71).
- Re-sync all → confirm names the cost (all hand-edits lost) before acting (M05-74).
- Design edited after proposal exists → staleness surfaces here too (M05-11).

**Acceptance criteria.**
- Given the BOM opens, when rendered at 375 px, then the summary is visible, categories are
  collapsed, and no surface presents the full control set at once (M05-68).
- Given mixed tax rates, when the summary renders, then the per-rate breakdown shows
  (M05-69).
- Given identical inputs, when the proposal computes its total, then it equals the BOM total
  exactly (M05-70).
- Given a hand-edited rate, when the design moves on, then the field's reset control changes
  appearance and the category shows the stale notice (M05-72, M05-73).
- Given any billing state, when Export CSV is used, then it works (M05-74).
- Given routed cable geometry, when Electrical BOS renders, then the run inputs are locked
  with the note and the routed length is used (M05-71).

**Localization notes.** Category, field and notice copy localized; units list localized where
translatable; money in tenant currency with locale grouping (`F3-19`); the compliance
checklist renders the pack's strings.

**Analytics events.** `bom.opened`, `bom.line_overridden` (field), `bom.category_refreshed`,
`bom.resync_all`, `bom.below_cost_warned`, `bom.exported_csv`,
`bom.compliance_checklist_opened`.

### §M05.12 — Step 10 · Done, installation plan & exits

Census section: 10.11 `SC.10-11.01`–`SC.10-11.13` (sign-off entries `SC.10-11.14`–`.18` at
§M05.14; the variants entry `SC.10-11.19` at §M05.13).

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-75 | **The Done screen states completion honestly and offers five actions:** it names the design/project, reassures that the design can be reopened and edited anytime, and offers View proposal (`modules/M06`) · BOM & pricing (→ Step 9) · Installation plan · Copy 3D share link · Done (→ the lead's design list). The copied share link is the customer's **proposal link**, whose page carries the "View in 3D" button — no separate 3D URL is minted (owner ruling 2026-08-04, Q27; `F5-33`). | `SRC` — `SC.10-11.01`–`SC.10-11.06`; in-link 3D per owner ruling 2026-08-04 (Q27) | P0 |
| M05-76 | **The installation plan is reused, not rebuilt: a crew work-order derived from the design, ordered how it is built, grouped into phases.** Progress indicator + "done of total steps"; each step a tick-off item (number, title, detail, materials needed; tap toggles done, remembered); phase headings; Print; empty state ("place modules and string the array first"). In v1 the coordinator runs the checklist and ticks are attributed to them with an optional free-text "done by" (`R16` via `F2`, cited); the checklist's execution surface and evidence rules are `modules/M08`'s. | `SRC` — `SC.10-11.07`–`SC.10-11.12` ("REUSE, don't rebuild") | P0 |
| M05-77 | **The crew sees no money — a work order, not a priced document — on every surface this module emits.** No commercial figure appears on the installation plan or any crew-facing output; the role-surface law is `F2-05`–`F2-07` (cited). | `SRC` — `SC.10-11.13` (verbatim; `R1` bans the "quote" wording); `R16` ("crew sees no money because crew sees no screen") | P0 |

**Behavior detail.** Done is an exit, not a lock: the reassurance that reopening is normal is
part of the census's screen. The installation plan derives from the design's structural
dependency order (foundation → structure → modules → stringing → BOS — M08 specifies the
generation rule from its side) and is this module's hand-off artifact to execution.

**Permissions.** All five actions respect their targets' permissions; the installation plan
carries no money for any viewer (M05-77).

**Edge cases & what-goes-wrong.**
- Nothing placed/strung → installation plan empty state with the named prerequisite (M05-76).
- Unapproved design → the customer-facing exits stay closed (§M05.14, M05-82); Done still
  works — approval gates the customer, not the designer.

**Acceptance criteria.**
- Given a completed design, when Done renders, then all five actions are present and the
  reopen reassurance is stated (M05-75).
- Given any crew-facing output, when rendered or printed, then no commercial figure appears
  (M05-77).
- Given a designed and strung system, when the installation plan opens, then the steps derive
  from the design in build order with phase headings and remembered tick-off state (M05-76).

**Localization notes.** Done copy and plan steps localized; print output script-correct per
`F3`.

**Analytics events.** `studio.done_viewed`, `studio.exit_action` (action),
`installation_plan.printed`.

### §M05.13 — Variants & the recommendation

Census entries: `SC.10-1.02`, `SC.10-1.03`, `SC.10-11.19` · `D16` (M05 half) · `UXG-08` ·
`S5.screen.1` · `S5.wrong.5`.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-78 | **A lead holds several design variants — sibling designs with duplication lineage kept — and the design list shows them side by side:** each with system size, annual generation, price, payback; actions New design / duplicate / open / new variant. | `SRC` — `SC.10-1.02`, `SC.10-1.03`, `SC.10-11.19`; `DOC04.design-variants-recommended` ("sibling designs on the same lead (duplication lineage kept)"); `S5.screen.1` | P0 |
| M05-79 | **Compare 2–4 variants side by side: kWp, annual generation, price, payback, health score — with `is_recommended` set here.** Mobile renders horizontal snap cards (dual-breakpoint contract). Compared generation figures carry their energy source labels (`F8-08`, cited) — a source-of-record figure and a built-in estimate are never presented as like-for-like without their labels. Duplicate-as-variant is an entry point of the compare surface. | `SRC` — `UXG-08` (verbatim contract); `D16` (M05 half — variants are authored and compared here; the customer-facing single recommendation is `modules/M06`/`foundations/F5`'s half) | P0 |
| M05-80 | **Exactly one variant per lead may be recommended, and the customer sees exactly one.** Setting `is_recommended` moves the mark, never duplicates it; the customer link and proposal render the recommended variant (their modules' halves). | `SRC` — `D16` ("Customer sees one recommended system"); `DOC04.design-variants-recommended` ("exactly one may be recommended per lead") | P0 |
| M05-81 | **A customer changing their mind on size is a variant, not a rewrite.** The standing design is preserved; a duplicate is adjusted and compared; the recommendation moves if warranted. | `SRC` — `S5.wrong.5` (verbatim) | P0 |

**Behavior detail.** Variants are whole designs — each with its own census-complete studio
state, health score, captures and BOM — which is what makes the comparison honest. The compare
surface is the designer's tool; the customer never sees the spread, only the recommendation
(`D16`). Lineage (duplicated-from) is kept and visible.

**Permissions.** Creating/duplicating variants and setting `is_recommended` require
`F2.M05.create-edit-designs`; the compare surface is visible to read-only sales roles.

**Edge cases & what-goes-wrong.**
- Size change requested → variant, never an in-place rewrite of a quoted design (M05-81).
- Recommendation moved after a proposal exists → the proposal-side staleness surfaces per
  M05-11; nothing silently re-points.
- Two variants with different energy sources → labels make the difference visible (M05-79).

**Acceptance criteria.**
- Given a lead with 3 variants, when the list renders, then all show size/generation/price/
  payback and exactly one carries the recommended mark (M05-78, M05-80).
- Given compare on mobile, when rendered, then variants are horizontal snap cards with the
  five compare figures and their source labels (M05-79).
- Given "make it recommended" on variant B, when applied, then A loses the mark in the same
  act (M05-80).
- Given a size-change request on a quoted design, when handled, then a variant is created and
  the original design is unchanged (M05-81).

**Localization notes.** Compare labels localized; money and generation figures per locale
formats.

**Analytics events.** `variants.compared` (count), `variants.recommended_set`,
`variants.duplicated`.

### §M05.14 — Engineer sign-off

Census entries: `SC.10-11.14`–`SC.10-11.18` · `UXG-06` · `UXG-07` · `S5.screen.2`/`.3` ·
`S5.wrong.6` · `DOC05.review-read-only`.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-82 | **The rule that does not bend: the product never computes structural adequacy — sign-off is a recorded human decision (who + when), and an unapproved design is never shown to the customer.** The laws are published at `F8-25`/`F8-26`/`F8-28` and are cited, not restated; this module owns the surfaces that make them true. | `SRC` — `SC.10-11.18` (verbatim); `F8-25`/`F8-26`/`F8-28` (cited); customer gating `foundations/F5` (its half) | P0 |
| M05-83 | **The sign-off queue is the reviewer's home surface: designs waiting, oldest first**, each entry showing customer, system size (kWp), who designed it, and how long it has been waiting; open → the review surface. Role-gated to holders of `F2.M05.approve-designs`; it feeds the "designs awaiting" role-home redirect (`modules/M13`'s composition). | `SRC` — `SC.10-11.14`, `SC.10-11.15`; `UXG-06` (verbatim contract); `S5.screen.2` | P0 |
| M05-84 | **The review surface is the read-only studio plus the drawings — findings surface without blocking, and review is never a second wizard gate.** The reviewer sees exactly what the designer built (censused surfaces, read-only) with the readiness card, validation list, engineer-confirmation flags (bridging, platforms, high-wind) and honesty state composed for review. | `SRC` — `UXG-07` ("read-only studio + drawings"); `DOC05.review-read-only` ("read-only, never a second gate — review surfaces findings without blocking") | P0 |
| M05-85 | **Approve records structural verification — Engineer approved, with who and when — pinned to exactly what was reviewed (design version + fingerprint).** A design edit after approval (fingerprint mismatch) drops sign-off back to draft; sign-off decisions are append-only, and re-approval reviews the new state. The approver is never the author (`F2-04`, cited; one-person-tenant exception recorded there). | `SRC` — `SC.10-11.16`; `DOC04.signoff-append` (M05 half — the queue and review surfaces; the append-only law and its pinning are `F8-26`/`F8-27`, cited); `UXG-07` ("Approve records who+when") | P0 |
| M05-86 | **Return with comments requires at least one comment pinned to the thing it refers to — an object or a step, never a loose note.** The design goes back to the designer with a notification (`foundations/F6`'s type registry) and **pinned markers in the studio** at each commented object/step; the designer resolves and resubmits; the customer never sees the returned design meanwhile. | `SRC` — `SC.10-11.17` ("each comment PINNED to the thing it refers to"); `UXG-07` ("Return requires ≥1 comment pinned to an object/step"); `S5.screen.3`; `S5.wrong.6` ("the customer never sees an unapproved design") | P0 |

**Behavior detail.** The queue's oldest-first order is the fairness rule — no cherry-picking
surface exists. The review composes what already exists (read-only studio, drawings, readiness,
flags) rather than inventing a parallel review document; that is `DOC05.review-read-only`'s
point. Approval state renders on the Structure sheet (§M05.10 M05-66), the readiness card
(§M05.9) and the customer-gating boundary (`F5`'s half). Return-with-comments markers behave
like validation locate entries: tap → centre and select the commented thing.

**Permissions.** Queue and approve/return: `F2.M05.approve-designs` (EPC Owner, Design
Engineer), author rule `F2-04` enforced. The designer sees their returned design and its pinned
comments through `F2.M05.create-edit-designs`.

**Edge cases & what-goes-wrong.**
- Engineer returns the design → back to the designer with pinned comments; customer never sees
  it meanwhile (`S5.wrong.6`, M05-86).
- Design edited after approval → sign-off drops to draft by fingerprint mismatch; the
  customer-facing state follows (M05-85).
- Return attempted with no pinned comment → refused; the requirement is stated (M05-86).
- Approver is the author → refused per `F2-04` (exception path recorded in F2).

**Acceptance criteria.**
- Given waiting designs, when the queue renders, then they are oldest first with customer,
  kWp, designer and waiting time (M05-83).
- Given an approval, when recorded, then it pins design version + fingerprint and who + when;
  a subsequent edit drops the state back to draft (M05-85).
- Given a return, when submitted with zero pinned comments, then it is refused; with one, the
  designer is notified and each marker locates its target in the studio (M05-86).
- Given an unapproved or returned design, when any customer-facing surface would render it,
  then it does not (M05-82, M05-86).
- Given a reviewer opening a queued design, when the review surface renders, then it is the
  read-only studio plus the drawings, with findings surfaced and nothing blocked (M05-84).

**Localization notes.** Queue and review copy localized; notification strings via `F6`/`F3`.

**Analytics events.** `signoff.queue_viewed` (depth), `signoff.approved`,
`signoff.returned` (comment count), `signoff.reapproval_after_edit`.

### §M05.15 — The scale program: 1 kW → 100 MW

Source: docs/11 scale program (`DOC11.*`), `DOC02.scale-editable-unit`, `DOC07.dem-honesty`,
`UXG-25`. Scale phases are carried as **capability tiers (P0/P1/P2), never as dates** — the
source's phase letters name capability sets; nothing here sequences a build.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M05-87 | **The studio designs from 1 kW to 100 MW without a rewrite, in three regimes:** Rooftop 1–500 kW (≤ ~1,100 modules, per-panel editing, flat ground) · Large C&I 0.5–10 MW (≤ ~20k modules, block/table editing) · Utility 10–100 MW (≤ ~175k modules, zone → block → tracker table, terrain-aware). Every scale capability is investment into the studio moat, never a reason to cut studio capability. | `SRC` — `DOC11.range`, `DOC11.regimes` | P0 |
| M05-88 | **Above rooftop scale the editable unit is the block/table/zone — never the panel; panels become derived instances of a table.** Regime is a property of the **design**, not the tenant: a 100 kW rooftop and a 40 MW park coexist in one tenant. The design payload carries blocks alongside the per-panel rooftop model from day one, so 100 MW needs no migration. | `SRC` — `DOC11.block-unit`, `DOC11.regime-per-design`; `DOC02.scale-editable-unit`; `DOC11.phase-a-in-build` (payload half) | P0 |
| M05-89 | **The paradigm switch never loses a census tool:** a design with blocks presents block/table tools; pure-rooftop designs keep the **full per-panel tool census**; and per-panel editing remains available **inside** a table (remove-map pattern) — scoped, not deleted. | `SRC` — `DOC11.paradigm-switch`, `DOC11.per-panel-in-table` ("no census tool is lost") | P0 |
| M05-90 | **Tier A capabilities (P0): the performance foundation and large-C&I designs work** — per-site projection, blocks/tables in the design payload, and the full studio at rooftop scale. | `SRC` — `DOC11.phase-a-in-build`, `DOC14.studio-scale-scope` (calendar language excluded; capability commitment carried) | P0 |
| M05-91 | **Tier B capabilities (P1): large-C&I editing and simulation** — draw a zone polygon → auto-fill with tables; drag/rotate/split blocks; per-block GCR and tilt; per-table delete/nudge; keep-out subtraction — on-object direct manipulation, touch-first, working at 375 px (the DoD unchanged); GPU-accelerated shading **with a CPU fallback path retained permanently**, both pinned within ±2% on a golden scene (one engine version, two executors — an honesty-relevant equivalence); server-side full simulation for batch/over-budget designs, results stamped and staleness cleared on completion. | `SRC` — `DOC11.phase-b-capabilities`; `UXG-25` (design contract: reuse the studio sheet grammar; block/table the editable unit) | P1 |
| M05-92 | **Tier C capabilities (P2): utility scale** — single-axis trackers with closed-form GCR backtracking (rows never self-shade at low sun), validated against the community reference model; terrain import from a **free global 30 m DEM** (v1 reference implementations: GLO-30 baseline, SRTM fallback) with draped-mesh ground and tables sitting on the terrain surface, **flat ground remaining the default when no DEM is loaded**; terrain-aware row spacing (the winter-solstice shadow-free solver generalised to sloped ground at block granularity). **Terrain data unavailable → flat-terrain assumption with provenance `assumed` and a visible warning on ground-mount outputs; rooftop work never touches this path.** | `SRC` — `DOC11.phase-c-trackers`, `DOC11.phase-c-terrain`, `DOC11.terrain-spacing`; `DOC07.dem-honesty` (verbatim) | P2 |
| M05-93 | **Block-level electrical extends — never replaces — the combiner architecture:** an inverter-block tier for central-inverter blocks; string inverters remain for ≤10 MW distributed designs; MV collection is stubbed as a **LABELLED ASSUMPTION** — no MV engineering claim; reconciliation gates hold (Σ combiner inputs = total strings; Σ blocks = project total). Permit/DXF outputs at scale: zone plan, table rows with pitch dimensions, per-block electrical single-line, DEM contour underlay — **provenance tiers print on every sheet, unchanged**. | `SRC` — `DOC11.block-electrical`, `DOC11.dxf-at-scale`. **Tier note (Task 26):** P1 is this suite's judgment call, annotated per the review — the source keys state the capability without a priority; the row extends the scale ladder between the P0 foundation (`M05-90`) and the P2 utility-scale tier (`M05-92`), and P1 places it with the large-C&I editing tier (`M05-91`) whose designs its block electrical and DXF outputs serve. | P1 |
| M05-94 | **Scale changes resolution, never honesty — and never physics claims.** Provenance goes block-level, not away: a block aggregate inherits the **weakest** tier of its members (`F8-04`, cited); DEM-draped ground is `derived` from a public 30 m DEM, never `measured`. The shading model's documented limits print at every scale (beam-only, linear-in-unshaded-area, no bypass-diode cliff, no string mismatch — partial-shade losses read optimistic at 1 kW and 100 MW alike; `F8-11`, cited). Structural adequacy is never computed at any scale — tracker foundations, pile embedment and wind loading on a 100 MW park are engineer-led exactly as a 3 kW rooftop is, and the disclaimer travels with every structure-bearing output including block-level DXF sheets and MV assumptions (`F8-25`/`F8-28`, cited). **Money never renders while stale at scale:** a long server recompute keeps money provisional for the whole window and proposal issue blocked until shading and the money path reconcile — no express lane (`F8-17`, cited). | `SRC` — `DOC11.provenance-at-scale`, `DOC11.shading-limits-printed`, `DOC11.structural-never-computed`, `DOC11.money-stale-at-scale` (M05 halves — the studio surfaces; the laws are F8's, appended by Task 7) | P0 |
| M05-95 | **Performance budgets are release criteria per regime — a capability tier does not ship over budget.** Full in-browser shading recompute ≤5 s rooftop / ≤30 s C&I (GPU) / ≤90 s utility; incremental edit → heatmap first paint ≤1 s / ≤3 s / ≤5 s; orbit ≥30 fps floors (mobile utility ≥24, view-prioritised); server simulation ≤10 min p95 at utility — measured on stated mid-range reference devices. | `SRC` — `DOC11.perf-budgets` ("RELEASE CRITERIA per regime") | P1 |

**Behavior detail.** The scale program is the same studio, scoped — not a second product. The
zone → block → table hierarchy reuses the studio sheet grammar (`UXG-25`); a block presents the
same table settings the rooftop table sheet defines (§M05.7), plus block-scope GCR/tilt. The
GPU/CPU equivalence pin (M05-91) is an honesty requirement: acceleration changes speed, never
results. Tier C's tracker backtracking is validated against the community reference
implementation (the source names pvlib; carried per the vendor rule as reference
implementation).

**Permissions.** Same grants as the rest of the module; scale introduces no new permission
domain.

**Edge cases & what-goes-wrong.**
- DEM unavailable → flat-ground assumption, provenance `assumed`, visible warning on
  ground-mount outputs (M05-92).
- Recompute over budget in-browser → server simulation path with stamped results; money
  provisional for the whole window (M05-91, M05-94).
- Block aggregate mixing tiers → weakest tier inherits (M05-94).
- Cross-slope tracker articulation needed → deferred with explicit trigger (§5 non-goals).

**Acceptance criteria.**
- Given a design with blocks, when editing tools render, then block/table tools present and
  per-panel editing remains available inside a table (M05-89).
- Given a 40 MW park and a 100 kW rooftop in one tenant, when each opens, then each presents
  its regime's paradigm (M05-88).
- Given a server recompute in progress, when any money figure renders, then it is provisional
  and proposal issue is blocked until reconciliation (M05-94).
- Given GPU and CPU executors on the golden scene, when compared, then results agree within
  ±2% (M05-91).
- Given a 300 kW rooftop design, when opened, then the full per-panel census toolset presents
  with no scale-motivated reduction (M05-87).
- Given a large-C&I design, when created, then blocks/tables exist in the design payload and
  the per-site projection works (M05-90).

**Localization notes.** Scale surfaces inherit the studio's localization; DXF/permit sheet
labels script-correct per `F3`.

**Analytics events.** `studio.regime_detected`, `studio.zone_drawn`, `studio.block_edited`,
`studio.server_sim_run` (duration bucket), `studio.dem_loaded` (source).

## 4. Cross-module contracts

**This module consumes:**
- `modules/M04-survey.md` — the submitted-survey hand-off (`M04-63`/`M04-64`); the validated
  AI-detection artifact (`M04-65`); the pinned imagery tile (`M04-10`/`M04-11`); sanctioned
  load (`M04-45`); photographs as reference (`M04-54`). Q24 governs the un-ruled
  reconciliation join (M05-13).
- `modules/M01-onboarding-and-tenant-config.md` — the resolved two-tier catalog and its
  search/badges/provenance (`M01-32`–`M01-46`); release pinning and self-staling (`M01-43`);
  inline add paths (`M01-39`–`M01-41`).
- `modules/M02-crm-and-leads.md` — the lead as the design's parent ("Create design" from lead
  detail, `M02-32`); design events onto the lead timeline (`M02-35`).
- `foundations/F1` — market pack keys: utility naming and tariff defaults, tax scheme,
  subsidy scheme, certification schemes (`F1-19`/`F1-44`), engineering-standards labels
  (`F1-20`/`F1-45`), units/formats; pack versioning as a staleness input (`F1-11`).
- `foundations/F2` — `F2.M05.create-edit-designs`, `F2.M05.approve-designs` (+ author rule
  `F2-04`), `F2.M05.run-roof-detection`; design visibility via lead visibility.
- `foundations/F4` — the single-editor version-check law (`F4-15`).
- `foundations/F7` — parity/touch/DoD laws (`F7-29`/`F7-30`/`F7-32`/`F7-43`/`F7-44`);
  progressive disclosure (`F7-34`); data-colour ramp.
- `foundations/F8` — the four provenance tiers and every honesty law this module surfaces
  (`F8-01`–`F8-17`, `F8-22`, `F8-25`–`F8-28`).

**This module provides:**
- To `modules/M06-proposals.md` — **the shared component-picker pattern (§M05.6, DD12)**,
  referenced not restated; the design outputs vocabulary: BOM totals + per-line confidence,
  captures with staleness state, SLD/drawing sheets, variants with `is_recommended`, Design
  Health, readiness verdict; the Generate hand-off (M05-61); design→proposal staleness
  (M05-11).
- To `foundations/F5` — the approved-design gate (`F8-28`'s surface half, M05-82/M05-86); the
  read-only 3D share state (M05-55); the one recommended variant (M05-80).
- To `foundations/F6` — the notification types this module raises: sign-off requested
  (`signoff_requested`, M05-83), design returned (`design_returned`, M05-86) and a newer
  survey superseding the design's inputs (`design_survey_superseded`, M05-13 — owner ruling
  2026-08-04, Q24), whose recipient is the design's author (own scope). Recipients, channels
  and urgency classes are `F6`'s matrix (`F6-10`), cited not restated.
- To `modules/M08-projects.md` — the installation plan as derived work-order (M05-76,
  money-free per M05-77).
- To `modules/M11` — BOM totals as the money path's input, same arithmetic (M05-70).
- To `modules/M13` — the sign-off queue as the reviewer's home redirect (M05-83); design
  analytics events.
- To `modules/M12` — the entitlement checkpoints at save/create and Generate only (M05-12);
  detection metering consumption points (M05-23).

## 5. Non-goals

- **No computed structural adequacy — ever, at any scale.** The product records a human
  decision; it never renders a wind/uplift/load-path/roof-capacity verdict (`F8-25`,
  `SC.10-11.18`, `DOC11.structural-never-computed`). v1 rationale: source law, absolute.
- **No MLPE electrical model in v1.** The catalog holds micro-inverters/optimisers as items
  (`M01-45`); the string-sizing ladder gains an MLPE branch only on demand — the market this
  product launches into is string-inverter-dominated, so this follows demand, not launch
  (`CG-15`; the "◐" is deliberate).
- **No measuring from photographs.** Photographs are reference; every dimension is entered by
  a person (`D35`, `S5.rule.photos`; the survey-side exclusion is `modules/M04` §5).
- **No subscription/plan gate inside the studio's editing surfaces.** Entitlements act at
  save/create and Generate only (`DOC16.gate.design-kw`); the census's broader no-tier-gate
  rule vs superseded D38 is the recorded tension at §6 M05-Q4.
- **Scale-program deferrals, each with its explicit re-evaluation trigger** (`DOC11.deferrals`):
  terrain-following tracker articulation (trigger: a won utility deal with >3° cross-slope in a
  block, or ≥2 lost bids citing it); a server GPU farm; a WASM shading kernel; utility-grade
  electrical autorouting (MV/trenching — detailed-engineering territory, revisit only on demand
  for IFC-grade deliverables); WebXR/photoreal — *"Never, absent a paying driver."*
- **No P50/P90 uncertainty engine in v1** — designed-for as an additive reporting layer
  (M05-56, P2), never a second energy model.
- **The proposal builder, its documents and its Generate-time checks** — `modules/M06`'s
  (`R12` re-homes D22/D34 enforcement there; the studio keeps only its own electrical gate).
- **Crew-facing execution surfaces** — `modules/M08`'s; this module only guarantees its
  outputs carry no money to crew (M05-77).

## 5b. Pass two — DELIVERED (2026-08-05)

DD13's studio deep-dive is complete. The POC codebase was inventoried feature-by-feature
(**1,551 keyed behaviors** across 287 files) and expanded into the sub-suite at
**`prd/modules/M05-studio/`** — 11 documents plus an overview, 432 requirement rows, 54 owner
rulings covering 115 individual fixes *(Final review 2026-08-05: count normalised — a batch
ruling with numbered sub-parts counts once)*, 56 defects each carrying its ruling. This document remains the baseline and its
Appendix A census remains the binding acceptance gate (it never shrinks); the sub-suite deepens
it. Read `M05-studio/00-overview.md` first — it carries the document map and the studio-wide
laws established in pass two. **Build strategy (owner ruling S12-1, 2026-08-05): the POC codebase is the starting point, not a reference.** V2's studio is built by PORTING and RESHAPING `3d_design_studio/` — the engineering core and its ~1,000 tests port as-is, the UI/UX of every screen is rebuilt to the new design, the code is restructured to V2 conventions, and the 56 defects + 115 owner-ruled fixes are applied on top. Never a green-field re-implementation. See `M05-studio/00-overview.md` §5b. Verification: `prd/_process/studio/verification-report.md`
(1,551/1,551 keys dispositioned, zero unresolved references, every P0 with acceptance criteria).

## 6. Open questions

Mirrored into `registers/open-questions.md`.

- **M05-Q1 (→ register Q26) — RESOLVED (owner ruling 2026-08-04, Q26).** Sequence confirmed:
  the studio deep-dive (pass two, DD13) **starts when the owner supplies the studio
  repository** — a dedicated brainstorm → spec → plan cycle expanding M05 feature-by-feature,
  with this census-grounded baseline and Appendix A as the cross-check. Nothing in pass two
  may shrink this baseline; this document does not block on it.
- **M05-Q2 (→ register Q24) — RESOLVED (owner ruling 2026-08-04, Q24).** The reconciliation
  policy is ruled: a superseding survey marks the design **"survey updated — review needed"**
  with the **designer notified**; **draft proposals on it are blocked from sending until the
  review**; **sent proposals stay pinned** (M05-13, now final; the same self-stale pattern as
  catalog releases).
- **M05-Q3 (→ register Q27) — RESOLVED (owner ruling 2026-08-04, Q27).** The customer's 3D
  view ships **inside the proposal link** — a "View in 3D" button on the customer proposal
  page (`F5-33`); no second link exists; captures/pictures remain the fallback (M05-55,
  M05-75). `D5` (no customer login) holds; the unapproved-design gate (M05-82, `F8-29`) binds
  unchanged.
- **M05-Q4 (→ register Q28) — RESOLVED (owner ruling 2026-08-04, Q28).** Confirmed: **zero
  feature gates in the studio.** The tier kW ceiling is the only gate, enforced at
  Save/Generate (never mid-edit); over-ceiling designs stay readable forever; the census's
  "coming soon, never upgrade" copy rule stands as law (M05-12, M05-50; `modules/M12`
  `M12-20`).

## Appendix A — Census acceptance baseline (normative)

**Conformance rule.** `docs/product/studio-census.md` — read post-overlay through
`_process/extraction/studio-census-checklist.md` — is **incorporated by reference, verbatim,
as this module's normative acceptance baseline** (design spec §3.2; owner ruling 2026-07-30,
ADR-0017; `SC.gate.01`–`SC.gate.04`). Every entry below is a binding acceptance item of the
feature area it maps to, at the census's own depth — the entry text, its option lists and its
post-overlay notes govern; this table maps and never abridges. **The census never shrinks:**
no entry may be dropped, downgraded or reworded away in this pass or pass two (DD13); a
conflict between this module's prose and a census entry is a defect in this module. Entries
marked "note" carry a post-overlay `[note: …]` in the checklist (supersessions such as R7's
step count, recorded contradictions such as D38's, and cross-refs); the note is part of the
entry. Entry locators below are the census's own words, carried verbatim-abridged: market-
specific terms inside them (a utility's name, a tax's name, a certification scheme, a currency
sign) are the source market's instances of the pack keys `foundations/F1` defines — the
market-neutral rule governs this module's body (§3), never the incorporated source text.
Total: **401 entries** — the count itself is a conformance check.

### A.gate — Preamble — census status & port gate law (4 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.gate.01` | CANONICAL (owner ruling 2026-07-30): this census is THE acceptance checklist for the 3D Design Stud… | §M05.1 | — |
| `SC.gate.02` | Every tool and every computed output listed here must survive the port, refactored to the design sy… | §M05.1 | note |
| `SC.gate.03` | It is a merge gate for port PRs, on par with typecheck and lint. | §M05.1 | note |
| `SC.gate.04` | Promoted verbatim from `docs/research/phases710.md` §2, which is now historical; the POC repository… | §M05.1 | note |

### A.10-1 — 10.1 Shell + design list + Design Health (20 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.10-1.01` | Entry/design list: studio opens from lead "Create design". | §M05.1 | note |
| `SC.10-1.02` | A lead holds SEVERAL variants (each shows size, generation, price, payback; one "recommended"). | §M05.13 | note |
| `SC.10-1.03` | Design-list actions: New design / duplicate / open. | §M05.13 | — |
| `SC.10-1.04` | 10-step wizard: 1 Project setup · 2 Roof · 3 Obstructions · 4 Components · 5 Panel placement (auto… | §M05.1 | note |
| `SC.10-1.05` | Step states: not started / in progress / done / has errors. | §M05.1 | — |
| `SC.10-1.06` | Compact step indicator (mobile "3 / 10 · Roof ‹ ›" → step-list sheet; desktop step rail). | §M05.1 | note |
| `SC.10-1.07` | Header control: back. | §M05.1 | — |
| `SC.10-1.08` | Header control: step title. | §M05.1 | — |
| `SC.10-1.09` | Header control: Design Health chip. | §M05.1 | — |
| `SC.10-1.10` | Header control: units toggle (m/ft, global). | §M05.1 | note |
| `SC.10-1.11` | Header control: Save. | §M05.2 | note |
| `SC.10-1.12` | Header control: Save & exit to lead. | §M05.1 | — |
| `SC.10-1.13` | Header control: Help (per-step plain language, folds old keyboard cheats into on-screen help). | §M05.1 | — |
| `SC.10-1.14` | Header control: Next/Done. | §M05.1 | — |
| `SC.10-1.15` | Per-step Next gate with plain reason ("Draw at least one roof", "Fix the string design before conti… | §M05.1 | note |
| `SC.10-1.16` | Hard electrical gate on layout step. | §M05.1 | note |
| `SC.10-1.17` | Design Health: score /100 + band Good / Fair / Poor across energy, electrical, roof-utilisation. | §M05.1 | — |
| `SC.10-1.18` | Health sheet shows per-category scores and specific deductions ("−8 · off-south orientation"). | §M05.1 | — |
| `SC.10-1.19` | Health sheet shows a "what changed since last save" delta. | §M05.1 | — |
| `SC.10-1.20` | Design Health provisional state while shading recalculates. | §M05.1 | note |

### A.10-2 — 10.2 Step 1 · Project setup & location (20 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.10-2.01` | Pre-fill from survey (Phase 5): address/location/site details carried over, editable. | §M05.3 | note |
| `SC.10-2.02` | Field: project name. | §M05.3 | — |
| `SC.10-2.03` | Field: customer name. | §M05.3 | — |
| `SC.10-2.04` | Field: customer phone. | §M05.3 | — |
| `SC.10-2.05` | Field: Country (India). | §M05.3 | note |
| `SC.10-2.06` | Field: State. | §M05.3 | note |
| `SC.10-2.07` | Field: DISCOM (sets default tariff). | §M05.3 | note |
| `SC.10-2.08` | Field: Site type Residential/Commercial. | §M05.3 | note |
| `SC.10-2.09` | Field: Connection Single/Three phase. | §M05.3 | — |
| `SC.10-2.10` | Field: Sanctioned load (kW). | §M05.3 | — |
| `SC.10-2.11` | Field: Electricity tariff ₹/kWh (auto-filled, editable). | §M05.3 | note |
| `SC.10-2.12` | Field: Average monthly bill ₹ (feeds Step-4 size suggestion). | §M05.3 | — |
| `SC.10-2.13` | Field: Company logo upload (max 5 MB, PNG/JPG). | §M05.3 | note |
| `SC.10-2.14` | Field: Ground-mount / open-access project — a normal option, no PRO/tier gate (D38); if not functio… | §M05.3 | note |
| `SC.10-2.15` | Location: search address (autocomplete) OR enter coordinates. | §M05.3 | — |
| `SC.10-2.16` | Location: satellite map — redesign pin placement (code has a FIXED pin + drag-map-underneath, confu… | §M05.3 | — |
| `SC.10-2.17` | "Confirm location" → Solar Data card (irradiance kWh/m²/day, peak sun hours, source label → becomes… | §M05.3 | note |
| `SC.10-2.18` | Site Intelligence (Google Solar Building Insights): async, four states loading / unavailable / unre… | §M05.3 | note |
| `SC.10-2.19` | Site Intelligence "ok" shows: max panels (~kWp), roof area, sunshine h/yr, roof faces, imagery date… | §M05.3 | — |
| `SC.10-2.20` | Guard: relocating the pin >25 m WIPES the whole design (roofs, panels, etc.) — keep the guard, make… | §M05.3 | — |

### A.10-3 — 10.3 Step 2 · Roof setup (touch-first CAD) (42 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.10-3.01` | Mode toolbar tool: Select. | §M05.4 | — |
| `SC.10-3.02` | Mode toolbar tool: Draw roof. | §M05.4 | — |
| `SC.10-3.03` | Mode toolbar tool: Detect roofs (AI). | §M05.4 | — |
| `SC.10-3.04` | Mode toolbar tool: Ortho-snap toggle. | §M05.4 | — |
| `SC.10-3.05` | Mode toolbar tool: Show all measurements. | §M05.4 | — |
| `SC.10-3.06` | Mode toolbar tool: Measure distance. | §M05.4 | — |
| `SC.10-3.07` | Mode toolbar tool: View in 3D. | §M05.4 | — |
| `SC.10-3.08` | Mode toolbar tool: Undo. | §M05.4 | — |
| `SC.10-3.09` | Mode toolbar tool: Redo. | §M05.4 | — |
| `SC.10-3.10` | AI Detect geometric pipeline: Google dataLayers → outline, pitch, azimuth, eave height, obstruction… | §M05.4 | note |
| `SC.10-3.11` | AI Detect fallback: Gemini photo fallback (shapes only, no height/pitch). | §M05.4 | note |
| `SC.10-3.12` | AI Detect results appear as ghosts to accept/reject: tap ghost include/exclude, align nudge, "add s… | §M05.4 | — |
| `SC.10-3.13` | Roof list: one chip per roof (select · lock · delete, with area). | §M05.4 | — |
| `SC.10-3.14` | Drawing (touch): choose Draw → tap corners; live edge-length labels. | §M05.4 | — |
| `SC.10-3.15` | CAD snapping: angle-relative, object-snap to other roofs, alignment guide rays, right-angle marks,… | §M05.4 | — |
| `SC.10-3.16` | Drawing: tap near first point to close; "complete shape?" confirm. | §M05.4 | — |
| `SC.10-3.17` | Drawing: undo / last-point-remove. | §M05.4 | — |
| `SC.10-3.18` | Drawing: rejects too-close points with a plain message. | §M05.4 | — |
| `SC.10-3.19` | Editing a roof: tap-select → big handles. | §M05.4 | note |
| `SC.10-3.20` | Roof edit handle: move vertex. | §M05.4 | — |
| `SC.10-3.21` | Roof edit handle: insert vertex on edge. | §M05.4 | — |
| `SC.10-3.22` | Roof edit handle: delete vertex. | §M05.4 | — |
| `SC.10-3.23` | Roof edit handle: move whole roof. | §M05.4 | — |
| `SC.10-3.24` | Roof edit handle: rotate whole roof (snap-to-15° control). | §M05.4 | — |
| `SC.10-3.25` | Roof edit: tap edge length to type exact metres. | §M05.4 | — |
| `SC.10-3.26` | Per-roof action: roof type. | §M05.4 | — |
| `SC.10-3.27` | Per-roof action: height & parapet. | §M05.4 | — |
| `SC.10-3.28` | Per-roof action: exact vertex coordinates (X/Y). | §M05.4 | — |
| `SC.10-3.29` | Per-roof action: duplicate. | §M05.4 | — |
| `SC.10-3.30` | Roof type sheet options: RCC flat · Metal shed · Tile · Ground array. | §M05.4 | — |
| `SC.10-3.31` | Roof type sheet: where the footprint allows, Pitched gable (2 faces) or Pitched hip (4 faces) with… | §M05.4 | — |
| `SC.10-3.32` | Roof type sheet: disabled options explain why. | §M05.4 | — |
| `SC.10-3.33` | Height & parapet sheet: height-from-ground. | §M05.4 | — |
| `SC.10-3.34` | Height & parapet sheet: "Google detected N° facing DIR — apply/dismiss" pitch/azimuth suggestion ba… | §M05.4 | note |
| `SC.10-3.35` | Height & parapet sheet: pitch. | §M05.4 | — |
| `SC.10-3.36` | Height & parapet sheet: "slopes toward" picker (tap low edge, compass read-out, "south is best" tip… | §M05.4 | — |
| `SC.10-3.37` | Height & parapet sheet: edge setback (uniform + per-edge). | §M05.4 | — |
| `SC.10-3.38` | Height & parapet sheet: parapet-wall toggle → direction, height, width, auto-skip shared walls, per… | §M05.4 | — |
| `SC.10-3.39` | Calibration: measure two points → enter actual metres → applies scale correction (+ expert north of… | §M05.4 | — |
| `SC.10-3.40` | Dependent-items guard: a geometry change orphaning downstream items → "keep current / keep for revi… | §M05.4 | — |
| `SC.10-3.41` | Carries roof provenance (manual / AI-detected + confidence). | §M05.4 | note |
| `SC.10-3.42` | Add pinch-zoom + two-finger pan (missing in code). | §M05.4 | note |

### A.10-4 — 10.4 Step 3 · Obstructions (42 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.10-4.01` | Always on screen: satellite canvas with Step-2 roofs as READ-ONLY backdrop (fill + red-dashed setba… | §M05.5 | — |
| `SC.10-4.02` | Always on screen: every obstruction drawn to scale with a small ID chip (type code + number, e.g. W… | §M05.5 | — |
| `SC.10-4.03` | Always on screen: a red-dashed setback ring per blocking object. | §M05.5 | — |
| `SC.10-4.04` | Always on screen: north indicator. | §M05.5 | — |
| `SC.10-4.05` | Always on screen: graphic scale bar. | §M05.5 | — |
| `SC.10-4.06` | Always on screen: zoom in/out + live zoom % + fit view. | §M05.5 | — |
| `SC.10-4.07` | Always on screen: pan/zoom free except while placing or mid-drag. | §M05.5 | — |
| `SC.10-4.08` | Always on screen: undo/redo (one gesture = one step). | §M05.5 | — |
| `SC.10-4.09` | Always on screen: units (m/ft). | §M05.5 | — |
| `SC.10-4.10` | Tool 1 of 5: Add obstruction (badge = current count) → type picker. | §M05.5 | — |
| `SC.10-4.11` | Tool 2 of 5: Show/Hide obstructions (also clears selection). | §M05.5 | — |
| `SC.10-4.12` | Tool 3 of 5: Show all measurements (roof + rectangular-obstruction edge labels). | §M05.5 | — |
| `SC.10-4.13` | Tool 4 of 5: Measure distance (two-point ruler; restarts clear prior). | §M05.5 | — |
| `SC.10-4.14` | Tool 5 of 5: Open 3D view (→10.7, returns). | §M05.5 | — |
| `SC.10-4.15` | Type picker — ELEVEN types with icon, name, default L×W×H (m): Tank WT 2×1.5×1.2 · Dish DS 1×1×1.2… | §M05.5 | note |
| `SC.10-4.16` | Choosing a type → placement mode ("Click to place {type} · Esc to cancel"); the next tap drops it a… | §M05.5 | note |
| `SC.10-4.17` | On placement the app auto-detects which roof the object sits on (or "on ground") and auto-names it… | §M05.5 | — |
| `SC.10-4.18` | Direct manipulation: move (grab point stays under finger; re-checks roof on release). | §M05.5 | — |
| `SC.10-4.19` | Direct manipulation: resize rectangle (4 corner handles, L/W). | §M05.5 | — |
| `SC.10-4.20` | Direct manipulation: resize circle (1 handle, diameter). | §M05.5 | — |
| `SC.10-4.21` | Direct manipulation: rotate (stem handle, 15° snap or free). | §M05.5 | — |
| `SC.10-4.22` | Direct manipulation constraint: no dimension below 0.3 m. | §M05.5 | — |
| `SC.10-4.23` | Direct manipulation constraint: a locked object can't move/resize/rotate. | §M05.5 | — |
| `SC.10-4.24` | Context action 1 of 7: Duplicate (offset copy, recomputes roof). | §M05.5 | — |
| `SC.10-4.25` | Context action 2 of 7: Shape. | §M05.5 | — |
| `SC.10-4.26` | Context action 3 of 7: Size & rotation. | §M05.5 | — |
| `SC.10-4.27` | Context action 4 of 7: Settings. | §M05.5 | — |
| `SC.10-4.28` | Context action 5 of 7: Lock/Unlock. | §M05.5 | — |
| `SC.10-4.29` | Context action 6 of 7: Delete. | §M05.5 | — |
| `SC.10-4.30` | Context action 7 of 7: Deselect. | §M05.5 | note |
| `SC.10-4.31` | Precise positioning without a mouse: fine + larger nudge steps; rotate in exact degrees. | §M05.5 | — |
| `SC.10-4.32` | Shape options: Rectangle (L×W) or Circle (diameter), switchable. | §M05.5 | — |
| `SC.10-4.33` | Size & rotation: typed exactly in the current unit — Rectangle L/W/H; Circle diameter/H; Rotation 0… | §M05.5 | — |
| `SC.10-4.34` | Height drives shadow + bridging maths. | §M05.5 | — |
| `SC.10-4.35` | Settings: SETBACK 0–3 m in 0.1 m steps (draws the red ring; "buffer zone where panels cannot be pla… | §M05.5 | — |
| `SC.10-4.36` | Settings: CASTS SHADOW on/off (inclusion in the shading sim). | §M05.5 | — |
| `SC.10-4.37` | Settings: BLOCKS PANEL PLACEMENT on/off → reveals the nested bridging chain. | §M05.5 | — |
| `SC.10-4.38` | Bridging chain: Panels may bridge above on/off. | §M05.5 | — |
| `SC.10-4.39` | Bridging chain: Must remain open to sky on/off → when OFF reveals Clearance above it 0–1 m in 0.05… | §M05.5 | note |
| `SC.10-4.40` | Settings: CONVERT TO ROOFTOP PLATFORM (one-tap: replaces the obstruction with a new roof surface "{… | §M05.5 | — |
| `SC.10-4.41` | Settings: HEIGHT INFORMATION (read-only: placement roof name or "On ground", base surface height, t… | §M05.5 | — |
| `SC.10-4.42` | Live updates: owning roof (re-checked on move), base/top heights, required bridging clearance, setb… | §M05.5 | — |

### A.10-5 — 10.5 Step 4 · Components (41 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.10-5.01` | Three parts in order: Panel → Capacity → Inverter (each shows done-state + current choice, reopenab… | §M05.6 | — |
| `SC.10-5.02` | Panel: selected-panel summary (brand, model, dimensions, Voc/Vmp/Isc, wattage large). | §M05.6 | — |
| `SC.10-5.03` | Panel: Search. | §M05.6 | note |
| `SC.10-5.04` | Panel filter: min/max watt. | §M05.6 | — |
| `SC.10-5.05` | Panel filter: Technology — All Types · Mono PERC · TOPCon · Bifacial · Poly · HJT. | §M05.6 | — |
| `SC.10-5.06` | Panel filter: DCR on/off. | §M05.6 | note |
| `SC.10-5.07` | Panel filter: ALMM on/off. | §M05.6 | note |
| `SC.10-5.08` | Panel search: result count. | §M05.6 | — |
| `SC.10-5.09` | Panel list rows: brand mark, brand + model, "watt · technology · dimensions", ALMM/DCR badges. | §M05.6 | — |
| `SC.10-5.10` | Available-later route 1: enter panel specs manually. | §M05.6 | note |
| `SC.10-5.11` | Available-later route 2: upload datasheet (PDF extraction). | §M05.6 | note |
| `SC.10-5.12` | Capacity: target capacity kWp (0.1 steps). | §M05.6 | — |
| `SC.10-5.13` | Capacity: Auto = maximum fit after setbacks + obstructions (unavailable until a panel is chosen and… | §M05.6 | — |
| `SC.10-5.14` | Capacity: Google Solar cross-check line ("estimates max N panels ~X kWp", info only). | §M05.6 | note |
| `SC.10-5.15` | Capacity: bill-based suggestion ("From your ₹X/month bill we recommend ~Y kWp", tap applies; X from… | §M05.6 | — |
| `SC.10-5.16` | Capacity: Continue unavailable while capacity is 0. | §M05.6 | — |
| `SC.10-5.17` | Inverter: recommended line ("Recommended: {brand} {model} ({kW}×{count}, {phase}) → DC/AC ratio X",… | §M05.6 | — |
| `SC.10-5.18` | Inverter: selected summary (brand, model, #MPPTs, voltage range, phases, efficiency, kW large). | §M05.6 | — |
| `SC.10-5.19` | Inverter: number of inverters 1–10. | §M05.6 | — |
| `SC.10-5.20` | Inverter: DC/AC ratio live health — >1.35 high (clipping risk), <0.90 low (oversized), 0.90–1.35 he… | §M05.6 | — |
| `SC.10-5.21` | Inverter: search + count + list (kW · phase · MPPT count · voltage range, recommended badge). | §M05.6 | — |
| `SC.10-5.22` | After inverter chosen: DC collection topology (String inverters / Central + combiners). | §M05.6 | — |
| `SC.10-5.23` | After inverter chosen: MLPE (None / DC optimisers). | §M05.6 | — |
| `SC.10-5.24` | Compare options (unavailable with no roof). | §M05.6 | — |
| `SC.10-5.25` | Compare states its BASIS: target vs max fill, PVGIS vs built-in estimate, catalog version, warnings. | §M05.6 | note |
| `SC.10-5.26` | Compare column: Option (panel, RECOMMENDED/CURRENT markers, on-order/DCR note). | §M05.6 | — |
| `SC.10-5.27` | Compare column: Inverter (+ DC/AC ratio). | §M05.6 | — |
| `SC.10-5.28` | Compare column: Fits (panels × watt → kWp). | §M05.6 | — |
| `SC.10-5.29` | Compare column: Module efficiency. | §M05.6 | — |
| `SC.10-5.30` | Compare column: Annual generation kWh. | §M05.6 | — |
| `SC.10-5.31` | Compare column: Net cost (subsidy shown separately). | §M05.6 | — |
| `SC.10-5.32` | Compare column: Payback. | §M05.6 | — |
| `SC.10-5.33` | Compare column: 25-year savings (+ ROI%). | §M05.6 | — |
| `SC.10-5.34` | Compare column: Warranty (panel/inverter yrs). | §M05.6 | — |
| `SC.10-5.35` | Compare column: Install (complexity + array weight). | §M05.6 | — |
| `SC.10-5.36` | Compare column: Apply / selected / feasibility. | §M05.6 | — |
| `SC.10-5.37` | Compare: decision cards (topic, choice, reason, inputs). | §M05.6 | — |
| `SC.10-5.38` | Compare: fixed-assumptions footnote (tariff escalation/yr, 25-yr horizon, margin, PM Surya Ghar sub… | §M05.6 | note |
| `SC.10-5.39` | Compare: Apply sets panel + inverter + count in one undoable action. | §M05.6 | — |
| `SC.10-5.40` | Compare: if panels are already placed with a different panel → replace-panel confirmation. | §M05.6 | — |
| `SC.10-5.41` | Live updates: module efficiency, annual kWh, net cost, subsidy, payback, 25-yr savings, ROI%, DC/AC… | §M05.6 | — |

### A.10-6 — 10.6 Steps 5–6 · Panel layout (most tool-dense screen) (66 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.10-6.01` | Arrival (0 panels, "Step 5") option: Place manually. | §M05.7 | note |
| `SC.10-6.02` | Arrival option: Auto-fill panels (to the Step-4 target). | §M05.7 | — |
| `SC.10-6.03` | Arrival option: Use maximum roof capacity. | §M05.7 | — |
| `SC.10-6.04` | VIEW tool: Irradiance heatmap (legend Poor→Excellent 0/50/100% + Jan–Dec month scrubber recolouring… | §M05.7 | — |
| `SC.10-6.05` | VIEW tool: Show strings (series path + routed home-runs). | §M05.7 | — |
| `SC.10-6.06` | VIEW tool: Why this layout? (Design Decision Log + accept/ignore improvement suggestions). | §M05.7 | — |
| `SC.10-6.07` | VIEW tool: Measure distance. | §M05.7 | — |
| `SC.10-6.08` | BUILD tool: Select (default — select / multi-select / move panels / edit cable corners). | §M05.7 | — |
| `SC.10-6.09` | BUILD tool: Panels (TAP = one panel snapped to grid; DRAG = fills a rectangle with a table, auto-av… | §M05.7 | — |
| `SC.10-6.10` | BUILD tool: Erase (removes panel/walkway/rail/arrester/inverter/meter under the pointer; highlights… | §M05.7 | — |
| `SC.10-6.11` | SAFETY tool (with count): Walkway (drag lane; width 600/800/1000 mm or custom 100–3000 mm). | §M05.7 | — |
| `SC.10-6.12` | SAFETY tool (with count): No-build zone / keep-out (drag rectangle; tap an existing one to remove). | §M05.7 | — |
| `SC.10-6.13` | SAFETY tool (with count): Safety rail (drag along edge). | §M05.7 | — |
| `SC.10-6.14` | SAFETY tool (with count): Lightning arrester (tap to place). | §M05.7 | — |
| `SC.10-6.15` | ELECTRICAL tool (with count): Mount inverter — two sub-modes via toggle: Inverter snaps to the near… | §M05.7 | — |
| `SC.10-6.16` | ELECTRICAL tool (with count): Stringing (→ section 5 / stringing options). | §M05.7 | — |
| `SC.10-6.17` | ELECTRICAL tool (with count): String connections (read-only list of every string + its exact panel… | §M05.7 | — |
| `SC.10-6.18` | Always available: Undo/Redo (one gesture = one step). | §M05.7 | — |
| `SC.10-6.19` | Always available: Lock/Unlock layout. | §M05.7 | — |
| `SC.10-6.20` | Always available: Clear all panels (confirm first; unavailable when locked or empty). | §M05.7 | — |
| `SC.10-6.21` | Canvas: pan/zoom (Select mode; suspended mid-gesture). | §M05.7 | — |
| `SC.10-6.22` | Canvas: tap select. | §M05.7 | — |
| `SC.10-6.23` | Canvas: marquee box select + add-to-selection. | §M05.7 | — |
| `SC.10-6.24` | Canvas: move (live outline; a refused move explains why). | §M05.7 | — |
| `SC.10-6.25` | Canvas: cable-route editing (drag corner points, pull a straight segment for a new corner, marks th… | §M05.7 | — |
| `SC.10-6.26` | Canvas: every draw tool previews live. | §M05.7 | — |
| `SC.10-6.27` | When panels selected: shows the count. | §M05.7 | — |
| `SC.10-6.28` | Selection action: Group (loose → parametric TABLE; needs 2+ on the same roof, not already grouped). | §M05.7 | — |
| `SC.10-6.29` | Selection action: Grow a row/column (one tap on a side with space; says when there is no room). | §M05.7 | — |
| `SC.10-6.30` | Selection action: More grow options (axis row/col, count 1–20, side, live preview, "Add N"). | §M05.7 | — |
| `SC.10-6.31` | Selection action: Rotate (90° each way; azimuth shown or "mixed"). | §M05.7 | — |
| `SC.10-6.32` | Selection action: Tilt (5° steps; current shown). | §M05.7 | — |
| `SC.10-6.33` | Selection action: Table settings (only when a table is selected). | §M05.7 | — |
| `SC.10-6.34` | Selection action: Enable/Disable (stops production without deleting). | §M05.7 | — |
| `SC.10-6.35` | Selection action: Delete. | §M05.7 | — |
| `SC.10-6.36` | Selection action: Clear selection. | §M05.7 | — |
| `SC.10-6.37` | All selection actions disabled when the layout is locked. | §M05.7 | — |
| `SC.10-6.38` | Stringing option: Auto string (groups panels into valid strings for the inverter MPPTs + auto-route… | §M05.7 | — |
| `SC.10-6.39` | Stringing option: Manual string (tap-to-wire; live "N of min–max panels" counter; running cold-weat… | §M05.7 | — |
| `SC.10-6.40` | Stringing option: Clear strings (only when strings exist). | §M05.7 | — |
| `SC.10-6.41` | Table settings: header (name, rows × cols, panel count, kWp). | §M05.7 | — |
| `SC.10-6.42` | Table settings: Structure preset (Flush · Standard 10° · Walk-under 2.2 m, cross-section previews,… | §M05.7 | — |
| `SC.10-6.43` | Table settings: Ground foundation, ground-mount only (Driven pile · Ballasted, "soil survey require… | §M05.7 | — |
| `SC.10-6.44` | Table settings: Racking (Flush · Fixed tilt · Dual tilt). | §M05.7 | — |
| `SC.10-6.45` | Table settings: Panel tilt (when not flush, 0–35°). | §M05.7 | — |
| `SC.10-6.46` | Table settings: Inter-row shading (when not flush: recommended winter shadow-free row pitch m, resu… | §M05.7 | — |
| `SC.10-6.47` | Table settings: Azimuth (±5° steps, Due South preset, Roof slope preset, live degrees + compass). | §M05.7 | — |
| `SC.10-6.48` | Table settings: Structure profile (steel section, weight per metre). | §M05.7 | — |
| `SC.10-6.49` | Table settings: Structure member model (preview + counted bill: legs, rafters, purlins, braces — co… | §M05.7 | — |
| `SC.10-6.50` | Table settings: Structure disclaimer always (material estimate + visual model, not a wind/uplift/ro… | §M05.7 | note |
| `SC.10-6.51` | Table settings: Duplicate table. | §M05.7 | — |
| `SC.10-6.52` | Table settings: Delete table. | §M05.7 | — |
| `SC.10-6.53` | Validation summary (first problem + "+N more") opening the full list of errors/warnings. | §M05.7 | — |
| `SC.10-6.54` | Validation item: string voltage too high in cold. | §M05.7 | — |
| `SC.10-6.55` | Validation item: voltage below MPPT window. | §M05.7 | — |
| `SC.10-6.56` | Validation item: panel current above MPPT input. | §M05.7 | — |
| `SC.10-6.57` | Validation item: DC/AC too high/low. | §M05.7 | — |
| `SC.10-6.58` | Validation item: panels unstrung. | §M05.7 | — |
| `SC.10-6.59` | Validation item: more strings than MPPT inputs. | §M05.7 | — |
| `SC.10-6.60` | Validation item: "no valid string length exists for this panel/inverter pair". | §M05.7 | — |
| `SC.10-6.61` | Every validation entry taps to LOCATE (centres + selects the faulty panels). | §M05.7 | — |
| `SC.10-6.62` | Inline "Auto-string now" where relevant. | §M05.7 | — |
| `SC.10-6.63` | Hard gate: invalid electrical blocks the next step, reason stated. | §M05.7 | note |
| `SC.10-6.64` | Status read-out: enabled panel count, kWp vs target, string colour key, DC cable length (routed vs… | §M05.7 | — |
| `SC.10-6.65` | 3D button. | §M05.7 | — |
| `SC.10-6.66` | No subscription/plan-capacity limit anywhere (D38); flagging kWp over TARGET stays as a design cue. | §M05.7 | note |

### A.10-7 — 10.7 The 3D view (one shared surface, opened over editor steps) (43 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.10-7.01` | Camera: orbit / pan / zoom (never below the horizon). | §M05.8 | — |
| `SC.10-7.02` | Camera: three presets Top / Isometric / Front. | §M05.8 | — |
| `SC.10-7.03` | Camera: close → 2D. | §M05.8 | — |
| `SC.10-7.04` | Camera: on-screen equivalents for all keyboard-only controls. | §M05.8 | note |
| `SC.10-7.05` | Sun & shadow: season presets Winter / Summer / Equinox / Today. | §M05.8 | — |
| `SC.10-7.06` | Sun & shadow: date picker. | §M05.8 | — |
| `SC.10-7.07` | Sun & shadow: Play/Pause (animates the sun, shadows move). | §M05.8 | — |
| `SC.10-7.08` | Sun & shadow: time-of-day 5 AM–7 PM. | §M05.8 | — |
| `SC.10-7.09` | Sun & shadow: sunrise/sunset. | §M05.8 | — |
| `SC.10-7.10` | Sun & shadow: sun-position read-out (compass + azimuth/altitude °). | §M05.8 | — |
| `SC.10-7.11` | Sun & shadow: sun-path toggle (arc with hours). | §M05.8 | — |
| `SC.10-7.12` | Shadows cast by roofs, parapets, obstructions, structure, panels. | §M05.8 | — |
| `SC.10-7.13` | Layer/view mode: Irradiance heatmap (moves to top-down, stops rotation, legend Poor→Excellent + mon… | §M05.8 | note |
| `SC.10-7.14` | Layer/view mode: Solar-access view (tints each panel by actual sun). | §M05.8 | — |
| `SC.10-7.15` | Layer/view mode: Energy report (→ section 6 / the report block below). | §M05.8 | — |
| `SC.10-7.16` | Layer/view mode: Map ⇄ Mesh (Map = model on satellite in context; Mesh = isolated product render on… | §M05.8 | — |
| `SC.10-7.17` | Layer/view mode: Neighbour buildings — decorative only; state plainly they do NOT cast shadows; a r… | §M05.8 | note |
| `SC.10-7.18` | Copy customer share link (read-only 3D; hidden in read-only mode). | §M05.8 | note |
| `SC.10-7.19` | Back to 2D. | §M05.8 | — |
| `SC.10-7.20` | Editing in 3D (tap module or structure member → edit card): This panel (solar-access %, share of an… | §M05.8 | — |
| `SC.10-7.21` | 3D edit card: Structure presets Flush / Standard 10° / Walk-under 2.2 m. | §M05.8 | — |
| `SC.10-7.22` | 3D edit card: Module visibility Show / Ghost / Hide (view aid, never saved). | §M05.8 | — |
| `SC.10-7.23` | 3D edit card: Table scope All tables / Isolate this one (view aid). | §M05.8 | — |
| `SC.10-7.24` | 3D edit card: Structure profile (steel section, cross-section shape, size mm, weight/m). | §M05.8 | — |
| `SC.10-7.25` | 3D edit card: Foundation (PCC pedestal · Chemical anchor · Ballast block · Driven pile; options tal… | §M05.8 | — |
| `SC.10-7.26` | 3D edit card: Shuttering form (cast pedestals only: Square or Circular; circular ≈ ⅕ less concrete). | §M05.8 | — |
| `SC.10-7.27` | 3D edit card: Foundation honesty note (size nominal + assumed, adds roof weight, roof capacity NOT… | §M05.8 | note |
| `SC.10-7.28` | 3D edit card: Tilt (5° steps, 0–35°). | §M05.8 | — |
| `SC.10-7.29` | 3D edit card: Clearance (0.3 m steps, 0–3 m). | §M05.8 | — |
| `SC.10-7.30` | 3D edit card: Customise mounting structure (Purlins per row 1–6 · Rafter density 1–3× in half steps… | §M05.8 | — |
| `SC.10-7.31` | 3D edit card: Edit legs (2D) (top-down plan, Auto/Custom marker + leg count, Add leg, Reset to auto… | §M05.8 | — |
| `SC.10-7.32` | Energy report: freshness note when shading is recalculating (provisional). | §M05.8 | — |
| `SC.10-7.33` | Energy report: system summary (kWp, panel count + per-panel W, roof area). | §M05.8 | — |
| `SC.10-7.34` | Energy report: annual generation (annual MWh large + specific yield kWh/kWp + performance ratio % +… | §M05.8 | note |
| `SC.10-7.35` | Energy report: monthly generation (12 months, monsoon distinct, exact kWh). | §M05.8 | note |
| `SC.10-7.36` | Energy report: losses breakdown (temperature, soiling, inverter, mismatch, DC wiring, measured shad… | §M05.8 | — |
| `SC.10-7.37` | Energy report: solar access (avg %, the same metric as the heatmap). | §M05.8 | — |
| `SC.10-7.38` | Energy report: 25-year projection (lifetime MWh + year-25 output with % of year 1). | §M05.8 | — |
| `SC.10-7.39` | Energy report: financials (net cost after subsidy, yearly savings at tariff, payback yrs). | §M05.8 | note |
| `SC.10-7.40` | Energy report: financing options (card per option, headline + monthly, "representative terms"). | §M05.8 | — |
| `SC.10-7.41` | Energy report actions: Customize Proposal (→ Step 7) + Quick Generate (→ proposal); hidden in read-… | §M05.8 | note |
| `SC.10-7.42` | Charts use DATA colours, never brass accent. | §M05.8 | note |
| `SC.10-7.43` | Read-only (customer share) state: no edit controls, no share button. | §M05.8 | — |

### A.10-8 — 10.8 Step 7 · Proposal captures & readiness (20 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.10-8.01` | Phase A — Capture studio: four fixed shots, each stating name / date / hour. | §M05.9 | — |
| `SC.10-8.02` | Fixed shot 1: Summer Morning 9:00. | §M05.9 | — |
| `SC.10-8.03` | Fixed shot 2: Summer Noon 12:00. | §M05.9 | — |
| `SC.10-8.04` | Fixed shot 3: Solar Access (Summer) 12:00. | §M05.9 | — |
| `SC.10-8.05` | Fixed shot 4: Solar Access (Winter) 12:00. | §M05.9 | — |
| `SC.10-8.06` | Control: Capture (from the current 3D view). | §M05.9 | — |
| `SC.10-8.07` | Control: progress "Shadow captures: N of 4". | §M05.9 | — |
| `SC.10-8.08` | Control: four numbered shot buttons (tick when captured; tap to jump/retake). | §M05.9 | — |
| `SC.10-8.09` | Behaviour: auto-advances to the next uncaptured shot. | §M05.9 | — |
| `SC.10-8.10` | Behaviour: first capture auto-becomes the cover image. | §M05.9 | — |
| `SC.10-8.11` | Control: Skip to review. | §M05.9 | — |
| `SC.10-8.12` | Save-error state (storage full / private browsing) — honest + with a remedy. | §M05.9 | — |
| `SC.10-8.13` | Phase B — Review: "Before you issue" readiness card with verdict NOT READY · READY WITH CAVEATS · R… | §M05.9 | — |
| `SC.10-8.14` | Readiness card: each checked thing with status (ready / needs attention / blocking) + its meaning +… | §M05.9 | — |
| `SC.10-8.15` | Review: cover image preview (or "no cover captured yet"). | §M05.9 | — |
| `SC.10-8.16` | Review: the shadow set — four captures; each shows the image or "Not captured", name, date/hour, "O… | §M05.9 | — |
| `SC.10-8.17` | Review: system summary (kWp, panel count × watts, avg solar access %, annual generation). | §M05.9 | — |
| `SC.10-8.18` | Review action: Edit photos (→ capture studio). | §M05.9 | — |
| `SC.10-8.19` | Review action: Generate proposal (marks the design proposal-ready; hands numbers + captures to Phas… | §M05.9 | note |
| `SC.10-8.20` | Staleness law: a capture taken before a design change is stale and must say so, not silently show a… | §M05.9 | note |

### A.10-9 — 10.9 Step 8 · SLD & drawings (37 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.10-9.01` | Four drawing tabs: SLD · PV Layout · String Route · Structure. | §M05.10 | — |
| `SC.10-9.02` | Each tab is a proper drawing sheet (zoom/pan within its area) + title block (project, client, date,… | §M05.10 | — |
| `SC.10-9.03` | SLD content: each string with panel count + voltage. | §M05.10 | — |
| `SC.10-9.04` | SLD content: string combiner boxes (central topology). | §M05.10 | — |
| `SC.10-9.05` | SLD content: DCDB with fuse, SPD, isolator. | §M05.10 | — |
| `SC.10-9.06` | SLD content: inverter (label, kW, phase, MPPT range, unit count). | §M05.10 | — |
| `SC.10-9.07` | SLD content: ACDB with MCCB, SPD, isolator. | §M05.10 | — |
| `SC.10-9.08` | SLD content: generation + net meters + grid. | §M05.10 | — |
| `SC.10-9.09` | SLD content: earthing pits. | §M05.10 | — |
| `SC.10-9.10` | SLD content: String/MPPT schedule table. | §M05.10 | — |
| `SC.10-9.11` | SLD content: Plant details table. | §M05.10 | — |
| `SC.10-9.12` | SLD content: structural disclaimer note. | §M05.10 | note |
| `SC.10-9.13` | PV Layout sheet: roofs with edge dimensions, every panel, obstruction buffers, north arrow, legend,… | §M05.10 | — |
| `SC.10-9.14` | String Route sheet: roof outlines + each string's cable route labelled + string schedule (says so w… | §M05.10 | — |
| `SC.10-9.15` | Structure sheet: structural drawing of the mounting system. | §M05.10 | — |
| `SC.10-9.16` | Compliance check (SLD): MAXIMUM SYSTEM VOLTAGE box — longest string's cold-weather voltage vs inver… | §M05.10 | — |
| `SC.10-9.17` | Control: Three-line toggle (SLD only — draw line/neutral/earth vs single-line shorthand). | §M05.10 | — |
| `SC.10-9.18` | Control: Edit ratings (SLD only, with a count of overrides) form. | §M05.10 | — |
| `SC.10-9.19` | Edit ratings field: Inverter name/model + AC rating kW. | §M05.10 | — |
| `SC.10-9.20` | Edit ratings field: DC side cable mm² (2.5 / 4 / 6 / 10). | §M05.10 | — |
| `SC.10-9.21` | Edit ratings field: DC fuse A (15 / 20 / 25 / 32). | §M05.10 | — |
| `SC.10-9.22` | Edit ratings field: DC SPD type (Type-I / Type-II / Type-I+II). | §M05.10 | — |
| `SC.10-9.23` | Edit ratings field: DC isolator A (25 / 32 / 40 / 63). | §M05.10 | — |
| `SC.10-9.24` | Edit ratings field: AC side cable mm² (4 up to 95). | §M05.10 | — |
| `SC.10-9.25` | Edit ratings field: AC cable type (PVC copper / XLPE copper / XLPE aluminium). | §M05.10 | — |
| `SC.10-9.26` | Edit ratings field: MCCB rating A (also sets the isolator). | §M05.10 | — |
| `SC.10-9.27` | Edit ratings field: AC SPD type. | §M05.10 | — |
| `SC.10-9.28` | Edit ratings field: Grid & standards (IS/IEC 62548·CEA, IEC 60364-7-712, or NEC 690). | §M05.10 | note |
| `SC.10-9.29` | Edit ratings actions: Reset to auto (disabled when nothing is overridden), Cancel, Save (only value… | §M05.10 | — |
| `SC.10-9.30` | Structural verification two-state: Pending verification ⇄ Engineer approved (human sign-off; the ap… | §M05.10 | note |
| `SC.10-9.31` | High-wind marker derived from site state (display only; engineer verification mandatory in a high-w… | §M05.10 | — |
| `SC.10-9.32` | Export: SVG (CAD). | §M05.10 | — |
| `SC.10-9.33` | Export: PNG. | §M05.10 | — |
| `SC.10-9.34` | Export: DXF (layout). | §M05.10 | — |
| `SC.10-9.35` | Export: Print / Save as PDF. | §M05.10 | note |
| `SC.10-9.36` | Empty state when nothing is strung: "Auto-string now" (unavailable until a panel + inverter + ≥1 pl… | §M05.10 | — |
| `SC.10-9.37` | First-visit colour-legend explainer (DC / inverter / AC / earthing; dismissable). | §M05.10 | — |

### A.10-10 — 10.10 Step 9 · BOM & pricing (the ~286-control screen) (47 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.10-10.01` | Money summary figure 1 of 9: System kWp. | §M05.11 | — |
| `SC.10-10.02` | Money summary figure 2 of 9: Cost before margin. | §M05.11 | — |
| `SC.10-10.03` | Money summary figure 3 of 9: Margin % (editable 0–60). | §M05.11 | — |
| `SC.10-10.04` | Money summary figure 4 of 9: Discount (editable, value + % or ₹). | §M05.11 | note |
| `SC.10-10.05` | Money summary figure 5 of 9: Taxable (with a "−₹X off" line when discounted). | §M05.11 | — |
| `SC.10-10.06` | Money summary figure 6 of 9: GST (per-rate breakdown when rates are mixed). | §M05.11 | note |
| `SC.10-10.07` | Money summary figure 7 of 9: Quote total. | §M05.11 | note |
| `SC.10-10.08` | Money summary figure 8 of 9: ₹ per Wp. | §M05.11 | — |
| `SC.10-10.09` | Money summary figure 9 of 9: Subsidy (+ reason when ₹0). | §M05.11 | — |
| `SC.10-10.10` | The BOM uses the same arithmetic the proposal uses — it cannot produce a different total. | §M05.11 | note |
| `SC.10-10.11` | Category 1 of 6: Modules. | §M05.11 | — |
| `SC.10-10.12` | Category 2 of 6: Inverter. | §M05.11 | — |
| `SC.10-10.13` | Category 3 of 6: Electrical BOS. | §M05.11 | — |
| `SC.10-10.14` | Category 4 of 6: Mechanical BOS. | §M05.11 | — |
| `SC.10-10.15` | Category 5 of 6: Safety. | §M05.11 | — |
| `SC.10-10.16` | Category 6 of 6: Civil & Misc. | §M05.11 | — |
| `SC.10-10.17` | Categories appear in that order and only if they have lines. | §M05.11 | — |
| `SC.10-10.18` | Per category: name, "N of M included", own total, and a Refresh-from-design action (appears once an… | §M05.11 | — |
| `SC.10-10.19` | Electrical BOS survey input: Average DC run (array → inverter). | §M05.11 | — |
| `SC.10-10.20` | Electrical BOS survey input: Average AC run (inverter → LT panel). | §M05.11 | — |
| `SC.10-10.21` | Both cable-run inputs lock with a note when the design has real routed cable geometry (the routed l… | §M05.11 | — |
| `SC.10-10.22` | Line-item field: Include switch (excluding keeps the line but drops it from totals + dims it; never… | §M05.11 | — |
| `SC.10-10.23` | Line-item field: Confidence indicator MEASURED · DERIVED · ESTIMATED · ASSUMED (counted from design… | §M05.11 | note |
| `SC.10-10.24` | Line-item field: Item name (editable on custom lines, fixed on derived). | §M05.11 | — |
| `SC.10-10.25` | Line-item field: Spec. | §M05.11 | — |
| `SC.10-10.26` | Line-item field: Brand (text). | §M05.11 | — |
| `SC.10-10.27` | Line-item field: Quantity (number). | §M05.11 | — |
| `SC.10-10.28` | Line-item field: Unit (nos · set · pairs · kit · lot · plate · panel-set · day · m · m² · kg · kW). | §M05.11 | — |
| `SC.10-10.29` | Line-item field: Waste % (0–100). | §M05.11 | — |
| `SC.10-10.30` | Line-item field: Order quantity (calculated = quantity + waste, rounded up for whole-unit items, re… | §M05.11 | — |
| `SC.10-10.31` | Line-item field: Rate ₹. | §M05.11 | note |
| `SC.10-10.32` | Line-item field: Amount ₹ (calculated, read-only). | §M05.11 | — |
| `SC.10-10.33` | Line-item field: GST % (0–40). | §M05.11 | — |
| `SC.10-10.34` | Line-item field: GST ₹ + Total ₹ (calculated, read-only). | §M05.11 | — |
| `SC.10-10.35` | Line-item field: Derivation explanation (opens the formula in words). | §M05.11 | — |
| `SC.10-10.36` | Line-item field: Remove (custom lines only). | §M05.11 | — |
| `SC.10-10.37` | Line-item field: per-field reset (appears next to overridden values; changes appearance when the de… | §M05.11 | — |
| `SC.10-10.38` | Reconciliation: stale notice per category ("yours X · design now Y" per drifted field + one-tap "Ta… | §M05.11 | — |
| `SC.10-10.39` | Reconciliation: orphan notice (a saved edit whose line no longer exists → Keep as custom line / Dis… | §M05.11 | — |
| `SC.10-10.40` | Reconciliation: below-cost warning (the discount sells under cost). | §M05.11 | note |
| `SC.10-10.41` | Reconciliation: preliminary-quote notice (how many lines are assumed/estimated, and which figures n… | §M05.11 | note |
| `SC.10-10.42` | Reconciliation: structure engineering disclaimer with the site's wind zone (material estimate, not… | §M05.11 | — |
| `SC.10-10.43` | Page action: Add a custom line. | §M05.11 | — |
| `SC.10-10.44` | Page action: Re-sync all (discards every hand-edit; confirm first and state that edits are lost; di… | §M05.11 | — |
| `SC.10-10.45` | Page action: Export CSV. | §M05.11 | note |
| `SC.10-10.46` | Page action: DISCOM compliance checklist (net metering vs sanctioned load · SLD sign-off · module A… | §M05.11 | note |
| `SC.10-10.47` | Totals ARE the proposal money path; each line's confidence + preliminary state travel onto the prop… | §M05.11 | note |

### A.10-11 — 10.11 Step 10 · Done + engineer sign-off (19 entries)

| Census entry | Entry (abridged locator — source text governs) | Carried at | Post-overlay note |
|---|---|---|---|
| `SC.10-11.01` | Done screen: states the design is complete, shows the design/project name, reassures that it can be… | §M05.12 | — |
| `SC.10-11.02` | Done action 1 of 5: View proposal. | §M05.12 | note |
| `SC.10-11.03` | Done action 2 of 5: BOM & pricing (→ Step 9). | §M05.12 | — |
| `SC.10-11.04` | Done action 3 of 5: Installation plan (the existing InstallationSheet). | §M05.12 | note |
| `SC.10-11.05` | Done action 4 of 5: Copy 3D share link. | §M05.12 | note |
| `SC.10-11.06` | Done action 5 of 5: Done (→ the lead's design list). | §M05.12 | — |
| `SC.10-11.07` | Installation plan (REUSE, don't rebuild): crew work-order derived from the design, ordered how it i… | §M05.12 | — |
| `SC.10-11.08` | Installation plan: progress indicator + "done of total steps". | §M05.12 | — |
| `SC.10-11.09` | Installation plan: each step is a tick-off item (number, title, detail, materials needed; tap toggl… | §M05.12 | note |
| `SC.10-11.10` | Installation plan: phase headings. | §M05.12 | — |
| `SC.10-11.11` | Installation plan: Print. | §M05.12 | — |
| `SC.10-11.12` | Installation plan: empty state ("place modules and string the array first"). | §M05.12 | — |
| `SC.10-11.13` | Crew sees NO money — work order, not a quote. | §M05.12 | note |
| `SC.10-11.14` | Engineer sign-off queue for the Engineer role: designs waiting OLDEST FIRST. | §M05.14 | note |
| `SC.10-11.15` | Queue entry shows: customer, system size, who designed it, how long it has been waiting; open → rev… | §M05.14 | — |
| `SC.10-11.16` | Review action: Approve (records structural verification = Engineer approved; the design can now go… | §M05.14 | — |
| `SC.10-11.17` | Review action: Return with comments — each comment PINNED to the thing it refers to, not a loose no… | §M05.14 | note |
| `SC.10-11.18` | Rule that does not bend: the app NEVER computes structural adequacy — it is a human decision, recor… | §M05.14 | note |
| `SC.10-11.19` | Design list for a lead: several variants compared (system size, annual generation, price, payback),… | §M05.13 | note |
