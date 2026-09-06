#!/usr/bin/env bash
# Track 7 rehearsals against the REAL built worker and the REAL API gateway.
#
# Requires: the local stack up, and env files for the api and worker identities. The report
# records the exact invocation.
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 1

SPIKE=infra/temporal/spike
WORKER_ENV="${WORKER_ENV:?set WORKER_ENV to the worker identity's env file}"
API_ENV="${API_ENV:?set API_ENV to the api identity's env file}"
LOG="${WORKER_LOG:-/tmp/heliogrid-real-worker.log}"
fails=0
check () { if [ "$2" = 0 ]; then printf 'PASS  %-52s %s\n' "$1" "$3"
           else printf 'FAIL  %-52s %s\n' "$1" "$3"; fails=$((fails+1)); fi }
# Every call is BOUNDED. `wf finish` awaits a workflow result, so if a worker failed to come
# back the unbounded form hangs forever and the rehearsal reports nothing at all rather than a
# failure — a 10-minute hang where a one-line FAIL belongs.
wf () {
  local out
  out=$(node --env-file="$API_ENV" "$SPIKE/cutover-wf.mjs" "$@" 2>/dev/null & pid=$!
        ( sleep 60; kill -9 $pid 2>/dev/null ) & watchdog=$!
        wait $pid; kill -9 $watchdog 2>/dev/null)
  printf '%s' "$out"
}

start_worker () {
  (cd apps/worker && node --env-file="$WORKER_ENV" dist/main.js > "$LOG" 2>&1 &)
  for _ in $(seq 1 30); do grep -q "worker up" "$LOG" && return 0; sleep 1; done; return 1
}
stop_worker () { pkill -f "apps/worker/dist/main.js" 2>/dev/null; sleep 2; }

echo "════ 1. restart recovery, with a workflow in flight ════"
ID="restart-$$"
wf start "$ID" >/dev/null
sleep 3
[ "$(wf status "$ID")" = "RUNNING" ]; check "workflow is running before the restart" $? ""
stop_worker
[ "$(wf status "$ID")" = "RUNNING" ]; check "it survives the worker being killed" $? "durable, not in-process"
: > "$LOG"; start_worker; check "the built worker came back" $? ""
out="$(wf finish "$ID")"
[ "$out" = "$ID#1 $ID#2" ]; check "it completes after the restart, effects once" $? "$out"

echo
echo "════ 2. cancellation ════"
ID="cancel-$$"
wf start "$ID" >/dev/null
sleep 3
wf cancel "$ID" >/dev/null
sleep 4
status="$(wf status "$ID")"
[ "$status" = "CANCELLED" ] || [ "$status" = "CANCELED" ]
check "a cancelled workflow reaches a terminal state" $? "$status"

echo
echo "════ 3. the worker holds NO BullMQ connection ════"
grep -qi "bullmq\|ioredis\|redis" "$LOG"; [ $? -ne 0 ]
check "no Redis/BullMQ in the worker's startup log" $? ""
# An IMPORT, not the word: the module's comment explains what BullMQ was replaced with, and
# tsc keeps comments in the output. Matching the word makes this FAIL on prose.
grep -qE 'require\("(bullmq|@nestjs/bullmq)"\)|from ?"(bullmq|@nestjs/bullmq)"' \
  apps/worker/dist/worker.module.js 2>/dev/null; [ $? -ne 0 ]
check "no BullMQ import in the built worker module" $? ""
# Repo-relative, like every other path here — this script already cd'd to the repo root. A
# hardcoded checkout path made this probe fail for everyone but its author; the spike modules
# carry the same warning. `?.` so a package with no `dependencies` is a PASS, not a throw, and
# stderr stays visible so a broken path reads as a broken path rather than a mystery FAIL.
node -e "process.exit(require('./apps/worker/package.json').dependencies?.bullmq ? 1 : 0)"
check "bullmq is not a worker dependency at all" $? ""

echo
[ "$fails" = 0 ] && echo "all cutover rehearsals passed" || echo "$fails rehearsal(s) FAILED"
exit "$fails"
