# F5 · Customer link — the no-login tokenised customer journey

Status: draft · Origin mix: SRC throughout, with one row carrying a `BRIEF` half where the V2
brief's global-first framing restates a market-specific source line (`F5-08`; count corrected by
Task 26 — this line previously said two, but `F5-03` routes its market data to the pack under a
plain `SRC` tag); this document carries no `REC` items · Depends on: `00-README.md`, `01-product-overview.md`, `02-personas.md`,
`foundations/F1-global-market-framework.md` (threshold denomination, pack labels and formats),
`foundations/F2-roles-and-permissions.md` (the customer is never a role; §F2.5-F5's link
operations; the audit checklist), `foundations/F3-localization.md` (language follows the
reader), `foundations/F7-design-language.md` (mobile-first parity; tenant branding),
`foundations/F8-data-honesty.md` (every customer-visible number), `modules/M05-design-studio.md`
(the 3D surface and the sign-off gate), `modules/M06-proposals.md` (the version this link
renders), `modules/M07-sales-execution.md` (calls, the agent and the callback queue),
`modules/M08-projects.md` (stage and blocker facts), `modules/M11-payments-and-collections.md`
(the money facts), `04-business-model.md` (the soft-block law) · Forward:
`foundations/F6-notifications-and-search.md`, `modules/M02-crm-and-leads.md` (the timeline a
question lands on), `modules/M12-platform-billing.md`, `modules/M13-dashboards-and-reporting.md`

## 1. Purpose & scope

This document is the whole of the customer's side of the glass. Everything else in this suite is
written from the EPC's side; this one is written from the side of a homeowner or a factory owner
about to make a large, once-in-a-decade purchase from a company they do not yet trust.

The product's fourth conviction is the mandate, and it is a subtraction rather than a feature:
**the EPC's customer never logs in.** They get no account, no password, no application, no
portal. Their entire experience of this product is messages, phone calls, and **one link** — a
link that begins as a proposal, becomes a progress tracker when the deal is won, and becomes the
document pack at handover. The same URL, bookmarked once, answering the only question the
customer ever really asks: *what is happening?*

The source is explicit about what the product owes this side: *"the product's job on this side
is not screens. It is making sure the right message arrives at the right moment, and that the
one link always answers 'what is happening?'"* Those two clauses — **message timing** and **link
truthfulness** — are the acceptance themes every requirement below is written against.

**In scope.** The no-login law and its consequences; the link's whole lifecycle across its three
phases (proposal → progress → handover) and the laws that keep it one object; named per-contact
links, per-link open attribution, and the value-threshold challenge at acceptance; the proposal
surface the customer reads, including the 3D view of their own roof and the honesty labels every
figure carries; acceptance, negotiation and decline; the customer's question and
request-a-call affordances; the payment and receipt surface; the progress surface and the
attribution of every wait; installation, commissioning and the handover pack; the referral ask;
the security, revocation and expiry properties of the link at product level; and the branding
and white-label rules that govern how the page is dressed.

The thirteen steps of the customer's journey (`C1`–`C13`) each land here, including the steps
where the customer touches no screen at all — because *"nothing happens in the app; everything
happens in their head"* is itself a product requirement about what the product must not leave
silent.

**Explicitly not in scope.**

- **The facts the link renders.** This document owns not one figure. The proposal's numbers are
  `modules/M06-proposals.md`'s, the stage and blocker facts are `modules/M08-projects.md`'s, the
  money facts are `modules/M11-payments-and-collections.md`'s, and the 3D model is
  `modules/M05-design-studio.md`'s. Those modules produce facts; **F5 writes the sentence**, and
  never re-derives, re-rounds or re-computes anything they published.
- **Sending.** Transactional customer messages — the link, the confirmations, the status
  updates — send automatically from the tenant's connected official channel, with composed
  copy-paste as the no-channel fallback (owner ruling 2026-08-04, Q33; lane boundary `M03-03`).
  Delivery is claimed only where the connected channel reports it; the fallback path claims
  none. The campaign sending of `modules/M03-marketing.md` is a different capability over
  different content (`registers/conflicts.md` rows 3–4).
- **The operator surfaces that drive the link.** The share sheet and its actions are
  `modules/M06`'s (`M06-53`); the deal-side link manager, the notification a question raises and
  the timeline it lands on are `modules/M06`/`modules/M02`/`foundations/F6`'s. F5 states what
  those surfaces owe the customer, and names them rather than drawing them.
- **Any implementation mechanism.** Token construction, signing, storage and routing appear in
  the source and are deliberately absent here (design spec §14 / DD4). This document states the
  product-level properties the token scheme must satisfy — unguessable, scoped, expiring,
  revocable, attributable, auditable — and stops there.
- **Market facts.** No currency amount, market label, utility name or statutory hour appears in
  this document. Where a market fact matters, F5 names the pack key or the market-framework
  requirement that owns it (`F1-07`, `F1-15`, `F1-22`, `F1-43`).

## 2. Personas & surfaces

**The reader of this document's primary surface is not one of the twelve personas.** No persona
in this suite is the EPC's customer, and no requirement anywhere may imply a customer login
(`PS-04`, `F2-18`). The customer is an *audience*: they hold a link, never a role, never a
column in a permission matrix, never a row in the team list.

Two customer archetypes share one design, and the source names both: the **residential
homeowner**, reading on a phone in the evening, probably beside their spouse; and the **C&I
buyer**, whose organisation contains several people with different authority and different
questions. One page serves both. The C&I case is why named links exist (§F5.4) and why the
acceptance challenge exists (§F5.6) — a commitment of that size must be attributable to a
person, not to whoever forwarded a URL.

**The personas that operate the link** are named here and granted in `foundations/F2` §F2.5-F5:
the **EPC Owner**, **Sales Manager** and **Sales Executive** mint, label, re-mint and revoke
customer links, because minting a link *is* the act of sharing a proposal (`M06-53`). The
**Project Manager** and **Operations** personas feed the progress phase by moving stages and
setting blockers (`modules/M08`), and the **Finance** persona's receipts appear on the payment
surface (`modules/M11`) — none of the three needs a link grant to do so. The **Design Engineer**
authors the 3D model and the recommendation the proposal phase renders, and does not share. The
**Installation Team Member** never reaches any surface in this document, and no commercial
figure the customer sees may reach theirs (`F2-06`).

**Surfaces.** One public web page, rendered by the product on the tenant's behalf, at one URL
per named recipient. It is **mobile-first and single-session by design**: the source's own
deciding moment is *"the proposal link, opened once, on a phone, in the evening"*, and the page
is designed at the small viewport first with full parity at the large one (`F7-30`). It must be
usable on a slow connection, text before weight (`DOC14.link-3g`). There is no customer mobile
application, and there never was one to install.

**The customer's whole surface area is a budget the design must hold to.** Across an entire
project the source counts roughly twelve to eighteen messages, three to six phone calls (a mix
of human and automated), **one** web link — reused for proposal, then progress, then handover —
**zero** logins and **zero** app installs. Those counts are the shape of the relationship, not a
target to optimise; what they fix is that no requirement in this suite may add a second customer
destination.

## 3. Feature areas

### F5.1 — The no-login law and what the product owes this side

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-01 | **The customer never logs in — ever.** There is no customer account, no password, no portal, no application to install and no sign-up of any kind anywhere in the product. The customer reaches everything they are entitled to see through one tokenised link, and holds no role: no preset describes them, no matrix column exists for them, and no surface in this suite may introduce a customer credential. The acceptance challenge of `F5-44` is a one-time verification of a person at a moment of commitment — it is **not** a credential, creates no account, and grants nothing that outlives the act it protects. | `SRC` — `D5` (docs/15 §2: HONORED — stateless signed tokens, no portal accounts); `C.framing.2` (journey L957–962: "They have no login (D5)"); `C.lifecycle.2`; `PS-04` / `F2-18` consumed | P0 |
| F5-02 | **The customer's entire surface area is messages, calls and one link — and nothing in the product may add a second destination.** The source's whole-project counts are the budget: roughly 12–18 messages, 3–6 calls, **one** web link reused across all three phases, **zero** logins, **zero** app installs. Any proposal to give the customer a second URL, a second page family or an application is a change to this law, not a feature decision inside a module. | `SRC` — `C.framing.5` (journey L1144–1152, the counts verbatim); `C.framing.2` (`WhatsApp messages · phone calls · ONE link`, read post-overlay as a manual messaging channel per `D32` and as one link **per named recipient** per `R6`) | P0 |
| F5-03 | **Two archetypes, one design.** The residential homeowner and the commercial-and-industrial buyer are served by the same page, the same lifecycle and the same laws; the difference between them is expressed through named links and the acceptance challenge (§F5.4, §F5.6), never through a second design, a second URL family or a segment-conditional surface. | `SRC` — `C.framing.1` (journey L950–954: "a homeowner or a factory owner"); the value band the source states alongside it is market data and lives in the market pack (Global Constraint §6; `F1-07`) | P0 |
| F5-04 | **The two acceptance themes for every customer-facing requirement are message timing and link truthfulness.** Verbatim: *"the product's job on this side is not screens. It is making sure the right message arrives at the right moment, and that the one link always answers 'what is happening?'"* Every requirement in this document is testable against one of the two, and a customer-facing behaviour that satisfies neither does not belong here. | `SRC` — `C.framing.3` (journey L964–966, verbatim) | P0 |
| F5-05 | **Trust is the product, so every number the customer reads carries its honesty labels — with no exception for the customer surface.** Provenance tier (`F8-01`, `F8-02`), energy source label (`F8-08`, `F8-09`), staleness state (`F8-12`) and every required disclosure (`F8-20`, `F8-22`, `F8-23`) render on this page exactly as they render inside the product. No tenant setting, plan, template or white-label arrangement removes, weakens, renames or hides one (`F8-06`). A surface that cannot carry a label does not thereby earn permission to drop it — it carries the label or it does not carry the number (`F8-01`). | `SRC` — `C.framing.4` (journey L967: "Trust is the actual product here"); `F8-01`–`F8-09`, `F8-06` consumed | P0 |
| F5-06 | **Three moments decide the outcome, and each is a design constraint on a named surface.** (a) **Speed of first callback** decides whether the company is in the running at all — the mechanism is lead capture and first response (`modules/M02`). (b) **The proposal link, opened once, on a phone, in the evening** decides the sale — the mobile-first single-session constraint of §2. (c) **Visible progress during the long external wait** decides whether the customer refers anyone — the progress phase (§F5.9) and the referral ask (§F5.10). No surface in this document may be designed as though a customer will return to it repeatedly to hunt for something. | `SRC` — `C.framing.6`, `C.framing.7`, `C.framing.8` (journey L1158–1161, all three verbatim) | P0 |
| F5-07 | **The page is mobile-first, readable in one sitting, and usable on a slow connection — text before weight.** The reading order puts what decides the question first; nothing load-bearing waits on a heavy asset; and no state of the page is reachable only after a large download. Full parity at the large viewport is required, not a wider version of a reduced page (`F7-30`, `F7-31`). | `SRC` — `DOC14.link-3g` (the link obeys a text-first rule on slow connections); `C.framing.7` (the single-session reading constraint); `F7-30`/`F7-31` consumed | P0 |
| F5-08 | **The page renders in the customer's language, not the rep's — and the product is built for a language set that will grow.** Language follows the reader (`F3-06`); every product-authored string on this page, including every honesty and disclosure line, is translated content (`F3-07`) with English fallback per string (`F3-05`); names, addresses, brand names and technical units are never translated (`F3-08`); money renders through the one money implementation in the tenant market's declared format, identically in every language (`F3-20`). No requirement in this document names a language or assumes the set's size (`F3-25`). | `SRC` — `C5.wrong.4` (journey L1043: "it is in English and they read Marathi", `D25` HONORED); `F3-05`–`F3-08`, `F3-20` consumed · `BRIEF` for the open-set phrasing — `_process/owner-brief-2026-08-03.md` §Localization via `F3-25` | P0 |

**Behavior detail.** The no-login law is a subtraction, and subtractions are fragile: every
release meets somebody with a reasonable-sounding argument for a customer account ("so they can
see all their projects", "so we can secure it properly", "so they can save their preferences").
`F5-01` exists so that argument has to be won against a stated law rather than inside a module.
What the law buys is the thing the source says decides the sale — a customer who is one tap away
from their answer, on a phone, in the evening, with no recall of a password they set three weeks
ago and no application to install first.

The three phases are one page's three states, not three products (§F5.3). What changes between
them is what the page is *for*; what never changes is the URL the customer bookmarked, the
language it speaks, the labels its numbers carry, and the named person at the bottom of it.

**Permissions** (`foundations/F2-roles-and-permissions.md`). This section grants nothing. The
customer holds no role (`F2-18`) and the link's own authority is a token scope, not a role
(§F5.3). The presets that operate the link are `foundations/F2` §F2.5-F5's two rows; every other
persona touches this surface only by producing the facts it renders.

**Edge cases & what-goes-wrong.**

- *A tenant asks for a customer portal with logins, because a competitor has one.* Refused by
  `F5-01`. The competitive reading is the source's own: the absence is the feature, and the
  product's answer to "let me see everything" is one honest link, not an account.
- *A customer opens the link on a device with a slow or intermittent connection.* The page
  degrades to text and still answers the question (`F5-07`); a heavy asset that has not arrived
  is shown as pending rather than blocking the numbers behind it.
- *The customer's language is not one the tenant authored templates in.* Product-authored copy
  falls back per string (`F3-05`); tenant-authored copy is never machine-translated or silently
  substituted (`F3-10`), and the gap surfaces to its author rather than to the customer as a
  broken sentence.
- *A screen runs out of room and a provenance label would wrap.* The layout changes; the label
  stays (`F5-05`, `F8-07`).

**Acceptance criteria.**

- Given any customer-facing surface in the product, when it is reached, then it requires no
  account, no password and no application, and creates no credential of any kind (`F5-01`).
- Given a completed project, when the customer's destinations are enumerated, then there is
  exactly one link per named recipient and no second customer destination exists (`F5-02`).
- Given a residential enquiry and a commercial enquiry, when both reach the proposal phase, then
  both render through the same page, lifecycle and laws (`F5-03`).
- Given any requirement in this document, when it is reviewed, then it is testable as either a
  message-timing obligation or a link-truthfulness obligation (`F5-04`).
- Given any number on any customer-facing surface, when it renders, then it carries its
  provenance tier, its source label where energy, its staleness state and every required
  disclosure, and no tenant configuration can remove one (`F5-05`).
- Given the proposal phase, when it is designed and reviewed, then it is designed at the small
  viewport first, reads in one sitting, and reaches its decisive content before any heavy asset
  (`F5-06`, `F5-07`).
- Given a customer whose language differs from the rep's, when they open the link, then the page
  renders in the customer's language with untranslated values intact and money in the market's
  format (`F5-08`).

**Localization notes.** This whole document is a localization surface: the customer-facing page
is the one place where the reader's language is a *customer's* language rather than an
employee's. Mixed-script lines are normal and required to render correctly (`F3-09`), and the
densest customer surface — the proposal phase — is one of the screens the render-and-check
completion condition names (`F3-18`). **Analytics events:** `customer_link_opened` (link,
phase, device class — no PII per `F5-77`), `customer_link_language_rendered` (language),
`customer_link_slow_render` (a page that did not reach its decisive content within the budget).

### F5.2 — Before the link: the moments the product must not leave silent

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-09 | **The customer's first experience is a callback, and its speed is the single biggest predictor of who wins the job.** The source's own signals: called back within an hour reads as a strong signal; called back three days later means *"the job is already lost"*. The mechanism is lead capture and first-response time (`modules/M02`); what this document fixes is that the speed is a **customer-facing product obligation**, not an internal metric, and that no surface in the product may let a new enquiry sit without an owner. | `SRC` — `C1` (journey L971–983, verbatim); `C1.wrong.1` ("Nobody calls back"); `C.framing.6`; `M02-50` consumed (>24h unassigned escalates) | P0 |
| F5-10 | **One company, one voice: the customer is never called by three different people, and never asked the same questions twice.** Being contacted by several people from one company reads as disorganised and costs the job; being re-interviewed says the company does not keep records. Both are prevented by the duplicate check and the single record at capture (`M02-07`, `M02-08`), and both are stated here as customer-facing failures the product exists to prevent. | `SRC` — `C1.wrong.3`, `C1.wrong.4` (journey L979–983, verbatim); `C1.wrong.1` (the same record's other face) | P0 |
| F5-11 | **The customer is never called outside the lawful hours of their market, and never after they have said stop.** The statutory ruleset — calling window, do-not-disturb, opt-out and disclosure — is market-pack data enforced by a non-swappable mechanism (`F1-15`, `F1-17`; the enforcement surface is `M07-27`/`M07-28`). Stated from the customer's side: a customer who says stop is not called again, and no tenant configuration may reach around the floor. **Ruled (owner ruling 2026-08-04, Q30):** the enforced lanes bind automated dials — inbound answering 24/7, unsolicited dials only inside the statutory window, and outside-window dials only on the customer's own recorded, timestamped callback request (which a single "stop" ends); a human rep dialling manually gets warning-then-proceed with the "customer requested" context logged (`M07-30`). The customer-side outcome is unchanged: never called outside lawful hours except at their own recorded request, never after stop. | `SRC` — `C1.wrong.2`, `C7.wrong.2`, `C7.wrong.6` (journey L982, L1069–1077, post-overlay `D36`-amended); `F1-15`/`F1-17` consumed; three-lane law per owner ruling 2026-08-04 (Q30) | P0 |
| F5-12 | **The same answers must be right whoever — or whatever — is speaking.** A rep fumbling a basic incentive question loses the deal before price is discussed, and an automated caller giving a different answer than the rep does the same damage twice. The knowledge that makes the answers consistent is the tenant's, authored once and used by both (`modules/M07`; corrections never auto-train — `R10`). This document states the customer-facing consequence: the customer must not be able to tell, from the content of an answer, which channel they reached. | `SRC` — `C2` (journey L985–995, verbatim); `C2.wrong.1` (journey L988–989); `C6` (the questions the customer actually asks — bill reduction, failure, year-four service, roof damage, incentive paperwork) | P0 |
| F5-13 | **A booked site visit produces a confirmation carrying four mandatory facts: what is happening, the date and time, the name of the person coming, and that person's phone number.** The message is composed by the product and — per the owner ruling of 2026-08-04 (Q33) — **sends automatically from the tenant's connected transactional channel**, with a person sending the composed copy-paste text where no channel is connected (`M02-47`); this document fixes the four fields as a customer-facing minimum, so that no surface may compose a confirmation that omits one. | `SRC` — `C2` (journey L992–995: "date, time, name of who is coming, and the person's phone number"); `M02-47` consumed; `D32`'s manual rule superseded by owner ruling 2026-08-04 (Q33) | P0 |
| F5-14 | **A survey leaves the customer with a promise and a date — and nobody leaves a site without saying what happens next.** The trust rule is the source's: what builds trust is the surveyor explaining what they are photographing and why; what destroys it is silent photographing followed by leaving. The customer receives a confirmation of the form *"Survey done. Your proposal will reach you by <date>."* — **a promise with a date**. Where the survey is remote the customer experiences nothing at this step and receives their proposal sooner, which is itself the competitive answer; where it is physical, the visit is confirmed, attended and closed out. | `SRC` — `C3` (journey L997–1012, verbatim, `D30` HONORED); `C3.wrong.1` ("surveyor arrives late, or not at all"); `C3.wrong.2` ("nobody tells them what happens next"); `M02-46`/`M02-48`, `modules/M04` consumed | P0 |
| F5-15 | **No verbal price is given that the proposal then contradicts.** A figure spoken on a roof becomes the number the customer remembers; a document that disagrees with it reads as a bait. The product's answer is that the priced document is the only price surface and it carries its own honesty labels (`F5-36`, `F5-37`) — no surveyor-side or call-side surface in the product produces a customer-facing price. | `SRC` — `C3.wrong.3` (journey L1012, verbatim) | P0 |
| F5-16 | **The wait between survey and proposal is never silent — and the day-two update is automatic (owner ruling 2026-08-04, Q33).** The source is categorical: *"Nothing in the product should let this gap be silent"* — this is where enthusiasm decays and competitors land first. The obligation is met three ways: the promise made at `F5-14` carries a date; the product raises the staff-side task that keeps it; and the *"we are working on your design"* update **sends automatically on day two from the tenant's connected transactional channel** (the same connection `modules/M03` establishes, transactional template class per `M03-03`). Where no channel is connected, the honest fallback is the composed draft a person sends plus the staff-side nudge — and no delivery is claimed on that path. | `SRC` — `C4`, `C4.wrong.1` (journey L1014–1019, verbatim — the automatic behaviour the source describes is now the shipped behaviour); automatic transactional sending per owner ruling 2026-08-04 (Q33), superseding `D32`'s manual rule | P0 |
| F5-17 | **The thinking window belongs to the customer, and the product's job in it is to answer rather than to chase.** The typical decision window runs from days to weeks, nothing happens in the product, and the customer's real questions are rarely about price — will this reduce my bill, what if it does not work, who fixes it in year four, will it damage my roof, is the incentive real and who does the paperwork. Every one of those is answerable by the tenant's own knowledge on any channel the customer reaches (`F5-12`), and the link's question affordance (§F5.7) exists so a question does not require a phone call the customer must initiate. | `SRC` — `C6` (journey L1045–1060, verbatim; the source records no "goes wrong" items for this step, and none is invented) | P1 |
| F5-18 | **The follow-up call is configured to protect the customer out of the box.** The shipped defaults are the source's: capped attempts, a calling window, the customer's own language, an always-offered hand-off to a person, and an automated caller that says it is automated. The owner may change what is above the statutory floor and owns that choice; the floor itself is not theirs to move (`F5-11`). Stated as the customer's four protections: not called three times in a week, not called at dinner, not addressed in a language they do not speak, and never trapped without a route to a human. | `SRC` — `C7` (journey L1062–1077, verbatim, `D36` PARTIAL); `C7.wrong.1`, `C7.wrong.3`, `C7.wrong.4`, `C7.wrong.5` (the discount case is owner-configured, defaulting to offering a person); `R3` (agent languages independent of interface languages — `F3-29` consumed); `M07-22`/`M07-44` consumed | P0 |

**Behavior detail.** Five of the thirteen customer steps happen entirely off-screen: the
enquiry, the first conversation, the survey, the wait, and the thinking. It would be easy to
treat them as another module's business and leave this document to start at the link — and that
would lose the half of the customer's experience where deals are actually lost. What these rows
fix is the *customer-facing* obligation at each step, expressed so that it is testable from
outside the company: was there a callback, and how fast; was the person contacted once by one
owner; did the confirmation carry the four facts; was there a promise with a date; was the gap
filled; was the follow-up capped, timed, in their language and escapable.

None of these rows re-specifies the mechanism. Capture, dedupe and assignment are
`modules/M02`'s; the visit is `modules/M04`'s; the automated caller, its queue, its compliance
gate and its hand-off are `modules/M07`'s. Where a mechanism already exists, the row cites it;
and where a customer-facing promise needs a message, the send rail is the transactional lane —
automatic from the tenant's connected channel, composed for a person to send where none is
connected, with an arrival claimed only on the path the product actually sent (`F5-13`,
`F5-16`). *(Reconciled to owner ruling 2026-08-04, Q33; this prose previously read that the
promise "has no send channel in this release" — `D32`'s retired manual-only rule, contradicting
the reconciled `F5-13`/`F5-16` rows above — see `registers/conflicts.md` row 4.)*

**Permissions.** None of these rows grants anything. The acts behind them ride existing rows —
`F2.M02.add-edit-leads` and `F2.M02.assign-leads` for capture and ownership,
`F2.M02.book-site-visit` and `F2.M04.capture-surveys` for the visit,
`F2.M07.hand-lead-to-agent` and `F2.M01.configure-agent` for the automated caller. No preset
gains a customer-communication capability here.

**Edge cases & what-goes-wrong.**

- *Nobody calls back at all* (`C1.wrong.1`). The unassigned escalation is the product's guard
  (`M02-50`); the customer-facing statement is `F5-09`, and a lead with no owner after the
  ruled window is an owner-visible failure, not a silent one.
- *Two reps capture the same person from two channels.* The dedupe sheet fires on capture from
  every channel, before anything is saved (`M02-07`); the customer-facing failure it prevents is `F5-10`.
- *The surveyor cannot complete the visit — nobody home, roof locked.* The visit reschedules
  from the lead with exactly one reminder (`M02-48`), and the customer is told what happens
  next; a silent non-visit is the failure `F5-14` names.
- *The proposal will miss the promised date.* The promise carries a date because a date can be
  kept or renegotiated; the honest act is a fresh dated message, never silence (`F5-16`).
- *The customer says stop mid-sequence.* Opt-out is a statutory floor item, not a tenant default
  (`F5-11`); no further automated contact occurs, and the record carries the flag with its
  timestamp and source (`F1-58`).

**Acceptance criteria.**

- Given a new enquiry, when it is captured, then it has an owner and a first-response
  expectation, and an unowned enquiry escalates rather than resting (`F5-09`).
- Given a customer who already exists on the tenant's records, when a second capture occurs,
  then the capture surface shows the existing record before anything is saved, so the customer
  is not re-interviewed or double-chased (`F5-10`).
- Given a market whose pack declares a calling ruleset, when any automated call is attempted,
  then the window, registry and opt-out floor items are enforced rather than surfaced, and an
  opted-out customer receives no further automated contact (`F5-11`).
- Given the same question asked of a rep and of the automated caller, when both answer, then
  both answer from the tenant's one authored knowledge set (`F5-12`).
- Given a booked site visit, when the confirmation is composed, then it carries what is
  happening, the date and time, the attending person's name and that person's phone number
  (`F5-13`).
- Given a completed survey, when the customer is updated, then the update states that the survey
  is done and names the date by which the proposal will reach them (`F5-14`).
- Given any customer-facing surface in the product, when a price is shown, then it is the priced
  document or its link rendering, carrying its honesty labels — and no other surface emits a
  customer-facing price (`F5-15`).
- Given a lead between survey and proposal, when the gap opens, then an owned dated next step
  exists; and given a tenant with a connected transactional channel, when day two arrives, then
  the "we are working on your design" update sends automatically from that channel under the
  transactional template class; and given no connected channel, then the composed update is
  available for a person to send beside the staff-side nudge, and no delivery is claimed on that
  path (`F5-16`). *(Reconciled to owner ruling 2026-08-04, Q33; this line previously carried
  `D32`'s retired composed-not-sent formulation and left the automatic day-two send of the
  reconciled `F5-16` row above untested — see `registers/conflicts.md` row 4.)*
- Given an automated follow-up sequence, when it runs, then attempts are capped, the window is
  honored, the customer's language is used, and a route to a person is offered on every call
  (`F5-18`).

**Localization notes.** Every composed customer message in this section renders in the
customer's language (`F3-06`, `F3-10` for tenant-authored templates); the automated caller's
language set is broader than the interface's and independent of it (`F3-29`).
**Analytics events:** `first_response_elapsed` (enquiry → first contact), `duplicate_prevented_at_capture`,
`visit_confirmation_composed`, `survey_promise_date_set`, `design_gap_update_composed`,
`followup_handoff_offered`.

### F5.3 — The link lifecycle: one URL, three phases

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-19 | **One link, its whole life: the tokenised URL shared with the proposal becomes the progress tracker after the deal is won, and the document pack after handover.** Three phases, one object, one URL — *"the customer bookmarks it once. Designing it as three separate things would be the mistake."* The link advances **in place**: no phase change re-issues a URL, invalidates a bookmark, or requires the customer to be sent anything new. | `SRC` — `C.lifecycle.1` (journey L1154–1156, verbatim); `DOC04.link-lifecycle` ("one URL advances in place through the lifecycle"); `C.lifecycle.2`; `S8.screen.7` ("same tokenised URL as the proposal") | P0 |
| F5-20 | **A link comes into existence when a proposal is shared, and never before.** Sharing is the rep's explicit act on the share surface (`M06-53`); minting the link *is* that act, which is why the capability rows of `foundations/F2` §F2.5-F5 carry exactly the send-proposals holder set. Nothing else in the product creates a customer-facing URL. | `SRC` — `C.lifecycle.2`; `M06-53` consumed; `DOC08.matrix.send-proposals` (cited — the grant is `F2.M06.send-proposals`'s and is reciprocated, not widened) | P0 |
| F5-21 | **The link carries its own authority: a scoped, expiring grant, never a session and never an account.** The scope set is fixed at product level — view the proposal · respond to the proposal (accept, negotiate, decline) · view progress · view the handover pack — and **effective rights are the token's scopes intersected with the link's current phase**, so a token that carries a respond scope grants nothing once the deal has moved past the phase in which responding is meaningful. The link sits outside the role system entirely (`F2-18`). | `SRC` — `DOC08.link-scopes` (the four scopes, and "effective rights = token scopes ∩ current link-row stage"); `DOC02.link-grant` (a scoped grant, "never a session"; the pay-a-tranche grant is §F5.8's) | P0 |
| F5-22 | **The link is permanent (owner ruling 2026-08-04, Q34): view scopes never expire, and after handover the same URL is the customer's permanent read-only "solar file" for life.** The former twelve-month view-scope expiry is superseded — a customer returning to a bookmark years later still reaches their page; respond scopes still end with their phase (`F5-21`), and **revocation remains the operator's kill switch** (`F5-76`): re-minting issues a fresh token for the same link, and regenerate-with-revoke kills the old one immediately. The `expired` state survives in the lifecycle vocabulary only for tokens minted under the pre-ruling horizon. Neither expiry nor revocation is ever a consequence of the tenant's billing state (`F5-23`) or of money the customer owes (`F5-24`). | `SRC` — `DOC04.link-lifecycle` (status active / revoked / expired); `DOC08.link-expiry`'s twelve-month horizon superseded by owner ruling 2026-08-04 (Q34 — link lives forever; permanent read-only solar file after handover) | P0 |
| F5-23 | **Customer links keep working in every tenant billing state, without exception.** View **and** respond, proposal and progress pages alike, in every one of the six billing states — `trialing` · `active` · `past_due` · `halted` · `expired` · `cancelled` (`BM-33`/`M12-04`, the closed vocabulary; no other state name exists) *(Final review: the earlier illustrative list named states outside the six)* — the tenant's customer is never punished for the tenant's billing state. The soft-block matrix is product law and no enforcement surface may move this from working to blocked (`BM-32`, `BM-35`). | `SRC` — `DOC08.link-never-billing-blocked` (docs/16 §3, verbatim); `BM-32`/`BM-35` consumed (the always-on rows) | P0 |
| F5-24 | **A customer link is never revoked, degraded or gated over money the customer owes.** The law is stated where the temptation lives: ***"never block the customer's progress link over money — chase the person, do not punish the view."*** An unpaid tranche is visible to the tenant and chased through a person (`M08-39`, `M11-32`); nothing on the customer's page changes because of it, including the parts of the page that have nothing to do with money. | `SRC` — `C.lifecycle.7` (journey L913–915, carried as a link-lifecycle law); `DOC04.link-lifecycle` ("Never revoked over unpaid money"); `M08-39`/`M11-32` consumed | P0 |
| F5-25 | **A link that cannot serve fails honestly and names a person to contact.** Revoked, rate-limited, pointing at a cancelled deal, or (for a legacy pre-ruling token) expired, the page states plainly what has happened, shows the tenant's named contact and their number, and shows **no customer data** — never a blank page, never a raw error, never a silent redirect to nothing. **The expiry gap is closed (owner ruling 2026-08-04, Q34):** links are permanent — view scopes never expire and the post-handover page is the customer's permanent read-only solar file — so the late-returning-bookmark case the source feared no longer produces a dead page; the honest failure page remains for revocation and the other cases, with the operator re-mint as the recovery path. | `SRC` — `C5.wrong.2` (journey L1042: "the link expires" — the failure mode the Q34 ruling retires); `C.lifecycle.9` (the gap, now closed); `F8-36` consumed (fail fast and honestly); permanence per owner ruling 2026-08-04 (Q34) | P0 |

**Behavior detail.** The lifecycle law is the single most consequential design decision in this
document, and it is a decision about **identity**: the link is the *deal's* customer-facing
identity, not the proposal's, not the project's. That is why it survives the transition from
proposal to project without re-issue, why a bookmark set in the evening of the decision still
works during commissioning months later, and why nothing in this suite may model "the proposal
link" and "the progress link" as two objects.

The three phases in order:

1. **Proposal** (§F5.5) — from the share act until the deal is won or lost. The page is a
   priced document rendering with its honesty labels, the 3D view, financing, and the response
   actions.
2. **Progress** (§F5.9) — from the won transition. The page becomes done / current / waiting,
   with dates and with every wait attributed.
3. **Handover** (§F5.10) — from the terminal handed-over stage. The page becomes the document
   pack and the named service contact.

A phase transition is caused by the deal, never by the link: the won transition is
`modules/M02`'s and `modules/M07`'s (`M02-57`, `M07-62`), reaching the terminal stage is
`modules/M08`'s (`M08-46`). The link reads the deal's state and renders the phase that matches
it; it holds no state machine of its own.

Two properties are deliberately *not* symmetric. Access is permanent (view scopes never expire
— owner ruling 2026-08-04, Q34) because the customer is expected to come back to a bookmark
during a wait that can run for weeks, and to their solar file for years; revocation is
immediate because it is the answer to a link that reached the wrong person. `F5-22` keeps both
available and distinct, and `F5-76` makes revocation absolute regardless of any token lifetime.

**Permissions.** Minting, labelling and re-minting ride `F2.F5.mint-customer-link`; revoking
and regenerate-with-revoke ride `F2.F5.revoke-customer-link` (`foundations/F2` §F2.5-F5).
Reading a link's status and its open history is **not** a new visibility domain — it rides
`F2.M02.lead-visibility` and `F2.M08.project-visibility` exactly as proposals, designs and
surveys do. Setting the acceptance-challenge threshold is tenant configuration and rides
`F2.M01.manage-tenant-settings`; no row here re-grants it.

**Edge cases & what-goes-wrong.**

- *The deal is cancelled after it was won.* The project is a terminal cancelled state and its
  history stays readable (`M08-51`, `M08-53`); the customer's link shows the honest state of the
  deal rather than a fabricated stage or a dead page, and is not silently revoked — revocation
  is an act somebody chooses (`F5-76`).
- *The proposal is superseded by a newer version.* The link renders the latest version
  (`F5-40`); the URL does not change and no second link is minted for a version.
- *A customer returns to a bookmark after the token expired.* `F5-25`'s honest page with the
  named contact; the operator re-mints. The absence of a self-serve renewal path is recorded at
  `Q34`, not invented here.
- *A tenant's subscription lapses mid-project.* Nothing on the customer's page changes
  (`F5-23`); the tenant's own surfaces carry the honest state and the route to reactivate
  (`BM-32`, `modules/M12`).
- *A tranche is overdue and someone asks to "pause" the customer's page until it is paid.*
  Refused by `F5-24`, in every form — no revocation, no partial view, no banner about money owed
  placed on the customer's page as leverage.

**Acceptance criteria.**

- Given a deal that moves from shared proposal to won project to handed over, when the customer
  opens their bookmark at each point, then the same URL serves them and the page's phase matches
  the deal's state (`F5-19`).
- Given a proposal that has never been shared, when the product is inspected, then no
  customer-facing URL exists for it (`F5-20`).
- Given a token carrying a respond scope, when the deal has moved past the proposal phase, then
  the respond actions are absent and the token grants only what the current phase allows
  (`F5-21`).
- Given a link minted years ago on a view scope, when it is opened, then it serves — view
  scopes never expire (owner ruling 2026-08-04, Q34); and given a re-mint without revoke, when
  the earlier token is used, then it continues to work unless explicitly revoked (`F5-22`).
- Given a tenant in any of the six billing states, including `halted`, `expired` and `cancelled`,
  when their customer opens a link,
  then the page loads and responds exactly as it does for a tenant in good standing (`F5-23`).
- Given an overdue tranche of any age, when the customer opens their link, then nothing on the
  page is withheld, degraded or gated (`F5-24`).
- Given an expired, revoked or rate-limited link, when it is opened, then the page states what
  happened, names a contact person and their number, and discloses no customer data (`F5-25`).

**Localization notes.** The failure page of `F5-25` is product copy and is translated like any
other product string (`F3-07`); the contact's name and number are never translated (`F3-08`).
The phase names are product vocabulary with translated display; the canonical identity of the
deal's state is the stage machine's, not this page's (`F3-12`, `F1-09`). **Analytics events:**
`customer_link_minted`, `customer_link_remitted`, `customer_link_revoked`,
`customer_link_phase_advanced` (from, to), `customer_link_dead_page_shown` (reason:
expired / revoked / rate-limited / deal-cancelled).

### F5.4 — Named links, attribution and open tracking

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-26 | **Links are named: a deal may carry several labelled links, each addressed to one contact.** Each link carries a human label and, where the contact is known, the contact it was minted for. This is what closes the sharpest liability in the product — a commitment of any size accepted by *"whoever holds the URL"*, with no way to say which stakeholder acted. The earlier decision to defer per-contact links is **superseded**: they ship at launch, not later. Revoking one named link never affects another link on the same deal. | `SRC` — `R6` as amended 2026-07-24 (per-contact labelled links, verbatim); `C.lifecycle.3`; `UXG-11` (in-scope, not deferred); `D33` superseded; `DOC04.link-named-otp`; `DOC14.named-links-otp` | P0 |
| F5-27 | **Opens are attributed per link, so an open can be tied to a named contact.** The open history of a deal reads as *who* opened, not merely *someone* opened; this is the property that makes named links worth having, and it is the same property that makes the acceptance record of `F5-46` meaningful. | `SRC` — `R6` (per-link open attribution, verbatim); `C.lifecycle.8`; `DOC04.link-events` (opened / section viewed / accepted / negotiate requested / declined, append-only) | P0 |
| F5-28 | **Opens are the product's own evidence and are always tracked; delivery states exist only where the product actually sent (owner ruling 2026-08-04, Q33).** The link's shared → opened → viewed-for-how-long progression remains the evidence the product owns outright. Where a transactional message carrying the link was **sent from the tenant's connected channel**, the channel's own delivery states are shown honestly, as that channel reports them and no further. Where the copy-paste fallback was used — a person sent from their own device — **no delivered state exists anywhere**, exactly as `D32` originally ruled: a delivery claim there would be a fabrication, and no surface, notification or analytic may imply one. | `SRC` — `C.lifecycle.8`; `D32` (verbatim — now governing the fallback path only, per owner ruling 2026-08-04 Q33); `M06-54` consumed (the proposal-side statement of the same law) | P0 |
| F5-29 | **Open events carry no personal data.** An open is recorded as the link, the moment and a device class; the viewer's network address is not persisted on the open event; no customer personal data appears in any URL; and the public pages carry **no third-party scripts, fonts or analytics** of any kind. The richer attribution the acceptance record captures (`F5-46`) exists only at the moment of commitment, deliberately, and is not collected while the customer is merely reading. | `SRC` — `DOC08.open-tracking` (verbatim on all four clauses); `DOC04.link-events` ("No PII in URLs or logs") | P0 |
| F5-30 | **Link management is a tenant-side surface on the deal, and the customer-facing challenge surface is on the customer's page.** The operator sees the deal's links with their labels, their contacts, their open history and their state, and can mint, label, re-mint and revoke from there; the customer meets only the challenge sheet, and only at acceptance. The screens are `modules/M06`'s share and deal surfaces; this document fixes what they must show and what the customer must never be shown (the other contacts' links, labels or open history). | `SRC` — `UXG-11` (verbatim: "link manager on the deal + OTP sheet on the customer page"); `R6` | P0 |
| F5-31 | **Every act on a link is audit-covered, with attribution.** Mint, re-mint, revoke, open, and each of accept, negotiate and decline are named in the suite's audit checklist and are written with who and when; the customer-side acts are attributed to the link and its contact rather than to a user. | `SRC` — `DOC08.audit-coverage` (customer-link mint/re-mint/revoke/open/accept-negotiate-decline with attribution, verbatim); `DOC02.link-grant` ("Every access is audit-logged"); `F2-22` consumed | P0 |

**Behavior detail.** Named links are the answer to a question the single-link design could not
answer: *which* stakeholder opened it, and *who* accepted. In a commercial-and-industrial deal
the difference matters commercially and, at the acceptance moment, legally. The design is
deliberately small — a label, an optional contact, and attribution on the events — because the
customer-facing experience must not change at all. A named link is still one URL that its
recipient opens without signing in; naming is a property the *tenant* sees.

Two adjacent temptations are refused here. The first is a "delivered" state the product has not
earned: where the tenant's connected channel sent the message, that channel's own delivery
states are shown as it reported them and no further; where the copy-paste fallback was used it
would be the easiest thing in the world to draw a tick beside a shared link, and it would be a
lie, because the product did not send the message (`F5-28`). *(Reconciled to owner ruling
2026-08-04, Q33; this prose previously stated the tick-is-a-lie rule unscoped — `D32`'s retired
form, contradicting the reconciled `F5-28` row above — see `registers/conflicts.md` row 4.)* The second is enriching open tracking: an open
event could carry far more than link, moment and device class, and `F5-29` forbids it — the
customer reading a proposal at home has not consented to anything, and the product's own
positioning is honesty rather than surveillance. The one place richer attribution is captured is
the moment the customer commits, where it exists to protect both parties (`F5-46`).

**Permissions.** `F2.F5.mint-customer-link` covers minting, labelling and re-minting;
`F2.F5.revoke-customer-link` covers revocation. Reading the link manager's contents rides the
reader's existing lead or project scope, and re-sending an existing named link **to its own
contact** carries no new grant — but giving a *new* person access requires minting a new named
link, which is exactly what preserves attribution (`foundations/F2` §F2.5-F5 notes).

**Edge cases & what-goes-wrong.**

- *A named link is forwarded by its recipient to a colleague.* The product cannot prevent it and
  does not pretend to: the open is attributed to the link, and the acceptance challenge of
  `F5-44` is the control that matters at the moment that matters.
- *A contact leaves the customer's organisation mid-deal.* Their link is revoked
  (`F2.F5.revoke-customer-link`), a new named link is minted for their successor, and the other
  contacts' links are untouched (`F5-26`).
- *A residential deal with one contact.* One named link; the label is a convenience, not a
  ceremony, and nothing about the flow becomes heavier for the simple case.
- *An operator asks for a "who has seen it" view on the customer's own page.* Refused by
  `F5-30`: the customer sees their own link, never the deal's other links or their activity.
- *A link is opened many times in a short window — a customer showing their family.* This is
  normal reading, not abuse; the ceilings of `F5-78` are set to a level ordinary reading does not
  reach, and a customer who does reach one meets the honest page of `F5-25` rather than silence.

**Acceptance criteria.**

- Given a deal with several stakeholders, when links are minted, then each carries a label and,
  where known, its contact, and revoking one leaves the others working (`F5-26`).
- Given an open on a named link, when the operator reads the deal's link history, then the open
  is attributed to that link and its contact (`F5-27`).
- Given any customer-facing surface, notification or analytic in the suite, when share states
  are enumerated, then the set always contains shared, opened and viewed-duration; and given a
  transactional message that sent from the tenant's connected channel, then that channel's own
  delivery states appear exactly as it reported them and no further; and given the copy-paste
  fallback, when the same states are enumerated, then no delivered state exists anywhere
  (`F5-28`). *(Reconciled to owner ruling 2026-08-04, Q33; this line previously carried `D32`'s
  retired unscoped ban on a delivered state, contradicting the reconciled `F5-28` row above —
  see `registers/conflicts.md` row 4.)*
- Given an open event, when it is inspected, then it holds the link, the moment and a device
  class only, no network address, and the page that produced it loaded no third-party script,
  font or analytic (`F5-29`).
- Given the deal's link manager, when it is opened by an operator, then it shows labels,
  contacts, open history and link states; and given the customer's page, when it is opened, then
  it shows none of them (`F5-30`).
- Given any mint, re-mint, revoke, open, accept, negotiate or decline, when it occurs, then an
  append-only audit entry records it with its attribution (`F5-31`).

**Localization notes.** Labels are tenant-authored data and are never translated by the product
(`F3-10`); the customer never reads a label. Device class and event names are internal
vocabulary with translated display where an operator reads them (`F3-12`). **Analytics events:**
`customer_link_open_attributed` (link, contact present or absent), `customer_link_section_viewed`
(section, duration), `customer_link_open_unattributed` (a link minted without a contact — an
operational signal, not a failure).

### F5.5 — Phase 1: the proposal surface

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-32 | **The proposal page shows exactly what the source names, and this is the moment of maximum attention.** System size, annual generation and monthly savings · total price, incentive and what the customer actually pays · payback period · **a 3D view of their own roof** · financing options · **Accept** · **Ask a question**. It is opened once, properly, probably in the evening, probably on a phone, possibly with a spouse — so the page is ordered for a single decisive reading rather than for exploration. | `SRC` — `C5` (journey L1021–1043, the list verbatim); `C.lifecycle.5` | P0 |
| F5-33 | **The 3D view of the customer's own roof is the differentiating moment and is a first-class element of this page, not an attachment — shipped as a "View in 3D" button inside the proposal link (owner ruling 2026-08-04, Q27).** The source: *"this is the moment that separates you from a PDF emailed by a competitor."* The model, its captures and its read-only presentation are `modules/M05`'s (`M05-55`); this page renders the recommended design's live 3D view behind its **"View in 3D"** button, read-only, with every control absent — **no second link exists**; captures/pictures remain the fallback where the live view cannot serve. The studio's customer-facing 3D share is therefore an element of this framework's proposal page, not a separate tokenised surface. | `SRC` — `C5` (verbatim); `M05-55` consumed; in-link 3D per owner ruling 2026-08-04 (Q27, resolving `modules/M05` §6 M05-Q3) | P0 |
| F5-34 | **An unapproved design never reaches this page.** Structural adequacy is a recorded human decision, and a design that has not been signed off is not shown to the customer on the link, in a document or in a shared file. The law is `F8-29`'s; the gate is this document's, and it is absolute: where no approved design exists, the page renders the proposal without the model rather than rendering an unapproved one. | `SRC` — `F8-29` (verbatim: "an unapproved design is never shown to the customer"; the gate is named as F5's); `M05-82` consumed | P0 |
| F5-35 | **The customer sees one recommended system by default.** Where a lead carries variants, exactly one is marked recommended in the studio and that is what this page renders; variants appear only where the designer deliberately added them for a price-sensitive or undecided customer. The page never asks the customer to choose between engineering options they have no basis to evaluate. | `SRC` — `D16` (HONORED — the customer-facing half); `M06-56`, `M05-80` consumed | P0 |
| F5-36 | **Every figure on this page carries its provenance tier, and every energy figure additionally carries its source label naming the database.** The tiers are the canonical four and no surface invents a fifth (`F8-02`, `F8-03`); the energy labels are fixed copy (`F8-08`) and the source is never switched silently (`F8-09`). Labels are persistent readable content beside the number — never a tooltip, never a colour, never a footnote (`F8-07`). | `SRC` — `C5` honesty rule (journey L1036–1041); `R18` / `R5` via `F8-01`–`F8-09` consumed | P0 |
| F5-37 | **The three disclosure lines render on this page verbatim wherever they apply:** the indicative line on any proposal built without a design; the remote-survey basis line where the design was built on imagery rather than an on-site measurement; and the projection label with its assumptions on every multi-year financial figure. The source's competitive reading is carried as the rationale, not as decoration: *"Competitors print estimates as certainties. When a customer compares three proposals and only yours admits which numbers are estimated, that reads as confidence, not weakness."* | `SRC` — `C5` (the honesty rule and its rationale, verbatim); `F8-20`, `F8-22`, `F8-23` consumed; `R17` (cited — the commercial document type changes the honesty label on financial projections and nothing else) | P0 |
| F5-38 | **The link and the document never disagree.** One computed value set feeds the page, the generated document and every export; a figure that differs between the customer's page and the customer's document is a defect, not a rounding difference. | `SRC` — `C5.wrong.3` (journey L1042–1043, verbatim); `F8-24` consumed | P0 |
| F5-39 | **The web page is the path to the number; the document is an artifact.** Verbatim: *"The customer link always renders the proposal as web — PDF is an artifact, never the only path to the number."* A customer on a slow connection or an old device reads every figure, disclosure and label on the page without downloading anything; the document is offered, never required. Where a document render fails it is retried once and then fails with a notification to the operator — it never leaves the customer with a broken link to a missing file. | `SRC` — `DOC07.pdf-artifact` (verbatim, both clauses); `C5.wrong.1` (journey L1042: "the PDF is too large to open on a slow connection"); `DOC14.link-3g` | P0 |
| F5-40 | **The page always shows the latest version, and a version already shared never changes underneath the customer.** A newer version supersedes the one the page renders, at the same URL; and the figures of a version that has been shared are pinned forever — a later price change produces a new version rather than editing the one the customer read (`F8-15`). Where the design behind a live proposal has been superseded by newer survey data, the page continues to render what the shared version carries; the reconciliation policy is ruled (owner ruling 2026-08-04, Q24: design marked "survey updated — review needed", designer notified, drafts blocked from sending until review, sent versions pinned — `M05-13`), and its customer-visible consequence arrives only as a new version at this same URL. | `SRC` — `M06-45` (the status machine — "the customer link always shows the latest version", `S6.wrong.6`); `F8-15` consumed; Q24 ruling noted 2026-08-04 | P0 |
| F5-41 | **The customer-facing document and this page say "Proposal" — in the reader's language, in every language.** The naming ruling binds every locale: one term per concept, and the words for a priced offer that this suite bans are banned in every language, not only in English. This is the customer-link half of the ruling; the entity and the document are `modules/M06`'s and the vocabulary law is `foundations/F3`'s. | `SRC` — `R1` (docs/15 §1 — the customer-link wording half, held for this document by Task 8's split); `F3-11`, `M06-01` consumed | P0 |
| F5-42 | **Financing options render as labelled projections with their assumptions, never as an offer.** The instalment arithmetic is the proposal's (`M06-40`); this page renders it as a projection carrying its assumptions (`F8-23`), and makes no statement about eligibility, approval or availability — there is no financing marketplace in this release. | `SRC` — `C5` (financing options in the list); `M06-40`, `F8-23` consumed; `CG-4` (cited — the marketplace is a non-goal, `modules/M06` §5) | P1 |

**Behavior detail.** This page has one job, and the source says exactly when it is done: it is
opened once, in the evening, on a phone, and the reading either produces a decision or produces
a question. Everything about the ordering follows from that. The decisive facts come first —
what the system is, what it generates, what it saves, what it costs and what the customer
actually pays after the incentive. The roof comes next, because it is the thing that converts a
document into *their* project. Financing and detail follow. The two actions sit where a reader
reaches them without hunting.

The honesty labels are not a compliance layer bolted onto the bottom of the page; they sit
beside the numbers they qualify, which is why `F8-07` bans hover-only and footnote treatments
and why `F5-05` refuses any tenant-level switch that would remove them. The source's own
argument for this being a competitive advantage rather than a weakness is carried verbatim in
`F5-37` so that a later reader meets the reasoning and not just the rule.

`F5-39` is the row that decides the page's architecture. Because the web rendering — not the
document — is the path of record to every number, the document can be generous with weight and
the page cannot. It also means a render failure is an operator's problem, never a customer's
dead end.

**Permissions.** No customer-side permission exists (`F5-01`). Producing what this page renders
rides `F2.M06.create-edit-proposals` and `F2.M05.create-edit-designs`; approving the design that
`F5-34` gates on rides `F2.M05.approve-designs`; sharing — and therefore minting the link —
rides `F2.M06.send-proposals` and `F2.F5.mint-customer-link`.

**Edge cases & what-goes-wrong.**

- *The document is too large to open on a slow connection* (`C5.wrong.1`). The page carries
  every figure without it (`F5-39`).
- *The link and the document disagree on a figure* (`C5.wrong.3`). A defect against `F5-38`; one
  value set, one rendering contract (`F8-24`).
- *The page is in a language the customer does not read* (`C5.wrong.4`). Language follows the
  reader (`F5-08`), and the customer's language is a property of the customer's record, not of
  the sender.
- *The link expires before the customer decides* (`C5.wrong.2`). Retired by the Q34 ruling
  (2026-08-04): view scopes never expire, so the case cannot occur; `F5-25`'s honest page
  remains for revocation and the other failure modes.
- *No design exists yet and the proposal is indicative.* The page renders without the 3D view
  and **with** the indicative line (`F5-34`, `F5-37`); it is a legitimate, sellable proposal
  that simply does not claim to be a surveyed one.
- *A design exists but has not been signed off.* The model is withheld (`F5-34`); the page does
  not silently render the unapproved geometry, and the operator's own surface says why.
- *A tenant asks for the labels to be removed because a competitor's document looks more
  confident.* Refused (`F5-05`, `F8-06`).

**Acceptance criteria.**

- Given a shared proposal, when the customer opens the link, then the page carries system size,
  generation, savings, price, incentive, payable, payback, the roof view, financing, Accept and
  Ask a question (`F5-32`).
- Given a proposal whose design has been signed off, when the page renders, then the read-only
  3D view of that design is present with no editing control; and given a design that has not
  been signed off, when the page renders, then the model is absent (`F5-33`, `F5-34`).
- Given a lead with several design variants, when the customer opens the link, then exactly one
  recommended system is presented by default (`F5-35`).
- Given any figure on the page, when it renders, then it carries a provenance tier, and any
  energy figure additionally carries its source label naming the database (`F5-36`).
- Given a proposal built without a design, a design built on remote imagery, or a multi-year
  financial figure, when the page renders, then the corresponding disclosure line appears
  verbatim (`F5-37`).
- Given the same figure on the page and in the generated document, when both are read, then the
  value, the tier and the disclosure are identical (`F5-38`).
- Given a customer who downloads nothing, when they read the page, then every figure, label and
  disclosure is available to them; and given a failed document render, when it fails, then it
  retries once and then notifies the operator (`F5-39`).
- Given a newer version of the proposal, when the customer opens the same URL, then the newer
  version renders; and given a version already shared, when it is inspected later, then its
  figures are unchanged (`F5-40`).
- Given any launch language, when the customer-facing document or page names the priced offer,
  then it uses the single ruled term in that language and no synonym appears (`F5-41`).

**Localization notes.** This is the densest customer surface in the product and one of the
screens the render-and-check completion condition names (`F3-18`); it must survive text
expansion without truncating an amount, a unit or an honesty label (`F3-16`, `F3-24`). Mixed
script — a capacity in Latin digits and units inside a sentence in another script — is normal and
required to shape correctly (`F3-09`, `F3-15`). Money renders through the one money
implementation in the market's format, identically in every language (`F3-20`); digits are Latin
in every language (`F3-21`). **Analytics events:** `proposal_link_viewed`,
`proposal_section_dwell` (section, duration), `proposal_3d_opened`, `proposal_document_downloaded`,
`proposal_document_render_failed`, `proposal_link_opened_on_stale_version`.

### F5.6 — Accept, the challenge at commitment, negotiate and decline

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-43 | **Acceptance happens in exactly one way: the customer taps Accept on their link.** No verbal agreement on a call, no note from a rep, no automated caller's report of enthusiasm, and no operator action anywhere in the product constitutes the customer's acceptance. The decision itself is theirs to make in one of three ways — accept, go quiet, or say no — and only the first is an act the product records as acceptance. | `SRC` — `C8` (journey L1079–1087, verbatim); `D10` (acceptance happens by tapping Accept on the link, never by a verbal agreement) | P0 |
| F5-44 | **OTP-at-accept ships DEFAULT OFF at launch (owner ruling 2026-08-04, Q42): no value threshold is set, and the challenge is a per-tenant enable in settings.** Where a tenant enables it, Accept is challenged with a one-time verification of the person accepting; any tenant-set threshold is **tenant configuration denominated in the tenant's currency** (`F1-07`); the delivery capability is a market-pack reference rail behind a vendor-neutral port (`F1-43`). Reading stays frictionless — the challenge exists only at the commitment, never at the reading. **The C&I acceptance risk is stated honestly:** with the challenge off, a high-value Accept is evidenced by named-link open-attribution and the acceptance record (`F5-26`, `F5-27`, `F5-46`) rather than by a verified OTP — a residual risk the owner accepted for launch; **revisit post-launch** is the ruling's own trigger. No product default threshold exists and no pack key carries one. | `SRC` — `R6` as amended 2026-07-24 (the challenge mechanism); `C.lifecycle.4`; `DOC08.link-named-otp`; `DOC04.link-named-otp`; `F1-07`, `F1-43` consumed; default-OFF, no-threshold, per-tenant enable + post-launch revisit per owner ruling 2026-08-04 (Q42) | P0 |
| F5-45 | **The challenge is a challenge, not a credential.** It verifies a person at a moment; it creates no account, sets no password, establishes no session that outlives the act, and is never reused as a login anywhere in the product. This is what lets named links and a verified acceptance coexist with `F5-01` rather than contradict it. | `SRC` — `D5` post-overlay (docs/15 §2: the challenge "is a per-accept challenge, not a credential"); `C.framing.5` ("logins and app installs stay 0"); `C.lifecycle.4` | P0 |
| F5-46 | **The acceptance record captures full attribution from day one:** which link, which contact, whether and how the challenge was satisfied (or that it was off — the tenant's Q42 setting state is recorded), the network address and the user agent of the accepting session. **Named-link attribution is the acceptance evidence of record (owner ruling 2026-08-04, Q42)** — with OTP-at-accept default OFF, this record plus the named link's open-attribution is what answers, months later, *who* committed the company to this — the question the single-link design could not answer. It is written once, at the moment of acceptance, and is not a running collection while the customer reads (`F5-29`). | `SRC` — `R6` (the attribution list verbatim); `DOC08.accept-revalidates`; `DOC04.link-named-otp`; `F2-22` consumed; evidence-of-record posture per owner ruling 2026-08-04 (Q42) | P0 |
| F5-47 | **Accept is never trusted from the link alone — the server re-checks before it records anything.** It confirms that the version being accepted is the current one and is not stale (money never renders or commits while stale — `F8-12`), that the deal is not already won or lost, and that the challenge of `F5-44` has been satisfied where the threshold requires it. A re-check that fails states plainly what happened and what the customer should do; it never records a partial acceptance. | `SRC` — `DOC08.accept-revalidates` (verbatim, all three checks); `F8-12`, `F8-36` consumed | P0 |
| F5-48 | **Acknowledgement is immediate, and it lives on the link itself — with the instant message now sent automatically (owner ruling 2026-08-04, Q33).** The customer expects to know within seconds that the tap registered — *"not a silence that makes them wonder if the tap registered"*. The page's own confirmation state is the acknowledgement of record: it changes at once, states what has been accepted and what happens next, and depends on no message. The instant confirmation message the source describes **sends automatically from the tenant's connected transactional channel** the moment Accept records; where no channel is connected, the composed message a person sends is the fallback — and the page state already did the acknowledging. | `SRC` — `C8`, `C8.wrong.1` (journey L1082–1083, verbatim); automatic transactional sending per owner ruling 2026-08-04 (Q33), superseding `D32`'s manual rule for this moment | P0 |
| F5-49 | **Acceptance notifies the tenant; a person still confirms the win.** The customer's Accept raises a notification and a timeline entry; the rep marks the deal won, and that act — not the customer's tap — creates the project. *"The rep still marks Won (human confirms, then the project row is born)."* | `SRC` — `DOC04.accepted-human-confirms` (verbatim); `M02-57`, `M07-62`, `M08-02` consumed | P0 |
| F5-50 | **Negotiation is answered the same day, because nothing in the product makes the customer wait.** A customer asking for a discount is answered by the rep applying it and re-sharing — there is no approval hop, no request sheet, no queue and no pending-approval state (`D34`); the only guard is arithmetic at generation (`M06-36`). The customer's page reflects the revised version at the same URL. *"They should not wait two days for an answer, and now nothing in the product makes them."* | `SRC` — `C8`, `C8.wrong.2` (journey L1084–1086, verbatim); `D34` (HONORED); `M06-36`, `M06-45` consumed | P0 |
| F5-51 | **A decline is recorded with its reason, and then the customer is left alone.** The reason is mandatory at the close surface (`M02-54`, `M07`'s mark-lost); a customer who has said they are not interested is not called again for the ruled suppression period, and a customer who has postponed resurfaces on the date they named rather than at someone's convenience. *"They should not then be called for six months."* **Ruled (owner ruling 2026-08-04, Q21):** the Lost state's own "not interested" — the seventh Lost reason — carries the six-month suppression (`M02-54`, `M07-63`); the customer-facing outcome this row states is delivered exactly as written. | `SRC` — `C8`, `C8.wrong.3` (journey L1087, verbatim); `R9` (the mechanism); `M02-53`/`M02-54` consumed; seventh-reason ruling noted 2026-08-04 (Q21) | P0 |

**Behavior detail.** This section carries the product's single sharpest liability and its
answer. Before the amendment that governs this suite, the accepted risk was stated plainly:
anyone holding the URL could accept a very large order, and view tracking could not say which
stakeholder had opened it. That risk is **closed at launch, not later** — by naming links
(`F5-26`), by attributing opens (`F5-27`), by challenging the commitment above a value the
tenant sets (`F5-44`), and by recording who did it with what evidence (`F5-46`).

The design keeps the friction where the risk is. Reading is unchallenged, because a customer who
has to verify themselves to read a proposal will read a competitor's instead. Committing is
challenged, because that is the act with consequences. And the challenge is scoped so tightly to
that act that it cannot drift into being a login: `F5-45` is written to be cited against any
future proposal to "just let them keep the session".

The three outcomes of `C8` are all first-class. Accept has the fullest specification; negotiate
is a product promise about *speed* — the absence of an approval hop is the feature; and decline
is a promise about *restraint* — the reason is captured so the customer is not chased, not so
they can be re-targeted.

**Permissions.** The customer holds nothing (`F5-01`). Applying a discount and re-sharing rides
`F2.M06.create-edit-proposals` and `F2.M06.send-proposals` — there is no discount-approval grant
because there is no approval flow (`D34`, `foundations/F2` §5). Marking won or lost rides
`F2.M07.mark-won-lost`. Setting the acceptance threshold rides `F2.M01.manage-tenant-settings`.

**Edge cases & what-goes-wrong.**

- *Silence after Accept* (`C8.wrong.1`). The page's own confirmation state is immediate and
  independent of any message (`F5-48`).
- *The customer taps Accept on a version that has just been superseded.* The re-check fails
  honestly, the page shows the current version, and nothing is recorded as accepted (`F5-47`).
- *The challenge cannot be delivered* — the rail is unavailable or the contact's number is
  wrong. The failure is stated at the moment of the attempt, the acceptance does not complete,
  and the operator is notified; the product never falls back to accepting an unverified
  commitment above the threshold (`F5-47`, `F8-36`).
- *The deal value sits just below the threshold.* No challenge fires; that is the tenant's
  choice, expressed by the threshold they set, and the acceptance record still captures link,
  contact, address and user agent (`F5-46`).
- *Two contacts on the same deal both tap Accept.* The first acceptance is the record; the
  second meets the already-won re-check (`F5-47`) and is told so plainly.
- *A rep reports that the customer "agreed on the phone".* Not an acceptance (`F5-43`); the rep
  may still mark the deal won on their own judgement, but the product does not represent that as
  the customer's acceptance.
- *A customer accepts and then wants to change the system size.* A new version, not an edit
  (`M08-50`, `M05-81`); the URL does not change.

**Acceptance criteria.**

- Given any path in the product other than the customer tapping Accept on their link, when it is
  exercised, then no acceptance is recorded (`F5-43`).
- Given a deal whose payable exceeds the tenant's configured threshold, when the customer taps
  Accept, then a one-time verification of the accepting person is required before anything is
  recorded; and given a deal below it, when they tap Accept, then no challenge fires (`F5-44`).
- Given a satisfied challenge, when the product is inspected afterwards, then no account,
  password or persistent session exists for that customer (`F5-45`).
- Given a completed acceptance, when the record is read, then it names the link, the contact,
  the challenge outcome, the network address and the user agent (`F5-46`).
- Given an Accept on a superseded version, a stale money figure, or an already-won or already-lost
  deal, when it is submitted, then the server refuses, states what happened, and records no
  partial acceptance (`F5-47`).
- Given a successful Accept, when the tap completes, then the page's confirmation state changes
  within seconds and states what was accepted and what happens next; and given a tenant with a
  connected transactional channel, when the Accept records, then the instant confirmation
  message sends automatically from that channel; and given no connected channel, then the
  composed confirmation is the fallback a person sends, no delivery is claimed on that path,
  and the page state has already done the acknowledging (`F5-48`). *(Send half added to
  reconcile with owner ruling 2026-08-04, Q33; this line previously tested only the page-state
  half, leaving the automatic send the reconciled `F5-48` row above requires with no acceptance
  behind it — see `registers/conflicts.md` row 4.)*
- Given a successful Accept, when it is recorded, then the tenant is notified and no project
  exists until a person marks the deal won (`F5-49`).
- Given a customer asking for a discount, when the rep applies it, then the revised version is
  shareable immediately with no approval step anywhere in the path (`F5-50`).
- Given a declined deal, when the close is recorded, then a reason is mandatory and the ruled
  suppression or resurfacing behaviour follows from it (`F5-51`).

**Localization notes.** The challenge sheet, the confirmation state and every refusal message
are product copy rendered in the customer's language (`F3-06`, `F3-07`); the threshold amount
renders through the one money implementation in the tenant market's format (`F3-20`), and the
message that carries a verification code follows the market pack's messaging rules (`F1-15`).
**Analytics events:** `proposal_accept_attempted`, `proposal_accept_challenge_shown`,
`proposal_accept_challenge_failed`, `proposal_accepted`, `proposal_accept_revalidation_failed`
(reason), `proposal_negotiate_requested`, `proposal_declined`.

### F5.7 — Ask a question, ask for a call, and the named person

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-52 | **"Ask a question" is present in every phase of the link, not only on the proposal.** A customer's question does not stop being a question because the deal was won; the affordance is on the proposal page, the progress page and the handover page, in the same place, with the same behaviour. | `SRC` — `C5` (Ask a question in the proposal list); `UXG-12` (Section D · C3–C9 — customer mid-journey states); `C.framing.3` (the link always answers "what is happening?") | P0 |
| F5-53 | **A question becomes a notification and a timeline entry on the tenant's side, and the reply is a call — the product sends no conversational reply on the tenant's behalf.** Verbatim: *"Questions land as notifications + timeline entries with reply-by-call workflow (app never sends)."* The customer's page acknowledges the question honestly — it states that the question has reached the company and that somebody will call — and it makes no claim about when, unless the tenant's own surface produced a commitment. There is no chat thread, no reply box and no message history on the customer's page, and the page says what happens next rather than implying a conversation that does not exist. *(The Q33 ruling's automatic transactional sends — link, confirmations, status updates — are one-way deal moments and do not touch this rule: no conversational reply is ever sent.)* | `SRC` — `UXG-12` (verbatim); `D32` (the no-conversational-reply half survives the Q33 ruling); `F8-34` consumed (a message about product state describes the actual state) | P0 |
| F5-54 | **The customer can ask to be called, and that request reaches the queue as a customer-requested callback.** The affordance is the customer-side half of the callback path; the queue, its scheduling and its compliance checks are `modules/M07`'s (`M07-33`'s `callback_requested` trigger). **Under the requested-callback lane (owner ruling 2026-08-04, Q30):** the customer's request made here is exactly the explicitly recorded, timestamped consent the lane requires — a customer who names a time outside the market's ordinary window **may be called at that time**, with the call opening by referencing this request and a single "stop" ending the lane; a request naming no time is honoured at the next lawful moment, and the page says which it will be. | `SRC` — `C7.wrong.4` (an always-offered route to a person); `M07-33` consumed (a customer-requested callback also queues); `F1-15` consumed; requested-callback lane per owner ruling 2026-08-04 (Q30) | P0 |
| F5-55 | **A named person, with a phone number, is on the page in every phase.** This is one of the three things the source says carries a customer through their most anxious moment, and it is also what the final step of the journey requires the handover to leave behind: *"the handover should leave them knowing exactly who to call."* The page never shows a generic company line where a named person exists. | `SRC` — `C9` (the three anxiety-reducers, verbatim — "a named person to contact"); `C13` (journey L1137–1140, the one live requirement in that step); `M11-45` (cited — the receipt half is `modules/M11`'s; the named contact is this document's) | P0 |
| F5-56 | **The customer's channel for "that is not my roof" is the question affordance, never an edit — FINAL (owner ruling 2026-08-04, Q25).** The link grants no write access to a survey, a design or any figure; a customer who believes a detected roof is wrong asks, a person reviews, and the correction is made on the operator's surface by **anyone who can run the remote survey** — rep, surveyor or designer (`M04-15`), with studio re-verification and provenance labels as the safety net. The ruling confirms the conservative reading this row carried: the customer's route exists and it is a question, not a mutation; no customer-side write scope is created. | `SRC` — `S4.wrong.5` (cited — the wording, dispositioned by `modules/M04`); `M04-15` consumed; corrector set + no-customer-mutation confirmed per owner ruling 2026-08-04 (Q25) | P1 |

**Behavior detail.** The question affordance is the pressure-release valve of the whole no-login
design. Without it, a customer with a doubt has exactly two options: telephone somebody during
office hours, or go quiet — and the source says plainly that going quiet is what usually
happens, in a thinking window that runs for weeks. One tap that reaches a named human is what
converts silence into a conversation.

What the affordance must not become is a messaging product. There is no **conversational** send
channel in this release — the transactional lane's automatic sends are one-way deal moments and
never a reply (`F5-53`) — so a reply box would create an expectation the product cannot meet;
`F5-53` therefore fixes the shape — the question travels, the acknowledgement is honest, and the
reply is a call. *(Reconciled to owner ruling 2026-08-04, Q33; this prose previously claimed no
send channel existed at all, `D32`'s retired unscoped form, which contradicted the reconciled
`F5-13`/`F5-16`/`F5-48` rows in this document — the ruling leaves `F5-53`'s outcome untouched,
and the row itself states that boundary — see `registers/conflicts.md` row 4.)*
The tenant-side landing (a notification and a timeline entry) is specified here as an
obligation and drawn by `foundations/F6` and `modules/M02`.

The named person is deliberately a requirement of the *page*, not of a message. A customer
looking at a progress page during a long external wait should never have to search an old
message for a phone number.

**Permissions.** Answering a question rides the reader's existing lead or project scope
(`F2.M02.lead-visibility`, `F2.M08.project-visibility`) plus `modules/M07`'s call surfaces; no
new grant exists for it, and none should be added — a question is a timeline event on a record
somebody already owns. Correcting a survey or a design rides `F2.M04.*` / `F2.M05.*` as it
always did (`F5-56`).

**Edge cases & what-goes-wrong.**

- *A question arrives outside working hours.* It lands as a notification and waits; the customer's
  acknowledgement does not promise a time the tenant has not committed to (`F5-53`, `F8-34`).
- *A callback is requested outside the market's lawful calling hours.* The queue entry is
  window-shifted to the next lawful moment and the page says when to expect the call
  (`F5-54`, `M07-35`).
- *A customer asks the same question three times because nothing visibly happened.* The
  acknowledgement state persists on the page and shows that the earlier question was received —
  repetition is a symptom of an invisible queue, and the page is where it is made visible.
- *A customer replies to the acknowledgement expecting a chat.* There is no reply surface; the
  page states that the answer comes as a call (`F5-53`).
- *A customer wants to correct their roof outline.* `F5-56`: they ask; an operator corrects.

**Acceptance criteria.**

- Given any phase of the link, when the customer opens it, then the question affordance is
  present in the same place with the same behaviour (`F5-52`).
- Given a submitted question, when it is received, then a notification and a timeline entry
  exist on the tenant's side, the customer's page acknowledges receipt without promising a
  delivery or a time the tenant has not committed to, and no reply surface exists (`F5-53`).
- Given a customer requesting a call, when the request is submitted, then a
  customer-requested callback entry exists in the queue, scheduled no earlier than the market's
  lawful window (`F5-54`).
- Given any phase of the link, when it renders, then a named person and a phone number are
  present (`F5-55`).

**Localization notes.** The question affordance, its acknowledgement and its explanation of what
happens next are product copy in the customer's language (`F3-07`); the question's own text is
customer-authored data and is never translated or altered by the product. The named contact's
name and number are never translated (`F3-08`). **Analytics events:** `customer_question_asked`
(phase), `customer_question_acknowledged`, `customer_callback_requested` (phase,
window-shifted yes/no), `customer_contact_tapped`.

### F5.8 — Paying the advance

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-57 | **This is the highest-anxiety moment in the entire journey, and the page answers it with exactly three things: an instant receipt, a named person to contact, and a clear statement of what happens next and when.** The source names all three; this document renders all three, and a payment surface that carries only the first is incomplete. The customer is sending real money to a company they met weeks ago — the design objective is reassurance, not efficiency. | `SRC` — `C9` (journey L1089–1094, the three requirements verbatim; the source records no "goes wrong" items for this step and none is invented); `M11-45` consumed (the receipt half) | P0 |
| F5-58 | **The customer pays the tenant, through the tenant's own account — the platform never sits in the money path.** The page presents the payment instrument the money module minted on the tenant's own connected account for the tranche that is due, with its label and amount; the platform touches no customer funds and takes no cut. Where the tenant has connected no account, the page carries no instrument and the tenant collects by their own means (`M11-21`) — the page never fabricates a payment route. | `SRC` — `DOC02.link-grant` (the link's grants include paying a tranche via the tenant's own payment link); `M11-24`, `M11-55` consumed; `R4` (cited — "platform never touches tenant funds"; the mechanics are `modules/M11`'s) | P0 |
| F5-59 | **The receipt appears the moment the money is confirmed or recorded, and carries its confirmation state honestly.** A payment the tenant's account has confirmed and a payment a person recorded by hand are both receipts and are not presented as identical certainties; the state travels with the receipt onto this page exactly as the money module published it (`M11-41`, `M11-42`). This page never computes, re-rounds or re-labels a money figure (`F8-24`), and a figure that cannot be reconciled at display time renders provisional rather than final (`F8-12`). | `SRC` — `C9` ("an instant receipt"); `M11-41`, `M11-42`, `M11-45` consumed; `F8-12`, `F8-24` consumed | P0 |
| F5-60 | **Nothing on this page is ever gated by money — the customer's own or the tenant's.** An unpaid tranche does not hide the progress page, dim a section, or attach a demand to a surface the customer came to for something else; the tenant's platform billing state is invisible here in every direction (the customer never sees a platform bill, a plan, a dunning notice or a subscription state). The chase happens through a person (`M08-38`, `M08-39`, `M11-32`, `M11-53`). | `SRC` — `C.lifecycle.7` (verbatim); `DOC08.link-never-billing-blocked`; `M11-32`, `M08-39` consumed; `BM-32`/`BM-35` consumed; `DOC16.two-money-systems` (cited — `BM-02`: the two money systems never mix on one surface) | P0 |

**Behavior detail.** The money section of the customer's page is deliberately the thinnest
section in this document, because almost everything about it belongs to `modules/M11`: the
schedule, the instrument, the ledger, the confirmation states, the reversal trail. What this
document owns is the *sentence*: what the customer reads at the moment they are most nervous.
The source's three requirements are the acceptance test, and the third — *what happens next and
when* — is the one most often forgotten, because it is the only one that is not a database row.
It is composed from the project's own facts (the next stage, its expected timing) and it is
never fabricated to make the page feel complete (`F5-66`).

`F5-60` states the money law from the customer's side in both directions at once. The tenant's
customer is not punished for the tenant's billing state (`F5-23`), and the tenant's customer is
not punished for their own late payment either (`F5-24`) — and neither system's state is ever
rendered on the other's surface.

**Permissions.** Minting or copying a payment instrument rides `F2.M11.record-payments`;
recording a payment by hand rides the same row; connecting the account rides
`F2.M11.connect-gateway`. The customer holds nothing, and no permission in the suite gates
*reading* this page — the link's scope does (`F5-21`).

**Edge cases & what-goes-wrong.**

- *The tenant has not connected a collections account.* No instrument is shown and none is
  invented; the page still shows what is due, the named contact and what happens next
  (`F5-58`, `M11-21`).
- *A payment was made but confirmation has not arrived.* The page shows the payment as recorded
  with its honest confirmation state rather than as either nothing or as final (`F5-59`,
  `M11-42`) — a surface that showed nothing between payment and confirmation would put the
  customer through the exact anxiety this section exists to remove.
- *A figure cannot be reconciled at the moment of display.* It renders provisional, visibly
  labelled, and never as a final price (`F8-12`).
- *The tranche amount changes after an instrument was minted.* The money module supersedes the
  instrument (`M11-30`); this page renders what is currently owed and never an instrument for a
  superseded amount.
- *Somebody proposes putting an overdue notice on the customer's progress page as leverage.*
  Refused by `F5-60` — the whole point of the law is that the temptation is real.

**Acceptance criteria.**

- Given a confirmed or recorded payment, when the customer opens their link, then a receipt, a
  named contact with a number, and a statement of what happens next and when are all present
  (`F5-57`).
- Given a tenant with a connected collections account and a due tranche, when the customer opens
  their link, then the instrument presented is the tenant's own for that tranche; and given no
  connected account, when they open it, then no instrument is shown and none is fabricated
  (`F5-58`).
- Given a payment confirmed by the tenant's account and a payment recorded by hand, when both
  render, then each carries its own confirmation state and neither is presented as the other
  (`F5-59`).
- Given an overdue tranche of any age and a tenant in any platform billing state, when the
  customer opens their link, then no section is hidden, dimmed, gated or annotated because of
  either (`F5-60`).

**Localization notes.** Amounts render through the one money implementation in the tenant
market's format, identically in every language (`F3-20`, `F3-24` — the confirmation state and
any provisional label travel with the amount and are never dropped to fit). Payment-mode
vocabulary is market-pack data with translated display (`F1-09`, `F1-18`). **Analytics events:**
`customer_payment_surface_viewed`, `customer_payment_instrument_opened`,
`customer_receipt_viewed`, `customer_payment_next_step_rendered` (present / absent — absent is an
operational signal that the project has no next-step fact to publish).

### F5.9 — Phase 2: progress, the long wait, installation and commissioning

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-61 | **After the deal is won the same URL becomes the progress tracker, and it is the single highest-value surface in the delivery stage.** It shows what is done, what is happening now, and what is waiting — with dates. The source's assessment is carried as the rationale: most support calls in this industry are *"what is the status?"*, and *"one honest link answers them."* | `SRC` — `C10` (journey L1096–1116, verbatim); `C.lifecycle.6`; `S8.screen.7` (same tokenised URL, stages, what is waiting and why, expected dates); `S8.rec.4` (the highest-value screen, verbatim) | P0 |
| F5-62 | **The stage display uses the product's one canonical stage chain, rendered with the market pack's labels.** This page names no stage of its own and invents no intermediate step: the chain, its blocker parties and its terminal states are `modules/M08`'s (`M08-08`), the labels and the skippable set are pack data (`F1-22`, `M08-09`), and a stage a market skips does not appear as a permanently empty row on the customer's page. | `SRC` — `R2` as amended 2026-08-02 (the customer-link stage-display half named in the ruling's own consequence); `M08-08`, `M08-09`, `F1-22` consumed | P0 |
| F5-63 | **Every wait names the party being waited on, the reason, the date the wait started, and the typical duration where the market pack declares one.** This is the line the source says *"prevents more support calls than anything else in the product"*: a stage that is waiting says who it is waiting for and since when, in the market's own words for that party. The four facts are published by `modules/M08` (`M08-29`); this document composes them into the sentence the customer reads, and composes nothing that was not published. | `SRC` — `C10` (the worked example and its verdict, verbatim); `M08-29`, `M08-20`, `M08-21`, `M08-23` consumed; `F1-22` (party labels); `F1-53` (the pack's wait-attribution framing and typical-duration declarations — cite added by Task 26 per the Task 20 review) | P0 |
| F5-64 | **The internal reason for a wait is never the published one.** A supplier's failure is the company's problem to solve and not the customer's to read: the customer sees the honest stage and the fact that material is on order with an expected date — never the supplier, the internal note, or the commercial detail behind it. The separation is guaranteed on the producing side (`M08-25`); this document guarantees that the customer page renders only the published field. | `SRC` — `C10`; `M08-25` (verbatim: "customer sees 'material ordered', not the supplier's problem") | P0 |
| F5-65 | **The product's job during an external wait is to make it visible and attributable — not to claim it can make it shorter.** External approvals and inspections take as long as they take; the page states the wait honestly with its attribution and its expected duration, and makes no promise about influencing it. *"A delay you explained is tolerable; a delay you hid is a complaint."* | `SRC` — `C10`, `C10.wrong.1` (journey L1100–1101, L1115–1116, verbatim); `M08-26` consumed; `DOC00.customer-journey-parallel` (cited — "made visible and attributable, not faster", dispositioned by Task 3) | P0 |
| F5-66 | **The page never renders a completion percentage and never fabricates a date.** A system installed but stuck before commissioning is not "90% done" — it is in its stage, with the time it has been there (`M08-13`). Where an expected-until date is unknown, the page says the date is not yet known; it does not compute a plausible one to fill the sentence, and no figure or date on this page exists that `modules/M08` did not publish. | `SRC` — `M08-13`, `M08-29` consumed; `F8-01` (a value whose basis cannot be established is not rendered as a value); `C10.wrong.2` (the reason-and-duration line is the specific thing that must be real) | P0 |
| F5-67 | **Silence, not delay, is the failure this page exists to kill.** The source is unambiguous that customers become unhappy *"almost always because of silence rather than delay"*, and names the loop it prevents: *"They call the rep. The rep does not know. They call again."* The page is therefore updated by the delivery work itself — completing a stage updates it, with no separate publish step for anybody to forget (`M08-15`). | `SRC` — `C10.wrong.1`, `C10.wrong.2` (journey L1100–1101, verbatim); `M08-15` consumed | P0 |
| F5-68 | **Before a crew arrives, the customer is told who is coming, when, how long it will take, and what disturbance to expect.** The source's own summary of what covers it is a message the evening before carrying the crew lead's name and number; the four facts are the requirement, whatever surface carries them. The schedule and its facts are the project's (`modules/M08`); the message **sends automatically the evening before from the tenant's connected transactional channel** (the same connection `modules/M03` establishes, transactional template class per `M03-03`), composed from the message-template registry's seeded **`crew_arrival`** row (`F6-26`, owner ruling 2026-08-06 Q49), with the composed copy-paste text a person sends where no channel is connected and no delivery claimed on that path, and the progress page carries the same four facts so a customer who lost the message still has them. **The hour it goes out is market-pack data (owner ruling 2026-08-06, Q50):** the pack declares the send hour as a *default* — early evening, **read on the tenant's timezone (`F1-10`) and never the customer's (owner ruling 2026-08-06, Q54)**, a solar EPC's customers being local to it so that the two clocks are the same in practice, and where an EPC does serve a customer in another timezone the message goes at the **EPC's** evening hour — sitting inside the market's statutory messaging window, which is a *floor* **evaluated on that same tenant timezone: one clock for the hour and for the window it sits inside, never two (owner ruling 2026-08-06, Q58)** (`F1-15`, `F1-17`); where the configured slot falls outside lawful hours the message goes at the **last lawful moment before it, never after**, and a tenant may **narrow** the window and never widen it — no tenant setting and no platform support action configures around a floor item. Both sides of that lawful-hours comparison are read on the tenant's clock: an out-of-timezone customer's own statutory hours are never evaluated, and where a tenant's timezone differs from its market's default (`F1-21`) the market's window is evaluated on the tenant's clock rather than the market's — the same accepted simplification the hour carries, on the same premise that a solar EPC's customers are local to it. *(Amended to owner ruling 2026-08-06, Q46; this cell previously read "the message is composed and sent by a person (`D32`)" — `D32`'s retired manual-only rule — which held the evening-before crew message off the transactional lane its already-reconciled siblings `F5-13`, `F5-16` and `F5-48` ride, and which `registers/conflicts.md` row 12 recorded as a contradiction against `ux/briefs/SCR-F5-02-link-progress.md`. The ruling settles it in favour of the lane; the four facts and the progress-page sentence are unchanged.)* *(Further amended to owner rulings 2026-08-06 Q49 and Q50, which answer the two questions the `Q46` application raised and recorded as open in §6. Before them this cell named **no template row** and **no send hour**: "the evening before" stood unresolved, with no relationship stated to the compliance ruleset behind `F5-11`. `Q49` — an authoring act applying `Q46`, not a new decision — seeds the `crew_arrival` row in `F6-26`, on the `survey_complete` precedent set when `Q24` was applied; `Q50` makes the hour pack data inside a floor. The four facts, the two send branches and the progress-page sentence are unchanged by both.)* *(Further amended to owner ruling 2026-08-06, Q54 — the clock, and only the clock. The send-hour sentence previously read "early evening in the customer's market timezone", the `Q50` wording, which pointed at a different clock from `F1-10`'s tenant-timezone law wherever a tenant's timezone and its customer's differ; §6 recorded that as open. The owner reads the hour on the **tenant's** timezone, the reasoning being that a solar EPC's customers are local to it so the two clocks are the same in practice, and the consequence — an out-of-timezone customer receiving the message at the EPC's evening hour — is accepted knowingly; `F1-15` carries the same reasoning. The four facts, the two send branches, the progress-page sentence, the `crew_arrival` row and the window floor are all unchanged. **What the hour *is* stays undeclared for IN** — the IN pack declares neither a statutory messaging window nor a send hour, register `Q53` is still open, and nothing here assumes a value for either.)* *(Further amended to owner ruling 2026-08-06, Q58 — the window's clock, and only the window's clock. The floor clause above previously named **no clock** for the window: `Q50` had put the hour and the window on one clock (the customer's market timezone) and `Q54` moved only the hour to the tenant's, leaving "outside lawful hours" and "the last lawful moment before it" with no stated frame wherever a tenant's timezone differs from its market's default; §6 recorded that as open. The owner reads the window on the **tenant's** timezone, the same clock as the hour — one clock, not two — the reasoning being `Q54`'s restated: a solar EPC's customers are local to it, so a second clock would add machinery with no real-world difference, and the accepted consequence is stated in the sentence itself rather than compensated for. The four facts, the two send branches, the progress-page sentence, the `crew_arrival` row, the window's floor status and the last-lawful-moment resolution are all unchanged. **What the hour and the window *are* stays undeclared for IN** — the IN pack declares neither, register `Q53` is still open, and nothing here assumes a value for either.)* | `SRC` — `C11` (journey L1118–1126, verbatim); `D32` (cited — its manual-only rule retired for this moment by owner ruling 2026-08-04 (Q33) and applied here by owner ruling 2026-08-06 (Q46); it survives only as the fallback path's no-delivery-claim discipline); `M05-76`/`M08-41` consumed (the work sequence plugs in rather than being rebuilt); the `crew_arrival` template row per owner ruling 2026-08-06 (Q49) → `F6-26`; the send hour and its window floor per owner ruling 2026-08-06 (Q50) → `F1-15`, `F1-17`, whose *"customer's market timezone"* clock wording is **superseded** by owner rulings 2026-08-06 (Q54, for the hour) and 2026-08-06 (Q58, for the window) — both are read on the tenant's timezone per `F1-10`, one clock | P0 |
| F5-69 | **Commissioning is the system switching on and a pile of documents — and neither the crew's internal detail nor any commercial figure reaches the customer's page.** Installation and commissioning steps are recorded by the coordinator with an optional note of who did the work (`R16`, `M08-42`); the customer sees stages and their dates, never the checklist's internals, and no surface in the installation path shows a price, discount, tranche or margin (`F2-06`, `M08-43`). | `SRC` — `C12` (journey L1128–1135, verbatim); `R16` (no crew user in this release; coordinator attribution); `F2-06`, `M08-42`, `M08-43` consumed | P0 |

**Behavior detail.** This is the phase where the product earns the referral, and the source's
diagnosis is the design brief: the customer's unhappiness during delivery is almost never about
the length of the wait. It is about not knowing. The worked example the source gives is a short
list of stages with ticks, one current item, and one waiting item that carries its reason, its
start date and its typical duration — and the verdict on that last line is that it prevents more
support calls than anything else in the product.

Composing that line is this document's only real authorial act, and it is bounded on all sides:
`modules/M08` publishes four structured facts per blocker and this page turns them into a
sentence; where a fact is missing the sentence is shorter rather than invented (`F5-66`); where
an internal reason exists it is never the one published (`F5-64`); and the words for the waiting
party and the stage come from the market pack rather than from this document (`F5-62`,
`F5-63`).

The page must also be honest about what the product cannot do. `F5-65` is deliberately phrased
as a limit: the product makes the wait visible and attributable, and claims nothing about
shortening it. That restraint is what makes the rest of the page credible.

**Permissions.** Moving stages and setting or clearing blockers ride `F2.M08.update-stages`;
uploading and verifying documents rides `F2.M08.project-documents`; working the installation
checklist rides `F2.M08.installation-checklist` under `F2-06`'s no-commercial-figures law.
Nothing on the customer's side is granted, and no preset is required to "publish" the page —
completing the work publishes it (`F5-67`).

**Edge cases & what-goes-wrong.**

- *The customer calls the rep, who does not know the status* (`C10.wrong.2`). The loop the page
  exists to close; the rep reads the same facts the customer does (`M08-18`).
- *An external body rejects or delays an incentive claim.* Surfaced with its reason — *"this is
  the customer's money and they will ask"* (`M08-27`) — rather than left as an unexplained
  stalled stage.
- *A stage is skipped in this market.* The pack's skippable set governs; the customer's page does
  not show a permanently empty row (`F5-62`, `F1-35`).
- *A project moves backwards.* Real installations do; the page shows the honest current stage
  rather than preserving a prior claim (`M08-14`).
- *A blocker has no expected-until date.* The page says so rather than estimating (`F5-66`).
- *The wait is the company's own fault.* The party set includes the company and the page says so
  — an unattributed blocker does not exist (`M08-23`).
- *The project is cancelled.* The page shows the honest state; the link is not silently killed
  (`F5-25` edge cases, `M08-51`).
- *The pack's crew-message hour falls outside that market's lawful messaging window.* The
  message goes at the last lawful moment before the configured slot and never after it; the
  window is the floor and the hour is the default that yields to it (`F5-68`, `F1-15`, `F1-17`,
  owner ruling 2026-08-06 Q50). The slot and the window are both read on the **tenant's** clock
  (`F1-10`, owner ruling 2026-08-06 Q58), so "outside lawful hours" has one frame and not two.
  *(Case added by the pass applying Q50; before the ruling the send hour was undecided and this
  list had no case for it. Clock sentence added by the pass applying Q58, which supplies the frame
  the case had been stated without.)*
- *The customer sits in a different timezone from the tenant.* The hour resolves on the
  **tenant's** clock, so the message goes at the EPC's evening hour and not the customer's
  (`F1-10`, `F1-15`, owner ruling 2026-08-06 Q54) — and the lawful-window check it yields to
  resolves on that same tenant clock (owner ruling 2026-08-06 Q58), so the customer's own
  statutory hours are never evaluated either. The premise of the simplification is that a
  solar EPC's customers are local to it; the consequence is accepted knowingly and there is no
  per-customer clock and no setting for one. *(Case added by the pass applying Q54; before the
  ruling the two clocks were the open question and this list had no case for them diverging.
  Extended by the pass applying Q58 to name the window alongside the hour.)*
- *The tenant's own timezone differs from its market's default timezone.* The market's statutory
  messaging window is evaluated on the **tenant's** clock, not the market's (`F1-10`, `F1-21`,
  `F1-15`, owner ruling 2026-08-06 Q58) — the second face of the same accepted simplification,
  recorded rather than compensated for: no second window computation exists. *(Case added by the
  pass applying Q58; before the ruling this divergence was §6's open question and no case could
  state an outcome.)*

**Acceptance criteria.**

- Given a won deal, when the customer opens the URL they were sent with the proposal, then the
  progress phase renders with done, current and waiting items and their dates (`F5-61`).
- Given any stage rendered on the customer's page, when it is read, then it is a value of the
  canonical chain displayed with the market pack's label, and a stage the market skips is absent
  rather than permanently empty (`F5-62`).
- Given a project with an active blocker, when the customer's page renders, then the line names
  the party, the reason, the date the wait started, and the typical duration where the pack
  declares one (`F5-63`).
- Given a blocker with an internal reason recorded, when the customer's page renders, then the
  internal reason does not appear (`F5-64`).
- Given an external wait, when the page renders it, then it states the wait and its attribution
  and makes no claim about shortening it (`F5-65`).
- Given a project at any point, when the customer's page renders, then no completion percentage
  appears and no date appears that `modules/M08` did not publish (`F5-66`).
- Given a stage completion, when it is recorded, then the customer's page reflects it without a
  separate publish action (`F5-67`).
- Given a scheduled installation, when the customer is informed, then who is coming, when, how
  long and what disturbance to expect are all stated, and the same four facts are on the progress
  page (`F5-68`); and given a tenant with a connected transactional channel, when the evening
  before the installation arrives, then the crew message sends automatically from that channel
  under the transactional template class; and given no connected channel, then the composed
  message is available for a person to send and no delivery is claimed on that path (`F5-68`,
  `M03-03`, owner ruling 2026-08-06 Q46); and on either branch the text is composed from the
  registry's seeded `crew_arrival` template (`F6-26`, owner ruling 2026-08-06 Q49); and given the
  market pack's declared send hour, when the evening-before moment is resolved, then it is that
  hour **on the tenant's timezone** (`F1-10`) — including where the customer sits in a different
  timezone, in which case the message goes at the tenant's evening hour and not the customer's —
  and where the configured slot falls outside the market's
  statutory messaging window — that window evaluated on the same tenant timezone (`F1-10`, owner
  ruling 2026-08-06 Q58), including where the tenant's timezone differs from its market's default
  (`F1-21`) — the message goes at the last lawful moment before the slot and never
  after it, with tenant configuration able to narrow that window and never widen it (`F5-68`,
  `F1-15`, `F1-17`, owner rulings 2026-08-06 Q50, Q54 and Q58). *(Amended to owner ruling 2026-08-06, Q46; this line
  previously tested the four facts only and carried an open-question note directing the reader to
  `registers/conflicts.md` row 12 before building, on the ground that "whether the message also
  sends automatically from the tenant's connected transactional channel is undecided, and no
  criterion here or under `tasks/` tests a send either way." The ruling settles the lane
  membership in favour of the transactional lane, alongside the reconciled siblings `F5-13`,
  `F5-16` and `F5-48`; the send is now tested on both branches here and at
  `tasks/F5-customer-link.md` T-F5-002. Row 12 is `registers/conflicts.md`'s owner's to mark
  closed.)* *(Extended to owner rulings 2026-08-06 Q49 and Q50; the template clause and the
  send-hour clause are new, and before them this line tested the two send branches with no
  template row named and no hour tested at all — the two gaps §6 recorded as open. The four-facts
  clause is unchanged.)* *(Amended again to owner ruling 2026-08-06, Q54 — the clock only: the
  send-hour clause previously read "then it is that hour in the customer's market timezone", the
  `Q50` wording, and now names the tenant's clock per `F1-10`. What the hour *is* remains
  undeclared for IN — register `Q53` is still open — so this criterion tests the resolution rule,
  never a value.)* *(Amended a third time to owner ruling 2026-08-06, Q58 — the window's clock: the
  lawful-window clause previously named no clock for the window, the gap §6 recorded as open once
  `Q54` moved the hour alone to the tenant's, and now names the same tenant clock — one clock for
  both. What the window *is* is likewise undeclared for IN under the still-open `Q53`, so this
  criterion continues to test a resolution rule and never a value.)*
- Given the installation and commissioning phase, when the customer's page renders, then no
  checklist internal, no crew attribution detail and no commercial figure appears (`F5-69`).

**Localization notes.** Stage labels and blocker-party labels are market-pack data rendered in
the reader's language (`F1-22`, `F3-12`); canonical stage values keep their fixed identities and
only their display is translated. Dates render through the one date implementation in the pack's
style on the tenant's timezone (`F3-22`, `F1-10`). The waiting sentence is composed from
translated fragments and pack labels and must survive expansion without truncating the party or
the date (`F3-16`). **Analytics events:** `progress_link_viewed`, `progress_blocker_line_rendered`
(party, has-expected-date), `progress_stage_rendered` (stage), `progress_viewed_during_blocker`
(a proxy for the support call that did not happen).

### F5.10 — Phase 3: the handover pack, the referral, and after

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-70 | **At handover the link becomes the document pack — the same URL, its third and final phase, and it is permanent (owner ruling 2026-08-04, Q34).** Reaching the terminal handed-over stage is the project's act (`M08-46`); the transition of the page is this document's. Because the customer already holds the URL, handover requires no new share for the customer to reach their documents: the rep's send is a courtesy, not the mechanism. Post-handover the page is the customer's **permanent, read-only "solar file"** — documents, warranties and the referral ask (`F5-72`) — served for life, view-only: every respond scope is dead with its phase, and nothing on the page mutates anything ever again. | `SRC` — `C.lifecycle.1`, `C.lifecycle.7` (journey L1154–1155, verbatim); `C12`; `M08-46`, `M08-32` consumed; permanence + view-only per owner ruling 2026-08-04 (Q34) | P0 |
| F5-71 | **The pack contains what the source names: the warranty documents, the commissioning certificate, the interconnection or metering approval, and how to read their generation.** The rows themselves, and which rows a market or segment omits, are pack data on the project's checklist (`M08-30`, `F1-22`); this page renders what the checklist assembled and never invents a row or presents an absent document as present. | `SRC` — `C12` (journey L1128–1135, the contents verbatim); `M08-30`, `M08-32`, `M08-48` consumed | P0 |
| F5-72 | **The referral is asked for here, at handover — while the roof is new and the first bill is about to arrive — and never six months later.** The ask is a first-class element of the handover page. What it produces is an attributed referral linking the referring customer to a new lead, visible on both records (`M02-16`, `M08-47`). **No monetary credit, no redemption and no balance exists in this release**, so the page promises none: it asks, it thanks, and it makes no offer it cannot keep. | `SRC` — `C12` (the referral rule verbatim); `R15` (the customer-facing half; the tag is `M02-16`'s, the project-side ask `M08-47`'s, the credits ledger the spec-locked exclusion); `UXG-19` (cited — design the tag and the chip only) | P0 |
| F5-73 | **The handover leaves the customer knowing exactly who to call.** A named person with a number survives on the page after the project closes — the one live requirement the final step of the journey carries into this release. | `SRC` — `C13` (journey L1137–1140: "the handover should leave them knowing exactly who to call"); `C9` (the same requirement at the payment moment); `F5-55` | P0 |
| F5-74 | **The link keeps serving the pack after the project closes — permanently.** Closing is not deleting: a handed-over project stays readable with its documents intact, and the customer's link continues to serve them **for life** (`F5-22` as ruled — view scopes never expire; owner ruling 2026-08-04, Q34). Nothing about closure removes the customer's access, and nothing about the tenant's billing state does either (`F5-23`). | `SRC` — `M08-49` (verbatim: "its customer link continues to serve the pack"); `DOC04.link-lifecycle`; `C.lifecycle.7`; permanence per owner ruling 2026-08-04 (Q34) | P1 |

**Behavior detail.** The handover phase is short and its job is precise: hand over the papers,
ask the question, and leave a phone number. The source's argument for the timing of the referral
ask is the whole of the design rationale — this is the moment the customer decides whether they
will recommend the company, and asking later means asking after the feeling has faded.

The restraint in `F5-72` matters as much as the ask. The referral model in this release is
attribution, not reward; a page that implied a credit, a discount or a balance would be making a
promise the product has no mechanism to keep, and the exclusion is explicit rather than merely
unbuilt. When a credits capability is eventually built it references the referral rows that
already exist, so nothing here needs to be undone.

**Permissions.** Assembling the pack rides `F2.M08.project-documents`; reaching the terminal
stage rides `F2.M08.update-stages`; the courtesy re-send of the link rides
`F2.F5.mint-customer-link` for a new named recipient, or the reader's project scope for
re-sending an existing contact's own link. The referral row the ask produces is
`modules/M02`'s.

**Edge cases & what-goes-wrong.**

- *A checklist row is still pending.* Handover is refused at the project (`M08-32`); the page
  does not enter its final phase with an incomplete pack, and it never shows a missing document
  as present (`F5-71`).
- *The customer refers somebody and then asks what they get.* Nothing, in this release, and the
  page never suggested otherwise (`F5-72`).
- *The customer returns two years later wanting their warranty document.* The link serves it for
  the life of the token; beyond that, `F5-25`'s honest page and an operator re-mint — the gap in
  the renewal path is `Q34`.
- *The tenant lapses on their subscription after handover.* The customer's pack keeps working
  (`F5-23`, `BM-32`).

**Acceptance criteria.**

- Given a project reaching its terminal handed-over stage, when the customer opens the same URL
  they have always used, then the document pack renders (`F5-70`).
- Given a completed checklist, when the pack renders, then it carries the warranty documents,
  the commissioning certificate, the interconnection or metering approval and the
  how-to-read-generation material, with no row invented and no absent document shown as present
  (`F5-71`).
- Given the handover page, when it renders, then the referral ask is present and offers no
  monetary credit, redemption or balance (`F5-72`).
- Given a closed project, when the customer opens the link, then a named person and a phone
  number are present (`F5-73`).

**Localization notes.** Document titles that are tenant- or market-authored are data and are not
translated by the product (`F3-10`, `F1-22`); the product's own copy around them — the pack
heading, the referral ask, the contact block — is translated (`F3-07`). Certificate and approval
names follow the market pack's checklist vocabulary. **Analytics events:**
`handover_pack_viewed`, `handover_document_downloaded` (row), `referral_ask_shown`,
`referral_submitted`, `handover_contact_tapped`.

### F5.11 — Link security, revocation and the public page

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-75 | **The link's product-level security properties are fixed and non-negotiable: unguessable, scoped, expiring, revocable — and attributable.** These are the properties the token scheme must satisfy; how it satisfies them is engineering and is deliberately absent from this suite. No surface may weaken one of them for convenience, and no market pack, plan tier or tenant setting may switch one off. *("Expiring" is the capability of a defined per-scope lifetime: respond scopes end with their phase, and the deal link's view scope carries a **permanent-until-revoked** lifetime by owner ruling 2026-08-04 (Q34) — revocability is the kill switch that keeps permanence safe.)* | `SRC` — `DOC08.link-token` (verbatim: "tokenised links are unguessable, scoped, expiring, and revocable"); `DOC02.link-grant` (a scoped grant, never a session); `R6` (attributable); view-scope lifetime per owner ruling 2026-08-04 (Q34) | P0 |
| F5-76 | **A revoked or regenerate-with-revoke link dies instantly, regardless of its own expiry.** Revocation is immediate and absolute; there is no propagation window a customer could slip through, and an expiry date does not survive a revocation. | `SRC` — `DOC08.link-token` (verbatim: "a revoked/regenerated link dies instantly regardless of its own expiry"); `DOC04.link-lifecycle` (status revoked) | P0 |
| F5-77 | **The public page carries no customer personal data in its address and no third-party code of any kind.** No customer name, phone number, address or identifier appears in a URL or in a log line; the pages load no third-party script, font or analytics; and the open events they emit carry link, moment and device class only (`F5-29`). | `SRC` — `DOC08.open-tracking` (verbatim, all three clauses); `DOC04.link-events` ("No PII in URLs or logs") | P0 |
| F5-78 | **Public access is rate-limited, and a customer who meets a ceiling meets an honest page rather than silence.** Ceilings exist per link on viewing and, more tightly, on responding, with a global ceiling on the public surface and backoff behind it; the source's stated figures are the baseline. The ceilings are set so that ordinary reading — a customer showing the proposal to their family across an evening — does not reach one, and a customer who does is told what happened and who to call (`F5-25`), never left with a blank page. | `SRC` — `DOC08.link-rate-limits` (60 views/hour per link; 5 respond-actions/hour; a global public-route ceiling with backoff); `F8-36` consumed | P0 |
| F5-79 | **Every access to a customer link is audit-logged, and every act on one is on the suite's audit checklist.** Mint, re-mint, revoke, open, accept, negotiate and decline are named events written with their attribution; the log is tenant-scoped and exportable by the tenant (`F2-23`). | `SRC` — `DOC02.link-grant` (verbatim: "Every access is audit-logged"); `DOC08.audit-coverage`; `F2-22`, `F2-23` consumed | P0 |
| F5-80 | **There is one customer-link framework, and no private or local share path survives beside it.** Every customer-facing share surface in the product is a tokenised link under these laws — server-rendered, scoped, expiring, revocable; the prototype-era local share viewer is replaced and no local-only share path exists anywhere. The framework ships with its full lifecycle, labelling, contact attribution and acceptance challenge from launch rather than in stages. **Resolved (owner ruling 2026-08-04, Q27):** the studio's customer-facing 3D view ships **inside the proposal link** ("View in 3D", `F5-33`) — no separate customer-facing 3D share link exists, so the one-framework law holds with nothing beside it. | `SRC` — `DOC05.share-links-replaced` (verbatim); `DOCFC.link-full-lifecycle` ("named links now in scope, used at launch"); `DOC14.named-links-otp`; `OD-5` (cited — "in v1 scope" is the surviving reading of the launch commitment); in-link 3D per owner ruling 2026-08-04 (Q27) | P0 |

**Behavior detail.** The brief for this section is narrow on purpose: state the properties, not
the mechanism. A reader of this suite should be able to review the customer link's security
posture without meeting a single implementation term, and an engineer implementing it should
find every product-level constraint they must satisfy in one place.

The five properties of `F5-75` are load-bearing together. Unguessable and scoped make the link
safe to send through a channel the product does not control. Expiring bounds the blast radius of
a link that leaked years ago. Revocable is the answer when a link reaches the wrong person today.
Attributable is what makes the acceptance record worth having. Remove any one and the others stop
being sufficient.

Two deliberate asymmetries are worth naming. Revocation is instant while access is permanent
(§F5.3, Q34 ruling) — the product should never need a customer to wait for access, but should
always be able to withdraw it now. And attribution is thin while reading and rich at the moment of commitment
(`F5-29` versus `F5-46`) — the product observes as little as possible about a person reading a
document at home, and records as much as it responsibly can about a person committing money.

**Permissions.** `F2.F5.revoke-customer-link` holds revocation and regenerate-with-revoke;
`F2.F5.mint-customer-link` holds minting and re-minting. Reading the audit log is
`F2.M01.manage-team`'s and the tenant export is `F2-23`'s; neither is re-granted here.

**Edge cases & what-goes-wrong.**

- *A link is posted publicly by its recipient.* Scoped and revocable: the operator revokes it,
  and the acceptance challenge means nothing irreversible could have happened above the
  threshold in the meantime (`F5-44`, `F5-76`).
- *An operator regenerates a link but does not revoke the old token.* Both continue to work,
  by design and by explicit choice at the moment of re-minting (`F5-22`); choosing
  regenerate-with-revoke kills the old one instantly (`F5-76`).
- *A support request asks for a customer's link to be looked up by their phone number.* The
  lookup happens on the tenant's own record; nothing puts the number in a URL (`F5-77`).
- *Analytics or marketing wants a tracking script on the public page.* Refused by `F5-77` —
  zero third-party code, without exception.
- *A ceiling is hit by legitimate reading.* An honest page and a named contact (`F5-25`,
  `F5-78`); a ceiling tuned so tightly that ordinary reading trips it is a defect against
  `F5-78`'s own wording.

**Acceptance criteria.**

- Given any customer-facing link in the product, when its properties are inspected, then it is
  unguessable, scoped, expiring, revocable and attributable, and no setting can disable one
  (`F5-75`).
- Given a revoked link, when it is opened at any time before its expiry, then it does not serve
  (`F5-76`).
- Given any customer-facing page, when it is loaded, then its address contains no customer
  personal data and it requests no third-party script, font or analytic (`F5-77`).
- Given a link exceeding a viewing or responding ceiling, when it is used, then the customer is
  shown the honest page with a named contact rather than a blank or an error (`F5-78`).
- Given any mint, re-mint, revoke, open, accept, negotiate or decline, when it occurs, then an
  audit entry records it with attribution, and the tenant can export their own log (`F5-79`).
- Given every customer-facing share surface in the product, when they are enumerated, then each
  is a tokenised link under this framework and no local-only share path exists (`F5-80`).

**Localization notes.** Every failure, ceiling and refusal page is product copy rendered in the
customer's language with English fallback per string (`F3-05`, `F3-07`). **Analytics events:**
`customer_link_rate_limited` (scope: view / respond), `customer_link_revoked_access_attempt`,
`customer_link_audit_written` (event type).

### F5.12 — Branding, and the white-label Enterprise option

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F5-81 | **Tenant branding applies to customer-facing documents and link pages, on every tier — and to nothing else.** The tenant's mark and brand colour dress the customer's page and the generated document; the operator application is never restyled per tenant. Branding is presentation: it never changes a number, a label, a disclosure or a law of this document (`F5-05`, `F8-06`). | `SRC` — `F7-07` consumed (tenant branding applies to customer-facing documents and link pages only); `CG-18` ("Tenant branding on customer documents is all-tiers already") | P0 |
| F5-82 | **Full white-label — a custom domain for customer links and an unbranded customer surface — is an Enterprise commercial arrangement, designed at this document and built when the first Enterprise deal asks for it.** The source is explicit that the routing is designed here rather than in the design or localization documents. Its product-level shape: a tenant-specified domain serves the same pages under the same laws, the link's properties (`F5-75`) are unchanged, and an unbranded surface removes the platform's own marks only — never a provenance label, a disclosure or the named contact. Tier placement is `04-business-model.md`'s (`BM-15`), which records the reading that this is a commercial and service arrangement rather than a withheld product capability. | `SRC` — `CG-18` (owner-confirmed 2026-07-24, verbatim: "full white-label (custom domain for customer links + unbranded portal) is an Enterprise option … Custom-domain routing designed at the customer-link module; built when the first Enterprise deal asks"); `CG-reslink.17` (the same content from the competitor row); `BM-15` consumed | P1 |
| F5-83 | **Nothing about branding or white-labelling changes what the page must say.** A custom domain, a tenant mark, an unbranded surface and a bespoke Enterprise arrangement all render the same provenance tiers, the same disclosure lines, the same honest wait attribution, the same named contact and the same refusal to gate anything over money. A white-label arrangement that removed an honesty label would be a breach of `F8-06`, not a configuration. | `SRC` — `F8-06` consumed (number-honesty is platform behaviour, never a tenant configuration surface); `CG-18` (branding is presentation); `F5-05` | P0 |

**Behavior detail.** Two levels of branding exist and the distinction is the whole of this
section. The first is available to every tenant and is already the product's behaviour: the
customer's page and document carry the tenant's mark and colour, because the customer is the
tenant's customer and the platform is not a party to that relationship. The second — a custom
domain and the removal of the platform's own presence — is a commercial arrangement, and the
source both confirms it as an Enterprise option and instructs that the routing be *designed*
here even though it is *built* on demand.

Designing it here costs little and buys a guarantee: because the pages, their scopes, their
expiry, their revocation and their audit trail are properties of the link rather than of the
address it is served at, a custom domain is a routing arrangement rather than a second product.
`F5-83` is the line that keeps it that way — the temptation with a white-label arrangement is
always to let the customer of a large tenant negotiate away an honesty label, and the answer is
that those labels are not the tenant's to trade.

**Permissions.** Configuring tenant branding rides `F2.M01.manage-tenant-settings` (EPC Owner);
the Enterprise arrangement itself is a commercial act outside the permission model. No
white-label setting may be modelled as a permission that removes an obligation of this document.

**Edge cases & what-goes-wrong.**

- *An Enterprise tenant asks for the provenance labels to be removed from their white-labelled
  pages.* Refused (`F5-83`, `F8-06`).
- *An Enterprise tenant asks for the named contact to be replaced with a generic support
  address.* The named person is a customer-facing requirement (`F5-55`, `F5-73`); a generic line
  may be added, not substituted.
- *A custom domain is misconfigured or lapses.* The link's own properties are unchanged; the
  honest failure page and the operator's notification apply (`F5-25`), and the platform-served
  address remains the fallback path of record.
- *A tenant with no mark uploaded.* The page renders without one; nothing about the product's
  own brand is asserted in its place beyond what an unbranded page requires.

**Acceptance criteria.**

- Given any tenant on any tier, when their customer opens a link or a generated document, then
  the tenant's branding is applied and the operator application is unaffected (`F5-81`).
- Given an Enterprise arrangement with a custom domain, when a customer opens a link at that
  domain, then the same pages render under the same scope, expiry, revocation and audit
  properties as at the platform address (`F5-82`).
- Given any branding or white-label arrangement, when the customer's page renders, then every
  provenance tier, disclosure line, wait attribution and named contact is present and no money
  gate has appeared (`F5-83`).

**Localization notes.** Branding is presentation and does not vary by language; the tenant's
mark and name are never translated (`F3-08`). A custom domain changes nothing about how language
is chosen — it still follows the reader (`F3-06`). **Analytics events:**
`customer_page_branding_rendered` (tenant mark present / absent),
`customer_page_served_on_custom_domain`.

## 4. Cross-module contracts

**This document expects.**

| From | This document expects |
|---|---|
| `foundations/F1-global-market-framework.md` | The tenant-currency denomination law every tenant-set money threshold obeys (`F1-07`); the market pack's labels for stages, blocker parties and checklist rows (`F1-22`, `F1-35`); the communications-compliance ruleset behind `F5-11` and `F5-54` (`F1-15`, `F1-17`); the scheduled-send hour of `F5-68`'s evening-before crew message and the statutory messaging window it sits inside — hour a default the tenant may narrow and read on the **tenant's** timezone (`F1-10`), window a floor no setting or support action reaches around, evaluated on that same tenant clock, a slot outside it resolving to the last lawful moment before it (`F1-15`, `F1-17`; owner ruling 2026-08-06 Q50 — clause added by the pass applying it, this row previously took no send-timing content because none was decided; the hour's clock added by the pass applying owner ruling 2026-08-06 Q54, which supersedes Q50's "customer's market timezone" wording; the window's clock added by the pass applying owner ruling 2026-08-06 Q58 — one clock for both, this row having named none for the window until then. What the hour and the window *are* is still not supplied for IN — register `Q53` is open — so this row expects a resolution rule, not yet a value); the reference rails for verification-code delivery and payment links as vendor-neutral capabilities (`F1-43`); formats (`F1-21`); the wait-attribution framing and typical-duration declarations behind `F5-63`'s waits (`F1-53` — cite added by Task 26). |
| `foundations/F2-roles-and-permissions.md` | §F2.5-F5's two capability rows and its notes; the law that the customer holds no role (`F2-18`); the audit checklist that names every customer-link event (`F2-22`) and the tenant's own export (`F2-23`). |
| `foundations/F3-localization.md` | Language follows the reader (`F3-06`); translated product copy with per-string fallback (`F3-05`, `F3-07`); the never-translated set (`F3-08`); one money, number, date and unit implementation (`F3-19`–`F3-24`); the open-set law (`F3-25`). |
| `foundations/F6-notifications-and-search.md` | The seeded `crew_arrival` row of the one message-template registry, whose copy carries the four facts `F5-68` fixes plus the crew lead's name and number, in each launch language (`F6-26`, `F6-27`; owner ruling 2026-08-06 Q49). *(Row added by the pass applying Q49; F6 previously appeared only under "This document provides" — the crew message named no template row because none existed.)* |
| `foundations/F7-design-language.md` | Mobile-first parity (`F7-30`, `F7-31`); status never by colour alone (`F7-12`); tenant branding confined to customer-facing documents and link pages (`F7-07`). |
| `foundations/F8-data-honesty.md` | The whole honesty frame this page renders: tiers (`F8-01`–`F8-07`), energy labels (`F8-08`–`F8-10`), money-never-stale (`F8-12`–`F8-15`, `F8-17`, `F8-18`), the document disclosures (`F8-20`–`F8-24`), the unapproved-design law (`F8-29`), honest state and failure messaging (`F8-34`, `F8-36`). |
| `modules/M05-design-studio.md` | The recommended design's read-only 3D surface (`M05-55`, `M05-80`) and the sign-off state that gates it (`M05-82`). |
| `modules/M06-proposals.md` | The generated version to render as one value set (`F8-24`), with its honesty labels and disclaimers intact; the latest-version rule (`M06-45`); the single-recommendation default (`M06-56`); the share act that mints the link (`M06-53`); the deal-side link manager surface (`F5-30`). |
| `modules/M07-sales-execution.md` | The callback queue that a customer's request enters (`M07-33`, `M07-35`); the compliance verdicts behind `F5-11`; the knowledge that makes `F5-12` true. |
| `modules/M08-projects.md` | The facts the progress phase renders: the current stage as a canonical value, the stage history with dates, and for every blocker its party, reason class, start date and expected-until (`M08-29`); the published-versus-internal separation (`M08-25`); the stage-completion trigger that updates the page (`M08-15`); the assembled handover pack (`M08-46`, `M08-32`); the installation schedule facts behind `F5-68`. |
| `modules/M11-payments-and-collections.md` | What the money module publishes to this surface and nothing more: the due tranche's label and amount, its payment instrument where one exists, the receipts with their confirmation states, and the law that nothing here may gate the page (`M11-55`, `M11-32`). |
| `04-business-model.md` | The soft-block law and its always-on matrix rows (`BM-32`, `BM-35`); the Enterprise commercial structure behind white-label (`BM-15`). |

**This document provides.**

- **To `modules/M06-proposals.md`** — the link's own events (opened, section viewed, accepted,
  negotiate requested, declined) with their attribution; the acceptance record and its
  verification outcome; the confirmation state that acknowledges an Accept without a message
  (`F5-48`); and the requirement set the share and deal-side link surfaces must satisfy
  (`F5-20`, `F5-30`).
- **To `modules/M02-crm-and-leads.md`** — the customer's question and callback request as
  timeline events on the lead, and the referral the handover ask produces (`M02-16`).
- **To `modules/M08-projects.md`** — the guarantee that the customer's page renders only
  published facts, so that a project surface never has to compose customer copy (`F5-63`,
  `F5-64`, `F5-66`).
- **To `modules/M07-sales-execution.md`** — customer-requested callbacks as queue entries
  (`F5-54`).
- **To `foundations/F6-notifications-and-search.md`** — the notification types this document
  raises: a link was opened, a proposal was accepted, a negotiation was requested, a proposal was
  declined, a customer asked a question, a customer requested a call. The matrix, the thresholds
  and the per-persona routing are F6's.
- **To `foundations/F2-roles-and-permissions.md`** — the two rows appended to §F2.5-F5 and the
  notes recording what deliberately did not become a row.
- **To `modules/M12-platform-billing.md`** — the standing constraint that no billing state,
  enforcement surface or dunning behaviour may reach a customer link (`F5-23`, `F5-60`).
- **To `modules/M13-dashboards-and-reporting.md`** — link-open, acceptance and question events as
  reporting inputs; a delivery state is reportable only where the tenant's connected channel
  sent and reported it, and the standing prohibition on a delivered state holds over every
  copy-paste-fallback send (`F5-28`) — as does the prohibition on any causal claim the product
  did not observe (`F8-32`). *(Reconciled to owner ruling 2026-08-04, Q33; this contract line
  previously carried `D32`'s retired unscoped prohibition, contradicting the reconciled `F5-28`
  row — see `registers/conflicts.md` row 4.)*

## 5. Non-goals

Each is an explicit exclusion with its rationale, not a deferral — there is no "later" bucket
(`OV-43`, `OD-5`).

- **No customer account, portal, password or application — ever.** The founding law (`F5-01`,
  `D5`). Not a v1 economy: the absence is the product's position, and the acceptance challenge
  is deliberately shaped so it cannot become a login (`F5-45`).
- **No second customer destination.** One link per named recipient, three phases, one bookmark
  (`F5-02`, `F5-19`). A separate progress URL, a separate document portal or a customer
  application would each break the same law.
- **No fabricated delivery state, and no campaign machinery on the link.** Transactional
  messages send from the tenant's connected channel with that channel's honest delivery states;
  the copy-paste fallback claims none, and opens remain the product's own evidence (`F5-28`,
  owner ruling 2026-08-04 Q33). The V2 brief's campaign sending is `modules/M03-marketing.md`'s
  scope over different content (`registers/conflicts.md` rows 3–4, now annotated with the Q33
  resolution).
- **No tenant-set send hour for the crew message, and no route around the messaging window.**
  The hour `F5-68`'s evening-before message goes out is market-pack data with an early-evening
  default, and the statutory messaging window it sits inside is a floor: a tenant may narrow
  either, never widen the window, and no setting on any surface and no platform support action
  configures around it — a slot outside lawful hours resolves to the last lawful moment before
  it, never after (`F1-15`, `F1-17`, owner ruling 2026-08-06 Q50). *(Non-goal recorded by the
  pass applying Q50; before the ruling this document stated no send-hour behaviour at all and §6
  carried the question as open, so there was nothing to exclude.)*
- **No per-customer send clock, and no second clock for the window.** The hour resolves on the
  **tenant's** timezone (`F1-10`, `F1-15`, owner ruling 2026-08-06 Q54) and the statutory
  messaging window it sits inside is evaluated on that same tenant clock (owner ruling 2026-08-06
  Q58) — one clock, not two. The customer's own timezone is not read, not stored for
  this purpose and not configurable; the market's default timezone is not evaluated alongside the
  tenant's; and an out-of-timezone customer receives the message at the
  EPC's evening hour, judged against the EPC's lawful hours — the rulings' knowingly accepted
  consequence of a simplification whose premise is that a solar EPC's customers are local to it.
  Nothing here compensates for it: there is no reconciliation between frames and no per-recipient
  window check. *(Non-goal recorded by the pass
  applying Q54; before the ruling which clock the hour was read on was §6's open question, so
  neither clock could be excluded. Extended by the pass applying Q58, which brought the window
  onto the hour's clock; before it the window's clock was §6's newly open question.)*
- **No chat, no message thread, no reply surface on the customer's page.** A question travels
  and a person calls back (`F5-53`); a reply box would promise a channel this release does not
  have.
- **No customer-side editing of anything.** No survey correction, no design change, no figure
  the customer can alter; the link carries read and respond scopes only (`F5-21`, `F5-56`).
- **No monitoring, no generation dashboards, no cleaning reminders, no service tickets and no
  warranty-claim workflow.** The final step of the customer's journey is explicitly beyond this
  release: *"They will want: generation monitoring, cleaning reminders, service contact, and
  eventually warranty claims. Out of scope for v1."* Commissioning artefacts are retained so such
  a surface can attach later without re-collecting anything (`M08-48`), and the one live
  requirement of that step — leaving the customer knowing exactly who to call — ships (`F5-73`).
  (`C13`, `D9` scope half; `R17` additionally rules out meter ingestion and recurring billing.)
- **No referral credits, redemption or balance.** Attribution ships; the credits ledger is the
  spec-locked exclusion, and the page promises nothing it cannot keep (`F5-72`, `R15`,
  `UXG-19`).
- **No third-party code, and no enriched tracking, on the public pages.** Zero third-party
  scripts, fonts or analytics; opens carry link, moment and device class only (`F5-77`,
  `F5-29`). The product's positioning is honesty, not observation.
- **No money gate, in either direction.** Nothing on a customer surface is withheld because the
  customer owes the tenant or because the tenant owes the platform (`F5-24`, `F5-23`,
  `F5-60`).
- **No implementation content.** Token construction, signing, storage, routing and rate-limit
  mechanics are engineering (design spec §14 / DD4); this document states the properties they
  must satisfy (`F5-75`).

## 6. Open questions

Mirrored into `registers/open-questions.md`.

- **F5-Q1 (register Q33) — RESOLVED (owner ruling 2026-08-04, Q33).** Transactional customer
  sending is **automatic**: the day-two design-wait update and the Accept confirmation send
  from the tenant's connected official channel (the same connection `modules/M03` establishes,
  transactional template class), with composed-copy-paste as the fallback where no channel is
  connected (`F5-16`, `F5-48`; delivery-state honesty at `F5-28`). `D32`'s manual-only rule is
  retired for transactional moments; `registers/conflicts.md` rows 4 and 8 carry the resolution
  notes.
- **F5-Q2 (register Q34) — RESOLVED (owner ruling 2026-08-04, Q34).** The link is **permanent**:
  view scopes never expire, and after handover the same URL is the customer's permanent
  read-only "solar file" — documents, warranties, referral CTA — for life (`F5-22`, `F5-25`,
  `F5-70`, `F5-74`). No self-serve renewal is needed because the late-return failure mode no
  longer exists; revocation remains the operator's kill switch.
- **Register `Q46` — RESOLVED (owner ruling 2026-08-06, Q46).** The evening-before crew message
  of `F5-68` **rides the transactional lane**: it sends automatically the evening before from the
  tenant's connected official channel, with composed copy-paste as the fallback where no channel
  is connected and no delivery claimed on that path — treated exactly as its already-reconciled
  siblings `F5-13`, `F5-16` and `F5-48`. `D32`'s manual-only rule, which the `F5-68` cell still
  stated unscoped, is retired for this moment too. The `F5-68` requirement cell and §F5.9's
  acceptance line are amended to the ruling; `registers/conflicts.md` row 12,
  `registers/open-questions.md` `Q46` and `registers/screens.md`'s `F5-68` non-UI note are their
  own files' owners' to close.
- **Register `Q49` — RESOLVED (owner ruling 2026-08-06, Q49), and it is an authoring act
  applying `Q46` rather than a new decision.** The evening-before crew message has its seeded
  row in the message-template registry, keyed **`crew_arrival`** (`F6-26`), its copy carrying
  the four facts `F5-68` fixes plus the crew lead's name and number; the precedent is
  `survey_complete`, seeded when `Q24` was applied. `F5-68` now names the row, and the build
  side is `tasks/F-platform.md` T-FPLAT-021 (the registry's seed) with
  `tasks/F5-customer-link.md` T-F5-002 (the send). *(This bullet and the next replace the single
  "**OPEN — newly raised by applying `Q46`, not decided here**" bullet this section carried,
  whose two halves are exactly these two rulings. Its half (a) read that "the ruling names the
  lane and the template *class*, not a registry row for the crew message, and no row for it
  exists"; both statements are now false — the row exists and `F5-68` names it.)*
- **Register `Q50` — RESOLVED (owner ruling 2026-08-06, Q50).** The send hour is **market-pack
  data**: the pack declares it as a *default* — early evening, read on the **tenant's** timezone
  per the same day's `Q54` — inside the market's statutory messaging window, which is a *floor*
  (`F1-15`, `F1-17`). *(This bullet previously read "early evening in the customer's market
  timezone", the `Q50` wording, superseded on the clock only by `Q54`.)* A
  configured slot outside lawful hours sends at the **last lawful moment before it, never
  after**; a tenant may narrow the window and never widen it, and no setting and no support
  action configures around a floor item. `F5-68`, §F5.9's acceptance line and edge cases, §5's
  non-goals and §4's `foundations/F1` contract line all carry it. *(The bullet this replaces
  stated the question as half (b): "What 'the evening before' resolves to, and whether the
  market's statutory messaging window binds it… an automatic send has to resolve an hour, a
  timezone and its relationship to the compliance ruleset behind `F5-11` (`F1-15`, `F1-17`)."
  The ruling answers the hour and the window; the timezone half was not answered by `Q50` itself
  and is now settled by `Q54` — see the next bullet. `registers/open-questions.md` `Q49`/`Q50`
  and `registers/screens.md`'s `F5-68` non-UI note are their own files' owners' to close.)*
- **Register `Q54` — RESOLVED (owner ruling 2026-08-06, Q54).** The send hour is read on the
  **tenant's** timezone (`F1-10`), never the customer's. The owner's reasoning, recorded so a
  later reader sees a deliberate simplification: a solar EPC's customers are local to it, so the
  two clocks are the same in practice. The knowingly accepted consequence: where an EPC does
  serve a customer in another timezone, the message goes at the **EPC's** evening hour. `F5-68`,
  §F5.9's acceptance line and edge cases, §5's non-goals and §4's `foundations/F1` contract line
  all carry it, and `foundations/F1-global-market-framework.md` `F1-15` carries the declaration.
  *(This bullet replaces the "**OPEN — newly raised by applying `Q50`, not decided here**" bullet
  this section carried, which read that "the ruling reads the hour on **the customer's market
  timezone**, while `F1-10` makes every user-facing schedule run on the **tenant's** timezone …
  and this document does not choose between them". The owner has chosen. That bullet also carried
  the second open half — the IN pack values — which is **not** closed and is restated in its own
  bullet below. `registers/open-questions.md` `Q54` is that file's owner's to mark closed.)*
- **Register `Q53` — STILL OPEN; not decided by `Q54`, not decided by `Q58`, and not decided
  here.** The IN pack
  declares neither a statutory **messaging** window nor a send hour, so `F5-68` has no IN value
  to resolve against until the owner authors one ("early evening" is a default's description,
  not a time, and inventing one is barred by `F1-25` and F1 §5). `Q54` settles *which clock* the
  hour is read on, not *what the hour is*, and `Q58` settles which clock the window is evaluated
  on, not *what the window is*; nothing in this document, in `tasks/F5-customer-link.md`
  or in `ux/briefs/SCR-F5-02-link-progress.md` assumes an IN hour or an IN messaging window
  exists. The full statement is at `foundations/F1-global-market-framework.md` §6 `F1-Q3`(a); it
  is an owner/`F1` pack-authoring act needing real regulatory data, and it needs mirroring into
  `registers/open-questions.md` by that file's owner. The four facts of `F5-68`, its two send
  branches, the floor/default classification and the tenant clock hold either way.
- **Register `Q58` — RESOLVED (owner ruling 2026-08-06, Q58).** The statutory messaging **window**
  is evaluated on the **tenant's** timezone (`F1-10`) — the same clock as the send hour. **One
  clock, not two.** The owner's reasoning is `Q54`'s, recorded again: a solar EPC's customers are
  local to it, so a second clock would add machinery with no real-world difference. The accepted
  consequence, stated plainly: where an EPC serves a customer in another timezone, **both** the
  hour and the lawful-window check are evaluated on the EPC's clock rather than the recipient's;
  and where a tenant's timezone differs from its market's default (`F1-21`), the market's window
  is evaluated on the tenant's clock rather than the market's. Everything else about the floor is
  unchanged (`Q50`): a tenant may narrow the window and never widen it, and a slot outside lawful
  hours sends at the last lawful moment before it, never after. `F5-68`, §F5.9's acceptance line
  and edge cases, §5's non-goals and §4's `foundations/F1` contract line all carry it, and
  `foundations/F1-global-market-framework.md` `F1-15` carries the declaration (with `F1-17`'s
  floor language). *(This bullet replaces the "**OPEN — newly raised by applying `Q54`, not decided
  here**" bullet this section carried, which read that `Q54` "puts the **hour** on the tenant's
  clock but says nothing about the clock the statutory messaging **window** … is evaluated on",
  so that `F5-68`'s "last lawful moment before it" had "none stated wherever a tenant's timezone
  differs from its market's default". The owner has chosen. `registers/open-questions.md` `Q58` is
  that file's owner's to mark closed.)* **It does not close `Q53`, and nothing here depends on a
  value `Q53` would supply:** the IN pack still declares no messaging window at all, so at IN
  launch there is still no window to evaluate on this or any clock, and nothing here assumes one.
  `F5-68`'s four facts, its two send branches and the floor/default classification hold either way.
- **Threshold placement — RESOLVED by the Q42 ruling (owner ruling 2026-08-04).** OTP-at-accept
  ships **default OFF with no threshold value set**; the feature is a per-tenant enable in
  settings (`modules/M01`'s surface), so no pack key and no product default figure is needed at
  launch (`F5-44`). The C&I acceptance-risk consequence is recorded honestly at `F5-44`, and
  named-link attribution remains the acceptance evidence (`F5-46`). Revisit post-launch per the
  ruling.
- **Carried, resolved in the same session — `Q27`.** The studio's customer-facing 3D view ships
  **inside the proposal link** ("View in 3D", `F5-33`); no separate customer-facing 3D share
  link exists, so `F5-80`'s one-framework law holds with nothing beside it.
- **Carried, resolved in the same session — `Q30`.** The three-lane calling law (`F5-11`);
  `F5-54`'s affordance is now the recorded, timestamped request that lets the requested-callback
  lane dial at the customer's own named time, even outside the window.
- **Carried, resolved in the same session — `Q25`.** The corrector is anyone who can run the
  remote survey (rep/surveyor/designer, `M04-15`); the customer's route stays the question
  affordance, never a mutation (`F5-56`).
- **Carried, resolved in the same session — `Q24`.** A newer survey marks the design
  "survey updated — review needed" with the designer notified; **draft proposals on it are
  blocked from sending until review; sent proposals stay pinned** (`M05-13`, `M04`). The link's
  side was already correct and is unchanged: the page renders what the shared version carries
  (`F5-40`, `F8-15`) — the ruling's customer-visible consequence arrives only ever as a new
  version at the same URL.
- **Carried, resolved in the same session — `Q21`.** "Not interested" is the seventh Lost
  reason carrying the six-month suppression (`M02-54`, `M07-63`); `F5-51`'s customer-facing
  outcome — a customer who declines is not chased — is delivered by the Lost state.
