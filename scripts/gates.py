#!/usr/bin/env python3
"""HelioGrid V2 — mechanical gates.

Zero-trust verification of the PRD / briefs / tasks suite. Ground truth is derived
from the live PRD every run, never from a cached snapshot, so a gate cannot pass by
agreeing with a stale baseline.

Run:  python3 scripts/gates.py [--repo <path>] [-v]   # defaults to this script's own repo
Exit: 0 the bookkeeping holds, 1 otherwise. It checks ids, files, counts and the ledger — never quality.
"""

import argparse
import glob
import hashlib
import os
import re
import subprocess
import sys
from collections import defaultdict

# The repo is this script's parent's parent, never a hard-coded path: a hard-coded one keeps
# reading, and passing against, an old copy of the spec after it moves.
REPO_DEFAULT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# The spec tree (prd · ux · tasks · start-here) lives under docs/. Every path
# below goes through this one helper, so a future move is one edit rather than twenty-two.
SPEC_DIR = "docs"


def spec(repo, *parts):
    return os.path.join(repo, SPEC_DIR, *parts)


# A requirement row id: F4-04, M09-52, MS12-19, BM-21, OV-39, PS-24 — and MS7-24b, the one
# letter-suffixed row in the suite. It is a distinct P0 row sitting beside MS7-24, and a
# pattern that stops at the digits silently drops it and undercounts the whole register by one.
ROW_ID = r"[A-Z]{1,3}[0-9]{0,2}[A-Z]*-\d{2,3}[a-z]?"
ROW_RE = re.compile(r"\b(" + ROW_ID + r")\b")
# Ids that live inside a longer identifier are not row citations.
TASK_ID_RE = re.compile(r"\bT-([A-Z0-9]+)-(\d{3})\b")
SCREEN_ID_RE = re.compile(r"\bSCR-([A-Z0-9]+)-(\d{2})\b")

results = []


def gate(num, name, ok, detail=""):
    results.append((num, name, ok, detail))


def scanned(num, name, corpus, floor, ok, detail, empty=""):
    """A gate over a corpus, which must REFUSE an empty one.

    A check with nothing to look at reports a pass it never earned: the tree moves, the glob
    stops matching, and the gate goes quietly green for ever. Gate 1 has carried a floor from the
    start; every other corpus gate now carries one too, so a miscounted corpus fails loudly
    instead of passing silently.
    """
    if corpus < floor:
        gate(num, name, False, empty or f"CORPUS ROT: {corpus} found, expected at least {floor}")
        return
    gate(num, name, ok, detail)


# --------------------------------------------------------------------------- inputs

def prd_files(repo):
    out = []
    for f in glob.glob(spec(repo, "prd/**/*.md"), recursive=True):
        rel = os.path.relpath(f, spec(repo))
        if rel.startswith("prd/registers"):
            continue
        out.append(f)
    return sorted(out)


def live_rows(repo):
    """id -> (file, cell text). The live PRD is the only source of truth."""
    rows = {}
    for f in prd_files(repo):
        rel = os.path.relpath(f, spec(repo))
        for line in open(f, encoding="utf-8"):
            m = re.match(r"\|\s*`?(" + ROW_ID + r")`?\s*\|(.*)", line)
            if m:
                rows.setdefault(m.group(1), (rel, m.group(2).split("|")[0].strip()))
    return rows


def task_blocks(repo):
    """list of dicts: file, id, title, body."""
    blocks = []
    for f in sorted(glob.glob(spec(repo, "tasks/*.md"))):
        rel = os.path.relpath(f, spec(repo))
        if rel.endswith("README.md"):
            continue
        txt = open(f, encoding="utf-8").read()
        # Split on EVERY level-2/3 heading, keep only task headings: a block ends where the next
        # heading starts, so a trailing "## Laws" section is never read as the last task's body.
        for part in re.split(r"\n#{2,3} ", txt)[1:]:
            head = part.split("\n")[0].strip()
            if not head.startswith("T-"):
                continue
            tid = head.split("·")[0].strip().strip("`")
            blocks.append({"file": rel, "id": tid, "title": head, "body": part})
    return blocks


def build_order_blocks(path):
    """The block each task FILE sits in, each task placed apart from its file, and each block's title,
    read from the block table of docs/build-order.md — the ONE place the blocks are written;
    scripts/next-screen.py reads them here too. A cell `SHELL` → `T-SHELL-006` places that one task
    and never the whole file; `MS-studio-a/-b/-c` names three files."""
    by_file, by_task, titles = {}, {}, {}
    for line in open(path, encoding="utf-8"):
        row = re.match(r"\|\s*\*\*(\d+)\*\*\s*\|([^|]*)\|", line)
        if not row:
            continue
        block = int(row.group(1))
        titles[block] = row.group(2).strip().strip("*").strip()
        placed_apart = set(re.findall(r"`([^`]+)`\s*→\s*`T-", line))
        for token in re.findall(r"`([^`]+)`", line):
            if token.startswith("T-"):
                by_task[token] = block
            elif token not in placed_apart:
                first, *suffixes = token.split("/")
                stem = first[: first.rfind("-")]
                for name in [first] + [stem + suffix for suffix in suffixes]:
                    by_file[name] = block
    return by_file, by_task, titles


def recorded_cross_block(path):
    """Every (task, what it waits on) the plan RECORDS as a V1 task waiting on a later block."""
    pairs = set()
    for line in open(path, encoding="utf-8"):
        row = re.match(r"\|\s*`(T-[A-Z0-9]+-\d+)`\s*\|\s*\d+\s*\|\s*`(T-[A-Z0-9]+-\d+)`", line)
        if row:
            pairs.add((row.group(1), row.group(2)))
    return pairs


def dependency_loops(tasks, depends_on):
    """Every loop among `tasks`, each as the ids it passes through. An edge to a task outside
    `tasks` — shipped, struck — is already satisfied and cannot close a loop."""
    loops, state, path = [], {}, []

    def visit(task):
        state[task] = "open"
        path.append(task)
        for waits_on in depends_on.get(task, []):
            if waits_on not in tasks:
                continue
            if state.get(waits_on) == "open":
                loops.append(path[path.index(waits_on):] + [waits_on])
            elif waits_on not in state:
                visit(waits_on)
        path.pop()
        state[task] = "done"

    for task in sorted(tasks):
        if task not in state:
            visit(task)
    return loops


def brief_digest(path):
    """The first 12 hex of a brief's sha256: what a design review names, so a brief that changes
    after its design was reviewed is told apart from one that did not."""
    with open(path, "rb") as brief:
        return hashlib.sha256(brief.read()).hexdigest()[:12]


def screen_index(path):
    """Every row of the register's screen index (section 2), read by COLUMN NAME, so a column added
    at the end changes no reader. A row too short for its header is kept, marked short."""
    rows, cols, in_index = [], None, False
    for line in open(path, encoding="utf-8"):
        if line.startswith("## "):
            in_index = line.startswith("## 2.")
            continue
        if not in_index:
            continue
        if line.startswith("| SCR | Screen |"):
            cols = {name.strip(): i for i, name in enumerate(line.strip().strip("|").split("|"))}
            continue
        if not cols or not re.match(r"^\|\s*SCR-[A-Z0-9]+-\d{2}\s*\|", line):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        row = {name: (cells[i] if i < len(cells) else None) for name, i in cols.items()}
        row["short"] = len(cells) <= max(cols.values())
        rows.append(row)
    return rows


def strip_amendment(text):
    """Brief amendment footnotes legitimately name deleted rows — that is the record
    of the removal. Everything above the first footnote is live content."""
    lines = text.split("\n")
    for i, ln in enumerate(lines):
        if ln.startswith("*Amended ") or ln.startswith("*Note (pre-flight"):
            return "\n".join(lines[:i]), "\n".join(lines[i:])
    return text, ""


# A dated removal record is the *record* of a deletion, not residue. It may — must,
# really — name the id it retired. Same principle as a brief's amendment footnote.
REMOVAL_RECORD = re.compile(
    r"\b(removed|deleted|struck|retired|swept|superseded|rehomed|repointed|re-pulled)\b.{0,120}\b20\d\d-\d\d-\d\d"
    r"|\b20\d\d-\d\d-\d\d\b.{0,200}\b(removed|deleted|struck|retired|swept|superseded|rehomed|repointed|re-pulled|no longer exists)\b"
    r"|previously (read|carried|listed|said|pointed)\b"
    r"|\bthis (row|line|item|criterion|state) (was|is) (now )?(removed|deleted|struck)\b", re.I)



def record_lines(text):
    """Line numbers (1-indexed) belonging to a dated removal record.

    Scoped to the paragraph, not the line: a record often runs several sentences — it names
    the row it retired, says where the surviving law went, and why. The date may sit in any
    of them. Judging line by line splits one record into a record and a violation.
    """
    marked = set()
    lineno = 1
    for para in re.split(r"\n\s*\n", text):
        n = para.count("\n") + 1
        # Flatten the paragraph before matching: `.` does not cross a newline, so a record whose
        # date sits on one wrapped line and whose verb sits on the next would otherwise read as
        # two unrelated fragments and the citation would be reported as dangling.
        if REMOVAL_RECORD.search(" ".join(para.split())):
            marked.update(range(lineno, lineno + n))
        lineno += n + 1
    return marked


def cited_rows(text, known_prefixes):
    """Row ids cited in text, excluding task-id and screen-id fragments."""
    masked = TASK_ID_RE.sub("  ", SCREEN_ID_RE.sub("  ", text))
    out = set()
    for m in ROW_RE.finditer(masked):
        rid = m.group(1)
        pre, num = rid.split("-")
        if pre not in known_prefixes:
            continue
        if len(num) == 3:          # task-id shape, not a row
            continue
        out.add(rid)
    return out


def no_records(_text):
    return set()


def dead_row_citations(repo, files, rows, prefixes, live_text=lambda text: text, records=record_lines,
                       skip_line=lambda line: False):
    """`row id -> [file:line]` for every citation of a row the live PRD no longer carries. `records`
    names the lines a dated removal record exempts — the record of a deletion, not residue — and is
    `no_records` for a brief, whose one legitimate mention is its amendment footnote, which
    `live_text` cuts; `skip_line` drops a line that may name a retired id (a struck register row)."""
    dangling = defaultdict(list)
    for f in files:
        rel = os.path.relpath(f, spec(repo))
        body = live_text(open(f, encoding="utf-8").read())
        exempt = records(body)
        for i, line in enumerate(body.split("\n"), 1):
            if i in exempt or skip_line(line):
                continue
            for rid in cited_rows(line, prefixes):
                if rid not in rows:
                    dangling[rid].append(f"{rel}:{i}")
    return dangling


def norm(s):
    s = re.sub(r"`|\*\*|\*|_", "", s)
    return re.sub(r"\s+", " ", s).strip()


def run(repo, verbose):
    rows = live_rows(repo)
    prefixes = {r.split("-")[0] for r in rows}
    blocks = task_blocks(repo)
    briefs = sorted(glob.glob(spec(repo, "ux/briefs/SCR-*.md")))

    # --- Gate 1 · ground truth is non-empty and plausible
    gate(1, "live PRD rows extracted", len(rows) > 1000, f"{len(rows)} rows across {len(prd_files(repo))} documents")

    # --- Gate 2 · no live text cites a row the PRD no longer carries
    # docs/tasks/, the briefs above their amendment footnotes (a brief carries no other record of a
    # removal), the PRD's own cross-references, and the registers, where a struck (~~) row names the
    # id it retired.
    task_files = sorted(glob.glob(spec(repo, "tasks/*.md")))
    reg_files = sorted(glob.glob(spec(repo, "prd/registers/*.md")))
    dangling = defaultdict(list)
    for found in (dead_row_citations(repo, task_files, rows, prefixes),
                  dead_row_citations(repo, briefs, rows, prefixes, live_text=lambda text: strip_amendment(text)[0], records=no_records),
                  dead_row_citations(repo, prd_files(repo), rows, prefixes),
                  dead_row_citations(repo, reg_files, rows, prefixes, skip_line=lambda line: "~~" in line)):
        for rid, where in found.items():
            dangling[rid] += where
    n = sum(len(v) for v in dangling.values())
    gate(2, "no task, brief, PRD document or register cites a deleted row", not dangling,
         "clean" if not dangling else f"{len(dangling)} ids, {n} refs: " +
         "; ".join(f"{k} {v[:2]}" for k, v in sorted(dangling.items())[:6]))

    # --- Gate 4 · verbatim quote fidelity in docs/tasks/ AND docs/ux/briefs/
    # Briefs quote PRD cells in exactly the same form tasks do, and are what the design run
    # builds from — so an unchecked brief is a screen designed from a stale requirement. Briefs
    # outside this gate would desync on the next PRD edit
    # with nothing to catch it.
    desync = []
    checked = 0
    for f in sorted(glob.glob(spec(repo, "tasks/*.md"))) + briefs:
        rel = os.path.relpath(f, spec(repo))
        for i, line in enumerate(open(f, encoding="utf-8"), 1):
            m = re.match(r"\s*-\s*\*\*`?(" + ROW_ID + r")`?\*\*\s*\([^)]*\)\s*—\s*(.+)", line)
            if not m:
                continue
            rid, quote = m.group(1), m.group(2)
            if rid not in rows:
                continue          # Gate 2 owns that failure
            checked += 1
            a, b = norm(quote), norm(rows[rid][1])
            # Equal, a deliberate truncation of the cell, or the cell plus a suffix ("— Enforced
            # by: …", "(non-UI half …)"). Anything else is drift, however small.
            if a == b or b.startswith(a) or a.startswith(b):
                continue
            desync.append(f"{rel}:{i} {rid}")
    gate(4, "each quote equals its PRD cell, or is a cut or an extension of it (a cut is NOT checked for what it drops)", not desync,
         f"{checked} quotes checked, all match" if not desync else f"{len(desync)} desynced: " + "; ".join(desync[:8]))

    # --- Gate 5 · every task id referenced is defined
    defined = {b["id"] for b in blocks}
    refs = defaultdict(list)
    for f in sorted(glob.glob(spec(repo, "tasks/*.md"))) + briefs:
        rel = os.path.relpath(f, spec(repo))
        for i, line in enumerate(open(f, encoding="utf-8"), 1):
            for m in TASK_ID_RE.finditer(line):
                tid = m.group(0)
                if tid not in defined:
                    refs[tid].append(f"{rel}:{i}")
    scanned(5, "no dangling task id", len(defined), 300, not refs,
            f"{len(defined)} tasks defined" if not refs
            else f"{len(refs)} dangling: " + ", ".join(sorted(refs)[:10]))

    # --- Gate 6 · register screens vs brief files vs DESIGN tasks
    reg = spec(repo, "prd/registers/screens.md")
    reg_screens = []
    if os.path.exists(reg):
        for line in open(reg, encoding="utf-8"):
            m = re.match(r"\|\s*(SCR-[A-Z0-9]+-\d{2})\s*\|", line)
            if m:
                reg_screens.append(m.group(1))
    reg_set = set(reg_screens)
    brief_set = {re.match(r"(SCR-[A-Z0-9]+-\d{2})", os.path.basename(f)).group(1) for f in briefs}
    missing_brief = sorted(reg_set - brief_set)
    orphan_brief = sorted(brief_set - reg_set)
    scanned(6, "every register screen has a brief file", len(reg_set), 100,
            not missing_brief and not orphan_brief,
            f"{len(reg_set)} screens, {len(brief_set)} briefs, matched"
         if not missing_brief and not orphan_brief
         else f"missing briefs: {missing_brief} · orphan briefs: {orphan_brief}")

    # --- Gate 7 · every register screen has a DESIGN task
    design = set()
    for b in blocks:
        for m in re.finditer(r"DESIGN:\**\s*(SCR-[A-Z0-9]+-\d{2})", b["body"]):
            design.add(m.group(1))
    no_task = sorted(reg_set - design)
    ghost = sorted(design - reg_set)
    gate(7, "every register screen has a DESIGN task", not no_task and not ghost,
         f"{len(design)}/{len(reg_set)} screens carry a DESIGN task"
         if not no_task and not ghost
         else f"no task: {no_task[:10]} · task points at unknown screen: {ghost[:10]}")

    # --- Gate 27 · the ledger agrees: a task's Status, its DESIGN links, its screens and main
    # Status is the one ledger (docs/tasks/README.md rule 0). Three states, each checkable:
    # planned while a DESIGN link is PENDING; designed once every link is filled; shipped (#PR)
    # only when the checked-out history names the task — the CHANGE commit's own subject, which is
    # where the flip rides (README rule 0), or main after the merge. screens.md carries the same state
    # per screen. Both ticket shapes: `**Status:** x` in a prose block, `Status: x` in a fenced ticket.
    # A fourth state, `struck`, for a task whose rows moved elsewhere: its stub stays in place so its
    # id is never reused, and it must not read as open work — seven stubs once said `planned`, which
    # made every count of the remaining work too high. The heading and the status must agree.
    status_re = re.compile(r"^\**Status:\**\s*(planned|designed|shipped \(#\d+\)|struck)\s*$", re.M)
    design_re = re.compile(r"DESIGN:\**\s*(SCR-[A-Z0-9]+-\d{2})\s*→\s*(\S+)")
    main_ref = "HEAD"
    main_log = subprocess.run(["git", "log", main_ref, "--format=%s"], cwd=repo, capture_output=True, text=True).stdout
    screen_state = {}
    if os.path.exists(reg):
        for line in open(reg, encoding="utf-8"):
            m = re.match(r"\|\s*(SCR-[A-Z0-9]+-\d{2})\s*\|(?:[^|]*\|){5}\s*(\w+)\s*\|\s*([^|]*)\|", line)
            if m:
                screen_state[m.group(1)] = (m.group(2).strip().lower(), m.group(3).strip())
    ledger_bad, tally = [], defaultdict(int)
    for b in blocks:
        found = status_re.findall(b["body"])
        if len(found) != 1:
            ledger_bad.append(f"{b['id']}: {'no' if not found else 'more than one'} Status line")
            continue
        state = found[0].split(" ")[0]
        tally[state] += 1
        if (state == "struck") != bool(re.search(r"·\s*STRUCK\b", b["title"])):
            ledger_bad.append(f"{b['id']}: the heading and the Status disagree about whether it is struck")
        designs = design_re.findall(b["body"])
        pending = [sid for sid, link in designs if link.upper() == "PENDING"]
        if state == "planned" and designs and not pending:
            ledger_bad.append(f"{b['id']}: every DESIGN link is filled, so it is designed, not planned")
        if state in ("designed", "shipped") and pending:
            ledger_bad.append(f"{b['id']}: {state} with a PENDING design: {pending[:3]}")
        if state == "designed" and not designs:
            ledger_bad.append(f"{b['id']}: designed but carries no DESIGN line")
        if state == "shipped" and not re.search(r"\b" + re.escape(b["id"]) + r"\b", main_log):
            ledger_bad.append(f"{b['id']}: shipped, but {main_ref}'s history never names it")
        for sid, _link in designs:
            if sid not in screen_state:
                continue
            s_state, s_link = screen_state[sid]
            if s_state != state:
                ledger_bad.append(f"{sid} is {s_state} in screens.md while {b['id']} is {state}")
            if s_state in ("designed", "shipped") and not s_link.startswith("http"):
                ledger_bad.append(f"{sid} is {s_state} in screens.md but carries no design link")
            if s_state == "planned" and s_link.startswith("http"):
                ledger_bad.append(f"{sid} is planned in screens.md but carries a design link")
    # A task block can VANISH — a clobbered conflict resolution, a squash over a stale base — and
    # every check above is keyed on the block EXISTING, so they all fall silent together: no Status
    # to read, no id to dangle, nothing to disagree with screens.md. The HISTORY is the one witness
    # that survives. A commit subject that named a task is proof that task had a block, so every id
    # the subjects name must still have one. A struck task keeps its stub (README rule 0), so this
    # asks only that the block exists, never what it says.
    # And an id can be taken TWICE — two sessions reaching for the same next number — which reads
    # as one task to every set and dict here, this check included. An id is the ledger's key
    # (README rule 0: never reused), so a second block under one id is two tasks the tree cannot
    # tell apart.
    seen_ids = defaultdict(int)
    for b in blocks:
        seen_ids[b["id"]] += 1
    for tid, n in sorted(seen_ids.items()):
        if n > 1:
            ledger_bad.append(f"{tid}: {n} task blocks share this id — an id is never reused (rule 0)")

    block_ids = set(seen_ids)
    named_by_history = sorted(set(re.findall(r"\bT-[A-Z0-9]+-\d+\b", main_log)))
    for tid in named_by_history:
        if tid not in block_ids:
            ledger_bad.append(
                f"{tid}: named by {main_ref}'s history, so it HAD a block — and no task file holds "
                "one now; restore it from the commit that named it")

    gate(27, "the ledger agrees: Status, DESIGN links, screens.md, main, and nothing vanished", not ledger_bad,
         f"{tally['planned']} planned · {tally['designed']} designed · {tally['shipped']} shipped · {tally['struck']} struck, "
         f"all consistent · {len(named_by_history)} ids named by history, every one still held"
         if not ledger_bad else f"{len(ledger_bad)}: " + " · ".join(ledger_bad[:6]))

    # --- Gate 15 · every PRD row dispositioned exactly once, and marked state agrees
    # Three states have to line up, or the register is quietly lying about coverage:
    #   PRD carries the row (live)      -> register carries a plain disposition
    #   PRD struck it, or deleted it    -> register carries a STRUCK disposition (the audit trail)
    #   register disposition, no PRD row-> dangling, unless the disposition is struck
    reg = spec(repo, "prd/registers/screens.md")
    prd_struck = {rid for rid, (_f, cell) in rows.items() if cell.lstrip("*").upper().startswith("STRUCK")}
    prd_live = set(rows) - prd_struck
    d_live, d_struck = defaultdict(int), defaultdict(int)
    if os.path.exists(reg):
        in3 = False
        for line in open(reg, encoding="utf-8"):
            if line.startswith("## 3."):
                in3 = True
                continue
            if line.startswith("## 4."):
                in3 = False
            if not in3:
                continue
            m = re.match(r"\|\s*(~~)?`?(" + ROW_ID + r")`?(~~)?\s*\|", line)
            if m:
                (d_struck if m.group(1) else d_live)[m.group(2)] += 1
    seen = set(d_live) | set(d_struck)
    missing = sorted(prd_live - seen)
    # .get, not [] — reading a defaultdict by subscript inserts the key, which would make every
    # id look struck a few lines below.
    twice = sorted(k for k in seen if d_live.get(k, 0) + d_struck.get(k, 0) > 1)
    dangling = sorted(set(d_live) - set(rows))          # plain disposition, no PRD row at all
    wrongly_struck = sorted(set(d_struck) & prd_live)   # struck here, but the PRD still carries it
    unmarked = sorted(prd_struck - set(d_struck))       # PRD struck it, register still shows it plain
    ok15 = not (missing or twice or dangling or wrongly_struck or unmarked)
    gate(15, "every PRD row dispositioned exactly once", ok15,
         f"{len(seen)} dispositions over {len(rows)} rows ({len(d_struck)} struck), each exactly once"
         if ok15 else
         f"no disposition {len(missing)} {missing[:5]} · twice {len(twice)} {twice[:4]} · "
         f"dangling {len(dangling)} {dangling[:5]} · struck-but-live {len(wrongly_struck)} {wrongly_struck[:4]} · "
         f"struck-in-PRD-not-in-register {len(unmarked)} {unmarked[:4]}")

    # --- Gate 17 · the V1 scope lock is intact
    # V1/V2 is a release axis, orthogonal to P0/P1/P2. Every screen carries exactly one, the two
    # sides sum to the register's screen count, and the locked V1 total does not drift silently.
    V1_EXPECTED = 99
    reg = spec(repo, "prd/registers/screens.md")
    v1, v2, novee = [], [], []
    if os.path.exists(reg):
        in2 = False
        for line in open(reg, encoding="utf-8"):
            if line.startswith("## 2."):
                in2 = True
                continue
            if line.startswith("## 3."):
                in2 = False
            if not in2:
                continue
            m = re.match(r"\|\s*(SCR-[A-Z0-9]+-\d{2})\s*\|(.*)", line)
            if not m:
                continue
            cells = [c.strip() for c in m.group(2).split("|")]
            if "V1" in cells:
                v1.append(m.group(1))
            elif "V2" in cells:
                v2.append(m.group(1))
            else:
                novee.append(m.group(1))
    total = len(v1) + len(v2) + len(novee)
    problems = []
    if novee:
        problems.append(f"{len(novee)} screens carry no V marking: {novee[:6]}")
    if total != len(reg_set):
        problems.append(f"V-marked {total} != {len(reg_set)} screens in the index")
    if len(v1) != V1_EXPECTED:
        problems.append(f"V1 is {len(v1)}, locked at {V1_EXPECTED} — if the lock moved, move it here too")
    gate(17, "V1 scope lock intact", not problems,
         f"V1 {len(v1)} · V2 {len(v2)} · {total} screens, every one marked"
         if not problems else " · ".join(problems))

    # --- Gate 18 · the helper script agrees with the register
    # next-screen.py told an operator "150 of 150 designed · nothing left to do" for a day,
    # because the V column shifted the cell it read as status. A helper that lies confidently
    # is worse than no helper, and no other gate could see it — so this one runs it.
    helper = os.path.join(repo, "scripts", "next-screen.py")
    if not os.path.exists(helper):
        gate(18, "helper script agrees with the register", False,
             f"{os.path.relpath(helper, repo)} not found — the gate cannot run, so it does not pass")
    else:
        try:
            proc = subprocess.run([sys.executable, helper], capture_output=True, text=True, timeout=60, cwd=repo)
            out = proc.stdout
            m = re.search(r"(\d+) of (\d+) V1 screens designed · (\d+) to go", out)
            v1_pending = len([1 for line in open(reg, encoding="utf-8")
                              if re.match(r"^\|\s*SCR-[A-Z0-9]+-\d{2}\s*\|", line)
                              and re.search(r"\|\s*V1\s*\|\s*planned\s*\|", line)])
            v1_total = len([1 for line in open(reg, encoding="utf-8")
                            if re.match(r"^\|\s*SCR-[A-Z0-9]+-\d{2}\s*\|", line)
                            and re.search(r"\|\s*V1\s*\|", line)])
            if proc.returncode != 0:
                gate(18, "helper script agrees with the register", False,
                     f"next-screen.py exited {proc.returncode}: {(proc.stderr or out).strip()[:160]}")
            elif not m:
                gate(18, "helper script agrees with the register", False,
                     "could not parse a progress line from next-screen.py — its output format changed")
            else:
                got_total, got_togo = int(m.group(2)), int(m.group(3))
                bad = []
                if got_total != v1_total:
                    bad.append(f"script says {got_total} V1 screens, register has {v1_total}")
                if got_togo != v1_pending:
                    bad.append(f"script says {got_togo} to go, register has {v1_pending} V1 planned")
                gate(18, "helper script agrees with the register", not bad,
                     f"next-screen.py: {got_togo} of {got_total} to go, matches the register"
                     if not bad else " · ".join(bad))
        except Exception as e:
            gate(18, "helper script agrees with the register", False, f"next-screen.py raised: {e}")

    # --- Gate 31 · a design names the brief it was reviewed against
    # A screen is designed against its brief, and the brief goes on changing after — a ruling folded
    # in, a requirement re-pulled — while the design stays as drawn. Designs showed behaviour their
    # briefs had since changed while every gate passed, because none compared the two. So the
    # register's `Brief reviewed` cell names the digest of the brief a designed or shipped screen's
    # design was last reviewed against, and a brief that changes after it is refused here until the
    # design is reviewed again. A design found stale reads `owed`: it stays out of the build order
    # and goes first in the design queue. A SHIPPED screen also names its code's verdict — `code ok`,
    # or `code owed` and the task that changes it — because a design that moves after a screen is
    # built leaves that code to be checked, not assumed.
    review_cell = re.compile(r"^(owed )?([0-9a-f]{12})(?: · code (ok|owed (T-[A-Z0-9]+-\d+)))?$")
    index_rows = screen_index(reg) if os.path.exists(reg) else []
    task_ids = {b["id"] for b in blocks}
    review_bad, owed_screens, n_reviewed = [], [], 0
    if index_rows and "Brief reviewed" not in index_rows[0]:
        review_bad.append("CONFIG ROT: the register's screen index has no `Brief reviewed` column")
    for row in index_rows:
        sid, status = row.get("SCR"), (row.get("Status") or "").lower()
        cell = row.get("Brief reviewed")
        if row["short"] or cell is None:
            review_bad.append(f"{sid}: its row is shorter than the index header")
            continue
        if status == "planned":
            if cell != "—":
                review_bad.append(f"{sid} is not designed, so it names no reviewed brief (reads `{cell}`)")
            continue
        brief = os.path.join(repo, (row.get("Brief") or "").strip("`"))
        if not os.path.isfile(brief):
            review_bad.append(f"{sid}: its brief `{row.get('Brief')}` does not exist")
            continue
        now = brief_digest(brief)
        m = review_cell.match(cell)
        if not m:
            review_bad.append(f"{sid} is {status} and records no review of its brief — review the design "
                              f"against it and record `{now}`" + (" · code ok" if status == "shipped" else ""))
            continue
        n_reviewed += 1
        owed, recorded, code, follow_up = m.group(1), m.group(2), m.group(3), m.group(4)
        if recorded != now:
            review_bad.append(f"{sid}'s brief changed since its design was reviewed ({recorded} → {now}) — "
                              "review the design" + (" AND the built code" if status == "shipped" else "") +
                              f", then record `{now}`, or `owed {now}` if the design no longer matches")
        if status == "designed" and code:
            review_bad.append(f"{sid} is not built yet, so it carries no code verdict")
        if status == "shipped" and not code:
            review_bad.append(f"{sid} is built: its cell names the code's verdict too — `code ok` or `code owed T-…`")
        if follow_up and follow_up not in task_ids:
            review_bad.append(f"{sid}'s code is owed to {follow_up}, which is no task")
        if owed:
            owed_screens.append(sid)
    design_summary = (f"design review: {n_reviewed} designs reviewed against their briefs · "
                      + (f"{len(owed_screens)} redesigns owed, first in the design queue: {', '.join(owed_screens)}"
                         if owed_screens else "none owed"))
    scanned(31, "every designed screen carries its brief's current digest (tripwire: the review itself is not checked)",
            len(index_rows), 100, not review_bad,
            design_summary if not review_bad
            else f"{len(review_bad)}: " + " · ".join(review_bad[:6]))

    # --- Gate 30 · the build order is computed, never remembered
    # docs/build-order.md is the order. Its block table places every task file, and a task is READY
    # when it is live, V1, sits in the LOWEST block that still has live V1 work, waits on nothing
    # unshipped, and — for a screen — is designed. Everywhere else the order lives only in each
    # ticket's `Depends on:` line, and five shapes break it without failing any other gate: a LOOP,
    # where no task in it can go first; a live task waiting on a STRUCK one, which waits forever; a
    # V1 task waiting on a V2 one, which never finishes in V1; a V1 task waiting on a LATER block,
    # which stalls its own block unless the plan records it; and a task file no block places that
    # cannot prove itself wholly V2 by its screens, which is a module nobody is ever told to build.
    order_doc = spec(repo, "build-order.md")
    by_file, by_task, _titles = build_order_blocks(order_doc) if os.path.exists(order_doc) else ({}, {}, {})
    v2_screens = set(v2)
    state_of, waits_on, kind_of, tier_of, file_of, screens_of = {}, {}, {}, {}, {}, {}
    # A ticket with no `Depends on:` line has not been through /start yet, and reads as waiting on
    # nothing. That is silence, not readiness: the order line counts them so it never claims more
    # than it read. The BLOCK order does not rest on these lines — it comes from each task's file.
    undeclared = set()
    # A ticket the owner parked carries a `**Parked:**` line: it keeps its block and its rows, but it
    # is never "ready now" — offering it would send /start to a task the owner already said waits.
    parked = set()
    design_of = {}
    for b in blocks:
        task, body = b["id"], b["body"]
        found = status_re.findall(body)
        state_of[task] = found[0].split(" ")[0] if len(found) == 1 else None
        line = re.search(r"^\**Depends on:\**(.*)$", body, re.M)
        waits_on[task] = [d for d in re.findall(r"T-[A-Z0-9]+-\d+", line.group(1)) if d != task] if line else []
        if not line:
            undeclared.add(task)
        if re.search(r"^\*\*Parked:\*\*", body, re.M):
            parked.add(task)
        kind = re.search(r"^\**Type:\**\s*(\w+)", body, re.M)
        kind_of[task] = kind.group(1) if kind else None
        tier = re.search(r"\**Tier:\**\s*(P\d)", body)
        tier_of[task] = tier.group(1) if tier else "P9"
        file_of[task] = os.path.splitext(os.path.basename(b["file"]))[0]
        screens_of[task] = [sid for sid, _link in design_re.findall(body)]
        shared = re.search(r"^\**Design:\**(.*)$", body, re.M)
        design_of[task] = set(screens_of[task]) | set(re.findall(r"SCR-[A-Z0-9]+-\d{2}", shared.group(1)) if shared else [])

    def block_of(task):
        return by_task.get(task, by_file.get(file_of[task]))

    def is_v2(task):
        return bool(screens_of[task]) and all(sid in v2_screens for sid in screens_of[task])

    live = {t for t, state in state_of.items() if state in ("planned", "designed")}
    v1_live = {t for t in live if not is_v2(t) and block_of(t) is not None}
    order_bad = []
    if not by_file:
        order_bad.append("CONFIG ROT: no block table read from docs/build-order.md")
    for stem in sorted({file_of[t] for t in state_of} - set(by_file)):
        its_screens = [sid for t in state_of if file_of[t] == stem for sid in screens_of[t]]
        if not its_screens:
            order_bad.append(f"{stem}.md sits in no block and has no screen to prove it V2")
        elif any(sid not in v2_screens for sid in its_screens):
            order_bad.append(f"{stem}.md sits in no block but carries a V1 screen")
    for loop in dependency_loops(live, waits_on):
        order_bad.append("loop: " + " → ".join(loop))
    later = set()
    for task in sorted(live):
        for dep in waits_on[task]:
            if state_of.get(dep) == "struck":
                order_bad.append(f"{task} waits on {dep}, which is struck")
            elif task in v1_live and dep in live and dep not in v1_live:
                order_bad.append(f"{task} is V1 and waits on {dep}, which is not")
            elif task in v1_live and dep in v1_live and block_of(dep) > block_of(task):
                later.add((task, dep))
    recorded = recorded_cross_block(order_doc) if os.path.exists(order_doc) else set()
    for task, dep in sorted(later - recorded):
        order_bad.append(f"{task} (block {block_of(task)}) waits on {dep} (block {block_of(dep)}) — "
                         "move it, split it, or record it in the plan")
    for task, dep in sorted(recorded - later):
        order_bad.append(f"the plan records {task} waiting on {dep}, which is no longer true")
    unblocks = defaultdict(set)
    for task in live:
        for dep in waits_on[task]:
            unblocks[dep].add(task)
    current = min((block_of(t) for t in v1_live), default=None)
    # A record only buys time until its block opens: from then the ruling is owed NOW, so the block
    # cannot start with a task in it that can never finish.
    for task, dep in sorted(recorded & later):
        if block_of(task) == current:
            order_bad.append(f"block {current} is open and {task} still waits on {dep} in block "
                             f"{block_of(dep)} — the plan's record owes its ruling now")
    ready = sorted(
        (t for t in v1_live
         if block_of(t) == current
         and t not in parked
         and all(state_of.get(dep) == "shipped" for dep in waits_on[t] if dep in state_of)
         and (kind_of[t] != "screen" or state_of[t] == "designed")
         # a design owed a redesign is not built from: the build would bake in what the brief retired
         and not design_of[t] & set(owed_screens)),
        key=lambda t: (tier_of[t], -len(unblocks[t]), t))
    shown = [f"{t} (unblocks {len(unblocks[t])})" if unblocks[t] else t for t in ready[:6]]
    order_summary = (
        f"build order: block {current} · {sum(1 for t in v1_live if block_of(t) == current)} open · "
        f"{len(recorded)} recorded cross-block · {sum(1 for t in v1_live if t in parked)} parked · ready now: "
        + (", ".join(shown) + (f" (+{len(ready) - 6} more)" if len(ready) > 6 else "") if ready
           else "NOTHING — every open task waits on a design or a dependency")
        + (f" · {sum(1 for t in ready if t in undeclared)} of {len(ready)} declare no dependencies yet, "
           "so /start writes that line and confirms before building"
           if any(t in undeclared for t in ready) else "")
        if current is not None else "build order: no live V1 task left")
    gate(30, "the build order holds: no loop, nothing stale, every file placed",
         not order_bad, order_summary if not order_bad
         else f"{len(order_bad)}: " + " · ".join(order_bad[:6]))


    # --------------------------------------------------------------------- report
    results.sort(key=lambda r: r[0])
    width = max(len(n) for _, n, _, _ in results)
    print("=" * (width + 34))
    print("HelioGrid V2 — mechanical gates")
    print("=" * (width + 34))
    for num, name, ok, detail in results:
        print(f"  {num:2d}. {name:<{width}}  {'PASS' if ok else 'FAIL'}")
        if detail and (verbose or not ok):
            print(f"      {detail}")
    failed = [r for r in results if not r[2]]
    print("-" * (width + 34))
    print(f"  rows {len(rows)} · tasks {len(blocks)} · screens {len(reg_set)} · briefs {len(brief_set)}")
    # Printed on every run, pass or fail: the next task is read off the gates, never from memory.
    print(f"  {order_summary}")
    print(f"  {design_summary}")
    print(f"  {'BOOKKEEPING HOLDS — ids, files, counts and the ledger agree. NOT checked here: whether a brief is complete, a design is good, or a record is true' if not failed else str(len(failed)) + ' BOOKKEEPING CHECK(S) FAILED'}")
    return 0 if not failed else 1


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=REPO_DEFAULT)
    ap.add_argument("-v", "--verbose", action="store_true")
    a = ap.parse_args()
    sys.exit(run(a.repo, a.verbose))
