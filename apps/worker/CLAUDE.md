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

Model a new area on `modules/platform/` when its steps run here, or on `modules/outbox/` when they
run in the api beside their data (no activity files, the workflow typed against the contract's
activity interface, the registration carrying no activities). Add the area's workflows to
`src/worker.workflows.ts`.

## Commands

```
pnpm --filter @heliogrid/worker dev | build | typecheck
```

## Local conventions

- Every side effect is an activity; idempotent activities and `patched()` for a changed workflow:
  `infra/temporal/README.md` §5–6.
- The workflow type name must equal its exported function name — a mismatch starts, then fails
  every task. Modelling on `modules/platform/` carries the `satisfies` that asserts it.

## Done means

The workflow driven through the api route that starts it, against the local Temporal · idempotency
proven for anything that touches money.

## Traps

- The local Temporal token from `pnpm infra:token` lives 12 hours; the api and worker re-read its file every minute → re-mint it with `pnpm infra:token` when it runs out; a worker that already logged `Request unauthorized` is restarted.
- `dev` reloads the source but runs the BUILT `dist/workflow-bundle.js`, and the bundle reads the compiled `dist/`, so until it is built a workflow edit never runs and its handoff completes doing nothing → after any `*.workflows.ts` change, `pnpm --filter @heliogrid/worker build` (it compiles, then emits the bundle; `build:workflows` alone is not enough), then restart the worker; the `worker` launch configuration builds before it starts.
