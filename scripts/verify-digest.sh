#!/usr/bin/env bash
# The digest of the RUNTIME tree — everything under apps/ and packages/ that is served (not a .md file,
# not under a tests/ folder) plus the root files that decide what installs and builds — as /verify
# drove it and as a commit will carry it (mechanisms.md M113), and the checker of /verify's record
# (M151). A test does not change what the running app does, so a test edited after /verify leaves the
# digest, and the stamp, standing: the commit check refuses it instead when its red proof is no longer
# current (scripts/break-and-run.sh --stale).
#
#   scripts/verify-digest.sh           the working tree's digest: untracked-not-ignored files in,
#                                      deletions honoured — what `git add -A` would stage. /verify stamps it.
#   scripts/verify-digest.sh --staged  the index's — what `git commit` will write (git's GIT_INDEX_FILE).
#   scripts/verify-digest.sh --main    where this branch left origin/main (their merge base) — the "no
#                                      runtime change" baseline, so main moving on alone never makes a
#                                      docs commit look like a runtime one.
#   scripts/verify-digest.sh --tip     origin/main's own tree — a commit writing exactly main's runtime
#                                      tree (main merged in before the task commits) is already verified.
#   scripts/verify-digest.sh --tree    the git tree id of the working tree as the digest reads it — every
#                                      verdict line's `tree`, so the checker can tell which steps a later
#                                      edit made stale.
#   scripts/verify-digest.sh --risk <branch> [<merge base>]
#                                      the Risk tier of the change the INDEX holds: HIGH by path (M113)
#                                      whatever the ticket says; else the ticket of the task the branch
#                                      names (`<kind>/<t-id>-<slug>`): LOW when its STAGED section says
#                                      `**Risk:** LOW`, HIGH otherwise — no task, no ticket, no Risk line.
#   scripts/verify-digest.sh --surfaces [<base>] [--paths <path> …]
#                                      the surfaces a change reaches, and its files under each: the diff
#                                      from <base> (default: the merge base) to the working tree, or the
#                                      layers `--paths` names (/start, before any diff exists).
#   scripts/verify-digest.sh --verdicts <T-id> [--dir <qa folder>] [--staged]
#                                      the task's QA record against its ticket's QA plan; exit 0 prints
#                                      the `counts:` text the stamp copies, exit 1 names every refusal.
#   scripts/verify-digest.sh --api-errors [<mark>] [<surface>]
#                                      the api log's server errors: `mark: <lines>@<log id>`, and with a mark
#                                      every line past it answered 5xx or logged at error level or above —
#                                      with a surface (web, ios, android, api), its own requests and those it
#                                      cannot place; a mark from a restarted log reads from the first line.
#                                      Exit 1 when it prints one, 2 on a bad argument. A QA agent marks
#                                      before a step and reads after.
#   scripts/verify-digest.sh --append <.git/heliogrid-harness/<T-id>/qa/verdicts-<surface>.jsonl> <<'LINE'
#                                      how a QA agent writes its line: one JSON object on stdin, appended
#                                      as one line to a verdict file under the harness and nowhere else.
#   scripts/verify-digest.sh --stamped <branch> <digest> [--records]
#                                      a STAGED ticket carries a `**Verified:**` line for <digest> in its
#                                      own section — the task the branch names, or a task this change
#                                      ships (its Status turns shipped since the merge base); --records
#                                      also runs --verdicts --staged on the branch's own task and holds
#                                      the line to its counts.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cd "$(git rev-parse --show-toplevel)"
if command -v shasum >/dev/null; then hash_cmd() { shasum -a 256; }
elif command -v sha256sum >/dev/null; then hash_cmd() { sha256sum; }
else echo 'verify-digest: needs shasum or sha256sum on PATH' >&2; exit 1; fi
runtime_paths=(apps packages package.json pnpm-lock.yaml turbo.json pnpm-workspace.yaml)
# Served files only: not a .md file, not a package's own tests/ folder (never a folder named tests deeper
# in served code). Reads a bare path or an ls-tree line, whose path is its last tab-separated field.
runtime_only() { awk -F'\t' '$NF !~ /\.md$/ && $NF !~ /^(apps|packages)\/[^\/]+\/tests\//'; }
merge_base() { git merge-base HEAD "$(git rev-parse --verify -q origin/main || git rev-parse main)"; }
worktree_tree() {
  local scratch; scratch="$(mktemp)"
  cp "$(git rev-parse --git-path index)" "$scratch"
  GIT_INDEX_FILE="$scratch" git add -A -- "${runtime_paths[@]}" >/dev/null 2>&1
  GIT_INDEX_FILE="$scratch" git write-tree
  rm -f "$scratch"
}
record_of() { echo "$(git rev-parse --git-common-dir)/heliogrid-harness/$1/qa"; }
checker() { python3 -B - "$here" "$@" < <(sed -n '/^# ---- checker ----$/,$p' "$here/verify-digest.sh" | tail -n +2); }

case "${1:-}" in
  --risk)
    changed="$(git diff --cached --name-only "${3:-$(merge_base)}" -- apps packages | runtime_only)"
    high="$(grep -cE '^(packages/(db|contracts|data|env|i18n|ui|theme|forms)/|apps/(api|worker|web|mobile)/|packages/domain/src/(money|tax|subsidy|pricing|authz)/|packages/domain/src/commerce/tranche-allocation\.ts$)' <<<"$changed" || true)"
    [ "$high" -eq 0 ] || { echo HIGH; exit 0; }
    checker tier "${2:-}"; exit 0 ;;
  --tree) worktree_tree; exit 0 ;;
  --api-errors)
    checker api-errors "$(git rev-parse --git-common-dir)/heliogrid-harness/api.log" "${2:-}" "${3:-}"; exit $? ;;
  --append)
    case "${2:-}" in
      *..*) echo "verify-digest: --append refuses a path with '..'" >&2; exit 2 ;;
      */heliogrid-harness/*/qa/verdicts-*.jsonl) ;;
      *) echo "verify-digest: --append writes only a verdicts-<surface>.jsonl under .git/heliogrid-harness/<T-id>/qa/" >&2; exit 2 ;;
    esac
    # The line comes on stdin (a quoted heredoc takes any character, an apostrophe included); a
    # line that is not one JSON object with a step_id is refused before anything is written.
    python3 -c 'import json, sys; v = json.loads(sys.stdin.read()); assert isinstance(v, dict) and "step_id" in v
open(sys.argv[1], "a").write(json.dumps(v, ensure_ascii=False) + "\n")' "$2" \
      || { echo "verify-digest: the line is not one JSON object with a step_id — nothing written" >&2; exit 2; }
    exit 0 ;;
  --surfaces)
    shift; base="$(merge_base)"
    if [ "${1:-}" != "" ] && [ "$1" != "--paths" ]; then base="$1"; shift; fi
    if [ "${1:-}" = "--paths" ]; then shift; checker surfaces "$@"
    else checker surfaces $(git diff --name-only "$base" "$(worktree_tree)" -- "${runtime_paths[@]}" | runtime_only); fi
    exit 0 ;;
  --verdicts)
    id="${2:?--verdicts needs a task id}"; dir="$(record_of "$id")"; staged=0; shift 2
    while [ $# -gt 0 ]; do case "$1" in
      --dir) dir="${2:?--dir needs a folder}"; shift 2 ;; --staged) staged=1; shift ;;
      *) echo "verify-digest: unknown argument '$1'" >&2; exit 2 ;; esac; done
    now="$([ "$staged" = 1 ] && git write-tree || worktree_tree)"
    checker verdicts "$id" "$dir" "$staged" "$now"; exit $? ;;
  --stamped)
    checker stamped "${2:?--stamped needs a branch}" "${3:?--stamped needs a digest}" "${4:-}" "$(git write-tree)" \
      "$(git rev-parse --git-common-dir)/heliogrid-harness" "$(merge_base)"; exit $? ;;
  --staged) tree="$(git write-tree)" ;;
  --main) tree="$(git rev-parse "$(merge_base)^{tree}")" ;;
  --tip) tree="$(git rev-parse --verify -q 'origin/main^{tree}' || git rev-parse 'main^{tree}')" ;;
  "") tree="$(worktree_tree)" ;;
  *) echo "verify-digest: unknown mode '$1' (the header of this file lists the modes)" >&2; exit 2 ;;
esac
# The whole ls-tree line — mode, type, blob id, path — so a changed file moves the digest, not only a
# renamed one.
git ls-tree -r "$tree" -- "${runtime_paths[@]}" | runtime_only | hash_cmd | cut -c1-12
exit 0
# ---- checker ----
import datetime, glob, hashlib, json, os, re, subprocess, sys
here, mode, args = sys.argv[1], sys.argv[2], sys.argv[3:]
sys.path.insert(0, here)
from gates import task_blocks
STAGED = False

APP_SURFACES = {"web": ["web"], "mobile": ["ios", "android"], "api": ["api"], "worker": ["worker"]}
EVERY = ["web", "ios", "android", "api", "worker"]
WIRE = ("apps/api/", "packages/db/", "packages/contracts/", "packages/data/")  # every surface calls it
ROOT_FILES = ("package.json", "pnpm-lock.yaml", "turbo.json", "pnpm-workspace.yaml")
TIME = re.compile(r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$")
BLOCK_ID = re.compile(r"^[^/]+/([Tt]-[A-Za-z0-9]+-[0-9]{3})(-.*)?$")

def git(*a, ok=True):
    r = subprocess.run(["git", *a], capture_output=True, text=True)
    if ok and r.returncode:
        sys.exit(f"verify-digest: git {' '.join(a)} failed: {r.stderr.strip()}")
    return r

def block_of(task, staged):
    found = [b for b in task_blocks(".", staged) if b["id"] == task]
    return found[0] if len(found) == 1 else None

def task_of(branch):
    m = BLOCK_ID.match(branch or "")
    return m[1].upper() if m else None

def listed(*patterns):
    """The files a pathspec names: the index's in the staged mode, else the working tree's."""
    found = git("ls-files", "--cached", *([] if STAGED else ["--others", "--exclude-standard"]), "--", *patterns).stdout.split()
    return sorted(set(found) if STAGED else {f for f in found if os.path.exists(f)})

def read(path):
    return git("show", f":{path}").stdout if STAGED else open(path, encoding="utf-8").read()

def surfaces_of(paths):
    """path -> surfaces, by exact prefix: an app is its own surface; a package reaches every app whose
    package.json depends on it, directly or through another workspace package; a root file reaches
    every surface."""
    names, deps = {}, {}
    for pj in listed(":(glob)apps/*/package.json", ":(glob)packages/*/package.json"):
        meta = json.loads(read(pj))
        names[meta["name"]] = os.path.dirname(pj)
        deps[os.path.dirname(pj)] = [d for part in ("dependencies", "devDependencies") for d in meta.get(part, {})]
    def closure(home, seen):
        for d in deps.get(home, []):
            if d in names and names[d] not in seen:
                seen.add(names[d])
                closure(names[d], seen)
        return seen
    reach = {home[5:]: closure(home, set()) for home in deps if home.startswith("apps/")}
    out = {}
    for p in paths:
        top = "/".join(p.split("/")[:2])
        if p in ROOT_FILES:
            out[p] = list(EVERY)
        elif top.startswith("apps/"):
            out[p] = APP_SURFACES.get(top[5:], [])
        else:
            out[p] = sorted({s for app, homes in reach.items() if top in homes for s in APP_SURFACES.get(app, [])})
    return out

def cmd_surfaces(paths):
    by = {}
    for p, ss in surfaces_of(paths).items():
        for s in ss:
            by.setdefault(s, []).append(p)
    print("surfaces: " + (" ".join(s for s in EVERY if s in by) or "none"))
    for s in EVERY:
        if s in by:
            print(f"{s}:")
            for p in sorted(by[s]):
                print(f"  {p}")

def cmd_tier(branch):
    task = task_of(branch)
    block = block_of(task, True) if task else None
    print("LOW" if block and re.search(r"^\*\*Risk:\*\* LOW( |$)", block["body"], re.M) else "HIGH")

def plan_of(body):
    """Q<n> -> (surface, claims, suite file or None), from the ticket's `**QA plan:**` lines."""
    steps = {}
    for m in re.finditer(r"^- \*\*(Q\d+)\*\* · (\w+) · ([^·\n]+?)(?: · ([^\n]*))?$", body, re.M):
        suite = re.match(r"suite (\S+)", m[4] or "")
        steps[m[1]] = (m[2], [c.strip() for c in m[3].split(",")], suite[1] if suite else None)
    return steps

def web_routes(files):
    routes = set()
    for f in files:
        m = re.match(r"apps/web/app/(.*?)/?page\.tsx$", f)
        if m:
            parts = [s for s in m[1].split("/") if s and not (s.startswith("(") and s.endswith(")"))]
            routes.add("/" + "/".join(parts))
    return routes

def screens(files):
    return {m[1] for f in files if (m := re.match(r"apps/mobile/src/screens/([^/]+)/[^/]*Screen\.tsx$", f))}

def dispatch_times(run):
    """Each surface's dispatch times from run.md (`/verify` §3), so a surface that wrote one line does
    not read 0 min. Only the printed `wall:` reads them — never a refusal, and never the commit check,
    which runs quiet — and a time that is no real time is skipped."""
    times = {}
    text = open(run, encoding="utf-8").read() if os.path.isfile(run) else ""
    for s, at in re.findall(r"\bdispatched (\w+) (\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ)", text):
        try:
            datetime.datetime.fromisoformat(at[:-1])
        except ValueError:
            continue
        times.setdefault(s, []).append(at)
    return times

def cmd_verdicts(task, folder, staged, now, quiet=False):
    global STAGED
    STAGED = staged
    block = block_of(task, staged)
    if not block:
        sys.exit(f"verify-digest: no single ticket {task} in docs/tasks/")
    body, problems = block["body"], []
    plan = plan_of(body)
    if not plan:
        problems.append(f"{task} has no QA plan this checker can read (`- **Q<n>** · <surface> · <claims> · …`)")
    unread = [q for q in re.findall(r"^- \*\*(Q\d+)\*\*", body, re.M) if q not in plan]
    if unread:
        problems.append(f"plan steps {unread} are not in the step grammar (docs/tasks/README.md), so no line could cover them")
    caps = {"verify": 3, "ship": 2}
    raised = re.search(r"^\*\*Rounds:\*\*(.*)$", body, re.M)
    for stage, n in re.findall(r"\b(verify|ship) (\d+)", raised[1] if raised else ""):
        caps[stage] = int(n)
    files = sorted(glob.glob(os.path.join(folder, "verdicts-*.jsonl")))
    if not files:
        problems.append(f"no verdicts-*.jsonl in {folder}")
    routes, phone = web_routes(listed("apps/web/app")), screens(listed("apps/mobile/src/screens"))
    contract_text = "".join(read(f) for f in listed(":(glob)packages/contracts/src/**/*.ts"))
    deferred_rows = [l for f in listed("docs/tasks/deferred.md") for l in read(f).split("\n") if l.startswith("| ")]
    lines = []
    for f in files:
        for n, raw in enumerate(open(f), 1):
            if not raw.strip():
                continue
            where = f"{os.path.basename(f)}:{n}"
            try:
                v = json.loads(raw)
            except ValueError:
                problems.append(f"{where} is not JSON")
                continue
            lines.append((where, v))
    STAGES, rank = ("verify", "ship"), {"verify": 0, "ship": 1}
    good = []
    for where, v in lines:
        bad = []
        sid, surface, verdict = v.get("step_id"), v.get("surface"), v.get("verdict")
        author = v.get("driver") == "author"
        if v.get("driver") not in ("agent", "author"): bad.append("driver is agent or author")
        if not (sid is None and author) and not re.fullmatch(r"[QP]\d+", str(sid)):
            bad.append("step_id is Q<n> or P<n> (null only on an author's recorded proof)")
        if surface not in (["recorded"] if sid is None else EVERY + ["parity"]):
            bad.append(f"surface {surface!r} is {'recorded, for a proof filed under no step' if sid is None else 'one of ' + ', '.join(EVERY) + ', parity'}")
        if "deferred" in v and not (isinstance(v["deferred"], str) and len(v["deferred"]) >= 20):
            bad.append("deferred quotes at least 20 characters of its deferred.md row")
        if not isinstance(v.get("claims"), list): bad.append("claims is a list")
        if not isinstance(v.get("round"), int) or v["round"] < 0: bad.append("round is a whole number")
        if v.get("stage") not in STAGES: bad.append("stage is verify or ship")
        if not re.fullmatch(r"[0-9a-f]{40}", str(v.get("tree"))): bad.append("tree is a git tree id")
        if not TIME.match(str(v.get("at"))): bad.append("at is a UTC time")
        kinds = ("clean", "finding", "inconclusive") if str(sid).startswith("P") else ("pass", "fail", "inconclusive")
        if verdict not in kinds: bad.append(f"verdict is one of {', '.join(kinds)}")
        if not isinstance(v.get("evidence"), list) or not all(isinstance(e, str) for e in v.get("evidence", [])):
            bad.append("evidence is a list of paths or text")
        if verdict in ("pass", "clean") and (not v.get("observed") or not v.get("evidence")):
            bad.append(f"a {verdict} carries an observed value and evidence")
        if "expected" not in v: bad.append("expected is present")
        if bad:
            problems.append(f"{where}: breaks the line shape — {'; '.join(bad)}")
            continue
        if author:
            problems += [f"{where}: {p}" for p in author_faults(v, folder)]
        if str(sid).startswith("Q"):
            if sid not in plan:
                problems.append(f"{where}: {sid} is not a step of {task}'s QA plan")
                continue
            want, claims, suite = plan[sid]
            allowed = ["ios", "android"] if want == "mobile" else [want]
            if surface not in allowed:
                problems.append(f"{where}: {sid} is a {want} step, so a {surface} line is off-plan")
                continue
            if sorted(v["claims"]) != sorted(claims):
                problems.append(f"{where}: claims {v['claims']} are not {sid}'s own ({', '.join(claims)}) — a line covers every claim of its step")
        elif sid:
            target = str(v.get("target", ""))
            real = {"web": target in routes, "ios": target in phone, "android": target in phone,
                    "api": f"'{target.split(' ')[-1]}'" in contract_text}.get(surface, False)
            if not real:
                problems.append(f"{where}: probe target {target!r} is no {surface} route or screen")
        good.append((where, v))
    by_step = {}
    for where, v in good:
        by_step.setdefault((v["step_id"] or f"recorded {v['id']}", v["surface"]), []).append((where, v))
    for step in by_step.values():
        step.sort(key=lambda wv: (rank[wv[1]["stage"]], wv[1]["round"], wv[1]["at"]))
    for sid, (want, claims, suite) in plan.items():
        if want == "mobile" and claims != ["landing"]:
            problems.append(f"{sid} names mobile but is not a landing — a step names ios or android (V9)")
        if suite:
            continue
        for s in (["ios", "android"] if want == "mobile" else [want]):
            if (sid, s) not in by_step:
                problems.append(f"{sid} ({s}) has no verdict line")
    diffs = {}
    def changed(tree):
        if tree not in diffs:
            if git("cat-file", "-e", f"{tree}^{{tree}}", ok=False).returncode:
                diffs[tree] = None
            else:
                out = git("diff-tree", "-r", "--name-only", tree, now, "--", *["apps", "packages", *ROOT_FILES]).stdout.split()
                diffs[tree] = [p for p in out if not p.endswith(".md") and not re.match(r"(apps|packages)/[^/]+/tests/", p)]
        return diffs[tree]
    for (key, surface), step in sorted(by_step.items()):
        where, last = step[-1]
        inconclusive = sum(v["verdict"] == "inconclusive" for _, v in step)
        if inconclusive > 2:
            problems.append(f"{key} ({surface}) has {inconclusive} inconclusive lines — two environment retries at most, then the owner picks (R2)")
        if last["verdict"] == "inconclusive":
            problems.append(f"{key} ({surface}) ends inconclusive ({where}) — an inconclusive step blocks the stamp (D8)")
        elif last["verdict"] == "fail":
            problems.append(f"{key} ({surface}) ends in a fail ({where})")
        elif last["verdict"] == "finding" and not any(last.get("deferred", "\0") in row for row in deferred_rows):
            problems.append(f"{key} ({surface}) ends in a finding ({where}) with no later clean line and no deferred.md row it cites")
        if surface == "recorded":
            continue
        paths = changed(last["tree"])
        if paths is None:
            problems.append(f"{key} ({surface}): its tree {last['tree'][:12]} is gone from git ({where}) — re-drive the step (W11)")
            continue
        hit = [p for p in paths if p.startswith(WIRE) or p in ROOT_FILES] or [
            p for p, ss in surfaces_of(paths).items()
            if (surface == "parity" and set(ss) & {"web", "ios", "android"}) or surface in ss]
        if hit:
            problems.append(f"{key} ({surface}) is stale ({where}): {hit[0]}{f' and {len(hit) - 1} more' if len(hit) > 1 else ''} changed since it ran")
    for stage in STAGES:
        top = max((v["round"] for _, v in good if v["stage"] == stage), default=0)
        if top > caps[stage]:
            problems.append(f"/{stage} reached round {top}, past its cap of {caps[stage]} — a `**Rounds:** {stage} <n> — owner, <reason>` line raises it")
    dispatched = {} if quiet else dispatch_times(os.path.join(folder, "run.md"))
    counts, walls = [], []
    for s in EVERY + ["parity", "recorded"]:
        last = [st[-1][1]["verdict"] for (k, sf), st in by_step.items() if sf == s and not str(k).startswith("P")]
        probes = [st[-1][1]["verdict"] for (k, sf), st in by_step.items() if sf == s and str(k).startswith("P")]
        if last:
            counts.append(f"{s} {last.count('pass')} pass / {last.count('fail')} fail / {last.count('inconclusive')} inconclusive")
        if probes:
            counts.append(f"{s} probes {probes.count('clean')} clean / {probes.count('finding')} finding")
        ats = sorted(v["at"] for _, v in good if v["surface"] == s)
        if ats and not quiet:
            start = min([ats[0]] + dispatched.get(s, []))
            span = datetime.datetime.fromisoformat(ats[-1][:-1]) - datetime.datetime.fromisoformat(start[:-1])
            walls.append(f"{s} {round(span.total_seconds() / 60)} min")
    for p in problems:
        print(f"REFUSED: {p}")
    if not quiet:
        print("wall: " + (" · ".join(walls) or "none"))
    print("counts: " + " · ".join(counts))
    return 1 if problems else 0

def author_faults(v, folder):
    """A line an author drove was written by scripts/record-proof.sh for that step (M137): its log, the
    log's hash, the lines it quotes and the verdict all follow from the log."""
    faults = []
    log = os.path.join(folder, "logs", f"{v.get('id')}.log")
    if v.get("recorder") != "record-proof.sh":
        return ["an author line not written by record-proof.sh"]
    if not os.path.exists(log):
        return [f"its log logs/{v.get('id')}.log is missing"]
    data = open(log, "rb").read()
    if hashlib.sha1(data).hexdigest()[:12] != v.get("log_sha"):
        faults.append("its log does not hash to its log_sha")
    text = data.decode("utf-8", "replace")
    if any(line not in text for line in v.get("observed", [])):
        faults.append("it quotes a line its log does not hold")
    grep = lambda pat: pat and subprocess.run(["grep", "-qE", "--", pat, log]).returncode == 0
    code, want = v.get("exit"), v.get("expect_exit")
    timed_out = f"record-proof: timed out after" in text and code == 124
    ok = ((want == "0" and code == 0) or (want == "nonzero" and code != 0) or want == "any") \
        and grep(v.get("expected")) and not grep(v.get("reject")) and v.get("tree_before") == v.get("tree_after")
    if ("inconclusive" if timed_out else "pass" if ok else "fail") != v["verdict"]:
        faults.append(f"its log says {'inconclusive' if timed_out else 'pass' if ok else 'fail'}, the line says {v['verdict']}")
    return faults

SHIPPED = re.compile(r"^\**Status:\**\s*shipped \(#\d+\)", re.M)

WEB_ORIGIN = "http://localhost:3002"

def client_of(line):
    """Which surface sent the request a log line answers; None when the line names no request or
    no client this knows, so it counts against every surface rather than hiding from all."""
    headers = (line.get("req") or {}).get("headers") or {}
    agent = headers.get("user-agent", "")
    if headers.get("origin") == WEB_ORIGIN:
        return "web"
    if agent.startswith("curl/"):
        return "api"
    if "okhttp" in agent:
        return "android"
    if "CFNetwork" in agent or "Darwin" in agent:
        return "ios"
    return None

CLIENTS = ("web", "ios", "android", "api")

def log_identity(lines):
    """The api process that wrote the log: its first JSON line's pid and time. The launch command
    empties the file at every start, so a mark from another process means the log restarted, even
    when the new log has already grown past the mark's line count."""
    for raw in lines:
        try:
            line = json.loads(raw)
        except ValueError:
            continue
        if isinstance(line, dict) and "pid" in line and "time" in line:
            return f"{line['pid']}.{line['time']}"
    return "none"

def cmd_api_errors(log, mark, surface):
    if surface and surface not in CLIENTS:
        print(f"verify-digest: --api-errors reads one of {', '.join(CLIENTS)}, never {surface!r}", file=sys.stderr)
        return 2
    marked = re.fullmatch(r"(\d+)@([\w.]+)", mark) if mark else None
    if mark and not marked:
        print(f"verify-digest: a mark is what the previous call printed, `<lines>@<log id>`, never {mark!r}", file=sys.stderr)
        return 2
    if not os.path.isfile(log):
        print(f"verify-digest: no api log at {log} — the `api` or `api-built` server writes it", file=sys.stderr)
        return 2
    lines = open(log, encoding="utf-8", errors="replace").read().splitlines()
    identity = log_identity(lines)
    since = int(marked[1]) if marked else len(lines)
    if marked and (marked[2] != identity or since > len(lines)):
        print(f"the log restarted since mark {mark} — read from its first line")
        since = 0
    found = 0
    for raw in lines[since:]:
        try:
            line = json.loads(raw)
        except ValueError:
            continue
        if not isinstance(line, dict):
            continue
        status = (line.get("res") or {}).get("statusCode") or 0
        if status < 500 and line.get("level", 0) < 50:
            continue
        client = client_of(line)
        if surface and client not in (surface, None):
            continue
        req = line.get("req") or {}
        print(f"api error: {client or 'unplaced'} {req.get('method', '-')} {req.get('url', '-')} {status or '-'} {line.get('msg', '')}")
        found += 1
    print(f"mark: {len(lines)}@{identity}")
    return 1 if found else 0

def shipped_since(base):
    """The staged tasks this change ships: shipped now, and not shipped in the tickets at `base`. A
    task shipped by an earlier change is never one of them, so its old stamp stands on nothing here."""
    before = set()
    for f in git("ls-tree", "--name-only", base, "docs/tasks/").stdout.split():
        for part in re.split(r"\n#{2,3} ", git("show", f"{base}:{f}").stdout)[1:]:
            m = re.match(r"(T-[A-Z0-9]+-\d{3})", part)
            if m and SHIPPED.search(part):
                before.add(m[1])
    return [b for b in task_blocks(".", True) if b["id"] not in before and SHIPPED.search(b["body"])]

def cmd_stamped(branch, digest, records, now, harness, base):
    task = task_of(branch)
    block = block_of(task, True) if task else None
    if not block:
        print(f"no stamp: {branch or 'this HEAD'} names no task with a single staged ticket")
        return 1
    # One pull request may ship more than one task (another task's PR merged into this branch): the
    # stamp stands in the section of whichever task it verified, the branch's own or one shipped here.
    others = [b for b in shipped_since(base) if b["id"] != task]
    found = [(b, l) for b in [block, *others] for l in b["body"].split("\n")
             if re.match(rf"^\*\*Verified:\*\* digest {digest}\b", l)]
    if not found:
        shipped = ", ".join(b["id"] for b in others)
        print(f"no stamp: {task}'s own section carries no `**Verified:** digest {digest}` line"
              + (f", nor does the section of a task this change ships ({shipped})" if shipped else ""))
        return 1
    stamped, stamp = found[0][0]["id"], found[0][1]
    if records != "--records" or stamped != task:
        # A task shipped here by its own merged pull request had its record held by that PR's own
        # commit, and its record is deleted once that PR merged (M141): the digest is what holds it now.
        print(f"stamped: digest {digest} in {stamped}")
        return 0
    import io, contextlib
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        code = cmd_verdicts(task, os.path.join(harness, task, "qa"), True, now, quiet=True)
    report = out.getvalue()
    counts = next((l[len("counts: "):] for l in report.splitlines() if l.startswith("counts: ")), "")
    if code:
        print(f"the QA record of {task} is refused:\n{report}", end="")
        return 1
    if f" · {counts}" not in stamp:
        print(f"the stamp's counts are not the record's — copy this text into it: {counts}")
        return 1
    print(f"stamped: digest {digest} in {task}, {counts}")
    return 0

if mode == "surfaces":
    cmd_surfaces([a for a in args if a])
elif mode == "api-errors":
    sys.exit(cmd_api_errors(*args))
elif mode == "tier":
    cmd_tier(args[0])
elif mode == "verdicts":
    sys.exit(cmd_verdicts(args[0], args[1], args[2] == "1", args[3]))
elif mode == "stamped":
    sys.exit(cmd_stamped(*args))
