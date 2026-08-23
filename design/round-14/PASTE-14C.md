Three defects, all landing on block 2 and all recurring far beyond it. Each is the kind that gets
improvised once and then copied across twenty screens, which is why they belong in the system.

**Don't ask me how it should look.**

## Patterns already settled — compose with these, don't re-answer them

- **`MarkRow` / the `marks` slot** carries facts that must stay separately readable; `meta` stays
  one line of text.
- **`ValueSource`** says which layer supplied a value; **`FieldOverride`** says one was overridden.
- **`ChipGroup`**, **`FilterSet`**, **`EditorSurface`**, **`PreviewFrame`** all shipped last round.
- **`renderProvenance`** into the component's own `provenance` slot.
- **`StatusChip`** is a lifecycle state a record *is*; **`Chip`** is a tag a record *has*.

## 1 · Five components can be disabled and not one can say why

Sixteen P0 rows across eleven screens ask for the same sentence in the same place, and the system
has five `disabled` flags and **no reason slot anywhere**: `Button` (`disabled?: boolean` and
nothing else), `MenuItem.disabled`, `SelectOption.disabled`, `IconButton.disabled`,
`OptionCardItem.disabled`.

It splits into two shapes, and they want different answers.

**The permission half — the act is absent, and the screen says whose act it is.**

> `M12-56`, `SCR-M12-02`: *"the state is visible, the acts are not; **the screen says whose act it
> is**"* (state `non-owner-read-only`).
>
> `SCR-M11-02`'s reader-read-only: *"**every act that writes money is absent**… The screen says
> whose act the absent ones are rather than hiding the money it is showing."*
>
> Plus `SCR-M02-06`'s `scope-blocked` (*"merge is unavailable **and says why**"*) and
> `SCR-SHELL-06`'s `no-amounts-for-employees`.

Note what this is *not*: it is not a greyed button. The act is **gone**, and something on the
screen names whose it is. A disabled control would still advertise a capability the reader does
not have.

**The precondition half — the control is there, disabled, with the reason beside it.**

> `MS4-15`, `SCR-MS-07`: *"when unavailable the control **STATES THE REASON** ('draw a roof first'
> / 'choose a panel first')."*
>
> `MS8-07`: *"disabled with a stated reason until panel + inverter + enabled panels exist."*
> `M05-53`: *"options taller than clearance unavailable **with a reason**."*
> `MS2-21`: *"disabled options **explain WHY inline**."*
> `MS4-20`: *"phase-incompatible units carry **a badge stating why they cannot serve this
> site**."*

Three routes are already ruled out, so please do not take them:

- **`Tooltip`** — its own doc says *"Never the only place a piece of information exists — touch
  users will not see it"*, and `F8-07` closes it again wherever a number is involved.
- **`OptionCardItem.description`** — that is the option's *standing* explanation. Overloading it
  silently changes what a description means on every other option in the group.
- **`Banner`** — per-surface, not per-action. A banner cannot say which of four buttons it means.

## 2 · An absent value has no honest rendering, and four modules forbid the em-dash

Four P0 rows in four modules ask for the same thing in almost the same words:

> `M02-03`: *"the missing fields are shown as **named gaps** on the record — 'no name yet', 'no
> city yet'… **nothing is invented to fill a gap**."* (States `gaps-on-save`, `field-gaps`.)
>
> `M08-21`: *"its absence is **shown as absence** rather than as an empty date."*
>
> `M08-16`, via `SCR-M08-02`'s `empty-blocks-say-so`: *"blocks with nothing in them say so ('No
> blockers — nothing is waiting on anyone') rather than disappearing."*
>
> `M11-15`: *"an absent schedule renders as absent… it does not invent rows, distribute the
> payable evenly, back-fill a template, or show a projection where an amount owed belongs."*
>
> `MS7-14` adds: *"no undefined placeholders."*

Live, there is no shared answer. `EmptyState` is a centred full-surface bloom — the right thing for
an empty screen, the wrong scale for a header field or a table cell. `StatCard`'s `value` is
`string | number`, so the honest absence has to be typed as literal text on every screen that needs
it. `DatePicker`'s `placeholder` covers the date case only. **Seven screens, four modules, and
every one of them improvises.**

The distinction that makes this worth a component: **an em-dash says "nothing here"; these rows
require the product to say *what* is missing.** "—" and "no city yet" are not the same statement,
and `M02-03` is explicit that the second is required. A lead captured from a phone call routinely
has neither a name nor a city, and the record still has to be honest about which.

Worth deciding while you are here: whether a named absence is also the thing a *provenance tier*
attaches to, or whether an absent value has no tier by definition. `M05-52` already establishes
that a deliberate absence of a marker is itself meaningful, so the two ideas touch.

## 3 · A rising overdue total renders green

`StatCard.d.ts` documents `deltaDir?: "up" | "down"`, and `StatCard.jsx` resolves direction **as**
sentiment:

```js
const good = deltaDir === "up";
…
background: good ? "var(--success-bg)" : "var(--danger-bg)",
color:      good ? "var(--success-text)" : "var(--danger-text)"
```

with a matching arrow path.

`SCR-M13-01`, the owner's home screen, puts these on one surface:

| figure | row | up means |
|---|---|---|
| won/signed value vs last period | `M13-14` | good |
| the overdue total | `M13-16` | **bad** |
| payments overdue | `M13-15` | **bad** |
| leads unassigned past 24 hours | `M13-15` | **bad** |

**Roughly half the figures on the owner's home screen are ones where up is bad.** As typed, a
rising overdue total renders green with an up arrow and reads as success; overdue *falling* renders
red. That is the dashboard telling an owner the opposite of the truth, on the screen they check
first.

Direction and sentiment are two facts. The caller knows both; the component can only infer one, and
it infers wrong half the time.

Two things to carry. `F7-12` means the good/bad reading may not be **colour alone** — so whatever
sentiment resolves to needs a second channel, the same way `StatusChip` and `Provenance` do. And
there is a third case the current type cannot express at all: a delta of **zero**, or one where
neither direction is good or bad — a headcount, a version number, a period with no change. `up`
and `down` have no room for "neither".

## 4 · The four you flagged in 14A and 14B — yes to all, with a ruling on each

You raised these instead of silently widening scope, which was the right call every time. Take
them now, while the mechanism for each is fresh.

**(a) `AudioPlayer`'s 4px scrubber — yes, do it.** Same thin-track invisibility `Slider` had, and
you already established the answer: `--track-edge`'s outset hairline, not `--control-edge`'s inset.
It needs the same span restructure because its track comes from
`::-webkit-slider-runnable-track`, the vendor pseudo you probed and found reporting
`box-shadow: none` — and you were right that a legibility rule must not rest on it.

Worth knowing why this is not cosmetic: `AudioPlayer` carries the call recordings on `SCR-M07-13`
and `SCR-M07-19`, and `M07-38` requires a rep to be able to reach a specific moment in a call. A
scrubber whose track is invisible in sunlight is a control you cannot aim.

**(b) `Breadcrumb`'s 32px crumb — measure first, then decide.** You described it as *"32px with a
negative-margin pad"*, which is the shape of a **correct** answer, not a broken one — it is exactly
`FilterBar`'s *"the target and the visible pill are two different rectangles"* treatment. So the
question is only whether the pad actually reaches 44.

Report the measured hit area. If it is 44, leave the control alone and instead make the intent
explicit in `Breadcrumb.d.ts` the way `FilterBar` does, so the next 44px sweep does not re-flag it.
If it is under 44, fix it like `BannerAction`.

**(c) One pass over every card viewport — yes.** You corrected four in 14A (field-mode 1380, blocks
1660, forms-composites 1420, provenance 2100) and left `preview-frame`'s 2206-in-900 because it
predates this round. Fixing them as they are noticed means the next round finds four more.

Go through every `@dsCard` once: measure rendered content height, set the viewport to fit. Report
the list of what you changed and what was already right. A card whose content is cut off is a
specification nobody can read to the end.

**(d) `Dropzone`'s invisible tab stop — yes, fix it.** You flagged a `role="button"` div containing
a focusable visually-hidden file input: two tab stops, one of them invisible. You were right that
it is not an instance of `RecordCard`'s nesting problem — but it is the same family, and it is the
worse of the two for the person it affects.

A sighted mouse user never meets it. A keyboard user tabs, lands on something with no visible
focus ring, and has no way to know where they are. `readme.md`'s own rule — *"Nothing is
hover-only, anywhere"* — exists for the same reason: an affordance a person cannot perceive is not
an affordance.

The conventional shape is the input as the real control with the visible surface as its label, so
there is exactly one tab stop and the focus ring lands on the thing the eye is on. Take whichever
route matches what you just did for `RecordCard`, and say which.

`Dropzone` carries `M01-40`'s datasheet upload and `M11-37`'s payment-proof capture, so it is on
both a settings screen and a field surface.

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

For §3 specifically: `deltaDir` is live in the templates and the cards, so this is an API change
with existing callers. Say what happens to a caller that passes only `deltaDir` today.

Tell me:

- for **§1**, whether the absent-act half and the disabled-with-reason half are one answer or two,
  and where the reason renders in each;
- for **§2**, where a named absence lives, how it differs from `EmptyState`, and whether it takes a
  provenance tier;
- for **§3**, how sentiment is expressed separately from direction, what the second non-colour
  channel is, and how "neither good nor bad" is said;
- for **§4**, the measured hit area of a `Breadcrumb` crumb, the full card-viewport list (what you
  changed and what was already right), and how many tab stops `Dropzone` has after the fix.

If any item is already fixed since my read, say so plainly rather than redoing it.
