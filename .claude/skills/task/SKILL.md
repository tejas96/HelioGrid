---
name: task
description: Use when the owner asks for HelioGrid's next build-order task, asks to start or continue a specific task, or asks to prepare a module's design (`design-track.md`). Never starts on its own.
user-invocable: true
disable-model-invocation: true
---

# /task — one task, from the build order to its pull request, in three sessions

You are Main: you decide, build, fix and clean up. Agents in `.claude/agents/` read and report; only
you, the step 5 build agents and the Design track's drawing and fix agents (in the scratchpad only)
edit files. The laws are `CLAUDE.md`, cited and never copied. A task ends in one pull request. The
owner says yes to the RFC and to every commit, and merges the PR.

**A task runs in three sessions, one per phase,** so no session carries another phase's context.
The branch says which phase this session is:

| phase | its file | the branch says | the session ends when |
|---|---|---|---|
| RFC — steps 1 to 4 | `rfc.md` | no `feat/<id>` branch, or its RFC carries no `**RFC approved:**` line | `**RFC approved:**` is written |
| build — step 5 | `build.md` | `**RFC approved:**` and no `**Build note:**` under the RFC | the `**Build note:**` is written |
| verify and ship — steps 6 to 9 | `verify.md` | a `**Build note:**` under the RFC | the PR is open |
| CI and review loop — step 9 | `verify.md` | `feat/<id>` has an open PR (its RFC is in the PR body) with a red job, review comments or a conflict | the PR is green and ready |

Read ONE phase file at the start of the session and follow it; the other two are not read. A dirty
tree on `feat/<id>` is this task's work, resumed in its phase. When the phase ends, say the one
line — `next: /task in a new session` — and stop: nothing of the next phase starts here. The owner
naming a task, a step or a part changes which task, never which phase.

**The test-database prefix** points a command at `heliogrid_test` without touching `.env.local`;
steps 5, 7 and 8 put it in front of their command:

```bash
export $(grep -E '^DATABASE_(ADMIN_)?URL=' .env.local | sed 's/heliogrid_dev/heliogrid_test/' | xargs) &&
```

## What keeps a session small

A session's cost is its context, re-read on every turn. These hold in every phase, for Main and in
every agent prompt:

- **Read by id and by range.** A PRD row by its id (`grep -n '^| M01-12 ' docs/prd/...`), a task
  by its heading's line range, a board's frames and components by `grep -o` — never a whole task
  file, pull-request body, board or log into the chat. The brief is read whole once, in step 2.
- **Never `cat` a `CLAUDE.md` or a `.claude/rules/` file.** The app loads a package's `CLAUDE.md`
  and the rules for a path the first time that path is read or edited, in Main and in every agent.
- **Long output goes to `.qa/<name>.log`** — `pnpm check`, the gate, a build, a test or e2e run —
  and the chat gets `grep -nE 'error|fail|FAIL|ERR|SKIP' .qa/<name>.log | head -40`, then the lines
  around a failure. `.claude/hooks/long-output.py` refuses the bare form.
- **No screenshot and no picture read,** in Main or in an agent: a tree and its measured values
  are the proof (`.claude/agents/qa-*.md`). `.claude/hooks/no-screenshot.py` refuses one.
- **An agent gets text, not a path into a big file:** the RFC pasted whole (a part: its own
  section), the rows it runs, the paths of the files it edits. Every agent of a step starts in one
  message. An agent never stops to wait for Main: what it cannot do is a `BLOCKED` row naming
  the need. Main meets the need, or fixes the failure, then continues that agent with those rows only.
- **A diagram is a Mermaid block in the chat,** never a drawn widget.
- **A check is read by its failures, never its exit code.** A `SKIP ` line fails the gate.

## Safety, every phase

- Nothing is built before `**RFC approved:**` stands under the RFC (`CLAUDE.md` §4).
- Every commit is shown — its file list and message — and waits for the owner's yes; then the
  push. Never `--no-verify`, never a force-push, never `main` (`.claude/settings.json` denies
  them). The owner merges.
- The database is written only through a migration or the application (`CLAUDE.md` §8).
- `git status --porcelain` reads the same before an agent starts and after it returns; a file an
  agent changed stops the task.
- A new route, table, contract, package, affected package or behaviour voids the RFC's approval:
  update the RFC, show what changed, and wait for a yes again (`build.md`).
