# SCR-M01-10 · Role Explainer

One plain-language card explaining the assigned role's grants and limits; re-openable from profile.

**Module:** M01 · **Personas:** Invited Employee · **Context of use:** the third step of invited-user first-run — mobile-first, "Phone, almost always" (M01 §2) — and permanently re-openable: every user can always see their own roles explained, the card re-openable from their profile (M01 §M01.2 permissions). Role explanation copy derives from F2's preset definitions so it can never drift from the matrix truth (M01 §M01.2 behavior detail).

## Entry & exit

Reached from: First-Run Profile (SCR-M01-09) in the first-run sequence — "the next screen is name/photo, then the role card, then their role's home" (M01 §M01.2 acceptance); later, from the user's own profile (M01 §M01.2 permissions). Leads to: the role-decided home with real work already in it — onboarding ends on that home, never on a generic dashboard or an unexplained blank (context: M01 §M01.2 / M01-17, not a row of this slice).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-15** (P1) — **The role is explained in one card** — plain language, from the F2 preset's vocabulary: what they will see and can do ("You're a Sales Executive. You'll see your leads, your follow-ups, and you can send proposals."), and it **sets expectations about what they cannot do**.

## States

Base: **loading** · **empty** · **error**.

Screen-specific:

- **first-run** — the card in the first-run sequence, between profile capture and the role home (M01 §M01.2 acceptance).
- **reopened-from-profile** — the same card re-opened later from the user's own profile (M01 §M01.2 permissions).

**Decisions made in design (2026-08-31) — later screens inherit them.**

1. **The card is self-contained, because it has two lives.** The brief says *the same card* re-opens
   from the person's profile, so everything the explanation needs sits INSIDE it — the preset's
   name, who assigned it, both halves of what it carries — and nothing load-bearing lives in the
   first-run chrome around it.
2. **The act names the destination, not the step.** *Go to my leads*, never *Continue*: the home is
   decided by the role, and a person told where they are going does not have to read the arc bar to
   find out.
3. **The second life is a sheet, not a page** (`F7-21`). Re-opening the card from profile is seeing
   something in context without navigating away from it; the card inside the sheet is byte-for-byte
   this one, which is what decision 1 buys.
4. **Stacked presets take the UNION of grants and the complement of that union as limits** — never
   one list per preset. A limit one preset carries and another lifts is not a limit, and printing
   both would tell a surveyor-and-rep they cannot do what they can.
5. **The corridor ends with no confirmation.** No toast, no "you're all set" — `SCR-M01-06` spends
   that beat on the owner's path, and the honest end of an explainer is the work itself.
6. **The re-open route is Profile & preferences** — the same destination `SCR-M01-09` promises for
   the name and photo, so first run makes one promise about where its results live, not two.

**THE PRESET IS NAMED `Sales Executive`.** `M01-15`'s example sentence quotes prototype vocabulary;
`F2`'s preset table is canon — row 3 is **Sales Executive**, with `Sales rep` recorded as its *v1*
name — and `F2-01` names the twelve verbatim while `F2-02` forbids renaming them. The drawn board
uses `Sales rep` throughout and is wrong on the one word the card exists to explain.

## Data volume

One card. Its copy covers the person's assigned preset role(s) — a person may hold several presets (F2 stacking context), so the card must read well when the assignment spans more than one. Role names and capability phrases are localized per F2's localization notes (M01 §M01.2 localization notes).

## Numbers carrying provenance

None — this screen shows no user-visible number, money amount or date.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
