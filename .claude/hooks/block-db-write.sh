#!/usr/bin/env bash
# PreToolUse(Bash): agents read the database, never write it. Schema changes go through a
# reviewed migration (pnpm db:migration:new -> review -> pnpm db:migrate); data changes go
# through the application. An ad-hoc write is unreviewable and unrepeatable.
#
# Only a command that RUNS a database client is judged, so text that merely mentions one stays a
# read: a grep, an echo, a note written through a heredoc. A client runs when it sits at a command
# position (start of a line, after | ; & ( or a shell `do`/`then`/`else`), behind a wrapper (docker
# exec, sudo, npx, pnpm exec or dlx, pnpm --filter <pkg> exec), or inside an `sh -c` string — each
# may be preceded by VAR=value assignments, `env` or a path. A heredoc fed to a client is SQL and is
# judged; a heredoc fed to anything else is text. `pnpm db:migrate` and `pnpm db:migration:new` run
# no client by name, so they pass without a special case.
set -euo pipefail

# A guard that cannot run fails closed: only exit 2 blocks, so a missing tool must not exit 127.
command -v python3 >/dev/null || { echo "Blocked: this guard needs python3 on PATH and cannot run without it." >&2; exit 2; }

HOOK_INPUT="$(cat)" python3 - <<'PY'
import json, os, re, sys

ASSIGN = r"[A-Za-z_][A-Za-z0-9_]*=\S*\s+"
PREFIX = rf"(?:{ASSIGN})*(?:env\s+(?:{ASSIGN})*)?(?:\S*/)?"
CLIENT = r"(?:psql|pg_dump|pg_restore|drizzle-kit)\b"
POSITION = rf"(?:^|[|;&(]|\b(?:do|then|else)\s)\s*{PREFIX}"
WRAPPER = (r"(?:docker\s+exec(?:\s+\S+)*?|sudo(?:\s+(?:-u\s+\S+|-\S+))*|npx|pnpm\s+(?:exec|dlx)"
           rf"|pnpm\s+(?:--filter|-F)\s+\S+\s+exec)\s+{PREFIX}")
RUNS = re.compile(rf"(?:{POSITION}|{WRAPPER}){CLIENT}", re.M)
QUOTED = r"\"(?:[^\"\\]|\\.)*\"|'[^']*'"
SHELL_STRING = re.compile(rf"\b(?:ba|z)?sh\s+-c\s+({QUOTED})")
HEREDOC = re.compile(r"<<-?\s*(['\"]?)(\w+)\1([^\n]*)\n(.*?)(?:\n[ \t]*\2[ \t]*(?=\n|$)|\Z)", re.S)
# SQL verbs, and the words that open a write another way (MERGE, COPY, CALL, a DO block, a READ
# WRITE transaction, a switched role, the read-only setting turned off); push and migrate for
# drizzle-kit, which write the schema past the sha-locked runner. A word list, never a parser of
# SQL: it over-blocks a read that names one of these words, which is the safe side. SQL from a file
# (`psql -f`, `< file.sql`) is not seen here; qa_readonly's read-only sessions hold that.
WRITES = re.compile(
    r"\b(?:insert|update|delete|drop|truncate|alter|create|grant|revoke|merge|copy|call|push|migrate)\b"
    r"|\bdo\s+(?:language\s+\w+\s+)?(?:\$|')|read\s+write|transaction_read_only|session_authorization"
    r"|set\s+role|lo_(?:import|export)", re.I)


def unquote(quoted):
    inner = quoted[1:-1]
    return inner.replace('\\"', '"') if quoted[0] == '"' else inner


def runs_a_client(text, depth=0):
    """True when the shell would run a client: outside quotes, or inside an `sh -c` string."""
    if RUNS.search(re.sub(QUOTED, " Q ", text)):
        return True
    return depth < 3 and any(runs_a_client(unquote(m.group(1)), depth + 1) for m in SHELL_STRING.finditer(text))


def without_text_heredocs(cmd):
    """The command with every heredoc body dropped unless the command it feeds runs a client."""
    def keep_or_drop(match):
        line_start = cmd.rfind("\n", 0, match.start()) + 1
        owner = re.split(r"[;&|]", cmd[line_start:match.start()])[-1]
        return match.group(0) if runs_a_client(owner) else "<<" + match.group(2) + match.group(3) + "\n"
    return HEREDOC.sub(keep_or_drop, cmd)


try:
    command = json.loads(os.environ["HOOK_INPUT"]).get("tool_input", {}).get("command", "")
    judged = without_text_heredocs(command)
    if runs_a_client(judged) and WRITES.search(judged):
        print("Blocked: agents do not write to the database. Schema -> 'pnpm db:migration:new', review "
              "the draft, then 'pnpm db:migrate'. Data -> go through the application.", file=sys.stderr)
        sys.exit(2)
except SystemExit:
    raise
except Exception as error:  # a guard that crashes fails closed
    print(f"Blocked: the database-write guard could not read this command ({error}).", file=sys.stderr)
    sys.exit(2)
PY
