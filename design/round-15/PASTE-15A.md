Three items. Two are the last legs of things you have already largely built, and the third is a
sweep I should have asked for four rounds ago instead of feeding you one control at a time.

**Don't ask me how it should look.** The system owns that.

## Patterns already settled — compose with these, don't re-answer them

- **`Provenance`** — tier · standing · source · projection, via `renderProvenance` into the
  component's own `provenance` slot.
- **`ActivityStream`** — entries with `kind` and `actorClass`, filtered through `FilterSet`.
- **`ActionReason` / `ScopeNote`** — a precondition keeps the control and explains; a permission
  removes the act and names the holder.
- **`NamedGap`** — one value's honest absence, inline. **`UnavailableNote`** — a surface that was
  never going to have content.
- **`FieldOverride` / `ValueSource`** — a value that was overridden · which layer supplied one.
- **`--track-edge`** for a thin rail, **`--control-edge`** inline for a control.

## 1 · `standing` exists everywhere except the scope the law was written for

You built the standing axis and it is right: `confirmed | provisional | reported | pending`,
rendered ahead of the tier because *"this is not final"* outranks *"this is how it was worked
out"*. `UsageMeter`, `Charts`, `StatCard`, `Block` and `ChartFrame` all take it, and `readme.md`
law 3 documents it.

**Every one of those scopes is a container.** `DataTable` takes standing table-wide or per
**column** — `ColumnTier` reads only `column.provenance`, and the row loop is
`{c.render ? c.render(r) : r[c.key]}` with no provenance path at all. `StatCard`, `Block`,
`ChartFrame` and `UsageMeter` each qualify one figure or one frame.

The law it was built for is **per record**:

> `M11-42` (P0): *"Money the tenant's account confirmed and money a person says arrived are
> visibly different things, **on every surface**… The product never drops the distinction to make
> a screen tidier."*

`Provenance.prompt.md` states the case itself — *"`M11-42` — the payments ledger, both kinds on
one screen"* — and demonstrates it with two figures side by side:

```jsx
<Provenance standing="confirmed" tier="measured" source="Razorpay settlement" />
<Provenance standing="reported"  tier="assumed"  source="Recorded by Priya Sharma" />
```

**But those two are not in a `DataTable` or a `RecordCard` in that demo — they are a hand-built
`div`.** The table demo can only manage a column-wide
`{key:"amount", …, provenance:{tier:"estimated", standing:"provisional"}}`, which brands **every**
row provisional. So the payments ledger — the one screen the axis exists for — cannot put a
confirmed row next to a reported row.

The route today is writing `render:` markup per cell and inventing your own adjacency, which is
what `StatCard`'s own rule forbids: *"A tier renders in the component's own `provenance` slot… It
never goes in `children`… putting the tier there would give every screen a different adjacency."*

**You already built the shape of the answer this round.** `column.gap(row)` is a per-row function
on a column, and `rowActions(row, { stacked })` is another. A per-row provenance resolver would be
the same idea, and it needs to reach the stacked card and `RecordCard` too, since `M11-42` says
*on every surface* and the ledger is read on a phone.

## 2 · The actor class covers the stream — not the task, which is where the law bites hardest

`ActivityStream`'s `actorClass` — `person | agent | system | customer`, each stating its class in
words with a distinct glyph — closes the stream half of this properly. `SCR-M02-04`, `SCR-M08-02`
and the timeline half of `SCR-M07-04` are done.

**The other half is an act, not an entry**, and it is on the sales rep's home screen:

> `M07-03` (P0), `SCR-M07-01`: *"Agent activity is a separate block, **never mixed with the rep's
> own tasks**… **each entry marked as the agent's**"* — and the brief states the reason outright:
> *"Blurring that line is how people stop trusting the automation."*
>
> `M07-06`: *"a rep always sees **WHY a task exists**"* — rule-created versus person-created.
>
> `SCR-M07-13`, state `rep-corrected`: **the rep's read must be visibly the rep's while the
> agent's original stays in history.**
>
> `SCR-M07-04`, state `auto-resurfaced-postponed`: a human reopen and an automatic resurface must
> be distinguishable.

A task is not a stream entry. It sits in a task list or a `NextAction`, it has no `at` and no
`kind`, and it is a thing to be **done** rather than a thing that **happened**. `NextAction` today
has no attribution slot at all.

So the question is whether `actorClass` lifts out of `ActivityStream` into something a task row can
carry as well — one vocabulary, two hosts — or whether a task's *"why does this exist"* is a
different fact that only looks similar. I lean to the first, because `M07-03`'s reason is about
trust in the automation generally, not about one surface. But you have the vocabulary in hand and
should say which.

One thing to preserve either way: `SCR-M07-13`'s `rep-corrected` needs **both** readings visible —
the rep's correction as the current value *and* the agent's original still in history. That is
closer to `FieldOverride`'s superseded-value shape than to a glyph.

## 3 · One exhaustive touch-target sweep, instead of me finding them one at a time

This is the item I owe you. The 44px floor has now been "fixed" four times and each round finds
more sites:

| round | sites found |
|---|---|
| 12 | `Kanban.MoveControls`, `Banner` dismiss, `Menu` trigger, `DataTable` selection-bar clear |
| 13C | `Menu.d.ts` still documenting 32px |
| 14A | `BannerAction` |
| 14C | `Breadcrumb`, and then `SegmentedControl` + `ToastHost` while searching for something else |

**Eight sites, found by grepping `minHeight: 32` and by accident.** That method finds controls that
happen to spell their height that way and misses every other spelling — a `height` without a
`minHeight`, a padding-derived box, a `<span>` with a click handler, an icon with no box at all.
`SegmentedControl`'s segment was missed for exactly that reason: **it has no `minHeight`.**

And `Breadcrumb` proved the second failure: I told you *"32px with a negative-margin pad is the
shape of a correct answer"*, and you measured **47×32 and 48×32**. A negative margin borrows
layout space — **it does not enlarge a hit box.** So presence of the `FilterBar` treatment is not
evidence the treatment works.

**What I want instead:** enumerate every interactive element in the system — anything with an
`onClick`, an `onChange`, a `role` of `button`/`tab`/`switch`/`menuitem`/`option`/`checkbox`/
`radio`, a native `<button>`/`<a href>`/`<input>`/`<select>`, and anything else a finger lands on —
and **measure** each rendered hit box. Report a table: component, element, measured w×h, verdict.

Three things to get right in the sweep:

- **Measure the hit box, not the visible box.** They are allowed to differ; `FilterBar` is the
  reference — *"callers get the floor for free and cannot opt out of it."*
- **`readme.md`'s exception is narrow and it is the only one**: *"a pointer-only affordance
  **inside a data row** (the call / message buttons in a leads table)."* The templates'
  `RowActions` qualify. Everything else does not, and `BannerAction` is the proof — a banner is a
  phone surface and its own docstring names *"Pay now"*.
- **`rowActions(row, { stacked })` changed what the exception means.** On the stacked card the
  control is no longer pointer-only, so it must be 44. You built that; the sweep should confirm it
  holds at both call sites.

Then write the result down so this is the last time: state the floor, the one exception and its
boundary in `readme.md`, and say how a new component is meant to satisfy it. `N2`, `F7-29` and
`F7-32` are all P0, and this is a product whose primary user is holding a phone on a roof.

---

## Deliverables

Same conventions as every round: `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` with realistic
Indian solar content, and the cards updated so the changed parts render with real content.

> **Do not judge for yourself which files teach a behaviour.** For each item, **search the whole
> project for the old form** — the literal string or prop you just replaced — and paste the list
> of every file that still contains it. Fix every one, then search again until the list is empty.
>
> Search all of it: `.jsx`, `.d.ts`, `.prompt.md`, every `*.card.html`, everything under
> `templates/`, `readme.md`, `SKILL.md`, `_ds_manifest.json`. **Include the unused half of a
> file.** If a search comes back empty, say so — that is the evidence, not the claim.

Tell me:

- for **§1**, how a single row carries its own standing, on the desktop table, the stacked card
  and `RecordCard`;
- for **§2**, whether `actorClass` lifts out of `ActivityStream` or a task's attribution is its own
  fact, and how `rep-corrected` shows both readings;
- for **§3**, the measured table — every interactive element, its hit box, and its verdict — plus
  what you changed and where the floor and its one exception are now written down.

If any item is already fixed since my read, say so plainly rather than redoing it.
