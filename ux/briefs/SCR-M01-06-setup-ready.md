# SCR-M01-06 · Setup — You're Ready

Onboarding exit offering exactly two doors: create first lead or open the demo project.

**Module:** M01 · **Personas:** EPC Owner · **Context of use:** the final moment of company onboarding — laptop-leaning but fully mobile-capable (M01 §2). The happy path it closes: sign up → pick what you sell → skip the rest → land on an empty Leads screen that teaches → first lead created in under a minute (M01-26).

## Entry & exit

Reached from: the end of the onboarding sequence, after the skippable invite step (M01 §M01.3 behavior detail: signup fields → M01-23 → skippable M01-24 → skippable invite → "the two-door landing (M01-26)"). Leads to: door one — the empty Leads screen that teaches, with quick-add owned by `prd/modules/M02-crm-and-leads.md` (M01-26); door two — the demo project, a finished, realistic market-pack project pre-loaded through survey, design and proposal, labelled demo everywhere (context: M01 §M01.3 / M01-27, not a row of this slice).

## Requirements (verbatim)

### From `prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-26** (P0) — **"You're ready" offers two doors: create your first lead, or open the demo project.** The happy path holds: sign up → pick what you sell → skip the rest → land on an empty Leads screen that teaches → first lead created in under a minute (quick-add itself is `modules/M02-crm-and-leads.md`'s).

## States

Base: **loading** · **empty** · **error**.

Screen-specific:

- **two-doors** — exactly two doors: create your first lead, or open the demo project (M01-26). Analytics distinguishes which door is taken ("first-lead door vs demo door taken" — M01 §M01.3 analytics).

## Data volume

Two doors. Nothing else — this screen is the exit of a sequence of skippable moments, not a summary of setup.

## Numbers carrying provenance

None — this screen shows no user-visible number, money amount or date.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
