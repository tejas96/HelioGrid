# Global-capable backend (India primary) — design

**Date:** 2026-08-02 · **Status:** approved in brainstorming, pending owner review of this doc
**Goal:** the backend supports global markets from day 1 while India remains the only launch
market. Concretely: every module, when its slice begins (Law 9 unchanged), authors schema,
contracts and domain logic that a second market can enter through **configuration — a market
pack — never a schema migration or column rename**. Frontend globalization is v2; nothing
here changes India v1 runtime behavior.

## Owner decisions made in brainstorming (2026-08-02)

- **D-G1 Scope:** global-*ready*, India-only launch. No second market onboards in v1.
- **D-G2 Target markets** (shape the design, none built): Gulf/MENA, SEA/Africa,
  Europe/UK/Australia, **and US/Americas** — so the tax shape must be able to represent
  document-level jurisdiction tax, not only per-line rates.
- **D-G3 Currency model:** one currency per tenant, stamped on money-bearing document
  roots at creation (same pattern as pinned proposal prices). No FX, no mixed-currency
  documents.
- **D-G4 Platform billing:** global-safe schema, India-only rails. Razorpay + GST stays the
  only implemented rail; selling outside India later also needs a supplier-of-record /
  merchant-entity decision that is owner-blocked (billable/external-account-shaped).

## Why now is cheap

`packages/db` is greenfield (empty `migrations/`, post-2026-08-01 teardown). Every India
assumption lives in frozen design (docs/04), contracts Zod, and instructions — none in
deployed tables. This design is almost entirely edits to paper plus two small code renames.
The architecture already carries the right hook: docs/02 §10's market-pack layer
(`market_rules_packs` keyed off `tenants.country_code`, injection enforced), E.164 phones,
per-user units, per-tenant timezone. This design promotes that layer from claim to law.

## 1. Market identity & the market-pack backbone

- `tenants.country_code` (ISO 3166-1, already designed) stays. Add
  **`tenants.currency_code`** (ISO 4217), server-assigned at tenant creation from the
  market. v1: `'IN'` / `'INR'` only.
- **`market_rules_packs`** (docs/04 §12, versioned, resolved most-specific-first) is the
  single home for every market fact: tax model + rates; project-stage labels and skippable
  stages; handover document checklists; payment-mode vocabulary; phone spec (calling code,
  NSN length, display grouping); compliance calendars (calling windows, DND semantics);
  incentive/subsidy models; equipment certification schemes; currency display rules
  (lakh/crore grouping is the INR entry).
- Domain law is unchanged: market config arrives as injected parameters; the pack is what
  gets injected. `COUNTRY_CALLING_CODE` / `PHONE_NSN_LENGTH`
  (packages/domain/src/auth/otp.ts, blessed by .claude/rules/contracts.md) stop being
  universal protocol constants and become the IN pack's phone spec. Wire format stays
  E.164 (already neutral).
- docs/02 §10's sentence "a new market is a new pack, zero schema change" becomes the
  definition of done for every module's schema (enforced via forward-compat, §7 below).

## 2. Money

- **DB convention** (docs/04 line 20): "Money `numeric(14,2)` INR" → "Money
  `numeric(14,3)`, scaled to the currency's minor unit". 3 dp covers KWD/BHD; per-currency
  scale (INR 2, JPY 0, KWD 3) is enforced at the contract/domain layer since `numeric`
  cannot vary scale per row. All `*_inr` columns in docs/04 (~15: leads.estimated_value,
  designs.price_total, proposal_components rates, tranches, projects.final_value, catalog
  rates, calls.total_cost, plans, invoices, targets…) rename to `*_amount`;
  `cost_estimate_paise` (docs/07 §Global rules 5, docs/16 §6) → `cost_estimate_minor`;
  `PaymentLinkPort.createLink({ amountPaise })` → `{ amountMinor, currency }`.
- **Currency stamping:** currency lives on the tenant; every money-bearing document root
  (proposal version, invoice, payment, tranche plan) stamps `currency_code` at creation.
  Line items inherit from their root.
- **Wire type:** `inrAmountSchema` (packages/contracts/src/common.ts) → `amountSchema` —
  decimal string, fraction digits validated against the payload's document-level
  `currency_code`. Still the one shared money definition.
- **Formatter:** the planned `formatInr` (packages/domain/CLAUDE.md roadmap; named in
  packages/i18n/CLAUDE.md NEVER list) is renamed before it exists to
  `formatMoney(amount, currency, locale)`. The ban on raw `Intl` currency formatting
  stays; the shared formatter remains the only path.
- **Law rewording** (CLAUDE.md §7 + AGENTS.md): "reconcile to the paisa" → "reconcile to
  the currency's minor unit"; "₹ uses Indian grouping in every locale" → "the tenant's
  currency renders with its market's grouping rules in every locale — for INR that is
  lakh/crore, never a locale-default separator". India behavior unchanged; it becomes the
  IN instance of the rule instead of the rule.

## 3. Tax

- **Business documents:** per-line `gst_pct` (proposal_components,
  tenant_catalog_items/overrides — docs/04) → `tax_pct` (nullable). The proposal money
  block (docs/04 proposal_versions snapshot) gains a document-level **`taxes[]`**
  breakdown: `[{scheme, label, rate_pct?, amount}]`. India v1: the single GST line. The
  market pack declares the strategy: `per_line_rate` (IN) or `document_level` (future US).
  Rationale: proposal snapshots are immutable once sent; a flat per-line rate cannot
  represent US destination-based tax (D-G2), so the shape must exist before the proposal
  module's first migration.
- **Tenant tax identity:** `tenants.gstin` → **`tenants.tax_registrations`** JSONB array
  `[{scheme: 'IN_GST', value, validated_at}]`, Zod-validated per scheme; v1 accepts only
  `IN_GST`. Serves proposal rendering and platform-invoice ITC capture (docs/16 §7).
- **Platform invoices** (docs/04 §9, docs/16 §7): neutral core — `subtotal_amount,
  tax_amount, total_amount, currency_code, tax_breakdown jsonb` — plus scheme-tagged
  **`e_invoicing jsonb`** for statutory extras (IN: `{irn, ack_no, ack_date, qr_payload}`,
  SAC code). IRN/SAC stop being canonical column names.
- **Retention:** the GST 6+-year record-retention clock driving erasure-by-anonymisation
  (docs/08 §9) becomes a pack-supplied retention period.

## 4. Market-flow vocabularies

Two treatments, by how canonical the concept is:

- **Project state machine: one canonical pg enum stays** (re-ruling of docs/15 R2, §7
  below). Renames: `discom_inspection` → `utility_inspection`, `subsidy_claimed` →
  `incentive_claimed`. The pack supplies per-market labels ("DISCOM inspection" for IN)
  and skippable stages (incentive already is). Same machine, same transitions.
  `blockers.waiting_on` value `discom` → `utility`.
- **Market paperwork becomes pack data, not pg enums:** `project_documents.doc_type` (8
  Indian handover documents) and `project_payments.mode` (`upi`/`neft`/`cheque`/`cash`/
  `payment_link`) become text columns Zod-validated against the pack's list; India's lists
  are the IN pack's content. Stages are the product's spine; checklists and rails are each
  market's paperwork.
- **Equipment flags:** ALMM/DCR on catalog items (docs/15 R13) → generic `certifications`
  keyed by scheme; the pack declares which schemes a market requires (IN: ALMM+DCR).
- **Languages:** `uiLanguageSchema` stays the closed `en/hi/mr` enum in v1 (frontend is
  v2) and is already the single definition point; adding a locale is the docs/10 playbook.
  Only rule wording that hard-codes "EN/HI/MR" as product identity is generalized.

## 5. Platform billing (global-safe schema, India-only rails — D-G4)

- **Plans:** INR-only price columns (docs/04 §9 plans) → per-currency pricing keyed
  `(plan, currency)`; v1 rows are INR only.
- **Provider neutrality:** `razorpay_plan_id` / `razorpay_subscription_id` /
  `razorpay_event_id` → `provider` + `external_id` pairs; provider is open text, not a pg
  enum. Razorpay remains the only adapter.
- **`mandate_type`** pg enum (`upi_autopay`/`card_emandate`) → text validated in
  contracts; valid set supplied per provider/market. The UPI-cap/e-mandate routing ladder
  (docs/01, docs/16 §1 — derived from RBI/NPCI rules) is documented as IN-market policy in
  the Razorpay adapter layer above `SubscriptionBillingPort`, not generic domain logic.
- **Dunning channels** (docs/16 §9: DLT SMS template IDs, WhatsApp) become the IN pack's
  channel stack. Manual collection modes (`upi`/`neft`/`cheque`) follow §4's pack-data
  treatment.
- Forward-compat note (owner-blocked when it arrives): billing a non-India tenant requires
  a supplier-of-record / foreign tax-registration decision no schema can pre-solve.

## 6. Compliance, integrations & operations

- **ComplianceGate re-scoped, not weakened** (re-ruling of docs/15 D36; resolves the
  docs/07 §6 "no alternate adapter, ever" vs docs/02 §10 "compliance calendar in
  RulesContext" tension): the mechanism stays — a non-swappable gate every outbound call
  passes, tenants configure within the law. The gate's statutory ruleset (DND scrub,
  9am–9pm window, DLT series routing, retention) becomes per-market data from the pack;
  TRAI/DLT is the IN ruleset. A market with no voice ruleset cannot enable outbound voice.
- **Scheduling** (docs/02 §6 "times IST"): user-facing repeatable jobs (calling-window
  prep, proposal nudges, dunning) are defined tenant-timezone-aware; platform-internal
  sweeps may stay fixed-clock. v1 identical (all tenants IST).
- **Vendors stay, wording generalizes:** Exotel, Sarvam, MSG91, Razorpay, PVGIS remain
  sole adapters behind their ruled ports. Instructions naming them as the universe
  (apps/worker/CLAUDE.md "Webhook processing (Razorpay/Exotel)") reword to the port. The
  `+91` OTP allowlist is already a market switch (docs/08 §6) — kept. PVGIS ladder order
  is per-market adapter data — already fine.
- **Residency:** single Mumbai region stays (docs/02 §10's expansion path unchanged). New
  rule: onboarding a market requires a privacy/residency determination for that
  jurisdiction first. docs/08 §9's DPDP analysis is annotated as the IN determination.

## 7. Rules & instructions edits

**Laws and rules (reworded, same force):**

- `CLAUDE.md` + `AGENTS.md` lines 3–5: → "…for solar EPC companies — India primary,
  global-capable backend. Light-only v1 · EN/HI/MR UI · tenant-currency money (INR v1)."
- `CLAUDE.md` §7 (mirrored in AGENTS.md): money laws per §2 above; **one new law:**
  "Every tenant belongs to one market and one currency; market facts (tax, stage labels,
  checklists, rails, phone, compliance) resolve from versioned market packs — never
  hard-coded."
- `.claude/rules/contracts.md`: money line → "decimal string scaled to the currency's
  minor unit + document-level currency code"; protocol-constants lines → market phone spec
  injected from the pack (single-definition principle unchanged). Same edit where the block
  is restated in apps/mobile/CLAUDE.md.
- `.claude/rules/i18n.md`: currency-grouping rule per-market (INR keeps lakh/crore);
  "DISCOM names" → utility/brand proper nouns; locale list only via `uiLanguageSchema`.
- Per-package CLAUDE.md: domain (`formatInr` → `formatMoney` in roadmap), i18n (same in
  NEVER list), contracts (money line), worker (provider webhooks), api (DPDP → applicable
  privacy regime).
- `.claude/skills/qa` test-matrix: note that test data derives from the tenant's market
  pack; v1 stays India data (+91, Devanagari, paisa assertions).

**docs/15 re-rulings (approval of this doc is the ruling; log in §4 user decisions):**
R2 stage renames (neutral concepts, pack labels); D36 ComplianceGate per-market ruleset;
R13 ALMM/DCR → certification schemes; R6 OTP-at-accept threshold in tenant currency.
R3 (Exotel+Sarvam) and R4 (Razorpay both roles) stand unchanged, annotated IN-market.

**`docs/forward-compat.md` — the enforcement lynchpin.** Add a Market/Money block, binding
on every module's first migration: money columns carry currency context and reconcile to
the minor unit; tax fields are scheme-generic; market paperwork vocabularies resolve from
packs, not closed pg enums; user-facing schedules are tenant-timezone-aware; a new market
requires a residency determination. Law 9 means modules author their own schema when their
slice begins — this row is what makes §§1–6 binding rather than aspirational.

**Design docs edited (Law 8):** docs/04 (renames + shapes of §§2–5), docs/16 (billing
shapes, IN-policy annotations), docs/01/02/07/08 (India specifics annotated as IN-pack
instances; §6 wording).

**Code changes now** (all that exists to change): `inrAmountSchema` → `amountSchema` in
`packages/contracts/src/common.ts` (+ its doc comment; health router has no money routes,
so no consumers break).

## 8. Non-goals (v1)

No second payment/SMS/telephony provider · no multi-region deployment · no new languages,
no RTL · no tax engine · no FX or multi-currency within a tenant · no per-market state
machine variants · no US pack · no runtime behavior change for India v1.

## 9. Verification

- `pnpm verify` green after the contracts rename.
- Grep sweep: no `_inr`, canonical `gst_pct`, `paisa`, `formatInr`, `inrAmountSchema`
  references survive in docs/04, docs/16, packages/contracts, or the rules corpus outside
  IN-pack examples and annotated IN rulings (enumerate with `git ls-files`, per §6).
- Docs cross-references intact (Law 8): docs/02 §10 ↔ docs/04 packs ↔ forward-compat rows
  agree on the pack's contents list.
