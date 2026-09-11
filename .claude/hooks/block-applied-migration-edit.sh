#!/usr/bin/env bash
# PreToolUse(Edit|Write): migrations are append-only. A file already in HEAD has been applied
# somewhere and is sha256-locked by the runner; editing it makes `migrate` refuse to run.
set -euo pipefail

# A guard that cannot run fails closed: only exit 2 blocks, so a missing tool must not exit 127.
command -v python3 >/dev/null || { echo "Blocked: this guard needs python3 on PATH and cannot run without it (M19)." >&2; exit 2; }

path="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))')"

case "$path" in
  */packages/db/migrations/*.sql) ;;
  *) exit 0 ;;
esac

rel="${path#"${CLAUDE_PROJECT_DIR:-$PWD}/"}"
if git -C "${CLAUDE_PROJECT_DIR:-$PWD}" cat-file -e "HEAD:$rel" 2>/dev/null; then
  echo "Blocked: $rel is already committed, so it is an applied migration. Migrations are append-only (packages/db/CLAUDE.md, mechanism M19) — add a new numbered file." >&2
  exit 2
fi
exit 0
