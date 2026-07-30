#!/usr/bin/env bash
# Three repo-hygiene gates that Biome cannot express, done with grep rather than a new
# linter (owner decision 2026-07-30: oxlint was installed for this and REMOVED — it does
# not implement `no-restricted-syntax`, which was the whole reason to add it).
#
#   1. no test files            — owner directive: no .test.*/.spec.* until a testing
#                                 program is commissioned
#   2. source files ≲450 lines  — split by RESPONSIBILITY, never `*-part2`
#   3. no raw hex in UI paths   — every visual value comes from @heliogrid/tokens
#
# Each check prints its violations and the script exits 1 if any fired.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

fail=0
SRC_DIRS="apps packages tests"
UI_DIRS="packages/ui/src apps/mobile/src/ui apps/mobile/src/screens apps/web/app"
PRUNE=(-not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.next/*'
       -not -path '*/ios/*' -not -path '*/android/*')

# ── 1. No test files ─────────────────────────────────────────────────────────
tests_found=$(find $SRC_DIRS -type f \
  \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.test.js' -o -name '*.test.jsx' \
     -o -name '*.spec.ts' -o -name '*.spec.tsx' -o -name '*.spec.js' -o -name '*.spec.jsx' \) \
  "${PRUNE[@]}" 2>/dev/null)
if [ -n "$tests_found" ]; then
  printf 'TEST FILES (owner directive 2026-07-29 — not authored in this repo):\n%s\n' "$tests_found"
  echo '  The only sanctioned checks are tests/invariants/ and on-demand scripts/.'
  echo '  Features are verified by RUNNING them — see the /verify-app skill.'
  fail=1
fi

# ── 2. Source files over ~450 lines ──────────────────────────────────────────
oversize=$(find $SRC_DIRS -type f \
  \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \
     -o -name '*.mjs' -o -name '*.cjs' -o -name '*.css' \) \
  "${PRUNE[@]}" -not -name '*.d.ts' 2>/dev/null \
  | while IFS= read -r f; do
      n=$(wc -l < "$f" | tr -d ' ')
      if [ "$n" -gt 450 ]; then printf '  %5s  %s\n' "$n" "$f"; fi
    done)
if [ -n "$oversize" ]; then
  printf 'OVER 450 LINES — split by RESPONSIBILITY (never *-part2 / *2 / *-extra):\n%s\n' "$oversize"
  fail=1
fi

# ── 3. Raw hex in UI paths ───────────────────────────────────────────────────
# Matches hex in a VALUE position only (`prop: #hex` in CSS, `'#hex'` in TS/TSX) and skips
# comment lines. packages/ui CSS legitimately MENTIONS reference hex in comments while
# explaining the token that replaces it — flagging those would be noise, and noise is how a
# gate teaches people to ignore it.
hex=$(grep -rnE "(:[[:space:]]*#[0-9a-fA-F]{3,8}\b|['\"]#[0-9a-fA-F]{3,8}['\"])" \
        $UI_DIRS --include='*.ts' --include='*.tsx' --include='*.css' 2>/dev/null \
      | grep -vE ':[[:space:]]*(/\*|\*|//)')
if [ -n "$hex" ]; then
  printf 'RAW HEX in a UI path — use a token from @heliogrid/tokens:\n%s\n' "$hex"
  echo '  Tokens are GENERATED from design/ds-source; see docs/10 §3 and'
  echo '  .claude/rules/ui-adherence.md. packages/tokens and design/ds-source are exempt.'
  fail=1
fi

[ "$fail" = "0" ] && echo 'adherence OK — no test files, no oversize source, no raw hex in UI'
exit $fail
