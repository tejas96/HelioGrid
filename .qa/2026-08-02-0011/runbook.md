# QA execution runbook — you are the executor, not the designer

You execute a fixed plan. You do not decide what is worth testing, and you do not fix
anything. Your entire output is artifacts on disk plus one `report.json`.

## Prohibitions — these override every other instruction

1. **A step may be marked `pass` only if its declared artifact file exists on disk and is
   non-empty.** No artifact means `inconclusive`. Never infer, assume, or reconstruct a
   result you did not observe.
2. **`skipped` and `inconclusive` are always acceptable. A false `pass` never is.** If you
   are unsure, the answer is `inconclusive`.
3. **Never modify application source.** The only writable path is `$PWD/.qa/2026-08-02-0011/`.
4. **Never modify `plan.json`.**
5. **Record observed values verbatim.** Do not paraphrase, round, or tidy an error message.
6. **Execute every step, in order.** You may not decide a step is unnecessary or redundant.

## Environment

- Web: `http://localhost:3002` — drive with the Playwright MCP tools.
- API: `http://localhost:8084` — drive with `curl`.
- Database (read-only, enforced by role):
  `docker exec heliogrid-pg-local psql -U qa_readonly -d heliogrid_dev -tAc "<SQL>"`
- iOS: `idb` for tap/swipe/text, `xcrun simctl` for install/launch/screenshot.
- Android: `adb shell input tap`, `adb exec-out screencap -p > file.png`, `adb install`.

## Artifacts

Write every artifact to `$PWD/.qa/2026-08-02-0011/artifacts/` using the exact filename the step declares
in `artifacts_required`. Screenshots are PNG. Network captures and API responses are raw
JSON — the actual bytes received, not a summary.

## Output

Write `$PWD/.qa/2026-08-02-0011/report.json` conforming exactly to the schema below. `passes` is an array
of step IDs only — no prose. `failures` carries the full detail. Do not add a severity
field; severity is not yours to judge.

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

## Steps

### WEB-LOGIN-001  (web · happy)

Instructions:
  1. navigate to http://localhost:3002/login
  2. type 9876543210 into the phone field
  3. click Continue
  4. wait for the OTP step heading 'Enter your code'
  5. type 1 2 3 4 5 6 into the six OTP boxes, one digit per box
  6. wait up to 5s for navigation

Expected: OTP step renders exactly 6 input boxes; after the 6th digit the flow auto-verifies and the URL becomes /home showing 'Namaste, Walkthrough' and 'WALKTHROUGH WORKSPACE'

Artifacts required: WEB-LOGIN-001.otp.png, WEB-LOGIN-001.home.png

### WEB-LOGIN-002  (web · happy)

Instructions:
  1. navigate to http://localhost:3002/onboarding
  2. screenshot the segment control
  3. read the text of every segment option

Expected: exactly three options render: Homes, Commercial & industrial, Both (driven by TENANT_SEGMENTS in @heliogrid/domain)

Artifacts required: WEB-LOGIN-002.segments.png

### WEB-EDGE-003  (web · edge)

Instructions:
  1. navigate to http://localhost:3002/login
  2. type 9876543210999 (13 digits) into the phone field
  3. read back the field value with document.querySelector('input[type=tel]').value

Expected: the field holds exactly 10 digits '9876543210' — PHONE_NSN_LENGTH caps it; the extra 3 are discarded

Artifacts required: WEB-EDGE-003.value.json

### WEB-EDGE-004  (web · edge)

Instructions:
  1. resize the viewport to 375x812 and navigate to http://localhost:3002/login, screenshot
  2. resize to 1440x900, reload, screenshot
  3. at 375px confirm no element overflows the viewport horizontally via document.documentElement.scrollWidth

Expected: login renders without horizontal overflow at 375px and at 1440px; scrollWidth <= 375 at the small size

Artifacts required: WEB-EDGE-004.375.png, WEB-EDGE-004.1440.png

### WEB-NEG-005  (web · negative)

Instructions:
  1. navigate to http://localhost:3002/login
  2. enter 9876543210 and click Continue to reach the OTP step
  3. enter only 3 digits (1 2 3) and wait 3 seconds
  4. screenshot

Expected: no navigation occurs and no success state renders — an incomplete code must not verify

Artifacts required: WEB-NEG-005.incomplete.png

### WEB-NEG-006  (web · negative)

Instructions:
  1. navigate to http://localhost:3002/home directly, without completing login
  2. screenshot and capture the visible body text

Expected: the page renders its 'Could not load your workspace.' state rather than crashing or showing another user's data — the session store reports anonymous

Artifacts required: WEB-NEG-006.anon.png

### WEB-ADV-007  (web · adversarial)

Instructions:
  1. navigate to http://localhost:3002/login
  2. enter 9876543210
  3. start capturing network requests
  4. click Continue twice within 200ms
  5. save the captured network log

Expected: the double tap does not produce two flow advances or a crash; the in-flight guard holds. Record every request observed verbatim (the walkthrough stub reaches no server, so zero network calls is the expected observation)

Artifacts required: WEB-ADV-007.network.json

### WEB-ADV-008  (web · adversarial)

Instructions:
  1. navigate to http://localhost:3002/login
  2. enter the absurd input string: +++0000000000 followed by the emoji 🙂 and the text ' OR 1=1--'
  3. read back the field value
  4. screenshot

Expected: non-digits are stripped; the field holds only digits and at most 10 of them; no crash, no raw error surfaced

Artifacts required: WEB-ADV-008.absurd.json, WEB-ADV-008.absurd.png

### API-HAPPY-009  (api · happy)

Instructions:
  1. curl -s -i http://localhost:8084/health
  2. curl -s -i http://localhost:8084/health/ready
  3. save both raw responses

Expected: /health returns 200 with body {"status":"ok","service":"heliogrid-api","version":...}; /health/ready returns 200 with checks.database = ok

Artifacts required: API-HAPPY-009.health.json, API-HAPPY-009.ready.json

### API-EDGE-010  (api · edge)

Instructions:
  1. curl -s -o /dev/null -w '%{http_code}' http://localhost:8084/
  2. curl -s -o /dev/null -w '%{http_code}' http://localhost:8084/health/
  3. save both status codes

Expected: an unmapped root path returns 404; record the exact code observed for /health/ verbatim rather than assuming

Artifacts required: API-EDGE-010.codes.json

### API-NEG-011  (api · negative)

Instructions:
  1. curl -s -i http://localhost:8084/api/auth/session
  2. curl -s -i -X POST http://localhost:8084/api/auth/phone-number/send-otp -H 'content-type: application/json' -d '{"phoneNumber":"+919876543210"}'
  3. curl -s -i -X POST http://localhost:8084/api/auth/phone-number/verify -H 'content-type: application/json' -d '{"phoneNumber":"+919876543210","code":"123456"}'
  4. save all three raw responses

Expected: all three return 404 — the Better Auth handler is gone (ADR-0024). Any 200/401/500 means auth is still mounted somewhere

Artifacts required: API-NEG-011.auth-routes.json

### API-ADV-012  (api · adversarial)

Instructions:
  1. curl -s -i -X POST http://localhost:8084/health -H 'content-type: application/json' -d '{"a":1}'
  2. curl -s -i 'http://localhost:8084/health?x=%27%20OR%201%3D1--'
  3. curl -s -i http://localhost:8084/../../etc/passwd
  4. save all raw responses

Expected: no 5xx and no stack trace or file contents in any body; a wrong method returns 404 or 405, the SQL-shaped query string is ignored

Artifacts required: API-ADV-012.probes.json

### IOS-HAPPY-013  (ios · happy)

Instructions:
  1. relaunch com.heliogrid.app on the booted simulator with xcrun simctl
  2. screenshot the login screen
  3. tap the phone field, type 9876543210, tap Continue
  4. screenshot the OTP step and count the input boxes
  5. type 123456
  6. wait 4s and screenshot

Expected: login renders with the +91 prefix; the OTP step shows exactly 6 boxes; after the 6th digit the navigator swaps to the Home stack showing 'Foundations ready'

Artifacts required: IOS-HAPPY-013.login.png, IOS-HAPPY-013.otp.png, IOS-HAPPY-013.home.png

### IOS-EDGE-014  (ios · edge)

Instructions:
  1. on the Home screen tap the 'हि' segment of the locale control
  2. screenshot
  3. tap 'मर' and screenshot

Expected: Devanagari renders without clipping or tofu in both HI and MR — AppText run-splitting works; text expansion does not break the card layout

Artifacts required: IOS-EDGE-014.hi.png, IOS-EDGE-014.mr.png

### IOS-NEG-015  (ios · negative)

Instructions:
  1. relaunch the app to reach the login screen
  2. tap the phone field and type only 98765 (5 digits)
  3. screenshot the Continue button state

Expected: Continue is disabled below PHONE_NSN_LENGTH digits — the flow cannot advance on a short number

Artifacts required: IOS-NEG-015.short.png

### IOS-ADV-016  (ios · adversarial)

Instructions:
  1. relaunch the app, enter 9876543210 and reach the OTP step
  2. tap 'Change number'
  3. screenshot
  4. note whether the previously entered number is still in the field

Expected: returns to the phone step with the entered number preserved, no crash; the resend countdown does not continue running on the phone step

Artifacts required: IOS-ADV-016.change-number.png

### AND-HAPPY-017  (android · happy)

Instructions:
  1. relaunch com.heliogrid.app on the emulator with adb
  2. screenshot the login screen with adb exec-out screencap

Expected: login renders identically to iOS: HelioGrid wordmark, 'Welcome back', +91 prefix, disabled Continue, invite link footer

Artifacts required: AND-HAPPY-017.login.png

### AND-EDGE-018  (android · edge)

Instructions:
  1. tap the phone field with adb shell input tap
  2. adb shell input text 9876543210999
  3. screenshot

Expected: the field holds exactly 10 digits — the same PHONE_NSN_LENGTH cap as web and iOS; Continue becomes enabled

Artifacts required: AND-EDGE-018.capped.png

### AND-NEG-019  (android · negative)

Instructions:
  1. force-stop and relaunch com.heliogrid.app
  2. screenshot immediately after launch

Expected: the app boots to the Login stack, not Home — the walkthrough session starts anonymous and nothing is persisted across a relaunch

Artifacts required: AND-NEG-019.relaunch.png

### AND-ADV-020  (android · adversarial)

Instructions:
  1. reach the login screen
  2. tap Continue rapidly 5 times within one second with adb shell input tap
  3. screenshot
  4. adb logcat -d | tail -50 and save it

Expected: no crash and no red box; the log contains no unhandled exception from the app package

Artifacts required: AND-ADV-020.rapid.png, AND-ADV-020.logcat.txt

### CORE-TENANCY-021  (api · negative)

Instructions:
  1. docker exec heliogrid-pg-local psql -U qa_readonly -d heliogrid_dev -tAc "select count(*) from pg_tables where schemaname='public'"
  2. save the output

Expected: BLOCKED, and this step exists to prove the block rather than let it be silently omitted. Cross-tenant isolation CANNOT be exercised: packages/db is greenfield (ADR-0024) so there are zero application tables and no tenants to isolate. The expected observation is a count of 0. Record it and mark the step blocked, not passed.

Artifacts required: CORE-TENANCY-021.tablecount.txt

### CORE-MONEY-022  (api · happy)

Instructions:
  1. no action — record this step as blocked with the stated reason

Expected: BLOCKED. Money reconciliation (BOM ↔ proposal ↔ tranches) has no surface in this slice: no money endpoints, screens or tables exist yet. Recorded explicitly so its absence is not read as a pass.

Artifacts required: (none)

### CORE-AUTH-023  (api · negative)

Instructions:
  1. no action beyond API-NEG-011 — record this step as blocked with the stated reason

Expected: BLOCKED. 'An unauthenticated request to a protected route is rejected' cannot be tested: there are no protected routes. The global deny-by-default SessionGuard was removed with auth (ADR-0024), so every route is currently public BY DESIGN. API-NEG-011 proves the auth routes are gone; it does not and cannot prove authorisation.

Artifacts required: (none)

