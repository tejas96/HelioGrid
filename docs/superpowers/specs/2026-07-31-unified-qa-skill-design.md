# Design — `/qa`, one goal-driven QA skill replacing `/verify-app` and `qa-breaker`

Status: approved design, not yet implemented · 2026-07-31

## Why

Two things exist today and neither does the job.

`.claude/agents/qa-breaker.md` declares `tools: Read, Grep, Glob`. It cannot run the
application. It reads code and imagines attacks, which means its findings have never once
been confirmed against a running system. Its attack taxonomy is genuinely good; its
execution model is fiction.

`.claude/skills/verify-app/SKILL.md` does run things, but Claude drives every tap itself.
That is slow and token-expensive, and it explicitly gives up on Android: *"an agent cannot
drive that half"*. Rows land as `blocked(android walk pending)`.

The fix is not to merge two files. It is to move QA execution to a fast model with real
device access, and keep Claude for the two things it is actually better at: deciding what
to test, and fixing what breaks.

## Shape

**One skill, `/qa`, at `.claude/skills/qa/SKILL.md`.** Not an agent — every agent in this
repo is a read-only reviewer, and this thing writes fixes.

Claude plans and fixes. `agy` executes. The division is fixed, not negotiated per run.

```
preflight → scope → plan → [ execute (agy) → triage → fix → re-run ]* → certify → evidence
            └── Claude ──┘                      └───── Claude ─────┘
```

The loop is **goal-driven and owned by the skill itself**. `/qa` does not return after one
pass. It terminates on exactly one of two conditions: a clean full certify run, or three
completed fix rounds with failures remaining, which escalates to the owner. There is no
`/goal` command on this machine — the stopping condition lives with the QA semantics that
define it.

## What happens to the old files

Both are deleted. Their two load-bearing assets survive:

- qa-breaker's attack taxonomy — empty/error/offline, double-submit, stale data,
  cross-tenant probes, authorization matrix, absurd inputs, realistic volume, timers and
  lifecycle — becomes the **adversarial quadrant** of
  `.claude/skills/qa/references/test-matrix.md`. Its new job is to be part of the checklist
  Claude walks when **generating** plan steps.
- verify-app's state walk (loading, empty, error, offline; 375 and 1440; Hindi; keyboard
  and focus) becomes the happy-path and edge quadrants of the same file, and its evidence
  standard ("specifics, not adjectives", with its good/bad examples) becomes the report
  contract the executor is held to.

Nothing else survives. Both files are deleted outright rather than deprecated in place —
one source of truth for how this repo tests, so there is no second document for a future
session to follow by accident. Implementation includes a grep proving zero references
remain anywhere in the tree.

`/lenses` drops from five lenses to four: senior engineer, UX, EPC domain, product owner.
Reading code adversarially and running the app adversarially are different jobs, and
merging them is how you get a QA agent that has never opened the app. `/lenses` stays a
fast read-only review; `/qa` is the execution gate.

## Capability matrix

Verified on this machine 2026-07-31, not assumed.

| Surface | Mechanism | Status |
|---|---|---|
| Backend API | `curl` | ready |
| Database | `docker exec heliogrid-pg-local psql` (container has the client; host does not) | ready |
| Android | `adb` install / `am start` / `input tap` / `exec-out screencap` | ready once an emulator is booted |
| Web | Playwright MCP registered for `agy` (`~/.gemini/antigravity-cli/mcp`) | needs one-time config |
| iOS | `idb` for tap/swipe/text + `xcrun simctl` for install/launch/screenshot | needs `brew install idb-companion` + `pipx install fb-idb` |

`xcrun simctl` alone has no tap primitive, which is why `idb` is a prerequisite rather
than a nicety. This design **unblocks Android**, which `/verify-app` could not drive at all.

## Run scope — diff-derived blast radius

Claude reads the actual diff and computes what the change can reach: touched screens,
endpoints and tables, plus — for a `packages/ui` or `packages/domain` change — every
consumer of the changed symbol. Added to that is a small always-on core: tenancy
isolation, money reconciliation, auth.

Nothing is hardcoded, so nothing rots as modules land. Run time scales with change size.

## Coverage — four mandatory quadrants

A plan that only walks the happy path proves nothing, and a plan that is only adversarial
never confirms the feature works. Both old files had exactly one half of this: `verify-app`
walked states, `qa-breaker` only attacked. **Every surface in the blast radius gets steps in
all four quadrants**, drawn from `references/test-matrix.md`:

| Quadrant | What it proves | Examples |
|---|---|---|
| **Happy path** | the feature does what it was built to do | full login → OTP → home; correct code first try; every success state renders |
| **Edge cases** | the boundaries hold | zero rows, exactly one row, max-length Hindi label, first and last page, value exactly at the limit, 30s countdown at 0 |
| **Negative paths** | designed failures behave | wrong OTP, expired session, malformed payload, unauthorized role, 4xx/5xx envelope shape and status match the contract |
| **Adversarial** | it survives being attacked | double-submit, offline mid-flow, cross-tenant probes, stale data after mutation, absurd inputs, realistic volume, backgrounded timers, rotation, locale switch mid-flow |

**Generation fails if any quadrant is empty for a touched surface.** This is a mechanism,
not an aspiration: Claude counts steps per (surface × quadrant) before handing off, and a
zero cell aborts the run with the gap named. A plan is allowed to be small; it is not
allowed to be lopsided.

The adversarial quadrant is where the plan is written to *break the feature*, not to
exercise it. Steps there are authored assuming the implementation is wrong until proven
otherwise — the intelligence lives in Claude's step authoring, since the executor only executes.

## Plan format

`.qa/<run-id>/plan.json`. Claude authors it; **the executor may never modify it**.

```json
{
  "plan_id": "2026-07-31-1642",
  "slice": "auth-tenancy T-12",
  "blast_radius": { "screens": [], "endpoints": [], "tables": [] },
  "steps": [{
    "id": "WEB-LOGIN-007",
    "surface": "web",
    "category": "double-submit",
    "instructions": ["navigate to /login", "enter +919876543210", "tap Send OTP twice inside 200ms"],
    "expected": "exactly one POST /auth/otp/send appears in the network log",
    "artifacts_required": ["WEB-LOGIN-007.network.json"],
    "severity_if_failed": "major"
  }]
}
```

Severity is decided by Claude at plan time, not by the executor at report time. It reports
only pass / fail / inconclusive. That removes an entire class of judgement from the fast
model. Anything touching money reconciliation, tenancy isolation or provenance tiers is
authored as `blocker`.

Stable step IDs make rounds diffable and make "re-run the failures" precise.

## Pixel-level checking

Do not ask a vision model whether a gap is 12px or 16px. It will confidently guess.

- **Exact values** come from the DOM: Playwright reads `getComputedStyle`, and the step
  asserts the computed string against `dist/tokens.json`. Deterministic, no model
  judgement, and it matches the law that tokens are generated and never hand-transcribed.
- **Vision** is used only for what it is genuinely good at: clipping, overlap, truncation,
  broken Devanagari run-splitting, and layout collapse at 375px.

## Runbook — how the executor is prompted

`.qa/<run-id>/runbook.md`, passed headless:

The executor is **Antigravity CLI (`agy`) v1.1.9**, not Gemini CLI. It runs on the owner's
Google AI Pro subscription rather than usage-based API billing. This exact invocation is
verified working:

```bash
~/.local/bin/agy \
  --dangerously-skip-permissions \
  --add-dir "$PWD/.qa/<run-id>" \
  --add-dir "$PWD" \
  --output-format json \
  --json-schema .claude/skills/qa/references/report-schema.json \
  -p "$(cat .qa/<run-id>/runbook.md)"
```

`--json-schema` **enforces** the report shape at the CLI layer rather than hoping the model
conforms — a strictly better mechanism than the prompt-only contract this design originally
assumed.

**`--add-dir` is mandatory and is the sharpest trap in the whole design.** Without it, a run
that needs to touch files outside the workspace reports `status: SUCCESS` with a cheerful
`"DONE"`, consumes tokens, takes 26 seconds — **and does absolutely nothing.** No files, no
shell commands, no error, exit zero. This was observed on the very first probe. It is a
perfect silent false pass, and it is exactly why the artifact-or-inconclusive rule is
load-bearing rather than decorative.

`num_turns` in the JSON envelope is **not** a reliable signal that tools ran — it reported
`1` both when the run did real work and when it did nothing at all. Only artifacts on disk
prove execution.

Output is a single JSON envelope: `{conversation_id, status, response, duration_seconds,
num_turns, usage:{input_tokens, output_tokens, thinking_tokens, cache_read_tokens,
total_tokens}}`. The `usage` block makes per-run cost observable, which is worth logging into
`triage.md`.

No wrapper script — Claude issues the command directly, which keeps this inside the
"mechanism order: type → lint rule → instruction → script" rule.

The prompt leads with prohibitions, because the failure mode of a helpful fast model is
reporting a pass it did not earn:

1. Every step must produce its declared artifact file before it may be marked pass. No
   artifact means `inconclusive`. Never infer a result.
2. `skipped` is always acceptable. A false pass never is.
3. Never modify application source. The only writable path is `.qa/<run-id>/`.
4. Never modify `plan.json`.
5. Record observed values verbatim, never paraphrased.
6. Execute steps in order. Do not decide a step is unnecessary.

## Database access is read-only by mechanism, not by instruction

A prompt saying "SELECT only" is an instruction, and this repo prefers a mechanism.
The executor connects as a dedicated `qa_readonly` Postgres role holding `SELECT` and nothing
else. A stray `UPDATE` then fails at the database rather than relying on the model's
compliance.

## Report contract

`.qa/<run-id>/report.json`. The token-efficiency rule is simple: **passes are ID lists,
failures are full objects.**

```json
{
  "run_id": "2026-07-31-1642",
  "summary": { "total": 87, "pass": 79, "fail": 6, "inconclusive": 2 },
  "passes": ["WEB-001", "WEB-002", "API-011"],
  "failures": [{
    "id": "WEB-LOGIN-007", "surface": "web", "category": "double-submit",
    "steps_run": ["navigated to /login", "entered +919876543210", "tapped Send OTP twice in 180ms"],
    "expected": "exactly one POST /auth/otp/send",
    "actual": "two POST /auth/otp/send, both 200; second consumed a fresh OTP",
    "artifacts": ["artifacts/WEB-LOGIN-007.png", "artifacts/WEB-LOGIN-007.network.json"]
  }],
  "inconclusive": [{ "id": "IOS-004", "why": "simulator lost connection after install" }]
}
```

Claude reads a compact ID array plus rich detail only where it matters. The report carries
no severity field — Claude joins each failure back to its `severity_if_failed` in
`plan.json` by step ID, so severity is always the value decided at plan time.

**Artifact verification is not optional.** Claude checks that each claimed artifact exists
on disk and is non-empty. A pass whose artifact is missing is rewritten to `inconclusive`
regardless of what the executor reported. Claude reads every failure artifact in full, and
spot-checks passes at a fixed rate: every step whose `severity_if_failed` is `blocker`,
plus three others chosen at random. A spot-check that contradicts the report escalates the
whole run as untrusted rather than correcting the single row.

## What a run leaves behind

The QA record is part of the repo's history, not scratch. `plan.json`, `runbook.md`,
`report.json` and `triage.md` are small text files that answer "what was tested, what
broke, and what was decided" long after the run — they are **committed**.

Only `.qa/<run-id>/artifacts/` is gitignored. Screenshots and raw response dumps are large
and binary, and their evidentiary job is finished once the run is certified.

Artifact retention follows the outcome, because that is when they matter:

- **Clean certify pass** — artifacts are deleted. The report already records what they
  proved, and nobody re-reads a screenshot of a screen that passed.
- **Escalated at round three, or any run left with failures** — artifacts are **kept**.
  That is exactly the run somebody needs to look at, and deleting the evidence at the
  moment the run got hard would be the worst possible rule.

## Triage

Four buckets, and only one of them results in a code change:

- **bug** — Claude fixes it.
- **product-question** — a missing business rule or spec ambiguity. The constitution says
  never invent a requirement, so this is recorded in `docs/13` or `docs/15` and does
  **not** block a clean run.
- **false-positive** — must be justified with evidence in `.qa/<run-id>/triage.md`. Not
  waved off.
- **environment** — emulator not booted, server down. Fixed and re-run; does not consume a
  round.

## Termination

Each round re-runs the failed steps plus a fresh blast-radius calculation for the code the
fix touched, so a fix that breaks something adjacent is caught in the same round. When a
round returns clean, one **full** re-run of the original plan certifies it with fresh
artifacts.

Hard stop after three fix rounds. If it is not clean by then, something structural is
wrong and Claude escalates rather than grinding.

**Claude may never edit the plan to make a failure disappear.** This is "never weaken a
gate to make a change pass" applied to QA. Stated explicitly because a fix loop under
pressure will eventually rationalize deleting a step.

If the executor itself fails — non-zero exit, unparseable JSON, or a hang past the per-run
timeout — the whole run is `inconclusive`, retried once, then escalated. A crashed
executor is never a pass.

## Files

**Created**
- `.claude/skills/qa/SKILL.md`
- `.claude/skills/qa/references/test-matrix.md` (four quadrants; adversarial ported from
  qa-breaker, happy/edge ported from verify-app)
- `.claude/skills/qa/references/report-schema.json`
- `.gitignore` entry for `.qa/*/artifacts/` only

**Deleted — completely, not deprecated**
- `.claude/skills/verify-app/` (whole directory)
- `.claude/agents/qa-breaker.md`

Followed by `grep -rn "verify-app\|qa-breaker"` over the tree returning only intentional
historical mentions in dated plan documents, which are records of what happened and are not
rewritten.

**Updated (Law 8, same change)**
- `CLAUDE.md:21` — `/verify-app` → `/qa`
- `.claude/skills/slice/SKILL.md:47` — Verify row
- `.claude/skills/lenses/SKILL.md` — frontmatter `description` (drop "and QA trying to
  break it"), the `# The Five Lenses` heading, the "three specialists" dispatch line, and
  the `qa-breaker` table row
- `docs/foundation-redesign.md` — four references
- `docs/modules/auth-tenancy.md:45` and
  `docs/superpowers/plans/2026-07-31-mobile-screen-segregation.md` — `/verify-app` mentions

## Verified on this machine — 2026-07-31

Every claim below was executed, not assumed.

- **Executor is Antigravity CLI `agy` v1.1.9**, installed to `~/.local/bin/agy` via Google's
  official script (SHA512-verified, no sudo). The installer appended a PATH export to
  `~/.zshrc`, so it now shadows the Antigravity **IDE** launcher that also happens to be
  named `agy` at `~/.antigravity-ide/antigravity-ide/bin/agy`. Those are different programs;
  the IDE one has no `-p` and dispatches prompts into a GUI panel that no script can read.
- **It runs on the Google AI Pro subscription, not API billing.** Proven by moving
  `~/.gemini/.env` aside and blanking `GEMINI_API_KEY` and `GOOGLE_API_KEY` — it still
  answered. Auth is cached OAuth from an interactive session.
- **Headless `-p` works from a subprocess with captured stdout.** Open issue #76 (silent
  stdout drop on non-TTY) does **not** reproduce on 1.1.9; no PTY wrapper is needed, and
  wrapping in `script(1)` actually corrupts output with a stray `^D`.
- **Shell and file tools work headlessly** with `--dangerously-skip-permissions` plus
  `--add-dir`. A probe ran `curl`, wrote an artifact, and wrote a correct `report.json`.
- **Quota is comfortable.** Eight parallel `agy` calls all succeeded. For contrast, the
  Gemini API free tier rejected 18 of 25 concurrent requests at
  `GenerateRequestsPerMinutePerProjectPerModel-FreeTier = 5`.
- **`agy` is an agent, not a single-shot API.** One invocation loops internally with tools,
  so a multi-step plan is a small number of invocations rather than one API call per step.
  This is a fundamentally better fit than the raw API the design originally assumed.

### Why not Gemini CLI

Google has discontinued Gemini CLI for Pro, Ultra and free accounts; only paid API-key users
retain it. Attempting OAuth returns `IneligibleTierError` with
`reasonCode: UNSUPPORTED_CLIENT` and `tierId: free-tier`, directing users to Antigravity.
The API-key path works but sits at 5 requests/minute without usage-based billing — slower
than Claude executing directly, which would invert this design's entire rationale.

## Prerequisites

Item 1 is done. The rest are plan steps:

1. ~~Executor~~ — **done**: `agy` v1.1.9 installed and authenticated on the Pro subscription
2. `brew install idb-companion && pipx install fb-idb`
3. Playwright MCP registered for `agy` (`~/.gemini/antigravity-cli/` holds an `mcp` dir)
4. `qa_readonly` Postgres role created with SELECT-only grants
5. A booted Android emulator and iOS simulator, checked in preflight

## Non-goals

- **No authored test files.** The repo bans `.test.*` and `.spec.*`; `plan.json` is data,
  not test code, and is regenerated per run rather than maintained.
- **No wrapper script** around the `agy` call.
- Not a replacement for `pnpm verify`. Gates prove compilation; `/qa` proves behaviour.

## Known risks

- **The `--add-dir` silent no-op is the top risk.** A missing or wrong workspace directory
  produces `SUCCESS` + `"DONE"` + zero work + exit zero. Preflight must assert every path the
  plan will touch is passed via `--add-dir`, and the artifact check is the backstop. Never
  treat `status: SUCCESS` as evidence of anything.
- **Two different programs are named `agy`.** The IDE launcher and the CLI. If PATH order
  changes, the skill silently starts driving a GUI that returns nothing. Preflight asserts
  `agy --version` reports `1.1.9`-style output rather than `Antigravity IDE`.
- **Executor reliability on long plans.** Mitigated by artifact-or-inconclusive and Claude's
  independent artifact check, but a long plan may still degrade. The fix is chunking the plan
  by surface, never loosening the evidence rule.
- **Toolchain drift.** `idb` and the Playwright MCP are local dependencies a new machine will
  not have. Preflight must fail by name rather than silently skipping a surface.
- **Auth is machine-local and undocumented in the repo.** Cached OAuth credentials live under
  `~/.gemini/antigravity-cli/` and are not version-controlled. A second machine reproduces
  none of it, so preflight must detect and explain rather than fail confusingly mid-run.
- **Subscription quota is real but unpublished.** Google documents Pro as "high, generous
  quota, refreshed every five hours until weekly limit reached" without numbers. Eight
  parallel calls passed, but the weekly ceiling is unknown. Log `usage.total_tokens` from
  each run's JSON envelope into `triage.md` so consumption becomes measurable over time.
