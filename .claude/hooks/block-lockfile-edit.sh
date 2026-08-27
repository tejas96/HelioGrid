#!/usr/bin/env bash
# PreToolUse(Edit|Write): a lockfile is generated, never authored. Editing it by hand
# desynchronises it from package.json and produces installs that differ per machine.
set -euo pipefail

path="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))')"

case "$(basename "$path")" in
  pnpm-lock.yaml|package-lock.json|yarn.lock|bun.lockb)
    echo "Blocked: never edit a lockfile directly. Use 'pnpm add|remove <pkg>' and let the package manager rewrite it." >&2
    exit 2
    ;;
esac
exit 0
