#!/usr/bin/env bash
# PreToolUse(Edit|Write): a lockfile is generated, never authored. Editing it by hand
# desynchronises it from package.json and produces installs that differ per machine.
set -euo pipefail

# A guard that cannot run fails closed: only exit 2 blocks, so a missing tool must not exit 127.
command -v python3 >/dev/null || { echo "Blocked: this guard needs python3 on PATH and cannot run without it (M63)." >&2; exit 2; }

path="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))')"

case "$(basename "$path")" in
  pnpm-lock.yaml|package-lock.json|yarn.lock|bun.lockb)
    echo "Blocked: never edit a lockfile directly. Use 'pnpm add|remove <pkg>' and let the package manager rewrite it." >&2
    exit 2
    ;;
esac
exit 0
