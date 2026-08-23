# Round 14 — block 2, billing and plans

**This file is the index. The prompts live in [`round-14/`](round-14/), one file per send, copied
whole.** No prompt text here — a second copy is how the two drift apart.

Round 14 closes every gap that lands on **build block 2** (`M12` platform billing + `SCR-SHELL-06`)
and was not already needed by block 1. Register and evidence:
[`DESIGN-SYSTEM-GAPS.md`](DESIGN-SYSTEM-GAPS.md).

## The sends, in order

| # | file | gaps | what it is |
|---|---|---|---|
| 1 | [`round-14/PASTE-14A.md`](round-14/PASTE-14A.md) | 6, 10, 12 + 3 carried | finishing work — one leg missing on each |
| 2 | [`round-14/PASTE-14B.md`](round-14/PASTE-14B.md) | 13, 15, 21, 25 | four blockers, one a live bug |
| 3 | [`round-14/PASTE-14C.md`](round-14/PASTE-14C.md) | 37, 38, 47 | three defects |

**One session per send.** Live project is `c8aa4326-21bf-453a-8d11-749cc81dee12`, the more
recently updated of the two with that name.

14A goes first because it carries the **specimen check**: nine or ten `@dsCard` cards from rounds
13B and 13C have never been seen rendered — both rounds closed with the same caveat, that cards
stay blank until `_ds_bundle.js` recompiles. A component whose spec card is blank has no visible
specification, and 14B and 14C are built on those components.

## What 14A carries beyond its three gaps

- **`PreviewFrame`'s `inert`.** 13B set `inert` + *"deliberately not `aria-hidden`"* so a screen
  reader could still read the preview. `inert` removes its subtree from the accessibility tree, so
  the two intentions cancel. It matters on `SCR-M01-18`, where the preview *is* the thing being
  judged.
- **`Slider`'s field-mode edge.** Surfaced by 13A-2, which also named why the `Switch` answer does
  not transfer: a 1.5px inset on a 6px track reads as a *filled* track.
- **The specimen check** above.

## Two things worth knowing before reading 14B

**§1 is a live bug, not a gap.** `UsageMeter` defaults `limit = 0` and renders
`{fmt(value)} of {fmt(limit)}` unconditionally, so an unresolved meter prints **"0 of 0"** at full
confidence — and the no-rate case prints **"1,240 of 0"**, drawing the whole bar as the overage
segment against a zero bundle. `BM-27` is the row that forbids exactly this, and `UsageMeter` is
the component built for it.

**§4 needs a decision stated, not just a component.** `M05-79` wants horizontal snap cards on
mobile; `readme.md` says *"There is no horizontally-scrolling table in this system."* The brief
calls the snap-card form *"a first-class form, not a squeezed table"*, which reads as: it is not a
table, so the prohibition is not being bent. That reading is defensible — but it has to be written
down, because a screen quietly opting out of a system law is how the law stops meaning anything.

## What every send carries, and why

Rounds 11, 12 and 13A each half-landed the same way: the component was fixed and its `.prompt.md`,
spec card or template still taught the old form. The instruction those rounds carried — *"update
every surface that teaches the old behaviour"* — cannot be followed, because a session cannot
update files it does not know exist.

Since 13A-2 every send ends with the mechanical version instead:

> Search the whole project for the old form — the literal string or prop you just replaced — and
> paste every file that still contains it. Fix them and search again until the list is empty.
> Include the unused half of a file: a `Desktop()` that never renders is still copied.

That change is why 13A-2, 13B and 13C all came back with search results rather than assurances,
and why 13C found and fixed `Menu.d.ts`'s stale *"32px overflow button"* in passing.

## Patterns rounds 13A–13C settled

Every send's preamble repeats these so no later round re-answers a solved question:

| pattern | what it settles |
|---|---|
| `EditorSurface` | the sheet/panel switch, measured on its own layer, never the viewport |
| `FilterSet` · `FacetChips` · `RangeField` · `FilterPanel` | one filter body, several values per dimension, ranges, one code path for sheet and panel |
| `FieldOverride` · `ValueSource` | a value that was overridden · which layer supplied one |
| `PreviewFrame` | a framed, scaled, non-interactive window onto customer-facing output |
| `RichText` · `RichTextView` | closed mark set, editor and renderer, `measure()` + a caller-supplied page-estimate slot |
| `MarkRow` / `marks` | facts that must stay separately readable; `meta` stays one line of text |
| `ChipGroup` · `ReorderList` · `SourceDocument` | count-based overflow · arrow reorder with focus rules · a document you read |
| `renderProvenance` | the tier goes in the component's own `provenance` slot, never `children` |
| `--control-edge` inline | how a control gets a field-mode edge |

## After this

Round 15 covers blocks 3–6 in one send group — between them they need only four blockers nothing
earlier already required. Then 16 (the studio, **after the POC port**) and 17 (proposals).
