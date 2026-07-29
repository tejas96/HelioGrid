# HelioGrid — AI Engineering Foundation Redesign

**Status: PROPOSAL** (2026-07-29). Authored from a 9-agent repository audit + live official
Claude Code documentation research (citations in Appendix C). Nothing in this document is
executed yet. Execution plan: §9. Once executed, its content folds into `CLAUDE.md`,
`.claude/`, and the rewritten `docs/17`; this file then moves to `docs/archive/`.

---

## 0. Audit verdict — what is actually wrong

The previous system was not bad law; it was **good law with the wrong enforcement shape**.
Ten findings drive everything below (full register with evidence: Appendix B):

| # | Finding | Severity |
|---|---|---|
| F1 | **The CI test gate is vacuous.** Turborepo strict env mode strips `DATABASE_URL`/`DATABASE_ADMIN_URL` from the `test` task; `tests/invariants` prints SKIP and exits 0. The tenancy/RLS invariant — the property the whole product depends on — has *never executed in CI*. Verified by experiment. | critical |
| F2 | **Nearly every product law was prose-only.** Provenance tiers, money-never-stale, contract-first ordering, web+RN lockstep, tenant_id-on-new-tables, 450-line cap, no-raw-hex, sed/perl -i ban, append-only migrations — none had a mechanism. Only the architecture graph (dependency-cruiser/biome/sherif/boundaries) was mechanical. | high |
| F3 | **The authority chain dangles.** Twelve files — docs/17 §5, docs/02, docs/08, ADR-0002, ADR-0020, both module docs, and five per-package CLAUDE.mds — cite root-`CLAUDE.md` sections (`§Structure`, `§Layer quick-ref`, `§Slice workflow`, `§Definition of done`, `§Enforcement matrix`) that never existed in any committed CLAUDE.md. The referenced constitution lived only in a working tree. | high |
| F4 | **Governance was 4 layers deep and ~19.6k tokens**, duplicating itself 3–5× per rule (error envelope ×3, tenancy defence ×5, lockstep ×5, Five Lenses ×3, per-package template ×2 with contradictory line budgets) — violating its own Law 4. The `.claude/rules/` layer had no loading mechanism at the time; compliance depended on the agent obeying a prose read-order. | high |
| F5 | **Master product truth lives outside the repo** (`Solar-App-POC/docs/product-journey.md`, ~24k tokens, ~40% superseded when read without the docs/15 overlay) and the studio census gate has **two competing canonical sources** (POC `phase-10-prompts.md` per D39 vs `docs/research/phases710.md` §2 per BLUEPRINT/ADR-0017). | high |
| F6 | **The self-declared "highest-risk drift in the repo" is unguarded**: `packages/db` pgEnums hand-mirror `packages/contracts` z.enums; `db-no-upward` correctly forbids the import, so nothing checks parity. | high |
| F7 | **Two structural duplications exist today**: (a) the login flow state machine is re-implemented web + RN with *behavioral drift already present* (done-dwell 1400ms vs 900ms, different offline detection, different failure unions); (b) 25 component APIs are hand-mirrored between `packages/ui` and `apps/mobile/src/ui` with parity enforced only by humans comparing two galleries. | high |
| F8 | **`packages/domain` is a phantom.** It does not exist, yet 2 inert dep-cruiser rules, the turbo `domain` boundaries tag, five per-package CLAUDE.md mentions, and the old constitution all treat it as load-bearing. Domain behavior lives in `apps/api` services. | medium |
| F9 | **Enforcement assets are stranded in the working tree**: the 19-rule dependency-cruiser config (with two silent-pass bugfixes over HEAD), biome `noProcessEnv`, turbo i18n/ui tags, the entire app restructure (green: typecheck 8/8, cruiser 0 violations / 255 modules) — all uncommitted. The i18n extract guard is currently RED against it. `pnpm boundaries` never runs in CI. The vendored `_adherence.oxlintrc.json` is dead config (oxlint installed nowhere). | medium |
| F10 | **Zero automated tests in apps.** Every "VERIFIED" milestone is a manual session recorded in commit messages — unreproducible after any rebuild, invisible to regression. | medium |

**What worked and must be preserved:** the per-package CLAUDE.mds (current, incident-driven,
dated landmines — the healthiest layer); the Five Lenses + module-roadmap system (auth-tenancy
tasks 0–2 closed the traceability loop with real evidence); the specs-extraction pattern
(`docs/modules/auth-tenancy/specs/` cuts per-task doc load from ~65–80k to ~22–27k tokens);
the mechanical core (dep-cruiser 19 rules, tokens contrast gate, RLS invariant design, i18n
extract guard); and the docs corpus itself, which is unusually coherent.

---

## 1. Design principles

**P1 — The enforcement ladder.** Every rule is classified once and lives at exactly one rung.
A rule may only be prose if no lower rung can hold it:

1. **Type system / codegen** — drift becomes a compile error (contracts-inferred types, `Record<Enum,…>` maps, generated tokens).
2. **Lint / CI gate** — drift becomes a red build (dep-cruiser, biome, oxlint, invariants, diff guards).
3. **Harness hook** — the action is blocked or annotated at tool-call time (`sed -i` ban, migration-edit ban).
4. **Skill** — a procedure loads on demand when that work happens (slice loop, contract change, migration).
5. **Path-scoped rule / per-package CLAUDE.md** — a constraint loads when files in its area are touched.
6. **Root CLAUDE.md** — only identity, commands, and the few laws that apply to *every* turn.
7. **Docs** — product/UX/architecture truth, loaded per-task via the module's spec extraction.

**P2 — Progressive disclosure.** Always-loaded context budget ≤ ~2k tokens (was ~2.2k
constitution + a *mandated* 15–16k prose read-path). Everything else loads by path, by skill
invocation, or by module task.

**P3 — One source of truth, pointers elsewhere, and a machine checks the pointers.** The
dangling-anchor disaster (F3) becomes a CI failure class, not a recurring incident.

**P4 — Docs are law only when reachable and current.** Binding law never lives in a file
marked SUPERSEDED, in an external repo, or under `research/` (F5). Implementation never
becomes hidden truth: a change that invalidates a doc updates the doc in the same commit
(Law 8), and the drift gates in §5 make the important cases mechanical.

**P5 — Evidence beats assertion.** "VERIFIED" requires runnable or recorded evidence; the
roadmap linter (§5.2) rejects VERIFIED rows with empty Evidence cells.

---

## 2. Keep or rebuild? — the evidence-based answer

You offered to discard `contracts`, `db`, `ui`, `tokens`, `i18n`, and the api/web/mobile
codebases. **Recommendation: keep all of them.** The audit priced both sides:

A rebuild would **lose** (and re-earn at days-to-weeks of cost):
- Verified tenant isolation: migrations 0001–0005 + the schema-scanning RLS invariant suite.
- The working token pipeline: `packages/tokens/build.ts` with a build-failing WCAG contrast gate, dual web/RN emit from one CSS source.
- Paid, complete HI/MR translations (`packages/i18n/src/locales`).
- The E2E-verified auth module encoding ~10 documented production landmines (sendOtp-vs-signIn, raw-body Better Auth mount, ContractException explicit-status 500, esbuild `@Inject`, Fly `@Public` probes, RLS boot refusal).
- The iOS keychain cookie jar (CFNetwork cookie-merge 401 trap) and both spec-faithful, device-verified login screens.
- All "VERIFIED" status — with zero app tests (F10), verification resets to nothing.

A rebuild would **gain** essentially nothing structural: the things worth changing (F6, F7,
F8) are targeted fixes measured in hundreds of lines, not rewrites. The packages are small
(config 36 · i18n ~110 · contracts 566 · tokens ~690 · db ~620 TS + 446 SQL · ui ~2,720 lines).

What we change instead (§5.2, §9 Phase 4): mechanize enum parity, mechanize UI parity,
create the real `packages/domain`, extract the shared login flow machine. Free to discard
any time: `apps/worker` shell (98 lines), the web onboarding/signup/home screens
(placeholder-grade; roadmap tasks 3+ replace them), mobile HomeScreen.

---

## 3. The new instruction architecture

Target layout (new files marked ●):

```
CLAUDE.md                        ● rebuilt constitution, ~55 lines (§3.1)
AGENTS.md                        ● one line: "CLAUDE.md"
.claude/
  settings.json                  ● permissions + hooks (§3.6, §3.7)
  launch.json                      keep as-is (web dev server)
  rules/
    00-laws.md                   ● always-loaded laws digest, ~45 lines (no paths key)
    contracts.md                 ● paths: packages/contracts/** — triggers /contract-change
    db-schema.md                 ● paths: packages/db/** — triggers /migration, RLS checklist
    ui-adherence.md              ● paths: packages/ui/**, apps/mobile/src/ui/**,
                                          apps/web/app/**, apps/mobile/src/screens/**
    i18n.md                      ● paths: packages/i18n/**, **/*.po
  skills/
    slice/SKILL.md               ● the slice loop (§7.2)
    roadmap/SKILL.md             ● module roadmap + specs extraction (§7.1)
    lenses/SKILL.md              ● five-lens review orchestration (§7.3)
    contract-change/SKILL.md     ● contract-first procedure
    migration/SKILL.md           ● append-only migration procedure
    verify-app/SKILL.md          ● run-and-look: browser + both simulators, four states
    doc-sync/SKILL.md            ● Law 8 same-commit doc updates + anchor check
    pr/SKILL.md                  ● branch/commit/PR preparation (§8)
  hooks/
    bash-guard.sh                ● blocks sed/perl/python -i, force-push (§3.6)
    migration-guard.sh           ● blocks edits to applied migrations
    edit-checks.sh               ● 450-line + raw-hex feedback after edits
  agents/
    ux-lens.md                   ● UX-master reviewer subagent
    epc-lens.md                  ● solar-EPC domain reviewer subagent
    qa-breaker.md                ● adversarial QA subagent
apps/*/CLAUDE.md, packages/*/CLAUDE.md   keep all ten (4 stale facts fixed — §3.3)
```

All mechanisms are officially documented GA Claude Code features: project `CLAUDE.md`;
`.claude/rules/` with optional `paths:` frontmatter (rules without `paths` load at launch,
path-scoped rules load on demand when matching files are read); skills at
`.claude/skills/<name>/SKILL.md` (description always in context, body loads on invocation);
subagents as flat markdown files at `.claude/agents/<name>.md` (frontmatter: name,
description, tools, model; body = system prompt); hooks + permissions in `.claude/settings.json`.

### 3.1 Root CLAUDE.md (full draft — ~55 lines, ~500 tokens)

```markdown
# HelioGrid — constitution

Multi-tenant SaaS for Indian solar EPC companies: CRM → survey → 3D design → proposal →
customer link → voice follow-up → projects → payments. The 3D Design Studio is the flagship;
nothing is compromised against it. Light-only v1 · EN/HI/MR · ₹ Indian grouping everywhere.

## How work happens here
- Work exists only as a module-roadmap task (docs/modules/<module>.md). No roadmap → /roadmap.
- Implement through /slice. It loads the task's context; do not read the docs corpus wholesale.
- Conflicts resolve by the decision hierarchy in docs/17 §4. When a doc and code disagree:
  STOP, reconcile the doc first (or flag to the owner). Docs are load-bearing for other agents.
- Stop and ask before: anything billable/external-account-shaped; schema/API outside the
  current module (Law 9); any new architectural pattern (needs an ADR first, Law 2).

## Commands
pnpm turbo typecheck · pnpm lint · pnpm turbo test · pnpm turbo build · pnpm boundaries
A task is DONE only when gates are green AND the change is verified running — browser AND
both simulators for UI (/verify-app), curl/logs for api/worker. Green gates never prove UI work.

## Hard boundaries (mechanically enforced — never weaken a gate config to pass it)
dependency-cruiser (19 rules) · turbo boundaries · biome · sherif · oxlint adherence ·
tokens contrast gate · i18n extract guard · tests/invariants (RLS, enum parity) · CI drift
guards (openapi, migrations, doc anchors). A gate that blocks you means the change is wrong.

## Product law (owner rulings + POC spec — port, don't reinvent)
- Every user-visible number carries a provenance tier: measured / derived / estimated / assumed.
- Money never renders stale: design changed + quote not recomputed → figure reads provisional.
- One money path: BOM ↔ proposal ↔ tranches ↔ project payments reconcile to the paisa.
- Sent proposals keep their original prices; price-book updates create new versions.
- Structural adequacy is NEVER computed — engineer sign-off recorded (who + when).
- ₹ uses Indian grouping (lakh/crore) in every locale; kW/kWh/kWp are never translated.
- Read + export always work regardless of billing state. Never hold data hostage.
- Server assigns all business identifiers. No feature flags — entitlements are the only gating.

## Process
- Edit/Write tools for ALL file changes. Never sed/perl/python -i (corrupted files before).
- Never edit an applied migration; append a new one.
- Schema/APIs grow module-wise ONLY (Law 9): docs/04 is frozen design, not a build order.
- Web + RN ship in the SAME slice from the same contract (Law 7); exceptions need an owner
  ruling recorded in the module roadmap.
- Testing is deliberately thin by owner decision: ported domain tests + tests/invariants only.
  Never add tests beyond these without an explicit owner request.
- Match surrounding style; files ≲450 lines; comments only for constraints code can't express.

Laws digest: .claude/rules/00-laws.md (auto-loads) · layer law: each package's CLAUDE.md ·
governance: docs/17 · product truth: docs/product/ + docs/15 overlay.
```

### 3.2 `.claude/rules/`

**`00-laws.md`** (no `paths:` → loads at launch alongside CLAUDE.md): the nine Laws in
one-line form each + the 9-level decision hierarchy + the stop-and-ask triggers. ~45 lines.
This replaces the old 9-file rules layer as *always-on* content; everything layer-specific
moved down the ladder (per-package CLAUDE.md, skills, gates).

**Path-scoped rules** (load only when Claude reads matching files) carry the cross-cutting
laws that span packages — each ≤25 lines, each pointing at its skill for the procedure:

- `contracts.md` → "contract diff comes FIRST and is the API review surface; tenant_id never
  in bodies; one z.enum per business set, types exported and inferred — never re-declared;
  after any change run /contract-change (openapi re-emit + enum-parity + client sweep)."
- `db-schema.md` → "new tables carry tenant_id or join the global allowlist in
  tests/invariants; migrations append-only via /migration; pgEnum values come from the
  parity-checked list; RLS is backstop, repository scoping is primary."
- `ui-adherence.md` → "no raw hex/px/inline style — tokens only (oxlint enforces); primary
  actions near-black, accent #5A4BFF for focus/links/selection only, never a button fill;
  compose from the component indexes — creating what exists is a defect; 44px targets;
  375px works; four states (loading/empty/error/offline) are part of done; Hindi renders."
- `i18n.md` → "one catalog; `<Trans id="English source">` runtime convention (swc-plugin
  landmine — see packages/i18n/CLAUDE.md); never mix macro and explicit-id for one string;
  kW/kWh/kWp/brand/DISCOM names never translated; run extract before commit."

### 3.3 Per-package CLAUDE.mds — keep all ten

They are the healthiest layer: current with the restructure, incident-driven, cheap
(~40 lines avg). Four stale facts to fix in one commit: `contract-exception.ts` path →
`src/common/errors/`; "db-access-in-repositories-only currently warn" and
"mobile-app-entry-thin currently warn" → both are now `error`; routes.ts "no prop callbacks"
doctrine vs RootNavigator's `onSignedIn`. Authoring rules (single copy, in rewritten
docs/17): ≤40 lines default, ≤65 for api/mobile/db; landmines mandatory on first incident,
date-stamped, updated in the same commit; commands copy-paste runnable.

Where a rules file and a per-package file disagreed historically, the per-package file was
always right — the new system encodes that: **per-package CLAUDE.md outranks any
cross-cutting rule text** (below only the Laws and gates).

### 3.4 Skills

Skills replace the 13-step prose loop with on-demand procedures. Descriptions (~30 tokens
each) are the only permanent context cost.

| Skill | Invocation | Contents (body loads on use) |
|---|---|---|
| `/slice` | user or model | The slice loop (§7.2): context loading recipe, contract-first order, lockstep, gates, verification, lenses, doc-sync, roadmap update. |
| `/roadmap` | user | Module kickoff (§7.1): specs extraction from mockups + d-decisions, roadmap authoring from `docs/modules/_template.md`, forward-compat register check. |
| `/lenses` | via /slice | Five-lens review orchestration: spawns the three lens subagents in parallel, runs `/code-review` for the senior-engineer lens, checks product-owner traceability itself; every lens must produce findings or say why none. |
| `/contract-change` | model (auto, via contracts.md rule) | Edit contract → `pnpm --filter @heliogrid/contracts openapi` → enum-parity invariant → sweep typed clients (web/mobile/api) → oasdiff vs main for breaking changes. |
| `/migration` | model (auto, via db-schema.md rule) | New migration file only; tenant_id or allowlist; RLS policy shape; `pnpm --filter @heliogrid/db migrate`; invariants run. |
| `/verify-app` | via /slice | Run-and-look: web preview via `.claude/launch.json` + browser tools; iOS/Android via simulator tools; walk the four states, 375px, Hindi, keyboard/focus; capture evidence for the roadmap row. |
| `/doc-sync` | via /slice | Law 8: list docs invalidated by the diff, update in same commit; run the anchor-checker script; append docs/13 rows for UX gaps designed in-slice. |
| `/pr` | user | §8: branch naming, commit format with VERIFIED evidence, PR body from template, changelog line in module roadmap. |

`/slice`, `/roadmap`, `/pr` set `disable-model-invocation: false` but are primarily
user-invoked; `/contract-change` and `/migration` are model-invocable so the path-scoped
rules can direct Claude into them mid-task. Skills that only orchestrate other tools set
`allowed-tools` narrowly.

### 3.5 Subagents (the lens panel)

Three custom reviewers under `.claude/agents/` (flat `<name>.md` files), each read-only +
Bash, each pointing at the relevant specs, run in parallel by `/lenses`:

- **ux-lens** — compares the diff against the mockup files named in the roadmap task and the
  module's `specs/*.md`; checks DS adherence, states, 375px, Hindi expansion, motion; where
  the mockup is silent: compose-don't-invent + log the ruling.
- **epc-lens** — domain semantics: kWp vs kWh, DC/AC, DISCOM/subsidy/GST, provenance tiers,
  engineer sign-off, Indian ₹ grouping, field reality (offline, glare, gloves → big targets).
  Checks claims against `docs/product/product-journey.md` D-census + docs/15.
- **qa-breaker** — actively attacks: empty/error/offline paths, double-submit, stale data,
  cross-tenant probes, absurd inputs (0, negative, 10⁶ kW, emoji names, 40-char Hindi
  labels), realistic volume. "A slice that was never attacked was never verified."

Senior-engineer lens = the bundled `/code-review` skill over the slice diff. Product-owner
lens = `/lenses` itself verifying the task's D-decision traceability and
complete-but-minimal scope. This keeps five genuinely different failure-mode detectors
without five bespoke prompts drifting.

### 3.6 Hooks (deterministic, minimal, fast)

`.claude/settings.json` (project, committed):

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash",
        "hooks": [{ "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/bash-guard.sh" }] },
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/migration-guard.sh" }] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/edit-checks.sh" }] }
    ]
  }
}
```

- **bash-guard.sh** (PreToolUse, exit 2 blocks): rejects `sed -i`/`perl -i`/`python … -i`
  in-place edits (file-corruption history), `git push --force` to main, `rm -rf` outside
  the repo. Message tells Claude to use Edit/Write instead.
- **migration-guard.sh** (PreToolUse, exit 2 blocks): if the target path matches
  `packages/db/migrations/*` AND the file is already tracked by git → deny ("append-only:
  create a new migration"). New files pass.
- **edit-checks.sh** (PostToolUse, exit 0 + `additionalContext`): after any Edit/Write —
  warn if the file now exceeds 450 lines (split guidance); warn on raw hex/px literals in
  UI paths (instant feedback; oxlint in CI is the hard gate).

Three hooks, all sub-second, all deterministic. Everything heavier belongs in CI (§5), not
in the editing loop.

### 3.7 Settings & permissions

Also in `.claude/settings.json`: `permissions.allow` for the routine loop
(`Bash(pnpm turbo *)`, `Bash(pnpm lint*)`, `Bash(pnpm --filter *)`, `Bash(git status)`,
`Bash(git diff *)`, `Bash(git log *)`), `permissions.deny` for `Read(.env)`,
`Read(.env.*)` (secrets never enter context; `.env.example` remains the documented
contract). Recommend `defaultMode: "plan"` so module tasks start in plan mode by default —
matching your "planning is weak before implementation" complaint; the plan is approved
before edits begin. (Note: `plan` is a valid project-level default; auto-mode defaults are
user-scope only.)

### 3.8 Memory policy

Auto-memory stays on (it already carries scaffold landmines and owner goals). Division of
labor: **repo files are for repo truth** (landmines → per-package CLAUDE.md; decisions →
ADR/docs; status → module roadmaps); **auto-memory is only for cross-session operational
state** (owner-blocked items, in-flight external clocks). A memory entry that states repo
truth gets promoted into the repo and deleted from memory.

### 3.9 Deliberately not adopted (and why)

- **MCP servers**: none needed now. GitHub work uses `gh` CLI; Postgres via `psql`/scripts.
  Every MCP server costs context; add one only when a task class demands it.
- **Plugins/marketplace**: right mechanism *later* for sharing this system across repos;
  premature while the skills are still being shaken down in-repo. Exception worth installing
  when skill-tuning starts: the official `skill-creator` plugin for skill evals.
- **Output styles**: default engineering style is correct here.
- **CLAUDE.local.md**: available for personal overrides; nothing to put in it by default.

---

## 4. Context-loading strategy

**Always-on budget (~1.3k tokens, estimated — validate with `/context` after Phase 1):**
CLAUDE.md (~500) + rules/00-laws.md (~400) + skill descriptions (~300) + MEMORY.md index (~100). Previous system: ~2.2k always-on plus a
*mandated* prose read-path of ~15–16k governance tokens per slice before any product doc.

**Per-task recipe (encoded in /slice, not left to judgment):**

1. The roadmap task row (docs/modules/<module>.md) — ~1.3k.
2. The module's `specs/` extraction for the screens in scope — ~3–7k per screen.
3. The module's `d-decisions.md` extraction (+ docs/15 rows it cites) — ~2.5k.
4. docs/04: the module's owning section ONLY — ~1–2k.
5. If UI: docs/10 relevant sections + the named mockup files — ~5.5k.
6. Per-package CLAUDE.mds and path-scoped rules load themselves as files are touched.

Total ~22–27k tokens per slice vs ~65–80k for the naive hierarchy walk — the measured gain
of the auth-tenancy specs pattern, now institutionalized: **/roadmap makes specs extraction
mandatory task 0 of every module.** Full-corpus reads are prohibited by /slice; anything
missing from the recipe is a specs-extraction gap to fix, not a reason to read the world.

Long sessions: `/clear` between unrelated tasks; `/compact` mid-task (project-root CLAUDE.md
re-injects; path-scoped rules re-attach on next matching read).

---

## 5. Quality gates

### 5.1 P0 fixes (the gate that lies, and the reds) — before anything else

1. **turbo.json**: `"test": { "dependsOn": ["^build"], "env": ["DATABASE_URL", "DATABASE_ADMIN_URL"], "cache": false }` — un-strips the env (F1); `cache:false` because DB state is an undeclared input.
2. **tests/invariants/src/run.ts**: hard-fail (`exit 1`) when URL missing and `process.env.CI` is set; skip loudly only locally.
3. **Re-run `pnpm --filter @heliogrid/i18n extract`** and commit the .po drift with the restructure (the guard is currently RED).
4. **Add `pnpm boundaries` to ci.yml** next to lint (exists, green, never ran in CI).

### 5.2 New gates (converting F2/F5/F6/F7 prose into mechanism)

| Gate | Tool | Where |
|---|---|---|
| contracts z.enum ↔ db pgEnum parity | ~50-line invariant in `tests/invariants` (static parse or pg_enum introspection — no import, so `db-no-upward` stands) | CI test |
| tenant_id presence on NEW tables | inverse scan in `tenancy-rls.ts`: every public table has tenant_id OR is on an explicit global allowlist | CI test |
| UI token adherence (no raw hex/px/inline style) + 450-line cap | **oxlint** wired into `pnpm lint` using the vendored `_adherence.oxlintrc.json` intents (`no-restricted-syntax`, `max-lines`) — resurrects the dead config | lint |
| web ↔ RN component API parity | types-only shared surface (`packages/ui-api` or a tsc assignability test): both platforms' exported prop types must satisfy one definition | CI typecheck |
| API breaking-change / drift | `oasdiff breaking` main↔head on the emitted openapi.json + a freshness diff of the committed copy | CI |
| No hand-rolled HTTP in apps | dep-cruiser rule: `axios|node-fetch|undici` (and bare `fetch` wrappers outside `lib/api-client.ts` / `src/data/`) banned from web+mobile — contract drift becomes a type error | lint |
| Migration append-only | `git diff --diff-filter=MD --exit-code origin/main...HEAD -- packages/db/migrations` | CI |
| Doc-anchor integrity | ~80-line script: every `docs/NN §M`, `CLAUDE.md §X`, `[[file]]` cross-reference in docs/ + CLAUDE.mds resolves to an existing file/heading | CI (the F3 fix) |
| Roadmap evidence | linter: `VERIFIED` rows must have non-empty Evidence; module status matches README index | CI |
| Secrets | gitleaks action | CI |
| Dead code + copy-paste duplication | knip (unused exports/files/deps) + jscpd (clone threshold) | CI, advisory→error after burn-in |
| Contrast coverage | derive fg/bg candidate pairs from `packages/ui/src/*.css` usage; fail on pairs missing from `DECLARED_PAIRS` | tokens build |
| Auth E2E replay | scripted ts-rest/curl replay of the verified auth path (dev OtpPort) against disposable Postgres; one Playwright pass over web login | CI (answers F10) |

### 5.3 The rule→mechanism matrix (governance visibility)

The rewritten docs/17 §5 becomes a **matrix with a Status column** — every law lists its
mechanism and stage (`typecheck | lint | hook | CI | invariant | skill | prose`), and "prose"
entries carry a justification. The matrix is itself checked by the doc-anchor gate. This is
the artifact that keeps prose from silently accumulating again.

---

## 6. Documentation restructure

### 6.1 Vendor the product truth (ends the external-repo dependency)

- `docs/product/product-journey.md` ← vendored from Solar-App-POC, with a header banner:
  *"Read only through the docs/15 overlay — the D-table contains superseded text"*; the
  ~190-line prompt-library tail stripped (kept in POC history).
- **Census ruling needed (owner)**: promote `docs/research/phases710.md` §2 to
  `docs/product/studio-census.md` as the single binding studio-port gate (recommended — it
  is in-repo and ADR-0017 already points at it), or vendor POC `phase-10-prompts.md`.
  One of them; the other gets a pointer banner.
- N1–N10 interaction/a11y law: extract verbatim from `docs/research/design.md` into
  docs/10 (they currently live only inside a SUPERSEDED-banner file — F5's sharpest edge);
  then archive design.md and retire the external DESIGN-SYSTEM.md dependency.
- Fix the mockup count (80, not 85) in docs/13 (lines 4, 6), docs/10 (line 10), and
  BLUEPRINT (lines 6, 35).

### 6.2 Authority chain repair

- **BLUEPRINT.md → docs/archive/** after folding the owner-directive list + user-decisions
  log into docs/15 (or one consolidating ADR). Re-point "Binding source: BLUEPRINT" headers
  (docs/02, adr/README) to ADRs + docs/02/03. Authority collapses to:
  **Laws (docs/17) → product truth (docs/product + docs/15) → ADRs + docs/02/03 → module docs**.
- docs/03 §14 telephony: reconcile with S5/ADR-0019 (BYO = inbound forwarding; no
  AgentStream DTMF-send; 140-series for promotional outbound).
- docs/04: add the Law-9 banner ("frozen design, NOT a build order"); fix its header's
  read-order reference. docs/05: fix the self-citation.
- docs/14: rewrite dateless — keep tracks/dependencies, §4 forward-compat register
  (promote to `docs/modules/forward-compat.md`), launch gate, risk register; delete the
  day calendar and the duplicate §5 template.
- Dedup per Law 4: docs/16 §1 tier table → pointer to docs/01; role matrix normative only
  in docs/08; single per-package template (in docs/17).

### 6.3 research/ two-tier labeling (archive nothing blindly — 100+ inbound links)

One-line status header on all 26 files:
- **NORMATIVE** (until promoted): journey, phases710, ds-reconciliation, uxAL, uxMZ,
  ds-usage, calc, geo3d, market, design (until §6.1 extraction lands).
- **HISTORICAL EVIDENCE**: the other 16 — plus `OVERTURNED — see ADR-000X` banners on
  backend.md and fly.md, which recommend the *wrong stack* if read standalone.
- ds-brand-law.md and ds-tokens.md: archive after re-pointing docs/10's two citations at
  the vendored `design/ds-source` (they are third copies of in-repo truth).
- POC repo: phase-3..9 prompt packs, build-plan, product-spec, planning-prompt — all
  archival; nothing in heliogrid may cite them after §6.1.

### 6.4 docs/17 rebuild

Keep Laws 1–9 + decision hierarchy verbatim. Regenerate §5 as the rule→mechanism matrix
(§5.3) with every row pointing at an existing file (anchor-gated). Move the per-package
template here (single copy). Drop the historical foundation-gate section. Result: docs/17
is the one governance document; CLAUDE.md points at it; nothing duplicates it.

### 6.5 Specs extraction institutionalized

`/roadmap` makes the auth-tenancy pattern mandatory for every module: task 0 produces
`docs/modules/<module>/specs/` (per-screen spec + d-decisions extraction with docs/15
status). This is simultaneously the context-diet mechanism (§4) and the UX↔backend drift
firewall — the spec is the reviewable contract between mockup and implementation, and the
ux-lens agent reviews against it.

---

## 7. The development lifecycle

### 7.1 Module start — `/roadmap <module>`

1. Specs extraction (task 0) from the named mockups + product-journey D-census + docs/15.
2. Roadmap authored from `docs/modules/_template.md`: traceability header (D-decisions,
   mockup filenames, docs/04 owning sections, contracts, jobs), task table with
   Status ∈ todo / in-progress / blocked(reason) / VERIFIED + Evidence column.
3. Forward-compat register check (what this module must build in NOW for later modules).
4. UX-gap register check (docs/13) — claim relevant rows.
5. Owner reviews the roadmap before implementation opens (the approval gate for scope).

### 7.2 Slice — `/slice <module> <task>`

1. **Load** the §4 recipe. 2. **Plan** (plan mode): reuse-first search of component indexes
and contracts; architecture check (new pattern → ADR first); risks + edge cases; plan
approved before edits. 3. **Contract diff first** (`/contract-change`) when the API changes.
4. **Migration** (`/migration`) only for this module's tables. 5. **Implement** web + RN in
the same slice; wire into existing flows (no orphan screens). 6. **Gates**: typecheck,
lint, test, build, boundaries. 7. **/verify-app**: run-and-look with evidence captured.
8. **/lenses** review; all critical findings resolved. 9. **/doc-sync**: same-commit doc
updates + anchor check. 10. **Roadmap row** → VERIFIED with evidence. 11. **/pr**.

Steps 3, 4, 6, 9, 10 are backed by hooks/CI gates — skipping them isn't possible silently;
the skill exists so the model does them in the right order the first time.

### 7.3 Review

Five lenses, one orchestration (§3.5). Findings land in the session; critical findings
block; the PR body carries the per-lens summary (a lens with no findings states why).

### 7.4 Definition of Done (single copy, in docs/17; checked by the PR template)

Requirements traced · architecture respected (cruiser/boundaries clean) · contract updated
first · no duplicated types/logic · gates green · verified running (browser + both
simulators for UI; curl/logs otherwise) · screens: 375px + four states + keyboard/focus +
≥44px targets + Hindi render + provenance on numbers · i18n keys in the shared catalog ·
docs + roadmap updated with evidence · lens review passed · web AND RN landed.

### 7.5 Documentation evolution (your "implementation never becomes hidden truth")

When implementation reveals a UX gap, schema need, missing business rule, or edge case:
the slice **stops at the boundary** — the finding goes into the module roadmap
(module-ruling) or docs/13 (UX gap) or docs/15 (spec resolution proposal) *first*, the
owner rules if it's product-shaped, then implementation continues. `/doc-sync` +
the drift gates make the synchronized state checkable; Law 8 makes it same-commit.

---

## 8. Git & PR workflow

- **Branches**: `mod/<module>-t<NN>-<slug>` (e.g. `mod/auth-tenancy-t03-signup`);
  `fix/<slug>`, `docs/<slug>`, `chore/<slug>` otherwise. Main stays releasable.
- **Commits**: small, complete; message records what was **VERIFIED**, not what was written
  (`auth-tenancy t3: signup screen web+RN VERIFIED — browser 375/1440, both sims, curl`).
  Dep additions called out explicitly.
- **PR template** (`.github/pull_request_template.md`): roadmap task link + D-decisions ·
  contract diff summary · DoD checklist · per-lens findings summary · evidence
  (screenshots/curl) · docs updated · known limitations.
- **CI on PR**: the full §5 matrix. **claude-code-action@v1** added for `@claude` mentions
  and an automated review pass on PRs (GA; keep `--max-turns` modest) — optional until the
  GitHub remote/org setup is finalized.
- **Changelog**: the module roadmap *is* the changelog (status + evidence per task);
  release notes compile from roadmap rows.

---

## 9. Execution plan (each phase independently verifiable; ~sized)

**Phase 0 — Rescue & P0 (half a day).** Commit the in-flight restructure (it is green and
holds the dep-cruiser bugfixes — losing it regresses the boundary layer silently) + re-run
i18n extract; apply §5.1 items 1–4; sweep the low-severity rot (dead `api<T>()` helper at
`apps/mobile/src/auth/client.ts:75`, stale biome-ignore suppressions, 4 stale CLAUDE.md
facts, routes.ts doctrine).
*Verify: CI green with invariants actually executing (break RLS locally → CI must go red).*

**Phase 1 — Instruction architecture (1 day).** Write CLAUDE.md, AGENTS.md, rules/, the 8
skills, 3 agents, 3 hooks, settings.json per §3. *Verify: fresh session shows ~1.3k
always-on tokens (/context); hooks block a sed -i and a migration edit; /slice dry-run on a
docs-only task.*

**Phase 2 — Docs restructure (1 day).** §6 in full: vendor journey, census ruling (owner
input), N1–N10 extraction, BLUEPRINT archive, docs/14 rewrite, research/ labeling,
docs/17 rebuild, dedup pass. *Verify: anchor-checker green over the whole corpus.*

**Phase 3 — New gates (1–2 days).** §5.2 in full. *Verify: each gate proven by a deliberate
violation (add a fake enum value → parity gate red; add a tenant-less table → scan red;
hex literal in a screen → oxlint red; modify migration 0001 → append-only red).*

**Phase 4 — Structural dedup (2–3 days).** Create `packages/domain` (pure TS; seed: login
flow state machine as a pure reducer consumed by both screens, phone/₹ formatters, invite/
role invariants out of auth.service) — un-dangling the 11 phantom references and making the
2 inert cruiser rules live; UI parity types package + check; auth E2E replay script +
Playwright login pass. *Verify: both login screens on one machine (drift F7a dead by
construction); parity gate red on a one-platform prop.*

**Phase 5 — Shakedown (ongoing).** Resume auth-tenancy task 3 (signup) as the new system's
first real slice; tune skill descriptions with real usage (optionally `skill-creator`
evals); only then consider packaging the system as a plugin for reuse.

Owner decisions needed before/during execution: ① census canonical source (§6.1);
② confirm keep-don't-rebuild (§2); ③ approve Phase 4's `packages/domain` creation
(architectural change, per your approval rule); ④ S5 Exotel findings review + docs/03 §14
fix (already drafted in §6.2).

---

## Appendix A — Token budget, old vs new

| | Old system | New system |
|---|---|---|
| Always-loaded | ~2.2k (constitution) | ~1.3k (CLAUDE.md + laws + skill descriptions + memory index) |
| Mandated governance read-path per slice | ~15–16k prose (rules layer, honor-system loading) | 0 — procedures load as skills on invocation; layer law loads by path |
| Product/docs context per slice | ~65–80k naive walk | ~22–27k via specs recipe (measured, auth-tenancy) |
| Enforcement of the above | prose ("read order") | /slice recipe + path-scoped rules + hooks |

## Appendix B — Findings register (evidence pointers)

- F1: turbo 2.10.7 strict env; verified experimentally (`pnpm turbo test --force` with URL
  set → "SKIP invariants", exit 0). Fix in turbo.json + run.ts fail-closed-in-CI.
- F2: full mechanical-vs-prose mapping in the quality-gates audit; mechanical set = 19
  dep-cruiser rules, biome (incl. zod/v4 ban, noProcessEnv), sherif, boundaries tags,
  sha256-locked migration runner, tokens contrast gate, i18n extract guard, RLS invariants.
- F3: grep of `git show HEAD:CLAUDE.md` — zero matches for §Structure / §Layer quick-ref /
  §Slice workflow / §Definition of done / §Enforcement matrix cited by docs/17 §5 + 8 files.
- F4: byte-accounting: constitution 8,799 B + rules 32,819 B + per-package 26,696 B +
  docs/17 10,053 B ≈ 19.6k tokens; duplication instances enumerated in the ai-config audit.
- F5: product-journey.md 103KB/1,768 lines external; superseded D-rows (D3/D4/D12/D19/D26/
  D33/D38) neutralized only by docs/15; census dual-source BLUEPRINT-directive-9 vs D39.
- F6: packages/db/CLAUDE.md self-declaration; db-no-upward prevents type-level sync.
- F7a: web 388 vs RN 441-line login machines; measured drift (dwell 1400/900ms, offline
  detection, failure unions). F7b: 25 APIs, ~5.2k combined lines, no parity tooling found.
- F8: 11 references enumerated in the apps audit; 2 inert cruiser rules.
- F9: working-tree-only assets list in the quality-gates audit; i18n guard verified RED;
  `boundaries` absent from ci.yml; oxlint in no package.json.
- F10: `find apps -name '*.test.*' -o -name '*.spec.*'` → empty.

## Appendix C — Official documentation basis

All recommended mechanisms are GA per live official docs (fetched 2026-07-29):
memory & CLAUDE.md scopes/limits, `.claude/rules/` with `paths:` frontmatter, @imports
(https://code.claude.com/docs/en/memory.md); best practices incl. <200-line CLAUDE.md and
progressive disclosure (…/best-practices.md, …/large-codebases.md); skills incl. frontmatter
schema, `disable-model-invocation`, `context: fork` (…/skills.md); subagents AGENT.md format
(…/sub-agents.md); hooks events/exit codes/JSON control (…/hooks.md, …/hooks-guide.md);
settings & permissions precedence + Bash prefix matching (…/settings.md, …/permissions.md);
plan mode (…/permission-modes.md); headless + GitHub Actions v1 GA (…/headless.md,
…/github-actions.md); checkpointing (…/checkpointing.md); plugins & skill-creator
(…/plugins.md, …/discover-plugins.md). External tools referenced (oxlint, oasdiff, gitleaks,
knip, jscpd, Playwright, axe) are mainstream, documented, CI-standard.
