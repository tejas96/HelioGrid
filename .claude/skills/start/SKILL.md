---
name: start
description: Begin a task or a bug fix the controlled way — a clean start in a fresh session on its own branch, the task understood and its conflicts found, the scope fixed, the design drawn and broken into cases, the whole QA plan written, one second actor's review, a simple explanation with the impact and the diagram, then stop for the go. Use at the start of every piece of work.
---

# `/start <T-id | bug>` — understand, scope, design, plan the QA, review, explain, stop

All the thinking happens here, once. Everything a later stage — or a later session — needs is
written into the ticket, so the build executes and `/verify` runs, and neither plans again.

## 0. A clean start

- **One fresh session per task.** A task continued in a long session re-reads the whole old chat on
  every step. If this session already did other work, say so and ask the owner to open a new one.
- **Which task: the one the build-order line names** (`M126`) — printed by `python3 scripts/gates.py`,
  in the block `docs/build-order.md` puts first — or the one the owner names, recorded in the ticket
  as theirs. Never from memory; never a later block while an earlier one has open work. A ticket with
  no `Depends on:` line reads as waiting on nothing, which is silence, not readiness: write the line.
- **The budget**, said now: which agents this task will pay for and the rough minutes. docs or no
  runtime → none · backend → `case-reviewer`, `qa-api`, `break-it-reviewer` · one-platform UI →
  `case-reviewer`, one QA agent, `break-it-reviewer` · a screen on both platforms → add
  `design-reviewer`, the second QA surface, and `qa-parity` when the screen has a twin.
- **The branch, before the first edit — ticket text included.** `main` is green (`gh run list
  --branch main --limit 1`); the tree is clean (`git status --short` prints nothing — another task's
  file would ride into the branch); then `git fetch origin && git checkout -b <kind>/<t-id>-<slug>
  origin/main && git branch --unset-upstream` — `feat` for a task, `fix` for a bug, `ci`, `chore` or
  `docs` for work with no task rows — and bind the proof record:
  `r="$(git rev-parse --git-common-dir)/heliogrid-harness/<T-id>"; mkdir -p "$r"; git branch --show-current > "$r/branch"`
  (`M113`). The checkout runs git's post-checkout, which prints one `proof records:` line — read it
  (`M141`). A task whose branch exists is resumed on it, never branched twice: its uncommitted files
  are shown to the owner first. A task found already built in §1 closes and its branch goes.
- A bug is a task whose rows are the report. Its first proof is the reproduction on the running
  app, and the failing test comes before the fix (`CLAUDE.md` §1, §8).

## 1. Understand — read only what the task carries

1. The task's own section of `docs/tasks/<module>.md`, from its `### T-…` heading to the next `---`.
   Its requirement rows are verbatim PRD copies (`docs/tasks/README.md` rule 1); a row carries its
   own ruling.
2. The PRD only for what the section does not quote: the owning feature area's **Behavior detail**
   and **Edge cases** blocks, by heading.
3. For a screen, the design the `DESIGN:` line links; no link means not designed, and a screen builds
   only after its module's screens are designed and verified. For an engine task a DESIGNED screen
   will call, that screen's export and record: a number or vocabulary the drawing states is a fact
   the engine must serve.
4. The worked example the task names, in full — shape is copied from code, not described.
5. `.claude/landmines.md`: only the sections for the packages the task reaches, and the misses table
   — each miss that fits this task is checked now, by name.

**Buildable now?** Name two facts, each with the file and line that proves it: the data it reads or
writes exists on `main` (`packages/db/src/schema/`, the routes), and the code it asks for is not
already there — grep the ticket's names AND its behaviour (the route, the entity, the event, the
words a screen shows), because earlier slices often built it under another name. Data in a later
block → the task moves; already built → closed as built; `**Parked:**` → never started. Each is the
owner's ruling, brought with a pick.

**Conflicts, before the go.** Two searches, each named with what it found: (1) every gate and test
stricter than the rows, and every gate the change will meet — grep `.claude/mechanisms.md` (by
`grep -n`, never read whole), `.claude/hooks/`, `scripts/` and the tests for the facts the rows
govern and the paths the reach touches; (2) every use of each type, set or shape the task changes —
its schema, every record or map keyed by it, every test that writes its members out. A conflict
either search would have found, first met mid-build, is a `/start` miss.

A question is open only after `docs/engineering/` and `docs/tasks/` are grepped for it; memory, the
hand-off and `deferred.md` are pointers, not facts. A module owns an entity by the scope lock and
the rulings, never by which PRD describes it best. A credential is never left as "needs a key":
generate what can be generated into `.env.local`, walk the owner through a provider console, or give
it a named placeholder in `.env.example` and `.env.local` that passes `packages/env` — and build the
whole path.

Read the ticket as an EPC expert and a senior engineer: missing, unnecessary, unclear or conflicting
rows; domain facts (kW vs kWp, provenance tiers, money rounding, market rules, tenancy); platform
parity. Fix the ticket where it is wrong. A choice between readings the PRD supports is ruled into
the row (`CLAUDE.md` §1); a new feature or number is asked, with a pick.

## 2. Scope and impact — decided now, locked by the go

The ticket takes the shape `docs/tasks/README.md` gives. Write:
- **`**Impact:**`** — who gains what when this ships, and the risk it removes or the number it moves.
- **`**Scope:**`** — **In**: the behaviours and the layers they touch (domain, contracts, db, data,
  i18n and its six generated catalogs per copy change, ui, each app, docs) · **Out**: what is left
  out, with why · **Size**: files and lines. For a screen, In names its twin on the other platform
  and where each shared part lives (`M115`, review-only).
- **Size is a signal (`M111`, review-only).** Past 25 files, 1,500 lines, one migration or one
  contract router, ask ONE question: one task or two? Two are split here, at a layer seam in Law 3's
  order, each slice complete with its own done-when lines. One task ships whole, and nothing — a
  test, a guard, a doc, a proof — is ever removed to land under a count.

## 3. Design, cases and the whole QA plan

**The three things** (`CLAUDE.md` §3), then the flow: which `packages/domain` reducer decides any
state and which `packages/data` hook drives it (Law 11), or "none — the screen holds only its form
fields" (`M80`). Contract before code (Law 3).

**`**Placement:**`** — one row per new fact (a type, a vocabulary, a string, a query, a wire shape, a
policy number): the ONE package `docs/engineering/architecture.md` §2 gives it, why, and how others
reach it. A vocabulary is authored in `domain` and derived in `contracts`; copy lives in `i18n`; a
query in `db`; a wire call in `data`; a visual value in `theme`. **Name the guard each new fact joins**
(Law 12) — a brand `M60`, an enum `M17`, a route `M15`, a table `M12`, found with `grep -n` — and the
injection that will prove it fires. A kind with no row is said out loud.

**Draw the architecture**: one diagram of the path a request or a job takes through the layers —
which package does what, where state is stored, which step writes and which reads. A task with no
runtime path says so in one line and writes `**Cases:** none — <why>`.

**Then break it yourself.** Walk every class against THIS design and write each case into
`**Cases:**` as input → what happens → the fix → the proof that fails without the fix. A class that
cannot occur is one short `n/a` line with why; none is skipped in silence.

- **Concurrency** (`concurrency`) — the same request twice at once; two actors on one record; a
  state change whose sibling state changes take a lock it does not.
- **Partial failure** (`partial-failure`) — the process dies between two steps; one write commits and
  the next does not; an outside call times out after it succeeded.
- **Retry and replay** (`retry`) — delivered twice, late or out of order; a person who changes the
  input and sends again.
- **Stored data and the roll** (`roll`) — `CLAUDE.md` §8's rolling-release rule for anything stored
  or sent between runtimes: every older reader still running (api and worker mid-roll, apps in the
  field, queued workflows and jobs) with the new shape, and the new code with every old row.
- **Security and tenancy** (`tenancy`) — a secret stored or sent back; a caller who lost access; a
  read or write across tenants; device input trusted as fact.
- **Scale** (`scale`) — cost per request, growth per day, anything unbounded, N+1, a hundred times
  today's volume.
- **Input edges** (`input`) — empty, maximum, malformed, duplicate, other scripts, money rounding at
  the minor unit, time zones and the tenant clock.
- **Platforms** (`platform`) — web and mobile, the app killed mid-action, a lost network read as an
  error.
- **Seeing it fail** (`observability`) — the log line, error code or metric that says so in production.

Each stored fact of a schema-bearing task is one `**Schema:**` line; each done-when line is numbered
`D1`, `D2` … with its proof. A fix that changes what is built also becomes a done-when line, a ruling
or an out-of-scope line.

**`**QA plan:**` — the whole plan, now.** One step per claim whose proof is `qa-<surface> Q<n>`, plus
ONE `landing` step per surface in the Scope, in the ticket's shape. Steps are behaviour-level — what
a person does and sees, the copy from `i18n` — never a selector or a seed. Walk the edge checklist in
`.claude/skills/verify/references/test-matrix.md` as an attack, not a form: an edge that applies
becomes a case or a step, and nothing is written for one that does not. The always-on API core
(cross-tenant 404, no session refused, money reconciles) is in the plan only when `apps/api`,
`packages/db`, `packages/contracts` or `packages/data` is in the Scope. `expected` is a literal
comparison; where the rows are silent, the step RECORDS the value for a ruling. Each step's `severity` is
set here, never by the executor: money, tenancy or provenance → `blocker`. Gate 32 (`python3 scripts/gates.py`) checks the shape and
that claims and steps point at each other; its `claims:` line names this task before the go.

**One second actor reads it: `case-reviewer`**, with the task id — it checks the facts, the
Placement, the cases, the proofs, the QA steps and the data model. For a SCREEN, also `design-reviewer`
in the same message: it renders the export, measures, and returns blockers and a better design; a
`BETTER` the owner accepts goes into the ticket as a difference from the export, and no state may
depend on hover. Fold each finding into the ticket; one you reject goes to the owner with its reason.
Then save what was reviewed: `bash scripts/verify-digest.sh --ticket <T-id> > "$r/review.sha"`.

## 4. Explain, stop

Explain on ONE screen, in simple words, in this order: what we build · the impact · the diagram ·
scope in and out · each case beside its fix, and every `none` and `held` claim (no new proof will
show those) · the QA plan as a short table · the budget. Nothing ambiguous, nothing "to decide at
build". **Stop for the go.** A go authorises the build on this branch; it is never a commit — that
yes is given in `/ship` to the file list and message shown there.

## 5. After the go — the scope holds

A new behaviour, a new layer, a new table, route or contract, or more than 1.5× the stated size,
stops the build and goes to the owner. On a yes, the Scope, the cases and the QA plan change in ONE
edit, and `case-reviewer` reads only that change (`git diff` of the section), then `review.sha` is
saved again. A new file inside an In layer for In behaviour needs no ask. A design flaw found by
`/verify` or at review comes back the same way. A harness problem met during the task goes into
`docs/tasks/deferred.md`, never fixed inside the task.

## What this skill never does

Read a whole task file, PRD or ledger "for context" · invent a requirement the rows do not state ·
show a solution before trying to break it · leave the QA plan for later · build before the go.
