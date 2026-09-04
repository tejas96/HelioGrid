# MS-C · Studio Step 9 (BOM), Done & installation, shell & platform — engineering tasks

This file covers the last three studio documents: `docs/prd/modules/M05-studio/09-step9-bom.md` (rows MS10-01…MS10-40, the priced bill and the money engine), `docs/prd/modules/M05-studio/10-done-and-installation.md` (rows MS11-01…MS11-38, the Done step, the readiness contract, engineer sign-off, the fingerprint system, duplicate, and the installation work order) and `docs/prd/modules/M05-studio/11-shell-and-platform.md` (rows MS12-01…MS12-30, the wizard shell, design list, sign-in and tenancy, persistence, the shared UI kit and the accessibility gate). Task-id prefix: `T-MS-`, numbered from `T-MS-301`.

Every task here is a studio task, so each carries a **PORT** line naming the POC files claimed for its area in `docs/prd/modules/M05-studio/poc-file-claims.md`, and a **DEFECTS** line listing the rows of `docs/prd/modules/M05-studio/defect-register.md` whose target requirement ids fall inside the task. Owner ruling S12-1 binds: the POC at `3d_design_studio/` is the starting point, never a from-scratch rebuild — where it already implements the behaviour the task is a **port** and the engineering core moves as-is with its tests as the regression net; where the surface is redesigned the task is a **screen** task titled "port + UI rebuild". Screen tasks point at their UX briefs under `docs/ux/briefs/`, where the verbatim requirement rows live; engine, policy, integration and port tasks quote their rows in full. Policy rows that engineering does not build directly are listed under "Laws". The Disposition index at the end of the file accounts for all 108 rows of this bucket exactly once.

---

## Step 9 — Bill of Materials (MS10)

### T-MS-301 · Studio Step 9 — Bill of Materials (port + UI rebuild)

**Type:** screen · **Tier:** P0
**PRD rows:** MS10-01 (P0), MS10-02 (P0), MS10-03 (P0), MS10-06 (P0), MS10-07 (P0), MS10-08 (P0), MS10-09 (P0), MS10-10 (P0), MS10-11 (P0), MS10-12 (P0), MS10-13 (P0), MS10-14 (P0), MS10-16 (P0), MS10-17 (P0), MS10-18 (P0), MS10-19 (P0), MS10-20 (P0), MS10-35 (P0)
**DESIGN:** SCR-MS-12 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step9Bom/index.tsx`, `Step9Bom/BomSection.tsx`, `Step9Bom/BomRow.tsx`, `Step9Bom/DiscountField.tsx`, `Step9Bom/OrphanBanner.tsx`, `Step9Bom/StaleBanner.tsx`, `Step9Bom/SectionInputs.tsx`, `3d_design_studio/src/features/solar-studio/lib/bom/view.ts`, `3d_design_studio/src/features/solar-studio/screens/__tests__/BomRow.dom.test.tsx`, `3d_design_studio/src/features/solar-studio/screens/__tests__/DiscountField.dom.test.tsx`, `3d_design_studio/src/features/solar-studio/lib/__tests__/bom-view.test.ts`, `3d_design_studio/src/features/solar-studio/lib/__tests__/bom-stale-detail.test.ts`
**DEFECTS:**
- `CODE.step9-bom.41` — flat discount re-clamped per section, so sections don't reconcile to total (ruling S9-2 → MS10-11).
- `CODE.step9-bom.24/.39/.71` — wind stated only in high zones; discount control desyncs from project state; derivations are tooltip-only (ruling S9-3 → MS10-08/03/19).
- `CODE.step9-bom.151/.153-.157/.28` — prices, tax, subsidy, constants, wind and the compliance checklist are India-hardcoded (ruling S9-1 → MS10-39/32/10; the checklist half lands on this screen).
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-12-step9-bom.md`; they are the specification.
**DONE WHEN:**
- Given the step opens, Then header, re-sync (with its confirmation) and CSV export are present (MS10-01) and the nine money figures render (MS10-02).
- Given an undo after a discount change, Then the control reflects the restored state (MS10-03).
- Given an override with no matching derived line, Then it is surfaced with an adopt path (MS10-06).
- Given a below-cost discount, Then the warning shows (MS10-07).
- Given assumed structural lines, Then the disclaimer shows WITH the site's wind conditions regardless of zone (MS10-08); given assumed lines, the preliminary banner counts them (MS10-09).
- Given a connecting utility, Then the pack's checklist renders with live evidence where provable (MS10-10).
- Given a flat project discount, Then section totals sum exactly to the quote total (MS10-11).
- Given a section, Then add-custom-line and refresh-from-design are available and the table renders its full column set with an accessible caption (MS10-12).
- Given a drifted edited field, Then the banner names item, field and both values with a take-new action (MS10-13).
- Given routed geometry exists, Then survey-input fields disable with the reason (MS10-14).
- Given an excluded line, Then it stays visible at zero (MS10-16).
- Given any row, Then its confidence tier and per-field reset are available (MS10-17), its editable fields behave as specified (MS10-18), its derivation is readable on touch and by screen reader (MS10-19), and only custom lines offer removal (MS10-20).
- Given an edited field, Then the override records the engine's value for exact staleness, legacy overrides still apply and migrate lazily (MS10-33), retyping the same value creates no override (MS10-34), and the edit re-keys the fingerprint without reordering fields (MS10-35). *(This task owns the MS10-35 half — the section-state counts and the fingerprint re-key on edit; MS10-33/34 are built in T-MS-305.)*
- The ported POC tests for this area pass unchanged in the new project.
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-MS-302 · BOM derivation engine: shared context, six emitters, line-key registry (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS10-21, MS10-23, MS10-24, MS10-27, MS10-28
**PORT:** `3d_design_studio/src/features/solar-studio/lib/bom.ts`, `lib/bom/context.ts`, `lib/bom/merge.ts`, `lib/bom/line.ts`, `lib/bom/registry.ts`, `lib/bom/emitters/modules.ts`, `lib/bom/emitters/inverter.ts`, `lib/bom/emitters/mechanical.ts`, `lib/bom/emitters/safety.ts`, `lib/bom/emitters/civil.ts`, `lib/bom/emitters/electrical.ts`, `data/profiles.ts` (sitting 4 — the section catalog `lib/bom/emitters/mechanical.ts` imports `STRUCTURE_PROFILES` from for its kg/m; ported with its guard `lib/__tests__/profiles.test.ts` by T-MS-209, whose array-order invariant the steel lines depend on), tests `lib/__tests__/bom.test.ts`, `bom-golden.test.ts`, `bom-catalog.test.ts`, `bom-custom.test.ts`, `mms-bom.test.ts`
**DEFECTS:** none targeting these rows.
**Requirements (verbatim):**
- **MS10-21** (P0) — Six emitters run over one shared context in registry order; the merged result = auto lines + per-field overrides + custom lines (`.75/.76`).
- **MS10-23** (P0) — Line-key registry with stable semantic keys, category order, per-key default waste allowances, discrete-unit rounding, and a line constructor that fills provenance (`.84–.88`).
- **MS10-24** (P1) — Source attribution names a roof/segment only when exactly one contributed (`.89`).
- **MS10-27** (P0) — Mechanical panel buckets are disjoint and sum to the panel count — no double-counted mounting (`.98`).
- **MS10-28** (P0) — Emitter coverage as shipped: modules and inverters (measured); DC/AC cable sized from the electrical engine; connectors, DCDB/ACDB, conduit/tray, meters, optimisers, combiners (`.99–.109`); structure steel per profile, foundations/fixings from the node graph, per-covering fallbacks, rails, clamps, fasteners (`.110–.118`); safety from drawn geometry — walkways, rails, arresters, earthing pits, signage (`.119–.122`); civil and site works, with site-dependent prompt lines emitted at zero and excluded so nobody forgets them (`.123–.125`).
**DONE WHEN:**
- Given a design, Then all six emitters derive their lines over one context (MS10-21) with worst-tier header confidence and correct subtotal/total composition (MS10-22), stable keys and waste defaults (MS10-23), documented cable-length precedence (MS10-25), price-book resolution rounding up (MS10-26), disjoint mounting buckets (MS10-27) and the full emitter coverage listed (MS10-28).
- MS10-24 is P1 and carries no separate line in the document's P0 acceptance block; its requirement text above is its acceptance.
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-303 · Cable-length precedence and price-book resolution (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS10-25, MS10-26
**PORT:** `3d_design_studio/src/features/solar-studio/lib/bom/emitters/electrical.ts`, `lib/bom/context.ts`, `3d_design_studio/src/features/solar-studio/data/pricebook.ts`, tests `lib/__tests__/bom-inputs.test.ts`, `bom-catalog.test.ts`
**DEFECTS:** none targeting these rows.
**Requirements (verbatim):**
- **MS10-25** (P0) — Cable-length precedence, DC and AC independently: routed geometry → survey input → documented fallback estimator, with each source stated and zero/negative inputs never treated as a run (`.90–.95`).
- **MS10-26** (P0) — Prices resolve through the catalog's price book per derivation, with cable rates rounding UP to the next priced size (never understating) (`.97/.152`).
**DONE WHEN:**
- Given a design, Then all six emitters derive their lines over one context (MS10-21) with worst-tier header confidence and correct subtotal/total composition (MS10-22), stable keys and waste defaults (MS10-23), documented cable-length precedence (MS10-25), price-book resolution rounding up (MS10-26), disjoint mounting buckets (MS10-27) and the full emitter coverage listed (MS10-28).
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-304 · Money engine: waste, discrete rounding and the locked invariants (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS10-22, MS10-29, MS10-30, MS10-31
**PORT:** `3d_design_studio/src/features/solar-studio/lib/bom/money.ts`, `3d_design_studio/src/features/solar-studio/data/gst.ts`, tests `lib/__tests__/bom-money.test.ts`, `bom-discount.test.ts`
**DEFECTS:** none targeting these rows.
**Requirements (verbatim):**
- **MS10-22** (P0) — Header confidence is the WORST tier among included lines; subtotal is buy-cost including waste; the total is line-wise because tax rates differ (`.77–.79`).
- **MS10-29** (P0) — Order quantity applies waste and rounds up for discrete units; excluded lines price at zero with no phantom margin (`.126/.127`).
- **MS10-30** (P0) — Locked invariants: margin sits BELOW tax (tax is charged on the sale price) and discount sits BEFORE tax; the discount is bounded to the taxable amount and comes out of margin, never cost; rounding happens once then adds (`.128–.132`).
- **MS10-31** (P0) — Margin default and zero-line behaviour are defined (`.134/.135`).
**DONE WHEN:**
- Given a design, Then all six emitters derive their lines over one context (MS10-21) with worst-tier header confidence and correct subtotal/total composition (MS10-22), stable keys and waste defaults (MS10-23), documented cable-length precedence (MS10-25), price-book resolution rounding up (MS10-26), disjoint mounting buckets (MS10-27) and the full emitter coverage listed (MS10-28). *(This task owns the MS10-22 half — header confidence and subtotal/total composition; the emitter halves are T-MS-302 and T-MS-303.)*
- Given quantities and rates, Then waste and discrete rounding apply and excluded lines add nothing (MS10-29); margin sits below tax, discount before tax, bounded and drawn from margin, rounded once (MS10-30); defaults and empty-BOM behaviour hold (MS10-31); tax rates come from the pack (MS10-32). *(The MS10-32 half is built in T-MS-306.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-305 · Per-field overrides, lazy migration, the number-commit contract and mutation routing (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS10-05, MS10-33, MS10-34
**PORT:** `3d_design_studio/src/features/solar-studio/lib/bom/edit.ts`, tests `lib/__tests__/bom-overrides.test.ts`
**DEFECTS:** none targeting these rows.
**Requirements (verbatim):**
- **MS10-05** (P0) — Every BOM mutation is ONE undoable patch; custom lines edit in place while derived lines take field overrides (`.18/.19`).
- **MS10-33** (P0) — Per-field overrides keyed on stable line keys, each recording the engine value at edit time so staleness is exact; legacy whole-line overrides keep working and migrate lazily on first edit (`.136–.145`).
- **MS10-34** (P0) — Number-commit contract avoids phantom edits (untouched = no override; retyping the same value is not an edit) (`.147`).
**DONE WHEN:**
- Given any BOM edit, Then it is one undoable patch routed correctly for custom vs derived lines (MS10-05).
- Given an edited field, Then the override records the engine's value for exact staleness, legacy overrides still apply and migrate lazily (MS10-33), retyping the same value creates no override (MS10-34), and the edit re-keys the fingerprint without reordering fields (MS10-35). *(The MS10-35 half — section-state counts and the fingerprint re-key — is built in T-MS-301.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-306 · Market data pack: price book, tax, subsidy, engineering constants and wind — multi-market resolver (engine)

**Type:** engine · **Tier:** P0
**PRD rows:** MS10-32, MS10-39
**PORT:** `3d_design_studio/src/features/solar-studio/data/rules/india.ts`, `data/gst.ts`, `data/pricebook.ts` (the read path is shared with T-MS-303), tests `lib/__tests__/rules.test.ts`, `bom-catalog.test.ts`
**DEFECTS:**
- `CODE.step9-bom.151/.153-.157/.28` — prices, tax, subsidy, constants, wind and the compliance checklist are India-hardcoded (ruling S9-1 → MS10-39/32/10; the checklist half lands on T-MS-301, the pack itself here).
**Requirements (verbatim):**
- **MS10-32** (P0) — Tax rates, categories and per-line exceptions are MARKET-PACK data (S9-1 fixes `.153`).
- **MS10-39** (P0) — ALL market data is pack-driven: price book, tax, subsidy slabs and eligibility, engineering constants (slack, drops, reach, earthing counts) and wind tables; the single-market resolver becomes multi-market with India shipping today's exact values (S9-1 fixes `.151/.153–.157`).
**DONE WHEN:**
- Given quantities and rates, Then waste and discrete rounding apply and excluded lines add nothing (MS10-29); margin sits below tax, discount before tax, bounded and drawn from margin, rounded once (MS10-30); defaults and empty-BOM behaviour hold (MS10-31); tax rates come from the pack (MS10-32). *(This task owns the MS10-32 half; MS10-29/30/31 are built in T-MS-304.)*
- Given a non-India market pack, Then prices, tax, subsidy, constants and wind data come from that pack (MS10-39).
- The ported POC tests for this area pass unchanged in the new project — with India's shipped values as the golden fixture, so the resolver's first market reproduces today's numbers exactly.

### T-MS-307 · CSV and DXF exports (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS10-36, MS10-37
**PORT:** `3d_design_studio/src/features/solar-studio/lib/dxf.ts`, `lib/export-dxf.ts`, `lib/bom.ts`'s CSV serialiser (the file is claimed with T-MS-302's engine core), tests `lib/__tests__/bom-export.test.ts`, `dxf.test.ts`
**DEFECTS:** none targeting these rows.
**Requirements (verbatim):**
- **MS10-36** (P0) — CSV export: full column set, buy-side amounts never discounted while sell-side reflects the quote, notes appended safely, and a defined no-project fallback (`.5/.80–.83`).
- **MS10-37** (P0) — DXF export writes the DESIGN at 1:1 in named layers including structure in plan, with a deterministic filename; its trigger lives on the SLD step (`.161–.166`, MS8-06).
**DONE WHEN:**
- Given CSV export, Then buy-side amounts are undiscounted while sell-side reflects the quote, with safe notes (MS10-36).
- Given DXF export, Then the design writes 1:1 in named layers with structure in plan (MS10-37).
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-308 · Units: metric storage, display-only conversion, procurement units (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS10-15, MS10-38
**PORT:** `3d_design_studio/src/features/solar-studio/lib/units.ts`, tests `lib/__tests__/units.test.ts`, `units-roundtrip.test.ts`
**DEFECTS:** none targeting these rows.
**Requirements (verbatim):**
- **MS10-15** (P1) — Procurement quantities stay in the trade's unit even when display units differ (`.55`).
- **MS10-38** (P0) — Units: everything stored metric with display-only conversion and a typed-value return trip (`.158–.160`).
**DONE WHEN:**
- Given a display-unit preference, Then storage stays metric with a correct return trip (MS10-38).
- MS10-15 is P1 and carries no separate line in the document's P0 acceptance block; its requirement text above is its acceptance.
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-309 · One money path and travelling confidence: the BOM's contracts to the customer surfaces (integration)

**Type:** integration · **Tier:** P0
**PRD rows:** MS10-04, MS10-40
**PORT:** `3d_design_studio/src/features/solar-studio/lib/bom/money.ts` (the single engine, ported in T-MS-304) is wired as the one reader for the proposal and comparison surfaces, whose POC files are claimed by the MS7 sitting (`lib/finance.ts`, `lib/comparison.ts`).
**DEFECTS:** none targeting these rows.
**Requirements (verbatim):**
- **MS10-04** (P0) — ONE money path: the screen, the proposal and the comparison all read the same money engine (`.17`, MS7-28).
- **MS10-40** (P0) — Confidence and preliminary state TRAVEL to the proposal and the customer document (`.167`, MS9-20).
**DONE WHEN:**
- Given any surface showing price, Then it equals the money engine's output (MS10-04).
- Given a preliminary BOM, Then its confidence travels to the customer document (MS10-40).

---

## Step 10 (Done), sign-off, fingerprints & installation (MS11)

### T-MS-310 · Studio Step 10 — Done, with the readiness review on the step (port + UI rebuild)

**Type:** screen · **Tier:** P0
**PRD rows:** MS11-01 (P0), MS11-03 (P0), MS11-04 (P0), MS11-05 (P0), MS11-06 (P1), MS11-07 (P0), MS11-08 (P0), MS11-09 (P0), MS11-11 (P0)
**DESIGN:** SCR-MS-13 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Step10Done.tsx` (the review engine it reads, `lib/review.ts`, ports in T-MS-311)
**DEFECTS:**
- `CODE.step10-done.21/.22/.122/.8/.37/.52` — copy silent; duplicate hijacks session/undo; capture rule vs stated law; open-insight count; cover staleness (ruling S10-3 → MS11-04/26/25/09/11; this task owns the MS11-04/09/11 halves, T-MS-317 owns MS11-25/26).
- `CODE.step10-done.132/.131/.117/.59` — no engineer sign-off queue/review/return anywhere; approval survives duplication; unapproved designs served (ruling S10-1 → MS11-13..17; the `.59` half is why the readiness review is surfaced here at all, per MS11-03).
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-13-done-step.md`; they are the specification.
**DONE WHEN:**
- Given all gates pass, Then Step 10 is reachable and shows the project's identity (MS11-01); marking ready requires the readiness review to pass, from every writer (MS11-02); the review is visible on Step 10 (MS11-03); actions work and copy confirms (MS11-04); the customer-facing link is offered (MS11-05). *(The MS11-02 half — the precondition every writer applies — is built in T-MS-311.)*
- Given a design, Then the review returns its four items derived from the real gates with a worst-of verdict (MS11-07); the electrical item blocks and explains, including the no-components edge (MS11-08); the design-review item counts only insights that are neither accepted nor dismissed (MS11-09); quantity confidence follows the BOM (MS11-10); imagery reports shortfall then staleness including the cover, and never blocks (MS11-11); the verdict gates issuance (MS11-12). *(MS11-10 is built in T-MS-311; MS11-12 is a law, listed below.)*
- MS11-06 is P1 and carries no separate line in the document's P0 acceptance block; its requirement text in the brief is its acceptance.
- The ported POC tests for this area pass unchanged in the new project.
- Three base states + brief-listed states present at 375px and 1536px with full parity.

### T-MS-311 · The readiness contract: the precondition every writer applies, and the quantity-confidence item (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS11-02, MS11-10
**PORT:** `3d_design_studio/src/features/solar-studio/lib/review.ts`, tests `lib/__tests__/review.test.ts`
**DEFECTS:**
- `CODE.step10-done.132/.131/.117/.59` — no engineer sign-off queue/review/return anywhere; approval survives duplication; unapproved designs served (ruling S10-1 → MS11-13..17; the same ruling with S8-2a is what makes readiness a precondition rather than a free-to-flip chip, per MS11-02).
**Requirements (verbatim):**
- **MS11-02** (P0) — Marking a design ready has a READINESS PRECONDITION — the same review Step 7 shows — and every writer of that state applies it consistently (S10-1/S8-2a fix `.3/.6/.7`) (`.4/.5`).
- **MS11-10** (P0) — Quantity-confidence item inherits the BOM's confidence rules (`.43–.46`).
**DONE WHEN:**
- Given all gates pass, Then Step 10 is reachable and shows the project's identity (MS11-01); marking ready requires the readiness review to pass, from every writer (MS11-02); the review is visible on Step 10 (MS11-03); actions work and copy confirms (MS11-04); the customer-facing link is offered (MS11-05). *(This task owns the MS11-02 half; the rest is T-MS-310's screen.)*
- Given a design, Then the review returns its four items derived from the real gates with a worst-of verdict (MS11-07); the electrical item blocks and explains, including the no-components edge (MS11-08); the design-review item counts only insights that are neither accepted nor dismissed (MS11-09); quantity confidence follows the BOM (MS11-10); imagery reports shortfall then staleness including the cover, and never blocks (MS11-11); the verdict gates issuance (MS11-12). *(This task owns the MS11-10 half, reading the confidence tiers T-MS-304 computes.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-312 · Sign-off queue — the approving engineer's home (screen)

**Type:** screen · **Tier:** P0
**PRD rows:** MS11-13 (P0)
**DESIGN:** SCR-MS-15 → PENDING
**PORT:** none — the POC has no engineer sign-off flow at all, so no file in `docs/prd/modules/M05-studio/poc-file-claims.md` claims this area; ruling S10-1 builds it. Owner ruling S12-1's port-first default cannot apply to a surface that does not exist in `3d_design_studio/`.
**DEFECTS:**
- `CODE.step10-done.132/.131/.117/.59` — no engineer sign-off queue/review/return anywhere; approval survives duplication; unapproved designs served (ruling S10-1 → MS11-13..17; this task owns MS11-13).
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-15-signoff-queue.md`; they are the specification.
**DONE WHEN:**
- Given designs awaiting approval, Then the engineer's queue lists them oldest-first with the stated columns (MS11-13); Given a review, Then approve records who/when/version, and return-with-comments pins each comment and notifies the designer (MS11-14); Given a material change after approval, Then sign-off re-opens (MS11-15); Given a duplicate, Then it carries no approval and no crew ticks (MS11-16); Given an unapproved design, Then no customer surface serves it and the installation sheet states its status (MS11-17). *(This task owns the MS11-13 half; MS11-14 is T-MS-313 and MS11-15/16/17 are T-MS-314.)*
- Three base states + brief-listed states present at 375px and 1536px with full parity.

### T-MS-313 · Sign-off review — approve, or return with pinned comments (screen)

**Type:** screen · **Tier:** P0
**PRD rows:** MS11-14 (P0)
**DESIGN:** SCR-MS-16 → PENDING
**PORT:** none — the POC has no engineer sign-off flow at all (no claimed file in `docs/prd/modules/M05-studio/poc-file-claims.md`); ruling S10-1 builds it. The read-only studio and drawings it composes are the surfaces ported by the earlier studio tasks.
**DEFECTS:**
- `CODE.step10-done.132/.131/.117/.59` — no engineer sign-off queue/review/return anywhere; approval survives duplication; unapproved designs served (ruling S10-1 → MS11-13..17; this task owns MS11-14).
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-16-signoff-review.md`; they are the specification.
**DONE WHEN:**
- Given designs awaiting approval, Then the engineer's queue lists them oldest-first with the stated columns (MS11-13); Given a review, Then approve records who/when/version, and return-with-comments pins each comment and notifies the designer (MS11-14); Given a material change after approval, Then sign-off re-opens (MS11-15); Given a duplicate, Then it carries no approval and no crew ticks (MS11-16); Given an unapproved design, Then no customer surface serves it and the installation sheet states its status (MS11-17). *(This task owns the MS11-14 half; MS11-13 is T-MS-312 and MS11-15/16/17 are T-MS-314.)*
- Three base states + brief-listed states present at 375px and 1536px with full parity.

### T-MS-314 · Sign-off gating: approval bound to the design version, never inherited, never bypassed (policy)

**Type:** policy · **Tier:** P0
**PRD rows:** MS11-15, MS11-16, MS11-17
**PORT:** none for the gate itself — the POC has no sign-off state to port; it attaches to the ported `3d_design_studio/src/features/solar-studio/lib/fingerprints.ts` (T-MS-315) for the version binding and to `lib/project-duplicate.ts` (T-MS-317) for the reset.
**DEFECTS:**
- `CODE.step10-done.132/.131/.117/.59` — no engineer sign-off queue/review/return anywhere; approval survives duplication; unapproved designs served (ruling S10-1 → MS11-13..17; this task owns MS11-15/16/17).
**Requirements (verbatim):**
- **MS11-15** (P0) — Approval is bound to the design version it was given for: a material change re-opens sign-off rather than silently carrying the old approval forward (fingerprint law, MS11-16).
- **MS11-16** (P0) — Duplicating a design NEVER carries the engineer's approval (S10-1 fixes `.117`); crew tick-offs likewise start clean (`.118`).
- **MS11-17** (P0) — Unapproved designs cannot reach customer surfaces (S10-1 fixes `.131`, pairs with MS9-06); the installation sheet states the engineering status and is gated on it (S10-1 fixes `installation.10`).
**DONE WHEN:**
- Given designs awaiting approval, Then the engineer's queue lists them oldest-first with the stated columns (MS11-13); Given a review, Then approve records who/when/version, and return-with-comments pins each comment and notifies the designer (MS11-14); Given a material change after approval, Then sign-off re-opens (MS11-15); Given a duplicate, Then it carries no approval and no crew ticks (MS11-16); Given an unapproved design, Then no customer surface serves it and the installation sheet states its status (MS11-17). *(This task owns the MS11-15/16/17 halves; MS11-17's drawn half — the installation sheet's engineering-status block — is specified in `docs/ux/briefs/SCR-MS-17-installation-work-order.md` and built with T-MS-318.)*

### T-MS-315 · The fingerprint system: five layers, exact membership, freshness predicates (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS11-18, MS11-19, MS11-21, MS11-22
**PORT:** `3d_design_studio/src/features/solar-studio/lib/fingerprints.ts`, tests `lib/__tests__/fingerprints.test.ts`
**DEFECTS:** none targeting these rows.
**Requirements (verbatim):**
- **MS11-18** (P0) — Five layered fingerprints over the design — site ⊂ geometry ⊂ layout ⊂ electrical ⊂ design — each answering "what must recalculate after this edit", deterministic and byte-stable (`.60–.63`).
- **MS11-19** (P0) — Layer membership as specified: site physics; geometry (shadow casters + mounting surfaces, with capability overrides); layout (placement, leg plans, structure-model version); electrical (components + string topology); design (everything reaching a customer output, including normalised BOM overrides and the catalog version) (`.64–.76`).
- **MS11-21** (P0) — Shading fingerprint = geometry + panel poses + engine version; bumping the ENGINE invalidates every stored access value (`.78–.81`).
- **MS11-22** (P0) — Freshness predicates: shading fresh, capture fresh (per-capture), and captures-fresh INCLUDING the cover (`.82–.84`, with MS7-09's stamping law).
**DONE WHEN:**
- Given each fingerprint layer, Then its membership is exactly as specified — site physics, geometry with capability overrides, layout with leg plans and structure-model version, electrical topology, and design including normalised BOM overrides and catalog version (MS11-19).
- Given any edit, Then exactly the documented fingerprint layers change (MS11-18); Given a new optional field, Then existing designs do not become stale (MS11-20); Given an engine version bump, Then stored access values invalidate (MS11-21); Given a layout change, Then captures and the cover report staleness correctly (MS11-22); Given each consumer, Then it recomputes on its own key (MS11-24). *(MS11-20 is a law, listed below; MS11-24 is built in T-MS-316.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-316 · The normative invalidation table and the fingerprint consumers (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS11-23, MS11-24
**PORT:** `3d_design_studio/src/features/solar-studio/lib/fingerprints.ts`'s consumer keys (the module is claimed with T-MS-315), tests `lib/__tests__/fingerprints.test.ts`, `model-version.test.ts`
**DEFECTS:** none targeting these rows.
**Requirements (verbatim):**
- **MS11-23** (P0) — The behavioural table is normative — pin move, weather arrival, vertex move, parapet, obstruction, panel move/disable/tilt, restring, inverter count, margin, BOM override, rename, recomputed access — each invalidating exactly its documented layers (`.85–.98`).
- **MS11-24** (P0) — Consumers: captures stamped by layout; access recompute keyed by shading; 3D structure keyed by layout; health, insights and comparison keyed by design; freshness surfaces reach the customer documents; migrations preserve fingerprint bytes (`.99–.105`).
**DONE WHEN:**
- Given the behavioural table (pin move, weather arrival, vertex move, parapet, obstruction, panel move/disable/tilt, restring, inverter count, margin, BOM override, rename, recomputed access), Then each edit invalidates exactly its listed layers and no others (MS11-23).
- Given any edit, Then exactly the documented fingerprint layers change (MS11-18); Given a new optional field, Then existing designs do not become stale (MS11-20); Given an engine version bump, Then stored access values invalidate (MS11-21); Given a layout change, Then captures and the cover report staleness correctly (MS11-22); Given each consumer, Then it recomputes on its own key (MS11-24). *(This task owns the MS11-24 half; MS11-18/21/22 are T-MS-315.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-317 · Duplicate: an independent design, an untouched session, and the variant lineage pointer (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS11-25, MS11-26, MS11-27
**PORT:** `3d_design_studio/src/features/solar-studio/lib/project-duplicate.ts`, tests `lib/__tests__/project-duplicate.test.ts`
**DEFECTS:**
- `CODE.step10-done.21/.22/.122/.8/.37/.52` — copy silent; duplicate hijacks session/undo; capture rule vs stated law; open-insight count; cover staleness (ruling S10-3 → MS11-04/26/25/09/11; this task owns the MS11-25/26 halves, T-MS-310 owns MS11-04/09/11).
**Requirements (verbatim):**
- **MS11-25** (P0) — Duplicate produces an independent design: new identity and share id, fresh timestamps, status reset, image references dropped with the stated rule applied consistently (S10-3.3 fixes `.8`), and a unique copy name (`.106–.116`).
- **MS11-26** (P0) — Duplication does not hijack the session: the active project switches only with the user's intent, and undo history is not silently destroyed (S10-3.2 fixes `.122`) (`.120/.121`).
- **MS11-27** (P1) — Variant lineage and side-by-side comparison are the main suite's requirement (M05 baseline, D16/UXG-08) — the POC records neither (`.123/.124`); the studio must carry the lineage pointer so MS6's compare surface can group variants.
**DONE WHEN:**
- Given duplicate, Then the copy is independent with a unique name and the stated reset rules (MS11-25) and the session/undo history are not silently changed (MS11-26).
- Given designs awaiting approval, Then the engineer's queue lists them oldest-first with the stated columns (MS11-13); Given a review, Then approve records who/when/version, and return-with-comments pins each comment and notifies the designer (MS11-14); Given a material change after approval, Then sign-off re-opens (MS11-15); Given a duplicate, Then it carries no approval and no crew ticks (MS11-16); Given an unapproved design, Then no customer surface serves it and the installation sheet states its status (MS11-17). *(MS11-16's gate is T-MS-314's; the reset this task performs is what satisfies it.)*
- MS11-27 is P1 and carries no separate line in the document's P0 acceptance block; its requirement text above is its acceptance. The lineage pointer it writes is what `docs/ux/briefs/SCR-MS-14-variant-compare.md` groups on; that compare surface's own rows sit outside this file's slice.
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-318 · The installation work order — the crew's field document (port + UI rebuild)

**Type:** screen · **Tier:** P0
**PRD rows:** MS11-28 (P0), MS11-29 (P0), MS11-30 (P0), MS11-31 (P0), MS11-32 (P0), MS11-33 (P0), MS11-34 (P0), MS11-35 (P0), MS11-36 (P0), MS11-37 (P0)
**DESIGN:** SCR-MS-17 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/InstallationSheet.tsx`, `3d_design_studio/src/features/solar-studio/lib/installation.ts`, tests `lib/__tests__/installation.test.ts`
**DEFECTS:**
- `CODE.installation.9/.11/.14/.16/.35/.36/.51/.56/.60/.61/.62/.64/.18/.53/.4/.7/.24/.29/.30` — installation sheet: wrong derivation, missing materials, no identity, no print CSS, device-local ticks, no attribution (19 defects) (ruling S10-2 → MS11-28..37).
- `CODE.step10-done.132/.131/.117/.59` — no engineer sign-off queue/review/return anywhere; approval survives duplication; unapproved designs served (ruling S10-1 → MS11-13..17; `installation.10` is why this sheet states and is gated on the engineering status — the gate itself is T-MS-314).
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-17-installation-work-order.md`; they are the specification. The one row of this task absent from that brief:
- **MS11-32** (P0) — No commercial figure ever reaches this surface (R16's law, `.12/.13`).
**DONE WHEN:**
- Given a design with structures and strings, Then the work order emits foundations, legs, rafters, purlins/braces, structured and loose modules, per-string wiring and balance-of-system with model-derived counts, plural-correct titles, and disabled panels excluded (MS11-29). Given a two-table roof, Then each table's steps are distinct and phase headings are not misleadingly repeated (MS11-30).
- Given a design, Then the work order derives distinct steps per roof and table across the seven phases with correct, plural-correct counts excluding disabled panels (MS11-28/29/30); materials resolve from the BOM with no missing or not-supplied lines (MS11-31); no price appears anywhere (MS11-32); the sheet carries date, version, site, issued-by and engineering status (MS11-33); printing produces a usable field document (MS11-34); ticks persist per project with attribution (MS11-35); missing prerequisites are stated honestly (MS11-36); the dialog is accessible (MS11-37); crew access follows R16 (MS11-38). *(MS11-38 is a law, listed below.)*
- The ported POC tests for this area pass unchanged in the new project.
- Three base states + brief-listed states present at 375px and 1536px with full parity.

---

## Shell & platform — wizard, design list, sign-in, persistence, UI kit (MS12)

### T-MS-360 · Studio shell — the nine-step wizard frame, header, gates and health (port + UI rebuild)

**Type:** screen · **Tier:** P0
**PRD rows:** MS12-01 (P0), MS12-03 (P0), MS12-04 (P0), MS12-05 (P0), MS12-06 (P0), MS12-07 (P0), MS12-08 (P0), MS12-09 (P0), MS12-24 (P0)
**DESIGN:** SCR-MS-03 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Wizard.tsx`, `3d_design_studio/src/app/(studio)/wizard/[step]/page.tsx`, tests `lib/__tests__/step-help.test.ts` (the electrical hard gate the frame calls, `lib/electrical/gate.ts`, is the MS8 sitting's; the health engine the chip and sheet read, `lib/health.ts` + `store/useHealthSync.ts`, is the MS6 sitting's)
**DEFECTS:**
- `CODE.shell.1/.2` — phantom Step 5: named, counted, URL-reachable with no page (ruling S11-1 → MS12-01).
- `CODE.shell.52-.56/.37/.65-.83/.20` — mock auth, placeholder languages, browser-only storage, no lead scoping (ruling S11-3 → MS12-17/18/20/10; the `.20` half — "save and exit" returning to the LEAD under S11-3d — is MS12-05's and lands here).
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-03-studio-shell.md`; they are the specification.
**DONE WHEN:**
- Given the wizard, Then nine steps are shown and no dead step URL resolves, while existing designs still open at their saved step (MS12-01); each gate states its reason in order (MS12-03) and a blocked Next explains accessibly (MS12-04); the header carries all controls and "save and exit" returns to the lead (MS12-05); the health chip shows stamped, provisional or placeholder states correctly (MS12-06); help exists for every step (MS12-07); progress reflects nine steps (MS12-08); the health sheet explains its score with deltas and context (MS12-09).
- Given a failed save, Then a persistent alert states the design is not saved and no work is silently lost (MS12-24).
- The ported POC tests for this area pass unchanged in the new project.
- Three base states + brief-listed states present at 375px and 1536px with full parity.

### T-MS-361 · Step navigation: clamping, the remembered step, and prerequisite-gated deep links (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS12-02, MS12-13
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Wizard.tsx`'s navigation core — `go()`, the clamp and the highest-permitted-step computation (the file is claimed with T-MS-360's frame), `3d_design_studio/src/features/solar-studio/store/store.tsx`'s open-design path, tests `3d_design_studio/src/features/solar-studio/store/store.test.ts`
**DEFECTS:** none targeting these rows.
**Requirements (verbatim):**
- **MS12-02** (P0) — Navigation clamps to valid steps and remembers where a design was left (`.3`); deep links are gated by prerequisites — you cannot jump past an unmet gate (`.4`).
- **MS12-13** (P0) — Opening a design resumes at its saved step with a clean undo history (`.45`, MS11-26).
**DONE WHEN:**
- Given a deep link to a step whose prerequisites are unmet, Then navigation clamps to the highest permitted step and says why; and reopening a design returns to where it was left (MS12-02).
- Given a tenant user, Then the design list shows that tenant's lead-scoped designs on any device (MS12-10) with counts, filters, search and sort (MS12-11); cards are keyboard-operable with correct menus (MS12-12); opening resumes at the saved step with clean undo (MS12-13); delete confirms accurately (MS12-14); empty and unreadable-record states are honest (MS12-15); new designs get market-aware defaults and a share identity (MS12-16). *(This task owns the MS12-13 half — resume at the saved step with a clean undo history, the undo scoping itself being T-MS-366's; MS12-10 is T-MS-365, MS12-11/12/14/15 are T-MS-363 and MS12-16 is T-MS-372.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-362 · Routing: named routes, post-hydration guards, the hydration gate, dead routes removed (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS12-27
**PORT:** `3d_design_studio/src/features/solar-studio/router.ts`, `3d_design_studio/src/app/(studio)/StudioClientLayout.tsx`, `3d_design_studio/src/app/(studio)/layout.tsx`, `3d_design_studio/src/app/(studio)/page.tsx`, `3d_design_studio/src/app/(studio)/projects/page.tsx`, `3d_design_studio/src/app/(studio)/proposal/page.tsx`, `3d_design_studio/src/app/layout.tsx`
**DEFECTS:**
- `CODE.shell.55/.51/.102/.83` — dead forgot-password; misleading delete copy; legacy dead route + export (ruling S11-2 → MS12-17/14/27; this task owns the `.102/.83` half — the legacy dead route and its export).
**Requirements (verbatim):**
- **MS12-27** (P0) — Routing: named routes for the wizard, design list, share and sign-in, with guards applied after hydration and a hydration gate that shows loading rather than a blank screen (`.102–.106`, MS9-15); legacy dead routes are removed (S11-2.3 fixes `.102/.83`).
**DONE WHEN:**
- Given any sheet or dialog, Then focus traps and restores, Escape closes, and automated accessibility checks pass (MS12-25); shared fields commit once on blur or Enter (MS12-26); routes guard after hydration with a loading state and no legacy dead routes (MS12-27); background recompute stamps the geometry actually used (MS12-28). *(This task owns the MS12-27 half; MS12-25 is T-MS-370, MS12-26 is T-MS-369 and MS12-28 is T-MS-371. The drawn hydration-loading state this row owes is specified in `docs/ux/briefs/SCR-MS-03-studio-shell.md` and `docs/ux/briefs/SCR-MS-01-design-list.md`, built with T-MS-360 and T-MS-363.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-363 · Design list — the lead's designs and variants (port + UI rebuild)

**Type:** screen · **Tier:** P0
**PRD rows:** MS12-11 (P0), MS12-12 (P0), MS12-14 (P0), MS12-15 (P0)
**DESIGN:** SCR-MS-01 → PENDING
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Dashboard.tsx` (its route, `3d_design_studio/src/app/(studio)/projects/page.tsx`, is claimed with T-MS-362; the server-backed lead-scoped read it lists from is T-MS-365's)
**DEFECTS:**
- `CODE.shell.55/.51/.102/.83` — dead forgot-password; misleading delete copy; legacy dead route + export (ruling S11-2 → MS12-17/14/27; this task owns the `.51` half — the misleading delete copy, per MS12-14).
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-01-design-list.md`; they are the specification.
**DONE WHEN:**
- Given a tenant user, Then the design list shows that tenant's lead-scoped designs on any device (MS12-10) with counts, filters, search and sort (MS12-11); cards are keyboard-operable with correct menus (MS12-12); opening resumes at the saved step with clean undo (MS12-13); delete confirms accurately (MS12-14); empty and unreadable-record states are honest (MS12-15); new designs get market-aware defaults and a share identity (MS12-16). *(This task owns the MS12-11/12/14/15 halves; MS12-10 is built in T-MS-365, MS12-13 in T-MS-361 and MS12-16 in T-MS-372.)*
- The ported POC tests for this area pass unchanged in the new project.
- Three base states + brief-listed states present at 375px and 1536px with full parity.

### T-MS-364 · Platform sign-in, tenancy, languages and the top bar — the studio drops its mock auth (integration)

**Type:** integration · **Tier:** P0
**PRD rows:** MS12-17, MS12-18, MS12-19
**PORT:** `3d_design_studio/src/features/solar-studio/screens/Login.tsx` and `3d_design_studio/src/app/(studio)/login/page.tsx` are retired rather than ported — ruling S11-3a replaces the POC's mock two-phase login with the platform's own sign-in, drawn in `docs/ux/briefs/SCR-M01-01-sign-in.md`, and the top bar the studio signs out from is `docs/ux/briefs/SCR-SHELL-01-app-shell.md`. Owner ruling S12-1's port-first default does not reach behaviour a ruling supersedes outright.
**DEFECTS:**
- `CODE.shell.55/.51/.102/.83` — dead forgot-password; misleading delete copy; legacy dead route + export (ruling S11-2 → MS12-17/14/27; this task owns the `.55` half — the dead "Forgot password?" control, per MS12-17).
- `CODE.shell.52-.56/.37/.65-.83/.20` — mock auth, placeholder languages, browser-only storage, no lead scoping (ruling S11-3 → MS12-17/18/20/10; this task owns the `.52–.56` and `.37` halves — mock auth and the placeholder language list, per MS12-17/18).
**Requirements (verbatim):**
- **MS12-17** (P0) — Sign-in is the PLATFORM's: mobile OTP and Google (Q18), establishing tenant, user and role context (F2) — replacing the POC's mock two-phase login (S11-3a fixes `.52–.56`); no dead controls (S11-2.1 fixes `.55`).
- **MS12-18** (P0) — Languages are the platform's real catalogs — EN/HI/MR at launch (F3) — not a placeholder list (S11-3c fixes `.37`); the user's language and unit preferences persist per user (`.18/.72`).
- **MS12-19** (P0) — Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding).
**DONE WHEN:**
- Given sign-in, Then mobile OTP and Google work and establish tenant/role context with no dead controls (MS12-17); language and units persist per user with real catalogs (MS12-18); sign-out preserves work (MS12-19).

### T-MS-365 · Designs as a server-side record: lead scoping, autosave, quarantine, migration and image GC (engine)

**Type:** engine · **Tier:** P0
**PRD rows:** MS12-10, MS12-20
**PORT:** `3d_design_studio/src/features/solar-studio/lib/persistence/repository.ts`, `lib/persistence/schema.ts`, `lib/persistence/blobs.ts`, `lib/persistence/useImage.ts`, `3d_design_studio/src/features/solar-studio/store/store.tsx`, tests `lib/__tests__/persistence.test.ts`, `3d_design_studio/src/features/solar-studio/store/store.test.ts` — the resilience behaviours port as-is; the storage medium does not, ruling S11-3b making the server the system of record.
**DEFECTS:**
- `CODE.shell.52-.56/.37/.65-.83/.20` — mock auth, placeholder languages, browser-only storage, no lead scoping (ruling S11-3 → MS12-17/18/20/10; this task owns the `.65–.83` and lead-scoping halves, per MS12-20/10).
**Requirements (verbatim):**
- **MS12-10** (P0) — Design list is LEAD-SCOPED and server-backed: designs belong to a tenant and a lead, open on any device for any permitted teammate (S11-3b/d) (`.38/.39/.45`).
- **MS12-20** (P0) — Designs are stored SERVER-SIDE as the system of record (S11-3b). The POC's resilience behaviours are retained where they still help: debounced autosave, flush on exit, failure surfacing, quarantine of unreadable records, migration that never loses data, and image garbage collection (`.65–.70/.73–.83/.94–.97`).
**DONE WHEN:**
- Given a tenant user, Then the design list shows that tenant's lead-scoped designs on any device (MS12-10) with counts, filters, search and sort (MS12-11); cards are keyboard-operable with correct menus (MS12-12); opening resumes at the saved step with clean undo (MS12-13); delete confirms accurately (MS12-14); empty and unreadable-record states are honest (MS12-15); new designs get market-aware defaults and a share identity (MS12-16). *(This task owns the MS12-10 half — tenant-owned, lead-scoped and server-backed across devices; the list surface is T-MS-363.)*
- Given any edit, Then it saves server-side, surviving refresh, device change and a failed write with a visible alert (MS12-20/24); undo is scoped to the open design (MS12-21); a concurrent edit is surfaced, never silently overwritten (MS12-22); a malformed stored design is repaired rather than crashing (MS12-23). *(This task owns the MS12-20 half; MS12-24's visible alert is T-MS-360's, MS12-21 is T-MS-366, MS12-22 is T-MS-367 and MS12-23 is T-MS-368.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-366 · Undo model: whole-design snapshots scoped to the open design (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS12-21
**PORT:** `3d_design_studio/src/features/solar-studio/store/store.tsx`'s undo/redo core — snapshot push, redo clear, scope-and-clear on switch, restore semantics (the file is claimed with T-MS-365), tests `3d_design_studio/src/features/solar-studio/store/store.test.ts`
**DEFECTS:** none targeting this row.
**Requirements (verbatim):**
- **MS12-21** (P0) — Undo model: whole-design snapshots scoped to the open design, cleared on switch, with restore semantics that keep multi-device ordering sane (`.59–.61`, MS11-26).
**DONE WHEN:**
- Given any edit, Then it saves server-side, surviving refresh, device change and a failed write with a visible alert (MS12-20/24); undo is scoped to the open design (MS12-21); a concurrent edit is surfaced, never silently overwritten (MS12-22); a malformed stored design is repaired rather than crashing (MS12-23). *(This task owns the MS12-21 half; the clean undo history a newly opened design starts with is T-MS-361's, and duplication's must-not-destroy-undo rule is MS11-26's in T-MS-317.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-367 · Concurrent editing surfaced, never silently overwritten (engine)

**Type:** engine · **Tier:** P0
**PRD rows:** MS12-22, F4-15
**PORT:** `3d_design_studio/src/features/solar-studio/store/store.tsx`'s external-change reconciliation and `lib/persistence/repository.ts`'s write path (both claimed with T-MS-365), tests `3d_design_studio/src/features/solar-studio/store/store.test.ts`, `lib/__tests__/persistence.test.ts` — the POC's detection ports; its last-writer-wins resolution does not, ruling S11-3b replacing it with the platform's conflict handling.
**DEFECTS:** none targeting this row.
**Requirements (verbatim):**
- **MS12-22** (P0) — Concurrent editing is handled honestly: an external change to the same design is detected and surfaced rather than silently overwriting (`.63/.64/.82/.109`); the POC's last-writer-wins local rule is superseded by the platform's conflict handling (S11-3b).
- **F4-15** (P0) — **Design — single editor plus a server version check. No merge, ever.** Every design save carries the version it was based on; a mismatch is **refused**, the client reloads server state, and the user re-applies their change. A design is one document and is never algorithmically merged; the version check is what makes a stale second editor impossible to lose silently rather than a mechanism for combining two edits.
**DONE WHEN:**
- Given any edit, Then it saves server-side, surviving refresh, device change and a failed write with a visible alert (MS12-20/24); undo is scoped to the open design (MS12-21); a concurrent edit is surfaced, never silently overwritten (MS12-22); a malformed stored design is repaired rather than crashing (MS12-23). *(This task owns the MS12-22 half; the conflict-detected state it raises is drawn in `docs/ux/briefs/SCR-MS-03-studio-shell.md` and built with T-MS-360.)*
- The ported POC tests for this area pass unchanged in the new project — the last-writer-wins expectations excepted, since S11-3b supersedes them; every other persistence expectation stands.
- Given a design save based on a superseded version, when it reaches the server, then it is refused, no merge occurs, and the editor is prompted to reload (`F4-15`).
- Given a studio save that fails the server's version check, when the failure returns, then the optimistically applied state is rolled back and a reload is prompted, and the save is never merged and never silently kept (`F4-15`, `M05-09`).

*(`F4-15` moved here from struck `T-FPLAT-012`: the conflict rules land with the module that uses them (Law 9) rather than as a block 0 engine nothing consumes yet.)*

### T-MS-368 · Normalise and repair every persisted design on load (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS12-23
**PORT:** `3d_design_studio/src/features/solar-studio/lib/persistence/normalize.ts`, `lib/persistence/schema.ts` (claimed with T-MS-365), tests `lib/__tests__/persistence.test.ts`
**DEFECTS:** none targeting this row.
**Requirements (verbatim):**
- **MS12-23** (P0) — Every persisted design is normalised and repaired on load — weather validity, pricing clamps, calibration sanity, entity-array coercion, roof/segment defaults, BOM override shape — so a malformed record can never crash a screen (`.84–.93`).
**DONE WHEN:**
- Given any edit, Then it saves server-side, surviving refresh, device change and a failed write with a visible alert (MS12-20/24); undo is scoped to the open design (MS12-21); a concurrent edit is surfaced, never silently overwritten (MS12-22); a malformed stored design is repaired rather than crashing (MS12-23). *(This task owns the MS12-23 half; the data-integrity banner that surfaces a record too broken to load is MS12-15's, drawn in `docs/ux/briefs/SCR-MS-01-design-list.md` and built with T-MS-363.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-369 · The shared UI kit: identical controls everywhere, fields that commit once (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS12-26
**PORT:** `3d_design_studio/src/features/solar-studio/components/ui.tsx`, tests `3d_design_studio/src/features/solar-studio/components/__tests__/NumberField.dom.test.tsx`
**DEFECTS:** none targeting this row.
**Requirements (verbatim):**
- **MS12-26** (P0) — Shared controls behave identically everywhere: sliders with stepper buttons, switches, segmented radiogroups, option cards, unit toggle, number and text fields that COMMIT ONCE on blur or Enter (never per keystroke), accessible tables with required captions, screen-reader-only text, and empty states (`.119–.129`).
**DONE WHEN:**
- Given any sheet or dialog, Then focus traps and restores, Escape closes, and automated accessibility checks pass (MS12-25); shared fields commit once on blur or Enter (MS12-26); routes guard after hydration with a loading state and no legacy dead routes (MS12-27); background recompute stamps the geometry actually used (MS12-28). *(This task owns the MS12-26 half; MS12-25 is T-MS-370, MS12-27 is T-MS-362 and MS12-28 is T-MS-371.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-370 · The accessibility gate: automated checks, focus trap and restore, Escape, real roles and names (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS12-25
**PORT:** `3d_design_studio/src/features/solar-studio/components/__tests__/axe.dom.test.tsx`, `components/__tests__/focus.dom.test.tsx`, `3d_design_studio/src/features/solar-studio/components/ui.tsx`'s roles, names and dialog behaviour (the kit file is claimed with T-MS-369)
**DEFECTS:** none targeting this row.
**Requirements (verbatim):**
- **MS12-25** (P0) — Accessibility is a shipped gate: automated checks run over the rendered kit and screens, focus is trapped and restored in sheets/dialogs, Escape closes, and every control carries a real role and name (`.115–.118/.130`, F7).
**DONE WHEN:**
- Given any sheet or dialog, Then focus traps and restores, Escape closes, and automated accessibility checks pass (MS12-25); shared fields commit once on blur or Enter (MS12-26); routes guard after hydration with a loading state and no legacy dead routes (MS12-27); background recompute stamps the geometry actually used (MS12-28). *(This task owns the MS12-25 half; MS12-26 is T-MS-369, MS12-27 is T-MS-362 and MS12-28 is T-MS-371.)*
- The ported POC tests for this area pass unchanged in the new project, and the automated check runs over the rendered screens as well as the kit — a screen task in this file is not done while it fails.

### T-MS-371 · Background recompute hosts: recompute stamped with the geometry actually used (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS12-28
**PORT:** `3d_design_studio/src/features/solar-studio/store/useDesignSync.ts`, the `DesignSync` host in `3d_design_studio/src/app/(studio)/StudioClientLayout.tsx` (claimed with T-MS-362); the health sync it mounts alongside, `store/useHealthSync.ts`, is the MS6 sitting's, and the shading fingerprint it keys on is T-MS-315's
**DEFECTS:** none targeting this row.
**Requirements (verbatim):**
- **MS12-28** (P0) — Background recompute hosts recompute shading and health at the shell level, stamping the fingerprint of the geometry actually used — never a newer one (`.107/.113/.114`, MS11-21).
**DONE WHEN:**
- Given any sheet or dialog, Then focus traps and restores, Escape closes, and automated accessibility checks pass (MS12-25); shared fields commit once on blur or Enter (MS12-26); routes guard after hydration with a loading state and no legacy dead routes (MS12-27); background recompute stamps the geometry actually used (MS12-28). *(This task owns the MS12-28 half; MS12-25 is T-MS-370, MS12-26 is T-MS-369 and MS12-27 is T-MS-362.)*
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-372 · New-design defaults and the share identity created with the design (port)

**Type:** port · **Tier:** P0
**PRD rows:** MS12-16
**PORT:** `3d_design_studio/src/features/solar-studio/store/store.tsx`'s new-design factory and share-id generation (the file is claimed with T-MS-365), tests `3d_design_studio/src/features/solar-studio/store/store.test.ts`; the market values the defaults resolve from are the pack T-MS-306 builds, and the share identity's lifecycle is MS9-09's
**DEFECTS:** none targeting this row.
**Requirements (verbatim):**
- **MS12-16** (P0) — New-design defaults are explicit and market-aware (`.57`, F1); a design's share identity is created with it (`.58`, MS9-09 governs its lifecycle).
**DONE WHEN:**
- Given a tenant user, Then the design list shows that tenant's lead-scoped designs on any device (MS12-10) with counts, filters, search and sort (MS12-11); cards are keyboard-operable with correct menus (MS12-12); opening resumes at the saved step with clean undo (MS12-13); delete confirms accurately (MS12-14); empty and unreadable-record states are honest (MS12-15); new designs get market-aware defaults and a share identity (MS12-16). *(This task owns the MS12-16 half; a duplicate's fresh share identity is MS11-25's in T-MS-317.)*
- The ported POC tests for this area pass unchanged in the new project — with the India pack's shipped defaults as the golden fixture, so the first market reproduces today's new-design values exactly.

### T-MS-373 · Shared drawing projections: isometric, elevation, fit-to-box, member projection (port)

**Type:** port · **Tier:** P1
**PRD rows:** MS12-30
**PORT:** `3d_design_studio/src/features/solar-studio/lib/drawing-project.ts`, tests `lib/__tests__/drawing-project.test.ts`; the drawing surfaces that must all read it are other sittings' (`components/drawing/index.tsx`, `components/drawing/StructureSheet.tsx`, `components/StructurePreview.tsx`, `screens/Step8Sld.tsx`)
**DEFECTS:** none targeting this row.
**Requirements (verbatim):**
- **MS12-30** (P1) — Drawing projections (isometric, elevation, fit-to-box preserving aspect, member projection) are shared by every drawing surface (`.98–.101`, MS8/MS6).
**DONE WHEN:**
- MS12-30 is P1 and carries no separate line in the document's P0 acceptance block; its requirement text above is its acceptance — "shared by every drawing surface" is the testable half: no drawing surface may carry its own projection maths.
- The ported POC tests for this area pass unchanged in the new project.

### T-MS-374 · The living design-system reference (port + UI rebuild)

**Type:** screen · **Tier:** P1
**PRD rows:** MS12-29 (P1)
**DESIGN:** SCR-MS-18 → PENDING
**PORT:** `3d_design_studio/src/app/design/page.tsx` — the POC's living reference page; it renders the kit T-MS-369 ports, so the two move together
**DEFECTS:** none targeting this row.
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-18-design-system-reference.md`; they are the specification.
**DONE WHEN:**
- MS12-29 is P1 and carries no separate line in the document's P0 acceptance block; its requirement text in the brief is its acceptance — the reference stays part of the product's development surface, tracking the real shared controls as they ship rather than a curated subset.
- The POC ships no test for this page; the ported kit and accessibility nets of T-MS-369 and T-MS-370 are its regression cover, and they pass unchanged in the new project.
- Three base states + brief-listed states present at 375px and 1536px with full parity.

### T-MS-375 · Design Queue — the Design Engineer's home, with the sign-off queue composed in (screen)

**Type:** screen · **Tier:** P0
**PRD rows:** M13-33 (P0), PS-16 (P0), PS-18 (P0)
**DESIGN:** SCR-MS-02 → PENDING
**PORT:** none — the POC has no designer home; the queue's content contract is `M05-83`'s, built new against the ported design list (T-MS-363) and the sign-off queue (T-MS-312).
**DEFECTS:** none targeting these rows. (The absence of any sign-off flow in the POC is defect-register territory closed by S10-1; this screen is the home that surfaces it.)
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-02-design-queue.md`; they are the specification.

Cross-bucket note: these three rows are dispositioned in `docs/tasks/M13-dashboards.md` and `docs/tasks/F-core.md` as `realized-by` this task — the rows live in M13/personas documents while the screen belongs to the studio's `SCR-MS-*` range. This task is where they are built.

**DONE WHEN:**
- Given each of the twelve presets held singly, when the person signs in, then their home matches their row above, with content identical to the owning module's contract (M13-29 through M13-40, M13-11). *(This task carries the Design Engineer row — M13-33 — whose composed sign-off queue is `M05-83`'s content contract unmodified and role-gated.)*
- Given waiting designs, when the queue renders, then they are oldest first with customer, kWp, designer and waiting time (M05-83). *(The composed block's own acceptance, inherited here unchanged; M05-83 itself is built by T-MS-312 and this home never restates it.)*
- (PS-16 and PS-18 carry no dedicated Given/When/Then line in the PRD's acceptance block — `docs/prd/02-personas.md` states no acceptance criteria at all — the requirement text in the brief is the binding criterion: designs awaiting work, the queue of surveys handed over and designs in progress with the blocking gaps named per item, and the sign-off queue composed into the one home rather than presented as a second front door.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-MS-376 · Variant Compare — 2–4 variants side by side, recommendation set here (screen)

**Type:** screen · **Tier:** P0
**PRD rows:** M05-79 (P0)
**DESIGN:** SCR-MS-14 → PENDING
**PORT:** none as a surface — the POC has no compare screen; it composes over ported outputs: the fingerprint/variant lineage of T-MS-315/T-MS-316, the money engine of the BOM tasks, and Design Health from T-MS-205 (the health engine ported with the layout editor).
**DEFECTS:** none targeting M05-79 — `docs/prd/modules/M05-studio/poc-file-claims.md` claims no compare-variants surface. One adjacent entry binds this screen indirectly:
- `CODE.step7-proposal.90/.152` — never-paying system reports "25 years"; ranking sorts the sentinel (S6-1a: no-payback state → MS7-32/50). This screen ranks and marks `is_recommended`, so it consumes the corrected payback of T-MS-264 (MS7-32) and the corrected ranking of T-MS-267 (MS7-50); it owns neither half.
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-MS-14-variant-compare.md`; they are the specification.

Cross-bucket note: M05-79 is dispositioned in `docs/tasks/MS-studio-a.md` (the bucket owning `M05-design-studio.md`) as `realized-by` this task; the screen belongs to the `SCR-MS-*` range owned by this file.

**DONE WHEN:**
- Given compare on mobile, when rendered, then variants are horizontal snap cards with the five compare figures and their source labels (M05-79).
- Given "make it recommended" on variant B, when applied, then A loses the mark in the same act (M05-80). *(M05-80 is a LAW in `docs/tasks/MS-studio-a.md`, which names the design list and this variant-compare screen as its enforcers; this task builds no M05-80 row, it satisfies the law.)*
- Two variants with different energy sources → labels make the difference visible (M05-79). *(§M05.13 edge case, not an acceptance line.)*
- (M05-79's remaining halves — the 2–4 side-by-side comparison on kWp, annual generation, price, payback and health score, `is_recommended` set from this surface, and duplicate-as-variant as an entry point — carry no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text in the brief is the binding criterion.)
- A never-paying variant is never ranked or recommended on a sentinel year: this surface sorts the corrected figures of T-MS-264 (MS7-32) and T-MS-267 (MS7-50), never a sentinel (S6-1a).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

## Laws (enforced through screens and review, no standalone build)

- **MS11-12** (P0) — The review gates issuance (MS9-06) rather than being advisory-only (`.54/.56/.57/.58` + S8-2a).
  *Enforced by:* the readiness contract of T-MS-311 (the precondition every writer applies) plus MS9's issuance gate (MS9-06) in the customer-document tasks; review checks that no surface treats the verdict as advice. Its acceptance sits inside the line quoted on T-MS-310 and T-MS-311 — "the verdict gates issuance (MS11-12)".

- **MS11-20** (P0) — The conditional-suffix law: any field added to a fingerprint must not change the string when absent, so existing designs never appear stale after an upgrade (`.77`).
  *Enforced by:* T-MS-315 and T-MS-316 — every fingerprint change closes against "Given a new optional field, Then existing designs do not become stale (MS11-20)", with the ported `lib/__tests__/fingerprints.test.ts` as the regression net; review rejects any added field that alters the string for designs that do not carry it.

- **MS11-38** (P0) — Crew access follows R16: the crew has no studio login; the coordinator runs the checklist and attributes work (`.15`, M08 contract).
  *Enforced by:* T-MS-318's ticking and attribution behaviour (MS11-35) — ticks are the coordinator's, with the optional "done by" — and M08's checklist tasks; review checks that no studio surface introduces a crew login.

---

## Disposition index

| Row | Disposition |
|---|---|
| MS10-01 | T-MS-301 |
| MS10-02 | T-MS-301 |
| MS10-03 | T-MS-301 |
| MS10-04 | T-MS-309 |
| MS10-05 | T-MS-305 |
| MS10-06 | T-MS-301 |
| MS10-07 | T-MS-301 |
| MS10-08 | T-MS-301 |
| MS10-09 | T-MS-301 |
| MS10-10 | T-MS-301 |
| MS10-11 | T-MS-301 |
| MS10-12 | T-MS-301 |
| MS10-13 | T-MS-301 |
| MS10-14 | T-MS-301 |
| MS10-15 | T-MS-308 |
| MS10-16 | T-MS-301 |
| MS10-17 | T-MS-301 |
| MS10-18 | T-MS-301 |
| MS10-19 | T-MS-301 |
| MS10-20 | T-MS-301 |
| MS10-21 | T-MS-302 |
| MS10-22 | T-MS-304 |
| MS10-23 | T-MS-302 |
| MS10-24 | T-MS-302 |
| MS10-25 | T-MS-303 |
| MS10-26 | T-MS-303 |
| MS10-27 | T-MS-302 |
| MS10-28 | T-MS-302 |
| MS10-29 | T-MS-304 |
| MS10-30 | T-MS-304 |
| MS10-31 | T-MS-304 |
| MS10-32 | T-MS-306 |
| MS10-33 | T-MS-305 |
| MS10-34 | T-MS-305 |
| MS10-35 | T-MS-301 |
| MS10-36 | T-MS-307 |
| MS10-37 | T-MS-307 |
| MS10-38 | T-MS-308 |
| MS10-39 | T-MS-306 |
| MS10-40 | T-MS-309 |
| MS11-01 | T-MS-310 |
| MS11-02 | T-MS-311 |
| MS11-03 | T-MS-310 |
| MS11-04 | T-MS-310 |
| MS11-05 | T-MS-310 |
| MS11-06 | T-MS-310 |
| MS11-07 | T-MS-310 |
| MS11-08 | T-MS-310 |
| MS11-09 | T-MS-310 |
| MS11-10 | T-MS-311 |
| MS11-11 | T-MS-310 |
| MS11-12 | LAW |
| MS11-13 | T-MS-312 |
| MS11-14 | T-MS-313 |
| MS11-15 | T-MS-314 |
| MS11-16 | T-MS-314 |
| MS11-17 | T-MS-314 |
| MS11-18 | T-MS-315 |
| MS11-19 | T-MS-315 |
| MS11-20 | LAW |
| MS11-21 | T-MS-315 |
| MS11-22 | T-MS-315 |
| MS11-23 | T-MS-316 |
| MS11-24 | T-MS-316 |
| MS11-25 | T-MS-317 |
| MS11-26 | T-MS-317 |
| MS11-27 | T-MS-317 |
| MS11-28 | T-MS-318 |
| MS11-29 | T-MS-318 |
| MS11-30 | T-MS-318 |
| MS11-31 | T-MS-318 |
| MS11-32 | T-MS-318 |
| MS11-33 | T-MS-318 |
| MS11-34 | T-MS-318 |
| MS11-35 | T-MS-318 |
| MS11-36 | T-MS-318 |
| MS11-37 | T-MS-318 |
| MS11-38 | LAW |
| MS12-01 | T-MS-360 |
| MS12-02 | T-MS-361 |
| MS12-03 | T-MS-360 |
| MS12-04 | T-MS-360 |
| MS12-05 | T-MS-360 |
| MS12-06 | T-MS-360 |
| MS12-07 | T-MS-360 |
| MS12-08 | T-MS-360 |
| MS12-09 | T-MS-360 |
| MS12-10 | T-MS-365 |
| MS12-11 | T-MS-363 |
| MS12-12 | T-MS-363 |
| MS12-13 | T-MS-361 |
| MS12-14 | T-MS-363 |
| MS12-15 | T-MS-363 |
| MS12-16 | T-MS-372 |
| MS12-17 | T-MS-364 |
| MS12-18 | T-MS-364 |
| MS12-19 | T-MS-364 |
| MS12-20 | T-MS-365 |
| MS12-21 | T-MS-366 |
| MS12-22 | T-MS-367 |
| MS12-23 | T-MS-368 |
| MS12-24 | T-MS-360 |
| MS12-25 | T-MS-370 |
| MS12-26 | T-MS-369 |
| MS12-27 | T-MS-362 |
| MS12-28 | T-MS-371 |
| MS12-29 | T-MS-374 |
| MS12-30 | T-MS-373 |
| F4-15 | T-MS-367 |
