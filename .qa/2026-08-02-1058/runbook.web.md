# QA runbook — surface: WEB — run 2026-08-02-1058

You are executing scripted QA steps. Use the playwright MCP browser tools. The web app is
running at http://localhost:3002. Do NOT edit any repository file. Your only writes go to
`/Volumes/works-space/heliogrid/.qa/2026-08-02-1058/artifacts/`.

## Step 0 — write-proof (mandatory, first)
Write the current date and 'web executor alive' to
`/Volumes/works-space/heliogrid/.qa/2026-08-02-1058/artifacts/web.touch`.

## Evidence rules
- For EVERY step, write the RAW observed evidence (page text extracts, counter labels
  after each action, error strings verbatim) to
  `/Volumes/works-space/heliogrid/.qa/2026-08-02-1058/artifacts/<STEP-ID>.txt`. Non-empty, verbatim values —
  they are compared word-for-word against other surfaces later.
- Never mark a step pass without the evidence in its artifact file.

## Target
`http://localhost:3002/design/gallery` — scroll to the three sections whose headings start
with "Pattern —". The form has inputs labelled "Name" and "Phone (E.164)", buttons "Save"
and "Simulate server VALIDATION_FAILED". The pagination section has a "Load more" button,
"Prev"/"Next" buttons, and counter labels like "load-more · 5/12" and
"pager · page 1 of 3 · 12 total". The error section renders three error texts.

## WEB-PAT-001 (happy)
1. Navigate to /design/gallery. Assert all three "Pattern —" headings exist.
2. Fill Name="Asha Patil", Phone="+919876543210". Click Save.
3. Expect a line exactly "submitted: Asha Patil · +919876543210".
4. Record the three error-section texts verbatim. Expect:
   - "You don't have access to do that."
   - "Something went wrong on our side. Try again. · Ref: req_demo2"
   - "Lead already won."

## WEB-PAT-002 (edge)
1. Click "Load more" repeatedly until it disappears; record the "load-more · N/12" label
   after each settle (~500ms). Expect 5/12 → 10/12 → 12/12, then no button.
2. Pager: click Next → expect "pager · page 2 of 3 · 12 total"; Next → page 3; assert the
   Next button is disabled at page 3; Prev twice back to page 1; assert Prev disabled.
   After EACH click record the label AND the number of visible list rows in that pager
   list — it must never be 0 (keepPreviousData holds the old page during load).
3. Resize the viewport to 375x812. Assert the form and pagination sections are visible and
   the page has no horizontal scrollbar (document.scrollingElement.scrollWidth <=
   window.innerWidth + 1). Restore the viewport.

## WEB-PAT-003 (negative)
1. Reload /design/gallery.
2. Click Save with both fields empty → record field errors. Expect "Name is required" under
   Name (phone error may also appear).
3. Type "98765" into Phone, then blur (click elsewhere). Expect the phone field error
   "must be E.164, e.g. +919876543210".
4. Click "Simulate server VALIDATION_FAILED". Expect "phone already exists on another lead"
   rendered AT the phone field (below the input), not as a toast/banner elsewhere. Record
   where it rendered.

## WEB-PAT-004 (adversarial)
1. Reload. Fill valid Name+Phone. Double-click Save as fast as possible. Count elements
   whose text starts with "submitted:" — expect exactly 1.
2. Click "Load more" three times as fast as possible; wait 2s. Record: the counter label
   (expect 12/12), the number of rows in the load-more list (expect 12), and whether any
   row label appears twice (expect none — dedupe by id).
3. In the pager go to page 3, then click Next five times rapidly. Record the label —
   expect it never exceeds "page 3 of 3" and the list is never empty.

## Final output
Print ONLY a JSON object matching the report schema:
{"run_id":"2026-08-02-1058","summary":{"total":4,"pass":N,"fail":N,"inconclusive":N},
 "passes":["WEB-PAT-001",...],
 "failures":[{"id":"...","surface":"web","quadrant":"...","steps_run":[...],
   "expected":"...","actual":"...","artifacts":[".qa/2026-08-02-1058/artifacts/<ID>.txt"]}],
 "inconclusive":[{"id":"...","why":"..."}]}
