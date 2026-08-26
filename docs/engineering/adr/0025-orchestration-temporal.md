# ADR-0025: Workflow orchestration — Temporal, superseding the BullMQ scaffold

Date: 2026-08-25 · Supersedes the queue row of `docs/engineering/03-tech-stack.md` (BullMQ 5.x + Upstash)

## Context

`apps/worker` carries a BullMQ scaffold: a root connection in `worker.module.ts`, a typed job
envelope in `packages/contracts/src/jobs.ts`, and no processor. Nothing runs on it yet, which
is exactly why the decision is cheap to change now and expensive later.

What the product actually needs from this layer, from the PRD rather than from taste:

- **Multi-step business processes that outlive a request** — proposal → customer link → OTP →
  acceptance → tranche schedule; survey → design → sign-off → return-with-comments; voice call
  → outcome → follow-up. These are not "jobs", they are sequences with state, timers and
  compensation.
- **Time-based rules measured in days** — proposal-unopened-3d, task-overdue-2d, dormant-30d,
  snooze wake-ups. A retry policy is not a substitute for a durable timer.
- **Exactly-once effects on money** — one money path, BOM ↔ proposal ↔ tranches ↔ payments
  reconciling to the currency's minor unit (`CLAUDE.md` §9). A doubled payment record is not a
  retry, it is a defect with a customer on the other end.

BullMQ is a good queue. A queue gives at-least-once delivery of an independent unit of work.
Every multi-step property above then has to be rebuilt by hand: state in the product database,
recovery on restart, idempotency per step, compensation on partial failure, and a way to
change the code without stranding work already in flight. That is an orchestrator, written
badly, one module at a time.

## Decision

**Temporal for orchestration, pinned as a set** (`infra/temporal/README.md` §1): server
1.30.6, admin-tools 1.30.6 (`temporal-sql-tool` 1.30.6, CLI 1.6.1), TypeScript SDK 1.22.0,
PostgreSQL 16 — all by DIGEST.

- **The workflow holds the sequence; activities hold the effects.** Workflows import nothing
  from Node, Nest, the database, HTTP or the environment — they are replayed from history, so
  anything that could answer differently on a second run corrupts them.
- **The product database and Temporal are handed off through an outbox**, never dual-written.
  The event is written in the same transaction as the product change; a dispatcher starts the
  workflow with an id derived from the event id, so every retry is the same workflow.
- **Identity is two halves**: mutual TLS for who, a signed token for what-may. A certificate
  is not a permission.
- **One namespace, 30-day retention, 512 history shards** (immutable), payloads carrying ids
  and never documents or PII.

Rejected alternatives are in §Alternatives; the full decision table, the runbooks and every
measured trap are in `infra/temporal/README.md`.

## Consequences

- **A second stateful system to operate.** Its own PostgreSQL, its own schema tool, its own
  upgrade cadence (one minor at a time), its own certificates to rotate. All four are
  rehearsed rather than described — `infra/temporal/scripts/probe-*.sh`.
- **A single machine is not HA.** Restarts and deploys pause orchestration; persisted workflows
  recover afterwards. Accepted for launch and recorded as a planned limitation, not discovered
  in production.
- **Determinism is a real constraint on how workflow code is written**, and it is enforceable:
  replaying captured histories against new code catches an incompatible change before it
  ships (`spike/probe-replay.mjs`).
- **The built-in authorizer cannot separate an API identity from a worker identity** — both
  need `namespace:write`. Operator is separated; the two services are not. Closing that needs
  a custom authorizer plugin or a private enforcing proxy, and is an open Track 8 decision.
- **Redis is not removed.** BullMQ goes; `REDIS_URL` stays for the rate limiting and SSE that
  `docs/engineering/08` §7 requires.
- Cost: one more always-on machine and its database. Against the alternative — hand-rolled
  orchestration inside thirteen modules — this is the cheaper side.

## Status of the migration

| Track | State |
|---|---|
| 6 · architecture and production-like local spike | **done** — this ADR |
| 7 · code cutover (contracts, gateway, worker) | not started |
| 8 · deployment candidate templates (no hosting) | not started |
| 9 · remove BullMQ compatibility | not started |

**BullMQ is superseded, not removed.** `apps/worker` still runs it and `packages/contracts`
still exports `./jobs`. Track 7 cuts over; Track 9 removes. Until then, do not add a new
BullMQ processor — the target is Temporal.

## Alternatives rejected

- **Keep BullMQ and hand-roll orchestration.** The status quo. Every multi-step property above
  becomes per-module code, and the failure mode is silent: a partially-applied sequence looks
  like a completed one.
- **Graphile Worker / pg-boss** (Postgres-native queues). Removes the Redis dependency and the
  Upstash cost, and is a genuinely good fit for the cron-style sweeps. Same objection as
  BullMQ for the multi-step processes, which are the majority of the work.
- **Temporal Cloud.** Removes the operational burden this ADR accepts. Rejected for launch: it
  is a per-action-priced external dependency requiring an account and a billing decision, and
  the self-hosted path is proven to work on the single machine already planned. Revisit when
  orchestration volume makes the operational cost real rather than theoretical.
- **Step Functions / Durable Functions.** Cloud-provider lock-in, and we are on Fly.

## Sources

- The spike, its measurements and its runbooks: `infra/temporal/README.md`
- Proof scripts: `infra/temporal/scripts/probe-*.sh`, `infra/temporal/spike/probe-*.mjs`
