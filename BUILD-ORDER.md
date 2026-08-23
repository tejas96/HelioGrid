# Build order — the sequence engineering works in

Companion to [`START-HERE.md`](START-HERE.md), which is the *design* loop. These are two
different orders and mixing them up is the main way this goes wrong:

| | order | source of truth | unit |
|---|---|---|---|
| **Design** | the eight blocks below, V1 rows only | `prd/registers/screens.md` §2 (`V` column) | **99** of 150 screens |
| **Build** | the same eight blocks | this file | 372 tasks |

Since 2026-08-15 the two orders are **the same order** — the design run follows the build blocks,
V1 rows only. That is the whole point of the scope lock.

**A third thing gates the design order and neither file above holds it:**
[`design/DESIGN-SYSTEM-GAPS.md`](design/DESIGN-SYSTEM-GAPS.md) — 57 component gaps found on
2026-08-16; 3 closed, 9 partly closed, 45 open. A block cannot be *designed* while it still owns
an open blocker there, and **block 1 owns ten today**. It does not gate *build*: the 222
non-screen tasks below are unaffected.

Nothing here invents scope. Every task already exists in `tasks/`, generated from the
requirement register; this file only says what order to take them in and why.

---

## The V1 scope lock

**99 of the 150 screens are V1.** *(84 on 2026-08-15; 95 on 2026-08-16; 98 the same day, after the V1 readiness audit found three scope holes the gates could not see; 99 when `SCR-M01-11` followed — V1 had no user-owned preferences screen at all, so the language picker, the per-user units, the notification mute and the high-contrast field mode had nowhere to live.)* The `V` column in `prd/registers/screens.md` §2 is the lock;
`gates.py` gate 17 keeps it honest. V2 is real scope that is deliberately not blocking launch —
the architecture keeps its extension points, but nothing V2 is designed or built until V1 ships.

**222 of the 372 tasks have no design dependency at all.**

| | tasks | can start |
|---|---|---|
| Screen tasks (carry `DESIGN: SCR-… → PENDING`) | 150 | when their screen is approved |
| Engine · policy · integration · port tasks | 222 | **today** |

Per `tasks/README.md` rule 3, `DESIGN: PENDING` **blocks build, not start**. So engineering is
not waiting on the design run.

Note the `V` column lives on screens, not tasks. A task is V1 if the V1 workflow needs it —
which for the foundations means all of them, since permissions, formats and honesty underpin
every block below.

---

## The order, and why the studio is sixth

Decided 2026-08-15 after inspecting both codebases.

| # | Block | V1 screens | Task files |
|---|---|---|---|
| **0** | **Foundations** | 0 | `F-core` (15) · `F-platform` (32) |
| **1** | **Shell + entry & tenant** | 23 | `SHELL` (4) · `M01-onboarding` (27) |
| **2** | **Billing & plans** | 5 | `M12-platform-billing` (13) |
| **3** | **CRM & leads** | 6 | `M02-crm-leads` (17) |
| **4** | **Projects** | 6 | `M08-projects` (15) |
| **5** | **Payments & collections** | 4 | `M11-payments-collections` (16) |
| **6** | **Sales exec, calling core + owner home** | 12 | `M07-sales-execution` (29) · `M13-dashboards` (12) |
| **7** | **3D Design Studio** | 18 | `MS-studio-a/-b/-c` (83) |
| **8** | **Proposals + customer link** | 25 | `M06-proposals` (31) · `F5-customer-link` (13) |

**Block 2 is not block 5.** `M12` is how the platform charges an EPC company — pricing page,
hosted checkout, dunning, usage against bundles. `M11` is how that company collects from a
homeowner. Two different money flows, two different modules, and the PRD keeps them apart on
purpose (`M12` §2: Finance's money scope is the tenant's customers' money, never the platform
bill). Owner decision 2026-08-16: self-serve billing ships in V1, so `M12` sits early — a
prospect meets the pricing page before they have an account.

**Phase 0 starts today.** 47 foundation tasks, zero screens: roles and the twelve presets,
permission resolution, the audit log, the message catalog, the four format implementations,
script rendering, notification delivery, the data-honesty engine. Everything else consumes them.
A module that computes money before the format implementation exists will grow its own, and then
there are two.

**Why the studio is sixth, not first.** It is the primary product and it already exists —
**63,527 working lines** in `/Volumes/works-space/Solar-App-POC`. But:

- it is **frontend-only**, and `/Volumes/works-space/heliogrid`'s backend today is a health check
  (`apps/api`, 342 lines, one module) with no schema in `packages/db`;
- it does not meet this repo's standards, and `boundaries`, `check:adherence`, `check:dupes` and
  `check:unused` run on every commit;
- it carries its own defect register at `prd/_process/studio/defect-register.md`.

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
they move with their tests and the defect register is the change list. Those can start earlier
than block 7 if you have the people — they depend on the POC, not on this suite.

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

## Decisions the owner still owes — and none of them blocks a screen

Recorded in `prd/registers/open-questions.md`.

| Q | blocks | what it is |
|---|---|---|
| `Q66` | any multi-user field device | a shared phone holding another user's unuploaded photos. `F4-21` (nothing captured is unrecoverable) and tenant isolation contradict each other here, and the PRD currently states both — an implementer must pick, and either choice is defensible |
| `Q65` | the first breaking API change | what a client too old to talk to the server shows. No screen waits on it: `SCR-SHELL-05` was deleted with the row |
| `Q53` | nothing at launch | India's statutory messaging window — a regulatory-data gap, not a design choice |
| `Q56`, `Q60` | nothing | reclassified as designer-decides-and-records, not owner rulings |

**`Q62`, `Q63` and `Q64` were ruled on 2026-08-15 and are closed.** All three the same way and
for one reason: they were not three questions but one, and `F8-36` had already answered it —
*"does not silently queue, partially apply, or display an optimistic result."* Each was live law
in the abstract with no module row making it concrete at the surface where it bites. The three
restored rows are **`M02-66`** (a duplicate the live check could not see, found on apply),
**`M02-67`** (assign and junk are server-completed) and **`M09-71`** (an attendance mark is
recorded only once the server has it).

They carry new ids on purpose: `M02-04`, `M02-26` and `M09-36` genuinely *were* deleted on
2026-08-07, and the struck register rows saying so have to stay true. Each new row names the one
it restores.

`SCR-M02-01`, `SCR-M02-02`, `SCR-M02-04` and `SCR-M09-02` are unblocked. **Nothing in the design
queue is waiting on a ruling.**

---

## Verifying

```bash
python3 gates.py
```

Eighteen mechanical gates over the whole suite — no dangling row or task ids anywhere in `prd/`,
`ux/briefs/`, `tasks/` or the registers; verbatim quotes matching their live PRD cells; every
screen carrying a brief and a DESIGN task; no offline machinery left in `tasks/`; every one of
the 1,660 PRD rows dispositioned exactly once in the screens register; and every recorded hole
mapping to a genuinely open owner question. Ground truth is re-derived from the live PRD on
every run, so a gate cannot pass by agreeing with a stale snapshot.

Two of them exist because of specific ways this suite has been got wrong before. **Gate 12**
keeps gates 2, 3, 10 and 14 honest: those forgive a paragraph marked as a recorded hole, so
gate 12 checks each marker resolves to a genuinely *open* question — otherwise the marker
becomes a way to hide a dead citation. **Gate 15** distinguishes a struck disposition from a
missing one, because "we deleted the row from the register" and "we recorded that the row was
deleted" look identical in a count and mean opposite things. **Gate 17** holds the V1 scope lock at 99,
so scope creeps by an owner decision that moves the number, never by an edit that nobody notices.

Design progress is a separate count:

```bash
grep -c '| pending |' prd/registers/screens.md
```
