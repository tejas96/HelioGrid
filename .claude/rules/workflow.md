# Rules — the AI operating workflow (every slice, no exceptions)

Binding operating manual for any agent implementing in this repo. The laws and the
governance map live in `docs/17-engineering-governance.md`; this file is the loop you
actually run. Skipping a step is a violation.

## THE FIVE LENSES (owner directive 2026-07-26 — worn on EVERY slice)

Every implementation is executed AND judged through all five, concretely — not as
role-play but as questions that must each have a defensible answer before step 13:

1. **Senior software engineer** — is this the simplest correct extension of what exists?
   Right layer, no duplication, no cleverness, failure modes handled, would a reviewer
   approve this diff without explanation?
2. **UX master** — does it match the mockup pixel-for-pixel and the interaction law
   (states, motion, focus, 375px, Hindi expansion)? Where the mockup is silent or
   inconsistent: compose from the DS vocabulary + log the ruling — never freestyle.
3. **Solar EPC domain expert** — are the DOMAIN semantics right? kWp vs kWh, DC/AC,
   DISCOM/subsidy/GST rules, Indian ₹ grouping, provenance tiers, engineer sign-off,
   field reality (offline sites, sunlight glare, surveyor gloves → big targets). When
   domain doubt exists, check the POC spec (product-journey D-census) — it is law.
4. **Product owner** — does this slice serve the D-decision it traces to? Is scope
   complete-but-minimal (no gold-plating, no dropped acceptance criteria)? Would the
   owner recognise their requirement in the running app?
5. **QA** — actively try to BREAK it before calling it done: empty/error/offline paths,
   double-submit, stale data, cross-tenant probes, absurd inputs (0, negative, 10⁶ kW,
   emoji names, 40-char Hindi labels), realistic volume (200 leads, 40-line BOM).
   A slice that was never attacked was never verified.

The step-10 AI review must explicitly cover all five lenses; a lens with no findings
must say WHY it found nothing.

## The 13-step slice loop

1. **Read requirements** — the module roadmap task (docs/modules/<module>.md), its
   D-decisions (product-journey + docs/15) and mockup files BY NAME (design/mockups/).
2. **Identify affected modules** — and read their per-package CLAUDE.md + landmines.
3. **Locate reusable code FIRST** — component indexes (packages/ui, apps/mobile/src/ui),
   packages/contracts conventions, existing services/ports. Creating what exists is a defect.
4. **Verify architecture** — docs/02/03 + ADRs; anything new-pattern-shaped needs an ADR
   BEFORE code (Law 2).
5. **Verify shared contracts** — the contract diff comes FIRST and is the API review
   surface. tenant_id never travels in bodies; error envelope everywhere.
6. **Verify dependencies** — exact pins only; new deps follow docs/03 pin policy; NO
   ad-hoc dependency picks mid-feature (a dep addition is called out in the commit).
7. **Plan** — small complete slice; schema/API only for THIS module (Law 9); web+RN in
   the same slice (Law 7); wire into existing flows (no orphan screens).
8. **Implement** — extend existing systems; tokens/components only; files ≲450 lines;
   comments only for constraints code can't express.
9. **Automated validation** — `pnpm turbo typecheck lint test build` green, THEN
   run-and-look: browser AND both simulators for UI, curl/logs for api/worker. Green
   gates alone never prove UI work.
10. **AI review** — run an adversarial review (/code-review or equivalent) over the
    slice: architecture, security, duplication, a11y, i18n, error/edge handling, DS
    compliance, dead code. ALL critical findings resolved before proceeding.
11. **Update documentation** — same commit: affected docs, per-package landmines,
    module roadmap task status, docs/13 row if a UX gap was designed in-slice.
12. **Verify Definition of Done** (below), honestly, item by item.
13. **Mark complete** — roadmap status updated; commit message records what was
    VERIFIED (not what was written).

## Definition of Done (per slice)

Requirements traced + implemented · architecture respected (cruiser/boundaries clean) ·
contract updated first · no duplicated types/logic introduced · gates green · verified
running (browser + BOTH simulators for UI; curl/logs otherwise) · screens: 375px + all
four states (loading/empty/error/offline) + keyboard/focus + ≥44px targets + axe clean +
Hindi render + provenance on numbers + light theme · i18n keys in the shared catalog ·
docs + roadmap updated · AI review passed with criticals resolved · web AND RN landed.

## Before starting — stop-and-ask triggers

Uncertainty about a requirement, a conflict between layers (resolve via docs/17 §4 —
if still ambiguous, STOP and ask the owner), anything billable/external-account-shaped,
any schema/API outside the current module (Law 9), any new pattern (Law 2).

## Standing mechanics

- Schema/APIs grow module-wise ONLY (docs/17 Law 9); docs/04 is design, not build order.
- Per-module roadmap is the single task list (docs/modules/); author it before the
  module starts; keep status live.
- Decision hierarchy: docs/17 §4. Docs are load-bearing — reconcile before code.
- Verification evidence beats assertion: screenshots/curl output in the session, honest
  failure reporting, no "done" on partial work.
