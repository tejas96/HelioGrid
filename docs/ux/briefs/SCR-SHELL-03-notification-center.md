# SCR-SHELL-03 · Notification Center

Bell + badge + grouped actionable notification list, filterable by type-group and read state, every item deep-linking with its one-step act.

**Module:** SHELL · **Personas:** All staff; EPC Owner additionally receives the two pushed monthly summaries · **Context of use:** one shared surface on both platforms — bell in the web header, bell in the mobile shell (F6.4 behavior detail). Read on phones in the field.

## Entry & exit

Reached from: the bell in the app shell on both platforms (F6-17; the shell is SCR-SHELL-01). Leads to: every item deep-links to its subject and offers its one-step act where the recipient holds it (F6-17); a recipient who has lost the subject's visibility gets the honest landing (F6-16's edge, carried in this screen's states). If the PRD does not pin an entry/exit beyond these, it is not pinned by PRD — designer decides, note the decision.

**Decisions made in design (2026-08-19) — the brief left these open; later screens inherit them.**

1. **The centre is the product's overlay grammar, not a screen you travel to** (`F7-21`). Phone: a `Sheet` at 92%, modal, focus trapped and handed back to the bell. Desktop: a 520px `DetailPanel` anchored under the header, **non-modal** — no backdrop, no scroll lock — with the content column inset by the panel's width, because the page beside a 520px panel is still the user's work.
2. **Exits** — an item card's whole face → its subject; a group member's name → its record; each one-step act → the act; `Show older` → the next page; `Mark all read` → the same list with nothing unread; `Clear filters` → the unfiltered list; the honest landing's `Back to the list`; close / Esc / drag → back to the home.
3. **A group row is not an exit.** Grouping is presentation only (`F6-12`), so the group has no subject of its own — its members carry the links. A bulk act reaches its members through its subject record, never by opening 400 rows in place.
4. **A monthly summary is read where it arrived** (`M13-21`'s own reason), with the full dashboard one control away. A summary that only deep-links to the dashboard the owner never opens has not been read either.
5. **A lifecycle chip sits in `RecordCard.marks`, not `chip`.** `chip` renders on the name's line, and a notification's name is a sentence — at 335px that pushed it to four lines, and Hindi and Marathi push further.
6. **Row acts are `secondary`, never the near-black primary.** On an inbox nothing is *the* primary action — it belongs to the record the row opens — and a column of near-black pills makes the identity marker meaningless.
7. **An act on a nested member row is an icon button; an act on a card is a verb.** A card has width for "Send over WhatsApp"; a member row carries a wrapping record name in the same 335px. The icon button keeps the 44px floor and the full accessible name, and the same act returns with its verb on the record the row opens.
8. **Nesting reads from elevation and position, never an indent.** Group members run the full row width at `e1` under the group's `e2`.
9. **A control with nothing to do removes itself rather than going grey** (`F4-27`) — `Mark all read` is absent when nothing is unread.


## Requirements (verbatim)

### docs/prd/foundations/F6-notifications-and-search.md

- **F6-12** (P1) — **Grouping: standard events group; nothing important hides.** The centre groups same-type events on the same subject class ("3 proposals opened today") with each item still individually reachable; immediate-class events (F6-13) never group. Grouping is presentation only — every record still exists individually (F6-06).
- **F6-17** (P0) — **One notification centre: the bell, the badge, the list.** The badge counts unread from the record (never from push state); the list renders grouped per F6-12, filterable by type-group and read state, newest first; every item deep-links and offers its one-step act where the recipient holds it (F6-02).
- **F6-19** (P2) — **History is bounded and honest:** the centre keeps a practical horizon of items (with read state); the underlying facts live on their records' timelines forever — the centre is an inbox, not an archive, and says so at its horizon. _(non-UI half, build-side: bounded retention horizon; underlying facts persist on record timelines forever — for awareness, not for drawing)_

### docs/prd/modules/M13-dashboards-and-reporting.md

- **M13-21** (P1) — **If the owner never opens it, a short monthly summary is pushed in-app** — where they actually read things; the same fix as Agent performance's. The notification type registers with `foundations/F6`. _(non-UI half, build-side: monthly summary generation and push scheduling; notification type registers in F6 — for awareness, not for drawing)_
- **M13-45** (P1) — **A monthly agent summary is pushed in-app to the owner** — the nobody-opens-it fix, shared with M13-21's dashboard summary; the notification type registers with `foundations/F6`. _(non-UI half, build-side: monthly agent summary generation and push; type registers in F6 — for awareness, not for drawing)_

## States

- **loading**
- **empty** — no notifications
- **error**
- **unread-badge** — badge counting unread from the record, matching the list (F6-17)
- **grouped** — same-type events on the same subject class grouped, each item still individually reachable; immediate-class items never grouped (F6-12)
- **filter-active** — filtered by type-group and/or read state (F6-17)
- **honest-landing-subject-gone-or-out-of-scope** — a recipient who has lost the subject's visibility gets the honest landing (F6-16 edge, F6.2)
- **system-announcement-distinct** — system announcements render distinctly so product news never masquerades as tenant work (F6.4 behavior detail)
- **history-horizon** — the centre says at its horizon that it is an inbox, not an archive (F6-19)
- **mark-all-read** — mark-all-read exists and is honest: it marks read, it deletes nothing (F6.4 behavior detail)
- **summary-received** — the owner's monthly dashboard summary / monthly agent summary arrived in-app (M13-21, M13-45)
- **summary-opened** — a monthly summary item opened via its deep link (M13-21, M13-45)

## Data volume

Design at dozens of items across the practical horizon (F6-19), newest first, with groups like "3 proposals opened today" (F6-12) and a bulk act summarised as one grouped notification — the PRD's own case is "400 leads imported" as one row, not 400 facts (F6.3 edge cases).

## Numbers carrying provenance

Each of these user-visible numbers/dates carries its F8 provenance tier in the design:

- The unread badge count — derived from the records, never from push state (F6-17)
- Group counts on grouped items ("3 proposals opened today") (F6-12)
- Item timestamps ordering the list newest first (F6-17)
- Whatever figures the two monthly summaries surface come from their owning module's published numbers with qualifiers intact (M13-21, M13-45)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline-cached` state and a Context-of-use sentence about reading cached items in the field. Both are deleted. Requirement row **`F6-18` ("The centre works offline")** is deleted whole: cached reads, up-only read-state sync and arrival-with-sync were its entire content.*
