# SCR-M06-19 · Proposal List

Proposals listed with status and staleness; duplicate offered per row.

**Module:** M06 (Proposals — the commercial document: built, priced, versioned, generated, shared) · **Personas:** Sales Executive (primary — duplicates earlier proposals; the primary residential path), Sales Manager (team-scoped visibility, `F2.M02.lead-visibility` per the module's permissions), EPC Owner (full capability), Design Engineer (builds and edits) · **Context of use:** scanning on phone between calls or at desk; reads never pause in any billing state (`M06-26` per the module); duplication is the fastest path for repeat residential jobs.

## Entry & exit

Reached from: not pinned by PRD — designer decides, note the decision (the PRD pins that proposals are listed on the lead detail and in proposal lists — `M06-48`; how the standalone list is reached in navigation is not pinned). Leads to: Proposal Detail (SCR-M06-18) per row; Duplicate per row → a new builder draft with every step pre-filled, components included (SCR-M06-01/02); Regenerate is the corrective action offered wherever staleness is read (`M06-46`).

## Requirements (verbatim)

### From `docs/prd/modules/M06-proposals.md`

- **M06-46** (P0) — **Staleness is derived, never stored — and a stale proposal says so where it is read, with regenerate offered.** Freshness is the comparison of the version's pinned design fingerprint and input versions against what is live (`F8-13` consumed; the design-side staleness surface is `M05-11`, consumed). A design edit after generation makes the proposal stale (`S6B.wrong.7`): the proposal states it — in the list, on the detail, in the customer-facing rendering — and offers **Regenerate**, which produces a new version through the full Generate gate. _(non-UI half, build-side: staleness derived by comparing pinned fingerprint/input versions against live — never stored — for awareness, not for drawing)_
- **M06-48** (P0) — **Duplicate an earlier proposal is a first-class entry point — and the primary residential path.** Duplicating pre-fills **all steps** from the source proposal — components included (`D22`'s speed answer) — onto a new lead's client details. *"Same as the Sharma proposal, new customer, 6 kW" should take under a minute.* Duplicate *"deserves to be a first-class entry point, not buried"*: it is offered wherever proposals are listed (lead detail, proposal lists) and from any proposal's detail. What duplicate never copies: the proposal number (server-assigned fresh, `M06-44`), the version history, the share state, and the client details of the source customer. _(non-UI half, build-side: duplicate copies all steps and components; never copies number, version history, share state, source client — for awareness, not for drawing)_

### From `docs/prd/modules/M05-design-studio.md`

M05's row, carried here because `F8-18` puts the staleness state "on the object itself — in the list, on the detail screen, in the customer-facing rendering" and this screen is the list leg; the row is dispositioned in the M05 bucket (`docs/tasks/MS-studio-a.md`, T-MS-117), not this one. The design-side banner and the persistent marking are drawn on the Studio Shell (SCR-MS-03); the proposal-side detail leg — the state read on open and the blocked send with its stated reason — is drawn on SCR-M06-18.

- **M05-13** (P0) — **When a newer survey version supersedes the one a design was built from, the studio marks the design "survey updated — review needed" and notifies the designer — and applies nothing automatically (owner ruling 2026-08-04, Q24).** The design shows the review-needed banner naming the superseding version and the fields that differ in provenance or value; the designer reviews and chooses what to apply. **Draft proposals built on the design are blocked from SENDING until the review clears; sent proposals stay pinned and never mutate** (`F8-15`). The same self-stale pattern as catalog releases. _(drawn here: the list leg only — the review-needed condition readable on the proposal's row before the rep opens or shares anything. The banner naming the differing fields and the designer notification are the studio's (SCR-MS-03); the send block and its stated reason are the detail screen's (SCR-M06-18) — for awareness, not for drawing here.)_

M05's behavior detail binds the display pattern: "Freshness surfaces (M05-10, M05-11, M05-13) all follow one pattern: the affected number or surface carries the staleness marker, the marker names *what* is newer, and remedy is one tap away — never a silent recomputation." A draft proposal held from sending is an affected surface, and a list row is where it is first read.

## States

- **loading** — the list loading.
- **empty** — no proposals yet for the scope in view (a new tenant or a lead with none).
- **error** — a failed list load stated plainly.
- **status-badges** — each row's status from the machine: draft → shared → accepted / declined, with superseded (`M06-45` context).
- **stale-badge** — staleness stated in the list (derived, never stored) with Regenerate offered.
- **design-survey-review-needed** — per row: the draft proposal on this row was built on a design carrying the "survey updated — review needed" marker, and **the row says so before the rep opens or shares anything** (`M05-13`, owner ruling 2026-08-04 Q24; `F8-18`'s "in the list" leg). **Distinct from stale-badge:** `M05-13` applies nothing automatically, so no pinned value has moved and `M06-46`'s fingerprint comparison does not fire — Regenerate is not the remedy here and is not the action this row offers; the designer's review is, reached through the proposal (SCR-M06-18 → SCR-MS-03). Both conditions can be true on the same row at once and must stay separately readable — two different facts, never merged into one badge. Never communicated only by a colour, only by absence, or only after the rep tries to send. **How much the row states at list density — whether the marker names the superseding survey version here or only on the detail screen — is not pinned by these rows: designer decides, note the decision.** Only draft rows can carry it: a version already `shared` stays pinned and never mutates (`F8-15`).
- **duplicate-action** — duplicate offered per row, first-class — not buried.

## Data volume

Design at the PRD's realistic list volume — the 200-row scale of the module's parent lead lists (the DoD's 200-lead volume), with drafts ("Proposal draft — n/11" is how a draft reads on the lead surface, per the module), shared, accepted, declined, superseded and stale rows all present at once, at phone width.

## Numbers carrying provenance

The slice rows pin no money columns for the list. What the rows do pin:

- **Status and its timestamp per row** — record facts of the status machine.
- **Staleness per row** — derived by comparing pinned fingerprint/input versions against live, stated where read; if the design surfaces any money or date from a version on the row, it carries the tier that version pinned and renders provisional wherever stale (`M06-41`'s law) — never final while stale.
