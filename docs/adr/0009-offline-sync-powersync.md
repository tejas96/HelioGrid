# ADR-0009: Offline sync — PowerSync self-hosted; the write path is our connector

Date: 2026-07-24

## Context

Field surveyors work offline for hours or days (basements, rural sites), capturing surveys and photos that must sync durably when connectivity returns. Replication must be tenant- and assignee-scoped. Photos are large blobs that belong in object storage, not the DB. The write semantics must be explicit and AI-agent-debuggable — not a black-box CRDT.

## Decision

**PowerSync self-hosted (Open Edition) on Fly `bom`, with Postgres bucket storage (no MongoDB).** The decisive property: **PowerSync's write path is our code.** The client keeps local SQLite (op-sqlite) plus a durable upload queue; queued mutations are applied by a **backend connector we write in NestJS** — idempotent, tenant-checked, versioned. We get custom-mutation-queue semantics while PowerSync supplies the hard parts: durable multi-day persistence, upload-queue retry, checkpoint consistency, parameterised partial replication.

- **Scoping**: Sync Streams parameterised from the auth token (`tenant_id = token.tenant AND assignee = token.user`) — server-enforced.
- **Photos**: Attachments Helper → Tigris presigned uploads (offline capture, resumable); only references sync through Postgres.
- **Conflicts**: surveys are versioned-append (revisit = new version); designs are single-editor LWW with a server version check.
- **Bare-RN specifics (verified)**: `@op-engineering/op-sqlite` ≥1.17 (New Architecture supported), metro `getTransformOptions` blockList to disable inline requires for `@powersync/react-native`, WebSocket transport.
- **Web studio** reuses the PowerSync web SDK (OPFS) — one mental model across surfaces.

## Consequences

- We own the connector's idempotency, tenant checks and versioning — deliberately: that is where an agent can read and test the write semantics.
- One more stateful Fly service (`powersync` process group) reading Postgres WAL (`wal_level=logical`) — it joins the postgres-flex ops surface we already own.
- LWW on designs is safe only while single-editor holds; if collaborative editing lands, this conflict policy must be revisited before, not after.
- Open Edition is source-available and free; PowerSync Cloud exists as fallback but would need an India-residency check.

## Alternatives rejected

- **ElectricSQL** — post-rewrite it is read-only sync (Postgres→client shapes); no durable multi-day offline write queue, no mobile blob story — we would rebuild exactly the part that matters for field survey.
- **Zero (Rocicorp)** — 1.0 and elegant, but online-first with a local cache, needs a stateful `zero-cache` replica service, and multi-day offline + large photos are not its sweet spot; RN support newest.
- **Replicache** — maintenance mode; official guidance is migrate to Zero.
- **WatermelonDB** — sync protocol only (we would build the whole server side), untested on RN New Architecture, React 19 peer-dep friction.
- **RxDB** — document/NoSQL model clashes with the relational Postgres + TS domain; Premium $99–239/mo.
- **Fully custom mutation queue** — the honest baseline, but reimplements durable SQLite, upload-queue durability, cursor-based partial pull, checkpoints and the attachment state machine that PowerSync already provides while still letting us own the write API.

## Sources

- `../research/sync.md` · `../research/verify-bareRn.md`
- https://docs.powersync.com/intro/self-hosting · https://docs.powersync.com/sync/overview
- https://powersync.com/blog/building-offline-first-file-uploads-with-powersync-attachments-helper
- https://www.npmjs.com/package/@powersync/react-native · https://electric-sql.com/docs/guides/writes · https://www.infoq.com/news/2026/06/zero-version-1/
