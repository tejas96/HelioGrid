# SCR-M01-07 · Invite Teammate

Phone-keyed invite with name and at least one preset role; skippable during onboarding, always on Team.

**Module:** M01 · **Personas:** EPC Owner · **Context of use:** appears during company onboarding as a skippable step and permanently from the Team screen (M01-12). Settings suite is web-emphasis, but one-tap acts — invite among them — are first-class on mobile (M01 §2). Permission: inviting requires `F2.M01.manage-team` (EPC Owner-only — M01 §M01.2 permissions). The invite flow is "the product's second first-impression and is held to the same under-a-minute bar as signup"; an invite delivers as a message to the invitee's phone, platform-sent, on the platform's own rail (M01 §M01.2 behavior detail).

## Entry & exit

Reached from: the skippable onboarding invite step (`S0.screen.4` per M01-12) and one-tap invite on the Team screen (SCR-M01-12, M01-12). The `join_requested` notice (T-M01-035) opens this screen in its Team life with the asker's name and number filled in — no frame of its own. Leads to: on send, an invite in state pending (states pending / accepted / expired / revoked, with an expiry — M01-12), visible and revocable on Team; during onboarding, skipping continues to the two-door landing (M01 §M01.3 behavior detail). The invitee's side is Invite Landing (SCR-M01-08).

In the corridor, *Send invite* and *Skip for now* both continue to SCR-M01-06; a send stops on no confirmation and does not re-arm the form. In its Team life the invite is one editor over Team — a bottom sheet at 375, a side panel at 1536 — with *Cancel* in place of *Skip for now*. The Team page behind it is `SCR-M01-12`'s page as its boards draw it, at both widths — reused, never redrawn.

## Requirements (verbatim)

### From `docs/prd/foundations/F2-roles-and-permissions.md`

- **F2-21** (P1) — **An invitation carries at least one preset.** Inviting a person with no role at all is blocked — they would sign in and see nothing. (The invite flow itself — name, phone, roles — is M01's.) _(non-UI half, build-side: guarded at the transition; no surface can bypass it — for awareness, not for drawing)_

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-12** (P0) — **Invites are phone-keyed and carry at least one preset role.** The Invite screen asks: name, phone number, one or more of F2's twelve presets (F2-21 blocks a role-less invite). Invite states are pending / accepted / expired / revoked, with an expiry; inviting is skippable during onboarding (`S0.screen.4`) and always available later from the Team screen.

## States

Base: **loading** · **empty** · **error**.

- **loading** — only the presets are in flight: a `Card` in its loading state holds the role set's place, and *Send invite* is the one unavailable control, its `disabledReason` saying it waits for the role list.
- **error** — the presets failed to load. The form stays as drawn: a `Card` in its error state, with its own *Try again*, holds the role set's place, and *Send invite* is off with its `disabledReason`, mirroring loading — never a whole-screen empty state (owner ruling 2026-10-16).

Screen-specific:

- **normal** — name, phone number, one or more of F2's twelve presets (M01-12). `empty` and `normal` are the same blank default form, folded into the default frames — no frames of their own.
- **skippable-onboarding-step** — the corridor life: skippable, never a gate (M01-12, `S0.screen.4`). Folded into the default frames — no frame of its own.
- **no-role-blocked** / **blocked-no-role** — an invite with zero roles is blocked before sending (F2-21; M01 §M01.2 acceptance: "Given an invite with zero roles, when it is submitted, then it is blocked before sending"). *Send invite* stays live: the refusal is a danger `Banner` at the top of the role set, never a disabled act.
- **already-a-member** — invite sent to a number that is already a member → the invite surface says so and offers the Team screen instead of sending (M01 §M01.2 edge list). *Open Team* is the banner's own action; the foot pairs *Skip for now* with *Use a different number*.
- **already-invited** — a live invite already went to this number: the create (`POST /invitations`, `packages/contracts/src/invitation.ts`) refuses with 409 `ALREADY_INVITED`. Works like already-a-member and points to Team, where the pending invite can be cancelled.
- **number-not-covered** — a number no market covers (F1-49): the create refuses with 422 `DOMAIN_RULE_VIOLATION`, shown as the PhoneField's error line.
- **invite-cap-reached** — invite flooding → the invite cap (50 sends per company in any rolling 24 hours, so no midnight reset) with an honest message (M01 §M01.2 edge list; the cap is M01-04's, carried on SCR-M01-01). The forward act becomes *Continue setup*. The cap `Banner` and *Continue setup* carry the state alone — no second region under the banner (owner ruling 2026-10-16).

Drawn at 375 only (at 1536 the phone's answer holds at width): `loading`, `error`, `already-a-member`, `already-invited`, `number-not-covered`, `invite-cap-reached`.

**The role picker.** All twelve F2 presets in one list, in F2's fixed order, each with its capability line — the same list SCR-M01-13 draws, word for word (the EPC Owner's line says *company settings*, never *tenant settings*, `F7-42`) — in both lives. Under the list sits *What each role can do*, a ghost text act that opens the Roles Reference (`SCR-M01-14`) as a reader (owner ruling 2026-10-16). There is no "Show all twelve roles". The list is built as `OptionCardGroup` in a multi-select mode; each row carries a title, a description and a `disabledReason`. One prop contract on both platforms, shared with SCR-M01-13.

## Data volume

One invite at a time: one name, one phone number, and a role selection across F2's twelve presets (a person may carry one or more). Role names use localized capability phrases; invite messages render in the tenant's default language (M01 §M01.2 localization notes).

## Numbers carrying provenance

The numbers here are limits the product enforces, which carry no provenance tier (F8-01). User-visible here: the invite expiry, 7 days from the send (M01-12; `INVITATION_EXPIRY_DAYS` in `packages/domain/src/auth/invitation-policy.ts`), and, in the cap-reached state, the invite cap, 50 invite sends per company in any rolling 24 hours (M01-04; `INVITATIONS_PER_TENANT_PER_DAY` and `invitationsSince`, same file). There is no resend: a live invite can only be cancelled on Team. No money or business quantity renders here.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state with an online-only mutation note. It is deleted.*
