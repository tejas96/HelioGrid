# SCR-M08-04 · Installation Checklist

Execute the design's derived work order: tick steps in build order, attach photo evidence, add manual steps, show done-of-total progress; no commercial figures ever.

**Module:** M08 · **Personas:** Project Manager (the coordinator) · Installation Team Member · EPC Owner · **Context of use:** phone in the field, gloves and one hand, ticking steps as work happens. The coordinator often runs the checklist from their own phone for a crew that never signs in. This surface shows no commercial figure regardless of who is looking at it.

**One job:** work the build steps in order, and prove each one.
**Order of attention:** 1 the next step to do · 2 how many are done · 3 the evidence, and who did the work.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **Gloves and one hand:** a step is a tick and a name. **No commercial figure is on this surface,
and nothing says so** — there is no hidden value to explain.

| Fact | Kind | Its form here |
|---|---|---|
| Phases and their steps, in build order (`M08-41`, `MS11-28`, `MS11-29`) | data | the seven trade phases as sections, steps as tick rows: the tick, the step's number and name, and the materials it needs as its second line — quantity and unit. The step's detail opens from the row. Phase and step names are the design's own, in the viewer's language. One provenance label heads each phase's quantities (`F8-07`); a quantity whose confidence differs carries its own (`MS11-31`) |
| Done of total | data | the screen's ONE headline figure, as two counts — done, of total |
| Ticking a step (`M08-42`) | action | one tap on a target sized for a gloved hand; a second tap unticks it (`M05-76`: tap toggles done). A ticked step's second line is who ticked it and when |
| Who actually did the work (`M08-42`, `F2-07`) | data | ONE optional field on the ticked step, with no helper text. It is there whether or not the crew has accounts. What is typed is never translated |
| Photo evidence | action | a camera act on the step; its photographs as thumbnails on the step |
| A step the design could not know about | action · status | `Add a step` ends each phase. A manual step carries its own chip, so the derived sequence stays legible |
| The design changed after work began | status · more detail | one banner saying so; each changed step carries a chip; every tick and its attribution stays. A row leads to what changed. No paragraph reconciles it |
| What the structure steps are, and are not (`F8-28`) | honesty | ONE line in the head, the studio's own structure disclaimer: a material estimate, not a structural check — an engineer verifies. It never repeats per step |
| Which design this is (`MS11-33`) | data | the head's line: design version and its engineer sign-off — who and when, a recorded fact with no tier |
| Every step ticked | status | the headline reads all of them done. The stage does not move: a person moves it (`M08-14`) |
| A person with read scope only (`F2-12`) | status | every phase, step, photo and attribution can be opened and read; no tick, camera, add-step or done-by act is drawn, and nothing is greyed |
| The design is not signed off yet (`M08-41`, `MS11-17`) | status | one line: waiting on engineer sign-off. No step is drawn until it is |
| No design to build from | teaching | the design's own empty line |
| The checklist failed to load | error | one banner — what failed and what to do |

## Arrangement

- **375.** Its home. The phase in progress is open and the others are closed, each showing its counts.
  Done-of-total stays in view as the pinned header's one line.
- **1536.** Phases in a list on the left, the chosen phase's steps on the right, a step's evidence in a
  side panel (`F7-21`).

## Entry & exit

Reached from: the Project Detail (SCR-M08-02), and from the Installer Job Home (SCR-M08-05 — today's job leads to its checklist). Leads to: back to the project, which reads the checklist's progress; completing the checklist does not by itself move the stage — a person moves stages. Other exits: not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### From docs/prd/modules/M08-projects.md

- **M08-41** (P0) — **The installation checklist is reused, not rebuilt.** The steps are the design's derived work order — the real build sequence the studio already produces (`M05-76`, consumed) — and this module owns its *execution*: working the steps, ticking them, attaching evidence, adding a manual step the design could not know about, and the progress the project reads from it. *"Do not rebuild it."* The steps are the latest signed-off design's: before the first engineer sign-off the checklist waits, and a later design edit shows as a change only once it is signed off again (`MS11-17`; owner ruling 2026-09-25). _(non-UI half, build-side: steps are the design's derived work order (M05-76); this module generates no sequence of its own — for awareness, not for drawing)_
- **M08-42** (P0) — **Ticks are attributed to the person who ticked, and an optional free-text "done by" per step records who actually did the work.** `R16` rules the v1 answer and it is carried whole: the coordinator runs the checklist and the attribution never depends on the installer having an account. In V2's preset vocabulary that coordinator is the **Project Manager** — `R16`'s "Manager role" is v1's preset name, and decision B assigns the duty to the Project Manager (`F2-08b`), with `F2-07` keeping the fallback in place permanently because mixed teams are the normal case (`PS-28`). _(non-UI half, build-side: attribution law per R16: tick attributed to coordinator/ticker; never depends on installer having an account — for awareness, not for drawing)_

- **M08-43** (P0) — **No commercial figure appears on this surface, ever — no price, no discount, no tranche, no margin, no customer value.** v1 got the property free by giving the installation team no screen at all — *"crew sees no money because crew sees no screen"* — and where V2 gives them a screen the surface itself must preserve it. This is a property of the surface, not of the viewer: the rule holds even when an EPC Owner is the one looking at it.

### From docs/prd/modules/M05-design-studio.md

- **M05-76** (P0) — **The installation plan is reused, not rebuilt: a crew work-order derived from the design, ordered how it is built, grouped into phases.** Progress indicator + "done of total steps"; each step a tick-off item (number, title, detail, materials needed; tap toggles done, remembered); phase headings; Print; empty state ("place modules and string the array first"). In v1 the coordinator runs the checklist and ticks are attributed to them with an optional free-text "done by" (`R16` via `F2`, cited); the checklist's execution surface and evidence rules are `modules/M08`'s.

### From docs/prd/modules/M05-studio/10-done-and-installation.md

- **MS11-17** (P0) — Unapproved designs cannot reach customer surfaces (S10-1 fixes `.131`, pairs with MS9-06); the installation sheet states the engineering status and is gated on it (S10-1 fixes `installation.10`).
- **MS11-28** (P0) — A field document derived from the design — never authored — with deterministic step ids, seven ordered trade phases, and structures walked per roof and table (`.38–.42/.58`).
- **MS11-29** (P0) — Steps as shipped: foundations, legs, rafters, purlins/braces, structured modules, loose modules, per-string wiring, balance-of-system — with counts from the structural model (`.43–.50/.52/.54/.57`), plural-correct titles (S10-2 fixes `.56`) and disabled panels excluded from wiring counts (S10-2 fixes `.51`).
- **MS11-31** (P0) — Materials per step resolve from the BOM correctly — including lines with no source id, excluding lines not supplied, and respecting confidence markers (S10-2 fixes `.61/.62/.64`) (`.59/.63`).
- **MS11-33** (P0) — Identity block: date, design version, site address, issued-by, and the engineering status per MS11-17 (S10-2 fixes `.11`).

### From docs/prd/foundations/F2-roles-and-permissions.md

- **F2-07** (P1) — **The coordinator fallback survives the preset.** Where the checklist is run by a coordinator rather than the crew, ticks are attributed to the coordinator and an optional free-text "done by" per step records the crew member's name. This fallback is not removed when crew accounts exist, because mixed crews are the normal case (`02-personas.md` `PS-28`). _(non-UI half, build-side: ticks attributed to the coordinator; fallback survives even when crew accounts exist — for awareness, not for drawing)_

### From docs/prd/foundations/F8-data-honesty.md

- **F8-28** (P0) — **The structure disclaimer travels with every structure-bearing output.** Every surface, document, drawing, sheet and export that carries structural quantities or a structural model also carries the statement of what it is and is not — a material estimate and a visual model, not a structural check, requiring engineer verification. The disclaimer is not confined to the screen where the structure was authored.

## States

Base states (always designed): loading · empty · error.

Screen-specific states from the slice:

- **normal** — the design's phases with their steps in build order, each step a tick with its detail and the materials it needs; progress shows "done of total".
- **empty-design-first** — the empty state is the design's own ("place modules and string the array first"), not a blank.
- **manual-step-added** — a manual step added where reality diverges from the model, marked as manually added so the derived sequence stays legible.
- **awaiting-sign-off** — the design has no engineer sign-off yet: one line says the checklist waits on it, and no step is drawn (`M08-41`).
- **design-diverged-visible** — a changed design was signed off after the checklist was started: already-ticked steps keep their ticks and their attribution, and the divergence is visible rather than silently reconciled.
- **coordinator-attributed** — the crew has no accounts and the coordinator runs the checklist from their phone: ticks attributed to the coordinator.
- **done-by-captured** — the optional free-text "done by" recorded against a step, naming who actually did the work.
- **all-done** — every step ticked: the coordinator sees the job complete without anyone phoning to say so (`PS-25`'s day); the stage has not moved.
- **read-only-scoped** — a preset with read scope and no checklist grant: everything readable, no act, nothing greyed (`F2-12`).

No commercial figure appears on this surface, ever — no price, no discount, no tranche, no margin, no customer value — a property of the surface, holding even when an EPC Owner is the viewer.

## Data volume

The derived work order of a real design — the ruled realistic reference is the 221-panel design — meaning the seven trade phases, steps distinct per roof and table, and a long step list scrolling within its own region, several steps with photo evidence attached, at least one manually added step, and a mixed-attribution history (coordinator ticks with "done by" names alongside account-holder ticks).

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier (measured / derived / estimated / assumed) in the design:

- The "done of total" progress figure.
- Material quantities shown on each step's detail (from the design's derived work order).
- Tick times and attributions, and the engineer's sign-off: recorded facts, so they carry no tier (`N7`).

No money, price, discount, tranche, margin or customer value appears anywhere on this screen.
