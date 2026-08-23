# SCR-MS-03 · Studio Shell (Wizard Frame)

The nine-step wizard frame: header, step navigation, Design Health, save, gates.

**Module:** MS (Design Studio) · **Personas:** Design Engineer, EPC Owner, Sales Manager (read-only) · **Context of use:** wraps every studio step on web and mobile equally — web primary, mobile full parity (MS12 §2, F7-30); mobile gets a compact step indicator opening a step-list sheet, desktop a step rail (M05-03). The shell is used at a desk or on a phone; accessibility is a gate, not a polish item (MS12 §2). **Shell law the canvas steps inherit:** v1 is light-only — there is no dark theme, no per-user theme switch and no dark variant of any surface, and the studio canvas is light like everything else (`foundations/F7`, `F7-04`, P0); every visual fact comes from `design/ds-source` and no screen restates one (`F7-01`/`F7-03`).

## Entry & exit

Reached from: opening a design from the Design List (SCR-MS-01) or Design Queue (SCR-MS-02); a design opens at its saved step, and deep links are guarded — guards apply after hydration (MS12-27) and navigation clamps to the highest permitted step when a gate is unmet (gated-deep-link-clamped state). Wizard-step gates (the flagship note): the shell owns the gate order — setup completeness · at least one roof · panel/inverter/capacity · at least one enabled panel · the electrical hard gate — and every blocked Next states its reason (MS12-03, M05-05). Leads to: the nine steps in order (Project setup · Roof · Obstructions · Components · Panel layout · Proposal captures · SLD & drawings · BOM & pricing · Done, M05-02); "save and exit" returns to the LEAD the design belongs to (MS12-05).

## Requirements (verbatim)

### From `prd/modules/M05-design-studio.md`

- **M05-02** (P0) — **The wizard presents nine visible steps; no user-visible "step 5" ever exists.** Steps: Project setup · Roof · Obstructions · Components · Panel layout (auto-placement folded in) · Proposal captures · SLD & drawings · BOM & pricing · Done. The step indicator reads "n / 9"; internal step identifiers stay stable across the fold so nothing renumbers underneath. _(non-UI half, build-side: internal step identifiers stay stable across the fold; no step-5 anywhere — for awareness, not for drawing)_
- **M05-03** (P0) — **Every step carries one of four states — not started / in progress / done / has errors — and navigation is always visible.** Mobile: compact indicator ("n / 9 · <step> ‹ ›") opening a step-list sheet; desktop: a step rail. Back navigation and re-entry into completed steps are always available.
- **M05-04** (P0) — **One header system, everywhere in the studio:** back · step title · Design Health chip · units toggle (m/ft, global across the studio) · Save · Save & exit to lead · Help (per-step, plain language) · Next/Done. The three unrelated v1 header systems are retired.
- **M05-05** (P0) — **Per-step Next gates state their reason in plain language, and the electrical hard gate is deliberate law.** A blocked Next always says why ("Draw at least one roof", "Fix the string design before continuing"). The studio **keeps** step gating: an invalid string design blocks the layout step's Next (§M05.7, M05-42). This is a ruled asymmetry with the proposal builder's free navigation (`R12` applies free navigation to the proposal builder only — `modules/M06`'s half); the two must never be normalised into one behaviour. _(non-UI half, build-side: electrical hard gate law; never normalised with M06 free navigation — for awareness, not for drawing)_
- **M05-06** (P0) — **Design Health: a score /100 with band Good / Fair / Poor across energy, electrical and roof-utilisation, always one tap away.** The health sheet shows per-category scores, specific deductions ("−8 · off-south orientation"), and a "what changed since last save" delta. While shading recalculates, Design Health shows a **provisional** state — it never presents a stale score as current.
- **M05-09** (P0) — **Design mutations fail fast; a stale save is refused, never merged.** Every save carries the version it was based on; a mismatch is refused, the client reloads server state, and the user re-applies the change. No merge exists, and a failed save says so honestly at the attempt — never a silent no-op, never an optimistic result. _(non-UI half, build-side: server version check, single-editor LWW, no merge ever — for awareness, not for drawing)_
- **M05-13** (P0) — **When a newer survey version supersedes the one a design was built from, the studio marks the design "survey updated — review needed" and notifies the designer — and applies nothing automatically (owner ruling 2026-08-04, Q24).** The design shows the review-needed banner naming the superseding version and the fields that differ in provenance or value; the designer reviews and chooses what to apply. **Draft proposals built on the design are blocked from SENDING until the review clears; sent proposals stay pinned and never mutate** (`F8-15`). The same self-stale pattern as catalog releases. _(non-UI half, build-side: draft proposals blocked from sending until review; nothing auto-applied — for awareness, not for drawing)_

### From `prd/modules/M05-studio/11-shell-and-platform.md`

- **MS12-01** (P0) — NINE visible steps with no phantom step and no reachable dead step URL; internal step ids stay stable so existing designs open unchanged (S11-1 fixes `.1/.2`, census R7). _(non-UI half, build-side: internal step ids stay stable; no reachable dead step URL — for awareness, not for drawing)_
- **MS12-03** (P0) — Per-step Next gates state their reason in plain language, in a defined order: setup completeness · at least one roof · panel/inverter/capacity · at least one enabled panel · the electrical hard gate (error-level electrical issues block and clamp the reachable steps, MS8-33); steps without gates say so by simply proceeding (`.5–.9`). _(non-UI half, build-side: gate evaluation in defined order, ending with electrical hard gate — for awareness, not for drawing)_
- **MS12-04** (P0) — A blocked Next explains itself in an accessible, non-blocking toast (`.10`).
- **MS12-05** (P0) — Header: back, step title, health chip, units toggle, save, save-and-exit, help, and the primary action (Next / Done) (`.11/.12/.18–.21/.24`); "save and exit" returns to the LEAD the design belongs to (S11-3d fixes `.20`).
- **MS12-06** (P0) — Design Health chip reads the stamped snapshot, shows a provisional state while shading recalculates, and shows a neutral placeholder before any score exists; bands and weights come from the rules pack (`.13–.17`, F1). _(non-UI half, build-side: reads stamped snapshot; bands and weights from rules pack — for awareness, not for drawing)_
- **MS12-07** (P0) — Per-step help: one plain-language "what this step does" plus tips, one entry per step, reachable from the header (`.21–.23`).
- **MS12-08** (P0) — Progress indicator reflects the true step count (MS12-01) (`.25`); canvas steps use the dark editor theme (`.26`); step routing maps each step to its screen (`.27`). _(Superseded visual fact — do not draw: the row's "dark editor theme" is a POC-code fact transcribed from `SRC-CODE`, and `foundations/F7`'s `F7-04` is P0 law over it — "There is no dark theme, no per-user theme switch and no dark variant of any surface, and the studio canvas is light like everything else", the source being explicit that "the old 'studio canvas stays dark' doctrine is dead." Canvas steps render light with every other surface; visual facts come from `design/ds-source` per `F7-01`/`F7-03`. The step-count and step-routing halves of this row stand.)_
- **MS12-09** (P0) — Health sheet: provisional banner, per-category cards with plain-language deductions, a "what changed" delta, unscored context lines, and a provenance footer explaining how the total is computed (`.28–.33`, F8).
- **MS12-22** (P0) — Concurrent editing is handled honestly: an external change to the same design is detected and surfaced rather than silently overwriting (`.63/.64/.82/.109`); the POC's last-writer-wins local rule is superseded by the platform's conflict handling (S11-3b). _(non-UI half, build-side: conflict detection supersedes last-writer-wins — for awareness, not for drawing)_
- **MS12-24** (P0) — Save state is always visible: a persistent "not saved" alert when writes fail, and the design never silently loses work (`.70/.108`).
- **MS12-27** (P0) — Routing: named routes for the wizard, design list, share and sign-in, with guards applied after hydration and a hydration gate that shows loading rather than a blank screen (`.102–.106`, MS9-15); legacy dead routes are removed (S11-2.3 fixes `.102/.83`). _(non-UI half, build-side: named routes, post-hydration guards, legacy dead routes removed — for awareness, not for drawing)_

## States

Base: **loading** · **empty** · **error** (design mutations fail fast, M05-09; save failures are persistently visible, MS12-24; no screen shows a blank canvas until data hydrates, MS12-27).

Screen-specific:

- **normal** — header + step navigation + health chip around the current step (M05-04, M05-03).
- **loading-skeleton / hydration-loading** — the hydration gate shows loading rather than a blank screen (MS12-27).
- **step-has-errors** — one of the four step states: not started / in progress / done / has errors (M05-03).
- **gate-blocked-with-reason** — a blocked Next states its reason in plain language, gates evaluated in defined order (MS12-03, M05-05).
- **blocked-next-toast** — the blocked Next explains itself in an accessible, non-blocking toast (MS12-04).
- **health-provisional** — Design Health shows provisional while shading recalculates; never a stale score as current (M05-06, MS12-06).
- **health-placeholder** — neutral placeholder before any score exists (MS12-06).
- **health-sheet-open** — provisional banner, per-category cards, deductions, "what changed" delta, unscored context lines, provenance footer (MS12-09, M05-06).
- **help-open** — per-step help: "what this step does" plus tips (MS12-07).
- **save-failed / save-failed-alert** — persistent "not saved" alert when writes fail; no silent work loss (MS12-24).
- **stale-save-refused** — a stale save is refused, the client reloads server state, and the user re-applies the change (M05-09).
- **conflict-detected** — an external change to the same design is detected and surfaced, never silently overwritten (MS12-22).
- **survey-updated-review-needed** — "survey updated — review needed" banner naming the superseding version and the differing fields; nothing auto-applied (M05-13).
- **staleness-marker** — the design carries its review-needed marking until the review clears (M05-13).
- **read-only** — Sales Manager (read-only persona) sees the wizard without mutating controls (per-lead visibility, F2 — exact affordance not pinned by this slice; designer decides, note the decision).
- **gated-deep-link-clamped** — a deep link past an unmet gate is clamped by post-hydration guards (MS12-27, MS12-03).

## States note

The four step-status values (not started / in progress / done / has errors, M05-03) apply per step inside the navigation, in every shell state above.

## Data volume

The frame must hold a full-scale design underneath: nine steps with true step-count progress (M05-02, MS12-08), a health sheet with per-category cards and deductions (MS12-09), and canvas steps at real project scale (a 221-panel design is the PRD's flagship scale reference). The step-list sheet on mobile lists all nine steps with their four-state markers (M05-03).

## Numbers carrying provenance

Each user-visible number carries its F8 provenance tier in the design: the **Design Health score /100**, its **band**, each **deduction value** ("−8 · off-south orientation") and the **"what changed since last save" delta** (M05-06, MS12-09 — the sheet's provenance footer explains how the total is computed); the **step indicator "n / 9"** (M05-02, MS12-08); the **units toggle (m/ft)** governs every measurement rendered by the steps (M05-04); the **superseding survey version** named in the review banner (M05-13).
