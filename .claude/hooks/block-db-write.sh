#!/usr/bin/env bash
# PreToolUse(Bash): agents read the database, never write it. Schema changes go through a
# reviewed migration (pnpm db:migration:new -> review -> pnpm db:migrate); data changes go
# through the application. An ad-hoc write is unreviewable and unrepeatable.
set -euo pipefail

cmd="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))')"

# The sanctioned migration paths are allowed by name, before any pattern matching.
case "$cmd" in
  *"db:migrate"*|*"db:migration:new"*|*"drizzle-kit generate"*) exit 0 ;;
esac

# Only inspect a command that actually INVOKES a database client, so a grep that merely mentions
# one stays a read. The binary sits at a command position — start of line, after | ; & or a
# subshell — or behind a wrapper that runs it: docker exec, sudo, npx, pnpm exec, pnpm dlx,
# pnpm --filter <pkg> exec.
client='(psql|pg_dump|pg_restore|drizzle-kit)'
position='(^|[|;&(]|&&)[[:space:]]*'
wrapper='(docker[[:space:]]+exec([[:space:]]+[^[:space:]]+)*|sudo([[:space:]]+-[^[:space:]]+)*|npx|pnpm[[:space:]]+(exec|dlx)|pnpm[[:space:]]+(--filter|-F)[[:space:]]+[^[:space:]]+[[:space:]]+exec)[[:space:]]+'
if ! printf '%s' "$cmd" | grep -qE "(${position}|${wrapper})${client}\b"; then
  exit 0
fi

# SQL verbs for psql; push and migrate for drizzle-kit, which write the schema past the
# sha-locked runner.
if printf '%s' "$cmd" | grep -qiE '\b(insert|update|delete|drop|truncate|alter|create|grant|revoke|push|migrate)\b'; then
  echo "Blocked: agents do not write to the database. Schema -> 'pnpm db:migration:new', review the draft, then 'pnpm db:migrate'. Data -> go through the application." >&2
  exit 2
fi
exit 0
