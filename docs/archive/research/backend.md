> **⚠ OVERTURNED — DO NOT FOLLOW.** This file recommends **Hono + oRPC + Graphile Worker and explicitly rejects NestJS**. That direction was reversed by the verify-nestContracts spike. **The shipped stack is NestJS + ts-rest + BullMQ** — ADR-0003, ADR-0008. Retained ONLY as considered-alternatives evidence for those ADRs. Read standalone, it hands you the wrong stack.

# HelioGrid Backend Architecture — Recommendation (verified July 2026)

## THE RECOMMENDATION (one coherent combo)

**Separate Hono API service + oRPC (contract-first) + Zod v4 + Drizzle ORM + Postgres RLS + Graphile Worker + SSE**, deployed as Fly process-groups (`web`, `api`, `worker`) in Mumbai (`bom`). Next.js stays a pure frontend/BFF; it does **not** own domain logic.

This is the combination that maximizes AI-agent reliability: every boundary is an explicit, machine-verifiable artifact (an oRPC contract, a Zod schema, a Drizzle SQL table, a typed job payload) with codegen and no hidden runtime magic. Agents can diff, test, and regenerate each layer independently.

## Why a separate API, not Next.js-only

Server Actions and route handlers only serve the **web**. Expo/React Native cannot call server actions — there is no SSR/RSC bridge to native, so mobile *must* have a real HTTP API ([Expo/Next docs](https://docs.expo.dev/guides/using-nextjs/)). You also have four other non-web consumers: tokenised public customer links, telephony/WhatsApp webhook receivers, background workers, and a future public API. All five want one stable, versionable, documented HTTP surface. Putting domain logic in server actions would force you to rebuild it for mobile — the opposite of "share the TS domain." So: standalone API service; Next.js consumes it (route handlers only for cookie/session BFF).

## Contract layer: oRPC (reject tRPC and ts-rest)

**oRPC** uniquely gives you *both* tRPC-style end-to-end inference **and** a real OpenAPI 3.1 document from the same contract ([why-oRPC](https://orpc.dev/), [contract-first](https://medium.com/@mustafaskyer/contract-first-development-orpc-7a64df3dc743)). That single fact resolves every surface:
- Expo consumes typed clients via `@orpc/tanstack-query` (same TanStack Query you'd use on web) — [npm](https://www.npmjs.com/package/@orpc/tanstack-query).
- The public API + webhook contracts are the emitted OpenAPI spec, consumable by non-TS callers and Scalar docs.
- Contract-first means the `@contract` package is the machine-checkable source of truth an agent edits first, then implements against — the strongest possible codegen/testability story.

**tRPC v11** rejected: procedure-first, **cannot emit OpenAPI**, so your public API/webhooks/non-TS clients get nothing ([StarterPick 2026](https://starterpick.com/guides/trpc-v11-vs-orpc-vs-ts-rest-type-safe-rpc-saas-boilerplates-2026)). **ts-rest** rejected: REST+OpenAPI but weaker momentum and no RPC ergonomics vs oRPC ([PkgPulse](https://www.pkgpulse.com/guides/orpc-vs-trpc-vs-hono-rpc-type-safe-apis-2026)). Raw zod-openapi (spec-first) rejected: you hand-maintain the type↔spec link; oRPC generates it.

## Framework: Hono (reject NestJS, Fastify acceptable)

**Hono** is web-standard, tiny, fast, runs natively on Node/Fly, and is oRPC's cleanest host ([Encore](https://encore.dev/articles/nestjs-vs-fastify-vs-hono)). Its explicit, low-magic style suits agents. **NestJS** rejected: DI/decorator/module magic is exactly the implicit indirection that trips up agent editing, and it's heavyweight for a contract-driven API. **Fastify** is a fine alternative (schema-native, proven throughput) if you prefer maturity — oRPC has a Fastify adapter too — but Hono's Web-Standards portability wins.

## ORM: Drizzle (reject Prisma 7, though it's close now)

**Drizzle** is SQL-first, so Postgres **Row-Level Security** for multi-tenancy is natural — you set `app.current_tenant` per transaction and enforce isolation in the DB, in production at thousands of QPS ([ECOSIRE RLS](https://ecosire.com/blog/drizzle-orm-postgres-rls-multitenancy)). It leads on runtime perf/bundle and is fully explicit (agents read the exact SQL). `drizzle-zod`'s `createInsertSchema`/`createSelectSchema` bridge your tables straight into the Zod contracts — one schema powering DB, validation, types, and OpenAPI ([drizzle-zod](https://orm.drizzle.team/docs/zod)).

**Prisma 7** (Nov 2025) genuinely closed the gap — rust-free TS query compiler, ESM, ~90% smaller bundle, up to 3× faster, 70% faster typecheck ([Prisma 7](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0)). But RLS is still session-variable bolt-on and migrations are more of a black box. For **explicit multi-tenant RLS + agent readability**, Drizzle wins.

## Validation: Zod v4 (stable)

Zod v4 is stable and production-standard: ~14× faster parsing, 57% smaller core, `@zod/mini` (~1.9 KB) for the Expo bundle, and Standard-Schema interop with oRPC/Drizzle ([InfoQ](https://www.infoq.com/news/2025/08/zod-v4-available/)). One Zod schema is the atomic contract shared everywhere.

## Job queue: Graphile Worker (reject BullMQ default; pg-boss viable)

**Graphile Worker** keeps jobs in Postgres (`SELECT … FOR UPDATE SKIP LOCKED`), sub-5ms latency, built-in cron — **no Redis**, so fewer moving parts and one datastore to keep in India ([Graphile perf](https://worker.graphile.org/docs/performance)). For your CPU-heavy jobs (shading sim on large arrays, Chromium PDF render), the queue is *not* the bottleneck — the compute is. Pattern: keep queue concurrency modest, run heavy handlers in `worker_threads`/`child_process`, and put the `worker` process-group on **dedicated, larger Fly Machines** you scale independently ([Graphile techniques](https://worker.graphile.org/docs/techniques), [Fly processes](https://fly.io/docs/launch/processes/)). **BullMQ+Redis** only if you exceed ~thousands of jobs/min sustained ([HN report](https://news.ycombinator.com/item?id=46614277)) — it adds a Redis dependency and another residency surface. **pg-boss** is an acceptable equivalent; Graphile edges it on throughput and cron.

## Realtime: SSE (start here)

For notifications and design-sync push, **SSE** is HTTP-native, auto-reconnects, needs no sticky sessions, passes the Fly proxy cleanly, and uses 30–40% less server resource than WebSockets for unidirectional fan-out ([Ably](https://ably.com/blog/websockets-vs-sse), [Fly WS thread](https://community.fly.io/t/regions-and-scaling-for-websocket-server/9260)). Adopt WebSockets only if collaborative bidirectional design editing lands later (then sticky sessions + Postgres/Redis pub-sub).

## Critical Fly + DPDP gotcha (verify before committing)

**Fly Managed Postgres has NO Mumbai region** — as of July 2026 MPG runs in 12 regions (Amsterdam, Frankfurt, São Paulo, Ashburn, LA, London, Tokyo, Chicago, Singapore, San Jose, Sydney, Toronto), India absent ([MPG docs](https://fly.io/docs/mpg/)). Under DPDP Rules 2025 (operational since 13 Nov 2025), keep personal data in India ([Star Systems](https://starsystems.in/dpdp-act-complete-guide/)). So for residency, either run **unmanaged Fly Postgres on a `bom` Machine** (you own HA/backups — [Fly PG](https://fly.io/docs/postgres/)) or use an **external managed Indian Postgres** (Supabase Mumbai, Aiven Mumbai, AWS RDS `ap-south-1`). Do not default to MPG.