# QA execution runbook — you are the executor, not the designer

You execute a fixed plan. You do not decide what is worth testing, and you do not fix
anything. Your entire output is artifacts on disk plus one `report.json`.

## Prohibitions — these override every other instruction

1. **A step may be marked `pass` only if its declared artifact file exists on disk and is
   non-empty.** No artifact means `inconclusive`. Never infer, assume, or reconstruct a
   result you did not observe.
2. **`skipped` and `inconclusive` are always acceptable. A false `pass` never is.** If you
   are unsure, the answer is `inconclusive`.
3. **Never modify application source.** The only writable path is `<RUN_DIR>/`, which for
   this run is `/Volumes/works-space/heliogrid/.qa/2026-07-31-1324/`.
4. **Never modify `plan.json`.**
5. **Record observed values verbatim.** Do not paraphrase, round, or tidy an error message.
6. **Execute every step, in order.** You may not decide a step is unnecessary or redundant.

## Environment (CORRECTED for this run — do not use the SKILL.md defaults)

- Web: NOT part of this run. Owner-accepted BLOCKED — another process holds :3000 and
  returns HTTP 500 on every route. Do not attempt to reach it, start it, or report on it.
- **API: `http://localhost:8080`** — drive with `curl`. (Not :3001 — :3001 is a stray
  next-server/web process on this machine, confirmed by `lsof`. The real
  `@heliogrid/api` process listens on :8080 per `ENV.PORT`.)
- Database (read-only, enforced by role):
  `docker exec heliogrid-pg-local psql -U qa_readonly -d heliogrid_dev -tAc "<SQL>"`
  Use `-i` (`docker exec -i ...`) if a step's SQL is piped via stdin/heredoc; plain
  `-tAc "<SQL>"` argument form does not need `-i`.
- iOS: booted simulator, app bundle id `com.heliogrid.app`. Use `idb` for tap/text input,
  `xcrun simctl` for launch/terminate/screenshot.
- Android: `emulator-5554`, app package `com.heliogrid.app`. Use
  `adb shell input tap` / `adb shell input text`, `adb exec-out screencap -p > file.png`.

## Artifacts

Write every artifact to `/Volumes/works-space/heliogrid/.qa/2026-07-31-1324/artifacts/`
using the exact filename the step declares in `artifacts_required`. Screenshots are PNG.
Command/network captures are the raw text/bytes received, not a summary.

## Output

Write `/Volumes/works-space/heliogrid/.qa/2026-07-31-1324/report.json` conforming exactly
to the schema below. `passes` is an array of step IDs only — no prose. `failures` carries
the full detail. Do not add a severity field; severity is not yours to judge.

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

`run_id` must be `"2026-07-31-1324"`.

## Steps

Full step detail (instructions, expected result, required artifact filenames) is in
`/Volumes/works-space/heliogrid/.qa/2026-07-31-1324/plan.json` — read it now and execute
every one of its 16 steps in order: API-HAPPY-001, API-EDGE-001, API-NEG-001, API-ADV-001,
DB-HAPPY-001, DB-EDGE-001, DB-NEG-001, DB-ADV-001, IOS-HAPPY-001, IOS-EDGE-001,
IOS-NEG-001, IOS-ADV-001, AND-HAPPY-001, AND-EDGE-001, AND-NEG-001, AND-ADV-001.

Do not re-derive or reinterpret the steps — `plan.json` is the source of truth for
instructions, expected results, and exact artifact filenames.
