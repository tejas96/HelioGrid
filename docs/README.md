# docs/ — the map

`docs/` describes **how this repo is built**. What the product *does* lives in `prd/`.
That split is Law: a product rule never lands in a file here.

Every entry below carries a status. Read it before you read the file.

| Status | Meaning |
|---|---|
| **LAW** | A gate, script or rule reads this exact path. Do not move or rename it. |
| **LIVE** | Current and citable. Some carry their own scope banner — read it. |
| **SUPERSEDED** | Content removed; the file survives only so old links resolve. Never cite one in new work. |
| **ARCHIVE** | Frozen history under `archive/`. Read for *why*, never for *what is true now*. |

## The three you actually need

| File | Status | What it is |
|---|---|---|
| [`architecture.md`](architecture.md) | **LAW** | **The spine.** §1 map · §2 package registry · §3 platform rules · §4 placement. Run §4 before creating any file. |
| [`17-ui-architecture-v2.md`](17-ui-architecture-v2.md) | **LAW** | UI architecture V2 — tokens, theme, component layer. `scripts/ds-check.mjs`, `scripts/ds-contract.mjs` and `knip.jsonc` name this path. |
| [`forward-compat.md`](forward-compat.md) | **LAW** | What each module's first migration must satisfy. The PR template requires it. |

## Reference

| Path | Status | What it is |
|---|---|---|
| [`02-system-architecture.md`](02-system-architecture.md) | LIVE | Target system. Its banner warns: design record, not repo state. |
| [`03-tech-stack.md`](03-tech-stack.md) | LIVE | Every technology choice, its version pin, and what lost. |
| [`04-data-model.md`](04-data-model.md) | LIVE | The multi-tenant schema. Frozen design (Law 9), not repo state. |
| [`05-domain-migration.md`](05-domain-migration.md) | LIVE | The plan for porting the studio into `packages/domain`. |
| [`07-integrations.md`](07-integrations.md) | LIVE | Ports and adapters — every external system behind an interface we own. |
| [`08-security-and-tenancy.md`](08-security-and-tenancy.md) | LIVE | Tenancy model, RLS backstop, auth posture. |
| [`09-observability-and-ops.md`](09-observability-and-ops.md) | LIVE | Logging, tracing, metrics, and the Postgres runbook. |
| [`adr/`](adr/) | LIVE | Why each architecture choice was made. Reference only — never a gate. |
| [`ops/`](ops/) | LIVE | External-account setup state (Firebase, MSG91, Razorpay) and what is blocked on company registration. |
| [`product/`](product/) | LIVE | Vendored product truth — the journey map and the binding studio tool census. |
| [`harness/`](harness/) | LIVE | The render harness that proves `packages/ui` actually mounts. |

## Superseded — pointers only

`00-vision-and-scope` · `01-business-model` · `06-offline-and-sync` ·
`10-i18n-and-design-system` · `11-scale-program` · `12-competitive-gaps` ·
`13-ux-gap-register` · `14-build-roadmap` · `15-spec-resolutions` ·
`16-billing-and-entitlements`

Retired 2026-08-19 when the V2 PRD suite replaced them. Each is a ~9-line pointer kept
because live files, CI steps and native code comments still cite them by number
(`docs/13 UXG-26`, `docs/10 §7.2`). **The content is in `prd/`.** Deleting these means
re-pointing every citation first.

## [`archive/`](archive/) — frozen history

| Path | What it is |
|---|---|
| [`archive/research/`](archive/research/) | The exploration corpus behind the original decisions. Each file carries its own status banner. |
| [`archive/spikes/`](archive/spikes/) | Week-1 verification spikes S1–S6 and their verdicts. |
| [`archive/offline-removal/`](archive/offline-removal/) | The 2026-08-07 offline/sync removal — executed, kept as the record. |
| [`archive/design/`](archive/design/) | The design-system gap register, closed 2026-08-17. |

## Outside docs/

| Path | What it is |
|---|---|
| [`../prd/`](../prd/) | **The product spec.** Foundations F1–F8, modules M01–M13, and the registers. Product law lives here, never in `docs/`. |
| [`../ux/`](../ux/) | One design brief per screen, plus the Claude Design session context. |
| [`../tasks/`](../tasks/) | Engineering tasks, one file per module. |
| [`../START-HERE.md`](../START-HERE.md) | The design loop — where a screen session starts. |
| [`../BUILD-ORDER.md`](../BUILD-ORDER.md) | The build sequence engineering works in. |
| [`../CLAUDE.md`](../CLAUDE.md) | The constitution. |

## Paths pinned by tooling

Moving one of these breaks a gate silently. `scripts/gates.py` and `scripts/next-screen.py`
read `prd/registers/screens.md`, `prd/registers/traceability.md`,
`prd/registers/open-questions.md`, `ux/briefs/`, `ux/claude-design-context.md` and
`tasks/README.md`. `docs/17-ui-architecture-v2.md` is named by two scripts and `knip.jsonc`.
`docs/forward-compat.md` is named by the PR template.
