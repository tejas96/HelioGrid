# SCR-M01-05 · Business Profile

Single write-point for logo, tax registration, address, bank details; skippable onboarding step and later prompt-point.

**Module:** M01 · **Personas:** EPC Owner · **Context of use:** appears twice in the product's life — as a skippable step during company onboarding (laptop-leaning, mobile-capable — M01 §2) and as the in-context prompt-point fired when the first proposal is about to be sent (M01-24, M01-29 context: "configure in context, not in a settings maze"). Permission: `F2.M01.manage-tenant-settings` (EPC Owner); settings changes are audit events (M01 §M01.3 permissions).

## Entry & exit

Reached from: the onboarding sequence after "What do you sell?" (M01 §M01.3 behavior detail); later, the prompt-point when the first proposal is about to be sent — prompt-points offer *do it now inline* or *keep skipping* (M01 §M01.3 behavior detail); and settings for revisiting ("Settings screens exist for revisiting, not for setup" — M01-29 context). Leads to: on skip during onboarding, the next onboarding step (the skippable invite step, then the two-door landing — M01 §M01.3 behavior detail); on save, back to wherever the prompt fired. Consumers (proposal, agent script, customer link, invoice) read this one profile by reference — they never re-ask (M01-31).

## Requirements (verbatim)

### From `prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-24** (P0) — **The company profile is skippable and prompted in context.** Logo, tax registration, address, bank details are a skippable onboarding step — prompted later, **when the first proposal is about to be sent** (the moment they are actually needed). Tax registrations stay empty until that first proposal; the registration *types* that exist come from the tenant market's `pack.tax` (F1-13).
- **M01-25** (P0) — **Tax-registration entry validates live, explains the format, and allows skip.** A malformed registration is explained against the market's format (from `pack.tax`), never silently rejected and never a hard wall — skip remains available until the send moment forces the prompt again.
- **M01-31** (P0) — **One Business profile screen feeds many places.** Company name, logo, address and tax registration are asked once and used by the proposal, the agent's script, the customer link and the invoice — never asked twice by different surfaces. _(non-UI half, build-side: single write-point for identity facts; proposal, agent, link, invoice consume by reference — for awareness, not for drawing)_

## States

Base: **loading** · **empty** · **error**.

Screen-specific:

- **skipped** — the whole step skipped during onboarding; tax registrations stay empty until the first proposal (M01-24); a tenant with no config at all breaks nothing (M01 §M01.3 context, M01-28 — not a row of this slice).
- **tax-format-invalid-explained** — a malformed registration is explained against the market's format (from `pack.tax`), never silently rejected, never a hard wall; skip stays available (M01-25).
- **prompt-at-first-proposal-send** — the later prompt-point fires when the first proposal is about to be sent, inline, offering do-it-now or keep-skipping (M01-24; M01 §M01.3 acceptance).
- **logo-invalid-limits-stated** — a logo uploaded at the profile step is invalid → validated on upload with the actual limits stated (M01 §M01.3 edge list, the `S6B.wrong.5` pattern).

## Data volume

One company-profile record: one logo, the market's tax-registration types (from `pack.tax` — the set and formats are market-pack data; the module never names one market's tax ID in UI copy, M01 §M01.3 localization notes), one address, one set of bank details.

## Numbers carrying provenance

Every rendered number carries its F8 provenance tier in the design. User-visible values here: the tax registration number (validated live against the pack format — M01-25) and bank details — tenant-entered identity facts consumed by reference everywhere (M01-31). No computed money, quantity or date renders here.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state (tenant-config edits failing fast, never queued) and a matching online-only sentence in Context of use. Both are deleted.*
