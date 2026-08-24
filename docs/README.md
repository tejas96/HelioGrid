# docs/ — the map

`docs/` describes **how this repo is built**. What the product *does* is `prd/`.

**Nothing in `docs/` is product truth.** Where `docs/` and `prd/` disagree, `prd/` wins —
`CLAUDE.md` §7 fixes the order: owner rulings → `prd/` → `docs/architecture.md` → contracts.

| Status | Meaning |
|---|---|
| **PINNED** | A script or template reads this exact path. Do not move or rename it. |
| **LIVE** | Current engineering reference, ranked below `prd/`. |

| Path | Status | What it is |
|---|---|---|
| [`architecture.md`](architecture.md) | **PINNED** | **The spine.** §1 module map · §2 package registry · §3 platform rules · §4 placement. Run §4 before creating any file. |
| [`17-ui-architecture-v2.md`](17-ui-architecture-v2.md) | **PINNED** | The UI layer. `scripts/ds-check.mjs`, `scripts/ds-contract.mjs` and `knip.jsonc` name this path. |
| [`forward-compat.md`](forward-compat.md) | **PINNED** | What each module's first migration must satisfy. The PR template requires it. |
| [`02-system-architecture.md`](02-system-architecture.md) | LIVE | How the system runs — request path, tenancy, background work, realtime, storage, studio data flow, market packs. |
| [`03-tech-stack.md`](03-tech-stack.md) | LIVE | Every technology choice, its pin, and what lost. |
| [`07-integrations.md`](07-integrations.md) | LIVE | Ports and adapters — 14 external systems behind interfaces we own. |
| [`08-security-and-tenancy.md`](08-security-and-tenancy.md) | LIVE | Threat model, three-layer tenant isolation, credentials, residency. |
| [`09-observability-and-ops.md`](09-observability-and-ops.md) | LIVE | Logging, tracing, metrics, and the Postgres runbook. |
| [`adr/`](adr/) | LIVE | Why each architecture choice was made. Reference only — never a gate. |
| [`ops/`](ops/) | LIVE | External-account setup state and what is blocked on company registration. |
| [`harness/`](harness/) | LIVE | The render harness that proves `packages/ui` mounts. |

Numbered gaps are deliberate. A missing number is a document that was removed — the same
convention `CLAUDE.md` §2 uses for the Laws, and `docs/adr/` uses for ADRs.

## Outside docs/

| Path | What it is |
|---|---|
| [`../prd/`](../prd/) | **The product spec.** Foundations, modules, and the registers carrying owner rulings. |
| [`../ux/`](../ux/) | One design brief per screen, plus the Claude Design session context. |
| [`../tasks/`](../tasks/) | Engineering tasks, one file per module. |
| [`../START-HERE.md`](../START-HERE.md) | The design loop. |
| [`../BUILD-ORDER.md`](../BUILD-ORDER.md) | The build sequence. |
| [`../CLAUDE.md`](../CLAUDE.md) | The constitution. |

## Paths pinned by tooling

Moving one of these breaks a gate silently. `scripts/gates.py` and `scripts/next-screen.py`
read `prd/registers/screens.md`, `traceability.md`, `open-questions.md`, `ux/briefs/`,
`ux/claude-design-context.md` and `tasks/README.md`. `docs/17-ui-architecture-v2.md` is named
by two scripts and `knip.jsonc`. `docs/forward-compat.md` is named by the PR template.
`.dependency-cruiser.cjs` cites `docs/03 §3`; `apps/worker/CLAUDE.md` cites `docs/03 §7`;
`apps/api/CLAUDE.md` and `apps/worker/CLAUDE.md` cite `docs/02 §2`.
