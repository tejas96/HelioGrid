> **HISTORICAL EVIDENCE** — its conclusions are already promoted into the authority named below. Cite that, not this file. Promoted into ADR-0007 and ADR-0008; spikes S2/S4 supersede it operationally.

# VERDICT

**(a) Tigris — sin pinning: YES.** Single-region buckets are supported; Singapore (`sin`) is a live Tigris region. S3 compatibility is high (SigV4, presigned URLs, multipart) — works as a wal-g/pgBackRest S3 target and as a PowerSync attachment backend. **(b) Upstash on Fly — LIVE, not deprecated;** reachable in all Fly regions incl. `bom`. BullMQ works over the TCP/RESP endpoint; the real risks are **cost (per-request billing)** and **eviction** — keep eviction OFF (it's the default). No command restriction fundamentally breaks BullMQ. **(c) Fly unmanaged Postgres — DEPRECATED;** repmgr HA works but backups to Tigris are DIY (Barman/pg_dumpall), not wal-g.

---

## (a) Tigris object storage
- **Region pinning:** Tigris offers 4 location types — global (default), multi-region, dual-region, **single-region** ("redundancy across AZs within a single region"). `sin` is deployed (Tigris live in FRA, GRU, IAD, JNB, LHR, MAD, ORD, **SIN**, SJC, SYD) and appears in dual-region examples (`sjc + sin`). Placement controlled via the **`X-Tigris-Regions`** header on PUT and bucket location config. Note: `flyctl`/CLI flag names for single-region aren't fully documented — verify with `fly storage create` / Tigris console.
- **S3 completeness:** AWS SDK-compatible, SigV4, **presigned URLs**, **multipart uploads**, object HTTP headers. Sufficient for **wal-g / pgBackRest** as an S3 repo target and for **PowerSync's** remote-storage adapter (presigned PUT/GET pattern). No egress fees. (No doc explicitly certifies wal-g/pgBackRest against Tigris — treat as "S3-compatible, expected to work," test archive+restore.)
- URLs: https://www.tigrisdata.com/docs/buckets/locations/ · https://www.tigrisdata.com/docs/objects/object_regions/ · https://fly.io/docs/tigris/ · https://docs.powersync.com/client-sdks/advanced/attachments

## (b) Upstash Redis (Fly extension), bom
- **Status:** Actively offered, not deprecated; "available in all Fly regions" via private IPv6 (so `bom`/Mumbai works).
- **Eviction:** Default = none (safe). When enabled it mimics `volatile-random` + `allkeys-random` — **this breaks BullMQ**, which requires `noeviction`. So: leave eviction disabled.
- **Pricing:** PAYG $0.20/100k requests (caps: 10 GB, 10k cmd/s); **Fixed** $10/mo (250 MB) → $400/mo (50 GB); read replicas $5–$200. Fly explicitly recommends **fixed plans for BullMQ/Sidekiq** (aggressive polling inflates PAYG).
- **BullMQ compat:** Use TCP/RESP endpoint (not REST). Set `maxRetriesPerRequest: null`; blocking `BRPOP/BZPOPMIN` supported. No fundamental command block — main gotcha is cost + eviction.
- URLs: https://fly.io/docs/upstash/redis/ · https://upstash.com/docs/redis/integrations/bullmq · https://docs.bullmq.io/guide/going-to-production

## (c) Fly unmanaged Postgres (Flex/repmgr), bom
- **Deprecated;** Fly steers to MPG (`fly mpg`), self-support only. HA via **repmgr** (postgres-flex image, 3+ nodes) is functional.
- **Backups:** **wal-g NOT bundled** in postgres-flex (was in old stolon `postgres-ha`). **Barman** now supports PITR but needs manual `barman -q cron`; users report `fly clone` failing after Barman recovery. wal-g/pgBackRest awkward (need host FS access). Common pattern: **`pg_dumpall` → S3/Tigris**.
- **Gotchas:** No Fly support; you own OOM/disk/DR; Barman WAL archiving is manual.
- URLs: https://github.com/fly-apps/postgres-flex · https://community.fly.io/t/point-in-time-recovery-for-postgres-flex-using-barman/13185 · https://community.fly.io/t/fly-clone-machine-fails-after-barman-postgres-recovery/19208 · https://fly.io/docs/postgres/getting-started/what-you-should-know/