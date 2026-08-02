#!/usr/bin/env bash
# PreToolUse(Write): this repo has no unit tests (owner directive 2026-07-29). The only
# executable checks are tests/invariants/; behaviour is proven by running it.
set -euo pipefail

path="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))')"

case "$(basename "$path")" in
  *.test.*|*.spec.*)
    echo "Blocked: no .test.* or .spec.* files in this repo (CLAUDE.md §8, owner directive 2026-07-29). Executable checks live in tests/invariants/; behaviour is proven with /verify." >&2
    exit 2
    ;;
esac
exit 0
