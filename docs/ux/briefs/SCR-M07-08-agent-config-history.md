# SCR-M07-08 · Agent Config History

Read the append-only agent config versions; answer disputes per call.

**Module:** M07 · Sales Execution · **Personas:** EPC Owner only (`F2.M01.configure-agent`) · **Context of use:** web emphasis (M07 §2) — a read-mostly reference surface, "kept quietly in the background", consulted when a dispute or a mid-campaign change needs answering.

## Entry & exit

Reached from: tenant configuration's agent & voice surface list — M01-57 names "Change history (versioned config, kept quietly)"; publishing from any config surface creates the versions this screen reads (M07-14). Leads to: per-call dispute answering — each call records which settings answered it (M07-14), and the call record names its config version (M07-38's record, SCR-M07-13; the queue names a differing version, M07-36, SCR-M07-12). Not otherwise pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-14** (P0) — **Agent configuration is versioned-append: publishing a change creates a new version; nothing is edited in place. Calls already queued keep the version they were queued with, and the owner is told so when publishing mid-campaign.** A change-history screen reads the versions — kept quietly in the background; each call records which settings answered it, so a dispute is answerable. _(non-UI half, build-side: versioned-append publishing; queued calls keep their queued version; per-call version recorded — for awareness, not for drawing)_

## States

- **Loading** (base) — reading the version list.
- **Empty** (base) — a tenant that never published an edit still has its seeded working config; the history honestly shows the starting version rather than a blank.
- **Error** (base) — read failure acknowledged honestly.
- **version-list** — the append-only list of published versions; nothing is edited in place, so the list only ever grows (M07-14).
- **mid-campaign-publish-notice** — the moment of publishing while calls sit queued: the owner is told that calls already queued keep the version they were queued with (M07-14; §M07.3 acceptance: ten queued calls each dial with their queued version and the call record names it).

## Data volume

An append-only version list that grows over the tenant's lifetime — every publish adds one. Design for a history long enough to answer "which settings answered this call from months ago" (each call records its version, M07-14), not a handful of rows.

## Numbers carrying provenance

- **Version identity and its publish timestamp/actor** — server-recorded facts; the version id is the same one named on queue entries (M07-36) and call records (M07-38), so it must render identically across those surfaces.
- No money figures appear on this screen.
