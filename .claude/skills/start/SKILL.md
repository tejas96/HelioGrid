---
name: start
description: Begin a task or a bug fix the controlled way — a clean start in a fresh session on its own branch, the task understood and its conflicts found, the risk tier and the scope fixed, the design broken into cases, and for a HIGH task the data model, the contract, the diagram, the whole QA plan and one second actor's review — then a simple explanation and a stop for the go. Use at the start of every piece of work.
---

# `/start <T-id | bug>` — understand, tier, scope, cases, (HIGH: plan and review), explain, stop

All the thinking happens here, once, and goes into the ticket in the shape `docs/tasks/README.md`
gives, so the build executes and `/verify` runs without planning again. A ticket still in the earlier
grammar — `→ proof:`, `**n/a**` or `**S<n>**` lines, unnumbered done-when lines — is rewritten into
that shape here, before the go.

## 0. A clean start

- **One fresh session per task.** If this one already did other work, say so and ask for a new one.
- **Which task: the build-order line** (`M126`, printed by `python3 scripts/gates.py`), or the one the
  owner names, recorded in the ticket as theirs. Never from memory; never a later block while an
  earlier one has open work. A ticket with no `Depends on:` line reads as waiting on nothing: write it.
- **The branch, before the first edit — ticket text included.** `main` green (`gh run list --branch
  main --limit 1`), the tree clean (`git status --short`), then `git fetch origin && git checkout -b
  <kind>/<t-id>-<slug> origin/main && git branch --unset-upstream` — `feat`, `fix`, or `ci` / `chore` /
  `docs` for work with no task rows. git's pre-commit and CI read the tier from the task id in the
  name (`M113`). Bind the proof record — `r="$(git rev-parse --git-common-dir)/heliogrid-harness/<T-id>";
  mkdir -p "$r"; git branch --show-current > "$r/branch"` — and read the `proof records:` line the
  checkout prints (`M141`). A task whose branch exists is resumed on it, its uncommitted files shown
  to the owner first.
- A bug is a task whose rows are the report: reproduce it on the running app, and the failing test
  comes before the fix (`CLAUDE.md` §1, §8).

## 1. Understand — read only what the task carries

1. The task's own section of `docs/tasks/<module>.md`, heading to the next `---`; its rows are
   verbatim PRD copies and carry their own rulings.
2. The PRD only for what the section does not quote: the feature area's **Behavior detail** and
   **Edge cases**, by heading — a ruling read from the row alone has contradicted them before.
3. For a screen, the design the `DESIGN:` line links; none means not designed, and a screen builds
   only after its module's screens are designed and verified. For an engine a designed screen will
   call, that screen's export: a number or vocabulary the drawing states is a fact the engine serves.
4. The worked example the task names, in full — shape is copied from code.
5. `.claude/landmines.md`, the sections for the packages the task reaches.

**Buildable now?** Two facts, each with the file and line that proves it: the data it reads or writes
exists on `main`, and the code it asks for is not already there — grep the names AND the behaviour
(the route, the entity, the words a screen shows). Data in a later block → the task moves; already
built → closed as built; `**Parked:**` → never started. Each is the owner's ruling, with a pick.

**Conflicts, before the go — two searches, each named with what it found:** (1) every gate and test
stricter than the rows and every gate the change will meet — `grep -n` over `.claude/mechanisms.md`,
`.claude/hooks/`, `scripts/` and the tests; (2) every use of each type, set or shape the task changes,
over the WHOLE repo, `tests/` included.

A question is open only after `docs/engineering/` and `docs/tasks/` are grepped for it; memory and
`deferred.md` are pointers, not facts. A credential is never left as "needs a key": generate it into
`.env.local`, or give it a named placeholder that passes `packages/env`, and build the whole path.
Read the ticket as an EPC expert and a senior engineer — kW vs kWp, provenance tiers, money rounding,
market rules, tenancy, platform parity — and fix it where it is wrong: a choice between readings the
PRD supports is ruled into the row (`CLAUDE.md` §1); a new feature or number is asked, with a pick.

## 2. Tier and scope — decided now, locked by the go

- **`**Risk:**`** — `LOW — <why>` or `HIGH — <why>`, by `CLAUDE.md` §3's two tiers; no line reads as
  HIGH. LOW pays for `break-it-reviewer` at `/ship` alone. HIGH adds `case-reviewer` here, the QA
  agents at `/verify`, `design-reviewer` for a screen, `qa-parity` for a screen with a twin. **Say the
  budget**: the agents and the rough minutes.
- **`**Scope:**`** — In: the behaviours and the layers they touch (a screen names its twin and where
  each shared part lives) · Out: what is left out, with why · Size: files and lines.
- **Size is a signal, never a gate.** Past 25 files, 1,500 lines, one migration or one contract
  router, ask ONE question: one task or two? Split at a layer seam in Law 3's order. Nothing is ever
  removed to land under a count.

## 3. Design and cases — every task

**The three things** (`CLAUDE.md` §3), then the flow: which `packages/domain` reducer decides any
state and which `packages/data` hook drives it (Law 11), or "none — the screen holds only its form
fields" (`M80`). Contract before code (Law 3).

**`**Placement:**`** — one row per new fact: the ONE package `architecture.md` §2 gives it, why, how
others reach it, and the guard it joins (Law 12: a brand `M60`, an enum `M17`, a route `M15`, a table
`M12`), enrolled in the same change. A kind with no row is said out loud. A gate this task adds or
alters is proven red; an existing one is read, not re-proven.

**`**Cases:**` — break it yourself**, one line per REAL risk, `- **C1** · <risk> → <fix> → <proof>`,
nothing for a risk that cannot occur here. Try: the same request twice at once · two actors on one
record · a state change whose sibling changes take a lock it does not · the process dying between two
writes · a call that succeeded after it timed out, or arrives twice, late or out of order · the roll
(`CLAUDE.md` §8): older readers on the new shape, new code on old rows · a secret sent back, a caller
who lost access, a read or write across tenants · anything unbounded, N+1 · empty, maximum,
malformed and duplicate input, other scripts, money at the minor unit, the tenant's clock · web and
mobile, the app killed mid-action, a lost network · the log line that says it failed in production.
Proofs are `docs/tasks/README.md`'s; a money, tenancy, permission or safety rule names a test that
will be proven red (`.claude/rules/testing.md`), and a test title says only what that test decides.

**`**Used by:**`** — the later tasks that consume what this lands, one line here, never an edit to
their tickets. **`**DONE WHEN:**`** — the rows' own Given/When/Then, verbatim, each with its proof. A
fix that changes what is built also becomes a done-when line, a ruling or an Out line.

## 4. HIGH adds: data model, contract, diagram, the whole QA plan, one second actor

**`**Data model:**`** and **`**Contract:**`** lines. **Draw the architecture**: one diagram of the path
a request or a job takes through the layers — which package does what, where state is stored, which
step writes and which reads.

**`**QA plan:**` — the whole plan, now**: the steps a person would notice plus ONE `landing` per
surface in the Scope, behaviour-level — what a person does and sees, the copy from `i18n`, never a
selector or a seed. Walk `.claude/skills/verify/references/test-matrix.md`'s edge checklist as an
attack. The always-on API core (cross-tenant 404, no session refused, money reconciles) is in the plan
when `apps/api`, `packages/db`, `packages/contracts` or `packages/data` is in the Scope. `expected` is
a literal; where the rows are silent, the step RECORDS the value for a ruling. `severity` is set here:
money, tenancy or provenance → `blocker`.

**One second actor: `case-reviewer`**, with the task id. For a SCREEN, also `design-reviewer` in the
same message: it renders the export, measures, and returns blockers and a better design; a `BETTER`
the owner accepts goes into the ticket as a difference from the export, and no state may depend on
hover. Fold each finding into the ticket; one you reject goes to the owner with its reason.

## 5. Explain, stop

ONE screen, simple words: what we build · the tier and why · the diagram (HIGH) · scope in and out ·
each case beside its fix, and every `none` · the QA plan as a short table (HIGH) · the budget. Nothing
"to decide at build". **Stop for the go.** A go authorises the build on this branch; it is never a
commit — that yes is given in `/ship`.

## 6. After the go — the scope holds

A new behaviour, layer, table, route or contract, or more than 1.5× the stated size, stops the build
and goes to the owner; on a yes the Scope, the cases and the QA plan change in ONE edit, and for a
HIGH task `case-reviewer` reads that change (`git diff` of the section). A tier that turns out HIGH
comes back here the same way. A new file inside an In layer for In behaviour needs no ask. A harness
problem met during the task goes to `docs/tasks/deferred.md`, never fixed inside the task.

## What this skill never does

Read a whole task file, PRD or ledger "for context" · invent a requirement the rows do not state ·
show a solution before trying to break it · call a task LOW because it is small · build before the go.
