# ADR-0005: Multi-tenancy — single database, `tenant_id` everywhere, app-scoping primary, RLS backstop

Status: Accepted
Date: 2026-07-24

## Context

HelioGrid serves many Indian solar EPC tenants at high volume (residential + C&I), targeting hundreds of small-to-mid tenants rather than a handful of giants. PowerSync replicates from one logical schema; Drizzle migrations, BullMQ jobs and the usage ledger all assume one schema. Tenant isolation is a locked invariant (cross-tenant read/write must fail in the test suite).

## Decision

**Single Postgres database, shared schema.** Every tenant-owned row carries `tenant_id`. Two enforcement layers, both mandatory:

1. **Primary: application-layer scoping.** Every query path goes through the tenant-scoped repository layer in `apps/api`; the tenant comes from the verified JWT claim (`{tenant_id, roles[]}`, Better Auth JWKS), never from request input.
2. **Backstop: Postgres RLS.** Per request/transaction, `SET LOCAL app.tenant_id = <verified claim>`; policies `USING (tenant_id = current_setting('app.tenant_id')::uuid)` on every tenant table. The application DB role has neither `BYPASSRLS` nor superuser — otherwise policies silently no-op.

## Consequences

- One migration, one PowerSync replication source, one connection pool — operationally the cheapest shape and the only one that keeps Sync Streams parameterisation simple (`tenant_id = token.tenant`).
- A missed `WHERE tenant_id` in app code is caught by RLS, not shipped; the cost is RLS policy maintenance on every new table (checklist item in the db rules) and a small per-query planner overhead.
- Noisy-neighbour risk is shared-everything: per-tenant rate limits and the usage ledger are the containment tools, not physical isolation.
- "Enterprise wants their own database" becomes a future migration project, not a config toggle — accepted; plain Postgres + logical replication keeps that door open.
- The tenant-isolation invariant tests (`tests/invariants/`) must exercise both layers: repository scoping and a direct-SQL RLS probe.

## Alternatives rejected

- **Schema-per-tenant** — migration fan-out across hundreds of schemas, PowerSync/Drizzle tooling friction, connection-pool fragmentation; complexity grows linearly with tenant count for isolation we can enforce logically.
- **Database-per-tenant** — strongest isolation, absurd ops burden at this tenant profile on unmanaged Fly postgres-flex (ADR-0006).
- **RLS as the only layer** — puts all trust in session-variable hygiene; a missing `SET LOCAL` fails open in some pooling modes. App scoping stays primary.

## Sources

- `../research/backend.md` · `../research/auth.md`
- https://ecosire.com/blog/drizzle-orm-postgres-rls-multitenancy
- https://dev.to/josh_blair/multi-tenant-auth-with-cognito-and-postgresql-row-level-security-part-2-5d30 · https://docs.postgrest.org/en/v12/explanations/db_authz.html
