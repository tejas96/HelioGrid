#!/usr/bin/env bash
# One red proof, the only kind that counts (`.claude/rules/testing.md`, mechanisms.md M140): the test
# passes on the untouched tree, then FAILS BY NAME on every one of three or more runs with the rule
# broken, and the tree comes back byte for byte. The file is copied back, never undone by a reverse
# edit, which can land on another occurrence and leave a break behind.
#
#   scripts/break-and-run.sh --file <path> --test-file <path> (--expect <test title> | --pattern <ere>)
#     [--runs N] [--build <pnpm filter>] [--task <T-id> --claims <C1,D2>] [--actor author|reviewer]
#     -- '<break command>' -- '<test command>'
#   scripts/break-and-run.sh --stale <T-id> [--index]
#   scripts/break-and-run.sh --prune
#
# --expect names a vitest test: a run is red only when a FAIL line names --test-file and EXACTLY that
# title. A crash, a missing file or a compile error fails the run WITHOUT naming the test, so it never
# counts as red. --pattern is for runners that name nothing (the invariants): the ERE must appear in
# every broken run and NOT on the green one, and nothing checks the command runs --test-file.
# --build rebuilds that package before the baseline, after the break and after the restore, because
# a test in another package imports the last BUILD, never the source.
# --task and --claims append the proof to the task's record in .git/heliogrid-harness/<T-id>/, which
# survives the session and never enters the tree. --stale lists the author's recorded proofs whose
# file, test or log changed since, so a proof is re-run instead of trusted; a reviewer's proofs are
# listed as evidence and never make the task stale, since a reviewer's red-when-green IS a finding.
# --index judges the files as the INDEX holds them — what a commit writes — a file not in it reading
# gone, so git's pre-commit sees a test the commit weakens even when the disk copy was put back.
# --prune deletes each task's record once GitHub reports its branch's pull request MERGED after the
# record was bound (its `branch` file's time), so a branch name reused later never loses the new
# record. A record bound to no branch, or whose branch has no such merge, stays. With no `gh`, or no
# answer from GitHub, nothing is deleted. git's post-checkout runs it, so a merged task's record goes
# the first time this machine switches branch after the merge (M141).
# Exit 0: proven. 1: a run was not red by name. 2: refused before breaking anything. 3: the tree did
# not come back. A proof that is not exit 0 proves nothing.
set -u
refuse() { echo "break-and-run: $*" >&2; exit 2; }
root="$(git rev-parse --show-toplevel)" || refuse "not inside the repository"
record_dir() { echo "$(cd "$root" && cd "$(git rev-parse --git-common-dir)" && pwd)/heliogrid-harness/$1"; }
file=""; test_file=""; expect=""; pattern=""; runs=3; build=""; task=""; claims=""; actor="author"; stale=""; index=0; prune=0
while [ $# -gt 0 ]; do
  case "$1" in
    --) shift; break ;;
    --index) index=1; shift ;;
    --prune) prune=1; shift ;;
    --file|--test-file|--expect|--pattern|--runs|--build|--task|--claims|--actor|--stale)
      [ $# -ge 2 ] || refuse "$1 needs a value"
      case "$1" in
        --file) file="$2" ;; --test-file) test_file="$2" ;; --expect) expect="$2" ;;
        --pattern) pattern="$2" ;; --runs) runs="$2" ;; --build) build="$2" ;; --task) task="$2" ;;
        --claims) claims="$2" ;; --actor) actor="$2" ;; --stale) stale="$2" ;;
      esac
      shift 2 ;;
    *) refuse "unknown argument '$1' (the header of this file lists the arguments)" ;;
  esac
done

if [ "$prune" = 1 ]; then
  records="$(dirname "$(record_dir x)")"
  [ -d "$records" ] || exit 0
  command -v gh >/dev/null || { echo "proof records: none deleted — gh is not on PATH, so no merge can be read (M141)"; exit 0; }
  cd "$root" && exec python3 - "$records" <<'PRUNE'
import datetime, json, os, shutil, subprocess, sys
records = sys.argv[1]
deleted, kept = [], []
for name in sorted(os.listdir(records)):
    rec = os.path.join(records, name)
    bound = os.path.join(rec, "branch")
    if not os.path.isfile(bound):
        kept.append(f"{name} (bound to no branch)")
        continue
    branch = open(bound).read().strip()
    answer = subprocess.run(["gh", "pr", "list", "--head", branch, "--state", "merged", "--json", "number,mergedAt"],
                            capture_output=True, text=True)
    if answer.returncode != 0:
        kept.append(f"{name} (GitHub did not answer)")
        continue
    bound_at = os.path.getmtime(bound)
    merged = [p for p in json.loads(answer.stdout or "[]")
              if datetime.datetime.fromisoformat(p["mergedAt"].replace("Z", "+00:00")).timestamp() > bound_at]
    if merged:
        shutil.rmtree(rec)
        deleted.append(f"{name} (PR #{merged[0]['number']} merged)")
    else:
        kept.append(f"{name} ({branch} has no merge after this record was bound)")
print(f"proof records: {len(deleted)} deleted, {len(kept)} kept (M141)")
for line in deleted:
    print(f"  deleted {line}")
for line in kept:
    print(f"  kept {line}")
PRUNE
fi

if [ -n "$stale" ]; then
  rec="$(record_dir "$stale")"
  [ -s "$rec/proofs.jsonl" ] || { echo "break-and-run: no proof recorded for $stale — nothing is current" >&2; exit 2; }
  cd "$root" && exec python3 - "$rec" "$index" <<'PY'
import hashlib, json, os, subprocess, sys
rec, from_index = sys.argv[1], sys.argv[2] == "1"
latest = {}
for line in open(os.path.join(rec, "proofs.jsonl")):
    p = json.loads(line)
    latest[(p["file"], p["test_file"], p.get("expect") or p.get("pattern"), p["actor"])] = p
def blob(path):
    if from_index:
        found = subprocess.run(["git", "rev-parse", "-q", "--verify", f":{path}"], capture_output=True, text=True).stdout.strip()
        return found or "gone"
    return subprocess.run(["git", "hash-object", path], capture_output=True, text=True).stdout.strip() if os.path.exists(path) else "gone"
bad = 0
for p in sorted(latest.values(), key=lambda p: p["actor"] != "author"):
    log = os.path.join(rec, p["log"])
    why = []
    if p["verdict"] != "pass": why.append("its last run FAILED")
    if not os.path.exists(log) or hashlib.sha1(open(log, "rb").read()).hexdigest()[:12] != p["log_sha"]:
        why.append("its log is missing or altered")
    if blob(p["file"]) != p["file_sha"]: why.append(f"{p['file']} changed")
    if blob(p["test_file"]) != p["test_sha"]: why.append(f"{p['test_file']} changed")
    if p["actor"] != "author":
        print(f"{p['id']} {p['claims']} reviewer evidence — {'held' if not why else '; '.join(why)}")
        continue
    print(f"{p['id']} {p['claims'] or '-'} {'CURRENT' if not why else 'STALE — ' + '; '.join(why)}")
    bad += bool(why)
authors = sum(p["actor"] == "author" for p in latest.values())
print(f"{authors} proofs, {authors - bad} current, {bad} stale")
if not authors:
    print("no author proof recorded — nothing is current")
    sys.exit(2)
sys.exit(1 if bad else 0)
PY
fi

[ $# -ge 3 ] && [ "$2" = "--" ] || refuse "usage: … -- '<break command>' -- '<test command>'"
brk="$1"; test_cmd="$3"
[[ "$runs" =~ ^[0-9]+$ ]] && [ "$runs" -ge 3 ] || refuse "--runs must be 3 or more: a red proof holds on every run, never on one"
[ -n "$file" ] && [ -f "$root/$file" ] || refuse "--file must name a file in the repository"
test_file="${test_file#./}"; file="${file#./}"
[ -n "$test_file" ] && [ -f "$root/$test_file" ] || refuse "--test-file must name the test file that guards the rule"
{ [ -n "$expect" ] && [ -z "$pattern" ]; } || { [ -z "$expect" ] && [ -n "$pattern" ]; } || refuse "give exactly one of --expect <test title> or --pattern <ere>"
case "$actor" in author|reviewer) ;; *) refuse "--actor is author or reviewer" ;; esac
{ [ -z "$task" ] && [ -z "$claims" ]; } || { [[ "$task" =~ ^[A-Za-z0-9._-]+$ ]] && [[ "$claims" =~ ^[CDS][0-9]+(,[CDS][0-9]+)*$ ]]; } \
  || refuse "--task <T-id> and --claims <C1,D2> come together, or not at all"

crash='Transform failed|SyntaxError|No test files found|error TS[0-9]+|Cannot find module|ERR_MODULE_NOT_FOUND|SKIP invariants'
# The whole tree: status, the content of every change staged or not, and of every untracked file,
# so an edit to a new file that the restore missed still moves the hash.
tree_state() {
  { git -C "$root" status --porcelain; git -C "$root" diff; git -C "$root" diff --cached
    git -C "$root" ls-files -o --exclude-standard -z | (cd "$root" && xargs -0 shasum 2>/dev/null); } | shasum | cut -c1-12
}
# The id carries the time and this process, so two proofs on one task never share a line or a log.
id="red-$(date -u +%Y%m%dT%H%M%SZ)-$$"
if [ -n "$task" ]; then
  rec="$(record_dir "$task")"; mkdir -p "$rec/logs"; log="$rec/logs/$id.log"
else
  log="$(mktemp -t break-and-run)"
fi
: > "$log"
built() { [ -z "$build" ] || (cd "$root" && pnpm --filter "$build" build) >>"$log" 2>&1; }
run_test() { (cd "$root" && bash -c "$test_cmd") >"$1" 2>&1; }
# A run is red by name only when a vitest FAIL line names --test-file and ends in EXACTLY the --expect
# title: a substring would let another test's failure, a describe title or a path pass for this one.
named_in() {
  if [ -n "$expect" ]; then
    sed -n -E 's/^[[:space:]]*FAIL[[:space:]]+(.+)$/\1/p' "$1" | while IFS= read -r l; do
      [ "$l" != "${l%% > *}" ] && [ "${l%% > *}" = "$test_file" ] && [ "${l##* > }" = "$expect" ] && echo hit
    done | grep -c hit
  else grep -Ec -- "$pattern" "$1"; fi
}

before="$(tree_state)"
built || refuse "the build of $build failed before anything was broken (log: $log)"
one="$(mktemp)"
echo "=== baseline, unbroken" >>"$log"
if ! run_test "$one"; then cat "$one" >>"$log"; rm -f "$one"; refuse "the test fails BEFORE the break, so its failure would prove nothing (log: $log)"; fi
cat "$one" >>"$log"
if [ -n "$pattern" ] && grep -Eq -- "$pattern" "$one"; then rm -f "$one"; refuse "--pattern already shows on the green run, so it cannot tell the break from no break (log: $log)"; fi

saved="$(mktemp)"; cp "$root/$file" "$saved"; broken=1; rebuild_failed=0
# Restoring rebuilds too: a test in another package imports dist/, which the tree check cannot see.
restore() { if [ "$broken" = 1 ]; then cp "$saved" "$root/$file"; broken=0; built || rebuild_failed=1; fi; }
trap 'restore; rm -f "$saved" "$one"' EXIT
trap 'restore; exit 130' INT TERM
(cd "$root" && bash -c "$brk") >>"$log" 2>&1 || { restore; refuse "the break command failed"; }
cmp -s "$saved" "$root/$file" && { restore; refuse "the break changed nothing in $file"; }
built || { restore; refuse "the build of $build failed after the break (log: $log)"; }

red=0
for ((i = 1; i <= runs; i++)); do
  run_test "$one"; code=$?
  { echo "=== run $i, broken, exit $code"; cat "$one"; } >>"$log"
  named=$(named_in "$one")
  crashed=$(grep -Ec -- "$crash" "$one")
  if [ "$code" -ne 0 ] && [ "$named" -gt 0 ] && [ "$crashed" -eq 0 ]; then red=$((red + 1)); echo "run $i: red, by name"
  elif [ "$code" -eq 0 ]; then echo "run $i: GREEN with the rule broken"
  else echo "run $i: failed, but $( [ "$crashed" -gt 0 ] && echo 'by a crash' || echo 'without naming the test') — not red"; fi
done

restore
after="$(tree_state)"
verdict=fail; status=1
[ "$red" -eq "$runs" ] && { verdict=pass; status=0; }
[ "$before" = "$after" ] || { verdict=fail; status=3; echo "break-and-run: the tree did not come back — $file was copied back, so something else moved: read git status and restore it by hand" >&2; }
[ "$rebuild_failed" = 0 ] || { verdict=fail; status=3; echo "break-and-run: the rebuild after the restore failed, so dist/ may still hold the break — rebuild $build by hand" >&2; }

if [ -n "$task" ]; then
  (cd "$root" && python3 - "$rec/proofs.jsonl" "$id" "$task" "$claims" "$actor" "$verdict" "$file" \
    "$(git hash-object "$file")" "$test_file" "$(git hash-object "$test_file")" "$expect" "$pattern" \
    "$brk" "$test_cmd" "$runs" "$red" "$build" "logs/$id.log" "$(shasum "$log" | cut -c1-12)" \
    "$before" "$after" "$(git hash-object scripts/break-and-run.sh)" <<'PY'
import json, sys, time
(out, i, task, claims, actor, verdict, f, fsha, t, tsha, expect, pattern, brk, test, runs, red, build,
 log, lsha, tb, ta, ssha) = sys.argv[1:]
line = {"id": i, "kind": "red", "task": task, "claims": claims.split(","), "actor": actor,
        "writer": "break-and-run.sh", "verdict": verdict, "file": f, "file_sha": fsha, "test_file": t,
        "test_sha": tsha, "expect": expect, "pattern": pattern, "break": brk, "test": test,
        "runs": int(runs), "red_runs": int(red), "baseline": "green", "build": build, "log": log,
        "log_sha": lsha, "tree_before": tb, "tree_after": ta, "script_sha": ssha,
        "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
open(out, "a").write(json.dumps(line, ensure_ascii=False) + "\n")
PY
  ) || echo "break-and-run: the proof ran but its line was NOT recorded" >&2
fi
echo "$id: $verdict — named test red on $red of $runs runs; tree $( [ "$before" = "$after" ] && echo restored || echo 'NOT restored' ); log $log"
exit "$status"
