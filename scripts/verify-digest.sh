#!/usr/bin/env bash
# The digest of the RUNTIME tree — everything under apps/ and packages/ that is not a .md file —
# as /verify drove it and as a commit will carry it (mechanisms.md M113). Prints 12 hex chars.
#
#   scripts/verify-digest.sh           the working tree: untracked-not-ignored files in, deletions
#                                      honoured — what `git add -A` would stage. /verify stamps this.
#   scripts/verify-digest.sh --staged  the index — what `git commit` will write. The hook reads this.
#   scripts/verify-digest.sh --main    origin/main's — the "no runtime change" baseline.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
case "${1:-}" in
  --staged) tree="$(git write-tree)" ;;
  --main) tree="$(git rev-parse --verify -q 'origin/main^{tree}' || git rev-parse 'main^{tree}')" ;;
  *)
    scratch="$(mktemp)"
    cp "$(git rev-parse --git-path index)" "$scratch"
    tree="$(GIT_INDEX_FILE="$scratch" git add -A -- apps packages >/dev/null 2>&1; GIT_INDEX_FILE="$scratch" git write-tree)"
    rm -f "$scratch"
    ;;
esac
git ls-tree -r "$tree" -- apps packages | grep -v -E '\.md$' | shasum -a 256 | cut -c1-12
