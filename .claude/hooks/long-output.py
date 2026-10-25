#!/usr/bin/env python3
"""PreToolUse hook on Bash: a command whose output runs long writes it to `.qa/<name>.log`.

A gate, a build or a test run printed into the chat is re-read on every later turn. The log on
disk keeps the whole output for a later grep; the chat gets only the lines that matter. Exit 2
blocks the call and the message reaches the caller.
"""
import json
import re
import sys

# A command position: the start, or after `;`, `&&`, `||`, `|`, `(` or a newline — never a word
# inside a file edit, a heredoc line of prose or a message.
COMMAND_START = r"(?:^|[;&|(]|\n)\s*(?:cd\s+\S+\s*(?:&&|;)\s*)?"
LONG = re.compile(
    COMMAND_START
    + r"(?:pnpm\s+(?:check(?::all)?|test:unit|test:coverage|test:watch|lint|turbo\s+(?:build|test|typecheck)"
    + r"|--filter\s+\S+\s+(?:build|typecheck|test:web|test:ct|test:mobile|test))(?![\w:-])"
    + r"|vitest\s+run\b|pnpm\s+exec\s+vitest\b)",
)
TO_LOG = re.compile(r"(>>?|tee(\s+-a)?)\s*\"?\.qa/[\w./-]+\.log")

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
    if LONG.search(command) and not TO_LOG.search(command):
        print(FORM, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
