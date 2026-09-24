# SCR-M02-06 · Customer Merge

Side-by-side survivor comparison with field-level choices and an irreversible, fully-stated confirm.

**Module:** M02 · CRM & leads · **Personas:** EPC Owner, Sales Manager (permission `F2.M02.merge-customers`, with M02-63's scope condition) · **Context of use:** web-emphasis for the survivor comparison, one-tap-reachable on mobile from either record (stacked at the mobile breakpoint). Merge completes on the server and is never applied on a device.

**One job:** make two records of one person into one, choosing what survives, knowing it cannot be undone.
**Order of attention:** 1 which record survives · 2 each field where the two differ · 3 what will move — and the confirm that cannot be taken back.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **The confirm is the one place this screen must be read slowly (`M02-63`):** it states what
moves as ROWS, and what cannot be undone in ONE line.

| Fact | Kind | Its form here |
|---|---|---|
| The two records | data | two value columns at 1536; at 375 each differing field is one row holding both values |
| The proposed survivor — the record with more history | status · action | a chip *Kept* on it — the plain word for the PRD's survivor — and ONE act to change it |
| What is compared (`M02-03`, `M02-34`, `M02-37`) | data | the customer's own fields: name, city, customer type, preferred language, and the contacts. A lead's fields (stage, bill, owner) are not compared: every lead survives as it is |
| Which name, which city, which primary contact (`M02-60`) | action | per differing field, one tap picks the value that survives. Nothing is pre-guessed beyond the proposed survivor — except that a named gap (*No city yet*, `M02-03`) never wins over a value by default: where the kept record has the gap and the other has a value, the value is selected |
| Every contact survives (`M02-34`, `M02-60`) | data | a count in the move rows; both numbers stay on the kept record as contacts, so either one matches it afterwards |
| Calling restrictions (`M02-37`) | data | never a choice: a label–value row naming what the kept record will carry — every stop either record holds (do-not-call, the complaint quiet flag, do-not-disturb), and consent only where both records hold it. Drawn only when the two differ |
| Fields where the two agree | more detail | not drawn one by one: a row carrying their count, which opens |
| Both records hold a primary contact (`M02-60`) | action | one choice row; exactly one survives as primary |
| Both records hold a live lead | data | a label–value row: both leads stay open under the survivor. A fact about the deal, stated as data |
| Why there were two (`M02-12`) | data | a label–value row carrying the recorded reason. The reason's text is content, not screen copy |
| What will move (`M02-60`, `M02-63`) | data | label–value rows — leads, contacts, proposals, links, activities, tasks, files — each an exact count. One provenance label heads them (`F8-07`) |
| Money shown in the comparison | data | read-only, with its tier. No edit affordance is drawn |
| The confirm (`M02-63`, `N8`) | action | a sheet at 375 and a modal at 1536: the move rows again, a row saying what the other record becomes, and ONE line — the product cannot undo this. `N8` asks for the recovery route in words and the PRD names none, so the honest words are what stays true: the other record remains as a pointer, and every old link still opens the survivor (`M02-60`). The same words ride the after-state. It completes only on the explicit act; leaving changes nothing |
| One record is outside the person's scope (`M02-63`) | status | the merge act is absent, and ONE line in its place says why. The hidden record shows only what `M02-08` allows across scope — its owner, stage and last contact — never its name, city or contacts |
| The merge is running (`M02-63`, `F8-36`) | status | the confirm's act waits in its pending form until the server answers; nothing on either record changes before then |
| Merged (`M02-60`, `M02-61`) | status · data | the landing: the kept record's detail (SCR-M02-04) with ONE line — the other record now points here — and the merge as the newest timeline entry: what merged into what, who, when, and each field choice |
| An old link to the merged record (`M02-60`) | status | opening it lands on the kept record with ONE line naming the merge — never a dead end |
| A record could not be loaded | error | one banner; the flow does not proceed |
| The merge failed | error | one banner — what failed. Nothing was applied |

## Arrangement

- **375.** Stacked: the survivor choice, then the differing fields as two-value rows, then the move
  rows, then the act. The confirm is a sheet.
- **1536.** The two records side by side with the move totals in a side column, in view while fields
  are chosen. The confirm is a modal — a decision that must be finished or abandoned before anything
  else continues.

## Entry & exit

Reached from: either customer record (the *Merge* act on Lead Detail, SCR-M02-04, for holders of `F2.M02.merge-customers`) and from the deliberate-duplicate link M02-12 leaves behind (M02-59) — the case it exists for is the duplicate phone-as-identity cannot catch (same person, two numbers). Leads to: the survivor's record after completion — the survivor's timeline carries the whole merged history in one stream; the loser becomes a tombstone that resolves any old link to the survivor. Abandoning at the confirm leaves both records untouched.

## Requirements (verbatim)

### docs/prd/modules/M02-crm-and-leads.md

- **M02-59** (P0) — **Customer merge ships in v1 and is the answer to the case deduplication cannot reach: the same person with two numbers.** The source's own example is a husband and wife enquiring separately; phone-as-identity cannot catch it by construction, and the ruling closes the source's "offer merge later" with **"the merge flow ships"** — read as v1 scope (`OD-5` retires the calendar phrasing, not the commitment). Merge is reachable from either customer record and from the deliberate-duplicate link M02-12 leaves behind.
- **M02-60** (P0) — **Merge is: pick the survivor, re-point every reference to it, and mark the loser merged — never deleted.** Contacts, leads, proposals, links, activities, tasks and files that pointed at the loser point at the survivor afterwards; the loser record remains as a tombstone pointing at the survivor, so an old reference still resolves to something true. Field-level survivor choices — which name, which city, which primary contact — are made explicitly in the flow, never guessed. _(non-UI half, build-side: re-points every reference to survivor; loser becomes tombstone, never deleted — for awareness, not for drawing)_
- **M02-63** (P0) — **Merge is irreversible, and the confirm step says so in full.** Before it runs, the flow states exactly what will move, what the loser record becomes, and that the act cannot be undone from the product; it completes only on explicit confirmation. Merge requires that **both records fall inside the actor's own lead-visibility scope** (`F2-13`/`F2-14`) — nobody merges a record they cannot see. Merge completes on the server and is never applied on a device. _(non-UI half, build-side: both records must be in actor's visibility scope; server-completed; no undo — for awareness, not for drawing)_
- **M02-61** (P0) — **The merge keeps a full audit trail.** What was merged into what, by whom, when, and each field-level survivor choice, recorded on the survivor's timeline and in the audit log (`F2-22`). The tombstone carries the same record, so the history of the losing record is not orphaned.
- **M02-34** (P0) — **A customer carries additional contacts — name, phone and a role label such as decision-maker, landlord or spouse — with exactly one primary.** The role label set is tenant-extendable. Contact numbers participate in deduplication (M02-02), and capturing "who actually decides" is a first-class act on the lead rather than a note.
- **M02-37** (P0) — **The customer record carries calling-compliance state from day one: consent, do-not-disturb status, the do-not-call flag, a complaint-set permanent quiet flag, and preferred language.** These fields live on this module's customer record because the compliance gate reads one row per dial; the gate itself, its scrub freshness and its refusals are `modules/M07-sales-execution.md`'s, and the statutory ruleset behind them is pack data (`F1-36`). A "stop calling" is irreversible without the customer's own say-so. **Consent-ledger cross-ref (owner ruling 2026-08-04):** beside these voice fields, the customer record carries the per-contact **per-channel messaging consent ledger** — opt-in source + timestamp auto-recorded at capture, opt-outs honored suite-wide — owned by `modules/M03` (`M03-34`/`M03-46`); campaign sends auto-filter on it and proof is one tap.

## States

- **Loading** (base).
- **Empty** (base) — not applicable as a list; the flow always opens with two named records. If a record cannot be loaded the flow does not proceed.
- **Error** (base) — a failed merge is reported honestly; nothing is applied locally.
- **side-by-side-comparison** — the two records side by side, each differing field showing both values with the survivor's choice selected; the flow proposes the record with more history as survivor and lets it be changed; the totals of what will move — how many leads, contacts, proposals, links, activities and files — stated before the confirm.
- **stacked-mobile** — the same comparison stacked at the mobile breakpoint.
- **field-survivor-choice** — which name, which city, which primary contact: explicit choices, never guessed (M02-60); where both records have a primary contact, a single primary must be chosen; where both have live leads, both leads survive under the survivor — merge never closes, merges or discards a deal.
- **merging** — the confirm's act pending until the server completes the merge; nothing is shown as merged before it does (`F8-36`).
- **merged** — the landing on the kept record: one line saying the other record now points here, and the merge entry at the top of its timeline with each field choice (M02-61).
- **old-link-resolves** — a link to the merged record opens the kept record, with one line naming the merge (M02-60).
- **irreversible-confirm** — states exactly what will move, what the loser record becomes, and that the act cannot be undone from the product; completes only on explicit confirmation (M02-63); abandoning here creates and changes nothing.
- **scope-blocked** — one of the two records is outside the actor's lead-visibility scope: merge is unavailable and says why (M02-63); the hidden record shows only M02-08's cross-scope facts.

## Data volume

Two full customer records compared field by field, with several differing fields each carrying both values. The move totals are real counts: multiple leads (possibly at different stages — both survive), several contacts, proposals, links, activities in the hundreds (the merged timeline is one stream), tasks and files. The deliberate-duplicate reason recorded at M02-12 stays visible as the reason the pair existed.

## Numbers carrying provenance

- **The move totals** — how many leads, contacts, proposals, links, activities and files will re-point to the survivor: exact counts stated before the confirm (M02-60, M02-63).
- **Any money figure shown in the comparison** — renders through the money implementation with its provenance intact and is read-only (`F3-24`); a merge touches no money, so every proposal figure, tranche, payment, discount and total is unchanged by the act.
- **Record dates** shown for comparison (last contact, capture dates) are data, rendered on the tenant's timezone (`F3-22`), never translated (`F3-08`).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` base state and an `offline-waiting` state. Both are deleted. `M02-63`'s "Merge is online-first" sentence is excised to "Merge completes on the server and is never applied on a device" — the no-optimistic-local-apply rule survives, the offline vocabulary does not; the same sentence in Context of use gets the identical change.*
