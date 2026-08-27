# SCR-SHELL-02 · Global Search

One app-wide search box finding leads, customers, sites, proposals, projects, catalog items and people by name, phone or city; results grouped by entity, deep-linking.

*Note (pre-flight pass, 2026-08-07): this line previously read "grouped by entity, **scope-filtered**, deep-linking". No requirement row on this screen asks for a scope control. `F6-20`'s only scope language — "plus **people** (employee records) within the searcher's people-records scope" — is a **permission boundary on which results exist**, not a filter the user operates. Do not draw a `ScopeToggle` or a scope `FilterChips` row here; there would be no requirement row to point at in the self-audit, and it would set a precedent later list screens copy.*

**Module:** SHELL · **Personas:** All staff · **Context of use:** the one box lives in the app shell on web and mobile (F6-20). Used at a desk on the desktop shell and on a phone in the field. Phone-number queries are the highest-value path: the phone is the CRM's identity.

## Entry & exit

Reached from: the search box in the app shell on web and mobile (F6-20; the shell itself is SCR-SHELL-01). Leads to: every result deep-links to its record (F6-20); a junk-lead result offers Reopen from search — the one surface that still finds it (F6-23). If the PRD does not pin an entry/exit beyond these, it is not pinned by PRD — designer decides, note the decision.

**Decisions made in design (2026-08-19) — the brief left these open; later screens inherit them.**

1. **Exit — `See all` leads to that entity's own list screen with the query applied.** The rows themselves deep-link to the record (`F6-20`). The count pill is *all* matches; the meta line says how many you are looking at ("Top 3 of 23 · best match first").
2. **Search is a sheet on the phone and a layer over the content column on desktop — never a page.** `F7-21`'s one grammar: modal, focus trapped and handed back to the control that opened it, Esc, a 44×44 close. On desktop the rail and header stay crisp above the backdrop, so the query being edited is never behind the blur it caused.
3. **A result is a row, not a record card.** A working list is a decision surface and takes `RecordCard`; a search hit is a wayfinder and takes `ListRow`, same props at both widths.
4. **Every result row is a real `<a href>`** — `F6-20` requires the deep link, and a bare `onClick` row is neither keyboard-operable nor named. The whole row is the target, ringed by the system's focus style, named record-first. **Every later result surface in this product does the same.**
5. **The one exception is a row carrying a second act.** The junk row's Reopen is a real button in the trailing slot, so the *name* is the link and carries the 44px floor itself — two acts cannot share one target, and a button inside a link is not legal markup.
6. **A group with no matches keeps its place and teaches in one line** ("Catalog items are found by name — try a wattage like 540 W"). When nothing matches at all, that becomes one teaching empty state instead of seven quiet lines.
7. **Expressive density at both widths** (`F7-17`) — the screen is a wayfinder, not a data table. What desktop changes is how much is on screen (three columns, more rows per group), never spacing or radius. The functional rhythm belongs to the list screens `See all` opens.


## Requirements (verbatim)

### docs/prd/foundations/F6-notifications-and-search.md

- **F6-20** (P0) — **One global search box, everywhere:** finds **leads, customers, sites, proposals, projects and catalog items** — by name, phone or city — plus **people** (employee records) within the searcher's people-records scope. One box in the app shell on web and mobile; results grouped by entity type; every result deep-links. *(The journey's own list says "quotes" — rendered here as proposals per the naming ruling, with the alias law at F6-22.)*
- **F6-23** (P0) — **Junk leads surface in search only.** A lead marked junk leaves every queue and list but is never deleted; search is the one surface that still finds it (with its junk state plain), and Reopen exists from there for the rare mistake. _(non-UI half, build-side: junk leads leave every queue and list but are never deleted — for awareness, not for drawing)_

## States

- **loading**
- **empty** — teaching, never a dead-end: the PRD's own example of an empty-results teach is "no leads match — check spelling or search a phone number" (F6.5 behavior detail)
- **error**
- **results-grouped** — results grouped by entity type, every result deep-linking (F6-20)
- **empty-teaching-no-results** — see empty above
- **junk-lead-result** — a junk lead returned with its junk state plain and Reopen available (F6-23)

## Data volume

Results span seven entity groups — leads, customers, sites, proposals, projects, catalog items, people (F6-20). Leads in this product exist at 200-lead list scale, so design a common-name or city query returning matches across several groups at once, and a phone-number query resolving to one exact record first.

## Numbers carrying provenance

The slice rows put no money or computed number on this screen. Result rows carry record identity facts — name, phone number, city, stage/status (F6.5 behavior detail). Whatever number/date a result row shows carries its F8 provenance tier in the design.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state and an `offline-synced-cache` state searching the device's synced cache with a staleness indication, plus matching clauses in Context of use and Numbers carrying provenance. All are deleted. `F6-23`'s "leaves every queue and list" is about work queues, not sync, and is untouched.*
