# 14 — Build plan: tracks, dependencies, launch gate

> **DATELESS by design (rewritten 2026-07-30).** This document previously carried a 20-day
> calendar that reality invalidated: foundation work ran on its own path, and store accounts
> plus billable Fly infrastructure are owner-blocked
> (`./ops/company-registration-blockers.md`). Day numbers were being read as commitments they
> could no longer support.
>
> What survives — and what actually governs — is the **track dependency structure**, the
> **launch gate** and the **risk register**. Sequencing *within* a module lives in that
> module's roadmap (`./modules/`), never here. The **forward-compatibility register** moved to
> [`./modules/forward-compat.md`](./modules/forward-compat.md).
>
> The original timeline directive is recorded as SUPERSEDED in docs/15 §4 (directive 5). The
> SCOPE commitment it carried still stands: no Launch-2, no v1.1, no "later" bucket.

**Scope commitment (unchanged).** Everything in the product journey — CRM, billing, catalog,
proposals, customer links, remote + physical survey, voice agent, projects, dashboards,
notifications, search, the bare-RN mobile app (iOS + Android), the 3D Design Studio port, and
the offline layer — is in this plan. The priority ruling stands: **studio port and offline are
the last tracks**, everything else lands first. Billing IS in v1 (trial-only, no free tier).

**The only things that sit outside the build — stated honestly, because no plan can
compress them:**
1. **Third-party approval clocks**: DLT registration (1–2 wks), Exotel KYC/number
   provisioning (2–6 wks), Razorpay live-key KYC (days–2 wks), Apple/Google store review.
   ALL code ships regardless; these gates decide *activation*, not build. Every one is filed
   as early as possible and has a documented fallback (test route / WhatsApp-OTP /
   TestFlight+internal track). Current blocked state: `./ops/company-registration-blockers.md`.
2. **Spec-locked exclusions** (product decisions, not deferrals): D32 WhatsApp sending
   (manual copy IS the design; a tenant WABA also needs Meta approval no 20-day plan can
   grant), D29 custom-role builder, D35 photo-derived measurement, D9 inventory/PO/O&M,
   referral credits ledger (R15 — the referral tag + "came from" chip DO ship in Track A
   CRM), and C13 post-handover generation monitoring (D9/journey "beyond v1").
3. **Utility-scale studio enhancements** (scale Phases B/C: GPU shadow-map shading,
   trackers, terrain): the build ships the full studio + scale Phase A (BVH,
   ProjectionContext, blocks/tables schema — large C&I designs work); B/C continue
   afterwards as studio-moat investment per docs/11. Flagged for owner visibility.

Sources: docs/15 (rulings + the owner directives absorbed from the archived BLUEPRINT) ·
./research/* (read the status banner on each) · UX mockups by filename. Operating rules per
CLAUDE.md: contract → schema → implement → verify running; small complete slices; no orphan
screens; gates green always.

**The lever that makes parallel work possible: maximum parallel agent tracks.**
Contract-first + the frozen data model (docs/04) + exclusive module ownership let independent
slices run concurrently. The plan below is organised as parallel TRACKS ordered by
DEPENDENCY, not as a single queue and not by date. WIP rule stays ≤1 module per layer *per
track*.

**Web + mobile lockstep rule (owner directive, 2026-07-24):** a module with a mobile
surface is not done until BOTH its web and RN screens ship, in the same slice, from the
same contract — verified in the browser and on both simulators. Mobile is never a
follow-up task; Track M below is the RN thread of the same modules, not a separate phase.

---

## Track F — Foundations + all external paperwork filed

**Depends on:** nothing. **Blocks:** every other track.

**FIRST, before any code:** file MSG91/DLT registration · Razorpay KYC + plan objects
(Starter/Growth/Pro × monthly+yearly) · Exotel account/KYC/Exophone pool + BYO-porting
quote + AgentStream access · Apple & Google developer accounts. These are the only
external-clock risks; everything else is ours.

| Item | What | When | Blocks |
|---|---|---|---|
| Owner accounts | GitHub org/repo + remote, Fly.io org + payment method, Grafana Cloud, Tigris (via Fly) | before any deploy | everything (CI, deploys, observability) |

**Scaffold:** pnpm + Turborepo + TS refs; Biome + dependency-cruiser + sherif +
Boundaries; CI (typecheck/lint/test/build, red blocks merge) incl. macOS iOS lane;
`packages/tokens` generated from `design/ds-source` (light-only, Geist; extensions:
Devanagari face, semibold, brand-wash, studio viz namespaces, contrast pairs) + `/design`
reference page; `packages/contracts` root (ts-rest + Zod 3 pinned, error envelope, OpenAPI
emit in CI); `packages/db` migration 0001 (tenants, users, role_preset enum + user_roles,
audit_log, usage_events full metric enum, tenant_phone_numbers, sync_mutations, files, RLS
plumbing — Better Auth's own migrator runs alongside, its tables are not authored in 0001;
0001 covers the identity/platform spine of the §4 register, every other table lands with
its owning module's first migration); Fly apps up in `bom` — **one app per service**:
heliogrid-web, heliogrid-api, heliogrid-worker, heliogrid-voice, heliogrid-powersync
(prebuilt journeyapps image), plus the postgres-flex 3-node cluster app and log-shipper,
connected over 6PN/flycast (Upstash fixed, Tigris `sin` pin verified, secrets, min=1 +
sin overflow).

**Spikes (verdict notes committed):** S1 Better Auth phone-OTP on bare RN ·
S2 pgBackRest→Tigris archive + RESTORE DRILL · S3 ts-rest/Zod-4 status · S4 Tigris pin ·
S5 Exotel BYO + DTMF · S6 PowerSync self-host deploy smoke (pulled forward from the old
offline phase so Track E starts warm).

## Track A — identity & money core

**Depends on:** Track F. **Blocks:** B, C, M (everything tenant-scoped).

- **auth + tenancy** (first in track): Better Auth (organization/phoneNumber/jwt), MSG91 OTP
  (test route until DLT), signup/invites/roles (6 presets, OR-across, widest visibility),
  JWT claims, RLS backstop live. UX: Login/LoginFlow/SignUp/SignUpFlow/WhatYouSell/
  SellFlow/YoureReady/ReadyFlow/InviteLanding/InviteFlow/YourRole/RoleFlow/TeamRoles/
  SetupLater.
- **billing** (after auth): plans/subscriptions/entitlements/usage ledger; trial lifecycle;
  Razorpay webhooks (test mode) with dedupe + reconciliation poll; entitlement guard
  (proposal counts 30/300/1,500, Starter 10 active projects, kW ceilings, bundles);
  read+export-always in the guard itself. Settings/Billing/ProfilePreferences/
  BusinessProfile screens.
- **settings & templates**: message templates (message_templates table,
  3 languages) — UX: MessageTemplates; business profile — UX: BusinessProfile,
  BizDocPreview (letterhead preview).
- **CRM core** (parallel with billing): customers/contacts (phone identity, **merge flow INCLUDED** —
  R8 pulled into scope per the no-v1.1 directive: re-point references to survivor, loser
  marked merged, money tables untouched), leads full state machine + snooze/dormant
  repeatable jobs, dedupe at quick-add, assign w/ rep load, qualification, timeline, tasks,
  CSV import w/ column mapping + duplicate preview (UX gap — designed in-slice);
  referral tag + came-from chip (R15); first-run coach marks (≤3, dismissible); demo Pune
  project seed (You're-ready door). UX: QuickAddLead/Leads/LeadDetail/MyDay.
- **catalog** (before proposal consumes it): two-tier tables + single resolver + versioned price book + seeds.
  UX: CatalogPriceBook.

## Track B — the money path & customer surface

**Depends on:** Track A (tenancy, catalog). **Blocks:** Track D activation (Path A).

- **proposal builder** (first in track): 11 steps, Path B primary + Path A seams complete
  (activates when Track D lands), versions, server numbers, tranches Σ=100%, components
  gate via resolver, money invariants green, preview w/ blocking validation, quick mode.
  UX: all Proposal*/Prop* files + BomView.
- **customer link** (after proposal): HMAC tokens, states A–F one URL, edge states, accept flow,
  3G text-first rule. **Named links + OTP-at-accept INCLUDED** (R6 mitigation pulled into
  scope): per-contact labelled links + MSG91 OTP challenge on Accept above tenant-set
  threshold — closes the D33 ₹92L risk at launch. UX: CustomerProposal/CustomerPage/
  PropDocPage (+ named-link management designed in-slice, UXG row).
- **remote survey** (parallel with customer link): thin domain subset port lands here (geo, roof-factory,
  roof-ai kernels, finance, normalize — ported tests green); locate → detect (dataLayers +
  Gemini fallback, metered proxies, SSRF-guarded relay) → ghost review → coverage-failure →
  gaps. UX: SurveyMode/LocateBuilding/DetectRoof/CoverageFailure/GapsRemote.
- **projects** (after proposal accept exists): mark won → auto-create, 9-stage board, payments vs tranches,
  documents, blockers, handover, link states E/F, BYO-Razorpay PaymentLinkPort live.
  UX: Project Flow.

## Track C — voice agent + awareness surfaces

**Depends on:** Track A (identity, notifications enum), Track B (proposal events to follow up on).

- **voice agent** (code-complete; GA activation = DLT/KYC clock; architecture
  per **ADR-0019** — capability-negotiated port family + provider-agnostic control
  plane): apps/voice CallSession (Exotel AgentStream ↔ Sarvam) + CallOrchestrator
  (call-leg FSM, routing-policy executor, ComplianceGate on every leg), number
  provisioning (platform Exophone / BYO-forwarding — no porting, S5) + inbound IVR
  flows, **cold transfer + pinned-context handoff + callback queue live; warm transfer
  live if the Exotel consult-leg sandbox verifies (else auto-degrades);
  single-level escalation live, chains as data; DTMF-send/IVR-traversal degrades
  honestly (absent on Exotel — S5)**, queue + triggers (repeatable jobs),
  transcripts→timeline, config versioning, knowledge base + unanswered loop,
  performance screens (correlation-not-attribution), per-tenant cost ledger.
  Track C's first migration adds ring_groups / routing_policies / call_handoffs /
  user_presence (docs/04 §8). UX: all 7 Agent* files. Fallback if Exotel clock
  overruns: Bolna adapter behind the same ports (S5 verdict decides — now RESOLVED, see docs/spikes).
- **notifications + global search**: bell centre, push wiring, app-wide
  search. UX: NotificationsCentre/GlobalSearch.
- **dashboards** (last in track): owner + rep + funnel/win-loss (D37 honesty rules).
  UX: OwnerDashboard/RepDashboard/PipelineFunnel.

## Track M — mobile, in LOCKSTEP with web (owner directive)

**Not a phase.** Track M is the RN thread of the SAME modules in A/B/C — each module's mobile surface ships in that module's own slice, never after it.

**Web and mobile are developed together, not sequentially.** The bare-RN app scaffolds on
early (RN CLI init iOS+Android, keychain, Notifee+FCM/APNs wiring, Lingui metro, tokens
theme, repository-interface data layer), and from then on **every module slice that
has a mobile surface ships its RN screens in the SAME slice as its web screens** — one
ticket, both surfaces, verified on browser AND simulators before the module is done:
- auth/invites/onboarding: RN login/OTP/invite/profile alongside web.
- CRM: My Day, leads, quick-add, lead detail on RN with the web slice.
- surveys: guided capture, inline camera, shading capture, review/submit,
  visits — RN-primary (the field surfaces), web mode in the same slice.
  UX: SurveyorVisits, ShadingCapture, SurveyReview (+ SurveyMode shared with Track B).
- notifications/search, then dashboards-lite mobile views.
- Studio = authenticated WebView slot (activates with Track D); billing/settings screens
  are web-first with RN read views.
Online-first behind repository interfaces throughout (PowerSync swap in Track E).
**TestFlight + Play internal from the first authenticated build** — the store-review
clock starts as early as physically possible; internal distribution is the Day-20
reality, public listing follows review.

## Track D — THE STUDIO PORT (flagship; last by priority, in scope by directive)

**Depends on:** Track B (the design/proposal slot it plugs into), packages/domain existing. **Gate:** `docs/product/studio-census.md` — the census never shrinks.

Port batches A–I per docs/05 §7 (A partially pre-lands with the remote-survey slice in Track B), ported POC tests green per
batch, one-frame gate live from batch D and never red; BVH + far-cap removal immediately
post-port; studio web shell + DS-refactor screens (mode toolbar, touch gestures, big
handles, progressive disclosure) wired end-to-end: lead → survey → design → **Path A
proposal + BOM activate** → share → accept; engineer sign-off queue + return-with-comments;
InstallationSheet; blocks/tables schema live. **Acceptance = the phase-10 tool census as a
literal checklist — the census gate is a QUALITY gate and does not move for the calendar;
if the track nears its end with census rows open, the release valve is dashboards/polish
scope elsewhere, NEVER census rows.** UX: DesignStudio/ProjectSetup/RoofSetup/Obstructions/
PanelLayout + Layout* sheets + BomDetail + Components. StudioPlaceholder.dc.html is
retired — the studio ships inside this build; the disabled "Create design" slot (created in Track B)
replaces it.

## Track E — offline layer + hardening + LAUNCH GATE

**Depends on:** all repository interfaces in place (forward-compat register: mobile). **Last track** — nothing at launch depends on offline.

- **offline**: heliogrid-powersync Fly app (prebuilt journeyapps image,
  S6 pre-verified), sync streams
  (tenant+assignee), backend connector on sync_mutations, attachments → Tigris presigned,
  mobile repository swap to synced SQLite, physical survey fully offline, sync-status UX.
- **hardening + gate** (final): Razorpay live keys (if issued; else trial-only launch,
  charge on arrival), Hindi PDF golden, rate limits, audit coverage, alerts, restore drill
  #2, cross-tenant invariants, end-to-end walk (signup → lead → remote survey → design →
  Path A proposal → link on a phone → OTP accept → project → tranche received).

**LAUNCH GATE (all or no launch):**
1. `pnpm turbo typecheck && lint && test` green — ported domain-subset tests + locked
   invariants passing.
2. Money invariants: GST/discount/subsidy/tranche sums; proposal total === Σ tranches;
   BOM total === proposal total on seeded projects (Path A live); money-never-stale badge
   verified in the browser.
3. End-to-end walk in production: signup → lead → remote survey → design → Path A
   proposal → link opened on a phone → OTP accept → project created → tranche marked
   received.
4. Billing: live charge succeeded (or trial-only fallback documented); webhook dedupe
   proven; read+export verified while entitlement-blocked.
5. Restore drill passed within documented RTO; both backup layers verified in Tigris.
6. RLS backstop: cross-tenant read/write fails at the DB with app guards disabled.
7. Customer link states A–F + edge states render; Hindi proposal PDF correct; 375px pass
   on every shipped screen; light theme correct (R19-A).
8. Provenance tiers + structural disclaimer + Path-B label on every number-bearing
   surface.

PLUS: studio tool census 100% · offline survey round-trip proven on a real device in
airplane mode · named-link OTP accept verified · voice agent live-call demo on the
platform number (or documented DLT-pending with Bolna/test evidence).

---

## Forward-compatibility register — MOVED

> Extracted to **[`./modules/forward-compat.md`](./modules/forward-compat.md)** on
> 2026-07-30 so it can be cited and read without loading the whole build plan, and REMOVED
> here so there is one copy to keep current. `/roadmap` requires every module to restate its
> row before its first migration.

## Risk register

| Risk | L×I | Mitigation / release valve |
|---|---|---|
| **20-day scope compression** — the plan's own size | H×H | Parallel tracks + contract-first isolation; the ONLY release valves are dashboard polish, funnel analytics depth, and agent-performance screens — NEVER: money invariants, tenancy isolation, census rows, offline round-trip, provenance/honesty surfaces. Anything cut ships in the days immediately after 20, and the cut is logged here dated. |
| DLT delay (OTP + voice) | H×M | Filed as early as possible; WhatsApp-OTP fallback; voice code-complete with test evidence; Bolna Plan-B adapter. |
| Exotel KYC/number clock (2–6 wks) | H×M | Filed as early as possible; S5 verdict RESOLVED; Bolna fallback keeps voice demo-able at launch even if Exophones lag. |
| Store review | M×M | TestFlight/Play-internal = the launch distribution; public listing follows. **[2026-07-26: store org accounts wait on company registration (D-U-N-S) — owner declined personal accounts; until then internal distribution = APK sideload + simulator (docs/ops/company-registration-blockers.md).]** |
| postgres-flex deprecated | M×H | Unchanged mitigations; restore drill EARLY and again before launch; failed drill = launch blocker. |
| Studio-port underestimation | H×H | Census checklist objective; thin subset pre-lands in Track B; batches parallelisable after D; valve rule above — census never shrinks. |
| bom capacity | M×H | min=1, sin overflow, paid plan from the start. |
| Razorpay live keys late | M×M | Test mode complete; trial-only launch; charge on key arrival. |
| Single-executor serialization | H×H | Track ownership is exclusive; docs are load-bearing; a module open >2 days (was 4) → split or scope-cut within it. |

Review daily at the 20-day cadence; triggered rows get dated notes; architecture-changing
responses get an ADR.
