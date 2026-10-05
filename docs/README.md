# docs/ — everything written lives here

One folder, four trees. Root holds only `README.md`, `CLAUDE.md` (with `AGENTS.md`, a link to it) and the code.

| | |
|---|---|
| [`start-here.md`](start-here.md) | **Designing a screen.** The one file a design session starts from. |
| [`build-order.md`](build-order.md) | **Building.** The sequence engineering works in. |

## The four trees

| Tree | What it is | Authority |
|---|---|---|
| [`prd/`](prd/) | The product spec — the owner brief, foundations, modules, and the screens register; every row carries its own ruling | **Source of truth** |
| [`ux/`](ux/) | One design brief per screen, plus the Claude Design session context; the boards and decisions records live in the Claude Design project that each task's `DESIGN:` line links, and are read from there — the repo holds no copy | **Source of truth** |
| [`tasks/`](tasks/) | Engineering work, one file per module, derived from the PRD registers | **Source of truth** |
| [`engineering/`](engineering/) | How this repo is built — dissolving into the package files and the tasks; each file carries its fate | Support, ranked below `prd/` |

`CLAUDE.md` §7 fixes the order: `prd/` (a row carries its own ruling) →
`engineering/architecture.md` → contracts. **Nothing in `engineering/` is product truth.** Where the two disagree, `prd/` wins.

## Inside `engineering/`

Every file here is dissolving: its first line names its fate, and the folder's line count only
falls, by review. What holds each protection is `.claude/protections.md`, and each package's live
traps sit under `## Traps` in its own `CLAUDE.md`. External-account setup notes moved to `infra/ops/`.

| Path | What it is, until its fate lands |
|---|---|
| [`engineering/architecture.md`](engineering/architecture.md) | **The spine.** §1 module map · §2 package registry · §3 platform rules · §4 placement. Run §4 before creating any file. |
| [`engineering/data-model.md`](engineering/data-model.md) | The logical data model and ERD, derived from `prd/` and ranked below it; read beside `forward-compat.md` before writing a migration. |
| [`engineering/forward-compat.md`](engineering/forward-compat.md) | What each module's first migration must satisfy. |
| [`engineering/adding-a-language.md`](engineering/adding-a-language.md) | The steps that add a UI language (`F3-26`). |
| [`engineering/17-ui-architecture-v2.md`](engineering/17-ui-architecture-v2.md) | The UI layer: the theme, the primitives, the components, and what holds a port to the design system. |
| [`engineering/02-system-architecture.md`](engineering/02-system-architecture.md) · [`03-tech-stack.md`](engineering/03-tech-stack.md) · [`07-integrations.md`](engineering/07-integrations.md) · [`08-security-and-tenancy.md`](engineering/08-security-and-tenancy.md) · [`09-observability-and-ops.md`](engineering/09-observability-and-ops.md) | How the system runs, the stack and its pins, ports and adapters, the threat model, observability. |
| [`engineering/adr/`](engineering/adr/) | Why each architecture choice was made. Reference only — never a gate. |

Numbered gaps are deliberate. A missing number is a document that was removed — the same
convention `CLAUDE.md` §2 uses for the Laws and `engineering/adr/` uses for ADRs.

## Paths pinned by tooling

Moving one of these breaks a tool silently.

Two invariants read a PRD file: `matrix-mirrors-f2` reads `prd/foundations/F2-roles-and-permissions.md` and `template-keys-mirror-f6` reads
`prd/foundations/F6-notifications-and-search.md`. `.dependency-cruiser.cjs` cites
`engineering/02`, `03`, `07` and `17`, and `biome.json`'s messages cite `engineering/03` and `17`.
