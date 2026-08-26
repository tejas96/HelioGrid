# 00 · How to read this PRD suite

Status: draft · Origin mix: SRC/BRIEF/REC · Depends on: none (this document defines the
conventions every other document in `docs/prd/` follows)

## How to read this suite

This is the suite-level conventions document. Read it before opening any other file under
`docs/prd/`. It defines, once, what every later document assumes: the document map (what each file
covers), the shared per-module template, the origin-tag vocabulary (`SRC`/`BRIEF`/`REC`), the
priority tiers (P0/P1/P2), the requirement ID scheme, the traceability row format, and the
provenance/reading rules that govern how source material may be used.

`docs/prd/` is the single canonical product specification for HelioGrid V2. It supersedes nothing in
`docs/` or `design/` by editing it — those trees are source material only, read-only forever
(design spec §1). Everything product-facing that this suite says is said here, fresh, grounded
in that source where the source applies and marked `BRIEF`/`REC` where it does not.

This file does not itself carry product requirements. It is process-for-the-reader: the rules
below are what let a PM, designer, engineer, QA lead, or writer open any one PRD in this suite
and know, without asking, where a requirement came from, how firm it is, and where to check if
it has already been questioned or superseded.

## What exists, and what to open first

This suite is the **requirements**. Two derived artifacts sit beside it and are what design and
engineering actually work from — both generated from these documents and machine-verified against
them, so they can never quietly drift:

| Path (from the repo root) | What it is | Who opens it |
|---|---|---|
| `docs/prd/registers/screens.md` | **The screens register — start here.** It also carries the **`V` column**, the V1 scope lock: **99 of the 150 screens are V1** and are designed and built before launch; the other 51 are V2 and are not started. `scripts/gates.py` gate 17 holds it.  The product's complete surface: **150 screens**, and every one of the **1,660 requirement rows** classified `screen` / `mixed` / `engine` / `policy` / `integration` / `context`, mapped to the screen(s) it appears on and the engineering task that builds it. It answers "how many screens does this product have" and "where does this requirement land", which no single PRD document answers. | Everyone, first |
| `docs/ux/briefs/` | **150 screen briefs** — one per screen, each carrying its requirement rows *verbatim*, its states, its entry and exit, its realistic data volume, and which numbers carry provenance. Paste `docs/ux/claude-design-context.md` plus **one** brief per design session; the design system is already loaded in the tool, so the briefs carry no visual instruction. `docs/ux/briefs/README.md` states the loop. | Designers |
| `docs/tasks/` | **372 engineering tasks** in 19 files. Each names its requirement rows, its screen (`DESIGN: SCR-… → PENDING` until the screen is approved), its acceptance criteria copied verbatim from the PRD, and — for studio tasks — the POC files to port and the defects to fix. Every row lands in exactly one task or is explicitly a law enforced elsewhere. `docs/tasks/README.md` states the rules. | Engineers, QA |

**The thread:** a requirement points to its screen, the screen points to its task, the task points
back at the requirement. Ask "is feature X built?" and you can follow one line from this suite to
running software. Registers of record for what is still undecided: `registers/conflicts.md` (in-suite
contradictions, recorded and never silently resolved) and `registers/open-questions.md`.

## Document map

The suite tree, matching the approved design spec §4 exactly (paths relative to `docs/prd/`):

| Path | Purpose | Status |
|---|---|---|
| `00-README.md` | How to read: tagging, tiers, IDs, doc map (this document) | reviewed-pending-owner |
| `01-product-overview.md` | Vision, goals, product principles, glossary, market framing | reviewed-pending-owner |
| `02-personas.md` | 12 personas, each documented independently | reviewed-pending-owner |
| `03-journey-map.md` | Globalized 9-stage EPC journey + customer journey C1–C13 | reviewed-pending-owner |
| `04-business-model.md` | Packaging convictions, tier architecture, meters, trial, soft-block law, market price-book architecture, India book as source-derived baseline | reviewed-pending-owner |
| `foundations/F1-global-market-framework.md` | Market packs: countries, currencies, tax schemes, units, subsidy/compliance/calling rules; India = first pack | reviewed-pending-owner |
| `foundations/F2-roles-and-permissions.md` | ~12 fixed preset roles; per-module permission matrices | reviewed-pending-owner |
| `foundations/F3-localization.md` | EN/HI/MR launch; translation architecture; formats | reviewed-pending-owner |
| `foundations/F4-data-integrity.md` | F4 — Data integrity: the server owns truth, concurrency and conflict resolution, nothing captured is lost | reviewed-pending-owner |
| `foundations/F5-customer-link.md` | No-login tokenised customer journey (proposal → progress → handover) | reviewed-pending-owner |
| `foundations/F6-notifications-and-search.md` | Notification matrix per persona; global search | reviewed-pending-owner |
| `foundations/F7-design-language.md` | `design/ds-source` as binding visual language; V2 UX principles | reviewed-pending-owner |
| `foundations/F8-data-honesty.md` | Provenance tiers; money-never-stale; indicative labelling | reviewed-pending-owner |
| `modules/M01-onboarding-and-tenant-config.md` | Onboarding and tenant configuration | reviewed-pending-owner |
| `modules/M02-crm-and-leads.md` | CRM and leads | reviewed-pending-owner |
| `modules/M03-marketing.md` | `[BRIEF — new scope]` Campaigns and lead capture across Email, WhatsApp, Facebook, Instagram, SMS, feeding the sales pipeline | reviewed-pending-owner |
| `modules/M04-survey.md` | Survey | reviewed-pending-owner |
| `modules/M05-design-studio.md` | Flagship; census-grounded baseline this pass (DD13) | reviewed-pending-owner |
| `modules/M05-studio/` (12 files) | The Design Studio sub-suite — pass-two deep-dive from the POC codebase (1,551 features, 54 owner rulings). Start at `00-overview.md` — its §5b carries the binding build strategy: the studio is a PORT of the existing POC codebase (engineering core + tests preserved, UI rebuilt, defects/features applied), never a from-scratch rebuild. | reviewed-pending-owner |
| `modules/M06-proposals.md` | Proposals | reviewed-pending-owner |
| `modules/M07-sales-execution.md` | My Day, follow-ups, voice agent, close | reviewed-pending-owner |
| `modules/M08-projects.md` | Projects | reviewed-pending-owner |
| `modules/M09-field-workforce.md` | `[BRIEF — new scope, TrackoBit-informed]` Live location, attendance, visit tracking, route timeline, site check-in/out, geofencing | reviewed-pending-owner |
| `modules/M10-hr-lite.md` | `[BRIEF — new scope]` SME-weight HR supporting EPC operations | reviewed-pending-owner |
| `modules/M11-payments-and-collections.md` | Tenant-side money (tranches, BYO gateway, receipts) | reviewed-pending-owner |
| `modules/M12-platform-billing.md` | SaaS subscription lifecycle, entitlements, dunning, invoicing | reviewed-pending-owner |
| `modules/M13-dashboards-and-reporting.md` | Dashboards and reporting | reviewed-pending-owner |
| `registers/conflicts.md` | Contradictions + source gaps, recorded not resolved | reviewed-pending-owner |
| `registers/enhancements.md` | Every `REC` in one place with rationale | reviewed-pending-owner |
| `registers/open-questions.md` | Decisions V2 still owes an owner ruling | reviewed-pending-owner |
| *retired: PRD authoring process* | This spec, the authoring plan, task briefs, extraction ledger. Process artifacts — not product content | — (process) |

**Status vocabulary (set by Task 26, the suite-wide consistency pass):** `reviewed-pending-owner`
means the document has passed its authoring task's review cycle, the Task 26 consistency pass, and now awaits the owner's
sign-off. The per-document `Status:` header lines keep the template's `draft` value until the
owner signs off, at which point they flip to `reviewed` — this doc-map column is the suite-level
status of record in the meantime. The three registers are living documents; their status marks the
state of their contents as of the Task 26 pass.

**Register-naming note:** the three files under `registers/` use descriptive filenames
(`conflicts.md`, `enhancements.md`, `open-questions.md`) and are **deliberately
not R-numbered** — the source corpus already has its own rulings numbered R1–R20, and giving the
registers numbers of their own would collide with that scheme in conversation and in cross-references.

## The document template

Every foundation PRD (`foundations/F1`–`F8`) and every module PRD (`modules/M01`–`M13`) uses one
template, verbatim:

```markdown
# <ID> · <Title>
Status: draft | reviewed · Origin mix: SRC/BRIEF/REC · Depends on: <doc list>

## 1. Purpose & scope        (what this module is, what it is explicitly not)
## 2. Personas & surfaces    (which of the 12 personas; Mobile/Web emphasis per feature)
## 3. Feature areas          (repeating block per area:)
### <ID>.<n> — <Feature area name>
| ID | Requirement | Tag + source pointer | Tier |
Behavior detail (prose per requirement: flows, states, validation, empty states)
Permissions: reference to F2 matrix rows
Edge cases & what-goes-wrong (carried from source, each item present)
Acceptance criteria (Given/When/Then per P0 requirement)
Localization notes · Analytics events
## 4. Cross-module contracts (what this module expects from / provides to others, product level)
## 5. Non-goals              (explicit, with v1 rationale where source-derived)
## 6. Open questions         (mirrored into registers/open-questions.md)
```

Notes on using the template:
- Section 3 repeats once per feature area within the module; each feature area gets its own
  `<ID>.<n>` heading and its own requirement table followed by the prose blocks listed above.
- "Behavior detail," "Edge cases & what-goes-wrong," "Acceptance criteria," "Localization notes,"
  and "Analytics events" are prose/sub-list blocks under each feature area, not further
  subsections — they follow the requirement table in the order shown.
- Every P0 requirement gets at least one Given/When/Then acceptance criterion. P1/P2 requirements
  get one where the behavior is non-obvious.
- Section 6 (Open questions) in every document is mirrored into
  `registers/open-questions.md` — the register is the suite-wide rollup; the module section is
  the reader's local view.

## Tag vocabulary (origin, never mixed)

Every requirement row carries exactly one origin tag, plus an exact source pointer for `SRC`:

- **`SRC`** — source-derived; carries an exact pointer (D-number, ruling, doc §) back into the
  `docs/` corpus. The default tag for anything extracted from the corpus.
- **`BRIEF`** — mandated by the owner's V2 brief, not present in v1 source (e.g. marketing, field
  workforce, HR, Google login, global-first framing).
- **`REC`** — recommended enhancement. A `REC` requirement lives in its module, for context, **and**
  in `docs/prd/registers/enhancements.md`, with rationale. **`REC` is never mixed with source truth** —
  it is never phrased or tabled as if it were `SRC` or `BRIEF`, and a reader must always be able to
  tell, from the tag alone, that a `REC` item is a recommendation the suite is making, not a
  requirement the corpus or the brief already established.

## Tier definitions

Every requirement carries exactly one priority tier. No dates, no phases, no build plan (DD4)
attach to any tier — tiers rank importance, not schedule:

- **P0 — core.** Must exist for the module to do its job at all.
- **P1 — important.** Materially strengthens the module; the module is usable without it.
- **P2 — later.** Desirable, lowest urgency; explicitly not required for a usable v1 of the module.

## ID scheme

Requirement IDs are stable and are what registers and cross-references point to:

- Format: `<prefix>-<sequence>`, e.g. `M02-31`, `F1-07`.
- `<prefix>` is the module or foundation prefix — `M01`–`M13` for modules, `F1`–`F8` for
  foundations — matching the document map above.
- `<sequence>` is a 2-digit-minimum running number within that prefix (`01`, `02`, … `10`, `31`,
  …), assigned in the order the requirement first appears in its document and never reused or
  renumbered once published, even if a later revision removes the requirement (the ID retires
  with it; it is not reassigned).
- IDs are stable across drafts: once a document assigns `M02-31`, that identifier means the same
  requirement (or its documented supersession trail) for the life of the suite.


## Provenance discipline: the reading rules

Every document in this suite is written under the same three reading rules the design spec
establishes for the source corpus (spec §3). A reader relying on any requirement in this suite
can assume these were followed:

1. **The census rule.** `docs/prd/modules/M05-studio/studio-census.md` is adopted **verbatim** as M05's
   acceptance baseline. The census never shrinks: nothing in it is dropped, downgraded, or
   quietly reworded away between this pass and the dedicated studio deep-dive pass (DD13).
2. **The conflict rule.** Contradictions between source documents — and gaps where cited source
   material is missing or was deleted — are **recorded in `registers/conflicts.md`, never
   silently resolved**. Neither gap is filled by invention; facts that survive only as
   citations are used as-is with the citation noted.

These rules are what keep this suite honest about where a requirement's authority comes
from — a reader who finds a requirement suspicious can always trace it back to a `SRC` pointer,
a `BRIEF` mandate, or a `REC` rationale, and can always check the registers for whether it has
already been flagged as conflicted or open.
