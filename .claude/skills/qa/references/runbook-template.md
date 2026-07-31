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
