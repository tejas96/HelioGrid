# 07 — Integrations: Ports & Adapters

Every external system sits behind a **port** — a plain TS interface owned by us — with one
production **adapter** bound per environment. Domain code (`packages/domain`) never sees a
port; orchestration code in `apps/api` and `apps/worker` calls the port and feeds results
into pure domain functions.

## Package layout (ruling)

- **Port interfaces + envelope types**: `packages/contracts/src/ports/` — pure types, zero
  runtime deps, importable everywhere.
- **Adapter implementations**: a server-only adapters package, created with the first module
  that needs one; it may import `contracts`, `domain`, `db` and never `apps/*`. One
  implementation shared by every service — no copy-paste adapters per app. dependency-cruiser
  gets a rule for this layer when it lands.
- **Binding**: NestJS custom providers per app module, e.g.
  `{ provide: SOLAR_DATA_PORT, useClass: PvgisAdapter }`. Swapping an adapter is a one-line
  provider change plus config.

## Global rules (apply to every port)

1. **Server-side only.** No third-party call from a browser or the RN app, with one
   exception: the Google Maps JS key (intentionally public, HTTP-referrer-locked). All keys
   live in Fly secrets; per-tenant BYO credentials (Razorpay, WABA) are AES-256-GCM
   app-layer encrypted at rest with a per-tenant DEK envelope (master key in Fly secrets)
   in `tenant_integration_credentials`, authored by the module that first needs it.
2. **Status envelope, never throw across the port.** Ported from the POC proxy pattern
   :

   ```ts
   type PortResult<T> =
     | { status: 'ok'; data: T; meta?: { cached?: boolean; provider: string; version?: string } }
     | { status: 'unavailable'; reason: string; retryAfterS?: number }  // upstream down / out of coverage
     | { status: 'unconfigured'; reason: string }                       // key/creds missing (graceful)
     | { status: 'error'; reason: string; providerCode?: string };
   ```

   HTTP relays return 200 with the envelope. Streaming/telephony ports use handles +
   typed events instead (they are session-shaped, not request-shaped).
3. **Timeouts are mandatory** (stated per port below). Idempotent GETs get exactly one
   transient retry; nothing else retries inside the adapter — retry policy belongs to the
   caller (BullMQ backoff for jobs, user-visible retry for interactive calls).
4. **Circuit breaker**: after 5 consecutive adapter failures, open for 60 s (return
   `unavailable` immediately), then half-open. Implemented once in the adapters package.
5. **Per-tenant metering hook**: every adapter is wrapped at binding time:

   ```ts
   withMetering(adapter, {
     port: 'RoofDetectPort', op: 'detect',
     units: (r) => (r.status === 'ok' ? 1 : 0),
     metric: 'ai_detections',          // usage_events.metric
     billable: true,                   // billable metrics check entitlements BEFORE the call
   });
   ```

   Emits an append-only `usage_events` row (`tenant_id, metric, quantity, unit, provider_ref,
   cost_estimate_minor, occurred_at`) via a fire-and-forget BullMQ enqueue — metering never
   blocks or fails the request. Billable metrics (`voice_minutes`, `ai_detections`, `otp_sms`
   (fair-use, NOT billed v1), `storage_gb`) run the entitlement soft-block check first
   before the call. Non-billable observability metrics (`solar_data_fetch`,
   `map_tile_fetch`, `dem_tile_fetch`, `push_sent`, `document_rendered`) are metered anyway
   for quotas, fairness and COGS dashboards.

## Port census

| Port | v1 adapter | Later adapters | Billable meter |
|---|---|---|---|
| SolarDataPort | PVGIS (SARAH3→ERA5) | NSRDB, Solcast | no (quota only) |
| BuildingInsightsPort | Google Solar | — (enhancement only) | no (quota only) |
| RoofDetectPort | DSM plane-fit → Gemini fallback | fine-tuned vision model | **ai_detections** |
| TelephonyProvider | Exotel | Bolna (Plan B), LiveKit SIP (v2) | **voice_minutes** |
| SpeechProvider / LanguageModel | Sarvam | AI4Bharat self-host, Chirp (global) | rolled into voice_minutes |
| ComplianceGate | ours — **non-swappable** | never | no |
| MessagingPort | ManualCopyAdapter | BYO-WABA (Embedded Signup) | v2: messages_sent |
| PaymentLinkPort | BYO-Razorpay per tenant | Cashfree, Razorpay Route | no |
| SubscriptionBillingPort | Razorpay Subscriptions | Stripe (overseas tenants) | n/a (it IS billing) |
| DocumentRenderPort | Playwright/Chromium | Typst | no (capacity metric) |
| PushPort | FCM HTTP v1 (+APNs via FCM) | — | no |
| OtpPort | MSG91 SMS → WhatsApp fallback | — | otp_sms (fair-use, not billed v1) |
| MapsPort | Google Static/JS Maps | Esri, Mapbox | no (quota only) |
| DemPort | Copernicus GLO-30 | SRTM, drone DTM import | no |

---

## 1. SolarDataPort — energy source of record

```ts
interface SolarDataPort {
  getSiteWeather(pin: LatLng): Promise<PortResult<SiteWeather>>;
}
```

**v1: `PvgisAdapter`.** Upstream `https://re.jrc.ec.europa.eu/api/v5_3/MRcalc?lat&lon&horirrad=1&d2g=1&raddatabase={db}&outputformat=json`,
8 s timeout. **DB ladder `['PVGIS-SARAH3','PVGIS-ERA5']`**: a 400 on SARAH3 (all of India is
outside its grid) falls through to ERA5; 400 on both → `unavailable`. Pure mapper
`pvgisToWeather` ports as-is from the POC (`SiteWeather{monthlyGhi[12], monthlyDiffuseFrac[12],
annualGhi, forLatLng, source, raddatabase, yearsOfRecord}`), including the verified Pune
fixture test. Server cache: `solar_data_cache` table keyed on lat/lng rounded to 4 dp + db,
TTL 30 days (PVGIS is multi-year climatology; it does not change daily).

**Scope binding (unchanged from POC):** PVGIS is the ONLY energy source. Google Solar flux
layers are never requested; no adapter may introduce a second irradiance path without an ADR.

**Failure/degradation:** `unavailable` → domain falls back to `mockIrradiance(lat)` with
`irradianceSource:'estimate'` provenance; the estimate badge renders on energy and finance
outputs; design is never blocked. Money produced from an estimate carries the provisional
provenance chain (`CLAUDE.md` money rules).

**Metering:** `solar_data_fetch`, non-billable; per-tenant daily quota (default 500) as a
courtesy limit on a free EU service — we are a good citizen or we lose the source of record.

## 2. BuildingInsightsPort — enhancement, never dependency

```ts
interface BuildingInsightsPort {
  findClosest(pin: LatLng): Promise<PortResult<SolarInsights>>;
  getDataLayers(pin: LatLng, radiusM: number): Promise<PortResult<DataLayerRefs>>; // DSM+RGB+mask ONLY
  relayGeoTiff(ref: GeoTiffRef): Promise<PortResult<ReadableStream>>;              // SSRF-guarded
}
```

**v1: `GoogleSolarAdapter`.** `buildingInsights:findClosest` (requiredQuality=BASE, 8 s
timeout, 404 → `unavailable`, cached 24 h) and `dataLayers:get` (view=IMAGERY_LAYERS,
requiredQuality=LOW, radius clamped 10–100 m). **Flux/irradiance layers are never requested.**

**GeoTIFF relay:** Google's raster URLs are key-authenticated and expire in ~1 h, so the API
exposes `/v1/solar/geotiff?src=…` which streams bytes with the key appended server-side.
**SSRF guard is load-bearing:** the only relayable prefix is
`https://solar.googleapis.com/v1/geoTiff:get` — exact-prefix match, no redirects followed,
upstream 404 → 410 (client treats as expired-retryable). This guard ports verbatim from the
POC and is listed in `08-security-and-tenancy.md`.

**Failure/degradation:** any status other than `ok` simply means the studio starts from
manual tracing + MapsPort tiles. No feature depends on Google Solar existing — India
coverage is patchy and that is fine.

**Metering:** `solar_data_fetch`, non-billable, per-tenant daily quota (Google bills us per
call; quota protects margin). Platform key only in v1; per-tenant BYO keys are a later
adapter option the table structure already allows.

## 3. RoofDetectPort — DSM primary, Gemini fallback

```ts
interface RoofDetectPort {
  detect(req: {
    pin: LatLng; radiusM: number;
    tile: StoredTileRef;          // the EXACT satellite tile the canvas shows (1:1 px mapping)
    calibration: { spanM: number };
  }): Promise<PortResult<RoofArtifact>>;   // versioned artifact — the ONLY AI→Project doorway
}
```

**v1: `CompositeRoofDetectAdapter`** — try DSM, fall back to Gemini:

1. **DSM path (primary):** `BuildingInsightsPort.getDataLayers` → geotiff decode → plane
   fit → vectorise. Runs in `apps/worker` (BullMQ job, CPU-bound), not the request thread.
   Provenance `source:'dataLayers'`.
2. **Gemini path (fallback, or DSM `unavailable`):** `generateContent` on
   `GEMINI_MODEL ?? 'gemini-2.5-flash'` with the POC's binding rules, all non-negotiable:
   `temperature: 0`, `responseMimeType:'application/json'` + enforced `responseSchema`,
   **versioned prompt** (`GEMINI_PROMPT_VERSION='roof-detect-v1'`, recorded as provenance),
   no-guessing instructions (empty result beats invented roof), 25 s timeout, 4 MB image
   cap. Server fetches the same stored tile the canvas rendered — guaranteed 1:1 pixel
   mapping. `crossCheckWithGeometry` floors confidence ≤0.25 where a detected roof overlaps
   the aerial building mask <20%. Provenance `source:'gemini'`.

**Both paths exit through `validateArtifact`** (version → pin → geometry → bounds →
confidence, per-entity drop-with-reason). No AI output enters a `Project` any other way;
`applyArtifact` stamps `EntityProvenance` so the UI can say "N AI-detected entities —
dimensions are detector estimates".

**Failure/degradation:** both paths fail → `unavailable`; the user traces manually. Missing
Gemini key → `unconfigured` (graceful, feature hidden). Never a hard error in the studio.

**Metering:** `ai_detections`, **billable**, 1 unit per successful detect (either path —
the tenant buys the outcome, not the vendor). Entitlement check before dispatch; bundled
detections per plan, metered beyond.

## 4. Telephony — a capability-negotiated port FAMILY (ADR-0019)

Telephony is a PLATFORM capability, never one vendor-shaped interface. A small REQUIRED
core plus OPTIONAL capability interfaces; every adapter declares what it truly supports
via `getCapabilities`, and business logic branches on the declaration — never on the
vendor name. Full rationale + interfaces: [ADR-0019](./adr/0019-telephony-platform-capability-framework.md).

```ts
interface TelephonyCorePort {                       // REQUIRED of every adapter
  placeOutbound(to: E164, from: TenantNumberRef, opts: CallOpts): Promise<CallLeg>;
  onInbound(handler: (call: InboundLeg) => void): void;
  mediaStream(leg: CallLeg): DuplexAudio;
  hangup(leg: CallLeg): Promise<void>;
  getCapabilities: TelephonyCapabilities;   // dtmfSend/Receive, transferWarm/Cold,
}                                             // conference, recording, monitoring,
                                              // voicemail, queueing, provisioning, ivr
// Optional: DtmfCapable · TransferCapable (consult/bridge/redirect) · ConferenceCapable ·
// RecordingCapable · MonitoringCapable (listen/whisper/barge) · VoicemailCapable
```

**Two planes in the voice service:** the media/AI plane (`CallSession` — STT→LLM→TTS,
barge-in, disclosure) and the provider-agnostic **call-control plane**
(`CallOrchestrator` — call-leg FSM, routing-plan execution, ComplianceGate before every
leg incl. consult legs, ledger writes). Transfers, escalation chains, callbacks and
conferences are control-plane plans; adapters only move legs.

**Routing/escalation are tenant DATA:** `routing_policies` (versioned-append JSONB) —
conditions (AI confidence, customer-requests-human, intent/department, priority,
business hours, VIP) → actions (`continue_ai`, `warm_transfer`, `cold_transfer`,
`escalate(chain)`, `enqueue_callback`, `voicemail`). Targets: user, `ring_group`, or
external number. Escalation chains ring level-by-level with timeouts; the final
fallback (callback queue / voicemail) is always reachable. Every handoff writes
`call_handoffs` with the pinned AI summary/context; warm transfers deliver a TTS
whisper summary before bridging, cold transfers push summary + deep-link.

**Capability degradation ladder (binding):** a feature needing a missing capability
degrades on a defined path — never throws, never silently no-ops. Warm transfer w/o
`transferWarm` → cold transfer + push. IVR traversal w/o `dtmfSend` → step skipped,
call flagged `ivr_blocked` for human follow-up. No agent available → callback queue →
voicemail. Conference/monitoring/voicemail/provider-queues are declared, not built, v1.

**v1: `ExotelAdapter`** (spike S5).
AgentStream gives <20 ms media over WS so the voice service owns STT→LLM→TTS itself.
Honest capability declaration per S5: `dtmfReceive: true` (verified event shape);
**`dtmfSend: false`** (undocumented on AgentStream — in-band synthesis is a sandbox
experiment, not a plan); `transferCold: true` (leg redirect via applet/API);
`transferWarm:` **sandbox-verify by Day 11**, else auto-degrade. Outbound promotional
uses the **140-series RTM route** — 1600 is closed to non-BFSI (TRAI, S5).

**Number provisioning (per-tenant, BLUEPRINT directive 7 as amended by ADR-0019/S5):**
default = platform-provisioned Exophone; **BYO = the tenant's existing number
forwarding inbound to their ExoPhone — outbound identity remains the ExoPhone. There is
no porting/hosting of outbound CLI (TRAI; Exotel numbers are not transferable) and
product copy must say "forwarding".** Backed by `tenant_phone_numbers`. **Inbound IVR**
is a per-tenant flow config (greeting → menu → AI agent / ring group / voicemail,
business-hours aware) compiled to provider applets; the `IvrFlow` JSON is ours, so a
provider swap re-compiles rather than rebuilds.

**Later adapters:** `BolnaAdapter` = documented Plan B (all-in-one runtime; coarser
control, same ports — S5 verdict gates the Day-5 go/no-go). `LiveKitSipAdapter` /
`TwilioAdapter` = future; each maps a `phone_provider` enum value and declares its own
capability matrix. Adding one is an adapter + enum value — zero business-logic change.

**Failure/degradation:** call-setup failure → 2 retries with backoff, then the attempt is
marked failed and rescheduled per campaign rules; media drop mid-call → attempt one apology
TTS, else hangup, outcome `dropped` (call record always written); Exotel API down → outbound
queues pause (breaker), inbound falls to Exotel-side voicemail applet; alert on >5 % call
error rate (`09-observability-and-ops.md`).

**Metering:** every leg natively metered — telephony seconds, STT seconds, TTS chars, LLM
tokens — ledgered per call in `calls.cost_breakdown` and rolled into billable
`voice_minutes`. ≈₹2.5–4/min outbound all-in .

## 5. SpeechProvider + LanguageModel — Sarvam

```ts
interface SpeechProvider {
  stt(audio: AudioStream, lang: Lang): AsyncIterable<Transcript>;   // Saarika, streaming
  tts(text: string, voice: VoiceId, lang: Lang): AudioStream;       // Bulbul
}
interface LanguageModel {
  complete(persona: AgentPersonaVersion, kb: KnowledgeRef, turns: Turn[]): AsyncIterable<Token>;
}
```

**v1: `SarvamAdapter`** — lowest Indic WER (13/15 languages), Bulbul beats ElevenLabs on
Hindi prosody, sovereign India compute (DPDP-clean); covers Hindi/Marathi/Gujarati/Tamil/
Telugu/English ([Sarvam pricing](https://www.sarvam.ai/api-pricing)). Agent config is versioned; queued
calls use the queue-time version (D36).

**Later adapters:** AI4Bharat self-host (cost floor / SLA fallback), Google Chirp or
equivalent for non-Indic markets when global expansion needs it.

**Failure/degradation:** STT stall >3 s mid-call → play filler, retry once, then
escalate-to-human or voicemail per tenant IVR config; LLM timeout → same ladder. The
orchestrator (`CallSession` in the voice service) owns turn-taking, barge-in, AI-disclosure ≤30 s,
escalation and outcome classification — never vendor code.

**Metering:** STT seconds, TTS characters, LLM tokens per call → `cost_breakdown`; surfaced
in the tenant's per-call cost ledger.

## 6. ComplianceGate — ours, non-swappable

```ts
interface ComplianceGate {
  canDial(tenantId: string, number: E164, callType: 'transactional' | 'promotional')
    : Promise<{ ok: true } | { ok: false; reason: 'dnd' | 'opt_out' | 'window' | 'series' | 'scrub_stale' }>;
  recordOptOut(tenantId: string, number: E164, source: 'keypress' | 'agent' | 'manual'): Promise<void>;
  retentionSweep: Promise<void>;   // nightly BullMQ repeatable job
}
```

**One concrete implementation, no alternate adapter, ever.** TRAI penalties (₹25,000 per
upheld complaint) land on the tenant as Principal Entity, so the gate lives in OUR code, not
the vendor's ([TRAI/DLT compliance](https://www.caller.digital/blog/trai-dnd-compliance-ai-outbound-calling-india)).
Enforces, before **every** dial: daily-refreshed DND scrub (category-level) + tenant opt-out
list; 9 am–9 pm promotional window + holiday calendar; 1600 (transactional) vs 140x
(promotional) series routing; keypress opt-out honoured ≤24 h; 90-day recording retention
via `retentionSweep` (delete from Tigris + tombstone the ledger row).

**AMENDED 2026-08-02 (global-backend ruling):** the MECHANISM above is what is
non-swappable — every outbound dial passes this gate, no override flag, no alternate adapter.
The statutory RULESET the gate enforces is per-market data from the market pack; everything
in this section (DND scrub, 9am–9pm window, 1600/140x series, ≤24 h opt-out, 90-day
retention) is the IN ruleset (TRAI/DLT). A market with no voice ruleset in its pack cannot
enable outbound voice. This resolves the prior tension with docs/engineering/02 §10, which places the
compliance calendar in RulesContext.

**Fail-closed:** DND scrub data older than 24 h → promotional dialing pauses (reason
`scrub_stale`, alert fires); transactional continues. There is no override flag.

## 7. MessagingPort — manual v1, BYO-WABA v2

```ts
interface MessagingPort {
  renderTemplate(tenantId: string, key: TemplateKey, vars: Vars): RenderedMessage; // always works
  send?(tenantId: string, to: E164, msg: RenderedMessage): Promise<PortResult<SendRef>>; // v2
}
```

**v1: `ManualCopyAdapter`** — D32 stands: renders the message (Lingui-localised), the rep
copies it into their own WhatsApp. `send` is absent; UI shows copy-to-clipboard + wa.me
deep link. Zero regulatory surface, zero cost, ships day one.

**v2: BYO-WABA.** Each tenant connects **their own WABA** via Meta Embedded Signup (default
onboarding since April 2026; we register as Tech Provider). Tenant owns the WABA, number and
Business Portfolio — assets survive a provider switch; deliverability reputation is isolated
per tenant. BSP shortlist behind the port: AiSensy / Interakt (India SMB) or 360dialog
(flat pass-through) ([Meta Embedded Signup](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/overview),
[Meta pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)).
India per-message: marketing ≈₹0.88, utility/auth ≈₹0.13; utility inside the 24 h service
window is free — design follow-ups to ride that window.

**Failure/degradation:** v2 send failure → fall back to ManualCopy rendering (the v1 path
never leaves the codebase). WABA disconnect (tenant revokes) → `unconfigured`, settings nag.

**Metering:** v2 `messages_sent{category}` per tenant — cost pass-through is on the
tenant's own WABA billing; we meter counts for dashboards and fair-use only.

## 8. PaymentLinkPort — BYO-Razorpay per tenant

```ts
interface PaymentLinkPort {
  createLink(tenantId: string, req: { amountMinor: number; currency: string; purpose: string;
    customerRef: string; expiry?: ISODate }): Promise<PortResult<{ url: string; providerRef: string }>>;
  getStatus(tenantId: string, providerRef: string): Promise<PortResult<PaymentStatus>>;
  handleWebhook(tenantId: string, payload: unknown, sig: string): PaymentEvent; // idempotent, per-tenant secret
}
```

**v1: `RazorpayLinkAdapter`, tenant-scoped credentials.** Each EPC connects its own Razorpay
account; funds settle customer → EPC's merchant account directly. **The platform never
touches funds → no RBI Payment Aggregator licence** ([Razorpay Route](https://razorpay.com/route/) documented as the alternate adapter only, if
aggregation is ever demanded). Webhook verification uses the per-tenant secret; events are
idempotent on provider event id; tranche state machine lives in `projects` module.

**Later adapters:** `CashfreeLinkAdapter` (also a licensed PA); Route/Easy-Split marketplace
adapter (explicitly not default — master-merchant KYC burden).

**Failure/degradation:** tenant creds missing/invalid → `unconfigured`; tranche falls back
to manual-collection mode (record payment by hand — always available, cash is still king in
EPC). Missed webhook → `getStatus` poll reconciliation whenever a user views the tranche,
plus a 6-hourly sweep job.

**Metering:** none billable (tenant pays Razorpay directly); link-creation counts tracked
for adoption dashboards.

## 9. SubscriptionBillingPort — Razorpay Subscriptions

```ts
interface SubscriptionBillingPort {
  createSubscription(tenantId: string, planRef: string, opts: TrialOpts): Promise<PortResult<SubRef>>;
  cancel(tenantId: string, subRef: string, at: 'cycle_end' | 'now'): Promise<PortResult<void>>;
  handleWebhook(payload: unknown, sig: string): BillingEvent;
}
```

**v1: `RazorpaySubscriptionsAdapter`** — platform SaaS billing, INR, UPI AutoPay primary
(₹15k/debit cap fits tier prices) + card e-mandate fallback; native trial support carries
the trial-only/no-free-tier model; pre-debit notifications are Razorpay's job. Webhooks:
HMAC verify → dedupe on `x-razorpay-event-id` → fast-2xx → BullMQ queue;
`subscription.charged` grants the entitlement period; API-polling reconciliation backstop.
The full state machine, GST/e-invoicing and entitlement tables are authored by the billing
module — this port is deliberately thin.

**Later adapters:** Stripe for overseas tenants in USD (Stripe still isn't a general
domestic India acquirer).

**Failure/degradation:** webhook pipeline down → entitlements keep their last granted
period; reconciliation catches up. Enforcement is soft-block UX and **read + export always
work regardless of billing state** (product law).

## 10. DocumentRenderPort — Playwright now, Typst swap

```ts
interface DocumentRenderPort {
  render(kind: 'proposal' | 'quote' | 'sld' | 'work_order',
         payload: RenderPayload, locale: Locale): Promise<PortResult<{ tigrisKey: string; pages: number }>>;
}
```

**v1: `PlaywrightPdfAdapter`** in `apps/worker` — headless Chromium is the only renderer
that shapes Devanagari correctly (HarfBuzz); react-pdf is disqualified on broken
conjuncts/matras ([react-pdf #454](https://github.com/diegomura/react-pdf/issues/454)). Noto Sans Devanagari
bundled in the worker image; pooled browser, page-per-render; concurrency 2 per machine;
budget 300–500 MB RAM per render (worker sizing in `09-observability-and-ops.md`). Output
goes straight to Tigris; the API hands out presigned GETs.

**Later adapter:** `TypstAdapter` (rustybuzz shaping, far lower memory) if Chromium RAM cost
bites — the port returns a stored object either way, so the swap is invisible.

**Failure/degradation:** render timeout 60 s → retry once on a fresh browser → job fails
with user notification. The customer link always renders the proposal as web — PDF is an
artifact, never the only path to the number.

**Metering:** `document_rendered`, non-billable; drives worker capacity planning.

## 11. PushPort — FCM/APNs

```ts
interface PushPort {
  registerToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<void>;
  send(userId: string, n: { title: string; body: string; data?: Data }): Promise<PortResult<void>>;
}
```

**v1: `FcmAdapter`** (`firebase-admin`, FCM HTTP v1; APNs rides FCM). Client side is Notifee
+ react-native-firebase per the bare-RN decision (BLUEPRINT §Mobile — the research's Expo
Push suggestion is superseded by the no-Expo directive). Invalid-token responses prune the
token row.

**Failure/degradation:** push is best-effort by contract. The `notifications` table row is
the source of truth; the in-app inbox and badge derive from it, so a dropped push never
loses information.

**Metering:** `push_sent`, non-billable.

## 12. OtpPort — MSG91 SMS + WhatsApp fallback

```ts
interface OtpPort {
  send(to: E164, code: string, locale: Locale)
    : Promise<PortResult<{ providerRef: string; channel: 'sms' | 'whatsapp' }>>;
}
```

**v1: `Msg91Adapter`.** This port only DELIVERS the code; generating and verifying it is the
auth module's job. SMS via DLT-registered template (~₹0.15/SMS; **DLT registration
lead time 1–2 weeks is on the critical path**); WhatsApp-OTP
(same MSG91 account) as automatic fallback on SMS delivery failure or 30 s timeout.

**Rate limits (ours, in front of the port):** 3 sends/number/15 min, 8/number/day, per-IP
throttle — enforced in the auth module, not the adapter.

**Failure/degradation:** SMS fails → WhatsApp channel; both fail → login fails loudly with
a retry-later message and an ops alert (OTP delivery failure rate is an alerting metric).
No silent degradation on the front door.

**Metering:** `otp_sms`, non-billable — fair-use capped (rate limits above), never billed in v1.

## 13. MapsPort — satellite tiles

```ts
interface MapsPort {
  staticTile(pin: LatLng, zoom: number, sizePx: Size): Promise<PortResult<StoredTileRef>>;
  jsApiKey: string;   // the one intentionally-public key (referrer-locked)
}
```

**v1: `GoogleMapsAdapter`.** Static satellite tiles are fetched **server-side once per site
capture and stored in Tigris** (`StoredTileRef` = Tigris key + metres-per-pixel + fetch
date). This gives: stable 1:1 pixel mapping for RoofDetectPort, reproducible provenance
(the tile a design was traced on never changes under it), and one billing event instead of
per-render fetches. Interactive map picking uses Maps JS with the public key.

**Later adapters:** Esri World Imagery, Mapbox — global expansion or cost lever.

**Failure/degradation:** tile fetch failure → studio still opens with blank canvas + manual
calibration (known-distance rescale ports from the POC). Never blocks.

**Metering:** `map_tile_fetch`, non-billable, per-tenant daily quota.

## 14. DemPort — Copernicus GLO-30

```ts
interface DemPort {
  elevationGrid(bbox: BBox, resolutionM: 30): Promise<PortResult<ElevationGrid>>;
}
```

**v1: `CopernicusGlo30Adapter`.** Reads GLO-30 COG tiles from the public AWS Open Data
bucket (`copernicus-dem-30m`, no credentials), caches fetched tiles in Tigris so each tile
is fetched from origin once ever. Serves the scale program: terrain
awareness for ground-mount siting and the tracker/terrain phases; per-site UTM/ENU origin
conversion happens in domain code, not here.

**Later adapters:** SRTM fallback; drone-survey DTM import (survey photos remain reference
only — D35 — but a proper photogrammetric DTM upload is a legitimate future input).

**Failure/degradation:** `unavailable` → flat-terrain assumption with provenance `assumed`
and a visible warning on ground-mount outputs. Rooftop work never touches this port.

**Metering:** `dem_tile_fetch`, non-billable.

---

## Cross-references

- SSRF guard, credential encryption, webhook verification: `08-security-and-tenancy.md`.
- Alerting on port failure rates, breaker states and quota burn: `09-observability-and-ops.md`.
- Entities and entitlement enforcement: authored with each module's first migration; the
  forward-compat register states what that migration must already satisfy.
