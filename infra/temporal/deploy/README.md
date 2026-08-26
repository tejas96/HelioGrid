# heliogrid-temporal — deployment candidate

**Nothing here is deployed.** No Fly app, no database, no certificate authority, no DNS
record, no machine, no billable resource exists. Creating any of them is a separate
owner-approved operation (`CLAUDE.md` §4).

This is a **reviewed candidate**: version-pinned configuration, an image, a Fly template,
runbooks, and alerts — every one of them validated against the production-like local stack and
the real built images. It is not a production-ready service; §"What would still be needed"
says exactly what is missing.

Decisions, and every measured trap behind them: [`../README.md`](../README.md).

---

## 1. What is here

| | |
|---|---|
| `Dockerfile` | the `heliogrid-temporal` image — server + `temporal-sql-tool` + CLI + `pg_dump`, all pinned by digest |
| `fly.toml` | the app template: private-only, no auto-stop, drain window, gRPC health check, metrics |
| `config/server.template.yaml` | the server config, **rendered at container start** |
| `config/dynamicconfig/production.yaml` | the few knobs that change without a restart |
| `config/ui.template.yaml` | the UI — **disabled by default**, operator-private, never a deployed service |
| `scripts/render-config.sh` | the entrypoint: substitute, verify nothing is left unsubstituted, exec |
| `scripts/bootstrap-schema.sh` | idempotent schema create/upgrade |
| `scripts/backup.sh` · `scripts/upgrade.sh` | the two runbooks an operator runs under pressure |
| `observability/` | Prometheus scrape config and alert definitions |

---

## 2. Why the config is a template

Temporal **does not expand `${VAR}`** in a config file: the placeholder reaches the connection
string verbatim and Postgres rejects `invalid port ":${…}"` (measured — `../README.md` §8). And
`broadcastAddress` must be the machine's own 6PN address, which does not exist until it boots.

So `render-config.sh` substitutes at container start and then `exec`s the server. It:

- **refuses to start** on a missing variable, naming it;
- **refuses to start** if any `__PLACEHOLDER__` survived — otherwise the server boots and fails
  on its first query with a message about SQL rather than about configuration;
- reads the database password from a **file**, never a value in the environment.

`PG_TLS` is a rendered decision rather than a constant, and it **defaults to `true`**: an unset
flag has to give the safe value, because a typo that silently disabled encryption to the
database would never announce itself. The local validation passes `false` explicitly — written
down, not assumed.

### Secrets are files

A private key in an environment variable is readable by every child process, appears in
`fly ssh console` output, and lands in any crash dump that snapshots the environment. Fly
writes secrets to files for exactly this reason; so do we.

**Tokens are re-read, not read once.** A token has an expiry and a machine runs for weeks. Read
once at boot, every call fails the moment it lapses with *"Request unauthorized."* — which
reads as a permissions problem, so the instinct is to widen permissions. The API passes a
FUNCTION the SDK calls per request; the worker re-reads on an interval and calls `setApiKey`.
Both key on the file's mtime, so an unrotated token costs one `stat`. Proven by rotating both
credentials on a live system and completing a workflow with no restart
(`../scripts/probe-token-refresh.sh`).

---

## 3. Private only

There is deliberately **no `[http_service]` and no public `[[services]]`** block. Port 7233 is
reachable over Fly's 6PN network as `heliogrid-temporal.internal`, and nothing about Temporal's
API should ever face the internet — publishing it is not a configuration choice, it is an
incident.

`heliogrid-temporal.internal` is therefore also the name the server certificate must carry as a
SAN, and the name every client verifies. Validated: a certificate carrying that SAN, presented
by the candidate image, accepted by a client that verifies it.

`auto_stop_machines = "off"` is load-bearing. A stopped Temporal is a stopped orchestrator:
every durable timer, waiting workflow and task-queue poll stops with it.

**Health is a gRPC check, not TCP.** `temporal operator cluster health` exercises transport
identity, authorization and persistence together; a server that has lost its database still
accepts a TCP connection on 7233.

---

## 4. The shard decision — do this before the first boot, not after

`numHistoryShards: 512` is **IMMUTABLE**. It is written into the cluster at initialisation, and
changing it later means a new cluster and a migration of every workflow.

Procedure, and it runs exactly once:

1. **Bound the ceiling.** The shard count sets the maximum parallelism of history processing.
   Too low permanently caps throughput; the cap cannot be raised.
2. **Bound the cost.** Every shard is background work and database connections on a single
   machine. Too high spends overhead on parallelism one machine cannot use.
3. **512** is the smallest value that does not cap a single machine before the machine itself
   does. It is Temporal's own guidance for small production, and it booted here on one
   container with `postgres:16` — *"initial shards ready, total: 512"*.
4. **Write the number and this reasoning into the change that initialises the cluster.** If it
   is ever revisited, the revisit is a migration plan, not an edit.

Do NOT copy a dev cluster's value. A local `1` or `4` is convenient and unrecoverable.

---

## 5. Runbooks

Each of these was rehearsed against the local stack before it was written down —
`../scripts/probe-*.sh`.

### Bootstrap

`scripts/bootstrap-schema.sh`, idempotent. Idempotence is not convenience: an upgrade runs the
same commands against a cluster that already holds data, so a bootstrap that only works on an
empty database is one whose upgrade path was never rehearsed.

> `update-schema -d` wants the **`versioned/`** directory. Pointed at its parent it logs
> *"invalid directory name: versioned"*, finds zero updates and **exits 0** — a silent no-op
> that leaves the server unable to boot.

> `temporal-sql-tool --tls` is a **boolean**, and there is no `--tls-enable-host-verification`.
> The invented flag made the tool print its help and exit 0, so the schema step silently did
> nothing. Found by running it in the image (2026-08-26).

### Upgrade — `scripts/upgrade.sh`

**One minor at a time**, and **schema first**, with the new version's `temporal-sql-tool`, while
the old server still runs. Schemas are backward compatible; a binary is not compatible with a
schema it does not know. Rehearsed 1.30.6 → 1.31.2 with a workflow in flight, and rolled back.

The single-machine consequence, stated so nobody is surprised: **this deploy pauses
orchestration**. Persisted workflows recover and lose nothing; in-flight activities are drained
by `kill_timeout`.

### Backup and restore — `scripts/backup.sh`

**Both stores, always.** Restoring history without visibility leaves workflows that run but
cannot be listed; the reverse leaves listed workflows that do not exist.

> `pg_dump` writes a valid EMPTY archive rather than failing, and `docker exec` without `-i`
> gives `pg_restore` no stdin — it reads an empty archive and exits 0. **Count the tables;
> never trust the exit code.** Both cost a rehearsal to find.

Restore is rehearsed in `../scripts/probe-durability.sh` §3 with a live workflow, which resumed
and completed with no duplicate effects.

### Rotating certificates — four steps, not three

1. **Trust both** — `clientCaFiles` is a bundle of the old and new CA.
2. **Rotate the SERVER's own certificate** to the new CA.
3. **Move clients** to new-CA certificates.
4. **Drop the old CA** from the bundle.

> Step 2 is the one that gets forgotten, and forgetting it takes the **cluster** down, not just
> old clients: the server verifies its own certificate on the internode path, so dropping the
> old CA while it still presents an old-CA certificate refuses **every** client — including
> ones already holding new-CA certificates. Measured by running the drill without it.

Certificate **expiry is not monitored** — there is no metric for it. `observability/alerts.yaml`
carries an explicit placeholder so the gap is visible rather than assumed.

---

## 6. Authorization, and its known limit

Two halves: mutual TLS says WHO, a signed token says WHAT-MAY. A certificate is not a
permission — a valid, trusted certificate with no token is refused
(`../scripts/probe-identity.sh`).

**The built-in authorizer cannot separate "may start a workflow" from "may poll a task
queue"** — both are `namespace:write`. So `heliogrid-api` and `heliogrid-worker` hold different
certificates and different token subjects, but the **same Temporal role**. Operator is properly
separated (`temporal-system:admin`).

Closing that needs a custom Authorizer plugin (a forked server image) or a private enforcing
proxy filtering by gRPC method. **Neither is built**, and this is the open decision this track
hands over rather than papering over. `../README.md` §3 has the measurements.

Temporal's own system worker is exempted through `internal-frontend` — never published, not
subject to the authorizer, and the reason the public frontend can stay strictly authorized.

---

## 7. What was validated, and how

Against the running local stack, the pinned images, and `apps/{api,worker}/dist`:

- the candidate image **builds** and carries `temporal-server`, `temporal-sql-tool`, the CLI,
  the schema files and `pg_dump`, all at the pinned version;
- `render-config.sh` **refuses** a missing variable, **refuses** a bad `PG_TLS`, and defaults
  `PG_TLS` to `true`;
- the image **boots** from the rendered config against a real database and reports **SERVING**
  through `heliogrid-temporal.internal`, with the client verifying that SAN;
- the metrics port `fly.toml` scrapes returns **200** on `/metrics`;
- `bootstrap-schema.sh` runs **idempotently** against the live database from inside the image;
- `backup.sh` dumps **both** stores from inside the image;
- the **real** worker and the **real** API gateway complete a workflow against it — 7/7;
- both identity tokens are **rotated live** and a workflow completes with **no restart**.

---

## 8. What this is NOT

- **Not HA.** One machine. Restarts and deploys **pause orchestration**; persisted workflows
  recover afterwards and lose nothing, but nothing progresses while it is down. Accepted for
  launch and recorded here rather than discovered in production.
- **Not deployed.** No Fly resource exists.
- **Not a production CA.** Everything used to validate this is development material from a
  shell script — no HSM, no passphrase, no revocation path. The procedure ships; the
  certificates do not.
- **Not load-tested.** Nothing here says what happens at volume, and the sizing
  (`shared-cpu-2x`, 2 GB, 512 shards) is a starting assumption, not a measurement.
- **Not privilege-separated between api and worker** — §6.

## 9. What would still be needed before calling it production-ready

The real Fly deployment · a load and soak test at expected volume · alert delivery actually
firing to a human · a restore drill against production-class persistence · a certificate
rotation performed with real certificates · and the one-minor upgrade rehearsal repeated
against that cluster. Each is an owner-approved operation.
