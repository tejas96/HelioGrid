# ADR-0004: ORM — Drizzle

Date: 2026-07-24

## Context

The data layer is Postgres with single-DB multi-tenancy enforced by app-layer scoping plus an RLS backstop (ADR-0005). Multi-tenant RLS requires setting a per-transaction session variable (`SET LOCAL app.tenant_id`) — the ORM must make raw, explicit SQL natural rather than fight it. Agents edit this layer constantly; readable SQL beats a query DSL black box.

## Decision

**Drizzle ORM** in `packages/db`: schema-as-code, generated SQL migrations (append-only; never edit an applied migration), `drizzle-zod`'s `createInsertSchema`/`createSelectSchema` bridging tables into the Zod contracts so one schema powers DB, validation, types and OpenAPI.

## Consequences

- SQL-first means RLS session-variable plumbing, partial indexes, JSONB operators (the design payload) and `FOR UPDATE SKIP LOCKED` are all first-class — nothing hides behind an engine.
- Agents read the exact SQL Drizzle emits; the smallest runtime/bundle of the mainstream options.
- Drizzle migrations are less hand-holding than Prisma Migrate: destructive-change detection is weaker, so migration review discipline (and the locked migration round-trip invariant test) carries more weight.
- We give up Prisma's richer studio/tooling ecosystem.

## Alternatives rejected

- **Prisma 7** — genuinely close now (rust-free TS query compiler, ESM, ~90% smaller bundle, up to 3x faster, 70% faster typecheck), but RLS remains a session-variable bolt-on and migrations are more of a black box; for explicit multi-tenant RLS + agent readability Drizzle wins.
- **Kysely / raw SQL** — maximally explicit but loses the schema→Zod bridge and migration generation; more glue for agents to get wrong.

## Sources

- `../research/backend.md`
- https://ecosire.com/blog/drizzle-orm-postgres-rls-multitenancy · https://orm.drizzle.team/docs/zod
- https://www.prisma.io/blog/announcing-prisma-orm-7-0-0
