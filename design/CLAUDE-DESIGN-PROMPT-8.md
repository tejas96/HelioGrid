# Prompt for Claude Design — round eight: four lines, then we're done

Paste into the **HelioGrid Design System** chat. This is the last design-system round.

---

All eleven landed and I verified every one. `--text-inverse` was a good addition, and its comment —
*"Always fully opaque — an alpha white composites down and drops under the floor"* — encodes the
lesson from the FilterBar bug so it can't recur. The MARK vs `-text` law is now stated in
`readme.md` where contributors will actually see it.

Four small things left. None is a contrast failure; all four are pre-existing rather than anything
you just introduced. I'd like them closed so the token contract is genuinely clean and neither of
us has to sweep for this again.

## 1–3. Three literal `#fff` in `components/data/FilterBar.jsx`

`FilterChips`, `ScopeToggle` and `SortPills` each set their active label with
`color: active ? "#fff" : "var(--text-secondary)"`.

The contrast is fine — white is 5.41:1 on `--accent` and 19.79:1 on `--action-primary`. This is
purely off-contract: `--text-inverse` now exists for exactly this, and the count *right next to
the label* was converted to it while the label beside it stayed on raw hex. The same file now
spells the same colour two ways.

Swap all three to `var(--text-inverse)`.

## 4. The meta separator in `components/data/NextAction.jsx`

In `RecordCard`, the middot between meta items renders as live text in `--text-disabled`:

```jsx
{i > 0 && <span style={{ color: "var(--text-disabled)" }}>·</span>}
```

`--text-disabled` is `#C7CAD0` — **1.64:1 on white, 1.53:1 on canvas**. The token's own comment
reserves it for inactive controls and says "never words a user must read", and this isn't strictly
a word, so it sits in a grey area rather than being a clear N4 breach.

But it is doing structural work: it's what separates "Nashik" from "8.2 kWp" on every record card
in the product, and at 1.53:1 on the canvas it is very close to invisible. A separator should be
quiet, not absent.

**Non-text elements that carry meaning need 3:1.** Please give it a colour that clears that
against both backgrounds — quieter than `--text-tertiary` (5.11), which would make it as loud as
the text it separates, but well above where it is now. The value is yours; if you'd rather solve it
with spacing or a different separator device than a middot, that's a better answer than a darker
dot and I'd take it.

Whatever you choose, put the reasoning in the component's docs — a future contributor looking at a
lone separator colour has no way to know 3:1 was deliberate.

## That's the end of it

After this the design system is closed for the screen run. From here, changes should be **additive
only** — a new optional prop, a new component, a bug fix inside existing behaviour. No renames, no
removals, no changed defaults, because 152 screens will be drawn against it and a behaviour change
mid-run silently invalidates everything already designed.

Tell me the new values so I can verify, and thank you — the contrast failure was yours to catch and
you caught it in the first screen session, which is the best possible time.
