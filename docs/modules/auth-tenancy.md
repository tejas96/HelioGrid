# MODULE auth-tenancy — roadmap (Track A; screens phase, backend pre-landed)

> The module's ONLY task list (docs/17 §3). Specs extracted from the mockups live in
> [auth-tenancy/specs/](./auth-tenancy/specs/) — layout, verbatim copy, component maps,
> state machines per screen. Keep Status live.

## Scope
Phone-OTP identity, tenant creation, onboarding, invites, roles and team management —
web + RN in lockstep. NON-goals: My Day content (CRM module; we only own the coach-mark
overlay contract), billing prompts in signup (D11: none), customer login (D5: never),
custom roles (D29 excluded).

## Traceability header
- D-decisions: D5, D7, D11, D20, D25, D27, D28 (+ R6, R16 rulings) — extraction:
  specs/d-decisions.md. D12 SUPERSEDED (dead).
- Mockups: Login/LoginFlow · SignUp/SignUpFlow · WhatYouSell/SellFlow ·
  YoureReady/ReadyFlow · InviteLanding/InviteFlow · YourRole/RoleFlow · TeamRoles ·
  SetupLater (.dc.html, design/mockups/).
- docs/04 owned: §1 spine (landed: 0001–0002). No new tables expected this phase;
  any discovered need lands as migration 0003+ within this module only (Law 9).
- Contracts: auth router landed; ADDITIONS this phase: expired-invite re-request,
  voice-OTP escalation (DLT-gated), coach-mark seen state (profile PATCH suffices).

## Module rulings (five-lenses calls — owner may veto)
1. **SignUp ships web + RN** (Law 7 lockstep, owner ruling 2026-07-27) — same slice as web
   `/signup`. Owner self-serve onboarding steps WhatYouSell/YoureReady remain **web-only**
   (tasks 4–5; no mobile surface planned).
2. **Demo-only mockup strings** ("Demo — enter…", "Restart demo") never ship.
3. **Photo upload (invite profile) + logo upload (SetupLater) are BLOCKED-ON-INFRA**
   (Tigris — owner Fly billing); slices ship without them, wired seams left in place.
4. **Voice-call OTP escalation** (after 2 SMS resends) ships as contract + dev adapter;
   real voice OTP is DLT/MSG91-gated (docs/ops/msg91-setup.md).
5. New shared primitives (OtpInput, TextLink, Wordmark, BloomLayer, StepIndicator,
   RadioCard, Spinner) are COMPOSED into packages/ui + RN mirrors and gallery-proven —
   docs/13 rows added (UX gaps designed in-slice per the standing law).

## Tasks
| # | Task | Layer(s) | Traces to | Depends | Status | Evidence |
|---|---|---|---|---|---|---|
| 0 | Backend: BA wiring, guard, onboarding/me/profile/team/invites api | contracts+db+api | D7/D11/D27 | — | VERIFIED | curl E2E 2026-07-26 (commit a66a4c3) |
| 1 | Shared auth primitives: OtpInput, TextLink, Wordmark, BloomLayer, StepIndicator, Spinner (+RadioCard) web+RN + galleries | ui | specs §component-maps | 0 | VERIFIED | galleries checked in browser + iPhone sim 2026-07-26; OtpInput live-typed |
| 2 | Login screen web+RN (phone→OTP→success; 30s resend; call-me seam; ~14 states) | web+mobile+ux | Login/LoginFlow specs | 1 | VERIFIED | E2E dev-OTP walked 2026-07-26: browser 375+1440 (happy + wrong-code + send-error + change-number), iPhone (verify→session→Home, relaunch restores) AND Pixel (fresh user one-pass). Fixed in-slice: RN cookie jar credentials 'omit' + getSetCookie (S1 landmine, mobile CLAUDE.md), tsx @Inject metadata (api CLAUDE.md). /signup placeholder holds the exit until task 3. Five-lens review passed; open QA notes → task 12: offline boot relaunch UX (Track E), jar cookie-expiry on future sign-out |
| 3 | SignUp web+RN (Law 7) + routes /signup | web+mobile+ux | SignUp specs | 1 | todo | |
| 4 | WhatYouSell onboarding step (radio-cards, kW input, skip) web-only (owner flow) | web+ux | WhatYouSell specs | 1,3 | todo | |
| 5 | YoureReady doors + SetupLater accordion (team invites live; GST live; logo seam blocked ruling 3) | web+ux | YoureReady specs | 4 | todo | |
| 6 | Invite accept /join web+RN (locked phone, OTP, profile sans photo, expired branch) | web+mobile+ux | Invite specs | 1,2 | todo | |
| 7 | Contract+api: expired-invite re-request; voice-OTP escalation seam (dev adapter) | contracts+api | Invite/Login specs | 2,6 | todo | |
| 8 | YourRole explainer web+RN + coach-mark overlay contract (targets /home until CRM) | web+mobile+ux | YourRole specs | 6 | todo | |
| 9 | TeamRoles management (roles matrix D27/D28, invites list/revoke/resend) web+RN | web+mobile+ux | TeamRoles specs | 5,7 | todo | |
| 10 | Language picker in onboarding + profile (D25, per-user, immediate re-render) | web+mobile | D25 | 2 | todo | |
| 11 | i18n: full HI/MR catalogs for every string above; Hindi render verified | web+mobile | D25 | 2–10 | todo | |
| 12 | Module QA attack + AI review (five lenses) + docs/13 rows + roadmap close | all | /slice + /lenses | 1–11 | todo | |

## Module Definition of Done
CLAUDE.md §Definition of done per slice PLUS: all 14 mockups implemented or explicitly ruled ·
D5/D7/D11/D20/D25/D27/D28 honored · invite→OTP→role→app journey walked end-to-end on
browser AND both simulators · tenancy invariants green · no orphan screens (every exit
wired) · specs' CONFLICT lists resolved or logged in docs/13.
