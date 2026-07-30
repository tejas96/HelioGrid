> **NORMATIVE** — still binding: a live document delegates authority to this file. Do not archive it without promoting its content first. Cited for its own section numbering by docs/00, docs/13 (gaps) and docs/15 §1 (the 18 rulings, which reuse this file’s §6 numbering). The vendored master spec is `docs/product/product-journey.md`; this is the architecture-facing extraction of it, and the two are not interchangeable.

I have read all 1768 lines in full plus cross-referenced the integration names against the companion docs. Returning the analysis directly.

---

# HelioGrid — Architecture Source Extraction from `docs/product-journey.md`

Source: `/Volumes/works-space/Solar-App-POC/docs/product-journey.md` (read in full, 1768 lines). Integration provenance cross-checked against `docs/NEW-PRODUCT-PLANNING-PROMPT.md`, `docs/build-plan.md`, `docs/phase-10-prompts.md`, `docs/product-spec.md`.

---

## 1. THE JOURNEY MAP

Nine stages (0–8) plus a parallel customer journey, tenant config, and cross-cutting surfaces. Each screen/workflow, one line:

### STAGE 0 — Company onboarding (owner, laptop)
- **Sign up** — Phone → OTP; company name, owner name, city. Nothing else.
- **What do you sell?** — Residential / C&I / both + typical system size; sets first-quote defaults.
- **Company profile** — Logo, GSTIN, address, bank details. Skippable, prompted at first proposal.
- **Invite team** — Add by phone number + role. Skippable.
- **You're ready** — Two doors: "Create your first lead" / "Try a demo project" (pre-loaded real Pune rooftop).

### STAGE 1 — User onboarding (invited employee, phone)
- **Invite landing** — "Rajesh invited you to HelioGrid — Suryodaya Solar", phone pre-filled.
- **OTP** — 6 digits, SMS auto-read where allowed.
- **Your profile** — Name, optional photo.
- **Your role, explained** — One card stating what the role can/cannot do.
- **First-run coach marks** — Max 3, on the landed screen, dismissible, never a carousel.
- (Rule) **Role decides the home screen** — rep→My Day, surveyor→today's visits, designer→designs awaiting, engineer→sign-off queue, owner→pipeline dashboard.

### STAGE 2 — Lead capture (anyone; dedupe is the core)
- **Quick add** — Name, phone, city, type (4 fields), live duplicate check on phone. <30s.
- **Lead inbox** — Unassigned/new leads from all channels, newest-first, source badge; owner's morning triage.
- **Duplicate found** — Shows existing owner + last contact; open existing / log enquiry on existing / create anyway (needs reason).
- **Import** — CSV upload → column map → preview → duplicate count before import.
- **Capture settings** — Website form snippet, WhatsApp number, which sources live.

### STAGE 3 — Qualify & assign (owner/manager assigns; rep qualifies)
- **Assign** — Pick rep or rule; shows each rep's current open load (D14).
- **Lead detail** — Header (name/phone/city/value/stage/owner) + timeline, site info, designs, proposals, tasks, files; actions Call/WhatsApp/Log activity/Book visit/Create design.
- **Qualification** — Inline: monthly bill ₹, roof ownership, roof type, shading obvious?, timeline, decision maker.
- **Book site visit** — Date/time/surveyor/address confirm; generates ready-to-paste confirmation (app does not send).
- **Disqualify** — Reason required (renting/budget/not interested/unreachable/already installed/wrong number).
- (Rule) **Snooze** — First-class action with wake-up date ("call me after Diwali").

### STAGE 4 — Site survey (TWO modes, D30)
**Mode A · Remote survey** (rep/designer at desk):
- **Address entry** — Search or drop pin, satellite preview with building highlighted.
- **Detecting** — Honest progress (fetching imagery · detecting roof · estimating shading).
- **Review detection** — Editable overlay (outline/obstructions/pitch/area), Accept/adjust/reject, per-detection confidence.
- **Coverage failure** — "No detailed roof data" → manual outline or book physical.
- **Gaps to fill** — What remote couldn't determine, each "ask customer" / "capture on site".

**Mode B · Physical survey** (assignable, offline-first):
- **My visits today** — Surveyor home: address/customer/time/distance, one-tap navigate + call.
- **Guided capture** — Step-by-step (Roof/Electrical/Shading/Access/Structural), progress bar, inline camera, each step skippable-but-flagged.
- **Shading capture** — Add obstruction, photograph, estimate height, tap-to-add on roof sketch.
- **Review & submit** — Captured/missing/flagged; submit notifies designer.
- **Sync status** — "3 surveys waiting · 47 photos · will upload on Wi-Fi", non-blocking.

### STAGE 5 — Design (designer, desktop/tablet; EXISTS in code, refactor not redesign)
- **Existing 10-step studio** — Site setup → roof drawing → obstructions → components → panel layout → 3D shadow view → proposal captures → single-line diagram → bill of materials → done.
- **Design list for a lead** — Variants side-by-side (size/generation/price/payback), one marked recommended.
- **Engineer sign-off queue** — Designs awaiting review, oldest first.
- **Sign-off / return** — Approve or return with comments pinned to the fault.

### STAGE 6 — Proposal (designer/rep builds, rep sends)
- **Proposal builder** — The 11 steps (Stage 6B).
- **BOM detail** *(Path A only)* — Line items (item/spec/qty/unit/rate/GST/total); internal, densest screen, mobile = card list + edit sheet.
- **Proposal versions** — v1 vs v2, what changed and why.
- **Proposal preview** — Exactly what customer sees.
- **Share** — Download PDF + Copy link + suggested message; rep pastes to own WhatsApp; "mark shared" starts the clock.
- **Link tracking** — Shared → opened → viewed duration. No "delivered" state.

### STAGE 6B — The Proposal Builder (two paths, one builder)
- **Path A (with design)** — numbers derived from BOM/model.
- **Path B (without design)** — numbers estimated/assumed; must print "Indicative proposal" disclaimer.
- **11 steps:** 1 Company · 2 Achievements (optional) · 3 Solar System Setup · 4 Performance Metrics (AI auto-fill) · 5 Financial Data (AI auto-fill) · 6 Project Timeline · 7 Payment Terms · 8 Components (mandatory gate) · 9 Terms & Conditions (optional) · 10 Client Details · 11 Bank Details (optional).
- **Modals:** Proposal Type (CAPEX / OPEX-PPA), Battery modal, Component Edit sheet (per type), Add 3D Design prompt, "Almost done" bank prompt.
- **Proposed Quick mode** — steps 1, 3, 8, 10 only; AI-fills 4/5; defaults 6/7/9/11.
- **Entry points:** Lead → Create proposal; Design complete → Generate proposal (Path A); Duplicate an earlier proposal (fastest, carries components).

### STAGE 7 — Follow-up, voice agent, close (rep + agent)
- **My Day** — Rep home: OVERDUE (red) / TODAY / AGENT ACTIVITY (separated) / UPCOMING THIS WEEK.
- **Agent settings** — On/off, live triggers, calling window, per-customer language, max attempts.
- **Agent queue** — Who is scheduled, when, why; owner can remove anyone.
- **Call result** — Timeline: outcome + one-line summary + interest signal + action; transcript/recording on tap.
- **Consent & eligibility** — Per customer: consent? DND? do-not-call flag? shown before dial.
- **Escalations** — Calls handed to human + reason.
- **Mark won** — Final value + expected install date; creates the project.
- **Mark lost** — Reason required (price/competitor/postponed/not reachable/roof unsuitable/financing failed).
- **Reopen** — Lost leads return; postponed auto-resurface on wake-up date.

### STAGE 8 — Project management (light: status + documents + money)
- **Projects board** — Won deals as cards by stage; customer/size/value/days-in-stage/payment collected vs due/blocker flag; aged cards surface.
- **Project detail** — Stage timeline + approved design + accepted proposal + payments + documents + blockers + activity.
- **Payments** — Tranche schedule; mark received, copy request message, record mode (UPI/NEFT/cheque), attach receipt.
- **Document checklist** — Signed proposal · advance receipt · net-metering application · DISCOM approval · subsidy application & sanction · commissioning cert · warranty docs · handover pack; each pending/uploaded/verified.
- **Blockers** — Reason + who waits on whom (DISCOM/customer/material/us).
- **Installation** — Reuses existing InstallationSheet (foundation→legs→rafters→purlins→modules→stringing→BOS).
- **Customer progress link** — Same tokenised URL; stages/done/waiting/expected dates.
- **Handover** — Document pack shared, project closed, referral asked.

### CUSTOMER JOURNEY (C1–C13) — no login, one link
C1 enquiry (speed of callback) · C2 first conversation · C3 site visit (may not happen — remote) · C4 the wait · C5 proposal arrives (link + 3D roof) · C6 they think · C7 follow-up (agent) · C8 decision (Accept/Negotiate/No) · C9 paying advance · C10 the long DISCOM wait · C11 installation · C12 commissioning & handover (ask referral) · C13 living with it (beyond v1).

### TENANT CONFIGURATION
- **Agent setup — guided** · **Opening line** · **Hand-over rules** · **Calling window** · **Test the agent** · **Change history** · **Business knowledge base** (About us/Products/Warranty/Process/Pricing/Subsidy/Financing/Objections) · **Unanswered-questions loop** · **Branding/Catalog/Price book/Proposal templates/Payment terms/Project timeline/Lead sources/Roles/Message templates**.

### AGENT PERFORMANCE
- **Agent performance** dashboard (calls, connect rate, outcomes, "what it saved you", "deals it touched" w/ correlation caveat) · **Call log** · **Unanswered questions** · **Usage** (no cap) · **Per-rep view** (manager-only).

### MULTILINGUAL, ROLES, DASHBOARDS, CROSS-CUTTING
- **Language picker** (per-user, own-script names) · **Team** · **Assign roles** (live plain-English line) · **Roles reference** (read-only) · **Invite person** · **Owner dashboard** · **Rep dashboard** · **Pipeline funnel + win/loss** · **Notifications + global search** · **Arc-bar mobile nav**.

---

## 2. LOCKED DECISIONS CENSUS (D1–D39)

| # | One-line | Architectural implication |
|---|---|---|
| **D1** | Residential AND C&I, both high volume | Data model must handle both segments; deal values span ₹4.5L–₹92L+; category flag on lead/proposal (Residential/Commercial). |
| **D2** | Full mobile parity at 375px, incl. design studio | Responsive/touch model mandatory everywhere; canvas tracing/3D need a touch interaction layer. |
| **D3** | Brand "Instrument" — graphite + brass, ink label on brass | Design-token layer; primary = brass `#C8842A` on ink `#1A1712`. |
| **D4** | ~~WhatsApp primary channel, email secondary~~ SUPERSEDED by D32 | — |
| **D5** | Customer never logs in — tokenised link only | No customer auth; **tokenised link entity** with lifecycle (proposal→progress→handover); public read endpoints. |
| **D6** | Tailwind + Radix in code; Claude Design for screens | Frontend stack fixed. |
| **D7** | Three audiences: owner, employees, EPC's customer | Two authenticated persona classes + one anonymous link persona; RBAC + public views. |
| **D8** | Voice agent calls customers + answers inbound | Telephony/voice service integration; call records on timeline. |
| **D9** | v1 = Sell + light project tracking; no inventory/PO/scheduling/O&M | Scopes project entity to status+docs+money; explicit non-goals. |
| **D10** | Voice agent defaults (follow up, FAQ, book, gauge; offers human for price) | Agent behaviour config; every call transcribed to lead timeline; "never negotiate" now configurable (D36). |
| **D11** | Self-serve signup; billing deferred (D38) | Signup = company + owner only; no trial/billing gate. |
| **D12** | App UI English; agent Hindi/Marathi/Gujarati/Tamil/Telugu+English | UI-lang superseded by D25; agent languages per-tenant/per-customer. |
| **D13** | Lead sources v1: manual, CSV import, inbound voice; website/WhatsApp deferred | Lead has `source` enum; WhatsApp outbound-only. |
| **D14** | Assignment manual, rep open-load visible; no auto-routing | Assignment entity + rep-load aggregation query; no rules engine v1. |
| **D15** | Survey = task assignable to anyone with capability; one capture flow | Survey task decoupled from role; single flow serving rep+surveyor. |
| **D16** | Customer sees one recommended system; designer may add variants | Design entity supports multiple variants with one `is_recommended`. |
| **D17** | Agent triggers 2 ways: auto (proposal unopened 3d · task overdue 2d · 3 failed attempts) + on-demand | Trigger/scheduler engine watching state thresholds; manual hand-to-agent action. |
| **D18** | After call: outcome + one-line summary + interest signal; transcript/recording on tap | Call record schema: outcome enum, summary, interest, transcript ref, recording ref. |
| **D19** | ~~Owner approves every discount~~ SUPERSEDED by D34 | — |
| **D20** | Reps see own leads; managers team; owner everything | Row-level lead visibility scoping (Own/Team/All). |
| **D21** | Proposal WITH design or WITHOUT; both same 11-step builder | One proposal entity, two entry paths; provenance differs (derived vs estimated). |
| **D22** | Components MANDATORY on every proposal; all 5 categories (+battery); kits removed | Hard validation gate before Generate; no lump-sum; duplicate-proposal carries components. |
| **D23** | Design studio + 3D screens LOW PRIORITY — build last | Sequencing only; studio ships already-working. |
| **D24** | Agent configured via guided Q + structured knowledge base + free-text; unanswered-Q feedback | Knowledge-base entity (structured sections); unanswered-question queue; "locked by platform" half superseded by D36. |
| **D25** | App UI multilingual English/Hindi/Marathi | i18n infra; Devanagari font (Noto Sans Devanagari + Inter); per-user language; text-expansion-safe layouts. |
| **D26** | ~~Billing screens MOCK~~ SUPERSEDED by D38 | — |
| **D27** | Six fixed preset roles; one person holds several; widest visibility | Many-to-many user↔role; permission = OR across roles; visibility = widest. |
| **D28** | No per-person permission exceptions, ever | Permissions derived purely from roles — no per-user override table. |
| **D29** | Custom roles deferred to v2 | Ship 6 presets; no role editor; Installer preset deferred (coordinator runs checklist). |
| **D30** | Survey two modes: REMOTE (Google Solar API + AI roof) / PHYSICAL | Survey entity carries `mode` + provenance (derived-from-imagery vs measured-on-site); remote-first residential resequences journey. |
| **D31** | Mobile nav = ARC BAR, elevated brass centre (My Day·Leads·＋·Projects·More) | Custom nav component; centre verb adapts by role (surveyor = Start survey). |
| **D32** | No WhatsApp integration v1; rep Download PDF + Copy link, pastes manually | No WhatsApp API; link opens tracked, delivery NOT tracked; "mark shared" is manual. |
| **D33** | C&I uses same single link as residential; no per-contact links/OTP | Accepted risk: any link-holder can Accept a ₹92L order; no view-attribution to stakeholder. Later fix: named links + OTP-at-accept. |
| **D34** | No discount approval this release (supersedes D19) | No approval queue/status; only guard = arithmetic (payable ≤ ₹0 blocks Generate). |
| **D35** | Survey photos = reference for design, NOT measurement | Photos tagged + attached to survey, travel to designer; NO LiDAR/auto-measure/AR; drone-as-imagery OK, drone-as-measurement not. |
| **D36** | Voice agent FULLY tenant-configurable; ships India calling rules as defaults | Tenant owns compliance; all agent config editable (name/voice/tone/langs/opening/topics/hand-over/schedule); config versioned per call. |
| **D37** | Dashboards = owner's periodic decision tool, separate from daily tasks | Forecast = weighted-pipeline projection (never in won total); won=signed; agent=correlation; role-scoped. |
| **D38** | Billing & subscription DEFERRED, planned separately (supersedes D26) | NO feature gated by subscription; no plan/usage limits/seat caps/PRO locks/upgrade prompts; pre-committed rule: never hold data hostage (read+export always work, DPDP). |
| **D39** | Design studio KEPT & REFACTORED, not redesigned; product moves to NEW repo as multi-tenant SaaS | Existing geometry/energy/electrical/BOM/roof-AI/structure/3D code carries over as-is; new repo = web + real mobile app, **shared TypeScript domain layer, Fly.io**; this repo becomes spec + reusable domain code. |

**Companion India calling-rules block (defaults under D36):** TRAI/DND (don't call DND, consent per customer) · calling hours 9am–9pm local · AI disclosure opening line · recording consent (may decline, still served) · human escape hatch on by default. All editable; surfaced once, not enforced.

---

## 3. BUSINESS RULES

### Provenance / honesty tiers (N7 — foundational)
Four-tier label on every number: **measured** (on site) · **derived** (from the model/imagery/BOM) · **estimated** (Path B AI from capacity+location heuristics) · **assumed** (catalog picks without design). Energy specifically: **PVGIS = "Real · measured"** vs **built-in estimate** — carry the label (per phase-10 docs; journey uses generic "derived from imagery" for remote survey).

### Staleness (hard product rule)
- Design edited after a proposal exists → its pricing goes **stale** and **must visibly say so**.
- **Money must never render as final while stale** — hard rule, repeated in Stage 6, 6B, Stage 8, Dashboards.
- Regenerate offered; Path B proposal later given a design → offer to upgrade estimated→derived, showing what changed before committing.
- Sent proposals/quotes keep their **original prices** even if the price book changes.

### Honesty rules (disclaimers required, not fine print)
- **Remote survey:** "Roof measured from satellite imagery. A site visit will confirm dimensions, shading and electrical access."
- **Path B proposal:** "Indicative proposal. Generation and savings are estimated from system size and location. A site survey and shadow analysis will confirm the final figures."
- **Agent:** opens by disclosing it is an automated assistant (default).
- **"Deals it touched":** correlation, not attribution — "We cannot prove the call caused it."
- **Forecast:** projection, never revenue; weighted pipeline labelled *expected, not promised*; never in the same total as won.
- **Won means signed;** a deal cancelled after Won stops counting as revenue immediately.

### GST
- Step 3 fields: System cost **excl. GST** / **incl. GST**, **GST %** (required), **GST amount** (auto-computed), separate **GST on battery %**.
- BOM line items each carry GST; BOM total must match proposal money path (same money path rule).

### Subsidy — PM Surya Ghar
- Residential only; **subsidy ₹** field in step 3; paid to **customer's bank** after DISCOM inspection.
- EPC does the paperwork and absorbs blame for the wait; document checklist has "subsidy application & sanction"; rejection/delay surfaced with reason.

### DISCOM / net metering
- **DISCOM inspection & net-metering approval = 3–6 weeks** (sometimes longer); outside EPC control.
- Blocker with reason; customer link shows e.g. "waiting for DISCOM approval, applied 15 Aug, typically 3–6 weeks."
- Product's job = make the waiting **visible and attributable**, not faster.

### Sanctioned load
- Captured from meter photo (reading + sanctioned load visible).
- Design **exceeds sanctioned load** → warn with the actual limit; **real approval blocker**.

### TRAI / DND (defaults, tenant-owned per D36)
- Don't call DND-registered numbers; consent tracked per customer; do-not-call flag.
- "Stop calling" → do-not-call set instantly, **irreversible without the customer's say-so**.
- Calling window 9am–9pm local + holiday calendar; a complaint sets a permanent quiet flag.
- Lead captured at 11pm → agent must not call back until 9am.

### Units
- Not translated: **kW, kWh, kWp**. Ranges: capacity **0.5–7000 kW**; battery **1–100 kWh**; efficiency/PR **50–100%**; monsoon dip **0–50%**; electricity tariff **1–50 ₹/kWh**; EMI interest **0–100%**; electricity inflation **~6%**; client phone **10-digit**; logo max 5 MB / 12×6 cm / PNG-JPG; T&C up to 3 pages; description max 110 chars.

### Currency formatting
- **₹ with Indian grouping (lakhs/crores)** in every language, always. Examples: ₹4,52,471; ₹92L; ₹1.4 Cr.

### Discount rules
- **% ⇄ ₹ mode switch** at step 3.
- Payable formula: `cost + battery − subsidy − discount = client-payable`.
- Discount below cost → warn with the loss stated in ₹.
- **Discount driving payable ≤ ₹0 → shown negative, blocks Generate** — the ONLY hard discount guard (D34). No approval, no ceiling.

### Roles / permissions (see §2 D27/D28)
Six presets (Owner/Manager/Sales rep/Surveyor/Designer/Engineer); 16 capabilities; lead visibility All/Team/Own/Assigned; permission = OR across held roles; visibility = widest; no per-person exceptions; deactivate never delete; always ≥1 Owner; always ≥1 person with "Manage team". Discounting rides with "Create and edit proposals" (not a separate permission).

### Lead lifecycle states (state machine)
Funnel stages: **New → Contacted → Qualified → Survey → Design → Proposal → Negotiating → Won.** Plus side-states: **Unassigned/Inbox**, **Assigned**, **Snoozed** (wake-up date, hidden from My Day until then), **Disqualified** (reason: renting/budget/not interested/unreachable/already installed/wrong number), **Junk** (leaves queue, not deleted), **Dormant** (30 days silent, auto-move, not deleted), **Lost** (reason: price/competitor/postponed/not reachable/roof unsuitable/financing failed), **Reopened**. Unassigned >24h escalates to owner.

### Project states (state machine, post-Won)
Full: **WON → MATERIAL ORDERED → DISPATCHED → INSTALLATION → ELECTRICAL & METERING → DISCOM INSPECTION → COMMISSIONED → SUBSIDY CLAIMED → HANDED OVER.** (D9 shorthand: Won → Ordered → Installed → Commissioned → Handed over.) Plus **Cancelled after Won** (allowed with reason; must NOT keep counting as revenue). Blocker sub-states: waiting on DISCOM / customer / material / us. Days-in-stage is the primary metric.

### Proposal versioning
- One proposal object; versions v1/v2 with what-changed + why; old versions preserved; **customer link always shows latest**.
- **Proposal number = server-assigned, never client-generated** (collision safety).
- Payment tranches must total **100%** (blocked with remainder shown); templates 10/60/20/10, 30/60/10.
- Tranches double as the **project collection schedule** (each completed stage makes the matching tranche due).

### Other guards
- OFFGRID/HYBRID without battery → hard block ("system cannot work").
- Duplicate detection: **phone number is identity**, dedupe on capture from every channel; husband/wife different numbers → offer merge from customer record later.
- Never block the customer progress link over unpaid money — chase the person, don't punish the view.
- Catalog product removal → archived not destroyed; drafts keep their components.

---

## 4. INTEGRATIONS

Note: `product-journey.md` names **Google Solar API** only. PVGIS, Gemini, telephony, and payments are named in the companion planning docs (cited). Full integration picture:

| Integration | Named in journey? | Purpose per spec |
|---|---|---|
| **Google Solar API** | Yes (D30, Stage 4) | Remote survey: Building Insights + dataLayers + DSM/elevation rasters feed AI roof detection (outline, obstructions, pitch, azimuth, area). **Separate ENHANCEMENT, never a dependency** for energy (per phase-10-prompts.md). Four honest async states incl. "checking Google Solar coverage"; coverage gaps real in parts of India → fall back to manual outline / physical survey. Also a "Google Solar estimates max N panels" cross-check line. |
| **PVGIS** | No (in NEW-PRODUCT-PLANNING-PROMPT, build-plan, phase-10) | **Energy modelling source of record** — real/measured irradiance → annual+monthly generation, specific yield, PR, POA. Labelled "Real · PVGIS" with database name; **built-in estimate fallback** when unavailable (labelled). Proxied via a thin server route (`lib/pvgis.ts`, `src/app/api/`). Drives Path A's derived generation & savings. |
| **Gemini** | No (in planning docs) | **Photo-analysis fallback for roof detection** when Google Solar dataLayers/DSM insufficient (shapes only, no height/pitch), with confidence scoring + review step. Thin server proxy. |
| **WhatsApp** | Yes (D32) | **NOT integrated in v1.** Rep taps Download PDF + Copy link and pastes into their own WhatsApp. App does not send. Link is ours → **opens tracked; delivery/receipt not tracked**. Website/inbound WhatsApp deferred (D13); WhatsApp outbound-only. Customer's whole experience is ~12–18 WhatsApp messages the rep sends manually + templates the app supplies. |
| **Voice agent** | Yes (D8/D10/D17/D24/D36) | Automated outbound follow-up calls + inbound answering (lead capture when nobody picks). Transcribes every call to timeline; multilingual TTS/STT (Hindi/Marathi/Gujarati/Tamil/Telugu+English); per-customer language/auto-detect; recording+consent; DND check pre-dial; triggers auto + on-demand. Underlying **telephony provider not named** ("telephony for the [agent]" — NEW-PRODUCT-PLANNING-PROMPT). Fully tenant-configurable (D36). |
| **Payments** | Partial (C9, Stage 8) | Customer gets a **payment link + instant receipt** at advance (C9). Project payments record mode (UPI/NEFT/cheque) + attach receipt; tranche-driven. **No payment-gateway product named**; billing/subscription deferred entirely (D38) — no gateway needed for the platform's own billing in this plan. |
| **Claude Design** | Yes | Design tooling (not a runtime integration) — screens designed there; design system in its Design-systems tab. |

Server surface (per NEW-PRODUCT-PLANNING-PROMPT): the only server code is **five thin third-party proxies** under `src/app/api/` — PVGIS, Gemini, and Google Solar (building-insights, data-layers, geotiff).

---

## 5. DATA ENTITIES (implied) + key relationships

- **Tenant / Company** — the EPC workspace. Owns everything below (multi-tenant root). Fields: name, city, GSTIN, address, logo, bank details, what-they-sell, typical system size. 1 Tenant → many Users, Leads, Catalog items, etc.
- **User** — employee. Belongs to Tenant; M:N with **Role**; profile, phone, language (per-user), status (active/invited/removed), last-active.
- **Role** — six fixed presets (Owner/Manager/Sales rep/Surveyor/Designer/Engineer). M:N with User; maps to 16 **Capabilities** + a lead-visibility scope.
- **Lead** — belongs to Tenant, has owner (User), source enum, stage (state machine), value, snooze/wake date, disqualify/lost reason. 1 Lead → many Activities, Surveys, Designs, Proposals, Tasks, Files, Calls.
- **Customer / Contact** — the homeowner/factory. Phone = identity (dedupe key). A Lead references a Customer; multiple Contacts per customer (decision-maker, landlord, second contact); consent/DND/do-not-call flags.
- **Site** — the physical building/roof; address, geo pin; belongs to Lead/Customer. Surveys attach here.
- **Survey** — belongs to Site/Lead; `mode` (remote/physical), provenance, captured groups (Roof/Electrical/Shading/Access/Structural), meter reading, sanctioned load, versioned (revisit = new version). Has many **Photos**.
- **Photo** — tagged reference image (roof corner, obstruction, meter, DB); source (on-site/customer-sent/drone); belongs to Survey, travels to Designer.
- **Obstruction / Shading item** — per Survey/Design; type, height, position on roof sketch.
- **Design** — belongs to Lead; from the studio; variants (M:N Lead→Design with `is_recommended`); size, generation, price, payback; sign-off state (draft/awaiting/approved/returned); has a **BOM** and **3D/capture** artifacts.
- **BOM (Bill of Materials)** — belongs to Design (Path A only); line items (item, spec, qty, unit, rate, GST, total); internal; feeds proposal price.
- **BOM line item / Component instance** — panel/inverter/cable/electrical/structure/battery selections.
- **Catalog / Product** — per Tenant; panels, inverters, BOS the company sells; archivable; brand + model (not translated). Referenced by BOM & proposal step 8.
- **Price book / Rate** — per-component rates, **versioned** (old quotes keep prices).
- **Proposal** — belongs to Lead; one object, Path A/B; version chain (v1/v2); server-assigned proposal number; type (CAPEX/OPEX-PPA); the 11-step field set (company, achievements, system setup, performance, financials, timeline, payment terms, components, T&C, client details, bank details); status (draft/shared); provenance flags; stale flag. Has many **Payment tranches**, **Components**, **Timeline phases**.
- **Battery** — sub-entity on proposal/design (capacity kWh, chemistry, cost, GST).
- **Payment tranche** — belongs to Proposal (defines schedule) AND to Project (collection); label, %, amount, due-on-stage, status (received/due/upcoming), mode, receipt.
- **Project** — created automatically from a Won Lead/Proposal; stage (state machine), days-in-stage, blockers, expected install date. Has Payments, Documents, Blockers, Installation checklist, Activity.
- **Document** — per Project; type (signed proposal, advance receipt, net-metering app, DISCOM approval, subsidy app/sanction, commissioning cert, warranty, handover pack); status (pending/uploaded/verified).
- **Blocker** — per Project; reason + "waiting on" (DISCOM/customer/material/us) + start date.
- **Installation checklist (InstallationSheet)** — per Project; steps derived from structural model; crew ticks persisted.
- **Tokenised link** — one per customer/deal; lifecycle proposal→progress→handover; tracks opens; no login.
- **Task / Follow-up** — belongs to Lead/User; due date; auto-created on proposal send (+2d); overdue surfacing.
- **Activity / Timeline event** — polymorphic log on Lead/Project (calls, messages, stage changes, notes).
- **Call record** — belongs to Lead; human or agent; outcome enum, one-line summary, interest signal, language, agent-config-version, transcript, recording, escalation reason.
- **Agent config** — per Tenant; name/voice/tone/languages/opening line/topics/hand-over rules/calling window/holiday calendar; **versioned** (queued calls use the version they were queued with).
- **Knowledge base** — per Tenant; structured sections (About/Products/Warranty/Process/Pricing/Subsidy/Financing/Objections); seeded default pack.
- **Unanswered question** — per Tenant; captured from calls, one-tap answer feeds knowledge base.
- **Agent queue entry** — scheduled call: who/when/why; removable.
- **Notification** — per User; types (proposal opened, agent escalation, follow-up due, survey submitted, design returned, payment due); push + in-app.
- **Message template** — per Tenant; WhatsApp proposal message, follow-up nudge, reminder; multilingual.
- **Target** — optional, per rep/team; set inline on dashboard (no separate screen).
- **Assignment / rep-load** — derived; each rep's open-lead count at assign time.

Cross-cutting: everything is **tenant-scoped** (multi-tenant root). Money entities share **one money path** (BOM ↔ proposal ↔ tranches ↔ project payments must reconcile).

---

## 6. GAPS / AMBIGUITIES / CONTRADICTIONS

1. **Naming: Proposal vs Quotation vs Quote.** Spec insists "one object" but uses "proposal," "quote," and "quotation" interchangeably; Indian EPCs say "quotation." Flagged as a copy decision, unresolved. Search/entities reference both "quotes" and "proposals."
2. **Project state model has two versions.** D9 short chain (Won→Ordered→Installed→Commissioned→Handed over) vs Stage 8 full 9-state chain (adds Material Ordered/Dispatched/Electrical & Metering/DISCOM Inspection/Subsidy Claimed). Which is the canonical state machine is undecided.
3. **Voice agent telephony/TTS provider unnamed.** Agent behaviour is fully specified but no vendor (Twilio/Exotel/etc.) or STT/TTS engine is chosen. Languages span 6 for agent vs 3 for UI — agent language set is broader and independent of app language.
4. **Payment gateway unnamed.** C9 references a "payment link" + receipt and modes (UPI/NEFT/cheque), but no gateway is selected; and billing/subscription (the platform's own revenue) is fully deferred (D38) with the pricing model unspecified.
5. **PVGIS/Gemini absent from the "master" journey doc.** The journey names only Google Solar API; the actual energy source of record (PVGIS) and roof-AI fallback (Gemini) live only in companion docs — the journey and phase-10 docs also flip which is primary (journey implies Google Solar drives the roof; phase-10 stresses PVGIS drives energy and Google Solar is "a separate enhancement, never a dependency"). Potential source-of-truth conflict to reconcile.
6. **D33 accepted risk (C&I single link).** Anyone holding the link can Accept a ₹92-lakh order; no per-stakeholder attribution on opens. Explicitly deferred ("revisit when it hurts"); later fix (named links + OTP-at-accept) not scheduled.
7. **"Step 5" phantom in the existing studio** — counted in the wizard but has no screen (audit finding, unresolved in the refactor).
8. **Husband/wife duplicate (same person, different numbers)** — dedupe cannot catch; "offer merge later" is described but the merge flow/entity is not specified.
9. **Snooze / dormant / reopen** are described narratively but the exact triggers/timers (24h unassigned escalation, 30-day dormant, wake-up resurfacing, "6 months no-call after No") lack a single consolidated state-machine definition — scattered across Stages 2/3/7.
10. **Agent correction training** — "corrections train nothing automatically without review"; the review/feedback mechanism is asserted but undesigned.
11. **Quick mode (Path B, steps 1/3/8/10)** is a recommendation, not a locked decision — status ambiguous (proposed vs committed).
12. **Chip-rail vs gating conflict** in the 11-step builder is acknowledged (free jump can land on step 8 with step 3 incomplete); recommendation is "validate only at Generate," but the spec text still says "Next is disabled until required fields valid" — two rules coexist unreconciled.
13. **Duplicate `Catalog` row** in the tenant-config table (listed twice), and `Price book`/`Catalog` overlap — minor spec redundancy.
14. **Offline scope boundary** — only survey capture is fully offline; "everything else degrades gracefully" is unspecified as to which operations queue vs fail. Sync conflict resolution (e.g., two offline edits, revisit versioning) not detailed.
15. **Referral entity** — referrer is "tagged and credited" (Stage 2) and referral asked at handover (C12), but the credit/attribution model is undefined.
16. **Installer role deferred (D29)** yet the capability matrix has an "installation checklist only" persona; in v1 the coordinator (Manager/Owner) runs it — so crew members have no login/role in v1, leaving the InstallationSheet's "crew ticks" without a crew user.
17. **OPEX/PPA proposal type** is selectable (per-unit billing) but the PPA billing/metering model beyond the proposal document is entirely unspecified in v1.
18. **N7 provenance rule referenced but not defined here** — the four-tier measured/derived/estimated/assumed system is foundational and cited repeatedly but its full definition lives in `product-spec.md`/phase-10, not the journey.