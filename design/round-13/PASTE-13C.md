Five smaller gaps, all landing on block 1. Each is the kind that gets improvised once and then
copied across twenty screens, which is why they are worth settling in the system.

**Don't ask me how it should look.**

## Patterns already settled — compose with these, don't re-answer them

The last two rounds fixed these. Anything below that needs one uses the existing answer:

- **An editor is `EditorSurface`** — it owns the sheet/panel switch by measuring the layer it
  mounts into, never the viewport. `FilterPanel` is already `FilterSet` inside one.
- **An overridden value is `FieldOverride`** — marker word, superseded value under a stale one,
  44px reset that names what it restores. Hosted by `NumberField`, `Input` and `column.override`.
- **A preview is `PreviewFrame`** hosting a real component as its subject — framed, scaled,
  non-interactive.
- **A provenance tier goes in the component's own `provenance` slot** via `renderProvenance`,
  never in `children` and never in a free-text `meta`. That last point matters for §1 below,
  which is entirely about slots typed as strings.
- **A control needing a field-mode edge reads `--control-edge` inline.**

## 1 · Several components take a string where a law needs a node, a mark or a second fact

One shape, six components; the failures differ only in what could not fit.

**(a) A collapsed section cannot show it is the broken one.** `M07-19` (P0): *"A knowledge base
that contradicts itself is **flagged on save**… before the agent can speak either"*, across eight
fixed sections. `Accordion.jsx` renders `{it.meta && <span style={{fontSize:12,color:
"var(--text-tertiary)"}}>{it.meta}</span>}` — one tertiary-grey string. No tone, no mark, no
`aria-invalid`, no way to force a section open. **This is the `Stepper` failure one component
over**: the system can refuse the save and then hide which of eight sections to fix. `Stepper` was
rebuilt for exactly this (`state: "errors"`, `errorCount` shown as "3 to fix"); `Accordion` was
not.

**(b) A section header cannot carry its done-state, its total and its action.** `M05-71` needs
*"name, 'N of M included', **own total**, and **Refresh-from-design**"*; `M06-27` needs
Selected/Empty per section, and `F7-12` requires a label **plus** a mark — `meta` is a string.

**(c) A menu cannot mark the current option.** `M13-10` (P0): *"the person **can switch** — a
switcher lists the home of every held preset"*, where `single-preset-trivial` only reads as
trivial if the one entry is visibly current. `MenuItem` has no selected or checked state; its
nearest slot is `meta?: string` — *"a shortcut, a count"*. **Every later picker — language,
tenant, saved view — copies whatever the shell does here.**

**(d) A phone row cannot carry two facts.** `SCR-M06-19`'s `design-survey-review-needed`: *"**Both
conditions can be true on the same row at once and must stay separately readable — two different
facts, never merged into one badge**"*, on rows that also carry a lifecycle status and a
provisional marker. `RecordCard` has one singular `chip` and `meta` as mono middot-joined parts.

**(e)** `Tabs` and `SegmentedControl` are `{value, label}` — no badge, count or per-item state.
`OptionCardGroup` has `description?: string`, no children slot and no current-plan marker, which
`M12` needs on the pricing page.

## 2 · A value cannot say *which layer* supplied it — only that it was overridden

**Most of this landed in the last round and I am not re-asking for it.** `FieldOverride` already
gives the marker word, the superseded value under a stale one, and a 44px reset that names what it
restores. That covers `MS10-13`'s stale-field pair — *"yours X · design now Y"* — completely.

What it does not cover is a **three-level** attribution, which is a different question.
`SCR-M01-15`'s state `rates-panel-tier-attribution`:

> *"the rates panel shows, per item, **which tier supplied each field** (platform value struck
> under an override, own-SKU values plain) so an owner can always answer **'why is this price
> showing'**."*

`M01-32` fixes the resolution order — **tenant override → tenant own item → platform item** — and
`M01-37` makes the override *sparse*, so *"an unset field falls through to the platform value"*.

So on one rates panel, three fields side by side can be: one overridden (two values, and
`FieldOverride` handles it), one supplied by the tenant's own SKU (**one value, and it is
theirs**), and one fallen through to the platform (**one value, and it is not theirs**).

The last two are the gap. Both render as a single plain number today and are indistinguishable,
yet the owner's question — *"why is this price showing"* — is answered differently for each.
`FieldOverride` cannot express them because nothing was superseded.

Decide whether this is a third state on `FieldOverride` or a separate attribution slot, and say
which. It recurs wherever a tenant overrides a platform default, so it is not local to the
catalog.

## 3 · An authored list cannot be reordered

`M06-12` (P0):

> *"**Step 6 · Project Timeline: reorderable phase rows (⌃ / ⌄ arrows, 🗑 delete)**, each with
> Title \* (char count) + Description \* (char count) · ↺ Reset to System Default · ＋ Add Step"*

with the context line *"fully workable at 375 px (D2, F7-30) — **reordering must work with
touch**"*, and `reordering` as a named screen state. `M01-52` authors the same list in settings
and the builder consumes it, so **both need the same answer**.

Live: no component in the 54 reorders a list within itself. `Timeline` is display-only with no
callbacks; `Kanban`'s `onMove(id, toColumnKey, fromColumnKey)` carries **no index** and is
documented *"Enables drag **between columns**"*; `DataTable`'s `sortable` is a view order, not an
authored one.

Nothing owns the move affordance, its 44×44 targets, **what happens to focus after a row moves**,
or **what is announced when the order changes**. The sibling editable-row groups — `SCR-M06-09`'s
tranche rows, `SCR-M06-10`'s brand rows — will copy whatever gets improvised here.

## 4 · A cell holding several chips has no defined behaviour

`F2-10` (P0): *"The team list shows **all** roles a person holds as chips"*, at a data volume of
*"each person may carry **several of the twelve preset chips at once** plus a status and a
last-active value."*

`M01-34`: *"every picker and search result badges compliance per those schemes"* — several badges
per row — and *"An empty scheme set means no badges, **never an error**."*

Live: `Chip` and `Badge` are single pills with no grouping, no cap and no overflow. The only
grouped-token export is `AvatarGroup`, and it takes **people, not labels**. `DataTable` has no
per-cell wrap or truncation rule and stacks to one card per record below 640px of its own width,
so **a cell holding up to twelve role chips has no defined behaviour at either size.**

## 5 · A user-supplied document has nowhere to be read

`M01-40` (P0): *"Upload a manufacturer datasheet; the product extracts the typed spec fields…
and presents them **for review and correction before the item is created**"*, with the state
`pdf-extraction-review` — *"extracted fields shown in the same typed form as manual entry, each
field editable, **with the datasheet preview alongside**"* — at a data volume of *"every extracted
field for that component kind **alongside the PDF**."*

Live: `Dropzone` shows a supplied file only as `DropzoneFile.url` for a thumbnail;
`Image`/`ImageFrame`/`Thumbnail` are documented for *"every **photograph** in the product"*;
`DocumentPreview` draws the tenant's own generated output. **Nothing renders a user-supplied
source document for reading.**

This is distinct from the paged-document gap, which is about *producing* page geometry. Here the
product must show back a file the user handed it, so a reviewer can check an extraction against
its source — side by side with the form, on a phone as well as a desktop.

## Deliverables for 13C

Same conventions, and the standing instruction:

> **Do this before you report an item done — it is the step that has failed every round so far.**
>
> Do not judge for yourself which files teach a behaviour. **Search the whole project for the old
> form** — the literal string, prop name or law sentence you just replaced — and paste the list of
> every file that still contains it. Then fix every one and search again until the list is empty.
>
> Search **all** of it, not just `components/`: `.jsx`, `.d.ts`, `.prompt.md`, every
> `*.card.html`, everything under `templates/`, `readme.md`, `SKILL.md` and `_ds_manifest.json`.
> **Include the unused half of a file** — a `Desktop()` that never renders is still copied by
> whoever opens the file, and that exact case is what broke the last round.
>
> A component whose own example still shows the old form has not landed. If a search comes back
> empty, say so — that is the evidence, not the claim.

Tell me, per item, what changed and what you deliberately left alone. Specifically:

- **§1** — whether these six are one shared change or six local ones, and why;
- **§2** — whether the superseded-value treatment is the same one as 13B §3's override, or
  deliberately different;
- **§3** — what is announced on reorder and where focus goes;
- **§4** — the overflow rule, and what a cell of twelve chips does at 375px;
- **§5** — whether this is one component with `Image`, or its own.

If any item is already fixed since my read, say so plainly rather than redoing it.
