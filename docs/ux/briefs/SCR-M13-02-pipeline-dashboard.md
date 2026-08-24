# SCR-M13-02 · Pipeline Dashboard (Rep's own step-back)

Rep's own step-back: my pipeline value, win rate, proposals out/opened/accepted, follow-up load, target.

**This brief serves one persona: the Sales Executive.** It carries one row, M13-31, and draws the rep's own-scoped step-back and nothing else. The EPC Owner's and Sales Manager's home is a different screen — `docs/ux/briefs/SCR-M13-01-owner-dashboard.md` (SCR-M13-01), which carries M13-29, M13-30, PS-07 and PS-09 and draws the owner and team-scoped manager renderings in full. Do not draw an owner or manager rendering here.

**Module:** M13 · Dashboards & reporting · **Personas:** Sales Executive · **Context of use:** for the Sales Executive this is the secondary "how am I doing" step-back — mobile-first, genuinely, like everything in their day (per `docs/prd/02-personas.md` §Sales Executive, Primary surfaces); it is never how a rep decides who to call.

## Entry & exit

Reached from: from My Day (SCR-M07-01) as the step-back view, secondary to My Day — My Day stays home (M13-31). Leads to: the PRD pins no onward navigation for the rep's own view — not pinned by PRD — designer decides, note the decision. (The owner's and team-scoped manager's entries, the attention-list deep links and the manager's per-rep view are SCR-M13-01's entry and exit, not this screen's.)

## Composed home (M13-10, P0 — this screen is a role home)

This screen is the home of one preset on the precedence ladder, and **a person has exactly one
home, never two competing front doors**. Where the same person also holds another preset, that
preset's *today-work* is composed into THIS screen as a block rather than sent to a second home —
the PRD's own worked example is a rep who is also a surveyor landing on My Day **with today's
visits shown inside it**. The person can still switch: the shell's switcher (`SCR-SHELL-01`) lists
the home of every preset they hold. Design the block seams: this screen must be able to host one
or more foreign today-blocks without the layout breaking or the screen's own purpose being buried.
The ladder itself is a product constant, not tenant configuration (`M13-10`, register `Q5`).

## Requirements (verbatim)

### From docs/prd/modules/M13-dashboards-and-reporting.md

- **M13-31** (P0) — **Sales Executive — home: My Day** (content contract `M07` §M07.1 — overdue · today · agent activity · upcoming; M13-13's separate-block law); **step-back: the rep dashboard, "how am I doing", secondary to My Day** — my pipeline value, my win rate, my proposals out / opened / accepted, my follow-up load, my target if set; their own data only, own-scoped.

## States

- **loading** — base state.
- **empty** — base state.
- **error** — base state.
- **normal** — populated view, own-scoped to the signed-in Sales Executive.
- **own-scope-only** — the Sales Executive's rendering: their own data only, own-scoped — my pipeline value, my win rate, my proposals out / opened / accepted, my follow-up load, my target if set (M13-31).
- **empty-teaching (no data yet)** — a brand-new rep or empty scope is taught what will appear here and why — never a blank or broken chart.
- **no-target** — no target set: everything works, no nag; the "my target" figure simply absent (M13-31).

(No team-scoped or per-rep-view state exists on this screen. Those are SCR-M13-01's `team-scoped` state and its per-rep-view exit, where M13-30 places them.)

## Data volume

Design at realistic volume, not demo volume: a rep's own slice of a 200-lead book — own pipeline value across the CRM's stages, a real month's proposals out / opened / accepted counts, and a follow-up load big enough to matter. Long content scrolls inside its own region. (Attention-list and team/company-scale volumes are SCR-M13-01's brief.)

## Numbers carrying provenance

Every user-visible number below carries its F8 provenance tier (measured / derived / estimated / assumed) in the design; aggregates inherit the weakest tier of their members; money never renders stale as final.

- My pipeline value (money) — M13-31.
- My win rate (rate) — M13-31.
- My proposals out / opened / accepted (counts) — M13-31.
- My follow-up load (count) — M13-31.
- My target if set (money) — M13-31.

(The owner/manager home's figures — cash collected versus due, pipeline by stage, this period against last, forecast marked a projection, win/loss, and the attention list's ages, dates and overdue amounts — render on SCR-M13-01 and are listed in that brief, under M13-14, M13-15 and M13-16.)
