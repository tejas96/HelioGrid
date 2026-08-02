# Governance Rebuild — Phases 2, 3 & 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the governance rebuild — rewrite the constitution/laws/rules against the
spine (Phase 2), build the agent-based QA system and retire `/qa` (Phase 3), and sweep the
perimeter surfaces the audit found unowned (Phase 4).

**Architecture:** Spec: `docs/superpowers/specs/2026-08-02-governance-rebuild-design.md`
(read §0 decision log, §3 fact-ownership model, §4 hierarchy, §6 agents, §7 QA before
starting). Prerequisite: `docs/superpowers/plans/2026-08-03-governance-rebuild-phase-0-1.md`
must be complete — Phase 2 rewrites files that point at `docs/architecture.md`, which Phase 1
creates. Phase 2 makes every governance file a pointer into the spine; Phase 3 replaces the
Antigravity-driven `/qa` with five Claude Code subagents plus `/verify` and `/finish`; Phase 4
fixes the surfaces no document owned.

**Tech Stack:** Markdown governance docs · Claude Code subagents (`.claude/agents/*.md`),
skills (`.claude/skills/*/SKILL.md`), hooks (`.claude/hooks/*.sh`, `.claude/settings.json`) ·
Biome 2.5.5 · dependency-cruiser 16.10.4 · Turborepo 2.10.7 · pnpm 10.34.5 · postgres:16 in
the existing `heliogrid-pg-local` container.

## Global Constraints

- **No unit tests, ever** — never a `.test.*` or `.spec.*` file (owner directive 2026-07-29).
  `tests/invariants/` is the only executable check layer. Verification is running the thing.
- **Zero Biome warnings/errors repo-wide** after every task: `pnpm lint` stays green.
- **Edit/Write tools only** — never `sed -i` or shell stream edits.
- **Git protocol (spec G-1, owner ruling 2026-08-03):** ALL phases share ONE branch,
  `governance/rebuild`, cut from main — not a branch per phase, and no intermediate merges.
  Phases 2–4 continue committing onto the branch Phase 0 started. One commit per task, one PR
  at the end of the whole rebuild. **Push and PR creation each need an explicit owner yes at
  that moment**; commit messages below are proposals, not authorizations.
- **Surgical diffs:** every changed line traces to a numbered task step here or to the spec's
  Appendix A. Do not reformat, re-wrap, or "improve" adjacent prose.
- **Rule brevity law (CLAUDE.md §8):** an instruction earns its length — state the rule, its
  cost, and the fix in 1–3 lines. War stories go in the commit, not the rule.
- **One definition per fact:** if a fact belongs to the spine, package CLAUDE.md, or docs/17
  matrix, this plan's files carry a *pointer*, never a copy. A pointer is `file §section`.
- **QA agents run on Sonnet** (`model: sonnet` in frontmatter); `arch-reviewer` omits the
  field and inherits the session model (spec G-5).
- **QA never provisions infrastructure** (spec G-3): db checks use the running
  `heliogrid-pg-local` container (postgres:16, host port 5544) via a read-only role. Never
  create a container, never clone a database.
- The date is 2026-08-03. Date-stamp any new landmine or ruling line with it.

---

# PHASE 2 — Rules & laws (continues on `governance/rebuild`)

Phase 1 created `docs/architecture.md` with fixed section numbering: **§1** module map &
dependency direction, **§2** package registry, **§3** platform rules (RN · Next.js · shared),
**§4** placement procedure. Every pointer this phase authors uses those anchors.

### Task 19: Rewrite `docs/17-engineering-governance.md` — laws, hierarchy, protocol

docs/17 becomes the slim meta-doc: the Laws, the decision hierarchy (the ONLY home of the two
tiebreakers), the governance-change protocol, and the matrix (Task 20 rewrites the matrix
body). Laws 10 and 11 are new; Law 8 gains the deletion sweep; Law 1's dead roadmap clause
goes.

**Files:**
- Modify: `docs/17-engineering-governance.md` (§1 Laws, §3, §4; §5 in Task 20)

**Interfaces:**
- Produces: law numbers `10` and `11` (cited by `.claude/rules/00-laws.md` in Task 21, by
  `cross-platform.md` in Task 23, and by `arch-reviewer.md` in Task 29); the phrase
  "deletion sweep" as Law 8's amendment name (cited by Task 29 and Task 33).

- [ ] **Step 1: Replace the Law 1 text (drop the dead roadmap clause)**

Replace exactly:

```markdown
**Law 1 — Foundation before features.** Feature modules build ONLY on the landed
foundation (tokens → components → contracts → guards). Module work proceeds via per-module
roadmaps (§3).
```

with:

```markdown
**Law 1 — Foundation before features.** Feature modules build ONLY on the landed
foundation (tokens → components → contracts → guards). Work is planned per piece under
`docs/superpowers/plans/` (§3).
```

- [ ] **Step 2: Amend Law 8 with the deletion sweep**

Replace exactly:

```markdown
**Law 8 — Fix the docs your change made wrong** — in the same commit, because docs are
load-bearing for the next agent. Docs that are merely adjacent or related are not your
problem. Per-package CLAUDE.md landmines are mandatory on first discovery.
```

with:

```markdown
**Law 8 — Fix the docs your change made wrong** — in the same commit, because docs are
load-bearing for the next agent. Docs that are merely adjacent or related are not your
problem. Per-package CLAUDE.md landmines are mandatory on first discovery.

**The deletion sweep.** A change that DELETES or MOVES a file, package, script or skill
greps for its dead paths across `.claude/`, `docs/`, config files and `.env.example` in the
same change. Deletions are where this law fails: ADR-0023 and ADR-0024 each updated the
rules and package docs and each missed `.claude/skills/`, leaving both skills pointing at
files that no longer existed.
```

- [x] **Step 3: Add Laws 10 and 11 after Law 9** — DONE IN PHASE 1 (2026-08-03). Pulled
forward because the spine cites both laws and `00-laws.md` reads a missing number as a
REMOVED law, so publishing the spine first would have made those citations resolve to
"deleted". Both are already in `docs/17` §1 and the `00-laws.md` digest; verify rather than
re-add. The Law 8 deletion-sweep amendment (Step 2) is still outstanding.

Insert after the `**Law 9 — Incremental schema & API growth.** Detail in §2.` line:

```markdown

**Law 10 — Platform purity.** A shared package is platform-agnostic: no DOM, no React
Native, no Node-only API outside a declared server entry point. Platform-specific work lives
in the owning app behind an adapter. Which package may hold what: `docs/architecture.md` §2;
the platform rules themselves: `docs/architecture.md` §3.

**Law 11 — Flows are authored once.** A flow's state vocabulary and view-model type that
both platforms need is defined in a shared package BEFORE either screen consumes it; screens
render, they do not hold policy. Copy both platforms show lives in `packages/i18n/src/copy`.
The login flow proved the cost: one controller authored twice drifted into five renamed
state fields, an inverted `online`/`offline` polarity, and an unreachable offline banner.
```

- [ ] **Step 4: Fix §3 — the traceability ruling (.qa is retired, not merely uncommitted)**

Replace exactly:

```markdown
What replaces them: **plans are authored per piece of work** under
`docs/superpowers/plans/`, and the record of what was actually run lives in the committed
`.qa/<run-id>/` evidence from `/qa`. `docs/14` remains the cross-module plan of record.
```

with:

```markdown
What replaces them: **plans are authored per piece of work** under
`docs/superpowers/plans/`, and the record of what was actually run is the verification
section `/verify` produces and `/finish` embeds in the pull request. Nothing is written to
the working tree: QA artifacts live in the session scratchpad and are deleted when the run
finishes (owner ruling 2026-08-03). `docs/14` remains the cross-module plan of record.
```

- [ ] **Step 5: Make §4 the sole home of the tiebreakers**

The §4 text already carries both tiebreakers; `.claude/rules/00-laws.md` loses its copy in
Task 21. Append one line to §4 immediately after the second tiebreaker bullet
(`- Where two records disagree, the **later-dated** one wins.`):

```markdown

These two tiebreakers live HERE and nowhere else. `.claude/rules/00-laws.md` points at this
section; a second copy is what let them drift with a false "live only here" claim.
```

- [ ] **Step 6: Insert the level-2/3 hierarchy correction and the governance-change protocol**

Replace exactly:

```markdown
When a doc and code disagree: reconcile the doc, or flag it to the owner.
```

with:

```markdown
When a doc and code disagree: reconcile the doc, or flag it to the owner.

Level 3 (Architecture) is `docs/architecture.md` — the spine. docs/02 and docs/03 are design
records: read them for intent, never for what the repo contains today.

## 4a. Changing governance

- **One canonical home per fact** (`docs/architecture.md` §2 for inter-package facts, this
  file for laws and mechanisms, the package `CLAUDE.md` for intra-package ones). Every other
  mention is a pointer `file §section`. A second copy of a fact is a defect, not redundancy.
- **A digest is declared on both ends.** `.claude/rules/00-laws.md` digests §1 and says so;
  §1 names it. An undeclared restatement is a copy.
- **No hand-maintained counts or consumer lists** anywhere in governance prose. They rot
  fastest: "27 rules" and "21-component" were both wrong within days, and two
  "used by (TODAY)" lists went stale inside 48 hours. State the rule; let `package.json`,
  `turbo.json` and `.dependency-cruiser.cjs` carry the graph.
- **Target-state prose carries a status banner** naming what is not built yet
  (`packages/db/CLAUDE.md` is the pattern — the only doc that survived the auth teardown
  accurate).
- **A rule names the mechanism that holds it** (§5) — and a rule may not claim a mechanism
  that does not exist. Prefer, in order: type → lint rule → instruction → script.

## 4b. Governed surfaces outside this document

- `AGENTS.md` is a symlink to `CLAUDE.md`, giving the constitution a second name for non-Claude
  agents. Renaming or splitting `CLAUDE.md` orphans it — check the symlink in the same change.
- `docs/research/` carries its own NORMATIVE tier. It is binding ONLY where a live doc
  delegates to it by name (docs/08, docs/16 do); otherwise it is background, and two of its
  files recommend a stack this repo rejected.
- `.superpowers/` and any other local-only agent scratch tree is gitignored working state, not
  a record. Nothing may cite it as evidence.
```

- [ ] **Step 7: Verify no dangling references and gates stay green**

Run: `grep -n 'per-module roadmap\|committed `.qa`\|docs/modules/' docs/17-engineering-governance.md`
Expected: no output.

Run: `grep -c 'Law 10\|Law 11' docs/17-engineering-governance.md`
Expected: `2` or more.

Run: `pnpm lint`
Expected: PASS (six gates, zero warnings).

- [ ] **Step 8: Commit**

```bash
git add docs/17-engineering-governance.md
git commit -m "docs(17): laws 10-11, deletion sweep, governance-change protocol"
```

---

### Task 20: Rewrite the docs/17 §5 rule → mechanism matrix

The matrix keeps its rows but gains an honesty column and loses its dead ones. The audit
proved two things the current table hides: turbo tags cannot express `data→ui-api` or
`web→db` (dependency-cruiser holds both), and half of CLAUDE.md §7's product laws appear in
no tier at all.

**Files:**
- Modify: `docs/17-engineering-governance.md` §5

**Interfaces:**
- Consumes: Law numbers from Task 19.
- Produces: matrix row wording cited by `.claude/rules/*` in Tasks 22–24 (rules cite the row,
  never re-describe the mechanism).

- [ ] **Step 1: Replace the §5 preamble to introduce the Holds column**

Replace exactly:

```markdown
Stages: `lint` · `typecheck` · `build` · `invariant` (CI test) · `CI` · `runtime` · `skill` · `prose`.
```

with:

```markdown
Stages: `lint` · `typecheck` · `build` · `invariant` (CI test) · `CI` · `runtime` · `hook` ·
`skill` · `prose`.

**Holds** answers a question "what enforces this?" hides: can the mechanism express the WHOLE
rule (`full`), only part of it (`partial`, with what escapes), or is it redundant cover for a
rule another mechanism actually holds (`cover`)? A `partial` row is not a failure — it is the
row telling the truth about where review still carries the weight.
```

- [ ] **Step 2: Add the Holds column to the "Enforced today" table header**

Replace exactly:

```markdown
| Rule | Mechanism | Stage | Where |
|---|---|---|---|
```

with:

```markdown
| Rule | Mechanism | Stage | Holds | Where |
|---|---|---|---|---|
```

Then add a `full` cell before the final `Where` cell in every existing row of that table,
except the four rows corrected in Steps 3–5 below. (Mechanical edit: each row gains ` full |`
immediately before its last ` | \`path\` |` segment.)

- [ ] **Step 3: Correct the boundaries row — turbo tags are cover, not the enforcer**

Replace exactly:

```markdown
| Package encapsulation | Turborepo Boundaries tags — in each package's own `turbo.json`, never `package.json` | lint | per-package `turbo.json` |
```

with:

```markdown
| Package encapsulation | Turborepo Boundaries tags — in each package's own `turbo.json`, never `package.json` | lint | cover — tags are coarser than the documented bans: `web→db` passes tags (all four apps share one `app` tag). dependency-cruiser holds those; `ui-api` got its own tag in Phase 0 | per-package `turbo.json` |
```

- [ ] **Step 4: Correct the dependency-direction row — drop the rotting count**

Replace exactly:

```markdown
| Dependency direction & layer purity | dependency-cruiser, 27 rules, all `error` | lint | `.dependency-cruiser.cjs` |
```

with:

```markdown
| Dependency direction & layer purity | dependency-cruiser, every rule `error` — the authoritative boundary enforcer | lint | full | `.dependency-cruiser.cjs` |
```

- [ ] **Step 5: Replace the "fact both platforms need" row with the Law 11 row**

Replace exactly:

```markdown
| A fact both platforms need lives in a package | **Nothing enforces this.** Parity is checked at the component API; what a SCREEN authors inline is unchecked, so the same constant, type or helper gets written twice and drifts. Detecting it mechanically means comparing meaning, not text — jscpd misses it (same value, different name). Held by review and by defining shared facts before the screens | review | review, `packages/domain` |
```

with:

```markdown
| Flows are authored once (Law 11) | `qa-parity` compares both implementations per feature — state vocabulary, behavioural guards, loading/offline affordances, msgid identity. No static mechanism exists: detecting it means comparing MEANING, not text (jscpd misses same-value-different-name) | skill | partial — catches drift in what a run exercises; a flow nobody QAs is held only by review | `.claude/agents/qa-parity.md`, review |
```

- [ ] **Step 6: Delete the two dead rows**

Delete this row entirely (the `.claude/agents/` it cites was deleted 2026-07-31; the agents
Phase 3 creates are QA executors, not review lenses):

```markdown
| Review lenses cannot mutate what they review | the three lens agents hold `Read, Grep, Glob` and not Bash | subagent config | `.claude/agents/*.md` |
```

In the "Prose — with justification" table, delete the `/doc-sync` row entirely:

```markdown
| Reference integrity (`docs/NN §M`, section citations, relative links) | Owner ruling 2026-07-30: greps, not a checker script. Three greps over `git ls-files`; two `docs/08 §…` citations inside sha256-locked migrations are unfixable and skipped by name | `/doc-sync` |
```

- [ ] **Step 7: Rewrite the prose rows that point at nothing, and add the hook rows**

In the "Prose — with justification" table, replace exactly:

```markdown
| No unprompted push, branch or PR | An agent's own restraint; the harness no longer blocks it (hooks removed 2026-07-31 — they caught zero real mistakes and blocked legitimate work) | `CLAUDE.md` §Process |
| No in-place stream edits (`sed -i`) | Same. The rule stands because those edits corrupted files here; nothing enforces it | `CLAUDE.md` §Process |
```

with:

```markdown
| Push and PR need an explicit owner yes | An agent's own restraint — the harness cannot tell an approved push from an unapproved one | `CLAUDE.md` §Git, `/finish` |
| No in-place stream edits (`sed -i`) | Those edits corrupted files here; a Bash pattern ban would also block legitimate read-only `sed` | `CLAUDE.md` §Process |
| Reference integrity (`docs/NN §M`, citations, relative links) | Owner ruling 2026-07-30: greps, not a checker script. Runs as the pointer-integrity pass of the final review | `arch-reviewer`, `/finish` |
| `VERIFIED` claims carry real evidence | Evidence *quality* is a judgement no script can make | `/verify` artifact discipline + review |
```

Then delete the now-superseded final row of that table:

```markdown
| `VERIFIED` claims carry real evidence | Evidence *quality* is a judgement no script can make | `/qa` artifact verification + review |
```

And replace the skills row:

```markdown
| Contract-first ordering · migration procedure · Law 8 docs-in-commit | Procedures, not properties — they load on demand as skills | `/contract-change`, `/migration`, `/qa` |
```

with:

```markdown
| Contract-first ordering · migration procedure · verification · task close-out | Procedures, not properties — they load on demand as skills | `/contract-change`, `/migration`, `/verify`, `/finish` |
```

- [ ] **Step 8: Add the six unmapped product-law prose rows**

Append to the "Prose — with justification" table:

```markdown
| Market facts resolve from versioned packs, never hard-coded | No checker distinguishes a market-specific literal from a legitimate constant; `+91` is hard-coded at four screen sites today | review + `docs/architecture.md` §2 (domain) |
| Sent proposals keep their prices | A versioning semantic over rows that do not exist yet — lands with the proposals module's invariant | review |
| Money renders with the tenant currency's market grouping; kW/kWh/kWp never translated | The unit half is a lint-able string ban once a formatter exists; the grouping half is a rendering judgement | review + `.claude/rules/cross-platform.md` |
| Read + export work regardless of billing state | A negative existence claim over every gated surface | review + docs/16 |
| The server assigns business identifiers | Requires knowing which values are business identifiers | review + docs/04 |
| One money path — BOM ↔ proposal ↔ tranches ↔ payments reconcile | Cross-module arithmetic; becomes an invariant when the money tables land | review + `/verify` always-on core |
```

- [ ] **Step 9: Add the three hook rows to "Enforced today"**

Append to the "Enforced today" table (the hooks themselves land in Task 31 — this row set is
written now so the matrix and the hooks ship in the same phase pair; if Task 31 is not yet
done these rows are pending, so add them in Task 31 instead if executing out of order):

```markdown
| Migrations are append-only — at EDIT time | PreToolUse hook refuses Edit/Write on a migration file already in `HEAD` | hook | full | `.claude/hooks/block-applied-migration-edit.sh` |
| No `.test.*` / `.spec.*` file is ever created | PreToolUse hook refuses the Write | hook | full — complements `check:adherence`, which catches files already on disk | `.claude/hooks/block-test-files.sh` |
| `git commit --no-verify` is never used | PreToolUse hook refuses the Bash call | hook | full | `.claude/hooks/block-no-verify.sh` |
```

- [ ] **Step 10: Verify**

Run: `grep -n 'doc-sync\|lens agents\|27 rules' docs/17-engineering-governance.md`
Expected: no output.

Run: `grep -c '| full |\|| partial —\|| cover —' docs/17-engineering-governance.md`
Expected: a count ≥ 30 (every Enforced-today row now declares what it holds).

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add docs/17-engineering-governance.md
git commit -m "docs(17): matrix declares what each mechanism can hold; dead rows removed"
```

---

### Task 21: Rewrite `.claude/rules/00-laws.md`

The always-loaded digest becomes pure digest + pointers: no tiebreaker copies, no restated
reuse principle, no duplicated "never invent a requirement".

**Files:**
- Modify: `.claude/rules/00-laws.md` (full rewrite)

**Interfaces:**
- Consumes: law numbers and names from Task 19.
- Produces: the stop-and-ask trigger list (cited by `CLAUDE.md` §2 in Task 25).

- [ ] **Step 1: Write the new file**

Replace the entire contents of `.claude/rules/00-laws.md` with:

```markdown
# The Laws — one line each (digest of docs/17 §1)

This is the always-loaded digest. Canonical text: `docs/17-engineering-governance.md` §1.
Numbers are stable ids, never reused or renumbered — a gap is a law that was removed (2, 4
and 6 went on 2026-08-01).

1. **Foundation before features.** Feature modules build only on landed foundation.
3. **Contracts before code.** requirements → domain model → API contract → shared types →
   migration → implementation → verification → docs. Never in reverse.
5. **Reuse before creation.** Search first; creating what exists is a defect. Unmocked
   surfaces are COMPOSED from existing vocabulary.
7. **Shared component APIs stay in parity.** A prop or component on one platform only is a
   defect — `@heliogrid/ui-api` and `check:ui-parity` enforce it.
8. **Fix the docs your change made wrong** — same commit. A change that DELETES or MOVES
   files greps `.claude/`, `docs/`, configs and `.env.example` for the dead paths.
9. **Incremental schema & API growth.** Tables, enums, columns, contracts and endpoints are
   authored only when their OWNING module's slice begins.
10. **Platform purity.** Shared packages hold no DOM, no React Native, no Node-only API
    outside a declared server entry. Platform work lives in the owning app.
11. **Flows are authored once.** Shared state vocabulary and view-model types are defined in
    a shared package before either screen consumes them. Screens render; they don't hold
    policy.

## Where the answer lives

- **"Where does this code go?"** → `docs/architecture.md` §4 (placement), §2 (registry).
- **"May X import Y?"** → `docs/architecture.md` §2. **"Is this web-only / RN-only?"** → §3.
- **"What enforces this rule?"** → `docs/17` §5 matrix. **Layer conflict?** → `docs/17` §4.

## Stop and ask the owner before

**Never invent a requirement.** Where docs are missing, ambiguous or contradictory: name the
conflict, state its impact, recommend one option, ask. Silently choosing is the failure this
prevents.

- Anything billable or external-account-shaped (Fly, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- A layer conflict `docs/17` §4 does not resolve.
- A product-shaped finding (missing business rule, UX gap, spec ambiguity) — record it in
  docs/13 or docs/15 first, then continue.
- Pushing a branch or opening a PR (`/finish` proposes; you approve).
```

- [ ] **Step 2: Verify the duplication is gone**

Run: `grep -n 'per-package.*wins\|later-dated\|Shared before local\|Architecture first' .claude/rules/00-laws.md`
Expected: no output (the tiebreakers now live only in docs/17 §4; the working principles
moved into CLAUDE.md §1 in Task 25).

Run: `wc -l .claude/rules/00-laws.md`
Expected: fewer than 50 lines (was 57 with duplicated content).

- [ ] **Step 3: Commit**

```bash
git add .claude/rules/00-laws.md
git commit -m "docs(rules): laws digest points instead of restating"
```

---

### Task 22: Author `.claude/rules/web-platform.md` and `.claude/rules/mobile-platform.md`

The audit found web has NO Server/Client-boundary or DOM-isolation rule, and mobile's RN
rules live in its CLAUDE.md where the lint scope disagrees with them. Both become path rules
that load where the code is authored, pointing at spine §3 for the law.

**Files:**
- Create: `.claude/rules/web-platform.md`
- Create: `.claude/rules/mobile-platform.md`

**Interfaces:**
- Consumes: `docs/architecture.md` §3 (platform rules), Law 10 from Task 19.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write `.claude/rules/web-platform.md`**

```markdown
---
paths:
  - "apps/web/**"
---

# apps/web — Next.js platform boundary

Platform law: `docs/architecture.md` §3. This file is what that law means at edit time.

- **Server by default; `'use client'` is a decision.** A route is a Client Component only
  when it needs state, effects, or browser events. Push the directive as far DOWN the tree as
  it goes: a `'use client'` at the route level opts every child in.
- **`page.tsx` routes and nothing else** — it renders the Screen; container logic lives in
  the feature's Screen and its `use-*.ts` hook (`.claude/rules/ui-adherence.md`).
- **DOM-only APIs (`window`, `document`, `navigator`, `localStorage`) never appear in a
  shared package** (Law 10) and inside `apps/web` only in a Client Component or an effect —
  module scope runs on the server during SSR and will crash the render.
- **Server-only work stays server-only.** Route handlers, server actions and secrets never
  become imports of shared UI: `@heliogrid/env/server` is unimportable from a client file.
- Data reaches a screen through `@heliogrid/data` only (`apps-never-touch-the-wire`, `lint`).
```

- [ ] **Step 2: Write `.claude/rules/mobile-platform.md`**

```markdown
---
paths:
  - "apps/mobile/**"
---

# apps/mobile — React Native platform boundary

Platform law: `docs/architecture.md` §3. This file is what that law means at edit time.

- **Interactive primitives come from `apps/mobile/src/ui`, never `react-native`** —
  AppText, Input, OtpInput, Button, IconButton, Switch, Checkbox, Radio. `View`,
  `ScrollView`, `StyleSheet` and `Platform` are layout and stay allowed. Biome enforces this
  under `src/screens/**`; the rule binds everywhere in `src/`, including `src/lib` and
  `src/navigation`, which lint does not reach.
- **No web-only dependency.** Anything reaching for `document`, `window` or a DOM library
  fails at runtime on device, not at build (Law 10).
- **Native capability (camera, storage, notifications, biometrics) is isolated** behind a
  module under `src/` that the screens import — never called inline from a screen.
- **Bare RN, not Expo.** No `expo-*` package, no EAS config: the build is Gradle/Xcode
  directly. Adding an Expo module is a plan-time decision, not an implementation one.
- **RN suspends timers when backgrounded** — any countdown or elapsed-time calculation is
  wall-clock (timestamp math), never an interval decrement.
- `src/` is a closed set of folder categories; a new one is a plan-time call
  (`apps/mobile/CLAUDE.md`).
```

- [ ] **Step 3: Verify frontmatter parses and lint is green**

Run: `head -5 .claude/rules/web-platform.md .claude/rules/mobile-platform.md`
Expected: each file opens with `---`, a `paths:` key, one glob, and a closing `---`.

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .claude/rules/web-platform.md .claude/rules/mobile-platform.md
git commit -m "docs(rules): platform boundary rules load where each platform is authored"
```

---

### Task 23: Author `.claude/rules/cross-platform.md` and rescope `i18n.md`

Five rule blocks are duplicated near-verbatim between the two app CLAUDE.mds, and i18n's
app-facing rules never load for app edits — the two findings share one fix: a rule file that
loads for BOTH apps.

**Files:**
- Create: `.claude/rules/cross-platform.md`
- Modify: `.claude/rules/i18n.md` (remove the app-facing bullets that move)

**Interfaces:**
- Consumes: Law 11 from Task 19.
- Produces: the file both app CLAUDE.mds point at when Task 24 removes their duplicated
  blocks.

- [ ] **Step 1: Write `.claude/rules/cross-platform.md`**

```markdown
---
paths:
  - "apps/web/**"
  - "apps/mobile/**"
---

# Both platforms — author the fact once (Law 11)

Before writing a constant, type, hook or copy string in a screen, ask which package owns it
(`docs/architecture.md` §4). Screens are the unguarded surface: almost nothing here is gated.

- **Shared state vocabulary and view-model types live in `@heliogrid/domain`** and are
  imported by both controllers. The login flow drifted into five renamed fields and an
  inverted `online`/`offline` polarity because each platform named its own.
- **Data reaches a screen through `@heliogrid/data`.** No `@ts-rest/*`, no auth client, no
  raw HTTP client, no `fetch` wrapper of your own (`apps-never-touch-the-wire`, `lint`).
- **Form state comes from `@heliogrid/forms`** — `useZodForm`, `Controller`, and `z`. The
  app bundler's own `zod` is a different instance, so schemas built with it never get the
  translated error map (hit 2026-08-02).
- **Copy both platforms show lives in `packages/i18n/src/copy`**, imported by both. A msgid
  authored inline in two screens forks on a one-character edit and the extract guard passes
  green — it checks freshness, not cross-platform identity.
- **Never mix macro `<Trans>` and explicit-id usage for the same string** — the extractor
  forks them into duplicate `.po` entries. Cost real translations on 2026-07-26. (Biome bans
  the macro import; the diagnostic names the fix.)
- **Never translate:** kW, kWh, kWp, brand names, utility/DISCOM proper nouns. Money renders
  with the tenant currency's market grouping in every locale (INR: lakh/crore) — never a
  locale-default separator.
- **Hindi and Marathi need 20–30% more width than English.** A layout that only fits English
  is not done.
- A behaviour that is deliberately different per platform is recorded in `docs/13` as a
  UXG-PAR row. Undocumented divergence is drift.
```

- [ ] **Step 2: Remove the three app-facing bullets from `.claude/rules/i18n.md`**

Delete exactly these three bullets (they now live in `cross-platform.md`, which loads for the
screens where they apply):

```markdown
- **Never mix macro `<Trans>` and explicit-id usage for the same string** — the extractor
  forks them into duplicate `.po` entries. This cost real translations on 2026-07-26.
- **Never translate:** kW, kWh, kWp, brand names, utility/DISCOM proper nouns. Money renders
  via the shared formatter with the tenant currency's market grouping in every locale
  (INR: lakh/crore) — never a locale-default thousands separator.
```

and

```markdown
- Hindi and Marathi need 20–30% more width than English. A layout that only fits English
  is not done.
```

Then insert in their place:

```markdown
- App-facing catalog rules (Trans convention, untranslated units, script width) live in
  `.claude/rules/cross-platform.md` — they load where screens are authored, which this file
  does not reach.
```

- [ ] **Step 3: Verify each rule now loads where its behaviour is authored**

Run: `grep -n 'paths:' -A 4 .claude/rules/cross-platform.md`
Expected: both `apps/web/**` and `apps/mobile/**`.

Run: `grep -n 'Never translate\|20–30' .claude/rules/i18n.md`
Expected: no output (moved to cross-platform.md).

- [ ] **Step 4: Commit**

```bash
git add .claude/rules/cross-platform.md .claude/rules/i18n.md
git commit -m "docs(rules): one cross-platform rule file replaces five duplicated blocks"
```

---

### Task 24: De-duplicate `contracts.md`, `db-schema.md` and `ui-adherence.md`

Each path rule keeps only what its package CLAUDE.md does not say. The package file wins on
intra-package facts (docs/17 §4 tiebreaker); the rule carries the cross-cutting delta.

**Files:**
- Modify: `.claude/rules/contracts.md`
- Modify: `.claude/rules/db-schema.md`
- Modify: `.claude/rules/ui-adherence.md`

**Interfaces:**
- Consumes: `packages/contracts/CLAUDE.md` and `packages/db/CLAUDE.md` as slimmed by Phase 1
  Task 13.

- [ ] **Step 1: Rewrite `.claude/rules/contracts.md` body**

Replace everything after the frontmatter and `# Contracts — the API review surface` heading
with:

```markdown
- **The contract diff comes FIRST.** Change `packages/contracts` before implementing an
  endpoint or a client. The diff IS the API review (Law 3).
- `tenant_id` NEVER travels in a request body — it comes from verified session claims.
  (`tests/invariants/src/contract-tenancy-scan.ts` proves it.)
- **One `z.enum` per business set**, exported with its inferred type. Consumers import the
  type; they never re-declare the values.
- pgEnum values in `packages/db` mirror these lists and
  `tests/invariants/src/enum-parity.ts` proves both directions — `db-no-upward` forbids the
  import, so change both sides in the same slice.
- Money crosses the wire as a decimal string scaled to the currency's minor unit (INR: 2 dp),
  never a float; money-bearing payloads carry `currency_code` at document level.
- Every non-2xx response uses the canonical envelope (`error.ts` + `errorHttpStatusByCode`).
  A route declaring a NON-base error code needs `ContractException` with that literal on the
  server, or the wire silently carries the wrong code with a green typecheck.
- Protocol constants clients need live in `@heliogrid/domain`, not here — a contract that
  needs one imports it. Never hard-code one in a client.
- Zod is pinned at 3.x and `zod/v4` is Biome-banned (ts-rest Zod-4 support is still RC).

Package-local conventions (exports map, file layout, the Zod pin's history):
`packages/contracts/CLAUDE.md`. Changing a contract has a sequence — run `/contract-change`.
```

- [ ] **Step 2: Collapse the enum-parity bullet in `.claude/rules/db-schema.md`**

Replace exactly:

```markdown
- **pgEnum values mirror the contracts `z.enum`s, and `tests/invariants/src/enum-parity.ts`
  PROVES it** — live `pg_enum` against the contract schemas, both directions, plus a check
  that a new pg enum is either mapped or listed in `NO_CONTRACT_YET`. `db-no-upward` still
  forbids importing contracts here, so change both sides in the same slice; the invariant is
  what stops one side moving alone. (This bullet used to say nothing checked them, while
  packages/db/CLAUDE.md and docs/17 both said the opposite — and all three load into the
  same turn.)
  **Vacuous today** (zero tables, zero enums) and says so. `tenant_status`/`user_status`/
  `invite_status` mappings were dropped with the auth contract — re-add them with the
  migration that re-creates those enums; the invariant cannot flag a mapping nobody wrote.
```

with:

```markdown
- **pgEnum values mirror the contracts `z.enum`s**; `tests/invariants/src/enum-parity.ts`
  proves both directions and flags an unmapped enum. `db-no-upward` forbids importing
  contracts here, so change both sides in the same slice. The invariant is **vacuous while
  the schema is empty** and says so when it runs — re-add the dropped auth enum mappings
  with the migration that re-creates them (`packages/db/CLAUDE.md`).
```

- [ ] **Step 3: Point the duplicated visual-map and width bullets at their owners**

In `.claude/rules/ui-adherence.md`, replace exactly:

```markdown
- Status/variant → visual maps are `Record<TheEnum, …>` so a new contract value fails to
  compile here rather than rendering blank.
```

with:

```markdown
- Status/variant → visual maps are `Record<TheEnum, …>` (`.claude/rules/contracts.md` — the
  enum is the definition; this is why the map must be exhaustive).
```

and replace exactly:

```markdown
Hindi renders without clipping (allow 20–30% expansion) · numbers carry provenance ·
shared component APIs in parity (Law 7).
```

with:

```markdown
Hindi renders without clipping (`.claude/rules/cross-platform.md`) · numbers carry
provenance · shared component APIs in parity (Law 7).
```

- [ ] **Step 4: Verify no fact is now stated twice across co-loading files**

Run: `grep -rn '20–30%' .claude/rules/`
Expected: exactly one hit, in `cross-platform.md`.

Run: `grep -rln 'Record<TheEnum' .claude/rules/`
Expected: two files — `contracts.md` (the definition) and `ui-adherence.md` (the pointer).

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .claude/rules/contracts.md .claude/rules/db-schema.md .claude/rules/ui-adherence.md
git commit -m "docs(rules): path rules carry deltas, package files carry the facts"
```

---

### Task 25: Rewrite `CLAUDE.md` as the thin constitution

CLAUDE.md loses every architecture fact (spine §2/§3/§4 own them), gains the new default
workflow and the git protocol, dates its product-law digest, and states plugin precedence.

**Files:**
- Modify: `/Volumes/works-space/heliogrid/CLAUDE.md` (full rewrite of §1, §2, §5, §6, §8, §9)

**Interfaces:**
- Consumes: `docs/architecture.md` §2/§3/§4; `.claude/rules/00-laws.md` (Task 21); `/verify`
  and `/finish` (Phase 3 Tasks 27–30 — the citations land now and the skills land in Phase 3;
  Phase 2's PR therefore names two skills that arrive one PR later. Note it in the PR body).
- Produces: the §Git section cited by docs/17's matrix row (Task 20 Step 7).

- [ ] **Step 1: Replace §1 "What good looks like"**

Replace the entire `## 1. What good looks like` section (from the heading to the line before
`## 2. Think before coding`) with:

```markdown
## 1. What good looks like

- **Architecture decides placement, not habit.** Before writing a new file, constant, type or
  helper, run `docs/architecture.md` §4 — it names the owning package. §2 says what each
  package may hold and may import; §3 says what is web-only, RN-only, or shared.
- **Compose, don't rebuild.** `packages/` holds the vocabulary; app code spends it. When a
  primitive you need isn't there, ADD it to the package — never inline a local copy. If lint
  says an element or import is restricted, that is this rule.
- **One definition per fact.** A fact both platforms need is defined in a package BEFORE
  either screen uses it (Law 11). Enums → contracts. Shared logic, policy numbers and
  formatters → domain. Visual values → tokens. Schema → migrations. Copy → the i18n catalog.
- **Screens are the unguarded surface.** The gates check packages; almost nothing checks what
  a screen authors inline, and that is where every recent defect landed.
- **Verified means you ran it.** Green gates never prove UI work. `/verify` drives the real
  surfaces — browser for web, simulator for iOS, adb for Android, curl for api. A task is
  done when you have looked at it. A red probe proves nothing until you read WHY it went red.
- **Read call sites, not declarations.** Two platforms reach the same behaviour through
  differently-named state. Comparing what each side DECLARES produces confident, wrong findings.
- **Minimise blast radius.** If something small needs edits across many unrelated files, the
  architecture is wrong. Say so before writing the workaround.
- **Small and honest beats broad and hedged.** Say what you checked and what you did not.
```

- [ ] **Step 2: Replace §5's workflow with the standard loop**

Replace the entire `## 5. Goal-driven execution` section with:

```markdown
## 5. The loop — every piece of work

**Brainstorm → plan → implement → `/verify` → `/finish`.**

1. **Brainstorm** (superpowers) — a spec under `docs/superpowers/specs/`. Skip only for a
   change whose shape is not in question.
2. **Plan** (superpowers) — a plan under `docs/superpowers/plans/`. Every plan carries two
   mandatory sections: **Architecture Placement** (each new file's owning package per
   `docs/architecture.md` §4, decided BEFORE code) and **Verification Plan** (which surfaces
   `/verify` will drive and what proves each step).
3. **Implement** — the plan's tasks, in order, each ending in a working state.
4. **`/verify`** — the QA loop. This repo has NO unit tests (§8); running the thing is the
   only proof.
5. **`/finish`** — gates, architecture review, then the PR proposal.

Turn the task into something checkable before starting:

- "Add validation" → drive the invalid inputs through `/verify`; read the error envelope and
  the status the contract declares.
- "Fix the bug" → reproduce it on the real surface first, then show those same steps passing.
- "Refactor X" → gates green before and after, plus the screen actually walked.
- Schema or tenancy work → `pnpm turbo test` runs `tests/invariants/`; that is the proof.
```

- [ ] **Step 3: Replace the git bullet in §8 with a §Git section**

Replace exactly:

```markdown
- **Git is manual.** Commit only when asked for a commit, in those words. Finishing the work
  is not a trigger, and neither is "fix it" — that authorises the fix, not the commit. Leave
  changes in the working tree and say what is there. When asked, prefer several small commits
  over one sweep: the diff is what the owner reads. Branches and PRs only on explicit command.
```

with:

```markdown
- **Git: work on a branch, propose the PR, never push unasked.** Every piece of work ends
  PR-ready via `/finish`, which proposes the branch name, the commit batching (one commit per
  task by default; for a multi-task flow it offers same-branch-one-commit-per-task vs a PR
  per task) and the PR body carrying the verification record. **Committing, pushing and
  opening the PR each need an explicit owner yes at that moment** (owner ruling 2026-08-03).
  `main` is PR-only — the append-only-migration guard and CODEOWNERS review live in that lane.
  Never `--no-verify`.
```

- [ ] **Step 4: Date the product-law digest and add plugin precedence**

Replace the §7 heading line:

```markdown
## 7. Product law (owner rulings — port, don't reinvent)
```

with:

```markdown
## 7. Product law — digest of docs/15 (owner rulings; docs/15 is canonical)
```

Then append to §8:

```markdown
- **Repo law beats a plugin skill.** Installed skills may trigger on work this repo governs
  differently; where they disagree, this file wins. Named: the test-driven-development skill
  never applies here — there are no unit tests, and `/verify` is the verification mechanism.
```

- [ ] **Step 5: Rewrite §9 "Where things are" as the pointer map**

Replace the entire `## 9. Where things are` section with:

```markdown
## 9. Where things are

**Architecture is `docs/architecture.md`** — §1 module map, §2 package registry (what each
package owns, may import, and may never hold), §3 platform rules (RN · Next.js · shared),
§4 the placement procedure. Read §4 before creating any file. docs/02 and docs/03 are design
records: intent, not current contents.

The Laws and stop-and-ask triggers: `.claude/rules/00-laws.md` (auto-loads, as do the
path-scoped rules: `web-platform`, `mobile-platform`, `cross-platform`, `ui-adherence`,
`contracts`, `db-schema`, `i18n`). Governance, the decision hierarchy and the rule →
mechanism matrix: `docs/17`. Product truth: docs/15 rulings and the docs/13 UX-gap register.
Package-local conventions and landmines: each package's own CLAUDE.md. `docs/adr/` is
reference only.

**Where work lives:** a spec per piece of work under `docs/superpowers/specs/`, a plan under
`docs/superpowers/plans/`, and the verification record in the PR body — `/verify` writes
nothing to the working tree. `docs/14` is the cross-module plan of record;
`docs/forward-compat.md` holds design constraints that must be honoured early.

**Skills:** `/contract-change`, `/migration`, `/verify`, `/finish`.

**Auth is absent** (ADR-0024): db is greenfield, tenancy unproven, both logins on a
walkthrough stub the rebuild deletes.
```

- [ ] **Step 6: Verify no architecture facts remain in CLAUDE.md**

Run: `grep -n 'packages/data, nothing else\|ADR-0023\|@ts-rest/\* or an auth client' CLAUDE.md`
Expected: no output (that fact now lives in `docs/architecture.md` §2 and the dep-cruiser rule).

Run: `grep -c '/qa' CLAUDE.md`
Expected: `0`.

Run: `wc -l CLAUDE.md`
Expected: under 150 lines.

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: constitution points at the spine; the loop and git protocol land"
```

---

### Task 26: Phase 2 close-out — consistency sweep, gates, PR

**Files:** none created; verification only.

- [ ] **Step 1: Prove every pointer resolves**

Run:

```bash
grep -rhno 'docs/architecture\.md §[0-9]' CLAUDE.md .claude/rules/ docs/17-engineering-governance.md | sort -u
```

Expected: only `§1`, `§2`, `§3`, `§4`. Then confirm each exists:

```bash
grep -n '^## §' docs/architecture.md
```

Expected: four headings, §1 through §4.

- [ ] **Step 2: Prove no governance file cites a deleted thing**

Run:

```bash
grep -rn 'doc-sync\|/lenses\|/roadmap\|/slice\|docs/modules/\|PreToolUse hook also blocks' CLAUDE.md .claude/ docs/17-engineering-governance.md
```

Expected: no output.

- [ ] **Step 3: Full gates**

Run: `pnpm verify`
Expected: PASS end to end. (Needs `DATABASE_URL` pointing at `heliogrid-pg-local` for the
invariants to run rather than skip; without it the run is green but has NOT proven tenancy.)

- [ ] **Step 4: Report Phase 2 to the owner**

Report the commit list on `governance/rebuild` and note for the eventual PR body that
`/verify` and `/finish` are cited by Phase 2's files and land in Phase 3 — the branch is
internally inconsistent until then, which is fine on one branch and would not have been
across separate PRs. Continue to Phase 3; the single PR comes after Phase 4.

---

# PHASE 3 — Agents & workflow (continues on `governance/rebuild`)

### Task 27: Author the four QA surface agents

Each agent is a Sonnet executor with a restricted tool grant. The methodology they follow is
executor-agnostic and ports directly from the retiring `/qa` skill's test matrix; what dies
is every Antigravity CLI mechanic.

**Files:**
- Create: `.claude/agents/qa-web.md`
- Create: `.claude/agents/qa-mobile.md`
- Create: `.claude/agents/qa-api.md`
- Create: `.claude/agents/qa-parity.md`

**Interfaces:**
- Produces: agent names `qa-web`, `qa-mobile`, `qa-api`, `qa-parity` (dispatched by
  `/verify` in Task 29) and the finding shape every agent returns:
  `{surface, step_id, quadrant, verdict: 'pass'|'fail'|'inconclusive', expected, observed, evidence}`.

- [ ] **Step 1: Write `.claude/agents/qa-web.md`**

```markdown
---
name: qa-web
description: Drives the Next.js web app in the browser pane to execute a QA step list and report verdicts with evidence. Dispatched by /verify.
tools: mcp__Claude_Browser__preview_start, mcp__Claude_Browser__preview_logs, mcp__Claude_Browser__navigate, mcp__Claude_Browser__read_page, mcp__Claude_Browser__find, mcp__Claude_Browser__computer, mcp__Claude_Browser__form_input, mcp__Claude_Browser__read_console_messages, mcp__Claude_Browser__read_network_requests, mcp__Claude_Browser__resize_window, mcp__Claude_Browser__javascript_tool, Bash, Read, Grep
model: sonnet
---

You execute a web QA step list against the running Next.js app and report verdicts. You do
NOT fix anything: you never edit a source file, and a step you cannot run is `inconclusive`,
never a pass.

## Start

`preview_start` with `{name: "web"}` (the dev server from `.claude/launch.json`, port 3002).
Navigate to the first step's route.

## Execute each step

1. Perform the actions listed.
2. Read the criterion with `read_page` — the accessibility tree, NOT a screenshot.
   **Assert on exact strings.** A step's `expected` is literal: the tree contains that string
   or the step fails. "Renders correctly" is not a criterion; `Welcome back` present and
   `Loading` absent is.
3. Capture evidence: the matched tree excerpt, plus `read_console_messages` and
   `read_network_requests` output where the step concerns errors or requests.

**Vision is for what only vision catches** — clipping, overlap, truncation, layout collapse
at 375px, broken Devanagari run-splitting. Those steps say so; take a screenshot only there.

**Clean console and clean network are part of every verdict.** A step whose actions produce
a console error or a failed request fails, even when the visible outcome looks right.

Use `resize_window` for the responsive steps (375px and 1440px).

## Report

Return ONLY a JSON array, one object per step:
`{surface: "web", step_id, quadrant, verdict, expected, observed, evidence}`.
`observed` is the exact string or value you read. `evidence` is the tree excerpt, console
line, or request summary that proves it. No prose outside the array.

## Never

Never edit source. Never mark a step passed on a screenshot alone. Never skip a step
silently — report it `inconclusive` with the reason. Never restart the dev server unless a
step's own criterion is a cold start.
```

- [ ] **Step 2: Write `.claude/agents/qa-mobile.md`**

```markdown
---
name: qa-mobile
description: Drives the React Native app on the iOS Simulator and an Android emulator via adb to execute a QA step list and report verdicts with evidence. Dispatched by /verify.
tools: mcp__Claude_Code_iOS_Simulator__control, Bash, Read, Grep
model: sonnet
---

You execute a mobile QA step list on iOS and Android and report verdicts. You do NOT fix
anything: you never edit a source file, and a step you cannot run is `inconclusive`.

## Platforms

- **iOS — the Simulator MCP.** `attach` first (cheap, and it surfaces the device-access
  prompt while the owner is present), then `launch` the built app. `screenshot`, `tap`,
  `text` and `button` drive it headlessly.
- **Android — adb.** There is no simulator panel for Android; drive it from Bash:
  `adb devices` to confirm a booted emulator, `adb shell input tap X Y` / `input text`,
  `adb shell uiautomator dump /sdcard/v.xml && adb shell cat /sdcard/v.xml` to read the view
  tree, `adb logcat -d` for runtime errors.

Run the two platforms in sequence within your own turn; `/verify` runs you in parallel with
the other surfaces.

## Execute each step

1. Perform the actions.
2. Read the criterion from the view tree — iOS accessibility tree, Android `uiautomator`
   XML `text="…"` attributes. **Assert on exact strings.** On 2026-08-02 a blank
   `Loading from …:8081` frame was reported as a full login screen, because the criterion was
   a picture.
3. **Filter the tree.** Never page a whole view tree into context — grep it for the strings
   the step names. A full iOS tree includes every off-screen element (~190 on the gallery)
   and re-reading it per action is what blew a previous run past its timeout.
4. Capture evidence: the matched tree line, plus `adb logcat -d` / simulator log excerpts for
   steps concerning errors.

## Metro (both platforms, debug builds)

The JS bundle loads from Metro on first launch. A screen showing `Loading from` is
**inconclusive, never a fail** — wait for the bundle and re-read. Pre-warm by launching once
before the step list. Mobile legitimately takes ~2× the wall clock of web; that is a property
of RN debug builds.

**RN suspends timers when backgrounded** — a countdown step must assert wall-clock behaviour,
not interval decrement.

## Report

Return ONLY a JSON array, one object per step per platform:
`{surface: "ios"|"android", step_id, quadrant, verdict, expected, observed, evidence}`.
No prose outside the array.

## Never

Never edit source. Never install or boot a device the owner has not provisioned — report
`inconclusive` naming the missing device. Never relaunch the app per step; order steps so
state flows (login → OTP → home → locale → back) and relaunch only where a cold start IS the
test.
```

- [ ] **Step 3: Write `.claude/agents/qa-api.md`**

```markdown
---
name: qa-api
description: Exercises the API with curl and verifies database state with read-only psql against the existing local postgres container. Dispatched by /verify.
tools: Bash, Read, Grep
model: sonnet
---

You execute an API/database QA step list and report verdicts. You do NOT fix anything and
you never write to the database.

## Targets

- **API** — the dev server on port 8084 (`.claude/launch.json` entry `api`). Drive it with
  `curl -i`; assert on the status line and the body bytes.
- **Database** — the ALREADY RUNNING container `heliogrid-pg-local` (postgres:16, host port
  5544). Read-only: `psql -tAc` with a read-only role, `SELECT` only.

**Never create a container, never clone a database, never run a migration, never write a
row** (owner ruling 2026-08-03). If the container is not running, report `inconclusive`
naming it — do not start one.

## Execute each step

1. Issue the request or query exactly as the step names it.
2. Assert on exact bytes: the HTTP status line, the error `code` in the envelope, or the
   scalar psql returns. A step's `expected` is literal.
3. Capture evidence: the `curl -i` head and the relevant body fragment, or the psql output.

## The checks that matter most here

- **Error envelope and status match what the contract declares.** A route declaring a
  non-base error code is exactly where the wire and the typecheck have disagreed before.
- **Cross-tenant access returns 404, never 403** — a 403 leaks that the row exists.
- **Unauthenticated requests to protected routes are rejected.**
- **Money reconciles to the minor unit** of the tenant's currency across the tables a step
  names.

## Report

Return ONLY a JSON array:
`{surface: "api", step_id, quadrant, verdict, expected, observed, evidence}`.
No prose outside the array.
```

- [ ] **Step 4: Write `.claude/agents/qa-parity.md`**

```markdown
---
name: qa-parity
description: Compares the web and mobile implementations of the same feature for behavioural drift, shared-fact duplication and copy divergence. Dispatched by /verify after the surface agents report.
tools: Read, Grep, Glob
model: sonnet
---

You verify Law 11 for one feature: **the platforms agree, and what they share is authored
once.** You read code and the surface agents' reported values. You never edit anything and
never run anything.

Checking a value once per surface proves each surface separately and the important thing not
at all — a shared constant could change on one platform and every per-surface step still
passes. Your job is the comparison.

## What you compare

Given the feature's web files (`apps/web/features/<feature>/`) and mobile files
(`apps/mobile/src/screens/<feature>/`), read BOTH implementations fully — call sites, not
declarations — and report every divergence in these classes:

1. **Shared facts authored twice** — a constant, type, policy number, or hook defined in both
   trees instead of imported from `@heliogrid/domain` or `@heliogrid/data` (Law 11).
2. **State vocabulary drift** — the same fact under different names, and especially inverted
   polarity (`online` vs `offline`). Name both spellings.
3. **Behavioural guard drift** — in-flight/double-submit protection, connectivity gating,
   race handling present on one platform and absent on the other.
4. **Affordance drift** — a loading, error, empty or offline state one platform renders and
   the other does not.
5. **Copy divergence** — the same user-facing string authored inline in both trees rather
   than imported from `packages/i18n/src/copy`; msgids that differ by so much as a character.
6. **Policy in the wrong layer** — a threshold applied in the controller on one platform and
   inside a presentational component on the other.
7. **Observed-value mismatches** — where the surface agents recorded the same quantity
   (OTP box count, input caps, formatted phone string, error copy), assert the values are
   identical. A mismatch is a **blocker**, not a curiosity: record both values verbatim; do
   not average, round, or pick the one that looks right.

## Intentional divergence

A divergence recorded in `docs/13-ux-gap-register.md` as a UXG-PAR row is intentional —
report it as `documented` and cite the row. A divergence with no row is drift, even if it
looks deliberate.

## Report

Return ONLY a JSON array:
`{class, web: {file, line, detail}, mobile: {file, line, detail}, verdict: "drift"|"documented", severity: "blocker"|"major"|"minor"}`.
No prose outside the array.
```

- [ ] **Step 5: Verify the agents are registered**

Run: `ls .claude/agents/ && head -6 .claude/agents/qa-web.md`
Expected: four files; the head shows valid frontmatter with `name`, `description`, `tools`,
`model: sonnet`.

- [ ] **Step 6: Commit**

```bash
git add .claude/agents/
git commit -m "feat(qa): four Sonnet QA surface agents replace the external executor"
```

---

### Task 28: Author `.claude/agents/arch-reviewer.md`

**Files:**
- Create: `.claude/agents/arch-reviewer.md`

**Interfaces:**
- Consumes: `docs/architecture.md` §2/§3/§4; Laws 10 and 11 (Task 19).
- Produces: agent name `arch-reviewer` (dispatched by `/finish` in Task 30).

- [ ] **Step 1: Write the file**

```markdown
---
name: arch-reviewer
description: Reviews a diff for architectural correctness — package ownership, dependency direction, platform boundaries, shared-logic placement, and pointer integrity. Dispatched by /finish before the PR.
tools: Read, Grep, Glob, Bash
---

You review a change for **architectural correctness**, not style. Compiling is not the
standard; the standard is that the code sits where the architecture says it belongs.

Read `docs/architecture.md` §2 (registry), §3 (platform rules) and §4 (placement) first, then
the diff (`git diff main...HEAD`, or `git diff` plus `--cached` when the work is uncommitted).

## What you look for

1. **Wrong package ownership** — a constant, type, helper, formatter or policy number
   authored in an app that §2 assigns to a package. Name the package it belongs in.
2. **Shared logic inside an application** — logic both platforms need, authored in one app
   (Law 11). The login controller drifting into two implementations is the reference defect.
3. **Contracts bypassed** — a hand-written request/response type, a hard-coded enum value, a
   raw HTTP call, an inline status→visual map that should be `Record<TheEnum, …>`.
4. **Tokens bypassed** — a hex literal, an arbitrary px value, an inline style.
5. **Duplicated utilities** — a helper that already exists in `packages/`. Grep before
   accepting a new one.
6. **Dependency violations** — an import §2 forbids, even where dependency-cruiser is blind
   (a fetch wrapper has no import to catch; a type-only import erases).
7. **Platform boundary leaks (Law 10)** — DOM or `window`/`document` in a shared package or
   in RN code; React Native imports on the web side; a Node-only API outside a server entry;
   `'use client'` hoisted higher than it needs to be.
8. **Pointer integrity** — the diff deletes or moves a file that governance still cites.
   Run: `git diff --name-status main...HEAD | awk '$1 ~ /^[DR]/ {print $2}'` and grep each
   dead path across `.claude/`, `docs/`, config files and `.env.example` (Law 8's deletion
   sweep). Every hit is a finding.
9. **New rot-prone content** — a hand-maintained count, a "used by today" list, or a claimed
   mechanism that does not exist. Verify any enforcement claim the diff adds.

## Report

Return ONLY a JSON array:
`{class, file, line, detail, fix, severity: "blocker"|"major"|"minor"}`.
`fix` names the package or file the code belongs in. No prose outside the array.

Report nothing you have not verified by reading the code. An empty array is a valid and
useful answer.

## Never

Never edit anything — you are read-only by grant and by role. Never report style, naming
taste, or test coverage: those are not this review.
```

- [ ] **Step 2: Verify**

Run: `grep -n 'tools:\|^model:' .claude/agents/arch-reviewer.md`
Expected: a `tools:` line; NO `model:` line (it inherits the session model per spec G-5).

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/arch-reviewer.md
git commit -m "feat(review): architecture-focused reviewer agent"
```

---

### Task 29: Author the `/verify` skill and delete `/qa`

`/verify` is the orchestrator: it derives scope, authors the plan, dispatches the agents in
parallel, verifies their reports, runs parity, triages, loops, and cleans up. The test matrix
ports across nearly verbatim — it contains zero executor-specific content.

**Files:**
- Create: `.claude/skills/verify/SKILL.md`
- Create: `.claude/skills/verify/references/test-matrix.md` (ported)
- Delete: `.claude/skills/qa/SKILL.md`, `.claude/skills/qa/references/report-schema.json`,
  `.claude/skills/qa/references/runbook-template.md`,
  `.claude/skills/qa/references/test-matrix.md`

**Interfaces:**
- Consumes: the four QA agent names and their return shape (Task 27).
- Produces: the verification-record format `/finish` embeds in the PR body (Task 30):
  a markdown section titled `## Verification` listing per-surface verdict counts, every
  failure with observed values, and every parity comparison.

- [ ] **Step 1: Port the test matrix**

```bash
mkdir -p .claude/skills/verify/references
git mv .claude/skills/qa/references/test-matrix.md .claude/skills/verify/references/test-matrix.md
```

Then make the one executor-specific edit — replace the view-tree table exactly:

```markdown
| Surface | Read the tree with | Assert |
|---|---|---|
| web | Playwright DOM · `getComputedStyle` | exact strings, exact computed values |
| iOS | `idb ui describe-all` | accessibility tree contains the exact label |
| Android | `adb shell uiautomator dump` → XML | `text="…"` attributes match exactly |
| api | `curl -i` | status line and body bytes |
| db | `psql -U qa_readonly -tAc` | the scalar returned |
```

with:

```markdown
| Surface | Read the tree with | Assert |
|---|---|---|
| web | `read_page` (accessibility tree) · `javascript_tool` for computed values | exact strings, exact computed values |
| iOS | Simulator MCP `screenshot` + accessibility tree | the tree contains the exact label |
| Android | `adb shell uiautomator dump` → XML | `text="…"` attributes match exactly |
| api | `curl -i` | status line and body bytes |
| db | read-only `psql -tAc` against `heliogrid-pg-local` | the scalar returned |
```

Then delete the two obsolete lines about the files this replaced:

```markdown
The two files this replaced each had one half of this: `/verify-app` walked states and
never attacked, `qa-breaker` attacked and never confirmed the feature worked.
```

- [ ] **Step 2: Write `.claude/skills/verify/SKILL.md`**

````markdown
---
name: verify
description: Run end-to-end QA after development — derive the blast radius, plan four quadrants, drive web/iOS/Android/api in parallel via subagents, check parity, triage and loop until clean. Use before calling any work done.
---

# `/verify` — plan here, execute in parallel agents, loop until clean

Green gates prove code compiles and boundaries hold. They never prove a screen works. This
skill drives the real surfaces and loops until they do.

Everything this run produces lives in the session scratchpad and is DELETED when the run
finishes (owner ruling 2026-08-03). Nothing is written to the working tree. The durable
record is the verification section `/finish` puts in the PR.

## Phase 1 — Blast radius

`git diff --name-only` plus `--cached` (work here is often uncommitted). Map paths to
surfaces:

| Changed path | Surfaces |
|---|---|
| `apps/web/**` | web |
| `apps/mobile/**` | ios, android |
| `apps/api/**`, `apps/worker/**` | api |
| `packages/db/**` | api |
| `packages/contracts/**` | api + every consuming surface |
| `packages/data/**` | web, ios, android — it is the ONE data path |
| `packages/ui/**`, `packages/tokens/**` | web (+ mobile if the RN mirror moved) |
| `packages/domain/**`, `packages/i18n/**`, `packages/forms/**` | web, ios, android |

For a shared-code path, **grep the actual consumers** rather than trusting the table — the
symbol may be imported somewhere it does not predict.

**Minimum effective scope (G-9):** the surfaces in the blast radius, not every surface. A
web-only CSS change does not boot two simulators — it runs ONE agent. A diff touching only
docs, plans, or governance files ends the run here with "no runnable surface", which is a
complete and valid result, not a skip.

## Phase 2 — Plan: four quadrants, no empty cells

Walk `references/test-matrix.md` and author the step list in the scratchpad. Every surface in
the blast radius gets steps in **all four quadrants** (happy · edge · negative · adversarial).
Count steps per (surface × quadrant) before dispatching; **a zero cell aborts the run and
names the gap.** A plan may be small; it may not be lopsided.

Each step: `{id, surface, quadrant, actions[], expected, severity_if_failed}`. `expected` is a
literal string comparison — if it cannot be written as one, it is not yet a step.

**Severity is decided HERE, never by an executor.** Anything touching money reconciliation,
tenancy isolation or provenance tiers is `blocker`.

Always-on core regardless of blast radius: a cross-tenant read returns 404 · money reconciles
to the currency's minor unit · an unauthenticated request to a protected route is rejected.

## Phase 3 — Execute: only the surfaces in the blast radius

Dispatch ONE agent per surface Phase 1 named — no more (G-9). Most changes name one. When
there are several, dispatch them in ONE message so they run concurrently; they share no
state.

**Order each surface's steps so state flows** (login → OTP → home → locale → back). Relaunch
the app only where a cold start IS the test.

A surface that returns nothing, returns unparseable output, or dies is `inconclusive` — never
a pass, and never the whole run.

## Phase 4 — Verify the reports before believing them

1. Every `pass` carries an `observed` value and `evidence`. **A pass without evidence is
   rewritten to `inconclusive`.**
2. Read every failure in full.
3. Spot-check: every `blocker` step plus three others at random, against the evidence.
4. **A spot-check that contradicts the report makes the whole run untrusted** — re-run it.
   Do not quietly correct one row.

## Phase 4½ — Parity (only when the change can cause drift)

Run this ONLY when the diff touches a shared package or both app trees (G-9). A
single-platform change skips it — say so in the report rather than running it for form.

When it applies: dispatch `qa-parity` with the feature's web and mobile paths plus every
observed value the surface agents recorded for the same quantity. A value mismatch is a
**blocker**: a platform re-implemented something that was supposed to be imported (Law 11).

## Phase 5 — Triage into four buckets

- **bug** — fix it.
- **product-question** — a missing business rule or spec ambiguity. **Never invent a
  requirement:** record it in `docs/13` or `docs/15` and ask the owner. Does not block a
  clean run.
- **false-positive** — justify with evidence. Not waved off.
- **environment** — emulator down, server down. Fix and re-run; **does not consume a round.**

Present findings with root causes before fixing anything. Fixes are yours to make in the
normal edit flow — the QA agents never edit source.

## Phase 6 — Fix, re-run, certify

Each round re-runs the failed steps **plus a fresh blast radius for the code the fix
touched**, so a fix that breaks something adjacent is caught in the same round.

A clean fix round ends the loop. The full re-run of the original plan in fresh context — the
certify pass — is **opt-in** (G-9): offer it, and run it only when the owner asks or the
change touches money, tenancy or auth. It doubles the run's cost, and the previous system
already skipped it under cost pressure, which is worse than never promising it.

**Hard stop after three fix rounds** — escalate to the owner rather than grinding.

**Never edit the plan to make a failure disappear.** That is "never weaken a gate to make a
change pass" applied to QA.

## Phase 7 — Clean up, then report

1. Delete the run's scratchpad files.
2. Stop every process this run started — dev server (`preview_stop`), Metro, any emulator you
   booted. Leave what was already running.
3. Confirm the working tree carries nothing from the run: `git status --short`.

Then emit the `## Verification` section for `/finish`: per-surface verdict counts, every
failure with its observed value, every parity comparison with both values, and any surface
recorded `inconclusive` with the reason. **Specifics, not adjectives** — "browser 375+1440
happy / wrong-code paths; iPhone 16 relaunch restores session; curl 409 returns
ALREADY_ONBOARDED", never "verified working". A surface that could not run is stated plainly,
never omitted so the silence implies a pass.
````

- [ ] **Step 3: Delete the retired skill**

```bash
git rm -r .claude/skills/qa
```

- [ ] **Step 4: Sweep every citation of the retired skill**

Run:

```bash
git ls-files | xargs grep -ln '/qa\b\|\.qa/' 2>/dev/null | grep -v '^docs/superpowers/plans/'
```

Swept 2026-08-03 — the live citers are: `.claude/skills/qa/**`, `.github/pull_request_template.md`
(rows 12 and 31), `.gitignore`, `.graphifyignore`, `README.md`, `docs/17` (§3's historical
sentence only — leave it), `docs/adr/0024-auth-removal-to-greenfield.md`, and
`scripts/check-adherence.sh:55` (a failure message pointing at the skill). **The last two
were NOT in this plan's original list** — re-run the grep rather than trusting this one.

For each file the sweep names, replace the citation:

- `CLAUDE.md` — already done in Task 25 (expect no hits).
- `.claude/rules/00-laws.md` — already done in Task 21 (expect no hits).
- `README.md:312` — replace the `/qa` row's cells with `/verify` and: `Green gates
  (\`pnpm verify\`) prove code correctness, never UI or cross-surface behavior. \`/verify\`
  drives the real app — browser for web, simulator for iOS, adb for Android, curl for the
  API — in parallel, and loops until clean`.
- `README.md:341` — replace the skills list with
  `` `/contract-change`, `/migration`, `/verify`, `/finish` ``.
- `docs/17-engineering-governance.md` — already done in Tasks 19–20 (expect no hits).
- `docs/adr/0024-auth-removal-to-greenfield.md:55` — replace `` in `/qa` `` with
  `` in `/verify` ``.
- `.gitignore:52-59` — delete the `.qa/` entry and its comment block, and the Playwright MCP
  scratch entry beneath it.
- `.graphifyignore:34-36` and `:68-72` — delete the `.qa/` entry, its comment, and the
  report-schema entry (the file no longer exists).
- `biome.json:22` — delete the `"!.qa",` line.

- [ ] **Step 5: Verify the retirement is complete**

Run:

```bash
git ls-files | xargs grep -n '/qa\b\|\.qa/\|skills/qa' 2>/dev/null | grep -v '^docs/superpowers/plans/'
```

Expected: no output.

Run: `pnpm lint`
Expected: PASS (this also proves the `biome.json` edit is valid JSON).

- [ ] **Step 6: Commit**

```bash
git add -A .claude/skills README.md docs/adr/0024-auth-removal-to-greenfield.md .gitignore .graphifyignore biome.json
git commit -m "feat(qa): /verify replaces /qa — parallel agents, no artifact tree"
```

---

### Task 30: Author the `/finish` skill

**Files:**
- Create: `.claude/skills/finish/SKILL.md`

**Interfaces:**
- Consumes: `arch-reviewer` (Task 28); the `## Verification` section from `/verify` (Task 29).

- [ ] **Step 1: Write the file**

````markdown
---
name: finish
description: Close out a piece of work — full gates, architecture review, then propose the branch, commits and PR with the verification record. Use when implementation and /verify are done.
---

# `/finish` — gates, review, then propose the PR

Nothing here pushes anything without an explicit yes.

## 1. Gates

```bash
pnpm verify
```

All five stages must pass. **Never weaken a gate to make a change pass** — a gate that blocks
you means the change is wrong. If the invariants skipped (no `DATABASE_URL`), say so: a green
run has NOT proven tenancy.

Deleted a source file? `pnpm turbo build --force` first — `tsc -b` leaves stale output and
turbo's cache restores it.

## 2. Architecture review

Dispatch `arch-reviewer` on the diff. Fix every `blocker` and `major` finding at the root
cause, then re-run the gates.

**One review per change** (CLAUDE.md §8): findings get fixed and the work ships. Do not
re-review the review.

## 3. Propose the git plan

Present, and wait for an explicit yes before running anything:

- **Branch** — a name derived from the work (`feat/…`, `fix/…`, `docs/…`). Never commit to
  `main`; it is PR-only.
- **Commit batching** — recommend one, with the alternative stated:
  - *One commit per task, one PR* — the default for a multi-task flow whose tasks share a
    goal. The owner reads one coherent diff.
  - *A PR per task* — when tasks are independently reviewable or independently revertable.
  - *One squashed commit* — only for a small single-purpose change.
- **PR body** — the summary, the task list, and the `## Verification` section `/verify`
  produced, verbatim. That section is the only durable record that the work was run:
  `/verify` writes nothing to the repo.

## 4. Execute what was approved

Commit, push and open the PR — each step only after the yes that covers it. Use the repo's
commit conventions; end commit messages with the `Co-Authored-By` trailer.

If the owner approves the commits but not the push, stop there and say what is staged.

## Never

Never push or open a PR on your own initiative. Never use `--no-verify`. Never include the
QA scratchpad or any artifact directory in a commit — `/verify` deletes its own; if anything
remains, that is a bug in the run, not something to commit.
````

- [ ] **Step 2: Verify**

Run: `ls .claude/skills/ && head -4 .claude/skills/finish/SKILL.md`
Expected: `contract-change  finish  migration  verify`; valid frontmatter with `name` and
`description`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/finish/SKILL.md
git commit -m "feat(workflow): /finish — gates, architecture review, PR proposal"
```

---

### Task 31: Add the three deterministic hooks

**Files:**
- Create: `.claude/hooks/block-applied-migration-edit.sh`
- Create: `.claude/hooks/block-test-files.sh`
- Create: `.claude/hooks/block-no-verify.sh`
- Modify: `.claude/settings.json`
- Modify: `.claude/rules/db-schema.md` (the hook claim becomes true again)
- Modify: `.claude/skills/migration/SKILL.md` (same)

**Interfaces:**
- Consumes: matrix rows from Task 20 Step 9.

- [ ] **Step 1: Write `.claude/hooks/block-applied-migration-edit.sh`**

```bash
#!/usr/bin/env bash
# PreToolUse(Edit|Write): migrations are append-only. A file already in HEAD has been
# applied somewhere and is sha256-locked by the runner; editing it makes `migrate` refuse
# to run at all. Add a new numbered file instead.
set -euo pipefail

payload="$(cat)"
path="$(printf '%s' "$payload" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))')"

case "$path" in
  */packages/db/migrations/*.sql|packages/db/migrations/*.sql) ;;
  *) exit 0 ;;
esac

rel="${path#"$CLAUDE_PROJECT_DIR/"}"
if git -C "$CLAUDE_PROJECT_DIR" cat-file -e "HEAD:$rel" 2>/dev/null; then
  echo "Blocked: $rel is an applied migration. Migrations are append-only (.claude/rules/db-schema.md) — add a new numbered file instead." >&2
  exit 2
fi
exit 0
```

- [ ] **Step 2: Write `.claude/hooks/block-test-files.sh`**

```bash
#!/usr/bin/env bash
# PreToolUse(Write): this repo has no unit tests (owner directive 2026-07-29). The only
# executable checks are tests/invariants/. Verification is running the thing — /verify.
set -euo pipefail

payload="$(cat)"
path="$(printf '%s' "$payload" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))')"

case "$(basename "$path")" in
  *.test.*|*.spec.*)
    echo "Blocked: no .test.* or .spec.* files in this repo (CLAUDE.md §8, owner directive 2026-07-29). Executable checks live in tests/invariants/; behaviour is proven with /verify." >&2
    exit 2
    ;;
esac
exit 0
```

- [ ] **Step 3: Write `.claude/hooks/block-no-verify.sh`**

```bash
#!/usr/bin/env bash
# PreToolUse(Bash): --no-verify skips the pre-commit hook (biome --error-on-warnings +
# typecheck). Fix the diagnostic instead (CLAUDE.md §6).
set -euo pipefail

payload="$(cat)"
cmd="$(printf '%s' "$payload" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))')"

if printf '%s' "$cmd" | grep -q -- '--no-verify'; then
  echo "Blocked: --no-verify skips the pre-commit gate. Fix the lint or typecheck diagnostic instead (CLAUDE.md §6)." >&2
  exit 2
fi
exit 0
```

- [ ] **Step 4: Make them executable**

```bash
chmod +x .claude/hooks/*.sh
```

- [ ] **Step 5: Wire them in `.claude/settings.json`**

Replace the file's closing `  }\n}` so the object reads (keeping the existing `permissions`
block exactly as it is):

```json
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/block-applied-migration-edit.sh"
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/block-test-files.sh"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/block-no-verify.sh"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 6: Make the two hook claims true again**

In `.claude/rules/db-schema.md`, replace exactly:

```markdown
- **Migrations are append-only** and sha256-locked by the runner. Editing an applied file
  makes `migrate` refuse to run. Add a new numbered file instead.
```

(this is the Phase 0 wording) with:

```markdown
- **Migrations are append-only.** A PreToolUse hook refuses the edit, the runner's sha256
  lock refuses to run, and CI's `--diff-filter=MDR` guard refuses the merge. Add a new
  numbered file instead.
```

In `.claude/skills/migration/SKILL.md`, replace the Phase 0 wording of the same fact with:

```markdown
Number one above the highest. A PreToolUse hook refuses an edit to an applied file, and the
sha256-locked runner would refuse to run at all.
```

- [ ] **Step 7: Prove each hook fires**

Prove the migration guard on BOTH paths. First the allow path (no committed migration exists
today, so a new file must pass):

Run: `echo '{"tool_input":{"file_path":"'"$PWD"'/packages/db/migrations/0001_x.sql"}}' | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/block-applied-migration-edit.sh; echo "exit=$?"`
Expected: `exit=0`, no output.

Then the block path, using a file that IS in HEAD — the hook's condition is
`git cat-file -e HEAD:<path>`, so any committed file under the migrations glob proves it.
Temporarily point the test at a committed file by running the same hook against
`packages/db/migrations/README.md` renamed in the payload to `.sql`:

Run: `echo '{"tool_input":{"file_path":"'"$PWD"'/packages/db/migrations/README.md.sql"}}' | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/block-applied-migration-edit.sh; echo "exit=$?"`
Expected: `exit=0` (that exact path is not in HEAD). To see the block, commit a scratch
`packages/db/migrations/0000_probe.sql`, re-run the first command against it — expect the
block message and `exit=2` — then `git rm` the probe before continuing. **A hook nobody has
watched go red is a guard nobody has verified.**

Run: `echo '{"tool_input":{"file_path":"src/foo.test.ts"}}' | .claude/hooks/block-test-files.sh; echo "exit=$?"`
Expected: the block message on stderr and `exit=2`.

Run: `echo '{"tool_input":{"command":"git commit --no-verify -m x"}}' | .claude/hooks/block-no-verify.sh; echo "exit=$?"`
Expected: the block message on stderr and `exit=2`.

Run: `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')); console.log('settings.json OK')"`
Expected: `settings.json OK`.

- [ ] **Step 8: Commit**

```bash
git add .claude/hooks .claude/settings.json .claude/rules/db-schema.md .claude/skills/migration/SKILL.md
git commit -m "feat(hooks): three deterministic guards — applied migrations, test files, --no-verify"
```

---

### Task 32: Phase 3 close-out — dry-run `/verify`, gates, PR

- [ ] **Step 1: Dry-run the new QA system on a trivial change**

Make a no-op-visible change (e.g. touch a web copy string), then run `/verify`. Confirm: the
blast radius names web only; the plan has no empty quadrant cell; `qa-web` returns structured
verdicts with evidence; the scratchpad is empty afterward and `git status --short` shows only
your change.

Revert the throwaway change.

- [ ] **Step 2: Full gates**

Run: `pnpm verify`
Expected: PASS.

- [ ] **Step 3: Propose the PR (owner approval required)**

Report the commit list on `governance/rebuild`, and record for the eventual PR body what the
owner must do outside the repo: **enable branch protection on `main`** (require a PR, require
the CI checks) so the append-only-migration guard and CODEOWNERS review stop being skippable.

---

# PHASE 4 — Perimeter sweep (continues on `governance/rebuild`)

Runs any time after Phase 2. Every item here is a surface the audit found unowned or stale.

### Task 33: README — pointers, not a fourth restatement

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the Git workflow section**

Replace exactly:

```markdown
**Git is manual.** Nothing in this repo auto-commits. Commit only when explicitly asked, in
those words — finishing a task or "fix it" authorizes the fix, not a commit. When asked,
prefer several small commits over one sweep. Branches and PRs only on explicit instruction.
Full detail: [`CLAUDE.md`](CLAUDE.md) §8.
```

with:

```markdown
Work happens on a branch and ends PR-ready via `/finish`, which proposes the branch, the
commits and the PR body. **Committing, pushing and opening the PR each need an explicit
owner yes.** `main` is PR-only. Full detail: [`CLAUDE.md`](CLAUDE.md) §8.
```

- [ ] **Step 2: Add the architecture spine to the doc table**

Insert as the first data row of the "Where to find things" table, immediately after the
header separator:

```markdown
| [`docs/architecture.md`](docs/architecture.md) | **The spine** — package registry, dependency direction, platform rules (RN/Next.js), and where new code goes |
```

Then replace the docs/02 row's description:

```markdown
| `docs/02-system-architecture.md` | Full system design |
```

with:

```markdown
| `docs/02-system-architecture.md` | System design record — intent and target state, not current contents (see `docs/architecture.md`) |
```

- [ ] **Step 3: Fix the inaccurate precommit description**

Run: `grep -n 'staged' README.md`

For the hit describing the pre-commit hook as staged-scoped, correct it: biome runs on staged
files, **`pnpm turbo typecheck` runs repo-wide on every commit**.

- [ ] **Step 4: Verify and commit**

Run: `grep -n 'Git is manual' README.md`
Expected: no output.

```bash
git add README.md
git commit -m "docs(readme): pointers to the spine; git and precommit descriptions corrected"
```

---

### Task 33a: Re-home the `qa_readonly` database role

The role `qa-api` connects with exists only on the machine that created it — its provisioning
is recorded nowhere in the repo (the audit found it referenced only in the retired skill and a
deleted genesis plan). A read-only path is worth keeping; its setup must be reproducible.

**Files:**
- Modify: `infra/README.md`

**Interfaces:**
- Consumes: nothing. Produces: the documented role `qa_readonly` that `.claude/agents/qa-api.md`
  connects with.

- [ ] **Step 1: Confirm the container and whether the role already exists**

Run: `docker ps --filter name=heliogrid-pg-local --format '{{.Names}} {{.Status}} {{.Ports}}'`
Expected: the container listed as `Up`, publishing `5544->5432`.

Run: `docker exec heliogrid-pg-local psql -U postgres -tAc "SELECT rolname FROM pg_roles WHERE rolname='qa_readonly'"`
Expected: either `qa_readonly` (already provisioned) or empty.

- [ ] **Step 2: Document the provisioning in `infra/README.md`**

Append a section (adjust the database name to match what the existing README documents):

````markdown
## QA read-only role

`/verify`'s `qa-api` agent reads database state through a role that cannot write. It runs
against the ALREADY RUNNING `heliogrid-pg-local` container — never a new container, never a
clone (owner ruling 2026-08-03).

```bash
docker exec heliogrid-pg-local psql -U postgres -c \
  "CREATE ROLE qa_readonly LOGIN PASSWORD 'qa_readonly';"
docker exec heliogrid-pg-local psql -U postgres -d heliogrid -c \
  "GRANT CONNECT ON DATABASE heliogrid TO qa_readonly;
   GRANT USAGE ON SCHEMA public TO qa_readonly;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO qa_readonly;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO qa_readonly;"
```

The role is deliberately NOT `app_user`: RLS policies are written for `app_user`, so querying
as it would mask a tenancy defect the invariants exist to catch. `qa_readonly` sees rows as an
outside observer, which is what a verification read should be.
````

- [ ] **Step 3: Verify and commit**

Run: `grep -n 'qa_readonly' infra/README.md`
Expected: the new section.

```bash
git add infra/README.md
git commit -m "docs(infra): record the qa_readonly role /verify reads with"
```

---

### Task 34: `tests/invariants/CLAUDE.md` — the proof layer gets its layer law

**Files:**
- Create: `tests/invariants/CLAUDE.md`

- [ ] **Step 1: Write the file**

```markdown
# @heliogrid/invariants — the executable proof layer

## What lives here / what must never live here

- The locked invariant set: tenancy RLS, table tenancy scan, enum parity, schema parity, and
  the contract tenancy scan. **Additions require explicit owner approval** — this set is
  deliberately small so a green run means something.
- **Never a unit test.** No `.test.*`, no `.spec.*` (owner directive 2026-07-29, hook-blocked).
  An invariant proves a property of the SYSTEM against a real database; it does not exercise
  a function.
- Never a fixture factory, a mock, or a helper library. An invariant that needs scaffolding
  to be readable is testing the wrong thing.

## Commands

```bash
pnpm --filter @heliogrid/invariants test        # needs DATABASE_URL
pnpm turbo test                                  # the same, through the gate
```

## Dependency policy

May import `@heliogrid/contracts`, `@heliogrid/db`, `@heliogrid/domain`, `@heliogrid/env`.
Never an app, never `packages/ui`. See `docs/architecture.md` §2.

## Landmines

- **A skipped invariant that reports success is worse than no invariant.** `run.ts` skips
  loudly without `DATABASE_URL` locally and fails closed under `CI`. A green local
  `pnpm verify` on a machine with no database has NOT proven tenancy.
- **Vacuity is not a pass.** With an empty schema, enum parity and the tenancy scan have
  nothing to compare; both say so explicitly when they run. Read the output, not the exit code.
- Db checks target the existing `heliogrid-pg-local` container (postgres:16, port 5544).
  Never create a container or clone a database (owner ruling 2026-08-03).

## Definition of done here

The invariant fails on the violation it names — inject the violation once and watch it go
red, then remove it. An invariant nobody has seen fail is a rule nobody has verified.
```

- [ ] **Step 2: Verify and commit**

Run: `wc -l tests/invariants/CLAUDE.md`
Expected: under 50 lines (docs/17 Appendix A budget).

```bash
git add tests/invariants/CLAUDE.md
git commit -m "docs(invariants): the layer that proves the constitution gets its layer law"
```

---

### Task 35: Stale-reference sweep across docs and source comments

**Files:**
- Modify: `docs/14-build-roadmap.md`, `docs/13-ux-gap-register.md`,
  `docs/15-spec-resolutions.md`, `docs/product/README.md`, `.env.example`,
  `apps/mobile/src/env.ts`

- [ ] **Step 1: Kill the dead `docs/modules/` pointers**

Run: `grep -rn 'docs/modules/\|\./modules/' docs/ --include='*.md'`

For each hit (expected: `docs/14-build-roadmap.md` and `docs/product/README.md`), replace the
pointer with `docs/superpowers/plans/` — per-module roadmaps were deleted 2026-07-31.

- [ ] **Step 2: Reconcile docs/14 Track F and Track A with ADR-0024**

Run: `grep -n 'Better Auth' docs/14-build-roadmap.md`

For each hit, add or extend the status note: Better Auth was removed 2026-08-01 (ADR-0024);
the auth architecture is the rebuild's call, not a prescribed stack. Do not delete the
historical text — annotate it.

- [ ] **Step 3: Sweep the retired 20-day calendar**

Run: `grep -rn '20-day\|Days 14–18\|20 day' docs/13-ux-gap-register.md docs/14-build-roadmap.md docs/15-spec-resolutions.md`

Replace each with dateless framing (`docs/14` declared the calendar invalidated 2026-07-30).

- [ ] **Step 4: Fix the docs/15 R19 id collision**

Run: `grep -n '^### R19\|R19-' docs/15-spec-resolutions.md`

Two different rulings carry `R19`. Ids are stable and never reused (00-laws.md): rename the
LATER one (`### R19 — Auth removed to greenfield`, 2026-08-01) to the next unused number,
and add a one-line note under it recording the renumber and its original label so existing
citations resolve.

- [ ] **Step 5: Fix `.env.example` and the mobile env docblock**

In `.env.example`, replace exactly:

```
# Browser origin allowed by CORS + Better Auth trustedOrigins.
```

with:

```
# Browser origin allowed by CORS.
```

In `apps/mobile/src/env.ts`, replace the stale closed-set list exactly:

```
 * `src/config/env.ts`: CLAUDE.md fixes `src/` as the closed set {auth,data,hooks,navigation,
 * push,screens,ui} plus root files, and a new folder category is a plan-time call.
```

with:

```
 * `src/config/env.ts`: apps/mobile/CLAUDE.md fixes `src/` as a closed set of folder
 * categories plus root files, and a new category is a plan-time call.
```

(The literal list is what rotted — `data` left 2026-08-01, `lib` arrived 2026-08-02.)

- [ ] **Step 6: Verify and commit**

Run: `grep -rn 'docs/modules/' docs/ --include='*.md'`
Expected: no output.

Run: `pnpm lint`
Expected: PASS.

```bash
git add docs/ .env.example apps/mobile/src/env.ts
git commit -m "docs: sweep dead module pointers, auth-teardown remnants, retired calendar, id collision"
```

---

### Task 36: Record the two parity findings in docs/13

The audit found two behavioural divergences with no register row. They are product-shaped
findings: record them, do not fix them here (00-laws.md stop-and-ask).

**Files:**
- Modify: `docs/13-ux-gap-register.md`

- [ ] **Step 1: Read the register's row format**

Run: `grep -n 'UXG-PAR' docs/13-ux-gap-register.md`

- [ ] **Step 2: Append two rows in that exact format**

1. **RN offline handling is unreachable.** `apps/mobile/src/screens/login/hooks/use-login.ts`
   sets `offline` only inside `try/catch` around session-store calls, but the store contract
   (`packages/data`) returns failures rather than throwing, so `OfflineBanner` is dead code
   and RN never gates submission on connectivity — where web gates on `navigator.onLine`.
   Blocks: the auth rebuild must pick one model. Source: governance audit 2026-08-03.
2. **RN gives no resend feedback.** Web's `OtpStep` shows a spinner while
   `verifying || sending`; RN's `OtpStep` never receives `sending`, so a resend on mobile has
   no visual feedback. Source: governance audit 2026-08-03.

- [ ] **Step 3: Commit**

```bash
git add docs/13-ux-gap-register.md
git commit -m "docs(13): record two login parity divergences found by the governance audit"
```

---

### Task 37: Refresh memory and the knowledge graph

**Files:**
- Modify: `/Users/devtejas/.claude/projects/-Volumes-works-space-heliogrid/memory/MEMORY.md`
  and the memory files it indexes

- [ ] **Step 1: Fix the stale memory entries**

Run: `grep -rn 'foundation-redesign' /Users/devtejas/.claude/projects/-Volumes-works-space-heliogrid/memory/`

`docs/foundation-redesign.md` no longer exists. Update or delete the memory that names it as
plan of record, and reconcile the index with the files actually on disk (the audit found the
index listing 6 while 8 exist).

- [ ] **Step 2: Add one memory for the governance rebuild**

Write a `project`-type memory recording: the governance system was rebuilt 2026-08-03 around
`docs/architecture.md` as the spine; `/qa` was retired for agent-based `/verify`; the git
model is branch → propose → owner-approved PR. Add its index line to `MEMORY.md`.

- [ ] **Step 3: Refresh the knowledge graph**

`graphify-out/` holds a graph built 2026-08-01, before the spine, the rules restructure and
the `/qa` retirement — and the user's global instruction routes codebase questions through it
first, so a stale graph answers from retired governance. Rebuild it by invoking the
`graphify` skill over the repo, and confirm afterwards:

Run: `grep -rl 'skills/qa' graphify-out/ | head`
Expected: no output.

- [ ] **Step 4: Phase 4 close-out — gates and PR proposal**

Run: `pnpm verify`
Expected: PASS.

This is the last task of the rebuild. Present the whole `governance/rebuild` branch — every
phase's commits — and the assembled PR body, for the owner's approval to push and open the
single PR.

---

## Appendix — spec coverage

| Spec section | Tasks |
|---|---|
| §3 fact-ownership model | 19 (protocol), 21, 24, 25 |
| §4 hierarchy + Laws 10/11 + deletion sweep | 19, 21 |
| §4 matrix expressiveness upgrade | 20 |
| §5 skills (verify, finish, plan sections, plugin precedence) | 25, 29, 30 |
| §5.4 hooks | 31 |
| §6 agents | 27, 28 |
| §7 QA (all seven phases, G-3/G-4/G-5) | 27, 29 |
| §8 repo structure (rules tree, tests/invariants, README, infra, AGENTS.md, docs/research) | 19, 22, 23, 33, 33a, 34 |
| §9 Phase 2/3/4 migration | 19–26 / 27–32 / 33–37 |
| Appendix A defect register | 19, 20, 24, 29, 33, 35, 36 |

Phase 0–1 coverage (spine, package slims, mechanical wins, false-claim purge) is in
`docs/superpowers/plans/2026-08-03-governance-rebuild-phase-0-1.md`.
