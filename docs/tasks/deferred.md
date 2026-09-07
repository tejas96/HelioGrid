# Deferred — found during a task, outside its scope

One file. A row here is the NEXT task, never a parked fix (`CLAUDE.md` §8). Each row: the issue ·
why not now · what it depends on · what must happen · who picks it up. The row goes when it ships.

| issue | why not now | depends on | what must happen | picks it up |
|---|---|---|---|---|
| `packages/domain/tests/pricing/cogs.test.ts` "the IN book's own headroom" block compares literals to literals and never reads `IN_PRICE_BOOK`; the six `worstCaseCogs` figures in `packages/domain/src/pricing/india.ts` are `floor(rate / 1.4)` typed by hand, so a moved `COGS_MARKUP_FLOOR` leaves them silently wrong | domain code found by an audit, not by a task | nothing | the test derives each figure from its rate and the floor, and reads the book | `T-FCORE-016` |
| Comments restate the `past_due` day boundary and the 7-day grace (`packages/domain/src/commerce/states.ts`, `soft-block.ts`), and the list count in `packages/domain/src/commerce/index.ts` has rotted | comment-only | nothing | cite `BM-33`; drop the days and the count | `T-FCORE-016` |
| `docs/engineering/architecture.md` says i18n waits for the money slice (it landed) and its invariant list omits `format-rendering`; four comments still say the auth module "re-adds `src/schema/`" (`packages/db/drizzle.config.ts`, `tests/invariants/src/schema-parity.ts`, `run.ts`, `tenancy-rls.ts`) | doc and comment rot | nothing | the Law 8 sweep | `T-FCORE-016` |
