Five defects across CRM, projects and payments. Four of the five are the same subject seen from
different angles: **the product does work that takes time, and the surfaces have no honest way to
show it happening.**

**Don't ask me how it should look.** The system owns that.

## Patterns already settled — compose with these, don't re-answer them

- **`SurfaceState`** — `ready | loading | empty | error | unavailable`, on every stateful surface.
  It is **whole-surface**; §1 below is per-row, which is a different scope.
- **`EditorSurface`** — owns a responsive switch by measuring the layer it mounts into. **§5 needs
  that measurement exposed.**
- **`AppShell` / `AppHeader` / `MobileTopBar`** — the permanent chrome. **§2 may need a slot in
  it.**
- **`TimeField`** — *"a time outside `min`/`max` is refused with the window named, never
  clamped."* **§3 is that pattern applied to money.**
- **`FilterSet` / `FacetChips`**, **`NamedGap`**, **`ActionReason`**, **`ValueSource`**.

## 1 · A row cannot say "this is being done" — only "done" or "not"

`F8-36` is the law behind all of this: the product *"does not silently queue, partially apply, or
display an optimistic result."* So when a tap has left the device and not yet been confirmed, the
row has to say exactly that.

> `M02-67` (P0), `SCR-M02-02`: *"until it confirms, the row shows the action **in progress, never
> as done**… the pending treatment is **light and in-row, never a blocking overlay or a spinner
> wall** (`F4-27`)"* — with `M02-24`'s three-second budget still binding and `assign-waiting`
> requiring **the row stay operable**.
>
> `SCR-M08-01`: *"`move-waiting-server` — the move waits visibly until it reaches the server."*
>
> `SCR-M02-06`: *"Merge completes on the server and is **never applied on a device**."*

Verified across all four row and card forms:

| form | per-row state available |
|---|---|
| `DataTable` | `isRowMuted` only — `opacity: 0.55`, which reads **done-and-inactive**, not busy |
| `ListRow` | none |
| `RecordCard` | `muted` only |
| `Kanban` | `onMove` is fire-and-forget, no card-level state |

The nearest affordance is `Button`'s `loading`, and it fails three ways: it **replaces the label
with a spinner**, deleting the name of the act being awaited; it is per-button, not per-row; and on
the phone it lives inside the row actions.

Note the tension to resolve rather than dodge: the row must be **visibly pending and still
operable**. A treatment that dims or disables the row solves the first and breaks the second, and
`assign-waiting` names the second explicitly.

And the failure case is part of the ask: *"a failure that returns it, naming the reason."* The
row goes back to what it was and says why — it does not silently revert, and it does not become an
error surface.

## 2 · Work you can walk away from has nowhere to live

> `M02-21` (P0), `SCR-M02-05`: *"The import runs as a **background job with visible progress** and
> a failure report… **The person who started it may leave the screen**; progress is visible while
> it runs and the finished import produces a report naming every rejected row and why."*
>
> `importing-progress`: *"the person may leave and return to progress or the finished report; **a
> connection drop mid-import continues server-side** and the person is told where it got to."*

`ProgressBar.d.ts` in full is `value?: number`, `gradient?: boolean`, `style` — under a docstring
that names this exact use: *"6px pill progress track; accent fill, or brand gradient for AI /
**long-running operations**."* It gives those operations **no label, no determinate/indeterminate
distinction, no "n of m", no stage, no cancel and no destination.**

Nothing else covers it either: `Toast` auto-dismisses (*"older ones drop rather than piling up"*),
`Banner` is *"a statement of a fact about what's on screen"* — and this work is precisely **not**
on screen — `UsageMeter` is walled off as billing-only, and `Dropzone`'s `progress` is
upload-specific.

**So the one thing `M02-21` promises — that you can walk away — has nowhere to live.** There is no
tray, no chip, no shell slot for work happening elsewhere. You now own the shell, which is where
this probably belongs.

The studio needs the same thing with a different emphasis: `MS2-38`'s detection *"narrates three
steps"*, `M05-45` shows *"Computing solar access… X%"*, and `MS6-10`'s heatmap is **cancellable**.
So the component needs a **stage narration** and a **cancel**, not just a percentage — and the
cancel has to be honest about whether the server work actually stops.

Two shapes, and they may be one component or two: **a computation you are watching** (stages,
cancel, in place) and **a job you left** (persistent, reachable, has a destination). Say which you
built and why.

## 3 · A wrong payment amount must be refused, and `NumberField` clamps

> `SCR-M11-03`, state `Amount-non-positive-refused`: *"save is **refused** with the constraint
> stated in place, no entry is created, and the refusal names the honest path — **a wrong amount
> is not edited and not typed negative, it is recorded and then reversed**."*

`NumberField` documents the opposite:

> *"Commits once on blur or Enter; empty or invalid never commits (the last good value is
> restored); **a clamped value says so rather than snapping silently**."*

Clamp-and-announce is not refuse-and-name-the-reversal. The difference matters because of what a
payment is: an amount is a **record of something that happened**, so a clamp writes a figure the
person did not type into a ledger. `M11-42`'s whole point is that the ledger says what actually
occurred.

**The system already does this correctly one component over.** `readme.md` on `TimeField`: *"a
time outside `min`/`max` is **refused with the window named, never clamped**."* That is the
pattern; money needs it, not a new idea.

Three more things `NumberField` lacks for this job: **no currency affordance** — `unit` is a
trailing string, and the amount here is *"defaulted to the tranche's outstanding, always
editable"*, so it is a real tenant-currency amount; **`step` and stepper buttons are the wrong
grammar** for a payment; and `Input` explicitly disclaims the job — *"numeric entry with clamping
and correction **belongs to `NumberField`**."*

Check before building: the market pack landed currency and grouping some rounds ago, so
`NumberField` may already have the currency half. Say what is there before adding to it.

## 4 · The capture screen cannot show the two things the law requires it to show

> `M11-37` (P0), `SCR-M11-03`: *"A photograph captured in the field is held and uploaded when the
> connection returns, **with its waiting count and a retry shown on the capture screen itself**
> (`F4-21`) — but the money entry is a server write."*

`Dropzone` has the acknowledgement and not the capability:

```ts
/** These photos are held on the device and upload once there's a connection.
    The one place in the product where anything is kept back. */
heldOnDevice?: boolean;
```

alongside `state`, `errorMessage`, per-file `progress` and batch `progress`. **There is no waiting
count and no `onRetry` anywhere on the component.** The one prop that acknowledges the held queue
is a bare boolean — so the two things `M11-37` requires the capture screen to show are exactly the
two things the capture component cannot show.

Worth carrying: `F4-21` is *"nothing captured is unrecoverable"*, and this is the **only** place in
the product where anything is held back — the docstring says so itself. That makes the count a
promise being kept, not a status line. A surveyor on a roof with no signal needs to see that their
eleven photos still exist.

## 5 · `Kanban`'s phone form is nine columns stacked, and the brief asked for one

> `M08-10` (P0), `SCR-M08-01`: *"Desktop shows the full board; **mobile shows one column with a
> stage filter**"* — named states `mobile-single-column-filter` / `mobile-single-column`.

`Kanban.jsx`:

```js
const stacked = own !== null && own < stackBelow;
…
flexDirection: stacked ? "column" : "row"
```

over `columns.map(…)`. So every one of the nine stage columns renders full width, one after
another — **at the ruled 200-project volume that is the entire portfolio in one scroll.** The
prop's own doc sells it as the phone answer: *"own-width px below which columns stack vertically
instead of scrolling sideways."*

**And the screen cannot fix this itself.** A caller could pass a single column with a filter above
it — but `Kanban` measures its own width with a private `ResizeObserver` and exposes neither the
measurement nor a callback, so the screen cannot know *when* to switch without duplicating the
observer. The component owns the breakpoint and answers it wrongly.

You solved the general version of this in `EditorSurface`, which measures its own layer and
switches form. This is the same shape with a different pair of forms, and the filter should be
`FacetChips` / `FilterSet` rather than a private one.

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

- for **§1**, how a row is visibly pending **and still operable**, and what a failure returns it to;
- for **§2**, whether watched computation and left-behind job are one component or two, where a
  left job lives in the shell, and what cancel actually stops;
- for **§3**, what `NumberField` already had, and how refusal names the reversal path;
- for **§4**, where the waiting count and retry sit on the capture surface;
- for **§5**, what `Kanban` exposes now, and what the phone form is.

If any item is already fixed since my read, say so plainly rather than redoing it.
