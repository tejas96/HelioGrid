#!/usr/bin/env bash
# PreToolUse:Edit|Write — write-path policy. Exit 2 = block.
#   1. Applied migrations are append-only (packages/db/CLAUDE.md).
#   2. No unit-test files (.test.* / .spec.*) — owner directive 2026-07-29.
set -uo pipefail

payload=$(cat)
path=$(printf '%s' "$payload" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try { process.stdout.write(JSON.parse(s).tool_input?.file_path ?? ""); }
    catch { process.stdout.write(""); }
  });
')

[ -n "$path" ] || exit 0

deny() {
  printf 'BLOCKED by .claude/hooks/write-guard.sh: %s\n' "$1" >&2
  exit 2
}

# ── 1. Migrations are append-only ────────────────────────────────────────────
case "$path" in
  *packages/db/migrations/*)
    if git ls-files --error-unmatch "$path" >/dev/null 2>&1; then
      deny "$(printf '%s is an APPLIED migration. Migrations are append-only and sha256-locked by the runner — editing this file makes `pnpm --filter @heliogrid/db migrate` refuse to run. Create a new migration file instead.' "$path")"
    fi
    ;;
esac

# ── 2. No unit-test files ────────────────────────────────────────────────────
case "$path" in
  *.test.ts|*.test.tsx|*.test.js|*.test.jsx|*.spec.ts|*.spec.tsx|*.spec.js|*.spec.jsx)
    deny 'test files are not authored in this repo (owner directive 2026-07-29). A routine testing program comes AFTER the product is complete. The only sanctioned executable checks are tests/invariants/ (the locked invariant set) and on-demand scripts in scripts/. Features are verified by RUNNING the app — see the /verify-app skill. If a test is genuinely needed, ask the owner first.'
    ;;
esac

exit 0
