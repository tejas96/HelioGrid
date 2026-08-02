# 00 · Vision & Scope

Status: approved · Binding sources: `./product/product-journey.md` (the D1–D39 census, read through the `./15-spec-resolutions.md` overlay) · owner directives: `./15-spec-resolutions.md` §4

## The product in one page

**HelioGrid is a multi-tenant SaaS that runs the selling engine of an Indian solar EPC company** — from a lead captured in under 30 seconds to a signed project with money collected — around one flagship asset: a full 3D design studio that produces engineering-grade layouts, shading analysis, electrical sizing and a priced bill of materials from 1 kW rooftops to 100 MW plants.

Most Indian EPCs today run on Excel and WhatsApp. The market moment is PM Surya Ghar (1 crore households targeted, ~24% done as of Dec 2025 — the funnel is enormous and under-digitised; `./research/market.md`). HelioGrid replaces the spreadsheet-and-rekeying pipeline with one record that travels: **CRM → survey → 3D design → proposal → no-login customer link → voice-agent follow-up → light project tracking → payments.**

Three convictions shape everything:

1. **The 3D Design Studio is the flagship. Nothing is compromised against it.** Every studio tool and computed output from the validated engineering core survives the port (phase-10 tool census is the acceptance gate), touch-first, at full parity on every surface including 375 px mobile.
2. **Honesty is a feature.** Every user-visible number carries a provenance tier (measured / derived / estimated / assumed); money never renders while stale; structural adequacy is never computed — an engineer signs off. Competitors sell certainty; we sell trustworthy numbers.
3. **India-first, global-ready.** GST-native money path, PM Surya Ghar subsidy slabs, DISCOM-aware project states, TRAI-compliant voice calling, ₹ in lakh/crore grouping, EN/HI/MR UI — built on a market-config layer that is injected, not hard-coded, so new markets are configuration (binding since 2026-08-02: the "Market & money" block in docs/forward-compat.md).

Who buys: the EPC organisation (owner signs up self-serve, phone + OTP). Residential **and** C&I, both high volume (D1); deal values span ₹4.5L to ₹92L+.

## The nine-stage journey (v1 backbone)

Full detail in `./research/journey.md` §1. The stages, one line each:

| # | Stage | One line |
|---|-------|----------|
| 0 | **Company onboarding** | Owner signs up (phone → OTP), declares what they sell, invites team by phone number + role; demo Pune rooftop ready on day one. |
| 1 | **User onboarding** | Invited employee lands by role: rep → My Day, surveyor → today's visits, designer → designs awaiting, engineer → sign-off queue, owner → pipeline. |
| 2 | **Lead capture** | Quick add (4 fields, <30 s), phone number is identity — live dedupe on every channel; CSV import; lead inbox for morning triage. |
| 3 | **Qualify & assign** | Manual assignment with rep open-load visible (D14); inline qualification; book site visit; snooze is first-class ("call me after Diwali"). |
| 4 | **Site survey — two modes (D30)** | Remote (Google Solar imagery + AI roof detection, editable overlay, honest coverage failures) or physical (guided offline capture, sync when connected). |
| 5 | **Design** | The 10-step studio: site setup → roof drawing → obstructions → components → panel layout → 3D shadow view → captures → SLD → BOM → done. Variants side-by-side; engineer sign-off queue. |
| 6 | **Proposal** | One 11-step builder, two paths: Path A derived from the design/BOM; Path B without a design — estimated, and it must say "Indicative proposal". Components mandatory (D22). Versioned; server-assigned numbers. |
| 7 | **Follow-up, voice agent, close** | My Day for reps; AI voice agent follows up (proposal unopened 3 d, task overdue 2 d, on-demand), transcribes every call to the timeline, escalates to humans; Mark won creates the project. |
| 8 | **Projects (light)** | Status + documents + money only: stage board, tranche collections, document checklist, blockers with attribution (DISCOM / customer / material / us), handover + referral ask. |

**Parallel customer journey (C1–C13):** the EPC's customer never logs in. One tokenised link carries them from proposal (with the 3D roof) through acceptance, advance payment, the long DISCOM wait — made visible and attributable, not faster — to installation, commissioning and handover.

**Tenant configuration:** agent setup (guided + knowledge base + unanswered-questions loop), branding, two-tier catalog with price-book versions, proposal templates, payment terms, roles, message templates.

## v1 scope

**v1 = the ENTIRE product, shipped in ONE 20-day build (owner directive 2026-07-24, final): no Launch-2, no v1.1, no "later" bucket.** Sequencing inside the window follows the earlier priority ruling — studio and offline are the LAST tracks — but everything lands by Day 20 (`14-build-roadmap.md` is the plan of record):

- **Tracks A–C (Days 3–13):** auth/tenancy (Better Auth + MSG91 OTP, 6 preset roles) · **billing, subscriptions, entitlements and usage metering** (Razorpay Subscriptions; D38 superseded — billing IS in v1, trial-only, no free tier) · CRM (incl. customer-merge flow) · two-tier catalog · remote survey (satellite + AI detection) · proposal builder (Path B first, Path A seams complete) · tokenised customer link **incl. named links + OTP-at-accept** (D33 closed at launch) · projects + BYO-Razorpay tranche collections · voice agent (code-complete; activation rides the DLT/KYC clock) · notifications + global search · full dashboards.
- **Track M (Days 2–15, LOCKSTEP with web — owner directive):** bare React Native app (iOS + Android) built module-by-module in the SAME slices as web (auth → CRM → surveys → notifications), online-first behind repository interfaces; TestFlight/Play-internal from Day 5.
- **Track D (Days 14–18):** the 3D Design Studio port + enhancement — THE flagship; tool-census acceptance gate; Path A proposals + BOM activate; mobile WebView studio.
- **Track E (Days 17–20):** offline layer (PowerSync; mobile swaps to synced SQLite; physical survey fully offline) + hardening + launch gate.
- **Outside the 20 days, honestly:** only (a) third-party approval clocks (DLT, Exotel KYC, store review — code ships Day 20, activation follows the clocks), (b) spec-locked exclusions (D32/D29/D35/D9), and (c) utility-scale studio enhancements (scale Phases B/C: GPU shading, trackers, terrain) which continue immediately after as studio-moat investment. 1 kW → 100 MW remains a v1 commitment with the Phase-A foundations shipped in the 20 days.

## Explicit non-goals (v1)

Named so nobody "helpfully" builds them:

- **Inventory, purchase orders, crew scheduling, O&M, generation monitoring** (D9). Projects are status + documents + money. The data model retains commissioning artefacts so a future O&M surface can attach.
- **WhatsApp sending** (D32). The app renders the message and the rep pastes it into their own WhatsApp. Link opens are tracked; delivery is not. `MessagingPort` ships with the ManualCopyAdapter only; BYO-WABA is v2.
- **Custom roles** (D29). Six fixed presets, stackable, OR-across-roles, widest visibility; no per-person permission exceptions ever (D28).
- **LiDAR / photo measurement / AR capture** (D35). Survey photos — any source including drone — are *reference* for the designer, never measurement.
- **Discount approval workflows** (D34). The only guard is arithmetic: payable ≤ ₹0 blocks Generate.
- **Feature flags** (owner directive). Features ship enabled when merged. The only runtime gating in the product is billing entitlements.
- **PPA/OPEX operational billing** — the proposal type exists; metering/billing behind it does not (journey ambiguity #17, resolved as out of scope in `15-spec-resolutions.md`).
- **Website / inbound-WhatsApp lead channels** (D13) — manual, CSV import and inbound voice only.

## The three audiences

| Audience | Access | What they get |
|----------|--------|---------------|
| **Owner** | Full login, widest visibility | Pipeline dashboard, assignment, agent controls and queue, billing, tenant config, sign-offs. Their business, legible. |
| **Employees** | Login, role-scoped (Manager / Sales rep / Surveyor / Designer / Engineer) | Role decides the home screen; reps see own leads, managers team, owner everything (D20). Field roles get the offline-first RN app. |
| **The EPC's customer** | **No login — one tokenised link** (D5) | Proposal with their actual 3D roof, accept/negotiate, payment status, project progress with honest wait attribution, handover pack. Link lifecycle: proposal → progress → handover. Never blocked over unpaid money. |

Voice-agent calls are the fourth touchpoint: the agent serves the customer in their language (Hindi/Marathi/Gujarati/Tamil/Telugu/English), discloses it is automated within 30 seconds, and hands to a human on request.
