# HelioGrid — constitution

Multi-tenant SaaS for solar EPC companies — India-first, global-capable: CRM → survey →
3D design → proposal → customer link → voice follow-up → projects → payments. The 3D Design
Studio is the flagship. Light and dark · EN/HI/MR · tenant-currency money (INR v1).

## 1. Core principles

**The end-user law comes first, above every other rule.** Owners, sales reps, surveyors and
installers use HelioGrid worldwide, often on a phone, outdoors, in a hurry, in their own language.
Before a screen is built, say in one line who uses it, what they came to do and what could frustrate
them (small targets, glare, one hand, a slow network). The main job is obvious in two seconds and
takes the fewest taps; nothing is crowded, confusing or hidden without a reason; a mistake is easy to
undo, a wait feels short (skeletons, instant feedback) and success feels good; it works in any
language and region (room for longer text, no words in images, the user's locale and the tenant's
currency). A screen that is correct but leaves the user stuck, slow or unsure is not done.

**A better approach than the task's** — one that meets the same PRD row more simply — is taken and
written into the plan with one reason. Never switch silently.

**Verify reality.** A claim about this repo names the file and line that proves it. A bug is
reproduced on the RUNNING app, never a mock. Read failures, not exit codes, and call sites, not
declarations. A check you add or change is trusted only after it fires on a planted bad line
(`.claude/rules/testing.md`).

**Every mistake leaves a record.** A mistake found in the work — yours, a reviewer's, a check's or
the owner's — is fixed at once and listed in the PR body by its kind. One a machine could have
caught gets that check: a type, a lint rule or a test. One no machine can decide gets one line in
`.claude/skills/task/SKILL.md`, `.claude/agents/code-reviewer.md` or `qa-live.md`, `plan-review.md`
or its package's `CLAUDE.md` Traps — never a new rule file or a new step.

**Avoid over-engineering.** The simplest thing that meets the need. A structure that is poor or hard
to maintain is replaced with one clearly better, and the PR says why in one line.

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
   `CLAUDE.md`, the configs and `.env.example`. Product docs (`docs/prd/`, `docs/tasks/`, RFCs) are
   reference: where one disagrees with the code, the code wins and the doc is not rewritten to
   match. Cleaning up is always allowed — a change that DELETES or MOVES files removes every
   pointer to them anywhere, `docs/` included, and a dead doc is deleted.
9. **Incremental schema & API growth.** Tables, enums, contracts and endpoints are authored only
   when their owning module's slice begins.
10. **Platform purity.** A shared package holds no DOM, React Native or Node-only API outside a
    declared platform entry — ui's `.tsx`/`.native.tsx` halves, i18n's `./rn`, a `./server` entry.
11. **Flows are authored once.** Shared state vocabulary and view-model types live in a shared
    package before either screen consumes them. Screens render; they don't hold policy.
12. **A new fact joins its guard.** A brand, enum, token, route, table or error code you add is
    enrolled with the check that holds its kind (`.claude/protections.md` names it) in the same
    change; a kind no check holds is said out loud.

## 3. Workflow

The work follows ONE order, `docs/build-order.md`, and `/task` (`.claude/skills/task/SKILL.md`)
runs it: one task, one session, one PR. The session decides, builds and proves; the owner keeps
what §4 lists. A task that adds or reshapes a screen shows the owner three strong samples in the
approved design language (§10), each as good as the best product work on Dribbble, before it
builds; the owner picks one, and the build follows it.

**A PR is one complete task:** every acceptance line is met and proven before it opens, or by its
CI lane. After a source file is deleted or a branch switches, stale build output keeps a check red on
code that is gone — `tsc -p` never removes old output, and the web typecheck reads
`apps/web/.next/types` — so delete the git-ignored `dist/` (`rm -r apps/api/dist`) or
`apps/web/.next`, then `pnpm turbo build --force`.

## 4. What the owner keeps

- **Every commit** waits for the owner's yes to its file list and message; one yes is one commit
  and its push.
- **The merge.** Every PR is merged by the owner. Never `--no-verify`, never force-push, never
  push to `main` (`.claude/settings.json` denies them).
- **The plan:** a task is built only after the owner's yes to its plan
  (`.claude/skills/task/SKILL.md` *Plan*).
- **A split:** a task is split into parts only on the owner's word (`docs/tasks/README.md`).
- **The look:** the owner picks one of a UI task's three samples, and a change to the design
  language itself (§10) waits for their yes.
- **Anything billable or external-account-shaped** (cloud, store accounts, paid APIs): stop and ask.
- **Their data and machines:** never write the database directly (`/task` alone rebuilds the
  disposable `heliogrid_test`), never touch a product volume, never stop what they left running
  except as `/task` says.

Everything else is decided in the session and written down with one reason: a reading of the PRD
(the simplest that meets the row), a layer conflict (§7), a bug found on the way (fixed in the
task, §8). Nothing is built that no PRD row implies. Schema or API work a later
module owns (Law 9) is written into that module's task in `docs/tasks/`, never built here.

## 5. Commands

- `pnpm infra:up` · `pnpm infra:down` — the local Docker stack.
- `pnpm check` — the fast check on what differs from `origin/main`, while building; never the proof.
- `pnpm check:all` — the full gate (`.claude/protections.md`, top), on the test database as `/task`
  runs it.
- `pnpm lint:fix` — format and auto-fix.
- `pnpm db:migration:new` · `pnpm db:migrate` — every migration starts here; never hand-author one.

Tests, invariants and QA run on `heliogrid_test`, never the owner's `heliogrid_dev`: put the
test-database prefix (`.claude/skills/task/SKILL.md`, top) in front. The api tests, the web flows
and the invariants refuse `heliogrid_dev`. An invariant that SKIPs (no database) or reports
VACUOUS (empty schema) has not passed. Never weaken
a check to make a change pass.

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
- `.qa/` (git-ignored) — one task's `*.log` files (the dev servers' and each check's), the api
  check's `*.cookies` and live QA's `*.png`, deleted once its QA is done; `pr-body.md`, the PR's
  draft; and `env.local.dev`, the owner's `.env.local` while `/task` points it at the test database —
  never deleted. Once the PR is ready, everything but `env.local.dev` is deleted.
- The approved design canvas — not in the repo: <https://claude.ai/artifact/AhGc2c1KLPE8L1q8z8d4cP>
  (Dashboard, CRM and Onboarding, desktop and phone). It shows the language; a module it draws
  that is not built yet is not built from it.
- `.ops/` (git-ignored) — the owner's private record of external accounts and each environment's
  values; a console change updates it the same day.

## 7. When rules conflict

Higher wins: **the product spec (`docs/prd/`; a row carries its own ruling) →
`docs/engineering/architecture.md` → contracts → design system → this file → package `CLAUDE.md`
→ implementation detail.** A package `CLAUDE.md` beats a cross-cutting rule, being closer to the
code. If a doc and the code disagree, fix the one that is wrong in the same PR.

## 8. Coding standards

- **A shared fact is unspeakable outside its owner.** If a consumer could type the value itself,
  make it a branded type in its owner so importing is the only way to get one. Owners: money and policy numbers → `domain` ·
  user-visible copy → `i18n` · vocabularies → `domain`, derived in `contracts` · visual values →
  `theme` · schema and pools → `db`, queries → the api's `*.repository.ts` files · wire calls →
  `data`.
- **Zero duplication.** A second copy of a definition, formula or shape is a defect even when both
  are correct — they will diverge.
- **Code reads like English or it is rewritten.** Names say WHAT, never how; a reader new to this
  codebase follows a function top to bottom without scrolling back. Needing a comment to explain it
  means the code is wrong. A comment states the CONSTRAINT — what breaks if you change this — and
  never a date; when and why it changed goes in the commit.
- **Solve today's problem.** No speculative abstraction, no config for one caller, no indirection
  for a future that has not been specified — unless a PRD row asks for the extension point; then
  it is built, and an acceptance line proves it.
- **Shape.** A file is split by responsibility (Biome refuses one over 300 lines) and named for what it does —
  never `*2`/`*-extra`, never for a layer or a document id. A package builds and typechecks with
  `tsc -p`, never `tsc -b`.
- **Queries are correct the first time.** Index-backed, no N+1, no `select *`, no unbounded scan,
  every tenant-scoped read carrying its tenant predicate.
- **Every boundary has a contract.** Nothing crosses a package or process edge on an inferred or
  `any` shape; where two sides must agree, the agreement is a type in `packages/contracts`.
- **A release is safe at every step of its roll.** Old app versions, old machines and running
  workflows outlive a release. A change to anything stored or sent between runtimes (row, column,
  enum value, response, workflow message, queued job, cached payload, pack) names its readers and
  proves both ways: old readers read the new shape, new code reads what the old wrote. If it can't,
  ship two releases: expand, then contract.
- **A bug you find is fixed in the task that found it** and listed in the PR body — never deferred,
  never left half-built. Only what §4 keeps for the owner is raised to them instead.
  `docs/tasks/deferred.md` takes no new row; a task closes the rows it meets.
- **Dependencies change only through `pnpm add`/`pnpm remove`** — never a hand-edited dependency
  block or lockfile. Schema goes through a migration, and test or development data through the
  application (§4).

## 9. Product law

Digest of the foundations `F1`–`F8`, which are canonical.

- Every money and energy figure a user sees carries a provenance tier: measured / derived /
  estimated / assumed. Dates, times, counts, durations and progress carry none; nor do an
  identifier, a limit the product enforces or a value the company sets in its own settings (`F8-01`).
- Money never renders stale — a design changed since the proposal was computed reads provisional.
- One money path: BOM ↔ proposal ↔ tranches ↔ payments reconcile to the currency's minor unit.
- One market and one currency per tenant; market facts (tax, stages, checklists, rails, phone spec)
  resolve from versioned market packs, never hard-coded.
- Sent proposals keep their prices; a price-book update creates a new version.
- Structural adequacy is NEVER computed — an engineer signs off, and the disclaimer travels with
  every structure-bearing output.
- Money renders in the tenant currency's grouping in every locale (INR: lakh/crore); kW/kWh/kWp are
  never translated. A hero figure is Newsreader with tabular figures; money in a list or table
  is Geist Mono. Every money or energy figure keeps its provenance tier as a small quiet pill.
- Read and export work regardless of billing state. Never hold data hostage.
- The server assigns business identifiers. No feature flags — entitlements are the only gating.

## 10. The design language

The look is the OneOhm official design system as the approved canvas (§6) draws it: calm, premium,
minimal. A neutral canvas with a soft logo-colour glow at the top; white cards; one *solar glass*
hero per screen (white lit by the logo's green, teal and blue, a faint PV-cell grid in the lit
corner, a 2 px logo-gradient top line); Newsreader for titles and hero figures, Geist for UI text,
Geist Mono for phones, IDs and money in lists; status always glyph + word + tint, never colour
alone; the active nav item a solid ink pill; the primary action the ocean accent. One typed token
source, `packages/theme/src/tokens/`, holds every value; `packages/ui` builds every component on it.

- **OneOhm is the start, not the ceiling.** Where it is weak — a component, a state, accessibility,
  dark mode, motion, phone layout, Devanagari, speed — build better, inside this philosophy: calm
  colours and good type; strong hierarchy and clear status, cards that expand when needed, no
  needless table; each role keeps its own home; motion that is smooth and useful, 3D only where it
  explains (a roof); speed first; the proposal PDF as polished as the app; easy on the eyes.
- **Light and dark.** Both ship. The default follows the device; Profile & preferences offers
  Light / Dark / Device, stored on the device. Field mode (sunlight high contrast) is a variant of
  light and wins over dark while it is on. Every text and surface pair passes WCAG AA in every mode.
- **Mobile-first with full parity.** iOS, Android and the web have the same features. A screen is
  designed for the phone first, then widened (split panes, more columns, side panels). Nothing is
  dropped on the phone: it moves lower, or behind a tab or a sheet.
- **Native on every platform.** One design, native system edges: safe areas on every screen (never a
  hard-coded inset), the floating bottom pill above the home indicator or gesture bar, status-bar
  icons per theme, fields kept above the keyboard, Android edge-to-edge and system back (top sheet
  first), iOS swipe-back and the large-title collapse, desktop hover, focus rings, Esc and Enter.
- **Phone screens use the large title.** The top bar holds only icons; the page title sits below it
  in Newsreader with one summary line. On desktop the same navigation is the left sidebar.
- **Motion everywhere it helps, never in the way.** Every interactive element answers (press,
  hover, focus, select, toggle, expand) and every change of state moves, from the motion tokens,
  built once into `packages/ui`. Lottie marks the moments that matter, played once. Taps answer at
  once, reduced motion shows the end state, a loop stops when its wait ends — calm ambient light
  behind a door or a page's glow is the one that runs on — and only transform and opacity animate
  (`.claude/rules/ui-adherence.md`, *Motion*).
- **The name is the brand.** Doors, the sidebar and the phone's top bar show the HelioGrid wordmark,
  never the sun tile, until a new logo is drawn.
