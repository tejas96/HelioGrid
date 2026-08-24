# SCR-M01-09 · First-Run Profile

Minimal profile capture: name and optional photo.

**Module:** M01 · **Personas:** Invited Employee · **Context of use:** the second step of invited-user first-run — mobile-first, "Phone, almost always" (M01 §2). Part of the under-two-minutes path from invite tap to useful role home (M01 §M01.2 context, M01-17).

## Entry & exit

Reached from: Invite Landing (SCR-M01-08) after OTP verification — "the next screen is name/photo, then the role card, then their role's home with their real assigned work" (M01 §M01.2 acceptance). Leads to: the Role Explainer (SCR-M01-10).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-14** (P0) — **Profile capture is minimal: name, photo (optional). That is all.**

## States

Base: **loading** · **empty** · **error**.

Screen-specific:

- **normal** — name plus optional photo; nothing else (M01-14).
- **photo-skipped** — the photo is optional; skipping it proceeds (M01-14).

## Data volume

One profile record: one name field, one optional photo. That is all (M01-14).

## Numbers carrying provenance

None — this screen shows no user-visible number, money amount or date.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
