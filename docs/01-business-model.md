# 01 · Business Model

Status: approved · Sources: `./research/market.md` (competitor pricing, firm for India tools), `./research/voice.md`, `./research/auth.md`, `./research/fly.md`, `./research/verify-billing.md` · Billing mechanics: `16-billing-and-entitlements.md`

## Who pays

**The EPC organisation pays. Nobody else.** One subscription per tenant, owner-administered, covering every employee — no per-seat pricing, ever. Indian EPCs employ many low-cost designers and field reps; per-seat pricing (Aurora: $159–259/user/mo) punishes exactly the behaviour we want — putting the whole company on the platform. India-native incumbents already price per-org (ARKA 360 ₹7,500–16,500/mo) or per-capacity (Reslink $949–1,899/yr); we do the same, priced under both, with more in the box.

The EPC's customer never pays us anything: tranche collections run through the tenant's own Razorpay account (`PaymentLinkPort`, BYO credentials) — funds settle EPC-direct, the platform never touches money, no RBI payment-aggregator exposure.

## Trial → paid (no free tier — user decision, final)

- **14-day full-feature trial.** Every feature, every tier capability, no card at signup (signup stays phone + OTP + company name, per D11). Trial caps to bound COGS: 25 AI roof detections, 15 voice-agent minutes, 5 GB storage.
- **Mandate collected at conversion, not signup.** On upgrade, Razorpay Subscriptions collects a UPI AutoPay mandate (primary — monthly tier prices sit under the ₹15,000/debit cap) or card e-mandate (fallback; required for annual plans, which exceed the UPI cap). Pre-debit notifications are Razorpay's problem, not ours (`./research/verify-billing.md`).
- **Trial expiry = soft block.** Creating new leads/designs/proposals pauses; **read and export always work regardless of billing state** — we never hold an EPC's customer data hostage (pre-committed rule, DPDP-aligned).
- **No perpetual free tier.** OpenSolar's free product is funded by distributor placement and a payments cut — a transaction-layer business we deliberately do not enter (see `12-competitive-gaps.md`). A free tier without that engine is COGS with no revenue: every design burns metered API calls.

## Pricing — org-level, capacity-tiered, under the incumbents

The meter is **cumulative kWp of new designs created per calendar month** — the honest proxy for how much business the EPC is winning, and the same axis Reslink trained the market on. Tiers differ **only** in capacity and bundled usage. Every feature is in every tier: CRM, unlimited proposals, full studio, offline field app, customer links, all languages. No feature ransom.

All prices exclude 18% GST. Annual = 10 × monthly (2 months free, ~17% — market norm is aggressive annual discounting).

| | **Growth** — ₹4,999/mo (₹49,999/yr) | **Pro** — ₹9,999/mo (₹99,999/yr) | **Enterprise** — custom, anchored ₹24,999+/mo |
|---|---|---|---|
| Design capacity | 200 kW cumulative/mo | 2 MW cumulative/mo | Unmetered |
| Single-design ceiling | 100 kW | 5 MW | 100 MW (utility: blocks/zones, trackers, terrain) |
| Users | Unlimited | Unlimited | Unlimited |
| AI roof detections | 100/mo bundled, then ₹10 each | 400/mo bundled, then ₹10 each | Custom |
| Voice agent | Pay-as-you-go ₹6/min | 400 min/mo bundled, then ₹6/min | Custom bundles + BYO number |
| Storage (photos, PDFs) | 50 GB | 250 GB | Custom |
| Support | In-app + WhatsApp | Priority + onboarding call | Named contact, SLA |

- **Growth** fits a residential-focused EPC doing ~40–60 rooftops/month (3–5 kW each). It undercuts ARKA Lite (₹7,500/mo, 360 projects/yr cap, CRM extra) and Reslink Basic (~₹6,500/mo-equivalent, ≤50 kW per project) while including CRM, voice access and the field app.
- **Pro** is the C&I tier: 5 MW single designs cover virtually all rooftop C&I, plus the voice bundle. It undercuts ARKA Premium (₹16,500/mo) and Reslink Premium (~₹13,100/mo-equivalent).
- **Enterprise** is for ≥5 MW single designs, open-access and utility work — the PVcase/HelioScope crowd's budget (₹2.5L–25L/yr equivalents) makes ₹3L+/yr trivially defensible. Sales-assisted, annual contracts.

**Capacity enforcement is soft-block UX:** at 100% a banner appears, 7 days of grace follow, then *new* design creation pauses until upgrade or the next cycle. Reading, editing existing designs and exporting never pause.

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

| COGS line | Growth (typical, ~35% bundle burn) | Growth (worst case, 100% burn) | Pro (typical) | Pro (worst case) |
|---|---|---|---|---|
| AI detections | ₹230 (35 × ₹6.5) | ₹650 (100) | ₹910 (140 × ₹6.5) | ₹2,600 (400) |
| Voice minutes (bundled) | — (PAYG, self-funding) | — | ₹450 (140 × ₹3.2) | ₹1,280 (400) |
| OTP | ₹15 | ₹25 | ₹20 | ₹30 |
| Compute + DB amortised | ₹300 | ₹300 | ₹400 | ₹400 |
| Storage (Tigris) | ₹60 | ₹100 | ₹150 | ₹450 |
| Razorpay fees (UPI AutoPay ~0.5% + GST) | ₹30 | ₹30 | ₹60 | ₹60 |
| **Total COGS** | **≈ ₹635** | **≈ ₹1,105** | **≈ ₹1,990** | **≈ ₹4,820** |
| **Gross margin on ₹4,999 / ₹9,999** | **≈ 87%** | **≈ 78%** | **≈ 80%** | **≈ 52%** |

**Ruling: gross margin ≥ 80% at Growth tier at typical utilisation — met (≈87%), with a worst-case floor of ≈78% if a tenant burns every bundled unit.** Pro's floor of ≈52% at total bundle exhaustion is acceptable because overage pricing (₹10/detection, ₹6/min) sits ≥40% above worst-case unit COGS the moment bundles are exceeded, and full-burn tenants are upgrade candidates. Bundles are sized so no tier can go margin-negative.

Trial COGS is bounded at ≈ ₹300–500/trial by the trial caps — an acceptable CAC component.

## Go-to-market

1. **Ride the PM Surya Ghar wave.** 1 crore households targeted, ~76% of the funnel still open, ₹75,021 cr outlay. Our subsidy slabs are computed in the domain layer (state × capacity × DCR), not manually configured like ARKA/OpenSolar — demo this in the first 5 minutes.
2. **Replace Excel + WhatsApp, not another SaaS.** The competition for 80% of Indian EPCs is a spreadsheet. Sell the 30-second lead add, the <10-minute remote survey-to-proposal path, and the one record that survives sales → design → costing without rekeying (the #1 EPC pain point, `./research/market.md` §3).
3. **India-native compliance is the wedge.** ALMM/DCR checking at design time (only Reslink has it), GST-native BOM→proposal→tranche money path, DISCOM-aware states, DLT-registered messaging, TRAI-compliant calling. Global tools cannot follow quickly; Indian rivals lack our depth.
4. **The voice agent is the demo that closes.** No competitor at any price has an AI agent that calls the EPC's customers in six Indian languages, follows up on unopened proposals, and logs every outcome to the CRM. Lead the pitch with a live agent call; price it as bundles so it feels included, meter it so it cannot hurt margin.
5. **Channel:** founder-led sales into EPC clusters (Pune, Jaipur, Ahmedabad, Hyderabad), installer associations and distributor referrals; the demo Pune rooftop makes every first session concrete. Trial-to-paid is the only conversion metric that matters at launch.

## Pricing principles (binding)

1. **Price under ARKA and Reslink at equivalent capacity, always.** We win on more-for-less until brand catches up; margin comes from COGS discipline, not list price.
2. **No per-seat pricing, no per-seat penalty.** Whole-company adoption is the moat.
3. **Annual = 2 months free**, collected via card e-mandate/e-NACH or one-off payment link (annual totals exceed the ₹15k UPI AutoPay cap).
4. **Tiers gate capacity, never features.** The only runtime gating in the product is billing entitlements (plan + usage); soft-block UX; read + export always work.
5. **Metered things (voice, detections) carry bundles + overage**, each priced ≥40% above worst-case unit COGS.
6. **Prices ex-GST; we are supplier of record** — Razorpay Invoices generates GST-compliant invoices per cycle; IRN/e-invoicing obligations are ours (`16-billing-and-entitlements.md`).
7. **Grandfather generously.** Early tenants keep launch pricing for 24 months minimum; repricing is a trust event in a WhatsApp-connected market.
