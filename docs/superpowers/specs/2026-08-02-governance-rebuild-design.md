# Governance rebuild — design spec

**Date:** 2026-08-02 · **Status:** approved design, pending implementation plan
**Source:** owner-directed brainstorm session (full governance audit + redesign). Supersedes the
governance *structure* described in docs/17 §3–§5 and CLAUDE.md §9 once implemented; product law
and the Laws' stable-id discipline are preserved.

The audit behind §1–§2 ran 12 parallel area auditors plus a completeness critic over every
governance surface (CLAUDE.md files, rules, skills, scripts, configs, docs/02/03/13/14/15/17,
ADRs, dependency graph, and a line-level web-vs-mobile screen comparison), verifying claims
against code before recording them. Findings below cite file:line where load-bearing.

---

## 0. Decision log — owner rulings made in this session (2026-08-02)

| ID | Ruling |
|---|---|
| G-1 | **PR workflow with approval gates** (revised same-day from "full PR autonomy"). Every completed task drives toward a PR: work happens on a feature branch and ends PR-ready, but **committing and raising the PR require owner approval**. At finish time the agent presents a git plan — branch name, commit batching, PR title/body with the verification record — as options with a recommendation. For multi-task flows, the agent proposes the batching that fits the work (e.g. one branch/PR with one commit per task, vs. a PR per task) and the owner picks. Main becomes PR-only (owner enables branch protection on GitHub). Supersedes "Git is manual… branches and PRs only on explicit command": the flow now always proposes the PR, but nothing is committed or pushed without a yes. |
| G-2 | **Minimal deterministic hooks return.** Three zero-intelligence hooks (see §5.4). Consciously revisits the 2026-07-31 "hooks caught zero real mistakes" removal; if these also catch nothing by their matrix review date, they die again. |
| G-3 | **QA runtimes.** iOS = iOS Simulator (MCP). Android = adb against an emulator/device (no simulator panel exists for Android). Web = Claude Code's built-in browser pane on the dev server. API/db = curl + read-only psql (`qa_readonly`). **Db checks run against the existing local postgres container** (`heliogrid-pg-local`, postgres:16, host port 5544) — QA never creates a container or clones a database for testing; connection details come from env, never hardcoded in the skill or agents. |
| G-4 | **QA hygiene.** QA cleans up after completion: scratchpad evidence deleted after the report is finalized, processes QA started are stopped, repo tree untouched (QA never edits source). No `.qa/` directory, no artifact archive, no screenshots unless explicitly requested. Retires the 2026-08-02 ".qa/ local-only" ruling by removing `.qa/` entirely. |
| G-5 | **QA executors run on Sonnet** (`model: sonnet` in agent frontmatter): qa-web, qa-mobile, qa-api, qa-parity. Orchestration (blast radius, plan, triage, root cause) stays on the session model. arch-reviewer inherits the session model. |
| G-6 | **Architecture chosen: spine rebuild + mechanical cheap wins** (approach B+C-lite) over repair-in-place and full mechanization. |
| G-7 | **No unit tests stands.** The 2026-07-29 directive is unchanged; verification is running the thing via `/verify`. The superpowers TDD skill trigger is explicitly overridden by repo law. |

---

## 1. Current state assessment

**Verdict: the mechanical layer is strong and honest; the prose layer rotted, concentrated
where changes deleted things.**

What verifiably works (ported, not rewritten, by this design):

- **Zero live boundary violations.** No `@ts-rest` in frontend apps, domain is pure, ui has no
  RN/DOM leaks, `process.env` confined to the 3 audited locations, no frontend db imports.
- **dependency-cruiser (28 rules, all error)** is the real boundary enforcer, with probe-dated
  comments admitting which rules were once inert. Self-auditing gate design (stale-allowlist
  rot-guards in check-env-access and check-ui-parity) is genuinely strong.
- **Component-prop parity is solved**: ui-api's four typecheck mechanisms + check-ui-parity.mjs
  run in every lint and CI, and each traces to a defect it closed.
- **tokens' dual-platform emit** (tokens.css + theme.ts + native splash with CI freshness guard)
  works exactly as documented. **docs/03's ~20 version pins** are all exact.
- **The /qa methodology core** (four-quadrant matrix, diff-derived blast radius, triage buckets,
  3-round loop, artifact-or-inconclusive) is executor-agnostic and battle-tested.
- **The rule/skill split** (rules hold properties and path-load; skills hold sequences and load
  on demand) is deliberate and correct.
- **docs/13's append-only register discipline** and the plan headers' self-documentation
  (source spec, execution skill, binding constraints) work as designed.

The governance *shape* (constitution + always-loaded digest + deep record + path rules +
skills) is sound. What failed is fact hygiene inside it — §2.

## 2. Identified weaknesses

**W1 — The governance violates its own "one definition per fact" law.**
The reuse principle is stated four ways across the two always-loaded files; the decision-
hierarchy tiebreakers appear in full in both 00-laws.md and docs/17 §4 with a false "live only
here" claim; "never invent a requirement" is stated twice; enum-parity is described in four
files with the contract-change skill's copy flat wrong ("nothing checks this" — the invariant
does); contracts.md restates 5 of its 8 bullets from packages/contracts/CLAUDE.md; migration §2
re-lists db-schema.md's tenant-table requirements; the two app CLAUDE.mds duplicate five rule
blocks near-verbatim (one already drifted); README is a fourth restatement layer nobody owns.

**W2 — False enforcement claims poison trust in the real ones.**
db-schema.md:10 and migration SKILL.md claim a PreToolUse hook blocks applied-migration edits —
all hooks were deleted 2026-07-31. docs/17 §5 credits enforcement to /doc-sync and lens agents
deleted the same day; §3 still says .qa/ evidence is *committed* against the 2026-08-02
gitignore ruling; the sed-i prose row points at CLAUDE.md text that does not exist;
ci.yml cites a Law removed 2026-08-01.

**W3 — Rot concentrates after deletions; Law 8 has no mechanism for them.**
ADR-0023/0024 fallout: contract-change points at two deleted client files; contracts/domain
CLAUDE.mds assert dependency edges the teardown removed; dep-cruiser exempts four nonexistent
files; docs/02's package map is wrong on 4 of ~11 packages (lists `adapters`, omits env/forms/
ui-api); .env.example still describes Better Auth CORS. Skills were missed by *both* recent
refactors.

**W4 — The layer where defects land has zero mechanism.**
The login flow (the only both-platform feature) duplicates its controller, view-model,
countdown hook, and copy per platform, with six live behavioral divergences: five renamed state
fields (one with inverted polarity: `online` vs `offline`), contradictory offline models (RN's
OfflineBanner is unreachable dead code against the store contract), a missing resend spinner on
RN, policy applied in different layers, differing race protection, and inline-duplicated msgids
that fork on a one-character edit. Only manual review and docs/13 stand between platforms here.

**W5 — Rule delivery scoping defeats sound rules.**
i18n.md's app-facing rules (Trans mixing, unit non-translation, width expansion) never load for
apps/web or apps/mobile edits — where Trans is actually written. Mobile's RN-primitive ban
covers only `src/screens/**`; its expo/AsyncStorage bans have no mechanism; web has no
Server/Client-boundary or DOM-isolation rule at all.

**W6 — The enforcement matrix conflates "mechanism exists" with "mechanism can express the
rule."** Turbo tags cannot hold data→ui-api (ui-api wears the `contracts` tag) or web→db (one
shared `app` tag) — dep-cruiser is the real enforcer. Local `pnpm verify` runs dep-cruiser
before build, partially vacuous on clean checkouts (CI proved it, builds first). knip is
referenced as if a standing gate but wired nowhere. Roughly half of CLAUDE.md §7's product laws
map to no matrix tier.

**W7 — Unowned surfaces.** README's restatements; docs/research's "NORMATIVE" tier;
tests/invariants (the workspace that proves the constitution) has no CLAUDE.md; commits land
directly on main so every PR-only guard and CODEOWNERS is skippable; the user-level plugin
layer contradicts repo law (TDD skill vs no-unit-tests); auto-memory and the graphify graph
carry stale governance facts; `.superpowers/sdd/` is a second ungoverned local evidence tree.

---

## 3. Proposed governance architecture — the fact-ownership model

**Every governance fact has exactly one canonical home, chosen by fact class. Every other
mention is a pointer (file + anchor). Digests are allowed only where declared bidirectionally.**

| Fact class | Canonical home | Everything else |
|---|---|---|
| Inter-package: purpose, responsibilities, allowed/forbidden deps, platform scope, extension points | `docs/architecture.md` §2 (registry) | pointers |
| Module map & dependency direction | spine §1 | mirrors dep-cruiser; no hand counts |
| Platform rules (RN / Next.js / shared) | spine §3 | path rules deliver pointers + deltas at edit time |
| Placement procedure ("where does new code go") | spine §4 | invoked by the plan template |
| Working style & process | `CLAUDE.md` | — |
| Product law | `docs/15` | CLAUDE.md §7 becomes a *dated, declared* digest |
| Laws | `docs/17` §1 | `00-laws.md` is the declared always-loaded digest |
| Rule→mechanism map | `docs/17` matrix | rules cite their row, never re-describe the mechanism |
| Intra-package conventions, landmines, definition-of-done | package `CLAUDE.md` | — |
| Procedures | `.claude/skills/` | rules hold properties; skills hold sequences |
| Executor behavior | `.claude/agents/` | — |
| Schema / enums / visual / copy | migrations / contracts / tokens / i18n | unchanged |

**Spine anti-rot rules (learned from how docs/02 died):**

1. No hand-maintained counts or consumer lists — the spine states the *rule* for who may
   depend on a package; package.json + dep-cruiser carry the current graph. (The
   "21-component" and "used by TODAY" rot class — two lists went stale within 48 hours.)
2. Status banners are mandatory on any section describing target-state rather than current
   reality (the packages/db banner pattern — the only doc that survived the teardown accurate).
3. The spine is authored from audit-verified reality, never from docs/02. docs/02 gets a
   banner declaring it a design record whose current-truth pointer is the spine.

## 4. Rule hierarchy

```
1. Owner rulings          docs/15 (product) · docs/13 (UX gaps)
2. Architecture           docs/architecture.md (the spine)
3. Platform rules         spine §3 → delivered via .claude/rules/{web,mobile,cross}-platform.md
4. Laws                   docs/17 §1 · digest in 00-laws.md (stable ids, gaps preserved)
5. Rules                  .claude/rules/* + package CLAUDE.mds (scoped deltas)
6. Skills                 .claude/skills/* (procedures only — never define facts)
7. Agents                 .claude/agents/* (executors only — never define facts)
   Enforcement (types, lint, invariants, hooks) is how layers 1–5 are held, not an authority.
```

Tiebreakers — stated once, in docs/17 §4 only (the 00-laws.md copy becomes a pointer):
more-specific path wins over cross-cutting; later-dated wins between records; a skill or agent
contradicting a rule means the skill/agent is the defect.

**Law changes** (stable ids: 1, 3, 5, 7, 8, 9 keep numbers and meaning; 2, 4, 6 stay gaps):

- **Law 8 amendment — the deletion sweep.** A change that deletes or moves files must grep
  `.claude/`, `docs/`, config files, and `.env.example` for the dead paths in the same change.
  (Both recent refactors missed skills; six area audits traced rot to this hole.)
- **Law 10 — Platform purity (new).** Shared packages are platform-agnostic: no DOM, no React
  Native, no Node-only APIs outside declared server entry points. Platform-specific
  implementations live in the owning app (adapter packages when they land). A shared package
  importing a platform module is a defect. Held by dep-cruiser + adherence gates; the matrix
  row names which bans each mechanism can actually express.
- **Law 11 — Flows are authored once (new).** A flow's state vocabulary and view-model type
  shared by both platforms is defined in a shared package (domain/data) before either screen
  consumes it; screens hold rendering, not policy. Copy both platforms need lives in
  `packages/i18n/src/copy`. Held by review + qa-parity per feature (no full mechanism exists;
  the matrix row says so honestly).

**Matrix honesty upgrade:** docs/17 §5 gains an *expressiveness* column — "mechanism exists"
vs "mechanism can express this rule" — with dep-cruiser named the authoritative boundary
enforcer and turbo tags demoted to coarse redundant cover. Every CLAUDE.md §7 product law gets
a row (prose-tier with justification where no mechanism can hold it).

## 5. Skill architecture

Skills are procedures only. Five repo skills, zero overlap:

| Skill | Owns | Status |
|---|---|---|
| superpowers brainstorm / write-plan / execute | Feature intake → spec → plan → execution | External backbone, kept. Repo mandates two plan sections (below) |
| `/contract-change` | Contract edit sequence | Kept; fixes: dead client paths → `@heliogrid/data`, false enum-parity claim corrected, schema-path future-tense |
| `/migration` | Migration authoring sequence | Kept; fixes: hook claim points at the *real* new hook, tenant-table list → pointer |
| `/verify` | QA orchestration | New (§7). Replaces `/qa` |
| `/finish` | Terminal sequence of every task | New: `pnpm verify` → arch-reviewer agent → fix findings (one review per change) → propose git plan (branch, commit batching for multi-task flows, PR title/body with verification record) as options → **on owner approval**: commit → push → PR |

**Mandatory plan-template sections** (enforced by instruction in CLAUDE.md + checked by
`/finish`, since the plan template itself lives in the external plugin):

1. *Architecture Placement* — every new file names its owning package per spine §4, before code.
2. *Verification Plan* — which surfaces `/verify` will run and what proves each step.

**Plugin precedence** stated once in CLAUDE.md: repo law overrides plugin skill triggers; named
known conflict: the superpowers TDD skill never applies (G-7).

### 5.4 Hooks (G-2)

Three deterministic PreToolUse guards, wired in `.claude/settings.json`, scripts in
`.claude/hooks/`:

1. **Applied-migration guard** — block Edit/Write on any file under `packages/db/migrations/`
   that exists in git HEAD (append-only means new files only). Makes the currently-false claim
   in db-schema.md true.
2. **No-test-files guard** — block Write of paths matching `*.test.*` / `*.spec.*` (mechanizes
   the no-unit-tests directive).
3. **No `--no-verify`** — block Bash `git commit` containing `--no-verify`.

Each gets a matrix row with a review date; zero catches by then → remove again.

## 6. Agent architecture

`.claude/agents/*.md`, each with restricted tool grants (the constraint the deleted lens
agents claimed, now on machinery that exists):

| Agent | Model | Tools | Role |
|---|---|---|---|
| `qa-web` | sonnet | browser pane + Bash | Drives Next.js dev server; asserts on text/accessibility tree, not pixels; requires clean console + network |
| `qa-mobile` | sonnet | iOS Simulator MCP + Bash (adb) | Both platforms; ports Metro lore (pre-warm, loading-screen-is-inconclusive, 2× timeout — properties of RN, not of the old executor) |
| `qa-api` | sonnet | Bash (curl, read-only psql) | Contract-level API checks + db state via `qa_readonly` on the existing local container (G-3 — never a new container or db clone; role provisioning re-homed to `infra/`) |
| `qa-parity` | sonnet | Read, Grep + surface reports | Behavior parity, intentional-divergence correctness (docs/13 UXG-PAR), copy/msgid identity, view-model drift (Law 11) |
| `arch-reviewer` | inherit | Read, Grep, Glob (read-only) | Final review: shared logic in apps, contract/token bypass, duplicated utilities, wrong ownership, dependency violations, RN/Next leaks, **pointer integrity** (diff deletes a file governance still cites → finding) |

## 7. QA architecture — `/verify`

Ports the executor-agnostic core of `/qa`; everything Antigravity-shaped dies (that was ~half
of SKILL.md and 0.8M–3.5M external tokens/run).

1. **Scope** — blast radius from `git diff` (+ `--cached`): path→surface mapping table,
   grep-actual-consumers for shared packages, zero-cell abort. Minimum effective regression
   scope: surfaces and quadrants derive from the diff, never "run everything."
2. **Plan** — four quadrants (happy / negative / edge / regression) × affected surfaces,
   plan-time severity, market-pack-derived test data. Plan lives in the session scratchpad.
   The plan is immutable during the run (never edited to make a failure disappear).
3. **Execute** — one agent per surface, all in parallel (web ∥ mobile ∥ api). Artifact-or-
   inconclusive: evidence (view trees, curl outputs, logs) captured to the scratchpad and
   cited; a claim without evidence is inconclusive, not a pass. Structured findings returned,
   never transcripts.
4. **Parity** — qa-parity merges surface reports against both implementations (Law 11 check,
   msgid identity, divergence correctness).
5. **Triage & loop** — four buckets (bug / product-question / false-positive / environment;
   environment doesn't consume a round). Root cause before any fix; product-shaped findings
   stop and ask (docs/13 / docs/15 first, per standing law). Fix rounds re-run only the
   failing scope + a fresh blast radius of the fix. Hard stop at 3 rounds; one certify pass in
   fresh context.

**Output & hygiene (G-3, G-4, G-5):** structured verdict per surface + parity, embedded by
`/finish` into the PR body — the durable verification record. Then: scratchpad evidence
deleted, QA-started processes stopped (dev server, Metro, emulator it booted), repo tree
untouched. QA never edits source; fixes go through the normal edit flow. QA never provisions
infrastructure: db verification uses the existing local postgres container via `qa_readonly`
(G-3) — no new containers, no db clones.

## 8. Repository structure for governance

```
heliogrid/
├── CLAUDE.md                        # thin constitution (~120 lines): working style,
│                                    # brainstorm→plan→implement→verify→finish loop,
│                                    # product-law digest (dated), command gates, pointer map
├── AGENTS.md → CLAUDE.md            # preserved symlink, now documented in docs/17
├── docs/
│   ├── architecture.md              # THE SPINE (§3 of this spec)
│   ├── 17-engineering-governance.md # slim meta-doc: laws · hierarchy · matrix (+expressiveness)
│   │                                # · governance change protocol (deletion sweep) · AGENTS.md
│   │                                # · docs/research ruling · .superpowers/sdd status
│   └── 02/03/04…                    # design records; status banners; pointer to spine
├── .claude/
│   ├── settings.json                # permissions + 3 hooks
│   ├── hooks/                       # the 3 deterministic guard scripts
│   ├── rules/
│   │   ├── 00-laws.md               # rewritten digest — pointers, no duplication
│   │   ├── web-platform.md          # loads on apps/web/**: RSC/client boundary, DOM isolation
│   │   ├── mobile-platform.md       # loads on apps/mobile/**: RN primitives (all of src/),
│   │   │                            # native adapters, expo/AsyncStorage bans
│   │   ├── cross-platform.md        # loads on both apps: Law 11 delivery, forms, ApiErrorText,
│   │   │                            # shared copy, app-facing i18n rules (rescoped here)
│   │   ├── contracts.md             # delta only
│   │   ├── db-schema.md             # delta only; hook claim now true
│   │   └── i18n.md                  # package-facing content only
│   ├── skills/  contract-change/ · migration/ · verify/ · finish/
│   └── agents/  qa-web · qa-mobile · qa-api · qa-parity · arch-reviewer
├── packages/*/CLAUDE.md             # conventions + landmines + DoD only
├── tests/invariants/CLAUDE.md       # NEW — the proof layer gets its layer law
├── infra/                           # + qa_readonly provisioning
└── README.md                        # governance sections → pointers
```

Mechanical cheap wins (existing mechanism classes only): `@lingui/macro` +
`@lingui/react/macro` Biome ban · `tenant_id`-never-in-body invariant (contract schemas are
already imported by tests/invariants) · ui-api gets its own turbo tag · dead dep-cruiser
exemptions deleted · `pnpm verify` reordered to build before lint.

## 9. Migration strategy

Each phase is one PR; the repo is self-consistent after each. The PR workflow (G-1) applies
from Phase 0.

- **Phase 0 — Stop the lies.** Purge false claims (db-schema.md:10 + migration skill hook
  claim; docs/17 /doc-sync + lens rows + committed-.qa + sed-i row + counts; ci.yml Law-2
  label) + the five mechanical cheap wins + dead dep-cruiser exemptions.
- **Phase 1 — The spine.** Author docs/architecture.md from verified reality; slim the 15
  package CLAUDE.mds; banner docs/02 (and docs/04's Better Auth content) with pointers.
- **Phase 2 — Rules & laws.** Rewrite CLAUDE.md, 00-laws.md, docs/17 (with a keep-or-kill
  disposition for every current §5 row); restructure .claude/rules per §8's tree; Laws 10, 11,
  Law 8 amendment.
- **Phase 3 — Agents & workflow.** Five agents, `/verify`, `/finish`; retire `/qa` with a
  full citation sweep in the same change (grep, not a list — known citers today: CLAUDE.md,
  00-laws.md, README.md, docs/17, ADR-0024) + drop `.qa/` from .gitignore/biome/
  .graphifyignore; add the 3 hooks; owner enables branch protection.
- **Phase 4 — Perimeter sweep.** README pointers; docs/13 (20-day framing; record the two
  pre-identified UXG-PAR findings: RN's unreachable OfflineBanner / missing connectivity
  gating, RN's missing resend spinner); docs/14 (dead modules/ pointers, Track F Better Auth,
  20-day remnants); docs/15 (R19 id collision, D23 day refs); docs/product/README.md dead
  pointer; .env.example; apps/mobile/src/env.ts stale docblock; tests/invariants CLAUDE.md;
  auto-memory + graphify refresh.

Order: 0 → 1 → 2 → 3 sequential; 4 any time after 2.

## 10. Risks and trade-offs

1. **The spine could rot like docs/02.** Mitigations: no counts/consumer lists, mandatory
   banners, deletion sweep, arch-reviewer pointer-integrity checks on every PR.
2. **Rewrite could lose battle-tested text.** Everything the audit marked works-well is ported
   verbatim; Phase 2 carries a keep-or-kill table for every docs/17 §5 row.
3. **Hooks were removed once for catching nothing.** Three deterministic guards with a matrix
   review date; zero catches → removed again.
4. **Claude verifying Claude** loses external-executor independence. Kept: artifact-or-
   inconclusive, independent parity agent, fresh-context certify pass.
5. **QA cost moves in-session.** Mitigations: diff-derived minimal scope, Sonnet executors,
   structured returns, no screenshots. Cheaper than 0.8–3.5M external tokens, but not free.
6. **Outward pushes.** Nothing is committed or pushed without owner approval (G-1); gates +
   review run before the proposal; branch protection makes the PR lane mandatory so CI guards
   always fire.
7. **Sonnet executors have weaker judgment.** They only walk-and-assert plans authored by the
   session model; triage and root cause never run on Sonnet.

## 11. Phased implementation roadmap

| Phase | Size | Contents | Depends on |
|---|---|---|---|
| 0 | Small (one sitting) | False-claim purge + mechanical wins | — |
| 1 | Largest | Spine + 15 package-file slims + banners | 0 |
| 2 | Large | Constitution / laws / rules rewrite | 1 |
| 3 | Medium | Agents, /verify, /finish, /qa retirement, hooks, PR flip | 2 |
| 4 | Small | Perimeter sweep | 2 |

---

## Appendix A — Defect register (audit-verified, feeds Phases 0 and 4)

**False enforcement claims (Phase 0):** db-schema.md:10 and migration SKILL.md hook claim ·
docs/17 §5 /doc-sync row, lens-agents row, sed-i pointer-to-nowhere, no-push row gap,
"27 rules" count · docs/17 §3 "committed .qa" · ci.yml:71 "Law 2" label · docs/17 Appendix A
garbled line-budget bullet.

**Duplication to collapse (Phase 2):** tiebreakers (00-laws.md:23 vs docs/17 §4) ·
never-invent-a-requirement (CLAUDE.md §2 vs 00-laws.md) · reuse principle ×4 · contracts.md 5
of 8 bullets vs packages/contracts/CLAUDE.md · db-schema.md enum bullet vs packages/db/CLAUDE.md
· migration §2 tenant-table list · five duplicated blocks across the two app CLAUDE.mds ·
Record<TheEnum> ×2 · Hindi width ×2 · INR grouping ×2 · war-story parentheticals
(db-schema.md:31-33, contracts.md:22-28).

**ADR-0023/0024 fallout (Phases 1–2 as files are touched):** contract-change §3 false claim +
§4 dead client paths · packages/contracts/CLAUDE.md (domain dep, tenancy claim, ports/) ·
packages/domain/CLAUDE.md ("went LIVE" edges, landed-so-far omissions) · apps/api/CLAUDE.md
domain dep · apps/web/CLAUDE.md lib/ conventions vs its own landmine · apps/mobile/CLAUDE.md
(metro landmine, nav deps) · packages/ui "21-component" ×2 · ui-api "NEVER a React import" vs
type-only reality + undocumented turbo tag aliasing · i18n copy-module description · config
"used by" claim · forms missing error-map/z-export · tokens "uses nothing" · oxlintrc
reference · docs/02 §2 map + env claim + present-tense Better Auth/voice/modules/queues/
PowerSync/studio-engines · docs/03 §4 @ts-rest/react-query row + .dependency-cruiser.js name ·
.env.example:33 · .graphifyignore:34 · README.md:187 precommit description · CLAUDE.md §6
"staged files" claim · CLAUDE.md §9 "@ts-rest build failure" stage/scope wording.

**Scoping & mechanism gaps (Phases 0/2):** i18n app-facing rules rescoped to cross-platform.md
· @lingui/macro Biome ban · tenant_id invariant · ui-api turbo tag (+ document or split the
coarse `app` tag) · verify build-before-lint · knip: wire or soften CLAUDE.md §6's implication
· env two-allowlist sync assertion · COPY_DEBT rot-guard in check-adherence.sh · append-only
migration check on push to main as well as PRs · mobile RN-primitive lint scope beyond
src/screens/** · web Server/Client + DOM-isolation rule (new, in web-platform.md) ·
apps/mobile deliberate @heliogrid/config absence documented.

**Parity findings to record in docs/13 (Phase 4, product-shaped):** RN OfflineBanner
unreachable / no connectivity gating · RN missing resend-in-progress spinner.
