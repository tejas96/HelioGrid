# SCR-M02-01 · Quick Add Lead

Capture a lead in under 30s with four fields, dedupe checked live on the phone number.

**Module:** M02 · CRM & leads · **Personas:** Sales Executive (highest-frequency), Sales Manager, EPC Owner · **Context of use:** mobile-first — capture happens on a call or on a doorstep, phone in hand, often one-handed. Web carries it with full parity (`F7-30`).

## Entry & exit

Reached from: the primary add action on every surface — on mobile the shell's elevated centre action, on web the primary action on the leads surface (M02-06); one tap opens it. Onboarding's first door lands on the empty Lead Inbox (SCR-M02-02, M02-25) whose teaching state points here for the first lead. Leads to: the dedupe sheet opens over the capture (never replacing it) when the typed number matches an existing customer or contact; "Open existing" discards the in-progress capture after confirming and opens the existing lead (SCR-M02-04); "Log enquiry on existing" lands the enquiry on the existing lead and creates nothing new; a successful save creates the lead. Post-save destination is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M02-crm-and-leads.md

- **M02-01** (P0) — **Quick add is four fields and must complete in under thirty seconds on a phone: name, phone number, city, type.** *"Everything else later."* No wizard, no second screen, no required field beyond the four — and of the four only the phone number is structurally required (M02-03). The thirty-second bar is a product requirement measured against `F7-37`'s speed budgets, not an aspiration.
- **M02-03** (P0) — **An incomplete lead is still a lead.** A capture carrying only a phone number is accepted and saved; the missing fields are shown as named gaps on the record — "no name yet", "no city yet" — to be filled on first contact. Nothing is rejected for incompleteness and nothing is invented to fill a gap. _(non-UI half, build-side: nothing rejected for incompleteness, nothing invented to fill gaps — for awareness, not for drawing)_
- **M02-05** (P0) — **Every lead carries a segment — residential or commercial & industrial — from the "type" field at capture, and the segment rides the lead through to its proposal.** Both segments are high-volume for the product's buyer; segment is a first-class field from the first thirty seconds, not a proposal-time question. _(non-UI half, build-side: segment rides the lead to its proposal, never re-asked — for awareness, not for drawing)_
- **M02-06** (P0) — **Quick add is one tap from the primary add action on every surface.** On mobile it is the shell's elevated centre action; on web it is the primary action on the leads surface. The capture screen itself is a single screen with the duplicate check running live on the phone field as it is typed (M02-07).
- **M02-08** (P0) — **The dedupe sheet shows the existing record with the three facts that make the decision obvious: who owns it, what stage it is at, and when it was last contacted.** The source's own example is the acceptance shape: *"Priya Sharma from Nashik already exists, owned by Rajesh, last contacted 4 days ago."* The sheet shows the existing record even where the person capturing cannot otherwise see it — with owner name, stage and last-contact date only, never the record's contents — because the whole purpose is to stop a second rep chasing the same customer. **Final (owner ruling 2026-08-04, Q23):** the three-fact disclosure is confirmed exactly as specified — no file access, and cross-scope Open-existing resolves to a request-to-owner.
- **M02-09** (P0) — **The sheet offers exactly three choices, and the third demands a reason: Open existing · Log enquiry on existing · Create anyway (reason mandatory, audited).** There is no fourth choice and no silent default; dismissing the sheet leaves nothing created. _(non-UI half, build-side: exactly three choices, no silent default; dismissing creates nothing — for awareness, not for drawing)_
- **M02-11** (P0) — **"Log enquiry on existing" records the enquiry on the existing record and never creates a second lead.** The enquiry lands on the existing lead's timeline as an activity naming the channel, the time and what was captured, and the existing owner is notified so the next call is theirs to make. Nothing about the existing lead's stage, owner or assignment changes. _(non-UI half, build-side: appends enquiry activity, notifies owner, changes no stage or owner — for awareness, not for drawing)_
- **M02-12** (P0) — **"Create anyway" requires a reason, audits it, and links the two records.** The reason is mandatory free text, recorded on both records' timelines with who chose it and when, and joins the audit log (`F2-22`). Both records then exist and each shows the other, because a deliberate duplicate is exactly the input the merge flow (§M02.11) exists to resolve later. _(non-UI half, build-side: mandatory reason audited on both timelines; records cross-linked for merge — for awareness, not for drawing)_
- **M02-66** (P0) — **A duplicate the live check could not see is resolved explicitly, never silently.** `M02-07`'s check runs *before* the save, so two captures of the same number in the same moment can both pass it and the server finds the collision only on apply. When it does, **both records are flagged "possible duplicate" and each shows the other** (the linkage `M02-12` already builds), the standard three-choice sheet (`M02-09`) fires on the next open of either record, and **nothing is ever merged automatically** — a capture is never silently discarded and never silently joined to another record. Where the person cannot see the other record under their visibility scope, the flag still shows and Open-existing resolves to a request-to-owner, exactly as `M02-08` provides.

## States

- **Loading** (base) — the screen itself must open in one tap and never block on lookups while typing.
- **Empty** (base) — the blank four-field form; "type" defaults to the tenant's declared segment from onboarding (`M01-23`) so the common case is already chosen.
- **Error** (base) — save failure acknowledged honestly; the rest of the capture is preserved.
- **normal** — four fields, keyboard-appropriate inputs, save available.
- **live-duplicate-check** — the check fires as the number becomes complete; it never blocks the save button while it runs.
- **check-inconclusive** — no answer yet (a slow check): the save proceeds and the check completes on apply; a collision found on apply flags both records and fires the three-choice sheet on next open, never an automatic merge and never a silent drop (M02-66).
- **dedupe-sheet** — opens over the capture, never loses what was typed; shows owner, stage, last contact only; exactly three choices; header states the entry point ("This number is already in the system"); dismissing creates nothing. Cross-scope variant: three facts still shown, Open-existing resolves to a request-to-owner (M02-08).
- **create-anyway-reason-required** — the confirm is unavailable until the mandatory reason is entered (M02-12).
- **invalid-phone-refused** — only a number that cannot be a phone number at all is refused, with the expected shape stated; the field normalises rather than scolds (spaces, leading zero, national prefix are normalised to the pack's canonical form); the rest of the capture is preserved.
- **gaps-on-save** — a phone-only capture saves; missing fields become named gaps ("no name yet", "no city yet") on the record (M02-03).

## Data volume

A single capture — one record, four fields, designed against the thirty-second clock (M02-01, measured against `F7-37`'s speed budgets). The dedupe sheet shows exactly one existing match with its three facts. No lists on this screen.

## Numbers carrying provenance

- The dedupe sheet's **last-contact date** ("last contacted 4 days ago") — a server-recorded fact, rendered as a relative date on the tenant's timezone (`F3-22`).
- The **phone number** is identity data, normalised to the pack's canonical form (`F1-21`) — data, not a provenance-tiered figure.
- No money figures appear on this screen.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` base state (`F4-03`) and an `offline-queued` state (`F4-24`), and its Context of use called quick add offline-capable (`F4-08` row 3). All are deleted. `M02-04` is excised, not deleted: its offline-capture-and-queue premise is cut and the row now states the surviving rule — a duplicate the live check could not see (two reps capturing the same number in the same moment) still creates the lead, flags both records and resolves through the three-choice dedupe sheet. `check-inconclusive` now reads as a slow check rather than an offline one.*

*Amended 2026-08-15 by owner ruling (register `Q62`): the apply-time-duplicate requirement this brief carried as UNRESOLVED is restored to the live PRD under a **new id, `M02-66`** in `docs/prd/modules/M02-crm-and-leads.md` §M02.2 — it replaces the citation of `M02-04`, which stays deleted from the 2026-08-07 sweep and is not to be cited. The UNRESOLVED marker and its placeholder bullet are replaced by the verbatim `M02-66` row, and `check-inconclusive` now cites `M02-66` instead of pointing at the unresolved requirement by description. The owner's reason: `F8-36` is live P0 — a surface "does not silently queue, partially apply, or display an optimistic result" — and no module row made that concrete for a duplicate found on apply.*
