#!/usr/bin/env bash
# git pre-commit and pre-merge-commit, the first step of package.json's `precommit` (mechanisms.md
# M113): a commit of a RUNTIME change on a HIGH-risk task waits for /verify's stamp — the ticket's
# `**Verified:** digest <12 hex> …` line, written by /verify from the runtime tree it drove
# (scripts/verify-digest.sh). git runs this with GIT_INDEX_FILE naming the exact index it is about to
# commit — a pathspec commit, `git -c …`, an absolute path to git, a merge included — so everything
# below reads what lands:
#   · the digest, the tier and the proofs are judged by the STAGED copies of their scripts, so an
#     unstaged edit to a script cannot switch this check off — a changed script rides the commit, in review;
#   · a change to the database, the API's shape or client, a service, a screen, or domain's money and
#     permission rules is HIGH whatever the ticket says; else the task's `**Risk:** LOW` line decides, and
#     it, like the stamp, must be in a task file as STAGED, so each rides the commit it vouches for; the
#     task is the one the branch names, `<kind>/<t-id>-<slug>` — no task in the name, or no Risk line,
#     reads as HIGH (scripts/verify-digest.sh --risk);
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
branch="$(git branch --show-current)"

staged="$(bash "$work/verify-digest.sh" --staged)"
base="$(bash "$work/verify-digest.sh" --main)"
tip="$(bash "$work/verify-digest.sh" --tip)"
if [ "$staged" != "$base" ] && [ "$staged" != "$tip" ] && ! git grep --cached -qE "Verified:.*digest ${staged}" -- 'docs/tasks/*.md'; then
  if [ "$(bash "$work/verify-digest.sh" --risk "$branch")" = LOW ]; then
    echo "runtime change on a LOW-risk task ($branch): no /verify stamp needed (M113)"
  else
    echo "Blocked: the runtime tree this commit writes (digest ${staged}) carries no /verify stamp in a staged task file. A HIGH-risk task runs /verify — it drives every surface in the blast radius through the QA agents and stamps the task's ticket with this digest — then stages the ticket and commits. A LOW-risk task needs no stamp when the branch names it (<kind>/<t-id>-<slug>), its STAGED ticket says '**Risk:** LOW', and the change touches no HIGH path — the database, the API, a service, a screen, domain's money and permission rules. A tree with no runtime change needs no stamp (M113)." >&2
    exit 1
  fi
fi

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
