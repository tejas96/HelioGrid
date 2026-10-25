#!/usr/bin/env python3
"""PreToolUse hook: no screenshot and no picture read, in Main or in an agent.

A screen is proven by its tree and its measured values (`.claude/agents/qa-*.md`); a picture
costs tokens on every later turn and proves less than a number. Exit 2 blocks the call and the
message reaches the caller.
"""
import json
import re
import sys

PICTURE = re.compile(r"\.(png|jpe?g|gif|webp|bmp|tiff?)$", re.IGNORECASE)
# A command position: the start, or after `;`, `&&`, `||`, `|`, `(` or a newline — never a word
# inside a file edit, a heredoc line of prose or a message.
COMMAND_START = r"(?:^|[;&|(]|\n)\s*"
SHELL_SHOT = re.compile(
    COMMAND_START
    + r"(?:adb\s+(?:-s\s+\S+\s+)?(?:exec-out|shell)\s+screencap\b"
    + r"|xcrun\s+simctl\s+io\s+\S+\s+screenshot\b"
    + r"|idb\s+screenshot\b)",
)
SHOT_ACTIONS = {"screenshot", "zoom"}

EYES = (
    "Screenshots are off in HelioGrid. Read the screen as text instead: "
    "web `read_page`, `find`, `getBoundingClientRect`; iOS `idb ui describe-all --json`; "
    "Android `uiautomator dump`. Save that tree to `.qa/` when a row needs a picture."
)


def wants_picture(tool: str, tool_input: dict) -> bool:
    action = str(tool_input.get("action", "")).lower()
    if tool.endswith("__computer") or tool.endswith("Simulator__control"):
        return action in SHOT_ACTIONS
    if tool.endswith("__browser_batch"):
        return any(
            str((step.get("input") or {}).get("action", "")).lower() in SHOT_ACTIONS
            for step in tool_input.get("actions") or []
            if isinstance(step, dict)
        )
    if tool == "Read":
        return bool(PICTURE.search(str(tool_input.get("file_path", ""))))
    if tool == "Bash":
        return bool(SHELL_SHOT.search(str(tool_input.get("command", ""))))
    return False


def main() -> int:
    try:
        event = json.load(sys.stdin)
    except ValueError:
        return 0
    tool = str(event.get("tool_name", ""))
    tool_input = event.get("tool_input") or {}
    if isinstance(tool_input, dict) and wants_picture(tool, tool_input):
        print(EYES, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
