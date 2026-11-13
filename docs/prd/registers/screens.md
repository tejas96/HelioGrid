# Screens register — every screen and where every requirement lands

This register answers two questions no single PRD document answers: **how many screens the
product has** (the screen index, §2) and **where every requirement lands** (the row disposition, §3).

## 1. Rules

A screen is one navigable surface (sheets/dialogs are its states, not new screens).
A requirement typed `screen`/`mixed` maps to ≥1 screen. `engine`/`policy`/`integration` rows
build with no surface of their own. `context` rows are realized through the rows they inform.
A screen splitting or merging during design updates THIS register first.
A screen's look is not recorded here: it is picked inside the task that builds it
(`docs/tasks/README.md`, rule 3).

## 2. Screen index

### The V column — the scope lock

**`V1` = 70 screens · `V2` = 58 · 128 total.** V1 is what ships first. V2 is real scope that is
deliberately not blocking the launch; no V2 screen is designed or built until V1 ships. Only an
owner decision moves a screen between them.

**`V` is a release axis and has nothing to do with `Tier`.** `P0`/`P1`/`P2` rank requirement rows
*inside* a screen; `V1`/`V2` decides whether the screen is in the first release at all.

A screen whose task has shipped has no task left in `docs/tasks/`: the task files hold open work
only, and git holds what shipped.

### App shell & global surfaces

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-SHELL-01 | **App Shell & Navigation** | P0 | 8 | V1 | `M02-crm-and-leads:shell-app-navigation`; `M13-dashboards-and-reporting:shell-home-switcher`; `M01-onboarding-and-tenant-config:shell-role-home`; `F1-global-market-framework:shell-grievance-contact`; `M07-sales-execution:shell-user-presence` |
| SCR-SHELL-02 | **Global Search** | P0 | 2 | V1 | — |
| SCR-SHELL-03 | **Notification Center** | P0 | 5 | V1 | `M13-dashboards-and-reporting:shell-notification-center` |
| SCR-SHELL-06 | **Billing State Banner & Denial Sheets** | P0 | 6 | V1 | — |

### M01 · Onboarding & tenant config

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-M01-01 | **Sign In** | P0 | 4 | V1 | — |
| SCR-M01-02 | **Company Signup** | P0 | 3 | V1 | — |
| SCR-M01-03 | **Onboarding — Language** | P0 | 1 | V1 | — |
| SCR-M01-04 | **Setup — What You Sell** | P0 | 1 | V1 | — |
| SCR-M01-05 | **Business Profile** | P0 | 3 | V1 | — |
| SCR-M01-06 | **Setup — You're Ready** | P0 | 1 | V1 | — |
| SCR-M01-07 | **Invite Teammate** | P0 | 2 | V1 | `F2-roles-and-permissions:invite-person` |
| SCR-M01-08 | **Invite Landing** | P0 | 1 | V1 | — |
| SCR-M01-09 | **First-Run Profile** | P0 | 1 | V1 | — |
| SCR-M01-10 | **Role Explainer** | P1 | 1 | V1 | — |
| SCR-M01-11 | **Profile & Preferences** | P0 | 3 | V1 | `F7-design-language:shell-app-settings`; `F6-notifications-and-search:notification-preferences` |
| SCR-M01-12 | **Team** | P0 | 3 | V1 | `F2-roles-and-permissions:team` |
| SCR-M01-13 | **Assign Roles** | P0 | 1 | V1 | — |
| SCR-M01-14 | **Roles Reference** | P0 | 1 | V1 | — |
| SCR-M01-15 | **Catalog Settings** | P0 | 7 | V1 | — |
| SCR-M01-16 | **Add Catalog Item** | P0 | 2 | V1 | — |
| SCR-M01-17 | **Catalog Import Wizard** | P0 | 1 | V1 | — |
| SCR-M01-18 | **Branding Settings** | P0 | 2 | V1 | `F7-design-language:shell-tenant-branding-settings` |
| SCR-M01-19 | **Proposal Template Settings** | P0 | 2 | V1 | — |
| SCR-M01-20 | **Payment Terms Settings** | P0 | 1 | V1 | — |
| SCR-M01-21 | **Message Template Settings** | P0 | 1 | V2 | — |
| SCR-M01-22 | **Capture Settings** | P0 | 4 | V2 | `M02-crm-and-leads:capture-settings` |
| SCR-M01-23 | **Locale Defaults** | P1 | 1 | V2 | — |
| SCR-M01-24 | **Integration Credentials** | P0 | 1 | V2 | — |

### M02 · CRM & leads

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-M02-01 | **Quick Add Lead** | P0 | 9 | V1 | — |
| SCR-M02-02 | **Lead Inbox** | P0 | 8 | V1 | — |
| SCR-M02-03 | **Leads List** | P0 | 3 | V1 | — |
| SCR-M02-04 | **Lead Detail** | P0 | 21 | V1 | `M06-proposals:shell-lead-detail`; `M09-field-workforce:shell-lead-detail`; `M03-marketing:shell-lead-consent-trail`; `M06-proposals:shell-customer-record` |
| SCR-M02-05 | **Lead Import Wizard** | P0 | 6 | V1 | — |
| SCR-M02-06 | **Customer Merge** | P0 | 3 | V1 | — |

### M03 · Marketing

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-M03-01 | **Campaign List (Campaigns Home)** | P0 | 4 | V2 | `02-personas:shell-campaigns-and-captures`; `M13-dashboards-and-reporting:campaigns-home` |
| SCR-M03-02 | **Campaign Builder — Audience** | P0 | 2 | V2 | — |
| SCR-M03-03 | **Campaign Builder — Content** | P0 | 3 | V2 | — |
| SCR-M03-04 | **Campaign Builder — Review & Schedule** | P0 | 4 | V2 | — |
| SCR-M03-05 | **Campaign Detail** | P0 | 4 | V2 | — |
| SCR-M03-06 | **Campaign Performance** | P0 | 7 | V2 | — |
| SCR-M03-07 | **Channel Connections** | P0 | 3 | V2 | — |
| SCR-M03-08 | **Channel Health** | P0 | 3 | V2 | — |
| SCR-M03-09 | **Campaign Templates** | P0 | 1 | V2 | — |
| SCR-M03-10 | **Website Enquiry Form** | P0 | 1 | V2 | — |

### M04 · Survey

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-M04-01 | **Survey Mode Chooser** | P0 | 1 | V2 | — |
| SCR-M04-02 | **Remote Survey — Address Entry** | P0 | 3 | V2 | — |
| SCR-M04-03 | **Remote Roof Review** | P0 | 4 | V2 | — |
| SCR-M04-04 | **Coverage Failure** | P0 | 1 | V2 | — |
| SCR-M04-05 | **Gaps to Fill** | P0 | 4 | V2 | — |
| SCR-M04-06 | **My Visits Today** | P0 | 5 | V2 | `02-personas:shell-todays-site-visits`; `M13-dashboards-and-reporting:todays-visits` |
| SCR-M04-07 | **Guided Capture** | P0 | 9 | V2 | — |
| SCR-M04-08 | **Shading Capture Sketch** | P0 | 1 | V2 | — |
| SCR-M04-09 | **Review & Submit** | P0 | 4 | V2 | — |
| SCR-M04-10 | **Survey Detail (Hand-off Brief)** | P0 | 5 | V2 | — |

### Customer link (F5)

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-F5-01 | **Customer Link — Proposal** | P0 | 25 | V1 | — |
| SCR-F5-02 | **Customer Link — Progress** | P0 | 16 | V1 | `M08-projects:shell-customer-progress-link`; `M11-payments-and-collections:shell-customer-receipts`; `M09-field-workforce:shell-customer-link` |
| SCR-F5-03 | **Customer Link — Handover Pack** | P0 | 9 | V1 | — |
| SCR-F5-04 | **Link Failure Page** | P0 | 2 | V1 | — |
| SCR-F5-05 | **Customer 3D View** | P0 | 2 | V1 | — |

### M06 · Proposals

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-M06-01 | **Proposal Entry** | P0 | 3 | V1 | — |
| SCR-M06-02 | **Proposal Builder** | P0 | 5 | V1 | — |
| SCR-M06-03 | **Builder Step 1 — Company** | P0 | 2 | V1 | — |
| SCR-M06-04 | **Builder Step 2 — Achievements** | P0 | 1 | V1 | — |
| SCR-M06-05 | **Builder Step 3 — Solar System Setup** | P0 | 4 | V1 | — |
| SCR-M06-06 | **Builder Step 4 — Performance Metrics** | P0 | 1 | V1 | — |
| SCR-M06-07 | **Builder Step 5 — Financial Data** | P0 | 1 | V1 | — |
| SCR-M06-08 | **Builder Step 6 — Project Timeline** | P0 | 1 | V1 | — |
| SCR-M06-09 | **Builder Step 7 — Payment Terms** | P0 | 1 | V1 | — |
| SCR-M06-10 | **Builder Step 8 — Components** | P0 | 5 | V1 | — |
| SCR-M06-11 | **Builder Step 9 — Terms & Conditions** | P0 | 1 | V1 | — |
| SCR-M06-12 | **Builder Step 10 — Client Details** | P0 | 1 | V1 | — |
| SCR-M06-13 | **Builder Step 11 — Bank Details** | P0 | 1 | V1 | — |
| SCR-M06-14 | **BOM Detail** | P0 | 1 | V1 | — |
| SCR-M06-15 | **Proposal Preview** | P0 | 1 | V1 | — |
| SCR-M06-16 | **Proposal Versions** | P0 | 1 | V1 | — |
| SCR-M06-17 | **Proposal Document** | P0 | 20 | V1 | — |
| SCR-M06-18 | **Proposal Detail** | P0 | 6 | V1 | — |
| SCR-M06-19 | **Proposal List** | P0 | 2 | V1 | — |
| SCR-M06-20 | **Deal Link Manager** | P0 | 1 | V1 | — |

### M07 · Sales execution

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-M07-01 | **My Day** | P0 | 7 | V1 | `02-personas:shell-my-day`; `M13-dashboards-and-reporting:my-day` |
| SCR-M07-02 | **Mark Won** | P0 | 1 | V1 | — |
| SCR-M07-03 | **Mark Lost** | P0 | 1 | V1 | — |
| SCR-M07-04 | **Reopen Lead** | P0 | 1 | V1 | — |
| SCR-M07-05 | **Agent Setup & Settings** | P0 | 7 | V2 | `M01-onboarding-and-tenant-config:shell-agent-voice-settings` |
| SCR-M07-06 | **Calling Window** | P0 | 1 | V2 | — |
| SCR-M07-07 | **Test Agent** | P0 | 1 | V2 | — |
| SCR-M07-08 | **Agent Config History** | P0 | 1 | V2 | — |
| SCR-M07-09 | **Knowledge Base** | P0 | 3 | V2 | — |
| SCR-M07-10 | **Unanswered Questions** | P0 | 3 | V2 | `M13-dashboards-and-reporting:agent-unanswered-questions` |
| SCR-M07-11 | **Corrections Review Queue** | P0 | 1 | V2 | — |
| SCR-M07-12 | **Agent Call Queue** | P0 | 5 | V2 | — |
| SCR-M07-13 | **Call Record Detail** | P0 | 2 | V2 | — |
| SCR-M07-14 | **Escalations** | P0 | 1 | V2 | — |
| SCR-M07-15 | **Routing Rules Editor** | P0 | 1 | V2 | — |
| SCR-M07-16 | **IVR Flow Editor** | P0 | 1 | V2 | — |
| SCR-M07-17 | **Number Provisioning Wizard** | P0 | 3 | V2 | — |
| SCR-M07-18 | **Agent Performance** | P0 | 8 | V2 | `M13-dashboards-and-reporting:agent-performance-dashboard`; `M13-dashboards-and-reporting:agent-per-rep-view` |
| SCR-M07-19 | **Call Log** | P0 | 2 | V2 | `M13-dashboards-and-reporting:agent-call-log` |
| SCR-M07-20 | **Agent Usage** | P0 | 2 | V2 | `M13-dashboards-and-reporting:agent-usage-report` |

### M08 · Projects

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-M08-01 | **Project Board** | P0 | 8 | V1 | `02-personas:shell-projects-board`; `M13-dashboards-and-reporting:projects-home`; `M08-projects:shell-portfolio-dashboard` |
| SCR-M08-02 | **Project Detail** | P0 | 7 | V1 | `M11-payments-and-collections:shell-project-money-block` |
| SCR-M08-03 | **Document Checklist** | P0 | 2 | V1 | — |
| SCR-M08-04 | **Installation Checklist** | P0 | 3 | V1 | `F2-roles-and-permissions:installation-checklist` |
| SCR-M08-05 | **Installer Job Home** | P0 | 3 | V1 | `02-personas:shell-todays-installation`; `M13-dashboards-and-reporting:todays-installation` |
| SCR-M08-06 | **Handover Flow** | P0 | 2 | V1 | — |

### M09 · Field workforce

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-M09-01 | **Tracking Settings** | P0 | 7 | V2 | — |
| SCR-M09-02 | **My Day (Route)** | P0 | 15 | V2 | `02-personas:shell-my-route-today`; `M13-dashboards-and-reporting:todays-route` |
| SCR-M09-03 | **Visit Stop Detail** | P0 | 2 | V2 | — |
| SCR-M09-04 | **Team Field Day** | P0 | 6 | V2 | — |
| SCR-M09-05 | **Activity Timeline** | P0 | 4 | V2 | — |
| SCR-M09-06 | **Day Playback** | P0 | 2 | V2 | — |
| SCR-M09-07 | **Site Geofence** | P0 | 2 | V2 | — |

### M10 · HR lite

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-M10-01 | **People Today Queue** | P0 | 10 | V2 | `02-personas:shell-people-today`; `M13-dashboards-and-reporting:people-today-home` |
| SCR-M10-02 | **People List** | P0 | 3 | V2 | — |
| SCR-M10-03 | **Employee Record** | P0 | 5 | V2 | — |
| SCR-M10-04 | **Offboard Sweep** | P0 | 4 | V2 | — |
| SCR-M10-05 | **Attendance Register** | P0 | 4 | V2 | — |
| SCR-M10-06 | **Leave Request** | P0 | 1 | V2 | — |
| SCR-M10-07 | **Team Structure** | P0 | 1 | V2 | — |

### M11 · Payments & collections

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-M11-01 | **Finance Home (Money Due)** | P0 | 3 | V1 | `02-personas:shell-money-due`; `M13-dashboards-and-reporting:money-due` |
| SCR-M11-02 | **Payments Ledger** | P0 | 15 | V1 | `M08-projects:shell-payments-screen` |
| SCR-M11-03 | **Record Payment** | P0 | 7 | V1 | — |
| SCR-M11-04 | **Collections Settings** | P0 | 2 | V1 | — |

### M13 · Dashboards & reporting

| SCR | Screen | Tier | Rows | V | Merged from |
|---|---|---|---|---|---|
| SCR-M13-01 | **Owner Dashboard** | P0 | 11 | V1 | — |
| SCR-M13-02 | **Pipeline Dashboard (Rep's own step-back)** | P0 | 1 | V2 | `02-personas:shell-pipeline-dashboard` |
| SCR-M13-03 | **Operations Home** | P0 | 4 | V2 | `02-personas:shell-blockers-by-party` |
| SCR-M13-04 | **Pipeline Funnel** | P0 | 3 | V2 | — |
| SCR-M13-05 | **Win/Loss Analytics** | P0 | 2 | V2 | — |

## 3. Row disposition — every requirement, where it lands

Column key: **Where** = screen ids for screen/mixed rows · `engine`/`policy`/`integration`
rows show their build nature · `context` rows show what realizes them. **Task** = the engineering
task id(s) in `docs/tasks/` that build the row.

**Struck rows.** A requirement struck in its PRD document is struck here too: the id in
`~~strikethrough~~`, Tier `—`, Type `**excluded**`, and Task `—`. A requirement whose whole
document is deleted leaves this register with it.

### docs/prd/01-product-overview.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| OV-01 | P0 | context | context → all modules M01-M13 (selling-engine spine) | realized-by: all modules M01–M13 (the selling-engine spine) |
| OV-02 | P0 | context | context → informative; global framing carried by F1 | realized-by: informative; global framing carried by `docs/prd/foundations/F1-global-market-framework.md` |
| OV-03 | P0 | context | context → the 3D Design Studio | realized-by: the 3D Design Studio, rebuilt from scratch — no PRD or task yet |
| OV-04 | P0 | policy | policy | LAW |
| OV-05 | P0 | context | context → informative | informative |
| OV-06 | P0 | policy | policy | LAW |
| OV-07 | P1 | policy | policy | LAW |
| OV-08 | P0 | policy | policy | LAW |
| OV-09 | P0 | policy | policy | LAW |
| OV-10 | P0 | context | context → M07, M06, F5, M13 | realized-by: `docs/prd/modules/M07-sales-execution.md`, `docs/prd/modules/M06-proposals.md`, `docs/prd/foundations/F5-customer-link.md`, `docs/prd/modules/M13-dashboards-and-reporting.md` |
| OV-11 | P0 | context | context → M13-dashboards-and-reporting | realized-by: `docs/prd/modules/M13-dashboards-and-reporting.md` |
| OV-12 | P0 | context | context → informative (design goal in every module) | realized-by: informative (a design goal in every module) |
| OV-13 | P1 | context | context → M07-sales-execution | realized-by: `docs/prd/modules/M07-sales-execution.md` |
| OV-14 | P1 | context | context → M09-field-workforce | realized-by: `docs/prd/modules/M09-field-workforce.md` |
| OV-15 | P0 | context | context → M06, F8 | realized-by: `docs/prd/modules/M06-proposals.md`, `docs/prd/foundations/F8-data-honesty.md` |
| OV-16 | P0 | context | context → F6 (one search), all modules | realized-by: `docs/prd/foundations/F6-notifications-and-search.md` (one search) and all modules |
| OV-17 | P0 | context | context → informative | informative |
| OV-18 | P1 | context | context → informative | informative |
| OV-19 | P0 | context | context → F1-global-market-framework | realized-by: `docs/prd/foundations/F1-global-market-framework.md` |
| OV-20 | P0 | context | context → informative | informative |
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
| ~~OV-39~~ | — | **excluded** | — | — |
| OV-40 | P0 | context | context → F3-localization, F7-design-language, F1 (grouping) | realized-by: `docs/prd/foundations/F3-localization.md`, `docs/prd/foundations/F7-design-language.md`, `docs/prd/foundations/F1-global-market-framework.md` (grouping) |
| OV-41 | P0 | context | context → M01-onboarding-and-tenant-config | realized-by: `docs/prd/modules/M01-onboarding-and-tenant-config.md` |
| OV-42 | P0 | context | context → informative | informative |
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
| PS-15 | P0 | context | context → F2 §Design Engineer | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Design Engineer |
| PS-16 | P0 | screen | the 3D Design Studio — screen not yet drawn | realized-by: the 3D Design Studio, rebuilt from scratch — no PRD or task yet |
| PS-17 | P0 | policy | policy | LAW |
| PS-18 | P0 | screen | the 3D Design Studio — screen not yet drawn | realized-by: the 3D Design Studio, rebuilt from scratch — no PRD or task yet |
| PS-19 | P0 | policy | policy | LAW |
| PS-20 | P0 | context | context → F2 §Project Manager; M08-projects | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Project Manager · `docs/prd/modules/M08-projects.md` |
| PS-21 | P0 | screen | SCR-M08-01 | T-M08-001 |
| PS-22 | P0 | context | context → F2 §Field Technician; M09-field-workforce | realized-by: `docs/prd/foundations/F2-roles-and-permissions.md` §Field Technician · `docs/prd/modules/M09-field-workforce.md` |
| PS-23 | P1 | screen | SCR-M09-02 | T-M09-002 |
| ~~PS-24~~ | — | **excluded** | — | — |
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

### docs/prd/foundations/F1-global-market-framework.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F1-01 | P0 | policy | policy | shipped |
| F1-02 | P0 | policy | policy | shipped |
| F1-03 | P0 | policy | policy | shipped |
| F1-04 | P0 | policy | policy | shipped |
| F1-05 | P0 | policy | policy | shipped |
| F1-06 | P0 | policy | policy | shipped |
| F1-07 | P0 | policy | policy | shipped |
| F1-08 | P0 | policy | policy | shipped |
| F1-09 | P0 | policy | policy | shipped |
| F1-10 | P0 | policy | policy | shipped |
| F1-11 | P0 | policy | policy | shipped |
| F1-12 | P0 | policy | policy | shipped |
| F1-13 | P0 | policy | policy | shipped |
| F1-14 | P0 | policy | policy | shipped |
| F1-15 | P0 | policy | policy | shipped |
| F1-16 | P0 | policy | policy | shipped |
| F1-17 | P0 | policy | policy | shipped |
| F1-18 | P0 | policy | policy | shipped |
| F1-19 | P0 | policy | policy | shipped |
| F1-20 | P1 | policy | policy | shipped |
| F1-21 | P0 | policy | policy | shipped |
| F1-22 | P0 | policy | policy | shipped |
| F1-23 | P0 | policy | policy | T-FCORE-009 |
| F1-24 | P0 | policy | policy | T-FCORE-009 |
| F1-25 | P0 | policy | policy | shipped |
| F1-26 | P0 | policy | policy | shipped |
| F1-27 | P0 | policy | policy | shipped |
| F1-28 | P0 | policy | policy | shipped |
| F1-29 | P0 | policy | policy | shipped |
| F1-30 | P1 | policy | policy | shipped |
| F1-31 | P0 | policy | policy | shipped |
| F1-32 | P0 | policy | policy | T-FCORE-009 |
| F1-33 | P0 | engine | engine | shipped |
| F1-34 | P0 | policy | policy | shipped |
| F1-35 | P0 | policy | policy | shipped |
| F1-36 | P0 | policy | policy | shipped |
| F1-37 | P0 | integration | integration | shipped |
| F1-38 | P0 | integration | integration | shipped |
| F1-62 | P0 | policy | policy | shipped |
| F1-39 | P0 | policy | policy | shipped |
| F1-40 | P0 | integration | integration | shipped |
| F1-41 | P0 | policy | policy | shipped |
| F1-42 | P0 | policy | policy | shipped |
| F1-43 | P0 | integration | integration | shipped |
| F1-44 | P0 | policy | policy | shipped |
| F1-45 | P1 | policy | policy | shipped |
| F1-46 | P0 | policy | policy | shipped |
| F1-47 | P0 | policy | policy | shipped |
| F1-48 | P0 | policy | policy | shipped |
| F1-49 | P0 | policy | policy | shipped |
| F1-50 | P1 | policy | policy | shipped |
| F1-51 | P0 | policy | policy | shipped |
| F1-52 | P0 | policy | policy | shipped |
| F1-53 | P0 | policy | policy | shipped |
| F1-54 | P0 | policy | policy | T-FCORE-009 |
| F1-55 | P0 | policy | policy | T-FCORE-009 |
| F1-56 | P0 | policy | policy | T-FCORE-009 |
| F1-57 | P0 | policy | policy | T-FCORE-009 |
| F1-58 | P0 | policy | policy | T-FCORE-009 |
| F1-59 | P0 | mixed | SCR-SHELL-01 · +non-UI: breach-notification duty to Data Protection Board and affected… | `T-FCORE-009`, shipped |
| F1-60 | P0 | policy | policy | shipped |
| F1-61 | P0 | policy | policy | shipped |

### docs/prd/foundations/F2-roles-and-permissions.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F2-01 | P0 | policy | policy | shipped |
| F2-02 | P0 | policy | policy | shipped |
| F2-03 | P0 | policy | policy | shipped |
| F2-04 | P0 | policy | policy | LAW |
| F2-05 | P0 | policy | policy | shipped |
| F2-06 | P0 | policy | policy | LAW |
| F2-07 | P1 | mixed | SCR-M08-04 · +non-UI: ticks attributed to the coordinator; fallback survives even when crew  | LAW |
| F2-08 | P0 | policy | policy | shipped |
| F2-09 | P0 | policy | policy | shipped |
| F2-10 | P0 | mixed | SCR-M01-12 · +non-UI: stacking law: one person holds several presets, composed by OR | shipped |
| F2-11 | P0 | policy | policy | shipped |
| F2-12 | P0 | policy | policy | shipped |
| F2-13 | P0 | policy | policy | shipped |
| F2-14 | P0 | policy | policy | shipped |
| F2-15 | P0 | policy | policy | shipped |
| F2-16 | P0 | policy | policy | shipped |
| F2-17 | P1 | policy | policy | shipped |
| F2-18 | P0 | policy | policy | shipped |
| F2-19 | P0 | mixed | SCR-M01-12 · +non-UI: guarded transition enforced beyond UI; blocked attempts audit-logged | shipped |
| F2-20 | P0 | policy | policy | shipped |
| F2-21 | P1 | mixed | SCR-M01-07 · +non-UI: guarded at the transition; no surface can bypass it | shipped |
| F2-22 | P0 | policy | policy | shipped |
| F2-23 | P1 | policy | policy | shipped |
| F2-24 | P0 | policy | policy | shipped |
| F2-25 | P0 | policy | policy | shipped |
| F2-26 | P0 | policy | policy | shipped |

### docs/prd/foundations/F3-localization.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F3-01 | P0 | policy | policy | shipped |
| F3-02 | P0 | policy | policy | shipped |
| F3-03 | P0 | screen | SCR-M01-03, SCR-M01-11 | shipped |
| F3-04 | P0 | policy | policy | shipped |
| F3-05 | P0 | engine | engine | shipped |
| F3-06 | P0 | policy | policy | shipped |
| F3-07 | P0 | policy | policy | shipped |
| F3-08 | P0 | policy | policy | shipped |
| F3-09 | P0 | policy | policy | shipped |
| F3-10 | P0 | policy | policy | shipped |
| F3-11 | P0 | policy | policy | shipped |
| F3-12 | P0 | policy | policy | shipped |
| F3-13 | P0 | policy | policy | shipped |
| F3-14 | P0 | policy | policy | shipped |
| F3-15 | P0 | engine | engine | shipped |
| F3-16 | P0 | policy | policy | LAW |
| F3-17 | P0 | policy | policy | shipped |
| F3-18 | P0 | policy | policy | LAW |
| F3-19 | P0 | engine | engine | shipped |
| F3-20 | P0 | engine | engine | shipped |
| F3-21 | P0 | policy | policy | shipped |
| F3-22 | P0 | engine | engine | shipped |
| F3-23 | P1 | mixed | SCR-M01-11 · +non-UI: procurement, BOM and supplier quantities stay metric regardless of… | shipped |
| F3-24 | P0 | policy | policy | shipped |
| F3-25 | P0 | policy | policy | LAW |
| F3-26 | P0 | policy | policy | shipped |
| F3-27 | P0 | policy | policy | shipped |
| F3-28 | P1 | policy | policy | shipped |
| F3-29 | P0 | policy | policy | LAW |

### docs/prd/foundations/F4-data-integrity.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| ~~F4-01~~ | — | **excluded** | — | — |
| ~~F4-02~~ | — | **excluded** | — | — |
| ~~F4-03~~ | — | **excluded** | — | — |
| F4-04 | P0 | policy | policy | shipped |
| ~~F4-05~~ | — | **excluded** | — | — |
| ~~F4-06~~ | — | **excluded** | — | — |
| F4-07 | P0 | policy | policy | shipped |
| ~~F4-08~~ | — | **excluded** | — | — |
| ~~F4-09~~ | — | **excluded** | — | — |
| ~~F4-10~~ | — | **excluded** | — | — |
| ~~F4-11~~ | — | **excluded** | — | — |
| ~~F4-12~~ | — | **excluded** | — | — |
| ~~F4-13~~ | — | **excluded** | — | — |
| F4-14 | P0 | policy | policy | T-M04-015 |
| F4-15 | P0 | policy | policy | realized-by: the 3D Design Studio, rebuilt from scratch — no PRD or task yet |
| F4-16 | P0 | policy | policy | `T-M02-012`, shipped |
| F4-17 | P0 | policy | policy | T-M04-015 |
| ~~F4-18~~ | — | **excluded** | — | — |
| F4-19 | P0 | policy | policy | `T-M02-012`, shipped |
| ~~F4-20~~ | — | **excluded** | — | — |
| F4-21 | P0 | mixed | SCR-M04-07 · +non-UI: validation-failure preservation; photo hold-and-upload | `T-M04-017` |
| ~~F4-22~~ | — | **excluded** | — | — |
| ~~F4-23~~ | — | **excluded** | — | — |
| ~~F4-24~~ | — | **excluded** | — | — |
| F4-25 | P0 | policy | policy | T-M04-015 |
| ~~F4-26~~ | — | **excluded** | — | — |
| F4-27 | P0 | policy | policy | LAW (`docs/tasks/F-platform.md`) |
| ~~F4-28~~ | — | **excluded** | — | — |
| ~~F4-29~~ | — | **excluded** | — | — |
| ~~F4-30~~ | — | **excluded** | — | — |
| ~~F4-31~~ | — | **excluded** | — | — |
| ~~F4-32~~ | — | **excluded** | — | — |
| ~~F4-33~~ | — | **excluded** | — | — |
| ~~F4-34~~ | — | **excluded** | — | — |
| ~~F4-35~~ | — | **excluded** | — | — |
| F4-36 | P0 | mixed | SCR-SHELL-01 · +non-UI: server-declared minimum client version… | shipped |
| F4-37 | P0 | mixed | SCR-M01-01 · +non-UI: held work discarded on user switch, after warning… | shipped |

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
| F5-30 | P0 | mixed | SCR-M06-20 · +non-UI: customer page never shows other contacts' links, labels or open… | T-M06-020 |
| F5-31 | P0 | policy | policy | T-F5-007 |
| F5-32 | P0 | screen | SCR-F5-01 | T-F5-001 |
| F5-33 | P0 | screen | SCR-F5-01 | T-F5-011 |
| F5-34 | P0 | policy | policy | T-F5-011 |
| F5-35 | P0 | screen | SCR-F5-01 | T-F5-011 |
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
| F6-01 | P0 | policy | policy | shipped |
| F6-02 | P0 | policy | policy | shipped |
| F6-03 | P0 | policy | policy | LAW |
| F6-04 | P0 | policy | policy | LAW |
| F6-05 | P0 | policy | policy | shipped |
| F6-06 | P0 | policy | policy | shipped |
| F6-07 | P0 | policy | policy | shipped |
| F6-08 | P0 | policy | policy | shipped |
| F6-09 | P0 | policy | policy | shipped |
| F6-10 | P0 | policy | policy | `T-FPLAT-066`, shipped |
| F6-11 | P0 | policy | policy | shipped |
| F6-12 | P1 | screen | SCR-SHELL-03 | shipped |
| F6-13 | P0 | policy | policy | shipped |
| F6-14 | P1 | policy | policy | shipped |
| F6-15 | P2 | mixed | SCR-M01-11 · +non-UI: in-app record always lands; owner billing/compliance push never… | shipped |
| F6-16 | P0 | policy | policy | `T-FPLAT-066`, shipped |
| F6-17 | P0 | screen | SCR-SHELL-03 | shipped |
| ~~F6-18~~ | — | **excluded** | — | — |
| F6-19 | P2 | mixed | SCR-SHELL-03 · +non-UI: bounded retention horizon; underlying facts persist on record… | shipped |
| F6-20 | P0 | screen | SCR-SHELL-02 | `T-SHELL-002`, shipped |
| F6-21 | P0 | policy | policy | `T-FPLAT-020`, shipped |
| F6-22 | P0 | engine | engine | `T-FPLAT-020`, shipped |
| F6-23 | P0 | mixed | SCR-SHELL-02 · +non-UI: junk leads leave every queue and list but are never deleted | `T-FPLAT-020`, `T-SHELL-002`, shipped |
| F6-24 | P0 | policy | policy | `T-FPLAT-020`, shipped |
| F6-25 | P1 | policy | policy | `T-FPLAT-020`, shipped |
| F6-26 | P0 | policy | policy | shipped |
| F6-27 | P0 | policy | policy | shipped |

### docs/prd/foundations/F7-design-language.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F7-01 | P0 | policy | policy | LAW |
| F7-02 | P0 | policy | policy | LAW |
| F7-03 | P0 | policy | policy | shipped |
| F7-04 | P0 | policy | policy | LAW |
| F7-05 | P0 | policy | policy | LAW |
| F7-06 | P0 | policy | policy | LAW |
| F7-07 | P0 | mixed | SCR-M01-18 · +non-UI: contrast re-verification engine derives compliant shades; operator… | shipped |
| F7-08 | P0 | policy | policy | LAW |
| F7-09 | P0 | policy | policy | LAW |
| F7-10 | P0 | policy | policy | LAW |
| F7-11 | P0 | policy | policy | LAW |
| F7-12 | P0 | policy | policy | LAW |
| F7-13 | P0 | policy | policy | LAW |
| F7-14 | P0 | policy | policy | LAW |
| F7-15 | P0 | policy | policy | LAW |
| ~~F7-16~~ | — | **excluded** | — | — |
| F7-17 | P0 | policy | policy | LAW |
| F7-18 | P0 | policy | policy | LAW |
| F7-19 | P0 | policy | policy | LAW |
| F7-20 | P1 | policy | policy | LAW |
| F7-21 | P0 | policy | policy | LAW |
| F7-22 | P0 | mixed | SCR-SHELL-01 · +non-UI: centre-verb resolution reads role presets (F2-01); composition rule… | shipped |
| F7-23 | P0 | policy | policy | LAW |
| F7-24 | P0 | policy | policy | LAW |
| F7-25 | P0 | policy | policy | LAW |
| F7-26 | P0 | policy | policy | shipped |
| F7-27 | P0 | policy | policy | LAW |
| F7-28 | P0 | policy | policy | LAW |
| F7-29 | P0 | policy | policy | LAW |
| F7-30 | P0 | policy | policy | LAW |
| F7-31 | P0 | policy | policy | LAW |
| F7-32 | P0 | policy | policy | LAW |
| F7-33 | P0 | policy | policy | LAW |
| F7-34 | P0 | policy | policy | LAW |
| F7-35 | P0 | policy | policy | LAW |
| ~~F7-36~~ | — | **excluded** | — | — |
| F7-37 | P0 | policy | policy | LAW |
| F7-38 | P0 | policy | policy | LAW |
| F7-39 | P0 | policy | policy | LAW |
| F7-40 | P0 | policy | policy | LAW |
| F7-41 | P0 | policy | policy | LAW |
| F7-42 | P0 | policy | policy | LAW |
| F7-43 | P0 | policy | policy | LAW |
| F7-44 | P0 | policy | policy | LAW |
| F7-45 | P0 | policy | policy | LAW |
| F7-46 | P0 | engine | engine | shipped |
| F7-47 | P0 | policy | policy | LAW |
| F7-48 | P0 | policy | policy | LAW |
| F7-49 | P0 | engine | engine | shipped |
| F7-50 | P0 | engine | engine | shipped |
| F7-51 | P0 | policy | policy | LAW |

### docs/prd/foundations/F8-data-honesty.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| F8-01 | P0 | policy | policy | shipped |
| F8-02 | P0 | policy | policy | shipped |
| F8-03 | P0 | policy | policy | shipped |
| F8-04 | P0 | engine | engine | shipped |
| F8-05 | P0 | policy | policy | shipped |
| F8-06 | P0 | policy | policy | shipped |
| F8-07 | P0 | policy | policy | shipped |
| F8-08 | P0 | policy | policy | shipped |
| F8-09 | P0 | policy | policy | shipped |
| F8-10 | P0 | policy | policy | shipped |
| F8-11 | P0 | policy | policy | shipped |
| F8-12 | P0 | policy | policy | shipped |
| F8-13 | P0 | engine | engine | shipped |
| F8-14 | P0 | policy | policy | shipped |
| F8-15 | P0 | policy | policy | shipped |
| ~~F8-16~~ | — | **excluded** | — | — |
| F8-17 | P0 | policy | policy | shipped |
| F8-18 | P0 | policy | policy | shipped |
| F8-19 | P0 | policy | policy | shipped |
| F8-20 | P0 | policy | policy | shipped |
| F8-21 | P0 | policy | policy | shipped |
| F8-22 | P0 | policy | policy | shipped |
| F8-23 | P0 | policy | policy | shipped |
| F8-24 | P0 | policy | policy | shipped |
| F8-25 | P0 | policy | policy | shipped |
| F8-26 | P0 | policy | policy | shipped |
| F8-27 | P0 | policy | policy | shipped |
| F8-28 | P0 | policy | policy | shipped |
| F8-29 | P0 | policy | policy | shipped |
| F8-30 | P0 | policy | policy | shipped |
| F8-31 | P0 | policy | policy | shipped |
| F8-32 | P0 | policy | policy | shipped |
| F8-33 | P0 | policy | policy | shipped |
| F8-34 | P0 | policy | policy | shipped |
| F8-35 | P0 | policy | policy | shipped |
| F8-36 | P0 | policy | policy | shipped |

### docs/prd/modules/M01-onboarding-and-tenant-config.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M01-01 | P0 | screen | SCR-M01-02 | shipped |
| M01-02 | P0 | mixed | SCR-M01-01 · +non-UI: Google identity links onto same phone-identity account at first… | shipped |
| M01-03 | P0 | mixed | SCR-M01-01 · +non-UI: layered OTP delivery rail: SMS primary, auto fallback channel on… | shipped |
| M01-04 | P0 | mixed | SCR-M01-01 · +non-UI: rate limits: 3/15min and 8/day per phone, resend cooldown, 5-fail… | shipped |
| M01-05 | P0 | policy | policy | shipped |
| M01-06 | P1 | policy | policy | shipped |
| M01-07 | P0 | policy | policy | shipped |
| M01-08 | P0 | mixed | SCR-M01-02 · +non-UI: one account per phone number globally; no duplicate company | shipped |
| M01-09 | P1 | screen | SCR-M01-02 | shipped |
| M01-10 | P0 | policy | policy | shipped |
| M01-11 | P0 | policy | policy | LAW |
| M01-12 | P0 | screen | SCR-M01-07 | shipped |
| M01-13 | P0 | mixed | SCR-M01-08 · +non-UI: OTP verification atomically creates user plus tenant membership plus… | shipped |
| M01-14 | P0 | screen | SCR-M01-09 | shipped |
| M01-15 | P1 | screen | SCR-M01-10 | shipped |
| M01-16 | P1 | screen | SCR-SHELL-01 | shipped |
| M01-17 | P0 | mixed | SCR-SHELL-01 · +non-UI: handoff law: onboarding ends on the role-decided home with real… | shipped |
| M01-18 | P0 | policy | policy | shipped |
| M01-19 | P0 | screen | SCR-M01-12 | shipped |
| M01-20 | P0 | screen | SCR-M01-13 | shipped |
| M01-21 | P0 | screen | SCR-M01-14 | shipped |
| M01-22 | P0 | policy | policy | LAW |
| M01-23 | P0 | screen | SCR-M01-04 | shipped |
| M01-24 | P0 | screen | SCR-M01-05 | shipped |
| M01-25 | P0 | screen | SCR-M01-05 | shipped |
| M01-26 | P0 | screen | SCR-M01-06 | shipped |
| M01-27 | P0 | policy | policy | T-M01-029 |
| M01-28 | P0 | policy | policy | shipped |
| M01-29 | P0 | policy | policy | LAW |
| M01-30 | P1 | policy | policy | LAW |
| M01-31 | P0 | mixed | SCR-M01-05 · +non-UI: single write-point for identity facts; proposal, agent, link, invoice  | shipped |
| M01-32 | P0 | mixed | SCR-M01-15 · +non-UI: resolution order: tenant override, then own item, then platform item | shipped |
| M01-33 | P0 | policy | policy | shipped |
| M01-34 | P0 | mixed | SCR-M01-15 · +non-UI: typed per-kind specs; certifications scheme-keyed from pack… | shipped |
| M01-35 | P0 | mixed | SCR-M01-15 · +non-UI: three-value provenance enum: verified-datasheet, tenant-provided… | shipped |
| M01-36 | P0 | mixed | SCR-M01-16 · +non-UI: tenant SKU is full item, private to tenant, no platform approval | shipped |
| M01-37 | P0 | mixed | SCR-M01-15 · +non-UI: sparse override: unset fields fall through; one override per platform  | shipped |
| M01-38 | P0 | mixed | SCR-M01-15 · +non-UI: one search over both tiers, preferred-first ranking, shared with the… | shipped |
| M01-39 | P0 | screen | SCR-M01-16 | shipped |
| ~~M01-40~~ | — | **excluded** | — | — |
| M01-41 | P0 | mixed | SCR-M01-17 · +non-UI: smart matching engine: platform matches become price overrides… | shipped |
| M01-42 | P0 | policy | policy | shipped |
| M01-43 | P0 | mixed | SCR-M01-15 · +non-UI: append-only labelled releases; designs and proposals pin release… | shipped |
| M01-44 | P0 | policy | policy | shipped |
| M01-45 | P1 | policy | policy | shipped |
| M01-46 | P0 | policy | policy | LAW |
| ~~M01-47~~ | — | **excluded** | — | — |
| M01-48 | P0 | mixed | SCR-M01-15 · +non-UI: immutable price-book versions, exactly one active, default margin… | shipped |
| M01-49 | P0 | policy | policy | LAW |
| M01-50 | P0 | mixed | SCR-M01-18 · +non-UI: computational contrast re-verify on palette save; compliant shades… | shipped |
| M01-51 | P0 | screen | SCR-M01-19 | shipped |
| M01-52 | P1 | screen | SCR-M01-19 | shipped |
| M01-53 | P0 | policy | policy | shipped |
| M01-54 | P0 | mixed | SCR-M01-20 · +non-UI: percentages must sum exactly 100.00; two seeded standard templates… | shipped |
| M01-55 | P0 | mixed | SCR-M01-21 · +non-UI: per-language tenant content class; sends via connected transactional… | T-M01-021 |
| M01-56 | P0 | policy | policy | LAW |
| M01-57 | P0 | screen | SCR-M07-05 | voice — postponed |
| M01-58 | P0 | screen | SCR-M01-22 | T-M01-022 |
| M01-59 | P1 | mixed | SCR-M01-23 · +non-UI: holiday additions only narrow calling availability; per-user UI… | T-M01-023 |
| M01-60 | P0 | mixed | SCR-M01-24 · +non-UI: write-only credential storage, scheduled probes, every decrypt… | T-M01-024 |
| M01-61 | P1 | mixed | SCR-M01-01 · +non-UI: the route a signed-out person opened is kept through sign-in | shipped |

### docs/prd/modules/M02-crm-and-leads.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M02-01 | P0 | screen | SCR-M02-01 | `T-M02-001`, shipped |
| M02-02 | P0 | policy | policy | `T-M02-007`, shipped |
| M02-03 | P0 | mixed | SCR-M02-01, SCR-M02-04 · +non-UI: nothing rejected for incompleteness, nothing invented to fill gaps | `T-M02-001`, shipped |
| ~~M02-04~~ | — | **excluded** | — | — |
| M02-05 | P0 | mixed | SCR-M02-01 · +non-UI: segment rides the lead to its proposal, never re-asked | `T-M02-001`, shipped |
| M02-06 | P0 | screen | SCR-M02-01, SCR-SHELL-01 | `T-M02-001`, shipped |
| M02-07 | P0 | policy | policy | `T-M02-008`, shipped |
| M02-08 | P0 | screen | SCR-M02-01, SCR-M02-05, SCR-M02-04 | `T-M02-008`, shipped |
| M02-09 | P0 | mixed | SCR-M02-01, SCR-M02-04 · +non-UI: exactly three choices, no silent default; dismissing creates nothing | `T-M02-008`, shipped |
| M02-10 | P0 | policy | policy | `T-M02-008`, shipped |
| M02-11 | P0 | mixed | SCR-M02-01, SCR-M02-05 · +non-UI: appends enquiry activity, notifies owner, changes no stage or owner | `T-M02-008`, shipped |
| M02-12 | P0 | mixed | SCR-M02-01 · +non-UI: mandatory reason audited on both timelines; records cross-linked for… | `T-M02-008`, shipped |
| M02-13 | P0 | mixed | SCR-M02-02, SCR-M02-03 · +non-UI: closed v1 source enum; source set by path, immutable | `T-M02-009`, shipped |
| M02-14 | P0 | policy | policy | voice — postponed |
| M02-15 | P0 | policy | policy | `T-M02-010`, shipped |
| M02-16 | P0 | mixed | SCR-M02-04 · +non-UI: bidirectional referral link; credits ledger spec-locked out of v1 | `T-M02-009`, shipped |
| M02-17 | P0 | mixed | SCR-M01-22 · +non-UI: D13 deferral; M03 supersedes as brief scope, feeds this inbox | T-M01-022 |
| M02-18 | P0 | screen | SCR-M02-05 | `T-M02-005`, shipped |
| M02-19 | P0 | screen | SCR-M02-05 | `T-M02-005`, shipped |
| M02-20 | P0 | mixed | SCR-M02-05 · +non-UI: skip is default; log as enquiry the other; import never creates a duplicate | `T-M02-005`, shipped |
| M02-21 | P0 | mixed | SCR-M02-05 · +non-UI: async background job; landed rows never rolled back on partial… | `T-M02-005`, shipped |
| ~~M02-22~~ | — | **excluded** | — | — |
| M02-23 | P0 | screen | SCR-M02-02 | `T-M02-002`, shipped |
| M02-24 | P0 | screen | SCR-M02-02 | `T-M02-002`, shipped |
| M02-25 | P1 | screen | SCR-M02-02 | `T-M02-002`, shipped |
| ~~M02-26~~ | — | **excluded** | — | — |
| M02-27 | P0 | policy | policy | LAW |
| M02-28 | P0 | screen | SCR-M02-02, SCR-M02-04 | `T-M02-002`, shipped |
| M02-29 | P0 | screen | SCR-M02-02, SCR-M02-04 | `T-M02-002`, shipped |
| M02-30 | P0 | policy | policy | `T-M02-011`, shipped |
| M02-31 | P0 | policy | policy | `T-M02-011`, shipped |
| M02-32 | P0 | screen | SCR-M02-04 | `T-M02-004`, shipped |
| M02-33 | P0 | mixed | SCR-M02-04 · +non-UI: connected WhatsApp/SMS transactional send with honest delivery… | `T-M02-013`, shipped |
| M02-34 | P0 | mixed | SCR-M02-04 · +non-UI: contact numbers participate in dedupe; exactly one primary… | `T-M02-004`, shipped |
| M02-35 | P0 | mixed | SCR-M02-04 · +non-UI: append-only law; every module writes; nothing edits or deletes | `T-M02-012`, shipped |
| M02-36 | P0 | policy | policy | `T-M02-012`, shipped |
| M02-37 | P0 | mixed | SCR-M02-04 · +non-UI: M07 gate reads one row per dial; stop-calling irreversible; M03… | `T-M02-007`, shipped |
| M02-38 | P1 | policy | policy | LAW |
| M02-39 | P0 | screen | SCR-M02-04 | `T-M02-004`, shipped |
| M02-40 | P0 | screen | SCR-M02-03 | `T-M02-003`, shipped |
| M02-41 | P0 | policy | policy | `T-M02-015`, shipped |
| M02-42 | P0 | mixed | SCR-M02-04 · +non-UI: closed six-reason vocabulary, mandatory; feeds win/loss analytics | `T-M02-004`, shipped |
| M02-43 | P0 | policy | policy | `T-M02-010`, shipped |
| M02-44 | P0 | policy | policy | `T-M02-010`, shipped |
| M02-45 | P1 | context | context → ['M02-42', 'M02-34'] | realized-by: M02-42, M02-34 |
| M02-46 | P0 | mixed | SCR-M02-04 · +non-UI: creates the visit object M04 owns from that moment | `T-M02-014`, shipped |
| M02-47 | P0 | mixed | SCR-M02-04 · +non-UI: transactional-channel auto-send with honest delivery; copy-paste… | `T-M02-013`, shipped |
| M02-48 | P1 | mixed | SCR-M02-04 · +non-UI: exactly one reminder per visit; no surface may generate a second | `T-M02-013`, shipped |
| M02-49 | P0 | policy | policy | `T-M02-015`, shipped |
| M02-50 | P0 | mixed | SCR-M02-02 · +non-UI: 24h-unassigned timer escalates to owner via notification; state… | `T-M02-015`, shipped |
| M02-51 | P0 | mixed | SCR-M02-04 · +non-UI: hidden from My Day; 09:00 wake creates follow-up task | `T-M02-015`, shipped |
| M02-52 | P0 | mixed | SCR-M02-03 · +non-UI: nightly sweep flags after thirty inactive days; any activity… | `T-M02-015`, shipped |
| M02-53 | P0 | policy | policy | `T-M02-015`, shipped |
| M02-54 | P0 | policy | policy | `T-M02-015`, shipped |
| M02-55 | P0 | policy | policy | `T-M02-015`, shipped |
| M02-56 | P0 | policy | policy | `T-M02-015`, shipped |
| M02-57 | P0 | policy | policy | `T-M02-015`, shipped |
| M02-58 | P0 | policy | policy | `T-M02-015`, shipped |
| M02-59 | P0 | screen | SCR-M02-06 | `T-M02-006`, shipped |
| M02-60 | P0 | mixed | SCR-M02-06 · +non-UI: re-points every reference to survivor; loser becomes tombstone, never  | `T-M02-016`, shipped |
| M02-61 | P0 | policy | policy | `T-M02-016`, shipped |
| M02-62 | P0 | policy | policy | `T-M02-016`, shipped |
| M02-63 | P0 | mixed | SCR-M02-06 · +non-UI: both records must be in actor's visibility scope; the merge completes on the server; no undo | `T-M02-006`, shipped |
| M02-64 | P0 | mixed | SCR-M01-22 · +non-UI: toggle governs new capture only; existing leads untouched; manual… | T-M01-022 |
| M02-65 | P0 | screen | SCR-M01-22 | T-M01-022 |
| M02-66 | P0 | mixed | SCR-M02-01 · +non-UI: the server takes same-number saves one at a time; the second meets the sheet; nothing ever merged automatically | `T-M02-008`, shipped |
| M02-67 | P0 | mixed | SCR-M02-02 · +non-UI: assign and mark-junk are server-completed; failure returns the lead to the queue naming the reason | `T-M02-002`, shipped |

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
| M03-16 | P2 | context | context → its own REC row, not v1 scope | realized-by: REC row — its one home (`OV-43`), not v1 scope |
| M03-17 | P2 | context | context → its own REC row, not v1 scope | realized-by: REC row — its one home (`OV-43`), not v1 scope |
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
| M03-37 | P2 | context | context → its own REC row; modules/M07 would own implementation | realized-by: REC row — its one home (`OV-43`); modules/M07 would own implementation |
| M03-38 | P0 | mixed | SCR-M03-03 · +non-UI: never machine-translated or auto-substituted; missing-language gap… | T-M03-003 |
| M03-39 | P0 | mixed | SCR-M03-09 · +non-UI: only approved template schedulable; third-party approval clock gates… | T-M03-009 |
| M03-40 | P0 | policy | policy | T-M03-009 |
| M03-41 | P0 | mixed | SCR-M03-03 · +non-UI: send-time token resolution: fallback or exclude recipient, never… | T-M03-003 |
| M03-42 | P1 | policy | policy | LAW |
| M03-43 | P2 | context | context → its own REC row; the tiered AI-disclosure law `F1-36`(d) an input | realized-by: REC row — its one home (`OV-43`); `F1-36`(d) an input |
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
| M04-02 | P0 | mixed | SCR-M04-02, SCR-M04-03 · +non-UI: imagery fetch; the roof outlined by hand; every figure stamped derived | T-M04-011 |
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
| ~~M04-14~~ | — | **excluded** | — | — |
| ~~M04-15~~ | — | **excluded** | — | — |
| ~~M04-16~~ | — | **excluded** | — | — |
| ~~M04-17~~ | — | **excluded** | — | — |
| ~~M04-18~~ | — | **excluded** | — | — |
| ~~M04-19~~ | — | **excluded** | — | — |
| ~~M04-20~~ | — | **excluded** | — | — |
| ~~M04-21~~ | — | **excluded** | — | — |
| M04-22 | P0 | mixed | SCR-M04-03 · +non-UI: manual path never metered, always sufficient | T-M04-003 |
| ~~M04-23~~ | — | **excluded** | — | — |
| ~~M04-24~~ | — | **excluded** | — | — |
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
| ~~M04-39~~ | — | **excluded** | — | — |
| ~~M04-40~~ | — | **excluded** | — | — |
| ~~M04-41~~ | — | **excluded** | — | — |
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
| ~~M04-65~~ | — | **excluded** | — | — |
| M04-66 | P0 | policy | policy | LAW |

### docs/prd/modules/M06-proposals.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M06-01 | P0 | policy | policy | LAW |
| M06-02 | P0 | policy | policy | T-M06-001 |
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
| M06-23 | P0 | mixed | SCR-M06-02 · +non-UI: one-pass gate: components, battery validity, payable floor, tranches,  | T-M06-022 |
| M06-24 | P0 | screen | SCR-M06-02 | T-M06-002 |
| M06-25 | P0 | mixed | SCR-M02-04 · +non-UI: every field commits on blur; a draft exists from the first commit and is resumable from the lead | T-M06-023 |
| M06-26 | P0 | policy | policy | T-M06-028 |
| M06-27 | P0 | mixed | SCR-M06-10 · +non-UI: D22: all categories mandatory before Generate — the counter is the… | T-M06-010 |
| M06-28 | P0 | mixed | SCR-M06-10 · +non-UI: one picker, built here and reused by the studio; cable, electrical, structure from saved parts… | T-M06-010 |
| M06-29 | P0 | screen | SCR-M06-10 | T-M06-010 |
| M06-30 | P0 | mixed | SCR-M06-05, SCR-M06-10 · +non-UI: OFFGRID/HYBRID without battery: notice at step 3, hard block only at… | T-M06-005 |
| M06-31 | P0 | policy | policy | T-M06-026 |
| M06-32 | P0 | policy | policy | LAW |
| M06-33 | P2 | context | context → its own REC row (future battery-economics layer riding F8-23 honesty laws) | realized-by: REC row — its one home (`OV-43`); design spec §10 |
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
| M06-46 | P0 | mixed | SCR-M06-19, SCR-M06-18 · +non-UI: staleness derived by comparing pinned fingerprint/input versions… | T-M06-021 |
| M06-47 | P0 | mixed | SCR-M06-18 · +non-UI: tier change shown before commit (F8-05); accept creates Path A… | T-M06-021 |
| M06-48 | P0 | mixed | SCR-M06-19, SCR-M06-18 · +non-UI: duplicate copies all steps and components; never copies number… | T-M06-019 |
| M06-49 | P0 | policy | policy | T-M06-027 |
| M06-50 | P0 | screen | SCR-M06-15 | T-M06-015 |
| M06-51 | P0 | mixed | SCR-M06-17 · +non-UI: one computed value set feeds document, link, exports; render… | T-M06-017 |
| M06-52 | P0 | policy | policy | T-M06-029 |
| M06-53 | P0 | mixed | SCR-M06-18 · +non-UI: auto-send via the tenant's connected transactional channel (owner ruling 2026-08-04)… | T-M06-018 |
| M06-54 | P0 | mixed | SCR-M06-18 · +non-UI: delivery states only as connected channel reports; fallback never… | T-M06-018 |
| M06-55 | P0 | policy | policy | T-M06-030 |
| M06-56 | P0 | mixed | SCR-M06-17 · +non-UI: exactly one recommended variant by default; variants only when… | T-M06-021 |
| M06-57 | P0 | mixed | SCR-M06-18 · +non-UI: connected channel's failure report is the visible failure… | T-M06-018 |
| M06-58 | P0 | mixed | SCR-M02-04 · +non-UI: nothing auto-withdraws; a person marks superseded/declined-by-tenant;  | T-M06-031 |

### docs/prd/modules/M07-sales-execution.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M07-01 | P0 | screen | SCR-M07-01 | T-M07-001 |
| M07-02 | P0 | screen | SCR-M07-01 | T-M07-001 |
| M07-03 | P0 | screen | SCR-M07-01 | T-M07-001 |
| M07-04 | P0 | mixed | SCR-M07-01 · +non-UI: renders M02 lead-machine output only; invents no timer | T-M07-001 |
| M07-05 | P0 | policy | policy | T-M07-021 |
| M07-06 | P0 | mixed | SCR-M07-01 · +non-UI: auto-created tasks record provenance rule and land on a named person,  | T-M07-001 |
| M07-07 | P0 | engine | engine | T-M07-021 |
| M07-08 | P0 | screen | SCR-M07-05 | voice — postponed |
| M07-09 | P0 | mixed | SCR-M07-05 · +non-UI: floor items can only narrow; above-floor items are the owner's | voice — postponed |
| M07-10 | P0 | mixed | SCR-M07-05 · +non-UI: four hard floors no edit removes; proactive disclosure is pack flag… | voice — postponed |
| M07-11 | P0 | mixed | SCR-M07-05 · +non-UI: asks-to-stop rule is statutory opt-out, cannot be removed | voice — postponed |
| M07-12 | P0 | mixed | SCR-M07-06 · +non-UI: saves only equal-or-narrower schedules and extra holidays vs… | voice — postponed |
| M07-13 | P0 | screen | SCR-M07-07 | voice — postponed |
| M07-14 | P0 | mixed | SCR-M07-08 · +non-UI: versioned-append publishing; queued calls keep their queued version… | voice — postponed |
| M07-15 | P0 | mixed | SCR-M07-05 · +non-UI: six agent languages stay independent of three interface languages | voice — postponed |
| M07-16 | P0 | screen | SCR-M07-09 | voice — postponed |
| M07-17 | P0 | policy | policy | voice — postponed |
| M07-18 | P0 | mixed | SCR-M07-10 · +non-UI: captures unanswerable questions with asked-count; answer live from… | voice — postponed |
| M07-19 | P0 | mixed | SCR-M07-09 · +non-UI: contradiction detection runs at save, before agent can speak either | voice — postponed |
| M07-20 | P0 | policy | policy | voice — postponed |
| M07-21 | P1 | screen | SCR-M07-09 | voice — postponed |
| M07-22 | P0 | engine | engine | voice — postponed |
| M07-23 | P0 | policy | policy | voice — postponed |
| M07-24 | P0 | policy | policy | voice — postponed |
| M07-25 | P0 | mixed | SCR-M07-13 · +non-UI: rep correction overrides agent read on the lead; agent original stays  | voice — postponed |
| M07-26 | P0 | mixed | SCR-M07-11 · +non-UI: no auto-training ever in v1; owner promotion is only behaviour path | voice — postponed |
| M07-27 | P0 | engine | engine | voice — postponed |
| M07-28 | P0 | mixed | SCR-M07-12 · +non-UI: gate reads one row of customer compliance fields per dial | voice — postponed |
| M07-29 | P0 | policy | policy | voice — postponed |
| M07-30 | P0 | mixed | SCR-M07-12 · +non-UI: gate enforcement binds automated dials; manual dials get… | voice — postponed |
| M07-31 | P0 | policy | policy | voice — postponed |
| M07-32 | P0 | policy | policy | voice — postponed |
| M07-33 | P0 | engine | engine | voice — postponed |
| M07-34 | P0 | mixed | SCR-M07-05 · +non-UI: off means nothing queues or dials; inbound falls to non-AI routing | voice — postponed |
| M07-35 | P0 | mixed | SCR-M07-12 · +non-UI: window-shifted scheduling; attempts counted against configured… | voice — postponed |
| M07-36 | P0 | mixed | SCR-M07-12 · +non-UI: queued call dials with exactly its queued config version | voice — postponed |
| M07-37 | P0 | mixed | SCR-M07-12 · +non-UI: allowance checked at insert and dial; minutes metered to usage ledger | voice — postponed |
| M07-38 | P0 | mixed | SCR-M07-13 · +non-UI: every call ledgered; recording purged at retention bound, transcript… | voice — postponed |
| M07-39 | P0 | engine | engine | voice — postponed |
| M07-40 | P0 | policy | policy | voice — postponed |
| M07-41 | P0 | policy | policy | voice — postponed |
| M07-42 | P0 | screen | SCR-M07-14 | voice — postponed |
| M07-43 | P0 | policy | policy | voice — postponed |
| M07-44 | P0 | mixed | SCR-M07-15 · +non-UI: chains ring level-by-level with timeouts, mandatory terminal… | voice — postponed |
| M07-45 | P0 | engine | engine | voice — postponed |
| M07-46 | P0 | screen | SCR-SHELL-01 | voice — postponed |
| M07-47 | P0 | mixed | SCR-M07-16 · +non-UI: flows versioned and published whole; in-flight calls keep their… | voice — postponed |
| M07-48 | P0 | engine | engine | voice — postponed |
| M07-49 | P0 | integration | integration | voice — postponed |
| M07-50 | P0 | policy | policy | voice — postponed |
| M07-51 | P0 | screen | SCR-M07-17 | voice — postponed |
| M07-52 | P0 | mixed | SCR-M07-17 · +non-UI: BYO is inbound forwarding only; outbound CLI never portable | voice — postponed |
| M07-53 | P0 | screen | SCR-M07-17 | voice — postponed |
| M07-54 | P0 | integration | integration | voice — postponed |
| M07-55 | P0 | screen | SCR-M07-18 | voice — postponed |
| M07-56 | P0 | mixed | SCR-M07-18 · +non-UI: correlation-only claim law (F8-30/31); product never claims agent… | voice — postponed |
| M07-57 | P0 | screen | SCR-M07-19 | voice — postponed |
| M07-58 | P0 | screen | SCR-M07-10 | voice — postponed |
| M07-59 | P0 | screen | SCR-M07-20 | voice — postponed |
| M07-60 | P1 | mixed | SCR-M07-18 · +non-UI: visible to EPC Owner and Sales Manager only… | voice — postponed |
| M07-61 | P0 | mixed | SCR-M07-18 · +non-UI: detects collapsing connect rate with likely cause; monthly in-app… | voice — postponed |
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
| M08-14 | P1 | mixed | SCR-M08-01 · +non-UI: append-only actor-stamped timeline event; a backward stage move is allowed and recorded with the same weight as a forward one | T-M08-001 |
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
| ~~M08-33~~ | — | **excluded** | — | — |
| M08-34 | P0 | policy | policy | T-M08-008 |
| M08-35 | P0 | policy | policy | T-M08-009 |
| M08-36 | P0 | engine | engine | T-M08-009 |
| M08-37 | P0 | policy | policy | T-M08-011 |
| M08-38 | P0 | mixed | SCR-M08-02 · +non-UI: sends via tenant's connected transactional channel with honest… | T-M08-002 |
| M08-39 | P0 | policy | policy | T-M08-011 |
| ~~M08-40~~ | — | **excluded** | — | — |
| M08-41 | P0 | mixed | SCR-M08-04 · +non-UI: steps are the design's derived work order; this module… | T-M08-004 |
| M08-42 | P0 | mixed | SCR-M08-04 · +non-UI: attribution law per R16: tick attributed to coordinator/ticker; never  | T-M08-004 |
| M08-43 | P0 | policy | policy | T-M08-014 |
| ~~M08-44~~ | — | **excluded** | — | — |
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
| M09-01 | P0 | context | context → M09.2-M09.10 feature-area rows, the module's REC rows among them | realized-by: docs/prd/modules/M09-field-workforce.md §M09.2–§M09.10 rows (this file), each REC row its own one home (`OV-43`) |
| M09-02 | P0 | policy | policy | T-M09-009 |
| M09-03 | P0 | policy | policy | T-M09-009 |
| M09-04 | P0 | mixed | SCR-M09-01 · +non-UI: billing unit is tracked-seat-months; ledger, proration and invoicing… | T-M09-001 |
| M09-05 | P0 | policy | policy | T-M09-009 |
| M09-06 | P0 | context | context → M09 §5 non-goals; M09-09 | realized-by: docs/prd/modules/M09-field-workforce.md §5 non-goals; M09-09 (LAW) |
| M09-07 | P0 | context | context → M09-25, M09-33, M09-34, M09-63 (the module's REC rows, each its own one home per `OV-43`) | T-M09-014 |
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
| ~~M09-20~~ | — | **excluded** | — | — |
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
| M09-31 | P0 | mixed | SCR-M09-03 · +non-UI: three outcomes, mandatory reason on could-not-complete; forward-only status, a regressing write refused (`F4-17`) | T-M09-003 |
| M09-32 | P1 | screen | SCR-M09-02 | T-M09-002 |
| M09-33 | P2 | mixed | SCR-M09-02 · +non-UI: geography/window ordering suggestion engine; acceptable or ignorable,  | T-M09-002 |
| M09-34 | P2 | screen | SCR-F5-02 | T-M09-017 |
| M09-35 | P0 | screen | SCR-M09-02 | T-M09-002 |
| ~~M09-36~~ | — | **excluded** | — | — |
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
| M09-48 | P0 | mixed | SCR-M09-04 · +non-UI: a live position needs the server; the last known position is rendered with the time it was taken, plainly labelled, never as current | T-M09-004 |
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
| M10-28 | P2 | mixed | SCR-M10-05 · +non-UI: distinct data from F1-48 calling-window holiday calendar | T-M10-005 |
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
| M11-39 | P0 | mixed | SCR-M11-03 · +non-UI: recording requires the server, is refused with an honest reason, and nothing is held (`M11-06`) | T-M11-003 |
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

### docs/prd/modules/M13-dashboards-and-reporting.md

| Row | Tier | Type | Where | Task |
|---|---|---|---|---|
| M13-01 | P0 | policy | policy | LAW |
| M13-02 | P0 | policy | policy | LAW |
| M13-03 | P0 | policy | policy | T-M13-007 |
| M13-04 | P0 | policy | policy | shipped |
| M13-05 | P0 | policy | policy | LAW |
| M13-06 | P0 | policy | policy | LAW |
| M13-07 | P0 | policy | policy | LAW |
| M13-08 | P0 | policy | policy | LAW |
| M13-09 | P0 | policy | policy | LAW |
| M13-10 | P0 | mixed | SCR-SHELL-01 · +non-UI: fixed preset-precedence ladder derives one home; other presets… | shipped |
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
| M13-21 | P1 | mixed | SCR-SHELL-03 · +non-UI: monthly summary generation and push scheduling; notification type… | `T-M13-010`, shipped |
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
| M13-33 | P0 | screen | the 3D Design Studio — screen not yet drawn | realized-by: the 3D Design Studio, rebuilt from scratch — no PRD or task yet |
| M13-34 | P0 | screen | SCR-M08-01 | T-M08-001 |
| M13-35 | P0 | screen | SCR-M09-02 | T-M09-002 |
| M13-36 | P0 | mixed | SCR-M08-05 · +non-UI: F2-06 surface law: no commercial figure on this home or composed… | T-M08-005 |
| M13-37 | P0 | screen | SCR-M10-01 | T-M10-001 |
| M13-38 | P0 | screen | SCR-M11-01 | T-M11-001 |
| M13-39 | P0 | screen | SCR-M13-03 | T-M13-003 |
| M13-40 | P0 | screen | SCR-M03-01 | T-M03-001 |
| M13-41 | P0 | screen | SCR-M07-18 | voice — postponed |
| M13-42 | P0 | screen | SCR-M07-18 | voice — postponed |
| M13-43 | P0 | screen | SCR-M07-19, SCR-M07-10, SCR-M07-20, SCR-M07-18 | voice — postponed |
| M13-44 | P1 | screen | SCR-M07-18 | voice — postponed |
| M13-45 | P1 | mixed | SCR-SHELL-03 · +non-UI: monthly agent summary generation and push; type registers in F6 | `T-M13-010`, shipped |
| M13-46 | P0 | screen | SCR-M03-01 | T-M03-001 |
| M13-47 | P0 | screen | SCR-M13-03 | T-M13-003 |
| M13-48 | P0 | mixed | SCR-M10-01 · +non-UI: never computes hours-worked, punctuality or people-scores | T-M10-001 |
| M13-49 | P0 | policy | policy | LAW |
| M13-50 | P0 | policy | policy | LAW |
| M13-51 | P1 | engine | engine | T-M13-011 |
| M13-52 | P0 | policy | policy | T-M13-012 |
| M13-53 | P0 | policy | policy | T-M13-012 |
| M13-54 | P0 | policy | policy | T-M13-012 |
