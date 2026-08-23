# SCR-MS-01 · Design List

Lead's designs/variants side by side with recommendation mark; entry to the studio.

**Module:** MS (Design Studio) · **Personas:** Design Engineer, EPC Owner, Sales Manager, Sales Executive · **Context of use:** lead-scoped and server-backed — opens on any device for any permitted teammate (MS12-10); web primary with full mobile parity (MS12 §2, F7-30); sales personas arrive from the lead on a phone, the designer from either desk or phone. Read access follows per-lead visibility (F2).

## Entry & exit

Reached from: the owning lead (the list is LEAD-SCOPED, MS12-10) via its own named route (MS12-27). Leads to: opening a design enters the studio wizard (SCR-MS-03) — opening resumes at the saved step (MS12-13, PRD context); actions New design / duplicate / open / new variant (M05-78); an incomplete survey blocks design start with the block screen listing exact missing items and owners (M05-21). Note: the studio's "save and exit" returns to the LEAD the design belongs to (MS12-05), not to this list. Comparison entry (variant compare, SCR-MS-14) is not pinned to this screen by the rows in this slice — designer decides the affordance, note the decision.

## Requirements (verbatim)

### From `prd/modules/M05-design-studio.md`

- **M05-21** (P0) — **A design cannot start from nothing and pretends nothing: an incomplete survey blocks design start with the exact missing items and who to ask.** The block screen lists each missing prerequisite by name, its owner (who to ask), and the fastest route to resolve — never a bare "survey incomplete". *(Amended by owner ruling 2026-08-16, register `Q67`: **the prerequisite set is what the release actually offers, not a fixed list.** The V1 scope lock defers all ten `M04` survey screens to V2, so in V1 there is no survey to be complete or incomplete and this row must not gate design start on one — it would make the entire studio unreachable. What the row still binds, unchanged, is the **honesty of the block**: where a prerequisite the release does offer is genuinely missing, the screen names it, names its owner and names the fastest route, never a bare refusal. In V1 that set is the site-type and connection fields the studio collects for itself in Step 1; from V2 it is the submitted survey again. **The accepted consequence, stated plainly:** a V1 design starts from less site data than this module was written to assume, and the studio's own roof drawing carries what the survey would have supplied.)*
- **M05-78** (P0) — **A lead holds several design variants — sibling designs with duplication lineage kept — and the design list shows them side by side:** each with system size, annual generation, price, payback; actions New design / duplicate / open / new variant.

### From `prd/modules/M05-studio/11-shell-and-platform.md`

- **MS12-10** (P0) — Design list is LEAD-SCOPED and server-backed: designs belong to a tenant and a lead, open on any device for any permitted teammate (S11-3b/d) (`.38/.39/.45`). _(non-UI half, build-side: lead-scoped, tenant-owned, server-backed across devices — for awareness, not for drawing)_
- **MS12-11** (P0) — List controls: live counts, status filters, search across name/customer/address, and sort by recency or name (`.38/.40–.42`).
- **MS12-12** (P0) — Design cards: real buttons with keyboard support, satellite thumbnail of the confirmed pin, status chip, capacity/updated stats, and an actions menu (open · duplicate · delete) with correct menu semantics (`.44/.46–.50`).
- **MS12-14** (P0) — Delete asks for confirmation and states accurately what is removed and from where (S11-2.2 fixes `.51`).
- **MS12-15** (P0) — Empty state invites the first design (`.43`); a data-integrity banner surfaces any design that could not be loaded, rather than hiding it (`.34`).
- **MS12-27** (P0) — Routing: named routes for the wizard, design list, share and sign-in, with guards applied after hydration and a hydration gate that shows loading rather than a blank screen (`.102–.106`, MS9-15); legacy dead routes are removed (S11-2.3 fixes `.102/.83`). _(non-UI half, build-side: named routes, post-hydration guards, legacy dead routes removed — for awareness, not for drawing)_

## States

Base: **loading** · **empty** · **error** (designs are server-backed, MS12-10; never a blank screen per MS12-27's hydration gate).

Screen-specific:

- **normal** — variants side by side with system size, annual generation, price, payback per card (M05-78); cards per MS12-12.
- **empty-no-designs** — no designs on this lead; empty state invites the first design (MS12-15).
- **empty-first-design** — the inviting first-design empty state (MS12-15).
- **design-start-blocked-missing-prereqs** — incomplete survey blocks design start; block screen lists each missing prerequisite by name, its owner, and the fastest route to resolve (M05-21).
- **recommended-marked** — the recommended variant carries its recommendation mark (register purpose; the act of setting the recommendation lives on Variant Compare, SCR-MS-14 — this list only displays the mark).
- **read-only** — permitted teammate with read visibility but no edit rights sees the list without mutating actions (per-lead visibility, F2 — exact affordance not pinned by this slice; designer decides, note the decision).
- **hydration-loading** — hydration gate shows loading rather than a blank screen (MS12-27).
- **data-integrity-banner** — a design that could not be loaded is surfaced in a banner, never hidden (MS12-15).
- **delete-confirm** — delete asks for confirmation and states accurately what is removed and from where (MS12-14).
- **filtered-search** — live counts, status filters, search across name/customer/address, sort by recency or name (MS12-11).

## Data volume

Design at a lead holding several sibling variants (M05-78) — cards with satellite thumbnails, status chips and four stats each (MS12-12, M05-78); filters, live counts and search must remain legible at a busy lead (MS12-11). A card may also be an unloadable record surfaced by the data-integrity banner (MS12-15).

## Numbers carrying provenance

Each user-visible number carries its F8 provenance tier in the design: per-variant **system size (kWp)**, **annual generation**, **price**, **payback** (M05-78); per-card **capacity** and **updated** stats (MS12-12); the **live counts** on filters (MS12-11); the delete confirmation's statement of **what is removed and from where** (MS12-14); the block screen's **missing-item list** (M05-21).
