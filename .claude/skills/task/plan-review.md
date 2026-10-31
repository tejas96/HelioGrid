# Plan review — break the RFC, once, before the build

`/task` *Plan* runs this in the main session as soon as the `#### RFC` is written. A gap found now
costs an edit; found after the build, it costs a rebuild. It never redoes what holds elsewhere:
*Plan* tested each line (wrong, missing, over-built), `board-check.md` proved each board complete
and true to its PRD rows, `rfc-proofs-hold` proves each `main-dev` proof names a test, and
`code-reviewer` checks the code against this plan.

**Who you are now.** You are no longer the plan's author. You are a principal engineer who has run
multi-tenant SaaS that moves money, on the web and on phones, and who was paged when a plan missed
a case: a tenant saw another's row, a total was off by a paisa, an old app version crashed on a new
field. You read this plan to break it. It is wrong until your attack fails.

**Once.** It runs when the branch's change from its merge base — committed or not — holds only the
plan; a branch that holds code skips it. It counts as no re-check round, and it never runs again
on the task. The code-reviewer reads the plan as this review leaves it.

**It reads almost nothing new.** *Plan* read the task, its PRD rows, the brief and the boards in
this session; read none of them again. Read only: the callers of each export the RFC changes
(`grep -rln '<export>' apps packages tests`), and a name search for each new part, file or
dependency the RFC adds (`grep -rli '<name>' packages apps`).

**1 · Start from the goals, never the RFC.** An author reads their own plan as they meant it. So
list the targets first — each `DONE WHEN` line, each clause of the PRD rows the task cites and, for
a screen, each locked frame
(`grep -o 'data-frame="[^"]*"' .design/<module>/<screen id>-*.dc.html`) — then find the RFC
decision and proof row that meet each. A target with no home is a finding; so is a proof that
would still pass if its line broke.

**2 · Walk one journey and break it at each step.** Walk the task's main user from the first screen
or request to the result, through the RFC's states. At each step, attack only where the RFC's files
reach: the action fails or the network drops; a double tap; a role without the permission; another
tenant's id; the other platform; a value at its long end (Hindi, a large amount, an empty or long
list). An attack the RFC has no answer for is a finding.

**3 · The costly breaks, only where the file list reaches them.** Try these first — a miss here
leaks data, loses money or needs a second release:

- **Money:** a figure computed outside domain's `money/`, or not reconciled to the minor unit.
- **Tenancy and access:** a route with no access entry; another tenant's row answered with
  anything but 404.
- **Old readers:** a stored or sent shape (column, enum value, response, workflow message, cached
  payload) that an old reader cannot read, or still reads and acts on by the rule this change
  removes, or old data the new code cannot.
- **Ownership:** schema or API a later module owns (Law 9).
- **Callers:** a changed export that breaks a caller the grep found.
- **Hand-offs:** a duty the RFC gives another task that the other task's section and the row map do
  not name — the RFC is cut at ship, and the duty with it.
- **Already built:** a new part, file or dependency the name search finds in the repo (Law 5).
- **The design system:** a prop the RFC removes or retypes on a component that has a typing in
  `packages/theme/src/_generated/contracts` — that is a design-system change, the owner's.
- **Logic:** a decision whose rule gives the wrong result for a case the walk reached.
- **Dates:** an example that names a date or a debit, walked on the calendar — a charge for a
  period paid in advance can ride only a debit after the one that closes it.

**What counts.** A finding names its target, attack or break and the source that proves it: a
`DONE WHEN` id, a frame, a PRD row, a law or a `file:line`. No source, no finding. A taste, a
wording, a "could also", or scope no PRD row asks for is not a finding. `CLEAN` is a claim: every
target has a home and every attack the files reach failed. Never write `CLEAN` to move on, and never
make a finding to look useful. No score, no count, no list of what passed.

**Then.** Fix each finding in the RFC — a decision changed, a state or proof row added, a part
cut — say the result in one block, and go on to *Build* without waiting:

```
plan review: CLEAN
```

```
plan review: FIXED
- <target | attack | break> · <source> · gap: <what was missing or wrong> · fix: <the RFC change>
```

A finding the RFC cannot hold — the task needs a split, or two sources disagree — goes as *Plan*
says: `owner splits <id>`, or `CLAUDE.md` §7 rules.
