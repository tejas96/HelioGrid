# SCR-M06-16 · Proposal Versions

Immutable version history: v1 vs v2 with what changed and why.

**Module:** M06 (Proposals — the commercial document: built, priced, versioned, generated, shared) · **Personas:** Sales Executive (primary), Sales Manager (watches versions and discounts through the audit trail, per the module's persona rows), EPC Owner (full capability) · **Context of use:** review context — desk or phone; version reads are reads (never paused in any billing state, `M06-26` per the module); version creation happens elsewhere, through the Generate gate.

## Entry & exit

Reached from: not pinned by PRD — designer decides, note the decision (the module lists "versions" among its surfaces; the natural neighbour is Proposal Detail, SCR-M06-18, whose regenerate/upgrade acts create the versions this screen shows). Leads to: not pinned by PRD — designer decides, note the decision (a version is the unit of share, tracking, acceptance and the tranche schedule, per §M06.7 behavior detail — a version's rendering is the document, SCR-M06-17).

## Requirements (verbatim)

### From `prd/modules/M06-proposals.md`

- **M06-42** (P0) — **Proposal versions are immutable, append-only and server-numbered.** Each version snapshots the **full eleven-step field set plus the computed money block**, and **pins** the catalog release, price-book version and market-pack version it was computed from (`F8-14` consumed; `M01-43`/`M01-44` consumed). Each version carries a **change note — "what changed and why."** The versions screen shows v1 vs v2 **with what changed, and why**. _(non-UI half, build-side: versions immutable, append-only, server-numbered; snapshot pins catalog, price-book, pack versions; mandatory change note — for awareness, not for drawing)_

## States

- **loading** — the version history loading.
- **empty** — a proposal still in draft: no version exists before the first successful Generate (drafts have no version number — the first successful Generate creates v1, §M06.7 behavior detail).
- **error** — a failed history load stated plainly.
- **diff-view** — v1 vs v2 with what changed, and why.
- **change-note** — each version's mandatory change note — "what changed and why" (pre-filled with the detected input changes at regenerate, editable by the author, per §M06.7 behavior detail).
- **pinned-inputs** — the version's pinned catalog release, price-book version and market-pack version, visible as what the version was computed from.

## Data volume

Several versions on one proposal — a negotiated deal accumulates them (customer-asks-for-changes, regenerate-on-stale, the Path B upgrade each create one, per §M06.7). Each version carries the full eleven-step field set plus the computed money block; design the v1-vs-v2 comparison at that snapshot size, at phone width.

## Numbers carrying provenance

- **Version numbers** — server-assigned, append-only; record facts.
- **Version timestamps** — record facts, rendered per `F3-22` (the module's localization note).
- **Changed money figures in the diff** — each figure shows at the provenance tier its own version pinned; sent versions keep their figures forever (`M06-43` context: a later price-book change never edits a sent version).
- **Pinned input versions** (catalog release, price-book version, market-pack version) — identifiers of record, the basis of derived staleness.
