# SCR-MS-13 · Studio Done

Terminal wizard step: readiness review, finish and share actions, project identity.

**Module:** MS (M05 Design Studio · studio sub-spec MS11) · **Personas:** Design Engineer (finishes the design), Sales Executive (share actions), EPC Owner · **Context of use:** the Design Engineer is desktop-weighted with full mobile parity (prd/02-personas.md persona table); the Sales Executive is mobile-first — the share actions must work one-handed on a phone; the EPC Owner uses web for administration, mobile for everything else.

## Entry & exit

Reached from: the studio wizard frame (SCR-MS-03) as the terminal step. **Wizard-step gate that admits the user:** Step 10 is reachable only when every earlier gate passes (MS11-01); within the readiness review the electrical item is the sole blocker (MS11-08) — a user who cannot pass the gates never sees this screen, and the shell's blocked-Next explanation (SCR-MS-03's slice) is what they see instead. Leads to: the five finish actions (M05-75, MS11-04) — View proposal (`modules/M06`'s surface) · BOM & pricing (→ Step 9, SCR-MS-12) · Installation plan (SCR-MS-17) · Copy share link (copies the customer's proposal link; no separate 3D URL is minted per Q27) · Done (→ the lead's design list, SCR-MS-01). Each review item links to the step that can fix it (MS11-07). On an unapproved design the customer-facing exits stay closed while Done still works — approval gates the customer, not the designer (prd/modules/M05-design-studio.md §M05.12 edge cases).

## Requirements (verbatim)

### From prd/modules/M05-design-studio.md

- **M05-75** (P0) — **The Done screen states completion honestly and offers five actions:** it names the design/project, reassures that the design can be reopened and edited anytime, and offers View proposal (`modules/M06`) · BOM & pricing (→ Step 9) · Installation plan · Copy 3D share link · Done (→ the lead's design list). The copied share link is the customer's **proposal link**, whose page carries the "View in 3D" button — no separate 3D URL is minted (owner ruling 2026-08-04, Q27; `F5-33`).

### From prd/modules/M05-studio/10-done-and-installation.md

- **MS11-01** (P0) — Step 10 is the terminal wizard screen, reachable only when every earlier gate passes; it stamps completion and shows the project's identity (`.1/.2/.12–.16/.125–.128`). _(non-UI half, build-side: reachable only when every earlier gate passes; stamps completion — for awareness, not for drawing)_
- **MS11-03** (P0) — The readiness review is SURFACED on Step 10, not only Step 7 (S10-1 fixes `.59`).
- **MS11-04** (P0) — Five actions: view proposal · BOM · installation plan · copy share link · done — with copy CONFIRMING success and surfacing failure (S10-3.1 fixes `.21/.22`) (`.17–.20/.23`).
- **MS11-05** (P0) — Share actions offer the customer-facing proposal link per Q27 — not only the 3D-only link (`.25/.26` recorded divergence resolved by MS9-14).
- **MS11-06** (P1) — One clear finish control (no duplicate "Done"), with help copy stating what this step does (`.24/.129`).
- **MS11-07** (P0) — Review returns four ordered items — electrical · design review · quantity confidence · shadow imagery — each with the step that can fix it, three statuses, and a worst-of verdict; it DERIVES from the real gates and never re-implements them (`.28–.33/.53/.55`). _(non-UI half, build-side: derives from real gates, never re-implements them; worst-of verdict computation — for awareness, not for drawing)_
- **MS11-08** (P0) — Electrical item is the one blocker and states pass/fail plainly; the vacuous-ready edge (no components yet) is handled honestly (`.34–.36`). _(non-UI half, build-side: electrical is the sole blocking item; vacuous-ready (no components) edge law — for awareness, not for drawing)_
- **MS11-09** (P0) — Design-review item counts insights that are neither accepted NOR dismissed (S10-3.4 fixes `.37`), with severity-driven status and plain wording (`.38–.42`). _(non-UI half, build-side: counts only insights neither accepted nor dismissed; severity-driven status — for awareness, not for drawing)_
- **MS11-11** (P0) — Imagery item reports shortfall before staleness, never blocks — and INCLUDES the cover image's staleness (S10-3.5 fixes `.52`) (`.47–.51`). _(non-UI half, build-side: never blocks; shortfall ordered before staleness; includes cover staleness — for awareness, not for drawing)_

## States

Three base states, then every screen-specific state from the slice and the rows:

- **loading** — the shell's hydration gate shows loading, never a blank screen (SCR-MS-03 owns the chrome); the step's own content (identity, review items, actions) loads in place.
- **empty** — the honest form of "nothing here" on this step is the no-components edge below (MS11-08); the gate law (MS11-01) means the step never renders for a design that has not earned it.
- **error** — a failed action states what happened; the row-specified instance is copy failure surfaced, not swallowed (MS11-04).
- **normal** — completed design: project identity, the readiness review, five actions, one clear finish control with help copy, and the reopen reassurance (M05-75, MS11-01, MS11-06).
- **gated-unreachable** — an earlier gate has not passed; Step 10 does not admit (MS11-01).
- **review-pass** — all four ordered review items pass; the worst-of verdict is a pass (MS11-07).
- **review-warning** — a non-blocking item warns (pending insights, imagery shortfall or staleness); the worst-of verdict shows the warning and names the step that can fix it (MS11-07, MS11-09, MS11-11).
- **review-blocked** — the electrical item fails and states pass/fail plainly; it is the one blocker (MS11-07, MS11-08).
- **no-components-edge** — the vacuous-ready edge (no components yet) handled honestly (MS11-08).
- **copy-confirmed** — Copy share link confirms success (MS11-04); the copied link is the customer-facing proposal link (M05-75, MS11-05).
- **copy-failed** — copy surfaces failure (MS11-04).
- **customer-exits-closed-unapproved** — unapproved design: the customer-facing exits stay closed; Done still works (§M05.12 edge case; the gating law itself is MS11-17, in SCR-MS-17's slice).

## Data volume

Design at the Definition of Done's realistic volume, not demo volume: the review sits in front of a large design (the DoD's 221-panel design); four ordered review items are always present; the design-review item counts several pending insights, not one (MS11-09); the imagery item reports a multi-capture shortfall and staleness including the cover (MS11-11); all five actions present at the small viewport without loss.

## Numbers carrying provenance

Each user-visible number carries its F8 provenance tier in the design:

- Completion stamp (date/time) shown with the project identity (MS11-01)
- Pending-insight count in the design-review item (MS11-09)
- Imagery shortfall count and staleness in the imagery item (MS11-11)
