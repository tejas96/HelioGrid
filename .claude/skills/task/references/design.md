# Design — draw, check, fix

Read this file for part A when the walk answers `owner draws <SCR-…>` or the owner asks to draw
ahead (`/task` step 1), and for part B before a screen task's RFC and before the QA of any other
task or part whose QA rows name a board frame. A studio screen reads `ported from the POC` on its
`DESIGN:` line, has no board and skips this file.

The sources, highest first: the PRD rows the brief cites, the brief (`docs/ux/briefs/SCR-….md`),
the design laws (`docs/ux/claude-design-context.md`), and the prompts and checklist
(`docs/start-here.md`). The boards and each screen's decisions record live only in the Claude
Design screens project the `DESIGN:` links name; the repo keeps no copy. The owner pastes every
prompt and sends it; Main never types into Claude Design. Main fetches the record but never reads a
picture: helpers look at the pictures.

## A. Draw a screen whose `DESIGN:` reads `PENDING`

One screen at a time: when the walk names several, take the first; the walk names the next after.

1. Continue `design/<SCR-id>` when it exists — a tree dirty on it is this screen's work, resumed —
   or cut it from `origin/main` on a clean tree; a tree dirty on any other branch stops for its
   owner (`references/runtime.md`). The brief is the one the screen's row names
   (`docs/prd/registers/screens.md` §2, column `Brief`). A screen that reuses a part another
   undrawn screen draws comes after that screen: when the walk has them the other way round, move
   this screen's task after it in its task file first. Read the brief whole and every PRD row it
   cites whole. Test each line for a defect, a contradiction, a missing state, a product fact the
   PRD does not hold, or a simpler way to the same row, and fix the brief. A question the sources
   do not answer goes to the owner before the prompt, at most two options, recommended first.
2. Build *The drawing prompt* of `docs/start-here.md` as one text and copy it to the clipboard by a
   script, never typed, as part B step 5 copies a prompt. Tell the owner where to paste it
   (`docs/start-here.md`, *The Claude Design project*) — one screen per session.
3. When the owner says the screen is drawn and gives its board links, fill the task's `DESIGN:`
   line with them (`docs/start-here.md`, *Recording a drawn screen*), then run part B.
4. When part B answers `READY`, write into the brief, from the decisions record, its One job and
   Order of attention when it had none, and every choice it left to the designer. Turn the task's
   `Status:` to `designed` once every `DESIGN:` line it carries holds a link. Show the owner the
   card — files and message — and commit on `design/<SCR-id>` only after the owner's yes
   (`CLAUDE.md` §4). Push and open a draft PR; it is marked ready as `/task` step 7 judges CI.
   This run ends there.

## B. Check a drawn screen

Run it before every RFC and QA it guards, and again after every fix the owner pastes. The boards
are read live each time; no earlier picture is reused, but every earlier ruling is.

1. Read the `DESIGN:` line of the screen's own task — for another task, the screen task whose
   frame its QA rows name. Fetch the screen's decisions record with `DesignSync` `get_file` from
   the screens project that line's link names. Its name starts with the screen id and holds
   `decisions`; a recorded check names it exactly, and a first check lists the project's files to
   find it. Fetch each board file too when it is under the read cap. Save every file in the
   scratchpad by a script, never typed.
2. Run `rm -rf .qa/board/<SCR-id>` (a relative path). Open every board the `DESIGN:` line names in
   the browser pane, one tab each, and look at each tab before any helper uses it: it shows the
   board, not a sign-in page, and the pane is shown. A signed-out tab or a hidden pane goes to the
   owner first, with the one thing to do. Then give `qa-web` a board-capture prompt:
   each board's name, tab and the English frames to picture, the folder `.qa/board/<SCR-id>/`, and
   the folder a pane screenshot lands in, `~/.claude/projects/<project>/<session id>/tool-results/`
   (the session id is in the scratchpad path). A screen just drawn in part A has every
   English frame pictured; a task or part pictures only the frames its Parts row and QA rows name,
   and `design-check` reads the rest in the board's source. A board drawn only in another language
   is not pictured. A frame it
   reports `BLOCKED` is retried once with the pane shown; still `BLOCKED`, it goes to the owner.
3. Give `design-check` the task id and the `DESIGN:` line read in 1, the brief path, the saved
   record and board files (a board over the read cap is named so), the pictures folder, and every
   ruling this task already holds: its `#### Design check`, and the Decisions of its RFC and of its
   parts' RFCs (`docs/tasks/archive/<task id>.md` keeps a shipped part's). It returns `READY`,
   `NEEDS_CHANGE` or `NOT_DRAWN`, its findings, its new `board or code` rows and at most one fix
   prompt.
4. Each new `board or code` row goes to the owner: change the board, or change the code. The
   helper's suggestion is never the ruling. Write each ruling into the task's `#### Design check`
   as soon as it is given. A `board` ruling makes the check `NEEDS_CHANGE`: continue
   `design-check` for a fix prompt that carries it. A finding that breaks a rule other screens
   share is shown with the other drawn screens of its corridor; each runs part B at its own turn.
5. `NEEDS_CHANGE` or `NOT_DRAWN`: show the owner the findings, one line each, and copy the fix
   prompt to the clipboard by a script, built as *The fix prompt* of `docs/start-here.md` says:
   `LANG=en_US.UTF-8 pbcopy < <file>`, then `LANG=en_US.UTF-8 pbpaste | cmp - <file>`. This
   shell sets no language, and without it `pbcopy` reads the file as MacRoman, so every `·`, `—`
   and `×` reaches Claude Design broken.
   Before copying it, read every line of its list against the board's source: the frame and the
   element it names exist, what it says the frame shows is what the source holds, and the size the
   prompt takes is the one that rule picks for this list.
   The owner pastes it into the screen's own file in the screens project. The owner's "done" means:
   run part B again from 1.
6. `READY`: append one entry to the task's `#### Design check` — the date, the part, `READY`, the
   record's exact file name and the pictures folder. That section is the one home of the rulings;
   the RFC cites it. A `## Redesign owed` section of the brief that this `READY` met is deleted in
   the same change. The QA of this run compares the built screen with these pictures
   (`docs/tasks/README.md`, proof owners).

A brief with a `## Redesign owed` section lists faults the board must lose: the check treats each
as a finding.

## The board is the design, not an order

A frame that looks wrong — against a PRD row, the brief, a law or rule, accessibility or another
frame, or with a clearly simpler way to the same row — goes to the owner with at most two options,
recommended first: fix the board (one fix prompt), or build the better way and record the ruling
in `#### Design check`. Never copy it silently, never depart from it silently, and build neither
way before the owner answers.
