> **ARCHIVED 2026-07-30 — NOT BINDING. Do not cite this file.**
>
> This was the original planning-session output. Its architecture content is duplicated —
> and kept current — in docs/02, docs/03, docs/16 and the ADRs. Its owner-directive list and
> user-decisions log moved to **docs/15 §4**, where amendments are stated above the wording
> they supersede.
>
> Retained for provenance only. **Its telephony directive (7) in particular contains pre-S5
> wording that ADR-0019 overturned** — BYO-as-porting and AgentStream DTMF-send are both
> false. Reading directive 7 here, top-down, yields dead law.

# HelioGrid — Final Production Architecture & Planning Blueprint (docs only, no app code this session)

## Context

The POC at `/Volumes/works-space/Solar-App-POC` is complete as a spec + validated engineering core:
- **Spec**: `docs/product-journey.md` (master, D1–D39 locked decisions), phase-3…10 prompt packs, DESIGN-SYSTEM.md ("Instrument": graphite+brass — visual identity since superseded 2026-07-24 by the vendored UX package `design/ds-source`, see docs/15 §3; the N1–N10 hard rules survive as interaction/a11y law), 85 UX mockups in `design/mockups/` (vendored 2026-07-24; production specs, 375/1440 viewports, seeded states).
- **Engineering moat**: `src/features/solar-studio/lib` is an almost-pure isomorphic TS domain layer (~40 modules; only 4 import three.js as math; zero React/storage imports in core). Roof geometry factories (gable/hip/straight-skeleton), layout engine, electrical sizing (IEC 62548 ladders, string windows, autostring), BOM engine (6 emitters, per-field overrides, provenance tiers), PVGIS energy model, shading raycaster, structure/foundation parametrics, finance (PM Surya Ghar, GST), DRC, health score, insights, ~110 gate-oriented tests.
- **Everything SaaS-shaped is fake/absent**: no backend/DB/auth/tenancy; localStorage persistence; local-only share links; 4 env-var API proxies; one vestigial 10 kW freemium gate (dies).

This session produces **planning documents only**, written to the new repo dir `/Volumes/works-space/heliogrid/` (user-approved). The user's final-review directives (below) are the top-layer constraints and override earlier picks where they conflict.

## FINAL-REVIEW DIRECTIVES (user-confirmed — binding)
1. **Backend: NestJS.**
2. **Fly-native storage/services only initially (no AWS).**
3. **Mobile: pure/bare React Native (NO Expo), iOS + Android from day one.**
4. **Payments, subscriptions, billing, entitlements, usage tracking, gateway integration are IN the initial product** — supersedes D38 (recorded as product-owner override, 2026-07-24). Trial-only, no free tier (earlier user decision stands).
5. **Production timeline (owner directive 2026-07-24, final): the ENTIRE product ships in ONE 20-day build — no Launch-2, no v1.1, no "later" buckets.** Everything in the journey (CRM, billing, catalog, proposals, customer links incl. named-links/OTP-at-accept, both survey modes, voice agent, projects, dashboards, notifications/search, bare-RN mobile app, studio port, offline) lands by Day 20; studio + offline remain the LAST tracks inside the window (directive 10). Only third-party approval clocks (DLT/Exotel KYC/store review — code ships, activation follows), spec-locked exclusions (D32/D29/D35/D9), and utility-scale studio enhancements (scale Phases B/C) sit outside the window. docs/14 is the plan of record.
6. Long-term scalability, global expansion, clean code, AI-assisted development, maintainability, production ops — without unnecessary complexity.
7. **Voice-agent telephony fully configurable per tenant**: tenant may use a **platform-provisioned number** (Exotel Exophone, default) **or bring/port their own number** (hosted/ported with KYC — subject to TRAI CLI rules, which generally require operator-assigned CLIs; BYO = number hosting/porting flow, not raw caller-ID spoofing). **IVR capability both directions**: inbound — per-tenant IVR flow builder (greeting → menu → route to AI agent / human / voicemail, business-hours aware); outbound — the agent must be able to **navigate through IVR menus (DTMF send + tone/prompt detection)** when a call lands on an IVR. `TelephonyProvider` port grows `sendDtmf()`, `onDtmf()`, `ivrFlow` config; Exotel supports IVR applets + DTMF over AgentStream — exact BYO-number porting mechanics are a week-1 verification spike.
   **[Amended 2026-07-26 — owner directive + spike S5; binding form is ADR-0019.]** Telephony is a **provider-agnostic platform capability framework**: capability-negotiated port family (core + optional DTMF/transfer/conference/recording/monitoring/voicemail/queueing interfaces), a provider-agnostic call-control plane (warm/cold transfer with pinned AI context + whisper summaries, tenant-configurable multi-level escalation chains, callback queues, defined degradation ladders), routing policies as versioned tenant data. Reality corrections from S5: **BYO = inbound forwarding to the ExoPhone — no porting of outbound CLI**; **DTMF-send is a declared capability and is absent on Exotel AgentStream** (IVR traversal degrades honestly until a capable adapter exists); **1600-series is closed to non-BFSI — promotional outbound uses the 140-series RTM route**. Launch builds only launch scope; all advanced capabilities are seams, not code.
8. **No feature-flag system** (user directive): features ship enabled when merged — no flag infrastructure, no dark launches, no flag-strategy doc section. The ONLY runtime gating in the product is billing entitlements (plan/usage), and incomplete features simply don't merge. (Trunk discipline: small, complete, verifiable slices instead of flagged partial work.)
9. **The 3D Design Studio is THE flagship feature — nothing is compromised against it.** The phase-10 tool census (docs/research/phases710.md §2, screens 10.1–10.11) is the binding acceptance checklist for the studio port: **every tool and every computed output survives**, refactored to the design system, touch-first, with the scale program (blocks/zones, GPU shading, trackers, terrain) treated as investment INTO the studio moat — never as a reason to cut studio capability. Mobile presents the full-parity touch studio (responsive web at 375px per D2) through an authenticated seamless WebView; no studio feature is dropped on any surface.
10. **Build-order amendment (owner directive, 2026-07-24 rev 2): the studio port/enhancement and the offline layer are the LAST build phases.** The studio moves last because a validated implementation already exists in the POC (this re-honours D23); offline moves last because nothing at launch depends on it. This moves the studio in TIME only — never in scope or quality: the census gate, DS-refactor targets and scale program are unchanged. Within the 20-day build (directive 5), the earlier tracks sell end-to-end on Path B proposals + remote survey; Path A activates when Track D (studio, Days 14–18) lands. Offline (PowerSync) is the very last track (Track E); until then mobile is online-first behind a repository abstraction (docs/14).

## Earlier user directives (still binding)
- Thin test safety net only: strict typecheck+lint gates + locked invariant set for money math, tenant isolation, migrations; port POC domain tests as-is; no routine unit-test authoring (testing program designed post-release).
- Benchmark pricing vs **Reslink Energy** (India INR page authoritative: ₹60k/₹85k/₹1.2L per yr — owner-supplied 2026-07-24, supersedes the $949–1,899 USD page), **ARKA 360** (₹7.5k–16.5k/mo org), **Aurora** ($159–259/user/mo), **OpenSolar** (free): price BELOW, more features, healthy margin. Final tiers: docs/01.
- **1 kW → 100 MW** design range with credible scale path; cover POC gaps (ground mount v1-only, no trackers/terrain, O(n²) shading, single projection origin).
- Competitive gap analysis first-class; UX gaps registered for implementation-time design.
- **Two-tier catalog**: platform master catalog + tenant own catalog + tenant price overrides; resolution: tenant-override → tenant-item → platform-item.
- Consistency & stability over cleverness; **Claude/AI-agent rules are the most important deliverable**.

## Exploration & research artifacts (source material for execution)
The corpus lives at `docs/research/` inside this repo. (Provenance note: originally produced in the POC session scratchpad at `/private/tmp/claude-501/-Volumes-works-space-Solar-App-POC/542a87c5-335c-40db-adb9-f6278f02b6af/scratchpad/`.)
- Exploration: journey.md (journey map, D-census, business rules, entities, 18 spec ambiguities) · buildplan.md · phases710.md (full studio tool census) · design.md (token portability) · geo3d.md (purity/coupling audit + scale cliffs) · calc.md (calc modules, API usage, provenance systems) · appShape.md · uxAL.md / uxMZ.md (85-screen catalogue + UX gaps) · market.md (competitor pricing w/ sources).
- Research: fly.md, backend.md, auth.md, voice.md, tooling.md, integrations.md, sync.md, scale3d.md + `verify-*.md` (NestJS contracts, bare-RN, Fly-native, billing) — all July-2026-verified with URLs.

---

## FINAL ARCHITECTURE (end-to-end reviewed, internally consistent)

### Monorepo
pnpm workspaces + Turborepo + TS project references (ship source; references for typecheck ordering + boundaries). **Biome v2.5** (single lint/format binary) + **dependency-cruiser** (layer rules: domain never imports db/api; no cycles) + **sherif** (version drift) + **Turborepo Boundaries** (package encapsulation).
- `apps/web` — Next.js (pure frontend/BFF; no domain logic)
- `apps/api` — **NestJS** (Node 22): modular monolith — modules: auth, tenancy, crm, survey, design, proposal, customer-link, projects, payments/billing, catalog, agent(voice), notifications, admin
- `apps/worker` — NestJS standalone app: BullMQ processors (shading sim, PDF render, imports, agent post-processing)
- `apps/voice` — NestJS standalone: CallSession orchestrator (Exotel AgentStream ↔ Sarvam STT/TTS/LLM)
- `apps/mobile` — **bare React Native** (iOS + Android)
- `packages/`: `domain` (ported studio engines; rules/catalog injected — kill the `resolveRules()` global), `contracts` (ts-rest contract + Zod schemas), `db` (Drizzle schema + migrations), `adapters` (port implementations), `ui` (web components), `tokens` (Style Dictionary (shorthand — the canonical mechanism is the bespoke `packages/tokens/build.ts` CSS parser, docs/10 §2) → CSS vars + RN theme), `i18n` (Lingui catalogs EN/HI/MR), `config`.

### API & contracts
**NestJS + ts-rest (@ts-rest/nest)** — single contract package gives end-to-end typed clients (Next.js + bare RN) AND emitted OpenAPI 3.1 (public customer-link endpoints, webhooks, future public API). **Zod pinned 3.x** until ts-rest Zod-4 support leaves RC (`nestjs-zod` where DTO validation is needed). Rejected: @orpc/nest (beta, ESM-only), Hono (user override), Swagger-codegen-only (drift). Realtime: **SSE** (Nest-native) for notifications/design staleness; WebSockets only if collaborative editing lands.

### Data layer
**Drizzle ORM** on Postgres. Tenancy: single DB, shared schema, `tenant_id` everywhere; app-layer scoping primary + **Postgres RLS backstop** (`SET LOCAL app.tenant_id` from verified JWT claim; app role without BYPASSRLS). Relational spine (tenants, users, roles, leads, customers, sites, surveys+photos, designs+variants, proposals+versions+tranches, projects+documents+blockers, catalog, price-book versions, agent config/calls/knowledge, notifications, tokenised links, audit log) + **JSONB design payload** (POC `Project` shape; normalize-on-load + fingerprint staleness ported). Server-assigned numbers (proposal no. etc.). Two-tier catalog tables (`platform_catalog_*`, `tenant_catalog_*`, overrides). Per-tenant usage ledger from day one.

### Database & infra (Fly-native per directive)
- Fly Machines in `bom` (capacity-tight: web/api `min_machines_running=1`; `sin` overflow fallback). **One Fly app per service** (ADR-0018): heliogrid-web, heliogrid-api, heliogrid-worker (autostop=off, larger machines), heliogrid-voice, heliogrid-powersync (prebuilt `journeyapps/powersync-service` image) — plus the postgres-flex cluster app and log-shipper, connected over 6PN/flycast.
- **DB: Fly postgres-flex (unmanaged) in bom — ⚠️ flagged risk: Fly has DEPRECATED unmanaged Postgres (self-support only; wal-g not bundled).** User chose Fly-native; mitigations are MANDATORY and in-scope for the 20-day build: 3-node repmgr HA; **two backup layers → Tigris** (pgBackRest/Barman WAL archiving + nightly `pg_dump` logical dumps); restore drill before launch and monthly; disk/replication/OOM alerts; documented escape hatches (Fly MPG in `sin`, or external managed Mumbai Postgres) via logical replication — plain Postgres, nothing locks in. Revisit at scale.
- **Object storage: Tigris** (Fly-native, S3-compatible, presigned URLs/multipart verified) — single-region pin `sin` (nearest; no India region). DPDP Rules 2025 permit cross-border by default (negative-list model) → compliant; migration path to India-region storage documented (S3 API). Survey photos, proposal PDFs, DEM tiles, backups.
- **Redis: Upstash via Fly extension (bom), FIXED plan** (Fly explicitly recommends fixed for BullMQ), eviction OFF, `maxRetriesPerRequest: null`.
- DPDP: DB in India; storage cross-border-permitted; RBI payment-data localization satisfied because Razorpay (Indian PA) holds payment instruments, not us.

### Jobs & compute
**BullMQ + @nestjs/bullmq** (NestJS-idiomatic; replaces earlier Graphile pick after NestJS+Fly-native overrides). Repeatable jobs for cron (agent triggers: proposal-unopened-3d, task-overdue-2d, snooze wake-ups, dormant sweep). Heavy CPU (shading at scale, Playwright PDF) in `apps/worker` worker_threads on dedicated machines.

### Auth
**Better Auth self-hosted** (organization + phoneNumber + jwt plugins) on our bom Postgres — phone PII stays in India. **MSG91** OTP (~₹0.15/SMS; WhatsApp-OTP fallback; DLT handled — registration lead time 1–2 weeks is a Day-1 critical-path item). Web: cookie sessions. **Bare RN: framework-agnostic Better Auth client + custom storage adapter over react-native-keychain** (verified pattern; keychain tolerates Better Auth's colon-separated keys — cleaner than expo-secure-store; Day-1–2 spike). JWT claims `{tenant_id, roles[]}` → Nest guards (primary authz; 6 stackable preset roles, OR-across-roles, widest visibility) + RLS backstop. Customer links: separate stateless signed tokens (HMAC, scope+expiry), never touch sessions.

### Offline & sync
**PowerSync self-hosted (Open Edition) on Fly bom**, Postgres bucket storage (no Mongo). Client = local SQLite (op-sqlite) + durable upload queue; **write path is our NestJS backend connector** (idempotent, tenant-checked, versioned — explicit AI-agent-friendly semantics). Sync Streams parameterized by token (tenant_id + assignee). Photos via Attachments Helper → Tigris presigned uploads (offline capture, resumable). Conflicts: surveys versioned-append (revisit = new version); designs single-editor LWW + server version check. Bare-RN specifics (verified): metro inline-requires blockList config, WebSocket transport, op-sqlite New-Arch support. Web studio reuses PowerSync web SDK (OPFS) for one mental model.

### Mobile (bare RN, iOS + Android)
Field-first app: My Day, leads, quick-add, surveys (offline), visits, notifications; studio opens as authenticated WebView (full parity per D2 is met by responsive web; native canvas editing is NOT rebuilt). Push: **Notifee + react-native-firebase** (FCM/APNs direct). i18n: Lingui metro transformer (verified RN≥0.73, no Expo needed). Tokens: react-native-keychain. CI: macOS lane for iOS builds. Ship: TestFlight + Play internal → stores (public store listing may trail the review clock; TestFlight/Play-internal distribution is the Day-20 reality — lockstep directive: mobile is never a follow-up).

### Billing & entitlements (v1 — supersedes D38)
- **Platform SaaS billing: Razorpay Subscriptions** — UPI AutoPay primary (₹15k/debit cap fits tier prices) + card e-mandate fallback; **native trial support** → trial-only model (14-day trial full-feature, single 7-day support extension; no free tier); pre-debit notifications handled by Razorpay.
- **Webhooks**: at-least-once → HMAC verify, dedupe on `x-razorpay-event-id`, fast-2xx + queue, `subscription.charged` grants entitlement, API-polling reconciliation backstop.
- **Entitlements + usage in-house on Postgres** (verified recommendation; Chargebee/Zoho rejected for launch): `plans`, `subscriptions`, `subscription_events`, `entitlements`, append-only `usage_events` (voice minutes, AI detections, OTP, storage) with period rollups. Enforcement = soft-block UX; pre-commitment kept: **read + export always work regardless of billing state**.
- **GST**: we are supplier of record — Razorpay Invoices generates GST-compliant invoices per cycle (our GSTIN/SAC); e-invoicing IRN validation is ours; Razorpay's 18% GST on fees tracked separately. Fees: UPI AutoPay ~0.5%+GST; cards ~2%+0.99%+GST.
- **Tenant customer-collections: BYO-Razorpay payment links per tenant** (`PaymentLinkPort`) — platform never touches funds → no RBI PA licence; Razorpay Route documented as alternate adapter only.
- Pricing tiers (designed in 01-business-model; owner-set anchors 2026-07-24): org-level, **single-design-kW ladder mirroring Reslink's (50 kW / 500 kW / 5 MW / 100 MW) at well under their INR prices** — Starter ₹1,999/mo · ₹19,990/yr (vs Reslink Basic ₹60k/yr), Growth ₹3,999/mo · ₹39,990/yr (vs Pro ₹85k), Pro ₹9,999/mo · ₹99,999/yr + voice bundle (vs Premium ₹1.2L), Enterprise custom (white-label options, public API); **every tier monthly or yearly — yearly = 2 months free**; **proposal caps 30/300/1,500/∞ per month + Starter 10-active-projects cap (owner directive)**; all features on all tiers — no feature ransom; voice minutes + AI detections metered beyond bundles.

### Voice agent (v1: integrate, India-resident)
**Exotel** (telephony, DLT/TRAI ops, AgentStream bidirectional WS) + **Sarvam AI** (Saarika STT / Bulbul TTS / Sarvam LLM — best Indic WER; Hindi/Marathi/Gujarati/Tamil/Telugu/English) + thin **NestJS orchestrator** (`apps/voice`): turn-taking, barge-in, AI-disclosure ≤30s, escalate-to-human, outcome classification. ≈₹2.5–4/min outbound all-in. **Bolna = documented Plan B** behind the same ports; LiveKit self-host = v2. **`ComplianceGate` is our non-swappable code**: daily DND scrub, consent, 9am–9pm + holiday calendar, 1600/140x series, keypress opt-out ≤24h, 90-day recording retention. Every call ledgered per tenant (cost breakdown). Agent config versioned; queued calls use queue-time version (D36).
**Number provisioning (per-tenant, user directive)**: default = platform-provisioned Exophone assigned to the tenant; alternative = **tenant's own number** hosted/ported onto Exotel with KYC (TRAI CLI rules mean BYO is a porting/hosting flow, not caller-ID override). Number entity in the data model: `tenant_phone_numbers` (provider ref, type platform/byo, CLI series 1600/140x, status, KYC docs). **IVR**: inbound per-tenant IVR flow (greeting → menu → AI agent / human ring-group / voicemail; business-hours aware); outbound **DTMF IVR traversal** in CallSession (`sendDtmf`/`onDtmf` on `TelephonyProvider`; prompt detection via STT) so agent calls that hit an IVR can navigate it. Exotel IVR applets + AgentStream DTMF verified at doc level; BYO-porting mechanics = week-1 spike.

### Integrations (ports; adapters per phase)
`MessagingPort` (v1 ManualCopyAdapter — D32 stands; v2 BYO-WABA via Meta Embedded Signup/Tech Provider, BSP shortlist AiSensy/Interakt/360dialog) · `PaymentLinkPort` (v1 = live with BYO-Razorpay, see billing) · `SubscriptionBillingPort` (Razorpay Subscriptions, live v1) · `DocumentRenderPort` (**Playwright/Chromium in worker** — only correct Devanagari shaping; react-pdf disqualified; Typst swap option) · `PushPort` (FCM/APNs via Notifee) · Solar data: PVGIS (energy source of record, SARAH3→ERA5 ladder), Google Solar (enhancement, never dependency), Gemini (roof-detect fallback, schema-enforced, temp 0) — all server-proxied with per-tenant metering + quotas (POC's status-envelope pattern kept).

### 3D & scale program (1 kW → 100 MW)
Editable unit above rooftop scale = **block/table/zone, not panel** (panels = derived instances; industry paradigm). Build NOW: blocks→tables→instances model alongside per-panel rooftop model; pure-TS kernels callable from browser Worker pool AND Node worker threads (same code, server jobs for giant sims); **GPU shadow-map shading primary** (WebGPU baseline 2026; three.js WebGPURenderer with WebGL2 fallback) + **three-mesh-bvh** CPU fallback & near-field rooftop raycasts (center geometry for float precision); **per-site UTM/ENU origin (proj4js)**; single-axis tracker + closed-form GCR backtracking as TS kernel (mirror pvlib); Copernicus GLO-30 DEM import. DEFER: terrain-following articulation, server GPU farm, utility-grade autorouting, Rust/WASM (violates TS-domain rule).

### Design system & i18n
`packages/tokens` is **GENERATED from the vendored canonical UX package `design/ds-source`** (Style Dictionary (shorthand — the canonical mechanism is the bespoke `packages/tokens/build.ts` CSS parser, docs/10 §2) parses its `tokens/*.css` as source — never hand-transcribed, manifest untrusted for values) → CSS vars (web, Tailwind v4 full import — no legacy layer in fresh repo) + RN theme object: **Geist + Geist Mono** (vendored variable woff2), **near-black primary `#0A0A0B`, violet accent `#5A4BFF`, iridescent atmosphere, light-only v1** (owner ruling 2026-07-24; semantic aliases keep a dark value-set droppable later); verified contrast ratios as metadata; the N1–N10 interaction/a11y contracts + touch contract + DoD survive as `design-spec` law while every visual fact comes from ds-source (binding conflict resolutions: docs/research/ds-reconciliation.md). **Lingui v5** one catalog for Next.js + RN; per-user language re-render; Devanagari chain now **Geist → Noto Sans Devanagari** (Geist has no Devanagari glyphs; explicit RN run-splitting); ₹ Indian grouping everywhere.

### Security & honesty
OWASP-aligned NestJS guards/pipes; tokenised-link scoping; secrets via Fly secrets; audit log; rate limiting (Upstash); SSRF-guarded proxies (keep POC's geotiff-relay guard). Honesty systems ported as product requirements: 4-tier provenance enums, 5-layer fingerprint staleness, money-never-stale rule, engineer sign-off (never computed structural adequacy), correlation-not-attribution, Path-B "Indicative proposal" labels.

---

## Deliverables to write in `/Volumes/works-space/heliogrid/` (git init; no remote yet)

```
README.md                         CLAUDE.md (master agent constitution — Claude Code always-on)
docs/
  00-vision-and-scope.md          01-business-model.md (tiers, unit economics, GTM, competitor matrix)
  02-system-architecture.md       03-tech-stack.md (choices + justifications + version pins + citations)
  04-data-model.md (full schema)  05-domain-migration.md (module-by-module port plan from geo3d/calc audits)
  06-offline-and-sync.md          07-integrations.md (ports & adapters)
  08-security-and-tenancy.md      09-observability-and-ops.md (incl. Postgres backup/restore runbook)
  10-i18n-and-design-system.md    11-scale-program.md (blocks/zones, GPU shading, trackers, terrain)
  12-competitive-gaps.md          13-ux-gap-register.md
  14-build-roadmap.md (the 20-day plan: tracks + day ranges + forward-compat register)
  15-spec-resolutions.md (18 ambiguity rulings + D38 supersession + D-decision conformance table)
  16-billing-and-entitlements.md  adr/ (~15 ADRs, one per irreversible choice)
```

Per-package CLAUDE.md files are specified inside 14-build-roadmap (created when packages exist — no app code this session).

### Execution order
1. `git init` + README skeleton.
2. **CLAUDE.md** (top-priority deliverable — single constitution for Claude Code).
3. 02-architecture + 03-stack + 04-data-model (load-bearing trio, written together).
4. 16-billing + 08-security (billing now core).
5. 05-domain-migration + 06-offline-sync + 11-scale-program.
6. 01-business-model + 12-competitive-gaps.
7. 07-integrations + 09-observability (incl. deprecated-flex backup runbook) + 10-i18n-design.
8. 13-ux-gap-register + 15-spec-resolutions.
9. 14-build-roadmap (as amended by directives 5+10): **the 20-day plan** — Day 1–2 foundations + ALL external paperwork filed + 6 spikes (incl. PowerSync deploy smoke, pulled forward); Days 3–6 Track A (auth/tenancy, billing, CRM incl. merge flow, catalog); Days 6–10 Track B (proposal builder, customer link incl. named-links/OTP-at-accept, remote survey w/ thin domain subset, projects); Days 9–13 Track C (voice agent code-complete, notifications/search, dashboards); Days 2–15 Track M (bare-RN app in LOCKSTEP with web — every module ships web + RN surfaces in the same slice, owner directive; TestFlight/Play-internal from Day 5); Days 14–18 Track D (STUDIO PORT — census gate, Path A + BOM activate); Days 17–20 Track E (offline/PowerSync + hardening + launch gate). Scale Phases B/C continue immediately after as studio-moat investment.
10. ADRs; final cross-consistency pass; update auto-memory (solar-studio-master-plan → new repo pointer).

### Verification of this session's output
- Internal consistency: stack names identical across 02/03/06/07/16; entity names identical across 04/05/16.
- Every D1–D39 honored or explicitly superseded in 15 (D38 → superseded by owner; D32 WhatsApp stands v1).
- Competitor prices carry sources; tech choices carry verification citations.
- No application code; docs + agent-rules only.

### User decisions log
Docs home: `/Volumes/works-space/heliogrid` · Competitors: ARKA 360, Aurora, OpenSolar, Reslink (reslink.org) · Tests: thin safety net · Two-tier catalog: yes · Pricing: trial-only, no free tier · Voice v1: Exotel+Sarvam · **Final review: NestJS · Fly-native storage (Tigris/Upstash, no AWS) · bare React Native (no Expo) · billing/entitlements/payments in v1 · launch next month** · DB: Fly unmanaged postgres-flex (user choice; deprecation risk flagged, mitigations mandatory, escape hatches documented).
