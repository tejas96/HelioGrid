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
#   scripts/verify-digest.sh --risk <branch> [<merge base>]
#                                      the Risk tier of the change the INDEX holds, so the tier rides the
#                                      commit it excuses. HIGH when the staged runtime diff from the merge
#                                      base (default: this branch's with origin/main) touches the database,
#                                      the API's shape or client, a service, a screen, or domain's money and
#                                      permission rules — whatever the ticket says (CLAUDE.md §3). Else the
#                                      ticket of the task the branch names (`<kind>/<t-id>-<slug>`, the
#                                      /start convention) decides: LOW when its section says `**Risk:** LOW`;
#                                      HIGH otherwise — no task in the name, no staged ticket, no Risk line.
#                                      A LOW change needs no stamp.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
if command -v shasum >/dev/null; then hash_cmd() { shasum -a 256; }
elif command -v sha256sum >/dev/null; then hash_cmd() { sha256sum; }
else echo 'verify-digest: needs shasum or sha256sum on PATH' >&2; exit 1; fi
# Served files only: not a .md file, not a package's own tests/ folder (never a folder named tests deeper
# in served code). Reads a bare path or an ls-tree line, whose path is its last tab-separated field.
runtime_only() { awk -F'\t' '$NF !~ /\.md$/ && $NF !~ /^(apps|packages)\/[^\/]+\/tests\//'; }
merge_base() { git merge-base HEAD "$(git rev-parse --verify -q origin/main || git rev-parse main)"; }
if [ "${1:-}" = "--risk" ]; then
  changed="$(git diff --cached --name-only "${3:-$(merge_base)}" -- apps packages | runtime_only)"
  high="$(grep -cE '^(packages/(db|contracts|data)/|apps/(api|worker|web|mobile)/|packages/domain/src/(money|tax|subsidy|pricing|authz)/|packages/domain/src/commerce/tranche-allocation\.ts$)' <<<"$changed" || true)"
  [ "$high" -eq 0 ] || { echo HIGH; exit 0; }
  id="$(printf '%s' "${2:-}" | sed -nE 's#^[^/]+/([Tt]-[A-Za-z0-9]+-[0-9]{3})(-.*)?$#\1#p' | tr '[:lower:]' '[:upper:]')"
  # The README's anatomy example carries a real task's heading and a LOW line, so it is never read;
  # a heading held by two files is two tickets the tree cannot tell apart, so it reads HIGH.
  files="$([ -n "$id" ] && git grep --cached -l -F "### $id " -- 'docs/tasks/*.md' ':(exclude)docs/tasks/README.md' || true)"
  [ -n "$files" ] && [ "$(printf '%s\n' "$files" | wc -l)" -eq 1 ] || { echo HIGH; exit 0; }
  # Only THIS task's section, from its heading to its `---` or the next heading, is read; awk reads
  # the whole file through, so `git show` is never left writing into a closed pipe.
  git show ":$files" | awk -v id="$id" '
    !done && index($0, "### " id " ") == 1 { on = 1; next }
    on && /^(---|#{2,3} )/ { on = 0; done = 1 }
    on && /^\*\*Risk:\*\* LOW( |$)/ { low = 1 }
    END { print (low ? "LOW" : "HIGH") }'
  exit 0
fi
case "${1:-}" in
  --staged) tree="$(git write-tree)" ;;
  --main) tree="$(git rev-parse "$(merge_base)^{tree}")" ;;
  --tip) tree="$(git rev-parse --verify -q 'origin/main^{tree}' || git rev-parse 'main^{tree}')" ;;
  *)
    scratch="$(mktemp)"
    cp "$(git rev-parse --git-path index)" "$scratch"
    tree="$(GIT_INDEX_FILE="$scratch" git add -A -- apps packages >/dev/null 2>&1; GIT_INDEX_FILE="$scratch" git write-tree)"
    rm -f "$scratch"
    ;;
esac
# The whole ls-tree line — mode, type, blob id, path — so a changed file moves the digest, not only a
# renamed one.
git ls-tree -r "$tree" -- apps packages | runtime_only | hash_cmd | cut -c1-12
