# ADR-0019 — Telephony as a platform capability framework (provider-agnostic, capability-negotiated)

**Status:** Accepted (owner directive, 2026-07-26) · **Supersedes:** the monolithic
`TelephonyProvider` interface of docs/07 §4 (v1 draft) and the BYO-porting/DTMF-send
wording of BLUEPRINT directive 7 (see §Compliance-with-reality below).

## Context

The voice agent was specified as an Exotel-shaped integration: one `TelephonyProvider`
interface whose methods were exactly what Exotel AgentStream offers, with escalation as a
single "escalate-to-human" action inside CallSession. Two forces broke that framing:

1. **Owner directive (2026-07-26):** telephony is a long-term PLATFORM capability — AI-first
   handling, warm/cold transfer, multi-level tenant-configurable escalation, context/summary
   handoff, callback queues, DTMF both directions, and later conferencing, recording,
   monitoring, analytics, voicemail, queue management, more providers — with launch
   implementing only what launch needs, on an architecture that never needs refactoring to
   grow.
2. **Spike S5 (2026-07-25):** parts of the Exotel-shaped interface are not real on Exotel —
   there is **no documented DTMF-send** on AgentStream, BYO numbers are
   **inbound-forwarding, not porting**, and the 1600 series is closed to non-BFSI. A
   1:1-with-the-vendor interface would have baked a vendor's gaps into product law.

## Decision

### 1. A port FAMILY with capability negotiation — never one grand interface

`packages/adapters/telephony` exposes a small REQUIRED core plus OPTIONAL capability
interfaces. Every adapter declares what it truly supports; business logic branches on the
declaration, never on the vendor name.

```ts
interface TelephonyCorePort {                       // REQUIRED of every adapter
  placeOutbound(to: E164, from: TenantNumberRef, opts: CallOpts): Promise<CallLeg>;
  onInbound(handler: (call: InboundLeg) => void): void;
  mediaStream(leg: CallLeg): DuplexAudio;
  hangup(leg: CallLeg): Promise<void>;
  getCapabilities(): TelephonyCapabilities;          // static, honest, per adapter+account
}

interface TelephonyCapabilities {
  dtmfReceive: boolean;      dtmfSend: boolean;
  transferCold: boolean;     transferWarm: boolean;   // consult leg + bridge
  conference: boolean;       recording: boolean;
  monitoring: boolean;       // listen / whisper / barge
  voicemail: boolean;        queueing: boolean;       // provider-side queue/hold
  numberProvisioning: boolean; inboundIvr: boolean;
}

// Optional interfaces an adapter MAY implement (checked via capabilities, then cast):
interface DtmfCapable      { sendDtmf(leg, digits): Promise<void>; onDtmf(leg, h): void; }
interface TransferCapable  { consult(leg, to): Promise<CallLeg>;   // warm: new leg, caller held
                             bridge(a, b): Promise<void>; redirect(leg, to): Promise<void>; }
interface ConferenceCapable{ createRoom(...): Promise<Room>; addLeg(room, leg): Promise<void>; }
interface RecordingCapable { startRecording(leg): Promise<RecordingRef>; stop(ref): Promise<void>; }
interface MonitoringCapable{ listen(leg): DuplexAudio; whisper(leg, audio): Promise<void>; barge(leg): Promise<void>; }
interface VoicemailCapable { deposit(leg, box): Promise<void>; }
```

**Rule:** a feature that needs a missing capability degrades along a DEFINED ladder
(docs/07 §4 matrix) — it never throws, and it never silently no-ops. Example: outbound
IVR traversal requires `dtmfSend`; on an adapter without it, the campaign step is skipped
and the call is flagged `ivr_blocked` for human follow-up.

### 2. Two planes inside apps/voice

- **Media/AI plane** (`CallSession`) — unchanged: STT→LLM→TTS turn-taking, barge-in,
  AI-disclosure ≤30 s, outcome classification. Talks only to `SpeechProvider`,
  `LanguageModel` and the media half of the core port.
- **Call-control plane** (`CallOrchestrator`) — NEW, provider-agnostic: owns the call-leg
  state machine (`ai_handling → handoff_pending → consulting → bridged → completed`, plus
  `callback_queued`, `voicemail`, `failed`), executes routing plans, enforces
  ComplianceGate before EVERY dial (consult legs included), and writes the ledger
  (`calls`, `call_handoffs`). Every transfer/escalation/conference is a plan executed
  here — vendor adapters only move legs.

### 3. Routing and escalation are TENANT DATA, not code

`routing_policies` (versioned-append JSONB documents, D36-style pinning): ordered rules
`when(conditions) → then(action)`. Conditions: AI confidence below threshold, customer
requests human, detected intent/department, priority tier, business-hours state, caller
is VIP/existing project, retry count. Actions: `continue_ai`, `warm_transfer(target)`,
`cold_transfer(target)`, `escalate(chain)`, `enqueue_callback(queue)`, `voicemail(box)`.
Targets: a user, a `ring_group` (members + strategy round_robin/simultaneous/longest_idle),
or an external E164. **Escalation chains** are ordered levels with per-level ring timeout
and no-answer fallthrough; final fallback is ALWAYS reachable (callback queue or
voicemail) so a caller is never stranded.

### 4. Context travels with every handoff

`call_handoffs` (append-only): AI-generated summary, intent, sentiment, collected fields,
transcript pointer, target, kind (warm/cold/escalation level), outcome (accepted /
no_answer / rejected / timeout). Warm transfers additionally deliver a TTS **whisper
summary** to the human before bridging (requires `transferWarm`); cold transfers push the
summary via notification + timeline deep-link. The summary is generated ONCE at handoff
decision time and pinned — the human sees what the AI knew.

### 5. Launch scope vs platform scope (what ships when)

| Capability | Launch (Track C) | Platform seam ready |
|---|---|---|
| AI-first handling, business-rule config | ✅ live | — |
| Cold transfer + context push | ✅ live | — |
| Warm transfer (whisper + bridge) | ✅ if Exotel sandbox verifies consult legs by Day 11; else auto-degrades to cold | interfaces + FSM states shipped |
| Multi-level escalation chains | ✅ single-level live; chains = data already | executor handles N levels |
| Callback queue + fallback routing | ✅ live (`call_queue` trigger `callback_requested`) | — |
| DTMF receive | ✅ live (S5-verified event) | — |
| DTMF send / IVR traversal | ❌ degrades (S5: undocumented on Exotel) | capability flag + trace fields exist |
| Conference, recording*, monitoring, voicemail, provider queues | ❌ not built | capability interfaces + schema seams only |
| Additional providers (Bolna Plan-B, LiveKit/Twilio later) | Bolna adapter if S5 triggers fallback | registry keyed by `phone_provider` enum |

*Call recording as a FEATURE surface is later; the 90-day recording-retention compliance
machinery (docs/04 `calls.recording_file_id`) is unchanged v1.

### 6. Compliance stays ours and fail-closed

ComplianceGate is unchanged and non-swappable (docs/07 §6); the control plane classifies
every leg (promotional / transactional / internal) and gates accordingly. Per S5:
promotional outbound uses the **140-series RTM route** (1600 is closed to non-BFSI);
BYO = inbound-forwarding + ExoPhone outbound identity — product copy must say forwarding.

## Consequences

- Track C builds the control plane + policies executor once; every later feature
  (conference, monitoring, new vendors) is an adapter capability + a product surface —
  no architectural change. New provider = implement core + whatever is real, declare
  honestly, map `phone_provider` enum value.
- Schema additions (`ring_groups`, `routing_policies`, `call_handoffs`, `user_presence`,
  `call_queue` callback fields, `calls.outcome += transferred`) land in **Track C's first
  migration**; they are specified now in docs/04 §8 so earlier tracks leave room
  (forward-compat register updated).
- The Exotel adapter declares `{dtmfSend: false, transferWarm: unverified→sandbox}` —
  the platform is honest about vendor gaps instead of hiding them in code paths.
- Rejected: building on a CCaaS suite (adds a vendor exactly where we're removing
  coupling) · one grand interface with UnsupportedOperation throws (turns product flows
  into try/catch vendor probing) · per-vendor business logic branches (the thing this
  ADR exists to kill).
