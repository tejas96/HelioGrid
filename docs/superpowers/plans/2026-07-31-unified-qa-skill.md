# Unified `/qa` Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/verify-app` and the `qa-breaker` agent with one goal-driven `/qa` skill that plans QA in Claude, executes it via Antigravity CLI across five surfaces, and loops until clean.

**Architecture:** Claude computes a diff-derived blast radius and authors a scripted `plan.json` covering four mandatory quadrants; `agy` executes it headlessly and emits a schema-enforced, artifact-backed `report.json`; Claude verifies artifacts on disk, triages, fixes, and re-runs until a clean full certify pass or a hard stop at three rounds.

**Tech Stack:** Antigravity CLI (`agy`) v1.1.9 on the Google AI Pro subscription, Playwright MCP, `idb` + `xcrun simctl`, `adb`, `docker exec psql`, Postgres 16.

**Design spec:** [docs/superpowers/specs/2026-07-31-unified-qa-skill-design.md](../specs/2026-07-31-unified-qa-skill-design.md) — read it before Task 1.

## Global Constraints

- **No test files, ever.** This repo bans `.test.*` and `.spec.*` (owner directive 2026-07-29). Verification in every task below is *running a command and reading its output* — never authoring a test file. `plan.json` is data, not test code.
- **No new checker scripts.** Mechanism order is type → lint rule → instruction → script. Claude issues the `agy` command directly from skill instructions; there is no wrapper script.
- **Git is manual.** Do not commit unless the owner asks for a commit in those words. Each task below ends by *staging nothing* and reporting what changed. Where a task says "verify", that means run it and read the output.
- **Files ≲450 lines**, split by responsibility, never `*-part2`.
- **Executor is `~/.local/bin/agy` v1.1.9**, running on the Google AI Pro subscription — not usage-based API billing. Gemini CLI is discontinued for Pro/Ultra/free accounts and its API-key fallback is capped at 5 req/min, which is slower than Claude executing directly.
- **Two different programs are named `agy`.** `~/.local/bin/agy` is the CLI. `~/.antigravity-ide/antigravity-ide/bin/agy` is the **IDE launcher** — it has no `-p`, dispatches prompts into a GUI panel no script can read, and exits 0. Always invoke by absolute path.
- **`--add-dir` is mandatory.** Omit it and a run reports `status: SUCCESS` with `"DONE"`, burns tokens, takes ~26s, and **does nothing at all** — no files, no shell commands, no error, exit zero. Observed on the first probe. Pass every path the plan will touch.
- **`num_turns` proves nothing.** It reported `1` both when the run did real work and when it did nothing. Only artifacts on disk prove execution.
- **Verified invocation** (do not vary it):
  ```bash
  ~/.local/bin/agy \
    --dangerously-skip-permissions \
    --add-dir "$PWD/.qa/<run-id>" --add-dir "$PWD" \
    --output-format json \
    --json-schema .claude/skills/qa/references/report-schema.json \
    -p "$(cat .qa/<run-id>/runbook.md)"
  ```
  Plain `-p` output survives a subprocess on 1.1.9 — open issue #76 does not reproduce, and wrapping in `script(1)` corrupts output with a stray `^D`. Do not add a PTY wrapper.
- **Local dev database:** container `heliogrid-pg-local`, database `heliogrid_dev`, superuser `heliogrid`, existing roles `app_admin` / `app_runtime` / `app_user`, 45 public tables.
- **Never weaken a gate.** Claude may never edit `plan.json` to make a failure disappear.

---

## File Structure

| File | Responsibility |
|---|---|
| `.claude/skills/qa/SKILL.md` | The workflow: preflight → scope → plan → execute → verify → triage → fix → loop → certify |
| `.claude/skills/qa/references/test-matrix.md` | The four quadrants and per-surface case sources Claude walks when generating steps |
| `.claude/skills/qa/references/report-schema.json` | The exact JSON contract the executor must emit (enforced via --json-schema) |
| `.claude/skills/qa/references/runbook-template.md` | The prohibition-first prompt template rendered per run |
| `.gitignore` | Ignore `.qa/*/artifacts/` only — plan/report/triage are committed |

Deleted: `.claude/skills/verify-app/` (whole directory), `.claude/agents/qa-breaker.md`.

---

### Task 1: Local prerequisites — iOS drive, browser drive, read-only DB role

**Files:**
- Modify: Antigravity CLI MCP config (add Playwright MCP server)
- No repo files change in this task.

**Interfaces:**
- Consumes: nothing.
- Produces: the four preflight assertions Task 4's SKILL.md depends on — `idb` on PATH, `playwright` MCP visible to `agy`, role `qa_readonly` able to `SELECT`, and `~/.local/bin/agy -p` returning text.

**Already done — verify, do not redo:** `agy` v1.1.9 is installed at `~/.local/bin/agy` and authenticated on the Pro subscription. Confirm with `~/.local/bin/agy --version` (expect `1.1.9`) and `~/.local/bin/agy -p "reply with only: ok"` (expect `ok`).

**Why `qa_readonly` is not a migration:** migrations are append-only and run in production, and Law 9 restricts schema work to the current module. A QA read-role belongs to the local dev database only. Creating it via migration would ship a production security surface and violate Law 9.

- [ ] **Step 1: Install the iOS interaction toolchain**

```bash
brew install idb-companion && pipx install fb-idb
```

- [ ] **Step 2: Verify idb is on PATH and can see a simulator**

```bash
which idb && idb list-targets 2>&1 | head -5
```

Expected: a path like `/opt/homebrew/bin/idb` (or `~/.local/bin/idb`), then at least one line naming a simulator. If `idb list-targets` errors with no companion, run `idb_companion --udid $(xcrun simctl list devices booted -j | python3 -c 'import json,sys;d=json.load(sys.stdin)["devices"];print([x["udid"] for v in d.values() for x in v if x["state"]=="Booted"][0])') &` first and re-check.

- [ ] **Step 3: Register the Playwright MCP server for `agy`**

```bash
~/.local/bin/agy mcp add playwright npx -- -y @playwright/mcp@latest
```

- [ ] **Step 4: Verify `agy` can see the Playwright tools**

```bash
~/.local/bin/agy mcp list 2>&1 | grep -i playwright
```

Expected: a line naming `playwright`. If the `mcp add` subcommand does not exist, inspect `~/.local/bin/agy --help` for the MCP surface and fall back to writing the server config directly into the `mcp` directory under `~/.gemini/antigravity-cli/`:

```json
{
  "mcpServers": {
    "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] }
  }
}
```

then re-run the verify command. **If Playwright cannot be registered, stop and report it** — web is the largest surface and silently losing it would make every subsequent run misleading.

- [ ] **Step 5: Create the local read-only QA role**

`BYPASSRLS` is required because migration `0005_force_rls` forces row-level security even for table owners, and `qa_readonly` has no policies written for it — without the bypass it would read zero rows from all 45 tables and every data assertion would silently pass as "no rows". This role is **local-only**; it is never created in staging or production.

```bash
docker exec heliogrid-pg-local psql -U heliogrid -d heliogrid_dev -v ON_ERROR_STOP=1 <<'SQL'
DROP ROLE IF EXISTS qa_readonly;
CREATE ROLE qa_readonly LOGIN PASSWORD 'qa_local_only' BYPASSRLS;
GRANT CONNECT ON DATABASE heliogrid_dev TO qa_readonly;
GRANT USAGE ON SCHEMA public TO qa_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qa_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO qa_readonly;
SQL
```

- [ ] **Step 6: Prove the role can read and cannot write**

```bash
docker exec heliogrid-pg-local psql -U qa_readonly -d heliogrid_dev -tAc \
  "select count(*) from information_schema.tables where table_schema='public'"
docker exec heliogrid-pg-local psql -U qa_readonly -d heliogrid_dev -tAc \
  "create table qa_should_fail(x int)" 2>&1 | tail -1
```

Expected: first command prints `45`. Second command prints a permission-denied error mentioning `qa_should_fail` or schema `public`. **If the second command succeeds, stop** — the role is misconfigured and the read-only mechanism is not real.

- [ ] **Step 7: Prove the executor runs on the subscription and can actually use tools**

```bash
~/.local/bin/agy --version
D=$(mktemp -d); ~/.local/bin/agy --dangerously-skip-permissions --add-dir "$D" \
  --output-format json -p "Use your shell tool to run: echo hi > $D/probe.txt . Then reply DONE." >/dev/null 2>&1
test -s "$D/probe.txt" && echo "TOOLS WORK" || echo "TOOLS DID NOT RUN — check --add-dir"; rm -rf "$D"
```

Expected: `1.1.9`, then `TOOLS WORK`. **`TOOLS DID NOT RUN` is the silent-no-op failure** — the run will still have reported `SUCCESS`. Never trust the JSON `status` field as evidence that anything happened.

---

### Task 2: The four-quadrant test matrix reference

**Files:**
- Create: `.claude/skills/qa/references/test-matrix.md`

**Interfaces:**
- Consumes: nothing.
- Produces: the case source `SKILL.md` (Task 4) cites by name when generating steps, and the quadrant names `happy` / `edge` / `negative` / `adversarial` used as the `quadrant` field in `plan.json`.

- [ ] **Step 1: Create the directory**

```bash
mkdir -p .claude/skills/qa/references
```

- [ ] **Step 2: Write the test matrix**

Write `.claude/skills/qa/references/test-matrix.md` with exactly this content:

````markdown
# The four quadrants — what a plan must contain

Every surface in the blast radius gets steps in **all four** quadrants. A plan may be
small; it may not be lopsided. `SKILL.md` counts steps per (surface × quadrant) before
handing off, and a zero cell aborts the run naming the gap.

The two files this replaced each had one half of this: `/verify-app` walked states and
never attacked, `qa-breaker` attacked and never confirmed the feature worked.

## Quadrant 1 — happy path (does it do the job?)

- The complete designed flow, start to finish, with valid input and no interference.
- Every success state actually renders: the confirmation, the populated list, the receipt.
- The primary number or money figure is correct and carries its provenance tier.
- Locale EN renders; then the same flow in HI renders without clipping (allow 20–30%
  expansion).

## Quadrant 2 — edge cases (do the boundaries hold?)

- Zero rows, exactly one row, and realistic volume (200 leads, a 40-line BOM, 50 members).
- First page, last page, and the exact page boundary.
- A value exactly at its limit, one below, one above.
- Max-length strings, especially Devanagari — verify `AppText` run-splitting on mobile.
- A timer at exactly 0 (the 30s resend countdown) and immediately after.
- 375px and 1440px on web; smallest and largest supported device on mobile.

## Quadrant 3 — negative paths (do designed failures behave?)

- Wrong OTP, expired session, revoked token, malformed payload, missing required field.
- Every role against every action — a `surveyor` on an owner-only surface. The guard must
  be deny-by-default, never allow-unless-listed.
- Error envelope shape and HTTP status match what the contract declares. A route whose
  contract declares a non-base error code is exactly where the wire and the typecheck have
  disagreed before.
- Cross-tenant access returns **404, never 403** — a 403 leaks that the row exists.
- The UI surfaces the error in the user's language, not a raw code.

## Quadrant 4 — adversarial (does it survive attack?)

Author these assuming the implementation is wrong until proven otherwise.

- **Double-submit.** Rapid double tap. Submit while a request is in flight. Back, then
  resubmit. Is the in-flight guard per-action or global — and is that the right one?
- **Offline.** Airplane mode mid-flow. Connection dropped between send and verify. A
  request that succeeded on the server whose response never arrived.
- **Stale data.** Two tabs, two devices. Data changed underneath. A cached response after a
  mutation. Design changed but quote not recomputed — does money read provisional, or
  silently final?
- **Cross-tenant probes.** Any identifier from tenant B used from a tenant A session.
- **Absurd inputs.** 0, negatives, 10⁶ kW, emoji names, 40-character Hindi labels, RTL
  characters, SQL-shaped strings, 500-character free text, leading/trailing whitespace, a
  phone number with the wrong country code.
- **Timers and lifecycle.** Backgrounded app — RN timers suspend, so is the countdown
  wall-clock or interval based? Rotation. Locale switched mid-flow. Session expiring
  mid-flow.

## Pixel precision — measure, do not eyeball

Never ask the model whether a gap is 12px or 16px; it will confidently guess.

- **Exact values** come from the DOM. Playwright reads `getComputedStyle`, and the step
  asserts the computed string against `packages/tokens/dist/tokens.json`. Deterministic,
  no model judgement.
- **Vision** is used only for what it is good at: clipping, overlap, truncation, broken
  Devanagari run-splitting, and layout collapse at 375px.

## Always-on core, regardless of blast radius

Every run includes at least one step for each:

- Tenancy isolation — a cross-tenant read returns 404.
- Money reconciliation — BOM ↔ proposal ↔ tranches agree to the paisa.
- Auth — an unauthenticated request to a protected route is rejected.

## Evidence standard

Specifics, not adjectives.

**Good** — "browser 375+1440 happy / wrong-code / send-error paths; iPhone 16 relaunch
restores session; Pixel 8 fresh user passes; curl 409 returns ALREADY_ONBOARDED".
**Bad** — "verified working".
````

- [ ] **Step 3: Verify the file is well-formed and complete**

```bash
test -f .claude/skills/qa/references/test-matrix.md && \
  grep -c "^## Quadrant" .claude/skills/qa/references/test-matrix.md && \
  wc -l .claude/skills/qa/references/test-matrix.md
```

Expected: `4` quadrant headings, and a line count under 450.

---

### Task 3: The report schema and runbook template

**Files:**
- Create: `.claude/skills/qa/references/report-schema.json`
- Create: `.claude/skills/qa/references/runbook-template.md`

**Interfaces:**
- Consumes: quadrant names from Task 2.
- Produces: the `report.json` shape Task 4 validates against, and the runbook template Task 4 renders per run. Field names used by later tasks: `summary.{total,pass,fail,inconclusive}`, `passes[]`, `failures[].{id,surface,quadrant,steps_run,expected,actual,artifacts}`, `inconclusive[].{id,why}`.

- [ ] **Step 1: Write the report schema**

Write `.claude/skills/qa/references/report-schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HelioGrid QA report",
  "type": "object",
  "required": ["run_id", "summary", "passes", "failures", "inconclusive"],
  "additionalProperties": false,
  "properties": {
    "run_id": { "type": "string" },
    "summary": {
      "type": "object",
      "required": ["total", "pass", "fail", "inconclusive"],
      "additionalProperties": false,
      "properties": {
        "total": { "type": "integer" },
        "pass": { "type": "integer" },
        "fail": { "type": "integer" },
        "inconclusive": { "type": "integer" }
      }
    },
    "passes": { "type": "array", "items": { "type": "string" } },
    "failures": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "surface", "quadrant", "steps_run", "expected", "actual", "artifacts"],
        "additionalProperties": false,
        "properties": {
          "id": { "type": "string" },
          "surface": { "enum": ["web", "api", "db", "ios", "android"] },
          "quadrant": { "enum": ["happy", "edge", "negative", "adversarial"] },
          "steps_run": { "type": "array", "items": { "type": "string" } },
          "expected": { "type": "string" },
          "actual": { "type": "string" },
          "artifacts": { "type": "array", "items": { "type": "string" }, "minItems": 1 }
        }
      }
    },
    "inconclusive": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "why"],
        "additionalProperties": false,
        "properties": { "id": { "type": "string" }, "why": { "type": "string" } }
      }
    }
  }
}
```

- [ ] **Step 2: Write the runbook template**

Write `.claude/skills/qa/references/runbook-template.md`. `SKILL.md` substitutes `<RUN_DIR>` and appends the rendered steps.

````markdown
# QA execution runbook — you are the executor, not the designer

You execute a fixed plan. You do not decide what is worth testing, and you do not fix
anything. Your entire output is artifacts on disk plus one `report.json`.

## Prohibitions — these override every other instruction

1. **A step may be marked `pass` only if its declared artifact file exists on disk and is
   non-empty.** No artifact means `inconclusive`. Never infer, assume, or reconstruct a
   result you did not observe.
2. **`skipped` and `inconclusive` are always acceptable. A false `pass` never is.** If you
   are unsure, the answer is `inconclusive`.
3. **Never modify application source.** The only writable path is `<RUN_DIR>/`.
4. **Never modify `plan.json`.**
5. **Record observed values verbatim.** Do not paraphrase, round, or tidy an error message.
6. **Execute every step, in order.** You may not decide a step is unnecessary or redundant.

## Environment

- Web: `http://localhost:3000` — drive with the Playwright MCP tools.
- API: `http://localhost:3001` — drive with `curl`.
- Database (read-only, enforced by role):
  `docker exec heliogrid-pg-local psql -U qa_readonly -d heliogrid_dev -tAc "<SQL>"`
- iOS: `idb` for tap/swipe/text, `xcrun simctl` for install/launch/screenshot.
- Android: `adb shell input tap`, `adb exec-out screencap -p > file.png`, `adb install`.

## Artifacts

Write every artifact to `<RUN_DIR>/artifacts/` using the exact filename the step declares
in `artifacts_required`. Screenshots are PNG. Network captures and API responses are raw
JSON — the actual bytes received, not a summary.

## Output

Write `<RUN_DIR>/report.json` conforming exactly to the schema below. `passes` is an array
of step IDs only — no prose. `failures` carries the full detail. Do not add a severity
field; severity is not yours to judge.

<REPORT_SCHEMA>

## Steps

<STEPS>
````

- [ ] **Step 3: Verify the schema parses as valid JSON**

```bash
node -e 'JSON.parse(require("fs").readFileSync(".claude/skills/qa/references/report-schema.json","utf8"));console.log("schema parses OK")'
test -f .claude/skills/qa/references/runbook-template.md && grep -c "RUN_DIR\|REPORT_SCHEMA\|STEPS" .claude/skills/qa/references/runbook-template.md
```

Expected: `schema parses OK`, then a count of at least `4` placeholder mentions.

---

### Task 4: The `/qa` skill itself

**Files:**
- Create: `.claude/skills/qa/SKILL.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `references/test-matrix.md` (Task 2), `references/report-schema.json` and `references/runbook-template.md` (Task 3), and the four preflight assertions from Task 1.
- Produces: the `/qa` skill invoked by `/slice` (Task 5) and by the owner directly.

- [ ] **Step 1: Add the artifacts-only gitignore entry**

Append to `.gitignore`:

```
# QA runs — plan/report/triage are COMMITTED history; only evidence blobs are ignored
.qa/*/artifacts/
```

- [ ] **Step 2: Verify the ignore rule is scoped correctly**

```bash
mkdir -p .qa/probe/artifacts && touch .qa/probe/plan.json .qa/probe/artifacts/x.png
git check-ignore -v .qa/probe/artifacts/x.png; echo "plan.json ignored? $(git check-ignore .qa/probe/plan.json || echo NO)"
rm -rf .qa/probe
```

Expected: `x.png` matches the ignore rule, and `plan.json` prints `NO` — meaning it is tracked. **If `plan.json` is ignored, the rule is too broad** and the QA record would be lost.

- [ ] **Step 3: Write the skill**

Write `.claude/skills/qa/SKILL.md`:

````markdown
---
name: qa
description: Run complete end-to-end QA after development — Claude plans and fixes, Antigravity CLI executes across web, API, database, iOS and Android. Loops until clean. Use before marking any work VERIFIED.
---

# `/qa` — plan in Claude, execute in `agy`, loop until clean

**Green gates never prove behaviour.** A slice that was never run was never verified.

You do two things here: decide what to test, and fix what breaks. `agy` does the
executing. Never drive taps yourself — that is the slow path this skill exists to replace.

This skill **does not return after one pass.** It ends on exactly one of two conditions:
a clean full certify run, or three completed fix rounds with failures remaining, which
escalates to the owner.

## Phase 0 — Preflight. Fail loudly by name.

Run all of these before generating anything. A QA run that silently skips a surface is the
exact failure both replaced files warned about.

```bash
which idb || echo "MISSING idb — brew install idb-companion && pipx install fb-idb"
xcrun simctl list devices booted | grep -q Booted || echo "MISSING booted iOS simulator"
adb devices | grep -qw device || echo "MISSING booted Android emulator"
docker exec heliogrid-pg-local psql -U qa_readonly -d heliogrid_dev -tAc "select 1" >/dev/null 2>&1 || echo "MISSING qa_readonly role"
~/.local/bin/agy mcp list 2>&1 | grep -qi playwright || echo "MISSING playwright MCP for agy"
curl -sf http://localhost:3000 >/dev/null || echo "MISSING web dev server"
curl -sf http://localhost:3001/health/live >/dev/null || echo "MISSING api dev server"
~/.local/bin/agy --version
~/.local/bin/agy -p "reply with only: ok" 2>&1 | tail -1
```

The version must report `1.1.9`-style output, **not** `Antigravity IDE` — two different
programs are named `agy`, and the IDE launcher dispatches prompts into a GUI panel no
script can read while exiting zero. Always invoke by absolute path.

The last line must print `ok`. Anything else means the cached OAuth credentials have
expired; re-authenticate with one interactive `agy` session.

**Prove tools actually execute before trusting any run.** Write a scratch file via the
shell tool and confirm it exists. Without a correct `--add-dir`, `agy` reports
`status: SUCCESS` with `"DONE"` and does nothing whatsoever — no files, no commands, no
error, exit zero.

## Phase 1 — Scope. Compute the blast radius from the diff.

Get the diff with plain `git diff` plus `git diff --cached` — this repo keeps git manual,
so at QA time the work is normally uncommitted on `main` and `git diff main...HEAD`
resolves to nothing. A blast radius computed from an empty diff produces an empty plan,
which reads exactly like a clean run.

From the diff, list what the change can reach: touched screens, endpoints, tables, and —
for a `packages/ui` or `packages/domain` change — every consumer of the changed symbol.
Add the always-on core from `references/test-matrix.md`: tenancy, money, auth.

## Phase 2 — Plan. Four quadrants, no empty cells.

Walk `references/test-matrix.md` and author `.qa/<run-id>/plan.json`. Run ID is
`YYYY-MM-DD-HHMM`.

```json
{
  "plan_id": "2026-07-31-1642",
  "slice": "auth-tenancy T-12",
  "blast_radius": { "screens": [], "endpoints": [], "tables": [] },
  "steps": [{
    "id": "WEB-LOGIN-007",
    "surface": "web",
    "quadrant": "adversarial",
    "instructions": ["navigate to /login", "enter +919876543210", "tap Send OTP twice inside 200ms"],
    "expected": "exactly one POST /auth/otp/send appears in the network log",
    "artifacts_required": ["WEB-LOGIN-007.network.json"],
    "severity_if_failed": "major"
  }]
}
```

**Before handing off, count steps per (surface × quadrant). Any zero cell aborts the run
and names the gap.** A plan may be small; it may not be lopsided.

Severity is decided HERE, never by the executor. Anything touching money reconciliation, tenancy
isolation or provenance tiers is authored `blocker`.

## Phase 3 — Execute. One command, no wrapper.

Render `references/runbook-template.md` into `.qa/<run-id>/runbook.md`, substituting
`<RUN_DIR>`, `<REPORT_SCHEMA>` and `<STEPS>`. Then:

```bash
~/.local/bin/agy \
  --dangerously-skip-permissions \
  --add-dir "$PWD/.qa/<run-id>" --add-dir "$PWD" \
  --output-format json \
  --json-schema .claude/skills/qa/references/report-schema.json \
  -p "$(cat .qa/<run-id>/runbook.md)"
```

**`--add-dir` is mandatory and covers every path the plan touches.** Omit it and the run
reports `status: SUCCESS` with `"DONE"`, consumes tokens, takes ~26 seconds, and does
nothing at all. That is a perfect silent false pass, and it is why Phase 4 exists.

`--json-schema` enforces the report shape at the CLI layer rather than trusting the prompt.

**Never treat `status: SUCCESS` or `num_turns` as evidence.** `num_turns` reported `1` both
when a run did real work and when it did nothing. Only artifacts on disk prove execution.

If the call exits non-zero, emits unparseable JSON, or hangs past the timeout: the whole
run is `inconclusive`. Retry once, then escalate. **A crashed executor is never a pass.**

Log `usage.total_tokens` from the JSON envelope into `triage.md` — the Pro subscription
quota is real but its weekly ceiling is unpublished, so consumption must be observable.

## Phase 4 — Verify the report before believing it.

A fast model's failure mode is reporting a pass it did not earn. Check, do not trust:

1. Every artifact path claimed in the report exists on disk and is non-empty. **A pass
   whose artifact is missing is rewritten to `inconclusive`**, regardless of what Gemini
   said.
2. Read every failure artifact in full.
3. Spot-check passes: every step whose `severity_if_failed` is `blocker`, plus three
   others at random.
4. **A spot-check that contradicts the report escalates the whole run as untrusted** — do
   not quietly correct the single row. If the executor lied once, no row is trustworthy.

Join each failure back to its `severity_if_failed` in `plan.json` by step ID. The report
carries no severity field.

## Phase 5 — Triage into four buckets.

- **bug** — fix it.
- **product-question** — a missing business rule or spec ambiguity. Never invent a
  requirement: record it in `docs/13` or `docs/15`. Does **not** block a clean run.
- **false-positive** — justify with evidence in `.qa/<run-id>/triage.md`. Not waved off.
- **environment** — emulator down, server down. Fix and re-run; does not consume a round.

## Phase 6 — Fix, re-run, certify.

Each round re-runs the failed steps **plus a fresh blast radius for the code the fix
touched**, so a fix that breaks something adjacent is caught in the same round.

When a round returns clean, do one **full** re-run of the original plan with fresh
artifacts. That is the certify pass.

**Hard stop after three fix rounds.** If it is not clean by then, something structural is
wrong — escalate to the owner rather than grinding.

**You may never edit `plan.json` to make a failure disappear.** That is "never weaken a
gate to make a change pass" applied to QA. Stated explicitly because a fix loop under
pressure will eventually rationalize deleting a step.

## Phase 7 — Retention and evidence.

`plan.json`, `runbook.md`, `report.json` and `triage.md` are committed history. Only
`artifacts/` is gitignored.

- **Clean certify pass** — delete `.qa/<run-id>/artifacts/`. The report records what they
  proved.
- **Escalated, or any run left with failures** — **keep the artifacts.** That is exactly
  the run somebody needs to look at.

The roadmap Evidence cell needs specifics, not adjectives. Cite step IDs and observed
values. If a surface could not be run, say so plainly rather than letting the omission
imply it passed.
````

- [ ] **Step 4: Verify the skill is discoverable and well-formed**

```bash
head -4 .claude/skills/qa/SKILL.md
wc -l .claude/skills/qa/SKILL.md
ls .claude/skills/qa/references/
```

Expected: frontmatter with `name: qa`, a line count under 450, and three reference files.

---

### Task 5: Delete the old files and update every caller

**Files:**
- Delete: `.claude/skills/verify-app/` (whole directory), `.claude/agents/qa-breaker.md`
- Modify: `CLAUDE.md:21`, `.claude/skills/slice/SKILL.md:47`, `.claude/skills/lenses/SKILL.md` (lines 3, 6, 11, 24), `docs/foundation-redesign.md` (lines 126, 136, 167, 248, 268, 495), `docs/modules/auth-tenancy.md:45`

**Interfaces:**
- Consumes: the `/qa` skill from Task 4 — it must exist before this task runs, so there is never a window where neither skill exists.
- Produces: a tree where `/qa` is the single source of truth for how this repo tests.

**Deliberately NOT modified:** `docs/superpowers/plans/2026-07-29-ai-engineering-foundation.md` and `docs/superpowers/plans/2026-07-31-mobile-screen-segregation.md`. Dated plan documents are records of what happened, not instructions to follow. Rewriting history to match the present is how a repo loses the ability to explain itself.

- [ ] **Step 1: Delete both old files**

```bash
rm -rf .claude/skills/verify-app .claude/agents/qa-breaker.md
ls .claude/skills/ .claude/agents/
```

Expected: `verify-app` absent from skills, `qa-breaker.md` absent from agents, `qa` present.

- [ ] **Step 2: Update root CLAUDE.md line 21**

Replace `simulators for RN (`/verify-app`), curl for api. A task is done when you have looked at it.`
with:

```
  simulators for RN, curl for api — all of it through `/qa`. A task is done when you have
  looked at it.
```

- [ ] **Step 3: Update the slice skill's Verify row**

In `.claude/skills/slice/SKILL.md`, replace the Verify row:

```
| Verify | `/qa` | plan → Gemini executes all five surfaces → fix → loop until clean; green gates never prove behaviour |
```

- [ ] **Step 4: Update the lenses skill — five becomes four**

In `.claude/skills/lenses/SKILL.md` make four edits:

Frontmatter `description:` becomes:

```
description: Review a slice through four independent lenses — senior engineer, UX, solar-EPC domain, and product owner. Use before marking any slice complete.
```

Heading `# The Five Lenses` becomes `# The Four Lenses`.

The line `Five genuinely different failure detectors, not five phrasings of one.` becomes:

```
Four genuinely different failure detectors, not four phrasings of one.
```

Change `## Dispatch the three specialists in parallel` to `## Dispatch the two specialists in parallel`, and delete the `| `qa-breaker` | how to break it |` table row. Then add this line immediately after the table:

```
Breaking the running app is `/qa`'s job, not a lens's — a read-only agent that has never
opened the app cannot tell you how it breaks.
```

- [ ] **Step 5: Update docs/foundation-redesign.md**

Six edits. Line 126 (`verify-app/SKILL.md ● run-and-look...`) becomes:

```
    qa/SKILL.md                  ● plan in Claude, execute in Gemini, loop until clean
```

Line 136 (`qa-breaker.md ● adversarial QA subagent`) — delete the line entirely.

Line 167 — replace `both simulators for UI (/verify-app), curl/logs for api/worker.` with `both simulators for UI, curl/logs for api/worker — all through /qa.`

Line 248 — replace the whole `/verify-app` table row with:

```
| `/qa` | via /slice | Claude computes a diff-derived blast radius and authors a four-quadrant plan; Gemini 3.6 Flash executes it across web, API, database, iOS and Android; Claude verifies artifacts, triages, fixes, and loops until a clean certify pass or a hard stop at three rounds. |
```

Line 268 (`- **qa-breaker** — actively attacks: ...`) and its continuation lines — replace with:

```
- **`/qa`** — executes the attack surface against the running app rather than reasoning
  about it: four quadrants (happy, edge, negative, adversarial) across five surfaces.
```

Line 495 — replace `7. **/verify-app**: run-and-look with evidence captured.` with `7. **/qa**: plan, execute, fix, loop until clean, with evidence captured.`

- [ ] **Step 6: Update docs/modules/auth-tenancy.md line 45**

Replace `cannot currently be reached for `/verify-app`.` with `cannot currently be reached for `/qa`.`

- [ ] **Step 7: Prove no live references remain**

```bash
grep -rn "verify-app\|qa-breaker" --include="*.md" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v "docs/superpowers/plans/"
```

Expected: **no output.** Any hit outside `docs/superpowers/plans/` is a live reference that was missed. The two dated plan documents are the only permitted mentions.

- [ ] **Step 8: Confirm the gates still pass**

```bash
pnpm lint 2>&1 | tail -3
```

Expected: `all 6 lint gates green`. Documentation edits should not affect it, but a broken markdown table in `foundation-redesign.md` would show up in the adherence gate.

---

### Task 6: Prove the whole loop works end to end

**Files:**
- Creates: `.qa/<run-id>/` (a real run — plan, runbook, report, artifacts)
- No source files change.

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: a real committed QA record demonstrating the skill functions, and a decision about whether the plan needs chunking.

This task validates the design's riskiest assumption — that Gemini Flash executes a multi-step plan reliably. Do not skip it because the pieces look right individually.

- [ ] **Step 1: Start both dev servers**

Use the preview tooling declared in `.claude/launch.json` — never a bare shell command:
start the `web` configuration (port 3000) and the `api` configuration (port 3001).

- [ ] **Step 2: Run preflight and fix everything it names**

Run the Phase 0 block from `.claude/skills/qa/SKILL.md`. Every line must be silent except
the final `ok`. Resolve each `MISSING` before continuing — that is the point of preflight.

- [ ] **Step 3: Invoke the skill against a small real change**

Invoke `/qa`. Use the current uncommitted working tree as the diff. If the tree is clean,
scope it to the auth login surface explicitly so there is real behaviour to exercise.

- [ ] **Step 4: Verify the run produced a complete, honest record**

```bash
RUN=$(ls -1d .qa/*/ | tail -1); echo "run: $RUN"
node -e '
const fs=require("fs"),d=process.argv[1];
const p=JSON.parse(fs.readFileSync(d+"plan.json","utf8"));
const r=JSON.parse(fs.readFileSync(d+"report.json","utf8"));
const cells={};
for(const s of p.steps) cells[s.surface+"/"+s.quadrant]=(cells[s.surface+"/"+s.quadrant]||0)+1;
console.log("steps:",p.steps.length,"| surface×quadrant cells:",Object.keys(cells).length);
console.log(cells);
const n=r.summary.pass+r.summary.fail+r.summary.inconclusive;
console.log("summary adds up:", n===r.summary.total, "("+n+" vs "+r.summary.total+")");
const missing=r.failures.flatMap(f=>f.artifacts).filter(a=>!fs.existsSync(d+a));
console.log("failure artifacts missing from disk:", missing.length?missing:"none");
' "$RUN"
```

Expected: every surface in the blast radius has all four quadrants present, the summary
counts add up to `total`, and no claimed failure artifact is missing from disk.

- [ ] **Step 5: Verify the retention rule fired correctly**

```bash
RUN=$(ls -1d .qa/*/ | tail -1)
ls "$RUN"; echo "--- artifacts dir:"; ls "$RUN/artifacts" 2>/dev/null | wc -l
git status --short .qa/ | head
```

Expected: `plan.json`, `runbook.md`, `report.json` present and shown as untracked/modified
by git (they are committed history). If the run certified clean, `artifacts/` is empty or
gone; if it escalated or left failures, artifacts are still present. `git status` must
never list anything under `artifacts/`.

- [ ] **Step 6: Report the outcome to the owner**

State plainly: how many steps ran, the surface × quadrant coverage, what failed, what was
fixed, how many rounds it took, and anything that could not be run. If Gemini degraded on a
long plan, say so — the documented fix is chunking the plan by surface, **never** loosening
the artifact rule.

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: shape and loop → Task 4 Phases 0–7; old-file deletion and the surviving assets → Tasks 2 and 5; capability matrix → Task 1; blast radius → Phase 1; four quadrants → Task 2 plus the Phase 2 count gate; plan format → Phase 2; pixel checking → test-matrix "Pixel precision"; runbook and prohibitions → Task 3; read-only DB → Task 1 Steps 5–6; report contract and artifact verification → Task 3 schema plus Phase 4; retention → Phase 7 and Task 4 Step 2; triage → Phase 5; termination → Phase 6; prerequisites → Task 1; risks → Task 6 Step 6.

**One spec deviation, deliberate:** the spec listed `docs/superpowers/plans/2026-07-31-mobile-screen-segregation.md` among files to update, then separately said dated plan documents are historical records that are not rewritten. Task 5 follows the second rule and leaves both dated plans untouched, with Step 7's grep scoped accordingly.

**Type consistency.** `plan.json` uses `quadrant` (not `category`) throughout Tasks 3, 4 and 6, matching the `report-schema.json` enum `["happy","edge","negative","adversarial"]`. Surfaces are `["web","api","db","ios","android"]` in both the schema and the Task 6 verifier. `severity_if_failed` appears only in `plan.json`, never in the report — Phase 4 joins them by step ID.
