# SCR-M01-14 · Roles Reference

Read-only render of F2 preset descriptions, matrices and per-preset holder counts.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** an owner consulting what each preset grants before inviting or assigning — settings-suite reading, web-emphasis (dense lists are desktop-first per M01 §2), fully usable on mobile. Read-only: no mutation exists on this screen.

## Entry & exit

Reached from: the PRD groups this screen in the Team / Assign roles / Roles reference / Invite family that renders F2's semantics (M01 §1, §M01.2); a specific entry point is not pinned by the PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. Permission context: the Team family's read view follows the `F2.M01.manage-team` grant in v1 (M01 §M01.2 permissions).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-21** (P0) — **The Roles reference is read-only.** It renders F2's preset descriptions and matrices and shows how many people hold each preset (including zero); there is no create, edit, duplicate or delete of roles anywhere (F2-02, F2-16). The v1 config surface for roles is role **assignment**, never a role editor.

## States

- **Loading** — preset descriptions, matrices and holder counts being fetched.
- **Empty** — not applicable in the ordinary sense (the twelve presets always exist); the nearest real case is a preset with zero holders, covered below. If the designer needs a distinct empty treatment, note the decision.
- **Error** — the reference fails to load; what happened and what to do next.
- **normal** — descriptions, matrices and holder counts rendered read-only; no create, edit, duplicate or delete action exists anywhere (M01-21).
- **zero-holders-shown** — a preset held by nobody still renders, showing zero (M01-21: "including zero").

## Data volume

Design at F2's full preset set: twelve presets, each with a description, its matrix rows, and a holder count (including zero). Team sizes are small-company scale — the counts are small integers.

## Numbers carrying provenance

- **Per-preset holder count** (M01-21, "shows how many people hold each preset (including zero)") — a live count from tenant membership data; carries its F8 provenance tier in the design.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state rendering the teammate list from read-only cache (`F4-08`). It is deleted.*
