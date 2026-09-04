#!/usr/bin/env bash
# PreToolUse(Write): unit tests are WELCOME here since the owner ruling of 2026-09-03 — but only
# in one shape and one place, because a test tree that grows wherever it likes is how a suite
# becomes unmaintainable.
#
#   * `<package>/tests/**/*.test.ts` — outside `src/`, so the package build never compiles a
#     test into `dist/` and the file-shape gates over `src/` stay simple.
#   * LOGIC packages only. Frontend behaviour is proven by running it (owner ruling), and
#     `packages/data` is proven by driving the real client (its own CLAUDE.md).
#
# The backstop is `scripts/check-adherence.sh` check 1, which applies the SAME rules to files
# that arrive any other way. Change both or the pair disagrees.
set -euo pipefail

path="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))')"
rel="${path#"$CLAUDE_PROJECT_DIR"/}"

case "$(basename "$rel")" in
  *.test.*|*.spec.*) ;;
  *) exit 0 ;;
esac

if [[ "$(basename "$rel")" == *.spec.* ]]; then
  echo "Blocked: this repo names unit tests \`*.test.ts\`, never \`*.spec.*\` (CLAUDE.md §8). One convention, so a glob never misses half the suite." >&2
  exit 2
fi

# The tree a test may live in, and the packages that may hold one.
if [[ ! "$rel" =~ ^(packages|apps)/[a-z-]+/tests/ ]]; then
  echo "Blocked: a unit test lives at \`<package>/tests/**/*.test.ts\`, never beside the source (CLAUDE.md §8). \`$rel\` is not in a package's tests/ tree — inside src/ the package build would compile it into dist/." >&2
  exit 2
fi

case "$rel" in
  packages/domain/tests/*|packages/contracts/tests/*|packages/forms/tests/*|apps/api/tests/*|apps/worker/tests/*)
    exit 0 ;;
esac

echo "Blocked: \`${rel%%/tests/*}\` is not a unit-tested layer (CLAUDE.md §8). Unit tests cover DECISIONS — domain, contracts, forms, api, worker. Frontend is proven by running it; packages/data by driving the real client; packages/db by migrations and tests/invariants/." >&2
exit 2
