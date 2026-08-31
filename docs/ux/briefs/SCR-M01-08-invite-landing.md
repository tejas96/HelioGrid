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

Screen-specific:

- **normal** — the landing names the inviter and the company, phone pre-filled, 6-digit OTP (M01-13).
- **otp-auto-read** — OTP auto-read where the platform allows (M01-13).
- **expired-one-tap-re-request** — invite expired → "Ask {inviter} to invite you again", with a one-tap request that notifies the inviter; nothing dead-ends (M01 §M01.2 edge list, `S1.wrong.1`).
- **declined-notifies-owner** — wrong person got the invite → decline action on the landing; declining notifies the EPC Owner and voids the invite (M01 §M01.2 edge list, `S1.wrong.2`).

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
3. **The evidence stops at the role's NAME.** Inviter with role and company, the company in the
   heading, the number, and the role. What a Sales rep can DO is `SCR-M01-10`'s job; repeating it
   here would be the whole control surface at once (`F7-34`).
4. **One landing, not two.** Someone who already has a HelioGrid account — a surveyor at a second
   EPC, an owner joining a partner's tenant — lands here and joins with the same one act; membership
   attaches to the account the number already identifies. No *you already have an account* variant
   and no sign-in door on the frame: the code proves the number either way.
5. **The resend gap is inherited, not re-invented.** 30 s, the constant `SCR-M01-01` fixed, stated
   the same way. Two screens sending codes to one number with two different waits is two products.
6. **The decline is confirmed, and its recovery is words** (owner ruling 2026-08-31, `Q78`).
   Declining voids the invite and notifies the owner, so `N8`'s undo has nothing left to operate on:
   the invite is gone and someone else has been told. The confirm names both consequences and carries
   the recovery — *Rajesh can invite you again* — on the confirm AND the after-state. A grace window
   was refused: it holds a destructive write in limbo and delays another person's notification.

## Data volume

One invite: inviter name, company name, one pre-filled phone number, one 6-digit OTP. The invite message renders in the tenant's default language, with the invitee able to switch language at first run (M01 §M01.2 localization notes).

## Numbers carrying provenance

Every rendered number carries its F8 provenance tier in the design. This screen's numeric content is the 6-digit OTP; no money, business quantity or business date renders here.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
