# HelioGrid — constitution

Multi-tenant SaaS for solar EPC companies — India-first, global-capable: CRM → survey →
3D design → proposal → customer link → projects → payments; voice follow-up later. The 3D Design
Studio is the flagship. Light and dark · EN/HI/MR · tenant-currency money (INR v1).

## 1. Core principles

**The end-user law comes first, above every other rule.** Before a screen is built, say in one
line who uses it (owners, reps, surveyors, installers — often on a phone, outdoors, in a hurry, in
their own language), what they came to do and what could frustrate them. The main job is obvious in
two seconds and takes the fewest taps; nothing is hidden without a reason; a wait feels short
(skeletons, instant feedback); no words sit in images. A screen that is correct but leaves them
stuck, slow or unsure is not done.

**A better approach than the task's** — one that meets the same PRD row more simply — is taken and
written into the plan with one reason. Never switch silently.

**Verify reality.** A claim about this repo names the file and line that proves it. A bug is
reproduced on the RUNNING app, never a mock. Read failures, not exit codes, and call sites, not
declarations. A check you add or change is trusted only after it fires on a planted bad line
(`.claude/rules/testing.md`).

**A bug found in what this change touches is fixed in this change**, and listed in the PR body by
its kind; only what §4 keeps for the owner is raised to them. A behaviour fix starts with a test that fails for the bug. A new check or rule line is added
only when the same mistake can happen again and nothing that exists would catch it — a type, a lint
rule or a test first; prose only when no machine can decide it, in the file that owns it
(`.claude/agents/code-reviewer.md`, a package `CLAUDE.md` Traps, a `.claude/rules/`
file). A new file or step only when none fits, and the PR says why.

**No new script.** A code fact goes into a type, Biome, dependency-cruiser or a test. A script or
a `package.json` command is added only when none of those can hold the fact, and the PR says why.

**A rule is written once, plainly, with no date** — cite it elsewhere, never restate it; when and
why it changed is the commit's job.

## 2. The Laws

Law ids are stable — never reuse or renumber one.

1. **Foundation before features.** Feature modules build only on landed foundation.
3. **Contracts before code.** requirements → domain model → contract → shared types →
   migration → implementation → verification → docs. Never in reverse.
5. **Reuse before creation.** Search first; creating what exists is a defect.
7. **One prop contract per shared component.** Both platform files implement the one
   `<Name>.types.ts`; a prop belongs to that contract, never to a single platform.
8. **Fix the harness your change made wrong** — same commit: `CLAUDE.md`, `.claude/**`, a package
   `CLAUDE.md`, the configs and `.env.example`. Product docs (`docs/prd/`, `docs/tasks/`) are
   reference: where one disagrees with the code, the code wins and the doc is not rewritten to
   match. Cleaning up is always allowed — a change that DELETES or MOVES files removes every
   pointer to them anywhere, `docs/` included, and a dead doc is deleted.
9. **Incremental schema & API growth.** Tables, enums, contracts and endpoints are authored only
   when their owning module's slice begins.
10. **Platform purity.** A shared package holds no DOM, React Native or Node-only API outside a
    declared platform entry — ui's `.tsx`/`.native.tsx` halves, i18n's `./rn`, a `./server` entry.
11. **Flows are authored once.** Shared state vocabulary and view-model types live in a shared
    package before either screen consumes them. Screens render; they don't hold policy.

## 3. Workflow

Product work follows ONE order, `docs/build-order.md`: one block — a module and the tasks its row
names — per PR. The session decides how to plan, build and prove it; the owner
keeps what §4 lists. A change that adds or reshapes a screen no approved design (§6) is built to match shows the owner
three strong samples in
the approved design language (§10), each as good as the best product work on Dribbble, before it
builds, at phone and desktop width; the owner picks one, the plan names the pick, and the build
follows it. A fix that keeps a screen's parts and layout (spacing, alignment, copy, one part's
colour swapped for another existing token, or a bug inside one part) skips the samples and shows the
owner a before/after screenshot at phone and desktop width; its frame stays the approved design or
the sample the owner picked for that screen. A token's value is §10's and waits for the owner.

**Building UI from its design** (the approved design or the picked sample):
- Build what it draws, with its sizes. Never drop a part silently.
- A part whose feature is not built yet is a placeholder in its place that tells the user it is
  coming (a 3D row's model picture: "3D preview coming soon"). The task that builds the feature
  replaces it.
- A mistake in the design (a broken rule, a missing state, a misfit) is fixed in the UI, never in
  the design.
- Before the report: the running screen beside its design, at the design's phone and desktop sizes,
  in one picture.
- The report lists only what is genuinely wrong or different, one line each: the issue in plain
  words → the fix, with the recommended option first when there is a choice. What matches gets no
  line.

A shared part is reused by importing it, extending its one contract (Law 7) or lifting it into its
shared package first (Law 5) — never by copying it. The session decides when a helper agent or a
fork helps. Two agents never edit the same file at once; after each helper, read `git status` and
`git diff -- docs .claude`; no helper writes an owner ruling.

The plan names, for each new route, who may call it and what each other role gets; a tenant route
also names its other-company 404. Each is an api test before a screen uses the route.

**A PR is complete:** every acceptance line of its tasks is met and proven before it opens, or by
its CI lane; `code-reviewer` has reviewed the change, every confirmed finding is fixed and every
possible one is proven and fixed or closed with one reason in the PR's *Notes*, and a later fix
that touches money, tenancy or permissions is reviewed again; and CI is green — its `quality` job is the full gate, with no `SKIP ` line, `e2e-web` every web flow and
`android` every phone flow, run unless `PHONE_E2E` is `off`. The full gate and the full suites are
CI's alone: before the push the session runs `pnpm check` and only the web specs and phone flows
the change adds or edits.

Stale build output keeps a check red on code that is gone after a delete or a branch switch →
delete the git-ignored `dist/` or `apps/web/.next`, then `pnpm turbo build --force`.

## 4. What the owner keeps

- **Every commit** waits for the owner's yes to its file list and message, and the staged list
  (`git diff --cached --name-only`) is exactly that list; one yes is one commit and its push. A
  branch behind `origin/main` merges it, never rebases.
- **The merge.** Every PR is merged by the owner. Never `--no-verify`, never force-push, never
  push to `main` (`.claude/settings.json` denies them).
- **The plan:** a block is built only after the owner's yes to its plan.
- **The look:** the owner picks one of the three samples (§3), and a change to the design
  language itself (§10) waits for their yes.
- **Anything billable or external-account-shaped** (cloud, store accounts, paid APIs): stop and ask.
- **Their data and machines:** never write the database directly (only the disposable
  `heliogrid_test` is rebuilt, §5), never touch a product volume, and leave what they left as found
  — their dev servers, devices, browser tabs, and a dirty tree on another branch (never switch it)
  — except an `api`, `web` or `worker` started from `.claude/launch.json`, stopped as
  `tests/e2e/CLAUDE.md` *Running the app for QA* says.

Everything else is decided in the session, with one reason written in the plan. Nothing is built
that no PRD row implies. Schema or API work a later module owns (Law 9) is written into that
module's task in `docs/tasks/`, never built here.

## 5. Commands

- `pnpm infra:up` · `pnpm infra:down` — the local Docker stack.
- `pnpm check` — the fast check on what differs from `origin/main`, with the unit tests of the
  changed packages; never the proof. Run it without the test-database prefix: the api's database
  tests are CI's, or one file at a time (`.claude/rules/testing.md`).
- `pnpm check:all` — the full gate. CI's `quality` job runs it; run
  it here only to reproduce a red `quality` job, on the test database, with 3002 and 8084 free and
  no worker on `heliogrid_dev`.
- `pnpm lint:fix` — format and auto-fix.
- `pnpm db:migration:new` · `pnpm db:migrate` — every migration starts here; never hand-author one.

Tests, invariants and QA run on `heliogrid_test`, never the owner's `heliogrid_dev`: put **the
test-database prefix** in front of the command — it stops when it cannot point both URLs there:

```bash
export DATABASE_URL="$(sed -n 's/^DATABASE_URL=//p' .env.local | sed 's/heliogrid_dev/heliogrid_test/')" DATABASE_ADMIN_URL="$(sed -n 's/^DATABASE_ADMIN_URL=//p' .env.local | sed 's/heliogrid_dev/heliogrid_test/')" && [[ "$DATABASE_URL $DATABASE_ADMIN_URL" == *heliogrid_test*heliogrid_test* ]] &&
```

Rebuild it as `infra/README.md` says.

The api tests, the web flows and the invariants refuse `heliogrid_dev`. An invariant that SKIPs (no
database) or reports VACUOUS (empty schema) has not passed. Never weaken a check to make a change
pass. One session at a time uses the test database, the ports, `.qa/` and `.env.local`. Inside
it, `qa-live` agents share the one running app and run in parallel; while they run, no agent edits
code, builds, migrates or runs the gate or a test suite, and those jobs run one at a time.

**Ports are dedicated:** web 3002 · api 8084 · Metro 8081 · Postgres 5544 · object store 9000 ·
Temporal 7233 · component tests 3100. Reuse a healthy HelioGrid service; free a foreign listener
only through the `clean-dev-ports` launch configuration, never by port or process name.

## 6. Where everything lives

`docs/engineering/architecture.md` is the authority: §2 says what each package owns and may import,
§4 where a new file goes — run §4 before creating one. Import a package only through its
`package.json` `exports`. Never invent a folder; a new category is a plan-time decision.
`docs/README.md` maps every document.

- `docs/prd/` · `docs/tasks/` — the product spec and the tasks: reference for what to build (Law 8).
- `.claude/rules/` — a law that spans packages; a one-package rule goes in that package's
  `CLAUDE.md`.
- `.qa/` (git-ignored) — the session's `*.log` files (the dev servers' and each check's), the api
  check's `*.cookies` and live QA's `*.png`, deleted once its QA is done; `pr-body.md`, the PR's
  draft; and `env.local.dev`, the owner's `.env.local` while the app runs on the test database —
  a session that finds it left moves it back to `.env.local` before anything else. Once the PR is
  ready, everything else is deleted.
- The approved design canvas — not in the repo: <https://claude.ai/artifact/AhGc2c1KLPE8L1q8z8d4cP>
  (Dashboard, CRM and Onboarding, desktop and phone). It shows the language; a module it draws
  that is not built yet is not built from it.
- The approved proposal design — not in the repo: <https://claude.ai/artifact/75zfrELePy6UND3K7fe3uL>
  (block 8: the lead's proposals, the builder, the document, share, the customer link, Won, the
  forecast and Proposal defaults — phone and desktop, light and dark). It is a working prototype
  on `packages/ui`, and its source and pictures are published with it under `source/`. A screen it
  draws is built to match it.
- `.ops/` (git-ignored) — the owner's private record of external accounts and each environment's
  values; a console change updates it the same day.

## 7. When rules conflict

Higher wins: **the product spec (`docs/prd/`; a row carries its own ruling) →
`docs/engineering/architecture.md` → contracts → design system → this file → package `CLAUDE.md`
→ implementation detail.** A package `CLAUDE.md` beats a `.claude/rules/` file, being closer to
the code. Where a doc and the code disagree, Law 8 says which is fixed.

## 8. Coding standards

- **A shared fact is unspeakable outside its owner.** If a consumer could type the value itself,
  make it a branded type in its owner so importing is the only way to get one. Owners: money and policy numbers → `domain` ·
  user-visible copy → `i18n` · vocabularies → `domain`, derived in `contracts` · visual values →
  `theme` · schema and pools → `db`, queries → the api's `*.repository.ts` files · wire calls →
  `data`.
- **Zero duplication.** A second copy of a definition, formula or shape is a defect even when both
  are correct — they will diverge.
- **The simplest code for today's problem.** No speculative abstraction and no config for one
  caller, unless a PRD row asks for the extension point — then it is built, and an acceptance line
  proves it. Names say what, not how; a comment states a constraint, never a date. A file is split
  by responsibility and named for what it does — never `*2`/`*-extra`, a layer or a document id. A
  package typechecks with `tsc -p`, never `tsc -b`.
- **Every boundary has a contract.** Nothing crosses a package or process edge on an inferred or
  `any` shape; where two sides must agree, the agreement is a type in `packages/contracts`.
- **A release is safe at every step of its roll.** Old app versions, old machines and running
  workflows outlive a release. A change to anything stored or sent between runtimes (row, column,
  enum value, response, workflow message, queued job, cached payload, pack) names its readers and
  proves both ways: old readers read the new shape, new code reads what the old wrote. If it can't,
  ship two releases: expand, then contract.
- **Dependencies change only through `pnpm add`/`pnpm remove`** — never a hand-edited dependency
  block or lockfile.

## 9. Product law

Digest of the foundations `F1`–`F8`, which are canonical.

- Every money and energy figure a user sees carries a provenance tier: measured / derived /
  estimated / assumed, shown as a small quiet pill. Dates, times, counts, durations and progress carry none; nor do an
  identifier, a limit the product enforces, a value the company sets in its own settings, or money
  on the payments surfaces (`F8-01`).
- Money never renders stale — a design changed since the proposal was computed reads provisional.
- One money path: BOM ↔ proposal ↔ tranches ↔ payments reconcile to the currency's minor unit.
- One market and one currency per tenant; market facts (tax, stages, checklists, rails, phone spec)
  resolve from versioned market packs, never hard-coded.
- Sent proposals keep their prices; a price-book update creates a new version.
- Structural adequacy is NEVER computed — an engineer signs off, and the disclaimer travels with
  every structure-bearing output.
- Money renders in the tenant currency's grouping in every locale (INR: lakh/crore); kW/kWh/kWp are
  never translated. A hero figure is Newsreader with tabular figures; money in a list or table
  is Geist Mono.
- Read and export work regardless of billing state. Never hold data hostage.
- The server assigns business identifiers. No feature flags — entitlements are the only gating.

## 10. The design language

The look is the OneOhm design system as the approved canvas (§6) draws it — calm, premium,
minimal — and OneOhm is the start, not the ceiling: where it is weak, build better (speed first,
strong hierarchy, cards that expand when needed, no needless table, 3D only where it explains, the
proposal PDF as polished as the app). Every value is a token in `packages/theme/src/tokens/`, and
`packages/ui` builds every component on them, so a screen composes the parts that hold the look:
`BrandBloom` for the soft logo-colour glow at the top of a page, `HeroPanel` for the one solar-glass
hero per screen, `StatusChip` for status (glyph + word + tint, never colour alone), `Button`'s
`primary` for the main action, `Wordmark` on doors, the sidebar and the phone's top bar (never the
sun tile).

- **Type:** Newsreader for titles, Geist for UI text, Geist Mono for phones and IDs (money: §9).
- **Light and dark** both ship; the default follows the device, and Profile & preferences offers
  Light / Dark / Device, stored on the device. Field mode (sunlight) is a variant of light and wins
  over dark. Every text and surface pair passes WCAG AA in every mode.
- **Phone first, full parity:** iOS, Android and the web have the same features. A screen is
  designed for the phone first, then widened (split panes, more columns, side panels); nothing is
  dropped on the phone — it moves lower, or behind a tab or a sheet. A phone screen has an icon-only
  top bar and the large title below it with one summary line; desktop uses the left sidebar.
- **Native edges:** safe areas (never a hard-coded inset), the bottom pill above the home indicator,
  status-bar icons per theme, fields above the keyboard, Android edge-to-edge and system back (top
  sheet first), iOS swipe-back and the large-title collapse, desktop hover, focus rings, Esc and Enter.
- **Motion:** every interactive element answers and every change of state moves, from the motion
  tokens built into `packages/ui` (`.claude/rules/ui-adherence.md`, *Motion*); Lottie marks the
  moments that matter, played once.
