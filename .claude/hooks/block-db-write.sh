#!/usr/bin/env bash
# PreToolUse(Bash): agents read the database, never write it. Schema changes go through a
# reviewed migration (pnpm db:migration:new -> review -> pnpm db:migrate); data changes go
# through the application. An ad-hoc write is unreviewable and unrepeatable.
set -euo pipefail

# A guard that cannot run fails closed: only exit 2 blocks, so a missing tool must not exit 127.
command -v python3 >/dev/null || { echo "Blocked: this guard needs python3 on PATH and cannot run without it (M20)." >&2; exit 2; }

cmd="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))')"

# The sanctioned migration paths are allowed by name, before any pattern matching.
case "$cmd" in
  *"db:migrate"*|*"db:migration:new"*|*"drizzle-kit generate"*) exit 0 ;;
esac

# Only inspect a command that actually INVOKES a database client, so a grep that merely mentions
# one stays a read. The binary sits at a command position — start of line, after | ; & or a
# subshell — or behind a wrapper that runs it: docker exec, sudo (with or without -u), npx,
# pnpm exec, pnpm dlx, pnpm --filter <pkg> exec, or a `sh -c` string. At either position it may
# be preceded by VAR=value assignments, an `env` wrapper, or a path to the binary: all of those
# still run the client.
client='(psql|pg_dump|pg_restore|drizzle-kit)'
prefix='([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*(env[[:space:]]+([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*)?([^[:space:]]*/)?'
position='(^|[|;&(]|&&)[[:space:]]*'"$prefix"
wrapper='(docker[[:space:]]+exec([[:space:]]+[^[:space:]]+)*|sudo([[:space:]]+(-u[[:space:]]+[^[:space:]]+|-[^[:space:]]+))*|npx|pnpm[[:space:]]+(exec|dlx)|pnpm[[:space:]]+(--filter|-F)[[:space:]]+[^[:space:]]+[[:space:]]+exec)[[:space:]]+'"$prefix"
shell_string='(ba|z)?sh[[:space:]]+-c[[:space:]]+["'"'"']?'"$prefix"
if ! printf '%s' "$cmd" | grep -qE "(${position}|${wrapper}|${shell_string})${client}\b"; then
  exit 0
fi

# SQL verbs for psql; push and migrate for drizzle-kit, which write the schema past the
# sha-locked runner.
if printf '%s' "$cmd" | grep -qiE '\b(insert|update|delete|drop|truncate|alter|create|grant|revoke|push|migrate)\b'; then
  echo "Blocked: agents do not write to the database. Schema -> 'pnpm db:migration:new', review the draft, then 'pnpm db:migrate'. Data -> go through the application." >&2
  exit 2
fi
exit 0
