# ADR-0018: Fly topology — one app per service

Date: 2026-07-24

## Context

Earlier drafts (docs/02 §1, docs/09 §5, BLUEPRINT infra section) described the Fly deployment as process groups inside a single `fly.toml` app. Fly process groups share one Docker image per app — but our services cannot share one image: `powersync` runs the prebuilt `journeyapps/powersync-service` image, while web, api, worker and voice each need a different build (different entrypoints; the worker image carries Chromium + Noto Sans Devanagari fonts for PDF rendering). The process-groups wording was unimplementable as written.

## Decision

**One Fly app per service**: `heliogrid-web`, `heliogrid-api`, `heliogrid-worker`, `heliogrid-voice`, `heliogrid-powersync` (prebuilt `journeyapps/powersync-service` image, digest-pinned) — plus the postgres-flex cluster app and the log-shipper. web/api/worker/voice build per-app Dockerfiles. All apps communicate over 6PN `.internal`/flycast private networking; only web and api are exposed through Fly's proxy (webhooks + mobile).

## Consequences

- 5 `fly.toml` files to maintain (+ the pg cluster app and log-shipper) instead of one.
- Per-app deploys and rollbacks — a worker deploy cannot break web; CI runs `flyctl deploy` per app.
- Per-app scaling and autostop policy: web/api `min_machines_running=1` in `bom`; worker/voice `autostop="off"`; powersync sized independently.
- Secrets are staged per app (`fly secrets set -a <app>`), which is more setup but a smaller blast radius per rotation.

## Alternatives rejected

- **Single-app process groups** — unimplementable: all process groups share one image, but powersync is a prebuilt third-party image and web/api need different builds.
- **Fewer combined apps** (e.g. web+api in one app) — couples scaling, autostop policy and deploy blast radius across services for no operational saving.

## Sources

- `../research/fly.md` (capacity posture, process-group semantics)
- https://fly.io/docs/launch/processes/ · https://fly.io/docs/launch/autostop-autostart/
- docs/02 §1 · docs/09 §5 (corrected to this topology in the same commit)
