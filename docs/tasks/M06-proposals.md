# M06 · Proposals — engineering tasks

This file carries what is left of bucket **M06 — Proposals** after block 8 shipped the proposals
built without a design: the two tasks that need one — `T-M06-014` (the BOM detail) and `T-M06-021`
(Path A, variants, design staleness and the upgrade offer), both parked until the studio's block —
and the laws every proposal surface keeps. Task ids use the prefix **`T-M06-`**.

**Source docs.** Requirements and acceptance criteria are quoted from
`docs/prd/modules/M06-proposals.md` (rows `M06-01`–`M06-58`).

**The design.** The look of every screen in this file is the approved proposal design
(`CLAUDE.md` §6), built to match at 390 px and 1440 px on the parts block 8 lifted into
`packages/ui` — never a second copy.

Every row in the bucket is dispositioned exactly once in the **Disposition index** at the end of
this file: to a task, to `LAW`, or to a `realized-by` pointer.

---

## Screen tasks

### T-M06-014 · BOM Detail — Path A line items behind the price
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M06-39 (P0)
**DESIGN:** SCR-M06-14
**Why:** on a designed job the owner sees every line, quantity and rate behind the price, and the margin on it.
**Depends on:** T-M06-021
**Parked:** needs the studio's BOM; built with the 3D studio's block (owner ruling 2026-11-13 — proposals ship first).

**Requirements (verbatim):** Verbatim rows live in the PRD; they are
the specification.

**DONE WHEN:**
- Given the BOM detail on a phone, when it renders, then it is a card list with an edit sheet — never a wide table (M06-39).
- three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

**Settle before the build:**
- Whether BOM-detail edits at proposal time live on the proposal's money block or write back to the studio's BOM (M06-39, §M06.6) — ruled: they are the proposal's own money inputs — the per-proposal margin and every line adjustment are stored on the proposal and snapshotted into the version's money block; `bom_line` is read-only to this module and never written (M06-01 makes the BOM the studio's internal object, and a write-back would move the design's fingerprint and stale the proposal from its own edit, M06-46).
- `MAX_MARGIN` (`packages/domain/src/catalog/price-book.ts`) cites a deleted studio row; re-cite it to `M06-39` / `M01-48` here.

---

## Engine, policy and integration tasks

### T-M06-021 · Path A — the studio's hand-off, pre-fill map, variants, staleness and the upgrade offer
**Type:** engine · **Tier:** P0
**Status:** planned
**Owed by `T-FPLAT-029` (`F8-21`):** every tier this map assigns passes `tierFitsBasis(basis, tier)` from `@heliogrid/domain` — never a second copy of the no-design rule.
**Owed by `T-FPLAT-027` (`F8-11`, a law):** every shading output the document prints carries the shading model's limit text beside it — beam-only, linear in unshaded area, no bypass-diode cliff, no string mismatch, so partial-shade losses read optimistic — at every scale.
**PRD rows:** M06-03 (P0), M06-46 (P0), M06-47 (P0), M06-56 (P0), M08-04 (P0), M08-05 (P0), M08-16 (P0)
**Design:** as T-M06-017
**Why:** on a designed job every number arrives derived from the real model, the customer sees one recommended system, and a proposal whose design changed says so before anyone sends it.
**Depends on:** T-M06-025a
**Parked:** needs a design; built with the 3D studio's block (owner ruling 2026-11-13 — proposals ship first).

**Requirements (verbatim):**

- **M06-03** (P0) — **What a design pre-fills — the pre-fill table, carried faithfully.** Step 3 Solar System Setup: capacity, type, category **derived** (without a design: typed). Step 4 Performance Metrics: generation from the real shading simulation, **derived** (without: AI auto-fill, **estimated**). Step 5 Financial Data: savings/payback from the real BOM pricing, **derived** (without: AI auto-fill, **estimated**). Step 8 Components: the actual BOM, **derived** (without: picked from catalog, **assumed**). Cost: the real bill of materials (without: a typed lump sum). A typed Path B figure carries the conservative tier per F8's recorded reading (`F8-21`).

**DONE WHEN:**
- Given a completed design, when Generate proposal is tapped in the studio, then the builder opens on Path A with steps 3/4/5/8 pre-filled `derived` per the pre-fill table (M06-03, M06-05).
- Given any Path B version, when document or link render, then the verbatim indicative line is present in the reading flow; given a remote-survey-based design, then the basis line renders (M06-51).
- Given a design with variants, when the customer-facing rendering is produced, then exactly one recommended system shows by default (M06-56).
- Given a design edit after generation, when the proposal list or detail renders, then the stale state is visible with Regenerate offered; no flag was stored — removing the design edit restores freshness by comparison alone (M06-46).
- Given a completed design on a lead with an indicative proposal, when the upgrade is offered, then the changed figures and their tier changes are shown before commit, and declining changes nothing (M06-47).
- Given a project, when its detail screen opens, then the stage timeline, design, proposal, payments, documents, blockers and activity are all present on one screen, each naming the object it reads (M08-16). *(Moved from T-M08-002 by owner ruling 2026-11-10: its proof needs the design, the proposal and the payments on the project.)*
- Given the project has just been created, when it opens, then the customer, site, approved design, accepted proposal version and the accepted version's tranche schedule are present by reference, and the document checklist is seeded for this project's segment from the tenant's market pack (M08-04, M08-05). *(Moved from T-M08-007 by owner ruling 2026-11-10: its proof needs the approved design.)*

**Settle before the build:**
- The path-choice question while no studio exists (M06-05) — ruled: it is not asked; the entry opens the builder without a design, and the question returns with the studio (owner ruling 2026-11-13: a question with one answer is a wasted tap).
- The Add 3D Design closing sheet while no studio exists (M06-17) — ruled: not shown; it returns with the studio's hand-off (`T-M06-021`) — a doorway to nothing is a dead end.
- What a V1 document states as its basis when no survey exists behind it (M06-51; `F8-20`, `F8-22`) — ruled: the basis is derived at Generate from the design's roof-capture provenance tier and frozen into the version's honesty labels — no design keeps `F8-20`'s indicative line; a design whose roof tier is not `measured` renders `F8-22`'s remote line verbatim; a `measured` roof, M04's V2 path, carries no basis line; and no field is added to the design (`F8-21` reduces roof capture to exactly two flows, so the tier already names the flow, and a stored basis would be a second copy of it).

---

## Laws (enforced through screens and review, no standalone build)

These rows constrain what may be built; none of them is a buildable thing on its own. Each is
enforced by the tasks named against it plus review of every M06 surface.

**M06-01** (P0) — **One object, not two.** No separate "quote" exists anywhere in the product: the **proposal** is built in the eleven steps, contains the pricing, and is what gets versioned, sent and accepted. The **BOM** is a different, internal object — engineering/procurement-facing, produced by the design studio, feeding the proposal's price when a design exists (Path A). **Path B has no BOM at all** — just a system cost typed into step 3. Naming is closed by ruling: the entity and every rendered document say **"Proposal"** in every launch locale; "quote"/"quotation" are banned from identifiers and interface strings, with global search accepting them as query aliases only (`F3-11` consumed; the alias surface is `foundations/F6`'s, the customer-link wording `foundations/F5`'s).

*Enforced by:* every M06 screen task (no second "quote" object or surface may appear), and by
string review of identifiers and interface copy in T-M06-001 … T-M06-020 and T-M06-017's document
rendering. The BOM stays the internal object of T-M06-014; Path B never gains one.
*Acceptance covering it (verbatim):* Given any tenant surface or rendered document in any launch locale, when proposal vocabulary renders, then the single term "Proposal" (per-locale per `F3-11`) is used and no "quote"/"quotation" string appears outside search-query aliasing (M06-01).

**M06-32** (P0) — **Component kits were considered and REMOVED — speed comes from duplication, and that decision is carried, not reopened.** The three speeds: **duplicate** (components come with it — the common residential path) · **Path A** (the BOM fills all five) · genuinely new with nothing to duplicate → pick five (*"slower, and rare"*). The lesson is carried verbatim as product law: *"if mandatory components ever start costing minutes rather than seconds, the fix is to make duplicating easier, not to make components optional."*

*Enforced by:* T-M06-010 (no kit concept on the components step), T-M06-019 (duplicate is the
offered speed path) and review — a kit feature is out of scope and the components gate is never
made optional.
*Acceptance covering it (verbatim):* Given a duplicated proposal, when step 8 renders, then every component of the source proposal is present and the counter is already satisfied (M06-32; §M06.8).

---

## Realized elsewhere

**M06-33** (P2, context) — battery-economics modeling is a recommended enhancement, not v1 scope;
the transactional battery flow (capacity, chemistry, cost, tax, warranty) is what this bucket
builds (T-M06-005, T-M06-010).
*realized-by:* no v1 task — `REC` (a future battery-economics layer riding the F8-23
honesty laws).

---

## Disposition index

| Row | Disposition |
|---|---|
| M06-01 | LAW |
| M06-02 | T-M06-001 |
| M06-03 | T-M06-021 |
| M06-04 | T-M06-017 |
| M06-05 | T-M06-001 |
| M06-06 | T-M06-003 |
| M06-07 | T-M06-003 |
| M06-08 | T-M06-004 |
| M06-09 | T-M06-005 |
| M06-10 | T-M06-006 |
| M06-11 | T-M06-007 |
| M06-12 | T-M06-008 |
| M06-13 | T-M06-009 |
| M06-14 | T-M06-010 |
| M06-15 | T-M06-011 |
| M06-16 | T-M06-012 |
| M06-17 | T-M06-013 |
| M06-18 | T-M06-002 |
| M06-19 | T-M06-001 |
| M06-20 | T-M06-022 |
| M06-21 | T-M06-002 |
| M06-22 | T-M06-002 |
| M06-23 | T-M06-022 |
| M06-24 | T-M06-002 |
| M06-25 | T-M06-023 |
| M06-26 | T-M06-028 |
| M06-27 | T-M06-010 |
| M06-28 | T-M06-010 |
| M06-29 | T-M06-010 |
| M06-30 | T-M06-005 |
| M06-31 | T-M06-026 |
| M06-32 | LAW |
| M06-33 | realized-by: no v1 task — REC |
| M06-34 | T-M06-024 |
| M06-35 | T-M06-005 |
| M06-36 | T-M06-022 |
| M06-37 | T-M06-022 |
| M06-38 | T-M06-024 |
| M06-39 | T-M06-014 |
| M06-40 | T-M06-005 |
| M06-41 | T-M06-024 |
| M06-42 | T-M06-016 |
| M06-43 | T-M06-025 |
| M06-44 | T-M06-025 |
| M06-45 | T-M06-025 |
| M06-46 | T-M06-021 |
| M06-47 | T-M06-021 |
| M06-48 | T-M06-019 |
| M06-49 | T-M06-027 |
| M06-50 | T-M06-015 |
| M06-51 | T-M06-017 |
| M06-52 | T-M06-029 |
| M06-53 | T-M06-018 |
| M06-54 | T-M06-018 |
| M06-55 | T-M06-030 |
| M06-56 | T-M06-021 |
| M06-57 | T-M06-018 |
| M06-58 | T-M06-031 |
