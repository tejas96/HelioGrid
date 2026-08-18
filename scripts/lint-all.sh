#!/usr/bin/env bash
# Runs every lint-stage gate and reports ALL of them, then exits 1 if any failed.
#
# The chain used to be `a && b && c && d && e && f`, so the first failure hid the status of
# everything after it: one Biome formatting error and you learned nothing about dependency
# direction, package boundaries, repo hygiene, env centralisation or web↔RN parity. You fix the
# formatting, re-run, discover the next one, and iterate — which is slow, and worse, it makes
# "lint failed" read as "one thing is wrong" when five checks never ran.
#
# The whole set measures ~5s. There is no budget argument for stopping early.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

failed=()
run() { # run <label> <command...>
  local label="$1"; shift
  printf '\n── %s ──\n' "$label"
  if "$@"; then :; else failed+=("$label"); fi
}

run 'biome (format + lint)'   pnpm exec biome check --error-on-warnings .
run 'dependency-cruiser'      pnpm exec dependency-cruiser --config .dependency-cruiser.cjs apps packages tests
run 'sherif (dep drift)'      pnpm exec sherif
run 'repo adherence'          bash scripts/check-adherence.sh
run 'env centralisation'      node scripts/check-env-access.mjs

if [ ${#failed[@]} -gt 0 ]; then
  printf '\n%s of 5 lint gates FAILED:\n' "${#failed[@]}"
  for f in "${failed[@]}"; do printf '  ✗ %s\n' "$f"; done
  printf '\nEvery gate above ran — this is the complete list, not the first failure.\n'
  exit 1
fi

printf '\nall 5 lint gates green\n'
