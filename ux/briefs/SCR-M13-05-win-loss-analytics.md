# SCR-M13-05 · Win/Loss Analytics

Win rate with distinct disqualify and lost reason breakdowns by count and value; referral row.

**Module:** M13 · Dashboards & reporting · **Personas:** EPC Owner, Sales Manager · **Context of use:** a periodic step-back read for the two wide-scope personas — web-emphasis with full mobile parity (per `prd/modules/M13-dashboards-and-reporting.md` §2). The numbers are descriptive lessons about closed deals, never a leaderboard.

## Entry & exit

Reached from: not pinned by PRD — designer decides, note the decision. (The owner dashboard carries a **Win/loss** section per M13-14 on SCR-M13-01 and is the natural adjacency, but the PRD does not pin the navigation.) Leads to: not pinned by PRD — designer decides, note the decision; like every dashboard in this module the screen reads, surfaces and links, and never creates (`prd/modules/M13-dashboards-and-reporting.md` §M13.1).

## Requirements (verbatim)

### From prd/modules/M13-dashboards-and-reporting.md

- **M13-23** (P0) — **Both reason lists render, kept distinct.** The early **Disqualify** reasons and the late **Mark lost** reasons are different lessons ("losing a quoted deal is a different lesson from disqualifying a renter on day one") and are never merged: win/loss shows both breakdowns by count and value, sourced from the CRM's own reason sets. The "disqualified early" list is `M02-53`'s state's; the "lost late" list `M02-54`'s — including the `Q21` vocabulary mismatch, carried as the CRM carries it, never repaired here.
- **M13-26** (P1) — **Referral analytics live inside win/loss.** Referral-sourced deals are visible in the win/loss view via the referral row (`M02-16`) — the "came from" chip's reporting face. No credits, no balances (the spec-locked exclusion stands).

## States

- **loading** — base state.
- **empty** — base state.
- **error** — base state.
- **normal** — win rate with both reason breakdowns rendered for the viewer's scope (owner: everything; manager: the team's deals).
- **two-reason-lists** — the defining state: the early **Disqualify** breakdown and the late **Mark lost** breakdown rendered as two distinct lists, by count and value, never merged (M13-23).
- **referral-row** — referral-sourced deals visible via the referral row — the "came from" chip's reporting face; no credits, no balances anywhere (M13-26).
- **campaign-caveat** — any figure here that cites a campaign renders with its correlation caveat travelling with it, on screen and in export (per `prd/modules/M13-dashboards-and-reporting.md` §M13.4).
- **vocabulary-mismatch-carried** — the `Q21` vocabulary mismatch between the two reason sets carried exactly as the CRM carries it, never repaired here (M13-23).
- **empty-teaching** — brand-new tenant or no closed deals yet: the screen teaches what will appear here and why — never a blank or broken chart.

## Data volume

Design at realistic volume, not demo volume: a real closed-deal population from a 200-lead book — the disqualified-early breakdown and the lost-late breakdown each rendered at the full length of the CRM's own reason sets (`M02-53`'s and `M02-54`'s), every reason with its count and value; the referral row alongside. Long content scrolls inside its own region.

## Numbers carrying provenance

Every user-visible number below carries its F8 provenance tier (measured / derived / estimated / assumed) in the design; aggregates inherit the weakest tier of their members.

- Win rate (rate) — M13-23.
- Disqualify-reason breakdown: count and value per reason (counts + money) — M13-23.
- Mark-lost-reason breakdown: count and value per reason (counts + money) — M13-23.
- Referral-row figures: referral-sourced deals in the win/loss view (counts + money; never credits or balances) — M13-26.
