# SCR-M01-23 · Locale Defaults

Tenant default language and working calendar (pack holidays plus tenant additions).

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** owner-only settings work, web-emphasis at a desk (M01 §2), fully mobile-capable. Permission: `F2.M01.manage-tenant-settings` (EPC Owner; M01 §M01.10 permissions).

## Entry & exit

Reached from: the tenant-config settings surface map — *Locale defaults* is a named surface in M01 §4's stable vocabulary; a deeper entry path is not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. Consumers: the default language governs customer-facing document defaults and the new-invite default; holiday additions surface wherever scheduling reads the calendar — M07's calling window, M02's snooze wake-ups — consumers, not owners (M01-59; §M01.10 behavior detail).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-59** (P1) — **Locale defaults are tenant settings: the tenant's default language and the working calendar.** The default language governs customer-facing document defaults and new-invite default only — UI language is always per-user (F3-02, never overridden here). The calendar is the pack's holiday calendar (F1-21/F1-48) plus tenant-added holidays; tenant additions can only *narrow* calling availability, never widen past the floor (F1-17). The tenant timezone is tenant data (F1-10). _(non-UI half, build-side: holiday additions only narrow calling availability; per-user UI language never overridden — for awareness, not for drawing)_

## States

- **Loading** — current defaults and the pack calendar loading.
- **Empty** — never truly empty: the pack's holiday calendar and a working default language exist from day one (M01-28's zero-config law); the empty dimension is "no tenant-added holidays yet".
- **Error** — a save fails; what happened and what to do next.
- **normal** — tenant default language and the working calendar rendered: pack holidays plus tenant additions (M01-59); per-user UI language is never overridden here (M01-59).
- **tenant-holiday-added** — a tenant-added holiday in the calendar; additions can only narrow calling availability, never widen past the floor (M01-59); a holiday added mid-campaign is re-read by scheduling consumers while queued work respects its queued rules (§M01.10 edge cases).

## Data volume

One default-language selection plus a year-scale working calendar: the market pack's holiday calendar entries (F1-21/F1-48) with tenant-added holidays layered on. List scale is a calendar year of holidays — dozens of dated entries, not hundreds.

## Numbers carrying provenance

- **Holiday dates** — pack calendar data plus tenant-added entries (M01-59); each date's origin (pack vs tenant-added) is exactly the kind of fact the F8 provenance tier carries in the design.
- Holiday names from the pack calendar render per pack labels (§M01.10 localization notes).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted. The holiday calendar's scheduling queue is a work queue, not a sync queue, and is untouched.*
