# F4 · Data integrity

Status: live · Origin mix: `SRC` only — every row is source-derived and P0.

**This document replaces the former `F4 · Offline & sync`, deleted 2026-08-07 by owner decision.** The
product requires a live connection: there is no cache, no local-first read, no sync engine, no
queue, no staleness and no conflict-resolution layer. Losing connectivity is an ordinary network
error, and the product says so on one shared screen rather than in a state on every surface.

What survives here are the ten rows of the old document that were **never about connectivity**.
They govern how the server owns truth, how two people editing the same thing at the same time
resolve, and what the product owes a user whose data would otherwise be lost. They kept their
original ids so every existing citation still resolves.

**The one carve-out.** Photographs captured in the field are held on the device and upload when the
connection returns (`F4-21`). A photo that fails to capture cannot be retaken from the office, so
this is the single piece of deferred work in the product. It is one queue, in one direction, with
no conflicts and no merge, and its status is shown on the capture screen — there is no sync centre
and no global indicator.

---

## F4.1 · The server owns truth

| id | requirement | source | tier |
|---|---|---|---|
| F4-04 | **The server owns truth and money.** Version checks, tenant checks, business identifiers and **every money figure** are computed server-side. The source states it as a rule about currency — *"every rupee [is] computed server-side"* — and the rule is market-neutral: no device computes, assigns or finalises a money figure or a business identifier for any market. | `SRC` — `DOC06.server-owns-money` (docs/06 §1 principle 3), quoted; market-neutral restatement per `00-README.md` §Tag vocabulary and design spec §6 | P0 |
| F4-07 | **Two guarantees hold from the product's first release: a survey is versioned-append, and a submission applied twice never produces a second record.** The source ties both to the write model rather than to any connectivity layer. Survey versioning is the conflict policy of `F4-14`; idempotent submission is what makes any retry safe, whether after a dropped request, a killed application or a duplicate delivery. The mechanism is engineering; the product law is that a retried capture never duplicates a record and never silently drops one. | `SRC` — `DOC06.online-first-until-offline` | P0 |

## F4.2 · Two people, one record

The concurrency law. It governs two people working at the same moment on a live connection, and it
is enforced by `modules/M05-design-studio.md` (`M05-09`) and `modules/M02-crm-and-leads.md`
(`M02-36`), neither of which defines it.

| id | requirement | source | tier |
|---|---|---|---|
| F4-14 | **Survey — versioned-append. A revisit NEVER overwrites the first version.** A return visit to a site creates a **new survey version**; prior versions are immutable and remain readable forever. Within one in-progress version, edits by its own author resolve last-writer-wins by server apply order. The rule is stated as a product law, not a storage strategy: the first survey is evidence of what the site looked like on that day, and no later visit is permitted to erase it. | `SRC` — `DOC06.conflict-matrix` (docs/06 §6), quoted verbatim: *"a revisit NEVER overwrites v1"* *(shared — the survey object, its groups and its revisit flow are `modules/M04-survey.md`'s)* | P0 |
| F4-15 | **Design — single editor plus a server version check. No merge, ever.** Every design save carries the version it was based on; a mismatch is **refused**, the client reloads server state, and the user re-applies their change. A design is one document and is never algorithmically merged; the version check is what makes a stale second editor impossible to lose silently rather than a mechanism for combining two edits. | `SRC` — `DOC06.conflict-matrix` (docs/06 §6), quoted verbatim: *"No merge, ever"* *(shared — the studio's editor, its reload prompt and its lock behaviour are `modules/M05`'s)* | P0 |
| F4-16 | **Lead field edits — per-field last-writer-wins, with an activity entry for every applied change.** Server apply order wins per field, and each applied change writes an activity entry naming the field, its old and new values, the actor and the capture time — **"so a 'lost' concurrent edit is always visible and recoverable from the log."** Last-writer-wins is acceptable here *only because* the log makes the loser recoverable; a module may not apply last-writer-wins to any field without that record. Stage transitions are validated against the pipeline state machine, and an invalid transition is refused. | `SRC` — `DOC06.conflict-matrix` (docs/06 §6), quoted | P0 |
| F4-17 | **Visit — status only moves forward.** A visit's status advances through its states and never regresses; a write that would move it backwards is refused. | `SRC` — `DOC06.conflict-matrix` (docs/06 §6), quoted *(shared — the visit object and its states are `modules/M09-field-workforce.md`'s, with `modules/M02` owning visit logging from the lead)* | P0 |
| F4-19 | **Last-writer-wins is resolved by server apply order, never by device clocks. Capture time is display and audit only.** A device's clock may be wrong, deliberately or otherwise, and the product never lets it decide which of two edits survives. The time a capture was taken is preserved and shown — it is what the field user means by "when" — but it orders nothing. | `SRC` — `DOC06.conflict-matrix` (docs/06 §6), quoted verbatim: *"LWW is resolved by server apply order, never device clocks"*; capture time *"is preserved for display and audit only"* | P0 |

## F4.3 · Nothing captured is ever lost

| id | requirement | source | tier |
|---|---|---|---|
| F4-21 | **Nothing a field user captured is ever unrecoverable.** A photograph taken in the field is held on the device until it has uploaded, and its waiting count and a retry are shown **on the capture screen itself** — there is no separate sync surface. A record that fails validation is preserved and badged for attention rather than crashing the screen or vanishing, and a submission the server cannot accept is preserved for recovery rather than discarded. The law the source states, and this document adopts whole: **"nothing a field user captured is ever unrecoverable."** | `SRC` — `DOC06.quarantine` (docs/06 §10), quoted verbatim; the photo carve-out is owner decision 2026-08-07 | P0 |
| F4-25 | **The version-kept notice.** When a revisit creates a new survey version, the product tells the user what just happened in one line — the source's wording is **"v2 — v1 kept"** — shown at the moment of the revisit and carried on the record afterwards, with the earlier version reachable from it. The notice exists because `F4-14`'s guarantee is worthless if the person on the roof does not know it held: the fear it removes is *"have I just overwritten what I did last month?"* | `SRC` — `UXG-10`, quoted verbatim: **survey-version notice on revisit ("v2 — v1 kept")**; the underlying law is `F4-14`/`DOC06.conflict-matrix` | P0 |
| F4-27 | **A warning never disables a primary action.** No modal and no spinner wall stands between a user and their work, and no primary action is pre-emptively greyed out. Where an action genuinely cannot be performed, it is refused honestly **at the attempt**, with a reason, rather than disabled with no explanation. | `SRC` — `DOC06.sync-status-ux` (docs/06 §9), quoted verbatim: *"Never blocking — no modal, no spinner wall, no disabled primary actions"* | P0 |

---

## §4 · What this document expects from others

| from | what |
|---|---|
| `modules/M04-survey.md` | the survey object, its versions and the revisit flow that `F4-14` and `F4-25` govern; the capture screen that carries the photo queue's status per `F4-21` |
| `modules/M05-design-studio.md` | the studio editor, its reload prompt and lock behaviour under `F4-15` |
| `modules/M02-crm-and-leads.md` | lead field edits and the activity log that makes `F4-16` recoverable |
| `modules/M09-field-workforce.md` | the visit object and its state machine under `F4-17` |
| `foundations/F8-data-honesty.md` | provenance tiers on every user-visible number; `F4-04` owns *who computes* a figure, `F8` owns *how honestly it is labelled* |

## §5 · Non-goals

- **No offline mode.** The product does not read from a cache, does not queue mutations, and does
  not resolve conflicts arising from deferred writes. Losing the connection is a network error.
- **No sync surface.** No sync centre, no global connection indicator, no staleness or freshness
  banner, no queued or unsynced marker on any record.
- **No offline money, on any surface, at any tier** (`M11-06`, which already stated this).

## §6 · Open questions

None.
