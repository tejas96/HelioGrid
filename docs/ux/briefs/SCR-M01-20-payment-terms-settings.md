# SCR-M01-20 · Payment Terms Settings

Named tranche templates (label + percentage per canonical stage) with a tenant default and live customer preview.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** owner-only, money-adjacent settings work, web-emphasis at a desk (M01 §2), fully mobile-capable. Permission: `F2.M01.manage-tenant-settings` (EPC Owner); tranche-template edits are audit events — money-adjacent settings (M01 §M01.7 permissions, F2-22).

## Entry & exit

Reached from: the tenant-config settings surface map — *Payment terms* is a named surface in M01 §4's stable vocabulary; a deeper entry path is not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. What the screen feeds: the builder's payment-terms step default, Quick mode, and — at Won — the project's collection schedule (§M01.7 behavior detail; M11's one-money-path contract). The template editor is the same control the builder's payment step uses — one pattern (§M01.7 behavior detail).

Entry and exit, decided: one entry — More · Settings · Payment terms, the back control named *Back to settings*; no entry from the onboarding corridor (the seeded templates already let a tenant sell). Out: back to Settings only — every value here is written here, so no onward row, and no link to the builder or to Proposal templates. What the screen feeds is shown as the previewed band and said in the page's closing line.

**Decisions made in design (2026-09-02) — later screens inherit them.**

1. **The stage a tranche falls due on is `M08-08`'s canonical chain, not this screen's.** Nine
   market-neutral values — `WON → MATERIAL_ORDERED → DISPATCHED → INSTALLATION →
   ELECTRICAL_METERING → UTILITY_INSPECTION → COMMISSIONED → INCENTIVE_CLAIMED → HANDED_OVER`,
   plus `CANCELLED`. The five-state shorthand is deprecated and appears nowhere. Display labels are
   the pack's (`F1-22`); `F1-51` fixes two of them — *DISCOM inspection*, *Subsidy claimed*. The
   other seven take neutral labels, and every stage's *when* sentence is `packages/i18n` copy keyed to
   the canonical stage, built at `T-M01-020`; a sentence names no scheme — a scheme's name comes from
   the pack (owner ruling 2026-10-16).
2. **A split that must total exactly 100% is an `AllocationMeter`.** Never `ProgressBar` or
   `UsageMeter`. `met` is **exact**: lines are two-decimal percentages and must sum to 100.00
   (`M01-54`) — three equal tranches are 33.33 / 33.33 / 33.34, and 33.33 × 3 shows its 0.01
   remainder and stays unsaveable. One domain rule serves the meter and the save; read the
   component's verdict, do not compute a second one beside it. **Over-allocation is `warning`, never `danger`** — the
   tenant is mid-edit and the block belongs to the act, not to the meter.
3. **The preview's money comes from a stated sample contract value** — basis `assumed`, per-tranche
   amounts `derived`, both tiers persistent. A customer sees money, so percentages alone fail the
   requirement; and the tenant's latest proposal would make a settings preview move because someone
   priced a job.
4. **Seeded means given, not locked.** The platform seeds two templates at tenant creation — a copy
   taken once, not a live upstream — so they are edited in place, and offering a "restore the
   platform split" would imply an upstream that does not exist.
5. **Archived templates are reached by a scope chip**, absent from the list otherwise — the shape
   `SCR-M01-15` already set for archived catalog items, so the two settings screens agree.
6. **Two tranches may fall due on one stage, and a later stage may carry a bigger share.** `M01-54`
   forbids neither (owner ruling 2026-10-16).
7. **A template row and a stage row are `ListRow`s** (title, `Badge` marks, the split as subtitle, a
   trailing chevron), never a restyled `Button`; the build makes a pressable `ListRow` keyboard-operable
   (`D238`, owner ruling 2026-10-16).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-54** (P0) — **Named tranche templates.** A tenant manages named payment-term templates — each a list of tranches (label + percentage) whose percentages sum to **exactly 100.00**, each tranche tied to the canonical project stage it falls due on (market-neutral stage names; display labels per the pack, F1-22). The platform seeds two standard templates at tenant creation (the source's 10/60/20/10 and 30/60/10 splits) and one template is the tenant default. Editing a template never changes documents already generated from it (F8-15). _(non-UI half, build-side: percentages must sum exactly 100.00; two seeded standard templates; edits never touch generated documents — for awareness, not for drawing)_

## States

- **Loading** — templates loading.
- **Empty** — never truly empty: the two seeded standard templates exist from tenant creation with one marked default (M01-54 acceptance: "Given a new tenant, when settings are first opened, then the two seeded templates exist and one is marked default"). Treat the seeded state as the floor. Drawn once with `seeded-defaults`: a teaching `Banner` (not an `EmptyState`) above the two seeded rows; the archived scope chip shows 0 and stays.
- **Error** — a save fails; what happened and what to do next. The banner sits above the act that failed with no *Try again* — Save is the retry — and says nothing typed is lost and customers keep getting the terms already in force.
- **seeded-defaults** — the two platform-seeded standard templates (the source's 10/60/20/10 and 30/60/10 splits), one marked tenant default (M01-54). Each row's subtitle is its split (*4 tranches · 10% / 60% / 20% / 10%*); a seeded row carries a *Platform standard* badge, information only. *Default* is a `Badge` and *Archived* a `StatusChip`, neither tappable — the row is the control. The default moves only from the template's editor (*Use for new proposals*); on the default template's own editor that control is replaced by the fact in words, and *Archive* is absent: the default moves to another template before it can be archived (`M01-54` keeps one default).
- **sum-not-100-blocked-remainder-shown** — the 100.00 rule validates in the editor with the remainder shown ("12% unallocated" — §M01.7 behavior detail); save is blocked with the unallocated remainder stated (M01-54 acceptance). Under 100 reads neutral; over 100 is drawn past the target, never clamped. On the phone the meter sits in the editor's sticky footer above Save; at 1536 it sits under the tranches it sums. Save stays focusable (`aria-disabled`) with the refusal under it — *Allocate the remaining 12% to save these terms.* / *Take 18% off the tranches to save these terms.*
- **live-customer-preview** — a live preview shows the tranches as the customer will see them (§M01.7 behavior detail; M01-30's law). On the phone the editor carries no preview of its own: the preview opens as a reader chained from the editor, showing the unsaved change, and *not saved yet* is said in words. The band is the tranche schedule only; each tranche's *when* is its stage's own sentence, not a field the tenant writes.
- **skippable-stage-warning** — a stage a tranche is due on is skippable in this market: the editor warns and M11's due-derivation rules govern (§M01.7 edge cases); the editor only offers real stages for the tenant's market (§M01.7 behavior detail). A caveat, not a refusal: a tinted warning badge on the binding and on the picker row, the rule in words beside it; the stage stays choosable and Save stays live.
- **archived-template** — templates archive, never delete; generated documents carry their own snapshot (F8-15) and never point back live (§M01.7 edge cases). Archived rows carry *Restore*. Archiving asks first in a centred `Modal` — not the destructive variant — saying it can be restored any time and nothing is deleted. Removing a tranche asks nothing: it lands only on save.

Drawn at 375 only (at 1536 the phone's answer holds at width): `Loading`, `Empty` / `seeded-defaults`, `Error`, `skippable-stage-warning`, `archived-template`, the archive confirm.

A tranche's stage is picked in a chained sheet (a side panel at 1536), not `Select` or `Menu`: radio rows of the nine chain stages, the pack's label over the canonical name, the description outside the label; `CANCELLED` is never offered. No reorder control: tranches list in the order of their stages. At 1536 the set (each row with its schedule inline) stands beside the schedule at print size, so no *Open full size*; the editor and the stage picker open as non-modal side panels side by side, the set giving way first.

## Data volume

A small named set: the two seeded templates plus tenant-created ones, each a list of a few tranches (the seeded splits are four tranches — 10/60/20/10 — and three tranches — 30/60/10), each tranche bound to a canonical project stage from the market's real stage set (M01-54; F1-22 pack labels).

## Numbers carrying provenance

Each carries its F8 provenance tier in the design:

- **Tranche percentages** — tenant-authored config values that must sum to exactly 100.00 (M01-54). No tier: a value the company sets in its own settings (`F8-01`, owner ruling 2026-10-16).
- **The unallocated remainder** shown when the sum is not 100.00 — editor-computed (§M01.7 behavior detail); `derived`, a line beside the meter.
- **The customer-preview tranche figures** — the live preview of the tranches as the customer will see them (§M01.7 behavior detail); percentages and money render per F3 (§M01.7 localization notes).

---


*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*
