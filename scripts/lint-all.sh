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
total=0
# The gate COUNT is derived, never written twice. It was hardcoded as "6" in two printfs, which is
# exactly the drift this repo's gates exist to catch: add a seventh gate, forget one printf, and the
# summary quietly under-reports what ran.
run() { # run <label> <command...>
  local label="$1"; shift
  total=$((total + 1))
  printf '\n── %s ──\n' "$label"
  if "$@"; then :; else failed+=("$label"); fi
}

# --max-diagnostics=none: the cap is 20, and twice here fixing those 20 revealed 20 more, long present.
run 'biome (format + lint)'   pnpm exec biome check --error-on-warnings --max-diagnostics=none .
run 'dependency-cruiser'      pnpm exec dependency-cruiser --config .dependency-cruiser.cjs apps packages tests
run 'sherif (dep drift)'      pnpm exec sherif
run 'repo adherence'          bash scripts/check-adherence.sh
run 'env centralisation'      node scripts/check-env-access.mjs
# Gate 6 — the only gate that reads MEANING rather than shape: prop contracts vs the design system,
# false "it belongs to another folder" excuses, and inert React Native accessibility state.
run 'ds:contract (meaning)'   node scripts/ds-contract.mjs

if [ ${#failed[@]} -gt 0 ]; then
  printf '\n%s of %s lint gates FAILED:\n' "${#failed[@]}" "$total"
  for f in "${failed[@]}"; do printf '  ✗ %s\n' "$f"; done
  printf '\nEvery gate above ran — this is the complete list, not the first failure.\n'
  exit 1
fi

printf '\nall %s lint gates green\n' "$total"
