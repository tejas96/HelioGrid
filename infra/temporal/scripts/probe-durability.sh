#!/usr/bin/env bash
# The rehearsals that decide whether this is a durable system or a hopeful one.
#
# Each one starts a workflow, leaves it RUNNING, breaks something, and then asks the workflow
# to finish. A workflow that was never mid-flight proves nothing about recovery.
#
# Requires the spike worker: (cd infra/temporal/spike && node worker.mjs &)
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

COMPOSE="docker compose -f ../compose.yaml"
PG="docker exec heliogrid-pg-local"
# `-i` is NOT optional for the restore: without it `docker exec` attaches no stdin, pg_restore
# reads an empty archive, exits 0, and you get an empty database that looks restored. The
# server then starts, finds no tables and dies — which reads as a Temporal problem rather than
# a shell one. Check `\dt`, not the exit code.
PGI="docker exec -i heliogrid-pg-local"
fails=0
wf () { (cd spike && node wf.mjs "$@" 2>/dev/null); }

check () { # check <name> <ok:0|1> <detail>
  if [ "$2" = 0 ]; then printf 'PASS  %-52s %s\n' "$1" "$3"
  else printf 'FAIL  %-52s %s\n' "$1" "$3"; fails=$((fails + 1)); fi
}

wait_serving () {
  for _ in $(seq 1 60); do
    $COMPOSE exec -T admin temporal operator cluster health \
      --address temporal:7233 --tls \
      --tls-ca-path /etc/temporal/pki/ca-bundle.pem \
      --tls-cert-path /etc/temporal/pki/client-operator/tls.pem \
      --tls-key-path /etc/temporal/pki/client-operator/tls.key \
      --tls-server-name temporal \
      --grpc-meta "authorization=$(node scripts/mint-token.mjs operator)" 2>/dev/null \
      | grep -q SERVING && return 0
    sleep 2
  done
  return 1
}

# ── 1. server restart with a workflow in flight ─────────────────────────────────────
echo "════ 1. server restart ════"
ID="restart-$$"
wf start "$ID" >/dev/null
$COMPOSE restart temporal >/dev/null 2>&1
wait_serving; check "cluster is SERVING again after a restart" $? ""
sleep 8
[ "$(wf status "$ID")" = "RUNNING" ]; check "the in-flight workflow survived the restart" $? "still RUNNING"
out="$(wf finish "$ID")"
[ "$out" = "$ID#1 $ID#2" ]; check "it completes afterwards, effects applied once" $? "$out"

# ── 2. database outage and recovery ─────────────────────────────────────────────────
echo
echo "════ 2. database outage ════"
ID="outage-$$"
wf start "$ID" >/dev/null
# Shared container: this stops heliogrid_dev too, not just Temporal's databases.
$COMPOSE stop postgres >/dev/null 2>&1
sleep 6
# The server must NOT claim health while its persistence is gone. A cluster that reports
# SERVING with no database is worse than one that reports nothing.
$COMPOSE exec -T admin temporal operator cluster health --address temporal:7233 --tls \
  --tls-ca-path /etc/temporal/pki/ca-bundle.pem \
  --tls-cert-path /etc/temporal/pki/client-operator/tls.pem \
  --tls-key-path /etc/temporal/pki/client-operator/tls.key --tls-server-name temporal \
  --grpc-meta "authorization=$(node scripts/mint-token.mjs operator)" >/dev/null 2>&1
[ $? -ne 0 ] || wf status "$ID" >/dev/null 2>&1
started_ok=$?
$COMPOSE start postgres >/dev/null 2>&1
wait_serving; check "recovers to SERVING after the database returns" $? ""
sleep 10
out="$(wf finish "$ID")"
[ "$out" = "$ID#1 $ID#2" ]; check "the workflow completes after the outage" $? "$out"

# ── 3. backup and restore of a LIVE workflow ────────────────────────────────────────
echo
echo "════ 3. backup / restore ════"
ID="restore-$$"
wf start "$ID" >/dev/null
sleep 5
mkdir -p backup
# Both stores. Restoring one without the other leaves visibility disagreeing with history —
# workflows that run but cannot be listed, or listed workflows that do not exist.
for db in temporal temporal_visibility; do
  $PG pg_dump -U temporal -d "$db" -Fc > "backup/$db.dump" 2>/dev/null
done
sizes="$(du -h backup/temporal.dump | cut -f1)/$(du -h backup/temporal_visibility.dump | cut -f1)"
[ -s backup/temporal.dump ] && [ -s backup/temporal_visibility.dump ]
check "dumped both stores while a workflow was live" $? "$sizes"

# Destroy and restore. The server is stopped first: restoring under a running server leaves
# it holding shard leases for data that no longer exists.
$COMPOSE stop temporal >/dev/null 2>&1
for db in temporal temporal_visibility; do
  # `temporal` only OWNS these databases, so it can DROP but not CREATE — cluster-level DDL
  # needs the superuser, and `OWNER temporal` restores ownership after. stderr stays unswallowed
  # on purpose: hiding it let CREATE fail with permission denied after DROP had succeeded,
  # destroying both databases with no recreate path.
  $PG psql -U heliogrid -d postgres -c "DROP DATABASE $db WITH (FORCE);"
  $PG psql -U heliogrid -d postgres -c "CREATE DATABASE $db OWNER temporal;"
  $PGI pg_restore -U temporal -d "$db" --no-owner < "backup/$db.dump" >/dev/null 2>&1
  # Count the tables, because pg_restore exits 0 on an empty archive. This is the check that
  # would have caught the missing `-i` immediately instead of three failures later.
  n=$($PG psql -U temporal -d "$db" -tAc \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null | tr -d ' ')
  [ "${n:-0}" -gt 0 ]; check "restored $db has tables" $? "${n:-0} tables"
done
$COMPOSE start temporal >/dev/null 2>&1
wait_serving; check "cluster serves again from the restored dump" $? ""
sleep 10
[ "$(wf status "$ID")" = "RUNNING" ]; check "the pre-backup workflow survived the restore" $? "still RUNNING"
out="$(wf finish "$ID")"
[ "$out" = "$ID#1 $ID#2" ]; check "it completes with NO duplicate effects" $? "$out"

echo
[ "$fails" = 0 ] && echo "all durability rehearsals passed" || echo "$fails rehearsal(s) FAILED"
exit "$fails"
