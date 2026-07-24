# 12 · Competitive Gaps

Status: approved · Source: `./research/market.md` (pricing firm for India tools; Aurora/HelioScope/PVcase tiers are reviewer estimates) · Pricing response: `01-business-model.md`

Competitors of record: **ARKA 360** ([arka360.com/pricing-in](https://www.arka360.com/pricing-in)) · **Reslink Energy** ([reslink.org](https://www.reslink.org/)) · **Aurora Solar** · **OpenSolar** ([OS 3.0](https://www.opensolar.com/post/news/opensolar-launches-os-3-0-the-worlds-first-free-ai-powered-solar-operating-system/), [CashFlow](https://www.opensolar.com/post/news/opensolar-launches-cashflow-payments-system/)) · **HelioScope** (Aurora-owned) · **PVcase** (+RatedPower). Referenced in gaps: **Enact** (monitoring), **Pylon** ([per-design pricing](https://getpylon.com/pricing/)).

## Feature matrix — HelioGrid v1 spec vs the field

✔ full · ◐ partial · ✖ absent. "HG" = HelioGrid as specified for v1 (Launch-1 + Launch-2).

| Capability | HG | ARKA 360 | Reslink | Aurora | OpenSolar | HelioScope | PVcase |
|---|---|---|---|---|---|---|---|
| 3D rooftop design + shading | ✔ flagship | ✔ | ✔ | ✔ best-in-class | ✔ | ◐ C&I-oriented | ✖ (CAD utility) |
| Full design parity on mobile (375 px, touch) | ✔ | ✖ | ✔ mobile-first | ✖ | ◐ | ✖ | ✖ |
| Offline field capture (survey, photos) | ✔ PowerSync | ✖ | ◐ | ✖ | ✖ | ✖ | ✖ |
| AI roof detection w/ confidence + review | ✔ Google Solar + Gemini fallback | ◐ | ◐ tracing | ✔ | ✔ OS 3.0 | ✖ | ✖ |
| LiDAR/DSM measurement | ✖ (D35) | ✖ | ✖ | ✔ | ✖ | ✖ | ◐ terrain |
| Energy simulation w/ provenance labels | ✔ PVGIS SARAH3→ERA5, labelled | ✔ | ✔ NASA data | ✔ NREL-grade | ✔ | ✔ bankable | ✔ via RatedPower |
| Electrical sizing + autostring + SLD | ✔ IEC 62548 ladders | ✔ manual stringing | ◐ | ✔ | ◐ | ✔ | ✔ cabling |
| Micro-inverter / optimiser design | ◐ (catalog, no MLPE electrical model) | ✔ | ✖ | ✔ | ◐ | ✔ | ✖ |
| Auto-BOM with per-field overrides + provenance | ✔ 6 emitters | ◐ | ✔ | ◐ | ◐ | ✖ | ◐ |
| Two-tier catalog + versioned price books | ✔ | ✖ | ◐ local DB | ✖ | ◐ | ✖ | ✖ |
| CRM + pipeline included in base price | ✔ | ✖ paid add-on | ✔ | ◐ sales mode | ✔ | ✖ | ✖ |
| Proposal + no-login customer accept link | ✔ tokenised lifecycle | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ |
| ALMM/DCR compliance checking | ✔ (elevated — see gap 1) | ✖ | ✔ only rival | ✖ | ✖ | ✖ | ✖ |
| Subsidy computation (PM Surya Ghar slabs) | ✔ computed in domain | ◐ manual config | ✔ | ✖ | ◐ manual config | ✖ | ✖ |
| DISCOM selection / paperwork | ◐ selection + blocker attribution | ✖ | ◐ selection | ✖ | ✖ | ✖ | ✖ |
| GST-native money path (BOM↔proposal↔tranches) | ✔ to the paisa | ◐ | ◐ | ✖ | ✖ | ✖ | ✖ |
| Financing marketplace / lender integration | ✖ EMI calc only | ✖ | ✖ | ✔ US lenders | ✔ | ✖ | ✖ |
| Payments / collections | ✔ BYO-Razorpay tranche links | ✖ | ✖ | ✖ | ✔ CashFlow (takes cut) | ✖ | ✖ |
| Post-sale monitoring / O&M | ✖ (D9) | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| Utility-scale: blocks/tables, trackers, terrain | ◐ scale program (committed ramp) | ✖ | ◐ ≤5 MW | ✖ | ✖ | ✔ large arrays | ✔ category leader |
| CAD / PVsyst / SketchUp export | ✖ v1 | ✔ | ✖ | ◐ | ✖ | ◐ | ✔ AutoCAD-native |
| Public API | ◐ OpenAPI 3.1 emitted; keys later | ✔ | ✖ | ✔ | ✔ | ✔ | ✖ |
| AI voice agent (outbound + inbound, 6 languages) | ✔ unique | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| Vernacular UI (EN/HI/MR) + Devanagari-correct PDFs | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| Provenance tiers + money-staleness honesty system | ✔ unique | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |

## Every gap, with a verdict

Verdicts: **ADOPT-NOW** (in v1 spec, build it) · **DESIGN-FOR** (port/seam exists in v1; adapter or module lands later without rework) · **SKIP-DELIBERATELY** (named non-goal; do not build it by accident).

| # | Gap (who has it) | Verdict | Why |
|---|---|---|---|
| 1 | **ALMM/DCR compliance checking** (Reslink, sole rival) | **ADOPT-NOW** | Elevated from data flags to a checked feature: platform catalog items carry MNRE ALMM list references + DCR flags; a DRC rule fails the BOM/proposal when the subsidy path requires DCR and a component isn't compliant — prevents the costliest rework in Indian EPC, and only one competitor has it. |
| 2 | **PM Surya Ghar subsidy automation** (Reslink ✔; ARKA/OpenSolar manual slabs) | **ADOPT-NOW** | Already in the ported domain (`subsidyInr(kwp, residential, dcrEligible)`); slabs ship as versioned injected market config so slab revisions are data updates, not releases. |
| 3 | **DISCOM selection + state-specific application packets** (Reslink partial; nobody does packets) | **DESIGN-FOR** | v1: Site carries DISCOM, blockers attribute the wait, document checklist tracks the application. Packets are a `DocumentRenderPort` template family added post-launch — the render pipeline (Playwright, Devanagari-correct) already exists. |
| 4 | **Financing marketplace** (OpenSolar lender referral; Aurora US financing) | **DESIGN-FOR** | v1 ships the EMI calculator only. A `FinancingPort` (eligibility → application → status webhook) is the India analog of OpenSolar's model — PSU bank/NBFC adapters post-launch. Referral revenue is upside, never load-bearing for margin. |
| 5 | **CashFlow-style platform payments cut** (OpenSolar) | **SKIP-DELIBERATELY** | Taking a cut of customer payments makes us a regulated money-mover (RBI PA licence). BYO-Razorpay keeps funds EPC-direct and us out of scope; Razorpay Route stays a documented alternate adapter only. |
| 6 | **Monitoring / O&M / end-customer app** (Enact ENGAGE, $150–5,000/yr per asset) | **SKIP-DELIBERATELY** | D9: v1 is the selling engine. Commissioning artefacts are retained at handover so an O&M module can attach post-v1 — but no monitoring code, telemetry ingestion or customer app in v1. |
| 7 | **LiDAR / imagery-derived measurement** (Aurora) | **SKIP-DELIBERATELY** | D35: photos are reference, never measurement. Indian LiDAR/high-res DSM coverage is too thin to be honest about; our remote survey already uses Google Solar DSM where it exists, with confidence shown and a physical-survey fallback. |
| 8 | **Utility-scale terrain + AutoCAD workflows** (PVcase, HelioScope) | **DESIGN-FOR** | The scale program is committed v1 ramp: blocks/tables/zones model, GPU shadow-map shading, single-axis trackers with GCR backtracking, GLO-30 DEM import. Terrain-following articulation and utility autorouting defer; AutoCAD-native is never — we are browser-native by identity. |
| 9 | **PVsyst / SketchUp / CAD export** (ARKA; PVcase) | **DESIGN-FOR** | C&I lenders ask for PVsyst-bankable files. The BOM engine's emitter architecture takes new emitters cheaply; PVsyst-compatible + DXF exports are post-launch emitters, not re-architecture. |
| 10 | **Bankable P50/P90 yield reports** (HelioScope) | **DESIGN-FOR** | PVGIS TMY + PR ladder are in place; uncertainty bands and exceedance statistics are an additive reporting layer on the same energy model, needed when Enterprise/utility tenants arrive. |
| 11 | **Per-design pay-as-you-go pricing** (Pylon $4–10/design) | **SKIP-DELIBERATELY** | Capacity tiers align our price to EPC revenue and keep ARPU predictable; PAYG fragments revenue and complicates entitlements. The ₹1,999/mo Starter tier (01) already serves seasonal micro-installers; revisit only if they churn even on the Starter floor. |
| 12 | **Free tier** (OpenSolar) | **SKIP-DELIBERATELY** | User decision: trial-only. OpenSolar's free is funded by distributor placement + payments cut (gaps 5, 13) — without that engine a free tier is pure metered COGS. |
| 13 | **Partner-funded distributor placement in catalog** (OpenSolar) | **SKIP-DELIBERATELY** | The two-tier catalog's neutrality is a trust wedge with EPCs. If ever revisited, only as clearly-labelled sponsored listings — never silent ranking. |
| 14 | **WhatsApp-native proposal sending** (no incumbent has it natively — market gap, not competitor feature) | **DESIGN-FOR** | D32 stands for v1: ManualCopyAdapter behind `MessagingPort`. v2 = BYO-WABA via Meta Embedded Signup (tenant owns the number and reputation). The port boundary means zero rework. |
| 15 | **MLPE (micro-inverter/optimiser) electrical design** (ARKA, Aurora, HelioScope) | **DESIGN-FOR** | Catalog holds the components in v1; the string-sizing ladder gains an MLPE branch later. Indian residential is string-inverter-dominated, so this follows demand, not launch. |
| 16 | **Public API with keys/quotas** (ARKA, Aurora, OpenSolar) | **DESIGN-FOR** | ts-rest emits OpenAPI 3.1 from day one (customer-link endpoints + webhooks already public); tenant API keys and quotas are a thin layer post-launch. |
| 17 | **CRM as included, not add-on** (ARKA charges extra) | **ADOPT-NOW** | Already our pricing stance (`01-business-model.md`): every feature in every tier; CRM inclusion is a stated selling line against ARKA. |
| 18 | **White-label options** (Reslink Enterprise) | **DESIGN-FOR** | Tenant branding on customer documents is all-tiers already (docs/10); full white-label (custom domain for customer links + unbranded portal) is an Enterprise option (owner-confirmed 2026-07-24). Custom-domain routing designed at the customer-link module; built when the first Enterprise deal asks. |
| 19 | **Custom integrations / partner API** (Reslink Enterprise; ARKA API) | **DESIGN-FOR** | Owner-confirmed Enterprise differentiator: tenant API keys + webhook subscriptions over the already-emitted OpenAPI 3.1 surface (gap 16 is the same engineering; this row is its Enterprise packaging). |

## Reslink feature-list coverage check (owner-supplied pricing page, 2026-07-24)

Every feature Reslink lists on its tier cards, mapped to HelioGrid — **all available on every HelioGrid tier** (they gate most into higher tiers; that contrast is a selling line):

| Reslink lists (tier they gate it to) | HelioGrid equivalent (tier) |
|---|---|
| CRM & Project Management (Basic+) | Full CRM + 9-stage projects module — every tier |
| Proposal Editing (Basic+) | 11-step builder, versions, Path A/B — every tier (counts per 01) |
| 3D Export & SLD (Basic+) | SLD + drawing sheets, DXF/SVG/PNG/PDF export — every tier |
| PV Report (Basic+) | PVGIS energy report (monthly, losses, 25-yr, provenance-labelled) — every tier |
| AC/DC & Earthing Layout (Basic+) | SLD with DCDB/ACDB/SPD/isolators/earthing pits + cable routing + IS/IEC ladders — every tier |
| Tin Shed Support (Basic+) | `metal_shed` roof type with monorail structure — every tier |
| Detailed Structure Analysis (Pro+) | Parametric member/steel model + foundations (honest: material estimate + engineer sign-off, never a computed safety verdict) — every tier |
| Advanced Shadow Analysis (Pro+) | Per-panel raycast solar access, monthly heatmap, sun-path simulation — every tier |
| Detailed Energy Reports (Pro+) | Full loss breakdown, specific yield, PR, degradation — every tier |
| Standard / All Obstruction Types (Pro/Premium) | All 11 obstruction types incl. bridging + convert-to-platform — every tier |
| Design Location Editing (Pro+) | Pin placement + relocation guard + calibration + north offset — every tier |
| Industrial Drawings (Premium+) | Title-blocked drawing sheets (SLD, PV layout, string route, structure) — every tier |
| Ground Mount Design (Premium+) | Ground arrays (flat v1; trackers/terrain in scale program) — every tier |
| Advanced Structures (Premium+) | Structure presets + full parametric customisation — every tier |
| Priority Support (Premium+) | Pro+ (support is the one ladder we also climb) |
| Unlimited Projects (Enterprise) | Growth+ (Starter capped at 10 active — owner directive) |
| White-Label Options (Enterprise) | Enterprise (gap 18) |
| Custom Integrations (Enterprise) | Enterprise (gap 19) |
| SLA / Dedicated Account Manager (Enterprise) | Enterprise: dedicated manager; contractual SLA at sales discretion (not pre-committed) |

## What nobody else has

The moat, stated once and defended everywhere:

1. **The AI voice agent** — outbound follow-up + inbound answering in Hindi/Marathi/Gujarati/Tamil/Telugu/English, TRAI-compliant by construction (`ComplianceGate`: daily DND scrub, 9am–9pm, disclosure ≤30 s), every call transcribed to the lead timeline, per-tenant numbers and IVR. No competitor at any price has this.
2. **The provenance/honesty system** — measured/derived/estimated/assumed on every number, money-never-stale, "Indicative proposal" labelling, engineer sign-off instead of computed structural claims, correlation-not-attribution on agent impact. Competitors print confident numbers; we print defensible ones.
3. **Offline-first field app** — PowerSync-backed surveys, photos and My Day that work in a basement DB room or a village with no signal, then sync. Mobile-first rivals still assume connectivity.
4. **Vernacular UI** — EN/HI/MR interface, per-user language, Devanagari-correct PDFs, ₹ lakh/crore grouping everywhere. The field workforce is not English-first; no rival acknowledges this.
5. **Two-tier catalog with tenant price overrides** — platform master catalog (ALMM-referenced) + tenant catalog + tenant overrides, with versioned price books so sent quotes never mutate. Closest rival (Reslink's local DB) has no override/versioning layer.
6. **Org pricing with unlimited seats under incumbent prices** — a business-model feature: whole-company adoption is what makes the single-record pipeline (the #1 pain point) actually work.
