# ADR-0012: Voice agent — Exotel + Sarvam behind a thin orchestrator; ComplianceGate is ours

Status: Accepted
Date: 2026-07-24

## Context

The voice agent (lead follow-up, inbound reception) must run under Indian telecom law (TRAI/DLT, DND scrubbing, 1600/140x number series, CLI rules) with Indic speech quality (Hindi/Marathi/Gujarati/Tamil/Telugu/English) and DPDP-clean residency — voice audio, transcripts and PII must not transit US infrastructure. Per-tenant telephony is a binding directive: platform-provisioned numbers or BYO (hosted/ported with KYC), plus IVR in both directions.

## Decision

**Buy the two things we must never build in India; own the thin glue.** **Exotel** is the `TelephonyProvider` (UL-VNO-licensed carrier, strongest DLT operations, AgentStream bidirectional WS, IVR applets, DTMF). **Sarvam AI** is `SpeechProvider` + `LanguageModel` (Saarika STT — lowest WER in 13/15 Indian languages; Bulbul TTS — beats ElevenLabs on Hindi prosody; sovereign India compute). **`apps/voice` (NestJS standalone)** hosts the thin `CallSession` orchestrator: turn-taking, barge-in, AI disclosure ≤30s, escalate-to-human, outcome classification — never vendor-specific. Cost ≈ ₹2.5–4/min outbound all-in; every leg (telephony seconds, STT minutes, TTS chars, LLM tokens) is metered per tenant into the usage ledger.

- **`ComplianceGate` is our non-swappable code**: daily DND scrub, consent, 9am–9pm window + holiday calendar, 1600 (transactional) vs 140x (promotional) routing, keypress opt-out honoured ≤24h, 90-day recording retention. The ₹25,000-per-complaint penalty lands on the tenant as Principal Entity — so the gate lives in our code, not a vendor's.
- **Per-tenant numbers**: default platform Exophone; BYO = hosting/porting with KYC (TRAI CLI rules mean it is never caller-ID spoofing). `tenant_phone_numbers` entity in the data model. BYO porting mechanics = week-1 spike.
- **IVR both directions**: inbound per-tenant flow builder (greeting → menu → AI agent / human / voicemail, business-hours aware); outbound DTMF traversal (`sendDtmf`/`onDtmf` on `TelephonyProvider`, prompt detection via STT).
- **Bolna is the documented Plan B** behind the same ports; LiveKit self-host is the v2 reference target the port is designed for.

## Consequences

- Two vendors behind one port layer keeps Exotel→Bolna→LiveKit a config swap; the orchestrator is the moat-bearing code we own.
- We own turn-taking latency tuning — the hardest engineering in the seam we kept.
- Several rate figures come from vendor/SEO blogs; itemised INR quotes from Exotel and Sarvam are required before committing SLAs (flagged in research).
- Agent config is versioned; queued calls use the queue-time version (D36).

## Alternatives rejected

- **Vapi / Retell / Bland** — audio transits US infra → fails DPDP residency; DLT bolt-on or absent; ₹-cost no better.
- **Sarvam Samvaad (managed runtime)** — sovereign and capable but launched early 2026, telephony/DLT maturity unproven, and buying the runtime dissolves our swap boundary.
- **Bolna as primary** — strong India-native all-in-one (~₹6/min) but we inherit their agent runtime and coarser cost/persona control; kept as Plan B.
- **LiveKit self-host now** — best long-term, but we would own SIP trunking, DLT wiring and turn-taking tuning pre-launch; deferred to v2.
- **Pipecat** — Python; breaks TypeScript-everywhere.
- **Twilio/Plivo/Knowlarity/Ozonetel** — cost, thin India DLT tooling, or weak streaming APIs respectively.

## Sources

- `../research/voice.md`
- https://docs.exotel.com/exotel-agentstream/bidirectional-streaming · https://www.sarvam.ai/api-pricing · https://docs.sarvam.ai/api-reference-docs/pricing
- https://huggingface.co/datasets/ai4bharat/SpeechArenaBench · https://www.caller.digital/blog/trai-dnd-compliance-ai-outbound-calling-india
- https://blog.bolna.ai/indian-voice-ai-platform-for-businesses/
- BLUEPRINT.md — Final-review directive 7 (per-tenant telephony + IVR, binding)
