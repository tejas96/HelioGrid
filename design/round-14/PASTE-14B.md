Four capabilities that block 2 needs — the billing and plan screens — and that the system cannot
express. Three of the four are inherited well beyond billing, which is why they are worth settling
here rather than on the first screen that trips over them.

**One of these is a live bug that prints a wrong number at full confidence.** It is §1, and I
would take it first.

**Don't ask me how it should look.** What follows is what the components must be able to do, and
the product law that says so.

## Patterns already settled — compose with these, don't re-answer them

- **`EditorSurface`** owns the sheet/panel switch by measuring its own layer, never the viewport.
- **`FilterSet`** is the one filter body; `FacetChips` holds several values at once; `FilterPanel`
  is `FilterSet` inside an `EditorSurface`. **§3 below needs filtering — use these.**
- **`MarkRow` / the `marks` slot** carries facts that must stay separately readable.
- **`ChipGroup`** is several chips with count-based overflow.
- **`renderProvenance`** into the component's own `provenance` slot.

## 1 · ⚠ "Unavailable" is not a state — and `UsageMeter` invents a rate because of it

Two halves of one hole. The second half is shipping a wrong number today.

### (a) There is no fourth state, and the system has patched around it twice

The state vocabulary everywhere is `"ready" | "loading" | "empty" | "error"`. Four screens need a
fifth idea that is none of those:

> `M05-18` (P0), `SCR-MS-04`: *"Site Intelligence is an asynchronous enhancement with **four
> honest states — loading / unavailable / unreachable / ok** — and never a dependency… **its
> absence is stated, not styled as an error**."*
>
> `SCR-MS-09`: *"an access result that cannot be produced renders as **unavailable rather than as
> a plausible tint**."*
>
> Plus `SCR-MS-05`'s `detection-denied-honest`, and `MS4-09`'s market that declares no schemes.

The system has hit this wall twice and patched it **privately** each time: `MapSurface` added a
fifth member `"tiles-unavailable"`, `AudioPlayer` added
`status?: "available" | "consent-declined" | "purged-retention"`. Neither is reusable, and a third
component will invent a third spelling.

An error says *something went wrong*. Unavailable says *this was never going to be here, and that
is fine* — a different sentence, a different tone, and no retry.

### (b) Two containers have no base states, and one of them prints a fabricated figure

`readme.md`'s own first law: *"Every composite ships loading, empty and error states — no surface
is allowed to have only a happy path."* `Card` has no `state`. `StatCard` has no `state`.

**`UsageMeter` is the serious one.** Its union is billing-only —
`"ok" | "overage-accruing" | "tracked-seats-accruing" | "cap-reached-grace" | "creations-paused"`
— with **no loading and no error**, against a brief that rules exactly those two:

> `SCR-M12-04`: *"loading: rollups not yet resolved; **never a placeholder number presented as a
> rollup**"* and *"error: this screen may only ever show the enforced/billed numbers, so **no
> fallback or approximate figures**."*

In `UsageMeter.jsx`, `limit = 0` by default and the markup renders unconditionally:

```jsx
<strong>{fmt(value)}</strong><span> of {fmt(limit)}{unit}</span>
```

So an unresolved meter renders **"0 of 0"** at full confidence. Worse, the no-rate case a previous
pass explicitly cleared prints **"1,240 of 0"**: `scaleMax = Math.max(limit, value) || 1` → value,
`usedPct` → 0, `overPct` → 100 — **drawing the entire bar as the info-blue overage segment against
a zero bundle.**

`BM-27` is the row that forbids precisely this: *"Usage transparency is law, not UX polish… the
same numbers, no smoothing."* The component built for that row is the one inventing the rate.

## 2 · A records list loses its actions, its dimming and its caption on a phone

`DataTable.jsx`, verified line by line:

```jsx
stacked ? <StackedRows rows={sorted} columns={columns} keyOf={keyOf}
            onRowClick={onRowClick} selectable={selectable} sel={sel} toggle={toggle} />
        : <table…>
```

`rowActions`, `isRowMuted` and `caption` are **never passed**, and `StackedRows`' signature does
not accept them. The `<caption>` element sits inside the `<table>`, which renders only when
`!stacked`.

So below 640px of its own width — every phone, **and every table inside a 480px `DetailPanel`** —
the assign and mark-junk taps, the ledger row's collect actions, the invoice row's PDF action, the
checklist row's upload/verify actions and the queued-entry cancel all disappear. So does the
caption, which `F7-27` requires on every data table, and whose prop doc (*"Overline caption above
the table"*) gives no hint that it vanishes.

What makes this a blocker rather than a defect is the screen it lands on:

> `M02-24` (P0), `SCR-M02-02`: *"Triage is one decision per lead — assign or bin — and the surface
> is built for **under three seconds each**… both decisions are **single-tap**"*, on a screen whose
> context of use is *"the owner's morning screen — often a phone over breakfast"*, and which
> explicitly refuses the escape route: *"Everything else about the lead waits for the lead
> detail."*
>
> `SCR-M07-01`: *"every row deep-links to its lead **and one tap starts the action** — call, open
> proposal, open visit"*, in a context of *"phone in hand, in the field, often one-handed."*

`F7-31` forbids a capability present at one viewport and absent at the other.

**The other documented phone form has its own version of the problem.** `readme.md`'s records
pattern says *"a list of `RecordCard`s… The card **is** the table row"*, and `RecordCard.jsx` wraps
the **whole card** in `role={onClick ? "button"}` with `tabIndex` and an Enter/Space handler, while
its `action` slot is documented *"Bottom line — usually a `NextAction`"* and rendered **with no
`stopPropagation`**. So a real button placed there is an interactive element nested inside a
`role="button"` — invalid, and on a tap it fires the row as well as the action.

Both phone forms need the answer, because `readme.md` offers both.

## 3 · The activity stream is a progress tracker wearing the wrong name

`M02-35` (P0), `SCR-M02-04`:

> *"One append-only timeline per lead and customer, rendered as a single stream. Its **kinds**
> include notes, logged calls, agent calls, stage changes, assignments, proposal events, link
> opens, survey submissions, design events, sign-off events, payments, documents, task events and
> system events; its **actor may be a person, the agent, the system or the customer**."*

Data volume: *"dozens to hundreds of append-only entries across 13+ kinds… **filtering by kind must
be usable at that depth**"* — a named state, `timeline-filtered`.

Three more screens need the same component: `SCR-M08-02` puts it **directly beneath** the nine-stage
stage timeline; `SCR-M12-02` needs it twice — *"a dunning history that can be long — the ladder runs
day 0/2/4/6/7 then post-halt weekly ×4 then monthly, **indefinitely**"* plus an append-only
subscription history; `SCR-M11-02` needs it for the reversal-pair history.

Live, `Timeline` is:

```ts
TimelineItem { id?, label, meta?, description?, actor?: string, content?,
               status?: "done"|"current"|"upcoming"|"blocked"|"failed" }
TimelineProps { items, variant, density, state, empty/error, onRetry }
```

No `kind`. No actor **class** — `actor` is a free string, so *"the agent"*, *"the system"* and
*"the customer"* are indistinguishable from a person. No filter, no date grouping, no load-more.

**`Timeline` is not wrong; it is a different component.** Its own docstring says so: *"A continuous
rail runs through the nodes — lit to the current step, dim beyond it — so it reads as **a sequence,
not a list of dots**."* In a 300-entry append-only stream every entry is `done` and the rail lights
nothing.

`SCR-M08-02` is the proof: it needs the stage timeline **and** the activity stream on one screen,
one directly beneath the other. They cannot be the same component.

Two things to carry. **The actor class is a product law, not a nicety** — `M07-03` states it as
*"blurring that line is how people stop trusting the automation"*, and `SCR-M07-04` requires *"the
design must distinguish a human reopen from an automatic resurface on the timeline."* And
**filtering already has an answer**: `FilterSet` / `FacetChips` shipped last round, so the
kind-filter should be those, not a new one.

## 4 · A comparison that stays a comparison at 375px — and the system law that forbids the obvious route

**This one needs a decision stated before it needs a component**, which is why I am flagging it
rather than just asking.

> `M05-79`, `SCR-MS-14`: *"Compare 2–4 variants side by side: kWp, annual generation, price,
> payback, health score… **Mobile renders horizontal snap cards (dual-breakpoint contract)**"* —
> and the brief's own framing: *"the row's dual-breakpoint contract makes the phone rendering
> (horizontal snap cards) **a first-class form, not a squeezed table**."* Volume note: *"the
> snap-card rendering must hold four cards."*
>
> `MS4-30`, `SCR-MS-07`: *"The **11 comparison columns**, each computed per candidate"*, with the
> current selection always included.

`DataTable` cannot do it: *"below `stackBelow` px of its own width it becomes **one card per
record**"* — one variant on screen at a time, which is exactly the form `M05-79` rules out. You
cannot compare payback across four variants by scrolling past them one at a time.

And the obvious alternative is prohibited at system level: **"There is no horizontally-scrolling
table in this system."**

I read the PRD as having already answered this: the brief calls the snap-card form *first-class,
not a squeezed table*, so it is **not a table** and the prohibition is not being bent — a distinct
comparison component is a legitimate reading, not an exception. But the decision has to be
**stated**, because a screen quietly opting out of a system-level law is how the law stops meaning
anything.

So: build the comparison surface, and write down explicitly why it does not violate the
no-horizontal-scroll rule — or tell me the rule needs a named exception instead. Either is fine.
Silence is not, because three studio screens plus the plan chooser (`SCR-M12-03`) all inherit
whatever happens here.

The hard part is the one the brief names: **attribute rows must stay aligned across options as the
reader moves between them.** A carousel of independent cards is not a comparison — the reader has
to be able to hold "payback" still and slide the variants past it.

---

## Deliverables

Same conventions. Plus the standing instruction:

> **Do not judge for yourself which files teach a behaviour.** For each item, **search the whole
> project for the old form** — the literal string or prop you just replaced — and paste the list
> of every file that still contains it. Fix every one, then search again until the list is empty.
>
> Search all of it: `.jsx`, `.d.ts`, `.prompt.md`, every `*.card.html`, everything under
> `templates/`, `readme.md`, `SKILL.md`, `_ds_manifest.json`. **Include the unused half of a
> file.** If a search comes back empty, say so — that is the evidence, not the claim.

Tell me:

- for **§1**, the name of the fourth state and how it differs from `error` in tone and in
  affordances; whether `MapSurface` and `AudioPlayer`'s private spellings now fold into it; and
  what an unresolved `UsageMeter` renders instead of "0 of 0";
- for **§2**, what `StackedRows` takes now, and how `RecordCard` lets an action be tapped without
  firing the row;
- for **§3**, the entry shape, the actor classes, how the kind filter is built from `FilterSet`,
  and what happens at 300 entries;
- for **§4**, the component, and the written reason it is not a horizontally-scrolling table —
  or the named exception, if that is the answer instead.

If any item is already fixed since my read, say so plainly rather than redoing it.
