---
name: start
description: Begin a task, or the next part of a split task, in a fresh session. Picks the step strictly from the build order (or takes the task the owner names), reads what the ticket already decided, checks the task fully, runs the design check once in Claude Design, splits a plan over about 30 files into parts, writes the plan and the QA plan of the part that starts now, and stops for the owner's go with a short summary. Use at the start of every piece of work.
---

# /start — pick, read, check, design, size, plan, stop

Do steps 1–9 in order. Write no code. Step 9 ends in a stop.

## 1. Clean start

- `git status` must be clean. If it is not, stop and ask the owner.
- `git fetch origin`, then branch from main: `git checkout -b <kind>/<t-id>-<slug> origin/main`
  (`feat`, `fix` or `chore`); a part adds its letter: `feat/t-shell-003a-<slug>`. Work in this
  folder, never a worktree.
- A task or part whose PR is still open (`gh pr list --state open`) is not planned again, and a later
  part waits for the part before it to merge: ask the owner to merge it first.
- Every branch shares one local database. A migration from a branch that has not merged puts it
  ahead of main, and this branch's `pnpm db:migrate` then fails. Ask the owner to merge that
  branch first.
- `shipped` is every id with a folder in `.qa/` that now reads `shipped` — its task's `**Status:**`
  line, or, for a part (`T-SHELL-003a`), its row in the task's `#### Parts` table.
- Remove the QA and suite records, every `/start`, even when `shipped` is empty: those tasks' companies `QA <T-id> …`, and the suites' companies
  `E2E <10 digits>` made more than an hour ago (a younger one may belong to a suite still running);
  their rows; and every person whose only memberships are in them. Every `DEV_OTP_PHONES` person
  always stays, and so do the standing `QA <surface>` companies, which neither name matches. The
  infra must be up. It runs in one transaction, refuses any database but the local one, and prints
  what it removed:
  ```bash
  pnpm --filter @heliogrid/api exec tsx --env-file-if-exists=<repo>/.env.local -e "(async () => {
    const shipped = [/* 'T-M02-001', 'T-SHELL-003a', … */];
    const { openPools, unseed, adminUrl } = await import('./tests/support/fixture.ts');
    const { tenant, tenantMembership, userAccount } = await import('@heliogrid/db');
    const { and, inArray, like, lt, notInArray, or, sql } = await import('drizzle-orm');
    if (new URL(adminUrl).host === 'localhost:5544' === false) throw new Error('refused: not the local database');
    const pools = openPools();
    const db = pools.admin.db;
    const anHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const suiteCompany = and(sql\`\${tenant.companyName} ~ '^E2E [0-9]{10}$'\`, lt(tenant.createdAt, anHourAgo));
    const companies = await db.select({ tenantId: tenant.id }).from(tenant).where(or(suiteCompany, ...shipped.map((id) => like(tenant.companyName, 'QA ' + id + ' %'))));
    const ids = companies.map((c) => c.tenantId);
    const members = ids.length === 0 ? [] : await db.selectDistinct({ userId: tenantMembership.userAccountId }).from(tenantMembership).where(inArray(tenantMembership.tenantId, ids));
    const elsewhere = members.length === 0 ? [] : await db.selectDistinct({ userId: tenantMembership.userAccountId }).from(tenantMembership).where(and(inArray(tenantMembership.userAccountId, members.map((m) => m.userId)), notInArray(tenantMembership.tenantId, ids)));
    const dev = await db.select({ userId: userAccount.id }).from(userAccount).where(inArray(userAccount.phoneE164, (process.env.DEV_OTP_PHONES ?? '').split(',').map((p) => p.trim())));
    const keep = new Set([...elsewhere, ...dev].map((r) => r.userId));
    const people = members.filter((m) => keep.has(m.userId) === false);
    await db.transaction((tx) => unseed(tx, { companies: companies, people: people, memberships: [] }));
    console.log('removed ' + ids.length + ' companies and ' + people.length + ' people');
    await pools.close();
  })()"
  ```
- Only after it succeeds, delete `.qa/<T-id>/` for each id in `shipped`. Leave `.qa/api.log`,
  `.qa/accounts.md` and `.qa/accounts/`.

## 2. Pick the step

The step comes from `docs/build-order.md` and the tickets, never from memory, and never a later
task because it is ready.

1. **The owner names a task** → take it. When it is not the next step, say so in one line.
2. **A split task has an open part** → that part is the step, before any new task:
   `grep -nE '^\| [a-z] \| .* \| open \|$' docs/tasks/*.md`. Take the first open part of the first
   task the walk below reaches, then go to item 5.
3. **Otherwise, walk the build order** exactly as `docs/build-order.md` "One order, walked one step at
   a time" says — its walk and its table of steps — ONE block at a time: the lowest block that still
   has a `planned` or `designed` task, its files' header lines listed with
   `grep -nE '^### T-|^\*\*(Type|Status|Blocked|Parked|Depends on|DESIGN|Design):' <its files> | cut -c1-200`.
   The V column of `docs/prd/registers/screens.md` §2 says which screens are V2.
4. **The first open task decides the step**, by that table. `build` → item 5, then step 3 (Read). Any
   other step → item 5, then stop; for `owner draws`, print `docs/start-here.md` Steps 1–3, one line each, with
   the brief `docs/ux/briefs/<SCR-id>-….md` and the line to fill, `docs/tasks/<file>.md:<line>`.
5. Print four lines, then go to step 3 (Read) — or stop, when item 4 said stop:
   - `NEXT` the step.
   - `AHEAD` the next `PENDING` screen on the walk.
   - `DONE` how many V1 screens are drawn:
     `comm -12 <(grep -h '^\*\*DESIGN:\*\* SCR-' docs/tasks/*.md | grep -vE 'PENDING|ported' | grep -oE 'SCR-[A-Z0-9]+-[0-9]+' | sort -u) <(awk -F'|' '/^\| SCR-/ && $7 ~ /V1/ {gsub(/ /,"",$2); print $2}' docs/prd/registers/screens.md | sort -u) | wc -l`
   - `DEFERRED` the rows of `docs/tasks/deferred.md` whose `reopens when` is met now — `<T-id> starts`
     for the task picked, on its first `/start` only, never again for a later part
     (`grep -n '<T-id> starts' docs/tasks/deferred.md`), and `<T-id> ships` for a task that reads
     `shipped`:
     `for id in $(grep -oE 'T-[A-Z0-9]+-[0-9]+ ships' docs/tasks/deferred.md | cut -d' ' -f1 | sort -u); do grep -A3 "^### $id " docs/tasks/*.md | grep -q 'Status:\*\* shipped' && grep -n "$id ships" docs/tasks/deferred.md; done`
     — then how many rows hold an `owner:` condition, with their ids:
     `awk -F'|' '/^\| D[0-9]/ && $(NF-1) ~ /owner:/ {print $2}' docs/tasks/deferred.md`.

## 3. Read — what is already decided comes first

1. **The ticket's own decisions.** Its header lines, every ruling written in it ("ruled at …",
   "Decided at /start"), and its `#### Plan`, `#### Parts` and `#### Design check` when they exist.
   They are settled: never redo that analysis and never ask again what a ruling answers.
   - **A later part** (b, c, …) reads the parent's Plan, Acceptance criteria, Parts and Design check,
     and skips steps 5 and 6. It plans only its own row of the Parts table.
2. Its PRD rows — the whole row, from `docs/prd/`. Its brief.
3. The `CLAUDE.md` of each package the task will touch.
4. The code the task will touch — its call sites, not only its declarations.

The board is not read here: the design reviewer reads it in step 5, so it never fills this session.

## 4. Check the task

Answer each, with file:line. **Dependencies**, **Blockers** and **Missing information** stop the task
when they fail: print what is wrong and who clears it. The rest are findings the plan answers.

- **Scope** — what the task builds and what it leaves are clear; the Plan's `Scope` line records both.
- **Requirements** — every PRD row id it cites exists, and every quoted row still matches its PRD
  cell.
- **Acceptance** — every `DONE WHEN` line is there and can be proven by a test or a QA check.
- **Dependencies** — every task on its `Depends on:` line reads `shipped`
  (`grep -A3 '^### <T-id> ' docs/tasks/*.md | grep Status`); every outside need it names (an
  account, an owner action) is met. No `Depends on:` line → write one (`none` when it waits on
  nothing).
- **Blockers** — a `Blocked:` line, or a condition written in its text ("corrected before this screen
  builds", "the owner's … ids") that is not met yet.
- **Missing information** — a number, a rule or a line of copy no row gives → ask the owner.
- **Gaps** — a row with no behaviour; a missing state: loading, empty, error, no permission, slow
  network.
- **Over-engineering** — a part no row asks for.
- **Conflicts** — with existing code, another task, the brief or the design.

## 5. Design — once for the whole task, in Claude Design

A screen task whose `DESIGN:` line holds a board link, and only when the ticket has no
`#### Design check` yet. A studio screen (`ported from the POC`) has no board: its Look values come
from the POC screen it ports. This step pauses `/start` until the board is right.

1. Dispatch a `general-purpose` agent in the FOREGROUND (`run_in_background: false`, `model: opus`), told to read
   `.claude/agents/design-reviewer.md` first, follow it, and never edit or write a file — a custom
   agent and a background agent cannot load `DesignSync` — with the screen id,
   the task file and every frame the task builds — all its parts, web and phone, every state. It reads the board and its decisions record as text
   and returns its findings, ONE prompt for Claude Design and the values QA needs.
2. When the board must change, show the owner the prompt in a fenced block, ready to paste. It names
   the board, each frame, what changes and what stays.
3. The owner pastes it and says it is done → a fresh dispatch, the same way, with the word
   **verify** and the list of asked changes: each change is on the board, nothing else moved, and
   the Values for QA read again from the changed board. Anything still wrong → a new, shorter prompt.
   Repeat until the board is right.
4. Write `#### Design check` into the ticket (the format below), with the values from the last read. Every later part reads it and never
   runs this step again.


## 6. Size — a plan over about 30 files is split into parts

A task is one complete piece: one screen on BOTH platforms with its states, or one backend slice
(its tables and its endpoints). A task holding more than that, or a plan of more than about 30
files, is split:

- Each part is complete by itself and ships as its own PR, in its own fresh session.
- What both platforms share — the `ui` parts, the `domain` logic, the copy — is part `a`.
- Web and phone stay together in one part. Never split by platform: the pair is the parity check.
- `docs/build-order.md` is not edited.
- Name the twin screen and where each shared part lives (`.claude/rules/screen-parts.md`).
- The 30 sizes the plan only. No test, state, edge or fix is dropped to stay under it; a build that
  grows past it is finished, and the PR says by how much.

## 7. Write into the ticket

Below the header lines, which stay as they are, in the formats at the end of this file:

- A task not split: `#### Plan`, `#### Acceptance criteria` and `#### QA plan`.
- A task split now: `#### Plan` and `#### Acceptance criteria` for the whole task, `#### Parts`, then
  `#### Part a · Plan` (its Where and its size) and `#### Part a · QA plan`.
- A later part: only `#### Part <x> · Plan` and `#### Part <x> · QA plan`.

The QA plan is written for the part that starts now, never ahead for a later part.

## 8. Review

- Dispatch `plan-reviewer` with the task file and the part. The plan touches money, tenancy,
  permissions or the database schema → every check, on its own model. Any other plan → checks 5–7
  only, with `model: sonnet`. Fix every finding once; do not run it again.
- Add to `DEFERRED` every row whose `reopens when` reads `touches <path>` where a file this plan
  changes sits under that path. List the conditions only, not whole rows:
  `awk -F'|' '/^\| D[0-9]/ && $(NF-1) ~ /touches/ {print $2, $(NF-1)}' docs/tasks/deferred.md`.

## 9. Show the owner, then stop

At most about 15 lines, in simple words:

````
WHAT      one sentence: what the person gets
FLOW      the Plan's "How it works" line
EXAMPLE   the Plan's "Example": one journey line and one signature
SIZE      ~N files — or: part a (~N files) now · part b next
QA        N checks: api · web · ios · android
RISKS     only real ones, each with the test that proves it
DESIGN    "verified — <the Asked line>", or "checked — no change" (step 5 already ran); and each
          MUST FIX or BETTER that is not a board change
REVIEW    each plan-reviewer finding and its fix
DEFERRED  the rows met now — add each to this task? (the owner's yes)
ASK       open questions: at most 2 options each, and your pick
````

**Stop for the go.** A deferred row joins the task only on the owner's yes.

---

## The task format

````
#### Plan
**Scope** — In: … · Out: … (why) · Size: ~N files, ~N lines
**Where**
| package | what changes |
|---|---|
| domain | leads/quick-add.ts — the duplicate-phone rule |
**How it works**
  screen → useQuickAddLead (data) → POST /leads (api) → LeadService → leads table
**Example**
  Priya taps + → types a name and a phone → Save → the lead is first in the list, "Added".
  ```ts
  quickAddLead({ name, phone }): Promise<Lead>
  ```
**Data / API** — only when they change: the tables and the migration number; the routes and schemas
**Risks** — only real ones: the risk → how the plan stops it → the test that proves it
**Decided at /start** — each reading taken, with one reason
**For you** — open questions and design recommendations

#### Acceptance criteria
- AC1 · Given … when … then … (M02-03) → proof: quick-add.test.ts › "…" · QA G1.1
- AC5 · added at /start (missing error state) · Given … → proof: QA G2.3
````

Each acceptance line names its proof: a test by file and name, or a QA check id. The PRD's own lines
stay word for word. Keep the plan short: cite a PRD row by its id, never copy it again.

### A split task

````
#### Parts
| part | ships | acceptance lines | status |
|---|---|---|---|
| a | the shared parts: NotificationRow, NotificationGroup, the grouping view-model, the copy | AC4, AC5 | open |
| b | the centre and the bell badge, on web and phone | AC1–AC3, AC6 | open |

#### Part a · Plan
**Where** — the rows of the Plan's Where table this part lands · **Size** — ~N files

#### Part a · QA plan
(the QA plan format below)
````

### The design check

````
#### Design check
Board: SCR-SHELL-03 Notification Center - Mobile.dc.html, read through DesignSync
Asked: the filter chips are the five type-groups, not seven
Verified: five chips on m-default, d-default and m-filtered; nothing else moved
Values for QA: row gap --sp-3 (12) · title --fs-body-sm · badge 20 × 20 · chip height 32
Not checked from text: clipping, overlap, Hindi fit → QA H1, H3, S7
````

## The QA plan format

````
#### QA plan
Surfaces: api · web · ios · android        (from what the change reaches)

Setup
- Accounts: the standing `QA web` · `QA ios` · `QA android` · `QA api`; a fresh `QA <T-id> web` for
  G2 — S2 needs an empty list
- Phase 1 · default — the suites, and every check that needs no setting
- Phase 2 · `MOBILE_MIN_VERSION=99.0.0` in `.env.local` — G3
- Phase 3 · default again — G3.4, the app opens as usual

Smoke — every surface · phase 1
- SM1 · sign in as owner → Leads list shows "Leads"

G1 · Phone field — web · ios · android · phase 1
- G1.1 · empty, Save → "Enter a phone number", no request sent
- G1.2 · 9 digits → "Phone must be 10 digits"

API — api · phase 1
- P1 · POST /leads with no session → 401

Look — web 375 + 1536 · ios · android · phase 1
- L1 · Quick Add matches the design: sheet padding `--sp-4` (16) · field gap `--sp-3` (12) · Save 48
  high · order name, phone, Save

Standard — web · ios · android · phase 1
- S2 · the list: loading, empty, one row, many rows — why: a saved lead joins the list
- H7 · the largest text size → no label clips — why: the form's labels are new

Regression — machine · phase 1
- R1 · tests/e2e/web/leads.spec.ts · tests/e2e/mobile/leads.yaml · unit tests

Not in: S6 — no step of this flow holds a session · H9 — no theme, app root or native change
````

- A group holds every check of one field or one flow, so one agent runs it in one pass.
- Each check names its platforms, so the web and phone results sit side by side in the report.
- Each check is an action and what a person then sees, or what the api answers — taken from the PRD
  row or from its `packages/i18n` file, never from memory, and never how the code works ("no request
  sent" is seen in the network panel; "the hook retries" is not seen by anyone). Words not yet in
  `packages/i18n` read `new copy — filled at /qa step 1`.
- A Look or screen-health check names what the design says — the part, its token and its pixels, or
  its place and order — taken from the task's `#### Design check` values (a studio screen: from the
  POC screen it ports). A QA agent holds no design
  file: it measures the built screen against the values its check names.
- Each standard check carries `why:` — one line that meets its `when`.
- **Setup**: a fresh account always gives its reason; phases run default first, each setting, then
  default again; every group names its phase, and a check that crosses a setting names both
  (`phase 2→3`).
- More than about 15 checks on one surface for one screen → one line under the group says why.

### The standard checks — put a check in when its `when` meets the change

Every check left out goes on the `Not in:` line with its reason. A change to a shared package — `ui`, `theme`, `i18n` or `data` — also runs H1–H8 on
one or two screens per surface that import the changed part (found by grep), named in the plan.

**API** — when `apps/api`, `db`, `contracts` or `data` changes
- A1 · no session → 401
- A2 · another tenant's id → 404, never 403
- A3 · each role against each changed route → a role without the right gets 403
  when: also a permission change in `domain`
- A4 · bad input (a missing field, a wrong type, too long) → 400 in the standard error shape
- A5 · a create sent twice with the same key → one row, the same id
- A6 · no 5xx and no error line in the API log
- A7 · the database holds what is expected (read-only)

**Every changed screen** — web, iOS and Android
- S1 · the happy path end to end → the success state shows
- S2 · loading, empty, one row, many rows
  when: the screen shows data
- S3 · a server error and no connection → a message in the user's language; retry works. The web's
  "no connection" is a Playwright spec case the build adds (`context.setOffline(true)`) — the browser
  pane cannot drop the network; the iPhone cannot either, so Android covers the phone
  when: the screen calls the server
- S4 · a double tap, or a tap while sending → one action only
  when: an action sends something
- S5 · go back, then submit again
  when: the flow has steps
- S6 · the session ends mid-flow → sign in, then return to the same place
  when: a step of the flow holds a session
- S7 · Hindi and Marathi: the longest labels fit; the language changes mid-flow
  when: the screen's words change
- S8 · strange input: the maximum length, emoji, Devanagari, spaces, 0, negative numbers
  when: the screen takes typed input
- S9 · a role that may not do it → the action is hidden or refused
  when: an action is gated by a permission
- S10 · every icon-only button has a label
  when: the screen has an icon-only button
- S11 · it looks like the design: spacing, sizes, icons, order

**Screen health** — at each width and on both phones; H1–H6 and H8 when the screen's look changes
- H1 · every element the design shows is visible: on screen, not clipped, covered or pushed off
- H2 · each element sits where the design puts it — left, right or centre, measured as its margins
  to the screen edges
- H3 · no two elements overlap, unless the design layers them on purpose
- H4 · nothing sits under the status bar or the home bar; the last item scrolls fully above the
  bottom navigation
- H5 · no console error (it fails the check); a new console warning is a finding
- H6 · pressed, focused, disabled, selected and error states look as the design shows them
- H8 · every tap target measures at least 44 on the built screen
- H7 · large text — 200% on web, the largest phone text size — nothing clips or overlaps
  when: text or layout changes
- H9 · on a phone set to dark mode, the app still looks exactly as in light mode
  when: only a change to the theme, the app root or the native config
- H10 · the right fonts render — Devanagari in its own face, never a system fallback
  when: with S7
- H11 · walked as a first-time user: the job is finished without hesitation; each moment of doubt
  is a finding
  when: a new screen or a new flow

**Web only**
- W1 · width 375 and 1536
  when: every changed web screen
- W2 · keyboard only: tab order, visible focus, Enter and Escape
  when: the screen has controls
- W3 · reload the page mid-flow
  when: the screen holds state a reload can lose
- W4 · axe reports no serious problem (the web regression suite runs it)
  when: every changed web screen

**Phone only**
- M1 · the smallest and the largest supported phone
  when: a new screen or a layout change
- M2 · the app goes to the background and returns; the app is killed mid-action
  when: a request in flight, or state the screen holds
- M3 · the keyboard covers no field
  when: the screen takes typed input
- M4 · the Android back button
  when: a new Android screen

**Money** — when money is in scope
- $1 · BOM, proposal and tranches agree to the paisa
- $2 · lakh and crore grouping in every language
- $3 · every figure shows its provenance tier; a stale figure reads provisional

**Side effects** — when the change sends an SMS, a push, a payment or a webhook
- E1 · sent to a sandbox only, and safe when sent twice
