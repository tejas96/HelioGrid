# @heliogrid/worker — NestJS standalone: durable orchestration and heavy compute

Deps: `architecture.md` §2 apps/worker. Orchestration is Temporal (ADR-0025); the local stack, its
runbooks and traps are in `infra/temporal/README.md`.

## What lives here / what must never live here

- NEVER: an HTTP surface, or a reach into another module except through its `<area>.public.ts`.

## Folder shape

```
src/{config,common,modules}
src/modules/<area>/<area>.workflows.ts         DETERMINISTIC. The sequence.
                   <area>.activities.types.ts  the activity signatures, and nothing else
                   <area>.activities.ts        the side effects. Idempotent, always.
                   <area>.public.ts            what the root composes; asserts the name match
```

Copy `modules/platform/` for a new area.

## Commands

```
pnpm --filter @heliogrid/worker dev | build | typecheck    # build also emits the workflow bundle
```

## Local conventions

- **A workflow is replayed from history:** no `Date.now()`, `Math.random()`, `fetch` or database
  in `*.workflows.ts` — time comes from the workflow clock and every side effect from an activity.
- A workflow imports activity signatures type-only from `*.activities.types.ts`, never
  `*.activities.ts` — that drags the database driver into the workflow sandbox.
- **An activity is retried, so it is idempotent:** key the effect and use
  `INSERT … ON CONFLICT DO NOTHING`.
- Workflow names and payloads live in `@heliogrid/contracts/workflows` — a contract between api
  and worker, like an HTTP route.
- The workflow type name must equal its exported function name — a mismatch starts, then fails
  every task, with no type error. Each `<area>.public.ts` asserts it with `satisfies`.
- A module hands the host a `TemporalWorkerRegistration`; only `common/temporal` opens the
  Temporal connection.

## Done means

The workflow driven through the api route that starts it, against the local Temporal · idempotency
proven for anything that touches money.
