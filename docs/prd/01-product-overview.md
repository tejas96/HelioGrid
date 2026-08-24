# 01 · Product overview — vision, goals, principles, glossary

Status: draft · Origin mix: SRC + BRIEF (this document carries no `REC` items) · Depends on:
`00-README.md`

## 1. Purpose & scope

This document is the frame every other document in `docs/prd/` is written inside. It states what
HelioGrid is, what it is for, the convictions it will not trade away, the principles that bind
every module, the three audiences it serves, and the vocabulary the whole suite uses.

It is normative. Where a section below carries a requirement table, those rows are laws that
bind the foundation and module PRDs: a later document may add detail to them, may say how a
module honours them, and may record a conflict against them in `registers/conflicts.md` — but no
later document silently contradicts them. Requirement IDs in this document use the prefix
`OV-<nn>` and follow the ID rules in `00-README.md` §ID scheme.

**What this document is not.** It is not the business model (`04-business-model.md` owns
packaging, tiers, meters, price books and every price point — no monetary price of the platform
appears here). It is not the personas document (`02-personas.md` owns the twelve personas; this
document names only the three audiences those personas fall into). It is not the journey
(`03-journey-map.md` owns the nine EPC stages and the customer journey C1–C13). It is not a
feature specification: no module's behaviour, screens, states or edge cases are defined here.
And per the suite-wide rule it carries no implementation content and **no schedule of any
kind** — no dates, no phases, no build order. Where the source corpus attached a calendar to a
scope commitment, this document carries the scope and drops the calendar (owner directive OD-5:
the scope commitment stands, the day numbers do not; every source phrase of the form "ships in
the N-day build" is read here as **"in v1 scope"**).

## 2. Audiences & surfaces

HelioGrid serves exactly three audiences. Every screen in the product belongs to one of them,
and the boundary between them is a product law, not a convenience.

| Audience | Who they are | How they reach the product | What they get | Tag + source pointer |
|---|---|---|---|---|
| **Owner** | The person who buys and administers the tenant — the EPC's proprietor or director. One tenant always has at least one. | Full login (phone + OTP, or Google). Web for administration, mobile for everything else. | The widest visibility in the product: pipeline, assignment, voice-agent controls and queue, billing and subscription, tenant configuration, sign-offs. | `SRC` — `DOC00.three-audiences` |
| **Employees** | Everyone the owner invites: sales, survey, design, engineering, projects, field, finance, marketing, HR, operations. Documented individually as the twelve personas in `02-personas.md`. | Login, role-scoped. Role decides the home screen — the same app has a different front door per role. | Reps see their own leads, managers see their team, the owner sees everything. Fixed preset roles only (F2); no custom roles and no per-person permission exceptions. | `SRC` — `DOC00.three-audiences` (D20) |
| **The EPC's customer** | The homeowner or the commercial buyer the EPC is selling to. **Never a user of ours.** | **No login, ever.** One tokenised link, plus phone calls and messages the EPC sends. | Proposal with a 3D view of their own roof, accept / ask a question, payment status, project progress with honest wait attribution, handover pack. Lifecycle: proposal → progress → handover. | `SRC` — `DOC00.three-audiences`, `DOC00.customer-link-audience` (D5) |

**Surfaces.** The product is mobile-first without compromising web. Mobile is field-first — My
Day, leads, quick-add, surveys, visits, notifications, with the studio reached through an
embedded web surface — and it is built in lockstep with web rather than trailing it. Web carries
the desk work: administration, imports, dense review screens, dashboards. Neither surface is a
subset of the other in capability; per-feature emphasis is stated in each module's *Personas &
surfaces* section.

**Audience law.** The customer audience never acquires an account, a password, or a portal. Any
requirement anywhere in the suite that would give the EPC's customer a login contradicts this
document and must be recorded in `registers/conflicts.md` rather than written.

## 3. Framing areas

### 01.1 — Vision and product definition

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| OV-01 | HelioGrid is a multi-tenant SaaS that runs the **selling engine** of a solar EPC company — from a lead captured in under thirty seconds to a signed project with money collected. Every module in the suite exists to serve that spine or to keep it honest. | `SRC` — `DOC00.product-definition` (docs/00 §Vision) | P0 |
| OV-02 | V2's framing is global: the world's best **mobile-first SaaS platform for solar EPC companies**, mobile-first without compromising web, global from the outset, with the 3D Design Studio as the flagship. The source's product definition is India-worded — "the selling engine of an *Indian* solar EPC company" — and OV-01 states it with that wording globalized; both readings are on the record. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Mobile-first, §Primary-goals | P0 |
| OV-03 | The flagship asset is a full **3D Design Studio** producing engineering-grade layouts, shading analysis, electrical sizing and a priced bill of materials, across a box that runs from 1 kW rooftops to 100 MW plants. | `SRC` — `DOC00.product-definition` | P0 |
| OV-04 | The product replaces the spreadsheet-and-rekeying pipeline with **one record that travels**: CRM → survey → 3D design → proposal → no-login customer link → voice-agent follow-up → light project tracking → payments. No stage re-enters data an earlier stage already holds. | `SRC` — `DOC00.one-record` | P0 |
| OV-05 | The buyer is the **EPC organisation**. Both residential and commercial & industrial business are first-class and both are high volume (D1); deal values in the source's India framing span roughly ₹4.5 lakh to ₹92 lakh+ — customer deal size, not platform pricing, which `04-business-model.md` owns. | `SRC` — `DOC00.buyer-and-auth` | P0 |
| OV-06 | The owner signs up **self-serve**, with phone number and one-time password. Nothing about acquiring the product requires a sales conversation at the entry tiers. | `SRC` — `DOC00.buyer-and-auth` (D11 signup half); the no-sales-conversation-at-entry-tiers clause per `DOC01.tier-positioning` | P0 |
| OV-07 | Google Login is offered alongside Mobile OTP as a second authentication route. This is new in V2 and not present in the v1 source, which is OTP-only. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Authentication; suite Global Constraints §6 | P1 |
| OV-08 | Mobile is **field-first and never a follow-up**: it is built in lockstep with web, carrying My Day, leads, quick-add, surveys, visits and notifications, with the studio reached through an embedded web surface. | `SRC` — `DOC03.mobile-scope` | P0 |
| OV-09 | Every screen is designed mobile-first at 375 px with **full web parity** — the small screen is the design constraint, not a reduced edition. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Mobile-first; design spec §7 | P0 |

**Behaviour detail.** OV-01 and OV-02 are deliberately two rows rather than one blended sentence:
the corpus defines HelioGrid as the selling engine of an *Indian* solar EPC, and the V2 brief
widens that to a global product. The widening changes the market framing, not the spine — the
selling engine, the one travelling record and the flagship studio are unchanged by it. A reader
who wants to know which half of the framing carries source authority can tell from the tags.

OV-04 is the sentence the rest of the suite is measured against. "One record that travels" means
the lead, the survey, the design, the proposal, the customer link, the follow-up history, the
project and the money are facets of a single customer record, not seven systems joined by
copy-paste. Every cross-module contract in the suite exists to keep that true. Where a module
would require a user to re-key something an earlier stage already captured, that is a defect
against OV-04 and belongs in `registers/conflicts.md`.

OV-03's box — 1 kW to 100 MW — is a scope commitment, not an aspiration. It appears again as
OV-44 because the source states it twice, once as the flagship's range and once as a v1
commitment that survives the launch boundary.

**Conformance test.** Open any module PRD. If its requirements can be satisfied while a user
re-enters data that an upstream module already holds, OV-04 has been broken. If any capability is
specified as web-only without an explicit, recorded rationale, OV-08/OV-09 have been broken.

### 01.2 — Primary goals

The ten goals `OV-10` – `OV-19` are the owner's V2 brief stated as product intent. They are
`BRIEF`-origin: the v1 corpus implies most of them but states none of them as a goal list. Every
module PRD should be readable as serving at least one of them; a feature area that serves none is
a candidate for the enhancements register rather than the core suite. `OV-20` closes the table by
recording the source anchor that sits beneath the affordability and scale goals.

| ID | Goal | What it means for the product | Tag + source pointer | Tier |
|---|---|---|---|---|
| OV-10 | **Close more deals** | The product's job is conversion, not record-keeping. Every surface that touches a live opportunity — My Day, follow-ups, the voice agent, the proposal, the customer link — is measured by whether it moves a deal forward. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Primary-goals | P0 |
| OV-11 | **Reduce sales-cycle time** | Elapsed time from enquiry to signature is a first-class product metric. Stage conversion and cycle time are reportable (M13), and every hand-off between stages is designed to remove waiting rather than to add a step. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Primary-goals | P0 |
| OV-12 | **Reduce operational work** | The product absorbs coordination that today lives in spreadsheets, WhatsApp threads and people's heads. Fewer manual touches per deal is a design goal in every module, not a side effect. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Primary-goals | P0 |
| OV-13 | **Automate repetitive tasks** | Follow-up queues, reminders, wake-ups, sweeps and the voice agent do the work a rep would otherwise do from memory. Automation is always visible and always attributable — the user can see what a machine did on their behalf. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Primary-goals | P1 |
| OV-14 | **Improve field visibility** | The office can see where field work is happening and what state it is in: attendance, site check-in/out, visit tracking, route timeline, live location for tracked employees (M09). Visibility is for coordination, and its scope is bounded by what an EPC actually needs. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Primary-goals, §Field-workforce | P1 |
| OV-15 | **Improve proposal quality** | The proposal is the artefact the customer judges the EPC by. Quality means a real 3D roof, defensible numbers with their provenance shown, correct local tax and incentive treatment, and the EPC's own branding — not a prettier template. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Primary-goals | P0 |
| OV-16 | **Centralize operations** | One system of record for the EPC: leads, surveys, designs, proposals, projects, money, people and field activity in one place, with one search across them. Centralization is what makes OV-04's travelling record possible. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Primary-goals | P0 |
| OV-17 | **Affordable for small EPCs** | A one-to-five-person residential shop must be able to run its whole business on the product without price being the reason it stays on spreadsheets. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Primary-goals | P0 |
| OV-18 | **Scale to enterprise** | The same product serves utility-scale work — the largest designs in the box, the widest teams, custom commercial terms and white-label customer-facing surfaces — without a separate edition or a rewrite. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Primary-goals | P1 |
| OV-19 | **Global from day one** | Market differences are configuration, never product change. "Day one" here is the brief's phrase for *from the outset* — it is an architectural commitment and carries no date, no phase and no schedule. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Primary-goals; design spec §6 | P0 |
| OV-20 | **A price for every EPC** (source anchor for OV-17 and OV-18) | The reach implied by OV-17 and OV-18 is source-anchored: the entry tier exists so that price is never the reason a small EPC stays on spreadsheets, and the top of the range is a sales-assisted tier for utility-scale and open-access work. The tiers themselves, their capacities and every price point live in `04-business-model.md`. | `SRC` — `DOC01.price-for-every-epc`, `DOC01.tier-positioning` (positioning only) | P0 |

**Behaviour detail.** OV-17 and OV-18 pull in opposite directions and are deliberately held
together rather than traded off. The resolution is structural: every feature is in every tier, and
tiers differ by capacity, usage counts and metered bundles (OV-28). A small EPC gets the whole
product at a small-EPC capacity; an enterprise gets the same product with a bigger box and
commercial terms. Nothing is withheld from the small buyer to create an upgrade reason.

OV-13 and OV-14 carry an honesty obligation that the rest of the suite inherits: automated work
and tracked movement are shown as what they are. Agent activity is a separate block in My Day and
never mixed with a rep's own tasks; agent contribution to a won deal is reported as correlation,
never claimed as attribution; and field tracking is an owner-toggled state per employee, not an
ambient property of employment.

**Conformance test.** Take any feature area in any module and name the goal it serves. If the
answer is "none", the feature area belongs in `registers/enhancements.md` with a rationale, or it
does not belong in the suite.

### 01.3 — The three convictions, globalized

The v1 corpus states three convictions. All three survive V2 intact; the third is restated so
that India is the product's **first market pack** rather than the product's identity.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| OV-21 | **Conviction 1 — the studio is the flagship, and nothing is compromised against it.** Every studio tool and every computed output survives into V2. The studio census (`docs/prd/modules/M05-studio/studio-census.md`) is the acceptance gate and never shrinks. The studio is touch-first with full parity on every surface, including 375 px mobile. When a studio requirement conflicts with a convenience elsewhere, the studio wins. | `SRC` — `DOC00.studio-flagship` (docs/00 conviction 1; docs/15 §4 directive 9) | P0 |
| OV-22 | **Conviction 2 — honesty is a feature.** Every user-visible number carries a provenance tier (measured / derived / estimated / assumed — exactly four, no screen invents a fifth). Money never renders while stale. Structural adequacy is never computed — an engineer signs off. Competitors sell certainty; this product sells numbers that can be defended when a customer compares three proposals. Honesty is a differentiator that is marketed, not a disclaimer that is buried. | `SRC` — `DOC00.honesty-conviction`; provenance tiers canonically R18 | P0 |
| OV-23 | **Conviction 3 — market-config-first.** Every market fact — tax scheme, incentive model, compliance and calling rules, certification schemes, payment rails, units, number formats, stage labels, document checklists, catalog scope and currency — lives in an injected market-configuration layer, never hard-coded into a module. Launching a market is authoring its pack: configuration, not product change. | `SRC` — `DOC00.india-first-global-ready` (docs/00 conviction 3, as amended by the 2026-08-02 global-backend ruling) | P0 |
| OV-24 | Conviction 3 restated for V2: **India is the first market pack, not the product's identity.** The source's India-native behaviour — GST-native money path, PM Surya Ghar subsidy slabs, DISCOM-aware project states, TRAI-compliant calling, ₹ lakh/crore grouping, EN/HI/MR interface — is documented as the complete first pack in `foundations/F1-global-market-framework.md`, and module bodies stay market-neutral and reference pack keys. Launch is India-only; the structure is global. | `BRIEF` — design spec §6; suite Global Constraints §6 | P0 |
| OV-25 | Everything the source states as a price, a benchmark or a mandate mechanic is **the India market's price book**, not the generic model. No number from that book is treated anywhere in this suite as a universal product fact, and no market's prices are ever derived by currency conversion from another market's (the no-FX rule is DD6, design spec §2). | `SRC` — `DOC01.in-price-book` (positioning half; mechanics belong to `04-business-model.md`; no-FX clause per DD6, design spec §2) | P0 |

**Behaviour detail.** The three convictions are what the suite refuses to trade, stated once here
and defended in the documents that own them.

*Studio uncompromised* (OV-21) has a practical consequence for how this suite is written: M05 in
this pass is the census-grounded baseline, and a dedicated second pass expands it from the
owner's separate studio material. The census is the cross-check between the two passes. Nothing
in the census is dropped, downgraded, or quietly reworded away in between. A reader who finds a
studio capability in the census but not in M05 has found a defect, not a scope decision.

*Honesty is a feature* (OV-22) is the conviction with the widest reach, because it constrains
every number the product renders. `foundations/F8-data-honesty.md` owns the mechanism: the four
provenance tiers, the money-never-stale rule, the "Indicative proposal" label on a proposal built
without a design, the engineer sign-off that replaces a computed structural verdict, and
correlation-not-attribution on the voice agent's contribution. Modules do not restate the
mechanism; they say which of their numbers carry which tier. The competitive point is explicit in
the source and worth keeping in the front of the document: when a customer compares three
proposals and only one admits which of its numbers are estimated, that reads as confidence.

*Market-config-first* (OV-23, OV-24) is the conviction V2 changes most, and the change is one of
emphasis rather than substance — v1 already built the market-config layer and already committed
to injection over hard-coding. What V2 adds is the refusal to let India's completeness read as
the product's identity. India is documented as the first complete pack precisely because it is
complete, and because a market pack that has actually shipped is a better template for the second
market than an abstract description would be. The consequence for authors is mechanical: an India rule
never appears in a module body. It appears in F1's India pack, and the module references the pack
key.

**Conformance test.** Search any module PRD for a market-specific token — a tax name, an incentive
scheme, a regulator, a currency symbol, a certification label. Each hit must either be inside an
explicit "India pack" reference or be a defect against OV-23/OV-24.

### 01.4 — Product principles

Eleven principles bind every document in this suite. Unlike the convictions, which say what the
product believes, these say how it behaves in situations that recur in every module.

| ID | Principle | Requirement | Tag + source pointer | Tier |
|---|---|---|---|---|
| OV-26 | **The soft-block law** | The product soft-blocks, never hard-blocks. In every billing state — including halted, expired and cancelled — reading everything, searching, dashboards, export (data, CSV, existing proposal documents), the customer's own links and the billing screens with pay/upgrade/reactivate all continue to work *(Final review: "billing screens" restored — the always-works list is `BM-32`'s four items)*. Blocked mutations fail with a clear state banner and a route to reactivate. No data is ever deleted for non-payment. The EPC's customer is never punished for the EPC's billing state. | `SRC` — `DOC16.soft-block-never-hard`, `DOC16.softblock.always-on`, `DOC01.trial-soft-block` | P0 |
| OV-27 | **Entitlements are the only gating** | There are no feature flags in the product. Features ship enabled. The single runtime mechanism that can stop a user from doing something they have permission to do is a billing entitlement. | `SRC` — `DOC00.nongoal-feature-flags` (owner directive) | P0 |
| OV-28 | **Capacity, not features** | Commercial tiers gate capacity ceilings, usage counts and metered bundles — never features. Every module and every capability is present in every tier. Caps are upgrade signals and abuse bounds, never feature ransoms. | `SRC` — `DOC01.gates-capacity-not-features` (owner-confirmed); caps-as-signals clause per `DOC01.creation-caps` | P0 |
| OV-29 | **The organisation pays, and seats are not the meter** | One subscription per tenant, owner-administered, covering every employee. There is no per-seat pricing: per-seat pricing punishes whole-company adoption, and whole-company adoption is what makes the single travelling record work at all. | `SRC` — `DOC01.org-pays`, `CG-moat.6` | P0 |
| OV-30 | **The one seat-based exception** | Active field-worker **tracking** is the single per-tracked-seat add-on in the product, because it carries a real per-worker cost. Site check-in/out and visit logging are part of the core visit workflow and are included in every tier for every employee. The owner toggles tracking per employee; the meter counts tracked-seat-months. No other capability is ever priced per seat. | `BRIEF` — design spec DD7, §8 | P0 |
| OV-31 | **Phone as identity** | A phone number is the identity anchor on both sides of the product: it is the login identity for users, unique in international format, and it is the deduplication key for customers, checked on capture from every channel. Users are deactivated, never deleted. | `SRC` — `DOC04.user-lifecycle`, `DOC04.phone-identity-dedupe`, `S2.rule.dedupe` | P0 |
| OV-32 | **The customer never logs in** | The EPC's customer has no account, no password and no portal. One tokenised link carries their whole relationship with the project — proposal, acceptance, payment status, progress, handover — and it is never blocked over unpaid platform money. Where a deal has several stakeholders, they get several labelled links, not accounts. | `SRC` — `DOC00.customer-link-audience` (D5, as extended by R6) | P0 |
| OV-33 | **Progressive onboarding** | Nothing is required on day one of a tenant's life. Every setting has a working default, and a tenant can sign up and send a real proposal without opening a settings screen. Configuration happens in context — at the moment a user needs the thing being configured — and settings screens exist for revisiting, not for setup. Every configuration surface shows the effect of the setting. | `SRC` — `TC.config-ux.1`, `TC.config-ux.2`, `TC.config-ux.3` | P0 |
| OV-34 | **Vendor names are never product commitments** | Every external capability sits behind a capability boundary the product owns. Named vendors are v1 reference implementations, and swapping one is an adapter change, never a product change. Requirements in this suite name the capability ("one-time-password delivery", "subscription billing", "outbound voice"), and record the reference implementation as a note. | `SRC` — `DOC07.ports-vendor-neutral` | P0 |
| OV-35 | **The naming law: Proposal** | The customer-facing commercial document is a **Proposal** everywhere — as an entity, in interface copy and in customer-facing documents, in every launch locale. Per ruling R1 the words "quote" and "quotation" are banned from interface strings and identifiers throughout the product. The single exception is global search, which treats "quotation" and "quote" as query aliases for proposals, because that is what users in the field will type. There is no dual vocabulary anywhere. | `SRC` — R1 (docs/15 §1) | P0 |
| OV-36 | **Module bodies stay market-neutral** | A module PRD never states a market fact. It states the behaviour and references the market-pack key that supplies the fact. India's values live in F1's India pack. | `BRIEF` — design spec §6; suite Global Constraints §6 | P0 |

**Behaviour detail.** The soft-block law (OV-26) is the principle most likely to be eroded by a
well-meaning requirement elsewhere, so it is stated in the strongest form the source supports:
the product never holds an EPC's data hostage, and it never lets a billing dispute between the
platform and the EPC reach the EPC's own customer. `modules/M12-platform-billing.md` owns the
enforcement detail — exactly which mutations pause in which state, and the grace behaviour before
they do. `04-business-model.md` owns the commercial framing. This document owns the law itself.

OV-27 and OV-28 are two halves of one stance on gating. There is no runtime switch that hides a
shipped capability from a user, and there is no commercial tier that hides one either. Together
they mean a reader can answer "can this tenant do X?" from two facts only: the user's role (F2)
and the tenant's entitlements (M12). No third mechanism exists, and introducing one is a defect.

OV-29 and OV-30 must be read together, because OV-30 is a named exception to OV-29 and the
suite's credibility depends on it staying the only one. The reasoning is cost, not packaging:
live tracking of a field worker carries a genuine per-worker cost, so it is the one meter that
counts people. Everything an EPC does with the product otherwise costs the same whether five
people or fifty use it — which is the point, because the travelling record only works when the
whole company is on it.

OV-31 has a consequence that surfaces in almost every module: because the phone number is the
identity, capture flows deduplicate on it, imports deduplicate on it, and merge behaviour exists
wherever records can be created from more than one channel. Because users are deactivated rather
than deleted, history stays attributable.

OV-33 is what keeps the product usable by its smallest customer. A one-person EPC does not have
an administrator who will spend an afternoon configuring; the product must work before it is
configured and get better as it is. The complement is that configuration is offered where the
need appears — the moment a user reaches for a component that is not in their catalog, the
product offers to add it there rather than sending them to a settings maze.

OV-35 exists because the source corpus itself used three words for one thing and Indian EPCs say
a fourth. The ruling ended the ambiguity in favour of "Proposal", and this suite carries that
decision as a hard vocabulary law rather than a style preference, because dual vocabulary in a
translated product multiplies across locales.

**Conformance test.** For each principle, the check is a search: a feature flag anywhere is a
defect against OV-27; a tier that withholds a capability is a defect against OV-28; a second
per-seat meter is a defect against OV-30; a customer account is a defect against OV-32; a vendor
name written as a requirement rather than as a reference implementation is a defect against
OV-34; the banned words in any interface string are a defect against OV-35.

### 01.5 — What nobody else has

The source states the competitive moat once and expects it defended everywhere. It is restated
here so that every module author knows which of their requirements is carrying a differentiator,
and each row names the document that owns the detail. These rows do not add requirements of their
own — they bind the owning document to keep the claim true, and require that any weakening of a
claim be recorded rather than absorbed.

| ID | Moat item | Owned by | Tag + source pointer | Tier |
|---|---|---|---|---|
| OV-37 | **The AI voice agent** — outbound follow-up and inbound answering in the customer's own language, statutorily compliant by construction, every call transcribed onto the lead timeline, with per-tenant numbers. No competitor offers this at any price. The compliance gate's mechanism is fixed; its statutory ruleset is market-pack data, and a market with no voice ruleset cannot enable outbound voice. Where a telephony capability is genuinely unavailable behind the current reference implementation, the product degrades honestly rather than pretending. | `modules/M07-sales-execution.md` + `foundations/F1-global-market-framework.md` | `SRC` — `CG-moat.1` (docs/12), as amended by D36 | P0 |
| OV-38 | **The provenance and honesty system** — a provenance tier on every number, money never stale, visible "Indicative proposal" labelling, engineer sign-off instead of a computed structural claim, correlation rather than attribution on agent impact. Competitors print confident numbers; this product prints defensible ones. | `foundations/F8-data-honesty.md` | `SRC` — `CG-moat.2`; R18, R14, R5 | P0 |
| OV-40 | **Vernacular interface** — a per-user interface language across the launch locales, correct Devanagari rendering in generated documents, and market-correct number grouping. The field workforce is not English-first, and no rival acknowledges it. Number grouping is market-pack behaviour; the multi-language capability is F3's. | `foundations/F3-localization.md` + `foundations/F7-design-language.md` (grouping → F1) | `SRC` — `CG-moat.4`; D25 supersedes D12 | P0 |
| OV-41 | **Two-tier catalog with tenant price overrides** — a platform master catalog plus tenant catalog plus tenant overrides, with versioned rates so a proposal that has been sent never mutates. The closest rival's local database has no override or versioning layer. | `modules/M01-onboarding-and-tenant-config.md` | `SRC` — `CG-moat.5`; resolution order per R13 | P0 |
| OV-42 | **Organisation pricing with unlimited seats under incumbent prices** — a business-model feature, because whole-company adoption is what makes the single travelling record actually work. Unlimited seats is not unlimited usage: capacity and counts still apply per tier. | `04-business-model.md` | `SRC` — `CG-moat.6` | P0 |

**Behaviour detail.** Three of these five are the direct expression of a conviction — OV-38 is
conviction 2, OV-37 and OV-40 depend on conviction 3's market layer, and OV-41 is what makes
conviction 2's numbers reproducible over time. That overlap is intentional: the moat is not a
marketing list bolted onto the product, it is the convictions made concrete.

The honest-degradation clause in OV-37 is load-bearing. Where the reference implementation behind
a telephony capability cannot do something the moat claim implies, the product says so in the
interface rather than silently failing. That is conviction 2 applied to the product's own
capabilities rather than to its numbers, and it is the standard every module should hold itself
to when a capability depends on an external provider.

**Conformance test.** Each owning document must contain requirements that make its moat row true.
If an owning document's requirements would leave the claim unsupported, that is a defect recorded
in `registers/conflicts.md` — the claim is never quietly softened here to match a thinner module.

### 01.6 — The scope commitment

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| OV-43 | **v1 is the entire product.** There is no Launch-2, no v1.1 and no "later" bucket into which a capability can be deferred while still being counted as planned. A capability is either in v1 scope, or it is an explicit non-goal with a recorded rationale, or it is tagged as a recommendation and carried in `registers/enhancements.md`. There is no fourth category. This is a scope law and carries no schedule: the calendar the source attached to it is superseded, and every source phrase of the form "ships in the N-day build" is read throughout this suite as "in v1 scope". | `SRC` — `DOC00.v1-entire-product`, as corrected by owner directive OD-5 (docs/15 §4 directive 5) | P0 |
| OV-44 | The only honest exceptions to "shipped at launch" are three, and each is named rather than open-ended: (a) capabilities whose activation waits on a third party's approval process, where the product ships complete and activation follows the third party; (b) the explicitly spec-locked exclusions recorded as non-goals in §6 below; (c) utility-scale studio enhancements that continue immediately afterwards as ongoing investment in the flagship. **1 kW to 100 MW remains a v1 commitment.** | `SRC` — `DOC00.outside-window` | P0 |

**Behaviour detail.** OV-43 is the reason this suite has an enhancements register and a non-goals
section in every document. The source's discipline was that a deferral must be either honest
(named as a non-goal, with the reason) or absent — a "later" bucket lets scope leak while looking
managed. V2 keeps that discipline and adds the tier system on top of it: P0/P1/P2 rank importance
within v1 scope, and a P2 is not a deferral. `00-README.md` §Tier definitions states this
explicitly, and it is worth restating here because the two ideas are easy to blur: **nothing in
this suite's tiers implies a sequence, a phase or a date.**

OV-44's exception (a) is deliberately phrased without naming the specific third parties or their
processes, because those are market-specific and belong to F1's packs; the product-level rule is
that an external approval clock never becomes a reason to reduce shipped scope. Exception (c) is
the studio's standing claim on further investment — consistent with OV-21, the flagship is never
"done".

## 4. Glossary

Canonical terminology for the whole suite. Where a term has a ruling behind it, the ruling is the
definition and this row is its summary. Every document in `docs/prd/` uses these words in these
meanings; a document that needs a different meaning must introduce a different word.

| Term | Definition | Source pointer |
|---|---|---|
| **Tenant** | One EPC organisation's isolated workspace. The unit of subscription, of data isolation, of market assignment and of currency. One tenant, one market, one currency. | `DOC01.org-pays`; global-backend ruling 2026-08-02 |
| **Owner** | The tenant's administrative audience — the persona who buys, configures, invites, and holds the widest visibility in the product. Every tenant has at least one at all times. | `DOC00.three-audiences`; `DOC04.user-lifecycle` |
| **Employee** | Any invited user of a tenant. Employees are documented individually as the twelve personas in `02-personas.md`; their access is decided entirely by their roles. | `DOC00.three-audiences` |
| **Customer** | The EPC's buyer — the homeowner or commercial buyer. Never a user of the platform; reached only through the customer link, calls and messages. | `DOC00.three-audiences` (D5) |
| **Persona** | One of the twelve documented user types in `02-personas.md`. A persona describes a job; a role grants access. | design spec §12 |
| **Role** | One of the fixed preset permission sets defined in F2. Roles are stackable, evaluated as a union across a user's roles, and widest visibility wins. There are no custom roles and no per-person permission exceptions. | `DOC00.nongoal-custom-roles` (D28, D29); DD3 |
| **Market pack** | The versioned unit of market configuration that makes a country a supported market: rules, catalog scope, templates and locale data published as one thing — tax model, incentive model, compliance ruleset and calendar, certification schemes, units, number and currency formatting, project-stage labels, document checklists, payment-mode vocabulary, phone specification. No market fact is ever a module-level constant. | `DOC02.market-pack-unit` (F1) |
| **Market-neutral** | The property a module body must have: it states behaviour and references market-pack keys, and contains no market's specific values. | design spec §6 |
| **Entitlement** | The current effective limit for a metered key on a tenant, recomputed whenever the plan or the charge state changes. Entitlements are the only runtime gating in the product. | `DOC04.entitlements-current`; `DOC00.nongoal-feature-flags` |
| **Soft block** | The state in which new creations of a given type pause while reading, searching, dashboards, export and customer links continue to work. The product soft-blocks; it never hard-blocks, and it never deletes data for non-payment. | `DOC16.soft-block-never-hard`; `DOC16.softblock.always-on` |
| **Meter** | A usage line the platform counts and prices against a bundle: voice-agent minutes, AI roof detections, storage, marketing sends, tracked seats. Metered usage is shown to the tenant from the same numbers it is billed from. | design spec §8 |
| **Tracked seat** | An employee for whom the owner has switched on active field tracking. The only per-seat meter in the product, billed as tracked-seat-months. Site check-in/out and visit logging are not tracked-seat features — they are core and included for every employee. | design spec DD7 |
| **Lead** | An enquiry with a person attached: the record a deal starts as. Deduplicated on phone number at capture from every channel. | `DOC04.lead-machine`; `S2.rule.dedupe` |
| **Snooze** | A first-class lead action with a mandatory wake-up date. A snoozed lead is hidden from My Day until it wakes — at 09:00 tenant-local on the wake date — and returns to its prior stage with a follow-up task. It can also be woken manually. Snooze is orthogonal to the lead's stage, and no state ever deletes. | R9 (`R9.snoozed`) |
| **Dormant** | The state a lead enters after thirty days with zero activity on an open stage. A sweep flags it; nothing deletes it; any activity returns it to its stage. Dormant leads are excluded from My Day and filterable in the leads list. | R9 (`R9.dormant`) |
| **My Day** | The task-driven home screen — a list of what to do today, not a dashboard of numbers. Overdue work first, then today's timed items, then what the automated agent did, then the week ahead. | `S7.rule.my-day` |
| **Survey** | Site capture, in two modes: remote (from imagery, in minutes) or physical (on site). Survey photos from any source, including drone, are reference for the designer and never measurement. | `DOC00.nine-stage-backbone` (D30); `DOC00.nongoal-measurement` (D35) |
| **Design** | A studio output for a lead: the roof model, the layout, the electrical sizing and the geometry the bill of materials is derived from. | `DOC00.nine-stage-backbone` |
| **Variant** | An alternative design for the same lead, shown alongside the others with its size, generation, price and payback, with one marked recommended. The customer sees one recommended system by default; variants exist for the price-sensitive or undecided buyer. | D16 |
| **Sign-off** | The engineer's append-only decision on a design, pinning exactly what was reviewed. A sign-off is approved, or returned with comments pinned to the fault. Editing a design after approval drops it back to unsigned. Structural adequacy is never computed — the record says who signed and when, and the disclaimer travels with every structure-bearing output. | `DOC04.signoff-append` |
| **Proposal** | The single customer-facing commercial document and the record behind it. One proposal object with two entry paths — built with a design, or built without one. **Naming note (R1):** the product says "Proposal" everywhere, in every launch locale, as entity, interface copy and customer-facing document; the words "quote" and "quotation" are banned from interface strings and identifiers. The one exception is global search, which accepts "quotation" and "quote" as query aliases because that is what users type. | R1; `DOC04.proposal-paths` |
| **Indicative proposal** | A proposal built without a design. Its numbers are estimated from capacity and location rather than derived from geometry, and it carries that fact visibly on the document — not in fine print — stating that a site survey and shadow analysis will confirm the final figures. | `S6B.rule.honesty`; R18 |
| **Bill of materials (BOM)** | The priced line-item list derived from a design — item, specification, quantity, unit, rate, tax, total. Internal: the customer never sees it. Its per-line confidence reads from the provenance enum. | `S6.screen.2`; R18 |
| **Catalog** | The single component surface, resolved in two tiers: the platform master catalog, the tenant's own items, and the tenant's sparse overrides, resolved override → own item → platform item. Certifications on catalog items are scheme-keyed, and the market pack declares which schemes a market requires. Items are archived, never destroyed. | R13; `DOC02.market-pack-unit` |
| **Catalog release** | A labelled, append-only publication of the platform catalog. The release label rides into designs and proposal versions, so publishing a release marks every design pinned to an older label as stale rather than silently changing it. | `DOC04.catalog-release-stale` |
| **Price book** | The versioned rate structure for rates that are not catalog item prices. Rates are versioned so that a proposal already sent keeps the rates it was built with, always. | `TC.pricebook.1`; R13 |
| **Provenance tier** | One of exactly four labels carried by every user-visible number: **measured** (captured on site), **derived** (computed from the model, imagery or design geometry), **estimated** (heuristic from capacity and location) or **assumed** (a catalog default with no design behind it). No screen invents a fifth tier. Energy figures additionally carry a source label naming the database behind them. | R18 (with R5 for energy source labelling) |
| **Money-never-stale** | The rule that a monetary figure never renders as final while it is stale: a figure whose inputs have moved since it was computed is labelled provisional rather than shown as current. Money is never displayed as though it were fresh when it is not. | `DOC00.honesty-conviction` |
| **Customer link** | The tokenised, no-login web address that carries the EPC's customer through the whole relationship: proposal → progress → handover. It shows the proposal with a 3D view of their actual roof, accept and ask-a-question actions, payment status, project progress with honest attribution of who is being waited on, and the handover pack. It is never blocked over unpaid platform money. | `DOC00.customer-link-audience` (D5); `DOCFC.link-full-lifecycle` |
| **Named link** | A per-contact, labelled customer link. A commercial deal with several stakeholders holds several named links, each with its own open attribution, so the product can say which stakeholder opened what. Still no accounts and still no portal. | R6; `DOC04.link-named-otp` |
| **OTP-at-accept** | The one-time-password challenge on the Accept action, applied above a tenant-set value threshold denominated in the tenant's currency. The acceptance record captures full attribution. Reading a proposal stays frictionless; only the commitment is verified. | R6 |
| **Tranche** | A named instalment of the customer's payment. Tranche templates are tenant configuration, and a tranche falls due on a project stage. Collections run through the tenant's own payment account — the platform never touches the customer's money. | `TC.payment-terms.1`; `DOC01.byo-collections`; R2 |
| **Project stage** | One of the nine canonical states a won deal moves through, from won to handed over, plus cancellation. Stage enum names are market-neutral; the labels a user reads, and which stages a market skips, are market-pack data. | R2 |
| **Blocker** | A sub-state riding on any project stage that names who is being waited on — the utility, the customer, materials, or us. Blockers are what make a long wait attributable instead of merely long. | R2 |
| **Voice agent** | The automated caller that does outbound follow-up and inbound answering in the customer's language, opens naturally under the tiered disclosure law (owner ruling 2026-08-04, Q6: no proactive AI mention at IN launch; never claims to be human, never denies being AI when asked, instant human handoff, full transcription; proactive disclosure is pack data with the TRAI auto-flip — `F1-36`(d)), and writes every call to the lead timeline. Its contribution to a won deal is reported as correlation, never claimed as attribution. | `DOC00.voice-touchpoint` and `CG-moat.1` as amended by owner ruling 2026-08-04 (Q6); D37 |
| **Compliance gate** | The mechanism every outbound call passes through before it is placed. The mechanism itself is fixed and non-swappable; the statutory ruleset it enforces — calling windows, do-not-call handling, disclosure timing, recording retention — is market-pack data. A market with no voice ruleset cannot enable outbound voice. | D36 (as amended 2026-08-02) |
| **Reference implementation** | The specific external provider used behind a product-owned capability boundary. Naming one is documentation, never a product commitment: swapping it is an adapter change. | `DOC07.ports-vendor-neutral` |
| **Studio census** | `docs/prd/modules/M05-studio/studio-census.md`, adopted verbatim as the acceptance baseline for the design studio. The census never shrinks: nothing in it is dropped, downgraded or reworded away between this pass and the dedicated studio pass. | design spec §3.2, DD13 |
| **Handover pack** | The closing document set the customer link exposes when a project completes. Commissioning artefacts are retained even though no monitoring surface exists, so that one can attach later without re-collection. | `DOC00.customer-journey-parallel`; `DOC00.nongoal-projects-light` (D9) |
| **v1 scope** | The scope of the product this suite specifies. Read every source phrase of the form "ships in the N-day build" as "in v1 scope": the scope commitment survives, the calendar does not. The suite carries no schedule of any kind. | owner directive OD-5 (docs/15 §4 directive 5); DD4 |

## 5. Cross-document contracts

What this document provides to the rest of the suite, and what it expects back.

**Provides.** The vision and product definition (§01.1); the ten goals every module should be
readable against (§01.2); the three convictions (§01.3); the eleven binding principles (§01.4);
the moat claims and their owning documents (§01.5); the scope law (§01.6); and the canonical
vocabulary (§4). Every other document may treat all of these as settled and reference them rather
than restating them.

**Expects.**

| From | This document expects |
|---|---|
| `02-personas.md` | Twelve personas that fall entirely within the three audiences of §2 — no persona that implies a customer login. |
| `03-journey-map.md` | A journey whose stages compose OV-04's single travelling record, with the customer journey riding the no-login link of OV-32. |
| `04-business-model.md` | Every price point and packaging mechanic, honouring OV-26 (soft-block), OV-28 (capacity not features), OV-29 (organisation pays) and OV-30 (tracked seats as the only per-seat meter), with India as a market book rather than the model. |
| `foundations/F1` | The market-pack framework that makes OV-23/OV-24 true, with India as the complete first pack and the vocabulary of §4's *Market pack* row. |
| `foundations/F2` | The fixed preset roles behind §2's Employees row and the glossary's *Role*; no custom roles, no per-person exceptions. |
| `foundations/F3` + `F7` | The vernacular interface and the binding visual language behind OV-40, and the naming law OV-35 applied across locales. |
| `foundations/F4` | The data-integrity laws the product's truth guarantees rest on: the server owns every money figure, a survey revisit never overwrites the earlier version, concurrent edits resolve without silent loss, and nothing a field user captured is ever unrecoverable. |
| `foundations/F5` | The no-login customer link behind OV-32, including named links and OTP-at-accept. |
| `foundations/F8` | The provenance mechanism behind OV-22 and OV-38 — four tiers, money-never-stale, indicative labelling, engineer sign-off. |
| `modules/M05` | A census-grounded studio that keeps OV-21 true and never shrinks the census. |
| `modules/M12` | Entitlements as the only runtime gating (OV-27) and the enforcement detail behind the soft-block law (OV-26). |
| Every module | A `Non-goals` section that names its exclusions with a rationale, so that OV-43's "no later bucket" stays honest. |

## 6. Non-goals

This document's own non-goals are stated in §1: it is not the business model, the personas, the
journey, or any module's specification, and it contains no schedule and no implementation
content.

The product's non-goals are summarised here and owned in full by the documents named. Each is an
explicit exclusion with a rationale, not a deferral — per OV-43 there is no "later" bucket.

| Non-goal | Rationale | Owned by |
|---|---|---|
| Inventory, purchase orders, crew scheduling | The product is the selling engine; projects are status, documents and money. | `modules/M08-projects.md` §Non-goals (D9; DD2) |
| Operations & maintenance, generation monitoring, an end-customer monitoring app | Deliberate. Commissioning artefacts are retained at handover so a future monitoring surface can attach without re-collection, but no telemetry, no monitoring code and no customer app are in scope. | `modules/M08-projects.md` §Non-goals (D9; `CG-6`) |
| LiDAR, photo measurement, augmented-reality capture | Survey photos from any source, including drone, are reference for the designer and never measurement. | `modules/M04-survey.md` §Non-goals (D35) |
| Discount approval workflows and per-rep discount ceilings | The only guard on a discount is arithmetic at generation time. Reserved for when a tenant asks for it. | `modules/M06-proposals.md` §Non-goals (D34, superseding D19); `modules/M01` (`TC.discount-limits.1`) |
| Custom roles and per-person permission exceptions | Fixed presets only, widened in V2 to roughly twelve roles matching the persona set. The preset-only principle is unchanged. | `foundations/F2-roles-and-permissions.md` §Non-goals (D28, D29; DD3) |
| Feature flags | Features ship enabled. Billing entitlements are the only runtime gating. | `modules/M12-platform-billing.md` §Non-goals (owner directive; OV-27) |
| Operational billing behind a power-purchase or operating-expense proposal | The proposal type exists; recurring invoicing and meter ingestion behind it do not. Nothing downstream branches on the type except the rendered document and its honesty label. | `modules/M06-proposals.md` §Non-goals (R17); bounds `modules/M11` |
| A perpetual free tier | Trial only. A free tier without a transaction-layer business behind it is metered cost with no revenue, and that transaction layer is a business this product deliberately does not enter. | `04-business-model.md` §Non-goals (`CG-12`) |
| Battery economics modelling beyond the transactional battery flow | The source's battery flow is carried as core; deeper storage economics is a recommendation, not a source or brief commitment. | `registers/enhancements.md` (design spec §10) |

**Two exclusions the V2 brief supersedes — recorded, not resolved.** The v1 corpus records two
non-goals that the owner's V2 brief overrides by adding new scope. Per the suite's conflict rule
these are recorded rather than silently reconciled. Both are dispositioned as `conflict` in
`registers/traceability.md`, and the owning module documents carry the tension into
`registers/conflicts.md` with their own scope statements:

- **Message sending on the customer's behalf.** v1's non-goal (D32) was that the product composes
  a message and the user pastes it into their own messaging app; link opens are tracked, delivery
  is not. V2's marketing module is brief-mandated to run campaigns across messaging channels
  including WhatsApp — and the owner's 2026-08-04 ruling (Q33) additionally made the
  **transactional lane** real product-wide: proposal links, payment links and status updates send
  automatically from the tenant's connected channel, with copy-paste as the no-channel fallback
  (D32's manual rule retired; `registers/conflicts.md` rows 4/8 annotated). Owned by
  `modules/M03-marketing.md` and `modules/M06-proposals.md`.
- **Inbound channel lead capture.** v1's non-goal (D13) limited lead sources to manual entry,
  spreadsheet import and inbound voice, leaving website and messaging channels out. V2's
  marketing module is brief-mandated to feed the pipeline from campaign channels. Owned by
  `modules/M03-marketing.md` and `modules/M02-crm-and-leads.md`.

## 7. Open questions

This document raises no new decision of its own that an owner must rule on: every ambiguity it
touched was already closed by the source's rulings or by the design spec's locked decisions.

One registered question bears directly on §01.2's affordability and scale goals and is repeated
here for the reader's convenience rather than re-raised: **Q1** — the India price points and
bundle sizes carried as the source-derived baseline need owner re-validation given V2's larger
scope. It lives in `registers/open-questions.md` and is owned by `04-business-model.md` and F1's
India pack.

Two source gaps recorded in `registers/conflicts.md` also touch this document's framing and are
noted so a reader does not mistake them for omissions: the missing `docs/research/*` files cited
by the source's vision and business-model documents, and the deleted per-module extractions cited
by the source product README. Facts surviving only as citations are used as-is with the citation
noted, and nothing is invented to fill either gap.
