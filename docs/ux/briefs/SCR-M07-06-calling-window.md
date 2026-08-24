# SCR-M07-06 · Calling Window

Edit calling days, hours and holiday calendar within the statutory floor.

**Module:** M07 · Sales Execution · **Personas:** EPC Owner only (`F2.M01.configure-agent`) · **Context of use:** web emphasis — a settings task inside agent configuration (M07 §2).

## Entry & exit

Reached from: tenant configuration's agent & voice surface list — M01-57 names "Calling window (days, hours, holiday calendar — narrower than the floor only)"; it is also the guided setup's "when it may call" step (M07-09, SCR-M07-05). Leads to: saves ride agent-config publishing (versioned-append, M07-14 — SCR-M07-08's slice); the same window control is reused by the IVR editor's business-hours switch (M07-47, SCR-M07-16). Any further entry/exit is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-12** (P0) — **The calling-window screen edits days, hours and the holiday calendar strictly within the pack's statutory window** — narrower windows and extra holidays only, never wider (F1-17). The pack supplies the floor and the market holiday calendar (F1-36(b), F1-48); the tenant's timezone governs (F1-10). _(non-UI half, build-side: saves only equal-or-narrower schedules and extra holidays vs statutory window — for awareness, not for drawing)_

## States

- **Loading** (base) — opening with the pack's statutory floor and the tenant's current window.
- **Empty** (base) — no true empty: the pack always supplies the floor and the market holiday calendar; a tenant that never edited sees that seeded window.
- **Error** (base) — save failure acknowledged honestly; edits preserved.
- **within-floor** — the normal editing state: days, hours and holidays adjustable, all equal to or narrower than the statutory window (M07-12).
- **wider-than-floor-refused** — an attempt to widen beyond the pack's statutory window cannot be saved: only equal or narrower schedules and additional holidays can be saved (M07-12; M07 §M07.3 acceptance).
- **holiday-calendar** — the holiday view: the market's pack-supplied holiday calendar plus tenant-added extra holidays; festival-day calls are blocked, not apologised for (M07-31 context; the calendar content is pack data, F1-48).

## Data volume

Seven days with per-day hours, one statutory floor from the pack, and the holiday calendar: the market's pack-supplied holidays plus any tenant-added extras (M07-12). One tenant timezone governs everything shown (F1-10).

## Numbers carrying provenance

- **Window hours and days** — tenant configuration constrained by the pack's statutory floor; the floor itself is pack data (F1-36(b)) and must be shown as the boundary the tenant cannot cross.
- **Holiday dates** — pack-supplied market holidays (data from F1-48) plus tenant-added dates; rendered on the tenant's timezone (F1-10).
- No money figures appear on this screen.
