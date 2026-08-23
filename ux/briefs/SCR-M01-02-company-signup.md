# SCR-M01-02 · Company Signup

Self-serve tenant creation: phone, OTP, company name, owner name, city in under a minute.

**Module:** M01 · **Personas:** EPC Owner · **Context of use:** the owner signs the company up "usually on a laptop, often with a salesperson on a call" (M01 §2) — laptop-leaning but fully mobile-capable; signup itself must be completable in under a minute on a phone (M01 §M01.1 behavior detail). Runs before roles exist — nothing is permission-gated.

## Entry & exit

Reached from: the product's signed-out front door as the self-serve signup path; the precise entry control is not pinned by PRD — designer decides, note the decision. Leads to: the onboarding sequence — after the three fields, the only further onboarding steps are the "What do you sell?" step (M01-23, SCR-M01-04), the skippable business profile (M01-24, SCR-M01-05), the skippable invite step (M01-12, SCR-M01-07) and the two-door landing (M01-26, SCR-M01-06) (M01 §M01.3 behavior detail); the first-run language picker also appears in onboarding (F3-03, SCR-M01-03). A known phone number exits to login (SCR-M01-01) per M01-08.

## Requirements (verbatim)

### From `prd/modules/M01-onboarding-and-tenant-config.md`

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

## Data volume

One tenant record in the making: one phone number, one 6-digit OTP, three text fields. Five inputs total, completable in under a minute on a phone. Design in all launch languages, defaulting to the device locale (M01 §M01.1 localization notes).

## Numbers carrying provenance

Every rendered number carries its F8 provenance tier in the design. This screen shows no money, business quantity or business date; its only numeric content is the 6-digit OTP entry (OTP limit states — cooldowns, caps, lock — live on Sign In, SCR-M01-01).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state and a "signup is an online act" clause. Both are deleted.*
