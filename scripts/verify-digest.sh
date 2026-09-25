#!/usr/bin/env bash
# The digest of the RUNTIME tree — everything under apps/ and packages/ that is served: not a .md
# file and not under a tests/ folder — as /verify drove it and as a commit will carry it
# (mechanisms.md M113). Prints 12 hex chars. A test does not change what the running app does, so a
# test edited after /verify leaves this digest, and the stamp, standing: the commit check refuses it
# instead when its red proof is no longer current (scripts/break-and-run.sh --stale).
#
#   scripts/verify-digest.sh           the working tree: untracked-not-ignored files in, deletions
#                                      honoured — what `git add -A` would stage. /verify stamps this.
#   scripts/verify-digest.sh --staged  the index — what `git commit` will write. The commit check
#                                      reads this, with git's GIT_INDEX_FILE.
#   scripts/verify-digest.sh --main    where this branch left origin/main (their merge base) — the
#                                      "no runtime change" baseline, so main moving on alone never
#                                      makes a docs commit look like a runtime one.
#   scripts/verify-digest.sh --tip     origin/main's own tree — a commit writing exactly main's
#                                      runtime tree (merging main before the task commits) is
#                                      already verified.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
case "${1:-}" in
  --staged) tree="$(git write-tree)" ;;
  --main)
    base="$(git rev-parse --verify -q origin/main || git rev-parse main)"
    tree="$(git rev-parse "$(git merge-base HEAD "$base")^{tree}")" ;;
  --tip) tree="$(git rev-parse --verify -q 'origin/main^{tree}' || git rev-parse 'main^{tree}')" ;;
  *)
    scratch="$(mktemp)"
    cp "$(git rev-parse --git-path index)" "$scratch"
    tree="$(GIT_INDEX_FILE="$scratch" git add -A -- apps packages >/dev/null 2>&1; GIT_INDEX_FILE="$scratch" git write-tree)"
    rm -f "$scratch"
    ;;
esac
if command -v shasum >/dev/null; then hash_cmd() { shasum -a 256; }
elif command -v sha256sum >/dev/null; then hash_cmd() { sha256sum; }
else echo 'verify-digest: needs shasum or sha256sum on PATH' >&2; exit 1; fi
# A package's own tests/ folder is left out, never a folder named tests deeper in served code.
git ls-tree -r "$tree" -- apps packages | awk -F'\t' '$2 !~ /\.md$/ && $2 !~ /^(apps|packages)\/[^\/]+\/tests\//' | hash_cmd | cut -c1-12
