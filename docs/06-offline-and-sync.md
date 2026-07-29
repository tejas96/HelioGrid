# 06 — Offline & Sync

> **Sequencing (owner directives, 2026-07-24): this layer is the LAST track of the single
> 20-day build** (Track E, Days 17–19, docs/14) — inside the window, not after it. Until
> Day 17 the mobile app is **online-first** with all data access behind repository
> interfaces so PowerSync slots in as a data-layer swap, not a screen rewrite. Two things
> ship on Day 1–7 regardless, because they are this document's write model: surveys are
> versioned-append from the first migration, and the `sync_mutations` idempotency ledger
> exists (empty) from migration 0001. The PowerSync deploy smoke test is spike S6 (Day 1–2).
> Everything below is the binding design, unchanged.

Offline-first architecture for the field app (bare React Native) and the web studio.
Engine: **PowerSync self-hosted (Open Edition)** on Fly `bom`, Postgres bucket storage,
writes through **our NestJS backend connector**. Sources: [`./research/sync.md`](./research/sync.md),
[`./research/verify-bareRn.md`](./research/verify-bareRn.md),
[`./research/verify-flyNative.md`](./research/verify-flyNative.md),
[`./research/fly.md`](./research/fly.md), `apps/mobile/CLAUDE.md`, BLUEPRINT §Offline & sync.

## 1. Principles

1. **Reads are local, always.** Every synced entity is read from the device SQLite
   (op-sqlite on RN, OPFS wa-sqlite on web). No screen blocks on connectivity; no spinner walls.
2. **Writes are queued, never lost.** All mutations enter PowerSync's durable upload queue
   and land on our idempotent NestJS connector. The server is the only writer to Postgres.
3. **The server owns truth and money.** Version checks, tenant checks, business identifiers,
   and every rupee are computed server-side. Offline output is always labelled provisional.
4. **One mental model.** Mobile and web use the same PowerSync streams, the same mutation
   envelope, the same conflict matrix. AI agents implement one write path, not three.

## 2. PowerSync deployment on Fly `bom`

Self-hosted `journeyapps/powersync-service` (Open Edition, free — [docs.powersync.com/intro/self-hosting](https://docs.powersync.com/intro/self-hosting)),
run as the `powersync` **process group** of the api Fly app in `bom`, per BLUEPRINT.

| Item | Ruling |
|---|---|
| Image | `journeyapps/powersync-service` (pin digest in `fly.toml`; upgrade deliberately) |
| Region | `bom`, `min_machines_running=1`, `autostop="off"` (bom capacity is tight; cold restarts can fail — [`./research/fly.md`](./research/fly.md)); `sin` overflow fallback documented, never default |
| Sizing | Start **1× shared-cpu-2x / 2 GB**. Field fleet at offline GA (Track E, docs/14) is < 500 concurrent devices; PowerSync API nodes are stateless over shared bucket storage — scale by adding machines behind Fly proxy, not by resizing first |
| Source DB | Fly postgres-flex primary, `wal_level=logical`; dedicated replication role `powersync_repl` (REPLICATION, SELECT on synced tables only, no BYPASSRLS) |
| Publication | `CREATE PUBLICATION powersync FOR TABLE leads, customers, sites, surveys, survey_photos, visits, designs, notifications, tenant_catalog_items, tenant_catalog_overrides, platform_catalog_items, users, user_roles;` — synced tables only, never the whole DB (keeps WAL fan-out and bucket churn bounded) |
| Bucket storage | **Postgres** (no Mongo in the stack — [`./research/sync.md`](./research/sync.md)): a dedicated database `powersync_buckets` on the same postgres-flex cluster, so bucket vacuum churn never bloats the app DB. Escape hatch: move buckets to their own small cluster if replication lag alerts fire |
| Auth | PowerSync validates the **Better Auth JWT** via our JWKS endpoint (`/api/auth/jwks`, jwt plugin). Claims consumed: `sub`, `tenant_id`, `roles[]`. Token audience `powersync`; TTL 10 min, refreshed by the client SDK callback |
| Transport | WebSocket (required on bare RN — [`./research/verify-bareRn.md`](./research/verify-bareRn.md)); exposed at `sync.heliogrid.in` via Fly proxy, TLS terminated by Fly |
| Monitoring | Replication-slot lag, bucket op/s, connected-client count → alerts in 09-observability. A dropped slot is a declared incident: recreate slot, service re-snapshots, clients resync from checkpoint (no data loss — writes live in the upload queue, not the slot) |

## 3. Sync Streams

Streams are parameterised from the verified JWT (`token_parameters`) — scoping is
server-enforced, the client cannot widen it ([docs.powersync.com/sync/overview](https://docs.powersync.com/sync/overview)).
Definitions live in `sync-streams.yaml` beside the api app; the file is reviewed like a
contract change. Concrete definitions (PowerSync stream syntax, pinned to the service
version at implementation):

```yaml
streams:
  # Field surveys: everything the surveyor needs to work a site offline for days.
  surveys:
    query: |
      SELECT * FROM surveys
      WHERE tenant_id = token_parameters.tenant_id
        AND assigned_to = token_parameters.user_id
        AND status != 'superseded'
  survey_photos:
    query: |
      SELECT id, tenant_id, survey_id, file_id, tag, source, caption,
             obstruction_ref, lat, lng, taken_at FROM survey_photos
      WHERE tenant_id = token_parameters.tenant_id
        AND survey_id IN (SELECT id FROM surveys
                          WHERE assigned_to = token_parameters.user_id)

  # Visits: my schedule, 14 days back / 30 days forward.
  visits:
    query: |
      SELECT * FROM visits
      WHERE tenant_id = token_parameters.tenant_id
        AND assigned_to = token_parameters.user_id
        AND scheduled_at BETWEEN (now() - interval '14 days') AND (now() + interval '30 days')

  # Leads I own, plus the customer/site rows those leads reference.
  leads-mine:
    query: |
      SELECT * FROM leads
      WHERE tenant_id = token_parameters.tenant_id
        AND owner_user_id = token_parameters.user_id
  customers-mine:
    query: |
      SELECT * FROM customers
      WHERE tenant_id = token_parameters.tenant_id
        AND id IN (SELECT customer_id FROM leads WHERE owner_user_id = token_parameters.user_id)
  sites-mine:
    query: |
      SELECT * FROM sites
      WHERE tenant_id = token_parameters.tenant_id
        AND customer_id IN (SELECT customer_id FROM leads WHERE owner_user_id = token_parameters.user_id)

  # Notifications: mine, last 30 days.
  notifications:
    query: |
      SELECT * FROM notifications
      WHERE tenant_id = token_parameters.tenant_id
        AND user_id = token_parameters.user_id
        AND created_at > (now() - interval '30 days')

  # Reference data: resolved two-tier catalog + teammates. Read-only on device.
  catalog-read:
    query: |
      SELECT * FROM tenant_catalog_items WHERE tenant_id = token_parameters.tenant_id
    # plus platform_catalog_items (global, no tenant filter) and
    # tenant_catalog_overrides scoped by tenant_id — three sub-streams, one subscription.
  team:
    query: |
      SELECT id, tenant_id, name, phone_e164, language FROM users
      WHERE tenant_id = token_parameters.tenant_id
  team-roles:
    query: |
      SELECT tenant_id, user_id, role FROM user_roles
      WHERE tenant_id = token_parameters.tenant_id
    # users has no roles column — roles resolve on-device via a user_roles join
```

Rulings:
- **Role widening**: managers/owners subscribe to `leads-mine` with an additional
  team-scope parameter derived from `roles[]` in the token (widest-visibility rule from
  08-security). The stream parameter is still token-derived — never a client-supplied filter.
- **Designs are NOT in the mobile stream set.** The studio is an authenticated WebView and
  design editing is online (see §7 and §8). The web studio subscribes to a
  `designs-for-project` stream (parameterised by project id) via the web SDK.
- **Photo binaries never sync through streams** — only metadata rows; binaries take the
  attachment pipeline (§5).

## 4. Write path — the NestJS backend connector

PowerSync's `uploadData()` delivers the queued CRUD batch to **one** ts-rest endpoint:

```
POST /v1/sync/mutations          (contract: contracts/sync.ts)
Body: { mutations: MutationEnvelope[] }   // ordered, ≤ 50 per batch
MutationEnvelope: {
  mutation_id: uuid,             // client-generated, THE idempotency key
  entity: 'survey' | 'survey_photo' | 'visit' | 'lead' | 'notification_read' | 'design',
  op: 'create' | 'update' | 'transition',
  payload: <entity Zod schema>,
  base_version: int | null,      // required where the conflict matrix says version-check
  captured_at: timestamptz       // device clock, display/audit only — never ordering
}
```

Server behaviour, in order, per mutation:
1. **Idempotency**: look up `mutation_id` in `sync_mutations`; if present, return the stored
   outcome without re-applying (at-least-once delivery is expected).
2. **Tenant check**: `tenant_id` comes from the JWT, never from the payload. Payload rows
   referencing another tenant's ids → outcome `rejected:tenant`.
3. **Validation**: Zod schema from `packages/contracts`. Failure → outcome
   `rejected:invalid` and the payload is stored in the quarantine column (§10).
4. **Version/conflict rule** per the matrix (§6). Violation → `rejected:conflict` (surveys,
   leads: resolved silently per rule; designs: hard reject).
5. **Apply** inside one transaction with `SET LOCAL app.tenant_id` (RLS backstop), write the
   activity/audit entries the rule demands, insert the `sync_mutations` ledger row.

Response is per-mutation: `{ mutation_id, outcome: 'applied' | 'rejected', code, server_version }`.
**Every response — including rejects — acks the mutation**: the client removes it from the
queue and the next sync-down replaces local state with server truth. Rejected-but-user-visible
outcomes surface in the attention tray (§9). The connector never returns 5xx for a business
rejection; 5xx means "retry the batch later" and is reserved for genuine faults.

Ledger table `sync_mutations`: `mutation_id (pk)`, `tenant_id`, `user_id`, `entity`, `op`,
`outcome`, `code`, `quarantined_payload jsonb null`, `applied_at`. Retention 90 days
(matches recording retention; enough to debug any field dispute).

Mutation census (what may be written offline at all):

| Entity | Offline ops | Idempotency | Version rule |
|---|---|---|---|
| survey | create, update (own in-progress version), transition(submit) | `mutation_id` | versioned-append (§6) |
| survey_photo | create (metadata row after upload ack) | `mutation_id` | none — insert-only |
| visit | create, update, transition(status) | `mutation_id` | LWW + monotonic status guard |
| lead | create (quick-add), update (fields), transition(stage) | `mutation_id` | per-field LWW + activity log |
| notification_read | transition(read) | `mutation_id` | set-once, idempotent |
| design | update (web studio only, online) | `mutation_id` | `base_version` check → 409 |
| catalog / proposal / project / billing | **none** — not writable through the connector | — | server-only surfaces |

## 5. Attachment pipeline (survey photos)

PowerSync Attachments Helper state machine ([powersync.com/blog/building-offline-first-file-uploads-with-powersync-attachments-helper](https://powersync.com/blog/building-offline-first-file-uploads-with-powersync-attachments-helper))
over **Tigris presigned uploads** (presigned PUT + multipart verified —
[`./research/verify-flyNative.md`](./research/verify-flyNative.md)):

1. **Capture offline** → JPEG written to app-private storage; local attachment record
   `QUEUED_UPLOAD` with survey id, tags, `captured_at`, provenance (`measured`/reference per D35).
2. **Connectivity returns** → client calls `POST /v1/attachments/presign`
   (tenant-scoped key `t/{tenant_id}/surveys/{survey_id}/{photo_id}.jpg`; server checks the
   survey belongs to the tenant + assignee before signing; URL TTL 15 min).
3. **Upload**: single presigned PUT for < 8 MB (almost all photos); multipart with part-level
   resume above that (drone orthos). Retry with exponential backoff; state survives app kills.
4. **Ack**: `POST /v1/attachments/{photo_id}/complete` → server HEADs the object, writes the
   `survey_photos` row (which then syncs down to every entitled device), enqueues thumbnail
   generation in `apps/worker`.
5. **Ack-then-prune**: full-resolution local copy is deleted only after the `survey_photos`
   row has synced back down (proof the server owns it). The device keeps the thumbnail.
   Local cache cap 2 GB, LRU eviction of acked originals first.

Never: photos as base64 through the sync stream, client-composed object keys accepted
unchecked, or pruning before server ack.

## 6. Conflict matrix

| Entity | Rule | Mechanics |
|---|---|---|
| **Survey** | **Versioned-append.** A revisit NEVER overwrites v1 (product rule, `apps/mobile/CLAUDE.md`) | Revisit = connector inserts a new survey version; prior versions immutable. Within one in-progress version by its own author, field updates are LWW by server apply order. Two devices editing the same in-progress version (shouldn't happen — assignee-scoped) → second writer's fields win, both recorded in audit |
| **Design** | **Single-editor + server version check → 409** | Every design save carries `base_version`. Mismatch → `rejected:conflict` (HTTP 409 on the direct studio path); client reloads server state, user re-applies. No merge, ever — the canonical `Project` JSONB is one document. Practically LWW because single-editor, but the check makes a stale second editor impossible to silently lose |
| **Lead field edits** | **Per-field LWW + activity log** | Server apply order wins per field; every applied change writes an activity entry (field, old → new, actor, `captured_at`, applied_at) so a "lost" concurrent edit is always visible and recoverable from the log. Stage transitions validated against the pipeline state machine; invalid transition → `rejected:conflict`, local state corrected on sync-down |
| **Visit** | LWW + monotonic status | Status may only move forward (planned → en-route → completed/cancelled); a regressing offline write is rejected and corrected down |
| **Catalog** | **Server-authoritative, read-only on mobile** | `catalog-read` stream is display truth; edits happen on web, online, through the normal API. A device never mutates catalog rows |
| **Notifications** | Server-authoritative down; `read_at` up | Set-once; duplicate reads are idempotent no-ops |

Clock rule: **LWW is resolved by server apply order**, never device clocks. `captured_at`
is preserved for display and audit only.

## 7. Web studio usage

The web studio reuses the **PowerSync web SDK** (wa-sqlite over OPFS) so web and mobile
share one sync mental model ([`./research/sync.md`](./research/sync.md)):

- `designs-for-project` stream syncs the design JSONB + variants for the open project;
  reads and undo/redo state are instant and survive tab reloads offline.
- Saves are **optimistic**: applied to the local row immediately, uploaded through the same
  connector envelope with `base_version` (§6). A 409 rolls the optimistic state back and
  surfaces the reload prompt.
- **Staleness via SSE** (Nest-native, per BLUEPRINT realtime ruling): the 5-layer fingerprint
  staleness events (design changed → quote provisional; recompute finished → fresh) arrive
  on the SSE channel, not through sync — they are ephemeral signals, not synced rows.
- The studio remains fully usable through connectivity blips (geometry, layout, electrical —
  all `packages/domain`, all local). Only server recomputes (§8) and saves queue.

## 8. What is NOT offline

- **Money math.** Proposal totals, GST, subsidy, discounts, tranches are recomputed
  **server-side only** (one money path; server-assigned proposal numbers). Offline, a user
  can queue a *proposal draft request*; every figure shown from local data renders with the
  **provisional** treatment until the server recompute lands — the money-never-stale rule
  applies verbatim. No device ever prints a customer-facing price computed locally.
- **Design editing on mobile.** The studio WebView requires connectivity; the field app
  captures the survey that feeds it. (Web studio tolerates blips per §7.)
- **Catalog and price-book edits, proposal send, customer links, project payments,
  billing/entitlement changes** — online-only API surfaces. Entitlement state is cached
  on-device with a 72 h grace so a paid tenant is never soft-blocked by a dead zone;
  read + export always work regardless (product law).
- **External intelligence**: PVGIS, Google Solar, Gemini roof detection, voice-agent
  config — server-proxied, online-only, metered.

## 9. Sync status UX contract

Per the journey spec ([`./research/journey.md`](./research/journey.md) §Mode B):

- **Global chip** (My Day + profile): `"3 surveys waiting · 47 photos · will upload on Wi-Fi"` —
  counts of queued mutations and queued attachments, last successful sync time. Tapping it
  opens the sync tray with per-item detail.
- **Never blocking.** No modal, no spinner wall, no disabled primary actions because of
  connectivity. Saves always succeed locally and say so.
- **Per-record badges**: queued → syncing → synced; plus an **attention** state for
  `rejected:*` and quarantined items with a one-line reason and a retry/discard affordance.
- **Wi-Fi preference**: attachment uploads default to Wi-Fi-or-charging; the user can force
  "upload now on mobile data" per batch. Mutations (tiny) always upload immediately.
- Copy is Lingui-catalogued (EN/HI/MR) like every other string.

## 10. Failure modes & recovery

| Failure | Behaviour |
|---|---|
| **Token expiry while offline** | Local reads/writes continue indefinitely — the JWT gates the *connection*, not the local DB. On reconnect the SDK's token callback refreshes via Better Auth (session in react-native-keychain). Refresh fails (revoked/expired session) → re-auth prompt; the upload queue is preserved and released only when the **same user** on the **same tenant** signs back in. A different user signing in wipes the local DB and queue first — tenant isolation beats convenience |
| **Client schema migration** | PowerSync replicates schemaless JSON with client-defined SQLite views, so **additive** server columns are safe with old clients. Discipline: synced tables are additive-only; a breaking change requires a stream version bump plus a `min_supported_client` floor served by the api — older apps get a soft "update required" screen with reads still working |
| **Corrupt payload (client or server)** | **Quarantine, never crash, never silently drop** — ported from the POC's per-project quarantine ([`./research/appShape.md`](./research/appShape.md)). Client-side: a synced row that fails Zod normalise-on-load is quarantined locally and badged for attention. Server-side: a mutation failing validation is stored in `sync_mutations.quarantined_payload` with outcome `rejected:invalid`, alerting ops; nothing a field user captured is ever unrecoverable |
| **Replication slot dropped / bucket storage rebuilt** | Declared incident (09-observability runbook): recreate slot, service re-snapshots the publication, clients resync from checkpoint. No write loss — pending writes live in device upload queues, not the slot |
| **Device storage pressure** | 2 GB attachment cache cap, LRU-prune acked originals (§5); synced tables are assignment-scoped and small by construction (§3) |
| **bom capacity event** | `powersync` group pinned `min=1, autostop=off`; documented failover to `sin` (service is stateless; bucket DB reachable cross-region with added latency). Clients just reconnect |

## 11. Bare-RN wiring (binding, verified)

From [`./research/verify-bareRn.md`](./research/verify-bareRn.md) and `apps/mobile/CLAUDE.md` — not optional:
`@powersync/react-native` + `@op-engineering/op-sqlite` (pod install; New Architecture OK);
`metro.config.js` blockList disabling inline requires for `@powersync/react-native`;
WebSocket transport; `@babel/plugin-transform-async-generator-functions` +
`@azure/core-asynciterator-polyfill` for watched queries. All reads via PowerSync SQLite;
all writes via the connector — **no direct API calls for any entity that has a synced table**.
