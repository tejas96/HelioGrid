# @heliogrid/worker — NestJS standalone: BullMQ processors + heavy compute

## What lives here / what must never live here
- BullMQ processors (typed payloads from @heliogrid/contracts/jobs — the authoritative
  job list is `jobs.ts`, not this file), repeatable jobs (overdue/unopened nudges, snooze
  wake, partition upkeep, purges), worker_threads for shading + Playwright PDF.
- NEVER: an HTTP surface, business rules that belong in packages/domain, direct calls
  into another module's repositories.

## Commands
`dev` and `start` pass `--env-file-if-exists=../../.env.local`, so local values load
automatically and a REAL env var still wins (Fly secrets and CI are never overridden).
pnpm --filter @heliogrid/worker dev | build | typecheck
REDIS_URL unset ⇒ boots in idle scaffold mode (no queue connection).

## Depends on / depended on by
uses: @heliogrid/contracts (jobs.ts), @heliogrid/db        used by: nobody

## Local conventions
- **This app is still a scaffold.** `src/` holds only `main.ts`, `worker.module.ts` and
  `config/` — there are no modules, processors or schedulers yet. The TARGET layout, adopted
  when the first one lands, mirrors apps/api (docs/02 §2): `src/{config,common,modules,scripts}`,
  one `src/modules/<m>/` per context, plus `<m>.processor.ts` (one per queue) and
  `<m>.scheduler.ts`. Copy the shape from an existing `apps/api/src/modules/<m>/`.
- **A processor holds no logic** — parse the payload schema, take the idempotency key,
  delegate to the service, return. Same db/drizzle fence as the api: `*.repository.ts` only.
- `bullmq`/`@nestjs/bullmq` are importable only from processors, schedulers, `common/queue/`
  and `worker.module.ts` (dep-cruiser `bullmq-fenced`) — a module never builds a Queue itself.
- Every job: typed payload schema in contracts/jobs.ts + idempotency key; handlers are
  idempotent — a retried job must not double-apply (money jobs especially).
- Queue prefix `heliogrid`; queue names namespaced by area.
- BullMQ connection: `maxRetriesPerRequest: null`, TCP endpoint, eviction OFF (Upstash
  fixed plan) — these are binding (docs/03 §7).

## Landmines
- Webhook processing (Razorpay/Exotel) happens HERE, not in the api: verify → dedupe on
  provider event id → enqueue → 2xx fast is the api's job; the worker applies effects.
- The Dockerfile gains Chromium + fonts-noto with the PDF port (Track B — NOT landed yet;
  no Chromium layer exists today) — RAM budget 300–500 MB per render process, pooled.

## Definition of done here
Processor verified against a real queue (or documented scaffold-idle) · typecheck/lint
green · idempotency proven for money-touching jobs (invariant set).
