# Build order — the sequence engineering works in

Nothing here invents scope. Every task already exists in `docs/tasks/`; this file only says what
order to take them in and why.

---

## The V1 scope lock

The `V` column in `docs/prd/registers/screens.md` §2 is the lock, and only an owner decision moves
it. V2 is real scope that is deliberately not blocking launch — the architecture keeps its extension
points, but nothing V2 is designed or built until V1 ships.

## One order

Every task is built in ONE fixed order, one block per session and per PR (`CLAUDE.md` §3); the
invariant `build-order-holds` keeps the order itself whole — every task file placed, no loop, every
later-block wait recorded. The order is followed, never chosen:

1. the blocks below, lowest first;
2. inside a block, its cells in the order the block's row writes them — a file, or a task placed
   apart from its file;
3. inside a file, its backend tasks first, then its screens — each group in the order the file writes
   it, which for the screens is the user's journey;
4. a task's `Depends on:` pulls a task of its own block ahead of it; a later-block wait is recorded
   below instead.

The next block is the lowest one with an open V1 task that is not `**Parked:**`. A `**Parked:**`
task is stepped over and pulls nothing ahead; a `**Blocked:**` task stops the work until the owner
clears it. A split task's parts live in its
`#### Parts` table; this file never lists parts.

The `V` column lives on screens, not tasks. A task is V1 if the V1 workflow needs it — which for
the foundations means all of them, since permissions, formats and honesty underpin every block
below.

---

## The order

Block numbers are stable: other documents cite them, so a block that empties keeps its number free.

| # | Block | Holds | Task files |
|---|---|---|---|
| **0** | **Foundations** | permissions, formats, notifications, honesty | `F-core` (all but `T-FCORE-009` — see below) · `F-platform` (all but `T-FPLAT-074` — see below) |
| **1** | **Shell + entry & tenant** | sign-in, signup, team, catalog, branding | `M01-onboarding` (all but `T-M01-029` — see below) |
| **6** | **Sales execution + owner home** | My Day, lost, reopen, follow-ups, the owner home | `M07-sales-execution` · `M13-dashboards` |
| **8** | **Proposals + customer link** | the proposal and the link the homeowner opens | `M06-proposals` · `F5-customer-link` · `F-core` → `T-FCORE-009` · `F-platform` → `T-FPLAT-074` · `M01-onboarding` → `T-M01-029` · `M11-payments-collections` |

**The 3D Design Studio is rebuilt from scratch.** Its tasks and its PRD are deleted; its block
returns, as block 7, with the new studio's tasks. When its tasks are written, one carries
`M08-41`'s proof, moved here from the shipped `T-M08-004` by owner ruling 2026-11-10: *Given a
designed and strung system, when the installation checklist opens on the project, then its steps are
the design's derived work order in build order, and this module has generated no sequence of its own
(M08-41).*; until then a project's install steps are the market pack's standard steps.

**Voice calling waits.** Its PRD rows stay in `docs/prd/modules/M07-sales-execution.md` and its
screens are V2 in the register; its tasks are written again when it returns.

**Platform billing is redesigned.** Its tasks and its PRD are deleted; the shipped code runs until
the new pricing replaces it, in a task of its own.

**The data-rights engine waits in block 8, parked.** `T-FCORE-009` — `pack.data-rights`, the erasure
workflow and the IN DPDP determination — is parked by owner ruling until the tenant base reaches real
paying customers (roughly 10–20). It builds when the owner unparks it, and by then the customer
record (block 3) and the consent records its proofs erase and export exist.

**The demo project seed builds in block 8.** `T-M01-029` instantiates a finished demo lead, design and
proposal for every new tenant, and its `Depends on:` names the first migrations of M02 (`lead`), the
studio (`design`) and M06 (`proposal`, `proposal_version`).

**The projection label builds in block 8.** `T-FPLAT-074` prints a projection's word and its
assumptions in the words the drawn proposal document (`SCR-M06-17`) gives, and that screen is drawn in
block 8.

**Blocks 1–6 ship a working product on their own**: lead → won → project → payment. Projects
(block 4) reach real users only together with payments (block 5), by owner ruling 2026-11-10: block 4
ships no money.

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
