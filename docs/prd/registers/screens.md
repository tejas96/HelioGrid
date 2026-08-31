# Screens register — the complete surface of HelioGrid V2

Status: generated 2026-08-06 · machine-verified · Source: all 35 requirement-bearing PRD documents
· §1, §2 row counts and §4 recomputed 2026-08-15 against the live PRD after the 2026-08-07
offline/sync removal (owner ruling `Q61`), corrected the same day for a suffixed row id
(`MS7-24b`) that the first recompute's pattern dropped, and recomputed again the same day for the
three rows owner rulings `Q62`–`Q64` restored (`M02-66`, `M02-67`, `M09-71` — new ids, not the
deleted ones); deleted requirements are struck in §3, never removed.

This register answers two questions no single PRD document answers: **how many screens does
the product have** (the screen index, §2) and **where does every requirement land** (the row
disposition, §3). It was built by classifying every one of the requirement rows — **1,699 at
generation, 1,659 tier-carrying today** — against a mechanically extracted ground-truth ID list; the
union was verified complete: no row missing, none invented, none counted twice. The 1,699 is the
**pre-sweep** figure and the net delta of **40** reconciles exactly, in two movements. **Down 43:**
**42 ids were deleted from their documents** by the 2026-08-07 offline/sync removal, and **`F7-36`
was struck in place** — still in `foundations/F7-design-language.md`, but with its tier cell set to
`—`, so it is one of the live PRD's 1,660 table rows and not one of the 1,659 that carry a tier.
All 43 are dispositioned as struck rows in §3 and none is counted in §1 or §4. **Up 3:** owner
rulings `Q62`, `Q63` and `Q64` of 2026-08-15 restored three laws that sweep had cut although they
were never about connectivity, as the **new** rows `M02-66`, `M02-67` and `M09-71` — new ids, so
`M02-04`, `M02-26` and `M09-36` stay struck and the deletion record stays true. 1,699 − 43 + 3 =
1,659. 226 raw screen
proposals from 24 independent classification passes merged into the canonical list below (**222
entries survive, 221 consumed**); every merge is recorded in the screen's Sources column.

Rules: a screen is one navigable surface (sheets/dialogs are its states, not new screens).
A requirement typed `screen`/`mixed` maps to ≥1 screen. `engine`/`policy`/`integration` rows
build with no surface of their own. `context` rows are realized through the rows they inform.
A screen splitting or merging during design updates THIS register first (see `docs/ux/briefs/README.md`).

## 1. The numbers

| Screens | Requirement rows | P0 | P1 | P2 | screen | mixed | engine | policy | integration | context |
|---|---|---|---|---|---|---|---|---|---|---|
| **150** | **1659** | 1505 | 137 | 17 | 393 | 390 | 147 | 652 | 22 | 55 |

*Recomputed 2026-08-15, **corrected the same day**, then **recomputed again the same day** for the
three restored rows (was `150 · 1656 · 1502 · 137 · 17 · 393 · 387 · 147 · 652 · 22 · 55`
immediately before the restoration; was `150 · 1655 · 1501 · 137 · 17 · 393 ·
387 · 146 · 652 · 22 · 55` before the suffix correction; at generation `152 · 1699 · 1543 · 139 · 17 · 397 · 397 · 148 · 679 ·
22 · 56`). The correction is one row: the id pattern used by the first recompute stopped at the
digits and silently dropped **`MS7-24b`**, a live P0 `engine` row that sits beside `MS7-24` in
`docs/prd/modules/M05-studio/06-step7-proposal.md` and is dispositioned in §3 like any other. Any
re-derivation of this table must allow an optional lowercase suffix on a row id.
The second recompute is three rows: owner rulings `Q62`, `Q63` and `Q64` of 2026-08-15 restored
three laws the `Q61` sweep had cut for the company they kept, as the **new** live rows
**`M02-66`**, **`M02-67`** (`docs/prd/modules/M02-crm-and-leads.md` §M02.2 and §M02.5) and **`M09-71`**
(`docs/prd/modules/M09-field-workforce.md` §M09.5). All three are P0 and all three are typed `mixed`,
which is the whole of the delta: **1656 → 1659**, **P0 1502 → 1505**, **mixed 387 → 390**; every
other cell is unchanged, and the four screens they land on gain a row each in §2 (`SCR-M02-01`
and `SCR-M02-04` from `M02-66`, `SCR-M02-02` from `M02-67`, `SCR-M09-02` from `M09-71`). The rows they
restore — `M02-04`, `M02-26`, `M09-36` — stay struck in §3 and are counted here no more than
before: the new rows carry new ids precisely so the deletion record stays true.
Screens are counted from §2 — `SCR-SHELL-04` (Sync Center) and `SCR-SHELL-05` (Update Required)
were deleted 2026-08-07 with the offline/sync capability, owner ruling `Q61`. Requirement rows are
counted from the live PRD: a row exists when it has a table row in `docs/prd/foundations/*.md`,
`docs/prd/modules/**/*.md` or `docs/prd/0*.md` **and carries a tier**. The live PRD holds **1,660** such table
rows; **1,659** carry a tier and are counted here. The odd one out is `F7-36`, struck in place
inside `foundations/F7-design-language.md` with its tier cell set to `—`: it is still physically
present, so it is dispositioned in §3, but it carries no tier and is a live requirement no longer.
The 43 rows struck in §3 below — `F7-36` and 42 ids deleted from their documents outright — are
dispositioned but are not live requirements and are not counted here. Tier columns come from the
live rows' own tier cells; type columns from §3's Type column; both sum to 1,659.*

## 2. Screen index

### The V column — the V1 scope lock (owner decision, 2026-08-15)

**`V1` = 99 screens · `V2` = 51 · 150 total.** *(84 on 2026-08-15; 95 on 2026-08-16; 98 the same day after the V1 readiness audit found three scope holes — see the note under the block table.)* V1 is what ships first. V2 is real scope that is
deliberately not blocking the launch, and the architecture keeps its extension points — but no V2
screen is designed or built until V1 ships.

**`V` is a release axis and has nothing to do with `Tier`.** `P0`/`P1`/`P2` rank requirement rows
*inside* a screen; `V1`/`V2` decides whether the screen is in the first release at all. A `P0` row
can sit on a `V2` screen — that means it must be right when V2 comes, not that V2 comes sooner.

**Build order, decided 2026-08-15 after inspecting both codebases.** The order is not the register
order, and the reason is worth recording. The 3D studio is the primary product and it already
exists — 63,527 working lines in `Solar-App-POC` — but it is frontend-only against an app whose
backend today is a health check, it does not meet this repo's standards, and it carries its own
defect register. Porting it first would mean inventing the API, schema and data-layer conventions
while fighting a port. So the studio goes **sixth**, once the earlier modules have settled those
conventions and it has something to conform to. Proposals travel with it, because a proposal
quotes the BOM a design produces.

| # | Block | Screens | |
|---|---|---|---|
| 1 | App shell + entry & tenant | `SHELL-01`, `SHELL-02`, `SHELL-03`, 20 of `M01` | auth, signup steps, team, **catalog**, **branding**, search, notifications, **profile & preferences** |
| 2 | Billing & plans | `M12` (4) + `SHELL-06` | self-serve from day one — pricing page, checkout, dunning surface |
| 3 | CRM & leads | `M02` (6) | |
| 4 | Projects | `M08` (6) | |
| 5 | Payments & collections | `M11` (4) | |
| 6 | Sales execution, calling core + owner home | 11 of `M07` + `M13-01` | the owner/sales-manager home lands here, once CRM, projects and money exist for it to summarise |
| 7 | **3D Design Studio** | `MS` (18) | port + its backend + bringing 63.5k lines to standard + the defect register. The largest block in V1, not the easiest. |
| 8 | **Proposals + customer link** | `M06` (20) + `F5` (5) | |

Steps 1–6 are a shippable CRM-to-cash product on their own: lead → won → project → payment. The
studio lands on top of a system that already works.

**Widened 2026-08-16, owner decision — V1 goes from 84 to 95.** Eleven screens moved up:

- **`M01-03`, `M01-04`, `M01-06`** — the three signup steps (language, what you sell, you're
  ready). One requirement row each; without them the signup flow has no start and no exit.
- **`M01-10` Role Explainer** (P1) and **`M01-14` Roles Reference** (P0) — one row each, both
  read-only. A new invited user is told what their role does; the owner can look up what a role
  grants before assigning it.
- **`M01-18` Branding Settings** — **this was a defect in the 84-screen lock, not a preference.**
  `M01-50` and `F7-07` put the tenant's logo and brand colour on proposal PDFs and customer-link
  pages, and `M01` §4's contract has `M06` consuming branding for rendered documents. `M06` and
  `F5` were already V1, so V1 proposals would have gone to homeowners unbranded.
- **`SHELL-02` Global Search, `SHELL-03` Notification Centre, `M13-01` the owner home** — added
  2026-08-16 by the V1 readiness audit, which found three holes the mechanical gates are
  structurally blind to. `SCR-SHELL-01` places a search box and a bell in the shell that frames
  all 98 screens, and both destinations were V2 — two permanent dead controls. `F6-01` (P0)
  separately calls all three of search, the centre and push *"committed v1 scope"*, so the lock
  contradicted a live P0 row. And `M13-10`'s precedence ladder routes **six of twelve** role homes
  to V2 screens, including EPC Owner and Sales Manager at the top — the buyer signed in and landed
  nowhere. `M13-01` covers both. Search also turns out to be load-bearing on its own: `F6-23`
  makes it **the only surface that can find a junked lead**, so without it one-tap junk was a
  one-way door.
- **`SCR-M01-11` Profile & Preferences** — added 2026-08-16, last of the widenings. Four rows
  land there and V1 had **no user-owned preferences screen at all**, so all four were homeless:
  `F3-03` (P0) the permanent language picker — its first-run half is `SCR-M01-03`'s, but a field
  technician who chose wrongly could never change it; `F3-23` per-user measurement units;
  `F6-15` muting a notification, which became live the same day `SCR-SHELL-03` entered V1; and
  `F7-16` the **high-contrast field mode**, the sanctioned opt-in for reading a phone in direct
  sun. Only `F3-03` is P0 and the other three are P1/P1/P2, so this was a judgement rather than a
  defect — the owner took it because the product is sold to people who work on roofs. It also
  closes the last two V1 briefs that pinned an exit at a V2 screen (`SCR-M01-03`, `SCR-M01-10`).
- **`M12-01`…`M12-04` + `SHELL-06`** — self-serve billing from day one: a public pricing page,
  billing home, plan selection into hosted checkout, usage against bundles, and the banner that
  shows a tenant its billing state. 26 requirement rows, the heaviest of the additions. This is
  how the platform takes money from EPCs; `M11`, already V1, is how EPCs take money from
  homeowners. Different money, different module.

**What V2 holds — 52 screens:** Survey (10) · Marketing (10) · Field workforce and location (7) ·
HR (7) · the voice-agent admin console — IVR editor, routing rules, number provisioning, config
history, performance and usage (9) · Dashboards beyond the owner home (4) · 5 `M01` settings
screens (profile & preferences, message templates, capture settings, locale defaults, integration
credentials).

**The studio's front door is open by ruling, not by screens.** `M05-21` blocked design start on a
submitted survey, and survey is V2 — which made the whole 18-screen studio unreachable. Owner
ruling `Q67` (2026-08-16) scopes its prerequisite set to what the release actually offers. No
screen was added; the honesty half of the row is untouched.

Progress on the locked scope — anchored to `^| SCR-` so the command cannot count its own
documentation, which the unanchored form did:

```bash
grep -c '^| SCR-.*| V1 | pending |' docs/prd/registers/screens.md
```


### App shell & global surfaces

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-SHELL-01 | **App Shell & Navigation** | P0 | 8 | `docs/ux/briefs/SCR-SHELL-01-app-shell.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-SHELL-01+App+Shell+-+Mobile.dc.html | `M02-crm-and-leads:shell-app-navigation`; `11-shell-and-platform:shell-top-bar`; `M13-dashboards-and-reporting:shell-home-switcher`; `M01-onboarding-and-tenant-config:shell-role-home`; ~~`F4-offline-and-sync:shell-sync-indicator`~~ *(proposal withdrawn 2026-08-07 — the global sync indicator was deleted with the offline/sync capability, owner ruling `Q61`; nothing on this screen consumes it, and its tap target `SCR-SHELL-04` no longer exists. Kept struck because this register never deletes an entry. The proposing document was `F4-offline-and-sync.md`, itself deleted; the cell previously named its replacement `F4-data-integrity`, which never contained this element.)*; `F1-global-market-framework:shell-grievance-contact`; `M07-sales-execution:shell-user-presence` |
| SCR-SHELL-02 | **Global Search** | P0 | 2 | `docs/ux/briefs/SCR-SHELL-02-global-search.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-SHELL-02+Global+Search+-+Mobile.dc.html | — |
| SCR-SHELL-03 | **Notification Center** | P0 | 5 | `docs/ux/briefs/SCR-SHELL-03-notification-center.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-SHELL-03+Notification+Center+-+Mobile.dc.html | `M13-dashboards-and-reporting:shell-notification-center` |
| SCR-SHELL-06 | **Billing State Banner & Denial Sheets** | P0 | 6 | `docs/ux/briefs/SCR-SHELL-06-billing-state-banner.md` | V1 | pending | — | — |
| ~~SCR-SHELL-04~~ | ~~Sync Center~~ | — | 0 | *brief deleted* | — | **struck** | — | *Screen deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It existed for `F4-23`, the per-item sync centre — struck in §3 — and its brief `docs/ux/briefs/SCR-SHELL-04-sync-center.md` was deleted with it. The per-item retry it hosted survives only for photographs and only on `SCR-M04-07` (`F4-21`, `M04-55`). Restored as a struck entry 2026-08-15: §3 records every deleted requirement, and §2 must record every deleted screen for the same reason — a screen that vanishes without a mark cannot be audited. Not counted in the 150.* |
| ~~SCR-SHELL-05~~ | ~~Update Required~~ | — | 0 | *brief deleted* | — | **struck** | — | *Screen deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It existed only for `F4-35` ("an application too old to sync still reads") — struck in §3 — and its brief `docs/ux/briefs/SCR-SHELL-05-update-required.md` was deleted with it. **What a too-old client should show is now unstated anywhere in the suite**, recorded as OPEN question `Q65` in `registers/open-questions.md`; nothing here re-instates it. Restored as a struck entry 2026-08-15. Not counted in the 150.* |

### M01 · Onboarding & tenant config

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M01-01 | **Sign In** | P0 | 4 | `docs/ux/briefs/SCR-M01-01-sign-in.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-M01-01+Sign+In+-+Mobile.dc.html | `11-shell-and-platform:shell-sign-in` |
| SCR-M01-02 | **Company Signup** | P0 | 3 | `docs/ux/briefs/SCR-M01-02-company-signup.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-M01-02+Company+Signup+-+Mobile.dc.html | — |
| SCR-M01-03 | **Onboarding — Language** | P0 | 1 | `docs/ux/briefs/SCR-M01-03-onboarding-language.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-M01-03+Onboarding+Language+-+Mobile.dc.html | — |
| SCR-M01-04 | **Setup — What You Sell** | P0 | 1 | `docs/ux/briefs/SCR-M01-04-setup-what-you-sell.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-M01-04+What+You+Sell+-+Mobile.dc.html | — |
| SCR-M01-05 | **Business Profile** | P0 | 3 | `docs/ux/briefs/SCR-M01-05-business-profile.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-M01-05+Business+Profile+-+Mobile.dc.html | — |
| SCR-M01-06 | **Setup — You're Ready** | P0 | 1 | `docs/ux/briefs/SCR-M01-06-setup-ready.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-M01-06+Youre+Ready+-+Mobile.dc.html | — |
| SCR-M01-07 | **Invite Teammate** | P0 | 2 | `docs/ux/briefs/SCR-M01-07-invite-teammate.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-M01-07+Invite+Teammate+-+Mobile.dc.html | `F2-roles-and-permissions:invite-person` |
| SCR-M01-08 | **Invite Landing** | P0 | 1 | `docs/ux/briefs/SCR-M01-08-invite-landing.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-M01-08+Invite+Landing+-+Mobile.dc.html | — |
| SCR-M01-09 | **First-Run Profile** | P0 | 1 | `docs/ux/briefs/SCR-M01-09-first-run-profile.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-M01-09+First-Run+Profile+-+Mobile.dc.html | — |
| SCR-M01-10 | **Role Explainer** | P1 | 1 | `docs/ux/briefs/SCR-M01-10-role-explainer.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-M01-10+Role+Explainer+-+Mobile.dc.html | — |
| SCR-M01-11 | **Profile & Preferences** | P0 | 4 | `docs/ux/briefs/SCR-M01-11-profile-preferences.md` | V1 | designed | https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-M01-11+Profile+and+Preferences+-+Mobile.dc.html | `F7-design-language:shell-app-settings`; `F6-notifications-and-search:notification-preferences` |
| SCR-M01-12 | **Team** | P0 | 3 | `docs/ux/briefs/SCR-M01-12-team.md` | V1 | pending | — | `F2-roles-and-permissions:team` |
| SCR-M01-13 | **Assign Roles** | P0 | 1 | `docs/ux/briefs/SCR-M01-13-assign-roles.md` | V1 | pending | — | — |
| SCR-M01-14 | **Roles Reference** | P0 | 1 | `docs/ux/briefs/SCR-M01-14-roles-reference.md` | V1 | pending | — | — |
| SCR-M01-15 | **Catalog Settings** | P0 | 7 | `docs/ux/briefs/SCR-M01-15-catalog-settings.md` | V1 | pending | — | — |
| SCR-M01-16 | **Add Catalog Item** | P0 | 3 | `docs/ux/briefs/SCR-M01-16-add-catalog-item.md` | V1 | pending | — | — |
| SCR-M01-17 | **Catalog Import Wizard** | P0 | 1 | `docs/ux/briefs/SCR-M01-17-catalog-import-wizard.md` | V1 | pending | — | — |
| SCR-M01-18 | **Branding Settings** | P0 | 2 | `docs/ux/briefs/SCR-M01-18-branding-settings.md` | V1 | pending | — | `F7-design-language:shell-tenant-branding-settings` |
| SCR-M01-19 | **Proposal Template Settings** | P0 | 2 | `docs/ux/briefs/SCR-M01-19-proposal-template-settings.md` | V1 | pending | — | — |
| SCR-M01-20 | **Payment Terms Settings** | P0 | 1 | `docs/ux/briefs/SCR-M01-20-payment-terms-settings.md` | V1 | pending | — | — |
| SCR-M01-21 | **Message Template Settings** | P0 | 1 | `docs/ux/briefs/SCR-M01-21-message-template-settings.md` | V2 | pending | — | — |
| SCR-M01-22 | **Capture Settings** | P0 | 4 | `docs/ux/briefs/SCR-M01-22-capture-settings.md` | V2 | pending | — | `M02-crm-and-leads:capture-settings` |
| SCR-M01-23 | **Locale Defaults** | P1 | 1 | `docs/ux/briefs/SCR-M01-23-locale-defaults.md` | V2 | pending | — | — |
| SCR-M01-24 | **Integration Credentials** | P0 | 1 | `docs/ux/briefs/SCR-M01-24-integration-credentials.md` | V2 | pending | — | — |

### M02 · CRM & leads

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M02-01 | **Quick Add Lead** | P0 | 9 | `docs/ux/briefs/SCR-M02-01-quick-add-lead.md` | V1 | pending | — | — |
| SCR-M02-02 | **Lead Inbox** | P0 | 8 | `docs/ux/briefs/SCR-M02-02-lead-inbox.md` | V1 | pending | — | — |
| SCR-M02-03 | **Leads List** | P0 | 3 | `docs/ux/briefs/SCR-M02-03-leads-list.md` | V1 | pending | — | — |
| SCR-M02-04 | **Lead Detail** | P0 | 22 | `docs/ux/briefs/SCR-M02-04-lead-detail.md` | V1 | pending | — | `M06-proposals:shell-lead-detail`; `M09-field-workforce:shell-lead-detail`; `M03-marketing:shell-lead-consent-trail`; `M06-proposals:shell-customer-record` |
| SCR-M02-05 | **Lead Import Wizard** | P0 | 8 | `docs/ux/briefs/SCR-M02-05-lead-import-wizard.md` | V1 | pending | — | — |
| SCR-M02-06 | **Customer Merge** | P0 | 3 | `docs/ux/briefs/SCR-M02-06-customer-merge.md` | V1 | pending | — | — |

### M03 · Marketing

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M03-01 | **Campaign List (Campaigns Home)** | P0 | 4 | `docs/ux/briefs/SCR-M03-01-campaign-list.md` | V2 | pending | — | `02-personas:shell-campaigns-and-captures`; `M13-dashboards-and-reporting:campaigns-home` |
| SCR-M03-02 | **Campaign Builder — Audience** | P0 | 2 | `docs/ux/briefs/SCR-M03-02-campaign-builder-audience.md` | V2 | pending | — | — |
| SCR-M03-03 | **Campaign Builder — Content** | P0 | 3 | `docs/ux/briefs/SCR-M03-03-campaign-builder-content.md` | V2 | pending | — | — |
| SCR-M03-04 | **Campaign Builder — Review & Schedule** | P0 | 4 | `docs/ux/briefs/SCR-M03-04-campaign-builder-review.md` | V2 | pending | — | — |
| SCR-M03-05 | **Campaign Detail** | P0 | 4 | `docs/ux/briefs/SCR-M03-05-campaign-detail.md` | V2 | pending | — | — |
| SCR-M03-06 | **Campaign Performance** | P0 | 7 | `docs/ux/briefs/SCR-M03-06-campaign-performance.md` | V2 | pending | — | — |
| SCR-M03-07 | **Channel Connections** | P0 | 3 | `docs/ux/briefs/SCR-M03-07-channel-connections.md` | V2 | pending | — | — |
| SCR-M03-08 | **Channel Health** | P0 | 3 | `docs/ux/briefs/SCR-M03-08-channel-health.md` | V2 | pending | — | — |
| SCR-M03-09 | **Campaign Templates** | P0 | 1 | `docs/ux/briefs/SCR-M03-09-campaign-templates.md` | V2 | pending | — | — |
| SCR-M03-10 | **Website Enquiry Form** | P0 | 1 | `docs/ux/briefs/SCR-M03-10-website-enquiry-form.md` | V2 | pending | — | — |

### M04 · Survey

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M04-01 | **Survey Mode Chooser** | P0 | 1 | `docs/ux/briefs/SCR-M04-01-survey-mode-chooser.md` | V2 | pending | — | — |
| SCR-M04-02 | **Remote Survey — Address Entry** | P0 | 3 | `docs/ux/briefs/SCR-M04-02-remote-address-entry.md` | V2 | pending | — | — |
| SCR-M04-03 | **Remote Roof Review** | P0 | 9 | `docs/ux/briefs/SCR-M04-03-remote-roof-review.md` | V2 | pending | — | — |
| SCR-M04-04 | **Coverage Failure** | P0 | 1 | `docs/ux/briefs/SCR-M04-04-coverage-failure.md` | V2 | pending | — | — |
| SCR-M04-05 | **Gaps to Fill** | P0 | 4 | `docs/ux/briefs/SCR-M04-05-gaps-to-fill.md` | V2 | pending | — | — |
| SCR-M04-06 | **My Visits Today** | P0 | 5 | `docs/ux/briefs/SCR-M04-06-my-visits-today.md` | V2 | pending | — | `02-personas:shell-todays-site-visits`; `M13-dashboards-and-reporting:todays-visits` |
| SCR-M04-07 | **Guided Capture** | P0 | 9 | `docs/ux/briefs/SCR-M04-07-guided-capture.md` | V2 | pending | — | — |
| SCR-M04-08 | **Shading Capture Sketch** | P0 | 1 | `docs/ux/briefs/SCR-M04-08-shading-capture-sketch.md` | V2 | pending | — | — |
| SCR-M04-09 | **Review & Submit** | P0 | 4 | `docs/ux/briefs/SCR-M04-09-review-submit.md` | V2 | pending | — | — |
| SCR-M04-10 | **Survey Detail (Hand-off Brief)** | P0 | 5 | `docs/ux/briefs/SCR-M04-10-survey-detail.md` | V2 | pending | — | — |

### M05 · Design Studio

Studio screen names carry the **internal** step ids (stable, so existing designs open
unchanged); the wizard shows **nine visible steps** and the two numberings are not the same.
No user-visible "step 5" exists. Each studio brief states its own visible n/9 position;
a design must never render an internal id as the step indicator.

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-MS-01 | **Design List** | P0 | 8 | `docs/ux/briefs/SCR-MS-01-design-list.md` | V1 | pending | — | `11-shell-and-platform:design-list` |
| SCR-MS-02 | **Design Queue (Designer Home)** | P0 | 3 | `docs/ux/briefs/SCR-MS-02-design-queue.md` | V1 | pending | — | `02-personas:shell-designs-awaiting-work` |
| SCR-MS-03 | **Studio Shell (Wizard Frame)** | P0 | 18 | `docs/ux/briefs/SCR-MS-03-studio-shell.md` | V1 | pending | — | `11-shell-and-platform:studio-wizard-frame` |
| SCR-MS-04 | **Studio Step 1 — Site Setup** | P0 | 28 | `docs/ux/briefs/SCR-MS-04-step1-site-setup.md` | V1 | pending | — | `M05-design-studio:step1-site-setup` |
| SCR-MS-05 | **Studio Step 2 — Roof** | P0 | 41 | `docs/ux/briefs/SCR-MS-05-step2-roof.md` | V1 | pending | — | `M05-design-studio:step2-roof-drawing` |
| SCR-MS-06 | **Studio Step 3 — Obstructions** | P0 | 35 | `docs/ux/briefs/SCR-MS-06-step3-obstructions.md` | V1 | pending | — | `M05-design-studio:step3-obstructions` |
| SCR-MS-07 | **Studio Step 4 — Components** | P0 | 33 | `docs/ux/briefs/SCR-MS-07-step4-components.md` | V1 | pending | — | `M05-design-studio:step4-components` |
| SCR-MS-08 | **Studio Step 6 — Layout Editor** | P0 | 37 | `docs/ux/briefs/SCR-MS-08-step6-layout-editor.md` | V1 | pending | — | `M05-design-studio:step5-6-panel-layout` |
| SCR-MS-09 | **Studio 3D Scene** | P0 | 22 | `docs/ux/briefs/SCR-MS-09-3d-scene.md` | V1 | pending | — | `M05-design-studio:3d-view`; `03-step3-obstructions:studio-3d-scene` |
| SCR-MS-10 | **Studio Step 7 — Proposal** | P0 | 25 | `docs/ux/briefs/SCR-MS-10-step7-proposal.md` | V1 | pending | — | `M05-design-studio:step7-captures-readiness` |
| SCR-MS-11 | **Studio Step 8 — SLD & Drawings** | P0 | 28 | `docs/ux/briefs/SCR-MS-11-step8-sld.md` | V1 | pending | — | `M05-design-studio:step8-sld-drawings` |
| SCR-MS-12 | **Studio Step 9 — Bill of Materials** | P0 | 24 | `docs/ux/briefs/SCR-MS-12-step9-bom.md` | V1 | pending | — | `M05-design-studio:step9-bom-pricing` |
| SCR-MS-13 | **Studio Done** | P0 | 10 | `docs/ux/briefs/SCR-MS-13-done-step.md` | V1 | pending | — | `M05-design-studio:studio-done` |
| SCR-MS-14 | **Variant Compare** | P0 | 1 | `docs/ux/briefs/SCR-MS-14-variant-compare.md` | V1 | pending | — | — |
| SCR-MS-15 | **Sign-off Queue** | P0 | 2 | `docs/ux/briefs/SCR-MS-15-signoff-queue.md` | V1 | pending | — | `M05-design-studio:signoff-queue` |
| SCR-MS-16 | **Sign-off Review** | P0 | 4 | `docs/ux/briefs/SCR-MS-16-signoff-review.md` | V1 | pending | — | `M05-design-studio:design-review` |
| SCR-MS-17 | **Installation Work Order** | P0 | 11 | `docs/ux/briefs/SCR-MS-17-installation-work-order.md` | V1 | pending | — | `M05-design-studio:installation-plan` |
| SCR-MS-18 | **Design System Reference** | P1 | 1 | `docs/ux/briefs/SCR-MS-18-design-system-reference.md` | V1 | pending | — | — |

### Customer link (F5)

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-F5-01 | **Customer Link — Proposal** | P0 | 25 | `docs/ux/briefs/SCR-F5-01-link-proposal.md` | V1 | pending | — | `08-customer-surfaces:proposal-share-page` |
| SCR-F5-02 | **Customer Link — Progress** | P0 | 16 | `docs/ux/briefs/SCR-F5-02-link-progress.md` | V1 | pending | — | `M08-projects:shell-customer-progress-link`; `M11-payments-and-collections:shell-customer-receipts`; `M09-field-workforce:shell-customer-link` |
| SCR-F5-03 | **Customer Link — Handover Pack** | P0 | 9 | `docs/ux/briefs/SCR-F5-03-link-handover.md` | V1 | pending | — | — |
| SCR-F5-04 | **Link Failure Page** | P0 | 2 | `docs/ux/briefs/SCR-F5-04-link-failure.md` | V1 | pending | — | — |
| SCR-F5-05 | **Customer 3D View** | P0 | 2 | `docs/ux/briefs/SCR-F5-05-customer-3d-view.md` | V1 | pending | — | `05-step6-editor:customer-proposal-3d-view` |

### M06 · Proposals

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M06-01 | **Proposal Entry** | P0 | 3 | `docs/ux/briefs/SCR-M06-01-proposal-entry.md` | V1 | pending | — | — |
| SCR-M06-02 | **Proposal Builder** | P0 | 5 | `docs/ux/briefs/SCR-M06-02-proposal-builder.md` | V1 | pending | — | — |
| SCR-M06-03 | **Builder Step 1 — Company** | P0 | 2 | `docs/ux/briefs/SCR-M06-03-builder-step-1-company.md` | V1 | pending | — | — |
| SCR-M06-04 | **Builder Step 2 — Achievements** | P0 | 1 | `docs/ux/briefs/SCR-M06-04-builder-step-2-achievements.md` | V1 | pending | — | — |
| SCR-M06-05 | **Builder Step 3 — Solar System Setup** | P0 | 4 | `docs/ux/briefs/SCR-M06-05-builder-step-3-system-setup.md` | V1 | pending | — | — |
| SCR-M06-06 | **Builder Step 4 — Performance Metrics** | P0 | 1 | `docs/ux/briefs/SCR-M06-06-builder-step-4-performance.md` | V1 | pending | — | — |
| SCR-M06-07 | **Builder Step 5 — Financial Data** | P0 | 1 | `docs/ux/briefs/SCR-M06-07-builder-step-5-financial.md` | V1 | pending | — | — |
| SCR-M06-08 | **Builder Step 6 — Project Timeline** | P0 | 1 | `docs/ux/briefs/SCR-M06-08-builder-step-6-timeline.md` | V1 | pending | — | — |
| SCR-M06-09 | **Builder Step 7 — Payment Terms** | P0 | 1 | `docs/ux/briefs/SCR-M06-09-builder-step-7-payment-terms.md` | V1 | pending | — | — |
| SCR-M06-10 | **Builder Step 8 — Components** | P0 | 5 | `docs/ux/briefs/SCR-M06-10-builder-step-8-components.md` | V1 | pending | — | — |
| SCR-M06-11 | **Builder Step 9 — Terms & Conditions** | P0 | 1 | `docs/ux/briefs/SCR-M06-11-builder-step-9-terms.md` | V1 | pending | — | — |
| SCR-M06-12 | **Builder Step 10 — Client Details** | P0 | 1 | `docs/ux/briefs/SCR-M06-12-builder-step-10-client-details.md` | V1 | pending | — | — |
| SCR-M06-13 | **Builder Step 11 — Bank Details** | P0 | 1 | `docs/ux/briefs/SCR-M06-13-builder-step-11-bank-details.md` | V1 | pending | — | — |
| SCR-M06-14 | **BOM Detail** | P0 | 1 | `docs/ux/briefs/SCR-M06-14-bom-detail.md` | V1 | pending | — | — |
| SCR-M06-15 | **Proposal Preview** | P0 | 1 | `docs/ux/briefs/SCR-M06-15-proposal-preview.md` | V1 | pending | — | — |
| SCR-M06-16 | **Proposal Versions** | P0 | 1 | `docs/ux/briefs/SCR-M06-16-proposal-versions.md` | V1 | pending | — | — |
| SCR-M06-17 | **Proposal Document** | P0 | 20 | `docs/ux/briefs/SCR-M06-17-proposal-document.md` | V1 | pending | — | `08-customer-surfaces:proposal-document` |
| SCR-M06-18 | **Proposal Detail** | P0 | 6 | `docs/ux/briefs/SCR-M06-18-proposal-detail.md` | V1 | pending | — | — |
| SCR-M06-19 | **Proposal List** | P0 | 2 | `docs/ux/briefs/SCR-M06-19-proposal-list.md` | V1 | pending | — | — |
| SCR-M06-20 | **Deal Link Manager** | P0 | 1 | `docs/ux/briefs/SCR-M06-20-deal-link-manager.md` | V1 | pending | — | — |

### M07 · Sales execution

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M07-01 | **My Day** | P0 | 7 | `docs/ux/briefs/SCR-M07-01-my-day.md` | V1 | pending | — | `02-personas:shell-my-day`; `M13-dashboards-and-reporting:my-day` |
| SCR-M07-02 | **Mark Won** | P0 | 1 | `docs/ux/briefs/SCR-M07-02-mark-won.md` | V1 | pending | — | — |
| SCR-M07-03 | **Mark Lost** | P0 | 1 | `docs/ux/briefs/SCR-M07-03-mark-lost.md` | V1 | pending | — | — |
| SCR-M07-04 | **Reopen Lead** | P0 | 1 | `docs/ux/briefs/SCR-M07-04-reopen-lead.md` | V1 | pending | — | — |
| SCR-M07-05 | **Agent Setup & Settings** | P0 | 7 | `docs/ux/briefs/SCR-M07-05-agent-setup-settings.md` | V1 | pending | — | `M01-onboarding-and-tenant-config:shell-agent-voice-settings` |
| SCR-M07-06 | **Calling Window** | P0 | 1 | `docs/ux/briefs/SCR-M07-06-calling-window.md` | V1 | pending | — | — |
| SCR-M07-07 | **Test Agent** | P0 | 1 | `docs/ux/briefs/SCR-M07-07-test-agent.md` | V2 | pending | — | — |
| SCR-M07-08 | **Agent Config History** | P0 | 1 | `docs/ux/briefs/SCR-M07-08-agent-config-history.md` | V2 | pending | — | — |
| SCR-M07-09 | **Knowledge Base** | P0 | 3 | `docs/ux/briefs/SCR-M07-09-knowledge-base.md` | V1 | pending | — | — |
| SCR-M07-10 | **Unanswered Questions** | P0 | 3 | `docs/ux/briefs/SCR-M07-10-unanswered-questions.md` | V2 | pending | — | `M13-dashboards-and-reporting:agent-unanswered-questions` |
| SCR-M07-11 | **Corrections Review Queue** | P0 | 1 | `docs/ux/briefs/SCR-M07-11-corrections-review-queue.md` | V2 | pending | — | — |
| SCR-M07-12 | **Agent Call Queue** | P0 | 5 | `docs/ux/briefs/SCR-M07-12-agent-call-queue.md` | V1 | pending | — | — |
| SCR-M07-13 | **Call Record Detail** | P0 | 2 | `docs/ux/briefs/SCR-M07-13-call-record-detail.md` | V1 | pending | — | — |
| SCR-M07-14 | **Escalations** | P0 | 1 | `docs/ux/briefs/SCR-M07-14-escalations.md` | V1 | pending | — | — |
| SCR-M07-15 | **Routing Rules Editor** | P0 | 1 | `docs/ux/briefs/SCR-M07-15-routing-rules-editor.md` | V2 | pending | — | — |
| SCR-M07-16 | **IVR Flow Editor** | P0 | 1 | `docs/ux/briefs/SCR-M07-16-ivr-flow-editor.md` | V2 | pending | — | — |
| SCR-M07-17 | **Number Provisioning Wizard** | P0 | 3 | `docs/ux/briefs/SCR-M07-17-number-provisioning-wizard.md` | V2 | pending | — | — |
| SCR-M07-18 | **Agent Performance** | P0 | 8 | `docs/ux/briefs/SCR-M07-18-agent-performance.md` | V2 | pending | — | `M13-dashboards-and-reporting:agent-performance-dashboard`; `M13-dashboards-and-reporting:agent-per-rep-view` |
| SCR-M07-19 | **Call Log** | P0 | 2 | `docs/ux/briefs/SCR-M07-19-call-log.md` | V1 | pending | — | `M13-dashboards-and-reporting:agent-call-log` |
| SCR-M07-20 | **Agent Usage** | P0 | 2 | `docs/ux/briefs/SCR-M07-20-agent-usage.md` | V2 | pending | — | `M13-dashboards-and-reporting:agent-usage-report` |

### M08 · Projects

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M08-01 | **Project Board** | P0 | 8 | `docs/ux/briefs/SCR-M08-01-project-board.md` | V1 | pending | — | `02-personas:shell-projects-board`; `M13-dashboards-and-reporting:projects-home`; `M08-projects:shell-portfolio-dashboard` |
| SCR-M08-02 | **Project Detail** | P0 | 7 | `docs/ux/briefs/SCR-M08-02-project-detail.md` | V1 | pending | — | `M11-payments-and-collections:shell-project-money-block` |
| SCR-M08-03 | **Document Checklist** | P0 | 2 | `docs/ux/briefs/SCR-M08-03-document-checklist.md` | V1 | pending | — | — |
| SCR-M08-04 | **Installation Checklist** | P0 | 3 | `docs/ux/briefs/SCR-M08-04-installation-checklist.md` | V1 | pending | — | `F2-roles-and-permissions:installation-checklist` |
| SCR-M08-05 | **Installer Job Home** | P0 | 3 | `docs/ux/briefs/SCR-M08-05-installer-job-home.md` | V1 | pending | — | `02-personas:shell-todays-installation`; `M13-dashboards-and-reporting:todays-installation` |
| SCR-M08-06 | **Handover Flow** | P0 | 2 | `docs/ux/briefs/SCR-M08-06-handover-flow.md` | V1 | pending | — | — |

### M09 · Field workforce

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M09-01 | **Tracking Settings** | P0 | 7 | `docs/ux/briefs/SCR-M09-01-tracking-settings.md` | V2 | pending | — | — |
| SCR-M09-02 | **My Day (Route)** | P0 | 15 | `docs/ux/briefs/SCR-M09-02-my-day-route.md` | V2 | pending | — | `02-personas:shell-my-route-today`; `M13-dashboards-and-reporting:todays-route` |
| SCR-M09-03 | **Visit Stop Detail** | P0 | 2 | `docs/ux/briefs/SCR-M09-03-visit-stop-detail.md` | V2 | pending | — | — |
| SCR-M09-04 | **Team Field Day** | P0 | 6 | `docs/ux/briefs/SCR-M09-04-team-field-day.md` | V2 | pending | — | — |
| SCR-M09-05 | **Activity Timeline** | P0 | 4 | `docs/ux/briefs/SCR-M09-05-activity-timeline.md` | V2 | pending | — | — |
| SCR-M09-06 | **Day Playback** | P0 | 2 | `docs/ux/briefs/SCR-M09-06-day-playback.md` | V2 | pending | — | — |
| SCR-M09-07 | **Site Geofence** | P0 | 2 | `docs/ux/briefs/SCR-M09-07-site-geofence.md` | V2 | pending | — | — |

### M10 · HR lite

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M10-01 | **People Today Queue** | P0 | 10 | `docs/ux/briefs/SCR-M10-01-people-today-queue.md` | V2 | pending | — | `02-personas:shell-people-today`; `M13-dashboards-and-reporting:people-today-home` |
| SCR-M10-02 | **People List** | P0 | 3 | `docs/ux/briefs/SCR-M10-02-people-list.md` | V2 | pending | — | — |
| SCR-M10-03 | **Employee Record** | P0 | 5 | `docs/ux/briefs/SCR-M10-03-employee-record.md` | V2 | pending | — | — |
| SCR-M10-04 | **Offboard Sweep** | P0 | 4 | `docs/ux/briefs/SCR-M10-04-offboard-sweep.md` | V2 | pending | — | — |
| SCR-M10-05 | **Attendance Register** | P0 | 4 | `docs/ux/briefs/SCR-M10-05-attendance-register.md` | V2 | pending | — | — |
| SCR-M10-06 | **Leave Request** | P0 | 1 | `docs/ux/briefs/SCR-M10-06-leave-request.md` | V2 | pending | — | — |
| SCR-M10-07 | **Team Structure** | P0 | 1 | `docs/ux/briefs/SCR-M10-07-team-structure.md` | V2 | pending | — | — |

### M11 · Payments & collections

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M11-01 | **Finance Home (Money Due)** | P0 | 3 | `docs/ux/briefs/SCR-M11-01-finance-home.md` | V1 | pending | — | `02-personas:shell-money-due`; `M13-dashboards-and-reporting:money-due` |
| SCR-M11-02 | **Payments Ledger** | P0 | 15 | `docs/ux/briefs/SCR-M11-02-payments-ledger.md` | V1 | pending | — | `M08-projects:shell-payments-screen` |
| SCR-M11-03 | **Record Payment** | P0 | 7 | `docs/ux/briefs/SCR-M11-03-record-payment.md` | V1 | pending | — | — |
| SCR-M11-04 | **Collections Settings** | P0 | 2 | `docs/ux/briefs/SCR-M11-04-collections-settings.md` | V1 | pending | — | — |

### M12 · Platform billing

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M12-01 | **Pricing Page** | P0 | 2 | `docs/ux/briefs/SCR-M12-01-pricing-page.md` | V1 | pending | — | — |
| SCR-M12-02 | **Billing Home** | P0 | 6 | `docs/ux/briefs/SCR-M12-02-billing-home.md` | V1 | pending | — | `04-business-model:shell-billing` |
| SCR-M12-03 | **Plan Selection & Conversion** | P0 | 5 | `docs/ux/briefs/SCR-M12-03-plan-selection.md` | V1 | pending | — | — |
| SCR-M12-04 | **Usage** | P0 | 7 | `docs/ux/briefs/SCR-M12-04-usage-screen.md` | V1 | pending | — | `04-business-model:shell-usage-screen` |

### M13 · Dashboards & reporting

| SCR | Screen | Tier | Rows | Brief | V | UX status | Design link | Merged from |
|---|---|---|---|---|---|---|---|---|
| SCR-M13-01 | **Owner Dashboard** | P0 | 11 | `docs/ux/briefs/SCR-M13-01-owner-dashboard.md` | V1 | pending | — | — |
| SCR-M13-02 | **Pipeline Dashboard (Rep's own step-back)** | P0 | 1 | `docs/ux/briefs/SCR-M13-02-pipeline-dashboard.md` | V2 | pending | — | `02-personas:shell-pipeline-dashboard` |
| SCR-M13-03 | **Operations Home** | P0 | 4 | `docs/ux/briefs/SCR-M13-03-operations-home.md` | V2 | pending | — | `02-personas:shell-blockers-by-party` |
| SCR-M13-04 | **Pipeline Funnel** | P0 | 3 | `docs/ux/briefs/SCR-M13-04-pipeline-funnel.md` | V2 | pending | — | — |
| SCR-M13-05 | **Win/Loss Analytics** | P0 | 2 | `docs/ux/briefs/SCR-M13-05-win-loss-analytics.md` | V2 | pending | — | — |

## 3. Row disposition — every requirement, where it lands

Column key: **Where** = screen ids for screen/mixed rows · `engine`/`policy`/`integration`
rows show their build nature · `context` rows show what realizes them. **Task** = engineering
task id(s) in `docs/tasks/` (backfilled by the generator once tasks exist).

**Struck rows.** A requirement deleted from the PRD is **marked, never removed** — this register's
value is that every row is accounted for exactly once, forever, so a row for something that no
longer exists still has to be findable. The convention, applied to all 43 struck rows (18 marked in
the 2026-08-07 sweep, 25 restored 2026-08-15 under `foundations/F4-data-integrity.md` after they had
been dropped from this register outright): the id in
`~~strikethrough~~`, Tier `—`, Type `**excluded**`, the Where cell replaced by a dated note saying
when and by whose ruling the row went and where its surviving law now lives (or that it is a named
non-goal), and Task `—` — a struck row claims no build obligation and counts toward no total in §1
or §4. Where the deletion left a hole the product still needs, the note names the open owner
question that records it and does **not** invent a replacement.

### docs/prd/01-product-overview.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| OV-01 | P0 | context | context → all modules M01-M13 (selling-engine spine) | realized-by: all modules M01–M13 (the selling-engine spine) |
| OV-02 | P0 | context | context → informative; global framing carried by F1 | realized-by: informative; global framing carried by `docs/prd/foundations/F1-global-market-framework.md` |
| OV-03 | P0 | context | context → M05-design-studio | realized-by: `docs/prd/modules/M05-design-studio.md` |
| OV-04 | P0 | policy | policy | LAW |
| OV-05 | P0 | context | context → 04-business-model.md | realized-by: `docs/prd/04-business-model.md` |
| OV-06 | P0 | policy | policy | LAW |
| OV-07 | P1 | policy | policy | LAW |
| OV-08 | P0 | policy | policy | LAW |
| OV-09 | P0 | policy | policy | LAW |
| OV-10 | P0 | context | context → M07, M06, F5, M13 | realized-by: `docs/prd/modules/M07-sales-execution.md`, `docs/prd/modules/M06-proposals.md`, `docs/prd/foundations/F5-customer-link.md`, `docs/prd/modules/M13-dashboards-and-reporting.md` |
| OV-11 | P0 | context | context → M13-dashboards-and-reporting | realized-by: `docs/prd/modules/M13-dashboards-and-reporting.md` |
| OV-12 | P0 | context | context → informative (design goal in every module) | realized-by: informative (a design goal in every module) |
| OV-13 | P1 | context | context → M07-sales-execution | realized-by: `docs/prd/modules/M07-sales-execution.md` |
| OV-14 | P1 | context | context → M09-field-workforce | realized-by: `docs/prd/modules/M09-field-workforce.md` |
| OV-15 | P0 | context | context → M06, M05, F8 | realized-by: `docs/prd/modules/M06-proposals.md`, `docs/prd/modules/M05-design-studio.md`, `docs/prd/foundations/F8-data-honesty.md` |
| OV-16 | P0 | context | context → F6 (one search), all modules | realized-by: `docs/prd/foundations/F6-notifications-and-search.md` (one search) and all modules |
| OV-17 | P0 | context | context → 04-business-model.md | realized-by: `docs/prd/04-business-model.md` |
| OV-18 | P1 | context | context → 04-business-model.md, M05 | realized-by: `docs/prd/04-business-model.md`, `docs/prd/modules/M05-design-studio.md` |
| OV-19 | P0 | context | context → F1-global-market-framework | realized-by: `docs/prd/foundations/F1-global-market-framework.md` |
| OV-20 | P0 | context | context → 04-business-model.md | realized-by: `docs/prd/04-business-model.md` |
| OV-21 | P0 | policy | policy | LAW |
| OV-22 | P0 | policy | policy | LAW |
| OV-23 | P0 | policy | policy | LAW |
| OV-24 | P0 | policy | policy | LAW |
| OV-25 | P0 | policy | policy | LAW |
| OV-26 | P0 | policy | policy | LAW |
| OV-27 | P0 | policy | policy | LAW |
| OV-28 | P0 | policy | policy | LAW |
| OV-29 | P0 | policy | policy | LAW |
| OV-30 | P0 | policy | policy | LAW |
| OV-31 | P0 | policy | policy | LAW |
| OV-32 | P0 | policy | policy | LAW |
| OV-33 | P0 | policy | policy | LAW |
| OV-34 | P0 | policy | policy | LAW |
| OV-35 | P0 | policy | policy | LAW |
| OV-36 | P0 | policy | policy | LAW |
| OV-37 | P0 | context | context → M07-sales-execution, F1-global-market-framework | realized-by: `docs/prd/modules/M07-sales-execution.md`, `docs/prd/foundations/F1-global-market-framework.md` |
| OV-38 | P0 | context | context → F8-data-honesty | realized-by: `docs/prd/foundations/F8-data-honesty.md` |
| ~~OV-39~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the competitive-moat claim — offline field capture of surveys and photographs — struck by the owner in the same ruling as `BM-05`'s public pricing-page feature line, "because a product that requires a connection cannot advertise an offline field app". Nothing live restates it, and nothing should: the residue — photographs held on the device until they upload (`F4-21` / `M04-55`) — is a recovery guarantee, not a differentiator. The moat table's other five entries (`OV-37`, `OV-38`, `OV-40`, `OV-41`, `OV-42`) are untouched and keep their numbering.* | — |
| OV-40 | P0 | context | context → F3-localization, F7-design-language, F1 (grouping) | realized-by: `docs/prd/foundations/F3-localization.md`, `docs/prd/foundations/F7-design-language.md`, `docs/prd/foundations/F1-global-market-framework.md` (grouping) |
| OV-41 | P0 | context | context → M01-onboarding-and-tenant-config | realized-by: `docs/prd/modules/M01-onboarding-and-tenant-config.md` |
| OV-42 | P0 | context | context → 04-business-model.md | realized-by: `docs/prd/04-business-model.md` |
| OV-43 | P0 | policy | policy | LAW |
| OV-44 | P0 | policy | policy | LAW |

### docs/prd/02-personas.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| PS-01 | P0 | policy | policy | LAW |
| PS-02 | P0 | policy | policy | LAW |
| PS-03 | P0 | policy | policy | LAW |
| PS-04 | P0 | policy | policy | LAW |
| PS-05 | P1 | policy | policy | LAW |
| PS-06 | P0 | context | context → F2 §EPC Owner | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §EPC Owner |
| PS-07 | P0 | screen | SCR-M13-01 | T-M13-002 |
| PS-08 | P0 | context | context → F2 §Sales Manager | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Sales Manager |
| PS-09 | P0 | screen | SCR-M13-01 | T-M13-002 |
| PS-10 | P0 | context | context → F2 §Sales Executive | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Sales Executive |
| PS-11 | P0 | screen | SCR-M07-01 | T-M07-001 |
| PS-12 | P0 | context | context → F2 §Survey Engineer; M04-survey | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Survey Engineer · `docs/prd/modules/M04-survey.md` |
| PS-13 | P0 | screen | SCR-M04-06 | T-M04-006 |
| PS-14 | P0 | policy | policy | LAW |
| PS-15 | P0 | context | context → F2 §Design Engineer; M05-design-studio | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Design Engineer · `docs/prd/modules/M05-design-studio.md` |
| PS-16 | P0 | screen | SCR-MS-02 | T-MS-375 |
| PS-17 | P0 | policy | policy | LAW |
| PS-18 | P0 | screen | SCR-MS-02 | T-MS-375 |
| PS-19 | P0 | policy | policy | LAW |
| PS-20 | P0 | context | context → F2 §Project Manager; M08-projects | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Project Manager · `docs/prd/modules/M08-projects.md` |
| PS-21 | P0 | screen | SCR-M08-01 | T-M08-001 |
| PS-22 | P0 | context | context → F2 §Field Technician; M09-field-workforce | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Field Technician · `docs/prd/modules/M09-field-workforce.md` |
| PS-23 | P1 | screen | SCR-M09-02 | T-M09-002 |
| ~~PS-24~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`) — swept for the company it kept rather than for what it said, and `docs/prd/02-personas.md` carries no strike note where it stood, between the surviving `PS-23` and `PS-25`. The Field Technician platform law it held, "mobile sessions are long-lived", was never a connectivity rule and is live with a concrete value at `M01-07`, built by `T-M01-025` (recorded in `docs/tasks/F-core.md`). Nothing is re-instated here.* | — |
| PS-25 | P0 | context | context → F2 §Installation Team Member; M08-projects | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Installation Team Member · `docs/prd/modules/M08-projects.md` |
| PS-26 | P1 | screen | SCR-M08-05 | T-M08-005 |
| PS-27 | P0 | policy | policy | LAW |
| PS-28 | P1 | policy | policy | LAW |
| PS-29 | P0 | context | context → F2 §HR/Admin; M10-hr-lite | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §HR/Admin · `docs/prd/modules/M10-hr-lite.md` |
| PS-30 | P2 | screen | SCR-M10-01 | T-M10-001 |
| PS-31 | P0 | context | context → F2 §Finance; M11-payments-and-collections | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Finance · `docs/prd/modules/M11-payments-and-collections.md` |
| PS-32 | P1 | screen | SCR-M11-01 | T-M11-001 |
| PS-33 | P0 | context | context → F2 §Operations; M08, M09 | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Operations · `docs/prd/modules/M08-projects.md`, `docs/prd/modules/M09-field-workforce.md` |
| PS-34 | P1 | screen | SCR-M13-03 | T-M13-003 |
| PS-35 | P0 | context | context → F2 §Marketing; M03-marketing | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Marketing · `docs/prd/modules/M03-marketing.md` |
| PS-36 | P1 | screen | SCR-M03-01 | T-M03-001 |
| PS-37 | P0 | policy | policy | LAW |

### docs/prd/04-business-model.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| BM-01 | P0 | policy | policy | LAW |
| BM-02 | P0 | policy | policy | LAW |
| BM-03 | P0 | policy | policy | LAW |
| BM-04 | P0 | policy | policy | LAW |
| BM-05 | P0 | mixed | SCR-M12-01 · +non-UI: tiers gate capacity/counts/bundles, never features — every module… | LAW |
| BM-06 | P0 | policy | policy | LAW |
| BM-07 | P0 | mixed | SCR-M12-01, SCR-M12-04 · +non-UI: caps are upgrade signals and abuse bounds; soft-block enforcement | LAW |
| BM-08 | P0 | policy | policy | LAW |
| BM-09 | P0 | policy | policy | LAW |
| BM-10 | P0 | policy | policy | LAW |
| BM-11 | P0 | policy | policy | T-FCORE-012 |
| BM-12 | P0 | policy | policy | T-FCORE-012 |
| BM-13 | P0 | policy | policy | T-FCORE-010 |
| BM-14 | P1 | context | context → ['BM-41', 'docs/prd/modules/M12-platform-billing.md'] | T-FCORE-010 |
| BM-15 | P1 | policy | policy | LAW |
| BM-16 | P0 | policy | policy | T-FCORE-012 |
| BM-17 | P0 | policy | policy | T-FCORE-011 |
| BM-18 | P0 | policy | policy | T-FCORE-011 |
| BM-19 | P0 | policy | policy | T-FCORE-011 |
| BM-20 | P0 | policy | policy | T-FCORE-011 |
| BM-21 | P0 | policy | policy | T-FCORE-011 |
| BM-22 | P0 | policy | policy | T-FCORE-011 |
| BM-23 | P0 | policy | policy | T-FCORE-011 |
| BM-24 | P0 | policy | policy | T-FCORE-011 |
| BM-25 | P0 | policy | policy | T-FCORE-011 |
| BM-26 | P1 | policy | policy | T-FCORE-010 |
| BM-27 | P0 | mixed | SCR-M12-04 · +non-UI: screen shows exactly the enforced/billed rollups, no smoothing… | T-FCORE-014 |
| BM-28 | P0 | policy | policy | T-FCORE-013 |
| BM-29 | P0 | policy | policy | T-FCORE-013 |
| BM-30 | P0 | policy | policy | T-FCORE-013 |
| BM-31 | P1 | context | context → ['BM-28', 'BM-41'] | T-FCORE-013 |
| BM-32 | P0 | mixed | SCR-M12-02 · +non-UI: read/export/customer-links/billing always work in every state… | T-FCORE-014 |
| BM-33 | P0 | policy | policy | T-FCORE-012 |
| BM-34 | P0 | mixed | SCR-M12-04 · +non-UI: 7-day grace after 100%; then new creations pause; resets on billing… | T-FCORE-014 |
| BM-35 | P0 | policy | policy | T-FCORE-014 |
| BM-36 | P0 | policy | policy | T-FCORE-014 |
| BM-37 | P0 | policy | policy | T-FCORE-010 |
| BM-38 | P0 | policy | policy | T-FCORE-010 |
| BM-39 | P0 | policy | policy | T-FCORE-010 |
| BM-40 | P0 | policy | policy | T-FCORE-010 |
| BM-41 | P0 | policy | policy | T-FCORE-010 |
| BM-42 | P0 | policy | policy | T-FCORE-015 |
| BM-43 | P1 | context | context → ['docs/prd/modules/M01-onboarding-and-tenant-config.md', 'docs/prd/foundations/F1-global-market-framework.md', 'docs/prd/modules/M06-proposals.md'] | realized-by: `docs/prd/modules/M01-onboarding-and-tenant-config.md` · `docs/prd/foundations/F1-global-market-framework.md` · `docs/prd/modules/M06-proposals.md` |
| BM-44 | P1 | context | context → ['BM-08', 'BM-41'] | T-FCORE-010 |
| BM-45 | P1 | context | context → ['BM-05', 'docs/prd/foundations/F1-global-market-framework.md'] | realized-by: BM-05 (LAW) · `docs/prd/foundations/F1-global-market-framework.md` |
| BM-46 | P1 | context | context → ['BM-17', 'BM-18', 'BM-41'] | T-FCORE-011 |
| BM-47 | P1 | context | context → ['docs/prd/modules/M13-dashboards-and-reporting.md', 'BM-28'] | T-FCORE-013 |

### docs/prd/foundations/F1-global-market-framework.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F1-01 | P0 | policy | policy | T-FCORE-001 |
| F1-02 | P0 | policy | policy | T-FCORE-001 |
| F1-03 | P0 | policy | policy | T-FCORE-001 |
| F1-04 | P0 | policy | policy | T-FCORE-001 |
| F1-05 | P0 | policy | policy | T-FCORE-001 |
| F1-06 | P0 | policy | policy | T-FCORE-001 |
| F1-07 | P0 | policy | policy | T-FCORE-002 |
| F1-08 | P0 | policy | policy | T-FCORE-002 |
| F1-09 | P0 | policy | policy | T-FCORE-001 |
| F1-10 | P0 | policy | policy | T-FCORE-001 |
| F1-11 | P0 | policy | policy | T-FCORE-001 |
| F1-12 | P0 | policy | policy | T-FCORE-001 |
| F1-13 | P0 | policy | policy | T-FCORE-002 |
| F1-14 | P0 | policy | policy | T-FCORE-003 |
| F1-15 | P0 | policy | policy | T-FCORE-004 |
| F1-16 | P0 | policy | policy | T-FCORE-004 |
| F1-17 | P0 | policy | policy | T-FCORE-004 |
| F1-18 | P0 | policy | policy | T-FCORE-006 |
| F1-19 | P0 | policy | policy | T-FCORE-007 |
| F1-20 | P1 | policy | policy | T-FCORE-007 |
| F1-21 | P0 | policy | policy | T-FCORE-008 |
| F1-22 | P0 | policy | policy | T-FCORE-008 |
| F1-23 | P0 | policy | policy | T-FCORE-009 |
| F1-24 | P0 | policy | policy | T-FCORE-009 |
| F1-25 | P0 | policy | policy | T-FCORE-010 |
| F1-26 | P0 | policy | policy | T-FCORE-010 |
| F1-27 | P0 | policy | policy | T-FCORE-010 |
| F1-28 | P0 | policy | policy | T-FCORE-002 |
| F1-29 | P0 | policy | policy | T-FCORE-002 |
| F1-30 | P1 | policy | policy | T-FCORE-002 |
| F1-31 | P0 | policy | policy | T-FCORE-002 |
| F1-32 | P0 | policy | policy | T-FCORE-009 |
| F1-33 | P0 | engine | engine | T-FCORE-003 |
| F1-34 | P0 | policy | policy | T-FCORE-003 |
| F1-35 | P0 | policy | policy | T-FCORE-003 |
| F1-36 | P0 | policy | policy | T-FCORE-004 |
| F1-37 | P0 | integration | integration | T-FCORE-005 |
| F1-38 | P0 | integration | integration | T-FCORE-005 |
| F1-62 | P0 | policy | policy | T-FCORE-004 |
| F1-39 | P0 | policy | policy | T-FCORE-004 |
| F1-40 | P0 | integration | integration | T-FCORE-006 |
| F1-41 | P0 | policy | policy | T-FCORE-006 |
| F1-42 | P0 | policy | policy | T-FCORE-006 |
| F1-43 | P0 | integration | integration | T-FCORE-006 |
| F1-44 | P0 | policy | policy | T-FCORE-007 |
| F1-45 | P1 | policy | policy | T-FCORE-007 |
| F1-46 | P0 | policy | policy | T-FCORE-008 |
| F1-47 | P0 | policy | policy | T-FCORE-008 |
| F1-48 | P0 | policy | policy | T-FCORE-008 |
| F1-49 | P0 | policy | policy | T-FCORE-008 |
| F1-50 | P1 | policy | policy | T-FCORE-008 |
| F1-51 | P0 | policy | policy | T-FCORE-008 |
| F1-52 | P0 | policy | policy | T-FCORE-008 |
| F1-53 | P0 | policy | policy | T-FCORE-008 |
| F1-54 | P0 | policy | policy | T-FCORE-009 |
| F1-55 | P0 | policy | policy | T-FCORE-009 |
| F1-56 | P0 | policy | policy | T-FCORE-009 |
| F1-57 | P0 | policy | policy | T-FCORE-009 |
| F1-58 | P0 | policy | policy | T-FCORE-009 |
| F1-59 | P0 | mixed | SCR-SHELL-01 · +non-UI: breach-notification duty to Data Protection Board and affected… | T-FCORE-009, T-SHELL-001 |
| F1-60 | P0 | policy | policy | T-FCORE-010 |
| F1-61 | P0 | policy | policy | T-FCORE-010 |

### docs/prd/foundations/F2-roles-and-permissions.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F2-01 | P0 | policy | policy | T-FPLAT-001 |
| F2-02 | P0 | policy | policy | T-FPLAT-001 |
| F2-03 | P0 | policy | policy | T-FPLAT-001 |
| F2-04 | P0 | policy | policy | LAW |
| F2-05 | P0 | policy | policy | T-FPLAT-001 |
| F2-06 | P0 | policy | policy | LAW |
| F2-07 | P1 | mixed | SCR-M08-04 · +non-UI: ticks attributed to the coordinator; fallback survives even when crew  | LAW |
| F2-08 | P0 | policy | policy | T-FPLAT-001 |
| F2-09 | P0 | policy | policy | T-FPLAT-001 |
| F2-10 | P0 | mixed | SCR-M01-12 · +non-UI: stacking law: one person holds several presets, composed by OR | T-FPLAT-002 |
| F2-11 | P0 | policy | policy | T-FPLAT-002 |
| F2-12 | P0 | policy | policy | T-FPLAT-002 |
| F2-13 | P0 | policy | policy | T-FPLAT-002 |
| F2-14 | P0 | policy | policy | T-FPLAT-002 |
| F2-15 | P0 | policy | policy | T-FPLAT-002 |
| F2-16 | P0 | policy | policy | T-FPLAT-001 |
| F2-17 | P1 | policy | policy | T-FPLAT-002 |
| F2-18 | P0 | policy | policy | T-FPLAT-002 |
| F2-19 | P0 | mixed | SCR-M01-12 · +non-UI: guarded transition enforced beyond UI; blocked attempts audit-logged | T-FPLAT-003 |
| F2-20 | P0 | policy | policy | T-FPLAT-003 |
| F2-21 | P1 | mixed | SCR-M01-07 · +non-UI: guarded at the transition; no surface can bypass it | T-FPLAT-003 |
| F2-22 | P0 | policy | policy | T-FPLAT-004 |
| F2-23 | P1 | policy | policy | T-FPLAT-004 |
| F2-24 | P0 | policy | policy | T-FPLAT-004 |
| F2-25 | P0 | policy | policy | T-FPLAT-001 |
| F2-26 | P0 | policy | policy | T-FPLAT-001 |

### docs/prd/foundations/F3-localization.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F3-01 | P0 | policy | policy | T-FPLAT-005 |
| F3-02 | P0 | policy | policy | T-FPLAT-005 |
| F3-03 | P0 | screen | SCR-M01-03, SCR-M01-11 | T-M01-003 |
| F3-04 | P0 | policy | policy | T-FPLAT-005 |
| F3-05 | P0 | engine | engine | T-FPLAT-005 |
| F3-06 | P0 | policy | policy | T-FPLAT-005 |
| F3-07 | P0 | policy | policy | T-FPLAT-005 |
| F3-08 | P0 | policy | policy | T-FPLAT-006 |
| F3-09 | P0 | policy | policy | T-FPLAT-007 |
| F3-10 | P0 | policy | policy | T-FPLAT-006 |
| F3-11 | P0 | policy | policy | T-FPLAT-006 |
| F3-12 | P0 | policy | policy | T-FPLAT-006 |
| F3-13 | P0 | policy | policy | T-FPLAT-007 |
| F3-14 | P0 | policy | policy | T-FPLAT-007 |
| F3-15 | P0 | engine | engine | T-FPLAT-007 |
| F3-16 | P0 | policy | policy | LAW |
| F3-17 | P0 | policy | policy | T-FPLAT-007 |
| F3-18 | P0 | policy | policy | LAW |
| F3-19 | P0 | engine | engine | T-FPLAT-008 |
| F3-20 | P0 | engine | engine | T-FPLAT-008 |
| F3-21 | P0 | policy | policy | T-FPLAT-008 |
| F3-22 | P0 | engine | engine | T-FPLAT-008 |
| F3-23 | P1 | mixed | SCR-M01-11 · +non-UI: procurement, BOM and supplier quantities stay metric regardless of… | T-FPLAT-008 |
| F3-24 | P0 | policy | policy | T-FPLAT-008 |
| F3-25 | P0 | policy | policy | LAW |
| F3-26 | P0 | policy | policy | T-FPLAT-009 |
| F3-27 | P0 | policy | policy | T-FPLAT-009 |
| F3-28 | P1 | policy | policy | T-FPLAT-009 |
| F3-29 | P0 | policy | policy | LAW |

### docs/prd/foundations/F4-data-integrity.md

*This section was `docs/prd/foundations/F4-offline-and-sync.md`'s. That document was deleted whole
2026-08-07 by owner ruling `Q61` and replaced by `F4-data-integrity.md`, which keeps ten of its 35
rows — the ones that were never about connectivity — with their original ids. **The other 25 rows
(`F4-01`–`F4-03`, `F4-05`, `F4-06`, `F4-08`–`F4-13`, `F4-18`, `F4-20`, `F4-22`–`F4-24`, `F4-26`,
`F4-28`–`F4-35`) are struck, not removed.** They had been dropped from this register outright,
which is the one thing it may never do; they were restored as struck rows 2026-08-15, in id order
under this heading, so that all 35 ids of the deleted document are accounted for here exactly once
and forever. **Restoring them changes no count in §1 or §4** — a struck row is not a live
requirement and claims no build obligation — but it did raise §3's own total from 1,674 rows to
1,699 and this register's struck total from 18 to **43**. *(§3's total moved once more the same day, to **1,702**, when the three rows ruled at `Q62`–`Q64` were added as live dispositions; the struck total is unchanged at 43. §4 carries the current figures.)* Where each row's law went is recorded
key-by-key in the retired traceability register's Task 10 block and is summarised in its note below; two
of them left holes that are open owner questions rather than losses to absorb — `F4-35` is `Q65` (a
client too old to talk to the server) and `F4-32` is `Q66` (a shared field phone holding another
user's unuploaded photographs) — and those two cite the question rather than naming a carrier.
Nothing below is renumbered.*

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| ~~F4-01~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the three-term vocabulary — offline-full, online-only, degraded reads — that named the sets `R14`'s offline-scope boundary was drawn between. `Q61` overrode `R14` wholesale, so there is no boundary left to have a vocabulary for: the whole product requires a live connection (`foundations/F4-data-integrity.md` preamble) and losing it is an ordinary network error. `DOC06.online-only-set` is SUPERSEDED in the retired traceability register's Task 10 block, not excluded, because the ruling absorbed the set rather than declaring it a non-goal. `docs/ux/briefs/SCR-M01-01-sign-in.md` dropped the OTP connectivity contract stated in this row's vocabulary in the same sweep.* | — |
| ~~F4-02~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It quoted `DOC06.reads-local` verbatim — "Reads are local, always", every synced entity served from an on-device store — which is a non-goal by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1: "The product does not read from a cache"). **Nothing live carries a local read**, and none is needed: every read is a server read. The one clause of its neighbourhood with independent life, no spinner wall and no pre-emptively disabled primary action, is live at `F4-27` under `DOC06.sync-status-ux`, and is not claimed here. `docs/tasks/F-platform.md` `T-FPLAT-011` lost "the local-first core" from its title for the same reason.* | — |
| ~~F4-03~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the durable device write queue for offline mutations — a non-goal by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1: "does not queue mutations"), and `M04-55` now rules the photograph queue the product's one and only device-held queue, holding "photographs and nothing else". The half of `DOC06.writes-queued` that survives — the server is the only writer of record — is stated at live `F4-04`, and the never-silently-drop guarantee it neighboured is live at `F4-21`; neither is claimed as this row's carrier. `docs/ux/briefs/SCR-M02-01-quick-add-lead.md` dropped the `Offline` base state this row supported.* | — |
| F4-04 | P0 | policy | policy | T-FPLAT-011 |
| ~~F4-05~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It is the one id of these 25 whose content this register cannot state: no source key in the retired traceability register's Task 10 block names it, no live row cites it, no brief or task note mentions it, and the deleted document was its only record — a grep of the suite for `F4-05` returns nothing outside this register. It is struck here so the id is accounted for rather than silently absent. Nothing is re-instated, no carrier is claimed, and this is **not** one of `Q62`–`Q66`: an unrecoverable row text is a records gap, not an open product question.* | — |
| ~~F4-06~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It carried the online-first-is-a-move-in-TIME-only half of `DOC06.online-first-until-offline` and of `OD-10 · studio-and-offline-last` — deferring offline was "never a reduction in scope or quality", with online-first an interim state qualifying `R14`'s boundary. `Q61` falsified both clauses at once: the move was in scope, permanently, and there is no target-state boundary left to be interim to, so `OD-10 · studio-and-offline-last` takes the SUPERSEDED mark in the Task 10 block. *(Corrected 2026-08-15: this read "both keys take the SUPERSEDED mark". `DOC06.online-first-until-offline` is dispositioned **live** at `F4-07` — which is what the next clause says — because the write-model guarantees it carried never depended on the offline layer arriving.)* The two guarantees the source tied to the **write model** rather than to connectivity — versioned-append surveys, idempotent submission — are live and unchanged at `F4-07`.* | — |
| F4-07 | P0 | policy | policy | T-FPLAT-011 |
| ~~F4-08~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the eight-capability **offline-full set** and its table — survey capture, survey photos, quick-add lead, activity/visit logging, task ticks, My Day and the read cache — which is exactly the capability the ruling removed; the cache and the mutation queue are non-goals by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1). **Exactly one of the eight survives, and only as the carve-out:** field photographs held on the device until they upload (`F4-21` / `M04-55`), status on `SCR-M04-07` only. Rows that consumed this table by row number — `M09-20`, `M02-22` — are struck in their own sections, and the briefs that cited it (`SCR-M02-01`, `SCR-M02-04`) dropped the state.* | — |
| ~~F4-09~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the nine-capability **online-only set** and its table, which existed only as the contrast half of `R14`'s boundary; `Q61` made the whole product online-only, so the set has nothing to contrast with and `DOC06.online-only-set` is SUPERSEDED rather than excluded. Its two named instances are separately live on their own merits and are **not** this row's carriers: money mutations are online-only and refused, never queued (`M11-06`), and design saves take a server version check (`M05-09` / `F4-15`). Struck `M02-22` was the row that placed lead import on this table.* | — |
| ~~F4-10~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the stale-read law — a read served from cache says so, behind a staleness banner — and both halves are non-goals by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1 "does not read from a cache", bullet 2 "no staleness or freshness banner"). The money half it pointed at deleted `F8-16` is not lost: it is `F8-12`'s law, "money must never render as final while stale", carried at `M06-41`. `docs/ux/briefs/SCR-M02-02-lead-inbox.md` and `SCR-M02-03-leads-list.md` dropped their `offline-stale-banner` state in the same sweep.* | — |
| ~~F4-11~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It said designs are not in the mobile offline set and that the web studio tolerates a connectivity blip — local geometry, layout and electrical with recomputes and saves queued. The first half is moot, since nothing is in that set; the second is a queue, a non-goal (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1). The **substantive** half of `DOC06.designs-not-mobile-offline` survives whole at live `F4-15`: every design save carries the version it was based on, a mismatch is refused, the client reloads server state and the user re-applies — "No merge, ever" — now an ordinary concurrency law. The editor and its reload prompt stay `M05-09`'s.* | — |
| ~~F4-12~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). Its surviving headline — no device prints a customer-facing price computed locally — is live twice over and already cited: `F4-04` (every money figure computed server-side, no device computes, assigns or finalises one) and `M06-41` (the module surface, verbatim). What died with the queue and the cache is the rest of the row: the offline proposal-draft request a user could queue, and "every figure shown from local data renders provisional". The provisional-rendering obligation itself is `F8-12`'s, not deleted `F8-16`'s. `DOC06.no-local-price` stays **live** in the Task 10 block on `F4-04` / `M06-41`.* | — |
| ~~F4-13~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the convention that a module may never restate the offline boundary differently from `R14`, and it recorded the `Q15` ruled set — attendance day-start/day-end taps and geofence events staying online-first. With `R14` superseded there is no boundary to restate and the convention is void; `Q15` is stamped SUPERSEDED 2026-08-07 by `Q61` in `registers/open-questions.md`. `M09-52` survives on its own merits — a crossing is evaluated and recorded server-side — not as a position relative to a boundary; `M09-20` and `M09-36` are struck in their own section.* | — |
| F4-14 | P0 | policy | policy | T-FPLAT-012 |
| F4-15 | P0 | policy | policy | T-FPLAT-012 |
| F4-16 | P0 | policy | policy | T-FPLAT-012 |
| F4-17 | P0 | policy | policy | T-FPLAT-012 |
| ~~F4-18~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It carried the conflict matrix's two device-store entries — the catalog read-only on the device, notification read-state up-only on the device — and with no on-device store neither has a subject. Its up-only read-state contract is live at `F6-07` on its own merits (reading on one device reads everywhere and nothing un-reads); the catalog laws `M01-46` and `M01-48` are untouched, while the device-copy row `M01-47` is struck in its own section, as is the notification-side `F6-18`. `DOC06.conflict-matrix` stays **live** on `F4-14`–`F4-19` with this row dropped from its ref. The loss is a direct consequence of the removal and is **not** one of `Q62`–`Q66`.* | — |
| F4-19 | P0 | policy | policy | T-FPLAT-012 |
| ~~F4-20~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the queue's acknowledgement lifecycle — every mutation applied-or-rejected, the item leaving the queue, server truth replacing local state on next sync, rejections surfacing in the attention tray. With no queue and no local state there is nothing to acknowledge and nothing to replace (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1), and the attention tray is a sync surface (bullet 2), so `DOC06.rejects-ack` is excluded. The law inside it does not die and is already cited elsewhere: a rejected submission is never a silent disappearance (`F4-21`, preserve-and-badge) and never a raw error (`F8-36`, honest refusal).* | — |
| F4-21 | P0 | mixed | SCR-M04-07 · +non-UI: validation-failure preservation; photo hold-and-upload | T-FPLAT-013 *(`T-SHELL-004` removed 2026-08-07: it was the Sync Center task, and its screen `SCR-SHELL-04` was deleted with the offline/sync capability by owner ruling `Q61`. `F4-21`'s surviving surface is `SCR-M04-07` alone. Cited as `D3` until 2026-08-15: `D3` was a local row label in the offline-removal plan, but in this suite's source vocabulary `D3` is the superseded brand-identity decision of *retired: D-census ledger*, so the ruling id is the only unambiguous authority.)* |
| ~~F4-22~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the persistent **global sync indicator** in the app shell, with its counts sentence ("3 surveys waiting · 47 photos · will upload on Wi-Fi") and its last-sync time. Killed by name: `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2 forbids a global connection indicator, and the shell shows no connectivity state at all. `docs/ux/briefs/SCR-SHELL-01-app-shell.md` is amended and `docs/tasks/SHELL.md` `T-SHELL-001` loses the element; §2 keeps the withdrawn `shell-sync-indicator` merge proposal struck at `SCR-SHELL-01` for the same audit reason this row is struck here.* | — |
| ~~F4-23~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the **sync centre** — the one surface that listed everything waiting, per item, with a retry. A sync surface is a non-goal by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2) and its screen `SCR-SHELL-04` was deleted by the same ruling, taking `T-SHELL-004` with it. The per-item retry it hosted survives **only for photographs and only on the capture screen** — `SCR-M04-07` and nowhere else (`F4-21`, `M04-55`). No live row and no screen replaces it.* | — |
| ~~F4-24~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the per-record sync chip — queued → syncing → synced, with a fourth attention state — and the chip is excised by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2: "no queued or unsynced marker on any record"). Its fourth state survives verbatim at live `F4-21`: a record that fails validation is preserved and **badged for attention**, with a reason and a retry, on the capture screen itself; `docs/tasks/F-platform.md` repoints that acceptance line to `T-FPLAT-013` rather than deleting it. `docs/ux/briefs/SCR-M02-01-quick-add-lead.md` dropped its `offline-queued` state with this row.* | — |
| F4-25 | P0 | policy | policy | T-FPLAT-014 |
| ~~F4-26~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the stale-read banner and its non-dismissibility — a banner that stated when the data was last synced and disappeared only when the read was fresh again. Excised by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2: "no staleness or freshness banner"); with no cache there is no stale read to announce. Nothing live replaces it, and the money-staleness law it was often confused with is separate and untouched at `F8-12` / `M06-41`. `docs/ux/briefs/SCR-M02-03-leads-list.md` dropped the `offline-stale-banner` state, and the non-dismissible-kind rule survives generally in the design language.* | — |
| F4-27 | P0 | policy | policy | T-FPLAT-014 |
| ~~F4-28~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It required that all five sync surfaces be translated, honest and complete. Once the five surfaces are gone (`F4-10`, `F4-22`, `F4-23`, `F4-24`, `F4-26` — non-goals under `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2) the row has no subject, and every obligation it imposed is already binding generally: `F3-01`/`F3-06` and `F3-19`/`F3-22` on translation and formatting, `F7-42` and `F7-43`'s Definition of Done on state completeness — now three base states, not four, by the same ruling. It needs **no hole**: nothing was lost, only the surfaces it applied to.* | — |
| ~~F4-29~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`) — but this is the **carve-out**, relocated rather than lost. Its content is claimed by name at live `M04-55`: a photograph is written to the device the moment it is taken, uploads when the connection returns, is resumable, defaults to Wi-Fi-or-charging with a per-batch "upload now", and is never blocked or degraded to fit a network; `F4-21` carries F4's own half (held on the device until uploaded, count and retry on the capture screen). Two clauses did not survive: "small mutations always upload immediately", which presupposed a mutation queue, and the sync centre the per-batch override was reached from, replaced by `SCR-M04-07` alone.* | — |
| ~~F4-30~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). Its pipeline content moved to `M04-55` with `F4-29` and `F4-31`, but **one detail did not travel**: the device keeping a thumbnail so the record still looks complete after the full-resolution original is pruned. No live row restates it. `docs/tasks/F-platform.md` `T-FPLAT-015` flags it to the owner as **detail lost in the move, not law lost** — the retention guarantee itself is carried by `M04-55`'s eviction order plus `F4-21`'s "held on the device until it has uploaded". It is **not** one of `Q62`–`Q66` and no carrier is invented for it here.* | — |
| ~~F4-31~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It set the device storage cap and its eviction order. The order is live and mechanised at `M04-55` — acknowledged originals evicted first, an unacknowledged original **never** evicted — which is the only place the never-silently-drop rule still bites. Two details did not travel and are flagged in `docs/tasks/F-platform.md` `T-FPLAT-015` as detail lost in the move: the **2 GB** cap figure, and the rule that when the cap is reached with nothing acknowledged to evict the product tells the user rather than choosing for them. Neither is a `Q62`–`Q66` hole.* | — |
| ~~F4-32~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`), and it left a hole: **OPEN owner question `Q66`** in `registers/open-questions.md`. Its first half — local reads and writes continuing indefinitely while the session token is expired — died correctly with the local-first store (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1). Its second half did **not** become moot, because the photograph carve-out survived: when a different user signs in on a device holding another user's unuploaded photographs, tenant isolation was to win, the held photographs discarded first and their owner told before it happens. `Q66` records that no live row carries it and blocks any multi-user field device. Not re-instated, and no carrier is named here.* | — |
| ~~F4-33~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It said a billing block never stops the queue draining. Its law survives precisely and by name in M12 — `M12-26`: a photograph already captured in the field always uploads, in every billing state, and no gate may inspect, delay or refuse it; `M12-24` puts that upload in the never-gated list. Only its words "offline-captured survey data still syncs" needed cutting: there is no survey queue to drain, the one piece of work the product holds on the device being the photograph. `DOC16.offline-drain-never-blocked` stays **live** in the Task 10 block, routed to M12.* | — |
| ~~F4-34~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). Its **mechanism** — entitlement cached on the device with a 72-hour grace, so a dead zone is not read as an absent payment — dies with the cache (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1). The two rulings it carried are live and their citations land in M12 rather than vanishing: field capture is never cut off by elapsed time, running through the full dunning grace and pausing only at `halted`, with a mid-visit halt letting the visit complete (`M12-27`), and read and export always work (`M12-22`, `M12-24`). `Q16` is **PARTLY SUPERSEDED** 2026-08-07 — closed, not open.* | — |
| ~~F4-35~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`), and it left a hole: **OPEN owner question `Q65`** in `registers/open-questions.md`. "An application too old to sync still reads" was built entirely on the sync contract — its trigger was a sync-contract change and its mitigation was that local reads keep working — so with no local store the soft lockout it required is impossible rather than merely unnecessary, and its only screen, `SCR-SHELL-05`, was deleted with it. But the product still ships client versions, and no live row anywhere covers version skew. `Q65` records that; it blocks no screen and blocks the first breaking API change. Not re-instated, and no carrier is named here.* | — |
| F4-36 | P0 | mixed | SCR-SHELL-01 · +non-UI: server-declared minimum client version… | T-FPLAT-033 |
| F4-37 | P0 | mixed | SCR-M01-01 · +non-UI: held work discarded on user switch, after warning… | T-FPLAT-034 |

### docs/prd/foundations/F5-customer-link.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F5-01 | P0 | policy | policy | LAW |
| F5-02 | P0 | policy | policy | LAW |
| F5-03 | P0 | policy | policy | LAW |
| F5-04 | P0 | context | context → ['docs/prd/foundations/F5-customer-link.md'] | realized-by: docs/prd/foundations/F5-customer-link.md |
| F5-05 | P0 | policy | policy | LAW |
| F5-06 | P0 | context | context → ['docs/prd/modules/M02-crm-and-leads.md', 'F5-32', 'F5-61', 'F5-72'] | T-F5-001 |
| F5-07 | P0 | screen | SCR-F5-01, SCR-F5-02, SCR-F5-03 | T-F5-001 |
| F5-08 | P0 | policy | policy | LAW |
| F5-09 | P0 | policy | policy | LAW |
| F5-10 | P0 | policy | policy | LAW |
| F5-11 | P0 | policy | policy | LAW |
| F5-12 | P0 | policy | policy | LAW |
| F5-13 | P0 | policy | policy | LAW |
| F5-14 | P0 | policy | policy | T-M04-009 |
| F5-15 | P0 | policy | policy | LAW |
| F5-16 | P0 | integration | integration | T-F5-010 |
| F5-17 | P1 | context | context → ['F5-12', 'F5-52', 'F5-53'] | T-F5-001 |
| F5-18 | P0 | policy | policy | LAW |
| F5-19 | P0 | policy | policy | T-F5-006 |
| F5-20 | P0 | policy | policy | T-F5-006 |
| F5-21 | P0 | policy | policy | T-F5-006 |
| F5-22 | P0 | policy | policy | T-F5-006 |
| F5-23 | P0 | policy | policy | T-F5-006 |
| F5-24 | P0 | policy | policy | T-F5-006 |
| F5-25 | P0 | screen | SCR-F5-04 | T-F5-004 |
| F5-26 | P0 | policy | policy | T-F5-007 |
| F5-27 | P0 | engine | engine | T-F5-007 |
| F5-28 | P0 | policy | policy | T-F5-007 |
| F5-29 | P0 | policy | policy | T-F5-007 |
| F5-30 | P0 | mixed | SCR-M06-20 · +non-UI: customer page never shows other contacts' links, labels or open… | T-F5-007 |
| F5-31 | P0 | policy | policy | T-F5-007 |
| F5-32 | P0 | screen | SCR-F5-01 | T-F5-001 |
| F5-33 | P0 | screen | SCR-F5-01 | T-F5-001 |
| F5-34 | P0 | policy | policy | T-F5-009 |
| F5-35 | P0 | screen | SCR-F5-01 | T-F5-001 |
| F5-36 | P0 | screen | SCR-F5-01 | T-F5-001 |
| F5-37 | P0 | screen | SCR-F5-01 | T-F5-001 |
| F5-38 | P0 | policy | policy | T-F5-009 |
| F5-39 | P0 | mixed | SCR-F5-01 · +non-UI: document render retries once then notifies operator; web page, not… | T-F5-001 |
| F5-40 | P0 | policy | policy | T-F5-009 |
| F5-41 | P0 | policy | policy | LAW |
| F5-42 | P1 | screen | SCR-F5-01 | T-F5-001 |
| F5-43 | P0 | mixed | SCR-F5-01 · +non-UI: no verbal agreement, rep note or operator act ever records acceptance | T-F5-001 |
| F5-44 | P0 | mixed | SCR-F5-01 · +non-UI: OTP-at-accept ships default OFF; per-tenant enable; any threshold is… | T-F5-001 |
| F5-45 | P0 | policy | policy | T-F5-008 |
| F5-46 | P0 | policy | policy | T-F5-008 |
| F5-47 | P0 | mixed | SCR-F5-01 · +non-UI: server revalidates version currency, staleness, deal state and… | T-F5-001 |
| F5-48 | P0 | mixed | SCR-F5-01 · +non-UI: instant confirmation message auto-sends from connected transactional… | T-F5-001 |
| F5-49 | P0 | policy | policy | T-F5-008 |
| F5-50 | P0 | policy | policy | LAW |
| F5-51 | P0 | policy | policy | LAW |
| F5-52 | P0 | screen | SCR-F5-01, SCR-F5-02, SCR-F5-03 | T-F5-001 |
| F5-53 | P0 | mixed | SCR-F5-01, SCR-F5-02, SCR-F5-03 · +non-UI: question raises tenant-side notification and timeline entry; product… | T-F5-001 |
| F5-54 | P0 | mixed | SCR-F5-01, SCR-F5-02, SCR-F5-03 · +non-UI: request queues as customer-requested callback with recorded… | T-F5-001 |
| F5-55 | P0 | screen | SCR-F5-01, SCR-F5-02, SCR-F5-03 | T-F5-001 |
| F5-56 | P1 | policy | policy | LAW |
| F5-57 | P0 | screen | SCR-F5-02 | T-F5-002 |
| F5-58 | P0 | mixed | SCR-F5-02 · +non-UI: instrument is the tenant's own connected account rail; platform never  | T-F5-002 |
| F5-59 | P0 | mixed | SCR-F5-02 · +non-UI: renders confirmation states exactly as M11 published; never computes,  | T-F5-002 |
| F5-60 | P0 | policy | policy | LAW |
| F5-61 | P0 | screen | SCR-F5-02 | T-F5-002 |
| F5-62 | P0 | screen | SCR-F5-02 | T-F5-002 |
| F5-63 | P0 | screen | SCR-F5-02 | T-F5-002 |
| F5-64 | P0 | policy | policy | LAW |
| F5-65 | P0 | policy | policy | LAW |
| F5-66 | P0 | policy | policy | LAW |
| F5-67 | P0 | policy | policy | LAW |
| F5-68 | P0 | mixed | SCR-F5-02 · +non-UI: evening-before message with crew lead's name and number is composed… | T-F5-002 |
| F5-69 | P0 | policy | policy | LAW |
| F5-70 | P0 | mixed | SCR-F5-03 · +non-UI: permanent read-only solar file for life; respond scopes dead with… | T-F5-003 |
| F5-71 | P0 | screen | SCR-F5-03 | T-F5-003 |
| F5-72 | P0 | screen | SCR-F5-03 | T-F5-003 |
| F5-73 | P0 | screen | SCR-F5-03 | T-F5-003 |
| F5-74 | P1 | policy | policy | T-F5-006 |
| F5-75 | P0 | policy | policy | T-F5-006 |
| F5-76 | P0 | policy | policy | T-F5-006 |
| F5-77 | P0 | policy | policy | T-F5-007 |
| F5-78 | P0 | mixed | SCR-F5-04 · +non-UI: per-link view and respond ceilings, global public-route ceiling with… | T-F5-004 |
| F5-79 | P0 | policy | policy | T-F5-007 |
| F5-80 | P0 | policy | policy | T-F5-006 |
| F5-81 | P0 | policy | policy | LAW |
| F5-82 | P1 | policy | policy | LAW |
| F5-83 | P0 | policy | policy | LAW |

### docs/prd/foundations/F6-notifications-and-search.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F6-01 | P0 | policy | policy | T-FPLAT-017 |
| F6-02 | P0 | policy | policy | T-FPLAT-017 |
| F6-03 | P0 | policy | policy | LAW |
| F6-04 | P0 | policy | policy | LAW |
| F6-05 | P0 | policy | policy | T-FPLAT-017 |
| F6-06 | P0 | policy | policy | T-FPLAT-017 |
| F6-07 | P0 | policy | policy | T-FPLAT-017 |
| F6-08 | P0 | policy | policy | T-FPLAT-017 |
| F6-09 | P0 | policy | policy | T-FPLAT-017 |
| F6-10 | P0 | policy | policy | T-FPLAT-018 |
| F6-11 | P0 | policy | policy | T-FPLAT-018 |
| F6-12 | P1 | screen | SCR-SHELL-03 | T-SHELL-003 |
| F6-13 | P0 | policy | policy | T-FPLAT-018 |
| F6-14 | P1 | policy | policy | T-FPLAT-018 |
| F6-15 | P2 | mixed | SCR-M01-11 · +non-UI: in-app record always lands; owner billing/compliance push never… | T-FPLAT-018 |
| F6-16 | P0 | policy | policy | T-FPLAT-018 |
| F6-17 | P0 | screen | SCR-SHELL-03 | T-SHELL-003 |
| ~~F6-18~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). Its two surviving halves were rehomed, not lost: the up-only read-state contract to `F6-07`, the never-blocking clause to `F4-27`. Kept as a struck row because this register never deletes rows. It carried `T-FPLAT-019`; the Task cell is normalised to `—` 2026-08-15 so that no struck row claims a build obligation or counts toward §4's tasked total — `T-FPLAT-019` itself is alive (it is the notification centre's data contract, and `F6-19` still carries it).* | — |
| F6-19 | P2 | mixed | SCR-SHELL-03 · +non-UI: bounded retention horizon; underlying facts persist on record… | T-FPLAT-019, T-SHELL-003 |
| F6-20 | P0 | screen | SCR-SHELL-02 | T-SHELL-002 |
| F6-21 | P0 | policy | policy | T-FPLAT-020 |
| F6-22 | P0 | engine | engine | T-FPLAT-020 |
| F6-23 | P0 | mixed | SCR-SHELL-02 · +non-UI: junk leads leave every queue and list but are never deleted | T-FPLAT-020, T-SHELL-002 |
| F6-24 | P0 | policy | policy | T-FPLAT-020 |
| F6-25 | P1 | policy | policy | T-FPLAT-020 |
| F6-26 | P0 | policy | policy | T-FPLAT-021 |
| F6-27 | P0 | policy | policy | T-FPLAT-021 |

### docs/prd/foundations/F7-design-language.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F7-01 | P0 | policy | policy | LAW |
| F7-02 | P0 | policy | policy | LAW |
| F7-03 | P0 | policy | policy | T-FPLAT-023 |
| F7-04 | P0 | policy | policy | LAW |
| F7-05 | P0 | policy | policy | LAW |
| F7-06 | P0 | policy | policy | LAW |
| F7-07 | P0 | mixed | SCR-M01-18 · +non-UI: contrast re-verification engine derives compliant shades; operator… | T-FPLAT-022 |
| F7-08 | P0 | policy | policy | LAW |
| F7-09 | P0 | policy | policy | LAW |
| F7-10 | P0 | policy | policy | LAW |
| F7-11 | P0 | policy | policy | LAW |
| F7-12 | P0 | policy | policy | LAW |
| F7-13 | P0 | policy | policy | LAW |
| F7-14 | P0 | policy | policy | LAW |
| F7-15 | P0 | policy | policy | LAW |
| F7-16 | P1 | mixed | SCR-M01-11 · +non-UI: sanctioned exception to no-borders law; per-user preference, never a… | T-FPLAT-024 |
| F7-17 | P0 | policy | policy | LAW |
| F7-18 | P0 | policy | policy | LAW |
| F7-19 | P0 | policy | policy | LAW |
| F7-20 | P1 | policy | policy | LAW |
| F7-21 | P0 | policy | policy | LAW |
| F7-22 | P0 | mixed | SCR-SHELL-01 · +non-UI: centre-verb resolution reads role presets (F2-01); composition rule… | T-FPLAT-025, T-SHELL-001 |
| F7-23 | P0 | policy | policy | LAW |
| F7-24 | P0 | policy | policy | LAW |
| F7-25 | P0 | policy | policy | LAW |
| F7-26 | P0 | policy | policy | T-FPLAT-023 |
| F7-27 | P0 | policy | policy | LAW |
| F7-28 | P0 | policy | policy | LAW |
| F7-29 | P0 | policy | policy | LAW |
| F7-30 | P0 | policy | policy | LAW |
| F7-31 | P0 | policy | policy | LAW |
| F7-32 | P0 | policy | policy | LAW |
| F7-33 | P0 | policy | policy | LAW |
| F7-34 | P0 | policy | policy | LAW |
| F7-35 | P0 | policy | policy | LAW |
| ~~F7-36~~ | — | **excluded** | *Principle 7 — "offline is a visible state on every surface, never a silent one", requiring a connection indicator, a per-record queued/unsynced state and a staleness banner on cached reads — **struck in place 2026-08-07 by owner ruling `Q61`, and deliberately not renumbered**, so Principles 8–12 keep their citations. All three surfaces it required are non-goals (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2). Unlike the other struck rows in this register it is still physically present in `docs/prd/foundations/F7-design-language.md` with its tier cell set to `—`; it is dispositioned here but is not a live requirement and is not counted in §1 or §4. **Row restored to this register 2026-08-15** — it had been removed rather than struck, and was the only id carrying a table row in the live PRD that this register did not disposition. `N10`, amended by the same ruling from four base states to three, belongs to `F7-23` and is unaffected as a row.* | — |
| F7-37 | P0 | policy | policy | LAW |
| F7-38 | P0 | policy | policy | LAW |
| F7-39 | P0 | policy | policy | LAW |
| F7-40 | P0 | policy | policy | LAW |
| F7-41 | P0 | policy | policy | LAW |
| F7-42 | P0 | policy | policy | LAW |
| F7-43 | P0 | policy | policy | LAW |
| F7-44 | P0 | policy | policy | LAW |
| F7-45 | P0 | policy | policy | LAW |

### docs/prd/foundations/F8-data-honesty.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F8-01 | P0 | policy | policy | T-FPLAT-026 |
| F8-02 | P0 | policy | policy | T-FPLAT-026 |
| F8-03 | P0 | policy | policy | T-FPLAT-026 |
| F8-04 | P0 | engine | engine | T-FPLAT-026 |
| F8-05 | P0 | policy | policy | T-FPLAT-026 |
| F8-06 | P0 | policy | policy | T-FPLAT-026 |
| F8-07 | P0 | policy | policy | T-FPLAT-026 |
| F8-08 | P0 | policy | policy | T-FPLAT-027 |
| F8-09 | P0 | policy | policy | T-FPLAT-027 |
| F8-10 | P0 | policy | policy | T-FPLAT-027 |
| F8-11 | P0 | policy | policy | T-FPLAT-027 |
| F8-12 | P0 | policy | policy | T-FPLAT-028 |
| F8-13 | P0 | engine | engine | T-FPLAT-028 |
| F8-14 | P0 | policy | policy | T-FPLAT-028 |
| F8-15 | P0 | policy | policy | T-FPLAT-028 |
| ~~F8-16~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It read "money read from cache, or produced away from the server, renders provisional" and died with its subject: there is no cache and no away-from-server computation (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1). The obligation itself is not lost — it is the general money law, fully live at `F8-12` ("money must never render as final while stale"), with `F8-13`'s compare-not-flag and `F4-04`'s server-owns-money beside it, and the module surfaces at `M06-41` and `M11-06`. It carried `T-FPLAT-028`, which is alive and still builds `F8-12`, `F8-15` and `F8-17`. **Flagged, outside this file's ownership:** live PRD rows still cite `F8-16` (`M02-38`, `M08-37`, plus pointers in `M05` and `M11`) and should be repointed to `F8-12`; `docs/tasks/F-platform.md` records the same finding.* | — |
| F8-17 | P0 | policy | policy | T-FPLAT-028 |
| F8-18 | P0 | policy | policy | T-FPLAT-028 |
| F8-19 | P0 | policy | policy | T-FPLAT-028 |
| F8-20 | P0 | policy | policy | T-FPLAT-029 |
| F8-21 | P0 | policy | policy | T-FPLAT-029 |
| F8-22 | P0 | policy | policy | T-FPLAT-029 |
| F8-23 | P0 | policy | policy | T-FPLAT-029 |
| F8-24 | P0 | policy | policy | T-FPLAT-029 |
| F8-25 | P0 | policy | policy | T-FPLAT-030 |
| F8-26 | P0 | policy | policy | T-FPLAT-030 |
| F8-27 | P0 | policy | policy | T-FPLAT-030 |
| F8-28 | P0 | policy | policy | T-FPLAT-030 |
| F8-29 | P0 | policy | policy | T-FPLAT-030 |
| F8-30 | P0 | policy | policy | T-FPLAT-031 |
| F8-31 | P0 | policy | policy | T-FPLAT-031 |
| F8-32 | P0 | policy | policy | T-FPLAT-031 |
| F8-33 | P0 | policy | policy | T-FPLAT-032 |
| F8-34 | P0 | policy | policy | T-FPLAT-032 |
| F8-35 | P0 | policy | policy | T-FPLAT-032 |
| F8-36 | P0 | policy | policy | T-FPLAT-032 |

### docs/prd/modules/M01-onboarding-and-tenant-config.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M01-01 | P0 | screen | SCR-M01-02 | T-M01-002 |
| M01-02 | P0 | mixed | SCR-M01-01 · +non-UI: Google identity links onto same phone-identity account at first… | T-M01-001 |
| M01-03 | P0 | mixed | SCR-M01-01 · +non-UI: layered OTP delivery rail: SMS primary, auto fallback channel on… | T-M01-001 |
| M01-04 | P0 | mixed | SCR-M01-01 · +non-UI: rate limits: 3/15min and 8/day per phone, resend cooldown, 5-fail… | T-M01-001 |
| M01-05 | P0 | policy | policy | T-M01-025 |
| M01-06 | P1 | policy | policy | T-M01-025 |
| M01-07 | P0 | policy | policy | T-M01-025 |
| M01-08 | P0 | mixed | SCR-M01-02 · +non-UI: one account per phone number globally; no duplicate company | T-M01-002 |
| M01-09 | P1 | screen | SCR-M01-02 | T-M01-002 |
| M01-10 | P0 | policy | policy | T-M01-025 |
| M01-11 | P0 | policy | policy | LAW |
| M01-12 | P0 | screen | SCR-M01-07 | T-M01-007 |
| M01-13 | P0 | mixed | SCR-M01-08 · +non-UI: OTP verification atomically creates user plus tenant membership plus… | T-M01-008 |
| M01-14 | P0 | screen | SCR-M01-09 | T-M01-009 |
| M01-15 | P1 | screen | SCR-M01-10 | T-M01-010 |
| M01-16 | P1 | screen | SCR-SHELL-01 | T-SHELL-001 |
| M01-17 | P0 | mixed | SCR-SHELL-01 · +non-UI: handoff law: onboarding ends on the role-decided home with real… | T-M01-025, T-SHELL-001 |
| M01-18 | P0 | policy | policy | T-M01-025 |
| M01-19 | P0 | screen | SCR-M01-12 | T-M01-012 |
| M01-20 | P0 | screen | SCR-M01-13 | T-M01-013 |
| M01-21 | P0 | screen | SCR-M01-14 | T-M01-014 |
| M01-22 | P0 | policy | policy | LAW |
| M01-23 | P0 | screen | SCR-M01-04 | T-M01-004 |
| M01-24 | P0 | screen | SCR-M01-05 | T-M01-005 |
| M01-25 | P0 | screen | SCR-M01-05 | T-M01-005 |
| M01-26 | P0 | screen | SCR-M01-06 | T-M01-006 |
| M01-27 | P0 | policy | policy | T-M01-026 |
| M01-28 | P0 | policy | policy | T-M01-026 |
| M01-29 | P0 | policy | policy | LAW |
| M01-30 | P1 | policy | policy | LAW |
| M01-31 | P0 | mixed | SCR-M01-05 · +non-UI: single write-point for identity facts; proposal, agent, link, invoice  | T-M01-005 |
| M01-32 | P0 | mixed | SCR-M01-15 · +non-UI: resolution order: tenant override, then own item, then platform item | T-M01-015 |
| M01-33 | P0 | policy | policy | T-M01-027 |
| M01-34 | P0 | mixed | SCR-M01-15 · +non-UI: typed per-kind specs; certifications scheme-keyed from pack… | T-M01-015 |
| M01-35 | P0 | mixed | SCR-M01-15 · +non-UI: three-value provenance enum: verified-datasheet, tenant-provided… | T-M01-015 |
| M01-36 | P0 | mixed | SCR-M01-16 · +non-UI: tenant SKU is full item, private to tenant, no platform approval | T-M01-016 |
| M01-37 | P0 | mixed | SCR-M01-15 · +non-UI: sparse override: unset fields fall through; one override per platform  | T-M01-015 |
| M01-38 | P0 | mixed | SCR-M01-15 · +non-UI: one search over both tiers, preferred-first ranking, shared with the… | T-M01-015 |
| M01-39 | P0 | screen | SCR-M01-16 | T-M01-016 |
| M01-40 | P0 | mixed | SCR-M01-16 · +non-UI: PDF spec-extraction engine; output never committed without review… | T-M01-016 |
| M01-41 | P0 | mixed | SCR-M01-17 · +non-UI: smart matching engine: platform matches become price overrides… | T-M01-017 |
| M01-42 | P0 | policy | policy | T-M01-027 |
| M01-43 | P0 | mixed | SCR-M01-15 · +non-UI: append-only labelled releases; designs and proposals pin release… | T-M01-015 |
| M01-44 | P0 | policy | policy | T-M01-027 |
| M01-45 | P1 | policy | policy | T-M01-027 |
| M01-46 | P0 | policy | policy | LAW |
| ~~M01-47~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It held the catalog and price book read-only on the device; with no on-device store the rule has no subject, and a read cache is a non-goal by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1 — "The product does not read from a cache"). No live row replaces it and none is needed: the catalog is read from the server like every other read, and its own laws (`M01-46`, `M01-48`) are untouched. `docs/tasks/M01-onboarding.md` records the same removal under `T-M01-027`, which is alive.* | — |
| M01-48 | P0 | mixed | SCR-M01-15 · +non-UI: immutable price-book versions, exactly one active, default margin… | T-M01-015 |
| M01-49 | P0 | policy | policy | LAW |
| M01-50 | P0 | mixed | SCR-M01-18 · +non-UI: computational contrast re-verify on palette save; compliant shades… | T-M01-018 |
| M01-51 | P0 | screen | SCR-M01-19 | T-M01-019 |
| M01-52 | P1 | screen | SCR-M01-19 | T-M01-019 |
| M01-53 | P0 | policy | policy | T-M01-026 |
| M01-54 | P0 | mixed | SCR-M01-20 · +non-UI: percentages must sum exactly 100.00; two seeded standard templates… | T-M01-020 |
| M01-55 | P0 | mixed | SCR-M01-21 · +non-UI: per-language tenant content class; sends via connected transactional… | T-M01-021 |
| M01-56 | P0 | policy | policy | LAW |
| M01-57 | P0 | screen | SCR-M07-05 | T-M07-005 |
| M01-58 | P0 | screen | SCR-M01-22 | T-M01-022 |
| M01-59 | P1 | mixed | SCR-M01-23 · +non-UI: holiday additions only narrow calling availability; per-user UI… | T-M01-023 |
| M01-60 | P0 | mixed | SCR-M01-24 · +non-UI: write-only credential storage, scheduled probes, every decrypt… | T-M01-024 |

### docs/prd/modules/M02-crm-and-leads.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M02-01 | P0 | screen | SCR-M02-01 | T-M02-001 |
| M02-02 | P0 | policy | policy | T-M02-007 |
| M02-03 | P0 | mixed | SCR-M02-01, SCR-M02-04 · +non-UI: nothing rejected for incompleteness, nothing invented to fill gaps | T-M02-001 |
| ~~M02-04~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`) — and this one leaves a hole, recorded as **OPEN owner question `Q62`** in `registers/open-questions.md`, which blocks `SCR-M02-01` and `SCR-M02-04`; both briefs carry dated UNRESOLVED notes, and each names its own state for the unresolved case — `SCR-M02-04` carries `possible-duplicate-flag`, `SCR-M02-01` carries `check-inconclusive`, the same requirement seen from the capture side, where the check has not answered by the time the save proceeds. **(State names corrected 2026-08-15: this cell previously claimed `possible-duplicate-flag` on both briefs, and `SCR-M02-01` has never carried it.)** The row stated that a duplicate the live pre-save check could not see is never resolved silently: both records are flagged "possible duplicate" and the rep resolves them through the standard three-choice sheet on next open, never an automatic merge. It was cut because its wording was framed around a device that had saved without the server, but the race is an ordinary online one — `M02-07` runs the live check strictly before the save. Nothing live carries it (`M02-12` covers only the deliberate "Create anyway" duplicate; `M02-59`/`M02-60` are the different-number manual merge). Not re-instated here and no replacement invented — `Q62` is the owner's call. `Q22`, the 2026-08-04 ruling that made this row final, is SUPERSEDED 2026-08-07 by `Q61`.* **(Amended 2026-08-15: `Q62` is no longer open. The owner ruled and **restored this law as new live row `M02-66`**, in `docs/prd/modules/M02-crm-and-leads.md` §M02.2, dispositioned in this section on `SCR-M02-01` and `SCR-M02-04`; `M02-66`'s source column names `M02-04` as the row it restores. **This row stays struck and this id is not resurrected** — `M02-04` genuinely was deleted on 2026-08-07 and every dated task and register record saying so stays true. Everything above — the hole, the blocked briefs, `Q62` open, no live row carrying the law — was true from 2026-08-07 until that ruling and is left standing as the record of it.)** | — |
| M02-05 | P0 | mixed | SCR-M02-01 · +non-UI: segment rides the lead to its proposal, never re-asked | T-M02-001 |
| M02-06 | P0 | screen | SCR-M02-01, SCR-SHELL-01 | T-M02-001, T-SHELL-001 |
| M02-07 | P0 | policy | policy | T-M02-008 |
| M02-08 | P0 | screen | SCR-M02-01, SCR-M02-05, SCR-M02-04 | T-M02-008 |
| M02-09 | P0 | mixed | SCR-M02-01, SCR-M02-05, SCR-M02-04 · +non-UI: exactly three choices, no silent default; dismissing creates nothing | T-M02-008 |
| M02-10 | P0 | policy | policy | T-M02-008 |
| M02-11 | P0 | mixed | SCR-M02-01, SCR-M02-05 · +non-UI: appends enquiry activity, notifies owner, changes no stage or owner | T-M02-008 |
| M02-12 | P0 | mixed | SCR-M02-01, SCR-M02-05 · +non-UI: mandatory reason audited on both timelines; records cross-linked for… | T-M02-008 |
| M02-13 | P0 | mixed | SCR-M02-02, SCR-M02-03 · +non-UI: closed v1 source enum; source set by path, immutable | T-M02-009 |
| M02-14 | P0 | policy | policy | T-M02-009 |
| M02-15 | P0 | policy | policy | T-M02-010 |
| M02-16 | P0 | mixed | SCR-M02-04 · +non-UI: bidirectional referral link; credits ledger spec-locked out of v1 | T-M02-009 |
| M02-17 | P0 | mixed | SCR-M01-22 · +non-UI: D13 deferral; M03 supersedes as brief scope, feeds this inbox | T-M02-017 |
| M02-18 | P0 | screen | SCR-M02-05 | T-M02-005 |
| M02-19 | P0 | screen | SCR-M02-05 | T-M02-005 |
| M02-20 | P0 | mixed | SCR-M02-05 · +non-UI: skip is default; create-anyway needs audited reason per row | T-M02-005 |
| M02-21 | P0 | mixed | SCR-M02-05 · +non-UI: async background job; landed rows never rolled back on partial… | T-M02-005 |
| ~~M02-22~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). "Import is online-only" existed only to place lead import on the offline boundary, and there is no boundary left to place it on — the whole product requires a live connection (`foundations/F4-data-integrity.md` preamble), so the statement is true of everything and worth stating of nothing. Its citation of `F4-09` (the online-only capability table) points at a deleted row. The import behaviour itself is untouched: `M02-18`–`M02-21` still own mapping, preview, duplicate handling and the background job, and `SCR-M02-05`'s `importing-progress` keeps the server-side continuation of a connection drop mid-import.* | — |
| M02-23 | P0 | screen | SCR-M02-02 | T-M02-002 |
| M02-24 | P0 | screen | SCR-M02-02 | T-M02-002 |
| M02-25 | P1 | screen | SCR-M02-02 | T-M02-002 |
| ~~M02-26~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). Its cache-read-with-staleness-banner half is a non-goal twice over (`foundations/F4-data-integrity.md` §5 · Non-goals, bullets 1–2). Its other half is **not** about connectivity and leaves a hole, recorded as **OPEN owner question `Q63`**, which blocks `SCR-M02-02` (dated UNRESOLVED note and an `assign-waiting` state on the brief): the inbox's triage actions are server-completed — assignment and junking reach the server to complete and say so while they wait, nothing applied optimistically. No live row carries it; `M02-28` pushes the other way ("choosing one assigns immediately without a confirm step") and `F8-36` governs only the failure path. The shape exists elsewhere at `M11-06`/`M11-39` and `M05-09`. Not re-instated and no replacement invented — `Q63` is the owner's call.* **(Amended 2026-08-15: `Q63` is no longer open. The owner ruled and **restored this law as new live row `M02-67`**, in `docs/prd/modules/M02-crm-and-leads.md` §M02.5, dispositioned in this section on `SCR-M02-02`; `M02-67`'s source column names `M02-26` as the row it restores, and it carries the junk decision (`M02-24`, `M02-55`) that this row's deletion had left covered by nothing. **This row stays struck and this id is not resurrected** — `M02-26` genuinely was deleted on 2026-08-07 and every dated task and register record saying so stays true. Everything above — the hole, the blocked brief, `Q63` open, no live row carrying the law — was true from 2026-08-07 until that ruling and is left standing as the record of it.)** | — |
| M02-27 | P0 | policy | policy | LAW |
| M02-28 | P0 | screen | SCR-M02-02, SCR-M02-04 | T-M02-002 |
| M02-29 | P0 | screen | SCR-M02-02, SCR-M02-04 | T-M02-002 |
| M02-30 | P0 | policy | policy | T-M02-011 |
| M02-31 | P0 | policy | policy | T-M02-011 |
| M02-32 | P0 | screen | SCR-M02-04 | T-M02-004 |
| M02-33 | P0 | mixed | SCR-M02-04 · +non-UI: connected WhatsApp/SMS transactional send with honest delivery… | T-M02-013 |
| M02-34 | P0 | mixed | SCR-M02-04 · +non-UI: contact numbers participate in dedupe; exactly one primary… | T-M02-004 |
| M02-35 | P0 | mixed | SCR-M02-04 · +non-UI: append-only law; every module writes; nothing edits or deletes | T-M02-012 |
| M02-36 | P0 | policy | policy | T-M02-012 |
| M02-37 | P0 | mixed | SCR-M02-04 · +non-UI: M07 gate reads one row per dial; stop-calling irreversible; M03… | T-M02-007 |
| M02-38 | P1 | policy | policy | LAW |
| M02-39 | P0 | screen | SCR-M02-04 | T-M02-004 |
| M02-40 | P0 | screen | SCR-M02-03 | T-M02-003 |
| M02-41 | P0 | policy | policy | T-M02-015 |
| M02-42 | P0 | mixed | SCR-M02-04 · +non-UI: closed six-reason vocabulary, mandatory; feeds win/loss analytics | T-M02-004 |
| M02-43 | P0 | policy | policy | T-M02-010 |
| M02-44 | P0 | policy | policy | T-M02-010 |
| M02-45 | P1 | context | context → ['M02-42', 'M02-34'] | realized-by: M02-42, M02-34 |
| M02-46 | P0 | mixed | SCR-M02-04 · +non-UI: creates the visit object M04 owns from that moment | T-M02-014 |
| M02-47 | P0 | mixed | SCR-M02-04 · +non-UI: transactional-channel auto-send with honest delivery; copy-paste… | T-M02-013 |
| M02-48 | P1 | mixed | SCR-M02-04 · +non-UI: exactly one reminder per visit; no surface may generate a second | T-M02-013 |
| M02-49 | P0 | policy | policy | T-M02-015 |
| M02-50 | P0 | mixed | SCR-M02-02 · +non-UI: 24h-unassigned timer escalates to owner via notification; state… | T-M02-015 |
| M02-51 | P0 | mixed | SCR-M02-04 · +non-UI: hidden from My Day; 09:00 wake creates follow-up task | T-M02-015 |
| M02-52 | P0 | mixed | SCR-M02-03 · +non-UI: nightly sweep flags after thirty inactive days; any activity… | T-M02-015 |
| M02-53 | P0 | policy | policy | T-M02-015 |
| M02-54 | P0 | policy | policy | T-M02-015 |
| M02-55 | P0 | policy | policy | T-M02-015 |
| M02-56 | P0 | policy | policy | T-M02-015 |
| M02-57 | P0 | policy | policy | T-M02-015 |
| M02-58 | P0 | policy | policy | T-M02-015 |
| M02-59 | P0 | screen | SCR-M02-06 | T-M02-006 |
| M02-60 | P0 | mixed | SCR-M02-06 · +non-UI: re-points every reference to survivor; loser becomes tombstone, never  | T-M02-016 |
| M02-61 | P0 | policy | policy | T-M02-016 |
| M02-62 | P0 | policy | policy | T-M02-016 |
| M02-63 | P0 | mixed | SCR-M02-06 · +non-UI: both records must be in actor's visibility scope; the merge completes on the server; no undo *(2026-08-07: "online-first" replaced — the three-term connectivity vocabulary was `F4-01`'s and was deleted with the offline/sync capability, `Q61`; the behaviour is unchanged)* | T-M02-006 |
| M02-64 | P0 | mixed | SCR-M01-22 · +non-UI: toggle governs new capture only; existing leads untouched; manual… | T-M02-017 |
| M02-65 | P0 | screen | SCR-M01-22 | T-M02-017 |
| M02-66 | P0 | mixed | SCR-M02-01, SCR-M02-04 · +non-UI: apply-time collision flags both records and cross-links them (`M02-12`); nothing ever merged automatically | T-M02-008 |
| M02-67 | P0 | mixed | SCR-M02-02 · +non-UI: assign and mark-junk are server-completed; failure returns the lead to the queue naming the reason | T-M02-002 |

### docs/prd/modules/M03-marketing.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M03-01 | P0 | policy | policy | LAW |
| M03-02 | P0 | policy | policy | LAW |
| M03-03 | P0 | policy | policy | LAW |
| M03-04 | P0 | mixed | SCR-M03-06 · +non-UI: per-recipient state only from channel's own reporting; never inferred  | T-M03-006 |
| M03-05 | P0 | policy | policy | LAW |
| M03-06 | P0 | policy | policy | LAW |
| M03-07 | P0 | policy | policy | LAW |
| M03-08 | P0 | mixed | SCR-M03-01, SCR-M03-05 · +non-UI: a campaign that sent anything is archived, never deleted (compliance… | T-M03-001 |
| M03-09 | P0 | policy | policy | T-M03-011 |
| M03-10 | P0 | mixed | SCR-M03-02 · +non-UI: aggregate-only whole-base scope; no individual lead-file read through  | T-M03-002 |
| M03-11 | P0 | screen | SCR-M03-02, SCR-M03-04 | T-M03-002 |
| M03-12 | P0 | screen | SCR-M03-04 | T-M03-004 |
| M03-13 | P0 | policy | policy | T-M03-011 |
| M03-14 | P0 | mixed | SCR-M03-06 · +non-UI: audience re-resolved at send time against current records | T-M03-006 |
| M03-15 | P1 | screen | SCR-M03-03 | T-M03-003 |
| M03-16 | P2 | context | context → registers/enhancements.md (REC, not v1 scope) | realized-by: docs/prd/registers/enhancements.md (REC, not v1 scope) |
| M03-17 | P2 | context | context → registers/enhancements.md (REC, not v1 scope) | realized-by: docs/prd/registers/enhancements.md (REC, not v1 scope) |
| M03-18 | P0 | policy | policy | LAW |
| M03-19 | P0 | mixed | SCR-M03-07 · +non-UI: connection state machine; forms without required phone field refused… | T-M03-007 |
| M03-20 | P0 | integration | integration | T-M03-014 |
| M03-21 | P0 | integration | integration | T-M03-015 |
| M03-22 | P0 | integration | integration | T-M03-016 |
| M03-23 | P0 | integration | integration | T-M03-017 |
| M03-24 | P0 | screen | SCR-M03-10 | T-M03-010 |
| M03-25 | P0 | context | context → modules/M07 (M07-47, M07-48, M07-27) and M02-14; appears on Channel Health | realized-by: docs/prd/modules/M07-sales-execution.md (M07-47, M07-48, M07-27) and M02-14; appears on Channel Health (SCR-M03-08) |
| M03-26 | P0 | mixed | SCR-M03-06 · +non-UI: per-channel reporting-capability declaration drives which columns… | T-M03-006 |
| M03-27 | P0 | mixed | SCR-M03-07 · +non-UI: disconnect never deletes captures, badges or completed reports | T-M03-007 |
| M03-28 | P0 | mixed | SCR-M03-05, SCR-M03-07 · +non-UI: break detection pauses sending campaigns, notifies owner; unsent… | T-M03-007 |
| M03-29 | P1 | screen | SCR-M03-08 | T-M03-008 |
| M03-30 | P0 | policy | policy | T-M03-012 |
| M03-31 | P0 | policy | policy | T-M03-012 |
| M03-32 | P0 | policy | policy | T-M03-012 |
| M03-33 | P0 | policy | policy | LAW |
| M03-34 | P0 | mixed | SCR-M02-04 · +non-UI: consent ledger auto-recorded per contact per channel class; import… | T-M03-013 |
| M03-35 | P1 | engine | engine | T-M03-018 |
| M03-36 | P0 | mixed | SCR-M03-08 · +non-UI: capture-failure log records what arrived and why unusable | T-M03-008 |
| M03-37 | P2 | context | context → registers/enhancements.md (REC); modules/M07 would own implementation | realized-by: docs/prd/registers/enhancements.md (REC); modules/M07 would own implementation |
| M03-38 | P0 | mixed | SCR-M03-03 · +non-UI: never machine-translated or auto-substituted; missing-language gap… | T-M03-003 |
| M03-39 | P0 | mixed | SCR-M03-09 · +non-UI: only approved template schedulable; third-party approval clock gates… | T-M03-009 |
| M03-40 | P0 | policy | policy | T-M03-009 |
| M03-41 | P0 | mixed | SCR-M03-03 · +non-UI: send-time token resolution: fallback or exclude recipient, never… | T-M03-003 |
| M03-42 | P1 | policy | policy | LAW |
| M03-43 | P2 | context | context → registers/enhancements.md (REC; Q6 disclosure floor an input) | realized-by: docs/prd/registers/enhancements.md (REC; Q6 disclosure floor an input) |
| M03-44 | P0 | screen | SCR-M03-04 | T-M03-004 |
| M03-45 | P0 | mixed | SCR-M03-04, SCR-M03-05 · +non-UI: 80% pre-warn; overage needs approve-campaign-spend grant; mid-send… | T-M03-004 |
| M03-46 | P0 | policy | policy | T-M03-013 |
| M03-47 | P0 | policy | policy | T-M03-013 |
| M03-48 | P0 | policy | policy | T-M03-013 |
| M03-49 | P0 | mixed | SCR-M03-06 · +non-UI: report counts identical to counts the usage ledger bills from | T-M03-006 |
| M03-50 | P1 | mixed | SCR-M03-05 · +non-UI: channel throughput/daily ceilings respected; limits attributed to… | T-M03-005 |
| M03-51 | P0 | policy | policy | LAW |
| M03-52 | P1 | mixed | SCR-M03-08 · +non-UI: draft rate-card values never treated launch-final; metered selling… | T-M03-008 |
| M03-53 | P0 | mixed | SCR-M03-06 · +non-UI: no revenue, generated-deal or causation claim anywhere | T-M03-006 |
| M03-54 | P0 | policy | policy | LAW |
| M03-55 | P0 | screen | SCR-M03-06 | T-M03-006 |
| M03-56 | P0 | screen | SCR-M03-06 | T-M03-006 |
| M03-57 | P1 | policy | policy | T-M03-019 |
| M03-58 | P1 | policy | policy | T-M03-019 |

### docs/prd/modules/M04-survey.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M04-01 | P0 | policy | policy | T-M04-015 |
| M04-02 | P0 | mixed | SCR-M04-02, SCR-M04-03 · +non-UI: imagery fetch + roof detection pipeline; every figure stamped derived | T-M04-011 |
| M04-03 | P0 | screen | SCR-M04-07 | T-M04-007 |
| M04-04 | P0 | policy | policy | LAW |
| M04-05 | P0 | mixed | SCR-M04-01 · +non-UI: five mode-choice rules; guidance stated, never enforced as lock | T-M04-001 |
| M04-06 | P0 | policy | policy | LAW |
| M04-07 | P0 | policy | policy | LAW |
| M04-08 | P0 | screen | SCR-M04-02 | T-M04-002 |
| M04-09 | P0 | integration | integration | T-M04-011 |
| M04-10 | P0 | policy | policy | T-M04-011 |
| M04-11 | P0 | mixed | SCR-M04-03 · +non-UI: imagery failure never blocks the survey | T-M04-003 |
| M04-12 | P0 | mixed | SCR-M04-02 · +non-UI: pin correction propagates to the site record | T-M04-002 |
| M04-13 | P0 | screen | SCR-M04-03 | T-M04-003 |
| M04-14 | P0 | screen | SCR-M04-03 | T-M04-003 |
| M04-15 | P0 | mixed | SCR-M04-03 · +non-UI: never applied silently; corrector set = anyone who runs remote survey | T-M04-003 |
| M04-16 | P0 | screen | SCR-M04-03 | T-M04-003 |
| M04-17 | P0 | engine | engine | T-M04-012 |
| M04-18 | P0 | engine | engine | T-M04-012 |
| M04-19 | P0 | engine | engine | T-M04-012 |
| M04-20 | P1 | engine | engine | T-M04-012 |
| M04-21 | P0 | mixed | SCR-M04-03 · +non-UI: unavailable capability hides its entry points entirely | T-M04-003 |
| M04-22 | P0 | mixed | SCR-M04-03 · +non-UI: manual path never metered, always sufficient | T-M04-003 |
| M04-23 | P0 | mixed | SCR-M04-03 · +non-UI: allowance checked before the call; empty result never bills | T-M04-003 |
| M04-24 | P0 | engine | engine | T-M04-013 |
| M04-25 | P0 | policy | policy | LAW |
| M04-26 | P0 | screen | SCR-M04-04 | T-M04-004 |
| M04-27 | P0 | policy | policy | LAW |
| M04-28 | P0 | mixed | SCR-M04-10 · +non-UI: roof-origin path recorded on the survey record | T-M04-010 |
| M04-29 | P0 | screen | SCR-M04-05 | T-M04-005 |
| M04-30 | P0 | screen | SCR-M04-05 | T-M04-005 |
| M04-31 | P0 | mixed | SCR-M04-05 · +non-UI: gap record: four resolutions, owner, history, audited waivers | T-M04-005 |
| M04-32 | P0 | screen | SCR-M04-05, SCR-M04-07 | T-M04-005 |
| M04-33 | P0 | policy | policy | LAW |
| M04-34 | P0 | policy | policy | T-M04-014 |
| M04-35 | P0 | policy | policy | T-M04-014 |
| M04-36 | P0 | policy | policy | LAW |
| M04-37 | P0 | mixed | SCR-M04-09 · +non-UI: both versions survive; earlier version never overwritten | T-M04-009 |
| M04-38 | P0 | screen | SCR-M04-06 | T-M04-006 |
| ~~M04-39~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It carried offline physical capture and local-first survey saves — "offline is the normal case, not the edge case", "everything saves locally first" — which is precisely the capability the ruling removed and a non-goal by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1). The guided capture experience itself is untouched in §M04.7–§M04.8; what is gone is the promise that it works without a connection, and `Q61` records the accepted cost: a surveyor on a roof with no signal cannot open their assigned work. `docs/prd/modules/M04-survey.md` §M04.7 carries the matching strike note.* | — |
| ~~M04-40~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the durable survey queue — the device holding captured surveys until they uploaded. `M04-55` now rules the photograph queue "the product's one and only device-held queue", holding photographs and nothing else; any other queue is a non-goal (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1). The one surviving piece of deferred work is the photo carve-out (`F4-21`, `M04-55`), whose status appears on `SCR-M04-07` alone.* | — |
| ~~M04-41~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It was the survey-side status system — what a queued survey and its photographs said about themselves on `SCR-M04-06` and `SCR-M04-10` — and every queued or unsynced marker on any record is a non-goal by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 2). The one status surface left is the photo waiting-count and retry on the capture screen (`F4-21`, `M04-55`, `SCR-M04-07` only). `SCR-M04-06` and `SCR-M04-10` each lose one row from their §2 count as a result.* | — |
| M04-42 | P0 | screen | SCR-M04-07 | T-M04-007 |
| M04-43 | P0 | screen | SCR-M04-07 | T-M04-007 |
| M04-44 | P0 | screen | SCR-M04-07, SCR-M04-10 | T-M04-007 |
| M04-45 | P0 | mixed | SCR-M04-07 · +non-UI: person-entered value feeds design's soft-cap overrun warning | T-M04-007 |
| M04-46 | P0 | screen | SCR-M04-08 | T-M04-008 |
| M04-47 | P0 | screen | SCR-M04-07 | T-M04-007 |
| M04-48 | P0 | policy | policy | T-M04-016 |
| M04-49 | P0 | screen | SCR-M04-09 | T-M04-009 |
| M04-50 | P0 | screen | SCR-M04-09 | T-M04-009 |
| M04-51 | P0 | policy | policy | LAW |
| M04-52 | P0 | mixed | SCR-M04-09 · +non-UI: F6 notification fires from the applied submission, once | T-M04-009 |
| M04-53 | P0 | policy | policy | LAW |
| M04-54 | P0 | mixed | SCR-M04-07 · +non-UI: closed tag and source vocabularies; pin to obstruction | T-M04-007 |
| M04-55 | P0 | policy | policy | T-M04-017 |
| M04-56 | P0 | policy | policy | T-M04-017 |
| M04-57 | P0 | mixed | SCR-M04-10 · +non-UI: versioned-append immutability; states draft, in-progress, submitted… | T-M04-015 |
| M04-58 | P0 | mixed | SCR-M04-06 · +non-UI: exactly one message: auto via connected channel, else composed | T-M04-006 |
| M04-59 | P0 | mixed | SCR-M04-06 · +non-UI: correction propagates to the site record | T-M04-006 |
| M04-60 | P0 | policy | policy | T-M04-015 |
| M04-61 | P0 | policy | policy | T-M04-015 |
| M04-62 | P0 | policy | policy | T-M04-015 |
| M04-63 | P0 | screen | SCR-M04-10 | T-M04-010 |
| M04-64 | P0 | screen | SCR-M04-10 | T-M04-010 |
| M04-65 | P0 | engine | engine | T-M04-013 |
| M04-66 | P0 | policy | policy | LAW |

### docs/prd/modules/M05-design-studio.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M05-01 | P0 | policy | policy | LAW |
| M05-02 | P0 | mixed | SCR-MS-03 · +non-UI: internal step identifiers stay stable across the fold; no step-5… | T-MS-360 |
| M05-03 | P0 | screen | SCR-MS-03 | T-MS-360 |
| M05-04 | P0 | screen | SCR-MS-03 | T-MS-360 |
| M05-05 | P0 | mixed | SCR-MS-03 · +non-UI: electrical hard gate law; never normalised with M06 free navigation | T-MS-360 |
| M05-06 | P0 | screen | SCR-MS-03 | T-MS-360 |
| M05-07 | P0 | policy | policy | LAW |
| M05-08 | P0 | policy | policy | LAW |
| M05-09 | P0 | mixed | SCR-MS-03 · +non-UI: server version check, single-editor LWW, online-only, no merge ever | T-MS-360 |
| M05-10 | P0 | policy | policy | LAW |
| M05-11 | P0 | policy | policy | LAW |
| M05-12 | P0 | policy | policy | LAW |
| M05-13 | P0 | mixed | SCR-MS-03 · +non-UI: draft proposals blocked from sending until review; nothing… | T-MS-117 |
| M05-14 | P0 | screen | SCR-MS-04 | T-MS-101 |
| M05-15 | P0 | screen | SCR-MS-04 | T-MS-101 |
| M05-16 | P0 | mixed | SCR-MS-04 · +non-UI: imagery tile pinned at capture, never changes underneath; failure… | T-MS-101 |
| M05-17 | P0 | mixed | SCR-MS-04 · +non-UI: energy source-of-record ladder (PVGIS SARAH3→ERA5); ±10% fallback… | T-MS-101 |
| M05-18 | P0 | mixed | SCR-MS-04 · +non-UI: async building-insights-class provider; enhancement, never a… | T-MS-101 |
| M05-19 | P0 | mixed | SCR-MS-04 · +non-UI: relocation >25m wipes all traced geometry; undoable | T-MS-101 |
| M05-20 | P0 | mixed | SCR-MS-04 · +non-UI: soft cap never blocks; warning travels to readiness and compliance… | T-MS-101 |
| M05-21 | P0 | screen | SCR-MS-01 | T-MS-363 |
| M05-22 | P0 | screen | SCR-MS-05 | T-MS-102 |
| M05-23 | P0 | mixed | SCR-MS-05 · +non-UI: consumes validated M04 artifact only, never raw detector; provenance… | T-MS-102 |
| M05-24 | P0 | screen | SCR-MS-05 | T-MS-102 |
| M05-25 | P0 | screen | SCR-MS-05 | T-MS-102 |
| M05-26 | P0 | mixed | SCR-MS-05 · +non-UI: scale correction plus expert north offset rescales all geometry | T-MS-102 |
| M05-27 | P0 | mixed | SCR-MS-05 · +non-UI: never a silent cascade of orphaned downstream items | T-MS-102 |
| M05-28 | P0 | mixed | SCR-MS-05 · +non-UI: manual/AI provenance within four-tier vocabulary, no fifth tier | T-MS-102 |
| M05-29 | P0 | mixed | SCR-MS-05 · +non-UI: never measured from photographs; every dimension human-entered | T-MS-102 |
| M05-30 | P0 | screen | SCR-MS-06 | T-MS-103 |
| M05-31 | P0 | screen | SCR-MS-06 | T-MS-103 |
| M05-32 | P0 | screen | SCR-MS-06 | T-MS-103 |
| M05-33 | P0 | screen | SCR-MS-06 | T-MS-103 |
| M05-34 | P0 | screen | SCR-MS-06 | T-MS-103 |
| M05-35 | P0 | mixed | SCR-MS-06 · +non-UI: height drives shadow/bridging maths; bridging flagged for engineer… | T-MS-103 |
| M05-36 | P0 | engine | engine | T-MS-114 |
| M05-37 | P0 | screen | SCR-MS-07 | T-MS-201 |
| M05-38 | P0 | screen | SCR-MS-07 | T-MS-201 |
| M05-39 | P0 | mixed | SCR-MS-07 · +non-UI: auto computes maximum fit after setbacks and obstructions | T-MS-201 |
| M05-40 | P0 | mixed | SCR-MS-07 · +non-UI: recommendation and live DC/AC ratio computation with census… | T-MS-201 |
| M05-41 | P0 | mixed | SCR-MS-07 · +non-UI: apply is one atomic undoable action; basis honesty stated before… | T-MS-201 |
| M05-42 | P0 | engine | engine | T-MS-203 |
| M05-43 | P0 | mixed | SCR-MS-07 · +non-UI: sent proposals keep rate version; archived items never break… | T-MS-201 |
| M05-44 | P0 | screen | SCR-MS-08 | T-MS-205 |
| M05-45 | P0 | screen | SCR-MS-08 | T-MS-205 |
| M05-46 | P0 | screen | SCR-MS-08 | T-MS-205 |
| M05-47 | P0 | mixed | SCR-MS-08 · +non-UI: parametric member/steel model computation; disclaimer law, never a… | T-MS-205 |
| M05-48 | P0 | mixed | SCR-MS-08 · +non-UI: auto-string algorithm; unstrung-over-illegal rule; empty voltage… | T-MS-205 |
| M05-49 | P0 | mixed | SCR-MS-08 · +non-UI: invalid electrical blocks next step; hard gate expressly preserved | T-MS-205 |
| M05-50 | P0 | mixed | SCR-MS-08 · +non-UI: no subscription/plan-capacity limit in layout; kW ceiling only at… | T-MS-205 |
| M05-51 | P0 | screen | SCR-MS-09 | T-MS-206 |
| M05-52 | P0 | mixed | SCR-MS-09 · +non-UI: kWh/m² carries source marker; access numbers deliberately unmarked… | T-MS-206 |
| M05-53 | P0 | screen | SCR-MS-09 | T-MS-206 |
| M05-54 | P0 | mixed | SCR-MS-09 · +non-UI: provenance-line labeling law; engineer-validation caveat travels with  | T-MS-206 |
| M05-55 | P0 | mixed | SCR-F5-05 · +non-UI: no separate customer 3D URL, ships inside proposal link; data-ramp… | T-F5-005 |
| M05-56 | P2 | engine | engine | LAW |
| M05-57 | P0 | screen | SCR-MS-10 | T-MS-260 |
| M05-58 | P0 | screen | SCR-MS-10 | T-MS-260 |
| M05-59 | P0 | screen | SCR-MS-10 | T-MS-260 |
| M05-60 | P0 | policy | policy | LAW |
| M05-61 | P0 | mixed | SCR-MS-10 · +non-UI: hand-off contract to M06; mandatory checks run at M06 Generate | T-MS-260 |
| M05-62 | P0 | screen | SCR-MS-11 | T-MS-268 |
| M05-63 | P0 | screen | SCR-MS-11 | T-MS-268 |
| M05-64 | P0 | mixed | SCR-MS-11 · +non-UI: longest-string cold-weather voltage versus inverter max computation | T-MS-268 |
| M05-65 | P0 | screen | SCR-MS-11 | T-MS-268 |
| M05-66 | P0 | mixed | SCR-MS-11 · +non-UI: human two-state record only; app never computes structural adequacy | T-MS-268 |
| M05-67 | P0 | mixed | SCR-MS-11 · +non-UI: exports online-only, fail fast, never queued | T-MS-268 |
| M05-68 | P0 | screen | SCR-MS-12 | T-MS-301 |
| M05-69 | P0 | mixed | SCR-MS-12 · +non-UI: no discount-approval flow; below-cost warns; payable≤0 blocks at M06… | T-MS-301 |
| M05-70 | P0 | engine | engine | T-MS-304 |
| M05-71 | P0 | screen | SCR-MS-12 | T-MS-301 |
| M05-72 | P0 | mixed | SCR-MS-12 · +non-UI: override takes measured provenance; stale-field tracking; versioned… | T-MS-301 |
| M05-73 | P0 | screen | SCR-MS-12 | T-MS-301 |
| M05-74 | P0 | mixed | SCR-MS-12 · +non-UI: read+export always work regardless of billing state; checklist… | T-MS-301 |
| M05-75 | P0 | screen | SCR-MS-13 | T-MS-310 |
| M05-76 | P0 | screen | SCR-MS-17 | T-MS-318 |
| M05-77 | P0 | policy | policy | LAW |
| M05-78 | P0 | screen | SCR-MS-01 | T-MS-363 |
| M05-79 | P0 | screen | SCR-MS-14 | T-MS-376 |
| M05-80 | P0 | policy | policy | LAW |
| M05-81 | P0 | policy | policy | LAW |
| M05-82 | P0 | policy | policy | LAW |
| M05-83 | P0 | screen | SCR-MS-15 | T-MS-312 |
| M05-84 | P0 | screen | SCR-MS-16 | T-MS-313 |
| M05-85 | P0 | mixed | SCR-MS-16 · +non-UI: append-only sign-off pinned to version+fingerprint; edit drops… | T-MS-313 |
| M05-86 | P0 | mixed | SCR-MS-16 · +non-UI: ≥1 pinned comment required; customer never sees returned design | T-MS-313 |
| M05-87 | P0 | policy | policy | LAW |
| M05-88 | P0 | policy | policy | LAW |
| M05-89 | P0 | mixed | SCR-MS-08 · +non-UI: no census tool lost; per-panel remove-map inside tables, scoped not… | T-MS-116 |
| M05-90 | P0 | engine | engine | T-MS-116 |
| M05-91 | P1 | mixed | SCR-MS-08 · +non-UI: GPU/CPU shading equivalence ±2% pin; server-side simulation with… | T-MS-118 |
| M05-92 | P2 | mixed | SCR-MS-08, SCR-MS-09 · +non-UI: tracker backtracking solver; GLO-30/SRTM DEM import; flat default… | T-MS-119 |
| M05-93 | P1 | mixed | SCR-MS-11 · +non-UI: inverter-block tier extends combiners; MV a labelled assumption… | T-MS-120 |
| M05-94 | P0 | policy | policy | LAW |
| M05-95 | P1 | policy | policy | LAW |

### docs/prd/modules/M05-studio/01-step1-site-setup.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| MS1-01 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-02 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-03 | P0 | mixed | SCR-MS-04 · +non-UI: region/utility/tariff content is F1 pack data; tariff precedence… | T-MS-101 |
| MS1-04 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-05 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-06 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-07 | P1 | policy | policy | LAW |
| MS1-08 | P1 | screen | SCR-MS-04 | T-MS-101 |
| MS1-09 | P0 | mixed | SCR-MS-04 · +non-UI: Q28 law: only capacity limit is plan design-kW ceiling at… | T-MS-101 |
| MS1-10 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-11 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-12 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-13 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-14 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-15 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-16 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-17 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-18 | P0 | mixed | SCR-MS-04 · +non-UI: stores address/latLng/confirmed plus built-in irradiance with ±10%… | T-MS-101 |
| MS1-19 | P0 | policy | policy | LAW |
| MS1-20 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-21 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-22 | P0 | mixed | SCR-MS-04 · +non-UI: decoupled post-confirm fetches; pin-move discard guard; writes never… | T-MS-101 |
| MS1-23 | P0 | screen | SCR-MS-04 | T-MS-101 |
| MS1-24 | P0 | integration | integration | T-MS-106 |
| MS1-25 | P0 | engine | engine | T-MS-105 |
| MS1-26 | P0 | engine | engine | T-MS-105 |
| MS1-27 | P0 | engine | engine | T-MS-105 |
| MS1-28 | P0 | engine | engine | T-MS-104 |
| MS1-29 | P0 | mixed | SCR-MS-05 · +non-UI: gesture contract: cursor-anchored wheel, clamps, ≥3 px drag… | T-MS-102 |
| MS1-30 | P0 | mixed | SCR-MS-05 · +non-UI: scale bar computed from same px/m as hit-testing — can never disagree  | T-MS-102 |
| MS1-31 | P0 | engine | engine | T-MS-104 |

### docs/prd/modules/M05-studio/02-step2-roof.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| MS2-01 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-02 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-03 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-04 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-05 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-06 | P0 | mixed | SCR-MS-05 · +non-UI: snap resolution engine: angle capture ±7.5°, object snap priority… | T-MS-102 |
| MS2-07 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-08 | P0 | mixed | SCR-MS-05 · +non-UI: one canonical polygon validator shared verbatim with AI importer… | T-MS-102 |
| MS2-09 | P0 | mixed | SCR-MS-05 · +non-UI: single roof factory shared by hand-drawn/duplicated/AI paths… | T-MS-102 |
| MS2-10 | P1 | screen | SCR-MS-05 | T-MS-102 |
| MS2-11 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-12 | P0 | mixed | SCR-MS-05 · +non-UI: locks persist with the project; all edit paths refuse on locked roofs | T-MS-102 |
| MS2-13 | P0 | engine | engine | T-MS-107 |
| MS2-14 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-15 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-16 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-17 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-18 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-19 | P0 | mixed | SCR-MS-05 · +non-UI: copy is fully independent — never inherits face-group linkage | T-MS-102 |
| MS2-20 | P0 | engine | engine | T-MS-107 |
| MS2-21 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-22 | P0 | engine | engine | T-MS-108 |
| MS2-23 | P0 | mixed | SCR-MS-05 · +non-UI: centroid-line split perpendicular to ridge, pitch clamp 1–60°, area… | T-MS-102 |
| MS2-24 | P0 | engine | engine | T-MS-108 |
| MS2-25 | P0 | engine | engine | T-MS-108 |
| MS2-26 | P0 | engine | engine | T-MS-108 |
| MS2-27 | P0 | mixed | SCR-MS-05 · +non-UI: face-group propagation keeps ridge level: pitch/eave shared, azimuth… | T-MS-102 |
| MS2-28 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-29 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-30 | P0 | engine | engine | T-MS-109 |
| MS2-31 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-32 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-33 | P0 | engine | engine | T-MS-109 |
| MS2-34 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-35 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-36 | P0 | mixed | SCR-MS-05 · +non-UI: dependent detection on every geometry change; typed changes blocked… | T-MS-102 |
| MS2-37 | P0 | mixed | SCR-MS-05 · +non-UI: strictly sequential detection ladder; cross-check floors disagreeing… | T-MS-102 |
| MS2-38 | P0 | mixed | SCR-MS-05 · +non-UI: photo entry gated on live platform capability; per-detection metering  | T-MS-102 |
| MS2-39 | P0 | screen | SCR-MS-05 | T-MS-102 |
| MS2-40 | P0 | engine | engine | T-MS-110 |
| MS2-41 | P0 | engine | engine | T-MS-110 |
| MS2-42 | P0 | engine | engine | T-MS-111 |
| MS2-43 | P0 | engine | engine | T-MS-110 |
| MS2-44 | P0 | integration | integration | T-MS-112 |

### docs/prd/modules/M05-studio/03-step3-obstructions.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| MS3-01 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-02 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-03 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-04 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-05 | P0 | mixed | SCR-MS-06 · +non-UI: one gesture = one undo step law on recorded history | T-MS-103 |
| MS3-06 | P0 | policy | policy | LAW |
| MS3-07 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-08 | P1 | screen | SCR-MS-06 | T-MS-103 |
| MS3-09 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-10 | P1 | screen | SCR-MS-06 | T-MS-103 |
| MS3-11 | P0 | screen | SCR-MS-06, SCR-MS-09 | T-MS-103 |
| MS3-12 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-13 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-14 | P0 | engine | engine | T-MS-113 |
| MS3-15 | P0 | policy | policy | T-MS-113 |
| MS3-16 | P1 | screen | SCR-MS-06 | T-MS-103 |
| MS3-17 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-18 | P0 | mixed | SCR-MS-06 · +non-UI: owning roof re-resolves live; bridged panels reconcile in same patch | T-MS-103 |
| MS3-19 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-20 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-21 | P0 | mixed | SCR-MS-06 · +non-UI: every nudge = one undo entry plus roof re-resolve | T-MS-103 |
| MS3-22 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-23 | P1 | screen | SCR-MS-06 | T-MS-103 |
| MS3-24 | P0 | mixed | SCR-MS-06 · +non-UI: locks persist with the project across reloads | T-MS-103 |
| MS3-25 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-26 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-27 | P0 | mixed | SCR-MS-06 · +non-UI: step-wide law: any slider drag = exactly one undo entry | T-MS-103 |
| MS3-28 | P0 | mixed | SCR-MS-06 · +non-UI: writes the field the shading engine reads; effective-state display | T-MS-103 |
| MS3-29 | P0 | mixed | SCR-MS-06 · +non-UI: flag drives layout keep-out consumed by MS6 | T-MS-103 |
| MS3-30 | P0 | screen | SCR-MS-06 | T-MS-103 |
| MS3-31 | P0 | engine | engine | T-MS-114 |
| MS3-32 | P0 | mixed | SCR-MS-06 · +non-UI: conversion builds stacked roof at base+height, circles to 12-gon | T-MS-103 |
| MS3-33 | P0 | mixed | SCR-MS-06 · +non-UI: grounded on same surface number the 3D uses | T-MS-103 |
| MS3-34 | P0 | engine | engine | T-MS-114 |
| MS3-35 | P1 | policy | policy | LAW |
| MS3-36 | P0 | engine | engine | T-MS-115 |
| MS3-37 | P0 | policy | policy | T-MS-115 |
| MS3-38 | P0 | mixed | SCR-MS-09 · +non-UI: lazy per-type asset streaming; 404 never crashes scene | T-MS-115 |
| MS3-39 | P1 | engine | engine | T-MS-115 |
| MS3-40 | P1 | screen | SCR-MS-09 | T-MS-206 |

### docs/prd/modules/M05-studio/04-step4-components.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| MS4-01 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-02 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-03 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-04 | P0 | policy | policy | LAW |
| MS4-05 | P0 | policy | policy | T-MS-202 |
| MS4-06 | P0 | mixed | SCR-MS-07 · +non-UI: PDF datasheet extraction with review-before-commit; Excel import | T-MS-201 |
| MS4-07 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-08 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-09 | P0 | mixed | SCR-MS-07 · +non-UI: certification schemes are pack-driven market data, never hard-coded | T-MS-201 |
| MS4-10 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-11 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-12 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-13 | P0 | policy | policy | T-MS-202 |
| MS4-14 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-15 | P0 | mixed | SCR-MS-07 · +non-UI: max-capacity estimation from drawn roofs | T-MS-201 |
| MS4-16 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-17 | P1 | screen | SCR-MS-07 | T-MS-201 |
| MS4-18 | P0 | mixed | SCR-MS-07 · +non-UI: candidate scan, DC/AC band 0.90-1.35, closest-to-1.15 pick, price… | T-MS-201 |
| MS4-19 | P0 | mixed | SCR-MS-07 · +non-UI: reuses compare sheet's nearest-fit computation | T-MS-201 |
| MS4-20 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-21 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-22 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-23 | P0 | policy | policy | T-MS-202 |
| MS4-24 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-25 | P0 | policy | policy | T-MS-204 |
| MS4-26 | P2 | context | context → informative | realized-by: Recommended Enhancement, explicitly not v2 scope — the enhancements register and the design spec §10 carry it, and §5 non-goals of `docs/prd/modules/M05-studio/04-step4-components.md` records the exclusion ("battery economics modelling (MS4-26, REC)"). No v2 task builds it. |
| MS4-27 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-28 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-29 | P0 | mixed | SCR-MS-07 · +non-UI: certification-first shortlist ranked by cost-per-watt, capped | T-MS-201 |
| MS4-30 | P0 | mixed | SCR-MS-07 · +non-UI: per-candidate pricing, sizing, simulation, payback, ROI computations | T-MS-201 |
| MS4-31 | P0 | screen | SCR-MS-07 | T-MS-201 |
| MS4-32 | P0 | mixed | SCR-MS-07 · +non-UI: recommendation rule: feasible AND within clipping limit | T-MS-201 |
| MS4-33 | P0 | mixed | SCR-MS-07 · +non-UI: Apply writes panel+inverter+count as one atomic undo step | T-MS-201 |
| MS4-34 | P0 | engine | engine | T-MS-203 |

### docs/prd/modules/M05-studio/05-step6-editor.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| MS6-01 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-02 | P0 | mixed | SCR-MS-08 · +non-UI: atomic one-undo replace, string clearing, decision-log storage | T-MS-205 |
| MS6-03 | P0 | engine | engine | T-MS-207 |
| MS6-04 | P0 | engine | engine | T-MS-207 |
| MS6-05 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-06 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-07 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-08 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-09 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-10 | P0 | mixed | SCR-MS-08 · +non-UI: same irradiance engine as 3D, fingerprint-cached, cancellable | T-MS-205 |
| MS6-11 | P1 | screen | SCR-MS-08 | T-MS-205 |
| MS6-12 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-13 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-14 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-15 | P0 | policy | policy | T-MS-208 |
| MS6-16 | P0 | mixed | SCR-MS-08 · +non-UI: tilt partitions selection so each table tilts as unit | T-MS-205 |
| MS6-17 | P0 | mixed | SCR-MS-08 · +non-UI: delete cascades segments/strings/routes with reindexing; lock… | T-MS-205 |
| MS6-18 | P0 | mixed | SCR-MS-08 · +non-UI: one gesture = exactly one undo entry | T-MS-205 |
| MS6-19 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-20 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-21 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-22 | P0 | mixed | SCR-MS-08 · +non-UI: disclaimer travels to member card, BOM/CSV, SLD, drawing, proposal | T-MS-205 |
| MS6-23 | P1 | screen | SCR-MS-08 | T-MS-205 |
| MS6-24 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-25 | P0 | policy | policy | T-MS-208 |
| MS6-26 | P1 | screen | SCR-MS-08 | T-MS-205 |
| MS6-27 | P0 | screen | SCR-MS-08 | T-MS-205 |
| MS6-28 | P0 | mixed | SCR-MS-08 · +non-UI: the studio's single hard gate rule (R12 asymmetry) | T-MS-205 |
| MS6-29 | P0 | mixed | SCR-MS-08 · +non-UI: no studio-side capacity cap; entitlements checked at Save/Generate | T-MS-205 |
| MS6-30 | P0 | screen | SCR-MS-09 | T-MS-206 |
| MS6-31 | P0 | mixed | SCR-MS-09 · +non-UI: one simulation-time basis (site mean-solar), NOAA-style sun position | T-MS-206 |
| MS6-32 | P0 | mixed | SCR-MS-09 · +non-UI: shadow-caster set law: real elements cast, decor deterministic… | T-MS-206 |
| MS6-33 | P0 | mixed | SCR-MS-09 · +non-UI: access values only from headless engine over one geometry source | T-MS-206 |
| MS6-34 | P0 | screen | SCR-MS-09 | T-MS-206 |
| MS6-35 | P0 | mixed | SCR-MS-09 · +non-UI: inspection view state never persists or fingerprints; strict… | T-MS-206 |
| MS6-36 | P0 | mixed | SCR-MS-09 · +non-UI: adaptive grid resolution, geometric-access metric, 2D-canvas parity | T-MS-206 |
| MS6-37 | P0 | screen | SCR-MS-09, SCR-F5-05 | T-MS-206 |
| MS6-38 | P1 | engine | engine | T-MS-211 |
| MS6-39 | P0 | policy | policy | T-MS-209 |
| MS6-40 | P0 | engine | engine | T-MS-209 |
| MS6-41 | P0 | policy | policy | T-MS-210 |
| MS6-42 | P0 | engine | engine | T-MS-210 |
| MS6-43 | P0 | engine | engine | T-MS-210 |
| MS6-44 | P0 | mixed | SCR-MS-09 · +non-UI: default-clearing discipline: reverted control leaves no residue | T-MS-206 |
| MS6-45 | P1 | mixed | SCR-MS-09 · +non-UI: world-space validation against inset polygon; malformed plans dropped  | T-MS-206 |
| MS6-46 | P0 | mixed | SCR-MS-09 · +non-UI: dual-tilt builds fixed-tilt topology; monorail assumptions named | T-MS-206 |
| MS6-47 | P0 | mixed | SCR-MS-09 · +non-UI: options offered ⊆ allowed; too-tall flagged, never silently clamped | T-MS-206 |
| MS6-48 | P0 | mixed | SCR-MS-09 · +non-UI: every click one undo step via single pure choice-applier | T-MS-206 |
| MS6-49 | P0 | mixed | SCR-MS-09 · +non-UI: real extruded sections, joint assemblies, buffers disposed on unmount | T-MS-206 |
| MS6-50 | P0 | policy | policy | T-MS-212 |
| MS6-51 | P0 | mixed | SCR-MS-08 · +non-UI: 2D/3D parity and same allowed-options rule (S5-1b) | T-MS-205 |
| MS6-52 | P0 | mixed | SCR-MS-08 · +non-UI: scorer keyed to design+shading+insight state; stale score impossible | T-MS-205 |
| MS6-53 | P0 | engine | engine | T-MS-207 |

### docs/prd/modules/M05-studio/06-step7-proposal.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| MS7-01 | P0 | screen | SCR-MS-10 | T-MS-260 |
| MS7-02 | P0 | screen | SCR-MS-10 | T-MS-260 |
| MS7-03 | P0 | mixed | SCR-MS-10 · +non-UI: saved capture records actual sun position at capture moment | T-MS-260 |
| MS7-04 | P0 | screen | SCR-MS-10 | T-MS-260 |
| MS7-05 | P0 | policy | policy | T-MS-261 |
| MS7-06 | P0 | screen | SCR-MS-10 | T-MS-260 |
| MS7-07 | P1 | mixed | SCR-MS-10 · +non-UI: image bytes stored out-of-project; project holds references only | T-MS-260 |
| MS7-08 | P0 | mixed | SCR-MS-10 · +non-UI: staleness = capture layout no longer matches current layout | T-MS-260 |
| MS7-09 | P0 | policy | policy | T-MS-261 |
| MS7-10 | P0 | screen | SCR-MS-10 | T-MS-260 |
| MS7-11 | P0 | screen | SCR-MS-10 | T-MS-260 |
| MS7-12 | P0 | policy | policy | T-MS-265 |
| MS7-13 | P0 | screen | SCR-MS-10 | T-MS-260 |
| MS7-14 | P0 | screen | SCR-MS-10 | T-MS-260 |
| MS7-15 | P0 | engine | engine | T-MS-262 |
| MS7-16 | P0 | engine | engine | T-MS-262 |
| MS7-17 | P0 | engine | engine | T-MS-262 |
| MS7-18 | P0 | engine | engine | T-MS-262 |
| MS7-19 | P0 | policy | policy | T-MS-262 |
| MS7-20 | P0 | mixed | SCR-MS-10 · +non-UI: clipping modelled from inverter AC limit times count | T-MS-260 |
| MS7-21 | P0 | policy | policy | LAW |
| MS7-22 | P0 | mixed | SCR-MS-10 · +non-UI: beam-only transposition by numeric integration, cached by… | T-MS-260 |
| MS7-23 | P1 | engine | engine | T-MS-262 |
| MS7-24 | P1 | policy | policy | LAW |
| MS7-24b | P0 | engine | engine | T-MS-262 |
| MS7-25 | P0 | integration | integration | T-MS-263 |
| MS7-26 | P0 | integration | integration | T-MS-263 |
| MS7-27 | P1 | policy | policy | T-MS-263 |
| MS7-28 | P0 | policy | policy | T-MS-264 |
| MS7-29 | P0 | engine | engine | T-MS-264 |
| MS7-30 | P0 | engine | engine | T-MS-264 |
| MS7-31 | P0 | mixed | SCR-MS-10 · +non-UI: model never assumes implicit 100% retail offset | T-MS-260 |
| MS7-32 | P0 | engine | engine | T-MS-264 |
| MS7-33 | P0 | policy | policy | T-MS-264 |
| MS7-34 | P0 | mixed | SCR-MS-10 · +non-UI: one cost basis; lease amortises same net basis; PPA reconciliation | T-MS-260 |
| MS7-35 | P0 | engine | engine | T-MS-265 |
| MS7-36 | P0 | engine | engine | T-MS-265 |
| MS7-37 | P0 | engine | engine | T-MS-265 |
| MS7-38 | P0 | engine | engine | T-MS-265 |
| MS7-39 | P1 | engine | engine | T-MS-265 |
| MS7-40 | P0 | mixed | SCR-MS-10 · +non-UI: report sheet is pure recompute, never cached | T-MS-260 |
| MS7-41 | P0 | screen | SCR-MS-10 | T-MS-260 |
| MS7-42 | P0 | screen | SCR-MS-10 | T-MS-260 |
| MS7-43 | P0 | engine | engine | T-MS-266 |
| MS7-44 | P0 | policy | policy | T-MS-266 |
| MS7-45 | P0 | policy | policy | T-MS-266 |
| MS7-46 | P0 | policy | policy | T-MS-266 |
| MS7-47 | P0 | mixed | SCR-MS-10 · +non-UI: candidates run same pure pipelines as the design | T-MS-260 |
| MS7-48 | P0 | engine | engine | T-MS-267 |
| MS7-49 | P0 | screen | SCR-MS-10 | T-MS-260 |
| MS7-50 | P0 | engine | engine | T-MS-267 |
| MS7-51 | P0 | mixed | SCR-MS-10 · +non-UI: memoization keyed on design fingerprint | T-MS-260 |

### docs/prd/modules/M05-studio/07-step8-sld.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| MS8-01 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-02 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-03 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-04 | P0 | mixed | SCR-MS-11 · +non-UI: chip is read-out of MS11.3 sign-off record, never local toggle | T-MS-268 |
| MS8-05 | P1 | screen | SCR-MS-11 | T-MS-268 |
| MS8-06 | P0 | mixed | SCR-MS-11 · +non-UI: SVG/PNG/DXF/print renderers reproduce sheet exactly as displayed | T-MS-268 |
| MS8-07 | P0 | mixed | SCR-MS-11 · +non-UI: auto-string runs real planner, surfaces refusals, single undo commit | T-MS-268 |
| MS8-08 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-09 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-10 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-11 | P0 | mixed | SCR-MS-11 · +non-UI: computed from coldest-condition string voltage | T-MS-268 |
| MS8-12 | P0 | mixed | SCR-MS-11 · +non-UI: ratings come from same sizing engine the BOM quotes | T-MS-268 |
| MS8-13 | P0 | mixed | SCR-MS-11 · +non-UI: earth-pit count derived from same rules as BOM | T-MS-268 |
| MS8-14 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-15 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-16 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-17 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-18 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-19 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-20 | P0 | engine | engine | T-MS-269 |
| MS8-21 | P0 | screen | SCR-MS-11 | T-MS-268 |
| MS8-22 | P0 | policy | policy | T-MS-269 |
| MS8-23 | P0 | mixed | SCR-MS-11 · +non-UI: design temperatures resolve from pack latitude band | T-MS-268 |
| MS8-24 | P0 | engine | engine | T-MS-270 |
| MS8-25 | P0 | engine | engine | T-MS-270 |
| MS8-26 | P0 | engine | engine | T-MS-271 |
| MS8-27 | P0 | engine | engine | T-MS-271 |
| MS8-28 | P0 | engine | engine | T-MS-272 |
| MS8-29 | P0 | engine | engine | T-MS-272 |
| MS8-30 | P0 | engine | engine | T-MS-272 |
| MS8-31 | P0 | engine | engine | T-MS-272 |
| MS8-32 | P0 | policy | policy | T-MS-272 |
| MS8-33 | P0 | policy | policy | T-MS-272 |
| MS8-34 | P0 | engine | engine | T-MS-273 |
| MS8-35 | P0 | engine | engine | T-MS-273 |
| MS8-36 | P0 | engine | engine | T-MS-274 |
| MS8-37 | P0 | engine | engine | T-MS-274 |
| MS8-38 | P0 | engine | engine | T-MS-274 |
| MS8-39 | P0 | engine | engine | T-MS-274 |
| MS8-40 | P1 | engine | engine | T-MS-275 |

### docs/prd/modules/M05-studio/08-customer-surfaces.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| MS9-01 | P0 | screen | SCR-M06-17 | T-F5-012 |
| MS9-02 | P0 | screen | SCR-M06-17 | T-F5-012 |
| MS9-03 | P0 | screen | SCR-M06-17 | T-F5-012 |
| MS9-04 | P0 | mixed | SCR-M06-17 · +non-UI: internal view is never the default for a customer artefact | T-F5-012 |
| MS9-05 | P0 | screen | SCR-M06-17 | T-F5-012 |
| MS9-06 | P0 | mixed | SCR-M06-17 · +non-UI: issuance blocked unless readiness review passes (electrical gate… | T-F5-013 |
| MS9-07 | P0 | policy | policy | T-F5-013 |
| MS9-08 | P0 | policy | policy | T-F5-013 |
| MS9-09 | P0 | policy | policy | T-F5-011 |
| MS9-10 | P0 | screen | SCR-F5-01 | T-F5-001 |
| MS9-11 | P0 | screen | SCR-F5-01 | T-F5-001 |
| MS9-12 | P0 | policy | policy | T-F5-011 |
| MS9-13 | P0 | policy | policy | T-F5-011 |
| MS9-14 | P0 | screen | SCR-F5-01, SCR-M06-17 | T-F5-001 |
| MS9-15 | P0 | screen | SCR-F5-01 | T-F5-001 |
| MS9-16 | P0 | screen | SCR-M06-17 | T-F5-012 |
| MS9-17 | P0 | screen | SCR-M06-17, SCR-F5-01 | T-F5-001 |
| MS9-18 | P0 | screen | SCR-M06-17 | T-F5-012 |
| MS9-19 | P0 | screen | SCR-M06-17 | T-F5-012 |
| MS9-20 | P0 | screen | SCR-M06-17 | T-F5-012 |
| MS9-21 | P0 | policy | policy | T-F5-012 |
| MS9-22 | P1 | screen | SCR-M06-17 | T-F5-012 |
| MS9-23 | P0 | screen | SCR-M06-17, SCR-F5-01 | T-F5-001 |
| MS9-24 | P0 | screen | SCR-M06-17, SCR-F5-01 | T-F5-001 |
| MS9-25 | P1 | screen | SCR-F5-01, SCR-M06-17 | T-F5-001 |
| MS9-26 | P0 | policy | policy | T-F5-011 |
| MS9-27 | P0 | policy | policy | T-F5-011 |
| MS9-28 | P0 | policy | policy | T-F5-012 |
| MS9-29 | P0 | mixed | SCR-F5-01, SCR-M06-17 · +non-UI: stage/progress, document pack and permanence surfaces are consumed… | T-F5-001 |
| ~~MS9-30~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`) — swept for its wording, not its content. "Link issuance is an ONLINE operation, never a silent local-only mint" is a security and attribution law, not a connectivity one, and it is live at `F5-80`, with mint attribution at `F5-31`/`F5-79`. The source it closed, `CODE.share.104`, is still closed — now under `F5-80`. `docs/tasks/F5-customer-link.md` records the same removal; `T-F5-011` is alive.* | — |

### docs/prd/modules/M05-studio/09-step9-bom.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| MS10-01 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-02 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-03 | P0 | mixed | SCR-MS-12 · +non-UI: zero stores nothing; kind kept; re-commit on kind switch; re-sync on… | T-MS-301 |
| MS10-04 | P0 | policy | policy | T-MS-309 |
| MS10-05 | P0 | policy | policy | T-MS-305 |
| MS10-06 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-07 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-08 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-09 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-10 | P0 | mixed | SCR-MS-12 · +non-UI: checklist content is market-pack data, not code | T-MS-301 |
| MS10-11 | P0 | mixed | SCR-MS-12 · +non-UI: flat discount applied once, allocated proportionally, never… | T-MS-301 |
| MS10-12 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-13 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-14 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-15 | P1 | policy | policy | T-MS-308 |
| MS10-16 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-17 | P0 | mixed | SCR-MS-12 · +non-UI: edited fields retain the engine's value so staleness stays exact | T-MS-301 |
| MS10-18 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-19 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-20 | P0 | screen | SCR-MS-12 | T-MS-301 |
| MS10-21 | P0 | engine | engine | T-MS-302 |
| MS10-22 | P0 | engine | engine | T-MS-304 |
| MS10-23 | P0 | engine | engine | T-MS-302 |
| MS10-24 | P1 | engine | engine | T-MS-302 |
| MS10-25 | P0 | engine | engine | T-MS-303 |
| MS10-26 | P0 | engine | engine | T-MS-303 |
| MS10-27 | P0 | engine | engine | T-MS-302 |
| MS10-28 | P0 | engine | engine | T-MS-302 |
| MS10-29 | P0 | engine | engine | T-MS-304 |
| MS10-30 | P0 | engine | engine | T-MS-304 |
| MS10-31 | P0 | engine | engine | T-MS-304 |
| MS10-32 | P0 | policy | policy | T-MS-306 |
| MS10-33 | P0 | engine | engine | T-MS-305 |
| MS10-34 | P0 | engine | engine | T-MS-305 |
| MS10-35 | P0 | mixed | SCR-MS-12 · +non-UI: BOM edit re-keys design fingerprint without disturbing field order | T-MS-301 |
| MS10-36 | P0 | engine | engine | T-MS-307 |
| MS10-37 | P0 | engine | engine | T-MS-307 |
| MS10-38 | P0 | engine | engine | T-MS-308 |
| MS10-39 | P0 | policy | policy | T-MS-306 |
| MS10-40 | P0 | policy | policy | T-MS-309 |

### docs/prd/modules/M05-studio/10-done-and-installation.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| MS11-01 | P0 | mixed | SCR-MS-13 · +non-UI: reachable only when every earlier gate passes; stamps completion | T-MS-310 |
| MS11-02 | P0 | policy | policy | T-MS-311 |
| MS11-03 | P0 | screen | SCR-MS-13 | T-MS-310 |
| MS11-04 | P0 | screen | SCR-MS-13 | T-MS-310 |
| MS11-05 | P0 | screen | SCR-MS-13 | T-MS-310 |
| MS11-06 | P1 | screen | SCR-MS-13 | T-MS-310 |
| MS11-07 | P0 | mixed | SCR-MS-13 · +non-UI: derives from real gates, never re-implements them; worst-of verdict… | T-MS-310 |
| MS11-08 | P0 | mixed | SCR-MS-13 · +non-UI: electrical is the sole blocking item; vacuous-ready (no components)… | T-MS-310 |
| MS11-09 | P0 | mixed | SCR-MS-13 · +non-UI: counts only insights neither accepted nor dismissed; severity-driven… | T-MS-310 |
| MS11-10 | P0 | engine | engine | T-MS-311 |
| MS11-11 | P0 | mixed | SCR-MS-13 · +non-UI: never blocks; shortfall ordered before staleness; includes cover… | T-MS-310 |
| MS11-12 | P0 | policy | policy | LAW |
| MS11-13 | P0 | screen | SCR-MS-15 | T-MS-312 |
| MS11-14 | P0 | mixed | SCR-MS-16 · +non-UI: records who/when/design-version on approve; notifies designer on… | T-MS-313 |
| MS11-15 | P0 | policy | policy | T-MS-314 |
| MS11-16 | P0 | policy | policy | T-MS-314 |
| MS11-17 | P0 | mixed | SCR-MS-17 · +non-UI: unapproved designs never reach customer surfaces | T-MS-314 |
| MS11-18 | P0 | engine | engine | T-MS-315 |
| MS11-19 | P0 | engine | engine | T-MS-315 |
| MS11-20 | P0 | policy | policy | LAW |
| MS11-21 | P0 | engine | engine | T-MS-315 |
| MS11-22 | P0 | engine | engine | T-MS-315 |
| MS11-23 | P0 | engine | engine | T-MS-316 |
| MS11-24 | P0 | engine | engine | T-MS-316 |
| MS11-25 | P0 | engine | engine | T-MS-317 |
| MS11-26 | P0 | policy | policy | T-MS-317 |
| MS11-27 | P1 | policy | policy | T-MS-317 |
| MS11-28 | P0 | mixed | SCR-MS-17 · +non-UI: derived never authored; deterministic step ids; walked per roof/table | T-MS-318 |
| MS11-29 | P0 | mixed | SCR-MS-17 · +non-UI: counts from structural model; disabled panels excluded from wiring | T-MS-318 |
| MS11-30 | P0 | screen | SCR-MS-17 | T-MS-318 |
| MS11-31 | P0 | mixed | SCR-MS-17 · +non-UI: BOM resolution: no-source-id lines included, not-supplied excluded… | T-MS-318 |
| MS11-32 | P0 | policy | policy | T-MS-318 |
| MS11-33 | P0 | screen | SCR-MS-17 | T-MS-318 |
| MS11-34 | P0 | screen | SCR-MS-17 | T-MS-318 |
| MS11-35 | P0 | mixed | SCR-MS-17 · +non-UI: ticks persist per project server-side with R16 attribution | T-MS-318 |
| MS11-36 | P0 | screen | SCR-MS-17 | T-MS-318 |
| MS11-37 | P0 | screen | SCR-MS-17 | T-MS-318 |
| MS11-38 | P0 | policy | policy | LAW |

### docs/prd/modules/M05-studio/11-shell-and-platform.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| MS12-01 | P0 | mixed | SCR-MS-03 · +non-UI: internal step ids stay stable; no reachable dead step URL | T-MS-360 |
| MS12-02 | P0 | policy | policy | T-MS-361 |
| MS12-03 | P0 | mixed | SCR-MS-03 · +non-UI: gate evaluation in defined order, ending with electrical hard gate | T-MS-360 |
| MS12-04 | P0 | screen | SCR-MS-03 | T-MS-360 |
| MS12-05 | P0 | screen | SCR-MS-03 | T-MS-360 |
| MS12-06 | P0 | mixed | SCR-MS-03 · +non-UI: reads stamped snapshot; bands and weights from rules pack | T-MS-360 |
| MS12-07 | P0 | screen | SCR-MS-03 | T-MS-360 |
| MS12-08 | P0 | screen | SCR-MS-03 | T-MS-360 |
| MS12-09 | P0 | screen | SCR-MS-03 | T-MS-360 |
| MS12-10 | P0 | mixed | SCR-MS-01 · +non-UI: lead-scoped, tenant-owned, server-backed across devices | T-MS-365 |
| MS12-11 | P0 | screen | SCR-MS-01 | T-MS-363 |
| MS12-12 | P0 | screen | SCR-MS-01 | T-MS-363 |
| MS12-13 | P0 | policy | policy | T-MS-361 |
| MS12-14 | P0 | screen | SCR-MS-01 | T-MS-363 |
| MS12-15 | P0 | screen | SCR-MS-01 | T-MS-363 |
| MS12-16 | P0 | policy | policy | T-MS-372 |
| MS12-17 | P0 | mixed | SCR-M01-01 · +non-UI: establishes tenant, user and role context; replaces mock login | T-MS-364 |
| MS12-18 | P0 | policy | policy | T-MS-364 |
| MS12-19 | P0 | mixed | SCR-SHELL-01 · +non-UI: sign-out clears session state without destroying work | T-MS-364, T-SHELL-001 |
| MS12-20 | P0 | engine | engine | T-MS-365 |
| MS12-21 | P0 | engine | engine | T-MS-366 |
| MS12-22 | P0 | mixed | SCR-MS-03 · +non-UI: conflict detection supersedes last-writer-wins | T-MS-367 |
| MS12-23 | P0 | engine | engine | T-MS-368 |
| MS12-24 | P0 | screen | SCR-MS-03 | T-MS-360 |
| MS12-25 | P0 | policy | policy | T-MS-370 |
| MS12-26 | P0 | policy | policy | T-MS-369 |
| MS12-27 | P0 | mixed | SCR-MS-03, SCR-MS-01 · +non-UI: named routes, post-hydration guards, legacy dead routes removed | T-MS-362 |
| MS12-28 | P0 | engine | engine | T-MS-371 |
| MS12-29 | P1 | screen | SCR-MS-18 | T-MS-374 |
| MS12-30 | P1 | engine | engine | T-MS-373 |

### docs/prd/modules/M06-proposals.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M06-01 | P0 | policy | policy | LAW |
| M06-02 | P0 | policy | policy | LAW |
| M06-03 | P0 | policy | policy | T-M06-021 |
| M06-04 | P0 | mixed | SCR-M06-17 · +non-UI: F8 honesty law: every figure labelled; verbatim indicative line… | T-M06-017 |
| M06-05 | P0 | screen | SCR-M06-01 | T-M06-001 |
| M06-06 | P0 | mixed | SCR-M06-03 · +non-UI: R17: type branches nothing downstream except document and projection… | T-M06-003 |
| M06-07 | P0 | screen | SCR-M06-03 | T-M06-003 |
| M06-08 | P0 | screen | SCR-M06-04 | T-M06-004 |
| M06-09 | P0 | screen | SCR-M06-05 | T-M06-005 |
| M06-10 | P0 | screen | SCR-M06-06 | T-M06-006 |
| M06-11 | P0 | screen | SCR-M06-07 | T-M06-007 |
| M06-12 | P0 | screen | SCR-M06-08 | T-M06-008 |
| M06-13 | P0 | mixed | SCR-M06-09 · +non-UI: tranche total must equal 100% — live feedback only, hard enforcement… | T-M06-009 |
| M06-14 | P0 | screen | SCR-M06-10 | T-M06-010 |
| M06-15 | P0 | screen | SCR-M06-11 | T-M06-011 |
| M06-16 | P0 | screen | SCR-M06-12 | T-M06-012 |
| M06-17 | P0 | screen | SCR-M06-13 | T-M06-013 |
| M06-18 | P0 | mixed | SCR-M06-01, SCR-M06-02 · +non-UI: hidden steps 6/7/9/11 filled from tenant defaults, 4/5 AI-filled… | T-M06-002 |
| M06-19 | P0 | mixed | SCR-M06-01 · +non-UI: loss-free expansion invariant: nothing re-entered or discarded… | T-M06-001 |
| M06-20 | P0 | policy | policy | T-M06-022 |
| M06-21 | P0 | screen | SCR-M06-02 | T-M06-002 |
| M06-22 | P0 | mixed | SCR-M06-02 · +non-UI: R12 law: free navigation everywhere, validation only at Generate… | T-M06-002 |
| M06-23 | P0 | mixed | SCR-M06-02 · +non-UI: one-pass gate: components, battery validity, payable floor, tranches,  | T-M06-002 |
| M06-24 | P0 | screen | SCR-M06-02 | T-M06-002 |
| M06-25 | P0 | mixed | SCR-M02-04 · +non-UI: every field commits on blur; a draft exists from the first commit and is resumable from the lead *(2026-08-07: the "editing online-first, generate/share/render online-only" connectivity clause is deleted — the vocabulary was `F4-01`'s and the boundary `F4-09`'s, both removed with the offline/sync capability, `Q61`; the live row now speaks only of losing a network mid-build)* | T-M06-023 |
| M06-26 | P0 | policy | policy | T-M06-028 |
| M06-27 | P0 | mixed | SCR-M06-10 · +non-UI: D22: all categories mandatory before Generate — the counter is the… | T-M06-010 |
| M06-28 | P0 | mixed | SCR-M06-10 · +non-UI: DD12 one-picker law: M05 §M05.6 pattern cited, never restated; no… | T-M06-010 |
| M06-29 | P0 | screen | SCR-M06-10 | T-M06-010 |
| M06-30 | P0 | mixed | SCR-M06-05, SCR-M06-10 · +non-UI: OFFGRID/HYBRID without battery: notice at step 3, hard block only at… | T-M06-005 |
| M06-31 | P0 | policy | policy | T-M06-026 |
| M06-32 | P0 | policy | policy | LAW |
| M06-33 | P2 | context | context → registers/enhancements.md (future battery-economics layer riding F8-23 honesty laws) | realized-by: docs/prd/registers/enhancements.md |
| M06-34 | P0 | engine | engine | T-M06-024 |
| M06-35 | P0 | screen | SCR-M06-05 | T-M06-005 |
| M06-36 | P0 | policy | policy | T-M06-022 |
| M06-37 | P0 | policy | policy | T-M06-022 |
| M06-38 | P0 | engine | engine | T-M06-024 |
| M06-39 | P0 | mixed | SCR-M06-14 · +non-UI: BOM money invariants: margin below tax, discounts pro-rated pre-tax… | T-M06-014 |
| M06-40 | P0 | mixed | SCR-M06-05 · +non-UI: EMI arithmetic rendered as labelled projection; financing marketplace  | T-M06-005 |
| M06-41 | P0 | policy | policy | T-M06-024 |
| M06-42 | P0 | mixed | SCR-M06-16 · +non-UI: versions immutable, append-only, server-numbered; snapshot pins… | T-M06-016 |
| M06-43 | P0 | policy | policy | T-M06-025 |
| M06-44 | P0 | policy | policy | T-M06-025 |
| M06-45 | P0 | policy | policy | T-M06-025 |
| M06-46 | P0 | mixed | SCR-M06-19, SCR-M06-18 · +non-UI: staleness derived by comparing pinned fingerprint/input versions… | T-M06-018 |
| M06-47 | P0 | mixed | SCR-M06-18 · +non-UI: tier change shown before commit (F8-05); accept creates Path A… | T-M06-018 |
| M06-48 | P0 | mixed | SCR-M06-19, SCR-M06-18 · +non-UI: duplicate copies all steps and components; never copies number… | T-M06-018 |
| M06-49 | P0 | policy | policy | T-M06-027 |
| M06-50 | P0 | screen | SCR-M06-15 | T-M06-015 |
| M06-51 | P0 | mixed | SCR-M06-17 · +non-UI: one computed value set feeds document, link, exports; render… | T-M06-017 |
| M06-52 | P0 | policy | policy | T-M06-029 |
| M06-53 | P0 | mixed | SCR-M06-18 · +non-UI: auto-send via connected transactional channel (Q33 integration)… | T-M06-018 |
| M06-54 | P0 | mixed | SCR-M06-18 · +non-UI: delivery states only as connected channel reports; fallback never… | T-M06-018 |
| M06-55 | P0 | policy | policy | T-M06-030 |
| M06-56 | P0 | mixed | SCR-M06-17 · +non-UI: exactly one recommended variant by default; variants only when… | T-M06-017 |
| M06-57 | P0 | mixed | SCR-M06-18 · +non-UI: connected channel's failure report is the visible failure… | T-M06-018 |
| M06-58 | P0 | mixed | SCR-M02-04 · +non-UI: nothing auto-withdraws; a person marks superseded/declined-by-tenant;  | T-M06-031 |

### docs/prd/modules/M07-sales-execution.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M07-01 | P0 | screen | SCR-M07-01 | T-M07-001 |
| M07-02 | P0 | screen | SCR-M07-01 | T-M07-001 |
| M07-03 | P0 | screen | SCR-M07-01 | T-M07-001 |
| M07-04 | P0 | mixed | SCR-M07-01 · +non-UI: renders M02 lead-machine output only; invents no timer *(2026-08-07: the trailing "offline reads" clause is deleted with the offline/sync capability, `Q61` — My Day reads from the server like every other read, and the live `M07-04` never mentioned connectivity)* | T-M07-001 |
| M07-05 | P0 | policy | policy | T-M07-021 |
| M07-06 | P0 | mixed | SCR-M07-01 · +non-UI: auto-created tasks record provenance rule and land on a named person,  | T-M07-001 |
| M07-07 | P0 | engine | engine | T-M07-021 |
| M07-08 | P0 | screen | SCR-M07-05 | T-M07-005 |
| M07-09 | P0 | mixed | SCR-M07-05 · +non-UI: floor items can only narrow; above-floor items are the owner's | T-M07-005 |
| M07-10 | P0 | mixed | SCR-M07-05 · +non-UI: four hard floors no edit removes; proactive disclosure is pack flag… | T-M07-005 |
| M07-11 | P0 | mixed | SCR-M07-05 · +non-UI: asks-to-stop rule is statutory opt-out, cannot be removed | T-M07-005 |
| M07-12 | P0 | mixed | SCR-M07-06 · +non-UI: saves only equal-or-narrower schedules and extra holidays vs… | T-M07-006 |
| M07-13 | P0 | screen | SCR-M07-07 | T-M07-007 |
| M07-14 | P0 | mixed | SCR-M07-08 · +non-UI: versioned-append publishing; queued calls keep their queued version… | T-M07-008 |
| M07-15 | P0 | mixed | SCR-M07-05 · +non-UI: six agent languages stay independent of three interface languages | T-M07-005 |
| M07-16 | P0 | screen | SCR-M07-09 | T-M07-009 |
| M07-17 | P0 | policy | policy | T-M07-023 |
| M07-18 | P0 | mixed | SCR-M07-10 · +non-UI: captures unanswerable questions with asked-count; answer live from… | T-M07-010 |
| M07-19 | P0 | mixed | SCR-M07-09 · +non-UI: contradiction detection runs at save, before agent can speak either | T-M07-009 |
| M07-20 | P0 | policy | policy | T-M07-022 |
| M07-21 | P1 | screen | SCR-M07-09 | T-M07-009 |
| M07-22 | P0 | engine | engine | T-M07-022 |
| M07-23 | P0 | policy | policy | T-M07-022 |
| M07-24 | P0 | policy | policy | T-M07-022 |
| M07-25 | P0 | mixed | SCR-M07-13 · +non-UI: rep correction overrides agent read on the lead; agent original stays  | T-M07-013 |
| M07-26 | P0 | mixed | SCR-M07-11 · +non-UI: no auto-training ever in v1; owner promotion is only behaviour path | T-M07-011 |
| M07-27 | P0 | engine | engine | T-M07-024 |
| M07-28 | P0 | mixed | SCR-M07-12 · +non-UI: gate reads one row of customer compliance fields per dial | T-M07-012 |
| M07-29 | P0 | policy | policy | T-M07-024 |
| M07-30 | P0 | mixed | SCR-M07-12 · +non-UI: gate enforcement binds automated dials; manual dials get… | T-M07-012 |
| M07-31 | P0 | policy | policy | T-M07-024 |
| M07-32 | P0 | policy | policy | T-M07-024 |
| M07-33 | P0 | engine | engine | T-M07-025 |
| M07-34 | P0 | mixed | SCR-M07-05 · +non-UI: off means nothing queues or dials; inbound falls to non-AI routing | T-M07-005 |
| M07-35 | P0 | mixed | SCR-M07-12 · +non-UI: window-shifted scheduling; attempts counted against configured… | T-M07-012 |
| M07-36 | P0 | mixed | SCR-M07-12 · +non-UI: queued call dials with exactly its queued config version | T-M07-012 |
| M07-37 | P0 | mixed | SCR-M07-12 · +non-UI: allowance checked at insert and dial; minutes metered to usage ledger | T-M07-012 |
| M07-38 | P0 | mixed | SCR-M07-13 · +non-UI: every call ledgered; recording purged at retention bound, transcript… | T-M07-013 |
| M07-39 | P0 | engine | engine | T-M07-026 |
| M07-40 | P0 | policy | policy | T-M07-026 |
| M07-41 | P0 | policy | policy | T-M07-022 |
| M07-42 | P0 | screen | SCR-M07-14 | T-M07-014 |
| M07-43 | P0 | policy | policy | T-M07-027 |
| M07-44 | P0 | mixed | SCR-M07-15 · +non-UI: chains ring level-by-level with timeouts, mandatory terminal… | T-M07-015 |
| M07-45 | P0 | engine | engine | T-M07-027 |
| M07-46 | P0 | screen | SCR-SHELL-01 | T-M07-027, T-SHELL-001 |
| M07-47 | P0 | mixed | SCR-M07-16 · +non-UI: flows versioned and published whole; in-flight calls keep their… | T-M07-016 |
| M07-48 | P0 | engine | engine | T-M07-028 |
| M07-49 | P0 | integration | integration | T-M07-029 |
| M07-50 | P0 | policy | policy | T-M07-028 |
| M07-51 | P0 | screen | SCR-M07-17 | T-M07-017 |
| M07-52 | P0 | mixed | SCR-M07-17 · +non-UI: BYO is inbound forwarding only; outbound CLI never portable | T-M07-017 |
| M07-53 | P0 | screen | SCR-M07-17 | T-M07-017 |
| M07-54 | P0 | integration | integration | T-M07-029 |
| M07-55 | P0 | screen | SCR-M07-18 | T-M07-018 |
| M07-56 | P0 | mixed | SCR-M07-18 · +non-UI: correlation-only claim law (F8-30/31); product never claims agent… | T-M07-018 |
| M07-57 | P0 | screen | SCR-M07-19 | T-M07-019 |
| M07-58 | P0 | screen | SCR-M07-10 | T-M07-010 |
| M07-59 | P0 | screen | SCR-M07-20 | T-M07-020 |
| M07-60 | P1 | mixed | SCR-M07-18 · +non-UI: visible to EPC Owner and Sales Manager only… | T-M07-018 |
| M07-61 | P0 | mixed | SCR-M07-18 · +non-UI: detects collapsing connect rate with likely cause; monthly in-app… | T-M07-018 |
| M07-62 | P0 | mixed | SCR-M07-02 · +non-UI: atomically creates the project in the same act; no customer re-entry | T-M07-002 |
| M07-63 | P0 | mixed | SCR-M07-03 · +non-UI: reason drives R9: postponed auto-resurfaces, not-interested… | T-M07-003 |
| M07-64 | P0 | mixed | SCR-M07-04 · +non-UI: postponed losses auto-resurface on their date without anyone… | T-M07-004 |
| M07-65 | P0 | policy | policy | LAW |

### docs/prd/modules/M08-projects.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M08-01 | P0 | policy | policy | LAW |
| M08-02 | P0 | policy | policy | T-M08-007 |
| M08-03 | P0 | policy | policy | T-M08-007 |
| M08-04 | P0 | policy | policy | T-M08-007 |
| M08-05 | P0 | policy | policy | T-M08-007 |
| M08-06 | P0 | policy | policy | LAW |
| M08-07 | P1 | policy | policy | T-M08-013 |
| M08-08 | P0 | policy | policy | T-M08-008 |
| M08-09 | P0 | policy | policy | T-M08-008 |
| M08-10 | P0 | screen | SCR-M08-01 | T-M08-001 |
| M08-11 | P0 | screen | SCR-M08-01 | T-M08-001 |
| M08-12 | P0 | screen | SCR-M08-01 | T-M08-001 |
| M08-13 | P0 | policy | policy | LAW |
| M08-14 | P1 | mixed | SCR-M08-01 · +non-UI: append-only actor-stamped timeline event; a backward stage move is allowed and recorded with the same weight as a forward one *(2026-08-07: "online-first write" replaced — the vocabulary was `F4-01`'s, deleted with the offline/sync capability, `Q61`; a stage move is an ordinary server write)* | T-M08-001 |
| M08-15 | P0 | engine | engine | T-M08-009 |
| M08-16 | P0 | screen | SCR-M08-02 | T-M08-002 |
| M08-17 | P0 | mixed | SCR-M08-02 · +non-UI: single polymorphic append-only stream owned by M02; project and… | T-M08-002 |
| M08-18 | P0 | policy | policy | LAW |
| M08-19 | P1 | policy | policy | LAW |
| M08-20 | P0 | policy | policy | T-M08-010 |
| M08-21 | P0 | mixed | SCR-M08-02, SCR-M08-01 · +non-UI: start date never silently back-edited; clearing records who and when… | T-M08-002 |
| M08-22 | P0 | policy | policy | T-M08-008 |
| M08-23 | P0 | policy | policy | T-M08-010 |
| M08-24 | P0 | policy | policy | T-M08-010 |
| M08-25 | P0 | policy | policy | T-M08-010 |
| M08-26 | P0 | policy | policy | T-M08-010 |
| M08-27 | P0 | screen | SCR-M08-02 | T-M08-002 |
| M08-28 | P0 | policy | policy | T-M08-010 |
| M08-29 | P0 | policy | policy | T-M08-010 |
| M08-30 | P0 | mixed | SCR-M08-03 · +non-UI: row set seeded once from market pack per segment at creation; module… | T-M08-003 |
| M08-31 | P0 | mixed | SCR-M08-03 · +non-UI: verification is a separate audited act recording who and when; upload  | T-M08-003 |
| M08-32 | P0 | policy | policy | T-M08-012 |
| ~~M08-33~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It kept the local original of a captured project document until the server confirmed it held the file. `M04-55` rules the photograph queue the product's one and only device-held queue, holding "photographs and nothing else", so no retained local original exists for project documents; a device write queue is a non-goal (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1). The guarantee on a failed upload is now the general one: the act fails fast and honestly rather than appearing to succeed (`F8-36`). `M08-32`, the neighbouring capture law, is untouched, as is `T-M08-012`.* | — |
| M08-34 | P0 | policy | policy | T-M08-008 |
| M08-35 | P0 | policy | policy | T-M08-009 |
| M08-36 | P0 | engine | engine | T-M08-009 |
| M08-37 | P0 | policy | policy | T-M08-011 |
| M08-38 | P0 | mixed | SCR-M08-02 · +non-UI: sends via tenant's connected transactional channel with honest… | T-M08-002 |
| M08-39 | P0 | policy | policy | T-M08-011 |
| ~~M08-40~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It forbade a money-bearing offline write on a project surface; with no queue there is no such write left to forbid. The surviving money rule is `M11-06` — every money mutation is online-only and is refused, never queued — which `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 3 cites by name ("No offline money, on any surface, at any tier"). `M08-39` and `T-M08-011` are untouched.* | — |
| M08-41 | P0 | mixed | SCR-M08-04 · +non-UI: steps are the design's derived work order (M05-76); this module… | T-M08-004 |
| M08-42 | P0 | mixed | SCR-M08-04 · +non-UI: attribution law per R16: tick attributed to coordinator/ticker; never  | T-M08-004 |
| M08-43 | P0 | policy | policy | T-M08-014 |
| ~~M08-44~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). It made installation-checklist ticks offline-capable and queued them; both halves are non-goals by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1). The checklist itself is untouched at `M08-43` and `M08-45` — a tick is now an ordinary server write that fails fast and honestly when it cannot reach the server (`F8-36`). `T-M08-014` is alive.* | — |
| M08-45 | P1 | screen | SCR-M08-05 | T-M08-005 |
| M08-46 | P0 | mixed | SCR-M08-06 · +non-UI: link becomes the pack (F5's transition); share rides transactional… | T-M08-006 |
| M08-47 | P0 | mixed | SCR-M08-06 · +non-UI: produces M02-16's referral row on both records; no credit, redemption  | T-M08-006 |
| M08-48 | P0 | policy | policy | T-M08-015 |
| M08-49 | P1 | policy | policy | T-M08-015 |
| M08-50 | P0 | policy | policy | T-M08-015 |
| M08-51 | P0 | mixed | SCR-M08-01, SCR-M08-02 · +non-UI: terminal state; revenue stops counting immediately across all… | T-M08-001 |
| M08-52 | P0 | policy | policy | T-M08-015 |
| M08-53 | P1 | policy | policy | T-M08-015 |

### docs/prd/modules/M09-field-workforce.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M09-01 | P0 | context | context → M09.2-M09.10 feature-area rows; registers/enhancements.md | realized-by: docs/prd/modules/M09-field-workforce.md §M09.2–§M09.10 rows (this file); docs/prd/registers/enhancements.md |
| M09-02 | P0 | policy | policy | T-M09-009 |
| M09-03 | P0 | policy | policy | T-M09-009 |
| M09-04 | P0 | mixed | SCR-M09-01 · +non-UI: billing unit is tracked-seat-months; ledger, proration and invoicing… | T-M09-001 |
| M09-05 | P0 | policy | policy | T-M09-009 |
| M09-06 | P0 | context | context → M09 §5 non-goals; M09-09 | realized-by: docs/prd/modules/M09-field-workforce.md §5 non-goals; M09-09 (LAW) |
| M09-07 | P0 | context | context → M09-25, M09-33, M09-34, M09-63; registers/enhancements.md | T-M09-014 |
| M09-08 | P0 | policy | policy | LAW |
| M09-09 | P0 | policy | policy | LAW |
| M09-10 | P0 | policy | policy | T-M09-008 |
| M09-11 | P0 | policy | policy | T-M09-008 |
| M09-12 | P0 | screen | SCR-M09-01 | T-M09-001 |
| M09-13 | P0 | mixed | SCR-M09-02 · +non-UI: on/off notifications delivered to the employee (placement is F6's) | T-M09-002 |
| M09-14 | P0 | mixed | SCR-M09-01 · +non-UI: collection ceases immediately on toggle-off; collected data kept… | T-M09-001 |
| M09-15 | P0 | policy | policy | T-M09-008 |
| M09-16 | P0 | mixed | SCR-M09-01 · +non-UI: price is market-book data; empty slot means not sellable; no FX… | T-M09-001 |
| M09-17 | P0 | policy | policy | T-M09-009 |
| M09-18 | P0 | policy | policy | T-M09-009 |
| M09-19 | P0 | mixed | SCR-M09-02 · +non-UI: record schema: who, site/visit, capture time, position with accuracy,  | T-M09-002 |
| ~~M09-20~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`). Its durable offline queue for site check-in and check-out died with the capability — a non-goal by name (`foundations/F4-data-integrity.md` §5 · Non-goals, bullet 1) — and its acceptance line, which tested the no-connection half, went with it. Its two surviving halves are live in the concurrency law and were never about connectivity: a visit's status only moves forward (`F4-17`), and last-writer-wins is resolved by server apply order and never by a device clock (`F4-19`), both built in `docs/tasks/F-platform.md`. The check-in/check-out capability itself is unchanged at `M09-18`, `M09-19` and `M09-21`–`M09-24`.* | — |
| M09-21 | P0 | mixed | SCR-M09-02 · +non-UI: never backfill position from site coords, last-known, or network… | T-M09-002 |
| M09-22 | P0 | policy | policy | T-M09-010 |
| M09-23 | P1 | screen | SCR-M09-02 | T-M09-002 |
| M09-24 | P0 | mixed | SCR-M09-02, SCR-M09-04 · +non-UI: no invented close-out time; human closes, correction appended and… | T-M09-002 |
| M09-25 | P2 | engine | engine | T-M09-014 |
| M09-26 | P0 | policy | policy | T-M09-015 |
| M09-27 | P0 | screen | SCR-M09-03 | T-M09-003 |
| M09-28 | P0 | mixed | SCR-M09-02, SCR-M02-04 · +non-UI: moves no lead stage; facts ride the lead's own scope | T-M09-002 |
| M09-29 | P0 | policy | policy | T-M09-015 |
| M09-30 | P0 | policy | policy | T-M09-015 |
| M09-31 | P0 | mixed | SCR-M09-03 · +non-UI: three outcomes, mandatory reason on could-not-complete; forward-only status, a regressing write refused (`F4-17`) *(2026-08-07: "offline write … corrected on sync" reworded — there is no queue and no sync to correct on, `Q61`; `F4-17` survived the sweep and is the live source)* | T-M09-003 |
| M09-32 | P1 | screen | SCR-M09-02 | T-M09-002 |
| M09-33 | P2 | mixed | SCR-M09-02 · +non-UI: geography/window ordering suggestion engine; acceptable or ignorable,  | T-M09-002 |
| M09-34 | P2 | screen | SCR-F5-02 | T-M09-017 |
| M09-35 | P0 | screen | SCR-M09-02 | T-M09-002 |
| ~~M09-36~~ | — | **excluded** | *Row deleted 2026-08-07 with the offline/sync capability (owner ruling `Q61`), and it leaves the most consequential hole of the sweep — recorded as **OPEN owner question `Q64`**, which blocks `SCR-M09-02` (dated UNRESOLVED note and an `attendance-waiting` state on the brief). The row stated that marking a day start or a day end reaches the server to complete: until the server has it, the action shows as waiting and never as recorded. No live row replaces it — `M09-35` governs who marks it, `M09-37` what a check-in may propose, `M09-38` correction-by-append, `M09-39` absence — so an optimistic local tick on an attendance mark is currently unforbidden, in the one area where a fabricated or lost record reads as a judgement about a person and drives payroll. Not re-instated and no replacement invented — `Q64` is the owner's call. `Q15`, the 2026-08-04 ruling this row's "offline set not extended" clause cited, is SUPERSEDED 2026-08-07 by `Q61`.* **(Amended 2026-08-15: `Q64` is no longer open. The owner ruled and **restored this law as new live row `M09-71`**, in `docs/prd/modules/M09-field-workforce.md` §M09.5, dispositioned in this section on `SCR-M09-02`; `M09-71`'s source column names `M09-36` as the row it restores, and it restores only the honesty half — the connectivity half died correctly with the boundary and is not re-instated. **This row stays struck and this id is not resurrected** — `M09-36` genuinely was deleted on 2026-08-07 and every dated task and register record saying so stays true. Everything above — the hole, the blocked brief, `Q64` open, the optimistic tick unforbidden — was true from 2026-08-07 until that ruling and is left standing as the record of it.)** | — |
| M09-37 | P0 | mixed | SCR-M09-02 · +non-UI: never writes attendance without the person's confirming act | T-M09-002 |
| M09-38 | P0 | policy | policy | T-M09-016 |
| M09-39 | P0 | policy | policy | LAW |
| M09-40 | P0 | context | context → modules/M10-hr-lite.md | T-M09-002 |
| M09-41 | P0 | policy | policy | LAW |
| M09-42 | P0 | policy | policy | T-M09-009 |
| M09-43 | P0 | screen | SCR-M09-04 | T-M09-004 |
| M09-44 | P0 | mixed | SCR-M09-01 · +non-UI: window = day-start tap to day-end tap plus owner force-stop backstop… | T-M09-001 |
| M09-45 | P0 | mixed | SCR-M09-05, SCR-M09-06 · +non-UI: no line, curve or estimate fitted across unobserved intervals | T-M09-005 |
| M09-46 | P0 | policy | policy | T-M09-010 |
| M09-47 | P0 | policy | policy | LAW |
| M09-48 | P0 | mixed | SCR-M09-04 · +non-UI: a live position needs the server; the last known position is rendered with the time it was taken, plainly labelled, never as current *(2026-08-07: the `F4-09` citation is dropped — the online-only capability table was deleted with the offline/sync capability, `Q61`; the live sources are `F8-18` and `F8-34`)* | T-M09-004 |
| M09-49 | P0 | mixed | SCR-M09-07 · +non-UI: no place creation; anchors are M08/M04/M02 sites; wrong fence = fix… | T-M09-007 |
| M09-50 | P0 | mixed | SCR-M09-07, SCR-M09-01 · +non-UI: radius below typical fix accuracy refused with reason named | T-M09-007 |
| M09-51 | P0 | mixed | SCR-M09-02 · +non-UI: ignored prompt writes nothing; fence crossing recorded as fence's… | T-M09-002 |
| M09-52 | P0 | engine | engine | T-M09-011 |
| M09-53 | P0 | policy | policy | T-M09-009 |
| M09-54 | P0 | screen | SCR-M09-05 | T-M09-005 |
| M09-55 | P0 | screen | SCR-M09-06 | T-M09-006 |
| M09-56 | P0 | mixed | SCR-M09-05 · +non-UI: append-only; corrections append; nothing inferred from other timeline  | T-M09-005 |
| M09-57 | P0 | policy | policy | T-M09-012 |
| M09-58 | P0 | policy | policy | LAW |
| M09-59 | P0 | screen | SCR-M09-04 | T-M09-004 |
| M09-60 | P0 | policy | policy | LAW |
| M09-61 | P0 | screen | SCR-M09-04 | T-M09-004 |
| M09-62 | P1 | context | context → modules/M13-dashboards-and-reporting.md | T-M09-004 |
| M09-63 | P2 | mixed | SCR-M09-04 · +non-UI: nearest tracked, working, free computation; tracked seats only; never  | T-M09-004 |
| M09-64 | P0 | policy | policy | T-M09-010 |
| M09-65 | P0 | policy | policy | T-M09-008 |
| M09-66 | P0 | mixed | SCR-M09-02, SCR-M09-05 · +non-UI: reading one's own state and record requires no grant | T-M09-002 |
| M09-67 | P0 | policy | policy | LAW |
| M09-68 | P0 | mixed | SCR-M09-01 · +non-UI: absent determination is a disable, never a permissive default (F1-05) | T-M09-001 |
| M09-69 | P0 | policy | policy | T-M09-012 |
| M09-70 | P0 | policy | policy | T-M09-013 |
| M09-71 | P0 | mixed | SCR-M09-02 · +non-UI: a day start/end exists only once the server has it; the time shown is the server's, never a local clock | T-M09-002 |

### docs/prd/modules/M10-hr-lite.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M10-01 | P0 | policy | policy | LAW |
| M10-02 | P0 | policy | policy | LAW |
| M10-03 | P0 | policy | policy | T-M10-008 |
| M10-04 | P0 | mixed | SCR-M10-03 · +non-UI: role grants stay F2.M01.manage-team; M10 never widens or delegates | T-M10-003 |
| M10-05 | P0 | policy | policy | T-M10-009 |
| M10-06 | P0 | policy | policy | T-M10-008 |
| M10-07 | P0 | screen | SCR-M10-03 | T-M10-003 |
| M10-08 | P0 | policy | policy | T-M10-008 |
| M10-09 | P1 | policy | policy | T-M10-009 |
| M10-10 | P0 | mixed | SCR-M10-02, SCR-M10-03 · +non-UI: deactivate-never-delete invariant (F2-20 family) | T-M10-002 |
| M10-11 | P1 | screen | SCR-M10-02 | T-M10-002 |
| M10-12 | P0 | policy | policy | T-M10-012 |
| M10-13 | P0 | screen | SCR-M10-01, SCR-M10-02 | T-M10-001 |
| M10-14 | P0 | screen | SCR-M10-01 | T-M10-001 |
| M10-15 | P1 | screen | SCR-M10-01 | T-M10-001 |
| M10-16 | P2 | screen | SCR-M10-01 | T-M10-001 |
| M10-17 | P1 | policy | policy | LAW |
| M10-18 | P0 | mixed | SCR-M10-04 · +non-UI: offboard defined as revocation plus reassignment, done together | T-M10-004 |
| M10-19 | P0 | mixed | SCR-M10-04 · +non-UI: composes open work cross-module; owns no assignment act; nothing… | T-M10-004 |
| M10-20 | P0 | policy | policy | T-M10-004 |
| M10-21 | P0 | mixed | SCR-M10-04 · +non-UI: F2 guard-rail transitions enforced and audited | T-M10-004 |
| M10-22 | P0 | mixed | SCR-M10-04 · +non-UI: deactivation act is Owner-only, never delegated | T-M10-004 |
| M10-23 | P0 | policy | policy | LAW |
| M10-24 | P0 | policy | policy | LAW |
| M10-25 | P0 | screen | SCR-M10-05 | T-M10-005 |
| M10-26 | P1 | screen | SCR-M10-01, SCR-M10-05 | T-M10-001 |
| M10-27 | P0 | mixed | SCR-M10-06, SCR-M10-01, SCR-M10-05 · +non-UI: no accrual arithmetic; leave types are tenant-configured labels | T-M10-006 |
| M10-28 | P2 | mixed | SCR-M10-05 · +non-UI: distinct data from F1-50 calling-window holiday calendar | T-M10-005 |
| M10-29 | P1 | policy | policy | LAW |
| M10-30 | P0 | policy | policy | T-M10-009 |
| M10-31 | P0 | policy | policy | T-M10-010 |
| M10-32 | P0 | policy | policy | T-M10-010 |
| M10-33 | P0 | policy | policy | T-M10-010 |
| M10-34 | P0 | mixed | SCR-M10-07 · +non-UI: fail closed; unmapped never widens to everyone | T-M10-007 |
| M10-35 | P0 | screen | SCR-M10-03 | T-M10-003 |
| M10-36 | P1 | mixed | SCR-M10-01, SCR-M10-03 · +non-UI: expiry blocks nothing; tenant decides consequences | T-M10-003 |
| M10-37 | P1 | policy | policy | T-M10-011 |
| M10-38 | P1 | policy | policy | T-M10-011 |
| M10-39 | P0 | policy | policy | T-M10-011 |

### docs/prd/modules/M11-payments-and-collections.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M11-01 | P0 | policy | policy | LAW |
| M11-02 | P0 | policy | policy | LAW |
| M11-03 | P0 | policy | policy | LAW |
| M11-04 | P0 | policy | policy | LAW |
| M11-05 | P0 | policy | policy | T-M11-010 |
| M11-06 | P0 | policy | policy | T-M11-008 |
| M11-07 | P0 | policy | policy | T-M11-009 |
| M11-08 | P0 | engine | engine | T-M11-005 |
| M11-09 | P0 | policy | policy | T-M11-005 |
| M11-10 | P0 | engine | engine | T-M11-006 |
| M11-11 | P0 | engine | engine | T-M11-006 |
| M11-12 | P0 | engine | engine | T-M11-006 |
| M11-13 | P0 | engine | engine | T-M11-005 |
| M11-14 | P0 | mixed | SCR-M11-02 · +non-UI: schedule follows version in force; receipts never rewritten or… | T-M11-002 |
| M11-15 | P0 | mixed | SCR-M11-02 · +non-UI: never fabricate rows, distribute evenly, or back-fill templates | T-M11-002 |
| M11-16 | P0 | mixed | SCR-M11-02 · +non-UI: no recurring billing, no periodic charge, no added rows | T-M11-002 |
| M11-17 | P0 | policy | policy | T-M11-010 |
| M11-18 | P0 | policy | policy | T-M11-010 |
| M11-19 | P0 | mixed | SCR-M11-02, SCR-M11-04 · +non-UI: scheduled credential probe raises alert and settings nag (probe is… | T-M11-002 |
| M11-20 | P0 | policy | policy | T-M11-010 |
| M11-21 | P0 | policy | policy | LAW |
| M11-22 | P0 | policy | policy | T-M11-010 |
| M11-23 | P1 | mixed | SCR-M11-04 · +non-UI: disconnect recorded and audited; no revocation ability claimed over… | T-M11-004 |
| M11-24 | P0 | screen | SCR-M11-02 | T-M11-002 |
| M11-25 | P0 | integration | integration | T-M11-011 |
| M11-26 | P0 | policy | policy | LAW |
| M11-27 | P0 | integration | integration | T-M11-012 |
| M11-28 | P0 | screen | SCR-M11-02 | T-M11-002 |
| M11-29 | P0 | integration | integration | T-M11-012 |
| M11-30 | P1 | mixed | SCR-M11-02 · +non-UI: supersession rule when outstanding amount changes (disclosed reading) | T-M11-002 |
| M11-31 | P0 | mixed | SCR-M11-02 · +non-UI: all unavailability causes land on the same manual fallback rule | T-M11-002 |
| M11-32 | P0 | policy | policy | LAW |
| M11-33 | P0 | screen | SCR-M11-03 | T-M11-003 |
| M11-34 | P0 | screen | SCR-M11-03 | T-M11-003 |
| M11-35 | P0 | mixed | SCR-M11-03 · +non-UI: mode validated against pack's open-set vocabulary | T-M11-003 |
| M11-36 | P0 | mixed | SCR-M11-03, SCR-M11-02 · +non-UI: many entries per tranche; state follows entries; surplus never… | T-M11-002 |
| M11-37 | P0 | mixed | SCR-M11-03 · +non-UI: receipt file rides capture-and-upload pipeline; entry is server-only… | T-M11-003 |
| M11-38 | P1 | mixed | SCR-M11-03 · +non-UI: the ledger write path refuses a non-positive amount from any… | T-M11-003 |
| M11-39 | P0 | mixed | SCR-M11-03 · +non-UI: recording requires the server, is refused with an honest reason, and nothing is held (`M11-06`) *(2026-08-07: the `F4-09` row-2 citation is dropped — the online-only capability table was deleted with the offline/sync capability, `Q61`; the money rule it pointed at is live and unchanged at `M11-06`, cited by `foundations/F4-data-integrity.md` §5 · Non-goals, bullet 3)* | T-M11-003 |
| M11-40 | P0 | policy | policy | T-M11-007 |
| M11-41 | P0 | mixed | SCR-M11-02, SCR-F5-02 · +non-UI: receipt record contents: amount, tranche, date, mode, reference… | T-M11-002 |
| M11-42 | P0 | mixed | SCR-M11-02 · +non-UI: claim never upgraded to confirmation; qualifier never dropped in… | T-M11-002 |
| M11-43 | P0 | engine | engine | T-M11-014 |
| M11-44 | P0 | policy | policy | T-M11-014 |
| M11-45 | P1 | mixed | SCR-F5-02 · +non-UI: receipt produced and published the instant money confirms | T-M11-015 |
| M11-46 | P0 | mixed | SCR-M11-02 · +non-UI: reversing entry with opposing amount, pointer, reason, actor… | T-M11-002 |
| M11-47 | P0 | screen | SCR-M11-02 | T-M11-002 |
| M11-48 | P0 | engine | engine | T-M11-013 |
| M11-49 | P0 | mixed | SCR-M11-02 · +non-UI: terminal state, mandatory reason, audited, never counts as collected | T-M11-002 |
| M11-50 | P0 | policy | policy | T-M11-013 |
| M11-51 | P0 | policy | policy | T-M11-009 |
| M11-52 | P0 | mixed | SCR-M11-02 · +non-UI: only place money is written; copy-message carve-out for project block | T-M11-002 |
| M11-53 | P0 | mixed | SCR-M08-02 · +non-UI: supplies overdue facts to M08 board/project and M13 dashboard; never… | T-M11-016 |
| M11-54 | P1 | mixed | SCR-M11-01 · +non-UI: supplies due/overdue/receipts/period figures; composition is M13's | T-M11-001 |
| M11-55 | P0 | mixed | SCR-F5-02 · +non-UI: publishes facts only, never copy; F5 renders; never gates page | T-M11-015 |
| M11-56 | P0 | policy | policy | LAW |

### docs/prd/modules/M12-platform-billing.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M12-01 | P0 | policy | policy | LAW |
| M12-02 | P0 | policy | policy | LAW |
| M12-03 | P0 | policy | policy | T-M12-007 |
| M12-04 | P0 | engine | engine | T-M12-005 |
| M12-05 | P0 | engine | engine | T-M12-005 |
| M12-06 | P0 | mixed | SCR-SHELL-06 · +non-UI: two-phase 7-day grace timer; only metered features pause day 4 | T-SHELL-006, T-M12-005 |
| M12-07 | P0 | policy | policy | T-M12-005 |
| M12-08 | P0 | mixed | SCR-M12-02 · +non-UI: new gateway subscription created, never resumed; entitlements… | T-M12-002 |
| M12-09 | P0 | engine | engine | T-M12-006 |
| M12-10 | P0 | integration | integration | T-M12-007 |
| M12-11 | P0 | integration | integration | T-M12-007 |
| M12-12 | P1 | policy | policy | T-M12-007 |
| M12-13 | P1 | policy | policy | T-M12-005 |
| M12-14 | P0 | policy | policy | T-M12-005 |
| M12-15 | P0 | policy | policy | LAW |
| M12-16 | P0 | engine | engine | T-M12-008 |
| M12-17 | P0 | policy | policy | T-M12-008 |
| M12-18 | P0 | engine | engine | T-M12-008 |
| M12-19 | P1 | policy | policy | T-M12-008 |
| M12-20 | P0 | policy | policy | LAW |
| M12-21 | P0 | mixed | SCR-SHELL-06 · +non-UI: BM-35 matrix gates every mutation; typed entitlement-blocked error | T-SHELL-006, T-M12-009 |
| M12-22 | P0 | policy | policy | T-M12-009 |
| M12-23 | P0 | policy | policy | T-M12-009 |
| M12-24 | P0 | policy | policy | LAW |
| M12-25 | P0 | policy | policy | LAW |
| M12-26 | P0 | policy | policy | LAW |
| M12-27 | P0 | policy | policy | T-M12-008 |
| M12-28 | P0 | policy | policy | LAW |
| M12-29 | P0 | policy | policy | LAW |
| M12-30 | P0 | mixed | SCR-M12-04, SCR-SHELL-06 · +non-UI: 80%/100%/7-day-grace cap ladder; counts reset on billing anchor, no… | T-SHELL-006, T-M12-009 |
| M12-31 | P0 | screen | SCR-SHELL-06 | T-SHELL-006, T-M12-009 |
| M12-32 | P0 | engine | engine | T-M12-010 |
| M12-33 | P0 | engine | engine | T-M12-010 |
| M12-34 | P0 | mixed | SCR-M12-04 · +non-UI: same query as enforcement and billing; gates need pre-warning first | T-M12-004 |
| M12-35 | P0 | mixed | SCR-M12-04 · +non-UI: overage bills as add-ons at published book rates next invoice | T-M12-004 |
| M12-36 | P1 | screen | SCR-M12-04 | T-M12-004 |
| M12-37 | P1 | engine | engine | T-M12-010 |
| M12-38 | P0 | policy | policy | LAW |
| M12-39 | P0 | mixed | SCR-SHELL-06 · +non-UI: day 0/2/4/6/7 rung timers, post-halt weekly then monthly; forfeiture… | T-SHELL-006, T-M12-011 |
| M12-40 | P0 | integration | integration | T-M12-011 |
| M12-41 | P0 | policy | policy | T-M12-011 |
| M12-42 | P1 | engine | engine | T-M12-011 |
| M12-43 | P1 | engine | engine | T-M12-006 |
| M12-44 | P0 | engine | engine | T-M12-012 |
| M12-45 | P0 | policy | policy | T-M12-012 |
| M12-46 | P0 | mixed | SCR-M12-02 · +non-UI: export ungated in every billing state including halted | T-M12-002 |
| M12-47 | P0 | mixed | SCR-M12-02 · +non-UI: refund-to-source; credit note auto-issues; renewals carry no refunds | T-M12-002 |
| M12-48 | P0 | mixed | SCR-M12-03 · +non-UI: immediate entitlements; prorated delta one-time invoice; swap at… | T-M12-003 |
| M12-49 | P0 | mixed | SCR-M12-03 · +non-UI: preview computed from real usage; recomputes at confirm and boundary | T-M12-003 |
| M12-50 | P0 | mixed | SCR-M12-02 · +non-UI: reason is signal never gate; runs to period end; data retained | T-M12-002 |
| M12-51 | P1 | policy | policy | LAW |
| M12-52 | P0 | policy | policy | T-M12-005 |
| M12-53 | P0 | mixed | SCR-M12-03, SCR-SHELL-06 · +non-UI: soft expiry law: convert never destroy; read+export always work | T-SHELL-006, T-M12-003 |
| M12-54 | P0 | mixed | SCR-M12-03 · +non-UI: hosted checkout handoff; payment at conversion; paid cycle starts… | T-M12-003 |
| M12-55 | P0 | screen | SCR-M12-02, SCR-M12-03 | T-M12-002 |
| M12-56 | P0 | policy | policy | LAW |
| M12-57 | P1 | engine | engine | T-M12-013 |
| M12-58 | P0 | policy | policy | LAW |

### docs/prd/modules/M13-dashboards-and-reporting.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M13-01 | P0 | policy | policy | LAW |
| M13-02 | P0 | policy | policy | LAW |
| M13-03 | P0 | policy | policy | T-M13-007 |
| M13-04 | P0 | policy | policy | T-M13-007 |
| M13-05 | P0 | policy | policy | LAW |
| M13-06 | P0 | policy | policy | LAW |
| M13-07 | P0 | policy | policy | LAW |
| M13-08 | P0 | policy | policy | LAW |
| M13-09 | P0 | policy | policy | LAW |
| M13-10 | P0 | mixed | SCR-SHELL-01 · +non-UI: fixed preset-precedence ladder derives one home; other presets… | T-M13-006, T-SHELL-001 |
| M13-11 | P0 | policy | policy | LAW |
| M13-12 | P0 | policy | policy | LAW |
| M13-13 | P0 | policy | policy | LAW |
| M13-14 | P0 | screen | SCR-M13-01 | T-M13-001 |
| M13-15 | P0 | screen | SCR-M13-01 | T-M13-001 |
| M13-16 | P0 | screen | SCR-M13-01 | T-M13-001 |
| M13-17 | P1 | mixed | SCR-M13-01 · +non-UI: target stored as goal only, one per scope+month; actuals derived at… | T-M13-008 |
| M13-18 | P1 | mixed | SCR-M13-01, SCR-M13-04 · +non-UI: median selection / outlier detection computation | T-M13-009 |
| M13-19 | P0 | policy | policy | LAW |
| M13-20 | P1 | screen | SCR-M13-01 | T-M13-001 |
| M13-21 | P1 | mixed | SCR-SHELL-03 · +non-UI: monthly summary generation and push scheduling; notification type… | T-M13-010, T-SHELL-003 |
| M13-22 | P0 | screen | SCR-M13-04 | T-M13-004 |
| M13-23 | P0 | screen | SCR-M13-05 | T-M13-005 |
| M13-24 | P0 | mixed | SCR-M13-04 · +non-UI: cycle duration computation, per-stage durations, per-segment medians;  | T-M13-009 |
| M13-25 | P0 | screen | SCR-M13-01, SCR-M13-03 | T-M13-003 |
| M13-26 | P1 | screen | SCR-M13-05 | T-M13-005 |
| M13-27 | P0 | policy | policy | LAW |
| M13-28 | P0 | policy | policy | LAW |
| M13-29 | P0 | screen | SCR-M13-01 | T-M13-001 |
| M13-30 | P0 | screen | SCR-M13-01 | T-M13-001 |
| M13-31 | P0 | screen | SCR-M07-01, SCR-M13-02 | T-M13-002 |
| M13-32 | P0 | screen | SCR-M04-06 | T-M04-006 |
| M13-33 | P0 | screen | SCR-MS-02 | T-MS-375 |
| M13-34 | P0 | screen | SCR-M08-01 | T-M08-001 |
| M13-35 | P0 | screen | SCR-M09-02 | T-M09-002 |
| M13-36 | P0 | mixed | SCR-M08-05 · +non-UI: F2-06 surface law: no commercial figure on this home or composed… | T-M08-005 |
| M13-37 | P0 | screen | SCR-M10-01 | T-M10-001 |
| M13-38 | P0 | screen | SCR-M11-01 | T-M11-001 |
| M13-39 | P0 | screen | SCR-M13-03 | T-M13-003 |
| M13-40 | P0 | screen | SCR-M03-01 | T-M03-001 |
| M13-41 | P0 | screen | SCR-M07-18 | T-M07-018 |
| M13-42 | P0 | screen | SCR-M07-18 | T-M07-018 |
| M13-43 | P0 | screen | SCR-M07-19, SCR-M07-10, SCR-M07-20, SCR-M07-18 | T-M07-019 |
| M13-44 | P1 | screen | SCR-M07-18 | T-M07-018 |
| M13-45 | P1 | mixed | SCR-SHELL-03 · +non-UI: monthly agent summary generation and push; type registers in F6 | T-M13-010, T-SHELL-003 |
| M13-46 | P0 | screen | SCR-M03-01 | T-M03-001 |
| M13-47 | P0 | screen | SCR-M13-03 | T-M13-003 |
| M13-48 | P0 | mixed | SCR-M10-01 · +non-UI: never computes hours-worked, punctuality or people-scores | T-M10-001 |
| M13-49 | P0 | policy | policy | LAW |
| M13-50 | P0 | policy | policy | LAW |
| M13-51 | P1 | engine | engine | T-M13-011 |
| M13-52 | P0 | policy | policy | T-M13-012 |
| M13-53 | P0 | policy | policy | T-M13-012 |
| M13-54 | P0 | policy | policy | T-M13-012 |

## 4. Gates (machine-checked)

Recomputed 2026-08-15 against the live PRD, corrected the same day, and recomputed again the same
day for the three restored rows. The live set is every id
carrying a tiered table row in `docs/prd/foundations/*.md`, `docs/prd/modules/**/*.md` or `docs/prd/0*.md`:
**1,659 rows** (was 1,656 before owner rulings `Q62`–`Q64` restored `M02-66`, `M02-67` and
`M09-71` as new live rows; was 1,655 before that — the first recompute's id pattern stopped at the
digits and dropped the
suffixed `MS7-24b`, a live P0 `engine` row; every count below allows an optional lowercase suffix).
The live PRD holds 1,660 table rows in all; `F7-36` is the 1,660th and carries no tier.
§3 holds **1,702 rows** — those 1,659 plus **43 struck rows**, which are dispositioned but are not
live requirements and are counted in no total below. The struck total was 18 until 2026-08-15,
when the 25 `F4-offline-and-sync` rows that had been dropped from this register outright were
restored as struck rows under `foundations/F4-data-integrity.md`; that restoration adds no live
row and changes no number in this section. **The struck total stays 43 through the `Q62`–`Q64`
restoration**: `M02-04`, `M02-26` and `M09-36` were genuinely deleted and stay struck, and the
rows carrying their law forward are new ids counted among the 1,659 live. §3's own total was
1,699 — equal to the pre-sweep live set — until that restoration and is now **1,702**: 1,659 live
+ 42 deleted ids + `F7-36`, de-tiered rather than deleted, which is the pre-sweep 1,699 plus the
three restored rows.

| Gate | Result |
|---|---|
| Union completeness — register ids vs ground truth | **1659/1659** *(was 1656/1656 before owner rulings `Q62`–`Q64` restored `M02-66`, `M02-67` and `M09-71` later on 2026-08-15; was 1655/1655 earlier that day, which had dropped `MS7-24b`; 1699/1699 at generation. Every live id has exactly one §3 row and every §3 row that is not struck resolves to a live id — verified by set difference in both directions, empty both ways, with row ids matched as `<prefix>-<digits><optional lowercase suffix>`.)* |
| All screen proposals consumed exactly once | **221/221** *(was "226 · PASS". §2 lists 150 canonical screens plus 72 merged-from sources = 222 entries; `F4-offline-and-sync:shell-sync-indicator` is struck at `SCR-SHELL-01` and consumed by nothing, leaving 221. No merged-from source appears twice. **Not reconcilable entry-by-entry:** the proposals that went with `SCR-SHELL-04` and `SCR-SHELL-05` were removed from §2 rather than struck, so the drop from 226 to 222 cannot be audited from this file alone.)* |
| Every row-side screen reference resolves | PASS *(every `SCR-…` in the Where cell of a **live** §3 row matches a screen in §2. **Struck rows are carved out and must be**: `~~F4-23~~` names `SCR-SHELL-04` and `~~F4-35~~` names `SCR-SHELL-05` precisely because those screens were deleted with them — a struck row records where a deleted requirement used to land, which is the audit trail, not a dangling pointer. `F4-21`'s Task cell names `SCR-SHELL-04` for the same reason. Carve-out added 2026-08-15, when restoring the 25 rows made the unqualified claim false.)* |
| Every screen/mixed row on ≥1 screen; no empty screens | PASS *(all 783 live screen/mixed rows carry ≥1 screen id — was 780 before the three restored `mixed` rows; all 150 screens carry ≥1 live row, and no screen was added or removed by the restoration)* |
| Every row dispositioned exactly once | **1659/1659** *(was 1656/1656 before the `Q62`–`Q64` restoration later on 2026-08-15; 1655/1655 earlier that day; 1699/1699 at generation)* |
| — of which carry a task id | **1381** *(was 1378 before the `Q62`–`Q64` restoration — `M02-66` carries `T-M02-008`, `M02-67` `T-M02-002` and `M09-71` `T-M09-002`; was 1377 earlier on 2026-08-15 — `MS7-24b` carries `T-MS-262`; 1419 at generation)* |
| — of which are dispositioned `LAW` or `realized-by` (policy/context rows that build nothing directly) | **278** *(unchanged by the `Q62`–`Q64` restoration — all three restored rows are tasked, not `LAW`; unchanged by the suffix correction too, `MS7-24b` being a tasked row; 280 at generation. 1381 + 278 = 1659)* |
| Every *buildable* row (screen/mixed/engine/integration) resolves to a task that exists | **PASS with 4 stated exceptions** *(was an unqualified PASS. 365 distinct task ids are cited across §3 and every one of them is present in `docs/tasks/`. Four rows typed buildable are dispositioned `LAW` and cite no task at all — `BM-05`, `BM-07`, `F2-07` (mixed) and `M05-56` (P2, engine); this predates the offline/sync removal and none of the four was touched by it, but the gate cannot honestly be claimed unqualified while they stand. The one task id the sweep removed, `T-SHELL-004` (Sync Center), is named only inside `F4-21`'s explanatory note and is claimed by no row. The 365 is unchanged by both 2026-08-15 movements: recovering `MS7-24b` adds a tasked row but no new task id — its `T-MS-262` is already cited by `MS7-15`, `MS7-16` and four others — and the three rows restored by `Q62`–`Q64` cite `T-M02-008`, `T-M02-002` and `T-M09-002`, each already cited by rows of its own module. The four stated exceptions are also unchanged: all three restored rows are typed `mixed` and all three carry a task.)* |
