#!/usr/bin/env sh
# Renders the server config at CONTAINER START, then execs the server.
#
# Two reasons this is not a build step:
#  - Temporal does NOT expand `${VAR}` in a config file. The placeholder reaches the connection
#    string verbatim and Postgres rejects `invalid port ":${TEMPORAL_POSTGRES_PORT}"`
#    (measured 2026-08-25, infra/temporal/README.md §8). Substitution has to happen before the
#    server reads the file.
#  - `broadcastAddress` must be this machine's own 6PN address, and a machine has no address
#    until it boots.
#
# Secrets arrive as FILES, never as values in the environment: a private key in an env var is
# readable by every child process and lands in `fly ssh console` output and crash dumps.
set -eu

TEMPLATE=/etc/temporal/config/server.template.yaml
RENDERED=/etc/temporal/config/server.yaml

need () { # need <name> <value>
  [ -n "$2" ] || { echo "render-config: $1 is empty — refusing to start" >&2; exit 1; }
}

# FLY_PRIVATE_IP is set by the platform. Locally, pass BROADCAST_IP to validate the template.
BROADCAST_IP="${BROADCAST_IP:-${FLY_PRIVATE_IP:-}}"
PG_PASSWORD="$(cat "${PG_PASSWORD_FILE:-/secrets/pg-password}" 2>/dev/null || echo '')"

need FLY_PRIVATE_IP/BROADCAST_IP "$BROADCAST_IP"
need PG_HOST "${PG_HOST:-}"
need PG_USER "${PG_USER:-}"
need PG_PASSWORD "$PG_PASSWORD"
need JWKS_URI "${JWKS_URI:-}"
# Defaults to TRUE. An unset flag must give the SAFE value: a typo that silently disabled
# transport encryption to the database would never announce itself.
PG_TLS="${PG_TLS:-true}"
case "$PG_TLS" in true|false) ;; *) echo "render-config: PG_TLS must be true or false" >&2; exit 1;; esac

# `|` as the sed delimiter: a password or URI containing `/` would otherwise end the expression
# and produce a config that is silently wrong rather than a failure.
sed \
  -e "s|__PG_HOST__|${PG_HOST}|g" \
  -e "s|__PG_PORT__|${PG_PORT:-5432}|g" \
  -e "s|__PG_USER__|${PG_USER}|g" \
  -e "s|__PG_PASSWORD__|${PG_PASSWORD}|g" \
  -e "s|__BROADCAST_IP__|${BROADCAST_IP}|g" \
  -e "s|__JWKS_URI__|${JWKS_URI}|g" \
  -e "s|__PG_TLS__|${PG_TLS}|g" \
  "$TEMPLATE" > "$RENDERED"

# A placeholder that survived means a variable was missing from the list above — the server
# would start and fail on its first query with a message about SQL, not about configuration.
if grep -q '__[A-Z_]*__' "$RENDERED"; then
  echo "render-config: unsubstituted placeholders remain:" >&2
  grep -o '__[A-Z_]*__' "$RENDERED" | sort -u >&2
  exit 1
fi
chmod 600 "$RENDERED"

echo "render-config: wrote $RENDERED (broadcast=$BROADCAST_IP pg=$PG_HOST tls=$PG_TLS)"
exec "$@"
