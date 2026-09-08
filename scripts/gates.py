#!/usr/bin/env python3
"""HelioGrid V2 — mechanical gates.

Zero-trust verification of the PRD / briefs / tasks suite. Ground truth is derived
from the live PRD every run, never from a cached snapshot, so a gate cannot pass by
agreeing with a stale baseline.

Run:  python3 scripts/gates.py [--repo <path>] [-v]   # defaults to this script's own repo
Exit: 0 all gates pass, 1 otherwise.
"""

import argparse
import glob
import os
import re
import subprocess
import sys
from collections import defaultdict

# Derived from the script's own location, never a hard-coded absolute path: this file used to
# name /Volumes/works-space/heliogrid_v2_prd, so after the spec moved into this repo it kept
# reading — and passing against — the OLD folder. It only surfaced when that folder was deleted
# and every count dropped to zero. next-screen.py had it right; this matches it.
# Two dirnames, not one: this script lives in scripts/, so the repo is its parent.
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


def is_removal_record(line):
    return bool(REMOVAL_RECORD.search(line))


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


def norm(s):
    s = re.sub(r"`|\*\*|\*|_", "", s)
    return re.sub(r"\s+", " ", s).strip()


# --------------------------------------------------------------------------- gates

# --------------------------------------------------------- instruction hygiene

# The instruction corpus regrows in three ways, and each is a shape a grep can see.
# Every one of them was measured in the tree before these gates existed: 55 dated war
# stories, files at five times their budget, and enforcement claims that named a gate
# which could not fire.
#
# `mechanisms.md` is exempt from the DATE check, and only that check: a date there is the
# day a gate was proven to go red on an injected violation, which is the one date that
# stays true. It is not an instruction file and carries no budget.
INSTRUCTION_BUDGETS = [
    ("CLAUDE.md", 215),
    ("apps/*/CLAUDE.md", 85),
    ("packages/*/CLAUDE.md", 85),
    ("tests/*/CLAUDE.md", 85),
    (".claude/rules/*.md", 85),
]
DATE_RE = re.compile(r"\b20\d\d-\d\d-\d\d\b")
# An enforcement phrase is a claim that something is HELD. It is allowed only beside the
# mechanism row that proves it, because a claim with no row is how a rule outlives its gate.
CLAIM_RE = re.compile(
    r"held by|hook-enforced|all enforced|enforced by|is enforced|gate-checked|caught by",
    re.I,
)
MECH_ROW_RE = re.compile(r"\bM\d+\b")
# A tool name in an instruction file is a gate being described where only its row id belongs
# (CLAUDE.md §8, "name no gate outside mechanisms.md"). `coverage threshold` and not the bare
# word: a threshold is GST vocabulary in this product.
TOOL_RE = re.compile(
    r"vitest|biome|dependency-cruiser|\bcruiser\b|PreToolUse|jscpd|sherif|gates\.py"
    r"|check-adherence|coverage thresholds?",
    re.I,
)


def instruction_files(repo):
    """(path, relative path, budget) for every file that states a rule."""
    out = []
    for pattern, budget in INSTRUCTION_BUDGETS:
        for f in sorted(glob.glob(os.path.join(repo, pattern))):
            out.append((f, os.path.relpath(f, repo), budget))
    return out


def check_instruction_hygiene(repo):
    files = instruction_files(repo)
    if not files:
        gate(22, "no dated war story in an instruction file", False,
             "CONFIG ROT: instruction_files() matched nothing")
        return

    dated, over, claims, tools, headroom = [], [], [], [], []
    for path, rel, budget in files:
        lines = open(path, encoding="utf-8").read().split("\n")
        in_frontmatter = lines[:1] == ["---"]
        for i, line in enumerate(lines, 1):
            if in_frontmatter:                      # a rule file's `paths:` block names configs
                in_frontmatter = not (i > 1 and line == "---")
                continue
            if DATE_RE.search(line):
                dated.append(f"{rel}:{i}")
            if CLAIM_RE.search(line) and not MECH_ROW_RE.search(line):
                claims.append(f"{rel}:{i}")
            if TOOL_RE.search(line):
                tools.append(f"{rel}:{i}")
        n = len(lines) - (1 if lines and lines[-1] == "" else 0)
        headroom.append((budget - n, f"{rel} {n}/{budget}"))
        if n > budget:
            over.append(f"{rel} {n} > {budget}")

    # The ledger states traps, never when one was found — same rule, different file.
    ledger = os.path.join(repo, ".claude/landmines.md")
    if os.path.exists(ledger):
        for i, line in enumerate(open(ledger, encoding="utf-8"), 1):
            if DATE_RE.search(line):
                dated.append(f".claude/landmines.md:{i}")

    gate(22, "no dated war story in an instruction file", not dated,
         f"{len(files)} files scanned, none dated" if not dated
         else "a date is a war story — the trap goes to landmines.md, the story to the commit: "
              + ", ".join(dated[:8]) + (f" (+{len(dated) - 8} more)" if len(dated) > 8 else ""))

    # The pass line shows the files nearest their ceiling: a budget is a ceiling, not a target,
    # and the trend is only visible if every run prints it.
    gate(23, "every instruction file within its budget", not over,
         "nearest the ceiling: " + " · ".join(h for _, h in sorted(headroom)[:4])
         if not over else "; ".join(over))

    gate(24, "no enforcement claim without its mechanism row", not claims,
         "no unsourced claim" if not claims
         else "name the row that proves it (mechanisms.md M<n>), or drop the claim: "
              + ", ".join(claims[:8]) + (f" (+{len(claims) - 8} more)" if len(claims) > 8 else ""))

    gate(25, "no tool named in an instruction file", not tools,
         "rules cite row ids only" if not tools
         else "a gate is described only in its mechanisms.md row; leave the row id behind: "
              + ", ".join(tools[:8]) + (f" (+{len(tools) - 8} more)" if len(tools) > 8 else ""))


def run(repo, verbose):
    rows = live_rows(repo)
    prefixes = {r.split("-")[0] for r in rows}
    blocks = task_blocks(repo)
    briefs = sorted(glob.glob(spec(repo, "ux/briefs/SCR-*.md")))

    # --- Gate 1 · ground truth is non-empty and plausible
    gate(1, "live PRD rows extracted", len(rows) > 1000, f"{len(rows)} rows across {len(prd_files(repo))} documents")

    # --- Gate 2 · no dangling row citation in docs/tasks/
    dangling_t = defaultdict(list)
    for f in sorted(glob.glob(spec(repo, "tasks/*.md"))):
        rel = os.path.relpath(f, spec(repo))
        body = open(f, encoding="utf-8").read()
        recs = record_lines(body)
        for i, line in enumerate(body.split("\n"), 1):
            if i in recs:
                continue
            for rid in cited_rows(line, prefixes):
                if rid not in rows:
                    dangling_t[rid].append(f"{rel}:{i}")
    n = sum(len(v) for v in dangling_t.values())
    gate(2, "docs/tasks/ cite no deleted row", not dangling_t,
         "clean" if not dangling_t else f"{len(dangling_t)} ids, {n} refs: " + ", ".join(sorted(dangling_t)[:12]))

    # --- Gate 3 · no dangling row citation in briefs' LIVE content
    dangling_b = defaultdict(list)
    for f in briefs:
        rel = os.path.relpath(f, spec(repo))
        live, _foot = strip_amendment(open(f, encoding="utf-8").read())
        for i, line in enumerate(live.split("\n"), 1):
            for rid in cited_rows(line, prefixes):
                if rid not in rows:
                    dangling_b[rid].append(f"{rel}:{i}")
    n = sum(len(v) for v in dangling_b.values())
    gate(3, "briefs' live content cites no deleted row", not dangling_b,
         "clean (amendment footnotes exempt)" if not dangling_b else f"{len(dangling_b)} ids, {n} refs: " + ", ".join(sorted(dangling_b)[:12]))

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
    gate(4, "task + brief quotes match live PRD cells", not desync,
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
    gate(5, "no dangling task id", not refs,
         f"{len(defined)} tasks defined" if not refs else f"{len(refs)} dangling: " + ", ".join(sorted(refs)[:10]))

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
    gate(6, "every register screen has a brief file", not missing_brief and not orphan_brief,
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

    # --- Gate 8 · deleted screens are not referenced anywhere
    dead_screens = ["SCR-SHELL-04", "SCR-SHELL-05"]
    hits = []
    for f in sorted(glob.glob(spec(repo, "tasks/*.md"))) + briefs:
        rel = os.path.relpath(f, spec(repo))
        live, _ = strip_amendment(open(f, encoding="utf-8").read())
        recs = record_lines(live)
        for i, line in enumerate(live.split("\n"), 1):
            if i in recs:
                continue
            for d in dead_screens:
                if d in line:
                    hits.append(f"{rel}:{i} {d}")
    gate(8, "deleted screens unreferenced", not hits,
         "clean" if not hits else "; ".join(hits[:8]))

    # --- Gate 9 · no half-cleaned task block
    # Every row a block declares on its PRD line must actually be quoted in that block.
    # A block that defers its quoting to the brief is exempt by design (docs/tasks/README.md rule 6).
    incoherent = []
    for b in blocks:
        if "Verbatim rows live in" in b["body"] or "they are the specification" in b["body"]:
            continue
        m = re.search(r"^\**PRD(?: rows)?:?\**\s*:?\s*(.+)$", b["body"], re.M)
        if not m:
            continue
        declared = cited_rows(m.group(1), prefixes)
        quoted = {q.group(1) for q in re.finditer(
            r"^\s*-\s*\*\*`?(" + ROW_ID + r")`?\*\*\s*\(", b["body"], re.M)}
        # A row may also be quoted inline in prose — "The centre's read-state contract is
        # `F6-07`'s — "…" — quoted verbatim and built at T-FPLAT-017". That is a deliberate
        # single-source pattern, not a half-cleaned block.
        for q in re.finditer(r"`(" + ROW_ID + r")`'?s?\b[^\n]{0,40}[—\"“]", b["body"]):
            quoted.add(q.group(1))
        if not quoted:
            continue
        missing = declared - quoted
        if missing:
            incoherent.append(f"{b['file']} {b['id']}: declares but no longer quotes {sorted(missing)}")
    gate(9, "no half-cleaned task block", not incoherent,
         f"{len(blocks)} blocks coherent" if not incoherent else "; ".join(incoherent[:6]))

    # --- Gate 10 · offline machinery is gone from docs/tasks/
    # Deliberately narrow: only phrases that can ONLY mean the deleted sync layer. The studio's
    # own "stale capture" and F1's "pack staleness" are real, live concepts and must not fire.
    banned = re.compile(
        # "online-only" is dropped deliberately: in a product that requires a connection the
        # phrase is redundant, not residue. "online-first" stays banned — it implies a local
        # fallback that no longer exists.
        r"\b(offline[- ]capable|offline[- ]first|online[- ]first"
        r"|durable (?:write )?queue|write queue|queued for upload|upload queue"
        r"|sync (?:centre|center|engine|state|contract|indicator|layer)"
        r"|last[- ]synced|last successful sync|synced cache|local[- ]first"
        r"|cached read|offline (?:state|banner|mode|backlog|set))\b", re.I)
    # A verbatim requirement bullet mirrors the live PRD cell by law; Gate 4 already enforces
    # that fidelity. If the wording is wrong it is the PRD's to fix, not the task's — so this
    # gate reads only task-authored prose.
    is_quote = re.compile(r"^\s*-\s*\*\*`?" + ROW_ID + r"`?\*\*\s*\(")
    voc = []
    for f in sorted(glob.glob(spec(repo, "tasks/*.md"))):
        rel = os.path.relpath(f, spec(repo))
        body = open(f, encoding="utf-8").read()
        recs = record_lines(body)
        for i, line in enumerate(body.split("\n"), 1):
            if i in recs or is_quote.match(line):
                continue
            m = banned.search(line)
            if m:
                voc.append(f"{rel}:{i} [{m.group(0)}]")
    gate(10, "no offline machinery in docs/tasks/", not voc,
         "clean" if not voc else f"{len(voc)} lines: " + " · ".join(voc[:6]))

    # --- Gate 11 · the completion contract says THREE base states, not four
    # N10 was amended by the ruling that removed offline capability: loading, empty, error. A task whose definition of
    # done still demands four states would have an engineer reject a correct screen.
    four = re.compile(r"\b(four|4)\s+(base\s+)?states\b|loading,\s*empty,\s*error,?\s*(and\s+)?offline", re.I)
    # Two live product concepts genuinely have four states and are nothing to do with the
    # base-state contract: a studio step (M05-03) and the Site Intelligence card (M05-18).
    domain_four = re.compile(r"M05-03|M05-18|Site Intelligence|not started\s*/\s*in progress\s*/\s*done", re.I)
    stale = []
    scope = (sorted(glob.glob(spec(repo, "tasks/*.md"))) + briefs +
             [spec(repo, "ux/briefs/README.md"), spec(repo, "start-here.md")])
    for f in scope:
        if not os.path.exists(f):
            continue
        rel = os.path.relpath(f, spec(repo))
        body = open(f, encoding="utf-8").read()
        recs = record_lines(body)
        for i, line in enumerate(body.split("\n"), 1):
            if i in recs or domain_four.search(line):
                continue
            if four.search(line):
                stale.append(f"{rel}:{i}")
    gate(11, "completion contract says three base states", not stale,
         "clean" if not stale else f"{len(stale)} lines still say four: " + ", ".join(stale[:8]))

    # --- Gate 13 · the PRD does not cite its own deleted rows
    # Gates 2 and 3 police what docs/tasks/ and briefs/ point at. Nothing was policing the PRD's
    # internal cross-references, which is how nine citations survived the offline sweep.
    dangling_p = defaultdict(list)
    for f in prd_files(repo):
        rel = os.path.relpath(f, spec(repo))
        body = open(f, encoding="utf-8").read()
        recs = record_lines(body)
        for i, line in enumerate(body.split("\n"), 1):
            if i in recs:
                continue
            for rid in cited_rows(line, prefixes):
                if rid not in rows:
                    dangling_p[rid].append(f"{rel}:{i}")
    n = sum(len(v) for v in dangling_p.values())
    gate(13, "PRD cites no deleted row of its own", not dangling_p,
         "clean" if not dangling_p else f"{len(dangling_p)} ids, {n} refs: " +
         "; ".join(f"{k} {v}" for k, v in sorted(dangling_p.items())[:5]))

    # --- Gate 14 · the registers cite no deleted row
    # screens.md legitimately keeps rows for deleted requirements — that is its audit
    # trail — but a *marked* row says so. A bare citation is a dangling pointer.
    reg_files = sorted(glob.glob(spec(repo, "prd/registers/*.md")))
    dangling_r = defaultdict(list)
    for f in reg_files:
        rel = os.path.relpath(f, spec(repo))
        body = open(f, encoding="utf-8").read()
        recs = record_lines(body)
        for i, line in enumerate(body.split("\n"), 1):
            if i in recs or "~~" in line:      # a struck row names the id it retired
                continue
            for rid in cited_rows(line, prefixes):
                if rid not in rows:
                    dangling_r[rid].append(f"{rel}:{i}")
    n = sum(len(v) for v in dangling_r.values())
    gate(14, "registers cite no deleted row", not dangling_r,
         "clean" if not dangling_r else f"{len(dangling_r)} ids, {n} refs: " +
         "; ".join(f"{k} {v[:2]}" for k, v in sorted(dangling_r.items())[:5]))

    # --- Gate 26 · no open-question id anywhere: a PRD row carries its own ruling, git the history
    q_re = re.compile(r"\bQ\d+\b(?!\s*(?:FY|20\d\d))")   # "Q1 FY26" is a display string, not a citation
    text_ext = (".md", ".ts", ".tsx", ".mts", ".css", ".py", ".sh", ".mjs", ".json", ".jsonc", ".yml", ".yaml")
    tracked = subprocess.run(["git", "ls-files"], cwd=repo, capture_output=True, text=True).stdout.split("\n")
    q_sites = []
    for rel in tracked:
        if not rel.endswith(text_ext) or rel == "pnpm-lock.yaml" or "/_generated/" in rel:
            continue
        try:
            for i, line in enumerate(open(os.path.join(repo, rel), encoding="utf-8"), 1):
                if q_re.search(line):
                    q_sites.append(f"{rel}:{i}")
        except (UnicodeDecodeError, FileNotFoundError):
            continue
    gate(26, "no open-question id anywhere in the tree", not q_sites,
         f"{len(tracked)} tracked files, none cites a Q id" if not q_sites
         else f"{len(q_sites)} sites — state the rule in the row, never the id: " + ", ".join(q_sites[:8])
              + (f" (+{len(q_sites) - 8} more)" if len(q_sites) > 8 else ""))

    # --- Gate 27 · the ledger agrees: a task's Status, its DESIGN links, its screens and main
    # Status is the one ledger (docs/tasks/README.md rule 0). Three states, each checkable:
    # planned while a DESIGN link is PENDING; designed once every link is filled; shipped (#PR)
    # only when main's history names the task. screens.md carries the same state per screen.
    # Both ticket shapes: `**Status:** x` in a prose block, `Status: x` inside a fenced ticket.
    status_re = re.compile(r"^\**Status:\**\s*(planned|designed|shipped \(#\d+\))\s*$", re.M)
    design_re = re.compile(r"DESIGN:\**\s*(SCR-[A-Z0-9]+-\d{2})\s*→\s*(\S+)")
    main_ref = "origin/main"
    if subprocess.run(["git", "rev-parse", "--verify", "-q", main_ref], cwd=repo, capture_output=True).returncode != 0:
        main_ref = "main"
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
    gate(27, "the ledger agrees: Status, DESIGN links, screens.md and main", not ledger_bad,
         f"{tally['planned']} planned · {tally['designed']} designed · {tally['shipped']} shipped, all consistent"
         if not ledger_bad else f"{len(ledger_bad)}: " + " · ".join(ledger_bad[:6]))

    # --- Gate 28 · docs/engineering/ only shrinks
    # Every file there carries its fate at its top; the folder dissolves into the package files
    # and the tasks. The ceiling is the folder's exact line count today: growth fails, and a cut
    # fails too until the ceiling is lowered in the same change — so it can only fall.
    ENGINEERING_LINES = 6425
    eng_files = [f for f in tracked if f.startswith("docs/engineering/")]
    eng_lines = 0
    for rel in eng_files:
        try:
            eng_lines += sum(1 for _ in open(os.path.join(repo, rel), encoding="utf-8"))
        except (UnicodeDecodeError, FileNotFoundError):
            continue
    gate(28, "docs/engineering/ only shrinks", eng_lines == ENGINEERING_LINES,
         f"{eng_lines} lines across {len(eng_files)} files, at the ceiling"
         if eng_lines == ENGINEERING_LINES
         else (f"{eng_lines} lines: the folder GREW past its ceiling of {ENGINEERING_LINES} — fold, do not add"
               if eng_lines > ENGINEERING_LINES
               else f"{eng_lines} lines: below the ceiling of {ENGINEERING_LINES} — lower ENGINEERING_LINES to {eng_lines} in this change"))

    # --- Gate 29 · a ticket is whole: Why, Data model, Contract, Depends on, Out of scope, a proof per line
    # docs/tasks/README.md rule 11. A task opts in the moment it carries a Why line — the shape a
    # task takes at /start before it is built — and from then on every part must be present and
    # every DONE WHEN line must name its proof.
    proof_re = re.compile(r"→\s*proof:\s*(unit|invariant|gate|qa-api|qa-web|qa-mobile|qa-parity)\b")
    ticket_bad, n_tickets = [], 0
    for b in blocks:
        body = b["body"]
        if not re.search(r"^\**Why:\**", body, re.M):
            continue
        n_tickets += 1
        for label in ("Data model", "Contract", "Depends on", "Out of scope"):
            if not re.search(r"^\**" + re.escape(label) + r":\**", body, re.M):
                ticket_bad.append(f"{b['id']}: no {label} line")
        dw = body.find("DONE WHEN")
        if dw < 0:
            ticket_bad.append(f"{b['id']}: no DONE WHEN block")
            continue
        for line in body[dw:].split("\n"):
            if re.match(r"^\s*-\s", line) and not line.strip().startswith("---") and not proof_re.search(line):
                ticket_bad.append(f"{b['id']}: done-when line without a proof: {line.strip()[:60]}…")
    gate(29, "every ticket with a Why is whole, and every done-when line names its proof", not ticket_bad,
         f"{n_tickets} tickets, all whole" if not ticket_bad
         else f"{len(ticket_bad)}: " + " · ".join(ticket_bad[:6]))

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

    # --- Gate 21 · every claimed PRD row has an acceptance criterion proving it
    # A task's DONE WHEN list is the completion bar the implementer works to. A row claimed in
    # **PRD rows:** with no criterion citing it can be called done without ever being built —
    # exactly the drift the register cannot see. Blocks whose row line is prose ("none from this
    # bucket", "cross-ref") claim nothing and are not checked; their rows belong to another task.
    uncovered = []
    n_claims = 0
    for f in sorted(glob.glob(spec(repo, "tasks/*.md"))):
        rel = os.path.relpath(f, spec(repo))
        body = open(f, encoding="utf-8").read()
        for m in re.finditer(r"^### (T-[A-Z0-9-]+) \u00b7.*?(?=^### |\Z)", body, re.M | re.S):
            blk = m.group(0)
            rowline = re.search(r"\*\*PRD rows:\*\*(.*)", blk)
            if not rowline:
                continue
            txt = rowline.group(1)
            if "none" in txt.lower() or "cross-ref" in txt.lower():
                continue
            claimed = {r for r in re.findall(ROW_ID, txt) if r in rows}
            n_claims += len(claimed)
            dw = re.search(r"\*\*DONE WHEN:\*\*(.*?)(?=\n\*\(|\Z)", blk, re.S)
            cited = set(re.findall(ROW_ID, dw.group(1))) if dw else set()
            uncovered += [f"{rel} {m.group(1)} {r}" for r in sorted(claimed - cited)]
    gate(21, "every claimed PRD row has an acceptance criterion", not uncovered,
         f"{n_claims} row-claims, all covered by a DONE WHEN line" if not uncovered
         else f"{len(uncovered)} uncovered: {uncovered[:6]}")

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

    # --- Gate 19 · the pasted design context is current
    # docs/ux/claude-design-context.md is pasted at the top of every design session, so a stale line
    # there is inherited by every screen, and nothing else watches it.
    ctx = spec(repo, "ux/claude-design-context.md")
    if not os.path.exists(ctx):
        gate(19, "design context file is current", False, "docs/ux/claude-design-context.md is missing")
    else:
        body = open(ctx, encoding="utf-8").read()
        must = {
            "three base states": "loading, empty, error" in body or "three base states" in body,
            "F7-12 status-not-colour": "F7-12" in body,
            "where the provenance tier renders (F8-07)": "F8-07" in body,
            "the non-UI annotation convention": "non-UI half, build-side" in body,
            "the V1/V2 scope lock": re.search(r"\bV1\b", body) and re.search(r"\bV2\b", body),
            "F7-21 one sheet grammar": "F7-21" in body,
            "F7-27 table captions": "F7-27" in body,
        }
        missing = [k for k, ok in must.items() if not ok]
        # the V1 count it states must match the register
        stated = re.search(r"\*\*(\d+) are V1\*\*|locked \*\*(\d+) of them as V1\*\*", body)
        v1_real = len([1 for line in open(reg, encoding="utf-8")
                       if re.match(r"^\|\s*SCR-[A-Z0-9]+-\d{2}\s*\|", line)
                       and re.search(r"\|\s*V1\s*\|", line)])
        if stated:
            n = int(stated.group(1) or stated.group(2))
            if n != v1_real:
                missing.append(f"states {n} V1 screens, register has {v1_real}")
        # Forbidden: the retired four-state contract — but the N10 amendment legitimately says
        # "this rule named four states", which is the record of the change, not a live claim.
        recs = record_lines(body)
        stale_four = [i for i, line in enumerate(body.split("\n"), 1)
                      if i not in recs and re.search(r"\b(four|4)\s+(base\s+)?states\b", line, re.I)]
        if stale_four:
            missing.append(f"still says four base states at line(s) {stale_four[:4]}")
        gate(19, "design context file is current", not missing,
             f"carries all {len(must)} required laws; V1 count matches the register"
             if not missing else "missing/wrong: " + " · ".join(missing))

    # --- Gate 20 · every screen task keeps its closing condition
    # All four SHELL tasks — including the one behind the first screen of the run — had silently
    # lost this line, and no gate could see it. It is the completion bar for a screen task, so
    # losing it means the task can be called done with states or a viewport missing.
    cond = re.compile(r"^\s*-\s*(three|four)\s+base states\s*\+", re.M | re.I)
    n_screen, no_cond, four_state, truncated = 0, [], [], []
    for b in blocks:
        if not re.search(r"DESIGN:\**\s*SCR-", b["body"]):
            continue
        n_screen += 1
        m = cond.search(b["body"])
        if not m:
            no_cond.append(f"{b['file']} {b['id']}")
            continue
        line = b["body"][m.start():b["body"].find("\n", m.start())]
        if m.group(1).lower() == "four":
            four_state.append(f"{b['file']} {b['id']}")
        if "colour literals" not in line:
            truncated.append(f"{b['file']} {b['id']}")
    bad = []
    if no_cond:
        bad.append(f"{len(no_cond)} screen task(s) carry no closing condition: {no_cond[:4]}")
    if four_state:
        bad.append(f"{len(four_state)} still say four base states: {four_state[:4]}")
    if truncated:
        # Informational rather than fatal: the clause is real but its absence is a house-style
        # drift, not a missing completion bar. Reported so it cannot spread unnoticed.
        pass
    gate(20, "every screen task keeps its closing condition", not bad,
         f"{n_screen} screen tasks, all carry it"
         + (f" · {len(truncated)} omit the colour-literal clause (style drift, not fatal): {sorted(set(x.split()[0] for x in truncated))}" if truncated else "")
         if not bad else " · ".join(bad))

    check_instruction_hygiene(repo)

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
    print(f"  {'ALL GATES PASS' if not failed else str(len(failed)) + ' GATE(S) FAILED'}")
    return 0 if not failed else 1


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=REPO_DEFAULT)
    ap.add_argument("-v", "--verbose", action="store_true")
    a = ap.parse_args()
    sys.exit(run(a.repo, a.verbose))
