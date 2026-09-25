#!/usr/bin/env bash
# PreToolUse(Bash): skipping git's hooks skips the commit gate — /verify's stamp (M113), biome
# --error-on-warnings and typecheck. Fix the diagnostic instead (CLAUDE.md §4).
#
# Matches the ACTION, not a mention: quoted segments are stripped first, so a commit message
# that discusses the flag still lands, while the flag as an argument is caught wherever it
# sits in the command. git accepts a long option by any unique prefix (`--no-verif`), global
# options before the subcommand (`git -c x=y commit`, `git --no-pager commit`), `-n` as the short
# form on `git commit` (on `git push` it is a dry run), a hooks path in any letter case, and the
# hook runner's own variables — each skips the gate just as surely as the full flag.
set -euo pipefail

# A guard that cannot run fails closed: only exit 2 blocks, so a missing tool must not exit 127.
command -v python3 >/dev/null || { echo "Blocked: this guard needs python3 on PATH and cannot run without it (M64)." >&2; exit 2; }

cmd="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))')"

verdict="$(printf '%s' "$cmd" | python3 -c '
import re, sys
s = sys.stdin.read()
# Strip heredoc bodies, then double- and single-quoted strings. What remains is argument text.
s = re.sub(r"<<-?\x27?\"?(\w+)\x27?\"?.*?^\1", " ", s, flags=re.S | re.M)
s = re.sub(r"\"(?:[^\"\\\\]|\\\\.)*\"", " ", s)
s = re.sub(r"\x27[^\x27]*\x27", " ", s)
if re.search(r"(^|\s)--no-verify(\s|=|$)", s):
    print("--no-verify"); sys.exit()
if re.search(r"core\.hookspath", s, re.I):
    print("a redirected hooks path"); sys.exit()
if re.search(r"SKIP_SIMPLE_GIT_HOOKS|SIMPLE_GIT_HOOKS_RC|GIT_CONFIG_(COUNT|KEY_\d+|VALUE_\d+|PARAMETERS)", s):
    print("the hook runner'"'"'s or git'"'"'s config variables"); sys.exit()
commit = re.compile(r"(?:^|\s)git(?:\s+(?:-[cC]\s+\S+|--\S+|-\S+))*\s+commit(?P<args>(?:\s.*)?)$")
for segment in re.split(r"[;&|\n]+", s):
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
