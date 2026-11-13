# M11 · Payments & Collections — engineering tasks

This file carries what is left of the tenant's own collections after block 5 shipped them: `T-M11-015`, built in block 8 with the customer link (`docs/build-order.md`), and the laws every collections surface keeps. Task ids in this file use the prefix `T-M11-`. Source doc: `docs/prd/modules/M11-payments-and-collections.md` (rows `M11-01`–`M11-56`). There is no payment gateway (owner ruling 2026-11-11): the customer pays the company's own UPI ID or bank, and a person records the payment; the rows that only a gateway would work are marked dropped in the Disposition index.

### T-M11-015 · Publishing receipts and payment facts to the customer surface
**Type:** integration · **Tier:** P0
**Status:** planned
**PRD rows:** M11-45, M11-55
**Design:** none — supplies facts to SCR-F5-02, drawn by T-F5-002
**Why:** the customer sees their receipt and how to pay the next part on the same link, the moment the company records a payment — so they stop asking "did you get my money?"
**Depends on:** T-F5-006
**Requirements (verbatim):**
- **M11-45** (P1) — **The receipt is one of the three things that carry the customer through their most anxious moment, and this module owns its half.** The source names them: *"an instant receipt, a named person to contact, and a clear statement of what happens next and when."* This module produces the receipt the instant the money is confirmed or recorded, and publishes it to the customer's surface; the named contact and the what-happens-next line are `foundations/F5`'s rendering of `modules/M08`'s facts.
- **M11-55** (P0) — **What this module publishes to the customer's surface, and nothing more:** the due tranche's label and amount, its payment link where one has been minted, the receipts with their confirmation states, and the fact that nothing here may gate the page. `foundations/F5` renders every word the customer reads, decides the page's shape, and owns the token and its lifecycle; this module supplies facts and never copy.
This task builds the fact-supply half only. The customer-facing rendering is SCR-F5-02, owned by the F5 task file, not by this one.
No payment link is ever minted: there is no gateway (owner ruling 2026-11-11). The facts supplied are the due part's label and amount, how to pay it (the company's UPI ID and bank, as block 5's pay request carries them), and the receipts.
Block 5 made the receipt — as text and as a PDF in the customer's language, kept against the payment; this task hands it to the customer's surface.
**DONE WHEN:**
- Given a confirmed payment, when the customer's surface is opened, then the receipt is already there (`M11-45`).
- Given a confirmed or recorded payment, when the customer's surface renders, then the receipt and its confirmation state are available to it and no state in this module gates the page (`M11-55`, `M11-32`).
- *(With no gateway every payment is recorded by a person, so "confirmed" above reads "recorded" and the one state supplied is* recorded *(owner ruling 2026-11-13, `F5-59`).)*

**Settle before the build:**
- The receipt that is "already there" — ruled (owner ruling 2026-11-13): the surface reads the text receipt (`paymentReceiptSchema`) at once, and recording a payment starts its PDF, so the customer never meets an empty receipt while the PDF is made.
- The handover checklist — ruled (owner ruling 2026-11-13): a project's first recorded receipt is the proof of its checklist's advance-receipt row (`M08-46`), so nobody uploads a file the product already holds.

## Laws (enforced through screens and review, no standalone build)

- **M11-01** (P0) — **The platform never touches tenant funds — the load-bearing law of this module.** Every collection settles directly from the customer to the tenant's own account; links are minted on that account and money lands in that account's bank settlement. No product behaviour may hold, route, escrow, net, split, delay or take a share of a tenant's collection, and no future feature may quietly acquire the ability. This is a licensing boundary, not a design preference: a product that handled other people's money would need the money-handling licence its market requires, and the whole collections design exists to stay outside that (`F1-18`, `F1-43` for the market instance). — *Enforced by:* the collect sheet asking only for payment to the tenant's own UPI ID or bank (no gateway, owner ruling 2026-11-11), refunds recorded rather than moved, and review of every flow in this file; its acceptance line: Given any collection in the product, when it settles, then it settles from the customer to the tenant's own account and no platform-held balance exists at any point (`M11-01`).
- **M11-02** (P0) — **Two money systems that never mix, and this module is only one of them.** The tenant's customers paying the tenant is this module; the tenant paying the platform is `modules/M12`. No surface here shows a subscription figure, no total here includes one, no export here mixes them, and the two keep separate vocabularies — *collections, tranches, receipts* here; *subscription, invoice, plan* there. **The EPC's customer never pays the platform anything.** — *Enforced by:* content review of every surface in this file (T-M11-001…T-M11-004) against their briefs; its acceptance line: Given a collections surface, when it renders, then no platform-subscription figure appears on it and no total on it includes one (`M11-02`).
- **M11-03** (P0) — **The product takes no share of any tenant collection, ever.** No percentage, no per-transaction fee, no float, no "powered by" surcharge on money the EPC collects. This is a deliberate competitive skip and it is recorded as one: the rival model that takes a cut of customer payments is exactly what the never-touch-funds law forecloses, and the product's revenue comes from subscription alone (`modules/M12`). — *Enforced by:* the UPI request asking for exactly what the part still owes and for nothing else, the one money path from the schedule, and review that no fee, share or surcharge exists in any collections arithmetic; its acceptance line: Given a completed collection of any amount, when the tenant's settlement is examined, then the product has deducted nothing from it (`M11-03`).
- **M11-04** (P0) — **Split settlement with the platform as master merchant is rejected for v1, and the rejection carries its trigger.** The alternative — the platform as the account of record, splitting each collection — is documented as an alternate rail adapter and nothing more, because it would make the platform the licence-bearing merchant with the obligations that follow. Revisit only if a marketplace revenue model appears (§5). — *Enforced by:* no gateway or rail adapter existing at all (owner ruling 2026-11-11), and review of any proposed rail against `docs/prd/modules/M11-payments-and-collections.md` §5; its acceptance line: Given a tenant setting up collections, when the available arrangements are read, then no split-settlement or platform-as-master-merchant arrangement is offered anywhere in the product, and the alternative exists only as a recorded non-goal with its revisit trigger (`M11-04`, §5).
- **M11-21** (P0) — **The connected account is an accelerator, never a dependency — stated as law because the temptation runs the other way.** No collection, receipt, tranche state, document, handover or customer surface may be made conditional on a tenant having connected an account. *"Cash is still king"* in this trade, and the product that assumes otherwise is wrong about its market. — *Enforced by:* recording by hand with no precondition, and no gateway to connect (owner ruling 2026-11-11), and review that no gate anywhere reads connection state; its acceptance line: Given a tenant with no connected account, when they work any collections surface, then every capability except link-minting is available and nothing is blocked (`M11-20`, `M11-21`).
- **M11-26** (P0) — **The payment link and its request message send from the tenant's connected transactional channel; composed copy-paste is the fallback where no channel is connected (owner ruling 2026-08-06, applying owner ruling 2026-08-04).** Where the tenant has a connected official channel — the same connection `modules/M03` establishes — the minted link and its composed request message go out from that channel under the transactional/utility template class (`M03-03`), and that channel's own delivery states ride the sent message honestly: exactly as it reports them and no further (`F5-28`). Where no channel is connected, the link is placed on the clipboard (with the request message where the person wants both) and the rep or coordinator sends it through whatever channel they already use — and **only that fallback path claims no delivery**: no delivery state appears anywhere on the surface for it, because the product will not claim knowledge of a delivery it did not perform. **Only the message is automated.** Money is untouched by this row: collections still settle directly from the customer to the tenant's own account and the platform touches no funds (`M11-01`, unamended). *This row previously read, in full: **The product composes and copies; a person sends.** There is no send capability here and no delivery state anywhere on the surface: the link is placed on the clipboard (with the request message where the person wants both) and the rep or coordinator sends it through whatever channel they already use. The product will not claim knowledge of a delivery it did not perform. That was the manual-only rule that preceded the transactional-lane ruling, stated unscoped; it is retired here and survives only as the fallback path's no-delivery-claim discipline. The divergence it created with this document's §5 is closed by this amendment.* — *Enforced by:* the request message handed to the person's own share sheet (phone) or clipboard (web) — no gateway and no connected channel (owner ruling 2026-11-11) — and review that no delivery state is claimed on the copy-paste fallback path on any surface in this file — **review rejects a missing send control wherever a channel is connected, and rejects any delivery state on the copy fallback**; its acceptance lines, both now carried by the PRD's own §M11.4 acceptance block: Given a minted link in a tenant with a connected transactional channel, when it goes out, then it sends from that channel under the transactional template class and that channel's delivery states are shown honestly — exactly as it reports them and no further (`M11-26`, `M03-03`, `F5-28`); and given a minted link in a tenant with no connected channel, when it is copied, then nothing is transmitted by the product and no delivery state appears anywhere on the surface (`M11-26`). The ruling automates the message only: `M11-01` is unamended, the platform touches no funds, and collections still settle customer → the tenant's own account. **RULED (owner ruling 2026-08-06) — the build gains the reader's send.** The *send of the plain request message* from the tenant's connected official channel **stays in project scope** (`F2.M08.project-visibility`), carried by `foundations/F2` §F2.5-M11's row `F2.M11.send-request-message`: the plain message carries no money instrument, and keeping it there preserves the case the PRD wanted — a read-only Sales Executive chasing their own won deal (`S8.wrong.3`, `M08-18`). **Minting and sending an actual payment LINK is unchanged and still requires `F2.M11.record-payments`**, a link being a live collection instrument. T-M11-002 therefore builds the reader's send alongside compose-and-copy, and its DONE WHEN carries the criterion. *(The requirement cell quoted above is **not** amended by this ruling — it stands exactly as the transactional-lane ruling left it — and money settlement is untouched.)* **RULED (owner ruling 2026-08-06) — the build gains the audit write.** The plain message's *send* **is** an audit-covered event and the entry is recorded **under the name of the person who sent it**, for every holder of `F2.M11.send-request-message`, the project-visibility-only reader included: the message leaves the tenant's own official channel and reaches a customer about money, and the record answers "who messaged my customer?" instantly. `F2-22`'s checklist now names the send and `M11-07` is amended at source to reciprocate it (T-M11-009 quotes the amended cell and builds the write path; T-M11-002 and T-M11-016 carry the criterion on the surfaces the send is taken from). Composing and copying write no entry — the **send** is the audited act — and the entry records the act and its sender, never a delivery: `M11-26`'s no-delivery-claim discipline is untouched, the copy fallback still shows no delivery state anywhere, and **review rejects any surface that renders an audit entry as a delivery affordance**. *(The requirement cell quoted at the head of this entry — `M11-26` — is **not** amended by the audit ruling either; the holder set stays the project-scope ruling's, and money settlement is untouched: `M11-01` stands unamended.)* **RULED (owner ruling 2026-08-06) — the audit write stops at the connected channel, and the fallback path records nothing.** The covered event is the send the *product* performs; on this cell's copy-paste fallback the product composes and places text on the clipboard and a person sends it outside the product, so **no entry is written at all — no compose record, no copy record, no send record — and no counter, timeline entry or chase marker stands in for one**. The owner chose the simpler rule in as many words (*"keep as much as simple. and dont do overengineering"*), and the trade is recorded rather than engineered around: the same chase is attributable when the product sends it and unrecorded when a person does, which is exactly this cell's own discipline applied to the log — the product never claims what it did not do. The build gains nothing and loses nothing: T-M11-009 writes on the connected path only, T-M11-002 and T-M11-016 carry the boundary as criteria, and **review rejects any fallback-path record added back under any name, as it already rejects any surface that renders an audit entry as a delivery affordance**. The `M11-26` cell is **not** amended by the fallback ruling either; the amended cell is `M11-07`, and money settlement is untouched: `M11-01` stands unamended.
- **M11-32** (P0) — **An unpaid tranche never gates the customer's own surface.** The payment link and the customer's progress link are different objects with different jobs: money owed is chased through people, and *"never block the customer's progress link over money — chase the person, do not punish the view"*. No state in this module may be wired to a customer-facing gate. — *Enforced by:* T-M11-015 publishing facts that gate nothing and the chase facts supplied rather than a sanction, with the link's own lifecycle owned by `docs/tasks/F5-customer-link.md`; review rejects any wiring from a tranche state to a customer-facing gate; its acceptance line: Given a project with an overdue tranche, when the customer opens their own surface, then it works exactly as it would if nothing were owed (`M11-32`).
- **M11-56** (P0) — **No commercial figure from this module reaches a surface that must not carry one.** Nothing in the tranche schedule, the ledger or the collections views may appear on any surface the Installation Team Member preset reaches — a property of the surface, not of the viewer. — *Enforced by:* this module composing no money fact onto an installation surface — the crew surfaces of `docs/tasks/M09-field-workforce.md` and the installation-reachable surfaces of the shipped projects (`SCR-M08-04`, `SCR-M08-05`) consume none — and review of every consumer of the one collected figure; its acceptance line: Given any surface the Installation Team Member preset reaches, when it renders, then no tranche, receipt, price or other commercial figure appears (`M11-56`).

## Disposition index

| Row | Disposition |
|---|---|
| M11-01 | LAW |
| M11-02 | LAW |
| M11-03 | LAW |
| M11-04 | LAW |
| M11-05 | dropped — no payment gateway (owner ruling 2026-11-11) |
| M11-06 | T-M11-008 |
| M11-07 | T-M11-009 |
| M11-08 | T-M11-005 |
| M11-09 | T-M11-005 |
| M11-10 | T-M11-006 |
| M11-11 | T-M11-006 |
| M11-12 | T-M11-006 |
| M11-13 | T-M11-005 |
| M11-14 | T-M11-002 |
| M11-15 | T-M11-002 |
| M11-16 | T-M11-002 |
| M11-17 | dropped — no payment gateway (owner ruling 2026-11-11) |
| M11-18 | dropped — no payment gateway (owner ruling 2026-11-11) |
| M11-19 | T-M11-002, T-M11-004 |
| M11-20 | dropped — no payment gateway (owner ruling 2026-11-11) |
| M11-21 | LAW |
| M11-22 | dropped — no payment gateway (owner ruling 2026-11-11) |
| M11-23 | T-M11-004 |
| M11-24 | T-M11-002 |
| M11-25 | dropped — no payment gateway (owner ruling 2026-11-11) |
| M11-26 | LAW |
| M11-27 | dropped — no payment gateway (owner ruling 2026-11-11) |
| M11-28 | T-M11-002 |
| M11-29 | dropped — no payment gateway (owner ruling 2026-11-11) |
| M11-30 | T-M11-002 |
| M11-31 | T-M11-002 |
| M11-32 | LAW |
| M11-33 | T-M11-003 |
| M11-34 | T-M11-003 |
| M11-35 | T-M11-003 |
| M11-36 | T-M11-002, T-M11-003 |
| M11-37 | T-M11-003 |
| M11-38 | T-M11-003, T-M11-007 |
| M11-39 | T-M11-003 |
| M11-40 | T-M11-007 |
| M11-41 | T-M11-002 |
| M11-42 | T-M11-002 |
| M11-43 | T-M11-014 |
| M11-44 | T-M11-014 |
| M11-45 | T-M11-015 |
| M11-46 | T-M11-002 |
| M11-47 | T-M11-002 |
| M11-48 | T-M11-013 |
| M11-49 | T-M11-002 |
| M11-50 | T-M11-013 |
| M11-51 | T-M11-009 |
| M11-52 | T-M11-002 |
| M11-53 | T-M11-016 |
| M11-54 | T-M11-001 |
| M11-55 | T-M11-015 |
| M11-56 | LAW |
