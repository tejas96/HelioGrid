# The QA reference — the edge checklist, what each agent can see, how a step decides

`/start` walks the edge checklist when it writes the ticket's `**QA plan:**`, and `case-reviewer`
attacks the plan with it. It is an attack list, never a form: an edge that applies becomes a case or
a step, and nothing is written for one that does not.

> **Test data derives from the tenant's market pack.** v1 tenants are IN, so examples here use +91
> phones, Devanagari strings and paisa-level reconciliation; a future market's runs derive the
> equivalents (phone spec, scripts, minor unit) from its pack.

## The edge checklist

Assume the implementation is wrong until a step proves otherwise.

- **The job itself** — the whole designed flow with valid input; every success state renders (the
  confirmation, the populated list, the receipt); the primary number is right and carries its
  provenance tier; EN, then HI without clipping (allow 20–30% expansion).
- **Volume and bounds** — zero rows, one row, realistic volume (200 leads, a 40-line BOM, 50 members);
  first page, last page, the exact page boundary; a value at its limit, one below, one above;
  max-length strings, Devanagari above all (`AppText` run-splitting on mobile); a timer at exactly 0
  and just after; web at 375 and 1536, the smallest and largest supported phone.
- **Designed failures** — wrong OTP, expired session, revoked token, malformed payload, missing field;
  every role against every action, deny-by-default; the error envelope and status the contract
  declares (a non-base error code is where the wire and the typecheck have disagreed before); the
  error shown in the user's language, never a raw code.
- **Tenancy** — any identifier from tenant B used in a tenant A session reads **404, never 403**; a
  session with no company is refused a tenant-scoped route.
- **Double submit** — a rapid double tap, a submit while a request is in flight, back then resubmit;
  is the in-flight guard per action or global, and is that right?
- **Connection loss** — dropped between send and verify; a request that succeeded on the server whose
  response never arrived.
- **Stale data** — two tabs, two devices, data changed underneath, a cached response after a
  mutation; design changed and quote not recomputed must read provisional, never silently final.
- **Absurd input** — 0, negatives, 10⁶ kW, emoji names, 40-character Hindi labels, RTL characters,
  SQL-shaped strings, 500 characters of free text, leading or trailing spaces, a phone with the wrong
  country code. A value read back from storage arrives as `null` or `''`, never only `undefined`.
- **Compound checks** — each half of an `a && b` guard has a row where that half alone decides.
- **Lifecycle** — the app backgrounded (RN timers suspend: wall-clock or interval?), rotation, the
  locale switched mid-flow, the session expiring mid-flow, the app killed mid-action.
- **External side effects** — an SMS, a push, a payment, a webhook: sandboxed in QA, and safe when the
  step that sends it runs twice.
- **Money** — BOM ↔ proposal ↔ tranches agree to the currency's minor unit; lakh/crore grouping in
  every locale.

**The always-on API core** — a cross-tenant read is 404 · an unauthenticated call to a protected
route is 401 · money reconciles — is in the plan when `apps/api`, `packages/db`, `packages/contracts`
or `packages/data` is in the Scope, proven ON THE WIRE over seeded rows, never by a unit test at the
repository.

## Signing in during a run

The ONE statement of the development sign-in path; the surface agents point here and add only what
their surface needs.

**An existing account** — the development number in `.env.local` (`DEV_OTP_PHONE`) signs in with
`DEV_OTP_CODE`, sends nothing and counts against no cap. Use it for every step that needs an owner or
a returning account.

**A new account** — no SMS is sent locally. Request a code for ANY fresh `+91` ten-digit number —
`POST /auth/otp/request` with `{"phoneE164": "+919845027746", "channel": "sms"}` — and read the code
from the API's log: the line `Message for +91… via sms: … code is 123456` — `grep 'via sms'` in
`$(git rev-parse --git-common-dir)/heliogrid-harness/api.log`, which the `api` and `api-built` servers
write afresh at each start, or `preview_logs` with the server id the dispatch names. Verify with
`POST /auth/otp/verify` `{"challengeId", "code", "platform": "web"}`. The API sets two HttpOnly
cookies, `hg_session` (path `/auth`, the refresh grant) and `hg_token` (the ten-minute API token);
with curl keep a jar (`-c jar -b jar`). A first-time number has no company: `POST /tenants` with
`{"companyName", "ownerName", "city"}` creates one and rotates the token. Three requests per fifteen
minutes and eight per day per number are the real caps — use a fresh number rather than waiting one
out. The API must be running for either path.

## What each agent can see and do, and recording a run

A step's `observe` names the kind of fact that decides it, and its action is something an agent can
DO: only the agent whose row lists both may run the step. An action no row can drive — the network
dropped, the app killed mid-action, two devices at once, until a command for it is named here — is a
case proven another way or `none`, never a QA step.

| agent | observe kinds it can read (SEE) | actions it can take (DRIVE) | it cannot |
|---|---|---|---|
| `qa-web` | `a11y-text` (`read_page`, `find`) · `computed-style` and `dom-value` (`javascript_tool`) · `console` · `network`: a request's method, URL, status, the body it sent and the response body (`read_network_requests`) · `log` (the api log file) · `screenshot`, for what only vision shows | open a route, click, type, fill a form, key presses, resize to 375 or 1536, a `fetch` from the page (the sign-out) | see a request's HEADERS or a database row · drop the network · open a second browser |
| `qa-api` (the api and the worker) | `response`: status line, headers and body (`curl -i`), and the request it sent · `db-scalar`: one read-only value as `qa_readonly`, tenant pinned · `log`: the api log file and the worker's (`preview_logs`) | any request with any body, header or cookie (`curl`) · the seed command a step names (`/verify` §2) | see a rendered page · write a row by hand · start a workflow the api does not start |
| `qa-mobile` | `ios-tree`: `idb ui describe-all --udid <udid>`, piped to `grep` for the step's words · `android-tree`: `uiautomator` text · `screenshot`: one shrunk frame per step · `logcat` · `log` (the api log file) | tap, swipe, type, the hardware buttons, a deep link (the simulator tool; `adb shell input` on Android) · a cold relaunch · the iOS sign-out (`xcrun simctl keychain <udid> reset`) | see a request's headers or body, or a database row · drop the network |
| the author, through `scripts/record-proof.sh` | `recorder`: a command's exit, the expected text present and the rejected text absent in its output | any one command, with a time cap | anything the command does not print |
| `qa-parity` | `code` of both platforms (`Read`, `Grep`), and the values the surface agents recorded | nothing runs | anything running |

**Recording a run.** The prompt names the task's QA record folder, `.git/heliogrid-harness/<T-id>/qa/`
(`$R`), the round, the tree, and the ticket's steps with their execution detail from `run.md`. Before
the first step, read every step's `observe` and action against your row: `case-reviewer` already
refused a step no row can see or drive, so one you still cannot is recorded `inconclusive: cannot
observe <kind>` (or `cannot drive <action>`), never guessed. After EACH step, append ONE line to your
own file, `$R/verdicts-<surface>.jsonl` — no two agents write one file — and move on; a turn cap then
loses nothing. Write it with the one form `.claude/settings.json` lets a background agent run without a
prompt; the quoted heredoc takes any character, an apostrophe included, and a line that is not one JSON
object is refused before anything is written:

```bash
bash scripts/verify-digest.sh --append "$R/verdicts-<surface>.jsonl" <<'LINE'
{"step_id": "Q1", …}
LINE
```

The line, and nothing but it, in this shape (every agent and the recorder
cite it):

```
{"step_id": "Q<n>" | "P<n>", "surface": "api" | "worker" | "web" | "ios" | "android" | "parity",
 "claims": ["<the step's case ids, landing or core>"], "round": <the dispatch's round>,
 "stage": "verify" | "ship", "tree": "<the dispatch's tree id>", "at": "<UTC time, 2026-10-01T09:14:03Z>",
 "verdict": "pass" | "fail" | "inconclusive" (a step) · "clean" | "finding" | "inconclusive" (a probe),
 "expected": "<the step's literal>", "observed": <the exact value read>,
 "evidence": ["<a path under $R/evidence/>" or "<text: the matched tree excerpt, the computed values>"],
 "driver": "agent"}
```

A probe line adds `"target"` (the route or screen it aimed at), and a finding outside the task's
scope adds `"deferred"` (words of the `docs/tasks/deferred.md` row it wrote). `at` is read from the
clock (`date -u +%FT%TZ`) when the line is written. The step ids and claims are the plan's own, never
a sub-step (`Q3/FilterBar`, `Q10a`): several checks inside one step are one line, each value in
`observed`. `scripts/verify-digest.sh --verdicts <T-id>` refuses any other shape (`M151`). Batch
independent requests in one Bash call. Plain `sleep` is blocked: wait with
`perl -e 'sleep shift' N`. When the budget runs low, stop and return the array built so
far — never a prose summary in its place.

## A step decides on text, never on pixels

A model asked whether a screenshot "shows the login screen" guesses, in the direction of a pass — a
blank loading frame has been reported as a rendered screen. Every surface has a machine-readable tree,
and the criterion is always a literal string:

| Surface | Read with | Assert |
|---|---|---|
| web | `read_page` · `javascript_tool` for computed values | exact strings, exact computed values |
| iOS | `idb ui describe-all --udid <udid> \| grep -o '<words>'` | the step's exact words are in the tree |
| Android | `adb shell uiautomator dump` | `text="…"` attributes match exactly |
| api | `curl -i` | status line and body bytes |
| db | read-only `psql -tAc` against `heliogrid-pg-local` | the scalar returned |

"Renders correctly" is not a criterion; `text="Welcome back"` present and `text="Loading from"` absent
is. Screenshots are evidence for a person, never the verdict: a phone's failure keeps its screenshot
as a file under `$R/evidence/` (`xcrun simctl io`, `adb exec-out screencap`); the web's screenshot
tool returns an image, not a file, so web evidence is text — the tree excerpt and the computed values,
and a vision step writes what it saw in words. Vision is right
only for what only vision catches — clipping, overlap, truncation, broken Devanagari run-splitting,
layout collapse at 375 — and those steps say so.

## Parity — that the platforms AGREE

A shared constant can change on one platform while every per-surface step still passes. So in any
change touching shared code, each surface records an observed VALUE — OTP box count, input caps, the
error copy for one failure, a picker's options, a formatted phone — and one `parity` step compares
them.

## Evidence

Evidence files go to `$R/evidence/`, inside `.git`, so they outlive the session that took them; a
session scratchpad is gone before `/ship` reads them. Specifics, not adjectives. **Good** — "browser 375+1536 happy / wrong-code / send-error paths; iPhone
16 relaunch restores session; Pixel 8 fresh user passes; curl 409 returns ALREADY_ONBOARDED".
**Bad** — "verified working".
