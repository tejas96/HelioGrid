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

**Decisions made in design (2026-08-31) — later screens inherit them.**

1. **The name is pre-filled, because the inviter already typed it.** `SCR-M01-07` has the inviter
   enter *Their name*, keyed to the invite just accepted. A blank field throws that away and makes a
   person retype what the product knows, on the screen whose promise is under two minutes (`M01-17`).
   One sentence beneath says who wrote it and that it is theirs to change.
2. **The photo is a circle with one act, never a `Dropzone`.** Nothing drags on a phone, `Dropzone`
   is built for many files where this is exactly one, a dashed rectangle promises a rectangle when
   the crop is circular, and its held-on-device queue is wrong for an ordinary server write. The
   camera-or-gallery choice is the platform's own sheet.
3. **The fallback is on screen, which is what makes *optional* honest.** Initials on `--accent-subtle`
   show the exact result of skipping. That is also why **no `Skip` control exists** — the photo has no
   gate to skip past, and a second act would invent a decision nobody has to make.
4. **The act is never gated on the field** (inherited from `SCR-M01-01`). Pressing it with the name
   cleared answers on the field that caused it; a greyed button on arrival offers neither reason nor
   route. The one exception is `loading`, where there is nothing to save yet.
5. **No shell, no step counter, no back control.** The person is two screens short of the
   role-decided home both shell forms are built around. *1 of 2* would misdescribe a corridor the
   product tells you rather than one you perform, and the only honest "back" would be un-joining.
6. **The language control is corridor chrome, not profile capture** — so it does not spend
   `M01-14`'s *that is all* ceiling. It is also **the invitee's whole language step** (owner ruling
   2026-08-31, `Q79`): `SCR-M01-03` is the signing-up owner's first-run screen and an invited
   employee never reaches it, because `F3-03` asks that a picker be REACHABLE at first run, not
   that every user be given a screen for it.

## Data volume

One profile record: one name field, one optional photo. That is all (M01-14).

## Numbers carrying provenance

None — this screen shows no user-visible number, money amount or date.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
