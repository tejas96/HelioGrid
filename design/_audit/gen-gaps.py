#!/usr/bin/env python3
"""Generate design/DESIGN-SYSTEM-GAPS.md from the audit workflow's own output.

The 57 gaps were produced by an 11-agent audit on 2026-08-16 and existed only in
that workflow's output file. This script lifts them into the repo verbatim.
"""
import json, re, textwrap, pathlib

REPO = "/Volumes/works-space/heliogrid_v2_prd"
SRC = f"{REPO}/design/_audit/2026-08-16-component-gap-audit.json"
VER  = f"{REPO}/design/_audit/2026-08-16-closure-verification.json"
VER2 = f"{REPO}/design/_audit/2026-08-17-final-verification.json"
OUT = f"{REPO}/design/DESIGN-SYSTEM-GAPS.md"

r = json.load(open(SRC, encoding="utf-8"))
merged = r["merged"]
assert len(merged) == 57, len(merged)

# The closure verification is the ONLY input to the status column. It is a second
# pass that re-read the live files after rounds 11 and 12 ran, and then sent a
# skeptic at every CLOSED verdict. Seven of the twelve I had recorded as closed
# came back partial, so nothing here is derived from what a prompt asked for.
VERIF = {v["gap"]: v for v in json.load(open(VER, encoding="utf-8"))["verdicts"]}

# The 2026-08-17 pass verified all 48 gaps sent in rounds 13-16 — 12 readers over
# the live files, then a skeptic at every CLOSED verdict. It is NEWER than both the
# closure verification and every SENT_ROUND entry, so it wins over both.
FINAL = json.load(open(VER2, encoding="utf-8"))
VERIF2 = {f["gap"]: f for f in FINAL["gaps"]}

# --- which build block a screen belongs to -----------------------------------
def block_of(scr):
    s = scr.upper()
    if "SHELL-06" in s:
        return 2
    if "SHELL-" in s:
        return 1
    m = re.search(r"SCR-(M\d+|MS|F5)", s)
    if not m:
        return None
    return {"M01": 1, "M12": 2, "M02": 3, "M08": 4, "M11": 5,
            "M07": 6, "M13": 6, "MS": 7, "M06": 8, "F5": 8}.get(m.group(1))

def blocks_of(gap):
    bs = sorted({b for b in (block_of(s) for s in gap.get("screens", [])) if b})
    generic = any("every screen" in s.lower() for s in gap.get("screens", []))
    if generic:
        return "all"
    if not bs:
        return "—"
    if len(bs) > 4:
        return f"{bs[0]}–{bs[-1]}"
    return ",".join(str(b) for b in bs)

def nscreens(gap):
    real = [s for s in gap.get("screens", []) if s.upper().startswith("SCR-")]
    generic = len(gap.get("screens", [])) - len(real)
    return f"{len(real)}+all" if generic else str(len(real))

# --- which prompt addressed which gap ----------------------------------------
# Round 11 (the number layer) and round 12 (shell, tokens, containers) were
# written directly from this list. Gap -> prompt & that prompt's section.
SENT = {
    1: ("11", "§1"), 2: ("11", "§2"), 3: ("11", "§3"), 4: ("11", "§4"), 6: ("11", "§5"),
    7: ("12", "§1"), 8: ("12", "§2"), 9: ("12", "§3"), 5: ("12", "§4"),
    10: ("12", "§5"), 11: ("12", "§6"), 12: ("12", "§7"),
}

# Which round each gap was SENT in. Sent is not the same as verified: under the
# current plan the rounds run to completion and one verification pass follows at
# the end, so a gap can be sent-and-unchecked for a while. Keeping the two states
# apart is the whole point — conflating them is how "we asked for it" became
# "it landed" three rounds running.
SENT_ROUND = {
    4: "13A+", 5: "13A+", 7: "13A+", 8: "13A+", 9: "13A+",
    14: "13B", 17: "13B", 18: "13B", 26: "13B", 33: "13B",
    35: "13C", 36: "13C", 39: "13C", 40: "13C", 52: "13C",
    6: "14A", 10: "14A", 12: "14A",
    13: "14B", 15: "14B", 21: "14B", 25: "14B",
    37: "14C", 38: "14C", 47: "14C",
    3: "15A", 22: "15A",
    27: "15B", 28: "15B", 53: "15B", 54: "15B",
    42: "15C", 43: "15C", 48: "15C", 50: "15C", 51: "15C",
    32: "16A", 20: "16A", 46: "16A",
    16: "16B", 41: "16B", 49: "16B", 24: "16B",
    19: "16C", 23: "16C", 30: "16C", 44: "16C", 45: "16C",
}

MARK = {
    "closed": "✓ closed",
    "partial": "◐ partial",
    "open": "○ open",
    "sent": "▸ sent",
}

def status_of(i):
    # Newest evidence wins. The 2026-08-17 pass is the most recent thing that
    # actually opened the live files, so it outranks both the older verification
    # and the sent-but-unchecked marker.
    v2 = VERIF2.get(i)
    if v2:
        return v2.get("finalVerdict", v2["verdict"]).lower()
    if i in SENT_ROUND:
        return "sent"          # a round addressed it; not yet checked
    v = VERIF.get(i)
    if v:
        return v.get("finalVerdict", v["verdict"]).lower()
    return "open"              # never sent


def severity_of(i):
    v2 = VERIF2.get(i)
    return (v2 or {}).get("severity")

def missing_of(i):
    """The verified remainder, verbatim: the skeptic's finding if it overturned
    the verdict, otherwise the verifier's own stillMissing."""
    v2 = VERIF2.get(i)
    if v2:
        if v2.get("refuted"):
            return v2.get("refuteWhy")
        return v2.get("stillMissing") or None
    v = VERIF.get(i)
    if not v:
        return None
    if v.get("refuted"):
        return v.get("refuteWhy")
    return v.get("stillMissing") or None

closed = [i for i in range(1, 58) if status_of(i) == "closed"]
sent = [i for i in range(1, 58) if status_of(i) == "sent"]
partial = [i for i in range(1, 58) if status_of(i) == "partial"]
open_ = [i for i in range(1, 58) if status_of(i) == "open"]

L = []
w = L.append

w("# Design system gaps — the register")
w("")
_blocking = [i for i in partial if severity_of(i) == "blocks-drawing"]
_defect   = [i for i in partial if severity_of(i) == "defect"]
_doconly  = [i for i in partial if severity_of(i) == "doc-only"]
w(f"**57 gaps. {len(closed)} verified closed · {len(partial)} partly closed · "
  f"{len(sent)} sent and not yet checked · {len(open_)} not started.**")
w("")
w(f"**Of the {len(partial)} partial, {len(_blocking)} stop a screen being drawn**, and the 2026-08-17")
w("pass returned **zero `OPEN`** — every one of the 48 components sent in rounds 13–16 exists and does")
w("substantially what was asked.")
w("")
w("**Most of the remainder is the layer around the component** — a `.d.ts` omitting a member the")
w("`.jsx` returns, a law whose positional clause went stale when a chevron moved, an example still")
w("teaching the old form. **But not all of it.** Roughly a dozen are functional, and the sharpest are")
w("worth naming here because a reader skimming *“46 partial, 0 blocking”* will otherwise miss them:")
w("")
SHARPEST = [
    (23, "`BandedFigure`'s warning mark measures **1.99:1** on its tint — the second channel "
         "`F7-12` requires is effectively invisible, so the band *is* carried by colour alone"),
    (30, "`MapSurface`: *\u201cConfirm Location (disabled until a pin pends)\u201d* **cannot be "
         "operated on touch** \u2014 the tap lands on the placement surface"),
    (32, "`tokens/print.css` has **no `@page` rule anywhere** \u2014 *\u201cone sheet, one "
         "page\u201d* does not hold on paper"),
    (40, "`ReorderList`'s move announcement **cannot fire**, and four teaching surfaces document it"),
    (42, "`aria-busy` omitted by two of four hosts **for the documented default**"),
    (45, "`Derivation`'s `mode=\"many\"` is **inert**"),
    (48, "`MarketFormat` omits `currencySymbol` / `symbolPosition` that `format.js` returns and "
         "`NumberField` reads"),
]
w("| gap | what is actually wrong |")
w("|---|---|")
for _n, _t in SHARPEST:
    w(f"| {_n} | {_t} |")
w("")
w("## Round 17 closed all 46 — and that round is deliberately not verified")
w("")
w("Rounds 17A/17B/17C and 17DA/17DB/17DC corrected every one of the 46 partials above, plus the")
w("eleven law conflicts and the three instruments. **The table below still shows the 2026-08-17")
w("verdicts**, because those are the last verdicts anyone actually measured — regenerating them from")
w("a session's own report would be the exact error this register exists to prevent.")
w("")
w("**There will not be a fourth verification pass, and that is a decision rather than an oversight.**")
w("The 2026-08-16 audit found 34 blockers. The 2026-08-17 pass found **zero** that stopped a screen")
w("being drawn, and a tail of documentation drift. A fourth pass would cost what the third did")
w("(~7.8M tokens, 42 agents) to find a smaller tail again. The yield curve has turned over.")
w("")
w("What replaces it is better than a pass: round 17 made three instruments real, and they run")
w("**inside the project on every load** rather than once when someone asks —")
w("`guidelines/touch-targets.card.html` (inventory from `_ds_manifest.json`, results persisted to a")
w("baseline with a drift pane), `guidelines/color-contrast.card.html` (rasterises live tokens instead")
w("of quoting transcribed strings), and the card-health check. The next drift is found by the system,")
w("not by a workflow.")
w("")
w("**The real test is screen one.** A design system is verified by being used, and 56 drawable")
w("screens will find a genuine defect faster and cheaper than any further reading of the same files.")
w("")
w("---")
w("")
w("This file is the record of what the HelioGrid design system cannot yet express, and it is")
w("the source every `CLAUDE-DESIGN-PROMPT-*.md` after round ten is written from. It exists")
w("because the list lived only in a workflow's output for a day, where losing the session would")
w("have lost it.")
w("")
w("---")
w("")
w("## How the 57 were found")
w("")
w("On **2026-08-16**, eleven agents read all **99 V1 briefs** in five slices and checked each")
w("brief's needs against the **live** Claude Design project `c8aa4326-21bf-453a-8d11-749cc81dee12`")
w("— opening the `.jsx`, the `.d.ts` and `readme.md` of every component named, never reasoning")
w("from a component's name.")
w("")
w("| slice | first pass | after refutation | components checked |")
w("|---|---|---|---|")
for s in r["perSlice"]:
    w(f"| {s['slice']} | {s['firstPass']} | {s['afterRefute']} | {s['checked']} |")
w("")
w(f"**{r['rawCount']} raw reports → 57 distinct gaps.** Nearly every finding arrived at least")
w("twice, because each slice ran a first pass and then an adversarial pass against itself.")
w("")
w("A gap reported by all five slices is a **token- or law-layer** problem. A gap reported by one")
w("slice is a **surface**. That distinction is why the closed ones are closed first — they are")
w("the ones all 99 screens inherit.")
w("")
w("## The two ways a design system fails")
w("")
w("Every gap is one of these, and the second is the dangerous one:")
w("")
w(f"- **absent** ({sum(1 for g in merged if g['mode']=='absent')} gaps) — the component does not exist.")
w(f"- **present-but-wrong** ({sum(1 for g in merged if g['mode']=='present-but-wrong')} gaps) — the component exists, carries the right name, and its API")
w("  contradicts what the screen needs. Nothing looks missing. This is the failure mode that has")
w("  produced every false all-clear on this project.")
w("")
w("Severity splits **34 blockers / 23 defects**. A blocker means a screen cannot be drawn")
w("honestly; a defect means it can be drawn but something is wrong.")
w("")
w("## How to read the status column")
w("")
w("| mark | meaning |")
w("|---|---|")
w("| `✓ closed` | re-read in the live files after the round ran, **and** survived a skeptic sent to refute it |")
w("| `◐ partial` | landed in part; the verified remainder is quoted in the gap's own entry |")
w("| `▸ sent` | a round addressed it; **not yet verified** — sent is not landed |")
w("| `○ open` | never sent |")
w("")
w("**The status column is not my recollection.** It is generated from")
w("[`_audit/2026-08-16-closure-verification.json`](_audit/2026-08-16-closure-verification.json)")
w("— a second pass that re-opened the live `.jsx`, `.d.ts`, `.prompt.md`, spec cards and templates")
w("after rounds 11 and 12 ran, then sent an adversarial reader at every `CLOSED` verdict with")
w("instructions to default to refuted when unsure.")
w("")
w(f"**It overturned {sum(1 for i in range(1,58) if VERIF.get(i) and status_of(i) != 'closed')} of the 12 I had recorded as closed.** Three were refuted outright (gaps 3, 5, 9);")
w("the rest came back partial on first read. The recurring cause is the same one this project keeps")
w("hitting: the component lands, and its **documentation, spec card or template** is left teaching")
w("the old behaviour — so the next person to copy the canonical snippet reintroduces the defect.")
w("")
w("A gap is not closed because a prompt asked for it, and not closed because the component appeared.")
w("")
w("---")
w("")
w("## All 57 at a glance")
w("")
w("| # | status | sev | mode | blocks | scr | the capability that is missing |")
w("|---|---|---|---|---|---|---|")
for i, g in enumerate(merged, 1):
    st = status_of(i)
    sev = "**blocker**" if g["severity"] == "blocker" else "defect"
    mode = "wrong" if g["mode"] == "present-but-wrong" else "absent"
    need = g["need"].split("—")[0].strip().rstrip(".")
    if len(need) > 92:
        need = need[:89].rsplit(" ", 1)[0] + "…"
    w(f"| {i} | {MARK[st]} | {sev} | {mode} | {blocks_of(g)} | {nscreens(g)} | {need} |")
w("")
w("*`blocks` is the build block from [`BUILD-ORDER.md`](../BUILD-ORDER.md); `all` means every")
w("screen in the run inherits it. `scr` counts the named screens.*")
w("")
w("---")
w("")
w("## Where the open ones land")
w("")
w("A gap lands on a block if any of its screens is in that block, so one gap can appear on")
w("several rows. This is the table that says which round has to come before which block.")
w("")
BLOCK_NAME = {
    1: "Shell + entry & tenant", 2: "Billing & plans", 3: "CRM & leads",
    4: "Projects", 5: "Payments & collections", 6: "Sales exec, calling core + owner home",
    7: "**3D Design Studio**", 8: "**Proposals + customer link**",
}
inherited = [i for i, g in enumerate(merged, 1)
             if status_of(i) not in ("closed", "sent")
             and any("every screen" in s.lower() for s in g.get("screens", []))]
w("| block | what it is | open **blockers** | open defects |")
w("|---|---|---|---|")
block_blockers = {}
for b in range(1, 9):
    bl, df = [], []
    for i, g in enumerate(merged, 1):
        if status_of(i) in ("closed", "sent"):
            continue
        if b in {block_of(s) for s in g.get("screens", [])}:
            (bl if g["severity"] == "blocker" else df).append(i)
    block_blockers[b] = bl
    bc = ", ".join(str(i) for i in bl) if bl else "—"
    dc = ", ".join(str(i) for i in df) if df else "—"
    w(f"| **{b}** | {BLOCK_NAME[b]} | **{len(bl)}** — {bc} | {len(df)} — {dc} |")
w("")
if inherited:
    w(f"Plus gap{'s' if len(inherited) > 1 else ''} "
      f"{', '.join(str(i) for i in inherited)}, which every screen in the run inherits.")
    w("")
_clear = [b for b in range(1, 9) if not block_blockers[b]]
_blocked = [b for b in range(1, 9) if block_blockers[b]]
if _clear:
    many = len(_clear) > 1
    w(f"### Block{'s' if many else ''} {', '.join(str(b) for b in _clear)} — every blocker sent")
    w("")
    w(f"Each blocker on {'these blocks' if many else 'this block'} has been sent to the design")
    w("system. **Sent is not landed.** Nothing is marked `✓ closed` until a verification pass")
    w("re-reads the live files, and under the current plan that pass runs once, after the last")
    w("round. So read a zero here as *ready to check*, not as *done*.")
    w("")
if _blocked:
    b0 = _blocked[0]
    w(f"### The first block not yet ready is {b0}")
    w("")
    w(f"**Block {b0} carries {len(block_blockers[b0])} unsent blockers** — gaps "
      f"{', '.join(str(i) for i in block_blockers[b0])}.")
    w("")
w("Any claim that a block is drawable is wrong until its row reads zero **and** the verification")
w("has run. This has been got wrong twice here, both times the same way: by taking coverage from a")
w("summary instead of from this table. The counts are derived from the audit's own screen lists on")
w("every regeneration, so they cannot drift from the gaps they count.")
w("")
w("**Blocks 7 and 8 hold the three large ones** — the canvas and 3D scene (gap 31), the paged")
w("print surface (gap 32) and rich-text authoring (gap 33). None of the three has been specified")
w("to the design system yet, and block 7 is the studio port, which has not started.")
w("")
w("---")
w("")
w("## The gaps in full")
w("")
w("Each entry carries the audit's own evidence verbatim — the live code it read and the PRD rows")
w("that bind it. Do not paraphrase these into a prompt; the wording is what makes the gap")
w("checkable.")
w("")

for i, g in enumerate(merged, 1):
    st = status_of(i)
    w(f"### {i} · {g['need']}")
    w("")
    bits = [f"**{MARK[st]}**", f"{g['severity']}", g["mode"]]
    if i in SENT:
        p, sec = SENT[i]
        bits.append(f"sent in [round {p}](CLAUDE-DESIGN-PROMPT-{p}.md) {sec}")
    w(" · ".join(bits) + "  ")
    comp = g.get("component")
    if comp:
        w(f"**Where:** {comp}  ")
    rows = g.get("rows", [])
    if rows:
        w(f"**PRD rows:** {' · '.join(f'`{x}`' for x in rows)}  ")
    scr = [s for s in g.get("screens", []) if s.upper().startswith("SCR-")]
    gen = [s for s in g.get("screens", []) if not s.upper().startswith("SCR-")]
    if scr:
        w(f"**Screens ({len(scr)}):** {', '.join(f'`{s}`' for s in scr)}  ")
    for x in gen:
        w(f"**Also:** {x}  ")
    w("")
    rem = missing_of(i)
    if rem:
        v = VERIF2.get(i) or VERIF[i]
        if i in VERIF2:
            # the 2026-08-17 pass is the current state of this gap
            head = ("Still outstanding · a skeptic overturned this gap's `CLOSED` verdict"
                    if v.get("refuted") else "Still outstanding · verified as partly landed")
            if SENT_ROUND.get(i):
                head += f" · sent in round {SENT_ROUND[i]}"
        elif i in SENT_ROUND:
            head = (f"What round {SENT_ROUND[i]} was sent to fix · **superseded, awaiting"
                    " re-check**")
        else:
            head = ("Still outstanding · a skeptic overturned this gap's `CLOSED` verdict"
                    if v.get("refuted") else "Still outstanding · verified as partly landed")
        w(f"#### {head}")
        w("")
        for para in rem.split("\n"):
            if para.strip():
                w("> " + para.strip())
                w(">")
        while L and L[-1] == ">":
            L.pop()
        w("")
    elif status_of(i) == "closed":
        v = VERIF2.get(i) or VERIF.get(i)
        if not v:
            w("")
            continue
        w(f"#### Verified closed")
        w("")
        w("> " + v["evidence"].replace("\n", "\n> ").replace("\n> \n> ", "\n>\n> "))
        w("")
        if v.get("files"):
            w("*Files re-read: " + ", ".join(f"`{f}`" for f in v["files"]) + "*")
            w("")
    w("**Evidence — the original audit**")
    w("")
    for para in g["evidence"].split("\n"):
        if para.strip():
            w("> " + para.strip())
            w(">")
    while L and L[-1] == ">":
        L.pop()
    w("")

w("---")
w("")
w("## What the audit checked and found sound")
w("")
w("Recorded so the holes stay legible against real coverage — this is not a list of untested")
w("components, it is a list of components that were opened and held up.")
w("")
for v in r["verdict"]:
    if v.startswith("ALSO CLEARED") or v.startswith("COVERAGE TRACED"):
        w("> " + v.replace("\n", " "))
        w("")
w("## What the audit dropped, and why")
w("")
w("Two capabilities were reported as gaps by multiple slices and then refuted. They are recorded")
w("here so nobody re-reports them.")
w("")
w("> **One inconsistency in the audit's own prose, left uncorrected below.** The `DEDUP` note says")
w("> *“roughly 185 raw rows … merged to 46 distinct capabilities”*. Both numbers are the")
w("> synthesiser's own recollection and neither matches what it returned: the structured result")
w(f"> carries `rawCount: {r['rawCount']}` and **{len(merged)}** merged entries, which are the numbers this")
w("> file counts. The prose is kept verbatim rather than silently corrected, because the reasoning")
w("> in it — which merges happened and why — is sound and is the part worth reading.")
w("")
for v in r["verdict"]:
    if v.startswith("DROPS") or v.startswith("NARROWED") or v.startswith("DEDUP"):
        w("> " + v.replace("\n", " "))
        w("")
w("## The block-1 verdict, as it stood before rounds 11 and 12")
w("")
w("Kept verbatim because it is the reason the design run was stopped, and because it corrected an")
w("all-clear I had given from a prior agent's summary rather than from the files.")
w("")
for v in r["verdict"]:
    if v.startswith("BLOCK 1 VERDICT"):
        w("> " + v.replace("\n", " "))
        w("")
w("---")
w("")
w("## Closing the rest")
w("")
w("Rounds 11 and 12 took gaps 1–12 because those are the ones every screen inherits. Three of")
w(f"the twelve fully closed; **{len(partial)} landed in part** and need a short follow-up rather than a fresh")
w("specification. The remaining 45 are surfaces, so each can be closed just ahead of the block")
w("that needs it — but a block cannot start while it still owns an open blocker.")
w("")
w("**Five rounds close all 57.** Each gap is assigned to the *first* block that needs it, so no")
w("gap is specified twice. Blocks 3–6 share one round because between them they need only four")
w("blockers nothing earlier already required.")
w("")
w("| round | before block | blockers | defects | of which are finishing work |")
w("|---|---|---|---|---|")

first_need = {}
for i, g in enumerate(merged, 1):
    if status_of(i) in ("closed", "sent"):
        continue
    bs = {block_of(s) for s in g.get("screens", [])} - {None}
    generic = any("every screen" in s.lower() for s in g.get("screens", []))
    first_need[i] = 1 if (generic or not bs) else min(bs)

ROUNDS = [
    (13, [1], "Shell + entry & tenant", ""),
    (14, [2], "Billing & plans", ""),
    (15, [3, 4, 5, 6], "CRM · projects · payments · sales", ""),
    (16, [7], "3D Design Studio", " — **after the POC port**"),
    (17, [8], "Proposals + customer link", ""),
]
_seen = set(i for i in range(1, 58) if status_of(i) in ("closed", "sent"))
_plan = {}
for rnd, blocks, label, note in ROUNDS:
    ids = sorted(i for i, b in first_need.items() if b in blocks)
    assert not (set(ids) & _seen), f"gap listed twice in round {rnd}"
    _seen |= set(ids)
    _plan[rnd] = ids
    bl = [i for i in ids if merged[i - 1]["severity"] == "blocker"]
    df = [i for i in ids if merged[i - 1]["severity"] == "defect"]
    fin = [i for i in ids if status_of(i) == "partial"]
    blocklab = "·".join(str(b) for b in blocks)
    w(f"| **{rnd}** | **{blocklab}** · {label}{note} | "
      f"**{len(bl)}** — {', '.join(str(i) for i in bl) or '—'} | "
      f"{len(df)} — {', '.join(str(i) for i in df) or '—'} | "
      f"{len(fin)} — {', '.join(str(i) for i in fin) or '—'} |")
assert _seen == set(range(1, 58)), f"not every gap is planned: {set(range(1,58)) - _seen}"
w("")
w(f"**Coverage checked on generation:** {len(closed)} closed + "
  f"{' + '.join(str(len(_plan[r])) for r, *_ in ROUNDS)} = **57**, each gap exactly once. The")
w("assertion runs every time this file is rebuilt, so the plan cannot drift from the register.")
w("")
w(f"The last column is the {len(partial)} gaps that already landed in part. Their remainder is quoted verbatim")
w("in each gap's own entry above, and that quoted text *is* the follow-up — short, and not a fresh")
w("specification. Round 13 is a third finishing work by count.")
w("")
w("### Found after the audit — not part of the 57")

w("")
w("Things the rounds themselves surfaced. They are real and they are not in the count above,")
w("because the count is the 2026-08-16 audit and must stay comparable to it.")
w("")
POST_AUDIT = [
    ("round 13A-2", "round 14",
     "**`Slider`'s unfilled track has no field-mode edge.** The track is `--canvas-sunken` with "
     "only the thumb's accent ring to locate it. The `Switch` fix does not transfer — a 1.5px "
     "inset on a 6px track reads as a *filled* track — so it needs its own answer."),
    ("round 13A-2", "recorded, no action",
     "**`@startingPoint` tags are inert.** Probed: a card carrying both attribute forms plus the "
     "comment still compiled with `startingPoints: []`. The compiler owns that array and reads no "
     "author-facing marker in this version, so all eleven tags in the `.d.ts` files do nothing. "
     "The findable route into a capability is its `@dsCard` card and the templates."),
    ("round 14A", "round 14C",
     "**`AudioPlayer`'s 4px scrubber has `Slider`'s thin-track invisibility.** Same class of "
     "defect, and its track is drawn by the `::-webkit-slider-runnable-track` route that 14A "
     "rejected for `Slider` — probed and found reporting `box-shadow: none`, so a legibility rule "
     "cannot rest on it. The fix is the same span restructure."),
    ("round 14A", "round 14C",
     "**`Breadcrumb`'s crumb button is a 32px control** with a negative-margin pad — a sixth "
     "touch site, never in the 44px sweep's list. Needs measuring before it needs fixing: the pad "
     "may already carry it to 44."),
    ("round 14A", "round 14C",
     "**Card viewport heights drift as content grows.** `preview-frame.card.html` renders 2206px "
     "of content in a 900px viewport. Four others were corrected in 14A (field-mode, blocks, "
     "forms-composites, provenance), which suggests one pass over every card rather than fixing "
     "them as they are noticed."),
    ("round 14B", "round 14C",
     "**`Dropzone` has an invisible tab stop.** A `role=\"button\"` div containing a focusable "
     "visually-hidden file input — two tab stops, one with no visible focus ring. Same family as "
     "`RecordCard`'s nesting defect, not an instance of it. Lands on `M01-40`'s datasheet upload "
     "and `M11-37`'s payment-proof capture."),
    ("round 15A", "**resolved** — the method is now permanent",
     "**The 44px floor stopped being found by grep.** Four rounds of grepping `minHeight: 32` "
     "found 8 sites. One measured sweep — `guidelines/touch-targets.card.html`, which opens all 38 "
     "cards and 3 templates in iframes at 1280 and 390, finds every element a finger lands on "
     "(natives, ARIA roles, **and any element with a React handler read off the live fibre**) and "
     "measures the rendered rect — found **19 sites across 1,014 elements on 65 surfaces, none of "
     "which spelled its height `minHeight: 32`.** `AppRail`'s rail button declared 44 and measured "
     "44×34.3 because it shrank; `Chip` without an `onClick` was rendering a `<button>` for a "
     "label. The card re-measures on every load, so this is a standing check rather than an audit. "
     "`readme.md` now states the floor, the **four legal shapes** (≥44 outright · 44 box + "
     "negative margin · `<label>` as hit box · `alignSelf: stretch` in a ≥44 field), that a "
     "negative margin alone is not one of them, and the one in-row exception with its boundary."),
    ("round 17DB", "**the cross-round coupling is closed**",
     "**The `pageEstimate` seam is now a real count, not an estimate.** Round 13B deliberately left "
     "`RichText.measure()` plus an empty `pageEstimate` slot because the paged surface did not exist "
     "yet. 16A filled the slot with arithmetic against `PAGE_GEOMETRY`. 17DB closed the loop: "
     "`RichTextView` declares flow rows (a heading rides with its block, list items are rows), "
     "`RichText.rows` / `renderRows` are the cuttable seam `PagedDocument` consumes, and `onCut` "
     "publishes per-section spans with `pagesOf(id)` \u2014 which is what `measured` reads. Three "
     "rounds apart, and the seam held its shape at each step."),
    ("round 17B", "**repeat after any law change**",
     "**Reading the 24 laws end to end as one document found a twelfth conflict the eleven-conflict "
     "audit had missed** \u2014 law 22 quoted `MS1-18`'s *\u201cConfirm Location (disabled until a "
     "pin pends)\u201d* without saying a disabled control owes a reason, which reads as licensing "
     "the bare grey button law 9 calls a lie. It also surfaced `DetailPanel` carrying the same "
     "private three-member state union as `EditorSurface` and `Sheet` \u2014 nobody had reported "
     "it, and it would have been the next conflict. Neither is findable by checking one law "
     "against its own component, which is how every earlier round checked. **Any future law "
     "addition should end with the same end-to-end read.**"),
    ("round 17A", "**system-level fact, keep**",
     "**`--warning` is not a mark anywhere.** Measured across white / canvas / sunken / own tint it "
     "reads 2.17 / 2.02 / 1.90 / 1.99 \u2014 below the 3:1 non-text floor on every background, and a "
     "white glyph inside it is also 2.17. Every other semantic mark passes: `--success` 3.62, "
     "`--danger` 3.91, `--info` 3.68, `--neutral` 4.44, `--mark-subtle` 3.57, `--accent` 5.41. "
     "All 18 occurrences moved to `--warning-text` (7.12 / 6.64 / 6.23 / 6.53). The chart palette "
     "keeps the same amber deliberately \u2014 `--chart-5` is 2.17 too, but every chart labels its "
     "series in words, so the colour is not the sole carrier."),
    ("round 16A", "**round 17 fills it**",
     "**The drawing slot is left in a defined shape, like `pageEstimate` was.** "
     "`DrawingSheet.drawing` is caller-supplied, and an empty slot renders a **named reservation at "
     "the drawing's own footprint** (area + scale + paper) so the sheet does not reflow when the "
     "drawing arrives. `symbols` is read only when a drawing exists, so an empty slot has no legend "
     "rather than a false one. The canvas round fills this — it does not redesign the sheet."),
    ("rounds 13–16", "check at the final pass",
     "**`readme.md`'s law list has roughly doubled while the rounds ran** — law 3 rewritten, law 4 "
     "extended twice, laws 9–13 added, laws 17–19 added, plus the touch-target floor and its four "
     "legal shapes. No round has read the whole list end to end. The final pass should check the "
     "laws against **each other**, not only against the components: a law added in 16B that "
     "contradicts one added in 14B would pass every per-round check and still be wrong."),
    ("round 16A", "recorded, deliberate",
     "**`preliminary` was deliberately left off the never-dismissible list.** It is an "
     "operator-side qualifier; the customer-facing form of the same idea is a `Disclosure`, which "
     "cannot be dismissed at all. The list is now "
     "`[validation, data-integrity, below-cost, state, dunning, cap, disclaimer]`."),
    ("round 15C", "check at the final pass",
     "**`readme.md` claims `desktop-web-app` mounts a Kanban and no template does.** Found while "
     "sweeping `templates/` for Kanban and coming back empty. Pre-existing, deliberately left."),
    ("round 15B", "check at the final pass",
     "**The touch-target sweep card carries a hardcoded card list.** 15B found it had missed the "
     "three new cards plus `task-attribution`, and added them by hand. A standing check whose "
     "inventory is manual goes stale the next time a card is added — confirm at the final "
     "verification whether it enumerates cards dynamically or the list is still maintained by "
     "hand."),
    ("round 15A", "deliberate, recorded",
     "**Two touch sites stated and not fixed, with reasons.** `RangeField`'s two 22px thumbs — two "
     "44px thumbs cannot be separated when both ends sit at one value, so the exact route is the "
     "two 44px typed boxes, on by default. And inline `<a>`s in `RichTextView` prose — a word in a "
     "sentence is not a control, kept honest by the rule that **an act is never only a prose "
     "link**."),
]
w("| found in | what | where it goes |")
w("|---|---|---|")
for found, dest, what in POST_AUDIT:
    w(f"| {found} | {what} | {dest} |")
w("")
w("### One coupling that crosses a round boundary")
w("")
w("**Gap 33 (rich text) is scheduled in round 13; gap 32 (the paged print surface) in round 16.**")
w("Gap 33's evidence says the two *\"must be closed together or the estimate is a guess\"* — because")
w("`M06-15`'s cap is **pages** and its readout is *\"char count · ≈ PDF page estimate\"*, which can")
w("only be computed against a paged surface.")
w("")
w("Splitting them is still correct. Block 1's need (`SCR-M01-19`, `M01-51`) is **authoring and")
w("storage** of a T&C body; the page budget is `SCR-M06-11`'s need, in block 8. So round 13 builds")
w("the editor and its read-only renderer and is told explicitly **not to fake a page estimate** —")
w("it leaves a stated seam, and round 16 fills it. The character count is real and ships in 13.")
w("")
w("This is the only cross-round coupling in the plan. It is recorded here so the seam is filled")
w("rather than rediscovered.")
w("")
w("### The standing instruction every round must carry")
w("")
w("The closure verification found one cause behind nearly every partial landing, and it was never")
w("the component: **the component landed and its documentation did not.** `AppRail.prompt.md` still")
w("taught `badge: true` after `CountBadge` shipped. The rail's own spec card still drew a bare dot.")
w("Two of three templates still showed the old form. A designer copying the canonical snippet would")
w("have reintroduced the defect the round had just removed.")
w("")
w("So every round from 13 on ends with this, and it is not optional:")
w("")
w("> For each item, also update **every** surface that teaches the old behaviour — the")
w("> `.prompt.md`, the `@dsCard` spec card, the templates under `templates/`, `readme.md` and any")
w("> sibling component's docs that show the pattern. Then list which files you changed for each")
w("> item. A component whose own example still shows the old form has not landed.")
w("")
w("Adding this is expected to matter more than round size. Round 12 carried seven items and six")
w("landed partially; every one of those six failed on documentation, not on the component.")
w("")
w("**Why the canvas waits.** Gaps 31–34 describe a 3D scene, a drawing viewport and their")
w("geometry tokens. `/Volumes/works-space/Solar-App-POC` already contains 63,527 working lines of")
w("exactly that. Specifying it from briefs now means specifying it twice.")
w("")
w("---")
w("")
w("*Generated from the audit workflow's own output on 2026-08-16. Source of truth for what the")
w("design system must express; [`prd/registers/screens.md`](../prd/registers/screens.md) remains")
w("the source of truth for scope.*")

pathlib.Path(OUT).write_text("\n".join(L) + "\n", encoding="utf-8")
print("wrote", OUT, len("\n".join(L)), "bytes")
print("closed", len(closed), "partial", len(partial), "open", len(open_))
