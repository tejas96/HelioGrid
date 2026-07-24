# 14 — Build Roadmap

Module-by-module build order for AI-agent execution. Launch-1 is one month, web-first; the
mobile app trails by weeks (owner directive). The 3D Design Studio is the flagship and is
first-class in Launch-1 — its port is the largest single line item and is never the buffer
that absorbs slippage elsewhere. Billing IS in v1 (D38 superseded; trial-only, no free tier).

Sources: `BLUEPRINT.md` §9 execution order (binding) · `./research/buildplan.md` ·
`./research/phases710.md` (studio tool census = acceptance checklist) ·
`./research/geo3d.md` + `./research/calc.md` (port inventory and dependency order) ·
`./research/journey.md` (D-census, entities, state machines) · verification spikes in
`./research/verify-bareRn.md`, `./research/verify-billing.md`,
`./research/verify-flyNative.md`, `./research/verify-nestContracts.md` ·
`./research/fly.md`, `./research/voice.md`, `./research/sync.md` ·
UX mockup catalogue in `./research/uxAL.md` / `./research/uxMZ.md`
(files in `/Users/devtejas/Downloads/HelioGrid UX/*.dc.html`).

Operating rules for every slice (from `CLAUDE.md`): plan → contract → schema → implement →
verify in the running app. Small complete slices; every new screen backward-wires into the
flows that reach it; no orphan screens. A slice is done only when `pnpm turbo typecheck`,
`lint`, `test` are green AND the change is verified running. Each package/app gets its own
`CLAUDE.md` from `.claude/rules/module-template.md` at creation.

---

## 1 · Launch-1 — one month, web-first

### Week 1 — foundations, spikes, and the external critical path

**External onboarding starts day 1 (longest lead times in the whole plan — nothing blocks on
code, everything blocks on paperwork):**

| Track | Actions | Lead time | Blocks |
|---|---|---|---|
| DLT / SMS | MSG91 account, DLT Principal Entity registration, sender ID + OTP/transactional templates | 1–2 weeks (`./research/auth.md`) | Real-phone OTP (W2 auth); until approved, use MSG91 test route + WhatsApp-OTP fallback |
| Razorpay | Merchant KYC, Subscriptions enablement, plan objects (Growth/Pro per docs/16), webhook endpoint registration, GST invoice settings | days–2 weeks | Live billing (W4); build against test mode from W2 |
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

### Week 2 — auth, tenancy, billing foundation, CRM core; **studio port begins**

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
- **STUDIO PORT BEGINS** (`packages/domain` — the flagship; port order is the nine-batch
  dependency order in docs/05 §7 (sources: `./research/geo3d.md` §1/§3), ported POC tests
  travel with every batch and must be green before the next batch starts):
  - **Batch A** kernel & contexts: `project/types`, `context.ts` (DomainContext, RulesContext,
    CatalogContext, ProjectionContext — introduced AT PORT TIME as an injected context whose
    default implementation is the existing equirectangular projector, keeping POC tests
    byte-identical; a UTM/ENU (proj4) implementation ships alongside and is selected for
    ground-mount/large sites), `rules/presets/india`, `geometry/geo`, `energy/sun`,
    `energy/sim-time`, `project/fingerprints`, `project/capabilities`, `project/units`,
    `project/cascade`, `project/calibration` — plus the **rules-injection refactor**: kill the
    `resolveRules()` global; rules/catalog/market config become injected parameters everywhere.
  - **Batch B** roof family: all `roof/*` (10 modules) + `geometry/ground`.
  - **Batch C** layout: `layout/*` (5 modules) — layout, segment-ops, panel-move, spacing,
    pitched-grid, azimuth-lattice (+attacks), inset-fuzz suites.
  - **Batch D** scene bridge: `scene/scene-model`, `scene/scene-frame`, `layout/panel-pose`
    wiring — **one-frame gate (`one-frame.test.ts`, `frame-parity.test.ts`) live from here and
    never goes red again**. three-as-math is RETAINED through the port; neutral mesh/AABB
    structs are scale Phase B.

### Week 3 — studio port continues; proposal builder; customer link; remote survey

- **Studio port batches E–I** (`packages/domain`):
  - **Batch E** structure: `structure/*` (7 modules) — structure suite + `structure-golden`
    snapshot **byte-identical**; foundations/monorail/leg-plan/ground-mount/drc-structure
    (D15 height contract test included).
  - **Batch F** analysis & energy: `analysis/shading`, `analysis/solar-heatmap`, `energy/poa`,
    `energy/energy-report`, `energy/pvgis` mapper + kernel message contract in
    `packages/contracts`; kernel runs in both a Node worker_thread and a browser Worker
    smoke harness.
  - **Batch G** electrical: `electrical/*` (9 modules) — window/grouping/autostring/combiner/
    gate/sizing/stringing/sld suites; empty-window fault behaviour pinned.
  - **Batch H** commercial: `routing/routing`, `bom/*` (all — context, registry, money, merge,
    edit, line, view, 6 emitters + **golden snapshots byte-identical**), `finance/*` — money
    invariants (GST/discount/margin/subsidy) green, joining the locked invariant set.
  - **Batch I** insight & export: `insight/*` (10 modules), `export/*`, `geometry/drawing-project`,
    `roof-ai/*` pure kernels, `project/normalize`.
  - **Immediately after the port batches complete (still Launch-1):** `three-mesh-bvh`
    integration + far=250 cap removal land as a separate golden-verified change (scale
    Phase A pulled forward — NOT part of the port batches). GPU shadow-map shading stays
    in scale Phase B.
  - Studio web shell starts in `apps/web` (design list, wizard rail, canvas bring-up) against
    the ported domain; **acceptance = the tool census in `./research/phases710.md` §2
    (screens 10.1–10.11) tracked as a literal checklist file** — every tool, every computed
    output, every state.
- **proposal builder** (module `proposal`): 11 steps, Path A (from design) / Path B (indicative,
  honesty label), versions (accepted = locked; sent keeps original prices), server-assigned
  proposal numbers, tranche templates summing to 100%, mandatory 5-category components gate,
  the ONE money path (BOM ↔ proposal reconcile to the paisa), preview with blocking validation.
  UX: `ProposalEntry.dc.html`, `ProposalStep3.dc.html`, `ProposalStep7.dc.html`,
  `ProposalStep8.dc.html`, `ProposalFormSteps(.2).dc.html`, `ProposalPreview.dc.html`,
  `ProposalShare.dc.html`, `ProposalVersions.dc.html`, `Proposals.dc.html`, `BomDetail.dc.html`.
  Requires **catalog** (module `catalog`) landing first in the same week: two-tier tables,
  resolution tenant-override → tenant-item → platform-item, versioned price book
  (`CatalogPriceBook.dc.html`).
- **customer link** (module `customer-link`): stateless HMAC tokens (scope + expiry, never
  sessions), public read endpoints, states A–F on one URL, edge states (expired/invalid/
  superseded/declined), accept → confirm flow, text+price renders before images (3G rule).
  UX: `CustomerProposal.dc.html`, `CustomerPage.dc.html`, `PropDocPage.dc.html`.
- **remote survey** (module `survey`, web mode only): locate building → detect roof (Google
  dataLayers geometric pipeline + Gemini fallback, server-proxied with per-tenant metering and
  the SSRF-guarded geotiff relay) → ghost review accept/adjust/reject → coverage-failure manual
  outline → gaps list. UX: `SurveyMode.dc.html`, `LocateBuilding.dc.html`, `DetectRoof.dc.html`,
  `CoverageFailure.dc.html`, `GapsRemote.dc.html`.

### Week 4 — studio wired end-to-end; dashboards-lite; billing live; hardening; LAUNCH GATE

- **Studio DS-refactor screens complete and wired end-to-end**: lead → survey → design →
  proposal → share → accept as one unbroken flow (backward-wire: lead detail's "Create design",
  design done's "Generate proposal", share's "Mark as shared", link accept → lead Won prompt).
  Touch-first contract applied (mode-based canvas, pinch-zoom/two-finger pan on 2D, big
  handles, visible labels); engineer sign-off queue + return-with-comments; hard electrical
  gate; 375 px works on every studio screen.
  UX: `DesignStudio.dc.html`, `ProjectSetup.dc.html`, `RoofSetup.dc.html`,
  `Obstructions.dc.html`, `PanelLayout.dc.html` + `Layout*.dc.html` sheets.
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
1. `pnpm turbo typecheck && lint && test` green; ported domain tests + locked invariants all passing.
2. Studio tool census 10.1–10.11 checklist 100% (every tool, every computed output survives).
3. Money invariants: GST/discount/subsidy/tranche sums; BOM total === proposal total on seeded
   projects; money-never-stale badge verified in the browser.
4. End-to-end walk in production: signup → lead → remote survey → design (8.2 kWp demo) →
   proposal → link opened on a phone → accept.
5. Billing: live charge succeeded; webhook dedupe proven; read+export verified while
   entitlement-blocked.
6. Restore drill passed within the documented RTO; backups verified in Tigris (both layers).
7. RLS backstop: cross-tenant read/write fails at the DB even with app guards disabled.
8. Customer link states A–F + edge states render; Hindi proposal PDF correct; 375 px pass on
   every shipped screen; light and dark both correct.
9. Provenance tiers + structural disclaimer + Path-B label present on every surface that shows
   a number.

---

## 2 · Launch-2 — weeks 5–10 (order within the window is dependency-driven)

| Module | Scope | Depends on |
|---|---|---|
| **Field app** (`apps/mobile`, bare RN) | Auth (S1 pattern), My Day, leads quick-add, **surveys offline via PowerSync** (self-hosted service on Fly `bom`, Postgres bucket storage; NestJS backend connector write path; sync streams parameterised `tenant_id` + assignee; Attachments Helper → Tigris presigned), visits, push (Notifee + FCM/APNs), Lingui metro transformer, WebView studio (authenticated, full parity). **Store submissions start week 5** (TestFlight + Play internal) — review is a queue, join it early | W1 infra, S1, survey schema (already versioned-append) |
| **Physical survey full flow** | Guided capture (inline camera, local-first), shading capture (11 obstruction types, estimates labelled), review & submit with gaps-as-consequences, revisit = new version, sync status UI. UX: `SurveyorVisits.dc.html`, `ShadingCapture.dc.html`, `SurveyReview.dc.html` | Field app |
| **Voice agent GA** (`apps/voice` + module `agent`) | Number provisioning (`tenant_phone_numbers`: platform Exophone default / BYO hosted-ported with KYC), inbound IVR flow builder (greeting → menu → AI/human/voicemail, business-hours aware), outbound DTMF IVR traversal, CallSession orchestrator (Exotel AgentStream ↔ Sarvam), **ComplianceGate** (DND scrub, 9am–9pm, 1600/140x, opt-out, 90-day retention), agent config versioned (D36), queue, transcripts to lead timeline, performance screens with correlation-not-attribution. UX: `AgentSetup/Test/Queue/Knowledge/Unanswered/Performance/CallResult.dc.html`. **Gated by DLT/KYC lead time — the W1 paperwork decides the GA date, not the code** | S5, DLT, usage_events (already covers voice) |
| **Projects module** (`projects`) | Mark won → auto-create, 9-stage board (days-in-stage), payments vs tranches (same tranche rows), document checklist, blockers with named who-waits, handover pack, InstallationSheet reuse, customer link flips to states E/F. UX: `Project Flow.dc.html` | Customer-link lifecycle (already built for E/F) |
| **Notifications + global search** | Bell centre (deep-linked, agent-escalation prominent), push, app-wide search. UX: `NotificationsCentre.dc.html`, `GlobalSearch.dc.html` | Notification types enum (seeded W2) |
| **Pipeline funnel + full dashboards** | Owner/rep dashboards complete, funnel + win/loss reason lists (D37 honesty rules). UX: `OwnerDashboard.dc.html`, `RepDashboard.dc.html`, `PipelineFunnel.dc.html` | CRM + projects data |

## 3 · After Launch-2

1. **Scale programme** as studio-moat investment, phased per **docs/11-scale-program.md**.
   Already landed earlier: `ProjectionContext` (at port time — default equirectangular,
   UTM/ENU (proj4) selected for ground-mount/large sites) and `three-mesh-bvh` + far=250 cap
   removal (Launch-1, immediately post-port; scale Phase A). Remaining, Phase B onward:
   neutral mesh/AABB structs → blocks/tables/zones behaviour (schema exists from day one) →
   GPU shadow-map shading (WebGPU, three-mesh-bvh CPU fallback) → single-axis trackers +
   GCR backtracking → Copernicus GLO-30 terrain import (`./research/scale3d.md`).
2. **WhatsApp BYO-WABA** (`MessagingPort` v2 — Meta Embedded Signup, BSP shortlist per docs/07);
   D32 manual-copy stands until then.
3. **Named links + OTP-at-accept** (closes the D33 accepted risk for C&I).
4. **Marketplace / competitive features** per the verdicts in **docs/12-competitive-gaps.md**.
5. Testing programme design (post-release, per the thin-safety-net directive), billing tier
   iteration per docs/01, Fly-Postgres escape-hatch review at scale (docs/09).

---

## 4 · Forward-compatibility register (the "no missing foreign key" guard)

Read this BEFORE building each Launch-1 module. Each row is what LATER modules need from the
module NOW — cheap now, a migration crisis later.

| Launch-1 module | Build in NOW because later modules need it |
|---|---|
| **auth/tenancy** | Roles are stackable (M:N `user_roles`, OR-across-roles) — never a single `role` column. JWT claims shape `{tenant_id, roles[]}` is also the PowerSync sync-stream parameter source (Launch-2 offline). Long-lived refresh path so a surveyor authenticates once and works offline for days. Phone stored E.164. Users deactivate, never delete (history attribution). |
| **tenants** | Language is per-user (D25), never on tenant. Tenant settings as typed JSONB with room for: branding, proposal defaults, agent config ref, IVR flow ref, holiday calendar. `tenant_phone_numbers` table EXISTS from W1 (provider ref, type platform/byo, CLI series, status, KYC doc refs) — empty until voice GA, but FK-able from day one. |
| **billing** | `usage_events` schema covers ALL metered types now: billable `voice_minutes`, `ai_detections`, `storage_gb` + fair-use `otp_sms` (capped, NOT billed v1) + non-billable observability (`solar_data_fetch`, `map_tile_fetch`, `dem_tile_fetch`, `push_sent`, `document_rendered`) — voice ships months before its first ledger row, never the reverse. Entitlement checks are a decorator/guard, so later modules declare — not implement — gating. Read+export exemption lives in the guard. |
| **crm/leads** | `consent`, `dnd_status`, `do_not_call`, `preferred_language`, `consent_recorded_at` on customer/contact from W2 — the voice agent's ComplianceGate reads them at GA without touching CRM. `source` enum already includes `inbound_call`. Snooze/dormant/wake timestamps power Launch-2 repeatable jobs. Multiple contacts per customer (C&I) from the start. |
| **survey** | Versioned-append (revisit = new version, never overwrite) is exactly the PowerSync conflict strategy — remote surveys use the same tables the offline field app syncs later. `assigned_to` on survey/visit is the sync-stream partition key. Photos are rows referencing Tigris keys (generic `files` table shared with project documents and KYC docs), never blobs in Postgres. |
| **design** | JSONB payload keeps `segments[]` (parametric tables) — the seed of the blocks/tables/zones scale model — and persists the per-site `projection` selection (`ProjectionContext` exists from port time — default equirectangular, UTM/ENU (proj4) for ground-mount/large sites) so later phases change math, not schema. Five-layer fingerprints + `structuralVerification` (who + when) persisted. Rules injected per-tenant/jurisdiction — never a global. |
| **proposal/tranches** | Tranches are ONE table doubling as the project collection schedule: `project_payments` FK to `tranches`, so Launch-2 projects collect against the exact sent schedule (Phase-7 rule "do NOT invent figures"). Versions immutable once shared; server-assigned numbers. |
| **customer_links** | Lifecycle enum covers ALL states A–F (proposal, estimate, question, accept, **progress, handover**) from W3 — the projects module flips a state, it doesn't add columns. Open-tracking events append-only. |
| **catalog** | Resolution order (tenant-override → tenant-item → platform-item) is a single shared resolver used by proposal Step 8, studio Step 4 AND the BOM — fixed and tested BEFORE the proposal builder consumes it. Price-book rows versioned; archived items stay referencable. |
| **notifications** | Type enum seeded W2 with the full set incl. `agent_escalation` and `design_returned`, so W2–W4 modules emit into a table whose consumers arrive in Launch-2. |
| **studio port** | `packages/domain` stays pure TS with injected rules — the same kernels must run in browser Workers AND Node worker threads (Launch-2 server shading jobs, scale programme). `DocumentRenderPort`, `MessagingPort`, `PaymentLinkPort`, `TelephonyProvider` port interfaces defined in W2 even where v1 adapter is manual-copy. |
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
| **Studio-port underestimation** — the classic way this plan dies | H×H | Census-driven checklist (`./research/phases710.md` §2) makes "done" objective; port order by dependency (batches A–I, docs/05 §7) with ported tests green per batch; W2 start (not W3) gives it ~2.5 weeks; batches E (structure goldens) and I (insight & export) are the elastic ones — if W3 ends with E–F incomplete, W4 dashboards-lite and full owner dashboard defer to Launch-2, NEVER studio scope | Batch A–D not done by end of W2 → invoke the deferral rule immediately |
| **Single-dev-agent bottleneck** — everything serialises through one executor | H×M | Contract-first lets api/web/domain slices proceed independently; docs are load-bearing so context rebuilds are cheap; forward-compat register prevents rework loops; small complete slices keep WIP ≤1 module per layer | A module open >4 days → split it or cut scope inside it |
| **Razorpay onboarding/KYC slips** | M×M | Started W1; entire billing module works in test mode; trial-only model means nobody is blocked from using the product while live keys wait | Live keys not issued by mid-W4 → launch with trials only, charge on arrival of keys |
| **ts-rest Zod-4 drift / slowed cadence** | L×M | Zod 3 pinned; S3 re-checks; contracts are plain Zod so an oRPC migration path exists (`./research/verify-nestContracts.md`) | Blocking ts-rest bug → patch-fork, revisit oRPC at the 6-month review |
| **Tigris `sin` pin unverifiable via CLI** | L×M | S4 verifies with headers + console; adapter is S3-generic | S4 fails → support ticket; last resort any S3 endpoint, DPDP permits cross-border (docs/08) |
| **Playwright PDF Devanagari** | L×H | Chromium ships full shaping (that is WHY it was picked over react-pdf); Hindi golden PDF in W4 gate; Typst documented as swap | Gate render wrong → fonts/subsetting fix in worker image, not an architecture change |

Review this register at each week boundary; anything triggered gets a dated note here and, if
the response changes architecture, an ADR.
