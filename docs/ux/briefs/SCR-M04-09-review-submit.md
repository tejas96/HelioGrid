# SCR-M04-09 · Review & Submit

State what is captured, missing and flagged — each missing item as a consequence — then submit, never gated.

**Module:** M04 · Survey · **Personas:** Survey Engineer (primary), Sales Executive, Sales Manager, EPC Owner · **Context of use:** the last screen of every physical survey, on a phone, on site. "The review screen is the module's most important screen and it is designed against a specific human failure: not carelessness, but the single forgotten item discovered a day later by someone else" — it reads like a colleague rather than a form validator (M04 §M04.9 behavior detail).

## Entry & exit

Reached from: the end of Guided Capture (SCR-M04-07) — the happy path is *open My Visits → navigate → capture through the guided steps → review → submit → the designer is notified* (M04 §M04.9 behavior detail). It renders even when everything is captured — briefly and positively; it is not skipped when there is nothing wrong. Leads to: every missing or flagged item is one tap back to the step that fills it, and an item filled from review returns to review at the same place with the item now captured; submit moves the survey to its submitted state and the designer's notification fires from the applied submission. The submitted survey becomes the designer's brief (SCR-M04-10).

## Requirements (verbatim)

### docs/prd/modules/M04-survey.md

- **M04-37** (P0) — **When a physical visit upgrades a remotely surveyed site, the change of provenance is shown before it commits, and both versions survive.** Moving a site from `derived` to `measured` is exactly the tier change `F8-05` requires the product to state rather than perform silently: what changed, which figures move, and what is affected downstream. The earlier version is never overwritten (M04-57). _(non-UI half, build-side: both versions survive; earlier version never overwritten — for awareness, not for drawing)_
- **M04-49** (P0) — **The review screen states three things before submit: what is captured, what is missing, and what is flagged.** It is the last screen of every physical survey and it is not a summary — it is the product's one chance to stop a second trip. Missing items are listed by name, skipped-and-flagged steps are listed as such, and both are reachable in one tap from the review screen itself.
- **M04-50** (P0) — **A missing item is explained by its consequence, in plain language — not by a validation message.** The source's own example is the requirement's shape: *"meter photo missing — the designer cannot size the system without it."* Every missing-item line says what the absence will cost, because *"the surveyor's mistake is not laziness, it is forgetting one item that costs a second trip"* and *"a review screen that says [this] in plain language prevents more rework than any amount of validation."*
- **M04-52** (P0) — **Submitting hands the survey to the designer and tells them.** Submit moves the survey to its submitted state and notifies the design side that a survey is ready, with the survey, its photographs, its flagged items and its open gaps attached. The notification type registers with `foundations/F6-notifications-and-search.md`; the hand-off content is §M04.12's. _(non-UI half, build-side: F6 notification fires from the applied submission, once — for awareness, not for drawing)_

Supporting behavior from the same doc (M04 §M04.9 behavior detail): items grouped as *captured*, *missing* and *flagged*, each missing item written as a consequence, each one tappable straight back to the step that fills it. The submit action stays enabled throughout (`F4-27`, `F7-42`): a surveyor who genuinely cannot get the meter photograph today must be able to submit what they have, with the absence stated, rather than be trapped between a locked button and a locked door. Nothing is blocked at submit — missing items travel to the designer as named absences rather than as blanks (M04-51, build-side of this screen's guarantee). A second submit of the same survey is idempotent (`F4-07`).

## States

- loading
- empty
- error
- all-captured-positive (rendered briefly and positively; not skipped when nothing is wrong)
- missing-with-consequence (each missing item named with what the absence will cost)
- flagged-listed (skipped-and-flagged steps listed as such)
- provenance-change-notice (physical upgrading a remote site: the `derived` → `measured` change shown before it commits)
- tap-back-to-step (one tap from any missing or flagged item to the step that fills it; returns to the same place)

## Data volume

Three groups — captured, missing, flagged — spanning all five capture groups and their photographs (the PRD's scale: a survey of around 12 photos). Design at a mixed outcome: several captured groups, at least one named missing item with its consequence line, and at least one flagged skipped step.

## Numbers carrying provenance

- Captured figures restated at review (dimensions, meter reading, sanctioned load, existing load, obstruction heights) — each carries its per-field F8 tier (`measured` / `estimated`), never a survey-wide tier (`M04-35`)
- The provenance-change notice — states which figures move from `derived` to `measured` and what is affected downstream, before commit (M04-37, `F8-05`)
- Missing and flagged counts — flow facts feeding the review groups, not site figures
