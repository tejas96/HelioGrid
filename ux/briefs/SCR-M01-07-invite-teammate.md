# SCR-M01-07 · Invite Teammate

Phone-keyed invite with name and at least one preset role; skippable during onboarding, always on Team.

**Module:** M01 · **Personas:** EPC Owner · **Context of use:** appears during company onboarding as a skippable step and permanently from the Team screen (M01-12). Settings suite is web-emphasis, but one-tap acts — invite among them — are first-class on mobile (M01 §2). Permission: inviting requires `F2.M01.manage-team` (EPC Owner-only — M01 §M01.2 permissions). The invite flow is "the product's second first-impression and is held to the same under-a-minute bar as signup"; an invite delivers as a message to the invitee's phone, platform-sent, on the platform's own rail (M01 §M01.2 behavior detail).

## Entry & exit

Reached from: the skippable onboarding invite step (`S0.screen.4` per M01-12) and one-tap invite on the Team screen (SCR-M01-12, M01-12). Leads to: on send, an invite in state pending (states pending / accepted / expired / revoked, with an expiry — M01-12), visible and revocable on Team; during onboarding, skipping continues to the two-door landing (M01 §M01.3 behavior detail). The invitee's side is Invite Landing (SCR-M01-08).

## Requirements (verbatim)

### From `prd/foundations/F2-roles-and-permissions.md`

- **F2-21** (P1) — **An invitation carries at least one preset.** Inviting a person with no role at all is blocked — they would sign in and see nothing. (The invite flow itself — name, phone, roles — is M01's.) _(non-UI half, build-side: guarded at the transition; no surface can bypass it — for awareness, not for drawing)_

### From `prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-12** (P0) — **Invites are phone-keyed and carry at least one preset role.** The Invite screen asks: name, phone number, one or more of F2's twelve presets (F2-21 blocks a role-less invite). Invite states are pending / accepted / expired / revoked, with an expiry; inviting is skippable during onboarding (`S0.screen.4`) and always available later from the Team screen.

## States

Base: **loading** · **empty** · **error**.

Screen-specific:

- **normal** — name, phone number, one or more of F2's twelve presets (M01-12).
- **skippable-onboarding-step** — the onboarding appearance: skippable, never a gate (M01-12, `S0.screen.4`).
- **no-role-blocked** / **blocked-no-role** — an invite with zero roles is blocked before sending (F2-21; M01 §M01.2 acceptance: "Given an invite with zero roles, when it is submitted, then it is blocked before sending").
- **already-a-member** — invite sent to a number that is already a member → the invite surface says so and offers the Team screen instead of sending (M01 §M01.2 edge list).
- **invite-cap-reached** — invite flooding → the per-tenant daily invite cap with an honest message (M01 §M01.2 edge list; the cap is M01-04's, carried on SCR-M01-01).

## Data volume

One invite at a time: one name, one phone number, and a role selection across F2's twelve presets (a person may carry one or more). Role names use localized capability phrases; invite messages render in the tenant's default language (M01 §M01.2 localization notes).

## Numbers carrying provenance

Every rendered number carries its F8 provenance tier in the design. User-visible here: the invite expiry (invite states carry an expiry — M01-12) and, in the cap-reached state, the per-tenant daily invite cap (M01 §M01.2 edge list). No money or business quantity renders here.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state with an online-only mutation note. It is deleted.*
