# SCR-M10-04 · Offboard Sweep

Compose the leaver's open work cross-module and drive reassignment before revocation.

**Module:** M10 · HR-lite · **Personas:** EPC Owner (executes), HR/Admin (prepares, read-only) · **Context of use:** a deliberate, sit-down act — "an Owner running an offboard can do it all in one sitting, while an HR/Admin preparing one can only look" (`docs/prd/modules/M10-hr-lite.md` §M10.4 behavior detail).

## Entry & exit

Reached from: wherever the offboard starts — the guard rails are "surfaced wherever the offboard starts" (`M10-21`); the deactivation act itself lives on `modules/M01`'s Team screens (`M01-19` "warns about open work and prompts reassignment", cited by M10-19's source pointer), and HR/Admin can open the sweep read-only to prepare and hand the Owner a prepared offboard (`M10-22`). Beyond that the PRD does not pin a single entry — designer decides, note the decision. Leads to: completion — the person deactivated with sessions ended, every open item reassigned via its owning module or explicitly marked left-unassigned (§M10.4 acceptance); items left unassigned surface in the owning modules' unassigned states (e.g. M02's inbox) rather than vanishing (§M10.4 edge); the leaver's direct reports become unmapped and surface as a people-today item (SCR-M10-01; §M10.4 behavior detail, M10-34's protection).

## Requirements (verbatim)

### From `docs/prd/modules/M10-hr-lite.md`

- **M10-18** (P0) — **Offboarding is exactly two things, done together: access revocation and reassignment of open work.** One flow, run when a person leaves: (a) deactivate — sessions end everywhere within the M01 revocation window, the person leaves assignment pickers, "your access was removed" renders gracefully on their device (`S1.wrong.4` via M01); (b) sweep and reassign their open work (M10-19). Neither half alone is an offboard. **Pointer stated precisely:** the offboard definition is authored in `_process/2026-08-03-v2-prd-authoring-plan.md` §Task 23 Step 1 (owner-approved plan, 2026-08-03) — "offboard = access revocation + reassignment of open work — source wrong-items from S1"; design spec §11 carries M10's scope and does not itself contain this sentence (the pointer convention is Task 22's, traceability §Task 22 convention 8). _(non-UI half, build-side: offboard defined as revocation plus reassignment, done together — for awareness, not for drawing)_
- **M10-19** (P0) — **The open-work sweep lists everything the person still owns, before access ends.** At offboard the product composes, from the owning modules, the person's open work: leads they own (`modules/M02`), survey visits assigned (`modules/M04`), designs awaiting their work or their sign-off (`modules/M05`), projects they manage and checklist duties (`modules/M08`), follow-up tasks and queued agent handoffs (`modules/M07`), open field visits (`modules/M09`) — and prompts reassignment of each through **that module's own assignment act**. This module composes the sweep and owns none of the assignment acts; an item can be deliberately left unassigned, visibly, but never silently dropped. _(non-UI half, build-side: composes open work cross-module; owns no assignment act; nothing silently dropped — for awareness, not for drawing)_
- **M10-21** (P0) — **The guard rails render here too.** An offboard that would remove the last EPC Owner or the last Manage-team holder is blocked with the explanation, and the blocked attempt is audited — F2's transitions (`F2-19`, `F2-22`), surfaced wherever the offboard starts. _(non-UI half, build-side: F2 guard-rail transitions enforced and audited — for awareness, not for drawing)_
- **M10-22** (P0) — **Offboarding is Owner-gated; HR/Admin prepares, the Owner executes.** The deactivation act is `F2.M01.manage-team` (EPC Owner-only, not delegated — F2 §F2.1 §HR/Admin). HR/Admin can open the sweep read-only, see what is open and who could take it, and hand the Owner a prepared offboard; the revocation itself and each reassignment run under the grants of whoever performs them. _(non-UI half, build-side: deactivation act is Owner-only, never delegated — for awareness, not for drawing)_

## States

- **loading** — the sweep composing open work from the owning modules (M02, M04, M05, M07, M08, M09).
- **empty** — a leaver with no open work: nothing to reassign; the offboard is revocation alone, honestly shown as such (M10-18's two halves — the sweep half simply has no rows).
- **error** — the sweep cannot compose; honest failure — nothing may be silently dropped (M10-19), so an incomplete composition must say so.
- **normal** — each row is an open item rendered by its owning module's own summary (a lead card, a visit row, a sign-off queue entry) with that module's reassign affordance inline (§M10.4 behavior detail).
- **read-only-prepare** — HR/Admin opens the sweep read-only, sees what is open and who could take it, with no revocation act available (M10-22, §M10.4 acceptance).
- **reassign-inline** — reassignment through each owning module's own assignment act, under the grants of whoever performs it; the timeline of each reassigned item records why ("reassigned at offboarding of {name}") (M10-19, §M10.4 behavior detail).
- **leave-unassigned-explicit** — the Owner must mark remaining items "leave unassigned"; those items surface in the owning modules' unassigned states rather than vanishing (§M10.4 edge, M10-19).
- **blocked-last-owner** — an offboard that would remove the last EPC Owner or the last Manage-team holder is blocked with the explanation, and the blocked attempt is audited (M10-21).
- **sign-off-gap-warning** — the leaver is the last sign-off holder: the sweep shows the sign-off queue emptying to nobody so the Owner sees the gap before confirming (§M10.4 edge, M10-21).

## Data volume

The sweep composes open work across six modules: leads owned (M02), survey visits assigned (M04), designs awaiting work or sign-off (M05), projects managed and checklist duties (M08), follow-up tasks and queued agent handoffs (M07), open field visits (M09) (M10-19). A leaving sales rep can own a substantial lead book — lead lists elsewhere in the suite are designed at 200 — so design the sweep to stay workable at dozens of rows grouped by owning module, each row with its inline reassign affordance, while the common SME case is a handful of items.

## Numbers carrying provenance

Every user-visible number/date carries its F8 provenance tier in the design:

- Open-item counts per owning module (the composition, M10-19).
- Each row's facts are rendered by the owning module's own summary (a lead card, a visit row, a sign-off queue entry) — any figure on them carries that module's provenance, not this screen's (§M10.4 behavior detail).
- Reassignment attribution recorded on each item's timeline ("reassigned at offboarding of {name}") (§M10.4 behavior detail).
- The M01 revocation window governs when sessions end (M10-18) — a fact of the flow, stated honestly, never a promise of instant revocation.
