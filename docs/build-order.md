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
| **6** | **Sales execution + owner home** | built: My Day, lost, reopen, follow-ups, the owner home; left: trial-to-paid (parked) and the V2 dashboards | `M13-dashboards` (all but `T-M13-007`) |
| **8** | **Proposals + customer link** | the proposal built without a design, the link the homeowner opens and answers, Won from the accepted proposal, and the forecast the proposals price | `M06-proposals` · `F5-customer-link` · `F-core` · `F-platform` · `M01-onboarding` · `M11-payments-collections` · `M13-dashboards` → `T-M13-007` |

**Block 8 ships in four PRs, one session each (owner ruling 2026-11-13).** Inside each, the order
is this file's: backend tasks first, then screens in the journey's order; each PR's screens are
picked from samples before it builds.

1. **8a — the record and the builder:** `T-M06-032`, `T-M06-024`, `T-M06-023`, `T-M06-033`,
   `T-M06-034`, `T-M06-022`, `T-M06-027`, `T-M06-028`, then `T-M06-001`–`T-M06-013`.
2. **8b — share and the customer's answer:** `T-M06-025a`, `T-M06-026`, `T-M06-029`, `T-F5-006`,
   `T-F5-007`, `T-F5-009`, `T-F5-008`, `T-M06-030`, then `T-M06-017`, `T-FPLAT-074`, `T-M06-015`,
   `T-M06-016`, `T-M06-018`, `T-M06-019`, `T-M06-020`, `T-M06-031`, `T-F5-001`, `T-F5-004`.
3. **8c — Won and after:** `T-M06-025b`, `T-M06-025c`, `T-M11-015`, `T-F5-010`, then `T-F5-002`,
   `T-F5-003`.
4. **8d — the owner home:** `T-M13-007`.

**Proposals ship before the studio (owner ruling 2026-11-13).** Block 8's tasks that need a
design — `T-M06-014`, `T-M06-021`, `T-F5-011` and `T-M01-029` — are `**Parked:**` and are built
with the studio's block.

**The 3D Design Studio is rebuilt from scratch.** Its tasks and its PRD are deleted; its block
returns, as block 9, with the new studio's tasks; block 7 stays empty. When its tasks are written, one carries
`M08-41`'s proof, moved here from the shipped `T-M08-004` by owner ruling 2026-11-10: *Given a
designed and strung system, when the installation checklist opens on the project, then its steps are
the design's derived work order in build order, and this module has generated no sequence of its own
(M08-41).*; until then a project's install steps are the market pack's standard steps.

**Voice calling waits.** Its PRD rows stay in `docs/prd/modules/M07-sales-execution.md` and its
screens are V2 in the register; its tasks are written again when it returns, and carry what block 6
left for the agent: My Day's agent-activity block (M07-03), the overdue-two-days trigger (M07-07),
the owner dashboard's agent card (M13-14), the monthly agent summary (M13-45) and the per-rep view
with its per-person target (M13-30, M13-17).

**Platform billing is redesigned.** Its tasks and its PRD are deleted; the shipped code runs until
the new pricing replaces it, in a task of its own.

**Blocks 0 and 1 are built.** Their last tasks sit in block 8: `T-FCORE-009` (the data-rights
engine) is parked until the tenant base reaches real paying customers (roughly 10–20);
`T-M01-029` (the demo project seed) needs the lead, design and proposal tables and is parked until the studio; `T-FPLAT-074`
(the projection label) prints the words of the proposal document drawn in block 8. `M01`'s other
four tasks are V2 screens (*What V2 holds*).

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
| every module | `F-core` + `F-platform` (built; their tasks left in block 8 feed only block 8) | permissions, formats, notifications, honesty |

### Recorded: a V1 task whose proof waits on a later block

Each task below sits in one block, and one of its done-when proofs needs a screen or a record that
only exists in a later block — so, as placed, its block cannot finish. Each owes a ruling BEFORE its
own block starts: move the task to the block its proof needs, or move that proof line to the later
task that builds what it needs.

| task | block | waits on | block | the proof step that needs it |
|---|---|---|---|---|

---

## Checking the suite

The invariants in `.claude/protections.md` *Process* hold this file and the task documents.
