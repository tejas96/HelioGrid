# QA runbook — surface: IOS — run 2026-08-02-1058

You are executing scripted QA steps against the booted iOS simulator using shell commands:
`idb ui describe-all` (view tree), `idb ui tap X Y`, `idb ui text "..."` (types into the
focused field), `xcrun simctl launch booted com.heliogrid.app`. Do NOT edit any repository
file. Your only writes go to `/Volumes/works-space/heliogrid/.qa/2026-08-02-1058/artifacts/`.

## Step 0 — write-proof (mandatory, first)
Write the current date and 'ios executor alive' to
`/Volumes/works-space/heliogrid/.qa/2026-08-02-1058/artifacts/ios.touch`.

## Evidence rules
- For EVERY step, write RAW view-tree extracts (the relevant labels/values verbatim) to
  `/Volumes/works-space/heliogrid/.qa/2026-08-02-1058/artifacts/<STEP-ID>.txt`. Values are compared
  word-for-word against other surfaces later.
- Never mark a step pass without evidence in its artifact file.
- Keep ONE app session across steps — do not relaunch between steps (Metro bundle refetch
  is the cost). Order: 001 → 002 → 003 → 004.

## Getting to the gallery
1. `xcrun simctl launch booted com.heliogrid.app`; wait ~5s; `idb ui describe-all`.
2. If the tree shows "Welcome back"/"Mobile number": tap the phone field, type a 10-digit
   number (9876543210), tap "Continue", type "123456" (stub accepts any code). Wait for
   Home ("Foundations ready" card).
3. On Home tap "Component gallery". The Patterns sections are far down the ScrollView —
   swipe up repeatedly (`idb ui swipe` from low to high Y) until the tree shows
   "Pattern — useZodForm (contract schema drives validation)".

## IOS-PAT-001 (happy)
1. In the form: tap the "Name" input, type "Asha Patil"; tap the "Phone (E.164)" input,
   type "+919876543210"; tap "Save".
2. Expect tree text "submitted: Asha Patil · +919876543210".
3. Scroll to the error section; record verbatim, expect all three:
   - "You don't have access to do that."
   - "Something went wrong on our side. Try again. · Ref: req_demo2"
   - "Lead already won."

## IOS-PAT-002 (edge)
1. In the pagination section tap "Load more" until it disappears, recording the
   "load-more · N/12" label after each settle. Expect 5/12 → 10/12 → 12/12, button gone.
2. Pager: tap Next to "page 2 of 3" then "page 3 of 3"; tap Next again (expect no change —
   disabled); Prev back to page 1; Prev again (no change). Record each label.
3. Navigate back to Home (back chevron). Tap the "हि" locale segment. Re-enter
   "Component gallery" (its Hindi label if translated), scroll to the error section.
4. Record the error texts — expect Devanagari, e.g.
   "आपके पास यह करने की अनुमति नहीं है।" — never a raw code like FORBIDDEN, text not clipped.

## IOS-PAT-003 (negative)
1. Back to Home, switch locale to "EN", re-enter the gallery, scroll to the form.
2. Tap Save with fields empty → record errors; expect "Name is required".
3. Enter Phone "98765", tap Save → expect "must be E.164, e.g. +919876543210".
4. Tap "Simulate server reject" → expect "phone already exists on another lead" as the
   phone field's error.

## IOS-PAT-004 (adversarial)
1. Fill valid Name+Phone; double-tap Save as fast as possible; count occurrences of
   "submitted:" in the tree — expect exactly 1.
2. Scroll to pagination (fresh state not required if already 12/12 — in that case note it
   and instead relaunch the app, log in if needed, return here). Tap "Load more" three
   times rapidly; after 2s record: counter (expect 12/12), row count (expect 12 unique
   "Demo lead N" labels), duplicates (expect none).

## Final output
Print ONLY a JSON object matching the report schema:
{"run_id":"2026-08-02-1058","summary":{"total":4,"pass":N,"fail":N,"inconclusive":N},
 "passes":["IOS-PAT-001",...],
 "failures":[{"id":"...","surface":"ios","quadrant":"...","steps_run":[...],
   "expected":"...","actual":"...","artifacts":[".qa/2026-08-02-1058/artifacts/<ID>.txt"]}],
 "inconclusive":[{"id":"...","why":"..."}]}
