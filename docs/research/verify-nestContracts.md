> **HISTORICAL EVIDENCE** — its conclusions are already promoted into the authority named below. Cite that, not this file. Promoted into ADR-0003 and ADR-0002; spike S3 supersedes it operationally.

## VERDICT

**Yes — `@orpc/nest` is an official integration** (part of the [unnoq/orpc](https://github.com/unnoq/orpc/blob/main/apps/content/docs/openapi/integrations/implement-contract-in-nest.md) monorepo, not a third-party). You define an oRPC contract and implement it in NestJS controllers via the `@Implement` decorator. It is **real but not yet fully mature**: shipped as part of oRPC v1.x (core packages at **v1.14.8, published ~July 2026**, very active), but the Nest package is effectively beta with hard caveats. For a production NestJS API feeding Next.js + bare React Native today, **recommend `ts-rest` (NestJS adapter)** as the single lowest-friction choice that natively gives BOTH an end-to-end typed client AND OpenAPI. Consider `@orpc/nest` only if your Nest app is already ESM.

## Evidence

**`@orpc/nest` maturity ([docs](https://orpc.dev/docs/openapi/integrations/implement-contract-in-nest), [npm](https://www.npmjs.com/package/@orpc/nest)):**
- Does implement contracts in Nest controllers (`@Implement`, works like native HTTP decorators); endpoints are OpenAPI-compatible.
- **Does NOT auto-emit a client from the Nest side** — typed client is separate: share the `@orpc/contract` + use `OpenAPILink`. Two-step, not one-command.
- **ESM-only** (Node 22+ or bundler) — a genuine adoption tax in typical CommonJS Nest apps.
- Limitations: path params with slashes broken on Fastify; body-parser bracket-notation needs manual config. Labeled beta.
- Upside: oRPC overall is fast-moving and OpenAPI-first by design.

**`ts-rest` NestJS adapter ([docs](https://ts-rest.com/server/nest), [changelog](https://ts-rest.com/changelog), [npm](https://www.npmjs.com/package/@ts-rest/nest)):**
- Single contract → Nest implements it → consumers get **end-to-end TS types** AND an **OpenAPI generator**. Truly contract-first and Nest-native (decorator-based, gradual adoption).
- CommonJS-friendly — no ESM migration needed.
- Maintenance: stable **3.52.1 (~Sep 2025)**; **3.53.0-rc.1** adds Zod 4 / Standard Schema (still RC). Active but cadence has slowed — the main risk to weigh.

**`nestjs-zod` + `@nestjs/swagger` ([npm](https://www.npmjs.com/package/nestjs-zod), [repo](https://github.com/BenLorantfy/nestjs-zod)):**
- One Zod schema → runtime validation + OpenAPI (Zod v4 via `z.toJSONSchema`). Actively maintained.
- **Gap:** gives you *server-side* types + OpenAPI, but **no end-to-end client**. You'd bolt on `openapi-ts`/codegen — extra build step, generated-vs-source drift, weaker inference across the RN boundary.

## Recommendation

For a NestJS API consumed by **Next.js web + bare React Native**, pick **`ts-rest`**:
1. It is the most NestJS-native *contract-first* option delivering both requirements from one source of truth, with no codegen drift and no ESM migration.
2. `@orpc/nest` is promising and more actively developed, but its beta status + ESM-only requirement + Fastify path-param limits add production risk now.
3. `nestjs-zod + @nestjs/swagger + openapi-ts` only fits if OpenAPI/docs are the priority and you accept generated (not inferred) clients.

**Caveat:** confirm `ts-rest` 3.53 (Zod 4) has left RC before committing if you need Zod 4; otherwise pin Zod 3. Re-check oRPC in ~6 months — it's the faster-moving forward bet.