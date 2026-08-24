> **HISTORICAL EVIDENCE** — its conclusions are already promoted into the authority named below. Cite that, not this file. Promoted into ADR-0009 and docs/06; verified by spike S6.

# Sync Engine Recommendation: HelioGrid Offline-First

## Recommendation: PowerSync, self-hosted (Open Edition) on Fly.io Mumbai

PowerSync is the single best fit, and it wins for a non-obvious reason: **its write path is your code.** The client keeps a local SQLite DB and a durable upload queue; when connectivity returns, queued mutations are handed to a *backend connector* you write — effectively an idempotent REST endpoint that applies changes to Postgres. So you get the explicit, debuggable, AI-agent-friendly write semantics of the "custom mutation queue" option (you own versioning, tenant checks, and last-writer-wins logic), while PowerSync hands you the genuinely hard, bug-prone parts for free: multi-day durable local persistence, upload-queue durability with retry, parameterized partial replication, checkpoint consistency, and photo/attachment handling. It is "custom queue + managed pull/replication," not a black box.

### Why it matches every hard requirement

- **Fully offline for hours/days + background sync:** Client-side embedded SQLite persists all reads and a local write queue across app restarts; sync resumes on reconnect. This is PowerSync's core design, not a bolt-on. ([powersync.com](https://powersync.com/))
- **Tenant-scoped partial replication ("my tenant + my assignments"):** *Sync Streams* (2025, the evolution of Sync Rules) are parameterized subsets a client subscribes to just-in-time with different params — e.g. `tenant_id = token.tenant AND assignee = token.user`. Params derive from the auth token, so scoping is server-enforced. ([docs.powersync.com/sync/overview](https://docs.powersync.com/sync/overview), [Aug 2025 update](https://powersync.com/blog/powersync-update-august-2025))
- **Photos as large blobs → object storage, not DB:** First-class *Attachments Helper* uploads to S3 (or any S3-compatible/Supabase) with a local state machine — capture offline, close app mid-upload, resume safely. Only a reference syncs through Postgres. ([Attachments blog](https://powersync.com/blog/building-offline-first-file-uploads-with-powersync-attachments-helper))
- **Conflict handling (revisit = new version; LWW default):** You control this in the backend connector — write a new survey row/version on revisit, apply LWW elsewhere. PowerSync replicates rows as schemaless JSON with SQLite views on top, so it doesn't impose a conflict model. ([self-hosted docs](https://docs.powersync.com/usage/installation/database-setup/other-self-hosted))
- **Expo maturity:** Mature `@powersync/react-native` SDK. Requires native modules → Expo **CNG / dev build** (not Expo Go). Well-documented. ([RN/Expo SDK docs](https://docs.powersync.com/client-sdks/reference/react-native-and-expo), [npm](https://www.npmjs.com/package/@powersync/react-native))
- **Data residency (DPDP):** Self-host the Docker service (`journeyapps/powersync-service`) on Fly.io **bom (Mumbai)**. Reads Postgres WAL via logical replication (`wal_level=logical`). Bucket-storage backend can now be **Postgres** (not only MongoDB) — so you avoid adding MongoDB to your Fly.io stack and keep everything in-region. ([Self-hosting](https://docs.powersync.com/intro/self-hosting), [self-host-demo](https://github.com/powersync-ja/self-host-demo))

### Web design studio (large JSONB, single-editor)

Reuse the PowerSync **web SDK** (OPFS/wa-sqlite): the design doc becomes one synced JSONB row with LWW — trivially safe given single-editor-at-a-time. Honest caveat: single-editor optimistic UI doesn't *require* a sync engine; a plain optimistic store + idempotent `PATCH` also works. But reusing PowerSync unifies the stack and the mental model for the AI agents, which is worth more than saving one dependency here.

## Alternatives rejected

- **ElectricSQL (post-rewrite):** Now **read-only sync** (Postgres → client via HTTP "shapes"); writes go through your own API, typically paired with TanStack DB for optimistic web UI. It's excellent for read-heavy web optimistic UX but has **no first-class durable multi-day offline write queue or mobile blob story** — you'd rebuild exactly the part that matters most for field survey. Also visibly pivoting to an "agent platform." Good for the *web* studio, wrong primary for *mobile*. ([electric-sql.com/sync](https://electric-sql.com/sync), [writes guide](https://electric-sql.com/docs/guides/writes))
- **Zero (Rocicorp):** Hit **1.0 in June 2026** — genuinely strong, ZQL is elegant. But it's **online-first with a local cache**, requires a stateful `zero-cache` replica service (extra Fly.io operational burden), and its multi-day-offline durability + large-photo workflow are not its sweet spot. RN support is newer (0.23). Great for the web studio, risky as the offline-field backbone. ([InfoQ 1.0](https://www.infoq.com/news/2026/06/zero-version-1/), [zero.rocicorp.dev](https://zero.rocicorp.dev/))
- **Replicache:** **Maintenance mode**, no new features, official guidance is migrate to Zero. Reject. ([replicache.dev](https://replicache.dev/))
- **WatermelonDB:** Client-only SQLite + a sync *protocol spec* — you still build the entire server, partial replication, and attachment logic (i.e. the custom queue, minus the queue durability). Plus **2026 maintenance gaps**: untested on RN new architecture (mandatory in Expo SDK 54), React 19 peer-dep friction, lagging Expo plugin. Reject on maintenance risk. ([DEV SDK 54 guide](https://dev.to/fasthedeveloper/watermelondb-expo-sdk-54-the-complete-mobile-offline-first-setup-guide-that-actually-works-5he5))
- **RxDB:** Capable, good Expo storage, but **document/NoSQL model** clashes with your relational Postgres + TS domain, you still build the Postgres replication endpoint, and Premium is **$99–$239/mo**. More friction, less fit than PowerSync. ([rxdb.info/premium](https://rxdb.info/premium/))
- **TinyBase:** Lightweight reactive in-memory store; great for small local UI state, wrong tool for large tenant-scoped datasets + server partial replication + blobs. Reject.
- **Plain custom mutation queue:** The honest baseline and PowerSync's own write model — but going *fully* custom means reimplementing durable local SQLite, upload-queue durability, cursor-based partial pull, checkpoint consistency, and the photo attachment state machine. PowerSync gives all of that while *still* letting you own the write API. Choose custom only if you must eliminate every dependency.

## Pricing

- **PowerSync Open Edition:** free, source-available, self-hosted (recommended for DPDP). ([self-hosting](https://docs.powersync.com/intro/self-hosting))
- **PowerSync Cloud** (fallback): free tier 2 GB synced/mo, 50 concurrent conns; Pro **$49/mo**; Team **$599/mo**; billed on data synced + concurrency, not per-row. Verify India-region residency before choosing Cloud — self-host removes the doubt.

## Sources
- [powersync.com](https://powersync.com/) · [Self-hosting](https://docs.powersync.com/intro/self-hosting) · [Sync overview / Streams](https://docs.powersync.com/sync/overview) · [RN/Expo SDK](https://docs.powersync.com/client-sdks/reference/react-native-and-expo) · [Attachments](https://powersync.com/blog/building-offline-first-file-uploads-with-powersync-attachments-helper) · [Self-host demo](https://github.com/powersync-ja/self-host-demo)
- [ElectricSQL sync](https://electric-sql.com/sync) · [Electric writes](https://electric-sql.com/docs/guides/writes)
- [Zero 1.0 (InfoQ)](https://www.infoq.com/news/2026/06/zero-version-1/) · [zero.rocicorp.dev](https://zero.rocicorp.dev/) · [Replicache](https://replicache.dev/)
- [WatermelonDB + Expo SDK 54](https://dev.to/fasthedeveloper/watermelondb-expo-sdk-54-the-complete-mobile-offline-first-setup-guide-that-actually-works-5he5) · [RxDB Premium](https://rxdb.info/premium/)