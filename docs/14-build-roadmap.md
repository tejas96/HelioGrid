# 14 — Build Roadmap

Module-by-module build order for AI-agent execution. **Priority ruling (owner directive,
2026-07-24 rev 2): the 3D Design Studio port and the offline/sync layer are the LAST build
phases.** The studio remains the flagship — its quality bar, the tool-census acceptance gate
and the scale programme are unchanged — but because a validated implementation already exists
in the POC, its port/enhancement is sequenced after the greenfield SaaS surfaces. This
re-honours D23 ("studio builds last"). Offline (PowerSync) lands after the studio phase begins;
until then the mobile app is online-first behind a repository abstraction.
Billing IS in v1 (D38 superseded; trial-only, no free tier).

Sources: `BLUEPRINT.md` §9 execution order (binding, as amended by this ruling) ·
`./research/buildplan.md` · `./research/phases710.md` (studio tool census = acceptance
checklist) · `./research/geo3d.md` + `./research/calc.md` (port inventory and dependency
order) · `./research/journey.md` (D-census, entities, state machines) · verification spikes in
`./research/verify-bareRn.md`, `./research/verify-billing.md`, `./research/verify-flyNative.md`,
`./research/verify-nestContracts.md` · `./research/fly.md`, `./research/voice.md`,
`./research/sync.md` · UX mockup catalogue in `./research/uxAL.md` / `./research/uxMZ.md`
(files in `/Users/devtejas/Downloads/HelioGrid UX/*.dc.html`).

Operating rules for every slice (from `CLAUDE.md`): plan → contract → schema → implement →
verify in the running app. Small complete slices; every new screen backward-wires into the
flows that reach it; no orphan screens. A slice is done only when `pnpm turbo typecheck`,
`lint`, `test` are green AND the change is verified running. Each package/app gets its own
`CLAUDE.md` from `.claude/rules/module-template.md` at creation.

---

## 1 · Launch-1 — one month, web-first (no studio, no offline)

Launch-1 sells and closes deals end-to-end WITHOUT the design studio: leads → remote survey
(detection included) → **Path B proposals** (indicative, AI-filled, catalog components) →
customer link → won → projects → payments. Path A (from design) activates when the studio
phase lands; every Path A seam is built now (forward-compat register §4).

### Week 1 — foundations, spikes, and the external critical path

**External onboarding starts day 1 (longest lead times in the whole plan — nothing blocks on
code, everything blocks on paperwork):**

| Track | Actions | Lead time | Blocks |
|---|---|---|---|
| DLT / SMS | MSG91 account, DLT Principal Entity registration, sender ID + OTP/transactional templates | 1–2 weeks (`./research/auth.md`) | Real-phone OTP (W2 auth); until approved, use MSG91 test route + WhatsApp-OTP fallback |
| Razorpay | Merchant KYC, Subscriptions enablement, plan objects (Starter/Growth/Pro × monthly + yearly, per docs/16), webhook endpoint registration, GST invoice settings | days–2 weeks | Live billing (W4); build against test mode from W2 |
| Exotel | Account, KYC, Exophone pool enquiry, BYO-number porting mechanics quote, AgentStream access | 2–6 weeks | Voice GA (Launch-2) — start now precisely because it is slow |
| Apple/Google | Developer accounts, org verification | 1–2 weeks | Store submissions (Launch-2) |

**Scaffold (repo becomes buildable):**
- pnpm workspaces + Turborepo + TS project references; Biome v2.5 + dependency-cruiser
  (domain never imports db/api; no cycles) + sherif + Turborepo Boundaries. CI runs
  typecheck/lint/test/build on every push; red CI blocks merge (`./research/tooling.md`).
- `packages/tokens` — Style Dictionary source → CSS vars (Tailwind v4 full import) + RN theme
  object; contrast ratios as metadata; `/design` living reference page in `apps/web`
  (`./research/design.md`, docs/10).
- `packages/contracts` — ts-rest root contract + Zod **3.x pinned**, error envelope, pagination
  and tenancy conventions, OpenAPI 3.1 emit wired into CI (`./research/verify-nestContracts.md`).
- `packages/db` core migration 0001: `tenants`, `users`, `role_preset` enum
  (6 presets) + `user_roles`, Better Auth tables, `audit_log`, `usage_events` (schema covers ALL metered
  event types now — see §4), RLS policies + `SET LOCAL app.tenant_id` plumbing, the
  tenant-scoped repository layer in `apps/api`.
- Fly infra up: `bom` apps (web/api/worker), postgres-flex 3-node repmgr, Upstash Redis
  **fixed plan** (eviction off, `maxRetriesPerRequest: null`), Tigris bucket, secrets,
  `min_machines_running=1` on web/api, `sin` overflow fallback (`./research/fly.md`, docs/09).

**The 5 verification spikes (each ends in a one-page verdict committed to `docs/adr/` notes;
each has a pre-agreed fallback so a failed spike costs a decision, not a week):**

| # | Spike | Pass criteria | Fallback |
|---|---|---|---|
| S1 | Better Auth phone-OTP on bare RN | OTP login round-trips with a `react-native-keychain` storage adapter (colon-separated keys tolerated); no Expo packages in the tree | Hand-rolled `Cookie`/`Set-Cookie` handling persisted via keychain (`./research/verify-bareRn.md`) |
| S2 | pgBackRest → Tigris archive + **restore drill** | WAL archive to Tigris `sin`, then a full restore to a scratch machine produces a queryable DB | Barman with manual `barman cron`; nightly `pg_dump` to Tigris runs regardless (`./research/verify-flyNative.md`, docs/09 runbook) |
| S3 | ts-rest 3.53 / Zod-4 status check | 3.53 out of RC → consider Zod 4; otherwise confirm Zod 3 pin | Stay on 3.52.1 + Zod 3 (already the default plan) |
| S4 | Tigris single-region `sin` pin | `fly storage create` + `X-Tigris-Regions` verified: presigned PUT/GET and multipart land in `sin` only | Escalate to Tigris support; storage adapter is S3-generic so a swap is config |
| S5 | Exotel BYO + DTMF | Written confirmation of BYO-number hosting/porting flow + AgentStream `sendDtmf`/DTMF events | Bolna as documented Plan B behind the same ports (`./research/voice.md`) |

(The PowerSync deployment spike moves to the offline phase — §3b.)

### Week 2 — auth, tenancy, billing foundation, CRM core, catalog

- **auth + tenancy** (`apps/api` modules `auth`, `tenancy`): Better Auth self-hosted
  (organization + phoneNumber + jwt plugins), MSG91 OTP, company signup (phone → OTP → company
  name/owner/city — nothing else), invites by phone, 6 stackable preset roles with OR-across-roles
  guards and widest-visibility scoping, JWT claims `{tenant_id, roles[]}`, RLS backstop live.
  UX: `Login.dc.html`, `LoginFlow.dc.html`, `SignUpFlow.dc.html`, `WhatYouSell.dc.html`,
  `YoureReady.dc.html`, `InviteLanding.dc.html`, `InviteFlow.dc.html`, `YourRole.dc.html`,
  `TeamRoles.dc.html`.
- **billing foundation** (module `billing`, docs/16): `plans`, `subscriptions`,
  `subscription_events`, `entitlements` + trial lifecycle (trial starts at signup, full-feature,
  no card); Razorpay webhook receiver (HMAC verify, dedupe on `x-razorpay-event-id`, fast-2xx +
  BullMQ, polling reconciliation backstop) in **test mode**; entitlement guard decorator with
  soft-block UX; the invariant "read + export always work" enforced in the guard itself.
- **CRM core** (module `crm`): `customers`/`contacts` (phone = identity), `leads` (full state
  machine incl. snoozed/dormant/disqualified), `sites`, `activities`, `tasks`; live dedupe on
  phone at quick-add; assign with rep open-load; qualification inline; lead timeline.
  UX: `QuickAddLead.dc.html`, `Leads.dc.html`, `LeadDetail.dc.html`, `MyDay.dc.html` (skeleton).
- **catalog** (module `catalog`): two-tier tables, resolution tenant-override → tenant-item →
  platform-item as ONE shared resolver, versioned price book, platform seed
  (`platform_catalog_items`, kind='panel'/'inverter'). UX: `CatalogPriceBook.dc.html`.
  Lands this week so the proposal builder consumes a tested resolver in W3.

### Week 3 — proposal builder (Path B), customer link, remote survey

- **Thin domain subset port** (`packages/domain` — survey/proposal dependencies ONLY; the full
  studio port stays in §3a): `project/types` + `context.ts` (DomainContext with RulesContext/
  CatalogContext/ProjectionContext — default equirectangular implementation), `rules/presets/india`,
  `geometry/geo`, `roof/roof-factory`, `roof-ai/*` pure kernels (artifact doorway, plane-fit,
  vectorize), `finance/*` (subsidy/GST/payable math for Path B money), `project/normalize`.
  Ported POC tests travel with each module and stay green. This is NOT the studio port —
  it is the minimum kernel set survey + proposal money math require.
- **proposal builder** (module `proposal`): 11 steps, **Path B primary** (indicative, honesty
  label, AI auto-fill for steps 4/5, quick mode 1/3/8/10), Path A seams built but dormant until
  the studio phase (entry point hidden, schema complete), versions (accepted = locked; sent keeps
  original prices), server-assigned proposal numbers, tranche templates summing to 100%,
  mandatory 5-category components gate from the catalog resolver, the ONE money path (proposal ↔
  tranches reconcile to the paisa; BOM joins the same path at the studio phase), preview with
  blocking validation.
  UX: `ProposalEntry.dc.html`, `ProposalStep3.dc.html`, `ProposalStep7.dc.html`,
  `ProposalStep8.dc.html`, `ProposalFormSteps(.2).dc.html`, `ProposalPreview.dc.html`,
  `ProposalShare.dc.html`, `ProposalVersions.dc.html`, `Proposals.dc.html`.
- **customer link** (module `customer-link`): stateless HMAC tokens (scope + expiry, never
  sessions), public read endpoints, states A–F on one URL, edge states (expired/invalid/
  superseded/declined), accept → confirm flow, text+price renders before images (3G rule).
  UX: `CustomerProposal.dc.html`, `CustomerPage.dc.html`, `PropDocPage.dc.html`.
- **remote survey** (module `survey`, web mode only): locate building → detect roof (Google
  dataLayers geometric pipeline + Gemini fallback via the ported roof-ai kernels, server-proxied
  with per-tenant metering and the SSRF-guarded geotiff relay) → ghost review accept/adjust/
  reject → coverage-failure manual outline → gaps list. Survey rows are versioned-append from
  day one (the later offline conflict strategy is already the write model).
  UX: `SurveyMode.dc.html`, `LocateBuilding.dc.html`, `DetectRoof.dc.html`,
  `CoverageFailure.dc.html`, `GapsRemote.dc.html`.

### Week 4 — projects, dashboards-lite, billing live, hardening; LAUNCH GATE

- **Projects module** (`projects`, pulled forward from Launch-2 — unblocked because it only
  needs proposals/tranches/customer-link): mark won → auto-create, 9-stage board
  (days-in-stage), payments vs tranches (same tranche rows), document checklist, blockers with
  named who-waits, handover pack, customer link flips to states E/F.
  UX: `Project Flow.dc.html`. (InstallationSheet reuse activates with the studio phase.)
- **dashboards-lite**: My Day complete (rep home, agent block placeholder-ready) + owner
  attention list ("What needs you" section only of `OwnerDashboard.dc.html`). Full dashboards
  wait for Launch-2.
- **Razorpay live**: live keys, first real subscription charge end-to-end, trial→paid
  conversion, GST-compliant invoice per cycle, `subscription.charged` grants entitlement
  (`./research/verify-billing.md`).
- **PDF render**: Playwright/Chromium in `apps/worker` (`DocumentRenderPort`); Devanagari
  shaping verified on a Hindi proposal (docs/07).
- **Hardening**: rate limits (Upstash), audit-log coverage pass, alerting (disk/replication/
  OOM/queue depth), **restore drill #2** from real production-shaped data, cross-tenant
  isolation invariant tests green.

**LAUNCH GATE — all boxes or no launch:**
1. `pnpm turbo typecheck && lint && test` green; ported domain-subset tests + locked invariants all passing.
2. Money invariants: GST/discount/subsidy/tranche sums; proposal total === Σ tranches on seeded
   data; money-never-stale badge verified in the browser.
3. End-to-end walk in production: signup → lead → remote survey → Path B proposal → link opened
   on a phone → accept → project created → tranche marked received.
4. Billing: live charge succeeded; webhook dedupe proven; read+export verified while
   entitlement-blocked.
5. Restore drill passed within the documented RTO; backups verified in Tigris (both layers).
6. RLS backstop: cross-tenant read/write fails at the DB even with app guards disabled.
7. Customer link states A–F + edge states render; Hindi proposal PDF correct; 375 px pass on
   every shipped screen; light and dark both correct.
8. Provenance tiers + Path-B "Indicative proposal" label present on every surface that shows
   a number.

---

## 2 · Launch-2 — weeks 5–10 (order within the window is dependency-driven)

| Module | Scope | Depends on |
|---|---|---|
| **Field app** (`apps/mobile`, bare RN, **ONLINE-FIRST**) | Auth (S1 pattern), My Day, leads quick-add, surveys via direct ts-rest API (camera capture uploads immediately over presigned Tigris PUTs; graceful retry queue for flaky networks, but connectivity is required), visits, push (Notifee + FCM/APNs), Lingui metro transformer, WebView studio slot (activates at §3a). **All data access goes through a repository interface so PowerSync (§3b) slots in WITHOUT rewriting screens.** Store submissions start week 5 (TestFlight + Play internal) — review is a queue, join it early | W1 infra, S1, survey schema (already versioned-append) |
| **Physical survey full flow** (online) | Guided capture (inline camera), shading capture (11 obstruction types, estimates labelled), review & submit with gaps-as-consequences, revisit = new version. Full offline capture arrives with §3b. UX: `SurveyorVisits.dc.html`, `ShadingCapture.dc.html`, `SurveyReview.dc.html` | Field app |
| **Voice agent GA** (`apps/voice` + module `agent`) | Number provisioning (`tenant_phone_numbers`: platform Exophone default / BYO hosted-ported with KYC), inbound IVR flow builder (greeting → menu → AI/human/voicemail, business-hours aware), outbound DTMF IVR traversal, CallSession orchestrator (Exotel AgentStream ↔ Sarvam), **ComplianceGate** (DND scrub, 9am–9pm, 1600/140x, opt-out, 90-day retention), agent config versioned (D36), queue, transcripts to lead timeline, performance screens with correlation-not-attribution. UX: `AgentSetup/Test/Queue/Knowledge/Unanswered/Performance/CallResult.dc.html`. **Gated by DLT/KYC lead time — the W1 paperwork decides the GA date, not the code** | S5, DLT, usage_events (already covers voice) |
| **Notifications + global search** | Bell centre (deep-linked, agent-escalation prominent), push, app-wide search. UX: `NotificationsCentre.dc.html`, `GlobalSearch.dc.html` | Notification types enum (seeded W2) |
| **Pipeline funnel + full dashboards** | Owner/rep dashboards complete, funnel + win/loss reason lists (D37 honesty rules). UX: `OwnerDashboard.dc.html`, `RepDashboard.dc.html`, `PipelineFunnel.dc.html` | CRM + projects data |

## 3 · The final phases — the flagship and the offline layer (owner-directed sequencing)

### 3a · The 3D Design Studio — port + enhance (THE flagship; biggest single line item)

Everything in the original studio plan applies unchanged — only its position moved:
- **Port order = the nine dependency batches A–I in docs/05 §7** (A kernel & contexts — partially
  landed in Launch-1 W3's thin subset; B roof family; C layout; D scene bridge with the
  **one-frame gate live from there and never red again**; E structure w/ byte-identical goldens;
  F analysis & energy + kernel message contract, dual-runtime smoke; G electrical; H commercial —
  BOM goldens + money invariants join the locked set, **BOM joins the ONE money path and the
  proposal's Path A activates**; I insight & export). Ported POC tests travel with every batch
  and must be green before the next batch starts. three-as-math retained through the port;
  ProjectionContext default equirectangular with UTM/ENU (proj4) selected for ground-mount/
  large sites.
- **Immediately after the port batches complete:** `three-mesh-bvh` integration + far=250 cap
  removal as a separate golden-verified change (scale Phase A). GPU shadow-map shading stays
  scale Phase B.
- **Studio web app**: design list, wizard rail, canvas, 3D, DS-refactor screens (mode-based
  canvas, pinch-zoom/two-finger pan, big handles, visible labels, progressive disclosure for
  the ~286-control BOM), engineer sign-off queue + return-with-comments, hard electrical gate,
  375 px on every studio screen; wired end-to-end: lead → survey → design → Path A proposal →
  share → accept. Mobile WebView slot activates (authenticated handoff).
  UX: `DesignStudio.dc.html`, `ProjectSetup.dc.html`, `RoofSetup.dc.html`, `Obstructions.dc.html`,
  `PanelLayout.dc.html` + `Layout*.dc.html` sheets, `BomDetail.dc.html`.
- **Acceptance = the tool census in `./research/phases710.md` §2 (screens 10.1–10.11) tracked
  as a literal checklist file** — every tool, every computed output, every state. The census
  review is a merge gate for port PRs, on par with typecheck/lint. Nothing is compromised
  against the studio; it moved in TIME, not in scope or quality.
- Then the **scale programme** continues as studio-moat investment per docs/11: neutral structs →
  blocks/tables/zones behaviour (schema exists from day one) → GPU shadow-map shading →
  single-axis trackers + GCR backtracking → Copernicus GLO-30 terrain.

### 3b · Offline layer (PowerSync) — the very last build phase

Design unchanged (docs/06 is the spec); only sequencing moved:
- PowerSync spike (self-host deploy, Postgres bucket storage, JWKS auth) runs at the START of
  this phase, not W1.
- PowerSync process group on Fly `bom`; sync streams parameterised `{tenant_id, user_id}`;
  NestJS backend-connector write path (`sync_mutations` idempotency ledger — table exists from
  Launch-1); Attachments Helper → Tigris presigned for offline photo capture.
- Mobile: swap the repository implementations from direct-API to PowerSync SQLite (the
  Launch-2 abstraction makes this a data-layer swap, not a screen rewrite); metro
  inline-requires blockList + WebSocket transport + op-sqlite (`./research/verify-bareRn.md`).
- Physical survey becomes fully offline (capture for days, sync on Wi-Fi, "3 surveys waiting"
  status UX); web studio optionally adopts the OPFS optimistic layer.
- Conflict rules were built in from Launch-1 (surveys versioned-append; designs single-editor
  version check) — this phase turns them on, it does not invent them.

---

## 4 · Forward-compatibility register (the "no missing foreign key" guard)

Read this BEFORE building each Launch-1 module. Each row is what LATER modules need from the
module NOW — cheap now, a migration crisis later. **With studio and offline moved last, this
register is the load-bearing guarantee that they bolt on without rework.**

| Launch-1 module | Build in NOW because later modules need it |
|---|---|
| **auth/tenancy** | Roles are stackable (M:N `user_roles`, OR-across-roles) — never a single `role` column. JWT claims shape `{tenant_id, roles[]}` is also the PowerSync sync-stream parameter source (§3b offline). Long-lived refresh path so a surveyor authenticates once and works offline for days. Phone stored E.164. Users deactivate, never delete (history attribution). |
| **tenants** | Language is per-user (D25), never on tenant. Tenant settings as typed JSONB with room for: branding, proposal defaults, agent config ref, IVR flow ref, holiday calendar. `tenant_phone_numbers` table EXISTS from W1 (provider ref, type platform/byo, CLI series, status, KYC doc refs) — empty until voice GA, but FK-able from day one. |
| **billing** | `usage_events` schema covers ALL metered types now: billable `voice_minutes`, `ai_detections`, `storage_gb` + fair-use `otp_sms` (capped, NOT billed v1) + non-billable observability (`solar_data_fetch`, `map_tile_fetch`, `dem_tile_fetch`, `push_sent`, `document_rendered`) — voice ships months before its first ledger row, never the reverse. Entitlement checks are a decorator/guard, so later modules declare — not implement — gating. Read+export exemption lives in the guard. |
| **crm/leads** | `consent`, `dnd_status`, `do_not_call`, `preferred_language`, `consent_recorded_at` on customer/contact from W2 — the voice agent's ComplianceGate reads them at GA without touching CRM. `source` enum already includes `inbound_call`. Snooze/dormant/wake timestamps power Launch-2 repeatable jobs. Multiple contacts per customer (C&I) from the start. |
| **survey** | Versioned-append (revisit = new version, never overwrite) is exactly the PowerSync conflict strategy — remote surveys use the same tables the offline field app syncs in §3b. `assigned_to` on survey/visit is the sync-stream partition key. Photos are rows referencing Tigris keys (generic `files` table shared with project documents and KYC docs), never blobs in Postgres. `sync_mutations` table exists from Launch-1 (empty until §3b). |
| **design (schema now, engine later)** | `designs` table + JSONB payload schema land in Launch-1 migrations even though the studio arrives in §3a: payload keeps `segments[]` (parametric tables — the seed of the blocks/tables/zones scale model) and persists the per-site `projection` selection (`ProjectionContext` exists from the W3 thin subset — default equirectangular, UTM/ENU (proj4) for ground-mount/large sites) so the studio phase changes math, not schema. Five-layer fingerprints + `structuralVerification` (who + when) columns reserved. Rules injected per-tenant/jurisdiction — never a global. Lead detail shows "Create design — arriving soon" (disabled, not absent) so the flow slot exists. |
| **proposal/tranches** | Tranches are ONE table doubling as the project collection schedule: `project_payments` FK to `tranches`, so W4 projects collect against the exact sent schedule (Phase-7 rule "do NOT invent figures"). Versions immutable once shared; server-assigned numbers. **Path A columns (design_id FK, derived-provenance flags, BOM linkage) exist from W3** — the studio phase flips Path A on without a proposal migration. |
| **customer_links** | Lifecycle enum covers ALL states A–F (proposal, estimate, question, accept, **progress, handover**) from W3 — the projects module flips a state, it doesn't add columns. Open-tracking events append-only. |
| **catalog** | Resolution order (tenant-override → tenant-item → platform-item) is a single shared resolver used by proposal Step 8 NOW and by studio Step 4 + BOM at §3a — fixed and tested BEFORE any consumer. Price-book rows versioned; archived items stay referencable. |
| **notifications** | Type enum seeded W2 with the full set incl. `agent_escalation` and `design_returned`, so W2–W4 modules emit into a table whose consumers arrive in Launch-2/§3a. |
| **mobile (Launch-2)** | ALL data access behind repository interfaces — §3b swaps direct-API implementations for PowerSync SQLite without touching screens. No screen may assume synchronous local reads until §3b. |
| **domain thin subset (W3)** | `packages/domain` stays pure TS with injected rules from the first module — the same kernels must run in browser Workers AND Node worker threads (§3a server shading jobs, scale programme). `DocumentRenderPort`, `MessagingPort`, `PaymentLinkPort`, `TelephonyProvider` port interfaces defined in W2 even where v1 adapter is manual-copy. |
| **audit/files/jobs** | `audit_log` written from the first mutation. One generic `files` table (owner polymorph: survey/project/tenant-KYC). BullMQ queue names namespaced `module.job` from the first job. |

## 5 · Per-module execution template

Every module PR-series follows this shape (copy into the module's tracking issue):

```
MODULE <name>                                    target week: W<n>
Scope        — one paragraph; explicit NON-goals (from journey/phase docs)
Contract     — packages/contracts diff FIRST (ts-rest + Zod); OpenAPI emitted;
               the contract diff is the API review surface
Schema       — packages/db migration(s), append-only; forward-compat register
               row for this module re-read and satisfied
Domain       — pure logic in packages/domain only (no Nest/React/fetch/env)
DoD          — typecheck + lint green · ported/invariant tests green ·
               run-and-look: verified in the browser (or curl/logs for api,
               simulator for mobile) · wired into an existing flow, no orphan
               screen · loading/empty/error/offline states · 375px · light+dark
UX sources   — exact mockup files by name from /Users/devtejas/Downloads/HelioGrid UX/
               (e.g. MyDay.dc.html, ProposalStep7.dc.html) — states and seeded
               data in the mockups are the spec
Spec sources — docs/04 (schema) · docs/15 (rulings) · product-journey.md D-census
               (./research/journey.md) · phase prompts (./research/phases710.md,
               ./research/buildplan.md)
```

Per-package `CLAUDE.md` files are created WITH the package (template:
`.claude/rules/module-template.md`) — scaffold W1 creates them for tokens/contracts/db/domain;
each app gets its own on first commit.

## 6 · Risk register

| Risk | L×I | Mitigation | Early signal / trigger |
|---|---|---|---|
| **Fly `bom` capacity** — machine placement failures, cold-start refusals (`./research/fly.md`) | M×H | `min_machines_running=1` on web/api; `sin` overflow in fly.toml; paid plan from day 1; worker machines sized once, not autoscaled | Any `cannot host your machine` in deploy logs → pre-provision spares |
| **DLT registration delay** — OTP and voice both sit behind it | H×M | Started day 1 (W1 table); WhatsApp-OTP fallback via MSG91; voice GA date explicitly decoupled from Launch-1 | Not approved by end of W2 → launch on fallback OTP channel, keep SMS as fast-follow |
| **Store review / account verification** — mobile timing not fully ours | M×M | Mobile already trails web by design; developer accounts opened W1; TestFlight/Play-internal from week 5; WebView studio means no store gate on studio fixes | Account verification stalls >2 weeks → escalate via support channels |
| **postgres-flex is deprecated** — self-support, DIY backups | M×H | Mandatory mitigations are Launch-1 scope: 3-node repmgr, pgBackRest WAL + nightly `pg_dump` both → Tigris, restore drill W1 AND W4 then monthly, disk/replication/OOM alerts; escape hatches (Fly MPG `sin` / managed Mumbai PG) via logical replication documented in docs/09 | Any failed restore drill = launch blocker; recurring OOM/replication lag → begin escape-hatch migration |
| **Selling without the studio** — Launch-1 competes on CRM + Path B proposals while ARKA/Aurora demo design tools | M×M | Remote-survey detection (satellite + AI) still demos the "wow"; Path B proposals are the POC-validated highest-traffic surface ("many deals never touch the studio"); studio arrival is a marketable Launch-3 event; POC studio remains usable internally for demos | Trial-conversion feedback names design as the blocker → pull §3a start earlier |
| **Studio-port underestimation** — still the biggest single line item | H×H | Census-driven checklist (`./research/phases710.md` §2) makes "done" objective; port order by dependency (batches A–I, docs/05 §7) with ported tests green per batch; W3 thin subset de-risks the kernel batch early; the phase has NO launch date riding on it — quality gate, not calendar gate | A batch exceeding its estimate ×2 → re-scope the batch, never the census |
| **Single-dev-agent bottleneck** — everything serialises through one executor | H×M | Contract-first lets api/web/domain slices proceed independently; docs are load-bearing so context rebuilds are cheap; forward-compat register prevents rework loops; small complete slices keep WIP ≤1 module per layer | A module open >4 days → split it or cut scope inside it |
| **Razorpay onboarding/KYC slips** | M×M | Started W1; entire billing module works in test mode; trial-only model means nobody is blocked from using the product while live keys wait | Live keys not issued by mid-W4 → launch with trials only, charge on arrival of keys |
| **ts-rest Zod-4 drift / slowed cadence** | L×M | Zod 3 pinned; S3 re-checks; contracts are plain Zod so an oRPC migration path exists (`./research/verify-nestContracts.md`) | Blocking ts-rest bug → patch-fork, revisit oRPC at the 6-month review |
| **Tigris `sin` pin unverifiable via CLI** | L×M | S4 verifies with headers + console; adapter is S3-generic | S4 fails → support ticket; last resort any S3 endpoint, DPDP permits cross-border (docs/08) |
| **Playwright PDF Devanagari** | L×H | Chromium ships full shaping (that is WHY it was picked over react-pdf); Hindi golden PDF in W4 gate; Typst documented as swap | Gate render wrong → fonts/subsetting fix in worker image, not an architecture change |

Review this register at each week boundary; anything triggered gets a dated note here and, if
the response changes architecture, an ADR.
