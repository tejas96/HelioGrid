# HelioGrid infrastructure — state & one-command provisioning

**Local dev is the priority right now (owner directive 2026-07-26).** Nothing below
blocks implementation: the api/worker run against local Docker Postgres; deploys come
later.

## Current state (2026-07-26)

| Resource | State |
|---|---|
| Fly org `heliogrid` (dedicated) | ✅ created — **needs a credit card** at https://fly.io/dashboard/heliogrid/billing before ANY machine/volume/add-on can be created |
| Fly apps api/web/worker/voice/powersync | ✅ created, moved into `heliogrid` org, machineless (free) |
| fly.toml per app | ✅ in each app dir (bom primary, min=1; deploy = `flyctl deploy` from repo root per ADR-0018) |
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
# Redis for BullMQ (when Track A/C needs it):
docker run -d --name heliogrid-redis-local -p 6379:6379 redis:7 --maxmemory-policy noeviction
```

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

# 3. Upstash Redis — FIXED plan, eviction OFF (BullMQ requirement, docs/03 §7):
flyctl redis create --org heliogrid --name heliogrid-redis --region bom \
  --no-replicas --disable-eviction        # pick the fixed 250MB plan at the prompt

# 4. Tigris bucket (then verify the `sin` pin per docs/spikes/S4 and RECORD the
#    working command sequence in that note):
flyctl storage create --name heliogrid-objects --org heliogrid

# 5. Production upgrade path (later, unchanged from docs/03 §6): grow to 3-node
#    repmgr HA + pgBackRest→Tigris + restore drill (docs/spikes/S2 sequence).
```

## Secrets wiring (when deploys start)

Per app: `flyctl secrets set -a heliogrid-api DATABASE_URL=... REDIS_URL=...` — the
full variable census lives in [.env.example](../.env.example). Never commit values.
