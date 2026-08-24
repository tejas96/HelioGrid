# SCR-M08-04 · Installation Checklist

Execute the design's derived work order: tick steps in build order, attach photo evidence, add manual steps, show done-of-total progress; no commercial figures ever.

**Module:** M08 · **Personas:** Project Manager (the coordinator) · Installation Team Member · EPC Owner · **Context of use:** phone in the field, gloves and one hand, ticking steps as work happens. The coordinator often runs the checklist from their own phone for a crew that never signs in. This surface shows no commercial figure regardless of who is looking at it.

## Entry & exit

Reached from: the Project Detail (SCR-M08-02), and from the Installer Job Home (SCR-M08-05 — today's job leads to its checklist). Leads to: back to the project, which reads the checklist's progress; completing the checklist does not by itself move the stage — a person moves stages. Other exits: not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### From docs/prd/modules/M08-projects.md

- **M08-41** (P0) — **The installation checklist is reused, not rebuilt.** The steps are the design's derived work order — the real build sequence the studio already produces (`M05-76`, consumed) — and this module owns its *execution*: working the steps, ticking them, attaching evidence, adding a manual step the design could not know about, and the progress the project reads from it. *"Do not rebuild it."* _(non-UI half, build-side: steps are the design's derived work order (M05-76); this module generates no sequence of its own — for awareness, not for drawing)_
- **M08-42** (P0) — **Ticks are attributed to the person who ticked, and an optional free-text "done by" per step records who actually did the work.** `R16` rules the v1 answer and it is carried whole: the coordinator runs the checklist and the attribution never depends on the installer having an account. In V2's preset vocabulary that coordinator is the **Project Manager** — `R16`'s "Manager role" is v1's preset name, and decision B assigns the duty to the Project Manager (`F2-08b`), with `F2-07` keeping the fallback in place permanently because mixed teams are the normal case (`PS-28`). _(non-UI half, build-side: attribution law per R16: tick attributed to coordinator/ticker; never depends on installer having an account — for awareness, not for drawing)_

### From docs/prd/foundations/F2-roles-and-permissions.md

- **F2-07** (P1) — **The coordinator fallback survives the preset.** Where the checklist is run by a coordinator rather than the crew, ticks are attributed to the coordinator and an optional free-text "done by" per step records the crew member's name. This fallback is not removed when crew accounts exist, because mixed crews are the normal case (`02-personas.md` `PS-28`). _(non-UI half, build-side: ticks attributed to the coordinator; fallback survives even when crew accounts exist — for awareness, not for drawing)_

## States

Base states (always designed): loading · empty · error.

Screen-specific states from the slice:

- **normal** — the design's phases with their steps in build order, each step a tick with its detail and the materials it needs; progress shows "done of total".
- **empty-design-first** — the empty state is the design's own ("place modules and string the array first"), not a blank.
- **manual-step-added** — a manual step added where reality diverges from the model, marked as manually added so the derived sequence stays legible.
- **design-diverged-visible** — the design changed after the checklist was started: already-ticked steps keep their ticks and their attribution, and the divergence is visible rather than silently reconciled.
- **coordinator-attributed** — the crew has no accounts and the coordinator runs the checklist from their phone: ticks attributed to the coordinator.
- **done-by-captured** — the optional free-text "done by" recorded against a step, naming who actually did the work.

No commercial figure appears on this surface, ever — no price, no discount, no tranche, no margin, no customer value — a property of the surface, holding even when an EPC Owner is the viewer.

## Data volume

The derived work order of a real design — the ruled realistic reference is the 221-panel design — meaning many phases and a long step list scrolling within its own region, several steps with photo evidence attached, at least one manually added step, and a mixed-attribution history (coordinator ticks with "done by" names alongside account-holder ticks).

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier (measured / derived / estimated / assumed) in the design:

- The "done of total" progress figure.
- Material quantities shown on each step's detail (from the design's derived work order).
- Tick timestamps and attribution records where shown.

No money, price, discount, tranche, margin or customer value appears anywhere on this screen.
