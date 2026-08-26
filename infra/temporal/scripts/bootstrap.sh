#!/usr/bin/env bash
# Idempotent bootstrap: Temporal's own schema, then the namespace.
#
# Run it as many times as you like. That is not a convenience — an upgrade runs the same
# commands against a cluster that already has data, so if this were not idempotent the
# upgrade rehearsal would be a different code path from the one it rehearses.
#
# The schema belongs to `temporal-sql-tool` at the server's EXACT version. It is never a
# Drizzle migration: product migrations are append-only and hash-locked, Temporal's are
# versioned by the server release, and one tool eventually migrating the other's tables is
# the failure this separation prevents.
set -euo pipefail
cd "$(dirname "$0")/.." || exit 1

COMPOSE="docker compose -f compose.yaml"
NAMESPACE="${TEMPORAL_NAMESPACE:-heliogrid}"
RETENTION="${TEMPORAL_RETENTION:-30d}"

# The schema ships INSIDE the admin image, so it is always the set that matches the server
# version pinned in compose.yaml. `update-schema -d` wants the `versioned/` directory, not its
# parent: pointed at the parent it logs "invalid directory name: versioned", finds zero
# updates and exits 0 — a silent no-op that leaves the server unable to start.
SCHEMA_ROOT=/etc/temporal/schema/postgresql/v12

# Run one temporal-sql-tool command against a database.
sql () { # sql <database> <args...>
  local db="$1"; shift
  $COMPOSE exec -T admin temporal-sql-tool \
    --plugin postgres12 --ep postgres -p 5432 -u temporal --pw temporal --db "$db" "$@"
}

say () { printf '\n── %s ──\n' "$1"; }

for pair in "temporal:temporal" "temporal_visibility:visibility"; do
  db="${pair%%:*}"; dir="${pair##*:}"
  say "schema: $db"
  sql "$db" create-database >/dev/null 2>&1 || true   # already exists on a re-run
  sql "$db" setup-schema -v 0.0 >/dev/null 2>&1 || true
  sql "$db" update-schema -d "$SCHEMA_ROOT/$dir/versioned" 2>&1 | grep -E "UpdateSchemaTask|updating schema|Schema updated|error" | tail -3
done

say "starting the server (schema first — it refuses to boot without one)"
$COMPOSE up -d temporal >/dev/null 2>&1
for _ in $(seq 1 40); do
  docker logs heliogrid-temporal 2>&1 | grep -q "Temporal server started" && break
  sleep 2
done

say "namespace: $NAMESPACE (retention $RETENTION)"
# The operator identity is the only one that may do this — probe-authorization.sh shows the
# api identity being refused the same call.
#
# The token goes in `--grpc-meta authorization=…`. TEMPORAL_AUTH_TOKEN is NOT read by CLI
# 1.6.1: with it set and nothing else, every call fails "Request unauthorized." and looks
# exactly like a permissions problem rather than a token that was never sent (2026-08-25).
TOKEN="$(node scripts/mint-token.mjs operator)"
AUTH=(--grpc-meta "authorization=$TOKEN")

if $COMPOSE exec -T admin temporal operator namespace describe \
     --namespace "$NAMESPACE" "${AUTH[@]}" >/dev/null 2>&1; then
  echo "namespace already exists — nothing to do"
else
  $COMPOSE exec -T admin temporal operator namespace create \
    --namespace "$NAMESPACE" --retention "$RETENTION" "${AUTH[@]}"
fi

say "cluster"
$COMPOSE exec -T admin temporal operator cluster health "${AUTH[@]}"
$COMPOSE exec -T admin temporal operator namespace describe --namespace "$NAMESPACE" "${AUTH[@]}"
