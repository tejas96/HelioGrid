# F1 · Global market framework

Status: draft · Origin mix: SRC/BRIEF (this document carries no `REC` items) · Depends on:
`00-README.md`, `01-product-overview.md`, `02-personas.md` · Forward: `04-business-model.md`
(owns the tier architecture and the India book's numbers), `foundations/F8-data-honesty.md`
(pack-version staleness), `foundations/F3-localization.md` (renders what packs declare)

## 1. Purpose & scope

This document is the market truth of the suite. It fixes, once and finally:

1. **What a market pack is** — the versioned unit of market configuration that makes
   HelioGrid global-ready: every market-specific fact in the product is pack data, never a
   module-level constant (§F1.1).
2. **The pack surface** — the eight pack keys every market must author (`pack.tax`,
   `pack.subsidy`, `pack.calling-rules`, `pack.payment-rails`, `pack.certification-schemes`,
   `pack.formats`, `pack.data-rights`, `pack.price-book`), each defined with the requirement
   rows stating what every pack MUST supply (§F1.2). These keys are the suite-wide interface:
   every module and foundation PRD references them instead of naming any market's specifics.
3. **The market lifecycle law** — launching a market is authoring its pack: configuration,
   not a product change (design spec §2 DD6), behind an explicit new-market gate.
4. **The complete India pack** — the source-derived first and reference instance,
   instantiating all eight keys (§F1.3). §F1.3 is the **only place in this document — and,
   together with `04-business-model.md`'s India price book, one of the only two places in the
   whole suite** — where India's statutory and market specifics are named.

**What this document is not.**

- It is **not** `04-business-model.md`. The tier architecture (capacity + usage + metered
  bundles, never features), the packaging convictions, and the India book's actual price
  points, caps and bundle sizes live there. This document defines what a price book *is* and
  what every market's book must contain; §F1.3's price-book instance identifies the India book
  and points at `04` as its canonical home — one definition per fact.
- It does **not** specify the compliance-gate mechanism. The gate — the product code that
  enforces a market's communications ruleset before every dial — is non-swappable product
  behavior specified in `modules/M07-sales-execution.md`. This document supplies the *ruleset
  data* the gate consumes (per market, via `pack.calling-rules`).
- It does **not** implement localization. Rendering capabilities — one money-formatting
  function, script shaping, translation architecture, per-user language — are
  `foundations/F3-localization.md`'s. This document supplies the *format data* those
  capabilities render (per market, via `pack.formats`).
- It does **not** carry billing mechanics (subscription lifecycle, entitlements, dunning —
  `modules/M12-platform-billing.md`), catalog operations (`modules/M01`), or the project state
  machine (`modules/M08`). It supplies the market data those modules consume.
- It authors **no second market**. The named expansion regions are candidates, not v1 scope;
  no pack beyond India exists in this suite (§5).

## 2. Personas & surfaces

No persona edits pack data. Packs are platform-authored configuration (see §4 — authoring is
internal platform operations, audited); no tenant-facing screen creates or edits a pack, and
no preset role in `foundations/F2-roles-and-permissions.md` carries a pack-editing grant —
this document adds no rows to F2's matrices.

Every persona *experiences* pack data on every surface, mobile and web equally:

- **EPC Owner** — meets the pack as the floor under tenant configuration: calling-window and
  agent settings configure within the pack's statutory ruleset, never around it (M01/M07
  surfaces); tax identity and billing rails at conversion (M12).
- **Finance** — every money surface renders the pack's currency formats and tax scheme;
  platform invoices carry the pack's statutory tax content (M11/M12).
- **Sales Manager, Sales Executive, Project Manager, Operations** — stage labels, blocker
  labels, document checklists and payment-mode vocabularies on boards, projects and timelines
  are pack labels (M02/M08/M13).
- **Design Engineer, Survey Engineer** — certification-scheme badges in component pickers,
  subsidy computation in money outputs, standards labels on drawings (M04/M05/M06).
- **Marketing** — messaging compliance (template registration, sender rules) comes from the
  pack's communications ruleset (M03).
- **The EPC's customer** (audience, never a role) — the customer link renders pack labels and
  formats in the wait-attribution and progress surfaces (F5).

## 3. Feature areas

### F1.1 — The market pack: definition, invariants, lifecycle

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-01 | **A market pack is the versioned unit of market configuration.** The source defines it whole: "Market pack = rules + catalog + templates + locale data, versioned as one unit" — covering (product-facing) the tax model, subsidy/incentive model, compliance ruleset and calendar, certification schemes, payment-mode and mandate vocabularies, project-stage labels and skippable stages, document checklists, catalog scope and price-book currency, document templates and standards labels, and locale data (currency display, holiday calendar, default units); and (engineering-facing) rules data consumed by the design engines — electrical ladders, design-temperature bands, setbacks, wind zones, net-metering conventions. The governing law is carried verbatim: **"No market fact is ever a module-level constant."** | `SRC` — `DOC02.market-pack-unit` (docs/02, `_process/extraction/docs-rules.md`) | P0 |
| F1-02 | **The eight pack keys are the suite-wide interface.** Every market pack supplies all eight: `pack.tax` · `pack.subsidy` · `pack.calling-rules` · `pack.payment-rails` · `pack.certification-schemes` · `pack.formats` · `pack.data-rights` · `pack.price-book` (§F1.2 defines each). Module and foundation PRDs reference these keys — never a market's own terms; a module that needs a market fact states *which key supplies it*, and the fact itself lives in that market's pack section here. **Demo/seed content (owner ruling 2026-08-04, Q19):** beside the eight rules keys, every market pack ships **one demo project as pack content** (IN: the Pune-class rooftop, `M01-27`), versioned with the pack per F1-11 — pack content, not a ninth rules key. | `BRIEF` — `_process/2026-08-03-v2-prd-design.md` §6 (globalization method) + §2 DD6 · grounded in source at `DOC02.market-pack-unit`; demo-content placement per owner ruling 2026-08-04 (Q19) | P0 |
| F1-03 | **What never varies per market, and what swaps.** Invariant across all markets: the geometry/electrical kernels ("ladders are data, math is not"), the provenance/honesty system (F8), the one money path, the tenancy model, the design system (F7), and the canonical state machines with their market-neutral value names. Swapped per market as pack data and adapters: rules data, catalog scope and price book, tax and subsidy models, locale data, telephony adapter, payment adapter — and every display label. | `SRC` — `DOC02.market-invariants` (docs/02); market-neutral state-machine names per `R2` as amended 2026-08-02 and `UD-9` (docs/15) | P0 |
| F1-04 | **Launching a market = authoring its pack.** A new market is configuration, not a product change: its pack (all eight keys) plus market adapters behind the existing vendor-neutral capability ports. No module changes, no new module behavior, no market-conditional code paths in product requirements. | `BRIEF` — `_process/2026-08-03-v2-prd-design.md` §2 DD6 ("Launching a market = authoring its book — configuration, not product change") · grounded at `DOC02.market-invariants` ("swapping a vendor is an adapter change") | P0 |
| F1-05 | **The new-market gate.** Before any tenant exists in a new market, that jurisdiction's own privacy/residency determination must exist (it becomes the market's `pack.data-rights`); before subscriptions are sold there, a supplier-of-record decision must be made — **ruled for the interim (owner ruling 2026-08-04, Q7)**: the first foreign subscribers are billed by the Indian entity as zero-rated export of services (§4 note; `BM-40`), with merchant-of-record/foreign-entity revisited at real foreign revenue. A pack without both determinations is not launchable. | `SRC` — `DOCFC.new-market-gate` (docs/forward-compat, `_process/extraction/docs-rules.md`); export-of-services posture per owner ruling 2026-08-04 (Q7) | P0 |
| F1-06 | **Global-ready, India-only launch.** The launch state is exactly one authored pack — India (§F1.3) — on global-ready structure: global-safe schemas and vocabularies, India-only rails. The named expansion candidates (Gulf/MENA, SEA/Africa, EU/UK/AU, US) are future markets, not v1 scope; each enters only through F1-05's gate and F1-04's lifecycle. | `SRC` — `UD-9` (docs/15 user-decisions log, global-backend ruling 2026-08-02, `_process/extraction/rulings.md`) | P0 |
| F1-07 | **Money is market-generic on every surface.** Amounts are generic values, never named for any one currency's units; every money-bearing document root stamps its currency at creation; line items inherit it; sums reconcile to the currency's minor unit. **One currency per tenant**, server-assigned from the tenant's market at tenant creation — no mixed-currency tenant exists. Every tenant-set money threshold (e.g. the customer-link accept-challenge threshold, F5) is denominated in the tenant's currency. | `SRC` — `DOCFC.money-generic` (binding on every module per the global-backend ruling 2026-08-02); `DOC04.currency-stamp` (docs/04); threshold denomination per `R6` (docs/15) | P0 |
| F1-08 | **Tax is scheme-generic.** The product carries tax as scheme-neutral structure — percentage fields, a taxes breakdown, tenant tax registrations — never as columns or copy named for one market's tax law. The pack's `pack.tax` declares the scheme and its strategy (`per_line_rate` or `document_level`); statutory extras attach as scheme-tagged data, present only where the scheme requires them. | `SRC` — `DOCFC.tax-generic` (docs/forward-compat); strategy vocabulary per `DOC04.proposal-tax-model` (docs/04 — proposal mechanics stay with M06) | P0 |
| F1-09 | **Market vocabularies are open sets; state machines keep neutral names; labels come from the pack.** Document checklists, payment modes, mandate types and comparable market vocabularies are open sets validated against the tenant market's pack — never closed enumerations baked into the product. Canonical state machines (the 9-stage project chain, blocker parties, subscription states) keep market-neutral value names everywhere; what a user reads on screen is the pack's label for that value. | `SRC` — `DOCFC.market-vocab` (docs/forward-compat); `R2` as amended 2026-08-02 ("Stage LABELS are market-pack data"; blocker party `utility`) | P0 |
| F1-10 | **User-facing schedules are tenant-timezone-aware, never fixed to any market's clock.** Every user-facing repeatable behavior (wake-ups, follow-up queues, calling windows) runs on the tenant's timezone; platform-internal sweeps may stay fixed-clock. The pack supplies the market's *default* timezone (F1-21); the tenant's timezone is tenant data. | `SRC` — `DOCFC.tz-scheduling`; `DOC02.tz-schedules` (docs/02: "User-facing schedules are tenant-timezone-aware by law") | P0 |
| F1-11 | **Pack data is versioned; revisions are data updates; computed outputs pin the version they used.** A pack revision (a subsidy-model change, a ruleset change, a label change) is a versioned, dated data update — never a product release. Money- and engineering-bearing outputs pin the pack/rules version they computed with, so a pack revision self-stales older outputs under F8's staleness law rather than silently rewriting them; sent proposals keep their versions forever. | `SRC` — `DOC02.market-pack-unit` ("versioned as one unit"); staleness mechanics per `DOC04.design-freshness-pins` → F8 and rate pinning per `R13` (cited; F8/M01 own their halves) | P0 |
| F1-12 | **Packs are platform-authored and never tenant-editable; tenants configure above the floor, within it.** No tenant surface edits pack data. Where a pack item is a statutory floor (calling rules, tax duties, data rights), tenant configuration operates strictly within it — "Tenants configure within the law, not around it"; there is no override flag. Where a pack item is a default (labels' rendering language, thresholds, templates), tenant configuration may adjust within the pack's stated bounds. | `SRC` — `D36` as amended 2026-08-02 (`_process/extraction/d-census.md`); no-override posture per docs/07 §ComplianceGate (cited — mechanism is M07's) | P0 |

**Behavior detail.** The framework composes in a fixed order a reader can verify by hand: a
module states a capability in market-neutral terms and names the pack key that parameterizes
it (F1-02); the tenant's market — fixed at tenant creation with its currency (F1-07) —
selects the pack; the pack supplies the values, labels, rulesets and rails (F1-01); versions
pin (F1-11); floors bind (F1-12). Nothing else participates: no module-level market constant
(F1-01), no market-conditional behavior (F1-04), no second currency (F1-07).

**Permissions.** None granted here. Pack authoring is platform-side operations, outside the
tenant role system entirely; platform-admin actions on tenant-visible data are read-only and
audited per F2 (`F2-24`). Tenant configuration surfaces that sit above pack floors belong to
M01 and carry F2's matrix rows.

**Edge cases & what-goes-wrong.**

- *A market fact appears hard-coded in a module PRD* → a suite defect, caught by the §4
  standing verification rule; the fix is always "move the fact to the owning pack key,
  reference the key".
- *A tenant's market or currency needs to change after creation* → no such path exists in
  this release; currency is server-assigned once at tenant creation (F1-07). Recorded as a
  non-goal (§5), not designed around.
- *A pack revision lands mid-flight* → running work keeps the version it started or was
  queued with; new work takes the new version; already-computed outputs go provisional/stale
  per F8, never silently recompute (F1-11).
- *A market lacks a key's content* → only keys whose framework rows say so may be empty
  (`pack.subsidy` may be "none", F1-14; an absent voice ruleset disables outbound voice,
  F1-16; an empty scheme list means no scheme gates, F1-19). `pack.tax`, `pack.formats`,
  `pack.data-rights` and `pack.price-book` can never be empty — a pack missing any of them is
  not launchable (F1-05).

**Acceptance criteria.**

- Given any module or foundation PRD in this suite, when its body needs a market fact, then
  the body names a pack key and this document's pack section carries the fact (F1-01, F1-02).
- Given a new market launch, when it is prepared, then the work is authoring the eight keys
  plus adapters, and the privacy determination and supplier-of-record decision exist before
  tenants and sales respectively (F1-04, F1-05).
- Given any tenant, when it is created, then exactly one currency is assigned from its
  market, every money-bearing document stamps it, and sums reconcile to its minor unit
  (F1-07).
- Given any state-machine value, when it renders to a user, then the value name is
  market-neutral and the rendered label is the pack's (F1-03, F1-09).
- Given a pack data revision, when it is published, then it is a versioned data update, prior
  computed outputs self-stale rather than change, and no product release occurs (F1-11).
- Given a statutory-floor pack item, when any tenant configuration touches its domain, then
  the configuration can narrow within the floor but no setting, role or flag can cross it
  (F1-12).
- Given the launch state, when markets are enumerated, then India is the only authored pack
  and expansion regions appear nowhere as v1 scope (F1-06).
- Given any tax-bearing structure or surface, when tax is stored or rendered, then it is
  scheme-neutral — strategy and statutory extras come from the pack, and no field or copy is
  named for one market's tax law (F1-08).
- Given a tenant in any timezone, when a user-facing scheduled behavior fires (wake-ups,
  queues, windows), then it fires on the tenant's clock, never a fixed market clock (F1-10).

**Localization notes.** Pack *labels* (stage labels, checklist row names, payment-mode
display names) are pack data supplied per market and translated into the tenant's UI
languages under F3's architecture; pack *value names* (machine vocabulary) are never
translated and never shown raw to users. **Analytics events:** none of its own — pack data is
not a user action stream; consuming modules' events carry pack-version context where their
own sections say so.

### F1.2 — The pack surface: eight keys every market must author

Each key below is defined by the requirement rows stating what **every** market's pack MUST
supply. This section is market-neutral by law: no market's own terms appear here — the India
values live in §F1.3.

#### pack.tax

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-13 | Every pack declares its **tax scheme**: scheme identifier; tax strategy (`per_line_rate` or `document_level`, per F1-08); the rate model and how rates attach to catalog/proposal lines and to platform invoices; which tenant tax-registration types exist and when they are captured; jurisdiction/place-of-supply rules where the scheme splits tax by place; the scheme-tagged statutory extras that attach to invoices (and the thresholds that activate them); the platform's supplier-of-record posture for subscription sales in that market; and the statutory retention period for financial/tax records (consumed by `pack.data-rights`' erasure carve-out, F1-24). | `SRC` — `DOCFC.tax-generic`; scheme-neutral invoice content per docs/16's platform-invoice row (shared — invoice mechanics stay with M12; the IN instance is F1-28/F1-29); retention per `DOC08.erasure-anonymise` ("the market pack's statutory period") | P0 |

#### pack.subsidy

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-14 | Every pack declares its **subsidy/incentive model — possibly "none"**: the eligibility dimensions (segment, capacity, component-certification requirements, geography), the computation model shipped as versioned injected configuration — computed by the product, never manually configured per tenant, so a slab/rate revision is a pack-data update (F1-11) — which certification schemes (F1-19) the subsidy path requires, and whether the canonical incentive-claim project stage applies in this market and when it is skippable. A "none" declaration makes the incentive stage skippable market-wide and removes subsidy rows from checklists and computations. | `SRC` — subsidy-as-versioned-market-config per docs/12 verdict `CG-2` (cited — verdict rows stay with their owning tasks); incentive-stage-as-pack-data per `R2` as amended (shared); `DOC02.market-pack-unit` ("subsidy/incentive model") | P0 |

#### pack.calling-rules

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-15 | Every pack declares its **communications-compliance ruleset — voice AND messaging**: the statutory calling window and the calendar it honors; the do-not-disturb / consent regime and its data-freshness duty; opt-out semantics and honoring deadline; automated-call disclosure duty; recording and retention rules; caller-line/series routing rules (transactional vs promotional vs inbound); messaging sender/template registration duties; and the **statutory messaging window** together with the **scheduled-send hour** of each automatic transactional message the product sends on a schedule. The ruleset is **data** consumed by the product's non-swappable compliance-gate mechanism (M07) and by marketing/messaging surfaces (M03, M12 dunning): the mechanism is product code and never varies per market; the ruleset always does. **Scheduled-send classification (owner ruling 2026-08-06, Q50), stated in F1-17's floor/default vocabulary:** the send hour is a **default** — the pack sets the market's hour, early evening for the pre-installation crew message of `foundations/F5`'s `F5-68`, and a tenant may narrow it; **the clock that hour is read on is the tenant's timezone (F1-10), never the customer's (owner ruling 2026-08-06, Q54)** — the reasoning is recorded so it reads as a chosen simplification rather than an oversight: a solar EPC's customers are local to it, so the tenant's clock and the customer's are the same in practice, and the accepted consequence is that where an EPC does serve a customer in a different timezone the message goes at the **EPC's** evening hour; the messaging window the hour sits inside is a **floor** — where the configured slot falls outside lawful hours the message goes at the **last lawful moment before it, never after**, a tenant may narrow the window and never widen it, and no tenant setting and no platform support action configures around it (F1-12, F1-17). **That window is evaluated on the same tenant timezone the hour is read on (F1-10) — one clock for the hour and for the window it sits inside, never two (owner ruling 2026-08-06, Q58)**; the reasoning is the one given for Q54, recorded again here so this too reads as a chosen simplification rather than an oversight — a solar EPC's customers are local to it, so a second clock would add machinery with no real-world difference — and the accepted consequence, stated plainly, is that where an EPC ever serves a customer in another timezone **both** the hour and the lawful-window check are evaluated on the **EPC's** clock rather than the recipient's, and where a tenant's own timezone differs from its market's default timezone (F1-21) the market's statutory window is evaluated on that tenant's clock rather than the market's. *(Amended to owner ruling 2026-08-06, Q50; this row's enumeration previously ended at "messaging sender/template registration duties" and declared no messaging window and no scheduled-send hour at all, and the row carried no floor/default classification of its own. The hour the evening-before crew message goes out was recorded as open at `foundations/F5-customer-link.md` §6 — register `Q50`, raised there by the `Q46` closure — and the ruling makes it pack data sitting inside a floor. Nothing else in the row changes. The classification is carried inside this row rather than as a new `pack.calling-rules` row because the send hour is one more item of the single communications ruleset this row enumerates; a second declaration row would split the key against the one-key partition §F1.2's behaviour detail states.)* *(Further amended to owner ruling 2026-08-06, Q54 — the clock, and only the clock. The default clause above previously read "early evening in the customer's market timezone", the `Q50` wording, which pointed at a different clock from F1-10's tenant-timezone law wherever a tenant's timezone and its customer's differ; the divergence was recorded as open at §6 `F1-Q3`(b) — register `Q54` — and the ruling settles it on the **tenant's** timezone, with the reasoning and its accepted consequence stated in the clause itself. Nothing else in the row changes: the hour is still pack data, the messaging window is still a floor, a slot outside lawful hours still resolves to the last lawful moment before it and never after, and tenants may still narrow and never widen. §6's `F1-Q3`(a) — register `Q53`, that the IN pack declares neither a statutory messaging window nor a send hour — is untouched and **stays open**; this row still declares no IN value.)* *(Further amended to owner ruling 2026-08-06, Q58 — the window's clock, and only the window's clock. The floor clause above previously named **no clock at all** for the window: `Q50` had left the hour and the window on one clock (the customer's market timezone) and `Q54` moved only the hour to the tenant's, so between the two rulings "outside lawful hours" and "the last lawful moment before it" had no stated frame wherever a tenant's timezone differs from its market's default (F1-21) — the gap recorded as open at §6 `F1-Q4` — register `Q58`, raised by the `Q54` closure. The owner puts the window on the same clock as the hour: one clock, not two. Nothing else in the row changes — the hour is still a pack default a tenant may narrow, the window is still a floor, a slot outside lawful hours still resolves to the last lawful moment before it and never after, and tenants may still narrow and never widen. §6's `F1-Q3`(a) — register `Q53`, that the IN pack declares neither a statutory messaging window nor a send hour — is untouched and **stays open**: this row still declares no IN value, and with no IN window declared there is as yet nothing to evaluate on any clock.)* | `SRC` — `D36` as amended 2026-08-02 ("the gate's MECHANISM is non-swappable; the statutory RULESET is per-market pack data"); `D36.callrules.frame` (`_process/extraction/journey-stages.md`); statutory messaging window and scheduled-send hour per owner ruling 2026-08-06 (Q50), whose *"customer's market timezone"* clock wording is **superseded** by owner rulings 2026-08-06 (Q54, for the hour) and 2026-08-06 (Q58, for the window) — both are read on the tenant's timezone per F1-10, one clock; the rest of the Q50 citation stands — the consuming requirement is `foundations/F5`'s `F5-68` | P0 |
| F1-16 | **A market with no voice ruleset in its pack cannot enable outbound voice.** Absence of `pack.calling-rules` voice content is a hard disable of outbound calling for that market's tenants — not a permissive default. | `SRC` — `D36` as amended 2026-08-02 ("A market with no voice ruleset in its pack cannot enable outbound voice") | P0 |
| F1-17 | **Statutory-floor items are enforced, never merely surfaced.** The pack marks each ruleset item as *floor* (enforced by the gate; tenant configuration may only narrow — e.g. a shorter window, extra holidays) or *default* (tenant-editable above the floor). No tenant setting, and no platform support action, can configure around a floor item — there is no override flag, and a stale compliance data source fails closed on the promotional side. **A floor item expressed in clock time is measured on the tenant's timezone (F1-10)** — the same clock the item's own default is read on — so the floor, the tenant's narrowing of it and the behaviour that yields to it are all compared in one frame and never across two. *(Clock sentence added by the pass applying owner ruling 2026-08-06, Q58, which settles that clock for the statutory messaging window of F1-15; the row's rule is unchanged and it previously named no clock, which after the same day's Q54 left "a shorter window" readable against either the tenant's clock or the market's. The suite already read its other time-bounded floor this way — F1-36's IN voice window is stated `09:00–21:00 tenant-local` — so this sentence records one frame rather than introducing a second.)* | `SRC` — `D36` as amended (`"Tenants configure within the law, not around it"`); fail-closed posture per docs/09 (`DOC09.compliance-fail-closed`, cited — M07 owns enforcement); the clock a time-bounded floor is measured on per owner ruling 2026-08-06 (Q58) → F1-10, F1-15 | P0 |

#### pack.payment-rails

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-18 | Every pack declares its **payment rails, as data plus adapters**: (a) for platform billing — the mandate-type vocabulary, the mandate/collection ladder per tier band and billing cycle (which rail is primary, which falls back, where a one-shot invoice replaces a mandate), and any per-debit caps or rail constraints that shape the ladder; (b) for tenant collections — the market's payment-mode vocabulary (validated as an open set per F1-09), with manual modes always available; (c) the market's reference rail adapters, stated vendor-neutrally as capability requirements with the v1 vendor as reference implementation (subscription billing, payment links, OTP delivery, telephony); and (d) any payment-data localisation constraints the market imposes and how the market satisfies them. Rail policy lives in the market's adapter layer, never in generic product behavior; adding or swapping a rail is an adapter change (F1-04). | `SRC` — `DOCFC.market-vocab` (mandate types, payment modes); `DOC16.mandate-routes` (shared — "IN-market policy, in the gateway adapter layer, never generic domain"; the quoted words are the ledger's IN instance cited as evidence for the framework law — a citation, not a requirement of this generic row *(note added by Task 26, matching the suite's IN-quote annotations)*; billing mechanics stay with M12); vendor-neutral rule per docs/07 (`DOC07.ports-vendor-neutral`, dispositioned by Task 3) | P0 |

#### pack.certification-schemes

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-19 | Every pack declares **which certification schemes the market requires** — a scheme-keyed set, possibly empty. Catalog item specifications carry scheme-keyed certifications; component pickers badge compliance per the schemes the tenant's market declares; and where a pack rule ties a scheme to a money path (e.g. a subsidy path requiring a scheme, F1-14), the product fails the affected output at its existing gate rather than silently passing. An empty scheme set means no badges and no scheme gates — never an error. | `SRC` — `R13` as amended 2026-08-02 (shared — "the market pack declares which schemes a market requires"; catalog mechanics stay with M01); `DOC04.catalog-certifications` (cited — M01 owns) | P0 |
| F1-20 | Every pack declares the **engineering-standards labels** its documents carry — the standards family named on electrical documents, drawing sheets and design ladders. The ladders themselves are pack rules data (F1-01); the *labels* printed on outputs are pack-declared so no module names a standards body. | `SRC` — `DOC02.market-pack-unit` ("proposal/PDF/SLD templates + standards labels") | P1 |

#### pack.formats

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-21 | Every pack declares its **locale and format data**: currency symbol, grouping rule (including compact notation), and minor unit; digit and script rules; date style; the market's default timezone (a default only — F1-10) and holiday calendar; the phone-number specification (country code, national format, and the OTP-destination allowlist state for that market's rollout); and default measurement units. F3 owns the single rendering implementation of each of these; the pack owns the values. | `SRC` — `DOC02.market-pack-unit` ("locale data (currency display …, holiday calendar, default units)"); `DOC08.otp-destination` ("other country codes enabled per market rollout — a global-ready switch, not a code change") | P0 |
| F1-22 | Every pack declares its **display vocabularies and labels** for the canonical machines and market documents: project-stage labels and the skippable-stage set; blocker-party labels; the project document checklist (rows, and per-segment omissions); and payment-mode display names. Modules render these labels against their market-neutral values (F1-09) and never define their own. | `SRC` — `R2` as amended (shared — stage labels/skippable stages are pack data); `DOCFC.market-vocab`; checklist-as-pack-data per `DOC04.document-checklist` (cited — M08 owns seeding/statuses) | P0 |

#### pack.data-rights

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-23 | Every pack carries the market's **privacy/residency determination** — the F1-05 prerequisite, kept as pack data: the platform's role(s) under that jurisdiction's data law (for tenant users' data and for the EPC's customer data), residency rules for primary data and for derived/object storage, the data-principal rights map (access/export, correction, erasure — with each right's product path and any SLA), breach-notification duties, and the consent records the market requires the product to keep and surface. | `SRC` — `DOCFC.new-market-gate` ("a privacy/residency determination for that jurisdiction BEFORE tenants are created there"); determination shape modeled on docs/08 §9's determination rows (the IN instance is F1-54…F1-59) | P0 |
| F1-24 | **Two rights are product law in every market, regardless of pack:** (a) tenant-level **read + export always work**, in every billing state — no pack may weaken this; (b) an **erasure workflow exists product-side** in every market — erasure is anonymisation, never row deletion, with the pack declaring the statutory retention carve-outs (from `pack.tax`, F1-13) that financial records honor. Packs may strengthen rights; they can never subtract these. | `SRC` — `DOC08.data-rights-export` ("tenant-level export always works regardless of billing state (product law)"); `DOC08.erasure-anonymise` (workflow law; period is pack data) | P0 |

#### pack.price-book

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-25 | Every market authors its **own price book**: per-tier price points for every offered cycle, in the market's currency; bundle sizes; overage rates; metered add-on prices (including tracked field seats per DD7 and marketing sends); and the market benchmarks the book was set against. The book is market data with an owner: **price points for a new market are never invented by this suite or derived by formula — they are owner/market decisions**, absent until made. | `BRIEF` — `_process/2026-08-03-v2-prd-design.md` §2 DD6 ("Every market has its own price points, currency, tax scheme, payment rails, mandate mechanics, benchmarks, bundle sizes, overage rates"), §2 DD7, §8, §14 ("Actual price points for new markets are never invented") | P0 |
| F1-26 | **No FX-converted pricing, ever.** No price in any market's book is ever produced by converting another market's book at an exchange rate — not as a default, not as a starting draft, not as a fallback. A market without an authored book has no prices and cannot sell (F1-05's supplier-of-record gate rides with this). | `BRIEF` — `_process/2026-08-03-v2-prd-design.md` §2 DD6 ("No FX-converted pricing, ever") | P0 |
| F1-27 | **Plan prices are per-currency rows; a new market adds rows, zero product change.** The billing structure is global-safe: each market's book lands as that market's price rows against the same plan structure, with provider-neutral gateway references — consistent with one currency per tenant (F1-07). | `SRC` — `DOC04.plan-prices-per-currency` (cited — `04-business-model.md` owns the architecture statement); `UD-9` ("global-safe billing schema, India-only rails") | P0 |

**Behavior detail.** The eight keys partition the market surface with no gaps and no ninth
key: money and statutory money duties (`pack.tax`, `pack.price-book`, `pack.payment-rails`),
public-money incentives (`pack.subsidy`), communications law — voice and messaging together,
one key (`pack.calling-rules`), component/market conformity (`pack.certification-schemes`),
everything a user reads or formats (`pack.formats`), and the jurisdiction's data law
(`pack.data-rights`). Where a fact could plausibly live in two keys, the assignment above is
the ruling: mandate types and payment modes are `pack.payment-rails` (machine vocabulary);
their display names, and all stage/checklist/blocker labels, are `pack.formats`; statutory
retention periods originate in `pack.tax` and are consumed by `pack.data-rights`;
subsidy-required schemes originate in `pack.certification-schemes` and are consumed by
`pack.subsidy`.

**Permissions.** As §F1.1 — no tenant grants exist on any key.

**Edge cases & what-goes-wrong.**

- *Two keys disagree inside one pack* (e.g. a subsidy requiring a scheme the scheme set
  lacks) → the pack is invalid as authored; pack validation is a platform-ops duty, and no
  module resolves the disagreement locally.
- *A ruleset item's floor/default classification is unclear in a market's law* → the pack
  records the classification explicitly with its basis, and an unresolved classification is
  raised as a register question (the Q6 disclosure item was exactly this case, resolved
  2026-08-04), never a silent default-to-editable.
- *A pack's declared scheduled-send hour falls outside that market's own messaging window* →
  the message goes at the **last lawful moment before** the configured slot, never after it;
  the window is the floor and the hour is the default that yields to it (F1-15, F1-17, owner
  ruling 2026-08-06 Q50). Both sides of that comparison are read on the **tenant's** timezone —
  the slot and the window alike (F1-10, owner ruling 2026-08-06 Q58): one clock, so "outside
  lawful hours" and "the last lawful moment before it" have a single frame. *(Edge case added by
  the pass applying Q50; before the ruling no send hour was declared and this list had no case
  for one. Clock sentence added by the pass applying Q58, which supplies the frame the case had
  been stated without.)*
- *A tenant serves a customer in a different timezone from its own* → the send hour resolves on
  the **tenant's** timezone (F1-10, F1-15, owner ruling 2026-08-06 Q54), so the message goes at
  the EPC's evening hour and not the customer's — and the lawful-window check the hour yields to
  resolves on that same tenant clock (owner ruling 2026-08-06 Q58), so the recipient's own
  statutory hours are never evaluated. This is the two rulings' knowingly accepted consequence of
  a simplification whose premise is that a solar EPC's customers are local to it; it is not a
  defect to be worked around per tenant. *(Edge case added by the pass applying Q54; before the
  ruling the clock was undecided and this list had no case for the two diverging. Extended by the
  pass applying Q58 to name the window alongside the hour.)*
- *A tenant's own timezone differs from its market's default timezone* (F1-21 supplies a default
  only, F1-10) → the market's statutory messaging window is evaluated on the **tenant's** clock,
  not the market's (F1-10, F1-15, owner ruling 2026-08-06 Q58). This is the second face of the
  same accepted simplification and is recorded rather than compensated for: there is no
  per-market evaluation clock and no second window computation. *(Edge case added by the pass
  applying Q58; before the ruling this divergence was the open question F1-Q4 and no case could
  state an outcome.)*
- *A market offers fewer rails than the ladder shape assumes* → the ladder is pack data; a
  one-rung ladder (invoice-only) is valid. The manual collection path is never removed
  (F1-18).
- *A pack revision changes labels while records exist* → labels are display data; historical
  records render the current label for the same neutral value; documents already generated
  keep the label they were generated with (F1-11).

**Acceptance criteria.**

- Given any authored market pack, when it is validated, then all eight keys are present, each
  satisfying its F1.2 rows, with empty content only where F1-14/F1-16/F1-19 permit (F1-13
  through F1-27).
- Given a market whose pack carries no voice ruleset, when a tenant in that market attempts
  to enable outbound voice, then the capability is unavailable — disabled, not defaulted
  (F1-16).
- Given a statutory-floor ruleset item, when tenant configuration edits its domain, then only
  narrowing succeeds and no path exists to cross the floor (F1-17).
- Given a proposal-affecting pack rule tying a subsidy to a scheme, when a non-conforming
  component sits on a subsidy-path output, then the existing gate fails it with the reason
  (F1-14, F1-19).
- Given a new market's book, when prices are sought before the owner authors them, then no
  price exists — nothing converts, nothing defaults (F1-25, F1-26).
- Given the platform invoice surface, when a market's scheme requires statutory extras, then
  they attach as scheme-tagged data and appear on no other market's invoices (F1-13).
- Given any market pack, when its communications ruleset is read, then voice and messaging
  duties sit in the one `pack.calling-rules` key and every item carries an explicit
  floor-or-default classification (F1-15, F1-17).
- Given a pack-declared scheduled-send hour for an automatic transactional message, when the
  send is due, then it goes at that hour **on the tenant's timezone** (F1-10) — including where
  the customer sits in a different timezone, in which case the message goes at the tenant's
  evening hour and not the customer's; and when the
  configured slot falls outside that market's statutory messaging window — the window itself
  evaluated on that same tenant timezone (F1-10, owner ruling 2026-08-06 Q58), including where
  the tenant's timezone differs from its market's default (F1-21) — then it goes at the
  last lawful moment before the slot and never after it; and when tenant configuration edits
  the window, then only narrowing succeeds and no widening path exists (F1-15, F1-17, owner
  rulings 2026-08-06 Q50, Q54 and Q58). *(Criterion added by the pass applying Q50; before the ruling no
  scheduled-send hour was pack data and no criterion here tested one. Amended by the pass
  applying Q54: it previously read "then it goes at that hour in the customer's market
  timezone", and the divergence it carried against F1-10 was the open F1-Q3(b). Amended again by
  the pass applying Q58: the window clause previously named no clock for the window, the gap
  recorded as the open F1-Q4, and now names the tenant's — one clock for hour and window.)*
- Given a market's rails declaration, when platform billing or tenant collections run, then
  mandate types, the rail ladder and payment modes validate against the pack, and the manual
  collection path is available regardless of rail state (F1-18).
- Given any rendering of currency, dates, phone numbers, stage labels, checklists or
  payment-mode names, when it displays, then the values come from the pack's `pack.formats`
  declarations and no module defines its own (F1-21, F1-22).
- Given a market pack presented for launch, when it is validated, then its `pack.data-rights`
  key carries the jurisdiction's determination — roles, residency, rights map, breach duties
  and required consent records (F1-23, with F1-05).
- Given any market, when tenant-level read or export is attempted in any billing state, then
  it works; and when erasure is requested, then the anonymisation workflow exists with the
  pack's retention carve-outs honored (F1-24).

**Localization notes.** Key names (`pack.tax`, …) are suite-internal identifiers, never
user-facing copy. All user-facing strings that vary by market are pack label data (F1-22)
rendered under F3. **Analytics events:** none of its own.

### F1.3 — The India pack (IN) — the source-derived reference instance

India is the launch market and the reference instance proving the framework carries a real
market whole. **This section is the only place in this suite's foundation and module
documents where India's statutory and market specifics are named** — every module reaches
these facts through the pack keys. The IN pack also carries the engineering-facing rules data
of F1-01 (electrical ladders per the Indian standards family, design-temperature bands, wind
zones, setbacks, per-utility net-metering conventions); its product surface is M05's and its
detailed enumeration belongs to the studio deep-dive pass (design spec §2 DD13) — nothing in
this section shrinks it.

#### IN · pack.tax — GST

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-28 | The IN tax scheme is **GST**, strategy `per_line_rate`; the tenant tax-registration type is `IN_GST`. All platform prices are **ex-GST**; platform SaaS subscriptions and overage add-ons carry **SAC 998434 (cloud/SaaS) at 18% GST**. | `SRC` — `DOC16.gst-invoice` (docs/16; shared — invoice mechanics M12); `DOC04.proposal-tax-model` ("per-line GST is the IN instance", cited — M06); `DOC01.billing-cadence` ("All prices exclude 18% GST", cited — `04-business-model.md`); `DOC04.tenant-onboarding-fields` ("v1 accepts only IN_GST", cited — M01) | P0 |
| F1-29 | **The platform is supplier of record in IN** — our GSTIN, our GST remittance, our liability; the gateway is a gateway, not merchant-of-record. A GST-compliant invoice is generated per billing cycle carrying our GSTIN and the tenant's GSTIN (captured at conversion — B2B tenants need it for input tax credit), with **place-of-supply logic: intra-state CGST+SGST, inter-state IGST**. | `SRC` — `DOC16.gst-supplier-of-record` (docs/16, shared — business-model posture with Task 7/M12); `DOC16.gst-invoice` (shared) | P0 |
| F1-30 | **e-invoicing (IRN) threshold rule:** IRN obligations are not applicable until platform turnover crosses the ₹5-crore threshold; the gateway does not file IRNs. When crossed, IRN/acknowledgement/QR data attaches to invoices from then on — **nothing is backfilled**; the threshold is validated at each financial-year close. | `SRC` — `DOC16.e-invoicing-threshold` (docs/16) | P1 |
| F1-31 | **The tenant-side money path is GST-native end to end:** proposal money carries per-line GST percentages with the document-level breakdown; the locked BOM money math (margin-below-GST, pre-GST pro-rata discount) and the reconciliation law (BOM ↔ proposal ↔ tranches ↔ payments, to the paise) run on this scheme. The mechanics are M05/M06/M11's; the scheme facts are this pack's. | `SRC` — `DOC04.proposal-tax-model` and `DOC05.bom-money-locked` (cited — M06/M05 own); reconciliation per `DOC04.tranches-money-path` (cited — M11) | P0 |
| F1-32 | **Statutory retention (IN): GST financial records are retained 6+ years** — the erasure carve-out period `pack.data-rights` honors (F1-57): proposals, invoices and payment records outlive an erasure request for this period. | `SRC` — `DOC08.erasure-anonymise` (docs/08: "retained for the market pack's statutory period (IN: GST, 6+ years)") | P0 |

#### IN · pack.subsidy — PM Surya Ghar

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-33 | The IN subsidy model is **PM Surya Ghar** (residential rooftop): subsidy slabs are **computed** from state × capacity × DCR eligibility, shipped as **versioned injected market configuration** — never manually configured per tenant; a slab revision is a pack-data update (F1-11) and older computed outputs self-stale per F8. | `SRC` — `DOC01.gtm` ("subsidy slabs computed in the domain layer (state × capacity × DCR), not manually configured", cited — `04-business-model.md`); docs/12 verdict `CG-2` ("slabs ship as versioned injected market config so slab revisions are data updates, not releases", cited) | P0 |
| F1-34 | **The IN subsidy path requires DCR-compliant components** (F1-44): where a proposal takes the subsidy path, a non-DCR component fails the output at the product's existing Generate-time gate (M06's mechanics; this pack supplies the rule). | `SRC` — docs/12 verdict `CG-1` ("a DCR rule fails the BOM/proposal when the subsidy path requires DCR and a component isn't compliant", cited — M06 carries the gate); `R13` as amended (shared) | P0 |
| F1-35 | The canonical incentive-claim stage **applies in IN**, labelled per F1-51, and is **skippable** for commercial projects and for projects with no incentive. | `SRC` — `R2` as amended (shared — "incentive_claimed is skippable per pack rule and for no-incentive projects", via `DOC04.project-machine`, cited — M08 owns the machine) | P0 |

#### IN · pack.calling-rules — TRAI/DLT

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-36 | **The IN statutory voice floor (TRAI/DND), enforced by the compliance gate (floor items, F1-17):** (a) **DND scrub** — don't call DND-registered numbers; the scrub cache is refreshed daily before the calling window opens; scrub data older than 24 h pauses promotional dialing **fail-closed** while transactional calls continue; (b) **the three-lane calling law (owner ruling 2026-08-04, Q30):** lane 1 — **inbound AI answering 24/7** (answering an inbound call is never window-bound); lane 2 — **unsolicited/promotional AI dials strictly 09:00–21:00 tenant-local** (statutory floor unchanged, no override), honoring the IN holiday calendar (F1-50); lane 3 — the **requested-callback lane**: the agent may dial outside the window **only** on an explicitly recorded, timestamped customer request for that time (transcript, message or rep note); the call must **open by referencing the request**; the consent trail is stored as evidence; a **single "stop" ends the lane** for that customer; the lane is product law with **per-tenant enable/disable only**. Human reps on an outside-window/registry-listed manual dial get warning-then-proceed with the "customer requested" context logged (M07's surfaces). *Activation caveat:* operator-side consent registration (DCA/DLT) may be required before lane 3 activates — it rides the activation clocks; (c) **opt-out** — a keypress or spoken "stop calling" sets do-not-call, honored within 24 h, irreversible without the customer's say-so; a complaint sets a permanent quiet flag; (d) **the tiered AI-disclosure law (owner ruling 2026-08-04, Q6 — replaces the former ≤30 s disclosure floor):** at IN launch the agent opens **naturally** ("I'm Asha from [company]") with **no proactive AI mention**; four **hard floors are retained as non-negotiable product law** — never claims to be human · never denies being AI when asked (honest answer plus an immediate human offer) · instant human handoff on request · full transcription to the timeline; the proactive-disclosure line itself is **pack data**: the IN pack ships it **OFF** and **auto-flips it ON with owner notification when TRAI's AI-caller identification rule binds** (the Q6 revisit trigger); EU-class packs ship it ON (AI Act Art. 50); (e) **recording retention 90 days** then hard delete, transcript retained. | `SRC` — `D36` as amended 2026-08-02 (shared — ruleset half; gate mechanism M07); `D36.callrules.dnd`, `D36.callrules.hours`, `D36.callrules.escape`, `D36.callrules.recording` (`_process/extraction/journey-stages.md`); three-lane law and tiered disclosure per owner rulings 2026-08-04 (Q30, Q6), superseding `D36.callrules.disclosure`'s ≤30 s floor reading; scrub/fail-closed detail per docs/07 §ComplianceGate and `DOC09.compliance-fail-closed` (cited — M07); retention per `DOC08.recording-retention` (cited — M07) | P0 |
| F1-37 | **IN caller-line series routing:** CLI series distinguish transactional vs promotional vs standard inbound traffic; **promotional outbound uses the 140-series RTM route** — the 1600-series is closed to non-BFSI entities. | `SRC` — docs/15 §4 directive 7 as amended (ADR-0019 operative facts; capability framework stays with M07); `DOC04.byo-number` series vocabulary (cited — M07) | P0 |
| F1-38 | **IN messaging compliance (DLT):** SMS traffic uses only DLT-registered entity, header and templates — unregistered traffic is carrier-blocked. Template/entity registration is a third-party approval clock: it gates **activation, not scope** (code ships; activation follows the clock, with documented fallbacks). Platform→tenant messaging (dunning SMS, notifications) rides the same registered-template rule. | `SRC` — `DOC08.dlt-templates` (docs/08); activation-clock law per `DOC14.activation-vs-build` (cited — `00-README` scope law); dunning channel stack per `DOC16.dunning-channels` (cited — M12 owns the ladder) | P0 |
| F1-39 | **IN consent posture (defaults above the floor):** recording consent is captured by default and **a customer who declines recording is still served**; voice-call consent state is tracked per customer with timestamps and source, and read before every dial. The consent *records* themselves are `pack.data-rights` content (F1-58). | `SRC` — `D36.callrules.recording` (consent-capture default is tenant config; retention is statutory); `DOC04.compliance-flags` (cited — M02/M07 own the record and the gate read) | P0 |

**Behavior detail (IN calling rules).** The stakes are why the floor is a floor: regulator
penalties (₹25,000 per upheld complaint) land on the tenant, so the gate enforces rather than
advises — no override flag exists, and stale scrub data pauses promotional dialing rather
than risking it (docs/07 §ComplianceGate, M07). What stays tenant-editable in IN, per D36:
everything above the floor — tone, topics (including price talk), hand-over shaping, max
attempts, a *narrower* calling window, holiday additions. The requested-callback lane
(F1-36b lane 3) is **per-tenant enable/disable only** — no tenant edit widens it; and the
proactive-disclosure line is pack data per F1-36(d) while its four hard floors are product
law no tenant, preset or template edit can weaken (owner rulings 2026-08-04, Q30/Q6). The
source's pre-overlay wording ("the owner can change or switch off any of them", including
*widening* the window) is superseded by the D36 amendment for statutory items and enters
this suite only as that supersession record.

#### IN · pack.payment-rails

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-40 | **The IN platform-billing mandate ladder:** UPI AutoPay primary — every monthly tier price sits under the **₹15,000 per-debit cap** — with card e-mandate fallback; e-NACH / invoice for Enterprise. **Any yearly total (incl. 18% GST) exceeds the cap** (even the entry tier: ₹19,990 + GST = ₹23,588), so yearly billing is a single payment link/invoice per year, no mandate; renewal is a fresh invoice. The mandate is collected at conversion, never at signup; pre-debit notifications before each charge are the gateway's duty (product dunning copy may reference them, builds nothing). | `SRC` — `DOC16.mandate-routes`, `DOC16.mandate-ladder` (docs/16, shared — enforcement/billing mechanics M12); `DOC01.mandate-at-conversion`, `DOC01.yearly-payment-rail` (cited — M12) | P0 |
| F1-41 | **IN mandate-type vocabulary:** `upi_autopay` and `card_emandate` are the validated mandate types for self-serve tiers; e-NACH rides the Enterprise/invoice route. | `SRC` — `DOC04.subscription-states` ("mandate types validated per provider/market (IN: upi_autopay / card_emandate)", cited — M12 owns lifecycle); `DOC16.mandate-ladder` (shared) | P0 |
| F1-42 | **IN tenant-collections payment modes:** `upi` / `neft` / `cheque` / `cash` / `payment_link` — the open-set vocabulary tenant payment records validate against (F1-09). Manual modes are always available; the payment-link rail is an accelerator, never a dependency ("cash is still king in EPC"). | `SRC` — `DOC04.payments-append-only` (cited — M11 owns the ledger); `DOC16.manual-payment-modes` (cited — M11) | P0 |
| F1-43 | **IN reference rail adapters (vendor-neutral capabilities, v1 vendors as reference implementations):** subscription billing and tenant payment links — Razorpay; OTP delivery — MSG91; telephony and speech for the voice capability — Exotel + Sarvam (capability requirements themselves are M07's). **Payment-data localisation (RBI) is satisfied by construction:** a licensed Indian payment aggregator holds all payment instruments; the platform never touches instruments or tenant funds. | `SRC` — `R3` (shared — IN vendor/rails half; capability framework M07), `R6` (shared — OTP IN rail half; link lifecycle F5), `R4` and `DOC16.hosted-checkout` (cited — M12 owns billing mechanics); localisation per `DOC08.residency` | P0 |

#### IN · pack.certification-schemes

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-44 | **IN declares two schemes: ALMM and DCR.** Platform catalog items carry MNRE ALMM list references and DCR flags as the IN entries of the scheme-keyed certifications structure; component pickers badge ALMM/DCR compliance for IN tenants; the subsidy path consumes DCR per F1-34. | `SRC` — `R13` as amended 2026-08-02 (shared — "ALMM/DCR are the IN entries of a scheme-keyed `certifications` structure"; catalog mechanics M01); `DOC04.catalog-certifications` (cited — M01); docs/12 `CG-1` (cited) | P0 |
| F1-45 | **IN engineering-standards labels: the IS/IEC family** (with CEA requirements where drawings demand them) — the standards labels printed on electrical documents, SLD ladders and drawing sheets for IN designs. | `SRC` — `DOC02.market-pack-unit` (standards labels are pack data); docs/12 `CG-reslink.5` ("IS/IEC ladders … the standards ladder is pack-declared", cited — M05 owns the surfaces) | P1 |

#### IN · pack.formats

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-46 | **Currency format: INR (₹), Indian grouping — lakh/crore — in every locale** (₹4,52,471; compact ₹92L, ₹1.4 Cr), minor unit paise (two decimals). This is the IN pack's number format consumed by F3's single money-formatting function on web, mobile, PDFs and voice-agent text alike. | `SRC` — `DOC10.money-format`, `DOC03.currency-units-law`, `DOCARCH.money-grouping` (all cited — F3 owns the rendering law); grouping-as-pack-data per the global-backend ruling (`UD-9`, and docs/12 `CG-moat.4` note) | P0 |
| F1-47 | **Digits and scripts:** digits are always Latin 0–9, in every IN locale including documents; Hindi and Marathi render in **Devanagari** — correct conjunct shaping is a commercial-document requirement (capability F3's; the script requirement is this pack's fact). | `SRC` — `DOC10.latin-digits`, `DOC10.devanagari`, `DOC03.devanagari-documents` (cited — F3 owns) | P0 |
| F1-48 | **Dates and calendar:** date style "12 Mar 2026"; default tenant timezone **Asia/Kolkata** (a default per F1-10); the **IN holiday calendar** is the pack calendar the calling window (F1-36) and schedule defaults honor. | `SRC` — `DOC10.dates-tz` (cited — F3); holiday calendar as pack locale data per `DOC02.market-pack-unit` | P0 |
| F1-49 | **Phone specification: +91**, E.164 identity; the OTP-destination allowlist is **+91 by default**, with other country codes enabled per market rollout — a switch, not a code change. | `SRC` — `DOC08.otp-destination` (docs/08); E.164 identity per `DOC04.user-lifecycle` (cited — M01) | P0 |
| F1-50 | **Units: metric default**; per-user m/ft preference stands, and procurement quantities stay metric regardless (F3's law; the default is this pack's). | `SRC` — `DOC04.user-language-units`, `DOC10.units-not-translated` (cited — F3 owns) | P1 |
| F1-51 | **IN stage and blocker labels** for the canonical machines: `utility_inspection` → **"DISCOM inspection"**; `incentive_claimed` → **"Subsidy claimed"**; blocker party `utility` → **"DISCOM"**. Skippable-stage set: `incentive_claimed` (per F1-35). DISCOM names, like brand names, are never translated. | `SRC` — `R2` as amended 2026-08-02 (shared — the IN labels half; machine M08, board metrics M13, link display F5); `DOC04.blockers` (cited — M08); untranslated names per `DOC10.units-not-translated` (cited — F3) | P0 |
| F1-52 | **IN project document checklist (8 rows):** signed proposal · advance receipt · net-metering application · DISCOM approval · subsidy application & sanction · commissioning certificate · warranty documents · handover pack — **the subsidy row omitted for commercial projects**. Seeding and statuses are M08's mechanics; the row set is this pack's. | `SRC` — `DOC04.document-checklist` (cited — M08 owns seeding/statuses/handover rule; "The project document checklist is market-pack data") | P0 |
| F1-53 | **DISCOM-aware states:** the IN pack supplies the utility directory — states and their DISCOMs — that site records select from (M04/M08 surfaces), and the honest wait-attribution framing the customer link renders against DISCOM waits (e.g. net-metering approval "applied 15 Aug, typically 3–6 weeks"). State-specific application packets are a post-launch template family (§5). | `SRC` — docs/12 `CG-3` ("F1's India pack supplies the DISCOM label and state packet list", cited — M08 carries selection/blockers); wait framing per `DOC04.blockers` and customer-journey `C10` (cited — F5) | P0 |

#### IN · pack.data-rights — DPDP

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-54 | **IN determination (DPDP Act / DPDP Rules 2025):** the platform is **Data Fiduciary** for tenant users' PII and **Data Processor** for the EPC's customer data — the tenant is fiduciary for their customers; DPA terms ride in the subscription agreement. This is the IN instance of F1-23; any new market authors its own before tenants exist there (F1-05). | `SRC` — `DOC08.dpdp-roles` (docs/08 §9) | P0 |
| F1-55 | **IN residency:** all PII/primary data resides in India; payment instruments never touch the platform (F1-43); cross-border object storage is permitted under DPDP's **negative-list transfer model** — with a documented migration path if the list changes. | `SRC` — `DOC08.residency`; `DOC03.dpdp-residency` (docs/03 compliance ruling — same determination) | P0 |
| F1-56 | **IN rights map — access/export and correction:** tenant-level read + export always work regardless of billing state (the F1-24 law, IN instance); individual data-principal export is a support-backed workflow — JSON/CSV of all rows keyed to the principal, **30-day SLA**; correction happens in-app through the ordinary record edit. | `SRC` — `DOC08.data-rights-export`; `DOC08.data-rights-correction` (docs/08) | P0 |
| F1-57 | **IN erasure = anonymisation, never row deletion:** PII fields are overwritten — name becomes "Erased", phone becomes a keyed hash that preserves dedupe integrity — while financial/tax records (proposals, invoices, payments) are retained for the statutory period (F1-32). User accounts follow deactivate-never-delete with the same anonymisation. | `SRC` — `DOC08.erasure-anonymise` (docs/08); deactivate-never-delete per `DOC08.deactivate-never-delete` (dispositioned by Task 5, `F2-20`) | P0 |
| F1-58 | **IN consent records:** per-customer voice-call consent, recording consent, and DND/do-not-call flags — each with timestamps and source — are stored, surfaced pre-dial (the gate read, M07), and **exported on request**. | `SRC` — `DOC08.consent-records` (docs/08; pre-dial surfacing is M07's) | P0 |
| F1-59 | **IN breach duty:** notify the Data Protection Board and affected data principals; a grievance contact is published in-app. | `SRC` — `DOC08.breach-grievance` (docs/08) | P0 |

#### IN · pack.price-book

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F1-60 | **The IN book is the source-derived first book**, in INR, ex-GST, canonical in `04-business-model.md` (one definition per fact): tier anchors ₹1,999 / ₹3,999 / ₹9,999 monthly + Enterprise custom, each with a yearly variant, and the v1 caps, bundles and overage rates as `04` defines them; benchmarked **under Reslink and ARKA at equivalent capacity**. This key records the book's existence, currency, tax posture and benchmark basis; no number is defined twice. | `SRC` — `_process/2026-08-03-v2-prd-design.md` §2 DD6 ("India book (₹1,999/₹3,999/₹9,999/Enterprise + v1 caps/bundles) is the source-derived first book"); `DOC01.tier-table`, `DOC01.price-under-incumbents`, `DOC16.pricing-single-source` (all cited — `04-business-model.md` owns the numbers) | P0 |
| F1-61 | **V2 metered add-ons are priced in the IN book:** the per-tracked-seat field-workforce price (DD7) and per-channel marketing-send bundles (design spec §8) are IN-book rows. **Owner ruling 2026-08-04 (Q1/Q17):** the rows now carry the owner's **draft** values — tracked seat ≈₹99/seat/mo beyond the tier's included allowance (Starter 0 / Growth 3 / Pro 10 / Enterprise custom); send bundles Starter 500 / Growth 2,000 / Pro 10,000 per month, overage ≈ WhatsApp ₹1.5 · SMS ₹0.35 · email ₹0.10 — canonical numbers at `BM-41`, every one **draft pending rate-card verification** (`BM-17`/`BM-26`) before the meters can be sold. | `BRIEF` — `_process/2026-08-03-v2-prd-design.md` §2 DD7 ("per-seat price set per market book"), §8 ("marketing sends … bundles per market book"); draft values + included-seat ladder per owner ruling 2026-08-04 (Q1/Q17) | P0 |

**Behavior detail (India pack).** Read §F1.3 as one instance table: every framework row of
§F1.2 is satisfied — tax (F1-28…F1-32), subsidy (F1-33…F1-35), calling rules
(F1-36…F1-39), payment rails (F1-40…F1-43), certification schemes (F1-44…F1-45), formats
(F1-46…F1-53), data rights (F1-54…F1-59), price book (F1-60…F1-61). Where a row states
mechanics owned elsewhere (gates, ledgers, machines, rendering), the mechanics pointer is in
the row's tag cell; what this section owns is the IN **data**: the values, labels, rulesets,
rails and duties.

**Permissions.** As §F1.1. The IN pack adds no grants; the tenant surfaces that configure
above its floors (calling window narrowing, holiday additions, consent defaults, templates)
are M01/M07's and carry F2's matrix rows there.

**Edge cases & what-goes-wrong (IN).**

- *DND scrub goes stale (>24 h)* → promotional dialing pauses fail-closed and the pause is
  alarmed; transactional calls continue (F1-36; enforcement M07).
- *A lead is captured at 11 pm* → capture always works; no unsolicited outbound call before
  the window opens at 9 am tenant-local — unless the customer's own recorded, timestamped
  request places a requested-callback outside the window (F1-36 lanes 2–3, owner ruling
  2026-08-04 Q30; queue mechanics M02/M07).
- *A customer says "stop calling"* → do-not-call is set within 24 h, irreversible without
  the customer's say-so; a complaint sets a permanent quiet flag (F1-36).
- *A customer declines recording* → still served; the declination is a consent record
  (F1-39, F1-58).
- *The e-invoicing threshold is crossed mid-year* → IRN data attaches to invoices from that
  point forward; nothing is backfilled (F1-30).
- *A PM Surya Ghar slab revision lands* → a new pack version; proposals computed on the old
  slabs self-stale per F8 and sent proposals keep their figures forever (F1-33, F1-11).
- *A commercial project* → no subsidy checklist row, incentive-claim stage skipped
  (F1-35, F1-52).
- *An erasure request arrives for a customer with paid invoices* → PII is anonymised;
  the financial records remain for the statutory period; dedupe still works via the keyed
  phone hash (F1-57, F1-32).
- *A tenant asks support to widen the calling window beyond 9am–9pm* → refused by
  construction for unsolicited calls: statutory floor, no override flag (F1-17, F1-36). The
  only lawful dial outside the window is the requested-callback lane, which exists on the
  customer's own recorded, timestamped request — never on a tenant setting (F1-36 lane 3,
  owner ruling 2026-08-04 Q30).

**Acceptance criteria (IN).**

- Given an IN tenant's platform invoice, when a cycle is billed, then it carries our GSTIN,
  the tenant's GSTIN if captured, SAC 998434 at 18%, and CGST+SGST or IGST per place of
  supply; and no IRN data appears below the ₹5-crore threshold (F1-28, F1-29, F1-30).
- Given a subsidy-path proposal for an IN residential customer, when the subsidy is shown,
  then it is computed from state × capacity × DCR under the current pack version, and a
  non-DCR component fails Generate with the reason (F1-33, F1-34).
- Given any IN unsolicited promotional agent call, when it is attempted, then it dials only
  inside 09:00–21:00 tenant-local on a non-holiday, only past a fresh DND scrub, opens
  naturally without any claim to be human, and the recording is deleted at 90 days with the
  transcript retained (F1-36).
- Given a recorded, timestamped customer request for a callback at a time outside the window,
  when the agent dials at that time, then the call opens by referencing the request, the
  consent trail is stored as evidence, and a single "stop" ends the requested-callback lane
  for that customer (F1-36 lane 3, owner ruling 2026-08-04 Q30).
- Given any IN agent call where the customer asks whether they are speaking to an AI, when
  the agent responds, then it answers honestly and immediately offers a human — and on no
  call does the agent claim to be human (F1-36d hard floors, owner ruling 2026-08-04 Q6).
- Given TRAI's AI-caller identification rule binding, when the IN pack data updates, then
  proactive disclosure auto-flips ON and the owner is notified (F1-36d).
- Given IN promotional outbound, when a CLI is selected, then it is a 140-series identity,
  never a 1600-series one; and given any platform SMS, when it is sent, then it uses a
  DLT-registered entity/header/template (F1-37, F1-38).
- Given an IN proposal's money block, when it is computed, then per-line GST rides each line
  with the document-level breakdown, and BOM ↔ proposal ↔ tranches reconcile to the paise
  (F1-31).
- Given an IN self-serve monthly subscription, when the mandate is set up at conversion,
  then it is UPI AutoPay with card e-mandate fallback; and given any yearly total, then it is
  a single invoice/payment link, no mandate (F1-40, F1-41).
- Given an IN tenant recording an offline payment, when the mode is chosen, then the set is
  exactly upi / neft / cheque / cash / payment_link (F1-42).
- Given IN subscription billing, payment links or OTP delivery, when a rail is exercised,
  then a vendor-neutral capability is served by the IN reference adapter and no payment
  instrument ever touches the platform (F1-43).
- Given a customer who declines call recording, when the call proceeds, then they are still
  served and the declination lands as a consent record with timestamp and source
  (F1-39, F1-58).
- Given an IN component picker on a subsidy-relevant design, when items render, then ALMM
  and DCR badges appear from the scheme-keyed certifications (F1-44).
- Given any money figure in any IN locale, when it renders, then it uses ₹ with lakh/crore
  grouping and Latin digits; and given an IN project board, when stages render, then the
  labels read "DISCOM inspection" / "Subsidy claimed" over the market-neutral values
  (F1-46, F1-47, F1-51).
- Given a project's documents for a residential IN deal, when the checklist seeds, then the
  8 rows of F1-52 appear; for commercial, the subsidy row is absent (F1-52, F1-35).
- Given an IN date, phone or OTP surface, when it operates, then dates read "12 Mar 2026"
  style on an Asia/Kolkata default, phones are +91 E.164, and OTP delivery honors the +91
  allowlist (F1-48, F1-49).
- Given an IN site record, when its utility is selected, then the choice comes from the
  pack's state → DISCOM directory, and a utility blocker renders honest wait attribution on
  the customer link (F1-53).
- Given the IN privacy determination, when it is consulted, then the platform's
  fiduciary/processor roles, the DPA terms and the residency rules read exactly as F1-54 and
  F1-55 declare them (F1-54, F1-55).
- Given a data-principal export request, when support fulfils it, then JSON/CSV of all rows
  keyed to the principal is delivered within 30 days; and given an erasure, then
  anonymisation runs with financial records retained for the statutory period
  (F1-56, F1-57, F1-32).
- Given a breach event, when duties trigger, then the Data Protection Board and affected
  principals are notified and the grievance contact is published in-app (F1-59).
- Given the IN price book, when any tier price renders, then the number comes from
  `04-business-model.md`'s book — nowhere else defines it; and when a tracked-seat or
  marketing-send price is sought, then it resolves from the IN book's add-on rows and
  nowhere else (F1-60, F1-61).

**Localization notes.** The IN pack's labels ("DISCOM inspection", "Subsidy claimed",
checklist row names, payment-mode display names) are translated EN/HI/MR under F3; DISCOM
names, brand/model names and units are never translated; digits stay Latin in all three
languages (F1-47). **Analytics events:** none of its own; compliance-relevant events (blocked
dials with verdicts, consent changes) are M07/M02's and audit events are F2's.

## 4. Cross-module contracts

**The standing verification rule (binding on every module task and on the closure pass).**
Module PRD bodies are market-neutral: India's statutory and market terms appear **only** in
this document's §F1.3 and in `04-business-model.md`'s India book. Concretely:
`grep -ci 'GST\|DISCOM\|ALMM\|TRAI'` over every `prd/modules/M*.md` must return **0**, with
the sole sanctioned exception being a pack reference — a mention that exists only to point at
this document (a pack key or `F1-nn` ID). The four grep terms are the sentinel set; the rule
covers every IN specific with the same force (₹ amounts, lakh/crore, PM Surya Ghar, DLT,
UPI, DISCOM names, SAC/GSTIN/IRN, DPDP, MSG91/Razorpay/Exotel as vendor names). A module that
needs such a fact writes the market-neutral capability and cites the pack key; the closure
pass (Task 26) runs the grep as a gate.

**What F1 provides to other documents** (each consumer references the key, never restates the
data):

| Consumer | What it takes from F1 |
|---|---|
| `04-business-model.md` | Price-book law (F1-25…F1-27); tax posture for pricing copy (F1-13; IN: F1-28…F1-30); the IN book identification it owns the numbers for (F1-60, F1-61) |
| `modules/M12-platform-billing.md` | Tax scheme + statutory invoice extras (F1-13; IN F1-28…F1-30); mandate ladder + types (F1-18; IN F1-40, F1-41); dunning-channel compliance (F1-38); read+export law interplay (F1-24) |
| `modules/M11-payments-and-collections.md` | Payment-mode vocabulary (F1-18; IN F1-42); tenant-side tax scheme facts (F1-31) |
| `modules/M07-sales-execution.md` | The calling-rules ruleset its non-swappable gate mechanism consumes (F1-15…F1-17; IN F1-36…F1-39); reference telephony/speech rails (F1-43); consent surfacing (F1-58) |
| `modules/M03-marketing.md` | Messaging/sender/template compliance from the same key (F1-15; IN F1-38) |
| `modules/M08-projects.md` | Stage labels, skippable set, blocker labels, document checklist, utility directory (F1-22; IN F1-51…F1-53) |
| `modules/M01-onboarding-and-tenant-config.md` | Certification-scheme declarations for catalog specs (F1-19; IN F1-44); tax-registration types (F1-13; IN F1-28); OTP-destination allowlist (F1-21; IN F1-49); the floors its config surfaces respect (F1-12) |
| `modules/M04-survey.md`, `modules/M05-design-studio.md`, `modules/M06-proposals.md` | Scheme badges + subsidy computation rules (F1-19, F1-14; IN F1-33, F1-34, F1-44); standards labels (F1-20; IN F1-45); engineering rules data (F1-01, §F1.3 intro) |
| `modules/M02-crm-and-leads.md`, `modules/M13-dashboards-and-reporting.md` | Labels and vocabularies for lists/boards/reports (F1-22); currency formats via F3 (F1-21) |
| `foundations/F3-localization.md` | The format values its single rendering implementations consume (F1-21; IN F1-46…F1-50) |
| `foundations/F5-customer-link.md` | Labels + wait-attribution framing (F1-22; IN F1-51, F1-53); threshold denomination law (F1-07); the scheduled-send hour and the statutory messaging window it sits inside for `F5-68`'s evening-before crew message — hour a default read on the **tenant's** timezone (F1-10), window a floor **evaluated on that same tenant clock** (F1-15, F1-17; owner ruling 2026-08-06 Q50 — line added by the pass applying it, this row previously took no communications-ruleset content; the hour's clock added by the pass applying owner ruling 2026-08-06 Q54, which supersedes Q50's "customer's market timezone" wording; the window's clock added by the pass applying owner ruling 2026-08-06 Q58 — one clock for both, the row having named none for the window until then) |
| `foundations/F8-data-honesty.md` | Pack-version pinning as a staleness input (F1-11) |
| `foundations/F2-roles-and-permissions.md` | Nothing to grant — the confirmation that pack data carries no tenant grants (§2); audit families cover pack-relevant tenant config changes (F2-22) |

**What F1 expects from other documents:** market-neutral bodies with neutral machine
vocabulary (F1-03, F1-09 — R2's enum names are the precedent); M07 specifies the gate
mechanism and treats every statutory value as pack data; F8 includes the pack/rules version
in its staleness fingerprint story; F3 implements each format capability exactly once; `04`
owns tier architecture and every IN price number; module tasks run their own §4 grep before
hand-off.

**Pack authoring and change control** are platform operations: versioned, dated, audited
(pack-relevant tenant-visible changes surface through F2's audit families); a pack change
never edits a module document.

**Foreign-subscriber commercial posture (owner ruling 2026-08-04, Q7).** India-first
commercially: the first foreign subscribers are billed by the Indian entity as zero-rated
**export of services** (international gateway mode, USD/AED settlement) — posture carried at
`04-business-model.md` `BM-40`. A merchant-of-record or foreign-entity structure is revisited
only at real foreign revenue (the revisit trigger). F1-05's gate is unchanged: no non-IN
market pack launches without its own jurisdiction determination and book.

## 5. Non-goals

- **No second market pack.** Gulf/MENA, SEA/Africa, EU/UK/AU and US are named expansion
  candidates only (UD-9); no pack, no partial pack, no draft price book for any of them
  exists in this suite. Each future market enters through F1-05's gate. (Rationale: launch is
  India-only by ruling; inventing jurisdiction determinations or price points would violate
  design spec §14 and the conflict rule.)
- **No FX-converted pricing** — restated as a non-goal of the pricing system itself: there is
  no "converted preview", no draft-by-exchange-rate, ever (DD6, F1-26).
- **No invented numbers.** New-market price points, subsidy values, or statutory parameters
  are owner/market decisions; absence is the correct state until decided (design spec §14).
- **No per-tenant compliance exceptions.** No override flag, no support-side bypass of any
  statutory floor item (D36 as amended; F1-12, F1-17) — the statutory messaging window that
  F1-15's scheduled-send hours sit inside is such an item: a tenant narrows it and never
  widens it, and no setting and no support action moves a send past it *(clause added by the
  pass applying owner ruling 2026-08-06 Q50; the bullet's rule is unchanged and previously
  named no messaging item because none was declared)*.
- **No second clock for the messaging floor.** The statutory messaging window is evaluated on the
  tenant's timezone, the same clock the send hour is read on (F1-10, F1-15, owner ruling
  2026-08-06 Q58) — there is no per-recipient evaluation, no per-market evaluation alongside it,
  and no reconciliation between two frames. The trade-off is recorded rather than compensated
  for: a customer, or a tenant, sitting outside the tenant's own timezone is judged against the
  tenant's clock. *(Non-goal recorded by the pass applying Q58; before the ruling the window's
  clock was §6's open F1-Q4, so no second clock could be excluded.)*
- **No market-conditional product behavior.** Modules never branch on a market name; they
  consume pack data. A capability a market cannot support degrades by the product's defined
  paths (e.g. no voice ruleset → outbound voice disabled, F1-16).
- **No tenant market/currency migration path** in this release: one currency per tenant,
  assigned at creation (F1-07). Recorded, not designed.
- **IN state-specific utility application packets** are out of v1: the site carries its
  utility selection (F1-53), blockers attribute the wait, the checklist tracks the
  application; packets are a post-launch document-template family (docs/12 CG-3, DESIGN-FOR —
  trigger: post-launch template work on the existing render pipeline).
- **This document does not re-specify owning mechanics:** the compliance-gate mechanism
  (M07), billing lifecycle/dunning (M12), money-path ledgers (M11), catalog resolution (M01),
  the project machine (M08), rendering (F3), staleness (F8).

## 6. Open questions

Mirrored into `registers/open-questions.md`.

- **F1-Q1 — RESOLVED (owner ruling 2026-08-04, Q6).** The ≤30 s disclosure question is
  answered by the **tiered disclosure law** now recorded at F1-36(d): at IN launch the agent
  opens naturally with **no proactive AI mention**; four hard floors are non-negotiable
  product law (never claims to be human · never denies being AI when asked, honest answer
  plus immediate human offer · instant human handoff · full transcription); the
  proactive-disclosure line is **pack data** — IN pack OFF until TRAI's AI-caller
  identification rule binds, then auto-flips ON with owner notification (the revisit
  trigger); EU-class packs ship ON (AI Act Art. 50). `M07-10`/`M07-24`/`M07-32` carry the
  enforcement wording. → register **Q6** (decision recorded 2026-08-04).
- **F1-Q2 — RESOLVED (owner ruling 2026-08-04, Q7).** India-first commercially; the first
  foreign subscribers are billed by the Indian entity as zero-rated **export of services**
  (international gateway mode, USD/AED) — posture at `BM-40`, note in §4. A merchant-of-record
  or foreign-entity structure is revisited only at real foreign revenue (the revisit
  trigger). F1-05's per-market gate is unchanged: a new market's pack still needs its own
  privacy/residency determination before launch. → register **Q7** (decision recorded
  2026-08-04).
- **F1-Q3(a) (register `Q53`) — OPEN, raised by applying `Q50` (owner ruling 2026-08-06); not
  decided here, and *not* decided by the same day's `Q54`.** **The IN pack declares neither
  figure.** §F1.3 carries the IN *voice* floor (F1-36's 09:00–21:00 lanes) and the IN messaging
  registration regime (F1-38), but no statutory **messaging** window and no send hour; "early
  evening" is a default's description, not a time, and §5's no-invented-numbers rule and F1-25's
  owner-authors-the-values law both forbid this pass from choosing one. Until the IN pack
  declares both, `F5-68`'s send hour has no market value to resolve against — `Q54` settles
  *which clock* the hour is read on, not *what the hour is*, and the same day's `Q58` settles
  which clock the *window* is evaluated on, not *what the window is*, so nothing downstream may
  assume an IN send hour or an IN messaging window exists. This needs real regulatory data; it is an
  owner/pack-authoring act, and it needs mirroring into `registers/open-questions.md` by that
  file's owner. The floor/default classification recorded at F1-15 holds either way.
- **F1-Q3(b) (register `Q54`) — RESOLVED (owner ruling 2026-08-06, Q54).** **The hour is read on
  the tenant's timezone (F1-10), never the customer's.** The owner's reasoning is recorded at
  F1-15 with the ruling: a solar EPC's customers are local to it, so the tenant's clock and the
  customer's are the same clock in practice; the knowingly accepted consequence is that where an
  EPC does serve a customer in another timezone, the message goes at the **EPC's** evening hour.
  F1-15's default clause, §F1.2's edge cases and acceptance block, and §4's `foundations/F5` row
  all carry it. *(These two bullets replace the single "**F1-Q3 — OPEN, newly raised by applying
  `Q50`**" bullet this section carried, split so each half carries its own status — the register's
  `Q53`/`Q54` shape. Its half (b) read that "the ruling says *the customer's market timezone*;
  F1-10 makes every user-facing schedule run on the **tenant's** timezone … and this document does
  not choose between them"; the owner has now chosen, and F1-15 is amended to it. Half (a) is
  unchanged and still open. `registers/open-questions.md` `Q54` is that file's owner's to mark
  closed, and `Q53` is theirs to keep open.)*
- **F1-Q4 (register `Q58`) — RESOLVED (owner ruling 2026-08-06, Q58).** **The statutory messaging
  window is evaluated on the tenant's timezone (F1-10) — the same clock as the send hour. One
  clock, not two.** The owner's reasoning is the one given for `Q54` and is recorded again at
  F1-15 with the ruling: a solar EPC's customers are local to it, so a second clock would add
  machinery with no real-world difference. The accepted consequence, stated plainly: where an EPC
  ever serves a customer in another timezone, **both** the hour and the lawful-window check are
  evaluated on the EPC's clock rather than the recipient's; and where a tenant's own timezone
  differs from its market's default (F1-21), the market's statutory window is evaluated on that
  tenant's clock rather than the market's. **Everything else about the floor is unchanged
  (`Q50`):** the window remains a floor a tenant may narrow and never widen, and a slot falling
  outside lawful hours sends at the last lawful moment before it, never after. F1-15's floor
  clause, F1-17's clock sentence, §F1.2's edge cases and acceptance block, §4's `foundations/F5`
  row and §5's no-second-clock non-goal all carry it. *(This bullet replaces the "**F1-Q4 — OPEN,
  newly raised by applying `Q54`**" bullet this section carried, which read that `Q54` "says
  nothing about the **window** the hour sits inside", that "the configured slot falls outside
  lawful hours" and "the last lawful moment before it" therefore "have no single defined frame
  wherever a tenant's timezone differs from its market's default timezone (F1-21)", and that
  choosing "would be exactly the kind of floor-item resolution F1-17 and the conflict rule reserve
  to the owner". The owner has now chosen, and F1-15 is amended to it. The old bullet's
  observation that **at IN launch the point is moot in practice** — one market, one authored pack,
  `Asia/Kolkata` as the declared default (F1-48) — survives as an observation and was never the
  answer. `registers/open-questions.md` `Q58` is that file's owner's to mark closed.)* **This
  ruling does not close `Q53`,** and nothing here depends on a value it would supply: it settles
  *which clock* the window is read on, never *what the window is*. The IN pack still declares no
  statutory messaging window and no send hour, so at IN launch there is still no window to
  evaluate on this or any clock — see `F1-Q3`(a) above, which **stays open**.
