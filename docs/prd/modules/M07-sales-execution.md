# M07 · Sales Execution — My Day, Follow-ups, Voice Agent, Close
Status: draft · Origin mix: SRC (dominant) / BRIEF (surface commitments only) · Depends on:
`00-README.md` (conventions) · `01-product-overview.md` (OV-34 reference-implementation rule,
OV-37) · `02-personas.md` (PS-11) · `foundations/F1-global-market-framework.md`
(`pack.calling-rules` — F1-15…F1-17; IN instance F1-36…F1-39; rails F1-43; consent records
F1-58) · `foundations/F2-roles-and-permissions.md` (§F2.5-M07, `F2.M01.configure-agent`) ·
`foundations/F3-localization.md` (F3-29) ·
`foundations/F5-customer-link.md` (acceptance surface — Task 20) ·
`foundations/F6-notifications-and-search.md` (notification types — Task 23) ·
`foundations/F8-data-honesty.md` (F8-06, F8-24, F8-30, F8-31, F8-35) ·
`modules/M01-onboarding-and-tenant-config.md` (M01-56/M01-57 surface list) ·
`modules/M02-crm-and-leads.md` (R9 machine §M02.10, M02-37 compliance fields) ·
`modules/M06-proposals.md` (M06-55 triggers) · `modules/M08-projects.md` (project at Won —
Task 18) · `modules/M12-platform-billing.md` (entitlements/metering — Task 23) ·
`modules/M13-dashboards-and-reporting.md` (role homes, win/loss and shared agent-performance
surfaces) · `04-business-model.md` (BM-16, BM-18)

## 1. Purpose & scope

This module is where selling actually happens after a proposal exists: the Sales Executive's
working day (My Day and the follow-up task system), the **voice agent** — the product's
capability no competitor at any price has (`CG-moat.1`, dispositioned by Task 3; restated at
`OV-37`) — and the close (Mark won, Mark lost, Reopen). Stage 7's goal is this module's goal,
verbatim: *"nothing goes quiet by accident"* (`S7` preamble).

It owns, at product level:

- **My Day as a working surface** — what fills its blocks and in what order; the role-home
  routing and multi-role home composition stay with `modules/M13-dashboards-and-reporting.md`
  (Q5).
- **The follow-up task system** (`DOC04.tasks`) that every other module's automation feeds.
- **The voice agent end to end**: guided setup behaviour and the knowledge base with its
  unanswered-questions loop (the tenant-config *surface list* is `M01-57`'s; every behaviour is
  here), agent defaults and what the owner may change (D36 as amended), the **compliance-gate
  mechanism** (product code, non-swappable — the statutory *ruleset* it consumes is market-pack
  data, F1-15…F1-17), triggers, the call queue, call execution and the call record, escalation
  and hand-to-human, inbound IVR and its degradations, telephony number provisioning, agent
  performance and usage, and the correction-training loop (R10).
- **The close surfaces**: Mark won (which creates the project — `modules/M08-projects.md`'s
  object), Mark lost with its mandatory reason, Reopen.

It explicitly does **not** own: the lead state machine and its timers (R9 is the single
definition, `modules/M02` §M02.10 — this module's surfaces defer to it); the statutory
calling-rules *content* (market-pack data, `foundations/F1`); the customer-facing acceptance
surface and its OTP challenge (`foundations/F5`); dashboards and the owner's periodic decision
tools (`modules/M13`); billing entitlements and the usage ledger mechanics (`modules/M12`);
message-template content management (`modules/M01`, `foundations/F6`); and the product's
number-honesty, which is platform behaviour and **never** a tenant configuration surface —
the agent's speech is the tenant's; the numbers it speaks are not (`F8-06`, `TC.principle.4`
via `M01-56`).

## 2. Personas & surfaces

Personas (per `02-personas.md`):

- **Sales Executive** — the primary persona. My Day is their home screen (PS-11); follow-ups,
  agent activity on their own leads, call results on their timelines, and the close surfaces.
  **Mobile-first.**
- **EPC Owner** — configures the agent and its knowledge (`F2.M01.configure-agent`,
  Owner-only), controls the call queue, reads agent performance and usage, answers the
  unanswered-questions list, promotes corrections (R10). **Web emphasis** for setup and
  performance; mobile for the daily glance.
- **Sales Manager** — team-scoped agent performance including the per-rep view
  (`F2.M07.agent-performance`), team queue visibility, close surfaces on team leads.
- **The EPC's customer** — not a user of this module's screens; they experience the agent as
  calls in their own language. Their surface is the phone call and, for decisions, the
  customer link (`foundations/F5`) — a deal is never accepted by voice (§M07.5).

Surfaces ship on **iOS and Android from day one** alongside web (OD-3's surface commitment —
`BRIEF`); no phased platform rollout.

## 3. Feature areas

### M07.1 — My Day: the rep's home

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-01 | **My Day is the Sales Executive's home screen and it is a list of what to do today — not a dashboard of numbers.** It opens on work, ordered by urgency, and answers "who do I call next" without a chart (D37's "tasks, not KPIs" boundary — cited, `modules/M13`). Role-decided home routing is `PS-11`/`modules/M13`'s; this module supplies the surface's content. | `SRC` — `S7.rule.my-day` (journey @767); `PS-11` (Task 4 — reciprocated here); `D37` (cited — M13) | P0 |
| M07-02 | **The block order is fixed: OVERDUE — red, first, always · TODAY · AGENT ACTIVITY · UPCOMING THIS WEEK.** Overdue items lead with what makes them urgent — e.g. a follow-up three days late; a proposal unopened five days, showing the system size and value (value formatting per the tenant's market pack, F1-46). Today holds timed items (site visits, call-backs). Upcoming closes the screen. | `SRC` — `S7.rule.my-day` (block order verbatim); `PS-11` | P0 |
| M07-03 | **Agent activity is a separate block, never mixed with the rep's own tasks.** The rep sees at a glance what a machine did on their behalf overnight — interested / wants callback · no answer / will retry · asked about warranty / answered / still deciding — each entry marked as the agent's, deep-linking to the call result on the lead timeline. *"Blurring that line is how people stop trusting the automation."* | `SRC` — `S7.rec.1` (verbatim; shared — the My Day layout half also binds `modules/M13`); `S7.rule.my-day` (AGENT ACTIVITY block) | P0 |
| M07-04 | **My Day shows only what the lead state machine says it should.** Snoozed leads are hidden until their wake date; dormant leads are excluded; a wake at 09:00 tenant-local returns the lead **with a follow-up task** that lands in today's list. The machine itself is `modules/M02` §M02.10's (`M02-51`, `M02-52`, `M02-58` consumed); My Day renders its output and invents no timer. | `SRC` — `R9` (cited — M02 owns the machine); `M02-58` ("excluded … genuinely absent, never greyed") | P0 |

**Behavior detail.** My Day is assembled from this module's tasks (§M07.2), the agent's queue
and results (§M07.7), booked visits (`modules/M04`) and the lead machine's wakes (`modules/M02`).
Empty states teach: a rep with nothing overdue sees "Nothing overdue — you're ahead," never a
blank. The agent-activity block renders even when empty if the agent is on for any of the rep's
leads ("The agent made no calls last night"), so silence is visibly silence and not a broken
screen. Every row deep-links to its lead; one tap starts the action (call, open proposal,
open visit).

Permissions: no grant of its own — My Day is scoped by `F2.M02.lead-visibility` (Own for the
Sales Executive). The agent-activity block shows only calls on leads the viewer can see.

**Edge cases & what-goes-wrong.**
- *Customer goes silent for 30 days* (`S7.wrong.8`) → the lead auto-moves to dormant — flagged
  by the nightly sweep, never deleted — and leaves My Day; any activity returns it to its
  stage (`M02-52` consumed; R9 is the single definition).
- *A lead wakes while its owner is on leave* → the wake task lands on the current owner;
  bulk-reassignment is `modules/M02`'s (`S3.wrong.6` — cited, disposed there).

**Acceptance criteria.**
- Given a Sales Executive with overdue, timed, agent-touched and future items, when My Day
  renders, then the blocks appear in exactly the order OVERDUE · TODAY · AGENT ACTIVITY ·
  UPCOMING THIS WEEK, with overdue styled as the first and most urgent block (M07-01, M07-02).
- Given the agent called two of the rep's leads overnight, when My Day renders, then those two
  outcomes appear only inside the AGENT ACTIVITY block, each marked as agent activity and
  deep-linking to the call result — never interleaved with the rep's own tasks (M07-03).
- Given a snoozed lead with a wake date of today, when 09:00 tenant-local passes, then the
  lead's follow-up task is in TODAY and the lead is no longer hidden (M07-04).

**Localization notes.** Block titles and all My Day copy in EN/HI/MR (F3); dates and value
formatting per the market pack (F1-46/F1-48). **Analytics events.** `my_day_opened`,
`my_day_item_actioned` (block, item kind), `agent_activity_item_opened`.

### M07.2 — Follow-up tasks

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-05 | **A task carries an assignee, a kind — follow-up · site visit · call · custom — a due date and a status. Overdue is derived from the due date, never a stored state.** | `SRC` — `DOC04.tasks` (docs/04) | P0 |
| M07-06 | **Every automatically created task records the rule that created it** (e.g. the on-share follow-up two days after a proposal is marked shared — `M06-55` consumed; the wake-task on snooze expiry — `M02-51` consumed), so a rep always sees *why* a task exists. Auto-created tasks are owned — they land on a named person, never on a pool. | `SRC` — `DOC04.tasks` ("auto-created tasks record their provenance rule"); `S6.rec.1` (cited — disposed by Task 16: "the next action must already exist and be owned") | P0 |
| M07-07 | **A task overdue two days is an agent trigger.** The task system is what the safety net reads: the task-overdue-2d trigger (§M07.7, M07-33) reads task due dates and statuses — no separate bookkeeping exists to drift from what the rep sees. | `SRC` — `DOC04.tasks` ("The task-overdue-2d agent trigger reads this"); `D17` | P0 |

**Behavior detail.** Tasks surface in My Day by due date. Completing a call-kind task from the
lead offers the log-activity flow (`modules/M02`'s surface). Overdue-derivation means fixing a
wrong due date instantly fixes overdue status everywhere, including the agent trigger's read.

Permissions: tasks ride lead visibility; anyone who can see the lead can see its tasks; the
assignee and the presets holding `F2.M02.add-edit-leads` on that lead can tick or edit them.

**Edge cases & what-goes-wrong.**
- *Rep marks a task done without doing the work* → the timeline shows the tick and its actor;
  the safety net still catches the lead via the proposal-unopened trigger if the customer never
  opens (M07-33) — the two triggers are deliberately independent.
- *A task's lead is snoozed* → its tasks hide with the lead and return with the wake task
  (`M02-51` consumed).

**Acceptance criteria.**
- Given a task due yesterday, when any surface renders it, then it is overdue by derivation —
  and if its due date is edited to tomorrow, it is nowhere overdue, with no stored flag to
  clear (M07-05).
- Given a proposal marked shared on Monday, when Wednesday arrives with no rep action, then the
  auto-created follow-up task exists, is owned by the sending rep, and names its provenance
  rule (M07-06); given it is still open two days past due, then it is visible to the agent's
  task-overdue trigger (M07-07).

**Localization notes.** Task kinds and provenance-rule labels translated (F3). **Analytics
events.** `task_created` (kind, provenance rule), `task_completed`, `task_overdue_surfaced`.

### M07.3 — Agent setup (guided) and languages

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-08 | **A solar business owner never writes a prompt: setup is guided questions with everything pre-filled, plus a free-text "anything else" box so they are never limited.** Simple by default, open when they want more. The settings surface list and its placement in tenant configuration are `M01-57`'s; the behaviour of every screen is this module's. | `SRC` — `TC.agent-setup.1`, `TC.agent-setup.2` (M07 halves — Task 12 holds the surface list); `D24` (guided-config half live; its "locked by platform" half superseded by D36 — recorded in traceability) | P0 |
| M07-09 | **The guided steps cover, pre-filled: name · voice · languages · tone · opening line · what to say when it doesn't know · when to hand to a human · when it may call (hours, days, holidays) · maximum attempts before it gives up.** Everything is editable **within the compliance floor** (§M07.6): above-floor items are the owner's; floor items only narrow. | `SRC` — `TC.agent-setup.2` (post-overlay); `S7.screen.1` (settings: on/off, live triggers, window, language, max attempts); `DOC04.agent-config-versions` (the config field set) | P0 |
| M07-10 | **The opening line ships pre-filled with a natural opener — "I'm Asha from [company]" — with no proactive AI mention at IN launch (owner ruling 2026-08-04, Q6)**, and the owner can keep or change the wording. Four **hard floors are product law no edit can remove**: the agent never claims to be human; never denies being AI when asked (honest answer plus an immediate human offer); instant human handoff on request; full transcription to the timeline. Whether the opener must *proactively* disclose AI is **pack data** (F1-36(d)): the IN pack ships proactive disclosure OFF and auto-flips it ON with owner notification when TRAI's AI-caller identification rule binds; EU-class packs ship ON. The pre-filled example is market-pack seed content. | `SRC` — `TC.agent-setup.3` (M07 half); `S7.rule.disclosure` and `D36.callrules.disclosure` as superseded by the tiered law — owner ruling 2026-08-04 (Q6); `F1-36`(d) consumed | P0 |
| M07-11 | **Hand-over rules are a list the owner edits, adds to or removes** — price questions · angry customer · asks for the owner · a question it can't answer · asks to stop — each with what the agent says as it hands over. Sensible defaults, none forced — **except "asks to stop", which is the statutory opt-out and cannot be removed** (floor, F1-36(c)). | `SRC` — `TC.agent-setup.4` (M07 half); `D36.callrules.escape` (hand-over-shaping half — the statutory-opt-out half is `F1-36`(c)) | P0 |
| M07-12 | **The calling-window screen edits days, hours and the holiday calendar strictly within the pack's statutory window** — narrower windows and extra holidays only, never wider (F1-17). The pack supplies the floor and the market holiday calendar (F1-36(b), F1-48); the tenant's timezone governs (F1-10). | `SRC` — `TC.agent-setup.5` (post-overlay half); `S7.screen.1` (calling window); `D36` as amended (mechanism half here; ruleset F1) | P0 |
| M07-13 | **Test the agent — "the most important screen here."** The owner calls themself, or runs a typed conversation, and hears exactly what a customer hears before anyone else does. The test renders the *current draft* config so a change is heard before it is published. | `SRC` — `TC.agent-setup.6` (M07 half) | P0 |
| M07-14 | **Agent configuration is versioned-append: publishing a change creates a new version; nothing is edited in place. Calls already queued keep the version they were queued with, and the owner is told so when publishing mid-campaign.** A change-history screen reads the versions — kept quietly in the background; each call records which settings answered it, so a dispute is answerable. | `SRC` — `DOC04.agent-config-versions` ("queued calls keep the version they were queued with"); `TC.agent-setup.7`, `TC.wrong.3` (M07 halves); `D18` overlay addition (config version per call) | P0 |
| M07-15 | **The agent speaks six languages at launch — Hindi, Marathi, Gujarati, Tamil, Telugu and English — chosen per customer (set on the record, or auto-detected on the call), tenant-configurable, and independent of the three interface languages.** The sets never converge by accident (`F3-29` reciprocated: F3 states the boundary; this module owns the set). | `SRC` — `D12` (surviving agent-language half, routed here by Task 8); `R3` consequence ("agent languages (6) remain independent of UI languages (3)"); `S7.screen.1` ("Language per customer or auto-detect"); `D25` (cited — its "defaulting to the same three" phrasing is overridden by the overlay's "agent set (6) unchanged", recorded by Task 2) | P0 |

**Behavior detail.** Setup is resumable and nothing is required on day one — the seeded
defaults work untouched (`M01-28`/`TC.config-ux.1` consumed via M01). The languages step
edits the tenant's *offered* subset of the six; per-customer language lives on the customer
record (`modules/M02`) and is what a queued call uses. Every guided screen shows its live
effect (the opening line spoken aloud — `M01-30` consumed).

Permissions: `F2.M01.configure-agent` — EPC Owner only. Test-the-agent rides the same grant.

**Edge cases & what-goes-wrong.**
- *Owner sets the agent to do something legally risky* (`TC.wrong.1` M07 half) → statutory
  items are **blocked by the gate**, not warned about (§M07.6); above-floor risky choices
  (e.g. editing the opening-line wording) remain the owner's, within the hard floors of
  M07-10.
- *Config changed mid-campaign* (`TC.wrong.3`) → versioned; queued calls keep their queued
  version; the owner is told (M07-14).
- *Tone set to "Direct" but the knowledge is verbose* (`TC.wrong.7` M07 half) → the preview
  and test call surface the mismatch before it goes live (M07-13, M07-21).
- *Owner never opens setup* → the agent still works on the seeded pack (M07-17) — configured
  enough to be safe, never silently off.

**Acceptance criteria.**
- Given a new tenant that has never opened agent setup, when the agent is enabled, then every
  guided field already holds a working pre-filled value and a free-text box exists (M07-08,
  M07-09).
- Given the owner edits the opening line, when they save, then the wording change takes effect
  for newly queued calls only after publish (M07-14) — and no edit path weakens the four hard
  floors (never claims human · never denies AI when asked · instant handoff · full
  transcription), nor removes the proactive disclosure where the pack flag ships it ON
  (M07-10, owner ruling 2026-08-04 Q6).
- Given the pack's statutory window, when the owner edits the calling window, then only equal
  or narrower schedules and additional holidays can be saved (M07-12).
- Given a hand-over rule list with "asks to stop" deleted attempted, when the owner saves,
  then the save is refused with the floor named — the opt-out rule cannot be removed (M07-11).
- Given a published config change while ten calls sit queued, when those calls dial, then each
  uses the version it was queued with and the call record names it (M07-14).
- Given a customer whose language is Tamil, when the agent calls, then the call runs in Tamil
  regardless of any user's interface language (M07-15).
- Given the owner runs a test call, when it plays, then it uses the draft configuration and
  no customer-facing call is affected (M07-13).

**Localization notes.** The guided-setup UI is EN/HI/MR (F3); the agent's speech content
(opening line, hand-over lines, fallback line) is tenant data per agent language — content the
owner writes per language, not translation-catalog strings (`DOC10.templates-are-data`, M07
half). **Analytics events.** `agent_config_published` (version id), `agent_test_run` (typed |
called), `agent_language_set_changed`.

### M07.4 — Knowledge base and the unanswered-questions loop

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-16 | **The knowledge base is structured and reviewable, in the owner's own words — not a document upload.** Eight sections: About us · Products · Warranty · Process & timeline · Pricing & offers (what the agent may say about price is the owner's call, D36) · Subsidy/incentive (market-pack colour, F1-33) · Financing · Common objections. Brand and model names are never translated (F3 law, cited). | `SRC` — `TC.kb.1`–`TC.kb.9` (M07 halves — Task 12 holds the surface listing); `DOC04.kb-unanswered-loop` (8 sections) | P0 |
| M07-17 | **Seeded, not empty.** Every new tenant starts with a solar-industry default pack — generic but correct answers for the market's staple questions (the IN seed's subsidy/net-metering content is pack material, F1). *"Day one it works; week four it sounds like them."* | `SRC` — `TC.kb.11` (M07 half) | P0 |
| M07-18 | **The unanswered-questions loop:** when a customer asks something the agent could not answer, it is captured as an unanswered question with an asked-count. The owner sees a short list — *"3 customers asked about hail damage this week"* — and **one tap writes the answer into the named knowledge section; the agent knows it from the next call.** The KB grows from real calls instead of a blank page. | `SRC` — `TC.kb.10`, `TC.rec.1` (M07 halves — the committed mechanism); `DOC04.kb-unanswered-loop` ("One-tap answer writes the answer into the named knowledge section"); `AP.screen.2` | P0 |
| M07-19 | **A knowledge base that contradicts itself is flagged on save** (two different warranty answers), before the agent can speak either. | `SRC` — `TC.wrong.2` (M07 half) | P0 |
| M07-20 | **The agent's context is scoped to the single lead matched by the verified caller number; the knowledge base is per-tenant and read-only to the agent; the agent writes nothing beyond the call-outcome record.** No cross-customer retrieval exists. | `SRC` — `DOC08.agent-lead-scope` (docs/engineering/08) | P0 |
| M07-21 | **The KB preview shows the agent using the knowledge** — the same live-preview law as every config screen (`M01-30`), here specifically so a tone/knowledge mismatch is caught before it goes live. | `SRC` — `TC.wrong.7` (M07 half; pairs with `TC.config-ux.3` via `M01-30`) | P1 |

**Behavior detail.** KB content is tenant data, editable per agent language where the owner
wants distinct wording (`DOC10.templates-are-data` M07 half); a section answered in one
language falls back to the tenant's primary agent language rather than silence. **The KB is
mutable — calls pin the agent-config version, not KB content** (`DOC04.kb-unanswered-loop`);
what makes behaviour auditable per call is the config version plus the KB's own change history
(R10's auditability pairing, §M07.5).

Permissions: `F2.M01.configure-agent` (Owner-only) — including answering unanswered questions
and every promotion into the KB (R10).

**Edge cases & what-goes-wrong.**
- *Agent escalating almost everything* (`AP.wrong.2`) → its knowledge is too thin; the
  performance screen links straight to the unanswered-questions list (M07-58, M07-61).
- *Two owners answer the same unanswered question differently* → second save meets the
  contradiction flag (M07-19).
- *A question refers to a specific customer's deal* → the loop captures the question pattern,
  never another customer's data (M07-20).

**Acceptance criteria.**
- Given a new tenant, when the agent takes its first call, then every KB section already
  holds seeded content and no answer is a blank (M07-16, M07-17).
- Given the agent could not answer "does hail damage panels?", when the owner opens the list,
  then the question shows with its asked-count, and one tap on an answer writes it into the
  named section, live for the next call (M07-18).
- Given a KB edit that gives a second, different warranty answer, when the owner saves, then
  the contradiction is flagged at save time (M07-19).
- Given any call, when the agent retrieves context, then it reads only the matched lead and
  the tenant KB, and writes only the call-outcome record (M07-20).

**Localization notes.** KB authoring UI in EN/HI/MR; KB content is per-agent-language tenant
data (never machine-bridged across languages without the owner seeing it). **Analytics
events.** `kb_section_edited`, `unanswered_question_captured` (section guess),
`unanswered_question_answered` (one-tap | edited).

### M07.5 — Agent behaviour: defaults, disclosure, corrections (R10)

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-22 | **What the agent does by default — all editable by the owner (D36):** asks whether the proposal was received and reviewed · answers FAQs (timeline, subsidy, warranty, process, financing) · books a callback or a site visit · records interest level and objections · hands off to a human at any point. | `SRC` — `S7.rule.agent-defaults` (does-list); `D10` (default behaviour half) | P0 |
| M07-23 | **What it holds back by default:** discussing or offering a discount *(owner can enable)* · negotiating price *(owner can enable)* · accepting or confirming a deal · making technical or structural commitments · continuing after the customer asks to stop. Two of these are not defaults but law: **a deal is only ever accepted by the customer tapping Accept on the link — never by verbal agreement** (C8, `foundations/F5`); **continuing after "stop" violates the statutory opt-out** and is blocked by the gate (F1-36(c)). | `SRC` — `S7.rule.agent-defaults` (holds-back list; the two owner-enable italics are the source's); `D10` (its "may never discuss discounts" clause superseded by D36 — recorded; acceptance-via-link clause live); `S7.wrong.2` | P0 |
| M07-24 | **Every call opens naturally — no proactive AI mention at IN launch — and "talk to a person" works at any moment (owner ruling 2026-08-04, Q6, replacing the former ≤30 s disclosure default).** The tiered law of F1-36(d) governs: the four hard floors always hold — the agent **never claims to be human**, **never denies being AI when asked** (honest answer plus an immediate human offer), hands to a human instantly on request, and every call is fully transcribed to the timeline; proactive disclosure is pack data (IN OFF until the TRAI identification rule binds, then auto-ON with owner notification; EU-class packs ON). Each call records what its opener played and how any are-you-an-AI question was answered (§M07.7). | `SRC` — `S7.rule.disclosure` and `DOC00.voice-touchpoint` as superseded by the tiered law — owner ruling 2026-08-04 (Q6); `DOC04.call-ledger` (opener/answers recorded); `F1-36`(d) consumed | P0 |
| M07-25 | **The rep's assessment always wins.** Where the rep disagrees with the agent's read of a call — outcome, interest signal, summary — the rep's correction is what the lead shows. | `SRC` — `S7.wrong.7` (verbatim) | P0 |
| M07-26 | **Corrections train nothing automatically — review-queue only, no auto-training, ever in v1.** A correction updates the call record (outcome/summary) and emits a review-queue item; **an owner explicitly promotes an answer into the knowledge base** — the same one-tap loop as unanswered questions. Nothing a rep types reaches the agent's behaviour without that promotion. Behaviour stays auditable per call: config version + KB version. | `SRC` — `R10` (ruling verbatim); `S7.wrong.3` (post-overlay) | P0 |

**Behavior detail.** The owner-enable switches for discount discussion and price negotiation
live in agent setup (§M07.3) and version like everything else; enabling them changes what the
agent may *say*, never what it may *accept* (M07-23). "Technical or structural commitments"
stays held back as a default; note that structural adequacy claims are additionally barred by
platform law regardless of configuration — the agent can never speak a structural verdict the
product itself refuses to compute (`F8-28` family, cited). Figures the agent speaks are
renderings of the same computed values the screens show — same value, same tier, same
disclosure (`F8-24`, `F8-06` consumed).

Permissions: behaviour switches ride `F2.M01.configure-agent` (Owner). Correcting a call's
outcome rides lead visibility (the rep on their own lead; `F2.M02.lead-visibility` scope);
promotion into the KB is Owner-only (R10).

**Edge cases & what-goes-wrong.**
- *Agent misunderstands a customer* (`S7.wrong.3`) → the rep sees the transcript, corrects the
  outcome; the correction updates the record and lands in the owner's review queue; nothing
  changes agent behaviour until the owner promotes it (M07-25, M07-26).
- *Rep disagrees with the agent's read* (`S7.wrong.7`) → rep's assessment wins on the lead;
  the original agent read stays visible in the call record's history (M07-25).
- *Customer asks about price* (`S7.wrong.5`) → immediate escalation per §M07.8 — a
  notification, not a task buried in a list (M07-42, M07-43).
- *Customer says "stop calling"* (`S7.wrong.2`) → do-not-call set instantly, agent never dials
  again, irreversible without the customer's say-so (§M07.6, M07-31).

**Acceptance criteria.**
- Given default configuration, when a customer asks for a discount, then the agent offers a
  human instead of discussing it — and given the owner enabled discount discussion, then the
  agent may discuss it but still cannot accept or confirm a deal (M07-22, M07-23).
- Given any outbound agent call, when it connects, then it opens with the configured natural
  opener, "talk to a person" works at any moment of the call, and if the customer asks whether
  they are speaking to an AI the agent answers honestly and immediately offers a human
  (M07-24, owner ruling 2026-08-04 Q6).
- Given a rep corrects an agent outcome, when the correction saves, then the lead shows the
  rep's read, a review-queue item exists for the owner, and the KB is unchanged until the
  owner explicitly promotes an answer (M07-25, M07-26).

**Localization notes.** The disclosure and hand-over lines are tenant data per agent language
(M07's §M07.3 law); the review queue UI is EN/HI/MR. **Analytics events.**
`agent_outcome_corrected` (by role), `correction_promoted_to_kb` (owner),
`agent_price_escalation`.

### M07.6 — The compliance gate: the mechanism

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-27 | **The compliance gate is product code — one concrete implementation, non-swappable, no alternate adapter, ever, and no override flag.** It runs before **every** dial, on every leg, inbound and outbound. Its statutory **ruleset is data from the market pack** (`pack.calling-rules`, F1-15…F1-17; the IN instance is F1-36): the mechanism never varies per market; the ruleset always does. **A market with no voice ruleset in its pack cannot enable outbound voice** (F1-16 consumed). *"Tenants configure within the law, not around it."* | `SRC` — `D36` as amended 2026-08-02 (mechanism half — the ruleset half is F1's, Task 6); `DOC07.compliance-gate` ("ours, non-swappable … There is no override flag"); `DOC08.compliance-gate` | P0 |
| M07-28 | **Before a dial, eligibility is read and shown: consent state, do-not-disturb registry status, the do-not-call flag, the quiet flag, and the window check.** The gate reads one row per dial from the customer record's compliance fields (`M02-37` consumed; the records themselves are pack data-rights content, F1-58). The pre-dial surface shows the verdict — set to respect the customer by default; above-floor choices are the owner's. | `SRC` — `S7.screen.4` (post-overlay — "the owner owns the choice" survives only above the floor); `DOC04.compliance-flags` (gate-read half; the record half is `M02-37`'s); `F1-58` consumed | P0 |
| M07-29 | **Fail-closed:** when the registry-scrub data is stale beyond the pack's freshness duty, promotional dialing **pauses** — and the pause is alarmed to the owner — while transactional calls continue. Compliance outranks revenue-generating dialing. | `SRC` — `DOC09.compliance-fail-closed` (verbatim posture); `F1-36`(a) consumed (freshness duty is pack data) | P0 |
| M07-30 | **A refusal is visible, never silent.** A queue entry the gate blocks persists its pre-dial verdict — registry-listed · no consent · do-not-call · outside window · quiet flag — on the queue and on the lead. A registry-listed customer is not dialed by the agent and **the rep is told to call manually**. **Manual dials (owner ruling 2026-08-04, Q30):** on an outside-window or registry-listed manual call action the product shows the verdict as a **warning-then-proceed** — the rep may proceed, and where they cite a customer request the "customer requested" context is logged with the call; the statutory gate enforcement itself binds automated dials (the three lanes, F1-36(b)). | `SRC` — `S7.wrong.1` (post-overlay: gate enforcement, not a default); `DOC04.call-queue-compliance` (persisted verdict vocabulary); manual-dial warning-then-proceed per owner ruling 2026-08-04 (Q30) | P0 |
| M07-31 | **"Stop calling" sets do-not-call instantly — honored within the pack's deadline, irreversible without the customer's own say-so. A customer complaint sets a permanent quiet flag.** The calling window honors the pack's holiday calendar, so festival-day calls are blocked, not apologised for. | `SRC` — `S7.wrong.2` (verbatim); `S7.wrong.6` (window + holiday calendar + complaint quiet flag; the calendar is pack/tenant data per the ledger note — F1-48); `F1-36`(c) consumed | P0 |
| M07-32 | **The gate enforces the tiered disclosure law (owner ruling 2026-08-04, Q6 — the former ≤30 s disclosure floor is retired):** on every automated call the four hard floors hold — never claims human · never denies being AI when asked (honest answer + immediate human offer) · instant handoff · full transcription — and the call record stores the opener version played and any AI-question answer given (§M07.7). Proactive disclosure enforcement follows the pack flag (F1-36(d)): where a pack ships it ON (EU-class; IN after the TRAI auto-flip), the gate enforces the proactive line as floor; where OFF (IN launch), only the hard floors are enforced. The recording of what played never relaxes. | `SRC` — `F1-36`(d) consumed (tiered law per owner ruling 2026-08-04, Q6); `DOC04.call-ledger` (superseded "disclosure_played ≤30 s" field reading updated to opener/answer recording) | P0 |

**Behavior detail.** The gate is deliberately boring on screen: reps see verdicts and reasons,
never toggles. There is no support path, no admin path and no tenant setting that skips it
(F1-17 consumed). What the gate consumes — registry scrub freshness, window, series routing
duty, opt-out deadline, retention — is pack content and appears in this module only as the
named pack keys. Recording consent is captured by default and **a customer who declines
recording is still served** (F1-39 consumed); retention and purge duties are pack data
surfaced in §M07.7's record behaviour.

Permissions: none — the gate is not a permission surface. Consent and do-not-call *records*
are edited only by their own flows (opt-out, complaint, customer say-so), audited per `F2-22`
(whose covered-events list names these registry/consent changes).

**Edge cases & what-goes-wrong.**
- *Customer is on the do-not-disturb registry* (`S7.wrong.1`) → agent will not dial; the rep
  is told to call manually (M07-30). The manual call gets the warning-then-proceed treatment
  with any "customer requested" context logged — ruled 2026-08-04 (Q30); the enforced lanes
  bind automated dials only.
- *Customer says "stop calling"* (`S7.wrong.2`) → do-not-call instantly; the agent never dials
  again; only the customer's own say-so reverses it (M07-31).
- *Agent calls during a festival or at a bad time* (`S7.wrong.6`) → prevented by the window
  plus the holiday calendar; a complaint sets the permanent quiet flag (M07-31).
- *Scrub source goes down for a day* → promotional dialing pauses fail-closed and the owner is
  alarmed; transactional calls continue; nothing silently dials on stale data (M07-29).
- *A lead arrives at 11 pm* → captured, never dialed before the window opens (`S2.wrong.4` —
  M02's row, consumed; queue behaviour at M07-35).

**Acceptance criteria.**
- Given any queued call, when its dial moment arrives, then the gate's checks run first and a
  block persists its verdict on the queue entry and the lead (M07-27, M07-30).
- Given a customer with do-not-call set, when any trigger fires for them, then no agent dial
  occurs, in any market, under any tenant configuration, with no override path (M07-27,
  M07-31).
- Given scrub data older than the pack's freshness duty, when promotional dialing is due, then
  it is paused and the owner alarmed while transactional calls continue (M07-29).
- Given a pre-dial view of any customer, when it renders, then consent, registry status,
  do-not-call, quiet flag and window verdict are all visible (M07-28).
- Given any connected agent call, when it completes, then the record shows the opener version
  played and — where the customer asked — that the AI question was answered honestly with a
  human offered; where the pack's proactive-disclosure flag is ON, the record shows the
  proactive line played (M07-32, owner ruling 2026-08-04 Q6).

**Localization notes.** Verdict copy in EN/HI/MR; statutory vocabulary rendered with the
pack's labels (F1-22). **Analytics events.** `dial_blocked` (verdict), `optout_recorded`,
`promotional_pause_started` (fail-closed).

### M07.7 — Triggers, the call queue, and call execution

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-33 | **The agent triggers two ways: automatically as a safety net — proposal unopened 3 days (`M06-55` consumed) · rep task overdue 2 days (M07-07) · three failed manual call attempts (`M02-43` consumed) — and on demand, when a rep hands a lead to it.** A customer-requested callback also queues (callback-requested) — and under the **requested-callback lane** (owner ruling 2026-08-04, Q30; F1-36(b) lane 3) it may be scheduled **outside the statutory window only on an explicitly recorded, timestamped customer request for that time** (transcript, message or rep note): the call opens by referencing the request, the consent trail is stored as evidence, and a single "stop" ends the lane for that customer; the lane is product law, per-tenant enable/disable only. The owner chooses which automatic triggers are live (M07-34). | `SRC` — `D17` (verbatim trigger set — closing Task 16's hold); `DOC04.call-queue-compliance` (adds manual / callback_requested); `S6.wrong.5`, `S3.wrong.1` (cited — disposed by Tasks 16/13); requested-callback lane per owner ruling 2026-08-04 (Q30) | P0 |
| M07-34 | **Agent settings, runtime half: on/off · which triggers are live · maximum attempts before it gives up.** (The window and languages halves are §M07.3's.) Off means off: nothing queues, nothing dials, inbound falls to the tenant's non-AI routing (§M07.9). | `SRC` — `S7.screen.1` | P0 |
| M07-35 | **The agent queue shows who is scheduled to be called, when, and why — and the owner can remove anyone from it.** Scheduling is window-shifted: an 11 pm capture queues for not-before the window opens (a recorded requested-callback may sit outside the window per M07-33's lane). Removal/cancel (owner ruling 2026-08-04, Q31): the **queuing rep may cancel their own queued entries**; the **Owner may cancel anything**; every cancellation is logged to the lead timeline. Attempts are counted against the configured maximum. | `SRC` — `S7.screen.2` (verbatim); `DOC04.call-queue-compliance` ("11 pm capture ⇒ not before 9 am"; owner can cancel; attempts counted); rep-cancels-own widening per owner ruling 2026-08-04 (Q31) | P0 |
| M07-36 | **A queued call carries the agent-config version it was queued with** (M07-14) and dials with exactly that behaviour; the queue view names the version where it differs from current. | `SRC` — `DOC04.agent-config-versions`; `TC.wrong.3` (M07 half) | P0 |
| M07-37 | **Voice allowance is checked before queue insert and again before dial** — queue entries can outlive allowance; a blocked entry is marked and the owner notified. Minutes are metered to the tenant usage ledger; the meter and its pricing are `BM-16`/`BM-18`'s, the gate and ledger mechanics `modules/M12`'s. Per-call cost composition is internal and never customer-facing. | `SRC` — `DOC16.gate.voice` (M07 surface half — mechanics M12, Task 23); `R3` consequence (metered minutes — the rate is BM-41 book data); `DOC04.usage-ledger` (cited — M12) | P0 |
| M07-38 | **Every call is ledgered — human and agent, inbound and outbound.** The record: a typed outcome — interested · callback requested · not interested · no answer · busy · wrong number · voicemail · escalated · transferred · opted out — an interest signal (hot/warm/cold/none), a one-line summary **on the lead timeline** with transcript and recording on tap, the language used, the recording-consent flag (a customer may decline and still be served), that the disclosure played, the agent-config version used, and IVR-traversal markers where they apply (§M07.9). Recording is purged at the pack's retention bound; **the transcript is retained.** | `SRC` — `D18` (HONORED, plus the overlay's config-version and IVR-marker additions); `S7.screen.3`; `DOC04.call-ledger`; retention per `F1-36`(e)/`DOC08.recording-retention` (shared — pack data F1) | P0 |
| M07-39 | **Call failure is honest: the call record is always written.** A mid-call media drop attempts one apology line, else hangs up with outcome recorded as dropped; a provider outage pauses outbound and lets inbound fall to voicemail; speech/understanding stalls follow a defined ladder ending in hand-to-human or voicemail per tenant config — never dead air, never a silent no-op. | `SRC` — `DOC07.call-failure-honesty` ("call record always written"); `DOC07.agent-orchestration` (stall ladder, product-visible half — orchestration internals excluded per §14) | P0 |
| M07-40 | **A wrong or reassigned number is flagged and the number marked unverified** — no further automated attempts until a person confirms it. | `SRC` — `S7.wrong.4` | P0 |
| M07-41 | **Figures the agent speaks are renderings of the product's computed values** — same value, same provenance tier, same disclosure as the screen and the document. The agent never recomputes, never rounds differently, and never drops a qualifier. | `SRC` — `F8-24` consumed (F8 §4 names M07); `F8-06` consumed (number-honesty is never tenant-configurable — the agent's speech is; its numbers are not) | P0 |

**Behavior detail.** The queue is the one place scheduled automation is visible; nothing dials
that was never in it. Removal by the owner records who and why on the lead timeline. Retries
after no-answer respect the attempt cap and the window; when attempts are exhausted the agent
gives up **visibly** — a task for the rep, not silence. The transcript honesty rules are F8's:
the record shows what happened, including what did not (degraded steps, §M07.9), and
corrections ride §M07.5's R10 loop. Call results write to the lead's single timeline
(`DOC04.timeline` — M02's row, consumed): actor = agent.

Permissions: queue visibility is scoped — EPC Owner all, Sales Manager team, Sales Executive
own (`F2.M07.see-agent-queue`); removal/cancel — EPC Owner anything, the queuing rep their
own entries (`F2.M07.control-agent-queue`, widened per owner ruling 2026-08-04 Q31); handing
a lead to the agent on demand is `F2.M07.hand-lead-to-agent` (Owner · Sales Manager · Sales
Executive, scope follows lead visibility). Queue changes are audited (`F2-22`).

**Edge cases & what-goes-wrong.**
- *Agent reaches a wrong or reassigned number* (`S7.wrong.4`) → flagged, number marked
  unverified, automation stops for that number (M07-40).
- *Proposal unopened five days* → already in My Day's OVERDUE and the queue's "why" shows the
  unopened trigger (M07-33, M07-02).
- *A queued call outlives its allowance* → blocked at dial, marked, owner notified — it never
  half-dials (M07-37).
- *Same lead hits two triggers* → one queue entry, both reasons shown; attempts count once.
- *Owner switches the agent off with calls queued* → queue drains to nothing dialed; entries
  are marked cancelled-by-off, visible, never silently dropped (M07-34).

**Acceptance criteria.**
- Given a proposal three days unopened, a task two days overdue, or a third failed manual
  attempt, when the safety net runs, then a queue entry exists naming that reason — and given
  a rep hands a lead over, then it queues on demand (M07-33).
- Given a lead captured at 11 pm, when it queues, then its scheduled time is not before the
  window opens (M07-35).
- Given the owner removes any queued call — or the queuing rep cancels an entry they queued —
  when the queue refreshes, then the entry is gone and the cancellation is on the lead
  timeline with its actor (M07-35, owner ruling 2026-08-04 Q31).
- Given allowance exhausted between insert and dial, when the dial moment arrives, then the
  entry blocks, is marked, and the owner is notified (M07-37).
- Given a config version published after a call was queued, when that call dials, then it runs
  the version it was queued with and the queue view names the difference (M07-36).
- Given the agent reaches a wrong or reassigned number, when the call ends, then the record's
  outcome is wrong-number, the number is marked unverified, and no further automated attempt
  occurs until a person confirms it (M07-40).
- Given any completed, dropped or failed call, when the lead timeline renders, then the call
  record exists with its typed outcome, summary, language and config version, with transcript
  on tap (M07-38, M07-39); and given the customer declined recording, then no recording exists
  but the call proceeded and the transcript survives per the pack's rules (M07-38).
- Given the agent quotes a system's savings figure, when compared with the proposal document,
  then value, tier and qualifier match exactly (M07-41).
- Given the agent is off, when any trigger condition occurs, then nothing is queued or dialed
  (M07-34); given attempts reach the configured maximum, then the agent stops and a rep task
  is created (M07-34, M07-06).

**Localization notes.** Outcome vocabulary translated EN/HI/MR (F3); transcripts stay in the
call's language, labelled. **Analytics events.** `agent_call_queued` (trigger),
`agent_call_completed` (outcome, language), `agent_call_blocked` (verdict),
`agent_attempts_exhausted`.

### M07.8 — Escalation, hand-to-human and routing

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-42 | **The escalations surface shows every call the agent handed to a human, and why — the reason visible** (*"customer asked for a discount"*). Hand-to-human works at any point in any call (M07-24). | `SRC` — `S7.screen.5` (verbatim) | P0 |
| M07-43 | **A price question is an immediate escalation: the rep gets a notification, not a task buried in a list.** The notification deep-links to the live context. Notification delivery contracts are `foundations/F6`'s (`agent_escalation` type registered there). | `SRC` — `S7.wrong.5` (verbatim); `DOC04.notification-types` (cited — F6) | P0 |
| M07-44 | **Routing and escalation rules are tenant data, not code**: ordered condition → action rules (confidence, customer-requests-human, intent, priority, business hours, VIP/existing-project) with actions continue · warm transfer · cold transfer · escalate through a chain · queue a callback · voicemail. **Escalation chains ring level by level with timeouts and a mandatory terminal fallback (callback queue or voicemail)** — a customer is never rung into a dead end. Routing policy is versioned; in-flight calls keep the version they started with. | `SRC` — `DOC07.routing-tenant-data`; `DOC04.routing-policies` ("mandatory terminal fallback"; versioned-append) | P0 |
| M07-45 | **Every handoff writes a pinned context record** — summary, intent, sentiment, collected fields, transcript pointer — generated once at handoff time, with the target and outcome. A warm transfer delivers a spoken whisper summary before bridging **where the rail declares that capability**; otherwise it degrades to cold transfer plus a push with the summary and a deep link — declared path, never a silent no-op (F8-35 consumed). | `SRC` — `DOC04.handoff-ledger`; `DOC07.telephony-capabilities` (degradation ladder); `DOC14.voice-capabilities` ("warm transfer live only if provider-verified, else auto-degrades") | P0 |
| M07-46 | **Per-user routing availability is a manual toggle in v1**: available · busy · off, with an optional until-time. Ring groups and chains read it. | `SRC` — `DOC04.user-presence` ("v1 = manual toggle") | P0 |

**Behavior detail.** The default hand-over set (§M07.3, M07-11) is the routing layer's seed;
the condition→action editor is the grown-up form of the same list, and both edit the same
tenant data. Launch scope is deliberately modest: single-level escalation chains as data;
advanced call-control remains a designed seam, not shipped behaviour (OD-7: *"Launch builds
launch scope only; advanced capabilities are seams, not code"*).

Permissions: routing policy edits ride `F2.M01.configure-agent` (Owner). Presence is each
user's own. Escalation events are audited (`F2-22`).

**Edge cases & what-goes-wrong.**
- *Customer asks about price* (`S7.wrong.5`) → immediate notification to the rep with live
  context (M07-43); if the rep is unavailable the chain rings on and terminates in callback
  queue or voicemail, never a dead end (M07-44).
- *Warm transfer attempted on a rail without the capability* → auto-degrades to cold + push;
  the record says which path ran (M07-45).
- *Everyone off/busy at escalation time* → terminal fallback takes the call; the escalations
  surface shows it (M07-42, M07-44).

**Acceptance criteria.**
- Given a customer asks for a discount mid-call, when the hand-over rule fires, then the rep
  is notified immediately with a deep link, and the escalations surface lists the call with
  its reason (M07-42, M07-43).
- Given an escalation chain where no level answers, when the timeouts elapse, then the
  terminal fallback (callback queue or voicemail) takes the call — a dead end is impossible
  by construction (M07-44).
- Given any handoff, when the human picks up, then the pinned context (summary, intent,
  collected fields) is with them — as a whisper where the rail declares it, else as push +
  deep link, and the record shows which (M07-45).
- Given a user sets themself off until 3 pm, when routing runs, then they are skipped until
  then (M07-46).

**Localization notes.** Whisper summaries and pushed summaries render in the recipient user's
language (F3); escalation reasons translated. **Analytics events.** `agent_escalated`
(reason, path), `handoff_completed` (warm | cold | fallback), `presence_changed`.

### M07.9 — Inbound: IVR, capture, and honest degradation

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-47 | **Inbound call routing is tenant-visible configuration, not code: a per-tenant flow — greeting → menu → route to AI agent / human ring group / voicemail — with business-hours branches.** The editor is a **list-based step editor, not a canvas**: ordered menu items (key → destination), a business-hours switch reusing the calling-window control (within the floor), per-language greeting text with spoken preview. Flows are versioned like agent config and published whole. | `SRC` — `UXG-17` (post-overlay row); `DOC07.inbound-ivr`; `DOC04.ivr-flows` (its outbound sendDtmf wording is the superseded directive-7 text — recorded at `registers/conflicts.md` row 7, not implemented) | P0 |
| M07-48 | **The agent answers inbound when nobody picks and captures the enquiry — name, city, bill amount, interest — into the CRM capture flow, meeting the same dedupe sheet as every channel** (`modules/M02`'s surface, UXG-02 reuse — cited). An after-hours capture queues its callback window-shifted (M07-35); the customer is served at capture time, called back lawfully. | `SRC` — `S2.rule.channel.2` (cited — M02 owns capture; the agent side is this row); `UXG-02` (cited — one sheet, three entry points); `DOC02.trigger-schedule` (window-shift — shared) | P0 |
| M07-49 | **Automated menu traversal on outbound calls is a declared, negotiated capability — and it degrades honestly.** Where the rail declares DTMF-send, the call record gains a *"navigated an IVR (N steps)"* line and transcript markers. Where it does not — **the v1 reference rail does not provide it** — the step is skipped and the call is flagged for human follow-up; the record states what did not happen rather than looking like a failed call. *"Stuck in IVR — escalated"* is a required failure state either way. | `SRC` — `UXG-18` (post-overlay row — the original `sendDtmf()/onDtmf()` premise is superseded, ADR-0019: "Do not implement"); OD-7 (capability-framework half); `DOC07.telephony-capabilities` ("step skipped, call flagged … for human follow-up"); `F8-35` consumed | P0 |
| M07-50 | **Inbound degradation ladders are defined, never improvised:** AI-inbound over allowance falls back to the human ring group or voicemail per the tenant's own IVR config; a **halted** tenant's inbound degrades to a missed-call log plus voicemail — no AI minutes burned, no caller stranded. (Billing states and the gate mechanics are `modules/M12`'s.) | `SRC` — `DOC16.gate.voice` (inbound half — shared, M12); `DOC16.halted-inbound-degrade` (shared — M12 owns the billing state) | P0 |

**Behavior detail.** The IVR flow is the tenant's front door: its greeting is per-language
tenant data, its menu routes to the same ring groups and presence the routing layer uses
(§M07.8), and its "route to AI agent" step engages the same agent with the same gate. Missed
calls always leave a trace — a missed-call log entry on the lead (or the capture flow for
unknown numbers), so "nobody picked and nothing happened" cannot occur. The number-series
routing duty behind inbound/outbound legs is pack data (F1-37), invisible here beyond the
provisioning explainer (§M07.10).

Permissions: IVR flow editing rides `F2.M01.configure-agent` (Owner). Inbound capture obeys
M02's capture permissions (the agent acts as a system actor — `M02-50` consumed).

**Edge cases & what-goes-wrong.**
- *Caller presses a key the menu does not define* → re-prompt, then the flow's fallback route;
  never a hang-up by omission (M07-47).
- *Outbound call meets an answering menu and the rail lacks DTMF-send* (`UXG-18`) → step
  skipped, call flagged for human follow-up, record honest about the degradation (M07-49).
- *AI answers but allowance is exhausted mid-month* → inbound falls to ring group/voicemail
  per tenant config; the owner sees why on the usage surface (M07-50, M07-59).
- *Tenant halted for non-payment* → inbound callers reach voicemail and the missed-call log
  fills; nothing burns AI minutes; read + export of existing records still work
  (`modules/M12`'s soft-block law, cited) (M07-50).

**Acceptance criteria.**
- Given a tenant edits their IVR flow, when they publish, then the whole flow versions and
  in-flight calls finish on the version they started (M07-47).
- Given an unknown caller the agent serves at 11 pm, when capture completes, then the lead
  exists via the standard dedupe path and any callback is queued no earlier than the window
  opening (M07-48).
- Given an outbound call that encounters an automated menu, when the rail lacks the traversal
  capability, then the record shows the step was skipped and the call is flagged for human
  follow-up — and where the rail declares it, the record shows "navigated an IVR (N steps)"
  with markers (M07-49).
- Given AI-inbound over allowance, when a call arrives, then it routes per the tenant's IVR
  fallback and is logged (M07-50).

**Localization notes.** IVR greetings and menus are per-language tenant data with spoken
preview (UXG-17); missed-call and voicemail notices in the user's language. **Analytics
events.** `ivr_flow_published` (version), `inbound_captured` (known | new),
`ivr_traversal_result` (navigated | skipped | stuck_escalated), `inbound_degraded` (reason).

### M07.10 — Telephony numbers

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-51 | **Every tenant gets a platform-provisioned number by default — instant, and the only outbound origin.** Choosing it is the provisioning wizard's default path. | `SRC` — `UXG-16` (post-overlay — platform number "instant, default"); `DOC07.byo-forwarding` ("the only outbound origin") | P0 |
| M07-52 | **Bring-your-own number means inbound forwarding only: the tenant's existing number forwards to their platform number; outbound caller identity remains the platform number. Outbound CLI is NOT portable, and product copy must say "forwarding."** The wizard tracks status — requested · verifying · active · failed — with honest lead-time copy. The superseded "hosted/ported with KYC" definition is not implemented, anywhere. | `SRC` — `UXG-16` (post-overlay: "BYO = inbound forwarding to the platform ExoPhone — outbound CLI is NOT portable" — vendor term generalised per OV-34); OD-7 as amended (ADR-0019, closing the M07 half); `DOC07.byo-forwarding`; `DOC04.byo-number` (its porting/KYC wording superseded — recorded at `registers/conflicts.md` row 6) | P0 |
| M07-53 | **The wizard explains number-series routing in one line, honestly** — which series the tenant's outbound and inbound traffic uses, and why. The series rules and their content are the market pack's (`F1-37` consumed); the wizard renders that key's explanation and this module restates none of its data. | `SRC` — `UXG-16` (post-overlay one-line explainer duty); `F1-37` consumed (series content — the pack owns it); `DOC04.byo-number` (series vocabulary half) | P0 |
| M07-54 | **Telephony is a provider-agnostic capability framework: every adapter declares what it truly supports, and product behaviour branches on the declaration — never on the vendor name.** A feature needing a missing capability degrades on its defined path (M07-45, M07-49). Vendor names appear in this suite only as v1 reference implementations (Exotel + Sarvam are the IN reference rails behind the capability ports — F1-43; Bolna is the documented alternate behind the same ports). | `SRC` — OD-7 (capability-framework half, closing Task 7's routing); `DOC07.telephony-capabilities` ("business logic branches on the declaration — never on the vendor name"); `R3` (capability half — the IN rails half is `F1-43`, Task 6); `UD-6` (shared — the vendor pair as reference implementation only) | P0 |

**Behavior detail.** Provisioning is a settings surface (listed by `M01-57`; behaviour here):
choose platform number (default, instant) or BYO forwarding, see status with honest lead-time
copy, and see which number outbound calls will present — always the platform number, stated
plainly so no tenant expects their own number on outbound caller ID. Number-provisioning
status notifications register with `foundations/F6` per the UX-gap register's cross-cutting
rule.

Permissions: EPC Owner only (rides `F2.M01.manage-tenant-settings`).

**Edge cases & what-goes-wrong.**
- *BYO verification fails* → status shows failed with the reason and a retry; the platform
  number keeps working throughout — provisioning never takes the tenant's voice offline
  (M07-52).
- *Tenant asks for their own number as outbound caller ID* → the product says no honestly in
  copy ("forwarding, not porting"), not in support tickets (M07-52).
- *A market's pack declares no voice ruleset* → provisioning for outbound is unavailable in
  that market entirely (M07-27; F1-16).

**Acceptance criteria.**
- Given a new tenant, when they open voice settings, then a platform number is available
  instantly as the default choice (M07-51).
- Given a tenant completes BYO setup, when a customer calls their old number, then it forwards
  in; and when the agent calls out, then the platform number is the caller identity — with the
  wizard having said exactly that in advance (M07-52, M07-53).
- Given any telephony feature, when its adapter lacks the declared capability, then the
  defined degradation path runs and the record says so — no behaviour anywhere branches on a
  vendor's name (M07-54).

**Localization notes.** Wizard copy EN/HI/MR; series explainer uses pack labels (F1-22).
**Analytics events.** `number_provisioned` (platform | byo_forwarding),
`byo_status_changed`, `series_explainer_viewed`.

### M07.11 — Agent performance and usage

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-55 | **The agent-performance screen exists because an owner paying for automated calls who cannot see what they bought will cancel within a month — it is not analytics garnish; it is the reason the agent survives its first invoice.** The monthly block, this month vs last: calls attempted · connected (with rate) · callbacks booked · site visits booked · handed to a human · questions it could not answer (→ review). Outcomes by type. "What it saved you": conversations the team did not have to start and the approximate calling time. (The source's figures — 412 attempted, 246 connected, ≈20 hours — are illustrative samples, not targets.) | `SRC` — `AP.retention.1` (shared — M13 reciprocates); `AP.dashboard.1` (shared) | P0 |
| M07-56 | **"Deals it touched" reports correlation, and the screen says so — beside the number, not behind an interaction.** The block (e.g. *"31 proposals were quiet, the agent called, and the customer responded within 3 days"*, with the pipeline value in tenant-currency pack formatting) renders with the verbatim caption of `F8-30`: *"The agent called and the customer responded within 3 days. We cannot prove the call caused it."* Never a tooltip (F8-31). The product never claims the agent generated revenue. | `SRC` — `AP.dashboard.2`, `AP.honesty.1` (shared — the law is `F8-30`/`F8-31`, Task 7; the screens are here and M13); `AP.wrong.3` (caveat on the screen, not in a tooltip) | P0 |
| M07-57 | **The call log: every call — customer, duration, outcome, language, config version — filterable, with transcript and recording on tap.** | `SRC` — `AP.screen.1` (shared — M13) | P0 |
| M07-58 | **The unanswered-questions screen: what customers asked that the agent could not handle, one tap to answer** (§M07.4's loop). *"This is where the dashboard turns into improvement."* | `SRC` — `AP.screen.2` (shared — M13); `TC.kb.10` | P0 |
| M07-59 | **The usage view shows calls made and minutes used this period, reading the real usage ledger — the same numbers as billed.** Whether a cap applies is entitlement data (`modules/M12`); the deferred-era "no plan cap by design" claim is superseded and appears nowhere. | `SRC` — `AP.screen.3` (post-overlay — D38-era clause struck; shared with M12/M13); `BM-16`/`BM-18` consumed; `UXG-15` (cited — M12 owns the tenant-wide usage screen) | P0 |
| M07-60 | **The per-rep view — which reps lean on the agent, whose leads it rescued — is Sales Manager's and the EPC Owner's only.** *(In-row note: the source says "Manager-only"; the EPC Owner superset and the Manager→Sales Manager preset rename follow the pre-existing F2 row — `F2.M07.agent-performance`, Task 5, whose row text already names both — so the widening is deliberate and visible, not silent.)* | `SRC` — `AP.screen.4` (shared — M13); visibility per `F2.M07.agent-performance` | P1 |
| M07-61 | **The screen defends itself:** a collapsing connect rate is surfaced as a warning with the likely cause (wrong numbers, bad timing) — not left for the owner to notice; an agent escalating almost everything links straight to the unanswered-questions list; and if nobody opens the screen, a monthly summary is pushed to the owner in-app, where they actually read things. | `SRC` — `AP.wrong.1`, `AP.wrong.2`, `AP.wrong.4` (shared — M13; push type registers with F6) | P0 |

**Behavior detail.** This module owns the agent-performance surfaces as working screens; the
owner's dashboard tiles that cite them are `modules/M13`'s (D37 — read-only, honest, every
tile answers "what do I do about this?"). The correlation caption is persistent content and
translated; the window ("within 3 days") is part of the caption, not a tunable.

Permissions: `F2.M07.agent-performance` (EPC Owner, Sales Manager); the per-rep view
additionally per its row. A Sales Executive's own step-back view is `modules/M13`'s row,
own-scoped (F2 §F2.5-M13 note).

**Edge cases & what-goes-wrong.**
- *Connect rate collapses* (`AP.wrong.1`) → warning with likely cause on the screen (M07-61).
- *Agent escalating almost everything* (`AP.wrong.2`) → "knowledge too thin" link to the
  unanswered list (M07-61, M07-58).
- *Owner over-trusts "deals touched"* (`AP.wrong.3`) → the caveat is on the screen, beside the
  number (M07-56).
- *Nobody opens the screen* (`AP.wrong.4`) → monthly in-app summary push (M07-61).

**Acceptance criteria.**
- Given a month of agent activity, when the performance screen renders, then attempted,
  connected, callbacks, site visits, hand-offs and unanswered counts show this month vs last
  (M07-55).
- Given the "deals it touched" block renders, then the `F8-30` caption is visible beside the
  figure without any interaction, in the viewer's language (M07-56).
- Given any listed call, when tapped, then transcript and recording (where consented and
  within retention) open (M07-57); given the unanswered list, then one tap answers into the
  KB (M07-58).
- Given the usage view and the invoice for the same period, then the minutes shown are the
  same numbers (M07-59).
- Given a sharp connect-rate drop, when the screen renders, then the warning with likely
  cause is present; given a month of no visits to the screen, then the owner received the
  in-app summary (M07-61).

**Localization notes.** All captions EN/HI/MR; the `F8-30` caption's translation is the
canonical one from F8 (one string, everywhere). Currency/number formatting per pack (F1-46).
**Analytics events.** `agent_performance_viewed`, `monthly_summary_pushed`,
`connect_rate_warning_shown`.

### M07.12 — Close: Mark won, Mark lost, Reopen

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M07-62 | **Mark won captures the final value and the expected install date — and creates the project, atomically, in the same act.** There is no separate "create project" step; nobody re-enters the customer (*"a won deal is a project"* — `S8.rec.1`, `modules/M08`'s object; the transition's atomicity is `M02-57` consumed). A customer Accept on the link notifies the rep; **the rep still marks Won — human confirms, then the project exists** (`DOC04.accepted-human-confirms` — cited, `foundations/F5`'s row). | `SRC` — `S7.screen.6` (verbatim fields); `M02-57` consumed; `S8.rec.1` (cited — M08, Task 18) | P0 |
| M07-63 | **Mark lost requires a reason — price · chose competitor · postponed · not reachable · roof unsuitable · financing failed · not interested. "This list is the most valuable data in the product."** The reason drives R9's rules as written: *postponed* auto-resurfaces the lead on the given date; *not interested* suppresses the no-call task for six months. The former vocabulary mismatch is **resolved (owner ruling 2026-08-04, Q21)**: "not interested" is the **seventh Lost reason**, carrying the six-month suppression exactly as R9 intends; the disqualify list is unchanged (`M02-54` is the machine's row; this is its surface). | `SRC` — `S7.screen.7` (the source six); `R9.lost` (cited — the machine is M02's single definition); seventh reason per owner ruling 2026-08-04 (Q21) | P0 |
| M07-64 | **Reopen: a lost lead can come back — it re-enters at its prior funnel stage and the timeline records the reopen; postponed losses auto-resurface on their date without anyone remembering them.** | `SRC` — `S7.screen.8`; `R9.reopened` (cited — `M02-56` family consumed) | P0 |
| M07-65 | **The close surfaces feed the honest lists, and only those:** lost-with-reason into the win/loss "lost late" list, disqualified-early into its list (`modules/M13`'s surfaces); a won deal's revenue counting and any later cancellation are `modules/M08`/`modules/M13`'s (R2's `CANCELLED` stops counting immediately — cited). Nothing here double-counts, forecasts, or re-claims agent credit (F8-30 consumed). | `SRC` — `R9` ("Surfaced where" — cited); `D37` (cited — M13); `R2` (cited — M08) | P0 |

**Behavior detail.** Mark won pre-fills final value from the accepted proposal version
(`modules/M06`'s object) and requires the expected install date; on confirm, the project
exists with the proposal's tranche schedule as its collection schedule (`modules/M11`'s
money path — cited, never restated). Mark lost from a lead in any open stage; the reason
sheet is one tap per reason, because *"if the product cannot represent that cleanly, reps
keep it in their head."* Both acts land on the timeline with actor and, for lost, reason.

Permissions: `F2.M07.mark-won-lost` — EPC Owner · Sales Manager · Sales Executive, scope
follows lead visibility. Won/Lost events are audited (`F2-22` names them).

**Edge cases & what-goes-wrong.**
- *Customer goes silent instead of saying no* (`S7.wrong.8`) → nobody marks anything; the
  30-day dormant sweep catches it (M07-04; `M02-52`) — silence never requires a fake "lost".
- *Lost as postponed* → auto-resurfaces on the date at 09:00 tenant-local with a follow-up
  task (M07-63, M07-64).
- *Rep marks won before the customer formally accepted* → allowed — the rep is the human
  confirmation (M07-62); the acceptance record, where one exists, is attached from the link's
  events (`foundations/F5`).
- *Won marked by mistake* → the project exists; correcting it is M08's cancellation with
  reason (`S8.wrong.8` — cited, M08's), never a silent delete.

**Acceptance criteria.**
- Given a rep marks a lead won with final value and expected install date, when they confirm,
  then the project exists immediately with no re-entry of customer data, and the lead shows
  won (M07-62).
- Given a rep marks a lead lost, when they must pick a reason, then the surface offers the
  ruled seven-reason set (the source six plus "not interested" — owner ruling 2026-08-04,
  Q21), refuses a reasonless save, and postponed losses carry a date (M07-63).
- Given a postponed loss dated next month, when that date arrives, then the lead resurfaces
  at 09:00 tenant-local with a follow-up task (M07-64).
- Given a lost lead is reopened, when it re-enters, then it lands at its prior funnel stage
  and the timeline records the reopen (M07-64).
- Given a deal is lost or won, when the win/loss lists render, then it appears in exactly its
  ruled list, and no forecast or agent-credit figure is restated here (M07-65).

**Localization notes.** Reason labels EN/HI/MR — the translated reason list is one vocabulary
across M02's machine and this surface. **Analytics events.** `lead_marked_won` (value,
install date), `lead_marked_lost` (reason), `lead_reopened`.

## 4. Cross-module contracts

**Expects from others.**

- `foundations/F1` — the `pack.calling-rules` ruleset the gate consumes (F1-15…F1-17; IN
  F1-36…F1-39), the reference rails (F1-43), consent records (F1-58), formats and the holiday
  calendar (F1-46/F1-48), and the no-ruleset-no-outbound-voice rule (F1-16).
- `modules/M01` — the tenant-config surface list and information architecture (M01-56/M01-57),
  business profile feeding the agent's script (M01-31), live-preview law (M01-30).
- `modules/M02` — the lead machine (R9, §M02.10) this module's surfaces defer to; the customer
  record's compliance fields the gate reads (M02-37); the capture flow and dedupe sheet
  inbound reuses (M02-10, UXG-02 — *Final review: was M02-50, the Unassigned-state row; M02-10 is
  the one-sheet/three-entry-points contract this line means*); the three-failed-attempts count
  (M02-43).
- `modules/M04` — booked visits for My Day's TODAY block and the agent's book-a-visit action.
- `modules/M06` — the on-share follow-up task and the proposal-unopened trigger surface
  (M06-55); the accepted version's value for Mark won.
- `modules/M12` — voice entitlement checks and the usage ledger the usage view reads
  (DOC16.gate.voice mechanics, Task 23); soft-block behaviour for halted tenants.
- `foundations/F5` — the acceptance surface (Accept on the link is the only acceptance);
  acceptance records attached at Won.
- `foundations/F6` — notification types registered by this module: `agent_escalation`,
  `follow_up_due`, number-provisioning status, the monthly performance summary push.
- `foundations/F8` — F8-06, F8-24, F8-30, F8-31, F8-35 as consumed laws.
- `foundations/F2`/`F3` — permission rows §F2.5-M07 and `F2.M01.configure-agent`; the
  language-set boundary (F3-29).

**Provides to others.**

- `modules/M13` — the agent-performance surfaces (§M07.11) it re-renders as dashboard tiles
  under D37; the My Day content contract (§M07.1); win/loss list feeds (§M07.12).
- `modules/M08` — the Mark-won act that creates the project (M07-62).
- `modules/M02` — call outcomes and agent activity as timeline entries; wrong-number flags;
  do-not-call and quiet-flag writes back to the customer record's fields.
- `modules/M12` — metered voice-minute events with per-call provenance (M07-37/M07-38).
- `modules/M03` — the compliance-gate mechanism and pack-ruleset pattern for any outbound
  messaging automation (F1-15's "voice AND messaging" ruleset — M03 consumes the same law).
- The suite — the reference-implementation discipline for telephony capabilities (M07-54).

## 5. Non-goals

- **No auto-training, no feedback pipeline to the language model — ever in v1** (R10). The
  knowledge base is the only behaviour input besides versioned config; every change to it is
  an explicit owner act.
- **No verbal deal acceptance.** The agent never accepts or confirms a deal in any
  configuration; acceptance is the customer tapping Accept on the link (C8 — `foundations/F5`).
  Product law, not a timeline deferral.
- **No porting or hosting of outbound caller identity.** BYO is inbound forwarding only
  (OD-7 as amended; ADR-0019) — the superseded hosted/ported-with-KYC flow is not built.
- **No advanced call-control beyond launch scope** — multi-level escalation beyond
  chains-as-data, conference bridging and the like are seams, not code (OD-7: "Launch builds
  launch scope only; advanced capabilities are seams, not code"; DOC14.voice-capabilities'
  live/degraded set is the launch line).
- **No tenant surface for number-honesty** (F8-06). The tenant shapes the agent's speech,
  never the provenance, tier or disclosure of a figure.
- **No compliance override.** No support action, admin flag or tenant setting bypasses the
  gate (F1-17); this module records the absence as a feature.
- **No cross-customer agent memory** (DOC08.agent-lead-scope) — the agent is scoped to the
  matched lead; no retrieval across customers, no tenant-wide conversational memory.
- **No new timers.** Every wake, sweep and suppression is R9's (`modules/M02`) or a D17
  trigger; this module invents none (R9's "no screen invents a new timer").

## 6. Open questions

Mirrored into `registers/open-questions.md`.

- **M07-Q1 (→ register Q30) — RESOLVED (owner ruling 2026-08-04, Q30).** The **three-lane
  calling law** now governs (F1-36(b)): inbound AI answering 24/7; unsolicited/promotional AI
  dials strictly 09:00–21:00 (statutory floor, no override); the requested-callback lane may
  dial outside the window only on an explicitly recorded, timestamped customer request —
  open-by-referencing-the-request, consent trail stored, single "stop" ends the lane,
  per-tenant enable/disable only (M07-33). Human reps get warning-then-proceed with
  "customer requested" context logged (M07-30). Activation caveat: operator-side consent
  registration (the market pack's registration scheme, `F1-38`-class) may gate lane-3
  activation — it rides the activation clocks.
- **M07-Q2 (→ register Q31) — RESOLVED (owner ruling 2026-08-04, Q31).** The queuing rep may
  cancel **their own** queued on-demand entries; the Owner may cancel anything; cancellations
  are logged to the lead timeline (M07-35; F2 §F2.5-M07 widened accordingly).
- **Q6 — decision recorded (owner ruling 2026-08-04).** The tiered disclosure law replaces
  the ≤30 s floor: natural opener with no proactive AI mention at IN launch; hard floors
  retained as product law; proactive disclosure is pack data with the TRAI auto-flip
  (M07-10, M07-24, M07-32; `F1-36`(d)).
- **Q21 — decision recorded (owner ruling 2026-08-04).** "Not interested" is the seventh Lost
  reason and carries the six-month suppression; the disqualify list is unchanged (M07-63;
  `M02-54`).
