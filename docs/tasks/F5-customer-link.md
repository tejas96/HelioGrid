# F5 · Customer link — engineering tasks

This file carries what is left of the customer-link bucket (`docs/prd/foundations/F5-customer-link.md`)
after block 8 shipped the link, its pages and its lifecycle: the two tasks that need a design —
`T-F5-010` (the day-two design-wait update) and `T-F5-011` (the design on the link, SCR-F5-05), both
parked until the studio's block — and the laws every customer-facing surface keeps. Task-id prefix:
**T-F5-**. The look of every page here is the approved proposal design (`CLAUDE.md` §6), built to
match at 390 px and 1440 px. Policy rows with no standalone build live in the Laws section; context
rows in Realized elsewhere. The disposition index at the end covers every row in this bucket
exactly once.

---

### T-F5-010 · Day-two design-wait update

**Type:** integration · **Tier:** P0
**Status:** planned
**PRD rows:** F5-16
**Design:** none — a staff-side task and a composed customer update
**Why:** the wait before a design is where enthusiasm decays and competitors land first; a dated next step and a ready update keep the customer warm.
**Depends on:** nothing open — the lead's `design` stage and the task table are built
**Parked:** no V1 act moves a lead to `design` before the studio; built with the 3D studio's block (block 9) (owner ruling 2026-11-13, final review).

**Requirements (verbatim):**
- **F5-16** (P0) — **The wait between survey and proposal is never silent — and the day-two update is automatic (owner ruling 2026-08-04).** The source is categorical: *"Nothing in the product should let this gap be silent"* — this is where enthusiasm decays and competitors land first. The obligation is met three ways: the promise made at `F5-14` carries a date; the product raises the staff-side task that keeps it; and the *"we are working on your design"* update **sends automatically on day two from the tenant's connected transactional channel** (the same connection `modules/M03` establishes, transactional template class per `M03-03`). Where no channel is connected, the honest fallback is the composed draft a person sends plus the staff-side nudge — and no delivery is claimed on that path. **In V1 (owner ruling 2026-11-13)** no channel connects — the connection is V2 — so the composed update and the staff-side nudge are the path that ships, and the gap opens when the lead enters the `design` stage, the one V1 signal while the survey is V2; the automatic send is built with the connection.

**DONE WHEN:**
- Given a lead between survey and proposal, when the gap opens, then an owned dated next step exists; and given a tenant with a connected transactional channel, when day two arrives, then the "we are working on your design" update sends automatically from that channel under the transactional template class; and given no connected channel, then the composed update is available for a person to send beside the staff-side nudge, and no delivery is claimed on that path (`F5-16`; automatic transactional sending per owner ruling 2026-08-04). *(In V1 no channel connects and the gap opens when the lead enters `design`, owner ruling 2026-11-13: this task proves the dated next step and the composed update.)*

**Settle before the build:**
- The composed update needs a key in `F6-26`'s exhaustive list — ruled (owner ruling 2026-11-13): this task adds `design_in_progress` to `F6-26` and to `MESSAGE_TEMPLATE_KEYS` in one change (the invariant `template-keys-mirror-f6` holds the two equal) and authors its starter words.
- `F5-14`'s dated promise is the survey's (V2): until the survey ships, the next step's date is the one the person sets.

---

### T-F5-011 · Customer link — the design on the link (SCR-F5-05)

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** F5-33 (P0), F5-34 (P0), F5-35 (P0)
**DESIGN:** SCR-F5-05
**Why:** the 3D view of the customer's own roof is the moment that sells a designed system; it ships the day the studio can sign a design off.
**Depends on:** the studio's design and sign-off records (block 9; no task id yet)
**Parked:** built with the 3D studio (block 9); owner ruling 2026-11-13 — proposals ship first

**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification. This task also proves the design-only clauses its block-8 siblings leave: `F5-37`'s remote-imagery disclosure, `F5-32`'s roof view and `F5-40`'s survey-superseded clause.

**DONE WHEN:**
- Given a proposal whose design has been signed off, when the page renders, then the read-only 3D view of that design is present with no editing control; and given a design that has not been signed off, when the page renders, then the model is absent (`F5-33`, `F5-34`).
- Given a lead with several design variants, when the customer opens the link, then exactly one recommended system is presented by default (`F5-35`).
- Given a proposal built without a design, a design built on remote imagery, or a multi-year financial figure, when the page renders, then the corresponding disclosure line appears verbatim (`F5-37`). *(The remote-imagery clause.)*
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- `F5-47`'s stale-money clause — ruled: a shared version's figures are a record (`freshness: null`), so only a design change can stale it; that half is proven with the design on the link, `T-F5-011` (owner ruling 2026-11-13, final review).

---

## Laws (enforced through screens and review, no standalone build)

- **F5-01** (P0) — **The customer never logs in — ever.** There is no customer account, no password, no portal, no application to install and no sign-up of any kind anywhere in the product. The customer reaches everything they are entitled to see through one tokenised link, and holds no role: no preset describes them, no matrix column exists for them, and no surface in this suite may introduce a customer credential. The acceptance challenge of `F5-44` is a one-time verification of a person at a moment of commitment — it is **not** a credential, creates no account, and grants nothing that outlives the act it protects.
  *Enforced by:* review of every customer-facing surface (T-F5-001…004 introduce no credential); the challenge's non-credential shape is T-F5-008's build (`F5-45`); the token grant of T-F5-006 is never a session or account (`F5-21`).
- **F5-02** (P0) — **The customer's entire surface area is messages, calls and one link — and nothing in the product may add a second destination.** The source's whole-project counts are the budget: roughly 12–18 messages, 3–6 calls, **one** web link reused across all three phases, **zero** logins, **zero** app installs. Any proposal to give the customer a second URL, a second page family or an application is a change to this law, not a feature decision inside a module.
  *Enforced by:* review; the one-framework build of T-F5-006 (`F5-80`) is the mechanism that leaves nothing beside the link.
- **F5-03** (P0) — **Two archetypes, one design.** The residential homeowner and the commercial-and-industrial buyer are served by the same page, the same lifecycle and the same laws; the difference between them is expressed through named links and the acceptance challenge (§F5.4, §F5.6), never through a second design, a second URL family or a segment-conditional surface.
  *Enforced by:* review of T-F5-001…004 (one page family); named links and the challenge are T-F5-007 and T-F5-001/T-F5-008.
- **F5-05** (P0) — **Trust is the product, so every number the customer reads carries its honesty labels — with no exception for the customer surface.** Provenance tier (`F8-01`, `F8-02`), energy source label (`F8-08`, `F8-09`), staleness state (`F8-12`) and every required disclosure (`F8-20`, `F8-22`, `F8-23`) render on this page exactly as they render inside the product. No tenant setting, plan, template or white-label arrangement removes, weakens, renames or hides one (`F8-06`). A surface that cannot carry a label does not thereby earn permission to drop it — it carries the label or it does not carry the number (`F8-01`).
  *Enforced by:* T-F5-001/002/003 render every figure with its tier and source label (`F5-36`); review against F8.
- **F5-08** (P0) — **The page renders in the customer's language, not the rep's — and the product is built for a language set that will grow.** Language follows the reader (`F3-06`); every product-authored string on this page, including every honesty and disclosure line, is translated content (`F3-07`) with English fallback per string (`F3-05`); names, addresses, brand names and technical units are never translated (`F3-08`); money renders through the one money implementation in the tenant market's declared format, identically in every language (`F3-20`). No requirement in this document names a language or assumes the set's size (`F3-25`).
  *Enforced by:* the F3 localization framework consumed by every T-F5 screen task; review of all customer copy through the catalog.
- **F5-09** (P0) — **The customer's first experience is a callback, and its speed is the single biggest predictor of who wins the job.** The source's own signals: called back within an hour reads as a strong signal; called back three days later means *"the job is already lost"*. The mechanism is lead capture and first-response time (`modules/M02`); what this document fixes is that the speed is a **customer-facing product obligation**, not an internal metric, and that no surface in the product may let a new enquiry sit without an owner.
  *Enforced by:* `M02-50`'s unassigned-escalation build (M02 tasks file); review that no surface lets an enquiry rest unowned.
- **F5-10** (P0) — **One company, one voice: the customer is never called by three different people, and never asked the same questions twice.** Being contacted by several people from one company reads as disorganised and costs the job; being re-interviewed says the company does not keep records. Both are prevented by the duplicate check and the single record at capture (`M02-07`, `M02-08`), and both are stated here as customer-facing failures the product exists to prevent.
  *Enforced by:* `M02-07`/`M02-08` dedupe-at-capture build (M02 tasks file).
- **F5-11** (P0) — **The customer is never called outside the lawful hours of their market, and never after they have said stop.** The statutory ruleset — calling window, do-not-disturb, opt-out and disclosure — is market-pack data enforced by a non-swappable mechanism (`F1-15`, `F1-17`; the enforcement surface is `M07-27`/`M07-28`). Stated from the customer's side: a customer who says stop is not called again, and no tenant configuration may reach around the floor. **Ruled (owner ruling 2026-08-04):** the enforced lanes bind automated dials — inbound answering 24/7, unsolicited dials only inside the statutory window, and outside-window dials only on the customer's own recorded, timestamped callback request (which a single "stop" ends); a human rep dialling manually gets warning-then-proceed with the "customer requested" context logged (`M07-30`). The customer-side outcome is unchanged: never called outside lawful hours except at their own recorded request, never after stop.
  *Enforced by:* `M07-27`/`M07-28`/`M07-30` compliance gate and `F1-15`/`F1-17` pack floors (their task files); T-F5-001's callback request supplies the recorded, timestamped consent (`F5-54`).
- **F5-12** (P0) — **The same answers must be right whoever — or whatever — is speaking.** A rep fumbling a basic incentive question loses the deal before price is discussed, and an automated caller giving a different answer than the rep does the same damage twice. The knowledge that makes the answers consistent is the tenant's, authored once and used by both (`modules/M07`; corrections never auto-train — `R10`). This document states the customer-facing consequence: the customer must not be able to tell, from the content of an answer, which channel they reached.
  *Enforced by:* `modules/M07`'s one authored knowledge set (voice, postponed: its tasks are written again when it returns).
- **F5-13** (P0) — **A booked site visit produces a confirmation carrying four mandatory facts: what is happening, the date and time, the name of the person coming, and that person's phone number.** The message is composed by the product and — per the owner ruling of 2026-08-04 — **sends automatically from the tenant's connected transactional channel**, with a person sending the composed copy-paste text where no channel is connected (`M02-47`); this document fixes the four fields as a customer-facing minimum, so that no surface may compose a confirmation that omits one.
  *Enforced by:* `M02-47`'s composing build (M02 tasks file); review that no composing surface omits a field.
- **F5-14** (P0) — **A survey leaves the customer with a promise and a date — and nobody leaves a site without saying what happens next.** The trust rule is the source's: what builds trust is the surveyor explaining what they are photographing and why; what destroys it is silent photographing followed by leaving. The customer receives a confirmation of the form *"Survey done. Your proposal will reach you by <date>."* — **a promise with a date**. Where the survey is remote the customer experiences nothing at this step and receives their proposal sooner, which is itself the competitive answer; where it is physical, the visit is confirmed, attended and closed out.
  *Enforced by:* the promise with a date is composed and sent at survey-submission commit by T-M04-009 (M04 tasks file), from the `survey_complete` template, whose starter words T-M04-009 authors under the registry's key (`F6-26` → T-FPLAT-021, shipped — the key is named in `F6-26`'s own list, which owner ruling 2026-08-06 makes exhaustive), on the transactional lane with copy-for-a-person where no channel is connected (`M03-03`, owner ruling 2026-08-04); the visit's confirmation, attendance and close-out are `M02-46`'s booking build (T-M02-014) and `M02-47`/`M02-48`'s send build (T-M02-013) in the M02 tasks file. PRD check, verbatim: "Given a completed survey, when the customer is updated, then the update states that the survey is done and names the date by which the proposal will reach them (`F5-14`)."
- **F5-15** (P0) — **No verbal price is given that the proposal then contradicts.** A figure spoken on a roof becomes the number the customer remembers; a document that disagrees with it reads as a bait. The product's answer is that the priced document is the only price surface and it carries its own honesty labels (`F5-36`, `F5-37`) — no surveyor-side or call-side surface in the product produces a customer-facing price.
  *Enforced by:* review — T-F5-001's page and the proposal document (SCR-M06-17) are the only customer-facing price surfaces; no other task in the suite emits one.
- **F5-18** (P0) — **The follow-up call is configured to protect the customer out of the box.** The shipped defaults are the source's: capped attempts, a calling window, the customer's own language, an always-offered hand-off to a person, and an automated caller that says it is automated. The owner may change what is above the statutory floor and owns that choice; the floor itself is not theirs to move (`F5-11`). Stated as the customer's four protections: not called three times in a week, not called at dinner, not addressed in a language they do not speak, and never trapped without a route to a human.
  *Enforced by:* `M07-22`/`M07-44` shipped defaults (voice, postponed: its tasks are written again when it returns).
- **F5-41** (P0) — **The customer-facing document and this page say "Proposal" — in the reader's language, in every language.** The naming ruling binds every locale: one term per concept, and the words for a priced offer that this suite bans are banned in every language, not only in English. This is the customer-link half of the ruling; the entity and the document are `modules/M06`'s and the vocabulary law is `foundations/F3`'s.
  *Enforced by:* `F3-11`'s vocabulary law and `M06-01` (their task files); review of every customer-facing string in T-F5-001 and the proposal document (SCR-M06-17).
- **F5-50** (P0) — **Negotiation is answered the same day, because nothing in the product makes the customer wait.** A customer asking for a discount is answered by the rep applying it and re-sharing — there is no approval hop, no request sheet, no queue and no pending-approval state (`D34`); the only guard is arithmetic at generation (`M06-36`). The customer's page reflects the revised version at the same URL. *"They should not wait two days for an answer, and now nothing in the product makes them."*
  *Enforced by:* the deliberate absence of any approval flow (review); `M06-36`'s arithmetic guard (M06 tasks file); T-F5-009's latest-version render delivers the revised version at the same URL.
- **F5-51** (P0) — **A decline is recorded with its reason, and then the customer is left alone.** The reason is mandatory at the close surface (`M02-54`, `M07`'s mark-lost); a customer who has said they are not interested is not called again for the ruled suppression period, and a customer who has postponed resurfaces on the date they named rather than at someone's convenience. *"They should not then be called for six months."* **Ruled (owner ruling 2026-08-04):** the Lost state's own "not interested" — the seventh Lost reason — carries the six-month suppression (`M02-54`, `M07-63`); the customer-facing outcome this row states is delivered exactly as written.
  *Enforced by:* `M02-54`/`M07-63` (their task files); the decline respond action itself is T-F5-001's (part b), which offers Mark lost and never marks it.
- **F5-56** (P1) — **The customer's channel for "that is not my roof" is the question affordance, never an edit — FINAL (owner ruling 2026-08-04).** The link grants no write access to a survey, a design or any figure; a customer who believes an outlined roof is wrong asks, a person reviews, and the correction is made on the operator's surface by **anyone who can run the remote survey** — rep, surveyor or designer (`F2.M04.run-remote-survey`), with studio re-verification and provenance labels as the safety net. The ruling confirms the conservative reading this row carried: the customer's route exists and it is a question, not a mutation; no customer-side write scope is created.
  *Enforced by:* T-F5-006's fixed scope set (no write scope exists); T-F5-001's question affordance; `M04-22` (M04 tasks file) — the operator outlines, and corrects, every roof.
- **F5-60** (P0) — **Nothing on this page is ever gated by money — the customer's own or the tenant's.** An unpaid tranche does not hide the progress page, dim a section, or attach a demand to a surface the customer came to for something else; the tenant's platform billing state is invisible here in every direction (the customer never sees a platform bill, a plan, a dunning notice or a subscription state). The chase happens through a person (`M08-38`, `M08-39`, `M11-32`, `M11-53`).
  *Enforced by:* T-F5-006's billing-state and money-gate tests (`F5-23`, `F5-24`); T-F5-002's never-gated-over-money invariant across all states; review.
- **F5-64** (P0) — **The internal reason for a wait is never the published one.** A supplier's failure is the company's problem to solve and not the customer's to read: the customer sees the honest stage and the fact that material is on order with an expected date — never the supplier, the internal note, or the commercial detail behind it. The separation is guaranteed on the producing side (`M08-25`); this document guarantees that the customer page renders only the published field.
  *Enforced by:* T-F5-002 renders only the published field; `M08-25`'s producing-side separation (M08 tasks file).
- **F5-65** (P0) — **The product's job during an external wait is to make it visible and attributable — not to claim it can make it shorter.** External approvals and inspections take as long as they take; the page states the wait honestly with its attribution and its expected duration, and makes no promise about influencing it. *"A delay you explained is tolerable; a delay you hid is a complaint."*
  *Enforced by:* T-F5-002's attributed wait line (`F5-63`); review of customer copy.
- **F5-66** (P0) — **The page never renders a completion percentage and never fabricates a date.** A system installed but stuck before commissioning is not "90% done" — it is in its stage, with the time it has been there (`M08-13`). Where an expected-until date is unknown, the page says the date is not yet known; it does not compute a plausible one to fill the sentence, and no figure or date on this page exists that `modules/M08` did not publish.
  *Enforced by:* T-F5-002 (no completion percentage, no unpublished date, the expected-date-unknown state — `F5-66`); review.
- **F5-67** (P0) — **Silence, not delay, is the failure this page exists to kill.** The source is unambiguous that customers become unhappy *"almost always because of silence rather than delay"*, and names the loop it prevents: *"They call the rep. The rep does not know. They call again."* The page is therefore updated by the delivery work itself — completing a stage updates it, with no separate publish step for anybody to forget (`M08-15`).
  *Enforced by:* `M08-15`'s stage-completion trigger (M08 tasks file); T-F5-006's phase/state resolution reads the deal's state with no publish step.
- **F5-69** (P0) — **Commissioning is the system switching on and a pile of documents — and neither the crew's internal detail nor any commercial figure reaches the customer's page.** Installation and commissioning steps are recorded by the coordinator with an optional note of who did the work (`R16`, `M08-42`); the customer sees stages and their dates, never the checklist's internals, and no surface in the installation path shows a price, discount, tranche or margin (`F2-06`, `M08-43`).
  *Enforced by:* T-F5-002 renders published stages and dates only; `F2-06`/`M08-42`/`M08-43` (their task files).
- **F5-81** (P0) — **Tenant branding applies to customer-facing documents and link pages, on every tier — and to nothing else.** The tenant's mark and brand colour dress the customer's page and the generated document; the operator application is never restyled per tenant. Branding is presentation: it never changes a number, a label, a disclosure or a law of this document (`F5-05`, `F8-06`).
  *Enforced by:* M01's branding settings build (M01 tasks file); review that branding on T-F5 screens and the proposal document (SCR-M06-17) stays presentation-only.
- **F5-82** (P1) — **Full white-label — a custom domain for customer links and an unbranded customer surface — is an Enterprise commercial arrangement, designed at this document and built when the first Enterprise deal asks for it.** The source is explicit that the routing is designed here rather than in the design or localization documents. Its product-level shape: a tenant-specified domain serves the same pages under the same laws, the link's properties (`F5-75`) are unchanged, and an unbranded surface removes the platform's own marks only — never a provenance label, a disclosure or the named contact. This is a commercial and service arrangement rather than a withheld product capability.
  *Enforced by:* the row's own terms — designed here, **built when the first Enterprise deal asks**; no launch build exists. T-F5-006's link properties are domain-independent by construction.
- **F5-83** (P0) — **Nothing about branding or white-labelling changes what the page must say.** A custom domain, a tenant mark, an unbranded surface and a bespoke Enterprise arrangement all render the same provenance tiers, the same disclosure lines, the same honest wait attribution, the same named contact and the same refusal to gate anything over money. A white-label arrangement that removed an honesty label would be a breach of `F8-06`, not a configuration.
  *Enforced by:* review of any branding or white-label change against the label, disclosure and contact set of T-F5-001/002/003 and the proposal document (SCR-M06-17); `F8-06` (F8 framework).

---

## Realized elsewhere

- **F5-04** (P0, context) — **The two acceptance themes for every customer-facing requirement are message timing and link truthfulness.** Verbatim: *"the product's job on this side is not screens. It is making sure the right message arrives at the right moment, and that the one link always answers 'what is happening?'"* Every requirement in this document is testable against one of the two, and a customer-facing behaviour that satisfies neither does not belong here.
  *Realized by:* `docs/prd/foundations/F5-customer-link.md` — the two acceptance themes are the frame every F5 requirement is written and reviewed against; no separate build exists.
- **F5-06** (P0, context) — **Three moments decide the outcome, and each is a design constraint on a named surface.** (a) **Speed of first callback** decides whether the company is in the running at all — the mechanism is lead capture and first response (`modules/M02`). (b) **The proposal link, opened once, on a phone, in the evening** decides the sale — the mobile-first single-session constraint of §2. (c) **Visible progress during the long external wait** decides whether the customer refers anyone — the progress phase (§F5.9) and the referral ask (§F5.10). No surface in this document may be designed as though a customer will return to it repeatedly to hunt for something.
  *Realized by:* `docs/prd/modules/M02-crm-and-leads.md` (speed of first callback), `F5-32` → T-F5-001 (the proposal opened once, on a phone, in the evening), `F5-61` → T-F5-002 (visible progress during the long wait), `F5-72` → T-F5-003 (the referral ask).
- **F5-17** (P1, context) — **The thinking window belongs to the customer, and the product's job in it is to answer rather than to chase.** The typical decision window runs from days to weeks, nothing happens in the product, and the customer's real questions are rarely about price — will this reduce my bill, what if it does not work, who fixes it in year four, will it damage my roof, is the incentive real and who does the paperwork. Every one of those is answerable by the tenant's own knowledge on any channel the customer reaches (`F5-12`), and the link's question affordance (§F5.7) exists so a question does not require a phone call the customer must initiate.
  *Realized by:* `F5-12` (Laws section — same answers on every channel), `F5-52`/`F5-53` → T-F5-001 (the question affordance that answers without chasing).

---

## Disposition index

| Row | Disposition |
|---|---|
| F5-01 | LAW |
| F5-02 | LAW |
| F5-03 | LAW |
| F5-04 | realized-by: docs/prd/foundations/F5-customer-link.md |
| F5-05 | LAW |
| F5-06 | realized-by: docs/prd/modules/M02-crm-and-leads.md · F5-32 (T-F5-001) · F5-61 (T-F5-002) · F5-72 (T-F5-003) |
| F5-07 | T-F5-001 |
| F5-08 | LAW |
| F5-09 | LAW |
| F5-10 | LAW |
| F5-11 | LAW |
| F5-12 | LAW |
| F5-13 | LAW |
| F5-14 | realized-by (V2 — the survey): T-M04-009 (M04 tasks file — the survey-submission send) · T-FPLAT-021 (shipped — the `survey_complete` key and the composer; the key is named in `F6-26`'s exhaustive list per owner ruling 2026-08-06, its words authored by T-M04-009) |
| F5-15 | LAW |
| F5-16 | T-F5-010 |
| F5-17 | realized-by: F5-12 (LAW) · F5-52/F5-53 (T-F5-001) |
| F5-18 | LAW |
| F5-19 | T-F5-006 |
| F5-20 | T-F5-006 |
| F5-21 | T-F5-006 |
| F5-22 | T-F5-006 |
| F5-23 | T-F5-006 |
| F5-24 | T-F5-006 |
| F5-25 | T-F5-004 |
| F5-26 | T-F5-007 |
| F5-27 | T-F5-007 |
| F5-28 | T-F5-007 |
| F5-29 | T-F5-007 |
| F5-30 | T-M06-020 (the customer-page half enforced by T-F5-007) |
| F5-31 | T-F5-007 |
| F5-32 | T-F5-001 |
| F5-33 | T-F5-011 |
| F5-34 | T-F5-011 |
| F5-35 | T-F5-011 |
| F5-36 | T-F5-001 |
| F5-37 | T-F5-001 |
| F5-38 | T-F5-009 |
| F5-39 | T-F5-001 |
| F5-40 | T-F5-009 |
| F5-41 | LAW |
| F5-42 | T-F5-001 |
| F5-43 | T-F5-001 |
| F5-44 | T-F5-001 |
| F5-45 | T-F5-008 |
| F5-46 | T-F5-008 |
| F5-47 | T-F5-001 |
| F5-48 | T-F5-001 |
| F5-49 | T-F5-008 |
| F5-50 | LAW |
| F5-51 | LAW |
| F5-52 | T-F5-001 |
| F5-53 | T-F5-001 |
| F5-54 | T-F5-001 |
| F5-55 | T-F5-001 |
| F5-56 | LAW |
| F5-57 | T-F5-002 |
| F5-58 | T-F5-002 |
| F5-59 | T-F5-002 |
| F5-60 | LAW |
| F5-61 | T-F5-002 |
| F5-62 | T-F5-002 |
| F5-63 | T-F5-002 |
| F5-64 | LAW |
| F5-65 | LAW |
| F5-66 | LAW |
| F5-67 | LAW |
| F5-68 | realized-by: T-F5-002 (the progress page and the evening-before send) · T-FPLAT-021 (shipped — the `crew_arrival` key and the composer, owner ruling 2026-08-06; its words authored by T-F5-002) |
| F5-69 | LAW |
| F5-70 | T-F5-003 |
| F5-71 | T-F5-003 |
| F5-72 | T-F5-003 |
| F5-73 | T-F5-003 |
| F5-74 | T-F5-006 |
| F5-75 | T-F5-006 |
| F5-76 | T-F5-006 |
| F5-77 | T-F5-007 |
| F5-78 | T-F5-004 |
| F5-79 | T-F5-007 |
| F5-80 | T-F5-006 |
| F5-81 | LAW |
| F5-82 | LAW |
| F5-83 | LAW |
