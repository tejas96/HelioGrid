---
name: start
description: Begin a task or a bug fix the controlled way — read only the task's own section, review the ticket as an EPC expert, state the three things, explain it in simple words, create the branch, stop for the go. Use at the start of every piece of work.
---

# `/start <T-id | bug>` — read, review, explain, branch, stop

The cheapest token is the one never read. This skill reads the task, not the corpus.

## 1. Read only what the task carries

1. The task's own section of `docs/tasks/<module>.md` — from its `### T-…` heading to the next
   `---`. Its requirement rows are VERBATIM copies of the PRD (`docs/tasks/README.md` rule 1), so
   the PRD is never re-read for them. A row carries its own ruling; there is no register.
2. The PRD only for what the section does not quote: the owning feature area's **Behavior
   detail** and **Edge cases** blocks, by heading, never the whole document.
3. The design the `DESIGN:` line links, for a screen task. No link means the screen is not
   designed, and a screen builds only after its module's screens are designed and verified.
4. The worked example the task names, if any, in full — shape is copied from code, not described.

A bug is a task whose rows are the report. Its first proof is the reproduction on the real
surface, and the failing test comes before the fix (`CLAUDE.md` §1, §8).

## 2. Review the ticket — assume it is wrong until checked

A task is a ticket: Status · Type and Tier · Why · Requirements · Design · Data model · Contract ·
Depends on · Out of scope · Done-when with one proof per line. A missing part is fixed before the
go. Then read it as an EPC expert and a senior engineer: missing, unnecessary, unclear or
conflicting rows; dependencies; edge cases; domain facts (kW vs kWp, provenance tiers, money
rounding, market rules, tenancy); platform parity. Fix the task text where it is wrong, with the
reason in the commit. A choice between readings the PRD supports is ruled into the row
(`CLAUDE.md` §1); a new feature or number is asked, with a pick.

## 3. Say the three things, the flow, then the reach

`CLAUDE.md` §3: which package owns each new file (`architecture.md` §4); which facts are new and
where each TYPE lives — every number, name and shape the done-when lines need, beside the row
that carries it, so nothing is discovered at build time; and what will prove it works. Then the
FLOW, for any task with a state: which `packages/domain` reducer decides it and which
`packages/data` hook drives it (Law 11), or "none — the screen holds only its form fields"; a
flow first met in an app hook is the defect `M80` names. Then the reach: a file list PER LAYER —
domain, contracts, db, data, i18n and its six generated catalog files per copy change, ui, each
app, docs — never a count; a guessed reach is how the ceiling is first met at `/ship`. For a
screen, the reach names its twin on the other platform and, part by part, where each shared part
lives — `packages/ui`, a shared package, or the app's own `shared/` folder; a part that would be
authored in both app trees is split out here (`M115`, review-only). Contract
before code (Law 3): the contract diff, the domain types, the schema plan, then code.

**A task that is really two tasks is split now, not shipped half.** Split at a seam that leaves
each slice complete on its own — a done-when list that passes, docs that agree, gates green — and
propose the slices in order. A slice that cannot pass its done-when alone is not a slice.

**The ceiling (`M111`, review-only).** One task is one PR a reviewer reads in five minutes: at most **25 files
or 1,500 lines** changed, **one migration**, **one contract router**. A ticket whose reach would
exceed any of these is split HERE, before the go, at a layer seam in Law 3's order — domain, then
contract, then schema, then the app — each slice a ticket of its own with its own done-when
lines. The number is the owner's; the split is not optional and never waits for `/ship`.

## 4. Explain, branch, stop

Explain the task to the owner in simple words: what we build, why, and what proves it. Then
confirm `main` is green (`gh run list --branch main --limit 1`; a red `main` is fixed before any
branch starts), then
`git fetch origin && git checkout -b <kind>/<t-id>-<slug> origin/main` — `feat` for a task, `fix`
for a bug, `ci`, `chore` or `docs` for work with no task rows — and stop for the go.

**A go is never a commit.** It authorises the build on this branch. The yes to a commit is given in
`/ship` §4, to the file list and message shown there, and nothing earlier stands in for it.

## What this skill never does

Read a whole task file or PRD "for context" · invent a requirement the rows do not state · build
before the go.
