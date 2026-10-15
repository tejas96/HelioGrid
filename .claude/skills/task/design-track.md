# Design track — lock a module before its build

A module's boards are checked, fixed and locked once, before the first task that builds or serves
them, so the build waits only when this track falls behind. Run it when the owner asks — between
two build tasks, after the current task's PR is open — or when `/task` step 1 answers
`design <module>` (`SKILL.md`).

`<module>` is a screen id's module (`SCR-SHELL-06` → `SHELL`). The screens in scope are the V1
screens of `<module>` whose tasks are not `shipped` — or, when `/task` step 1 found a locked board
that differs, only those boards; a shipped screen is never re-checked, and a
studio screen (`ported from the POC`) has no board. Boards are read straight from the Claude Design
screens project `2b5c5a1e-561a-4116-a710-63b85f669b70` with `DesignSync` (the owner ran
`/design-login` once). `list_files` names each screen's boards and record; every name is used
exactly as it lists it (some records carry `&amp;`), and a board is saved under that name. Only
English boards are checked and locked: a board drawn in another language is not, and its `also:`
link leaves the task's `DESIGN:` line in the design commit.

**Pull a board.** `get_file` saves a large result to a file and prints its path; this writes the
board byte for byte and says whether it came back whole:

```bash
python3 -c 'import json,sys; d=json.load(open(sys.argv[1],encoding="utf-8")); assert not d["isBase64"]; open(sys.argv[2],"w",encoding="utf-8",newline="").write(d["content"]); print("truncated" if d["truncated"] else "whole")' "<saved result>" "<folder>/<board name>"
```

**Is a board locked?** Its name is the `file=` value of its `DESIGN:` link, `+` read as a space
(`also:` boards too). It is locked when `.design/<module>/<name>` exists and equals a fresh pull into
the scratchpad: `cmp`, or `cmp -n <bytes pulled>` for a truncated pull. A pull that comes back
inline cannot be compared: `/task` step 1 says so in its line and keeps the locked copy.

A result that comes back in the conversation instead of a file cannot be pulled exactly, and a
`truncated` one holds only its first 256 KB: the owner exports that board, that file only, into
`<scratchpad>/design/<module>/`. Ask for all such boards in one message, with the absolute path,
as soon as the pulls show them; an export is checked once against its truncated pull
(`cmp -n <bytes pulled>`) and a difference stops for the owner.

1. **Draw what is missing.** For each screen in scope whose `DESIGN:` reads `PENDING`: read its
   brief and the PRD rows it cites, fix what is wrong or missing in the brief, and build one drawing
   prompt as *The drawing prompt* of `docs/start-here.md` says. Copy each by a script
   (`LANG=en_US.UTF-8 pbcopy < <file>`, then `LANG=en_US.UTF-8 pbpaste | cmp - <file>`); the owner
   pastes them into parallel Claude Design chats. Stop: the track resumes at step 2 when the owner
   says the boards are drawn.
2. **Pull, then check in parallel.** Pull every board in scope into `<scratchpad>/design/<module>/`.
   Then start one `general-purpose` agent per screen, on Opus, in the foreground, all in one
   message. Each prompt says to follow `.claude/skills/task/board-check.md` and gives what that file
   lists under "Your prompt gives you". Then read the reports together: a rule one screen breaks is
   named for every screen that breaks it.
3. **Fix.** Show the owner every `decision` first — two options each. A ruling to build the better
   way goes into the brief and into a `docs/tasks/deferred.md` row that names the frame, its
   `reopens when` the screen's task starting (`T-<id> starts`), so the check and `qa-web` read it as
   a known difference. Then give the owner each screen's fix prompt, copied by the same script, to
   paste into that screen's own file in Claude Design. When the owner says the fixes are done, pull
   those boards again and continue only their agents. Two fix rounds at most: a board still
   failing after the second goes to the owner, who rules each difference a fix or a `deferred.md`
   row.
4. **Lock.** When every board in scope is `READY` or its open differences are `deferred.md` rows,
   copy each checked board from `<scratchpad>/design/<module>/` into `.design/<module>/`, replacing
   an older copy: the lock is exactly what was checked, and a board in `.design/<module>/` is a
   locked board. Fill each task's `DESIGN:` line with its board link, turn a `planned` task's
   `Status:` to `designed`, and delete each brief's `## Redesign owed` section the board now meets.
   Show the commit and, on the owner's yes, commit on `design/<module>` and open a PR as `/task`
   step 9 does. A module whose briefs, deferred rows and task lines did not change needs no commit.

A board changed in Claude Design after the lock differs from `/task` step 1's fresh pull, and only the
boards that differ come back here. Claude Design stays the source of truth; `.design/` is a read-only
copy. Hindi and Marathi come from the catalog. The repo already holds the design system
(`packages/theme/src/_generated/`, `packages/ui`), so no board is ever opened in a browser: QA
compares the app with the board's code through the RFC's frame map.
