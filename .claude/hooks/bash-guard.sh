#!/usr/bin/env bash
# PreToolUse:Bash — blocks commands the constitution forbids. Exit 2 = block.
# Node is guaranteed present (engines: node >=22 <23), so parse JSON with it.
set -uo pipefail

payload=$(cat)
cmd=$(printf '%s' "$payload" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try { process.stdout.write(JSON.parse(s).tool_input?.command ?? ""); }
    catch { process.stdout.write(""); }
  });
')

deny() {
  printf 'BLOCKED by .claude/hooks/bash-guard.sh: %s\n' "$1" >&2
  exit 2
}

# In-place stream edits have corrupted files in the predecessor repo (CLAUDE.md §Process).
# Match only at a COMMAND position — start of line, or after a shell separator (| ; & newline
# and their doubled forms). Matching anywhere would block `git commit -m "don't use sed -i"`,
# which is a legitimate command that merely mentions the banned one.
if printf '%s' "$cmd" | grep -Eq '(^|[|;&])[[:space:]]*(sed|perl|python[0-9.]*)[[:space:]]+([^|;&]*[[:space:]])?-i([[:space:]]|$)'; then
  deny "in-place stream edits (sed -i / perl -i / python -i) are banned — they have corrupted files in this codebase. Use the Edit or Write tool instead."
fi

# Force-pushing main destroys shared history. Anchored at a command position for the same
# reason as above — a commit message that MENTIONS a force push is not a force push.
if printf '%s' "$cmd" | grep -Eq '(^|[|;&])[[:space:]]*git[[:space:]]+push([[:space:]]+[^|;&]*)?[[:space:]]+(--force|-f)([[:space:]]|$)' \
  && printf '%s' "$cmd" | grep -Eq '(^|[[:space:]])main([[:space:]]|$|:)'; then
  deny "force-pushing main is not allowed. Push a branch and open a PR (docs/foundation-redesign.md §8)."
fi

# Git stays manual (CLAUDE.md §Process): pushes and PRs happen only when the user asks.
# The user's own terminal is unaffected — this guards the agent, not the human.
if printf '%s' "$cmd" | grep -Eq '(^|[|;&])[[:space:]]*git[[:space:]]+push([[:space:]]|$)'; then
  deny "git push is manual. Push only when the user explicitly asks — never on your own initiative (CLAUDE.md §Process)."
fi
if printf '%s' "$cmd" | grep -Eq '(^|[|;&])[[:space:]]*gh[[:space:]]+pr[[:space:]]+(create|merge|ready)([[:space:]]|$)'; then
  deny "opening or merging a PR is manual. Do it only on an explicit user command (CLAUDE.md §Process)."
fi

# Test files are not authored here — close the shell-redirect route that write-guard
# (which only sees Edit/Write file_path) cannot see. Anchored at a command position for
# the same reason as the rules above: a script that merely CONTAINS the text `> x.spec.ts`
# is not creating one, and blocking it makes verification scripts unrunnable.
test_target='\.(test|spec)\.(ts|tsx|js|jsx)([[:space:]]|$)'
if printf '%s' "$cmd" | grep -Eq "(^|[|;&])[[:space:]]*(cat|echo|printf|tee)[^|;&]*>[[:space:]]*[^[:space:]|;&]*${test_target}" \
  || printf '%s' "$cmd" | grep -Eq "(^|[|;&])[[:space:]]*touch[[:space:]]+[^|;&]*${test_target}"; then
  deny "test files are not authored in this repo (owner directive 2026-07-29). Features are verified by RUNNING them — see /verify-app. Ask the owner before adding any test."
fi

# Destructive recursive deletes outside the repo. Anchored at a command position.
if printf '%s' "$cmd" | grep -Eq '(^|[|;&])[[:space:]]*rm[[:space:]]+(-[a-zA-Z]*[[:space:]]+)*-?[a-zA-Z]*[rR][a-zA-Z]*[[:space:]]+(/|~|\$HOME)([[:space:]]|$)'; then
  deny "recursive delete targeting / or \$HOME. Scope the path inside the repository."
fi

exit 0
