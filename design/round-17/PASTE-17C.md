Two jobs. The first is the documentation drift the verification found — about thirty-four items,
each small, none of which I am going to transcribe because they are already written down in a form
you can work from. The second is the more important one: **the instruments this system built to
catch its own drift do not work, and that is why we are on the fifth cleanup round.**

**Don't ask me how it should look.** The system owns that.

## 1 · The instrument that was supposed to make this the last round

Round 15A built `guidelines/touch-targets.card.html` to end the 44px problem for good. It opens
every card and template in iframes at 1280 and 390, finds every element a finger lands on —
natives, ARIA roles, and any element with a React handler read off the live fibre — and measures
the rendered rect. When it ran it found **19 sites across 1,014 elements**, where four rounds of
grepping `minHeight: 32` had found 8.

It was the right idea and it is not working. Three reasons:

**(a) Its inventory is two hardcoded arrays.** `const CARDS = [...]` (49 entries) and
`const PHONE = [...]` (30). Round 15B already found it had gone stale and added four cards by hand.
It has gone stale again — **eleven Components-group cards are in neither list**, so their controls
have never been measured at any width:

```
pin-placement · banded-figure · checklist · derivation · money-summary · disclosure
generate-gate · pending-and-progress · money-and-held-photos · drawing-sheet · paged-document
```

Every one of those was built by rounds 15 and 16 — **the rounds that were writing in the
instrument.** They are the canonical specimens for `Checklist`'s tick, `FindingList`'s jump and fix
controls, `DrawingSheet`'s zoom, `MapSurface`'s tap-to-place, `PagedDocument`, `Disclosure`,
`MoneySummary`, `Derivation`, `BandedFigure` and the whole `PendingAction` / `JobTray` /
`OperationProgress` family.

**Make the inventory dynamic.** Read the card list from `_ds_manifest.json`, which the verification
confirmed is accurate — 73 card entries, 73 files, no orphans in either direction. A standing check
whose inventory is maintained by hand is a check that goes stale between the round that writes it
and the round after.

**(b) It persists nothing.** Its only output is `window.__tt = final;` and DOM. So *"19 sites across
1,014 elements on 65 surfaces"* is a number one session read off a screen once and typed into a
table. **It cannot be reproduced or diffed today.** Write the result somewhere the project keeps —
a JSON artefact the card reads on load and rewrites, or whatever the platform allows — so a later
round can ask *"what changed since?"* instead of *"what is it now?"*.

**(c) It has a bug.** `Appendix()` uses `class="lbl"` where JSX needs `className` — e.g.
`<p class="lbl" style={…}>`. React drops unknown DOM attributes, so those labels render unstyled.

Then **run it and give me the current numbers**: total elements, surfaces, and every failure with
its measured hit box. The last figure we have predates eleven new components.

## 2 · Do the cards actually render?

**Every round for seven rounds has closed with the same sentence** — *"cards render blank until
`_ds_bundle.js` recompiles at the end of this turn."* Those turns are all over, and nobody has ever
gone back to check. The verification could not either: the cards only execute inside the design app.

You can. **Open all 73 and tell me which are blank, throwing, or showing a stale component.**

Two are already suspect by static estimate and both are new:

| card | viewport | estimated content |
|---|---|---|
| `feedback/generate-gate.card.html` | 1240×900 | ~1200–1350px — a `FindingList` of 8 findings at 375px, each with a 2–4 line meaning, plus the pane beneath |
| `data/checklist.card.html` | 1240×900 | ~1250px — 7 items across 4 phases with materials chips and attribution, plus three more panes |

Round 14C raised 29 viewports of 51. Rounds 15 and 16 added roughly a dozen cards and nobody
re-measured. **Do the whole set once**: measure rendered content height against declared viewport,
report what you changed and what was already right. A card whose content is cut off is a
specification nobody can read to the end.

## 3 · The documentation drift — thirty-four items, and where they are written down

The verification returned, for each of the 48 gaps, the exact remainder in the words of the reader
who found it. That text is in this repository at `design/DESIGN-SYSTEM-GAPS.md`, one section per
gap, under the heading **"Still outstanding"**. It is more precise than anything I would retype.

Work from it directly:

```bash
grep -n "^#### Still outstanding" design/DESIGN-SYSTEM-GAPS.md
```

Each entry names the file, quotes the stale line, and says what the live code does instead. They
are overwhelmingly one-liners of three kinds:

- **a `.prompt.md` or `*.card.html` still showing a pre-fix example** — the failure that has
  produced every partial landing in this project;
- **a `.d.ts` doc comment describing behaviour the `.jsx` no longer has** — a stale position, a
  superseded default, a host list that names three where the law names four;
- **a claim in `readme.md` that its own component contradicts.**

Two that are worth calling out because they are the same shape as the ones that bit us hardest:

- **Gap 15** — *"the rendered examples still show the pre-fix picture."* The `DataTable` stacked-form
  fix landed and its specimens still draw the old one.
- **Gap 38** — the component's teaching surfaces name **three** hosts for `NamedGap` and the law
  names **four**. One of them is wrong and a screen author cannot tell which.

Note that **17A and 17B already cover the functional and law-level items**, so anything in the
register that those two messages address is done — skip it rather than doing it twice.

## 4 · Yes — strip the templates' own `@page` rules

You asked, and the answer is yes, take them out.

The three `templates/*/support.js` scaffolds each carry
`@media print { @page { margin: 0.5cm } }`. You are right that the injected rule lands later in the
head and wins today — and that is exactly the problem: **a template printing a `PagedDocument` is
relying on head order for a page-geometry rule.**

Head order is not a contract. It survives one bundler change, one `<style>` hoist, one day when a
scaffold happens to load last. And when it breaks it does not throw — it silently reintroduces a
0.5cm margin inside a sheet whose content box was computed for margin zero, so every sheet either
shrinks or spills, which is the failure the whole measure-then-emit architecture exists to make
impossible.

`page-size.js` is now the one owner of `@page`. Anything else declaring it is a second owner, and
two owners settled by ordering is the same class of bug as the last sheet to mount picking the
document's paper — the one you just designed `PageSizeOwnerContext` to prevent.

Strip all three. If a template genuinely needs a different paper, it should say so through
`PagedDocument`'s `paper` / `orientation` like everything else.

## 5 · The one thing that is not drifting, for contrast

`_ds_manifest.json` was checked hard and is accurate: 73 card entries against 73 files, 167
components across 98 source paths, every `.jsx` represented, zero entries pointing at a missing
file, 3 templates, 12 CSS paths. **No orphans in either direction.**

That is the standard the touch-target card and the card viewports have not met — and it is the
reason §1 should read its inventory from the manifest rather than keep its own.

One known mismatch remains and it is the compiler's, not yours: `"startingPoints": []` with eleven
`@startingPoint` tags across the `.d.ts` files producing nothing. Round 13A-2 probed it and
established the compiler owns that array. Leave it; I am recording it, not asking for it.

---

## Deliverables

Same conventions. For §3, no new components — this is correction only.

> **Search the whole project for each old form** and paste every file that still contains it. Fix
> them and search again until empty. Include the unused half of a file.

Tell me:

- for **§1**, where the inventory comes from now, where the results persist, and **the current
  measured numbers** — elements, surfaces, and every failing hit box;
- for **§2**, the list of cards that were blank, throwing or stale, and the full viewport table;
- for **§4**, confirmation the three scaffolds are clean and `page-size.js` is the only `@page` owner;
- for **§3**, the gaps you corrected and the ones you found were already right — I would rather know
  a remainder was stale than have it fixed twice.

And one judgement I would like from you rather than from me: **after §1 and §2, is there anything
else in this system that claims to be a standing check and is not?** The touch card claimed it and
was a one-off. The card viewports were never checked at all. If there is a third, it will be found
by the next cleanup round unless you find it now — and I would like this to be the last one.
