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

## Local dev (running today)

```bash
docker start heliogrid-pg-local 2>/dev/null || docker run -d --name heliogrid-pg-local \
  -e POSTGRES_USER=heliogrid -e POSTGRES_PASSWORD=heliogrid -e POSTGRES_DB=heliogrid_dev \
  -p 5544:5432 postgres:16
DATABASE_ADMIN_URL=postgres://heliogrid:heliogrid@localhost:5544/heliogrid_dev \
  pnpm --filter @heliogrid/db migrate
# Redis for rate limiting and SSE fan-out (apps/api only — orchestration is Temporal):
docker run -d --name heliogrid-redis-local -p 6379:6379 redis:7 --maxmemory-policy noeviction
```

### QA read-only role

`/verify`'s `qa-api` agent reads database state through a role that cannot write, against
the ALREADY RUNNING container above — never a new container, never a clone (owner ruling
2026-08-03). Create it once:

```bash
docker exec heliogrid-pg-local psql -U heliogrid -d heliogrid_dev -c \
  "CREATE ROLE qa_readonly LOGIN PASSWORD 'qa_readonly';
   GRANT CONNECT ON DATABASE heliogrid_dev TO qa_readonly;
   GRANT USAGE ON SCHEMA public TO qa_readonly;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO qa_readonly;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO qa_readonly;
   GRANT app_user TO qa_readonly;"
```

**The `GRANT app_user` line is load-bearing, and the reason is a trap worth understanding.**
Every tenant table is RLS ENABLED and FORCEd (`tests/invariants/src/tenancy-rls.ts` asserts
it), and the policies are written for `app_user`. A read-only role with no applicable policy
therefore reads **zero rows from every tenant table** — and an agent would report those empty
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
