# @heliogrid/worker — NestJS standalone: durable orchestration and heavy compute

Deps: `architecture.md` §2 apps/worker. Orchestration is Temporal (ADR-0025); the local stack, its
runbooks and traps are in `infra/temporal/README.md`. No HTTP surface.

## Folder shape

```
src/{config,common,modules}
src/worker.workflows.ts                        the bundle's ONE entry: re-exports every area's workflows
src/modules/<area>/<area>.workflows.ts         DETERMINISTIC. The sequence.
                   <area>.public.ts            what the root composes; asserts the name match
                   <area>.activities.types.ts  only where the steps run here: their signatures
                   <area>.activities.ts        only where the steps run here: the side effects
src/modules/import/import.phases.ts            the spreadsheet imports' one phase sequence; no workflow of its own
```

Copy `modules/platform/` for a new area whose steps run here, `modules/outbox/` for one whose
steps run in the api beside their data — no activity files, the workflow typed against the
contract's activity interface, the registration carrying no activities. Add the area's workflows
to `src/worker.workflows.ts`.

## Commands

```
pnpm --filter @heliogrid/worker dev | build | typecheck    # build also emits the workflow bundle
```

## Local conventions

- **A workflow is replayed from its history,** so its sequence of steps is fixed for every run in
  flight: changing what a deployed workflow does — a step added, removed or reordered — goes behind
  `patched()` from `@temporalio/workflow`, or a running workflow fails on replay. Every side effect
  is an activity.
- **An activity is retried, so it is idempotent:** key the effect and use
  `INSERT … ON CONFLICT DO NOTHING`.
- The workflow type name must equal its exported function name — a mismatch starts, then fails
  every task. Copying `modules/platform/` carries the `satisfies` that asserts it.

## Done means

The workflow driven through the api route that starts it, against the local Temporal · idempotency
proven for anything that touches money.

## Traps

- The local Temporal token lives an hour (`pnpm infra:token`) and a running worker never reads it again, so a worker up for longer stops on `Request unauthorized` and every workflow after it — an invite's message, a handover pack — waits with no error on the screen → `pnpm infra:token`, then restart the worker, before a QA round or a seed that outlasts it.
- `dev` reloads the source but runs the BUILT `dist/workflow-bundle.js`, so a workflow edit never runs: a new branch of a workflow is missing from the bundle, and its handoff completes doing nothing with no error → after any `*.workflows.ts` change, `pnpm --filter @heliogrid/worker build` (the bundle reads the compiled `dist/`, so `build:workflows` alone is not enough), then restart the worker.
