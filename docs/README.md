# docs/ — everything written lives here

One folder, four trees. Root holds only `README.md`, `CLAUDE.md` and the code.

| | |
|---|---|
| [`start-here.md`](start-here.md) | **Designing a screen.** The one file a design session starts from. |
| [`build-order.md`](build-order.md) | **Building.** The sequence engineering works in. |

## The four trees

| Tree | What it is | Authority |
|---|---|---|
| [`prd/`](prd/) | The product spec — foundations, modules, and the registers carrying owner rulings | **Source of truth** |
| [`ux/`](ux/) | One design brief per screen, plus the Claude Design session context | **Source of truth** |
| [`tasks/`](tasks/) | Engineering work, one file per module, derived from the PRD registers | **Source of truth** |
| [`engineering/`](engineering/) | How this repo is built — architecture, stack, integrations, ADRs | Support, ranked below `prd/` |

`CLAUDE.md` §7 fixes the order: owner rulings → `prd/` → `engineering/architecture.md` →
contracts. **Nothing in `engineering/` is product truth.** Where the two disagree, `prd/` wins.

## Inside `engineering/`

| Path | Status | What it is |
|---|---|---|
| [`engineering/architecture.md`](engineering/architecture.md) | **PINNED** | **The spine.** §1 module map · §2 package registry · §3 platform rules · §4 placement. Run §4 before creating any file. |
| [`engineering/17-ui-architecture-v2.md`](engineering/17-ui-architecture-v2.md) | **PINNED** | The UI layer. `scripts/ds-check.mjs`, `scripts/ds-contract.mjs` and `knip.jsonc` name this path. |
| [`engineering/forward-compat.md`](engineering/forward-compat.md) | **PINNED** | What each module's first migration must satisfy. The PR template requires it. |
| [`engineering/02-system-architecture.md`](engineering/02-system-architecture.md) | LIVE | How the system runs — request path, tenancy, background work, storage, studio data flow, market packs. |
| [`engineering/03-tech-stack.md`](engineering/03-tech-stack.md) | LIVE | Every technology choice, its pin, and what lost. |
| [`engineering/07-integrations.md`](engineering/07-integrations.md) | LIVE | Ports and adapters — 14 external systems behind interfaces we own. |
| [`engineering/08-security-and-tenancy.md`](engineering/08-security-and-tenancy.md) | LIVE | Threat model, three-layer tenant isolation, credentials, residency. |
| [`engineering/09-observability-and-ops.md`](engineering/09-observability-and-ops.md) | LIVE | Logging, tracing, metrics, and the Postgres runbook. |
| [`engineering/adr/`](engineering/adr/) | LIVE | Why each architecture choice was made. Reference only — never a gate. |
| [`engineering/ops/`](engineering/ops/) | LIVE | External-account setup state and what is blocked on company registration. |
| [`engineering/harness/`](engineering/harness/) | LIVE | The render harness that proves `packages/ui` mounts. |

Numbered gaps are deliberate. A missing number is a document that was removed — the same
convention `CLAUDE.md` §2 uses for the Laws and `engineering/adr/` uses for ADRs.

## Paths pinned by tooling

Moving one of these breaks a gate silently.

`scripts/gates.py` routes every spec path through one `spec()` helper — change `SPEC_DIR`
there, not twenty-two literals. It and `scripts/next-screen.py` read `prd/registers/screens.md`,
`traceability.md`, `open-questions.md`, `ux/briefs/`, `ux/claude-design-context.md`,
`tasks/*.md` and `start-here.md`. `engineering/17-ui-architecture-v2.md` is named by two
scripts and `knip.jsonc`. `engineering/forward-compat.md` is named by the PR template.
`.dependency-cruiser.cjs` cites `engineering/03 §3`; `apps/worker/CLAUDE.md` cites
`engineering/03 §7`; `apps/api/CLAUDE.md` and `apps/worker/CLAUDE.md` cite `engineering/02 §2`.

`superpowers/` holds the design specs and implementation plans for this repo's own
process work. It is graphify-ignored and cited by nothing.
