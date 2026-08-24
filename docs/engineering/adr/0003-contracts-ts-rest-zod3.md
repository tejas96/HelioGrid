# ADR-0003: API contracts — ts-rest with Zod pinned to 3.x

Date: 2026-07-24

## Context

One contract source of truth must yield (a) end-to-end typed clients for Next.js and bare React Native, and (b) an emitted OpenAPI 3.1 document for public customer-link endpoints, webhooks and a future public API — with no codegen drift. The host framework is NestJS, which is CommonJS-shaped in practice.

## Decision

**ts-rest (`@ts-rest/nest`) with Zod pinned to 3.x.** The contract lives in `packages/contracts`; Nest controllers implement it; web and mobile consume inferred typed clients; OpenAPI is generated from the same contract. `nestjs-zod` is used where per-DTO validation is needed. Contract-first is a hard rule: change `packages/contracts` before implementing an endpoint or client.

Zod stays on 3.x until ts-rest's Zod-4/Standard-Schema support (3.53.0, currently RC) ships stable — checking that status is a listed week-1 spike. Realtime is SSE (Nest-native); WebSockets only if collaborative editing lands.

## Consequences

- One inspectable artifact is the API review surface for humans and agents; no generated-client drift.
- Zod 3.x forgoes Zod 4's ~14x parse speed and `@zod/mini` bundle wins until the pin lifts; the pin must be enforced with sherif so no package drifts to Zod 4 early.
- ts-rest's release cadence has slowed (3.52.1 stable ~Sep 2025) — this is the accepted risk; mitigation is that the contract package is plain Zod + route definitions, portable to oRPC later if ts-rest stalls.
- Re-evaluate oRPC in ~6 months; it is the faster-moving forward bet.

## Alternatives rejected

- **@orpc/nest** — official but effectively beta: ESM-only (a genuine adoption tax in a CommonJS Nest app), no auto-emitted client from the Nest side (two-step via `OpenAPILink`), Fastify path-param breakage documented.
- **tRPC v11** — procedure-first, cannot emit OpenAPI; public API/webhooks/non-TS consumers get nothing.
- **nestjs-zod + @nestjs/swagger + openapi-ts alone** — server types + OpenAPI but no inferred end-to-end client; codegen step reintroduces generated-vs-source drift across the RN boundary.

## Sources

- https://ts-rest.com/server/nest · https://ts-rest.com/changelog · https://www.npmjs.com/package/@ts-rest/nest
- https://orpc.dev/docs/openapi/integrations/implement-contract-in-nest · https://www.npmjs.com/package/@orpc/nest
