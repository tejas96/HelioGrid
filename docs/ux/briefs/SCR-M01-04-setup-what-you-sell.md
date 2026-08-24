# SCR-M01-04 · Setup — What You Sell

One step: Residential / C&I / both plus typical system size to seed defaults.

**Module:** M01 · **Personas:** EPC Owner · **Context of use:** part of company onboarding — laptop-leaning but fully mobile-capable (M01 §2); the whole setup philosophy is minimum-first: ask for the minimum to produce one real proposal (M01 §1, `S0.rule.minimum-first`). Two questions, nothing more (M01 §M01.3 behavior detail).

## Entry & exit

Reached from: directly after signup's three fields — "after M01-01's three fields, the only further onboarding steps are M01-23 (two questions), the skippable M01-24, the skippable invite step (M01-12), and the two-door landing (M01-26)" (M01 §M01.3 behavior detail). Leads to: the skippable Business Profile step (SCR-M01-05) in that sequence.

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-23** (P0) — **"What do you sell?" seeds defaults.** One step: Residential / C&I / both, and typical system size — used to seed sensible defaults so the first proposal is close. Stored as the tenant's segment + typical-kW declarations.

## States

Base: **loading** · **empty** · **error** (empty/error states carry F7's teaching-empty-state contract — M01 behavior detail).

Screen-specific:

- **normal** — the one step: segment choice (Residential / C&I / both) plus typical system size (M01-23).

## Data volume

Two inputs: one three-way segment choice and one typical-system-size value (kW). This is the entire screen — onboarding steps are skippable moments, not a wizard that must complete (M01 §M01.3 behavior detail).

## Numbers carrying provenance

Every rendered number carries its F8 provenance tier in the design. The typical system size (kW) is the tenant's own declaration, stored as the tenant's segment + typical-kW declarations (M01-23); the kW unit is never translated (M01 §M01.4 localization notes context). No money or date renders here.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
