#!/usr/bin/env python3
"""PreToolUse hook on Bash: a command whose output runs long writes it to `.qa/<name>.log`.

A gate, a build or a test run printed into the chat is re-read on every later turn. The log on
disk keeps the whole output for a later grep; the chat gets only the lines that matter. Exit 2
blocks the call and the message reaches the caller.
"""
import json
import re
import sys

# A command position: the start, or after `;`, `&&`, `||`, `|`, `(`, `{` or a newline, past any
# `VAR=value` in front — never a word inside a file edit or a message.
COMMAND_START = r"(?:^|[;&|({]|\n)\s*(?:cd\s+\S+\s*(?:&&|;)\s*)?(?:\w+=\S+\s+)*"
PNPM = r"pnpm\s+(?:(?:-r|--recursive)\s+)?(?:run\s+)?"
LONG = re.compile(
    COMMAND_START
    + r"(?:" + PNPM + r"(?:check(?::all)?|test|test:unit|test:coverage|test:watch|lint|build|typecheck"
    + r"|turbo\s+(?:build|test|typecheck)"
    + r"|(?:--filter[=\s]|-F\s+)\S+\s+(?:run\s+)?"
    + r"(?:build|typecheck|test:web|test:ct|test:mobile|test|ios|android|exec\s+vitest))(?![\w:-])"
    + r"|vitest\s+run\b|pnpm\s+(?:exec\s+)?vitest\b"
    + r"|adb\s+(?:-s\s+\S+\s+)?logcat\b|xcrun\s+simctl\s+spawn\s+\S+\s+log\s+show\b)",
)
# A heredoc body is a file's or a script's text, never a command of this call.
HEREDOC = re.compile(r"((?<!<)<<-?\s*(['\"]?)(\w+)\2[^\n]*\n).*?(?:^\t*\3[ \t]*$|\Z)", re.S | re.M)
# A separator inside a quoted grep pattern or message is text, never a command position: it is
# blanked, and the rest of the quoted text stays, so a quoted log path still counts.
QUOTED = re.compile(r"'[^']*'|\"(?:[^\"\\]|\\.)*\"")
QUOTED_SEPARATOR = re.compile(r"[;&|(){}\n]")
# Where one command ends: `;`, `&&`, `||`, `|`, `&` or a newline — never the `&` of `2>&1` or `&>`.
COMMAND_END = re.compile(r";|&&|\|\||\||(?<![>&])&(?!>)|\n")
# `tee` still prints to the chat, so only a redirect counts, to `.qa/` by a relative or an absolute path.
TO_LOG = re.compile(r">>?\s*\"?(?:(?:\$\([^)]*\)|[^\s\"])*/)?\.qa/[\w./${}-]+\.log")

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
    command = HEREDOC.sub(r"\1", str((event.get("tool_input") or {}).get("command", "")))
    # Same length as `command`, so an offset found here cuts the same text out of `command`.
    unquoted = QUOTED.sub(
        lambda quoted: QUOTED_SEPARATOR.sub(" ", quoted.group(0)), command
    )
    for long_command in LONG.finditer(unquoted):
        if not (
            redirected_after(command, unquoted, long_command.end())
            or redirected_after(command, unquoted, closing_brace(unquoted, long_command.end()))
        ):
            print(FORM, file=sys.stderr)
            return 2
    return 0


def redirected_after(command: str, unquoted: str, start: int | None) -> bool:
    """Whether the command from `start` to its end sends its output to a `.qa/` log."""
    if start is None:
        return False
    end = COMMAND_END.search(unquoted, start)
    return TO_LOG.search(command[start : end.start() if end else len(command)]) is not None


def closing_brace(unquoted: str, start: int) -> int | None:
    """Where a `{ …; }` group that holds `start` closes, so the group's own redirect counts."""
    close = unquoted.find("}", start)
    if close == -1 or "{" in unquoted[start:close]:
        return None
    return close + 1


if __name__ == "__main__":
    sys.exit(main())
