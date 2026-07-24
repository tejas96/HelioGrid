# 14 — The 20-Day Build Plan

**Owner directive (2026-07-24, final): the ENTIRE product ships in 20 days. There is no
Launch-2, no v1.1, no "later" bucket.** Everything in the product journey — CRM, billing,
catalog, proposals, customer links, remote + physical survey, voice agent, projects,
dashboards, notifications, search, the bare-RN mobile app (iOS + Android), the 3D Design
Studio port, and the offline layer — is in this plan. The earlier priority ruling stands
*inside* the window: **studio port and offline are the last tracks**, everything else lands
first. Billing IS in v1 (trial-only, no free tier).

**The only things that sit outside the 20 days — stated honestly, because no plan can
compress them:**
1. **Third-party approval clocks**: DLT registration (1–2 wks), Exotel KYC/number
   provisioning (2–6 wks), Razorpay live-key KYC (days–2 wks), Apple/Google store review.
   ALL code ships inside the 20 days; these gates decide *activation* dates, not build
   dates. Every one is filed on Day 1 and has a documented fallback (test route /
   WhatsApp-OTP / TestFlight+internal track).
2. **Spec-locked exclusions** (product decisions, not deferrals): D32 WhatsApp sending
   (manual copy IS the design; a tenant WABA also needs Meta approval no 20-day plan can
   grant), D29 custom-role builder, D35 photo-derived measurement, D9 inventory/PO/O&M.
3. **Utility-scale studio enhancements** (scale Phases B/C: GPU shadow-map shading,
   trackers, terrain): the 20-day build ships the full studio + scale Phase A (BVH,
   ProjectionContext, blocks/tables schema — large C&I designs work); B/C continue
   immediately after as studio-moat investment per docs/11. Flagged for owner visibility.

Sources: BLUEPRINT.md (as amended) · ./research/* (all) · docs/15 rulings · UX mockups by
filename. Operating rules per CLAUDE.md: contract → schema → implement → verify running;
small complete slices; no orphan screens; typecheck+lint+invariants green always.

**The lever that makes 20 days possible: maximum parallel agent tracks.** Contract-first +
the frozen data model (docs/04) + exclusive module ownership let independent slices run
concurrently. The plan below is organised as parallel TRACKS with day ranges, not a single
queue. WIP rule stays ≤1 module per layer *per track*.

---

## Day 1–2 — Foundations (Track F) + ALL external paperwork filed

**Day 1, before any code:** file MSG91/DLT registration · Razorpay KYC + plan objects
(Starter/Growth/Pro × monthly+yearly) · Exotel account/KYC/Exophone pool + BYO-porting
quote + AgentStream access · Apple & Google developer accounts. These are the only
calendar risks; everything else is ours.

**Scaffold (Day 1–2):** pnpm + Turborepo + TS refs; Biome + dependency-cruiser + sherif +
Boundaries; CI (typecheck/lint/test/build, red blocks merge) incl. macOS iOS lane;
`packages/tokens` generated from `design/ds-source` (light-only, Geist; extensions:
Devanagari face, semibold, brand-wash, studio viz namespaces, contrast pairs) + `/design`
reference page; `packages/contracts` root (ts-rest + Zod 3 pinned, error envelope, OpenAPI
emit in CI); `packages/db` migration 0001 (tenants, users, role_preset + user_roles,
Better Auth tables, audit_log, usage_events full enum, tenant_phone_numbers, sync_mutations,
files — the forward-compat register §4 satisfied from the first migration); Fly bom apps up
(web/api/worker, postgres-flex 3-node, Upstash fixed, Tigris `sin` pin verified, secrets,
min=1 + sin overflow).

**Spikes (Day 1–2, verdict notes committed):** S1 Better Auth phone-OTP on bare RN ·
S2 pgBackRest→Tigris archive + RESTORE DRILL · S3 ts-rest/Zod-4 status · S4 Tigris pin ·
S5 Exotel BYO + DTMF · S6 PowerSync self-host deploy smoke (pulled forward from the old
offline phase so Track E starts warm).

## Day 3–6 — Track A: identity & money core

- **auth + tenancy** (Day 3–4): Better Auth (organization/phoneNumber/jwt), MSG91 OTP
  (test route until DLT), signup/invites/roles (6 presets, OR-across, widest visibility),
  JWT claims, RLS backstop live. UX: Login/LoginFlow/SignUpFlow/WhatYouSell/YoureReady/
  InviteLanding/InviteFlow/YourRole/TeamRoles.
- **billing** (Day 4–6): plans/subscriptions/entitlements/usage ledger; trial lifecycle;
  Razorpay webhooks (test mode) with dedupe + reconciliation poll; entitlement guard
  (proposal counts 30/300/1,500, Starter 10 active projects, kW ceilings, bundles);
  read+export-always in the guard itself. Settings/Billing/ProfilePreferences/
  BusinessProfile screens.
- **CRM core** (Day 4–6): customers/contacts (phone identity, **merge flow INCLUDED** —
  R8 pulled into scope per the no-v1.1 directive: re-point references to survivor, loser
  marked merged, money tables untouched), leads full state machine + snooze/dormant
  repeatable jobs, dedupe at quick-add, assign w/ rep load, qualification, timeline, tasks,
  CSV import w/ column mapping + duplicate preview (UX gap — designed in-slice).
  UX: QuickAddLead/Leads/LeadDetail/MyDay.
- **catalog** (Day 5–6): two-tier tables + single resolver + versioned price book + seeds.

## Day 6–10 — Track B: the money path & customer surface

- **proposal builder** (Day 6–9): 11 steps, Path B primary + Path A seams complete
  (activates when Track D lands), versions, server numbers, tranches Σ=100%, components
  gate via resolver, money invariants green, preview w/ blocking validation, quick mode.
  UX: all Proposal*/Prop* files + BomView.
- **customer link** (Day 7–9): HMAC tokens, states A–F one URL, edge states, accept flow,
  3G text-first rule. **Named links + OTP-at-accept INCLUDED** (R6 mitigation pulled into
  scope): per-contact labelled links + MSG91 OTP challenge on Accept above tenant-set
  threshold — closes the D33 ₹92L risk at launch. UX: CustomerProposal/CustomerPage/
  PropDocPage (+ named-link management designed in-slice, UXG row).
- **remote survey** (Day 7–10): thin domain subset port lands here (geo, roof-factory,
  roof-ai kernels, finance, normalize — ported tests green); locate → detect (dataLayers +
  Gemini fallback, metered proxies, SSRF-guarded relay) → ghost review → coverage-failure →
  gaps. UX: SurveyMode/LocateBuilding/DetectRoof/CoverageFailure/GapsRemote.
- **projects** (Day 8–10): mark won → auto-create, 9-stage board, payments vs tranches,
  documents, blockers, handover, link states E/F, BYO-Razorpay PaymentLinkPort live.
  UX: Project Flow.

## Day 9–13 — Track C: voice agent + awareness surfaces

- **voice agent** (Day 9–13, code-complete; GA activation = DLT/KYC clock): apps/voice
  CallSession (Exotel AgentStream ↔ Sarvam), ComplianceGate, number provisioning
  (platform Exophone / BYO-ported) + inbound IVR flows + outbound DTMF traversal, queue +
  triggers (repeatable jobs), transcripts→timeline, config versioning, knowledge base +
  unanswered loop, performance screens (correlation-not-attribution), per-tenant cost
  ledger. UX: all 7 Agent* files. Fallback if Exotel clock overruns: Bolna adapter behind
  the same ports (S5 verdict decides by Day 5).
- **notifications + global search** (Day 10–12): bell centre, push wiring, app-wide
  search. UX: NotificationsCentre/GlobalSearch.
- **dashboards** (Day 11–13): owner + rep + funnel/win-loss (D37 honesty rules).
  UX: OwnerDashboard/RepDashboard/PipelineFunnel.

## Day 10–15 — Track M: mobile app (bare RN, iOS + Android)

Online-first behind repository interfaces (PowerSync swap ready): auth (S1 pattern),
My Day, leads + quick-add, surveys (guided capture, inline camera, shading capture,
review/submit, revisit=new version), visits, notifications, profile/language, WebView
studio slot. Notifee+FCM/APNs, Lingui metro, keychain. **TestFlight + Play internal from
Day 12** (store review clock starts early; internal distribution is the Day-20 reality,
public listing follows review).

## Day 14–18 — Track D: THE STUDIO PORT (flagship; last by priority, in scope by directive)

Port batches A–I per docs/05 §7 (A partially pre-landed Day 7), ported POC tests green per
batch, one-frame gate live from batch D and never red; BVH + far-cap removal immediately
post-port; studio web shell + DS-refactor screens (mode toolbar, touch gestures, big
handles, progressive disclosure) wired end-to-end: lead → survey → design → **Path A
proposal + BOM activate** → share → accept; engineer sign-off queue + return-with-comments;
InstallationSheet; blocks/tables schema live. **Acceptance = the phase-10 tool census as a
literal checklist — the census gate is a QUALITY gate and does not move for the calendar;
if Day 18 arrives with census rows open, the plan's release valve is dashboards/polish
scope elsewhere, NEVER census rows.** UX: DesignStudio/ProjectSetup/RoofSetup/Obstructions/
PanelLayout + Layout* sheets + BomDetail.

## Day 17–20 — Track E: offline layer + hardening + LAUNCH GATE

- **offline** (Day 17–19): PowerSync process group (S6 pre-verified), sync streams
  (tenant+assignee), backend connector on sync_mutations, attachments → Tigris presigned,
  mobile repository swap to synced SQLite, physical survey fully offline, sync-status UX.
- **hardening + gate** (Day 19–20): Razorpay live keys (if issued; else trial-only launch,
  charge on arrival), Hindi PDF golden, rate limits, audit coverage, alerts, restore drill
  #2, cross-tenant invariants, end-to-end walk (signup → lead → remote survey → design →
  Path A proposal → link on a phone → OTP accept → project → tranche received).

**LAUNCH GATE (all or no launch):** gates 1–8 from the previous plan version PLUS: studio
tool census 100% · offline survey round-trip proven on a real device in airplane mode ·
named-link OTP accept verified · voice agent live-call demo on the platform number (or
documented DLT-pending with Bolna/test evidence).

---

## §4 Forward-compatibility register — UNCHANGED and now mandatory reading Day 1

(Same table as before; with everything compressed into 20 days it is the difference
between parallel tracks converging and colliding. Migration 0001 satisfies every row.)

| Module | Build in NOW |
|---|---|
| auth/tenancy | Stackable roles M:N; JWT claims = PowerSync stream params; long-lived refresh for offline; E.164; deactivate-never-delete. |
| tenants | Per-user language; settings JSONB w/ branding/agent/IVR/holiday room; tenant_phone_numbers from migration 0001. |
| billing | usage_events full metric enum from day 1; entitlement guard is a decorator; proposal/project caps read COUNT over cycle window; read+export exemption in the guard. |
| crm/leads | consent/dnd/do_not_call/preferred_language on customers from day 1 (ComplianceGate reads them); source incl. inbound_call; snooze/dormant timestamps; multi-contact; merge-ready (survivor re-pointing touches no money tables). |
| survey | Versioned-append = the PowerSync conflict strategy; assigned_to = stream partition key; photos = files rows w/ Tigris keys; sync_mutations exists from 0001. |
| design | designs table + JSONB payload schema in 0001; segments[] + projection persisted; fingerprints + structuralVerification columns; rules injected. Lead detail shows "Create design" disabled until Track D lands (day ~16), then enables — the flow slot exists from Day 6. |
| proposal/tranches | ONE tranches table = project collection schedule; Path A columns from Day 6; versions immutable; server numbers. |
| customer_links | Full A–F lifecycle + label + contact_id + otp_required from Day 7 (named links now in scope, used at launch). |
| catalog | Single resolver fixed/tested before proposal consumes it. |
| notifications | Full type enum seeded Day 3 incl. agent_escalation, design_returned. |
| mobile | ALL data access behind repository interfaces — Day 17 swap is a data-layer change only. |
| domain subset | Pure TS + injected contexts from the first module; kernels dual-runtime (browser Worker + node worker_thread). |
| audit/files/jobs | audit_log from first mutation; one files table; BullMQ names namespaced. |

## §5 Per-module execution template — unchanged (contract → schema → domain → DoD → UX/spec sources).

## §6 Risk register (20-day edition)

| Risk | L×I | Mitigation / release valve |
|---|---|---|
| **20-day scope compression** — the plan's own size | H×H | Parallel tracks + contract-first isolation; the ONLY release valves are dashboard polish, funnel analytics depth, and agent-performance screens — NEVER: money invariants, tenancy isolation, census rows, offline round-trip, provenance/honesty surfaces. Anything cut ships in the days immediately after 20, and the cut is logged here dated. |
| DLT delay (OTP + voice) | H×M | Filed Day 1; WhatsApp-OTP fallback; voice code-complete with test evidence; Bolna Plan-B adapter. |
| Exotel KYC/number clock (2–6 wks) | H×M | Filed Day 1; S5 verdict Day 5; Bolna fallback keeps voice demo-able at Day 20 even if Exophones lag. |
| Store review | M×M | TestFlight/Play-internal from Day 12 = the Day-20 distribution; public listing follows. |
| postgres-flex deprecated | M×H | Unchanged mitigations; restore drill Day 2 AND Day 19; failed drill = launch blocker. |
| Studio-port underestimation | H×H | Census checklist objective; thin subset pre-lands Day 7; batches parallelisable after D; valve rule above — census never shrinks. |
| bom capacity | M×H | min=1, sin overflow, paid plan Day 1. |
| Razorpay live keys late | M×M | Test mode complete; trial-only launch; charge on key arrival. |
| Single-executor serialization | H×H | Track ownership is exclusive; docs are load-bearing; a module open >2 days (was 4) → split or scope-cut within it. |

Review daily at the 20-day cadence; triggered rows get dated notes; architecture-changing
responses get an ADR.
