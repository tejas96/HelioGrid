#!/usr/bin/env bash
# The proof in CI's room (mechanisms.md M112). What git would commit — tracked files as they are
# now plus untracked files that are not ignored — laid over a fresh clone of the history, the
# environment CLEARED and set to the quality lane's own `env:` block read from
# .github/workflows/ci.yml, the database pointed at the developer's postgres, then installed,
# built and proven there. `.env.local`, `HelioGrid-UX/`, `dist/`, `.turbo/` and `.tools/` do not
# exist in the room, exactly as on GitHub, so a proof that leans on one goes red HERE.
#
#   scripts/verify-clean.sh            the whole proof — what CI runs (pnpm verify:ci)
#   scripts/verify-clean.sh test:unit  one stage, to reproduce a red lane fast (builds first)
#
# Not caught: faults that need Linux itself — path case, a tool ubuntu lacks (landmines.md).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
script="${1:-verify:ci}"
room="$(mktemp -d "${TMPDIR:-/tmp}/heliogrid-clean-room.XXXXXX")"
trap 'rm -rf "$room"' EXIT
repo="$room/repo"
log="${TMPDIR:-/tmp}/heliogrid-verify-clean.log"

say() { printf '\n── clean room · %s ──\n' "$1"; }

say "the history, cloned"
git clone -q "file://$root" "$repo"
# The openapi judge compares against origin/main: the same ref this checkout last fetched.
git -C "$repo" fetch -q "$root" refs/remotes/origin/main:refs/remotes/origin/main 2>/dev/null || true

say "the tree git would commit, laid over it"
(
  cd "$root"
  git ls-files -z --cached --others --exclude-standard \
    | while IFS= read -r -d '' f; do [ -e "$f" ] && printf '%s\0' "$f"; done \
    | tar --null -T - -cf - | tar -C "$repo" -xf -
  # Every deletion against HEAD, staged (git rm) and unstaged alike: the clone still holds the file.
  git diff -z --name-only --diff-filter=D HEAD | while IFS= read -r -d '' f; do rm -f "$repo/$f"; done
)

say "CI's environment, read from the workflow"
ci_env="$(python3 - "$root/.github/workflows/ci.yml" <<'PY'
import re, sys
in_job = in_env = False
for line in open(sys.argv[1]):
    if re.match(r'^  quality:\s*$', line):
        in_job = True
        continue
    if in_job and re.match(r'^  \S', line):
        break
    if in_job and re.match(r'^    env:\s*$', line):
        in_env = True
        continue
    if in_env:
        pair = re.match(r'^      ([A-Z_][A-Z0-9_]*):\s*(.*?)\s*$', line)
        if pair:
            print(f'{pair.group(1)}={pair.group(2)}')
        elif not re.match(r'^      #', line) and line.strip():
            in_env = False
PY
)"
[ -n "$ci_env" ] || { echo "verify-clean: the quality job's env block was not found in ci.yml" >&2; exit 1; }
ci_vars=()
while IFS= read -r line; do ci_vars+=("$line"); done <<< "$ci_env"
# The database is the one thing that is the ROOM's, not CI's: the developer's postgres, migrated.
db_url="$(grep -E '^DATABASE_URL=' "$root/.env.local" | head -1 | cut -d= -f2-)"
db_admin="$(grep -E '^DATABASE_ADMIN_URL=' "$root/.env.local" | head -1 | cut -d= -f2-)"
[ -n "$db_url" ] && [ -n "$db_admin" ] || { echo "verify-clean: .env.local carries no DATABASE_URL / DATABASE_ADMIN_URL — pnpm infra:up first" >&2; exit 1; }
printf '  %s\n' "${ci_vars[@]}" | sed 's/\(SECRET=\).*/\1<set>/'
echo "  (DATABASE_URL and DATABASE_ADMIN_URL are the room's own, from .env.local)"
run() {
  env -i HOME="$HOME" PATH="$PATH" TMPDIR="$room" CI=true "${ci_vars[@]}" \
    DATABASE_URL="$db_url" DATABASE_ADMIN_URL="$db_admin" "$@"
}
# The pinned judge is a download; the room may take this machine's copy when it is the pin.
if [ -x "$root/.tools/oasdiff/oasdiff" ]; then
  mkdir -p "$repo/.tools/oasdiff" && cp "$root/.tools/oasdiff/oasdiff" "$repo/.tools/oasdiff/oasdiff"
fi

cd "$repo"
{
  say "install"
  run pnpm install --frozen-lockfile --prefer-offline
  run bash scripts/install-oasdiff.sh
  say "migrate (sha-locked, a no-op on a migrated database)"
  run pnpm --filter @heliogrid/db migrate
  say "build"
  run pnpm turbo build
  say "pnpm $script"
  run pnpm "$script"
} 2>&1 | tee "$log"
status=${PIPESTATUS[0]}
say "verdict"
grep -h "adherence OK\|catalogs OK\|openapi freshness\|Test Files\|Tests \|invariants green\|VACUOUS\|SKIP\|error TS\|FAIL\|ELIFECYCLE" "$log" | grep -v "^.*> " | tail -12 || echo "  (no verdict line matched — read the log)"
echo "clean room: pnpm $script exited $status — full log: $log"
exit "$status"
