#!/usr/bin/env bash
# The proof in CI's room (mechanisms.md M112). What git would commit — tracked files as they are
# now plus untracked files that are not ignored — laid over a fresh clone of the history, the
# environment CLEARED and set to the quality lane's own `env:` block read from
# .github/workflows/ci.yml, the database pointed at the developer's postgres, then installed,
# built and proven there. `.env.local`, `HelioGrid-UX/`, `dist/`, `.turbo/` and `.tools/` do not
# exist in the room, exactly as on GitHub, so a proof that leans on one goes red HERE.
#
#   scripts/verify-clean.sh            the whole proof — CI's quality lane AND its mobile bundle
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
  # `--no-renames` is load-bearing. A file MOVED to another package is a rename to git, reported
  # as R and not D, so without it the old copy survived here and the room built a tree that git
  # would never commit — green locally, and the old file's stale imports red only on GitHub.
  git diff -z --no-renames --name-only --diff-filter=D HEAD \
    | while IFS= read -r -d '' f; do rm -f "$repo/$f"; done
)
# The room's INDEX must describe the ROOM, not the history it was cloned from. Six checks
# enumerate their corpus with `git ls-files --cached`, and against the clone's index they are
# handed paths the overlay above just deleted: the vocabulary scan CRASHED on one and the gate
# still reported OK, and the rest under-scan in silence. Refreshing the index is what makes the
# room's own answer to "which files are here" true.
git -C "$repo" add -A

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
            value = pair.group(2)
            # A YAML scalar wrapped in matching quotes is a STRING whose quotes are syntax, and
            # GitHub hands the job the bare value. Strip one matching pair, as the runner does,
            # so a value quoted to stay a string (a leading plus, a run of zeros) reaches the
            # room whole. chr() rather than a quote character: this heredoc sits inside a
            # command substitution, and the shell reading it cannot parse a bare quote there.
            if len(value) >= 2 and value[0] == value[-1] and value[0] in (chr(34), chr(39)):
                value = value[1:-1]
            print(f'{pair.group(1)}={value}')
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
  # ci.yml's mobile-js lane, which calls itself the ONE mechanical proof the React Native
  # JavaScript resolves: only the bundler walks Metro's module graph, so a broken import path,
  # a renamed asset or a package-exports change in a dependency passes typecheck and every
  # other gate here. Skipped for a single stage — that form exists to re-run one red lane fast.
  case "$script" in
    verify | verify:ci)
      say "bundle the RN JavaScript (ci.yml's mobile-js lane)"
      run pnpm --filter @heliogrid/mobile bundle
      ;;
  esac
  say "pnpm $script"
  run pnpm "$script"
} 2>&1 | tee "$log"
status=${PIPESTATUS[0]}
say "verdict"
grep -h "adherence OK\|catalogs OK\|Done writing bundle output\|openapi freshness\|Test Files\|Tests \|invariants green\|VACUOUS\|SKIP\|error TS\|FAIL\|ELIFECYCLE" "$log" | grep -v "^.*> " | tail -12 || echo "  (no verdict line matched — read the log)"
echo "clean room: pnpm $script exited $status — full log: $log"
exit "$status"
