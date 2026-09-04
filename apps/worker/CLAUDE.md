# @heliogrid/worker — NestJS standalone: durable orchestration and heavy compute

Runs TEMPORAL (ADR-0025); BullMQ is gone and re-adding it is a build failure. The local stack,
its runbooks and its measured traps live in `infra/temporal/README.md`. Repo traps:
`docs/engineering/landmines.md` · deps: `architecture.md` §2 apps/worker.

## What lives here / what must never live here

- Deterministic WORKFLOWS and their ACTIVITIES, one folder per business area; worker_threads for
  shading and Playwright PDF.
- NEVER: an HTTP surface, business rules that belong in `packages/domain`, a direct call into
  another module's repositories, or a second Temporal connection.

## Folder shape — a closed set; never invent a folder

```
src/{config,common,modules}
src/modules/<area>/<area>.workflows.ts         DETERMINISTIC. The sequence.
                   <area>.activities.types.ts  the activity signatures, and nothing else
                   <area>.activities.ts        the side effects. Idempotent, always.
                   <area>.public.ts            what the root composes; asserts the name match
```

`platform` is the only area today and is the shape to copy.

## Commands

`dev` and `start` pass `--env-file-if-exists=../../.env.local`, so a REAL env var still wins.

```
pnpm --filter @heliogrid/worker dev | build | typecheck    # build also emits the workflow bundle
pnpm infra:up                                              # the local Temporal stack
```

## Local conventions

- **A workflow is REPLAYED from history**, so anything that could answer differently on a second
  run corrupts it: no `Date.now()`, no `Math.random()`, no `process.env`, no `fetch`, no database.
- **The types file is the seam.** A workflow imports the activity SIGNATURES type-only from
  `*.activities.types.ts`, never the implementations — the bundle is built from the workflow's
  import graph, and importing the implementation drags the database driver into a sandbox that
  must not have one.
- **An activity is retried, so it must be idempotent.** Key the effect and use
  `INSERT … ON CONFLICT DO NOTHING`. A retry that double-applies is the defect the whole retry
  model rests on not having.
- **The workflow message schemas live in `@heliogrid/contracts/workflows`**, not here: the API
  starts workflows and this app executes them, so names and payloads are a contract between two
  processes exactly like an HTTP route.
- **The workflow TYPE name must equal the exported function name.** Temporal resolves by exported
  name, and a mismatch is not a type error — it is a workflow that starts and then fails every
  task. Each `<area>.public.ts` asserts it with `satisfies`.
- **One Temporal connection per process**, owned by `common/temporal`. A module hands the host a
  `TemporalWorkerRegistration`; `common/` never imports a module.
- Provider webhook processing (Razorpay, Exotel) happens HERE, not in the api: the api verifies,
  dedupes on the provider event id, hands off durably and answers 2xx fast; this app applies the
  effects.

## Done means

The processor driven against a real queue (or documented scaffold-idle) · typecheck and lint
green · idempotency proven for anything that touches money.
