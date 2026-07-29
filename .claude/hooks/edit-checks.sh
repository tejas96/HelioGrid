#!/usr/bin/env bash
# PostToolUse:Edit|Write — advisory feedback only (exit 0 always).
# TODAY THIS IS THE ONLY SIGNAL for these two rules: nothing in `pnpm lint` or CI enforces
# max-lines or no-raw-hex yet. A lint-stage gate for both is planned (oxlint); until it
# lands, do not treat a silent hook as proof the rule holds.
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

lines=$(wc -l < "$path" | tr -d ' ')
if [ "$lines" -gt 450 ]; then
  notes="${notes}${path} is now ${lines} lines (cap ~450). Split by RESPONSIBILITY into a file named for what it does — never <name>-part2 or <name>2. "
fi

# Token adherence: only product UI surfaces. packages/tokens and design/ds-source are the
# token SOURCE, where raw hex is required, so they are deliberately not matched here.
case "$path" in
  *packages/ui/src/*|*apps/mobile/src/ui/*|*apps/mobile/src/screens/*|*apps/web/app/*)
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
