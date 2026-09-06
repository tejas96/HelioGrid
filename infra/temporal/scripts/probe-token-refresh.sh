#!/usr/bin/env bash
# Proves a rotated identity token is picked up WITHOUT restarting anything.
#
# The failure this guards: a token read once at boot expires, and every call then fails with
# "Request unauthorized." — which reads as a permissions problem rather than a stale
# credential, so the first instinct is to widen permissions.
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 1

API_ENV="${API_ENV:?}"; WORKER_ENV="${WORKER_ENV:?}"
SPIKE=infra/temporal/spike
fails=0
check () { if [ "$2" = 0 ]; then printf 'PASS  %-52s %s\n' "$1" "$3"
           else printf 'FAIL  %-52s %s\n' "$1" "$3"; fails=$((fails+1)); fi }

api_token_file="$(grep -m1 '^TEMPORAL_AUTH_TOKEN_FILE=' "$API_ENV" | cut -d= -f2-)"
worker_token_file="$(grep -m1 '^TEMPORAL_AUTH_TOKEN_FILE=' "$WORKER_ENV" | cut -d= -f2-)"

ID="tokenrot-$$"
node --env-file="$API_ENV" "$SPIKE/cutover-wf.mjs" start "$ID" >/dev/null 2>&1
check "a workflow started on the current tokens" $? ""

# Rotate BOTH credentials on disk, in place, while everything keeps running.
node infra/temporal/scripts/mint-token.mjs api    > "$api_token_file"
node infra/temporal/scripts/mint-token.mjs worker > "$worker_token_file"
check "both token files were rewritten" $? "$(basename "$api_token_file"), $(basename "$worker_token_file")"

# The worker re-reads on a 60s interval; the API's reader is per-request.
sleep 70

out="$(node --env-file="$API_ENV" "$SPIKE/cutover-wf.mjs" finish "$ID" 2>/dev/null)"
[ "$out" = "$ID#1 $ID#2" ]
check "the workflow completed on the ROTATED tokens" $? "$out"

# The check above proves the WORKER's refresh — it is one long-lived process across the
# rotation. It says NOTHING about the API's: `cutover-wf.mjs` is a fresh process per call, so
# it re-reads the file whether or not the client refreshes. That gap hid an unwired API reader
# through a green run. This probe holds ONE client across the rotation.
node --env-file="$API_ENV" "$SPIKE/probe-api-token-refresh.mjs" >/dev/null 2>&1
check "the API client refreshes on a LONG-LIVED connection" $? "4 checks"

echo
[ "$fails" = 0 ] && echo "token rotation passed — no restart required" || echo "$fails FAILED"
exit "$fails"
