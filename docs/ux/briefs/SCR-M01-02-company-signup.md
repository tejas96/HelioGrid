# SCR-M01-02 · Company Signup

Self-serve tenant creation: phone, OTP, company name, owner name, city in under a minute.

**Module:** M01 · **Personas:** EPC Owner · **Context of use:** the owner signs the company up "usually on a laptop, often with a salesperson on a call" (M01 §2) — laptop-leaning but fully mobile-capable; signup itself must be completable in under a minute on a phone (M01 §M01.1 behavior detail). Runs before roles exist — nothing is permission-gated.

## Entry & exit

Reached from: the product's signed-out front door as the self-serve signup path. The precise entry control was not pinned by PRD; **`SCR-M01-01` decided it (2026-08-27)** — a persistent **"Create a company account"** door at the foot of the sign-in frame, reachable without typing a number. This screen carries the **reciprocal door, "Sign in instead"**, in the same position, so the two signed-out screens are a pair. **A second entry exists:** a person who verified an unrecognised number on `SCR-M01-01` is handed here **with that number already verified**, landing on the company-details step — steps 1 and 2 are done either way, so it is the same frame, not a separate flow. Leads to: the onboarding sequence — after the three fields, the only further onboarding steps are the "What do you sell?" step (M01-23, SCR-M01-04), the skippable business profile (M01-24, SCR-M01-05), the skippable invite step (M01-12, SCR-M01-07) and the two-door landing (M01-26, SCR-M01-06) (M01 §M01.3 behavior detail); the first-run language picker also appears in onboarding (F3-03, SCR-M01-03). A known phone number exits to login (SCR-M01-01) per M01-08.

**Further decisions made in design (2026-08-28) — later screens inherit them.**

1. **After verification the number is a fact, not a field.** The company-details step shows it on a surface with a `StatusChip` *Verified* and **no Change control** — changing the number after verification is a different account, not an edit. *Change number* exists on the code step only, where nothing has been created yet.
2. **The three steps are gated, not free.** `Stepper reachability="entered"` — the company details read the verified account and cannot be jumped to before it exists. Going back stays open. The flow's length is also spoken in body copy, so it is never carried only by the step counter.
3. **City is a text field with suggestions, never a `Select`.** There is no closed list of Indian cities. The value resolves to a **market-pack city**, because `M01-09` matches on company name *and* city, and a steer keyed on free text would fire on *pune* and miss *Pune, MH*.
4. **The code step's limit states belong to `SCR-M01-01`.** Resend is drawn live here; no cooldown, cap or lock number renders. Those eleven states are specified once, on the front door.
5. **A steer is a steer: both roads are full-size controls.** *Request to join* is primary and *Create a new company anyway* is a full-width secondary directly beneath it — never a link inside a sentence. A steer that shrinks the road it does not recommend is a block wearing a steer's clothes, and `M01-09` says creating remains possible.
6. **The join steer names a company and a city, and nothing about who works there.** Naming another tenant's owner across a tenant boundary is not this screen's to do; the request is described by where it goes ("its owner").
7. **The known number is answered on the number step, before any code is sent** (`M01-08`). The field keeps the number — the person just typed it, so no account is disclosed to a stranger.
8. **Nothing on the resume state carries a clock.** No last-seen time and no "you left off at…" — a returning-user timestamp invites a staleness reading this product does not have.
9. **Desktop rule for states, stated once:** a finding *about you* moves into the identity half; a message *about a field* stays on the field. Two states earn a 1536 frame because that move changes the act.
10. **No shell at either width, and that is an answer, not a dropped capability.** Signup runs before roles exist, so `F7-22`'s two shell forms have no subject. They first diverge on the two-door landing this flow hands off to (`SCR-M01-06`).

**Build note — a design-system gap this screen worked around.** `Banner` has no kind for a **signed-out steer**. Its kind table pins a glyph per kind, and the nearest (`suggestion`) carries a spark glyph that reads as AI — wrong for a workspace-detection finding, which is a fact about the tenant estate, not something the system generated. `Banner` also offers one `BannerAction` pill where both steers here own two full-size routes. Both statements are composed from tokens instead. A `kind="finding"` (info tone, info glyph, no spark) plus an `actions` slot accepting real buttons would close this when `packages/ui` builds the component.


## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-01** (P0) — **Self-serve signup, minimal fields.** A company signs itself up: phone number → OTP; then company name, the owner's name, and city. **Nothing else** — no tax registration, no logo, no price book, no team, no payment instrument. The person signing up becomes the tenant's first EPC Owner.
- **M01-08** (P0) — **A phone number that is already registered never creates a duplicate company.** Signup with a known phone offers login instead — the account is one account, whatever door it walks in through. _(non-UI half, build-side: one account per phone number globally; no duplicate company — for awareness, not for drawing)_
- **M01-09** (P1) — **A second person from the same company is steered to "request to join".** Signup detects a likely-existing workspace by company name + city and offers "request to join" (routed to that tenant's EPC Owner as an invite request) instead of silently creating a second workspace. Creating a new company remains possible — the detection is a steer, not a block.

## States

Base: **loading** · **empty** · **error** (empty/error states carry F7's teaching-empty-state contract — M01 §M01.1 behavior detail).

Screen-specific:

- **normal** — phone → OTP → exactly three fields (company name, owner's name, city); nothing else (M01-01). No billing, plan or payment step exists anywhere in the flow (M01 §M01.1 context, M01-11 — not a row of this slice).
- **duplicate-phone-login-offered** — a known phone offers login instead of creating a duplicate company (M01-08).
- **request-to-join-offered** — likely-existing workspace detected by company name + city; "request to join" offered and routed to that tenant's EPC Owner as an invite request; creating a new company remains possible (M01-09).
- **resume-after-abandon** — once the OTP has verified the person is an account; returning resumes exactly where they left off — no restart, no duplicate (context: M01 §M01.1 edge list / M01-10, not a row of this slice).

*Three states added in design (2026-08-28), each separable — remove one and nothing else moves:*

- **request-sent** — where **request-to-join-offered**'s primary control lands. `M01-09` routes the request to the existing tenant's EPC Owner and names no screen for what the asker then sees, which would have left that control leading nowhere. Drawn as the smallest honest answer: what was sent, to whom, how the answer arrives, and the way back to creating their own company. **Checked 2026-08-28: no other V1 screen owns this acknowledgement** — `M01-09` is dispositioned to `SCR-M01-02` alone — so it stays a state of this screen and adds no row to the register.
- **number-invalid** — the phone number is answered on the field when the control is pressed, counted against the market pack's format ("that is 7 digits — an Indian mobile number has 10"), never by gating the primary at rest.
- **fields-invalid** — a missing company detail says *why* it is needed (a company name goes on every quote), never a scold.

## Data volume

One tenant record in the making: one phone number, one 6-digit OTP, three text fields. Five inputs total, completable in under a minute on a phone. Design in all launch languages, defaulting to the device locale (M01 §M01.1 localization notes).

## Numbers carrying provenance

Every rendered number carries its F8 provenance tier in the design. This screen shows no money, business quantity or business date; its only numeric content is the 6-digit OTP entry (OTP limit states — cooldowns, caps, lock — live on Sign In, SCR-M01-01).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state and a "signup is an online act" clause. Both are deleted.*
