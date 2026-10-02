# Build order — the sequence engineering works in

Companion to [`docs/start-here.md`](start-here.md), which is the *design* loop. These are two
different orders and mixing them up is the main way this goes wrong:

| | order | source of truth | unit |
|---|---|---|---|
| **Design** | the eight blocks below, V1 rows only | `docs/prd/registers/screens.md` §2 (`V` column) | **99** of 150 screens |
| **Build** | the same eight blocks | this file | 394 tasks |

Since 2026-08-15 the two orders are **the same order** — the design run follows the build blocks,
V1 rows only. That is the whole point of the scope lock.

**The design-system gap register is closed.** The 2026-08-17 pass returned zero open
blockers — every component sent in rounds 13–17 exists and does substantially what was
asked. No block is gated on it. If a screen finds a new gap, it is designed at
implementation time inside the owning module's slice (`docs/prd/foundations/F7` `F7-45`).

Nothing here invents scope. Every task already exists in `docs/tasks/`, generated from the
requirement register; this file only says what order to take them in and why.

---

## The V1 scope lock

**99 of the 150 screens are V1.** *(84 on 2026-08-15; 95 on 2026-08-16; 98 the same day, after the V1 readiness audit found three scope holes the gates could not see; 99 when `SCR-M01-11` followed — V1 had no user-owned preferences screen at all, so the language picker, the per-user units, the notification mute and the high-contrast field mode had nowhere to live.)* The `V` column in `docs/prd/registers/screens.md` §2 is the lock,
and only an owner decision moves it. V2 is real scope that is deliberately not blocking launch —
the architecture keeps its extension points, but nothing V2 is designed or built until V1 ships.

**234 of the 394 tasks are backend tasks: none carries a drawing of its own, and each still waits for
the drawings of the screens it serves.**

| | tasks | waits on |
|---|---|---|
| Screen tasks (carry `DESIGN: SCR-… → PENDING`) | 154 | their turn, and their screen drawn |
| Engine · policy · integration · port tasks | 234 — eight of them the struck F-platform stubs, which only name where their rows went | their turn, and the never-drawn screens they serve in their block |

## One order, walked one step at a time

Every task is built in ONE fixed order, and `/start` step 2 walks it to pick the next step; no
check holds the order. The order is walked, never chosen:

1. the blocks below, lowest first;
2. inside a block, its cells in the order the block's row writes them — a file, or a task placed
   apart from its file;
3. inside a file, its backend tasks first, then its screens — each group in the order the file writes
   it, which for the screens is the user's journey (`M01`: sign-in → signup → language → … → team →
   roles → catalog → branding);
4. a task's `Depends on:` pulls a task of its own block ahead of it; a later-block wait is recorded
   below instead.

The step is the first open V1 task on that walk:

| the task | the step printed |
|---|---|
| ready | `build <task>` — `/start` takes it |
| a screen whose `DESIGN:` line holds no link | `owner draws <SCR>` from its brief — `/start` prints how — then `/start` takes it |
| a backend task whose screens in its block are not all drawn — its own file's, and any whose `Depends on:` names it | `owner draws <SCR>, …` before the backend is built: a drawing states facts the backend serves. A redraw `design-reviewer` asks for does not hold it — that drawing exists, and the redraw stops only the screen task |
| carries a `**Blocked:**` line — a ruling, an account | `owner clears` it; nothing after it is taken until it is cleared, or the task is moved or parked with a recorded reason |
| waits on a parked task | `owner clears` it: unpark that task, or move or park this one |
| carries a `**Parked:**` line | stepped over; it pulls nothing ahead |

So a module runs design → backend → UI. A screen that is not drawn is never skipped for one that is. `/start` also prints `AHEAD` —
the next screen to draw on the same walk — so the owner draws while the build runs, and `DONE`, how
many of the 99 V1 screens are drawn.

Note the `V` column lives on screens, not tasks. A task is V1 if the V1 workflow needs it —
which for the foundations means all of them, since permissions, formats and honesty underpin
every block below.

---

## The order, and why the studio is sixth

Decided 2026-08-15 after inspecting both codebases.

| # | Block | V1 screens | Task files |
|---|---|---|---|
| **0** | **Foundations** | 0 | `F-core` (15 of its 16 — see below) · `F-platform` (25 of its 28 — see below) |
| **1** | **Shell + entry & tenant** | 22 | `SHELL` (2 of its 4 — see below) · `M01-onboarding` (27) |
| **2** | **Billing & plans** | 5 | `M12-platform-billing` (13) · `SHELL` → `T-SHELL-006` |
| **3** | **CRM & leads** | 7 | `M02-crm-leads` (17) · `SHELL` → `T-SHELL-002` · `F-platform` → `T-FPLAT-020`, `T-FPLAT-066` |
| **4** | **Projects** | 6 | `M08-projects` (15) |
| **5** | **Payments & collections** | 4 | `M11-payments-collections` (16) |
| **6** | **Sales exec, calling core + owner home** | 12 | `M07-sales-execution` (29) · `M13-dashboards` (12) |
| **7** | **3D Design Studio** | 18 | `MS-studio-a/-b/-c` (83) |
| **8** | **Proposals + customer link** | 25 | `M06-proposals` (31) · `F5-customer-link` (13) · `F-core` → `T-FCORE-009` · `F-platform` → `T-FPLAT-074` |

**The `SHELL` task file spans three blocks.** `SCR-SHELL-06` — the billing state banner and its
denial sheets — sits with the other shell rows in the screens register, because that is where it renders.
It builds in block 2: it draws a tenant's `M12` state and routes to `SCR-M12-03` and `SCR-M12-04`,
so designing it in block 1 means inventing the states and the destinations `M12` has not defined
yet. The block-1 count of 22 already excludes it and the block-2 count of 5 already includes it.
**The data-rights engine waits in block 8, parked.** `T-FCORE-009` — `pack.data-rights`, the erasure
workflow and the IN DPDP determination — is parked by owner ruling until the tenant base reaches real
paying customers (roughly 10–20). It sits in the last V1 block so `/start` stops offering it; it
builds when the owner unparks it, and by then the customer record (block 3) and the calling consent
records (block 6) its proofs erase and export exist.

**Global search builds in block 3, not block 0.** `T-FPLAT-020` searches leads, proposals,
projects, customers, sites, catalog items and people, and in block 0 none of those tables exists:
every done-when line — scope, the "quote" alias, junk leads, a halted tenant's results — would run
over empty results and prove nothing. It builds once the lead record lands, with leads as its
first search target, and each later module adds its own target when its slice begins (Law 9). The
search screen, `T-SHELL-002`, builds beside it in block 3: every step of its proof searches records
that block lands, the junk lead above all, so in block 1 it could not finish.

**Recipient resolution builds in block 3, not block 0.** `T-FPLAT-066` turns a recipient rule —
"the record's owner", "the assignee" — into people, and in block 0 no record has an owner: the only
subject kinds are users, invitations and tenant settings. It builds once the lead record lands, before
`T-M02-011` notifies a lead's new owner, so the resolution is written once and every later module
reuses it. Two of its proofs still wait on later blocks and are recorded below.

**The projection label builds in block 8, not block 0.** `T-FPLAT-074` prints a projection's word
and its assumptions in the words the drawn proposal document (`SCR-M06-17`) gives, and that screen is
drawn in block 8. The design system's own renderer closes with it, so the boards drawn on free words
are redrawn once.

`/start` step 2 walks the same order for the screens still to draw and prints the next one as
`AHEAD` — use it rather than reading this table against the screens register by eye.

**Block 2 is not block 5.** `M12` is how the platform charges an EPC company — pricing page,
hosted checkout, dunning, usage against bundles. `M11` is how that company collects from a
homeowner. Two different money flows, two different modules, and the PRD keeps them apart on
purpose (`M12` §2: Finance's money scope is the tenant's customers' money, never the platform
bill). Owner decision 2026-08-16: self-serve billing ships in V1, so `M12` sits early — a
prospect meets the pricing page before they have an account.

**Phase 0 starts today.** 52 foundation tasks, zero screens: roles and the twelve presets,
permission resolution, the audit log, the message catalog, the four format implementations,
script rendering, notification delivery, the data-honesty engine. Everything else consumes them.
**Six F-platform tasks were struck 2026-09-04 and their rows moved to the modules that consume
them** (Law 9): the conflict-policy engine, nothing-captured-is-unrecoverable, the version-kept
notice, the photograph queue, billing continuity and the shared-device switch. Every requirement
survives — survey and visit rules now sit in `M04`, lead concurrency in `M02`, the design version
check in the studio, the user switch in `M01`'s session engine, and the billing rows were already
carried by `M12` or marked LAW. Each struck task keeps a stub naming where its rows went.

A module that computes money before the format implementation exists will grow its own, and then
there are two.

**Why the studio is sixth, not first.** It is the primary product and it already exists —
**63,527 working lines** in `/Volumes/works-space/Solar-App-POC`. But:

- it is **frontend-only**, and this repo's backend and schema are built block by block before it
  (blocks 0–6);
- it does not meet this repo's standards, and `pnpm lint` (Biome and its plugins,
  dependency-cruiser, turbo boundaries) and the duplication check run on every pull request;
- it carries its own defect register at `docs/prd/modules/M05-studio/defect-register.md`.

Porting it first would mean inventing the API, schema and data-layer conventions *while* fighting
a port. Blocks 1–6 settle those conventions; then the port has something to conform to.

**Size it honestly.** Block 7 is not "18 screens". It is 18 screens **plus** the studio's backend
**plus** bringing 63.5k lines to standard **plus** the defect register. It is the largest block in
V1, not the easiest because code exists.

**Proposals travel with the studio** — a proposal quotes the BOM a design produces. Building M06
earlier means building against a stubbed design payload and reworking it later.

**Blocks 1–6 ship a working product on their own**: lead → won → project → payment. That is how
most EPCs operate today with a spreadsheet. The studio lands on top of a system that already
works.

**39 of the studio's 83 tasks are typed `port`, not `screen` or `engine`.** Per ruling `S12-1`
they move with their tests and the defect register is the change list. They build at their turn in
block 7, like every other task.

---

## What V2 holds — 51 screens

Survey (10) · Marketing (10) · Field workforce and location (7) · HR (7) · the voice-agent admin
console — IVR editor, routing rules, number provisioning, config history, performance, usage (9) ·
Dashboards beyond the owner home (4) · 4 `M01` settings screens (message templates, capture
settings, locale defaults, integration credentials).

The task files for these still exist and are still correct. They are not deleted, not deprecated,
and not started.

---

## Dependencies that cross phases

Build the consumer after the producer, or stub it deliberately and record the stub:

| consumer | needs | why |
|---|---|---|
| `M06` proposals | `M01` catalog + payment terms + templates | a proposal is priced from the catalog and worded from the template |
| `M06` proposals | `MS-studio-*` | the design produces the BOM the proposal quotes |
| `F5` customer link | `M06` proposals | the link's first payload is a proposal |
| `M08` projects | `M07` sales execution | a project starts from a closed sale |
| `M11` payments | `M08` projects | tranches hang off the project's milestones |
| `M13` dashboards | every module | it reports on their data |
| every module | `F-core` + `F-platform` | permissions, formats, notifications, honesty |

### Recorded: a V1 task whose proof waits on a later block

Each task below sits in one block, and one of its done-when proofs needs a screen or a record that
only exists in a later block — so, as placed, its block cannot finish. Each owes a ruling BEFORE its
own block starts: move the task to the block its proof needs, or move that proof line to the later
task that builds what it needs. A record here keeps the order honest; it does not settle the ruling.

| task | block | waits on | block | the proof step that needs it |
|---|---|---|---|---|
| `T-FPLAT-066` | 3 | `T-MS-117` | 7 | the design's author gets `design_survey_superseded`, resolved through F2 scope — and, with no single task to name, the `F6-10` check of the matrix against every module's §4 contract, which only the last V1 block can walk |

---

## Checking the suite

No script checks the documents any more. `/start` step 3 checks the task it takes: every row id
the task cites exists in the PRD, and every quoted row still matches its PRD cell. `design-reviewer`
checks a screen's product facts against their whole PRD rows and its design against its brief.
What nothing checks — a dangling id in a task not yet started, the V1 count, a row dispositioned
twice in the screens register — is held by review and the owner.

Design progress is `/start` step 2's `DONE` line: how many of the 99 V1 screens have a link on
their task's `DESIGN:` line.
