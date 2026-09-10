# docs/ — everything written lives here

One folder, four trees. Root holds only `README.md`, `CLAUDE.md` and the code.

| | |
|---|---|
| [`start-here.md`](start-here.md) | **Designing a screen.** The one file a design session starts from. |
| [`build-order.md`](build-order.md) | **Building.** The sequence engineering works in. |

## The four trees

| Tree | What it is | Authority |
|---|---|---|
| [`prd/`](prd/) | The product spec — the owner brief, foundations, modules, and the screens register; every row carries its own ruling | **Source of truth** |
| [`ux/`](ux/) | One design brief per screen, plus the Claude Design session context; the exported artboards and decisions records live in `HelioGrid-UX/` at the repo root, ignored by git — each machine holds its own export | **Source of truth** |
| [`tasks/`](tasks/) | Engineering work, one file per module, derived from the PRD registers | **Source of truth** |
| [`engineering/`](engineering/) | How this repo is built — dissolving into the package files and the tasks; each file carries its fate | Support, ranked below `prd/` |

`CLAUDE.md` §7 fixes the order: `prd/` (a row carries its own ruling) →
`engineering/architecture.md` → contracts. **Nothing in `engineering/` is product truth.** Where the two disagree, `prd/` wins.

## Inside `engineering/`

Every file here is dissolving: its first line names its fate, and the folder's line count only
falls (`M107`). The two agent ledgers moved to `.claude/` — `mechanisms.md` (what holds each rule)
and `landmines.md` (live traps). External-account setup notes moved to `infra/ops/`.

| Path | What it is, until its fate lands |
|---|---|
| [`engineering/architecture.md`](engineering/architecture.md) | **The spine.** §1 module map · §2 package registry · §3 platform rules · §4 placement. Run §4 before creating any file. |
| [`engineering/data-model.md`](engineering/data-model.md) | The logical data model and ERD, derived from `prd/` and ranked below it; `/migration` step 1 reads it beside `forward-compat.md`. |
| [`engineering/forward-compat.md`](engineering/forward-compat.md) | What each module's first migration must satisfy. |
| [`engineering/17-ui-architecture-v2.md`](engineering/17-ui-architecture-v2.md) | The UI layer. `scripts/ds-contract.mjs` names this path. |
| [`engineering/02-system-architecture.md`](engineering/02-system-architecture.md) · [`03-tech-stack.md`](engineering/03-tech-stack.md) · [`07-integrations.md`](engineering/07-integrations.md) · [`08-security-and-tenancy.md`](engineering/08-security-and-tenancy.md) · [`09-observability-and-ops.md`](engineering/09-observability-and-ops.md) | How the system runs, the stack and its pins, ports and adapters, the threat model, observability. |
| [`engineering/adr/`](engineering/adr/) | Why each architecture choice was made. Reference only — never a gate. |

Numbered gaps are deliberate. A missing number is a document that was removed — the same
convention `CLAUDE.md` §2 uses for the Laws and `engineering/adr/` uses for ADRs.

## Paths pinned by tooling

Moving one of these breaks a gate silently.

`scripts/gates.py` routes every spec path through one `spec()` helper — change `SPEC_DIR`
there, not twenty-two literals. It and `scripts/next-screen.py` read `prd/registers/screens.md`,
`ux/briefs/`, `ux/claude-design-context.md`,
`tasks/*.md` and `start-here.md`. `engineering/17-ui-architecture-v2.md` is named by two
scripts. `engineering/forward-compat.md` and
`engineering/data-model.md` are both named by the `/migration` skill's first step.
`.dependency-cruiser.cjs` cites `engineering/03 §3`; `apps/worker/CLAUDE.md` cites
`engineering/03 §7`; `apps/api/CLAUDE.md` and `apps/worker/CLAUDE.md` cite `engineering/02 §2`.
