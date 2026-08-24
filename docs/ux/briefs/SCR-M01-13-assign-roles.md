# SCR-M01-13 · Assign Roles

Stack F2 presets per person with a live plain-English grant line.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** an owner administering the team — the settings suite is web-emphasis (dense-list administration is desktop-first per M01 §2), with one-tap acts first-class on mobile.

## Entry & exit

Reached from: the PRD groups this screen in the Team / Assign roles / Roles reference / Invite family that renders F2's semantics (M01 §1, §M01.2), and M01-20 assigns presets "to a person" — the per-person entry from the Team screen (SCR-M01-12) is the natural path but is not explicitly pinned by the PRD — designer decides, note the decision. Leads to: back to Team (SCR-M01-12); all role changes write old → new audit entries (M01 §M01.2 behavior detail, F2-22). Permission: requires `F2.M01.manage-team` (EPC Owner-only; M01 §M01.2 permissions).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-20** (P0) — **Assign roles shows a live plain-English grant line.** Assigning presets to a person renders, live, what the combination means — "Rajesh can sell, survey and design" — composed from localized capability phrases (F2 §F2.2). Stacking is the design; there is no other way to widen access (F2-10, F2-15).

## States

- **Loading** — the person's current presets and the preset list are being fetched.
- **Empty** — the person holds no presets yet; the grant line reflects the empty combination honestly.
- **Error** — an assignment save fails; what happened and what to do next, per F7's contract.
- **grant-line-updating-live** — as presets are toggled on/off, the plain-English grant line updates live to describe exactly the resulting grants (M01-20 acceptance).

## Data volume

Design at F2's full preset set: twelve presets available to stack per person (M01 §M01.2, F2-01), any combination of which may already be held. One person per assignment surface.

## Numbers carrying provenance

None — this screen shows no user-visible money, dates or computed numbers. The grant line is text composed from localized capability phrases (M01-20).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a Context-of-use sentence stating the online-only/fail-fast boundary (`F4-09`). Both are deleted.*
