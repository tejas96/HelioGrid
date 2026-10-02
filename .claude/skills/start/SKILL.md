---
name: start
description: Begin a task in a fresh session. Picks the next step in the build order (or takes the task the owner names), reads the task, its brief, its design and the code it touches, critiques them, writes the plan, the acceptance criteria and the QA plan into the task, and stops for the owner's go. Use at the start of every piece of work.
---

# /start — pick, understand, plan, stop

Do steps 1–7 in order. Write no code. Step 7 ends in a stop.

## 1. Clean start

- `git status` must be clean. If it is not, stop and ask the owner.
- `git fetch origin`, then branch from main: `git checkout -b <kind>/<t-id>-<slug> origin/main`
  (`feat`, `fix` or `chore`). Work in this folder, never a worktree.
- Every branch shares one local database. A migration from a branch that has not merged puts it
  ahead of main, and this branch's `pnpm db:migrate` then fails. Ask the owner to merge that
  branch first.
- Delete the QA workspace of every task that now reads `shipped`: for each folder in `.qa/`, look
  up its task's `**Status:**` line and remove `.qa/<T-id>/` when it is `shipped`. Leave `.qa/api.log`.
  Remove that task's QA records too — its companies `QA <T-id> …`, their rows, and every person
  whose only memberships are in them; every `DEV_OTP_PHONES` person always stays. The infra must be
  up. It runs in one transaction, refuses any database but the local one, and prints what it removed:
  ```bash
  pnpm --filter @heliogrid/api exec tsx --env-file-if-exists=<repo>/.env.local -e "(async () => {
    const { openPools, unseed, adminUrl } = await import('./tests/support/fixture.ts');
    const { tenant, tenantMembership, userAccount } = await import('@heliogrid/db');
    const { and, inArray, like, notInArray } = await import('drizzle-orm');
    if (new URL(adminUrl).host === 'localhost:5544' === false) throw new Error('refused: not the local database');
    const pools = openPools();
    const db = pools.admin.db;
    const companies = await db.select({ tenantId: tenant.id }).from(tenant).where(like(tenant.companyName, 'QA <T-id> %'));
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
  The files those rows point at stay in the local object store.

## 2. Pick the step — only when the owner names no task

1. Read the block table in `docs/build-order.md` and the notes under it, which say when a file's
   tasks sit in more than one block.
2. Walk ONE block at a time — the whole list costs about 40k tokens, one block about 8k. Take the
   lowest block that still has a `planned` or `designed` task, and list its files' header lines:
   `grep -nE '^### T-|^\*\*(Type|Status|Blocked|Parked|Depends on|DESIGN|Design):' <its files> | cut -c1-200`.
   The V column of `docs/prd/registers/screens.md` §2 says which screens are V2.
3. Walk the tasks in order: inside the block, its cells in the table's order (a task
   file, or a task placed apart from its file); inside a file, the backend tasks first (any Type but
   `screen`), then the screens, each as the file writes them. A `Depends on:` task in the same block
   goes before the task that names it. Skip a task that is shipped, struck or parked, or whose
   screens are all V2.
4. The first open task decides the step:
   - It has a `Blocked:` line → print it; the owner clears it. Stop.
   - It waits on an open task → that task goes first when it is in the same block; otherwise (a later
     block, or a parked task) the owner clears the wait. Stop.
   - It is a screen whose `DESIGN:` line holds no link, or a backend task whose block still has an
     undrawn screen it serves (a screen of its own file, or one whose `Depends on:` names it) → the
     owner draws. Print: (1) paste `docs/ux/claude-design-context.md` into Claude Design; (2) paste
     the brief `docs/ux/briefs/<SCR-id>-….md`; (3) draw it and export to `HelioGrid-UX/`; (4) put the
     link on the `DESIGN:` line at `docs/tasks/<file>.md:<line>`. Stop.
   - None of these → build it. Go on to step 3.
5. Print four lines — `NEXT` the step · `AHEAD` the next undrawn screen on the walk · `DONE` how many
   of the 99 V1 screens are drawn, which this counts:
   `comm -12 <(grep -h '^\*\*DESIGN:\*\* SCR-' docs/tasks/*.md | grep -v PENDING | grep -oE 'SCR-[A-Z0-9]+-[0-9]+' | sort -u) <(awk -F'|' '/^\| SCR-/ && $7 ~ /V1/ {gsub(/ /,"",$2); print $2}' docs/prd/registers/screens.md | sort -u) | wc -l` · `DEFERRED` how many rows wait in `docs/tasks/deferred.md`
   (`grep -c '^| D[0-9]' docs/tasks/deferred.md`) and the three lowest ids with their one-line issue —
   the build order never picks them, so the owner sees them here and can name one.

When the owner names a task that is not the next one, say so in one line and go on.

## 3. Read

- The task section. Its PRD rows — the whole row, from `docs/prd/`. Its brief. For a screen, its
  export in `HelioGrid-UX/`.
- Check the task's own references: every row id it cites exists in the PRD, and every quoted row
  still matches its PRD cell. A mismatch is a finding for step 5.
- The `CLAUDE.md` of each package the task will touch.
- The code the task will touch — its call sites, not only its declarations.

## 4. A screen task starts design-reviewer now

Dispatch `design-reviewer` in the background with the screen id and the task file. It works while
you do step 5.

## 5. Critique the task

Answer each, with file:line:

- **Gaps** — a row with no behaviour; a missing state: loading, empty, error, no permission, slow
  network.
- **Missing detail** — a number, a rule or a line of copy that no row gives.
- **Over-engineering** — a part no row asks for.
- **Conflicts** — with existing code, another task, the brief or the design.
- **Size** — more than one screen on both platforms, or more than one backend slice (its tables and
  its endpoints) → propose the split and stop.

Two readings the PRD allows → take the simplest, and write it under "Decided at /start" with one
reason. A feature or a number no PRD row implies → ask the owner.

## 6. Write into the task section

Below the task's header lines, which stay as they are, add the three sections in the format at the
end of this file: `#### Plan`, `#### Acceptance criteria` (the task's `DONE WHEN` lines, renamed and
extended) and `#### QA plan`.

## 7. Review, then stop

- The plan touches money, tenancy, permissions or the database schema → dispatch `plan-reviewer`
  with the task file. Fix every finding once; do not run it again.
- Wait for `design-reviewer`.
- Show the owner, in simple words: what changes and where, the example, the risks, how many QA
  checks, design-reviewer's MUST FIX and BETTER findings, each plan-reviewer finding with its fix,
  and every open question. **Stop for the go.**
- Design changes the owner approves are made in Claude Design: read the board with `DesignSync`
  from the Claude Design project (never from `HelioGrid-UX/`), edit a copy in the scratchpad, show
  the owner pictures, and write it back with `DesignSync` after the owner's yes. Then pull the
  board back with `DesignSync` `get_file` and write it over its file in `HelioGrid-UX/`, and show
  the owner its name and size. A board over 256 KB is beyond `get_file`: the owner re-exports it.
  Then the build starts.
- After the go, the plan changes only through the owner: a new behaviour, table, route, contract or
  package means stop and ask.

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
- A1 · Given … when … then … (M02-03) → proof: quick-add.test.ts › "…" · QA G1.1
- A5 · added at /start (missing error state) · Given … → proof: QA G2.3
````

Each acceptance line names its proof: a test by file and name, or a QA check id. The PRD's own lines
stay word for word.

## The QA plan format

````
#### QA plan
Surfaces: api · web · ios · android        (from what the change reaches)

Smoke — every surface
- S1 · sign in as owner → Leads list shows "Leads"

G1 · Phone field — web · ios · android
- G1.1 · empty, Save → "Enter a phone number", no request sent
- G1.2 · 9 digits → "Phone must be 10 digits"

API — api
- P1 · POST /leads with no session → 401

Look — web 375 + 1536 · ios · android
- L1 · Quick Add matches the export: spacing, sizes, icons, order

Regression — machine
- R1 · tests/e2e/web/leads.spec.ts · tests/e2e/mobile/leads.yaml · unit tests

Skipped: S2 (no list on this screen) · W3 (no form)
````

- A group holds every check of one field or one flow, so one agent runs it in one pass.
- Each check names its platforms, so the web and phone results sit side by side in the report.
- Each check is an action and the exact text or state expected. Copy an expected word from its
  `packages/i18n` file, never from memory.
- No severity: every in-scope issue QA finds is fixed in this branch.

### The standard checks — copy every one that applies; list the rest on the Skipped line

**API** — when `apps/api`, `db`, `contracts` or `data` changes
- A1 · no session → 401
- A2 · another tenant's id → 404, never 403
- A3 · each role against each changed route → a role without the right gets 403
- A4 · bad input (a missing field, a wrong type, too long) → 400 in the standard error shape
- A5 · a create sent twice with the same key → one row, the same id
- A6 · no 5xx and no error line in the API log
- A7 · the database holds what is expected (read-only)

**Every changed screen** — web, iOS and Android
- S1 · the happy path end to end → the success state shows
- S2 · loading, empty, one row, many rows
- S3 · a server error and no connection → a message in the user's language; retry works. The web's
  "no connection" is a Playwright spec case the build adds (`context.setOffline(true)`) — the browser
  pane cannot drop the network; the iPhone cannot either, so Android covers the phone
- S4 · a double tap, or a tap while sending → one action only
- S5 · go back, then submit again
- S6 · the session ends mid-flow → sign in, then return to the same place
- S7 · Hindi and Marathi: the longest labels fit; the language changes mid-flow
- S8 · strange input: the maximum length, emoji, Devanagari, spaces, 0, negative numbers
- S9 · a role that may not do it → the action is hidden or refused
- S10 · every icon-only button has a label
- S11 · it looks like the export: spacing, sizes, icons, order

**Screen health** — every changed screen, at each width and on both phones
- H1 · every element the export shows is visible: on screen, not clipped, covered or pushed off
- H2 · each element sits where the export puts it — left, right or centre, measured as its margins
  to the screen edges
- H3 · no two elements overlap, unless the design layers them on purpose
- H4 · nothing sits under the status bar or the home bar; the last item scrolls fully above the
  bottom navigation
- H5 · no console error (it fails the check); a new console warning is a finding
- H6 · pressed, focused, disabled, selected and error states look as the design shows them
- H7 · large text — 200% on web, the largest phone text size — nothing clips or overlaps
- H8 · every tap target measures at least 44 on the built screen
- H9 · on a phone set to dark mode, the app still looks exactly as in light mode
- H10 · the right fonts render — Devanagari in its own face, never a system fallback
- H11 · walked as a first-time user: the job is finished without hesitation; each moment of doubt
  is a finding

**Web only**
- W1 · width 375 and 1536
- W2 · keyboard only: tab order, visible focus, Enter and Escape
- W3 · reload the page mid-flow
- W4 · axe reports no serious problem (the web regression suite runs it)

**Phone only**
- M1 · the smallest and the largest supported phone
- M2 · the app goes to the background and returns; the app is killed mid-action
- M3 · the keyboard covers no field
- M4 · the Android back button

**Money** — when money is in scope
- $1 · BOM, proposal and tranches agree to the paisa
- $2 · lakh and crore grouping in every language
- $3 · every figure shows its provenance tier; a stale figure reads provisional

**Side effects** — SMS, push, payment, webhook
- E1 · sent to a sandbox only, and safe when sent twice
