# M03 · Marketing

Status: draft · Origin mix: `BRIEF`-dominant — this module exists because the owner's V2 brief
mandates it, not because v1 source specifies it. **Two `SRC` rows** carry the source facts that
survive into it unchanged — the inbound-voice channel (`M03-25`) and the capture-settings
"which channels are live" policy (`M03-29`); the competitive DESIGN-FOR verdict `CG-14` is cited
as the **pattern this module extends** to every channel rather than as a source claim about them
(`M03-18`, `BRIEF`); and **four `REC` rows** (`M03-16`, `M03-17`, `M03-37`, `M03-43`) are mirrored
in `registers/enhancements.md` ·
Depends on: `00-README.md`, `01-product-overview.md`, `02-personas.md`, `04-business-model.md`,
`foundations/F1-global-market-framework.md`, `foundations/F2-roles-and-permissions.md`,
`foundations/F3-localization.md`, `foundations/F4-data-integrity.md`,
`foundations/F7-design-language.md`, `foundations/F8-data-honesty.md`,
`modules/M01-onboarding-and-tenant-config.md`, `modules/M02-crm-and-leads.md`,
`modules/M07-sales-execution.md`, `_process/owner-brief-2026-08-03.md` §Marketing,
`_process/2026-08-03-v2-prd-design.md` §2 (DD2, DD4, DD5) and §11,
`registers/conflicts.md` rows 3 and 4

## 1. Purpose & scope

This module owns **demand generation**: the campaigns an EPC company runs across the channels its
customers actually use, the connections that make those channels the tenant's own, the enquiries
those campaigns produce, and the handover of every one of those enquiries into the sales pipeline.
Its authority is the owner's V2 brief, quoted in full in the on-disk attestation
(`_process/owner-brief-2026-08-03.md` §Marketing):

> "Design an integrated marketing module. Support lead generation and engagement across channels
> such as Email, WhatsApp, Facebook, Instagram, SMS. The platform should manage marketing
> campaigns, capture leads, and feed them into the sales pipeline. Existing voice AI follow-up
> capabilities from the source documentation should remain part of the product. Do not invent AI
> features beyond what is supported or clearly proposed; identify additional ideas separately as
> recommendations."

Everything below is either that sentence made specific (`BRIEF`), a source fact this module
inherits rather than invents (`SRC`), or a recommendation this suite is making and labelling as
one (`REC`). Nothing else is here.

**This module is the owner of two supersessions, and says so.**

V1's source corpus rules out, twice, capabilities the brief now requires. Both contradictions are
already recorded in `registers/conflicts.md` — **recorded, never silently resolved** (design spec
§3.5) — and both name **this module** as the owner of the superseding specification. The
resolving authority is not this document's opinion: it is design spec §2 **`DD2`**, *brief-driven
supersession* — "Items the V2 brief calls for (marketing incl. WhatsApp sending, field workforce,
HR) enter core scope."

**Supersession 1 — lead-capture channels (`registers/conflicts.md` row 3).** `D13` fixes the v1
lead sources at manual quick-add, file import and inbound call, and **defers** the website form
and inbound business-messaging; the overlay honors that deferral, leaving both as "later" cards
(`UXG-03`). The brief mandates capture "across channels such as Email, WhatsApp, Facebook,
Instagram, SMS". Under `DD2` the brief's channels enter core scope **here**, as `BRIEF` scope,
and `D13` continues to govern `modules/M02-crm-and-leads.md`, which specifies none of them
(`M02-17`) and states the hand-off explicitly. This module is where the superseding channel
specification lives (§M03.3, §M03.4).

**Supersession 2 — outbound sending (`registers/conflicts.md` row 4).** `D32` rules that there is
no business-messaging integration in v1: the product composes a document and a link for a person
to paste into their own messenger, and because it does not control the sending it tracks opens but
never delivery. The brief mandates campaign engagement across email, business messaging, social
and SMS — which is sending. Under `DD2` the **campaign sending capability** enters core scope
**here**, together with the delivery-state semantics that come with actually controlling a send
(§M03.3, §M03.6).

**The lane boundary — read this before citing anything in this module.**

The supersession in row 4 is **narrow, and its narrowness is load-bearing.** There are two
different lanes and this module owns exactly one of them:

- **The campaign lane (this module).** Marketing sends: an audience, a template, a schedule, a
  metered send on a channel the tenant has connected in its own name. The product sends. Delivery
  state exists to the extent the channel reports it (`M03-04`).
- **The transactional lane (owned product-wide, not by this module's campaign machinery).** The
  moments where a surface produces a message *about one deal, to one customer* — `modules/M06`'s
  share, `modules/M02`'s message action (`M02-33`), visit confirmation (`M02-47`) and no-show
  reminder (`M02-48`), `modules/M08`'s handover pack and payment requests, and
  `foundations/F5-customer-link.md`'s customer moments (`F5-14`, `F5-16`, `F5-48`) — **send
  automatically from the tenant's connected official channel under the transactional template
  class, with composed copy-paste as the no-channel fallback** (owner ruling 2026-08-04,
  register `Q33`; `M03-03` states the two-lane law). This module supplies the connection those
  sends ride; it never runs them through campaign machinery.

The distinction is not a technicality about who operates the send; it is the difference
between a marketing send the customer consented to receive from a brand and a one-to-one message
about the deal in front of them. They carry different consent regimes, different metering and
different honesty obligations, and this suite keeps them apart.

**What this module is explicitly not.**

It is not a second CRM: it holds no pipeline, owns no lead after triage, and runs no stage
machine — `modules/M02` owns all of that, and everything this module captures enters M02's inbox
through M02's dedupe sheet, unchanged. It is not an AI product: the voice-AI follow-up capability
the brief preserves is `modules/M07-sales-execution.md`'s, `SRC`, and is referenced here as a
channel surface, never restated (`M03-25`). It invents no AI beyond source and brief — the
brief forbids it in its own words, and the ideas that would have gone there are `REC` rows,
labelled as recommendations, mirrored in `registers/enhancements.md`. It is not a market-specific
document: every compliance rule it obeys is market-pack data read through
`foundations/F1-global-market-framework.md` (§5, §M03.6).

## 2. Personas & surfaces

| Persona (`02-personas.md`) | Relationship to this module |
|---|---|
| **Marketing** (`PS-35`, `PS-36`) | Primary. Builds, schedules, runs and reads campaigns; sees what they captured; hands those captures into the lead queue. Their home screen is live campaigns and what they captured (`PS-36`) — this module supplies its content. |
| **EPC Owner** | Owns the tenant's channel identities and every spend-adjacent setting (§M03.3, §M03.6); sees all campaigns, always (`F2-14`). In a small firm the Owner *is* the marketing team, and every surface here must work for a single person holding both presets. |
| **Sales Manager** | Consumer, not author: reads campaign results as pipeline input and triages what campaigns capture (`modules/M02` §M02.6). |
| **Sales Executive** | Never sees this module's authoring surfaces; meets its output as leads in the inbox with a source badge (`M02-13`, `M02-23`). |
| Every other preset | No grant here (§F2.5-M03). |

**Surfaces.** Campaign authoring — audience building, content, schedule review — is
**desktop-first and fully functional on mobile**, the same posture the source takes for the other
at-a-desk workflow in the suite (`UXG-01`, `F7-30`): the person composing a send to a thousand
customers is at a desk, and the product must not pretend otherwise, but nothing here is
web-only. Campaign **monitoring** — is it running, what has it captured, what did a channel say —
is mobile-first, because that is where the Marketing persona reads it (`PS-36`), and because the
same enquiries appear in the mobile triage queue the rest of the team lives in. Channel
connection is a settings-class surface and lives with `modules/M01`'s tenant configuration
pattern (`M01-58`), reached from here.

*Section removed 2026-08-07 by owner decision: the offline/sync capability was deleted.*

## 3. Feature areas

### M03.1 — Scope laws: the supersessions, the lane boundary, the no-invention rule

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M03-01 | **This module is the superseding specification for `D13`'s deferred capture channels.** Website forms, inbound business-messaging, social lead forms, email replies and SMS replies are lead-capture channels of this product, specified in §M03.3 and §M03.4. `D13` is not overturned as a reading of v1 — it continues to govern `modules/M02`, which specifies none of these channels (`M02-17`) — it is superseded **as scope**, by the brief, under design spec §2 `DD2`. The contradiction is recorded at `registers/conflicts.md` **row 3** and is not re-resolved here. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing ("capture leads … across channels such as Email, WhatsApp, Facebook, Instagram, SMS"); authority `_process/2026-08-03-v2-prd-design.md` §2 `DD2` + §11; supersedes `SRC` `D13` (v1 lead sources; docs/15 HONORED — "later" cards, `UXG-03`), recorded at `registers/conflicts.md` row 3 | P0 |
| M03-02 | **This module is the superseding specification for `D32`'s no-sending rule, in the campaign lane only.** The product sends marketing messages on the tenant's behalf, from channel identities the tenant owns (§M03.3), metered per send (§M03.6). `D32` is superseded **as scope for campaigns**, by the brief, under `DD2`; the contradiction is recorded at `registers/conflicts.md` **row 4** and is not re-resolved here. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing ("engagement across channels…", "manage marketing campaigns"); authority `_process/2026-08-03-v2-prd-design.md` §2 `DD2` + §11; supersedes `SRC` `D32` (no business-messaging integration in v1; docs/15 HONORED), recorded at `registers/conflicts.md` row 4 | P0 |
| M03-03 | **Two lanes, both real (owner ruling 2026-08-04, Q33).** The **campaign lane** is unchanged: this module's promotional sending, metered and consent-gated as specified here. The **transactional lane now exists product-wide**: the one-to-one customer moments the v1 source held composed-not-sent — `modules/M06`'s proposal share, `modules/M02`'s message action (`M02-33`), visit confirmation (`M02-47`) and no-show reminder (`M02-48`), `modules/M08`'s handover pack, and `foundations/F5`'s customer moments (`F5-14`, `F5-16`, `F5-48`) — **send automatically from the tenant's connected official channel** (the same connection §M03.3 establishes), under the **utility/transactional template class the pack's rules define**, distinct from the marketing lane's consent and metering; **copy-paste composition is the fallback** wherever no channel is connected, and on that path no delivery is claimed. `D32`'s manual-only rule is fully retired (`registers/conflicts.md` rows 4 and 8 carry the resolution notes). The campaign lane never carries a transactional moment, and a transactional send never burns the marketing meter. | `BRIEF` — the boundary this module's supersession implies; transactional lane per owner ruling 2026-08-04 (Q33), superseding `SRC` `D32`'s manual rule; template-class per pack rules (`F1-15`/`F1-38` consumed) | P0 |
| M03-04 | **Because this module controls the sending, it reports send state — and only what the channel actually tells it.** A campaign send carries a per-recipient state drawn from the channel's own reporting: queued · sent · delivered · failed (with the channel's reason) · opted-out-before-send. Where a channel does not report a state, the product shows **"not reported by this channel"** and never a zero, a blank that reads as success, or an inferred delivery. Opens and clicks are the link's own events, never a delivery claim (`F5-28`, `F5-29` consumed — the customer-link surface has no delivered state and this module does not give it one). | `BRIEF` — the delivery-state semantics `registers/conflicts.md` row 4 assigns to this module · honesty obligations consumed from `F8-34` (honest state), `F8-36` (honest failure), `F8-12`; channel-capability rule at `M03-26` | P0 |
| M03-05 | **No AI feature is invented here.** The brief's instruction is carried as a law of this module: *"Do not invent AI features beyond what is supported or clearly proposed; identify additional ideas separately as recommendations."* The voice-AI follow-up capability the brief preserves is `modules/M07`'s and is `SRC` (`M03-25`). Any marketing-side automation or generation beyond the brief's sentence appears **only** as a `REC` row (`M03-16`, `M03-17`, `M03-37`, `M03-43`), tagged as a recommendation and mirrored in `registers/enhancements.md` — never as core scope, never phrased as though the corpus or the brief asked for it. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing (quoted); tagging law `00-README.md` §Tag vocabulary + design spec §5, §11 ("marketing-side AI beyond source/brief is `REC`-only") | P0 |
| M03-06 | **Every compliance rule this module obeys is market-pack data, and this document restates no market's rules.** Template/sender registration duties, consent and do-not-disturb classes, opt-out semantics and their honoring deadline, and any messaging send window are read from `pack.calling-rules`, whose communications-compliance ruleset covers **voice and messaging** and names marketing surfaces as a consumer (`F1-15` consumed). Packs are platform-authored and never tenant-editable; a tenant configures within the floor, never around it (`F1-12`). The launch market's own registration scheme is `F1-38` — **named as a pack instance and never restated**: a market's scheme, sender class, window or consent class may be *pointed at* by its pack key (as `M03-22` and `M03-39` do), and its content stays in the pack for the reader who needs it. | `BRIEF` — module-level obligation; ruleset consumed from `SRC` `F1-15` / `F1-12` / `F1-38` (`foundations/F1`, Task 6, which names `modules/M03` as a consumer); market-neutrality law per design spec §6 | P0 |
| M03-07 | **Nothing this module captures becomes a second pipeline.** Every enquiry it produces is handed to `modules/M02` — into the same unassigned inbox, through the same dedupe sheet, with its own source badge — and this module holds no stage, no owner, no qualification and no close state. What it keeps is the campaign-side record: which campaign captured the enquiry, on which channel, and when (§M03.4). | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing ("feed them into the sales pipeline"); reciprocates `M02-17`'s guarantee and `M02-23`/`M02-10`; module boundary per design spec §11 | P0 |

**Behavior detail.** These seven rows are the module's constitution and every later row is read
against them. Two of them exist because the suite's own registers say they must: `M03-01` and
`M03-02` are the "superseding specification" that `registers/conflicts.md` rows 3 and 4 each name
this module as owning, and without them the register would point at a document that never made
the claim. `M03-03` is the row that keeps the two lanes distinct: the owner's 2026-08-04 ruling
(Q33) made the transactional lane real — proposal links, payment links and status updates send
automatically from the tenant's connected channel under the transactional template class, with
copy-paste as the no-channel fallback — while the campaign lane keeps its own consent, metering
and template rules; neither lane borrows the other's. `M03-04` is what the supersession *costs* — controlling the
send means owning the truth about what happened to it, including the truth that a given channel
tells you nothing. `M03-05` is the brief's own sentence, kept as a rule rather than a preamble, so
that a reader who finds a generative feature in this module can check its tag and find `REC`.

Permissions: none of these rows is a capability; they constrain every capability in §F2.5-M03.

**Edge cases & what-goes-wrong.**

- *A reader cites this module to justify sending a proposal automatically* → now correct in the
  transactional lane: the proposal link sends from the tenant's connected channel under the
  transactional template class (`M03-03`, owner ruling 2026-08-04 Q33; `modules/M06` owns the
  surface) — but never through campaign machinery, and copy-paste remains the no-channel
  fallback.
- *A channel reports nothing about a send* → the send shows "not reported by this channel", never
  a green tick (`M03-04`).
- *A market pack has no messaging ruleset* → the channels that need one cannot be activated for
  that market's tenants; absence is a disable, not a permissive default (`F1-12`, `F1-16`'s
  posture applied to messaging via `F1-15`; see `M03-46`).
- *Someone asks for "AI subject lines" in the next release* → it exists here already, as
  `M03-43`, tagged `REC`, with its rationale in `registers/enhancements.md` — which is the whole
  point of the tag.

**Acceptance criteria.**

- Given `registers/conflicts.md` row 3 or row 4, when a reader follows its "owner of the
  superseding specification" pointer, then this document states the supersession explicitly, names
  `DD2` as the authority, and names the superseded `D`-decision (`M03-01`, `M03-02`).
- Given any transactional surface listed in `M03-03`, when it produces a customer message with a
  connected channel present, then the message sends from the tenant's official channel under the
  transactional template class with honest delivery states; and given no connected channel, then
  it composes for copy-paste and claims no delivery (`M03-03`, owner ruling 2026-08-04 Q33).
- Given a send on a channel that reports no delivery state, when the campaign's per-recipient
  results render, then the state reads "not reported by this channel" and no delivery is implied
  (`M03-04`).
- Given any requirement in this module that proposes generation or automation beyond the brief's
  sentence, when its tag is read, then it is `REC` and it appears in `registers/enhancements.md`
  (`M03-05`).
- Given any compliance behaviour in this module, when its source is traced, then it resolves to a
  `pack.calling-rules` key and not to a rule written in this document (`M03-06`).
- Given an enquiry captured by any channel here, when it is created, then it exists in
  `modules/M02`'s unassigned inbox and nowhere else as a pipeline record (`M03-07`).

**Localization notes.** The lane vocabulary a user sees — "campaign", "audience", "channel",
"send" — is product vocabulary translated per `F3-01`, one term per concept in every launch
locale (`F3-11`). **Analytics events:** none for this area; it defines laws, not acts.

### M03.2 — Campaign management

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M03-08 | **A campaign is one named object with six parts: a channel, an audience, content, a schedule, an owner and a state.** It is created, edited while draft, scheduled, run, paused, completed or cancelled — and it is never deleted once it has sent anything, because what it sent is part of the tenant's compliance record. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing ("The platform should manage marketing campaigns"); archive-never-delete posture carried from the suite's record laws (`R9`/`DOC04.merge-tombstone` family, cited — no v1 campaign object exists to derive from) | P0 |
| M03-09 | **The campaign state set is closed and each state says what is true:** `draft` (nothing sent, freely editable) · `scheduled` (audience resolved, waiting for its time) · `sending` (in progress, with a running count) · `paused` (stopped mid-run by a person or by the product, resumable) · `completed` (the run finished, with its own honest partial-completion report) · `cancelled` (stopped and not resumable). There is no seventh state and no state that means "we are not sure". | `BRIEF` — state vocabulary for a brief-scoped object; honest-state law consumed from `F8-34`, partial-completion honesty from `F8-36` | P0 |
| M03-10 | **An audience is built from CRM segments — and the Marketing preset holds the audience-builder capability over the whole base, aggregate-only (owner ruling 2026-08-04, Q37: segments-yes-files-no).** The filter vocabulary is the CRM's own: lead source, stage, qualification facts, city/market, campaign history, customer-vs-lead, and the consent state the channel requires. **Audience building resolves over the tenant's full lead base for any holder of `F2.M03.build-campaign-audience`** — filters, counts and send-selection across all records — while **individual lead-file access is unchanged**: no lead file, value, note or timeline opens through the builder, and the Marketing preset's lead visibility stays *Own captures until triage* for record-level reads (`F2-12`–`F2-15` stand for files; the audience-builder capability is a distinct aggregate-only scope, recorded in F2's M03 matrix). A Marketing-only holder therefore campaigns to the whole base without ever reading a lead file they do not own. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing (campaigns over the customer base) · aggregate-only audience scope per owner ruling 2026-08-04 (Q37), replacing the former own-scope-only conservative reading; record-read law `D20` via `F2-12`–`F2-14` unchanged | P0 |
| M03-11 | **An audience is resolved to a count, with its exclusions itemised, before a campaign can be scheduled.** The pre-schedule summary states: records matched · excluded for missing channel address · excluded for no consent on this channel · excluded as suppressed (opted out, complained, previously undeliverable — `M03-47`) · **records that will actually be sent to**. A campaign cannot be scheduled from an unresolved audience, and the count is re-resolved at send time (`M03-14`). | `BRIEF` — the honest-count obligation a send implies; modelled on the suite's existing pre-action count discipline (`M02-19`'s "N rows · M duplicates" preview, cited as the pattern) · honesty law `F8-33`/`F8-36` | P0 |
| M03-12 | **A campaign is scheduled to send now or at a stated time, in the tenant's timezone, and the time is shown with the timezone named.** Scheduling is a single send moment per campaign; there is no recurring schedule and no campaign calendar in this release (§5). Where the market's pack declares a messaging send window, a scheduled time outside it is refused at scheduling with the window named — never silently shifted (`M03-48`). | `BRIEF` — brief-scoped scheduling; tenant timezone consumed from `F1-10`, rendering from `F3-22`; window from `pack.calling-rules` per `F1-15` | P0 |
| M03-13 | **Editing rules follow what has already left the building.** A `draft` campaign is fully editable. A `scheduled` campaign may be edited, which returns it to `draft` and requires re-scheduling — the audience is re-resolved. A `sending` campaign may be **paused or cancelled only**; its content and audience are frozen. Nothing already sent is ever un-sent, and the product never implies it can recall a message. | `BRIEF` — derived from the send's irreversibility; honest-irreversibility posture carried from the suite's irreversible-with-confirm pattern (`UXG-05`/`M02-63`, cited as the pattern) | P0 |
| M03-14 | **The audience is re-resolved at send time and the difference is reported.** Between scheduling and sending, records change: someone opts out, a lead is disqualified, a number is corrected. The send uses the audience as it is at the moment of sending, and the campaign's report states the delta from the scheduled count with the reasons grouped (opted out since · newly suppressed · no longer matches the filter · newly matches the filter). Silent drift is the failure this row exists to prevent. | `BRIEF` — consent-currency obligation implied by `F1-15`'s data-freshness duty (consumed); honest-reporting law `F8-36` | P0 |
| M03-15 | **A test send goes to a person, not to the audience.** Before scheduling, the author sends the composed content to a recipient they nominate on a connected channel, to see exactly what a recipient sees — personalisation tokens resolved against a sample record (`M03-41`). Test sends burn the same meter as real sends (`M03-44`) and say so before they are sent. | `BRIEF` — authoring safety for a send the tenant cannot recall; metering per `BM-21` consumed | P1 |
| M03-16 | **Multi-step nurture sequences — recommended enhancement, not v1 scope.** A campaign in this release is one audience, one content, one send moment (`M03-12`). A sequence — several steps with waits and branch-on-response between them — is the obvious next ask and is **recommended**, not specified: it would need its own suppression, consent-recheck and metering semantics at every step, and the brief asks for campaigns rather than journeys. Mirrored in `registers/enhancements.md`; rationale there. | `REC` — this suite's recommendation; explicitly **not** in `_process/owner-brief-2026-08-03.md` §Marketing (which names campaigns, capture and pipeline hand-off) | P2 |
| M03-17 | **Split (A/B) testing of campaign content — recommended enhancement, not v1 scope.** Sending two content variants to slices of one audience and reporting the difference is standard in the category and is **recommended**; it is not in the brief, and it interacts with this module's correlation-only reporting law (`M03-53`) — a variant comparison is still correlation, and would need to say so. Mirrored in `registers/enhancements.md`; rationale there. | `REC` — this suite's recommendation; not in the brief; interacts with `F8-30` consumed at `M03-53` | P2 |

**Behavior detail.** A campaign is created from the campaign list with a channel chosen first,
because the channel decides everything downstream: which content editor opens, which consent class
the audience is filtered against, whether a registered template is required (`M03-39`), and
whether the send is metered by this product or settles with an ad network (`M03-51`). The audience
step is a filter builder over the CRM, showing the running count as filters are added and the
exclusion breakdown of `M03-11` beneath it. The builder works in **counts, not in a browsable list
of people** — sizing an audience is not a reason to page through customer records — and per the
owner's 2026-08-04 ruling (Q37) it resolves over the **whole lead base for any holder of the
audience-builder capability**, aggregate-only: segments, counts and send-selection, never an
individual lead file, value or note. Record-level reads keep their own visibility law unchanged
(`F2-12`–`F2-15`); a Marketing-only holder sizes and sends base-wide without ever opening a
record they could not otherwise read (`M03-10`). The content step is §M03.5. The review step is
where `M03-11`'s summary and `M03-44`'s meter projection sit side by side, because those are the
two numbers a person needs before committing: how many people, and what it costs.

A paused campaign shows why it paused — a person, an exhausted allowance (`M03-45`), a
disconnected channel (`M03-28`), or a billing state (`BM-35`) — and what resuming would do. A
completed campaign's report is permanent: it is the tenant's own record of what was sent to whom
under which consent, and it survives the campaign's archival.

Permissions: `F2.M03.manage-campaigns` (EPC Owner · Marketing) creates, schedules, pauses and
cancels; `F2.M03.build-campaign-audience` resolves the audience over the whole base,
aggregate-only — segments and counts, no record reads (owner ruling 2026-08-04, Q37);
spend-adjacent choices — anything that would send beyond the included allowance — additionally
require `F2.M03.approve-campaign-spend` (EPC Owner), per `M03-45`.

**Edge cases & what-goes-wrong.**

- *The audience resolves to zero* → the campaign cannot be scheduled and the summary says which
  exclusion removed everyone, so the author can fix the filter rather than guess (`M03-11`).
- *The audience shrinks between scheduling and sending* → the send proceeds against the current
  audience and the report states the delta with reasons (`M03-14`).
- *Someone edits a scheduled campaign an hour before it runs* → it returns to `draft`, its
  schedule is cleared, and it does not send until re-scheduled (`M03-13`).
- *A person tries to cancel a campaign mid-send* → allowed; already-sent messages are already
  gone, the report says how many, and nothing claims a recall (`M03-13`).
- *A campaign is scheduled and the tenant enters `past_due` day 4 before it runs* → metered sends
  are paused by the billing state (`BM-35` consumed); the campaign holds at `paused` with the
  billing reason named and the pay/upgrade route offered (`BM-32`).
- *The scheduled time falls outside the market's messaging window* → refused at scheduling with the
  window named (`M03-12`, `M03-48`).
- *A tenant with one person* → the same person holds EPC Owner and Marketing; every approval this
  area names still records who approved, and the product does not pretend two people were involved
  (the same posture `F2-04` takes for design sign-off).

**Acceptance criteria.**

- Given a campaign in any state, when it is read, then its state is one of the six of `M03-09`
  and the surface states what that state means for editing and sending (`M03-08`, `M03-09`).
- Given an audience builder used by any holder of the capability — including a Marketing-only
  holder — when filters are applied, then counts resolve over the whole lead base, and no
  individual lead file, value or note is readable through the builder (`M03-10`, owner ruling
  2026-08-04 Q37).
- Given an audience, when the campaign reaches its review step, then matched, each exclusion
  reason, and the number that will actually be sent to are all stated before scheduling is
  possible (`M03-11`).
- Given a scheduled campaign, when it is edited, then it returns to `draft` and cannot send until
  re-scheduled and re-resolved (`M03-13`, `M03-14`).
- Given a campaign whose audience changed between scheduling and sending, when the report renders,
  then the delta from the scheduled count is stated with reasons grouped (`M03-14`).
- Given a scheduled send time outside the market's declared messaging window, when scheduling is
  attempted, then it is refused with the window named and nothing is silently moved (`M03-12`).

**Localization notes.** Campaign state names, filter labels and the exclusion-reason vocabulary are
translated per `F3-01`; the campaign's own name and the content it sends are tenant data and are
never translated (`F3-08`) — the content's per-language versions are `M03-38`'s. Scheduled times
render through the shared date implementation on the tenant's timezone (`F3-22`).
**Analytics events:** campaign created (channel) · audience resolved (matched, excluded by reason)
· campaign scheduled · campaign started · campaign paused (reason) · campaign completed (sent,
failed, delta) · campaign cancelled · test send.

### M03.3 — Channels & connections

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M03-18 | **Every channel is a tenant-owned identity the tenant connects — the platform never sends from an identity of its own.** The tenant's own sender address, number, page or account is what a recipient sees; the tenant owns the identity, its registration and its **reputation**, and keeps it if they leave. The competitive verdict this generalises states it for business messaging in exactly those terms — *"BYO-WABA … (tenant owns the number and reputation)"* — and this module applies the same capability frame to **every** channel: connect an identity you own, in your name, revocable by you. The mechanics of any one provider's connection flow are implementation, not product (§14 of the design spec); vendor names appear only as the identity a channel *is* (a business-messaging account, a social page), never as a required integration path. | `BRIEF` — the capability frame for this module's brief-scoped channels (`_process/owner-brief-2026-08-03.md` §Marketing), **extended from a source pattern rather than derived from one**: `SRC` `CG-14`'s DESIGN-FOR verdict states the law for business messaging only — *"v2 = BYO-WABA via Meta Embedded Signup (tenant owns the number and reputation)"* — and this row generalises it to **every** channel, which is this module's extension and not the ledger's claim (same extension pattern as `M03-11`, `M03-19`, `M03-27`, `M03-46`, `M03-47`). `CG-14`'s business-messaging half is consumed as written at `M03-21`; its v1 `D32`/port half is `modules/M06`'s (`M06-53`). **The signup mechanism the verdict names is the ledger's reference implementation, quoted for fidelity of the pointer — it is not a requirement of this module**, and no connection mechanics appear in the requirement text · generalisation stated per design spec §6 (vendor → capability) | P0 |
| M03-19 | **A channel connection has an honest state and is never advertised before it exists:** `not connected` · `connecting` · `connected` · `action needed` (registration pending or rejected, credential expired, permission revoked at the provider) · `disconnected`. A channel the tenant has not connected is shown as connectable, with what connecting requires — never as a working feature. A channel this market's pack cannot support is shown as unavailable **for this market**, with that reason. **Form-bearing channels have one more connectability condition (owner ruling 2026-08-04, Q35):** a lead-capture form without a required phone field **cannot be connected** — the connection flow refuses it and names the missing field (`M03-33`). | `BRIEF` — the connection state machine for brief-scoped channels · obeying, unchanged, the honesty rule `SRC` `UXG-03` fixes for lead sources (*"the screen must distinguish live channels from not-yet channels rather than advertise them"*) and `M01-58`/`M02-65` state as product law; `UXG-03`'s own disposition stays with Tasks 12/13 and is not re-claimed here; connection-state honesty per `F8-34`; phone-field condition per owner ruling 2026-08-04 (Q35) | P0 |
| M03-20 | **Email is a channel: the tenant connects a sending identity it controls, and campaigns send from it.** The identity is the tenant's own address and domain; the product requires whatever proof of control the channel demands before the first send, and shows that requirement as an `action needed` state rather than failing at send time. Unsubscribe handling is mandatory on every campaign email and feeds the suppression list (`M03-47`). | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing (Email named); identity ownership per `M03-18`; opt-out duty per `pack.calling-rules` messaging rules (`F1-15` consumed) | P0 |
| M03-21 | **Business messaging (WhatsApp) is a channel: the tenant connects its own business number, owns its reputation, and campaigns send from it.** Sending requires a template registered with the channel and approved (`M03-39`); the pack declares the registration duty and the consent class (`F1-15`; IN instance `F1-38`). This is the capability `D32` withheld from v1 and `registers/conflicts.md` row 4 assigns here — **for campaigns**; the transactional lane is unchanged (`M03-03`). | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing (WhatsApp named) · pattern and tenant-ownership from `SRC` `CG-14` (`M03-18`); supersession recorded at `registers/conflicts.md` row 4 | P0 |
| M03-22 | **SMS is a channel: the tenant connects its own sender identity and campaigns send from it.** Where the market requires registered sender headers and templates, that registration gates **activation, not scope** — the capability exists and the channel activates when the registration clears (`F1-38`'s activation-clock law consumed; the India DLT instance is the reference case and its content stays in the pack). | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing (SMS named); registration duty and activation-clock law from `SRC` `F1-38` / `F1-15` (consumed, not restated) | P0 |
| M03-23 | **Facebook and Instagram are channels in two distinct senses, and the product keeps them apart:** (a) the tenant connects its own page/account as an **identity**, and (b) that identity's **lead forms** deliver enquiries into capture (§M03.4) — and only forms with a **required phone field** are connectable (owner ruling 2026-08-04, Q35; `M03-19`/`M03-33`). Campaign *spend* on a social network settles **tenant-direct with the network** — the product neither holds the budget nor bills for those sends, and says so on the surface (`BM-21`'s explicit boundary: "channels where spend settles tenant-direct with the ad network … are not platform meters"). What the product owns is the connection, the capture, the attribution and the reporting. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing (Facebook, Instagram named); metering boundary consumed from `SRC`/`BRIEF` `BM-21` (`04-business-model.md`) | P0 |
| M03-24 | **The website form is a channel: a tenant-embeddable enquiry form whose submissions land as leads.** This is the channel `D13` deferred and `UXG-03` rendered as a "later" card; under `DD2` it is live here (`M03-01`). The form collects the fields the CRM's capture requires — **the phone field is present and required on every embed** (owner ruling 2026-08-04, Q35; `M02-03`'s phone-as-identity rule) — carries the tenant's branding (`F7-07`), renders in the visitor's language from the tenant's authored versions (`M03-38`), and is **capture-only — it sends nothing**. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing (lead capture across channels); supersedes `SRC` `D13`/`S2.rule.channel.4` (website form deferred) per `registers/conflicts.md` row 3; phone-required per owner ruling 2026-08-04 (Q35) | P0 |
| M03-25 | **Inbound voice remains a live capture channel and stays entirely `modules/M07`'s.** The brief preserves it — *"Existing voice AI follow-up capabilities from the source documentation should remain part of the product"* — and this module specifies nothing about it: the agent's behaviour, its number, its compliance gate, its call ledger and its capture flow are `modules/M07`'s (`M07-47`, `M07-48`, `M07-27`), and the lead it creates is `modules/M02`'s (`M02-14`). It appears in this module's channel picture so the marketing view of "which channels are live" is complete, and campaign reporting may show enquiries that arrived by voice — attributed, never claimed as a campaign send. | `SRC` — `D13` (inbound call via voice agent is a live v1 lead source); `S2.rule.channel.2` (cited — `modules/M02` owns capture, `modules/M07` the agent); brief-preservation clause `_process/owner-brief-2026-08-03.md` §Marketing (voice AI follow-up remains) | P0 |
| M03-26 | **Each channel declares what it can report, and the product renders only that.** Per channel the product knows whether it can report acceptance by the channel, delivery, read state, click state and failure reason — and every campaign surface renders exactly the columns that channel supports. A channel that cannot report delivery shows no delivery column at all rather than an empty one, and the surface says which states this channel does not report. | `BRIEF` — the reporting half of `M03-04`; honest-degradation pattern consumed from `F8-35` (capability-conditional features degrade honestly, stated not hidden — the same law `modules/M07` applies to telephony capability at `M07-49`) | P0 |
| M03-27 | **A channel is disconnected by the tenant, at will, and disconnection is honest about consequences.** Disconnecting stops new sends and new captures on that channel immediately; it never deletes what the channel already captured, never alters a lead's source badge, and never rewrites a completed campaign's report. The confirmation names what will stop and what will remain. | `BRIEF` — the connection half of the toggle semantics `M02-64` fixes for capture channels ("a toggle governs new capture only … the source badge on existing leads survives the toggle"), applied to connections · archive-never-delete posture per `R9` family (cited) | P0 |
| M03-28 | **A channel that breaks mid-campaign pauses the campaign and says so.** Credential expiry, revoked permission at the provider, or a channel-side rejection moves the connection to `action needed` (`M03-19`), pauses every `sending` campaign on it at `paused` with that reason (`M03-09`), and notifies the campaign owner and the EPC Owner. Sends already made stay made; sends not yet made are not silently dropped — they wait, and the report states how many are waiting. | `BRIEF` — derived from `M03-19`'s state set and `M03-09`'s pause state; honest-failure law `F8-36`; the credential-probe pattern and its honest surfacing carried from `M01-58`'s settings behaviour (cited) · notification types register with `foundations/F6-notifications-and-search.md` | P0 |
| M03-29 | **One channel-health surface answers "can we reach our customers right now?"** Every channel with its connection state, its registration state where the pack requires one, its remaining metered allowance (`M03-44`), and the campaigns currently depending on it. It is the surface the Marketing persona checks before scheduling anything and the EPC Owner checks when something looks wrong. | `SRC` — `TC.lead-sources.1` (journey L1249, *"Lead sources: which channels are live"* — the **`modules/M03` half**: this module's channels answering that question; the settings surface is `M01-58`'s and the v1 channel set and toggle semantics are `M02-64`/`M02-65`'s) · the metered-allowance and registration-state columns are this module's addition, consuming `BM-21` and `F1-15`; persona need at `PS-35`/`PS-36` | P1 |

**Behavior detail.** Connection is a settings-class act with a single shape across channels, so a
tenant learns it once: choose the channel → see what connecting requires (an identity you control,
whatever proof the channel demands, and where relevant a registration whose clock is the channel's,
not ours) → connect → the state machine of `M03-19` takes over. The product stores whatever
credential the connection produces under `modules/M01`'s credential discipline (`M01`'s tenant
settings: at most last-4/masked display, every decrypt audited per `F2-22`) and never displays a
secret back to a user.

The **market gate** matters here and is not a detail: a channel whose compliance ruleset the
market pack does not supply cannot be activated in that market (`M03-06`, `F1-12`) — the pack's
absence is a disable, exactly as `F1-16` makes a missing voice ruleset a hard disable of outbound
voice. That is why `M03-19` has an "unavailable for this market" presentation: the honest answer is
neither "connect" nor silence.

**Social is where a reader is most likely to over-read this module.** The product connects the
identity, receives the lead forms, attributes the captures and reports them. It does not create
ads, does not hold or spend a budget, and does not bill for social sends — that money is between
the tenant and the network (`M03-23`, `BM-21`). A surface that showed a "spend" number the product
does not control would be exactly the kind of unearned claim `foundations/F8` exists to prevent.

Permissions: `F2.M03.manage-channel-connections` (EPC Owner only) connects, reconnects and
disconnects — the same posture `F2.M01.manage-tenant-settings` takes for integration credentials,
and for the same reason: a channel identity is the tenant's own name and reputation (`M03-18`).
Marketing reads channel state (`F2.M03.campaign-visibility`) and cannot connect or disconnect.

**Edge cases & what-goes-wrong.**

- *A credential expires or is revoked at the provider* → `action needed`, campaigns on that
  channel pause with the reason, the EPC Owner is notified (`M03-19`, `M03-28`).
- *A template registration is rejected by the channel* → the channel stays connected, the template
  is unusable and says why, and campaigns depending on it cannot be scheduled (`M03-39`).
- *A tenant disconnects a channel that captured 200 leads* → those leads are untouched and keep
  their source badge; only new capture stops (`M03-27`, mirroring `M02-64`).
- *A channel is connected but the market pack has no messaging ruleset* → the connection cannot be
  activated for sending in that market and the surface says so, rather than failing at send time
  (`M03-06`, `M03-19`).
- *Two campaigns share one channel and one exhausts the allowance* → the allowance is the
  channel's, not the campaign's; the second campaign pauses on exhaustion with the same honest
  reason (`M03-45`).
- *A social page's permission is revoked while a lead form is live* → capture stops, the form's
  own submissions already received are kept, and the channel shows `action needed` (`M03-28`).

**Acceptance criteria.**

- Given any channel, when its connection is read, then it names a tenant-owned identity and the
  product sends from no identity of its own (`M03-18`).
- Given a channel the tenant has not connected, when the channel list renders, then it shows as
  connectable with its requirements — never as a working channel (`M03-19`).
- Given the email channel, when a campaign sends on it, then it sends from the tenant's own
  proven sending identity and every message carries an opt-out affordance that feeds the
  suppression list (`M03-20`, `M03-47`).
- Given the SMS channel in a market whose pack requires registered sender identities and
  templates, when that registration has not cleared, then the channel exists and is inactive with
  its registration state named — the capability is never withheld from scope (`M03-22`).
- Given the website form, when a visitor submits it, then a lead is created through the same
  capture path as every other channel and the form itself sends nothing to anyone (`M03-24`).
- Given the channel list, when it renders, then inbound voice appears as a live capture channel
  whose agent, number and call record are `modules/M07`'s, and nothing in this module restates or
  alters them (`M03-25`).
- Given a market whose pack supplies no messaging ruleset, when a messaging channel is opened,
  then it renders as unavailable for that market with the reason, and no send is possible
  (`M03-06`, `M03-19`).
- Given a connected business-messaging channel with no approved template, when a campaign on it is
  scheduled, then scheduling is refused and the registration state is named (`M03-21`, `M03-39`).
- Given a social channel, when its campaign surface renders, then no platform meter and no spend
  figure the product does not control is shown (`M03-23`).
- Given a channel that cannot report delivery, when campaign results render, then no delivery
  column exists and the surface states that this channel does not report it (`M03-26`).
- Given a disconnected channel, when leads it previously captured are opened, then they are intact
  with their original source badge (`M03-27`).
- Given a channel that breaks mid-send, when the break is detected, then the campaign pauses with
  that reason, the owner is notified, and unsent messages are reported as waiting rather than
  dropped (`M03-28`).
- Given the channel-health surface, when it renders, then every channel's connection state,
  registration state and remaining allowance are visible in one place (`M03-29`).

**Localization notes.** Channel names are proper nouns and are never translated (`F3-08`);
connection states, requirement copy and the "unavailable in this market" explanation are
translated per `F3-01`. The website form renders in the visitor's language from the tenant's
authored versions, never machine-translated (`F3-10`, `M03-38`). **Analytics events:** channel
connect started / completed / failed (reason class) · channel state changed (old → new) ·
disconnect (with campaigns affected) · registration state changed. Credential lifecycle events are
audit entries, not analytics (`F2-22`).

### M03.4 — Lead capture & attribution

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M03-30 | **Everything this module captures enters `modules/M02` — the same unassigned inbox, the same dedupe sheet, unchanged.** This is the reciprocal of the guarantee M02 already makes (`M02-17`: "whatever M03 lands arrives in this module's inbox (`M02-23`), carries its own source badge, and passes through this module's dedupe sheet (`M02-10`) unchanged"). This module creates no lead list of its own, no parallel queue, and no capture that bypasses the sheet. Captured leads land **unassigned** (`M02-50`) so triage is unchanged by volume. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Marketing ("capture leads, and feed them into the sales pipeline"); contract reciprocated with `M02-17`, `M02-23`, `M02-10`, `M02-50` (consumed) | P0 |
| M03-31 | **Every captured lead carries its channel as its source, and its campaign as an attribute of the capture.** The source badge is the channel (`website form`, `business messaging`, `email`, `SMS`, `social lead form`), rendered wherever a lead is listed exactly as the v1 sources are (`M02-13`). The **campaign** that produced the capture is recorded on the lead's capture record and its timeline — one campaign, the one whose link or form or reply produced this enquiry — and is never presented as a multi-touch attribution model (`M02`'s non-goal is respected: what exists is where the enquiry came from, not a model of influence). | `BRIEF` — brief-scoped channels needing source identity; badge law consumed from `SRC` `M02-13`/`S2.screen.2`; single-source discipline consistent with `modules/M02` §5 ("no campaign attribution … the attribution question is its scope decision") | P0 |
| M03-32 | **Phone-identity dedupe is preserved: a capture that carries a phone number meets the dedupe sheet before anything is created, exactly as a typed capture does.** The sheet, its three facts and its three choices are `modules/M02`'s (`M02-08`–`M02-12`) and this module adds no fourth choice and no channel-specific duplicate dialog (`modules/M02` §5: "no second dedupe vocabulary"). For a **system-created** capture with no person at the keyboard to choose, the conservative resolution applies: the enquiry is logged on the existing lead (`M02-11`'s "log enquiry on existing" outcome) rather than creating a second record, the existing owner is notified, and nothing about the existing lead's stage or owner changes. | `BRIEF` — the M03 side of the dedupe contract; sheet, choices and outcomes consumed from `SRC` `UXG-02` / `M02-08`–`M02-12` / `M02-10` ("one sheet, three entry points" — this module adds entry points, not vocabulary) · the system-actor resolution is the conservative reading, stated in-row, consistent with `M02-14`'s system-created capture landing unassigned | P0 |
| M03-33 | **Every connectable lead-capture form requires the phone field — phone-as-identity is unbroken (owner ruling 2026-08-04, Q35).** The phone number is **mandatory on every lead-capture form this module connects** — website form, Facebook/Instagram lead forms, and any form-bearing channel — and **a form without a required phone field cannot be connected** (the connection flow refuses it, naming the reason). Every form capture therefore arrives with a phone and meets the dedupe sheet normally (`M03-32`); the formerly specified "unverified identity — no phone" incomplete-lead path is **not built**. Channel *replies* on an already-sent campaign (email/SMS) attribute to the recipient record they answer, which carries its phone. The owner chose data integrity over form-fill rate — deliberately, against the standing recommendation. | `BRIEF` — the brief's channel list against the source's identity model; phone-required rule per owner ruling 2026-08-04 (Q35); `M02-03` / `M02-13` consumed | P0 |
| M03-34 | **The consent ledger: per contact, per channel class — opt-in source and timestamp auto-recorded at capture (owner ruling 2026-08-04, Q36).** Every capture surface this module owns states plainly what the person is agreeing to receive, and the product **auto-records** the consent at its own capture points: when, where (the collecting surface) and what was agreed, per channel class, on the contact's record. For **imported/legacy lists**, consent enters via a **tenant declaration checkbox** at import — the tenant attests the list's consent basis, and that declaration (who, when) is the recorded source. Opt-outs are honored suite-wide; campaign sends **auto-filter on the ledger** (`M03-46`); and **proof is one tap** — any contact's consent trail (source + timestamp per channel) opens from their record. The consent classes, regime and freshness duty remain pack data (`F1-15`). | `BRIEF` — capture-side obligation of a sending module; regime consumed from `SRC` `F1-15` / `F1-12`; consent-ledger shape per owner ruling 2026-08-04 (Q36) — the record-shape gap against `F1-58`'s voice-only set is closed; cross-ref `M02-37` | P0 |
| M03-35 | **A campaign-tagged link is the product's own tracking, and it carries no personal data.** Links a campaign sends carry a reference to the campaign that sent them, so an arriving enquiry can be attributed to it. The reference is opaque and identifies a campaign, never a person: **no customer data in any URL** and **no third-party scripts, fonts or analytics** on any customer-facing page (`F5-77`, `DOC08.open-tracking` consumed). Where a tenant's own external tagging convention is used, the product carries it as data on the link and reads it back on capture; it does not build a second analytics system. | `BRIEF` — product-level campaign tracking for brief-scoped campaigns; privacy constraints consumed unchanged from `SRC` `F5-77` / `F5-29` (`foundations/F5`, Task 20) | P1 |
| M03-36 | **Capture never silently fails.** A channel-side submission the product cannot turn into a lead — malformed payload, missing every usable field, a channel delivering after its connection was removed — is recorded in a capture-failure log on the campaign and the channel, with what arrived and why it could not be used, and is surfaced on the channel-health surface (`M03-29`). The product does not report a capture count it did not achieve, and does not drop an enquiry without a trace. | `BRIEF` — capture-side application of the honest-failure law consumed from `F8-36`; the "nothing captured is discarded" posture carried from `S2.wrong.3` via `modules/M02` | P0 |
| M03-37 | **Automatic hand-off of a campaign capture into the voice agent's follow-up queue — recommended enhancement, not v1 scope.** The voice agent exists (`modules/M07`) and campaign captures are exactly the enquiries it was built to chase, so routing them into its queue automatically is the obvious next step and is **recommended**: it is not in the brief (which asks that voice AI follow-up *remain*, not that it be newly triggered), it would create an automated outbound touch from a marketing consent rather than an enquiry the customer initiated, and it would have to pass `modules/M07`'s compliance gate (`M07-27`) unchanged. Mirrored in `registers/enhancements.md`; rationale there. | `REC` — this suite's recommendation; **not** in `_process/owner-brief-2026-08-03.md` §Marketing; `modules/M07` would own any implementation and `M07-27`'s gate is non-negotiable | P2 |

**Behavior detail.** Capture is the module's contract with the rest of the product, and the
contract is deliberately thin: this module knows how an enquiry arrived and which campaign it came
from; `modules/M02` knows everything else. The capture record it keeps — channel, campaign,
arrival time, the raw fields the channel supplied, the consent statement shown, and the dedupe
outcome — hangs off the lead it produced and is readable from the lead's timeline, so a rep asking
"where did this come from?" gets a complete answer without leaving the CRM.

The **capture-settings reciprocity** closes a loop the suite has been carrying since Task 12.
`M01-58` owns the settings surface and its honesty rule; `M02-64`/`M02-65` own the v1 channel set,
the toggle semantics, and the rule that a channel which does not exist is rendered as a "later"
card rather than a teaser. This module supplies the channels that **were** those later cards. When
a tenant connects one here, it stops being a later card and becomes a live source on that same
surface, with the same toggle semantics `M02-64` fixed: a toggle governs **new capture only** and
never touches a lead already captured. Neither `M01-58` nor `M02-64` is restated here, and this
module adds no second settings surface.

**Localization of a capture surface is the visitor's, not the tenant's.** The website form and any
channel-side form render in the visitor's language from the tenant's authored versions (`F3-10`);
where the tenant has authored no version in that language, `F3`'s conservative rule applies and
the gap is surfaced to the author rather than machine-filled (register `Q10`, cited, not
re-opened).

Permissions: capture is created by the channel as a system actor and lands unassigned (`M02-50`)
— no grant is needed to *produce* a lead. Reading what a campaign captured rides
`F2.M03.campaign-visibility`; working the lead afterwards is entirely `modules/M02`'s grants
(`F2.M02.*`), which this module does not widen.

**Edge cases & what-goes-wrong.**

- *A capture matches an existing customer by phone* → the dedupe sheet's outcome applies; for a
  system-created capture the enquiry is logged on the existing lead and its owner notified, never
  silently duplicated (`M03-32`).
- *A social lead form returns an email and no phone* → captured, flagged unverified-identity, no
  duplicate claim made (`M03-33`, `Q35`).
- *The same person submits the website form three times in an hour* → one lead; the second and
  third are enquiries on the existing record (`M03-32`), so the timeline shows the repeat interest
  instead of three competing records.
- *A form submission arrives after the channel was disconnected* → recorded in the capture-failure
  log with that reason rather than dropped (`M03-36`, `M03-27`).
- *A capture arrives at 2am* → captured immediately; any resulting call-back respects the market's
  calling window (`M02-15` consumed — capture is never clock-limited, the call-back is).
- *A visitor's language has no authored form version* → the gap is surfaced to the tenant author;
  nothing is machine-translated (`F3-10`, `Q10`).
- *A campaign is deleted-but-cannot-be* → campaigns that sent anything are archived, never deleted
  (`M03-08`), so a lead's campaign attribution never dangles.

**Acceptance criteria.**

- Given any capture this module produces, when it is created, then it exists in `modules/M02`'s
  unassigned inbox with a source badge and has passed M02's dedupe sheet (`M03-30`, `M03-32`).
- Given a capture carrying a phone number that matches an existing customer, when it is
  system-created, then the enquiry is logged on the existing lead, the owner is notified, and no
  second lead exists (`M03-32`).
- Given a capture with no phone number, when it is created, then it is flagged unverified-identity,
  it appears in the inbox, and the surface states that no duplicate check was possible (`M03-33`).
- Given any capture surface, when it renders, then it states what the person is agreeing to
  receive, and the capture record keeps that consent with its time and surface (`M03-34`).
- Given a market pack with no marketing-consent record shape, when a promotional send is attempted
  to such a record, then it is excluded from the audience rather than sent (`M03-34`, `M03-46`).
- Given a campaign-tagged link, when it is inspected, then it identifies a campaign and carries no
  customer data, and the page it opens loads no third-party script (`M03-35`).
- Given a channel submission that cannot become a lead, when it is received, then it is recorded in
  the capture-failure log with its reason and surfaced on the channel-health surface (`M03-36`).
- Given a lead captured by a campaign, when its timeline is read, then the channel, the campaign
  and the arrival time are all present (`M03-31`).

**Localization notes.** Source badges and the unverified-identity flag are translated per `F3-01`;
campaign names, form content and everything the visitor typed are data and are never translated
(`F3-08`). Capture times render in the tenant's timezone (`F3-22`). **Analytics events:** capture
received (channel, campaign) · capture created lead · capture logged on existing lead · capture
flagged unverified-identity · capture failed (reason class).

### M03.5 — Templates & content

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M03-38 | **Campaign content is tenant-authored, per language, and the product never translates it.** One stored version per language the tenant uses; authoring is offered per language; nothing is machine-translated, auto-filled from another language, or silently substituted. Where a recipient's language has no authored version, `F3`'s conservative rule governs and the gap is surfaced to the author (register `Q10`, cited — this module does not resolve it and does not invent a different fallback). | `BRIEF` — content for brief-scoped campaigns · content-class law consumed unchanged from `SRC` `F3-10` (`DOC10.templates-are-data`: messaging templates are tenant data authored per language) | P0 |
| M03-39 | **Where a channel requires a registered template, the campaign uses one and its registration state is visible.** A template carries a per-channel state — `draft` · `submitted` · `approved` · `rejected` (with the channel's reason) — and only an approved template can be scheduled on a channel that requires one. Registration is a third-party approval clock: it **gates activation, not scope** — the capability ships and the channel activates when the clock clears (`F1-38` consumed; the IN DLT instance is pack content and is not restated here). | `BRIEF` — the campaign-side surface of a pack duty; registration duty and activation-clock law consumed from `SRC` `F1-38` / `F1-15` | P0 |
| M03-40 | **Campaign templates extend the tenant's existing message-template settings; there is no second template system.** `M01-55` establishes message templates as tenant data authored per language on `modules/M01`'s settings surface, for the moments the product **composes** text a person sends. Campaign templates are the same class of tenant content with two additions this module owns: a channel binding and a registration state (`M03-39`). The settings surface, its authoring pattern and its per-language rule are `modules/M01`'s and are not restated. | `BRIEF` — the campaign extension; template-as-tenant-data and per-language authoring consumed from `SRC` `M01-55` / `F3-10`; settings-surface ownership stays `modules/M01`'s (`F2.M01.manage-tenant-settings`) | P0 |
| M03-41 | **Personalisation tokens resolve or the send does not go.** Content may reference record fields (name, city, the campaign's own link). Every token declares a fallback at authoring time; a token that resolves to nothing at send time uses its fallback, and a token with no fallback that cannot resolve **excludes that recipient from the send** and reports the exclusion — the product never sends a message with a visible broken token. The test send (`M03-15`) resolves tokens against a sample record so the author sees the real thing. | `BRIEF` — authoring safety for an unrecallable send; honest-failure law consumed from `F8-36` | P0 |
| M03-42 | **Campaign content carries the tenant's branding, not the platform's.** The tenant's brand on customer-facing marketing content follows the same law as every other customer-facing surface — tenant branding is all-tiers, and unbranded/custom-domain presentation is the Enterprise white-label option whose routing `foundations/F5` designs (`F7-07`, `F5-81`–`F5-83` consumed). | `BRIEF` — brand application to brief-scoped content; branding law consumed from `SRC` `F7-07` / `CG-18` via `F5-81`–`F5-83` | P1 |
| M03-43 | **AI-assisted campaign content drafting — recommended enhancement, not v1 scope.** Generating subject lines, message copy or variant suggestions from a prompt is the category's most common AI feature and is **recommended**, not specified: the brief forbids inventing AI beyond what is supported or clearly proposed (`M03-05`), and any such feature would additionally need the market's AI-disclosure posture settled (register `Q6` names the disclosure floor question). Mirrored in `registers/enhancements.md`; rationale there. | `REC` — this suite's recommendation; explicitly outside `_process/owner-brief-2026-08-03.md` §Marketing's no-invented-AI instruction; `Q6` cited as an input, not answered | P2 |

**Recorded, not resolved — `M03-40`'s description of `M01-55` is pre-Q33.** The cell above reads
`M01-55` as establishing message templates "for the moments the product **composes** text a person
sends." `M01-55` no longer says that: since the owner ruling of 2026-08-04 (`Q33`) the composed
message "**sends from the tenant's connected transactional channel where one exists, and is
copy-paste for a person to send where none is**" (`modules/M01-onboarding-and-tenant-config.md`
§M01.8, and that module's §5), and only the no-channel path claims no delivery — which is `M03-03`'s
transactional lane, stated in this document. The stale clause is a description of another module's
row, not a rule of this one: what `M03-40` itself binds — one template content class, extended here
by a channel binding and a registration state (`M03-39`), with the settings surface
staying `modules/M01`'s — is untouched by the ruling, and the campaign templates this section
specifies remain campaign-lane objects, which `Q33` left unchanged. **The requirement cell is not
rewritten here.** The divergence is recorded at this line for the PRD owner; `registers/conflicts.md`
row 4 is that file's owner's to carry, and the verbatim copy at `tasks/M03-marketing.md` (T-M03-009)
carries the same note so the build reads the lane from `M03-03`.

**Behavior detail.** The content step is where a campaign becomes real, and its shape follows the
channel: an email editor is not a business-messaging template editor, and the product does not
pretend one surface serves both. What *is* identical across channels is the discipline — author
per language (`M03-38`), declare every token's fallback (`M03-41`), see the registration state
before scheduling (`M03-39`), and test to a real recipient before committing (`M03-15`).

A rejected template is a first-class state, not an error toast: it stays visible with the channel's
own reason, it can be edited and resubmitted, and every campaign that depends on it says it cannot
be scheduled until the template clears. This is the same honesty the suite requires of every
third-party clock — the product never hides a dependency it does not control (`F1-38`'s
activation-clock law, `F8-36`).

Permissions: `F2.M03.author-campaign-content` (EPC Owner · Marketing) authors campaign content and
campaign templates and submits them for registration. The tenant-wide message-template surface
stays `F2.M01.manage-tenant-settings` (EPC Owner) — this module does not widen it.

**Edge cases & what-goes-wrong.**

- *A template is rejected by the channel* → visible with the reason, editable, resubmittable;
  dependent campaigns cannot be scheduled and say why (`M03-39`).
- *A registration is still pending at the scheduled time* → the campaign does not send; it holds
  with the registration state named rather than failing silently at send time (`M03-39`).
- *A recipient's language has no authored version* → the gap is surfaced to the author; nothing is
  machine-translated or substituted (`M03-38`, `Q10`).
- *A token cannot resolve and has no fallback* → that recipient is excluded and the exclusion is
  reported; the message is not sent with a broken token (`M03-41`).
- *An author edits an approved template* → the edit re-enters `draft`/`submitted` per the channel's
  own rules, and the approved version stays usable until the new one clears — a campaign never
  loses its ability to send because someone started an edit (`M03-39`).
- *A tenant wants unbranded marketing content* → that is the Enterprise white-label route, whose
  placement is `04-business-model.md`'s and whose routing is `foundations/F5`'s (`M03-42`).

**Acceptance criteria.**

- Given campaign content, when it is authored, then a version exists per language the tenant uses
  and no version was machine-translated or auto-filled from another (`M03-38`).
- Given a channel that requires a registered template, when a campaign on it is scheduled, then
  the template is approved, and if it is not, scheduling is refused with the registration state
  named (`M03-39`).
- Given a template's registration state, when it renders, then it is one of draft/submitted/
  approved/rejected and a rejection shows the channel's own reason (`M03-39`).
- Given a personalisation token with no fallback that cannot resolve for a recipient, when the
  campaign sends, then that recipient is excluded and the exclusion is reported (`M03-41`).
- Given campaign templates, when they are managed, then they are the tenant's existing
  message-template content class with a channel binding and a registration state — not a second
  template system (`M03-40`).

**Localization notes.** The authoring surface's own chrome is translated per `F3-01`; the content
being authored is tenant data in the language it was written in and is never translated (`F3-08`,
`F3-10`). Language coverage per template is visible to the author, per `F3`'s authoring pattern.
**Analytics events:** template created · template submitted for registration · registration state
changed (with reason class) · content authored per language (language) · test send.

### M03.6 — Sends, metering, consent and limits

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M03-44 | **Every send on a metered channel burns the marketing-sends meter, and the campaign shows the projected burn before it commits.** The meter, its channels (business messaging, SMS, email), its per-channel bundles and overage, and the billable unit per channel are `04-business-model.md`'s (`BM-21` consumed; the meter is one of the five in the canonical set, `BM-16`). This module states no bundle size, rate or price — those are market-book data (`BM-41`, `F1-61`) — and shows, before scheduling: the audience's sendable count, the projected burn, and the remaining allowance after it. | `BRIEF` — the campaign-side surface of the V2 meter; meter definition and channel boundary consumed from `BM-21` / `BM-16` (`04-business-model.md`, Task 11); pre-warning discipline per `BM-34` / `F8-33` | P0 |
| M03-45 | **Allowance exhaustion follows the cap law and the soft-block law — never a silent truncation.** At 80% of the channel's allowance the usage surface warns (`BM-34` consumed: the first notice is never the block). A campaign whose projected burn exceeds the remaining allowance cannot be scheduled by a person without `F2.M03.approve-campaign-spend`; with that grant, the overage is shown explicitly and approved explicitly. A campaign that exhausts an allowance **mid-send pauses** (`M03-09`), states exactly how many were sent and how many remain, and offers the upgrade/pay route (`BM-32`'s always-available billing screens). Reading, exporting and every already-captured lead stay available in every billing state (`BM-32`). | `BRIEF` — campaign-side application of the suite's cap and soft-block law; `BM-34`, `BM-32`, `BM-35` consumed unchanged (metered features pause from `past_due` day 4 — `BM-33`'s state names) | P0 |
| M03-46 | **No promotional send goes to a record whose consent state the market's regime does not accept, and the pack decides what "accept" means.** The consent and do-not-disturb classes, the data-freshness duty on them, opt-out semantics and the honoring deadline are `pack.calling-rules` content (`F1-15` consumed). The audience builder excludes non-consenting records at resolution and re-checks at send (`M03-14`), and the exclusion is itemised (`M03-11`) rather than hidden. Where the market's regime requires fresher consent data than the product holds, the conservative posture of the suite's compliance gate applies: **fail closed** — the send waits, it does not proceed on stale data (`F1-36`'s fail-closed precedent for stale scrub data, cited as the pattern; the messaging instance is pack content). The record the filter reads is `M03-34`'s consent ledger (owner ruling 2026-08-04, Q36) — per contact, per channel class, source + timestamp. | `BRIEF` — sending-side obligation; regime, freshness duty and opt-out semantics consumed from `SRC` `F1-15` / `F1-12`; fail-closed pattern from `F1-36`(a) (cited) · ledger shape per owner ruling 2026-08-04 (Q36) | P0 |
| M03-47 | **Opt-out is honored everywhere, immediately, and permanently until the customer says otherwise.** Every promotional send carries the channel's opt-out affordance; an opt-out is recorded against the customer for that channel class, honored within the pack's deadline, and applied to **every** future audience automatically through a suppression list that also holds complaints and repeated undeliverables. Suppression is not a filter a person can forget to apply and there is no campaign-level override. An opt-out never deletes the record and never changes its owner, stage or pipeline position — it changes what may be sent to it. | `BRIEF` — sending-side obligation; opt-out semantics and honoring deadline consumed from `SRC` `F1-15`; irreversibility posture carried from `F1-36`(c) ("irreversible without the customer's say-so", cited as the pattern for the messaging instance) · record-preservation per `modules/M02` §5 | P0 |
| M03-48 | **Where the market declares a messaging send window, promotional sends respect it, and the product never quietly moves a send.** A scheduled time outside the window is refused at scheduling with the window named (`M03-12`); a send that reaches the window's close mid-run pauses and resumes at the next opening, saying so. Transactional messages are not this module's lane (`M03-03`) and no window rule here may be read as governing them. | `BRIEF` — sending-side obligation; window content is pack data (`F1-15`; the IN voice instance `F1-36`(b) is the shape, cited, not applied to messaging by this document) | P0 |
| M03-49 | **A partially completed send is reported partially.** When a run stops early — exhausted allowance, broken channel, billing state, cancellation — the campaign reports sent, failed with reasons, not attempted, and why it stopped. Nothing is rounded up to "completed", and the counts on the campaign are the same counts the usage ledger bills from (`F8-33`'s same-numbers law consumed). | `BRIEF` — honest-completion obligation; consumed from `F8-36` (honest failure) and `F8-33` (the usage figures shown are the figures billed) | P0 |
| M03-50 | **Send volume is bounded by the tenant's allowance and the channel's own limits, and both are visible.** Where a channel imposes its own throughput or daily ceiling, the campaign's schedule respects it, the surface says the run will take longer for that reason, and progress is visible throughout (`M03-09`'s `sending` state carries a running count). The product does not present a channel-imposed limit as its own, or vice versa. | `BRIEF` — operational honesty for a metered send; capability-declaration law `M03-26`; progress/honesty per `F8-36` | P1 |
| M03-51 | **Paid social spend is never a platform meter and never touches this product's money path.** Ad budget on a social network settles tenant-direct with that network (`BM-21`'s explicit boundary). The product shows no spend figure it does not control, bills nothing for those sends, and makes no claim about their delivery. | `BRIEF` — boundary consumed unchanged from `BM-21`; money-path separation consistent with `modules/M11`'s never-touch-funds law (cited) | P0 |
| M03-52 | **A meter whose book value is not yet sellable cannot be sold, and the module says so rather than defaulting.** `BM-21`'s per-channel bundles and overage rates now carry the owner's **draft** values in the India book (owner ruling 2026-08-04, Q1: Starter 500 / Growth 2,000 / Pro 10,000 sends/mo; overage ≈ WhatsApp ₹1.5 · SMS ₹0.35 · email ₹0.10) — **draft pending rate-card verification** (`BM-17`/`BM-26`), and `04-business-model.md` fixes the behaviour: a draft rate is never silently treated as launch-final, and the meter is not sellable until its rate card verifies. This module surfaces that state honestly on the channel-health surface: the channel connects, and metered selling in that market waits on the verification. | `BRIEF` — carried consequence; `BM-21` / `BM-41` / `F1-61` and the draft-pending rule consumed from `04-business-model.md`; draft values per owner ruling 2026-08-04 (Q1) | P1 |

**Behavior detail.** The review step before scheduling is where every number in this area meets the
person about to commit: sendable count and exclusions (`M03-11`), projected meter burn and
remaining allowance (`M03-44`), the window the send must fall inside (`M03-48`), and — where the
projection exceeds the allowance — the explicit overage approval (`M03-45`). None of these is a
tooltip; they are the content of the screen, because the caveat-beside-the-number law that governs
this suite's reporting (`F8-31`) is a general honesty stance, not a reporting-only rule.

**Consent is the part of this module that must never be convenient.** The audience builder
excludes non-consenting records, the send re-checks them, the suppression list is applied without
anybody remembering to, and there is no override anywhere in this module — the same posture the
compliance gate takes for voice, where there is deliberately no override flag at all (`M07-27`,
`F1-12`: "tenants configure within the law, not around it"). What differs is ownership of the
rules: this module owns none of them; `pack.calling-rules` does.

Permissions: scheduling and running ride `F2.M03.manage-campaigns`; anything spend-adjacent —
scheduling beyond the included allowance, approving overage, or linking a paid-social budget —
requires `F2.M03.approve-campaign-spend` (EPC Owner only). The split is deliberate and recorded in
§F2.5-M03's notes: **Marketing manages campaigns, the Owner controls what costs money**, which is
the persona split `02-personas.md` already draws (`PS-35` runs demand generation; the EPC Owner
owns the tenant's commercial decisions) and the same posture `F2.M01.manage-tenant-settings` takes
for anything that binds the tenant commercially.

**Edge cases & what-goes-wrong.**

- *Projected burn exceeds the remaining allowance* → scheduling requires the Owner's explicit
  overage approval, with the overage shown (`M03-45`).
- *Allowance exhausts mid-send* → the campaign pauses, states sent and remaining, and offers the
  pay/upgrade route; nothing is truncated silently (`M03-45`, `M03-49`).
- *Tenant is in `past_due` day 4* → metered sends are paused by the billing state (`BM-35`), while
  reading, exporting and every captured lead remain available (`BM-32`).
- *A customer opts out while a campaign is sending* → honored within the pack's deadline; the
  suppression applies from that moment and the report counts them as opted-out-before-send where
  the send had not yet happened (`M03-47`, `M03-04`).
- *Consent data is staler than the market's freshness duty allows* → the send waits; it does not
  proceed on stale data (`M03-46`).
- *The market book's bundle rate is still draft* → the channel connects and metered selling waits
  on rate-card verification of the draft values (owner ruling 2026-08-04, Q1); the product does
  not treat a draft as final (`M03-52`).
- *A channel's own daily ceiling stretches a run across the window's close* → the run pauses at the
  close and resumes at the next opening, saying so (`M03-48`, `M03-50`).
- *Someone asks to "just send it anyway"* → there is no override; the refusal names the rule and
  the pack that owns it (`M03-46`, `F1-12`).

**Acceptance criteria.**

- Given a campaign at its review step, when it renders, then the sendable count, the projected
  meter burn and the remaining allowance are all shown before scheduling is possible (`M03-44`).
- Given a projected burn above the remaining allowance, when scheduling is attempted without
  `F2.M03.approve-campaign-spend`, then it is refused; and with that grant, the overage is shown
  and approved explicitly (`M03-45`).
- Given a campaign that exhausts its allowance mid-send, when it stops, then it is `paused`, states
  sent and remaining, and offers the pay/upgrade route (`M03-45`, `M03-49`).
- Given a record with no accepted consent for the channel's class, when the audience is resolved
  and again when it is sent, then that record is excluded and the exclusion is itemised
  (`M03-46`, `M03-11`).
- Given an opt-out, when any later campaign resolves its audience, then that customer is excluded
  automatically with no person having to apply a filter and no override available (`M03-47`).
- Given a run that reaches the close of the market's declared messaging window, when it stops,
  then it pauses with that reason and resumes at the next opening, and no send is silently moved
  (`M03-48`).
- Given a send that stops early for any reason, when the report renders, then sent, failed with
  reasons, not attempted and the stop reason are all stated (`M03-49`).
- Given a paid-social campaign, when its surfaces render, then no platform meter is burned and no
  spend figure the product does not control is displayed (`M03-51`).
- Given a market whose send-bundle book value is draft (or absent), when the channel is opened,
  then metered selling is shown as awaiting rate-card verification (or pricing) and no draft or
  default rate is silently treated as final (`M03-52`).

**Localization notes.** Allowance, overage and exclusion copy is translated per `F3-01`; every
count renders through the shared number implementation and any money through the shared money
implementation in the tenant's currency (`F3-19`, `F3-20`, `F1-07`) — this module names no figure
of its own. Opt-out copy is the channel's requirement rendered in the recipient's language from
tenant-authored content (`M03-38`). **Analytics events:** send projected (count, burn) · overage
approved (by whom) · send started · send paused (reason: allowance · billing state · channel ·
window · person) · send completed (sent, failed, not attempted) · opt-out recorded (channel) ·
suppression applied.

### M03.7 — Campaign performance

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M03-53 | **Campaign impact is reported as correlation, and the screen says so.** The suite's law is verbatim and binding: *"'Deals it touched' is correlation, not attribution — and the screen must say so"* (`F8-30` consumed). A campaign performance surface may state that leads it captured later progressed or closed; it may **never** state that a campaign generated a deal, produced revenue, or caused a value of pipeline. The caption renders in the same honest register the agent-impact block uses — what happened, in what window, and what cannot be proved. | `BRIEF` — brief-scoped reporting obligation; the correlation law consumed unchanged from `SRC` `F8-30` (`AP.honesty.1`, `D37`) — `foundations/F8` owns it, this module obeys it | P0 |
| M03-54 | **The caveat renders beside the number, never behind an interaction.** The correlation statement is persistent on-screen content adjacent to the figure it qualifies — not a tooltip, an info icon, a hover state, or a link elsewhere (`F8-31` consumed; `DOC10.n-rules` N1's no-hover-only-meaning law via `foundations/F7`). | `BRIEF` — application of `SRC` `F8-31` to this module's surfaces (which `F8-31` did not enumerate because this module did not exist when it was written) | P0 |
| M03-55 | **Performance reports only what the channel actually reported, and names what it did not.** Per campaign: audience sent to, per-state counts from `M03-04` limited to the states this channel reports (`M03-26`), captures produced, and — correlation-framed (`M03-53`) — what those captures did afterwards. A state the channel does not report is shown as **not reported**, never as zero, and never inferred from an adjacent signal (an open is not a delivery). | `BRIEF` — reporting half of `M03-04`/`M03-26`; honest-state and honest-degradation laws consumed from `F8-34` / `F8-35` | P0 |
| M03-56 | **The campaign→pipeline view is a list of leads, not a model.** For a campaign: the leads it captured, their current stage, and how many reached each of the CRM's own terminal states within a stated window — rendered as the CRM's records with the campaign as one attribute of each (`M03-31`), scoped by the reader's own lead visibility (`F2-12`–`F2-14`). There is no weighting, no scoring, no multi-touch model and no revenue claim; `modules/M02`'s "no lead scoring" and "no campaign attribution" non-goals are respected rather than routed around. | `BRIEF` — brief-scoped ("feed them into the sales pipeline" implies seeing what happened); constrained by `SRC` `S2.notv1.1` / `S2.notv1.3` via `modules/M02` §5 and by `F8-30` | P0 |
| M03-57 | **Cross-campaign and cross-channel reporting is `modules/M13`'s; this module owns the campaign-local view.** What this module publishes for M13 to report on is fixed here: campaign identity, channel, audience size, send outcomes, captures, and the correlation caveat that must travel with any figure derived from them. M13 may not present those figures without the caveat (`M03-53`, `F8-30`). | `BRIEF` — module boundary; reporting ownership per design spec §4 (`modules/M13` = dashboards and reporting); caveat-travels rule from `SRC` `F8-30` / `F8-31` | P1 |
| M03-58 | **Campaign records export, always.** A campaign's audience-level result, its capture list and its send report export in the suite's standard export path, in every billing state — export always works (`BM-32` consumed). Exports carry the same caveat text as the screen, because a figure that leaves the product without its caveat is the failure `F8-31` exists to prevent. | `BRIEF` — application of the always-export law (`BM-32`) to this module; caveat-travels rule per `F8-31` | P1 |

**Behavior detail.** A campaign's performance surface is deliberately small: what was sent, what
the channel said about it, what came back, and what happened to what came back — each with the
honesty its evidence supports. The most important design decision in this area is what is
**absent**: there is no "revenue generated by marketing" figure anywhere, because the product
cannot prove it and the suite's honesty foundation forbids claiming it (`F8-30`). An owner who
wants that number is better served by the honest one — these leads arrived through this campaign,
this many progressed, this many closed in this window, and we cannot prove the campaign caused it
— and that is exactly what this module renders.

The correlation caveat is content, not decoration: it names the window, states what was counted,
and states plainly what cannot be proved, in the same register `foundations/F8` fixes for the
agent-impact block. It travels with the figure into exports (`M03-58`) and into `modules/M13`'s
dashboards (`M03-57`); no surface anywhere in the suite may render a campaign-derived number
without it.

Permissions: `F2.M03.campaign-visibility` (EPC Owner: all · Sales Manager: read · Marketing: all)
governs who reads these surfaces; the leads behind a campaign are additionally scoped by the
reader's own lead visibility (`F2.M02.lead-visibility`), so a campaign's capture list shows a Sales
Manager their team's captures and the EPC Owner everything — the same surface, scoped (`F2-12`).

**Edge cases & what-goes-wrong.**

- *A channel reports no delivery at all* → the delivery figure is absent with "not reported by this
  channel" in its place; nothing is inferred from opens (`M03-55`, `M03-04`).
- *A campaign captured leads that were merged into other records* → the capture still points at the
  surviving record (`modules/M02`'s merge re-points references; the tombstone preserves the trail),
  so counts do not silently drift.
- *A lead captured by a campaign is later marked junk or lost* → it appears in the campaign's list
  with that state; the product does not hide unflattering outcomes.
- *An owner asks "how much revenue did marketing bring?"* → the product answers with the
  correlation-framed figures and the caveat, and offers no revenue attribution (`M03-53`).
- *A figure is exported and pasted into a board deck* → the caveat is in the export (`M03-58`).
- *A campaign sent on a channel the tenant has since disconnected* → its report is unchanged and
  still readable; disconnection never rewrites history (`M03-27`).

**Acceptance criteria.**

- Given any campaign impact figure, when it renders, then a correlation statement renders beside it
  as persistent on-screen content, and no revenue or generated-deal claim appears (`M03-53`,
  `M03-54`).
- Given a channel that does not report a state, when performance renders, then that state reads
  "not reported" rather than zero, and no adjacent signal is used as a substitute (`M03-55`).
- Given a campaign's capture list read by a Sales Manager, when it renders, then it contains their
  team's captures only, scoped by the same visibility law as every other list (`M03-56`,
  `F2-12`).
- Given a campaign export, when it is produced, then it succeeds in every billing state and carries
  the same caveat text as the screen (`M03-58`).

**Localization notes.** The correlation caveat is user-facing copy translated per `F3-01` and must
survive translation with its meaning intact — a translation that softens "we cannot prove" into
"may indicate" is a defect, and `F3-11`'s one-term-per-concept rule applies to the caveat's key
phrases. Counts and dates render through the shared implementations (`F3-19`, `F3-22`).
**Analytics events:** campaign report opened · campaign export produced · pipeline view opened
(campaign).

## 4. Cross-module contracts

**This module provides:**

- **Captured enquiries** into `modules/M02`'s unassigned inbox, through M02's dedupe sheet, each
  with a channel source badge and its capturing campaign (`M03-30`, `M03-31`).
- **The live channel set** behind `modules/M01`'s capture-settings surface — the channels that were
  `M01-58`/`M02-65`'s "later" cards become live sources when connected here, under `M02-64`'s
  toggle semantics (`M03-32` behaviour detail).
- **The superseding specifications** that `registers/conflicts.md` rows 3 and 4 assign to this
  module (`M03-01`, `M03-02`) and the lane boundary that keeps them contained (`M03-03`).
- **Campaign-derived figures** for `modules/M13`, with the correlation caveat that must travel with
  them (`M03-53`, `M03-57`).
- **Marketing-send usage** against the `BM-21` meter, in the same counts the usage ledger bills
  from (`M03-44`, `M03-49`).
- **Consent and opt-out state** recorded per channel class on the customer record (`M03-34`,
  `M03-47`), read by any surface that must not contact an opted-out customer.

**This module expects:**

| From | This module expects |
|---|---|
| `foundations/F1-global-market-framework.md` | The communications-compliance ruleset for **messaging** — template/sender registration duties, consent and DND classes with their freshness duty, opt-out semantics and honoring deadline, and any send window — from `pack.calling-rules` (`F1-15`), non-overridable (`F1-12`); the IN instance (`F1-38`) as the reference case; the tenant's currency and timezone (`F1-07`, `F1-10`); the market book slots for send bundles (`F1-61`). |
| `foundations/F2-roles-and-permissions.md` | The twelve presets, this module's matrix rows `F2.M03.*`, the visibility law per domain including the **campaigns** domain (`F2-12`–`F2-14`), and the audit obligations (`F2-22`). |
| `foundations/F3-localization.md` | Per-reader language, the never-translated set, tenant-authored-content law (`F3-10`) and the single number/money/date implementations (`F3-19`–`F3-22`). |
| `foundations/F7-design-language.md` | The binding visual language, tenant branding on customer-facing content (`F7-07`), the desktop-first-with-full-mobile pattern (`F7-30`), and the no-hover-only-meaning rule behind `M03-54`. |
| `foundations/F8-data-honesty.md` | The correlation law (`F8-30`), the caveat-placement law (`F8-31`), honest state (`F8-34`), honest degradation (`F8-35`), honest failure (`F8-36`) and the same-numbers-we-bill-from law (`F8-33`). |
| `foundations/F5-customer-link.md` | The no-PII-in-URLs and no-third-party-script laws that campaign links and landing pages obey (`F5-77`, `F5-29`); the branding/white-label routing (`F5-81`–`F5-83`); and `Q33`, which this module does not answer. |
| `foundations/F6-notifications-and-search.md` | The notification types this module raises (channel `action needed`, campaign paused, capture-failure spike) — registered there, not defined here. |
| `04-business-model.md` | The marketing-sends meter and its channel boundary (`BM-21`), the canonical meter set (`BM-16`), the cap law with its 80% pre-warning (`BM-34`), the soft-block law and matrix (`BM-32`, `BM-35`), the billing-state names (`BM-33`), and the empty-book-slot rule (`BM-41`, `Q1`). |
| `modules/M01-onboarding-and-tenant-config.md` | The capture-settings surface and its honesty rule (`M01-58`); the message-template content class and its per-language authoring (`M01-55`); the tenant-settings credential discipline this module's connections inherit. |
| `modules/M02-crm-and-leads.md` | The unassigned inbox (`M02-23`), the dedupe sheet with its three choices and three entry points (`M02-08`–`M02-12`, `M02-10`), the source-badge law (`M02-13`), the channel-toggle semantics (`M02-64`), the later-card honesty rule (`M02-65`), unassigned-state escalation (`M02-50`), and the guarantee at `M02-17` that this module's captures are welcome unchanged. |
| `modules/M07-sales-execution.md` | The voice agent, its inbound capture, its number and its non-negotiable compliance gate (`M07-47`, `M07-48`, `M07-27`) — referenced as a channel surface, never restated or re-specified. |
| `modules/M13-dashboards-and-reporting.md` | Cross-campaign and cross-channel reporting built on this module's published figures, carrying the correlation caveat (`M03-57`). |

## 5. Non-goals

- **No transactional sending through campaign machinery.** The transactional lane is real and
  product-wide (owner ruling 2026-08-04, `Q33` — automatic sends from the connected channel,
  copy-paste fallback, `M03-03`), but it never rides this module's campaign pipeline, consent
  meter or audience machinery; a transactional send burns no marketing meter and a campaign
  never carries a transactional moment.
- **No second pipeline, no second CRM.** No stage machine, no lead ownership, no qualification, no
  close state (`M03-07`). Everything captured is `modules/M02`'s the moment it exists.
- **No second dedupe vocabulary.** One sheet, three choices; this module adds entry points, not a
  channel-specific duplicate dialog (`M03-32`; `modules/M02` §5).
- **No lead scoring and no multi-touch attribution model.** Carried from `modules/M02`'s non-goals
  (`S2.notv1.1`, `S2.notv1.3`): a capture carries the campaign it came from, and impact is
  reported as correlation (`M03-53`) — the product does not rank people or model influence.
- **No invented AI.** The brief's own instruction (`M03-05`); generative and automation ideas are
  `REC` rows (`M03-16`, `M03-17`, `M03-37`, `M03-43`) in `registers/enhancements.md`, never core
  scope. The voice agent that does exist is `modules/M07`'s.
- **No multi-step nurture sequences in this release** — one campaign is one audience, one content,
  one send moment (`M03-12`); the sequenced form is the `REC` at `M03-16`.
- **No campaign calendar.** Campaigns carry a send moment, not a planning calendar surface; no
  scheduling-calendar UI, no editorial calendar, no recurring series in this release.
- **No ad creation, ad buying, or ad budget handling.** Social spend settles tenant-direct with the
  network (`M03-51`, `BM-21`); the product connects identities, captures leads and reports — it
  never touches the tenant's ad money, consistent with `modules/M11`'s never-touch-funds posture.
- **No landing-page or website builder.** The website form is an embeddable capture surface
  (`M03-24`), not a page builder or a CMS.
- **No website chatbot** — carried unchanged from `modules/M02` §5 (`S2.notv1.4`); the brief adds
  channels, not a chat product.
- **No consent override, anywhere.** There is no "send anyway", no per-campaign exemption and no
  tenant setting that relaxes a pack floor (`M03-46`, `F1-12`).
- **No delivery claim a channel did not make.** Where a channel reports nothing, the product says
  nothing (`M03-04`, `M03-26`) — and on the transactional lane the delivery states shown are
  exactly the connected channel's own, with the copy-paste fallback claiming none (`M03-03`,
  `F5-28` as amended by owner ruling 2026-08-04 Q33).
- **No market rules written in this document.** Every compliance rule is `pack.calling-rules` data
  (`M03-06`); this module points at a market's scheme, window or consent class through its pack key
  and never restates its content as this module's own.

## 6. Open questions

Mirrored into `registers/open-questions.md` (rollup ids noted):

- **M03-Q1 (register `Q35`) — RESOLVED (owner ruling 2026-08-04, Q35).** The phone number is
  **mandatory on every connectable lead-capture form** — website, Facebook/Instagram lead forms
  and every form-bearing channel; a form without a required phone field cannot be connected
  (`M03-19`, `M03-33`); phone-as-identity is unbroken (`M02-03`) and the "incomplete lead" path
  is not built. The owner chose data integrity over form-fill rate, deliberately, against the
  standing recommendation.
- **M03-Q2 (register `Q36`) — RESOLVED (owner ruling 2026-08-04, Q36).** The **consent ledger**
  is the record shape: per contact, per channel class, opt-in source + timestamp auto-recorded
  at the product's own capture points, with a **tenant declaration checkbox** as the recorded
  basis for imported/legacy lists; opt-outs honored suite-wide; campaign sends auto-filtered by
  consent; proof one tap (`M03-34`, `M03-46`; cross-ref `M02-37`).
- **M03-Q3 (register `Q37`) — RESOLVED (owner ruling 2026-08-04, Q37).** **Segments-yes,
  files-no:** the Marketing preset gains the whole-base **audience-builder capability** —
  filters, counts and send over the full lead base, aggregate-only — with no individual
  lead-file read (`M03-10`; F2's M03 matrix carries the capability row). Record-level
  visibility law is unchanged (`F2-12`–`F2-15`).

**Questions this module cites, now closed by the same session (owner rulings 2026-08-04):**
`Q33` — the transactional lane exists product-wide, sending from the tenant's connected channel
with copy-paste fallback (`M03-03`); `Q10` — a missing-language version shows the
original language with a small note, never silent machine translation (`M03-38` obeys `F3-10`);
`Q1` — the send-bundle book slots carry the owner's draft values pending rate-card verification
(`BM-41`, rendered honestly by `M03-52`); `Q6` — the tiered AI-disclosure law (`F1-36`(d)), an
input to `M03-43`'s `REC` should it ever be adopted.
