# SCR-M01-08 · Invite Landing

Personal invite acceptance naming inviter and company; one-step OTP accept.

**Module:** M01 · **Personas:** Invited Employee · **Context of use:** the invited person's first contact with the product — mobile-first; their device is "Phone, almost always" (M01 §2). The landing works on both platforms and web (M01 §M01.2 behavior detail). Held to the same under-a-minute bar as signup: an invited person is useful within two minutes without reading anything (M01 §M01.2 context, M01-17).

## Entry & exit

Reached from: the invite message on the invitee's phone — platform-sent, on the platform's own rail (M01 §M01.2 behavior detail). Leads to: on OTP verification, user + membership + roles exist atomically and the next screen is name/photo (First-Run Profile, SCR-M01-09), then the role card (SCR-M01-10), then their role's home with their real assigned work (M01 §M01.2 acceptance). Reached specifically from the platform message created by the send on `SCR-M01-07`, where it is a pending invite on Team — one link, one landing, both platforms. Declining voids the invite and notifies the EPC Owner; an expired invite offers a one-tap re-request that notifies the inviter (M01 §M01.2 edge list).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-13** (P0) — **The invite lands personally and accepting is one step.** The invite landing names the inviter and the company (source example: "Rajesh invited you to HelioGrid — Suryodaya Solar"), with the phone pre-filled; OTP is 6 digits, auto-read where the platform allows; verification **atomically** creates the user and attaches tenant membership + roles — there is no half-joined state. _(non-UI half, build-side: OTP verification atomically creates user plus tenant membership plus roles; no half-joined state — for awareness, not for drawing)_

## States

Base: **loading** · **empty** · **error**.

- **loading** — the inviter row, the heading and the invite card load at their real heights, under the wordmark and the language control; no act renders until the invite arrives.
- **empty** — the link has no invite behind it (used, or taken back): nobody is named, and the way on is *Sign in to HelioGrid*. Its note, centred, reads *Not joined yet? Ask whoever invited you for a new invite.*
- **error** comes in two forms. `load-error` — the invite did not load: nothing about it is known, so nobody is named and the one act is *Try again*. `join-error` — joining failed after a right code: the invite stays on screen, with the error above the code.

Screen-specific:

- **normal** — the landing names the inviter and the company, phone pre-filled, 6-digit OTP (M01-13).
- **otp-auto-read** — OTP auto-read where the platform allows (M01-13).
- **wrong-code** — a wrong code shows as the code field's own error; nothing else on the landing changes.
- **expired-one-tap-re-request** — invite expired → "Ask {inviter} to invite you again", with a one-tap request that notifies the inviter; nothing dead-ends (M01 §M01.2 edge list, `S1.wrong.1`). It shows no sent date and no expiry date: the landing contract returns neither (`invitationLandingSchema`, `packages/contracts/src/invitation.ts:60`). The warning banner says an invite lasts 7 days and this one has run out (`M01-12`; `packages/domain/src/auth/invitation-policy.ts:20`). The state's one line sits under its action, centred. Asking has its own after-state, `reinvite-requested`: it says the inviter has been asked, offers no code (the old link stays dead) and leads to *Sign in to HelioGrid*.
- **declined-notifies-owner** — wrong person got the invite → decline action on the landing; declining notifies the EPC Owner and voids the invite (M01 §M01.2 edge list, `S1.wrong.2`). The confirm is a bottom sheet at 375 and a centred dialog at 1536; the after-state leads to *Sign in to HelioGrid*.

Drawn at 375 only (at 1536 the phone's answer holds at width): `loading`, `empty`, `load-error`, `join-error`, `otp-auto-read`, `wrong-code`, `expired-one-tap-re-request`, `reinvite-requested`, and the after-state of `declined-notifies-owner`.

**Decisions made in design (2026-08-31) — later screens inherit them.**

1. **The code is sent by arriving, not by a tap.** Sign-in (`SCR-M01-01`) is two steps because the
   number is unknown until typed; here the invite is KEYED to it (`SCR-M01-07`). Opening the link
   sends the code, the boxes are on the landing, one act verifies. Any other reading turns M01-13's
   *"accepting is one step"* back into a *Send code* tap plus a second screen.
2. **"Phone pre-filled" is a stated value, not a field.** The number is the invite's key, so an
   editable field would let someone redirect another person's code to their own phone. A `disabled`
   input is worse — disabled is never the only signal (`N4`) and a greyed field reads as *editable,
   later*. It renders as a labelled mono value with one sentence saying who entered it and where the
   code went, and the exit named (*if it is wrong, decline*).
3. **The evidence stops at the role's NAME.** The inviter by name, labelled *EPC Owner · <company>*,
   with no town; the company in the heading, the number, and the role. The landing contract
   (`invitationLandingSchema`, `packages/contracts/src/invitation.ts:60`) carries no inviter role. The
   label is safe because inviting needs `F2.M01.manage-team`, which only the EPC Owner holds (M01
   §M01.2 Permissions). What a `Sales Executive` can DO is `SCR-M01-10`'s job; repeating it here
   would be the whole control surface at once (`F7-34`).
4. **One landing, not two.** Someone who already has a HelioGrid account — a surveyor at a second
   EPC, an owner joining a partner's tenant — lands here and joins with the same one act; membership
   attaches to the account the number already identifies. No *you already have an account* variant
   and no sign-in door on the frame: the code proves the number either way.
5. **The resend gap is inherited, not re-invented.** 30 s, the constant `SCR-M01-01` fixed, stated
   the same way. Two screens sending codes to one number with two different waits is two products.
6. **The decline is confirmed, and its recovery is words** (owner ruling 2026-08-31).
   Declining voids the invite and notifies the owner, so `N8`'s undo has nothing left to operate on:
   the invite is gone and someone else has been told. The confirm names both consequences and carries
   the recovery — *Rajesh can invite you again* — on the confirm AND the after-state. A grace window
   was refused: it holds a destructive write in limbo and delays another person's notification.
7. **The landing carries the corridor's language control** — the same control `SCR-M01-09` draws,
   at both widths.

**Rulings at the M01 board check (owner, 2026-10-16).**

8. **The invite facts are `FactRows`.** The board composes the system's `FactRow`/`FactRows`; the
   build ports them into `packages/ui` at this task, the first that needs them (`D231`).
9. **The 1536 landing is the onboarding two-pane frame** that `SCR-M01-06`, `-07`, `-09` and `-10`
   share, not `DoorFrame` (decision 13); `D232` keeps only its `readOnly` half (ruling 10).
10. **A code held while joining is `readOnly`, never greyed.** `disabled` is for a field with
    nothing to take; the board's `disabled` is the design system's nearest prop (`D232`).
11. **The decline confirm cannot be dismissed.** The sheet at 375 and the dialog at 1536 set
    `dismissible: false`: it resolves only through *Keep the invite* or *Decline the invite*.
12. **The code takes focus on arrival at 1536 only.** On the phone the platform's auto-read fills it,
    and a keyboard opening over the landing hides who invited you.
13. **At 1536 the landing is the onboarding two-pane** (owner ruling 2026-10-17, M01 design), the pattern
    `SCR-M01-07` and `SCR-M01-10` draw: the context pane on the left; on the right the code task,
    centred in the task pane both ways, because a column as narrow as the code boxes left in a corner
    reads as stranded (owner ruling 2026-10-17, canvas comment); the language control on the
    wordmark's line. The task column is as wide as the code boxes.
14. **At 375 the actions follow the content** and pin to the foot only when the content overflows —
    never a gap between the content and the actions.

## Data volume

One invite: inviter name, company name, one pre-filled phone number, one 6-digit OTP. The invite message renders in the tenant's default language, with the invitee able to switch language at first run (M01 §M01.2 localization notes).

## Numbers carrying provenance

None carries a tier (`F8-01`). This screen's numeric content is the 6-digit OTP, an identifier, and, on the expired state, the invite's 7-day life (`INVITATION_EXPIRY_DAYS`), a limit the product enforces; no money or energy figure renders here.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
