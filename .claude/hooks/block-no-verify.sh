#!/usr/bin/env bash
# PreToolUse(Bash): the --no-verify flag skips the pre-commit gate (biome --error-on-warnings
# + typecheck). Fix the diagnostic instead (CLAUDE.md §4).
#
# Matches the ACTION, not a mention: quoted segments are stripped first, so a commit message
# that discusses the flag still lands, while the flag as an argument is caught wherever it
# sits in the command. Truncating at the first `-m` instead misses
# `git commit -m x --no-verify` entirely. `-n` is the same flag on `git commit`; a hooks path
# pointed elsewhere or the hook runner's own skip variable skip the gate just as surely.
set -euo pipefail

# A guard that cannot run fails closed: only exit 2 blocks, so a missing tool must not exit 127.
command -v python3 >/dev/null || { echo "Blocked: this guard needs python3 on PATH and cannot run without it (M64)." >&2; exit 2; }

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

if printf '%s' "$args" | grep -qE '(^|[[:space:]])--no-verify([[:space:]]|=|$)|core\.hooksPath|SKIP_SIMPLE_GIT_HOOKS'; then
  echo "Blocked: --no-verify (or a redirected hooks path, or SKIP_SIMPLE_GIT_HOOKS) skips the pre-commit gate. Fix the lint or typecheck diagnostic instead (CLAUDE.md §4)." >&2
  exit 2
fi

# `-n` is --no-verify's short form on `git commit` only (on `git push` it is a dry run), so it is
# read inside the commit segment alone, bundled short flags included (`-nm`).
commit_segment="$(printf '%s' "$args" | tr ';|&\n' '\n\n\n\n' | grep -E 'git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?commit([[:space:]]|$)' || true)"
if printf '%s' "$commit_segment" | grep -qE '[[:space:]]-[A-Za-z]*n[A-Za-z]*([[:space:]]|$)'; then
  echo "Blocked: -n is --no-verify; it skips the pre-commit gate. Fix the lint or typecheck diagnostic instead (CLAUDE.md §4)." >&2
  exit 2
fi
exit 0
