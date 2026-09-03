#!/usr/bin/env bash
# PreToolUse(Bash): the --no-verify flag skips the pre-commit gate (biome --error-on-warnings
# + typecheck). Fix the diagnostic instead (CLAUDE.md §4).
#
# Matches the ACTION, not a mention: quoted segments are stripped first, so a commit message
# that discusses the flag still lands, while the flag as an argument is caught wherever it
# sits in the command. An earlier version truncated at the first `-m` instead and missed
# `git commit -m x --no-verify` entirely (found by arch-reviewer 2026-08-03).
set -euo pipefail

cmd="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))')"

# Strip heredoc bodies, then double- and single-quoted strings. What remains is argument text.
args="$(printf '%s' "$cmd" | python3 -c '
import re, sys
s = sys.stdin.read()
s = re.sub(r"<<-?\x27?\"?(\w+)\x27?\"?.*?^\1", " ", s, flags=re.S | re.M)  # heredocs
s = re.sub(r"\"(?:[^\"\\\\]|\\\\.)*\"", " ", s)                            # "..."
s = re.sub(r"\x27[^\x27]*\x27", " ", s)                                     # '"'"'...'"'"'
print(s)
')"

if printf '%s' "$args" | grep -qE '(^|[[:space:]])--no-verify([[:space:]]|=|$)'; then
  echo "Blocked: --no-verify skips the pre-commit gate. Fix the lint or typecheck diagnostic instead (CLAUDE.md §4)." >&2
  exit 2
fi
exit 0
