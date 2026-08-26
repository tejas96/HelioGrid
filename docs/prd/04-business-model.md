# 04 · Business model — packaging, tiers, meters and the market price book

Status: draft · Origin mix: SRC-dominant (docs/01 business model + docs/16 §1/§3 through the
overlay) with `BRIEF` for the two V2 meters and the market price-book architecture (DD5/DD6/DD7,
design spec §8); no `REC` items · Depends on: `00-README.md`, `01-product-overview.md` (`OV-17`,
`OV-18`, `OV-20` reach; `OV-26`–`OV-30` the gating and pricing principles this document owns the
commercial law behind), `02-personas.md` (the EPC Owner as buyer), `foundations/F1-global-market-framework.md`
(`F1-25`–`F1-27` price-book law, `F1-13` tax posture, `F1-28`–`F1-30` IN tax scheme, `F1-38` IN
messaging compliance, `F1-40`/`F1-41` IN mandate rails, `F1-60`/`F1-61` the IN book
identification), `foundations/F2-roles-and-permissions.md` (`F2.M12.manage-billing` — Owner-only),
`foundations/F4-data-integrity.md` (`F4-21`, the field-photo carve-out; register Q16),
`foundations/F8-data-honesty.md` (`F8-33` usage-screen honesty, `F8-34` honest billing copy) ·
Forward: `modules/M12-platform-billing.md` (mechanics), `modules/M13-dashboards-and-reporting.md`
(reporting vocabulary), `modules/M03-marketing.md` (sends meter), `modules/M09-field-workforce.md`
(tracked seats), `modules/M11-payments-and-collections.md` (tenant-side money), `modules/M07`
(voice bundle), `modules/M04` (detections bundle).

## 1. Purpose & scope

This document is the commercial law of HelioGrid: who pays, the packaging convictions, the tier
architecture, the canonical meter set and its COGS policy, the trial, the soft-block law with its
state capability matrix, the market price-book architecture, grandfathering, and the go-to-market
principles carried at product level. Three vocabularies defined here are suite-wide interfaces:
the **four tier names** (Starter · Growth · Pro · Enterprise), the **five-meter list** (voice
minutes · AI roof detections · storage · marketing sends · tracked field seats), and the
**billing-state names** (`trialing` · `active` · `past_due` · `halted` · `expired` ·
`cancelled`). `modules/M12` and `modules/M13` build on these names and never rename them.

**One definition per fact.** This document is the single source for prices, caps and bundle
sizes — the successor to the source corpus's rule that docs/01 defines every commercial number
once and docs/16 fixes mechanics only (BM-09). `foundations/F1` states what a price book *is*
(F1-25–F1-27) and identifies the India book (F1-60/F1-61); **this document owns the India book's
numbers**. No other document in the suite states a price, a cap or a bundle size.

**Tag reading convention (F1 precedent).** Every requirement row carries exactly one governing
origin tag — the tag that leads its tag cell. Where a `SRC` row's scope was widened or amended
by a locked V2 decision, a parenthetical amendment note (`BRIEF` — DD or design-spec reference)
names the amending authority; the note is provenance for the amendment, **not a second tag**,
and the row remains `SRC`-governed for everything the source states.

What this document is explicitly **not**: it carries no billing mechanics — subscription
lifecycle transitions, entitlement enforcement points, the usage ledger, dunning, invoicing,
refunds/proration/cancellation, reactivation and the usage screens are `modules/M12`'s; the
tenant's own customer collections (tranches, BYO gateway, receipts) are `modules/M11`'s; the
behavior of the marketing and field-workforce capabilities whose meters are defined here is
`modules/M03`/`modules/M09`'s. It contains no APIs, schemas or vendor commitments, and — per
DD4 — no dates, phases or build plan.

## 2. Personas & surfaces

The **buyer is the EPC organisation**; the administering persona is the **EPC Owner**
(`02-personas.md` §EPC Owner). The subscription is org-level and owner-administered: managing
the tenant's plan, payment method and billing state is Owner-only (`F2.M12.manage-billing`).
Every other persona is a beneficiary, never a payer — users are unlimited on every tier (BM-06)
and the EPC's customer never pays the platform anything (BM-02).

Surfaces (owned by M12, governed by the laws here): the public pricing page; the in-app billing
screens (available in every billing state, web emphasis with full mobile parity per the suite's
lockstep law); the usage screens (same numbers the product enforces and bills from, `F8-33`).
Finance-persona visibility of invoices and usage follows F2's matrices; this document adds no
grants.

## 3. Commercial areas

### 04.1 — Who pays, and the packaging convictions

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| BM-01 | **The EPC organisation pays. Nobody else.** One subscription per tenant, owner-administered, covering every employee. What a tenant pays for is capacity, usage counts and metered bundles on one org-level subscription — never a count of people (sole exception: BM-22). | `SRC` — `DOC01.org-pays` (docs/01, disposed by Task 3 → `OV-29`; this row is the commercial law it resolves to); `DOC16.org-pricing` (docs/16 §1) | P0 |
| BM-02 | **The EPC's customer never pays the platform anything.** Two money systems exist and never mix: (1) platform SaaS billing — the tenant pays us, on our merchant account; (2) tenant customer-collections — the homeowner/factory pays the EPC through the tenant's own gateway account, funds settling EPC-direct. The platform never touches tenant funds. | `SRC` — `DOC16.two-money-systems` (docs/16); `DOC01.byo-collections` (docs/01, shared — collections mechanics are `modules/M11`'s) | P0 |
| BM-03 | **Billing is in the product from the first release. Trial-only; no free tier, ever.** The v1 deferral (D38) is superseded by owner override (2026-07-24): payments, subscriptions, billing, entitlements and usage metering are core scope. A time-boxed trial exists (§04.4); a perpetually free tier does not. | `SRC` — `DOC16.billing-in-v1`; `OD-4` (docs/15 §4 directive 4, shared — mechanics `modules/M12`); `D38` + `BILL.1` (superseded text, recorded in traceability); `DOC01.no-free-tier` (user decision, final); `UD-5` (cited — `modules/M12` disposes) | P0 |
| BM-04 | **Seats are never the meter.** There is no seat-count anywhere in the price of the product (sole exception: BM-22, a cost-carrying capability add-on, not a licence). Rationale is the moat: whole-company adoption is what makes the single travelling record work, and pricing by headcount punishes exactly that behaviour in a market where EPCs employ many low-cost designers and field reps. | `SRC` — `DOC16.org-pricing` ("org-level and capacity-tiered", owner directive); `CG-moat.6` (docs/12, disposed by Task 3 → `OV-29`/`OV-42`; this row is the pricing law it resolves to) | P0 |
| BM-05 | **Every module is in every tier. Tiers gate capacity ceilings + usage counts + metered bundles — never features** (owner-confirmed). Every feature is in every tier: CRM and projects, the full studio (shadow analysis, all obstruction types, tin-shed/metal-roof, ground mount, structures, SLD + AC/DC and earthing layouts, industrial drawing sheets, PV/energy reports, DXF/SVG/PDF export), customer links, all languages — and the V2 additions (marketing, field workforce, HR) enter under the same law. Competitors ransom capabilities into higher tiers; the pricing page says so. | `SRC` — `DOC01.gates-capacity-not-features` (docs/01, disposed by Task 3 → `OV-28`; this row is the tier axis it resolves to); extension to V2 modules per DD5 (`BRIEF` — *retired: PRD design note* §2) | P0 |
| BM-06 | **Unlimited users on every tier.** Adding a person to the tenant never changes the bill (sole exception: turning tracking ON for that person, BM-22). | `SRC` — `DOC16.unlimited-users` (docs/16 §1, owner-confirmed) | P0 |
| BM-07 | **Caps are upgrade signals and abuse bounds, never feature ransoms.** Every cap is visible and generous, published on the pricing page and on the usage screen; outgrowing a cap IS the upgrade signal. Enforcement is soft-block with read + export always working (§04.5). | `SRC` — `DOC01.creation-caps` (docs/01, owner directive; shared — enforcement points are `modules/M12`'s per `DOC01.cap-soft-block`) | P0 |
| BM-08 | **A price for every EPC** (owner directive). The entry tier exists so that price is never the reason a small EPC stays on spreadsheets; the top of the range is a sales-assisted tier for utility-scale and open-access work. The reach law is `OV-17`/`OV-18`/`OV-20`; this document is where the tiers that deliver it live. | `SRC` — `DOC01.price-for-every-epc` (docs/01, disposed by Task 3 → `OV-20`; this row is the tier consequence it resolves to) | P0 |
| BM-09 | **One definition per fact.** Prices, caps and bundle sizes are defined once, in this document; `modules/M12` fixes billing mechanics only and restates no number; every other surface (pricing page, usage screens, F1's book identification) points here. | `SRC` — `DOC16.pricing-single-source` (docs/16 §1) | P0 |
| BM-10 | **Market scope law.** Every concrete number in this document is a fact of one market's price book — the India book, the source-derived first instance (§04.6) — and is marked as such. Nothing numeric here is the generic model; the framework rules (this section, §04.2 structure, §04.3 policy, §04.4 trial law, §04.5, §04.7 law, §04.8 principles) are market-neutral. | `SRC` — `DOC01.in-price-book` (docs/01 market-scope note, disposed by Task 3 → `OV-25`; this row is the document-level discipline it resolves to) | P0 |

**Behavior detail.** BM-01 through BM-10 are the convictions the rest of this document
instantiates, and they are deliberately stated as laws rather than as positioning: a requirement
elsewhere in the suite that violates one of them is a defect, not a trade-off. The source's nine
binding pricing principles are all carried, three of them amended by locked V2 decisions:

| v1 pricing principle (docs/01 §Pricing principles) | V2 disposition |
|---|---|
| 1 — Price under the incumbents at equivalent capacity, always | Carried, generalized per market: BM-39 (each book records its benchmarks and prices under them; the IN benchmarks are BM-41's) |
| 2 — No seat-based pricing, no seat penalty | Carried as BM-04, **amended by DD7**: exactly one seat-counting exception exists (BM-22) and the suite's credibility depends on it staying the only one (`OV-30`) |
| 3 — Monthly or yearly on every tier; yearly = 2 months free | Carried as BM-13; **amended by DD6**: the collection rail per cycle is market-pack data (IN: F1-40), not a product rule |
| 4 — Tiers gate capacity, never features; entitlements are the only gating; soft-block | Carried as BM-05 (+ `OV-27`/`OV-28`); soft-block law at §04.5 |
| 5 — Metered things carry bundles + overage ≥40% above worst-case unit COGS | Carried as BM-17, **extended by design spec §8/DD7** to all five meters, including the two V2 meters |
| 6 — Prices ex-tax; we are supplier of record | Carried as BM-40, generalized: the tax posture is each market's `pack.tax` declaration (F1-13); IN instance is ex-GST with the platform as supplier of record (F1-29) |
| 7 — Grandfather generously | Carried as BM-42 (§04.7) |
| 8 — A price for every EPC | Carried as BM-08 |
| 9 — Creation caps per tier: visible, generous, soft-blocked | Carried as BM-07 + BM-34; counts are book data (BM-41) |

**Permissions.** Billing administration is Owner-only (`F2.M12.manage-billing`); nothing in this
area creates a tenant-configurable surface — a tenant cannot configure their way out of any law
here, and support cannot override one (goodwill credits are M12's audited entitlement-override
records, cited).

**Edge cases & what-goes-wrong.**

- *A future module ships a capability behind a higher tier* → defect against BM-05; the review
  question is never "which tier gets this?" but "what capacity ceiling or meter does this add
  to?".
- *A well-meaning discount or bundle is proposed per user* → defect against BM-04 unless it is
  the BM-22 exception; there is no second seat-counting meter (§5).
- *A price or cap gets restated in another document and drifts* → defect against BM-09; the fix
  is a pointer, never a copy.

**Acceptance criteria.**

- Given any platform charge in any cycle, when it is raised, then it bills the tenant's one
  org-level, owner-administered subscription — no employee, and no other party, ever holds a
  second billable relationship with the platform (BM-01).
- Given a collection from the EPC's own customer (advance or tranche), when it settles, then it
  settles EPC-direct on the tenant's own gateway account and no platform revenue line touches
  it — the two money systems never mix (BM-02).
- Given a new signup that never pays, when its states are enumerated over any span of time, then
  the only non-paying states are the 14-day `trialing` and its `expired` aftermath — no path
  into a perpetual free tier exists anywhere in the product (BM-03).
- Given any tier and any module, when a tenant on that tier opens that module, then no
  capability is absent that a higher tier has (BM-05) — only ceilings, counts and bundle sizes
  differ.
- Given a tenant adds their fifty-first user, when the next invoice is produced, then it is
  unchanged unless tracking was toggled on for someone (BM-06, BM-22).
- Given any cap in any tier, when the pricing page and the usage screen render, then the cap is
  published and visible on both, and reaching it produces §04.5's soft-block with an upgrade
  path — never a feature withdrawal and never a surprise (BM-07).
- Given the smallest EPC in a market with an authored book, when they read that book, then a
  self-serve entry-tier price exists for them and a sales-assisted tier tops the range — price
  is never the reason a small EPC stays on spreadsheets (BM-08).
- Given any surface in the suite states a price, cap or bundle size, when it is compared to this
  document, then it is either this document or a pointer to it (BM-09).

**Localization notes.** Pricing-page and billing copy exist in every launch language under F3's
architecture; amounts render in the tenant's currency with the market's grouping (F1-21 via F3
formats). **Analytics events:** pricing-page tier viewed; trial started; trial converted (the
GTM conversion metric, BM-47).

### 04.2 — Tier architecture: four tiers as structure

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| BM-11 | **Four tiers, fixed names: Starter · Growth · Pro · Enterprise.** The names are market-neutral structure and suite-wide vocabulary — every market's price book prices these same four tiers in its own currency (F1-25), every entitlement is keyed to them (M12), every report that segments by plan uses them (M13). No market renames, adds or removes a tier; a market that cannot serve a tier's capacity has no book for it (which is a book-authoring decision, not a product change). | `SRC` — `DOC01.tier-table` (docs/01 — structure half; the IN values are BM-41's); tier set fixed per DD6 (`BRIEF` — design spec §2) | P0 |
| BM-12 | **The tier axis is capacity, in four kinds:** (a) the **single-design kW ceiling** — the industry's own capacity ladder, adopted deliberately so buyers can compare rung-for-rung; (b) **per-cycle creation counts** (proposal creations per month; an active-project count on the entry tier); (c) **metered bundles** (§04.3 allowances per meter); (d) **storage**. The ceiling is a billing entitlement enforced at save/generate boundaries — never a clamp inside the design engine and never a mid-edit interruption (mechanics M12/M05). | `SRC` — `DOC16.capacity-levers` (docs/16 §1); axis adoption per `DOC01.reslink-calibration` (docs/01 calibration note — the benchmark values are BM-41's); enforcement location per `DOC05.no-kw-clamp` and `DOC16.gate.design-kw` (cited — `modules/M12` owns the gates) | P0 |
| BM-13 | **Every tier bills monthly or yearly.** Yearly = pay for 10 months, get 12 — two months free (~17% saving), one collection per year. All prices are exclusive of the market's tax scheme (F1-13; IN: ex-GST at the scheme rate, F1-28). Which rail collects which cycle is market-pack data, not product law (IN: monthly rides the mandate ladder, every yearly total exceeds the mandate cap and is collected as a single payment link/invoice — F1-40). | `SRC` — `DOC01.billing-cadence` (docs/01, owner directive; the ₹ anchors are BM-41's); `DOC01.yearly-payment-rail` (docs/01, shared — the cadence/collection posture lands here, rail mechanics are `modules/M12`'s and the IN rail facts F1-40's) | P0 |
| BM-14 | **Tier positioning laws** (each tier has a job): **Starter** is the "every EPC" tier — a 1–5 person residential shop runs its whole business on it, and outgrowing its caps IS the upgrade signal. **Growth** is the default recommendation past roughly 15 installs a month or the first small C&I work. **Pro** is the C&I tier, carrying the voice bundle no competitor offers at any price. **Enterprise** is for the largest single designs, open-access and utility work — sales-assisted, annual contracts. Positioning informs bundle sizing and pricing-page copy; it never creates a feature difference (BM-05). | `SRC` — `DOC01.tier-positioning` (docs/01, disposed by Task 3 → `OV-20`; this row is the per-tier law it resolves to) | P1 |
| BM-15 | **Enterprise commercial structure.** Enterprise is custom-priced (anchored in the market book, BM-41), sales-assisted, annual-contract, with custom bundle sizing and — as bespoke commercial arrangements — white-label options (custom domain + unbranded customer links), custom integrations / the public API surface, and BYO voice number. **Reading recorded, not silently resolved:** the source states both the never-features law (BM-05) and these Enterprise items in one document. The reading this suite carries: BM-05 governs the product's capabilities — nothing a self-serve tenant can *do inside the product* is withheld; the Enterprise items are commercial and service arrangements (re-branding of customer-facing surfaces, bespoke integration work, custom bundle economics, number provisioning) that exist only under sales-assisted contracts. If the owner rules the public API is a product capability rather than a service arrangement, it moves under BM-05 and out of this row. | `SRC` — `DOC01.tier-table` (docs/01 Enterprise column) | P1 |

**Behavior detail.** The structure/instance split is deliberate and is the DD6 architecture at
work: BM-11–BM-15 are what every market shares; §04.6's BM-41 is where the first market's
numbers live. A reader in a future market reads this section unchanged and reads their own
book's table instead of BM-41. The single-design kW ceiling (not cumulative capacity per month)
is the axis because the market already thinks in it — the calibration that ruled this also
replaced an earlier cumulative-kWp meter design, and that replacement is carried: no cumulative
capacity meter exists anywhere in V2.

**Permissions.** Tier selection, upgrades and cycle switches are Owner-only
(`F2.M12.manage-billing`); mechanics (immediate entitlements on upgrade, boundary-effective
downgrades with an honest preview) are M12's, cited: `DOC16.upgrade`, `DOC16.downgrade`.

**Edge cases & what-goes-wrong.**

- *A tenant's existing designs exceed a lower tier's ceiling at downgrade* → the downgrade
  preview states exactly what will be blocked before confirming, and existing over-ceiling
  designs remain readable and exportable forever (M12's mechanics, `DOC16.downgrade` cited; the
  law that makes this non-negotiable is §04.5).
- *A design in progress crosses the tier ceiling* → the ceiling is enforced at save/creation and
  proposal generate only; the studio is never interrupted per-keystroke (`DOC16.gate.design-kw`,
  cited — M12/M05 own the gate UX).
- *Enterprise negotiation asks for a capability carve-out* ("we'll pay less without the field
  app") → not offered; Enterprise varies price, bundles and services, never the capability set
  (BM-05).

**Acceptance criteria.**

- Given any two tiers, when their capability sets are compared, then they are identical and only
  ceilings/counts/bundles/storage/service terms differ (BM-05, BM-12).
- Given a market book, when its tier rows are read, then they price exactly the four BM-11 tiers
  and no others.
- Given the yearly cycle on any tier, when its price is checked against the book's monthly
  price, then it follows the pay-10-get-12 principle (BM-13) — with the authored book value
  governing where the source's own book deviates: the IN book's Pro yearly is the source's own
  ₹99,999, ₹9 above the ten-month formula's ₹99,990, and is carried as-is (BM-41). The formula
  is the sizing principle; the book row is the price.

**Localization notes.** Tier names are product vocabulary and render as-is in every locale
(consistent with the suite's naming law discipline; F3 owns any ruling to the contrary).
**Analytics events:** tier upgraded; cycle switched; downgrade preview shown.

### 04.3 — The meter set and the metered-COGS policy

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| BM-16 | **The canonical meter set — five meters, a closed list:** **voice minutes** · **AI roof detections** · **storage** · **marketing sends** · **tracked field seats**. These are the only usage lines a tenant can ever be billed for. OTP delivery and field-location ingestion are absorbed costs (BM-24), not meters. Adding, removing or renaming a meter is a change to this document first; M12's usage ledger and usage screens, and M13's usage reporting, consume exactly this list. | `SRC` — `DOC01.metered-bundles` (docs/01 — the three carried meters); `BRIEF` — design spec §8 (marketing sends; "existing meters carried: voice minutes, AI detections, storage; OTP stays absorbed") and §2 DD7 (tracked field seats) | P0 |
| BM-17 | **The metered-COGS law.** Every meter whose unit carries real cost is sold as a **bundle allowance per tier plus published per-unit overage**, and the overage rate in every market's book sits **≥40% above the worst-case unit COGS** in that market. Bundles are sized so **no tier can go margin-negative** at 100% bundle burn, and the self-serve target is gross margin ≥80% at typical utilisation. This law applies to all five meters, including the two V2 meters — a marketing-send or tracked-seat price that violates it is an invalid book row. | `SRC` — `DOC01.margin-ruling` (docs/01 unit-economics ruling); extension to the V2 meters per `BRIEF` — design spec §8 ("bundles + overage ≥40% above worst-case unit COGS") and §2 DD7 | P0 |
| BM-18 | **Voice minutes** — the all-in cost of an outbound/AI-inbound agent call (telephony + speech + language processing + compliance scrub + compute), metered per completed-call minute. Sold as tier bundles with per-minute overage on bundled tiers and pay-as-you-go per-minute pricing where a tier carries no bundle; rates and bundle sizes are book data (IN: BM-41). A call bills only what the ledger records (mechanics M12). | `SRC` — `DOC01.metered-bundles` (docs/01); ledger/event rules per `DOC16.metering-rules`, `DOC16.usage-ledger` (cited — `modules/M12`) | P0 |
| BM-19 | **AI roof detections** — automated roof-outline detection from imagery, metered per detection that returns a result (failures never bill — cited, M12). Sold as tier bundles with per-detection overage; rates per book. Manual outlining is always available and never metered — a tenant out of bundle can always keep working by hand. | `SRC` — `DOC01.metered-bundles` (docs/01); failure/manual rules per `DOC16.metering-rules`, `DOC16.gate.ai-detection` (cited — `modules/M12`/`modules/M04`) | P0 |
| BM-20 | **Storage** — object storage for the tenant's photos, documents and generated PDFs, sold as a per-tier ceiling (GB) with the gauge measured, not counted (nightly snapshot — cited, M12). Reads and exports are never storage-gated (§04.5); enforcement touches new uploads only, with soft headroom (cited, M12). | `SRC` — `DOC01.metered-bundles` / `DOC01.tier-table` storage lever (docs/01); gauge + headroom per `DOC16.metering-rules`, `DOC16.gate.storage` (cited — `modules/M12`) | P0 |
| BM-21 | **Marketing sends** (V2 meter) — outbound marketing messages across the channels where the platform itself carries a per-send cost: **WhatsApp, SMS and email**. Sold as per-channel bundles with per-send overage; bundle sizes, rates and the billable unit per channel (where an upstream prices by conversation rather than message, the book names the unit it bills) are market-book data — the IN book carries the owner's draft bundle sizes and overage rates pending rate-card verification (BM-41; owner ruling 2026-08-04, Q1). Channels where spend settles tenant-direct with the ad network (e.g. paid social campaigns) are not platform meters. Marketing sends ride the market's messaging-compliance rules (IN: DLT-registered templates, F1-38); compliance is never a paid feature. | `BRIEF` — design spec §8 ("marketing sends (WhatsApp/SMS/email bundles per market book)") + `docs/prd/owner-brief-2026-08-03.md` §Marketing; COGS law extension per BM-17 | P0 |
| BM-22 | **Tracked field seats (V2 meter) — the sole seat-counting exception in the product.** Active field-worker tracking is a **per-tracked-seat monthly add-on**, because live tracking carries a real per-worker COGS (continuous location ingestion, processing and retention) and the industry prices it per worker. The per-seat bundle covers: **live location, route timeline, geofencing, movement history, activity playback** (M09 behavior). The **owner toggles tracking per employee**; only toggled-on employees are billed, as **tracked-seat-months** in the usage ledger (month-fraction mechanics are M12's). The per-seat price is market-book data — IN: **draft ≈₹99/seat/mo beyond the tier's included allowance (Starter 0 / Growth 3 / Pro 10 / Enterprise custom), pending rate-card verification** (owner ruling 2026-08-04, Q1/Q17; BM-41). Location ingestion for tracked seats is covered by the seat price — there is no second ingestion meter. No other capability is ever priced this way, and this row is the only place the product counts seats (`OV-30`). | `BRIEF` — design spec §2 DD7 (verbatim boundary and billing unit) + §8; `docs/prd/owner-brief-2026-08-03.md` §Field-workforce; included-seat ladder + draft price per owner ruling 2026-08-04 (Q1/Q17) | P0 |
| BM-23 | **The included boundary of field workforce:** **site check-in/out and visit logging are included in every tier for every employee** — they are part of the core visit workflow, not part of the tracked-seat add-on, and they never require a tracked seat. An EPC that never buys a tracked seat still gets full check-in/out and visit-logging capability across its whole team. | `BRIEF` — design spec §2 DD7 ("Included in every tier: site check-in/out and visit logging (part of the core visit workflow)") | P0 |
| BM-24 | **The absorbed-cost law.** Costs too small or too structural to bill honestly are absorbed and fair-use capped, never metered to the tenant: **OTP delivery** (login and link-verification messages) and **field-location ingestion outside the tracked-seat add-on** (the check-in/out and visit-logging events of BM-23). Absorbed lines are still measured internally for cost visibility (mechanics M12), and fair-use enforcement — if ever exercised — follows §04.5's soft-block law, never a silent degradation. | `SRC` — `DOC01.metered-bundles` (docs/01: OTP "Not billed — absorbed, fair-use capped"); extension to location ingestion per `BRIEF` — design spec §8 ("OTP stays absorbed/fair-use") as applied by DD7's cost boundary | P0 |
| BM-25 | **Third-party cost containment is a platform duty, never a tenant surface.** Externally priced calls (solar imagery, AI extraction, speech) are server-proxied with per-tenant metering and quotas so a runaway tenant cannot torch margin; free public sources (the energy source of record) cost nothing and are never billed. None of this appears as tenant configuration. | `SRC` — `DOC01.metered-bundles` (docs/01: "server-proxied with per-tenant metering and quotas so a runaway tenant cannot torch margin"; "PVGIS is free") | P0 |
| BM-26 | **COGS provenance caution, carried verbatim:** the AI-detection COGS figures behind BM-17's floors rest on **unverified vendor-rate estimates** ("confirm official rate cards"). No COGS figure inherited from source is presented as verified anywhere in the suite; the ≥40% overage floor is computed against *worst-case* COGS precisely because the estimates are unverified. The same caution applies to the V2 meters until each market's book records verified channel rates — the owner's 2026-08-04 ruling (Q1) recorded **draft** add-on numbers in BM-41 under exactly this caution: they stay draft, and the meters stay unsellable, until the rate cards are verified. (Owner ruling 2026-08-04, Q1.) | `SRC` — `DOC01.rate-card-caution` (docs/01, CAUTION carried); draft-pending status per owner ruling 2026-08-04 (Q1) | P1 |
| BM-27 | **Usage transparency is law, not UX polish.** The tenant-visible usage screen shows exactly the rollups the product enforces and bills from — same numbers, no smoothing — labelled with period and provenance, and a bundle's consumption is disclosed **before** any gate fires (the 80% pre-warning). This is `F8-33`'s law; M12 owns the screen and the ledger. Accruing overage is shown in the tenant's currency with the market's grouping as it happens (cited, M12). | `SRC` — `F8-33` (consumed as a published requirement; the source key `DOC16.usage-honesty` is dispositioned by Task 7, gate mechanics re-appended by `modules/M12`); `DOC16.overage` (cited — `modules/M12`) | P0 |

**Behavior detail.** The meter set is the product's honesty about cost: everything that scales
with usage is metered and bundled (BM-16–BM-22); everything that does not is absorbed (BM-24);
and the tenant can always see the same numbers the invoice will use (BM-27). The two V2 meters
enter the existing discipline rather than inventing a new one — marketing sends are a classic
per-unit COGS line exactly like voice minutes, and tracked field seats are deliberately framed
as a *metered add-on on a capability* rather than a licence: the tenant buys tracking for the
specific people whose live movement they need, and nothing else in the product knows or cares
how many people the tenant employs. Voice-minute, detection and send *rates* are book data;
the meters' definitions above are not.

**Permissions.** The tracking toggle of BM-22 is an owner decision surface (M09 specifies it;
F2's matrices carry the grant). Bundle sizes and rates are never tenant-configurable; quotas
(BM-25) are platform ops.

**Edge cases & what-goes-wrong.**

- *A tenant exhausts a bundle mid-cycle* → the pre-warning fired at 80% (BM-27); overage
  accrues at published rates or — for capped counts — §04.5's grace applies. Nothing stops
  reading, exporting or manual alternatives (BM-19).
- *A full-burn tenant runs every bundle to 100%* → accepted by construction: BM-17 sizes bundles
  so the tier stays margin-positive, and a persistently full-burn tenant is an upgrade
  candidate, not a loss (source unit-economics ruling).
- *An employee is toggled off tracking mid-month* → billing follows tracked-seat-months in the
  ledger (mechanics M12); check-in/out and visit logging continue unchanged (BM-23).
- *A marketing channel's upstream pricing model changes* → the book revision updates the
  channel's billable unit and rates (F1-25 versioning); the meter definition here does not
  change.
- *OTP or ingestion abuse under fair-use* → a platform-ops conversation under BM-24's law,
  surfaced honestly; never a silent throttle.

**Acceptance criteria.**

- Given any tier in any market's book, when every meter — voice minutes (BM-18), AI roof
  detections (BM-19), storage (BM-20) and marketing sends (BM-21) — is burned to 100% of its
  bundle and beyond, then per-unit overage bills at the book's published rate and that rate is
  ≥40% above the market's worst-case unit COGS (BM-17); a detection that returned no result and
  a manual roof outline bill nothing (BM-19), and storage enforcement touches new uploads only
  (BM-20).
- Given M12's usage ledger and M13's usage reporting, when billable usage lines are enumerated,
  then they are exactly the five meters of BM-16 — voice minutes, AI roof detections, storage,
  marketing sends, tracked field seats — and no other billable line exists (BM-16).
- Given a tenant driving an externally priced capability at runaway volume, when per-tenant
  quotas engage, then containment happens platform-side with no tenant configuration surface
  involved, and any tenant-visible pause follows §04.5's soft-block honesty (BM-25).
- Given a tenant with zero tracked seats, when a field employee checks in and logs a visit, then
  the action succeeds on every tier and no usage line is billed (BM-23, BM-24).
- Given a tenant with three employees toggled on, when the cycle's usage ledger is rolled up,
  then tracked-seat-months reflect exactly those three toggles and no other people-count
  appears anywhere in the bill (BM-22, BM-04).
- Given any bundle at 80% consumption, when the owner opens the usage screen, then the screen
  already says so, before any gate has fired (BM-27 / `F8-33`).

**Localization notes.** Meter names are product vocabulary translated under F3; units (minutes,
GB, sends, seat-months) render with the market's number formats (F1-21). **Analytics events:**
bundle 80% pre-warning shown; overage accrual begun; tracking toggled on/off (owner action,
audited per F2-22).

### 04.4 — Trial

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| BM-28 | **The trial is 14 days, full-feature, every tier capability, no payment instrument at signup.** Signup stays phone + OTP + company name; the trial is the product's only non-paying state and its only acquisition motion (no free tier, BM-03). Trial usage is capped to bound COGS; the cap values are market-book data (IN: 25 AI roof detections · 15 voice-agent minutes · 5 GB storage, BM-41). | `SRC` — `DOC01.trial` (docs/01); trial modelling/extension mechanics per `DOC16.trial` (cited — `modules/M12`) | P0 |
| BM-29 | **Payment is collected at conversion, never at signup.** The mandate or payment method is established when the owner converts to a paid tier — the rail that collects it is market-pack data (IN: F1-40). No card wall ever guards the trial. | `SRC` — `DOC01.mandate-at-conversion` (docs/01, shared — the conversion-not-signup law lands here; gateway mechanics are `modules/M12`'s, the IN rail facts F1-40's) | P0 |
| BM-30 | **Trial expiry is a soft block, never a cliff.** An unconverted trial becomes `expired` — terminal as a trial but permanently reactivatable by paying (mechanics M12): the tenant's data is retained indefinitely, read + export + customer links keep working (§04.5), and creating new records pauses. No trial data is ever deleted for non-conversion. | `SRC` — `DOC01.trial-soft-block` (docs/01, shared — the law lands here; enforcement `modules/M12`); `DOC16.trial-expired-terminal`, `DOC16.reactivation` (cited — `modules/M12`) | P0 |
| BM-31 | **Trial COGS is a bounded, accepted acquisition cost.** The trial caps exist to bound the platform's worst-case spend per trial (IN book: ≈₹300–500 per trial at the BM-41 caps) — an accepted customer-acquisition component, sized by the book's cap values, never by degrading the trial experience (BM-28's "every tier capability" is not negotiable against COGS). | `SRC` — `DOC01.margin-ruling` (docs/01: "Trial COGS bounded ≈₹300–500/trial by trial caps"); `DOC01.trial` (caps) | P1 |

**Behavior detail.** The trial is deliberately the whole product: every tier capability, so the
thing being evaluated is the thing being bought. What bounds the platform's exposure is the cap
set, not capability withdrawal — a trialing EPC hits the same soft-block UX at a cap that a
paying tenant hits at a bundle edge, with the same honesty (80% pre-warning, `F8-33`). Trial
nudges and the one support-grantable extension are M12 mechanics (cited: `DOC16.trial-nudges`,
`DOC16.trial`).

**Permissions.** Starting a trial is signup (M01); converting is Owner-only
(`F2.M12.manage-billing`).

**Edge cases & what-goes-wrong.**

- *A trial hits a cap on day 3* → soft-block UX with upgrade path; manual alternatives (BM-19)
  and all reads/exports continue; the trial does not extend because a cap was hit.
- *A trial expires with real data inside* → `expired` behaves as §04.5's halted column: the data
  is the tenant's, exportable forever, and one payment away from live again.
- *A tenant serially re-trials to farm capped usage* → an abuse-bounds question for platform ops
  under BM-24/BM-25 discipline; the product answer stays soft (caps bound the exposure by
  construction).

**Acceptance criteria.**

- Given a new signup, when the trial starts, then no payment instrument exists on file and every
  tier capability is available within the book's trial caps (BM-28, BM-29).
- Given a trial that converts on day 9, when entitlements are checked, then paid entitlements
  apply immediately and payment was collected at that moment, not before (BM-29; mechanics M12).
- Given a trial that never converts, when day 14 passes, then the tenant enters `expired`, keeps
  read + export + customer links, and can reactivate by paying at any later time (BM-30).

**Localization notes.** Trial copy (nudges, expiry, conversion) exists in all launch languages;
day counts are cardinal numbers, not dates. **Analytics events:** trial started; trial cap
80%/100% reached; trial converted; trial expired.

### 04.5 — The soft-block law and the state capability matrix

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| BM-32 | **The soft-block law.** The product soft-blocks, never hard-blocks. In **every** billing state without exception: **read everything** (search, dashboards included), **export everything** (CSV, data export, existing proposal PDFs, invoices), **customer links keep working** (view AND respond, progress pages — the tenant's customer is never punished for the tenant's billing state), and **billing screens with pay/upgrade/reactivate stay available**. No data is ever deleted for non-payment — deletion happens only through the data-rights erasure workflow (F1-24). Blocked mutations fail with an honest state banner and a route to reactivate (mechanics M12). | `SRC` — `BILL.2` (the pre-committed rule, journey L1361–1362: "never hold a customer's data hostage — read + export always work", shared — enforcement `modules/M12`); `DOC16.softblock.always-on` (docs/16 §3, shared — same split); `DOC16.soft-block-never-hard` (cited — `modules/M12` owns the error/banner mechanics); the suite law is `OV-26`; the market-framework half is F1-24 | P0 |
| BM-33 | **The billing-state vocabulary — six names, fixed here:** `trialing` · `active` · `past_due` · `halted` · `expired` · `cancelled`. `past_due` carries a 7-day grace with two phases (days 0–3 full function with banner; days 4–7 metered features paused); `expired` (trial ended unconverted) behaves exactly as `halted`; `cancelled` runs to the paid period end, then behaves as `halted`. These names are the interface M12's lifecycle machine implements and M13's reporting segments by; transitions, timers, dunning and reactivation mechanics are `modules/M12`'s. | `SRC` — `DOC16.lifecycle-states`, `DOC16.past-due-grace`, `DOC16.trial-expired-terminal`, `DOC04.subscription-states` (all cited — `modules/M12` owns the machine; this row fixes the names as suite vocabulary) | P0 |
| BM-34 | **The cap-enforcement law (soft-block at capacity).** For every capped count and ceiling: the usage screen warns at **80%** (`F8-33` — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records, and exporting **never** pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window. | `SRC` — `DOC01.cap-soft-block` (docs/01, shared — the law lands here; per-gate enforcement points are `modules/M12`'s per `DOC16.gate.*`); pre-warning per `F8-33` | P0 |
| BM-35 | **The state capability matrix** (below) is product law: which capability groups work in which billing state. M12 implements it as the billing-state gate on every mutation and may add enforcement detail; it may never move a ✓ to a block. Metered features pause only where they cost per-use money, and only from `past_due` day 4; core selling continues through the entire grace window. | `SRC` — `DOC16.softblock.always-on`, `DOC16.softblock.core-gated`, `DOC16.softblock.metered-pause`, `DOC16.softblock.invites` (docs/16 §3, all shared — the product-law matrix lands here; enforcement mechanics re-appended by `modules/M12`) | P0 |
| BM-36 | **The matrix never blocks the field.** A photograph already captured on a field device always uploads and reads while blocked — the block is on new mutations from the UI, never on the device's pending photo uploads (`F4-21`). The formerly open capture-past-grace edge (register Q16) is **ruled (owner ruling 2026-08-04, Q16)**: field capture works through the full grace window and pauses only at `halted`, with a mid-visit halt letting the current visit complete ("never strand a surveyor on a roof"); reads, exports and pending photo uploads stay always-on. Mechanics at `M12-27`/`foundations/F4`. | `SRC` — `DOC16.offline-drain-never-blocked` (cited — `modules/M12`/`foundations/F4` own the halves); `F4-21`; capture-through-grace per owner ruling 2026-08-04 (Q16) | P0 |

**The state capability matrix** (per state; `✓*` = within plan/trial allowance; `—` = paused or
blocked with the honest banner):

| Capability | `trialing` | `active` | `past_due` d0–3 | `past_due` d4–7 | `halted` | `expired` | `cancelled` (post-period) |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Read everything, search, dashboards | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export: CSV, data export, existing proposal PDFs, invoices | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Customer links (view AND respond) + customer progress pages | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Billing screens; pay / upgrade / reactivate | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/edit leads, tasks, activities, surveys | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Studio: create/edit designs (read-only open always works) | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Generate/send proposals; mark won/lost; project updates | ✓ | ✓ | ✓ | ✓ | — | — | — |
| File/photo uploads (photos already captured on a field device always upload) | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Voice agent (outbound + AI inbound) | ✓* | ✓* | ✓* | — | — | — | — |
| AI roof detections (manual outline always available) | ✓* | ✓* | ✓* | — | — | — | — |
| Team invites (OTP spend) | ✓ | ✓ | ✓ | — | — | — | — |

Matrix notes (product-level; mechanics M12): when halted, inbound agent calls degrade to a
missed-call log + voicemail so no AI minutes burn (cited: `DOC16.halted-inbound-degrade` —
M12/M07); engineer sign-off on already-submitted designs is never gated — it is a safety
workflow (cited: `DOC16.never-gated` — M12); the blocked-mutation experience (typed error,
banner, reactivate route) is M12's (`DOC16.gate.state-guard`, cited).

**Behavior detail.** The matrix is the commercial promise behind the sales pitch "we never hold
your data hostage" — and it is load-bearing for trust in a market where the incumbent fear is
exactly that. Three of its rows are the law's teeth: exports work while halted (a tenant can
leave), customer links work while halted (the EPC's own customer never discovers the EPC's
billing state), and billing screens work while halted (reactivation is always one payment away).
Dunning and downgrade copy must be honest about all of this — no deletion threats, because
nothing is deleted (`F8-34`, cited).

**Permissions.** The matrix binds states to capability groups; *who* within the tenant may
exercise a capability stays F2's question, unchanged by billing state.

**Edge cases & what-goes-wrong.**

- *A charge fails while a rep is mid-pipeline* → nothing changes for 3 days beyond a banner;
  metered features pause at day 4; selling continues through day 7 (BM-33, BM-35).
- *A customer opens their proposal link while the EPC is halted* → the link works, fully — view
  and respond (BM-32). The customer never sees a billing message.
- *A field crew returns from a dead zone after the tenant halted* → the photographs already
  captured on their devices still upload and read (BM-36); new UI mutations show the state banner.
- *A voice queue entry outlives its allowance* → the allowance is re-checked before dial and the
  blocked entry is marked with the owner notified (cited: `DOC16.gate.voice` — M12/M07).

**Acceptance criteria.**

- Given a tenant in `halted`, `expired` or post-period `cancelled` — three of the six fixed
  billing-state names (BM-33) — when any user reads, searches, exports, opens dashboards or
  opens the billing screen — or the tenant's customer opens any link — then it works (BM-32,
  BM-35); and when M12's lifecycle machine or M13's reporting names a state, then it is one of
  BM-33's six names and no other (BM-33).
- Given a capped count at 100% for 7 days, when a user attempts a new creation of that type,
  then it pauses with the honest banner, and reading/editing-existing/exporting still work
  (BM-34).
- Given photographs already captured on a field device and a tenant in any blocked state, when
  the device reconnects, then those photographs upload and read (BM-36); and when any
  enforcement design addresses new capture past the entitlement grace window, then it cites
  register Q16 as open rather than citing this document for a reading it does not contain
  (BM-36).
- Given any billing state and the matrix above, when M12's enforcement is audited row by row,
  then no ✓ has become a block and no block has silently widened (BM-35).

**Localization notes.** State banners and blocked-mutation copy exist in every launch language
and are honest per `F8-34` (no deletion threats). **Analytics events:** state entered (per
BM-33 vocabulary); grace phase transition; blocked-mutation shown; reactivation completed.

### 04.6 — Market price-book architecture, and the India book

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| BM-37 | **Every market has its own price book; a market without one has no prices and cannot sell.** The book law is F1's (F1-25: per-tier prices per cycle in the market's currency, bundle sizes, overage rates, metered add-on prices, benchmarks — owner/market decisions, absent until made; F1-26: no FX-converted pricing, ever, in any form). This document consumes that law and owns the **contents** of the first book (BM-41). Framework rules in this document never carry a currency; book instances always do. | `BRIEF` — design spec §2 DD6, consumed as published requirements `F1-25`/`F1-26` (no source key re-disposed) | P0 |
| BM-38 | **Launching a market is adding price rows, never changing the product.** Plan prices are per-currency rows against the same four-tier structure with provider-neutral gateway references; a new market's book lands as new rows — zero product change, consistent with one currency per tenant (F1-07, F1-27). | `SRC` — `DOC04.plan-prices-per-currency` (docs/04: "v1 rows are INR-only — a new market adds rows, zero schema change"; the architecture statement lands here per F1-27's pointer) | P0 |
| BM-39 | **The benchmark law.** Every book records the market benchmarks it was set against, and prices **under the market's incumbents at equivalent capacity, always** — margin comes from COGS discipline (BM-17), never from list price. Benchmarks are book data with provenance (which competitor page, which date, which currency); a book whose benchmarks are stale is re-validated, not trusted. | `SRC` — `DOC01.price-under-incumbents` (docs/01 pricing principle 1 — stated against the IN incumbents; generalized per DD6, the IN instance is BM-41's) | P0 |
| BM-40 | **Tax posture rides the market's tax scheme.** All book prices are exclusive of the market's tax scheme (F1-13); for platform subscription sales the platform's supplier-of-record posture is a per-market declaration in `pack.tax`. **IN instance:** prices ex-GST; the platform is the supplier of record — our registration, our remittance, our liability; the gateway is a gateway, never merchant-of-record (F1-29; invoice mechanics M12). **Foreign-subscriber posture (owner ruling 2026-08-04, Q7):** India-first commercially; the first foreign subscribers are billed by the Indian entity as zero-rated **export of services** (international gateway mode, USD/AED settlement); a merchant-of-record or foreign-entity structure is revisited only at real foreign revenue — that revenue is the revisit trigger, and each non-IN market's own launch gate (`F1-05`) still applies. | `SRC` — `DOC01.supplier-of-record` (docs/01, shared — posture lands here, invoicing mechanics `modules/M12`); `DOC16.gst-supplier-of-record` (docs/16, shared — the business-model posture half; the IN tax-scheme half is `F1-29`, Task 6); export-of-services path per owner ruling 2026-08-04 (Q7) | P0 |
| BM-41 | **The India book — the source-derived first instance (IN book; every number below is IN-market data, not the generic model).** Identified by `F1-60`/`F1-61`; canonical here. **Tier prices (INR, ex-GST):** Starter **₹1,999/mo · ₹19,990/yr** — Growth **₹3,999/mo · ₹39,990/yr** — Pro **₹9,999/mo · ₹99,999/yr** — Enterprise **custom, anchored ₹24,999+/mo**, annual contract (owner-set anchors ~₹2k/~₹4k/~₹10k). **Capacity + counts:** single-design ceiling 50 kW / 500 kW / 5 MW / 100 MW (utility: blocks/zones, trackers, terrain); proposals 30 / 300 / 1,500 / unlimited per month; active projects 10 / unlimited / unlimited / unlimited; users unlimited on all four. **Bundles + overage:** AI detections 30 / 100 / 400 / custom per month, then ₹10 each; voice minutes PAYG ₹6/min on Starter and Growth, 400 min/mo bundled then ₹6/min on Pro, custom bundles + BYO number on Enterprise; storage 10 / 50 / 250 GB / custom. **Trial caps:** 25 detections · 15 voice minutes · 5 GB. **Service terms:** support in-app / in-app + WhatsApp / priority + onboarding call / named contact; Enterprise adds the BM-15 commercial arrangements. **Benchmarks (recorded per BM-39):** Reslink India INR page (owner-supplied, authoritative — Basic ₹60,000/yr at 50 kW · Pro ₹85,000/yr at 500 kW, 1,000 proposals · Premium ₹1,20,000/yr at 5 MW · Enterprise custom) and ARKA per-org pricing; priced under both at every rung — Starter-yearly 67% under Basic, Growth-yearly 53% under Pro, Pro-yearly 17% under Premium with a voice bundle no competitor has, and Pro's 1,500 proposals/mo beat the benchmark's 1,000. **Collection routes:** per the IN mandate ladder, F1-40 (monthly self-serve under the per-debit cap rides UPI AutoPay; Enterprise e-NACH/invoice; every yearly total exceeds the cap and is a single payment link/invoice per year). **V2 add-on prices (owner ruling 2026-08-04, Q1/Q17 — base tiers confirmed unchanged; every add-on number below is DRAFT pending rate-card verification per BM-17/BM-26):** tracked seat **≈₹99/seat/mo** beyond the tier's included allowance; **included tracked seats: Starter 0 · Growth 3 · Pro 10 · Enterprise custom**; marketing-send bundles **Starter 500 · Growth 2,000 · Pro 10,000 sends/mo**, overage **≈ WhatsApp ₹1.5 · SMS ₹0.35 · email ₹0.10 per send**. A draft add-on rate is not sellable until the owner verifies the channel/seat rate cards against worst-case unit COGS (the ≥40% floor, BM-17) — verification is the Q1 revisit trigger. | `SRC` — `DOC01.tier-table`, `DOC01.billing-cadence` (anchors), `DOC01.reslink-calibration` (benchmark + axis), `DOC01.trial` (caps) (docs/01); routes per `F1-40`; add-on draft values + included-seat ladder per owner ruling 2026-08-04 (Q1/Q17), recorded at `F1-61` | P0 |

**Behavior detail.** The architecture/instance discipline here is what makes "global from the
outset" true commercially: BM-37–BM-40 never change when a market launches; BM-41 gains a
sibling section per market, each authored by its owner (F1-25), never derived by formula or
exchange rate (F1-26). The India book's numbers are carried from source as approved v1 pricing —
and the owner's 2026-08-04 ruling (Q1) **re-validated them for V2's bigger box: base tiers stand
unchanged**, and the two V2 add-on slots now carry the owner's draft values (seat price, seat
ladder, send bundles, send overages) flagged draft-pending-rate-card-verification. The base book
is the book of record; the add-on drafts become sellable only when their rate cards verify
(BM-17/BM-26 — the Q1 revisit trigger).

**Permissions.** Book authoring and revision are platform operations (F1's change-control
rules); no tenant surface exists. Repricing an existing book interacts with §04.7.

**Edge cases & what-goes-wrong.**

- *A second market wants "the India prices in dollars"* → refused by construction (F1-26); the
  market's owner authors its own book against its own benchmarks (BM-37, BM-39).
- *A benchmark competitor reprices* → the book's benchmark rows carry provenance and dates;
  re-validation is a book revision (F1-25 versioning), never a hurried product change.
- *A book add-on value is still draft (the V2 add-ons)* → the meter exists (BM-21/BM-22) and the
  IN book carries the owner's draft numbers (owner ruling 2026-08-04, Q1/Q17), but the meter
  cannot be sold until the rate card verifies against worst-case unit COGS (BM-17/BM-26); a
  draft number is never silently treated as launch-final.
- *GST rate or scheme mechanics change* → pack-data update (F1-28–F1-30); prices here stay
  ex-tax and unchanged unless the owner also reprices.

**Acceptance criteria.**

- Given the IN book, when any tier price, cap, bundle, overage rate or trial cap renders
  anywhere in the product or the suite, then the number comes from BM-41 (via M12's
  entitlements) and nowhere else (BM-09, `F1-60`).
- Given any framework row in this document, when it is read for a second market, then it
  contains no INR amount, no IN benchmark and no IN rail — those exist only in BM-41 and F1
  §F1.3 (BM-10, BM-37).
- Given the two V2 add-on slots, when the IN book is read today, then each slot carries the
  owner's draft value (seat ≈₹99/mo with the 0/3/10/custom included ladder; send bundles
  500/2,000/10,000 with ≈₹1.5/₹0.35/₹0.10 overages) flagged draft-pending-rate-card-verification
  (BM-41, `F1-61`; owner ruling 2026-08-04, Q1/Q17).
- Given a second market's authored and owner-approved book, when that market launches, then the
  book lands as per-currency price rows against the same four-tier structure with
  provider-neutral gateway references and zero product change (BM-38).
- Given any book price and its market's tax scheme, when a subscription invoice is produced,
  then the price is ex-tax with the scheme applied per the pack's declaration and the
  supplier-of-record posture recorded there (BM-40; IN instance: ex-GST, the platform as
  supplier of record per F1-29).

**Localization notes.** Book amounts render with the book's own currency and grouping (IN:
₹ with lakh/crore grouping, F1-46 via F3); tier names stay product vocabulary (§04.2).
**Analytics events:** none of its own — book reads are not a user action stream.

### 04.7 — Grandfathering

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| BM-42 | **Grandfather generously.** Repricing is a trust event — in a WhatsApp-connected market, a badly handled price change travels faster than any marketing — so existing tenants are protected by law, not by goodwill: a tenant keeps the pricing they signed up on for a **guaranteed protection horizon recorded in their market's book**; **IN book: early tenants keep launch pricing for 24 months minimum**. Repricing never applies mid-cycle, never applies retroactively, and reaches a protected tenant only after their horizon lapses — with the honest-copy discipline (`F8-34`) applying to every repricing communication. Caps and bundle *growth* (giving tenants more) may apply immediately; taking anything away rides the same horizon. **Forfeiture on lapse (owner ruling 2026-08-04, Q43):** the protection horizon is forfeited by a lapse — a tenant who goes `cancelled` or `halted` ends their launch-price guarantee, and reactivation (whether inside or after the original horizon) prices at the **current list book**. Cancellation, dunning and win-back copy must state this plainly before the lapse happens (the no-surprise rule, `F8-34`); mechanics at `M12-57`. *(Owner ruled against the standing recommendation — deliberate.)* | `SRC` — `DOC01.grandfather` (docs/01 pricing principle 7: "Early tenants keep launch pricing for 24 months minimum; repricing is a trust event"); forfeiture-on-lapse per owner ruling 2026-08-04 (Q43) | P0 |

**Behavior detail.** Grandfathering is stated as book data plus product law so it globalizes
cleanly: every market's book records its horizon (the IN book's is source-derived), and the law
that a horizon exists — and that repricing is never silent, never mid-cycle, never retroactive —
is market-neutral. Mechanics (which plan-price row an old tenant bills against, how a lapsed
horizon migrates) are `modules/M12`'s.

**Permissions.** Repricing decisions are owner/platform-level; no tenant surface.

**Edge cases & what-goes-wrong.**

- *A protected tenant upgrades tiers* → they move to the new tier under their protection terms;
  an upgrade is never used as a lever to strip grandfathered pricing (the trust event law).
- *A tenant churns (`cancelled`/`halted`) and reactivates — inside or after the horizon* →
  reactivation prices at the current book; protection forfeits on lapse and never survives a
  lapsed subscription (owner ruling 2026-08-04, Q43; mechanics M12, `M12-57`).

**Acceptance criteria.**

- Given a tenant inside their protection horizon, when the market book is repriced, then their
  bill is unchanged until the horizon lapses, and they were told honestly what changes and when
  (BM-42).
- Given a protected tenant who cancels or is halted, when they reactivate — even inside the
  original horizon — then they bill against the current list book, and the cancellation/dunning
  copy they saw before the lapse stated the forfeiture plainly (BM-42, owner ruling 2026-08-04
  Q43; `M12-57`).

**Localization notes.** Repricing communications in every launch language. **Analytics events:**
none of its own (repricing is a platform event, audited).

### 04.8 — Go-to-market principles, carried at product level

The source's GTM section is IN-market strategy. It is carried here because five of its
principles bind *product* behavior and sizing decisions; the market context (the national
rooftop-subsidy program at enormous scale, most Indian EPCs running on spreadsheets and chat, an
under-digitised funnel) is the IN market's context — recorded with the caveat that its cited
research file is source gap #1 (`registers/conflicts.md`).

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| BM-43 | **Ride the market's incentive wave — by computing, not configuring.** The IN wedge is that subsidy outcomes are computed in the product (state × capacity × DCR, F1-33) while competitors make tenants configure them by hand; the product consequence is that the demo leads with a computed subsidy in the first five minutes of a first session. Generalized: a market's incentive model is pack data computed by the product (F1-14), and the pricing story leans on it wherever the market has one. | `SRC` — `DOC01.gtm` item 1 (docs/01); market context per `DOC00.market-moment` (disposed by Task 3 → this document; the missing research citation is recorded in `registers/conflicts.md`) | P1 |
| BM-44 | **The competitor is the spreadsheet, not another SaaS.** Positioning and pricing assume the buyer currently pays nothing: what displaces the spreadsheet is the 30-second lead add, the sub-ten-minute remote survey-to-proposal path, and the one record that survives sales → design → costing without rekeying. The tiers are priced so that "keep using spreadsheets" is never the rational choice on price (BM-08). | `SRC` — `DOC01.gtm` item 2 (docs/01) | P1 |
| BM-45 | **Market-native compliance is a wedge, never a paid feature.** The IN depth — certification checking at design time, tax-native money path, DISCOM-aware states, registered messaging, compliant calling — is in every tier (BM-05) and is sold as the reason global tools cannot follow quickly. Generalized: pack-driven statutory depth (F1) is a GTM asset in every market and is never tiered. | `SRC` — `DOC01.gtm` item 3 (docs/01) | P1 |
| BM-46 | **The voice agent is the demo that closes — priced to feel included, metered so it cannot hurt margin.** The pitch leads with a live agent call; commercially the agent rides BM-17/BM-18 (bundles on the tier where it anchors the positioning, PAYG elsewhere in the IN book) so it demos as part of the product while every minute stays margin-safe. | `SRC` — `DOC01.gtm` item 4 (docs/01) | P1 |
| BM-47 | **Trial-to-paid is the only conversion metric that matters at launch.** The channel motion (founder-led sales into EPC clusters, installer associations, distributor referrals, the demo project that makes first sessions concrete) is sales ops, not product scope — what binds the product is the metric: acquisition instrumentation and M13's reporting treat trial-to-paid conversion as the launch measure, and the trial (§04.4) is designed to maximise it honestly (full capability, honest caps, soft expiry). | `SRC` — `DOC01.gtm` item 5 (docs/01) | P1 |

**Behavior detail.** GTM lives here at product level only: nothing in BM-43–BM-47 creates a
screen, a campaign or a quota. What it creates is sizing and framing obligations elsewhere —
the demo asset at onboarding (M01, cited from source), the subsidy computation the demo leans on
(F1-33/M06), the voice bundle shape in the IN book (BM-41), and the conversion event M13 reports.

**Permissions / Edge cases.** None of its own — the referenced surfaces carry their own.

**Acceptance criteria.**

- Given the IN pricing page and any competitor row it cites, when the equivalent-capacity
  comparison is checked, then the price is lower and the claim traceable to BM-41's recorded
  benchmarks (BM-39, BM-44).

**Localization notes.** GTM claims that reach product copy (pricing page comparisons) follow F8
honesty — benchmark provenance shown. **Analytics events:** trial-to-paid conversion (the
BM-47 metric; event taxonomy is M13's).

## 4. Cross-document contracts

**What this document provides** (consumers reference, never restate — BM-09):

| Consumer | What it takes from here |
|---|---|
| `modules/M12-platform-billing.md` | The tier names (BM-11) and every price/cap/bundle number (BM-41) its entitlements enforce; the meter list (BM-16) its usage ledger meters; the billing-state names (BM-33) its lifecycle machine implements; the soft-block law + matrix (BM-32–BM-36) as its non-negotiable floor; cap law incl. 80% pre-warning (BM-34); trial law (BM-28–BM-31); grandfathering law (BM-42); supplier-of-record posture (BM-40) |
| `modules/M13-dashboards-and-reporting.md` | Tier names and billing-state names as reporting vocabulary (BM-11, BM-33); the meter list for usage reporting (BM-16); the trial-to-paid conversion metric (BM-47) |
| `modules/M03-marketing.md` | The marketing-sends meter definition and channel boundary (BM-21); the absorbed/metered split it must respect |
| `modules/M09-field-workforce.md` | The tracked-seat add-on boundary — included capabilities (BM-23) vs the tracked-seat bundle scope, the owner toggle, and the billing unit (BM-22) |
| `modules/M07-sales-execution.md`, `modules/M04-survey.md` | Voice-minute and detection meter definitions (BM-18, BM-19); the manual-path guarantee (BM-19) |
| `modules/M11-payments-and-collections.md` | The two-money-systems separation (BM-02) — the platform side ends here |
| `modules/M01-onboarding-and-tenant-config.md` | Trial-start law (BM-28: no payment instrument at signup); the demo-led first session BM-43 leans on |
| `foundations/F1-global-market-framework.md` | The IN book contents its `F1-60`/`F1-61` identification points at (BM-41 — the reciprocal of F1's hook); the benchmark and grandfather values as book data |
| `foundations/F5-customer-link.md` | The always-on customer-link row of the matrix (BM-32/BM-35) |
| `01-product-overview.md` | The commercial law behind `OV-20`, `OV-26`–`OV-30` (this document is where those principles' numbers and matrices live) |

**What this document expects from others:** F1 — the price-book law (F1-25–F1-27), tax posture
(F1-13, F1-28–F1-30) and IN rails (F1-40/F1-41) it references instead of restating; F8 — the
usage-honesty law (`F8-33`) and honest billing copy (`F8-34`); F2 — Owner-only billing
administration; F4 — the field-photo carve-out (`F4-21`) that BM-36 keeps always-on; M12 — mechanics that implement every law here without weakening one.

## 5. Non-goals

- **No billing mechanics in this document.** Lifecycle transitions and timers, dunning ladder
  and channels, entitlement enforcement points, the usage ledger, invoicing and statutory
  e-invoicing, refunds/proration/cancellation/reactivation, goodwill credits — all `modules/M12`
  (their source keys are cited there, not disposed here). Rationale: one definition per fact,
  in both directions (BM-09).
- **No free tier.** The v1 analysis is carried: the incumbent's free product is funded by
  distributor placement and a payments cut — a transaction-layer business this product
  deliberately does not enter; a free tier without that engine is COGS with no revenue.
  (`SRC` — `DOC01.no-free-tier`, user decision, final.)
- **No transaction-layer revenue.** No distributor placement, no cut of the tenant's customer
  payments, no marketplace take — the platform's only revenue is the subscription and its
  metered overages (BM-02's separation is also a revenue-model boundary; the rejected
  master-merchant alternative is recorded at `modules/M11` via `DOC16.route-rejected`).
- **No second seat-counting meter.** BM-22 is the only place the product counts people, ever
  (`OV-30`'s "suite credibility" clause). Any proposal for another one is a defect against
  BM-04, not a pricing option.
- **No FX-converted pricing and no invented market numbers** — restated from F1 as the pricing
  system's own non-goal (F1-25/F1-26; design spec §14): a market's numbers exist when its owner
  authors them, and not before.
- **No feature-gated tier, no feature flags.** There is no tier that hides a capability (BM-05)
  and no runtime gate other than billing entitlements (`OV-27`; `DOC16.no-feature-flags` is
  dispositioned at `00-README`/M12).
- **No calendar commitments.** This document prices and packages the product; it attaches no
  dates, phases or sequencing to anything (DD4).

## 6. Open questions

Mirrored into `registers/open-questions.md`.

- **BM-Q1 (register Q1) — RESOLVED (owner ruling 2026-08-04, Q1).** Base tiers re-validated
  and confirmed unchanged (₹1,999/₹3,999/₹9,999/Enterprise); the two V2 add-on slots now carry
  the owner's **draft** values at BM-41 (tracked seat ≈₹99/seat/mo; send bundles 500/2,000/10,000
  per month with ≈₹1.5/₹0.35/₹0.10 overages) — all draft-pending-rate-card-verification per
  BM-17/BM-26. Revisit trigger: rate-card verification against worst-case unit COGS; until then
  the add-on meters are not sellable.
- **BM-Q2 (register Q17) — RESOLVED (owner ruling 2026-08-04, Q17).** Higher tiers bundle
  included tracked seats: **Starter 0 · Growth 3 · Pro 10 · Enterprise custom**, with the draft
  ≈₹99/seat/mo applying beyond the allowance (BM-22, BM-41, `M09-16`; draft pending the same
  rate-card check as Q1).
- **Carried, now closed:** register **Q16** — ruled 2026-08-04: capture works through the full
  grace window, pauses only at `halted`, with the finish-the-visit rule; BM-36 records the
  ruling, mechanics at `M12-27`.

---

*Traceability for this document is appended under "## Task 11" in
the retired traceability register. Open questions above are mirrored in
`registers/open-questions.md` (Q1 extended; Q17 added; Q16 cited).*
