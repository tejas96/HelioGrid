#!/usr/bin/env python3
"""PreToolUse hook on Bash: a command whose output runs long writes it to `.qa/<name>.log`.

A gate, a build or a test run printed into the chat is re-read on every later turn. The log on
disk keeps the whole output for a later grep; the chat gets only the lines that matter. Exit 2
blocks the call and the message reaches the caller.
"""
import json
import re
import sys

# A command position: the start, or after `;`, `&&`, `||`, `|`, `(` or a newline, past any `VAR=value`
# in front — never a word inside a file edit or a message.
COMMAND_START = r"(?:^|[;&|(]|\n)\s*(?:cd\s+\S+\s*(?:&&|;)\s*)?(?:\w+=\S+\s+)*"
LONG = re.compile(
    COMMAND_START
    + r"(?:pnpm\s+(?:check(?::all)?|test:unit|test:coverage|test:watch|lint|turbo\s+(?:build|test|typecheck)"
    + r"|--filter\s+\S+\s+(?:build|typecheck|test:web|test:ct|test:mobile|test|ios|android))(?![\w:-])"
    + r"|vitest\s+run\b|pnpm\s+exec\s+vitest\b"
    + r"|adb\s+(?:-s\s+\S+\s+)?logcat\b|xcrun\s+simctl\s+spawn\s+\S+\s+log\s+show\b)",
)
# A heredoc body is a file's or a script's text, never a command of this call.
HEREDOC = re.compile(r"((?<!<)<<-?\s*(['\"]?)(\w+)\2[^\n]*\n).*?(?:^\t*\3[ \t]*$|\Z)", re.S | re.M)
# A `|` inside a quoted grep pattern or message is text, never a command position.
QUOTED = re.compile(r"'[^']*'|\"(?:[^\"\\]|\\.)*\"")
# `tee` still prints to the chat, so only a redirect counts.
TO_LOG = re.compile(r">>?\s*\"?\.qa/[\w./${}-]+\.log")

FORM = (
    "Long output goes to a file, never into the chat. Run it as:\n"
    "  <command> > .qa/<name>.log 2>&1; grep -nE 'error|fail|✗|FAIL|ERR|SKIP' .qa/<name>.log | head -40\n"
    "then read more of the log only around a failure (`grep -n -B3 -A12 <pattern> .qa/<name>.log`)."
)


def main() -> int:
    try:
        event = json.load(sys.stdin)
    except ValueError:
        return 0
    if event.get("tool_name") != "Bash":
        return 0
    command = str((event.get("tool_input") or {}).get("command", ""))
    unquoted = QUOTED.sub("''", HEREDOC.sub(r"\1", command))
    if LONG.search(unquoted) and not TO_LOG.search(command):
        print(FORM, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
