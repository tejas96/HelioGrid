#!/usr/bin/env bash
# The one-minor upgrade rehearsal: 1.30.6 → 1.31.2, schema first, with a workflow in flight.
#
# Temporal supports upgrading ONE MINOR AT A TIME. Skipping a minor is not slow, it is
# unsupported — and the failure surfaces after the old binary is gone. The order is not
# negotiable either: the schema is updated with the NEW version's temporal-sql-tool while the
# OLD server is still running (schemas are backward compatible), and only then does the binary
# move. Doing it the other way round starts a new server against a schema it does not know.
#
# This rehearses the whole thing against a live workflow, then rolls back to the pinned
# version so the stack is left as it was found.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

FROM_SERVER='temporalio/server:1.30.6@sha256:c8ade0075f9d9da43c206de2b255c80be49db384045bd1ff76bd58d0f408a314'
TO_SERVER='temporalio/server:1.31.2@sha256:b5ecdb8282bededae2a10c36e8d862e27d0bc2d247fc73c5416025997ab4a1da'
TO_ADMIN='temporalio/admin-tools:1.31.2@sha256:dbc5fcd6ee8f0f4d808bf765af9a87dea9d8a283abfdcfbd2fc148496ba66107'
SCHEMA_ROOT=/etc/temporal/schema/postgresql/v12
COMPOSE="docker compose -f ../compose.yaml"
fails=0
wf () { (cd spike && node wf.mjs "$@" 2>/dev/null); }
check () { if [ "$2" = 0 ]; then printf 'PASS  %-52s %s\n' "$1" "$3"
           else printf 'FAIL  %-52s %s\n' "$1" "$3"; fails=$((fails + 1)); fi }

auth () { echo "authorization=$(node scripts/mint-token.mjs operator)"; }
health () {
  for _ in $(seq 1 60); do
    $COMPOSE exec -T admin temporal operator cluster health --address temporal:7233 --tls \
      --tls-ca-path /etc/temporal/pki/ca-bundle.pem \
      --tls-cert-path /etc/temporal/pki/client-operator/tls.pem \
      --tls-key-path /etc/temporal/pki/client-operator/tls.key --tls-server-name temporal \
      --grpc-meta "$(auth)" 2>/dev/null | grep -q SERVING && return 0
    sleep 2
  done; return 1
}

ID="upgrade-$$"
wf start "$ID" >/dev/null
[ "$(wf status "$ID")" = "RUNNING" ]; check "a workflow is in flight before the upgrade" $? "$ID"

echo
echo "════ step 1 · schema, with the NEW tool, OLD server still running ════"
for pair in "temporal:temporal" "temporal_visibility:visibility"; do
  db="${pair%%:*}"; dir="${pair##*:}"
  docker run --rm --network heliogrid_default "$TO_ADMIN" \
    temporal-sql-tool --plugin postgres12 --ep postgres -p 5432 -u temporal --pw temporal \
    --db "$db" update-schema -d "$SCHEMA_ROOT/$dir/versioned" >/dev/null 2>&1
  check "schema updated: $db" $? ""
done
health; check "the OLD server still serves the updated schema" $? "backward compatible"

echo
echo "════ step 2 · move the binary ════"
TEMPORAL_SERVER_IMAGE="$TO_SERVER" $COMPOSE up -d temporal >/dev/null 2>&1
health; check "1.31.2 is SERVING" $? ""
# `temporal-server --version` prints "temporal version 1.31.2", not a bare number.
ver=$($COMPOSE exec -T temporal temporal-server --version 2>/dev/null | tr -d '\r' | awk '{print $NF}')
[ "$ver" = "1.31.2" ]; check "the running binary is the new minor" $? "$ver"
sleep 8
[ "$(wf status "$ID")" = "RUNNING" ]; check "the in-flight workflow survived the upgrade" $? "still RUNNING"
out="$(wf finish "$ID")"
[ "$out" = "$ID#1 $ID#2" ]; check "it completes on the new server, effects once" $? "$out"

echo
echo "════ step 3 · roll back to the pinned version ════"
TEMPORAL_SERVER_IMAGE="$FROM_SERVER" $COMPOSE up -d temporal >/dev/null 2>&1
health; check "rolled back to 1.30.6 and SERVING" $? ""
ver=$($COMPOSE exec -T temporal temporal-server --version 2>/dev/null | tr -d '\r' | awk '{print $NF}')
[ "$ver" = "1.30.6" ]; check "the pinned binary is back" $? "$ver"

echo
[ "$fails" = 0 ] && echo "upgrade rehearsal passed" || echo "$fails upgrade check(s) FAILED"
exit "$fails"
