# ADR-0006: Database — Fly postgres-flex (unmanaged) in `bom`, deprecation risk accepted with mandatory mitigations

Date: 2026-07-24

## Context

Compute runs on Fly Machines in `bom` (Mumbai). Fly Managed Postgres (MPG) has **no Mumbai region** (nearest is `sin`, ~60ms RTT and data leaves India). Fly has **deprecated unmanaged Postgres** (postgres-flex): self-support only, wal-g not bundled, Fly steers to MPG. The research rated self-run flex "too operationally fragile" and preferred external managed Mumbai Postgres; the product owner chose Fly-native anyway, with the deprecation risk explicitly flagged and accepted.

## Decision

**Fly postgres-flex (unmanaged) in `bom`** — user choice, recorded with its risk. The following mitigations are **mandatory and in Launch-1 scope**, not optional hardening:

1. **3-node repmgr HA** (postgres-flex image, automatic failover).
2. **Two independent backup layers to Tigris**: pgBackRest/Barman WAL archiving for PITR, plus nightly `pg_dump` logical dumps (survives anything that corrupts the physical chain).
3. **Restore drill before launch, then monthly** — an untested backup is not a backup; the drill is a runbook item in `09-observability-and-ops.md`.
4. **Alerts** on disk, replication lag and OOM (we own all three; Fly will not page us).
5. **Documented escape hatches**: Fly MPG in `sin` or an external managed Mumbai Postgres, reachable via logical replication — everything is plain Postgres, nothing locks in. Revisit this ADR at scale.

## Consequences

- Lowest latency (`.internal` 6PN, same region as api/worker/powersync) and lowest cost; DB stays physically in India, which keeps phone-PII residency clean (ADR-0010).
- We own HA, failover, PITR, disaster recovery and capacity — with **no vendor support** behind us. This is the single largest operational liability in the stack; the runbook and drills are the price of the directive.
- Barman WAL archiving needs manual `barman -q cron`; `fly clone` is reported to fail after Barman recovery — recovery procedure must be documented and rehearsed, not improvised.
- pgBackRest/wal-g against Tigris is "S3-compatible, expected to work" — the pre-launch archive+restore drill against Tigris is a listed week-1 spike precisely because no doc certifies it.

## Alternatives rejected

- **Fly MPG in `sin`** — managed, but data leaves India and every ORM round-trip pays ~60ms; only acceptable as an escape hatch.
- **External managed Mumbai Postgres (Supabase/Crunchy Bridge/RDS `ap-south-1`)** — the research's pick; rejected by the Fly-native directive (no AWS), and it reintroduces cross-provider networking/egress. Remains escape hatch #2.
- **Neon** — no Mumbai region, serverless cold starts.

## Sources

- `../research/fly.md` · `../research/verify-flyNative.md`
- https://github.com/fly-apps/postgres-flex · https://fly.io/docs/postgres/getting-started/what-you-should-know/
- https://community.fly.io/t/point-in-time-recovery-for-postgres-flex-using-barman/13185 · https://community.fly.io/t/fly-clone-machine-fails-after-barman-postgres-recovery/19208
- https://fly.io/docs/mpg/
- BLUEPRINT.md — user decisions log (DB choice + flagged risk)
