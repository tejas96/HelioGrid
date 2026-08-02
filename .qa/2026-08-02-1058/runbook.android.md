# QA runbook — surface: ANDROID — run 2026-08-02-1058

You are executing scripted QA steps against the booted Android emulator using shell
commands: `adb shell uiautomator dump /sdcard/w.xml` + `adb shell cat /sdcard/w.xml`
(view tree), `adb shell input tap X Y`, `adb shell input text "..."`,
`adb shell input swipe X1 Y1 X2 Y2`, `adb exec-out screencap -p > file.png`. Screen is
1080x2400. Do NOT edit any repository file. Your only writes go to
`/Volumes/works-space/heliogrid/.qa/2026-08-02-1058/artifacts/`.

## HARD CONSTRAINT — login screen
`uiautomator dump` FAILS on the LOGIN screen ("could not get idle state" — its ambient
gradient never idles). If you land on login, navigate by screenshot + coordinate taps
ONLY: phone field ~(540,1310) when no keyboard; after typing, Continue sits ~(540,1156)
with keyboard up; type 9876543210, tap Continue, type 123456 (stub accepts any code).
Post-login screens dump normally. ALL assertions happen post-login via dumps.

## Starting state
The app is ALREADY logged in and sitting on Home ("Foundations ready" card with an
"Open my day" button, EN/हि/मर locale segments, and a "Component gallery" link).
`adb reverse tcp:8081` is established. Keep ONE app session — do not force-stop between
steps. Order: 001 → 002 → 003 → 004.

## Step 0 — write-proof (mandatory, first)
Write the current date and 'android executor alive' to
`/Volumes/works-space/heliogrid/.qa/2026-08-02-1058/artifacts/android.touch`.

## Evidence rules
- For EVERY step, write RAW dump extracts (the relevant text="..." values verbatim) to
  `/Volumes/works-space/heliogrid/.qa/2026-08-02-1058/artifacts/<STEP-ID>.txt`. Values are compared
  word-for-word against other surfaces later.
- Never mark a step pass without evidence in its artifact file.

## Getting to the gallery
Tap "Component gallery" on Home (find its bounds via dump). The Patterns sections are far
down the gallery ScrollView — swipe up repeatedly (e.g. `input swipe 540 1900 540 500 300`)
until a dump contains "Pattern — useZodForm (contract schema drives validation)".

## AND-PAT-001 (happy)
1. In the form: tap the "Name" input (bounds from dump), `input text "Asha Patil"`;
   tap the "Phone (E.164)" input, `input text "+919876543210"`; hide the keyboard
   (KEYCODE_BACK) if it covers Save; tap "Save".
2. Dump; expect "submitted: Asha Patil · +919876543210".
3. Scroll to the error section; dump; record verbatim, expect all three:
   - "You don't have access to do that."
   - "Something went wrong on our side. Try again. · Ref: req_demo2"
   - "Lead already won."

## AND-PAT-002 (edge)
1. Tap "Load more" until it disappears, dumping the "load-more · N/12" label after each
   settle. Expect 5/12 → 10/12 → 12/12, button gone.
2. Pager: tap Next to "page 2 of 3" then "page 3 of 3"; tap Next again (expect no
   change — disabled); Prev back to page 1; Prev again (no change). Dump labels each time.
3. Navigate back to Home (system back). Tap the "हि" segment. Re-enter the gallery
   (the link may now render in Hindi), scroll to the error section.
4. Dump — expect Devanagari error copy, e.g. "आपके पास यह करने की अनुमति नहीं है।",
   never a raw code like FORBIDDEN.

## AND-PAT-003 (negative)
1. Back to Home, switch to "EN", re-enter the gallery, scroll to the form.
2. Tap Save with fields empty → dump; expect "Name is required".
3. Tap Phone, `input text "98765"`, hide keyboard, tap Save → expect
   "must be E.164, e.g. +919876543210".
4. Tap "Simulate server reject" → expect "phone already exists on another lead" as the
   phone field's error.

## AND-PAT-004 (adversarial)
1. Fill valid Name+Phone; double-tap Save as fast as possible; dump; count occurrences of
   "submitted:" — expect exactly 1.
2. Tap "Load more" three times rapidly (if already 12/12 from step 002, note that state
   carried and assert the cap held instead). After 2s dump: counter (expect 12/12), count
   unique "Demo lead N" labels (expect 12), duplicates (expect none).

## Final output
Print ONLY a JSON object matching the report schema:
{"run_id":"2026-08-02-1058","summary":{"total":4,"pass":N,"fail":N,"inconclusive":N},
 "passes":["AND-PAT-001",...],
 "failures":[{"id":"...","surface":"android","quadrant":"...","steps_run":[...],
   "expected":"...","actual":"...","artifacts":[".qa/2026-08-02-1058/artifacts/<ID>.txt"]}],
 "inconclusive":[{"id":"...","why":"..."}]}
