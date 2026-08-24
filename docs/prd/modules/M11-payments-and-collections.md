# M11 · Payments & Collections — The Tenant's Money
Status: draft · Origin mix: SRC (dominant) / BRIEF (the Finance persona's collections home only) ·
Depends on: `00-README.md` (conventions) · `01-product-overview.md` (§6 non-goal summary) ·
`04-business-model.md` (`BM-02` — the two-money-systems law this module is the tenant half of) ·
`02-personas.md` (`PS-20`, `PS-26`, `PS-27`, `PS-31`, `PS-32`, `PS-33`) ·
`foundations/F1-global-market-framework.md` (`F1-09` open-set vocabularies, `F1-18`
`pack.payment-rails`, `F1-21` currency minor unit and formats, `F1-22` display labels; the IN
instance is `F1-42`, `F1-43`, `F1-46`) · `foundations/F2-roles-and-permissions.md` (§F2.5-M11,
`F2-06`, `F2-12`–`F2-15`, `F2-22`, `F2-25`) · `foundations/F3-localization.md` (`F3-19`, `F3-20`,
`F3-24` — the single money-rendering implementation and its honesty obligations) ·
`foundations/F4-data-integrity.md` (`F4-04` the server owns every money figure, `F4-07` idempotent
submission, `F4-21` nothing a field user captured is ever unrecoverable — the receipt photograph's
carve-out) ·
`foundations/F5-customer-link.md` (the customer's payment and receipt surfaces — Task 20) ·
`foundations/F6-notifications-and-search.md` (`payment_due` and the confirmation notifications —
Task 23) · `foundations/F7-design-language.md` (`F7-12` state never by colour alone, `F7-17`
density) · `foundations/F8-data-honesty.md` (`F8-12`, `F8-13`, `F8-15`, `F8-23`, `F8-24`)
· `modules/M01-onboarding-and-tenant-config.md` (`M01-54` tranche templates, `M01-55` message
templates, `M01-60` the credential surface) · `modules/M06-proposals.md` (`M06-06` proposal type,
`M06-13` the payment-terms step, `M06-45` the version in force) ·
`modules/M08-projects.md` (`M08-35`–`M08-39` the project-side money surfaces, `M08-36` the
stage event, `M08-53` cancellation) · `modules/M12-platform-billing.md` (the *other* money
system — Task 23) · `modules/M13-dashboards-and-reporting.md` (collections roll-ups — Task 23)

## 1. Purpose & scope

This module is the money the EPC's **customer** pays the **EPC**. It exists because of one
sentence in the source, and that sentence is the whole reason an owner buys the product:
*"solar businesses die of cash flow, not of bad design software"* (`S8.rule.tranches`). The
schedule the proposal set out becomes the schedule the project collects on, and this module is
where that schedule is worked: what is due, what arrived, what it arrived as, what proves it, and
what happens when any of it was wrong.

**The two-money-systems law, stated at the top because everything else depends on it.** Two money
systems exist in this product and they never mix (`BM-02`, `DOC16.two-money-systems`):

1. **Platform subscription billing** — the tenant pays *us*, on *our* account. That is
   `modules/M12-platform-billing.md`'s and nothing in this module touches it.
2. **Tenant collections** — the homeowner or the factory pays *the EPC*, on *the EPC's own*
   account. That is this module, entirely.

**The EPC's customer never pays the platform anything.** No screen in this module shows a
subscription figure, no total in this module includes one, and no figure produced here is ever
summed with one.

**The regulatory line, as product law.** Every collection settles **directly from the customer to
the tenant's own account** — *"the platform never touches funds"* (`DOC16.byo-collections`,
`DOC01.byo-collections`, `DOC04.byo-credentials`). This is load-bearing, not stylistic: a product
that held, routed, escrowed, netted or took a share of a tenant's collection would be a regulated
money-handler in its market and would need the corresponding licence. That is why the split
settlement alternative was rejected for v1 (`DOC16.route-rejected`) and why taking a percentage of
customer payments is a deliberate competitive skip (`CG-5`) — both recorded in §5 with their
revisit triggers. The market-specific licensing consequence is the pack's (`F1-18`, `F1-43`); the
law it produces is this module's and appears at `M11-01`.

It owns, at product level:

- **The collection schedule and its states** — the one money path from the accepted proposal
  version to the project's tranches to the receipts against them, reconciling to the currency's
  minor unit.
- **The connection of a tenant's own collections account** — the capability, the credential
  handling at product level, and what happens when it is absent, invalid or unavailable.
- **Payment links on due tranches** — minting on the tenant's account, the send-and-copy flow
  (sent from the tenant's connected transactional channel where one exists, copied for a person to
  send where none is — owner ruling 2026-08-06, Q45; this read "the copy-and-share flow" before
  the ruling), the link's lifecycle, and the confirmation that turns a link into a receipt.
- **Manual payment recording** — the market's payment modes, references, receipt attachments,
  part payments, and who may record.
- **Receipts and confirmation states** — including the distinction between money the tenant's
  account confirmed and money a person says arrived.
- **Corrections** — reversal entries, waivers, and the law that nothing in the money ledger is
  ever edited or deleted.
- **The collections surfaces** — the payments screen the rest of the product links into, and the
  facts the customer's own surface renders.

It explicitly does **not** own: the payment-terms step of the proposal builder (`M06-13`) or the
named templates behind it (`M01-54`); the project stage machine, the stage board and the
project-side money *display* (`modules/M08`, `M08-35`–`M08-39`); the customer-facing page, its
token, its lifecycle or a single word of its copy (`foundations/F5`); the tenant's own
subscription, its invoices, its dunning or its entitlements (`modules/M12`); the market's tax
scheme, payment-mode vocabulary, rail adapters and currency format (`foundations/F1`, rendered by
`foundations/F3`); the data-integrity and concurrency laws (`foundations/F4`); and the honesty laws every figure here
obeys (`foundations/F8`), which this module consumes and never restates differently.

## 2. Personas & surfaces

Personas (per `02-personas.md`):

- **Finance** — the primary persona. Owns money correctness: the schedule each project inherited,
  what has been received against which tranche with its mode and its receipt, and keeping the
  collected figure honest when a project changes or is cancelled (`PS-31`). **Web** for the
  ledger, reconciliation and the period view; **mobile** for recording a payment and photographing
  a receipt away from a desk.
- **EPC Owner** — everything, all money, plus the one act that is theirs alone: connecting the
  tenant's collections account (`M11-17`).
- **Project Manager** — records what arrived against the project they run, from the site
  (`PS-20`); the coordinator's collection duty in the source's words.
- **Sales Manager** — the same, team-scoped (`F2-08a`).
- **Sales Executive** — **read-only** on their own won deals, which is exactly enough to chase a
  customer without asking anyone (`S8.rule.roles`, `M08-18`); the chase message carries no live
  money instrument, so composing it, copying it and **sending** it from the tenant's connected
  official channel all sit inside that read-only scope (owner ruling 2026-08-06, Q48; `M11-26`, and
  §M11.4's permissions block). *(The send clause is that ruling's; this bullet previously read "the
  chase message carries no live money instrument (`M11-26`, and §M11.4's permissions block)" and
  named no act. The payment link stays out of this preset's reach — minting or sending a link rides
  `F2.M11.record-payments`.)*
- **Operations** — reads collections at portfolio scope as delivery requires (`PS-33`); the
  portfolio roll-up itself is `modules/M13`'s.
- **Installation Team Member** — **never**. No surface this preset reaches shows a price, a
  tranche, a receipt or any other commercial figure, and that is a property of the surface rather
  than of the viewer (`F2-06`, `M08-43`).
- **The EPC's customer** — **not a user of this module.** They pay through a link on the tenant's
  own account and read their receipts on the no-login customer surface (`foundations/F5`). This
  module supplies the facts; F5 writes every word they read.

**Surface emphasis.** The payments screen is a *functional*-density ledger (`F7-17`): schedule
rows, states, amounts, dates and receipts. Desktop carries the full ledger and the period view;
mobile carries the two acts that happen away from a desk — record a payment with a receipt
photograph, and send or copy a payment link or a request message (owner ruling 2026-08-06, Q45;
this read "copy a payment link or a request message" before the ruling). Every tranche and receipt
state renders as a label plus a mark, never colour alone (`F7-12`).

**Connection posture.** The product requires a live connection, so **every money act reaches the
server or fails honestly** — recording a payment, waiving, reversing and minting a link are refused
with an honest reason and leave nothing pending (`M11-06`). The one thing that waits is the receipt
*photograph*, which is held on the device until it uploads (`F4-21`); the payment entry it belongs
to does not exist until the server accepts it, and the two are never conflated (`M11-37`).

## 3. Feature areas

### M11.1 — The money boundary and the regulatory line

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M11-01 | **The platform never touches tenant funds — the load-bearing law of this module.** Every collection settles directly from the customer to the tenant's own account; links are minted on that account and money lands in that account's bank settlement. No product behaviour may hold, route, escrow, net, split, delay or take a share of a tenant's collection, and no future feature may quietly acquire the ability. This is a licensing boundary, not a design preference: a product that handled other people's money would need the money-handling licence its market requires, and the whole collections design exists to stay outside that (`F1-18`, `F1-43` for the market instance). | `SRC` — `DOC16.byo-collections` (docs/16 §8, verbatim: "The platform never touches funds — the load-bearing regulatory line"); `DOC01.byo-collections` (docs/01: "funds settle EPC-direct, the platform never touches money"); `DOC04.byo-credentials` (docs/04, the same clause); `R4` (shared — the tenant-collections half: "platform never touches tenant funds") | P0 |
| M11-02 | **Two money systems that never mix, and this module is only one of them.** The tenant's customers paying the tenant is this module; the tenant paying the platform is `modules/M12`. No surface here shows a subscription figure, no total here includes one, no export here mixes them, and the two keep separate vocabularies — *collections, tranches, receipts* here; *subscription, invoice, plan* there. **The EPC's customer never pays the platform anything.** | `SRC` — `DOC16.two-money-systems` (docs/16, shared — the business-model statement is `BM-02`, the platform side is `modules/M12`'s); `DOC01.byo-collections` (the who-pays-whom half, `BM-02`) | P0 |
| M11-03 | **The product takes no share of any tenant collection, ever.** No percentage, no per-transaction fee, no float, no "powered by" surcharge on money the EPC collects. This is a deliberate competitive skip and it is recorded as one: the rival model that takes a cut of customer payments is exactly what the never-touch-funds law forecloses, and the product's revenue comes from subscription alone (`modules/M12`). | `SRC` — `CG-5` (docs/12 competitive verdict, SKIP-DELIBERATELY: taking a cut "makes us a regulated money-mover"); `CG-matrix.18` (the matrix restatement of the capability line); `DOC16.two-money-systems` (cited) | P0 |
| M11-04 | **Split settlement with the platform as master merchant is rejected for v1, and the rejection carries its trigger.** The alternative — the platform as the account of record, splitting each collection — is documented as an alternate rail adapter and nothing more, because it would make the platform the licence-bearing merchant with the obligations that follow. Revisit only if a marketplace revenue model appears (§5). | `SRC` — `DOC16.route-rejected` (docs/16 §8: rejected for v1, "documented only as an alternate adapter. Revisit only if a marketplace revenue model appears") | P0 |
| M11-05 | **The collection rail is a capability declared by the market pack, never a vendor requirement.** Which rails a market has — payment links, the payment modes a manual entry may carry, and any payment-data constraints — is `pack.payment-rails` data; the launch market's rail is a *reference implementation* and swapping it is an adapter change, never a product change. No requirement in this module names a payment provider, and no screen in it does either. | `SRC` — `F1-18` consumed (`pack.payment-rails`: modes, rails, adapters, constraints); `DOC07.ports-vendor-neutral` (cited — dispositioned by Task 3: vendor names are v1 reference implementations); `R4` (shared — the named provider is the launch market's rail, `F1-43`) | P0 |
| M11-06 | **Every money mutation is online-only and is refused, never queued.** Recording a payment, attaching it to a tranche, waiving, reversing and minting a link all require the server; with no connection the act fails fast with an honest reason and leaves nothing pending. There is no offline money in this product, on any surface, at any tier. | `SRC` — `DOC06.server-owns-money` (docs/06 §1 principle 3, published at `F4-04`: every money figure is computed server-side); `F4-07` consumed (a retried submission never duplicates and never silently drops) | P0 |
| M11-07 | **Every money event is an audit entry, written with the change that caused it.** Tranche edits, payment recorded, reversal posted, waiver applied, link minted, and every credential lifecycle event and decrypt are covered events — actor, time, before and after — and audit rows can never be updated or deleted. **And one act that writes no money is a covered event too: the send of the plain payment-request message from the tenant's connected official channel is an audit entry recorded under the name of the person who sent it (owner ruling 2026-08-06, Q52)** — it leaves the tenant's own official channel and reaches a customer about money, so it is written to the same log with its actor, whatever preset that person holds, the project-visibility-only reader of `F2.M11.send-request-message` included. *(That last sentence is the ruling's; this row previously ended at "…and audit rows can never be updated or deleted." and named no message send, the question standing open at §6 `M11-Q5` and `foundations/F2` §6 `F2-Q2`. Every money event above, the actor/time/before-and-after discipline and the never-updated-never-deleted rule are unchanged, and the entry records the send act and its sender — it is not a delivery state and claims none, `M11-26`.)* **And that covered event is the send from the connected channel and nothing else (owner ruling 2026-08-06, Q57): on `M11-26`'s copy-paste fallback — no channel connected — the product composes the message and places it on the clipboard, a person sends it outside the product, and no audit entry is written at all, neither a compose record nor a copy record nor a send record.** The same chase is therefore attributable when the product sends it and unrecorded when a person does — a deliberate simplification, recorded as one rather than compensated for: this log holds what the product performed, and the product never claims what it did not do. *(Those last two sentences are that ruling's; this row previously stopped at the Q52 clause and stated no boundary for the fallback path, the question standing open at §6 `M11-Q6` and `foundations/F2` §6 `F2-Q3`. Q57 adds no covered event, adds no compensating record, counter or timeline entry, and changes nothing else here: every money event above, the actor/time/before-and-after discipline, the never-updated-never-deleted rule and the Q52 clause's own terms are unchanged.)* | `SRC` — `F2-22` consumed (the covered-events checklist names money events and credential lifecycle explicitly); `DOC04.audit-log` (cited — `foundations/F2` owns the log) — both **unsuperseded**; the message-send clause is `F2-22` consumed **as amended by owner ruling 2026-08-06 (Q52)**, whose checklist now names that send, **bounded to the connected channel by owner ruling 2026-08-06 (Q57)**, which adds no covered event | P0 |

**Behavior detail.** The boundary above is not a banner on a screen — it is the shape of every
flow in this module. When a tenant has connected their own account, the product's role in a
collection is to *mint an instrument on that account*, *show what came back*, and *record it*; the
money itself is never in the product's custody at any moment. When a tenant has not connected an
account, the product's role is to *record what a person tells it happened* and *keep the proof*.
Those are the only two shapes, and both keep the platform outside the money.

The vocabulary separation of `M11-02` is enforced by construction: this module's figures are
denominated in the **tenant's** currency for the **tenant's customer's** obligation, while
`modules/M12`'s are the tenant's own bill. A screen that needed both would be a defect; nothing in
this suite composes them.

Permissions: recording rides `F2.M11.record-payments` (EPC Owner · Sales Manager · Project
Manager · Finance); connecting an account is the EPC Owner's alone (`F2.M11.connect-gateway`);
waiving rides `F2.M11.waive-tranche`. Reading collections is not a new visibility domain — it
rides the projects domain (`F2.M08.project-visibility`, whose Finance cell is exactly this money
scope) and no preset gains a money-only scope (`F2-15`).

**Edge cases & what-goes-wrong.**
- *Someone asks for the platform to collect on the tenant's behalf and settle later* → refused as
  a licensing boundary, not a backlog item (`M11-01`, §5).
- *A market's rail offers split settlement and it looks convenient* → still rejected; it is
  recorded as an alternate adapter with a revisit trigger (`M11-04`).
- *A report or export is asked to show "all money"* → it cannot: the two systems do not sum
  (`M11-02`); the tenant's own bill is `modules/M12`'s surface.
- *A money act is attempted with no connection* → refused with the reason named, nothing queued,
  no optimistic state (`M11-06`).

**Acceptance criteria.**
- Given any collection in the product, when it settles, then it settles from the customer to the
  tenant's own account and no platform-held balance exists at any point (`M11-01`).
- Given a collections surface, when it renders, then no platform-subscription figure appears on it
  and no total on it includes one (`M11-02`).
- Given a completed collection of any amount, when the tenant's settlement is examined, then the
  product has deducted nothing from it (`M11-03`).
- Given a tenant setting up collections, when the available arrangements are read, then no
  split-settlement or platform-as-master-merchant arrangement is offered anywhere in the product,
  and the alternative exists only as a recorded non-goal with its revisit trigger (`M11-04`, §5).
- Given the payment rail of the tenant's market, when the module is read end to end, then no
  provider name appears as a requirement and every rail fact resolves to a pack key (`M11-05`).
- Given no connection, when a payment is recorded, waived, reversed or a link is minted, then the
  act fails fast with an honest reason and no pending write exists (`M11-06`).
- Given any money event, when the audit log is read, then the event appears with its actor, its
  time and the change that caused it (`M11-07`).
- Given the plain payment-request message sent from the tenant's connected official channel, when
  the audit log is read, then the send appears as its own entry under the name of the person who
  sent it — including where that person holds project visibility alone (`M11-07`, `F2-22`;
  `F2.M11.send-request-message`). *(Added by owner ruling 2026-08-06, Q52, which closed §6
  `M11-Q5`; no other line in this block changes.)*
- Given a tenant with **no** connected official channel, when the same request message is composed,
  copied and sent by a person outside the product, then the audit log holds no entry for that act —
  no compose record, no copy record, no send record — and nothing elsewhere in the product records
  it either (`M11-07`, `F2-22`; `M11-26`). *(Added by owner ruling 2026-08-06, Q57, which closed §6
  `M11-Q6` and `foundations/F2` §6 `F2-Q3`: the log records what the product performed, and on that
  path it performed no send. No other line in this block changes.)*

**Localization notes.** Amounts render only through the single money implementation using the
tenant market's symbol, grouping and minor unit — the same way in every language (`F3-19`,
`F3-20`), carrying their honesty qualifiers at every density (`F3-24`). **Analytics events.**
`collections_surface_viewed` (surface), `money_mutation_refused_offline` (act).

### M11.2 — The tranche schedule: one money path

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M11-08 | **One money path, reconciling end to end to the currency's minor unit.** The bill of materials, the proposal's money block, the tranche schedule and the payments recorded against it are one chain, not four records that resemble each other: the schedule's percentages sum to exactly 100.00 for a version, its amounts sum to that version's payable, and the receipts reconcile against those amounts — all to the minor unit the market pack declares (`F1-21`). A disagreement anywhere in that chain is a defect, never a rounding style. | `SRC` — `DOC04.tranches-money-path` (docs/04, verbatim: "Σpct = 100.00 per version; Σ amounts = payable to the currency's minor unit; BOM ↔ proposal ↔ tranches ↔ payments reconcile"); `DOC16.manual-payment-modes` (the same one-money-path clause); `M05-70`, `M06-13` consumed (the upstream halves); `F1-21` consumed (minor unit) | P0 |
| M11-09 | **The accepted proposal version's payment terms *are* the collection schedule — the same rows, pinned to that version, never re-entered and never re-derived.** The project inherits them at Won by reference (`M08-04`, `M08-35`); the tranche amounts are computed from *that version's* payable and move only when the version in force moves (`M11-14`). A sent document keeps the figures it was sent with, so a later price change never rewrites a schedule a customer already agreed to (`F8-15`). | `SRC` — `DOC04.tranches-money-path` ("the … tranche schedule on a proposal version becomes the project's collection schedule at Won (same rows)"); `S8.rule.tranches` (shared — the project-side surfaces are `M08-35`'s); `M06-13`, `M01-54` consumed; `F8-15` consumed | P0 |
| M11-10 | **Tranche state is derived from the ledger and can never be typed.** `upcoming → due → part-received → received`, with `waived` terminal: the received states are recomputed from the payment entries that exist, so no person sets "received" as a status and no status can disagree with the receipts behind it. What a person *can* do is add an entry (`M11.5`), reverse one (`M11.7`) or waive the tranche (`M11-49`) — each of which changes the state by changing the facts. | `SRC` — `DOC04.tranches-money-path` (verbatim: "tranche status upcoming → due → part_received → received, waived terminal, recomputed from payments"); `F8-13` consumed (derived-by-comparison, never a stored flag) | P0 |
| M11-11 | **Completing the stage a tranche is mapped to makes that tranche due.** The mapping is against the canonical project chain with market-neutral stage names (`R2`); the stage event is `modules/M08`'s (`M08-36`) and the transition it causes is this module's. Nothing else makes a tranche due — not a date, not a person's judgement, not the customer's link being opened. | `SRC` — `DOC04.tranches-money-path` ("Stage completion makes the matching tranche due"); `S8.rule.tranches` ("When a stage completes, the matching tranche becomes due" — shared, the stage event is `M08-36`); `R2` as amended (shared — the `due_on_stage` mapping half the ledger routes here) | P0 |
| M11-12 | **A tranche mapped to a stage the project skips becomes due when the project passes the point that stage occupied — recorded as a reading, not as source text.** Skippable stages are pack data (`F1-22`) and the source is silent on what happens to money mapped to one. `M08-36` states this reading first and this module reciprocates it so the two never diverge; the alternative reading — the tranche stays `upcoming` until a person releases it — is available to an owner ruling and would be a change to this rule, not to the schedule's structure. What is *not* available under any reading is stranding the money silently. | `SRC` — `DOC04.tranches-money-path` (stage completion makes the matching tranche due); `R2` as amended (skippable stages are pack data); `M01-54` consumed (its editor warning defers to "M11's due-derivation rules"). **Author reading, stated as a choice:** the skipped-stage clause itself is *not* source text — it is stated at `M08-36` as an inference, is reciprocated here as a disclosed reading, and is not carried by either module as source truth (§6) | P0 |
| M11-13 | **A tranche's amount is the version's arithmetic, and a person never types one.** Percentages come from the terms; amounts come from the payable; the minor-unit remainder is allocated by the same single arithmetic everywhere rather than by whoever is looking (`F8-24`). A tenant who wants different money writes different terms on a new proposal version (`M11-14`) — the schedule is not a scratchpad. | `SRC` — `DOC04.tranches-money-path` (Σ amounts = payable to the minor unit); `DOC04.tranche-templates` (shared — percentages and their 100.00 rule; the template surface is `M01-54`); `F8-24` consumed | P0 |
| M11-14 | **A new accepted version revises the schedule, and every receipt already taken survives it.** When a change after Won produces a new proposal version with revised terms, the project's schedule follows the version in force while the earlier one stays readable; recorded payments are never rewritten, re-attributed silently or deleted, and the surface shows what has been collected against the *new* total honestly, including the case where more has already been collected than the revised schedule expects. | `SRC` — `S8.wrong.7` (shared — "new proposal version, revised tranches, original preserved"; the project's reference move is `M08-50`); `DOC04.payments-append-only` (nothing is edited); `DOC04.proposal-versions-immutable` (cited — `modules/M06`); `F8-15` consumed | P0 |
| M11-15 | **Nothing on the money path is fabricated, and an absent schedule renders as absent.** If the accepted version carries no payment terms, the project's money surface says so plainly and offers the honest next act — it does not invent rows, distribute the payable evenly, back-fill a template, or show a projection where an amount owed belongs (`F8-23`). This is the standing rule, and it is what the ruled OPEX/PPA money surface obeys (`M11-16`, final per owner ruling 2026-08-04 Q32). | `SRC` — `F8-23` consumed (a projection is never rendered as an amount owed); `F8-12` consumed; reciprocates `M08-35`'s behavior detail ("shows an empty schedule and says so plainly; it never fabricates rows") | P0 |
| M11-16 | **FINAL behaviour for an operating-expense or power-purchase project's money surface (owner ruling 2026-08-04, Q32).** Such a project tracks the same stages and the same document checklist as any other (`R17`), and its money surface is the **one-time payments from the accepted version** — deposit, connection fee, whatever its terms name — with the **full tranche toolset** (states, due-on-stage, request messages, receipts), plus the honest note **"monthly energy billing is handled outside this platform."** This module: displays exactly the schedule the accepted version carries, performs **no** recurring billing, generates **no** periodic charge, renders an **absent** schedule as absent (`M11-15`), and adds **no** row of its own — nothing fabricated, nothing hidden. `modules/M08` §M08.6 states the same rule from the project side. | `SRC` — `R17` (shared — the document type is `M06-06`, the post-Won stage behaviour `M08-06`, the projection label `F8-23`); `M06-13` consumed; one-time-payments + honest-note rule per owner ruling 2026-08-04 (Q32), replacing the interim | P0 |

**Behavior detail.** The schedule is a **view of an inheritance**, not a copy: each row shows its
label, its share, its computed amount, its state, and the date it entered that state where it has
one. The due row is the one the surface lifts — it is the only row anyone can act on — and it
carries the two acts that collect: the payment link where an account is connected (`M11.4`) and
the request message in every case (`M08-38`, whose composition is `M01-55`'s template and whose
sending is the tenant's connected transactional channel's where one exists and a person's where
none is — owner ruling 2026-08-06, Q45; `M11-26`, `M03-03`). *(This clause previously read "the
ready-to-paste request message in every case (`M08-38`, whose composition is `M01-55`'s template
and whose sending is nobody's, `D32`)"; the ready-to-paste copy survives as the fallback.)*

Stage-driven due-ness is what makes the schedule useful and it is also what makes it honest: the
product never claims a customer owes money before the milestone their money was tied to has
happened. Where a market's pack marks a stage skippable, `M11-12`'s disclosed reading governs, and
the tranche-template editor warns at authoring time so the tenant sees the case before it happens
(`M01-54`'s edge case, which defers here).

Where more has been received than a revised schedule expects (`M11-14`), the surplus is stated as
a surplus against the schedule rather than absorbed into a row or hidden — the ledger is the
truth and the schedule is a reading of it.

Permissions: reading the schedule rides `F2.M08.project-visibility`; every act on it rides
`F2.M11.record-payments` or `F2.M11.waive-tranche`. Tranche edits and payments are audited
(`F2-22`).

**Edge cases & what-goes-wrong.**
- *The proposal's terms do not sum to 100%* → cannot reach here: the sum is enforced at Generate
  with the remainder stated (`M06-13`, `S6B.wrong.3`), and a schedule is only ever inherited from
  a generated, accepted version.
- *A stage a tranche was mapped to is skipped in this market* → the tranche becomes due when the
  project passes the point that stage occupied, under the disclosed reading of `M11-12`; it is
  never stranded silently.
- *A change after Won produces new terms* (`S8.wrong.7`) → the schedule follows the version in
  force, the original stays readable, and no receipt is rewritten (`M11-14`).
- *More was collected than the revised schedule expects* → shown as a surplus against the
  schedule, never silently absorbed (`M11-14`, `M11-36`).
- *The accepted version carries no payment terms* → the surface renders empty and says so; no
  rows are fabricated (`M11-15`).
- *An operating-expense or power-purchase project asks for a recurring charge* → not built, by
  ruling; the surface shows the one-time payments from the accepted version with the honest
  outside-platform note (`M11-16`, owner ruling 2026-08-04 Q32).
- *Two surfaces show different amounts for the same tranche* → cannot happen: one arithmetic, one
  figure (`M11-13`, `F8-24`); a disagreement is a defect.

**Acceptance criteria.**
- Given an accepted proposal version, when its project's schedule renders, then the rows, their
  shares and their amounts are that version's, unentered by any person, and the amounts sum to
  that version's payable to the minor unit (`M11-08`, `M11-09`, `M11-13`).
- Given a tranche with recorded payments, when its state renders, then the state is the one the
  entries imply and no control exists that sets it directly (`M11-10`).
- Given a project whose coordinator completes the stage a tranche is mapped to, when the stage
  move saves, then that tranche is due (`M11-11`).
- Given a market pack that marks a mapped stage skippable and a project that skips it, when the
  project passes the point that stage occupied, then the tranche becomes due rather than remaining
  upcoming (`M11-12`).
- Given a new accepted version with revised terms, when the schedule re-renders, then it follows
  the version in force, every earlier receipt is still present and readable, and the earlier
  schedule remains viewable (`M11-14`).
- Given an accepted version with no payment terms, when the money surface renders, then it states
  that there is no schedule and creates no rows (`M11-15`, `M11-16`).

**Localization notes.** Tranche labels are tenant-authored content per language (`M01-54`); stage
names render through the pack's labels (`F1-22`); amounts and percentages render through `F3`'s
single implementations (`F3-19`, `F3-20`). **Analytics events.** `tranche_became_due` (share,
stage), `tranche_schedule_viewed`, `tranche_schedule_absent_rendered` (proposal type),
`tranche_schedule_revised` (new version).

### M11.3 — Connecting the tenant's own collections account

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M11-17 | **Each tenant connects their own collections account, and that account is where everything happens.** Payment links are minted on it, confirmations come back from it, and settlement lands in the bank account behind it. The tenant is the account holder and the merchant of record for their own collections; the product is a client of their account, never a party to the transaction (`M11-01`). | `SRC` — `DOC16.byo-collections` (docs/16 §8: "each tenant connects THEIR OWN gateway account; payment links are minted on the tenant's account and funds settle directly to the tenant's bank"); `DOC01.byo-collections`; `DOC14.byo-payment-links` (BYO payment links are live in projects scope for tranche collection) | P0 |
| M11-18 | **Connection is a capability, and its credential handling is stated at product level: write-only, last-4, never read back.** After entry a credential is never displayed again beyond its last four characters, never returned to any client, never logged and never carried in a customer-facing artefact; storage is encrypted and every decrypt is an audit entry. Credentials belong to the tenant and are the tenant's to rotate at any time. | `SRC` — `DOC04.byo-credentials` (docs/04: encrypted at rest, "decrypted only inside the owning adapter, never logged, never in contracts"); `DOC08.credentials-last4` (cited — the settings surface is `M01-60`); `M01-60` consumed | P0 |
| M11-19 | **A failing connection is loud, never silent.** Credentials are probed on a schedule; an invalid, expired or revoked credential raises an alert and a persistent settings nag, and — the part that belongs to this module — **every collections surface states the failure in place and offers the manual path**, rather than presenting a broken link action or failing blind at the moment someone is trying to collect. | `SRC` — `DOC09.credential-probe-nag` (docs/engineering/09, cited — the probe and the nag are `M01-60`'s; the collections-surface honesty is this module's); `DOC07.payment-link-fallback` (docs/engineering/07: missing/invalid credentials → the tranche "falls back to manual-collection mode"); `F8` honesty family (status honesty, never silent failure) | P0 |
| M11-20 | **The link rail is optional per market, and the module is fully functional without it.** Whether a market has a payment-link rail at all is `pack.payment-rails` data; where it has none, or where a tenant simply has not connected an account, collections run entirely on manual recording and every capability of this module except link-minting still works. | `SRC` — `F1-18` consumed (the pack declares the market's rails; manual modes always available); `DOC16.manual-payment-modes` ("Tenants without a gateway account: manual payment modes stand") | P0 |
| M11-21 | **The connected account is an accelerator, never a dependency — stated as law because the temptation runs the other way.** No collection, receipt, tranche state, document, handover or customer surface may be made conditional on a tenant having connected an account. *"Cash is still king"* in this trade, and the product that assumes otherwise is wrong about its market. | `SRC` — `DOC16.manual-payment-modes` (verbatim: "The payment-link port is an accelerator, not a dependency"); `DOC07.payment-link-fallback` ("record payment by hand — always available, cash is still king in EPC"); `F1-42` (the IN instance of the same rule) | P0 |
| M11-22 | **No credential ever reaches a client, and no collection call is made from one.** The rail is spoken to only from the server side, on the tenant's behalf; nothing in a browser or on a device holds, sees or transmits a tenant's collection credential. | `SRC` — `DOC07.ports-vendor-neutral` (cited — "no third-party call happens from the client"; per-tenant BYO credentials are encrypted); `DOC04.byo-credentials` | P0 |
| M11-23 | **Disconnecting is an act with honest consequences, and the product does not claim control it does not have.** A tenant may disconnect or rotate at any time; the act is recorded and audited. Links already minted live on the **tenant's own** account and their fate is that account's — the product says exactly that rather than implying it can revoke them, and it stops offering to mint new ones immediately. Every already-recorded receipt stays exactly where it is. | `SRC` — `DOC16.byo-collections` (the account is the tenant's; the platform never touches it) + `DOC04.byo-credentials` ("the tenant's to rotate", `DOC09.credential-probe-nag`); **the disconnect consequence is stated as the honest reading** where the source is silent — the product never claims an ability over an account it does not hold | P1 |

**Behavior detail.** Connecting is a two-screen act at most: the tenant supplies their own
account's credentials in the credential surface (`M01-60`), and this module's collections settings
show the connection's **state** — connected and healthy, connected but failing its probe, or not
connected — in the same words on every surface that depends on it. There is no "verify later"
state that lets a broken connection look live.

When the connection is absent or failing, the due tranche does not lose an action; it **changes**
action: the payment-link actions are not offered — neither the send nor the copy — "Record
payment" is, and the surface states why in one line rather than showing a disabled control with no
explanation (`M11-19`, `DOC07`'s fallback). *(The action list is amended per owner ruling
2026-08-06, Q45; this line previously read ""Copy payment link" is not offered, "Record payment"
is". The rule itself — no broken link action, the manual path with the reason stated — is
unchanged.)*

Where a market has no link rail at all (`M11-20`), the link affordance never appears; nothing in
the module renders a capability the tenant's market cannot have (`F1-09`'s open-set discipline
applied to surfaces).

Permissions: `F2.M11.connect-gateway` — **EPC Owner only**, the same holder set as the credential
surface it rides (`F2.M01.manage-tenant-settings`, `M01-60`); no cell is widened (`F2-15`).
Credential lifecycle events and every decrypt are audit entries (`F2-22`).

**Edge cases & what-goes-wrong.**
- *Credentials are missing or invalid when someone tries to collect* → the tranche falls back to
  manual collection with the reason stated in place; nothing errors blind (`M11-19`,
  `DOC07.payment-link-fallback`).
- *A credential is revoked at the provider between probes* → the next act fails honestly and the
  surface switches to the manual path rather than retrying silently (`M11-19`).
- *Someone asks to see the stored credential* → impossible; last-4 only, no read-back path exists
  (`M11-18`).
- *A tenant in a market with no link rail opens a due tranche* → they see the manual path only,
  with no teaser for a capability their market does not have (`M11-20`).
- *A tenant disconnects mid-project* → recorded; existing receipts unchanged; the product states
  plainly that already-minted links live on their own account (`M11-23`).
- *The rail is up but slow or unreachable at the moment of minting* → the act fails with an honest
  message and the manual path stays available; no half-minted state is shown (`M11-19`, `M11-21`).

**Acceptance criteria.**
- Given a tenant with a connected account, when a payment link is minted, then it is minted on
  that tenant's account and settlement is to that tenant's bank (`M11-17`).
- Given a stored credential, when any surface in this module renders it, then at most its last
  four characters appear and no read-back exists (`M11-18`).
- Given a credential that fails its probe, when a due tranche is opened, then the surface states
  the failure and offers manual recording instead of a link action (`M11-19`).
- Given a tenant with no connected account, when they work any collections surface, then every
  capability except link-minting is available and nothing is blocked (`M11-20`, `M11-21`).
- Given any collections flow, when its network activity is examined, then no tenant credential
  leaves the server and no call to the rail originates from a client (`M11-22`).
- Given a tenant who disconnects, when the collections settings re-render, then the state is
  "not connected", link-minting is no longer offered, existing receipts are intact, and the copy
  about already-minted links makes no claim of revocation (`M11-23`).

**Localization notes.** Connection-state copy translates per `F3`; the rail's own name is provider
data and is never a translated product string. **Analytics events.**
`collections_account_connected`, `collections_account_probe_failed`,
`collections_account_disconnected`, `collections_manual_fallback_shown` (reason).

### M11.4 — Payment links on a due tranche

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M11-24 | **A due tranche offers the payment link once the tenant has connected an account — sent from the tenant's connected transactional channel where one exists, with "Copy payment link" as the fallback where none is (owner ruling 2026-08-06, Q45, applying owner ruling 2026-08-04 Q33).** The action lives on the due row and mints on the tenant's account for that tranche — one collect action, on the row that owes money. Where a transactional channel is connected, that action **sends** the minted link and its request message from that channel and is the due row's primary act (`M11-26`, `M03-03`); where none is connected, the primary act is the copy the source names and a person sends it. **Copy stays on the due row on both paths** — a person may always take the link themselves. *This row previously read, in full: **A due tranche offers "Copy payment link" once the tenant has connected an account.** The action lives on the due row, mints on the tenant's account for that tranche, and is the whole of the collection flow the source specifies — one action, on the row that owes money. Only the act's shape is amended; the minting behaviour, the account it mints on and the row it lives on are unchanged.* | `SRC` — `UXG-12` (Section D · C9, verbatim: "'Copy payment link' action on the due tranche once tenant connects [the rail]" — the copy act is the source's and survives as the fallback); `DOC14.byo-payment-links`; `C9` (shared — the customer's side of the same moment is `foundations/F5`'s, Task 20); the send is owner ruling 2026-08-06 (Q45) applying owner ruling 2026-08-04 (Q33), lane boundary `M03-03` | P0 |
| M11-25 | **A link is minted for one tranche and for exactly what that tranche still owes**, in the tenant's currency, to the minor unit — never a rounded figure, never a "convenient" amount, never a lump that spans rows. | `SRC` — `DOC04.tranches-money-path` (amounts to the minor unit; per-tranche collection); `F1-21` consumed; `F8-24` consumed (one figure, one source) | P0 |
| M11-26 | **The payment link and its request message send from the tenant's connected transactional channel; composed copy-paste is the fallback where no channel is connected (owner ruling 2026-08-06, Q45, applying owner ruling 2026-08-04 Q33).** Where the tenant has a connected official channel — the same connection `modules/M03` establishes — the minted link and its composed request message go out from that channel under the transactional/utility template class (`M03-03`), and that channel's own delivery states ride the sent message honestly: exactly as it reports them and no further (`F5-28`). Where no channel is connected, the link is placed on the clipboard (with the request message where the person wants both) and the rep or coordinator sends it through whatever channel they already use — and **only that fallback path claims no delivery**: no delivery state appears anywhere on the surface for it, because the product will not claim knowledge of a delivery it did not perform. **Only the message is automated.** Money is untouched by this row: collections still settle directly from the customer to the tenant's own account and the platform touches no funds (`M11-01`, unamended). *This row previously read, in full: **The product composes and copies; a person sends.** There is no send capability here and no delivery state anywhere on the surface: the link is placed on the clipboard (with the request message where the person wants both) and the rep or coordinator sends it through whatever channel they already use. The product will not claim knowledge of a delivery it did not perform. That was the pre-Q33 manual-only rule stated unscoped; it is retired here and survives only as the fallback path's no-delivery-claim discipline. The divergence it created with this document's §5 is recorded at `docs/prd/registers/conflicts.md` row 10 and is closed by this amendment.* | `SRC` — `D32` (cited — `modules/M06` owns the messaging non-goal), whose manual-only rule is superseded for the transactional lane by owner ruling 2026-08-04 (Q33) and applied to this row by owner ruling 2026-08-06 (Q45), surviving only as the fallback path's no-delivery-claim discipline; `M03-03` (the lane boundary); `S8.rule.tranches` + `M08-38` (shared — the ready-to-paste request message, whose no-delivery-state law now binds the fallback path alone) | P0 |
| M11-27 | **A tranche becomes received only on confirmation from the tenant's own account, and a repeated confirmation never counts twice.** Confirmation is verified as coming from that tenant's account, is safe to receive more than once, marks the tranche's receipt and attaches the receipt record. Nothing about "the customer said they paid" moves the state — only the account's confirmation, or a person's explicit recorded entry (`M11.5`), which is labelled as exactly that (`M11-42`). | `SRC` — `DOC16.byo-collections` (docs/16 §8: confirmations "are verified with the tenant's own secret, idempotent, mark the tranche received and attach the receipt"); `UXG-12` ("receipt state reflects webhook confirmation" — carried at product level) | P0 |
| M11-28 | **Between payment and confirmation there is a stated waiting state, never a guess.** A link that has been opened or paid but not yet confirmed renders as awaiting confirmation with that wording — not as received, not as failed, and not as an empty row that makes a person wonder. | `SRC` — `UXG-12` (receipt state follows confirmation — the intermediate state is the honest consequence); `F8-12` consumed (never render an unreconciled money state as final); `DOC07.payment-link-fallback` (the reconciliation that resolves it) | P0 |
| M11-29 | **Missed confirmations are healed by reconciliation, not by a person chasing the product.** The tranche's status is re-checked against the tenant's account whenever a user views it, and a periodic sweep repairs anything nobody looked at; a repaired state is the same state a live confirmation would have produced, and the receipt it produces is identical. | `SRC` — `DOC07.payment-link-fallback` (docs/engineering/07, verbatim: "Missed webhooks are healed by status-poll reconciliation whenever a user views the tranche, plus a periodic sweep") | P0 |
| M11-30 | **A link whose amount no longer matches what is owed is superseded, and the surface says so.** If the tranche's outstanding amount changes — a part payment arrives, or a new accepted version revises the schedule — an outstanding link no longer represents what is owed; the surface marks it superseded and offers a fresh one rather than leaving two truths in circulation. | `SRC` — `F8-12`, `F8-24` consumed (money never renders stale as final; one figure, one source) applied to a minted instrument; **the supersession rule is stated as the honest reading** where the source is silent on link lifecycle | P1 |
| M11-31 | **When link-minting is unavailable, the tranche falls back to manual collection with the reason stated — and never becomes uncollectable.** Missing credentials, a failing probe, a market without the rail, or a rail that will not answer all land in the same place: the manual path, in one tap, with an honest line about why. | `SRC` — `DOC07.payment-link-fallback` ("falls back to manual-collection mode (record payment by hand — always available)"); `DOC16.manual-payment-modes`; `M11-21` consumed | P0 |
| M11-32 | **An unpaid tranche never gates the customer's own surface.** The payment link and the customer's progress link are different objects with different jobs: money owed is chased through people, and *"never block the customer's progress link over money — chase the person, do not punish the view"*. No state in this module may be wired to a customer-facing gate. | `SRC` — `S8.wrong.3` (verbatim; shared — the board/chase surfaces are `M08-39`'s and the link-lifecycle law is `foundations/F5`'s `C.lifecycle.7`); `DOC04.link-lifecycle` (cited — F5: "Never revoked over unpaid money") | P0 |

**Behavior detail.** The whole flow is four steps, and the fourth has two branches: the tranche
falls due (`M11-11`) → a holder taps the link action → the product mints on the tenant's account
for the outstanding amount (`M11-25`) → **where a transactional channel is connected**, the link
and the composed request message (`M01-55`, `M08-38`) send from that channel under the
transactional template class and its own delivery states ride them honestly; **where none is
connected**, both go to the clipboard and the person sends them, and only that path claims no
delivery (`M11-26`). What comes back is the account's confirmation, which writes the receipt
(`M11-27`) and moves the tranche's state by changing the ledger, exactly as a manual entry would
(`M11-10`). *(Amended per owner ruling 2026-08-06, Q45. This paragraph previously opened "The whole
flow is four steps and none of them is the product sending anything" and ended "and puts it on the
clipboard with the composed request message (`M01-55`, `M08-38`) → the person sends it" — the
pre-Q33 manual-only rule, now retired for the connected-channel path. The money steps are
unchanged: the product still mints on the tenant's own account and never holds the funds,
`M11-01`.)*

**The waiting state matters more than it looks.** `C9` is the highest-anxiety moment in the whole
customer journey — *"first real money to a company they met three weeks ago"* — and the three
things the source says reduce that anxiety are an **instant receipt**, a **named person to
contact**, and a **clear statement of what happens next and when**. This module owns the first of
those (`M11.6`) and supplies the facts for the other two; the words the customer reads are
`foundations/F5`'s. A surface that showed nothing between payment and confirmation would put the
most anxious moment in the journey behind a blank screen, which is why `M11-28` exists.

Reconciliation (`M11-29`) is deliberately unglamorous: the same check runs on view and on a sweep,
and it is designed to be boring — a repair produces exactly the state a live confirmation would
have, never a second receipt (`M11-27`'s repeat-safety).

Permissions: minting, **sending** or re-copying a **payment link** rides `F2.M11.record-payments` —
it creates or carries a live collection instrument on the tenant's account, so it sits with the
collection set. The plain **request message**, which carries no instrument, rides the reader's
project scope (`F2.M08.project-visibility`) — **composing it, copying it and sending it from the
tenant's connected official channel alike (owner ruling 2026-08-06, Q48)** — which is what lets the
read-only Sales Executive chase their own won deal (`S8.wrong.3`, `M08-18`). Link mints are audited
(`F2-22`). **So is the send of the plain request message: it is an audited event, written under the
name of the person who sent it (owner ruling 2026-08-06, Q52; `F2-22` as amended, `M11-07`)** — the
message leaves the tenant's own official channel and reaches a customer about money, and the entry
names the sender whatever preset they hold, the project-visibility-only reader included. Composing
and copying write no entry; the **send** is the audited act. *(The send-audit sentences are that
ruling's; this block previously ended at "Link mints are audited (`F2-22`)." and made no audit claim
for the message send at all — the question stood open at §6 `M11-Q5` and `foundations/F2` §6
`F2-Q2`, both now closed. Q52 moves no grant: who may send is Q48's answer, unchanged.)*
**Where no channel is connected, nothing is written at all (owner ruling 2026-08-06, Q57):** on
`M11-26`'s copy-paste fallback the product composes the message and places it on the clipboard, the
person sends it outside the product, and the log carries no compose record, no copy record and no
send record for that path — and no counter, timeline entry or other compensating record stands in
for one. The same chase is attributable when the product sends it and unrecorded when a person
does; that is the simpler rule the owner chose, recorded as a deliberate trade rather than a gap,
and it follows from what this log is: what the product performed, never what it did not do. *(The
fallback sentences are Q57's; this block previously stated "Composing and copying write no entry;
the **send** is the audited act." and left the fallback path's silence unstated, the question
standing open at §6 `M11-Q6` and `foundations/F2` §6 `F2-Q3`, both now closed. Q57 moves no grant
and amends no cell of this section — the amended cell is `M11-07`, in §M11.1.)*
*(**Amended per owner ruling 2026-08-06, Q48 — the question this block recorded as open is now
settled, and the send of the plain message stays in project scope.** This block previously gave the
plain request message to the reader's project scope without naming the send, and carried the
annotation, in full: "**New question raised by applying owner ruling 2026-08-06, Q45 — recorded, not
decided here.** The ruling settled that the message sends; it did not state whose act the send of
the **plain request message** is. Whether sending that message from the tenant's own official
channel — as distinct from composing and copying it — rides the same reader project scope or needs
its own holder set is open at §6 as `M11-Q4`. Nothing on this surface decides it, and the payment
link's own authority above is unaffected." The ruling settles it in project scope: the plain message
carries no money instrument, and keeping the send there preserves the case the PRD explicitly wanted
— a read-only Sales Executive chasing their own won deal (`S8.wrong.3`, `M08-18`). **The payment
link is unchanged:** minting and sending an actual link still ride `F2.M11.record-payments`, because
a link is a live collection instrument. `foundations/F2` §F2.5-M11 now carries the row the absence of
which raised the question — `F2.M11.send-request-message`.)*

**Edge cases & what-goes-wrong.**
- *The customer pays but the confirmation never arrives* → the tranche shows awaiting confirmation
  and reconciliation resolves it on the next view or sweep (`M11-28`, `M11-29`).
- *The same confirmation arrives twice* → it counts once; no duplicate receipt exists (`M11-27`).
- *The customer pays part of the amount through the link* → the tranche moves to part-received and
  the outstanding figure updates; the superseded link is marked (`M11-10`, `M11-30`).
- *A new version revises the amount while a link is outstanding* → the link is superseded and a
  fresh one is offered (`M11-30`, `M11-14`).
- *No account is connected, or the rail is unavailable* → manual collection, one tap, reason
  stated (`M11-31`).
- *Someone asks whether the customer received the link* → on the connected-channel path the
  product reports exactly what that channel reports and no further (`M11-26`, `F5-28`); on the
  copy fallback the product does not know, says so, and no delivery state exists (`M11-26`).
  *(Amended per owner ruling 2026-08-06, Q45; this line previously read "→ the product does not
  know and says so; no delivery state exists (`M11-26`)", stated unscoped.)*
- *Someone asks who chased the customer on a tranche in a tenant with no connected channel* → the
  audit log has nothing to show, because the product performed no send; it does not guess, and no
  compose or copy record was kept (`M11-07` as amended, owner ruling 2026-08-06, Q57).
- *An unpaid tranche tempts someone to hide the customer's progress page* → forbidden outright
  (`M11-32`).

**Acceptance criteria.**
- Given a due tranche in a tenant with a connected account, when a holder opens it, then the due
  row's collect action mints on that tenant's account for the outstanding amount to the minor unit
  — sending the link and its request message from the tenant's connected transactional channel
  where one is connected, and offering the copy where none is — and the copy action is present on
  both paths (`M11-24`, `M11-25`, `M11-26`). *(Amended per owner ruling 2026-08-06, Q45; this line
  previously read "then a "Copy payment link" action is present and mints on that tenant's account
  for the outstanding amount to the minor unit (`M11-24`, `M11-25`)".)*
- Given a minted link in a tenant with a connected transactional channel, when it goes out, then it
  sends from that channel under the transactional template class and that channel's delivery states
  are shown honestly — exactly as it reports them and no further (`M11-26`, `M03-03`, `F5-28`).
- Given a minted link in a tenant with no connected channel, when it is copied, then nothing is
  transmitted by the product and no delivery state appears anywhere on the surface (`M11-26`).
  *(**Closed by owner ruling 2026-08-06, Q45**, which applies owner ruling 2026-08-04 Q33 — whose
  text already named "payment link" — to this module's rows. These two lines replace a single line
  that read "Given a minted link, when it is copied, then nothing is transmitted by the product and
  no delivery state appears anywhere on the surface (`M11-26`)" and carried an **Open — owner
  decision required** annotation: `M11-24`/`M11-26` stated the pre-Q33 manual-only rule while §5
  stated the transactional lane, a contradiction recorded at `docs/prd/registers/conflicts.md` row 10
  and deliberately left unresolved, with the transactional-send path unbuilt for payment links
  specifically. The cells are now amended, the send is built for payment links as for every other
  transactional moment, and the no-delivery-claim discipline binds the copy fallback alone. Money
  settlement is untouched by the ruling: `M11-01` stands, unamended.)*
- Given a holder of project visibility alone — the read-only Sales Executive on their own won deal —
  when they open a due tranche, then the plain request message is theirs to compose, to copy **and
  to send from the tenant's connected official channel**, while no payment-link act is offered to
  them (`F2.M08.project-visibility`, `F2.M11.record-payments`; `M11-26`). *(**Added by owner ruling
  2026-08-06, Q48**, which settled the question §M11.4's permissions block and §6 `M11-Q4` had
  recorded as open: the plain message carries no money instrument, so its send stays in project
  scope; minting and sending a **link** are unchanged and still ride `F2.M11.record-payments`. No
  other line in this block changes, and money settlement is untouched — `M11-01` stands,
  unamended.)*
- Given the plain request message sent from the tenant's connected official channel — including by
  a holder of project visibility alone — when the send completes, then an audit entry records it
  under the name of the person who sent it (`M11-07`, `F2-22`; `F2.M11.send-request-message`).
  *(**Added by owner ruling 2026-08-06, Q52**, which settled the question §M11.4's permissions block
  and §6 `M11-Q5` had recorded as open. The entry records **the send act and its sender** — it is
  not a delivery state and claims none, so `M11-26`'s discipline stands and the copy fallback shows
  no delivery state anywhere. No requirement cell of §M11.4 is amended by this ruling: `M11-24`,
  `M11-26`, `M11-52` and `M11-53` stand exactly as Q45 left them and Q48 left them; the amended cell
  is `M11-07`, in §M11.1. Money settlement is untouched — `M11-01` stands, unamended.)*
- Given the request message on a due tranche in a tenant with **no** connected official channel,
  when it is composed, copied and sent by a person outside the product, then no audit entry exists
  for that act anywhere — no compose record, no copy record, no send record — and no surface states
  or implies that one does (`M11-07` as amended, `F2-22`; `M11-26`). *(**Added by owner ruling
  2026-08-06, Q57**, which settled what §6 `M11-Q6` and `foundations/F2` §6 `F2-Q3` recorded as
  open. The owner took the simpler of the two readings and **no compensating record is added** — no
  compose log, no counter, no timeline entry. The trade is stated at `M11-07`: the same chase is
  attributable when the product sends it and unrecorded when a person does, deliberately. No
  requirement cell of §M11.4 is amended by this ruling — `M11-24`, `M11-26`, `M11-52` and `M11-53`
  stand exactly as Q45 and Q48 left them; the amended cell is `M11-07`, in §M11.1. Money settlement
  is untouched — `M11-01` stands, unamended.)*
- Given a confirmation from the tenant's account, when it is received, then the tranche's receipt
  is written and its state follows the ledger; and given the same confirmation again, when it is
  received a second time, then no second receipt exists (`M11-27`).
- Given a link that has been paid but not yet confirmed, when the tranche renders, then it states
  that confirmation is awaited and does not render as received (`M11-28`).
- Given a confirmation that never arrived, when a user next views the tranche, then reconciliation
  runs and the state matches the tenant's account (`M11-29`).
- Given a tenant with no connected account or an unavailable rail, when a due tranche is opened,
  then manual recording is offered in one tap with the reason stated (`M11-31`).
- Given a project with an overdue tranche, when the customer opens their own surface, then it
  works exactly as it would if nothing were owed (`M11-32`).

**Localization notes.** The request message is the tenant's own template in the tenant's languages
(`M01-55`); the link itself carries the rail's hosted content, which is not a product string;
amounts render through `F3-19`/`F3-20` with their qualifiers intact (`F3-24`). **Analytics
events.** `payment_link_minted` (tranche share), `payment_link_copied`,
`payment_confirmation_received` (source: live | reconciled), `payment_link_superseded` (reason).

### M11.5 — Recording a payment by hand

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M11-33 | **Recording a payment by hand is always available, on every tranche, in every tenant.** It needs no connected account, no link, no action by the customer inside the product, and no market rail — money arrives in this trade in ways a product does not witness, and the product's job is to record it faithfully. | `SRC` — `DOC16.manual-payment-modes` (docs/16 §8: "Tenants without a gateway account: manual payment modes stand"); `DOC07.payment-link-fallback` ("always available, cash is still king in EPC"); `S8.screen.3` (the recording surface itself) | P0 |
| M11-34 | **A payment entry carries: the amount, the mode, a reference, the date it was received, an optional receipt file, and who recorded it.** Those are the fields the ledger keeps; the person recording adds nothing else and no field is silently defaulted. | `SRC` — `DOC04.payments-append-only` (docs/04: mode, "reference + receipt file"); `S8.screen.3` (verbatim, with the market's mode list elided: "Mark received, copy a ready-made request message, record mode …, attach receipt" — the modes named there are the launch market's and are pack data, `F1-42`); actor per `F2-22` | P0 |
| M11-35 | **The mode is validated against the tenant market's payment-mode vocabulary — an open set the pack declares, never a list baked into the product.** Modes render through the pack's display names (`F1-22`); a market that adds or renames a mode does so in its pack. Manual modes are always part of that vocabulary (`F1-18`). | `SRC` — `DOC04.payments-append-only` ("mode validated against the market pack's payment-mode list"); `F1-09`, `F1-18` consumed (open sets; the IN instance is `F1-42`) | P0 |
| M11-36 | **Part payments are first-class: many entries may sit against one tranche, and the tranche's state follows them.** Nothing forces a person to record a single payment per tranche, to round to the tranche's amount, or to wait until the full amount arrives. An entry that *exceeds* what the tranche still owes is equally recordable and the surplus is stated as a surplus against the schedule — never silently absorbed into a row, spread across rows, or rounded away. | `SRC` — `DOC04.tranches-money-path` (`part_received` as a state recomputed from payments); `DOC04.payments-append-only` (the ledger is entries, not one row per tranche); the surplus-visibility clause applies `F8-24`/`F8-12` (consumed) where the source is silent | P0 |
| M11-37 | **The receipt photograph is held on the device until it uploads; the payment entry is not.** A photograph captured in the field is held and uploaded when the connection returns, with its waiting count and a retry shown on the capture screen itself (`F4-21`) — but the money entry is a server write and does not exist until the server accepts it (`M11-06`). The two are never conflated: there is no state in which a payment "exists locally" while its receipt uploads. | `SRC` — `F4-21` consumed (nothing a field user captured is ever unrecoverable; the photo carve-out is owner decision 2026-08-07); `M11-06` (money reaches the server or fails); `DOC04.payments-append-only` (the receipt file is part of the entry) | P0 |
| M11-38 | **A person never types a negative amount.** A recorded payment is money that arrived; a mistake is undone by reversing the entry (`M11.7`), which is the only path that produces a negative row and the only one that keeps the trail intact. | `SRC` — `DOC04.payments-append-only` ("append-only with reversal rows (negative amount + pointer), never edited") — the entry-side consequence of the reversal law | P1 |
| M11-39 | **Recording is refused with an honest reason when it cannot reach the server, and nothing is held.** A person standing in a customer's driveway with no signal is told plainly that the payment cannot be recorded yet — not shown an optimistic tick for a write the server never accepted. | `SRC` — `M11-06` (the money act reaches the server or fails); `F8-36` consumed (honest failure), `F8-35` (never a silent no-op) | P0 |

**Behavior detail.** The recording sheet is one screen: amount (defaulted to the tranche's
outstanding, always editable), mode from the market's vocabulary, reference, received-on date,
receipt attachment, and save. It is reachable from the tranche row on the payments screen and from
the project's money block (`M08-35`'s surface links here rather than duplicating the control), and
it is the *only* place a payment is created — there is no second entry path anywhere in the
product.

Where the amount is less than the outstanding, the tranche moves to part-received and the surface
restates what remains (`M11-36`). Where it is more, the surplus is stated rather than absorbed
(`M11-36`, and the honest resolution is usually a reversal plus a re-record, `M11-46`). Where the
receipt photograph is still uploading, the payment is already recorded and
the receipt shows as attaching — never the reverse (`M11-37`).

Permissions: `F2.M11.record-payments` — EPC Owner · Sales Manager · Project Manager · Finance
(`DOC08.matrix.record-payments`'s payments half; the Project Manager and Finance cells are F2
decision B / `PS-31`). Every recorded payment is an audit entry with its actor (`F2-22`), and the
recorder's name is part of what the receipt states (`M11-42`).

**Edge cases & what-goes-wrong.**
- *No connection at the moment of recording* → refused fast with the reason; nothing queued
  (`M11-39`).
- *The mode the customer used is not in the market's list* → the pack's vocabulary is an open set
  and is extended in the pack, never by free text on this screen (`M11-35`).
- *Several payments against one tranche* → all recorded; the state is part-received until the
  entries cover the amount (`M11-36`).
- *The amount recorded was wrong* → it is not edited; it is reversed and re-recorded (`M11-38`,
  `M11-46`).
- *The receipt photograph fails to upload* → the payment stands; the photograph is held on the
  device and retried, its waiting state shown on the capture screen, and the entry never depends on
  the file (`M11-37`, `F4-21`).
- *A payment arrives for a project with no schedule* → the surface says there is no schedule to
  record against and does not fabricate one (`M11-15`); the honest act is a new proposal version.

**Acceptance criteria.**
- Given a tenant with no connected account, when a holder opens any due tranche, then manual
  recording is available with no precondition (`M11-33`).
- Given a recorded payment, when the ledger entry is read, then it carries amount, mode,
  reference, received-on date, its receipt file where one was attached, and the recording person
  (`M11-34`).
- Given the recording sheet, when the mode field is opened, then the options are exactly the
  tenant market's declared payment modes, rendered with the pack's display names (`M11-35`).
- Given a payment smaller than the tranche's outstanding amount, when it is saved, then the
  tranche is part-received and the remaining amount is stated (`M11-36`).
- Given a receipt file still uploading, when the tranche renders, then the payment is present and
  the attachment shows as in progress (`M11-37`).
- Given no connection, when a payment is recorded, then it is refused with an honest reason and no
  entry exists anywhere afterwards (`M11-39`).

**Localization notes.** Payment-mode display names come from the pack (`F1-22`); amounts and dates
render through `F3`'s single implementations (`F3-19`, `F3-20`); the recording sheet's own copy
translates per `F3`. **Analytics events.** `payment_recorded` (mode, part | full, receipt attached
yes/no), `payment_recording_refused_offline`, `receipt_file_attached`.

### M11.6 — Receipts and confirmation states

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M11-40 | **The payments ledger is append-only: entries are added, never edited, never deleted.** Every payment — hand-recorded or confirmed by the tenant's account — is an entry in one ledger per project, and the schedule's states are readings of it. Nothing in the product exposes an "edit payment" control, and no correction path removes an entry (`M11.7`). | `SRC` — `DOC04.payments-append-only` (docs/04, verbatim: "append-only with reversal rows (negative amount + pointer), never edited"); `DOC16.byo-collections` (confirmations "mark the tranche received and attach the receipt" — they insert here) | P0 |
| M11-41 | **Every entry produces a receipt record, and the receipt is the artefact both sides can hold.** The record carries what was paid, against which tranche of which project, when, by which mode, its reference, its attached file where one exists, and its confirmation state (`M11-42`). It is readable by the tenant on the collections surfaces and by the customer on their own surface (`M11-55`). | `SRC` — `C9` (the customer's requirement, verbatim: "a payment link, then a receipt"; "an instant receipt" is the first of the three anxiety-reducers); `DOC04.payments-append-only` (the receipts ledger); `DOC16.byo-collections` (the confirmation attaches the receipt) | P0 |
| M11-42 | **Money the tenant's account confirmed and money a person says arrived are visibly different things, on every surface.** A confirmed entry states that the tenant's payment account confirmed it; a hand-recorded entry states who recorded it and when. The product never presents a person's claim as a settled confirmation, never upgrades one into the other, and never drops the distinction to make a screen tidier — including in exports, in the customer's rendering and in any spoken text. | `SRC` — the distinction is source-carried: `DOC16.byo-collections` (confirmed by the tenant's account, attaching the receipt) vs `DOC16.manual-payment-modes` / `DOC04.payments-append-only` (a person records mode, reference and receipt); the labelling obligation is `F8`'s honesty family applied here — `F8-24` (a qualifier is never dropped between renderings), `F3-24` (the format layer carries it at every density) | P0 |
| M11-43 | **Collected-against-due is one computed figure, and every surface that shows it shows the same one.** The payments screen, the project's money block, the board card, the owner's dashboard, an export and the customer's rendering are renderings of one value — they never recompute independently, round differently or drop a qualifier the others carry. | `SRC` — `F8-24` consumed (one figure, one source — a disagreement is a defect); `S8.screen.1` (cited — "payment collected vs due" on the card; the surface is `M08-37`'s) | P0 |
| M11-44 | **No money figure here renders as final while stale.** Figures are reconciled against the ledger before display; anything unreconciled is visibly provisional rather than presented as settled fact. There is no export, screen or speed optimisation exempt from this. | `SRC` — `F8-12` consumed (verbatim law: "money must never render as final while stale") | P0 |
| M11-45 | **The receipt is one of the three things that carry the customer through their most anxious moment, and this module owns its half.** The source names them: *"an instant receipt, a named person to contact, and a clear statement of what happens next and when."* This module produces the receipt the instant the money is confirmed or recorded, and publishes it to the customer's surface; the named contact and the what-happens-next line are `foundations/F5`'s rendering of `modules/M08`'s facts. | `SRC` — `C9` (verbatim, the three requirements; shared — the customer-facing rendering is `foundations/F5`'s, Task 20; the source records no "goes wrong" items for `C9`) | P1 |

**Behavior detail.** A receipt is not a document the product designs — it is the ledger entry,
rendered. On the tenant's side it appears in the tranche's row and in the project's payment
history; on the customer's side it appears on their own surface as soon as it exists
(`foundations/F5` renders it). The confirmation-state distinction of `M11-42` rides it everywhere:
two entries of the same amount against the same tranche read differently if one came back from the
tenant's account and the other was typed by a person, because they *are* different claims.

That distinction is the honest core of this module. The product cannot witness cash changing hands
in a customer's driveway; what it can do is record faithfully **who said so and when**, and never
let that read as a settlement it did not observe.

Permissions: reading receipts rides the project scope (`F2.M08.project-visibility`); creating them
rides `F2.M11.record-payments` or arrives as the tenant account's confirmation (`M11-27`). No
surface reachable by the Installation Team Member preset shows any of it (`F2-06`).

**Edge cases & what-goes-wrong.**
- *A hand-recorded entry and a confirmation exist for the same money* → both entries stand and the
  duplicate is corrected by reversal, not by deletion (`M11-40`, `M11-46`); the ledger shows what
  happened.
- *A figure differs between two surfaces* → it cannot; one computed value, one rendering law
  (`M11-43`).
- *An export is asked for "just the totals"* → the qualifiers travel with them; a figure never
  loses its confirmation state or provisional label to fit a column (`M11-42`, `F3-24`).
- *A receipt is requested before confirmation has arrived* → the surface states that confirmation
  is awaited rather than issuing a receipt for money the account has not confirmed (`M11-28`).

**Acceptance criteria.**
- Given any payment, when it is recorded or confirmed, then a ledger entry exists and no control
  anywhere edits or deletes it (`M11-40`).
- Given a ledger entry, when its receipt renders on any surface, then it carries what was paid,
  against which tranche, when, its mode, its reference, its file where attached, and its
  confirmation state (`M11-41`).
- Given one confirmed and one hand-recorded entry of equal amount on the same tranche, when both
  render, then each states its own provenance and neither is presented as the other (`M11-42`).
- Given the payments screen and the project's money block open at once, when both render the same
  project, then collected and due are identical figures (`M11-43`).
- Given a money figure that cannot be reconciled at display time, when it renders, then it renders
  provisional and is not presented as final (`M11-44`).
- Given a confirmed payment, when the customer's surface is opened, then the receipt is already
  there (`M11-45`).

**Localization notes.** Receipt fields render through `F3`'s single money and date implementations
with their qualifiers intact (`F3-19`, `F3-20`, `F3-24`); confirmation-state wording is product
copy translated per `F3`; the customer-facing wording is `foundations/F5`'s. **Analytics events.**
`receipt_created` (confirmation state), `receipt_viewed` (tenant | customer surface),
`collections_figure_rendered_provisional` (surface).

### M11.7 — Corrections: reversals, waivers and cancellation

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M11-46 | **A correction is a reversing entry, never an edit.** Undoing a payment adds a new entry with the opposing amount that points at the entry it reverses, carrying its reason, its actor and its time; the original stays exactly as it was recorded. There is no path in the product that mutates a money row and none that deletes one — this is the same discipline the whole money path runs on. | `SRC` — `DOC04.payments-append-only` (docs/04, verbatim: "append-only with reversal rows (negative amount + pointer), never edited"); `M08-53` (cited — the project-side consequence: reversal is "a reversing entry, never an edit") | P0 |
| M11-47 | **The trail shows the mistake and its correction, and that is the point.** A reversed entry is not hidden, greyed into invisibility or filtered out by default: the history reads as what happened — this was recorded, this was reversed, for this reason, by this person. Totals reflect the reversal; the record reflects the truth. | `SRC` — `DOC04.payments-append-only` (append-only, with the pointer that makes the pair readable); `F2-22` consumed (money events are audited with before/after); `F8` honesty family (a correction is disclosed, never silent) | P0 |
| M11-48 | **A reversal restates the tranche's state by restating its facts.** Because state is derived (`M11-10`), a reversal moves a received tranche back to part-received or due automatically; nobody re-types a status, and no state can survive a reversal that contradicts it. | `SRC` — `DOC04.tranches-money-path` (states "recomputed from payments"); `DOC04.payments-append-only` | P0 |
| M11-49 | **Waiving a tranche is terminal, reasoned, audited — and is never collection.** A waived tranche is written off with a mandatory reason; it leaves the due set, never appears as collected money, and never counts toward a collections figure. Waiving does not delete the tranche, does not alter the accepted version it came from, and does not change any other row's amount. | `SRC` — `DOC04.tranches-money-path` (`waived` as the terminal state); reason-mandatory and audit follow the suite's terminal-state discipline (`R2`'s cancellation precedent, cited; `F2-22` money events) — **the holder set is `F2.M11.waive-tranche`, deliberately not narrowed below the recording set (F2 §F2.5-M11 notes)** | P0 |
| M11-50 | **Cancelling a project does not unwind money, and the platform never performs a refund.** Receipts already taken stay readable on a cancelled project; any money returned to a customer is returned by the tenant, on the tenant's own account, and recorded here as a reversing entry with its reason. The product records refunds; it does not move them (`M11-01`). | `SRC` — `S8.wrong.8` / `R2` as amended (cited — cancellation and its revenue consequence are `M08-51`'s); `M08-53` (cited — "money already received is not unwound by the cancellation itself"); `DOC04.payments-append-only`; `DOC16.byo-collections` (the platform holds no funds to refund) | P0 |
| M11-51 | **Reversal and waiver are money events with named actors, and both are audit entries.** Who reversed, who waived, when, why, and against what — recorded at the moment of the act, never reconstructed afterwards. | `SRC` — `F2-22` consumed (money events, written with the change that caused them); `DOC04.audit-log` (cited — `foundations/F2`) | P0 |

**Behavior detail.** The correction path is deliberately slightly effortful: a reason is required,
the entry being reversed is shown in full while it is confirmed, and the result is two visible
rows rather than one quiet change. That is the honest shape — a money ledger that can be tidied is
a money ledger nobody can trust — and it is the same shape the rest of the suite uses for
survey versions, sign-offs, timelines and audit.

Waiving (`M11-49`) is the one act that removes an expectation of money without money arriving, so
it is stated as its own capability with its own row in the permission matrix. It is **not**
narrowed below the recording set here: the source names the state and is silent on the authority,
and narrowing an authority the source did not narrow would be an owner ruling rather than a module
decision (the precedent is `modules/M08`'s treatment of cancellation). The row exists separately
precisely so such a ruling can land as a cell change rather than a restructure.

Permissions: reversing rides `F2.M11.record-payments` — a reversal is an *append* to the same
ledger by the same holders, not a new authority; waiving rides `F2.M11.waive-tranche`. Both are
audited (`F2-22`, `M11-51`).

**Edge cases & what-goes-wrong.**
- *A payment was recorded twice* → one entry is reversed; both remain visible with the reason
  (`M11-46`, `M11-47`).
- *A payment was recorded against the wrong tranche or the wrong project* → reversed there and
  recorded where it belongs; no entry is moved (`M11-46`).
- *A confirmed payment was later returned by the customer's bank* → recorded as a reversing entry
  with its reason; the tranche's state follows the ledger back (`M11-48`).
- *A customer will genuinely never pay a tranche* → it is waived with a reason, and it never
  appears as collected (`M11-49`).
- *A cancelled project has money against it* (`S8.wrong.8`) → receipts stay readable, the project
  stops counting as revenue immediately (`M08-51`), and any refund is a recorded reversal
  (`M11-50`).
- *Someone wants the ledger "cleaned up" before a review* → there is no mechanism; the trail is
  the record (`M11-40`, `M11-47`).

**Acceptance criteria.**
- Given a recorded payment, when it is corrected, then a reversing entry pointing at it is added
  with a reason and an actor, and the original entry is unchanged (`M11-46`, `M11-51`).
- Given a reversed payment, when the tranche's history renders, then both entries are visible with
  the reason, and the totals reflect the reversal (`M11-47`).
- Given a fully received tranche, when a payment against it is reversed, then its state returns to
  the one the remaining entries imply, with no status typed by anyone (`M11-48`).
- Given a tranche that will not be paid, when it is waived with a reason, then it leaves the due
  set, is never counted as collected, and the act is audited (`M11-49`).
- Given a cancelled project with receipts, when its money surface renders, then the receipts are
  readable and any refund appears as a reversing entry rather than a platform-performed movement
  of money (`M11-50`).

**Localization notes.** Reason text is authored by the person and stored as entered; reversal and
waiver labels translate per `F3`; amounts, including negative entries, render through the single
money implementation (`F3-19`, `F3-20`). **Analytics events.** `payment_reversed` (reason class),
`tranche_waived` (reason class, share), `correction_viewed`.

### M11.8 — The collections surfaces and the customer-side handoff

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M11-52 | **The payments screen is one surface and the only place money is written.** It shows the tranche schedule and, per row, the state, the amount, the date and the receipt; on the due row it carries the collect actions — the payment link where an account is connected, sent from the tenant's connected transactional channel where one exists and copied for a person to send where none is (`M11-24`, `M11-26`, owner ruling 2026-08-06, Q45), the request message always, and record-payment. Every other surface in the product links into it rather than duplicating a control — **with one carve-out: the project's money block mirrors the message act on its due row** (`M08-35`'s behavior detail; `M08-38` as reconciled — sent from the connected channel where one exists, ready-to-paste where none is), because composing, sending and copying a message writes no money; every act that *writes* money exists only here *(Final review: carve-out stated so the law matches the conceded surface)*. *Amended per owner ruling 2026-08-06, Q45: the collect-actions clause previously read "the payment link where an account is connected, the ready-to-paste request message always, and record-payment", and the carve-out previously read "the project's money block mirrors the copy-message action on its due row (`M08-35`'s behavior detail), because composing and copying writes no money". The one-surface law, the carve-out's existence and the money-writing boundary are unchanged — the ruling automates the message, never the money (`M11-01`).* | `SRC` — `S8.screen.3` (verbatim, with the market's mode list elided: "Payments: the tranche schedule. Mark received, copy a ready-made request message, record mode …, attach receipt" — the modes named there are the launch market's and are pack data, `F1-42`); `M08-35`'s behavior detail (cited — the project money block links here); `M08-38` (cited — the project-side request act, already reconciled to owner ruling 2026-08-04 Q33); the send is owner ruling 2026-08-06 (Q45) | P0 |
| M11-53 | **An unpaid due tranche is chased through a person, and the product's job is to make it impossible to miss.** It surfaces on the project, on the stage board and on the owner's dashboard (`modules/M08`, `modules/M13` own those surfaces; this module supplies the facts), and the rep is prompted to chase. The prompt leads to a message — sent from the tenant's connected transactional channel where one exists and composed for a person to send where none is (owner ruling 2026-08-06, Q45; `M11-26`) — never to a product-side sanction against the customer (`M11-32`). *This clause previously read "The prompt leads to a message a person sends — never to a product-side sanction against the customer (`M11-32`)"; the pre-Q33 manual-only half is retired and the never-sanction half is unchanged. The chase is still a person's decision: the product prompts and the person acts.* | `SRC` — `S8.wrong.3` (shared — the money half here: what is owed, since when, and the chase prompt; the board/dashboard surfaces are `M08-39`'s); `S8.rule.tranches` (the money owed against a passed milestone is "the most common leak"); the message's send path is owner ruling 2026-08-06 (Q45) applying owner ruling 2026-08-04 (Q33) — `M11-26` | P0 |
| M11-54 | **Finance's home is money due.** Tranches due now and overdue by project, receipts waiting to be recorded, and the period's collections against what was expected — every figure obeying the money-never-stale law. The composition of the home screen is `modules/M13`'s; the facts, states and figures it composes are this module's. | `BRIEF` — `PS-32` (`02-personas.md`, the Finance persona's home; `_process/owner-brief-2026-08-03.md` §Users) · grounded in source at `S8.rule.tranches`, `S8.wrong.3`, and the money-never-stale law (`F8-12`, `S6.wrong.1`) | P1 |
| M11-55 | **What this module publishes to the customer's surface, and nothing more:** the due tranche's label and amount, its payment link where one has been minted, the receipts with their confirmation states, and the fact that nothing here may gate the page. `foundations/F5` renders every word the customer reads, decides the page's shape, and owns the token and its lifecycle; this module supplies facts and never copy. | `SRC` — `C9` (shared — the customer's payment-and-receipt moment; F5 owns the rendering, Task 20); `UXG-12` (shared — the tenant-side half of the payment-link handoff is this module's; the question-inbox half is `foundations/F6`/`F5`'s); `DOC02.link-grant` (cited — F5: the link's scopes include paying a tranche via the tenant's own link) | P0 |
| M11-56 | **No commercial figure from this module reaches a surface that must not carry one.** Nothing in the tranche schedule, the ledger or the collections views may appear on any surface the Installation Team Member preset reaches — a property of the surface, not of the viewer. | `SRC` — `F2-06` consumed (verbatim law); `R16` ("crew sees no money"); `M08-43` (cited — the surface-side statement) | P0 |

**Behavior detail.** The payments screen is where an EPC's collections actually get worked, so it
is dense and it is honest: schedule rows in stage order, states as label-plus-mark (`F7-12`), the
due row lifted, the ledger beneath, and reversal pairs shown as pairs. It is reachable from the
project (`M08-35`) and from Finance's own home (`M11-54`); it is the same screen in both places.

**The chase is a human act.** `S8.wrong.3` is the module's most cited rule for a reason: the
product makes the debt visible in three places and prompts a person, and it does exactly nothing
to the customer. There is no gate, no lock, no withheld document, no revoked link. The message is
composed from the tenant's template (`M01-55`) with the project's real figures (`M08-38`); where
the tenant has a connected transactional channel it sends from that channel and that channel's
delivery states are shown as it reports them and no further, and where none is connected the
product hands it over and forgets it (owner ruling 2026-08-06, Q45; `M11-26`, `M03-03`).
*(This sentence previously read "The message a person sends is composed from the tenant's template
(`M01-55`) with the project's real figures (`M08-38`); the product hands it over and forgets it
(`D32`)". The chase remains a human act — what changed is the carriage of the message, not who
decides to chase and not anything done to the customer.)*

**The customer-side handoff.** `foundations/F5` is being authored next (Task 20) and this module
states its side of the contract now: the facts above, published as facts, with the receipt
appearing the moment it exists (`M11-45`) and the never-gate law travelling with them (`M11-32`).
`C9`'s other two anxiety-reducers — a named person to contact, and what happens next and when —
are composed by F5 from `modules/M08`'s project facts, not by this module.

Permissions: as §M11.1's permissions block; reading rides `F2.M08.project-visibility` (Finance's
cell is this money scope) and the money acts ride `F2.M11.record-payments` / `F2.M11.waive-tranche` /
`F2.M11.connect-gateway`. The chase message of `M11-53` is not a money act: composing it, copying it
and sending it from the tenant's connected official channel ride the reader's own project scope
(`F2.M11.send-request-message`, owner ruling 2026-08-06, Q48; §M11.4's permissions block). **It is
not a money act and it is still an audited one:** the send is written to the audit log under the
name of the person who sent it (owner ruling 2026-08-06, Q52; `M11-07`, `F2-22`), because the
message leaves the tenant's own official channel and reaches a customer about money. *(The
chase-message sentence is Q48's; this paragraph previously read "the acts ride
`F2.M11.record-payments` / `F2.M11.waive-tranche` / `F2.M11.connect-gateway`" and named no scope for
the message at all. The audit sentence is Q52's, and before it this paragraph made no audit claim
for the send; who may send is unchanged by it.)* **Where no channel is connected the chase leaves no
record (owner ruling 2026-08-06, Q57):** the message is composed and copied, the person sends it
outside the product, and no entry is written — the log holds what the product performed, so the same
chase is attributable on one path and unrecorded on the other, deliberately (`M11-07` as amended,
`M11-26`). *(That sentence is Q57's; before it this paragraph stated the audit obligation without
its boundary, the question standing open at §6 `M11-Q6`.)*

**Edge cases & what-goes-wrong.**
- *The customer is not paying a due tranche* (`S8.wrong.3`) → visible on the board, the project and
  the owner's dashboard; the rep is prompted to chase; the customer's own page keeps working
  exactly as before (`M11-53`, `M11-32`).
- *Someone proposes withholding the handover pack or the progress page until payment* → forbidden;
  no state in this module may be wired to a customer-facing gate (`M11-32`).
- *An installation surface is asked to show "just the balance"* → refused by construction
  (`M11-56`).
- *The customer asks for a receipt the tenant has not recorded* → the surface shows what exists;
  nothing is generated to satisfy the question (`M11-15`, `M11-42`).

**Acceptance criteria.**
- Given a project with a schedule, when the payments screen renders, then it shows every tranche
  with its state, amount, date and receipt, and the due row carries the collect actions
  (`M11-52`).
- Given an overdue tranche, when the board, the project and the owner's dashboard render, then it
  is visible on each with what is owed and since when, and a chase prompt is offered (`M11-53`).
- Given a Finance user, when their home renders, then it shows due, overdue, receipts awaiting
  recording and the period's collections, each obeying the freshness law (`M11-54`).
- Given a confirmed or recorded payment, when the customer's surface renders, then the receipt and
  its confirmation state are available to it and no state in this module gates the page
  (`M11-55`, `M11-32`).
- Given any surface the Installation Team Member preset reaches, when it renders, then no tranche,
  receipt, price or other commercial figure appears (`M11-56`).

**Localization notes.** All figures through `F3-19`/`F3-20` with qualifiers intact (`F3-24`); the
chase message is the tenant's template in the tenant's languages (`M01-55`); the customer-facing
words are `foundations/F5`'s. **Analytics events.** `payments_screen_viewed`,
`overdue_tranche_chase_prompted`, `finance_home_viewed`, `collections_period_view_opened`.

## 4. Cross-module contracts

**This module provides:**

- **To `modules/M08-projects.md`** — the tranche states and their transitions (`M11-10`,
  `M11-11`), the collected-versus-due figure its board and detail render (`M11-43`), the payments
  screen its money block links into (`M11-52`), the reversal mechanism its cancellation behaviour
  cites (`M11-46`, `M11-50`), and the money facts behind its unpaid-tranche surfaces (`M11-53`).
  M08 owns the stage event, the board and the project-side display; this module owns the money.
- **To `foundations/F5-customer-link.md`** (Task 20) — the due tranche's label and amount, the
  payment link where minted, the receipt records with their confirmation states (`M11-41`,
  `M11-42`), and the binding law that no collections state may gate the customer's page
  (`M11-32`). F5 writes every word the customer reads.
- **To `modules/M13-dashboards-and-reporting.md`** (Task 23) — collections figures, ageing of due
  and overdue tranches, and the period-versus-expected view (`M11-54`); each already carrying its
  freshness and confirmation qualifiers, which a dashboard may not drop.
- **To `foundations/F6-notifications-and-search.md`** (Task 23) — the events worth notifying: a
  tranche became due, a payment was confirmed, a payment was reversed, a collections credential
  started failing. The `payment_due` type already exists in the full enum (`DOC04.notification-types`).
- **To `modules/M01`** — the collections-connection state its credential surface displays
  (`M01-60`), and nothing else; M01 owns the credential screen, this module owns the connect flow
  and the consequences of a failing connection.

**This module expects:**

- **From `modules/M06-proposals.md`** — the accepted version's payment terms as generated, summing
  to exactly 100.00, with the version in force identified (`M06-13`, `M06-45`). This module never
  authors terms and never edits them.
- **From `modules/M01-onboarding-and-tenant-config.md`** — the named tranche templates and the
  tenant default (`M01-54`), the request-message templates (`M01-55`), and the credential surface
  and its probe (`M01-60`).
- **From `modules/M08-projects.md`** — the stage-completion event that makes a tranche due
  (`M08-36`), the project's identity and its cancellation state (`M08-51`), and the project-side
  surfaces that display money without owning it.
- **From `foundations/F1`** — the market's payment-mode vocabulary and rails (`F1-18`; the IN
  instance `F1-42`, `F1-43`), the currency's minor unit and formats (`F1-21`), and display labels
  (`F1-22`).
- **From `foundations/F2`** — §F2.5-M11's rows, the projects visibility domain this module reads
  through (`F2.M08.project-visibility`) — which is also the scope the compose, copy and **send** of
  the plain request message ride, carried at §F2.5-M11 as `F2.M11.send-request-message` since owner
  ruling 2026-08-06 (Q48) — the no-commercial-figures law (`F2-06`) and the audit checklist
  (`F2-22`), **which since owner ruling 2026-08-06 (Q52) names that send among its covered events
  and records it under the sender's name** — **and which, since owner ruling 2026-08-06 (Q57),
  covers that send alone: the copy-paste fallback writes nothing to the log** (`M11-07`). *(The
  `F2.M11.send-request-message` clause is Q48's; this line previously named the domain alone, and
  §F2.5-M11 carried no row for the send — that absence is what raised the question closed at §6
  `M11-Q4`. The checklist clause is Q52's; before it this line expected `F2-22` whole but no covered
  event for the send, the question standing open at §6 `M11-Q5`. The boundary clause is Q57's;
  before it this line expected the covered event without its edge, the question standing open at §6
  `M11-Q6`.)*
- **From `foundations/F4`** — the server owns every money figure (`F4-04`), a retried submission
  never duplicates and never drops (`F4-07`), and nothing a field user captured is ever
  unrecoverable — the receipt photograph's carve-out (`F4-21`).
- **From `foundations/F8`** — the honesty laws every figure here obeys (`F8-12`, `F8-13`, `F8-15`,
  `F8-23`, `F8-24`).
- **From `modules/M12-platform-billing.md`** — nothing. The boundary is the contract (`M11-02`).

## 5. Non-goals

- **The platform never holds, routes, splits or takes a share of tenant funds — not as a feature,
  not as an option, not as an experiment.** v1 rationale, carried from the source: doing so would
  make the platform a regulated money-handler in its market, with the licensing and custody
  obligations that follow (`DOC16.byo-collections`, `DOC01.byo-collections`, `M11-01`).
- **Split settlement with the platform as master merchant is excluded.** Recorded as a documented
  alternate rail adapter only. Revisit trigger, from the source: *only if a marketplace revenue
  model appears* (`DOC16.route-rejected`, `M11-04`).
- **No cut of customer payments.** The rival model that takes a percentage of collections is a
  deliberate competitive skip, not an unbuilt feature (`CG-5`, `CG-matrix.18`, `M11-03`).
- **No recurring billing engine, no meter ingestion, no periodic invoicing of a tenant's
  customer.** Explicitly ruled out for v1; the commercial document type exists without it, and
  such a project's money surface is `M11-16`'s ruled behaviour — one-time payments from the
  accepted version plus the honest outside-platform note (owner ruling 2026-08-04, Q32; `R17`).
- **No tax document generation for the tenant's own customers.** The market's tax scheme shapes the
  proposal's money block (`modules/M06`, `F1-13`/`F1-31`); issuing a tenant's statutory customer
  invoice is not a v1 capability of this module, and the platform's own statutory invoicing is
  `modules/M12`'s entirely (`M11-02`).
- **No credit, financing, instalment or lending mechanics.** Financing options render on the
  proposal as representative terms (`modules/M05`, `modules/M06`); originating, scoring, servicing
  or collecting credit is not in this product.
- **No collections automation that acts on the customer.** No automatic dunning of a tenant's
  customer, no automated escalation, no service withdrawal, and above all no gating of the
  customer's own page (`M11-32`, `S8.wrong.3`). The product prompts a person; the person acts.
  *(Scope note, owner ruling 2026-08-06, Q45 — this bullet is not retired by it. Where the
  person's act is minting a payment link on a due tranche, the message carrying it now sends on
  the transactional lane (`M11-24`, `M11-26`): that automates the carriage of a person's act and
  creates no automatic dunning, no escalation, no repetition and no withdrawal, each of which
  remains forbidden here.)* *(Scope note, owner ruling 2026-08-06, Q48 — this bullet is not
  retired by that ruling either. Q48 settles **whose** act the send of the plain request message
  is — anyone with project visibility, the message carrying no money instrument (§M11.4's
  permissions block, `F2.M11.send-request-message`) — and says nothing about the product acting on
  its own. Every prohibition above is unchanged: still no automatic dunning, no escalation, no
  repetition, no service withdrawal and no gating of the customer's page.)*
- **No fabricated delivery state.** Payment links and request messages ride the transactional
  lane — sent from the tenant's connected channel where one exists, composed for a person where
  none is (owner ruling 2026-08-04, Q33; `M03-03`); on the fallback path there is no delivery
  state on any collections surface (`D32` governs that path; `M11-26`). *(Bullet text unchanged.
  The divergence between this bullet and `M11-24`/`M11-26`, recorded at
  `docs/prd/registers/conflicts.md` row 10, is **closed by owner ruling 2026-08-06, Q45**: those cells
  now state the same two-branch rule this bullet has stated since Q33, and the no-delivery-claim
  discipline binds the copy fallback alone.)* *(Scope note, owner ruling 2026-08-06, Q52 — this
  bullet is not retired by that ruling either. Q52 makes the **send** of the plain request message
  an audited event recorded under the sender's name (`M11-07`, §M11.4's permissions block): an audit
  entry records **who sent what and when**, which is an act record, never a delivery state and never
  evidence that a message arrived. The copy fallback still carries no delivery state on any
  collections surface, and no surface may render an audit entry as one.)* *(Scope note, owner ruling
  2026-08-06, Q57 — this bullet is not retired by that ruling either, and Q57 runs with it rather
  than against it. Q57 confines the audited act to the send from the connected channel: on the
  fallback path the product performs nothing and records nothing — no compose record, no copy
  record, no send record, no counter — so there is no entry on that path that any surface could
  mistake for a delivery state. Nothing on the fallback path is claimed, rendered or counted.)*
- **No offline money.** Not a deferral — a boundary (`M11-06`).
- **No editing or deletion of money records.** Corrections exist only as reversals
  (`DOC04.payments-append-only`, `M11-46`).

## 6. Open questions

- **M11-Q1 — RESOLVED (owner ruling 2026-08-04, Q32).** The money surface of an
  operating-expense or power-purchase project is the **one-time payments from the accepted
  version** (deposit / connection fee) with the **full tranche toolset**, plus the honest note
  **"monthly energy billing is handled outside this platform"** — nothing fabricated, nothing
  hidden (`M11-16`, now final; `modules/M08` §M08.6 clause for clause, so the two modules
  cannot drift). No recurring billing, no periodic charge, no meter ingestion (`R17`,
  unchanged). Q29 (the type is ungated on every tier) resolved in the same session.
- **M11-Q2 — selling collections capability into a market with no supplier-of-record decision**
  (register **Q7**, already open — recorded here as a dependency, not re-opened). No market pack
  beyond the launch market is launchable until that owner-blocked decision exists; this module's
  rail-neutrality (`M11-05`, `M11-20`) is written so that the answer, when it comes, is a pack and
  adapter matter rather than a change to any requirement here. *Decision owner: Owner
  (`foundations/F1` `F1-05`, `F1-26`).*
- **M11-Q3 — RESOLVED (owner ruling 2026-08-06, Q45).** The payment link on a due tranche
  **sends automatically from the tenant's connected official channel** (WhatsApp/SMS,
  transactional template class), with **composed copy-paste as the fallback where no channel is
  connected** — and only that fallback path claims no delivery. The ruling applies owner ruling
  2026-08-04 Q33, whose text already named "payment link", to this module's rows: `M11-24`,
  `M11-26`, `M11-52` and `M11-53` are amended (each recording what it previously said), §M11.4's
  acceptance block now carries both branches in place of the line annotated **Open — owner
  decision required**, and the contradiction recorded at `docs/prd/registers/conflicts.md` row 10 —
  the pre-Q33 cells against this document's §5 — is closed. **Money settlement is untouched:**
  `M11-01` stands unamended, the platform never touches tenant funds, collections settle directly
  customer → the tenant's own account, and §5's funds and no-cut bullets are unchanged. Only the
  message is automated.
- **M11-Q4 — RESOLVED (owner ruling 2026-08-06, Q48).** The *send* of the **plain request
  message** from the tenant's connected official channel **stays in project scope**: it remains
  available to anyone with project visibility (`F2.M08.project-visibility`), because the plain
  message carries no money instrument, and because keeping it there preserves the case the PRD
  explicitly wanted — a read-only Sales Executive chasing their own won deal (`S8.wrong.3`,
  `M08-18`). **Minting and sending an actual payment LINK is unchanged** and still requires
  `F2.M11.record-payments`, a link being a live collection instrument. Applied at: §M11.4's
  permissions block and its acceptance block (a new criterion for the project-scope holder), §2's
  Sales Executive persona bullet, §M11.8's permissions paragraph, §4's `foundations/F2`
  expectation, and `foundations/F2` §F2.5-M11, which now carries the row whose absence raised this
  question — `F2.M11.send-request-message`, its cells the project-visibility domain's — with
  `docs/tasks/M11-payments-collections.md` (T-M11-002, T-M11-016 and the `M11-26` law entry) and
  `docs/ux/briefs/SCR-M11-02-payments-ledger.md` (its annotation and its **reader-read-only** state)
  re-synced. **No requirement cell of §M11.4 is amended by this ruling** — `M11-24`, `M11-26`,
  `M11-52` and `M11-53` stand exactly as Q45 left them — and money settlement is untouched:
  `M11-01` stands unamended, the platform touches no tenant funds. *(This entry previously read:
  "**M11-Q4 — NEW, raised by applying Q45 and deliberately not decided here: whose act is the
  *send* of the plain request message?** §M11.4's permissions block gives minting, sending and
  re-copying a **payment link** to `F2.M11.record-payments` because a link is a live collection
  instrument, and gives the **plain request message**, which carries no instrument, to the
  reader's project scope (`F2.M08.project-visibility`) — which is what lets the read-only Sales
  Executive chase their own won deal (`S8.wrong.3`, `M08-18`). Q45 settled that the message
  sends; it did not state whether *sending from the tenant's own official channel* stays inside
  that reader scope or needs its own holder set, and `foundations/F2` §F2.5-M11 carries no row
  for it. Recorded, not resolved: no surface, task or brief in this module decides it, and the
  reader's compose-and-copy act is unchanged in the meantime. *Decision owner: Owner (with
  `foundations/F2`).*")*
- **M11-Q5 — RESOLVED (owner ruling 2026-08-06, Q52).** The *send* of the **plain payment-request
  message** from the tenant's connected official channel **is an audited event, and the entry is
  recorded under the name of the person who sent it** — for every holder of
  `F2.M11.send-request-message`, the project-visibility-only reader such as a Sales Executive
  chasing their own won deal (Q48) included. The rationale the owner accepted: the message leaves
  the company's official channel and reaches a customer about money, which is exactly what the
  audit log exists for, and the record answers "who messaged my customer?" instantly. Composing and
  copying write no entry; the send is the audited act, and the entry records **the act and its
  sender** — it is not a delivery state and claims none (`M11-26`, §5's no-fabricated-delivery-state
  bullet, both unchanged). Applied at: `M11-07` (the module's audit row, amended — recording what it
  previously said), §M11.1's acceptance block, §M11.4's permissions block and acceptance block,
  §M11.8's permissions paragraph, §4's `foundations/F2` expectation, §5's
  no-fabricated-delivery-state scope note, and `foundations/F2` — `F2-22`'s covered-events cell
  (amended), §F2.4's acceptance block, §F2.5-M11's `F2.M11.send-request-message` row and its notes,
  closing `foundations/F2` §6 `F2-Q2` — with `docs/tasks/M11-payments-collections.md` (T-M11-002,
  T-M11-009, T-M11-016 and the `M11-26` law entry) and
  `docs/ux/briefs/SCR-M11-02-payments-ledger.md` re-synced. **No permission cell moves and no grant
  changes** (Q48's holder set stands), and money settlement is untouched: `M11-01` stands unamended,
  the platform touches no tenant funds. *(This entry previously read: "**M11-Q5 — NEW, raised by
  applying Q48 and deliberately not decided here: is the *send* of the plain request message an
  audit-covered event, and with whose name?** Q48 puts an outbound message from the tenant's **own
  registered official channel** — addressed to a customer and stating what is owed — inside a
  **read-only** preset's project scope. `F2-22`'s covered-events checklist does not name a
  payment-request send (it names money events, link mint/re-mint/revoke and customer-link opens),
  and §M11.4's permissions block audits **link mints** only. So the product now performs an outbound
  act in the tenant's name for a holder who writes no money, and no document states whether that act
  is written to the audit log with its actor. The ruling did not address it. Recorded, not resolved:
  nothing in this module, its tasks or its briefs decides it; the reader's send is available per Q48
  in the meantime, and no audit claim is made for it anywhere. *Decision owner: Owner (with
  `foundations/F2` — `F2-22`'s checklist is where the answer lands, as a cell edit).*" The answer
  landed exactly where that entry said it would — as a cell edit to `F2-22`, reciprocated at
  `M11-07`.)*

- **M11-Q6 — RESOLVED (owner ruling 2026-08-06, Q57).** On the copy-paste fallback path **no record
  is written at all, and none is added**: the audit log records what the *product* performed, Q52
  audits the send where the product sends from the tenant's connected official channel, and where no
  channel is connected the product only composes the message and places it on the clipboard while a
  person sends it outside the product. **No compose record, no copy record, no send record — and no
  compensating counter, timeline entry or chase marker either.** The owner's words: *"hey keep as
  much as simple. and dont do overengineering."* The consequence is accepted and recorded rather
  than engineered around: the same chase, to the same customer, about the same tranche, is
  attributable when the product sends it and unrecorded when a person does — a deliberate
  simplification, consistent with the standing law that the product never claims what it did not do
  (`M11-26`, §5's no-fabricated-delivery-state bullet, both unchanged). Applied at: `M11-07` (the
  module's audit row, amended — recording what it previously said), §M11.1's acceptance block,
  §M11.4's permissions block, its edge cases and its acceptance block, §M11.8's permissions
  paragraph, §4's `foundations/F2` expectation, §5's no-fabricated-delivery-state scope note, and
  `foundations/F2` — `F2-22`'s covered-events cell (amended), §F2.4's acceptance block, §F2.5-M11's
  `F2.M11.send-request-message` row and its notes, closing `foundations/F2` §6 `F2-Q3` — with
  `docs/tasks/M11-payments-collections.md` (T-M11-002, T-M11-009, T-M11-016 and the `M11-26` law entry)
  and `docs/ux/briefs/SCR-M11-02-payments-ledger.md` re-synced. **No permission cell moves, no grant
  changes and no covered event is added** (Q52's clause is bounded, not widened), and money
  settlement is untouched: `M11-01` stands unamended, the platform touches no tenant funds. *(This
  entry previously read: "**M11-Q6 — NEW, raised by applying Q52 and deliberately not decided here:
  on the copy-paste fallback path the log says nothing — should the composed-and-copied request
  message leave any record?** Q52 makes the **send from the tenant's connected official channel** an
  audited event under the sender's name, and the reason the owner gave is that it answers "who
  messaged my customer?" instantly. That answer exists only where a channel is connected. Where none
  is — `M11-26`'s fallback, which `M11-21` keeps first-class because the connected account is an
  accelerator and never a dependency — the product composes and copies, the person sends outside the
  product, and, the **send** being the audited act, no entry is written at all. The same chase, to
  the same customer, about the same tranche, is therefore attributable on one path and invisible on
  the other. Whether the fallback's compose-or-copy act should itself be recorded — as an act record
  naming who took it and against which tranche, **never** a delivery claim, which `M11-26` and §5
  forbid absolutely — or whether the log is deliberately silent where the product performed nothing,
  is not settled: Q52 addressed the connected-channel send only. Recorded, not resolved: nothing in
  this module, its tasks or its briefs decides it; no record is written on the fallback path in the
  meantime, and no delivery, attribution or receipt claim is made for it anywhere. The answer lands
  as a cell edit to `F2-22` and to `M11-07`. *Decision owner: Owner (with `foundations/F2`);
  mirrored at `foundations/F2` §6 `F2-Q3`.*" The owner took the second of its two candidate
  readings, and the answer landed exactly where that entry said it would — as a cell edit to
  `F2-22`, reciprocated at `M11-07`. The behaviour it described for the meantime is now the ruled
  behaviour.)*

**Recorded readings, deliberately not raised as questions.** Two rules in this module are author
readings where the source is silent, and both are disclosed in their rows rather than left to
inference: the skipped-stage tranche (`M11-12`, reciprocating `M08-36`'s inference — the
alternative reading is named in the row) and the supersession of a payment link whose amount no
longer matches what is owed (`M11-30`, derived from `F8-12`/`F8-24`). Neither contradicts any
source statement, and both are stated so an owner can overturn them by ruling on a single
requirement.
