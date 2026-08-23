# SCR-M01-10 · Role Explainer

One plain-language card explaining the assigned role's grants and limits; re-openable from profile.

**Module:** M01 · **Personas:** Invited Employee · **Context of use:** the third step of invited-user first-run — mobile-first, "Phone, almost always" (M01 §2) — and permanently re-openable: every user can always see their own roles explained, the card re-openable from their profile (M01 §M01.2 permissions). Role explanation copy derives from F2's preset definitions so it can never drift from the matrix truth (M01 §M01.2 behavior detail).

## Entry & exit

Reached from: First-Run Profile (SCR-M01-09) in the first-run sequence — "the next screen is name/photo, then the role card, then their role's home" (M01 §M01.2 acceptance); later, from the user's own profile (M01 §M01.2 permissions). Leads to: the role-decided home with real work already in it — onboarding ends on that home, never on a generic dashboard or an unexplained blank (context: M01 §M01.2 / M01-17, not a row of this slice).

## Requirements (verbatim)

### From `prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-15** (P1) — **The role is explained in one card** — plain language, from the F2 preset's vocabulary: what they will see and can do ("You're a Sales Executive. You'll see your leads, your follow-ups, and you can send proposals."), and it **sets expectations about what they cannot do**.

## States

Base: **loading** · **empty** · **error**.

Screen-specific:

- **first-run** — the card in the first-run sequence, between profile capture and the role home (M01 §M01.2 acceptance).
- **reopened-from-profile** — the same card re-opened later from the user's own profile (M01 §M01.2 permissions).

## Data volume

One card. Its copy covers the person's assigned preset role(s) — a person may hold several presets (F2 stacking context), so the card must read well when the assignment spans more than one. Role names and capability phrases are localized per F2's localization notes (M01 §M01.2 localization notes).

## Numbers carrying provenance

None — this screen shows no user-visible number, money amount or date.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
