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
node -e 'const c=require(process.env.HOME+"/.gemini/config/mcp_config.json");process.exit(Object.keys(c.mcpServers||c).includes("playwright")?0:1)' 2>/dev/null || echo "MISSING playwright MCP for agy"
curl -sf http://localhost:3000 >/dev/null || echo "MISSING web dev server"
curl -sf http://localhost:8080/health >/dev/null || echo "MISSING api dev server"
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
  --print-timeout 15m \
  -p "$(cat .qa/<run-id>/runbook.md)"
```

**`--add-dir` is mandatory and covers every path the plan touches.** Omit it and the run
reports `status: SUCCESS` with `"DONE"`, consumes tokens, takes ~26 seconds, and does
nothing at all. That is a perfect silent false pass, and it is why Phase 4 exists.

`--json-schema` enforces the report shape at the CLI layer rather than trusting the prompt.

**Never treat `status: SUCCESS` or `num_turns` as evidence.** `num_turns` reported `1` both
when a run did real work and when it did nothing. Only artifacts on disk prove execution.

If the call exits non-zero, emits unparseable JSON, or hangs past the timeout: the whole
run is `inconclusive`. Retry once with `--continue` on the same conversation — a plain
retry throws away artifacts the first call already produced, and `--continue` keeps them
instead of redoing the work. Then escalate if it still fails. **A crashed executor is
never a pass.**

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
