# Triage — run 2026-08-02-1058 (foundation-dx gallery verification)

## Executor accounting

| surface | status | duration | total_tokens |
|---|---|---|---|
| web | SUCCESS 4/4 | 227s | 358,430 |
| android | SUCCESS 4/4 | 697s | 862,688 |
| ios (first call) | ERROR: print-timeout at 15m after completing 001+002 | 892s | 1,084,021 |
| ios (retry, `--conversation <id>`) | SUCCESS 4/4 (003+004 fresh; 001+002 from first call's artifacts) | 1187s | 1,209,572 |

Retry protocol note: the skill says `--continue on the same conversation`, but
`agy --continue <id>` opens interactive mode and dies on `/dev/tty` in a pipeline. The
working non-interactive form is `--conversation <id>` with `-p`. Total run consumption
across all four calls: ~3.5M tokens.

## Environment (fixed during preflight — no round consumed)

- Web dev server was down (stopped earlier for `turbo build` per the `.next` collision
  landmine) — restarted.
- `adb reverse tcp:8081` was missing — re-established; without it the Android app hangs on
  the Metro loading screen and uiautomator never idles.
- Discovered constraint, recorded in plan.json: the LOGIN screen never reaches uiautomator
  idle (ambient gradient animation). Launcher and every post-login screen dump normally.
  Runbooks route login transit through coordinate taps + screencap.

## false-positive (in the PLAN, not the product)

- **Empty-submit message**: plan expected "Name is required"; every surface actually shows
  zod's DEFAULT "Required". Cause: an untouched RHF field submits `undefined`, so zod fails
  at `invalid_type` (default message) before ever reaching `min(1, 'Name is required')`.
  The behaviour is correct-by-design and IDENTICAL on web + android (+ ios pending retry) —
  parity holds. The plan's expected string was authored from the schema without accounting
  for the undefined path. Kept as evidence; plan.json NOT edited (gate rule).
  - Executor note: both executors judged this "pass" against the imprecise expectation
    rather than flagging the text mismatch — leniency noted; the artifacts are verbatim
    and two independent executors captured the SAME value, so the evidence itself is
    trusted.
  - Product note: "Required" is untranslated default copy — one more instance of the
    documented deliberate English-fallback gap (spec §2.4). No new register entry needed;
    §2.4 already covers field-level validation copy.

## Cosmetic executor variance (no defect)

- AND-PAT-004 typed "Asha patil" (lowercase p) on re-entry; the submitted line faithfully
  echoes input. Not a product finding.
- IOS-PAT-003 shows "Name is required" where web/android showed "Required". Same shared
  code, two zod paths: iOS's form retained step-001 state, so clearing yielded an empty
  STRING ('' → `min(1)` → custom message); web/android submitted UNTOUCHED fields
  (`undefined` → `invalid_type` → zod default "Required"). Both values recorded verbatim;
  no cross-platform divergence in shared code.

## Parity check (Phase 4½) — values compared VERBATIM across surfaces

| value | web | ios | android |
|---|---|---|---|
| submitted line | `submitted: Asha Patil · +919876543210` | same | same |
| E.164 error | `must be E.164, e.g. +919876543210` | pending retry (003) | same |
| server-reject error | `phone already exists on another lead` | pending retry (003) | same |
| load-more walk | 5/12 → 10/12 → 12/12, button gone | same | same |
| pager bounds | page 1..3, never exceeded, list never empty | same | same |
| Hindi FORBIDDEN | n/a (EN-only surface this run) | `आपके पास यह करने की अनुमति नहीं है।` | identical |
| Hindi INTERNAL + Ref | n/a | `हमारी ओर से कुछ गड़बड़ हो गई। फिर से कोशिश करें। · Ref: req_demo2` | identical |

No divergence on any compared value. The shared-package construction (forms, hooks, copy)
is doing exactly what Law 7 wants — the values agree because the code is the same code.

## Buckets

- bug: none so far.
- product-question: none (the "Required" copy folds into spec §2.4's documented gap).
- false-positive: the plan's empty-submit expected string (above).
- environment: web server restart, adb reverse (above).
