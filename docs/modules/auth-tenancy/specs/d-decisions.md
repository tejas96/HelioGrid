# AUTH/TENANCY D-Decisions — extraction from POC spec + docs/15 rulings

Sources:
- `/Volumes/works-space/Solar-App-POC/docs/product-journey.md` (decision table, Stage 0, Stage 1, ROLES & PERMISSIONS, MULTILINGUAL, tenant-config sections)
- `/Volumes/works-space/heliogrid/docs/15-spec-resolutions.md` (rulings R6, R16; §2 decision-status table)

Status legend: HONORED / PARTIAL / SUPERSEDED per docs/15 §2 ("a SUPERSEDED decision is dead — do not implement it").

---

## Core decisions

### D5 — Customer never logs in (2026-07-20) — HONORED
Verbatim: "Customer never logs in — tokenised link only."
docs/15 row: "HONORED — stateless signed tokens (docs/08); named links + OTP ship v1 (R6-amended)."
Journey reinforces: "The customer almost never touches the app. They have no login (D5)." Day-in-the-life table: "Logins: **0**". Stage 8 roles table: "**Customer** | The progress link. No login."
**Implication:** No customer user records, no customer sessions. Customer-link module = stateless signed tokens, no RLS-user context, read-only except explicit accept/question actions (per api.md). One tokenised URL serves proposal AND progress for its whole life.

### D7 — Three audiences (2026-07-21) — HONORED
Verbatim: "Three audiences: company **owner**, **employees**, and the **EPC's customer**."
docs/15 row: "HONORED — two authenticated persona classes + anonymous link persona."
**Implication:** Auth system serves exactly two authenticated persona classes (owner/employees, distinguished purely by roles) plus the anonymous tokenised-link persona. No third account type.

### D11 — Self-serve signup (2026-07-21) — PARTIAL
Verbatim: "**Self-serve signup.** ~~Free trial; billing prompted later.~~ Billing is DEFERRED (D38) — signup asks only for the company + the owner; there is no trial gate or billing prompt anywhere in the current plan."
docs/15 row: "PARTIAL — signup honored; 'billing deferred' half superseded by product-owner override 2026-07-24 (billing in v1, trial-only)."
**Implication:** Self-serve tenant creation stands: signup collects only company + owner identity. Billing IS in v1 (trial-only start; Razorpay Subscriptions per R4/docs/16) — but no payment/plan selection during signup itself. Entitlements are the only runtime gating; read + export always work regardless of billing state.

### D12 — App UI English-only (2026-07-21) — SUPERSEDED by D25
Verbatim: "App UI **English**. Voice agent speaks **Hindi, Marathi, Gujarati, Tamil, Telugu + English**, chosen per customer."
**Implication:** Dead for UI. Voice-agent language set (6, per customer) survives and is independent of UI languages (3) — "the sets never converge by accident" (R3 consequence).

### D20 — Lead visibility scoping (2026-07-21) — HONORED
Verbatim: "**Reps see only their own leads.** Managers see the team's, owner sees everything."
docs/15 row: "HONORED — role scoping + RLS backstop (docs/08)."
**Implication:** Three visibility scopes (Own / Team / All; plus "Assigned only" for surveyor/designer/engineer — see role table) implemented in the service/repository layer with RLS as backstop. Dashboards reuse the same scoping (D37: "reps see their own, managers their team, owner all").

### D25 — Multilingual UI EN/HI/MR, per-user (2026-07-21) — HONORED
Verbatim: "**The app UI is multilingual: English, Hindi, Marathi.** Supersedes the English-only half of D12. Voice agent languages stay configurable per tenant, defaulting to the same three. Devanagari support is a design-system change, not just a translation task."
MULTILINGUAL section, screens table:
- "**Language picker** | In onboarding (first run) and in **Profile & preferences**, reachable by every user... Shows each language *in its own script* — English · हिंदी · मराठी — never translated names. Defaults to the device locale; changing it re-renders the whole app immediately, no reload."
- "**Per-user, not per-tenant** | One company can have an English-speaking owner and a Marathi-speaking surveyor. Language is a user setting."
What-goes-wrong: missing translation → English fallback, never raw keys; agent language ≠ app language (independent).
**Implication:** `language` is a USER column, not tenant config. Language picker in first-run onboarding AND profile. Switch = immediate full re-render, no reload. Auth/onboarding screens themselves must render in all three locales (Devanagari via Noto pairing).

### D27 — Six fixed preset roles, stackable (2026-07-21) — HONORED
Verbatim: "**Six fixed preset roles; one person may hold SEVERAL.** Permission granted if any held role grants it; lead visibility takes the widest. Solves the small-firm 'one person does three jobs' case without a custom-role builder."
The six presets (ROLES & PERMISSIONS section):
| Role | For | Lead visibility |
|---|---|---|
| Owner | Everything, always. Cannot be deleted or restricted. | All |
| Manager | Sees/reassigns team's leads, builds/sends proposals. Cannot change company settings, catalog, or billing. | Team |
| Sales rep | Own leads, own quotes, sends proposals. | Own |
| Surveyor | Visits sites, captures surveys. | Assigned only |
| Designer | Builds designs and quotes. | Assigned only |
| Engineer | Reviews and signs off designs. | Assigned only |
Stacking rules: "Permission granted if **any** held role grants it · Lead visibility takes the **widest** scope · team list shows all roles as chips · Presets are fixed and cannot be edited."
**Implication:** `user_roles` is M:N (user ↔ role enum), roles are a closed Postgres-enum-style set of 6. Permission check = OR across held roles. Visibility = widest. Role presets are code/constants, not tenant-editable rows.

### The 16-capability matrix (defines the presets — becomes the checkbox list for v2 custom roles)
"16 capabilities, phrased in plain language — never as CRUD on entities. This matrix is the definition of the presets."
| Capability | Owner | Manager | Sales rep | Surveyor | Designer | Engineer |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Lead visibility | All | Team | Own | Assigned | Assigned | Assigned |
| Add and edit leads | ✓ | ✓ | ✓ | — | — | — |
| Assign leads to others | ✓ | ✓ | — | — | — | — |
| Delete leads | ✓ | — | — | — | — | — |
| Capture site surveys | ✓ | ✓ | ✓ | ✓ | — | — |
| Create and edit designs | ✓ | — | — | — | ✓ | — |
| Approve designs (sign-off) | ✓ | — | — | — | — | ✓ |
| Create and edit proposals (incl. discounts) | ✓ | ✓ | ✓ | — | ✓ | — |
| Send proposals to customers | ✓ | ✓ | ✓ | — | — | — |
| Update project stages | ✓ | ✓ | — | — | — | — |
| Record payments, upload documents | ✓ | ✓ | — | — | — | — |
| Configure the agent and its knowledge | ✓ | — | — | — | — | — |
| See agent performance | ✓ | ✓ | — | — | — | — |
| Manage team and roles | ✓ | — | — | — | — | — |
| ~~Manage billing~~ (D38-era strike; billing now v1 → Owner) | | | | | | |
| See company reports | ✓ | ✓ | — | — | — | — |
Notes: "Discounting is not a separate permission (D34). It rides with *Create and edit proposals*." · "No object-level permissions, no field-level rules, no inheritance tree."
**Implication:** Capability checks are against this fixed matrix (the D27 presets); invariant tests assert "role capability matrix matches D27 presets" (testing-lite). With billing back in v1, Manage billing = Owner-only (Manager explicitly "cannot change... billing").

### D28 — No per-person exceptions (2026-07-21) — HONORED
Verbatim: "**No per-person permission exceptions, ever.** To know what someone can do, you look at their roles — one source of truth. Exceptions are how permission systems become unauditable."
docs/15 row: "HONORED — permissions derive purely from roles."
**Implication:** No per-user permission overrides table, no grant/deny flags on users. Authorization derives ONLY from the role set.

### D29 — Custom roles deferred to v2 (2026-07-21) — HONORED
Verbatim: "**Custom roles deferred to v2.** Ship the six, watch which combinations companies actually ask for, then add the presets they wanted — rather than guessing at a checkbox editor nobody fills in."
docs/15 row: "HONORED — coordinator=Manager runs checklist (R16); crew login v2."
**Implication:** No role editor, no custom-role schema in v1 — but roles are already M:N so a v2 Installer preset lands "without schema change" (R16 consequence).

### D33 → R6-amended — Customer-link identity & OTP-at-accept — SUPERSEDED (ships v1)
D33 verbatim: single link, "No per-contact links, no identity check, no portal accounts... likely later fix is named links per contact plus an OTP at the moment of accepting."
docs/15 R6 RULING (amended 2026-07-24): "named links + OTP-at-accept SHIP IN the 20-day build — per-contact labelled links, per-link open attribution, and an MSG91 OTP challenge on Accept above a tenant-set value threshold. The `customer_links` entity carries `label` and nullable `contact_id`."
Consequence: "acceptance records capture full attribution (link id, contact, OTP verification, IP, user agent) from day one."
**Implication:** The ONLY customer-side auth event is the MSG91 OTP challenge at Accept (above tenant-set threshold). Reading stays frictionless — no identity check to view. `customer_links` carries label + nullable contact_id; a link token for deal X can never read deal Y (invariant).

### D38 / D26 — Billing — BOTH SUPERSEDED by owner override 2026-07-24
Billing IS in v1 (trial-only start, Razorpay). Surviving product law: "never hold a customer's data hostage" — read + export always work regardless of billing state. Entitlement gating is the only runtime feature gating (no feature flags).
**Implication for auth:** entitlement state machine (trialing → active → past_due → halted) exists alongside auth; 403 `ENTITLEMENT_BLOCKED` for gated writes; auth itself never blocked by billing.

---

## Stage 0 — Company onboarding (tenant creation)

Who: "the EPC company owner, usually on a laptop." Goal: "'I signed up' to 'my team can quote a job' without a training session." Principle: "ask for the minimum to produce one real quote."
Screens (verbatim-ish):
- **Sign up**: "Phone number → OTP. Company name, your name, city. Nothing else."
- **What do you sell?**: Residential / C&I / both + typical system size → seeds defaults.
- **Company profile**: "Logo, GSTIN, address, bank details. **Skippable** — prompted later, when the first proposal is about to be sent."
- **Invite team**: "Add by phone number, pick a role. **Skippable.**"
- **You're ready**: "Create your first lead" or "Try a demo project".
Edge cases (all binding product behavior):
- "**Phone already registered** → offer login instead, do not create a duplicate company"
- "**OTP does not arrive** → resend after 30s, then offer 'call me instead'"
- "**Wrong GSTIN format** → validate live, explain the format, allow skip"
- "**Owner abandons midway** → they are already an account; resume where they left off"
- "**Two people from the same company sign up** → detect by company name + city, offer 'request to join' instead of creating a second workspace"
Deliberately not in v1: "SSO, custom domains" (+ no payment/plan selection at signup even with billing v1).
Recommendation: demo project pre-loaded with a real Pune rooftop.
**Implications:** Phone = identity (MSG91 OTP via Better Auth). Signup mints tenant + Owner user atomically. Account exists from OTP verification (resumable onboarding state). Duplicate-workspace detection (company name + city) with a request-to-join flow. OTP resend timer 30s + voice-call fallback. Seed every new tenant (defaults pack + demo project).

## Stage 1 — User onboarding (invite flow)

Who: "a sales rep, surveyor, designer or engineer invited by the owner. **Phone, almost always.**" Goal: "useful within two minutes."
Screens:
- **Invite landing**: "'Rajesh invited you to HelioGrid — Suryodaya Solar.' Phone pre-filled."
- **OTP**: "6 digits, auto-read from SMS where the platform allows."
- **Your profile**: "Name, photo (optional). That is all."
- **Your role, explained**: one card stating what they can and cannot do.
- **First-run coach marks**: max three, dismissible, never a carousel.
Happy path: "Tap invite → OTP → name → see My Day with real work already assigned."
Edge cases:
- "**Invite expired** → 'Ask Rajesh to invite you again', with a one-tap request"
- "**Wrong person got the invite** → decline, notifies the owner"
- "**Role has nothing assigned yet** → empty state that says what will appear here and who to ask"
- "**Owner removes them later** → graceful 'your access was removed', no crash"
Recommendation (binding UX law): "**Role decides the home screen, not a setting.** Sales rep lands on My Day. Surveyor lands on today's site visits. Designer lands on designs awaiting work. Engineer lands on the sign-off queue. Owner lands on the pipeline dashboard." Multi-role: home screen for the *widest* role, with the others folded in (roles §recommendation 2).
**Implications:** Invites are phone-number-addressed, expiring, declinable (decline notifies owner), re-requestable. SMS OTP autofill (Android SMS Retriever / iOS oneTimeCode). Session revocation mid-use must degrade gracefully. Post-auth routing is role-derived, not stored preference.

## Team management screens (ROLES & PERMISSIONS §Screens — v1)

- **Team**: "People, the roles each holds (as chips), status (active / invited / removed), last active. Invite by phone number."
- **Assign roles**: six presets as toggles + live plain-English line ("Rajesh can sell, survey and design.")
- **Roles reference**: read-only matrix + count of holders per role.
- **Invite person**: "Name, phone, one or more roles. That is all."
Guards (What goes wrong — all binding):
- "**Owner removes their own admin rights** → blocked; there must always be at least one Owner"
- "**Last person with 'Manage team' is removed** → blocked with an explanation"
- "**A permission is removed while someone is mid-task** → they finish what they started; the restriction applies to the next action, not a mid-flight error"
- "**Person invited with no role at all** → blocked; they would sign in and see nothing"
- "**Person leaves the company** → deactivate, never delete. Their leads and activity stay attributed, and get reassigned."
**Implications:** users have status (active/invited/removed=deactivated); ≥1 Owner invariant enforced server-side; invites require ≥1 role; permission checks are per-action (no mid-flight session kill on role change); soft-deactivation only — user rows never deleted (attribution history).

## R16 — Installer/crew role gap (docs/15)
RULING: "the coordinator (Manager role) runs the checklist in v1; crew login/role is v2. Ticks are attributed to the coordinator; an optional free-text 'done by' per step captures the crew member's name. Crew sees no money because crew sees no screen."
**Implication:** No 7th role in v1; no crew accounts. Journey Stage 8 confirms: "Coordinator / ops... = the Manager preset — there is no separate coordinator role (D27)."

## Tenancy-adjacent notes

- **Tenant config principle**: "Nothing is required on day one. Every setting has a working default. A tenant can sign up and send a real proposal without opening settings once." · "A tenant with no config at all → everything falls back to platform defaults." Every new tenant is "Seeded, not empty" (solar-industry default pack).
- **D36 (agent tenant-configurable)** — docs/15 PARTIAL: config fully tenant-owned BUT "the statutory floor (DND scrub, 9am–9pm, DLT series, opt-out, recording retention) is enforced by our non-swappable `ComplianceGate`" — tenants configure within the law.
- **D31 role-adaptive nav**: centre FAB verb adapts by role ("surveyor = Start survey") — another role-derived UI surface. (Brass half void per D3 supersession; FAB is near-black.)
- **D14/D15** (authz-adjacent): assignment is manual with rep load visible (assign = Owner/Manager capability); survey is "a task assignable to anyone with the capability."
- **Phone = identity for LEADS too** (Stage 2): "Phone number is the identity. Dedupe on capture, every path, no exceptions" — same identity principle as users, different table.
- **Server assigns business identifiers** (constitution): never client-generated — applies to any onboarding-created entities.
