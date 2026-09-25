#!/usr/bin/env bash
# git pre-commit and pre-merge-commit, the first step of package.json's `precommit` (mechanisms.md
# M113): a commit of a RUNTIME change waits for /verify's stamp — the ticket's `**Verified:** digest
# <12 hex> …` line, written by /verify from the runtime tree it drove (scripts/verify-digest.sh). git
# runs this with GIT_INDEX_FILE naming the exact index it is about to commit — a pathspec commit, `git
# -c …`, an absolute path to git, a merge included — so everything below reads what lands:
#   · the digest and the proofs are judged by the STAGED copies of their scripts, so an unstaged edit
#     to a script cannot switch this check off — a changed script has to ride the commit, in review;
#   · the stamp must be in a task file as STAGED, so it rides the commit it vouches for;
#   · a tree whose runtime digest equals the branch's merge base with origin/main — docs, ci, config,
#     tests — needs no stamp, nor one equal to origin/main's own tree (main merged in before the
#     task commits its work).
# A test does not move the digest, so a test the commit weakens is caught another way: every red
# proof the bound task's author recorded must read CURRENT against the index (break-and-run.sh
# --stale --index, M140). On a detached HEAD, every bound task's proofs are read.
set -euo pipefail

# A guard that cannot run fails closed.
for tool in python3 shasum; do
  command -v "$tool" >/dev/null || { echo "Blocked: this commit check needs $tool on PATH and cannot run without it (M113)." >&2; exit 1; }
done

cd "$(git rev-parse --show-toplevel)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
git show :scripts/verify-digest.sh > "$work/verify-digest.sh"
git show :scripts/break-and-run.sh > "$work/break-and-run.sh"

staged="$(bash "$work/verify-digest.sh" --staged)"
base="$(bash "$work/verify-digest.sh" --main)"
tip="$(bash "$work/verify-digest.sh" --tip)"
if [ "$staged" != "$base" ] && [ "$staged" != "$tip" ] && ! git grep --cached -qE "Verified:.*digest ${staged}" -- 'docs/tasks/*.md'; then
  echo "Blocked: the runtime tree this commit writes (digest ${staged}) carries no /verify stamp in a staged task file. Run /verify — it drives every surface in the blast radius through the QA agents and stamps the task's ticket with this digest — stage the ticket, then commit. A tree with no runtime change needs no stamp (M113)." >&2
  exit 1
fi

branch="$(git branch --show-current)"
records="$(git rev-parse --git-common-dir)/heliogrid-harness"
for bound in "$records"/*/branch; do
  [ -f "$bound" ] || continue
  [ -z "$branch" ] || [ "$(cat "$bound")" = "$branch" ] || continue
  task="$(basename "$(dirname "$bound")")"
  if ! report="$(bash "$work/break-and-run.sh" --stale "$task" --index 2>&1)"; then
    case "$report" in
      *"no author proof recorded"*|*"no proof recorded"*) ;;
      *) printf 'Blocked: a red proof task %s recorded is no longer current against what this commit writes — re-run it with scripts/break-and-run.sh (M140):\n%s\n' "$task" "$report" >&2; exit 1 ;;
    esac
  fi
done
exit 0
