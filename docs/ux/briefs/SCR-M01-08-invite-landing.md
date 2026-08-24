# SCR-M01-08 · Invite Landing

Personal invite acceptance naming inviter and company; one-step OTP accept.

**Module:** M01 · **Personas:** Invited Employee · **Context of use:** the invited person's first contact with the product — mobile-first; their device is "Phone, almost always" (M01 §2). The landing works on both platforms and web (M01 §M01.2 behavior detail). Held to the same under-a-minute bar as signup: an invited person is useful within two minutes without reading anything (M01 §M01.2 context, M01-17).

## Entry & exit

Reached from: the invite message on the invitee's phone — platform-sent, on the platform's own rail (M01 §M01.2 behavior detail). Leads to: on OTP verification, user + membership + roles exist atomically and the next screen is name/photo (First-Run Profile, SCR-M01-09), then the role card (SCR-M01-10), then their role's home with their real assigned work (M01 §M01.2 acceptance). Declining voids the invite and notifies the EPC Owner; an expired invite offers a one-tap re-request that notifies the inviter (M01 §M01.2 edge list).

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

## Data volume

One invite: inviter name, company name, one pre-filled phone number, one 6-digit OTP. The invite message renders in the tenant's default language, with the invitee able to switch language at first run (M01 §M01.2 localization notes).

## Numbers carrying provenance

Every rendered number carries its F8 provenance tier in the design. This screen's numeric content is the 6-digit OTP; no money, business quantity or business date renders here.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
