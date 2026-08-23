# SCR-M06-02 · Proposal Builder

Shell around the eleven steps: chip rail, footer, Generate gate failure list, Quick-mode view.

**Module:** M06 · Proposals · **Personas:** Sales Executive (primary — *"the most-used screen in the product. Every deal passes through it"*, `S6B` preamble), Sales Manager, EPC Owner, Design Engineer (builds, does not send) · **Context of use:** mobile emphasis is real — Path B happens with *"the rep standing in their living room"*; the builder must be fully workable at phone width (`D2`, `F7-30`; the mobile chip-rail contract is M06-24). Desk use for C&I full-mode builds. Every field commits on blur.

## Entry & exit

Reached from: Proposal Entry (SCR-M06-01) on either path and either mode; a resumable draft from the lead surface — shown as "Proposal draft — 7/11" on the lead (M06-25, §M06.4); a duplicated proposal opening pre-filled (M06-05, §M06.8); a generated Quick proposal reopening in the full builder for its next version (M06-19). Leads to: the eleven step screens (SCR-M06-03 … SCR-M06-13) via any chip, Back/Next, or a tapped Generate failure — in any order, nothing blocks (M06-22); a successful Generate produces the version, previewed before sending (§M06.9, SCR-M06-15 per the happy path `S6.happy`). Back from a failure-jump returns to the remaining failures (§M06.4 behavior detail).

## Requirements (verbatim)

### prd/modules/M06-proposals.md

- **M06-18** (P0) — **Quick mode is committed scope — the same builder, one toggle.** The source's observation: *"Eleven steps is a lot for Path B."* Quick mode shows **only steps 1, 3, 8 and 10** (company, system, components, client), **AI-fills 4 and 5**, and fills **6, 7, 9 and 11 from tenant defaults** (`M01-53`, consumed — timeline template, default tranche template, default T&C, bank details; a tenant who never opened settings still has working platform defaults), with a **"review the rest"** link into the full rail. Full mode stays for C&I. *"Same builder, one toggle"* — never a second proposal system. _(non-UI half, build-side: hidden steps 6/7/9/11 filled from tenant defaults, 4/5 AI-filled — the field set stays complete — for awareness, not for drawing)_
- **M06-21** (P0) — **The builder shell: chip rail + footer.** A **chip rail** (top) carries eleven jump chips, one per step — tap any chip to jump to any step **in any order**; completed steps take the design system's completed-state treatment, incomplete steps a subtle dot (the source's "sage green" is POC-brand colour — superseded; visual facts come from `design/ds-source` per `foundations/F7`). A **footer bar** carries `‹ Back` · `{step} / 11 · {step title}` · `Next ›`, and on the last step the button becomes **Generate PDF ⤓**.
- **M06-22** (P0) — **Free navigation everywhere; validation at Generate ONLY; the Next-disabled rule is killed.** The source's gating ("Next is disabled until that step's required (\*) fields are valid") is **superseded by ruling and never ships**: Back/Next always navigate, every chip always jumps, and no step ever blocks another. **Generate lists every failure as a tappable jump** ("Fix 2 issues to share") — tapping a failure opens the exact step, with the failing fields highlighted. *"Let people work out of order; validate at the end."* The studio's electrical hard gate is `modules/M05`'s and is deliberately asymmetric — recorded, never normalised. _(non-UI half, build-side: R12 law: free navigation everywhere, validation only at Generate, Next-disabled killed — for awareness, not for drawing)_
- **M06-23** (P0) — **The Generate gate — one checklist, one place.** Generate runs, in one pass, every check the proposal enforces: (a) **mandatory components** — all categories selected, battery included when present (`D22`; `M06-27`); (b) **battery physical validity** — OFFGRID/HYBRID with no battery blocks (`M06-30`); (c) **the payable floor** — client payable ≤ 0 in the tenant currency blocks (`D34`; `M06-36`); (d) **tranche completeness** — total allocation = 100% (`M06-13`); (e) **required-field completeness** across the eleven steps (`M06-21`'s dots); (f) **the certification/incentive-path check** — where the pack ties the incentive path to a certification scheme, a non-compliant component fails Generate with the failing line named (`F1-34`/`F1-19` consumed; the IN instance is the DCR rule, `F1-44`). Failures render as the tappable list; **below-cost pricing warns and never blocks** (`M06-37`). These are exactly the checks `modules/M05`'s hand-off leaves to this module (`M05-61`, consumed; the studio's readiness card mirrors them early, `M05-58`). _(non-UI half, build-side: one-pass gate: components, battery validity, payable floor, tranches, required fields, certification/incentive check — for awareness, not for drawing)_
- **M06-24** (P0) — **On mobile the chip rail must not eat the screen.** Eleven chips at 375 px is a horizontal scroller nobody reads: mobile shows `‹ 3 / 11 · {step title} ›` with a tap opening the full step list as a sheet; desktop keeps the full rail. Full capability on every surface (`D2` via `F7-30`, consumed) — the compression is presentational, never functional.

## States

- **Loading** (base) — opening a draft resumes with every blurred value already committed (M06-25, §M06.4).
- **Empty** (base) — a fresh Path B proposal: nothing pre-filled beyond lead/tenant data; every chip incomplete.
- **Error** (base) — a failed Generate attempt is the failure list, never a silent no-op; other errors acknowledged honestly, the draft preserved.
- **chip-completed** — completed steps take the design system's completed-state treatment (M06-21).
- **chip-incomplete-dot** — incomplete steps show the subtle dot; the dots feed the Generate gate's completeness check, never a disabled Next (M06-21, M06-22).
- **generate-failure-list** — "Fix N issues to share": every failure a tappable jump landing on the exact step with failing fields highlighted; back returns to the remaining failures; the gate is idempotent (M06-22, M06-23, §M06.4 behavior detail).
- **mobile-compressed-rail** — at phone width the rail compresses to `‹ n / 11 · {step title} ›` (M06-24).
- **step-list-sheet** — tapping the compressed rail opens the full step list as a sheet (M06-24).
- **quick-mode** — only steps 1, 3, 8, 10 presented, with the "review the rest" link into the full rail; hidden steps are filled, not empty (M06-18); a hidden-step Generate failure jumps into the full rail at that step — the failure surface is the expansion (§M06.3 behavior detail).

## Data volume

Eleven steps — eleven chips on desktop, the compressed counter at 375 px. The Generate failure list must be designed at multiple simultaneous failures spanning the checklist's six check families (a)–(f) plus the below-cost warning — not just the "Fix 2 issues" happy case. One draft at a time; the shell hosts whichever step screen is open.

## Numbers carrying provenance

- `{step} / 11` counter and the failure count ("Fix N issues to share") — interface counts, not provenance-tiered figures.
- Money and generation figures render inside the hosted steps and carry their own F8 tiers there (SCR-M06-05 … SCR-M06-07); the shell itself asserts no figure.
