# F-core — engineering tasks

This file dispositions every requirement row of the suite's three core documents — `docs/prd/01-product-overview.md` (OV), `docs/prd/02-personas.md` (PS) and `docs/prd/foundations/F1-global-market-framework.md` (F1) — under the task-id prefix **T-FCORE-**. This bucket owns no screens: its build tasks are the market-pack framework and its eight keys, the India pack's data, the market price-book law and the India book, and the commercial configuration contract (meters, tiers, billing-state vocabulary) that the billing code consumes. Every other row in the bucket is either a suite law enforced through the screens and reviews that other buckets build (see **## Laws**) or a context/positioning row realized by a named document, module or screen (see **## Realized elsewhere**). Every row appears exactly once in the **## Disposition index** at the end.

---

### T-FCORE-009 · Data-rights pack key (pack.data-rights), erasure/anonymisation workflow + the IN DPDP determination
**Type:** engine · **Tier:** P0
**Status:** planned
**Parked:** by owner ruling until the tenant base reaches real paying customers (roughly 10–20) — the *Deferred* note below; the build line never offers it as ready.
**Design:** none — pack data and a support-backed workflow
**Why:** a customer who asks for their data, or to be forgotten, is served within the law, and the EPC keeps the tax records it must keep.
**Also lands:** the `dataRights` field on `packages/data`'s `useShell()` and the pack read behind it — `T-SHELL-007` left both out while the key has no type.
**PRD rows:** F1-23, F1-24, F1-32, F1-54, F1-55, F1-56, F1-57, F1-58, F1-59
**Requirements (verbatim):**

- **F1-23** (P0) — Every pack carries the market's **privacy/residency determination** — the F1-05 prerequisite, kept as pack data: the platform's role(s) under that jurisdiction's data law (for tenant users' data and for the EPC's customer data), residency rules for primary data and for derived/object storage, the data-principal rights map (access/export, correction, erasure — with each right's product path and any SLA), breach-notification duties, and the consent records the market requires the product to keep and surface.
- **F1-24** (P0) — **Two rights are product law in every market, regardless of pack:** (a) tenant-level **read + export always work**, in every billing state — no pack may weaken this; (b) an **erasure workflow exists product-side** in every market — erasure is anonymisation, never row deletion, with the pack declaring the statutory retention carve-outs (from `pack.tax`, F1-13) that financial records honor. Packs may strengthen rights; they can never subtract these.
- **F1-32** (P0) — **Statutory retention (IN): GST financial records are retained 6+ years** — the erasure carve-out period `pack.data-rights` honors (F1-57): proposals, invoices and payment records outlive an erasure request for this period.
- **F1-54** (P0) — **IN determination (DPDP Act / DPDP Rules 2025):** the platform is **Data Fiduciary** for tenant users' PII and **Data Processor** for the EPC's customer data — the tenant is fiduciary for their customers; DPA terms ride in the subscription agreement. This is the IN instance of F1-23; any new market authors its own before tenants exist there (F1-05).
- **F1-55** (P0) — **IN residency:** all PII/primary data resides in India; payment instruments never touch the platform (F1-43); cross-border object storage is permitted under DPDP's **negative-list transfer model** — with a documented migration path if the list changes.
- **F1-56** (P0) — **IN rights map — access/export and correction:** tenant-level read + export always work regardless of billing state (the F1-24 law, IN instance); individual data-principal export is a support-backed workflow — JSON/CSV of all rows keyed to the principal, **30-day SLA**; correction happens in-app through the ordinary record edit.
- **F1-57** (P0) — **IN erasure = anonymisation, never row deletion:** PII fields are overwritten — name becomes "Erased", phone becomes a keyed hash that preserves dedupe integrity — while financial/tax records (proposals, invoices, payments) are retained for the statutory period (F1-32). User accounts follow deactivate-never-delete with the same anonymisation.
- **F1-58** (P0) — **IN consent records:** per-customer voice-call consent, recording consent, and DND/do-not-call flags — each with timestamps and source — are stored, surfaced pre-dial (the gate read, M07), and **exported on request**.
- **F1-59** (P0) — **IN breach duty:** notify the Data Protection Board and affected data principals; a grievance contact is published in-app.

*Note:* the in-app grievance-contact surface of F1-59 rides the app shell (SCR-SHELL-01); this task owns the breach-notification duty and the determination/consent/erasure data and workflow.

*Deferred:* parked by owner ruling until the tenant base reaches real-customer scale — roughly 10–20 paying customers, where a full privacy build earns its cost.

**Depends on:** the owner unparking it (the *Deferred* note above) · the customer record (`M02`, block 3), which erasure anonymises · the consent records of the calling module (`M07`), which `F1-58` exports — voice calling is postponed, so `F1-58`'s consent proof waits with voice and is proven when it returns.
**Ruled at `/start`:** **the owner kept this task parked and moved it to block 8**, so the build line stops offering it as ready; it builds when the owner unparks it.

**DONE WHEN:**

- Given a market pack presented for launch, when it is validated, then its `pack.data-rights` key carries the jurisdiction's determination — roles, residency, rights map, breach duties and required consent records (F1-23, with F1-05).
- Given any market, when tenant-level read or export is attempted in any billing state, then it works; and when erasure is requested, then the anonymisation workflow exists with the pack's retention carve-outs honored (F1-24).
- Given the IN privacy determination, when it is consulted, then the platform's fiduciary/processor roles, the DPA terms and the residency rules read exactly as F1-54 and F1-55 declare them (F1-54, F1-55).
- Given a data-principal export request, when support fulfils it, then JSON/CSV of all rows keyed to the principal is delivered within 30 days; and given an erasure, then anonymisation runs with financial records retained for the statutory period (F1-56, F1-57, F1-32).
- Given a customer who declines call recording, when the call proceeds, then they are still served and the declination lands as a consent record with timestamp and source (F1-39, F1-58). *(Waits with voice calling, postponed: proven when it returns.)*
- Given a breach event, when duties trigger, then the Data Protection Board and affected principals are notified and the grievance contact is published in-app (F1-59).

**Settle before the build:**
- Data-rights request record — ruled: no stored request entity; an export or erasure request and its completion are the two `audit_log_entry` rows F2-22 names, the F1-56 30-day SLA is the gap between them, export runs as the support-backed workflow, erasure as the product-side anonymisation action, and correction as the ordinary record edit with no request at all (F1-56 names support tooling, F1-24/F1-57 a product action and F2-22 the audit entries — no row asks for a request state, SLA clock or outcome beyond those two entries, and a dedicated entity would be a shape nothing in the PRD reads).

---

## Laws (enforced through screens and review, no standalone build)

Each row below is carried verbatim and is followed by what enforces it. Nothing here is a separate build: every law is either a property another bucket's screens and engines must exhibit, or a discipline the PRD review applies to the suite.

### From `docs/prd/01-product-overview.md` — the product laws

- **OV-04** (P0) — The product replaces the spreadsheet-and-rekeying pipeline with **one record that travels**: CRM → survey → 3D design → proposal → no-login customer link → voice-agent follow-up → light project tracking → payments. No stage re-enters data an earlier stage already holds.
  *Enforced by:* every module task's hand-off contract (the shipped CRM (`docs/prd/modules/M02-crm-and-leads.md`) → `docs/tasks/M04-survey.md` → `docs/tasks/M06-proposals.md` → `docs/tasks/F5-customer-link.md` → the shipped sales execution (`docs/prd/modules/M07-sales-execution.md`) → the shipped projects (`docs/prd/modules/M08-projects.md`) → `docs/tasks/M11-payments-collections.md`); review rejects any screen that re-keys a value an upstream stage already holds.
- **OV-06** (P0) — The owner signs up **self-serve**, with phone number and one-time password. Nothing about acquiring the product requires a sales conversation at the entry tiers.
  *Enforced by:* `SCR-M01-01` and `SCR-M01-02` (phone + OTP + company name, no sales step).
- **OV-07** (P1) — Google Login is offered alongside Mobile OTP as a second authentication route. This is new in V2 and not present in the v1 source, which is OTP-only.
  *Enforced by:* `SCR-M01-01` (both routes present on the one sign-in surface).
- **OV-08** (P0) — Mobile is **field-first and never a follow-up**: it is built in lockstep with web, carrying My Day, leads, quick-add, surveys, visits and notifications, with the studio reached through an embedded web surface.
  *Enforced by:* the mobile-first construction of every screen task in `docs/tasks/`; review rejects a capability specified web-only without a recorded rationale.
- **OV-09** (P0) — Every screen is designed mobile-first at 375 px with **full web parity** — the small screen is the design constraint, not a reduced edition.
  *Enforced by:* the DONE WHEN clause every screen task in this suite carries — three base states plus brief-listed states at 375px and 1536px with full parity.
- **OV-21** (P0) — **Conviction 1 — the studio is the flagship, and nothing is compromised against it.** Every studio tool and every computed output survives into V2. The studio is touch-first with full parity on every surface, including 375 px mobile. When a studio requirement conflicts with a convenience elsewhere, the studio wins.
  *Enforced by:* review rejects any studio capability dropped or downgraded.
- **OV-22** (P0) — **Conviction 2 — honesty is a feature.** Every user-visible number carries a provenance tier (measured / derived / estimated / assumed — exactly four, no screen invents a fifth). Money never renders while stale. Structural adequacy is never computed — an engineer signs off. Competitors sell certainty; this product sells numbers that can be defended when a customer compares three proposals. Honesty is a differentiator that is marketed, not a disclaimer that is buried.
  *Enforced by:* `docs/prd/foundations/F8-data-honesty.md`'s mechanism as built in `docs/tasks/F-platform.md`, and every screen brief that renders a number; review rejects a fifth provenance tier or a stale money figure rendered as current.
- **OV-23** (P0) — **Conviction 3 — market-config-first.** Every market fact — tax scheme, incentive model, compliance and calling rules, certification schemes, payment rails, units, number formats, stage labels, document checklists, catalog scope and currency — lives in an injected market-configuration layer, never hard-coded into a module. Launching a market is authoring its pack: configuration, not product change.
  *Enforced by:* T-FCORE-001 through T-FCORE-010 (the pack framework and its eight keys); review rejects any module-level market constant.
- **OV-24** (P0) — Conviction 3 restated for V2: **India is the first market pack, not the product's identity.** The source's India-native behaviour — GST-native money path, PM Surya Ghar subsidy slabs, DISCOM-aware project states, TRAI-compliant calling, ₹ lakh/crore grouping, EN/HI/MR interface — is documented as the complete first pack in `foundations/F1-global-market-framework.md`, and module bodies stay market-neutral and reference pack keys. Launch is India-only; the structure is global.
  *Enforced by:* T-FCORE-001 (one authored pack at launch) and the IN instance tasks T-FCORE-002 through T-FCORE-010.
- **OV-25** (P0) — Everything the source states as a price, a benchmark or a mandate mechanic is **the India market's price book**, not the generic model. No number from that book is treated anywhere in this suite as a universal product fact, and no market's prices are ever derived by currency conversion from another market's (the no-FX rule is DD6, design spec §2).
  *Enforced by:* T-FCORE-010 (the price-book law and the India book as an instance, with no FX derivation).
- **OV-26** (P0) — **The soft-block law** — The product soft-blocks, never hard-blocks. In every billing state — including halted, expired and cancelled — reading everything, searching, dashboards, export (data, CSV, existing proposal documents), the customer's own links and the billing screens with pay/upgrade/reactivate all continue to work. Blocked mutations fail with a clear state banner and a route to reactivate. No data is ever deleted for non-payment. The EPC's customer is never punished for the EPC's billing state.
  *Enforced by:* T-FCORE-014's state capability matrix, implemented as the billing-state gate in the billing code and surfaced by `SCR-SHELL-06`.
- **OV-27** (P0) — **Entitlements are the only gating** — There are no feature flags in the product. Features ship enabled. The single runtime mechanism that can stop a user from doing something they have permission to do is a billing entitlement.
  *Enforced by:* the billing entitlements as the sole runtime gate; review rejects any feature flag in any task.
- **OV-28** (P0) — **Capacity, not features** — Commercial tiers gate capacity ceilings, usage counts and metered bundles — never features. Every module and every capability is present in every tier. Caps are upgrade signals and abuse bounds, never feature ransoms.
  *Enforced by:* T-FCORE-012's capacity axis and T-FCORE-010's book rows; review rejects a tier-withheld capability.
- **OV-29** (P0) — **The organisation pays, and seats are not the meter** — One subscription per tenant, owner-administered, covering every employee. There is no per-seat pricing: per-seat pricing punishes whole-company adoption, and whole-company adoption is what makes the single travelling record work at all.
  *Enforced by:* T-FCORE-011's meter set and the one org-level subscription.
- **OV-30** (P0) — **The one seat-based exception** — Active field-worker **tracking** is the single per-tracked-seat add-on in the product, because it carries a real per-worker cost. Site check-in/out and visit logging are part of the core visit workflow and are included in every tier for every employee. The owner toggles tracking per employee; the meter counts tracked-seat-months. No other capability is ever priced per seat.
  *Enforced by:* T-FCORE-011 (the tracked-seat add-on boundary) and `docs/tasks/M09-field-workforce.md`'s owner toggle; review rejects a second per-seat price anywhere.
- **OV-31** (P0) — **Phone as identity** — A phone number is the identity anchor on both sides of the product: it is the login identity for users, unique in international format, and it is the deduplication key for customers, checked on capture from every channel. Users are deactivated, never deleted.
  *Enforced by:* `docs/tasks/M01-onboarding.md` (login identity, deactivate-never-delete), the shipped CRM (`docs/prd/modules/M02-crm-and-leads.md`) and `docs/tasks/M03-marketing.md` (dedupe on capture from every channel).
- **OV-32** (P0) — **The customer never logs in** — The EPC's customer has no account, no password and no portal. One tokenised link carries their whole relationship with the project — proposal, acceptance, payment status, progress, handover — and it is never blocked over unpaid platform money. Where a deal has several stakeholders, they get several labelled links, not accounts.
  *Enforced by:* `docs/tasks/F5-customer-link.md` and the customer-link row of T-FCORE-014's matrix; review rejects any requirement granting the EPC's customer a login.
- **OV-33** (P0) — **Progressive onboarding** — Nothing is required on day one of a tenant's life. Every setting has a working default, and a tenant can sign up and send a real proposal without opening a settings screen. Configuration happens in context — at the moment a user needs the thing being configured — and settings screens exist for revisiting, not for setup. Every configuration surface shows the effect of the setting.
  *Enforced by:* `docs/tasks/M01-onboarding.md`'s working defaults and in-context configuration paths.
- **OV-34** (P0) — **Vendor names are never product commitments** — Every external capability sits behind a capability boundary the product owns. Named vendors are v1 reference implementations, and swapping one is an adapter change, never a product change. Requirements in this suite name the capability ("one-time-password delivery", "subscription billing", "outbound voice"), and record the reference implementation as a note.
  *Enforced by:* T-FCORE-006's vendor-neutral capability ports with the IN reference adapters recorded as notes; review rejects a vendor name written as a requirement.
- **OV-35** (P0) — **The naming law: Proposal** — The customer-facing commercial document is a **Proposal** everywhere — as an entity, in interface copy and in customer-facing documents, in every launch locale. Per ruling R1 the words "quote" and "quotation" are banned from interface strings and identifiers throughout the product. The single exception is global search, which treats "quotation" and "quote" as query aliases for proposals, because that is what users in the field will type. There is no dual vocabulary anywhere.
  *Enforced by:* `docs/tasks/M06-proposals.md` and every brief's copy, with the search-alias exception in `docs/tasks/F-platform.md`'s one-search work; review rejects the banned words in any interface string or identifier.
- **OV-36** (P0) — **Module bodies stay market-neutral** — A module PRD never states a market fact. It states the behaviour and references the market-pack key that supplies the fact. India's values live in F1's India pack.
  *Enforced by:* T-FCORE-001's pack-key interface; review rejects a market fact stated inside any module task.
- **OV-43** (P0) — **v1 is the entire product.** There is no Launch-2, no v1.1 and no "later" bucket into which a capability can be deferred while still being counted as planned. A capability is either in v1 scope, or it is an explicit non-goal with a recorded rationale, or it is a recommendation with ONE home — its owning module's own **Later** line or `REC` row, stated with its rationale and never counted as planned. There is no fourth category, and a recommendation is never recorded twice. This is a scope law and carries no schedule: the calendar the source attached to it is superseded, and every source phrase of the form "ships in the N-day build" is read throughout this suite as "in v1 scope".
  *Enforced by:* review of the whole `docs/tasks/` set — every PRD row is dispositioned into a task, a law or a realized-elsewhere pointer, and no task carries a phase, a date or a deferral bucket.
- **OV-44** (P0) — The only honest exceptions to "shipped at launch" are three, and each is named rather than open-ended: (a) capabilities whose activation waits on a third party's approval process, where the product ships complete and activation follows the third party; (b) the explicitly spec-locked exclusions recorded as non-goals in §6 below; (c) utility-scale studio enhancements that continue immediately afterwards as ongoing investment in the flagship. **1 kW to 100 MW remains a v1 commitment.**
  *Enforced by:* T-FCORE-005 (the DLT/telephony activation clocks that gate activation, not scope), and the non-goals recorded in each module task.

### From `docs/prd/02-personas.md` — the persona laws

- **PS-01** (P0) — **Role decides the home screen, not a setting.** Every persona lands on the work in front of them, not on a generic dashboard they must navigate away from; the front door is derived from what the person is, never chosen in preferences. The source calls this "the single highest-leverage UX decision in the product".
  *Enforced by:* `SCR-SHELL-01`'s role-derived front door and each persona home brief; review rejects a preference that chooses a home screen.
- **PS-02** (P0) — The twelve personas named in §2 are the **fixed persona vocabulary of the suite**. Every module and foundation PRD names its audience from this list, using these exact names; a document that needs a thirteenth persona raises the need with the owner rather than coining one.
  *Enforced by:* review of every screen's persona list; a thirteenth persona name is a defect.
- **PS-03** (P0) — **A persona is a job; a role is the grant of access.** The two sets are deliberately different sizes, one person may hold several roles at once, and access is resolved by F2's rules — permission granted if **any** held role grants it, lead visibility taking the **widest** scope among them. No persona section in this document grants, implies or restricts a permission.
  *Enforced by:* `docs/tasks/F-platform.md`'s F2 role-union resolution; review rejects a permission grant written against a persona rather than a role.
- **PS-04** (P0) — **Every persona sits inside one of the three audiences** of `01` §2 — Owner or Employees. No persona in this suite is the EPC's customer, and no persona-level requirement may imply a customer login: the customer reaches the product through one tokenised link and never acquires an account.
  *Enforced by:* `docs/tasks/F5-customer-link.md` (no-login link) and review of every brief's persona list (see OV-32).
- **PS-05** (P1) — **One person, one home.** Someone holding several roles gets a **single** home screen — the one for their widest role, with the other roles' work composed inside it — and can switch, "not two competing home screens". A person who both sells and surveys lands on My Day with today's visits shown inside it.
  *Enforced by:* `docs/tasks/M13-dashboards.md`'s composed-home rule and `SCR-SHELL-01`; review rejects a second competing front door.
- **PS-14** (P0) — Surveying is a **capability, not a gatekeeper**: the survey is a task assignable to anyone who holds the capability — a dedicated Survey Engineer or a Sales Executive standing on the roof — and both use one capture flow. The persona describes whose job it usually is, never who is permitted to do it.
  *Enforced by:* `docs/tasks/M04-survey.md`'s single capture flow assignable on capability, not persona.
- **PS-17** (P0) — This persona also holds **sign-off authority**: reviewing a design and approving it, or returning it with comments pinned to what is wrong. In v1 this is a separate preset (`Engineer` — "reviews and signs off designs"); in V2 it is documented as a distinct **capability of the Design Engineer persona**, and the customer never sees an unapproved design.
  *Enforced by:* `docs/tasks/F5-customer-link.md`'s gate that no unapproved design reaches the customer link.
- **PS-19** (P0) — **Sign-off is a capability, and whoever performs it is not the person who drew it.** The reviewer's approval is the structural-safety record for the design, and returning a design sends it back to its author with comments attached to the specific problem. Whether the capability is granted by its own preset role or rides the Design Engineer preset is F2's decision.
  *Enforced by:* `docs/tasks/F-platform.md`'s F2 capability ruling.
- **M01-07** (P0) — **Session lifetimes and revocation.** Web sessions are 30 days rolling. Mobile has no fixed maximum while the person remains active: seven full days without foreground authenticated use expires the session and requires sign-in again. Opening or using the signed-in app in the foreground resets that inactivity window; background refresh, push handling and scheduled work never reset it. Mobile API tokens remain short-lived (≤10 minutes) and renew silently while the underlying session is valid. Deactivating a user, or a user's own "sign out everywhere", kills every device's access within ≤10 minutes. The revocation surface is the Team screen (M01-19).
  *Enforced by:* `docs/tasks/M01-onboarding.md`'s T-M01-025 (auth, session & account-lifecycle engine), consumed by `docs/tasks/M04-survey.md`, the shipped projects (`docs/prd/modules/M08-projects.md`) and `docs/tasks/M09-field-workforce.md`. *Rehomed 2026-08-07: the Field Technician platform law formerly carried here as `PS-24` ("Mobile sessions are long-lived") was swept from `docs/prd/02-personas.md` with the offline/sync deletion — no strike note was recorded there, and the row is absent while `PS-22`, `PS-23` and `PS-25` remain. The obligation is live, and with a concrete value, at `M01-07` above; nothing about it was ever a connectivity rule.*
- **PS-27** (P0) — **The installation surface shows no commercial figures.** No price, no discount, no tranche, no margin, no customer value appears on any screen this persona sees. v1 achieved this by giving crew no screen at all — "crew sees no money because crew sees no screen"; where V2 gives them a screen, the property must be preserved by the surface itself.
  *Enforced by:* `SCR-M08-05`, shipped in block 4; review rejects any money figure on an installation surface.
- **PS-28** (P1) — **Attribution survives a crew that never signs in.** Where the checklist is run by a coordinator rather than the crew, ticks are attributed to the coordinator and an optional free-text "done by" per step records the crew member's name. This fallback is not removed when crew accounts exist, because mixed crews are the normal case.
  *Enforced by:* the installation checklist's attribution (`SCR-M08-04`, shipped in block 4), retained alongside crew accounts.
- **PS-37** (P0) — Whatever a campaign captures becomes an ordinary lead: **the phone number is the identity and every capture dedupes on it, from every channel, every time.** A marketing-sourced enquiry that matches an existing customer surfaces as a duplicate before it is saved, not after.
  *Enforced by:* `docs/tasks/M03-marketing.md`'s capture path into the shipped CRM's dedupe-before-save (`docs/prd/modules/M02-crm-and-leads.md`) (see OV-31).

---

## Realized elsewhere

Context, positioning and persona-home rows this bucket dispositions but does not build. Each carries its verbatim text and the pointer that realizes it.

### From `docs/prd/01-product-overview.md` — vision, goals and moat

- **OV-01** (P0) — HelioGrid is a multi-tenant SaaS that runs the **selling engine** of a solar EPC company — from a lead captured in under thirty seconds to a signed project with money collected. Every module in the suite exists to serve that spine or to keep it honest.
  *Realized by:* all modules M01–M13 (the selling-engine spine) — `docs/tasks/M01-onboarding.md` through `docs/tasks/M13-dashboards.md`
- **OV-02** (P0) — V2's framing is global: the world's best **mobile-first SaaS platform for solar EPC companies**, mobile-first without compromising web, global from the outset, with the 3D Design Studio as the flagship. The source's product definition is India-worded — "the selling engine of an *Indian* solar EPC company" — and OV-01 states it with that wording globalized; both readings are on the record.
  *Realized by:* informative; the global framing is carried by `docs/prd/foundations/F1-global-market-framework.md` (T-FCORE-001)
- **OV-03** (P0) — The flagship asset is a full **3D Design Studio** producing engineering-grade layouts, shading analysis, electrical sizing and a priced bill of materials, across a box that runs from 1 kW rooftops to 100 MW plants.
  *Realized by:* the 3D Design Studio, rebuilt from scratch — no PRD or task yet
- **OV-05** (P0) — The buyer is the **EPC organisation**. Both residential and commercial & industrial business are first-class and both are high volume (D1); deal values in the source's India framing span roughly ₹4.5 lakh to ₹92 lakh+ — customer deal size, not platform pricing.
  *Realized by:* informative (T-FCORE-012's tier structure)
- **OV-10** (P0) — **Close more deals** — The product's job is conversion, not record-keeping. Every surface that touches a live opportunity — My Day, follow-ups, the voice agent, the proposal, the customer link — is measured by whether it moves a deal forward.
  *Realized by:* `docs/prd/modules/M07-sales-execution.md`, `docs/prd/modules/M06-proposals.md`, `docs/prd/foundations/F5-customer-link.md`, `docs/prd/modules/M13-dashboards-and-reporting.md`
- **OV-11** (P0) — **Reduce sales-cycle time** — Elapsed time from enquiry to signature is a first-class product metric. Stage conversion and cycle time are reportable (M13), and every hand-off between stages is designed to remove waiting rather than to add a step.
  *Realized by:* `docs/prd/modules/M13-dashboards-and-reporting.md`
- **OV-12** (P0) — **Reduce operational work** — The product absorbs coordination that today lives in spreadsheets, WhatsApp threads and people's heads. Fewer manual touches per deal is a design goal in every module, not a side effect.
  *Realized by:* informative — a design goal carried in every module task
- **OV-13** (P1) — **Automate repetitive tasks** — Follow-up queues, reminders, wake-ups, sweeps and the voice agent do the work a rep would otherwise do from memory. Automation is always visible and always attributable — the user can see what a machine did on their behalf.
  *Realized by:* `docs/prd/modules/M07-sales-execution.md`
- **OV-14** (P1) — **Improve field visibility** — The office can see where field work is happening and what state it is in: attendance, site check-in/out, visit tracking, route timeline, live location for tracked employees (M09). Visibility is for coordination, and its scope is bounded by what an EPC actually needs.
  *Realized by:* `docs/prd/modules/M09-field-workforce.md`
- **OV-15** (P0) — **Improve proposal quality** — The proposal is the artefact the customer judges the EPC by. Quality means a real 3D roof, defensible numbers with their provenance shown, correct local tax and incentive treatment, and the EPC's own branding — not a prettier template.
  *Realized by:* `docs/prd/modules/M06-proposals.md`, `docs/prd/foundations/F8-data-honesty.md`
- **OV-16** (P0) — **Centralize operations** — One system of record for the EPC: leads, surveys, designs, proposals, projects, money, people and field activity in one place, with one search across them. Centralization is what makes OV-04's travelling record possible.
  *Realized by:* `docs/prd/foundations/F6-notifications-and-search.md` (one search) and all modules
- **OV-17** (P0) — **Affordable for small EPCs** — A one-to-five-person residential shop must be able to run its whole business on the product without price being the reason it stays on spreadsheets.
  *Realized by:* informative (T-FCORE-010's IN book)
- **OV-18** (P1) — **Scale to enterprise** — The same product serves utility-scale work — the largest designs in the box, the widest teams, custom commercial terms and white-label customer-facing surfaces — without a separate edition or a rewrite.
  *Realized by:* informative
- **OV-19** (P0) — **Global from day one** — Market differences are configuration, never product change. "Day one" here is the brief's phrase for *from the outset* — it is an architectural commitment and carries no date, no phase and no schedule.
  *Realized by:* `docs/prd/foundations/F1-global-market-framework.md` (T-FCORE-001 through T-FCORE-010)
- **OV-20** (P0) — **A price for every EPC** (source anchor for OV-17 and OV-18) — The reach implied by OV-17 and OV-18 is source-anchored: the entry tier exists so that price is never the reason a small EPC stays on spreadsheets, and the top of the range is a sales-assisted tier for utility-scale and open-access work.
  *Realized by:* informative (the tier structure at T-FCORE-012 and the book at T-FCORE-010)
- **OV-37** (P0) — **The AI voice agent** — outbound follow-up and inbound answering in the customer's own language, statutorily compliant by construction, every call transcribed onto the lead timeline, with per-tenant numbers. No competitor offers this at any price. The compliance gate's mechanism is fixed; its statutory ruleset is market-pack data, and a market with no voice ruleset cannot enable outbound voice. Where a telephony capability is genuinely unavailable behind the current reference implementation, the product degrades honestly rather than pretending.
  *Realized by:* `docs/prd/modules/M07-sales-execution.md` + `docs/prd/foundations/F1-global-market-framework.md` (T-FCORE-004's ruleset key, T-FCORE-005's IN routes)
- **OV-38** (P0) — **The provenance and honesty system** — a provenance tier on every number, money never stale, visible "Indicative proposal" labelling, engineer sign-off instead of a computed structural claim, correlation rather than attribution on agent impact. Competitors print confident numbers; this product prints defensible ones.
  *Realized by:* `docs/prd/foundations/F8-data-honesty.md` — `docs/tasks/F-platform.md`
- *Row removed 2026-08-07 by owner decision: `OV-39` (the offline-first field app as a competitive moat) was deleted with the offline/sync capability.*
- **OV-40** (P0) — **Vernacular interface** — a per-user interface language across the launch locales, correct Devanagari rendering in generated documents, and market-correct number grouping. The field workforce is not English-first, and no rival acknowledges it. Number grouping is market-pack behaviour; the multi-language capability is F3's.
  *Realized by:* `docs/prd/foundations/F3-localization.md` + `docs/prd/foundations/F7-design-language.md`, with grouping from `docs/prd/foundations/F1-global-market-framework.md` (T-FCORE-008's F1-46/F1-47)
- **OV-41** (P0) — **Two-tier catalog with tenant price overrides** — a platform master catalog plus tenant catalog plus tenant overrides, with versioned rates so a proposal that has been sent never mutates. The closest rival's local database has no override or versioning layer.
  *Realized by:* `docs/prd/modules/M01-onboarding-and-tenant-config.md` — `docs/tasks/M01-onboarding.md`
- **OV-42** (P0) — **Organisation pricing with unlimited seats under incumbent prices** — a business-model feature, because whole-company adoption is what makes the single travelling record actually work. Unlimited seats is not unlimited usage: capacity and counts still apply per tier.
  *Realized by:* informative (the book at T-FCORE-010)

### From `docs/prd/02-personas.md` — the twelve personas and their home screens

Each persona-definition row is realized by that persona's F2 section and its owning module; each home-screen row is realized by the brief that specifies that home screen, where its verbatim text already lives as the specification.

- **PS-06** (P0) — The **EPC Owner** persona is the person who buys and administers the tenant — the proprietor or director of the solar EPC. Their scope is the whole business: every lead, every design, every project, every unit of money in the tenant's currency, every setting. The source states it flatly: "The business owner. Everything, always. Cannot be deleted or restricted."
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §EPC Owner
- **PS-07** (P0) — The EPC Owner's **home screen is the pipeline dashboard**, led by the honest attention list — deals stuck or aging, proposals sent and not opened, projects blocked, payments overdue — each item deep-linking to the thing itself, followed by cash collected versus due, pipeline by stage, this period against last, forecast marked a projection, and win/loss.
  *Realized by:* `SCR-M13-02` (screen owned by `docs/tasks/M13-dashboards.md`)
- **PS-08** (P0) — The **Sales Manager** persona runs a selling team. Their scope is the team's leads — seeing them, reassigning them, building and sending proposals against them — and explicitly **not** the company's settings, catalog or billing. Lead visibility is team-wide, one step narrower than the owner and one wider than the executive.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Sales Manager
- **PS-09** (P0) — The Sales Manager's **home screen is the same dashboard the owner lands on, scoped to their team** — the attention list, cash and pipeline restricted to the team's deals — with the team's per-rep view reachable from it. The source assigns the owner dashboard to "Owner (+ manager, team-scoped)" and makes the same screen serve both, scoped, rather than building a second one.
  *Realized by:* `SCR-M13-02` (screen owned by `docs/tasks/M13-dashboards.md`)
- **PS-10** (P0) — The **Sales Executive** persona sells. Their scope is their **own** leads, their own proposals and their own follow-ups — capture, qualify, book the survey, build and send the proposal, chase it, and mark it won or lost with a reason.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Sales Executive
- **PS-11** (P0) — The Sales Executive's **home screen is My Day** — "not a dashboard of numbers, a list of what to do today", in a fixed order: **overdue** first and always visually first, **today's** timed items, a separate **agent activity** block for what the automation did on their behalf, then **upcoming**. Snoozed and dormant leads are excluded until they wake.
  *Realized by:* `SCR-M07-01` (shipped in block 6)
- **PS-12** (P0) — The **Survey Engineer** persona visits sites and captures what a design cannot be built without: roof, electrical, shading, access and structural observations — the last "observations only, never a verdict". Their visibility is limited to what they are assigned.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Survey Engineer · `docs/prd/modules/M04-survey.md`
- **PS-13** (P0) — The Survey Engineer's **home screen is today's site visits** — each with address, customer, time, distance, one-tap navigation and one-tap call.
  *Realized by:* `SCR-M04-06` (screen owned by `docs/tasks/M04-survey.md`)
- **PS-15** (P0) — The **Design Engineer** persona builds the system: roof geometry, obstructions, components, panel layout, shading analysis, the single-line diagram and the priced bill of materials, plus the variants a customer needs to choose between. In v1 vocabulary this is the `Designer` preset — source wording "builds designs and quotes", read as **proposals** per R1's naming law — with assigned-only visibility.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Design Engineer
- **PS-16** (P0) — The Design Engineer's **home screen is designs awaiting work** — the queue of surveys handed over and designs in progress, with the blocking gaps named per item.
  *Realized by:* the 3D Design Studio, rebuilt from scratch — no PRD or task yet
- **PS-18** (P0) — Where a person holds sign-off, their **home screen carries the sign-off queue — designs awaiting review, oldest first** — composed into the one home rather than presented as a second front door (`PS-05`).
  *Realized by:* the 3D Design Studio, rebuilt from scratch — no PRD or task yet
- **PS-20** (P0) — The **Project Manager** persona owns a won deal from signature to handover: moving it through the stage chain, keeping the document checklist complete, naming blockers with the party responsible, requesting the payment each completed stage makes due, and keeping the customer's progress view honest.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Project Manager · `docs/prd/modules/M08-projects.md`
- **PS-21** (P0) — The Project Manager's **home screen is their projects ordered by days-in-stage, oldest first** — a blocker flags a card and never reorders it (owner ruling 2026-09-24) — each card showing customer, size, value, days in the current stage, payment collected against payment due, and the blocker flag with who is being waited on.
  *Realized by:* `SCR-M08-01` (shipped in block 4)
- **PS-22** (P0) — The **Field Technician** persona is the employee whose working day is a sequence of places rather than a desk: site visits, service calls, deliveries and checks, with check-in and check-out at each, an activity timeline behind them and attendance derived from the day they actually worked.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Field Technician · `docs/prd/modules/M09-field-workforce.md`
- **PS-23** (P1) — The Field Technician's **home screen is their route today** — the assigned stops in order, each with address, customer, window, distance, one-tap navigation and one-tap call, plus their current check-in state.
  *Realized by:* `SCR-M09-02` (screen owned by `docs/tasks/M09-field-workforce.md`)
- **PS-25** (P0) — The **Installation Team Member** persona is the crew who physically install the system: working the installation checklist — foundation, legs, rafters, purlins, modules, stringing, balance of system — derived from the structural model, ticking steps as they are completed and attaching photos as evidence.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Installation Team Member · `docs/prd/modules/M08-projects.md`
- **PS-26** (P1) — The Installation Team Member's **home screen is today's installation** — the assigned job, its checklist with progress, the site's access constraints and the photos expected — and nothing else.
  *Realized by:* `SCR-M08-05` (shipped in block 4)
- **PS-29** (P0) — The **HR/Admin** persona keeps the people side of the company correct: inviting and onboarding employees, keeping their records and documents current, tracking attendance and leave, and deactivating people cleanly when they leave. The scope is SME-weight — only what supports EPC operations, without enterprise HR complexity.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §HR/Admin · `docs/prd/modules/M10-hr-lite.md`
- **PS-30** (P2) — The HR/Admin's **home screen is people today** — invitations pending or expired, joiners part-way through onboarding, today's attendance exceptions, leave awaiting a decision, and employee documents needing attention (scope per M10).
  *Realized by:* `SCR-M10-01` (screen owned by `docs/tasks/M10-hr-lite.md`)
- **PS-31** (P0) — The **Finance** persona owns money correctness: the collection schedule each project inherits from its proposal's payment terms, recording what has been received against which tranche with its mode and receipt, keeping revenue honest as projects change or cancel, and holding the tenant's side of tax and invoicing per the market pack.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Finance · `docs/prd/modules/M11-payments-and-collections.md`
- **PS-32** (P1) — The Finance persona's **home screen is money due** — tranches due now and overdue by project, receipts waiting to be recorded, and the period's collections against what was expected — with every figure obeying the money-never-stale rule.
  *Realized by:* `SCR-M11-01` (screen owned by `docs/tasks/M11-payments-collections.md`)
- **PS-33** (P0) — The **Operations** persona keeps the whole portfolio moving: every project's blockers seen together and attributed to a party, aging visible across the board, document and stage hygiene enforced, and the field workforce's day visible as a whole. Their unit of work is the portfolio, where the Project Manager's is one project.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Operations · `docs/prd/modules/M08-projects.md`, `docs/prd/modules/M09-field-workforce.md`
- **PS-34** (P1) — The Operations persona's **home screen is blockers by party, oldest first** — everything waiting on us before everything waiting on someone else — with aged projects by days-in-stage beneath it and the field team's current day alongside.
  *Realized by:* `SCR-M13-03` (screen owned by `docs/tasks/M13-dashboards.md`)
- **PS-35** (P0) — The **Marketing** persona runs demand generation: campaigns across the channels the brief names — email, messaging, social and SMS — capturing the enquiries those campaigns produce and feeding them into the sales pipeline as leads that dedupe like any other.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Marketing · `docs/prd/modules/M03-marketing.md`
- **PS-36** (P1) — The Marketing persona's **home screen is live campaigns and what they captured** — each campaign with its channel, its state and the enquiries it produced, plus captured leads not yet triaged into the pipeline, and whatever campaign-and-channel reporting M03 defines.
  *Realized by:* `SCR-M03-01` (screen owned by `docs/tasks/M03-marketing.md`)

---

## Disposition index

| Row | Disposition |
|---|---|
| OV-01 | realized-by: all modules M01–M13 (the selling-engine spine) |
| OV-02 | realized-by: informative; global framing carried by `docs/prd/foundations/F1-global-market-framework.md` |
| OV-03 | realized-by: the 3D Design Studio, rebuilt from scratch — no PRD or task yet |
| OV-04 | LAW |
| OV-05 | realized-by: informative |
| OV-06 | LAW |
| OV-07 | LAW |
| OV-08 | LAW |
| OV-09 | LAW |
| OV-10 | realized-by: `docs/prd/modules/M07-sales-execution.md`, `docs/prd/modules/M06-proposals.md`, `docs/prd/foundations/F5-customer-link.md`, `docs/prd/modules/M13-dashboards-and-reporting.md` |
| OV-11 | realized-by: `docs/prd/modules/M13-dashboards-and-reporting.md` |
| OV-12 | realized-by: informative (a design goal in every module) |
| OV-13 | realized-by: `docs/prd/modules/M07-sales-execution.md` |
| OV-14 | realized-by: `docs/prd/modules/M09-field-workforce.md` |
| OV-15 | realized-by: `docs/prd/modules/M06-proposals.md`, `docs/prd/foundations/F8-data-honesty.md` |
| OV-16 | realized-by: `docs/prd/foundations/F6-notifications-and-search.md` (one search) and all modules |
| OV-17 | realized-by: informative |
| OV-18 | realized-by: informative |
| OV-19 | realized-by: `docs/prd/foundations/F1-global-market-framework.md` |
| OV-20 | realized-by: informative |
| OV-21 | LAW |
| OV-22 | LAW |
| OV-23 | LAW |
| OV-24 | LAW |
| OV-25 | LAW |
| OV-26 | LAW |
| OV-27 | LAW |
| OV-28 | LAW |
| OV-29 | LAW |
| OV-30 | LAW |
| OV-31 | LAW |
| OV-32 | LAW |
| OV-33 | LAW |
| OV-34 | LAW |
| OV-35 | LAW |
| OV-36 | LAW |
| OV-37 | realized-by: `docs/prd/modules/M07-sales-execution.md`, `docs/prd/foundations/F1-global-market-framework.md` |
| OV-38 | realized-by: `docs/prd/foundations/F8-data-honesty.md` |
| OV-40 | realized-by: `docs/prd/foundations/F3-localization.md`, `docs/prd/foundations/F7-design-language.md`, `docs/prd/foundations/F1-global-market-framework.md` (grouping) |
| OV-41 | realized-by: `docs/prd/modules/M01-onboarding-and-tenant-config.md` |
| OV-42 | realized-by: informative |
| OV-43 | LAW |
| OV-44 | LAW |
| PS-01 | LAW |
| PS-02 | LAW |
| PS-03 | LAW |
| PS-04 | LAW |
| PS-05 | LAW |
| PS-06 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §EPC Owner |
| PS-07 | realized-by: T-M13-002 — `SCR-M13-02` |
| PS-08 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Sales Manager |
| PS-09 | realized-by: T-M13-002 — `SCR-M13-02` |
| PS-10 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Sales Executive |
| PS-11 | realized-by: T-M07-001 — `SCR-M07-01` |
| PS-12 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Survey Engineer · `docs/prd/modules/M04-survey.md` |
| PS-13 | realized-by: T-M04-006 — `SCR-M04-06` |
| PS-14 | LAW |
| PS-15 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Design Engineer |
| PS-16 | realized-by: the 3D Design Studio, rebuilt from scratch — no PRD or task yet |
| PS-17 | LAW |
| PS-18 | realized-by: the 3D Design Studio, rebuilt from scratch — no PRD or task yet |
| PS-19 | LAW |
| PS-20 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Project Manager · `docs/prd/modules/M08-projects.md` |
| PS-21 | realized-by: T-M08-001 — `SCR-M08-01`, shipped |
| PS-22 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Field Technician · `docs/prd/modules/M09-field-workforce.md` |
| PS-23 | realized-by: T-M09-002 — `SCR-M09-02` |
| PS-24 | *removed 2026-08-07 — swept from `docs/prd/02-personas.md` with the offline/sync deletion (no strike note recorded there). The long-lived-mobile-session law is live at `M01-07` (Laws → persona laws, above; built at T-M01-025 in `docs/tasks/M01-onboarding.md`)* |
| PS-25 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Installation Team Member · `docs/prd/modules/M08-projects.md` |
| PS-26 | realized-by: T-M08-005 — `SCR-M08-05`, shipped |
| PS-27 | LAW |
| PS-28 | LAW |
| PS-29 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §HR/Admin · `docs/prd/modules/M10-hr-lite.md` |
| PS-30 | realized-by: T-M10-001 — `SCR-M10-01` |
| PS-31 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Finance · `docs/prd/modules/M11-payments-and-collections.md` |
| PS-32 | realized-by: T-M11-001 — `SCR-M11-01` |
| PS-33 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Operations · `docs/prd/modules/M08-projects.md`, `docs/prd/modules/M09-field-workforce.md` |
| PS-34 | realized-by: T-M13-003 — `SCR-M13-03` |
| PS-35 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Marketing · `docs/prd/modules/M03-marketing.md` |
| PS-36 | realized-by: T-M03-001 — `SCR-M03-01` |
| PS-37 | LAW |
| F1-01 | T-FCORE-001 |
| F1-02 | T-FCORE-001 |
| F1-03 | T-FCORE-001 |
| F1-04 | T-FCORE-001 (structure) + T-FCORE-016 (storage) |
| F1-05 | T-FCORE-001 |
| F1-06 | T-FCORE-001 |
| F1-07 | T-FCORE-002 |
| F1-08 | T-FCORE-002 |
| F1-09 | T-FCORE-001 |
| F1-10 | T-FCORE-001 |
| F1-11 | T-FCORE-001 (structure) + T-FCORE-016 (storage) + T-FCORE-017 (stored-pack parser) |
| F1-12 | T-FCORE-001 |
| F1-13 | T-FCORE-002 |
| F1-14 | T-FCORE-003 |
| F1-15 | T-FCORE-004 |
| F1-16 | T-FCORE-004 |
| F1-17 | T-FCORE-004 |
| F1-18 | T-FCORE-006 |
| F1-19 | T-FCORE-007 |
| F1-20 | T-FCORE-007 |
| F1-21 | T-FCORE-008 |
| F1-22 | T-FCORE-008 |
| F1-23 | T-FCORE-009 |
| F1-24 | T-FCORE-009 |
| F1-25 | T-FCORE-010 |
| F1-26 | T-FCORE-010 |
| F1-27 | T-FCORE-010 |
| F1-28 | T-FCORE-002 |
| F1-29 | T-FCORE-002 |
| F1-30 | T-FCORE-002 |
| F1-31 | T-FCORE-002 |
| F1-32 | T-FCORE-009 |
| F1-33 | T-FCORE-003 |
| F1-34 | T-FCORE-003 |
| F1-35 | T-FCORE-003 |
| F1-36 | T-FCORE-004 |
| F1-37 | T-FCORE-005 |
| F1-38 | T-FCORE-005 |
| F1-39 | T-FCORE-004 |
| F1-40 | T-FCORE-006 |
| F1-41 | T-FCORE-006 |
| F1-42 | T-FCORE-006 |
| F1-43 | T-FCORE-006 |
| F1-44 | T-FCORE-007 |
| F1-45 | T-FCORE-007 |
| F1-46 | T-FCORE-008 |
| F1-47 | T-FCORE-008 |
| F1-48 | T-FCORE-008 |
| F1-49 | T-FCORE-008 |
| F1-50 | T-FCORE-008 |
| F1-51 | T-FCORE-008 |
| F1-52 | T-FCORE-008 |
| F1-53 | T-FCORE-008 |
| F1-54 | T-FCORE-009 |
| F1-55 | T-FCORE-009 |
| F1-56 | T-FCORE-009 |
| F1-57 | T-FCORE-009 |
| F1-58 | T-FCORE-009 |
| F1-59 | T-FCORE-009 |
| F1-60 | T-FCORE-010 |
| F1-61 | T-FCORE-010 |

