# Temporal — decisions and the production-like local stack

**Status: reviewed spike, not a deployed service.** Track 6 of the architecture-foundation
program. The code cutover is Track 7; the deployment candidate is Track 8. BullMQ is still
what `apps/worker` runs — it is superseded, not yet removed.

```bash
bash infra/temporal/scripts/make-dev-pki.sh          # dev CA, certs, JWT keypair + JWKS
docker compose -f infra/temporal/compose.yaml up -d
bash infra/temporal/scripts/bootstrap.sh             # schema + namespace, idempotent
(cd infra/temporal/spike && node worker.mjs &)       # the spike worker
bash infra/temporal/scripts/probe-identity.sh        # mTLS + authorization
bash infra/temporal/scripts/probe-durability.sh      # restart · DB outage · backup/restore
bash infra/temporal/scripts/probe-rotation.sh        # certificate rotation, all four steps
bash infra/temporal/scripts/probe-upgrade.sh         # one-minor upgrade and rollback
(cd infra/temporal/spike && node probe-durable-handoff.mjs && node probe-replay.mjs)
docker compose -f infra/temporal/compose.yaml down -v
```

---

## 1. The pinned set

Every one of these moves together. Mixing them is not "probably fine": the schema belongs to
a server version, the CLI speaks a server API version, and the SDK negotiates capabilities
with the server it connects to.

| Component | Pin | Digest |
|---|---|---|
| Server | `temporalio/server:1.30.6` | `sha256:c8ade0075f9d9da43c206de2b255c80be49db384045bd1ff76bd58d0f408a314` |
| Admin tools | `temporalio/admin-tools:1.30.6` | `sha256:d6218349ac4468ea97877dedaa5351b16364983946dbde49811d93011da649c6` |
| ↳ `temporal-sql-tool` | 1.30.6 | bundled |
| ↳ `temporal` CLI | 1.6.1 | bundled |
| TypeScript SDK | `@temporalio/*` **1.22.0** | npm |
| Persistence | `postgres:16` | `sha256:33f923b05f64ca54ac4401c01126a6b92afe839a0aa0a52bc5aeb5cc958e5f20` |
| Upgrade target | `1.31.2` server + admin-tools | rehearsed, see §7 |

**By digest, not by tag.** `1.30.6` and `1.31.2` were both rebuilt inside the window this
stack was authored. A spike that proves a behaviour against an image nobody can fetch again
has proven nothing durable.

**Why 1.30.6 and not the newest.** Pinning the previous minor's latest patch makes the
required one-minor upgrade rehearsal (§7) a real drill against the version we would actually
move to, instead of a hypothetical.

---

## 2. What the local stack is, and is not

It is the pinned server image, a **dedicated** PostgreSQL, mutual TLS, a real authorizer, a
JWKS endpoint and namespace bootstrap. It is what Track 8's Fly template is derived from.

It is **not** `temporal server start-dev`. The dev server has no TLS, no authorization and an
in-memory store; every proof below would pass there and mean nothing. Use the dev server for
the inner loop only.

**The database is deliberately separate from the product's.** Temporal's schema is owned by
`temporal-sql-tool` at the server's exact version; product schema is owned by Drizzle
migrations, append-only and hash-locked. In one database, one tool eventually migrates the
other's tables. Different container, different port (5545, one past the product's 5544).

---

## 3. Identity: two halves, and they are different halves

**mTLS answers WHO.** A private CA signs one certificate per identity — `api`, `worker`,
`operator`. `requireClientAuth: true` is the half that matters; without it the server presents
a certificate and accepts anyone, which looks identical in a connection log.

**A token answers WHAT-MAY.** Temporal's default claim mapper reads a signed JWT and the
default authorizer enforces its `permissions` claim. `scripts/mint-token.mjs` mints them.

> **A certificate is not a permission.** `probe-identity.sh` proves it: a valid, trusted
> certificate with **no token** is refused. If that ever passes, every service holds every
> right the moment it can connect at all.

### The authorization finding that shapes Track 8

Measured, not assumed (2026-08-25, SDK 1.22.0 / server 1.30.6):

| Worker claims | Result |
|---|---|
| `heliogrid:worker` | never starts — `DescribeNamespace` refused, reported as *"Namespace heliogrid was not found or otherwise could not be described"* |
| `heliogrid:worker` + `heliogrid:read` | starts, looks healthy for **60 seconds**, then the first long poll returns `PermissionDenied` and the worker goes to state `FAILED` |
| `heliogrid:write` | polls, executes, completes |

So `worker` is neither sufficient nor necessary, and **the built-in authorizer cannot separate
"may start workflows" from "may poll a task queue"** — both are `namespace:write`. The api and
worker identities differ by certificate and token subject, not by privilege.

Separating them for real needs one of:

- a **custom Authorizer plugin** (Go, and therefore a forked server image), or
- a **private enforcing proxy** in front of the frontend, filtering by gRPC method.

Neither is built. It is a Track 8 decision, and the honest position today is: operator is
separated from services; the two services are not separated from each other.

**A 14-second smoke test calls the middle row green.** It is not. The failure lands on the
first long-poll boundary.

### Temporal's own system worker

Turning the authorizer on kills the server at boot: `error starting scanner: Request
unauthorized.` Temporal's scanner calls the frontend as an ordinary client and carries no JWT.
The fix is `internal-frontend`, an additional frontend that internal components use and that
does not run the authorizer. It is not a hole — it is bound inside the deployment and is the
reason the **public** frontend can stay strictly authorized.

---

## 4. The decisions

| Decision | Value | Why, and when to revisit |
|---|---|---|
| Namespace | `heliogrid` | One namespace. Per-tenant namespaces would put tenancy in the orchestrator instead of in the database where RLS already enforces it. Revisit only if a tenant needs isolated retention or throughput guarantees. |
| Retention | **30 days** | Retention covers CLOSED workflows and exists for debugging and replay, not for audit — `audit_log` is the system of record for who did what. 30 days also bounds §6's "wait until every pre-patch execution has closed". |
| History shards | **512, IMMUTABLE** | Cannot be changed after initialisation: a different count means a new cluster and a migration of every workflow. 512 is the smallest value that does not cap a single machine's throughput before the machine does. Lower is unrecoverable; higher spends shard overhead on parallelism one machine cannot use. |
| Task queues | `heliogrid-platform` | One per business area as modules land. A queue is a scaling and isolation boundary — a slow PDF render must not starve a lead assignment. |
| Workflow ids | `<area>-<stable-domain-id>` | Derived, never generated. The id IS the dedupe key (§5). |
| Conflict policy | `USE_EXISTING` for dispatch | A retry attaches to the run in flight. `REJECT_DUPLICATE` is proven to refuse reuse of a completed id — both behaviours are checked. |
| Payload rule | ids, never documents | `limit.blobSize.warn` 256 KB, `error` 2 MB (Temporal's own ceiling is 4 MB per message). A payload approaching this is a design error, not a tuning opportunity. |
| PII rule | **no PII in workflow arguments, signals or search attributes** | History is retained for 30 days and is readable by any operator. Pass a tenant-scoped id; the activity reads the row. |
| Search attributes | none yet | Each is a visibility-schema change. The first module that needs to list by a business field adds one, with its migration. |
| Persistence | dedicated instance, two databases | `temporal` and `temporal_visibility`, isolated from product data (§2). |

---

## 5. Durable handoff — the outbox

The failure it prevents: a product transaction commits, the process tells Temporal to start a
workflow, and the process dies in between. Either the work is silently lost or a retry
silently doubles it. A dual-write has no third option.

The protocol: write the event **in the same transaction** as the product change → a dispatcher
reads pending rows and starts the workflow with a workflow id **derived from the event id** →
mark the row done. Every step is retryable because the id is stable.

`spike/probe-durable-handoff.mjs` proves: a dispatcher that crashes after Temporal accepted the
start, then retries — twice — yields **exactly one** workflow and **exactly one** set of
effects.

> **What is NOT proven.** The outbox TABLE is product schema, and product database work is out
> of scope by owner ruling (2026-08-25). The atomic half — that the row and the product change
> commit together — arrives with the first migration. Until then this is a proven dispatcher
> protocol on top of an unproven transaction boundary.

Activities must be idempotent regardless: Temporal retries them, and a retry that
double-applies is the defect the whole retry model rests on not having.

---

## 6. Workflow evolution — decided before the first durable history

After the first durable history this is a migration, not a decision.

- **Patching.** An incompatible change goes behind `patched(id)`. `probe-replay.mjs` proves
  the gate by breaking it: an extra activity call before the recorded one fails replay with
  `DeterminismViolationError`, and the same change behind `patched()` replays clean.
- **The deprecation sequence.** Deploy with `patched('x')` → wait until every pre-patch
  execution has closed (30-day retention bounds this) → deploy `deprecatePatch('x')` → remove
  the branch. **Skipping the wait is what wedges workflows.**
- **Replay fixtures.** Histories are captured from real executions and replayed against new
  code before it ships. Track 7 makes this a build step.
- **Payloads** are additive and versioned. A removed or retyped field breaks in-flight
  executions that already recorded the old shape.
- **Continue-As-New** before history grows unbounded; `limit.historySize.warn` (10 MB) and
  `limit.historyCount.warn` (10 240) make it visible while still recoverable.
- **Old workers** stay up until every execution they started has closed.

---

## 7. Runbooks, all rehearsed

### Upgrade, one minor at a time — `probe-upgrade.sh`

Skipping a minor is unsupported, and the failure surfaces after the old binary is gone.
**Order is not negotiable:** update the schema with the NEW version's `temporal-sql-tool`
while the OLD server still runs (schemas are backward compatible), then move the binary.
Rehearsed 1.30.6 → 1.31.2 with a workflow in flight, and rolled back.

### Backup and restore — `probe-durability.sh`

`pg_dump -Fc` **both** stores. Restoring one without the other leaves visibility disagreeing
with history: workflows that run but cannot be listed, or listed workflows that do not exist.
Stop the server before restoring — restoring under a running server leaves it holding shard
leases for data that no longer exists. Rehearsed with a live workflow, which resumed and
completed with no duplicate effects.

> `docker exec` **without `-i`** attaches no stdin, so `pg_restore` reads an empty archive and
> exits 0. You get an empty database that looks restored. Count the tables, never trust the
> exit code.

### Certificate rotation — `probe-rotation.sh`

1. **Trust both** — `clientCaFiles` is a bundle of the old and new CA.
2. **Rotate the SERVER's own certificate** to the new CA.
3. **Move clients** to new-CA certificates.
4. **Drop the old CA** from the bundle.

> Step 2 is the one that gets forgotten, and forgetting it takes the CLUSTER down, not just old
> clients: the server verifies its own certificate on the internode path, so dropping the old
> CA while it still presents an old-CA certificate refuses **every** client — including ones
> already holding new-CA certificates. Measured by running the drill without step 2.

### Restart and database outage — `probe-durability.sh`

A workflow in flight survives a server restart and a database outage, and completes afterwards
with its effects applied once.

---

## 8. Configuration traps, all measured

- **Server 1.30.6 ignores a config mounted at the conventional `./config/<env>.yaml`** and
  uses an embedded, environment-driven template instead — *"Loading configuration from
  environment variables only"*. Only `TEMPORAL_SERVER_CONFIG_FILE_PATH` makes it read a file.
- **On that path, `${VAR}` is not expanded.** It reaches the connection string verbatim and
  Postgres rejects `invalid port ":${TEMPORAL_POSTGRES_PORT}"`. Track 8 must **render** the
  config with real values, never ship placeholders and hope.
- **`broadcastAddress` must be an IP.** A hostname is rejected outright: *"ringpop config
  malformed `broadcastAddress` param: temporal"*. Hence compose's fixed subnet.
- **`update-schema -d` wants the `versioned/` directory**, not its parent. Pointed at the
  parent it logs *"invalid directory name: versioned"*, finds zero updates and **exits 0** — a
  silent no-op that leaves the server unable to start.
- **The CLI reads the token from `--grpc-meta authorization=…`.** `TEMPORAL_AUTH_TOKEN` is not
  read by CLI 1.6.1: every call fails *"Request unauthorized."*, which looks like a
  permissions problem rather than a token that was never sent.
- **Do not `rm -rf` the `pki/` directory while containers run.** It replaces the directory
  inode and a running bind mount still points at the old one: certificates read as *"no such
  file or directory"* inside the container while `ls` on the host shows them all present.
  `make-dev-pki.sh` clears contents instead.
- **SQL visibility is eventually consistent.** A `list` immediately after a start can return
  zero rows. Never assume read-after-write on `list` — in a probe it is a flake, in product
  code it is a bug.
- **SDK 1.22.0's worker heartbeat is refused** by the default authorizer and logs a
  `PermissionDenied` WARN every 60 s. The worker is unaffected. Granting the extra permission
  would over-privilege the worker; the SDK exposes no option to disable it. Open — Track 8
  decides between accepting the noise and the proxy in §3.

---

## 9. What this stack does NOT establish

- **It is not HA.** One machine. Restarts and deploys pause orchestration; persisted workflows
  recover afterwards. Track 8 records this as a planned production limitation.
- **The atomic outbox write** — see §5.
- **api/worker privilege separation** — see §3.
- **Load, soak, and alert delivery.** Nothing here says what happens at volume.
- **A production CA.** Everything in `pki/` is 2048-bit development material minted by a shell
  script with no HSM, no passphrase and no revocation path. Track 8 carries the procedure for
  production certificates, never the certificates.
