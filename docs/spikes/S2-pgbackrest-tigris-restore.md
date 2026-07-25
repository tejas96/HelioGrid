# Spike S2 — pgBackRest → Tigris WAL archive + RESTORE DRILL

**Date:** 2026-07-25 · **Verdict: BLOCKED-ON-OWNER — no Fly Postgres cluster or Tigris
bucket exists yet (billable provisioning declined this session; owner will provision).**

## What this spike must prove (unchanged, from docs/03 §6 + docs/09)

1. pgBackRest archives WAL from the postgres-flex cluster to a Tigris (`sin`) bucket —
   no doc certifies pgBackRest against Tigris; treat as "S3-compatible, expected to work"
   until a restore has actually succeeded from it.
2. A FULL restore drill: fresh machine → restore from Tigris → cluster serves reads and
   the seeded data round-trips. Timed, so the RTO is a measured number, not a hope.
3. The second layer independently: nightly `pg_dump` logical dumps to the same bucket +
   a successful `pg_restore`.

## Why it is blocked

- Requires the postgres-flex 3-node cluster (billable machines + volumes) and a Tigris
  bucket (billable) — both deferred to the owner this session.
- Nothing else gates it: the migration runner, schema and invariant tests are ready and
  proven against local Postgres 16 (migration 0001 applied; tenancy invariants green).

## Ready-to-run once infra exists

- Cluster: `flyctl postgres create --name heliogrid-db --region bom --initial-cluster-size 3`
  (command was prepared this session; declined pending owner billing decision).
- Then: install/configure pgBackRest on the cluster image (postgres-flex does NOT bundle
  wal-g/pgBackRest — docs/03 §6), repo type s3 → Tigris endpoint, `archive_command` on,
  take a full backup, run the drill, log it in `ops_drills`.

## Risk note (unchanged severity)

The restore drill is a LAUNCH BLOCKER (docs/14 launch gate #5; drill #1 was scheduled for
Day 2). Every day it slips compresses the Day-19 drill margin. Recommend provisioning the
cluster as the first action of Track A so the drill lands within Day 3–4.
