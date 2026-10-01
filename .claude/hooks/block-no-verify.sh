#!/usr/bin/env bash
# PreToolUse(Bash): skipping git's hooks skips the commit gate — biome --error-on-warnings,
# typecheck and the secret scan. Fix the diagnostic instead (CLAUDE.md §4).
#
# Matches the ACTION, not a mention: a quoted string becomes the word Q, so a commit message
# that discusses the flag still lands, while the flag as an argument is caught wherever it
# sits in the command. git accepts a long option by any unique prefix (`--no-verif`), global
# options before the subcommand (`git -c x=y commit`, `git --no-pager commit`), `-n` as the short
# form on `git commit` (on `git push` it is a dry run), a hooks path in any letter case, and the
# hook runner's own variables — each skips the gate just as surely as the full flag. Reading
# core.hooksPath is allowed; only a command that sets, adds, replaces or unsets it is refused.
set -euo pipefail

# A guard that cannot run fails closed: only exit 2 blocks, so a missing tool must not exit 127.
command -v python3 >/dev/null || { echo "Blocked: this guard needs python3 on PATH and cannot run without it." >&2; exit 2; }

cmd="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))')"

verdict="$(printf '%s' "$cmd" | python3 -c '
import re, sys
s = sys.stdin.read()
# Drop heredoc bodies; a quoted string becomes the word Q, so a quoted value still counts as one.
s = re.sub(r"<<-?\x27?\"?(\w+)\x27?\"?.*?^\1", " ", s, flags=re.S | re.M)
s = re.sub(r"\"(?:[^\"\\\\]|\\\\.)*\"", " Q ", s)
s = re.sub(r"\x27[^\x27]*\x27", " Q ", s)
if re.search(r"(^|\s)--no-verify(\s|=|$)", s):
    print("--no-verify"); sys.exit()
if re.search(r"(-c\s*|--config-env=)core\.hookspath=", s, re.I):
    print("a redirected hooks path"); sys.exit()
if re.search(r"SKIP_SIMPLE_GIT_HOOKS|SIMPLE_GIT_HOOKS_RC|GIT_CONFIG_(COUNT|KEY_\d+|VALUE_\d+|PARAMETERS)", s):
    print("the hook runner'"'"'s or git'"'"'s config variables"); sys.exit()
git = r"(?:^|\s)git(?:\s+(?:-[cC]\s+\S+|--\S+|-\S+))*\s+"
config = re.compile(git + r"config(?P<args>(?:\s.*)?)$")
commit = re.compile(git + r"commit(?P<args>(?:\s.*)?)$")
config_writes = {"set", "unset", "--unset", "--unset-all", "--add", "--replace-all", "--edit", "-e"}
for segment in re.split(r"[;&|\n]+", s):
    m = config.search(segment)
    if m:
        # A redirection (`2>/dev/null`) is not a value; anything else after the key is one.
        words = [w for w in m.group("args").split() if not re.match(r"^\d*[<>]", w)]
        key = next((i for i, w in enumerate(words) if w.lower() == "core.hookspath"), None)
        if key is not None and (words[key + 1:] or any(w.lower() in config_writes for w in words[:key])):
            print("a redirected hooks path"); sys.exit()
    m = commit.search(segment)
    if not m:
        continue
    args = m.group("args")
    if re.search(r"(^|\s)--no-v[a-z-]*(\s|=|$)", args):
        print("a prefix of --no-verify"); sys.exit()
    if re.search(r"(^|\s)-[A-Za-z]*n[A-Za-z]*(\s|$)", args):
        print("-n, which is --no-verify,"); sys.exit()
')"

if [ -n "$verdict" ]; then
  echo "Blocked: $verdict skips git's commit gate. Fix the lint, typecheck or stamp diagnostic instead (CLAUDE.md §4)." >&2
  exit 2
fi
exit 0
