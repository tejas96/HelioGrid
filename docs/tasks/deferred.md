# Deferred — found during a task, outside its scope

One file. A row here is the NEXT task, never a parked fix (`CLAUDE.md` §8). Each row: the issue ·
why not now · what it depends on · what must happen · who picks it up. The row goes when it ships.

| issue | why not now | depends on | what must happen | picks it up |
|---|---|---|---|---|
| `packages/theme/src/_generated/tokens/{colors,elevation,field-mode}.css` carry six comments naming a retired open-question id with a date; they are pulled from the design system and never hand-edited | the text lives in the design system's token descriptions, not in this repo | a Claude Design session editing those descriptions | edit the six descriptions to state the raised-control rule without the id, then `ds:pull`; the generated files then carry no id and gate 26's `_generated` exemption can go | the next `ds:pull` |
| `packages/domain/src/auth/login-policy.ts` holds `DONE_DWELL_MS = 1400` while `docs/ux/briefs/SCR-M01-01-sign-in.md` records the design decision as 1.2 s on both platforms | a behaviour change outside the docs sweep that found it | nothing | one of the two moves; the brief is the design of record, so the number follows it unless the owner rules otherwise | `T-M01-001` |
| The datasheet-PDF extraction (`M01-40`'s build half) has no engine task; T-M01-016 names it and a screen may not own it | found while splitting M01 | `T-FPLAT-035` and the worker's outbox | one engine ticket: an extraction job over the stored file returning typed fields with the page read, on the worker | the `/start` of `T-M01-016` |
