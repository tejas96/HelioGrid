#!/usr/bin/env bash
# PreToolUse(Bash): the --no-verify flag skips the pre-commit gate (biome --error-on-warnings
# + typecheck). Fix the diagnostic instead (CLAUDE.md §6).
#
# Matches the ACTION, not a mention: everything from the first `-m` or heredoc onward is a
# message body, so a commit message that discusses the flag is fine — only the flag used as
# an argument is blocked.
set -euo pipefail

cmd="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))')"

args="${cmd%%-m *}"      # drop an inline message
args="${args%%<<*}"      # drop a heredoc body

if printf '%s' "$args" | grep -qE '(^|[[:space:]])--no-verify([[:space:]]|$)'; then
  echo "Blocked: --no-verify skips the pre-commit gate. Fix the lint or typecheck diagnostic instead (CLAUDE.md §6)." >&2
  exit 2
fi
exit 0
