# ADR-0002: Backend framework — NestJS modular monolith

Status: Accepted
Date: 2026-07-24

## Context

The API must serve five non-web consumers (bare RN mobile, tokenised public customer links, telephony/billing webhooks, background workers, a future public API), so a standalone HTTP service is required — Next.js server actions cannot reach React Native and would fork the domain. The backend research recommended Hono and explicitly cautioned against NestJS's DI/decorator indirection for agent-edited code. The product owner issued a binding final-review directive: **the backend is NestJS**.

## Decision

**NestJS on Node 22, as a modular monolith** — one `apps/api` with modules: auth, tenancy, crm, survey, design, proposal, customer-link, projects, payments/billing, catalog, agent (voice), notifications, admin. Two further NestJS standalone apps share the idiom: `apps/worker` (BullMQ processors) and `apps/voice` (CallSession orchestrator). Next.js stays pure frontend/BFF with no domain logic.

**DI discipline caveats are mandatory, not advisory** (they neutralise the research's objection):
1. Business logic never lives in providers — it lives in `packages/domain` (pure TS, dependencies injected as parameters) and is called by thin Nest services.
2. Controllers are thin ts-rest implementations of `packages/contracts` (ADR-0003); the contract diff, not the decorator tree, is the API review surface.
3. No custom decorators beyond the sanctioned set (auth guard, tenant context); no `forwardRef` — a circular module dependency is a design error, and dependency-cruiser fails the build on cycles.
4. Module boundaries mirror the docs' module list; one module = one bounded context.

## Consequences

- One framework idiom across api/worker/voice; `@nestjs/bullmq`, guards, pipes, interceptors and SSE are first-class rather than hand-rolled.
- CommonJS-friendly, which is precisely what keeps ts-rest viable (ADR-0003) and avoids the `@orpc/nest` ESM tax.
- Heavier baseline than Hono; DI indirection remains a real agent hazard — the four caveats above must be enforced in `.claude/rules/api.md` and code review, or we inherit the failure mode the research warned about.
- Monolith-first means module extraction (e.g. voice at scale) is a later refactor; standalone apps for worker/voice already cut the two most likely seams.

## Alternatives rejected

- **Hono** — the research's pick (web-standard, tiny, low-magic) — rejected by binding user directive; also thinner ecosystem for an enterprise-modular API with queues, guards and SSE.
- **Fastify (raw)** — proven throughput but assembles the same platform from parts NestJS ships integrated; no directive support.
- **Next.js-only (server actions/route handlers)** — cannot serve React Native or webhook/public-API consumers; would force domain logic duplication.
- **Microservices from day one** — operational overhead unjustified pre-launch; modular monolith with enforced boundaries keeps extraction cheap.

## Sources

- `../research/backend.md` (Hono recommendation + NestJS caution — overridden by directive; separate-API rationale stands)
- `../research/verify-nestContracts.md` (NestJS + ts-rest path verified)
- BLUEPRINT.md — Final-review directive 1 (user-confirmed, binding)
- https://encore.dev/articles/nestjs-vs-fastify-vs-hono · https://docs.expo.dev/guides/using-nextjs/
