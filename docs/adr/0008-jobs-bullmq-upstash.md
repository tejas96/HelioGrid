# ADR-0008: Background jobs — BullMQ + @nestjs/bullmq on Upstash Redis (fixed plan, eviction off)

Date: 2026-07-24

## Context

Job load: shading simulations at scale, Playwright PDF renders, CSV imports, voice-agent post-processing, and repeatable cron triggers (proposal-unopened-3d, task-overdue-2d, snooze wake-ups, dormant sweep). The original research pick was Graphile Worker (Postgres-native, no Redis). Two later binding directives changed the calculus: the backend is NestJS (ADR-0002) and infrastructure is Fly-native (ADR-0006/0007) — where Upstash Redis is the blessed extension, available in `bom`.

## Decision

**BullMQ via `@nestjs/bullmq`, on Upstash Redis (Fly extension, `bom`) with a FIXED plan.** Non-negotiable configuration:

- **Eviction OFF** (Upstash default) — any eviction policy breaks BullMQ, which requires `noeviction`.
- **Fixed plan, not pay-as-you-go** — Fly explicitly recommends fixed plans for BullMQ because its polling inflates per-request PAYG billing.
- TCP/RESP endpoint (not the REST API); `maxRetriesPerRequest: null`.
- Repeatable jobs cover cron; no separate scheduler infrastructure.
- Heavy CPU work runs in `apps/worker` (NestJS standalone) in `worker_threads`, on dedicated larger Machines with `autostop="off"` — the queue is never the bottleneck, the compute is.

## Consequences

- NestJS-idiomatic processors, decorators and DI — the path every agent already knows from `apps/api`.
- Redis becomes a hard runtime dependency and a second stateful service; the fixed plan is a flat monthly cost ($10/mo at 250MB upward) regardless of load.
- Upstash also serves rate limiting, so the dependency is amortised across two concerns.
- Job state lives outside Postgres: a queue drain + DB restore are two separate recovery procedures (runbook item).

## Alternatives rejected

- **Graphile Worker** — the pre-directive pick (jobs in Postgres, `SKIP LOCKED`, sub-5ms, built-in cron, no Redis). Rejected after the directives: not NestJS-idiomatic (hand-rolled integration vs `@nestjs/bullmq`), and once Upstash is in the stack anyway the "no Redis" advantage evaporates — while adding job churn to the deprecated postgres-flex we must nurse ourselves.
- **pg-boss** — same shape as Graphile with lower throughput; same rejection.
- **Fly Cron Manager** — isolated machine per job is heavier than repeatable jobs inside the always-on worker.

## Sources

- `../research/verify-flyNative.md` (Upstash+BullMQ verification, eviction/plan guidance) · `../research/backend.md` (Graphile original pick) · `../research/fly.md`
- https://fly.io/docs/upstash/redis/ · https://upstash.com/docs/redis/integrations/bullmq · https://docs.bullmq.io/guide/going-to-production
- https://worker.graphile.org/docs/performance
