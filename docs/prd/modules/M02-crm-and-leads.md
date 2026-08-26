# M02 · CRM & leads

Status: draft · Origin mix: SRC/BRIEF (this document carries no `REC` items) · Depends on:
`00-README.md`, `01-product-overview.md`, `02-personas.md`, `foundations/F1-global-market-framework.md`,
`foundations/F2-roles-and-permissions.md`, `foundations/F3-localization.md`,
`foundations/F4-data-integrity.md`, `foundations/F7-design-language.md`,
`foundations/F8-data-honesty.md`, `modules/M01-onboarding-and-tenant-config.md`,
*retired: PRD design note* §2 (DD2, DD3, DD4)

## 1. Purpose & scope

This module is where a customer enters the product and where a deal is either kept alive or
honestly closed. It owns lead capture on every channel the release ships, the duplicate check
that runs before anything is saved, the lead inbox the owner triages each morning,
qualification, assignment, the lead's lifecycle — including the consolidated
snooze / dormant / reopen state machine — and the customer merge that phone-based deduplication
cannot reach.

The module's governing conviction is carried whole from the source: *"The one thing that kills
solar CRMs: duplicates."* A homeowner calls on Monday, fills a form on Tuesday and messages on
Wednesday, and a careless CRM produces three leads, three reps, three proposals and one
confused customer. The rule that prevents it is stated once and binds every capture path in
this document: **"Phone number is the identity. Dedupe on capture, every time, from every
channel"** (`S2.rule.dedupe`). The module's second conviction is the pace it must hold:
capture takes **under thirty seconds on a phone** (`S2.rule.channel.1`), and triage takes
**under three seconds per lead** — *"if triage takes more than three seconds per lead, it will
not get done"* (`S2.rec.1`).

The module owns, as feature areas: quick add and phone-as-identity · duplicate detection and
the dedupe sheet · the capture channels and the lead-source set · the bulk import wizard · the
lead inbox and morning triage · assignment with each rep's open load visible · lead detail,
contacts and the activity timeline · qualification and disqualification · site-visit booking as
a hand-off into survey · the lead lifecycle and its parking/terminal states · customer merge ·
and the capture-settings channel policy behind M01's settings surface.

**What this module is explicitly not.**

- It does **not** define roles or permission cells — `foundations/F2-roles-and-permissions.md`
  is the permission truth. This module names its capability rows (`F2.M02.*`) and never
  restates a matrix (F2-25).
- It does **not** own the voice agent. Inbound capture arrives here as a lead and leaves here
  as a hand-off; the agent's behaviour, triggers, queue, compliance gate and call records are
  `modules/M07-sales-execution.md`'s.
- It does **not** own the survey. Booking a visit creates work that `modules/M04-survey.md`
  owns from that moment — the visit object, the capture flow and its states are M04's.
- It does **not** own proposals, designs, projects or money. A lead reaching `won` starts a
  project (`modules/M08-projects.md`); no requirement here touches a price, a discount, a
  tranche or a payment, and **the merge in §M02.11 is required to touch none of them**.
- It does **not** own campaign channels. Website forms and inbound business-messaging capture
  are not v1 lead channels (`D13`); the V2 brief's marketing module owns campaign capture
  across its channels and hands what it captures into this module's inbox
  (`modules/M03-marketing.md` — §M02.3, §4).
- It does **not** own the settings screen for capture. M01 owns the surface and its honesty
  rule (`M01-58`); this module owns the channel set, each channel's true state, and what a
  toggle does (§M02.12).
- It carries no market facts as constants: phone specifications, currency rendering, calling
  windows and calendars are market-pack data referenced through F1's pack keys (`F1-02`).
- No implementation content: no schemas, job runners, APIs or storage design (design spec
  §14/DD4). Where source rows name mechanisms, this document carries the product law and drops
  the mechanism.

## 2. Personas & surfaces

- **EPC Owner** — the lead inbox is the owner's screen. *"The Lead Inbox is the owner's screen,
  not the rep's"* (`S2.rec.1`): one queue, one decision per lead. The owner also imports from
  a spreadsheet, merges duplicate customers, and receives every unassigned-lead escalation.
- **Sales Manager** — triages and assigns for the team, bulk-reassigns when a rep is away, and
  sees each rep's open load at the moment of assigning.
- **Sales Executive** — the module's highest-frequency persona: quick-adds a lead in the field,
  qualifies on the call, books the visit, snoozes what is not ready, and disqualifies what is
  not real. Own-lead scope (`F2.M02.lead-visibility`).
- **Survey Engineer · Design Engineer** — assigned-scope readers of the lead they are working
  on; they do not capture, assign or close leads.
- **Marketing** — sees its own captures until triage (`F2.M02.lead-visibility`); the capture
  flow itself is `modules/M03-marketing.md`'s.
- **Project Manager · Operations · Finance** — read-side only, through their project and money
  scopes; no lead capture, assignment or state change.
- **Field Technician · Installation Team Member · HR/Admin** — no lead surfaces at all.

**Surfaces.** Web and mobile carry every capability equally (`D2` via `F7-30`), on both mobile
platforms from day one (the `OD-3` surface commitment). Emphasis per feature: quick add,
lead detail, qualification, activity logging, snooze and disqualify are **mobile-first** — they
happen on a call or on a doorstep; the lead inbox, assignment and bulk-assign work at both
breakpoints with the dense multi-select view web-emphasis; the **import wizard is
desktop-first** (`UXG-01` — "the owner at a desk") while remaining usable at the mobile
breakpoint per the parity law (`F7-30`); merge is web-emphasis for the survivor comparison and
one-tap-reachable on mobile from either record.

*Section removed 2026-08-07 by owner decision: the offline/sync capability was deleted.*

Lead **field edits** — including the qualification answers of §M02.8 — resolve per the conflict
policy F4 rules for them: per-field last-writer-wins by server apply order with an activity
entry for every applied change (`F4-16`).

## 3. Feature areas

### M02.1 — Quick add & phone-as-identity

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-01 | **Quick add is four fields and must complete in under thirty seconds on a phone: name, phone number, city, type.** *"Everything else later."* No wizard, no second screen, no required field beyond the four — and of the four only the phone number is structurally required (M02-03). The thirty-second bar is a product requirement measured against `F7-37`'s speed budgets, not an aspiration. | `SRC` — `S2.screen.1` ("Name, phone, city, type. Four fields. Everything else later."); `S2.rule.channel.1` ("Must take <30s on a phone") | P0 |
| M02-02 | **The phone number is the customer's identity.** A customer is unique per tenant on their phone number; the number is captured and stored to the market's phone specification supplied by `pack.formats` (`F1-21`) and carries international-dialling (E.164) semantics so identity survives any market, any formatting habit and any import. Deduplication matches on the customer's number **and on the numbers of that customer's additional contacts** (M02-34). No other field is an identity. | `SRC` — `S2.rule.dedupe` ("Phone number is the identity"); `DOC04.phone-identity-dedupe` (docs/04: unique per tenant on phone number; "dedupe also checks contacts' phone numbers") · phone specification is pack data per `F1-21` (IN instance `F1-49`), never a module constant | P0 |
| M02-03 | **An incomplete lead is still a lead.** A capture carrying only a phone number is accepted and saved; the missing fields are shown as named gaps on the record — "no name yet", "no city yet" — to be filled on first contact. Nothing is rejected for incompleteness and nothing is invented to fill a gap. | `SRC` — `S2.wrong.3` ("Incomplete lead (no name, only a number) → still accepted; missing fields visible as gaps to fill on first contact") | P0 |
| M02-05 | **Every lead carries a segment — residential or commercial & industrial — from the "type" field at capture, and the segment rides the lead through to its proposal.** Both segments are high-volume for the product's buyer; segment is a first-class field from the first thirty seconds, not a proposal-time question. | `SRC` — `D1` ("Residential **and** C&I, both high volume"; docs/15 HONORED — "segment flag through lead/proposal"); `S2.screen.1` (the "type" field) | P0 |
| M02-06 | **Quick add is one tap from the primary add action on every surface.** On mobile it is the shell's elevated centre action; on web it is the primary action on the leads surface. The capture screen itself is a single screen with the duplicate check running live on the phone field as it is typed (M02-07). | `SRC` — `S2.screen.1` ("Live duplicate check on the phone number"); shell placement consumed from `F7-22` (the arc bar's centre action, role-adaptive) | P0 |

**Behavior detail.** Quick add is the product's most-used write and is designed against the
clock: four fields, keyboard-appropriate inputs and no lookups that block typing. The phone field validates against the pack's phone
specification and **normalises rather than scolds** — a number typed with spaces, a leading
zero or a national prefix is normalised to the pack's canonical form, and only a number that
cannot be a phone number at all is refused, with the expected shape stated. The live duplicate
check fires as the number becomes complete (M02-07); it never blocks the save button while it
runs, and where it is still running the save proceeds and the check completes on apply.
"Type" is the segment selector of M02-05 and defaults to the
tenant's declared segment from onboarding (`M01-23`) so the common case is already chosen.
Empty and error states carry F7's teaching contract; the leads surface's own empty state is
M02-25.

Permissions: `F2.M02.add-edit-leads` (EPC Owner · Sales Manager · Sales Executive). Creating a
lead against a detected duplicate additionally requires `F2.M02.dedupe-override`.

**Edge cases & what-goes-wrong.**

- *Only a number, no name* (`S2.wrong.3`) → accepted, gaps shown on the record (M02-03).
- *A number that is not a valid number for the market* → refused at the field with the expected
  shape stated; the rest of the capture is preserved.
- *The same rep opens quick add twice and saves the same number twice* → the second save meets
  the dedupe sheet (M02-07), like any other channel.
- *Two reps capture the same number at the same instant* → both records are flagged "possible
  duplicate" and the rep resolves via the standard three-choice sheet on next open — never an
  automatic merge (M02-09).

**Acceptance criteria.**

- Given the quick-add screen, when it renders, then exactly four fields are present and no
  further required field exists anywhere in the flow (M02-01).
- Given a phone number typed in any local formatting, when the lead is saved, then the stored
  identity is the pack-normalised international form and a second capture of the same number in
  a different formatting is detected as the same customer (M02-02).
- Given a capture carrying only a phone number, when it is saved, then a lead exists and its
  missing fields are shown as named gaps (M02-03).
- Given a lead captured with type = commercial & industrial, when a proposal is later created
  from it, then the segment travels with the lead and is not re-asked (M02-05).
- Given any surface, when the primary add action is used, then quick add opens in one tap and
  the duplicate check runs live on the phone field (M02-06).

**Localization notes.** All four field labels, the gap phrases and the normalisation message are
translated per `F3-01`; the phone specification, its example and its placeholder come from
`pack.formats` (`F1-21`) and are never hard-coded; digits render Latin in every language
(`F3-21`); customer names are never translated (`F3-08`). **Analytics events:** quick add opened
(surface) · quick add saved (duration, channel) · phone normalised · capture
abandoned (field reached).

### M02.2 — Duplicate detection & the dedupe sheet

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-07 | **The duplicate check runs on capture, from every channel, before anything is saved.** Not nightly, not on a report, not as a cleanup task: *"Dedupe on capture, every time, from every channel."* The check matches the captured number against existing customers' numbers and their contacts' numbers (M02-02). | `SRC` — `S2.rule.dedupe`; `S2.wrong.1` ("Duplicate → detected on the phone number, **before saving**"); `DOC04.phone-identity-dedupe` | P0 |
| M02-08 | **The dedupe sheet shows the existing record with the three facts that make the decision obvious: who owns it, what stage it is at, and when it was last contacted.** The source's own example is the acceptance shape: *"Priya Sharma from Nashik already exists, owned by Rajesh, last contacted 4 days ago."* The sheet shows the existing record even where the person capturing cannot otherwise see it — with owner name, stage and last-contact date only, never the record's contents — because the whole purpose is to stop a second rep chasing the same customer. **Final (owner ruling 2026-08-04, Q23):** the three-fact disclosure is confirmed exactly as specified — no file access, and cross-scope Open-existing resolves to a request-to-owner. | `SRC` — `S2.screen.3`; `UXG-02` (the sheet shows "the existing lead (**owner, stage, last contact**)") · minimal cross-scope disclosure applied with no permission changed (`F2-15` stands); confirmed final per owner ruling 2026-08-04 (Q23) | P0 |
| M02-09 | **The sheet offers exactly three choices, and the third demands a reason: Open existing · Log enquiry on existing · Create anyway (reason mandatory, audited).** There is no fourth choice and no silent default; dismissing the sheet leaves nothing created. | `SRC` — `UXG-02` (verbatim: "Open existing / Log enquiry on existing / Create anyway (reason mandatory, audited)"); `S2.screen.3` ("open existing · log as new enquiry on the existing lead · create anyway (needs a reason)") | P0 |
| M02-10 | **One sheet, three entry points: manual quick add, the import preview, and inbound voice-agent capture.** The same sheet with the same three choices is what fires wherever a capture meets an existing number — *"Sheet on capture from every channel"* — so a person learns it once. Inbound-capture use is M07's call flow reaching this module's sheet. | `SRC` — `UXG-02` ("Same sheet reused by import preview and inbound-call capture" — one sheet, three entry points) | P0 |
| M02-11 | **"Log enquiry on existing" records the enquiry on the existing record and never creates a second lead.** The enquiry lands on the existing lead's timeline as an activity naming the channel, the time and what was captured, and the existing owner is notified so the next call is theirs to make. Nothing about the existing lead's stage, owner or assignment changes. | `SRC` — `UXG-02` (the choice itself); `S2.screen.3` ("log as new enquiry on the existing lead"); `DOC04.timeline` (append-only activity stream) · notification type registers with `foundations/F6-notifications-and-search.md` per the UX-gap register's cross-cutting rule | P0 |
| M02-12 | **"Create anyway" requires a reason, audits it, and links the two records.** The reason is mandatory free text, recorded on both records' timelines with who chose it and when, and joins the audit log (`F2-22`). Both records then exist and each shows the other, because a deliberate duplicate is exactly the input the merge flow (§M02.11) exists to resolve later. | `SRC` — `UXG-02` ("Create anyway (reason mandatory, audited)"); `R8`/`UXG-05` (merge as the corrective path) | P0 |
| M02-66 | **A duplicate the live check could not see is resolved explicitly, never silently.** `M02-07`'s check runs *before* the save, so two captures of the same number in the same moment can both pass it and the server finds the collision only on apply. When it does, **both records are flagged "possible duplicate" and each shows the other** (the linkage `M02-12` already builds), the standard three-choice sheet (`M02-09`) fires on the next open of either record, and **nothing is ever merged automatically** — a capture is never silently discarded and never silently joined to another record. Where the person cannot see the other record under their visibility scope, the flag still shows and Open-existing resolves to a request-to-owner, exactly as `M02-08` provides. | `SRC` — restores the law of `M02-04`, deleted 2026-08-07 with the offline capability and re-instated by owner ruling 2026-08-15 (register `Q62`); the rule itself is owner ruling 2026-08-04 `Q22` re-stated without its offline framing, since the race it governs is two **online** reps, not a device that saved alone; instance of `F8-36` at this surface | P0 |

**Behavior detail.** The sheet is the product's single most consequential three-second decision —
*"wrong choice here creates the double-chase problem the spec exists to kill"* (`UXG-02`) — so it
is a sheet, not a page (`F7-21`), it opens over the capture rather than replacing it, and it
never loses what was typed. It renders identically at both breakpoints and from all three entry
points; only its header states which entry point it came from ("This number is already in the
system"). Choosing **Open existing** discards the in-progress capture after confirming and opens
the existing lead. Choosing **Log enquiry** keeps the capture's content as the enquiry's body,
so nothing the customer said is thrown away. Choosing **Create anyway** requires the reason
before the confirm becomes available. Where the person capturing cannot see the existing record
at all under their visibility scope, the sheet still shows the three facts of M02-08 and the
Open-existing choice resolves to a request-to-owner rather than a record they may not read.

Permissions: the sheet itself rides `F2.M02.add-edit-leads`; the third choice requires
`F2.M02.dedupe-override`, held by the same presets so no capture path dead-ends.

**Edge cases & what-goes-wrong.**

- *Duplicate on capture* (`S2.wrong.1`) → detected before saving; the sheet is the whole answer
  (M02-07).
- *Duplicate the capturing person may not see* → owner, stage and last-contact only; no record
  contents leak (M02-08).
- *The same person with a different number* (`S2.wrong.6`) → phone dedupe cannot catch it, by
  construction; §M02.11's merge is the answer, and this is the case it exists for.
- *A junk or lost record is the "existing" match* → the sheet says so in the stage line; Open
  existing lands on the closed record and Reopen (M02-56) is one tap from there.
- *Reason typed but the sheet is dismissed* → nothing is created and nothing is logged.

**Acceptance criteria.**

- Given a capture on any channel whose number matches an existing customer or contact, when the
  capture is attempted, then the sheet fires before anything is saved (M02-07, M02-10).
- Given the sheet, when it renders, then it names the existing record's owner, stage and last
  contact date, and offers exactly the three choices (M02-08, M02-09).
- Given "Log enquiry on existing", when it is chosen, then one activity is appended to the
  existing lead, its owner is notified, no second lead exists, and the existing lead's stage and
  owner are unchanged (M02-11).
- Given "Create anyway", when no reason is entered, then the confirm is unavailable; and when a
  reason is entered and confirmed, then both records exist, each references the other, and an
  audit entry records who, why and when (M02-12).
- Given two captures of the same number applied in the same moment, so that neither saw the other
  in the live check, when the server finds the collision on apply, then both records are flagged
  "possible duplicate", each shows the other, nothing is merged automatically, and the
  three-choice sheet fires on the next open of either record (M02-66, owner ruling 2026-08-15
  `Q62`).
- Given a possible-duplicate flag on a record the viewer cannot see under their visibility scope,
  when the sheet fires, then the flag still shows and Open-existing resolves to a
  request-to-owner (M02-66, M02-08).

**Localization notes.** Sheet copy, the three choice labels and the reason prompt are translated
per `F3-01`; the existing record's name, city and owner name are data and are never translated
(`F3-08`); the "last contacted" relative date renders through the shared date implementation on
the tenant's timezone (`F3-22`). **Analytics events:** dedupe sheet shown (entry point) · choice
taken (open / log enquiry / create anyway) · override reason recorded · sheet dismissed.

### M02.3 — Capture channels & the lead source

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-13 | **The v1 lead-source set is closed and every lead carries its source: manual quick add · file import · inbound call · referral.** The badge is shown wherever a lead is listed, so triage can see at a glance where the enquiry came from. **Post-overlay note carried in-row:** the data model's own row marks referral dormant alongside the deferred channels; `R15` rules the referral tag live in v1, so **only** the website and business-messaging sources stay out (M02-17). The overlay wins; recorded, not silently reconciled. **Suite note (Task 26, closing Task 21 convention 7's flagged reconciliation):** *closed* is `D13`'s claim about the **v1-source** set only — `modules/M03`'s brief-scoped captures extend the suite's badge set (`M03-31`: website form · business messaging · email · SMS · social lead form) under exactly the license this module grants at `M02-17`; a reader meeting `M03-31` first holds two consistent sentences. | `SRC` — `D13` (v1 lead sources: "manual quick-add, CSV import, inbound call via voice agent"); `DOC04.lead-sources` (the source enum, with its "dormant" marking overtaken for `referral` by `R15`); `S2.screen.2` (source badge in the inbox) | P0 |
| M02-14 | **Inbound-call capture creates a lead in the same inbox, through the same dedupe sheet.** When nobody picks up, the voice agent answers and captures name, city, bill amount and interest; what it captures lands as a lead with source = inbound call, carries the agent's capture into the timeline, and meets the dedupe sheet exactly as a typed capture does (M02-10). The agent's behaviour, its number and its call record are `modules/M07-sales-execution.md`'s. | `SRC` — `S2.rule.channel.2` ("voice agent answers when nobody picks. Captures name, city, bill amount, interest"); `UXG-02` (inbound-call capture is the sheet's third entry point); `DOCFC.crm-compliance-day1` (lead sources include inbound call) | P0 |
| M02-15 | **A lead may be captured at any hour; a call-back is never scheduled before the market's calling window opens.** Capture is never rate-limited by the clock — an enquiry at any time of night is recorded — but any resulting call-back task or agent queue item is scheduled no earlier than the window's opening on the tenant's timezone. The window is the market pack's statutory floor (`pack.calling-rules`, `F1-36`), enforced by the compliance gate (M07); this module supplies the capture and the scheduling intent, never an exception to the floor. | `SRC` — `S2.wrong.4` ("Lead arrives at 11pm → voice agent may capture but must not call back until 9am"); floor and window are pack data per `F1-36`/`F1-12`; enforcement `modules/M07` | P0 |
| M02-16 | **Referral is a live v1 source: a referral links the referring customer to the referred lead, and both records say so.** The referred lead carries source = referral with a "came from" chip naming the referrer; the referrer's record shows who they referred. Referrals are visible in win/loss analytics (`modules/M13`). **The credits ledger is a spec-locked exclusion — no monetary credit, no redemption and no balance exists in v1** (§5). The handover-time "ask for a referral" prompt is `modules/M08-projects.md`'s. | `SRC` — `R15` ("the referral tag + 'came from' chip ship in Track A (CRM core); the credits LEDGER is the spec-locked exclusion"); `S2.rule.channel.5` (post-overlay); `UXG-19`; `DOC04.referral-no-credit`; `DOC14.referral-ships` · "Track A" read as v1 scope per `OD-5` | P0 |
| M02-17 | **Website forms and inbound business-messaging are not lead channels in this module.** `D13` defers both; they appear on capture settings as **"later" cards, never as toggles** (M02-65). **Supersession hand-off, recorded not resolved:** the V2 brief adds a marketing module that captures leads across email, business messaging, social and SMS and feeds them into the sales pipeline — which supersedes `D13`'s deferral **as brief scope, in `modules/M03-marketing.md`, not here**. M02 specifies none of those channels; whatever M03 lands arrives in this module's inbox (M02-23), carries its own source badge, and passes through this module's dedupe sheet (M02-10) unchanged. The v1-source-vs-brief tension is recorded in `registers/conflicts.md` **row 3** (first dispositioned by Task 3 at `DOC00.nongoal-lead-channels`; written into the register by Task 13), with `DD2`'s brief-driven supersession named as the resolution and `modules/M03` named as the owner of the superseding spec. | `SRC` — `D13` (website form and inbound WhatsApp deferred; docs/15 HONORED — "later" cards, `UXG-03`); `S2.rule.channel.3`, `S2.rule.channel.4` (the source's channel table lists both without the deferral flag — `D13` governs) · brief supersession per `BRIEF` `docs/prd/owner-brief-2026-08-03.md` §Marketing, owned by `modules/M03` (Task 21) | P0 |

**Behavior detail.** The source set is a closed vocabulary, not a free text field: a lead's
source is set by the path that created it and is not editable afterwards, because the badge is
what makes triage and win/loss analysis trustworthy. Manual capture is M02.1; file import is
M02.4; inbound-call capture is M07's flow reaching M02.2's sheet; referral is set when a lead is
created from a referrer's record or when a referrer is named on an existing lead — either way
the link is bidirectional and appears on both timelines. The referral link is attribution only:
nothing in this module computes, accrues, offsets or redeems anything of value against it
(§5). Deferred channels have no capture path at all in this release — not a disabled one, not a
hidden one — which is why M01-58's surface renders them as later cards rather than dormant
toggles.

Permissions: `F2.M02.add-edit-leads` for manual and referral capture; inbound capture is created
by the agent as a system actor and lands unassigned (M02-50). Import is
`F2.M02.import-leads`.

**Edge cases & what-goes-wrong.**

- *An enquiry arrives outside the calling window* (`S2.wrong.4`) → captured immediately, call-back
  scheduled for the window's opening (M02-15).
- *An inbound call captures only a number and nothing else* → still a lead (M02-03), with the
  gaps named.
- *A referrer is named who is not a customer of this tenant* → the "came from" chip records the
  free-text name without creating a customer record; only an existing customer produces a linked
  referral row.
- *A tenant asks for a website form today* → capture settings tells the truth (later card, no
  toggle — M02-65); nothing in the product pretends the channel exists.
- *A marketing campaign captures a lead* (brief scope) → it arrives in the inbox with its own
  source badge and meets the same dedupe sheet; M03 owns the capture, this module owns what
  happens next (M02-17).

**Acceptance criteria.**

- Given any lead, when it is listed anywhere, then a source badge from the closed v1 set is
  shown (M02-13).
- Given an unanswered inbound call, when the agent captures an enquiry, then a lead exists with
  source = inbound call, its capture appears on the timeline, and a matching existing number
  raises the same dedupe sheet (M02-14).
- Given an enquiry captured outside the market's calling window, when a call-back is created,
  then it is scheduled no earlier than the window's opening on the tenant's timezone, and no
  dial is attempted before it (M02-15).
- Given a lead created from an existing customer's referral, when either record is opened, then
  the link is visible on both and the referred lead carries the "came from" chip; and when any
  surface in the product is inspected, then no credit balance, redemption or monetary reward
  exists (M02-16).
- Given capture settings, when it renders, then website and business-messaging appear as later
  cards with no toggle and no capture path exists for them anywhere in this module (M02-17).

**Localization notes.** Source names and the "came from" chip are translated per `F3-01`;
referrer and customer names are never translated (`F3-08`). The calling-window explanation shown
against a night-time capture names the window in the tenant's timezone through the shared date
implementation (`F3-22`). **Analytics events:** lead created (source) · referral linked ·
call-back deferred to window · later-card viewed.

### M02.4 — Bulk import

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-18 | **Import is a four-step wizard: upload → column mapping → preview → import, ending in a report.** Column mapping **auto-guesses** the mapping from the file's own headers and lets every guess be corrected; nothing is imported before the preview is seen. The wizard is desktop-first because the person doing it is at a desk, and works at both breakpoints (`F7-30`). | `SRC` — `UXG-01` ("upload → column mapping → preview with duplicate count → import report"; "Map columns to lead fields with **auto-guess**"; "Desktop-first (owner at a desk)"); `S2.screen.4`; `S2.rule.channel.6` (bulk from an old spreadsheet — "Every EPC has one"); `DOC14.csv-import` | P0 |
| M02-19 | **The preview states the counts before importing, in the source's own shape: "N rows · M duplicates by phone".** Duplicates are surfaced **before** the import runs, never discovered afterwards — a file of 400 rows containing 90 duplicates says so on the preview screen. | `SRC` — `UXG-01` (preview shows "N rows · M duplicates by phone"); `S2.wrong.5` ("CSV has 400 rows and 90 duplicates → shown before import, not after"); `S2.screen.4` ("shows how many are duplicates **before** importing") | P0 |
| M02-20 | **Duplicates in the preview are skippable, or logged as enquiries on the existing leads — through the same dedupe sheet.** The preview reuses M02.2's sheet rather than inventing an import-only dialog, and offers the same resolution in bulk: skip all duplicates, or log them all as enquiries on their existing leads. Creating duplicates deliberately from an import requires the same audited reason, applied per row. | `SRC` — `UXG-01` ("duplicates are **skippable or logged as enquiries on existing leads**"; "Reuses the UXG-02 dedupe sheet from the import preview"); `UXG-02` | P0 |
| M02-21 | **The import runs as a background job with visible progress and a failure report; a partial success is reported honestly.** The person who started it may leave the screen; progress is visible while it runs and the finished import produces a **report naming every rejected row and why** (unreadable number, missing required column, malformed row). Rows that imported are not rolled back because other rows failed, and the report says exactly how many landed. | `SRC` — `UXG-01` ("import runs as an async background job with **progress + failure report**" — the ledger records the source's job mechanism as engineering detail and the product requirement as async import with visible progress and a failure report) · honest-failure obligation per `F8-36` | P0 |

**Behavior detail.** Bad imports are how a phone-as-identity model gets poisoned — *"bad imports
poison the phone-as-identity dedupe model"* (`UXG-01`) — so the wizard's whole design is to make
the damage visible before it happens. Upload accepts the spreadsheet formats an EPC actually has;
mapping presents each detected column beside its guessed lead field with the first rows shown as
sample values, and requires only the phone column to proceed (M02-03's law applies to imported
rows exactly as to typed ones). The preview is the gate: total rows, rows that will create leads,
rows that duplicate an existing customer by phone, and rows that cannot be read at all, each
count tappable to see the rows behind it. Duplicate resolution defaults to **skip**, the choice
that cannot create a double-chase. Imported leads land unassigned in the inbox (M02-50) with
source = file import, so triage is unchanged by volume. The import's own record — file name, who
ran it, when, and its report — stays on the tenant's import history so a later question about
where 300 leads came from has an answer.

Permissions: `F2.M02.import-leads` (EPC Owner · Sales Manager). Per-row duplicate overrides
additionally require `F2.M02.dedupe-override`.

**Edge cases & what-goes-wrong.**

- *400 rows, 90 duplicates* (`S2.wrong.5`) → both counts on the preview, before the import
  (M02-19).
- *Two rows inside the same file share a number* → counted as duplicates of each other in the
  preview and resolved by the same choice; only one lead is created unless the override reason
  is given.
- *A column cannot be mapped* → the import proceeds without it; unmapped columns are listed in
  the report rather than silently dropped.
- *The connection drops mid-import* → the job continues server-side; the person is told where it
  got to when they return.
- *Every row fails* → the report says so plainly and no lead exists; the product does not report
  success it did not achieve (`F8-36`).

**Acceptance criteria.**

- Given an uploaded file, when the mapping step opens, then each column carries an auto-guessed
  lead field that can be corrected, and no row has been imported yet (M02-18).
- Given a file of 400 rows of which 90 match existing customers by phone, when the preview
  renders, then it states both counts before any import runs (M02-19).
- Given duplicates in the preview, when they are resolved, then the same three-choice sheet is
  used, skip is the default, and "create anyway" requires the audited reason per row (M02-20).
- Given a running import, when the person leaves the screen and returns, then progress or the
  finished report is shown, listing each rejected row with its reason and the count that landed
  (M02-21).

**Localization notes.** Wizard copy, field names in the mapping step, the preview counts and every
report reason are translated per `F3-01`; counts render through the shared number implementation
(`F3-19`). Imported names, cities and free text are data and are never translated (`F3-08`);
imported phone numbers are normalised to the pack specification (`F1-21`). **Analytics events:**
import started (row count) · mapping corrected (field) · preview shown (rows, duplicates) ·
duplicate resolution chosen · import completed (created, skipped, failed).

### M02.5 — The lead inbox & morning triage

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-23 | **The lead inbox is one queue: unassigned and new leads from every channel, newest first, each with its source badge.** Not one queue per channel and not a filter on the main leads list — one place where an untriaged enquiry waits, whatever door it came through. | `SRC` — `S2.screen.2` ("unassigned/new leads from all channels in one queue, newest first, with a source badge. 'The owner's morning triage.'") | P0 |
| M02-24 | **Triage is one decision per lead — assign or bin — and the surface is built for under three seconds each.** *"The Lead Inbox is the owner's screen, not the rep's… Everything else waits. If triage takes more than three seconds per lead, it will not get done."* Each row therefore carries only what the decision needs (name, city, source, age, and the value if known) and both decisions are single-tap: assign (M02-28) or mark junk (M02-55). Everything else about the lead waits for the lead detail. | `SRC` — `S2.rec.1` (quoted); `S2.happy` ("Lead lands in the inbox with its source → owner glances → assigns → rep is notified") | P0 |
| M02-25 | **The empty inbox teaches.** With no leads yet it states what will appear here and how the first one arrives — the first door out of onboarding (`M01-26`) lands on exactly this screen — rather than rendering a blank list. | `SRC` — `S0.happy` (post-onboarding landing: "an empty Leads screen that teaches"; disposed by Task 12 with the quick-add half named as this module's) · empty-state contract per `F7`'s teaching-empty-state law | P1 |
| M02-67 | **Triage actions are completed by the server, and the inbox says so rather than assuming.** Assigning a lead and marking one junk — `M02-24`'s two decisions — reach the server to complete; until it confirms, the row shows the action **in progress, never as done**, and a failure returns the lead to the queue naming the reason (`F8-36`). This is an honesty rule, not a confirmation step: `M02-28`'s one-tap assign stands and no dialog is added, and `M02-24`'s under-three-seconds triage binds this state too — the pending treatment is light and in-row, never a blocking overlay or a spinner wall (`F4-27`). The case it exists for is two people triaging the same lead: the second sees it already assigned rather than overwriting the first. | `SRC` — restores the law of `M02-26`, deleted 2026-08-07 with the offline capability and re-instated by owner ruling 2026-08-15 (register `Q63`); instance of `F8-36`, in the shape `M11-06` uses for money and `M05-09` for designs | P0 |

**Behavior detail.** The inbox is the owner's morning screen and is designed as a queue, not a
report: newest first, no configurable sort that could hide the oldest item, and an age column
that turns the twenty-four-hour escalation (M02-50) into something visible before it fires.
Multi-select is available for the bulk path (M02-29). A lead leaves the inbox the moment it is
assigned or binned; nothing else removes it, and nothing is auto-assigned — there is no routing
rule in this release (M02-27). Leads that reach the inbox from a marketing capture (M02-17)
appear identically, with their own badge. The owner dashboard's "needs you" surface reads the
same unassigned set (`modules/M13`).

Permissions: reading the inbox follows `F2.M02.lead-visibility` (All for EPC Owner, Team for
Sales Manager); assigning requires `F2.M02.assign-leads`; junking requires
`F2.M02.lead-state-changes`.

**Edge cases & what-goes-wrong.**

- *Nobody triages for three days* (`S2.wrong.7`) → each lead older than twenty-four hours
  unassigned escalates to the owner; the state does not change and the lead does not leave the
  inbox (M02-50).
- *A bulk import lands 300 leads at once* → the queue takes them in the same order rule; the
  inbox does not paginate away the oldest.
- *Junk arrives* (`S2.wrong.2`) → one tap removes it from every queue without deleting it
  (M02-55).
- *Two people triage at once* → assignment is server-completed; the second person sees
  the lead already assigned rather than overwriting the first.
- *No leads at all* → the teaching empty state (M02-25).

**Acceptance criteria.**

- Given leads captured through different channels, when the inbox renders, then all appear in one
  queue, newest first, each with its source badge (M02-23).
- Given any inbox row, when it is acted on, then assign and mark-junk are each reachable in a
  single tap and no other action is required to clear the row (M02-24).
- Given a tenant with no leads, when the inbox renders, then it states what will appear and how
  a lead arrives (M02-25).
- Given an assign or a mark-junk, when the tap is made, then the row shows the action in progress
  and never as done until the server confirms it; and on failure the lead returns to the queue
  with the reason named (M02-67, `F8-36`, owner ruling 2026-08-15 `Q63`).
- Given that pending state, when it renders, then it is an in-row treatment that leaves the row
  operable — no blocking overlay, no spinner wall — and triage still completes in under three
  seconds per lead (M02-67, M02-24, `F4-27`).
- Given two people triaging the same lead, when the second acts, then they see it already
  assigned rather than overwriting the first (M02-67).

**Localization notes.** Queue copy, the age phrasing and the empty state are translated per
`F3-01`; ages and dates render through the shared implementation on the tenant's timezone
(`F3-22`); any value shown renders through the money implementation with its provenance and
provisional state intact (`F3-20`, `F3-24`). **Analytics events:** inbox opened · time-to-decision
per lead · assign from inbox · junk from inbox · escalation raised.

### M02.6 — Assignment & the rep's open load

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-27 | **Assignment is manual. There is no auto-routing and no rules engine in v1.** The source's assign screen offers "pick a rep, or use a rule"; the rule half is superseded — *"Assignment is manual, with each rep's open load visible at the moment of assigning. No auto-routing rules in v1"* — and `UXG-04` states the design consequence plainly: **"no rules engine."** Round-robin, territory routing and load balancing are non-goals (§5), not unbuilt features. | `SRC` — `D14` (quoted; docs/15 HONORED — "Assign screen designed at implementation, `UXG-04`; no auto-routing"); `S3.screen.1` (read under `D14` — the "or use a rule" phrase does not survive); `UXG-04` | P0 |
| M02-28 | **Each rep's open-lead count and overdue count are shown at the moment of assigning, and one tap assigns.** *"The load view is the whole feature."* The picker lists the people who can hold a lead, each with their current open-lead count and their overdue count, *"so you do not bury someone"*; choosing one assigns immediately without a confirm step. | `SRC` — `UXG-04` ("rep list with **open-lead count + overdue count shown at assign time**; **single tap assigns**"); `S3.screen.1` ("Shows each rep's current open load so you do not bury someone") | P0 |
| M02-29 | **Assignment is reachable from the lead inbox and from lead detail, and the inbox's multi-select gives bulk assign.** The same picker, the same load figures, applied to one lead or to a selection. | `SRC` — `UXG-04` ("From Lead inbox and Lead detail"; "**Bulk-assign from inbox multi-select**") | P0 |
| M02-30 | **Assignment history is append-only and records the load snapshot; a reassignment records why.** Every assignment writes an entry naming who assigned, to whom, when, and **the assignee's open-lead count at that moment**; the lead's current owner is a separate fact from that trail. Bulk reassignment — a rep goes on leave — writes the same entries with the reason, and the timeline shows it. | `SRC` — `DOC04.assignment-history` (append-only; records the rep's open-lead count snapshot at assign time; current owner separate from the audit trail); `S3.wrong.6` ("Rep goes on leave → owner bulk-reassigns; the timeline records why") | P0 |
| M02-31 | **The assignee is notified.** A newly assigned lead notifies its new owner (the notification type registers with `foundations/F6-notifications-and-search.md`). | `SRC` — `S2.happy` ("assigns → rep is notified") | P0 |

**Behavior detail.** The load figures are the feature: they are computed at the moment the picker
opens, from the same definition of "open" the leads list uses, and the overdue count uses the
same derived-overdue rule the task surfaces use (`DOC04.tasks` — overdue is derived, never
stored; `modules/M07`). A person with no capacity is not blocked from receiving a lead — the
product shows the number and lets a human decide, because the decision is a management act, not
an algorithm (`D14`). Assignment moves a lead out of Unassigned into its owner's list at stage
`new` (M02-50). Bulk assignment applies one target to a selection and reports what it did,
including anything it could not do. A lead can be reassigned any number of times; each
reassignment appends rather than overwriting, so "who had this and when" always has an answer,
including after a person is deactivated (`F2-20` keeps their history attributed).

Permissions: `F2.M02.assign-leads` (EPC Owner · Sales Manager). Assignment targets are the
presets that can hold leads under `F2.M02.lead-visibility`.

**Edge cases & what-goes-wrong.**

- *A rep goes on leave* (`S3.wrong.6`) → bulk reassign from the inbox with the reason recorded on
  every affected timeline (M02-30).
- *The most obvious rep is already buried* → their open and overdue counts say so at the moment
  of choosing; the product warns by showing, never by blocking (M02-28).
- *An assignee is deactivated while holding leads* → their leads are reassigned by the guard-rail
  flow M01 renders (`F2-20`); the history stays attributed to them (M02-30).
- *A bulk assign partially fails* → the result states which leads moved and which did not, and
  why.

**Acceptance criteria.**

- Given the assign picker, when it opens, then every candidate shows their current open-lead
  count and overdue count, and choosing one assigns in a single tap with no confirm step
  (M02-28).
- Given any lead, when assignment is opened from the inbox or from lead detail, then the same
  picker with the same figures is used; and given a multi-selection in the inbox, then one
  target assigns them all (M02-29).
- Given any assignment, when it completes, then an append-only entry records who, to whom, when
  and the assignee's open-lead count at that moment, and the new owner is notified (M02-30,
  M02-31).
- Given the product as a whole, when it is inspected, then no auto-assignment, round-robin or
  routing rule exists on any surface (M02-27).

**Localization notes.** Picker labels, the load and overdue phrases and the reassignment reason
prompt are translated per `F3-01`; counts render through the shared number implementation
(`F3-19`); preset names render localized with the canonical English identity (`F2` §F2.1).
**Analytics events:** assign picker opened (surface) · lead assigned (single / bulk, target load
at assign) · reassignment (reason present).

### M02.7 — Lead detail, contacts & the activity timeline

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-32 | **Lead detail is one screen: a header carrying name, phone, city, value, stage and owner, then the activity timeline, site information, designs, proposals, tasks and files.** Its actions are Call · Message · Log activity · Book visit · Create design. Everything a rep needs before a call is on this screen; nothing that belongs to another module is re-implemented here — designs, proposals and files render as their owning module's summaries. | `SRC` — `S3.screen.2` (header, sections and actions verbatim) · "Proposal" naming per `R1` via `F3-11`; the source's "quote" vocabulary appears nowhere | P0 |
| M02-33 | **The message action sends through the tenant's connected transactional channel where one exists, and composes copy-paste text as the fallback (owner ruling 2026-08-04, Q33 — D32's manual-only rule retired).** With a connected official WhatsApp/SMS channel (the same connection `modules/M03` campaigns use), the composed customer message sends from that channel under the transactional/utility template class, and the channel's delivery states are shown honestly; with no channel connected, the action produces ready-to-paste text (and, where a document is involved, the file to attach) for the rep to send from their own device — and on that fallback path no delivery state is ever claimed. | `SRC` — `S3.screen.2` (the action); `D32` superseded for transactional sending by owner ruling 2026-08-04 (Q33) — `registers/conflicts.md` rows 4/8 annotated; lane boundary at `M03-03` | P0 |
| M02-34 | **A customer carries additional contacts — name, phone and a role label such as decision-maker, landlord or spouse — with exactly one primary.** The role label set is tenant-extendable. Contact numbers participate in deduplication (M02-02), and capturing "who actually decides" is a first-class act on the lead rather than a note. | `SRC` — `DOC04.contacts` (docs/04); `S3.wrong.3` ("Not the decision maker → capture who is, add as a second contact"); `S3.wrong.4` (capture the landlord if offered) | P0 |
| M02-35 | **One append-only timeline per lead and customer, rendered as a single stream.** Its kinds include notes, logged calls, agent calls, stage changes, assignments, proposal events, link opens, survey submissions, design events, sign-off events, payments, documents, task events and system events; its actor may be a person, the agent, the system or the customer. Every module writes into this one stream; nothing edits or deletes an entry. | `SRC` — `DOC04.timeline` (docs/04 — the kinds and actor classes, append-only, "every module writes here") | P0 |
| M02-36 | **Activity logging preserves capture time, and never loses a concurrent edit silently.** When a call outcome, a note or a visit status is logged, the time it was captured is preserved for display and audit while server apply order decides ordering (`F4-19`); a lead's field edits resolve per-field last-writer-wins **with an activity entry for every applied change**, so a lost concurrent edit is always visible (`F4-16`). | `SRC` — `R14` via `F4-16`/`F4-19` (capture-time semantics and conflict policy referenced, never restated) | P0 |
| M02-37 | **The customer record carries calling-compliance state from day one: consent, do-not-disturb status, the do-not-call flag, a complaint-set permanent quiet flag, and preferred language.** These fields live on this module's customer record because the compliance gate reads one row per dial; the gate itself, its scrub freshness and its refusals are `modules/M07-sales-execution.md`'s, and the statutory ruleset behind them is pack data (`F1-36`). A "stop calling" is irreversible without the customer's own say-so. **Consent-ledger cross-ref (owner ruling 2026-08-04, Q36):** beside these voice fields, the customer record carries the per-contact **per-channel messaging consent ledger** — opt-in source + timestamp auto-recorded at capture, opt-outs honored suite-wide — owned by `modules/M03` (`M03-34`/`M03-46`); campaign sends auto-filter on it and proof is one tap. | `SRC` — `DOCFC.crm-compliance-day1` (docs/forward-compat: "Customer records carry consent/DND/do-not-call/preferred-language from day 1 (the compliance gate reads them)"); `DOC04.compliance-flags` (cited — the gate's semantics are `modules/M07`'s); consent-ledger cross-ref per owner ruling 2026-08-04 (Q36) | P0 |
| M02-38 | **A lead's estimated value is a forecast input and is never revenue.** It renders as a weighted-pipeline input wherever it is shown, carries its provenance and provisional state like any other money figure, and never appears in a won total. | `SRC` — `DOC04.forecast-not-revenue` (cited — `modules/M13` owns the forecast surfaces and `D37`'s law); honesty obligations consumed from `F8-23`, `F8-16` | P1 |

**Behavior detail.** Lead detail is the screen a rep opens before dialling, so it is ordered for
that moment: the header answers "who is this and where are we", the timeline answers "what has
already happened", and the actions are what happens next. Section content is owned elsewhere and
summarised here — a design card links into the studio, a proposal card into its module — so this
screen never becomes a second implementation of another module's surface. Contacts are ordered with the primary first; changing the primary is an audited edit like any
other. The timeline is chronological, filterable by kind, and never editable: a correction is a
new entry, which is what makes it usable as an account of what happened.

Permissions: reading follows `F2.M02.lead-visibility`; editing the lead and its contacts requires
`F2.M02.add-edit-leads`; booking a visit requires `F2.M02.book-site-visit`; creating a design or
a proposal rides M05's and M06's rows.

**Edge cases & what-goes-wrong.**

- *Not the decision maker* (`S3.wrong.3`) → capture who is, as a second contact with a role label
  (M02-34).
- *The customer rents* (`S3.wrong.4`) → capture the landlord as a contact if offered, then
  qualify or disqualify on the facts (M02-45).
- *Two people edit the same lead at once* → per-field last-writer-wins, and every applied change
  is an activity entry, so the overwritten value is visible rather than lost (M02-36).
- *A person is deactivated* → their timeline entries stay attributed to them (`F2-20`).
- *A number is marked do-not-call* → recorded on the customer record; the gate refuses the dial
  (M02-37, M07), and this module never offers a path around it.

**Acceptance criteria.**

- Given a lead, when detail opens, then the header carries name, phone, city, value, stage and
  owner, the timeline and the six sections are present, and the five actions are available
  (M02-32).
- Given the message action with a connected transactional channel, when it is used, then the
  message sends from the tenant's official channel with its delivery state shown honestly; and
  given no connected channel, then the product produces text to send from the rep's own device
  and no delivery state is claimed (M02-33, owner ruling 2026-08-04 Q33).
- Given a second contact captured with a role label, when the customer is next matched on that
  contact's number, then deduplication treats it as the same customer (M02-34, M02-02).
- Given any lead event from any module, when it occurs, then one append-only entry appears in
  the single timeline naming its kind and actor, and no surface can edit or delete it (M02-35).
- Given an activity whose capture time precedes its apply time, when it is applied, then its
  capture time is preserved; and given two concurrent edits to the same field, then one wins by
  server apply order and both are visible as activity entries (M02-36).
- Given a customer record, when it is opened, then consent, do-not-disturb status, do-not-call,
  quiet flag and preferred language are present and readable by the gate (M02-37).

**Localization notes.** Section names, action labels, role labels and timeline entry phrasing are
translated per `F3-01`; timeline entries render in the reader's language while the record stays
language-independent (`F3-06`). Customer and contact names and free-text notes are never
translated (`F3-08`); values render through the money implementation with grouping from the pack
(`F3-20`, `F1-21`). **Analytics events:** lead detail opened · action used (call / message / log
/ book visit / create design) · contact added (role) · timeline filtered.

### M02.8 — Qualification & disqualification

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-39 | **Qualification captures six things, inline on the lead, never as a separate form: monthly bill, roof ownership (own or rent), roof type, obvious shading, timeline, and decision maker.** These are the six facts that decide whether a lead is real, and they are answered on the call, in the lead, as the conversation happens. | `SRC` — `S3.screen.3` ("six things that decide whether this is real… Inline, not a separate form"); `S3.happy` ("rep calls within the hour → qualifies on the call"); `DOC04.qualification` (the same six as a form snapshot) | P0 |
| M02-40 | **Monthly bill is captured in the tenant's currency and is sortable and filterable across the leads list.** It is the strongest single qualifier in the product's segment and is treated as data, not as a note. | `SRC` — `DOC04.qualification` ("monthly bill (tenant currency)… sortable/filterable"); one currency per tenant per `F1-07` | P0 |
| M02-41 | **The funnel is: new → contacted → qualified → survey → design → proposal → negotiating → won.** Stage is a property of the lead, moved by the work that happens to it; the parking and terminal states — snoozed, dormant, disqualified, lost, junk — are the R9 machine's (§M02.10) and are orthogonal to this line. | `SRC` — `DOC04.lead-machine` (docs/04, the funnel verbatim); parking/terminal semantics per `R9` | P0 |
| M02-42 | **Disqualifying requires a reason, from the fixed six: renting · budget · not interested · unreachable · already installed · wrong number.** The source states why the list matters: *"The reason list is the most valuable analytics in the product."* Disqualified is a state of the R9 machine (M02-53) — reason mandatory, no timer, reopen returns the lead to its prior stage with history kept. | `SRC` — `S3.screen.5` (the six reasons, verbatim); `R9.disqualified` (reason mandatory — "6 reasons") | P0 |
| M02-43 | **A customer who does not answer produces a logged attempt and a scheduled retry; after three failed manual attempts the lead is handed to the voice agent.** The attempt log and the retry are this module's; the hand-off trigger and everything after it are `modules/M07-sales-execution.md`'s. | `SRC` — `S3.wrong.1` ("log the attempt, auto-schedule a retry; after 3 failed attempts hand to the voice agent"); `D17` (cited — the three-failed-attempts trigger is M07's) | P0 |
| M02-44 | **A wrong number is disqualified with that reason and no further calls are placed to it.** The reason is one of the six (M02-42); the number is flagged so neither a person nor the agent dials it again. | `SRC` — `S3.wrong.2` ("Wrong number → disqualify with that reason, no further calls"); the unverified-number handling on the agent side is `modules/M07`'s (`S7.wrong.4`, cited) | P0 |
| M02-45 | **A renting customer is usually disqualified — with the landlord captured as a contact if offered.** The product does not decide it for them: the reason exists in the six, and the landlord contact exists on the record, so a rented roof that can still be sold is not thrown away. | `SRC` — `S3.wrong.4` ("Rents the property → usually disqualified, but capture the landlord if offered"); `DOC04.contacts` | P1 |

**Behavior detail.** Qualification is inline because it happens during a call: each of the six is
a single control on the lead, saved as it is answered, with no submit step and no penalty for
answering only some. The captured set is a snapshot of what was asked and answered — a later
change is a new value with the timeline recording the change (M02-35), so "we were told the roof
was owned" survives being wrong. Roof ownership, roof type and shading feed the survey and the
design as inputs, not as conclusions: obvious shading captured on a call is `assumed` in the
provenance vocabulary and never renders as a measurement (`F8-02`). Disqualification is available
from the lead detail and from the call-outcome flow; it always asks for the reason first, and the
reason cannot be edited away afterwards — a correction is a reopen (M02-56) followed by a new
close, both on the timeline. The three-attempt count is a property of the lead's call log, so a
lead reassigned mid-sequence does not silently restart it.

Permissions: qualification edits ride `F2.M02.add-edit-leads`; disqualifying, snoozing and
junking ride `F2.M02.lead-state-changes`; mark-won and mark-lost are the close surfaces and are
`modules/M07`'s rows.

**Edge cases & what-goes-wrong.**

- *Customer does not answer* (`S3.wrong.1`) → attempt logged, retry scheduled, agent hand-off at
  three (M02-43).
- *Wrong number* (`S3.wrong.2`) → disqualified with that reason, no further dialling (M02-44).
- *Not the decision maker* (`S3.wrong.3`) → second contact captured (M02-34), qualification
  continues with the right person.
- *Rents the property* (`S3.wrong.4`) → landlord captured if offered; disqualification is a human
  decision with a recorded reason (M02-45).
- *"Call me next month"* (`S3.wrong.5`) → snooze, not a disqualification and not a note in
  someone's head (M02-51).
- *A disqualified lead comes back* → reopen returns it to the stage it left, with the closed
  period visible on the timeline (M02-56).

**Acceptance criteria.**

- Given a lead, when qualification is opened, then the six items are answerable inline on the
  lead with no separate form and no submit step, and partial answers are saved (M02-39).
- Given a monthly bill captured, when the leads list is sorted or filtered by it, then it behaves
  as data in the tenant's currency (M02-40).
- Given a lead moving through the sales process, when its stage changes, then it follows the
  eight-stage funnel and parking states remain orthogonal to it (M02-41).
- Given a disqualify action, when no reason from the six is chosen, then the action cannot
  complete; and when it completes, then the reason is on the record and in the win/loss list
  (M02-42).
- Given a call that is not answered, when the outcome is logged, then an attempt is recorded and
  a retry scheduled; and given a third failed manual attempt, then the lead is handed to the
  agent (M02-43).
- Given a wrong number disqualification, when it completes, then no further dial to that number
  is offered or scheduled by any surface (M02-44).

**Localization notes.** The six qualification labels and the six disqualify reasons are
translated per `F3-01` and are a closed set whose canonical identity is fixed regardless of
display language (`F3-12`); the monthly bill renders through the money implementation with the
pack's symbol and grouping (`F3-20`, `F1-21`). **Analytics events:** qualification item answered ·
qualification completeness at first call · disqualified (reason) · attempt logged · agent
hand-off at three attempts.

### M02.9 — Site-visit booking (hand-off to survey)

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-46 | **Booking a site visit from the lead captures date, time, surveyor and a confirmed address, and creates the visit that `modules/M04-survey.md` owns from that moment.** This module owns the booking act and the lead-side record of it; the visit object, its states, the surveyor's capture flow and everything on site are M04's. Survey capability is not a gatekeeper — anyone holding it can be the surveyor (`D15`, cited). | `SRC` — `S3.screen.4` ("date, time, surveyor, address confirm"); `DOC04.visits` (cited — the visit object is `modules/M04`'s) | P0 |
| M02-47 | **Booking produces the visit-confirmation message and sends it through the tenant's connected transactional channel where one exists; copy-paste is the fallback (owner ruling 2026-08-04, Q33).** The composed message carries what the source's customer-side requires — what is happening, when, who is coming and their number. With a connected channel it sends automatically under the transactional template class with honest delivery states; with none, the rep sends the ready-to-paste text from their own device and no delivery is claimed. | `SRC` — `S3.screen.4` (the message content; its "the app does not send" clause superseded for transactional moments by owner ruling 2026-08-04, Q33); lane boundary at `M03-03` | P0 |
| M02-48 | **A no-show reschedules, and the customer gets exactly one reminder — not five.** The reschedule flow is one action from the visit on the lead; the single reminder rides M02-47's send rule — automatic through the tenant's connected transactional channel, copy-paste fallback when none is connected (owner ruling 2026-08-04, Q33) — and no surface may generate a second one for the same visit. | `SRC` — `S3.wrong.7` ("Site visit no-show → reschedule flow, and the customer gets one reminder, not five"); send channel per owner ruling 2026-08-04 (Q33), superseding the D32 composed-not-sent reading | P1 |

**Behavior detail.** Booking is a lead-side action because it happens on the call that qualified
the lead, and it is deliberately thin: four inputs, one confirm, one composed message. The
surveyor picker lists people holding the survey capability with their day's existing visits
visible, so a double-booking is a visible choice rather than an accident. The booked visit
appears on the lead's timeline and in the surveyor's own day (`modules/M04`); its subsequent
states — in progress, done, could-not-complete — are M04's and are read here, not written. Where
a remote survey is the first pass (`D30`, M04's), no visit is booked at this point at all; the
lead moves to the survey stage without one.

Permissions: `F2.M02.book-site-visit` (EPC Owner · Sales Manager · Sales Executive); the survey
capture itself is `F2.M04.capture-surveys`.

**Edge cases & what-goes-wrong.**

- *No-show* (`S3.wrong.7`) → reschedule in one action; exactly one reminder, sent via the
  connected transactional channel or composed for a person to send where none exists
  (M02-48, Q33 ruling).
- *The surveyor is already booked at that time* → shown at the moment of choosing; the product
  does not silently double-book and does not block a deliberate one.
- *The address is wrong* → corrected at booking; a correction discovered on site updates the site
  record from M04's side.
- *A visit is booked and the lead is then snoozed* → the snooze hides the lead from My Day
  (M02-51) but never cancels a booked visit; the visit remains the surveyor's.

**Acceptance criteria.**

- Given a lead, when a visit is booked, then date, time, surveyor and confirmed address are
  captured, a visit exists for the survey module, and the booking appears on the lead's timeline
  (M02-46).
- Given a completed booking with a connected transactional channel, when the confirmation is
  produced, then it sends from the tenant's official channel with honest delivery states; and
  given no connected channel, then it is text the rep sends themselves and the product claims
  no delivery (M02-47, owner ruling 2026-08-04 Q33).
- Given a no-show, when the reschedule flow is used, then a new visit is booked and at most one
  reminder is generated for that visit (M02-48).

**Localization notes.** Booking labels and the composed confirmation render in the customer's
language where it is known — the message is customer-facing content, so it follows the customer's
preferred language (M02-37) and the tenant's default otherwise (`M01-59`); dates and times render
through the shared implementation on the tenant's timezone (`F3-22`). **Analytics events:** visit
booked (lead stage, lead time-to-visit) · confirmation copied · visit rescheduled · reminder
composed.

### M02.10 — The lead lifecycle: snooze, dormant, reopen

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-49 | **This section is the single definition of the lead's parking and terminal states, and no screen invents a timer.** The ruling is explicit: *"this table is the single definition"* — every timer that was scattered across the source's capture, qualify and follow-up stages is superseded by the seven states below wherever they disagree. Two facts bind all of them: **every wake-up lands at 09:00 on the tenant's timezone**, and **no state ever deletes a lead**. | `SRC` — `R9` (the ruling text, quoted: "this table is the single definition"; "all wake-ups land at 09:00 tenant-local time"); tenant-timezone law per `F1-10`; `DOC14.snooze-jobs` (the same machine from the roadmap side) | P0 |
| M02-50 | **Unassigned.** Entry: a lead exists with no owner. Timer: **more than twenty-four hours unassigned escalates to the owner — a notification; the state itself does not change.** Exit: assignment moves it to Assigned at stage `new`. Surfaced in the lead inbox and on the owner dashboard's "needs you" list (`modules/M13`). | `SRC` — `R9.unassigned` (verbatim row); `S2.wrong.7` ("Nobody triages for 3 days → leads older than 24h unassigned escalate to the owner"); `DOC04.unassigned-inbox` · escalation notification registers with `foundations/F6-notifications-and-search.md` | P0 |
| M02-51 | **Snoozed.** Entry: a user action carrying a **mandatory** wake-up date. Rule: the lead is **hidden from My Day until the wake date**. Exit: at **09:00 on the wake date** it returns to its prior stage **with a follow-up task**, or a person wakes it early with **"Wake up now"**. Surfaced as a chip on lead detail reading **"Snoozed till …"**. Snooze is a first-class action, not a workaround: *"if the product cannot represent that cleanly, reps keep it in their head — that is how pipeline leaks."* | `SRC` — `R9.snoozed` (verbatim row); `S3.wrong.5` ("'Call me next month' → snooze the lead with a wake-up date; it disappears from My Day until then and comes back automatically"); `S3.rec.1` (quoted) | P0 |
| M02-52 | **Dormant.** Entry: **thirty days with zero activity on any open stage.** Rule: a nightly sweep flags it and **never deletes it**. Exit: **any activity returns it to its stage**, or a person reopens it explicitly. Surfaced as a filter on the leads list and **excluded from My Day**. | `SRC` — `R9.dormant` (verbatim row); `S7.wrong.8` ("Customer goes silent for 30 days → auto-move to a dormant state, not deleted") | P0 |
| M02-53 | **Disqualified.** Entry: a user action with a **mandatory reason** from the six of M02-42. Timer: none. Exit: **reopen returns the lead to its prior stage with history kept.** Surfaced in the win/loss "disqualified early" list (`modules/M13`). | `SRC` — `R9.disqualified` (verbatim row); `S3.screen.5` (the six reasons) | P0 |
| M02-54 | **Lost.** Entry: mark lost with a **mandatory reason** from the seven the close surface offers — price · chose competitor · postponed · not reachable · roof unsuitable · financing failed · **not interested** (the seventh, added by owner ruling 2026-08-04, Q21). Rules: **reason = postponed auto-resurfaces the lead on the given date** (at 09:00 tenant-local per M02-49); **reason = not interested suppresses the no-call task for six months** — exactly the suppression R9 intends, now owned by the Lost state's own reason. Exit: reopen returns it to its prior stage. Surfaced in the win/loss "lost late" list (`modules/M13`). The disqualify six (M02-42) are unchanged. | `SRC` — `R9.lost` (verbatim row); `S7.screen.7` (cited — the mark-lost surface is `modules/M07`'s, `M07-63`); `C8.wrong.3` (cited — "They should not then be called for six months"); seventh reason per owner ruling 2026-08-04 (Q21) | P0 |
| M02-55 | **Junk.** Entry: a user action. Rule: it **leaves all queues and is never deleted.** Exit: reopen, which is rare but exists. Surfaced **in search only** (`foundations/F6-notifications-and-search.md`). | `SRC` — `R9.junk` (verbatim row); `S2.wrong.2` ("Junk / wrong number → mark as junk; it leaves the queue but is not deleted") | P0 |
| M02-56 | **Reopened.** Entry: an action on a Lost, Disqualified, Dormant or Junk lead. Rule: it **enters at its prior funnel stage**; the timeline records the reopen and reopens are counted. Nothing about the closed period is erased — the reason, its date and who closed it stay on the record. | `SRC` — `R9.reopened` (verbatim row); `DOC04.lead-machine` ("reopen restores the pre-close stage and counts reopens"); `S7.screen.8` (cited — the reopen surface on the close side is `modules/M07`'s) | P0 |
| M02-57 | **Reaching `won` creates the project; there is no separate "create project" step.** The mark-won surface and its fields are `modules/M07-sales-execution.md`'s and the project itself is `modules/M08-projects.md`'s; this module owns the transition and the fact that it is atomic with project creation — *"a won deal is a project. Asking someone to re-enter the customer is how data diverges."* | `SRC` — `DOC04.lead-machine` ("entering won creates the project in the same transaction"); `S8.rec.1` (cited — `modules/M08`); `S7.screen.6` (cited — `modules/M07`) | P0 |
| M02-58 | **Each state is surfaced exactly where the ruling says, and nowhere else.** Unassigned in the lead inbox and the owner's "needs you"; Snoozed as the lead-detail chip and hidden from My Day; Dormant as a leads filter and excluded from My Day; Disqualified and Lost in their win/loss lists; Junk in search only. A state that is excluded from a surface is genuinely absent from it — never greyed, never counted in its totals. | `SRC` — `R9` ("Surfaced where" column, all seven rows); `S7.rule.my-day` (cited — the My Day surface is `modules/M07`/`modules/M13`'s; the ledger's note carries the exclusion: "snoozed/dormant leads excluded per R9") | P0 |

**Behavior detail.** The machine has two axes and they do not interfere: the funnel stage
(M02-41) says where the deal is, and the state says whether it is in play. Snooze and dormancy
park a lead without losing its stage, which is why waking or reactivating returns it to exactly
where it was rather than to the top of the funnel. Every timer in this section runs on the
tenant's timezone (`F1-10`) and every wake-up lands at 09:00 there — a lead snoozed from another
timezone still wakes on the tenant's morning. The dormancy sweep runs nightly and only flags: it
never closes, never deletes and never notifies the customer. Activity of any kind on a dormant
lead reactivates it, which means a rep who simply calls does not have to remember to un-dormant
anything. Snooze wake-ups create the follow-up task the ruling requires, so a woken lead arrives
with a next action rather than as a row someone must notice. All terminal states preserve the
record whole: the only path that removes a lead from the tenant's data is the explicit delete
capability (`F2.M02.delete-leads`, EPC Owner only), which is deliberately not part of any
automatic flow, and an erasure request under the market's data-rights rules is an anonymisation
that preserves deduplication integrity rather than a row deletion (`F1-57`).

Permissions: `F2.M02.lead-state-changes` for snooze, disqualify, junk and reopen (EPC Owner ·
Sales Manager · Sales Executive, scoped by `F2.M02.lead-visibility`); dormancy is set by the
system and by nobody else; mark-won and mark-lost are `modules/M07`'s rows.

**Edge cases & what-goes-wrong.**

- *Nobody triages for three days* (`S2.wrong.7`) → escalation at twenty-four hours, repeated on
  the owner's surface; the lead stays unassigned until a person acts (M02-50).
- *"Call me next month"* (`S3.wrong.5`) → snoozed with a mandatory date; it disappears from My Day
  and comes back automatically with a task (M02-51).
- *Customer goes silent for thirty days* (`S7.wrong.8`) → dormant, not deleted; any activity
  brings it back (M02-52).
- *A snoozed lead's wake date passes while the tenant's timezone changes* → the wake-up lands at
  09:00 on the tenant's current timezone; the intent is the tenant's morning, not a fixed
  instant.
- *A lead is snoozed and its wake date is in the past* → it wakes at the next 09:00 rather than
  being lost.
- *Junk is marked by mistake* → reopen exists and restores the prior stage (M02-55, M02-56).
- *A lost lead's reason was wrong* → reopen, then close again with the right reason; both closes
  stay on the timeline (M02-56).
- *A lead reaches won* → the project is created in the same act; no one re-enters the customer
  (M02-57).

**Acceptance criteria.**

- Given any timer in this module, when it fires, then it fires at 09:00 on the tenant's timezone,
  and given any state transition, then the lead record still exists afterwards (M02-49).
- Given an unassigned lead, when twenty-four hours pass, then the owner is notified and the
  lead's state is unchanged; and when it is assigned, then it enters Assigned at stage `new`
  (M02-50).
- Given a snooze, when no wake-up date is given, then the action cannot complete; and given a
  snoozed lead, then it is absent from My Day until 09:00 on its wake date, when it returns to
  its prior stage with a follow-up task — or immediately, if "Wake up now" is used (M02-51).
- Given a lead with no activity for thirty days on an open stage, when the nightly sweep runs,
  then it is flagged dormant, excluded from My Day, filterable in the leads list and still
  present; and when any activity occurs, then it returns to its stage (M02-52).
- Given a disqualification, when it completes, then a reason from the six is recorded, no timer
  exists, and reopening returns the lead to its prior stage with history intact (M02-53).
- Given a lead marked lost with reason postponed, when the given date arrives, then it resurfaces
  at 09:00 tenant-local; and given a lead marked lost with reason *not interested* — the seventh
  Lost reason per owner ruling 2026-08-04 (Q21) — then no call task is raised for six months
  (M02-54).
- Given a lead marked junk, when any queue is inspected, then it is absent from all of them, it
  is findable in search, and it still exists (M02-55).
- Given a reopen from any of Lost, Disqualified, Dormant or Junk, when it completes, then the
  lead re-enters at its prior funnel stage and the timeline records the reopen (M02-56).
- Given a lead reaching won, when the transition completes, then a project exists for it without
  any further step and without re-entering the customer (M02-57).
- Given each state, when the surfaces named in the ruling are inspected, then it appears on those
  and on no others (M02-58).

**Localization notes.** State names, the "Snoozed till …" chip, reason labels and the escalation
copy are translated per `F3-01`; the state and reason vocabularies are closed sets whose canonical
identity does not change with display language (`F3-12`). Wake dates and the 09:00 time render
through the shared date implementation on the tenant's timezone (`F3-22`). **Analytics events:**
snoozed (wake date distance) · woken (automatic / manual) · dormant flagged · reactivated by
activity · disqualified / lost (reason) · junk marked · reopened (from state) · unassigned
escalation raised.

### M02.11 — Customer merge

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-59 | **Customer merge ships in v1 and is the answer to the case deduplication cannot reach: the same person with two numbers.** The source's own example is a husband and wife enquiring separately; phone-as-identity cannot catch it by construction, and the ruling closes the source's "offer merge later" with **"the merge flow ships"** — read as v1 scope (`OD-5` retires the calendar phrasing, not the commitment). Merge is reachable from either customer record and from the deliberate-duplicate link M02-12 leaves behind. | `SRC` — `R8` (ruling, as amended); `S2.wrong.6` ("Same person, different number (husband/wife) → dedupe cannot catch this"; the source's "later" is dead); `UXG-05`; `DOC14.merge-included` · calendar phrasing read as v1 scope per `OD-5` | P0 |
| M02-60 | **Merge is: pick the survivor, re-point every reference to it, and mark the loser merged — never deleted.** Contacts, leads, proposals, links, activities, tasks and files that pointed at the loser point at the survivor afterwards; the loser record remains as a tombstone pointing at the survivor, so an old reference still resolves to something true. Field-level survivor choices — which name, which city, which primary contact — are made explicitly in the flow, never guessed. | `SRC` — `R8` ("merge = re-point contact and lead references to the survivor, mark the loser merged (never deleted), keep the audit trail"); `DOC04.merge-tombstone` ("merged rows point at the survivor and are tombstones, never deleted"); `UXG-05` ("pick survivor, re-point leads/proposals/links") | P0 |
| M02-61 | **The merge keeps a full audit trail.** What was merged into what, by whom, when, and each field-level survivor choice, recorded on the survivor's timeline and in the audit log (`F2-22`). The tombstone carries the same record, so the history of the losing record is not orphaned. | `SRC` — `R8` ("keep the audit trail"); `UXG-05` ("keep audit trail"); `DOC04.timeline` | P0 |
| M02-62 | **A merge touches no money.** No proposal figure, no tranche, no payment, no discount and no total changes as a result of a merge — the ruling's consequence is that the operation is **provably** money-free, and this module states it as an acceptance obligation rather than an assumption. Sent documents keep the figures and versions they were built with regardless (`F8-15`). | `SRC` — `R8` (consequence: "the merge operation provably touches no money tables"); `DOC04.merge-tombstone` (same clause); `DOCFC.crm-compliance-day1` ("merge-ready… survivor re-pointing touches no money tables") | P0 |
| M02-63 | **Merge is irreversible, and the confirm step says so in full.** Before it runs, the flow states exactly what will move, what the loser record becomes, and that the act cannot be undone from the product; it completes only on explicit confirmation. Merge requires that **both records fall inside the actor's own lead-visibility scope** (`F2-13`/`F2-14`) — nobody merges a record they cannot see. | `SRC` — `UXG-05` ("irreversible-with-confirm"); scope condition derived from `F2-12`'s visibility law and recorded at `F2.M02.merge-customers` | P0 |

**Behavior detail.** The merge screen is a comparison: the two records side by side (stacked at
the mobile breakpoint), each differing field showing both values with the survivor's choice
selected, and the totals of what will move — how many leads, contacts, proposals, links,
activities and files — stated before the confirm. Choosing the survivor is a deliberate act, not
a default: the flow proposes the record with more history and lets it be changed. Where the two
records have leads at different stages, both leads survive under the survivor — merge never
closes, merges or discards a deal — and where both have a primary contact, the flow requires a
single primary to be chosen. Afterwards, the survivor's timeline carries the whole merged
history in one stream (M02-35), the tombstone resolves any old link to the survivor, and the
deliberate-duplicate reason recorded at M02-12 stays visible as the reason the pair existed.

Permissions: `F2.M02.merge-customers` (EPC Owner · Sales Manager), with M02-63's scope condition.

**Edge cases & what-goes-wrong.**

- *Same person, different number* (`S2.wrong.6`) → the case merge exists for (M02-59).
- *Both records have live leads* → both survive under the survivor; nothing is closed by the
  merge (M02-60).
- *A proposal was sent from the losing record* → it re-points to the survivor and keeps every
  figure and version it was built with (M02-62, `F8-15`).
- *An old link or reference points at the loser* → the tombstone resolves it to the survivor
  rather than dead-ending (M02-60).
- *The wrong survivor was chosen* → the act is irreversible from the product; the confirm step's
  job is to make that clear before it happens (M02-63).
- *One of the two records is outside the actor's scope* → merge is unavailable and says why
  (M02-63).

**Acceptance criteria.**

- Given two customer records for the same person, when merge is run, then one survivor holds
  every contact, lead, proposal, link, activity, task and file, and the loser exists as a
  tombstone pointing at the survivor (M02-59, M02-60).
- Given a completed merge, when the survivor's timeline and the audit log are read, then they
  record what was merged, by whom, when, and each field-level survivor choice (M02-61).
- Given any money figure on either record before a merge, when the merge completes, then every
  proposal figure, tranche, payment, discount and total is unchanged (M02-62).
- Given the merge confirm step, when it renders, then it states what will move, what the loser
  becomes and that the act cannot be undone, and the merge runs only after explicit confirmation
  (M02-63).
- Given an actor who can see only one of the two records, when merge is attempted, then it is
  unavailable with the reason stated (M02-63).

**Localization notes.** Merge copy, the comparison labels and the irreversibility warning are
translated per `F3-01`; record values shown for comparison are data and are never translated
(`F3-08`); any money figure shown in the comparison renders through the money implementation with
its provenance intact and is read-only (`F3-24`, M02-62). **Analytics events:** merge opened
(entry point) · survivor chosen · field choices made · merge completed (counts re-pointed) ·
merge abandoned at confirm.

### M02.12 — Capture settings: the channel policy

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M02-64 | **This module owns the channel set and what a toggle does; M01 owns the settings surface.** A channel toggle governs **new capture only**: turning a live channel off stops new leads arriving through it and never hides, alters or deletes a lead already captured through it — the source badge on existing leads survives the toggle. Turning the inbound-call channel off is a capture decision here and is distinct from the agent's own configuration (`modules/M07`). At least the manual channel is always available, because it is the path onboarding hands the first lead to (`M01-26`). | `SRC` — `UXG-03` ("toggles for manual / CSV / inbound-agent"); `TC.lead-sources.1` ("Which channels are live" — shared: the settings surface and honesty rule are `M01-58`'s); `D13` (the channel set) · toggle semantics stated here per the archive-never-delete family (`R9`, `DOC04.merge-tombstone`) | P0 |
| M02-65 | **A channel that does not exist is never advertised as one.** Website forms and inbound business-messaging render as **"later" cards, not teasers**, carrying no toggle, no form snippet and no number field — the source's capture-settings screen listed a form snippet and a messaging number for channels this release does not have, and that over-promise is **not carried**. The screen distinguishes live from not-yet rather than advertising. | `SRC` — `UXG-03` ("website form + inbound WhatsApp rendered as 'later' cards, not teasers"; "the screen must distinguish live channels from not-yet channels rather than advertise them"); `S2.screen.5` (the over-promising source screen, recorded and corrected by the later-card rule, not carried); honesty obligation per `F8-34` | P0 |

**Behavior detail.** Capture settings is one surface with two owners by design: M01 renders it
and holds the honesty rule (`M01-58`); this module supplies what it renders — the closed source
set (M02-13), each channel's real state, and the toggle semantics above. That split is why no
"later" card can acquire a toggle by accident: the card has no live channel behind it to toggle.
Where the brief's marketing module lands
a channel (M02-17), its capture configuration is M03's surface; this screen's channel list is the
v1 CRM set and says so.

Permissions: `F2.M01.manage-tenant-settings` (EPC Owner) for the settings surface; no M02
capability is required to read which channels are live from the capture paths themselves.

**Edge cases & what-goes-wrong.**

- *A not-yet channel is toggled on* → cannot happen; later cards carry no toggle (M02-65,
  `M01-58`).
- *A live channel is turned off while leads from it are in the inbox* → those leads are
  untouched, keep their badge and are triaged normally (M02-64).
- *Every channel is turned off* → manual capture remains, because onboarding's first door depends
  on it (M02-64).
- *A tenant asks when the deferred channels arrive* → the card states the channel is not
  available, without promising a date (`F8-34`).

**Acceptance criteria.**

- Given a live channel toggled off, when the leads already captured through it are inspected,
  then they are unchanged and still carry their source badge, and no new capture arrives through
  that channel (M02-64).
- Given capture settings, when it renders, then deferred channels appear as later cards with no
  toggle, no snippet and no number field (M02-65).

**Localization notes.** Channel names and later-card copy are translated per `F3-01`; the wording
never states or implies availability the release does not have (`F8-34`). **Analytics events:**
channel toggled (channel, new state) · later-card viewed.

## 4. Cross-module contracts

**This module provides:**

- **The lead lifecycle** — the funnel (M02-41) and the seven parking/terminal states with their
  timers, exits and surfaces (§M02.10). `modules/M07-sales-execution.md` (My Day, close surfaces),
  `modules/M13-dashboards-and-reporting.md` (pipeline, win/loss lists, the owner's "needs you")
  and `modules/M03-marketing.md` read this machine and never define a parallel one.
- **Assignment semantics** — manual assignment, the open-load and overdue figures shown at assign
  time, bulk assignment, and the append-only assignment history with its load snapshot
  (§M02.6). `modules/M03` hands captured enquiries into the same unassigned state; `modules/M13`
  reports on the same ownership facts.
- **The customer record** — phone-as-identity, contacts with role labels, and the
  calling-compliance fields the gate reads per dial (M02-02, M02-34, M02-37) — consumed by
  `modules/M07` (gate, agent, calls), `modules/M06-proposals.md` (client details),
  `foundations/F5-customer-link.md` (per-contact links) and `modules/M08-projects.md`.
- **The dedupe sheet** — one sheet with three choices, reused by the import preview and by
  `modules/M07`'s inbound capture (M02-10), and available to any future capture channel
  `modules/M03` lands.
- **The single timeline** — one append-only activity stream per lead and customer that every
  module writes into (M02-35).
- **Merge** — survivor semantics, re-pointing, the tombstone and the money-free guarantee
  (§M02.11), which every module holding a reference to a customer inherits.
- **The lead → project transition** — reaching won creates the project with no separate step
  (M02-57), consumed by `modules/M08`.
- **The channel set and toggle semantics** behind M01's capture-settings surface (§M02.12).
- **The referral link** — referrer customer → referred lead, visible on both records
  (M02-16), consumed by `modules/M13`'s win/loss analytics and produced at handover by
  `modules/M08`.

**This module expects:**

| From | This module expects |
|---|---|
| `foundations/F1-global-market-framework.md` | `pack.formats` for the phone specification and dialling semantics (`F1-21`); the tenant's currency for lead value and monthly bill (`F1-07`); the tenant timezone for every timer (`F1-10`); `pack.calling-rules` for the calling window a call-back must respect (`F1-36`); the market's data-rights erasure rule that preserves dedupe integrity (`F1-57`). |
| `foundations/F2-roles-and-permissions.md` | The twelve presets, this module's matrix rows `F2.M02.*`, the visibility law (`F2-12`–`F2-14`) and the audit obligations (`F2-22`). |
| `foundations/F3-localization.md` | Per-reader language, the never-translated set, and the single money/number/date implementations (`F3-06`, `F3-08`, `F3-19`–`F3-22`). |
| `foundations/F4-data-integrity.md` | The conflict policy for lead edits (`F4-16`) and capture-time semantics (`F4-19`) — referenced, never restated. |
| `foundations/F6-notifications-and-search.md` | The notification types this module raises (unassigned escalation, assignment, enquiry-on-existing) and the search surface that is the only place a junk lead appears (M02-55). |
| `foundations/F8-data-honesty.md` | Provenance tiers for qualification-derived figures, the provisional label on money figures, and the honest-failure and honest-state laws (`F8-02`, `F8-12`, `F8-34`, `F8-36`). |
| `modules/M01-onboarding-and-tenant-config.md` | The capture-settings surface and its honesty rule (`M01-58`); the tenant's declared segment as the quick-add default (`M01-23`); locale defaults and the working calendar (`M01-59`); the first-lead door that lands on this module's empty state (`M01-26`). |
| `modules/M03-marketing.md` | Campaign captures delivered into the unassigned inbox with their own source badge and through this module's dedupe sheet; M03 owns those channels' configuration and the `D13` supersession that admits them (M02-17). |
| `modules/M04-survey.md` | The visit object and its states, the surveyor's capture flow, and the remote-survey path that books no visit at all (M02-46). |
| `modules/M07-sales-execution.md` | Inbound-call capture into this module's sheet; the agent hand-off at three failed attempts; the compliance gate that reads M02-37's fields; the mark-won and mark-lost close surfaces; My Day's exclusion of snoozed and dormant leads (M02-58). |
| `modules/M08-projects.md` | Project creation on the won transition (M02-57); the handover-time referral ask that produces M02-16's link. |
| `modules/M13-dashboards-and-reporting.md` | The owner's "needs you" surface reading the unassigned set; the win/loss "disqualified early" and "lost late" lists; the weighted-pipeline reading of lead value that never becomes revenue (M02-38). |

## 5. Non-goals

- **No lead scoring** (`S2.notv1.1`). The product does not rank or score leads; qualification is
  six answered facts and a human judgement (§M02.8).
- **No marketing automation in this module** (`S2.notv1.2`). Campaign management is the V2
  brief's scope and lives in `modules/M03-marketing.md`; nothing here nurtures, sequences or
  drips. The v1-source non-goal and the brief's mandate are recorded together in
  `registers/conflicts.md` **row 3** (`DOC00.nongoal-lead-channels`, Task 3's disposition),
  resolved by design spec §2 `DD2`'s brief-driven supersession with `modules/M03` owning the
  superseding specification.
- **No campaign attribution** (`S2.notv1.3`). A lead carries the channel it arrived through
  (M02-13) and, for referrals, who referred it (M02-16) — not a multi-touch attribution model.
  Where M03 lands campaigns, the attribution question is its scope decision, not a silent
  inheritance from here.
- **No website chatbot** (`S2.notv1.4`), and no website form or inbound business-messaging capture
  in this module (`D13`, M02-17).
- **No auto-routing, no assignment rules engine, no round-robin, no territory routing**
  (`D14`, `UXG-04`: "no rules engine"). Assignment is a management act with the load shown
  (§M02.6); the source's "or use a rule" phrase does not survive the ruling.
- **No monetary referral credit, redemption or balance** (`R15`, `DOC04.referral-no-credit`). The
  referral tag and the "came from" chip ship; the credits ledger is the spec-locked exclusion.
  The source's "they get credited" wording must not be read as a money feature, and when a
  credits ledger is one day built it references the referral rows that already exist.
- **No lifecycle state and no merge ever deletes a record.** Junk, lost, disqualified and dormant
  all preserve the lead (`R9`); merge tombstones the loser (`DOC04.merge-tombstone`). The
  explicit delete capability (`F2.M02.delete-leads`, EPC Owner only) is the sole removal path and
  is deliberately outside every automatic flow; a data-rights erasure is an anonymisation that
  preserves deduplication integrity (`F1-57`).
- **No merge undo.** Merge is irreversible-with-confirm by design (`UXG-05`, M02-63); the product
  invests in the confirmation rather than in a reversal that could not restore re-pointed
  references honestly.
- **No second dedupe vocabulary.** One sheet, three choices, three entry points (M02-10); no
  channel gets its own duplicate dialog, and no background job merges records without a person.
- **No delivery state on the copy-paste fallback path** (M02-33): where no transactional
  channel is connected the product does not send on the tenant's behalf and never claims a
  message arrived. *(Superseded in part by owner ruling 2026-08-04, Q33: with a connected
  official channel, transactional messages — visit confirmations, reminders, links — send
  automatically and carry the channel's honest delivery states; `registers/conflicts.md`
  rows 4 and 8 carry the resolution note. The campaign lane stays `modules/M03`'s.)*
- **No timer invented outside `R9`** (M02-49). Any new lead timer is a ruling recorded in the
  source, not a local decision on a screen.

## 6. Open questions

Mirrored into `registers/open-questions.md` (rollup ids noted):

- **M02-Q1 (register Q21) — RESOLVED (owner ruling 2026-08-04, Q21).** "Not interested" is
  **added to the Lost reasons as the seventh** — the Lost state's own reason now carries the
  six-month no-call suppression exactly as R9 intends (M02-54; surface at `M07-63`). The
  disqualify six are unchanged (M02-42). The customer-side outcome the source expects —
  *"They should not then be called for six months"* (`C8.wrong.3`) — is delivered by the Lost
  state.
- **M02-Q3 (register Q23) — RESOLVED (owner ruling 2026-08-04, Q23).** The three-fact
  disclosure is **confirmed as specified**: owner name, stage, last-contact date — no record
  contents, no file access; cross-scope Open-existing resolves to a request-to-owner
  (M02-08). No permission widened; `F2-15` stands. Binds all three entry points of the one
  shared sheet.
