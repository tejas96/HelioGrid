# SCR-M07-05 · Agent Setup & Settings

Guided pre-filled agent configuration plus runtime settings (on/off, triggers, languages, max attempts).

**Module:** M07 · Sales Execution · **Personas:** EPC Owner only (`F2.M01.configure-agent`) · **Context of use:** web emphasis for setup, mobile for the daily glance (M07 §2); a deliberate sit-down configuration task, resumable, never required on day one.

## Entry & exit

Reached from: tenant configuration — M01 owns the settings information architecture that lists the agent & voice surfaces (M01-57); this screen is the "Agent setup — guided" entry plus the runtime settings half. Leads to: the sibling surfaces M01-57 names — Calling window (SCR-M07-06), Test the agent (SCR-M07-07), Change history (SCR-M07-08), Business knowledge base (SCR-M07-09), Number provisioning (SCR-M07-17) and inbound call routing / IVR (SCR-M07-16). Publishing rides the versioned-append law (M07-14 — SCR-M07-08's slice). Any further entry/exit is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-08** (P0) — **A solar business owner never writes a prompt: setup is guided questions with everything pre-filled, plus a free-text "anything else" box so they are never limited.** Simple by default, open when they want more. The settings surface list and its placement in tenant configuration are `M01-57`'s; the behaviour of every screen is this module's.
- **M07-09** (P0) — **The guided steps cover, pre-filled: name · voice · languages · tone · opening line · what to say when it doesn't know · when to hand to a human · when it may call (hours, days, holidays) · maximum attempts before it gives up.** Everything is editable **within the compliance floor** (§M07.6): above-floor items are the owner's; floor items only narrow. _(non-UI half, build-side: floor items can only narrow; above-floor items are the owner's — for awareness, not for drawing)_
- **M07-10** (P0) — **The opening line ships pre-filled with a natural opener — "I'm Asha from [company]" — with no proactive AI mention at IN launch (owner ruling 2026-08-04, Q6)**, and the owner can keep or change the wording. Four **hard floors are product law no edit can remove**: the agent never claims to be human; never denies being AI when asked (honest answer plus an immediate human offer); instant human handoff on request; full transcription to the timeline. Whether the opener must *proactively* disclose AI is **pack data** (F1-36(d)): the IN pack ships proactive disclosure OFF and auto-flips it ON with owner notification when TRAI's AI-caller identification rule binds; EU-class packs ship ON. The pre-filled example is market-pack seed content. _(non-UI half, build-side: four hard floors no edit removes; proactive disclosure is pack flag with TRAI auto-flip — for awareness, not for drawing)_
- **M07-11** (P0) — **Hand-over rules are a list the owner edits, adds to or removes** — price questions · angry customer · asks for the owner · a question it can't answer · asks to stop — each with what the agent says as it hands over. Sensible defaults, none forced — **except "asks to stop", which is the statutory opt-out and cannot be removed** (floor, F1-36(c)). _(non-UI half, build-side: asks-to-stop rule is statutory opt-out, cannot be removed — for awareness, not for drawing)_
- **M07-15** (P0) — **The agent speaks six languages at launch — Hindi, Marathi, Gujarati, Tamil, Telugu and English — chosen per customer (set on the record, or auto-detected on the call), tenant-configurable, and independent of the three interface languages.** The sets never converge by accident (`F3-29` reciprocated: F3 states the boundary; this module owns the set). _(non-UI half, build-side: six agent languages stay independent of three interface languages — for awareness, not for drawing)_
- **M07-34** (P0) — **Agent settings, runtime half: on/off · which triggers are live · maximum attempts before it gives up.** (The window and languages halves are §M07.3's.) Off means off: nothing queues, nothing dials, inbound falls to the tenant's non-AI routing (§M07.9). _(non-UI half, build-side: off means nothing queues or dials; inbound falls to non-AI routing — for awareness, not for drawing)_

### docs/prd/modules/M01-onboarding-and-tenant-config.md

- **M01-57** (P0) — **Tenant configuration lists the agent & voice surfaces; their behaviour is specified in `modules/M07-sales-execution.md`.** The surfaces: **Agent setup — guided** (name · voice · languages · tone · opening line · what to say when it doesn't know · hand-over rules · calling window, within the floor · free-text "anything else") · **Opening line** (pre-filled disclosure, editable per its floor status) · **Hand-over rules** (editable list; the statutory opt-out is floor) · **Calling window** (days, hours, holiday calendar — narrower than the floor only) · **Business knowledge base** (structured, eight sections, seeded per market — never an empty page; the unanswered-questions one-tap loop) · **Test the agent** ("the most important screen here" — call yourself or run a typed conversation) · **Change history** (versioned config, kept quietly) · **Number provisioning** and **inbound call routing (IVR)** (UXG-16/UXG-17 — M07's slices). M01 owns their presence in the settings information architecture and the M01-28/M01-30 laws applying to them; M07 owns every behaviour.

## States

- **Loading** (base) — opening the guided setup with the seeded values.
- **Empty** (base) — no true empty: every guided field already holds a working pre-filled value on a new tenant (M07-08, M07-09; M07 §M07.3 acceptance).
- **Error** (base) — save/publish failure acknowledged honestly; entered edits preserved.
- **pre-filled-defaults** — the fresh state: every guided step pre-filled, the free-text "anything else" box present (M07-08, M07-09).
- **working-defaults** — nothing is required on day one; the seeded defaults work untouched — the agent is configured enough to be safe, never silently off (M07 §M07.3 behavior detail and edge cases).
- **free-text-open** — the "anything else" box in use: simple by default, open when they want more (M07-08).
- **live-effect-preview** — every guided screen shows its live effect — the opening line spoken aloud (`M01-30` consumed; M07 §M07.3 behavior detail).
- **draft-resumable** — setup is resumable; unfinished guided steps come back where the owner left them (M07 §M07.3 behavior detail).
- **floor-blocked-save** / **floor-violation-blocked** — a save that would cross the compliance floor is blocked with the floor named: statutory items are blocked by the gate, not warned about (M07 §M07.3 edge cases); e.g. deleting "asks to stop" refuses the save with the floor named (M07-11; §M07.3 acceptance).
- **entitlement-or-market-absent** — the surface honestly absent or unavailable where entitlement/market rules say so: a market with no voice ruleset in its pack cannot enable outbound voice (M07-27, F1-16; M01-57's "present or honestly absent" law per M01 acceptance).

## Data volume

The full guided config field set: name · voice · languages · tone · opening line · what to say when it doesn't know · when to hand to a human · when it may call (hours, days, holidays) · maximum attempts (M07-09). The hand-over rules list with its five default rules, editable and extensible (M07-11). The languages step edits the tenant's offered subset of the six agent languages (M07-15; M07 §M07.3 behavior detail). Runtime half: one on/off, the live-trigger set, one max-attempts value (M07-34). One free-text box.

## Numbers carrying provenance

- **Maximum attempts before it gives up** — an owner-set configuration count (M07-09, M07-34); config data, not a computed figure, but it must display exactly what the queue enforces.
- **Calling hours/days/holidays** are edited on the Calling Window surface (SCR-M07-06), summarised here only as the guided step names it (M07-09).
- No money figures appear on this screen.
