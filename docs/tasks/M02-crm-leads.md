# M02 · CRM & Leads — engineering tasks

This file covers module M02 — CRM & leads: quick add and phone-as-identity, duplicate detection and the dedupe sheet, capture channels and the lead source, bulk import, the lead inbox and triage, assignment, lead detail with contacts and the activity timeline, qualification and disqualification, site-visit booking, the R9 lead lifecycle, customer merge, and the capture-channel policy behind M01's settings surface. Task-id prefix: `T-M02-`. Source doc: `docs/prd/modules/M02-crm-and-leads.md` (rows M02-01 … M02-67). Screen briefs live in `docs/ux/briefs/` (SCR-M02-01 … SCR-M02-06); six screen tasks carry one screen each, eleven engine/integration/policy tasks carry the non-screen builds, two rows are laws enforced through screens and review, and one context row is realized by other rows. Every row's disposition is indexed at the end of this file.

---

### T-M02-001 · Quick Add Lead screen

**Type:** screen · **Tier:** P0
**PRD rows:** M02-01 (P0), M02-03 (P0), M02-05 (P0), M02-06 (P0)
**DESIGN:** SCR-M02-01 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M02-01-quick-add-lead.md`; they are the specification.
**DONE WHEN:**

- Given the quick-add screen, when it renders, then exactly four fields are present and no further required field exists anywhere in the flow (M02-01).
- Given a capture carrying only a phone number, when it is saved, then a lead exists and its missing fields are shown as named gaps (M02-03).
- Given a lead captured with type = commercial & industrial, when a proposal is later created from it, then the segment travels with the lead and is not re-asked (M02-05).
- Given any surface, when the primary add action is used, then quick add opens in one tap and the duplicate check runs live on the phone field (M02-06).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M02-002 · Lead Inbox screen

**Type:** screen · **Tier:** P0
**PRD rows:** M02-23 (P0), M02-24 (P0), M02-25 (P1), M02-28 (P0), M02-29 (P0), M02-67 (P0)
**DESIGN:** SCR-M02-02 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M02-02-lead-inbox.md`; they are the specification. **Exception — `M02-67`:** the row was added to `docs/prd/modules/M02-crm-and-leads.md` §M02.5 by owner ruling 2026-08-15 (register `Q63`), restoring the law of `M02-26`, which was deleted 2026-08-07 with the offline capability and stays deleted; the restoring row deliberately carries a new id. The brief now quotes it in full (verified byte-identical to the live cell), so the brief remains the specification for every row of this task without exception; the quote is repeated here for a reader working from the task file alone. *(This sentence read "does not yet quote it… until the brief owner carries it across" — true at the moment it was written, and false within minutes: the brief and this file were amended in the same 2026-08-15 wave.)*

- **M02-67** (P0) — **Triage actions are completed by the server, and the inbox says so rather than assuming.** Assigning a lead and marking one junk — `M02-24`'s two decisions — reach the server to complete; until it confirms, the row shows the action **in progress, never as done**, and a failure returns the lead to the queue naming the reason (`F8-36`). This is an honesty rule, not a confirmation step: `M02-28`'s one-tap assign stands and no dialog is added, and `M02-24`'s under-three-seconds triage binds this state too — the pending treatment is light and in-row, never a blocking overlay or a spinner wall (`F4-27`). The case it exists for is two people triaging the same lead: the second sees it already assigned rather than overwriting the first.

**DONE WHEN:**

- Given leads captured through different channels, when the inbox renders, then all appear in one queue, newest first, each with its source badge (M02-23).
- Given any inbox row, when it is acted on, then assign and mark-junk are each reachable in a single tap and no other action is required to clear the row (M02-24).
- Given a tenant with no leads, when the inbox renders, then it states what will appear and how a lead arrives (M02-25).
- Given the assign picker, when it opens, then every candidate shows their current open-lead count and overdue count, and choosing one assigns in a single tap with no confirm step (M02-28).
- Given any lead, when assignment is opened from the inbox or from lead detail, then the same picker with the same figures is used; and given a multi-selection in the inbox, then one target assigns them all (M02-29).
- Given an assign or a mark-junk, when the tap is made, then the row shows the action in progress and never as done until the server confirms it; and on failure the lead returns to the queue with the reason named (M02-67, `F8-36`, owner ruling 2026-08-15 `Q63`).
- Given that pending state, when it renders, then it is an in-row treatment that leaves the row operable — no blocking overlay, no spinner wall — and triage still completes in under three seconds per lead (M02-67, M02-24, `F4-27`).
- Given two people triaging the same lead, when the second acts, then they see it already assigned rather than overwriting the first (M02-67).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M02-003 · Leads List screen

**Type:** screen · **Tier:** P0
**PRD rows:** M02-40 (P0)
**DESIGN:** SCR-M02-03 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M02-03-leads-list.md`; they are the specification.
**DONE WHEN:**

- Given a monthly bill captured, when the leads list is sorted or filtered by it, then it behaves as data in the tenant's currency (M02-40).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M02-004 · Lead Detail screen

**Type:** screen · **Tier:** P0
**PRD rows:** M02-32 (P0), M02-34 (P0), M02-39 (P0), M02-42 (P0)
**DESIGN:** SCR-M02-04 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M02-04-lead-detail.md`; they are the specification.
**DONE WHEN:**

- Given a lead, when detail opens, then the header carries name, phone, city, value, stage and owner, the timeline and the six sections are present, and the five actions are available (M02-32).
- Given a second contact captured with a role label, when the customer is next matched on that contact's number, then deduplication treats it as the same customer (M02-34, M02-02).
- Given a lead, when qualification is opened, then the six items are answerable inline on the lead with no separate form and no submit step, and partial answers are saved (M02-39).
- Given a disqualify action, when no reason from the six is chosen, then the action cannot complete; and when it completes, then the reason is on the record and in the win/loss list (M02-42).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M02-005 · Lead Import Wizard screen

**Type:** screen · **Tier:** P0
**PRD rows:** M02-18 (P0), M02-19 (P0), M02-20 (P0), M02-21 (P0)
**DESIGN:** SCR-M02-05 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M02-05-lead-import-wizard.md`; they are the specification.
**DONE WHEN:**

- Given an uploaded file, when the mapping step opens, then each column carries an auto-guessed lead field that can be corrected, and no row has been imported yet (M02-18).
- Given a file of 400 rows of which 90 match existing customers by phone, when the preview renders, then it states both counts before any import runs (M02-19).
- Given duplicates in the preview, when they are resolved, then the same three-choice sheet is used, skip is the default, and "create anyway" requires the audited reason per row (M02-20).
- Given a running import, when the person leaves the screen and returns, then progress or the finished report is shown, listing each rejected row with its reason and the count that landed (M02-21).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M02-006 · Customer Merge screen

**Type:** screen · **Tier:** P0
**PRD rows:** M02-59 (P0), M02-63 (P0)
**DESIGN:** SCR-M02-06 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M02-06-customer-merge.md`; they are the specification.
**DONE WHEN:**

- Given two customer records for the same person, when merge is run, then one survivor holds every contact, lead, proposal, link, activity, task and file, and the loser exists as a tombstone pointing at the survivor (M02-59, M02-60).
- Given the merge confirm step, when it renders, then it states what will move, what the loser becomes and that the act cannot be undone, and the merge runs only after explicit confirmation (M02-63).
- Given an actor who can see only one of the two records, when merge is attempted, then it is unavailable with the reason stated (M02-63).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M02-007 · Customer identity & compliance fields on the customer record

**Type:** engine · **Tier:** P0
**PRD rows:** M02-02, M02-37
**Requirements (verbatim):**

- **M02-02** (P0) — **The phone number is the customer's identity.** A customer is unique per tenant on their phone number; the number is captured and stored to the market's phone specification supplied by `pack.formats` (`F1-21`) and carries international-dialling (E.164) semantics so identity survives any market, any formatting habit and any import. Deduplication matches on the customer's number **and on the numbers of that customer's additional contacts** (M02-34). No other field is an identity.
- **M02-37** (P0) — **The customer record carries calling-compliance state from day one: consent, do-not-disturb status, the do-not-call flag, a complaint-set permanent quiet flag, and preferred language.** These fields live on this module's customer record because the compliance gate reads one row per dial; the gate itself, its scrub freshness and its refusals are `modules/M07-sales-execution.md`'s, and the statutory ruleset behind them is pack data (`F1-36`). A "stop calling" is irreversible without the customer's own say-so. **Consent-ledger cross-ref (owner ruling 2026-08-04, Q36):** beside these voice fields, the customer record carries the per-contact **per-channel messaging consent ledger** — opt-in source + timestamp auto-recorded at capture, opt-outs honored suite-wide — owned by `modules/M03` (`M03-34`/`M03-46`); campaign sends auto-filter on it and proof is one tap.

**DONE WHEN:**

- Given a phone number typed in any local formatting, when the lead is saved, then the stored identity is the pack-normalised international form and a second capture of the same number in a different formatting is detected as the same customer (M02-02).
- Given a second contact captured with a role label, when the customer is next matched on that contact's number, then deduplication treats it as the same customer (M02-34, M02-02).
- Given a customer record, when it is opened, then consent, do-not-disturb status, do-not-call, quiet flag and preferred language are present and readable by the gate (M02-37).

---

### T-M02-008 · Duplicate detection & the shared dedupe sheet

**Type:** engine · **Tier:** P0
**PRD rows:** M02-07, M02-08, M02-09, M02-10, M02-11, M02-12, M02-66
**Requirements (verbatim):** `M02-66` was added to `docs/prd/modules/M02-crm-and-leads.md` §M02.2 by owner ruling 2026-08-15 (register `Q62`), restoring the law of `M02-04`, which was deleted 2026-08-07 with the offline capability and stays deleted; the restoring row deliberately carries a new id. It is realized on `SCR-M02-01` (the capture the sheet fires over) and on `SCR-M02-04` (the possible-duplicate flag and the sheet on the next open of either record); both briefs now quote it in full (verified byte-identical to the live cell); the quote below is repeated for a reader working from the task file alone. *(This sentence read "neither brief quotes it yet" — true when written and false within minutes, as both briefs were amended in the same 2026-08-15 wave.)*

- **M02-07** (P0) — **The duplicate check runs on capture, from every channel, before anything is saved.** Not nightly, not on a report, not as a cleanup task: *"Dedupe on capture, every time, from every channel."* The check matches the captured number against existing customers' numbers and their contacts' numbers (M02-02).
- **M02-08** (P0) — **The dedupe sheet shows the existing record with the three facts that make the decision obvious: who owns it, what stage it is at, and when it was last contacted.** The source's own example is the acceptance shape: *"Priya Sharma from Nashik already exists, owned by Rajesh, last contacted 4 days ago."* The sheet shows the existing record even where the person capturing cannot otherwise see it — with owner name, stage and last-contact date only, never the record's contents — because the whole purpose is to stop a second rep chasing the same customer. **Final (owner ruling 2026-08-04, Q23):** the three-fact disclosure is confirmed exactly as specified — no file access, and cross-scope Open-existing resolves to a request-to-owner.
- **M02-09** (P0) — **The sheet offers exactly three choices, and the third demands a reason: Open existing · Log enquiry on existing · Create anyway (reason mandatory, audited).** There is no fourth choice and no silent default; dismissing the sheet leaves nothing created.
- **M02-10** (P0) — **One sheet, three entry points: manual quick add, the import preview, and inbound voice-agent capture.** The same sheet with the same three choices is what fires wherever a capture meets an existing number — *"Sheet on capture from every channel"* — so a person learns it once. Inbound-capture use is M07's call flow reaching this module's sheet.
- **M02-11** (P0) — **"Log enquiry on existing" records the enquiry on the existing record and never creates a second lead.** The enquiry lands on the existing lead's timeline as an activity naming the channel, the time and what was captured, and the existing owner is notified so the next call is theirs to make. Nothing about the existing lead's stage, owner or assignment changes.
- **M02-12** (P0) — **"Create anyway" requires a reason, audits it, and links the two records.** The reason is mandatory free text, recorded on both records' timelines with who chose it and when, and joins the audit log (`F2-22`). Both records then exist and each shows the other, because a deliberate duplicate is exactly the input the merge flow (§M02.11) exists to resolve later.
- **M02-66** (P0) — **A duplicate the live check could not see is resolved explicitly, never silently.** `M02-07`'s check runs *before* the save, so two captures of the same number in the same moment can both pass it and the server finds the collision only on apply. When it does, **both records are flagged "possible duplicate" and each shows the other** (the linkage `M02-12` already builds), the standard three-choice sheet (`M02-09`) fires on the next open of either record, and **nothing is ever merged automatically** — a capture is never silently discarded and never silently joined to another record. Where the person cannot see the other record under their visibility scope, the flag still shows and Open-existing resolves to a request-to-owner, exactly as `M02-08` provides.

**DONE WHEN:**

- Given a capture on any channel whose number matches an existing customer or contact, when the capture is attempted, then the sheet fires before anything is saved (M02-07, M02-10).
- Given the sheet, when it renders, then it names the existing record's owner, stage and last contact date, and offers exactly the three choices (M02-08, M02-09).
- Given "Log enquiry on existing", when it is chosen, then one activity is appended to the existing lead, its owner is notified, no second lead exists, and the existing lead's stage and owner are unchanged (M02-11).
- Given "Create anyway", when no reason is entered, then the confirm is unavailable; and when a reason is entered and confirmed, then both records exist, each references the other, and an audit entry records who, why and when (M02-12).
- Given two captures of the same number applied in the same moment, so that neither saw the other in the live check, when the server finds the collision on apply, then both records are flagged "possible duplicate", each shows the other, nothing is merged automatically, and the three-choice sheet fires on the next open of either record (M02-66, owner ruling 2026-08-15 `Q62`).
- Given a possible-duplicate flag on a record the viewer cannot see under their visibility scope, when the sheet fires, then the flag still shows and Open-existing resolves to a request-to-owner (M02-66, M02-08).

---

### T-M02-009 · Capture channels: source set, inbound-call intake & referral link

**Type:** engine · **Tier:** P0
**PRD rows:** M02-13, M02-14, M02-16
**Requirements (verbatim):**

- **M02-13** (P0) — **The v1 lead-source set is closed and every lead carries its source: manual quick add · file import · inbound call · referral.** The badge is shown wherever a lead is listed, so triage can see at a glance where the enquiry came from. **Post-overlay note carried in-row:** the data model's own row marks referral dormant alongside the deferred channels; `R15` rules the referral tag live in v1, so **only** the website and business-messaging sources stay out (M02-17). The overlay wins; recorded, not silently reconciled. **Suite note (Task 26, closing Task 21 convention 7's flagged reconciliation):** *closed* is `D13`'s claim about the **v1-source** set only — `modules/M03`'s brief-scoped captures extend the suite's badge set (`M03-31`: website form · business messaging · email · SMS · social lead form) under exactly the license this module grants at `M02-17`; a reader meeting `M03-31` first holds two consistent sentences.
- **M02-14** (P0) — **Inbound-call capture creates a lead in the same inbox, through the same dedupe sheet.** When nobody picks up, the voice agent answers and captures name, city, bill amount and interest; what it captures lands as a lead with source = inbound call, carries the agent's capture into the timeline, and meets the dedupe sheet exactly as a typed capture does (M02-10). The agent's behaviour, its number and its call record are `modules/M07-sales-execution.md`'s.
- **M02-16** (P0) — **Referral is a live v1 source: a referral links the referring customer to the referred lead, and both records say so.** The referred lead carries source = referral with a "came from" chip naming the referrer; the referrer's record shows who they referred. Referrals are visible in win/loss analytics (`modules/M13`). **The credits ledger is a spec-locked exclusion — no monetary credit, no redemption and no balance exists in v1** (§5). The handover-time "ask for a referral" prompt is `modules/M08-projects.md`'s.

**DONE WHEN:**

- Given any lead, when it is listed anywhere, then a source badge from the closed v1 set is shown (M02-13).
- Given an unanswered inbound call, when the agent captures an enquiry, then a lead exists with source = inbound call, its capture appears on the timeline, and a matching existing number raises the same dedupe sheet (M02-14).
- Given a lead created from an existing customer's referral, when either record is opened, then the link is visible on both and the referred lead carries the "came from" chip; and when any surface in the product is inspected, then no credit balance, redemption or monetary reward exists (M02-16).

---

### T-M02-010 · Call-back window, attempt log & dial suppression

**Type:** engine · **Tier:** P0
**PRD rows:** M02-15, M02-43, M02-44
**Requirements (verbatim):**

- **M02-15** (P0) — **A lead may be captured at any hour; a call-back is never scheduled before the market's calling window opens.** Capture is never rate-limited by the clock — an enquiry at any time of night is recorded — but any resulting call-back task or agent queue item is scheduled no earlier than the window's opening on the tenant's timezone. The window is the market pack's statutory floor (`pack.calling-rules`, `F1-36`), enforced by the compliance gate (M07); this module supplies the capture and the scheduling intent, never an exception to the floor.
- **M02-43** (P0) — **A customer who does not answer produces a logged attempt and a scheduled retry; after three failed manual attempts the lead is handed to the voice agent.** The attempt log and the retry are this module's; the hand-off trigger and everything after it are `modules/M07-sales-execution.md`'s.
- **M02-44** (P0) — **A wrong number is disqualified with that reason and no further calls are placed to it.** The reason is one of the six (M02-42); the number is flagged so neither a person nor the agent dials it again.

**DONE WHEN:**

- Given an enquiry captured outside the market's calling window, when a call-back is created, then it is scheduled no earlier than the window's opening on the tenant's timezone, and no dial is attempted before it (M02-15).
- Given a call that is not answered, when the outcome is logged, then an attempt is recorded and a retry scheduled; and given a third failed manual attempt, then the lead is handed to the agent (M02-43).
- Given a wrong number disqualification, when it completes, then no further dial to that number is offered or scheduled by any surface (M02-44).

---

### T-M02-011 · Assignment history & assignee notification

**Type:** engine · **Tier:** P0
**PRD rows:** M02-30, M02-31
**Requirements (verbatim):**

- **M02-30** (P0) — **Assignment history is append-only and records the load snapshot; a reassignment records why.** Every assignment writes an entry naming who assigned, to whom, when, and **the assignee's open-lead count at that moment**; the lead's current owner is a separate fact from that trail. Bulk reassignment — a rep goes on leave — writes the same entries with the reason, and the timeline shows it.
- **M02-31** (P0) — **The assignee is notified.** A newly assigned lead notifies its new owner (the notification type registers with `foundations/F6-notifications-and-search.md`).

**DONE WHEN:**

- Given any assignment, when it completes, then an append-only entry records who, to whom, when and the assignee's open-lead count at that moment, and the new owner is notified (M02-30, M02-31).

---

### T-M02-012 · Activity timeline service

**Type:** engine · **Tier:** P0
**PRD rows:** M02-35, M02-36
**Requirements (verbatim):**

- **M02-35** (P0) — **One append-only timeline per lead and customer, rendered as a single stream.** Its kinds include notes, logged calls, agent calls, stage changes, assignments, proposal events, link opens, survey submissions, design events, sign-off events, payments, documents, task events and system events; its actor may be a person, the agent, the system or the customer. Every module writes into this one stream; nothing edits or deletes an entry.
- **M02-36** (P0) — **Activity logging preserves capture time, and never loses a concurrent edit silently.** When a call outcome, a note or a visit status is logged, the time it was captured is preserved for display and audit while server apply order decides ordering (`F4-19`); a lead's field edits resolve per-field last-writer-wins **with an activity entry for every applied change**, so a lost concurrent edit is always visible (`F4-16`).

**DONE WHEN:**

- Given any lead event from any module, when it occurs, then one append-only entry appears in the single timeline naming its kind and actor, and no surface can edit or delete it (M02-35).
- Given an activity logged, when it is applied, then its capture time is preserved; and given two concurrent edits to the same field, then one wins by server apply order and both are visible as activity entries (M02-36).

---

### T-M02-013 · Transactional message send & copy-paste fallback

**Type:** integration · **Tier:** P0
**PRD rows:** M02-33, M02-47, M02-48
**Requirements (verbatim):**

- **M02-33** (P0) — **The message action sends through the tenant's connected transactional channel where one exists, and composes copy-paste text as the fallback (owner ruling 2026-08-04, Q33 — D32's manual-only rule retired).** With a connected official WhatsApp/SMS channel (the same connection `modules/M03` campaigns use), the composed customer message sends from that channel under the transactional/utility template class, and the channel's delivery states are shown honestly; with no channel connected, the action produces ready-to-paste text (and, where a document is involved, the file to attach) for the rep to send from their own device — and on that fallback path no delivery state is ever claimed.
- **M02-47** (P0) — **Booking produces the visit-confirmation message and sends it through the tenant's connected transactional channel where one exists; copy-paste is the fallback (owner ruling 2026-08-04, Q33).** The composed message carries what the source's customer-side requires — what is happening, when, who is coming and their number. With a connected channel it sends automatically under the transactional template class with honest delivery states; with none, the rep sends the ready-to-paste text from their own device and no delivery is claimed.
- **M02-48** (P1) — **A no-show reschedules, and the customer gets exactly one reminder — not five.** The reschedule flow is one action from the visit on the lead; the single reminder rides M02-47's send rule — automatic through the tenant's connected transactional channel, copy-paste fallback when none is connected (owner ruling 2026-08-04, Q33) — and no surface may generate a second one for the same visit.

**DONE WHEN:**

- Given the message action with a connected transactional channel, when it is used, then the message sends from the tenant's official channel with its delivery state shown honestly; and given no connected channel, then the product produces text to send from the rep's own device and no delivery state is claimed (M02-33, owner ruling 2026-08-04 Q33).
- Given a completed booking with a connected transactional channel, when the confirmation is produced, then it sends from the tenant's official channel with honest delivery states; and given no connected channel, then it is text the rep sends themselves and the product claims no delivery (M02-47, owner ruling 2026-08-04 Q33).
- Given a no-show, when the reschedule flow is used, then a new visit is booked and at most one reminder is generated for that visit (M02-48).

---

### T-M02-014 · Site-visit booking hand-off to survey

**Type:** integration · **Tier:** P0
**PRD rows:** M02-46
**Requirements (verbatim):**

- **M02-46** (P0) — **Booking a site visit from the lead captures date, time, surveyor and a confirmed address, and creates the visit that `modules/M04-survey.md` owns from that moment.** This module owns the booking act and the lead-side record of it; the visit object, its states, the surveyor's capture flow and everything on site are M04's. Survey capability is not a gatekeeper — anyone holding it can be the surveyor (`D15`, cited).

**DONE WHEN:**

- Given a lead, when a visit is booked, then date, time, surveyor and confirmed address are captured, a visit exists for the survey module, and the booking appears on the lead's timeline (M02-46).

---

### T-M02-015 · Lead lifecycle state machine (R9): funnel, parking & terminal states

**Type:** engine · **Tier:** P0
**PRD rows:** M02-41, M02-49, M02-50, M02-51, M02-52, M02-53, M02-54, M02-55, M02-56, M02-57, M02-58
**Requirements (verbatim):**

- **M02-41** (P0) — **The funnel is: new → contacted → qualified → survey → design → proposal → negotiating → won.** Stage is a property of the lead, moved by the work that happens to it; the parking and terminal states — snoozed, dormant, disqualified, lost, junk — are the R9 machine's (§M02.10) and are orthogonal to this line.
- **M02-49** (P0) — **This section is the single definition of the lead's parking and terminal states, and no screen invents a timer.** The ruling is explicit: *"this table is the single definition"* — every timer that was scattered across the source's capture, qualify and follow-up stages is superseded by the seven states below wherever they disagree. Two facts bind all of them: **every wake-up lands at 09:00 on the tenant's timezone**, and **no state ever deletes a lead**.
- **M02-50** (P0) — **Unassigned.** Entry: a lead exists with no owner. Timer: **more than twenty-four hours unassigned escalates to the owner — a notification; the state itself does not change.** Exit: assignment moves it to Assigned at stage `new`. Surfaced in the lead inbox and on the owner dashboard's "needs you" list (`modules/M13`).
- **M02-51** (P0) — **Snoozed.** Entry: a user action carrying a **mandatory** wake-up date. Rule: the lead is **hidden from My Day until the wake date**. Exit: at **09:00 on the wake date** it returns to its prior stage **with a follow-up task**, or a person wakes it early with **"Wake up now"**. Surfaced as a chip on lead detail reading **"Snoozed till …"**. Snooze is a first-class action, not a workaround: *"if the product cannot represent that cleanly, reps keep it in their head — that is how pipeline leaks."*
- **M02-52** (P0) — **Dormant.** Entry: **thirty days with zero activity on any open stage.** Rule: a nightly sweep flags it and **never deletes it**. Exit: **any activity returns it to its stage**, or a person reopens it explicitly. Surfaced as a filter on the leads list and **excluded from My Day**.
- **M02-53** (P0) — **Disqualified.** Entry: a user action with a **mandatory reason** from the six of M02-42. Timer: none. Exit: **reopen returns the lead to its prior stage with history kept.** Surfaced in the win/loss "disqualified early" list (`modules/M13`).
- **M02-54** (P0) — **Lost.** Entry: mark lost with a **mandatory reason** from the seven the close surface offers — price · chose competitor · postponed · not reachable · roof unsuitable · financing failed · **not interested** (the seventh, added by owner ruling 2026-08-04, Q21). Rules: **reason = postponed auto-resurfaces the lead on the given date** (at 09:00 tenant-local per M02-49); **reason = not interested suppresses the no-call task for six months** — exactly the suppression R9 intends, now owned by the Lost state's own reason. Exit: reopen returns it to its prior stage. Surfaced in the win/loss "lost late" list (`modules/M13`). The disqualify six (M02-42) are unchanged.
- **M02-55** (P0) — **Junk.** Entry: a user action. Rule: it **leaves all queues and is never deleted.** Exit: reopen, which is rare but exists. Surfaced **in search only** (`foundations/F6-notifications-and-search.md`).
- **M02-56** (P0) — **Reopened.** Entry: an action on a Lost, Disqualified, Dormant or Junk lead. Rule: it **enters at its prior funnel stage**; the timeline records the reopen and reopens are counted. Nothing about the closed period is erased — the reason, its date and who closed it stay on the record.
- **M02-57** (P0) — **Reaching `won` creates the project; there is no separate "create project" step.** The mark-won surface and its fields are `modules/M07-sales-execution.md`'s and the project itself is `modules/M08-projects.md`'s; this module owns the transition and the fact that it is atomic with project creation — *"a won deal is a project. Asking someone to re-enter the customer is how data diverges."*
- **M02-58** (P0) — **Each state is surfaced exactly where the ruling says, and nowhere else.** Unassigned in the lead inbox and the owner's "needs you"; Snoozed as the lead-detail chip and hidden from My Day; Dormant as a leads filter and excluded from My Day; Disqualified and Lost in their win/loss lists; Junk in search only. A state that is excluded from a surface is genuinely absent from it — never greyed, never counted in its totals.

**DONE WHEN:**

- Given a lead moving through the sales process, when its stage changes, then it follows the eight-stage funnel and parking states remain orthogonal to it (M02-41).
- Given any timer in this module, when it fires, then it fires at 09:00 on the tenant's timezone, and given any state transition, then the lead record still exists afterwards (M02-49).
- Given an unassigned lead, when twenty-four hours pass, then the owner is notified and the lead's state is unchanged; and when it is assigned, then it enters Assigned at stage `new` (M02-50).
- Given a snooze, when no wake-up date is given, then the action cannot complete; and given a snoozed lead, then it is absent from My Day until 09:00 on its wake date, when it returns to its prior stage with a follow-up task — or immediately, if "Wake up now" is used (M02-51).
- Given a lead with no activity for thirty days on an open stage, when the nightly sweep runs, then it is flagged dormant, excluded from My Day, filterable in the leads list and still present; and when any activity occurs, then it returns to its stage (M02-52).
- Given a disqualification, when it completes, then a reason from the six is recorded, no timer exists, and reopening returns the lead to its prior stage with history intact (M02-53).
- Given a lead marked lost with reason postponed, when the given date arrives, then it resurfaces at 09:00 tenant-local; and given a lead marked lost with reason *not interested* — the seventh Lost reason per owner ruling 2026-08-04 (Q21) — then no call task is raised for six months (M02-54).
- Given a lead marked junk, when any queue is inspected, then it is absent from all of them, it is findable in search, and it still exists (M02-55).
- Given a reopen from any of Lost, Disqualified, Dormant or Junk, when it completes, then the lead re-enters at its prior funnel stage and the timeline records the reopen (M02-56).
- Given a lead reaching won, when the transition completes, then a project exists for it without any further step and without re-entering the customer (M02-57).
- Given each state, when the surfaces named in the ruling are inspected, then it appears on those and on no others (M02-58).

---

### T-M02-016 · Merge execution: re-point, tombstone, audit, money-free

**Type:** engine · **Tier:** P0
**PRD rows:** M02-60, M02-61, M02-62
**Requirements (verbatim):**

- **M02-60** (P0) — **Merge is: pick the survivor, re-point every reference to it, and mark the loser merged — never deleted.** Contacts, leads, proposals, links, activities, tasks and files that pointed at the loser point at the survivor afterwards; the loser record remains as a tombstone pointing at the survivor, so an old reference still resolves to something true. Field-level survivor choices — which name, which city, which primary contact — are made explicitly in the flow, never guessed.
- **M02-61** (P0) — **The merge keeps a full audit trail.** What was merged into what, by whom, when, and each field-level survivor choice, recorded on the survivor's timeline and in the audit log (`F2-22`). The tombstone carries the same record, so the history of the losing record is not orphaned.
- **M02-62** (P0) — **A merge touches no money.** No proposal figure, no tranche, no payment, no discount and no total changes as a result of a merge — the ruling's consequence is that the operation is **provably** money-free, and this module states it as an acceptance obligation rather than an assumption. Sent documents keep the figures and versions they were built with regardless (`F8-15`).

**DONE WHEN:**

- Given two customer records for the same person, when merge is run, then one survivor holds every contact, lead, proposal, link, activity, task and file, and the loser exists as a tombstone pointing at the survivor (M02-59, M02-60).
- Given a completed merge, when the survivor's timeline and the audit log are read, then they record what was merged, by whom, when, and each field-level survivor choice (M02-61).
- Given any money figure on either record before a merge, when the merge completes, then every proposal figure, tranche, payment, discount and total is unchanged (M02-62).

---

### T-M02-017 · Capture-channel policy behind the settings surface

**Type:** policy · **Tier:** P0
**PRD rows:** M02-17, M02-64, M02-65

The settings surface itself is M01's (SCR-M01-22, `docs/ux/briefs/SCR-M01-22-capture-settings.md`); this task builds what it renders — the channel registry, each channel's true state, the toggle semantics, and the later-card facts for deferred channels.

**Requirements (verbatim):**

- **M02-17** (P0) — **Website forms and inbound business-messaging are not lead channels in this module.** `D13` defers both; they appear on capture settings as **"later" cards, never as toggles** (M02-65). **Supersession hand-off, recorded not resolved:** the V2 brief adds a marketing module that captures leads across email, business messaging, social and SMS and feeds them into the sales pipeline — which supersedes `D13`'s deferral **as brief scope, in `modules/M03-marketing.md`, not here**. M02 specifies none of those channels; whatever M03 lands arrives in this module's inbox (M02-23), carries its own source badge, and passes through this module's dedupe sheet (M02-10) unchanged. The v1-source-vs-brief tension is recorded in `registers/conflicts.md` **row 3** (first dispositioned by Task 3 at `DOC00.nongoal-lead-channels`; written into the register by Task 13), with `DD2`'s brief-driven supersession named as the resolution and `modules/M03` named as the owner of the superseding spec.
- **M02-64** (P0) — **This module owns the channel set and what a toggle does; M01 owns the settings surface.** A channel toggle governs **new capture only**: turning a live channel off stops new leads arriving through it and never hides, alters or deletes a lead already captured through it — the source badge on existing leads survives the toggle. Turning the inbound-call channel off is a capture decision here and is distinct from the agent's own configuration (`modules/M07`). At least the manual channel is always available, because it is the path onboarding hands the first lead to (`M01-26`).
- **M02-65** (P0) — **A channel that does not exist is never advertised as one.** Website forms and inbound business-messaging render as **"later" cards, not teasers**, carrying no toggle, no form snippet and no number field — the source's capture-settings screen listed a form snippet and a messaging number for channels this release does not have, and that over-promise is **not carried**. The screen distinguishes live from not-yet rather than advertising.

**DONE WHEN:**

- Given capture settings, when it renders, then website and business-messaging appear as later cards with no toggle and no capture path exists for them anywhere in this module (M02-17).
- Given a live channel toggled off, when the leads already captured through it are inspected, then they are unchanged and still carry their source badge, and no new capture arrives through that channel (M02-64).
- Given capture settings, when it renders, then deferred channels appear as later cards with no toggle, no snippet and no number field (M02-65).

---

## Laws (enforced through screens and review, no standalone build)

- **M02-27** (P0) — **Assignment is manual. There is no auto-routing and no rules engine in v1.** The source's assign screen offers "pick a rep, or use a rule"; the rule half is superseded — *"Assignment is manual, with each rep's open load visible at the moment of assigning. No auto-routing rules in v1"* — and `UXG-04` states the design consequence plainly: **"no rules engine."** Round-robin, territory routing and load balancing are non-goals (§5), not unbuilt features.
  *Enforced by:* the assign picker built in T-M02-002 / T-M02-011 offering only a manual choice, and product-wide review against the PRD's own check: "Given the product as a whole, when it is inspected, then no auto-assignment, round-robin or routing rule exists on any surface (M02-27)."
- **M02-38** (P1) — **A lead's estimated value is a forecast input and is never revenue.** It renders as a weighted-pipeline input wherever it is shown, carries its provenance and provisional state like any other money figure, and never appears in a won total.
  *Enforced by:* M13's forecast surfaces (which own the weighted-pipeline reading) and the shared money rendering rules of `docs/prd/foundations/F8-data-honesty.md` (`F8-23`, `F8-12`); review of any surface that totals revenue. No dedicated Given/When/Then line exists for M02-38 in the PRD's acceptance blocks; the requirement text above is the binding criterion.

---

## Realized elsewhere

- **M02-45** (P1) — **A renting customer is usually disqualified — with the landlord captured as a contact if offered.** The product does not decide it for them: the reason exists in the six, and the landlord contact exists on the record, so a rented roof that can still be sold is not thrown away.
  *realized-by:* M02-42 (the "renting" disqualify reason, T-M02-004) and M02-34 (additional contacts with role labels such as landlord, T-M02-004).

---

## Disposition index

| Row | Disposition |
|---|---|
| M02-01 | T-M02-001 |
| M02-02 | T-M02-007 |
| M02-03 | T-M02-001 |
| M02-05 | T-M02-001 |
| M02-06 | T-M02-001 |
| M02-07 | T-M02-008 |
| M02-08 | T-M02-008 |
| M02-09 | T-M02-008 |
| M02-10 | T-M02-008 |
| M02-11 | T-M02-008 |
| M02-12 | T-M02-008 |
| M02-13 | T-M02-009 |
| M02-14 | T-M02-009 |
| M02-15 | T-M02-010 |
| M02-16 | T-M02-009 |
| M02-17 | T-M02-017 |
| M02-18 | T-M02-005 |
| M02-19 | T-M02-005 |
| M02-20 | T-M02-005 |
| M02-21 | T-M02-005 |
| M02-23 | T-M02-002 |
| M02-24 | T-M02-002 |
| M02-25 | T-M02-002 |
| M02-27 | LAW |
| M02-28 | T-M02-002 |
| M02-29 | T-M02-002 |
| M02-30 | T-M02-011 |
| M02-31 | T-M02-011 |
| M02-32 | T-M02-004 |
| M02-33 | T-M02-013 |
| M02-34 | T-M02-004 |
| M02-35 | T-M02-012 |
| M02-36 | T-M02-012 |
| M02-37 | T-M02-007 |
| M02-38 | LAW |
| M02-39 | T-M02-004 |
| M02-40 | T-M02-003 |
| M02-41 | T-M02-015 |
| M02-42 | T-M02-004 |
| M02-43 | T-M02-010 |
| M02-44 | T-M02-010 |
| M02-45 | realized-by: M02-42, M02-34 |
| M02-46 | T-M02-014 |
| M02-47 | T-M02-013 |
| M02-48 | T-M02-013 |
| M02-49 | T-M02-015 |
| M02-50 | T-M02-015 |
| M02-51 | T-M02-015 |
| M02-52 | T-M02-015 |
| M02-53 | T-M02-015 |
| M02-54 | T-M02-015 |
| M02-55 | T-M02-015 |
| M02-56 | T-M02-015 |
| M02-57 | T-M02-015 |
| M02-58 | T-M02-015 |
| M02-59 | T-M02-006 |
| M02-60 | T-M02-016 |
| M02-61 | T-M02-016 |
| M02-62 | T-M02-016 |
| M02-63 | T-M02-006 |
| M02-64 | T-M02-017 |
| M02-65 | T-M02-017 |
| M02-66 | T-M02-008 |
| M02-67 | T-M02-002 |
