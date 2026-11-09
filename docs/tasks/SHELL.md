# Tasks — SHELL (app shell & platform surfaces)

Task-id prefix: `T-SHELL-`. RFC and part-size rules live in `docs/tasks/README.md`.

---

### T-SHELL-002 · Global Search
**Type:** screen · **Tier:** P0
**Status:** planned
**Why:** An installer types a phone number from anywhere in the app and the caller's lead, site, proposal or project is one tap away — the phone is the CRM's identity; without it a rep scrolls lists to find who is calling, and a lead marked junk by mistake can never be found again.
**PRD rows:** F6-20, F6-23
**DESIGN:** SCR-SHELL-02

**PRD rows (verbatim):**

- **F6-20** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **One global search box, everywhere:** finds **leads, customers, sites, proposals, projects and catalog items** — by name, phone or city — plus **people** (employee records) within the searcher's people-records scope. One box in the app shell on web and mobile; results grouped by entity type; every result deep-links. *(The journey's own list says "quotes" — rendered here as proposals per the naming ruling, with the alias law at F6-22.)*
- **F6-23** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **Junk leads surface in search only.** A lead marked junk leaves every queue and list but is never deleted; search is the one surface that still finds it (with its junk state plain), and Reopen exists from there for the rare mistake.

**Data model:** none — reads the scope-enforced search read over leads, customers, sites, proposals, projects, catalog items and people that `T-FPLAT-020` builds on the owning modules' tables; the junk state and the Reopen transition are `T-M02-015`'s over `lead`.
**Contract:** none of its own — it calls:
- the one search read — a query returns results grouped by entity type, each carrying its deep-link target and its identity facts (name, phone, city, stage), a lead carrying its junk state, ranked plain — to be declared by `T-FPLAT-020` in `packages/contracts/src/search.ts`
- Reopen on a junk-lead result — the lead lifecycle's reopen transition, to be declared by `T-M02-015`
- See all — each entity's own list screen with the query applied; those routes are the owning modules'
Domain types it reads, adds none: the search-alias law and the plain ranking are `T-FPLAT-020`'s.
**Depends on:** `T-FPLAT-020` (the read, the scope enforcement, the alias law) · `T-SHELL-001` (the `SearchField` in the shell that opens this sheet) · `T-M02-015` (the junk state and Reopen) · `T-M01-025` (migration 0002 — the session whose scopes gate results) · `packages/ui` `SearchField`, `Sheet`, `ListRow` (landed).
**Out of scope:** scope enforcement, the "quote"/"quotation" alias, ranking and the junk-only surfacing rule — `T-FPLAT-020`; the junk and reopen lifecycle — `T-M02-015`; the lists See all opens — `T-M02-003` and each entity's own list task; the dedupe sheet, the one sanctioned cross-scope reveal — `T-M02-008`; the shell frame around the box — `T-SHELL-001`.
**DONE WHEN:**
- Given a junk lead, when its phone number is searched by a user whose scope contains it, then it returns with its junk state visible; and given any list or queue, then it does not appear there (F6-23). → proof: QA web · ios · android search the junk lead's phone as a user whose scope holds it: the row carries the junk mark and a Reopen button in its trailing slot, and the lead inbox and every queue omit it; the scope filter is unit-proven at `T-FPLAT-020`
- (F6-20 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion.) → proof: QA web · ios · android one box in the web header and in the mobile shell; a city query returns rows in every matching entity group, each row a real link to its record; "quote" returns Proposals with every label reading Proposal
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web) every listed state at 1536px · QA (phone) every listed state at 375px

---

## Disposition index

Covers only the screen-task rows quoted in this file. Rows whose engine/policy halves live in
module buckets are dispositioned there.

| Row | Disposition |
|---|---|
| F1-59 | T-SHELL-001 (surface) — non-UI half in owning module file |
| F7-22 | T-SHELL-001 (surface) — non-UI half in owning module file |
| M01-16 | T-SHELL-001 |
| M01-17 | T-SHELL-001 (surface) — non-UI half in owning module file |
| M02-06 | T-SHELL-001 (shell placement) — capture-screen half on SCR-M02-01 in the M02 task file |
| M07-46 | T-SHELL-001 |
| M13-10 | T-SHELL-001 (surface) — non-UI half in owning module file |
| F6-20 | T-SHELL-002 |
| F6-23 | T-SHELL-002 (surface) — non-UI half in owning module file |
| F4-27 | T-SHELL-003 (surface) — the never-blocking half; the row itself is dispositioned in `docs/tasks/F-platform.md` |
| F6-07 | T-SHELL-003 (surface) — non-UI half in owning module file |
| F6-12 | T-SHELL-003 |
| F6-17 | T-SHELL-003 |
| F6-18 | *removed 2026-08-07 with the offline/sync deletion — read-state half rehomed to `F6-07`, never-blocking half to `F4-27`, both above* |
| F6-19 | T-SHELL-003 (surface) — non-UI half in owning module file |
| M13-21 | T-SHELL-003 (surface) — non-UI half in owning module file |
| M13-45 | T-SHELL-003 (surface) — non-UI half in owning module file |
