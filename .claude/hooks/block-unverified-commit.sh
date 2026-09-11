#!/usr/bin/env bash
# PreToolUse(Bash): a commit of a RUNTIME change waits for /verify's stamp (mechanisms.md M113).
# The stamp is the ticket's `**Verified:** digest <12 hex> …` line, written by /verify from the
# runtime tree it drove (scripts/verify-digest.sh). This hook recomputes the digest of the STAGED
# tree and refuses the commit when no task file carries it. A tree whose runtime digest equals
# origin/main's — docs, ci, config — needs no stamp. The author's own driving is not a stamp.
#
# The index is the truth here, so staging and committing in ONE command is refused: stage in one
# call, commit in the next, and the hook reads what the commit will write. `-a`/`--all` stages at
# commit time and is refused for the same reason.
set -euo pipefail

# A guard that cannot run fails closed: only exit 2 blocks, so a missing tool must not exit 127.
for tool in python3 shasum; do
  command -v "$tool" >/dev/null || { echo "Blocked: this guard needs $tool on PATH and cannot run without it (M113)." >&2; exit 2; }
done

cmd="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))')"
args="$(printf '%s' "$cmd" | python3 -c '
import re, sys
s = sys.stdin.read()
s = re.sub(r"<<-?\x27?\"?(\w+)\x27?\"?.*?^\1", " ", s, flags=re.S | re.M)  # heredocs
s = re.sub(r"\"(?:[^\"\\\\]|\\\\.)*\"", " ", s)                            # "..."
s = re.sub(r"\x27[^\x27]*\x27", " ", s)                                     # '"'"'...'"'"'
print(s)
')"

is_commit() { printf '%s' "$args" | grep -qE '(^|[[:space:];&|(])git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?commit([[:space:]]|$)'; }
is_add() { printf '%s' "$args" | grep -qE '(^|[[:space:];&|(])git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?add([[:space:]]|$)'; }
commit_segment() { printf '%s' "$args" | tr ';|&\n' '\n\n\n\n' | grep -E 'git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?commit([[:space:]]|$)' || true; }
stages_at_commit() { commit_segment | grep -qE '[[:space:]](--all|-[A-Za-z]*a[A-Za-z]*)([[:space:]]|=|$)'; }

is_commit || exit 0
if is_add || stages_at_commit; then
  echo "Blocked: stage in one call and commit in the next — never \`git add && git commit\`, never \`-a\`/\`--all\`. The commit hook reads the INDEX for /verify's stamp (M113), and a command that stages at commit time hides what it will write." >&2
  exit 2
fi

root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$root"
staged="$(bash scripts/verify-digest.sh --staged)"
main="$(bash scripts/verify-digest.sh --main)"
[ "$staged" = "$main" ] && exit 0
grep -rqE "Verified:.*digest ${staged}" docs/tasks/*.md 2>/dev/null && exit 0

echo "Blocked: the staged runtime tree (digest ${staged}) carries no /verify stamp. Run /verify — it drives every surface in the blast radius through the QA agents and stamps the task's ticket with this digest — then commit. A tree with no runtime change needs no stamp (M113)." >&2
exit 2
