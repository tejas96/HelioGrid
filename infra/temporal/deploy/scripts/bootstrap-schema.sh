#!/usr/bin/env sh
# Creates or UPGRADES the `temporal` and `temporal_visibility` schemas. Idempotent.
#
# Idempotence is not a convenience: an upgrade runs these same commands against a cluster that
# already holds data, so a bootstrap that only works on an empty database is a bootstrap whose
# upgrade path was never rehearsed.
#
# These schemas are owned by `temporal-sql-tool` at the SERVER's exact version and are NEVER
# product Drizzle migrations. Product migrations are append-only and hash-locked; Temporal's
# are versioned by the server release. In one database, one tool eventually migrates the
# other's tables.
#
#   PG_HOST=… PG_USER=… PG_PASSWORD_FILE=… sh bootstrap-schema.sh
set -eu

SCHEMA_ROOT=/etc/temporal/schema/postgresql/v12
PG_PASSWORD="$(cat "${PG_PASSWORD_FILE:-/secrets/pg-password}")"
PORT="${PG_PORT:-5432}"

# `--tls` is a BOOLEAN flag and there is no `--tls-enable-host-verification` — host
# verification is ON by default and only `--tls-disable-host-verification` turns it off. The
# invented flag made the tool print its help and exit 0, so the schema step silently did
# nothing (2026-08-26). Checked against `temporal-sql-tool --help` in the pinned image.
#
# TLS follows the SAME decision the server config renders (PG_TLS), so the schema tool and the
# server cannot disagree about whether the database connection is encrypted.
PG_TLS="${PG_TLS:-true}"
[ "$PG_TLS" = true ] && TLS_FLAG=--tls || TLS_FLAG=

sql () { # sql <database> <args...>
  db="$1"; shift
  # shellcheck disable=SC2086  # TLS_FLAG is intentionally unquoted: empty means "omit".
  temporal-sql-tool --plugin postgres12 $TLS_FLAG \
    --ep "$PG_HOST" -p "$PORT" -u "$PG_USER" --pw "$PG_PASSWORD" --db "$db" "$@"
}

for pair in "temporal:temporal" "temporal_visibility:visibility"; do
  db="${pair%%:*}"; dir="${pair##*:}"
  echo "── $db ──"
  sql "$db" create-database  >/dev/null 2>&1 || true   # already exists on a re-run
  sql "$db" setup-schema -v 0.0 >/dev/null 2>&1 || true
  # `versioned/`, NOT its parent. Pointed at the parent, update-schema logs "invalid directory
  # name: versioned", finds zero updates and EXITS 0 — a silent no-op that leaves the server
  # unable to boot. Measured 2026-08-25.
  sql "$db" update-schema -d "$SCHEMA_ROOT/$dir/versioned"
done

echo "schema bootstrap complete"
