# SCR-MS-17 · Installation Work Order

Derived field document: seven trade phases per roof/table with materials, ticking and print.

**Module:** MS (M05 Design Studio · studio sub-spec MS11) · **Personas:** Project Manager / Installation Coordinator (runs the checklist and attributes work — R16), Design Engineer, Operations · **Context of use:** the crew has no login in v1 (R16, docs/prd/02-personas.md) — the coordinator runs the checklist, typically on a phone on site, one-handed, and attributes ticks with an optional free-text "done by"; the printed sheet goes to paper in the field, so print is a first-class output, not a screenshot; the Project Manager works the web board with mobile for stage moves (docs/prd/02-personas.md persona table).

## Entry & exit

Reached from: the Done step's Installation plan action (SCR-MS-13; M05-75, MS11-04). **Wizard-step gate note:** its entry point sits on the terminal wizard step, which admits only when every earlier gate passes (MS11-01, SCR-MS-13's slice); this sheet itself states the engineering status and is gated on it (MS11-17). Leads to: Print (M05-76, MS11-34); the checklist's execution surface and evidence rules are `modules/M08`'s (M05-76) — this screen is the studio's hand-off artifact to execution, not the execution surface.

## Requirements (verbatim)

### From docs/prd/modules/M05-design-studio.md

- **M05-76** (P0) — **The installation plan is reused, not rebuilt: a crew work-order derived from the design, ordered how it is built, grouped into phases.** Progress indicator + "done of total steps"; each step a tick-off item (number, title, detail, materials needed; tap toggles done, remembered); phase headings; Print; empty state ("place modules and string the array first"). In v1 the coordinator runs the checklist and ticks are attributed to them with an optional free-text "done by" (`R16` via `F2`, cited); the checklist's execution surface and evidence rules are `modules/M08`'s.

### From docs/prd/modules/M05-studio/10-done-and-installation.md

- **MS11-17** (P0) — Unapproved designs cannot reach customer surfaces (S10-1 fixes `.131`, pairs with MS9-06); the installation sheet states the engineering status and is gated on it (S10-1 fixes `installation.10`). _(non-UI half, build-side: unapproved designs never reach customer surfaces — for awareness, not for drawing)_
- **MS11-28** (P0) — A field document derived from the design — never authored — with deterministic step ids, seven ordered trade phases, and structures walked per roof and table (`.38–.42/.58`). _(non-UI half, build-side: derived never authored; deterministic step ids; walked per roof/table — for awareness, not for drawing)_
- **MS11-29** (P0) — Steps as shipped: foundations, legs, rafters, purlins/braces, structured modules, loose modules, per-string wiring, balance-of-system — with counts from the structural model (`.43–.50/.52/.54/.57`), plural-correct titles (S10-2 fixes `.56`) and disabled panels excluded from wiring counts (S10-2 fixes `.51`). _(non-UI half, build-side: counts from structural model; disabled panels excluded from wiring — for awareness, not for drawing)_
- **MS11-30** (P0) — Steps are genuinely distinct per table and roof, with phase headings that do not repeat misleadingly (S10-2 fixes `.9/.24/.60`).
- **MS11-31** (P0) — Materials per step resolve from the BOM correctly — including lines with no source id, excluding lines not supplied, and respecting confidence markers (S10-2 fixes `.61/.62/.64`) (`.59/.63`). _(non-UI half, build-side: BOM resolution: no-source-id lines included, not-supplied excluded, confidence respected — for awareness, not for drawing)_
- **MS11-33** (P0) — Identity block: date, design version, site address, issued-by, and the engineering status per MS11-17 (S10-2 fixes `.11`).
- **MS11-34** (P0) — Print is a designed output: page setup, printable header, and margins that survive real printing (S10-2 fixes `.35/.36/.7/.34/.37`).
- **MS11-35** (P0) — Progress and ticking: step-count progress with its meaning stated (`.19–.22`); ticks PERSIST per project (not device-local) and carry R16 attribution — who ticked, optional "done by" (S10-2 fixes `.14/.16/.30`) (`.25–.33`). _(non-UI half, build-side: ticks persist per project server-side with R16 attribution — for awareness, not for drawing)_
- **MS11-36** (P0) — Empty and partial states are honest: a design with modules but no strings, or with nothing derivable, says what is missing rather than showing an empty plan (S10-2 fixes `.18/.53`) (`.17`).
- **MS11-37** (P0) — Dialog semantics are accessible (modal role, focus management, labelled controls) (S10-2 fixes `.4`) (`.2/.3/.5/.6`).

## States

Three base states, then every screen-specific state from the slice and the rows:

- **loading** — the derived document computes from the design; never a blank sheet.
- **empty / empty-prerequisite-named** — nothing placed/strung → the empty state with the named prerequisite: "place modules and string the array first" (M05-76, MS11-36).
- **error** — derivation or tick persistence fails; states plainly, and a tick that did not persist is never shown as done (MS11-35's persistence law).
- **normal** — the full work order: identity block, seven ordered trade phases walked per roof and table, steps with number/title/detail/materials, progress indicator (M05-76, MS11-28, MS11-29, MS11-30, MS11-33).
- **progress-ticks** — tick-off in progress: tap toggles done, remembered; step-count progress with its meaning stated; who ticked plus optional "done by" (M05-76, MS11-35).
- **print** — the designed print output: page setup, printable header, margins that survive real printing (MS11-34).
- **unapproved-engineering-status** — the sheet states the engineering status and is gated on it (MS11-17).
- **partial-no-strings** — a design with modules but no strings says what is missing rather than showing an empty plan (MS11-36).
- **empty-nothing-derivable** — nothing derivable: says what is missing (MS11-36).
- Any dialog this surface opens (e.g. tick attribution) carries accessible dialog semantics: modal role, focus management, labelled controls (MS11-37).

## Data volume

Design at the Definition of Done's realistic volume: a 221-panel design walked per roof and table across the seven trade phases — dozens of distinct steps with phase headings that must not repeat misleadingly (MS11-30); materials per step resolving from a full bill of materials (the DoD's 40-line BOM) with no-source-id lines included, not-supplied lines excluded and confidence markers respected (MS11-31); the printed form must survive at this volume too (MS11-34).

## Numbers carrying provenance

Each user-visible number carries its F8 provenance tier in the design:

- Progress indicator and "done of total steps" (M05-76, MS11-35)
- Per-step counts derived from the structural model, plural-correct, disabled panels excluded from wiring counts (MS11-29)
- Materials quantities per step resolved from the BOM, confidence markers respected (MS11-31)
- Identity block: date and design version (MS11-33)

For awareness: the same ledger's law that no commercial figure ever reaches this surface (MS11-32, docs/prd/modules/M05-studio/10-done-and-installation.md) — the work order carries quantities, never money.
