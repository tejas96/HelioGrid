# Spike S5 — Exotel BYO number + AgentStream DTMF (doc-level; account pending KYC)

**Date:** 2026-07-25 · **Verdict: MATERIAL FINDINGS — three BLUEPRINT assumptions do not
survive doc-level verification. Hands-on legs BLOCKED on Exotel credentials.**
**✅ RECONCILED 2026-07-30.** All three findings are now carried by the live documents:
directive 7 in `../15-spec-resolutions.md` §4 (amendment stated above the superseded
wording), `../03-tech-stack.md` §14 (Telephony row, Orchestrator row and ComplianceGate all
corrected; the week-1 spike entry struck as resolved), and ADR-0019 as the binding form.
The archived `../archive/BLUEPRINT.md` retains the pre-S5 wording and is marked do-not-cite.
Still open: **hands-on verification** of the consult-leg/DTMF legs, blocked on Exotel
credentials — a findings-confirmation task, not a documentation gap.

## Finding 1 — BYO number is NOT a porting/hosting flow

- Exotel's own docs: caller-ID masking is illegal in India; outbound calls always present
  an Exotel-owned ExoPhone (ownership is not transferable). The only documented
  "use your existing number" mechanism is **inbound call-forwarding to an ExoPhone**.
- Product consequence: tenant "BYO number" must be scoped as *inbound forwarding +
  ExoPhone as the outbound identity* — not CLI portability. `tenant_phone_numbers` schema
  already accommodates this (`number_type='byo'` + status flow), but product copy and the
  BLUEPRINT's "hosted/ported with KYC" wording must change unless an account-manager-only
  hosting arrangement surfaces.
- Sources: support.exotel.com articles 3000018241 (outbound calls), 144680 (caller ID),
  135841 (existing number), 35760 (KYC docs).

## Finding 2 — AgentStream: DTMF RECEIVE yes, DTMF SEND no

- Bidirectional stream events Exotel→bot: `connected/start/media/dtmf/mark/stop` — the
  `dtmf` event delivers callee keypresses. ✔ inbound capture verified at doc level.
- Bot→Exotel events are **`media`, `mark`, `clear` only — there is NO documented DTMF
  send**. Outbound IVR traversal (BLUEPRINT directive 7's `sendDtmf()`) has no documented
  path; the only conceivable workaround is synthesising DTMF tones into the raw PCM
  `media` stream (8/16/24 kHz, 320-byte chunks) — undocumented, must be tested in sandbox.
- Sources: developer.exotel.com/docs/agentstream/developer-guide, docs.exotel.com
  voicebot-applet; Gather/Passthru applets cover flow-side DTMF capture.

## Finding 3 — 1600-series is closed to solar EPCs

- TRAI's July-2026 clarification: **1600 (transactional) is reserved for RBI/SEBI/IRDAI/
  PFRDA-regulated entities**. Outbound AI sales/follow-up is promotional under TCCCPR →
  **140-series via the registered-telemarketer route + mandatory DND/NCPR scrub**.
  Non-promotional service calls can run on a standard 10-digit business number.
- `cli_series` enum already carries `series_140`/`standard`; ComplianceGate design is
  unaffected (DND scrub was always mandatory). The BLUEPRINT's "1600/140x series" framing
  should drop the 1600 assumption for v1.

## Blocked without credentials
KYC portal steps + real timelines · 140-series provisioning path/cost/lead time ·
AgentStream sandbox test (dtmf receive latency, `clear` barge-in, in-band DTMF-send
experiment) · any AM-only BYO hosting option.

## Day-5 go/no-go input
If (a) 140-series provisioning is slow/unavailable, or (b) outbound DTMF traversal is a
hard requirement and in-band synthesis fails → trigger the Bolna fallback evaluation.
Note: TRAI obligations (140 + DND scrub) apply identically to any provider — not a
differentiator. First action when the account lands: written AM questions (BYO options,
DTMF-send roadmap, 140 lead time, DND scrub responsibility split).
