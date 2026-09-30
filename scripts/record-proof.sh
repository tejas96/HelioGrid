#!/usr/bin/env bash
# The recorder for a proof the author drives (M137): it runs ONE command and writes ONE verdict line
# from that command's own output, so a line is never typed and never written after the fact.
#
#   scripts/record-proof.sh <verdicts-file> <id> <expect-exit: 0|nonzero|any> <expect-ere> \
#     [--reject <ere>] [--step Q<n> --surface <surface> --claims <C1,landing> --round <n> [--stage ship]] \
#     [--max-seconds <n>] -- "<command>"
#
# pass needs all four: the exit matches, the expected pattern is in the output, the reject pattern
# is not, and the working tree reads the same before and after (the break is set up outside the
# recorded command, and nothing inside it may move the tree). A run past --max-seconds is stopped and
# reads inconclusive. The full output is kept beside the verdicts file under logs/<id>.log, and the
# line carries its hash. The line has the one shape every verdict line has (verify skill's
# test-matrix §"Recording a run"): --step files it under a step of the ticket's QA plan, else it is a
# `recorded` proof.
set -u
out="$1"; id="$2"; want_exit="$3"; expect="$4"; shift 4
reject=""; step=""; surface="recorded"; claims=""; round=""; stage="verify"; max=""
while [ $# -gt 0 ] && [ "$1" != "--" ]; do
  [ $# -ge 2 ] || { echo "record-proof: $1 needs a value" >&2; exit 2; }
  case "$1" in
    --reject) reject="$2" ;; --step) step="$2" ;; --surface) surface="$2" ;; --claims) claims="$2" ;;
    --round) round="$2" ;; --stage) stage="$2" ;; --max-seconds) max="$2" ;;
    *) echo "record-proof: unknown argument '$1' (the header of this file lists the arguments)" >&2; exit 2 ;;
  esac
  shift 2
done
[ "${1:-}" = "--" ] || { echo "record-proof: '--' missing before the command" >&2; exit 2; }
cmd="${2:?record-proof: command missing}"
[ -n "$expect" ] || { echo "record-proof: an empty expected pattern matches anything — refused" >&2; exit 2; }
if [ -n "$step" ]; then
  [[ "$step" =~ ^Q[0-9]+$ ]] && [ -n "$claims" ] && [ "$surface" != recorded ] \
    || { echo "record-proof: --step Q<n> comes with --surface and --claims" >&2; exit 2; }
else
  [ "$surface" = recorded ] && [ -z "$claims" ] \
    || { echo "record-proof: --surface and --claims file a line under a step, so they need --step" >&2; exit 2; }
fi
[[ "${round:-1}" =~ ^[0-9]+$ ]] && [[ "${max:-1}" =~ ^[0-9]+$ ]] || { echo "record-proof: --round and --max-seconds are whole numbers" >&2; exit 2; }
root="$(git rev-parse --show-toplevel)"
# The whole working tree — file status, the content of every change, staged or not, and of every
# untracked file — so an edit to a file the branch already changed still moves the hash.
tree_state() {
  { git -C "$root" status --porcelain; git -C "$root" diff; git -C "$root" diff --cached
    git -C "$root" ls-files -o --exclude-standard -z | (cd "$root" && xargs -0 shasum 2>/dev/null); } \
    | shasum | cut -c1-12
}
dir="$(cd "$(dirname "$out")" && pwd)/logs"; mkdir -p "$dir"; log="$dir/$id.log"
# A log is the evidence its line hashes: writing over one leaves the older line pointing at bytes
# that are gone, so an id is recorded once per folder.
[ ! -e "$log" ] || { echo "record-proof: $log exists — give this proof a new id, or record into a fresh folder" >&2; exit 2; }
tree_before="$(tree_state)"
runtime_tree="$(bash "$root/scripts/verify-digest.sh" --tree)"
start="$(date -u +%FT%TZ)"
# macOS ships no `timeout`: perl runs the command in its own process group and stops the whole group
# once the time is up, exiting 124 with a line the checker reads.
if [ -n "$max" ]; then
  perl -e 'my $t = shift; my $pid = fork; if (!$pid) { setpgrp(0, 0); exec @ARGV or exit 127 }
    $SIG{ALRM} = sub { kill "TERM", -$pid; sleep 2; kill "KILL", -$pid; print "record-proof: timed out after $t s\n"; exit 124 };
    alarm $t; waitpid($pid, 0); exit($? & 127 ? 128 + ($? & 127) : $? >> 8)' \
    "$max" bash -o pipefail -c "cd '$root' && $cmd" >"$log" 2>&1; code=$?
else
  bash -o pipefail -c "cd '$root' && $cmd" >"$log" 2>&1; code=$?
fi
tree_after="$(tree_state)"
ok=1
case "$want_exit" in
  0) [ "$code" -eq 0 ] || ok=0 ;;
  nonzero) [ "$code" -ne 0 ] || ok=0 ;;
  any) ;;
  *) echo "record-proof: expect-exit is 0, nonzero or any" >&2; exit 2 ;;
esac
grep -qE -- "$expect" "$log" || ok=0
if [ -n "$reject" ] && grep -qE -- "$reject" "$log"; then ok=0; fi
[ "$tree_before" = "$tree_after" ] || ok=0
verdict=fail; [ "$ok" -eq 1 ] && verdict=pass
[ "$code" -eq 124 ] && grep -q '^record-proof: timed out after' "$log" && verdict=inconclusive
observed="$(grep -E -m4 -- "$expect" "$log" || true)"
rejected=""; [ -n "$reject" ] && rejected="$(grep -E -m2 -- "$reject" "$log" || true)"
python3 - "$out" "$id" "$verdict" "$code" "$want_exit" "$start" "$expect" "$reject" "$cmd" "$log" \
  "$(shasum "$log" | cut -c1-12)" "$tree_before" "$tree_after" "$observed" "$rejected" \
  "$step" "$surface" "$claims" "${round:-1}" "$stage" "$runtime_tree" <<'PY'
import json, sys
(out, i, v, c, we, t, e, r, cmd, log, lh, tb, ta, obs, rej, step, surface, claims, rnd, stage,
 tree) = sys.argv[1:]
line = {"step_id": step or None, "surface": surface, "claims": claims.split(",") if claims else [],
        "round": int(rnd), "stage": stage, "tree": tree, "at": t, "verdict": v, "expected": e,
        "observed": obs.splitlines(), "evidence": [log], "driver": "author",
        "id": i, "recorder": "record-proof.sh", "exit": int(c), "expect_exit": we, "command": cmd,
        "reject": r, "rejected_lines": rej.splitlines(), "log": log, "log_sha": lh,
        "tree_before": tb, "tree_after": ta}
open(out, "a").write(json.dumps(line, ensure_ascii=False) + "\n")
PY
echo "$id: $verdict (exit $code)"
