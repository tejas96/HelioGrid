# 01 · Business Model

Status: approved · Sources: `./research/market.md` (competitor pricing, firm for India tools), `./research/voice.md`, `./research/auth.md`, `./research/fly.md`, `./research/verify-billing.md` · Billing mechanics: `16-billing-and-entitlements.md`

## Who pays

**The EPC organisation pays. Nobody else.** One subscription per tenant, owner-administered, covering every employee — no per-seat pricing, ever. Indian EPCs employ many low-cost designers and field reps; per-seat pricing (Aurora: $159–259/user/mo) punishes exactly the behaviour we want — putting the whole company on the platform. India-native incumbents already price per-org (ARKA 360 ₹7,500–16,500/mo) or per-capacity (Reslink India: ₹60k/85k/1.2L per year — INR page, authoritative; see calibration note below); we do the same, priced under both at every rung, with more in the box.

The EPC's customer never pays us anything: tranche collections run through the tenant's own Razorpay account (`PaymentLinkPort`, BYO credentials) — funds settle EPC-direct, the platform never touches money, no RBI payment-aggregator exposure.

## Trial → paid (no free tier — user decision, final)

- **14-day full-feature trial.** Every feature, every tier capability, no card at signup (signup stays phone + OTP + company name, per D11). Trial caps to bound COGS: 25 AI roof detections, 15 voice-agent minutes, 5 GB storage.
- **Mandate collected at conversion, not signup.** On upgrade, Razorpay Subscriptions collects a UPI AutoPay mandate (primary — monthly tier prices sit under the ₹15,000/debit cap) or card e-mandate (fallback; required for annual plans, which exceed the UPI cap). Pre-debit notifications are Razorpay's problem, not ours (`./research/verify-billing.md`).
- **Trial expiry = soft block.** Creating new leads/designs/proposals pauses; **read and export always work regardless of billing state** — we never hold an EPC's customer data hostage (pre-committed rule, DPDP-aligned).
- **No perpetual free tier.** OpenSolar's free product is funded by distributor placement and a payments cut — a transaction-layer business we deliberately do not enter (see `12-competitive-gaps.md`). A free tier without that engine is COGS with no revenue: every design burns metered API calls.

## Pricing — org-level, capacity-tiered, under the incumbents

**Calibration note (2026-07-24, owner-supplied):** Reslink's India pricing page lists **Basic ₹60,000/yr (up to 50 kW) · Pro ₹85,000/yr (up to 500 kW, 1,000 proposals) · Premium ₹1,20,000/yr (up to 5 MW) · Enterprise custom** — lower than the USD-page figures in `./research/market.md`; the INR page is authoritative for India and is the benchmark below. Their capacity axis is the **single-design kW ceiling**; the market already thinks in that ladder, so we adopt the same axis (replacing the earlier cumulative-kWp/month meter) and undercut every rung.

Tier gates are **capacity ceilings + usage counts + metered bundles — never features** (owner-confirmed). Every feature is in every tier: CRM & projects, full studio (shadow analysis, all 11 obstruction types, tin-shed/metal-roof support, ground mount, structures, SLD + AC/DC & earthing layouts, industrial drawing sheets, PV/energy reports, DXF/SVG/PDF export), offline field app, customer links, all languages. Reslink ransoms shadow analysis, ground mount and obstruction types into higher tiers — our pricing page says so.

**Every tier bills monthly OR yearly (owner directive: affordable to EVERY EPC, with a real pay-yearly saving).** Yearly = pay for 10 months, get 12 — **2 months free (~17% off)**, one upfront payment. All prices exclude 18% GST. Price anchors are owner-set (2026-07-24): ~₹2k / ~₹4k / ~₹10k monthly, custom Enterprise.

| | **Starter** | **Growth** | **Pro** | **Enterprise** |
|---|---|---|---|---|
| **Monthly** | **₹1,999/mo** | **₹3,999/mo** | **₹9,999/mo** | custom, anchored ₹24,999+/mo |
| **Yearly (2 months free)** | **₹19,990/yr** (≈₹1,666/mo) | **₹39,990/yr** (≈₹3,333/mo) | **₹99,999/yr** (≈₹8,333/mo) | annual contract |
| vs Reslink (yearly) | **₹19,990 vs Basic ₹60,000 — 67% cheaper** | **₹39,990 vs Pro ₹85,000 — 53% cheaper** | **₹99,999 vs Premium ₹1,20,000 — 17% cheaper + voice bundle** | — |
| Single-design ceiling | 50 kW | 500 kW | 5 MW | 100 MW (utility: blocks/zones, trackers, terrain) |
| Proposals | 30/mo | 300/mo | **1,500/mo** (Reslink Pro: 1,000) | Unlimited |
| Active projects | 10 | Unlimited | Unlimited | Unlimited |
| Users | Unlimited | Unlimited | Unlimited | Unlimited |
| AI roof detections | 30/mo bundled, then ₹10 each | 100/mo bundled, then ₹10 each | 400/mo bundled, then ₹10 each | Custom |
| Voice agent | Pay-as-you-go ₹6/min | Pay-as-you-go ₹6/min | 400 min/mo bundled, then ₹6/min | Custom bundles + BYO number |
| Storage (photos, PDFs) | 10 GB | 50 GB | 250 GB | Custom |
| Support | In-app | In-app + WhatsApp | Priority + onboarding call | Named contact, dedicated manager |
| Enterprise extras | — | — | — | **White-label options** (custom domain + unbranded customer links) · **Custom integrations / public API** (the OpenAPI surface, ADR-0003) |

- **Starter is the "every EPC" tier** — a 1–5 person shop doing residential rooftops. **₹19,990/yr is a third of Reslink Basic (₹60,000/yr)** with the same 50 kW ceiling — and Starter includes the CRM, voice access (PAYG), the field app and every studio feature Reslink holds back for higher tiers. 30 proposals + 10 active projects a month comfortably covers a shop doing ~10–15 rooftops; outgrowing the caps IS the upgrade signal (owner directive: proposal/project creation restricted on the entry plan).
- **Growth** matches Reslink Pro's 500 kW ceiling at **less than half the price**, uncapped projects, 300 proposals/mo, and undercuts ARKA Lite (₹7,500/mo, 360 projects/yr, CRM extra) on the monthly axis too. The default recommendation for any EPC past ~15 installs/month or touching small C&I.
- **Pro** is the C&I tier: 5 MW single designs (= Reslink Premium's ceiling, 17% cheaper), 1,500 proposals/mo — **50% more than Reslink Pro's 1,000** — plus the 400-minute voice bundle no competitor has at any price.
- **Enterprise** is for ≥5 MW single designs, open-access and utility work — the PVcase/HelioScope crowd's budget (₹2.5L–25L/yr equivalents) makes ₹3L+/yr trivially defensible. Sales-assisted, annual contracts; white-label and public-API options live here.

**Cap enforcement is soft-block UX:** at 100% of a ceiling/count a banner appears, 7 days of grace follow, then *new* creations of that type pause until upgrade or the next cycle. Reading, editing existing records and exporting never pause. Caps reset monthly on the tenant's billing anchor; counts are plain `COUNT(*)` over the cycle window — no new metering infrastructure.

## Metered COGS: voice, detections, OTP

Three costs scale with usage, so they are metered in the usage ledger (`usage_events`, append-only, per-tenant from day one) and sold with bundle allowances:

| Meter | Our COGS | Sold at | Source |
|---|---|---|---|
| Voice-agent minutes (outbound, all-in: Exotel PSTN + Sarvam STT/TTS/LLM + DLT scrub + Fly compute) | ₹2.5–4.0/min | ₹6/min (priced ≥40% above worst-case unit COGS) | `./research/voice.md` |
| AI roof detection (Google Solar dataLayers DSM/RGB/mask ≈ ₹6.5/call, est. at $0.075 — confirm rate card; Gemini fallback ≈ ₹0.4/image, temp 0, schema-enforced) | ≈ ₹7/detection worst case | ₹10/detection beyond bundle | Unverified vendor-rate estimates — confirm official rate cards during week-1 spikes (docs/03 spikes section); POC calc audit |
| OTP (MSG91 SMS ₹0.15; WhatsApp fallback ₹0.115) | < ₹20/tenant/mo at realistic login volumes | **Not billed** — absorbed, fair-use capped | `./research/auth.md` |

PVGIS is free (public service, proxied and cached — the energy source of record costs us nothing). Google Solar and Gemini calls are server-proxied with per-tenant metering and quotas, so a runaway tenant cannot torch margin.

## Unit economics (per tenant per month)

Fixed platform infra (Fly Machines bom: web/api/worker/voice/powersync + 3-node postgres-flex + Upstash fixed plan + Tigris) ≈ ₹25,000–40,000/mo at launch scale; amortised below at 50 paying tenants and falling with density (`./research/fly.md` for the compute shape).

| COGS line | Starter (typical, ~35% burn) | Starter (worst, 100% burn) | Growth (typical, ~35% bundle burn) | Growth (worst case, 100% burn) | Pro (typical) | Pro (worst case) |
|---|---|---|---|---|---|---|
| AI detections | ₹65 (10 × ₹6.5) | ₹195 (30) | ₹230 (35 × ₹6.5) | ₹650 (100) | ₹910 (140 × ₹6.5) | ₹2,600 (400) |
| Voice minutes (bundled) | — (PAYG, self-funding) | — | — (PAYG, self-funding) | — | ₹450 (140 × ₹3.2) | ₹1,280 (400) |
| OTP | ₹10 | ₹15 | ₹15 | ₹25 | ₹20 | ₹30 |
| Compute + DB amortised | ₹300 | ₹300 | ₹300 | ₹300 | ₹400 | ₹400 |
| Storage (Tigris) | ₹10 | ₹20 | ₹60 | ₹100 | ₹150 | ₹450 |
| Razorpay fees (UPI AutoPay ~0.5% + GST) | ₹10 | ₹10 | ₹30 | ₹30 | ₹60 | ₹60 |
| **Total COGS** | **≈ ₹395** | **≈ ₹540** | **≈ ₹635** | **≈ ₹1,105** | **≈ ₹1,990** | **≈ ₹4,820** |
| **Gross margin on ₹1,999 / ₹3,999 / ₹9,999** | **≈ 80%** | **≈ 73%** | **≈ 84%** | **≈ 72%** | **≈ 80%** | **≈ 52%** |

**Ruling: gross margin ≥ 80% at typical utilisation on every self-serve tier — met (Starter ≈80%, Growth ≈84%, Pro ≈80%).** Worst-case floors at total bundle exhaustion (Starter ≈73%, Growth ≈72%, Pro ≈52%) are accepted because (a) the dominant small-tier cost is amortised fixed infra (₹300), which falls automatically with tenant density — floors climb as the base grows; (b) overage pricing (₹10/detection, ₹6/min) sits ≥40% above worst-case unit COGS the moment bundles are exceeded on every tier; (c) full-burn tenants on any tier are upgrade candidates; (d) proposal/project caps bound the non-metered load a tenant can generate. Bundles are sized so **no tier can go margin-negative**. Yearly billing trades ~17% of list for twelve months of committed cash and zero monthly-churn risk — on Starter-yearly the worst-case margin is still ≈68%.

Trial COGS is bounded at ≈ ₹300–500/trial by the trial caps — an acceptable CAC component.

## Go-to-market

1. **Ride the PM Surya Ghar wave.** 1 crore households targeted, ~76% of the funnel still open, ₹75,021 cr outlay. Our subsidy slabs are computed in the domain layer (state × capacity × DCR), not manually configured like ARKA/OpenSolar — demo this in the first 5 minutes.
2. **Replace Excel + WhatsApp, not another SaaS.** The competition for 80% of Indian EPCs is a spreadsheet. Sell the 30-second lead add, the <10-minute remote survey-to-proposal path, and the one record that survives sales → design → costing without rekeying (the #1 EPC pain point, `./research/market.md` §3).
3. **India-native compliance is the wedge.** ALMM/DCR checking at design time (only Reslink has it), GST-native BOM→proposal→tranche money path, DISCOM-aware states, DLT-registered messaging, TRAI-compliant calling. Global tools cannot follow quickly; Indian rivals lack our depth.
4. **The voice agent is the demo that closes.** No competitor at any price has an AI agent that calls the EPC's customers in six Indian languages, follows up on unopened proposals, and logs every outcome to the CRM. Lead the pitch with a live agent call; price it as bundles so it feels included, meter it so it cannot hurt margin.
5. **Channel:** founder-led sales into EPC clusters (Pune, Jaipur, Ahmedabad, Hyderabad), installer associations and distributor referrals; the demo Pune rooftop makes every first session concrete. Trial-to-paid is the only conversion metric that matters at launch.

## Pricing principles (binding)

1. **Price under ARKA and Reslink at equivalent capacity, always** — benchmarked against Reslink's INR pricing page (Basic ₹60k / Pro ₹85k / Premium ₹1.2L per year), not its higher USD page. We win on more-for-less until brand catches up; margin comes from COGS discipline, not list price.
2. **No per-seat pricing, no per-seat penalty.** Whole-company adoption is the moat.
3. **Every tier bills monthly OR yearly; yearly = 2 months free (pay 10, get 12).** Yearly is collected as a single Razorpay payment link/invoice or card e-mandate/e-NACH (every annual total incl. 18% GST exceeds the ₹15k UPI AutoPay per-debit cap — even Starter: ₹19,990 + GST = ₹23,588). Monthly rides UPI AutoPay on all tiers.
4. **Tiers gate capacity, never features.** The only runtime gating in the product is billing entitlements (plan + usage); soft-block UX; read + export always work.
5. **Metered things (voice, detections) carry bundles + overage**, each priced ≥40% above worst-case unit COGS.
6. **Prices ex-GST; we are supplier of record** — Razorpay Invoices generates GST-compliant invoices per cycle; IRN/e-invoicing obligations are ours (`16-billing-and-entitlements.md`).
7. **Grandfather generously.** Early tenants keep launch pricing for 24 months minimum; repricing is a trust event in a WhatsApp-connected market.
8. **A price for every EPC (owner directive).** Starter exists so price is never the reason a small EPC stays on Excel: entry ≈₹2,000/mo (owner-set anchor); a year of Starter costs a third of Reslink Basic and less than three months of ARKA Lite.
9. **Proposal/project creation is capped per tier (owner directive)** — visible, generous counts (30 / 300 / 1,500 / unlimited proposals per month; Starter additionally capped at 10 active projects) that beat Reslink's equivalents at every rung (their Pro caps at 1,000 proposals). Caps are upgrade signals and abuse bounds, never feature ransoms; enforcement is soft-block with read + export always working.
