# Design track — lock a module before its build

A module's boards are drawn, checked, fixed and locked once, before the first task that builds or
serves them, so the build waits only when this track falls behind. Run it when the owner asks —
between two build tasks, after the current task's PR is open — or when `/task` (*Pick*) sends a
screen here.

`<module>` is a screen id's module (`SCR-SHELL-06` → `SHELL`). The screens in scope are the V1
screens of `<module>` whose tasks are not `shipped` — or, when `/task` sent the run here,
only the screens it named (a board that differs from its lock, a screen whose boards load a support
file that differs from its lock, a screen with no lock, a brief with a `## Redesign owed` section); a design system version that differs from the lock puts every screen
of the module in scope. A shipped screen is never re-checked, and a studio screen (`ported from the
POC`) has no board. The owner starts the track by asking `/task` to prepare a module's design
(`design M01`).

**Where boards live.** Claude Code draws and fixes every board on the module's canvas — a Design
artifact in Claude, listed in *The canvases* of `docs/start-here.md` with the names its boards take.
The owner reviews on the canvas, by hand edit or comment, and the owner's yes locks a board. The
canvas is the source of truth; `.design/<module>/` is the committed copy of what was locked, so every
machine and session reads the same lock. Every
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
set in `.design/<module>/` on `origin/main`, each one equals a fresh read (`cmp`), every support
file those boards load from `project/` outside `project/ds/` (`open-page.js`, an image) equals its
copy in `.design/<module>/` the same way, and `.design/<module>/design-system.version` equals the
`version` of the first entry of the canvas's `designSystems` list in `project/canvas.json` — a
design system copy or a support file changed after the lock changes how a board renders.

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
   report, writes the decisions and motion moments it names into the brief, places the new boards and their pages in
   `project/canvas.json` as *The canvases* lays them out, and publishes them in one call.
2. **Read, then check in parallel.** Read every board in scope into the working folder. Then start
   one `general-purpose` agent per screen, on Opus, in the foreground, all in one message. Each
   prompt says to follow `.claude/skills/task/board-check.md` and gives what that file lists under
   "Your prompt gives you". Then read the reports together: a rule one screen breaks is named for
   every screen that breaks it.
3. **Fix.** Show the owner every `decision` first — two options each. A ruling to build the better
   way goes into the brief and into a `docs/tasks/deferred.md` row that names the frame, its
   `reopens when` the screen's task starting (`T-<id> starts`), so the board check and the code
   reviewer read it as a known difference. Then start one `general-purpose` agent per screen to fix, each with *The fix
   prompt* of `docs/start-here.md` and its boards in the working folder; publish them, read them
   again and continue only those screens' check agents. Two fix rounds at most: a board still
   failing after the second goes to the owner, who rules each difference a fix or a `deferred.md`
   row.
4. **The owner reviews.** When every board in scope is `READY` or its open differences are
   `deferred.md` rows, give the owner the canvas link and the screens to review, and tell them how,
   in these words: open the canvas, pick a screen from the Page menu, change a board by hand or leave
   a comment on the spot, and say yes here in this chat when every screen looks right — a comment on
   the canvas is never the yes. Read every comment with `ArtifactComments`: each is a fix, made as
   step 3 makes one but outside its two-round count, or a decision shown to the owner. A board the
   owner edited is read again and its check agent continued, so the lock is always a checked board.
   The owner's yes in this chat ends the review.
5. **Lock.** In a session that did not run the checks — the owner's yes came later — read every
   board in scope again and re-run its check first. The first entry of the canvas's `designSystems`
   list must carry the design system artifact's current version; when it does not, install the
   current version first (`design-system-components.md`, Update) and re-run the checks it changes.
   Copy each checked board of a screen in scope, and every support file those boards load from
   `project/` outside `project/ds/`, from the working folder's `project/` into `.design/<module>/`,
   flat, replacing an older copy and removing a copy that is gone from the canvas, and write that
   `version` into `.design/<module>/design-system.version`: the lock is exactly what was checked.
   Fill each task's `DESIGN:` line with its canvas link, turn a `planned` task's `Status:` to
   `designed`, delete each brief's `## Redesign owed` section the board now meets, and delete each
   `deferred.md` row the boards now meet (or, for a row naming several modules, its clause for this
   one). Run the gate as `/task` runs it, then commit (`CLAUDE.md` §4) on `design/<module>` as
   `chore: <module> design — <screens> locked`, push it, and open the PR as `/task` does (a draft, marked ready only when CI is green), its body listing the screens
   locked, the owner's rulings and the `deferred.md` rows added or closed. A
   lock is a commit: every lock commits `.design/<module>/`.

A board or support file changed on the canvas after the lock differs from `/task`'s fresh
read, and only the screens whose boards, or the support files they load, differ come back here. No board is drawn in Hindi or Marathi: those words come
from the catalog. The repo already holds the design system (`packages/theme/src/_generated/`,
`packages/ui`), so no board is ever opened in a browser: the build reads the board's code
(`.claude/rules/ui-adherence.md`, *A screen is its locked board*) and the code reviewer compares
it with the screen's.

**Samples.** When the owner asks for design samples, first find the top 5 Dribbble shots of the
same kind of screen, most-liked first. The sample message opens with those 5 links, one line each
on the idea taken; then come the samples, each naming its shot. Draw our own answer in the design
system, never a copy, and give each extra job to a component already on the screen
(`docs/ux/design-context.md` §3, *One versatile component before a new one*).

**Changing the design system.** A board draws only with the design system's components and tokens.
A board that needs what the system lacks stops its screen: the change is proposed to the owner as
the exact diff of the design system artifact's files — a new mode or prop on a component the system
has first, a new component only when none can carry the job — and nothing is published before the owner's
yes. Its `SKILL.md` says how files are revised; a change to a component's
`project/components/<family>/<Name>.jsx` is made the same in `project/_ds_bundle.js`, which every
canvas mounts and which holds each component compiled, and the bundle must still parse
(`node --check`). The page's *Finish the migration* clean-up is never run: it moves the files
`packages/theme/README.md` maps. After the owner's yes: publish it, install the new version on every
module canvas that carries the system (`design-system-components.md`, Update) — which sends each
locked module back here through *Is a board locked?* — and write one `docs/tasks/deferred.md` row
for the repo's side: the typings re-pulled into `packages/theme/src/_generated/` and the component
ported in `packages/ui`, naming each screen whose board uses the change, its `reopens when` the
first of their tasks starting in the build walk, not in file order. Until that row ships, the board check reads the change as a known
difference, and a drawing agent is given the changed typing.
