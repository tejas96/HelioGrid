# F-core — engineering tasks

This file dispositions every requirement row of the suite's four core documents — `docs/prd/01-product-overview.md` (OV), `docs/prd/02-personas.md` (PS), `docs/prd/04-business-model.md` (BM) and `docs/prd/foundations/F1-global-market-framework.md` (F1) — under the task-id prefix **T-FCORE-**. This bucket owns no screens: its build tasks are the market-pack framework and its eight keys, the India pack's data, the market price-book law and the India book, and the commercial configuration contract (meters, tiers, billing-state vocabulary) that `docs/prd/modules/M12-platform-billing.md` consumes. Every other row in the bucket is either a suite law enforced through the screens and reviews that other buckets build (see **## Laws**) or a context/positioning row realized by a named document, module or screen (see **## Realized elsewhere**). Every row appears exactly once in the **## Disposition index** at the end.

---

### T-FCORE-001 · Market pack framework — versioned pack unit, eight keys, lifecycle and validation
**Type:** engine · **Tier:** P0
**PRD rows:** F1-01, F1-02, F1-03, F1-04, F1-05, F1-06, F1-09, F1-10, F1-11, F1-12
**Requirements (verbatim):**

- **F1-01** (P0) — **A market pack is the versioned unit of market configuration.** The source defines it whole: "Market pack = rules + catalog + templates + locale data, versioned as one unit" — covering (product-facing) the tax model, subsidy/incentive model, compliance ruleset and calendar, certification schemes, payment-mode and mandate vocabularies, project-stage labels and skippable stages, document checklists, catalog scope and price-book currency, document templates and standards labels, and locale data (currency display, holiday calendar, default units); and (engineering-facing) rules data consumed by the design engines — electrical ladders, design-temperature bands, setbacks, wind zones, net-metering conventions. The governing law is carried verbatim: **"No market fact is ever a module-level constant."**
- **F1-02** (P0) — **The eight pack keys are the suite-wide interface.** Every market pack supplies all eight: `pack.tax` · `pack.subsidy` · `pack.calling-rules` · `pack.payment-rails` · `pack.certification-schemes` · `pack.formats` · `pack.data-rights` · `pack.price-book` (§F1.2 defines each). Module and foundation PRDs reference these keys — never a market's own terms; a module that needs a market fact states *which key supplies it*, and the fact itself lives in that market's pack section here. **Demo/seed content (owner ruling 2026-08-04, Q19):** beside the eight rules keys, every market pack ships **one demo project as pack content** (IN: the Pune-class rooftop, `M01-27`), versioned with the pack per F1-11 — pack content, not a ninth rules key.
- **F1-03** (P0) — **What never varies per market, and what swaps.** Invariant across all markets: the geometry/electrical kernels ("ladders are data, math is not"), the provenance/honesty system (F8), the one money path, the tenancy model, the design system (F7), and the canonical state machines with their market-neutral value names. Swapped per market as pack data and adapters: rules data, catalog scope and price book, tax and subsidy models, locale data, telephony adapter, payment adapter — and every display label.
- **F1-04** (P0) — **Launching a market = authoring its pack.** A new market is configuration, not a product change: its pack (all eight keys) plus market adapters behind the existing vendor-neutral capability ports. No module changes, no new module behavior, no market-conditional code paths in product requirements.
- **F1-05** (P0) — **The new-market gate.** Before any tenant exists in a new market, that jurisdiction's own privacy/residency determination must exist (it becomes the market's `pack.data-rights`); before subscriptions are sold there, a supplier-of-record decision must be made — **ruled for the interim (owner ruling 2026-08-04, Q7)**: the first foreign subscribers are billed by the Indian entity as zero-rated export of services (§4 note; `BM-40`), with merchant-of-record/foreign-entity revisited at real foreign revenue. A pack without both determinations is not launchable.
- **F1-06** (P0) — **Global-ready, India-only launch.** The launch state is exactly one authored pack — India (§F1.3) — on global-ready structure: global-safe schemas and vocabularies, India-only rails. The named expansion candidates (Gulf/MENA, SEA/Africa, EU/UK/AU, US) are future markets, not v1 scope; each enters only through F1-05's gate and F1-04's lifecycle.
- **F1-09** (P0) — **Market vocabularies are open sets; state machines keep neutral names; labels come from the pack.** Document checklists, payment modes, mandate types and comparable market vocabularies are open sets validated against the tenant market's pack — never closed enumerations baked into the product. Canonical state machines (the 9-stage project chain, blocker parties, subscription states) keep market-neutral value names everywhere; what a user reads on screen is the pack's label for that value.
- **F1-10** (P0) — **User-facing schedules are tenant-timezone-aware, never fixed to any market's clock.** Every user-facing repeatable behavior (wake-ups, follow-up queues, calling windows) runs on the tenant's timezone; platform-internal sweeps may stay fixed-clock. The pack supplies the market's *default* timezone (F1-21); the tenant's timezone is tenant data.
- **F1-11** (P0) — **Pack data is versioned; revisions are data updates; computed outputs pin the version they used.** A pack revision (a subsidy-model change, a ruleset change, a label change) is a versioned, dated data update — never a product release. Money- and engineering-bearing outputs pin the pack/rules version they computed with, so a pack revision self-stales older outputs under F8's staleness law rather than silently rewriting them; sent proposals keep their versions forever.
- **F1-12** (P0) — **Packs are platform-authored and never tenant-editable; tenants configure above the floor, within it.** No tenant surface edits pack data. Where a pack item is a statutory floor (calling rules, tax duties, data rights), tenant configuration operates strictly within it — "Tenants configure within the law, not around it"; there is no override flag. Where a pack item is a default (labels' rendering language, thresholds, templates), tenant configuration may adjust within the pack's stated bounds.

**DONE WHEN:**

- Given any module or foundation PRD in this suite, when its body needs a market fact, then the body names a pack key and this document's pack section carries the fact (F1-01, F1-02).
- Given a new market launch, when it is prepared, then the work is authoring the eight keys plus adapters, and the privacy determination and supplier-of-record decision exist before tenants and sales respectively (F1-04, F1-05).
- Given any state-machine value, when it renders to a user, then the value name is market-neutral and the rendered label is the pack's (F1-03, F1-09).
- Given a pack data revision, when it is published, then it is a versioned data update, prior computed outputs self-stale rather than change, and no product release occurs (F1-11).
- Given a statutory-floor pack item, when any tenant configuration touches its domain, then the configuration can narrow within the floor but no setting, role or flag can cross it (F1-12).
- Given a tenant in any timezone, when a user-facing scheduled behavior fires (wake-ups, queues, windows), then it fires on the tenant's clock, never a fixed market clock (F1-10).
- Given the launch state, when markets are enumerated, then India is the only authored pack and expansion regions appear nowhere as v1 scope (F1-06).
- Given any authored market pack, when it is validated, then all eight keys are present, each satisfying its F1.2 rows, with empty content only where F1-14/F1-16/F1-19 permit (F1-13 through F1-27).

---

### T-FCORE-002 · Market-generic money and scheme-neutral tax (pack.tax) + the IN GST instance
**Type:** engine · **Tier:** P0
**PRD rows:** F1-07, F1-08, F1-13, F1-28, F1-29, F1-30, F1-31
**Requirements (verbatim):**

- **F1-07** (P0) — **Money is market-generic on every surface.** Amounts are generic values, never named for any one currency's units; every money-bearing document root stamps its currency at creation; line items inherit it; sums reconcile to the currency's minor unit. **One currency per tenant**, server-assigned from the tenant's market at tenant creation — no mixed-currency tenant exists. Every tenant-set money threshold (e.g. the customer-link accept-challenge threshold, F5) is denominated in the tenant's currency.
- **F1-08** (P0) — **Tax is scheme-generic.** The product carries tax as scheme-neutral structure — percentage fields, a taxes breakdown, tenant tax registrations — never as columns or copy named for one market's tax law. The pack's `pack.tax` declares the scheme and its strategy (`per_line_rate` or `document_level`); statutory extras attach as scheme-tagged data, present only where the scheme requires them.
- **F1-13** (P0) — Every pack declares its **tax scheme**: scheme identifier; tax strategy (`per_line_rate` or `document_level`, per F1-08); the rate model and how rates attach to catalog/proposal lines and to platform invoices; which tenant tax-registration types exist and when they are captured; jurisdiction/place-of-supply rules where the scheme splits tax by place; the scheme-tagged statutory extras that attach to invoices (and the thresholds that activate them); the platform's supplier-of-record posture for subscription sales in that market; and the statutory retention period for financial/tax records (consumed by `pack.data-rights`' erasure carve-out, F1-24).
- **F1-28** (P0) — The IN tax scheme is **GST**, strategy `per_line_rate`; the tenant tax-registration type is `IN_GST`. All platform prices are **ex-GST**; platform SaaS subscriptions and overage add-ons carry **SAC 998434 (cloud/SaaS) at 18% GST**.
- **F1-29** (P0) — **The platform is supplier of record in IN** — our GSTIN, our GST remittance, our liability; the gateway is a gateway, not merchant-of-record. A GST-compliant invoice is generated per billing cycle carrying our GSTIN and the tenant's GSTIN (captured at conversion — B2B tenants need it for input tax credit), with **place-of-supply logic: intra-state CGST+SGST, inter-state IGST**.
- **F1-30** (P1) — **e-invoicing (IRN) threshold rule:** IRN obligations are not applicable until platform turnover crosses the ₹5-crore threshold; the gateway does not file IRNs. When crossed, IRN/acknowledgement/QR data attaches to invoices from then on — **nothing is backfilled**; the threshold is validated at each financial-year close.
- **F1-31** (P0) — **The tenant-side money path is GST-native end to end:** proposal money carries per-line GST percentages with the document-level breakdown; the locked BOM money math (margin-below-GST, pre-GST pro-rata discount) and the reconciliation law (BOM ↔ proposal ↔ tranches ↔ payments, to the paise) run on this scheme. The mechanics are M05/M06/M11's; the scheme facts are this pack's.

**DONE WHEN:**

- Given any tenant, when it is created, then exactly one currency is assigned from its market, every money-bearing document stamps it, and sums reconcile to its minor unit (F1-07).
- Given any tax-bearing structure or surface, when tax is stored or rendered, then it is scheme-neutral — strategy and statutory extras come from the pack, and no field or copy is named for one market's tax law (F1-08).
- Given the platform invoice surface, when a market's scheme requires statutory extras, then they attach as scheme-tagged data and appear on no other market's invoices (F1-13).
- Given an IN tenant's platform invoice, when a cycle is billed, then it carries our GSTIN, the tenant's GSTIN if captured, SAC 998434 at 18%, and CGST+SGST or IGST per place of supply; and no IRN data appears below the ₹5-crore threshold (F1-28, F1-29, F1-30).
- Given an IN proposal's money block, when it is computed, then per-line GST rides each line with the document-level breakdown, and BOM ↔ proposal ↔ tranches reconcile to the paise (F1-31).

---

### T-FCORE-003 · Subsidy model framework (pack.subsidy) + the IN PM Surya Ghar computation
**Type:** engine · **Tier:** P0
**PRD rows:** F1-14, F1-33, F1-34, F1-35
**Requirements (verbatim):**

- **F1-14** (P0) — Every pack declares its **subsidy/incentive model — possibly "none"**: the eligibility dimensions (segment, capacity, component-certification requirements, geography), the computation model shipped as versioned injected configuration — computed by the product, never manually configured per tenant, so a slab/rate revision is a pack-data update (F1-11) — which certification schemes (F1-19) the subsidy path requires, and whether the canonical incentive-claim project stage applies in this market and when it is skippable. A "none" declaration makes the incentive stage skippable market-wide and removes subsidy rows from checklists and computations.
- **F1-33** (P0) — The IN subsidy model is **PM Surya Ghar** (residential rooftop): subsidy slabs are **computed** from state × capacity × DCR eligibility, shipped as **versioned injected market configuration** — never manually configured per tenant; a slab revision is a pack-data update (F1-11) and older computed outputs self-stale per F8.
- **F1-34** (P0) — **The IN subsidy path requires DCR-compliant components** (F1-44): where a proposal takes the subsidy path, a non-DCR component fails the output at the product's existing Generate-time gate (M06's mechanics; this pack supplies the rule).
- **F1-35** (P0) — The canonical incentive-claim stage **applies in IN**, labelled per F1-51, and is **skippable** for commercial projects and for projects with no incentive.

**DONE WHEN:**

- Given a proposal-affecting pack rule tying a subsidy to a scheme, when a non-conforming component sits on a subsidy-path output, then the existing gate fails it with the reason (F1-14, F1-19).
- Given a subsidy-path proposal for an IN residential customer, when the subsidy is shown, then it is computed from state × capacity × DCR under the current pack version, and a non-DCR component fails Generate with the reason (F1-33, F1-34).
- Given a project's documents for a residential IN deal, when the checklist seeds, then the 8 rows of F1-52 appear; for commercial, the subsidy row is absent (F1-52, F1-35).

---

### T-FCORE-004 · Communications-compliance ruleset key (pack.calling-rules) + the IN TRAI ruleset data
**Type:** policy · **Tier:** P0
**PRD rows:** F1-15, F1-16, F1-17, F1-36, F1-39, F1-62
**Requirements (verbatim):**

- **F1-15** (P0) — Every pack declares its **communications-compliance ruleset — voice AND messaging**: the statutory calling window and the calendar it honors; the do-not-disturb / consent regime and its data-freshness duty; opt-out semantics and honoring deadline; automated-call disclosure duty; recording and retention rules; caller-line/series routing rules (transactional vs promotional vs inbound); and messaging sender/template registration duties. The ruleset is **data** consumed by the product's non-swappable compliance-gate mechanism (M07) and by marketing/messaging surfaces (M03, M12 dunning): the mechanism is product code and never varies per market; the ruleset always does. **Amended by owner rulings 2026-08-06 (`Q50`, `Q54`, `Q58`):** the ruleset also declares the **scheduled-send hour** of each automatic transactional message (a *default* a tenant may narrow) and the **statutory messaging window** it sits inside (a *floor*). **Both are read on the tenant's timezone (`F1-10`) — one clock, never two** — the accepted consequence being that where an EPC serves a customer in another timezone, both the hour and the lawful-window check run on the EPC's clock. A slot falling outside the window sends at the last lawful moment before it, never after.
- **F1-16** (P0) — **A market with no voice ruleset in its pack cannot enable outbound voice.** Absence of `pack.calling-rules` voice content is a hard disable of outbound calling for that market's tenants — not a permissive default.
- **F1-17** (P0) — **Statutory-floor items are enforced, never merely surfaced.** The pack marks each ruleset item as *floor* (enforced by the gate; tenant configuration may only narrow — e.g. a shorter window, extra holidays) or *default* (tenant-editable above the floor). No tenant setting, and no platform support action, can configure around a floor item — there is no override flag, and a stale compliance data source fails closed on the promotional side. **Amended by owner ruling 2026-08-06 (`Q58`):** a floor item expressed in clock time is measured on the tenant's timezone (`F1-10`), the same clock its own default is read on.
- **F1-36** (P0) — **The IN statutory voice floor (TRAI/DND), enforced by the compliance gate (floor items, F1-17):** (a) **DND scrub** — don't call DND-registered numbers; the scrub cache is refreshed daily before the calling window opens; scrub data older than 24 h pauses promotional dialing **fail-closed** while transactional calls continue; (b) **the three-lane calling law (owner ruling 2026-08-04, Q30):** lane 1 — **inbound AI answering 24/7** (answering an inbound call is never window-bound); lane 2 — **unsolicited/promotional AI dials strictly 09:00–21:00 tenant-local** (statutory floor unchanged, no override), honoring the IN holiday calendar (F1-50); lane 3 — the **requested-callback lane**: the agent may dial outside the window **only** on an explicitly recorded, timestamped customer request for that time (transcript, message or rep note); the call must **open by referencing the request**; the consent trail is stored as evidence; a **single "stop" ends the lane** for that customer; the lane is product law with **per-tenant enable/disable only**. Human reps on an outside-window/registry-listed manual dial get warning-then-proceed with the "customer requested" context logged (M07's surfaces). *Activation caveat:* operator-side consent registration (DCA/DLT) may be required before lane 3 activates — it rides the activation clocks; (c) **opt-out** — a keypress or spoken "stop calling" sets do-not-call, honored within 24 h, irreversible without the customer's say-so; a complaint sets a permanent quiet flag; (d) **the tiered AI-disclosure law (owner ruling 2026-08-04, Q6 — replaces the former ≤30 s disclosure floor):** at IN launch the agent opens **naturally** ("I'm Asha from [company]") with **no proactive AI mention**; four **hard floors are retained as non-negotiable product law** — never claims to be human · never denies being AI when asked (honest answer plus an immediate human offer) · instant human handoff on request · full transcription to the timeline; the proactive-disclosure line itself is **pack data**: the IN pack ships it **OFF** and **auto-flips it ON with owner notification when TRAI's AI-caller identification rule binds** (the Q6 revisit trigger); EU-class packs ship it ON (AI Act Art. 50); (e) **recording retention 90 days** then hard delete, transcript retained.
- **F1-39** (P0) — **IN consent posture (defaults above the floor):** recording consent is captured by default and **a customer who declines recording is still served**; voice-call consent state is tracked per customer with timestamps and source, and read before every dial. The consent *records* themselves are `pack.data-rights` content (F1-58).
- **F1-62** (P0) — **The IN messaging time law: there is no statutory messaging window, and the send-hour default is 19:00 tenant-local (owner ruling 2026-08-26, `Q53`).** TCCCPR states **no hour anywhere**; the widely quoted "09:00–21:00" is an industry and operator convention, not the regulation, and it belongs to **voice** (`F1-36` lane 2), which is unaffected by this row. What TCCCPR actually defines is a **time band the recipient registers with their own access provider** — *"the Preference Register keeps the records of preferences of the customers about category of Sender … time bands and weekdays"* — enforced by the DLT platform, **never readable by this product**, and applying to **promotional traffic only**: *"BLOCK PROMO … except service and transaction type of Commercial Communications"*. Three consequences, and they are the whole rule: (a) **`pack.calling-rules` declares an EMPTY messaging window for IN** — an authored value, not a missing one, so `F1-15`'s floor/default structure is satisfied and nothing downstream waits on a value; (b) **transactional sends are unconstrained by time** — the evening-before crew message (`F5-68`) and every `M12-39` dunning rung ride the transactional lane and are never held, delayed or refused for the hour; (c) **promotional sends are constrained per recipient by DLT and the product neither models nor second-guesses that** — a carrier refusal is reported honestly (`F1-38`), never pre-empted by a guessed window. The **send-hour default is 19:00 on the tenant's timezone** (`F1-10`, per `Q54`/`Q58`): Indian households are typically home and settled, so the customer reads it and can raise a problem before the crew leaves. A tenant may **narrow** within it and never widen.

**DONE WHEN:**

- Given any market pack, when its communications ruleset is read, then voice and messaging duties sit in the one `pack.calling-rules` key and every item carries an explicit floor-or-default classification (F1-15, F1-17).
- Given a market whose pack carries no voice ruleset, when a tenant in that market attempts to enable outbound voice, then the capability is unavailable — disabled, not defaulted (F1-16).
- Given a statutory-floor ruleset item, when tenant configuration edits its domain, then only narrowing succeeds and no path exists to cross the floor (F1-17).
- Given any IN unsolicited promotional agent call, when it is attempted, then it dials only inside 09:00–21:00 tenant-local on a non-holiday, only past a fresh DND scrub, opens naturally without any claim to be human, and the recording is deleted at 90 days with the transcript retained (F1-36).
- Given a recorded, timestamped customer request for a callback at a time outside the window, when the agent dials at that time, then the call opens by referencing the request, the consent trail is stored as evidence, and a single "stop" ends the requested-callback lane for that customer (F1-36 lane 3, owner ruling 2026-08-04 Q30).
- Given any IN agent call where the customer asks whether they are speaking to an AI, when the agent responds, then it answers honestly and immediately offers a human — and on no call does the agent claim to be human (F1-36d hard floors, owner ruling 2026-08-04 Q6).
- Given TRAI's AI-caller identification rule binding, when the IN pack data updates, then proactive disclosure auto-flips ON and the owner is notified (F1-36d).
- Given a customer who declines call recording, when the call proceeds, then they are still served and the declination lands as a consent record with timestamp and source (F1-39, F1-58).
- Given the IN pack, when its messaging window is read, then it is an authored EMPTY window and no code waits on a value for it (`F1-62`).
- Given a transactional send in IN — the evening-before crew message or any dunning rung — when its moment arrives, then it goes at the configured hour and is never held, delayed or refused for time of day (`F1-62`).
- Given a promotional send in IN, when it is dispatched, then the product enforces no window of its own and a carrier or DLT refusal is reported honestly rather than pre-empted by a guessed one (`F1-62`, `F1-38`).
- Given the IN pack's send-hour default, when it is read, then it is 19:00 on the tenant's timezone, and a tenant may narrow within it but never widen (`F1-62`, `F1-10`).

*Note:* `F1-15` makes the ruleset DATA and the compliance gate that enforces it `M07`'s non-swappable mechanism, so the lines above divide the same way. This task proves the ones a pack and its pure rules can prove: the one key with every item classified, the hard disable of outbound voice, narrowing without a path across a floor, the authored EMPTY messaging window, the unheld transactional send and the 19:00 default. The lines that describe an agent's own conduct — the dialled promotional call, the requested-callback lane, the AI-honesty floors, the disclosure auto-flip and its owner notification, serving a customer who declines recording — are proven when `M07`'s gate lands and read this pack; the consent RECORD they land in is `pack.data-rights` (`F1-58`, `T-FCORE-009`), and honest reporting of a carrier refusal is `F1-38` (`T-FCORE-005`).

---

### T-FCORE-005 · IN telephony and messaging compliance routes — 140-series CLI + DLT-registered SMS
**Type:** integration · **Tier:** P0
**PRD rows:** F1-37, F1-38
**Requirements (verbatim):**

- **F1-37** (P0) — **IN caller-line series routing:** CLI series distinguish transactional vs promotional vs standard inbound traffic; **promotional outbound uses the 140-series RTM route** — the 1600-series is closed to non-BFSI entities.
- **F1-38** (P0) — **IN messaging compliance (DLT):** SMS traffic uses only DLT-registered entity, header and templates — unregistered traffic is carrier-blocked. Template/entity registration is a third-party approval clock: it gates **activation, not scope** (code ships; activation follows the clock, with documented fallbacks). Platform→tenant messaging (dunning SMS, notifications) rides the same registered-template rule.

**DONE WHEN:**

- Given IN promotional outbound, when a CLI is selected, then it is a 140-series identity, never a 1600-series one; and given any platform SMS, when it is sent, then it uses a DLT-registered entity/header/template (F1-37, F1-38).

*Note:* these are the last two `pack.calling-rules` items of `F1-15`, so the fields sit on `CallingRulesPack` beside the rest of the ruleset rather than in a key of their own. The done-when line divides where `F1-15` divides it: the market RULE and the registration DUTY are pack data and are proven here, while selecting a line and carrying a send are the consuming modules' — `M07`'s telephony framework and number provisioning (`T-M07-029`, `T-M07-017`), `M12`'s dunning and `M03`'s marketing sends. `F1-38`'s registration clock gates activation, not scope: no account is opened by this task, and a tenant's own registered entity and headers are tenant data, never pack data.

---

### T-FCORE-006 · Payment rails pack key (pack.payment-rails) + the IN rails: mandate ladder, mandate types, payment modes, reference adapters
**Type:** integration · **Tier:** P0
**PRD rows:** F1-18, F1-40, F1-41, F1-42, F1-43
**Requirements (verbatim):**

- **F1-18** (P0) — Every pack declares its **payment rails, as data plus adapters**: (a) for platform billing — the mandate-type vocabulary, the mandate/collection ladder per tier band and billing cycle (which rail is primary, which falls back, where a one-shot invoice replaces a mandate), and any per-debit caps or rail constraints that shape the ladder; (b) for tenant collections — the market's payment-mode vocabulary (validated as an open set per F1-09), with manual modes always available; (c) the market's reference rail adapters, stated vendor-neutrally as capability requirements with the v1 vendor as reference implementation (subscription billing, payment links, OTP delivery, telephony); and (d) any payment-data localisation constraints the market imposes and how the market satisfies them. Rail policy lives in the market's adapter layer, never in generic product behavior; adding or swapping a rail is an adapter change (F1-04).
- **F1-40** (P0) — **The IN platform-billing mandate ladder:** UPI AutoPay primary — every monthly tier price sits under the **₹15,000 per-debit cap** — with card e-mandate fallback; e-NACH / invoice for Enterprise. **Any yearly total (incl. 18% GST) exceeds the cap** (even the entry tier: ₹19,990 + GST = ₹23,588), so yearly billing is a single payment link/invoice per year, no mandate; renewal is a fresh invoice. The mandate is collected at conversion, never at signup; pre-debit notifications before each charge are the gateway's duty (product dunning copy may reference them, builds nothing).
- **F1-41** (P0) — **IN mandate-type vocabulary:** `upi_autopay` and `card_emandate` are the validated mandate types for self-serve tiers; e-NACH rides the Enterprise/invoice route.
- **F1-42** (P0) — **IN tenant-collections payment modes:** `upi` / `neft` / `cheque` / `cash` / `payment_link` — the open-set vocabulary tenant payment records validate against (F1-09). Manual modes are always available; the payment-link rail is an accelerator, never a dependency ("cash is still king in EPC").
- **F1-43** (P0) — **IN reference rail adapters (vendor-neutral capabilities, v1 vendors as reference implementations):** subscription billing and tenant payment links — Razorpay; OTP delivery — MSG91; telephony and speech for the voice capability — Exotel + Sarvam (capability requirements themselves are M07's). **Payment-data localisation (RBI) is satisfied by construction:** a licensed Indian payment aggregator holds all payment instruments; the platform never touches instruments or tenant funds.

**DONE WHEN:**

- Given a market's rails declaration, when platform billing or tenant collections run, then mandate types, the rail ladder and payment modes validate against the pack, and the manual collection path is available regardless of rail state (F1-18).
- Given an IN self-serve monthly subscription, when the mandate is set up at conversion, then it is UPI AutoPay with card e-mandate fallback; and given any yearly total, then it is a single invoice/payment link, no mandate (F1-40, F1-41).
- Given an IN tenant recording an offline payment, when the mode is chosen, then the set is exactly upi / neft / cheque / cash / payment_link (F1-42).
- Given IN subscription billing, payment links or OTP delivery, when a rail is exercised, then a vendor-neutral capability is served by the IN reference adapter and no payment instrument ever touches the platform (F1-43).

---

### T-FCORE-007 · Certification schemes and standards labels (pack.certification-schemes) + the IN ALMM/DCR entries
**Type:** policy · **Tier:** P0
**PRD rows:** F1-19, F1-20, F1-44, F1-45
**Requirements (verbatim):**

- **F1-19** (P0) — Every pack declares **which certification schemes the market requires** — a scheme-keyed set, possibly empty. Catalog item specifications carry scheme-keyed certifications; component pickers badge compliance per the schemes the tenant's market declares; and where a pack rule ties a scheme to a money path (e.g. a subsidy path requiring a scheme, F1-14), the product fails the affected output at its existing gate rather than silently passing. An empty scheme set means no badges and no scheme gates — never an error.
- **F1-20** (P1) — Every pack declares the **engineering-standards labels** its documents carry — the standards family named on electrical documents, drawing sheets and design ladders. The ladders themselves are pack rules data (F1-01); the *labels* printed on outputs are pack-declared so no module names a standards body.
- **F1-44** (P0) — **IN declares two schemes: ALMM and DCR.** Platform catalog items carry MNRE ALMM list references and DCR flags as the IN entries of the scheme-keyed certifications structure; component pickers badge ALMM/DCR compliance for IN tenants; the subsidy path consumes DCR per F1-34.
- **F1-45** (P1) — **IN engineering-standards labels: the IS/IEC family** (with CEA requirements where drawings demand them) — the standards labels printed on electrical documents, SLD ladders and drawing sheets for IN designs.

**DONE WHEN:**

- Given a proposal-affecting pack rule tying a subsidy to a scheme, when a non-conforming component sits on a subsidy-path output, then the existing gate fails it with the reason (F1-14, F1-19).
- Given an IN component picker on a subsidy-relevant design, when items render, then ALMM and DCR badges appear from the scheme-keyed certifications (F1-44).
- (F1-20 and F1-45 carry no Given/When/Then lines in the PRD; the requirement rows above are their acceptance.)

---

### T-FCORE-008 · Formats and display-vocabulary pack key (pack.formats) + the IN locale, label, checklist and DISCOM data
**Type:** policy · **Tier:** P0
**PRD rows:** F1-21, F1-22, F1-46, F1-47, F1-48, F1-49, F1-50, F1-51, F1-52, F1-53
**Requirements (verbatim):**

- **F1-21** (P0) — Every pack declares its **locale and format data**: currency symbol, grouping rule (including compact notation), and minor unit; digit and script rules; date style; the market's default timezone (a default only — F1-10) and holiday calendar; the phone-number specification (country code, national format, and the OTP-destination allowlist state for that market's rollout); and default measurement units. F3 owns the single rendering implementation of each of these; the pack owns the values.
- **F1-22** (P0) — Every pack declares its **display vocabularies and labels** for the canonical machines and market documents: project-stage labels and the skippable-stage set; blocker-party labels; the project document checklist (rows, and per-segment omissions); and payment-mode display names. Modules render these labels against their market-neutral values (F1-09) and never define their own.
- **F1-46** (P0) — **Currency format: INR (₹), Indian grouping — lakh/crore — in every locale** (₹4,52,471; compact ₹92L, ₹1.4 Cr), minor unit paise (two decimals). This is the IN pack's number format consumed by F3's single money-formatting function on web, mobile, PDFs and voice-agent text alike.
- **F1-47** (P0) — **Digits and scripts:** digits are always Latin 0–9, in every IN locale including documents; Hindi and Marathi render in **Devanagari** — correct conjunct shaping is a commercial-document requirement (capability F3's; the script requirement is this pack's fact).
- **F1-48** (P0) — **Dates and calendar:** date style "12 Mar 2026"; default tenant timezone **Asia/Kolkata** (a default per F1-10); the **IN holiday calendar** is the pack calendar the calling window (F1-36) and schedule defaults honor.
- **F1-49** (P0) — **Phone specification: +91**, E.164 identity; the OTP-destination allowlist is **+91 by default**, with other country codes enabled per market rollout — a switch, not a code change.
- **F1-50** (P1) — **Units: metric default**; per-user m/ft preference stands, and procurement quantities stay metric regardless (F3's law; the default is this pack's).
- **F1-51** (P0) — **IN stage and blocker labels** for the canonical machines: `utility_inspection` → **"DISCOM inspection"**; `incentive_claimed` → **"Subsidy claimed"**; blocker party `utility` → **"DISCOM"**. Skippable-stage set: `incentive_claimed` (per F1-35). DISCOM names, like brand names, are never translated.
- **F1-52** (P0) — **IN project document checklist (8 rows):** signed proposal · advance receipt · net-metering application · DISCOM approval · subsidy application & sanction · commissioning certificate · warranty documents · handover pack — **the subsidy row omitted for commercial projects**. Seeding and statuses are M08's mechanics; the row set is this pack's.
- **F1-53** (P0) — **DISCOM-aware states:** the IN pack supplies the utility directory — states and their DISCOMs — that site records select from (M04/M08 surfaces), and the honest wait-attribution framing the customer link renders against DISCOM waits (e.g. net-metering approval "applied 15 Aug, typically 3–6 weeks"). State-specific application packets are a post-launch template family (§5).

**DONE WHEN:**

- Given any rendering of currency, dates, phone numbers, stage labels, checklists or payment-mode names, when it displays, then the values come from the pack's `pack.formats` declarations and no module defines its own (F1-21, F1-22).
- Given any money figure in any IN locale, when it renders, then it uses ₹ with lakh/crore grouping and Latin digits; and given an IN project board, when stages render, then the labels read "DISCOM inspection" / "Subsidy claimed" over the market-neutral values (F1-46, F1-47, F1-51).
- Given a project's documents for a residential IN deal, when the checklist seeds, then the 8 rows of F1-52 appear; for commercial, the subsidy row is absent (F1-52, F1-35).
- Given an IN date, phone or OTP surface, when it operates, then dates read "12 Mar 2026" style on an Asia/Kolkata default, phones are +91 E.164, and OTP delivery honors the +91 allowlist (F1-48, F1-49).
- Given an IN site record, when its utility is selected, then the choice comes from the pack's state → DISCOM directory, and a utility blocker renders honest wait attribution on the customer link (F1-53).
- (F1-50 carries no Given/When/Then line in the PRD; the requirement row above is its acceptance.)

---

### T-FCORE-009 · Data-rights pack key (pack.data-rights), erasure/anonymisation workflow + the IN DPDP determination
**Type:** engine · **Tier:** P0
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

*Note:* the in-app grievance-contact surface of F1-59 rides the app shell (SCR-SHELL-01, `docs/ux/briefs/SCR-SHELL-01-app-shell.md`); this task owns the breach-notification duty and the determination/consent/erasure data and workflow.

**DONE WHEN:**

- Given a market pack presented for launch, when it is validated, then its `pack.data-rights` key carries the jurisdiction's determination — roles, residency, rights map, breach duties and required consent records (F1-23, with F1-05).
- Given any market, when tenant-level read or export is attempted in any billing state, then it works; and when erasure is requested, then the anonymisation workflow exists with the pack's retention carve-outs honored (F1-24).
- Given the IN privacy determination, when it is consulted, then the platform's fiduciary/processor roles, the DPA terms and the residency rules read exactly as F1-54 and F1-55 declare them (F1-54, F1-55).
- Given a data-principal export request, when support fulfils it, then JSON/CSV of all rows keyed to the principal is delivered within 30 days; and given an erasure, then anonymisation runs with financial records retained for the statutory period (F1-56, F1-57, F1-32).
- Given a customer who declines call recording, when the call proceeds, then they are still served and the declination lands as a consent record with timestamp and source (F1-39, F1-58).
- Given a breach event, when duties trigger, then the Data Protection Board and affected principals are notified and the grievance contact is published in-app (F1-59).

---

### T-FCORE-010 · Market price-book law (pack.price-book) + the India book
**Type:** engine · **Tier:** P0
**PRD rows:** F1-25, F1-26, F1-27, F1-60, F1-61, BM-13, BM-26, BM-37, BM-38, BM-39, BM-40, BM-41
**Requirements (verbatim):**

- **F1-25** (P0) — Every market authors its **own price book**: per-tier price points for every offered cycle, in the market's currency; bundle sizes; overage rates; metered add-on prices (including tracked field seats per DD7 and marketing sends); and the market benchmarks the book was set against. The book is market data with an owner: **price points for a new market are never invented by this suite or derived by formula — they are owner/market decisions**, absent until made.
- **F1-26** (P0) — **No FX-converted pricing, ever.** No price in any market's book is ever produced by converting another market's book at an exchange rate — not as a default, not as a starting draft, not as a fallback. A market without an authored book has no prices and cannot sell (F1-05's supplier-of-record gate rides with this).
- **F1-27** (P0) — **Plan prices are per-currency rows; a new market adds rows, zero product change.** The billing structure is global-safe: each market's book lands as that market's price rows against the same plan structure, with provider-neutral gateway references — consistent with one currency per tenant (F1-07).
- **F1-60** (P0) — **The IN book is the source-derived first book**, in INR, ex-GST, canonical in `04-business-model.md` (one definition per fact): tier anchors ₹1,999 / ₹3,999 / ₹9,999 monthly + Enterprise custom, each with a yearly variant, and the v1 caps, bundles and overage rates as `04` defines them; benchmarked **under Reslink and ARKA at equivalent capacity**. This key records the book's existence, currency, tax posture and benchmark basis; no number is defined twice.
- **F1-61** (P0) — **V2 metered add-ons are priced in the IN book:** the per-tracked-seat field-workforce price (DD7) and per-channel marketing-send bundles (design spec §8) are IN-book rows. **Owner ruling 2026-08-04 (Q1/Q17):** the rows now carry the owner's **draft** values — tracked seat ≈₹99/seat/mo beyond the tier's included allowance (Starter 0 / Growth 3 / Pro 10 / Enterprise custom); send bundles Starter 500 / Growth 2,000 / Pro 10,000 per month, overage ≈ WhatsApp ₹1.5 · SMS ₹0.35 · email ₹0.10 — canonical numbers at `BM-41`, every one **draft pending rate-card verification** (`BM-17`/`BM-26`) before the meters can be sold.
- **BM-13** (P0) — **Every tier bills monthly or yearly.** Yearly = pay for 10 months, get 12 — two months free (~17% saving), one collection per year. All prices are exclusive of the market's tax scheme (F1-13; IN: ex-GST at the scheme rate, F1-28). Which rail collects which cycle is market-pack data, not product law (IN: monthly rides the mandate ladder, every yearly total exceeds the mandate cap and is collected as a single payment link/invoice — F1-40).
- **BM-26** (P1) — **COGS provenance caution, carried verbatim:** the AI-detection COGS figures behind BM-17's floors rest on **unverified vendor-rate estimates** ("confirm official rate cards"). No COGS figure inherited from source is presented as verified anywhere in the suite; the ≥40% overage floor is computed against *worst-case* COGS precisely because the estimates are unverified. The same caution applies to the V2 meters until each market's book records verified channel rates — the owner's 2026-08-04 ruling (Q1) recorded **draft** add-on numbers in BM-41 under exactly this caution: they stay draft, and the meters stay unsellable, until the rate cards are verified. (Owner ruling 2026-08-04, Q1.)
- **BM-37** (P0) — **Every market has its own price book; a market without one has no prices and cannot sell.** The book law is F1's (F1-25: per-tier prices per cycle in the market's currency, bundle sizes, overage rates, metered add-on prices, benchmarks — owner/market decisions, absent until made; F1-26: no FX-converted pricing, ever, in any form). This document consumes that law and owns the **contents** of the first book (BM-41). Framework rules in this document never carry a currency; book instances always do.
- **BM-38** (P0) — **Launching a market is adding price rows, never changing the product.** Plan prices are per-currency rows against the same four-tier structure with provider-neutral gateway references; a new market's book lands as new rows — zero product change, consistent with one currency per tenant (F1-07, F1-27).
- **BM-39** (P0) — **The benchmark law.** Every book records the market benchmarks it was set against, and prices **under the market's incumbents at equivalent capacity, always** — margin comes from COGS discipline (BM-17), never from list price. Benchmarks are book data with provenance (which competitor page, which date, which currency); a book whose benchmarks are stale is re-validated, not trusted.
- **BM-40** (P0) — **Tax posture rides the market's tax scheme.** All book prices are exclusive of the market's tax scheme (F1-13); for platform subscription sales the platform's supplier-of-record posture is a per-market declaration in `pack.tax`. **IN instance:** prices ex-GST; the platform is the supplier of record — our registration, our remittance, our liability; the gateway is a gateway, never merchant-of-record (F1-29; invoice mechanics M12). **Foreign-subscriber posture (owner ruling 2026-08-04, Q7):** India-first commercially; the first foreign subscribers are billed by the Indian entity as zero-rated **export of services** (international gateway mode, USD/AED settlement); a merchant-of-record or foreign-entity structure is revisited only at real foreign revenue — that revenue is the revisit trigger, and each non-IN market's own launch gate (`F1-05`) still applies.
- **BM-41** (P0) — **The India book — the source-derived first instance (IN book; every number below is IN-market data, not the generic model).** Identified by `F1-60`/`F1-61`; canonical here. **Tier prices (INR, ex-GST):** Starter **₹1,999/mo · ₹19,990/yr** — Growth **₹3,999/mo · ₹39,990/yr** — Pro **₹9,999/mo · ₹99,999/yr** — Enterprise **custom, anchored ₹24,999+/mo**, annual contract (owner-set anchors ~₹2k/~₹4k/~₹10k). **Capacity + counts:** single-design ceiling 50 kW / 500 kW / 5 MW / 100 MW (utility: blocks/zones, trackers, terrain); proposals 30 / 300 / 1,500 / unlimited per month; active projects 10 / unlimited / unlimited / unlimited; users unlimited on all four. **Bundles + overage:** AI detections 30 / 100 / 400 / custom per month, then ₹10 each; voice minutes PAYG ₹6/min on Starter and Growth, 400 min/mo bundled then ₹6/min on Pro, custom bundles + BYO number on Enterprise; storage 10 / 50 / 250 GB / custom. **Trial caps:** 25 detections · 15 voice minutes · 5 GB. **Service terms:** support in-app / in-app + WhatsApp / priority + onboarding call / named contact; Enterprise adds the BM-15 commercial arrangements. **Benchmarks (recorded per BM-39):** Reslink India INR page (owner-supplied, authoritative — Basic ₹60,000/yr at 50 kW · Pro ₹85,000/yr at 500 kW, 1,000 proposals · Premium ₹1,20,000/yr at 5 MW · Enterprise custom) and ARKA per-org pricing; priced under both at every rung — Starter-yearly 67% under Basic, Growth-yearly 53% under Pro, Pro-yearly 17% under Premium with a voice bundle no competitor has, and Pro's 1,500 proposals/mo beat the benchmark's 1,000. **Collection routes:** per the IN mandate ladder, F1-40 (monthly self-serve under the per-debit cap rides UPI AutoPay; Enterprise e-NACH/invoice; every yearly total exceeds the cap and is a single payment link/invoice per year). **V2 add-on prices (owner ruling 2026-08-04, Q1/Q17 — base tiers confirmed unchanged; every add-on number below is DRAFT pending rate-card verification per BM-17/BM-26):** tracked seat **≈₹99/seat/mo** beyond the tier's included allowance; **included tracked seats: Starter 0 · Growth 3 · Pro 10 · Enterprise custom**; marketing-send bundles **Starter 500 · Growth 2,000 · Pro 10,000 sends/mo**, overage **≈ WhatsApp ₹1.5 · SMS ₹0.35 · email ₹0.10 per send**. A draft add-on rate is not sellable until the owner verifies the channel/seat rate cards against worst-case unit COGS (the ≥40% floor, BM-17) — verification is the Q1 revisit trigger.

**DONE WHEN:**

- Given a new market's book, when prices are sought before the owner authors them, then no price exists — nothing converts, nothing defaults (F1-25, F1-26).
- Given the IN price book, when any tier price renders, then the number comes from `04-business-model.md`'s book — nowhere else defines it; and when a tracked-seat or marketing-send price is sought, then it resolves from the IN book's add-on rows and nowhere else (F1-60, F1-61).
- Given the IN book, when any tier price, cap, bundle, overage rate or trial cap renders anywhere in the product or the suite, then the number comes from BM-41 (via M12's entitlements) and nowhere else (BM-09, `F1-60`).
- Given any framework row in this document, when it is read for a second market, then it contains no INR amount, no IN benchmark and no IN rail — those exist only in BM-41 and F1 §F1.3 (BM-10, BM-37).
- Given the two V2 add-on slots, when the IN book is read today, then each slot carries the owner's draft value (seat ≈₹99/mo with the 0/3/10/custom included ladder; send bundles 500/2,000/10,000 with ≈₹1.5/₹0.35/₹0.10 overages) flagged draft-pending-rate-card-verification (BM-41, `F1-61`; owner ruling 2026-08-04, Q1/Q17).
- Given a second market's authored and owner-approved book, when that market launches, then the book lands as per-currency price rows against the same four-tier structure with provider-neutral gateway references and zero product change (BM-38).
- Given any book price and its market's tax scheme, when a subscription invoice is produced, then the price is ex-tax with the scheme applied per the pack's declaration and the supplier-of-record posture recorded there (BM-40; IN instance: ex-GST, the platform as supplier of record per F1-29).
- Given the yearly cycle on any tier, when its price is checked against the book's monthly price, then it follows the pay-10-get-12 principle (BM-13) — with the authored book value governing where the source's own book deviates: the IN book's Pro yearly is the source's own ₹99,999, ₹9 above the ten-month formula's ₹99,990, and is carried as-is (BM-41). The formula is the sizing principle; the book row is the price.
- Given the IN pricing page and any competitor row it cites, when the equivalent-capacity comparison is checked, then the price is lower and the claim traceable to BM-41's recorded benchmarks (BM-39, BM-44).
- Given any COGS-derived figure or V2 meter rate, when it is presented anywhere in the product, then it is never labelled verified, the overage floor is computed against **worst-case** COGS, and draft add-on numbers stay draft and unsellable until that market's book records verified channel rates (`BM-26`).
- Given a new market's price book, when its rows are authored, then they land as that market's per-currency price rows against the same plan structure with provider-neutral gateway references, and no product code changes (`F1-27`).

---

### T-FCORE-011 · Meter definitions and platform cost policy — five meters, COGS floors, absorbed costs, quota containment
**Type:** engine · **Tier:** P0
**PRD rows:** BM-17, BM-18, BM-19, BM-20, BM-21, BM-22, BM-23, BM-24, BM-25
**Requirements (verbatim):**

- **BM-17** (P0) — **The metered-COGS law.** Every meter whose unit carries real cost is sold as a **bundle allowance per tier plus published per-unit overage**, and the overage rate in every market's book sits **≥40% above the worst-case unit COGS** in that market. Bundles are sized so **no tier can go margin-negative** at 100% bundle burn, and the self-serve target is gross margin ≥80% at typical utilisation. This law applies to all five meters, including the two V2 meters — a marketing-send or tracked-seat price that violates it is an invalid book row.
- **BM-18** (P0) — **Voice minutes** — the all-in cost of an outbound/AI-inbound agent call (telephony + speech + language processing + compliance scrub + compute), metered per completed-call minute. Sold as tier bundles with per-minute overage on bundled tiers and pay-as-you-go per-minute pricing where a tier carries no bundle; rates and bundle sizes are book data (IN: BM-41). A call bills only what the ledger records (mechanics M12).
- **BM-19** (P0) — **AI roof detections** — automated roof-outline detection from imagery, metered per detection that returns a result (failures never bill — cited, M12). Sold as tier bundles with per-detection overage; rates per book. Manual outlining is always available and never metered — a tenant out of bundle can always keep working by hand.
- **BM-20** (P0) — **Storage** — object storage for the tenant's photos, documents and generated PDFs, sold as a per-tier ceiling (GB) with the gauge measured, not counted (nightly snapshot — cited, M12). Reads and exports are never storage-gated (§04.5); enforcement touches new uploads only, with soft headroom (cited, M12).
- **BM-21** (P0) — **Marketing sends** (V2 meter) — outbound marketing messages across the channels where the platform itself carries a per-send cost: **WhatsApp, SMS and email**. Sold as per-channel bundles with per-send overage; bundle sizes, rates and the billable unit per channel (where an upstream prices by conversation rather than message, the book names the unit it bills) are market-book data — the IN book carries the owner's draft bundle sizes and overage rates pending rate-card verification (BM-41; owner ruling 2026-08-04, Q1). Channels where spend settles tenant-direct with the ad network (e.g. paid social campaigns) are not platform meters. Marketing sends ride the market's messaging-compliance rules (IN: DLT-registered templates, F1-38); compliance is never a paid feature.
- **BM-22** (P0) — **Tracked field seats (V2 meter) — the sole seat-counting exception in the product.** Active field-worker tracking is a **per-tracked-seat monthly add-on**, because live tracking carries a real per-worker COGS (continuous location ingestion, processing and retention) and the industry prices it per worker. The per-seat bundle covers: **live location, route timeline, geofencing, movement history, activity playback** (M09 behavior). The **owner toggles tracking per employee**; only toggled-on employees are billed, as **tracked-seat-months** in the usage ledger (month-fraction mechanics are M12's). The per-seat price is market-book data — IN: **draft ≈₹99/seat/mo beyond the tier's included allowance (Starter 0 / Growth 3 / Pro 10 / Enterprise custom), pending rate-card verification** (owner ruling 2026-08-04, Q1/Q17; BM-41). Location ingestion for tracked seats is covered by the seat price — there is no second ingestion meter. No other capability is ever priced this way, and this row is the only place the product counts seats (`OV-30`).
- **BM-23** (P0) — **The included boundary of field workforce:** **site check-in/out and visit logging are included in every tier for every employee** — they are part of the core visit workflow, not part of the tracked-seat add-on, and they never require a tracked seat. An EPC that never buys a tracked seat still gets full check-in/out and visit-logging capability across its whole team.
- **BM-24** (P0) — **The absorbed-cost law.** Costs too small or too structural to bill honestly are absorbed and fair-use capped, never metered to the tenant: **OTP delivery** (login and link-verification messages) and **field-location ingestion outside the tracked-seat add-on** (the check-in/out and visit-logging events of BM-23). Absorbed lines are still measured internally for cost visibility (mechanics M12), and fair-use enforcement — if ever exercised — follows §04.5's soft-block law, never a silent degradation.
- **BM-25** (P0) — **Third-party cost containment is a platform duty, never a tenant surface.** Externally priced calls (solar imagery, AI extraction, speech) are server-proxied with per-tenant metering and quotas so a runaway tenant cannot torch margin; free public sources (the energy source of record) cost nothing and are never billed. None of this appears as tenant configuration.

**DONE WHEN:**

- Given any tier in any market's book, when every meter — voice minutes (BM-18), AI roof detections (BM-19), storage (BM-20) and marketing sends (BM-21) — is burned to 100% of its bundle and beyond, then per-unit overage bills at the book's published rate and that rate is ≥40% above the market's worst-case unit COGS (BM-17); a detection that returned no result and a manual roof outline bill nothing (BM-19), and storage enforcement touches new uploads only (BM-20).
- Given a tenant driving an externally priced capability at runaway volume, when per-tenant quotas engage, then containment happens platform-side with no tenant configuration surface involved, and any tenant-visible pause follows §04.5's soft-block honesty (BM-25).
- Given a tenant with zero tracked seats, when a field employee checks in and logs a visit, then the action succeeds on every tier and no usage line is billed (BM-23, BM-24).
- Given a tenant with three employees toggled on, when the cycle's usage ledger is rolled up, then tracked-seat-months reflect exactly those three toggles and no other people-count appears anywhere in the bill (BM-22, BM-04).

---

### T-FCORE-012 · Commercial structure vocabularies — tier names, capacity axis, meter list, billing-state names
**Type:** engine · **Tier:** P0
**PRD rows:** BM-11, BM-12, BM-16, BM-33
**Requirements (verbatim):**

- **BM-11** (P0) — **Four tiers, fixed names: Starter · Growth · Pro · Enterprise.** The names are market-neutral structure and suite-wide vocabulary — every market's price book prices these same four tiers in its own currency (F1-25), every entitlement is keyed to them (M12), every report that segments by plan uses them (M13). No market renames, adds or removes a tier; a market that cannot serve a tier's capacity has no book for it (which is a book-authoring decision, not a product change).
- **BM-12** (P0) — **The tier axis is capacity, in four kinds:** (a) the **single-design kW ceiling** — the industry's own capacity ladder, adopted deliberately so buyers can compare rung-for-rung; (b) **per-cycle creation counts** (proposal creations per month; an active-project count on the entry tier); (c) **metered bundles** (§04.3 allowances per meter); (d) **storage**. The ceiling is a billing entitlement enforced at save/generate boundaries — never a clamp inside the design engine and never a mid-edit interruption (mechanics M12/M05).
- **BM-16** (P0) — **The canonical meter set — five meters, a closed list:** **voice minutes** · **AI roof detections** · **storage** · **marketing sends** · **tracked field seats**. These are the only usage lines a tenant can ever be billed for. OTP delivery and field-location ingestion are absorbed costs (BM-24), not meters. Adding, removing or renaming a meter is a change to this document first; M12's usage ledger and usage screens, and M13's usage reporting, consume exactly this list.
- **BM-33** (P0) — **The billing-state vocabulary — six names, fixed here:** `trialing` · `active` · `past_due` · `halted` · `expired` · `cancelled`. `past_due` carries a 7-day grace with two phases (days 0–3 full function with banner; days 4–7 metered features paused); `expired` (trial ended unconverted) behaves exactly as `halted`; `cancelled` runs to the paid period end, then behaves as `halted`. These names are the interface M12's lifecycle machine implements and M13's reporting segments by; transitions, timers, dunning and reactivation mechanics are `modules/M12`'s.

**DONE WHEN:**

- Given a market book, when its tier rows are read, then they price exactly the four BM-11 tiers and no others.
- Given M12's usage ledger and M13's usage reporting, when billable usage lines are enumerated, then they are exactly the five meters of BM-16 — voice minutes, AI roof detections, storage, marketing sends, tracked field seats — and no other billable line exists (BM-16).
- Given a tenant in `halted`, `expired` or post-period `cancelled` — three of the six fixed billing-state names (BM-33) — when any user reads, searches, exports, opens dashboards or opens the billing screen — or the tenant's customer opens any link — then it works (BM-32, BM-35); and when M12's lifecycle machine or M13's reporting names a state, then it is one of BM-33's six names and no other (BM-33).
- Given any tier, when its limits are read, then they are expressed only on the four capacity kinds — single-design kW ceiling, per-cycle creation counts, metered bundles and storage — and the kW ceiling is enforced at save/generate boundaries, never as a clamp inside the design engine and never as a mid-edit interruption (`BM-12`).
- Given a tier name, when a subscription is collected, then it maps to one of `TIER_BANDS` — `self_serve` or `enterprise` — and the mandate ladder is read for that band (`F1-18`). **The map lands here**, because it needs the four `BM-11` names: `T-FCORE-006` authored the band axis and the ladder it keys, and deliberately left the map out, having no tier vocabulary to write it against.

---

### T-FCORE-013 · The trial contract — 14 days, full-feature, book-defined caps, payment at conversion, soft expiry
**Type:** policy · **Tier:** P0
**PRD rows:** BM-28, BM-29, BM-30
**Requirements (verbatim):**

- **BM-28** (P0) — **The trial is 14 days, full-feature, every tier capability, no payment instrument at signup.** Signup stays phone + OTP + company name; the trial is the product's only non-paying state and its only acquisition motion (no free tier, BM-03). Trial usage is capped to bound COGS; the cap values are market-book data (IN: 25 AI roof detections · 15 voice-agent minutes · 5 GB storage, BM-41).
- **BM-29** (P0) — **Payment is collected at conversion, never at signup.** The mandate or payment method is established when the owner converts to a paid tier — the rail that collects it is market-pack data (IN: F1-40). No card wall ever guards the trial.
- **BM-30** (P0) — **Trial expiry is a soft block, never a cliff.** An unconverted trial becomes `expired` — terminal as a trial but permanently reactivatable by paying (mechanics M12): the tenant's data is retained indefinitely, read + export + customer links keep working (§04.5), and creating new records pauses. No trial data is ever deleted for non-conversion.

*Note:* the trial's cap values are IN-book data owned by T-FCORE-010 (BM-41); this task owns the trial's length, its full-feature guarantee, the no-instrument-at-signup rule and the expiry posture. Lifecycle transitions, nudges and the support-grantable extension are `docs/prd/modules/M12-platform-billing.md`'s mechanics.

**DONE WHEN:**

- Given a new signup, when the trial starts, then no payment instrument exists on file and every tier capability is available within the book's trial caps (BM-28, BM-29).
- Given a trial that converts on day 9, when entitlements are checked, then paid entitlements apply immediately and payment was collected at that moment, not before (BM-29; mechanics M12).
- Given a trial that never converts, when day 14 passes, then the tenant enters `expired`, keeps read + export + customer links, and can reactivate by paying at any later time (BM-30).
- Given a new signup that never pays, when its states are enumerated over any span of time, then the only non-paying states are the 14-day `trialing` and its `expired` aftermath — no path into a perpetual free tier exists anywhere in the product (BM-03).

---

### T-FCORE-014 · The soft-block contract — state capability matrix, cap enforcement, usage transparency, the field carve-out
**Type:** policy · **Tier:** P0
**PRD rows:** BM-27, BM-32, BM-34, BM-35, BM-36
**Requirements (verbatim):**

- **BM-27** (P0) — **Usage transparency is law, not UX polish.** The tenant-visible usage screen shows exactly the rollups the product enforces and bills from — same numbers, no smoothing — labelled with period and provenance, and a bundle's consumption is disclosed **before** any gate fires (the 80% pre-warning). This is `F8-33`'s law; M12 owns the screen and the ledger. Accruing overage is shown in the tenant's currency with the market's grouping as it happens (cited, M12).
- **BM-32** (P0) — **The soft-block law.** The product soft-blocks, never hard-blocks. In **every** billing state without exception: **read everything** (search, dashboards included), **export everything** (CSV, data export, existing proposal PDFs, invoices), **customer links keep working** (view AND respond, progress pages — the tenant's customer is never punished for the tenant's billing state), and **billing screens with pay/upgrade/reactivate stay available**. No data is ever deleted for non-payment — deletion happens only through the data-rights erasure workflow (F1-24). Blocked mutations fail with an honest state banner and a route to reactivate (mechanics M12).
- **BM-34** (P0) — **The cap-enforcement law (soft-block at capacity).** For every capped count and ceiling: the usage screen warns at **80%** (`F8-33` — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records, and exporting **never** pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window.
- **BM-35** (P0) — **The state capability matrix** (below) is product law: which capability groups work in which billing state. M12 implements it as the billing-state gate on every mutation and may add enforcement detail; it may never move a ✓ to a block. Metered features pause only where they cost per-use money, and only from `past_due` day 4; core selling continues through the entire grace window.

  **The state capability matrix** (per state; `✓*` = within plan/trial allowance; `—` = paused or blocked with the honest banner):

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

  Matrix notes (product-level; mechanics M12): when halted, inbound agent calls degrade to a missed-call log + voicemail so no AI minutes burn (cited: `DOC16.halted-inbound-degrade` — M12/M07); engineer sign-off on already-submitted designs is never gated — it is a safety workflow (cited: `DOC16.never-gated` — M12); the blocked-mutation experience (typed error, banner, reactivate route) is M12's (`DOC16.gate.state-guard`, cited).

- **BM-36** (P0) — **The matrix never blocks the field.** A photograph already captured on a field device always uploads and reads while blocked — the block is on new mutations from the UI, never on the device's pending photo uploads (`F4-21`). The formerly open capture-past-grace edge (register Q16) is **ruled (owner ruling 2026-08-04, Q16)**: field capture works through the full grace window and pauses only at `halted`, with a mid-visit halt letting the current visit complete ("never strand a surveyor on a roof"); reads, exports and pending photo uploads stay always-on. Mechanics at `M12-27`/`foundations/F4`.

*Note:* the tenant-facing surfaces this contract is read through are other buckets' screens — the usage screen (`docs/ux/briefs/SCR-M12-04-usage-screen.md`), billing home (`docs/ux/briefs/SCR-M12-02-billing-home.md`) and the billing-state banner (`docs/ux/briefs/SCR-SHELL-06-billing-state-banner.md`). This task owns the matrix and the three laws themselves as the floor those surfaces and `docs/prd/modules/M12-platform-billing.md`'s gate may never weaken.

**DONE WHEN:**

- Given a tenant in `halted`, `expired` or post-period `cancelled` — three of the six fixed billing-state names (BM-33) — when any user reads, searches, exports, opens dashboards or opens the billing screen — or the tenant's customer opens any link — then it works (BM-32, BM-35); and when M12's lifecycle machine or M13's reporting names a state, then it is one of BM-33's six names and no other (BM-33).
- Given a capped count at 100% for 7 days, when a user attempts a new creation of that type, then it pauses with the honest banner, and reading/editing-existing/exporting still work (BM-34).
- Given photographs already captured on a field device and a tenant in any blocked state, when the device reconnects, then those photographs upload and read (BM-36); and when any enforcement design addresses new capture past the entitlement grace window, then it cites register Q16 as open rather than citing this document for a reading it does not contain (BM-36).
- Given any billing state and the matrix above, when M12's enforcement is audited row by row, then no ✓ has become a block and no block has silently widened (BM-35).
- Given any bundle at 80% consumption, when the owner opens the usage screen, then the screen already says so, before any gate has fired (BM-27 / `F8-33`).

---

### T-FCORE-015 · Grandfathering — the price-protection horizon and its forfeiture on lapse
**Type:** policy · **Tier:** P0
**PRD rows:** BM-42
**Requirements (verbatim):**

- **BM-42** (P0) — **Grandfather generously.** Repricing is a trust event — in a WhatsApp-connected market, a badly handled price change travels faster than any marketing — so existing tenants are protected by law, not by goodwill: a tenant keeps the pricing they signed up on for a **guaranteed protection horizon recorded in their market's book**; **IN book: early tenants keep launch pricing for 24 months minimum**. Repricing never applies mid-cycle, never applies retroactively, and reaches a protected tenant only after their horizon lapses — with the honest-copy discipline (`F8-34`) applying to every repricing communication. Caps and bundle *growth* (giving tenants more) may apply immediately; taking anything away rides the same horizon. **Forfeiture on lapse (owner ruling 2026-08-04, Q43):** the protection horizon is forfeited by a lapse — a tenant who goes `cancelled` or `halted` ends their launch-price guarantee, and reactivation (whether inside or after the original horizon) prices at the **current list book**. Cancellation, dunning and win-back copy must state this plainly before the lapse happens (the no-surprise rule, `F8-34`); mechanics at `M12-57`. *(Owner ruled against the standing recommendation — deliberate.)*

*Note:* the horizon value is book data (T-FCORE-010's price-book law; the IN horizon rides BM-41's book); this task owns the horizon's existence, its never-mid-cycle / never-retroactive discipline and the forfeiture-on-lapse rule. Which plan-price row an old tenant bills against, and how a lapsed horizon migrates, are `docs/prd/modules/M12-platform-billing.md`'s mechanics.

**DONE WHEN:**

- Given a tenant inside their protection horizon, when the market book is repriced, then their bill is unchanged until the horizon lapses, and they were told honestly what changes and when (BM-42).
- Given a protected tenant who cancels or is halted, when they reactivate — even inside the original horizon — then they bill against the current list book, and the cancellation/dunning copy they saw before the lapse stated the forfeiture plainly (BM-42, owner ruling 2026-08-04 Q43; `M12-57`).

---

## Laws (enforced through screens and review, no standalone build)

Each row below is carried verbatim and is followed by what enforces it. Nothing here is a separate build: every law is either a property another bucket's screens and engines must exhibit, or a discipline the PRD review applies to the suite.

### From `docs/prd/04-business-model.md` — the packaging convictions

- **BM-01** (P0) — **The EPC organisation pays. Nobody else.** One subscription per tenant, owner-administered, covering every employee. What a tenant pays for is capacity, usage counts and metered bundles on one org-level subscription — never a count of people (sole exception: BM-22).
  *Enforced by:* `docs/tasks/M12-platform-billing.md`'s one org-level subscription per tenant with Owner-only administration; review rejects any second billable relationship.
- **BM-02** (P0) — **The EPC's customer never pays the platform anything.** Two money systems exist and never mix: (1) platform SaaS billing — the tenant pays us, on our merchant account; (2) tenant customer-collections — the homeowner/factory pays the EPC through the tenant's own gateway account, funds settling EPC-direct. The platform never touches tenant funds.
  *Enforced by:* the separation between `docs/tasks/M12-platform-billing.md` (platform money) and `docs/tasks/M11-payments-collections.md` (tenant collections on the tenant's own gateway); review rejects any platform revenue line touching a tenant collection.
- **BM-03** (P0) — **Billing is in the product from the first release. Trial-only; no free tier, ever.** The v1 deferral (D38) is superseded by owner override (2026-07-24): payments, subscriptions, billing, entitlements and usage metering are core scope. A time-boxed trial exists (§04.4); a perpetually free tier does not.
  *Enforced by:* T-FCORE-013 (the trial as the only non-paying state) plus `docs/tasks/M12-platform-billing.md`'s lifecycle; review rejects any perpetual non-paying state.
- **BM-04** (P0) — **Seats are never the meter.** There is no seat-count anywhere in the price of the product (sole exception: BM-22, a cost-carrying capability add-on, not a licence). Rationale is the moat: whole-company adoption is what makes the single travelling record work, and pricing by headcount punishes exactly that behaviour in a market where EPCs employ many low-cost designers and field reps.
  *Enforced by:* T-FCORE-011's closed five-meter set (tracked field seats the sole seat-counting line) and T-FCORE-012's meter vocabulary; review rejects a second seat meter.
- **BM-05** (P0) — **Every module is in every tier. Tiers gate capacity ceilings + usage counts + metered bundles — never features** (owner-confirmed). Every feature is in every tier: CRM and projects, the full studio (shadow analysis, all obstruction types, tin-shed/metal-roof, ground mount, structures, SLD + AC/DC and earthing layouts, industrial drawing sheets, PV/energy reports, DXF/SVG/PDF export), customer links, all languages — and the V2 additions (marketing, field workforce, HR) enter under the same law. Competitors ransom capabilities into higher tiers; the pricing page says so.
  *Enforced by:* `docs/ux/briefs/SCR-M12-01-pricing-page.md` (the tier comparison states it) and `docs/tasks/M12-platform-billing.md`'s entitlements, which key only to capacity, counts and bundles; review rejects a tier-conditional capability in any module task.
- **BM-06** (P0) — **Unlimited users on every tier.** Adding a person to the tenant never changes the bill (sole exception: turning tracking ON for that person, BM-22).
  *Enforced by:* T-FCORE-010's book rows (users unlimited on all four tiers) and `docs/tasks/M12-platform-billing.md`'s invoice, which carries no headcount line.
- **BM-07** (P0) — **Caps are upgrade signals and abuse bounds, never feature ransoms.** Every cap is visible and generous, published on the pricing page and on the usage screen; outgrowing a cap IS the upgrade signal. Enforcement is soft-block with read + export always working (§04.5).
  *Enforced by:* `docs/ux/briefs/SCR-M12-01-pricing-page.md` and `docs/ux/briefs/SCR-M12-04-usage-screen.md` (every cap published on both), with T-FCORE-014's cap-enforcement contract behind them.
- **BM-08** (P0) — **A price for every EPC** (owner directive). The entry tier exists so that price is never the reason a small EPC stays on spreadsheets; the top of the range is a sales-assisted tier for utility-scale and open-access work. The reach law is `OV-17`/`OV-18`/`OV-20`; this document is where the tiers that deliver it live.
  *Enforced by:* T-FCORE-012's four-tier structure and T-FCORE-010's authored book (a self-serve entry price and a sales-assisted top rung in every market's book).
- **BM-09** (P0) — **One definition per fact.** Prices, caps and bundle sizes are defined once, in this document; `modules/M12` fixes billing mechanics only and restates no number; every other surface (pricing page, usage screens, F1's book identification) points here.
  *Enforced by:* T-FCORE-010 (the book is the single source of every number) and review: any price, cap or bundle size restated in another task or brief is a defect, and the fix is a pointer.
- **BM-10** (P0) — **Market scope law.** Every concrete number in this document is a fact of one market's price book — the India book, the source-derived first instance (§04.6) — and is marked as such. Nothing numeric here is the generic model; the framework rules (this section, §04.2 structure, §04.3 policy, §04.4 trial law, §04.5, §04.7 law, §04.8 principles) are market-neutral.
  *Enforced by:* T-FCORE-010's separation of the price-book law from the India book instance; review rejects an INR amount, an IN benchmark or an IN rail inside a framework statement.
- **BM-15** (P1) — **Enterprise commercial structure.** Enterprise is custom-priced (anchored in the market book, BM-41), sales-assisted, annual-contract, with custom bundle sizing and — as bespoke commercial arrangements — white-label options (custom domain + unbranded customer links), custom integrations / the public API surface, and BYO voice number. **Reading recorded, not silently resolved:** the source states both the never-features law (BM-05) and these Enterprise items in one document. The reading this suite carries: BM-05 governs the product's capabilities — nothing a self-serve tenant can *do inside the product* is withheld; the Enterprise items are commercial and service arrangements (re-branding of customer-facing surfaces, bespoke integration work, custom bundle economics, number provisioning) that exist only under sales-assisted contracts. If the owner rules the public API is a product capability rather than a service arrangement, it moves under BM-05 and out of this row.
  *Enforced by:* T-FCORE-010's Enterprise anchor and custom-bundle rows in the IN book, plus review: an Enterprise-only *product capability* is a defect against BM-05, while the service arrangements named here never appear as a tier gate.

### From `docs/prd/01-product-overview.md` — the product laws

- **OV-04** (P0) — The product replaces the spreadsheet-and-rekeying pipeline with **one record that travels**: CRM → survey → 3D design → proposal → no-login customer link → voice-agent follow-up → light project tracking → payments. No stage re-enters data an earlier stage already holds.
  *Enforced by:* every module task's hand-off contract (`docs/tasks/M02-crm-leads.md` → `docs/tasks/M04-survey.md` → `docs/tasks/MS-studio-a.md` → `docs/tasks/M06-proposals.md` → `docs/tasks/F5-customer-link.md` → `docs/tasks/M07-sales-execution.md` → `docs/tasks/M08-projects.md` → `docs/tasks/M11-payments-collections.md`); review rejects any screen that re-keys a value an upstream stage already holds.
- **OV-06** (P0) — The owner signs up **self-serve**, with phone number and one-time password. Nothing about acquiring the product requires a sales conversation at the entry tiers.
  *Enforced by:* `docs/ux/briefs/SCR-M01-01-sign-in.md` and `docs/ux/briefs/SCR-M01-02-company-signup.md` (phone + OTP + company name, no sales step).
- **OV-07** (P1) — Google Login is offered alongside Mobile OTP as a second authentication route. This is new in V2 and not present in the v1 source, which is OTP-only.
  *Enforced by:* `docs/ux/briefs/SCR-M01-01-sign-in.md` (both routes present on the one sign-in surface).
- **OV-08** (P0) — Mobile is **field-first and never a follow-up**: it is built in lockstep with web, carrying My Day, leads, quick-add, surveys, visits and notifications, with the studio reached through an embedded web surface.
  *Enforced by:* the mobile-first construction of every screen task in `docs/tasks/` and the studio's embedded surface in `docs/tasks/MS-studio-a.md`; review rejects a capability specified web-only without a recorded rationale.
- **OV-09** (P0) — Every screen is designed mobile-first at 375 px with **full web parity** — the small screen is the design constraint, not a reduced edition.
  *Enforced by:* the DONE WHEN clause every screen task in this suite carries — three base states plus brief-listed states at 375px and 1536px with full parity.
- **OV-21** (P0) — **Conviction 1 — the studio is the flagship, and nothing is compromised against it.** Every studio tool and every computed output survives into V2. The studio census (`docs/prd/modules/M05-studio/studio-census.md`) is the acceptance gate and never shrinks. The studio is touch-first with full parity on every surface, including 375 px mobile. When a studio requirement conflicts with a convenience elsewhere, the studio wins.
  *Enforced by:* `docs/tasks/MS-studio-a.md`, `docs/tasks/MS-studio-b.md` and `docs/tasks/MS-studio-c.md` against *retired: studio inventory* and `docs/prd/modules/M05-studio/defect-register.md`; review rejects any studio capability dropped or downgraded between passes.
- **OV-22** (P0) — **Conviction 2 — honesty is a feature.** Every user-visible number carries a provenance tier (measured / derived / estimated / assumed — exactly four, no screen invents a fifth). Money never renders while stale. Structural adequacy is never computed — an engineer signs off. Competitors sell certainty; this product sells numbers that can be defended when a customer compares three proposals. Honesty is a differentiator that is marketed, not a disclaimer that is buried.
  *Enforced by:* `docs/prd/foundations/F8-data-honesty.md`'s mechanism as built in `docs/tasks/F-platform.md`, and every screen brief that renders a number; review rejects a fifth provenance tier or a stale money figure rendered as current.
- **OV-23** (P0) — **Conviction 3 — market-config-first.** Every market fact — tax scheme, incentive model, compliance and calling rules, certification schemes, payment rails, units, number formats, stage labels, document checklists, catalog scope and currency — lives in an injected market-configuration layer, never hard-coded into a module. Launching a market is authoring its pack: configuration, not product change.
  *Enforced by:* T-FCORE-001 through T-FCORE-010 (the pack framework and its eight keys); review rejects any module-level market constant.
- **OV-24** (P0) — Conviction 3 restated for V2: **India is the first market pack, not the product's identity.** The source's India-native behaviour — GST-native money path, PM Surya Ghar subsidy slabs, DISCOM-aware project states, TRAI-compliant calling, ₹ lakh/crore grouping, EN/HI/MR interface — is documented as the complete first pack in `foundations/F1-global-market-framework.md`, and module bodies stay market-neutral and reference pack keys. Launch is India-only; the structure is global.
  *Enforced by:* T-FCORE-001 (one authored pack at launch) and the IN instance tasks T-FCORE-002 through T-FCORE-010.
- **OV-25** (P0) — Everything the source states as a price, a benchmark or a mandate mechanic is **the India market's price book**, not the generic model. No number from that book is treated anywhere in this suite as a universal product fact, and no market's prices are ever derived by currency conversion from another market's (the no-FX rule is DD6, design spec §2).
  *Enforced by:* T-FCORE-010 (the price-book law and the India book as an instance, with no FX derivation).
- **OV-26** (P0) — **The soft-block law** — The product soft-blocks, never hard-blocks. In every billing state — including halted, expired and cancelled — reading everything, searching, dashboards, export (data, CSV, existing proposal documents), the customer's own links and the billing screens with pay/upgrade/reactivate all continue to work *(Final review: "billing screens" restored — the always-works list is `BM-32`'s four items)*. Blocked mutations fail with a clear state banner and a route to reactivate. No data is ever deleted for non-payment. The EPC's customer is never punished for the EPC's billing state.
  *Enforced by:* T-FCORE-014's state capability matrix, implemented as the billing-state gate in `docs/tasks/M12-platform-billing.md` and surfaced by `docs/ux/briefs/SCR-SHELL-06-billing-state-banner.md`.
- **OV-27** (P0) — **Entitlements are the only gating** — There are no feature flags in the product. Features ship enabled. The single runtime mechanism that can stop a user from doing something they have permission to do is a billing entitlement.
  *Enforced by:* `docs/tasks/M12-platform-billing.md`'s entitlements as the sole runtime gate; review rejects any feature flag in any task.
- **OV-28** (P0) — **Capacity, not features** — Commercial tiers gate capacity ceilings, usage counts and metered bundles — never features. Every module and every capability is present in every tier. Caps are upgrade signals and abuse bounds, never feature ransoms.
  *Enforced by:* T-FCORE-012's capacity axis and T-FCORE-010's book rows; review rejects a tier-withheld capability (see BM-05).
- **OV-29** (P0) — **The organisation pays, and seats are not the meter** — One subscription per tenant, owner-administered, covering every employee. There is no per-seat pricing: per-seat pricing punishes whole-company adoption, and whole-company adoption is what makes the single travelling record work at all.
  *Enforced by:* T-FCORE-011's meter set and `docs/tasks/M12-platform-billing.md`'s one org-level subscription (see BM-01, BM-04).
- **OV-30** (P0) — **The one seat-based exception** — Active field-worker **tracking** is the single per-tracked-seat add-on in the product, because it carries a real per-worker cost. Site check-in/out and visit logging are part of the core visit workflow and are included in every tier for every employee. The owner toggles tracking per employee; the meter counts tracked-seat-months. No other capability is ever priced per seat.
  *Enforced by:* T-FCORE-011 (BM-22/BM-23 boundary) and `docs/tasks/M09-field-workforce.md`'s owner toggle; review rejects a second per-seat price anywhere.
- **OV-31** (P0) — **Phone as identity** — A phone number is the identity anchor on both sides of the product: it is the login identity for users, unique in international format, and it is the deduplication key for customers, checked on capture from every channel. Users are deactivated, never deleted.
  *Enforced by:* `docs/tasks/M01-onboarding.md` (login identity, deactivate-never-delete), `docs/tasks/M02-crm-leads.md` and `docs/tasks/M03-marketing.md` (dedupe on capture from every channel).
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
- **OV-43** (P0) — **v1 is the entire product.** There is no Launch-2, no v1.1 and no "later" bucket into which a capability can be deferred while still being counted as planned. A capability is either in v1 scope, or it is an explicit non-goal with a recorded rationale, or it is tagged as a recommendation and carried in `registers/enhancements.md`. There is no fourth category. This is a scope law and carries no schedule: the calendar the source attached to it is superseded, and every source phrase of the form "ships in the N-day build" is read throughout this suite as "in v1 scope".
  *Enforced by:* review of the whole `docs/tasks/` set — every PRD row is dispositioned into a task, a law or a realized-elsewhere pointer, and no task carries a phase, a date or a deferral bucket.
- **OV-44** (P0) — The only honest exceptions to "shipped at launch" are three, and each is named rather than open-ended: (a) capabilities whose activation waits on a third party's approval process, where the product ships complete and activation follows the third party; (b) the explicitly spec-locked exclusions recorded as non-goals in §6 below; (c) utility-scale studio enhancements that continue immediately afterwards as ongoing investment in the flagship. **1 kW to 100 MW remains a v1 commitment.**
  *Enforced by:* T-FCORE-005 (the DLT/telephony activation clocks that gate activation, not scope), the non-goals recorded in each module task, and the studio tasks' 1 kW–100 MW capacity commitment.

### From `docs/prd/02-personas.md` — the persona laws

- **PS-01** (P0) — **Role decides the home screen, not a setting.** Every persona lands on the work in front of them, not on a generic dashboard they must navigate away from; the front door is derived from what the person is, never chosen in preferences. The source calls this "the single highest-leverage UX decision in the product".
  *Enforced by:* `docs/ux/briefs/SCR-SHELL-01-app-shell.md`'s role-derived front door and each persona home brief; review rejects a preference that chooses a home screen.
- **PS-02** (P0) — The twelve personas named in §2 are the **fixed persona vocabulary of the suite**. Every module and foundation PRD names its audience from this list, using these exact names; a document that needs a thirteenth persona records the need in `registers/open-questions.md` rather than coining one.
  *Enforced by:* review of every brief's persona list in `docs/ux/briefs/`; a thirteenth persona name is a defect.
- **PS-03** (P0) — **A persona is a job; a role is the grant of access.** The two sets are deliberately different sizes, one person may hold several roles at once, and access is resolved by F2's rules — permission granted if **any** held role grants it, lead visibility taking the **widest** scope among them. No persona section in this document grants, implies or restricts a permission.
  *Enforced by:* `docs/tasks/F-platform.md`'s F2 role-union resolution; review rejects a permission grant written against a persona rather than a role.
- **PS-04** (P0) — **Every persona sits inside one of the three audiences** of `01` §2 — Owner or Employees. No persona in this suite is the EPC's customer, and no persona-level requirement may imply a customer login: the customer reaches the product through one tokenised link and never acquires an account.
  *Enforced by:* `docs/tasks/F5-customer-link.md` (no-login link) and review of every brief's persona list (see OV-32).
- **PS-05** (P1) — **One person, one home.** Someone holding several roles gets a **single** home screen — the one for their widest role, with the other roles' work composed inside it — and can switch, "not two competing home screens". A person who both sells and surveys lands on My Day with today's visits shown inside it.
  *Enforced by:* `docs/tasks/M13-dashboards.md`'s composed-home rule and `docs/ux/briefs/SCR-SHELL-01-app-shell.md`; review rejects a second competing front door.
- **PS-14** (P0) — Surveying is a **capability, not a gatekeeper**: the survey is a task assignable to anyone who holds the capability — a dedicated Survey Engineer or a Sales Executive standing on the roof — and both use one capture flow. The persona describes whose job it usually is, never who is permitted to do it.
  *Enforced by:* `docs/tasks/M04-survey.md`'s single capture flow assignable on capability, not persona.
- **PS-17** (P0) — This persona also holds **sign-off authority**: reviewing a design and approving it, or returning it with comments pinned to what is wrong. In v1 this is a separate preset (`Engineer` — "reviews and signs off designs"); in V2 it is documented as a distinct **capability of the Design Engineer persona**, and the customer never sees an unapproved design.
  *Enforced by:* `docs/tasks/MS-studio-c.md`'s sign-off flow and `docs/tasks/F5-customer-link.md`'s gate that no unapproved design reaches the customer link.
- **PS-19** (P0) — **Sign-off is a capability, and whoever performs it is not the person who drew it.** The reviewer's approval is the structural-safety record for the design, and returning a design sends it back to its author with comments attached to the specific problem. Whether the capability is granted by its own preset role or rides the Design Engineer preset is F2's decision.
  *Enforced by:* `docs/tasks/F-platform.md`'s F2 capability ruling plus `docs/tasks/MS-studio-c.md`'s reviewer-is-not-author check and return-with-pinned-comments behavior.
- **M01-07** (P0) — **Session lifetimes and revocation.** Web sessions are 30 days rolling. Mobile has no fixed maximum while the person remains active: seven full days without foreground authenticated use expires the session and requires sign-in again. Opening or using the signed-in app in the foreground resets that inactivity window; background refresh, push handling and scheduled work never reset it. Mobile API tokens remain short-lived (≤10 minutes) and renew silently while the underlying session is valid. Deactivating a user, or a user's own "sign out everywhere", kills every device's access within ≤10 minutes. The revocation surface is the Team screen (M01-19).
  *Enforced by:* `docs/tasks/M01-onboarding.md`'s T-M01-025 (auth, session & account-lifecycle engine), consumed by `docs/tasks/M04-survey.md`, `docs/tasks/M08-projects.md` and `docs/tasks/M09-field-workforce.md`. *Rehomed 2026-08-07: the Field Technician platform law formerly carried here as `PS-24` ("Mobile sessions are long-lived") was swept from `docs/prd/02-personas.md` with the offline/sync deletion — no strike note was recorded there, and the row is absent while `PS-22`, `PS-23` and `PS-25` remain. The obligation is live, and with a concrete value, at `M01-07` above; nothing about it was ever a connectivity rule.*
- **PS-27** (P0) — **The installation surface shows no commercial figures.** No price, no discount, no tranche, no margin, no customer value appears on any screen this persona sees. v1 achieved this by giving crew no screen at all — "crew sees no money because crew sees no screen"; where V2 gives them a screen, the property must be preserved by the surface itself.
  *Enforced by:* `docs/ux/briefs/SCR-M08-05-installer-job-home.md` and `docs/tasks/M08-projects.md`; review rejects any money figure on an installation surface.
- **PS-28** (P1) — **Attribution survives a crew that never signs in.** Where the checklist is run by a coordinator rather than the crew, ticks are attributed to the coordinator and an optional free-text "done by" per step records the crew member's name. This fallback is not removed when crew accounts exist, because mixed crews are the normal case.
  *Enforced by:* `docs/tasks/M08-projects.md`'s installation checklist attribution, retained alongside crew accounts.
- **PS-37** (P0) — Whatever a campaign captures becomes an ordinary lead: **the phone number is the identity and every capture dedupes on it, from every channel, every time.** A marketing-sourced enquiry that matches an existing customer surfaces as a duplicate before it is saved, not after.
  *Enforced by:* `docs/tasks/M03-marketing.md`'s capture path into `docs/tasks/M02-crm-leads.md`'s dedupe-before-save (see OV-31).

---

## Realized elsewhere

Context, positioning and persona-home rows this bucket dispositions but does not build. Each carries its verbatim text and the pointer that realizes it.

### From `docs/prd/04-business-model.md`

- **BM-14** (P1) — **Tier positioning laws** (each tier has a job): **Starter** is the "every EPC" tier — a 1–5 person residential shop runs its whole business on it, and outgrowing its caps IS the upgrade signal. **Growth** is the default recommendation past roughly 15 installs a month or the first small C&I work. **Pro** is the C&I tier, carrying the voice bundle no competitor offers at any price. **Enterprise** is for the largest single designs, open-access and utility work — sales-assisted, annual contracts. Positioning informs bundle sizing and pricing-page copy; it never creates a feature difference (BM-05).
  *Realized by:* BM-41's bundle sizing in T-FCORE-010 · `docs/prd/modules/M12-platform-billing.md`
- **BM-31** (P1) — **Trial COGS is a bounded, accepted acquisition cost.** The trial caps exist to bound the platform's worst-case spend per trial (IN book: ≈₹300–500 per trial at the BM-41 caps) — an accepted customer-acquisition component, sized by the book's cap values, never by degrading the trial experience (BM-28's "every tier capability" is not negotiable against COGS).
  *Realized by:* BM-28 (T-FCORE-013's trial contract) · BM-41 (T-FCORE-010's IN book cap values)
- **BM-43** (P1) — **Ride the market's incentive wave — by computing, not configuring.** The IN wedge is that subsidy outcomes are computed in the product (state × capacity × DCR, F1-33) while competitors make tenants configure them by hand; the product consequence is that the demo leads with a computed subsidy in the first five minutes of a first session. Generalized: a market's incentive model is pack data computed by the product (F1-14), and the pricing story leans on it wherever the market has one.
  *Realized by:* `docs/prd/modules/M01-onboarding-and-tenant-config.md` · `docs/prd/foundations/F1-global-market-framework.md` · `docs/prd/modules/M06-proposals.md`
- **BM-44** (P1) — **The competitor is the spreadsheet, not another SaaS.** Positioning and pricing assume the buyer currently pays nothing: what displaces the spreadsheet is the 30-second lead add, the sub-ten-minute remote survey-to-proposal path, and the one record that survives sales → design → costing without rekeying. The tiers are priced so that "keep using spreadsheets" is never the rational choice on price (BM-08).
  *Realized by:* BM-08 (Laws, above) · BM-41 (T-FCORE-010's IN book and its recorded benchmarks)
- **BM-45** (P1) — **Market-native compliance is a wedge, never a paid feature.** The IN depth — certification checking at design time, tax-native money path, DISCOM-aware states, registered messaging, compliant calling — is in every tier (BM-05) and is sold as the reason global tools cannot follow quickly. Generalized: pack-driven statutory depth (F1) is a GTM asset in every market and is never tiered.
  *Realized by:* BM-05 (Laws, above) · `docs/prd/foundations/F1-global-market-framework.md` (T-FCORE-001 through T-FCORE-009)
- **BM-46** (P1) — **The voice agent is the demo that closes — priced to feel included, metered so it cannot hurt margin.** The pitch leads with a live agent call; commercially the agent rides BM-17/BM-18 (bundles on the tier where it anchors the positioning, PAYG elsewhere in the IN book) so it demos as part of the product while every minute stays margin-safe.
  *Realized by:* BM-17 and BM-18 (T-FCORE-011's metered-COGS law and voice-minute meter) · BM-41 (T-FCORE-010's IN voice bundle rows)
- **BM-47** (P1) — **Trial-to-paid is the only conversion metric that matters at launch.** The channel motion (founder-led sales into EPC clusters, installer associations, distributor referrals, the demo project that makes first sessions concrete) is sales ops, not product scope — what binds the product is the metric: acquisition instrumentation and M13's reporting treat trial-to-paid conversion as the launch measure, and the trial (§04.4) is designed to maximise it honestly (full capability, honest caps, soft expiry).
  *Realized by:* `docs/prd/modules/M13-dashboards-and-reporting.md` · BM-28 (T-FCORE-013's trial contract)

### From `docs/prd/01-product-overview.md` — vision, goals and moat

- **OV-01** (P0) — HelioGrid is a multi-tenant SaaS that runs the **selling engine** of a solar EPC company — from a lead captured in under thirty seconds to a signed project with money collected. Every module in the suite exists to serve that spine or to keep it honest.
  *Realized by:* all modules M01–M13 (the selling-engine spine) — `docs/tasks/M01-onboarding.md` through `docs/tasks/M13-dashboards.md`
- **OV-02** (P0) — V2's framing is global: the world's best **mobile-first SaaS platform for solar EPC companies**, mobile-first without compromising web, global from the outset, with the 3D Design Studio as the flagship. The source's product definition is India-worded — "the selling engine of an *Indian* solar EPC company" — and OV-01 states it with that wording globalized; both readings are on the record.
  *Realized by:* informative; the global framing is carried by `docs/prd/foundations/F1-global-market-framework.md` (T-FCORE-001)
- **OV-03** (P0) — The flagship asset is a full **3D Design Studio** producing engineering-grade layouts, shading analysis, electrical sizing and a priced bill of materials, across a box that runs from 1 kW rooftops to 100 MW plants.
  *Realized by:* `docs/prd/modules/M05-design-studio.md` — `docs/tasks/MS-studio-a.md`, `docs/tasks/MS-studio-b.md`, `docs/tasks/MS-studio-c.md`
- **OV-05** (P0) — The buyer is the **EPC organisation**. Both residential and commercial & industrial business are first-class and both are high volume (D1); deal values in the source's India framing span roughly ₹4.5 lakh to ₹92 lakh+ — customer deal size, not platform pricing, which `04-business-model.md` owns.
  *Realized by:* `docs/prd/04-business-model.md` (BM-01's org-level subscription, T-FCORE-012's tier structure)
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
  *Realized by:* `docs/prd/modules/M06-proposals.md`, `docs/prd/modules/M05-design-studio.md`, `docs/prd/foundations/F8-data-honesty.md`
- **OV-16** (P0) — **Centralize operations** — One system of record for the EPC: leads, surveys, designs, proposals, projects, money, people and field activity in one place, with one search across them. Centralization is what makes OV-04's travelling record possible.
  *Realized by:* `docs/prd/foundations/F6-notifications-and-search.md` (one search) and all modules
- **OV-17** (P0) — **Affordable for small EPCs** — A one-to-five-person residential shop must be able to run its whole business on the product without price being the reason it stays on spreadsheets.
  *Realized by:* `docs/prd/04-business-model.md` (BM-08's entry tier; T-FCORE-010's IN book)
- **OV-18** (P1) — **Scale to enterprise** — The same product serves utility-scale work — the largest designs in the box, the widest teams, custom commercial terms and white-label customer-facing surfaces — without a separate edition or a rewrite.
  *Realized by:* `docs/prd/04-business-model.md` (BM-15's Enterprise structure) and `docs/prd/modules/M05-design-studio.md`
- **OV-19** (P0) — **Global from day one** — Market differences are configuration, never product change. "Day one" here is the brief's phrase for *from the outset* — it is an architectural commitment and carries no date, no phase and no schedule.
  *Realized by:* `docs/prd/foundations/F1-global-market-framework.md` (T-FCORE-001 through T-FCORE-010)
- **OV-20** (P0) — **A price for every EPC** (source anchor for OV-17 and OV-18) — The reach implied by OV-17 and OV-18 is source-anchored: the entry tier exists so that price is never the reason a small EPC stays on spreadsheets, and the top of the range is a sales-assisted tier for utility-scale and open-access work. The tiers themselves, their capacities and every price point live in `04-business-model.md`.
  *Realized by:* `docs/prd/04-business-model.md` (BM-08 in Laws above; the tier structure at T-FCORE-012 and the book at T-FCORE-010)
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
  *Realized by:* `docs/prd/04-business-model.md` (BM-06 unlimited users in Laws above; BM-39's benchmark law and BM-41's book at T-FCORE-010)

### From `docs/prd/02-personas.md` — the twelve personas and their home screens

Each persona-definition row is realized by that persona's F2 section and its owning module; each home-screen row is realized by the brief that specifies that home screen, where its verbatim text already lives as the specification.

- **PS-06** (P0) — The **EPC Owner** persona is the person who buys and administers the tenant — the proprietor or director of the solar EPC. Their scope is the whole business: every lead, every design, every project, every unit of money in the tenant's currency, every setting. The source states it flatly: "The business owner. Everything, always. Cannot be deleted or restricted."
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §EPC Owner
- **PS-07** (P0) — The EPC Owner's **home screen is the pipeline dashboard**, led by the honest attention list — deals stuck or aging, proposals sent and not opened, projects blocked, payments overdue — each item deep-linking to the thing itself, followed by cash collected versus due, pipeline by stage, this period against last, forecast marked a projection, and win/loss.
  *Realized by:* `docs/ux/briefs/SCR-M13-02-pipeline-dashboard.md` (screen owned by `docs/tasks/M13-dashboards.md`)
- **PS-08** (P0) — The **Sales Manager** persona runs a selling team. Their scope is the team's leads — seeing them, reassigning them, building and sending proposals against them — and explicitly **not** the company's settings, catalog or billing. Lead visibility is team-wide, one step narrower than the owner and one wider than the executive.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Sales Manager
- **PS-09** (P0) — The Sales Manager's **home screen is the same dashboard the owner lands on, scoped to their team** — the attention list, cash and pipeline restricted to the team's deals — with the team's per-rep view reachable from it. The source assigns the owner dashboard to "Owner (+ manager, team-scoped)" and makes the same screen serve both, scoped, rather than building a second one.
  *Realized by:* `docs/ux/briefs/SCR-M13-02-pipeline-dashboard.md` (screen owned by `docs/tasks/M13-dashboards.md`)
- **PS-10** (P0) — The **Sales Executive** persona sells. Their scope is their **own** leads, their own proposals and their own follow-ups — capture, qualify, book the survey, build and send the proposal, chase it, and mark it won or lost with a reason.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Sales Executive
- **PS-11** (P0) — The Sales Executive's **home screen is My Day** — "not a dashboard of numbers, a list of what to do today", in a fixed order: **overdue** first and always visually first, **today's** timed items, a separate **agent activity** block for what the automation did on their behalf, then **upcoming**. Snoozed and dormant leads are excluded until they wake.
  *Realized by:* `docs/ux/briefs/SCR-M07-01-my-day.md` (screen owned by `docs/tasks/M07-sales-execution.md`)
- **PS-12** (P0) — The **Survey Engineer** persona visits sites and captures what a design cannot be built without: roof, electrical, shading, access and structural observations — the last "observations only, never a verdict". Their visibility is limited to what they are assigned.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Survey Engineer · `docs/prd/modules/M04-survey.md`
- **PS-13** (P0) — The Survey Engineer's **home screen is today's site visits** — each with address, customer, time, distance, one-tap navigation and one-tap call.
  *Realized by:* `docs/ux/briefs/SCR-M04-06-my-visits-today.md` (screen owned by `docs/tasks/M04-survey.md`)
- **PS-15** (P0) — The **Design Engineer** persona builds the system: roof geometry, obstructions, components, panel layout, shading analysis, the single-line diagram and the priced bill of materials, plus the variants a customer needs to choose between. In v1 vocabulary this is the `Designer` preset — source wording "builds designs and quotes", read as **proposals** per R1's naming law — with assigned-only visibility.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Design Engineer · `docs/prd/modules/M05-design-studio.md`
- **PS-16** (P0) — The Design Engineer's **home screen is designs awaiting work** — the queue of surveys handed over and designs in progress, with the blocking gaps named per item.
  *Realized by:* T-MS-375 (`docs/tasks/MS-studio-c.md`) — brief `docs/ux/briefs/SCR-MS-02-design-queue.md`
- **PS-18** (P0) — Where a person holds sign-off, their **home screen carries the sign-off queue — designs awaiting review, oldest first** — composed into the one home rather than presented as a second front door (`PS-05`).
  *Realized by:* T-MS-375 (`docs/tasks/MS-studio-c.md`) — brief `docs/ux/briefs/SCR-MS-02-design-queue.md`
- **PS-20** (P0) — The **Project Manager** persona owns a won deal from signature to handover: moving it through the stage chain, keeping the document checklist complete, naming blockers with the party responsible, requesting the payment each completed stage makes due, and keeping the customer's progress view honest.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Project Manager · `docs/prd/modules/M08-projects.md`
- **PS-21** (P0) — The Project Manager's **home screen is their projects ordered by days-in-stage, blockers first** — each card showing customer, size, value, days in the current stage, payment collected against payment due, and the blocker flag with who is being waited on.
  *Realized by:* `docs/ux/briefs/SCR-M08-01-project-board.md` (screen owned by `docs/tasks/M08-projects.md`)
- **PS-22** (P0) — The **Field Technician** persona is the employee whose working day is a sequence of places rather than a desk: site visits, service calls, deliveries and checks, with check-in and check-out at each, an activity timeline behind them and attendance derived from the day they actually worked.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Field Technician · `docs/prd/modules/M09-field-workforce.md`
- **PS-23** (P1) — The Field Technician's **home screen is their route today** — the assigned stops in order, each with address, customer, window, distance, one-tap navigation and one-tap call, plus their current check-in state.
  *Realized by:* `docs/ux/briefs/SCR-M09-02-my-day-route.md` (screen owned by `docs/tasks/M09-field-workforce.md`)
- **PS-25** (P0) — The **Installation Team Member** persona is the crew who physically install the system: working the installation checklist — foundation, legs, rafters, purlins, modules, stringing, balance of system — derived from the structural model, ticking steps as they are completed and attaching photos as evidence.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Installation Team Member · `docs/prd/modules/M08-projects.md`
- **PS-26** (P1) — The Installation Team Member's **home screen is today's installation** — the assigned job, its checklist with progress, the site's access constraints and the photos expected — and nothing else.
  *Realized by:* `docs/ux/briefs/SCR-M08-05-installer-job-home.md` (screen owned by `docs/tasks/M08-projects.md`)
- **PS-29** (P0) — The **HR/Admin** persona keeps the people side of the company correct: inviting and onboarding employees, keeping their records and documents current, tracking attendance and leave, and deactivating people cleanly when they leave. The scope is SME-weight — only what supports EPC operations, without enterprise HR complexity.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §HR/Admin · `docs/prd/modules/M10-hr-lite.md`
- **PS-30** (P2) — The HR/Admin's **home screen is people today** — invitations pending or expired, joiners part-way through onboarding, today's attendance exceptions, leave awaiting a decision, and employee documents needing attention (scope per M10).
  *Realized by:* `docs/ux/briefs/SCR-M10-01-people-today-queue.md` (screen owned by `docs/tasks/M10-hr-lite.md`)
- **PS-31** (P0) — The **Finance** persona owns money correctness: the collection schedule each project inherits from its proposal's payment terms, recording what has been received against which tranche with its mode and receipt, keeping revenue honest as projects change or cancel, and holding the tenant's side of tax and invoicing per the market pack.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Finance · `docs/prd/modules/M11-payments-and-collections.md`
- **PS-32** (P1) — The Finance persona's **home screen is money due** — tranches due now and overdue by project, receipts waiting to be recorded, and the period's collections against what was expected — with every figure obeying the money-never-stale rule.
  *Realized by:* `docs/ux/briefs/SCR-M11-01-finance-home.md` (screen owned by `docs/tasks/M11-payments-collections.md`)
- **PS-33** (P0) — The **Operations** persona keeps the whole portfolio moving: every project's blockers seen together and attributed to a party, aging visible across the board, document and stage hygiene enforced, and the field workforce's day visible as a whole. Their unit of work is the portfolio, where the Project Manager's is one project.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Operations · `docs/prd/modules/M08-projects.md`, `docs/prd/modules/M09-field-workforce.md`
- **PS-34** (P1) — The Operations persona's **home screen is blockers by party, oldest first** — everything waiting on us before everything waiting on someone else — with aged projects by days-in-stage beneath it and the field team's current day alongside.
  *Realized by:* `docs/ux/briefs/SCR-M13-03-operations-home.md` (screen owned by `docs/tasks/M13-dashboards.md`)
- **PS-35** (P0) — The **Marketing** persona runs demand generation: campaigns across the channels the brief names — email, messaging, social and SMS — capturing the enquiries those campaigns produce and feeding them into the sales pipeline as leads that dedupe like any other.
  *Realized by:* `docs/prd/foundations/F2-roles-and-permissions.md` §Marketing · `docs/prd/modules/M03-marketing.md`
- **PS-36** (P1) — The Marketing persona's **home screen is live campaigns and what they captured** — each campaign with its channel, its state and the enquiries it produced, plus captured leads not yet triaged into the pipeline, and whatever campaign-and-channel reporting M03 defines.
  *Realized by:* `docs/ux/briefs/SCR-M03-01-campaign-list.md` (screen owned by `docs/tasks/M03-marketing.md`)

---

## Disposition index

| Row | Disposition |
|---|---|
| OV-01 | realized-by: all modules M01–M13 (the selling-engine spine) |
| OV-02 | realized-by: informative; global framing carried by `docs/prd/foundations/F1-global-market-framework.md` |
| OV-03 | realized-by: `docs/prd/modules/M05-design-studio.md` |
| OV-04 | LAW |
| OV-05 | realized-by: `docs/prd/04-business-model.md` |
| OV-06 | LAW |
| OV-07 | LAW |
| OV-08 | LAW |
| OV-09 | LAW |
| OV-10 | realized-by: `docs/prd/modules/M07-sales-execution.md`, `docs/prd/modules/M06-proposals.md`, `docs/prd/foundations/F5-customer-link.md`, `docs/prd/modules/M13-dashboards-and-reporting.md` |
| OV-11 | realized-by: `docs/prd/modules/M13-dashboards-and-reporting.md` |
| OV-12 | realized-by: informative (a design goal in every module) |
| OV-13 | realized-by: `docs/prd/modules/M07-sales-execution.md` |
| OV-14 | realized-by: `docs/prd/modules/M09-field-workforce.md` |
| OV-15 | realized-by: `docs/prd/modules/M06-proposals.md`, `docs/prd/modules/M05-design-studio.md`, `docs/prd/foundations/F8-data-honesty.md` |
| OV-16 | realized-by: `docs/prd/foundations/F6-notifications-and-search.md` (one search) and all modules |
| OV-17 | realized-by: `docs/prd/04-business-model.md` |
| OV-18 | realized-by: `docs/prd/04-business-model.md`, `docs/prd/modules/M05-design-studio.md` |
| OV-19 | realized-by: `docs/prd/foundations/F1-global-market-framework.md` |
| OV-20 | realized-by: `docs/prd/04-business-model.md` |
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
| OV-42 | realized-by: `docs/prd/04-business-model.md` |
| OV-43 | LAW |
| OV-44 | LAW |
| PS-01 | LAW |
| PS-02 | LAW |
| PS-03 | LAW |
| PS-04 | LAW |
| PS-05 | LAW |
| PS-06 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §EPC Owner |
| PS-07 | realized-by: T-M13-002 — `docs/ux/briefs/SCR-M13-02-pipeline-dashboard.md` |
| PS-08 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Sales Manager |
| PS-09 | realized-by: T-M13-002 — `docs/ux/briefs/SCR-M13-02-pipeline-dashboard.md` |
| PS-10 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Sales Executive |
| PS-11 | realized-by: T-M07-001 — `docs/ux/briefs/SCR-M07-01-my-day.md` |
| PS-12 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Survey Engineer · `docs/prd/modules/M04-survey.md` |
| PS-13 | realized-by: T-M04-006 — `docs/ux/briefs/SCR-M04-06-my-visits-today.md` |
| PS-14 | LAW |
| PS-15 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Design Engineer · `docs/prd/modules/M05-design-studio.md` |
| PS-16 | realized-by: T-MS-375 (`docs/tasks/MS-studio-c.md`) — brief `docs/ux/briefs/SCR-MS-02-design-queue.md` |
| PS-17 | LAW |
| PS-18 | realized-by: T-MS-375 (`docs/tasks/MS-studio-c.md`) — brief `docs/ux/briefs/SCR-MS-02-design-queue.md` |
| PS-19 | LAW |
| PS-20 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Project Manager · `docs/prd/modules/M08-projects.md` |
| PS-21 | realized-by: T-M08-001 — `docs/ux/briefs/SCR-M08-01-project-board.md` |
| PS-22 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Field Technician · `docs/prd/modules/M09-field-workforce.md` |
| PS-23 | realized-by: T-M09-002 — `docs/ux/briefs/SCR-M09-02-my-day-route.md` |
| PS-24 | *removed 2026-08-07 — swept from `docs/prd/02-personas.md` with the offline/sync deletion (no strike note recorded there). The long-lived-mobile-session law is live at `M01-07` (Laws → persona laws, above; built at T-M01-025 in `docs/tasks/M01-onboarding.md`)* |
| PS-25 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Installation Team Member · `docs/prd/modules/M08-projects.md` |
| PS-26 | realized-by: T-M08-005 — `docs/ux/briefs/SCR-M08-05-installer-job-home.md` |
| PS-27 | LAW |
| PS-28 | LAW |
| PS-29 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §HR/Admin · `docs/prd/modules/M10-hr-lite.md` |
| PS-30 | realized-by: T-M10-001 — `docs/ux/briefs/SCR-M10-01-people-today-queue.md` |
| PS-31 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Finance · `docs/prd/modules/M11-payments-and-collections.md` |
| PS-32 | realized-by: T-M11-001 — `docs/ux/briefs/SCR-M11-01-finance-home.md` |
| PS-33 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Operations · `docs/prd/modules/M08-projects.md`, `docs/prd/modules/M09-field-workforce.md` |
| PS-34 | realized-by: T-M13-003 — `docs/ux/briefs/SCR-M13-03-operations-home.md` |
| PS-35 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Marketing · `docs/prd/modules/M03-marketing.md` |
| PS-36 | realized-by: T-M03-001 — `docs/ux/briefs/SCR-M03-01-campaign-list.md` |
| PS-37 | LAW |
| BM-01 | LAW |
| BM-02 | LAW |
| BM-03 | LAW |
| BM-04 | LAW |
| BM-05 | LAW |
| BM-06 | LAW |
| BM-07 | LAW |
| BM-08 | LAW |
| BM-09 | LAW |
| BM-10 | LAW |
| BM-11 | T-FCORE-012 |
| BM-12 | T-FCORE-012 |
| BM-13 | T-FCORE-010 |
| BM-14 | realized-by: BM-41 (T-FCORE-010) · `docs/prd/modules/M12-platform-billing.md` |
| BM-15 | LAW |
| BM-16 | T-FCORE-012 |
| BM-17 | T-FCORE-011 |
| BM-18 | T-FCORE-011 |
| BM-19 | T-FCORE-011 |
| BM-20 | T-FCORE-011 |
| BM-21 | T-FCORE-011 |
| BM-22 | T-FCORE-011 |
| BM-23 | T-FCORE-011 |
| BM-24 | T-FCORE-011 |
| BM-25 | T-FCORE-011 |
| BM-26 | T-FCORE-010 |
| BM-27 | T-FCORE-014 |
| BM-28 | T-FCORE-013 |
| BM-29 | T-FCORE-013 |
| BM-30 | T-FCORE-013 |
| BM-31 | realized-by: BM-28 (T-FCORE-013) · BM-41 (T-FCORE-010) |
| BM-32 | T-FCORE-014 |
| BM-33 | T-FCORE-012 |
| BM-34 | T-FCORE-014 |
| BM-35 | T-FCORE-014 |
| BM-36 | T-FCORE-014 |
| BM-37 | T-FCORE-010 |
| BM-38 | T-FCORE-010 |
| BM-39 | T-FCORE-010 |
| BM-40 | T-FCORE-010 |
| BM-41 | T-FCORE-010 |
| BM-42 | T-FCORE-015 |
| BM-43 | realized-by: `docs/prd/modules/M01-onboarding-and-tenant-config.md` · `docs/prd/foundations/F1-global-market-framework.md` · `docs/prd/modules/M06-proposals.md` |
| BM-44 | realized-by: BM-08 (LAW) · BM-41 (T-FCORE-010) |
| BM-45 | realized-by: BM-05 (LAW) · `docs/prd/foundations/F1-global-market-framework.md` |
| BM-46 | realized-by: BM-17, BM-18 (T-FCORE-011) · BM-41 (T-FCORE-010) |
| BM-47 | realized-by: `docs/prd/modules/M13-dashboards-and-reporting.md` · BM-28 (T-FCORE-013) |
| F1-01 | T-FCORE-001 |
| F1-02 | T-FCORE-001 |
| F1-03 | T-FCORE-001 |
| F1-04 | T-FCORE-001 |
| F1-05 | T-FCORE-001 |
| F1-06 | T-FCORE-001 |
| F1-07 | T-FCORE-002 |
| F1-08 | T-FCORE-002 |
| F1-09 | T-FCORE-001 |
| F1-10 | T-FCORE-001 |
| F1-11 | T-FCORE-001 |
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

