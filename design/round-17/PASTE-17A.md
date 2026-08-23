A verification pass over all 48 items rounds 13–16 sent has just finished — twelve readers over the
live files, then a skeptic at every verdict they marked closed. **The headline is good: zero of the
48 came back `OPEN`.** Every component exists and does substantially what was asked.

What it did find is a tail of about a dozen things that are **actually wrong**, as opposed to
badly documented. This message is that tail. The documentation drift is a separate message.

**Don't ask me how it should look.** The system owns that.

## 1 · The same contrast mistake in two places, and the system already does it right in two others

This is one fix stated once, not two patches.

**`BandedFigure`** — on the `warning` tone the mark measures **1.99:1 on its tint** (the dot), and
the leading-edge bar measures **2.17:1**. Both are below the 3:1 non-text floor. So on *Fair*,
*High — clipping risk*, *Low — oversized* and *Under the MPPT floor*, the band is carried by **the
word plus a tint and no legible mark**.

That is exactly the `F7-12` failure this component was built to close.

**`AllocationMeter`** — the `over` state's mark has the same defect: plain `--warning` at **2.17:1**
on white.

**And the system already gets this right twice.** `StatusChip`'s dot and `VersionDiff` both use the
`-text` partner for the identical job. `tokens/colors.css` says why: *"Semantic colours are MARKS
(dots, bars, fills, tints). Their `-text` partners are the only ones allowed to set words."* A mark
that has to be **seen** against a tint needs the same treatment as one that has to be read.

So: `mark:` in `BAND_TONES` takes the `-text` partner, `AllocationMeter`'s `over` mark likewise —
**and then check every other mark in the system against the 3:1 floor**, because two independent
components made the same slip in the same month and there is no reason to think it stopped there.
Report the measured ratio of every semantic mark, not just the two named.

## 2 · Two numeric claims that do not survive their own arithmetic

Both are repeated on multiple teaching surfaces, so the number is being taught.

**`CompareGrid` says two columns fit 375px. They need 520.**

`CompareGrid.d.ts` on `columnWidth`: *"Default 196 — **two columns plus the pinned labels fit a
375px screen**."* With `labelWidth` defaulting to 128: `128 + 196 + 196 = 520px`. On a 375px
viewport the visible option track is `375 − 128 = 247px` — **1.26 columns.** Wrong by 145px.

`compare-grid.card.html` repeats the claim *under the panel that is supposed to prove it*, with
`columnWidth={168} labelWidth={112}` inside a 375px phone frame whose inner width is 343px: two
columns need **448px** there.

`M05-79`'s snap-card contract is real and the component is right in shape — it is the stated
default and the caption that are false. Fix the numbers, or fix the defaults so the numbers become
true, and say which you did.

**`PreviewFrame` says it crops at 375px. It never does.**

`PreviewFrame.d.ts`: *"**375px, honestly.** An A4 sheet at 335px is 0.70 scale, which puts 11px
document type at ~7.7px. The frame refuses to scale below `minScale` and **crops** instead."*
`readme.md` law 6 asserts the same consequence.

From the code: `raw = Math.min(1, w / designWidth)`, `cropped = raw < minScale`, with
`minScale = 0.62` and `designWidth = 480`. At a 375px phone the frame is ~335–343px wide, so
`raw = 0.698`–`0.715` — **comfortably above 0.62**. `cropped` is false, the sheet scales, and 11px
type renders at **7.68–7.86px**: exactly the size the docs call unacceptable, by the mechanism the
docs say prevents it.

This lands on `SCR-M01-18`, where the preview is the thing being judged.

## 3 · Three behaviours that are documented and cannot happen

**`MapSurface`'s Confirm Location cannot be tapped.** `MS1-18` requires *"Confirm Location
(disabled until a pin pends)"*. The pending/confirmed distinction is fully built — and **the tap
lands on the placement layer and re-places the pin instead**, because the overlay wrapper sits
under the placement layer's `zIndex: 1`. So on `SCR-MS-04`, on touch, the button that consumes the
whole pending state is unreachable. That is the one screen and the one input this was raised for.

**`ReorderList`'s end-of-list announcement cannot fire.** Four teaching surfaces promise it — the
`.d.ts` (*"Structure mounting is already first."*), the `.jsx` header comment, `ReorderList.prompt.md`
and `reorder.card.html`'s `.said` block. The code path is real:

```js
if (to < 0 || to >= items.length) { setSay(`${name} is already ${dir === "up" ? "first" : "last"}.`); return; }
```

But the only buttons that reach it are `disabled={i === 0}` and `disabled={i === items.length - 1}`,
and **a natively disabled button never fires `onClick`.** The branch is unreachable and the live
region never speaks. (The arrow's `aria-label` still carries the fact in browse mode, so nothing is
silently wrong on screen — but the documented behaviour is not the shipped behaviour.)

Note this is the same `disabled`-versus-`aria-disabled` distinction round 14C already ruled on for
`ActionReason`: *"a native `disabled` leaves the tab order, so `aria-describedby` on it is announced
to nobody."* The ruling exists; this component predates it or missed it.

**`Derivation`'s `mode="many"` is inert.** The union member is typed and nothing implements it —
`prompt.md` and law 24 only ever say *single-open* and *"there is no `openAll`"*, so the type is the
sole promise and it is unkept. It matters on `SCR-MS-10`'s model-boundary panel and `SCR-MS-03`'s
provenance footer, where two or three open explanations are reasonable and the 40-line constraint
that motivates single-open does not apply. **Either implement it or delete the union member** — an
API that offers something it cannot do is worse than one that does not offer it.

## 4 · Three contracts that disagree with their own implementations

**`aria-busy` is spelled two ways, and two hosts omit it for the documented default.**
`DataTable.jsx` and `Kanban.jsx` treat an omitted `state` as waiting — correct, since
`PendingAction.d.ts` declares `state?: "waiting" | "returned"` with *"`waiting` (default)"*. But
`ListRow.jsx` and `NextAction.jsx` (RecordCard) carry an extra guard:

```jsx
aria-busy={pending && pending.state && pending.state !== "returned" ? "true" : undefined}
```

With `state` omitted — **the default, and the form every example uses** — this short-circuits to
`undefined` and no `aria-busy` is emitted at all. Their own canonical examples in
`pending-and-progress.card.html` do exactly that.

**`MarketFormat` omits two members money mode depends on.** `MarketProvider.d.ts` declares
`MarketFormat` without `currencySymbol` or `symbolPosition`, while `format.js`'s `createFormat`
returns both and `NumberField.jsx` reads both. `useFormat(): MarketFormat` is the declared way to
reach them, so a typed consumer — or the next component that needs a symbol on a field — is told
those members do not exist. `MarketProvider.prompt.md` repeats the omission in its worked example.

**`AllocationMeter`'s `met` test has no epsilon.** An unrounded multi-tranche split that a rep
intends as 100% renders *"0% unallocated."* **plus a false "Generate is blocked" line.** Three
tranches of 33.33% is the ordinary case.

## 5 · There is no `@page` rule anywhere in the system

`tokens/print.css` has `:root{…}`, `[data-print="print-only"]{display:none}` and one `@media print`
block covering `html,body`, `*`, the `data-print` rules, `[data-print-chrome]`, `.hg-sheet`,
`.hg-sheet-stack`, `[data-keep-together]`, `thead`, `tfoot`, `h1,h2,h3,p` and `a`.

**No `@page`. No `size`. No `margin: 0`.** `tokens/base.css` has no `@media print` at all, and
`readme.md` names `print.css` as *"the system's only `@media print` block"*, so there is nowhere
else it could live.

Both `print.css` and law 14 assert the payoff — *"One sheet, one page. The cut is computed in JS and
emitted as explicit sheets, so the browser has nothing left to decide."* Without `@page { size:
<paper>; margin: 0 }` the browser applies its own default page size and margins, so a sheet sized
to A4 lands inside a smaller printable area and either shrinks or breaks — **which is the one thing
the whole measure-then-emit architecture exists to prevent.**

`MS8-02` also requires paper size to be consistent across every drawing sheet, and paper size is
`@page`'s job.

---

## Deliverables

Same conventions: `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md`, and the cards updated so the
changed parts render with real content.

> **Do not judge for yourself which files teach a behaviour.** For each item, **search the whole
> project for the old form** — the literal string, number or prop you just replaced — and paste
> every file that still contains it. Fix them and search again until the list is empty. Include the
> unused half of a file. If a search comes back empty, say so — that is the evidence, not the claim.

**Every numeric claim in this message was computed from your source, not asserted.** Please return
the same way: for §1 the measured ratio of every semantic mark; for §2 the arithmetic at 375px
after the change; for §4 what `aria-busy` emits at each of the four hosts with `state` omitted.

Tell me also:

- for **§3**, whether `ReorderList` moved to `aria-disabled` (round 14C's ruling) or solved it
  another way, and whether `mode="many"` was implemented or removed;
- for **§5**, the `@page` rule, and how paper size reaches it from `DrawingSheetGroup`.

If any item is already fixed since this read, say so plainly rather than redoing it.
