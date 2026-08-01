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
curl -sf -m 5 http://localhost:3002/login >/dev/null || echo "MISSING web dev server (3002)"
curl -sf -m 5 http://localhost:8084/health >/dev/null || echo "MISSING api dev server (8084)"
~/.local/bin/agy --version
~/.local/bin/agy -p "reply with only: ok" 2>&1 | tail -1

# PRE-WARM both apps and prove their view tree is readable. A debug build fetches its JS
# bundle from Metro on every cold start, so a step that launches and screenshots captures
# a blank "Loading from …:8081" frame — which an executor WILL report as a rendered
# screen. Warming here means no step ever meets a loading screen.
xcrun simctl launch booted com.heliogrid.app >/dev/null 2>&1
adb shell monkey -p com.heliogrid.app -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep 15
idb ui describe-all 2>/dev/null | grep -q . || echo "MISSING iOS view tree (app not warm)"
adb shell uiautomator dump /sdcard/w.xml >/dev/null 2>&1 && adb shell cat /sdcard/w.xml | grep -q 'text="' || echo "MISSING Android view tree (app not warm)"
```

The version must report a bare CLI version, **not** `Antigravity IDE` — two different
programs are named `agy`, and the IDE launcher dispatches prompts into a GUI panel no
script can read while exiting zero. Always invoke by absolute path.

The last line must print `ok`. Anything else means the cached OAuth credentials have
expired; re-authenticate with one interactive `agy` session.

**Then prove tools actually execute**: have `agy` write a scratch file under `--add-dir`
and confirm it lands on disk. A run that cannot write still reports success — see Phase 3.

## Phase 1 — Scope. Compute the blast radius from the diff.

Get the diff with plain `git diff` plus `git diff --cached` — this repo keeps git manual,
so at QA time the work is normally uncommitted on `main` and `git diff main...HEAD`
resolves to nothing. A blast radius computed from an empty diff produces an empty plan,
which reads exactly like a clean run.

From the diff, list what the change can reach: touched screens, endpoints, tables, and —
for a `packages/ui` or `packages/domain` change — every consumer of the changed symbol.
Add the always-on core from `references/test-matrix.md`: tenancy, money, auth.

**Derive the surface list mechanically, then read it — do not hand-author from memory.**
A hand-picked list is how a plan silently omits a surface the change reached:

```bash
git diff --name-only; git diff --cached --name-only   # both — git is manual here
```

Map each changed path to the surfaces it can reach:

| Changed path | Surfaces in the blast radius |
|---|---|
| `apps/web/**` | web |
| `apps/mobile/**` | ios, android |
| `apps/api/**`, `packages/contracts/**` | api, and every client of the changed route |
| `packages/db/**`, `migrations/**` | api, db |
| `packages/data/**` | web, ios, android — it is the ONE data path, so all of them |
| `packages/ui/**`, `packages/tokens/**` | web (+ RN if the RN mirror moved) |
| `packages/domain/**`, `packages/i18n/**` | web, ios, android |

For a shared-code path, grep the actual consumers rather than assuming — the symbol may be
imported somewhere the table above does not predict.

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

**Before handing off, count steps per (surface × quadrant) across every surface in the
Phase 1 blast radius — not merely the surfaces the plan happens to contain. Any zero cell
aborts the run and names the gap.** A surface you cannot exercise is never simply omitted:
record it explicitly as blocked, with the reason, in both `plan.json` and `report.json`.
A plan may be small; it may not be lopsided.

Severity is decided HERE, never by the executor. Anything touching money reconciliation, tenancy
isolation or provenance tiers is authored `blocker`.

## Phase 3 — Execute. One executor PER SURFACE, all at once.

The four surfaces share no state: web drives a browser, iOS drives one simulator, Android
drives another, and api/db is `curl` plus a read-only `psql`. Running them in one serial
conversation makes wall clock the SUM of four independent things — measured at ~8 and ~10
minutes across two runs, with two physical devices idle most of that time.

Render one runbook per surface — `runbook.web.md`, `runbook.ios.md`, `runbook.android.md`,
`runbook.api.md` — each containing only that surface's steps, then launch all four
concurrently and wait:

```bash
for S in web ios android api; do
  ~/.local/bin/agy \
    --dangerously-skip-permissions \
    --add-dir "$PWD/.qa/<run-id>" --add-dir "$PWD" \
    --output-format json \
    --json-schema .claude/skills/qa/references/report-schema.json \
    --print-timeout 15m \
    -p "$(cat .qa/<run-id>/runbook.$S.md)" \
    > ".qa/<run-id>/report.$S.json" 2>&1 &
done
wait
```

Then merge the four fragments into `report.json`. A fragment that is missing, empty or
unparseable makes THAT surface `inconclusive` — never the whole run, and never a pass.

**Order each surface's steps so state flows** — login → OTP → home → locale → back — and
relaunch the app only where a cold start IS the test. Relaunching per step costs a full
Metro bundle fetch each time and was most of the mobile wall clock.

**One surface must not wait on another.** If a step needs a value another surface produced,
it does not belong in either runbook: it belongs in the parity check (Phase 4½).

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
   whose artifact is missing is rewritten to `inconclusive`**, regardless of what the
   executor reported.
2. Read every failure artifact in full.
3. Spot-check passes: every step whose `severity_if_failed` is `blocker`, plus three
   others at random.
4. **A spot-check that contradicts the report escalates the whole run as untrusted** — do
   not quietly correct the single row. If the executor lied once, no row is trustworthy.

Join each failure back to its `severity_if_failed` in `plan.json` by step ID. The report
carries no severity field.

## Phase 4½ — Compare the surfaces against each other.

The per-surface runbooks each recorded an observed VALUE. Now assert they AGREE — this is
the check the split makes cheap and the one a per-surface plan structurally cannot make.

Web, iOS and Android run the same shared code (`@heliogrid/data`, `@heliogrid/domain`,
`@heliogrid/ui-api`), so a divergence here means a platform re-implemented something that
was supposed to be imported — the exact defect Law 7 exists to prevent, and one that every
individual surface reports as a pass.

A mismatch is a **blocker**, not a curiosity. Record both values verbatim; do not
average, round, or pick the one that looks right.

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
