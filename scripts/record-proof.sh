#!/usr/bin/env bash
# The recorder for a proof the author drives (M137): it runs ONE command and writes ONE verdict line
# from that command's own output, so a line is never typed and never written after the fact.
#
#   scripts/record-proof.sh <verdicts-file> <id> <expect-exit: 0|nonzero|any> <expect-ere> \
#     [--reject <ere>] -- "<command>"
#
# pass needs all four: the exit matches, the expected pattern is in the output, the reject pattern
# is not, and the working tree reads the same before and after (the break is set up outside the
# recorded command, and nothing inside it may move the tree). The full output is kept beside the
# verdicts file under logs/<id>.log, and the line carries its hash.
set -u
out="$1"; id="$2"; want_exit="$3"; expect="$4"; shift 4
reject=""
if [ "${1:-}" = "--reject" ]; then reject="$2"; shift 2; fi
[ "${1:-}" = "--" ] || { echo "record-proof: '--' missing before the command" >&2; exit 2; }
cmd="${2:?record-proof: command missing}"
[ -n "$expect" ] || { echo "record-proof: an empty expected pattern matches anything — refused" >&2; exit 2; }
root="$(git rev-parse --show-toplevel)"
# The whole working tree — file status, the content of every change, staged or not, and of every
# untracked file — so an edit to a file the branch already changed still moves the hash.
tree_state() {
  { git -C "$root" status --porcelain; git -C "$root" diff; git -C "$root" diff --cached
    git -C "$root" ls-files -o --exclude-standard -z | (cd "$root" && xargs -0 shasum 2>/dev/null); } \
    | shasum | cut -c1-12
}
dir="$(cd "$(dirname "$out")" && pwd)/logs"; mkdir -p "$dir"; log="$dir/$id.log"
tree_before="$(tree_state)"
start="$(date -u +%FT%TZ)"
bash -o pipefail -c "cd '$root' && $cmd" >"$log" 2>&1; code=$?
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
observed="$(grep -E -m4 -- "$expect" "$log" || true)"
rejected=""; [ -n "$reject" ] && rejected="$(grep -E -m2 -- "$reject" "$log" || true)"
python3 - "$out" "$id" "$verdict" "$code" "$want_exit" "$start" "$expect" "$reject" "$cmd" "$log" \
  "$(shasum "$log" | cut -c1-12)" "$tree_before" "$tree_after" "$observed" "$rejected" <<'PY'
import json, sys
(out, i, v, c, we, t, e, r, cmd, log, lh, tb, ta, obs, rej) = sys.argv[1:]
line = {"id": i, "driver": "author", "recorder": "record-proof.sh", "verdict": v, "exit": int(c),
        "expect_exit": we, "started": t, "command": cmd, "expected": e, "reject": r,
        "observed": obs.splitlines(), "rejected_lines": rej.splitlines(), "log": log,
        "log_sha": lh, "tree_before": tb, "tree_after": ta}
open(out, "a").write(json.dumps(line, ensure_ascii=False) + "\n")
PY
echo "$id: $verdict (exit $code)"
