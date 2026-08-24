# M07 · Sales Execution — engineering tasks

This file covers Module M07 (Sales Execution): My Day and the follow-up task system, the voice agent end to end (guided setup, knowledge base, behaviour defaults, the compliance gate, triggers and the call queue, call execution, escalation and hand-to-human, inbound IVR, telephony numbers, agent performance and usage) and the close surfaces (Mark won, Mark lost, Reopen). Task-id prefix: `T-M07-`. Source doc: `docs/prd/modules/M07-sales-execution.md` (rows M07-01…M07-65). Screen tasks point at their UX briefs under `docs/ux/briefs/`, where the verbatim requirement rows live; engine, policy and integration tasks quote their rows in full below.

### T-M07-001 · My Day

**Type:** screen · **Tier:** P0
**PRD rows:** M07-01 (P0), M07-02 (P0), M07-03 (P0), M07-04 (P0), M07-06 (P0)
**DESIGN:** SCR-M07-01 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-01-my-day.md`; they are the specification.
**DONE WHEN:**
- Given a Sales Executive with overdue, timed, agent-touched and future items, when My Day renders, then the blocks appear in exactly the order OVERDUE · TODAY · AGENT ACTIVITY · UPCOMING THIS WEEK, with overdue styled as the first and most urgent block (M07-01, M07-02).
- Given the agent called two of the rep's leads overnight, when My Day renders, then those two outcomes appear only inside the AGENT ACTIVITY block, each marked as agent activity and deep-linking to the call result — never interleaved with the rep's own tasks (M07-03).
- Given a snoozed lead with a wake date of today, when 09:00 tenant-local passes, then the lead's follow-up task is in TODAY and the lead is no longer hidden (M07-04).
- Given a proposal marked shared on Monday, when Wednesday arrives with no rep action, then the auto-created follow-up task exists, is owned by the sending rep, and names its provenance rule (M07-06); given it is still open two days past due, then it is visible to the agent's task-overdue trigger (M07-07).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-002 · Mark won

**Type:** screen · **Tier:** P0
**PRD rows:** M07-62 (P0)
**DESIGN:** SCR-M07-02 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-02-mark-won.md`; they are the specification.
**DONE WHEN:**
- Given a rep marks a lead won with final value and expected install date, when they confirm, then the project exists immediately with no re-entry of customer data, and the lead shows won (M07-62).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-003 · Mark lost

**Type:** screen · **Tier:** P0
**PRD rows:** M07-63 (P0)
**DESIGN:** SCR-M07-03 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-03-mark-lost.md`; they are the specification.
**DONE WHEN:**
- Given a rep marks a lead lost, when they must pick a reason, then the surface offers the ruled seven-reason set (the source six plus "not interested" — owner ruling 2026-08-04, Q21), refuses a reasonless save, and postponed losses carry a date (M07-63).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-004 · Reopen lead

**Type:** screen · **Tier:** P0
**PRD rows:** M07-64 (P0)
**DESIGN:** SCR-M07-04 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-04-reopen-lead.md`; they are the specification.
**DONE WHEN:**
- Given a postponed loss dated next month, when that date arrives, then the lead resurfaces at 09:00 tenant-local with a follow-up task (M07-64).
- Given a lost lead is reopened, when it re-enters, then it lands at its prior funnel stage and the timeline records the reopen (M07-64).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-005 · Agent setup & settings

**Type:** screen · **Tier:** P0
**PRD rows:** M07-08 (P0), M07-09 (P0), M07-10 (P0), M07-11 (P0), M07-15 (P0), M07-34 (P0)
**DESIGN:** SCR-M07-05 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-05-agent-setup-settings.md`; they are the specification.
**DONE WHEN:**
- Given a new tenant that has never opened agent setup, when the agent is enabled, then every guided field already holds a working pre-filled value and a free-text box exists (M07-08, M07-09).
- Given the owner edits the opening line, when they save, then the wording change takes effect for newly queued calls only after publish (M07-14) — and no edit path weakens the four hard floors (never claims human · never denies AI when asked · instant handoff · full transcription), nor removes the proactive disclosure where the pack flag ships it ON (M07-10, owner ruling 2026-08-04 Q6).
- Given a hand-over rule list with "asks to stop" deleted attempted, when the owner saves, then the save is refused with the floor named — the opt-out rule cannot be removed (M07-11).
- Given a customer whose language is Tamil, when the agent calls, then the call runs in Tamil regardless of any user's interface language (M07-15).
- Given the agent is off, when any trigger condition occurs, then nothing is queued or dialed (M07-34); given attempts reach the configured maximum, then the agent stops and a rep task is created (M07-34, M07-06).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-006 · Calling window

**Type:** screen · **Tier:** P0
**PRD rows:** M07-12 (P0)
**DESIGN:** SCR-M07-06 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-06-calling-window.md`; they are the specification.
**DONE WHEN:**
- Given the pack's statutory window, when the owner edits the calling window, then only equal or narrower schedules and additional holidays can be saved (M07-12).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-007 · Test the agent

**Type:** screen · **Tier:** P0
**PRD rows:** M07-13 (P0)
**DESIGN:** SCR-M07-07 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-07-test-agent.md`; they are the specification.
**DONE WHEN:**
- Given the owner runs a test call, when it plays, then it uses the draft configuration and no customer-facing call is affected (M07-13).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-008 · Agent config history

**Type:** screen · **Tier:** P0
**PRD rows:** M07-14 (P0)
**DESIGN:** SCR-M07-08 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-08-agent-config-history.md`; they are the specification.
**DONE WHEN:**
- Given the owner edits the opening line, when they save, then the wording change takes effect for newly queued calls only after publish (M07-14) — and no edit path weakens the four hard floors (never claims human · never denies AI when asked · instant handoff · full transcription), nor removes the proactive disclosure where the pack flag ships it ON (M07-10, owner ruling 2026-08-04 Q6).
- Given a published config change while ten calls sit queued, when those calls dial, then each uses the version it was queued with and the call record names it (M07-14).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-009 · Knowledge base

**Type:** screen · **Tier:** P0
**PRD rows:** M07-16 (P0), M07-19 (P0), M07-21 (P1)
**DESIGN:** SCR-M07-09 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-09-knowledge-base.md`; they are the specification.
**DONE WHEN:**
- Given a new tenant, when the agent takes its first call, then every KB section already holds seeded content and no answer is a blank (M07-16, M07-17).
- Given a KB edit that gives a second, different warranty answer, when the owner saves, then the contradiction is flagged at save time (M07-19).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-010 · Unanswered questions

**Type:** screen · **Tier:** P0
**PRD rows:** M07-18 (P0), M07-58 (P0)
**DESIGN:** SCR-M07-10 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-10-unanswered-questions.md`; they are the specification.
**DONE WHEN:**
- Given the agent could not answer "does hail damage panels?", when the owner opens the list, then the question shows with its asked-count, and one tap on an answer writes it into the named section, live for the next call (M07-18).
- Given any listed call, when tapped, then transcript and recording (where consented and within retention) open (M07-57); given the unanswered list, then one tap answers into the KB (M07-58).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-011 · Corrections review queue

**Type:** screen · **Tier:** P0
**PRD rows:** M07-26 (P0)
**DESIGN:** SCR-M07-11 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-11-corrections-review-queue.md`; they are the specification.
**DONE WHEN:**
- Given a rep corrects an agent outcome, when the correction saves, then the lead shows the rep's read, a review-queue item exists for the owner, and the KB is unchanged until the owner explicitly promotes an answer (M07-25, M07-26).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-012 · Agent call queue

**Type:** screen · **Tier:** P0
**PRD rows:** M07-28 (P0), M07-30 (P0), M07-35 (P0), M07-36 (P0), M07-37 (P0)
**DESIGN:** SCR-M07-12 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-12-agent-call-queue.md`; they are the specification.
**DONE WHEN:**
- Given any queued call, when its dial moment arrives, then the gate's checks run first and a block persists its verdict on the queue entry and the lead (M07-27, M07-30).
- Given a pre-dial view of any customer, when it renders, then consent, registry status, do-not-call, quiet flag and window verdict are all visible (M07-28).
- Given a lead captured at 11 pm, when it queues, then its scheduled time is not before the window opens (M07-35).
- Given the owner removes any queued call — or the queuing rep cancels an entry they queued — when the queue refreshes, then the entry is gone and the cancellation is on the lead timeline with its actor (M07-35, owner ruling 2026-08-04 Q31).
- Given allowance exhausted between insert and dial, when the dial moment arrives, then the entry blocks, is marked, and the owner is notified (M07-37).
- Given a config version published after a call was queued, when that call dials, then it runs the version it was queued with and the queue view names the difference (M07-36).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-013 · Call record detail

**Type:** screen · **Tier:** P0
**PRD rows:** M07-25 (P0), M07-38 (P0)
**DESIGN:** SCR-M07-13 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-13-call-record-detail.md`; they are the specification.
**DONE WHEN:**
- Given a rep corrects an agent outcome, when the correction saves, then the lead shows the rep's read, a review-queue item exists for the owner, and the KB is unchanged until the owner explicitly promotes an answer (M07-25, M07-26).
- Given any completed, dropped or failed call, when the lead timeline renders, then the call record exists with its typed outcome, summary, language and config version, with transcript on tap (M07-38, M07-39); and given the customer declined recording, then no recording exists but the call proceeded and the transcript survives per the pack's rules (M07-38).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-014 · Escalations

**Type:** screen · **Tier:** P0
**PRD rows:** M07-42 (P0)
**DESIGN:** SCR-M07-14 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-14-escalations.md`; they are the specification.
**DONE WHEN:**
- Given a customer asks for a discount mid-call, when the hand-over rule fires, then the rep is notified immediately with a deep link, and the escalations surface lists the call with its reason (M07-42, M07-43).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-015 · Routing rules editor

**Type:** screen · **Tier:** P0
**PRD rows:** M07-44 (P0)
**DESIGN:** SCR-M07-15 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-15-routing-rules-editor.md`; they are the specification.
**DONE WHEN:**
- Given an escalation chain where no level answers, when the timeouts elapse, then the terminal fallback (callback queue or voicemail) takes the call — a dead end is impossible by construction (M07-44).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-016 · IVR flow editor

**Type:** screen · **Tier:** P0
**PRD rows:** M07-47 (P0)
**DESIGN:** SCR-M07-16 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-16-ivr-flow-editor.md`; they are the specification.
**DONE WHEN:**
- Given a tenant edits their IVR flow, when they publish, then the whole flow versions and in-flight calls finish on the version they started (M07-47).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-017 · Number provisioning wizard

**Type:** screen · **Tier:** P0
**PRD rows:** M07-51 (P0), M07-52 (P0), M07-53 (P0)
**DESIGN:** SCR-M07-17 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-17-number-provisioning-wizard.md`; they are the specification.
**DONE WHEN:**
- Given a new tenant, when they open voice settings, then a platform number is available instantly as the default choice (M07-51).
- Given a tenant completes BYO setup, when a customer calls their old number, then it forwards in; and when the agent calls out, then the platform number is the caller identity — with the wizard having said exactly that in advance (M07-52, M07-53).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-018 · Agent performance

**Type:** screen · **Tier:** P0
**PRD rows:** M07-55 (P0), M07-56 (P0), M07-60 (P1), M07-61 (P0)
**DESIGN:** SCR-M07-18 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-18-agent-performance.md`; they are the specification.
**DONE WHEN:**
- Given a month of agent activity, when the performance screen renders, then attempted, connected, callbacks, site visits, hand-offs and unanswered counts show this month vs last (M07-55).
- Given the "deals it touched" block renders, then the `F8-30` caption is visible beside the figure without any interaction, in the viewer's language (M07-56).
- Given a sharp connect-rate drop, when the screen renders, then the warning with likely cause is present; given a month of no visits to the screen, then the owner received the in-app summary (M07-61).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-019 · Call log

**Type:** screen · **Tier:** P0
**PRD rows:** M07-57 (P0)
**DESIGN:** SCR-M07-19 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-19-call-log.md`; they are the specification.
**DONE WHEN:**
- Given any listed call, when tapped, then transcript and recording (where consented and within retention) open (M07-57); given the unanswered list, then one tap answers into the KB (M07-58).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-020 · Agent usage

**Type:** screen · **Tier:** P0
**PRD rows:** M07-59 (P0)
**DESIGN:** SCR-M07-20 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M07-20-agent-usage.md`; they are the specification.
**DONE WHEN:**
- Given the usage view and the invoice for the same period, then the minutes shown are the same numbers (M07-59).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M07-021 · Follow-up task system (model, provenance, trigger feed)

**Type:** engine · **Tier:** P0
**PRD rows:** M07-05, M07-07
**Requirements (verbatim):**
- **M07-05** (P0) — **A task carries an assignee, a kind — follow-up · site visit · call · custom — a due date and a status. Overdue is derived from the due date, never a stored state.**
- **M07-07** (P0) — **A task overdue two days is an agent trigger.** The task system is what the safety net reads: the task-overdue-2d trigger (§M07.7, M07-33) reads task due dates and statuses — no separate bookkeeping exists to drift from what the rep sees.
**DONE WHEN:**
- Given a task due yesterday, when any surface renders it, then it is overdue by derivation — and if its due date is edited to tomorrow, it is nowhere overdue, with no stored flag to clear (M07-05).
- Given a proposal marked shared on Monday, when Wednesday arrives with no rep action, then the auto-created follow-up task exists, is owned by the sending rep, and names its provenance rule (M07-06); given it is still open two days past due, then it is visible to the agent's task-overdue trigger (M07-07).

### T-M07-022 · Agent conversation runtime (defaults, holds-back, opener floors, lead scoping, spoken figures)

**Type:** engine · **Tier:** P0
**PRD rows:** M07-20, M07-22, M07-23, M07-24, M07-41
**Requirements (verbatim):**
- **M07-20** (P0) — **The agent's context is scoped to the single lead matched by the verified caller number; the knowledge base is per-tenant and read-only to the agent; the agent writes nothing beyond the call-outcome record.** No cross-customer retrieval exists.
- **M07-22** (P0) — **What the agent does by default — all editable by the owner (D36):** asks whether the proposal was received and reviewed · answers FAQs (timeline, subsidy, warranty, process, financing) · books a callback or a site visit · records interest level and objections · hands off to a human at any point.
- **M07-23** (P0) — **What it holds back by default:** discussing or offering a discount *(owner can enable)* · negotiating price *(owner can enable)* · accepting or confirming a deal · making technical or structural commitments · continuing after the customer asks to stop. Two of these are not defaults but law: **a deal is only ever accepted by the customer tapping Accept on the link — never by verbal agreement** (C8, `foundations/F5`); **continuing after "stop" violates the statutory opt-out** and is blocked by the gate (F1-36(c)).
- **M07-24** (P0) — **Every call opens naturally — no proactive AI mention at IN launch — and "talk to a person" works at any moment (owner ruling 2026-08-04, Q6, replacing the former ≤30 s disclosure default).** The tiered law of F1-36(d) governs: the four hard floors always hold — the agent **never claims to be human**, **never denies being AI when asked** (honest answer plus an immediate human offer), hands to a human instantly on request, and every call is fully transcribed to the timeline; proactive disclosure is pack data (IN OFF until the TRAI identification rule binds, then auto-ON with owner notification; EU-class packs ON). Each call records what its opener played and how any are-you-an-AI question was answered (§M07.7).
- **M07-41** (P0) — **Figures the agent speaks are renderings of the product's computed values** — same value, same provenance tier, same disclosure as the screen and the document. The agent never recomputes, never rounds differently, and never drops a qualifier.
**DONE WHEN:**
- Given any call, when the agent retrieves context, then it reads only the matched lead and the tenant KB, and writes only the call-outcome record (M07-20).
- Given default configuration, when a customer asks for a discount, then the agent offers a human instead of discussing it — and given the owner enabled discount discussion, then the agent may discuss it but still cannot accept or confirm a deal (M07-22, M07-23).
- Given any outbound agent call, when it connects, then it opens with the configured natural opener, "talk to a person" works at any moment of the call, and if the customer asks whether they are speaking to an AI the agent answers honestly and immediately offers a human (M07-24, owner ruling 2026-08-04 Q6).
- Given the agent quotes a system's savings figure, when compared with the proposal document, then value, tier and qualifier match exactly (M07-41).

### T-M07-023 · Seeded knowledge-base default pack

**Type:** engine · **Tier:** P0
**PRD rows:** M07-17
**Requirements (verbatim):**
- **M07-17** (P0) — **Seeded, not empty.** Every new tenant starts with a solar-industry default pack — generic but correct answers for the market's staple questions (the IN seed's subsidy/net-metering content is pack material, F1). *"Day one it works; week four it sounds like them."*
**DONE WHEN:**
- Given a new tenant, when the agent takes its first call, then every KB section already holds seeded content and no answer is a blank (M07-16, M07-17).

### T-M07-024 · Compliance gate (mechanism, fail-closed, opt-out, tiered disclosure enforcement)

**Type:** engine · **Tier:** P0
**PRD rows:** M07-27, M07-29, M07-31, M07-32
**Requirements (verbatim):**
- **M07-27** (P0) — **The compliance gate is product code — one concrete implementation, non-swappable, no alternate adapter, ever, and no override flag.** It runs before **every** dial, on every leg, inbound and outbound. Its statutory **ruleset is data from the market pack** (`pack.calling-rules`, F1-15…F1-17; the IN instance is F1-36): the mechanism never varies per market; the ruleset always does. **A market with no voice ruleset in its pack cannot enable outbound voice** (F1-16 consumed). *"Tenants configure within the law, not around it."*
- **M07-29** (P0) — **Fail-closed:** when the registry-scrub data is stale beyond the pack's freshness duty, promotional dialing **pauses** — and the pause is alarmed to the owner — while transactional calls continue. Compliance outranks revenue-generating dialing.
- **M07-31** (P0) — **"Stop calling" sets do-not-call instantly — honored within the pack's deadline, irreversible without the customer's own say-so. A customer complaint sets a permanent quiet flag.** The calling window honors the pack's holiday calendar, so festival-day calls are blocked, not apologised for.
- **M07-32** (P0) — **The gate enforces the tiered disclosure law (owner ruling 2026-08-04, Q6 — the former ≤30 s disclosure floor is retired):** on every automated call the four hard floors hold — never claims human · never denies being AI when asked (honest answer + immediate human offer) · instant handoff · full transcription — and the call record stores the opener version played and any AI-question answer given (§M07.7). Proactive disclosure enforcement follows the pack flag (F1-36(d)): where a pack ships it ON (EU-class; IN after the TRAI auto-flip), the gate enforces the proactive line as floor; where OFF (IN launch), only the hard floors are enforced. The recording of what played never relaxes.
**DONE WHEN:**
- Given any queued call, when its dial moment arrives, then the gate's checks run first and a block persists its verdict on the queue entry and the lead (M07-27, M07-30).
- Given a customer with do-not-call set, when any trigger fires for them, then no agent dial occurs, in any market, under any tenant configuration, with no override path (M07-27, M07-31).
- Given scrub data older than the pack's freshness duty, when promotional dialing is due, then it is paused and the owner alarmed while transactional calls continue (M07-29).
- Given any connected agent call, when it completes, then the record shows the opener version played and — where the customer asked — that the AI question was answered honestly with a human offered; where the pack's proactive-disclosure flag is ON, the record shows the proactive line played (M07-32, owner ruling 2026-08-04 Q6).

### T-M07-025 · Agent triggers (safety net, on-demand, requested-callback lane)

**Type:** engine · **Tier:** P0
**PRD rows:** M07-33
**Requirements (verbatim):**
- **M07-33** (P0) — **The agent triggers two ways: automatically as a safety net — proposal unopened 3 days (`M06-55` consumed) · rep task overdue 2 days (M07-07) · three failed manual call attempts (`M02-43` consumed) — and on demand, when a rep hands a lead to it.** A customer-requested callback also queues (callback-requested) — and under the **requested-callback lane** (owner ruling 2026-08-04, Q30; F1-36(b) lane 3) it may be scheduled **outside the statutory window only on an explicitly recorded, timestamped customer request for that time** (transcript, message or rep note): the call opens by referencing the request, the consent trail is stored as evidence, and a single "stop" ends the lane for that customer; the lane is product law, per-tenant enable/disable only. The owner chooses which automatic triggers are live (M07-34).
**DONE WHEN:**
- Given a proposal three days unopened, a task two days overdue, or a third failed manual attempt, when the safety net runs, then a queue entry exists naming that reason — and given a rep hands a lead over, then it queues on demand (M07-33).

### T-M07-026 · Call execution honesty (record always written, stall ladder, wrong number)

**Type:** engine · **Tier:** P0
**PRD rows:** M07-39, M07-40
**Requirements (verbatim):**
- **M07-39** (P0) — **Call failure is honest: the call record is always written.** A mid-call media drop attempts one apology line, else hangs up with outcome recorded as dropped; a provider outage pauses outbound and lets inbound fall to voicemail; speech/understanding stalls follow a defined ladder ending in hand-to-human or voicemail per tenant config — never dead air, never a silent no-op.
- **M07-40** (P0) — **A wrong or reassigned number is flagged and the number marked unverified** — no further automated attempts until a person confirms it.
**DONE WHEN:**
- Given the agent reaches a wrong or reassigned number, when the call ends, then the record's outcome is wrong-number, the number is marked unverified, and no further automated attempt occurs until a person confirms it (M07-40).
- Given any completed, dropped or failed call, when the lead timeline renders, then the call record exists with its typed outcome, summary, language and config version, with transcript on tap (M07-38, M07-39); and given the customer declined recording, then no recording exists but the call proceeded and the transcript survives per the pack's rules (M07-38).

### T-M07-027 · Escalation notification, handoff context and presence

**Type:** engine · **Tier:** P0
**PRD rows:** M07-43, M07-45, M07-46
**Requirements (verbatim):**
- **M07-43** (P0) — **A price question is an immediate escalation: the rep gets a notification, not a task buried in a list.** The notification deep-links to the live context. Notification delivery contracts are `foundations/F6`'s (`agent_escalation` type registered there).
- **M07-45** (P0) — **Every handoff writes a pinned context record** — summary, intent, sentiment, collected fields, transcript pointer — generated once at handoff time, with the target and outcome. A warm transfer delivers a spoken whisper summary before bridging **where the rail declares that capability**; otherwise it degrades to cold transfer plus a push with the summary and a deep link — declared path, never a silent no-op (F8-35 consumed).
- **M07-46** (P0) — **Per-user routing availability is a manual toggle in v1**: available · busy · off, with an optional until-time. Ring groups and chains read it.
(M07-46's toggle surface ships in the app shell — verbatim row also carried by `docs/ux/briefs/SCR-SHELL-01-app-shell.md`; this task builds the presence state that ring groups and chains read.)
**DONE WHEN:**
- Given a customer asks for a discount mid-call, when the hand-over rule fires, then the rep is notified immediately with a deep link, and the escalations surface lists the call with its reason (M07-42, M07-43).
- Given any handoff, when the human picks up, then the pinned context (summary, intent, collected fields) is with them — as a whisper where the rail declares it, else as push + deep link, and the record shows which (M07-45).
- Given a user sets themself off until 3 pm, when routing runs, then they are skipped until then (M07-46).

### T-M07-028 · Inbound answer, capture and degradation ladders

**Type:** engine · **Tier:** P0
**PRD rows:** M07-48, M07-50
**Requirements (verbatim):**
- **M07-48** (P0) — **The agent answers inbound when nobody picks and captures the enquiry — name, city, bill amount, interest — into the CRM capture flow, meeting the same dedupe sheet as every channel** (`modules/M02`'s surface, UXG-02 reuse — cited). An after-hours capture queues its callback window-shifted (M07-35); the customer is served at capture time, called back lawfully.
- **M07-50** (P0) — **Inbound degradation ladders are defined, never improvised:** AI-inbound over allowance falls back to the human ring group or voicemail per the tenant's own IVR config; a **halted** tenant's inbound degrades to a missed-call log plus voicemail — no AI minutes burned, no caller stranded. (Billing states and the gate mechanics are `modules/M12`'s.)
**DONE WHEN:**
- Given an unknown caller the agent serves at 11 pm, when capture completes, then the lead exists via the standard dedupe path and any callback is queued no earlier than the window opening (M07-48).
- Given AI-inbound over allowance, when a call arrives, then it routes per the tenant's IVR fallback and is logged (M07-50).

### T-M07-029 · Telephony capability framework and DTMF traversal

**Type:** integration · **Tier:** P0
**PRD rows:** M07-49, M07-54
**Requirements (verbatim):**
- **M07-49** (P0) — **Automated menu traversal on outbound calls is a declared, negotiated capability — and it degrades honestly.** Where the rail declares DTMF-send, the call record gains a *"navigated an IVR (N steps)"* line and transcript markers. Where it does not — **the v1 reference rail does not provide it** — the step is skipped and the call is flagged for human follow-up; the record states what did not happen rather than looking like a failed call. *"Stuck in IVR — escalated"* is a required failure state either way.
- **M07-54** (P0) — **Telephony is a provider-agnostic capability framework: every adapter declares what it truly supports, and product behaviour branches on the declaration — never on the vendor name.** A feature needing a missing capability degrades on its defined path (M07-45, M07-49). Vendor names appear in this suite only as v1 reference implementations (Exotel + Sarvam are the IN reference rails behind the capability ports — F1-43; Bolna is the documented alternate behind the same ports).
**DONE WHEN:**
- Given an outbound call that encounters an automated menu, when the rail lacks the traversal capability, then the record shows the step was skipped and the call is flagged for human follow-up — and where the rail declares it, the record shows "navigated an IVR (N steps)" with markers (M07-49).
- Given any telephony feature, when its adapter lacks the declared capability, then the defined degradation path runs and the record says so — no behaviour anywhere branches on a vendor's name (M07-54).

## Laws (enforced through screens and review, no standalone build)

- **M07-65** (P0) — **The close surfaces feed the honest lists, and only those:** lost-with-reason into the win/loss "lost late" list, disqualified-early into its list (`modules/M13`'s surfaces); a won deal's revenue counting and any later cancellation are `modules/M08`/`modules/M13`'s (R2's `CANCELLED` stops counting immediately — cited). Nothing here double-counts, forecasts, or re-claims agent credit (F8-30 consumed). — *Enforced by:* the close tasks T-M07-002, T-M07-003 and T-M07-004 emitting each close event exactly once with its reason, and review of the consuming win/loss surfaces (`docs/prd/modules/M13-dashboards-and-reporting.md`'s rows); its acceptance line: Given a deal is lost or won, when the win/loss lists render, then it appears in exactly its ruled list, and no forecast or agent-credit figure is restated here (M07-65).

## Disposition index

| Row | Disposition |
|---|---|
| M07-01 | T-M07-001 |
| M07-02 | T-M07-001 |
| M07-03 | T-M07-001 |
| M07-04 | T-M07-001 |
| M07-05 | T-M07-021 |
| M07-06 | T-M07-001 |
| M07-07 | T-M07-021 |
| M07-08 | T-M07-005 |
| M07-09 | T-M07-005 |
| M07-10 | T-M07-005 |
| M07-11 | T-M07-005 |
| M07-12 | T-M07-006 |
| M07-13 | T-M07-007 |
| M07-14 | T-M07-008 |
| M07-15 | T-M07-005 |
| M07-16 | T-M07-009 |
| M07-17 | T-M07-023 |
| M07-18 | T-M07-010 |
| M07-19 | T-M07-009 |
| M07-20 | T-M07-022 |
| M07-21 | T-M07-009 |
| M07-22 | T-M07-022 |
| M07-23 | T-M07-022 |
| M07-24 | T-M07-022 |
| M07-25 | T-M07-013 |
| M07-26 | T-M07-011 |
| M07-27 | T-M07-024 |
| M07-28 | T-M07-012 |
| M07-29 | T-M07-024 |
| M07-30 | T-M07-012 |
| M07-31 | T-M07-024 |
| M07-32 | T-M07-024 |
| M07-33 | T-M07-025 |
| M07-34 | T-M07-005 |
| M07-35 | T-M07-012 |
| M07-36 | T-M07-012 |
| M07-37 | T-M07-012 |
| M07-38 | T-M07-013 |
| M07-39 | T-M07-026 |
| M07-40 | T-M07-026 |
| M07-41 | T-M07-022 |
| M07-42 | T-M07-014 |
| M07-43 | T-M07-027 |
| M07-44 | T-M07-015 |
| M07-45 | T-M07-027 |
| M07-46 | T-M07-027 |
| M07-47 | T-M07-016 |
| M07-48 | T-M07-028 |
| M07-49 | T-M07-029 |
| M07-50 | T-M07-028 |
| M07-51 | T-M07-017 |
| M07-52 | T-M07-017 |
| M07-53 | T-M07-017 |
| M07-54 | T-M07-029 |
| M07-55 | T-M07-018 |
| M07-56 | T-M07-018 |
| M07-57 | T-M07-019 |
| M07-58 | T-M07-010 |
| M07-59 | T-M07-020 |
| M07-60 | T-M07-018 |
| M07-61 | T-M07-018 |
| M07-62 | T-M07-002 |
| M07-63 | T-M07-003 |
| M07-64 | T-M07-004 |
| M07-65 | LAW |
