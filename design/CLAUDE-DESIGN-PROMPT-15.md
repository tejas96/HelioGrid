# Round 15 — blocks 3, 4, 5 and 6

**This file is the index. The prompts live in [`round-15/`](round-15/), one file per send, copied
whole.** No prompt text here — a second copy is how the two drift apart.

Four blocks share one round because, between them, they need only four blockers that rounds 13 and
14 did not already build. Register and evidence:
[`DESIGN-SYSTEM-GAPS.md`](DESIGN-SYSTEM-GAPS.md).

| block | what it is | V1 screens |
|---|---|---|
| 3 | `M02` CRM & leads | 6 |
| 4 | `M08` Projects | 6 |
| 5 | `M11` Payments & collections | 4 |
| 6 | `M07` sales exec, calling core + `M13` owner home | 12 |

## The sends, in order

| # | file | gaps | what it is |
|---|---|---|---|
| 1 | [`round-15/PASTE-15A.md`](round-15/PASTE-15A.md) | 3, 22 + the touch sweep | last legs, and one debt |
| 2 | [`round-15/PASTE-15B.md`](round-15/PASTE-15B.md) | 27, 28, 53, 54 | the voice-agent configuration cluster |
| 3 | [`round-15/PASTE-15C.md`](round-15/PASTE-15C.md) | 42, 43, 48, 50, 51 | five operational defects |

**One session per send.** Live project is `c8aa4326-21bf-453a-8d11-749cc81dee12`, the more recently
updated of the two with that name.

## Two gaps were narrowed before sending, because round 14 built part of them

This is the discipline that keeps a round from asking for something that already exists — it has
caught three times now, and each catch would otherwise have produced a second, different answer to
a settled question.

- **Gap 22** (machine-vs-human attribution) — `ActivityStream`'s `actorClass` closed the *stream*
  half in 14B. What remains is the mark on **a task**, which is where `M07-03` bites hardest:
  *"Agent activity is a separate block, never mixed with the rep's own tasks… blurring that line is
  how people stop trusting the automation."* A task has no `at` and no `kind`; it is a thing to be
  done, not a thing that happened.
- **Gap 3** (the standing axis) — the axis landed and every host takes it **container-wide**.
  `M11-42` needs it **per record**: the payments ledger puts a confirmed row next to a reported one.
  `column.gap(row)` and `rowActions(row, {stacked})`, both built in 14B/14C, are the shape of the
  answer.

Two more compose rather than start fresh: **gap 28** is largely `ReorderList` plus a row that
cannot be deleted by law, and **gap 54** is largely `ValueSource` applied to dates.

## The debt in 15A

The 44px floor has been "fixed" four times, and **eight sites have been found one at a time** — by
grepping `minHeight: 32` and by accident. That method misses any control that spells its height
differently: `SegmentedControl`'s segment has no `minHeight` at all and was found only while
searching for something else.

`Breadcrumb` exposed the second failure. I called *"32px with a negative-margin pad"* the shape of
a correct answer; the measurement came back **47×32 and 48×32**. A negative margin borrows layout
space — it does not enlarge a hit box — so the presence of the `FilterBar` treatment is not
evidence the treatment works.

15A asks for one exhaustive sweep with a measured table, and for the floor and its single exception
to be written into `readme.md` so this is the last round that finds one.

## What every send carries, and why

Rounds 11, 12 and 13A each half-landed the same way: the component was fixed and its `.prompt.md`,
spec card or template still taught the old form. Since 13A-2 every send ends with a mechanical
instruction instead of a judgement call:

> Search the whole project for the old form — the literal string or prop you just replaced — and
> paste every file that still contains it. Fix them and search again until the list is empty.
> Include the unused half of a file: a `Desktop()` that never renders is still copied.

That is why 13A-2 found a stale `IcBell` in a third template, 13C fixed `Menu.d.ts`'s 32px line in
passing, and 14C found six live em-dash-as-a-value instances including one in its own new
`CompareGrid`.

## After this

Round 16 — block 7, the studio — **after the POC port**, because
`/Volumes/works-space/Solar-App-POC` is better evidence for a 3D scene than the briefs are. Then
round 17 for block 8, then one verification pass over everything.
