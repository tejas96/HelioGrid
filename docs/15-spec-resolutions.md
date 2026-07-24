# 15 — Spec Resolutions

**Status:** Binding · 2026-07-24 · Owner: product
**Sources:** ./research/journey.md §6 (the 18 gaps/ambiguities/contradictions), ./research/phases710.md, ./research/voice.md, ./research/verify-billing.md, ./research/sync.md, docs/BLUEPRINT.md (final-review directives). Where a ruling touches another doc, that doc carries the detail; this file carries the decision.

Every ambiguity in the POC spec is ruled here, once. Agents implement the ruling; they do not re-litigate it. If code and a ruling disagree, the ruling wins until the product owner changes it **in this file**.

---

## 1 · The 18 rulings (journey.md §6, same numbering)

### R1 — Naming: Proposal vs Quotation vs Quote
The spec uses all three; Indian EPCs say "quotation".
**RULING: "Proposal" everywhere — entity, schema, code identifiers, UI copy, and customer-facing documents in all three locales (EN/HI/MR).** The words "quote"/"quotation" are banned from identifiers and UI strings. One exception: global search treats "quotation"/"quote" as query aliases for proposals, because that is what users will type.
**Consequence:** table `proposals`, i18n keys `proposal.*`, customer link says Proposal; Lingui translators render it as प्रस्ताव / प्रस्ताव with "Proposal" retained where the transliteration is more natural in the field. No dual vocabulary anywhere.

### R2 — Project state machine: short vs full chain
D9's shorthand (Won → Ordered → Installed → Commissioned → Handed over) vs Stage 8's full chain.
**RULING: the FULL 9-stage chain is the canonical state machine; the D9 shorthand is deprecated and appears nowhere.** `WON → MATERIAL_ORDERED → DISPATCHED → INSTALLATION → ELECTRICAL_METERING → DISCOM_INSPECTION → COMMISSIONED → SUBSIDY_CLAIMED → HANDED_OVER`, plus `CANCELLED` (reason required; revenue stops counting immediately). Blocker sub-states (waiting on DISCOM/customer/material/us) ride on any stage.
**Consequence:** enum in docs/04-data-model.md; projects board columns, tranche `due_on_stage` mapping, customer-link stage display, and days-in-stage metrics all use the 9-stage chain. Residential deals may pass through stages quickly; they still pass through them.

### R3 — Voice vendor
Journey fully specifies agent behaviour but names no vendor.
**RULING: Exotel (telephony, AgentStream bidirectional WS, DLT/TRAI ops) + Sarvam AI (Saarika STT / Bulbul TTS / Sarvam LLM) behind our `TelephonyProvider`/`SpeechProvider` ports; thin NestJS orchestrator in `apps/voice`. Bolna is the documented Plan B behind the same ports; LiveKit self-host is v2.** Decided — see ./research/voice.md ([Exotel AgentStream](https://docs.exotel.com/exotel-agentstream/bidirectional-streaming), [Sarvam pricing](https://www.sarvam.ai/api-pricing)).
**Consequence:** agent languages (6) remain independent of UI languages (3) — the sets never converge by accident. ≈₹2.5–4/min all-in metered to the tenant usage ledger. Number provisioning + IVR per BLUEPRINT directive 7 and docs/07.

### R4 — Payment gateway
C9 names "payment link"; no gateway chosen; platform billing was deferred.
**RULING: Razorpay, both roles, decided.** Platform SaaS billing = Razorpay Subscriptions (UPI AutoPay primary, card e-mandate fallback, native trials); tenant customer-collections = BYO-Razorpay payment links per tenant via `PaymentLinkPort` — platform never touches tenant funds (no PA licence needed). Detail in docs/16-billing-and-entitlements.md; verification in ./research/verify-billing.md ([Subscriptions webhooks](https://razorpay.com/docs/webhooks/subscriptions/)).
**Consequence:** D38's deferral is dead (see §2); pricing model is defined in docs/01-business-model.md; RBI payment-data localization satisfied because Razorpay holds instruments.

### R5 — PVGIS vs Google Solar source of truth
Journey implies Google Solar drives the roof; phase-10 says PVGIS drives energy and Google Solar is an enhancement.
**RULING: phase-10 wins. PVGIS is the energy source of record (SARAH3 → ERA5 ladder, labelled "Real · PVGIS"); built-in latitude-fit fallback always labelled "±10%". Google Solar is an enhancement — Building Insights cross-checks and roof-detection input — never a dependency; Gemini is the roof-detect photo fallback (shapes only, schema-enforced, temp 0).** India coverage gaps make any Google dependency a product-breaking bet.
**Consequence:** energy figures never silently switch source; the provenance line names the database. All three are server-proxied with per-tenant metering (docs/07). The journey doc's phrasing is corrected wherever quoted.

### R6 — D33 single customer link (C&I risk)
Anyone holding the link can accept a ₹92L order.
**RULING: single link stands for launch (accepted risk, as decided); named links + OTP-at-accept are designed-for now.** The `customer_links` entity carries `label` and a nullable `contact_id` from day one (docs/08-security-and-tenancy.md), and OTP-at-accept is reserved in the token format; the mitigation ships as v1.1 (UXG-11 in docs/13) with per-contact links and an MSG91 OTP challenge on Accept above a tenant-set value threshold.
**Consequence:** no schema migration needed when the mitigation lands; acceptance records capture whatever attribution exists (link id, IP, user agent) even in v1.

### R7 — Phantom step 5
The studio wizard counts a step 5 that has no screen (auto panel placement).
**RULING: folded into the Panel layout step.** The wizard presents **9 visible steps**; arrival at Panel layout offers Place manually / Auto-fill to target / Use maximum capacity (exactly as the phase-10 census describes). Internal step IDs remain stable so ported code and tests do not renumber.
**Consequence:** step indicator shows "n / 9"; docs/05-domain-migration.md maps old step IDs → new positions; no user-visible "step 5" ever exists.

### R8 — Customer merge (same person, two numbers)
Dedupe by phone cannot catch it; "offer merge later" is undesigned.
**RULING: merge flow ships v1.1; the data model is merge-ready in v1.** The customers/contacts split (docs/04) means merge = re-point contact and lead references to the survivor, mark the loser merged (never deleted), keep the audit trail.
**Consequence:** no v1 UI (UXG-05); no support back-door either — until v1.1 the duplicate pair simply coexists. Schema review in docs/04 must show the merge operation touches no money tables.

### R9 — Snooze / dormant / reopen: consolidated state machine
Triggers and timers were scattered across Stages 2/3/7.
**RULING: this table is the single definition.** All timers run as BullMQ repeatable jobs; all wake-ups land at 09:00 tenant-local time.

| State | Entry trigger | Timer / rule | Exit → target | Surfaced where |
|---|---|---|---|---|
| Unassigned | Lead created, no owner | >24 h unassigned → escalate to owner (notification; state unchanged) | Assign → Assigned (stage New) | Lead inbox; owner dashboard "needs you" |
| Snoozed | User action + wake-up date (mandatory) | Hidden from My Day until wake date | Wake at 09:00 on date → prior stage + follow-up task; "Wake up now" manual | Lead detail chip "Snoozed till …" |
| Dormant | 30 days with zero activity on any open stage | Nightly sweep flags; never deletes | Any activity → back to its stage; explicit Reopen | Leads filter; excluded from My Day |
| Disqualified | User action, reason mandatory (6 reasons) | None | Reopen (returns to prior stage, history kept) | Win/loss "disqualified early" list |
| Lost | Mark lost, reason mandatory (6 reasons) | Reason = postponed → auto-resurface on the given date; reason = not interested → no-call task suppressed 6 months | Reopen → prior stage | Win/loss "lost late" list |
| Junk | User action | Leaves all queues; never deleted | Reopen (rare) | Search only |
| Reopened | Action on Lost/Disqualified/Dormant/Junk | — | Enters at prior funnel stage | Timeline records the reopen |

**Consequence:** the lead `stage` enum and side-state fields in docs/04 implement exactly this; no screen invents a new timer.

### R10 — Agent correction training
"Corrections train nothing automatically" — mechanism undesigned.
**RULING: review-queue only, no auto-training, ever in v1.** A human correction updates the call record (outcome/summary) and emits a review-queue item; an owner explicitly promotes an answer into the knowledge base (same one-tap loop as unanswered questions). Nothing a rep types reaches the agent's behaviour without that explicit promotion.
**Consequence:** no feedback pipeline to the LLM; knowledge base remains the only behaviour input besides versioned config (D36). Keeps agent behaviour auditable per call (config version + KB version).

### R11 — Quick mode status
Proposed (steps 1/3/8/10) but never locked.
**RULING: committed. Quick mode ships in Launch-1** — steps 1, 3, 8, 10 visible; AI auto-fill for 4/5; tenant defaults for 6/7/9/11; loss-free expansion to the full builder.
**Consequence:** UXG-09 designs it; duplicate-proposal (the fastest path) and Quick mode are the two speed paths and must not diverge in validation behaviour (see R12).

### R12 — Chip-rail free navigation vs step gating
"Next disabled until valid" and "validate only at Generate" coexisted.
**RULING: free navigation everywhere in the proposal builder; validation runs at Generate ONLY. The Next-disabled rule is killed.** Generate lists every failure as a tappable jump ("Fix 2 issues to share"). The mandatory-components gate (D22) and the payable ≤ ₹0 block (D34) are Generate-time checks.
**Consequence:** applies to the proposal builder. The **studio's electrical hard gate stays** — an invalid string design still blocks the layout step's Next (phase-10 census; it protects a physical system, not form completeness).

### R13 — Catalog duplication in tenant config
Catalog listed twice; catalog/price-book overlap.
**RULING: the two-tier catalog resolves it.** One catalog surface: platform master catalog (curated, ALMM/DCR-flagged) + tenant own catalog + tenant catalog overrides; resolution order tenant-override → tenant-item → platform-item. Catalog rate history is the versioned rate history on tenant items/overrides; **`price_book_versions` exists as a separate table for non-catalog rates** (docs/04 is canon); sent proposals keep the rate version they were built with.
**Consequence:** tables `platform_catalog_items` (with `kind` column), `tenant_catalog_*`, `tenant_catalog_overrides`, plus `price_book_versions` for non-catalog rates (docs/04 is canon); the settings screen shows one catalog with a rates panel; the duplicate row in the old spec table is void.

### R14 — Offline scope boundary
"Everything else degrades gracefully" was unspecified.
**RULING: the exact boundary lives in docs/06-offline-and-sync.md; summary here is normative.**
- **Offline-full (read + write, durable queue):** physical survey capture (all groups, versioned-append), survey photos (PowerSync Attachments → Tigris, resumable), quick-add lead, activity/visit logging, task ticks, My Day + assigned leads/read cache.
- **Online-only (fail fast, honest message, never queued):** proposal generate/share, any money mutation (BOM edits, discounts, tranches, payments), design mutations (single-editor LWW + server version check), billing, agent/tenant config, imports/exports, PDF render.
- **Reads everywhere degrade to cache with a staleness banner** — money figures shown from cache carry the provisional label (money-never-stale rule).
**Consequence:** UXG-10 designs the status system; the NestJS PowerSync write connector accepts only the offline-full mutation set (idempotent, tenant-checked, versioned).

### R15 — Referral model
"Tagged and credited" with no credit model.
**RULING: v1 = tagged attribution entity only; credits ledger later.** A referral row links referrer customer → referred lead (source=referral), visible on both records and in win/loss analytics. No monetary credit, no redemption, no balance in v1.
**Consequence:** UXG-19; when a credits ledger arrives it references the existing referral rows — no backfill problem.

### R16 — Installer role gap
InstallationSheet's "crew ticks" have no crew user in v1.
**RULING: confirmed — the coordinator (Manager role) runs the checklist in v1; crew login/role is v2.** Ticks are attributed to the coordinator; an optional free-text "done by" per step captures the crew member's name. Crew sees no money because crew sees no screen.
**Consequence:** UXG-20; the six preset roles stay untouched (D27/D29); v2 adds an Installer preset without schema change (roles are already M:N).

### R17 — OPEX/PPA scope
Selectable proposal type with per-unit billing, but no PPA engine.
**RULING: OPEX/PPA is a proposal document type only in v1. A PPA billing/metering engine is an explicit non-goal**, recorded in docs/00-vision-and-scope.md. The proposal renders per-unit terms; the project after Won tracks the same stages and document checklist; no recurring invoicing, no meter ingestion.
**Consequence:** the proposal `type` enum carries CAPEX/OPEX_PPA; nothing downstream branches on it except the rendered document and the honesty label on financial projections.

### R18 — N7 provenance definition location
Referenced everywhere, defined elsewhere.
**RULING: the phase-10 definition is canonical and is adopted into `packages/domain` as a first-class type:** `measured` (on site) · `derived` (computed from model/imagery/BOM geometry) · `estimated` (heuristic from capacity+location, incl. Path B AI fill) · `assumed` (catalog defaults without design). Energy additionally carries source labelling: "Real · PVGIS ({database})" vs "Built-in estimate ±10%" (R5).
**Consequence:** every user-visible number's type includes a provenance tier; the BOM's per-line confidence, the proposal's honesty labels, and the customer link's disclaimers all read from the same enum. No screen invents a fifth tier.

---

## 2 · D1–D39 conformance table

Status legend: **HONORED** (implemented as decided) · **SUPERSEDED** (by what, when) · **PARTIAL** (which half, note).

| D | Decision (one line) | Status |
|---|---|---|
| D1 | Residential AND C&I, both high volume | HONORED — segment flag through lead/proposal; 1 kW→100 MW range (docs/11) |
| D2 | Full mobile parity at 375px incl. studio | HONORED — responsive web studio; RN app presents it via authenticated WebView |
| D3 | "Instrument" brand: graphite + brass, ink on brass | **SUPERSEDED — 2026-07-24, by the vendored UX design-system package (owner-confirmed, pixel-perfect directive):** visual identity is now `design/ds-source` — Geist typography, near-black primary `#0A0A0B`, violet accent `#5A4BFF`, iridescent atmosphere (`#7B5CFF`/`#3B82F6`/`#E85CBE`), light-only. No brass/graphite token survives anywhere. POC DESIGN-SYSTEM.md retained for interaction/a11y/product-law contracts ONLY (touch targets, no-hover-only, provenance, states, focus visibility). See §3 and ./research/ds-reconciliation.md |
| D4 | WhatsApp primary channel | SUPERSEDED — by D32 (2026, POC spec): no WhatsApp integration v1, manual copy-paste |
| D5 | Customer never logs in; tokenised link | HONORED — stateless signed tokens (docs/08); named-links mitigation designed-for (R6) |
| D6 | Tailwind + Radix; Claude Design for screens | HONORED — Tailwind v4 + Radix in `packages/ui`; Claude-Design mockup phase complete, gaps via docs/13 |
| D7 | Three audiences: owner, employees, customer | HONORED — two authenticated persona classes + anonymous link persona |
| D8 | Voice agent outbound + inbound | HONORED — Exotel+Sarvam (R3); inbound IVR per BLUEPRINT directive 7 |
| D9 | v1 = Sell + light project tracking | PARTIAL — scope honored (no inventory/PO/O&M); its 5-state shorthand deprecated by R2 |
| D10 | Agent behaviour defaults | HONORED — as tenant-editable defaults under D36 |
| D11 | Self-serve signup; billing deferred | PARTIAL — signup honored; "billing deferred" half superseded by product-owner override 2026-07-24 (billing in v1, trial-only) |
| D12 | App UI English-only | SUPERSEDED — by D25 (UI EN/HI/MR); agent language set (6) unchanged |
| D13 | Lead sources v1: manual, CSV, inbound voice | HONORED — website/WhatsApp remain "later" cards (UXG-03) |
| D14 | Manual assignment with rep load visible | HONORED — Assign screen designed at implementation (UXG-04); no auto-routing |
| D15 | Survey = assignable task, one capture flow | HONORED |
| D16 | One recommended variant to customer | HONORED — `is_recommended`; variants compare screen (UXG-08) |
| D17 | Agent triggers auto (3 rules) + on-demand | HONORED — BullMQ repeatable jobs |
| D18 | Call record: outcome + summary + signal + transcript on tap | HONORED — plus agent-config version per call (D36) and IVR-traversal markers (UXG-18) |
| D19 | Owner approves every discount | SUPERSEDED — by D34 (POC spec): no approval flow |
| D20 | Visibility: rep own / manager team / owner all | HONORED — role scoping + RLS backstop (docs/08) |
| D21 | Proposal with or without design, one builder | HONORED — Path A/B, provenance differs (R18) |
| D22 | Components mandatory on every proposal | HONORED — enforced at Generate (R12), not per-step |
| D23 | Studio lowest build priority | HONORED — restored by owner directive 2026-07-24 rev 2 (BLUEPRINT directive 10): studio builds LAST (docs/14 §3a). Flagship status, tool-census gate and scope are unchanged (directive 9) — the earlier same-day "first-class in Launch-1" ruling was reversed by the owner |
| D24 | Guided agent config + KB + unanswered loop | PARTIAL — honored, except "locked by platform" half superseded by D36 (all config tenant-editable) |
| D25 | App UI multilingual EN/HI/MR | HONORED — Lingui v5, per-user re-render, Devanagari chain (docs/10) |
| D26 | Billing screens are mocks | SUPERSEDED — by D38 (removed entirely), then by product-owner override 2026-07-24: real billing in v1; the D26-era mock is redesigned (UXG-13, docs/16) |
| D27 | Six fixed preset roles, OR-across-roles, widest visibility | HONORED |
| D28 | No per-person permission exceptions | HONORED — permissions derive purely from roles |
| D29 | Custom roles deferred; installer deferred | HONORED — coordinator=Manager runs checklist (R16); crew login v2 |
| D30 | Survey two modes: remote / physical | HONORED — remote-first residential; provenance split (R18) |
| D31 | Arc-bar mobile nav, brass centre, role-adaptive | PARTIAL — arc-bar + role-adaptive honored (RN field app + responsive web); the "brass centre" half is void with D3: the centre FAB is near-black `--action-primary` `#0A0A0B` on the white arc (mockup ground truth, ./research/ds-usage.md §3) |
| D32 | No WhatsApp integration v1; copy-paste | HONORED — `MessagingPort` ManualCopyAdapter; v2 BYO-WABA documented (docs/07) |
| D33 | C&I same single link, no per-contact links/OTP | HONORED for launch — accepted risk; mitigation designed-for (R6, UXG-11) |
| D34 | No discount approval; only arithmetic guard | HONORED — payable ≤ ₹0 blocks Generate; below-cost warns |
| D35 | Survey photos = reference, not measurement | HONORED — no LiDAR/AR/auto-measure; drone-as-imagery ok |
| D36 | Agent fully tenant-configurable, India defaults | PARTIAL — config fully tenant-owned; the statutory floor (DND scrub, 9am–9pm, DLT series, opt-out, recording retention) is enforced by our non-swappable `ComplianceGate`, not merely surfaced. Tenants configure within the law, not around it |
| D37 | Dashboards = honest periodic decision tool | HONORED — read-only, forecast never in won totals, correlation-not-attribution |
| D38 | Billing & subscription deferred | **SUPERSEDED — product-owner override 2026-07-24: payments, subscriptions, billing, entitlements, usage tracking and gateway integration are IN v1** (Razorpay, trial-only, no free tier — docs/16). Pre-commitment kept: read + export always work regardless of billing state |
| D39 | Studio kept & refactored; new repo, shared TS domain, Fly.io | HONORED — this repo; tool census (./research/phases710.md §2) is the studio acceptance checklist |

**Reading rule:** a SUPERSEDED decision is dead — do not implement it, do not partially honour it. A PARTIAL row names exactly which half survives. Any future supersession is recorded here, dated, with the superseding authority named.

---

## 3 · Design-system owner rulings (2026-07-24, final)

The canonical visual system is the vendored UX package at `design/ds-source/` (tokens/*.css, readme brand law, `_adherence.oxlintrc.json`, 21-component manifest, Geist fonts). The 22-point conflict list and its binding resolutions live in [./research/ds-reconciliation.md](./research/ds-reconciliation.md); the owner ruled the four open items as follows. Agents implement these; they do not re-litigate them.

**R19-A — Light-only v1.** Dark mode is struck from the definition of done. The DS is light-only by law and by fact (`color-scheme:light`, zero dark tokens; the readme's "(+ dark mode)" index line is false). The semantic-alias indirection (`--bg-page`, `--surface-card`, `--text-body`, …) is kept so a dark value-set can drop in later. The old "studio canvas stays dark" doctrine is dead — the mockups show a light studio (`--canvas` `#F6F7F9` / `--canvas-sunken` `#EEF0F3` wells).

**R19-B — The overline is a NAMED EXCEPTION to the 12px floor (N3).** The signature overline micro-label — **11px / 700 / uppercase / 0.12em tracking** — is the single sanctioned sub-12px use. Micro-labels only; never body, data, or interactive text. N3 otherwise stands unchanged.

**R19-C — AA-failing DS colours keep their exact hex but get RESTRICTED ROLES.** `--text-tertiary` `#A1A5AC` (~2.5:1 on white) = decorative/timestamps only, never load-bearing text — meaning-bearing overlines render in `--text-secondary` `#74787E`. `--warning` `#E9A23B` (~2.2:1 as bare text) always sits on its tinted chip `--warning-bg` `#FDF4E6`, never as bare foreground text. The N4 contrast build gate stays; the pairs file is regenerated from ds-source values with these role constraints encoded.

**R19-D — Weight 600 is SANCTIONED.** `--fw-semibold:600` becomes a token (mockups use 600 ×210 on dense desktop screens); the sanctioned weight set is **400 / 500 / 600 / 700**. The readme's "500 restricted to buttons/tabs/table-headers" clause is dead (usage overrules it — 500 ×1213).

**R19-E — "Instrument" is formally retired** (recorded in the D3 row above): graphite+brass is not the product's visual identity anywhere, for any tenant. Every visual fact now comes from ds-source; the POC DESIGN-SYSTEM.md survives only as the interaction/a11y/product-law contract layer.
