Twenty-four numbered laws now live in `readme.md`, plus the unnumbered ones — the governing rule,
the two border exceptions, the 44px floor and its four shapes, the contrast floor, the
marks-versus-words rule, the 12px type floor, the market-pack rule.

They were added over eleven sessions, and **no session has ever read the whole list end to end.**
Each round checked its own law against its own component. A law added in round 16 that contradicts
one added in round 14 passes every one of those checks and is still wrong.

Someone just read all of it against itself. **Eleven conflicts.** One of them will make a screen
author ship the wrong control.

**Don't ask me how it should look.** These are all statements of fact about the system, and the fix
is to make them true.

## 1 · ⚠ Law 9 states its own ruling backwards

This is the one that costs a screen.

`readme.md` law 9:

> *"Hosts: `ReorderList.lockOf` and `DateSet`'s pack origin. **The refusal is at the delete, not at
> the save** — a 44px control whose only outcome is a refusal is a control that lies, and on a 375px
> screen a save-time bounce lands far from the row that caused it (law 5) — and `refusal` exists
> anyway because the delete button is **not the only route to removal**."*

**Both reasons it gives argue against the claim it makes.** A refusing control lies; a save-time
bounce lands far from the row — those are arguments for the control being **absent**, which is what
you actually built.

`ComplianceFloor.d.ts` says the opposite outright:

> *"`line` is **persistent**, on the row or date it is about, and **neutral** — a floor is not a
> fault and is true before anyone touches anything; **it is why the delete control is not rendered
> at all**. `refusal` is `floor-blocked-save`."*

`SKILL.md` follows the component. And **readme's own `DateSet` index entry, two paragraphs earlier,
also follows the component**: *"a tenant row has a 44px delete, a pack row has none and carries a
`ComplianceFloor` in its place."*

So the law contradicts the component, the skill file, and itself. A screen author drawing
`SCR-M07-05` or `SCR-M07-06` from law 9 **ships a delete button whose only outcome is a refusal —
the exact control the same sentence calls a lie.**

## 2 · Law 1 says every surface takes the five states. Three do not.

Law 1: *"`ready | loading | empty | error | unavailable` — one vocabulary, on every surface, with
`SurfaceState` and one renderer (`UnavailableNote`) to keep it that way."* Its whole point is that
private spellings folded in — `MapSurface`'s `tiles-unavailable` gone, `AudioPlayer`'s `status`
union gone. `UnavailableNote.d.ts` repeats it: *"Every surface in the system takes this union, so
nobody spells the fourth state privately again."*

- `EditorSurface.d.ts`: `state?: "ready" | "loading" | "error"` — a private three-member union, no
  `empty`, no `unavailable`, and the file never imports `SurfaceState`.
- `Sheet.d.ts`: the same.
- `Block.d.ts`: re-declares the full union **locally** as `BlockState` rather than importing it.

The first two are the exact failure law 1 was written to end, in the overlay layer. The third is
harmless today and drifts the moment the union changes.

## 3 · `CompareGrid` is 2–N in the law and 2–4 everywhere else

Law 19 says it twice — *"`CompareGrid` compares **2–N** whole options a reader is choosing between"*
— and readme's `VersionDiff` index entry repeats it.

Everything else says 2–4: readme's own `CompareGrid` index entry (*"**2–4 options** compared
attribute by attribute at every width"*), `CompareGrid.d.ts` on `options` (*"The columns — **2 to 4
options**, and the snap rendering holds four"*), its docstring headline, and `SKILL.md`.

`M05-79` asks for 2–4 and its volume note says the snap rendering must hold four. **2–4 is right;
the law is wrong.** Note 17A also corrects this component's 375px arithmetic, so take both together.

## 4 · Law 4's headline is false of a component in the system

Law 4 opens absolutely: *"There is no horizontally-scrolling table in this system."* Three
paragraphs later it exempts one — `CompareGrid` *"is **not an exception to this law; it is outside
its subject**… it is the **one** component in the system with a horizontal scroller."*

That reasoning is sound and I do not want it changed. But `CompareGrid.d.ts` confirms it renders a
real `<table>` with a horizontal scroller, so **the headline sentence is literally false and is
only repaired later.** `SKILL.md` carries only the absolute half — *"a table becomes cards rather
than scrolling sideways"* — so a reader of the skill file never meets the exemption at all.

State the boundary **in the headline**, so the law is true where it is read.

## 5 · The 44px floor has one exception in `SKILL.md` and three in `readme.md`

`SKILL.md`: *"**The single exception** is a pointer-only affordance inside a `<table>` data row
whose act repeats at full size elsewhere."*

`readme.md` names three carve-outs:

1. that table-row affordance;
2. *"an inline `<a>` inside a run of prose (`RichTextView`'s customer-facing terms) — a word in a
   sentence; boxing it to 44px would break the line"*;
3. two measured facts stated rather than fixed — `RangeField`'s two 22px thumbs (two 44px thumbs on
   one span cannot be separated at the same value) and a desktop-only card layout squeezed to 390px.

All three are defensible. **`SKILL.md` is the consumer-facing file**, so its version is the one a
new component author reads — and it tells them two legitimate cases are violations.

## 6 · Law 24 forbids a state the component ships

Law 24: *"`DerivationGroup` is **single-open**, so opening the fortieth closes the thirty-ninth and
**at most one panel exists at a time** — there is no `openAll`."* `SKILL.md` repeats it.

`Derivation.d.ts` ships `mode?: "single" | "many"`. **`many` produces exactly the forty-open-panels
state law 24 calls impossible.** The law is true about the name — `openAll` really is absent — and
false about the invariant.

**17A asks you to implement `many` or delete it.** If you delete it, law 24 becomes true as
written. If you implement it, the law has to say when many is legitimate — `SCR-MS-10`'s
model-boundary panel and `SCR-MS-03`'s provenance footer are the cases, and the forty-line
constraint does not apply there. Either way, **resolve it in one place, not two.**

## 7 · Law 16 renamed a prop to end a collision that still exists

Law 16: *"`DataTable.total` was the **pager's record count** (`rowCount` now)"*, and
`DataTable.d.ts` explains why — *"it was called `total` while `total` was also the obvious name for
the one row forty lines add up to."*

Good rename. But `total` now means **three different things** and no law arbitrates:

| where | what `total` means |
|---|---|
| `MoneySummary` / `DataTable.totalRow` | the sum of the lines |
| `Accordion.total` | *"a figure this section owns (`M05-71`'s own total)"* |
| `AllocationMeter.total` | *"the figure, when the caller has already summed it"* — the sum of the parts, **not** the denominator |

The last is the sharp one: on a meter, `total` reading as *the sum of the parts* rather than *the
target* is exactly the wrong way round for a reader skimming the type.

## 8 · Three smaller ones

**Law 3's slot rule has a stale position.** It says the tier goes *"beside `meta`, **before the
chevron**"*. `Accordion.d.ts`: *"**The chevron leads** rather than trails."* With a leading chevron,
"before the chevron" is the far left of the header — the opposite end from `meta`. The `.d.ts` and
`.prompt.md` both say "beside the meta" correctly; **readme is the only file that is wrong**, and
it is the file this rule was written into.

**Law 11's arithmetic.** *"The mark is a 22×3px travelling segment (**the 6px operation rail at one
sixth scale**)."* 3px is the 6px rail at **one half** thickness, and there is no 132px rail for 22
to be a sixth of. The dimension is right; the parenthetical is a wrong number stated as a
derivation, in a readme whose other figures are exact to the digit.

**Law 20 versus `readyMode`.** Law 20: *"The single fold reaches **ready items only**, and even
folded they stay **counted in the header and reachable behind a real control**."* `FindingList.d.ts`
offers three modes — `collapsed` (documented as counted and reachable), `listed`, and **`counted`**,
whose name says counted and whose docs promise no control. The law's guarantee is scoped to
findings that need work, so `counted` may well be legitimate — but the law says it does not exist.

## 9 · And the framing sentence

`readme.md` line 155, introducing the numbered list:

> *"**Sixteen laws** are built into all of them (the first eight were v2's; laws 9–16 arrived with
> the rounds after it, and 14–16 with the print surface):"*

**The list immediately below runs 1 through 24.** Laws 17–24 — free navigation, `AllocationMeter`,
`VersionDiff`, `FindingList`, `BandedFigure`, `MapSurface` placement, `Checklist`, `Derivation` —
were added after that sentence and it was never updated. A reader who trusts the framing stops at
16 and never learns eight laws exist.

---

## Deliverables

Correct `readme.md` and `SKILL.md`. Where a law and a component disagree, **decide which is right
before you edit** — several of these are the law being wrong about a good component, and one (law 1)
is the law being right about three components that did not follow it.

> **Search the whole project for each old form** and paste every file that still contains it. Fix
> them and search again until empty. Include `SKILL.md`, every `.prompt.md`, every `*.card.html`
> and the templates — a law restated in a spec card is still a law being taught.

Tell me:

- for **§1**, what law 9 reads now, and confirm it matches `ComplianceFloor.d.ts` and `SKILL.md`;
- for **§2**, whether `EditorSurface`, `Sheet` and `Block` now import `SurfaceState`, and if any
  legitimately should not, why;
- for **§6**, whether `many` was implemented or deleted, and what law 24 says as a result;
- for **§7**, whether `total` was disambiguated by renaming or by a stated rule;
- **the final law count**, and confirmation that `SKILL.md` and `readme.md` now agree — the
  verification flagged them as disagreeing, and `SKILL.md` is the file a new component author reads.

One request beyond the list: **when you are done, read the whole law list once more, end to end, as
a single document.** Every conflict above survived because nobody had. If two laws still argue,
say so rather than leaving it for the next pass.
