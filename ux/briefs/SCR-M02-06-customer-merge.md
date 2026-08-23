# SCR-M02-06 · Customer Merge

Side-by-side survivor comparison with field-level choices and an irreversible, fully-stated confirm.

**Module:** M02 · CRM & leads · **Personas:** EPC Owner, Sales Manager (permission `F2.M02.merge-customers`, with M02-63's scope condition) · **Context of use:** web-emphasis for the survivor comparison, one-tap-reachable on mobile from either record (stacked at the mobile breakpoint). Merge completes on the server and is never applied on a device.

## Entry & exit

Reached from: either customer record and from the deliberate-duplicate link M02-12 leaves behind (M02-59) — the case it exists for is the duplicate phone-as-identity cannot catch (same person, two numbers). Leads to: the survivor's record after completion — the survivor's timeline carries the whole merged history in one stream; the loser becomes a tombstone that resolves any old link to the survivor. Abandoning at the confirm leaves both records untouched.

## Requirements (verbatim)

### prd/modules/M02-crm-and-leads.md

- **M02-59** (P0) — **Customer merge ships in v1 and is the answer to the case deduplication cannot reach: the same person with two numbers.** The source's own example is a husband and wife enquiring separately; phone-as-identity cannot catch it by construction, and the ruling closes the source's "offer merge later" with **"the merge flow ships"** — read as v1 scope (`OD-5` retires the calendar phrasing, not the commitment). Merge is reachable from either customer record and from the deliberate-duplicate link M02-12 leaves behind.
- **M02-60** (P0) — **Merge is: pick the survivor, re-point every reference to it, and mark the loser merged — never deleted.** Contacts, leads, proposals, links, activities, tasks and files that pointed at the loser point at the survivor afterwards; the loser record remains as a tombstone pointing at the survivor, so an old reference still resolves to something true. Field-level survivor choices — which name, which city, which primary contact — are made explicitly in the flow, never guessed. _(non-UI half, build-side: re-points every reference to survivor; loser becomes tombstone, never deleted — for awareness, not for drawing)_
- **M02-63** (P0) — **Merge is irreversible, and the confirm step says so in full.** Before it runs, the flow states exactly what will move, what the loser record becomes, and that the act cannot be undone from the product; it completes only on explicit confirmation. Merge requires that **both records fall inside the actor's own lead-visibility scope** (`F2-13`/`F2-14`) — nobody merges a record they cannot see. Merge completes on the server and is never applied on a device. _(non-UI half, build-side: both records must be in actor's visibility scope; server-completed; no undo — for awareness, not for drawing)_

## States

- **Loading** (base).
- **Empty** (base) — not applicable as a list; the flow always opens with two named records. If a record cannot be loaded the flow does not proceed.
- **Error** (base) — a failed merge is reported honestly; nothing is applied locally.
- **side-by-side-comparison** — the two records side by side, each differing field showing both values with the survivor's choice selected; the flow proposes the record with more history as survivor and lets it be changed; the totals of what will move — how many leads, contacts, proposals, links, activities and files — stated before the confirm.
- **stacked-mobile** — the same comparison stacked at the mobile breakpoint.
- **field-survivor-choice** — which name, which city, which primary contact: explicit choices, never guessed (M02-60); where both records have a primary contact, a single primary must be chosen; where both have live leads, both leads survive under the survivor — merge never closes, merges or discards a deal.
- **irreversible-confirm** — states exactly what will move, what the loser record becomes, and that the act cannot be undone from the product; completes only on explicit confirmation (M02-63); abandoning here creates and changes nothing.
- **scope-blocked** — one of the two records is outside the actor's lead-visibility scope: merge is unavailable and says why (M02-63).

## Data volume

Two full customer records compared field by field, with several differing fields each carrying both values. The move totals are real counts: multiple leads (possibly at different stages — both survive), several contacts, proposals, links, activities in the hundreds (the merged timeline is one stream), tasks and files. The deliberate-duplicate reason recorded at M02-12 stays visible as the reason the pair existed.

## Numbers carrying provenance

- **The move totals** — how many leads, contacts, proposals, links, activities and files will re-point to the survivor: exact counts stated before the confirm (M02-60, M02-63).
- **Any money figure shown in the comparison** — renders through the money implementation with its provenance intact and is read-only (`F3-24`); a merge touches no money, so every proposal figure, tranche, payment, discount and total is unchanged by the act.
- **Record dates** shown for comparison (last contact, capture dates) are data, rendered on the tenant's timezone (`F3-22`), never translated (`F3-08`).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` base state and an `offline-waiting` state. Both are deleted. `M02-63`'s "Merge is online-first" sentence is excised to "Merge completes on the server and is never applied on a device" — the no-optimistic-local-apply rule survives, the offline vocabulary does not; the same sentence in Context of use gets the identical change.*
