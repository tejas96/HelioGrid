# Spike S6 — PowerSync self-host deploy smoke

**Date:** 2026-07-25 · **Verdict: PASS (local smoke — the exact production shape works
unmodified). Fly deploy leg pending (blocked on owner billing).**

## What was proven (hands-on, Docker)

`journeyapps/powersync-service:latest` — pin digest
`sha256:b6b22fa7d0d862f04bdff62846e656756d17bcf3dd6eca399a0633671051438b`
(boots as PowerSync Service v1.23.3, Unified Container, Open Edition):

- **Mongo-free**: Postgres bucket storage (`storage.type: postgresql`) against a separate
  database on the same instance — a `powersync` schema materialised (bucket_data,
  current_data, sync_rules, write_checkpoints, …).
- **Replication**: source PG16 with `wal_level=logical` + `create publication powersync
  for table todos` → snapshot + streaming activated, replication slot live.
- **Auth**: HS256 JWKS key in `client_auth`; tampered signature → 401. Config also
  supports `jwks_uri` — the Better Auth JWKS swap is a one-line change.
- **Sync round-trip**: `POST /sync/stream` with a signed JWT returned checkpoint + data
  ops for the caller's bucket only; a row inserted MID-STREAM arrived as the next op.
- **Isolation**: user-2's token saw only its own bucket — the tenant/assignee
  parameterised-bucket pattern (docs/06) verified in miniature.
- First boot, zero config iteration. Working config kept in the session scratchpad
  (spike-s6/config) — copy into the Track E slice.

## Gotchas recorded

- Bucket storage MUST target a different database than the replication source.
- HS256 `k` is base64url in JWKS; sign with the raw decoded secret; `kid`/`aud` must
  match exactly (mismatch → 401).

## Fly leg (pending owner infra)

shared-cpu-1x/1GB likely sufficient to start (2GB headroom later) · **auto_stop OFF** —
the service holds a replication slot; autosuspend backs up WAL · private-only over
Flycast, internal port 8089, health `/probes/liveness` · secrets: replication URI
(postgres-flex needs `wal_level=logical` verified on the bom cluster), storage URI,
JWKS against Better Auth.

## Recommendation

Green-light Track E on the planned architecture; pin the image digest above.
