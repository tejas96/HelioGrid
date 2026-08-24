# M03 · Marketing — engineering tasks

This file covers every requirement row of `docs/prd/modules/M03-marketing.md` (M03-01 … M03-58): the campaign object and its lifecycle, the audience builder, campaign content and registered templates, the tenant-owned channel connections (email, WhatsApp business messaging, SMS, Facebook/Instagram, website form), capture and hand-off into M02, consent/suppression/metering enforcement, and campaign performance reporting. Task-id prefix: **T-M03-**. Source doc: `docs/prd/modules/M03-marketing.md`; screen specifications live in `docs/ux/briefs/SCR-M03-*.md` (SCR-M03-01 … SCR-M03-10). Ten screen tasks carry one screen each, nine engine/integration tasks carry the non-screen builds, eleven rows are laws enforced through screens and review, and five context rows are realized elsewhere. Requirement text and acceptance lines are copied verbatim from the PRD — they are never paraphrased here. Every row is dispositioned exactly once in the Disposition index at the end.

### T-M03-001 · Campaign List (Campaigns Home)
**Type:** screen · **Tier:** P0
**PRD rows:** M03-08 (P0)
**DESIGN:** SCR-M03-01 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M03-01-campaign-list.md`; they are the specification.
**DONE WHEN:**
- Given a campaign in any state, when it is read, then its state is one of the six of `M03-09` and the surface states what that state means for editing and sending (`M03-08`, `M03-09`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M03-002 · Campaign Builder — Audience
**Type:** screen · **Tier:** P0
**PRD rows:** M03-10 (P0), M03-11 (P0)
**DESIGN:** SCR-M03-02 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M03-02-campaign-builder-audience.md`; they are the specification.
**DONE WHEN:**
- Given an audience builder used by any holder of the capability — including a Marketing-only holder — when filters are applied, then counts resolve over the whole lead base, and no individual lead file, value or note is readable through the builder (`M03-10`, owner ruling 2026-08-04 Q37).
- Given an audience, when the campaign reaches its review step, then matched, each exclusion reason, and the number that will actually be sent to are all stated before scheduling is possible (`M03-11`).
- Given a record with no accepted consent for the channel's class, when the audience is resolved and again when it is sent, then that record is excluded and the exclusion is itemised (`M03-46`, `M03-11`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M03-003 · Campaign Builder — Content
**Type:** screen · **Tier:** P0
**PRD rows:** M03-15 (P1), M03-38 (P0), M03-41 (P0)
**DESIGN:** SCR-M03-03 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M03-03-campaign-builder-content.md`; they are the specification.
**DONE WHEN:**
- Given campaign content, when it is authored, then a version exists per language the tenant uses and no version was machine-translated or auto-filled from another (`M03-38`).
- Given a personalisation token with no fallback that cannot resolve for a recipient, when the campaign sends, then that recipient is excluded and the exclusion is reported (`M03-41`).
- The PRD carries no dedicated Given/When/Then citing `M03-15`; the verbatim row in the brief is the acceptance baseline for the test send (goes to a nominated person, tokens resolved against a sample record, burns the same meter as real sends and says so before it is sent).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M03-004 · Campaign Builder — Review
**Type:** screen · **Tier:** P0
**PRD rows:** M03-12 (P0), M03-44 (P0), M03-45 (P0)
**DESIGN:** SCR-M03-04 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M03-04-campaign-builder-review.md`; they are the specification.
**DONE WHEN:**
- Given a scheduled send time outside the market's declared messaging window, when scheduling is attempted, then it is refused with the window named and nothing is silently moved (`M03-12`).
- Given a campaign at its review step, when it renders, then the sendable count, the projected meter burn and the remaining allowance are all shown before scheduling is possible (`M03-44`).
- Given a projected burn above the remaining allowance, when scheduling is attempted without `F2.M03.approve-campaign-spend`, then it is refused; and with that grant, the overage is shown and approved explicitly (`M03-45`).
- Given a campaign that exhausts its allowance mid-send, when it stops, then it is `paused`, states sent and remaining, and offers the pay/upgrade route (`M03-45`, `M03-49`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M03-005 · Campaign Detail
**Type:** screen · **Tier:** P1
**PRD rows:** M03-50 (P1)
**DESIGN:** SCR-M03-05 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M03-05-campaign-detail.md`; they are the specification.
**DONE WHEN:**
- The PRD carries no dedicated Given/When/Then citing `M03-50`; the verbatim row in the brief is the acceptance baseline (channel-imposed throughput/daily ceilings respected, the surface says the run will take longer for that reason, progress visible throughout, and a limit is attributed to its owner — the product does not present a channel-imposed limit as its own, or vice versa).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M03-006 · Campaign Performance
**Type:** screen · **Tier:** P0
**PRD rows:** M03-04 (P0), M03-14 (P0), M03-26 (P0), M03-49 (P0), M03-53 (P0), M03-55 (P0), M03-56 (P0)
**DESIGN:** SCR-M03-06 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M03-06-campaign-performance.md`; they are the specification.
**DONE WHEN:**
- Given a send on a channel that reports no delivery state, when the campaign's per-recipient results render, then the state reads "not reported by this channel" and no delivery is implied (`M03-04`).
- Given a scheduled campaign, when it is edited, then it returns to `draft` and cannot send until re-scheduled and re-resolved (`M03-13`, `M03-14`).
- Given a campaign whose audience changed between scheduling and sending, when the report renders, then the delta from the scheduled count is stated with reasons grouped (`M03-14`).
- Given a channel that cannot report delivery, when campaign results render, then no delivery column exists and the surface states that this channel does not report it (`M03-26`).
- Given a campaign that exhausts its allowance mid-send, when it stops, then it is `paused`, states sent and remaining, and offers the pay/upgrade route (`M03-45`, `M03-49`).
- Given a send that stops early for any reason, when the report renders, then sent, failed with reasons, not attempted and the stop reason are all stated (`M03-49`).
- Given any campaign impact figure, when it renders, then a correlation statement renders beside it as persistent on-screen content, and no revenue or generated-deal claim appears (`M03-53`, `M03-54`).
- Given a channel that does not report a state, when performance renders, then that state reads "not reported" rather than zero, and no adjacent signal is used as a substitute (`M03-55`).
- Given a campaign's capture list read by a Sales Manager, when it renders, then it contains their team's captures only, scoped by the same visibility law as every other list (`M03-56`, `F2-12`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M03-007 · Channel Connections
**Type:** screen · **Tier:** P0
**PRD rows:** M03-19 (P0), M03-27 (P0), M03-28 (P0)
**DESIGN:** SCR-M03-07 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M03-07-channel-connections.md`; they are the specification.
**DONE WHEN:**
- Given a channel the tenant has not connected, when the channel list renders, then it shows as connectable with its requirements — never as a working channel (`M03-19`).
- Given a market whose pack supplies no messaging ruleset, when a messaging channel is opened, then it renders as unavailable for that market with the reason, and no send is possible (`M03-06`, `M03-19`).
- Given a disconnected channel, when leads it previously captured are opened, then they are intact with their original source badge (`M03-27`).
- Given a channel that breaks mid-send, when the break is detected, then the campaign pauses with that reason, the owner is notified, and unsent messages are reported as waiting rather than dropped (`M03-28`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M03-008 · Channel Health
**Type:** screen · **Tier:** P0
**PRD rows:** M03-29 (P1), M03-36 (P0), M03-52 (P1)
**DESIGN:** SCR-M03-08 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M03-08-channel-health.md`; they are the specification.
**DONE WHEN:**
- Given the channel-health surface, when it renders, then every channel's connection state, registration state and remaining allowance are visible in one place (`M03-29`).
- Given a channel submission that cannot become a lead, when it is received, then it is recorded in the capture-failure log with its reason and surfaced on the channel-health surface (`M03-36`).
- Given a market whose send-bundle book value is draft (or absent), when the channel is opened, then metered selling is shown as awaiting rate-card verification (or pricing) and no draft or default rate is silently treated as final (`M03-52`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M03-009 · Campaign Templates
**Type:** screen · **Tier:** P0
**PRD rows:** M03-39 (P0), M03-40 (P0)
**DESIGN:** SCR-M03-09 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M03-09-campaign-templates.md`; they are the specification. `M03-40` is not present in any brief and is quoted in full:
- **M03-40** (P0) — **Campaign templates extend the tenant's existing message-template settings; there is no second template system.** `M01-55` establishes message templates as tenant data authored per language on `modules/M01`'s settings surface, for the moments the product **composes** text a person sends. Campaign templates are the same class of tenant content with two additions this module owns: a channel binding and a registration state (`M03-39`). The settings surface, its authoring pattern and its per-language rule are `modules/M01`'s and are not restated.
- (`M03-40`'s clause "for the moments the product **composes** text a person sends" is the **pre-ruling** description of `M01-55`, quoted above unchanged because the row is the specification. `M01-55` now reads: the composed message "**sends from the tenant's connected transactional channel where one exists, and is copy-paste for a person to send where none is**" (owner ruling 2026-08-04, Q33), and only the no-channel path claims no delivery — the lane law is `M03-03`, quoted in full in the Laws section of this file. **Nothing in this task changes:** `M03-40` binds the template *content class*, not a send rail, and the campaign templates built here are campaign-lane objects the ruling left unchanged; a transactional send never uses this surface. The divergence is recorded at `docs/prd/modules/M03-marketing.md` §M03.5 and the requirement cell is not rewritten by this suite; `docs/prd/registers/conflicts.md` row 4 is that file's owner's to carry.)
**DONE WHEN:**
- Given a channel that requires a registered template, when a campaign on it is scheduled, then the template is approved, and if it is not, scheduling is refused with the registration state named (`M03-39`).
- Given a template's registration state, when it renders, then it is one of draft/submitted/approved/rejected and a rejection shows the channel's own reason (`M03-39`).
- Given a connected business-messaging channel with no approved template, when a campaign on it is scheduled, then scheduling is refused and the registration state is named (`M03-21`, `M03-39`).
- Given campaign templates, when they are managed, then they are the tenant's existing message-template content class with a channel binding and a registration state — not a second template system (`M03-40`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M03-010 · Website Enquiry Form
**Type:** screen · **Tier:** P0
**PRD rows:** M03-24 (P0)
**DESIGN:** SCR-M03-10 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M03-10-website-enquiry-form.md`; they are the specification.
**DONE WHEN:**
- Given the website form, when a visitor submits it, then a lead is created through the same capture path as every other channel and the form itself sends nothing to anyone (`M03-24`).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M03-011 · Campaign lifecycle state machine
**Type:** engine · **Tier:** P0
**PRD rows:** M03-09, M03-13
**Requirements (verbatim):**
- **M03-09** (P0) — **The campaign state set is closed and each state says what is true:** `draft` (nothing sent, freely editable) · `scheduled` (audience resolved, waiting for its time) · `sending` (in progress, with a running count) · `paused` (stopped mid-run by a person or by the product, resumable) · `completed` (the run finished, with its own honest partial-completion report) · `cancelled` (stopped and not resumable). There is no seventh state and no state that means "we are not sure".
- **M03-13** (P0) — **Editing rules follow what has already left the building.** A `draft` campaign is fully editable. A `scheduled` campaign may be edited, which returns it to `draft` and requires re-scheduling — the audience is re-resolved. A `sending` campaign may be **paused or cancelled only**; its content and audience are frozen. Nothing already sent is ever un-sent, and the product never implies it can recall a message.
**DONE WHEN:**
- Given a campaign in any state, when it is read, then its state is one of the six of `M03-09` and the surface states what that state means for editing and sending (`M03-08`, `M03-09`).
- Given a scheduled campaign, when it is edited, then it returns to `draft` and cannot send until re-scheduled and re-resolved (`M03-13`, `M03-14`).

### T-M03-012 · Capture pipeline & hand-off into M02
**Type:** engine · **Tier:** P0
**PRD rows:** M03-30, M03-31, M03-32
**Requirements (verbatim):**
- **M03-30** (P0) — **Everything this module captures enters `modules/M02` — the same unassigned inbox, the same dedupe sheet, unchanged.** This is the reciprocal of the guarantee M02 already makes (`M02-17`: "whatever M03 lands arrives in this module's inbox (`M02-23`), carries its own source badge, and passes through this module's dedupe sheet (`M02-10`) unchanged"). This module creates no lead list of its own, no parallel queue, and no capture that bypasses the sheet. Captured leads land **unassigned** (`M02-50`) so triage is unchanged by volume.
- **M03-31** (P0) — **Every captured lead carries its channel as its source, and its campaign as an attribute of the capture.** The source badge is the channel (`website form`, `business messaging`, `email`, `SMS`, `social lead form`), rendered wherever a lead is listed exactly as the v1 sources are (`M02-13`). The **campaign** that produced the capture is recorded on the lead's capture record and its timeline — one campaign, the one whose link or form or reply produced this enquiry — and is never presented as a multi-touch attribution model (`M02`'s non-goal is respected: what exists is where the enquiry came from, not a model of influence).
- **M03-32** (P0) — **Phone-identity dedupe is preserved: a capture that carries a phone number meets the dedupe sheet before anything is created, exactly as a typed capture does.** The sheet, its three facts and its three choices are `modules/M02`'s (`M02-08`–`M02-12`) and this module adds no fourth choice and no channel-specific duplicate dialog (`modules/M02` §5: "no second dedupe vocabulary"). For a **system-created** capture with no person at the keyboard to choose, the conservative resolution applies: the enquiry is logged on the existing lead (`M02-11`'s "log enquiry on existing" outcome) rather than creating a second record, the existing owner is notified, and nothing about the existing lead's stage or owner changes.
**DONE WHEN:**
- Given any capture this module produces, when it is created, then it exists in `modules/M02`'s unassigned inbox with a source badge and has passed M02's dedupe sheet (`M03-30`, `M03-32`).
- Given a capture carrying a phone number that matches an existing customer, when it is system-created, then the enquiry is logged on the existing lead, the owner is notified, and no second lead exists (`M03-32`).
- Given a lead captured by a campaign, when its timeline is read, then the channel, the campaign and the arrival time are all present (`M03-31`).

### T-M03-013 · Consent ledger, suppression & send-window gating
**Type:** engine · **Tier:** P0
**PRD rows:** M03-34, M03-46, M03-47, M03-48
**Requirements (verbatim):**
- **M03-34** (P0) — **The consent ledger: per contact, per channel class — opt-in source and timestamp auto-recorded at capture (owner ruling 2026-08-04, Q36).** Every capture surface this module owns states plainly what the person is agreeing to receive, and the product **auto-records** the consent at its own capture points: when, where (the collecting surface) and what was agreed, per channel class, on the contact's record. For **imported/legacy lists**, consent enters via a **tenant declaration checkbox** at import — the tenant attests the list's consent basis, and that declaration (who, when) is the recorded source. Opt-outs are honored suite-wide; campaign sends **auto-filter on the ledger** (`M03-46`); and **proof is one tap** — any contact's consent trail (source + timestamp per channel) opens from their record. The consent classes, regime and freshness duty remain pack data (`F1-15`).
- **M03-46** (P0) — **No promotional send goes to a record whose consent state the market's regime does not accept, and the pack decides what "accept" means.** The consent and do-not-disturb classes, the data-freshness duty on them, opt-out semantics and the honoring deadline are `pack.calling-rules` content (`F1-15` consumed). The audience builder excludes non-consenting records at resolution and re-checks at send (`M03-14`), and the exclusion is itemised (`M03-11`) rather than hidden. Where the market's regime requires fresher consent data than the product holds, the conservative posture of the suite's compliance gate applies: **fail closed** — the send waits, it does not proceed on stale data (`F1-36`'s fail-closed precedent for stale scrub data, cited as the pattern; the messaging instance is pack content). The record the filter reads is `M03-34`'s consent ledger (owner ruling 2026-08-04, Q36) — per contact, per channel class, source + timestamp.
- **M03-47** (P0) — **Opt-out is honored everywhere, immediately, and permanently until the customer says otherwise.** Every promotional send carries the channel's opt-out affordance; an opt-out is recorded against the customer for that channel class, honored within the pack's deadline, and applied to **every** future audience automatically through a suppression list that also holds complaints and repeated undeliverables. Suppression is not a filter a person can forget to apply and there is no campaign-level override. An opt-out never deletes the record and never changes its owner, stage or pipeline position — it changes what may be sent to it.
- **M03-48** (P0) — **Where the market declares a messaging send window, promotional sends respect it, and the product never quietly moves a send.** A scheduled time outside the window is refused at scheduling with the window named (`M03-12`); a send that reaches the window's close mid-run pauses and resumes at the next opening, saying so. Transactional messages are not this module's lane (`M03-03`) and no window rule here may be read as governing them.
**DONE WHEN:**
- Given any capture surface, when it renders, then it states what the person is agreeing to receive, and the capture record keeps that consent with its time and surface (`M03-34`).
- Given a market pack with no marketing-consent record shape, when a promotional send is attempted to such a record, then it is excluded from the audience rather than sent (`M03-34`, `M03-46`).
- Given a record with no accepted consent for the channel's class, when the audience is resolved and again when it is sent, then that record is excluded and the exclusion is itemised (`M03-46`, `M03-11`).
- Given an opt-out, when any later campaign resolves its audience, then that customer is excluded automatically with no person having to apply a filter and no override available (`M03-47`).
- Given a run that reaches the close of the market's declared messaging window, when it stops, then it pauses with that reason and resumes at the next opening, and no send is silently moved (`M03-48`).
- Given the email channel, when a campaign sends on it, then it sends from the tenant's own proven sending identity and every message carries an opt-out affordance that feeds the suppression list (`M03-20`, `M03-47`).

### T-M03-014 · Email channel integration
**Type:** integration · **Tier:** P0
**PRD rows:** M03-20
**Requirements (verbatim):**
- **M03-20** (P0) — **Email is a channel: the tenant connects a sending identity it controls, and campaigns send from it.** The identity is the tenant's own address and domain; the product requires whatever proof of control the channel demands before the first send, and shows that requirement as an `action needed` state rather than failing at send time. Unsubscribe handling is mandatory on every campaign email and feeds the suppression list (`M03-47`).
**DONE WHEN:**
- Given the email channel, when a campaign sends on it, then it sends from the tenant's own proven sending identity and every message carries an opt-out affordance that feeds the suppression list (`M03-20`, `M03-47`).

### T-M03-015 · Business messaging (WhatsApp) channel integration
**Type:** integration · **Tier:** P0
**PRD rows:** M03-21
**Requirements (verbatim):**
- **M03-21** (P0) — **Business messaging (WhatsApp) is a channel: the tenant connects its own business number, owns its reputation, and campaigns send from it.** Sending requires a template registered with the channel and approved (`M03-39`); the pack declares the registration duty and the consent class (`F1-15`; IN instance `F1-38`). This is the capability `D32` withheld from v1 and `registers/conflicts.md` row 4 assigns here — **for campaigns**; the transactional lane is unchanged (`M03-03`).
**DONE WHEN:**
- Given a connected business-messaging channel with no approved template, when a campaign on it is scheduled, then scheduling is refused and the registration state is named (`M03-21`, `M03-39`).

### T-M03-016 · SMS channel integration
**Type:** integration · **Tier:** P0
**PRD rows:** M03-22
**Requirements (verbatim):**
- **M03-22** (P0) — **SMS is a channel: the tenant connects its own sender identity and campaigns send from it.** Where the market requires registered sender headers and templates, that registration gates **activation, not scope** — the capability exists and the channel activates when the registration clears (`F1-38`'s activation-clock law consumed; the India DLT instance is the reference case and its content stays in the pack).
**DONE WHEN:**
- Given the SMS channel in a market whose pack requires registered sender identities and templates, when that registration has not cleared, then the channel exists and is inactive with its registration state named — the capability is never withheld from scope (`M03-22`).

### T-M03-017 · Facebook/Instagram channel integration
**Type:** integration · **Tier:** P0
**PRD rows:** M03-23
**Requirements (verbatim):**
- **M03-23** (P0) — **Facebook and Instagram are channels in two distinct senses, and the product keeps them apart:** (a) the tenant connects its own page/account as an **identity**, and (b) that identity's **lead forms** deliver enquiries into capture (§M03.4) — and only forms with a **required phone field** are connectable (owner ruling 2026-08-04, Q35; `M03-19`/`M03-33`). Campaign *spend* on a social network settles **tenant-direct with the network** — the product neither holds the budget nor bills for those sends, and says so on the surface (`BM-21`'s explicit boundary: "channels where spend settles tenant-direct with the ad network … are not platform meters"). What the product owns is the connection, the capture, the attribution and the reporting.
**DONE WHEN:**
- Given a social channel, when its campaign surface renders, then no platform meter and no spend figure the product does not control is shown (`M03-23`).

### T-M03-018 · Campaign link tracking
**Type:** engine · **Tier:** P1
**PRD rows:** M03-35
**Requirements (verbatim):**
- **M03-35** (P1) — **A campaign-tagged link is the product's own tracking, and it carries no personal data.** Links a campaign sends carry a reference to the campaign that sent them, so an arriving enquiry can be attributed to it. The reference is opaque and identifies a campaign, never a person: **no customer data in any URL** and **no third-party scripts, fonts or analytics** on any customer-facing page (`F5-77`, `DOC08.open-tracking` consumed). Where a tenant's own external tagging convention is used, the product carries it as data on the link and reads it back on capture; it does not build a second analytics system.
**DONE WHEN:**
- Given a campaign-tagged link, when it is inspected, then it identifies a campaign and carries no customer data, and the page it opens loads no third-party script (`M03-35`).

### T-M03-019 · Campaign reporting publication & exports
**Type:** engine · **Tier:** P1
**PRD rows:** M03-57, M03-58
**Requirements (verbatim):**
- **M03-57** (P1) — **Cross-campaign and cross-channel reporting is `modules/M13`'s; this module owns the campaign-local view.** What this module publishes for M13 to report on is fixed here: campaign identity, channel, audience size, send outcomes, captures, and the correlation caveat that must travel with any figure derived from them. M13 may not present those figures without the caveat (`M03-53`, `F8-30`).
- **M03-58** (P1) — **Campaign records export, always.** A campaign's audience-level result, its capture list and its send report export in the suite's standard export path, in every billing state — export always works (`BM-32` consumed). Exports carry the same caveat text as the screen, because a figure that leaves the product without its caveat is the failure `F8-31` exists to prevent.
**DONE WHEN:**
- Given a campaign export, when it is produced, then it succeeds in every billing state and carries the same caveat text as the screen (`M03-58`).
- The PRD carries no dedicated Given/When/Then citing `M03-57`; the verbatim row above is the acceptance baseline for the published-figures contract (campaign identity, channel, audience size, send outcomes, captures, with the correlation caveat travelling on every derived figure).

## Laws (enforced through screens and review, no standalone build)

- **M03-01** (P0) — **This module is the superseding specification for `D13`'s deferred capture channels.** Website forms, inbound business-messaging, social lead forms, email replies and SMS replies are lead-capture channels of this product, specified in §M03.3 and §M03.4. `D13` is not overturned as a reading of v1 — it continues to govern `modules/M02`, which specifies none of these channels (`M02-17`) — it is superseded **as scope**, by the brief, under design spec §2 `DD2`. The contradiction is recorded at `registers/conflicts.md` **row 3** and is not re-resolved here.
  *Enforced by:* the capture-channel builds this scope authorizes — T-M03-007, T-M03-010, T-M03-012, T-M03-014–T-M03-017 — and PRD review against the PRD's own check: "Given `registers/conflicts.md` row 3 or row 4, when a reader follows its "owner of the superseding specification" pointer, then this document states the supersession explicitly, names `DD2` as the authority, and names the superseded `D`-decision (`M03-01`, `M03-02`)." No standalone build.
- **M03-02** (P0) — **This module is the superseding specification for `D32`'s no-sending rule, in the campaign lane only.** The product sends marketing messages on the tenant's behalf, from channel identities the tenant owns (§M03.3), metered per send (§M03.6). `D32` is superseded **as scope for campaigns**, by the brief, under `DD2`; the contradiction is recorded at `registers/conflicts.md` **row 4** and is not re-resolved here.
  *Enforced by:* the campaign sending builds this scope authorizes — T-M03-004, T-M03-006, T-M03-011, T-M03-013, T-M03-014–T-M03-016 — and PRD review against the same check as `M03-01` above (it covers both rows). No standalone build.
- **M03-03** (P0) — **Two lanes, both real (owner ruling 2026-08-04, Q33).** The **campaign lane** is unchanged: this module's promotional sending, metered and consent-gated as specified here. The **transactional lane now exists product-wide**: the one-to-one customer moments the v1 source held composed-not-sent — `modules/M06`'s proposal share, `modules/M02`'s message action (`M02-33`), visit confirmation (`M02-47`) and no-show reminder (`M02-48`), `modules/M08`'s handover pack, and `foundations/F5`'s customer moments (`F5-14`, `F5-16`, `F5-48`) — **send automatically from the tenant's connected official channel** (the same connection §M03.3 establishes), under the **utility/transactional template class the pack's rules define**, distinct from the marketing lane's consent and metering; **copy-paste composition is the fallback** wherever no channel is connected, and on that path no delivery is claimed. `D32`'s manual-only rule is fully retired (`registers/conflicts.md` rows 4 and 8 carry the resolution notes). The campaign lane never carries a transactional moment, and a transactional send never burns the marketing meter.
  *Enforced by:* architecture review across lanes — campaign machinery (T-M03-011, T-M03-013) never carries a transactional moment and the marketing meter (T-M03-004, T-M03-013) is never burned by a transactional send; the connections built in T-M03-007 and T-M03-014–T-M03-017 are the ones the transactional lane rides, whose surfaces are other modules' tasks (e.g. `docs/tasks/M02-crm-leads.md` T-M02-013). Review against the PRD's own check: "Given any transactional surface listed in `M03-03`, when it produces a customer message with a connected channel present, then the message sends from the tenant's official channel under the transactional template class with honest delivery states; and given no connected channel, then it composes for copy-paste and claims no delivery (`M03-03`, owner ruling 2026-08-04 Q33)."
  *Complete lane membership — the row's enumeration is illustrative, not the lane's routing table.* The verbatim cell above enumerates the one-to-one moments **the v1 source held composed-not-sent**: that list is the set `D32` governed, not the full set of moments the transactional lane now carries, and it is not rewritten here. Three further moments ride the same lane and carry the Q33 send **in their own PRD requirement cells**, independently of this row, each citing `M03-03` as the lane's authority: (a) `modules/M08`'s payment request — `M08-38`, whose cell states the tap "sends from the tenant's connected transactional channel where one exists (owner ruling 2026-08-04, Q33)" and names payment links a transactional moment (built at `docs/tasks/M08-projects.md` T-M08-002); (b) `modules/M11`'s payment link and its request message — `M11-24`/`M11-26`/`M11-52`, routed onto the lane by `docs/prd/modules/M11-payments-and-collections.md` §5's Q33 non-goal bullet (built at `docs/tasks/M11-payments-collections.md` T-M11-002 and T-M11-011); and (c) `modules/M04`'s could-not-complete message — `M04-58`, whose cell carries the same Q33 send (built at `docs/tasks/M04-survey.md` T-M04-006). `modules/M08`'s handover pack, which the cell above does name, is `M08-46` (`docs/tasks/M08-projects.md` T-M08-006). The PRD check quoted above therefore reads over that whole membership: "any transactional surface listed in `M03-03`" is any moment on the lane, not only the moments this row's illustrative list happens to name. **Not resolved here:** `M11-24`/`M11-26`'s requirement cells still state the pre-Q33 copy-only rule ("no send capability … no delivery state anywhere on the surface") while the same document's §5 routes the identical objects onto the lane — a PRD-internal contradiction recorded at `registers/conflicts.md` **row 10**, with neither cell rewritten by this suite.
- **M03-05** (P0) — **No AI feature is invented here.** The brief's instruction is carried as a law of this module: *"Do not invent AI features beyond what is supported or clearly proposed; identify additional ideas separately as recommendations."* The voice-AI follow-up capability the brief preserves is `modules/M07`'s and is `SRC` (`M03-25`). Any marketing-side automation or generation beyond the brief's sentence appears **only** as a `REC` row (`M03-16`, `M03-17`, `M03-37`, `M03-43`), tagged as a recommendation and mirrored in `registers/enhancements.md` — never as core scope, never phrased as though the corpus or the brief asked for it.
  *Enforced by:* scope review — REC rows stay in `docs/prd/registers/enhancements.md` and no task in this file builds them — against the PRD's own check: "Given any requirement in this module that proposes generation or automation beyond the brief's sentence, when its tag is read, then it is `REC` and it appears in `registers/enhancements.md` (`M03-05`)."
- **M03-06** (P0) — **Every compliance rule this module obeys is market-pack data, and this document restates no market's rules.** Template/sender registration duties, consent and do-not-disturb classes, opt-out semantics and their honoring deadline, and any messaging send window are read from `pack.calling-rules`, whose communications-compliance ruleset covers **voice and messaging** and names marketing surfaces as a consumer (`F1-15` consumed). Packs are platform-authored and never tenant-editable; a tenant configures within the floor, never around it (`F1-12`). The launch market's own registration scheme is `F1-38` — **named as a pack instance and never restated**: a market's scheme, sender class, window or consent class may be *pointed at* by its pack key (as `M03-22` and `M03-39` do), and its content stays in the pack for the reader who needs it.
  *Enforced by:* pack-data reads in T-M03-013 and the channel integrations T-M03-014–T-M03-017; code review rejects any hardcoded market rule, against the PRD's own check: "Given any compliance behaviour in this module, when its source is traced, then it resolves to a `pack.calling-rules` key and not to a rule written in this document (`M03-06`)."
- **M03-07** (P0) — **Nothing this module captures becomes a second pipeline.** Every enquiry it produces is handed to `modules/M02` — into the same unassigned inbox, through the same dedupe sheet, with its own source badge — and this module holds no stage, no owner, no qualification and no close state. What it keeps is the campaign-side record: which campaign captured the enquiry, on which channel, and when (§M03.4).
  *Enforced by:* T-M03-012 (the single hand-off path) and review against the PRD's own check: "Given an enquiry captured by any channel here, when it is created, then it exists in `modules/M02`'s unassigned inbox and nowhere else as a pipeline record (`M03-07`)." No M03-owned pipeline structures exist in any task in this file.
- **M03-18** (P0) — **Every channel is a tenant-owned identity the tenant connects — the platform never sends from an identity of its own.** The tenant's own sender address, number, page or account is what a recipient sees; the tenant owns the identity, its registration and its **reputation**, and keeps it if they leave. The competitive verdict this generalises states it for business messaging in exactly those terms — *"BYO-WABA … (tenant owns the number and reputation)"* — and this module applies the same capability frame to **every** channel: connect an identity you own, in your name, revocable by you. The mechanics of any one provider's connection flow are implementation, not product (§14 of the design spec); vendor names appear only as the identity a channel *is* (a business-messaging account, a social page), never as a required integration path.
  *Enforced by:* the channel integrations T-M03-014–T-M03-017 (tenant identity only, no platform identity) and the connection flow of T-M03-007; review against the PRD's own check: "Given any channel, when its connection is read, then it names a tenant-owned identity and the product sends from no identity of its own (`M03-18`)."
- **M03-33** (P0) — **Every connectable lead-capture form requires the phone field — phone-as-identity is unbroken (owner ruling 2026-08-04, Q35).** The phone number is **mandatory on every lead-capture form this module connects** — website form, Facebook/Instagram lead forms, and any form-bearing channel — and **a form without a required phone field cannot be connected** (the connection flow refuses it, naming the reason). Every form capture therefore arrives with a phone and meets the dedupe sheet normally (`M03-32`); the formerly specified "unverified identity — no phone" incomplete-lead path is **not built**. Channel *replies* on an already-sent campaign (email/SMS) attribute to the recipient record they answer, which carries its phone. The owner chose data integrity over form-fill rate — deliberately, against the standing recommendation.
  *Enforced by:* the connection-flow refusal built in T-M03-007 (per `M03-19`), the lead-form connectability condition in T-M03-017, and the required phone field on the website form in T-M03-010. The §M03.4 acceptance line citing `M03-33` describes the pre-ruling unverified-identity path that the row text states is not built; the row text above (owner ruling 2026-08-04, Q35) is the binding criterion.
- **M03-42** (P1) — **Campaign content carries the tenant's branding, not the platform's.** The tenant's brand on customer-facing marketing content follows the same law as every other customer-facing surface — tenant branding is all-tiers, and unbranded/custom-domain presentation is the Enterprise white-label option whose routing `foundations/F5` designs (`F7-07`, `F5-81`–`F5-83` consumed).
  *Enforced by:* content rendering in T-M03-003 and T-M03-010 and the channel sends of T-M03-014–T-M03-016; review. No dedicated Given/When/Then line exists for M03-42 in the PRD's acceptance blocks; the requirement text above is the binding criterion.
- **M03-51** (P0) — **Paid social spend is never a platform meter and never touches this product's money path.** Ad budget on a social network settles tenant-direct with that network (`BM-21`'s explicit boundary). The product shows no spend figure it does not control, bills nothing for those sends, and makes no claim about their delivery.
  *Enforced by:* T-M03-017 (no spend figure on any surface) and the metering enforcement of T-M03-004/T-M03-013, which meters only the `BM-21` channels (business messaging, SMS, email) and never social; review against the PRD's own check: "Given a paid-social campaign, when its surfaces render, then no platform meter is burned and no spend figure the product does not control is displayed (`M03-51`)."
- **M03-54** (P0) — **The caveat renders beside the number, never behind an interaction.** The correlation statement is persistent on-screen content adjacent to the figure it qualifies — not a tooltip, an info icon, a hover state, or a link elsewhere (`F8-31` consumed; `DOC10.n-rules` N1's no-hover-only-meaning law via `foundations/F7`).
  *Enforced by:* T-M03-006 (the caveat as persistent adjacent content on Campaign Performance) and T-M03-019 (the caveat travelling in published figures and exports); review against the PRD's own check: "Given any campaign impact figure, when it renders, then a correlation statement renders beside it as persistent on-screen content, and no revenue or generated-deal claim appears (`M03-53`, `M03-54`)."

## Realized elsewhere

- **M03-16** (P2) — **Multi-step nurture sequences — recommended enhancement, not v1 scope.** A campaign in this release is one audience, one content, one send moment (`M03-12`). A sequence — several steps with waits and branch-on-response between them — is the obvious next ask and is **recommended**, not specified: it would need its own suppression, consent-recheck and metering semantics at every step, and the brief asks for campaigns rather than journeys. Mirrored in `registers/enhancements.md`; rationale there.
  *realized-by:* `docs/prd/registers/enhancements.md` (REC, not v1 scope).
- **M03-17** (P2) — **Split (A/B) testing of campaign content — recommended enhancement, not v1 scope.** Sending two content variants to slices of one audience and reporting the difference is standard in the category and is **recommended**; it is not in the brief, and it interacts with this module's correlation-only reporting law (`M03-53`) — a variant comparison is still correlation, and would need to say so. Mirrored in `registers/enhancements.md`; rationale there.
  *realized-by:* `docs/prd/registers/enhancements.md` (REC, not v1 scope).
- **M03-25** (P0) — **Inbound voice remains a live capture channel and stays entirely `modules/M07`'s.** The brief preserves it — *"Existing voice AI follow-up capabilities from the source documentation should remain part of the product"* — and this module specifies nothing about it: the agent's behaviour, its number, its compliance gate, its call ledger and its capture flow are `modules/M07`'s (`M07-47`, `M07-48`, `M07-27`), and the lead it creates is `modules/M02`'s (`M02-14`). It appears in this module's channel picture so the marketing view of "which channels are live" is complete, and campaign reporting may show enquiries that arrived by voice — attributed, never claimed as a campaign send.
  *realized-by:* `docs/prd/modules/M07-sales-execution.md` (M07-47, M07-48, M07-27) and M02-14; appears on Channel Health (SCR-M03-08, T-M03-008).
- **M03-37** (P2) — **Automatic hand-off of a campaign capture into the voice agent's follow-up queue — recommended enhancement, not v1 scope.** The voice agent exists (`modules/M07`) and campaign captures are exactly the enquiries it was built to chase, so routing them into its queue automatically is the obvious next step and is **recommended**: it is not in the brief (which asks that voice AI follow-up *remain*, not that it be newly triggered), it would create an automated outbound touch from a marketing consent rather than an enquiry the customer initiated, and it would have to pass `modules/M07`'s compliance gate (`M07-27`) unchanged. Mirrored in `registers/enhancements.md`; rationale there.
  *realized-by:* `docs/prd/registers/enhancements.md` (REC); `docs/prd/modules/M07-sales-execution.md` would own implementation.
- **M03-43** (P2) — **AI-assisted campaign content drafting — recommended enhancement, not v1 scope.** Generating subject lines, message copy or variant suggestions from a prompt is the category's most common AI feature and is **recommended**, not specified: the brief forbids inventing AI beyond what is supported or clearly proposed (`M03-05`), and any such feature would additionally need the market's AI-disclosure posture settled (register `Q6` names the disclosure floor question). Mirrored in `registers/enhancements.md`; rationale there.
  *realized-by:* `docs/prd/registers/enhancements.md` (REC; Q6 disclosure floor an input).

## Disposition index

| Row | Disposition |
|---|---|
| M03-01 | LAW |
| M03-02 | LAW |
| M03-03 | LAW |
| M03-04 | T-M03-006 |
| M03-05 | LAW |
| M03-06 | LAW |
| M03-07 | LAW |
| M03-08 | T-M03-001 |
| M03-09 | T-M03-011 |
| M03-10 | T-M03-002 |
| M03-11 | T-M03-002 |
| M03-12 | T-M03-004 |
| M03-13 | T-M03-011 |
| M03-14 | T-M03-006 |
| M03-15 | T-M03-003 |
| M03-16 | realized-by: docs/prd/registers/enhancements.md (REC, not v1 scope) |
| M03-17 | realized-by: docs/prd/registers/enhancements.md (REC, not v1 scope) |
| M03-18 | LAW |
| M03-19 | T-M03-007 |
| M03-20 | T-M03-014 |
| M03-21 | T-M03-015 |
| M03-22 | T-M03-016 |
| M03-23 | T-M03-017 |
| M03-24 | T-M03-010 |
| M03-25 | realized-by: docs/prd/modules/M07-sales-execution.md (M07-47, M07-48, M07-27) and M02-14; appears on Channel Health (SCR-M03-08) |
| M03-26 | T-M03-006 |
| M03-27 | T-M03-007 |
| M03-28 | T-M03-007 |
| M03-29 | T-M03-008 |
| M03-30 | T-M03-012 |
| M03-31 | T-M03-012 |
| M03-32 | T-M03-012 |
| M03-33 | LAW |
| M03-34 | T-M03-013 |
| M03-35 | T-M03-018 |
| M03-36 | T-M03-008 |
| M03-37 | realized-by: docs/prd/registers/enhancements.md (REC); modules/M07 would own implementation |
| M03-38 | T-M03-003 |
| M03-39 | T-M03-009 |
| M03-40 | T-M03-009 |
| M03-41 | T-M03-003 |
| M03-42 | LAW |
| M03-43 | realized-by: docs/prd/registers/enhancements.md (REC; Q6 disclosure floor an input) |
| M03-44 | T-M03-004 |
| M03-45 | T-M03-004 |
| M03-46 | T-M03-013 |
| M03-47 | T-M03-013 |
| M03-48 | T-M03-013 |
| M03-49 | T-M03-006 |
| M03-50 | T-M03-005 |
| M03-51 | LAW |
| M03-52 | T-M03-008 |
| M03-53 | T-M03-006 |
| M03-54 | LAW |
| M03-55 | T-M03-006 |
| M03-56 | T-M03-006 |
| M03-57 | T-M03-019 |
| M03-58 | T-M03-019 |
