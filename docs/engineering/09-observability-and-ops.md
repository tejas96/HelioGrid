> **Fate:** what is still true moves into the package `CLAUDE.md` it binds as that module is built; the rest is deleted with this file.

# 09 — Observability & Ops

Small team, AI-assisted development, one region. The observability stack is deliberately
boring: **pino → Loki, OpenTelemetry → Tempo, Prometheus metrics → Grafana Cloud (free
tier)**. One pane of glass, no self-hosted
observability infrastructure to babysit. Sources:
.

## 1. Structured logging — pino

- **`nestjs-pino`** in api and worker
  and ops scripts. JSON to stdout only — the host captures it.
- **Context injection via AsyncLocalStorage**: every line carries `requestId`, `tenantId`,
  `userId` where a session exists, plus `jobId`/`queue` in worker and `callId` in voice.
  *AsyncLocalStorage is NOT built yet* — it lands with the M01 request-context seam. Today
  `requestId` reaches every line through pino-http's `genReqId`, and there is no tenant or
  actor to carry.
- **Request ID — as built (2026-08-25)**: `apps/api/src/common/request-id.ts` assigns one
  per request BEFORE CORS and body parsing, so even a body-parser 413 carries it. A
  caller-supplied `x-request-id` is honoured only if it matches
  `[A-Za-z0-9._:-]{1,128}` — otherwise it is replaced, never echoed, because an unbounded
  or control-character id lands in a log line and a response header. It is echoed on every
  response and listed in CORS `exposedHeaders` so the browser can read it. A generated id is
  a **UUID v4** (`node:crypto`), not a ULID — an
  open item for the observability slice, not claims about today.
- **Redaction is mandatory**: `req.headers.authorization`, `*.otp`, `*.password`,
  Razorpay payloads' instrument fields, and phone numbers logged masked (`+91••••••1234`).
  The masking format is not built yet — today a matched path is replaced whole with
  `[redacted]`. **There is no shared `packages/config/logging.ts`** (there never was; a
  package holding it would have to depend on pino, which no shared package may). The one
  authoring is `apps/api/src/common/logging.ts`; `apps/worker` gets its own when it grows a
  log surface worth redacting.
- **Two limits of `redact`, both found by probe and both handled there**: it reaches
  STRUCTURED fields only, so a value in the raw `req.url` query string escapes it — the
  request serialiser strips the query string and leaves the parameters in `req.query`, where
  paths apply. And an error's own payload cannot be redacted path-by-path — a ts-rest
  `RequestValidationError` carries the submitted data's Zod issues — so errors serialise
  through an ALLOWLIST (`type`, `message`, `stack`, `code`, `status`, `statusCode`).
- Levels: `info` in prod; `debug` togglable per-machine via env without redeploy
  (`LOG_LEVEL`). Drizzle slow-query logging at >200 ms as `warn` with the query fingerprint
  (never bound parameter values).
- **Shipping**: all app logs go to Grafana Cloud Loki (14-day retention on free tier)
  **and** to an object-store `logs/` archive (gzipped NDJSON, 90-day retention — matches the
  voice-recording retention window). The host's own log view is never the system of record.
- Mobile crash reporting: **Firebase Crashlytics** (rides the existing react-native-firebase
  dependency). No Sentry in v1 — server errors are covered by logs + traces; revisit
  post-release.

## 2. Tracing — OpenTelemetry

- `@opentelemetry/sdk-node` with auto-instrumentations (http/undici, pg, ioredis) in api,
  worker and voice; `service.name` = `heliogrid-api` / `-worker` / `-voice`.
- **W3C traceparent propagation end-to-end**: web → api (ts-rest client injects headers),
  api → worker (traceparent carried in the orchestration payload — a Temporal workflow
  argument since ADR-0025 — worker resumes the trace),
  api → voice. One trace covers "user clicked Generate PDF → job → Playwright → object store".
- Export OTLP to Grafana Cloud Tempo. Sampling: `ParentBased(TraceIdRatio 0.2)` for api;
  **100 % for voice call sessions** (low volume, high value per trace) and for any request
  that ends 5xx (error spans always recorded via span processor).
- The `requestId` is attached as a span attribute so logs ↔ traces cross-link in Grafana.

## 3. Metrics, alerts, dashboards

Every app exposes `/metrics` (prom-client), scraped into Grafana Cloud. Postgres runs
`postgres_exporter` beside it.

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
| Billing alert | any api log line with `alert` = `billing_repair`, `billing_dead_charge`, `billing_charge_refused`, `billing_cancelled_mandate`, `billing_pause_event`, `billing_invoice_mismatch`, `billing_overage_over_cap`, `billing_overage_unsure`, `billing_overage_refused`, `billing_renewal_link_open`, `billing_renewal_not_raised`, `billing_stray_cancel_schedule`, `billing_old_mandate_open` or `billing_plan_mandate_open` (`apps/api/src/modules/billing/internal/billing-alerts.ts`) | money the reconcile repaired or no subscription could take, or an invoice whose total the gateway did not collect, or an overage add-on no mandate debit can carry, the gateway did not answer or keeps refusing, or a renewal link open with no invoice or never raised, or a mandate left set to end or left open by a cancel, a reactivation or an upgrade; reconciliation is supposed to be boring |
| **Call error rate** | voice call setup+media errors >5 % over 15 min | tenant-facing, compliance-adjacent |
| OTP delivery | failure rate >10 % over 30 min | the front door for every login |
| ComplianceGate fail-closed | promotional dialing paused on stale DND scrub | revenue-affecting, must be seen |
| Machine restarts | any app >3 restarts/h (OOM signature exit 137) | catches Playwright/shading memory creep |
| Redis limits | memory >80 % of its limit, or command rate near its cap | rate limiting fails OPEN or CLOSED on eviction/throttle — neither is silent-safe |
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
6. **Cost & usage** — port quota burn per tenant, Redis memory/commands, object-store GB,
   machine count; COGS per tenant from `usage_events` rollups.

External uptime: Grafana Cloud synthetic checks on `web /healthz`, `api /healthz` and one
public customer-link URL. `/healthz` is shallow (process up); `/readyz` is deep (DB
`select 1`, Redis ping, object-store HEAD) and used by the host's health checks.

---

## 4. Postgres operations

Hosting runbooks come with the Oracle hosting task (`docs/tasks/deferred.md` D50) — topology,
backups, restore drills, disk and memory playbooks, and the recovery targets.

---

## 5. Deploys

- **Graceful shutdown**: api/web 30 s; worker 120 s (stop taking jobs, finish in-flight);
  **voice 300 s** (drain live calls).
- **Migrations** run as a release step (`pnpm --filter @heliogrid/db migrate`) before the new
  code serves. Discipline: every migration must be compatible with the previous release's
  code (expand/contract) because old code can still be running. Never edit an
  applied migration (CLAUDE.md law).
- **Market packs and the platform catalog publish in the same release step, right after the
  migration** (`pnpm --filter @heliogrid/api pack:publish`), so the new code's pack and its
  platform items are stored before any new code serves. A pack shape change follows the same expand/contract discipline: the reader
  (`parseStoredPack`, `T-FCORE-017`) drops and logs a property it does not declare, so an ADDED
  field is safe both ways, while a field the running code needs and the row lacks is refused —
  a field is removed or renamed across two releases, never one.
- CI (GitHub Actions): green `turbo typecheck+lint+test+build` on `main` → deploy.
  Rollback = redeploy the previous image reference. No feature flags — a
  bad merge rolls back, it does not get flagged off (BLUEPRINT directive 8).

## 6. Secrets rotation

Inventory (all in the host's secret store, per service):

| Secret | Cadence | Notes |
|---|---|---|
| `DATABASE_URL`, `REDIS_URL` | on incident / topology change | |
| Razorpay key/secret + webhook secret | quarterly | **dual-accept**: verify webhooks against old+new for 48 h |
| Exotel, Sarvam, MSG91 keys | quarterly | breaker + `unconfigured` envelope make a bad rotation loud, not silent |
| Google Maps keys | quarterly | Maps JS key is referrer-locked, not secret-rotated |
| Object-store access keys | quarterly | rotate backup-bucket creds FIRST and prove a backup lands before rotating the rest |
| Customer-link HMAC key | yearly, dual-accept | old links must survive the window |

Rotate immediately on personnel change or suspected leak. Per-tenant credentials
(BYO-Razorpay, WABA) are the tenant's to rotate — we surface an "invalid credentials"
probe alert (§3) and a settings nag, never silent failure.

## 7. Cost monitoring

- **Per-tenant COGS**: the `usage_events` ledger (voice legs, OTP, storage)
  rolls up into the Cost & usage dashboard next to plan revenue — the margin check that
  keeps pricing honest .
- Monthly ops review (30 min, calendared): hosting invoice, Redis headroom, object-store
  growth, restore-drill timings trend, alert noise triage.

## Cross-references

- Port failure semantics and breaker behaviour: `07-integrations.md`.
- RLS, webhook verification, SSRF guard: `08-security-and-tenancy.md`.
