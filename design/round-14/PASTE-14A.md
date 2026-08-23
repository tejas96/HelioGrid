Six pieces of finishing work before the next block. None is a new capability — each is a thing
that landed in an earlier round with one leg missing, or a leftover I owe you an answer on.

**Don't ask me how it should look.** The system owns that.

## Patterns already settled — compose with these, don't re-answer them

Rounds 13A–13C settled these. Anything below that needs one uses the existing answer:

- **`EditorSurface`** owns the sheet/panel switch, measuring the layer it mounts into, never the
  viewport. `FilterPanel` is `FilterSet` inside one.
- **`FieldOverride`** is an overridden value; **`ValueSource`** is which layer supplied one.
- **`PreviewFrame`** hosts a real component as its subject.
- **`MarkRow` / the `marks` slot** carries facts that must stay separately readable; `meta` stays
  one line of text and never carries a mark, a tier or a total.
- **`ChipGroup`** is several chips with count-based overflow.
- **A provenance tier** goes in the component's own `provenance` slot via `renderProvenance`.
- **A control needing a field-mode edge reads `--control-edge` inline.**

## 1 · A market can replace every format except the one people mistype most

The market pack landed and it is good — currency, grouping, clock, compact form and the tax-ID
label are all pack data now. **Dates are not**, and dates are the format where getting it wrong is
worst: `03/04` is two different days in two markets and looks correct in both.

The pack already declares the formatter. `MarketProvider.d.ts`:

```ts
date: (value: string | Date) => string;
```

implemented in `format.js` as `Intl.DateTimeFormat(p.locale, { day:"numeric", month:"short", year:"numeric" })`.

**No component consumes it.** And the one component where a date is both rendered *and* entered
ignores the pack entirely — `DatePicker.jsx`:

```js
const MONTHS = ["January", "February", "March", …];
const DAYS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** 12 Mar 2026 — the product's date format. */
export function formatDate(v) { … return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`; }
```

There is no `useFormat` import in the file. English month names, day-month-year order and a Monday
week start (`const offset = (first.getDay() + 6) % 7;`) are all hardcoded, and `DatePicker.d.ts`
still calls it *"Formats a date or ISO string as '12 Mar 2026'"* with no mention of the pack.
`DocumentPreview` passes its date straight through as well — `docDate = "16 Aug 2026"` rendered as
`{docDate}` — rather than through `mkt.date`.

Three things to carry: the **month and day names** are language, not decoration; the **field
order** is a market fact; and the **first day of the week** is too — a Monday start is not
universal, and the calendar grid currently hardcodes it.

## 2 · One more control under the touch floor, and it is on a phone surface

The 44px sweep fixed `Kanban.MoveControls` and `Banner`'s dismiss, and the last round corrected
`Menu.d.ts`'s stale *"32px overflow button"* line in passing. **A fifth site was never in the
list.** `Banner.jsx`:

```jsx
/** Inline text action for a banner — "Take the new value", "Pay now". Never a filled button. */
export function BannerAction({ children, onClick, style = {} }) {
  return <button type="button" onClick={onClick}
    style={{ minHeight: 32, padding: "0 12px", … }}>
```

A 32px hit area with no expressed floor — no wrapper, no negative margin, nothing like
`FilterBar`'s *"the target and the visible pill are two different rectangles"* treatment.

`readme.md`'s one narrow exception is *"a pointer-only affordance **inside a data row** (the call
/ message buttons in a leads table)"*. `BannerAction` is neither: banners are a mobile surface, and
its own docstring names *"Pay now"* — a money act, on a phone. The genuinely exempt 32px controls,
the templates' `RowActions` call/message buttons, do qualify and should stay as they are.

## 3 · `Block` has a summary count in its docs and not in its API

`Block` landed with the overline, the title, the action and its three base states. The **summary
count** is the one part that only half-arrived. There is no `count` or `summary` prop anywhere in
`Block.jsx` or `Block.d.ts` — the only route is the generic node slot:

```ts
/** Beside the title — a `StatusChip`, a provider badge, a count. */
badge?: React.ReactNode;
```

So a caller *can* put a count there, and gets nothing for it: no numeric treatment, no
tabular-nums, no `"99+"` clamp, nothing analogous to `CountBadge`. And **every worked example in
`Block.prompt.md` and `blocks.card.html` fills `badge` with a `StatusChip`** — never a count. On a
dashboard of a dozen blocks, each showing "how many", twelve authors get twelve treatments.

`CountBadge` already solved the numeral. Decide whether `Block` reuses it or takes a count prop of
its own, and put a count in at least one worked example either way.

## 4 · `PreviewFrame` is `inert`, which contradicts what `inert` is for

I asked for the preview to be non-interactive, and you delivered `inert` + `pointer-events: none`,
"deliberately not `aria-hidden`" so a screen reader can still read it. **Those two intentions
fight**: `inert` removes its subtree from the accessibility tree as part of what the attribute
does, so not setting `aria-hidden` changes nothing — the content is hidden from assistive
technology either way.

This matters most on `SCR-M01-18`, where the preview **is the thing being judged**. A person
choosing their company's brand colour and letterhead needs to know what the preview shows. If it
is unreadable to a screen reader, that person cannot check their own branding — and every one of
the three settings screens has the same shape.

The last round drew the distinction correctly for `SourceDocument` — *"the inverse of
`PreviewFrame`: an inert picture versus a document you read"* — but `PreviewFrame` itself was not
revisited. Pick one deliberately:

- keep `inert`, and accept that the preview is a picture no screen reader enters — in which case
  something adjacent must describe what it currently shows; or
- drop `inert` for `pointer-events: none` plus `tabindex="-1"` on the focusables, so the content
  stays readable while nothing inside is reachable by tab.

Say which and why, and write the reason next to the attribute — this is exactly the kind of choice
that gets silently reversed later.

## 5 · `Slider`'s track has no field-mode edge

You flagged this yourself last round and you were right to: `Slider`'s unfilled track is
`--canvas-sunken` with only the thumb's accent ring to locate it, so in direct sun the track
disappears and the thumb floats.

You also named why the `Switch` answer does not transfer — **a 1.5px inset on a 6px track reads as
a filled track**, which would make an empty slider look full. That is a real constraint and it is
why this is its own item rather than a copy of the last fix.

`Slider` is the control `MS3-27`'s setback (0–3 m) and `MS4-*`'s tolerances use, all of them on a
phone, on a roof. Whatever you choose, it has to survive a track that is thinner than the edge.

## 6 · Confirm the specimens actually render

The last two rounds both closed with the same caveat — the new `@dsCard` cards render blank until
`_ds_bundle.js` recompiles at end of turn. That is now **nine or ten cards** across `EditorSurface`,
`FilterSet`/`FilterPanel`/`FacetChips`/`RangeField`, `FieldOverride`, `PreviewFrame`, `RichText`,
`MarkRow`, `ValueSource`, `ReorderList`, `ChipGroup` and `SourceDocument`.

Before anything else in this message: **open them and tell me they render.** A component whose
spec card is blank has no visible specification, and every one of those is a component the next
99 screens are supposed to be built from.

If any card is blank or throwing, fix it and say what was wrong.

---

## Deliverables

Same conventions as every round: `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` with realistic
Indian solar content, and the group cards updated so the changed parts render with real content.

> **Do not judge for yourself which files teach a behaviour.** For each item, **search the whole
> project for the old form** — the literal string or prop you just replaced — and paste the list
> of every file that still contains it. Fix every one, then search again until the list is empty.
>
> Search all of it: `.jsx`, `.d.ts`, `.prompt.md`, every `*.card.html`, everything under
> `templates/`, `readme.md`, `SKILL.md`, `_ds_manifest.json`. **Include the unused half of a
> file** — a `Desktop()` that never renders is still copied.
>
> If a search comes back empty, say so — that is the evidence, not the claim.

Tell me:

- for **§1**, what `DatePicker` takes from the pack now, and what the first-day-of-week rule is;
- for **§2**, the measured hit area of `BannerAction` after the change;
- for **§3**, whether `Block` reuses `CountBadge` or takes its own prop;
- for **§4**, which way you went on `inert` and where the reason is written down;
- for **§5**, how a 6px track shows an edge without reading as filled;
- for **§6**, the card list and whether each renders.

If any item is already fixed since my read, say so plainly rather than redoing it.
