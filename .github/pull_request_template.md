## What

<!-- The task id and name, then one short paragraph in simple words: who gains what. Explicit
     non-goals here — not a file list. -->

## RFC

<!-- First, every decision the session took, one line each with its reason. Then the plan
     (the task's `#### RFC`), pasted whole: it leaves the task file in this commit. -->

## Acceptance criteria → proof

| line | ✓ | proof |
|---|---|---|

<!-- Every `AC-n` of the approved RFC's proof matrix with the result of its proof: the test by
     file and name or the check run on the app. A line with no proof is not done, and this PR is
     not open. -->

## QA report

<!-- What was checked on the running app, per surface, with observed values, and what was NOT run
     and why. Specifics, not adjectives. -->

## Review

| finding | fix |
|---|---|

<!-- The review's findings and what was done about each; a Low finding left unfixed says why. -->

## Gate

<!-- `pnpm check:all` on the test database: the result, and the first failing line if it failed
     once. Then the task's own `tests/e2e/web` specs run locally (`/task`, *Clean up, then the gate*), or "none
     changed". -->

## Red proofs

| rule | break | red line |
|---|---|---|

<!-- Every planted red: each money, tenancy or permission rule, and each check this change adds or
     alters — the break applied and its FAIL line. -->

## Mistakes found

<!-- One line per mistake found in this work — by the author, the review, QA or a check — named by
     its kind, with where it is now prevented. Say "none" when there were none. -->

## Cost

<!-- The meter's one line for this task, every session summed: effective tokens, main turns,
     agents, images, hours (`/task`, *Ship*). -->

## Deferred

<!-- The docs/tasks/deferred.md rows this task met — joined (deleted here) or stays (its new
     `reopens when`) — the rows it added, and anything left unresolved. -->
