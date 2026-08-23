Five capabilities the studio's screens need that have **nothing to do with the 3D canvas** — the
canvas itself is a later round, after the existing POC is ported. These five sit around it: the
findings list, the score, the map, the checklist and the explanation beside a number.

Four of the five are also needed outside the studio, which is why they are worth settling now
rather than with the drawing surface.

**Don't ask me how it should look.** The system owns that.

## Patterns already settled — compose with these, don't re-answer them

- **`Banner` / `BannerStack`** — ranks by precedence and can suppress. **§1 is the opposite
  instrument.**
- **`StatCard`** — `deltaDir` (up/down/flat) plus `deltaSentiment` (good/bad/neutral) with a word
  as the non-colour channel. **§2 is adjacent — read it there.**
- **`MapSurface`** — four honest states, overlay slot, 44px controls. **§3 is its interaction.**
- **`ReorderList`** — an authored list a person edits. **`ActorClass`** — person / agent / system /
  customer, in words plus a glyph.
- **`Provenance`** — tier · standing · source · projection, persistent beside the number.
  **§5 is the long-form relative.**
- **`ComplianceFloor`** · **`ActionReason`** · **`NamedGap`** · **`Transcript`**.

## 1 · A gate that must list every failure, built on an instrument designed to suppress

Nine screens across two blocks need one shape, and block 8 cleared it as *"one actioned banner per
failure"*.

> `M06-23` (P0), `SCR-M06-02` — the row is titled *"The Generate gate — one checklist, one
> place"*. State `generate-failure-list`: *"'Fix N issues to share': **every failure a tappable
> jump** landing on the exact step with failing fields highlighted; back returns to the remaining
> failures; **the gate is idempotent**."*
>
> Data volume, refusing the easy case outright: *"must be designed at **multiple simultaneous
> failures spanning the checklist's six check families (a)–(f) plus the below-cost warning** — not
> just the 'Fix 2 issues' happy case."*
>
> `MS6-27`, `SCR-MS-08`: *"every issue card is **tap-to-locate**; unstrung-panel and MPPT-capacity
> cards carry an inline **'Auto-string now'**."*
>
> `M05-58`: *"Each checked item shows status (ready / needs attention / blocking), **its meaning in
> plain language**, and a jump button to the fixing step."*
>
> `MS11-07`: *"four ordered items… each with the step that can fix it, three statuses, and **a
> worst-of verdict**."*

**`BannerStack` is built to rank and suppress**: `mode: "single"` is *"the broadest true fact
speaks"* and `max` caps the rest. An instrument that can hide a true blocking failure cannot be the
one that promises to list every failure. Seven stacked tinted strips is also not a counted
checklist.

`Timeline` is the nearest structure and misreads the set — its rail is *"lit to the current step"*,
and a severity-ranked list of findings has no current step.

Four things to carry: **a count that is the whole** (*"Fix 5 issues"* where five is five, not five
after ranking); **an action per finding that goes to the thing at fault**; **sometimes a second,
inline one-tap fix** (*"Auto-string now"*); and **a worst-of verdict across the set**, since
`MS11-07` reads the whole list as one answer.

## 2 · A score with a band, where two briefs say "coloured" out loud

The same shape is law on six screens:

> `M05-06`, `SCR-MS-03`: *"Design Health: a score /100 with **band Good / Fair / Poor**."*
>
> `M05-40`, `SCR-MS-07`: *"live DC/AC ratio health — >1.35 high (clipping risk), <0.90 low
> (oversized), 0.90–1.35 healthy."*
>
> `M05-48`, `SCR-MS-08`: *"running cold-weather string voltage **coloured** over-limit /
> under-MPPT-floor / fine."*
>
> `M05-64`, `SCR-MS-11`: *"The MAXIMUM SYSTEM VOLTAGE compliance box is prominent… within =
> passing, over = fault + 'shorten the string'. **It is the figure an electrical inspector checks
> and must read as such**"* — with `MS8-11` adding *"with **pass/fail styling**"*.

**The two rows that say "coloured" and "styling" are exactly why `F7-12` has to be satisfied by a
component rather than by six designers.** Status is never colour alone — always a label plus a
mark.

Live, `StatCardProps` is `{label, value, unit, delta, deltaDir, deltaSentiment, children, style}`,
where `delta` is *"delta chip text, e.g. '12%'"* — **a change against a previous value, not a
band.** `readme.md` refuses `UsageMeter` for this job explicitly. Nothing in the system pairs a
figure with the band it lands in.

**Read `deltaSentiment` before you build.** 14C gave `StatCard` a good/bad/neutral axis rendered as
a **word** plus a tint — which is structurally what a band verdict is. The differences: a band is
**named** (*"Good"*, *"Fair"*, *"Poor"*, *"Healthy"*, *"Passing"*), it is **absolute rather than
relative to a previous value**, and there are **more than three** of them on some of these screens.
Say whether the band generalises `deltaSentiment` or is its own axis — but do not ship two
unrelated ways for a figure to carry a verdict word.

`M05-64`'s inspector case adds one more: the fault state carries **a remedy** (*"shorten the
string"*), not just a verdict.

## 3 · The one screen `MapSurface` actually serves, and it cannot place a pin

Earlier passes read `MapSurface` only as a candidate for the drawing canvas. This is the screen it
was built for.

> `MS1-16` (P0), `SCR-MS-04`: *"Pin interaction: pointer users keep drag-map-under-fixed-pin with
> the 'Drag map to adjust' pill; **touch adds tap-to-place (pin jumps) and direct pin drag**."*
>
> `MS1-18`: *"Confirm Location (**disabled until a pin pends**)"* — so **a pending pin and a
> confirmed pin are different things on the surface.**
>
> `MS1-15`: *"satellite, **zoom 20 on first pin**, user zoom preserved on re-centre."*
>
> `M05-16`: *"The imagery tile the design is traced on is **pinned at capture**: it never changes
> underneath the design."*

`MapSurfaceProps` in full: `children, height, radius, markers, route, geofences, accuracy, state,
emptyTitle, emptyMessage, tilesTitle, tilesMessage, errorTitle, errorMessage, onRetry, controls,
onZoomIn, onZoomOut, onRecenter, overlay, attribution, style`.

**There is no `onMapClick`, no `onPlace` and no `onPinMove`.** `MapMarker` is
`{id, x, y, tone, live, lastSeen, label, onClick}` — `onClick` only, no `draggable`, no drag
callback, no pending/confirmed state. And `live`/`lastSeen` are **field-workforce semantics**
(*"live positions pulse and are filled; last-known are hollow rings"*), not pin confirmation —
borrowing them would say something false.

The zoom controls are three bare callbacks with **no level in or out**, so *"zoom 20 on first pin,
user zoom preserved on re-centre"* cannot be expressed either.

Note the touch/pointer split is a census directive, not a preference: pointer keeps
drag-map-under-fixed-pin, **touch adds** tap-to-place and direct drag. Both, not one.

## 4 · A checklist a coordinator ticks off on a roof

> `M05-76`, `SCR-MS-17`: *"Progress indicator + '**done of total steps**'; each step a **tick-off
> item** (number, title, detail, materials needed; **tap toggles done, remembered**); **phase
> headings**; Print."*
>
> `MS11-35`: *"step-count progress **with its meaning stated**; ticks **persist per project (not
> device-local)** and carry attribution — **who ticked**, optional 'done by'."*
>
> `MS11-30`: *"phase headings that **do not repeat misleadingly**."*
>
> `MS10-10`: a compliance checklist *"with live evidence links where the design can prove an
> item."*

Live: `Checkbox` is `{checked, onChange, label, disabled, id}` — no item structure, no detail line,
no materials list, no attribution. `Timeline` has close to the right **fields** and **no toggle on
any item**: it reports what already happened rather than letting a coordinator tick one off.
`ProgressBar` is `{value, gradient}`, so *"12 of 47 steps done"* has nowhere to live.

Three things to carry. **Attribution is `ActorClass`'s job** — *"who ticked"* is the same fact
`ActivityStream` and `NextAction` already render, so use it rather than a second person-glyph.
**Ticks persist per project, not per device**, so a tick is a server write, which makes
`PendingAction` the right treatment while it confirms. And **this checklist is one of the non-drawing
documents the print surface must serve** — `SCR-MS-17` lists Print as an action, so it has to
survive §1 of the previous send.

## 5 · A number that has to explain itself, where the system has ruled out the only carrier

> `MS10-19`, `SCR-MS-12`: *"**Derivation explanations are readable on touch and by screen readers —
> not tooltip-only**."*
>
> `M05-72`: *"derivation explanation (**the formula in words**)"* — a per-line field of the
> 11-column BOM.
>
> `MS7-22`, `SCR-MS-10`: *"**model boundaries stated in the surfaces that use it**, not only in
> code."*
>
> `MS6-47`, `SCR-MS-09`: *"per-kind assemblies and quantities marked ASSUMED… with the **'nominal —
> engineer to confirm'** note."*
>
> `MS12-09`, `SCR-MS-03`: *"a **provenance footer explaining how the total is computed**."*

`Tooltip.d.ts` rules itself out: *"Never the only place a piece of information exists — **touch
users will not see it**."* And `F8-07` closes it again wherever a number is involved.

**The system has ruled out the carrier and offers no replacement.** `Accordion` is section-level
and cannot attach to a cell or a figure. `hint` / `helper` on `Slider`, `NumberField`, `Input` and
`Select` are single strings **on form controls only** — with no disclosure, and nothing available
on a **read-only computed value**, which is what every one of these is.

`Provenance` is the near relative and deliberately short: tier, standing, source, projection —
persistent, one line, beside the number. This is the **long-form** version: a formula in words, an
assumption, a boundary, an exclusion. Say how the two relate, and where the line is — a caller
should not have to guess whether *"PVGIS, 2020–2023 average"* is a `source` or an explanation.

One constraint worth naming: `M05-72` puts this on **a per-line field of a 40-line BOM**, so
whatever the disclosure is, forty of them on one surface must not become forty open panels.

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

- for **§1**, the findings component, how the count stays the whole, and how the worst-of verdict
  is computed;
- for **§2**, whether the band generalises `deltaSentiment` or is its own axis, and where the
  remedy sits;
- for **§3**, the placement API, how pending differs from confirmed, and how zoom level is
  expressed;
- for **§4**, the item shape, how attribution reuses `ActorClass`, and what a tick shows while the
  server confirms;
- for **§5**, how the long-form explanation relates to `Provenance`, and what forty of them on one
  BOM look like.

If any item is already fixed since my read, say so plainly rather than redoing it.
