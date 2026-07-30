> **HISTORICAL EVIDENCE** — its conclusions are already promoted into the authority named below. Cite that, not this file. Promoted into ADR-0012 and ADR-0019, docs/07 §4 and docs/01 COGS. **Spike S5 corrected several of its assumptions** (BYO is inbound-forwarding only; no AgentStream DTMF-send; 1600-series closed to non-BFSI) — ADR-0019 is the operative form.

# AI Voice Agent Stack for HelioGrid (India, July 2026)

## Recommendation (v1): Integrate, don't buy a US black box, don't self-host yet

**Ship v1 on a two-vendor split behind one port layer: Exotel (telephony + DLT/TRAI compliance + AgentStream bidirectional streaming) as the `TelephonyProvider`, and Sarvam AI (Saarika STT / Bulbul TTS / Sarvam LLM) as the `SpeechProvider`+`LanguageModel`. Orchestrate turn-taking in a thin Node/TS service.** This is a "buy the hard parts, own the thin glue" posture: you buy the two things you must never build in India (carrier/DLT compliance, Indic speech quality) and keep orchestration swappable. Build-later = LiveKit self-host on Fly once volume justifies it.

Why this split wins on your fixed constraints: **DPDP data residency** — Sarvam runs on sovereign India compute and Exotel is a UL-VNO-licensed Indian carrier, so voice, transcripts, and PII never leave India by default (US vendors below fail this). **Indic quality** — Sarvam's Saarika/Audio posts the lowest WER in 13/15 Indian languages, ahead of Gemini 3 Pro, and Bulbul TTS beats ElevenLabs on Hindi prosody/retroflex consonants; it natively covers your Hindi/Marathi/Gujarati/Tamil/Telugu/English set. **Compliance is first-class** — Exotel has the strongest India DLT operations, 1600 vs 140x number-series routing, CLI/masking, and AgentStream gives <20ms media over WebSocket so your orchestrator does STT→LLM→TTS itself (the exact seam that makes vendors swappable).

## Per-minute cost estimate (outbound, all-in)

| Component | Rate | Per active min |
|---|---|---|
| Exotel outbound PSTN | ₹0.80–1.00/min | ₹0.90 |
| Sarvam STT (Saarika) | ₹30/hr | ₹0.50 |
| Sarvam TTS (Bulbul) | ₹15–30/10K chars | ₹0.30–0.60 |
| Sarvam LLM | ₹4/1M in, ₹16/1M out | ~₹0.15 |
| DLT scrub | ₹0.01–0.05/number | ~₹0.03 |
| Fly.io orchestration compute | amortized | ~₹0.10 |

**≈ ₹2.5–4.0/min outbound ($0.03–0.05); inbound ≈ ₹2.0–3.0/min** (Exotel inbound DID ₹0.30–0.50). This undercuts Vapi's India rate (₹3/min + ₹4,000 base) while staying DPDP-clean. Model per-tenant cost tracking by metering each leg (telephony seconds, STT minutes, TTS chars, LLM tokens) — all four are natively metered.

## Alternatives rejected

- **Vapi / Retell / Bland (buy, US):** all-in $0.10–0.31/min after telephony+models; India support is bolt-on (Vapi ₹3/min + base; Retell ₹15k, Bland ₹40k setup). Thin/absent DLT, and audio transits US infra — **fails DPDP residency**. Fine for a US product, wrong for Indian EPC.
- **Sarvam Samvaad (managed agent platform):** tempting — 11 languages, sub-500ms, multi-agent orchestration, cross-channel memory, sovereign. But launched early 2026, telephony/DLT integration maturity unproven, and buying the whole runtime weakens your swap boundary and per-tenant control. Keep as a fast-follow fallback for the `orchestrator` port.
- **Bolna (buy, India-native):** genuinely strong v1 all-in-one (~₹6/min / $0.06, Indian numbers, 10+ Indic languages, human-in-loop, <300ms, India/US residency). This is your best single-vendor shortcut **if you want to skip orchestration entirely** — but you inherit their agent runtime, thinner moat, and coarser cost/persona control. Recommended as the documented Plan B behind the same port.
- **LiveKit Agents self-host on Fly (build):** best long-term — native SIP, K8s/self-host, WebRTC, provider-swappable. But you'd own SIP trunking, DLT wiring, autoscaling, and turn-taking tuning now. Defer to v2 at volume; keep it as the reference target the port is designed for.
- **Pipecat (build):** clean pipeline-of-processors, self-hostable, Krisp/PSTN — but Python breaks your "TypeScript everywhere" rule. Only adopt if orchestration moves to a Python sidecar.
- **Twilio India (telephony):** best APIs/observability but 2–3× cost and thinnest India DLT. **Plivo**: good DX, competent DLT, but ₹3.5–4.5/min in one source and less India-native compliance tooling. **Knowlarity/Ozonetel**: strong DLT but weaker dev/streaming APIs. Exotel is the balance point (compliance + AgentStream + cost).
- **STT/TTS also-rans:** Google Chirp/Gemini 3 Pro (close #2 on Indic WER, but US residency), ElevenLabs multilingual (great naturalness, loses to Bulbul on Hindi, US), AI4Bharat (excellent permissive open models — keep as self-host fallback / cost floor, not v1 SLA).

## Port/adapter boundary (in the shared TS domain)

Define provider-neutral interfaces so Exotel→Bolna→LiveKit is a config swap:

```ts
interface TelephonyProvider {          // Exotel today; LiveKit/Bolna later
  placeOutbound(to, callerId, opts): Promise<CallHandle>;
  onInbound(handler): void;
  mediaStream(call): DuplexAudio;      // AgentStream WS
  hangup(call): Promise<void>;
}
interface SpeechProvider { stt(audio, lang): AsyncIter<Transcript>;
                           tts(text, voice, lang): AudioStream; }   // Sarvam
interface LanguageModel { complete(persona, kb, turns): AsyncIter<Token>; }
interface ComplianceGate {             // the enforce-before-dial guard
  canDial(number, tenant, callType): Promise<{ok: boolean; reason?}>;   // DND/category scrub, PE+template linkage, 9am–9pm window, number-series
}
interface CallRecord { recording; transcript; outcome: OutcomeClass;
                       language; costBreakdown; escalatedTo?; }
```

The orchestrator (`CallSession`) owns turn-taking, barge-in, escalate-to-human, AI-disclosure-in-first-30s, and outcome classification — never vendor-specific. **`ComplianceGate` is mandatory and non-swappable**: per TRAI, scrub before *every* campaign (DND refreshes daily, category-level + internal opt-out lists), enforce the 9am–9pm promotional window, route 1600 (transactional) vs 140x (promotional), disclose automation ≤30s, honor keypress opt-out within 24h, retain recordings 90+ days. Penalty is ₹25,000 per upheld complaint, levied on the tenant (Principal Entity) — so gate it in *your* code, not the vendor's.

## Sources

- [Sarvam API pricing](https://www.sarvam.ai/api-pricing) · [pricing docs](https://docs.sarvam.ai/api-reference-docs/pricing) · [Samvaad conversational agents](https://www.sarvam.ai/products/conversational-agents) · [LiveKit+Sarvam guide](https://docs.sarvam.ai/api/integration/build-voice-agent-with-live-kit)
- [Indic STT/TTS benchmarks (AI4Bharat SpeechArenaBench)](https://huggingface.co/datasets/ai4bharat/SpeechArenaBench) · [Voice of India ASR benchmark](https://arxiv.org/html/2604.19151v2) · [Open-source Indic voice AI 2026](https://caller.digital/blog/open-source-voice-ai-india-sarvam-ai4bharat-bhasini-2026)
- [Vapi vs Retell vs Bland true cost/min 2026](https://medium.com/@automation.labs/vapi-vs-retell-vs-bland-in-2026-the-true-cost-per-minute-578f38af3523) · [Voice AI cost/min India](https://www.thinnest.ai/blog/voice-ai-cost-per-minute-india)
- [Bolna India voice AI](https://blog.bolna.ai/indian-voice-ai-platform-for-businesses/) · [Voice AI pricing India ₹6/min](https://bolti.co.in/blog/voice-ai-platform-pricing-india-comparison)
- [Telephony partners India 2026 (Plivo/Exotel/Ozonetel/Knowlarity/Twilio)](https://caller.digital/blog/telephony-partner-voice-ai-india-plivo-exotel-ozonetel-knowlarity-twilio-2026) · [Voice API India guide](https://frejun.com/voice-api-india/) · [Exotel AgentStream bidirectional](https://docs.exotel.com/exotel-agentstream/bidirectional-streaming)
- [TRAI/DLT DND compliance for AI outbound](https://www.caller.digital/blog/trai-dnd-compliance-ai-outbound-calling-india)
- [LiveKit vs Pipecat frameworks](https://soniox.com/wiki/voice-agent-frameworks)

Note: several figures come from vendor/SEO blogs (dated 2026) rather than primary docs — confirm Exotel AgentStream and Sarvam rate cards via direct sales quote (INR, itemized) before committing SLAs.