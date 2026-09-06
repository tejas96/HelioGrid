#!/usr/bin/env bash
# PreToolUse(Bash): `main` is PR-only and history is never rewritten (CLAUDE.md §4). A push
# straight to main skips the one human gate; a force-push discards what others hold. GitHub's
# branch rule is the backstop for everyone; this guard holds the agent whether or not that rule
# binds administrators.
set -euo pipefail

input="$(cat)"
branch="$(git -C "${CLAUDE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null || true)"

verdict="$(printf '%s' "$input" | CURRENT_BRANCH="$branch" python3 -c '
import json, os, re, sys
cmd = json.load(sys.stdin).get("tool_input", {}).get("command", "")
# Heredoc bodies and quoted strings are text, not actions.
cmd = re.sub(r"<<-?\x27?\"?(\w+)\x27?\"?.*?^\1", " ", cmd, flags=re.S | re.M)
cmd = re.sub(r"\"(?:[^\"\\\\]|\\\\.)*\"", " ", cmd)
cmd = re.sub(r"\x27[^\x27]*\x27", " ", cmd)
FORCE = {"-f", "--force", "--force-if-includes"}
for segment in re.split(r"[|;&]+|\n", cmd):
    words = segment.split()
    if "git" not in words or "push" not in words:
        continue
    args = words[words.index("push") + 1:]
    flags = [w for w in args if w.startswith("-")]
    positional = [w for w in args if not w.startswith("-")]
    forced = any(f in FORCE or f.startswith("--force-with-lease") for f in flags)
    if forced or any(p.startswith("+") for p in positional):
        print("force"); sys.exit(0)
    if len(positional) >= 2:
        destination = positional[1].split(":")[-1].removeprefix("refs/heads/")
        if destination == "main":
            print("main"); sys.exit(0)
    elif os.environ.get("CURRENT_BRANCH") == "main":
        print("bare"); sys.exit(0)
print("ok")
')"

case "$verdict" in
  force) echo "Blocked: never force-push (CLAUDE.md §4). Rebase forward and push, or open a new branch." >&2; exit 2 ;;
  main)  echo "Blocked: main is PR-only (CLAUDE.md §4). Push the feature branch and open a pull request." >&2; exit 2 ;;
  bare)  echo "Blocked: main is checked out, so a bare push would land on it (CLAUDE.md §4). Branch first." >&2; exit 2 ;;
esac
exit 0
