> ## ▶ NOT YET SENT — the first of two rounds that unblock the design run
>
> Verified against the live HelioGrid Design System (`c8aa4326-21bf-453a-8d11-749cc81dee12`) on
> 2026-08-16, by reading the `.jsx` and `.d.ts` of every component named below. All five gaps are
> real as of that read, and round ten did not touch any of them.
>
> **The design run cannot start until this lands.** Every one of the 99 V1 screens displays a
> number, and item 1 is a single default that all of them currently inherit wrongly.
>
> Round twelve follows with the shell, tokens and container gaps. Round thirteen with the canvas,
> the print surface and rich text.

# Prompt for Claude Design — round eleven: the number layer

Open the **HelioGrid Design System** project and paste everything below the line.

---

A full audit of all 99 screens in the launch scope, checked component by component against the
live project, found five gaps that share one subject: **what happens when this product puts a
number in front of a person.** They are the reason the design run has not started, so I would
like them closed as one coherent piece of work rather than five patches.

As always: **don't ask me how it should look.** The system owns that. What follows is what the
components must be able to express, and the product law that says so.

Some context on why this matters more here than it would elsewhere. HelioGrid sells solar to
homeowners and businesses. A number on one of these screens is a system size, a generation
estimate, a payback period, a rupee figure someone is about to commit to. The suite's honesty
foundation (`F8`) is unusually strict as a result, and it is strict in a specific way: it does not
merely ask for accuracy, it asks that **the reader can always see how much to trust the number
without doing anything.** Items 1 to 4 are all facets of that.

## 1 · A provenance tier is currently a coloured dot and a hover, which the product law forbids by name

This is the single most consequential item on the list, and the cheapest to fix.

`F8-01` (P0) puts a provenance tier — measured / derived / estimated / assumed — on **every**
user-visible number. `F8-07` (P0) then says exactly how it may appear:

> *"A tier, a source label, a staleness state or an honesty caveat renders as **persistent,
> legible content beside the number it qualifies** — not as a tooltip, not as a hover state, not
> as a colour difference alone, not as a footnote the reader must seek out."*

Live, in `components/data/DataTable.jsx`:

```jsx
function Tier({ tier, withLabel }) {
  const t = TIERS[tier];
  return (
    <span title={t[0]} …>
      <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: "50%", background: t[1] }} />
      {withLabel ? t[0] : <span style={{position:"absolute",width:1,height:1,clip:"rect(0 0 0 0)"}}>{t[0]}</span>}
    </span>
  );
}
```

Both call sites — the `<th>` and the stacked `<dt>` — render `<Tier tier={c.provenance} />` with
no `withLabel`. So the default, on every table in the product, is **a 5px colour dot plus a
`title` tooltip plus screen-reader-only text.** The visible carrier is colour; the readable
carrier is a hover. Those are two of the four things `F8-07` names. Most of these screens are read
on a phone, where `title` never fires at all.

It is not an implementation slip — `readme.md` states it as system law:

> *"3. **Provenance.** `DataTable` columns and every chart take a tier … **rendered as a muted dot
> with an accessible label**."*

Which the same readme contradicts a few lines away, where `Tooltip` *"by rule never holds
information that exists nowhere else, since a touch user will not see it."*

Two components already disagree with the law and are right: `ChartFrame` and `UsageMeter` both
render the word visibly. So there are already two answers shipping.

**What I need:** the visible word to be the default everywhere, the readme law corrected to match,
and the dot kept only as the second, non-colour channel `N6` asks for rather than as the carrier.
If a genuinely dense table cannot afford the word on every column, say so and propose where the
compression is legitimate — but the default must be the honest one, because a default is what 99
screens inherit.

## 2 · The tier vocabulary is a closed four-value enum, and three surfaces need words it does not contain

`ProvenanceTierName` is declared identically in `DataTable.d.ts`, `UsageMeter.d.ts` and
`Charts.d.ts`, with a hard-coded `TIERS` table in each `.jsx` and no override anywhere:

```ts
export type ProvenanceTierName = "measured" | "derived" | "estimated" | "assumed";
```

Four things break against that.

**(a) One screen forbids one of the four words.** `M12-34` rules that the usage screen uses plain
"actual usage" language and that *the provenance word "measured" is reserved for engineering and
survey data and does not appear on this screen.* `UsageMeter` was built for that screen, hard-codes
`measured: ["Measured", …]`, and renders `{tier[0]}` visibly — so on its own screen it can print
only the forbidden word or omit the tier and break `F8-01`.

**(b) Other surfaces need different vocabularies entirely.** The catalog (`M01-35`) needs
verified-datasheet / tenant-provided / representative. The studio's component picker (`MS4-07`,
P0) needs manufacturer-datasheet / installer-pricebook / tenant-provided, *with effective-from
where present*. None of the four canonical names says any of these.

**(c) The source label is a separate fact and `F8` keeps it separate on purpose.** The tier says
*how* a figure was arrived at; the source label says *what data* it came from. `M05-54` fixes the
copy verbatim — `"Real · PVGIS ({database})"` versus `"Built-in estimate ±10%"` — and adds *"never
silently switched"*. Losing either loses something the reader needs.

**(d) A projection carries its assumptions.** `F8-23` and `F5-37` require the projection label —
the 25-year horizon, the inflation assumption — as persistent adjacent content on every multi-year
financial figure.

And one case needs the *absence* to be deliberate: `M05-52` states that the geometric access
numbers carry **no** marker, and *"that absence is itself required."* So an open vocabulary must
still let a caller say "none, and that is correct" distinguishably from forgetting.

Live, the only free-text neighbour anywhere in the system is `ChartFrame`'s `note?: string` — one
string for an entire chart.

## 3 · There is no way to say a figure is provisional, or hand-recorded rather than confirmed

This is a second axis, orthogonal to the tier, and nothing in the system carries it. A derived
figure from a stale version is still *derived* — the tier does not change — and yet it must not be
shown as final.

Three modules ask for it in almost the same words:

> `M11-42` (P0): *"Money the tenant's account confirmed and money a person says arrived are
> visibly different things, on every surface… The product never drops the distinction to make a
> screen tidier."*
>
> `M06-41`: *"any money shown from a stale version renders provisional, never final"* — and the
> brief adds that this law *"rides every money render."*
>
> `F5-59` (P0): a figure that cannot be reconciled at display time renders *"provisional, never
> final, never nothing."*
>
> `M05-06`: while shading recalculates, Design Health *"shows a provisional state — it never
> presents a stale score as current"*, and `MS12-06` adds a neutral placeholder before any score
> exists.

Live, the state vocabulary everywhere is `"ready" | "loading" | "empty" | "error"`. `loading` means
*there is no value yet*. Nothing in the system means **"here is a value, and it is being
superseded."** The only near-carriers are colour and dimming — `isRowMuted` sets `opacity: 0.55` —
and `F7-12` forbids a state carried by colour alone.

Worth noticing: **the system already solved this for photographs.** `Image` has `staleAt`. Nothing
solved it for numbers.

## 4 · A number outside a table or a chart has nowhere to put its tier

`DataTable` columns, `ChartFrame` and `UsageMeter` each take a `provenance` prop. The entire forms
folder takes none — and neither does the one component whose whole purpose is a single headline
number.

```ts
StatCardProps    = { label, value: string|number, unit?, delta?, deltaDir?, children?, style? }
NumberFieldProps = { …, label, unit, hint, correctionMessage }      // every descriptive slot a string
SliderProps      = { …, hint }                                       // string
AccordionItem    = { …, meta?: string }                              // string
```

`StatCard.children` is a `ReactNode`, so a tier *can* be dropped in — but the slot is documented
*"e.g. a sparkline node bleeding to card edges"*, so its adjacency is unspecified and six blocks
will each answer it differently. That is the thing to avoid.

The tier is owed on **editable** values too, which is easy to miss. `MS1-01` requires that *"every
pre-filled field stays editable and carries a provenance hint ('from survey, {date}' / 'from
lead')"*. `SCR-M01-16`'s specification values were extracted from a supplier PDF by an engine and
are presented for correction — the person is editing an *estimated* number and must see that.

Two more needs in the same family, from the same audit: `SCR-M02-05` and `SCR-M01-17` have preview
counts that are **tappable** to see the rows behind them, and `StatCard` has no `onClick`; and
several of these headline figures need a freshness treatment, which is item 3.

## 5 · One currency and one grouping are baked in below the component layer

The product is India-first and **global-ready**: `F1` makes currency, grouping, date and time
formats *market-pack data*, and `F3-20`/`F3-22` route every render through a shared implementation.
`readme.md` instead fixes it as a content fundamental — *"currency in Indian grouping (₹4,52,471)"* —
and the components follow:

```js
Charts.jsx      export const inr = (n) => "₹" + Number(n).toLocaleString("en-IN", …)
Charts.jsx      const num = (n) => Number(n).toLocaleString("en-IN", …)   // the DEFAULT format
                                                                          // for all four chart types
UsageMeter.jsx  const fmt = (n) => Number(n).toLocaleString("en-IN")      // not a prop
DocumentPreview requires lineItems "pre-formatted in Indian grouping", and carries a `gstin` prop
TimeField       TimeString is "'HH:MM' on a 24-hour clock"
```

So even a non-money chart value is grouped `en-IN`, and a 12-hour market cannot render
`M06-16`'s "Time generated". `NumberField` has `unit?: string` — a trailing suffix — with no
currency, symbol-placement or grouping concept, so a tenant-currency amount cannot be **entered**
in its own format either.

`SCR-M12-01`, the public pricing page, is explicitly per-market: *"amounts render in the
tenant's/market's currency with the market's grouping."* Twenty-six V1 screens are affected.

**One nuance worth carrying:** `M06-07` establishes that even the *compact* form is pack data —
the source's "lakhs" figure is the IN pack's number format via `F1-46`, not a product fact. So
"compact a big number" is itself a market decision, not a styling one.

I am not asking you to build a market-pack system — that is the application's job. I am asking
that the components **take** their formats rather than baking them, and that the system ship one
place where a market's answer is supplied.

## Deliverables

Same conventions as every previous round: `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` with
realistic Indian solar content, and the group cards updated so the changed parts render with real
content. Where a law in `readme.md` is now wrong — item 1's provenance sentence at minimum, item
5's currency fundamental — correct the readme in the same pass.

When you're done, tell me:

- for **§1**, what the default is now, and anywhere you judged the compressed form legitimate;
- for **§2**, how a caller supplies its own vocabulary, how the source label and the projection
  label sit beside the tier, and how "deliberately no marker" is expressed;
- for **§3**, the name of the new axis and its values, and which components now carry it;
- for **§4**, the one adjacency rule for a tier on a non-table number, stated so six blocks
  cannot answer it six ways;
- for **§5**, what a component now takes instead of a baked format, and where a market supplies it.

If any of the five is already fixed since my read, say so plainly rather than redoing it — that
happened with round nine and cost a session.
