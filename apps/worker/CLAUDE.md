# @heliogrid/worker — NestJS standalone: durable orchestration + heavy compute

> **This app runs TEMPORAL (ADR-0025). BullMQ is GONE** — the dependency was removed in the
> Track 7 cutover, and `no-bullmq` in `.dependency-cruiser.cjs` makes re-adding it a build
> failure. The decisions, the runbooks and every measured trap are in
> `infra/temporal/README.md`; run the local stack from there.

## What lives here / what must never live here
- Deterministic WORKFLOWS and their ACTIVITIES, one folder per business area under
  `src/modules/<area>/`; worker_threads for shading + Playwright PDF.
- NEVER: an HTTP surface, business rules that belong in packages/domain, direct calls
  into another module's repositories, a second Temporal connection.

## The three files a business area has
```
src/modules/<area>/<area>.workflows.ts        DETERMINISTIC. The sequence.
src/modules/<area>/<area>.activities.types.ts the activity signatures, and nothing else
src/modules/<area>/<area>.activities.ts       the side effects. Idempotent, always.
src/modules/<area>/<area>.public.ts           what the root composes; asserts the name match
```

- **A workflow is REPLAYED from history** every time a worker picks it up, so anything that
  could answer differently on a second run corrupts it: no `Date.now()`, no `Math.random()`,
  no `process.env`, no `fetch`, no database. Two dep-cruiser rules hold the import half
  (`workflows-are-deterministic`, `workflows-take-no-core-modules`); the replay gate catches
  the rest.
- **The types file is the seam.** A workflow imports the activity SIGNATURES type-only from
  `*.activities.types.ts`, never the implementations — the workflow bundle is built from the
  workflow's import graph, and importing the implementation drags the database driver into a
  sandbox that must not have one.
- **An activity is retried, so it must be idempotent.** A retry that double-applies is the
  defect the whole retry model rests on not having. Key the effect and use
  `INSERT … ON CONFLICT DO NOTHING`.

## Folder shape

```
src/{config,common,modules}
src/modules/<m>/            one folder per module, four files:
  <m>.module.ts  <m>.controller.ts  <m>.service.ts  <m>.repository.ts
```

Never invent a folder: this tree is a closed set. Same shape as `apps/api`.

## Commands
`dev` and `start` pass `--env-file-if-exists=../../.env.local`, so local values load
automatically and a REAL env var still wins (Fly secrets and CI are never overridden).
pnpm --filter @heliogrid/worker dev | build | typecheck
`build` runs tsc AND `build:workflows` — the workflow bundle is a BUILD artifact and the
worker refuses to start without it.
The local Temporal stack: `pnpm infra:up`.

## Dependency policy
docs/engineering/architecture.md §2 apps/worker.

## Local conventions
- Layout mirrors apps/api (docs/engineering/02 §2): `src/{config,common,modules,scripts}`.
  `platform` is the only business area today and is the shape to copy.
- **The workflow message schemas live in `@heliogrid/contracts/workflows`**, not here. The API
  starts workflows and this app executes them, so the names and payloads are a contract
  between two processes exactly like an HTTP route is.
- **The workflow TYPE name must equal the exported function name.** Temporal resolves a
  workflow by exported name; a mismatch is not a type error, it is a workflow that starts and
  then fails every task with *"no such function is exported by the workflow bundle"*. Each
  module's `<area>.public.ts` asserts it with `satisfies`, so drift is a compile error.
- **One Temporal connection per process**, owned by `common/temporal` and fenced by
  dep-cruiser `temporal-client-fenced`. A module hands the host a
  `TemporalWorkerRegistration`; `common/` never imports a module.
- **REDIS_URL is gone from this app.** It existed for BullMQ. Redis stays in the product for
  rate limiting and SSE (docs/engineering/08 §7) — those are API concerns.

## Landmines
- **Shutdown must never throw.** `Worker.shutdown()` raises `IllegalStateError: Not running.
  Current state: DRAINING` when a drain is already under way — a second SIGTERM, or a
  supervisor signalling the group. A throwing shutdown hook leaves Nest's sequence unfinished
  and the process hanging until the platform kills it, abandoning exactly the in-flight
  activities the drain exists to protect. Hit 2026-08-26.
- **`fly.toml`'s `kill_timeout` (120s) must exceed the longest activity.** The workflows are
  durable and lose nothing either way; the activity mid-effect is what is at risk.
- Provider webhook processing (payment/telephony adapters — Razorpay/Exotel today) happens
  HERE, not in the api: verify → dedupe on
  provider event id → hand off durably → 2xx fast is the api's job; the worker applies effects.
- The Dockerfile gains Chromium + fonts-noto with the PDF port (Track B — NOT landed yet;
  no Chromium layer exists today) — RAM budget 300–500 MB per render process, pooled.

## Definition of done here
Processor verified against a real queue (or documented scaffold-idle) · typecheck/lint
green · idempotency proven for money-touching jobs (invariant set).
