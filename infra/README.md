# HelioGrid infrastructure — state & one-command provisioning

**Local dev is the priority right now (owner directive 2026-07-26).** Nothing below
blocks implementation: the api/worker run against local Docker Postgres; deploys come
later.

## Temporal (ADR-0025)

The local orchestration stack, its decisions and its runbooks: `infra/temporal/README.md`.
The reviewed — and **undeployed** — production candidate: `infra/temporal/deploy/README.md`.
No Fly app, database, certificate authority or machine exists for it; creating one is an
owner-approved operation.

## Current state (2026-07-26)

| Resource | State |
|---|---|
| Fly org `heliogrid` (dedicated) | ✅ created — **needs a credit card** at https://fly.io/dashboard/heliogrid/billing before ANY machine/volume/add-on can be created |
| Fly apps api/web/worker | ✅ created, moved into `heliogrid` org, machineless (free) |

> Two further Fly apps, `heliogrid-voice` and `heliogrid-powersync`, were created before those
> capabilities were dropped. Both are machineless and cost nothing. **Deleting them is an owner
> action** (`CLAUDE.md` §4) — no agent touches Fly.
| fly.toml per app | ✅ in each app dir (bom primary, min=1; deploy = `flyctl deploy` from repo root; one Fly app per service) |
| Dev Postgres (Fly) | ⏳ blocked on card — use local Docker meanwhile (below) |
| Upstash Redis | ⏳ blocked on card (plan selection requires billing; no free path pre-card) |
| Tigris bucket | ⏳ blocked on card (`createAddOn` refuses without payment info) |
| GitHub CI | ✅ green (quality + android + iOS lanes); branch protection requires all three |

## Local dev

```bash
pnpm infra:up      # from a clean clone: mints dev PKI, starts everything, bootstraps Temporal
pnpm infra:token   # re-mint the Temporal token (1 hour TTL)
pnpm infra:down    # stop, keep the data
pnpm infra:reset   # down -v — destroys the volume
```

**One Postgres container, three databases** (owner ruling 2026-08-27). `heliogrid-pg-local` on
port `5544` holds `heliogrid_dev` (Drizzle migrations), plus `temporal` and `temporal_visibility`
(owned by `temporal-sql-tool`). Two migration tools, separate databases, so neither can reach the
other's tables — and the tenancy invariant still scans `heliogrid_dev` alone, because `pg_class`
is per-database.

Roles and databases are provisioned by `infra/postgres/init/*.sql`, which Postgres runs once on
an empty volume. Nothing is created by hand any more. Put these in `.env.local`:

```
DATABASE_URL=postgres://app_runtime:app_runtime@localhost:5544/heliogrid_dev
DATABASE_ADMIN_URL=postgres://app_admin:app_admin@localhost:5544/heliogrid_dev
```

The four `TEMPORAL_TLS_*`/`TEMPORAL_AUTH_TOKEN_FILE` paths in `.env.example` are repo-root-relative,
but `apps/api` and `apps/worker` run from their own directories, so those relative paths `ENOENT`
on a fresh clone. In `.env.local`, give them as ABSOLUTE paths instead — replace
`/Volumes/works-space/heliogrid` below with your own repo root:

```
TEMPORAL_TLS_CA_FILE=/Volumes/works-space/heliogrid/infra/temporal/pki/ca-bundle.pem
TEMPORAL_TLS_CERT_FILE=/Volumes/works-space/heliogrid/infra/temporal/pki/client-api/tls.pem
TEMPORAL_TLS_KEY_FILE=/Volumes/works-space/heliogrid/infra/temporal/pki/client-api/tls.key
TEMPORAL_AUTH_TOKEN_FILE=/Volumes/works-space/heliogrid/.temporal-token
```

Redis is not started. `REDIS_URL` is declared in `.env.example` but no service reads it
(`packages/env/src/schema/api.ts` does not list it) — Law 9, it returns with its module.

**Migrating from the old `heliogrid-temporal` compose project?** Its leftover Docker network
still holds subnet `172.29.0.0/24`, and `pnpm infra:up` fails with a pool-overlap error until
it's removed — a one-time step, not an ongoing one:

```bash
docker network rm heliogrid-temporal_default
```

### QA read-only role

`qa_readonly` is created by `infra/postgres/init/01-roles.sql` — no longer by hand. It can
connect and holds no write grants. Its `SELECT` grants arrive with migration `0001`.

**`qa_readonly`'s membership in `app_user` is load-bearing, and the reason is a trap worth
understanding.** Every tenant table is RLS ENABLED and FORCEd
(`tests/invariants/src/tenancy-rls.ts` asserts it), and the policies are written for
`app_user`. A read-only role with no applicable policy therefore reads **zero rows from
every tenant table** — and an agent would report those empty
results as observed values, producing a confident green that proves nothing. That is exactly
the vacuous-pass failure this repo's invariants exist to prevent.

So `qa_readonly` inherits `app_user`'s policies but holds no write grants of its own, and a
tenant-scoped query must set the tenant first:

```sql
SET LOCAL app.tenant_id = '<uuid>';   -- inside a transaction; without it, fail-closed = 0 rows
```

A db step that returns zero rows without a tenant pin is `inconclusive`, never a pass.

## One-command provisioning (run top-to-bottom AFTER the card is added)

```bash
# 1. Dev Postgres — single node, smallest practical; upgrade path to HA is
#    "fly machines clone + repmgr" (plain postgres-flex, no architectural change):
flyctl postgres create --name heliogrid-db --org heliogrid --region bom \
  --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1

# 2. Apply migrations + prove RLS on the Fly DB:
flyctl proxy 15432:5432 -a heliogrid-db &   # then:
DATABASE_ADMIN_URL=postgres://postgres:<pw>@localhost:15432/heliogrid pnpm --filter @heliogrid/db migrate
DATABASE_ADMIN_URL=... pnpm --filter @heliogrid/invariants test

# 3. Upstash Redis — rate limiting + SSE only. Plan/eviction were sized for BullMQ and need
#    re-deriving before provisioning (docs/engineering/09 §costs):
flyctl redis create --org heliogrid --name heliogrid-redis --region bom \
  --no-replicas --disable-eviction        # pick the fixed 250MB plan at the prompt

# 4. Tigris bucket (then verify the `sin` pin and RECORD the
#    working command sequence in that note):
flyctl storage create --name heliogrid-objects --org heliogrid

# 5. Production upgrade path (later, unchanged from docs/engineering/03 §6): grow to 3-node
#    repmgr HA + pgBackRest→Tigris + restore drill sequence.
```

## Secrets wiring (when deploys start)

Per app: `flyctl secrets set -a heliogrid-api DATABASE_URL=... REDIS_URL=...` — the
full variable census lives in [.env.example](../.env.example). Never commit values.
