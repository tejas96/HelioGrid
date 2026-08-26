# SCR-M03-04 · Campaign Builder — Review & Schedule

Commit step: sendable count with exclusions, projected meter burn and remaining allowance side by side, schedule time in tenant timezone.

**Module:** M03 · Marketing · **Personas:** Marketing (`F2.M03.manage-campaigns` schedules; spend-adjacent choices additionally require `F2.M03.approve-campaign-spend` — EPC Owner only), EPC Owner · **Context of use:** campaign authoring is desktop-first and fully functional on mobile (M03 §2); this is where the two numbers a person needs before committing sit side by side — how many people, and what it costs (M03 §M03.2 behavior detail); none of these numbers is a tooltip — they are the content of the screen (M03 §M03.6 behavior detail).

## Entry & exit

Reached from: the content step (SCR-M03-03). Leads to: scheduling commits the campaign to its single send moment — now or at a stated time in the tenant's timezone (`M03-12`); the destination after a successful schedule is not pinned by PRD — designer decides, note the decision. Refusal exits are pinned: a zero/unresolved audience cannot be scheduled (`M03-11`), a time outside the market's messaging window is refused with the window named (`M03-12`), and a projected burn above the remaining allowance cannot be scheduled without the Owner's explicit overage approval (`M03-45`).

## Requirements (verbatim)

### docs/prd/modules/M03-marketing.md

- **M03-11** (P0) — **An audience is resolved to a count, with its exclusions itemised, before a campaign can be scheduled.** The pre-schedule summary states: records matched · excluded for missing channel address · excluded for no consent on this channel · excluded as suppressed (opted out, complained, previously undeliverable — `M03-47`) · **records that will actually be sent to**. A campaign cannot be scheduled from an unresolved audience, and the count is re-resolved at send time (`M03-14`).
- **M03-12** (P0) — **A campaign is scheduled to send now or at a stated time, in the tenant's timezone, and the time is shown with the timezone named.** Scheduling is a single send moment per campaign; there is no recurring schedule and no campaign calendar in this release (§5). Where the market's pack declares a messaging send window, a scheduled time outside it is refused at scheduling with the window named — never silently shifted (`M03-48`).
- **M03-44** (P0) — **Every send on a metered channel burns the marketing-sends meter, and the campaign shows the projected burn before it commits.** The meter, its channels (business messaging, SMS, email), its per-channel bundles and overage, and the billable unit per channel are `04-business-model.md`'s (`BM-21` consumed; the meter is one of the five in the canonical set, `BM-16`). This module states no bundle size, rate or price — those are market-book data (`BM-41`, `F1-61`) — and shows, before scheduling: the audience's sendable count, the projected burn, and the remaining allowance after it.
- **M03-45** (P0) — **Allowance exhaustion follows the cap law and the soft-block law — never a silent truncation.** At 80% of the channel's allowance the usage surface warns (`BM-34` consumed: the first notice is never the block). A campaign whose projected burn exceeds the remaining allowance cannot be scheduled by a person without `F2.M03.approve-campaign-spend`; with that grant, the overage is shown explicitly and approved explicitly. A campaign that exhausts an allowance **mid-send pauses** (`M03-09`), states exactly how many were sent and how many remain, and offers the upgrade/pay route (`BM-32`'s always-available billing screens). Reading, exporting and every already-captured lead stay available in every billing state (`BM-32`). _(non-UI half, build-side: 80% pre-warn; overage needs approve-campaign-spend grant; mid-send exhaustion pauses — for awareness, not for drawing)_

## States

- **loading**
- **empty** — nothing to review yet (audience unresolved or content missing); a campaign cannot be scheduled from an unresolved audience (`M03-11`).
- **error**
- **normal** — sendable count with its itemised exclusions (`M03-11`), projected meter burn and remaining allowance after it (`M03-44`) side by side, and the send moment with the tenant's timezone named (`M03-12`).
- **audience-zero** — the audience resolves to zero: scheduling is impossible and the summary says which exclusion removed everyone (`M03-11`).
- **window-refused** — the scheduled time falls outside the market's declared messaging window: refused at scheduling with the window named, never silently shifted (`M03-12`). **This state is CONDITIONAL on the market pack declaring a messaging window, and the window text it names is pack data, not screen copy (`F1-15`, `F1-17`; `Q53`).** The IN pack declares an EMPTY window (`F1-62`, owner ruling 2026-08-26 `Q53`: TCCCPR binds a time band to promotional traffic per recipient via DLT, never as a fixed window this product can render) — so at launch this state does not render for an Indian tenant. Draw it anyway: the design must be complete the day a pack declares one, and the window is evaluated on the **tenant's** timezone (owner ruling 2026-08-06 `Q58`). *(Conditionality added by the readiness pass, 2026-08-07: this state previously read as unconditional, which would have had the designer draw a refusal that cannot fire and invent a window value that does not exist.)*
- **overage-approval-required** — projected burn exceeds the remaining allowance: scheduling refused without `F2.M03.approve-campaign-spend`; with that grant, the overage is shown explicitly and approved explicitly (`M03-45`).
- **template-unapproved-refusal** — the channel requires a registered template and none is approved: scheduling is refused and the registration state is named (M03 §M03.3 acceptance criteria).
- **billing-state-blocked** — the tenant's billing state pauses metered sends; the campaign holds with the billing reason named and the pay/upgrade route offered, while reading, exporting and every already-captured lead stay available (`M03-45`).

## Data volume

Design at the PRD's working scale: a sendable audience on the order of a thousand recipients (M03 §2) with the full five-part `M03-11` exclusion breakdown, against allowances at bundle scale — the draft India book runs Starter 500 / Growth 2,000 / Pro 10,000 sends/mo (`M03-52`) — so the projected-burn-vs-remaining-allowance comparison must read clearly when the numbers are close.

## Numbers carrying provenance

Each of these renders with its F8 provenance tier in the design:

- Records matched, and each itemised exclusion count (missing channel address · no consent on this channel · suppressed) (`M03-11`)
- Records that will actually be sent to — the sendable count (`M03-11`, `M03-44`)
- Projected meter burn (`M03-44`)
- Remaining allowance after the send (`M03-44`)
- The explicit overage figure when projected burn exceeds remaining allowance (`M03-45`)
- The scheduled send time, shown with the timezone named (`M03-12`)
- The market's messaging window, named on a refusal (`M03-12`)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state and a Context-of-use clause stating scheduling was online-only (register `Q15`). Both are deleted.*
