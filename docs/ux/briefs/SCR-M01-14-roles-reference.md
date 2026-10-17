# SCR-M01-14 · Roles Reference

Read-only render of F2 preset descriptions, matrices and per-preset holder counts.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** an owner consulting what each preset grants before inviting or assigning — settings-suite reading, web-emphasis (dense lists are desktop-first per M01 §2), fully usable on mobile. Read-only: no mutation exists on this screen.

## Entry & exit

Reached from: two places — the round *Roles reference* info button beside *Presets* on the assign sheet (SCR-M01-13), and the *Roles reference* row of the settings list (`SCR-SHELL-01`). No screen carries a *What each role can do* link (owner ruling 2026-10-17, M01 design). Leads to: back to the screen that opened it, with that screen's state kept (on SCR-M01-13, the ticks not yet saved stay as they were). The back control names the caller (*Back to assign roles*, or *Back to settings*). At 1536 the settings side list stays either way, its *Roles reference* row current; opened from SCR-M01-13, a round *Back to assign roles* sits before the title and returns there with the unsaved ticks kept. Permission context: the Team family's read view follows the `F2.M01.manage-team` grant in v1 (M01 §M01.2 permissions).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-21** (P0) — **The Roles reference is read-only.** It renders F2's preset descriptions and matrices and shows how many people hold each preset (including zero); there is no create, edit, duplicate or delete of roles anywhere (F2-02, F2-16). The v1 config surface for roles is role **assignment**, never a role editor.

## States

- **Loading** — only the holder counts load. The presets, their descriptions and the matrix are static (`ROLE_PRESETS` in `packages/domain/src/authz/roles.ts`, `CAPABILITY_MATRIX` in `packages/domain/src/authz/capabilities.ts`, names and descriptions in `packages/i18n`), so all twelve tiles draw at once in their grid, with a bar in each count's place.
- **Empty** — not applicable in the ordinary sense (the twelve presets always exist); the nearest real case is a preset with zero holders, covered below. If the designer needs a distinct empty treatment, note the decision.
- **counts-unavailable** — the error state. The holder counts fail to load: one banner says so, and each count's place shows a named gap. The presets, descriptions and matrix still render. There is no full-page error.
- **normal** — descriptions, matrices and holder counts rendered read-only; no create, edit, duplicate or delete action exists anywhere (M01-21).
- **zero-holders-shown** — a preset held by nobody still renders, showing zero (M01-21: "including zero").

Drawn at 375 only (at 1536 the phone's answer holds at width): `zero-holders-shown` (the 1536 `normal` frame already shows its zero tiles), `counts-unavailable`.

- In **counts-unavailable** the banner carries a retry and each tile reads *Count unavailable*.

**Decisions made in design (2026-08-31) — later screens inherit them.**

1. **Read-only means no act anywhere.** No create, edit, duplicate or delete on any frame — `M01-21`
   makes the v1 config surface for roles **assignment**, never a role editor (`F2-02`, `F2-16`).
2. **`empty` has no honest subject** — the twelve presets always exist. The nearest real case is a
   preset with **zero holders**, which renders as zero rather than as an absence (`M01-21`: *"including
   zero"*).
3. **The holder count carries no tier.** It is a count, and outside money and energy a number
   carries none (`F8-01`; owner ruling 2026-10-17, M01 design).
4. **The twelve presets are `F2-01`'s, verbatim and in `F2`'s order.** This screen's whole job is
   rendering `F2`'s preset set, so the names are the requirement rather than sample data.

**The page.** A page with the shell around it, never a sheet: nothing here is edited, and it opens over
SCR-M01-13's unsaved ticks. The lede reads *Twelve fixed roles. Tap one to see what it can do.* on the
phone and *Twelve fixed roles. Choose one to see what it can do.* at 1536. Its ask, *About roles*, holds two pages: the first says roles cannot be
created, renamed or deleted, and that a role is given from the person's row in Team; the second says
the counts include active members only. The twelve presets are tiles at both widths — each with its
glyph, its name and its count — and a tile opens that preset's details, headed by its one-line
description: a
sheet at 375, a side panel at 1536.

- Each preset's glyph is a new fact, homed in `packages/ui` beside `SETTINGS_ROW_GLYPH` — among them
  *building* for Field Technician, *package* for Installation Team Member, *pair* for HR/Admin and
  *megaphone* for Marketing. The twelve one-line descriptions are new `packages/i18n` copy, from
  `F2` §F2.1.
- The details name who holds the preset — an `AvatarGroup` and their names, or *Nobody holds this
  yet* — and show an invited or deactivated person as a status chip and their name, never counted
  (the count is active members only). A *Show* control switches between *Can do · N* and
  *Can't · N*, opening on *Can do*. Each row is a tick or a dash and F2's phrase, verbatim; a scoped grant adds
  *· <scope>* after it, the person's part of the phrase only: a PRD rule id in a cell ("F2-07 attribution",
  "surface obeys F2-06") stays in `CAPABILITY_MATRIX`'s source, never on screen (owner ruling
  2026-10-16; `D247`).
- Zero reads `0 people` on a tile at full strength — never dimmed.

## Data volume

Design at F2's full preset set: twelve presets, each with a description, its matrix rows, and a holder count (including zero). Team sizes are small-company scale — the counts are small integers.

## Numbers carrying provenance

- **Per-preset holder count** (M01-21, "shows how many people hold each preset (including zero)") — a live count from tenant membership data; a count carries no tier (`F8-01`).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state rendering the teammate list from read-only cache (`F4-08`). It is deleted.*
