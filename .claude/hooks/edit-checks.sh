#!/usr/bin/env bash
# PostToolUse:Edit|Write — advisory feedback only (exit 0 always).
# This is the AUTHOR-TIME signal, not the only one: `scripts/check-adherence.sh` runs inside
# `pnpm lint` (and `pnpm turbo lint` in CI) and hard-FAILS on both the 450-line cap and raw
# hex, so a violation cannot merge. This header used to claim the opposite and point at a
# planned oxlint gate; oxlint was removed by owner decision 2026-07-30 (no
# `no-restricted-syntax`, which was the entire reason to add it) and three greps replaced it.
# A silent hook still is not proof: this hook and the lint gate scan the same UI paths, so
# widening one without the other reopens the gap.
set -uo pipefail

payload=$(cat)
path=$(printf '%s' "$payload" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try { process.stdout.write(JSON.parse(s).tool_input?.file_path ?? ""); }
    catch { process.stdout.write(""); }
  });
')

[ -n "$path" ] && [ -f "$path" ] || exit 0

notes=""

# The ~450-line cap is a SOURCE-CODE rule. Specs, data models and design docs are
# legitimately long (docs/04 is ~1000 lines) — warning on those is noise, and noise is how
# a hook teaches people to ignore it.
case "$path" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.css)
    lines=$(wc -l < "$path" | tr -d ' ')
    if [ "$lines" -gt 450 ]; then
      notes="${notes}${path} is now ${lines} lines (cap ~450). Split by RESPONSIBILITY into a file named for what it does — never <name>-part2 or <name>2. "
    fi
    ;;
esac

# Token adherence: only product UI surfaces. packages/tokens and design/ds-source are the
# token SOURCE, where raw hex is required, so they are deliberately not matched here.
case "$path" in
  *packages/ui/src/*|*apps/mobile/src/*|*apps/mobile/App.tsx|*apps/web/app/*|*apps/web/lib/*)
    if grep -Eq "#[0-9a-fA-F]{3,8}\b" "$path"; then
      notes="${notes}${path} contains a raw hex colour. Every visual value comes from @heliogrid/tokens, generated from design/ds-source — see docs/10-i18n-and-design-system.md. "
    fi
    ;;
esac

[ -n "$notes" ] || exit 0

node -e '
  const note = process.argv[1];
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: note,
    },
  }));
' "$notes"
exit 0
