# Design track — lock a module before its build

A module's boards are drawn, checked, fixed and locked once, before the first task that builds or
serves them, so the build waits only when this track falls behind. Run it when the owner asks —
between two build tasks, after the current task's PR is open — or when `/task` step 1 answers
`design <module>` (`SKILL.md`).

`<module>` is a screen id's module (`SCR-SHELL-06` → `SHELL`). The screens in scope are the V1
screens of `<module>` whose tasks are not `shipped` — or, when `/task` step 1 found a locked board
that differs, only those screens; a shipped screen is never re-checked, and a studio screen
(`ported from the POC`) has no board.

**Where boards live.** Claude Code draws and fixes every board on the module's canvas — a Design
artifact in Claude, listed in *The canvases* of `docs/start-here.md` with the names its boards take.
The owner reviews on the canvas, by hand edit or comment, and the owner's yes locks a board. The
canvas is the source of truth; `.design/<module>/` is a read-only copy of what was locked. Every
Artifact call names the canvas by its `url`. Read the canvas's own `SKILL.md`,
`artifact-type/reference/format.md` and `artifact-type/reference/design-system-components.md`
(`read` with `paths`, `out_dir` `<scratchpad>/canvas-ref/`) before the first board is drawn or fixed:
they hold the board format and how the design system is mounted, and this file never restates them.
Their rule against reading a canvas back does not bind this track: its reads and checks are how a
board is proven.

**The working folder** is `<scratchpad>/canvas/<module>/`. A board is read into it with `read`,
`paths` and `out_dir` `<scratchpad>/canvas/<module>/`: it lands byte for byte at
`project/<board name>` there, where agents edit it and from where Main publishes it. A screen's
boards are every `project/<screen id>-….dc.html` in the canvas's file listing (`list`,
`scope: "files"`).

**Is a board locked?** A screen's boards are locked when its `DESIGN:` line links its module's
canvas, the canvas holds at least one board of the screen, the set of its boards there equals the
set in `.design/<module>/`, each one equals a fresh read (`cmp`), and
`.design/<module>/design-system.version` equals the `version` of the canvas's `designSystems`
record in `project/canvas.json` — a design system copy changed after the lock changes how every
board on the canvas renders.

**A publish.** Main alone publishes to a canvas: ONE Artifact call with `root`
`<scratchpad>/canvas/<module>`, only the boards that changed, and `project/canvas.json` only when a
board or a page is added, moved or resized — laid out as *The canvases* says (read it again right
before; change only those keys). A publish refused because someone saved meanwhile — the owner
editing — reads the files the refusal names, redoes the change on them and publishes once more; a
second refusal goes to the owner.

0. **The canvas.** A module with no canvas in *The canvases* gets one: one Artifact call with the
   Design type's `type_url` and the `title` `HelioGrid <module>`, then the design system installed on
   it as `design-system-components.md` says, its `project/canvas.json` set as *The canvases* says,
   and its row added there.
1. **Draw what is missing.** For each screen in scope with no board on the canvas: read its brief
   and the PRD rows it cites, and fix what is wrong or missing in the brief. Then start one
   `general-purpose` agent per screen, on Opus, in the foreground, all in one message; each gets
   *The drawing prompt* of `docs/start-here.md` with the three texts it names, the
   `<scratchpad>/canvas-ref/` paths, the working folder's `project/` to write its boards into, and
   the boards of any screen its brief says it reuses, read from that screen's canvas into that
   module's own working folder, never this one. A drawing agent never publishes. Main reads each
   report, writes the decisions it names into the brief, places the new boards and their pages in
   `project/canvas.json` as *The canvases* lays them out, and publishes them in one call.
2. **Read, then check in parallel.** Read every board in scope into the working folder. Then start
   one `general-purpose` agent per screen, on Opus, in the foreground, all in one message. Each
   prompt says to follow `.claude/skills/task/board-check.md` and gives what that file lists under
   "Your prompt gives you". Then read the reports together: a rule one screen breaks is named for
   every screen that breaks it.
3. **Fix.** Show the owner every `decision` first — two options each. A ruling to build the better
   way goes into the brief and into a `docs/tasks/deferred.md` row that names the frame, its
   `reopens when` the screen's task starting (`T-<id> starts`), so the check and `qa-web` read it as
   a known difference. Then start one `general-purpose` agent per screen to fix, each with *The fix
   prompt* of `docs/start-here.md` and its boards in the working folder; publish them, read them
   again and continue only those screens' check agents. Two fix rounds at most: a board still
   failing after the second goes to the owner, who rules each difference a fix or a `deferred.md`
   row.
4. **The owner reviews.** When every board in scope is `READY` or its open differences are
   `deferred.md` rows, give the owner the canvas link and the screens to review. The owner edits a
   board by hand or comments on it. Read the comments with `ArtifactComments`: each is a fix, made as
   step 3 makes one but outside its two-round count, or a decision shown to the owner. A board the
   owner edited is read again and its check agent continued, so the lock is always a checked board.
   The owner's yes ends the review.
5. **Lock.** In a session that did not run the checks — the owner's yes came later — read every
   board in scope again and re-run its check first. Copy each checked board of a screen in scope
   from the working folder's `project/` into `.design/<module>/`, flat, replacing an older copy and removing a copy whose board is gone from the canvas, and write
   the canvas's `designSystems` `version` into `.design/<module>/design-system.version`: the lock is
   exactly what was checked. Fill each task's `DESIGN:` line with its canvas link, turn a `planned`
   task's `Status:` to `designed`, and delete each brief's `## Redesign owed` section the board now
   meets. Show the commit and, on the owner's yes, commit on `design/<module>` and open a PR as
   `/task` step 9 does. A module whose briefs, deferred rows and task lines did not change needs no
   commit.

A board changed on the canvas after the lock differs from `/task` step 1's fresh read, and only the
screens whose boards differ come back here. No board is drawn in Hindi or Marathi: those words come
from the catalog. The repo already holds the design system (`packages/theme/src/_generated/`,
`packages/ui`), so no board is ever opened in a browser: QA compares the app with the board's code
through the RFC's frame map.

**Changing the design system.** A board draws only with the design system's components and tokens.
A board that needs what the system lacks stops its screen: the change is proposed to the owner as
the exact diff of the design system artifact's files, and nothing is published before the owner's
yes. Its `SKILL.md` says how files are revised; a change to a component's
`project/components/<family>/<Name>.jsx` is made the same in `project/_ds_bundle.js`, which every
canvas mounts and which holds each component compiled, and the bundle must still parse
(`node --check`). The page's *Finish the migration* clean-up is never run: it moves the files
`packages/theme/README.md` maps. After the owner's yes: publish it, install the new version on every
module canvas that carries the system (`design-system-components.md`, Update) — which sends each
locked module back here through *Is a board locked?* — and write one `docs/tasks/deferred.md` row
for the repo's side: the typings re-pulled into `packages/theme/src/_generated/` and the component
ported in `packages/ui`, naming each screen whose board uses the change, its `reopens when` the
first of their tasks starting. Until that row ships, the board check reads the change as a known
difference, and a drawing agent is given the changed typing.
