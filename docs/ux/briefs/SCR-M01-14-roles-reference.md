# SCR-M01-14 · Roles Reference

Read-only render of F2 preset descriptions, matrices and per-preset holder counts.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** an owner consulting what each preset grants before inviting or assigning — settings-suite reading, web-emphasis (dense lists are desktop-first per M01 §2), fully usable on mobile. Read-only: no mutation exists on this screen.

## Entry & exit

Reached from: three places, each by the same act, **What each role can do** — the assign sheet on SCR-M01-13, the role picker on SCR-M01-07, and the Team header on SCR-M01-12. Leads to: back to the screen that opened it, with that screen's state kept (on SCR-M01-13, the ticks not yet saved stay as they were). The back control names the caller (*Back to assign roles*); at 1536 a breadcrumb shows the path. Permission context: the Team family's read view follows the `F2.M01.manage-team` grant in v1 (M01 §M01.2 permissions).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-21** (P0) — **The Roles reference is read-only.** It renders F2's preset descriptions and matrices and shows how many people hold each preset (including zero); there is no create, edit, duplicate or delete of roles anywhere (F2-02, F2-16). The v1 config surface for roles is role **assignment**, never a role editor.

## States

- **Loading** — only the holder counts load. The presets, their descriptions and the matrix are static (`ROLE_PRESETS` in `packages/domain/src/authz/roles.ts`, `CAPABILITY_MATRIX` in `packages/domain/src/authz/capabilities.ts`, names and descriptions in `packages/i18n`), so all twelve rows draw at once, with a loading form only where each count goes.
- **Empty** — not applicable in the ordinary sense (the twelve presets always exist); the nearest real case is a preset with zero holders, covered below. If the designer needs a distinct empty treatment, note the decision.
- **counts-unavailable** — the error state. The holder counts fail to load: one banner says so, and each count's place shows a named gap. The presets, descriptions and matrix still render. There is no full-page error.
- **normal** — descriptions, matrices and holder counts rendered read-only; no create, edit, duplicate or delete action exists anywhere (M01-21).
- **zero-holders-shown** — a preset held by nobody still renders, showing zero (M01-21: "including zero").

Drawn at 375 only (at 1536 the phone's answer holds at width): `zero-holders-shown` (the 1536 `normal` frame already shows its zero rows), `counts-unavailable` (the gap moves to the count column, the banner above the table).

- In **counts-unavailable** the banner carries a retry, a gap carries no tier, and the sentence saying what a count counts is removed.

**Decisions made in design (2026-08-31) — later screens inherit them.**

1. **Read-only means no act anywhere.** No create, edit, duplicate or delete on any frame — `M01-21`
   makes the v1 config surface for roles **assignment**, never a role editor (`F2-02`, `F2-16`).
2. **`empty` has no honest subject** — the twelve presets always exist. The nearest real case is a
   preset with **zero holders**, which renders as zero rather than as an absence (`M01-21`: *"including
   zero"*).
3. **The holder count is a live count from membership, so it carries a tier** — `measured`, counted
   from the tenant's own records, with the count named beside it.
4. **The twelve presets are `F2-01`'s, verbatim and in `F2`'s order.** This screen's whole job is
   rendering `F2`'s preset set, so the names are the requirement rather than sample data.

**The page.** A page with the shell around it, never a sheet: nothing here is edited, and it opens over
SCR-M01-13's unsaved ticks. One sentence at the top says the presets are fixed and that roles are
assigned on a person's row — plain text, not a `ComplianceFloor`, since no law fixes them. At 375 each
row shows the preset's name, description and count, and its matrix opens on tap, one preset at a time.
At 1536 nothing opens or closes: a captioned preset table (name, description, held by, count) above a
captioned matrix with capabilities down and all twelve presets across — never a master–detail pane.

- The matrix draws withheld rows too. A grant is a word, with F2's scope phrase where the cell has one;
  a withheld cell is a hollow ring with *Not granted* — beside it at 375, and at 1536 in a legend above
  the grid and a visually hidden label in each cell.
- **The holder count counts active members only**, and the sentence above the list says so. An invited
  or deactivated person is named in words inside the preset they would hold, never counted.
- Zero reads `0 people`, with the same tier as any count, on a row at full strength — never dimmed. At
  1536 its *Held by* cell reads *Nobody holds this yet*.

## Data volume

Design at F2's full preset set: twelve presets, each with a description, its matrix rows, and a holder count (including zero). Team sizes are small-company scale — the counts are small integers.

## Numbers carrying provenance

- **Per-preset holder count** (M01-21, "shows how many people hold each preset (including zero)") — a live count from tenant membership data; carries its F8 provenance tier in the design.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state rendering the teammate list from read-only cache (`F4-08`). It is deleted.*
