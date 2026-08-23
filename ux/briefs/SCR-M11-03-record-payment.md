# SCR-M11-03 · Record Payment

Record a manual payment with amount, mode, reference, date and receipt photo.

**Module:** M11 · **Personas:** Finance, EPC Owner, Project Manager, Sales Manager (the `F2.M11.record-payments` holder set) · **Context of use:** the act that happens away from a desk — a Project Manager records what arrived from the site, mobile-first, often one-handed with a receipt to photograph; the PRD's own scene is "a person standing in a customer's driveway with no signal" (`M11-39`). Also used at a desk by Finance. Money mutations are online-only: connectivity failure means honest refusal, never a queue.

## Entry & exit

Reached from: the tranche row on the payments screen (SCR-M11-02) and from the project's money block (`M08-35`'s surface links here rather than duplicating the control) — M11 §M11.5 behavior detail; it is the *only* place a payment is created — there is no second entry path anywhere in the product. Leads to: not pinned by PRD — designer decides, note the decision (the payment, once accepted by the server, is an entry on the ledger the person came from).

## Requirements (verbatim)

### From `prd/modules/M11-payments-and-collections.md`

- **M11-33** (P0) — **Recording a payment by hand is always available, on every tranche, in every tenant.** It needs no connected account, no link, no action by the customer inside the product, and no market rail — money arrives in this trade in ways a product does not witness, and the product's job is to record it faithfully.
- **M11-34** (P0) — **A payment entry carries: the amount, the mode, a reference, the date it was received, an optional receipt file, and who recorded it.** Those are the fields the ledger keeps; the person recording adds nothing else and no field is silently defaulted.
- **M11-35** (P0) — **The mode is validated against the tenant market's payment-mode vocabulary — an open set the pack declares, never a list baked into the product.** Modes render through the pack's display names (`F1-22`); a market that adds or renames a mode does so in its pack. Manual modes are always part of that vocabulary (`F1-18`). _(non-UI half, build-side: mode validated against pack's open-set vocabulary — for awareness, not for drawing)_
- **M11-36** (P0) — **Part payments are first-class: many entries may sit against one tranche, and the tranche's state follows them.** Nothing forces a person to record a single payment per tranche, to round to the tranche's amount, or to wait until the full amount arrives. An entry that *exceeds* what the tranche still owes is equally recordable and the surplus is stated as a surplus against the schedule — never silently absorbed into a row, spread across rows, or rounded away. _(non-UI half, build-side: many entries per tranche; state follows entries; surplus never absorbed — for awareness, not for drawing)_
- **M11-37** (P0) — **The receipt photograph is held on the device until it uploads; the payment entry is not.** A photograph captured in the field is held and uploaded when the connection returns, with its waiting count and a retry shown on the capture screen itself (`F4-21`) — but the money entry is a server write and does not exist until the server accepts it (`M11-06`). The two are never conflated: there is no state in which a payment "exists locally" while its receipt uploads. _(non-UI half, build-side: receipt file rides capture-and-upload pipeline; entry is server-only write — for awareness, not for drawing)_
- **M11-38** (P1) — **A person never types a negative amount.** A recorded payment is money that arrived; a mistake is undone by reversing the entry (`M11.7`), which is the only path that produces a negative row and the only one that keeps the trail intact. *(This sheet is where the typing happens — the only surface in the product that creates a payment — so the amount field is where the rule is met: a non-positive amount is refused here, and the reversal path is what the refusal names.)*
- **M11-39** (P0) — **Recording is refused with an honest reason when it cannot reach the server, and nothing is held.** A person standing in a customer's driveway with no signal is told plainly that the payment cannot be recorded yet — not shown an optimistic tick for a write the server never accepted. _(non-UI half, build-side: online-only boundary, nothing held — for awareness, not for drawing)_

_Annotation — **scope of owner ruling 2026-08-06, Q45, on this sheet: none of the rows above is amended and nothing here sends.** The ruling settles the payment link and its request message on the due row of the payments ledger (`M11-24`, `M11-26`, `M11-52` amended at source; the surface is SCR-M11-02): with a connected transactional channel they send from it, with none they are composed for a person to send and only that fallback claims no delivery. This sheet is the manual money path and it carries **no link, no message and no send affordance** — so no delivery state exists here to claim or to draw, and none may be added. What the ruling explicitly does not touch is what this sheet is for: manual recording stays available on every tranche in every tenant with no precondition (`M11-33`), the connected account remains an accelerator and never a dependency (`M11-21`), the entry is refused offline rather than held (`M11-39`), and money still settles customer → the tenant's own account with the platform touching no funds (`M11-01`, unamended — only the message is automated). Recorded here so the two collections briefs cannot drift on what the ruling changed._

## States

- **Loading** (base).
- **Empty** (base) — the sheet opens with its fields: amount (defaulted to the tranche's outstanding, always editable — M11 §M11.5 behavior detail), mode from the market's vocabulary, reference, received-on date, receipt attachment; no field is silently defaulted beyond that (`M11-34`). The amount is editable to any positive figure — above or below the outstanding — and to nothing else (`M11-38`; see **Amount-non-positive-refused**).
- **Error** (base).
- **Normal** — the one-screen recording sheet, save as the single act.
- **Receipt-attach-uploading** — the payment is already recorded and the receipt shows as attaching — never the reverse; the entry never depends on the file (`M11-37`).
- **Part-payment-remainder-stated** — the amount is less than the outstanding; the tranche moves to part-received and the surface restates what remains (`M11-36`).
- **Surplus-stated** — the amount exceeds what the tranche still owes; equally recordable, and the surplus is stated as a surplus against the schedule, never absorbed (`M11-36`).
- **Amount-non-positive-refused** — the amount entered is zero or negative: save is refused with the constraint stated in place, no entry is created, and the refusal names the honest path — a wrong amount is not edited and not typed negative, it is recorded and then reversed, which is the only path that produces a negative row (`M11-38`, `M11-46`). Distinct from **Error** (base): this is a stated constraint on a value a person can correct on the sheet, not a failed act.

## Data volume

A single entry form, but designed against: a mode picker whose options are exactly the tenant market's declared payment modes — an open set that varies per market pack (the launch-market instance is `F1-42`), so the list length is not fixed; one receipt file per entry riding the capture-and-upload pipeline; and repeat use — many entries may sit against one tranche (`M11-36`), so the sheet is used several times per tranche in the part-payment case.

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier in the design:

- The amount field, defaulted to the tranche's outstanding amount (always editable).
- The tranche's outstanding amount the default derives from.
- The received-on date.
- The remainder stated after a part payment (`M11-36`).
- The surplus stated when the entry exceeds what is owed (`M11-36`).
- The entry, once saved, carries its hand-recorded qualifier (who recorded it) — a person's claim is never presented as a settled confirmation.
