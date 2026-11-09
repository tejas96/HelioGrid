# Build order — the sequence engineering works in

Nothing here invents scope. Every task already exists in `docs/tasks/`; this file only says what
order to take them in and why.

---

## The V1 scope lock

The `V` column in `docs/prd/registers/screens.md` §2 is the lock, and only an owner decision moves
it. V2 is real scope that is deliberately not blocking launch — the architecture keeps its extension
points, but nothing V2 is designed or built until V1 ships.

## One order, walked one step at a time

Every task is built in ONE fixed order, and `/task` (`.claude/skills/task/SKILL.md`) walks it to
pick the next step; the invariant `build-order-holds` keeps the order itself whole — every task
file placed, no loop, every later-block wait recorded. The order is walked, never chosen:

1. the blocks below, lowest first;
2. inside a block, its cells in the order the block's row writes them — a file, or a task placed
   apart from its file;
3. inside a file, its backend tasks first, then its screens — each group in the order the file writes
   it, which for the screens is the user's journey;
4. a task's `Depends on:` pulls a task of its own block ahead of it; a later-block wait is recorded
   below instead.

The step is the first open part of a split task, else the first open V1 task on that walk. A part
lives in its task's `#### Parts` table; this file never lists parts.

What the step is for each task — build, owner merges, owner clears —
is `/task`'s *Pick* (`.claude/skills/task/SKILL.md`). A `**Parked:**` task is stepped over and pulls nothing ahead.

The `V` column lives on screens, not tasks. A task is V1 if the V1 workflow needs it — which for
the foundations means all of them, since permissions, formats and honesty underpin every block
below.

---

## The order

Block numbers are stable: other documents cite them, so a block that empties keeps its number free.

| # | Block | Holds | Task files |
|---|---|---|---|
| **0** | **Foundations** | permissions, formats, notifications, honesty | `F-core` (all but `T-FCORE-009` — see below) · `F-platform` (all but `T-FPLAT-020`, `T-FPLAT-066`, `T-FPLAT-074` — see below) |
| **1** | **Shell + entry & tenant** | sign-in, signup, team, catalog, branding | `SHELL` (all but `T-SHELL-002` — see below) · `M01-onboarding` (all but `T-M01-029` — see below) |
| **3** | **CRM & leads** | lead capture to a qualified lead | `M02-crm-leads` · `SHELL` → `T-SHELL-002` · `F-platform` → `T-FPLAT-020`, `T-FPLAT-066` |
| **4** | **Projects** | a won deal to a handed-over system | `M08-projects` |
| **5** | **Payments & collections** | the homeowner's tranches and receipts | `M11-payments-collections` |
| **6** | **Sales execution + owner home** | My Day, won, lost, reopen, follow-ups, the owner home | `M07-sales-execution` · `M13-dashboards` |
| **8** | **Proposals + customer link** | the proposal and the link the homeowner opens | `M06-proposals` · `F5-customer-link` · `F-core` → `T-FCORE-009` · `F-platform` → `T-FPLAT-074` · `M01-onboarding` → `T-M01-029` |

**The 3D Design Studio is rebuilt from scratch.** Its tasks and its PRD are deleted; its block
returns, as block 7, with the new studio's tasks.

**Voice calling waits.** Its PRD rows stay in `docs/prd/modules/M07-sales-execution.md` and its
screens are V2 in the register; its tasks are written again when it returns.

**Platform billing is redesigned.** Its tasks and its PRD are deleted; the shipped code runs until
the new pricing replaces it, in a task of its own.

**`SHELL` spans two blocks.** `T-SHELL-002`, the search screen, builds beside `T-FPLAT-020` in block 3:
every step of its proof searches records that block lands, the junk lead above all.

**The data-rights engine waits in block 8, parked.** `T-FCORE-009` — `pack.data-rights`, the erasure
workflow and the IN DPDP determination — is parked by owner ruling until the tenant base reaches real
paying customers (roughly 10–20). It builds when the owner unparks it, and by then the customer
record (block 3) and the consent records its proofs erase and export exist.

**The demo project seed builds in block 8.** `T-M01-029` instantiates a finished demo lead, design and
proposal for every new tenant, and its `Depends on:` names the first migrations of M02 (`lead`), the
studio (`design`) and M06 (`proposal`, `proposal_version`).

**Global search builds in block 3.** `T-FPLAT-020` searches leads, proposals, projects, customers,
sites, catalog items and people. It builds once the lead record lands, with leads as its first search
target, and each later module adds its own target when its slice begins (Law 9).

**Recipient resolution builds in block 3.** `T-FPLAT-066` turns a recipient rule — "the record's
owner", "the assignee" — into people. It builds once the lead record lands, before `T-M02-011`
notifies a lead's new owner, so the resolution is written once and every later module reuses it. Its
every-module walk of `F6-10` belongs to `T-FPLAT-074`.

**The projection label builds in block 8.** `T-FPLAT-074` prints a projection's word and its
assumptions in the words the drawn proposal document (`SCR-M06-17`) gives, and that screen is drawn in
block 8.

**Blocks 1–6 ship a working product on their own**: lead → won → project → payment.

---

## What V2 holds

Survey · Marketing · Field workforce and location · HR · the voice agent · Dashboards beyond the
owner home · 4 `M01` settings screens (message templates, capture settings, locale defaults,
integration credentials). Their task files stay; they are not started.

---

## Dependencies that cross blocks

Build the consumer after the producer, or stub it deliberately and record the stub:

| consumer | needs | why |
|---|---|---|
| `M06` proposals | `M01` catalog + payment terms + templates | a proposal is priced from the catalog and worded from the template |
| `F5` customer link | `M06` proposals | the link's first payload is a proposal |
| `M08` projects | `M07` sales execution | a project starts from a closed sale |
| `M11` payments | `M08` projects | tranches hang off the project's milestones |
| `M13` dashboards | every module | it reports on their data |
| every module | `F-core` + `F-platform` | permissions, formats, notifications, honesty |

### Recorded: a V1 task whose proof waits on a later block

Each task below sits in one block, and one of its done-when proofs needs a screen or a record that
only exists in a later block — so, as placed, its block cannot finish. Each owes a ruling BEFORE its
own block starts: move the task to the block its proof needs, or move that proof line to the later
task that builds what it needs.

| task | block | waits on | block | the proof step that needs it |
|---|---|---|---|---|

---

## Checking the suite

Invariants check the task and PRD documents (`.claude/protections.md`, Process):
`build-order-holds`, `prd-rows-cited` (every cited PRD row is live and every quote matches its
cell), and `capability-ids-cited` (every capability a task names, by id or by row key, is
one the matrix holds).
