# 09 — Observability & Ops (incl. THE Postgres runbook)

Small team, AI-assisted development, one region. The observability stack is deliberately
boring: **pino → Loki, OpenTelemetry → Tempo, Prometheus metrics → Grafana Cloud (free
tier) with Fly's managed Prometheus as a datasource**. One pane of glass, no self-hosted
observability infrastructure to babysit. Sources:
.

## 1. Structured logging — pino

- **`nestjs-pino`** in api and worker
  and ops scripts. JSON to stdout only — Fly captures it.
- **Context injection via AsyncLocalStorage**: every line carries `requestId`, `tenantId`,
  `userId` where a session exists, plus `jobId`/`queue` in worker and `callId` in voice.
  Request ID: honour incoming `Fly-Request-Id`, else generate a ULID; echo as
  `x-request-id` on every response (support greps on it).
- **Redaction is mandatory**: `req.headers.authorization`, `*.otp`, `*.password`,
  Razorpay payloads' instrument fields, and phone numbers logged masked (`+91••••••1234`).
  Redaction paths live in one shared `packages/config/logging.ts` — not per-app copies.
- Levels: `info` in prod; `debug` togglable per-machine via env without redeploy
  (`LOG_LEVEL`). Drizzle slow-query logging at >200 ms as `warn` with the query fingerprint
  (never bound parameter values).
- **Shipping**: Fly Log Shipper (NATS-based) machine forwards all app logs to Grafana Cloud
  Loki (14-day retention on free tier) **and** to a Tigris `logs/` archive sink (gzipped
  NDJSON, 90-day retention — matches the voice-recording retention window). `fly logs` is
  ephemeral and never the system of record.
- Mobile crash reporting: **Firebase Crashlytics** (rides the existing react-native-firebase
  dependency). No Sentry in v1 — server errors are covered by logs + traces; revisit
  post-release.

## 2. Tracing — OpenTelemetry

- `@opentelemetry/sdk-node` with auto-instrumentations (http/undici, pg, ioredis) in api,
  worker and voice; `service.name` = `heliogrid-api` / `-worker` / `-voice`.
- **W3C traceparent propagation end-to-end**: web → api (ts-rest client injects headers),
  api → worker (traceparent stored in BullMQ job data, worker resumes the trace),
  api → voice. One trace covers "user clicked Generate PDF → job → Playwright → Tigris".
- Export OTLP to Grafana Cloud Tempo. Sampling: `ParentBased(TraceIdRatio 0.2)` for api;
  **100 % for voice call sessions** (low volume, high value per trace) and for any request
  that ends 5xx (error spans always recorded via span processor).
- The `requestId` is attached as a span attribute so logs ↔ traces cross-link in Grafana.

## 3. Metrics, alerts, dashboards

Every app exposes `/metrics` (prom-client); Fly's `[metrics]` config scrapes it into the
managed Prometheus (fly-metrics.net), which is added as a datasource in Grafana Cloud.
Postgres nodes run `postgres_exporter` as a sidecar process in the postgres-flex image.

### Alert list (Grafana alerting → Slack #ops + email; page-worthy in bold)

| Alert | Condition | Why |
|---|---|---|
| **API down** | synthetic `/healthz` fails 3× (external probe) | front door |
| **DB disk** | volume used >85 % (warn 70 %, **page 95 %**) | WAL pile-up kills the DB |
| **DB replication** | standby lag >60 s or >100 MB, or a standby down >5 min | HA is only real if standbys are current |
| **WAL archiving broken** | `pgbackrest check` failure, or archive queue growing 15 min | silently destroys RPO |
| **Backup missing** | last successful pgBackRest backup >25 h, or nightly pg_dump absent | second layer must exist |
| **Restore-drill staleness** | `heliogrid_ops_restore_drill_age_days` >35 | an untested backup is a rumour |
| Queue depth | `waiting` >500 for 10 min on any queue; `failed` >25/h; pdf queue >50 | jobs are user-visible (PDFs, shading, agent calls) |
| Webhook failures | Razorpay/Exotel webhook processing failures >5/15 min | money + calls |
| **Call error rate** | voice call setup+media errors >5 % over 15 min | tenant-facing, compliance-adjacent |
| OTP delivery | failure rate >10 % over 30 min | the front door for every login |
| ComplianceGate fail-closed | promotional dialing paused on stale DND scrub | revenue-affecting, must be seen |
| Machine restarts | any app >3 restarts/h (OOM signature exit 137) | catches Playwright/shading memory creep |
| Upstash limits | memory >80 % of fixed plan, or command rate near plan cap | BullMQ dies badly on eviction/throttle |
| Cert/secret expiry | tenant WABA/Razorpay creds invalid on scheduled probe | tenant-facing integrations rot silently |

### Custom metrics (prom-client, names are the contract)

`heliogrid_queue_jobs{queue,state}` · `heliogrid_sync_slot_lag_bytes` ·
`heliogrid_webhook_events_total{provider,outcome}` ·
`heliogrid_voice_calls_total{outcome}` / `heliogrid_voice_concurrent_calls` ·
`heliogrid_port_calls_total{port,status}` (every adapter, via the metering wrapper) ·
`heliogrid_port_breaker_open{port}` · `heliogrid_otp_sends_total{channel,outcome}` ·
`heliogrid_ops_restore_drill_age_days` · `heliogrid_document_render_seconds` (histogram) ·
`heliogrid_sse_connections`.

### Dashboards (Grafana, provisioned as JSON in `ops/dashboards/`)

1. **Golden signals** — p50/p95 latency, RPS, 5xx per app; SSE connections.
2. **Postgres** — disk, replication lag, connections, TPS, cache hit, WAL archive rate,
   backup age, oldest replication slot.
3. **Queues & jobs** — depth/failed/age per queue; PDF render histogram; shading job time.
4. **Voice** — calls, error rate, concurrency, per-leg cost, ComplianceGate blocks by reason.
5. **Billing & webhooks** — webhook outcomes, subscription events, reconciliation drift.
6. **Cost & usage** — port quota burn per tenant, Upstash memory/commands, Tigris GB,
   machine count; COGS per tenant from `usage_events` rollups.

External uptime: Grafana Cloud synthetic checks on `web /healthz`, `api /healthz` and one
public customer-link URL. `/healthz` is shallow (process up); `/readyz` is deep (DB
`select 1`, Redis ping, Tigris HEAD) and used by Fly health checks.

---

## 4. THE POSTGRES RUNBOOK

**Context (flagged risk, user-accepted):** Fly has DEPRECATED unmanaged Postgres
(postgres-flex) — self-support only, wal-g not bundled, Fly MPG has no `bom` region
([postgres-flex](https://github.com/fly-apps/postgres-flex),
[what you should know](https://fly.io/docs/postgres/getting-started/what-you-should-know/)).
The user chose Fly-native anyway; therefore the mitigations below are **mandatory in-scope
work for the 20-day build, not optional hardening**. This section is the operative document — print-it-out
grade.

### 4.1 Topology

- **3-node repmgr cluster** (postgres-flex image) in `bom`: 1 primary + 2 standbys, each on
  its own Machine with a dedicated volume (start: `performance-2x`, 4 GB RAM, 40 GB volume;
  disk autoscale alert at 70 %). Automatic failover via `repmgrd`; clients connect through
  the app's internal address, haproxy routes to the current primary.
- Config baseline: `wal_level=logical` (kept for logical replication and future CDC), `archive_timeout=60s` (bounds
  RPO), `shared_buffers=25 %` RAM, `work_mem=16MB`, `max_connections=120` with per-app
  Drizzle pool caps (api 20, worker 10).
  `pg_stat_statements` on.
- One custom image layer on postgres-flex: adds **pgBackRest** + `postgres_exporter`.
  This image is ours to rebuild when Fly stops maintaining flex — that is the deal we
  accepted.

### 4.2 Backups — two independent layers, both → Tigris

Backup bucket: `heliogrid-backups` (Postgres artifacts under the `pg/` prefix), **Tigris single-region pin `sin`** — deliberately a
different region from the database, so a `bom` regional loss cannot take the data and the
backups together. Tigris S3 compatibility (SigV4, multipart) is sufficient for pgBackRest;
certified-by-us in the week-1 spike, not assumed
([Tigris locations](https://www.tigrisdata.com/docs/buckets/locations/)).

**Layer 1 — pgBackRest WAL archiving + physical backups (the RPO layer):**
- `archive_command = 'pgbackrest --stanza=heliogrid archive-push %p'`, `archive-async=y`,
  `process-max=4`, repo type s3 → Tigris endpoint.
- Schedule: weekly full, daily differential — run as **cron beside Postgres** on the
  primary node (the spike picks cron implementation details, not whether it is cron; the
  schedule is the contract).
- Retention: 2 fulls + diffs + WAL to cover **14 days of PITR**.
- Barman is the documented fallback if pgBackRest-in-image proves awkward (community
  reports Barman PITR works but is manual and `fly clone` breaks after recovery — reason
  it is fallback, not primary: [Barman thread](https://community.fly.io/t/point-in-time-recovery-for-postgres-flex-using-barman/13185)).

**Layer 2 — nightly logical dumps (the paranoia layer):**
- 02:30 IST **cron beside Postgres**: `pg_dump -Fc` per database + `pg_dumpall --globals-only`, gzip,
  upload to `heliogrid-backups/pg/dumps/YYYY-MM-DD/`, 30-day retention.
- Logical dumps survive anything that corrupts the physical timeline (bad upgrade,
  pgBackRest misconfig, filesystem-level damage) and are the seed for the escape hatch.

**Backup verification automation:**
- Nightly: `pgbackrest check` + parse `pgbackrest info --output=json` → export backup age
  and WAL gap as metrics (alerts above).
- Weekly: `pg_restore --list` against the latest dump (integrity without a full restore).
- Monthly: the full restore drill (next section) — automated, not a calendar hope.

### 4.3 Restore drill — pre-launch gate + monthly

Automated as `ops/restore-drill.sh`, run from a throwaway Fly machine; results written to
an `ops_drills` table (exported as the staleness metric). **Launch gate: the drill must
pass twice before production traffic.** Monthly thereafter, alert at 35 days.

1. Create a scratch Fly app + volume in `sin` (drills also prove region-loss recovery).
2. `pgbackrest restore --stanza=heliogrid --type=time "--target=<T-5min>"` from Tigris.
3. Start Postgres, wait for recovery, promote.
4. Verification queries: row counts on 5 sentinel tables vs source-of-truth counts recorded
   at backup time; latest Drizzle migration id matches; the **canary row** — a worker job
   writes a timestamped row every minute, and `now - max(canary.at)` measured on the
   restored DB **is the empirically proven RPO** — recorded per drill.
5. Record wall-clock time (proven RTO component), destroy scratch app.
6. Quarterly variant: restore the *logical dump* instead, into a scratch DB, run the same
   verification — both layers get exercised.

### 4.4 Failover procedure

**Automatic (normal case):** `repmgrd` promotes a standby; haproxy re-routes. Expected blip
<30 s. Afterwards, on-call MUST: confirm exactly one primary (`repmgr cluster show`),
confirm WAL archiving resumed from the new primary (`pgbackrest check`), and rejoin or
replace the failed node the same day (2 nodes is a degraded state, not a stable one).

**Manual promote (repmgrd failed or split decision needed):**
1. Verify the primary is truly dead (`fly machine status`, can't connect from two apps) —
   never promote against a live primary.
2. **Fence first**: `fly machine stop <old-primary>` — the old primary must not come back
   networked. Split-brain is the only unrecoverable state in this runbook.
3. On the chosen standby: `repmgr standby promote`.
4. Verify haproxy routing; verify app writes succeed; verify archiving from new primary.
5. Rejoin old node later as a standby: `repmgr node rejoin` (pg_rewind path); if rewind
   fails, re-clone it (`repmgr standby clone`) — never force it.

### 4.5 Disk-full playbook

Cause #1 is always the same: **WAL retention because archiving or a replication slot
stalled** (an inactive logical replication slot pins WAL forever).

1. Check `pg_wal` size vs base data size; check `pgbackrest check`; check
   `select * from pg_replication_slots` for inactive slots / huge `restart_lsn` lag.
2. Fix the cause: restart archiving (usually Tigris creds or network). If an orphaned
   logical slot is holding WAL and nothing consumes it, **drop the slot**
   (forces full resync of every field device).
3. Buy space: `fly volumes extend` (online, no restart). Never manually delete files in
   `pg_wal` — that is how a cluster dies.
4. At 95 % emergency: stop worker (biggest write producer), extend volume, then fix cause.
5. Post-incident: bloat check (`pg_stat_user_tables` dead tuples), tune autovacuum if
   implicated.

### 4.6 OOM playbook

Signature: machine restart, exit code 137, gap in metrics.

1. Immediate: the restart itself restores service (repmgr handles it if it was the
   primary — treat as failover, run §4.4 post-checks).
2. Identify: `pg_stat_statements` top by `total_exec_time` and `temp_blks_written`; the
   usual suspects are unbounded catalog/report queries or a migration.
3. Mitigate: cap the query (LIMIT/pagination in the API layer), lower `work_mem` if a
   single query multiplied it across parallel workers.
4. Structural: upsize the machine (`fly machine update --vm-memory`) — RAM is cheaper than
   incidents; record the new baseline in §7 cost table.

### 4.7 Escape hatch — logical replication to managed Postgres

**Triggers (any one):** two consecutive failed restore drills · an HA event we could not
explain · sustained `bom` capacity failures affecting DB machines · ops load on the DB
exceeding ~2 person-days/month. Targets, in order: managed Mumbai Postgres (Crunchy Bridge
or Supabase `ap-south-1` — in-country, low ms from `bom`;
) · Fly MPG in `sin` (accepts ~60 ms/query +
cross-border, DPDP-permitted). Plain Postgres end to end — nothing locks in.

1. Provision target; apply schema via Drizzle migrations (never dump-schema drift).
2. `create publication heliogrid_all for all tables;` on source; create subscription on
   target with `copy_data = true`.
3. Monitor until `pg_stat_subscription` lag ≈ 0; run row-count + invariant spot checks.
4. Cutover (planned, minutes): enable maintenance mode (writes off), wait lag = 0,
   **sync sequences** (logical replication does not carry them — script `setval` from
   source), flip `DATABASE_URL` via `fly secrets set` (rolling restart), writes on.
5. Keep the old cluster as a frozen fallback for 7 days, then destroy.
   managed provider allows logical replication slots BEFORE choosing it; Supabase and
   Crunchy both do).

### 4.8 DR targets (stated, then proven)

- **RPO ≤5 min** — mechanism: `archive_timeout=60s` + async WAL push; **proven** by the
  canary-row measurement in every restore drill (§4.3.4).
- **RTO ≤1 h** for full-region loss — budget: 15 min decision + 30 min restore-to-`sin`
  (drill-timed) + 15 min secrets/DNS flip and app redeploy pointing at the restored DB.
  The monthly drill time-stamps every step; if the drill exceeds 45 min, that is an
  incident-grade finding, not a shrug.

---

## 5. Deploys

- **One Fly app per service:** `heliogrid-web`, `heliogrid-api`,
  `heliogrid-worker` — plus the 3-node postgres-flex cluster app and
  `log-shipper`. web/api/worker/voice build per-app Dockerfiles; apps talk over
  6PN/flycast private networking. `primary_region = "bom"` on every app.
- **Capacity posture** ( `bom` is chronically
  capacity-tight): `min_machines_running = 1` for web and api (never scale-to-zero in bom);
  worker and voice `autostop = "off"`. **`sin` overflow is a documented manual play**, not
  automation: on repeated `bom` placement failures, `fly scale count api=2 --region sin`
  (DB stays in bom; ~60 ms/query is acceptable during an overflow window).
- **Rolling deploys**: `fly deploy --strategy rolling`, health-check gated (`/readyz`).
  `kill_timeout`: api/web 30 s; worker 120 s (BullMQ graceful close — stop taking jobs,
  finish in-flight); **voice 300 s** (drain live calls; new calls route to new machines).
- **Migrations** run as `release_command` (`pnpm --filter @heliogrid/db migrate`) before
  machines roll. Discipline: every migration must be compatible with the previous release's
  code (expand/contract) because old machines serve traffic during the roll. Never edit an
  applied migration (CLAUDE.md law).
- CI (GitHub Actions): green `turbo typecheck+lint+test+build` on `main` → `fly deploy`.
  Rollback = `fly releases` + redeploy the previous image reference. No feature flags — a
  bad merge rolls back, it does not get flagged off (BLUEPRINT directive 8).

## 6. Secrets rotation

Inventory (all via `fly secrets set`, staged per app; setting triggers a rolling restart):

| Secret | Cadence | Notes |
|---|---|---|
| `DATABASE_URL`, `REDIS_URL` | on incident / topology change | flip during escape hatch too |
| Razorpay key/secret + webhook secret | quarterly | **dual-accept**: verify webhooks against old+new for 48 h |
| Exotel, Sarvam, MSG91 keys | quarterly | breaker + `unconfigured` envelope make a bad rotation loud, not silent |
| Google Maps/Solar, Gemini keys | quarterly | Maps JS key is referrer-locked, not secret-rotated |
| Tigris access keys | quarterly | rotate backup-bucket creds FIRST and run `pgbackrest check` before rotating the rest |
| Customer-link HMAC key | yearly, dual-accept | old links must survive the window |

Rotate immediately on personnel change or suspected leak. Per-tenant credentials
(BYO-Razorpay, WABA) are the tenant's to rotate — we surface an "invalid credentials"
probe alert (§3) and a settings nag, never silent failure.

## 7. Cost monitoring

- **Fixed line items**: Upstash **fixed plan** (start $10/mo · 250 MB — Fly explicitly
  recommends fixed for BullMQ; PAYG polling costs are a trap; eviction stays OFF,
  `maxRetriesPerRequest: null`) — alert at 80 % memory and upgrade a tier BEFORE throttling
  ([Upstash on Fly](https://fly.io/docs/upstash/redis/)).
- **Machine sizing baseline** (review monthly against the Cost dashboard; figures are
  sizing intent, verify against current Fly pricing):

  | Group | Size | Count | Why |
  |---|---|---|---|
  | web | shared-cpu-2x / 1 GB | 2 | SSR is light; min 1 always on |
  | api | performance-1x / 2 GB | 2 | latency-sensitive, always on |
  | worker | performance-2x / 4 GB | 1 | Playwright 300–500 MB/render + shading sims |
  | pg | performance-2x / 4 GB + 40 GB vol | 3 | the runbook's floor, non-negotiable |

- **Tigris**: no egress fees; track GB/month growth (survey photos dominate) and the
  backup bucket separately.
- **Per-tenant COGS**: the `usage_events` ledger (voice legs, AI detections, OTP, storage)
  rolls up into the Cost & usage dashboard next to plan revenue — the margin check that
  keeps pricing honest .
- Monthly ops review (30 min, calendared): Fly invoice vs sizing table, Upstash headroom,
  Tigris growth, restore-drill timings trend, alert noise triage.

## Cross-references

- Port failure semantics and breaker behaviour: `07-integrations.md`.
- RLS, webhook verification, SSRF guard: `08-security-and-tenancy.md`.
- Week-1 spikes (pgBackRest→Tigris archive+restore, Tigris `sin` pin via `fly storage
  create`):the infra runbook.
