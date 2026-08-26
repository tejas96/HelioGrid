#!/usr/bin/env sh
# Backup of BOTH Temporal stores. Restore is rehearsed in
# infra/temporal/scripts/probe-durability.sh §3, with a live workflow.
#
# BOTH, always. Restoring history without visibility leaves workflows that run but cannot be
# listed; restoring visibility without history leaves listed workflows that do not exist.
set -eu

OUT="${1:?usage: backup.sh <output-directory>}"
PG_PASSWORD="$(cat "${PG_PASSWORD_FILE:-/secrets/pg-password}")"
mkdir -p "$OUT"

for db in temporal temporal_visibility; do
  PGPASSWORD="$PG_PASSWORD" pg_dump -h "$PG_HOST" -p "${PG_PORT:-5432}" -U "$PG_USER" \
    -d "$db" -Fc > "$OUT/$db.dump"
  # An exit code proves nothing: pg_dump writes a valid EMPTY archive for a database it cannot
  # read the contents of. Check the file has size, and on restore count the tables.
  [ -s "$OUT/$db.dump" ] || { echo "backup: $db.dump is empty — refusing to report success" >&2; exit 1; }
  echo "$db → $OUT/$db.dump ($(wc -c < "$OUT/$db.dump") bytes)"
done
