# Global-Capable Backend (India Primary) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute `docs/superpowers/specs/2026-08-02-global-backend-design.md` — edit the frozen design, contracts and rules so every future module authors global-safe schema; India v1 runtime behavior is unchanged.

**Architecture:** Almost entirely edits to paper (docs + rules) plus one code rename in `packages/contracts`. No migrations exist (`packages/db` is greenfield), so there is no data to migrate — the deliverable is that docs/04, the contracts, and the rules corpus stop hard-coding India, and `docs/forward-compat.md` makes the global-safe shapes binding on every module's first migration.

**Tech Stack:** Markdown docs, Zod (packages/contracts), Biome, pnpm/turbo gates.

## Global Constraints

- **No unit tests, ever** (owner directive 2026-07-29). Verification = grep sweeps with expected output + `pnpm verify`. Never create a `.test.*`/`.spec.*` file.
- **Git is manual** (CLAUDE.md §8): run a task's Commit step ONLY if the owner has explicitly asked for commits for this execution. Otherwise leave changes in the working tree and report what is there. Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- **Do NOT edit historical records**: files under `docs/superpowers/specs/`, `docs/superpowers/plans/` (other than checkbox ticking in THIS file), `docs/adr/`, `docs/research/`, `docs/spikes/` are records of past decisions — the grep sweep does not apply to them and they must not be "fixed".
- **India v1 behavior unchanged**: every edit renames/generalizes; none may change what the IN market does. INR keeps lakh/crore grouping, GST stays the IN tax scheme, all vendors stay.
- **Style**: match surrounding markdown (~100-char lines, same table formats). Code follows §8 of CLAUDE.md; run `pnpm exec biome check --write <files>` on touched TS files.
- Use Edit/Write tools for all file changes; `git ls-files` for enumeration (never bare globs — zsh aborts on unmatched patterns).
- Owner decisions incorporated (from the spec): D-G1 global-ready/India-only launch · D-G2 target regions incl. US (forces document-level tax capability) · D-G3 one currency per tenant, stamped on document roots · D-G4 global-safe billing schema, India-only rails.

---

### Task 1: Root constitution — CLAUDE.md + AGENTS.md

**Files:**
- Modify: `CLAUDE.md:3-5`, `CLAUDE.md:125`, `CLAUDE.md:129` (§7)
- Modify: `AGENTS.md` — same three edits (the files mirror each other verbatim at these lines; verified 2026-08-02)

**Interfaces:**
- Consumes: nothing.
- Produces: the reworded product laws every later task's wording must agree with — "minor unit of the tenant's currency", "market packs", "tenant-currency money (INR v1)".

- [ ] **Step 1: Reword the headline (both files, identical edit)**

Old (lines 3–5):
```
Multi-tenant SaaS for Indian solar EPC companies: CRM → survey → 3D design → proposal →
customer link → voice follow-up → projects → payments. The 3D Design Studio is the flagship.
Light-only v1 · EN/HI/MR · ₹ Indian grouping everywhere.
```
New:
```
Multi-tenant SaaS for solar EPC companies — India primary, global-capable backend: CRM →
survey → 3D design → proposal → customer link → voice follow-up → projects → payments. The
3D Design Studio is the flagship. Light-only v1 · EN/HI/MR UI · tenant-currency money (INR v1).
```

- [ ] **Step 2: Reword the two §7 money laws (both files)**

Old (line 125):
```
- One money path: BOM ↔ proposal ↔ tranches ↔ project payments reconcile to the paisa.
```
New:
```
- One money path: BOM ↔ proposal ↔ tranches ↔ project payments reconcile to the minor unit
  of the tenant's currency (paisa for INR).
```

Old (line 129):
```
- ₹ uses Indian grouping in every locale; kW/kWh/kWp are never translated.
```
New:
```
- Money renders with the tenant currency's market grouping in every locale (INR: lakh/crore,
  never a locale-default separator); kW/kWh/kWp are never translated.
```

- [ ] **Step 3: Add the market-pack law to §7 (both files)**

Insert as a new bullet directly after the "One money path" bullet:
```
- Every tenant belongs to ONE market (country) and ONE currency. Market facts — tax scheme,
  stage labels, document checklists, payment rails, phone spec, compliance rules — resolve
  from versioned market packs (docs/02 §10), never hard-coded.
```

- [ ] **Step 4: Verify**

Run: `grep -n "paisa\|Indian grouping\|Indian solar\|market packs" CLAUDE.md AGENTS.md`
Expected: both files identical; "Indian solar" gone; "paisa" only inside "(paisa for INR)"; "Indian grouping" gone (replaced wording says "market grouping"); the new market-pack law present in both.

- [ ] **Step 5: Commit (only if owner authorized commits)**

```bash
git add CLAUDE.md AGENTS.md
git commit -m "docs(laws): reword product law for a global-capable backend, India primary

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Path-scoped rules — contracts.md + i18n.md

**Files:**
- Modify: `.claude/rules/contracts.md:17`, `.claude/rules/contracts.md:21-25`
- Modify: `.claude/rules/i18n.md:9`, `.claude/rules/i18n.md:16-18`

**Interfaces:**
- Consumes: Task 1's wording ("minor unit", "market grouping").
- Produces: the money-wire rule Task 4's code comment must match; the phone-spec wording Task 3's mobile edit must match.

- [ ] **Step 1: contracts.md money line**

Old (line 17):
```
- Money crosses the wire as a 2-dp decimal string, never a float.
```
New:
```
- Money crosses the wire as a decimal string scaled to the currency's minor unit (INR: 2 dp),
  never a float; money-bearing payloads carry `currency_code` at document level.
```

- [ ] **Step 2: contracts.md protocol-constants block**

Old (lines 21–25):
```
- Protocol constants clients need (`OTP_LENGTH`, `PHONE_NSN_LENGTH`, `COUNTRY_CALLING_CODE`)
  live in `@heliogrid/domain`, not here (moved 2026-08-01 with the auth teardown). Domain is
  the bottom layer, so a contract that needs one IMPORTS it — that direction survives the
  contract being deleted and rebuilt, which is exactly what happened to auth. Never
  hard-code one in a client.
```
New:
```
- Protocol constants clients need (`OTP_LENGTH`, `PHONE_NSN_LENGTH`, `COUNTRY_CALLING_CODE`)
  live in `@heliogrid/domain`, not here (moved 2026-08-01 with the auth teardown). The phone
  pair is the IN market's phone spec — it becomes injected market-pack config when the
  market-pack slice lands (global ruling 2026-08-02); until then it stays a domain constant.
  Domain is the bottom layer, so a contract that needs one IMPORTS it — that direction
  survives the contract being deleted and rebuilt, which is exactly what happened to auth.
  Never hard-code one in a client.
```

- [ ] **Step 3: i18n.md locale line**

Old (line 9, first sentence only):
```
- ONE Lingui catalog (EN/HI/MR) serves web AND React Native. `LOCALES` derives from the
```
New:
```
- ONE Lingui catalog serves web AND React Native. `LOCALES` derives from the
```
(The rest of the bullet — "contracts `uiLanguageSchema` — never restate the locale list" — already states the rule correctly and is unchanged.)

- [ ] **Step 4: i18n.md never-translate / currency block**

Old (lines 16–18):
```
- **Never translate:** kW, kWh, kWp, brand names, DISCOM names. ₹ uses Indian grouping
  (lakh/crore) in every locale, via the shared formatter — never a locale-default
  thousands separator.
```
New:
```
- **Never translate:** kW, kWh, kWp, brand names, utility/DISCOM proper nouns. Money renders
  via the shared formatter with the tenant currency's market grouping in every locale
  (INR: lakh/crore) — never a locale-default thousands separator.
```

- [ ] **Step 5: Verify**

Run: `grep -n "2-dp\|EN/HI/MR\|Indian grouping" .claude/rules/contracts.md .claude/rules/i18n.md`
Expected: no matches for "2-dp" or "Indian grouping" as the rule (INR parenthetical remains); "(EN/HI/MR)" gone from i18n.md line 9.

- [ ] **Step 6: Commit (only if owner authorized commits)**

```bash
git add .claude/rules/contracts.md .claude/rules/i18n.md
git commit -m "docs(rules): currency-neutral money wire rule; phone spec scoped as IN market config

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Per-package CLAUDE.md files

**Files:**
- Modify: `packages/domain/CLAUDE.md:47-50` (Landmines roadmap sentence)
- Modify: `packages/i18n/CLAUDE.md:10` (NEVER list)
- Modify: `packages/contracts/CLAUDE.md` (Local conventions money sentence)
- Modify: `apps/worker/CLAUDE.md:36`
- Modify: `apps/api/CLAUDE.md:36`
- Modify: `apps/mobile/CLAUDE.md:92-96`

**Interfaces:**
- Consumes: Task 2's wording.
- Produces: the name `formatMoney(amount, currency, locale)` — the shared money formatter's name from now on; Task 6 (docs/04) and any future domain work must use it.

- [ ] **Step 1: domain roadmap — formatInr → formatMoney**

Old (inside the Landmines bullet, lines 47–50):
```
- Landed so far: login flow types + behavioural constants (`auth/login-state.ts`,
  `auth/login-policy.ts`) and phone NSN display (`format/phone.ts`). Still to come, in order:
  the login state MACHINE (arrives with the auth rebuild — auth-tenancy ruling 6), `formatInr`,
  then the invite/role invariants currently embedded in `apps/api` services.
```
New:
```
- Landed so far: login flow types + behavioural constants (`auth/login-state.ts`,
  `auth/login-policy.ts`) and phone NSN display (`format/phone.ts`). Still to come, in order:
  the login state MACHINE (arrives with the auth rebuild — auth-tenancy ruling 6),
  `formatMoney(amount, currency, locale)` (market grouping per currency — lakh/crore for INR;
  global ruling 2026-08-02 renamed the planned `formatInr` before it was built), then the
  invite/role invariants currently embedded in `apps/api` services.
```

- [ ] **Step 2: i18n NEVER list — formatInr → formatMoney**

Old (line 10, end of the NEVER bullet):
```
  (tenant DATA — docs/10 §7 · .claude/rules/i18n.md), raw Intl currency (formatInr when domain lands).
```
New:
```
  (tenant DATA — docs/10 §7 · .claude/rules/i18n.md), raw Intl currency (formatMoney when domain lands).
```

- [ ] **Step 3: contracts CLAUDE.md money sentence**

Old (in Local conventions, the tenant_id bullet):
```
- tenant_id NEVER appears in request bodies/params — it comes from the JWT claim
  (see `tenantClaimSchema` note). Money is a 2-dp decimal string, never a float.
```
New:
```
- tenant_id NEVER appears in request bodies/params — it comes from the JWT claim
  (see `tenantClaimSchema` note). Money is a decimal string scaled to the currency's minor
  unit (INR: 2 dp), never a float; money-bearing payloads carry a document-level `currency_code`.
```

- [ ] **Step 4: worker webhook landmine**

Old (line 36):
```
- Webhook processing (Razorpay/Exotel) happens HERE, not in the api: verify → dedupe on
```
New:
```
- Provider webhook processing (payment/telephony adapters — Razorpay/Exotel today) happens
  HERE, not in the api: verify → dedupe on
```

- [ ] **Step 5: api privacy citation**

Old (line 36):
```
- pino structured logs with requestId; phone numbers redacted (DPDP hygiene).
```
New:
```
- pino structured logs with requestId; phone numbers redacted (privacy hygiene — DPDP for
  IN; each market's regime as markets are added).
```

- [ ] **Step 6: mobile protocol-constants block**

Old (lines 92–96):
```
- **Protocol constants come from `@heliogrid/domain`** (`OTP_LENGTH`, `PHONE_NSN_LENGTH`,
  `COUNTRY_CALLING_CODE`) — they lived in contracts until 2026-08-01 and moved down a layer
  with the auth teardown, because domain outlives a contract being deleted and rebuilt. This
  screen used to define its own `OTP_LEN`/`PHONE_LEN`, so a server-side OTP-length change
  would leave the boxes rendering the old count.
```
New:
```
- **Protocol constants come from `@heliogrid/domain`** (`OTP_LENGTH`, `PHONE_NSN_LENGTH`,
  `COUNTRY_CALLING_CODE`) — they lived in contracts until 2026-08-01 and moved down a layer
  with the auth teardown, because domain outlives a contract being deleted and rebuilt. The
  phone pair is the IN market's spec and becomes injected market-pack config when packs land
  (global ruling 2026-08-02). This screen used to define its own `OTP_LEN`/`PHONE_LEN`, so a
  server-side OTP-length change would leave the boxes rendering the old count.
```

- [ ] **Step 7: Verify**

Run: `grep -rn "formatInr\|2-dp decimal\|(Razorpay/Exotel) happens\|DPDP hygiene" packages/domain/CLAUDE.md packages/i18n/CLAUDE.md packages/contracts/CLAUDE.md apps/worker/CLAUDE.md apps/api/CLAUDE.md apps/mobile/CLAUDE.md`
Expected: only one `formatInr` hit — inside the domain roadmap's parenthetical history note ("renamed the planned `formatInr`"); nothing else matches.

- [ ] **Step 8: Commit (only if owner authorized commits)**

```bash
git add packages/domain/CLAUDE.md packages/i18n/CLAUDE.md packages/contracts/CLAUDE.md apps/worker/CLAUDE.md apps/api/CLAUDE.md apps/mobile/CLAUDE.md
git commit -m "docs(packages): formatMoney replaces planned formatInr; provider/privacy wording market-neutral

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Contracts code — `inrAmountSchema` → `amountSchema`

**Files:**
- Modify: `packages/contracts/src/common.ts:12-18`
- Possibly modify: `packages/contracts/src/index.ts` (if it re-exports the symbol by name)

**Interfaces:**
- Consumes: Task 2's wire rule wording.
- Produces: `export const amountSchema: z.ZodString` — a decimal string allowing 0–3 fraction digits. Every future money-carrying route imports THIS symbol and pairs it with a document-level currency code. `docs/forward-compat.md` (Task 8) references it by this exact name.

- [ ] **Step 1: Confirm the symbol has no consumers**

Run: `grep -rn "inrAmountSchema" --include="*.ts" apps packages`
Expected: matches ONLY inside `packages/contracts` (the definition and possibly `src/index.ts`). If an app imports it, STOP — the sweep list in the spec was wrong; update the importer in the same task and note it.

- [ ] **Step 2: Replace the schema**

Old (`packages/contracts/src/common.ts` lines 12–18):
```ts
/**
 * Money travels as a decimal STRING with exactly two fraction digits (numeric(14,2) INR
 * in the DB) — never a float. Rendering uses formatInr() (Indian grouping) exclusively.
 */
export const inrAmountSchema = z
  .string()
  .regex(/^-?\d{1,12}\.\d{2}$/, 'INR amount as decimal string with 2 fraction digits');
```
New:
```ts
/**
 * Money travels as a decimal STRING scaled to the currency's minor unit (INR: exactly 2
 * fraction digits; numeric(14,3) in the DB) — never a float. A money-bearing payload
 * carries ONE document-level currency_code; the route's object schema refines the scale
 * against it. Rendering uses formatMoney(amount, currency, locale) exclusively — market
 * grouping per currency (lakh/crore for INR).
 */
export const amountSchema = z
  .string()
  .regex(/^-?\d{1,12}(\.\d{1,3})?$/, 'amount as decimal string scaled to the currency minor unit');
```

- [ ] **Step 3: Sweep the package for the old name**

Run: `grep -rn "inrAmountSchema" packages/contracts/src`
Expected: no matches. If `src/index.ts` re-exported it by name, rename there too.

- [ ] **Step 4: Gates + OpenAPI (contract edited ⇒ /contract-change discipline)**

Run, in order:
```
pnpm exec biome check --write packages/contracts/src/common.ts
pnpm --filter @heliogrid/contracts build
pnpm --filter @heliogrid/contracts openapi
pnpm turbo typecheck
```
Expected: all green. The OpenAPI diff should be EMPTY (only the health router is mounted; no route references the money schema) — if `openapi/openapi.json` changed, read why before proceeding.

- [ ] **Step 5: Commit (only if owner authorized commits)**

```bash
git add packages/contracts/src/common.ts packages/contracts/src/index.ts packages/contracts/openapi/openapi.json
git commit -m "feat(contracts): currency-neutral amountSchema replaces inrAmountSchema

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
(Drop unchanged paths from `git add` as needed.)

---

### Task 5: docs/04 — the frozen data model goes currency/market-neutral

**Files:**
- Modify: `docs/04-data-model.md` (~25 edit sites, grouped below)

**Interfaces:**
- Consumes: Task 1's laws, Task 4's `amountSchema` name, the spec's shapes (§§2–5).
- Produces: the canonical column names every future migration authors from: `*_amount` money columns, `currency_code` stamps, `tax_pct`, `tax_registrations`, `utility_inspection`/`incentive_claimed`, pack-validated `doc_type`/`mode`, `plan_prices`, `provider`+`external_id` pairs, `cost_estimate_minor`, `e_invoicing`.

- [ ] **Step 1: Global money convention (line 20)**

Old:
```
- Money `numeric(14,2)` INR. Percentages `numeric(5,2)`. Coordinates `numeric(9,6)`.
```
New:
```
- Money `numeric(14,3)` `*_amount`, scaled to the tenant currency's minor unit (INR: 2 dp;
  per-currency scale enforced in contracts/domain — `numeric` cannot vary scale per row).
  Money-bearing document roots stamp `currency_code` at creation; line items inherit it.
  Percentages `numeric(5,2)`. Coordinates `numeric(9,6)`.
```

- [ ] **Step 2: `tenants` — market identity + tax registrations (§1 table)**

Replace the `gstin` row:
```
| gstin | text | validated format; nullable until first proposal |
```
with:
```
| tax_registrations | jsonb | `[{scheme, value, validated_at}]`, Zod per scheme; v1 accepts only `IN_GST`; empty until first proposal |
```
Replace the `country_code, state_code` row:
```
| country_code, state_code | text | drives `market_rules_packs` resolution; India-first, global-ready |
```
with:
```
| country_code, state_code | text | drives `market_rules_packs` resolution; v1: `'IN'` only |
| currency_code | text | ISO 4217, server-assigned from the market at tenant creation; v1: `'INR'` only |
```

- [ ] **Step 3: CRM money columns (§2)**

- `leads` table: `| estimated_value_inr | numeric(14,2) |` → `| estimated_value_amount | numeric(14,3) |` (note text unchanged); `| monthly_bill_inr | numeric(10,2) |` → `| monthly_bill_amount | numeric(10,2) |`; in the `qualification` row's note, `monthly bill ₹` → `monthly bill (tenant currency)`.

- [ ] **Step 4: Design + proposal money (§4–§5)**

- `designs`: `| price_total_inr | numeric(14,2) | mirror of BOM total |` → `| price_total_amount | numeric(14,3) | mirror of BOM total |`.
- `proposal_versions.snapshot` row, old note:
```
full 11-step field set + computed money block (cost ex/incl GST, GST %, battery + battery GST %, subsidy ₹, discount %⇄₹, payable) + narrative facts
```
new note:
```
full 11-step field set + computed money block (`currency_code`, cost ex/incl tax, per-line tax %, document-level `taxes[]` breakdown `[{scheme, label, rate_pct?, amount}]`, battery + battery tax %, incentive amount, discount %⇄amount, payable) + narrative facts. Tax strategy comes from the market pack: `per_line_rate` (IN) or `document_level` (reserved for jurisdiction-computed markets, e.g. US sales tax)
```
- §5 ruling paragraph: `Money guard at Generate: `payable ≤ ₹0` blocks` → `Money guard at Generate: payable ≤ 0 (tenant currency) blocks`.
- `proposal_components`: `` `rate_inr numeric(14,2)`, `gst_pct numeric(5,2)`, `line_total_inr numeric(14,2)` `` → `` `rate_amount numeric(14,3)`, `tax_pct numeric(5,2)`, `line_total_amount numeric(14,3)` ``.
- `tranches`: `| amount_inr | numeric(14,2) | Σ = payable **to the paisa** (BOM ↔ proposal ↔ tranches ↔ payments reconcile) |` → `| amount | numeric(14,3) | Σ = payable **to the currency's minor unit** (BOM ↔ proposal ↔ tranches ↔ payments reconcile) |`.

- [ ] **Step 5: Projects — stages, documents, blockers, payments (§6)**

- State machine paragraph, old:
```
`won → material_ordered → dispatched → installation → electrical_and_metering →
discom_inspection → commissioned → subsidy_claimed → handed_over`, plus terminal `cancelled`
(reason mandatory) reachable from any stage. `subsidy_claimed` is skipped (transition allowed
commissioned → handed_over) for non-residential/no-subsidy projects.
```
new:
```
`won → material_ordered → dispatched → installation → electrical_and_metering →
utility_inspection → commissioned → incentive_claimed → handed_over`, plus terminal `cancelled`
(reason mandatory) reachable from any stage. Stage LABELS are market-pack data ("DISCOM
inspection" / "Subsidy claimed" are the IN pack's labels); `incentive_claimed` is skippable
(transition allowed commissioned → handed_over) per pack rule and for no-incentive projects.
```
- `projects` table: `| final_value_inr | numeric(14,2) |` → `| final_value_amount | numeric(14,3) |`.
- `project_documents`, old heading + definition:
```
### `project_documents` — the 8-item checklist

`id` · `tenant_id` · `project_id → projects` · `doc_type` enum `project_doc_type` —
`signed_proposal` / `advance_receipt` / `net_metering_application` / `discom_approval` /
`subsidy_application_and_sanction` / `commissioning_certificate` / `warranty_documents` /
`handover_pack` · `status` enum `document_status` (`pending` / `uploaded` / `verified`) ·
`file_id → files, nullable` · `verified_by → users` · `verified_at`. Unique
`(project_id, doc_type)`; 8 rows seeded at project creation (subsidy row omitted for
commercial). Handover = all rows past `pending` + pack shared on the link.
```
new:
```
### `project_documents` — the handover checklist (market-pack data)

`id` · `tenant_id` · `project_id → projects` · `doc_type text` + Zod — validated against the
tenant market's pack checklist (IN pack: `signed_proposal` / `advance_receipt` /
`net_metering_application` / `discom_approval` / `subsidy_application_and_sanction` /
`commissioning_certificate` / `warranty_documents` / `handover_pack`) · `status` enum
`document_status` (`pending` / `uploaded` / `verified`) · `file_id → files, nullable` ·
`verified_by → users` · `verified_at`. Unique `(project_id, doc_type)`; the pack's rows are
seeded at project creation (IN: 8 rows, incentive row omitted for commercial). Handover = all
rows past `pending` + pack shared on the link.
```
- `blockers`: `` `waiting_on` enum `blocker_party` (`discom` / `customer` / `material` / `us`) `` → `` `waiting_on` enum `blocker_party` (`utility` / `customer` / `material` / `us` — "DISCOM" is the IN pack's label for `utility`) ``.
- `project_payments`, old:
```
`amount_inr numeric(14,2)` · `mode` enum `payment_mode` (`upi`/`neft`/`cheque`/`cash`/
`payment_link`) · `reference text`
```
new:
```
`amount numeric(14,3)` · `mode text` + Zod — validated against the market pack's
payment-mode list (IN pack: `upi`/`neft`/`cheque`/`cash`/`payment_link`) · `reference text`
```

- [ ] **Step 6: Catalog (§7)**

- `platform_catalog_items.spec` note: `PanelSpec (Voc/Vmp/Isc/Imp/temp-coeffs/ALMM/DCR/dims/warranty)` → `PanelSpec (Voc/Vmp/Isc/Imp/temp-coeffs/dims/warranty + `certifications` keyed by scheme — IN: ALMM, DCR; the pack declares which schemes a market requires)`.
- `tenant_catalog_items`: `` `default_rate_inr numeric(14,2)` · `gst_pct numeric(5,2)` `` → `` `default_rate_amount numeric(14,3)` · `tax_pct numeric(5,2)` ``.
- `tenant_catalog_overrides`: `` `rate_inr numeric(14,2), nullable` · `gst_pct numeric(5,2), nullable` `` → `` `rate_amount numeric(14,3), nullable` · `tax_pct numeric(5,2), nullable` ``.

- [ ] **Step 7: Voice cost mirror (§8)**

`calls`: `| total_cost_inr | numeric(14,2) | mirror; also emitted as a `voice_minutes` usage_event |` → `| total_cost_amount | numeric(14,3) | mirror (platform ledger currency, INR v1); also emitted as a `voice_minutes` usage_event |`.

- [ ] **Step 8: Billing (§9) — plans, subscriptions, events, usage, invoices**

- `plans`, old:
```
`id` · `code text unique` (`starter` / `growth` / `pro` / `enterprise`) · `name` ·
`price_monthly_inr, price_annual_inr numeric(14,2)` · `razorpay_plan_id text` ·
`trial_days int` · `bundles jsonb`
```
new:
```
`id` · `code text unique` (`starter` / `growth` / `pro` / `enterprise`) · `name` ·
`trial_days int` · `bundles jsonb`
```
and add directly after the `plans` section:
```
### `plan_prices` — PLATFORM (per-currency price list)

`id` · `plan_id → plans` · `currency_code text` · `price_monthly, price_annual numeric(14,3)`
· `provider text` + `external_plan_id text` (provider-neutral gateway ref; v1: `razorpay`) ·
unique `(plan_id, currency_code)`. v1 rows are INR/Razorpay only — a new market adds rows,
zero schema change.
```
- `subscriptions`, old:
```
`plan_id → plans` · `razorpay_subscription_id text unique` · `status` enum
```
new:
```
`plan_id → plans` · `provider text` + `external_subscription_id text` (unique
`(provider, external_subscription_id)`; v1: `razorpay`) · `status` enum
```
and old:
```
`mandate_type` enum (`upi_autopay` / `card_emandate`).
```
new:
```
`mandate_type text` + Zod — valid set per provider/market pack (IN/Razorpay:
`upi_autopay` / `card_emandate`).
```
In the same block, `(mapped from Razorpay states; `subscription.charged` webhook is the entitlement grant trigger)` → `(v1 mapping is Razorpay's states; `subscription.charged` webhook is the entitlement grant trigger)`.
- `subscription_events`: `` `razorpay_event_id text unique nullable` `` → `` `provider_event_id text unique nullable` ``.
- `usage_events` table: `| cost_estimate_paise | bigint, nullable | internal unit-economics estimate; never customer-facing |` → `| cost_estimate_minor | bigint, nullable | internal unit-economics estimate in the platform ledger currency's minor units (INR v1); never customer-facing |`.
- `invoices`, old:
```
`id` · `tenant_id` · `subscription_id` · `razorpay_invoice_id text unique` ·
`invoice_number text` · `period_start/end` · `amount_ex_gst_inr, gst_pct, gst_amount_inr,
total_inr numeric(14,2)` · `irn text, nullable` (e-invoicing IRN — ours to validate) ·
`status` enum (`issued`/`paid`/`failed`/`refunded`) · `pdf_file_id → files` · `issued_at,
paid_at`. Razorpay generates the GST invoice per cycle with our GSTIN/SAC; this row is our
ledger mirror.
```
new:
```
`id` · `tenant_id` · `subscription_id` · `provider text` + `external_invoice_id text unique`
(v1: `razorpay`) · `invoice_number text` · `period_start/end` · `currency_code text` ·
`subtotal_amount, tax_amount, total_amount numeric(14,3)` · `tax_breakdown jsonb`
(`[{scheme, label, rate_pct?, amount}]`; IN: the single GST line) · `e_invoicing jsonb,
nullable` (scheme-tagged statutory extras; IN: `{irn, ack_no, ack_date, qr_payload}` + SAC —
ours to validate) · `status` enum (`issued`/`paid`/`failed`/`refunded`) · `pdf_file_id →
files` · `issued_at, paid_at`. On the IN rail, Razorpay generates the GST invoice per cycle
with our GSTIN/SAC; this row is our ledger mirror.
```

- [ ] **Step 9: `market_rules_packs` contents (§10)**

Old (rules column description):
```
`version_no int` · `rules jsonb` — the POC `MarketRules` shape whole: GST rates, PM Surya Ghar
subsidy slabs, design-temp latitude bands, DC/AC sizing ladders, wind zones, financing terms,
defaults, tariff directory (STATE/DISCOM tariffs ride inside the pack) ·
```
New:
```
`version_no int` · `rules jsonb` — the market's facts whole: tax scheme + rates (strategy
`per_line_rate` | `document_level`; per-line GST is the IN instance), incentive/subsidy
models (PM Surya Ghar for IN), project-stage labels + skippable stages, document checklists,
payment-mode vocabulary, phone spec (calling code, NSN length, display grouping), compliance
rulesets/calendar, certification schemes (ALMM/DCR for IN), currency display rules
(lakh/crore for INR), design-temp latitude bands, DC/AC sizing ladders, wind zones,
financing terms, defaults, tariff directory (state/utility tariffs ride inside the pack) ·
```

- [ ] **Step 10: §11 census + §13 state-machine index**

- §11 row: `| `tranches`, `project_payments` | **Relational** | The money path — summed, reconciled to the paisa, invariant-tested |` → `| `tranches`, `project_payments` | **Relational** | The money path — summed, reconciled to the currency's minor unit, invariant-tested |`.
- §11 row: `mirrors (e.g. `monthly_bill_inr`) where lists sort` → `mirrors (e.g. `monthly_bill_amount`) where lists sort`.
- §11 row: `Per-leg unit economics; `total_cost_inr` mirrored numeric + usage_event` → `Per-leg unit economics; `total_cost_amount` mirrored numeric + usage_event`.
- §13 row: `| `project_stage` | won → material_ordered → dispatched → installation → electrical_and_metering → discom_inspection → commissioned → subsidy_claimed → handed_over · cancelled |` → `| `project_stage` | won → material_ordered → dispatched → installation → electrical_and_metering → utility_inspection → commissioned → incentive_claimed → handed_over · cancelled |`.

- [ ] **Step 11: Verify**

Run: `grep -n "_inr\|gst_pct\|razorpay_plan_id\|razorpay_subscription_id\|razorpay_event_id\|razorpay_invoice_id\|cost_estimate_paise\|discom_inspection\|subsidy_claimed\|gstin" docs/04-data-model.md`
Expected: zero matches. Then `grep -n "paisa" docs/04-data-model.md` — zero matches (the reconcile lines now say "minor unit").

- [ ] **Step 12: Commit (only if owner authorized commits)**

```bash
git add docs/04-data-model.md
git commit -m "docs(data-model): currency/market-neutral schema — amounts, tax, stages, packs, billing

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: docs/15 re-rulings (R2, D36, R13, R6, R3/R4 annotations, decisions log)

**Files:**
- Modify: `docs/15-spec-resolutions.md`

The owner approved these re-rulings via the 2026-08-02 spec; docs/15 convention: amendment stated FIRST, superseded wording marked.

**Interfaces:**
- Consumes: Task 5's stage names (`utility_inspection`, `incentive_claimed`).
- Produces: the rulings docs/07 (Task 9) cites for the ComplianceGate amendment.

- [ ] **Step 1: R2 amendment**

After the line `### R2 — Project state machine: short vs full chain` and its context line, the RULING paragraph currently reads:
```
**RULING: the FULL 9-stage chain is the canonical state machine; the D9 shorthand is deprecated and appears nowhere.** `WON → MATERIAL_ORDERED → DISPATCHED → INSTALLATION → ELECTRICAL_METERING → DISCOM_INSPECTION → COMMISSIONED → SUBSIDY_CLAIMED → HANDED_OVER`, plus `CANCELLED` (reason required; revenue stops counting immediately). Blocker sub-states (waiting on DISCOM/customer/material/us) ride on any stage.
```
Replace with:
```
**AMENDED 2026-08-02 (global-backend ruling):** two stages carry market-neutral enum names —
`UTILITY_INSPECTION` (was DISCOM_INSPECTION) and `INCENTIVE_CLAIMED` (was SUBSIDY_CLAIMED);
the blocker party `utility` replaces `discom`. Stage LABELS are market-pack data ("DISCOM
inspection" / "Subsidy claimed" are the IN pack's labels); skippable stages are pack data.
The machine itself — one canonical chain, same transitions — is unchanged.
**RULING: the FULL 9-stage chain is the canonical state machine; the D9 shorthand is deprecated and appears nowhere.** `WON → MATERIAL_ORDERED → DISPATCHED → INSTALLATION → ELECTRICAL_METERING → UTILITY_INSPECTION → COMMISSIONED → INCENTIVE_CLAIMED → HANDED_OVER`, plus `CANCELLED` (reason required; revenue stops counting immediately). Blocker sub-states (waiting on utility/customer/material/us) ride on any stage.
```

- [ ] **Step 2: D36 row amendment (§2 table)**

Old row text (the Status cell of D36):
```
PARTIAL — config fully tenant-owned; the statutory floor (DND scrub, 9am–9pm, DLT series, opt-out, recording retention) is enforced by our non-swappable `ComplianceGate`, not merely surfaced. Tenants configure within the law, not around it
```
New:
```
PARTIAL — config fully tenant-owned; the statutory floor is enforced by our non-swappable `ComplianceGate`, not merely surfaced. AMENDED 2026-08-02: the gate's MECHANISM is non-swappable; its statutory RULESET is per-market data from the market pack (TRAI/DLT — DND scrub, 9am–9pm, DLT series, opt-out, recording retention — is the IN ruleset). A market with no voice ruleset cannot enable outbound voice. Tenants configure within the law, not around it
```

- [ ] **Step 3: R13 amendment**

After the R13 RULING sentence containing `platform master catalog (curated, ALMM/DCR-flagged)`, append to the ruling paragraph:
```
**AMENDED 2026-08-02 (global-backend ruling):** ALMM/DCR are the IN entries of a scheme-keyed
`certifications` structure on catalog specs; the market pack declares which schemes a market
requires. The two-tier resolution is unchanged.
```

- [ ] **Step 4: R6 annotation**

In R6, old sentence:
```
and an MSG91 OTP challenge on Accept above a tenant-set value threshold.
```
New:
```
and an OTP challenge on Accept (via `OtpPort` — MSG91 is the IN rail) above a tenant-set
value threshold denominated in the tenant's currency.
```

- [ ] **Step 5: R3 + R4 IN-market annotations**

- R3: append to the end of the **Consequence** paragraph: ` (IN-market ruling: the vendors stand behind their ports; another market adds adapters — the ruling is unchanged.)`
- R4: append to the end of the **Consequence** paragraph: ` (IN-market ruling: Razorpay is the IN rail behind `SubscriptionBillingPort`/`PaymentLinkPort`; billing schema is provider-neutral per docs/04 §9. Selling outside India needs a supplier-of-record decision — owner-blocked.)`

- [ ] **Step 6: User decisions log entry (§4)**

Append to the `### User decisions log` run-on list (before the final period):
```
 · global backend 2026-08-02: global-ready with India-only launch; one currency per tenant;
global-safe billing schema, India-only rails; target regions Gulf/MENA, SEA/Africa,
EU/UK/AU, US (spec: docs/superpowers/specs/2026-08-02-global-backend-design.md)
```

- [ ] **Step 7: Verify**

Run: `grep -n "AMENDED 2026-08-02\|UTILITY_INSPECTION\|INCENTIVE_CLAIMED\|global backend 2026-08-02" docs/15-spec-resolutions.md`
Expected: R2/D36/R13 amendments present; new stage names in R2; the decisions-log entry present. `grep -n "DISCOM_INSPECTION\|SUBSIDY_CLAIMED" docs/15-spec-resolutions.md` → zero matches.

- [ ] **Step 8: Commit (only if owner authorized commits)**

```bash
git add docs/15-spec-resolutions.md
git commit -m "docs(rulings): 2026-08-02 global-backend re-rulings — stages, ComplianceGate, certifications, R6 currency

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: forward-compat.md — the Market & money block (the enforcement lynchpin)

**Files:**
- Modify: `docs/forward-compat.md` (append a new section after the register table)

**Interfaces:**
- Consumes: `amountSchema` (Task 4), the docs/04 shapes (Task 5).
- Produces: the binding checklist every future module's first migration is audited against.

- [ ] **Step 1: Append the section**

Add after the register table (end of file):
```

## Market & money — binding on EVERY module's first migration (2026-08-02)

The backend is global-capable with India the only launch market
(`docs/superpowers/specs/2026-08-02-global-backend-design.md`). Unlike the per-module rows
above, this block applies to every module. Each first migration and contract must satisfy:

- **Money**: columns are `numeric(14,3)` named `*_amount` — never `*_inr`/`*_paise`; the
  money-bearing document root stamps `currency_code` at creation; sums reconcile to the
  currency's minor unit. Wire money is `amountSchema` + a document-level `currency_code`.
- **Tax**: fields are scheme-generic (`tax_pct`, `taxes[]`/`tax_breakdown`,
  `tax_registrations`) — never GST-named columns; statutory extras (IRN/SAC) live in
  scheme-tagged JSONB (`e_invoicing`).
- **Market vocabularies**: paperwork sets (document checklists, payment modes, mandate
  types) are `text` + Zod validated against the tenant market's pack — never closed pg
  enums. Canonical state machines stay pg enums with market-neutral value names; labels
  come from the pack.
- **Providers**: gateway/vendor refs are `provider` + `external_id` column pairs — never
  provider-named columns.
- **Scheduling**: user-facing repeatable jobs are tenant-timezone-aware, never fixed IST
  (platform-internal sweeps may stay fixed-clock).
- **New market onboarding** requires a privacy/residency determination for that
  jurisdiction BEFORE tenants are created there (docs/08 §9 is the IN determination), and
  selling subscriptions there needs a supplier-of-record decision (owner-blocked).
```

- [ ] **Step 2: Verify**

Run: `grep -n "Market & money" docs/forward-compat.md`
Expected: the heading present, after the table. Cross-check: the vocabulary list here, the pack contents in docs/04 §10 (Task 5 Step 9), and docs/02 §10's pack table (Task 9) must name the same fact families — read all three side by side once.

- [ ] **Step 3: Commit (only if owner authorized commits)**

```bash
git add docs/forward-compat.md
git commit -m "docs(forward-compat): market & money block binding on every first migration

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: docs/16 — billing doc aligned with the neutral schema

**Files:**
- Modify: `docs/16-billing-and-entitlements.md`

**Interfaces:**
- Consumes: Task 5's invoice/plan_prices shapes.
- Produces: nothing downstream; must not contradict docs/04 after Task 5.

- [ ] **Step 1: §1 — mandate table scoped as IN policy**

Old intro line:
```
What this document owns is the mandate route each tier's price band requires:
```
New:
```
What this document owns is the mandate route each tier's price band requires — IN-market
policy (derived from RBI/NPCI rules), living in the Razorpay adapter layer above
`SubscriptionBillingPort`, never in generic domain:
```

- [ ] **Step 2: §4 — mandate ladder scoped**

Old bullet start: `- **Mandate ladder:** UPI AutoPay primary` → New: `- **Mandate ladder (IN rails):** UPI AutoPay primary` (rest unchanged).

- [ ] **Step 3: §1 — plan mirroring now goes through `plan_prices`**

Old (in the bullet list after the mandate table):
```
- Every tier exists as **two Razorpay Plan objects (monthly + yearly)** mirrored 1:1 by rows in our `plans` table (`billing_cycle` column: monthly/yearly); our table is the source of truth for entitlements, Razorpay's for money.
```
New:
```
- Every tier exists as **two Razorpay Plan objects (monthly + yearly)** mirrored 1:1 by `plan_prices` rows (per-currency monthly + yearly prices and the provider-neutral gateway ref — docs/04 §9); our tables are the source of truth for entitlements, the gateway's for money.
```
(Keep the rest of the bullet — cycle-switch mechanics — unchanged.)

- [ ] **Step 4: §6 — ledger currency + overage rendering**

- In the `usage_events` code block and any §6 prose: `cost_estimate_paise nullable` → `cost_estimate_minor nullable`.
- Old sentence end: `the usage screen shows accruing overage in ₹ (Indian grouping) as it happens.` → New: `the usage screen shows accruing overage in the tenant's currency with its market grouping (₹ lakh/crore for IN) as it happens.`

- [ ] **Step 5: §7 — GST scoped as the IN scheme**

Insert directly under the `## 7. GST invoicing (platform billing)` heading:
```
> GST is the IN market's tax scheme. The canonical invoice row is scheme-neutral —
> `currency_code`, `subtotal_amount`/`tax_amount`/`total_amount`, `tax_breakdown`,
> scheme-tagged `e_invoicing` JSONB (docs/04 §9); everything below is the IN instance.
```
And in the e-invoicing bullet, old: `invoice rows already carry nullable `irn`, `ack_no`, `ack_date`, `qr_payload`;` → new: `the invoice row's `e_invoicing` JSONB carries `{irn, ack_no, ack_date, qr_payload}`;`.

- [ ] **Step 6: §8 — manual modes + minor unit**

- Old: `Tenants without a Razorpay account: manual modes stand (record UPI/NEFT/cheque + attach receipt)` → New: `Tenants without a Razorpay account: manual modes stand (record a market payment mode — IN pack: UPI/NEFT/cheque — and attach the receipt)`.
- Old sentence end: `(BOM ↔ proposal ↔ tranches ↔ project payments, to the paisa).` → New: `(BOM ↔ proposal ↔ tranches ↔ project payments, to the currency's minor unit).`

- [ ] **Step 7: §9 — dunning channels scoped**

Old first sentence of §9 ends: `Channels: in-app banner (owner + managers), push (Notifee), SMS via MSG91 (DLT-registered templates), WhatsApp utility template via MSG91 where the owner opted in (platform→tenant messaging is ours; D32 only constrains tenant→customer messaging).`
New: `Channels are the IN market pack's stack: in-app banner (owner + managers), push (Notifee), SMS via MSG91 (DLT-registered templates), WhatsApp utility template via MSG91 where the owner opted in (platform→tenant messaging is ours; D32 only constrains tenant→customer messaging). A future market's pack names its own channel stack.`

- [ ] **Step 8: Verify**

Run: `grep -n "cost_estimate_paise\|to the paisa\|in ₹ (Indian grouping)\|rows in our \`plans\` table" docs/16-billing-and-entitlements.md`
Expected: zero matches.

- [ ] **Step 9: Commit (only if owner authorized commits)**

```bash
git add docs/16-billing-and-entitlements.md
git commit -m "docs(billing): scope IN rails/GST as market instances of the neutral schema

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: docs/00, 01, 02, 07, 08 annotations

**Files:**
- Modify: `docs/00-vision-and-scope.md` (conviction 3), `docs/01-business-model.md` (scoping note), `docs/02-system-architecture.md` (§6 job table intro, §10 tax model), `docs/07-integrations.md` (metering field, ComplianceGate, PaymentLinkPort), `docs/08-security-and-tenancy.md` (§9 intro + retention)

**Interfaces:**
- Consumes: Task 6's D36 amendment (docs/07 cites it), Task 7's block (docs/08 cites it).
- Produces: nothing downstream.

- [ ] **Step 1: docs/00 conviction 3**

Old ending: `— built on a market-config layer that is injected, not hard-coded, so new markets are configuration.`
New: `— built on a market-config layer that is injected, not hard-coded, so new markets are configuration (binding since 2026-08-02: the "Market & money" block in docs/forward-compat.md).`

- [ ] **Step 2: docs/01 scoping note**

Insert directly after the `Status: approved · Sources: …` line:
```

> **Market scope (2026-08-02):** every price, benchmark and mandate mechanic in this
> document is the IN market's price book (INR). Global pricing arrives per-market as
> `plan_prices` rows (docs/04 §9); nothing here is the generic model.
```

- [ ] **Step 3: docs/02 §6 repeatable jobs**

Old: `**Repeatable jobs** (BullMQ repeatables, registered on their owning queue; times IST):`
New: `**Repeatable jobs** (BullMQ repeatables, registered on their owning queue). User-facing schedules are tenant-timezone-aware by law (forward-compat "Market & money"); v1 tenants are all IST, so the times below read as IST. Platform-internal sweeps stay fixed-clock:`

- [ ] **Step 4: docs/02 §10 tax model**

Old (RulesContext row): `subsidy model, tax model (GST v1), net-metering conventions` → New: `subsidy/incentive model, tax model (scheme + strategy `per_line_rate` | `document_level`; per-line GST is the IN instance), net-metering conventions`.

- [ ] **Step 5: docs/07 metering + PaymentLinkPort minor units**

- In the §Global-rules metering snippet prose: `cost_estimate_paise, occurred_at` → `cost_estimate_minor, occurred_at`.
- PaymentLinkPort interface, old: `createLink(tenantId: string, req: { amountPaise: number; purpose: string;` → new: `createLink(tenantId: string, req: { amountMinor: number; currency: string; purpose: string;`.

- [ ] **Step 6: docs/07 §6 ComplianceGate amendment**

Insert directly after the paragraph beginning `**One concrete implementation, no alternate adapter, ever.**` (after that full paragraph, before **Fail-closed:**):
```

**AMENDED 2026-08-02 (global-backend ruling; docs/15 D36):** the MECHANISM above is what is
non-swappable — every outbound dial passes this gate, no override flag, no alternate adapter.
The statutory RULESET the gate enforces is per-market data from the market pack; everything
in this section (DND scrub, 9am–9pm window, 1600/140x series, ≤24 h opt-out, 90-day
retention) is the IN ruleset (TRAI/DLT). A market with no voice ruleset in its pack cannot
enable outbound voice. This resolves the prior tension with docs/02 §10, which places the
compliance calendar in RulesContext.
```

- [ ] **Step 7: docs/08 §9 scoped as the IN determination**

- Old first line of §9: `DPDP Act 2023 + DPDP Rules 2025. Position:` → New: `DPDP Act 2023 + DPDP Rules 2025 — **the IN market's determination**; onboarding any new market requires that jurisdiction's own privacy/residency determination BEFORE tenants exist there (forward-compat "Market & money"). Position:`
- Old (erasure bullet): `are retained for statutory periods (GST: 6+ years).` → New: `are retained for the market pack's statutory period (IN: GST, 6+ years).`

- [ ] **Step 8: Verify**

Run: `grep -n "amountPaise\|cost_estimate_paise\|times IST\|tax model (GST v1)" docs/02-system-architecture.md docs/07-integrations.md`
Expected: zero matches. Run: `grep -n "AMENDED 2026-08-02" docs/07-integrations.md` → one match in §6.

- [ ] **Step 9: Commit (only if owner authorized commits)**

```bash
git add docs/00-vision-and-scope.md docs/01-business-model.md docs/02-system-architecture.md docs/07-integrations.md docs/08-security-and-tenancy.md
git commit -m "docs(architecture): annotate India specifics as IN market-pack instances

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: QA test-matrix — market-pack test data note

**Files:**
- Modify: `.claude/skills/qa/references/test-matrix.md`

- [ ] **Step 1: Add the note under the title**

Insert after the opening paragraph (ending `…aborts the run naming the gap.`):
```

> **Test data derives from the tenant's market pack.** v1 tenants are IN, so examples in
> this matrix use +91 phones, Devanagari strings and paisa-level reconciliation; a future
> market's runs derive the equivalents (phone spec, scripts, minor unit) from its pack.
```

- [ ] **Step 2: Reword the money-reconciliation core step**

Old: `- Money reconciliation — BOM ↔ proposal ↔ tranches agree to the paisa.`
New: `- Money reconciliation — BOM ↔ proposal ↔ tranches agree to the minor unit of the tenant's currency (paisa for IN).`

- [ ] **Step 3: Verify**

Run: `grep -n "market pack\|minor unit" .claude/skills/qa/references/test-matrix.md`
Expected: both edits present.

- [ ] **Step 4: Commit (only if owner authorized commits)**

```bash
git add .claude/skills/qa/references/test-matrix.md
git commit -m "docs(qa): test data derives from the tenant market pack

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Final verification sweep

**Files:** none (read-only checks)

- [ ] **Step 1: The spec's grep sweep**

Run:
```
git ls-files 'CLAUDE.md' 'AGENTS.md' '.claude/rules/*.md' '.claude/skills/qa/references/test-matrix.md' 'docs/04-data-model.md' 'docs/16-billing-and-entitlements.md' | xargs grep -n -E '_inr|inrAmountSchema|formatInr|gst_pct|paisa|paise'
```
Expected surviving matches, and ONLY these kinds:
- `(paisa for INR)` / `(paisa for IN)` — the IN-instance parentheticals from Tasks 1 and 10.
- `formatInr` once, in `packages/domain/CLAUDE.md`'s history parenthetical (not in this file list — confirm separately with `grep -rn formatInr packages/*/CLAUDE.md`).
Anything else is a missed edit — fix it and re-run.

- [ ] **Step 2: Cross-reference consistency (spec §9)**

Read side by side and confirm the same fact families are named in all three: docs/02 §10 market-pack table (rules/catalog/templates/locale) · docs/04 §10 `market_rules_packs.rules` contents · forward-compat "Market & money" vocabularies. Fix drift in the doc that disagrees.

- [ ] **Step 3: Full gates**

Run: `pnpm verify`
Expected: green. Note: without a live `DATABASE_URL` the invariants skip loudly — that is acceptable here (no schema exists; this plan changes no runtime behavior), but say so in the report rather than claiming tenancy proven.

- [ ] **Step 4: Report**

State what changed (files + one line each), the sweep results verbatim, and that the working tree holds the changes uncommitted (unless the owner authorized commits, in which case list the commits).
