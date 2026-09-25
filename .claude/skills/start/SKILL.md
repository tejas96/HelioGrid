---
name: start
description: Begin a task or a bug fix the controlled way — read only the task's own section, review the ticket as an EPC expert, state the three things, draw the design and try to break it, explain it in simple words, create the branch, stop for the go. Use at the start of every piece of work.
---

# `/start <T-id | bug>` — read, review, explain, branch, stop

The cheapest token is the one never read. This skill reads the task, not the corpus.

## 1. Read only what the task carries

**Which task: the one the build-order line names** (`M126`) — printed on every gate run, in the
block `docs/build-order.md` puts first. Never a task picked from memory, and never one from a later
block while an earlier block has open work. A ticket with no `Depends on:` line reads there as
waiting on nothing, which is silence rather than readiness: write the line in §2 and confirm the
task is still ready from it before the go.

1. The task's own section of `docs/tasks/<module>.md` — from its `### T-…` heading to the next
   `---`. Its requirement rows are VERBATIM copies of the PRD (`docs/tasks/README.md` rule 1), so
   the PRD is never re-read for them. A row carries its own ruling; there is no register.
2. The PRD only for what the section does not quote: the owning feature area's **Behavior
   detail** and **Edge cases** blocks, by heading, never the whole document.
3. The design the `DESIGN:` line links, for a screen task. No link means the screen is not
   designed, and a screen builds only after its module's screens are designed and verified.
4. The worked example the task names, if any, in full — shape is copied from code, not described.
5. For an engine task that a DESIGNED screen will call, that screen's export and decisions record:
   a number or a vocabulary the drawing states (a horizon, a list of filter chips) is a fact the
   engine must serve, and a ticket written before the drawing may disagree with it.

**A task that opens its block runs the harness audit first.** When no task of the block the
build-order line names has shipped yet, dispatch `harness-auditor` with the block number before
the ticket review. Show the owner its findings; a `blocker` is fixed in its
own `chore/harness` change before this task's branch starts.

A bug is a task whose rows are the report. Its first proof is the reproduction on the real
surface, and the failing test comes before the fix (`CLAUDE.md` §1, §8).

## 2. Review the ticket — assume it is wrong until checked

**Check the task can be built and proven NOW, before planning it.** Name two facts with the file
that proves each: the data it reads or writes exists on `main` (grep `packages/db/src/schema/` and the
routes), and the code it asks for is not already there — grep for the ticket's own function and file
names AND for its behaviour: the route, the entity, the event, the words a screen shows and the
domain terms, because code built in an earlier slice often carries another name. A task whose data lands in a later block moves there; a task already built is closed as built;
a ticket marked `**Parked:**` is never started. Each is the owner's ruling, brought with a pick.

**Find every conflict before the go, not during the build.** Two searches, each named with what it
found. (1) Every gate and test stricter than the task's rows, and every gate the change itself
will meet: grep `.claude/mechanisms.md`, `.claude/hooks/`, `scripts/` and the tests for the facts
the rows govern AND for the paths the reach touches — a check that refuses what a row allows is a
conflict brought to the owner NOW, and one the reach will meet (a `packages/` edit needs a ticket
to carry `/verify`'s stamp, `M113`) is planned for now. (2) Every use of a type, set or shape the task changes, not only
the fields named in the ticket: its schema, every record or map keyed by it, every test that writes
its members out. A conflict either search would have found, first met mid-build, is a `/start` miss.
Then read the misses table in `.claude/landmines.md`: every row is a mistake already made once,
and a row that fits this task is checked for now, by name.

**A credential the task needs is never left as "needs a key".** Generate what can be generated (a
random secret goes straight into `.env.local`); walk the owner through the provider's console in
the browser for an external account; give anything not obtainable now a named placeholder in
`.env.example` and `.env.local` that passes `packages/env`'s schema — and build the whole path.

**A module owns an entity by the scope lock and the rulings, never by which PRD describes it in most
detail.** Check both before placing a table or a type.

**A question is open only after the docs are searched.** Memory, the hand-off and `deferred.md`
are pointers, not facts: before calling any ruling open or bringing the owner options, grep
`docs/engineering/` and `docs/tasks/` for it and name what was found, or that nothing was.

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

**Draw the design, then break it yourself, before the owner sees a solution.** A solution is shown
as its ARCHITECTURE: one diagram of the path a request or a job takes through the layers — which
package does what, where state is stored, which step writes and which reads — beside the reach. A
task with no runtime path (a doc, a ticket, a gate's text) says so in one line and has no diagram
and no cases. Then attack it. Walk every class below against THIS design, not the ticket, and
write each case as input → what happens → the fix. A class that cannot occur here is said in one
line, with why; none is skipped in silence.

- **Concurrency** (`concurrency`) — the same request twice at the same moment; two actors on one
  record; a state change whose sibling state changes take a lock it does not.
- **Partial failure** (`partial-failure`) — the process dies between any two steps; one write
  commits and the next does not; an outside call times out after it succeeded.
- **Retry and replay** (`retry`) — the same thing delivered twice, late or out of order; a person who
  changes the input and sends again.
- **Stored data and the roll** (`roll`) — `CLAUDE.md` §8's rolling-release rule, by name, for
  anything the task stores or sends between runtimes: each older reader still running during the
  roll — api and worker machines mid-roll, the apps in the field, workflows and jobs already queued —
  and what it does with the new shape; and what the new code does with every row the old one wrote.
  Settled here, never at `/ship`.
- **Security and tenancy** (`tenancy`) — a secret stored or sent back; a caller who lost access; a
  read or write that crosses tenants; device input trusted as fact.
- **Scale** (`scale`) — the cost per request, the growth per day, anything unbounded (a table, a
  scan, a list, a loop over rows), N+1, and what still holds at a hundred times today's volume.
- **Input edges** (`input`) — empty, maximum, malformed, duplicate, other scripts, money rounding at
  the minor unit, time zones and the tenant clock.
- **Platforms** (`platform`) — web and mobile, the app killed mid-action, a lost network read as an
  error.
- **Seeing it fail** (`observability`) — when this breaks in production, which log line, error code
  or metric says so.

**The cases live in the ticket, never only in the chat**, as claims in the shape
`docs/tasks/README.md` gives: each case one `**Cases:**` line with its id, its class, the fix and
the proof that fails without the fix; each class that cannot occur one `n/a` line with why; each
stored fact of a schema-bearing task — a table, a column, an index, a grant, a policy — one
`**Schema:**` line (the `/migration` design check's answers stay in the Data model block); each
done-when line numbered `D1`, `D2` … with its proof. A fix that changes what is
built also becomes a done-when line, a ruling or an out-of-scope line with its reason. Gate 32 in
`python3 scripts/gates.py` checks the shape: before the go it is green and its `claims:` line names
this task among the tickets it read.

**Then second actors read it before the owner does**, dispatched in ONE message with the task's
section: `fact-checker`, for every task, returns every statement the ticket makes about existing
code that the code refutes; `case-reviewer`, for a task with a runtime path, returns the cases the
list missed, the proofs that could not fail and the faults in the data model. Fold each finding into the ticket; one you reject is shown to the owner
with its reason.

The design reaches the owner with no open case: nothing ambiguous and nothing left "to decide at
build". A hole the owner or the build finds that one of these classes would have found is a
`/start` miss.

**For a SCREEN, dispatch `design-reviewer` BEFORE writing it.** It did not draw the screen: it renders the
export, looks at the pixels, measures, reads the record and the WHOLE PRD rows behind every product fact, and
returns blockers and the better design where it sees one. Show the owner its report. A `BLOCKER` is settled
before code; a `BETTER` the owner accepts is written into the ticket as a difference from the export, never
carried silently. A design drawn before today's UX law (`docs/ux/claude-design-context.md` §2, §3) is brought
to it HERE, at build time. No state may depend on hover: the phone has none.

**Name the GUARD each new fact joins, and the injection that will prove it fires** (Law 12). A
brand enrols with `M60`, an enum with `M17`, a route with `M15`, a table with `M12`. Find the row
that guards that KIND with `grep -n` on `.claude/mechanisms.md` — never read the whole ledger — and
say which row each new fact enrols in — a
fact whose kind has a row and is not enrolled there is an UNGUARDED fact, and its row will keep
reporting green over it. A kind with no row is said out loud here, never assumed safe.

**A task that is really two tasks is split now, not shipped half.** Split at a seam that leaves
each slice complete on its own — a done-when list that passes, docs that agree, gates green — and
propose the slices in order. A slice that cannot pass its done-when alone is not a slice.

**The size is a signal, never a gate (`M111`, review-only).** Count the reach — files, lines, migrations,
routers — and say the number. Past **25 files, 1,500 lines, one migration or one contract router**, ask
ONE question: is this one task or two? Two tasks are split here, at a layer seam in Law 3's order —
domain, then contract, then schema, then the app — each a ticket with its own done-when lines. One
complete task ships whole however many files it took, and **nothing is ever removed from a change — a
test, a guard, a doc, a proof — to land under a count** (owner ruling). Generated files are said apart.

## 4. Explain, branch, stop

Explain the task to the owner in simple words: what we build, why, and what proves it — with
§3's architecture diagram and every case it was broken with, each beside its fix, and every `none`
and `held` claim named: those are the claims no new proof will show. Then
confirm `main` is green (`gh run list --branch main --limit 1`; a red `main` is fixed before any
branch starts), confirm the working tree is clean (`git status --short` prints nothing — an
uncommitted or untracked file would ride into the new branch; its owner commits or removes it
first), delete the proof record of every task already shipped (`.git/heliogrid-harness/<T-id>/`
where its `Status:` reads `shipped`), then
`git fetch origin && git checkout -b <kind>/<t-id>-<slug> origin/main` — `feat` for a task, `fix`
for a bug, `ci`, `chore` or `docs` for work with no task rows. Bind the task's proof record to the
branch — `r="$(git rev-parse --git-common-dir)/heliogrid-harness/<T-id>"; mkdir -p "$r"; git branch
--show-current > "$r/branch"` — so git's pre-commit knows whose red proofs to check when a test
changes (`M113`). Then stop for the go.

**A task whose branch already exists is resumed on it, never branched twice.** `/start` run again
on the same task checks out that branch instead of creating one, and the clean-tree check reads its
uncommitted files instead: each is shown to the owner, and one that is neither this task's work nor
carried in by the owner's ruling is committed elsewhere or removed before the go.

**The branch exists before the first edit, ticket text included.** `git branch --show-current` is
read and is not `main` before any file is touched — the ticket's own repairs (§2) are written on the
branch, never on `main` and carried over. A dirty `main` is the mistake this line exists for.

**A go is never a commit.** It authorises the build on this branch. The yes to a commit is given in
`/ship` §4, to the file list and message shown there, and nothing earlier stands in for it.

## What this skill never does

Read a whole task file or PRD "for context" · invent a requirement the rows do not state · show a
solution before trying to break it · build before the go.
